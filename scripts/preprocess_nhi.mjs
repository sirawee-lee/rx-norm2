// Preprocess nhi_data.csv → public/nhi_drugs.json
// Keeps only currently active drugs (有效迄日 = 9991231), deduplicates by code
import { createReadStream } from 'fs'
import { writeFileSync, mkdirSync } from 'fs'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')
const INPUT = join(ROOT, 'public', 'nhi_data.csv')
const OUTPUT = join(ROOT, 'public', 'nhi_drugs.json')

// Minimal RFC-4180 CSV row parser (handles quoted fields)
function parseCsvRow(line) {
  const fields = []
  let inQ = false, cur = ''
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (c === ',' && !inQ) {
      fields.push(cur.trim()); cur = ''
    } else {
      cur += c
    }
  }
  fields.push(cur.trim())
  return fields
}

// Extract strength from ingredient string e.g. "QUETIAPINE (AS FUMARATE) 25 MG" → "25 MG"
function extractStrength(ingredient) {
  const m = ingredient.match(/(\d[\d.,]*\s*(?:MG|MCG|IU|G|ML|%|MG\/ML)[^\s,]*)/i)
  return m ? m[1].toUpperCase() : ''
}

// Clean ingredient: remove strength suffix for canonical name
function cleanIngredient(raw) {
  return raw
    .replace(/\s*\(.*?\)/g, '')          // remove parenthetical salts
    .replace(/\s+\d[\d.,]*\s*\w+$/i, '') // remove trailing dosage
    .replace(/\s+$/, '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

async function run() {
  console.log('Reading', INPUT)
  const rl = createInterface({ input: createReadStream(INPUT), crlfDelay: Infinity })

  let header = null
  const seen = new Set()
  const drugs = []
  let total = 0, active = 0

  for await (const line of rl) {
    if (!line.trim()) continue
    if (!header) { header = parseCsvRow(line); continue }
    total++

    const f = parseCsvRow(line)
    // Column indices (0-based):
    // 0:異動 1:藥品代號 2:藥品英文名稱 3:藥品中文名稱 4:成分
    // 5:規格量 6:規格單位 7:單複方 8:支付價 9:有效起日 10:有效迄日
    // 11:藥商 12:製造廠名稱 13:劑型 14:藥品分類 15:分類分組名稱
    // 16:ATC代碼 17:給付規定章節 ...
    const endDate = f[10]
    if (endDate !== '9991231') continue  // keep only currently active
    active++

    const id = f[1]
    if (seen.has(id)) continue
    seen.add(id)

    const ingredientRaw = f[4] || ''
    drugs.push({
      id:          id,
      nameEN:      f[2] || '',
      nameZH:      f[3] || '',
      ingredient:  cleanIngredient(ingredientRaw),
      strength:    extractStrength(ingredientRaw) || (f[5] && f[6] ? `${f[5]} ${f[6]}`.trim() : ''),
      price:       f[8] || '0',
      manufacturer: f[11] || '',
      form:        f[13] || '',
      atc:         f[16] || '',
    })
  }

  console.log(`Total rows: ${total}, Active: ${active}, Unique drugs: ${drugs.length}`)
  writeFileSync(OUTPUT, JSON.stringify(drugs))
  console.log(`Written → ${OUTPUT}`)
}

run().catch(err => { console.error(err); process.exit(1) })

// Build public/drug_images.json
// Downloads Taiwan FDA drug appearance dataset (InfoId=42) and maps NHI licIds → image URLs.
// Source: https://data.fda.gov.tw/data/opendata/export/42/csv (weekly sync from TFDA)
// Match key: licId.slice(2).padStart(6,'0') == numeric part of 許可證字號
// Run: node scripts/build_drug_images.mjs
import { createWriteStream, writeFileSync, unlinkSync, existsSync } from 'fs'
import { createReadStream } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { get as httpsGet } from 'https'
import { createInterface } from 'readline'
import { createUnzip } from 'zlib'
import { pipeline } from 'stream/promises'
import { PassThrough } from 'stream'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT   = join(__dir, '..')
const OUTPUT = join(ROOT, 'public', 'drug_images.json')
const TMP    = join(ROOT, 'data', '_appearance.zip')
const TMP_CSV= join(ROOT, 'data', '_appearance.csv')

const DOWNLOAD_URL = 'https://data.fda.gov.tw/data/opendata/export/42/csv'

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)
    httpsGet(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        download(res.headers.location, dest).then(resolve).catch(reject)
        return
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', reject)
  })
}

// Minimal RFC-4180 CSV row parser (handles quoted fields)
function parseCsvRow(line) {
  const fields = []
  let inQ = false, cur = ''
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (c === ',' && !inQ) { fields.push(cur.trim()); cur = '' }
    else cur += c
  }
  fields.push(cur.trim())
  return fields
}

async function extractCsvFromZip(zipPath, csvPath) {
  const { default: AdmZip } = await import('adm-zip').catch(() => null)
  if (AdmZip) {
    const zip = new AdmZip(zipPath)
    const entry = zip.getEntries()[0]
    writeFileSync(csvPath, entry.getData())
    return
  }
  // Fallback: unzip via system command
  const { execSync } = await import('child_process')
  execSync(`unzip -o "${zipPath}" -d "${dirname(csvPath)}"`)
  // Rename extracted file
  const { readdirSync, renameSync } = await import('fs')
  const files = readdirSync(dirname(csvPath)).filter(f => f.endsWith('.csv') && f !== '_appearance.csv')
  if (files.length) renameSync(join(dirname(csvPath), files[0]), csvPath)
}

async function run() {
  console.log('Downloading Taiwan FDA appearance dataset...')
  await download(DOWNLOAD_URL, TMP)
  console.log('Extracting CSV...')
  await extractCsvFromZip(TMP, TMP_CSV)

  console.log('Parsing appearance data...')
  const imgMap = new Map()
  const rl = createInterface({ input: createReadStream(TMP_CSV, 'utf8'), crlfDelay: Infinity })
  let firstLine = true
  for await (const line of rl) {
    if (!line.trim()) continue
    if (firstLine) { firstLine = false; continue } // skip header
    const f = parseCsvRow(line)
    const lic = f[0] || ''  // 許可證字號
    const img = f[11] || '' // 外觀圖檔連結
    if (!img.includes('mcp.fda.gov.tw')) continue
    const m = lic.match(/第(\d+)號/)
    if (!m) continue
    const num6 = m[1].padStart(6, '0')
    if (!imgMap.has(num6)) imgMap.set(num6, img)
  }
  console.log(`Parsed ${imgMap.size} appearance records with images`)

  console.log('Matching against NHI drug list...')
  const { createRequire } = await import('module')
  const require = createRequire(import.meta.url)
  const nhi = require(join(ROOT, 'public', 'nhi_drugs.json'))

  const result = {}
  let matched = 0
  for (const d of nhi) {
    if (!d.licId || result[d.licId]) continue
    const key = d.licId.slice(2).padStart(6, '0')
    const url = imgMap.get(key)
    if (url) { result[d.licId] = url; matched++ }
  }

  console.log(`Matched: ${matched} / ${nhi.length} NHI drugs (${Math.round(matched/nhi.length*100)}%)`)
  writeFileSync(OUTPUT, JSON.stringify(result))
  console.log(`Written → ${OUTPUT} (${Math.round(JSON.stringify(result).length/1024)} KB)`)

  // Cleanup temp files
  if (existsSync(TMP)) unlinkSync(TMP)
  if (existsSync(TMP_CSV)) unlinkSync(TMP_CSV)
  console.log('Done.')
}

run().catch(err => { console.error(err); process.exit(1) })

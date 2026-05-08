// Hardcoded fallback drugs (used while NHI JSON loads + for DEMO_OCR)
export const DRUGS = [
  { id:'A024806100', nameEN:'Magnesium Oxide 250mg Tablet', nameZH:'氧化鎂錠250毫克', ingredient:'Magnesium Oxide', atc:'A02AA02', form:'Tablet', strength:'250mg', price:'1.00', manufacturer:'信東生技' },
  { id:'A041374100', nameEN:'Acetaminophen 500mg Tablet', nameZH:'乙醯胺酚錠500毫克', ingredient:'Acetaminophen', atc:'N02BE01', form:'Tablet', strength:'500mg', price:'1.30', manufacturer:'永信藥品' },
  { id:'B032811100', nameEN:'Metformin HCl 500mg Tablet', nameZH:'鹽酸二甲雙胍錠500毫克', ingredient:'Metformin', atc:'A10BA02', form:'Tablet', strength:'500mg', price:'2.10', manufacturer:'健亞生技' },
  { id:'C018443100', nameEN:'Amlodipine Besylate 5mg Tablet', nameZH:'苯磺酸氨氯地平錠5毫克', ingredient:'Amlodipine', atc:'C08CA01', form:'Tablet', strength:'5mg', price:'4.80', manufacturer:'輝瑞' },
  { id:'D029112100', nameEN:'Atorvastatin Calcium 10mg Tablet', nameZH:'阿托伐他汀鈣錠10毫克', ingredient:'Atorvastatin', atc:'C10AA05', form:'Tablet', strength:'10mg', price:'12.50', manufacturer:'輝瑞' },
  { id:'E044721100', nameEN:'Lisinopril 10mg Tablet', nameZH:'賴諾普利錠10毫克', ingredient:'Lisinopril', atc:'C09AA03', form:'Tablet', strength:'10mg', price:'5.60', manufacturer:'台灣默克' },
  { id:'F031092100', nameEN:'Warfarin Sodium 5mg Tablet', nameZH:'可邁丁錠5毫克', ingredient:'Warfarin', atc:'B01AA03', form:'Tablet', strength:'5mg', price:'3.20', manufacturer:'百特' },
  { id:'G022341100', nameEN:'Omeprazole 20mg Capsule', nameZH:'奧美拉唑膠囊20毫克', ingredient:'Omeprazole', atc:'A02BC01', form:'Capsule', strength:'20mg', price:'8.90', manufacturer:'阿斯特捷利康' },
  { id:'H019832100', nameEN:'Amoxicillin 500mg Capsule', nameZH:'阿莫西林膠囊500毫克', ingredient:'Amoxicillin', atc:'J01CA04', form:'Capsule', strength:'500mg', price:'3.50', manufacturer:'葛蘭素史克' },
  { id:'I028741100', nameEN:'Ibuprofen 400mg Tablet', nameZH:'布洛芬錠400毫克', ingredient:'Ibuprofen', atc:'M01AE01', form:'Tablet', strength:'400mg', price:'2.20', manufacturer:'台灣諾華' },
  { id:'J031234100', nameEN:'Aspirin 100mg Tablet', nameZH:'阿斯匹靈腸溶錠100毫克', ingredient:'Aspirin', atc:'B01AC06', form:'Tablet', strength:'100mg', price:'1.80', manufacturer:'拜耳' },
  { id:'K019283100', nameEN:'Simvastatin 20mg Tablet', nameZH:'辛伐他汀錠20毫克', ingredient:'Simvastatin', atc:'C10AA01', form:'Tablet', strength:'20mg', price:'6.70', manufacturer:'默克' },
  { id:'L024891100', nameEN:'Losartan Potassium 50mg Tablet', nameZH:'鉀鹽氯沙坦錠50毫克', ingredient:'Losartan', atc:'C09CA01', form:'Tablet', strength:'50mg', price:'7.30', manufacturer:'默克' },
  { id:'M031872100', nameEN:'Metoprolol Tartrate 50mg Tablet', nameZH:'酒石酸美托洛爾錠50毫克', ingredient:'Metoprolol', atc:'C07AB02', form:'Tablet', strength:'50mg', price:'4.10', manufacturer:'諾華' },
  { id:'N028341100', nameEN:'Furosemide 40mg Tablet', nameZH:'呋塞米錠40毫克', ingredient:'Furosemide', atc:'C03CA01', form:'Tablet', strength:'40mg', price:'2.80', manufacturer:'賽諾菲' },
  { id:'O019234100', nameEN:'Insulin Glargine 100IU/mL Injection', nameZH:'甘精胰島素注射液100IU/毫升', ingredient:'Insulin Glargine', atc:'A10AE04', form:'Injection', strength:'100IU/mL', price:'289.00', manufacturer:'賽諾菲' },
  { id:'P031823100', nameEN:'Cetirizine HCl 10mg Tablet', nameZH:'鹽酸西替利嗪錠10毫克', ingredient:'Cetirizine', atc:'R06AE07', form:'Tablet', strength:'10mg', price:'3.90', manufacturer:'UCB' },
  { id:'Q028492100', nameEN:'Ciprofloxacin 500mg Tablet', nameZH:'環丙沙星錠500毫克', ingredient:'Ciprofloxacin', atc:'J01MA02', form:'Tablet', strength:'500mg', price:'9.20', manufacturer:'拜耳' },
  { id:'R019283100', nameEN:'Prednisolone 5mg Tablet', nameZH:'潑尼松龍錠5毫克', ingredient:'Prednisolone', atc:'H02AB06', form:'Tablet', strength:'5mg', price:'2.60', manufacturer:'台灣默克' },
  { id:'S028341100', nameEN:'Diazepam 5mg Tablet', nameZH:'地西泮錠5毫克', ingredient:'Diazepam', atc:'N05BA01', form:'Tablet', strength:'5mg', price:'1.90', manufacturer:'羅氏' },
  { id:'T031234100', nameEN:'Levothyroxine 50mcg Tablet', nameZH:'左甲狀腺素錠50微克', ingredient:'Levothyroxine', atc:'H03AA01', form:'Tablet', strength:'50mcg', price:'3.40', manufacturer:'雅培' },
  { id:'U019283100', nameEN:'Vitamin D3 1000IU Capsule', nameZH:'維他命D3膠囊1000IU', ingredient:'Cholecalciferol', atc:'A11CC05', form:'Capsule', strength:'1000IU', price:'4.20', manufacturer:'台灣武田' },
  { id:'V028341100', nameEN:'Calcium Carbonate 500mg Tablet', nameZH:'碳酸鈣錠500毫克', ingredient:'Calcium Carbonate', atc:'A12AA04', form:'Tablet', strength:'500mg', price:'1.50', manufacturer:'信東生技' },
  { id:'W031234100', nameEN:'Escitalopram 10mg Tablet', nameZH:'草酸艾司西酞普蘭錠10毫克', ingredient:'Escitalopram', atc:'N06AB10', form:'Tablet', strength:'10mg', price:'18.50', manufacturer:'靈北' },
  { id:'X019283100', nameEN:'Allopurinol 100mg Tablet', nameZH:'別嘌醇錠100毫克', ingredient:'Allopurinol', atc:'M04AA01', form:'Tablet', strength:'100mg', price:'2.10', manufacturer:'台灣葛蘭素' },
]

// Live drug list: starts with fallback, replaced when NHI JSON loads
export let DRUGS_LIVE = [...DRUGS]

// Load full NHI dataset from preprocessed JSON (45k active drugs)
export async function loadNHIDrugs() {
  try {
    const res = await fetch('/nhi_drugs.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    DRUGS_LIVE = data
    return data.length
  } catch (e) {
    console.warn('NHI JSON load failed, using fallback:', e.message)
    return 0
  }
}

// Fuzzy search over DRUGS_LIVE
export function searchDrugs(query) {
  if (!query || query.trim().length < 1) return []
  const q = query.toLowerCase().trim()
  return DRUGS_LIVE
    .map(d => {
      const fields = [d.nameEN, d.nameZH, d.ingredient, d.id, d.atc].join(' ').toLowerCase()
      let score = 0
      if (fields.includes(q)) score = q.length === fields.length ? 1.0 : 0.85
      else if (fields.split(' ').some(w => w.startsWith(q))) score = 0.70
      else if (fields.includes(q.slice(0, Math.max(3, q.length - 1)))) score = 0.50
      return { ...d, score }
    })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

// Simulate OCR result from a prescription
export const DEMO_OCR_RESULT = {
  rawText: 'MAGNESIUM OXIDE 250mg\n氧化鎂錠\nOMEPRAZOLE 20mg\n奧美拉唑膠囊\nACETAMINOPHEN 500mg',
  matched: [
    { drug: DRUGS[0], confidence: 0.96 },
    { drug: DRUGS[7], confidence: 0.91 },
    { drug: DRUGS[1], confidence: 0.88 },
  ]
}

// ── ATC Level-1 Category Labels ───────────────────────────────────────────
export const ATC_CATEGORIES = {
  A: 'Alimentary & Metabolism',
  B: 'Blood & Hematopoietic',
  C: 'Cardiovascular',
  D: 'Dermatologicals',
  G: 'Genito-urinary & Sex Hormones',
  H: 'Systemic Hormones',
  J: 'Anti-infectives (Systemic)',
  L: 'Antineoplastic & Immunomodulating',
  M: 'Musculoskeletal',
  N: 'Nervous System',
  P: 'Antiparasitic',
  R: 'Respiratory',
  S: 'Sensory Organs',
  V: 'Various',
}

// Short EN label for drugClass field from NHI CSV
export function drugClassLabel(raw) {
  if (!raw) return ''
  if (raw.includes('BA/BE')) return 'BA/BE Generic'
  if (raw.includes('學名藥')) return 'Generic'
  if (raw.includes('研發廠')) return 'Originator'
  if (raw.includes('生物相似')) return 'Biosimilar'
  if (raw.includes('生物製劑')) return 'Biologic'
  return raw
}

// Compute aggregate stats from DRUGS_LIVE (call after loadNHIDrugs resolves)
export function computeStats() {
  const total = DRUGS_LIVE.length
  if (total === 0) return null

  const byClass = {}
  const byForm = {}
  const byAtc = {}
  let noAtc = 0, combo = 0

  for (const d of DRUGS_LIVE) {
    const cls = drugClassLabel(d.drugClass) || 'Other'
    byClass[cls] = (byClass[cls] || 0) + 1

    const form = d.form || 'Unknown'
    byForm[form] = (byForm[form] || 0) + 1

    if (!d.atc) { noAtc++ } else {
      const cat = ATC_CATEGORIES[d.atc[0]?.toUpperCase()] || 'Other'
      byAtc[cat] = (byAtc[cat] || 0) + 1
    }

    if (d.combination === '複方') combo++
  }

  const topForms = Object.entries(byForm).sort((a,b)=>b[1]-a[1]).slice(0,6)
  const topAtc   = Object.entries(byAtc).sort((a,b)=>b[1]-a[1]).slice(0,6)

  return { total, byClass, topForms, topAtc, noAtc, combo }
}

// ── Drug Interaction Database ──────────────────────────────────────────────
// Each entry: ingredient names (lowercase), severity, mechanism, management
export const INTERACTION_DB = [
  {
    drugs: ['warfarin', 'aspirin'],
    severity: 'HIGH',
    en: 'Major bleeding risk: Aspirin inhibits platelet aggregation and can displace warfarin from plasma proteins, markedly increasing hemorrhagic risk.',
    zh: '出血風險極高：阿斯匹靈抑制血小板聚集並可能置換血漿蛋白結合的可邁丁，顯著增加出血風險。',
    management: 'Avoid combination unless benefit clearly outweighs risk. Monitor INR frequently. Use lowest effective doses.',
  },
  {
    drugs: ['warfarin', 'ibuprofen'],
    severity: 'HIGH',
    en: 'NSAIDs inhibit platelet function and can cause GI mucosal damage, dramatically increasing bleeding risk when combined with anticoagulants.',
    zh: 'NSAIDs抑制血小板功能並可能造成胃腸黏膜損傷，與抗凝血劑合用時顯著增加出血風險。',
    management: 'Avoid. Use acetaminophen as analgesic alternative. If NSAID unavoidable, add PPI and monitor closely.',
  },
  {
    drugs: ['warfarin', 'ciprofloxacin'],
    severity: 'HIGH',
    en: 'Ciprofloxacin inhibits CYP1A2 and reduces gut flora that produce Vitamin K, substantially increasing warfarin effect and INR.',
    zh: '環丙沙星抑制CYP1A2並減少腸道菌叢合成維他命K，明顯增強可邁丁效果，使INR升高。',
    management: 'Monitor INR 2–3 days after starting/stopping ciprofloxacin. Anticipate dose reduction of warfarin.',
  },
  {
    drugs: ['metformin', 'prednisolone'],
    severity: 'MODERATE',
    en: 'Corticosteroids cause insulin resistance and raise blood glucose, potentially causing loss of glycaemic control in diabetic patients on metformin.',
    zh: '類固醇引起胰島素阻抗並升高血糖，可能使使用二甲雙胍之糖尿病患者失去血糖控制。',
    management: 'Monitor blood glucose more frequently. Dose adjustment of antidiabetic agent may be required.',
  },
  {
    drugs: ['lisinopril', 'losartan'],
    severity: 'HIGH',
    en: 'Dual RAAS blockade (ACEi + ARB) increases risk of hypotension, hyperkalaemia, and acute kidney injury without additional cardiovascular benefit.',
    zh: '雙重RAAS阻斷（ACEi + ARB）在未增加心血管效益的情況下，增加低血壓、高血鉀及急性腎損傷風險。',
    management: 'Combination generally not recommended. Monitor renal function, electrolytes, and blood pressure closely if used.',
  },
  {
    drugs: ['simvastatin', 'amlodipine'],
    severity: 'MODERATE',
    en: 'Amlodipine inhibits CYP3A4-mediated metabolism of simvastatin, increasing simvastatin plasma levels and myopathy risk.',
    zh: '氨氯地平抑制CYP3A4代謝辛伐他汀，使其血中濃度升高，增加肌病變風險。',
    management: 'Limit simvastatin dose to 20 mg/day when co-administered with amlodipine. Monitor for muscle pain.',
  },
  {
    drugs: ['aspirin', 'ibuprofen'],
    severity: 'MODERATE',
    en: 'Ibuprofen competitively inhibits the COX-1 binding site used by aspirin, reducing aspirin\'s irreversible antiplatelet effect and cardiovascular protection.',
    zh: '布洛芬競爭性抑制阿斯匹靈使用的COX-1結合位點，減弱其不可逆的血小板抑制效果及心血管保護作用。',
    management: 'Take aspirin at least 30 minutes before or 8 hours after ibuprofen. Consider alternative analgesic (e.g., acetaminophen).',
  },
  {
    drugs: ['diazepam', 'metoprolol'],
    severity: 'LOW',
    en: 'Additive CNS depression. Beta-blockers may mask early tachycardia symptoms of diazepam withdrawal.',
    zh: '中樞神經抑制加成效應。乙型阻斷劑可能掩蓋地西泮戒斷時的早期心跳加速症狀。',
    management: 'Monitor for excessive sedation. Educate patient about impaired driving/alertness.',
  },
  {
    drugs: ['ciprofloxacin', 'metformin'],
    severity: 'MODERATE',
    en: 'Quinolones can cause both hyperglycaemia and hypoglycaemia, complicating glycaemic control in patients on metformin.',
    zh: '喹諾酮類藥物可能同時引起高血糖及低血糖，使二甲雙胍患者的血糖控制更加複雜。',
    management: 'Monitor blood glucose carefully during and after fluoroquinolone course.',
  },
  {
    drugs: ['furosemide', 'lisinopril'],
    severity: 'MODERATE',
    en: 'ACE inhibitors combined with high-dose loop diuretics can cause first-dose hypotension and acute kidney injury due to volume depletion.',
    zh: 'ACE抑制劑與大劑量環型利尿劑合用，因血容量減少可能導致首劑低血壓及急性腎損傷。',
    management: 'Start ACEi at low dose. Temporarily reduce diuretic dose. Monitor BP and renal function after initiation.',
  },
  {
    drugs: ['warfarin', 'omeprazole'],
    severity: 'MODERATE',
    en: 'Omeprazole inhibits CYP2C19, which partially metabolises warfarin (S-enantiomer), potentially increasing anticoagulant effect.',
    zh: '奧美拉唑抑制CYP2C19，部分影響可邁丁（S型）代謝，可能增強抗凝效果。',
    management: 'Monitor INR when starting or stopping omeprazole. Consider pantoprazole as alternative (less CYP2C19 interaction).',
  },
  {
    drugs: ['levothyroxine', 'calcium carbonate'],
    severity: 'MODERATE',
    en: 'Calcium carbonate chelates levothyroxine in the GI tract, reducing its absorption and potentially causing hypothyroidism.',
    zh: '碳酸鈣在胃腸道中螯合左甲狀腺素，降低其吸收，可能導致甲狀腺功能低下。',
    management: 'Separate administration by at least 4 hours. Monitor TSH after any change in calcium supplement timing.',
  },
  {
    drugs: ['aspirin', 'prednisolone'],
    severity: 'MODERATE',
    en: 'Combined use increases risk of peptic ulceration and GI bleeding due to additive mucosal damage and reduced prostaglandin synthesis.',
    zh: '合用因加成性黏膜損傷及前列腺素合成減少，增加消化性潰瘍及胃腸道出血風險。',
    management: 'Add PPI prophylaxis (e.g., omeprazole) for patients on both agents. Use minimum effective doses.',
  },
]

// Find therapeutic alternatives by ATC code (same level-4 prefix, deduplicated by ingredient)
export function findAlternatives(drug, maxResults = 8) {
  if (!drug?.atc || drug.atc.length < 4) return []
  const atcL4 = drug.atc.slice(0, 5)
  let results = DRUGS_LIVE.filter(d => d.id !== drug.id && d.atc.startsWith(atcL4))
  if (results.length < 3) {
    const atcL3 = drug.atc.slice(0, 4)
    results = DRUGS_LIVE.filter(d => d.id !== drug.id && d.atc.startsWith(atcL3))
  }
  const seen = new Set()
  return results
    .sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0))
    .filter(d => {
      if (seen.has(d.ingredient)) return false
      seen.add(d.ingredient)
      return true
    })
    .slice(0, maxResults)
}

// Levenshtein distance (optimised for short strings ≤ 30 chars)
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 3) return 99
  const m = a.length, n = b.length
  const row = Array.from({length: n + 1}, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    let prev = i
    for (let j = 1; j <= n; j++) {
      const cur = a[i-1] === b[j-1] ? row[j-1] : 1 + Math.min(row[j], prev, row[j-1])
      row[j-1] = prev; prev = cur
    }
    row[n] = prev
  }
  return row[n]
}

// Noise words that appear on packaging/forms but are NOT drug names
const OCR_NOISE = new Set([
  'SUPPLY','WITHOUT','PRESCRIPTION','ILLEGAL','KEEP','REACH','CHILDREN','PLEASE',
  'STORE','ROOM','TEMPERATURE','AWAY','PROTECTED','LIGHT','SEALED','EXPIRY',
  'FILM','COATED','ENTERIC','MODIFIED','RELEASE','EXTENDED','SUSTAINED',
  'ORAL','INTRAVENOUS','INTRAMUSCULAR','SUBCUTANEOUS','TOPICAL',
  'DOSE','DAILY','TWICE','THREE','ONCE','AFTER','BEFORE','MEAL','MEALS','FOOD',
  'DOCTOR','PATIENT','HOSPITAL','CLINIC','PHARMACY','PHARMACIST','DISPENSED',
  'TAKE','TABLET','TABLETS','CAPSULE','CAPSULES','VIAL','AMPOULE','INJECTION',
  'EACH','CONTAINING','EQUIVALENT','BRAND','NAME','GENERIC','BATCH','PACK',
  'DATE','TIME','QUANTITY','TOTAL','UNIT','UNITS','DAYS','NUMBER',
  'WARNING','CAUTION','DIRECTIONS','ADMINISTRATION','DOSAGE','SIDE','EFFECTS',
])

// Step-function confidence: more honest than linear
function ocrConfidence(score) {
  if (score >= 22) return 0.95
  if (score >= 16) return 0.88
  if (score >= 11) return 0.80
  if (score >= 8)  return 0.73
  if (score >= 6)  return 0.65
  return 0.55
}

// Extract drug-name candidate tokens.
// Returns { tokens: string[], parenBrands: Set<string> }
// Tokens inside (...) in Taiwan Rx are almost always brand names — flagged separately.
export function extractOcrCandidates(text) {
  const upper = text.toUpperCase()

  // Step 1: collect parenthesised groups → brand-name hints
  const parenBrands = new Set()
  let pm
  const parenRx = /\(([^)]{2,40})\)/g
  while ((pm = parenRx.exec(upper)) !== null) {
    pm[1].split(/[\s,;&+/\-]+/).forEach(t => {
      const clean = t.replace(/[^A-Z0-9]/g, '')
      if (clean.length >= 4 && !OCR_NOISE.has(clean)) parenBrands.add(clean)
    })
  }

  // Step 2: all tokens — strip every non-alphanumeric / non-Han char
  const tokens = upper
    .replace(/[^A-Z0-9\s一-鿿]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 4 && !OCR_NOISE.has(t) && !/^\d+(\.\d+)?[A-Z]*$/.test(t))

  return { tokens, parenBrands }
}

// Match OCR raw text against DRUGS_LIVE.
// Scoring priority:
//   1. Exact brand/ingredient in parentheses → very high (brand name hint in Taiwan Rx)
//   2. Exact substring anywhere in text
//   3. Levenshtein ≤ 2 fuzzy (handles OCR typos)
//   4. Chinese name substring
// Threshold = 6 to suppress noise accumulation.
export function matchOcrText(rawText) {
  if (!rawText?.trim()) return []

  const upper = rawText.toUpperCase()
  const { tokens, parenBrands } = extractOcrCandidates(rawText)
  const tokenSet = new Set(tokens)

  const scored = []

  for (const drug of DRUGS_LIVE) {
    let score = 0

    // ── 1. NHI drug code exact (12 pts) ────────────────────────────────────
    if (drug.id && upper.includes(drug.id)) score += 12

    // ── 2. ATC code exact (6 pts) ──────────────────────────────────────────
    if (drug.atc && drug.atc.length >= 4 && upper.includes(drug.atc)) score += 6

    // ── 3. Ingredient: exact → token → Levenshtein ─────────────────────────
    const ingrU = drug.ingredient.toUpperCase()
    const ingrParts = ingrU.split(/\s+/).filter(p => p.length >= 4)
    let ingrHits = 0
    for (const ip of ingrParts) {
      if (upper.includes(ip)) {
        score += 5; ingrHits++
      } else {
        let best = 99
        for (const t of tokens) {
          if (Math.abs(t.length - ip.length) > 3 || t.length < 5 || ip.length < 5) continue
          const d = lev(t, ip)
          if (d < best) best = d
          if (best === 0) break
        }
        if (best === 0)                        { score += 4; ingrHits++ }
        else if (best === 1)                   { score += 3; ingrHits++ }
        else if (best === 2 && ip.length >= 7) { score += 1; ingrHits++ }
      }
    }
    if (ingrParts.length > 1 && ingrHits === ingrParts.length) score += 5

    // ── 4. Brand / trade name — exact is KING, paren match = extra bonus ───
    const nameWords = drug.nameEN.toUpperCase().split(/[\s/\-]+/).filter(p => p.length >= 4)
    for (const nw of nameWords) {
      if (parenBrands.has(nw)) {
        // Exact match inside parens = highest brand signal (8 pts)
        score += 8
      } else if (upper.includes(nw)) {
        // Exact substring in full text (5 pts)
        score += 5
      } else if (tokenSet.has(nw)) {
        score += 4
      } else {
        // Fuzzy — check both regular tokens AND paren brands
        const allSearchTokens = [...tokens, ...parenBrands]
        let best = 99
        for (const t of allSearchTokens) {
          if (Math.abs(t.length - nw.length) > 2 || t.length < 4) continue
          const d = lev(t, nw)
          if (d < best) best = d
          if (best === 0) break
        }
        // Fuzzy brand inside parens gets extra weight
        if (best === 0) {
          score += parenBrands.has(nw) ? 7 : 2
        } else if (best === 1 && nw.length >= 6) {
          // Check if the fuzzy-matching token came from parens
          const fromParen = [...parenBrands].some(pb => lev(pb, nw) === 1)
          score += fromParen ? 5 : 1
        }
      }
    }

    // ── 5. Traditional Chinese substring (>=3 consecutive Han chars) ────────
    if (drug.nameZH) {
      const han = drug.nameZH.replace(/[^一-鿿]/g, '')
      let found = false
      for (let len = Math.min(4, han.length); len >= 3 && !found; len--) {
        for (let s = 0; s <= han.length - len; s++) {
          if (rawText.includes(han.slice(s, s + len))) { score += len + 2; found = true; break }
        }
      }
    }

    // Threshold raised to 6 — prevents noise accumulation from winning
    if (score >= 6) scored.push({ drug, score })
  }

  // Deduplicate by ingredient — keep highest score per ingredient
  const best = new Map()
  for (const item of scored) {
    const k = item.drug.ingredient.toLowerCase()
    if (!best.has(k) || best.get(k).score < item.score) best.set(k, item)
  }

  return [...best.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ drug, score }) => ({ drug, confidence: ocrConfidence(score) }))
}

// Check interactions for a list of drugs (each must have .ingredient)
export function checkInteractions(drugList) {
  if (!drugList || drugList.length < 2) return []
  const alerts = []
  const pairs = new Set()
  for (let i = 0; i < drugList.length; i++) {
    for (let j = i + 1; j < drugList.length; j++) {
      const aIngr = (drugList[i].ingredient || '').toLowerCase()
      const bIngr = (drugList[j].ingredient || '').toLowerCase()
      const pairKey = [aIngr, bIngr].sort().join('|')
      if (pairs.has(pairKey)) continue
      pairs.add(pairKey)
      for (const ix of INTERACTION_DB) {
        const [x, y] = ix.drugs
        if ((aIngr.includes(x) && bIngr.includes(y)) ||
            (aIngr.includes(y) && bIngr.includes(x))) {
          alerts.push({ drugA: drugList[i], drugB: drugList[j], ...ix })
        }
      }
    }
  }
  return alerts.sort((a, b) => {
    const order = { HIGH: 0, MODERATE: 1, LOW: 2 }
    return order[a.severity] - order[b.severity]
  })
}

// ──────────────────────────────────────────────────────────────────────────
// OCR → clean drug lines extractor
//
// Ported & adapted from the RxNorm (Expo) project's medication-line grouping
// + detected-item logic (groupMedicationLines / extractDetectedItems /
// normalizeOcrForDetection / sectionMapper anchors), rewritten as framework-free
// JS and tuned for Taiwan NHI prescriptions & drug boxes (Traditional Chinese
// section labels + Latin drug names + mg strengths).
//
// Goal: turn noisy multi-pass Tesseract output into a SHORT, CLEAN list of
// candidate drugs — ideally "NAME 500mg form" — ready to feed straight into
// Bulk lookup / ingredient search. We deliberately keep only what a drug
// lookup needs: drug name, strength (mg/ml/…), and dosage form.
// ──────────────────────────────────────────────────────────────────────────

const HAN = "一-鿿"; // CJK Unified Ideographs
const HAN_RUN_RE = new RegExp(`[${HAN}]{2,}`, "g");

// Strength: number + unit. Handles "500 mg", "500mg", "0.5 g", "5mg/ml", "10%".
// Global so we can use matchAll (which copies the regex — no lastIndex hazard).
const STRENGTH_RE =
  /(\d+(?:[.,]\d+)?)\s*(mg\/ml|mcg\/ml|mg|mcg|µg|ug|g|ml|iu|i\.u\.|meq|mmol|%)\b/gi;

// Dosage forms — English (incl. common OCR-friendly abbreviations) + Traditional Chinese.
const FORM_EN = [
  "tablets", "tablet", "tabs", "tab", "caplet", "capsules", "capsule", "caps", "cap",
  "softgel", "syrup", "suspension", "solution", "soln", "injection", "inj",
  "ampoule", "ampule", "vial", "cream", "ointment", "oint", "gel", "lotion",
  "drops", "drop", "spray", "inhaler", "inhalation", "patch", "suppository", "supp",
  "powder", "sachet", "granules", "granule", "lozenge", "pessary", "enema",
];
const FORM_ZH = [
  "膜衣錠", "糖衣錠", "口含錠", "咀嚼錠", "發泡錠", "錠", "膠囊", "口服液", "內服液",
  "注射劑", "注射液", "注射", "軟膏", "乳膏", "凝膠", "貼片", "栓劑", "吸入劑",
  "噴霧劑", "噴霧", "滴劑", "懸液用散", "懸液", "糖漿", "顆粒", "散劑", "乳劑", "油膏",
];
const FORM_EN_RE = new RegExp(`\\b(?:${FORM_EN.join("|")})\\b\\.?`, "gi");
const FORM_ZH_RE = new RegExp(`(?:${FORM_ZH.join("|")})`, "g");

// Section headers / labels / institution words found on Taiwan medicine bags &
// prescriptions. A line carrying one of these (and no real strength) is a label
// row — patient name, instruction, warning, hospital — NOT a drug. Dropped.
const NOISE_ZH = [
  "藥名", "用法", "用量", "次量", "每次", "每日", "用途", "適應症", "警語", "注意事項",
  "副作用", "領藥號", "調劑日期", "處方日期", "處方醫師", "調劑藥師", "醫師", "藥師",
  "總量", "總價", "姓名", "性別", "病歷號", "年齡", "地址", "住址", "電話", "醫院", "診所", "藥局",
  "藥房", "衛生", "健保", "門診", "備註", "天份", "飯前", "飯後", "睡前",
];
const LABEL_EN = new Set([
  "HOSPITAL", "CLINIC", "PHARMACY", "UNIVERSITY", "PATIENT", "PHYSICIAN",
  "PHARMACIST", "DOCTOR", "PRESCRIPTION", "DISPENSING", "DISPENSED",
  "INSTRUCTION", "INSTRUCTIONS", "DIRECTIONS", "WARNING", "WARNINGS",
  "INDICATION", "INDICATIONS", "PRECAUTIONS", "ADDRESS", "DEPARTMENT",
  "MEDICAL", "CENTER", "CENTRE", "QUANTITY", "DISPENSE",
]);

// Stop-tokens (units / boilerplate words) removed from a name before search.
const UNIT_TOKENS = new Set([
  "MG", "MCG", "UG", "G", "ML", "L", "IU", "U", "MEQ", "MMOL", "KG", "CC",
]);
const FORM_TOKENS = new Set(FORM_EN.map((f) => f.toUpperCase()));
const NAME_STOP = new Set([
  ...UNIT_TOKENS, ...FORM_TOKENS,
  "AND", "FOR", "THE", "WITH", "PER", "TAKE", "ORAL", "ORALLY", "USE", "USAGE",
  "DAILY", "TIMES", "TIME", "DAYS", "DAY", "BEFORE", "AFTER", "MEAL", "MEALS",
  "MORNING", "NOON", "EVENING", "NIGHT", "BEDTIME", "PRN", "STAT", "ONCE",
  "TWICE", "DOSE", "ROUTE", "EACH", "REFILL", "SIG", "QTY", "TOTAL", "NHI",
  "WARNINGS", "WARNING", "MEDICATION", "PRESCRIPTION", "TAB", "CAP",
]);

const OCR_PASS_RE = /-{2,}\s*OCR\s*PASS\s*-{2,}/i;

// Common Latin OCR confusions in drug names.
//  - leading 0 that begins an alphabetic word  →  O  (e.g. "0MEPRAZOLE")
//    (negative lookbehind for digits/letters so "850mg" is NOT touched)
//  - a 0 wedged between two letters             →  O  (e.g. "AT0RVASTATIN")
//  - a 1 wedged between two letters             →  l
function fixLatinOcr(s) {
  return s
    .replace(/(?<![0-9A-Za-z])0(?=[A-Za-z]{2,})/g, "O")
    .replace(/(?<=[A-Za-z])0(?=[A-Za-z])/g, "O")
    .replace(/(?<=[A-Za-z])1(?=[A-Za-z])/g, "l")
    .replace(/\brng\b/gi, "mg");
}

// Pull strengths out of a line, normalised to compact "500mg" form.
function extractStrengths(line) {
  const out = [];
  for (const m of line.matchAll(STRENGTH_RE)) {
    const num = m[1].replace(",", ".");
    let unit = m[2].toLowerCase().replace(/\./g, "");
    if (unit === "iu") unit = "IU";
    out.push(`${num}${unit}`);
  }
  return out;
}

// Detect dosage form (Chinese suffix preferred, else English word).
function extractForm(line) {
  const zh = line.match(FORM_ZH_RE);
  if (zh && zh.length) return zh[0];
  const en = line.match(FORM_EN_RE);
  if (en && en.length) {
    const w = en[0].replace(/\.$/, "").toLowerCase();
    if (/^tab/.test(w)) return "tablet";
    if (/^cap/.test(w)) return "capsule";
    if (/^inj/.test(w)) return "injection";
    if (/^supp/.test(w)) return "suppository";
    if (/^oint/.test(w)) return "ointment";
    if (/^soln/.test(w)) return "solution";
    return w;
  }
  return "";
}

// Longest run of Han characters in a line (the drug's Chinese name fragment).
function extractHanName(line) {
  const runs = line.match(HAN_RUN_RE);
  if (!runs || !runs.length) return "";
  return runs.sort((a, b) => b.length - a.length)[0];
}

// Latin drug-name portion: alphabetic tokens (len>=3) that are not units,
// forms, or boilerplate. Preserves order; collapses to a clean string.
function extractLatinName(line) {
  const s = line.replace(STRENGTH_RE, " ").replace(FORM_EN_RE, " ");
  const tokens = s
    .replace(/[^A-Za-z\s/+-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[-/+]+|[-/+]+$/g, "").trim())
    .filter(Boolean);

  const kept = [];
  for (const tok of tokens) {
    const up = tok.toUpperCase();
    if (up.length < 3) continue;
    if (NAME_STOP.has(up)) continue;
    // drop short consonant-only blobs (likely OCR garbage e.g. "XKZ")
    if (up.length <= 4 && !/[AEIOUY]/.test(up)) continue;
    kept.push(up);
  }
  return kept.join(" ").trim();
}

// True if the line is a label / institution / instruction row.
function hasLabelNoise(line) {
  for (const k of NOISE_ZH) if (line.includes(k)) return true;
  const words = line.toUpperCase().match(/[A-Z]+/g);
  if (words) for (const w of words) if (LABEL_EN.has(w)) return true;
  return false;
}

// Lines that are pure structure / non-drug (dates, phones, page numbers).
function isStructuralNoise(line) {
  const t = line.trim();
  if (!t) return true;
  if (OCR_PASS_RE.test(t)) return true;
  if (/^\d{2,4}[/.\-]\d{1,2}[/.\-]\d{1,2}/.test(t)) return true; // date
  if (/^[\d\s.\-/():#]+$/.test(t)) return true; // numeric / punctuation only
  const letters = (t.match(/[A-Za-z]/g) || []).length;
  const hans = (t.match(new RegExp(`[${HAN}]`, "g")) || []).length;
  if (letters < 3 && hans < 2) return true;
  return false;
}

/**
 * Extract clean candidate drug items from raw (multi-pass) OCR text.
 *
 * @param {string} rawText
 * @returns {Array<{ name:string, strength:string, form:string, zh:string,
 *                   searchText:string, raw:string, confidence:number }>}
 */
export function extractDrugLines(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => fixLatinOcr(l).replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const items = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (isStructuralNoise(line)) continue;

    let strengths = extractStrengths(line);

    // Label / instruction / institution rows carry no real strength → skip.
    if (!strengths.length && hasLabelNoise(line)) continue;

    let form = extractForm(line);
    const latin = extractLatinName(line);
    let zh = extractHanName(line);
    const latinLen = latin.replace(/\s/g, "").length;

    // Need a Latin name (>=4 chars) OR a Chinese name that is clearly a drug
    // (carries a form suffix or strength — rejects patient names / verbs).
    if (latinLen < 4) {
      if (zh.length < 2) continue;
      if (!form && !strengths.length) continue;
    }

    // Look at the next line for a continuation to absorb. (We do NOT gate on
    // isStructuralNoise here — a bare "10mg" strength line reads as "structural"
    // yet is exactly the continuation we want to pull up.)
    if (i + 1 < rawLines.length) {
      const next = rawLines[i + 1];
      if (!hasLabelNoise(next)) {
        const nStr = extractStrengths(next);
        const nLatin = extractLatinName(next).replace(/\s/g, "").length;
        const nZh = extractHanName(next);
        const nForm = extractForm(next);
        // (A) strength/form-only continuation → absorb strength
        if (!strengths.length && nStr.length && nLatin < 4 && nZh.length < 2) {
          strengths = nStr;
          if (!form) form = nForm;
          i++;
        }
        // (B) Latin name now, pure Chinese name on next line → attach it.
        // Require the next line carry NO digits — a real Chinese drug-name row
        // has none; "總量 30 錠" (a quantity row) does, so it is rejected.
        else if (
          latin && !zh && nLatin < 4 && nZh.length >= 3 && nForm && !/\d/.test(next)
        ) {
          zh = nZh;
          if (!form) form = nForm;
          i++;
        }
      }
    }

    const strength = strengths[0] || "";
    const name = latin || zh;
    if (!name) continue;

    // Confidence: base + signal bonuses (mirrors the source project's scoring).
    let confidence = 0.5;
    if (strength) confidence += 0.2;
    if (form) confidence += 0.15;
    if (latinLen >= 6) confidence += 0.1;
    if (latin && zh) confidence += 0.05;
    confidence = Math.min(0.95, confidence);

    // searchText feeds Bulk / ingredient lookup: Latin name wins (the lookup
    // index keys on Latin ingredient/brand); fall back to the Chinese name.
    const searchText = [latin || zh, strength].filter(Boolean).join(" ").trim();

    items.push({
      name,
      strength,
      form,
      zh: latin ? zh : "",
      searchText,
      raw: line,
      confidence,
    });
  }

  // Dedupe by normalised name+strength, keep highest confidence.
  const seen = new Map();
  for (const it of items) {
    const key = `${it.name.toUpperCase()}|${it.strength}`;
    if (!seen.has(key) || seen.get(key).confidence < it.confidence) {
      seen.set(key, it);
    }
  }

  return [...seen.values()].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Build a newline-separated text block (one clean drug per line) ready to drop
 * straight into the Bulk lookup textarea.
 */
export function buildBulkText(items) {
  return (items || [])
    .map((it) => it.searchText)
    .filter(Boolean)
    .join("\n");
}

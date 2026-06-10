// ──────────────────────────────────────────────────────────────────────────
// Remote OCR client — talks to the wisli PaddleOCR server (FastAPI).
//
// The wisli OCR engine (PaddleOCR PP-StructureV3) is a self-hosted Python
// server; it cannot run in the browser. This module POSTs the captured image to
// that server and turns its structured response into reading-order text, which
// the rest of the pipeline (extractDrugLines / matchOcrText) then consumes.
//
// Server contract (tools/ocr_server/app/main.py):
//   POST {OCR_SERVER_URL}/parse?lang=ch
//     multipart form field "file" = image (<=10MB)
//     header  X-API-Key: <key>   (only if the server sets OCR_API_KEY)
//   → { pages: [{ width, height, elements: [{ text, bbox:[x1,y1,x2,y2],
//                 confidence }] }], case_fields, ... }
//   GET  {OCR_SERVER_URL}/health → { status: "ok" }
//
// Configure via Vite env vars (build time):
//   VITE_OCR_SERVER_URL       e.g. https://ocr.example.trycloudflare.com
//   VITE_OCR_SERVER_API_KEY   optional
// ──────────────────────────────────────────────────────────────────────────

const RAW_URL = (import.meta.env.VITE_OCR_SERVER_URL || "").trim();
const API_KEY = (import.meta.env.VITE_OCR_SERVER_API_KEY || "").trim();
const BASE = RAW_URL.replace(/\/+$/, "");

export function isRemoteOcrConfigured() {
  return BASE.length > 0;
}

export function remoteOcrServerUrl() {
  return BASE;
}

// Group OCR elements into reading order (top→bottom, left→right) and join into
// newline-separated text. Elements whose vertical centres fall within a row
// tolerance are treated as one line and joined with spaces — this keeps a
// prescription row like "杏輝MEFENAMIC ACI 9. 一天3次 錠 口服" on one line so
// the drug name + strength stay together for extractDrugLines.
function elementsToText(elements) {
  const els = (elements || []).filter((e) => e && e.text && e.bbox?.length >= 4);
  if (!els.length) return "";

  const cy = (e) => (e.bbox[1] + e.bbox[3]) / 2;
  const height = (e) => Math.abs(e.bbox[3] - e.bbox[1]) || 1;

  const heights = els.map(height).sort((a, b) => a - b);
  const medianH = heights[Math.floor(heights.length / 2)] || 12;
  const rowTol = medianH * 0.6;

  const sorted = [...els].sort((a, b) => {
    const dy = cy(a) - cy(b);
    if (Math.abs(dy) > rowTol) return dy;
    return a.bbox[0] - b.bbox[0];
  });

  const rows = [];
  let row = [];
  let rowY = null;
  for (const e of sorted) {
    const y = cy(e);
    if (rowY === null || Math.abs(y - rowY) <= rowTol) {
      row.push(e);
      rowY = rowY === null ? y : (rowY * (row.length - 1) + y) / row.length;
    } else {
      rows.push(row);
      row = [e];
      rowY = y;
    }
  }
  if (row.length) rows.push(row);

  return rows
    .map((r) =>
      r
        .sort((a, b) => a.bbox[0] - b.bbox[0])
        .map((e) => e.text.trim())
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean)
    .join("\n");
}

/**
 * Run OCR on an image File/Blob via the wisli PaddleOCR server.
 * @returns {Promise<{ text:string, elements:Array, caseFields:object|null }>}
 * @throws if not configured or the server returns an error.
 */
export async function runRemoteOcr(file) {
  if (!isRemoteOcrConfigured()) {
    throw new Error("OCR server URL is not configured (VITE_OCR_SERVER_URL).");
  }

  const form = new FormData();
  form.append("file", file, file.name || "scan.jpg");

  const headers = {};
  if (API_KEY) headers["X-API-Key"] = API_KEY;

  let res;
  try {
    res = await fetch(`${BASE}/parse?lang=ch`, {
      method: "POST",
      body: form,
      headers,
    });
  } catch (e) {
    throw new Error(
      `Cannot reach OCR server at ${BASE}. Is it running and exposed over HTTPS? (${e.message})`,
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j.detail || "";
    } catch {
      detail = res.statusText;
    }
    throw new Error(`OCR server returned ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const elements = data?.pages?.[0]?.elements || [];
  return {
    text: elementsToText(elements),
    elements,
    caseFields: data?.case_fields || null,
  };
}

/** Lightweight reachability check against /health. */
export async function pingRemoteOcr() {
  if (!isRemoteOcrConfigured()) return false;
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

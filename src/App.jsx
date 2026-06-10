import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import { AuthProvider, useAuth } from "./auth.jsx";
import {
  searchDrugs,
  loadNHIDrugs,
  DEMO_OCR_RESULT,
  DRUGS,
  DRUGS_LIVE,
  INTERACTION_DB,
  checkInteractions,
  ATC_CATEGORIES,
  drugClassLabel,
  computeStats,
  findAlternatives,
  matchOcrText,
  searchByIngredient,
  loadDrugImages,
  getDrugImage,
  browseByATC,
  DATA_VERSION,
} from "./data.js";
import { extractDrugLines, buildBulkText } from "./ocrExtract.js";

// Medical color palette — deep clinical green, WHO/NHI standard
// Primary: #1B6840 deep forest green · Dark: #13502F · Accent: #2A9D5C
const D = {
  primary: "#2DC76A",
  primaryDark: "#1FAF55",
  secondary: "#3A72CC",
  accent: "#3AD47A",
  bg: "#050F0A",
  card: "#081A10",
  text: "#E8F5EE",
  muted: "#7AAE90",
  border: "#102818",
  danger: "#F87171",
  warning: "#FBBF24",
  success: "#2DC76A",
  staffBg: "#0A1F12",
};

const C = {
  primary: "#1B6840",
  primaryDark: "#13502F",
  secondary: "#1A3572",
  accent: "#2A9D5C",
  bg: "#EBF5EE",
  card: "#FFFFFF",
  text: "#0F1F14",
  muted: "#4A6B58",
  border: "#C2DFD0",
  danger: "#C0392B",
  warning: "#D48830",
  success: "#1B6840",
  staffBg: "#E8F5EE",
};

const LANG = {
  en: {
    appName: "RxNorm Taiwan",
    scan: "Scan Drugs",
    search: "Search Drugs",
    meds: "My Drugs",
    settings: "Settings",
    interact: "Drugs Interaction",
    admin: "Admin Panel",
    lookup: "Drug Lookup",
    signIn: "Sign In",
    signOut: "Sign Out",
    signedInAs: "Signed in as",
    notSignedIn: "Not signed in",
    signOutTitle: "Sign out?",
    signOutMessage: "Are you sure you want to sign out from this account?",
    cancel: "Cancel",
    userProfile: "User Profile",
    userProfileDesc: "View and manage signed-in user information",
    scanHistory: "Scan History",
    scanHistoryDesc: "View previous prescription scan records",
    mode: "Mode",
    modeDesc: "Switch between light and dark appearance",
    language: "Language",
    languageDesc: "Change application language",
    managePrefs: "Manage your app preferences.",
    light: "Light",
    dark: "Dark",
    open: "Open",
    // Drug Search
    searchPlaceholder: "Search drugs…",
    backToResults: "← Back to results",
    activeIngredient: "Active Ingredient (成分根節點)",
    nhiCode: "NHI Code",
    atcCode: "ATC Code",
    brandName: "Brand Name",
    chineseName: "Chinese Name",
    dosageForm: "Dosage Form",
    dosageLabel: "Dosage",
    nhiPriceLabel: "NHI Price (NT$)",
    manufacturerLabel: "Manufacturer",
    priceLockedMsg:
      "NHI reimbursement price is available to Hospital Staff and Admin only.",
    routingTrace: "🏥 Routing & Trace (Staff Only)",
    mappingPath: "Mapping path",
    scanAgain: "← Scan Again",
    addMyDrugs: "+ Add to My Drugs",
    reportBtn: "⚠ Report Error",
    matchPct: "% match",
    moreKeepTyping: "more — keep typing to narrow down",
    // Drug Lookup
    lookupPlaceholder:
      "Generic name / ATC code (e.g. metformin, N05AH04, 氧化鎂)",
    ingredientRoot: "成分根節點 · Ingredient Root Concept",
    nhiBrands: "NHI brands",
    brandsLabel: "brands",
    moreCount: "more",
    allStrengths: "All strengths",
    allForms: "All forms",
    allClasses: "All classes",
    showingOf: (n, t) => `${n} / ${t}`,
    backAll: "← All results",
    noBrandsMatch: "No brands match the current filters.",
    // Filter & sort toolbar
    filterLabel: "Filter",
    sortLabel: "Sort",
    sortFieldName: "Name",
    sortFieldStrength: "Strength",
    sortAscTip: "Ascending (low → high / A → Z)",
    sortDescTip: "Descending (high → low / Z → A)",
    coverageAll: "NHI coverage",
    coverageFull: "  Fully covered",
    coverageCond: "  ⚠ Conditional",
    resetFilters: "Reset",
    exported: "✓ Exported",
    noIngredientFound: "No ingredients found for",
    lookupExamples:
      "<b>Generic:</b> metformin · quetiapine · omeprazole<br/><b>ATC class:</b> N05AH · A10BA · C09AA · N02BE<br/><b>Chinese:</b> 氧化鎂 · 二甲雙胍 · 奧美拉唑",
    lookupDesc:
      "Search by generic name or ATC code to see all NHI-listed brands — the same active ingredient under different brand names used across clinics.",
    addBtn: "+ Add",
    addedBtn: "✓",
    // Lookup page modes
    modeSearch: "Search",
    modeBrowse: "Browse ATC",
    modeBulk: "Bulk",
    // ATC Browser
    atcBrowseTitle: "ATC Browser",
    atcBrowseDesc: "Browse all NHI drugs by WHO ATC classification",
    drugCount: "drugs",
    backTree: "← Back",
    viewBrands: "View brands",
    // Export CSV
    exportCSV: "Export CSV",
    // Bulk search
    bulkTitle: "Bulk Lookup",
    bulkPlaceholder:
      "Paste drug names — one per line or comma-separated\ne.g. metformin, quetiapine, omeprazole",
    bulkRun: "Look up all",
    bulkClear: "Clear",
    bulkColInput: "Input",
    bulkColIngredient: "Matched Ingredient",
    bulkColAtc: "ATC",
    bulkColBrands: "Brands",
    bulkNoMatch: "No match",
    // Data freshness
    nhiDataLabel: "NHI data",
    nhiCovered: "✓ NHI Covered",
    nhiConditional: "⚠ Conditional Coverage",
    nhiConditionalTip:
      "NHI may reimburse only when specific clinical criteria are met. You may need to pay out-of-pocket if criteria are not fulfilled.",
    reimbCond: "Conditions §",
    noReimbCond: "No special restrictions",
    nhiChapterLabel: "NHI Chapter",
    priceCheap: "💚 Low",
    priceMid: "🟡 Average",
    priceHigh: "🔴 Higher",
    checkDDI: "Check DDI",
    printMeds: "🖨 Print card",
    printTitle: "Medication Card",
    // drug detail modal
    clinicalInfoTitle: "Clinical Information",
    drugNamesTitle: "Drug Names",
    sectionIndication: "Indications",
    sectionUsage: "Dosage & Administration",
    sectionAdverse: "Adverse Reactions",
    sectionContraindication: "Contraindications",
    sectionPrecaution: "Precautions & Warnings",
    sectionInteraction: "Drug Interactions",
    sectionStorage: "Storage",
    genericNameEN: "Generic Name",
    genericNameZH: "Chinese Name",
    brandNameLabel: "Brand Name",
    dosageFormLabel: "Dosage Form",
    noClinicalInfo:
      "Detailed clinical information not yet available for this drug.",
    noClinicalInfoSub: "Please refer to FDA Query or NHI PDF.",
  },

  zhTW: {
    appName: "RxNorm Taiwan",
    scan: "掃描處方",
    search: "搜尋藥物",
    meds: "我的藥物",
    settings: "設定",
    interact: "藥物交互作用",
    admin: "管理面板",
    lookup: "藥品查詢",
    signIn: "登入",
    signOut: "登出",
    signedInAs: "已登入為",
    notSignedIn: "尚未登入",
    signOutTitle: "要登出嗎？",
    signOutMessage: "你確定要登出目前帳號嗎？",
    cancel: "取消",
    userProfile: "使用者資料",
    userProfileDesc: "查看與管理已登入的使用者資訊",
    scanHistory: "掃描紀錄",
    scanHistoryDesc: "查看之前的處方掃描紀錄",
    mode: "模式",
    modeDesc: "切換淺色與深色外觀",
    language: "語言",
    languageDesc: "更改應用程式語言",
    managePrefs: "管理你的應用程式偏好設定。",
    light: "淺色",
    dark: "深色",
    open: "開啟",
    // Drug Search
    searchPlaceholder: "搜尋藥品…",
    backToResults: "← 返回結果",
    activeIngredient: "有效成分（成分根節點）",
    nhiCode: "健保代碼",
    atcCode: "ATC 代碼",
    brandName: "英文品名",
    chineseName: "中文品名",
    dosageForm: "劑型",
    dosageLabel: "規格",
    nhiPriceLabel: "健保價（NT$）",
    manufacturerLabel: "製造商",
    priceLockedMsg: "健保給付價格僅供醫院員工及管理員查看。",
    routingTrace: "🏥 路由追蹤（員工專用）",
    mappingPath: "對應路徑",
    scanAgain: "← 重新掃描",
    addMyDrugs: "+ 加入我的藥物",
    reportBtn: "⚠ 回報錯誤",
    matchPct: "% 符合",
    moreKeepTyping: "個更多 — 繼續輸入以縮小範圍",
    // Drug Lookup
    lookupPlaceholder:
      "成分名稱 / ATC 代碼（例如：metformin、N05AH04、氧化鎂）",
    ingredientRoot: "成分根節點 · Ingredient Root Concept",
    nhiBrands: "個健保品牌",
    brandsLabel: "個品牌",
    moreCount: "個更多",
    allStrengths: "所有劑量",
    allForms: "所有劑型",
    allClasses: "所有藥品分類",
    showingOf: (n, t) => `${n} / ${t}`,
    backAll: "← 回到結果",
    noBrandsMatch: "無符合目前篩選條件的品牌。",
    // Filter & sort toolbar
    filterLabel: "篩選",
    sortLabel: "排序",
    sortFieldName: "名稱",
    sortFieldStrength: "劑量",
    sortAscTip: "由低到高（價格低→高 / A→Z）",
    sortDescTip: "由高到低（價格高→低 / Z→A）",
    coverageAll: "所有給付狀態",
    coverageFull: "✓ 完全給付",
    coverageCond: "⚠ 有給付條件",
    resetFilters: "重設",
    exported: "✓ 已匯出",
    noIngredientFound: "找不到符合的成分：",
    lookupExamples:
      "<b>學名：</b>metformin · quetiapine · omeprazole<br/><b>ATC 分類：</b>N05AH · A10BA · C09AA · N02BE<br/><b>中文：</b>氧化鎂 · 二甲雙胍 · 奧美拉唑",
    lookupDesc:
      "輸入學名（成分）或 ATC 代碼，查看健保收載的所有品牌藥品，了解同一成分在不同診所使用的各種商品名稱。",
    addBtn: "+ 加入",
    addedBtn: "✓",
    // Lookup page modes
    modeSearch: "搜尋",
    modeBrowse: "ATC 瀏覽",
    modeBulk: "批次查詢",
    // ATC Browser
    atcBrowseTitle: "ATC 藥品分類",
    atcBrowseDesc: "依 WHO ATC 分類瀏覽所有健保藥品",
    drugCount: "個藥品",
    backTree: "← 返回",
    viewBrands: "查看品牌",
    // Export CSV
    exportCSV: "匯出 CSV",
    // Bulk search
    bulkTitle: "批次藥品查詢",
    bulkPlaceholder:
      "貼上藥品名稱，每行一個或以逗號分隔\n例如：metformin, quetiapine, omeprazole",
    bulkRun: "開始查詢",
    bulkClear: "清除",
    bulkColInput: "輸入名稱",
    bulkColIngredient: "對應成分",
    bulkColAtc: "ATC 代碼",
    bulkColBrands: "品牌數",
    bulkNoMatch: "查無結果",
    // Data freshness
    nhiDataLabel: "NHI 資料",
    nhiCovered: "✓ 健保收載",
    nhiConditional: "⚠ 有給付條件",
    nhiConditionalTip:
      "此藥品需符合特定臨床條件才能獲得健保給付，若不符合條件，費用須自行負擔。",
    reimbCond: "給付規定 §",
    noReimbCond: "無條件限制",
    nhiChapterLabel: "給付規定章節",
    priceCheap: "💚 最低",
    priceMid: "🟡 中等",
    priceHigh: "🔴 較高",
    checkDDI: "查交互作用",
    printMeds: "🖨 列印藥單",
    printTitle: "用藥清單",
    // drug detail modal
    clinicalInfoTitle: "藥品資訊",
    drugNamesTitle: "藥品名稱",
    sectionIndication: "適應症",
    sectionUsage: "用法用量",
    sectionAdverse: "不良反應",
    sectionContraindication: "禁忌症",
    sectionPrecaution: "注意事項",
    sectionInteraction: "藥物交互作用",
    sectionStorage: "儲存方式",
    genericNameEN: "學名（EN）",
    genericNameZH: "學名（中文）",
    brandNameLabel: "商品名",
    dosageFormLabel: "劑型",
    noClinicalInfo: "此藥品的詳細藥學資訊暫未收錄",
    noClinicalInfoSub: "請參考 FDA 查詢或 NHI PDF",
  },
};

const LangCtx = createContext({
  T: LANG.zhTW,
  language: "zhTW",
  setLanguage: () => {},
});
function useLang() {
  return useContext(LangCtx);
}

function LangToggle() {
  const { language, setLanguage } = useLang();
  const active = {
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 800,
    borderRadius: 5,
    border: "none",
    cursor: "pointer",
    background: C.primary,
    color: "#fff",
    letterSpacing: 0.3,
  };
  const inactive = {
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 5,
    border: "none",
    cursor: "pointer",
    background: "transparent",
    color: "#64748b",
    letterSpacing: 0.3,
  };
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: "#DFF0E8",
        borderRadius: 7,
        padding: 2,
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => setLanguage("zhTW")}
        style={language === "zhTW" ? active : inactive}
      >
        中文
      </button>
      <button
        onClick={() => setLanguage("en")}
        style={language === "en" ? active : inactive}
      >
        EN
      </button>
    </div>
  );
}

function dosageFormEN(form) {
  const map = {
    膜衣錠: "Film-coated tablet",
    錠劑: "Tablet",
    膠囊: "Capsule",
    軟膠囊: "Soft capsule",
    口服液: "Oral solution",
    懸浮液: "Suspension",
    注射液: "Injection",
    注射劑: "Injection",
    乳膏: "Cream",
    軟膏: "Ointment",
    貼片: "Patch",
    粉劑: "Powder",
    顆粒劑: "Granules",
    糖漿: "Syrup",
  };

  return map[form] || form;
}

const LOW_CONF = 0.75;

// module-level history (max 50) shared across tabs
const HISTORY = [];
function addHist(e) {
  HISTORY.unshift({ ...e, ts: new Date().toISOString() });
  if (HISTORY.length > 50) HISTORY.length = 50;
}

function Badge({ role }) {
  const m = {
    admin: ["#dc2626", "#fef2f2"],
    staff: ["#d97706", "#fffbeb"],
    guest: ["#16a34a", "#f0fdf4"],
  };
  const [col, bg] = m[role] || m.guest;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 12,
        background: bg,
        color: col,
        border: `1px solid ${col}33`,
      }}
    >
      {role.toUpperCase()}
    </span>
  );
}
function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--card)",
        color: "var(--text)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
function LockedFeature({ minRole, children }) {
  const { isAdmin, isStaff } = useAuth();
  const ok =
    minRole === "admin" ? isAdmin : minRole === "staff" ? isStaff : true;
  if (ok) return children;
  return (
    <div
      style={{
        background: "#f8fafc",
        border: `2px dashed ${C.border}`,
        borderRadius: 12,
        padding: 32,
        textAlign: "center",
        color: C.muted,
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {minRole === "admin"
          ? "Admin access required"
          : "Hospital Staff or Admin access required"}
      </div>
      <div style={{ fontSize: 13 }}>
        Please sign in with the appropriate account to use this feature.
      </div>
    </div>
  );
}

function LowConfWarning({ score, name }) {
  if (score >= LOW_CONF) return null;
  return (
    <div
      style={{
        background: "#fff7ed",
        border: `1px solid #fb923c`,
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#9a3412" }}>
          Low Confidence Match
        </div>
        <div style={{ fontSize: 12, color: "#c2410c", marginTop: 2 }}>
          Confidence {Math.round(score * 100)}% is below the{" "}
          {Math.round(LOW_CONF * 100)}% threshold for "{name}". Please verify
          manually or report an error.
        </div>
      </div>
    </div>
  );
}

function ReportModal({ drug, onClose }) {
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  function send() {
    setSent(true);
    setTimeout(onClose, 1800);
  }
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          width: 360,
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        }}
      >
        {sent ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700 }}>Report submitted</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              Added to admin review queue.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Report Incorrect Match
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: C.muted,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
              Reporting: <b>{drug.nameEN}</b> ({drug.ingredient})
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue (optional)..."
              style={{
                width: "100%",
                height: 80,
                padding: "8px 10px",
                fontSize: 13,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontFamily: "inherit",
                resize: "none",
                outline: "none",
              }}
            />
            <button
              onClick={send}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                background: C.danger,
                color: "#fff",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Submit Report → Admin Queue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LoginModal({ onClose }) {
  const { login, error, setError } = useAuth();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  function submit(e) {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const ok = login(u, p);
      setLoading(false);
      if (ok) onClose();
    }, 400);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27,104,64,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 18,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setError("");
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 330,
          background: "#fff",
          borderRadius: 24,
          padding: "34px 24px 28px",
          boxShadow: "0 28px 70px rgba(15,23,42,.28)",
          position: "relative",
        }}
      >
        <button
          onClick={() => {
            setError("");
            onClose();
          }}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            border: "none",
            background: "transparent",
            color: "#94A3B8",
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div
          style={{
            textAlign: "center",
            fontSize: 28,
            fontWeight: 900,
            color: "#475569",
            marginBottom: 28,
          }}
        >
          Login
        </div>

        <form onSubmit={submit}>
          <div style={loginInputWrapStyle}>
            <span style={loginIconStyle}>👤</span>
            <input
              value={u}
              autoFocus
              onChange={(e) => setU(e.target.value)}
              placeholder="Username"
              style={loginInputStyle}
            />
          </div>

          <div style={loginInputWrapStyle}>
            <span style={loginIconStyle}>🔒</span>
            <input
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              placeholder="Password"
              style={loginInputStyle}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#94A3B8",
              margin: "10px 2px 18px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ accentColor: "#0E9F6E" }}
            />
            Remember me
          </label>

          {error && (
            <div
              style={{
                color: "#DC2626",
                fontSize: 12,
                marginBottom: 12,
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 999,
              border: "none",
              background: loading ? "#94A3B8" : "#1B6840",
              color: "#fff",
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: 0.4,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 12px 24px rgba(14,159,110,.22)",
            }}
          >
            {loading ? "SIGNING IN..." : "LOG IN"}
          </button>

          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#94A3B8",
              marginTop: 14,
            }}
          >
            Forget Password
          </div>
        </form>

        <div
          style={{
            marginTop: 34,
            padding: 12,
            borderRadius: 16,
            background: "#F8FAFC",
            fontSize: 11,
            color: "#64748B",
            lineHeight: 1.65,
          }}
        >
          <div style={{ fontWeight: 800, color: "#334155", marginBottom: 4 }}>
            Demo accounts
          </div>
          <div>admin / admin123</div>
          <div>staff / staff123</div>
          <div>doctor / doctor123</div>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 12,
            color: "#94A3B8",
          }}
        >
          Not a member?
          <span
            onClick={() => {
              onClose();
              window.dispatchEvent(new Event("open-signup"));
            }}
            style={{ color: "#0E9F6E", fontWeight: 700, cursor: "pointer" }}
          >
            Sign up now
          </span>
        </div>
      </div>
    </div>
  );
}

function SignupModal({ onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  function submit(e) {
    e.preventDefault();

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    setDone(true);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27,104,64,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 18,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          background: "#fff",
          borderRadius: 24,
          padding: "34px 24px 28px",
          boxShadow: "0 28px 70px rgba(15,23,42,.28)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            border: "none",
            background: "transparent",
            color: "#94A3B8",
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div
          style={{
            textAlign: "center",
            fontSize: 28,
            fontWeight: 900,
            color: "#475569",
            marginBottom: 24,
          }}
        >
          Sign Up
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#0F172A" }}>
              Account created
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#64748B",
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              This is a frontend demo. Connect backend/auth later for real
              signup.
            </div>

            <button
              onClick={onClose}
              style={{
                width: "100%",
                marginTop: 22,
                padding: "13px",
                borderRadius: 999,
                border: "none",
                background: "#1B6840",
                color: "#fff",
                fontSize: 15,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div style={loginInputWrapStyle}>
              <span style={loginIconStyle}>👤</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                style={loginInputStyle}
              />
            </div>

            <div style={loginInputWrapStyle}>
              <span style={loginIconStyle}>✉️</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                style={loginInputStyle}
              />
            </div>

            <div style={loginInputWrapStyle}>
              <span style={loginIconStyle}>🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={loginInputStyle}
              />
            </div>

            <div style={loginInputWrapStyle}>
              <span style={loginIconStyle}>🔐</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                required
                style={loginInputStyle}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 999,
                border: "none",
                background: "#1B6840",
                color: "#fff",
                fontSize: 15,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 12px 24px rgba(14,159,110,.22)",
              }}
            >
              CREATE ACCOUNT
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const loginInputWrapStyle = {
  width: "100%",
  height: 44,
  borderRadius: 999,
  background: "#F1F5F9",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 15px",
  marginBottom: 14,
  border: "1px solid #E2E8F0",
};

const loginIconStyle = {
  fontSize: 15,
  color: "#94A3B8",
  width: 18,
  textAlign: "center",
  opacity: 0.8,
};

const loginInputStyle = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 14,
  color: "#0F172A",
  fontFamily: "inherit",
};

function NavBar({ showLogin, nhiCount }) {
  const { user, logout } = useAuth();
  return (
    <div
      style={{
        background: C.primary,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,.15)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>💊</span>
        <div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
            RxNorm Taiwan
          </span>
          <span
            style={{
              color: "rgba(255,255,255,.7)",
              fontSize: 11,
              marginLeft: 8,
            }}
          >
            {nhiCount > 0
              ? `${nhiCount.toLocaleString()} NHI drugs loaded`
              : "Drug Identification System"}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>
                {user.name}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  justifyContent: "flex-end",
                  marginTop: 2,
                }}
              >
                <Badge role={user.role} />
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,.4)",
                background: "rgba(255,255,255,.15)",
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <span style={{ color: "rgba(255,255,255,.7)", fontSize: 12 }}>
              Guest mode
            </span>
            <button
              onClick={showLogin}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                background: "#fff",
                color: C.primary,
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Drug class badge ──────────────────────────────────────────────────────
function DrugClassBadge({ raw }) {
  const label = drugClassLabel(raw);
  if (!label) return null;
  const cfg = {
    Generic: ["#0369a1", "#e0f2fe"],
    "BA/BE Generic": ["#0e7490", "#ecfeff"],
    Originator: ["#6d28d9", "#ede9fe"],
    Biologic: ["#15803d", "#dcfce7"],
    Biosimilar: ["#166534", "#bbf7d0"],
  }[label] || ["#6b7280", "#f3f4f6"];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 8,
        color: cfg[0],
        background: cfg[1],
        border: `1px solid ${cfg[0]}33`,
        marginLeft: 6,
      }}
    >
      {label}
    </span>
  );
}

// ── External reference links (Staff/Admin) ────────────────────────────────
const FDA_BASE = "https://lmspiq.fda.gov.tw/web/DRPIQ/DRPIQ1000Result?licId=";
const NHI_PDF =
  "https://info.nhi.gov.tw/api/INAE3000/INAE3000S01/getPDF?DurgFileName=";
const MOHW_TOOL = "https://medstandard.mohw.gov.tw/rx-norm/tool";
const NHI_DB = "https://info.nhi.gov.tw/INAE3000/INAE3000S01";

function ExternalLinks({ drug }) {
  const { isStaff } = useAuth();
  const links = [
    drug.licId && {
      href: FDA_BASE + drug.licId,
      label: "🔗 FDA License",
      tip: "Taiwan FDA drug license details",
    },
    isStaff &&
      drug.nhiPdf && {
        href: NHI_PDF + drug.nhiPdf,
        label: "📋 NHI Reimbursement",
        tip: "NHI reimbursement guideline PDF",
      },
    isStaff && {
      href: MOHW_TOOL,
      label: "🔍 MOHW RxNorm",
      tip: "MOHW RxNorm terminology tool",
    },
    { href: NHI_DB, label: "📊 NHI Drug DB", tip: "NHI drug database" },
  ].filter(Boolean);
  if (!links.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: C.muted,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        External References
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            title={l.tip}
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "5px 10px",
              borderRadius: 7,
              background: "#f0f7ff",
              color: C.primary,
              border: `1px solid ${C.primary}33`,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0f7ff")}
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Therapeutic Alternatives Panel ───────────────────────────────────────
function AlternativesPanel({ drug }) {
  const { isStaff } = useAuth();
  const alts = useMemo(() => findAlternatives(drug), [drug.id, drug.atc]);
  if (!drug.atc || alts.length === 0) return null;
  const atcLabel = drug.atc.slice(0, 5);
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: C.muted,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Therapeutic Alternatives · ATC {atcLabel} ({alts.length} found)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {alts.map((alt) => (
          <div
            key={alt.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              background: "#f8fafc",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 4,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {alt.ingredient}
                </span>
                <DrugClassBadge raw={alt.drugClass} />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {alt.nameEN} · {alt.form} {alt.strength}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
              {isStaff && parseFloat(alt.price) > 0 ? (
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: C.primary }}
                >
                  NT$ {alt.price}
                </div>
              ) : isStaff ? null : (
                <div style={{ fontSize: 11, color: C.muted }}>🔒</div>
              )}
              <div style={{ fontSize: 10, color: C.muted }}>{alt.atc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Drug Search ────────────────────────────────────────────────────────────
function DrugSearch({ addToMyDrugs, initQuery }) {
  const [query, setQuery] = useState(initQuery || "");
  const [results, setResults] = useState(() =>
    initQuery ? searchDrugs(initQuery) : [],
  );
  const [showDD, setShowDD] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reportDrug, setReportDrug] = useState(null);
  const { isStaff } = useAuth();
  const { T } = useLang();
  const wrapRef = useRef();

  useEffect(() => {
    function h(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setShowDD(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function onType(q) {
    setQuery(q);
    setSelected(null);
    const res = q.length >= 1 ? searchDrugs(q) : [];
    setResults(res);
    setShowDD(q.length >= 1 && res.length > 0);
  }
  function pick(drug) {
    setSelected(drug);
    setQuery(drug.nameEN);
    setShowDD(false);
    addHist({
      type: "search",
      query: drug.nameEN,
      result: drug.ingredient,
      score: drug.score,
    });
  }

  const cc = (s) =>
    s >= LOW_CONF ? C.success : s >= 0.55 ? C.warning : C.danger;
  const pct = (s) => Math.round(s * 100);

  return (
    <div>
      {reportDrug && (
        <ReportModal drug={reportDrug} onClose={() => setReportDrug(null)} />
      )}
      <div ref={wrapRef} style={{ position: "relative", marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => onType(e.target.value)}
          onFocus={() =>
            query.length >= 1 && results.length > 0 && setShowDD(true)
          }
          placeholder={T.searchPlaceholder}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 15,
            borderRadius: 10,
            fontFamily: "inherit",
            border: `1px solid ${showDD ? C.primary : C.border}`,
            outline: "none",
            boxShadow: "0 1px 4px rgba(0,0,0,.08)",
          }}
        />

        {showDD && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 200,
              background: "#fff",
              border: `1px solid ${C.border}`,
              borderTop: "none",
              borderRadius: "0 0 10px 10px",
              boxShadow: "0 8px 24px rgba(0,0,0,.12)",
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {results.slice(0, 6).map((d, i) => (
              <div
                key={d.id}
                onMouseDown={() => pick(d)}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom:
                    i < Math.min(results.length, 6) - 1
                      ? `1px solid ${C.border}`
                      : "none",
                  background: "#fff",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f0f7ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {d.ingredient}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {d.nameEN} · {d.nameZH}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: cc(d.score) + "20",
                    color: cc(d.score),
                  }}
                >
                  {pct(d.score)}%
                </span>
              </div>
            ))}
            {results.length > 6 && (
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  color: C.muted,
                  textAlign: "center",
                }}
              >
                {results.length - 6} {T.moreKeepTyping}
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <BrandDetailModal
          brand={selected}
          isStaff={isStaff}
          addToMyDrugs={addToMyDrugs}
          priceLow={0}
          priceHigh={0}
          onClose={() => setSelected(null)}
        />
      )}
      {results.length > 0 && !showDD ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {results.map((d) => (
            <Card
              key={d.id}
              style={{ cursor: "pointer" }}
              onClick={() => pick(d)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      {d.ingredient}
                    </span>
                    <DrugClassBadge raw={d.drugClass} />
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                    {d.nameEN} · {d.nameZH}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    {d.id} · ATC: {d.atc} · {d.form}
                    {isStaff && parseFloat(d.price) > 0 && ` · NT$ ${d.price}`}
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    background: cc(d.score) + "22",
                    color: cc(d.score),
                    border: `2px solid ${cc(d.score)}`,
                    flexShrink: 0,
                    marginLeft: 12,
                  }}
                >
                  {pct(d.score)}%
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : query.length >= 2 && !showDD ? (
        <Card style={{ textAlign: "center", color: C.muted, padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
          <div>
            No drugs found for "<b>{query}</b>"
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            This would be flagged for admin review in production.
          </div>
        </Card>
      ) : !query ? (
        <Card style={{ color: C.muted, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💊</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Search the NHI Drug Dictionary
          </div>
          <div style={{ fontSize: 13 }}>
            Try: "magnesium", "氧化鎂", "metformin", "A024806100", "A02AA02"
          </div>
        </Card>
      ) : null}
    </div>
  );
}

// ── Ingredient Lookup — Concept Card ─────────────────────────────────────
function ConceptCard({ concept, onClick }) {
  const top = concept.brands.slice(0, 3);
  const { T } = useLang();
  return (
    <Card style={{ cursor: "pointer" }} onClick={onClick}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 5 }}>
            {concept.ingredient}
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 7,
            }}
          >
            {concept.atc && (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  fontWeight: 700,
                }}
              >
                ATC: {concept.atc}
              </span>
            )}
            {concept.atcCategory && (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "#f3f4f6",
                  color: "#6b7280",
                }}
              >
                {concept.atcCategory}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
            {top.map((b) => b.nameEN).join(" · ")}
            {concept.brandCount > 3 && (
              <span style={{ color: C.primary }}>
                {" "}
                +{concept.brandCount - 3} {T.moreCount}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "#EBF5EE",
            borderRadius: 12,
            padding: "8px 14px",
            flexShrink: 0,
            minWidth: 52,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: C.primary,
              lineHeight: 1,
            }}
          >
            {concept.brandCount}
          </span>
          <span
            style={{
              fontSize: 10,
              color: C.muted,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {T.brandsLabel}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── Image Lightbox ────────────────────────────────────────────────────────
function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    function h(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "zoom-out",
        padding: 24,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: "88vw",
          maxHeight: "88vh",
          objectFit: "contain",
          borderRadius: 16,
          boxShadow: "0 16px 64px rgba(0,0,0,.6)",
          background: "#fff",
          padding: 12,
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(255,255,255,.15)",
          border: "1px solid rgba(255,255,255,.3)",
          color: "#fff",
          fontSize: 22,
          width: 44,
          height: 44,
          borderRadius: 22,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── Clinical Info Database ────────────────────────────────────────────────
// Keyed by ingredient.toLowerCase() or ATC-5 prefix; lookup tries both.
const CLINICAL_INFO = {
  acetaminophen: {
    genericZH: "乙醯胺酚（Acetaminophen / Paracetamol）",
    indicationZH: "緩解輕至中度疼痛（頭痛、牙痛、肌肉痛、關節痛）及退燒。",
    indicationEN:
      "Relief of mild to moderate pain (headache, toothache, muscle pain, joint pain) and fever.",
    usageZH:
      "成人每次 500–1000 mg，每 4–6 小時，每日上限 4000 mg。可空腹服用。",
    usageEN:
      "Adults: 500–1000 mg every 4–6 hours; max 4000 mg/day. May be taken with or without food.",
    adverseZH:
      "一般耐受性良好。過量可致嚴重肝損傷。罕見：過敏反應（皮疹）、血液異常。",
    adverseEN:
      "Generally well tolerated. Overdose may cause severe hepatotoxicity. Rare: hypersensitivity reactions, blood dyscrasias.",
    contraindicationZH: "對乙醯胺酚過敏者。嚴重肝功能不全者。",
    contraindicationEN:
      "Hypersensitivity to acetaminophen. Severe hepatic impairment.",
    precautionZH:
      "肝臟疾病患者及長期大量飲酒者應減量或避免使用。注意複方製劑中的累計劑量，避免超量。",
    precautionEN:
      "Reduce dose or avoid in hepatic disease and chronic alcoholism. Monitor cumulative dose from all acetaminophen-containing products.",
    interactionZH:
      "酒精（肝毒性↑）；Warfarin 長期高劑量可能使 INR 升高；Isoniazid（肝毒性↑）。",
    interactionEN:
      "Alcohol (↑hepatotoxicity); Warfarin chronic high-dose (may ↑INR); Isoniazid (↑hepatotoxicity).",
    storageZH: "室溫 15–30°C，避光防潮，置於兒童不易取得處。",
    storageEN:
      "Store at 15–30°C; protect from light and moisture; keep out of reach of children.",
  },
  ibuprofen: {
    genericZH: "布洛芬（Ibuprofen）",
    indicationZH:
      "緩解輕至中度疼痛（頭痛、經痛、牙痛、肌肉痛）、退燒及關節炎症狀改善。",
    indicationEN:
      "Relief of mild to moderate pain (headache, dysmenorrhea, toothache, muscle pain), fever, and arthritis symptoms.",
    usageZH:
      "成人每次 200–400 mg，每 4–6 小時，每日上限 1200 mg（OTC）或 2400 mg（處方）。隨餐或飯後服用以減少胃部不適。",
    usageEN:
      "Adults: 200–400 mg every 4–6 hours; max 1200 mg/day (OTC) or 2400 mg/day (prescription). Take with food to reduce GI upset.",
    adverseZH:
      "常見：胃部不適、噁心、消化不良。嚴重：胃腸出血、消化性潰瘍、腎功能損傷、心血管事件（長期高劑量）。",
    adverseEN:
      "Common: GI upset, nausea, dyspepsia. Serious: GI bleeding, peptic ulcer, renal impairment, cardiovascular events (long-term high-dose).",
    contraindicationZH:
      "對 NSAIDs 或 Aspirin 過敏；活動性消化性潰瘍或出血；嚴重心衰、腎衰、肝衰；妊娠 28 週後。",
    contraindicationEN:
      "NSAID or aspirin allergy; active peptic ulcer or GI bleeding; severe cardiac, renal, or hepatic failure; pregnancy ≥28 weeks.",
    precautionZH:
      "老年人、腎功能不全者、高血壓、心臟病患者慎用。避免長期使用。定期監測腎功能。",
    precautionEN:
      "Use with caution in elderly, renal impairment, hypertension, and cardiac disease. Avoid long-term use. Monitor renal function periodically.",
    interactionZH:
      "Aspirin（抗血小板作用相互干擾）；Warfarin（出血風險↑）；ACE 抑制劑（腎功能影響）；利尿劑（療效↓）；Lithium（血中濃度升高）。",
    interactionEN:
      "Aspirin (antagonizes antiplatelet effect); Warfarin (↑bleeding risk); ACE inhibitors (↓antihypertensive effect, renal impairment); diuretics (↓efficacy); Lithium (↑serum levels).",
    storageZH: "室溫 15–30°C，避光保存。",
    storageEN: "Store at 15–30°C; protect from light.",
  },
  diclofenac: {
    genericZH: "雙氯芬酸（Diclofenac）",
    indicationZH:
      "關節炎（骨關節炎、類風濕關節炎）、術後疼痛、急性痛風發作及各類疼痛症狀。",
    indicationEN:
      "Arthritis (osteoarthritis, rheumatoid arthritis), postoperative pain, acute gout, and various pain syndromes.",
    usageZH:
      "口服劑型成人每次 50 mg，每日 2–3 次；緩釋劑型每日 100 mg。隨餐服用。",
    usageEN:
      "Oral (immediate-release): 50 mg 2–3 times daily; sustained-release: 100 mg once daily. Take with food.",
    adverseZH:
      "胃腸不適（常見）、轉胺酶升高（需監測）、水腫。嚴重：消化性潰瘍、肝毒性、心血管事件。",
    adverseEN:
      "GI discomfort (common), elevated liver enzymes (monitor), edema. Serious: peptic ulcer, hepatotoxicity, cardiovascular events.",
    contraindicationZH:
      "對 NSAIDs 過敏；活動性消化性潰瘍；嚴重心衰、肝衰、腎衰；妊娠後期。",
    contraindicationEN:
      "NSAID allergy; active peptic ulcer; severe cardiac, hepatic, or renal failure; late pregnancy.",
    precautionZH:
      "定期監測肝功能（長期用藥）。老年人、腎功能不全者慎用。血壓監測。",
    precautionEN:
      "Monitor liver function with long-term use. Use with caution in elderly and renal impairment. Monitor blood pressure.",
    interactionZH:
      "Warfarin（出血風險↑）；Lithium（血中濃度升高）；降壓藥（療效可能降低）；Methotrexate（毒性增加）。",
    interactionEN:
      "Warfarin (↑bleeding risk); Lithium (↑serum levels); antihypertensives (↓efficacy); Methotrexate (↑toxicity).",
    storageZH: "室溫 15–30°C，避光防潮。",
    storageEN: "Store at 15–30°C; protect from light and moisture.",
  },
  celecoxib: {
    genericZH: "塞來昔布（Celecoxib）",
    indicationZH:
      "骨關節炎、類風濕關節炎、強直性脊椎炎的症狀緩解；急性疼痛（如術後）。",
    indicationEN:
      "Symptom relief in osteoarthritis, rheumatoid arthritis, ankylosing spondylitis; acute pain (e.g., postoperative).",
    usageZH:
      "骨關節炎每日 200 mg（單次或分兩次）；類風濕關節炎 100–200 mg 每日兩次。",
    usageEN:
      "Osteoarthritis: 200 mg once daily or 100 mg twice daily. Rheumatoid arthritis: 100–200 mg twice daily.",
    adverseZH:
      "胃腸不適（較傳統 NSAIDs 少）。嚴重：心血管事件（增加風險）、腎功能損傷、過敏反應。",
    adverseEN:
      "GI discomfort (less than conventional NSAIDs). Serious: cardiovascular events (increased risk), renal impairment, hypersensitivity reactions.",
    contraindicationZH:
      "磺醯胺類藥物過敏；NSAIDs 或 Aspirin 誘發的過敏；嚴重心衰；冠狀動脈繞道手術圍術期。",
    contraindicationEN:
      "Sulfonamide allergy; NSAID or aspirin-induced allergy; severe heart failure; perioperative CABG surgery.",
    precautionZH:
      "心血管高風險患者使用最低有效劑量、最短時間。定期監測血壓與腎功能。",
    precautionEN:
      "Use the lowest effective dose for the shortest duration in high CV-risk patients. Monitor blood pressure and renal function periodically.",
    interactionZH:
      "Warfarin（INR 升高風險）；ACE 抑制劑（腎功能影響）；Lithium（血中濃度升高）；Fluconazole（Celecoxib 血中濃度升高）。",
    interactionEN:
      "Warfarin (↑INR risk); ACE inhibitors (renal impairment); Lithium (↑serum levels); Fluconazole (↑celecoxib levels).",
    storageZH: "室溫 25°C 以下保存。",
    storageEN: "Store below 25°C.",
  },
  naproxen: {
    genericZH: "萘普生（Naproxen）",
    indicationZH: "關節炎、急性痛風、肌腱炎、滑囊炎及各類疼痛與退燒。",
    indicationEN:
      "Arthritis, acute gout, tendinitis, bursitis, and general pain and fever.",
    usageZH: "成人每次 250–500 mg，每 8–12 小時，每日上限 1250 mg。隨餐服用。",
    usageEN:
      "Adults: 250–500 mg every 8–12 hours; max 1250 mg/day. Take with food.",
    adverseZH: "胃腸不適、頭暈。嚴重：消化性潰瘍、腎功能損傷、心血管事件。",
    adverseEN:
      "GI discomfort, dizziness. Serious: peptic ulcer, renal impairment, cardiovascular events.",
    contraindicationZH:
      "NSAIDs 過敏；活動性消化性潰瘍；嚴重心衰、腎衰；妊娠後期。",
    contraindicationEN:
      "NSAID allergy; active peptic ulcer; severe cardiac or renal failure; late pregnancy.",
    precautionZH:
      "老年人慎用。腎功能不全患者調整劑量。長期用藥監測腎功能與血壓。",
    precautionEN:
      "Use with caution in elderly. Adjust dose in renal impairment. Monitor renal function and blood pressure with long-term use.",
    interactionZH: "與其他 NSAIDs、Warfarin、SSRIs 合用增加出血風險。",
    interactionEN:
      "Concomitant use with other NSAIDs, Warfarin, or SSRIs increases bleeding risk.",
    storageZH: "室溫 15–30°C，避光保存。",
    storageEN: "Store at 15–30°C; protect from light.",
  },
  aspirin: {
    genericZH: "阿司匹林／乙醯水楊酸（Aspirin）",
    indicationZH:
      "低劑量（75–100 mg）：抗血小板、預防心肌梗塞及缺血性腦中風。中高劑量：退燒止痛、抗炎。",
    indicationEN:
      "Low-dose (75–100 mg): antiplatelet, prevention of MI and ischemic stroke. Higher doses: antipyretic, analgesic, anti-inflammatory.",
    usageZH:
      "抗血板：每日 75–100 mg，飯後服用。解熱鎮痛：成人每次 500–1000 mg，每 4–6 小時。",
    usageEN:
      "Antiplatelet: 75–100 mg once daily after meals. Antipyretic/analgesic: 500–1000 mg every 4–6 hours in adults.",
    adverseZH:
      "胃腸不適（常見）、出血（胃腸道、顱內）。高劑量：Reye 症候群（兒童避免使用）、耳鳴。",
    adverseEN:
      "GI upset (common), bleeding (GI, intracranial). High-dose: Reye's syndrome (avoid in children), tinnitus.",
    contraindicationZH:
      "對 Aspirin 或 NSAIDs 過敏；活動性消化性潰瘍；出血傾向；兒童（Reye 症候群風險）；妊娠後期。",
    contraindicationEN:
      "Aspirin or NSAID allergy; active peptic ulcer; bleeding disorders; children (Reye's syndrome risk); late pregnancy.",
    precautionZH:
      "長期低劑量使用前評估出血風險。術前可能需停藥。老年人消化道保護（考慮 PPI 合用）。",
    precautionEN:
      "Assess bleeding risk before initiating long-term low-dose therapy. May need to hold before surgery. Consider PPI co-therapy in elderly for GI protection.",
    interactionZH:
      "Warfarin（出血風險↑）；NSAIDs（相互干擾、胃腸不良反應↑）；Heparin（出血風險↑）；Methotrexate（毒性↑）。",
    interactionEN:
      "Warfarin (↑bleeding risk); NSAIDs (mutual antagonism, ↑GI ADRs); Heparin (↑bleeding risk); Methotrexate (↑toxicity).",
    storageZH: "室溫 15–30°C，乾燥保存，避免受潮分解。",
    storageEN:
      "Store at 15–30°C in a dry place; protect from moisture to prevent decomposition.",
  },
  amoxicillin: {
    genericZH: "阿莫西林（Amoxicillin）",
    indicationZH:
      "中耳炎、鼻竇炎、咽炎、肺炎、泌尿道感染、Hp 根除（合併療法）等細菌感染。",
    indicationEN:
      "Otitis media, sinusitis, pharyngitis, pneumonia, UTIs, H. pylori eradication (combination therapy), and other bacterial infections.",
    usageZH:
      "成人一般 250–500 mg 每 8 小時或 500–875 mg 每 12 小時。療程 7–14 天。可與食物同服。",
    usageEN:
      "Adults: 250–500 mg every 8 hours or 500–875 mg every 12 hours. Course 7–14 days. May be taken with food.",
    adverseZH:
      "常見：腹瀉、噁心、皮疹。嚴重：過敏反應（包括 Anaphylaxis）、C. difficile 腸炎、肝毒性（罕見）。",
    adverseEN:
      "Common: diarrhea, nausea, rash. Serious: hypersensitivity reactions (including anaphylaxis), C. difficile colitis, hepatotoxicity (rare).",
    contraindicationZH:
      "對 Penicillin 或 β-lactam 類抗生素嚴重過敏者（如過敏性休克病史）。",
    contraindicationEN:
      "Severe hypersensitivity to penicillin or β-lactam antibiotics (e.g., history of anaphylaxis).",
    precautionZH:
      "Penicillin 輕度過敏史者謹慎（有交叉過敏風險）。腎功能不全者調整劑量。",
    precautionEN:
      "Use with caution in mild penicillin allergy (cross-reactivity risk). Adjust dose in renal impairment.",
    interactionZH:
      "Warfarin（INR 可能升高，需監測）；口服避孕藥（療效略降，建議備用避孕措施）；Methotrexate（腎排除↓）。",
    interactionEN:
      "Warfarin (↑INR, monitor); oral contraceptives (slightly ↓efficacy, use backup method); Methotrexate (↓renal clearance).",
    storageZH: "膠囊室溫保存；懸浮液調配後冷藏（2–8°C），14 天內使用完畢。",
    storageEN:
      "Capsules: store at room temperature. Suspension: refrigerate (2–8°C) after reconstitution; use within 14 days.",
  },
  azithromycin: {
    genericZH: "阿奇黴素（Azithromycin）",
    indicationZH:
      "社區性肺炎、咽喉炎、皮膚軟組織感染、非淋菌性尿道炎、砂眼披衣菌感染。",
    indicationEN:
      "Community-acquired pneumonia, pharyngitis, skin and soft tissue infections, non-gonococcal urethritis, chlamydial infection.",
    usageZH:
      "成人首日 500 mg，第 2–5 日每日 250 mg；或單次 1000 mg（非淋菌性尿道炎）。可空腹或隨餐服用。",
    usageEN:
      "Adults: 500 mg on day 1, then 250 mg daily on days 2–5; or 1000 mg single dose (non-gonococcal urethritis). May be taken with or without food.",
    adverseZH:
      "常見：腹瀉、噁心、腹痛。嚴重：QT 延長（心律不整風險）、C. difficile 腸炎、肝毒性。",
    adverseEN:
      "Common: diarrhea, nausea, abdominal pain. Serious: QT prolongation (arrhythmia risk), C. difficile colitis, hepatotoxicity.",
    contraindicationZH:
      "對 Azithromycin 或其他大環內酯類過敏；已知 QT 延長或低血鉀患者慎用。",
    contraindicationEN:
      "Hypersensitivity to azithromycin or other macrolides; known QT prolongation or hypokalemia (use with caution).",
    precautionZH: "心臟病（QT 延長）患者特別謹慎。避免合用其他 QT 延長藥物。",
    precautionEN:
      "Use with particular caution in cardiac patients (QT prolongation risk). Avoid combination with other QT-prolonging drugs.",
    interactionZH:
      "Antacids（吸收↓，間隔 2 小時）；QT 延長藥物（如 Amiodarone、Haloperidol），風險加成；Warfarin（INR 升高）。",
    interactionEN:
      "Antacids (↓absorption, separate by 2 hours); QT-prolonging drugs (e.g., Amiodarone, Haloperidol — additive risk); Warfarin (↑INR).",
    storageZH: "室溫 15–30°C 保存。懸浮液調配後冷藏，10 天內使用。",
    storageEN:
      "Store at 15–30°C. Suspension: refrigerate after reconstitution; use within 10 days.",
  },
  ciprofloxacin: {
    genericZH: "環丙沙星（Ciprofloxacin）",
    indicationZH:
      "泌尿道感染（含複雜型）、腸胃炎、骨關節感染、肺炎、皮膚感染及腸道沙門氏菌感染。",
    indicationEN:
      "UTIs (including complicated), GI infections, bone and joint infections, pneumonia, skin infections, enteric Salmonella.",
    usageZH:
      "成人 250–750 mg 每 12 小時。不應與含鈣、鎂、鋁的制酸劑、鐵劑同時服用（間隔 2 小時）。",
    usageEN:
      "Adults: 250–750 mg every 12 hours. Do not take simultaneously with calcium-, magnesium-, or aluminum-containing antacids or iron supplements (separate by 2 hours).",
    adverseZH:
      "噁心、腹瀉、頭痛。嚴重：肌腱炎／斷裂（尤其老年、腎衰、合用類固醇者）、QT 延長、周邊神經病變。",
    adverseEN:
      "Nausea, diarrhea, headache. Serious: tendinitis/tendon rupture (especially elderly, renal failure, corticosteroid users), QT prolongation, peripheral neuropathy.",
    contraindicationZH:
      "對喹諾酮類藥物過敏；18 歲以下（除特定適應症外）；妊娠及哺乳。",
    contraindicationEN:
      "Hypersensitivity to quinolones; children under 18 (except specific indications); pregnancy and breastfeeding.",
    precautionZH:
      "年長者及腎功能不全者調整劑量。如出現肌腱疼痛應立即停藥。避免強烈日曬（光敏感）。",
    precautionEN:
      "Adjust dose in elderly and renal impairment. Discontinue immediately if tendon pain occurs. Avoid intense sun exposure (photosensitivity).",
    interactionZH:
      "Antacids、鐵劑、鋅（吸收↓）；Warfarin（INR 升高）；Theophylline（血中濃度升高、毒性）；NSAIDs（癲癇閾值降低）。",
    interactionEN:
      "Antacids, iron, zinc (↓absorption); Warfarin (↑INR); Theophylline (↑serum levels, toxicity); NSAIDs (↓seizure threshold).",
    storageZH: "室溫 15–30°C，避光保存。",
    storageEN: "Store at 15–30°C; protect from light.",
  },
  metronidazole: {
    genericZH: "甲硝唑（Metronidazole）",
    indicationZH:
      "厭氧菌感染（腹腔、婦科、骨盆腔炎）；C. difficile 腸炎；寄生蟲感染（阿米巴病、滴蟲病）；H. pylori 根除。",
    indicationEN:
      "Anaerobic bacterial infections (abdominal, gynecologic, pelvic); C. difficile colitis; parasitic infections (amebiasis, trichomoniasis); H. pylori eradication.",
    usageZH:
      "成人 250–500 mg 每 8 小時（口服）。療程視感染種類。隨餐服用以減少噁心。",
    usageEN:
      "Adults: 250–500 mg every 8 hours (oral). Duration depends on infection type. Take with food to reduce nausea.",
    adverseZH: "噁心、金屬異味感、頭痛（常見）。長期使用：周邊神經病變、癲癇。",
    adverseEN:
      "Common: nausea, metallic taste, headache. Long-term: peripheral neuropathy, seizures.",
    contraindicationZH:
      "對 Metronidazole 或硝基咪唑類藥物過敏；妊娠早期（前 3 個月）；與酒精合用。",
    contraindicationEN:
      "Hypersensitivity to metronidazole or nitroimidazoles; first trimester of pregnancy; concurrent alcohol use.",
    precautionZH:
      "治療期間及療程結束後 48 小時禁酒（Disulfiram 樣反應）。嚴重肝臟疾病者減量。",
    precautionEN:
      "Avoid alcohol during treatment and for 48 hours after completing the course (disulfiram-like reaction). Reduce dose in severe hepatic disease.",
    interactionZH:
      "酒精（嚴重 Disulfiram 樣反應：嘔吐、潮紅）；Warfarin（INR 大幅升高）；Lithium（腎毒性↑）；Phenytoin（血中濃度改變）。",
    interactionEN:
      "Alcohol (severe disulfiram-like reaction: vomiting, flushing); Warfarin (markedly ↑INR); Lithium (↑nephrotoxicity); Phenytoin (altered serum levels).",
    storageZH: "室溫 15–30°C，避光保存。",
    storageEN: "Store at 15–30°C; protect from light.",
  },
  amlodipine: {
    genericZH: "氨氯地平（Amlodipine）",
    indicationZH:
      "高血壓（可單用或合用）；穩定型心絞痛及血管痙攣性心絞痛（Prinzmetal）。",
    indicationEN:
      "Hypertension (alone or in combination); stable angina and vasospastic angina (Prinzmetal's).",
    usageZH:
      "初始 5 mg 每日一次；依療效調整至 10 mg/日。降壓效果於 7–14 天後達穩態。可在任何時間服用。",
    usageEN:
      "Start at 5 mg once daily; adjust to 10 mg/day as needed. Antihypertensive effect reaches steady state after 7–14 days. May be taken at any time.",
    adverseZH:
      "踝部水腫（常見，尤其高劑量）、潮紅、頭痛、頭暈。心跳加速（反射性）。嚴重不良反應少見。",
    adverseEN:
      "Ankle edema (common, especially at high doses), flushing, headache, dizziness. Reflex tachycardia. Serious adverse effects are rare.",
    contraindicationZH: "對二氫吡啶類 Ca²⁺ 拮抗劑過敏；嚴重主動脈瓣狹窄。",
    contraindicationEN:
      "Hypersensitivity to dihydropyridine calcium channel blockers; severe aortic stenosis.",
    precautionZH:
      "嚴重肝功能不全者從低劑量起始。老年人起始 2.5 mg。心衰患者謹慎（雖較安全）。",
    precautionEN:
      "Start at low dose in severe hepatic impairment. Start at 2.5 mg in elderly. Use with caution in heart failure.",
    interactionZH:
      "CYP3A4 抑制劑如 Clarithromycin、Itraconazole（Amlodipine 血中濃度升高）；Simvastatin（肌肉毒性↑，Simvastatin 限 20 mg/日）。",
    interactionEN:
      "CYP3A4 inhibitors (Clarithromycin, Itraconazole: ↑amlodipine levels); Simvastatin (↑myotoxicity — limit simvastatin to 20 mg/day).",
    storageZH: "室溫 15–30°C，避光保存。",
    storageEN: "Store at 15–30°C; protect from light.",
  },
  losartan: {
    genericZH: "氯沙坦（Losartan）",
    indicationZH:
      "高血壓；高血壓合併第二型糖尿病之腎病變（延緩進展）；心衰（對 ACE 抑制劑不耐受者）。",
    indicationEN:
      "Hypertension; type 2 diabetic nephropathy (to slow progression); heart failure (in patients intolerant to ACE inhibitors).",
    usageZH: "初始 50 mg 每日一次；依療效調整至 100 mg/日。可隨餐或空腹服用。",
    usageEN:
      "Start at 50 mg once daily; adjust to 100 mg/day as needed. May be taken with or without food.",
    adverseZH:
      "頭暈（初期）、高血鉀（腎功能不全或合用 K⁺ 節省劑）。比 ACE 抑制劑較少引起乾咳。",
    adverseEN:
      "Dizziness (initial), hyperkalemia (in renal impairment or with K+-sparing agents). Less likely to cause dry cough than ACE inhibitors.",
    contraindicationZH:
      "對 Losartan 過敏；妊娠（第 2–3 孕期）；嚴重肝功能不全；合用 Aliskiren（糖尿病患者）。",
    contraindicationEN:
      "Hypersensitivity to losartan; pregnancy (2nd–3rd trimester); severe hepatic impairment; concomitant aliskiren in diabetic patients.",
    precautionZH:
      "啟動治療前或治療後監測腎功能、血鉀、血壓。腎動脈狹窄患者慎用。",
    precautionEN:
      "Monitor renal function, serum potassium, and blood pressure before and during treatment. Use with caution in renal artery stenosis.",
    interactionZH:
      "K⁺ 節省性利尿劑、K⁺ 補充劑（高血鉀↑）；NSAIDs（降壓療效↓、腎功能↓）；Lithium（血中濃度升高）。",
    interactionEN:
      "K+-sparing diuretics, potassium supplements (↑hyperkalemia risk); NSAIDs (↓antihypertensive effect, renal impairment); Lithium (↑serum levels).",
    storageZH: "室溫 15–30°C，乾燥保存。",
    storageEN: "Store at 15–30°C; protect from moisture.",
  },
  lisinopril: {
    genericZH: "賴諾普利（Lisinopril）",
    indicationZH:
      "高血壓、心臟衰竭（輔助治療）、急性心肌梗塞後心臟保護、糖尿病腎病變。",
    indicationEN:
      "Hypertension, heart failure (adjunct), cardioprotection after acute MI, diabetic nephropathy.",
    usageZH:
      "高血壓：初始 5–10 mg 每日一次；維持 20–40 mg。心衰：2.5 mg 起始，緩慢增量。",
    usageEN:
      "Hypertension: start at 5–10 mg once daily; maintenance 20–40 mg. Heart failure: start at 2.5 mg, titrate slowly.",
    adverseZH:
      "乾咳（常見，10–15%）、頭暈、高血鉀。嚴重：血管性水腫（立即停藥）、腎功能惡化（腎動脈狹窄）。",
    adverseEN:
      "Dry cough (common, 10–15%), dizziness, hyperkalemia. Serious: angioedema (discontinue immediately), renal deterioration (renal artery stenosis).",
    contraindicationZH:
      "對 ACE 抑制劑過敏；有血管性水腫病史；妊娠；合用 Aliskiren（腎功能不全或糖尿病）。",
    contraindicationEN:
      "ACE inhibitor hypersensitivity; history of angioedema; pregnancy; concomitant aliskiren in renal impairment or diabetes.",
    precautionZH:
      "首劑可能低血壓（特別是脫水患者、心衰）。定期監測腎功能與血鉀。",
    precautionEN:
      "First-dose hypotension risk (especially in dehydration or heart failure). Monitor renal function and serum potassium regularly.",
    interactionZH:
      "K⁺ 節省性利尿劑（高血鉀）；NSAIDs（降壓療效↓）；Lithium（血中濃度↑）；ARBs 或 Aliskiren（不建議三重阻斷）。",
    interactionEN:
      "K+-sparing diuretics (hyperkalemia); NSAIDs (↓antihypertensive effect); Lithium (↑serum levels); ARBs or aliskiren (triple blockade not recommended).",
    storageZH: "室溫 15–30°C，避濕保存。",
    storageEN: "Store at 15–30°C; protect from moisture.",
  },
  enalapril: {
    genericZH: "依那普利（Enalapril）",
    indicationZH: "高血壓、心臟衰竭、無症狀左心室功能障礙、急性心肌梗塞後。",
    indicationEN:
      "Hypertension, heart failure, asymptomatic left ventricular dysfunction, post-acute MI.",
    usageZH:
      "高血壓：初始 5 mg，每日 1–2 次；維持 10–40 mg/日。腎功能不全者調整劑量。",
    usageEN:
      "Hypertension: start at 5 mg once or twice daily; maintenance 10–40 mg/day. Adjust dose in renal impairment.",
    adverseZH:
      "乾咳、頭暈、疲勞、高血鉀。嚴重：血管性水腫、腎功能惡化、低血壓（首劑）。",
    adverseEN:
      "Dry cough, dizziness, fatigue, hyperkalemia. Serious: angioedema, renal deterioration, first-dose hypotension.",
    contraindicationZH: "對 ACE 抑制劑過敏；血管性水腫病史；妊娠。",
    contraindicationEN:
      "ACE inhibitor hypersensitivity; history of angioedema; pregnancy.",
    precautionZH: "首劑低血壓風險（脫水患者）。監測腎功能、血鉀。",
    precautionEN:
      "First-dose hypotension risk (especially in dehydration). Monitor renal function and serum potassium.",
    interactionZH:
      "與 Losartan 相同類別交互作用。K⁺ 節省劑（高血鉀）；NSAIDs（療效↓）。",
    interactionEN:
      "Same drug interactions as Losartan class. K+-sparing agents (hyperkalemia); NSAIDs (↓efficacy).",
    storageZH: "室溫 30°C 以下，避光保存。",
    storageEN: "Store below 30°C; protect from light.",
  },
  metoprolol: {
    genericZH: "美托洛爾（Metoprolol）",
    indicationZH:
      "高血壓、心絞痛、急性心肌梗塞後保護、心衰（Metoprolol succinate）、心律不整（室上心搏過速）。",
    indicationEN:
      "Hypertension, angina, post-MI cardioprotection, heart failure (metoprolol succinate), supraventricular tachycardia.",
    usageZH:
      "高血壓：tartrate 100–200 mg/日，分次服；succinate 25–200 mg 每日一次。隨餐服用。",
    usageEN:
      "Hypertension: tartrate 100–200 mg/day in divided doses; succinate 25–200 mg once daily. Take with food.",
    adverseZH:
      "疲勞、肢端發冷、心跳變慢、性功能障礙。嚴重：支氣管痙攣（氣喘患者）、心衰惡化（快速加量時）。",
    adverseEN:
      "Fatigue, cold extremities, bradycardia, sexual dysfunction. Serious: bronchospasm (in asthma), worsening heart failure (if dose increased too rapidly).",
    contraindicationZH:
      "嚴重心搏徐緩（<45 bpm）、病竇症候群、III 度房室阻斷；失代償心衰；嚴重外周動脈疾病。",
    contraindicationEN:
      "Severe bradycardia (<45 bpm), sick sinus syndrome, 3rd-degree AV block; decompensated heart failure; severe peripheral arterial disease.",
    precautionZH:
      "糖尿病患者低血糖症狀可能被遮蓋。氣喘及 COPD 患者謹慎（選擇性 β1 但高劑量時特異性降低）。停藥應緩慢逐步減量。",
    precautionEN:
      "May mask hypoglycemia symptoms in diabetic patients. Use with caution in asthma/COPD (β1-selectivity lost at high doses). Taper gradually on discontinuation.",
    interactionZH:
      "Verapamil／Diltiazem（心搏徐緩、心臟阻斷風險↑）；Digoxin（心搏徐緩）；CYP2D6 抑制劑如 Paroxetine（Metoprolol 血中濃度↑）。",
    interactionEN:
      "Verapamil/Diltiazem (↑bradycardia and heart block risk); Digoxin (bradycardia); CYP2D6 inhibitors (Paroxetine: ↑metoprolol levels).",
    storageZH: "室溫 15–30°C，乾燥保存。",
    storageEN: "Store at 15–30°C; protect from moisture.",
  },
  bisoprolol: {
    genericZH: "比索洛爾（Bisoprolol）",
    indicationZH:
      "高血壓；穩定型慢性心衰（HFrEF，EF ≤ 40%，與 ACEi/ARB 合用）；心絞痛。",
    indicationEN:
      "Hypertension; stable chronic heart failure (HFrEF, EF ≤ 40%, with ACEi/ARB); angina.",
    usageZH:
      "高血壓：5–20 mg 每日一次。心衰：從 1.25 mg 起始，每 1–2 週倍增至目標 10 mg/日。",
    usageEN:
      "Hypertension: 5–20 mg once daily. Heart failure: start at 1.25 mg; double every 1–2 weeks to target 10 mg/day.",
    adverseZH: "疲勞、肢端發冷、頭暈、心跳變慢。",
    adverseEN: "Fatigue, cold extremities, dizziness, bradycardia.",
    contraindicationZH:
      "急性失代償心衰；嚴重心搏徐緩；嚴重周邊動脈疾病；未控制的支氣管痙攣。",
    contraindicationEN:
      "Acute decompensated heart failure; severe bradycardia; severe peripheral arterial disease; uncontrolled bronchospasm.",
    precautionZH: "同 Metoprolol。心衰患者劑量應緩慢增加。不可突然停藥。",
    precautionEN:
      "Same as Metoprolol. Increase dose slowly in heart failure patients. Do not stop abruptly.",
    interactionZH:
      "Verapamil、Diltiazem（傳導阻斷）；胰島素（低血糖症狀遮蓋）。",
    interactionEN:
      "Verapamil, Diltiazem (conduction block); insulin (masking of hypoglycemia symptoms).",
    storageZH: "室溫 25°C 以下保存。",
    storageEN: "Store below 25°C.",
  },
  carvedilol: {
    genericZH: "卡維地洛（Carvedilol）",
    indicationZH: "慢性心衰（HFrEF）；高血壓；急性心肌梗塞後左心室功能障礙。",
    indicationEN:
      "Chronic heart failure (HFrEF); hypertension; left ventricular dysfunction after acute MI.",
    usageZH:
      "心衰：從 3.125 mg 每日兩次起始，每 2 週倍增至 25–50 mg/日（分兩次）。隨餐服用。",
    usageEN:
      "Heart failure: start at 3.125 mg twice daily; double every 2 weeks up to 25–50 mg/day (in divided doses). Take with food.",
    adverseZH: "頭暈、疲勞、低血壓（尤其首劑）、心搏徐緩、體重增加、水腫。",
    adverseEN:
      "Dizziness, fatigue, hypotension (especially first dose), bradycardia, weight gain, edema.",
    contraindicationZH:
      "急性失代償心衰；嚴重心搏徐緩；肝功能不全；嚴重支氣管痙攣性疾病。",
    contraindicationEN:
      "Acute decompensated heart failure; severe bradycardia; hepatic impairment; severe bronchospastic disease.",
    precautionZH:
      "首劑低血壓：建議隨餐服用、坐姿服藥。劑量緩慢增加。監測心率與血壓。",
    precautionEN:
      "First-dose hypotension: take with food and in a seated position. Increase dose gradually. Monitor heart rate and blood pressure.",
    interactionZH:
      "Amiodarone（心率極度減慢）；Digoxin（血中濃度升高）；Cyclosporin（濃度升高）；Rifampicin（Carvedilol 濃度↓）。",
    interactionEN:
      "Amiodarone (extreme bradycardia); Digoxin (↑serum levels); Cyclosporin (↑cyclosporin levels); Rifampicin (↓carvedilol levels).",
    storageZH: "室溫 25°C 以下，乾燥保存。",
    storageEN: "Store below 25°C in a dry place.",
  },
  atorvastatin: {
    genericZH: "阿托伐他汀（Atorvastatin）",
    indicationZH:
      "高膽固醇血症（原發性及混合型高脂血症）；心血管疾病高風險患者的心血管事件一級與二級預防。",
    indicationEN:
      "Primary and mixed hyperlipidemia; primary and secondary prevention of cardiovascular events in high-risk patients.",
    usageZH: "成人 10–80 mg 每日一次，任何時間服用均可。可與食物同服或空腹。",
    usageEN:
      "Adults: 10–80 mg once daily at any time. May be taken with or without food.",
    adverseZH:
      "肌肉痠痛、疲勞（常見）。嚴重：肌病變（Myopathy）、橫紋肌溶解症（罕見）、肝轉胺酶升高、新發糖尿病（略增）。",
    adverseEN:
      "Muscle aches, fatigue (common). Serious: myopathy, rhabdomyolysis (rare), elevated liver transaminases, slightly increased risk of new-onset diabetes.",
    contraindicationZH:
      "活動性肝臟疾病或不明原因轉胺酶升高 ≥3×ULN；妊娠及哺乳。",
    contraindicationEN:
      "Active liver disease or unexplained transaminase elevation ≥3×ULN; pregnancy and breastfeeding.",
    precautionZH:
      "出現肌肉疼痛、無力應立即就診（CK 監測）。避免大量葡萄柚汁。高強度藥物交互作用時降低劑量。",
    precautionEN:
      "Seek medical attention immediately for muscle pain or weakness (monitor CK). Avoid large quantities of grapefruit juice. Reduce dose with significant drug interactions.",
    interactionZH:
      "CYP3A4 強抑制劑（Itraconazole、Clarithromycin：血中濃度大幅↑）；Amlodipine（肌肉毒性↑，限 40 mg）；Fibrates（Gemfibrozil：橫紋肌溶解風險↑）。",
    interactionEN:
      "Strong CYP3A4 inhibitors (Itraconazole, Clarithromycin: markedly ↑levels); Amlodipine (↑myotoxicity, limit atorvastatin to 40 mg); Fibrates (Gemfibrozil: ↑rhabdomyolysis risk).",
    storageZH: "室溫 20–25°C，乾燥保存。",
    storageEN: "Store at 20–25°C; protect from moisture.",
  },
  simvastatin: {
    genericZH: "辛伐他汀（Simvastatin）",
    indicationZH: "高膽固醇血症、家族性高膽固醇血症；心血管疾病預防。",
    indicationEN:
      "Hyperlipidemia, familial hypercholesterolemia; cardiovascular disease prevention.",
    usageZH: "成人 10–40 mg，每日一次，晚間服用（肝臟膽固醇合成在夜間增加）。",
    usageEN:
      "Adults: 10–40 mg once daily in the evening (hepatic cholesterol synthesis peaks at night).",
    adverseZH:
      "肌肉痠痛、頭痛。嚴重：橫紋肌溶解症（合用特定藥物時風險顯著增加）、肝毒性。",
    adverseEN:
      "Muscle aches, headache. Serious: rhabdomyolysis (risk markedly increased with certain drug combinations), hepatotoxicity.",
    contraindicationZH:
      "活動性肝臟疾病；妊娠及哺乳；合用強 CYP3A4 抑制劑（Itraconazole、HIV 蛋白酶抑制劑等）。",
    contraindicationEN:
      "Active liver disease; pregnancy and breastfeeding; concomitant strong CYP3A4 inhibitors (Itraconazole, HIV protease inhibitors).",
    precautionZH:
      "避免大量葡萄柚汁。與 Amlodipine 合用上限 20 mg；與 Amiodarone 合用上限 20 mg。",
    precautionEN:
      "Avoid large quantities of grapefruit juice. With Amlodipine: limit simvastatin to 20 mg/day; with Amiodarone: limit to 20 mg/day.",
    interactionZH:
      "Amlodipine（肌肉毒性↑，Simvastatin 限 20 mg/日）；Gemfibrozil（嚴重禁忌）；CYP3A4 強抑制劑（血中濃度大幅升高，禁忌合用）。",
    interactionEN:
      "Amlodipine (↑myotoxicity, limit simvastatin to 20 mg/day); Gemfibrozil (seriously contraindicated); strong CYP3A4 inhibitors (markedly ↑levels — contraindicated).",
    storageZH: "室溫 5–30°C，乾燥避光。",
    storageEN: "Store at 5–30°C; protect from light and moisture.",
  },
  rosuvastatin: {
    genericZH: "瑞舒伐他汀（Rosuvastatin）",
    indicationZH:
      "高膽固醇血症；心血管疾病預防；家族性高膽固醇血症（含雜合子及純合子型）。",
    indicationEN:
      "Hyperlipidemia; cardiovascular prevention; familial hypercholesterolemia (including homozygous and heterozygous).",
    usageZH:
      "成人 5–40 mg 每日一次，任何時間服用。亞洲人一般從 5 mg 起始（PK 差異）。",
    usageEN:
      "Adults: 5–40 mg once daily at any time. Asian patients generally start at 5 mg (pharmacokinetic differences).",
    adverseZH:
      "肌肉痠痛、頭痛、腹部不適。嚴重：橫紋肌溶解症（高劑量、特別是 40 mg）、蛋白尿（監測）。",
    adverseEN:
      "Muscle aches, headache, abdominal discomfort. Serious: rhabdomyolysis (at high doses, especially 40 mg), proteinuria (monitor).",
    contraindicationZH:
      "活動性肝臟疾病；eGFR < 30（40 mg 劑量禁用）；妊娠及哺乳。",
    contraindicationEN:
      "Active liver disease; eGFR < 30 (40 mg dose contraindicated); pregnancy and breastfeeding.",
    precautionZH:
      "腎功能不全、甲狀腺功能低下者肌肉毒性風險增加。40 mg 劑量僅限無法達到 LDL 目標者。",
    precautionEN:
      "Increased myotoxicity risk in renal impairment and hypothyroidism. 40 mg dose reserved for patients unable to reach LDL target on lower doses.",
    interactionZH:
      "Cyclosporin（大幅升高血中濃度，限 5 mg）；Gemfibrozil（濃度升高 1.9 倍）；Antacids（含 Mg/Al，吸收↓）。",
    interactionEN:
      "Cyclosporin (markedly ↑levels, limit to 5 mg/day); Gemfibrozil (1.9× ↑levels); antacids containing Mg/Al (↓absorption).",
    storageZH: "室溫 15–30°C，乾燥保存。",
    storageEN: "Store at 15–30°C; protect from moisture.",
  },
  metformin: {
    genericZH: "二甲雙胍（Metformin）",
    indicationZH:
      "第二型糖尿病的第一線口服降血糖藥（特別是體重過重患者）；與其他降血糖藥合用。",
    indicationEN:
      "First-line oral antidiabetic for type 2 diabetes (especially in overweight patients); use in combination with other antidiabetics.",
    usageZH:
      "初始 500 mg 每日兩次或 850 mg 每日一次，隨餐服用。依耐受性與血糖控制逐步調整，最大劑量 2550 mg/日。",
    usageEN:
      "Start at 500 mg twice daily or 850 mg once daily with food. Titrate gradually based on tolerability and glycemic control; max 2550 mg/day.",
    adverseZH:
      "常見：噁心、腹瀉、腹脹、金屬異味感（初期，隨餐服用可減少）。嚴重（罕見）：乳酸酸中毒（腎功能嚴重不全時）。",
    adverseEN:
      "Common: nausea, diarrhea, bloating, metallic taste (especially initially; reduced by taking with food). Rare but serious: lactic acidosis (in severe renal impairment).",
    contraindicationZH:
      "eGFR < 30 mL/min；急性代謝性酸中毒（包括糖尿病酮症酸中毒）；碘造影劑使用前後暫停（eGFR 30–60 者）。",
    contraindicationEN:
      "eGFR < 30 mL/min; acute metabolic acidosis (including diabetic ketoacidosis); hold before iodinated contrast agents in patients with eGFR 30–60.",
    precautionZH:
      "定期監測腎功能（至少每年）。外科手術或禁食前暫停。維生素 B12 長期服用可能使血中濃度降低。",
    precautionEN:
      "Monitor renal function at least annually. Hold before surgery or fasting. Long-term use may reduce vitamin B12 levels.",
    interactionZH:
      "酒精（乳酸酸中毒風險↑）；含碘顯影劑（暫停 Metformin）；Cimetidine（血中濃度升高）；Topiramate（乳酸酸中毒風險↑）。",
    interactionEN:
      "Alcohol (↑lactic acidosis risk); iodinated contrast media (hold metformin); Cimetidine (↑metformin levels); Topiramate (↑lactic acidosis risk).",
    storageZH: "室溫 15–30°C，乾燥保存。",
    storageEN: "Store at 15–30°C; protect from moisture.",
  },
  glipizide: {
    genericZH: "格列吡嗪（Glipizide）",
    indicationZH: "第二型糖尿病（飲食控制不佳時的輔助治療）。",
    indicationEN:
      "Type 2 diabetes mellitus (as adjunct when diet alone is inadequate).",
    usageZH:
      "初始 5 mg，餐前 30 分鐘服用；依血糖調整，最大 40 mg/日（>15 mg 分次服）。",
    usageEN:
      "Start at 5 mg 30 minutes before meals; adjust to 5–40 mg/day based on blood glucose (doses >15 mg in divided doses).",
    adverseZH: "低血糖（最重要不良反應）、體重增加、噁心、頭暈。",
    adverseEN:
      "Hypoglycemia (most important ADR), weight gain, nausea, dizziness.",
    contraindicationZH:
      "第一型糖尿病；糖尿病酮症酸中毒；磺醯脲類藥物過敏；嚴重腎衰、肝衰。",
    contraindicationEN:
      "Type 1 diabetes; diabetic ketoacidosis; sulfonylurea hypersensitivity; severe renal or hepatic failure.",
    precautionZH:
      "老年人、腎功能不全者低血糖風險高，慎用或減量。不可跳過正餐。",
    precautionEN:
      "Elderly and renally impaired patients are at high risk for hypoglycemia — use with caution or reduce dose. Never skip meals.",
    interactionZH:
      "Fluconazole（低血糖↑）；β 阻斷劑（遮蓋低血糖症狀）；NSAIDs（低血糖↑）；Rifampicin（效果↓）。",
    interactionEN:
      "Fluconazole (↑hypoglycemia risk); β-blockers (mask hypoglycemia symptoms); NSAIDs (↑hypoglycemia); Rifampicin (↓efficacy).",
    storageZH: "室溫 15–30°C，乾燥保存。",
    storageEN: "Store at 15–30°C; protect from moisture.",
  },
  sitagliptin: {
    genericZH: "西格列汀（Sitagliptin）",
    indicationZH: "第二型糖尿病（單用或合用 Metformin、磺醯脲類等）。",
    indicationEN:
      "Type 2 diabetes mellitus (alone or in combination with Metformin, sulfonylureas, etc.).",
    usageZH:
      "100 mg 每日一次，腎功能不全者調整劑量（eGFR 30–45：50 mg；< 30：25 mg）。可與食物同服。",
    usageEN:
      "100 mg once daily; adjust for renal impairment (eGFR 30–45: 50 mg; <30: 25 mg). May be taken with or without food.",
    adverseZH:
      "鼻咽炎、頭痛（常見）。罕見：急性胰臟炎（就醫監測腹痛）、關節痛。",
    adverseEN:
      "Nasopharyngitis, headache (common). Rare: acute pancreatitis (seek attention for abdominal pain), arthralgia.",
    contraindicationZH:
      "第一型糖尿病；糖尿病酮症酸中毒；對 Sitagliptin 嚴重過敏（含過敏性休克）。",
    contraindicationEN:
      "Type 1 diabetes; diabetic ketoacidosis; severe hypersensitivity to sitagliptin (including anaphylaxis).",
    precautionZH: "有胰臟炎病史者謹慎。心衰患者謹慎（部分 DPP-4 抑制劑相關）。",
    precautionEN:
      "Use with caution in patients with a history of pancreatitis. Use with caution in heart failure (DPP-4 inhibitor class concern).",
    interactionZH:
      "與磺醯脲類合用時低血糖風險增加，磺醯脲類應減量。Digoxin 血中濃度略升高。",
    interactionEN:
      "When combined with sulfonylureas, ↑hypoglycemia risk — reduce sulfonylurea dose. Digoxin levels may be slightly elevated.",
    storageZH: "室溫 20°C 以下，乾燥保存。",
    storageEN: "Store below 20°C; protect from moisture.",
  },
  omeprazole: {
    genericZH: "奧美拉唑（Omeprazole）",
    indicationZH:
      "胃食道逆流（GERD）、消化性潰瘍（含 H. pylori 根除）、Zollinger-Ellison 症候群、預防 NSAIDs 相關潰瘍。",
    indicationEN:
      "GERD, peptic ulcer (including H. pylori eradication), Zollinger-Ellison syndrome, prevention of NSAID-associated ulcers.",
    usageZH: "GERD：20–40 mg 每日一次，餐前 30–60 分鐘服用，療程 4–8 週。",
    usageEN:
      "GERD: 20–40 mg once daily, 30–60 minutes before meals; course 4–8 weeks.",
    adverseZH:
      "頭痛、腹瀉、噁心（常見）。長期使用：低鎂血症、維生素 B12 吸收↓、骨折風險略增、C. difficile 腸炎風險↑。",
    adverseEN:
      "Headache, diarrhea, nausea (common). Long-term: hypomagnesemia, ↓vitamin B12 absorption, slightly ↑fracture risk, ↑C. difficile risk.",
    contraindicationZH:
      "對 PPI 或 Benzimidazole 類過敏；合用 Nelfinavir（HIV 蛋白酶抑制劑）。",
    contraindicationEN:
      "Hypersensitivity to PPIs or benzimidazoles; concomitant Nelfinavir (HIV protease inhibitor).",
    precautionZH:
      "應使用最低有效劑量及最短療程。長期使用需定期評估必要性。不應掩蓋惡性疾病症狀。",
    precautionEN:
      "Use the lowest effective dose for the shortest necessary duration. Regularly re-evaluate need for long-term use. Do not mask symptoms of potential malignancy.",
    interactionZH:
      "Clopidogrel（CYP2C19 競爭，抗血板療效可能↓，偏好使用 Pantoprazole）；Methotrexate（清除↓）；Atazanavir（吸收↓）。",
    interactionEN:
      "Clopidogrel (CYP2C19 competition, may ↓antiplatelet efficacy — prefer Pantoprazole); Methotrexate (↓clearance); Atazanavir (↓absorption).",
    storageZH: "室溫 15–30°C，乾燥避光保存（防潮）。",
    storageEN:
      "Store at 15–30°C; keep dry and protect from light (moisture-sensitive).",
  },
  pantoprazole: {
    genericZH: "泮托拉唑（Pantoprazole）",
    indicationZH:
      "GERD、消化性潰瘍、H. pylori 根除合併療法、Zollinger-Ellison 症候群。",
    indicationEN:
      "GERD, peptic ulcer, H. pylori eradication (combination therapy), Zollinger-Ellison syndrome.",
    usageZH: "40 mg 每日一次，餐前服用。嚴重狀況可增至 80 mg/日。",
    usageEN:
      "40 mg once daily before meals. May increase to 80 mg/day in severe cases.",
    adverseZH: "頭痛、腹瀉、腹痛（常見）。長期：低鎂血症、骨折風險略增。",
    adverseEN:
      "Headache, diarrhea, abdominal pain (common). Long-term: hypomagnesemia, slightly ↑fracture risk.",
    contraindicationZH: "對 PPI 過敏；合用 Rilpivirine（HIV 藥物）。",
    contraindicationEN:
      "PPI hypersensitivity; concomitant Rilpivirine (HIV medication).",
    precautionZH:
      "對 Clopidogrel 影響比 Omeprazole 少（CYP2C19 影響較小）。長期使用需定期評估。",
    precautionEN:
      "Less effect on Clopidogrel than Omeprazole (less CYP2C19 inhibition). Regularly re-evaluate need for long-term use.",
    interactionZH:
      "Atazanavir（吸收↓）；Methotrexate（清除↓）；較少影響 Clopidogrel。",
    interactionEN:
      "Atazanavir (↓absorption); Methotrexate (↓clearance); less effect on Clopidogrel than other PPIs.",
    storageZH: "室溫 20–25°C，乾燥保存，原包裝存放。",
    storageEN:
      "Store at 20–25°C; protect from moisture; store in original packaging.",
  },
  esomeprazole: {
    genericZH: "埃索美拉唑（Esomeprazole）",
    indicationZH:
      "GERD（含糜爛性食道炎）；消化性潰瘍；H. pylori 根除合併療法；NSAIDs 相關潰瘍預防。",
    indicationEN:
      "GERD (including erosive esophagitis); peptic ulcer; H. pylori eradication (combination therapy); prevention of NSAID-associated ulcers.",
    usageZH: "GERD：20–40 mg 每日一次，餐前服用。膠囊整顆吞服，勿嚼碎。",
    usageEN:
      "GERD: 20–40 mg once daily before meals. Swallow capsule whole; do not chew or crush.",
    adverseZH: "頭痛、腹瀉、噁心、腹痛。長期使用同 Omeprazole。",
    adverseEN:
      "Headache, diarrhea, nausea, abdominal pain. Long-term effects same as Omeprazole.",
    contraindicationZH: "對 PPI 過敏；合用 Nelfinavir、Rilpivirine。",
    contraindicationEN:
      "PPI hypersensitivity; concomitant Nelfinavir or Rilpivirine.",
    precautionZH: "嚴重肝功能不全最大劑量 20 mg/日。長期用藥定期評估。",
    precautionEN:
      "Max 20 mg/day in severe hepatic impairment. Periodically re-evaluate long-term therapy.",
    interactionZH:
      "Clopidogrel（同 Omeprazole，影響 CYP2C19）；Atazanavir（吸收↓）。",
    interactionEN:
      "Clopidogrel (same as Omeprazole — CYP2C19 interaction); Atazanavir (↓absorption).",
    storageZH: "室溫 30°C 以下，乾燥保存。",
    storageEN: "Store below 30°C; protect from moisture.",
  },
  quetiapine: {
    genericZH: "喹硫平（Quetiapine）",
    indicationZH:
      "思覺失調症；雙極性障礙（躁症、鬱症發作）；重度憂鬱症（輔助治療）。",
    indicationEN:
      "Schizophrenia; bipolar disorder (manic and depressive episodes); major depressive disorder (adjunct therapy).",
    usageZH:
      "思覺失調：從 25–50 mg 每日兩次起始，逐步增量至 300–450 mg/日。可隨餐或空腹服用。",
    usageEN:
      "Schizophrenia: start at 25–50 mg twice daily; titrate to 300–450 mg/day. May be taken with or without food.",
    adverseZH:
      "嗜睡、口乾、頭暈（常見）、體重增加、血糖升高、血脂異常。嚴重：QT 延長、代謝症候群、遲發性運動障礙（長期）。",
    adverseEN:
      "Somnolence, dry mouth, dizziness (common), weight gain, hyperglycemia, dyslipidemia. Serious: QT prolongation, metabolic syndrome, tardive dyskinesia (long-term).",
    contraindicationZH:
      "對 Quetiapine 過敏；合用強 CYP3A4 抑制劑（Itraconazole 等）須謹慎。",
    contraindicationEN:
      "Hypersensitivity to quetiapine; use with strong CYP3A4 inhibitors (e.g., Itraconazole) requires caution.",
    precautionZH:
      "監測血糖、血脂、體重（代謝監測）。老年人使用需謹慎（跌倒風險、心血管事件）。有 QT 延長危險因素者監測心電圖。",
    precautionEN:
      "Monitor blood glucose, lipids, and weight (metabolic monitoring). Use with caution in elderly (fall risk, cardiovascular events). Monitor ECG in patients with QT risk factors.",
    interactionZH:
      "CYP3A4 抑制劑（Clarithromycin、Azole 抗黴菌：血中濃度大幅↑，降低 Quetiapine 劑量）；Phenytoin、Carbamazepine（濃度↓）；QT 延長藥物（風險疊加）。",
    interactionEN:
      "CYP3A4 inhibitors (Clarithromycin, Azole antifungals: markedly ↑levels — reduce quetiapine dose); Phenytoin, Carbamazepine (↓levels); QT-prolonging drugs (additive risk).",
    storageZH: "室溫 25°C 以下，乾燥保存，避光。",
    storageEN: "Store below 25°C in a dry place; protect from light.",
  },
  risperidone: {
    genericZH: "利培酮（Risperidone）",
    indicationZH:
      "思覺失調症；雙極性障礙躁症發作（輔助）；自閉症相關易怒行為（兒童/青少年）。",
    indicationEN:
      "Schizophrenia; bipolar disorder (manic episodes, adjunct); irritability associated with autistic disorder (children/adolescents).",
    usageZH: "成人 2 mg 每日一次或分兩次起始，逐步增量至 4–8 mg/日。",
    usageEN:
      "Adults: start at 2 mg once daily or in two divided doses; titrate to 4–8 mg/day.",
    adverseZH:
      "錐體外症狀（EPS，劑量相關）、嗜睡、體重增加、高泌乳素血症（月經不順、泌乳）。",
    adverseEN:
      "Extrapyramidal symptoms (EPS, dose-related), somnolence, weight gain, hyperprolactinemia (menstrual irregularities, galactorrhea).",
    contraindicationZH: "對 Risperidone 或 Paliperidone 嚴重過敏。",
    contraindicationEN:
      "Severe hypersensitivity to Risperidone or Paliperidone.",
    precautionZH:
      "老年失智症患者死亡率增加（FDA 黑框警告）。QT 延長風險。長期使用監測錐體外症狀。",
    precautionEN:
      "Increased mortality in elderly patients with dementia (FDA black box warning). QT prolongation risk. Monitor extrapyramidal symptoms with long-term use.",
    interactionZH:
      "CYP2D6 抑制劑（Paroxetine、Fluoxetine：血中濃度升高）；Carbamazepine（濃度↓）；Clozapine（Risperidone 濃度↑）。",
    interactionEN:
      "CYP2D6 inhibitors (Paroxetine, Fluoxetine: ↑risperidone levels); Carbamazepine (↓levels); Clozapine (↑risperidone levels).",
    storageZH: "室溫 15–25°C，避光保存。口服液開封後冷藏（2–8°C）。",
    storageEN:
      "Store at 15–25°C; protect from light. Oral solution: refrigerate (2–8°C) after opening.",
  },
  fluoxetine: {
    genericZH: "氟西汀（Fluoxetine）",
    indicationZH: "重度憂鬱症；恐慌症；強迫症；暴食症；經前情緒障礙。",
    indicationEN:
      "Major depressive disorder; panic disorder; obsessive-compulsive disorder; bulimia nervosa; premenstrual dysphoric disorder.",
    usageZH:
      "成人 20 mg 每日一次（早晨）起始，依療效可增至 60 mg/日。療效可能需 4–6 週。可隨餐或空腹服用。",
    usageEN:
      "Adults: 20 mg once daily (morning) to start; increase to up to 60 mg/day as needed. Therapeutic effect may take 4–6 weeks. May be taken with or without food.",
    adverseZH:
      "噁心、頭痛、失眠、性功能障礙（常見）。嚴重：血清素症候群（合用其他血清素藥物時）；出血風險增加；自殺意念（18 歲以下黑框警告）。",
    adverseEN:
      "Nausea, headache, insomnia, sexual dysfunction (common). Serious: serotonin syndrome (with other serotonergic agents); ↑bleeding risk; suicidal ideation (black box warning for patients <18).",
    contraindicationZH:
      "合用 MAOIs（停藥後須間隔 14 天）；合用 Thioridazine（QT 延長）；合用 Pimozide。",
    contraindicationEN:
      "Concomitant MAOIs (14-day washout required); concomitant Thioridazine (QT prolongation); concomitant Pimozide.",
    precautionZH:
      "停藥不可驟停（長半衰期可緩衝，但仍建議緩慢減量）。癲癇患者慎用。出血風險（合用 NSAIDs、Warfarin）。",
    precautionEN:
      "Do not stop abruptly (long half-life buffers discontinuation, but tapering still recommended). Use with caution in epilepsy. Bleeding risk with concomitant NSAIDs or Warfarin.",
    interactionZH:
      "MAOIs（嚴重血清素症候群，禁忌）；Tramadol（血清素症候群）；CYP2D6 受質（Tricyclic antidepressants、β 阻斷劑）濃度升高；Warfarin（INR↑）。",
    interactionEN:
      "MAOIs (serious serotonin syndrome — contraindicated); Tramadol (serotonin syndrome); CYP2D6 substrates (TCAs, β-blockers: ↑levels); Warfarin (↑INR).",
    storageZH: "室溫 15–30°C，乾燥保存，避光。",
    storageEN: "Store at 15–30°C; protect from moisture and light.",
  },
  sertraline: {
    genericZH: "舍曲林（Sertraline）",
    indicationZH:
      "重度憂鬱症、恐慌症、PTSD、強迫症、社交焦慮症、經前情緒障礙。",
    indicationEN:
      "Major depressive disorder, panic disorder, PTSD, OCD, social anxiety disorder, premenstrual dysphoric disorder.",
    usageZH:
      "初始 50 mg 每日一次，依療效調整至 50–200 mg/日。可隨餐服用以減少噁心。",
    usageEN:
      "Start at 50 mg once daily; titrate to 50–200 mg/day as needed. May be taken with food to reduce nausea.",
    adverseZH:
      "噁心、腹瀉、口乾、失眠、性功能障礙。出血風險（消化道）。血清素症候群（與其他血清素藥物合用）。",
    adverseEN:
      "Nausea, diarrhea, dry mouth, insomnia, sexual dysfunction. Increased GI bleeding risk. Serotonin syndrome (with other serotonergic agents).",
    contraindicationZH:
      "合用 MAOIs（須間隔 14 天）；合用 Pimozide；Disulfiram（口服濃縮液含酒精）。",
    contraindicationEN:
      "Concomitant MAOIs (14-day washout required); concomitant Pimozide; Disulfiram (oral concentrate contains alcohol).",
    precautionZH:
      "緩慢增量以提升耐受性。監測自殺意念（尤其初期或劑量調整後）。不可驟然停藥。",
    precautionEN:
      "Titrate gradually to improve tolerability. Monitor for suicidal ideation (especially initially or after dose adjustments). Do not stop abruptly.",
    interactionZH:
      "MAOIs（嚴重，禁忌）；CYP2D6 受質（中度抑制）；NSAIDs、Warfarin（出血風險↑）；Tramadol（血清素症候群）。",
    interactionEN:
      "MAOIs (serious — contraindicated); CYP2D6 substrates (moderate inhibition); NSAIDs, Warfarin (↑bleeding risk); Tramadol (serotonin syndrome).",
    storageZH: "室溫 15–30°C，乾燥保存。",
    storageEN: "Store at 15–30°C; protect from moisture.",
  },
  escitalopram: {
    genericZH: "艾司西酞普蘭（Escitalopram）",
    indicationZH: "重度憂鬱症；廣泛性焦慮症；恐慌症；社交焦慮症。",
    indicationEN:
      "Major depressive disorder; generalized anxiety disorder; panic disorder; social anxiety disorder.",
    usageZH:
      "初始 10 mg 每日一次，可增至 20 mg/日。老年人或肝臟疾病患者上限 10 mg/日。",
    usageEN:
      "Start at 10 mg once daily; may increase to 20 mg/day. Elderly or hepatically impaired patients: max 10 mg/day.",
    adverseZH: "噁心、頭痛、失眠、嗜睡、性功能障礙。QT 延長（高劑量時）。",
    adverseEN:
      "Nausea, headache, insomnia, somnolence, sexual dysfunction. QT prolongation (at high doses).",
    contraindicationZH:
      "合用 MAOIs；QT 延長或低血鉀；合用 Citalopram（心臟風險疊加）；先天性 QT 延長症候群。",
    contraindicationEN:
      "Concomitant MAOIs; known QT prolongation or hypokalemia; concomitant Citalopram (additive cardiac risk); congenital long QT syndrome.",
    precautionZH:
      "心臟病患者謹慎（QT 延長）。老年人低鈉血症風險。不可驟然停藥。",
    precautionEN:
      "Use with caution in cardiac patients (QT prolongation). Risk of hyponatremia in elderly. Do not stop abruptly.",
    interactionZH:
      "MAOIs（禁忌）；QT 延長藥物（疊加）；NSAIDs、Warfarin（出血風險↑）；Omeprazole（Escitalopram 濃度略↑）。",
    interactionEN:
      "MAOIs (contraindicated); QT-prolonging drugs (additive); NSAIDs, Warfarin (↑bleeding risk); Omeprazole (slightly ↑escitalopram levels).",
    storageZH: "室溫 15–30°C，乾燥保存。",
    storageEN: "Store at 15–30°C; protect from moisture.",
  },
  warfarin: {
    genericZH: "華法林（Warfarin）",
    indicationZH:
      "靜脈血栓栓塞（DVT、PE）的治療與預防；非瓣膜性心房顫動的中風預防；機械性心臟瓣膜。",
    indicationEN:
      "Treatment and prevention of venous thromboembolism (DVT, PE); stroke prevention in non-valvular atrial fibrillation; mechanical heart valves.",
    usageZH:
      "每日一次，劑量個別化（目標 INR 通常 2–3；機械瓣膜 2.5–3.5）。固定時間服用，飲食中維生素 K 攝取應保持一致。",
    usageEN:
      "Once daily; individualized dose (target INR typically 2–3; mechanical valves 2.5–3.5). Take at the same time daily; maintain consistent dietary vitamin K intake.",
    adverseZH:
      "出血（最重要不良反應，從輕微瘀青到顱內出血均可能）。皮膚壞死（罕見，蛋白 C 缺乏患者）。",
    adverseEN:
      "Bleeding (most important ADR, ranging from minor bruising to intracranial hemorrhage). Skin necrosis (rare, in protein C deficiency).",
    contraindicationZH:
      "活動性出血；高出血風險（顱內手術後、最近顱內出血）；妊娠（第 1、3 孕期）；磁振造影前暫停（高劑量）。",
    contraindicationEN:
      "Active bleeding; high bleeding risk (after intracranial surgery, recent intracranial hemorrhage); pregnancy (1st and 3rd trimesters).",
    precautionZH:
      "定期監測 INR。飲食中維生素 K 含量保持穩定（勿大量增減深綠色蔬菜）。任何新藥或停藥後均需監測 INR。",
    precautionEN:
      "Regular INR monitoring required. Maintain stable dietary vitamin K intake (avoid large fluctuations in green vegetable consumption). Monitor INR after any new drug is started or stopped.",
    interactionZH:
      "極多藥物交互作用（約 200+ 種）。重要：Amiodarone（INR 大幅↑）；Fluconazole（INR↑）；Aspirin、NSAIDs（出血風險↑）；抗生素（腸道菌叢影響維生素 K）；Rifampicin（INR↓）。",
    interactionEN:
      "Numerous drug interactions (200+). Key: Amiodarone (markedly ↑INR); Fluconazole (↑INR); Aspirin, NSAIDs (↑bleeding risk); antibiotics (alter gut flora, ↑INR); Rifampicin (↓INR).",
    storageZH: "室溫 15–30°C，避光乾燥保存，原包裝密封。",
    storageEN:
      "Store at 15–30°C; protect from light and moisture; keep in tightly sealed original packaging.",
  },
  prednisolone: {
    genericZH: "潑尼松龍（Prednisolone）",
    indicationZH:
      "多種炎症及自體免疫疾病（氣喘急性發作、類風濕關節炎、發炎性腸病、腎病症候群、器官移植排斥預防）。",
    indicationEN:
      "Various inflammatory and autoimmune conditions (acute asthma, rheumatoid arthritis, IBD, nephrotic syndrome, prevention of transplant rejection).",
    usageZH:
      "劑量因適應症差異極大（1–2 mg/kg 或更高）。每日最高劑量通常早晨一次服用（仿照皮質醇晝夜節律）。隨餐服用。",
    usageEN:
      "Dosage varies widely by indication (1–2 mg/kg/day or higher). Highest daily doses usually given in the morning (mimicking cortisol circadian rhythm). Take with food.",
    adverseZH:
      "短期：血糖升高、液體滯留、高血壓、失眠、情緒波動。長期：骨質疏鬆、白內障、Cushing 樣外觀、免疫抑制、腎上腺抑制。",
    adverseEN:
      "Short-term: hyperglycemia, fluid retention, hypertension, insomnia, mood changes. Long-term: osteoporosis, cataracts, Cushingoid features, immunosuppression, adrenal suppression.",
    contraindicationZH:
      "全身性黴菌感染（未治療）；對類固醇過敏；活動性結核（未治療）。",
    contraindicationEN:
      "Untreated systemic fungal infections; corticosteroid hypersensitivity; untreated active tuberculosis.",
    precautionZH:
      "長期使用勿驟然停藥（腎上腺危象風險，需逐步減量）。補充鈣質與維生素 D 預防骨質疏鬆。監測血糖、血壓、感染跡象。",
    precautionEN:
      "Do not discontinue abruptly with long-term use (risk of adrenal crisis — taper gradually). Supplement calcium and vitamin D to prevent osteoporosis. Monitor blood glucose, blood pressure, and signs of infection.",
    interactionZH:
      "NSAIDs（胃腸出血↑）；抗糖尿病藥（血糖控制影響）；Rifampicin（類固醇療效↓）；利尿劑（低血鉀）；疫苗（活疫苗禁忌，免疫抑制劑量下）。",
    interactionEN:
      "NSAIDs (↑GI bleeding); antidiabetics (impaired glycemic control); Rifampicin (↓corticosteroid efficacy); diuretics (hypokalemia); live vaccines (contraindicated at immunosuppressive doses).",
    storageZH: "室溫 15–30°C，乾燥避光保存。",
    storageEN: "Store at 15–30°C; protect from light and moisture.",
  },
  dexamethasone: {
    genericZH: "地塞米松（Dexamethasone）",
    indicationZH:
      "嚴重過敏反應（合用腎上腺素後）；腦水腫；嚴重氣喘；化療誘發噁心嘔吐（預防）；COVID-19 重症（需氧者）。",
    indicationEN:
      "Severe allergic reactions (after epinephrine); cerebral edema; severe asthma; prevention of chemotherapy-induced nausea and vomiting; severe COVID-19 (requiring oxygen).",
    usageZH:
      "劑量因適應症不同差異大。抗炎：0.5–10 mg/日。化療止吐：8–20 mg 靜脈注射。",
    usageEN:
      "Dose varies considerably by indication. Anti-inflammatory: 0.5–10 mg/day. Antiemetic (chemotherapy): 8–20 mg IV.",
    adverseZH:
      "同 Prednisolone（抗炎效力約為 Prednisolone 的 7 倍，等效劑量下不良反應相近）。",
    adverseEN:
      "Same as Prednisolone (potency approximately 7× that of Prednisolone; adverse effects similar on equivalent dosing basis).",
    contraindicationZH: "全身性黴菌感染；對類固醇過敏。",
    contraindicationEN:
      "Untreated systemic fungal infections; corticosteroid hypersensitivity.",
    precautionZH: "同 Prednisolone。由於效力強，急性使用易出現血糖大幅波動。",
    precautionEN:
      "Same as Prednisolone. Due to high potency, acute use frequently causes significant blood glucose fluctuations.",
    interactionZH:
      "同 Prednisolone。Phenytoin、Carbamazepine（Dexamethasone 療效↓）。",
    interactionEN:
      "Same as Prednisolone. Phenytoin, Carbamazepine (↓dexamethasone efficacy).",
    storageZH: "室溫 20–25°C，避光保存（注射液）。",
    storageEN: "Store at 20–25°C; protect from light (injection solution).",
  },
  levothyroxine: {
    genericZH: "左旋甲狀腺素（Levothyroxine / T4）",
    indicationZH:
      "甲狀腺功能低下（Hypothyroidism）；甲狀腺癌術後 TSH 抑制治療；黏液性水腫。",
    indicationEN:
      "Hypothyroidism; post-thyroidectomy TSH suppression in thyroid cancer; myxedema coma.",
    usageZH:
      "早晨空腹服用（飯前 30–60 分鐘，與其他藥物間隔 4 小時）。劑量依 TSH 目標個別化，每 6–8 週調整一次。",
    usageEN:
      "Take on an empty stomach in the morning, 30–60 minutes before food; separate from other medications by 4 hours. Individualize dose based on TSH target; reassess every 6–8 weeks.",
    adverseZH:
      "劑量過高：心悸、出汗、失眠、體重減輕、心絞痛（老年人）、心房顫動。骨質疏鬆（長期 TSH 抑制）。",
    adverseEN:
      "If dose too high: palpitations, sweating, insomnia, weight loss, angina (in elderly), atrial fibrillation. Osteoporosis with long-term TSH suppression.",
    contraindicationZH:
      "未治療的腎上腺功能不全；急性心肌梗塞；未治療的甲狀腺毒症。",
    contraindicationEN:
      "Untreated adrenal insufficiency; acute MI; untreated thyrotoxicosis.",
    precautionZH:
      "心臟病患者以低劑量起始緩慢增量。監測 TSH（4–6 週後調整）。老年人敏感性高，謹慎使用。",
    precautionEN:
      "Start at low dose with slow titration in cardiac patients. Monitor TSH (adjust after 4–6 weeks). Elderly patients are more sensitive — use with caution.",
    interactionZH:
      "Calcium、鐵劑、制酸劑（吸收↓，間隔 4 小時）；Warfarin（INR 升高，需監測）；Estrogen（甲狀腺素需求增加）；Amiodarone（影響甲狀腺功能）。",
    interactionEN:
      "Calcium, iron supplements, antacids (↓absorption — separate by 4 hours); Warfarin (↑INR, monitor); estrogen (↑levothyroxine requirements); Amiodarone (affects thyroid function).",
    storageZH: "室溫 15–30°C，乾燥避光密封保存（對光和濕氣敏感）。",
    storageEN:
      "Store at 15–30°C in a tightly closed, light-resistant container (sensitive to light and moisture).",
  },
  salbutamol: {
    genericZH: "沙丁胺醇（Salbutamol / Albuterol）",
    indicationZH:
      "急性支氣管痙攣的緩解（氣喘、COPD 急性發作）；運動誘發支氣管收縮預防。",
    indicationEN:
      "Acute relief of bronchospasm in asthma and COPD exacerbations; prevention of exercise-induced bronchoconstriction.",
    usageZH:
      "定量噴霧吸入劑：急性發作時 100–200 mcg（1–2 吸），症狀未緩解可重複。預防：運動前 15 分鐘 200 mcg。每日使用 >4 次提示病情未受控。",
    usageEN:
      "MDI: 100–200 mcg (1–2 puffs) for acute attacks; may repeat if relief incomplete. Prevention: 200 mcg 15 minutes before exercise. Using >4 times/day indicates poor disease control.",
    adverseZH:
      "震顫（手抖）、心跳加速、頭痛（常見）。高劑量：低血鉀。嚴重：悖論性支氣管痙攣（立即停藥）。",
    adverseEN:
      "Tremor, tachycardia, headache (common). High doses: hypokalemia. Serious: paradoxical bronchospasm (discontinue immediately).",
    contraindicationZH: "對 Salbutamol 過敏；早期妊娠（口服劑型）。",
    contraindicationEN:
      "Hypersensitivity to salbutamol; early pregnancy (oral formulation).",
    precautionZH:
      "頻繁需要緩解劑提示氣喘控制不良，應重新評估。心血管疾病患者慎用。吸入後漱口（減少念珠菌感染，若合用類固醇吸入劑）。",
    precautionEN:
      "Frequent need for rescue inhaler suggests inadequate asthma control — reassess therapy. Use with caution in cardiovascular disease. Rinse mouth after inhalation (if combined with inhaled corticosteroid).",
    interactionZH:
      "β 阻斷劑（療效對抗）；利尿劑（低血鉀加成）；MAOIs、三環抗鬱藥（心血管效應↑）。",
    interactionEN:
      "β-blockers (antagonize bronchodilatory effect); diuretics (additive hypokalemia); MAOIs, tricyclic antidepressants (↑cardiovascular effects).",
    storageZH: "室溫 15–30°C，避免凍結，保護吸入器金屬罐不受強光直射。",
    storageEN:
      "Store at 15–30°C; protect from freezing; protect the metal canister from direct strong sunlight.",
  },
  montelukast: {
    genericZH: "孟魯司特（Montelukast）",
    indicationZH: "成人及兒童氣喘的預防與慢性治療；過敏性鼻炎症狀緩解。",
    indicationEN:
      "Prevention and chronic treatment of asthma in adults and children; relief of allergic rhinitis symptoms.",
    usageZH:
      "成人（氣喘）：10 mg 每晚一次。過敏性鼻炎：10 mg/日。兒童依年齡劑量不同（4–5 歲 4 mg；6–14 歲 5 mg）。",
    usageEN:
      "Adults (asthma): 10 mg once nightly. Allergic rhinitis: 10 mg once daily. Children: dose varies by age (4–5 years: 4 mg; 6–14 years: 5 mg).",
    adverseZH:
      "頭痛、腹痛（常見）。嚴重：神經精神不良反應（失眠、焦慮、憂鬱、自殺意念，FDA 黑框警告 2020 年）。",
    adverseEN:
      "Headache, abdominal pain (common). Serious: neuropsychiatric adverse events (insomnia, anxiety, depression, suicidal ideation — FDA black box warning, 2020).",
    contraindicationZH: "對 Montelukast 過敏；不用於急性氣喘發作的緩解。",
    contraindicationEN:
      "Hypersensitivity to Montelukast; not for use as acute bronchodilator in asthma attacks.",
    precautionZH:
      "告知患者及家屬神經精神不良反應；若出現相關症狀立即就醫。不可取代吸入型類固醇作為第一線控制藥。",
    precautionEN:
      "Inform patients and caregivers about neuropsychiatric adverse events; seek medical attention if symptoms appear. Not a replacement for inhaled corticosteroids as first-line controller therapy.",
    interactionZH:
      "Phenobarbital、Rifampicin（Montelukast 濃度↓）；Fenofibrate（競爭 CYP2C8，輕度交互作用）。",
    interactionEN:
      "Phenobarbital, Rifampicin (↓montelukast levels); Fenofibrate (mild CYP2C8 competition).",
    storageZH: "室溫 15–30°C，乾燥避光保存，原包裝密封。",
    storageEN:
      "Store at 15–30°C in a dry, light-protected place; keep in original packaging.",
  },
  diazepam: {
    genericZH: "地西泮（Diazepam）",
    indicationZH:
      "焦慮症；急性酒精戒斷症候群；癲癇持續狀態（靜脈注射）；肌肉痙攣；麻醉前用藥。",
    indicationEN:
      "Anxiety disorders; acute alcohol withdrawal syndrome; status epilepticus (IV); muscle spasm; preoperative medication.",
    usageZH:
      "口服：焦慮 2–10 mg 每日 2–4 次；肌肉痙攣 2–15 mg/日，分次服用。使用最低有效劑量與最短療程。",
    usageEN:
      "Oral: anxiety 2–10 mg 2–4 times daily; muscle spasm 2–15 mg/day in divided doses. Use the lowest effective dose for the shortest necessary duration.",
    adverseZH:
      "嗜睡、頭暈、協調失衡（常見）。心理及生理依賴（風險高）、記憶損傷。呼吸抑制（高劑量或合用鴉片類）。",
    adverseEN:
      "Drowsiness, dizziness, coordination impairment (common). Physical and psychological dependence (high risk), memory impairment. Respiratory depression (high doses or with opioids).",
    contraindicationZH:
      "重症肌無力；嚴重呼吸功能不全；睡眠呼吸中止症（未治療）；嚴重肝功能不全；合用 Sodium oxybate。",
    contraindicationEN:
      "Myasthenia gravis; severe respiratory insufficiency; untreated sleep apnea; severe hepatic impairment; concomitant Sodium oxybate.",
    precautionZH:
      "避免長期使用（依賴、戒斷問題）。停藥需緩慢減量（避免戒斷發作）。不可與酒精合用。老年人跌倒風險高。駕車、操作機械時應謹慎。",
    precautionEN:
      "Avoid long-term use (dependence and withdrawal risk). Taper gradually on discontinuation (avoid withdrawal seizures). Do not combine with alcohol. High fall risk in elderly. Caution when driving or operating machinery.",
    interactionZH:
      "中樞神經抑制劑（酒精、鴉片類：呼吸抑制↑）；CYP3A4 抑制劑（Azole 抗黴菌：Diazepam 濃度↑）；Cimetidine（清除↓）。",
    interactionEN:
      "CNS depressants (alcohol, opioids: ↑respiratory depression); CYP3A4 inhibitors (Azole antifungals: ↑diazepam levels); Cimetidine (↓clearance).",
    storageZH: "室溫 15–30°C，避光保存，依管制藥品規定儲存（二級管制）。",
    storageEN:
      "Store at 15–30°C; protect from light; store according to controlled substance regulations.",
  },
};

// ATC-5 fallback entries (broader class info)
const CLINICAL_INFO_ATC = {
  n02be: CLINICAL_INFO["acetaminophen"],
  m01ae: CLINICAL_INFO["ibuprofen"],
  b01ac: CLINICAL_INFO["aspirin"],
  j01ca: CLINICAL_INFO["amoxicillin"],
  j01fa: CLINICAL_INFO["azithromycin"],
  j01ma: CLINICAL_INFO["ciprofloxacin"],
  j01xd: CLINICAL_INFO["metronidazole"],
  c08ca: CLINICAL_INFO["amlodipine"],
  c09ca: CLINICAL_INFO["losartan"],
  c09aa: CLINICAL_INFO["lisinopril"],
  c07ab: CLINICAL_INFO["metoprolol"],
  c07ag: CLINICAL_INFO["carvedilol"],
  c10aa: CLINICAL_INFO["atorvastatin"],
  a10ba: CLINICAL_INFO["metformin"],
  a10bb: CLINICAL_INFO["glipizide"],
  a10bh: CLINICAL_INFO["sitagliptin"],
  a02bc: CLINICAL_INFO["omeprazole"],
  n05ah: CLINICAL_INFO["quetiapine"],
  n05al: CLINICAL_INFO["risperidone"],
  n06ab: CLINICAL_INFO["sertraline"],
  n05ba: CLINICAL_INFO["diazepam"],
  h02ab: CLINICAL_INFO["prednisolone"],
  h03aa: CLINICAL_INFO["levothyroxine"],
  r03ac: CLINICAL_INFO["salbutamol"],
  r03dc: CLINICAL_INFO["montelukast"],
  b01aa: CLINICAL_INFO["warfarin"],
};

function getClinicalInfo(brand) {
  const key = (brand.ingredient || "").toLowerCase().trim();
  const atc5 = (brand.atc || "").toLowerCase().slice(0, 5);
  return CLINICAL_INFO[key] || CLINICAL_INFO_ATC[atc5] || null;
}

// ── Brand Detail Bottom Sheet ──────────────────────────────────────────────
function BrandDetailModal({
  brand,
  isStaff,
  addToMyDrugs,
  priceLow,
  priceHigh,
  onClose,
}) {
  const [added, setAdded] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const [lightbox, setLightbox] = useState(false);
  const imgUrl = getDrugImage(brand.licId);
  const { T, language } = useLang();
  const ci = getClinicalInfo(brand);
  const sfx = language === "en" ? "EN" : "ZH";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleAdd() {
    setAdded(true);
    addToMyDrugs && addToMyDrugs(brand);
  }
  function sendToDDI() {
    window.dispatchEvent(new CustomEvent("send-to-ddi", { detail: brand }));
    onClose();
  }

  const p = parseFloat(brand.price || 0);
  const priceBand =
    isStaff && p && priceHigh
      ? p <= priceLow
        ? "low"
        : p <= priceHigh
          ? "mid"
          : "high"
      : null;
  const priceBandStyle = {
    low: { bg: "#dcfce7", color: "#166534", label: T.priceCheap },
    mid: { bg: "#fef9c3", color: "#854d0e", label: T.priceMid },
    high: { bg: "#fee2e2", color: "#991b1b", label: T.priceHigh },
  };

  const clinicalSections = [
    { base: "indication", label: T.sectionIndication },
    { base: "usage", label: T.sectionUsage },
    { base: "adverse", label: T.sectionAdverse },
    { base: "contraindication", label: T.sectionContraindication, warn: true },
    { base: "precaution", label: T.sectionPrecaution },
    { base: "interaction", label: T.sectionInteraction },
    { base: "storage", label: T.sectionStorage },
  ];

  return (
    <>
      {lightbox && imgUrl && imgOk && (
        <ImageLightbox
          src={imgUrl}
          alt={brand.nameEN}
          onClose={() => setLightbox(false)}
        />
      )}
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 800,
          background: "rgba(15,31,20,.45)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        {/* sheet */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 540,
            background: "#fff",
            borderRadius: "22px 22px 0 0",
            maxHeight: "92vh",
            overflowY: "auto",
            boxShadow: "0 -10px 50px rgba(0,0,0,.22)",
            padding: "0 0 44px",
          }}
        >
          {/* drag handle + close */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 8px",
            }}
          >
            <div style={{ width: 32 }} />
            <div
              style={{
                width: 40,
                height: 4,
                background: "#e2e8f0",
                borderRadius: 2,
              }}
            />
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                border: "none",
                background: "#f1f5f9",
                cursor: "pointer",
                fontSize: 16,
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>

          {/* ── header: image + brand name ── */}
          <div
            style={{
              padding: "8px 20px 16px",
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {imgUrl && imgOk ? (
              <div
                onClick={() => setLightbox(true)}
                style={{
                  width: 90,
                  height: 90,
                  flexShrink: 0,
                  cursor: "zoom-in",
                  position: "relative",
                  borderRadius: 14,
                  overflow: "hidden",
                  border: `1.5px solid ${C.border}`,
                  background: "#fafafa",
                  boxShadow: "0 2px 10px rgba(0,0,0,.09)",
                }}
              >
                <img
                  src={imgUrl}
                  alt={brand.nameEN}
                  onError={() => setImgOk(false)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: 6,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    background: "rgba(0,0,0,.45)",
                    color: "#fff",
                    fontSize: 9,
                    padding: "2px 5px",
                    borderRadius: "8px 0 0 0",
                    lineHeight: 1.4,
                  }}
                >
                  🔍
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: 90,
                  height: 90,
                  flexShrink: 0,
                  borderRadius: 14,
                  background: "#EBF5EE",
                  border: `1.5px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                }}
              >
                💊
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* brand name */}
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  lineHeight: 1.35,
                  color: C.text,
                  marginBottom: 2,
                  wordBreak: "break-word",
                }}
              >
                {brand.nameEN}
              </div>
              {brand.nameZH && (
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>
                  {brand.nameZH}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <DrugClassBadge raw={brand.drugClass} />
              </div>
            </div>
          </div>

          {/* ── names block: generic EN / generic ZH / brand ── */}
          <div
            style={{
              padding: "12px 20px",
              background: "#f8fafc",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: 0.7,
                marginBottom: 8,
              }}
            >
              {T.drugNamesTitle}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "5px 10px",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  color: C.muted,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {T.genericNameEN}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: C.primary,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textUnderlineOffset: 3,
                }}
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("navigate-ingredient", {
                      detail: { query: brand.ingredient || brand.nameEN },
                    }),
                  );
                  onClose();
                }}
                title="Search all brands of this ingredient"
              >
                {brand.ingredient || brand.nameEN}
              </span>

              {ci?.genericZH && (
                <>
                  <span
                    style={{
                      color: C.muted,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {T.genericNameZH}
                  </span>
                  <span style={{ fontWeight: 700, color: C.text }}>
                    {ci.genericZH}
                  </span>
                </>
              )}

              <span
                style={{
                  color: C.muted,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {T.brandNameLabel}
              </span>
              <span style={{ color: C.text }}>
                {brand.nameEN}
                {brand.nameZH ? `（${brand.nameZH}）` : ""}
              </span>

              {brand.form && (
                <>
                  <span
                    style={{
                      color: C.muted,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {T.dosageFormLabel}
                  </span>
                  <span style={{ color: C.text }}>
                    {dosageFormEN(brand.form) || brand.form}
                    {brand.strength ? ` · ${brand.strength}` : ""}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ── NHI badges ── */}
          <div
            style={{
              padding: "10px 20px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {brand.nhiChapter ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fbbf24",
                }}
                title={T.nhiConditionalTip}
              >
                {T.nhiConditional}
              </span>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: "#dcfce7",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                }}
              >
                {T.nhiCovered}
              </span>
            )}
            {brand.nhiChapter && brand.nhiPdf ? (
              <a
                href={`https://info.nhi.gov.tw/api/INAE3000/INAE3000S01/getPDF?DurgFileName=${brand.nhiPdf}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 6,
                  textDecoration: "none",
                  background: "#fef9c3",
                  color: "#854d0e",
                  border: "1px solid #fde68a",
                }}
              >
                {T.reimbCond}
                {brand.nhiChapter} ↗
              </a>
            ) : brand.nhiChapter ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: "#fef9c3",
                  color: "#854d0e",
                  border: "1px solid #fde68a",
                }}
              >
                {T.reimbCond}
                {brand.nhiChapter}
              </span>
            ) : null}
          </div>
          {brand.nhiChapter && (
            <div
              style={{
                margin: "0 20px",
                padding: "8px 12px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 8,
                fontSize: 12,
                color: "#92400e",
                marginTop: 10,
              }}
            >
              {T.nhiConditionalTip}
            </div>
          )}

          {/* ── info grid ── */}
          <div
            style={{
              padding: "12px 20px 8px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px 16px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {[
              ["NHI Code", brand.id, null],
              [
                "ATC Code",
                brand.atc,
                () => {
                  window.dispatchEvent(
                    new CustomEvent("navigate-atc", {
                      detail: { atc: brand.atc },
                    }),
                  );
                  onClose();
                },
              ],
              [T.manufacturerLabel, brand.manufacturer, null],
              ...(isStaff && parseFloat(brand.price) > 0
                ? [[T.nhiPriceLabel, `NT$ ${brand.price}`, null]]
                : []),
            ]
              .filter(([, v]) => v)
              .map(([k, v, onClick]) => (
                <div
                  key={k}
                  onClick={onClick || undefined}
                  style={{ cursor: onClick ? "pointer" : "default" }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: C.muted,
                      fontWeight: 700,
                      marginBottom: 2,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: onClick ? C.primary : C.text,
                      textDecoration: onClick ? "underline" : "none",
                      textDecorationStyle: "dotted",
                      textUnderlineOffset: 3,
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
          </div>

          {/* ── clinical information ── */}
          {ci ? (
            <div style={{ padding: "16px 20px 4px" }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                  paddingBottom: 8,
                  borderBottom: "2px solid #1e293b",
                  marginBottom: 0,
                }}
              >
                {T.clinicalInfoTitle}
              </div>
              {clinicalSections.map((s, i) =>
                ci[s.base + sfx] ? (
                  <div key={s.base}>
                    {s.warn ? (
                      /* contraindications: only section with a warning box */
                      <div
                        style={{
                          margin: "12px 0",
                          background: "#fff5f5",
                          border: "1px solid #fca5a5",
                          borderRadius: 6,
                          padding: "10px 14px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#b91c1c",
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                            marginBottom: 5,
                          }}
                        >
                          ⚠ {s.label}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "#7f1d1d",
                            lineHeight: 1.7,
                            whiteSpace: "pre-line",
                          }}
                        >
                          {ci[s.base + sfx]}
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "12px 0",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#1e293b",
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                            marginBottom: 5,
                          }}
                        >
                          {s.label}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "#334155",
                            lineHeight: 1.7,
                            whiteSpace: "pre-line",
                          }}
                        >
                          {ci[s.base + sfx]}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null,
              )}
            </div>
          ) : (
            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 8,
                  padding: "14px 16px",
                  fontSize: 12,
                  color: C.muted,
                  textAlign: "center",
                  border: `1px dashed ${C.border}`,
                }}
              >
                {T.noClinicalInfo}
                <br />
                <span style={{ fontSize: 11 }}>{T.noClinicalInfoSub}</span>
              </div>
            </div>
          )}

          {/* ── external links ── */}
          {(brand.licId || (isStaff && brand.nhiPdf)) && (
            <div
              style={{
                padding: "4px 20px 12px",
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {brand.licId && (
                <a
                  href={`https://lmspiq.fda.gov.tw/web/DRPIQ/DRPIQ1000Result?licId=${brand.licId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.primary,
                    textDecoration: "none",
                    border: `1px solid ${C.border}`,
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: "#f8fafc",
                  }}
                >
                  FDA 查詢 ↗
                </a>
              )}
              {isStaff && brand.nhiPdf && (
                <a
                  href={`https://info.nhi.gov.tw/api/INAE3000/INAE3000S01/getPDF?DurgFileName=${brand.nhiPdf}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#7c3aed",
                    textDecoration: "none",
                    border: "1px solid #ddd6fe",
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: "#f8fafc",
                  }}
                >
                  NHI PDF ↗
                </a>
              )}
            </div>
          )}

          {/* ── action buttons ── */}
          <div style={{ padding: "4px 20px 0", display: "flex", gap: 10 }}>
            <button
              onClick={handleAdd}
              disabled={added}
              style={{
                flex: 2,
                padding: "13px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                border: "none",
                cursor: added ? "default" : "pointer",
                background: added ? "#dcfce7" : C.primary,
                color: added ? "#166534" : "#fff",
                transition: "background .15s",
              }}
            >
              {added ? "✓ " + T.meds : T.addMyDrugs}
            </button>
            {isStaff && (
              <button
                onClick={sendToDDI}
                style={{
                  flex: 1,
                  padding: "13px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1px solid #f59e0b",
                  background: "#fffbeb",
                  color: "#92400e",
                  cursor: "pointer",
                }}
              >
                ⚠ {T.checkDDI}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Ingredient Lookup — Brand Row ─────────────────────────────────────────
function BrandRow({
  brand,
  isStaff,
  addToMyDrugs,
  priceLow,
  priceHigh,
  onCardClick,
  imgCount,
}) {
  const [added, setAdded] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const [lightbox, setLightbox] = useState(false);
  // imgCount dep forces re-render after drug_images.json loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const imgUrl = useMemo(
    () => getDrugImage(brand.licId),
    [brand.licId, imgCount],
  );
  const { T } = useLang();
  function handleAdd() {
    setAdded(true);
    addToMyDrugs && addToMyDrugs(brand);
  }
  function sendToDDI(e) {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("send-to-ddi", { detail: brand }));
  }
  const p = parseFloat(brand.price || 0);
  const priceBand =
    isStaff && p && priceHigh
      ? p <= priceLow
        ? "low"
        : p <= priceHigh
          ? "mid"
          : "high"
      : null;
  const hasImg = !!(imgUrl && imgOk);
  return (
    <>
      {lightbox && hasImg && (
        <ImageLightbox
          src={imgUrl}
          alt={brand.nameEN}
          onClose={(e) => {
            e.stopPropagation();
            setLightbox(false);
          }}
        />
      )}
      <div
        onClick={() => onCardClick && onCardClick(brand)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#EBF5EE";
          e.currentTarget.style.borderColor = C.primary;
          e.currentTarget.style.boxShadow = `0 2px 12px rgba(27,104,64,.12)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fafafa";
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.boxShadow = "none";
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          background: "#fafafa",
          cursor: "pointer",
          transition: "all .14s ease",
        }}
      >
        {hasImg && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(true);
            }}
            style={{
              width: 52,
              height: 52,
              flexShrink: 0,
              borderRadius: 10,
              overflow: "hidden",
              border: `1px solid ${C.border}`,
              background: "#fff",
              cursor: "zoom-in",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={imgUrl}
              alt={brand.nameEN}
              onError={() => setImgOk(false)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: 3,
              }}
            />
          </div>
        )}
        {/* main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 2,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
              {brand.nameEN}
            </span>
            <DrugClassBadge raw={brand.drugClass} />
          </div>
          {brand.nameZH && (
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>
              {brand.nameZH}
            </div>
          )}
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {brand.form && (
              <span>{dosageFormEN(brand.form) || brand.form}</span>
            )}
            {brand.strength && (
              <>
                <span>·</span>
                <span>{brand.strength}</span>
              </>
            )}
            {isStaff && parseFloat(brand.price) > 0 && (
              <>
                <span>·</span>
                <span style={{ color: C.primary, fontWeight: 700 }}>
                  NT$ {brand.price}
                </span>
              </>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 5,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {brand.nhiChapter ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 5,
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fbbf24",
                }}
                title={T.nhiConditionalTip}
              >
                {T.nhiConditional}
              </span>
            ) : (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 5,
                  background: "#dcfce7",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                }}
              >
                {T.nhiCovered}
              </span>
            )}
            {brand.nhiChapter && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: 5,
                  background: "#fef9c3",
                  color: "#854d0e",
                  border: "1px solid #fde68a",
                }}
              >
                {T.reimbCond}
                {brand.nhiChapter}
              </span>
            )}
          </div>
        </div>
        {/* chevron hint */}
        <span
          style={{ color: C.muted, fontSize: 16, flexShrink: 0, opacity: 0.5 }}
        >
          ›
        </span>
      </div>
    </>
  );
}

// ── ATC L2 (3-char) class names ───────────────────────────────────────────
const ATC_L2 = {
  A01: "Stomatological",
  A02: "Acid-related disorders",
  A03: "Functional GI",
  A04: "Antiemetics",
  A05: "Bile & liver",
  A06: "Laxatives",
  A07: "Antidiarrheals",
  A08: "Antiobesity",
  A09: "Digestives",
  A10: "Diabetes",
  A11: "Vitamins",
  A12: "Mineral supplements",
  A14: "Anabolic agents",
  A16: "Other alimentary",
  B01: "Antithrombotics",
  B02: "Antihemorrhagics",
  B03: "Antianemics",
  B05: "Blood substitutes",
  B06: "Other hematological",
  C01: "Cardiac therapy",
  C02: "Antihypertensives",
  C03: "Diuretics",
  C04: "Peripheral vasodilators",
  C05: "Vasoprotectives",
  C07: "Beta blockers",
  C08: "Ca-channel blockers",
  C09: "Renin-angiotensin",
  C10: "Lipid-modifying",
  D01: "Antifungals (topical)",
  D02: "Emollients",
  D03: "Wound healing",
  D04: "Antipruritics",
  D05: "Antipsoriatics",
  D06: "Dermal antibiotics",
  D07: "Topical corticosteroids",
  D08: "Antiseptics",
  D10: "Anti-acne",
  D11: "Other dermatologicals",
  G01: "Gynecological antiinfectives",
  G02: "Other gynecologicals",
  G03: "Sex hormones",
  G04: "Urologicals",
  H01: "Pituitary hormones",
  H02: "Systemic corticosteroids",
  H03: "Thyroid therapy",
  H04: "Pancreatic hormones",
  H05: "Calcium homeostasis",
  J01: "Systemic antibacterials",
  J02: "Systemic antimycotics",
  J04: "Antimycobacterials",
  J05: "Systemic antivirals",
  J06: "Immune sera",
  J07: "Vaccines",
  L01: "Antineoplastics",
  L02: "Endocrine therapy",
  L03: "Immunostimulants",
  L04: "Immunosuppressants",
  M01: "Antiinflammatory & antirheumatic",
  M02: "Topical joint/muscle",
  M03: "Muscle relaxants",
  M04: "Antigout",
  M05: "Bone diseases",
  N01: "Anesthetics",
  N02: "Analgesics",
  N03: "Antiepileptics",
  N04: "Anti-Parkinson",
  N05: "Psycholeptics",
  N06: "Psychoanaleptics",
  N07: "Other CNS",
  P01: "Antiprotozoals",
  P02: "Anthelmintics",
  P03: "Ectoparasiticides",
  R01: "Nasal preparations",
  R02: "Throat preparations",
  R03: "Obstructive airway diseases",
  R05: "Cough & cold",
  R06: "Systemic antihistamines",
  S01: "Ophthalmologicals",
  S02: "Otologicals",
  S03: "Ophthalmo-otologicals",
  V03: "All other therapeutic",
  V04: "Diagnostic agents",
  V06: "General nutrients",
  V08: "Contrast media",
};

// ── Filtered brand list with strength / form dropdowns ───────────────────
// Unified, reusable brand-list toolbar (filter + sort + export).
// Used by IngredientLookup, ATCBrowser, and BulkSearch so every brand list
// behaves the same. Price sort/column stays staff-only (price is hidden from guests).
function FilteredBrandList({
  brands,
  isStaff,
  addToMyDrugs,
  onCardClick,
  imgCount,
  exportName = "brands",
  showExport = true,
}) {
  const { T } = useLang();
  const [strength, setStrength] = useState("all");
  const [form, setForm] = useState("all");
  const [cls, setCls] = useState("all");
  const [coverage, setCoverage] = useState("all"); // all | covered | conditional
  const [sortField, setSortField] = useState("name"); // name | strength
  const [sortDir, setSortDir] = useState("asc"); // asc | desc
  const [exported, setExported] = useState(false);

  const strengths = useMemo(() => {
    const vals = [...new Set(brands.map((b) => b.strength).filter(Boolean))];
    return vals.sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [brands]);

  const forms = useMemo(() => {
    const vals = [
      ...new Set(
        brands.map((b) => dosageFormEN(b.form) || b.form).filter(Boolean),
      ),
    ];
    return vals.sort();
  }, [brands]);

  const classes = useMemo(() => {
    const vals = [
      ...new Set(
        brands.map((b) => drugClassLabel(b.drugClass)).filter(Boolean),
      ),
    ];
    return vals.sort();
  }, [brands]);

  // Show the coverage filter only when the set actually mixes covered + conditional.
  const coverageMixed = useMemo(() => {
    let covered = false,
      cond = false;
    for (const b of brands) {
      if (b.nhiChapter) cond = true;
      else covered = true;
      if (covered && cond) return true;
    }
    return false;
  }, [brands]);

  // Price tertiles → drives the 💚/🟡/🔴 band coloring on each row (staff only).
  const { priceLow, priceHigh } = useMemo(() => {
    const prices = brands
      .map((b) => parseFloat(b.price || 0))
      .filter((p) => p > 0)
      .sort((a, b) => a - b);
    if (prices.length < 3)
      return {
        priceLow: prices[0] || 0,
        priceHigh: prices[prices.length - 1] || 0,
      };
    return {
      priceLow: prices[Math.floor(prices.length * 0.33)],
      priceHigh: prices[Math.floor(prices.length * 0.66)],
    };
  }, [brands]);

  const filtered = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return brands
      .filter((b) => {
        if (strength !== "all" && b.strength !== strength) return false;
        if (form !== "all" && (dosageFormEN(b.form) || b.form) !== form)
          return false;
        if (cls !== "all" && drugClassLabel(b.drugClass) !== cls) return false;
        if (coverage === "covered" && b.nhiChapter) return false;
        if (coverage === "conditional" && !b.nhiChapter) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        if (sortField === "strength")
          return (
            dir *
            ((parseFloat(a.strength) || 0) - (parseFloat(b.strength) || 0))
          );
        return dir * (a.nameEN || "").localeCompare(b.nameEN || "");
      });
  }, [brands, strength, form, cls, coverage, sortField, sortDir]);

  const anyFilter =
    strength !== "all" || form !== "all" || cls !== "all" || coverage !== "all";

  function resetFilters() {
    setStrength("all");
    setForm("all");
    setCls("all");
    setCoverage("all");
  }

  function exportCSV() {
    const header =
      "NHI_Code,Brand_EN,Brand_ZH,Ingredient,ATC,Form,Strength,Manufacturer,Coverage,NHI_Chapter,Price";
    const body = filtered
      .map((b) =>
        [
          b.id,
          b.nameEN,
          b.nameZH,
          b.ingredient,
          b.atc,
          dosageFormEN(b.form) || b.form,
          b.strength,
          b.manufacturer,
          b.nhiChapter ? "Conditional" : "Covered",
          b.nhiChapter,
          b.price,
        ]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob(["﻿" + header + "\n" + body], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${String(exportName).replace(/\s+/g, "_") || "brands"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  const selectStyle = {
    padding: "6px 10px",
    borderRadius: 8,
    border: `1.5px solid ${C.border}`,
    fontSize: 12,
    fontWeight: 600,
    background: "#fff",
    color: C.text,
    cursor: "pointer",
    outline: "none",
    fontFamily: "inherit",
  };
  const btnStyle = {
    padding: "6px 11px",
    borderRadius: 8,
    border: `1.5px solid ${C.border}`,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    background: "#fff",
    color: C.muted,
    fontFamily: "inherit",
  };

  const hasFilterDropdowns =
    forms.length > 1 ||
    classes.length > 1 ||
    coverageMixed ||
    strengths.length > 1;
  const showToolbar = brands.length > 1;

  return (
    <div>
      {showToolbar && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 12,
            padding: "10px 12px",
            background: "#f8fafc",
            borderRadius: 12,
            border: `1px solid ${C.border}`,
          }}
        >
          {/* Row 1 — filters */}
          {hasFilterDropdowns && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {forms.length > 1 && (
                <select
                  value={form}
                  onChange={(e) => setForm(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">{T.allForms}</option>
                  {forms.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              )}
              {classes.length > 1 && (
                <select
                  value={cls}
                  onChange={(e) => setCls(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">{T.allClasses}</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
              {coverageMixed && (
                <select
                  value={coverage}
                  onChange={(e) => setCoverage(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">{T.coverageAll}</option>
                  <option value="covered">{T.coverageFull}</option>
                  <option value="conditional">{T.coverageCond}</option>
                </select>
              )}
              {strengths.length > 1 && (
                <select
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">{T.allStrengths}</option>
                  {strengths.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
              {anyFilter && (
                <button
                  onClick={resetFilters}
                  style={{
                    ...btnStyle,
                    border: "none",
                    background: "transparent",
                    color: C.primary,
                    padding: "6px 4px",
                  }}
                >
                  ✕ {T.resetFilters}
                </button>
              )}
            </div>
          )}

          {/* Row 2 — sort + export + count */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>
              {T.sortLabel}
            </span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              style={selectStyle}
            >
              <option value="name">{T.sortFieldName}</option>
              {strengths.length > 1 && (
                <option value="strength">{T.sortFieldStrength}</option>
              )}
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              title={sortDir === "asc" ? T.sortAscTip : T.sortDescTip}
              style={{
                ...btnStyle,
                fontWeight: 800,
                minWidth: 34,
                color: C.text,
              }}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
            {showExport && (
              <button
                onClick={exportCSV}
                style={
                  exported
                    ? { ...btnStyle, background: "#dcfce7", color: "#166534" }
                    : btnStyle
                }
              >
                {exported ? T.exported : T.exportCSV}
              </button>
            )}
            <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>
              {T.showingOf(filtered.length, brands.length)}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length > 0 ? (
          filtered.map((b) => (
            <BrandRow
              key={b.id}
              brand={b}
              isStaff={isStaff}
              addToMyDrugs={addToMyDrugs}
              onCardClick={onCardClick}
              imgCount={imgCount}
              priceLow={priceLow}
              priceHigh={priceHigh}
            />
          ))
        ) : (
          <Card style={{ textAlign: "center", color: C.muted, padding: 32 }}>
            {T.noBrandsMatch}
          </Card>
        )}
      </div>
    </div>
  );
}

// ── ATC Browser (RxClass-style) ───────────────────────────────────────────
function ATCBrowser({ addToMyDrugs, nhiCount, initAtc }) {
  const initPath = useMemo(() => {
    if (!initAtc) return [];
    const a = initAtc.toUpperCase();
    const segs = [];
    if (a.length >= 1) segs.push(a.slice(0, 1));
    if (a.length >= 3) segs.push(a.slice(0, 3));
    if (a.length >= 4) segs.push(a.slice(0, 4));
    if (a.length >= 5) segs.push(a.slice(0, 5));
    return segs;
  }, [initAtc]);

  const [path, setPath] = useState(initPath); // e.g. ['N','N05','N05A','N05AH']
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [detailBrand, setDetailBrand] = useState(null);
  const { T } = useLang();
  const { isStaff } = useAuth();

  const prefix = path.length > 0 ? path[path.length - 1] : null;

  // Build child groups for the current prefix level
  const childGroups = useMemo(() => {
    // at 5-char prefix we switch to concept/brand view — no more sub-groups
    if (prefix && prefix.length >= 5) return [];
    const nextLen = !prefix
      ? 1
      : prefix.length === 1
        ? 3
        : prefix.length === 3
          ? 4
          : 5;
    const map = new Map();
    for (const d of DRUGS_LIVE) {
      const atc = (d.atc || "").toUpperCase();
      if (prefix && !atc.startsWith(prefix)) continue;
      if (!atc) continue;
      const key = atc.slice(0, nextLen);
      if (key.length < nextLen) continue;
      if (!map.has(key)) map.set(key, { code: key, count: 0, ingr: new Set() });
      const g = map.get(key);
      g.count++;
      if (g.ingr.size < 3) g.ingr.add(d.ingredient);
    }
    return [...map.values()]
      .sort((a, b) => b.count - a.count)
      .map((g) => ({ ...g, ingr: [...g.ingr] }));
  }, [prefix, nhiCount]);

  // At 5-char level: concept groups (ingredient-grouped)
  const concepts = useMemo(() => {
    if (!prefix || prefix.length !== 5) return [];
    return browseByATC(prefix);
  }, [prefix, nhiCount]);

  function drillDown(code) {
    setPath((p) => [...p, code]);
    setSelectedConcept(null);
  }
  function goBack() {
    setPath((p) => p.slice(0, -1));
    setSelectedConcept(null);
  }

  const getName = (code) => {
    if (code.length === 1) return ATC_CATEGORIES[code] || code;
    if (code.length === 3) return ATC_L2[code] || code;
    return code;
  };

  return (
    <div>
      {detailBrand && (
        <BrandDetailModal
          brand={detailBrand}
          isStaff={isStaff}
          addToMyDrugs={addToMyDrugs}
          priceLow={0}
          priceHigh={0}
          onClose={() => setDetailBrand(null)}
        />
      )}
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => {
            setPath([]);
            setSelectedConcept(null);
          }}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: C.primary,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {T.atcBrowseTitle}
        </button>
        {path.map((seg, i) => (
          <React.Fragment key={seg}>
            <span style={{ fontSize: 12, color: C.muted }}>›</span>
            <button
              onClick={() => {
                setPath((p) => p.slice(0, i + 1));
                setSelectedConcept(null);
              }}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.primary,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {seg}
            </button>
          </React.Fragment>
        ))}
        {selectedConcept && (
          <>
            <span style={{ fontSize: 12, color: C.muted }}>›</span>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
              {selectedConcept.ingredient}
            </span>
          </>
        )}
      </div>

      {/* Back button */}
      {(path.length > 0 || selectedConcept) && (
        <button
          onClick={() =>
            selectedConcept ? setSelectedConcept(null) : goBack()
          }
          style={{
            background: "none",
            border: "none",
            color: C.primary,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 12,
            padding: 0,
          }}
        >
          {T.backTree}
        </button>
      )}

      {/* Selected concept → brand list */}
      {selectedConcept ? (
        <div>
          <div
            style={{
              background: "#EBF5EE",
              border: `1px solid ${C.primary}33`,
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>
              {selectedConcept.ingredient}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
              {T.ingredientRoot}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selectedConcept.atc && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "3px 12px",
                    borderRadius: 8,
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  ATC: {selectedConcept.atc}
                </span>
              )}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "3px 12px",
                  borderRadius: 8,
                  background: "#dcfce7",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                }}
              >
                {selectedConcept.brandCount} {T.nhiBrands}
              </span>
            </div>
          </div>
          <FilteredBrandList
            brands={selectedConcept.brands}
            isStaff={isStaff}
            addToMyDrugs={addToMyDrugs}
            onCardClick={setDetailBrand}
            imgCount={nhiCount}
            exportName={selectedConcept.ingredient}
          />
        </div>
      ) : (
        <>
          {/* No-selection intro */}
          {!prefix && (
            <Card
              style={{ color: C.muted, padding: "18px 20px", marginBottom: 14 }}
            >
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                {T.atcBrowseDesc}
              </div>
            </Card>
          )}

          {/* Sub-group grid */}
          {childGroups.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {childGroups.map((g) => (
                <Card
                  key={g.code}
                  style={{ cursor: "pointer", padding: "12px 14px" }}
                  onClick={() => drillDown(g.code)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 14,
                          color: C.primary,
                          marginBottom: 2,
                        }}
                      >
                        {g.code}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.text,
                          fontWeight: 600,
                          lineHeight: 1.3,
                        }}
                      >
                        {getName(g.code)}
                      </div>
                      {g.ingr.length > 0 && (
                        <div
                          style={{
                            fontSize: 10,
                            color: C.muted,
                            marginTop: 4,
                            lineHeight: 1.4,
                          }}
                        >
                          {g.ingr.join(" · ")}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 8,
                        background: "#dcfce7",
                        color: "#166534",
                        flexShrink: 0,
                      }}
                    >
                      {g.count}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* 5-char level → concept cards */}
          {concepts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {concepts.map((c) => (
                <ConceptCard
                  key={c.ingredient}
                  concept={c}
                  onClick={() => setSelectedConcept(c)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Bulk Search (RxMix-style) ─────────────────────────────────────────────
function BulkSearch({ initText }) {
  const [text, setText] = useState(initText || "");
  const [rows, setRows] = useState(null);
  const [viewConcept, setViewConcept] = useState(null);
  const [detailBrand, setDetailBrand] = useState(null);
  const { T } = useLang();
  const { isStaff } = useAuth();

  function runBulk(src) {
    const source = typeof src === "string" ? src : text;
    const lines = source
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const results = lines.map((line) => {
      const matches = searchByIngredient(line);
      if (!matches.length) return { input: line, concept: null };
      return { input: line, concept: matches[0] };
    });
    setRows(results);
  }

  // Auto-run when arriving from the OCR scan flow with a prefilled list.
  useEffect(() => {
    if (initText && initText.trim()) runBulk(initText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportBulkCSV() {
    if (!rows) return;
    const header = "Input,Ingredient,ATC,Brands";
    const body = rows
      .map(
        (r) =>
          `"${r.input}","${r.concept?.ingredient || ""}","${r.concept?.atc || ""}","${r.concept?.brandCount || 0}"`,
      )
      .join("\n");
    const blob = new Blob([header + "\n" + body], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_lookup.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (viewConcept) {
    return (
      <div>
        {detailBrand && (
          <BrandDetailModal
            brand={detailBrand}
            isStaff={isStaff}
            addToMyDrugs={null}
            priceLow={0}
            priceHigh={0}
            onClose={() => setDetailBrand(null)}
          />
        )}
        <button
          onClick={() => setViewConcept(null)}
          style={{
            background: "none",
            border: "none",
            color: C.primary,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 12,
            padding: 0,
          }}
        >
          {T.backTree}
        </button>
        <div
          style={{
            background: "#EBF5EE",
            border: `1px solid ${C.primary}33`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>
            {viewConcept.ingredient}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
            {T.ingredientRoot}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "3px 12px",
              borderRadius: 8,
              background: "#dcfce7",
              color: "#166534",
              border: "1px solid #bbf7d0",
            }}
          >
            {viewConcept.brandCount} {T.nhiBrands}
          </span>
        </div>
        <FilteredBrandList
          brands={viewConcept.brands}
          isStaff={isStaff}
          addToMyDrugs={null}
          onCardClick={setDetailBrand}
          exportName={viewConcept.ingredient}
        />
      </div>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 12, padding: "18px 20px" }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
          {T.bulkTitle}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={T.bulkPlaceholder}
          rows={5}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 13,
            borderRadius: 10,
            fontFamily: "inherit",
            border: `1.5px solid ${C.border}`,
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
            lineHeight: 1.6,
          }}
        />
        <div
          style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}
        >
          <button
            onClick={runBulk}
            disabled={!text.trim()}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              background: C.primary,
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: text.trim() ? "pointer" : "default",
              opacity: text.trim() ? 1 : 0.5,
            }}
          >
            {T.bulkRun}
          </button>
          {rows && (
            <button
              onClick={exportBulkCSV}
              style={{
                padding: "9px 14px",
                borderRadius: 8,
                background: "#fff",
                border: `1px solid ${C.border}`,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                color: C.text,
              }}
            >
              {T.exportCSV}
            </button>
          )}
          <button
            onClick={() => {
              setText("");
              setRows(null);
            }}
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              background: "#f8fafc",
              border: `1px solid ${C.border}`,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              color: C.muted,
            }}
          >
            {T.bulkClear}
          </button>
        </div>
      </Card>

      {rows && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                {[
                  T.bulkColInput,
                  T.bulkColIngredient,
                  T.bulkColAtc,
                  T.bulkColBrands,
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 12px",
                      fontWeight: 700,
                      borderBottom: `2px solid ${C.border}`,
                      color: C.text,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: i % 2 ? "#fafafa" : "#fff",
                  }}
                >
                  <td style={{ padding: "9px 12px", fontWeight: 600 }}>
                    {r.input}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      color: r.concept ? C.text : C.muted,
                    }}
                  >
                    {r.concept?.ingredient || T.bulkNoMatch}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    {r.concept?.atc && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "#dbeafe",
                          color: "#1d4ed8",
                        }}
                      >
                        {r.concept.atc}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      fontWeight: 700,
                      color: C.primary,
                    }}
                  >
                    {r.concept?.brandCount || "—"}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    {r.concept && (
                      <button
                        onClick={() => setViewConcept(r.concept)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: C.primary,
                          color: "#fff",
                          border: "none",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {T.viewBrands}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Lookup Page — mode switcher wrapping Search / Browse / Bulk ───────────
function LookupPage({
  addToMyDrugs,
  ocrQuery,
  nhiCount,
  imgCount,
  initQuery,
  initAtc,
  initBulk,
}) {
  const [mode, setMode] = useState(
    initBulk ? "bulk" : initAtc ? "browse" : "search",
  );
  const { T } = useLang();
  const modes = [
    { id: "search", label: T.modeSearch, icon: "🔍" },
    { id: "browse", label: T.modeBrowse, icon: "🗂" },
    { id: "bulk", label: T.modeBulk, icon: "📋" },
  ];
  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#f1f5f9",
          borderRadius: 10,
          padding: 4,
          marginBottom: 16,
        }}
      >
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 7,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all .15s",
              background: mode === m.id ? "#fff" : "transparent",
              color: mode === m.id ? C.primary : C.muted,
              boxShadow: mode === m.id ? "0 1px 4px rgba(0,0,0,.10)" : "none",
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>
      {mode === "search" && (
        <IngredientLookup
          addToMyDrugs={addToMyDrugs}
          ocrQuery={initQuery || ocrQuery}
          imgCount={imgCount}
        />
      )}
      {mode === "browse" && (
        <ATCBrowser
          addToMyDrugs={addToMyDrugs}
          nhiCount={nhiCount}
          initAtc={initAtc}
        />
      )}
      {mode === "bulk" && <BulkSearch initText={initBulk} />}
    </div>
  );
}

// ── Ingredient Lookup (RxNav-style, Staff + Admin only) ───────────────────
// ocrQuery prop: pre-filled query from OCR pipeline — plug in when OCR tab is wired up
function IngredientLookup({ addToMyDrugs, ocrQuery, imgCount }) {
  const [query, setQuery] = useState(ocrQuery || "");
  const [concepts, setConcepts] = useState([]);
  const [showDD, setShowDD] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailBrand, setDetailBrand] = useState(null);
  const { isStaff } = useAuth();
  const { T } = useLang();
  const wrapRef = useRef();

  useEffect(() => {
    if (ocrQuery) {
      setQuery(ocrQuery);
      runSearch(ocrQuery);
    }
  }, [ocrQuery]);

  useEffect(() => {
    function h(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setShowDD(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function runSearch(q) {
    const res = q.trim().length >= 1 ? searchByIngredient(q) : [];
    setConcepts(res);
    setShowDD(q.trim().length >= 1 && res.length > 0);
    setSelected(null);
  }
  function onType(q) {
    setQuery(q);
    runSearch(q);
  }
  function pickConcept(c) {
    setSelected(c);
    setShowDD(false);
    addHist({
      type: "lookup",
      query: c.ingredient,
      result: c.atc,
      score: c.score,
    });
  }
  function clearSearch() {
    setQuery("");
    setConcepts([]);
    setSelected(null);
    setShowDD(false);
  }

  const { priceLow, priceHigh } = useMemo(() => {
    if (!selected) return { priceLow: 0, priceHigh: 0 };
    const prices = selected.brands
      .map((b) => parseFloat(b.price || 0))
      .filter((p) => p > 0)
      .sort((a, b) => a - b);
    if (prices.length < 3)
      return {
        priceLow: prices[0] || 0,
        priceHigh: prices[prices.length - 1] || 0,
      };
    return {
      priceLow: prices[Math.floor(prices.length * 0.33)],
      priceHigh: prices[Math.floor(prices.length * 0.66)],
    };
  }, [selected]);

  return (
    <div>
      <div ref={wrapRef} style={{ position: "relative", marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            value={query}
            onChange={(e) => onType(e.target.value)}
            onFocus={() =>
              query.trim().length >= 1 && concepts.length > 0 && setShowDD(true)
            }
            placeholder={T.lookupPlaceholder}
            style={{
              width: "100%",
              padding: "13px 40px 13px 40px",
              fontSize: 14,
              borderRadius: 12,
              fontFamily: "inherit",
              boxSizing: "border-box",
              border: `1.5px solid ${showDD ? C.primary : C.border}`,
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,.07)",
              transition: "border-color .15s",
            }}
          />
          {query && (
            <button
              onClick={clearSearch}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "none",
                fontSize: 20,
                cursor: "pointer",
                color: C.muted,
              }}
            >
              ×
            </button>
          )}
        </div>

        {showDD && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 200,
              background: "#fff",
              border: `1px solid ${C.border}`,
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              boxShadow: "0 8px 24px rgba(0,0,0,.13)",
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {concepts.slice(0, 8).map((c, i) => (
              <div
                key={c.ingredient}
                onMouseDown={() => pickConcept(c)}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fff",
                  borderBottom:
                    i < Math.min(concepts.length, 8) - 1
                      ? `1px solid ${C.border}`
                      : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f0f7ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {c.ingredient}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {c.atc && <span style={{ marginRight: 8 }}>{c.atc}</span>}
                    {c.atcCategory}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 10,
                    background: "#dcfce7",
                    color: "#166534",
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  {c.brandCount}
                </span>
              </div>
            ))}
            {concepts.length > 8 && (
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  color: C.muted,
                  textAlign: "center",
                }}
              >
                {concepts.length - 8} {T.moreKeepTyping}
              </div>
            )}
          </div>
        )}
      </div>

      {selected ? (
        <div>
          <button
            onClick={() => setSelected(null)}
            style={{
              border: "none",
              background: "transparent",
              color: C.primary,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 14,
              padding: 0,
            }}
          >
            {T.backAll}
          </button>

          <div
            style={{
              background: "#EBF5EE",
              border: `1px solid ${C.primary}33`,
              borderRadius: 14,
              padding: "16px 18px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: C.text,
                marginBottom: 3,
              }}
            >
              {selected.ingredient}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
              {T.ingredientRoot}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selected.atc && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "3px 12px",
                    borderRadius: 8,
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  ATC: {selected.atc}
                </span>
              )}
              {selected.atcCategory && (
                <span
                  style={{
                    fontSize: 12,
                    padding: "3px 12px",
                    borderRadius: 8,
                    background: "#f3f4f6",
                    color: "#374151",
                  }}
                >
                  {selected.atcCategory}
                </span>
              )}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "3px 12px",
                  borderRadius: 8,
                  background: "#dcfce7",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                }}
              >
                {selected.brandCount} {T.nhiBrands}
              </span>
            </div>
          </div>

          <FilteredBrandList
            brands={selected.brands}
            isStaff={isStaff}
            addToMyDrugs={addToMyDrugs}
            onCardClick={setDetailBrand}
            imgCount={imgCount}
            exportName={selected.ingredient}
          />
        </div>
      ) : (
        <>
          {concepts.length > 0 && !showDD ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {concepts.map((c) => (
                <ConceptCard
                  key={c.ingredient}
                  concept={c}
                  onClick={() => pickConcept(c)}
                />
              ))}
            </div>
          ) : query.trim().length >= 2 && !showDD ? (
            <Card style={{ textAlign: "center", color: C.muted, padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <div>
                {T.noIngredientFound} "<b>{query}</b>"
              </div>
              <div style={{ fontSize: 13, marginTop: 6, color: C.muted }}>
                Try: "metformin" · "quetiapine" · "N05AH" · "A10BA02" · "氧化鎂"
              </div>
            </Card>
          ) : !query ? (
            <Card
              style={{
                color: C.muted,
                padding: "32px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 14 }}>🧬</div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 17,
                  marginBottom: 8,
                  color: C.text,
                }}
              >
                {T.lookup}
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.7,
                  marginBottom: 16,
                  color: C.muted,
                  maxWidth: 320,
                  margin: "0 auto 16px",
                }}
              >
                {T.lookupDesc}
              </div>
              <div
                style={{
                  background: "#f0fdf4",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontSize: 12,
                  color: "#166534",
                  lineHeight: 1.9,
                  textAlign: "left",
                  display: "inline-block",
                }}
                dangerouslySetInnerHTML={{ __html: T.lookupExamples }}
              />
            </Card>
          ) : null}
        </>
      )}
      {detailBrand && (
        <BrandDetailModal
          brand={detailBrand}
          isStaff={isStaff}
          addToMyDrugs={addToMyDrugs}
          priceLow={priceLow}
          priceHigh={priceHigh}
          onClose={() => setDetailBrand(null)}
        />
      )}
    </div>
  );
}

// ── Canvas Image Preprocessing (Grayscale + Otsu Binarization + Upscale) ──
async function preprocessForOCR(file, mode = "standard") {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(file);

    img.onload = () => {
      try {
        const scale = Math.min(
          4,
          Math.max(1.5, 2600 / Math.max(img.width, img.height)),
        );
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        const n = w * h;

        const gray = new Uint8Array(n);

        for (let i = 0; i < n; i++) {
          let r = d[i * 4];
          let g = d[i * 4 + 1];
          let b = d[i * 4 + 2];

          let v = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

          if (mode === "contrast") {
            v = Math.min(255, Math.max(0, (v - 128) * 1.45 + 128));
          }

          if (mode === "darkText") {
            v = Math.min(255, Math.max(0, (v - 115) * 1.7 + 115));
          }

          if (mode === "cjk") {
            // Gentle contrast only — preserve stroke gradients for dense
            // Traditional Chinese glyphs.
            v = Math.min(255, Math.max(0, (v - 128) * 1.2 + 128));
          }

          gray[i] = v;
        }

        // CJK pass: keep GRAYSCALE (no Otsu binarization). Hard black/white
        // thresholding merges/erodes the many thin strokes of Traditional
        // Chinese characters and wrecks chi_tra accuracy. Latin text tolerates
        // binarization; CJK does not — so this pass feeds Tesseract grayscale.
        if (mode === "cjk") {
          for (let i = 0; i < n; i++) {
            const v = gray[i];
            d[i * 4] = v;
            d[i * 4 + 1] = v;
            d[i * 4 + 2] = v;
            d[i * 4 + 3] = 255;
          }
          ctx.putImageData(imgData, 0, 0);
          canvas.toBlob((blob) => resolve(blob || file), "image/png");
          return;
        }

        const hist = new Int32Array(256);
        for (let i = 0; i < n; i++) hist[gray[i]]++;

        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * hist[i];

        let sumB = 0;
        let wB = 0;
        let varMax = 0;
        let threshold = 128;

        for (let t = 0; t < 256; t++) {
          wB += hist[t];
          if (!wB || wB === n) continue;

          const wF = n - wB;
          sumB += t * hist[t];

          const mB = sumB / wB;
          const mF = (sum - sumB) / wF;
          const variance = wB * wF * (mB - mF) ** 2;

          if (variance > varMax) {
            varMax = variance;
            threshold = t;
          }
        }

        if (mode === "darkText") threshold += 12;
        if (mode === "contrast") threshold -= 5;

        for (let i = 0; i < n; i++) {
          let v = gray[i] <= threshold ? 0 : 255;

          d[i * 4] = v;
          d[i * 4 + 1] = v;
          d[i * 4 + 2] = v;
          d[i * 4 + 3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, "image/png");
      } catch {
        resolve(file);
      }
    };

    img.src = URL.createObjectURL(file);
  });
}
// ── OCR Hook (real Tesseract.js + demo mode) ──────────────────────────────
function useOCR() {
  const [stage, setStage] = useState("idle"); // idle|preprocessing|loading|recognizing|matching|done|error
  const [progress, setProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [result, setResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrError, setOcrError] = useState(null);

  async function recognize(imageFile) {
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    setStage("preprocessing");
    setProgress(0);
    setOcrError(null);
    setResult(null);

    try {
      const { createWorker } = await import("tesseract.js");

      setStage("loading");

      const worker = await createWorker(["eng", "chi_tra"], 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setStage("recognizing");
            setProgress(Math.round(m.progress * 100));
          } else {
            setOcrStatus(m.status || "");
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: "6",
        preserve_interword_spaces: "1",
        // Images are upscaled before OCR; pin DPI so Tesseract stops guessing
        // (a wrong DPI estimate hurts CJK far more than Latin).
        user_defined_dpi: "300",
      });

      // standard + darkText → binarized passes tuned for Latin drug names.
      // cjk → grayscale (non-binarized) pass tuned for Traditional Chinese.
      const modes = ["standard", "darkText", "cjk"];
      const texts = [];

      for (const mode of modes) {
        setStage("preprocessing");
        const processedBlob = await preprocessForOCR(imageFile, mode);
        const processedUrl = URL.createObjectURL(processedBlob);

        setStage("recognizing");
        const {
          data: { text },
        } = await worker.recognize(processedUrl);

        if (text && text.trim()) {
          texts.push(text.trim());
        }

        URL.revokeObjectURL(processedUrl);
      }

      await worker.terminate();

      setStage("matching");

      const mergedText = [...new Set(texts)].join("\n\n--- OCR PASS ---\n\n");

      const cleanedText = cleanOCRText(mergedText);
      const matched = matchOcrText(cleanedText);
      // Pre-process raw OCR → clean candidate drug lines (name + strength +
      // form) ready to push into Bulk lookup / ingredient search.
      const detected = extractDrugLines(mergedText);

      setResult({
        rawText: cleanedText,
        matched,
        detected,
      });

      setStage("done");
    } catch (e) {
      console.error(e);
      setOcrError(e.message || "OCR failed. Try the demo mode.");
      setStage("error");
    }
  }

  async function runDemo() {
    setPreviewUrl(null);
    setStage("loading");
    setProgress(0);
    setOcrError(null);
    setResult(null);
    await new Promise((r) => setTimeout(r, 500));
    setStage("recognizing");
    for (let p = 0; p <= 100; p += 4) {
      await new Promise((r) => setTimeout(r, 55));
      setProgress(p);
    }
    setStage("matching");
    await new Promise((r) => setTimeout(r, 350));
    setResult({
      rawText: DEMO_OCR_RESULT.rawText,
      matched: DEMO_OCR_RESULT.matched,
      detected: extractDrugLines(DEMO_OCR_RESULT.rawText),
    });
    setStage("done");
  }

  function reset() {
    setPreviewUrl(null);
    setStage("idle");
    setProgress(0);
    setOcrStatus("");
    setResult(null);
    setOcrError(null);
  }

  return {
    stage,
    progress,
    ocrStatus,
    result,
    previewUrl,
    ocrError,
    recognize,
    runDemo,
    reset,
  };
}

function cleanOCRText(text) {
  if (!text) return "";

  return text
    .replace(/[|]/g, "I")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/([A-Za-z])\s+([A-Za-z])/g, "$1 $2")
    .replace(/(\d)\s+mg/gi, "$1mg")
    .replace(/(\d)\s+mcg/gi, "$1mcg")
    .replace(/(\d)\s+ml/gi, "$1ml")
    .replace(/tabiet/gi, "tablet")
    .replace(/capsuie/gi, "capsule")
    .replace(/ibuproten/gi, "ibuprofen")
    .replace(/warfarln/gi, "warfarin")
    .trim();
}

// ── Scan Rx ────────────────────────────────────────────────────────────────
function ScanRx({ addToMyDrugs }) {
  const ocr = useOCR();
  const [added, setAdded] = useState(new Set());
  const [reportDrug, setReportDrug] = useState(null);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const fileRef = useRef();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const { isStaff } = useAuth();
  const cc = (s) =>
    s >= LOW_CONF ? C.success : s >= 0.55 ? C.warning : C.danger;

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) ocr.recognize(file);
    e.target.value = "";
  }

  async function openCamera() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Camera is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error(err);
      alert(
        "Camera cannot be opened. Please allow camera permission in browser.",
      );
    }
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], "camera-photo.jpg", {
          type: "image/jpeg",
        });
        closeCamera();
        ocr.recognize(file);
      },
      "image/jpeg",
      0.95,
    );
  }

  function addMed(drug) {
    setAdded((p) => new Set([...p, drug.id]));

    if (addToMyDrugs) {
      addToMyDrugs(drug);
    }

    addHist({
      type: "scan",
      query: drug.nameEN,
      result: drug.ingredient,
      score: 0.95,
    });
  }

  if (ocr.stage === "idle")
    return (
      <Card>
        {reportDrug && (
          <ReportModal drug={reportDrug} onClose={() => setReportDrug(null)} />
        )}

        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: "50%",
              background: "#1B6840",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 900,
              margin: "0 auto 16px",
              boxShadow: "0 14px 28px rgba(14,159,110,.24)",
            }}
          >
            +
          </div>

          <div
            style={{
              fontWeight: 800,
              fontSize: 21,
              marginBottom: 8,
              color: C.text,
            }}
          >
            Upload Image
          </div>

          <div
            style={{
              fontSize: 13,
              color: C.muted,
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Upload image or take a photo using your laptop camera.
            <br />
            OCR will extract drug names from the image.
          </div>

          <button
            onClick={() => fileRef.current.click()}
            style={{
              width: "100%",
              maxWidth: 280,
              padding: "14px 22px",
              background: "#1B6840",
              color: "#fff",
              border: "none",
              borderRadius: 16,
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 12px 24px rgba(14,159,110,.20)",
              marginBottom: 12,
            }}
          >
            + Upload Image
          </button>

          <button
            onClick={openCamera}
            style={{
              width: "100%",
              maxWidth: 280,
              padding: "13px 22px",
              background: "#ffffff",
              color: C.primary,
              border: `1px solid ${C.primary}`,
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            📷 Take Photo
          </button>

          <button
            onClick={ocr.runDemo}
            style={{
              width: "100%",
              maxWidth: 280,
              padding: "13px 22px",
              background: "#f8fafc",
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🧪 Demo Prescription
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFile}
          />

          <div style={{ marginTop: 16, fontSize: 11, color: C.muted }}>
            Supports JPG · PNG · WEBP · HEIC
          </div>
        </div>

        {cameraOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,.72)",
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 520,
                background: "#fff",
                borderRadius: 24,
                padding: 16,
                boxShadow: "0 24px 60px rgba(0,0,0,.28)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: C.text,
                  }}
                >
                  Take Prescription Photo
                </div>

                <button
                  onClick={closeCamera}
                  style={{
                    border: "none",
                    background: "#f1f5f9",
                    borderRadius: 12,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  borderRadius: 18,
                  background: "#000",
                  maxHeight: 420,
                  objectFit: "cover",
                }}
              />

              <canvas ref={canvasRef} style={{ display: "none" }} />

              <button
                onClick={takePhoto}
                style={{
                  width: "100%",
                  marginTop: 14,
                  padding: "14px 16px",
                  border: "none",
                  borderRadius: 16,
                  background: "#1B6840",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Capture & Run OCR
              </button>
            </div>
          </div>
        )}
      </Card>
    );

  if (
    ["preprocessing", "loading", "recognizing", "matching"].includes(ocr.stage)
  )
    return (
      <Card style={{ textAlign: "center", padding: 44 }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>
          {ocr.stage === "matching"
            ? "🔍"
            : ocr.stage === "recognizing"
              ? "🔤"
              : ocr.stage === "preprocessing"
                ? "🖼️"
                : "⚙️"}
        </div>

        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
          {ocr.stage === "matching"
            ? "Matching against NHI drug database..."
            : ocr.stage === "recognizing"
              ? "Extracting text from image..."
              : ocr.stage === "preprocessing"
                ? "Enhancing image quality..."
                : "Initializing OCR engine..."}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {[
            ["preprocessing", "🖼️ Pre-process"],
            ["loading", "⚙️ Init OCR"],
            ["recognizing", "🔤 Read text"],
            ["matching", "🔍 Match drugs"],
          ].map(([s, label]) => {
            const stages = [
              "preprocessing",
              "loading",
              "recognizing",
              "matching",
            ];
            const idx = stages.indexOf(ocr.stage);
            const thisIdx = stages.indexOf(s);
            const done = thisIdx < idx;
            const active = thisIdx === idx;

            return (
              <span
                key={s}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: done
                    ? "#dcfce7"
                    : active
                      ? C.primary + "18"
                      : "#f1f5f9",
                  color: done ? "#166534" : active ? C.primary : C.muted,
                  border: `1px solid ${done ? "#86efac" : active ? C.primary + "44" : C.border}`,
                }}
              >
                {done ? "✓ " : ""}
                {label}
              </span>
            );
          })}
        </div>

        {ocr.stage === "loading" && (
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
            {ocr.ocrStatus || "Loading Tesseract engine and language data..."}
          </div>
        )}

        {ocr.stage === "recognizing" && (
          <>
            <div
              style={{
                background: "#e2e8f0",
                borderRadius: 20,
                height: 10,
                overflow: "hidden",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 20,
                  background: C.primary,
                  width: `${ocr.progress}%`,
                  transition: "width 0.1s ease",
                }}
              />
            </div>

            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
              {ocr.progress}%
            </div>
          </>
        )}

        {ocr.previewUrl && (
          <img
            src={ocr.previewUrl}
            alt="preview"
            style={{
              maxHeight: 100,
              maxWidth: "100%",
              borderRadius: 8,
              opacity: 0.65,
              marginTop: 8,
            }}
          />
        )}
      </Card>
    );

  if (ocr.stage === "error")
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "28px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>

          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: C.danger,
              marginBottom: 8,
            }}
          >
            OCR Failed
          </div>

          <div
            style={{
              fontSize: 13,
              color: C.muted,
              marginBottom: 20,
              maxWidth: 320,
              margin: "0 auto 20px",
            }}
          >
            {ocr.ocrError}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={ocr.reset}
              style={{
                padding: "10px 20px",
                background: "#f1f5f9",
                color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>

            <button
              onClick={ocr.runDemo}
              style={{
                padding: "10px 20px",
                background: C.primary,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🧪 Use Demo
            </button>
          </div>
        </div>
      </Card>
    );

  const { rawText, matched } = ocr.result;
  const detected = ocr.result.detected || [];
  const highConf = matched.filter((m) => m.confidence >= LOW_CONF);
  const lowConf = matched.filter((m) => m.confidence < LOW_CONF);

  // Route a cleaned drug string into the existing search flow.
  // navigate-ingredient → staff land on Lookup, guests on Drug Search.
  function searchCleaned(query) {
    if (!query) return;
    window.dispatchEvent(
      new CustomEvent("navigate-ingredient", { detail: { query } }),
    );
  }

  function sendAllToBulk() {
    const text = buildBulkText(detected);
    if (!text) return;
    window.dispatchEvent(new CustomEvent("navigate-bulk", { detail: { text } }));
  }

  function copyCleaned() {
    const text = buildBulkText(detected);
    if (text && navigator.clipboard) navigator.clipboard.writeText(text);
  }

  function DrugResultCard({ drug, confidence }) {
    return (
      <Card>
        <LowConfWarning score={confidence} name={drug.nameEN} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
            onClick={() => setSelectedDrug(drug)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {drug.ingredient}
              </span>

              <DrugClassBadge raw={drug.drugClass} />

              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: cc(confidence) + "22",
                  color: cc(confidence),
                  fontWeight: 600,
                }}
              >
                {Math.round(confidence * 100)}% confidence
              </span>
            </div>

            <div style={{ fontSize: 13, color: C.muted }}>
              {drug.nameEN} · {drug.nameZH}
            </div>

            <div
              style={{
                fontSize: 12,
                color: C.muted,
                marginTop: 4,
              }}
            >
              {drug.id} · ATC: {drug.atc} · {dosageFormEN(drug.form)}{" "}
              {drug.strength}
              {isStaff && parseFloat(drug.price) > 0 && ` · NT$ ${drug.price}`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginLeft: 12,
              flexShrink: 0,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                addMed(drug);
              }}
              disabled={added.has(drug.id)}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: added.has(drug.id) ? "default" : "pointer",
                background: added.has(drug.id) ? "#e8f5e9" : C.primary,
                color: added.has(drug.id) ? C.success : "#fff",
              }}
            >
              {added.has(drug.id) ? "✓ Added" : "+ Add"}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setReportDrug(drug);
              }}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                border: `1px solid ${C.danger}44`,
                background: "#fff5f5",
                color: C.danger,
                cursor: "pointer",
              }}
            >
              ⚠ Error
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {reportDrug && (
        <ReportModal drug={reportDrug} onClose={() => setReportDrug(null)} />
      )}
      {selectedDrug && (
        <BrandDetailModal
          brand={selectedDrug}
          isStaff={isStaff}
          addToMyDrugs={addToMyDrugs}
          priceLow={0}
          priceHigh={0}
          onClose={() => setSelectedDrug(null)}
        />
      )}

      <Card
        style={{
          background: matched.length > 0 ? "#f0fdf4" : "#fffbeb",
          border: `1px solid ${matched.length > 0 ? C.success : "#fbbf24"}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: matched.length > 0 ? "#166534" : "#92400e",
                marginBottom: 6,
              }}
            >
              {matched.length > 0
                ? `✅ OCR Complete — ${matched.length} drug${matched.length !== 1 ? "s" : ""} identified (${highConf.length} high confidence)`
                : "⚠️ OCR Complete — no drugs identified in database"}
            </div>

            <div
              style={{
                fontSize: 11,
                color: C.muted,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                maxHeight: 68,
                overflowY: "auto",
                background: "rgba(255,255,255,.7)",
                padding: "6px 8px",
                borderRadius: 6,
                lineHeight: 1.5,
              }}
            >
              {rawText ||
                "(no text extracted — image may be too dark or blurry)"}
            </div>
          </div>

          {ocr.previewUrl && (
            <img
              src={ocr.previewUrl}
              alt="scan"
              style={{
                maxHeight: 76,
                maxWidth: 86,
                borderRadius: 6,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}
        </div>
      </Card>

      {detected.length > 0 && (
        <Card style={{ background: "#f8fafc", border: `1px solid ${C.border}` }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>
              🧹 Cleaned drug list ({detected.length})
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {isStaff && (
                <button
                  onClick={sendAllToBulk}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    background: C.primary,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  📋 Send all to Bulk
                </button>
              )}
              <button
                onClick={copyCleaned}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  color: C.text,
                  cursor: "pointer",
                }}
              >
                ⧉ Copy
              </button>
            </div>
          </div>

          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
            Pre-processed from OCR — drug name + strength only. Tap a row to
            search it.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {detected.map((d, i) => (
              <div
                key={`${d.name}-${i}`}
                onClick={() => searchCleaned(d.searchText)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  background: "#fff",
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</span>
                  {d.strength && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.primary,
                      }}
                    >
                      {d.strength}
                    </span>
                  )}
                  {d.form && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: C.muted }}>
                      {d.form}
                    </span>
                  )}
                  {d.zh && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: C.muted }}>
                      {d.zh}
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.primary,
                    flexShrink: 0,
                  }}
                >
                  🔍 Search
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {matched.length === 0 && (
        <Card style={{ textAlign: "center", padding: 32, color: C.muted }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🤔</div>

          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            No drugs matched in NHI database
          </div>

          <div style={{ fontSize: 13, marginBottom: 16 }}>
            OCR couldn't find recognizable drug names. Try a clearer photo,
            <br />
            or search manually in the 🔍 Drug Search tab.
          </div>

          <button
            onClick={ocr.runDemo}
            style={{
              padding: "8px 18px",
              background: C.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🧪 Try Demo Prescription
          </button>
        </Card>
      )}

      {highConf.length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#166534" }}>
            ✅ High Confidence ({highConf.length})
          </div>

          {highConf.map((m) => (
            <DrugResultCard key={m.drug.id} {...m} />
          ))}
        </>
      )}

      {lowConf.length > 0 && (
        <>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: C.warning,
              marginTop: 4,
            }}
          >
            ⚠️ Possible Matches — verify before adding ({lowConf.length})
          </div>

          <div
            style={{
              fontSize: 12,
              color: C.muted,
              marginTop: -6,
            }}
          >
            These were partially matched from OCR text. Check name and dosage
            carefully.
          </div>

          {lowConf.map((m) => (
            <DrugResultCard key={m.drug.id} {...m} />
          ))}
        </>
      )}

      {added.size > 0 && (
        <Card
          style={{
            background: "#f0fdf4",
            border: `1px solid ${C.success}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 600, color: "#166534" }}>
            {added.size} drug{added.size > 1 ? "s" : ""} added to My Medications
            ✓
          </div>
        </Card>
      )}

      <button
        onClick={() => {
          ocr.reset();
          setAdded(new Set());
        }}
        style={{
          padding: "12px",
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          background: "#f8fafc",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          color: C.text,
        }}
      >
        Scan Another Prescription
      </button>
    </div>
  );
}

// ── Auto Interaction Banner ────────────────────────────────────────────────
function InteractionBanner({ meds }) {
  const alerts = useMemo(() => checkInteractions(meds), [meds]);
  if (alerts.length === 0) return null;
  const worst = alerts[0];
  const cfg = SEVERITY_CFG[worst.severity] || SEVERITY_CFG.LOW;
  return (
    <div
      style={{
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: alerts.length > 0 ? 10 : 0,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 22 }}>{cfg.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: cfg.color }}>
            {alerts.length} Drug Interaction{alerts.length > 1 ? "s" : ""}{" "}
            Detected in Your Meds
          </div>
          <div
            style={{
              fontSize: 12,
              color: cfg.color,
              opacity: 0.85,
              marginTop: 1,
            }}
          >
            Highest severity: {worst.severity} · {worst.drugA.ingredient} ↔{" "}
            {worst.drugB.ingredient}
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: cfg.color,
            background: "rgba(255,255,255,.65)",
            padding: "3px 9px",
            borderRadius: 10,
            flexShrink: 0,
          }}
        >
          See ⚠️ Interactions tab
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {alerts.slice(0, 3).map((a, i) => {
          const c2 = SEVERITY_CFG[a.severity] || SEVERITY_CFG.LOW;
          return (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,.55)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 700, color: c2.color }}>
                {c2.icon} {a.drugA.ingredient} + {a.drugB.ingredient}{" "}
              </span>
              <span style={{ color: "#374151" }}>
                {a.en.length > 90 ? a.en.slice(0, 90) + "…" : a.en}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── My Medications ─────────────────────────────────────────────────────────
function MyMeds({ meds, setMeds }) {
  const { isStaff } = useAuth();
  const { T } = useLang();
  const [selected, setSelected] = useState(null);
  const toggle = (id) =>
    setMeds((p) =>
      p.map((m) => (m.id === id ? { ...m, reminderOn: !m.reminderOn } : m)),
    );
  const remove = (id) => setMeds((p) => p.filter((m) => m.id !== id));

  function printMeds() {
    const rows = meds
      .map(
        (m) => `
      <tr>
        <td><b>${m.ingredient}</b><br/><span style="color:#6b7280;font-size:12px">${m.nameEN}</span></td>
        <td>${dosageFormEN(m.form) || m.form} ${m.strength}</td>
        <td>${m.times.join("、")}</td>
        <td>${m.reminderOn ? "✔" : "—"}</td>
      </tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>${T.printTitle}</title>
      <style>
        body{font-family:sans-serif;padding:32px;color:#111;max-width:700px;margin:0 auto}
        h2{font-size:20px;margin-bottom:4px}
        p.sub{color:#6b7280;font-size:13px;margin:0 0 20px}
        table{width:100%;border-collapse:collapse;font-size:14px}
        th{background:#f1f5f9;padding:9px 12px;text-align:left;font-weight:700;border-bottom:2px solid #e2e8f0}
        td{padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top}
        @media print{body{padding:16px}}
      </style></head><body>
      <h2>💊 ${T.printTitle}</h2>
      <p class="sub">${new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })} &nbsp;·&nbsp; ${meds.length} ${T.drugCount}</p>
      <table>
        <thead><tr>
          <th>${T.activeIngredient}</th><th>${T.dosageLabel}</th>
          <th>⏰ Times</th><th>Reminder</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:28px;font-size:11px;color:#94a3b8">RxNorm Taiwan · NHI ${DATA_VERSION.date} · For personal reference only</p>
      <script>window.onload=()=>window.print()<\/script>
      </body></html>`;
    const w = window.open("", "_blank", "width=780,height=600");
    w.document.write(html);
    w.document.close();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {selected && (
        <BrandDetailModal
          brand={selected}
          isStaff={isStaff}
          addToMyDrugs={() => {}}
          priceLow={0}
          priceHigh={0}
          onClose={() => setSelected(null)}
        />
      )}
      {meds.length >= 2 && <InteractionBanner meds={meds} />}
      {meds.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 48, color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            No medications yet
          </div>
          <div style={{ fontSize: 13 }}>
            Use Drug Search or Scan Rx to add medications here.
          </div>
        </Card>
      ) : (
        meds.map((med) => (
          <Card
            key={med.id}
            style={{ cursor: "pointer" }}
            onClick={() => setSelected(med)}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {med.ingredient}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                  {med.nameEN}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  {dosageFormEN(med.form)} · {med.strength}
                </div>
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}
                  >
                    ⏰ Reminder times:
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {med.times.map((t) => (
                      <span
                        key={t}
                        style={{
                          background: med.reminderOn
                            ? C.primary + "18"
                            : "#f1f5f9",
                          color: med.reminderOn ? C.primary : C.muted,
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "flex-end",
                  marginLeft: 12,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(med.id);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    border: `1px solid ${med.reminderOn ? C.success : C.border}`,
                    cursor: "pointer",
                    background: med.reminderOn ? "#f0fdf4" : "#f8fafc",
                    color: med.reminderOn ? C.success : C.muted,
                  }}
                >
                  {med.reminderOn ? "🔔 On" : "🔕 Off"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(med.id);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    border: `1px solid ${C.border}`,
                    cursor: "pointer",
                    background: "#fff",
                    color: C.danger,
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </Card>
        ))
      )}
      {meds.length > 0 && (
        <button
          onClick={printMeds}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "#f8fafc",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            color: C.text,
          }}
        >
          {T.printMeds}
        </button>
      )}
      <LockedFeature minRole="staff">
        <Card style={{ background: C.staffBg, border: `1px solid #fbbf24` }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            📤 Export Medication List (Staff)
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
            Download as CSV for clinical documentation.
          </div>
          <button
            onClick={() => {
              const csv =
                "NHI Code,Drug Name,Ingredient,ATC,Form,Strength\n" +
                meds
                  .map(
                    (m) =>
                      `${m.id},"${m.nameEN}","${m.ingredient}",${m.atc},${m.form},${m.strength}`,
                  )
                  .join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(
                new Blob([csv], { type: "text/csv" }),
              );
              a.download = "medications_export.csv";
              a.click();
            }}
            style={{
              padding: "8px 16px",
              background: C.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Download CSV
          </button>
        </Card>
      </LockedFeature>
    </div>
  );
}

// ── Scan History ───────────────────────────────────────────────────────────
function ScanHistory({ myDrugs, setMyDrugs, addToMyDrugs }) {
  const { isStaff } = useAuth();
  const [tick, setTick] = useState(0);
  const h = HISTORY;
  const fmt = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };
  const cc = (s) =>
    s >= LOW_CONF ? C.success : s >= 0.55 ? C.warning : C.danger;

  function addHistoryDrugToMyDrugs(record) {
    const drug = DRUGS.find(
      (d) =>
        d.nameEN === record.query ||
        d.ingredient === record.result ||
        d.id === record.query,
    );

    if (!drug) return;

    if (addToMyDrugs) {
      addToMyDrugs(drug);
      return;
    }

    if (setMyDrugs) {
      setMyDrugs((prev) => {
        if (prev.some((m) => m.id === drug.id)) return prev;
        return [...prev, { ...drug, times: ["09:00"], reminderOn: true }];
      });
    }
  }
  function exportCSV() {
    const csv =
      "Timestamp,Type,Query,Result,Confidence\n" +
      h
        .map(
          (r) =>
            `"${fmt(r.ts)}","${r.type}","${r.query}","${r.result}","${Math.round((r.score || 0) * 100)}%"`,
        )
        .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "scan_history.csv";
    a.click();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Scan History</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            {h.length}/50 records · stored on this device
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setTick((t) => t + 1)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "#f8fafc",
              fontSize: 13,
              cursor: "pointer",
              color: C.text,
            }}
          >
            Refresh
          </button>
          {isStaff && h.length > 0 && (
            <button
              onClick={exportCSV}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                background: C.primary,
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📤 Export CSV
            </button>
          )}
        </div>
      </div>

      {!isStaff && h.length > 0 && (
        <div
          style={{
            background: C.staffBg,
            border: `1px solid #fbbf24`,
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            color: "#92400e",
          }}
        >
          💡 Sign in as Staff or Admin to export history as CSV.
        </div>
      )}

      {h.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 48, color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🕐</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No history yet</div>
          <div style={{ fontSize: 13 }}>
            Search or scan a drug to build your history.
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {h.map((r, i) => (
            <Card key={i} style={{ padding: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: r.type === "scan" ? "#e0f2fe" : "#f0fdf4",
                        color: r.type === "scan" ? "#0369a1" : "#166534",
                      }}
                    >
                      {r.type === "scan" ? "📷 Scan" : "🔍 Search"}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {r.query}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    Matched: <b>{r.result}</b>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    {fmt(r.ts)}
                  </div>
                  <button
                    onClick={() => addHistoryDrugToMyDrugs(r)}
                    style={{
                      marginTop: 8,
                      padding: "7px 12px",
                      borderRadius: 10,
                      border: "none",
                      background: C.primary,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Add to My Drugs
                  </button>
                </div>
                {r.score != null && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 12,
                      background: cc(r.score) + "20",
                      color: cc(r.score),
                      flexShrink: 0,
                      marginLeft: 10,
                    }}
                  >
                    {Math.round(r.score * 100)}%
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsPage({
  darkMode,
  setDarkMode,
  language,
  setLanguage,
  T,
  myDrugs,
  setMyDrugs,
  addToMyDrugs,
}) {
  const { isAdmin, isStaff } = useAuth();
  const isSignedIn = isAdmin || isStaff;
  const theme = darkMode ? D : C;
  const [settingsSubPage, setSettingsSubPage] = useState("main");

  if (settingsSubPage === "profile") {
    return (
      <SettingsSubLayout
        title="User Profile"
        theme={theme}
        onBack={() => setSettingsSubPage("main")}
      >
        <UserProfilePage darkMode={darkMode} />
      </SettingsSubLayout>
    );
  }

  if (settingsSubPage === "history") {
    return (
      <SettingsSubLayout
        title="Scan History"
        theme={theme}
        onBack={() => setSettingsSubPage("main")}
      >
        <ScanHistory
          myDrugs={myDrugs}
          setMyDrugs={setMyDrugs}
          addToMyDrugs={addToMyDrugs}
        />
      </SettingsSubLayout>
    );
  }

  if (settingsSubPage === "myDrugs") {
    return (
      <SettingsSubLayout
        title="My Drugs"
        theme={theme}
        onBack={() => setSettingsSubPage("main")}
      >
        <MyMeds meds={myDrugs} setMeds={setMyDrugs} />
      </SettingsSubLayout>
    );
  }

  return (
    <div
      style={{
        color: theme.text,
        background: theme.card,
        minHeight: "calc(100vh - 230px)",
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 8,
          color: theme.text,
        }}
      >
        {T.settings}
      </div>

      <div style={{ color: theme.muted, fontSize: 14, marginBottom: 24 }}>
        Manage profile, scan history, drugs, and app preferences.
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {isSignedIn && (
          <>
            <SettingsMenuItem
              darkMode={darkMode}
              title="User Profile"
              desc="View and manage signed-in user information"
              onClick={() => setSettingsSubPage("profile")}
            />

            <SettingsMenuItem
              darkMode={darkMode}
              title="Scan History"
              desc="View prescription scan records and add important drugs"
              onClick={() => setSettingsSubPage("history")}
            />

            <SettingsMenuItem
              darkMode={darkMode}
              title="My Drugs"
              desc="Manage saved medications and reminders"
              onClick={() => setSettingsSubPage("myDrugs")}
            />
          </>
        )}

        <div style={getSettingsCardStyle(darkMode)}>
          <div>
            <div style={getSettingsTitleStyle(darkMode)}>{T.mode}</div>
            <div style={getSettingsDescStyle(darkMode)}>{T.modeDesc}</div>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={getSettingsButtonStyle()}
          >
            {darkMode ? T.dark : T.light}
          </button>
        </div>

        <div style={getSettingsCardStyle(darkMode)}>
          <div>
            <div style={getSettingsTitleStyle(darkMode)}>{T.language}</div>
            <div style={getSettingsDescStyle(darkMode)}>{T.languageDesc}</div>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              border: "none",
              background: "#1B6840",
              color: "#fff",
              borderRadius: 12,
              padding: "8px 12px",
              fontWeight: 700,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="en">English</option>
            <option value="zhTW">繁體中文</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function getSettingsCardStyle(darkMode) {
  return {
    background: darkMode ? D.card : C.card,
    border: `1px solid ${darkMode ? D.border : C.border}`,
    borderRadius: 18,
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    boxShadow: darkMode
      ? "0 8px 22px rgba(0,0,0,.24)"
      : "0 6px 18px rgba(15,23,42,.05)",
  };
}

function getSettingsTitleStyle(darkMode) {
  return {
    fontSize: 15,
    fontWeight: 700,
    color: darkMode ? D.text : C.text,
  };
}

function getSettingsDescStyle(darkMode) {
  return {
    fontSize: 12,
    color: darkMode ? D.muted : C.muted,
    marginTop: 4,
  };
}

function getSettingsButtonStyle() {
  return {
    border: "none",
    background: "#1B6840",
    color: "#fff",
    borderRadius: 12,
    padding: "8px 14px",
    fontWeight: 700,
    cursor: "pointer",
  };
}
// ── AI Drug Interaction Center (Staff/Admin only) ──────────────────────────
const SEVERITY_CFG = {
  HIGH: {
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fca5a5",
    icon: "🔴",
    label: "HIGH",
  },
  MODERATE: {
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fcd34d",
    icon: "🟡",
    label: "MODERATE",
  },
  LOW: {
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#86efac",
    icon: "🟢",
    label: "LOW",
  },
};

function getKnownInteractionsFor(drug) {
  if (!drug) return [];
  const ingr = (drug.ingredient || "").toLowerCase().trim();
  if (!ingr) return [];
  return INTERACTION_DB.filter((ix) =>
    ix.drugs.some((d) => ingr.includes(d) || d.includes(ingr)),
  )
    .map((ix) => {
      const match = ix.drugs.find((d) => ingr.includes(d) || d.includes(ingr));
      const other = ix.drugs.find((d) => d !== match) || ix.drugs[1];
      return {
        ...ix,
        otherName: other.charAt(0).toUpperCase() + other.slice(1),
      };
    })
    .sort(
      (a, b) =>
        ({ HIGH: 0, MODERATE: 1, LOW: 2 })[a.severity] -
        { HIGH: 0, MODERATE: 1, LOW: 2 }[b.severity],
    );
}

function IxCard({ ix, showPair = false }) {
  const cfg = SEVERITY_CFG[ix.severity] || SEVERITY_CFG.LOW;
  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 0,
      }}
    >
      {/* severity header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: cfg.bg,
          borderBottom: `1px solid ${cfg.border}`,
        }}
      >
        <span style={{ fontSize: 15 }}>{cfg.icon}</span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 12,
            color: cfg.color,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {cfg.label}
        </span>
        {showPair && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.text,
              marginLeft: 4,
            }}
          >
            {ix.drugs
              .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
              .join(" ↔ ")}
          </span>
        )}
        {!showPair && ix.otherName && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.text,
              marginLeft: 4,
            }}
          >
            ↔ {ix.otherName}
          </span>
        )}
      </div>
      {/* body */}
      <div style={{ padding: "10px 14px", background: "#fff" }}>
        <div
          style={{
            fontSize: 13,
            color: C.text,
            marginBottom: 4,
            lineHeight: 1.5,
          }}
        >
          {ix.en}
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.muted,
            marginBottom: 8,
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          {ix.zh}
        </div>
        <div
          style={{
            background: "#f8fafc",
            borderRadius: 6,
            padding: "7px 10px",
            fontSize: 12,
            color: "#334155",
          }}
        >
          <span style={{ fontWeight: 700 }}>Clinical Management: </span>
          {ix.management}
        </div>
      </div>
    </div>
  );
}

function DrugInteractionCenter({ preset }) {
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [resultsA, setResultsA] = useState([]);
  const [resultsB, setResultsB] = useState([]);
  const [selA, setSelA] = useState(null);
  const [selB, setSelB] = useState(null);
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [checked, setChecked] = useState(false);
  const [knownIx, setKnownIx] = useState([]);
  const [presetDrug, setPresetDrug] = useState(null);
  const refA = useRef();
  const refB = useRef();

  useEffect(() => {
    function h(e) {
      if (refA.current && !refA.current.contains(e.target)) setShowA(false);
      if (refB.current && !refB.current.contains(e.target)) setShowB(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (preset) {
      setPresetDrug(preset);
      setSelA(preset);
      setDrugA(preset.ingredient || preset.nameEN || "");
      setSelB(null);
      setDrugB("");
      setAlerts([]);
      setChecked(false);
      setKnownIx(getKnownInteractionsFor(preset));
    }
  }, [preset]);

  function typeA(q) {
    setDrugA(q);
    setSelA(null);
    const r = q.length >= 1 ? searchDrugs(q) : [];
    setResultsA(r);
    setShowA(q.length >= 1 && r.length > 0);
  }
  function typeB(q) {
    setDrugB(q);
    setSelB(null);
    const r = q.length >= 1 ? searchDrugs(q) : [];
    setResultsB(r);
    setShowB(q.length >= 1 && r.length > 0);
  }
  function pickA(d) {
    setSelA(d);
    setDrugA(d.ingredient || d.nameEN);
    setShowA(false);
  }
  function pickB(d) {
    setSelB(d);
    setDrugB(d.ingredient || d.nameEN);
    setShowB(false);
  }

  function check() {
    if (!selA || !selB) return;
    setAlerts(checkInteractions([selA, selB]));
    setChecked(true);
  }
  function clearCheck() {
    setSelB(null);
    setDrugB("");
    setAlerts([]);
    setChecked(false);
  }
  function startFresh() {
    setPresetDrug(null);
    setSelA(null);
    setDrugA("");
    setKnownIx([]);
    setSelB(null);
    setDrugB("");
    setAlerts([]);
    setChecked(false);
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    borderRadius: 8,
    fontFamily: "inherit",
    border: `1px solid ${C.border}`,
    outline: "none",
    boxSizing: "border-box",
  };

  const isPresetMode = !!presetDrug;

  // Dropdown helper
  function Dropdown({ results, onPick }) {
    return (
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 300,
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: "0 0 8px 8px",
          boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {results.slice(0, 5).map((d) => (
          <div
            key={d.id}
            onMouseDown={() => onPick(d)}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 13,
              borderBottom: `1px solid ${C.border}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <div style={{ fontWeight: 600 }}>{d.ingredient}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{d.nameEN}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <LockedFeature minRole="staff">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* ── Header ── */}
        <Card style={{ background: "#1A3572", border: "none", color: "#fff" }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 3 }}>
            Drug Interaction Center
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
            Check for clinically significant drug–drug interactions based on
            NHI/Taiwan pharmacovigilance data and international guidelines.
          </div>
          <div style={{ fontSize: 11, marginTop: 6, opacity: 0.65 }}>
            For clinical reference only. Always verify with a pharmacist or
            physician.
          </div>
        </Card>

        {/* ── PRESET MODE: known interactions list ── */}
        {isPresetMode && (
          <Card>
            {/* drug name header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 14,
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 3,
                  }}
                >
                  Drug
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>
                  {presetDrug.ingredient || presetDrug.nameEN}
                </div>
                {presetDrug.nameZH && (
                  <div style={{ fontSize: 13, color: C.muted }}>
                    {presetDrug.nameZH}
                  </div>
                )}
              </div>
              <button
                onClick={startFresh}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: "#f8fafc",
                  color: C.muted,
                  fontSize: 12,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                + New Check
              </button>
            </div>

            {/* known interactions */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                borderBottom: "2px solid #1e293b",
                paddingBottom: 6,
                marginBottom: 12,
              }}
            >
              Known Interactions ({knownIx.length})
            </div>

            {knownIx.length > 0 ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {knownIx.map((ix, i) => (
                  <IxCard key={i} ix={ix} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <div
                    style={{ fontWeight: 700, color: "#166534", fontSize: 13 }}
                  >
                    No known interactions in database
                  </div>
                  <div style={{ fontSize: 12, color: "#15803d", marginTop: 2 }}>
                    {presetDrug.ingredient} does not appear in any recorded
                    interaction pairs. Always verify clinically.
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── Checker: pair search ── */}
        <Card>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 12,
              color: C.text,
            }}
          >
            {isPresetMode
              ? `Check ${presetDrug.ingredient || presetDrug.nameEN} against another drug`
              : "Interaction Checker — Select Two Drugs"}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 12,
            }}
          >
            {/* Drug A */}
            <div ref={refA} style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 5,
                }}
              >
                Drug A
              </div>
              {isPresetMode ? (
                /* fixed in preset mode */
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${C.success}`,
                    background: "#f0fdf4",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#166534",
                  }}
                >
                  ✓ {presetDrug.ingredient || presetDrug.nameEN}
                </div>
              ) : (
                <>
                  <input
                    value={drugA}
                    onChange={(e) => typeA(e.target.value)}
                    onFocus={() =>
                      drugA.length >= 1 && resultsA.length > 0 && setShowA(true)
                    }
                    placeholder="Search drug A…"
                    style={{
                      ...inputStyle,
                      borderColor: selA ? C.success : C.border,
                    }}
                  />
                  {selA && (
                    <div
                      style={{ fontSize: 11, color: C.success, marginTop: 3 }}
                    >
                      ✓ {selA.ingredient}
                    </div>
                  )}
                  {showA && <Dropdown results={resultsA} onPick={pickA} />}
                </>
              )}
            </div>

            {/* Drug B */}
            <div ref={refB} style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 5,
                }}
              >
                Drug B
              </div>
              <input
                value={drugB}
                onChange={(e) => typeB(e.target.value)}
                onFocus={() =>
                  drugB.length >= 1 && resultsB.length > 0 && setShowB(true)
                }
                placeholder="Search drug B…"
                style={{
                  ...inputStyle,
                  borderColor: selB ? C.success : C.border,
                }}
              />
              {selB && (
                <div style={{ fontSize: 11, color: C.success, marginTop: 3 }}>
                  ✓ {selB.ingredient}
                </div>
              )}
              {showB && <Dropdown results={resultsB} onPick={pickB} />}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={check}
              disabled={!selA || !selB}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                cursor: selA && selB ? "pointer" : "default",
                background: selA && selB ? C.primary : "#e2e8f0",
                color: selA && selB ? "#fff" : C.muted,
              }}
            >
              Check Interaction
            </button>
            {(selB || checked) && (
              <button
                onClick={clearCheck}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  border: `1px solid ${C.border}`,
                  cursor: "pointer",
                  background: "#f8fafc",
                  color: C.text,
                }}
              >
                Clear
              </button>
            )}
          </div>

          {checked && (
            <div style={{ marginTop: 14 }}>
              {alerts.length === 0 ? (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    borderRadius: 8,
                    padding: "12px 14px",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#166534",
                        fontSize: 13,
                      }}
                    >
                      No interaction found
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#15803d", marginTop: 2 }}
                    >
                      {selA?.ingredient} + {selB?.ingredient} — no pair
                      recorded. Always verify clinically.
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {alerts.map((a, i) => (
                    <IxCard
                      key={i}
                      ix={{ ...a, otherName: null }}
                      showPair={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ── Reference table (all known pairs) ── */}
        {!isPresetMode && (
          <Card>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: C.text,
                marginBottom: 3,
              }}
            >
              All Known Interactions ({INTERACTION_DB.length} pairs)
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
              NHI pharmacovigilance data + international clinical guidelines
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {INTERACTION_DB.map((ix, i) => (
                <IxCard key={i} ix={ix} showPair={true} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </LockedFeature>
  );
}

// ── Admin Dashboard ────────────────────────────────────────────────────────
function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [step, setStep] = useState(0);
  const [queue, setQueue] = useState([
    {
      id: 1,
      text: "ZITHROMAX 500mg",
      status: "pending",
      created: "2026-05-07 09:14",
    },
    {
      id: 2,
      text: "普拿疼 EXTRA",
      status: "pending",
      created: "2026-05-07 10:32",
    },
    {
      id: 3,
      text: "VOLTAREN GEL",
      status: "pending",
      created: "2026-05-08 08:05",
    },
  ]);
  function run() {
    setRefreshing(true);
    setStep(1);
    [2, 3, 4].forEach((s, i) => setTimeout(() => setStep(s), (i + 1) * 600));
    setTimeout(
      () => {
        setRefreshing(false);
        setStep(0);
      },
      3 * 600 + 600,
    );
  }
  const steps = [
    "Import from NHI data source",
    "Deduplication",
    "Diff vs previous version",
    "Release — atomic dictionary swap",
  ];

  const stats = computeStats();
  const metrics = stats
    ? [
        {
          label: "Active Drugs",
          value: stats.total.toLocaleString(),
          sub: "currently reimbursed by NHI",
        },
        {
          label: "Combination Rx",
          value: stats.combo.toLocaleString(),
          sub: `${((stats.combo / stats.total) * 100).toFixed(1)}% of total`,
        },
        {
          label: "Missing ATC",
          value: stats.noAtc.toLocaleString(),
          sub: "require ATC code mapping",
        },
        {
          label: "Drug Classes",
          value: Object.keys(stats.byClass).length,
          sub: "classifications in database",
        },
      ]
    : [
        { label: "Total Drugs", value: "—", sub: "loading NHI data..." },
        { label: "Active Drugs", value: "—", sub: "" },
        { label: "Missing ATC Code", value: "—", sub: "" },
        { label: "Drug Classes", value: "—", sub: "" },
      ];

  return (
    <LockedFeature minRole="admin">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 12,
          }}
        >
          {metrics.map((m) => (
            <Card
              key={m.label}
              style={{ background: "#fef3f2", border: `1px solid #fca5a5` }}
            >
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ fontWeight: 700, fontSize: 24 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{m.sub}</div>
            </Card>
          ))}
        </div>

        {stats && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Card>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
                By Drug Class
              </div>
              {Object.entries(stats.byClass)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginBottom: 6,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: C.text }}>{k}</span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          background: C.primary + "40",
                          width: 60,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 3,
                            background: C.primary,
                            width: `${Math.round((v / stats.total) * 100)}%`,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          color: C.muted,
                          fontSize: 11,
                          minWidth: 36,
                          textAlign: "right",
                        }}
                      >
                        {v.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
            </Card>
            <Card>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
                Top ATC Categories
              </div>
              {stats.topAtc.map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 6,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: C.text,
                      flex: 1,
                      marginRight: 8,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {k}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: "#34a85340",
                        width: 40,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 3,
                          background: C.success,
                          width: `${Math.round((v / stats.topAtc[0][1]) * 100)}%`,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        color: C.muted,
                        fontSize: 11,
                        minWidth: 36,
                        textAlign: "right",
                      }}
                    >
                      {v.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
        <Card style={{ border: `1px solid ${C.primary}44` }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Dataset Refresh Pipeline
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>
                Last run: 2026-05-01 · Next: 2026-06-01
              </div>
            </div>
            <button
              onClick={run}
              disabled={refreshing}
              style={{
                padding: "8px 16px",
                background: refreshing ? "#f1f5f9" : C.primary,
                color: refreshing ? C.muted : "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: refreshing ? "default" : "pointer",
              }}
            >
              {refreshing ? "⚙️ Running..." : "▶ Run Now"}
            </button>
          </div>
          {refreshing && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {steps.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <span>{step > i ? "✅" : step === i + 1 ? "⏳" : "⬜"}</span>
                  <span
                    style={{
                      color:
                        step > i
                          ? C.success
                          : step === i + 1
                            ? C.text
                            : C.muted,
                    }}
                  >
                    Step {i + 1}/4: {s}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
            Unknown Drug Review Queue (
            {queue.filter((q) => q.status === "pending").length} pending)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {queue.map((q) => (
              <div
                key={q.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background:
                    q.status === "pending"
                      ? "#fffbeb"
                      : q.status === "confirmed"
                        ? "#f0fdf4"
                        : "#fef2f2",
                  border: `1px solid ${q.status === "pending" ? "#fbbf24" : q.status === "confirmed" ? "#86efac" : "#fca5a5"}`,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: "monospace",
                    }}
                  >
                    {q.text}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {q.created}
                  </div>
                </div>
                {q.status === "pending" ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() =>
                        setQueue((p) =>
                          p.map((r) =>
                            r.id === q.id ? { ...r, status: "confirmed" } : r,
                          ),
                        )
                      }
                      style={{
                        padding: "6px 12px",
                        background: C.success,
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✓ Confirm
                    </button>
                    <button
                      onClick={() =>
                        setQueue((p) =>
                          p.map((r) =>
                            r.id === q.id ? { ...r, status: "rejected" } : r,
                          ),
                        )
                      }
                      style={{
                        padding: "6px 12px",
                        background: C.danger,
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: q.status === "confirmed" ? C.success : C.danger,
                    }}
                  >
                    {q.status === "confirmed" ? "✓ Confirmed" : "✗ Rejected"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </LockedFeature>
  );
}

function UserProfilePage({ darkMode }) {
  const { user, isAdmin, isStaff } = useAuth();
  const theme = darkMode ? D : C;

  if (!user) {
    return (
      <Card style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>👤</div>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
          Guest User
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Please sign in to view your profile.
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14, color: theme.text }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900 }}>User Profile</div>
        <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>
          Account information and access role.
        </div>
      </div>

      <Card
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: "#1B6840",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 900,
          }}
        >
          {user.name?.[0]?.toUpperCase() || "U"}
        </div>

        <div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: theme.muted }}>
            {isAdmin ? "Administrator" : isStaff ? "Hospital Staff" : "Guest"}
          </div>
        </div>
      </Card>

      <Card>
        <ProfileRow label="Username" value={user.username || "-"} />
        <ProfileRow label="Role" value={user.role || "-"} />
        <ProfileRow
          label="Access Level"
          value={
            isAdmin ? "Full Access" : isStaff ? "Staff Access" : "Guest Access"
          }
        />
        <ProfileRow label="Account Status" value="Active" />
      </Card>

      <Card>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>
          Permissions
        </div>

        <ProfilePermission active={true} text="Search drug database" />
        <ProfilePermission active={true} text="Scan prescription with OCR" />
        <ProfilePermission
          active={isStaff || isAdmin}
          text="View NHI price and staff data"
        />
        <ProfilePermission
          active={isStaff || isAdmin}
          text="Check drug interactions"
        />
        <ProfilePermission active={isAdmin} text="Access admin dashboard" />
      </Card>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "11px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{label}</div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "var(--text)",
          textAlign: "right",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ProfilePermission({ active, text }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        fontSize: 13,
        color: "var(--text)",
      }}
    >
      <span>{active ? "✅" : "🔒"}</span>
      <span style={{ opacity: active ? 1 : 0.55 }}>{text}</span>
    </div>
  );
}

function SettingsMenuItem({ darkMode, title, desc, onClick }) {
  return (
    <div style={getSettingsCardStyle(darkMode)}>
      <div>
        <div style={getSettingsTitleStyle(darkMode)}>{title}</div>
        <div style={getSettingsDescStyle(darkMode)}>{desc}</div>
      </div>

      <button onClick={onClick} style={getSettingsButtonStyle()}>
        Open
      </button>
    </div>
  );
}

function SettingsSubLayout({ title, theme, onBack, children }) {
  return (
    <div style={{ color: theme.text }}>
      <button
        onClick={onBack}
        style={{
          border: "none",
          background: "transparent",
          color: theme.primary,
          fontWeight: 800,
          marginBottom: 14,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          marginBottom: 16,
          color: theme.text,
        }}
      >
        {title}
      </div>

      {children}
    </div>
  );
}

function AppInner() {
  const [tab, setTab] = useState("scan");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [nhiCount, setNhiCount] = useState(0);
  const [imgCount, setImgCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("zhTW");
  const [ddiPreset, setDdiPreset] = useState(null);
  const [toast, setToast] = useState("");
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupAtc, setLookupAtc] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [myDrugs, setMyDrugs] = useState([
    { ...DRUGS[6], times: ["09:00"], reminderOn: true },
    { ...DRUGS[9], times: ["08:00", "12:00", "18:00"], reminderOn: true },
    { ...DRUGS[7], times: ["08:00"], reminderOn: true },
  ]);

  const { isAdmin, isStaff, logout } = useAuth();

  const theme = darkMode ? D : C;
  const isSignedIn = isAdmin || isStaff;
  const T = LANG[language];

  useEffect(() => {
    loadNHIDrugs().then((n) => {
      if (n > 0) setNhiCount(n);
    });
    loadDrugImages().then((n) => {
      if (n > 0) setImgCount(n);
    });
  }, []);

  useEffect(() => {
    const openSignup = () => setShowSignup(true);
    window.addEventListener("open-signup", openSignup);
    return () => window.removeEventListener("open-signup", openSignup);
  }, []);

  useEffect(() => {
    function h(e) {
      setLookupQuery(e.detail.query);
      setLookupAtc("");
      setBulkText("");
      // staff/admin → ingredient lookup; guest → search tab
      setTab(isStaff ? "lookup" : "search");
    }
    window.addEventListener("navigate-ingredient", h);
    return () => window.removeEventListener("navigate-ingredient", h);
  }, [isStaff]);

  useEffect(() => {
    function h(e) {
      setLookupAtc(e.detail.atc);
      setLookupQuery("");
      setBulkText("");
      setTab("lookup");
    }
    window.addEventListener("navigate-atc", h);
    return () => window.removeEventListener("navigate-atc", h);
  }, []);

  useEffect(() => {
    function h(e) {
      setBulkText(e.detail.text || "");
      setLookupQuery("");
      setLookupAtc("");
      setTab("lookup"); // Bulk lives inside the staff-only Lookup tab
    }
    window.addEventListener("navigate-bulk", h);
    return () => window.removeEventListener("navigate-bulk", h);
  }, []);

  useEffect(() => {
    function h(e) {
      setDdiPreset(e.detail);
      setTab("interact");
    }
    window.addEventListener("send-to-ddi", h);
    return () => window.removeEventListener("send-to-ddi", h);
  }, []);

  const tabs = [
    { id: "search", icon: "🔍", title: T.search },
    { id: "scan", icon: "📷", title: T.scan },
    { id: "lookup", icon: "🧬", title: T.lookup, minRole: "staff" },
    { id: "interact", icon: "⚠️", title: T.interact, minRole: "staff" },
    { id: "admin", icon: "🛠️", title: T.admin, minRole: "admin" },
    { id: "settings", icon: "⚙️", title: T.settings },
  ].filter((t) => {
    if (t.minRole === "admin") return isAdmin;
    if (t.minRole === "staff") return isStaff;
    return true;
  });

  const pageTitle = {
    scan: T.scan,
    search: T.search,
    lookup: T.lookup,
    meds: T.meds,
    settings: T.settings,
    interact: T.interact,
    admin: T.admin,
  }[tab];

  function addToMyDrugs(drug) {
    let alreadyExists = false;

    setMyDrugs((prev) => {
      if (prev.some((m) => m.id === drug.id)) {
        alreadyExists = true;
        return prev;
      }

      return [
        ...prev,
        {
          ...drug,
          times: ["09:00"],
          reminderOn: true,
        },
      ];
    });

    setToast(
      alreadyExists
        ? "Drug already exists in My Drugs"
        : "Drug added to My Drugs",
    );

    setTimeout(() => {
      setToast("");
    }, 2000);
  }

  return (
    <LangCtx.Provider value={{ T, language, setLanguage }}>
      <div
        style={{
          "--card": theme.card,
          "--text": theme.text,
          "--muted": theme.muted,
          "--border": theme.border,

          minHeight: "100vh",
          background: darkMode ? "#050F0A" : "#EBF5EE",
          paddingBottom: 96,
          color: theme.text,
          transition: "all .2s ease",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: darkMode
              ? "rgba(6,17,26,.93)"
              : "rgba(255,255,255,.95)",
            backdropFilter: "blur(20px)",
            borderBottom: `2px solid ${darkMode ? "#1A3518" : C.primary}`,
            boxShadow: darkMode
              ? "0 4px 24px rgba(0,0,0,.35)"
              : "0 2px 16px rgba(27,104,64,.10)",
          }}
        >
          <div
            style={{
              maxWidth: 520,
              margin: "0 auto",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                <img
                  src="/NHI_logo.png"
                  alt="NHI"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    boxShadow: "0 2px 8px rgba(26,122,114,.25)",
                    objectFit: "cover",
                  }}
                />
                <img
                  src="/nthu_logo.jpg"
                  alt="NTHU"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    boxShadow: "0 2px 8px rgba(110,50,160,.18)",
                    objectFit: "cover",
                  }}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: 0.3,
                    color: theme.text,
                    whiteSpace: "nowrap",
                  }}
                >
                  {T.appName}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: darkMode ? "#7AAAB8" : "#4A6B78",
                    fontWeight: 500,
                    marginTop: 1,
                    letterSpacing: 0.4,
                    whiteSpace: "nowrap",
                  }}
                >
                  全民健保藥品查詢系統
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: theme.primary,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {pageTitle}
                  </span>
                  {nhiCount > 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 3,
                        background: darkMode ? "#122838" : "#D6EDEB",
                        color: darkMode ? "#2EC4B6" : C.primary,
                        letterSpacing: 0.3,
                        border: `1px solid ${darkMode ? "#1A3A4A" : "#A8D0CE"}`,
                      }}
                    >
                      NHI {DATA_VERSION.date}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LangToggle />
              <button
                onClick={() => {
                  if (isSignedIn) {
                    setShowSignOutConfirm(true);
                  } else {
                    setShowLogin(true);
                  }
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  textAlign: "right",
                }}
              >
                <div style={{ lineHeight: 1.15 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: theme.text,
                    }}
                  >
                    {isSignedIn ? T.signOut : T.signIn}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: theme.muted,
                      opacity: 0.68,
                      marginTop: 3,
                    }}
                  >
                    {isSignedIn
                      ? `${T.signedInAs} ${isAdmin ? "Admin" : "Staff"}`
                      : T.notSignedIn}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </header>

        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}

        {showSignOutConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.45)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 340,
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 22,
                padding: 22,
                boxShadow: "0 24px 60px rgba(0,0,0,.28)",
                color: theme.text,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  marginBottom: 8,
                }}
              >
                {T.signOutTitle}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: theme.muted,
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}
              >
                {T.signOutMessage}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                }}
              >
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  style={{
                    flex: 1,
                    padding: "11px 14px",
                    borderRadius: 14,
                    border: `1px solid ${theme.border}`,
                    background: darkMode ? "#1E293B" : "#F8FAFC",
                    color: theme.text,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {T.cancel}
                </button>

                <button
                  onClick={() => {
                    logout();
                    setShowSignOutConfirm(false);
                    setTab("scan");
                  }}
                  style={{
                    flex: 1,
                    padding: "11px 14px",
                    borderRadius: 14,
                    border: "none",
                    background: "#DC2626",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {T.signOut}
                </button>
              </div>
            </div>
          </div>
        )}

        <main
          style={{
            maxWidth: 520,
            margin: "0 auto",
            padding: "18px 14px 24px",
          }}
        >
          <section
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 24,
              padding: 16,
              boxShadow: darkMode
                ? "0 12px 32px rgba(0,0,0,.22)"
                : "0 12px 32px rgba(15,23,42,.07)",
              minHeight: "calc(100vh - 190px)",
              transition: "all .2s ease",
              color: theme.text,
            }}
          >
            {tab === "search" && (
              <DrugSearch addToMyDrugs={addToMyDrugs} initQuery={lookupQuery} />
            )}
            {tab === "scan" && <ScanRx addToMyDrugs={addToMyDrugs} />}
            {tab === "lookup" && (
              <LookupPage
                addToMyDrugs={addToMyDrugs}
                nhiCount={nhiCount}
                imgCount={imgCount}
                initQuery={lookupQuery}
                initAtc={lookupAtc}
                initBulk={bulkText}
              />
            )}
            {tab === "interact" && <DrugInteractionCenter preset={ddiPreset} />}
            {tab === "admin" && <AdminDashboard />}
            {tab === "settings" && (
              <SettingsPage
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                language={language}
                setLanguage={setLanguage}
                T={T}
                myDrugs={myDrugs}
                setMyDrugs={setMyDrugs}
                addToMyDrugs={addToMyDrugs}
              />
            )}
          </section>
        </main>

        {toast && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: 88,
              transform: "translateX(-50%)",
              zIndex: 3000,
              background: darkMode ? "#1E293B" : "#0F172A",
              color: "#fff",
              padding: "11px 18px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 800,
              boxShadow: "0 12px 30px rgba(0,0,0,.25)",
              whiteSpace: "nowrap",
            }}
          >
            {toast}
          </div>
        )}

        <nav
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 250,
            background: darkMode
              ? "rgba(6,17,26,.95)"
              : "rgba(255,255,255,.97)",
            backdropFilter: "blur(20px)",
            borderTop: `2px solid ${darkMode ? "#1A3518" : C.primary}`,
            boxShadow: darkMode
              ? "0 -8px 24px rgba(0,0,0,.40)"
              : "0 -4px 20px rgba(27,104,64,.12)",
            padding: "7px 12px max(7px, env(safe-area-inset-bottom))",
          }}
        >
          <div
            style={{
              maxWidth: 520,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: `repeat(${tabs.length},1fr)`,
              gap: 8,
            }}
          >
            {tabs.map((t) => {
              const active = tab === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-label={t.title}
                  title={t.title}
                  style={{
                    height: 50,
                    border: "none",
                    borderRadius: 18,
                    cursor: "pointer",
                    fontSize: 22,
                    background: active
                      ? darkMode
                        ? "#0A1F10"
                        : "#D4EDE0"
                      : "transparent",
                    color: active ? theme.primary : theme.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    borderBottom: active
                      ? `2px solid ${theme.primary}`
                      : "2px solid transparent",
                    borderRadius: 10,
                    boxShadow: active
                      ? darkMode
                        ? "0 4px 14px rgba(45,199,106,.15)"
                        : "0 4px 14px rgba(27,104,64,.14)"
                      : "none",
                    transition: "all .18s ease",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      transform: active
                        ? "translateY(-2px) scale(1.08)"
                        : "none",
                      transition: "transform .18s ease",
                    }}
                  >
                    {t.icon}
                  </span>

                  {active && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 6,
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: theme.primary,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </LangCtx.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

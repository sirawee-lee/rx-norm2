import React, { useState, useRef } from 'react'
import { AuthProvider, useAuth } from './auth.jsx'
import { searchDrugs, DEMO_OCR_RESULT, DRUGS } from './data.js'

// ─── colour tokens ─────────────────────────────────────────────────────────
const C = {
  primary:   '#1a73e8',
  primaryDk: '#1558b0',
  success:   '#34a853',
  warning:   '#fbbc04',
  danger:    '#ea4335',
  bg:        '#f0f4f8',
  card:      '#ffffff',
  border:    '#e2e8f0',
  text:      '#1a202c',
  muted:     '#718096',
  adminBg:   '#fef3f2',
  staffBg:   '#fffbeb',
  guestBg:   '#f0fdf4',
}

// ─── small reusable pieces ─────────────────────────────────────────────────
function Badge({ role }) {
  const map = { admin: ['#dc2626','#fef2f2'], staff: ['#d97706','#fffbeb'], guest: ['#16a34a','#f0fdf4'] }
  const [color, bg] = map[role] || map.guest
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
      background: bg, color, border: `1px solid ${color}33`, letterSpacing: '.3px' }}>
      {role.toUpperCase()}
    </span>
  )
}

function Card({ children, style }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
      padding: 16, ...style }}>
      {children}
    </div>
  )
}

function LockedFeature({ minRole, children }) {
  const { isAdmin, isStaff, isGuest } = useAuth()
  const hasAccess = minRole === 'admin' ? isAdmin : minRole === 'staff' ? isStaff : true
  if (hasAccess) return children
  return (
    <div style={{ background: '#f8fafc', border: `2px dashed ${C.border}`, borderRadius: 12,
      padding: 32, textAlign: 'center', color: C.muted }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {minRole === 'admin' ? 'Admin access required' : 'Hospital Staff or Admin access required'}
      </div>
      <div style={{ fontSize: 13 }}>Please log in with the appropriate account to use this feature.</div>
    </div>
  )
}

// ─── Login Modal ─────────────────────────────────────────────────────────
function LoginModal({ onClose }) {
  const { login, error, setError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const ok = login(username, password)
      setLoading(false)
      if (ok) onClose()
    }, 400)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8,
    border: `1px solid ${C.border}`, outline: 'none', marginTop: 4,
    fontFamily: 'inherit',
  }
  const btnStyle = (primary) => ({
    padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', border: 'none', width: primary ? '100%' : 'auto',
    background: primary ? C.primary : '#f1f5f9', color: primary ? '#fff' : C.text,
    marginTop: primary ? 16 : 0,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) { setError(''); onClose() } }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Sign In</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>RxNorm Taiwan — Staff & Admin Portal</div>
          </div>
          <button onClick={() => { setError(''); onClose() }}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.muted }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Username</label>
            <input style={inputStyle} value={username} autoFocus
              onChange={e => setUsername(e.target.value)} placeholder="admin / staff / doctor" />
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Password</label>
            <input style={inputStyle} type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div style={{ color: C.danger, fontSize: 13, marginTop: 8 }}>{error}</div>}

          <button style={btnStyle(true)} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: C.muted }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: C.text }}>Demo accounts:</div>
          <div>👑 <b>admin</b> / admin123 — full admin access</div>
          <div>🏥 <b>staff</b> / staff123 — hospital staff</div>
          <div>🏥 <b>doctor</b> / doctor123 — hospital staff</div>
          <div style={{ marginTop: 6 }}>💡 Or just close this to continue as guest</div>
        </div>
      </div>
    </div>
  )
}

// ─── NavBar ───────────────────────────────────────────────────────────────
function NavBar({ showLogin }) {
  const { user, logout, isAdmin } = useAuth()
  return (
    <div style={{ background: C.primary, padding: '0 20px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', height: 56,
      position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>💊</span>
        <div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>RxNorm Taiwan</span>
          <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginLeft: 8 }}>Drug Identification System</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{user.name}</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
                <Badge role={user.role} />
              </div>
            </div>
            <button onClick={logout} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.4)',
              background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Guest mode</span>
            <button onClick={showLogin} style={{ padding: '6px 16px', borderRadius: 8,
              background: '#fff', color: C.primary, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Sign In
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Drug Search ─────────────────────────────────────────────────────
function DrugSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const { isStaff } = useAuth()

  function handleSearch(q) {
    setQuery(q)
    setSelected(null)
    if (q.length >= 1) setResults(searchDrugs(q))
    else setResults([])
  }

  const confColor = (s) => s >= 0.85 ? C.success : s >= 0.6 ? C.warning : C.danger
  const confPct   = (s) => Math.round(s * 100)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input value={query} onChange={e => handleSearch(e.target.value)}
          placeholder="Search by drug name (EN/中文), ingredient, NHI code, or ATC code..."
          style={{ width: '100%', padding: '12px 16px', fontSize: 15, borderRadius: 10,
            border: `1px solid ${C.border}`, outline: 'none', fontFamily: 'inherit',
            boxShadow: '0 1px 4px rgba(0,0,0,.08)' }} />
        {query.length > 0 && query.length < 2 && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6, paddingLeft: 4 }}>Keep typing to search...</div>
        )}
      </div>

      {selected ? (
        <Card>
          <button onClick={() => setSelected(null)}
            style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer',
              fontSize: 13, fontWeight: 600, marginBottom: 12, padding: 0 }}>
            ← Back to results
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{selected.ingredient}</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>Active Ingredient (成分根節點)</div>
            </div>
            <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px',
              borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {confPct(selected.score)}% match
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              ['NHI Code (健保碼)', selected.id],
              ['ATC Code', selected.atc],
              ['English Name', selected.nameEN],
              ['Chinese Name (中文名)', selected.nameZH],
              ['Dosage Form (劑型)', selected.form],
              ['Strength (劑量)', selected.strength],
              ['NHI Price (NT$)', `NT$ ${selected.price}`],
              ['Manufacturer (製造商)', selected.manufacturer],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Staff-only: ATC mapping detail */}
          <LockedFeature minRole="staff">
            <div style={{ background: C.staffBg, border: `1px solid #fbbf24`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>🏥 Routing & Trace (Staff Only)</div>
              <div style={{ fontSize: 13, color: C.text }}>
                <b>Mapping path:</b> {selected.nameEN} → {selected.ingredient} → ATC {selected.atc}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                Brand → Ingredient root → WHO ATC Classification → RxNorm CUI (via API)
              </div>
            </div>
          </LockedFeature>
        </Card>
      ) : (
        <>
          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map(d => (
                <Card key={d.id} style={{ cursor: 'pointer', transition: 'border-color .15s' }}
                  onClick={() => setSelected(d)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{d.ingredient}</div>
                      <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{d.nameEN} · {d.nameZH}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                        {d.id} · ATC: {d.atc} · {d.form} · NT$ {d.price}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                        background: confColor(d.score) + '22', color: confColor(d.score), border: `2px solid ${confColor(d.score)}` }}>
                        {confPct(d.score)}%
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <Card style={{ textAlign: 'center', color: C.muted, padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <div>No drugs found for "<b>{query}</b>"</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>This would be flagged for admin review in production.</div>
            </Card>
          ) : (
            <Card style={{ color: C.muted, padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💊</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Search the NHI Drug Dictionary</div>
              <div style={{ fontSize: 13 }}>Try: "magnesium", "氧化鎂", "metformin", "A024806100", "A02AA02"</div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ─── Tab: Scan Rx ─────────────────────────────────────────────────────────
function ScanRx() {
  const [stage, setStage] = useState('idle') // idle | scanning | results
  const [myMeds, setMyMeds] = useState([])
  const [added, setAdded] = useState(new Set())
  const fileRef = useRef()

  function runDemo() {
    setStage('scanning')
    setTimeout(() => setStage('results'), 1800)
  }

  function addToMyMeds(drug) {
    setMyMeds(prev => [...prev, drug])
    setAdded(prev => new Set([...prev, drug.id]))
  }

  const confColor = (s) => s >= 0.85 ? C.success : s >= 0.6 ? C.warning : C.danger

  return (
    <div>
      {stage === 'idle' && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Scan Prescription</div>
          <div style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>
            Take a photo of your medication package or prescription.<br/>
            Our OCR system will identify all drugs automatically.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => fileRef.current.click()}
              style={{ padding: '12px 24px', background: C.primary, color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              📁 Upload Image
            </button>
            <button onClick={runDemo}
              style={{ padding: '12px 24px', background: '#f1f5f9', color: C.text,
                border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              🧪 Try Demo Prescription
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={() => runDemo()} />
        </Card>
      )}

      {stage === 'scanning' && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⚙️</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Processing...</div>
          <div style={{ color: C.muted, fontSize: 14 }}>
            OCR extraction → Text normalization → NHI dictionary matching
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </Card>
      )}

      {stage === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card style={{ background: '#f0fdf4', border: `1px solid ${C.success}` }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#166534' }}>
              ✅ OCR Extraction Complete
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: C.muted, whiteSpace: 'pre-wrap' }}>
              {DEMO_OCR_RESULT.rawText}
            </div>
          </Card>

          <div style={{ fontWeight: 700, fontSize: 16, padding: '4px 0' }}>
            Identified Drugs ({DEMO_OCR_RESULT.matched.length})
          </div>

          {DEMO_OCR_RESULT.matched.map(({ drug, confidence }) => (
            <Card key={drug.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{drug.ingredient}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12,
                      background: confColor(confidence) + '22', color: confColor(confidence), fontWeight: 600 }}>
                      {Math.round(confidence * 100)}% confidence
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted }}>{drug.nameEN} · {drug.nameZH}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                    {drug.id} · ATC: {drug.atc} · {drug.form} {drug.strength} · NT$ {drug.price}
                  </div>
                </div>
                <button onClick={() => addToMyMeds(drug)} disabled={added.has(drug.id)}
                  style={{ marginLeft: 12, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: added.has(drug.id) ? 'default' : 'pointer',
                    background: added.has(drug.id) ? '#e8f5e9' : C.primary,
                    color: added.has(drug.id) ? C.success : '#fff', flexShrink: 0 }}>
                  {added.has(drug.id) ? '✓ Added' : '+ Add'}
                </button>
              </div>
            </Card>
          ))}

          {added.size > 0 && (
            <Card style={{ background: '#f0fdf4', border: `1px solid ${C.success}`, textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: '#166534' }}>
                {added.size} drug{added.size > 1 ? 's' : ''} added to My Medications ✓
              </div>
            </Card>
          )}

          <button onClick={() => { setStage('idle'); setAdded(new Set()) }}
            style={{ padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`,
              background: '#f8fafc', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: C.text }}>
            Scan Another Prescription
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Tab: My Medications ─────────────────────────────────────────────────
function MyMeds() {
  const [meds, setMeds] = useState([
    { ...DRUGS[0], times: ['08:00', '20:00'], reminderOn: true },
    { ...DRUGS[7], times: ['08:00'], reminderOn: true },
  ])
  const { isStaff } = useAuth()

  function toggleReminder(id) {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, reminderOn: !m.reminderOn } : m))
  }
  function removeMed(id) {
    setMeds(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {meds.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48, color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No medications yet</div>
          <div style={{ fontSize: 13 }}>Use Drug Search or Scan Rx to add medications here.</div>
        </Card>
      ) : meds.map(med => (
        <Card key={med.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{med.ingredient}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{med.nameEN}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{med.form} · {med.strength}</div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>⏰ Reminder times:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {med.times.map(t => (
                    <span key={t} style={{ background: med.reminderOn ? C.primary + '18' : '#f1f5f9',
                      color: med.reminderOn ? C.primary : C.muted, padding: '4px 10px',
                      borderRadius: 20, fontSize: 13, fontWeight: 500 }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', marginLeft: 12 }}>
              <button onClick={() => toggleReminder(med.id)}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${med.reminderOn ? C.success : C.border}`, cursor: 'pointer',
                  background: med.reminderOn ? '#f0fdf4' : '#f8fafc',
                  color: med.reminderOn ? C.success : C.muted }}>
                {med.reminderOn ? '🔔 On' : '🔕 Off'}
              </button>
              <button onClick={() => removeMed(med.id)}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${C.border}`, cursor: 'pointer',
                  background: '#fff', color: C.danger }}>
                Remove
              </button>
            </div>
          </div>
        </Card>
      ))}

      {/* Staff-only: Export */}
      <LockedFeature minRole="staff">
        <Card style={{ background: C.staffBg, border: `1px solid #fbbf24` }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>📤 Export Medication History (Staff)</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
            Download the full medication list as CSV for clinical documentation.
          </div>
          <button onClick={() => {
            const csv = 'NHI Code,Drug Name,Ingredient,ATC,Form,Strength\n' +
              meds.map(m => `${m.id},"${m.nameEN}","${m.ingredient}",${m.atc},${m.form},${m.strength}`).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url
            a.download = 'medications_export.csv'; a.click()
          }} style={{ padding: '8px 16px', background: C.primary, color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Download CSV
          </button>
        </Card>
      </LockedFeature>
    </div>
  )
}

// ─── Tab: Admin Dashboard ─────────────────────────────────────────────────
function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const [queue, setQueue] = useState([
    { id: 1, text: 'ZITHROMAX 500mg', status: 'pending', created: '2026-05-07 09:14' },
    { id: 2, text: '普拿疼 EXTRA', status: 'pending', created: '2026-05-07 10:32' },
    { id: 3, text: 'VOLTAREN GEL', status: 'pending', created: '2026-05-08 08:05' },
  ])

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 2000)
  }
  function handleQueue(id, action) {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: action } : q))
  }

  const metrics = [
    { label: 'Total Drugs', value: '41,283', sub: 'in NHI database' },
    { label: 'Active Drugs', value: '38,912', sub: '94.3% of total' },
    { label: 'Expired Permits', value: '2,371', sub: 'flagged for removal' },
    { label: 'Missing ATC Code', value: '1,204', sub: 'require mapping' },
  ]

  return (
    <LockedFeature minRole="admin">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {metrics.map(m => (
            <Card key={m.label} style={{ background: C.adminBg, border: `1px solid #fca5a5` }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontWeight: 700, fontSize: 24 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{m.sub}</div>
            </Card>
          ))}
        </div>

        {/* Dataset refresh */}
        <Card style={{ border: `1px solid ${C.primary}44` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Dataset Refresh Pipeline</div>
              <div style={{ fontSize: 12, color: C.muted }}>Last run: 2026-05-01 · Next scheduled: 2026-06-01</div>
            </div>
            <button onClick={handleRefresh} disabled={refreshing}
              style={{ padding: '8px 16px', background: refreshing ? '#f1f5f9' : C.primary,
                color: refreshing ? C.muted : '#fff', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: refreshing ? 'default' : 'pointer' }}>
              {refreshing ? '⚙️ Running...' : '▶ Run Now'}
            </button>
          </div>
          {refreshing && (
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, fontSize: 13 }}>
              <div>✅ Step 1/4: Import from NHI data source...</div>
              <div style={{ color: C.muted }}>⏳ Step 2/4: Deduplication</div>
              <div style={{ color: C.muted }}>⏳ Step 3/4: Diff computation</div>
              <div style={{ color: C.muted }}>⏳ Step 4/4: Release</div>
            </div>
          )}
        </Card>

        {/* Review queue */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
            Unknown Drug Review Queue ({queue.filter(q => q.status === 'pending').length} pending)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {queue.map(q => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 8,
                background: q.status === 'pending' ? '#fffbeb' : q.status === 'confirmed' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${q.status === 'pending' ? '#fbbf24' : q.status === 'confirmed' ? '#86efac' : '#fca5a5'}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'monospace' }}>{q.text}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{q.created}</div>
                </div>
                {q.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleQueue(q.id, 'confirmed')}
                      style={{ padding: '6px 12px', background: C.success, color: '#fff',
                        border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      ✓ Confirm
                    </button>
                    <button onClick={() => handleQueue(q.id, 'rejected')}
                      style={{ padding: '6px 12px', background: C.danger, color: '#fff',
                        border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      ✗ Reject
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 600,
                    color: q.status === 'confirmed' ? C.success : C.danger }}>
                    {q.status === 'confirmed' ? '✓ Confirmed' : '✗ Rejected'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </LockedFeature>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────
function AppInner() {
  const [tab, setTab] = useState('search')
  const [showLogin, setShowLogin] = useState(false)
  const { user, isAdmin } = useAuth()

  const tabs = [
    { id: 'search', label: '🔍 Drug Search' },
    { id: 'scan',   label: '📷 Scan Rx' },
    { id: 'meds',   label: '💊 My Meds' },
    { id: 'admin',  label: '⚙️ Admin', adminOnly: true },
  ].filter(t => !t.adminOnly || isAdmin)

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <NavBar showLogin={() => setShowLogin(true)} />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* Tab bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: '0 16px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? C.primary : C.muted, whiteSpace: 'nowrap',
              borderBottom: tab === t.id ? `3px solid ${C.primary}` : '3px solid transparent',
              fontFamily: 'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
        {tab === 'search' && <DrugSearch />}
        {tab === 'scan'   && <ScanRx />}
        {tab === 'meds'   && <MyMeds />}
        {tab === 'admin'  && <AdminDashboard />}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px 16px', color: C.muted, fontSize: 12 }}>
        RxNorm Taiwan · Group 6 · NTHU EECS Rural Smart Healthcare · 2026<br/>
        Data source: NHI Pharmaceutical Benefit and Reimbursement Schedule
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

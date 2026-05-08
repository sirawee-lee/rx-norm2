import React, { useState, useRef, useEffect, useMemo } from 'react'
import { AuthProvider, useAuth } from './auth.jsx'
import { searchDrugs, loadNHIDrugs, DEMO_OCR_RESULT, DRUGS, INTERACTION_DB, checkInteractions,
         ATC_CATEGORIES, drugClassLabel, computeStats, findAlternatives, matchOcrText } from './data.js'

const C = {
  primary:'#1a73e8', primaryDk:'#1558b0', success:'#34a853',
  warning:'#f59e0b', danger:'#ea4335', bg:'#f0f4f8',
  card:'#ffffff', border:'#e2e8f0', text:'#1a202c', muted:'#718096',
  adminBg:'#fef3f2', staffBg:'#fffbeb',
}
const LOW_CONF = 0.75

// module-level history (max 50) shared across tabs
const HISTORY = []
function addHist(e){ HISTORY.unshift({...e,ts:new Date().toISOString()}); if(HISTORY.length>50) HISTORY.length=50 }

function Badge({role}){
  const m={admin:['#dc2626','#fef2f2'],staff:['#d97706','#fffbeb'],guest:['#16a34a','#f0fdf4']}
  const [col,bg]=m[role]||m.guest
  return <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:12,background:bg,color:col,border:`1px solid ${col}33`}}>{role.toUpperCase()}</span>
}
function Card({children,style}){
  return <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,padding:16,...style}}>{children}</div>
}
function LockedFeature({minRole,children}){
  const {isAdmin,isStaff}=useAuth()
  const ok=minRole==='admin'?isAdmin:minRole==='staff'?isStaff:true
  if(ok) return children
  return(
    <div style={{background:'#f8fafc',border:`2px dashed ${C.border}`,borderRadius:12,padding:32,textAlign:'center',color:C.muted}}>
      <div style={{fontSize:32,marginBottom:8}}>🔒</div>
      <div style={{fontWeight:600,marginBottom:4}}>{minRole==='admin'?'Admin access required':'Hospital Staff or Admin access required'}</div>
      <div style={{fontSize:13}}>Please sign in with the appropriate account to use this feature.</div>
    </div>
  )
}

function LowConfWarning({score,name}){
  if(score>=LOW_CONF) return null
  return(
    <div style={{background:'#fff7ed',border:`1px solid #fb923c`,borderRadius:10,padding:'10px 14px',
      display:'flex',alignItems:'flex-start',gap:10,marginBottom:12}}>
      <span style={{fontSize:20,flexShrink:0}}>⚠️</span>
      <div>
        <div style={{fontWeight:700,fontSize:13,color:'#9a3412'}}>Low Confidence Match</div>
        <div style={{fontSize:12,color:'#c2410c',marginTop:2}}>
          Confidence {Math.round(score*100)}% is below the {Math.round(LOW_CONF*100)}% threshold for "{name}". Please verify manually or report an error.
        </div>
      </div>
    </div>
  )
}

function ReportModal({drug,onClose}){
  const [reason,setReason]=useState('')
  const [sent,setSent]=useState(false)
  function send(){ setSent(true); setTimeout(onClose,1800) }
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'#fff',borderRadius:16,padding:24,width:360,boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        {sent?(
          <div style={{textAlign:'center',padding:'16px 0'}}>
            <div style={{fontSize:40,marginBottom:8}}>✅</div>
            <div style={{fontWeight:700}}>Report submitted</div>
            <div style={{fontSize:13,color:C.muted,marginTop:4}}>Added to admin review queue.</div>
          </div>
        ):(
          <>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:16}}>Report Incorrect Match</div>
              <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:C.muted}}>×</button>
            </div>
            <div style={{fontSize:13,color:C.muted,marginBottom:12}}>Reporting: <b>{drug.nameEN}</b> ({drug.ingredient})</div>
            <textarea value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="Describe the issue (optional)..."
              style={{width:'100%',height:80,padding:'8px 10px',fontSize:13,borderRadius:8,
                border:`1px solid ${C.border}`,fontFamily:'inherit',resize:'none',outline:'none'}}/>
            <button onClick={send}
              style={{marginTop:12,width:'100%',padding:'10px',borderRadius:8,background:C.danger,
                color:'#fff',border:'none',fontSize:14,fontWeight:600,cursor:'pointer'}}>
              Submit Report → Admin Queue
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function LoginModal({onClose}){
  const {login,error,setError}=useAuth()
  const [u,setU]=useState(''); const [p,setP]=useState(''); const [loading,setLoading]=useState(false)
  function submit(e){
    e.preventDefault(); setLoading(true)
    setTimeout(()=>{ const ok=login(u,p); setLoading(false); if(ok) onClose() },400)
  }
  const inp={width:'100%',padding:'10px 12px',fontSize:14,borderRadius:8,border:`1px solid ${C.border}`,outline:'none',marginTop:4,fontFamily:'inherit'}
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
      onClick={e=>{if(e.target===e.currentTarget){setError('');onClose()}}}>
      <div style={{background:'#fff',borderRadius:16,padding:28,width:360,boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div>
            <div style={{fontWeight:700,fontSize:18}}>Sign In</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>RxNorm Taiwan — Staff & Admin Portal</div>
          </div>
          <button onClick={()=>{setError('');onClose()}} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:C.muted}}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{marginBottom:12}}><label style={{fontSize:13,fontWeight:500}}>Username</label>
            <input style={inp} value={u} autoFocus onChange={e=>setU(e.target.value)} placeholder="admin / staff / doctor"/></div>
          <div style={{marginBottom:4}}><label style={{fontSize:13,fontWeight:500}}>Password</label>
            <input style={inp} type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="••••••••"/></div>
          {error&&<div style={{color:C.danger,fontSize:13,marginTop:8}}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{marginTop:16,width:'100%',padding:'10px',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',border:'none',background:C.primary,color:'#fff'}}>
            {loading?'Signing in...':'Sign In'}
          </button>
        </form>
        <div style={{marginTop:20,padding:12,background:'#f8fafc',borderRadius:8,fontSize:12,color:C.muted}}>
          <div style={{fontWeight:600,marginBottom:6,color:C.text}}>Demo accounts:</div>
          <div>👑 <b>admin</b> / admin123 — full admin access</div>
          <div>🏥 <b>staff</b> / staff123 — hospital staff</div>
          <div>🏥 <b>doctor</b> / doctor123 — hospital staff</div>
          <div style={{marginTop:6}}>💡 Close this to continue as guest</div>
        </div>
      </div>
    </div>
  )
}

function NavBar({showLogin,nhiCount}){
  const {user,logout}=useAuth()
  return(
    <div style={{background:C.primary,padding:'0 20px',display:'flex',alignItems:'center',
      justifyContent:'space-between',height:56,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,.15)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:22}}>💊</span>
        <div>
          <span style={{color:'#fff',fontWeight:700,fontSize:16}}>RxNorm Taiwan</span>
          <span style={{color:'rgba(255,255,255,.7)',fontSize:11,marginLeft:8}}>
            {nhiCount>0?`${nhiCount.toLocaleString()} NHI drugs loaded`:'Drug Identification System'}
          </span>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        {user?(
          <>
            <div style={{textAlign:'right'}}>
              <div style={{color:'#fff',fontSize:13,fontWeight:500}}>{user.name}</div>
              <div style={{display:'flex',gap:6,justifyContent:'flex-end',marginTop:2}}><Badge role={user.role}/></div>
            </div>
            <button onClick={logout} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,.4)',
              background:'rgba(255,255,255,.15)',color:'#fff',fontSize:13,cursor:'pointer',fontWeight:500}}>Sign Out</button>
          </>
        ):(
          <>
            <span style={{color:'rgba(255,255,255,.7)',fontSize:12}}>Guest mode</span>
            <button onClick={showLogin} style={{padding:'6px 16px',borderRadius:8,background:'#fff',
              color:C.primary,fontSize:13,fontWeight:700,border:'none',cursor:'pointer'}}>Sign In</button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Drug class badge ──────────────────────────────────────────────────────
function DrugClassBadge({raw}){
  const label=drugClassLabel(raw)
  if(!label) return null
  const cfg={
    'Generic':      ['#0369a1','#e0f2fe'],
    'BA/BE Generic':['#0e7490','#ecfeff'],
    'Originator':   ['#6d28d9','#ede9fe'],
    'Biologic':     ['#15803d','#dcfce7'],
    'Biosimilar':   ['#166534','#bbf7d0'],
  }[label]||['#6b7280','#f3f4f6']
  return(
    <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:8,
      color:cfg[0],background:cfg[1],border:`1px solid ${cfg[0]}33`,marginLeft:6}}>
      {label}
    </span>
  )
}

// ── External reference links (Staff/Admin) ────────────────────────────────
const FDA_BASE  = 'https://lmspiq.fda.gov.tw/web/DRPIQ/DRPIQ1000Result?licId='
const NHI_PDF   = 'https://info.nhi.gov.tw/api/INAE3000/INAE3000S01/getPDF?DurgFileName='
const MOHW_TOOL = 'https://medstandard.mohw.gov.tw/rx-norm/tool'
const NHI_DB    = 'https://info.nhi.gov.tw/INAE3000/INAE3000S01'

function ExternalLinks({drug}){
  const {isStaff}=useAuth()
  const links=[
    drug.licId  && {href:FDA_BASE+drug.licId,  label:'🔗 FDA License',      tip:'Taiwan FDA drug license details'},
    isStaff && drug.nhiPdf && {href:NHI_PDF+drug.nhiPdf,label:'📋 NHI Reimbursement', tip:'NHI reimbursement guideline PDF'},
    isStaff && {href:MOHW_TOOL, label:'🔍 MOHW RxNorm',     tip:'MOHW RxNorm terminology tool'},
    {href:NHI_DB,              label:'📊 NHI Drug DB',       tip:'NHI drug database'},
  ].filter(Boolean)
  if(!links.length) return null
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>
        External References
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {links.map(l=>(
          <a key={l.href} href={l.href} target="_blank" rel="noreferrer" title={l.tip}
            style={{fontSize:12,fontWeight:500,padding:'5px 10px',borderRadius:7,
              background:'#f0f7ff',color:C.primary,border:`1px solid ${C.primary}33`,
              textDecoration:'none',whiteSpace:'nowrap'}}
            onMouseEnter={e=>e.currentTarget.style.background='#dbeafe'}
            onMouseLeave={e=>e.currentTarget.style.background='#f0f7ff'}>
            {l.label}
          </a>
        ))}
      </div>
    </div>
  )
}

// ── Therapeutic Alternatives Panel ───────────────────────────────────────
function AlternativesPanel({ drug }) {
  const { isStaff } = useAuth()
  const alts = useMemo(() => findAlternatives(drug), [drug.id, drug.atc])
  if (!drug.atc || alts.length === 0) return null
  const atcLabel = drug.atc.slice(0, 5)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8,
        textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Therapeutic Alternatives · ATC {atcLabel} ({alts.length} found)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alts.map(alt => (
          <div key={alt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{alt.ingredient}</span>
                <DrugClassBadge raw={alt.drugClass} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {alt.nameEN} · {alt.form} {alt.strength}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
              {isStaff
                ? <div style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>NT$ {alt.price}</div>
                : <div style={{ fontSize: 11, color: C.muted }}>🔒</div>}
              <div style={{ fontSize: 10, color: C.muted }}>{alt.atc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Drug Search ────────────────────────────────────────────────────────────
function DrugSearch(){
  const [query,setQuery]=useState('')
  const [results,setResults]=useState([])
  const [showDD,setShowDD]=useState(false)
  const [selected,setSelected]=useState(null)
  const [reportDrug,setReportDrug]=useState(null)
  const {isStaff}=useAuth()
  const wrapRef=useRef()

  useEffect(()=>{
    function h(e){if(wrapRef.current&&!wrapRef.current.contains(e.target))setShowDD(false)}
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h)
  },[])

  function onType(q){
    setQuery(q); setSelected(null)
    const res=q.length>=1?searchDrugs(q):[]
    setResults(res); setShowDD(q.length>=1&&res.length>0)
  }
  function pick(drug){
    setSelected(drug); setQuery(drug.nameEN); setShowDD(false)
    addHist({type:'search',query:drug.nameEN,result:drug.ingredient,score:drug.score})
  }

  const cc=s=>s>=LOW_CONF?C.success:s>=0.55?C.warning:C.danger
  const pct=s=>Math.round(s*100)

  return(
    <div>
      {reportDrug&&<ReportModal drug={reportDrug} onClose={()=>setReportDrug(null)}/>}
      <div ref={wrapRef} style={{position:'relative',marginBottom:16}}>
        <input value={query} onChange={e=>onType(e.target.value)}
          onFocus={()=>query.length>=1&&results.length>0&&setShowDD(true)}
          placeholder="Search by drug name (EN/中文), ingredient, NHI code, or ATC code..."
          style={{width:'100%',padding:'12px 16px',fontSize:15,borderRadius:10,fontFamily:'inherit',
            border:`1px solid ${showDD?C.primary:C.border}`,outline:'none',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}/>

        {showDD&&(
          <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:200,background:'#fff',
            border:`1px solid ${C.border}`,borderTop:'none',borderRadius:'0 0 10px 10px',
            boxShadow:'0 8px 24px rgba(0,0,0,.12)',maxHeight:260,overflowY:'auto'}}>
            {results.slice(0,6).map((d,i)=>(
              <div key={d.id} onMouseDown={()=>pick(d)}
                style={{padding:'10px 16px',cursor:'pointer',display:'flex',justifyContent:'space-between',
                  alignItems:'center',borderBottom:i<Math.min(results.length,6)-1?`1px solid ${C.border}`:'none',background:'#fff'}}
                onMouseEnter={e=>e.currentTarget.style.background='#f0f7ff'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{d.ingredient}</div>
                  <div style={{fontSize:12,color:C.muted}}>{d.nameEN} · {d.nameZH}</div>
                </div>
                <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,
                  background:cc(d.score)+'20',color:cc(d.score)}}>{pct(d.score)}%</span>
              </div>
            ))}
            {results.length>6&&(
              <div style={{padding:'8px 16px',fontSize:12,color:C.muted,textAlign:'center'}}>
                {results.length-6} more — keep typing to narrow down
              </div>
            )}
          </div>
        )}
      </div>

      {selected?(
        <Card>
          <button onClick={()=>{setSelected(null);setQuery('')}}
            style={{background:'none',border:'none',color:C.primary,cursor:'pointer',fontSize:13,fontWeight:600,marginBottom:12,padding:0}}>
            ← Back to results
          </button>
          <LowConfWarning score={selected.score} name={selected.nameEN}/>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
            <div>
              <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:4}}>
                <span style={{fontWeight:700,fontSize:20}}>{selected.ingredient}</span>
                <DrugClassBadge raw={selected.drugClass}/>
                {selected.combination==='複方'&&(
                  <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:8,
                    color:'#92400e',background:'#fef3c7',border:'1px solid #fbbf2433',marginLeft:2}}>複方</span>
                )}
              </div>
              <div style={{color:C.muted,fontSize:13,marginTop:2}}>
                Active Ingredient (成分根節點)
                {selected.atc&&(
                  <span style={{marginLeft:8,color:C.primary,fontSize:12}}>
                    · {ATC_CATEGORIES[selected.atc[0]?.toUpperCase()]||''}
                  </span>
                )}
              </div>
            </div>
            <span style={{background:cc(selected.score)+'20',color:cc(selected.score),
              padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,border:`1px solid ${cc(selected.score)}44`}}>
              {pct(selected.score)}% match
            </span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
            {[
              ['NHI Code (健保碼)', selected.id],
              ['ATC Code', selected.atc],
              ['English Name', selected.nameEN],
              ['Chinese Name (中文名)', selected.nameZH],
              ['Dosage Form (劑型)', selected.form],
              ['Strength (劑量)', selected.strength],
              isStaff ? ['NHI Price (NT$)', `NT$ ${selected.price}`] : null,
              ['Manufacturer (製造商)', selected.manufacturer],
            ].filter(Boolean).map(([l,v])=>(
              <div key={l} style={{background:'#f8fafc',borderRadius:8,padding:'10px 12px'}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:2}}>{l}</div>
                <div style={{fontSize:14,fontWeight:500}}>{v}</div>
              </div>
            ))}
          </div>
          {selected.nhiChapter&&(
            <div style={{background:'#f0f7ff',border:`1px solid ${C.primary}33`,borderRadius:8,
              padding:'8px 12px',marginBottom:12,fontSize:12,display:'flex',gap:16,flexWrap:'wrap'}}>
              <span><b>NHI Chapter:</b> {selected.nhiChapter}</span>
              {selected.combination&&<span><b>Type:</b> {selected.combination}</span>}
              {selected.drugClass&&<span><b>Class:</b> {drugClassLabel(selected.drugClass)||selected.drugClass}</span>}
            </div>
          )}
          {!isStaff&&(
            <div style={{background:'#f8fafc',border:`1px dashed ${C.border}`,borderRadius:8,padding:'10px 12px',
              marginBottom:12,fontSize:12,color:C.muted,display:'flex',alignItems:'center',gap:8}}>
              🔒 <span>NHI reimbursement price is available to Hospital Staff and Admin only.</span>
            </div>
          )}
          <AlternativesPanel drug={selected}/>
          <ExternalLinks drug={selected}/>
          <LockedFeature minRole="staff">
            <div style={{background:C.staffBg,border:`1px solid #fbbf24`,borderRadius:8,padding:12,marginBottom:12}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:6}}>🏥 Routing & Trace (Staff Only)</div>
              <div style={{fontSize:13}}><b>Mapping path:</b> {selected.nameEN} → {selected.ingredient} → ATC {selected.atc}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:4}}>Brand → Ingredient root → WHO ATC → RxNorm CUI (via API)</div>
            </div>
          </LockedFeature>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>{setSelected(null);setQuery('')}}
              style={{flex:1,padding:'10px',borderRadius:8,border:`1px solid ${C.border}`,
                background:'#f8fafc',fontSize:13,fontWeight:600,cursor:'pointer',color:C.text}}>← Scan Again</button>
            <button onClick={()=>setReportDrug(selected)}
              style={{flex:1,padding:'10px',borderRadius:8,border:`1px solid ${C.danger}44`,
                background:'#fff5f5',fontSize:13,fontWeight:600,cursor:'pointer',color:C.danger}}>⚠ Report Error</button>
          </div>
        </Card>
      ):(
        <>
          {results.length>0&&!showDD?(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {results.map(d=>(
                <Card key={d.id} style={{cursor:'pointer'}} onClick={()=>pick(d)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap'}}>
                        <span style={{fontWeight:600,fontSize:15}}>{d.ingredient}</span>
                        <DrugClassBadge raw={d.drugClass}/>
                      </div>
                      <div style={{fontSize:13,color:C.muted,marginTop:2}}>{d.nameEN} · {d.nameZH}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:4}}>
                        {d.id} · ATC: {d.atc} · {d.form}
                        {isStaff && ` · NT$ ${d.price}`}
                      </div>
                    </div>
                    <div style={{width:48,height:48,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:13,fontWeight:700,background:cc(d.score)+'22',color:cc(d.score),
                      border:`2px solid ${cc(d.score)}`,flexShrink:0,marginLeft:12}}>{pct(d.score)}%</div>
                  </div>
                </Card>
              ))}
            </div>
          ):query.length>=2&&!showDD?(
            <Card style={{textAlign:'center',color:C.muted,padding:40}}>
              <div style={{fontSize:36,marginBottom:8}}>🔍</div>
              <div>No drugs found for "<b>{query}</b>"</div>
              <div style={{fontSize:13,marginTop:4}}>This would be flagged for admin review in production.</div>
            </Card>
          ):!query?(
            <Card style={{color:C.muted,padding:32,textAlign:'center'}}>
              <div style={{fontSize:36,marginBottom:12}}>💊</div>
              <div style={{fontWeight:600,marginBottom:8}}>Search the NHI Drug Dictionary</div>
              <div style={{fontSize:13}}>Try: "magnesium", "氧化鎂", "metformin", "A024806100", "A02AA02"</div>
            </Card>
          ):null}
        </>
      )}
    </div>
  )
}

// ── OCR Hook (real Tesseract.js + demo mode) ──────────────────────────────
function useOCR() {
  const [stage,setStage]=useState('idle')   // idle|loading|recognizing|matching|done|error
  const [progress,setProgress]=useState(0)
  const [ocrStatus,setOcrStatus]=useState('')
  const [result,setResult]=useState(null)
  const [previewUrl,setPreviewUrl]=useState(null)
  const [ocrError,setOcrError]=useState(null)

  async function recognize(imageFile) {
    const url=URL.createObjectURL(imageFile)
    setPreviewUrl(url); setStage('loading'); setProgress(0); setOcrError(null); setResult(null)
    try {
      const {createWorker}=await import('tesseract.js')
      const worker=await createWorker(['eng','chi_tra'],1,{
        logger: m=>{
          if(m.status==='recognizing text'){
            setStage('recognizing'); setProgress(Math.round(m.progress*100))
          } else {
            setOcrStatus(m.status||'')
          }
        }
      })
      const {data:{text}}=await worker.recognize(url)
      await worker.terminate()
      setStage('matching')
      const matched=matchOcrText(text)
      setResult({rawText:text.trim(),matched})
      setStage('done')
    } catch(e) {
      setOcrError(e.message||'OCR failed. Try the demo mode.')
      setStage('error')
    }
  }

  async function runDemo() {
    setPreviewUrl(null); setStage('loading'); setProgress(0); setOcrError(null); setResult(null)
    await new Promise(r=>setTimeout(r,500))
    setStage('recognizing')
    for(let p=0;p<=100;p+=4){
      await new Promise(r=>setTimeout(r,55))
      setProgress(p)
    }
    setStage('matching')
    await new Promise(r=>setTimeout(r,350))
    setResult({rawText:DEMO_OCR_RESULT.rawText,matched:DEMO_OCR_RESULT.matched})
    setStage('done')
  }

  function reset(){
    setPreviewUrl(null); setStage('idle'); setProgress(0)
    setOcrStatus(''); setResult(null); setOcrError(null)
  }

  return {stage,progress,ocrStatus,result,previewUrl,ocrError,recognize,runDemo,reset}
}

// ── Scan Rx ────────────────────────────────────────────────────────────────
function ScanRx(){
  const ocr=useOCR()
  const [added,setAdded]=useState(new Set())
  const [reportDrug,setReportDrug]=useState(null)
  const fileRef=useRef()
  const {isStaff}=useAuth()
  const cc=s=>s>=LOW_CONF?C.success:s>=0.55?C.warning:C.danger

  function handleFile(e){
    const file=e.target.files?.[0]
    if(file) ocr.recognize(file)
    e.target.value=''
  }
  function addMed(drug){
    setAdded(p=>new Set([...p,drug.id]))
    addHist({type:'scan',query:drug.nameEN,result:drug.ingredient,score:0.95})
  }

  if(ocr.stage==='idle') return(
    <Card>
      {reportDrug&&<ReportModal drug={reportDrug} onClose={()=>setReportDrug(null)}/>}
      <div style={{textAlign:'center',padding:'28px 0'}}>
        <div style={{fontSize:52,marginBottom:12}}>📷</div>
        <div style={{fontWeight:700,fontSize:18,marginBottom:8}}>Scan Prescription</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:24,lineHeight:1.6}}>
          Upload a photo of your prescription or medicine packaging.<br/>
          Real OCR will extract drug names — Traditional Chinese &amp; English.
        </div>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={()=>fileRef.current.click()}
            style={{padding:'12px 26px',background:C.primary,color:'#fff',border:'none',
              borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer'}}>
            📁 Upload Image
          </button>
          <button onClick={ocr.runDemo}
            style={{padding:'12px 26px',background:'#f1f5f9',color:C.text,
              border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
            🧪 Demo Prescription
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
        <div style={{marginTop:14,fontSize:11,color:C.muted}}>Supports JPG · PNG · WEBP · HEIC</div>
      </div>
    </Card>
  )

  if(ocr.stage==='loading'||ocr.stage==='recognizing'||ocr.stage==='matching') return(
    <Card style={{textAlign:'center',padding:44}}>
      <div style={{fontSize:48,marginBottom:14}}>
        {ocr.stage==='matching'?'🔍':ocr.stage==='recognizing'?'🔤':'⚙️'}
      </div>
      <div style={{fontWeight:700,fontSize:16,marginBottom:12}}>
        {ocr.stage==='matching'?'Matching against NHI drug database...':
         ocr.stage==='recognizing'?'Extracting text from image...':
         'Initializing OCR engine...'}
      </div>
      {ocr.stage==='loading'&&(
        <div style={{fontSize:13,color:C.muted,marginBottom:16}}>
          {ocr.ocrStatus||'Loading Tesseract engine and language data...'}
        </div>
      )}
      {ocr.stage==='recognizing'&&(
        <>
          <div style={{background:'#e2e8f0',borderRadius:20,height:10,overflow:'hidden',marginBottom:8}}>
            <div style={{height:'100%',borderRadius:20,background:C.primary,
              width:`${ocr.progress}%`,transition:'width 0.1s ease'}}/>
          </div>
          <div style={{fontSize:13,color:C.muted,marginBottom:8}}>{ocr.progress}%</div>
        </>
      )}
      {ocr.previewUrl&&(
        <img src={ocr.previewUrl} alt="preview"
          style={{maxHeight:110,maxWidth:'100%',borderRadius:8,opacity:.65,marginTop:8}}/>
      )}
    </Card>
  )

  if(ocr.stage==='error') return(
    <Card>
      <div style={{textAlign:'center',padding:'28px 0'}}>
        <div style={{fontSize:48,marginBottom:12}}>❌</div>
        <div style={{fontWeight:700,fontSize:16,color:C.danger,marginBottom:8}}>OCR Failed</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20,maxWidth:320,margin:'0 auto 20px'}}>
          {ocr.ocrError}
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={ocr.reset}
            style={{padding:'10px 20px',background:'#f1f5f9',color:C.text,border:`1px solid ${C.border}`,
              borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Try Again</button>
          <button onClick={ocr.runDemo}
            style={{padding:'10px 20px',background:C.primary,color:'#fff',border:'none',
              borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>🧪 Use Demo</button>
        </div>
      </div>
    </Card>
  )

  // stage === 'done'
  const {rawText,matched}=ocr.result
  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {reportDrug&&<ReportModal drug={reportDrug} onClose={()=>setReportDrug(null)}/>}
      <Card style={{background:'#f0fdf4',border:`1px solid ${C.success}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:600,fontSize:14,color:'#166534',marginBottom:6}}>
              ✅ OCR Complete — {matched.length} drug{matched.length!==1?'s':''} identified
            </div>
            <div style={{fontFamily:'monospace',fontSize:11,color:C.muted,whiteSpace:'pre-wrap',
              maxHeight:72,overflowY:'auto',background:'rgba(255,255,255,.7)',
              padding:'6px 8px',borderRadius:6,lineHeight:1.5}}>
              {rawText||'(no text extracted)'}
            </div>
          </div>
          {ocr.previewUrl&&(
            <img src={ocr.previewUrl} alt="scan"
              style={{maxHeight:80,maxWidth:90,borderRadius:6,objectFit:'cover',flexShrink:0}}/>
          )}
        </div>
      </Card>

      {matched.length===0?(
        <Card style={{textAlign:'center',padding:36,color:C.muted}}>
          <div style={{fontSize:36,marginBottom:8}}>🤔</div>
          <div style={{fontWeight:600,marginBottom:8}}>No drugs matched in NHI database</div>
          <div style={{fontSize:13}}>OCR extracted text but couldn't identify any known drugs. Try the demo or a clearer image.</div>
        </Card>
      ):(
        <>
          <div style={{fontWeight:700,fontSize:16}}>Identified Drugs ({matched.length})</div>
          {matched.map(({drug,confidence})=>(
            <Card key={drug.id}>
              <LowConfWarning score={confidence} name={drug.nameEN}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:16}}>{drug.ingredient}</span>
                    <span style={{fontSize:11,padding:'2px 8px',borderRadius:12,
                      background:cc(confidence)+'22',color:cc(confidence),fontWeight:600}}>
                      {Math.round(confidence*100)}% confidence
                    </span>
                  </div>
                  <div style={{fontSize:13,color:C.muted}}>{drug.nameEN} · {drug.nameZH}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:4}}>
                    {drug.id} · ATC: {drug.atc} · {drug.form} {drug.strength}
                    {isStaff&&` · NT$ ${drug.price}`}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6,marginLeft:12}}>
                  <button onClick={()=>addMed(drug)} disabled={added.has(drug.id)}
                    style={{padding:'7px 12px',borderRadius:8,fontSize:13,fontWeight:600,border:'none',
                      cursor:added.has(drug.id)?'default':'pointer',
                      background:added.has(drug.id)?'#e8f5e9':C.primary,
                      color:added.has(drug.id)?C.success:'#fff'}}>
                    {added.has(drug.id)?'✓ Added':'+ Add'}
                  </button>
                  <button onClick={()=>setReportDrug(drug)}
                    style={{padding:'7px 12px',borderRadius:8,fontSize:12,fontWeight:500,
                      border:`1px solid ${C.danger}44`,background:'#fff5f5',color:C.danger,cursor:'pointer'}}>
                    ⚠ Error
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      {added.size>0&&(
        <Card style={{background:'#f0fdf4',border:`1px solid ${C.success}`,textAlign:'center'}}>
          <div style={{fontWeight:600,color:'#166534'}}>
            {added.size} drug{added.size>1?'s':''} added to My Medications ✓
          </div>
        </Card>
      )}
      <button onClick={()=>{ocr.reset();setAdded(new Set())}}
        style={{padding:'12px',borderRadius:10,border:`1px solid ${C.border}`,
          background:'#f8fafc',fontSize:14,fontWeight:600,cursor:'pointer',color:C.text}}>
        Scan Another Prescription
      </button>
    </div>
  )
}

// ── Auto Interaction Banner ────────────────────────────────────────────────
function InteractionBanner({meds}){
  const alerts=useMemo(()=>checkInteractions(meds),[meds])
  if(alerts.length===0) return null
  const worst=alerts[0]
  const cfg=SEVERITY_CFG[worst.severity]||SEVERITY_CFG.LOW
  return(
    <div style={{background:cfg.bg,border:`2px solid ${cfg.border}`,borderRadius:12,
      padding:'14px 16px',marginBottom:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:alerts.length>0?10:0,flexWrap:'wrap'}}>
        <span style={{fontSize:22}}>{cfg.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14,color:cfg.color}}>
            {alerts.length} Drug Interaction{alerts.length>1?'s':''} Detected in Your Meds
          </div>
          <div style={{fontSize:12,color:cfg.color,opacity:.85,marginTop:1}}>
            Highest severity: {worst.severity} · {worst.drugA.ingredient} ↔ {worst.drugB.ingredient}
          </div>
        </div>
        <span style={{fontSize:11,fontWeight:600,color:cfg.color,
          background:'rgba(255,255,255,.65)',padding:'3px 9px',borderRadius:10,flexShrink:0}}>
          See ⚠️ Interactions tab
        </span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {alerts.slice(0,3).map((a,i)=>{
          const c2=SEVERITY_CFG[a.severity]||SEVERITY_CFG.LOW
          return(
            <div key={i} style={{background:'rgba(255,255,255,.55)',borderRadius:8,
              padding:'8px 10px',fontSize:12}}>
              <span style={{fontWeight:700,color:c2.color}}>{c2.icon} {a.drugA.ingredient} + {a.drugB.ingredient} </span>
              <span style={{color:'#374151'}}>{a.en.length>90?a.en.slice(0,90)+'…':a.en}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── My Medications ─────────────────────────────────────────────────────────
function MyMeds(){
  const [meds,setMeds]=useState([
    {...DRUGS[6],times:['09:00'],reminderOn:true},
    {...DRUGS[9],times:['08:00','12:00','18:00'],reminderOn:true},
    {...DRUGS[7],times:['08:00'],reminderOn:true},
  ])
  const {isStaff}=useAuth()
  const toggle=id=>setMeds(p=>p.map(m=>m.id===id?{...m,reminderOn:!m.reminderOn}:m))
  const remove=id=>setMeds(p=>p.filter(m=>m.id!==id))

  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {meds.length>=2&&<InteractionBanner meds={meds}/>}
      {meds.length===0?(
        <Card style={{textAlign:'center',padding:48,color:C.muted}}>
          <div style={{fontSize:48,marginBottom:12}}>💊</div>
          <div style={{fontWeight:600,marginBottom:8}}>No medications yet</div>
          <div style={{fontSize:13}}>Use Drug Search or Scan Rx to add medications here.</div>
        </Card>
      ):meds.map(med=>(
        <Card key={med.id}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:16}}>{med.ingredient}</div>
              <div style={{fontSize:13,color:C.muted,marginTop:2}}>{med.nameEN}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{med.form} · {med.strength}</div>
              <div style={{marginTop:12}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>⏰ Reminder times:</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {med.times.map(t=>(
                    <span key={t} style={{background:med.reminderOn?C.primary+'18':'#f1f5f9',
                      color:med.reminderOn?C.primary:C.muted,padding:'4px 10px',borderRadius:20,fontSize:13,fontWeight:500}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end',marginLeft:12}}>
              <button onClick={()=>toggle(med.id)}
                style={{padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,
                  border:`1px solid ${med.reminderOn?C.success:C.border}`,cursor:'pointer',
                  background:med.reminderOn?'#f0fdf4':'#f8fafc',color:med.reminderOn?C.success:C.muted}}>
                {med.reminderOn?'🔔 On':'🔕 Off'}
              </button>
              <button onClick={()=>remove(med.id)}
                style={{padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:500,
                  border:`1px solid ${C.border}`,cursor:'pointer',background:'#fff',color:C.danger}}>Remove</button>
            </div>
          </div>
        </Card>
      ))}
      <LockedFeature minRole="staff">
        <Card style={{background:C.staffBg,border:`1px solid #fbbf24`}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:8}}>📤 Export Medication List (Staff)</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:12}}>Download as CSV for clinical documentation.</div>
          <button onClick={()=>{
            const csv='NHI Code,Drug Name,Ingredient,ATC,Form,Strength\n'+
              meds.map(m=>`${m.id},"${m.nameEN}","${m.ingredient}",${m.atc},${m.form},${m.strength}`).join('\n')
            const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
            a.download='medications_export.csv'; a.click()
          }} style={{padding:'8px 16px',background:C.primary,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
            Download CSV
          </button>
        </Card>
      </LockedFeature>
    </div>
  )
}

// ── Scan History ───────────────────────────────────────────────────────────
function ScanHistory(){
  const {isStaff}=useAuth()
  const [tick,setTick]=useState(0)
  const h=HISTORY
  const fmt=iso=>{ try{return new Date(iso).toLocaleString()}catch{return iso} }
  const cc=s=>s>=LOW_CONF?C.success:s>=0.55?C.warning:C.danger

  function exportCSV(){
    const csv='Timestamp,Type,Query,Result,Confidence\n'+
      h.map(r=>`"${fmt(r.ts)}","${r.type}","${r.query}","${r.result}","${Math.round((r.score||0)*100)}%"`).join('\n')
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    a.download='scan_history.csv'; a.click()
  }

  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontWeight:700,fontSize:16}}>Scan History</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>{h.length}/50 records · stored on this device</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setTick(t=>t+1)}
            style={{padding:'7px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:'#f8fafc',fontSize:13,cursor:'pointer',color:C.text}}>
            Refresh
          </button>
          {isStaff&&h.length>0&&(
            <button onClick={exportCSV}
              style={{padding:'7px 14px',borderRadius:8,background:C.primary,color:'#fff',border:'none',fontSize:13,fontWeight:600,cursor:'pointer'}}>
              📤 Export CSV
            </button>
          )}
        </div>
      </div>

      {!isStaff&&h.length>0&&(
        <div style={{background:C.staffBg,border:`1px solid #fbbf24`,borderRadius:8,padding:'8px 12px',fontSize:12,color:'#92400e'}}>
          💡 Sign in as Staff or Admin to export history as CSV.
        </div>
      )}

      {h.length===0?(
        <Card style={{textAlign:'center',padding:48,color:C.muted}}>
          <div style={{fontSize:48,marginBottom:12}}>🕐</div>
          <div style={{fontWeight:600,marginBottom:8}}>No history yet</div>
          <div style={{fontSize:13}}>Search or scan a drug to build your history.</div>
        </Card>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {h.map((r,i)=>(
            <Card key={i} style={{padding:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,
                      background:r.type==='scan'?'#e0f2fe':'#f0fdf4',color:r.type==='scan'?'#0369a1':'#166534'}}>
                      {r.type==='scan'?'📷 Scan':'🔍 Search'}
                    </span>
                    <span style={{fontSize:13,fontWeight:600}}>{r.query}</span>
                  </div>
                  <div style={{fontSize:12,color:C.muted}}>Matched: <b>{r.result}</b></div>
                  <div style={{fontSize:11,color:C.muted,marginTop:4}}>{fmt(r.ts)}</div>
                </div>
                {r.score!=null&&(
                  <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:12,
                    background:cc(r.score)+'20',color:cc(r.score),flexShrink:0,marginLeft:10}}>
                    {Math.round(r.score*100)}%
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── AI Drug Interaction Center (Staff/Admin only) ──────────────────────────
const SEVERITY_CFG = {
  HIGH:     { color:'#dc2626', bg:'#fef2f2', border:'#fca5a5', icon:'🔴', label:'HIGH' },
  MODERATE: { color:'#d97706', bg:'#fffbeb', border:'#fcd34d', icon:'🟡', label:'MODERATE' },
  LOW:      { color:'#16a34a', bg:'#f0fdf4', border:'#86efac', icon:'🟢', label:'LOW' },
}

function DrugInteractionCenter(){
  const [drugA,setDrugA]=useState('')
  const [drugB,setDrugB]=useState('')
  const [resultsA,setResultsA]=useState([])
  const [resultsB,setResultsB]=useState([])
  const [selA,setSelA]=useState(null)
  const [selB,setSelB]=useState(null)
  const [showA,setShowA]=useState(false)
  const [showB,setShowB]=useState(false)
  const [alerts,setAlerts]=useState([])
  const [checked,setChecked]=useState(false)
  const refA=useRef(); const refB=useRef()

  useEffect(()=>{
    function h(e){
      if(refA.current&&!refA.current.contains(e.target))setShowA(false)
      if(refB.current&&!refB.current.contains(e.target))setShowB(false)
    }
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h)
  },[])

  function typeA(q){ setDrugA(q); setSelA(null); const r=q.length>=1?searchDrugs(q):[]; setResultsA(r); setShowA(q.length>=1&&r.length>0) }
  function typeB(q){ setDrugB(q); setSelB(null); const r=q.length>=1?searchDrugs(q):[]; setResultsB(r); setShowB(q.length>=1&&r.length>0) }
  function pickA(d){ setSelA(d); setDrugA(d.nameEN); setShowA(false) }
  function pickB(d){ setSelB(d); setDrugB(d.nameEN); setShowB(false) }

  function check(){
    if(!selA||!selB){ return }
    setAlerts(checkInteractions([selA,selB]))
    setChecked(true)
  }
  function reset(){ setSelA(null); setSelB(null); setDrugA(''); setDrugB(''); setAlerts([]); setChecked(false) }

  const inputStyle={width:'100%',padding:'10px 14px',fontSize:14,borderRadius:8,fontFamily:'inherit',
    border:`1px solid ${C.border}`,outline:'none'}

  // Always show known interactions reference table
  return(
    <LockedFeature minRole="staff">
      <div style={{display:'flex',flexDirection:'column',gap:16}}>

        {/* Header */}
        <Card style={{background:'linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%)',border:'none',color:'#fff'}}>
          <div style={{fontWeight:700,fontSize:18,marginBottom:4}}>🤖 AI Drug Interaction Center</div>
          <div style={{fontSize:13,opacity:.85}}>
            Check for clinically significant drug–drug interactions. Alerts are based on NHI/Taiwan pharmacovigilance data and international guidelines.
          </div>
          <div style={{fontSize:11,marginTop:8,opacity:.7}}>⚠️ For clinical reference only. Always verify with a pharmacist or physician.</div>
        </Card>

        {/* Drug pair checker */}
        <Card>
          <div style={{fontWeight:600,fontSize:15,marginBottom:12}}>Interaction Checker — Select Two Drugs</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            {/* Drug A */}
            <div ref={refA} style={{position:'relative'}}>
              <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:4}}>Drug A</div>
              <input value={drugA} onChange={e=>typeA(e.target.value)}
                onFocus={()=>drugA.length>=1&&resultsA.length>0&&setShowA(true)}
                placeholder="Search drug A..."
                style={{...inputStyle, borderColor: selA?C.success:C.border}}/>
              {selA&&<div style={{fontSize:11,color:C.success,marginTop:3}}>✓ {selA.ingredient}</div>}
              {showA&&(
                <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:300,background:'#fff',
                  border:`1px solid ${C.border}`,borderRadius:'0 0 8px 8px',boxShadow:'0 8px 24px rgba(0,0,0,.12)',maxHeight:200,overflowY:'auto'}}>
                  {resultsA.slice(0,5).map(d=>(
                    <div key={d.id} onMouseDown={()=>pickA(d)}
                      style={{padding:'8px 12px',cursor:'pointer',fontSize:13,borderBottom:`1px solid ${C.border}`}}
                      onMouseEnter={e=>e.currentTarget.style.background='#f0f7ff'}
                      onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                      <div style={{fontWeight:600}}>{d.ingredient}</div>
                      <div style={{fontSize:11,color:C.muted}}>{d.nameEN}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Drug B */}
            <div ref={refB} style={{position:'relative'}}>
              <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:4}}>Drug B</div>
              <input value={drugB} onChange={e=>typeB(e.target.value)}
                onFocus={()=>drugB.length>=1&&resultsB.length>0&&setShowB(true)}
                placeholder="Search drug B..."
                style={{...inputStyle, borderColor: selB?C.success:C.border}}/>
              {selB&&<div style={{fontSize:11,color:C.success,marginTop:3}}>✓ {selB.ingredient}</div>}
              {showB&&(
                <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:300,background:'#fff',
                  border:`1px solid ${C.border}`,borderRadius:'0 0 8px 8px',boxShadow:'0 8px 24px rgba(0,0,0,.12)',maxHeight:200,overflowY:'auto'}}>
                  {resultsB.slice(0,5).map(d=>(
                    <div key={d.id} onMouseDown={()=>pickB(d)}
                      style={{padding:'8px 12px',cursor:'pointer',fontSize:13,borderBottom:`1px solid ${C.border}`}}
                      onMouseEnter={e=>e.currentTarget.style.background='#f0f7ff'}
                      onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                      <div style={{fontWeight:600}}>{d.ingredient}</div>
                      <div style={{fontSize:11,color:C.muted}}>{d.nameEN}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={check} disabled={!selA||!selB}
              style={{flex:1,padding:'10px',borderRadius:8,fontSize:14,fontWeight:600,border:'none',cursor:selA&&selB?'pointer':'default',
                background:selA&&selB?C.primary:'#e2e8f0',color:selA&&selB?'#fff':C.muted}}>
              🔍 Check Interaction
            </button>
            <button onClick={reset}
              style={{padding:'10px 18px',borderRadius:8,fontSize:14,fontWeight:500,border:`1px solid ${C.border}`,cursor:'pointer',background:'#f8fafc',color:C.text}}>
              Clear
            </button>
          </div>

          {checked&&(
            <div style={{marginTop:16}}>
              {alerts.length===0?(
                <div style={{background:'#f0fdf4',border:`1px solid #86efac`,borderRadius:10,padding:'12px 16px',
                  display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:24}}>✅</span>
                  <div>
                    <div style={{fontWeight:600,color:'#166534'}}>No significant interaction found</div>
                    <div style={{fontSize:12,color:'#15803d',marginTop:2}}>
                      {selA?.ingredient} + {selB?.ingredient} — no interaction recorded in the current database. Always verify clinically.
                    </div>
                  </div>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {alerts.map((a,i)=>{
                    const cfg=SEVERITY_CFG[a.severity]||SEVERITY_CFG.LOW
                    return(
                      <div key={i} style={{background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:10,padding:'14px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          <span style={{fontSize:18}}>{cfg.icon}</span>
                          <span style={{fontWeight:700,fontSize:13,color:cfg.color}}>{cfg.label} SEVERITY</span>
                          <span style={{fontSize:13,fontWeight:600,marginLeft:'auto',color:C.text}}>
                            {a.drugA.ingredient} ↔ {a.drugB.ingredient}
                          </span>
                        </div>
                        <div style={{fontSize:13,color:C.text,marginBottom:8}}>{a.en}</div>
                        <div style={{fontSize:12,color:C.muted,marginBottom:8,fontStyle:'italic'}}>{a.zh}</div>
                        <div style={{background:'rgba(255,255,255,.6)',borderRadius:8,padding:'8px 10px',fontSize:12}}>
                          <span style={{fontWeight:600}}>Clinical Management: </span>{a.management}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Reference interaction table */}
        <Card>
          <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>Known Clinically Significant Interactions</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Based on NHI pharmacovigilance data and international clinical guidelines</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {INTERACTION_DB.map((ix,i)=>{
              const cfg=SEVERITY_CFG[ix.severity]||SEVERITY_CFG.LOW
              return(
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',
                  background:'#f8fafc',borderRadius:8,border:`1px solid ${C.border}`}}>
                  <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{cfg.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>
                      {ix.drugs.map(d=>d.charAt(0).toUpperCase()+d.slice(1)).join(' + ')}
                      <span style={{marginLeft:8,fontSize:11,fontWeight:600,color:cfg.color,
                        background:cfg.bg,border:`1px solid ${cfg.border}`,
                        padding:'1px 7px',borderRadius:10}}>{cfg.label}</span>
                    </div>
                    <div style={{fontSize:12,color:C.muted,marginTop:3}}>{ix.en}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </LockedFeature>
  )
}

// ── Admin Dashboard ────────────────────────────────────────────────────────
function AdminDashboard(){
  const [refreshing,setRefreshing]=useState(false)
  const [step,setStep]=useState(0)
  const [queue,setQueue]=useState([
    {id:1,text:'ZITHROMAX 500mg',status:'pending',created:'2026-05-07 09:14'},
    {id:2,text:'普拿疼 EXTRA',status:'pending',created:'2026-05-07 10:32'},
    {id:3,text:'VOLTAREN GEL',status:'pending',created:'2026-05-08 08:05'},
  ])
  function run(){
    setRefreshing(true);setStep(1)
    ;[2,3,4].forEach((s,i)=>setTimeout(()=>setStep(s),(i+1)*600))
    setTimeout(()=>{setRefreshing(false);setStep(0)},3*600+600)
  }
  const steps=['Import from NHI data source','Deduplication','Diff vs previous version','Release — atomic dictionary swap']

  const stats=computeStats()
  const metrics=stats?[
    {label:'Active Drugs',  value:stats.total.toLocaleString(),     sub:'currently reimbursed by NHI'},
    {label:'Combination Rx',value:stats.combo.toLocaleString(),     sub:`${((stats.combo/stats.total)*100).toFixed(1)}% of total`},
    {label:'Missing ATC',   value:stats.noAtc.toLocaleString(),     sub:'require ATC code mapping'},
    {label:'Drug Classes',  value:Object.keys(stats.byClass).length, sub:'classifications in database'},
  ]:[
    {label:'Total Drugs',value:'—',sub:'loading NHI data...'},
    {label:'Active Drugs',value:'—',sub:''},
    {label:'Missing ATC Code',value:'—',sub:''},
    {label:'Drug Classes',value:'—',sub:''},
  ]

  return(
    <LockedFeature minRole="admin">
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {metrics.map(m=>(
            <Card key={m.label} style={{background:'#fef3f2',border:`1px solid #fca5a5`}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{m.label}</div>
              <div style={{fontWeight:700,fontSize:24}}>{m.value}</div>
              <div style={{fontSize:11,color:C.muted}}>{m.sub}</div>
            </Card>
          ))}
        </div>

        {stats&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Card>
              <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>By Drug Class</div>
              {Object.entries(stats.byClass).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6,alignItems:'center'}}>
                  <span style={{color:C.text}}>{k}</span>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{height:6,borderRadius:3,background:C.primary+'40',width:60}}>
                      <div style={{height:'100%',borderRadius:3,background:C.primary,
                        width:`${Math.round((v/stats.total)*100)}%`}}/>
                    </div>
                    <span style={{color:C.muted,fontSize:11,minWidth:36,textAlign:'right'}}>{v.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>Top ATC Categories</div>
              {stats.topAtc.map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6,alignItems:'center'}}>
                  <span style={{color:C.text,flex:1,marginRight:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{k}</span>
                  <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                    <div style={{height:6,borderRadius:3,background:'#34a85340',width:40}}>
                      <div style={{height:'100%',borderRadius:3,background:C.success,
                        width:`${Math.round((v/stats.topAtc[0][1])*100)}%`}}/>
                    </div>
                    <span style={{color:C.muted,fontSize:11,minWidth:36,textAlign:'right'}}>{v.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
        <Card style={{border:`1px solid ${C.primary}44`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>Dataset Refresh Pipeline</div>
              <div style={{fontSize:12,color:C.muted}}>Last run: 2026-05-01 · Next: 2026-06-01</div>
            </div>
            <button onClick={run} disabled={refreshing}
              style={{padding:'8px 16px',background:refreshing?'#f1f5f9':C.primary,
                color:refreshing?C.muted:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:refreshing?'default':'pointer'}}>
              {refreshing?'⚙️ Running...':'▶ Run Now'}
            </button>
          </div>
          {refreshing&&(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {steps.map((s,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
                  <span>{step>i?'✅':step===i+1?'⏳':'⬜'}</span>
                  <span style={{color:step>i?C.success:step===i+1?C.text:C.muted}}>Step {i+1}/4: {s}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>
            Unknown Drug Review Queue ({queue.filter(q=>q.status==='pending').length} pending)
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {queue.map(q=>(
              <div key={q.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'10px 12px',borderRadius:8,
                background:q.status==='pending'?'#fffbeb':q.status==='confirmed'?'#f0fdf4':'#fef2f2',
                border:`1px solid ${q.status==='pending'?'#fbbf24':q.status==='confirmed'?'#86efac':'#fca5a5'}`}}>
                <div>
                  <div style={{fontWeight:600,fontSize:14,fontFamily:'monospace'}}>{q.text}</div>
                  <div style={{fontSize:11,color:C.muted}}>{q.created}</div>
                </div>
                {q.status==='pending'?(
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setQueue(p=>p.map(r=>r.id===q.id?{...r,status:'confirmed'}:r))}
                      style={{padding:'6px 12px',background:C.success,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>✓ Confirm</button>
                    <button onClick={()=>setQueue(p=>p.map(r=>r.id===q.id?{...r,status:'rejected'}:r))}
                      style={{padding:'6px 12px',background:C.danger,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>✗ Reject</button>
                  </div>
                ):(
                  <span style={{fontSize:12,fontWeight:600,color:q.status==='confirmed'?C.success:C.danger}}>
                    {q.status==='confirmed'?'✓ Confirmed':'✗ Rejected'}
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

// ── Main App ───────────────────────────────────────────────────────────────
function AppInner(){
  const [tab,setTab]=useState('search')
  const [showLogin,setShowLogin]=useState(false)
  const [nhiCount,setNhiCount]=useState(0)
  const {isAdmin,isStaff}=useAuth()

  useEffect(()=>{
    loadNHIDrugs().then(n=>{ if(n>0) setNhiCount(n) })
  },[])

  const tabs=[
    {id:'search',    label:'🔍 Drug Search'},
    {id:'scan',      label:'📷 Scan Rx'},
    {id:'meds',      label:'💊 My Meds'},
    {id:'history',   label:'🕐 History'},
    {id:'interact',  label:'⚠️ Interactions', minRole:'staff'},
    {id:'admin',     label:'⚙️ Admin',        minRole:'admin'},
  ].filter(t=>{
    if(t.minRole==='admin') return isAdmin
    if(t.minRole==='staff') return isStaff
    return true
  })

  return(
    <div style={{minHeight:'100vh',background:C.bg}}>
      <NavBar showLogin={()=>setShowLogin(true)} nhiCount={nhiCount}/>
      {showLogin&&<LoginModal onClose={()=>setShowLogin(false)}/>}
      <div style={{background:'#fff',borderBottom:`1px solid ${C.border}`,padding:'0 16px',display:'flex',gap:0,overflowX:'auto'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:'14px 14px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontFamily:'inherit',
              fontWeight:tab===t.id?700:400,whiteSpace:'nowrap',color:tab===t.id?C.primary:C.muted,
              borderBottom:tab===t.id?`3px solid ${C.primary}`:'3px solid transparent'}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{maxWidth:720,margin:'0 auto',padding:16}}>
        {tab==='search'   &&<DrugSearch/>}
        {tab==='scan'     &&<ScanRx/>}
        {tab==='meds'     &&<MyMeds/>}
        {tab==='history'  &&<ScanHistory/>}
        {tab==='interact' &&<DrugInteractionCenter/>}
        {tab==='admin'    &&<AdminDashboard/>}
      </div>
      <div style={{textAlign:'center',padding:'24px 16px',color:C.muted,fontSize:12}}>
        RxNorm Taiwan · Group 6 · NTHU EECS Rural Smart Healthcare · 2026<br/>
        Data source: NHI Pharmaceutical Benefit and Reimbursement Schedule · {nhiCount>0?`${nhiCount.toLocaleString()} active drugs`:'Loading NHI data...'}
      </div>
    </div>
  )
}

export default function App(){
  return <AuthProvider><AppInner/></AuthProvider>
}

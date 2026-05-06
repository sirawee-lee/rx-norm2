import React, { useState, useRef, useEffect } from 'react'
import { AuthProvider, useAuth } from './auth.jsx'
import { searchDrugs, DEMO_OCR_RESULT, DRUGS } from './data.js'

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

// ── Low-confidence warning banner ── NEW (F05)
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

// ── Report Error modal ── NEW (SRS Screen 2)
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

// ── Login Modal
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

// ── NavBar
function NavBar({showLogin}){
  const {user,logout}=useAuth()
  return(
    <div style={{background:C.primary,padding:'0 20px',display:'flex',alignItems:'center',
      justifyContent:'space-between',height:56,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,.15)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:22}}>💊</span>
        <div>
          <span style={{color:'#fff',fontWeight:700,fontSize:16}}>RxNorm Taiwan</span>
          <span style={{color:'rgba(255,255,255,.7)',fontSize:11,marginLeft:8}}>Drug Identification System</span>
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

// ── Drug Search (with autocomplete dropdown) ── NEW (F06)
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

        {/* Autocomplete dropdown */}
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
              <div style={{fontWeight:700,fontSize:20}}>{selected.ingredient}</div>
              <div style={{color:C.muted,fontSize:13,marginTop:2}}>Active Ingredient (成分根節點)</div>
            </div>
            <span style={{background:cc(selected.score)+'20',color:cc(selected.score),
              padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,border:`1px solid ${cc(selected.score)}44`}}>
              {pct(selected.score)}% match
            </span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
            {[['NHI Code (健保碼)',selected.id],['ATC Code',selected.atc],
              ['English Name',selected.nameEN],['Chinese Name (中文名)',selected.nameZH],
              ['Dosage Form (劑型)',selected.form],['Strength (劑量)',selected.strength],
              ['NHI Price (NT$)',`NT$ ${selected.price}`],['Manufacturer (製造商)',selected.manufacturer]
            ].map(([l,v])=>(
              <div key={l} style={{background:'#f8fafc',borderRadius:8,padding:'10px 12px'}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:2}}>{l}</div>
                <div style={{fontSize:14,fontWeight:500}}>{v}</div>
              </div>
            ))}
          </div>
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
                      <div style={{fontWeight:600,fontSize:15}}>{d.ingredient}</div>
                      <div style={{fontSize:13,color:C.muted,marginTop:2}}>{d.nameEN} · {d.nameZH}</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:4}}>{d.id} · ATC: {d.atc} · {d.form} · NT$ {d.price}</div>
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

// ── Scan Rx (with front/back toggle) ── NEW (SRS Screen 1)
function ScanRx(){
  const [stage,setStage]=useState('idle')
  const [mode,setMode]=useState('front')          // front | back
  const [frontDone,setFrontDone]=useState(false)
  const [added,setAdded]=useState(new Set())
  const [reportDrug,setReportDrug]=useState(null)
  const fileRef=useRef()

  function capture(m){
    setMode(m); setStage('scanning')
    setTimeout(()=>{
      if(m==='front'){setFrontDone(true);setStage('idle')}
      else setStage('results')
    },1400)
  }
  function addMed(drug){
    setAdded(p=>new Set([...p,drug.id]))
    addHist({type:'scan',query:drug.nameEN,result:drug.ingredient,score:0.95})
  }
  const cc=s=>s>=LOW_CONF?C.success:s>=0.55?C.warning:C.danger

  return(
    <div>
      {reportDrug&&<ReportModal drug={reportDrug} onClose={()=>setReportDrug(null)}/>}

      {stage==='idle'&&(
        <Card style={{padding:0,overflow:'hidden'}}>
          {/* Front/Back toggle */}
          <div style={{display:'flex',borderBottom:`1px solid ${C.border}`}}>
            {['front','back'].map(m=>(
              <button key={m} onClick={()=>setMode(m)}
                style={{flex:1,padding:'12px 0',border:'none',cursor:'pointer',fontFamily:'inherit',
                  fontSize:14,fontWeight:mode===m?700:400,
                  background:mode===m?C.primary+'10':'#fff',color:mode===m?C.primary:C.muted,
                  borderBottom:mode===m?`3px solid ${C.primary}`:'3px solid transparent'}}>
                {m==='front'?'📦 Front (Brand Name)':'🔬 Back (Ingredients)'}
                {m==='front'&&frontDone&&<span style={{marginLeft:6,color:C.success}}>✓</span>}
              </button>
            ))}
          </div>
          <div style={{padding:32,textAlign:'center'}}>
            {/* Simulated viewfinder */}
            <div style={{width:'100%',height:160,background:'#1a202c',borderRadius:10,marginBottom:20,
              display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
              <div style={{border:'2px dashed rgba(255,255,255,.5)',borderRadius:8,width:'70%',height:'70%',
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{color:'rgba(255,255,255,.5)',fontSize:13}}>
                  {mode==='front'?'Position brand name inside frame':'Position ingredient list inside frame'}
                </span>
              </div>
              {frontDone&&mode==='back'&&(
                <div style={{position:'absolute',top:8,left:8,background:C.success,color:'#fff',
                  fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:6}}>✓ Front captured</div>
              )}
            </div>
            <div style={{marginBottom:8,fontSize:14,color:C.muted}}>
              {mode==='front'?'Step 1: Capture the front of the package (brand name)':'Step 2: Capture the back of the package (ingredient list)'}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={()=>capture(mode)}
                style={{padding:'11px 22px',background:C.primary,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
                📷 Capture {mode==='front'?'Front':'Back'}
              </button>
              <button onClick={()=>fileRef.current.click()}
                style={{padding:'11px 22px',background:'#f1f5f9',color:C.text,border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
                📁 Upload Image
              </button>
              <button onClick={()=>{setFrontDone(true);capture('back')}}
                style={{padding:'11px 22px',background:'#f1f5f9',color:C.text,border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
                🧪 Demo Prescription
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={()=>capture(mode)}/>
          </div>
        </Card>
      )}

      {stage==='scanning'&&(
        <Card style={{textAlign:'center',padding:48}}>
          <div style={{fontSize:48,marginBottom:16}}>⚙️</div>
          <div style={{fontWeight:600,fontSize:16,marginBottom:8}}>
            {mode==='front'?'Capturing front of package...':'Running OCR pipeline...'}
          </div>
          <div style={{color:C.muted,fontSize:14}}>
            {mode==='back'?'OCR extraction → Text normalization → NHI dictionary matching':'Processing image...'}
          </div>
        </Card>
      )}

      {stage==='results'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card style={{background:'#f0fdf4',border:`1px solid ${C.success}`}}>
            <div style={{fontWeight:600,fontSize:14,marginBottom:4,color:'#166534'}}>✅ OCR Complete — Both sides scanned</div>
            <div style={{fontFamily:'monospace',fontSize:12,color:C.muted,whiteSpace:'pre-wrap'}}>{DEMO_OCR_RESULT.rawText}</div>
          </Card>
          <div style={{fontWeight:700,fontSize:16,padding:'4px 0'}}>Identified Drugs ({DEMO_OCR_RESULT.matched.length})</div>
          {DEMO_OCR_RESULT.matched.map(({drug,confidence})=>(
            <Card key={drug.id}>
              <LowConfWarning score={confidence} name={drug.nameEN}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:16}}>{drug.ingredient}</span>
                    <span style={{fontSize:11,padding:'2px 8px',borderRadius:12,background:cc(confidence)+'22',color:cc(confidence),fontWeight:600}}>
                      {Math.round(confidence*100)}% confidence
                    </span>
                  </div>
                  <div style={{fontSize:13,color:C.muted}}>{drug.nameEN} · {drug.nameZH}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:4}}>{drug.id} · ATC: {drug.atc} · {drug.form} {drug.strength} · NT$ {drug.price}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6,marginLeft:12}}>
                  <button onClick={()=>addMed(drug)} disabled={added.has(drug.id)}
                    style={{padding:'7px 12px',borderRadius:8,fontSize:13,fontWeight:600,border:'none',
                      cursor:added.has(drug.id)?'default':'pointer',
                      background:added.has(drug.id)?'#e8f5e9':C.primary,color:added.has(drug.id)?C.success:'#fff'}}>
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
          {added.size>0&&(
            <Card style={{background:'#f0fdf4',border:`1px solid ${C.success}`,textAlign:'center'}}>
              <div style={{fontWeight:600,color:'#166534'}}>{added.size} drug{added.size>1?'s':''} added to My Medications ✓</div>
            </Card>
          )}
          <button onClick={()=>{setStage('idle');setAdded(new Set());setFrontDone(false)}}
            style={{padding:'12px',borderRadius:10,border:`1px solid ${C.border}`,background:'#f8fafc',fontSize:14,fontWeight:600,cursor:'pointer',color:C.text}}>
            Scan Another Prescription
          </button>
        </div>
      )}
    </div>
  )
}

// ── My Medications
function MyMeds(){
  const [meds,setMeds]=useState([
    {...DRUGS[0],times:['08:00','20:00'],reminderOn:true},
    {...DRUGS[7],times:['08:00'],reminderOn:true},
  ])
  const {isStaff}=useAuth()
  const toggle=id=>setMeds(p=>p.map(m=>m.id===id?{...m,reminderOn:!m.reminderOn}:m))
  const remove=id=>setMeds(p=>p.filter(m=>m.id!==id))

  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
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

// ── Scan History tab ── NEW (F07, URS Screen 4)
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

// ── Admin Dashboard
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
  const metrics=[
    {label:'Total Drugs',value:'41,283',sub:'in NHI database'},
    {label:'Active Drugs',value:'38,912',sub:'94.3% of total'},
    {label:'Expired Permits',value:'2,371',sub:'flagged for removal'},
    {label:'Missing ATC Code',value:'1,204',sub:'require mapping'},
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

// ── Main App
function AppInner(){
  const [tab,setTab]=useState('search')
  const [showLogin,setShowLogin]=useState(false)
  const {isAdmin}=useAuth()
  const tabs=[
    {id:'search', label:'🔍 Drug Search'},
    {id:'scan',   label:'📷 Scan Rx'},
    {id:'meds',   label:'💊 My Meds'},
    {id:'history',label:'🕐 History'},
    {id:'admin',  label:'⚙️ Admin', adminOnly:true},
  ].filter(t=>!t.adminOnly||isAdmin)

  return(
    <div style={{minHeight:'100vh',background:C.bg}}>
      <NavBar showLogin={()=>setShowLogin(true)}/>
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
        {tab==='search' &&<DrugSearch/>}
        {tab==='scan'   &&<ScanRx/>}
        {tab==='meds'   &&<MyMeds/>}
        {tab==='history'&&<ScanHistory/>}
        {tab==='admin'  &&<AdminDashboard/>}
      </div>
      <div style={{textAlign:'center',padding:'24px 16px',color:C.muted,fontSize:12}}>
        RxNorm Taiwan · Group 6 · NTHU EECS Rural Smart Healthcare · 2026<br/>
        Data source: NHI Pharmaceutical Benefit and Reimbursement Schedule
      </div>
    </div>
  )
}

export default function App(){
  return <AuthProvider><AppInner/></AuthProvider>
}

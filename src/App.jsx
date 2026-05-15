import React, { useState, useRef, useEffect, useMemo } from 'react'
import { AuthProvider, useAuth } from './auth.jsx'
import { searchDrugs, loadNHIDrugs, DEMO_OCR_RESULT, DRUGS, INTERACTION_DB, checkInteractions,
         ATC_CATEGORIES, drugClassLabel, computeStats, findAlternatives, matchOcrText } from './data.js'


const D = {
  primary: '#34D399',
  primaryDark: '#10B981',
  secondary: '#22D3EE',
  accent: '#FB923C',
  bg: '#020617',
  card: '#0F172A',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#1E293B',
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#4ADE80',
  staffBg: '#1E293B'
}

const C = {
  primary: '#0E9F6E',
  primaryDark: '#057A55',
  secondary: '#06B6D4',
  accent: '#F97316',
  bg: '#F0FDF4',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#D1FAE5',
  danger: '#DC2626',
  warning: '#F59E0B',
  success: '#16A34A',
  staffBg: '#FFFBEB'
}

const LANG = {
  en:{
    appName:'RxNorm Taiwan',
    scan:'Scan Drugs',
    search:'Search Drugs',
    meds:'My Drugs',
    settings:'Settings',
    interact:'Drugs Interaction',
    admin:'Admin Panel',
    signIn:'Sign In',
    signOut:'Sign Out',
    signedInAs:'Signed in as',
    notSignedIn:'Not signed in',
    signOutTitle:'Sign out?',
    signOutMessage:'Are you sure you want to sign out from this account?',
    cancel:'Cancel',
    userProfile:'User Profile',
    userProfileDesc:'View and manage signed-in user information',
    scanHistory:'Scan History',
    scanHistoryDesc:'View previous prescription scan records',
    mode:'Mode',
    modeDesc:'Switch between light and dark appearance',
    language:'Language',
    languageDesc:'Change application language',
    managePrefs:'Manage your app preferences.',
    light:'Light',
    dark:'Dark',
    open:'Open'
  },

  zhTW:{
    appName:'RxNorm Taiwan',
    scan:'掃描處方',
    search:'搜尋藥物',
    meds:'我的藥物',
    settings:'設定',
    interact:'藥物交互作用',
    admin:'管理面板',
    signIn:'登入',
    signOut:'登出',
    signedInAs:'已登入為',
    notSignedIn:'尚未登入',
    signOutTitle:'要登出嗎？',
    signOutMessage:'你確定要登出目前帳號嗎？',
    cancel:'取消',
    userProfile:'使用者資料',
    userProfileDesc:'查看與管理已登入的使用者資訊',
    scanHistory:'掃描紀錄',
    scanHistoryDesc:'查看之前的處方掃描紀錄',
    mode:'模式',
    modeDesc:'切換淺色與深色外觀',
    language:'語言',
    languageDesc:'更改應用程式語言',
    managePrefs:'管理你的應用程式偏好設定。',
    light:'淺色',
    dark:'深色',
    open:'開啟'
  }
}

function dosageFormEN(form){
  const map = {
    '膜衣錠': 'Film-coated tablet',
    '錠劑': 'Tablet',
    '膠囊': 'Capsule',
    '軟膠囊': 'Soft capsule',
    '口服液': 'Oral solution',
    '懸浮液': 'Suspension',
    '注射液': 'Injection',
    '注射劑': 'Injection',
    '乳膏': 'Cream',
    '軟膏': 'Ointment',
    '貼片': 'Patch',
    '粉劑': 'Powder',
    '顆粒劑': 'Granules',
    '糖漿': 'Syrup'
  }

  return map[form] || form
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
function Card({children,style,onClick}){
  return(
    <div
      onClick={onClick}
      style={{
        background:'var(--card)',
        color:'var(--text)',
        borderRadius:12,
        border:'1px solid var(--border)',
        padding:16,
        ...style
      }}
    >
      {children}
    </div>
  )
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
  const [u,setU]=useState('')
  const [p,setP]=useState('')
  const [loading,setLoading]=useState(false)
  const [remember,setRemember]=useState(true)

  function submit(e){
    e.preventDefault()
    setLoading(true)

    setTimeout(()=>{
      const ok=login(u,p)
      setLoading(false)
      if(ok) onClose()
    },400)
  }

  return(
    <div
      style={{
        position:'fixed',
        inset:0,
        background:'linear-gradient(135deg,rgba(14,159,110,.72),rgba(6,182,212,.72))',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        zIndex:1000,
        padding:18
      }}
      onClick={e=>{
        if(e.target===e.currentTarget){
          setError('')
          onClose()
        }
      }}
    >
      <div style={{
        width:'100%',
        maxWidth:330,
        background:'#fff',
        borderRadius:24,
        padding:'34px 24px 28px',
        boxShadow:'0 28px 70px rgba(15,23,42,.28)',
        position:'relative'
      }}>
        <button
          onClick={()=>{
            setError('')
            onClose()
          }}
          style={{
            position:'absolute',
            top:14,
            right:16,
            border:'none',
            background:'transparent',
            color:'#94A3B8',
            fontSize:22,
            cursor:'pointer'
          }}
        >
          ×
        </button>

        <div style={{
          textAlign:'center',
          fontSize:28,
          fontWeight:900,
          color:'#475569',
          marginBottom:28
        }}>
          Login
        </div>

        <form onSubmit={submit}>
          <div style={loginInputWrapStyle}>
            <span style={loginIconStyle}>👤</span>
            <input
              value={u}
              autoFocus
              onChange={e=>setU(e.target.value)}
              placeholder="Username"
              style={loginInputStyle}
            />
          </div>

          <div style={loginInputWrapStyle}>
            <span style={loginIconStyle}>🔒</span>
            <input
              type="password"
              value={p}
              onChange={e=>setP(e.target.value)}
              placeholder="Password"
              style={loginInputStyle}
            />
          </div>

          <label style={{
            display:'flex',
            alignItems:'center',
            gap:8,
            fontSize:12,
            color:'#94A3B8',
            margin:'10px 2px 18px',
            cursor:'pointer'
          }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={e=>setRemember(e.target.checked)}
              style={{accentColor:'#0E9F6E'}}
            />
            Remember me
          </label>

          {error && (
            <div style={{
              color:'#DC2626',
              fontSize:12,
              marginBottom:12,
              textAlign:'center',
              fontWeight:700
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width:'100%',
              padding:'13px',
              borderRadius:999,
              border:'none',
              background:loading
                ? '#94A3B8'
                : 'linear-gradient(135deg,#0E9F6E,#06B6D4)',
              color:'#fff',
              fontSize:15,
              fontWeight:900,
              letterSpacing:.4,
              cursor:loading?'not-allowed':'pointer',
              boxShadow:'0 12px 24px rgba(14,159,110,.22)'
            }}
          >
            {loading?'SIGNING IN...':'LOG IN'}
          </button>

          <div style={{
            textAlign:'center',
            fontSize:12,
            color:'#94A3B8',
            marginTop:14
          }}>
            Forget Password
          </div>
        </form>

        <div style={{
          marginTop:34,
          padding:12,
          borderRadius:16,
          background:'#F8FAFC',
          fontSize:11,
          color:'#64748B',
          lineHeight:1.65
        }}>
          <div style={{fontWeight:800,color:'#334155',marginBottom:4}}>
            Demo accounts
          </div>
          <div>admin / admin123</div>
          <div>staff / staff123</div>
          <div>doctor / doctor123</div>
        </div>

        <div style={{
          marginTop:18,
          textAlign:'center',
          fontSize:12,
          color:'#94A3B8'
        }}>
          Not a member? 
          <span 
            onClick={()=>{
              onClose()
              window.dispatchEvent(new Event('open-signup'))
            }}
            style={{color:'#0E9F6E',fontWeight:700,cursor:'pointer'}}
          >
            Sign up now
          </span>
        </div>
      </div>
    </div>
  )
}


function SignupModal({onClose}){
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [done,setDone]=useState(false)

  function submit(e){
    e.preventDefault()

    if(password!==confirm){
      alert('Passwords do not match')
      return
    }

    setDone(true)
  }

  return(
    <div style={{
      position:'fixed',
      inset:0,
      background:'linear-gradient(135deg,rgba(14,159,110,.72),rgba(6,182,212,.72))',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      zIndex:1000,
      padding:18
    }}>
      <div style={{
        width:'100%',
        maxWidth:340,
        background:'#fff',
        borderRadius:24,
        padding:'34px 24px 28px',
        boxShadow:'0 28px 70px rgba(15,23,42,.28)',
        position:'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position:'absolute',
            top:14,
            right:16,
            border:'none',
            background:'transparent',
            color:'#94A3B8',
            fontSize:22,
            cursor:'pointer'
          }}
        >
          ×
        </button>

        <div style={{
          textAlign:'center',
          fontSize:28,
          fontWeight:900,
          color:'#475569',
          marginBottom:24
        }}>
          Sign Up
        </div>

        {done ? (
          <div style={{textAlign:'center',padding:'16px 0'}}>
            <div style={{fontSize:44,marginBottom:12}}>✅</div>
            <div style={{fontWeight:900,fontSize:18,color:'#0F172A'}}>
              Account created
            </div>
            <div style={{fontSize:13,color:'#64748B',marginTop:8,lineHeight:1.5}}>
              This is a frontend demo. Connect backend/auth later for real signup.
            </div>

            <button
              onClick={onClose}
              style={{
                width:'100%',
                marginTop:22,
                padding:'13px',
                borderRadius:999,
                border:'none',
                background:'linear-gradient(135deg,#0E9F6E,#06B6D4)',
                color:'#fff',
                fontSize:15,
                fontWeight:900,
                cursor:'pointer'
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
                onChange={e=>setName(e.target.value)}
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
                onChange={e=>setEmail(e.target.value)}
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
                onChange={e=>setPassword(e.target.value)}
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
                onChange={e=>setConfirm(e.target.value)}
                placeholder="Confirm password"
                required
                style={loginInputStyle}
              />
            </div>

            <button
              type="submit"
              style={{
                width:'100%',
                padding:'13px',
                borderRadius:999,
                border:'none',
                background:'linear-gradient(135deg,#0E9F6E,#06B6D4)',
                color:'#fff',
                fontSize:15,
                fontWeight:900,
                cursor:'pointer',
                boxShadow:'0 12px 24px rgba(14,159,110,.22)'
              }}
            >
              CREATE ACCOUNT
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const loginInputWrapStyle = {
  width:'100%',
  height:44,
  borderRadius:999,
  background:'#F1F5F9',
  display:'flex',
  alignItems:'center',
  gap:10,
  padding:'0 15px',
  marginBottom:14,
  border:'1px solid #E2E8F0'
}

const loginIconStyle = {
  fontSize:15,
  color:'#94A3B8',
  width:18,
  textAlign:'center',
  opacity:.8
}

const loginInputStyle = {
  flex:1,
  border:'none',
  outline:'none',
  background:'transparent',
  fontSize:14,
  color:'#0F172A',
  fontFamily:'inherit'
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
function DrugSearch({addToMyDrugs}){
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
          placeholder="Search..."
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
              ['NHI Code', selected.id],
              ['ATC Code', selected.atc],
              ['Brand Name', selected.nameEN],
              ['Chinese Name', selected.nameZH],
              ['Dosage Form', dosageFormEN(selected.form)],
              ['Dosage', selected.strength],
              isStaff ? ['NHI Price (NT$)', `NT$ ${selected.price}`] : null,
              ['Manufacturer', selected.manufacturer],
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
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button onClick={()=>{setSelected(null);setQuery('')}}
              style={{flex:'1 1 120px',padding:'10px',borderRadius:8,border:`1px solid ${C.border}`,
                background:'#f8fafc',fontSize:13,fontWeight:600,cursor:'pointer',color:C.text}}>← Scan Again</button>
            <button onClick={()=>addToMyDrugs && addToMyDrugs(selected)}
              style={{flex:'1 1 150px',padding:'10px',borderRadius:8,border:'none',
                background:C.primary,fontSize:13,fontWeight:700,cursor:'pointer',color:'#fff'}}>+ Add to My Drugs</button>
            <button onClick={()=>setReportDrug(selected)}
              style={{flex:'1 1 120px',padding:'10px',borderRadius:8,border:`1px solid ${C.danger}44`,
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

// ── Canvas Image Preprocessing (Grayscale + Otsu Binarization + Upscale) ──
async function preprocessForOCR(file, mode='standard') {
  return new Promise(resolve => {
    const img = new Image()
    img.onerror = () => resolve(file)

    img.onload = () => {
      try {
        const scale = Math.min(4, Math.max(1.5, 2600 / Math.max(img.width, img.height)))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#fff'
        ctx.fillRect(0,0,w,h)
        ctx.drawImage(img,0,0,w,h)

        const imgData = ctx.getImageData(0,0,w,h)
        const d = imgData.data
        const n = w*h

        const gray = new Uint8Array(n)

        for(let i=0;i<n;i++){
          let r=d[i*4]
          let g=d[i*4+1]
          let b=d[i*4+2]

          let v=Math.round(0.299*r + 0.587*g + 0.114*b)

          if(mode==='contrast'){
            v = Math.min(255, Math.max(0, (v - 128) * 1.45 + 128))
          }

          if(mode==='darkText'){
            v = Math.min(255, Math.max(0, (v - 115) * 1.7 + 115))
          }

          gray[i]=v
        }

        const hist = new Int32Array(256)
        for(let i=0;i<n;i++) hist[gray[i]]++

        let sum=0
        for(let i=0;i<256;i++) sum += i*hist[i]

        let sumB=0
        let wB=0
        let varMax=0
        let threshold=128

        for(let t=0;t<256;t++){
          wB += hist[t]
          if(!wB || wB===n) continue

          const wF=n-wB
          sumB += t*hist[t]

          const mB=sumB/wB
          const mF=(sum-sumB)/wF
          const variance=wB*wF*(mB-mF)**2

          if(variance>varMax){
            varMax=variance
            threshold=t
          }
        }

        if(mode==='darkText') threshold += 12
        if(mode==='contrast') threshold -= 5

        for(let i=0;i<n;i++){
          let v = gray[i] <= threshold ? 0 : 255

          d[i*4]=v
          d[i*4+1]=v
          d[i*4+2]=v
          d[i*4+3]=255
        }

        ctx.putImageData(imgData,0,0)

        canvas.toBlob(blob=>{
          resolve(blob || file)
        },'image/png')

      }catch{
        resolve(file)
      }
    }

    img.src = URL.createObjectURL(file)
  })
}
// ── OCR Hook (real Tesseract.js + demo mode) ──────────────────────────────
function useOCR() {
  const [stage,setStage]=useState('idle')   // idle|preprocessing|loading|recognizing|matching|done|error
  const [progress,setProgress]=useState(0)
  const [ocrStatus,setOcrStatus]=useState('')
  const [result,setResult]=useState(null)
  const [previewUrl,setPreviewUrl]=useState(null)
  const [ocrError,setOcrError]=useState(null)

  async function recognize(imageFile) {
  const url=URL.createObjectURL(imageFile)
  setPreviewUrl(url)
  setStage('preprocessing')
  setProgress(0)
  setOcrError(null)
  setResult(null)

  try {
    const {createWorker}=await import('tesseract.js')

    setStage('loading')

    const worker=await createWorker(['eng','chi_tra'],1,{
      logger:m=>{
        if(m.status==='recognizing text'){
          setStage('recognizing')
          setProgress(Math.round(m.progress*100))
        }else{
          setOcrStatus(m.status||'')
        }
      }
    })

      await worker.setParameters({
        tessedit_pageseg_mode: '6',
        preserve_interword_spaces: '1',
      })

      const modes=['standard','contrast','darkText']
      const texts=[]

      for(const mode of modes){
        setStage('preprocessing')
        const processedBlob=await preprocessForOCR(imageFile,mode)
        const processedUrl=URL.createObjectURL(processedBlob)

        setStage('recognizing')
        const {data:{text}}=await worker.recognize(processedUrl)

        if(text && text.trim()){
          texts.push(text.trim())
        }

        URL.revokeObjectURL(processedUrl)
      }

      await worker.terminate()

      setStage('matching')

      const mergedText=[...new Set(texts)]
        .join('\n\n--- OCR PASS ---\n\n')

      const cleanedText=cleanOCRText(mergedText)
      const matched=matchOcrText(cleanedText)

      setResult({
        rawText:cleanedText,
        matched
      })

      setStage('done')

    }catch(e){
      console.error(e)
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

function cleanOCRText(text){
  if(!text) return ''

  return text
    .replace(/[|]/g,'I')
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .replace(/\s+/g,' ')
    .replace(/([A-Za-z])\s+([A-Za-z])/g,'$1 $2')
    .replace(/(\d)\s+mg/gi,'$1mg')
    .replace(/(\d)\s+mcg/gi,'$1mcg')
    .replace(/(\d)\s+ml/gi,'$1ml')
    .replace(/tabiet/gi,'tablet')
    .replace(/capsuie/gi,'capsule')
    .replace(/ibuproten/gi,'ibuprofen')
    .replace(/warfarln/gi,'warfarin')
    .trim()
}

// ── Scan Rx ────────────────────────────────────────────────────────────────
function ScanRx({addToMyDrugs}){
  const ocr=useOCR()
  const [added,setAdded]=useState(new Set())
  const [reportDrug,setReportDrug]=useState(null)
  const [cameraOpen,setCameraOpen]=useState(false)

  const fileRef=useRef()
  const videoRef=useRef(null)
  const canvasRef=useRef(null)
  const streamRef=useRef(null)

  const {isStaff}=useAuth()
  const cc=s=>s>=LOW_CONF?C.success:s>=0.55?C.warning:C.danger

  function handleFile(e){
    const file=e.target.files?.[0]
    if(file) ocr.recognize(file)
    e.target.value=''
  }

  async function openCamera(){
    try{
      if(!navigator.mediaDevices?.getUserMedia){
        alert('Camera is not supported in this browser.')
        return
      }

      const stream=await navigator.mediaDevices.getUserMedia({
        video:{
          facingMode:{ ideal:'environment' }
        },
        audio:false
      })

      streamRef.current=stream
      setCameraOpen(true)

      setTimeout(()=>{
        if(videoRef.current){
          videoRef.current.srcObject=stream
          videoRef.current.play()
        }
      },100)
    }catch(err){
      console.error(err)
      alert('Camera cannot be opened. Please allow camera permission in browser.')
    }
  }

  function closeCamera(){
    if(streamRef.current){
      streamRef.current.getTracks().forEach(track=>track.stop())
      streamRef.current=null
    }
    setCameraOpen(false)
  }

  function takePhoto(){
    const video=videoRef.current
    const canvas=canvasRef.current

    if(!video || !canvas) return

    canvas.width=video.videoWidth
    canvas.height=video.videoHeight

    const ctx=canvas.getContext('2d')
    ctx.drawImage(video,0,0,canvas.width,canvas.height)

    canvas.toBlob(blob=>{
      if(!blob) return

      const file=new File([blob],'camera-photo.jpg',{type:'image/jpeg'})
      closeCamera()
      ocr.recognize(file)
    },'image/jpeg',0.95)
  }

  function addMed(drug){
    setAdded(p=>new Set([...p,drug.id]))

    if(addToMyDrugs){
      addToMyDrugs(drug)
    }

    addHist({
      type:'scan',
      query:drug.nameEN,
      result:drug.ingredient,
      score:0.95
    })
  }

  if(ocr.stage==='idle') return(
    <Card>
      {reportDrug&&<ReportModal drug={reportDrug} onClose={()=>setReportDrug(null)}/>}

      <div style={{textAlign:'center',padding:'30px 0'}}>
        <div style={{
          width:74,
          height:74,
          borderRadius:'50%',
          background:'linear-gradient(135deg,#0E9F6E,#06B6D4)',
          color:'#fff',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          fontSize:42,
          fontWeight:900,
          margin:'0 auto 16px',
          boxShadow:'0 14px 28px rgba(14,159,110,.24)'
        }}>
          +
        </div>

        <div style={{
          fontWeight:800,
          fontSize:21,
          marginBottom:8,
          color:C.text
        }}>
          Upload Image
        </div>

        <div style={{
          fontSize:13,
          color:C.muted,
          marginBottom:24,
          lineHeight:1.6
        }}>
          Upload image or take a photo using your laptop camera.<br/>
          OCR will extract drug names from the image.
        </div>

        <button
          onClick={()=>fileRef.current.click()}
          style={{
            width:'100%',
            maxWidth:280,
            padding:'14px 22px',
            background:'linear-gradient(135deg,#0E9F6E,#06B6D4)',
            color:'#fff',
            border:'none',
            borderRadius:16,
            fontSize:15,
            fontWeight:800,
            cursor:'pointer',
            boxShadow:'0 12px 24px rgba(14,159,110,.20)',
            marginBottom:12
          }}
        >
          + Upload Image
        </button>

        <button
          onClick={openCamera}
          style={{
            width:'100%',
            maxWidth:280,
            padding:'13px 22px',
            background:'#ffffff',
            color:C.primary,
            border:`1px solid ${C.primary}`,
            borderRadius:16,
            fontSize:14,
            fontWeight:800,
            cursor:'pointer',
            marginBottom:12
          }}
        >
          📷 Take Photo
        </button>

        <button
          onClick={ocr.runDemo}
          style={{
            width:'100%',
            maxWidth:280,
            padding:'13px 22px',
            background:'#f8fafc',
            color:C.text,
            border:`1px solid ${C.border}`,
            borderRadius:16,
            fontSize:14,
            fontWeight:700,
            cursor:'pointer'
          }}
        >
          🧪 Demo Prescription
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{display:'none'}}
          onChange={handleFile}
        />

        <div style={{marginTop:16,fontSize:11,color:C.muted}}>
          Supports JPG · PNG · WEBP · HEIC
        </div>
      </div>

      {cameraOpen && (
        <div style={{
          position:'fixed',
          inset:0,
          background:'rgba(15,23,42,.72)',
          zIndex:999,
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          padding:16
        }}>
          <div style={{
            width:'100%',
            maxWidth:520,
            background:'#fff',
            borderRadius:24,
            padding:16,
            boxShadow:'0 24px 60px rgba(0,0,0,.28)'
          }}>
            <div style={{
              display:'flex',
              justifyContent:'space-between',
              alignItems:'center',
              marginBottom:12
            }}>
              <div style={{
                fontSize:17,
                fontWeight:800,
                color:C.text
              }}>
                Take Prescription Photo
              </div>

              <button
                onClick={closeCamera}
                style={{
                  border:'none',
                  background:'#f1f5f9',
                  borderRadius:12,
                  padding:'8px 12px',
                  cursor:'pointer',
                  fontWeight:700
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
                width:'100%',
                borderRadius:18,
                background:'#000',
                maxHeight:420,
                objectFit:'cover'
              }}
            />

            <canvas ref={canvasRef} style={{display:'none'}} />

            <button
              onClick={takePhoto}
              style={{
                width:'100%',
                marginTop:14,
                padding:'14px 16px',
                border:'none',
                borderRadius:16,
                background:'linear-gradient(135deg,#0E9F6E,#06B6D4)',
                color:'#fff',
                fontSize:15,
                fontWeight:900,
                cursor:'pointer'
              }}
            >
              Capture & Run OCR
            </button>
          </div>
        </div>
      )}
    </Card>
  )

  if(['preprocessing','loading','recognizing','matching'].includes(ocr.stage)) return(
    <Card style={{textAlign:'center',padding:44}}>
      <div style={{fontSize:48,marginBottom:14}}>
        {ocr.stage==='matching'?'🔍':ocr.stage==='recognizing'?'🔤':ocr.stage==='preprocessing'?'🖼️':'⚙️'}
      </div>

      <div style={{fontWeight:700,fontSize:16,marginBottom:12}}>
        {ocr.stage==='matching'?'Matching against NHI drug database...':
         ocr.stage==='recognizing'?'Extracting text from image...':
         ocr.stage==='preprocessing'?'Enhancing image quality...':
         'Initializing OCR engine...'}
      </div>

      <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {[
          ['preprocessing','🖼️ Pre-process'],
          ['loading','⚙️ Init OCR'],
          ['recognizing','🔤 Read text'],
          ['matching','🔍 Match drugs'],
        ].map(([s,label])=>{
          const stages=['preprocessing','loading','recognizing','matching']
          const idx=stages.indexOf(ocr.stage)
          const thisIdx=stages.indexOf(s)
          const done=thisIdx<idx
          const active=thisIdx===idx

          return(
            <span key={s} style={{
              fontSize:11,
              fontWeight:600,
              padding:'3px 9px',
              borderRadius:20,
              background:done?'#dcfce7':active?C.primary+'18':'#f1f5f9',
              color:done?'#166534':active?C.primary:C.muted,
              border:`1px solid ${done?'#86efac':active?C.primary+'44':C.border}`
            }}>
              {done?'✓ ':''}{label}
            </span>
          )
        })}
      </div>

      {ocr.stage==='loading'&&(
        <div style={{fontSize:13,color:C.muted,marginBottom:8}}>
          {ocr.ocrStatus||'Loading Tesseract engine and language data...'}
        </div>
      )}

      {ocr.stage==='recognizing'&&(
        <>
          <div style={{
            background:'#e2e8f0',
            borderRadius:20,
            height:10,
            overflow:'hidden',
            marginBottom:8
          }}>
            <div style={{
              height:'100%',
              borderRadius:20,
              background:C.primary,
              width:`${ocr.progress}%`,
              transition:'width 0.1s ease'
            }}/>
          </div>

          <div style={{fontSize:13,color:C.muted,marginBottom:8}}>
            {ocr.progress}%
          </div>
        </>
      )}

      {ocr.previewUrl&&(
        <img
          src={ocr.previewUrl}
          alt="preview"
          style={{
            maxHeight:100,
            maxWidth:'100%',
            borderRadius:8,
            opacity:.65,
            marginTop:8
          }}
        />
      )}
    </Card>
  )

  if(ocr.stage==='error') return(
    <Card>
      <div style={{textAlign:'center',padding:'28px 0'}}>
        <div style={{fontSize:48,marginBottom:12}}>❌</div>

        <div style={{
          fontWeight:700,
          fontSize:16,
          color:C.danger,
          marginBottom:8
        }}>
          OCR Failed
        </div>

        <div style={{
          fontSize:13,
          color:C.muted,
          marginBottom:20,
          maxWidth:320,
          margin:'0 auto 20px'
        }}>
          {ocr.ocrError}
        </div>

        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button
            onClick={ocr.reset}
            style={{
              padding:'10px 20px',
              background:'#f1f5f9',
              color:C.text,
              border:`1px solid ${C.border}`,
              borderRadius:8,
              fontSize:13,
              fontWeight:600,
              cursor:'pointer'
            }}
          >
            Try Again
          </button>

          <button
            onClick={ocr.runDemo}
            style={{
              padding:'10px 20px',
              background:C.primary,
              color:'#fff',
              border:'none',
              borderRadius:8,
              fontSize:13,
              fontWeight:600,
              cursor:'pointer'
            }}
          >
            🧪 Use Demo
          </button>
        </div>
      </div>
    </Card>
  )

  const {rawText,matched}=ocr.result
  const highConf=matched.filter(m=>m.confidence>=LOW_CONF)
  const lowConf=matched.filter(m=>m.confidence<LOW_CONF)

  function DrugResultCard({drug,confidence}){
    return(
      <Card>
        <LowConfWarning score={confidence} name={drug.nameEN}/>

        <div style={{
          display:'flex',
          justifyContent:'space-between',
          alignItems:'flex-start'
        }}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{
              display:'flex',
              alignItems:'center',
              gap:8,
              marginBottom:4,
              flexWrap:'wrap'
            }}>
              <span style={{fontWeight:700,fontSize:16}}>
                {drug.ingredient}
              </span>

              <DrugClassBadge raw={drug.drugClass}/>

              <span style={{
                fontSize:11,
                padding:'2px 8px',
                borderRadius:12,
                background:cc(confidence)+'22',
                color:cc(confidence),
                fontWeight:600
              }}>
                {Math.round(confidence*100)}% confidence
              </span>
            </div>

            <div style={{fontSize:13,color:C.muted}}>
              {drug.nameEN} · {drug.nameZH}
            </div>

            <div style={{
              fontSize:12,
              color:C.muted,
              marginTop:4
            }}>
              {drug.id} · ATC: {drug.atc} · {dosageFormEN(drug.form)} {drug.strength}
              {isStaff&&` · NT$ ${drug.price}`}
            </div>
          </div>

          <div style={{
            display:'flex',
            flexDirection:'column',
            gap:6,
            marginLeft:12,
            flexShrink:0
          }}>
            <button
              onClick={()=>addMed(drug)}
              disabled={added.has(drug.id)}
              style={{
                padding:'7px 12px',
                borderRadius:8,
                fontSize:13,
                fontWeight:600,
                border:'none',
                cursor:added.has(drug.id)?'default':'pointer',
                background:added.has(drug.id)?'#e8f5e9':C.primary,
                color:added.has(drug.id)?C.success:'#fff'
              }}
            >
              {added.has(drug.id)?'✓ Added':'+ Add'}
            </button>

            <button
              onClick={()=>setReportDrug(drug)}
              style={{
                padding:'7px 12px',
                borderRadius:8,
                fontSize:12,
                fontWeight:500,
                border:`1px solid ${C.danger}44`,
                background:'#fff5f5',
                color:C.danger,
                cursor:'pointer'
              }}
            >
              ⚠ Error
            </button>
          </div>
        </div>
      </Card>
    )
  }

  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {reportDrug&&<ReportModal drug={reportDrug} onClose={()=>setReportDrug(null)}/>}

      <Card style={{
        background:matched.length>0?'#f0fdf4':'#fffbeb',
        border:`1px solid ${matched.length>0?C.success:'#fbbf24'}`
      }}>
        <div style={{
          display:'flex',
          justifyContent:'space-between',
          alignItems:'flex-start',
          gap:12
        }}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{
              fontWeight:600,
              fontSize:14,
              color:matched.length>0?'#166534':'#92400e',
              marginBottom:6
            }}>
              {matched.length>0
                ? `✅ OCR Complete — ${matched.length} drug${matched.length!==1?'s':''} identified (${highConf.length} high confidence)`
                : '⚠️ OCR Complete — no drugs identified in database'}
            </div>

            <div style={{
              fontSize:11,
              color:C.muted,
              fontFamily:'monospace',
              whiteSpace:'pre-wrap',
              maxHeight:68,
              overflowY:'auto',
              background:'rgba(255,255,255,.7)',
              padding:'6px 8px',
              borderRadius:6,
              lineHeight:1.5
            }}>
              {rawText||'(no text extracted — image may be too dark or blurry)'}
            </div>
          </div>

          {ocr.previewUrl&&(
            <img
              src={ocr.previewUrl}
              alt="scan"
              style={{
                maxHeight:76,
                maxWidth:86,
                borderRadius:6,
                objectFit:'cover',
                flexShrink:0
              }}
            />
          )}
        </div>
      </Card>

      {matched.length===0&&(
        <Card style={{textAlign:'center',padding:32,color:C.muted}}>
          <div style={{fontSize:36,marginBottom:8}}>🤔</div>

          <div style={{fontWeight:600,marginBottom:6}}>
            No drugs matched in NHI database
          </div>

          <div style={{fontSize:13,marginBottom:16}}>
            OCR couldn't find recognizable drug names. Try a clearer photo,
            <br/>
            or search manually in the 🔍 Drug Search tab.
          </div>

          <button
            onClick={ocr.runDemo}
            style={{
              padding:'8px 18px',
              background:C.primary,
              color:'#fff',
              border:'none',
              borderRadius:8,
              fontSize:13,
              fontWeight:600,
              cursor:'pointer'
            }}
          >
            🧪 Try Demo Prescription
          </button>
        </Card>
      )}

      {highConf.length>0&&(
        <>
          <div style={{fontWeight:700,fontSize:15,color:'#166534'}}>
            ✅ High Confidence ({highConf.length})
          </div>

          {highConf.map(m=><DrugResultCard key={m.drug.id} {...m}/>)}
        </>
      )}

      {lowConf.length>0&&(
        <>
          <div style={{
            fontWeight:700,
            fontSize:14,
            color:C.warning,
            marginTop:4
          }}>
            ⚠️ Possible Matches — verify before adding ({lowConf.length})
          </div>

          <div style={{
            fontSize:12,
            color:C.muted,
            marginTop:-6
          }}>
            These were partially matched from OCR text. Check name and dosage carefully.
          </div>

          {lowConf.map(m=><DrugResultCard key={m.drug.id} {...m}/>)}
        </>
      )}

      {added.size>0&&(
        <Card style={{
          background:'#f0fdf4',
          border:`1px solid ${C.success}`,
          textAlign:'center'
        }}>
          <div style={{fontWeight:600,color:'#166534'}}>
            {added.size} drug{added.size>1?'s':''} added to My Medications ✓
          </div>
        </Card>
      )}

      <button
        onClick={()=>{ocr.reset();setAdded(new Set())}}
        style={{
          padding:'12px',
          borderRadius:10,
          border:`1px solid ${C.border}`,
          background:'#f8fafc',
          fontSize:14,
          fontWeight:600,
          cursor:'pointer',
          color:C.text
        }}
      >
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
function MyMeds({meds,setMeds}){
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
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{dosageFormEN(med.form)} · {med.strength}</div>
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
function ScanHistory({myDrugs,setMyDrugs,addToMyDrugs}){
  const {isStaff}=useAuth()
  const [tick,setTick]=useState(0)
  const h=HISTORY
  const fmt=iso=>{ try{return new Date(iso).toLocaleString()}catch{return iso} }
  const cc=s=>s>=LOW_CONF?C.success:s>=0.55?C.warning:C.danger

  function addHistoryDrugToMyDrugs(record){
    const drug = DRUGS.find(d =>
      d.nameEN===record.query ||
      d.ingredient===record.result ||
      d.id===record.query
    )

    if(!drug) return

    if(addToMyDrugs){
      addToMyDrugs(drug)
      return
    }

    if(setMyDrugs){
      setMyDrugs(prev=>{
        if(prev.some(m=>m.id===drug.id)) return prev
        return [
          ...prev,
          {...drug,times:['09:00'],reminderOn:true}
        ]
      })
    }
  }
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
                  <button
                    onClick={()=>addHistoryDrugToMyDrugs(r)}
                    style={{
                      marginTop:8,
                      padding:'7px 12px',
                      borderRadius:10,
                      border:'none',
                      background:C.primary,
                      color:'#fff',
                      fontSize:12,
                      fontWeight:700,
                      cursor:'pointer'
                    }}
                  >
                    + Add to My Drugs
                  </button>
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

function SettingsPage({
  darkMode,
  setDarkMode,
  language,
  setLanguage,
  T,
  myDrugs,
  setMyDrugs,
  addToMyDrugs
}){
  const {isAdmin,isStaff}=useAuth()
  const isSignedIn = isAdmin || isStaff
  const theme = darkMode ? D : C
  const [settingsSubPage,setSettingsSubPage]=useState('main')

  if(settingsSubPage==='profile'){
    return(
      <SettingsSubLayout
        title="User Profile"
        theme={theme}
        onBack={()=>setSettingsSubPage('main')}
      >
        <UserProfilePage darkMode={darkMode}/>
      </SettingsSubLayout>
    )
  }

  if(settingsSubPage==='history'){
    return(
      <SettingsSubLayout
        title="Scan History"
        theme={theme}
        onBack={()=>setSettingsSubPage('main')}
      >
        <ScanHistory myDrugs={myDrugs} setMyDrugs={setMyDrugs} addToMyDrugs={addToMyDrugs}/>
      </SettingsSubLayout>
    )
  }

  if(settingsSubPage==='myDrugs'){
    return(
      <SettingsSubLayout
        title="My Drugs"
        theme={theme}
        onBack={()=>setSettingsSubPage('main')}
      >
        <MyMeds meds={myDrugs} setMeds={setMyDrugs}/>
      </SettingsSubLayout>
    )
  }

  return(
    <div style={{
      color:theme.text,
      background:theme.card,
      minHeight:'calc(100vh - 230px)'
    }}>
      <div style={{fontSize:22,fontWeight:800,marginBottom:8,color:theme.text}}>
        {T.settings}
      </div>

      <div style={{color:theme.muted,fontSize:14,marginBottom:24}}>
        Manage profile, scan history, drugs, and app preferences.
      </div>

      <div style={{display:'grid',gap:14}}>
        {isSignedIn && (
          <>
            <SettingsMenuItem
              darkMode={darkMode}
              title="User Profile"
              desc="View and manage signed-in user information"
              onClick={()=>setSettingsSubPage('profile')}
            />

            <SettingsMenuItem
              darkMode={darkMode}
              title="Scan History"
              desc="View prescription scan records and add important drugs"
              onClick={()=>setSettingsSubPage('history')}
            />

            <SettingsMenuItem
              darkMode={darkMode}
              title="My Drugs"
              desc="Manage saved medications and reminders"
              onClick={()=>setSettingsSubPage('myDrugs')}
            />
          </>
        )}

        <div style={getSettingsCardStyle(darkMode)}>
          <div>
            <div style={getSettingsTitleStyle(darkMode)}>{T.mode}</div>
            <div style={getSettingsDescStyle(darkMode)}>{T.modeDesc}</div>
          </div>

          <button
            onClick={()=>setDarkMode(!darkMode)}
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
            onChange={(e)=>setLanguage(e.target.value)}
            style={{
              border:'none',
              background:'linear-gradient(135deg,#0E9F6E,#06B6D4)',
              color:'#fff',
              borderRadius:12,
              padding:'8px 12px',
              fontWeight:700,
              cursor:'pointer',
              outline:'none'
            }}
          >
            <option value="en">English</option>
            <option value="zhTW">繁體中文</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function getSettingsCardStyle(darkMode){
  return{
    background:darkMode ? D.card : C.card,
    border:`1px solid ${darkMode ? D.border : C.border}`,
    borderRadius:18,
    padding:'16px',
    display:'flex',
    alignItems:'center',
    justifyContent:'space-between',
    gap:12,
    boxShadow:darkMode
      ? '0 8px 22px rgba(0,0,0,.24)'
      : '0 6px 18px rgba(15,23,42,.05)'
  }
}

function getSettingsTitleStyle(darkMode){
  return{
    fontSize:15,
    fontWeight:700,
    color:darkMode ? D.text : C.text
  }
}

function getSettingsDescStyle(darkMode){
  return{
    fontSize:12,
    color:darkMode ? D.muted : C.muted,
    marginTop:4
  }
}

function getSettingsButtonStyle(){
  return{
    border:'none',
    background:'linear-gradient(135deg,#0E9F6E,#06B6D4)',
    color:'#fff',
    borderRadius:12,
    padding:'8px 14px',
    fontWeight:700,
    cursor:'pointer'
  }
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

function UserProfilePage({darkMode}){
  const {user,isAdmin,isStaff}=useAuth()
  const theme = darkMode ? D : C

  if(!user){
    return(
      <Card style={{textAlign:'center',padding:32}}>
        <div style={{fontSize:42,marginBottom:12}}>👤</div>
        <div style={{fontWeight:800,fontSize:18,marginBottom:6}}>
          Guest User
        </div>
        <div style={{fontSize:13,color:'var(--muted)'}}>
          Please sign in to view your profile.
        </div>
      </Card>
    )
  }

  return(
    <div style={{display:'grid',gap:14,color:theme.text}}>
      <div>
        <div style={{fontSize:22,fontWeight:900}}>User Profile</div>
        <div style={{fontSize:13,color:theme.muted,marginTop:4}}>
          Account information and access role.
        </div>
      </div>

      <Card style={{
        display:'flex',
        alignItems:'center',
        gap:14
      }}>
        <div style={{
          width:58,
          height:58,
          borderRadius:'50%',
          background:'linear-gradient(135deg,#0E9F6E,#06B6D4)',
          color:'#fff',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          fontSize:26,
          fontWeight:900
        }}>
          {user.name?.[0]?.toUpperCase() || 'U'}
        </div>

        <div>
          <div style={{fontSize:18,fontWeight:900}}>
            {user.name}
          </div>
          <div style={{fontSize:13,color:theme.muted}}>
            {isAdmin?'Administrator':isStaff?'Hospital Staff':'Guest'}
          </div>
        </div>
      </Card>

      <Card>
        <ProfileRow label="Username" value={user.username || '-'} />
        <ProfileRow label="Role" value={user.role || '-'} />
        <ProfileRow label="Access Level" value={isAdmin?'Full Access':isStaff?'Staff Access':'Guest Access'} />
        <ProfileRow label="Account Status" value="Active" />
      </Card>

      <Card>
        <div style={{fontSize:15,fontWeight:800,marginBottom:10}}>
          Permissions
        </div>

        <ProfilePermission active={true} text="Search drug database" />
        <ProfilePermission active={true} text="Scan prescription with OCR" />
        <ProfilePermission active={isStaff || isAdmin} text="View NHI price and staff data" />
        <ProfilePermission active={isStaff || isAdmin} text="Check drug interactions" />
        <ProfilePermission active={isAdmin} text="Access admin dashboard" />
      </Card>
    </div>
  )
}

function ProfileRow({label,value}){
  return(
    <div style={{
      display:'flex',
      justifyContent:'space-between',
      gap:12,
      padding:'11px 0',
      borderBottom:'1px solid var(--border)'
    }}>
      <div style={{fontSize:13,color:'var(--muted)'}}>{label}</div>
      <div style={{fontSize:13,fontWeight:800,color:'var(--text)',textAlign:'right'}}>
        {value}
      </div>
    </div>
  )
}

function ProfilePermission({active,text}){
  return(
    <div style={{
      display:'flex',
      alignItems:'center',
      gap:10,
      padding:'8px 0',
      fontSize:13,
      color:'var(--text)'
    }}>
      <span>{active?'✅':'🔒'}</span>
      <span style={{opacity:active?1:.55}}>{text}</span>
    </div>
  )
}

function SettingsMenuItem({darkMode,title,desc,onClick}){
  return(
    <div style={getSettingsCardStyle(darkMode)}>
      <div>
        <div style={getSettingsTitleStyle(darkMode)}>{title}</div>
        <div style={getSettingsDescStyle(darkMode)}>{desc}</div>
      </div>

      <button onClick={onClick} style={getSettingsButtonStyle()}>
        Open
      </button>
    </div>
  )
}

function SettingsSubLayout({title,theme,onBack,children}){
  return(
    <div style={{color:theme.text}}>
      <button
        onClick={onBack}
        style={{
          border:'none',
          background:'transparent',
          color:theme.primary,
          fontWeight:800,
          marginBottom:14,
          cursor:'pointer'
        }}
      >
        ← Back
      </button>

      <div style={{
        fontSize:22,
        fontWeight:900,
        marginBottom:16,
        color:theme.text
      }}>
        {title}
      </div>

      {children}
    </div>
  )
}

function AppInner(){
  const [tab,setTab]=useState('scan')
  const [showLogin,setShowLogin]=useState(false)
  const [showSignup,setShowSignup]=useState(false)
  const [showSignOutConfirm,setShowSignOutConfirm]=useState(false)
  const [nhiCount,setNhiCount]=useState(0)
  const [darkMode,setDarkMode]=useState(false)
  const [language,setLanguage]=useState('en')
  const [toast,setToast]=useState('')
  const [myDrugs,setMyDrugs]=useState([
    {...DRUGS[6],times:['09:00'],reminderOn:true},
    {...DRUGS[9],times:['08:00','12:00','18:00'],reminderOn:true},
    {...DRUGS[7],times:['08:00'],reminderOn:true},
  ])

  const {isAdmin,isStaff,logout}=useAuth()

  const theme = darkMode ? D : C
  const isSignedIn = isAdmin || isStaff
  const T = LANG[language]

  useEffect(()=>{
    loadNHIDrugs().then(n=>{
      if(n>0) setNhiCount(n)
    })
  },[])

  useEffect(()=>{
  const openSignup=()=>setShowSignup(true)
  window.addEventListener('open-signup',openSignup)
  return()=>window.removeEventListener('open-signup',openSignup)
  },[])


  const tabs=[
    {id:'search', icon:'🔍', title:T.search},
    {id:'scan', icon:'📷', title:T.scan},
    {id:'interact', icon:'⚠️', title:T.interact, minRole:'staff'},
    {id:'admin', icon:'🛠️', title:T.admin, minRole:'admin'},
    {id:'settings', icon:'⚙️', title:T.settings},
  ].filter(t=>{
    if(t.minRole==='admin') return isAdmin
    if(t.minRole==='staff') return isStaff
    return true
  })

  const pageTitle={
    scan:T.scan,
    search:T.search,
    meds:T.meds,
    settings:T.settings,
    interact:T.interact,
    admin:T.admin,
  }[tab]
  
  function addToMyDrugs(drug){
    let alreadyExists = false

    setMyDrugs(prev=>{
      if(prev.some(m=>m.id===drug.id)){
        alreadyExists = true
        return prev
      }

      return [
        ...prev,
        {
          ...drug,
          times:['09:00'],
          reminderOn:true
        }
      ]
    })

    setToast(
      alreadyExists
        ? 'Drug already exists in My Drugs'
        : 'Drug added to My Drugs'
    )

    setTimeout(()=>{
      setToast('')
    },2000)
  }


  return(
    <div style={{
      '--card':theme.card,
      '--text':theme.text,
      '--muted':theme.muted,
      '--border':theme.border,

      minHeight:'100vh',
      background:darkMode
        ? 'linear-gradient(180deg,#020617 0%,#0F172A 55%,#111827 100%)'
        : 'linear-gradient(180deg,#ECFDF5 0%,#F8FAFC 45%,#FFFFFF 100%)',
      paddingBottom:96,
      color:theme.text,
      transition:'all .2s ease'
    }}>

      <header style={{
        position:'sticky',
        top:0,
        zIndex:100,
        background:darkMode
          ? 'rgba(15,23,42,.88)'
          : 'rgba(255,255,255,.86)',
        backdropFilter:'blur(16px)',
        borderBottom:`1px solid ${theme.border}`,
        boxShadow:darkMode
          ? '0 4px 20px rgba(0,0,0,.22)'
          : '0 4px 20px rgba(15,23,42,.06)'
      }}>
        <div style={{
          maxWidth:520,
          margin:'0 auto',
          padding:'12px 16px',
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          gap:12
        }}>
          <div style={{
            display:'flex',
            alignItems:'center',
            gap:12,
            minWidth:0
          }}>
            <div style={{
              width:42,
              height:42,
              borderRadius:15,
              background:'linear-gradient(135deg,#0E9F6E,#06B6D4)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              color:'#fff',
              fontSize:20,
              boxShadow:'0 8px 20px rgba(6,182,212,.22)',
              flexShrink:0
            }}>
              💊
            </div>

            <div style={{minWidth:0}}>
              <div style={{
                fontSize:16,
                fontWeight:900,
                color:theme.text,
                whiteSpace:'nowrap'
              }}>
                {T.appName}
              </div>

              <div style={{
                fontSize:11,
                color:theme.primary,
                fontWeight:700,
                marginTop:3
              }}>
                {pageTitle}
              </div>
            </div>
          </div>

          <button
            onClick={()=>{
              if(isSignedIn){
                setShowSignOutConfirm(true)
              }else{
                setShowLogin(true)
              }
            }}
            style={{
              border:'none',
              background:'transparent',
              padding:0,
              display:'flex',
              alignItems:'center',
              gap:10,
              cursor:'pointer',
              textAlign:'right'
            }}
          >
            <div style={{lineHeight:1.15}}>
              <div style={{
                fontSize:14,
                fontWeight:800,
                color:theme.text
              }}>
                {isSignedIn ? T.signOut : T.signIn}
              </div>

              <div style={{
                fontSize:11,
                color:theme.muted,
                opacity:.68,
                marginTop:3
              }}>
                {isSignedIn
                  ? `${T.signedInAs} ${isAdmin?'Admin':'Staff'}`
                  : T.notSignedIn}
              </div>
            </div>
          </button>
        </div>
      </header>

      {showLogin && (
        <LoginModal onClose={()=>setShowLogin(false)}/>
      )}
      {showSignup && (
        <SignupModal onClose={()=>setShowSignup(false)} />
      )}

      {showSignOutConfirm && (
        <div style={{
          position:'fixed',
          inset:0,
          background:'rgba(0,0,0,.45)',
          zIndex:1000,
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          padding:16
        }}>
          <div style={{
            width:'100%',
            maxWidth:340,
            background:theme.card,
            border:`1px solid ${theme.border}`,
            borderRadius:22,
            padding:22,
            boxShadow:'0 24px 60px rgba(0,0,0,.28)',
            color:theme.text
          }}>
            <div style={{
              fontSize:18,
              fontWeight:900,
              marginBottom:8
            }}>
              {T.signOutTitle}
            </div>

            <div style={{
              fontSize:13,
              color:theme.muted,
              marginBottom:20,
              lineHeight:1.5
            }}>
              {T.signOutMessage}
            </div>

            <div style={{
              display:'flex',
              gap:10
            }}>
              <button
                onClick={()=>setShowSignOutConfirm(false)}
                style={{
                  flex:1,
                  padding:'11px 14px',
                  borderRadius:14,
                  border:`1px solid ${theme.border}`,
                  background:darkMode?'#1E293B':'#F8FAFC',
                  color:theme.text,
                  fontWeight:800,
                  cursor:'pointer'
                }}
              >
                {T.cancel}
              </button>

              <button
                onClick={()=>{
                  logout()
                  setShowSignOutConfirm(false)
                  setTab('scan')
                }}
                style={{
                  flex:1,
                  padding:'11px 14px',
                  borderRadius:14,
                  border:'none',
                  background:'#DC2626',
                  color:'#fff',
                  fontWeight:800,
                  cursor:'pointer'
                }}
              >
                {T.signOut}
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{
        maxWidth:520,
        margin:'0 auto',
        padding:'18px 14px 24px'
      }}>
        <section style={{
          background:theme.card,
          border:`1px solid ${theme.border}`,
          borderRadius:24,
          padding:16,
          boxShadow:darkMode
            ? '0 12px 32px rgba(0,0,0,.22)'
            : '0 12px 32px rgba(15,23,42,.07)',
          minHeight:'calc(100vh - 190px)',
          transition:'all .2s ease',
          color:theme.text
        }}>
          {tab==='search' && <DrugSearch addToMyDrugs={addToMyDrugs}/>}
          {tab==='scan' && (<ScanRx addToMyDrugs={addToMyDrugs}/>)}
          {tab==='interact' && <DrugInteractionCenter/>}
          {tab==='admin' && <AdminDashboard/>}
          {tab==='settings' && (
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
        <div style={{
          position:'fixed',
          left:'50%',
          bottom:88,
          transform:'translateX(-50%)',
          zIndex:3000,
          background:darkMode ? '#1E293B' : '#0F172A',
          color:'#fff',
          padding:'11px 18px',
          borderRadius:999,
          fontSize:13,
          fontWeight:800,
          boxShadow:'0 12px 30px rgba(0,0,0,.25)',
          whiteSpace:'nowrap'
        }}>
          {toast}
        </div>
      )}

      <nav style={{
        position:'fixed',
        left:0,
        right:0,
        bottom:0,
        zIndex:250,
        background:darkMode
          ? 'rgba(15,23,42,.92)'
          : 'rgba(255,255,255,.92)',
        backdropFilter:'blur(16px)',
        borderTop:`1px solid ${theme.border}`,
        boxShadow:darkMode
          ? '0 -10px 28px rgba(0,0,0,.28)'
          : '0 -10px 28px rgba(15,23,42,.10)',
        padding:'9px 12px max(9px, env(safe-area-inset-bottom))'
      }}>
        <div style={{
          maxWidth:520,
          margin:'0 auto',
          display:'grid',
          gridTemplateColumns:`repeat(${tabs.length},1fr)`,
          gap:8
        }}>
          {tabs.map(t=>{
            const active=tab===t.id

            return(
              <button
                key={t.id}
                onClick={()=>setTab(t.id)}
                aria-label={t.title}
                title={t.title}
                style={{
                  height:50,
                  border:'none',
                  borderRadius:18,
                  cursor:'pointer',
                  fontSize:22,
                  background:active
                    ? darkMode
                      ? 'linear-gradient(135deg,#064E3B,#164E63)'
                      : 'linear-gradient(135deg,#D1FAE5,#CFFAFE)'
                    : 'transparent',
                  color:active ? theme.primary : theme.muted,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  position:'relative',
                  boxShadow:active
                    ? darkMode
                      ? '0 8px 18px rgba(52,211,153,.14)'
                      : '0 8px 18px rgba(14,159,110,.16)'
                    : 'none',
                  transition:'all .18s ease'
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    transform:active
                      ? 'translateY(-2px) scale(1.08)'
                      : 'none',
                    transition:'transform .18s ease'
                  }}
                >
                  {t.icon}
                </span>

                {active && (
                  <span style={{
                    position:'absolute',
                    bottom:6,
                    width:5,
                    height:5,
                    borderRadius:'50%',
                    background:theme.primary
                  }}/>
                )}
              </button>
            )
          })}
        </div>
      </nav>

    </div>
  )
}

export default function App(){
  return <AuthProvider><AppInner/></AuthProvider>
}

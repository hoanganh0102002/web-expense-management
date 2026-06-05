"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';

export default function Reports() {
  const { isLoggedIn, userData } = useAppContext();
  const { t } = useLanguage();
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="reports" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar" style={{background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)',backdropFilter:'blur(10px)',position:'sticky',top:0,zIndex:10}}>
          <h1 className="page-title" style={{color:'var(--text-main)'}}>{t('reports_export')}</h1>
          <div className="nav-actions">
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px' }}>
                <span style={{ fontWeight: '600', color: '#343C6A', fontSize: '15px' }}>
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold', marginLeft: '10px'}}>{t('login')}</Link>
            )}
          </div>
        </nav>
        <div className="content-area">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px',marginBottom:'24px'}}>
            {[{title:t('export_pdf'),desc:t('export_pdf_desc'),icon:'📄',bg:'#FE5C73'},{title:t('export_excel'),desc:t('export_excel_desc'),icon:'📊',bg:'#16DBCC'},{title:t('export_csv'),desc:t('export_csv_desc'),icon:'📁',bg:'#1814F3'}].map((x,i)=>(
              <div key={i} style={{background: 'var(--card-bg)',borderRadius:'20px',padding:'30px',border:'1px solid var(--border-color)',textAlign:'center',cursor:'pointer',transition:'transform 0.2s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                <div style={{width:'60px',height:'60px',borderRadius:'50%',background:`${x.bg}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>{x.icon}</div>
                <h3 style={{color:'var(--text-main)',marginBottom:'8px'}}>{x.title}</h3>
                <p style={{color:'#718EBF',fontSize:'14px',marginBottom:'16px'}}>{x.desc}</p>
                <button style={{background:x.bg,color:'#fff',padding:'10px 24px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer',opacity:isLoggedIn?1:0.5}} disabled={!isLoggedIn}>{t('download')}</button>
              </div>
            ))}
          </div>
          <h2 className="section-title" style={{marginBottom:'16px'}}>{t('filter_before_export')}</h2>
          <div style={{background: 'var(--card-bg)',borderRadius:'20px',padding:'24px',border:'1px solid var(--border-color)',marginBottom:'24px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px'}}>
              {[{l:t('from_date'),t:'date'},{l:t('to_date'),t:'date'},{l:t('category_filter'),t:'select'},{l:t('transaction_type'),t:'select'}].map((f,i)=>(
                <div key={i}><label style={{display:'block',marginBottom:'8px',color:'var(--text-main)',fontWeight:'500',fontSize:'14px'}}>{f.l}</label>
                  {f.t==='date'?<input type="date" disabled={!isLoggedIn} style={{width:'100%',padding:'10px',border:'1px solid var(--border-color)',borderRadius:'10px',background:'var(--input-bg)',color:'var(--text-main)',fontSize:'14px'}}/>:
                  <select disabled={!isLoggedIn} style={{width:'100%',padding:'10px',border:'1px solid var(--border-color)',borderRadius:'10px',background:'var(--input-bg)',color:'var(--text-main)',fontSize:'14px'}}><option>{t('all')}</option></select>}
                </div>
              ))}
            </div>
          </div>
          <h2 className="section-title" style={{marginBottom:'16px'}}>{t('export_history')}</h2>
          <div style={{background: 'var(--card-bg)',borderRadius:'20px',padding:'24px',border:'1px solid var(--border-color)'}}>
            {isLoggedIn?[{name:'Báo_cáo_T5_2026.pdf',date:'20/05/2026',size:'2.4 MB'},{name:'Giao_dich_T4_2026.xlsx',date:'01/05/2026',size:'1.1 MB'},{name:'Dữ_liệu_Q1_2026.csv',date:'01/04/2026',size:'856 KB'}].map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',padding:'14px 0',borderBottom: '1px solid var(--border-color)'}}>
                <span style={{fontSize:'20px',marginRight:'15px'}}>📎</span>
                <div style={{flex:1}}><div style={{fontWeight:'600',color:'var(--text-main)'}}>{f.name}</div><div style={{fontSize:'12px',color:'#718EBF'}}>{f.date} • {f.size}</div></div>
                <button style={{border:'1px solid #2D60FF',color:'#2D60FF',background:'transparent',padding:'6px 16px',borderRadius:'8px',cursor:'pointer'}}>{t('reload')}</button>
              </div>
            )):<p style={{color:'#718EBF',textAlign:'center',padding:'30px'}}>{t('login_to_view_history')}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

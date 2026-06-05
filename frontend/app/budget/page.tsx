"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';

export default function Budget() {
  const { isLoggedIn, transactions, userData } = useAppContext();
  const { t } = useLanguage();
  
  const getUsed = (catName: string) => {
    return transactions
      .filter(txn => (txn.category === catName || txn.type === catName) && txn.amount < 0)
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  };

  const budgets = [
    {cat: t('food'), icon:'🍜', limit:isLoggedIn && transactions.length > 0 ? 3000000 : 0, used:getUsed('Ăn uống'), color:'#FF6384'},
    {cat: t('transport'), icon:'🚗', limit:isLoggedIn && transactions.length > 0 ? 1500000 : 0, used:getUsed('Di chuyển'), color:'#36A2EB'},
    {cat: t('shopping'), icon:'🛍️', limit:isLoggedIn && transactions.length > 0 ? 2000000 : 0, used:getUsed('Mua sắm'), color:'#FFCE56'},
    {cat: t('entertainment'), icon:'🎮', limit:isLoggedIn && transactions.length > 0 ? 1000000 : 0, used:getUsed('Giải trí'), color:'#4BC0C0'},
    {cat: t('health'), icon:'🏥', limit:isLoggedIn && transactions.length > 0 ? 500000 : 0, used:getUsed('Y tế'), color:'#9966FF'},
    {cat: t('education'), icon:'📚', limit:isLoggedIn && transactions.length > 0 ? 1000000 : 0, used:getUsed('Giáo dục'), color:'#FF9F40'},
    {cat: t('bills'), icon:'📋', limit:isLoggedIn && transactions.length > 0 ? 2000000 : 0, used:getUsed('Hóa đơn'), color:'#E83E8C'},
    {cat: t('rent'), icon:'🏠', limit:isLoggedIn && transactions.length > 0 ? 5000000 : 0, used:getUsed('Tiền thuê'), color:'#6F42C1'},
  ];
  const totalLimit = budgets.reduce((s,b)=>s+b.limit,0);
  const totalUsed = budgets.reduce((s,b)=>s+b.used,0);
  const totalPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
  const fmt = (n:number) => n.toLocaleString('vi-VN')+'₫';
  
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="budget" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar" style={{background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)',backdropFilter:'blur(10px)',position:'sticky',top:0,zIndex:10}}>
          <h1 className="page-title" style={{color:'var(--text-main)'}}>{t('budget')}</h1>
          <div className="nav-actions">
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>{t('set_budget')}</button>
            <button style={{background:'transparent',color:'#1814F3',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'1px solid #1814F3',cursor:'pointer'}}>{t('copy_from_previous_month')}</button>
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
          <div style={{background:'linear-gradient(135deg,#1814F3,#6366F1)',borderRadius:'20px',padding:'30px',color:'#fff',marginBottom:'24px'}}>
            <div style={{fontSize:'14px',opacity:0.85,marginBottom:'8px'}}>{t('total_monthly_budget')} 5/2026</div>
            <div style={{fontSize:'36px',fontWeight:'800',marginBottom:'15px'}}>{fmt(totalUsed)} / {fmt(totalLimit)}</div>
            <div style={{width:'100%',height:'12px',background:'rgba(255,255,255,0.2)',borderRadius:'6px'}}>
                <div style={{width:`${totalPct}%`,height:'100%',background:totalPct>80?'#FE5C73':'#16DBCC',borderRadius:'6px',transition:'width 0.5s'}}></div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'10px',fontSize:'13px',opacity:0.85}}>
                <span>{t('used_label')} {totalPct}%</span>
                <span>{t('remaining_label')} {fmt(totalLimit-totalUsed)}</span>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'20px'}}>
            {budgets.map((b,i)=>{const pct = b.limit > 0 ? Math.round(b.used/b.limit*100) : 0;return(
              <div key={i} style={{background:'var(--card-bg)',borderRadius:'20px',padding:'24px',border:'1px solid var(--border-color)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',background:`${b.color}15`}}>{b.icon}</div>
                    <div><div style={{fontWeight:'700',color:'var(--text-main)'}}>{b.cat}</div><div style={{fontSize:'13px',color:'#718EBF'}}>{t('limit_label')} {fmt(b.limit)}</div></div>
                  </div>
                  {pct>=80 && <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:pct>=100?'#FFE0EB':'#FFF5D9',color:pct>=100?'#FE5C73':'#FF9800'}}>{pct>=100?t('over_budget'):t('almost_empty')}</span>}
                </div>
                <div style={{width:'100%',height:'10px',background:'var(--input-bg)',borderRadius:'5px',marginBottom:'8px'}}><div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:pct>=80?'#FE5C73':b.color,borderRadius:'5px',transition:'width 0.6s'}}></div></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}><span style={{color:b.color,fontWeight:'600'}}>{fmt(b.used)}</span><span style={{color:'#718EBF'}}>{pct}%</span></div>
              </div>
            )})}
          </div>
        </div>
      </main>
    </div>
  );
}

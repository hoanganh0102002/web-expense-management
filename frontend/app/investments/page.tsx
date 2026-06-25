"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export default function Investments() {
  const [isLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  return (
    <div className="dashboard-container" style={{ background: '#F8F9FB' }}>
      <Sidebar activeItem="investments" />
      <main className="main-content" style={{ background: '#F8F9FB' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>Investments</h1>
          <div className="nav-actions">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }} className="search-bar">
              <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center', userSelect: 'none' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="avatar" /> : <Link href="/login" style={{ textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold' }}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div className="balance-overview" style={{ marginBottom: '24px' }}>
            <div className="balance-item"><div className="balance-label">Total Invested Amount</div><div className="balance-val">{isLoggedIn ? "$150,000" : "$0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Number of Investments</div><div className="balance-val">{isLoggedIn ? "1,250" : "0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Rate of Return</div><div className="balance-val">{isLoggedIn ? "+5.80%" : "0%"}</div></div>
          </div>
          <div className="row">
            <div className="col-1" style={{ flex:1.5 }}>
              <h2 className="section-title">Yearly Total Investment</h2>
              <div className="chart-card" style={{ minHeight:'220px',display:'flex',alignItems:'center',justifyContent:'center',color:'#718EBF' }}>
                <svg width="100%" height="180" viewBox="0 0 600 180" preserveAspectRatio="none"><path d="M0,150 C100,100 150,120 200,80 C250,40 300,90 350,60 C400,30 450,70 500,50 C550,30 580,60 600,40" fill="none" stroke="#1814F3" strokeWidth="3"/><path d="M0,150 C100,100 150,120 200,80 C250,40 300,90 350,60 C400,30 450,70 500,50 C550,30 580,60 600,40 L600,180 L0,180 Z" fill="rgba(24,20,243,0.08)"/></svg>
              </div>
            </div>
            <div className="col-1" style={{ flex:1 }}>
              <h2 className="section-title">Monthly Revenue</h2>
              <div className="chart-card" style={{ minHeight:'220px',display:'flex',alignItems:'center',justifyContent:'center',color:'#718EBF' }}>
                <svg width="100%" height="180" viewBox="0 0 600 180" preserveAspectRatio="none"><path d="M0,120 C100,80 150,140 200,100 C250,60 300,110 350,70 C400,30 450,90 500,60 C550,30 580,80 600,50" fill="none" stroke="#16DBCC" strokeWidth="3"/><path d="M0,120 C100,80 150,140 200,100 C250,60 300,110 350,70 C400,30 450,90 500,60 C550,30 580,80 600,50 L600,180 L0,180 Z" fill="rgba(22,219,204,0.08)"/></svg>
              </div>
            </div>
          </div>
          <div className="row" style={{ marginTop: '24px' }}>
            <div className="col-1" style={{ flex:1 }}>
              <h2 className="section-title">My Investment</h2>
              <div className="transactions-card">{[{t:'Apple Store',sub:'E-commerce, Marketplace',a:'+$16,000',c:'#16DBCC'},{t:'Samsung Mobile',sub:'Electronics',a:'-$8,500',c:'#FE5C73'},{t:'Tesla Stocks',sub:'Electric Vehicles',a:'+$25,300',c:'#16DBCC'}].map((x,i)=>(
                <div className="transaction-item" key={i} style={{ marginBottom:'15px' }}><div className="tx-icon" style={{ background:'#E6EFF5',color:'#1814F3' }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg></div><div className="tx-details"><div className="tx-title">{x.t}</div><div className="tx-date">{x.sub}</div></div><div className="tx-amount" style={{color:x.c,fontWeight:'600'}}>{isLoggedIn ? x.a : "$0"}</div></div>
              ))}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

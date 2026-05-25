"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function Accounts() {
  const [isLoggedIn] = useState(false);
  return (
    <div className="dashboard-container" style={{ background: '#F8F9FB' }}>
      <Sidebar activeItem="accounts" />
      <main className="main-content" style={{ background: '#F8F9FB' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>Accounts</h1>
          <div className="nav-actions">
            <div className="search-bar" style={{ background: '#F8F9FB' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#718EBF"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><input type="text" placeholder="Search..." /></div>
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="avatar" /> : <Link href="/login" style={{ textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold' }}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div className="balance-overview" style={{ marginBottom: '24px' }}>
            <div className="balance-item"><div className="balance-label">My Balance</div><div className="balance-val">{isLoggedIn ? "$12,750" : "$0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Income</div><div className="balance-val">{isLoggedIn ? "$5,600" : "$0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Expense</div><div className="balance-val">{isLoggedIn ? "$3,460" : "$0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Total Saving</div><div className="balance-val">{isLoggedIn ? "$7,920" : "$0"}</div></div>
          </div>
          <div className="row"><div className="col-1" style={{ flex:1 }}>
            <h2 className="section-title">Last Transaction</h2>
            <div className="transactions-card">{[{t:'Spotify Subscription',d:'25 Jan 2021',a:'-$150',c:'#FE5C73'},{t:'Mobile Service',d:'25 Jan 2021',a:'-$340',c:'#FE5C73'},{t:'Emilly Wilson',d:'25 Jan 2021',a:'+$780',c:'#16DBCC'}].map((x,i)=>(
              <div className="transaction-item" key={i}><div className="tx-icon blue"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg></div><div className="tx-details"><div className="tx-title">{x.t}</div><div className="tx-date">{x.d}</div></div><div className="tx-amount" style={{color:x.c}}>{isLoggedIn ? x.a : "$0"}</div></div>
            ))}</div>
          </div><div className="col-1" style={{ flex:1.5 }}>
            <h2 className="section-title">Debit & Credit Overview</h2>
            <div className="chart-card" style={{ minHeight:'200px',display:'flex',alignItems:'center',justifyContent:'center',color:'#718EBF' }}>
              <p>Chart will display when logged in</p>
            </div>
          </div></div>
        </div>
      </main>
    </div>
  );
}

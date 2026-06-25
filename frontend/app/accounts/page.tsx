"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export default function Accounts() {
  const [isLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  return (
    <div className="dashboard-container" style={{ background: '#F8F9FB' }}>
      <Sidebar activeItem="accounts" />
      <main className="main-content" style={{ background: '#F8F9FB' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>Accounts</h1>
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

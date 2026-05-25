"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function CreditCards() {
  const [isLoggedIn] = useState(false);
  return (
    <div className="dashboard-container" style={{ background: '#F8F9FB' }}>
      <Sidebar activeItem="credit-cards" />
      <main className="main-content" style={{ background: '#F8F9FB' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>Credit Cards</h1>
          <div className="nav-actions">
            <div className="search-bar" style={{ background: '#F8F9FB' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#718EBF"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><input type="text" placeholder="Search..." /></div>
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="avatar" /> : <Link href="/login" style={{ textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold' }}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div className="row">
            <div className="col-2" style={{ flex:2 }}>
              <h2 className="section-title">My Cards</h2>
              <div className="cards-wrapper" style={{ display:'flex',gap:'20px' }}>
                <div className="credit-card card-dark" style={{ flex:1 }}>
                  <div className="card-top"><div><div className="balance-label">Balance</div><div className="balance-amount">{isLoggedIn?"$5,756":"$0"}</div></div><div className="chip-icon"><svg viewBox="0 0 48 48" fill="rgba(255,255,255,0.8)"><path d="M12 24h24v-4H12v4zm0 8h24v-4H12v4z"/></svg></div></div>
                  <div className="card-middle"><div><div className="info-label">CARD HOLDER</div><div className="info-value">Eddy Cusuma</div></div><div><div className="info-label">VALID THRU</div><div className="info-value">12/22</div></div></div>
                  <div className="card-bottom"><div>3778 **** **** 1234</div><svg width="44" height="30" viewBox="0 0 44 30"><circle cx="15" cy="15" r="15" fill="rgba(255,255,255,0.5)"/><circle cx="29" cy="15" r="15" fill="rgba(255,255,255,0.5)"/></svg></div>
                </div>
                <div className="credit-card card-light" style={{ flex:1,background:'#fff',color:'#343C6A',border:'1px solid #E6EFF5' }}>
                  <div className="card-top"><div><div className="balance-label" style={{color:'#718EBF'}}>Balance</div><div className="balance-amount">{isLoggedIn?"$5,756":"$0"}</div></div><div className="chip-icon"><svg viewBox="0 0 48 48" fill="rgba(0,0,0,0.2)"><path d="M12 24h24v-4H12v4zm0 8h24v-4H12v4z"/></svg></div></div>
                  <div className="card-middle"><div><div className="info-label" style={{color:'#718EBF'}}>CARD HOLDER</div><div className="info-value">Eddy Cusuma</div></div><div><div className="info-label" style={{color:'#718EBF'}}>VALID THRU</div><div className="info-value">12/22</div></div></div>
                  <div className="card-bottom" style={{borderTop:'1px solid #E6EFF5'}}><div>3778 **** **** 1234</div><svg width="44" height="30" viewBox="0 0 44 30"><circle cx="15" cy="15" r="15" fill="rgba(0,0,0,0.1)"/><circle cx="29" cy="15" r="15" fill="rgba(0,0,0,0.1)"/></svg></div>
                </div>
              </div>
            </div>
            <div className="col-1" style={{ flex:1 }}>
              <h2 className="section-title">Card Expense Statistics</h2>
              <div className="chart-card" style={{ minHeight:'200px',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform:'rotate(-90deg)' }}><circle cx="100" cy="100" r="80" fill="transparent" stroke="#343C6A" strokeWidth="40" strokeDasharray="502" strokeDashoffset="351"/><circle cx="100" cy="100" r="80" fill="transparent" stroke="#FC7900" strokeWidth="40" strokeDasharray="502" strokeDashoffset="426" style={{ strokeDashoffset:'426',strokeDasharray:'75 502',transformOrigin:'center',transform:'rotate(108deg)' }}/></svg>
              </div>
            </div>
          </div>
          <div className="row" style={{ marginTop:'24px' }}>
            <div className="col-1" style={{ flex:1 }}>
              <h2 className="section-title">Card List</h2>
              <div className="transactions-card">{[{t:'Card Type: Secondary',n:'**** **** 1234',s:'Active'},{t:'Card Type: Primary',n:'**** **** 5678',s:'Active'},{t:'Card Type: Virtual',n:'**** **** 9012',s:'Frozen'}].map((x,i)=>(
                <div className="transaction-item" key={i} style={{ marginBottom:'15px' }}><div className="tx-icon" style={{ background:'#E6EFF5',color:'#1814F3' }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 4H3c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h18c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H3V6h18v12z"/></svg></div><div className="tx-details"><div className="tx-title">{x.t}</div><div className="tx-date">{x.n}</div></div><div style={{color: x.s==='Active'?'#16DBCC':'#FE5C73',fontWeight:'600'}}>{x.s}</div></div>
              ))}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

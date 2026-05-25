"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function Services() {
  const [isLoggedIn] = useState(false);
  return (
    <div className="dashboard-container" style={{ background: '#F8F9FB' }}>
      <Sidebar activeItem="services" />
      <main className="main-content" style={{ background: '#F8F9FB' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>Services</h1>
          <div className="nav-actions">
            <div className="search-bar" style={{ background: '#F8F9FB' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#718EBF"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><input type="text" placeholder="Search..." /></div>
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="avatar" /> : <Link href="/login" style={{ textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold' }}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div className="balance-overview" style={{ marginBottom:'24px' }}>
            <div className="balance-item"><div className="balance-label">Life Insurance</div><div className="balance-val">{isLoggedIn?"$2,500":"$0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Shopping</div><div className="balance-val">{isLoggedIn?"$8,260":"$0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Safety</div><div className="balance-val">{isLoggedIn?"$3,860":"$0"}</div></div>
          </div>
          <div className="row">
            <div className="col-1" style={{ flex:1 }}>
              <h2 className="section-title">Bank Services List</h2>
              <div className="transactions-card">{[
                {t:'Business Loans',d:'It is a long established',icon:'💼',bg:'#FFF5D9',amount:'+$12,000',c:'#16DBCC'},
                {t:'Checking Accounts',d:'It is a long established',icon:'🏦',bg:'#E7EDFF',amount:'+$8,350',c:'#16DBCC'},
                {t:'Savings Accounts',d:'It is a long established',icon:'💰',bg:'#FFE0EB',amount:'+$2,150',c:'#16DBCC'},
                {t:'Debit and Credit Cards',d:'It is a long established',icon:'💳',bg:'#DCFAF8',amount:'-$5,600',c:'#FE5C73'},
                {t:'Life Insurance',d:'It is a long established',icon:'🛡️',bg:'#E7EDFF',amount:'-$1,050',c:'#FE5C73'},
                {t:'Digital Banking',d:'It is a long established',icon:'📱',bg:'#FFF5D9',amount:'+$14,500',c:'#16DBCC'},
              ].map((x,i)=>(
                <div className="transaction-item" key={i} style={{ marginBottom:'12px' }}>
                  <div style={{ width:'50px',height:'50px',borderRadius:'15px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',background:x.bg }}>{x.icon}</div>
                  <div className="tx-details"><div className="tx-title">{x.t}</div><div className="tx-date">{x.d}</div></div>
                  <div className="tx-amount" style={{ color:x.c,fontWeight:'600' }}>{isLoggedIn ? x.amount : "$0"}</div>
                </div>
              ))}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

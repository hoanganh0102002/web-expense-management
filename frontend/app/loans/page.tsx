"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export default function Loans() {
  const [isLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  return (
    <div className="dashboard-container" style={{ background: '#F8F9FB' }}>
      <Sidebar activeItem="loans" />
      <main className="main-content" style={{ background: '#F8F9FB' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>Loans</h1>
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
          <div className="balance-overview" style={{ marginBottom:'24px' }}>
            <div className="balance-item"><div className="balance-label">Personal Loans</div><div className="balance-val">{isLoggedIn?"$50,000":"$0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Corporate Loans</div><div className="balance-val">{isLoggedIn?"$100,000":"$0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Business Loans</div><div className="balance-val">{isLoggedIn?"$500,000":"$0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Custom Loans</div><div className="balance-val">{isLoggedIn?"$800,000":"$0"}</div></div>
          </div>
          <div className="row">
            <div className="col-1" style={{ flex:1 }}>
              <h2 className="section-title">Active Loans Overview</h2>
              <div style={{ background:'#fff',borderRadius:'20px',padding:'24px',border:'1px solid #E6EFF5' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',textAlign:'left',color:'#343C6A',fontSize:'15px' }}>
                  <thead style={{ color:'#718EBF',borderBottom:'1px solid #E6EFF5' }}>
                    <tr><th style={{ padding:'14px 8px',fontWeight:'500' }}>SL No</th><th style={{ padding:'14px 8px',fontWeight:'500' }}>Loan Money</th><th style={{ padding:'14px 8px',fontWeight:'500' }}>Left to repay</th><th style={{ padding:'14px 8px',fontWeight:'500' }}>Duration</th><th style={{ padding:'14px 8px',fontWeight:'500' }}>Interest rate</th><th style={{ padding:'14px 8px',fontWeight:'500' }}>Installment</th><th style={{ padding:'14px 8px',fontWeight:'500' }}>Repay</th></tr>
                  </thead>
                  <tbody>{[
                    {no:'01',money:'$100,000',left:'$40,500',dur:'8 Months',rate:'12%',inst:'$2,000/month'},
                    {no:'02',money:'$500,000',left:'$250,000',dur:'36 Months',rate:'10%',inst:'$8,200/month'},
                    {no:'03',money:'$900,000',left:'$40,500',dur:'12 Months',rate:'12%',inst:'$5,000/month'},
                    {no:'04',money:'$50,000',left:'$40,000',dur:'25 Months',rate:'5%',inst:'$2,000/month'},
                  ].map((x,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #E6EFF5' }}>
                      <td style={{ padding:'14px 8px' }}>{x.no}</td>
                      <td style={{ padding:'14px 8px' }}>{isLoggedIn?x.money:"$0"}</td>
                      <td style={{ padding:'14px 8px' }}>{isLoggedIn?x.left:"$0"}</td>
                      <td style={{ padding:'14px 8px' }}>{x.dur}</td>
                      <td style={{ padding:'14px 8px' }}>{x.rate}</td>
                      <td style={{ padding:'14px 8px' }}>{isLoggedIn?x.inst:"$0"}</td>
                      <td style={{ padding:'14px 8px' }}><button style={{ border:'1px solid #2D60FF',color:'#2D60FF',background:'transparent',padding:'6px 16px',borderRadius:'20px',cursor:'pointer' }}>Repay</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

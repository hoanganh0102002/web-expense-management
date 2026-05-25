"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function Privileges() {
  const [isLoggedIn] = useState(false);
  return (
    <div className="dashboard-container" style={{ background: '#F8F9FB' }}>
      <Sidebar activeItem="privileges" />
      <main className="main-content" style={{ background: '#F8F9FB' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>My Privileges</h1>
          <div className="nav-actions">
            <div className="search-bar" style={{ background: '#F8F9FB' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#718EBF"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><input type="text" placeholder="Search..." /></div>
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="avatar" /> : <Link href="/login" style={{ textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold' }}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div className="row" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'20px', marginBottom:'24px' }}>
            {[
              { title:'Cashback Rewards', desc:'Earn 2% cashback on all transactions', icon:'🎁', bg:'linear-gradient(135deg, #1814F3, #6C63FF)', pts: isLoggedIn?'2,450':'0' },
              { title:'Travel Miles', desc:'Collect miles for every dollar spent', icon:'✈️', bg:'linear-gradient(135deg, #16DBCC, #0EA5E9)', pts: isLoggedIn?'18,200':'0' },
              { title:'VIP Lounge Access', desc:'Unlimited airport lounge access worldwide', icon:'🏆', bg:'linear-gradient(135deg, #FC7900, #F59E0B)', pts: isLoggedIn?'Premium':'Locked' },
              { title:'Priority Support', desc:'24/7 dedicated support line', icon:'🎧', bg:'linear-gradient(135deg, #E83E8C, #EC4899)', pts: isLoggedIn?'Active':'Locked' },
              { title:'Shopping Discounts', desc:'Up to 15% off at partner stores', icon:'🛍️', bg:'linear-gradient(135deg, #343C6A, #6366F1)', pts: isLoggedIn?'12 Stores':'0' },
              { title:'Insurance Benefits', desc:'Free travel and health insurance', icon:'🛡️', bg:'linear-gradient(135deg, #16DBCC, #14B8A6)', pts: isLoggedIn?'Active':'Locked' },
            ].map((x,i)=>(
              <div key={i} style={{ background:x.bg, borderRadius:'20px', padding:'30px', color:'#fff', position:'relative', overflow:'hidden', minHeight:'180px' }}>
                <div style={{ fontSize:'40px', marginBottom:'15px' }}>{x.icon}</div>
                <h3 style={{ fontSize:'20px', fontWeight:'700', marginBottom:'6px' }}>{x.title}</h3>
                <p style={{ fontSize:'14px', opacity:0.85, marginBottom:'15px' }}>{x.desc}</p>
                <div style={{ fontSize:'24px', fontWeight:'800' }}>{x.pts}</div>
                <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'100px', height:'100px', borderRadius:'50%', background:'rgba(255,255,255,0.1)' }}></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

export default function Budget() {
  const { isLoggedIn } = useAppContext();
  const budgets = [
    {cat:'Ăn uống',icon:'🍜',limit:3000000,used:isLoggedIn?2250000:0,color:'#FF6384'},
    {cat:'Di chuyển',icon:'🚗',limit:1500000,used:isLoggedIn?675000:0,color:'#36A2EB'},
    {cat:'Mua sắm',icon:'🛍️',limit:2000000,used:isLoggedIn?1800000:0,color:'#FFCE56'},
    {cat:'Giải trí',icon:'🎮',limit:1000000,used:isLoggedIn?300000:0,color:'#4BC0C0'},
    {cat:'Y tế',icon:'🏥',limit:500000,used:isLoggedIn?150000:0,color:'#9966FF'},
    {cat:'Giáo dục',icon:'📚',limit:1000000,used:isLoggedIn?500000:0,color:'#FF9F40'},
    {cat:'Hóa đơn',icon:'📋',limit:2000000,used:isLoggedIn?1650000:0,color:'#E83E8C'},
    {cat:'Tiền thuê',icon:'🏠',limit:5000000,used:isLoggedIn?5000000:0,color:'#6F42C1'},
  ];
  const totalLimit = budgets.reduce((s,b)=>s+b.limit,0);
  const totalUsed = budgets.reduce((s,b)=>s+b.used,0);
  const fmt = (n:number) => n.toLocaleString('vi-VN')+'₫';
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="budget" />
      <main className="main-content" style={{background:'#F8F9FB'}}>
        <nav className="navbar" style={{background:'#fff',borderBottom:'1px solid #E6EFF5'}}>
          <h1 className="page-title" style={{color:'#343C6A'}}>Ngân sách</h1>
          <div className="nav-actions">
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>+ Đặt ngân sách</button>
            <button style={{background:'transparent',color:'#1814F3',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'1px solid #1814F3',cursor:'pointer'}}>📋 Sao chép từ tháng trước</button>
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=5" alt="Avatar" className="avatar"/> : <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          {/* Tổng ngân sách */}
          <div style={{background:'linear-gradient(135deg,#1814F3,#6366F1)',borderRadius:'20px',padding:'30px',color:'#fff',marginBottom:'24px'}}>
            <div style={{fontSize:'14px',opacity:0.85,marginBottom:'8px'}}>Ngân sách tổng tháng 5/2026</div>
            <div style={{fontSize:'36px',fontWeight:'800',marginBottom:'15px'}}>{fmt(totalUsed)} / {fmt(totalLimit)}</div>
            <div style={{width:'100%',height:'12px',background:'rgba(255,255,255,0.2)',borderRadius:'6px'}}><div style={{width:`${(totalUsed/totalLimit)*100}%`,height:'100%',background:totalUsed/totalLimit>0.8?'#FE5C73':'#16DBCC',borderRadius:'6px',transition:'width 0.5s'}}></div></div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'10px',fontSize:'13px',opacity:0.85}}><span>Đã dùng {Math.round(totalUsed/totalLimit*100)}%</span><span>Còn lại: {fmt(totalLimit-totalUsed)}</span></div>
          </div>
          {/* Danh sách ngân sách */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'20px'}}>
            {budgets.map((b,i)=>{const pct=Math.round(b.used/b.limit*100);return(
              <div key={i} style={{background:'#fff',borderRadius:'20px',padding:'24px',border:'1px solid #E6EFF5'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',background:`${b.color}15`}}>{b.icon}</div>
                    <div><div style={{fontWeight:'700',color:'#343C6A'}}>{b.cat}</div><div style={{fontSize:'13px',color:'#718EBF'}}>Hạn mức: {fmt(b.limit)}</div></div>
                  </div>
                  {pct>=80 && <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:pct>=100?'#FFE0EB':'#FFF5D9',color:pct>=100?'#FE5C73':'#FF9800'}}>{pct>=100?'Vượt ngân sách!':'Gần hết!'}</span>}
                </div>
                <div style={{width:'100%',height:'10px',background:'#E6EFF5',borderRadius:'5px',marginBottom:'8px'}}><div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:pct>=80?'#FE5C73':b.color,borderRadius:'5px',transition:'width 0.6s'}}></div></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}><span style={{color:b.color,fontWeight:'600'}}>{fmt(b.used)}</span><span style={{color:'#718EBF'}}>{pct}%</span></div>
              </div>
            )})}
          </div>
        </div>
      </main>
    </div>
  );
}

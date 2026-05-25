"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

export default function Wallets() {
  const { isLoggedIn } = useAppContext();
  const wallets = [
    {name:'Tiền mặt',icon:'💵',balance:'2.500.000₫',bg:'linear-gradient(135deg,#16DBCC,#0EA5E9)',txCount:isLoggedIn?45:0,visible:true},
    {name:'Vietcombank',icon:'🏦',balance:'15.300.000₫',bg:'linear-gradient(135deg,#1814F3,#6366F1)',txCount:isLoggedIn?128:0,visible:true},
    {name:'MoMo',icon:'📱',balance:'1.200.000₫',bg:'linear-gradient(135deg,#E83E8C,#EC4899)',txCount:isLoggedIn?67:0,visible:true},
    {name:'VnPay',icon:'💳',balance:'800.000₫',bg:'linear-gradient(135deg,#FC7900,#F59E0B)',txCount:isLoggedIn?23:0,visible:false},
  ];
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="wallets" />
      <main className="main-content" style={{background:'#F8F9FB'}}>
        <nav className="navbar" style={{background:'#fff',borderBottom:'1px solid #E6EFF5'}}>
          <h1 className="page-title" style={{color:'#343C6A'}}>Ví & Tài khoản tiền</h1>
          <div className="nav-actions">
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>+ Tạo ví mới</button>
            <button style={{background:'#16DBCC',color:'#fff',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>↔ Chuyển tiền</button>
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=5" alt="Avatar" className="avatar"/> : <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div className="balance-overview" style={{marginBottom:'24px'}}>
            <div className="balance-item"><div className="balance-label">Tổng số dư</div><div className="balance-val">{isLoggedIn?"19.800.000₫":"0₫"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Số ví đang dùng</div><div className="balance-val">{isLoggedIn?"4":"0"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Ví chính</div><div className="balance-val">Vietcombank</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'20px',marginBottom:'24px'}}>
            {wallets.map((w,i)=>(
              <div key={i} style={{background:w.bg,borderRadius:'20px',padding:'28px',color:'#fff',position:'relative',overflow:'hidden',minHeight:'160px'}}>
                <div style={{position:'absolute',top:'-20px',right:'-20px',width:'120px',height:'120px',borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}></div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
                  <div><div style={{fontSize:'14px',opacity:0.85,marginBottom:'4px'}}>Số dư</div><div style={{fontSize:'28px',fontWeight:'800'}}>{isLoggedIn?w.balance:"0₫"}</div></div>
                  <div style={{fontSize:'36px'}}>{w.icon}</div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><div style={{fontSize:'16px',fontWeight:'700'}}>{w.name}</div><div style={{fontSize:'13px',opacity:0.8}}>{w.txCount} giao dịch</div></div>
                  <div style={{display:'flex',gap:'8px'}}>
                    {!w.visible && <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',background:'rgba(255,255,255,0.2)'}}>Ẩn</span>}
                    <button style={{background:'rgba(255,255,255,0.2)',color:'#fff',border:'none',padding:'6px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'12px'}}>Chi tiết</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <h2 className="section-title" style={{marginBottom:'16px'}}>Lịch sử chuyển khoản nội bộ</h2>
          <div style={{background:'#fff',borderRadius:'20px',padding:'24px',border:'1px solid #E6EFF5'}}>
            {[{from:'Vietcombank',to:'MoMo',amount:'500.000₫',date:'13/05, 20:00'},{from:'Tiền mặt',to:'Vietcombank',amount:'2.000.000₫',date:'10/05, 09:15'},{from:'MoMo',to:'VnPay',amount:'300.000₫',date:'08/05, 14:30'}].map((t,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',padding:'14px 0',borderBottom:i<2?'1px solid #E6EFF5':'none'}}>
                <span style={{fontWeight:'600',color:'#343C6A',flex:1}}>{t.from}</span>
                <span style={{color:'#1814F3',fontWeight:'700',margin:'0 20px'}}>→</span>
                <span style={{fontWeight:'600',color:'#343C6A',flex:1}}>{t.to}</span>
                <span style={{color:'#FE5C73',fontWeight:'600',flex:1,textAlign:'right'}}>{isLoggedIn?t.amount:"0₫"}</span>
                <span style={{color:'#718EBF',flex:1,textAlign:'right'}}>{t.date}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

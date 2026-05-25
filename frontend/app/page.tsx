"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from './components/Sidebar';
import { useAppContext } from './context/AppContext';

export default function Dashboard() {
  const { isLoggedIn } = useAppContext();
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="dashboard" />
      <main className="main-content">
        <nav className="navbar">
          <h1 className="page-title">Tổng quan</h1>
          <div className="nav-actions">
            <div className="search-bar"><svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-light)"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><input type="text" placeholder="Tìm kiếm..." /></div>
            <button className="icon-btn"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></button>
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=5" alt="Avatar" className="avatar"/> : <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          {/* Module 6: Tổng quan tháng */}
          <div className="balance-overview">
            <div className="balance-item"><div className="balance-label">Tổng thu nhập</div><div className="balance-val">{isLoggedIn?"12.500.000₫":"0₫"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Tổng chi tiêu</div><div className="balance-val">{isLoggedIn?"8.350.000₫":"0₫"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Số dư ròng</div><div className="balance-val" style={{color:isLoggedIn?'#16DBCC':'#343C6A'}}>{isLoggedIn?"+4.150.000₫":"0₫"}</div></div>
            <div className="balance-divider"></div>
            <div className="balance-item"><div className="balance-label">Tổng tiết kiệm</div><div className="balance-val">{isLoggedIn?"25.000.000₫":"0₫"}</div></div>
          </div>

          <div className="row">
            {/* Biểu đồ cột: Thu nhập vs Chi tiêu */}
            <div className="col-2" style={{flex:1.8}}>
              <div className="section-header"><h2 className="section-title">Thu nhập vs Chi tiêu (6 tháng)</h2></div>
              <div className="chart-card">
                <div className="bar-chart-mock">
                  <div className="bar-legend"><span><div className="dot diposit"></div> Thu nhập</span><span><div className="dot withdraw"></div> Chi tiêu</span></div>
                  <div className="bars-container">
                    {['T7','T8','T9','T10','T11','T12'].map((m,i)=>(<div className="bar-group" key={i}><div className="bar-col bar-cyan" style={{height:`${isLoggedIn?[60,45,70,55,80,65][i]:0}%`}}></div><div className="bar-col bar-blue" style={{height:`${isLoggedIn?[40,55,50,45,60,50][i]:0}%`}}></div></div>))}
                  </div>
                </div>
              </div>
            </div>
            {/* Biểu đồ tròn: Phân bổ chi tiêu */}
            <div className="col-1" style={{flex:1.2}}>
              <div className="section-header"><h2 className="section-title">Phân bổ chi tiêu</h2></div>
              <div className="chart-card">
                <svg width="200" height="200" viewBox="0 0 200 200" style={{transform:'rotate(-90deg)'}}>
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke="#FF6384" strokeWidth="40" strokeDasharray="150 502"/>
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke="#36A2EB" strokeWidth="40" strokeDasharray="100 502" style={{transformOrigin:'center',transform:'rotate(108deg)'}}/>
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke="#FFCE56" strokeWidth="40" strokeDasharray="80 502" style={{transformOrigin:'center',transform:'rotate(180deg)'}}/>
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke="#4BC0C0" strokeWidth="40" strokeDasharray="70 502" style={{transformOrigin:'center',transform:'rotate(237deg)'}}/>
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke="#9966FF" strokeWidth="40" strokeDasharray="100 502" style={{transformOrigin:'center',transform:'rotate(288deg)'}}/>
                </svg>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Giao dịch gần đây */}
            <div className="col-1" style={{flex:1}}>
              <div className="section-header"><h2 className="section-title">Giao dịch gần đây</h2></div>
              <div className="transactions-card">{[
                {t:'Grab Di chuyển',d:'Hôm nay, 08:30',a:'-45.000₫',c:'#FE5C73',icon:'🚗'},
                {t:'Lương tháng 5',d:'Hôm qua, 09:00',a:'+12.500.000₫',c:'#16DBCC',icon:'💰'},
                {t:'Shopee Mua sắm',d:'20/05, 14:22',a:'-350.000₫',c:'#FE5C73',icon:'🛍️'},
                {t:'Tiền điện',d:'18/05, 10:00',a:'-850.000₫',c:'#FE5C73',icon:'⚡'},
              ].map((x,i)=>(
                <div className="transaction-item" key={i}>
                  <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',background:'#F8F9FB',marginRight:'15px'}}>{x.icon}</div>
                  <div className="tx-details"><div className="tx-title">{x.t}</div><div className="tx-date">{x.d}</div></div>
                  <div className="tx-amount" style={{color:x.c}}>{isLoggedIn?x.a:"0₫"}</div>
                </div>
              ))}</div>
            </div>

            {/* Ngân sách tháng */}
            <div className="col-1" style={{flex:1}}>
              <div className="section-header"><h2 className="section-title">Ngân sách tháng này</h2></div>
              <div className="transactions-card" style={{height:'auto'}}>
                {[{cat:'Ăn uống',used:75,limit:'3.000.000₫',color:'#FF6384'},{cat:'Di chuyển',used:45,limit:'1.500.000₫',color:'#36A2EB'},{cat:'Mua sắm',used:90,limit:'2.000.000₫',color:'#FFCE56'},{cat:'Giải trí',used:30,limit:'1.000.000₫',color:'#4BC0C0'}].map((b,i)=>(
                  <div key={i} style={{marginBottom:'18px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}><span style={{fontWeight:'600',fontSize:'14px',color:'#343C6A'}}>{b.cat}</span><span style={{fontSize:'13px',color:'#718EBF'}}>{isLoggedIn?`${b.used}%`:'0%'} / {b.limit}</span></div>
                    <div style={{width:'100%',height:'8px',background:'#E6EFF5',borderRadius:'4px'}}><div style={{width:`${isLoggedIn?b.used:0}%`,height:'100%',background:b.used>=80?'#FE5C73':b.color,borderRadius:'4px',transition:'width 0.5s'}}></div></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ví tiền */}
            <div className="col-1" style={{flex:1}}>
              <div className="section-header"><h2 className="section-title">Ví của tôi</h2></div>
              <div className="transactions-card" style={{height:'auto'}}>
                {[{name:'Tiền mặt',bal:'2.500.000₫',icon:'💵',bg:'#DCFAF8'},{name:'Vietcombank',bal:'15.300.000₫',icon:'🏦',bg:'#E7EDFF'},{name:'MoMo',bal:'1.200.000₫',icon:'📱',bg:'#FFE0EB'}].map((w,i)=>(
                  <div className="transaction-item" key={i} style={{marginBottom:'12px'}}>
                    <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',background:w.bg,marginRight:'15px'}}>{w.icon}</div>
                    <div className="tx-details"><div className="tx-title">{w.name}</div><div className="tx-date">Số dư hiện tại</div></div>
                    <div style={{fontWeight:'700',color:'#343C6A'}}>{isLoggedIn?w.bal:"0₫"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Biểu đồ xu hướng */}
          <div className="row">
            <div className="col-1" style={{flex:1}}>
              <div className="section-header"><h2 className="section-title">Xu hướng chi tiêu trong tháng</h2></div>
              <div className="chart-card" style={{padding:'20px'}}>
                <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none">
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#E6EFF5" strokeDasharray="5,5"/><line x1="0" y1="80" x2="600" y2="80" stroke="#E6EFF5" strokeDasharray="5,5"/><line x1="0" y1="120" x2="600" y2="120" stroke="#E6EFF5" strokeDasharray="5,5"/><line x1="0" y1="160" x2="600" y2="160" stroke="#E6EFF5" strokeDasharray="5,5"/>
                  <path d="M0,170 C50,100 100,160 150,140 C200,120 230,100 280,110 C320,120 350,30 380,30 C410,30 430,90 460,110 C490,130 510,60 540,60 C570,60 590,120 600,130" fill="none" stroke="#1814F3" strokeWidth="3"/>
                  <path d="M0,170 C50,100 100,160 150,140 C200,120 230,100 280,110 C320,120 350,30 380,30 C410,30 430,90 460,110 C490,130 510,60 540,60 C570,60 590,120 600,130 L600,200 L0,200 Z" fill="rgba(24,20,243,0.08)"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

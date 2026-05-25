"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

export default function Reports() {
  const { isLoggedIn } = useAppContext();
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="reports" />
      <main className="main-content" style={{background:'#F8F9FB'}}>
        <nav className="navbar" style={{background:'#fff',borderBottom:'1px solid #E6EFF5'}}>
          <h1 className="page-title" style={{color:'#343C6A'}}>Báo cáo & Xuất dữ liệu</h1>
          <div className="nav-actions">
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=5" alt="Avatar" className="avatar"/> : <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px',marginBottom:'24px'}}>
            {[{title:'Xuất PDF',desc:'Bảng tổng hợp thu chi kèm biểu đồ',icon:'📄',bg:'#FE5C73'},{title:'Xuất Excel',desc:'Toàn bộ giao dịch dạng bảng tính',icon:'📊',bg:'#16DBCC'},{title:'Xuất CSV',desc:'Dữ liệu thô để import vào app khác',icon:'📁',bg:'#1814F3'}].map((x,i)=>(
              <div key={i} style={{background:'#fff',borderRadius:'20px',padding:'30px',border:'1px solid #E6EFF5',textAlign:'center',cursor:'pointer',transition:'transform 0.2s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                <div style={{width:'60px',height:'60px',borderRadius:'50%',background:`${x.bg}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>{x.icon}</div>
                <h3 style={{color:'#343C6A',marginBottom:'8px'}}>{x.title}</h3>
                <p style={{color:'#718EBF',fontSize:'14px',marginBottom:'16px'}}>{x.desc}</p>
                <button style={{background:x.bg,color:'#fff',padding:'10px 24px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer',opacity:isLoggedIn?1:0.5}} disabled={!isLoggedIn}>Tải xuống</button>
              </div>
            ))}
          </div>
          <h2 className="section-title" style={{marginBottom:'16px'}}>Bộ lọc trước khi xuất</h2>
          <div style={{background:'#fff',borderRadius:'20px',padding:'24px',border:'1px solid #E6EFF5',marginBottom:'24px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px'}}>
              {[{l:'Từ ngày',t:'date'},{l:'Đến ngày',t:'date'},{l:'Danh mục',t:'select'},{l:'Loại giao dịch',t:'select'}].map((f,i)=>(
                <div key={i}><label style={{display:'block',marginBottom:'8px',color:'#343C6A',fontWeight:'500',fontSize:'14px'}}>{f.l}</label>
                  {f.t==='date'?<input type="date" disabled={!isLoggedIn} style={{width:'100%',padding:'10px',border:'1px solid #E6EFF5',borderRadius:'10px',background:'#F8F9FB',color:'#343C6A',fontSize:'14px'}}/>:
                  <select disabled={!isLoggedIn} style={{width:'100%',padding:'10px',border:'1px solid #E6EFF5',borderRadius:'10px',background:'#F8F9FB',color:'#343C6A',fontSize:'14px'}}><option>Tất cả</option></select>}
                </div>
              ))}
            </div>
          </div>
          <h2 className="section-title" style={{marginBottom:'16px'}}>Lịch sử xuất báo cáo</h2>
          <div style={{background:'#fff',borderRadius:'20px',padding:'24px',border:'1px solid #E6EFF5'}}>
            {isLoggedIn?[{name:'Báo_cáo_T5_2026.pdf',date:'20/05/2026',size:'2.4 MB'},{name:'Giao_dich_T4_2026.xlsx',date:'01/05/2026',size:'1.1 MB'},{name:'Dữ_liệu_Q1_2026.csv',date:'01/04/2026',size:'856 KB'}].map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',padding:'14px 0',borderBottom:i<2?'1px solid #E6EFF5':'none'}}>
                <span style={{fontSize:'20px',marginRight:'15px'}}>📎</span>
                <div style={{flex:1}}><div style={{fontWeight:'600',color:'#343C6A'}}>{f.name}</div><div style={{fontSize:'12px',color:'#718EBF'}}>{f.date} • {f.size}</div></div>
                <button style={{border:'1px solid #2D60FF',color:'#2D60FF',background:'transparent',padding:'6px 16px',borderRadius:'8px',cursor:'pointer'}}>Tải lại</button>
              </div>
            )):<p style={{color:'#718EBF',textAlign:'center',padding:'30px'}}>Vui lòng đăng nhập để xem lịch sử</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

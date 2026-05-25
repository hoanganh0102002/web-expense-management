"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

export default function Notifications() {
  const { isLoggedIn } = useAppContext();
  const notifs = [
    {title:'Cảnh báo ngân sách',desc:'Mua sắm đã đạt 90% ngân sách',time:'2 phút trước',type:'warning',icon:'⚠️',read:false},
    {title:'Giao dịch định kỳ',desc:'Tiền thuê nhà đã tự động ghi nhận',time:'1 giờ trước',type:'info',icon:'🔄',read:false},
    {title:'Vượt ngân sách!',desc:'Tiền thuê đã sử dụng 100%',time:'3 giờ trước',type:'danger',icon:'🚨',read:false},
    {title:'Tóm tắt tuần',desc:'Chi 2.350.000₫, giảm 15% so với tuần trước',time:'1 ngày trước',type:'success',icon:'📊',read:true},
    {title:'Nhắc nhở',desc:'Chưa ghi nhận chi tiêu hôm qua',time:'1 ngày trước',type:'reminder',icon:'📝',read:true},
  ];
  const tc:Record<string,{bg:string,b:string}>={warning:{bg:'#FFF5D9',b:'#FF9800'},info:{bg:'#E7EDFF',b:'#1814F3'},danger:{bg:'#FFE0EB',b:'#FE5C73'},success:{bg:'#DCFAF8',b:'#16DBCC'},reminder:{bg:'#F3E8FF',b:'#9966FF'}};

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="notifications" />
      <main className="main-content" style={{background:'#F8F9FB'}}>
        <nav className="navbar" style={{background:'#fff',borderBottom:'1px solid #E6EFF5'}}>
          <h1 className="page-title" style={{color:'#343C6A'}}>Thông báo</h1>
          <div className="nav-actions">
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=5" alt="Avatar" className="avatar"/> : <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'24px'}}>
            <div style={{background:'linear-gradient(135deg,#FE5C73,#FF8A65)',borderRadius:'16px',padding:'20px',color:'#fff'}}><div style={{fontSize:'28px',fontWeight:'800'}}>{isLoggedIn?3:0}</div><div>Chưa đọc</div></div>
            <div style={{background:'linear-gradient(135deg,#FF9800,#FFB74D)',borderRadius:'16px',padding:'20px',color:'#fff'}}><div style={{fontSize:'28px',fontWeight:'800'}}>{isLoggedIn?1:0}</div><div>Cảnh báo</div></div>
            <div style={{background:'linear-gradient(135deg,#1814F3,#6366F1)',borderRadius:'16px',padding:'20px',color:'#fff'}}><div style={{fontSize:'28px',fontWeight:'800'}}>{isLoggedIn?1:0}</div><div>GD tự động</div></div>
          </div>
          {(isLoggedIn?notifs:[]).map((n,i)=>(
            <div key={i} style={{background:'#fff',borderRadius:'16px',padding:'20px',border:`1px solid ${n.read?'#E6EFF5':tc[n.type].b}`,borderLeft:`4px solid ${tc[n.type].b}`,display:'flex',alignItems:'center',gap:'16px',opacity:n.read?0.7:1,marginBottom:'12px'}}>
              <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',background:tc[n.type].bg}}>{n.icon}</div>
              <div style={{flex:1}}><div style={{fontWeight:'700',color:'#343C6A'}}>{n.title}</div><div style={{fontSize:'14px',color:'#718EBF'}}>{n.desc}</div></div>
              <span style={{color:'#B1B5C3',fontSize:'13px'}}>{n.time}</span>
            </div>
          ))}
          {!isLoggedIn && <p style={{color:'#718EBF',textAlign:'center',padding:'40px',background:'#fff',borderRadius:'16px',border:'1px solid #E6EFF5'}}>Vui lòng đăng nhập để xem thông báo</p>}
        </div>
      </main>
    </div>
  );
}

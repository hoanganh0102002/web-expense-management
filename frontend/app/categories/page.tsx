"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

export default function Categories() {
  const { isLoggedIn, transactions } = useAppContext();
  
  const getCount = (catName: string) => {
    return transactions.filter(t => t.category === catName || t.type === catName).length;
  };

  const defaultCats = [
    {name:'Ăn uống',icon:'🍜',color:'#FF6384',sub:['Cà phê','Nhà hàng','Đồ ăn vặt'],count:getCount('Ăn uống')},
    {name:'Di chuyển',icon:'🚗',color:'#36A2EB',sub:['Grab','Xăng','Bảo trì xe'],count:getCount('Di chuyển')},
    {name:'Mua sắm',icon:'🛍️',color:'#FFCE56',sub:['Quần áo','Điện tử','Gia dụng'],count:getCount('Mua sắm')},
    {name:'Giải trí',icon:'🎮',color:'#4BC0C0',sub:['Phim','Game','Du lịch'],count:getCount('Giải trí')},
    {name:'Y tế',icon:'🏥',color:'#9966FF',sub:['Thuốc','Khám bệnh','Bảo hiểm'],count:getCount('Y tế')},
    {name:'Giáo dục',icon:'📚',color:'#FF9F40',sub:['Khóa học','Sách','Học phí'],count:getCount('Giáo dục')},
    {name:'Hóa đơn',icon:'📋',color:'#E83E8C',sub:['Điện','Nước','Internet'],count:getCount('Hóa đơn')},
    {name:'Tiền thuê',icon:'🏠',color:'#6F42C1',sub:['Nhà ở','Kho bãi'],count:getCount('Tiền thuê')},
  ];
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="categories" />
      <main className="main-content" style={{background:'#FFFFFF'}}>
        <nav className="navbar" style={{background:'#fff',borderBottom:'1px solid #E6EFF5'}}>
          <h1 className="page-title" style={{color:'#343C6A'}}>Quản lý Danh mục</h1>
          <div className="nav-actions">
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}>+ Tạo danh mục mới</button>
            {isLoggedIn ? <img src="https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4" alt="Avatar" className="avatar"/> : <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px'}}>
            {defaultCats.map((cat,i)=>(
              <div key={i} style={{background:'#fff',borderRadius:'20px',padding:'24px',border:'1px solid #E6EFF5',transition:'transform 0.2s',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-4px)')} onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                <div style={{display:'flex',alignItems:'center',gap:'15px',marginBottom:'16px'}}>
                  <div style={{width:'50px',height:'50px',borderRadius:'15px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',background:`${cat.color}15`}}>{cat.icon}</div>
                  <div><div style={{fontWeight:'700',fontSize:'16px',color:'#343C6A'}}>{cat.name}</div><div style={{fontSize:'13px',color:'#718EBF'}}>{cat.count} giao dịch</div></div>
                </div>
                <div style={{borderTop:'1px solid #E6EFF5',paddingTop:'12px'}}>
                  <div style={{fontSize:'12px',color:'#718EBF',marginBottom:'8px'}}>Danh mục con:</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                    {cat.sub.map((s,j)=>(<span key={j} style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',background:`${cat.color}15`,color:cat.color,fontWeight:'500'}}>{s}</span>))}
                  </div>
                </div>
                <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
                  <button style={{flex:1,border:'1px solid #2D60FF',color:'#2D60FF',background:'transparent',padding:'6px',borderRadius:'8px',cursor:'pointer',fontSize:'12px'}}>Sửa</button>
                  <button style={{flex:1,border:'1px solid #FE5C73',color:'#FE5C73',background:'transparent',padding:'6px',borderRadius:'8px',cursor:'pointer',fontSize:'12px'}}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

export default function Transactions() {
  const { isLoggedIn, transactions, addTransaction } = useAppContext();
  const [activeTab, setActiveTab] = useState('all');
  
  const handleAdd = () => {
    const title = prompt('Nhập tên giao dịch:');
    if (!title) return;
    const amountStr = prompt('Nhập số tiền (VD: -50000 hoặc 100000):');
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    
    addTransaction({
      desc: title,
      id: `#TXN00${transactions.length + 1}`,
      type: amount > 0 ? 'Thu nhập' : 'Chi tiêu',
      cat: 'Khác',
      date: new Date().toLocaleDateString('vi-VN'),
      amount: amount,
      color: amount > 0 ? '#16DBCC' : '#FE5C73',
      icon: '💸'
    });
  };

  const filtered = activeTab==='all'?transactions:activeTab==='income'?transactions.filter(t=>t.type==='Thu nhập'):transactions.filter(t=>t.type==='Chi tiêu');

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="transactions" />
      <main className="main-content" style={{background:'#F8F9FB'}}>
        <nav className="navbar" style={{background:'#fff',borderBottom:'1px solid #E6EFF5'}}>
          <h1 className="page-title" style={{color:'#343C6A'}}>Giao dịch</h1>
          <div className="nav-actions">
            <div className="search-bar" style={{background:'#F8F9FB'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="#718EBF"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><input type="text" placeholder="Tìm giao dịch..." /></div>
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}} onClick={handleAdd}>+ Thêm giao dịch</button>
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=5" alt="Avatar" className="avatar"/> : <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div style={{display:'flex',gap:'30px',borderBottom:'1px solid #E6EFF5',marginBottom:'20px'}}>
            {[{k:'all',l:'Tất cả'},{k:'income',l:'Thu nhập'},{k:'expense',l:'Chi tiêu'}].map(t=>(
              <div key={t.k} onClick={()=>setActiveTab(t.k)} style={{paddingBottom:'10px',color:activeTab===t.k?'#1814F3':'#718EBF',borderBottom:activeTab===t.k?'3px solid #1814F3':'none',fontWeight:activeTab===t.k?'600':'400',cursor:'pointer'}}>{t.l}</div>
            ))}
          </div>
          <div style={{background:'#fff',borderRadius:'20px',padding:'24px',border:'1px solid #E6EFF5'}}>
            <table style={{width:'100%',borderCollapse:'collapse',textAlign:'left',color:'#343C6A',fontSize:'15px'}}>
              <thead style={{color:'#718EBF',borderBottom:'1px solid #E6EFF5'}}>
                <tr><th style={{padding:'14px 8px',fontWeight:'500'}}>Mô tả</th><th style={{padding:'14px 8px',fontWeight:'500'}}>Mã GD</th><th style={{padding:'14px 8px',fontWeight:'500'}}>Loại</th><th style={{padding:'14px 8px',fontWeight:'500'}}>Danh mục</th><th style={{padding:'14px 8px',fontWeight:'500'}}>Ngày</th><th style={{padding:'14px 8px',fontWeight:'500'}}>Số tiền</th><th style={{padding:'14px 8px',fontWeight:'500'}}>Thao tác</th></tr>
              </thead>
              <tbody>
                {filtered.map((x,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #E6EFF5'}}>
                    <td style={{padding:'14px 8px',display:'flex',alignItems:'center',gap:'12px'}}><span style={{fontSize:'20px'}}>{x.icon}</span><span style={{fontWeight:600}}>{x.desc}</span></td>
                    <td style={{padding:'14px 8px'}}>{x.id}</td>
                    <td style={{padding:'14px 8px'}}><span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'600',background:x.type==='Thu nhập'?'#DCFAF8':x.type==='Chi tiêu'?'#FFE0EB':'#FFF5D9',color:x.type==='Thu nhập'?'#16DBCC':x.type==='Chi tiêu'?'#FE5C73':'#FF9800'}}>{x.type}</span></td>
                    <td style={{padding:'14px 8px'}}>{x.cat}</td>
                    <td style={{padding:'14px 8px'}}>{x.date}</td>
                    <td style={{padding:'14px 8px',color:x.color,fontWeight:'600'}}>{isLoggedIn ? (x.amount > 0 ? '+' : '') + x.amount.toLocaleString('vi-VN') + '₫' : "0₫"}</td>
                    <td style={{padding:'14px 8px',display:'flex',gap:'8px'}}><button style={{border:'1px solid #2D60FF',color:'#2D60FF',background:'transparent',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'12px'}}>Sửa</button><button style={{border:'1px solid #FE5C73',color:'#FE5C73',background:'transparent',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'12px'}}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:'10px',marginTop:'20px',color:'#1814F3'}}>
              <span style={{cursor:'pointer',color:'#718EBF'}}>← Trước</span>
              <div style={{width:'30px',height:'30px',background:'#1814F3',color:'white',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px'}}>1</div>
              <div style={{width:'30px',height:'30px',color:'#1814F3',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>2</div>
              <span style={{cursor:'pointer'}}>Sau →</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

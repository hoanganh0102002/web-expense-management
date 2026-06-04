"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from './components/Sidebar';
import { useAppContext } from './context/AppContext';

export default function Dashboard() {
  const { isLoggedIn, wallets, transactions, isLoadingWallets } = useAppContext();
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const [showBalance, setShowBalance] = useState(false);

// Tính toán số liệu từ dữ liệu thật
  const visibleWallets = Array.isArray(wallets) ? wallets.filter(w => !w.is_hidden) : [];
  const totalBalance = visibleWallets.reduce((sum, w) => sum + parseFloat(w.available_balance || 0), 0);
  
  const totalIncome = safeTransactions
    .filter(t => t.type === 'income' || t.type === 'Thu nhập')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
  const totalExpense = safeTransactions
    .filter(t => t.type === 'expense' || t.type === 'Chi tiêu')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getWalletTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'Tiền mặt';
      case 'bank': return 'Ngân hàng';
      case 'ewallet': return 'Ví điện tử';
      case 'crypto': return 'Tiền mã hóa';
      default: return 'Ví';
    }
  };

  const getWalletTypeIcon = (type: string) => {
    switch (type) {
      case 'cash': return '💵';
      case 'bank': return '🏦';
      case 'ewallet': return '💳';
      case 'crypto': return '🪙';
      default: return '👛';
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="dashboard" />
      <main className="main-content" style={{background:'#FFFFFF'}}>
        <nav className="navbar">
          <h1 className="page-title">Tổng quan</h1>
          <div className="nav-actions">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-light)">
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input type="text" placeholder="Tìm kiếm..." />
            </div>
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'24px',fontWeight:'600',border:'none',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',gap:'8px',whiteSpace:'nowrap'}}>+ Thêm báo cáo</button>
            <button className="icon-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </button>
            {isLoggedIn ? <img src="https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4" alt="Avatar" className="avatar"/> : <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div className="balance-overview">
            <div className="balance-item">
              <div className="balance-label">Tổng thu nhập</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(totalIncome) : "0₫"}</div>
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">Tổng chi tiêu</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(totalExpense) : "0₫"}</div>
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">Số dư ròng</div>
              <div className="balance-val" style={{color: isLoggedIn && (totalIncome - totalExpense) >= 0 ? '#16DBCC' : '#FE5C73'}}>
                {isLoggedIn ? formatCurrency(totalIncome - totalExpense) : "0₫"}
              </div>
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">Tổng số dư ví</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(totalBalance) : "0₫"}</div>
            </div>
          </div>

          <div className="row">
            <div className="col-2" style={{flex:1.8}}>
              <div className="section-header"><h2 className="section-title">Thu nhập vs Chi tiêu</h2></div>
              <div className="chart-card">
                <div className="bar-chart-mock">
                  <div className="bar-legend">
                    <span><div className="dot diposit"></div> Thu nhập</span>
                    <span><div className="dot withdraw"></div> Chi tiêu</span>
                  </div>
                  <div className="bars-container" style={{ justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    {!isLoggedIn || transactions.length === 0 ? (
                      <p style={{ color: '#718EBF' }}>Chưa có dữ liệu giao dịch</p>
                    ) : (
                      <p style={{ color: '#1814F3' }}>Đang đồng bộ biểu đồ...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-1" style={{flex:1.2}}>
              <div className="section-header"><h2 className="section-title">Phân bổ chi tiêu</h2></div>
              <div className="chart-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {!isLoggedIn || transactions.length === 0 ? (
                  <p style={{ color: '#718EBF' }}>Chưa có dữ liệu</p>
                ) : (
                  <svg width="160" height="160" viewBox="0 0 200 200" style={{transform:'rotate(-90deg)'}}>
                    <circle cx="100" cy="100" r="80" fill="transparent" stroke="#E6EFF5" strokeWidth="40" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-1" style={{flex:1}}>
              <div className="section-header"><h2 className="section-title">Giao dịch gần đây</h2></div>
              <div className="transactions-card">
                {!isLoggedIn || transactions.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#718EBF' }}>Không có giao dịch nào</div>
                ) : (
                  transactions.slice(0, 4).map((x, i) => {
                    const isExpense = x.type === 'expense' || x.type === 'Chi tiêu';
                    const title = x.title || x.desc || 'Giao dịch';
                    const date = x.transaction_date ? new Date(x.transaction_date).toLocaleDateString('vi-VN') : x.date || '';
                    const amt = parseFloat(x.amount);
                    return (
                      <div className="transaction-item" key={i}>
                        <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',background:'#F8F9FB',marginRight:'15px'}}>
                          {x.icon || (isExpense ? '💸' : '💰')}
                        </div>
                        <div className="tx-details">
                          <div className="tx-title">{title}</div>
                          <div className="tx-date">{date}</div>
                        </div>
                        <div className="tx-amount" style={{color: isExpense ? '#FE5C73' : '#16DBCC'}}>
                          {(isExpense ? '-' : '+') + formatCurrency(amt)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="col-1" style={{flex:1}}>
              <div className="section-header"><h2 className="section-title">Ngân sách</h2></div>
              <div className="transactions-card" style={{height:'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '150px'}}>
                  <p style={{ textAlign: 'center', color: '#718EBF' }}>Đang phát triển tính năng ngân sách</p>
              </div>
            </div>

            <div className="col-1" style={{flex:1}}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title">Ví của tôi</h2>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center' }}
                  title={showBalance ? "Ẩn số dư" : "Hiện số dư"}
                >
                  {showBalance ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="transactions-card" style={{height:'auto'}}>
                {isLoadingWallets ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
                ) : !isLoggedIn || visibleWallets.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#718EBF' }}>Chưa có ví hiển thị nào</div>
                ) : (
                  visibleWallets.slice(0, 3).map((w, i) => (
                    <div className="transaction-item" key={i} style={{marginBottom:'12px'}}>
                      <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',background: '#E7EDFF',marginRight:'15px'}}>
                        {getWalletTypeIcon(w.type)}
                      </div>
                      <div className="tx-details">
                        <div className="tx-title">{w.name}</div>
                        <div className="tx-date">{getWalletTypeLabel(w.type)}</div>
                      </div>
                      <div style={{fontWeight:'700',color:'#343C6A'}}>
                        {showBalance ? formatCurrency(parseFloat(w.available_balance)) : "********"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

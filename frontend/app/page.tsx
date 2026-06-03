"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from './components/Sidebar';
import { useAppContext } from './context/AppContext';
import { useLanguage } from './lib/translations';

export default function Dashboard() {
  const { isLoggedIn, wallets, transactions, isLoadingWallets, userData } = useAppContext();
  const { t } = useLanguage();

  // Tính toán số liệu từ dữ liệu thật
  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.available_balance || 0), 0);
  const totalIncome = transactions.filter(txn => txn.type === 'Thu nhập' || txn.type === t('income')).reduce((sum, txn) => sum + txn.amount, 0);
  const totalExpense = transactions.filter(txn => txn.type === 'Chi tiêu' || txn.type === t('spending')).reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const displayName = userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user');

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="dashboard" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar">
          <h1 className="page-title">{t('dashboard')}</h1>
          <div className="nav-actions">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-light)">
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input type="text" placeholder={t('search_placeholder')} />
            </div>
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'24px',fontWeight:'600',border:'none',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',gap:'8px',whiteSpace:'nowrap'}}>{t('add_report')}</button>
            <div style={{background: '#F5F7FA', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb300', cursor: 'pointer', fontSize: '20px'}}>
              🔔
            </div>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>{displayName}</span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>{t('login')}</Link>
            )}
          </div>
        </nav>
        <div className="content-area">
          <div className="balance-overview">
            <div className="balance-item">
              <div className="balance-label">{t('total_income')}</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(totalIncome) : "0₫"}</div>
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">{t('total_expense')}</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(totalExpense) : "0₫"}</div>
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">{t('net_balance')}</div>
              <div className="balance-val" style={{color: isLoggedIn && (totalIncome - totalExpense) >= 0 ? '#16DBCC' : '#FE5C73'}}>
                {isLoggedIn ? formatCurrency(totalIncome - totalExpense) : "0₫"}
              </div>
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">{t('total_wallet_balance')}</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(totalBalance) : "0₫"}</div>
            </div>
          </div>

          <div className="row">
            <div className="col-2" style={{flex:1.8}}>
              <div className="section-header"><h2 className="section-title">{t('income_vs_expense')}</h2></div>
              <div className="chart-card">
                <div className="bar-chart-mock">
                  <div className="bar-legend">
                    <span><div className="dot diposit"></div> {t('income')}</span>
                    <span><div className="dot withdraw"></div> {t('spending')}</span>
                  </div>
                  <div className="bars-container" style={{ justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    {!isLoggedIn || transactions.length === 0 ? (
                      <p style={{ color: '#718EBF' }}>{t('no_transaction_data')}</p>
                    ) : (
                      <p style={{ color: '#1814F3' }}>{t('syncing_chart')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-1" style={{flex:1.2}}>
              <div className="section-header"><h2 className="section-title">{t('expense_allocation')}</h2></div>
              <div className="chart-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {!isLoggedIn || transactions.length === 0 ? (
                  <p style={{ color: '#718EBF' }}>{t('no_data')}</p>
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
              <div className="section-header"><h2 className="section-title">{t('recent_transactions')}</h2></div>
              <div className="transactions-card">
                {!isLoggedIn || transactions.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#718EBF' }}>{t('no_transactions')}</div>
                ) : (
                  transactions.slice(0, 4).map((x, i) => (
                    <div className="transaction-item" key={i}>
                      <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',background:'var(--bg-color)',marginRight:'15px'}}>{x.icon || '💸'}</div>
                      <div className="tx-details"><div className="tx-title">{x.desc}</div><div className="tx-date">{x.date}</div></div>
                      <div className="tx-amount" style={{color: x.amount < 0 ? '#FE5C73' : '#16DBCC'}}>{formatCurrency(x.amount)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="col-1" style={{flex:1}}>
              <div className="section-header"><h2 className="section-title">{t('budget')}</h2></div>
              <div className="transactions-card" style={{height:'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '150px'}}>
                  <p style={{ textAlign: 'center', color: '#718EBF' }}>{t('developing_budget')}</p>
              </div>
            </div>

            <div className="col-1" style={{flex:1}}>
              <div className="section-header"><h2 className="section-title">{t('wallets')}</h2></div>
              <div className="transactions-card" style={{height:'auto'}}>
                {isLoadingWallets ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>{t('loading')}</div>
                ) : !isLoggedIn || wallets.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#718EBF' }}>{t('no_wallets')}</div>
                ) : (
                  wallets.slice(0, 3).map((w, i) => (
                    <div className="transaction-item" key={i} style={{marginBottom:'12px'}}>
                      <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',background: '#E7EDFF',marginRight:'15px'}}>🏦</div>
                      <div className="tx-details"><div className="tx-title">{w.wallet_name}</div><div className="tx-date">{w.account_name || t('main_account')}</div></div>
                      <div style={{fontWeight:'700',color:'var(--text-main)'}}>{formatCurrency(parseFloat(w.available_balance))}</div>
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

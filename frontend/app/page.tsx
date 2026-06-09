"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from './components/Sidebar';
import { useAppContext } from './context/AppContext';
import { useLanguage } from './lib/translations';
import { budgetApi } from './lib/api';

export default function Dashboard() {
  const { isLoggedIn, wallets, transactions, isLoadingWallets, userData } = useAppContext();
  const { t } = useLanguage();
  const [showWalletBalance, setShowWalletBalance] = useState(true);
  const [budgetsList, setBudgetsList] = useState<any[]>([]);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);

  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    if (isLoggedIn) {
      setIsLoadingBudget(true);
      budgetApi.getAll(currentMonth, currentYear)
        .then(res => {
          setBudgetsList(res.data || []);
        })
        .catch(err => {
          console.error("Error fetching budgets on dashboard:", err);
        })
        .finally(() => {
          setIsLoadingBudget(false);
        });
    }
  }, [isLoggedIn, currentMonth, currentYear]);

  const handleCopyBudgets = async () => {
    const fromMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const fromYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    if (window.confirm(`Bạn có muốn sao chép toàn bộ hạn mức ngân sách từ tháng ${fromMonth}/${fromYear} sang tháng ${currentMonth}/${currentYear} không?`)) {
      setIsLoadingBudget(true);
      try {
        const res = await budgetApi.copy({
          from_month: fromMonth,
          from_year: fromYear,
          to_month: currentMonth,
          to_year: currentYear
        });
        alert(`Sao chép thành công! Đã sao chép ${res.data?.length || 0} mục hạn mức.`);
        const budgetsRes = await budgetApi.getAll(currentMonth, currentYear);
        setBudgetsList(budgetsRes.data || []);
      } catch (error: any) {
        alert(error.message || 'Không tìm thấy ngân sách nguồn để sao chép!');
      } finally {
        setIsLoadingBudget(false);
      }
    }
  };

  // Calculate overall budget stats
  const overallBudget = budgetsList.find(b => b.category_id === null);
  const categoryBudgets = budgetsList.filter(b => b.category_id !== null);

  const totalLimit = overallBudget 
    ? parseFloat(overallBudget.limit_amount) 
    : categoryBudgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0);

  const totalUsed = overallBudget 
    ? parseFloat(overallBudget.used_amount) 
    : categoryBudgets.reduce((sum, b) => sum + parseFloat(b.used_amount), 0);

  const totalPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

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
              <div className="section-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 className="section-title">{t('budget')}</h2>
                {isLoggedIn && budgetsList.length > 0 && (
                  <Link href="/budget" style={{fontSize:'13px', color:'#1814F3', fontWeight:'600', textDecoration:'none'}}>
                    {t('details') || 'Chi tiết'}
                  </Link>
                )}
              </div>
              <div className="transactions-card" style={{height:'auto', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px'}}>
                {isLoadingBudget ? (
                  <div style={{ textAlign: 'center', color: '#718EBF' }}>{t('loading')}</div>
                ) : !isLoggedIn ? (
                  <div style={{ textAlign: 'center', color: '#718EBF' }}>
                    <p style={{marginBottom: '10px'}}>{t('please_login')}</p>
                    <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'6px 12px',borderRadius:'15px',fontWeight:'bold', fontSize:'13px'}}>{t('login')}</Link>
                  </div>
                ) : budgetsList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#718EBF' }}>
                    <p style={{fontSize: '14px', margin: 0}}>{t('no_budget_set') || 'Chưa thiết lập ngân sách tháng này'}</p>
                    <div style={{display:'flex', gap:'8px', justifyContent:'center', marginTop:'12px', flexWrap:'wrap'}}>
                      <Link href="/budget" style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#1814F3',
                        color: '#fff',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        {t('set_budget')}
                      </Link>
                      <button 
                        onClick={handleCopyBudgets}
                        disabled={isLoadingBudget}
                        style={{
                          padding: '8px 16px',
                          background: 'transparent',
                          color: '#1814F3',
                          borderRadius: '10px',
                          border: '1px solid #1814F3',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {t('copy_from_previous_month')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', gap:'12px', width:'100%'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontWeight:'700', color:'var(--text-main)', fontSize:'15px'}}>
                        {overallBudget ? t('total_monthly_budget') : (t('category_budgets') || 'Ngân sách danh mục')}
                      </span>
                      <span style={{fontSize:'14px', fontWeight:'700', color: totalPct >= 100 ? '#FE5C73' : totalPct >= 80 ? '#FF9800' : '#16DBCC'}}>
                        {totalPct}%
                      </span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div style={{width:'100%', height:'12px', background:'var(--bg-color)', borderRadius:'6px', overflow:'hidden'}}>
                      <div style={{
                        width: `${Math.min(totalPct, 100)}%`,
                        height: '100%',
                        background: totalPct >= 100 ? '#FE5C73' : totalPct >= 80 ? '#FF9800' : '#16DBCC',
                        borderRadius: '6px',
                        transition: 'width 0.6s ease-in-out'
                      }}></div>
                    </div>
                    
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#718EBF'}}>
                      <div>
                        <span style={{fontWeight:'600', color:'var(--text-main)'}}>{formatCurrency(totalUsed)}</span>
                        <span> / {formatCurrency(totalLimit)}</span>
                      </div>
                    </div>

                    <div style={{fontSize:'12px', marginTop:'2px'}}>
                      {totalUsed > totalLimit ? (
                        <span style={{color:'#FE5C73', fontWeight:'600'}}>
                          🚨 {t('over_budget') || 'Vượt ngân sách!'} ({formatCurrency(totalUsed - totalLimit)})
                        </span>
                      ) : (
                        <span style={{color:'#16DBCC', fontWeight:'600'}}>
                          ✓ {t('remaining_label') || 'Còn lại:'} {formatCurrency(totalLimit - totalUsed)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-1" style={{flex:1}}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title">{t('wallets')}</h2>
                <button 
                  onClick={() => setShowWalletBalance(!showWalletBalance)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718EBF', display: 'flex', alignItems: 'center', padding: '5px' }}
                  title={showWalletBalance ? "Ẩn số tiền" : "Hiện số tiền"}
                >
                  {showWalletBalance ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
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
                      <div style={{fontWeight:'700',color:'var(--text-main)'}}>{showWalletBalance ? formatCurrency(parseFloat(w.available_balance)) : '******'}</div>
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

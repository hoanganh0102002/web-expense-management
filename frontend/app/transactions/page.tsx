"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';

export default function Transactions() {
  const { isLoggedIn, transactions, addTransaction, userData } = useAppContext();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({ title: '', amount: '', type: t('spending'), category: t('food') || 'Ăn uống' });
  const [activeTab, setActiveTab] = useState('all');

  const handleAdd = () => setIsModalOpen(true);
  
  const submitAdd = () => {
    if (!newTx.title || !newTx.amount) return;
    const amt = parseInt(newTx.amount);
    addTransaction({
      desc: newTx.title,
      id: `#TXN00${transactions.length + 1}`,
      type: newTx.type,
      cat: newTx.category,
      date: new Date().toLocaleDateString('vi-VN'),
      amount: amt,
      color: (newTx.type === 'Thu nhập' || newTx.type === t('income')) ? '#16DBCC' : '#FE5C73',
      icon: '💸'
    });
    setNewTx({ title: '', amount: '', type: t('spending'), category: t('food') || 'Ăn uống' });
    setIsModalOpen(false);
  };

  const filtered = activeTab==='all'?transactions:activeTab==='income'?transactions.filter(t=>t.type==='Thu nhập' || t.type===t('income')):transactions.filter(t=>t.type==='Chi tiêu' || t.type===t('spending'));

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="transactions" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar" style={{background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)'}}>
          <h1 className="page-title" style={{color:'var(--text-main)'}}>{t('transactions')}</h1>
          <div className="nav-actions">
            <div className="search-bar" style={{background: 'var(--bg-color)'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="#718EBF"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg><input type="text" placeholder={t('search_tx_placeholder')} /></div>
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'24px',fontWeight:'600',border:'none',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',gap:'8px'}} onClick={handleAdd}>{t('add_transaction')}</button>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: '600', color: '#343C6A', fontSize: '15px' }}>
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span>
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
          <div style={{display:'flex',gap:'30px',borderBottom:'1px solid #E6EFF5',marginBottom:'20px'}}>
            {[{k:'all',l:t('all')},{k:'income',l:t('income')},{k:'expense',l:t('spending')}].map(tab=>(
              <div key={tab.k} onClick={()=>setActiveTab(tab.k)} style={{paddingBottom:'10px',color:activeTab===tab.k?'#1814F3':'#718EBF',borderBottom:activeTab===tab.k?'3px solid #1814F3':'none',fontWeight:activeTab===tab.k?'600':'400',cursor:'pointer'}}>{tab.l}</div>
            ))}
          </div>
          <div style={{background: 'var(--card-bg)',borderRadius:'20px',padding:'24px',border: '1px solid var(--border-color)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',textAlign:'left',color: 'var(--text-main)',fontSize:'15px'}}>
              <thead style={{color:'#718EBF',borderBottom:'1px solid #E6EFF5'}}>
                <tr><th style={{padding:'14px 8px',fontWeight:'500'}}>{t('description')}</th><th style={{padding:'14px 8px',fontWeight:'500'}}>{t('tx_id')}</th><th style={{padding:'14px 8px',fontWeight:'500'}}>{t('language_label')}</th><th style={{padding:'14px 8px',fontWeight:'500'}}>{t('categories')}</th><th style={{padding:'14px 8px',fontWeight:'500'}}>{t('date_label')}</th><th style={{padding:'14px 8px',fontWeight:'500'}}>{t('amount_label')}</th><th style={{padding:'14px 8px',fontWeight:'500'}}>{t('actions')}</th></tr>
              </thead>
              <tbody>
                {filtered.map((x,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #E6EFF5'}}>
                    <td style={{padding:'14px 8px',display:'flex',alignItems:'center',gap:'12px'}}><span style={{fontSize:'20px'}}>{x.icon}</span><span style={{fontWeight:600}}>{x.desc}</span></td>
                    <td style={{padding:'14px 8px'}}>{x.id}</td>
                    <td style={{padding:'14px 8px'}}><span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'600',background:(x.type==='Thu nhập' || x.type===t('income'))?'#DCFAF8':(x.type==='Chi tiêu' || x.type===t('spending'))?'#FFE0EB':'#FFF5D9',color:(x.type==='Thu nhập' || x.type===t('income'))?'#16DBCC':(x.type==='Chi tiêu' || x.type===t('spending'))?'#FE5C73':'#FF9800'}}>{x.type}</span></td>
                    <td style={{padding:'14px 8px'}}>{x.cat}</td>
                    <td style={{padding:'14px 8px'}}>{x.date}</td>
                    <td style={{padding:'14px 8px',color:x.color,fontWeight:'600'}}>{isLoggedIn ? (x.amount > 0 ? '+' : '') + x.amount.toLocaleString('vi-VN') + '₫' : "0₫"}</td>
                    <td style={{padding:'14px 8px',display:'flex',gap:'8px'}}><button style={{border:'1px solid #2D60FF',color:'#2D60FF',background:'transparent',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'12px'}}>{t('edit')}</button><button style={{border:'1px solid #FE5C73',color:'#FE5C73',background:'transparent',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'12px'}}>{t('delete')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:'10px',marginTop:'20px',color:'#1814F3'}}>
              <span style={{cursor:'pointer',color:'#718EBF'}}>{t('previous')}</span>
              <div style={{width:'30px',height:'30px',background:'#1814F3',color:'white',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px'}}>1</div>
              <div style={{width:'30px',height:'30px',color:'#1814F3',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>2</div>
              <span style={{cursor:'pointer'}}>{t('next')}</span>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL THÊM GIAO DỊCH */}
      {isModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background: 'var(--card-bg)',borderRadius:'24px',padding:'30px',width:'450px',maxWidth:'90%',boxShadow:'0 10px 40px rgba(0,0,0,0.1)'}}>
             <h2 style={{color: 'var(--text-main)',marginBottom:'20px',fontSize:'20px',fontWeight:'700'}}>{t('add_new_transaction')}</h2>
             
             <div style={{marginBottom:'15px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('transaction_name')}</label>
               <input type="text" value={newTx.title} onChange={e=>setNewTx({...newTx,title:e.target.value})} placeholder={t('tx_name_placeholder')} style={{width:'100%',padding:'14px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}} />
             </div>
             
             <div style={{marginBottom:'15px',display:'flex',gap:'15px'}}>
               <div style={{flex:1}}>
                 <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('language_label')}</label>
                 <select value={newTx.type} onChange={e=>setNewTx({...newTx,type:e.target.value})} style={{width:'100%',padding:'14px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px',appearance:'none'}}>
                    <option>{t('spending')}</option><option>{t('income')}</option>
                 </select>
               </div>
               <div style={{flex:1}}>
                 <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('amount_label')}</label>
                 <input type="number" value={newTx.amount} onChange={e=>setNewTx({...newTx,amount:e.target.value})} placeholder={t('tx_amount_placeholder')} style={{width:'100%',padding:'14px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}} />
               </div>
             </div>

             <div style={{marginBottom:'25px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('categories')}</label>
                 <select value={newTx.category} onChange={e=>setNewTx({...newTx,category:e.target.value})} style={{width:'100%',padding:'14px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px',appearance:'none'}}>
                    <option>{t('food') || 'Ăn uống'}</option><option>{t('shopping_cart') || 'Mua sắm'}</option><option>{t('car') || 'Di chuyển'}</option><option>{t('other')}</option>
                 </select>
             </div>
             
             <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
               <button style={{padding:'12px 24px',background: 'var(--bg-color)',color:'#718EBF',borderRadius:'12px',border: '1px solid var(--border-color)',cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={()=>setIsModalOpen(false)}>{t('cancel')}</button>
               <button style={{padding:'12px 24px',background:'#1814F3',color:'#fff',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={submitAdd}>{t('save_transaction')}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

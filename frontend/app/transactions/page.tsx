"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { apiFetch } from '../lib/api';

const parseIcon = (iconName: string) => {
  const iconMap: Record<string, string> = {
    food: '🍜', car: '🚗', shopping_cart: '🛒', shopping_bag: '🛍️', gamepad: '🎮', 
    beauty: '💇', health: '🏥', heart: '💖', receipt: '📋', house: '🏠', 
    users: '🤝', chart: '📈', book: '📚', salary: '💰', award: '🏆', 
    business: '🏢', profit: '💹', debt: '📉', support: '🤗', building: '🏙️', 
    rings: '💍', grid: '🔲', monitor: '🖥️', cash: '💵', coffee: '☕', 
    baby_clothing: '👶', paw: '🐾', dumbbell: '🏋️', beer: '🍺', suitcase: '🧳', 
    tshirt: '👕', graduation_cap: '🎓', money_bag: '💰', handshake: '🤝',
    lightbulb: '💡', gas_station: '⛽', flower: '🌸', piggy_bank: '🐷',
    restaurant: '🍽️', ticket: '🎫', wallet: '👛', gift: '🎁', airplane: '✈️',
    bank: '🏦', electricity: '⚡', phone_call: '📞', laptop: '💻', headphones: '🎧',
  };
  return iconMap[iconName] || iconName;
};

export default function Transactions() {
  const { 
    isLoggedIn, 
    transactions, 
    isLoadingTransactions, 
    fetchTransactions, 
    createTransaction, 
    deleteTransaction,
    wallets,
    categories,
    userData 
  } = useAppContext();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [newTx, setNewTx] = useState({ 
    title: '', 
    amount: '', 
    type: 'expense', 
    wallet_id: '',
    category_id: '',
    transaction_date: getLocalDateTime(),
    notes: '',
    attachment: null as File | null
  });

  const [activeTab, setActiveTab] = useState('all');

  const [internalTransfers, setInternalTransfers] = useState<any[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  useEffect(() => {
    if (activeTab === 'transfer' && internalTransfers.length === 0) {
      setIsLoadingTransfers(true);
      apiFetch('/wallets/transfers')
        .then(res => setInternalTransfers(res.data || []))
        .catch(err => console.error('Error fetching transfers', err))
        .finally(() => setIsLoadingTransfers(false));
    }
  }, [activeTab]);

  // Flatten category tree into a flat list for the select dropdown
  const flatCategories = useMemo(() => {
    const flatten = (cats: any[], prefix = ''): any[] => {
      let result: any[] = [];
      cats.forEach(cat => {
        const emoji = parseIcon(cat.icon || '');
        result.push({ ...cat, displayName: prefix + emoji + ' ' + cat.name });
        if (cat.children && cat.children.length > 0) {
          result = [...result, ...flatten(cat.children, prefix + '— ')];
        }
      });
      return result;
    };
    return flatten(categories);
  }, [categories]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTransactions();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (wallets.length > 0 && !newTx.wallet_id) {
      setNewTx(prev => ({ ...prev, wallet_id: wallets[0].id }));
    }
  }, [wallets]);

  const handleAdd = () => setIsModalOpen(true);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewTx({ ...newTx, attachment: e.target.files[0] });
    }
  };

  const submitAdd = async () => {
    if (!newTx.title || !newTx.amount || !newTx.wallet_id) {
      alert(t('please_fill_all_required_fields') || 'Vui lòng điền các trường bắt buộc');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newTx.title);
      formData.append('amount', newTx.amount);
      formData.append('type', newTx.type);
      formData.append('wallet_id', newTx.wallet_id);
      if (newTx.category_id) formData.append('category_id', newTx.category_id);
      formData.append('transaction_date', new Date(newTx.transaction_date).toISOString());
      if (newTx.notes) formData.append('notes', newTx.notes);
      if (newTx.attachment) formData.append('attachment', newTx.attachment);

      await createTransaction(formData);
      
      setNewTx({ 
        title: '', 
        amount: '', 
        type: 'expense', 
        wallet_id: wallets[0]?.id || '',
        category_id: '',
        transaction_date: getLocalDateTime(),
        notes: '',
        attachment: null
      });
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || 'Lỗi khi thêm giao dịch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirm_delete_tx') || 'Bạn có chắc chắn muốn xóa giao dịch này?')) {
      try {
        await deleteTransaction(id);
      } catch (error: any) {
        alert(error.message || 'Lỗi khi xóa giao dịch');
      }
    }
  };

  const filtered = activeTab === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === activeTab);

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="transactions" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar" style={{background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)'}}>
          <h1 className="page-title" style={{color:'var(--text-main)'}}>{t('transactions')}</h1>
          <div className="nav-actions">
            <div className="search-bar" style={{background: 'var(--bg-color)'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#718EBF"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <input type="text" placeholder={t('search_tx_placeholder')} />
            </div>
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'24px',fontWeight:'600',border:'none',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',gap:'8px'}} onClick={handleAdd}>
              {t('add_transaction')}
            </button>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
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
          <div style={{display:'flex',gap:'30px',borderBottom:'1px solid var(--border-color)',marginBottom:'20px'}}>
            {[{k:'all',l:t('all')},{k:'income',l:t('income')},{k:'expense',l:t('spending')},{k:'transfer',l:'Chuyển tiền nội bộ'}].map(tab=>(
              <div key={tab.k} onClick={()=>setActiveTab(tab.k)} style={{paddingBottom:'10px',color:activeTab===tab.k?'#1814F3':'#718EBF',borderBottom:activeTab===tab.k?'3px solid #1814F3':'none',fontWeight:activeTab===tab.k?'600':'400',cursor:'pointer'}}>{tab.l}</div>
            ))}
          </div>

          <div style={{background: 'var(--card-bg)',borderRadius:'20px',padding:'24px',border: '1px solid var(--border-color)', minHeight: '400px'}}>
            {(activeTab === 'transfer' && isLoadingTransfers) || (activeTab !== 'transfer' && isLoadingTransactions) ? (
              <div style={{display:'flex', justifyContent:'center', padding:'40px', color:'var(--text-main)'}}>{t('loading')}...</div>
            ) : activeTab === 'transfer' ? (
              <table style={{width:'100%',borderCollapse:'collapse',textAlign:'left',color: 'var(--text-main)',fontSize:'15px'}}>
                <thead style={{color:'#718EBF',borderBottom:'1px solid var(--border-color)'}}>
                  <tr>
                    <th style={{padding:'14px 8px',fontWeight:'500'}}>{t('description')}</th>
                    <th style={{padding:'14px 8px',fontWeight:'500'}}>Từ ví</th>
                    <th style={{padding:'14px 8px',fontWeight:'500'}}>Đến ví</th>
                    <th style={{padding:'14px 8px',fontWeight:'500'}}>{t('date_label')}</th>
                    <th style={{padding:'14px 8px',fontWeight:'500'}}>{t('amount_label')}</th>
                  </tr>
                </thead>
                <tbody>
                  {internalTransfers.length > 0 ? internalTransfers.map((tx: any)=>(
                    <tr key={tx.id} style={{borderBottom:'1px solid var(--border-color)'}}>
                      <td style={{padding:'14px 8px',fontWeight:600}}>Chuyển tiền nội bộ</td>
                      <td style={{padding:'14px 8px',fontWeight:500,color:'#1814F3'}}>{tx.from_wallet_name}</td>
                      <td style={{padding:'14px 8px',fontWeight:500,color:'#16DBCC'}}>{tx.to_wallet_name}</td>
                      <td style={{padding:'14px 8px'}}>
                        <div style={{fontWeight:'500'}}>{new Date(tx.date).toLocaleDateString('vi-VN')}</div>
                        <div style={{fontSize:'12px', color:'#718EBF'}}>{new Date(tx.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td style={{padding:'14px 8px', color: '#8F9BB3', fontWeight:'600'}}>
                        {Number(tx.amount).toLocaleString('vi-VN')}₫
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} style={{padding:'40px', textAlign:'center', color:'#718EBF'}}>Chưa có chuyển tiền nội bộ nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',textAlign:'left',color: 'var(--text-main)',fontSize:'15px'}}>
                <thead style={{color:'#718EBF',borderBottom:'1px solid var(--border-color)'}}>
                  <tr>
                    <th style={{padding:'14px 8px',fontWeight:'500'}}>{t('description')}</th>
                    <th style={{padding:'14px 8px',fontWeight:'500'}}>{t('categories')}</th>
                    <th style={{padding:'14px 8px',fontWeight:'500'}}>{t('date_label')}</th>
                    <th style={{padding:'14px 8px',fontWeight:'500'}}>{t('amount_label')}</th>
                    <th style={{padding:'14px 8px',fontWeight:'500'}}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((tx)=>(
                    <tr key={tx.id} style={{borderBottom:'1px solid var(--border-color)'}}>
                      <td style={{padding:'14px 8px',fontWeight:600}}>{tx.title}</td>
                      <td style={{padding:'14px 8px'}}>{tx.category?.name || '-'}</td>
                      <td style={{padding:'14px 8px'}}>
                        <div style={{fontWeight:'500'}}>{new Date(tx.transaction_date).toLocaleDateString('vi-VN')}</div>
                        <div style={{fontSize:'12px', color:'#718EBF'}}>{new Date(tx.transaction_date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td style={{padding:'14px 8px', color: tx.type === 'income' ? '#16DBCC' : '#FE5C73', fontWeight:'600'}}>
                        {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString('vi-VN')}₫
                      </td>
                      <td style={{padding:'14px 8px',display:'flex',gap:'8px'}}>
                        <button style={{border:'1px solid #FE5C73',color:'#FE5C73',background:'transparent',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'12px'}} onClick={() => handleDelete(tx.id)}>{t('delete')}</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} style={{padding:'40px', textAlign:'center', color:'#718EBF'}}>{t('no_transactions_found') || 'Không tìm thấy giao dịch nào'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* MODAL THÊM GIAO DỊCH */}
      {isModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000, backdropFilter: 'blur(4px)'}}>
          <div style={{background: 'var(--card-bg)',borderRadius:'24px',padding:'30px',width:'550px',maxWidth:'95%',boxShadow:'0 10px 40px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto'}}>
             <h2 style={{color: 'var(--text-main)',marginBottom:'24px',fontSize:'22px',fontWeight:'700'}}>{t('add_new_transaction')}</h2>
             
             <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px'}}>
               <div>
                 <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('transaction_name')} *</label>
                 <input type="text" value={newTx.title} onChange={e=>setNewTx({...newTx,title:e.target.value})} placeholder={t('tx_name_placeholder')} style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}} />
               </div>
               <div>
                 <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('amount_label')} *</label>
                 <input type="number" value={newTx.amount} onChange={e=>setNewTx({...newTx,amount:e.target.value})} placeholder={t('tx_amount_placeholder')} style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}} />
               </div>
             </div>

             <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px'}}>
               <div>
                 <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('type')} *</label>
                 <select value={newTx.type} onChange={e=>setNewTx({...newTx,type:e.target.value})} style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}}>
                    <option value="expense">{t('spending')}</option>
                    <option value="income">{t('income')}</option>
                 </select>
               </div>
               <div>
                 <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('wallets')} *</label>
                 <select value={newTx.wallet_id} onChange={e=>setNewTx({...newTx,wallet_id:e.target.value})} style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}}>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                 </select>
               </div>
             </div>

             <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px'}}>
               <div>
                 <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('categories')}</label>
                 <select value={newTx.category_id} onChange={e=>setNewTx({...newTx,category_id:e.target.value})} style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}}>
                    <option value="">{t('select_category') || 'Chọn danh mục'}</option>
                    {flatCategories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                 </select>
               </div>
               <div>
                 <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('date_label')} *</label>
                 <input type="datetime-local" value={newTx.transaction_date} onChange={e=>setNewTx({...newTx,transaction_date:e.target.value})} style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}} />
               </div>
             </div>

             <div style={{marginBottom:'15px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('notes')}</label>
               <textarea value={newTx.notes} onChange={e=>setNewTx({...newTx,notes:e.target.value})} placeholder={t('notes_placeholder') || 'Thêm ghi chú...'} style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px', minHeight: '80px', resize: 'vertical'}} />
             </div>

             <div style={{marginBottom:'25px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('receipt_image') || 'Ảnh hóa đơn'}</label>
               <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width:'100%',
                  padding:'20px',
                  border: '2px dashed var(--border-color)',
                  borderRadius:'12px',
                  background: 'var(--bg-color)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: '#718EBF'
                }}
               >
                 {newTx.attachment ? (
                   <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                     <span style={{color: '#16DBCC'}}>✓</span> {newTx.attachment.name}
                   </div>
                 ) : (
                   <div>{t('click_to_upload') || 'Nhấn để tải lên ảnh hóa đơn'}</div>
                 )}
               </div>
               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{display:'none'}} />
             </div>
             
             <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
               <button style={{padding:'12px 24px',background: 'var(--bg-color)',color:'#718EBF',borderRadius:'12px',border: '1px solid var(--border-color)',cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={()=>setIsModalOpen(false)} disabled={isSubmitting}>{t('cancel')}</button>
               <button 
                style={{padding:'12px 24px',background:'#1814F3',color:'#fff',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:'600',fontSize:'15px', display:'flex', alignItems:'center', gap:'8px'}} 
                onClick={submitAdd} 
                disabled={isSubmitting}
               >
                 {isSubmitting ? (t('saving') || 'Đang lưu...') : t('save_transaction')}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

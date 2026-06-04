"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

export default function Transactions() {
  const { 
    isLoggedIn, 
    transactions, 
    addTransaction, 
    deleteTransaction, 
    fetchTransactions, 
    wallets, 
    fetchWallets 
  } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({ title: '', amount: '', type: 'Chi tiêu', category: 'Ăn uống', wallet_id: '', notes: '' });
  const [activeTab, setActiveTab] = useState('all'); // all, income, expense
  const [selectedWalletId, setSelectedWalletId] = useState('all');

  useEffect(() => {
    if (isLoggedIn) {
      fetchWallets();
    }
  }, [isLoggedIn]);

  // Lọc giao dịch phản ứng theo Wallet ID chọn và Tab chọn
  useEffect(() => {
    if (isLoggedIn) {
      const filters: any = {};
      if (selectedWalletId !== 'all') {
        filters.wallet_id = selectedWalletId;
      }
      if (activeTab === 'income') {
        filters.type = 'income';
      } else if (activeTab === 'expense') {
        filters.type = 'expense';
      }
      fetchTransactions(filters);
    }
  }, [isLoggedIn, selectedWalletId, activeTab]);

  const handleAdd = () => {
    if (wallets.length === 0) {
      alert("Bạn cần phải tạo ít nhất một chiếc ví trước khi thêm giao dịch!");
      return;
    }
    // Thiết lập ví đầu tiên làm mặc định trong form
    setNewTx({ 
      title: '', 
      amount: '', 
      type: 'Chi tiêu', 
      category: 'Ăn uống', 
      wallet_id: wallets[0]?.id || '', 
      notes: '' 
    });
    setIsModalOpen(true);
  };
  
  const submitAdd = async () => {
    if (!newTx.title || !newTx.amount || !newTx.wallet_id) {
      alert("Vui lòng nhập đầy đủ Tên giao dịch, Số tiền và chọn Ví!");
      return;
    }
    try {
      const typeEnum = newTx.type === 'Thu nhập' ? 'income' : 'expense';
      await addTransaction({
        wallet_id: newTx.wallet_id,
        type: typeEnum,
        amount: newTx.amount,
        title: newTx.title,
        notes: newTx.notes,
        transaction_date: new Date().toISOString(),
      });
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Lỗi khi lưu giao dịch!");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa giao dịch này? Số dư ví tương ứng sẽ được hoàn lại.")) {
      try {
        await deleteTransaction(id);
        // Refresh
        const filters: any = {};
        if (selectedWalletId !== 'all') filters.wallet_id = selectedWalletId;
        if (activeTab === 'income') filters.type = 'income';
        if (activeTab === 'expense') filters.type = 'expense';
        fetchTransactions(filters);
      } catch (err: any) {
        alert(err.message || "Lỗi khi xóa giao dịch!");
      }
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="transactions" />
      <main className="main-content" style={{background:'#FFFFFF'}}>
        <nav className="navbar" style={{background:'#fff',borderBottom:'1px solid #E6EFF5'}}>
          <h1 className="page-title" style={{color:'#343C6A'}}>Giao dịch</h1>
          <div className="nav-actions">
            {/* Bộ lọc ví trực tiếp trên navbar */}
            <select 
              value={selectedWalletId} 
              onChange={e => setSelectedWalletId(e.target.value)} 
              style={{
                padding: '10px 16px',
                borderRadius: '24px',
                border: '1px solid #E6EFF5',
                background: '#F8F9FB',
                color: '#343C6A',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                marginRight: '12px'
              }}
            >
              <option value="all">Tất cả các ví</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>

            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'24px',fontWeight:'600',border:'none',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',gap:'8px'}} onClick={handleAdd}>+ Thêm giao dịch</button>
            {isLoggedIn ? <img src="https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4" alt="Avatar" className="avatar"/> : <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>Đăng nhập</Link>}
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
                <tr>
                  <th style={{padding:'14px 8px',fontWeight:'500'}}>Mô tả</th>
                  <th style={{padding:'14px 8px',fontWeight:'500'}}>Ví</th>
                  <th style={{padding:'14px 8px',fontWeight:'500'}}>Loại</th>
                  <th style={{padding:'14px 8px',fontWeight:'500'}}>Danh mục</th>
                  <th style={{padding:'14px 8px',fontWeight:'500'}}>Ngày</th>
                  <th style={{padding:'14px 8px',fontWeight:'500'}}>Số tiền</th>
                  <th style={{padding:'14px 8px',fontWeight:'500'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((x,i)=>{
                  const isExpense = x.type === 'expense' || x.type === 'Chi tiêu';
                  const walletName = wallets.find(w => w.id === x.wallet_id)?.name || 'Khác';
                  const dateText = x.transaction_date ? new Date(x.transaction_date).toLocaleDateString('vi-VN') : x.date || '';
                  const amt = parseFloat(x.amount || 0);

                  return (
                    <tr key={x.id || i} style={{borderBottom:'1px solid #E6EFF5'}}>
                      <td style={{padding:'14px 8px',display:'flex',alignItems:'center',gap:'12px'}}>
                        <span style={{fontSize:'20px'}}>{x.icon || (isExpense ? '💸' : '💰')}</span>
                        <span style={{fontWeight:600}}>{x.title || x.desc}</span>
                      </td>
                      <td style={{padding:'14px 8px',color:'#718EBF'}}>{walletName}</td>
                      <td style={{padding:'14px 8px'}}>
                        <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'600',background:isExpense ? '#FFE0EB' : '#DCFAF8',color:isExpense ? '#FE5C73' : '#16DBCC'}}>
                          {isExpense ? 'Chi tiêu' : 'Thu nhập'}
                        </span>
                      </td>
                      <td style={{padding:'14px 8px'}}>{x.category || 'Chung'}</td>
                      <td style={{padding:'14px 8px'}}>{dateText}</td>
                      <td style={{padding:'14px 8px',color:isExpense ? '#FE5C73' : '#16DBCC',fontWeight:'600'}}>
                        {isLoggedIn ? (isExpense ? '-' : '+') + amt.toLocaleString('vi-VN') + '₫' : "0₫"}
                      </td>
                      <td style={{padding:'14px 8px'}}>
                        <button 
                          onClick={() => handleDelete(x.id)}
                          style={{border:'1px solid #FE5C73',color:'#FE5C73',background:'transparent',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',transition:'all 0.2s'}}
                          onMouseEnter={(e)=>e.currentTarget.style.background='#FFE0EB'}
                          onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div style={{textAlign:'center',padding:'40px',color:'#718EBF'}}>Không tìm thấy giao dịch nào.</div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL THÊM GIAO DỊCH */}
      {isModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:'24px',padding:'30px',width:'450px',maxWidth:'90%',boxShadow:'0 10px 40px rgba(0,0,0,0.1)'}}>
             <h2 style={{color:'#343C6A',marginBottom:'20px',fontSize:'20px',fontWeight:'700'}}>Thêm giao dịch mới</h2>
             
             {/* Chọn ví */}
             <div style={{marginBottom:'15px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>Chọn ví thực hiện</label>
               <select 
                 value={newTx.wallet_id} 
                 onChange={e=>setNewTx({...newTx,wallet_id:e.target.value})} 
                 style={{width:'100%',padding:'14px',border:'1px solid #E6EFF5',borderRadius:'12px',background:'#F8F9FB',color:'#343C6A',fontSize:'15px',outline:'none'}}
               >
                 {wallets.map(w => (
                   <option key={w.id} value={w.id}>
                     {w.name} ({parseFloat(w.available_balance).toLocaleString('vi-VN')}₫)
                   </option>
                 ))}
               </select>
             </div>

             <div style={{marginBottom:'15px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>Tên giao dịch</label>
               <input type="text" value={newTx.title} onChange={e=>setNewTx({...newTx,title:e.target.value})} placeholder="VD: Tiền ăn trưa, Mua sắm..." style={{width:'100%',padding:'14px',border:'1px solid #E6EFF5',borderRadius:'12px',background:'#F8F9FB',color:'#343C6A',fontSize:'15px',outline:'none'}} />
             </div>
             
             <div style={{marginBottom:'15px',display:'flex',gap:'15px'}}>
               <div style={{flex:1}}>
                 <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>Loại</label>
                 <select value={newTx.type} onChange={e=>setNewTx({...newTx,type:e.target.value})} style={{width:'100%',padding:'14px',border:'1px solid #E6EFF5',borderRadius:'12px',background:'#F8F9FB',color:'#343C6A',fontSize:'15px',outline:'none'}}>
                   <option>Chi tiêu</option><option>Thu nhập</option>
                 </select>
               </div>
               <div style={{flex:1}}>
                 <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>Số tiền</label>
                 <input type="number" value={newTx.amount} onChange={e=>setNewTx({...newTx,amount:e.target.value})} placeholder="VD: 50000" style={{width:'100%',padding:'14px',border:'1px solid #E6EFF5',borderRadius:'12px',background:'#F8F9FB',color:'#343C6A',fontSize:'15px',outline:'none'}} />
               </div>
             </div>

             <div style={{marginBottom:'20px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>Ghi chú (Tùy chọn)</label>
               <input type="text" value={newTx.notes} onChange={e=>setNewTx({...newTx,notes:e.target.value})} placeholder="Thêm ghi chú..." style={{width:'100%',padding:'14px',border:'1px solid #E6EFF5',borderRadius:'12px',background:'#F8F9FB',color:'#343C6A',fontSize:'15px',outline:'none'}} />
             </div>
             
             <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
               <button style={{padding:'12px 24px',background:'#F8F9FB',color:'#718EBF',borderRadius:'12px',border:'1px solid #E6EFF5',cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={()=>setIsModalOpen(false)}>Hủy</button>
               <button style={{padding:'12px 24px',background:'#1814F3',color:'#fff',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={submitAdd}>Lưu giao dịch</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

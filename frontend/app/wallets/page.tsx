"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

export default function Wallets() {
  const { 
    isLoggedIn, wallets, fetchWallets, createWallet, 
    updateWallet, deleteWallet, isLoadingWallets, userData
  } = useAppContext();

  // State cho Modals
  const [showModal, setShowModal] = useState<'create' | 'edit' | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      fetchWallets();
    }
  }, [isLoggedIn]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWallet({ name, type, available_balance: balance });
      setShowModal(null);
      resetForm();
    } catch (err) {
      alert("Lỗi khi tạo ví!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateWallet(selectedWallet.id, { name, type });
      setShowModal(null);
      resetForm();
    } catch (err) {
      alert("Lỗi khi cập nhật ví!");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa ví này?")) {
      try {
        await deleteWallet(id);
      } catch (err: any) {
        alert(err.message || "Lỗi khi xóa ví!");
      }
    }
  };

  const resetForm = () => {
    setName('');
    setType('cash');
    setBalance('');
    setSelectedWallet(null);
  };

  const openEdit = (wallet: any) => {
    setSelectedWallet(wallet);
    setName(wallet.name);
    setType(wallet.type);
    setShowModal('edit');
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="wallets" />
      <main className="main-content" style={{ background: '#FFFFFF' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>Ví & Tài khoản tiền</h1>
          <div className="nav-actions">
            <button 
              onClick={() => setShowModal('create')}
              style={{ background: '#1814F3', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
            >
              + Tạo ví mới
            </button>
            {isLoggedIn ? (
              <img src={userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" />
            ) : (
              <Link href="/login" style={{ textDecoration: 'none', color: '#fff', background: '#343C6A', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>Đăng nhập</Link>
            )}
          </div>
        </nav>

        <div className="content-area">
          {isLoadingWallets ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>
          ) : wallets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '20px', border: '1px dashed #E6EFF5' }}>
              <div style={{ fontSize: '50px', marginBottom: '20px' }}>👛</div>
              <h3 style={{ color: '#343C6A', marginBottom: '10px' }}>Chưa có ví nào</h3>
              <p style={{ color: '#718EBF', marginBottom: '25px' }}>Bắt đầu quản lý tài chính bằng cách tạo chiếc ví đầu tiên của bạn!</p>
              <button 
                onClick={() => setShowModal('create')}
                style={{ background: '#1814F3', color: '#fff', padding: '12px 30px', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
              >
                Tạo ví ngay
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px', marginBottom: '24px' }}>
              {wallets.map((w, i) => (
                <div key={w.id} style={{ background: w.color || 'linear-gradient(135deg,#1814F3,#6366F1)', borderRadius: '20px', padding: '28px', color: '#fff', position: 'relative', overflow: 'hidden', minHeight: '160px' }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '14px', opacity: 0.85, marginBottom: '4px' }}>Số dư</div>
                      <div style={{ fontSize: '28px', fontWeight: '800' }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.available_balance || 0)}
                      </div>
                    </div>
                    <div style={{ fontSize: '36px' }}>{w.icon || '🏦'}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '700' }}>{w.name}</div>
                      <div style={{ fontSize: '13px', opacity: 0.8 }}>Loại: {w.type}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => openEdit(w)}
                        style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(w.id)}
                        style={{ background: 'rgba(255,0,0,0.3)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL TẠO / SỬA VÍ */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '20px', color: '#343C6A' }}>{showModal === 'create' ? 'Tạo ví mới' : 'Chỉnh sửa ví'}</h2>
            <form onSubmit={showModal === 'create' ? handleCreate : handleUpdate}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Tên ví</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E6EFF5' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Loại ví</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E6EFF5' }}
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Ngân hàng</option>
                  <option value="ewallet">Ví điện tử</option>
                  <option value="crypto">Tài sản số</option>
                </select>
              </div>
              {showModal === 'create' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Số dư khả dụng</label>
                  <input 
                    type="number" 
                    value={balance} 
                    onChange={(e) => setBalance(e.target.value)} 
                    placeholder="0"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E6EFF5' }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowModal(null); resetForm(); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ background: '#1814F3', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                  {showModal === 'create' ? 'Tạo ví' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

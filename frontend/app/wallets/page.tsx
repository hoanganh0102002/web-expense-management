"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

// ==========================================
// CUSTOM PREMIUM SVG ICONS
// ==========================================
interface IconProps {
  size?: number;
  style?: React.CSSProperties;
}

const CardNoteIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const BankIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 22h18M6 18v-7m5 7v-7m5 7v-7M3 11l9-9 9 9M5 22h14" />
  </svg>
);

const WalletIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M20 12V8H6a2 2 0 0 0-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
    <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6h-4z" />
  </svg>
);

const CreditCardIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const PiggyBankIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M19 5A2.5 2.5 0 0 0 16.5 7.5c0 .32.06.63.17.92A7.5 7.5 0 1 0 19 12.5V11" />
    <path d="M2 9h4" />
    <path d="M10 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M12 18v2M8 18v2M16 17v2" />
  </svg>
);

const ShoppingBagIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const CarIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M5 17h10" />
  </svg>
);

const HouseIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const UtensilsIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v4M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z" />
    <path d="M12 11v11M18 15v7" />
  </svg>
);

const PlaneIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M17.8 20.1L21 17l-9.1-9.1L8.6 3.1 6.5 5.2l3.6 5.6-3.8 3.8-3-1L1 15.9l4.7 2.1L7.9 23l2.2-2.2-1-3 3.8-3.8 5.6 3.6 2.3-2.1c-.6-1.1-.6-2.4 0-3.4z" />
  </svg>
);

const QrIcon: React.FC<IconProps> = ({ size = 16, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <rect x="7" y="7" width="3" height="3" />
    <rect x="14" y="7" width="3" height="3" />
    <rect x="7" y="14" width="3" height="3" />
    <rect x="14" y="14" width="3" height="3" />
  </svg>
);

// Color lists matching user image's pastel & high-contrast palette
const colorOptions = [
  'linear-gradient(135deg, #3A3FBD, #2E33A8)', // Violet / Indigo (selected default)
  'linear-gradient(135deg, #C2ECD9, #A9DFBF)', // Sage Green
  'linear-gradient(135deg, #FDDCD0, #F5B099)', // Peach
  'linear-gradient(135deg, #FFE29A, #FCD068)', // Warm Yellow
  'linear-gradient(135deg, #E6E3FC, #C5BFFB)', // Lilac
  'linear-gradient(135deg, #B9F6CA, #69F0AE)'  // Mint
];

// Helper functions for dynamic text and icon color based on gradient brightness/contrast
const getContrastColor = (bgGradient: string) => {
  const g = bgGradient || '';
  if (g.includes('#3A3FBD') || g.includes('#1814F3') || g.includes('#2E33A8') || g.includes('#4F46E5') || g.includes('#6366F1')) {
    return '#FFFFFF';
  }
  return '#1C2755'; // Dark text for light pastel gradients
};

const getMutedContrastColor = (bgGradient: string) => {
  const g = bgGradient || '';
  if (g.includes('#3A3FBD') || g.includes('#1814F3') || g.includes('#2E33A8') || g.includes('#4F46E5') || g.includes('#6366F1')) {
    return 'rgba(255, 255, 255, 0.75)';
  }
  return 'rgba(28, 39, 85, 0.75)';
};

const getIconBgColor = (bgGradient: string) => {
  const g = bgGradient || '';
  if (g.includes('#3A3FBD') || g.includes('#1814F3') || g.includes('#2E33A8') || g.includes('#4F46E5') || g.includes('#6366F1')) {
    return 'rgba(255, 255, 255, 0.18)';
  }
  return 'rgba(28, 39, 85, 0.08)';
};

const renderWalletIcon = (iconName: string, size = 22, style = {}) => {
  switch (iconName) {
    case 'cash':
      return <CardNoteIcon size={size} style={style} />;
    case 'bank':
      return <BankIcon size={size} style={style} />;
    case 'wallet':
      return <WalletIcon size={size} style={style} />;
    case 'card':
      return <CreditCardIcon size={size} style={style} />;
    case 'piggy':
      return <PiggyBankIcon size={size} style={style} />;
    case 'bag':
      return <ShoppingBagIcon size={size} style={style} />;
    case 'car':
      return <CarIcon size={size} style={style} />;
    case 'house':
      return <HouseIcon size={size} style={style} />;
    case 'utensils':
      return <UtensilsIcon size={size} style={style} />;
    case 'plane':
      return <PlaneIcon size={size} style={style} />;
    // Emojis mapping back for backwards compatibility
    case '👛':
      return <WalletIcon size={size} style={style} />;
    case '🏦':
      return <BankIcon size={size} style={style} />;
    case '💳':
      return <CreditCardIcon size={size} style={style} />;
    case '🐷':
      return <PiggyBankIcon size={size} style={style} />;
    case '🛍️':
      return <ShoppingBagIcon size={size} style={style} />;
    case '🚗':
      return <CarIcon size={size} style={style} />;
    case '🏠':
      return <HouseIcon size={size} style={style} />;
    case '🍴':
      return <UtensilsIcon size={size} style={style} />;
    case '✈️':
      return <PlaneIcon size={size} style={style} />;
    default:
      if (iconName && iconName.length <= 2) {
        return <span style={{ fontSize: `${size}px`, ...style }}>{iconName}</span>;
      }
      return <WalletIcon size={size} style={style} />;
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================
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
  const [color, setColor] = useState('linear-gradient(135deg, #3A3FBD, #2E33A8)');
  const [icon, setIcon] = useState('wallet');

  useEffect(() => {
    if (isLoggedIn) {
      fetchWallets();
    }
  }, [isLoggedIn]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Bạn cần phải đăng nhập mới được tạo ví");
      return;
    }
    try {
      await createWallet({ name, type, available_balance: balance, color, icon });
      setShowModal(null);
      resetForm();
    } catch (err) {
      alert("Lỗi khi tạo ví!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateWallet(selectedWallet.id, { name, type, color, icon });
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
    setColor('linear-gradient(135deg, #3A3FBD, #2E33A8)');
    setIcon('wallet');
    setSelectedWallet(null);
  };

  const openEdit = (wallet: any) => {
    setSelectedWallet(wallet);
    setName(wallet.name);
    setType(wallet.type);
    setBalance(wallet.available_balance ? String(wallet.available_balance) : '0');
    setColor(wallet.color || 'linear-gradient(135deg, #3A3FBD, #2E33A8)');
    setIcon(wallet.icon || 'wallet');
    setShowModal('edit');
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="wallets" />
      <main className="main-content" style={{ background: '#F8F9FB' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>Ví & Tài khoản tiền</h1>
          <div className="nav-actions">
            <button 
              onClick={() => {
                if (!isLoggedIn) {
                  alert("Bạn cần phải đăng nhập mới được tạo ví");
                  return;
                }
                setShowModal('create');
              }}
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
                onClick={() => {
                  if (!isLoggedIn) {
                    alert("Bạn cần phải đăng nhập mới được tạo ví");
                    return;
                  }
                  setShowModal('create');
                }}
                style={{ background: '#1814F3', color: '#fff', padding: '12px 30px', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
              >
                Tạo ví ngay
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px', marginBottom: '24px' }}>
              {wallets.map((w) => {
                const cardColor = w.color || 'linear-gradient(135deg, #3A3FBD, #2E33A8)';
                const txtColor = getContrastColor(cardColor);
                const muteColor = getMutedContrastColor(cardColor);
                const iconBg = getIconBgColor(cardColor);
                
                return (
                  <div key={w.id} style={{ 
                    background: cardColor, 
                    borderRadius: '24px', 
                    padding: '24px', 
                    color: txtColor, 
                    position: 'relative', 
                    overflow: 'hidden', 
                    minHeight: '170px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: muteColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Số dư</div>
                        <div style={{ fontSize: '26px', fontWeight: '800' }}>
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.available_balance || 0)}
                        </div>
                      </div>
                      <div style={{ 
                        background: iconBg, 
                        width: '46px', 
                        height: '46px', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: txtColor
                      }}>
                        {renderWalletIcon(w.icon || 'wallet', 22)}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', zIndex: 2 }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700' }}>{w.name}</div>
                        <div style={{ fontSize: '12px', color: muteColor }}>
                          Loại: {w.type === 'cash' ? 'Tiền mặt' : w.type === 'bank' ? 'Ngân hàng' : 'Ví điện tử'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => openEdit(w)}
                          style={{ 
                            background: iconBg, 
                            color: txtColor, 
                            border: 'none', 
                            padding: '8px 16px', 
                            borderRadius: '10px', 
                            cursor: 'pointer', 
                            fontSize: '13px', 
                            fontWeight: '600',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleDelete(w.id)}
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.15)', 
                            color: w.color ? (txtColor === '#FFFFFF' ? '#FF8A8A' : '#EF4444') : '#EF4444', 
                            border: 'none', 
                            padding: '8px 16px', 
                            borderRadius: '10px', 
                            cursor: 'pointer', 
                            fontSize: '13px', 
                            fontWeight: '600',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL TẠO / SỬA VÍ */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ 
            background: '#fff', 
            padding: '32px', 
            borderRadius: '28px', 
            width: '480px', 
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', position: 'relative', height: '40px' }}>
              <button 
                type="button" 
                onClick={() => { setShowModal(null); resetForm(); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '28px', 
                  cursor: 'pointer', 
                  color: '#1E293B', 
                  position: 'absolute', 
                  left: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  borderRadius: '50%',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                ‹
              </button>
              <h2 style={{ width: '100%', textAlign: 'center', margin: 0, color: '#1E293B', fontSize: '20px', fontWeight: '700' }}>
                {showModal === 'create' ? 'Thêm ví mới' : 'Chỉnh sửa ví'}
              </h2>
            </div>

            {/* Live Card Preview */}
            <div style={{ 
              background: color, 
              borderRadius: '24px', 
              padding: '24px', 
              color: getContrastColor(color), 
              position: 'relative', 
              overflow: 'hidden', 
              minHeight: '160px',
              marginBottom: '24px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: getMutedContrastColor(color), letterSpacing: '0.5px', marginBottom: '4px' }}>Tên ví</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', wordBreak: 'break-all' }}>
                    {name.toUpperCase() || 'VÍ MỚI CỦA TÔI'}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  background: getIconBgColor(color), 
                  width: '46px', 
                  height: '46px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: getContrastColor(color)
                }}>
                  {renderWalletIcon(icon, 22)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: getMutedContrastColor(color), letterSpacing: '0.5px', marginBottom: '4px' }}>Số dư khởi tạo</div>
                <div style={{ fontSize: '26px', fontWeight: '800' }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(balance) || 0)}
                </div>
              </div>
            </div>

            <form onSubmit={showModal === 'create' ? handleCreate : handleUpdate}>
              {/* Wallet Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>Tên ví</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="Nhập tên ví (ví dụ: Ví Tiền Mặt)"
                  style={{ 
                    width: '100%', 
                    padding: '14px 18px', 
                    borderRadius: '14px', 
                    border: '1px solid transparent',
                    background: '#F5F7FA',
                    color: '#1E293B',
                    outline: 'none',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = '#FFF';
                    e.currentTarget.style.borderColor = '#5F63E8';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = '#F5F7FA';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                />
              </div>

              {/* Initial Balance */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>Số dư ban đầu</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    value={balance} 
                    onChange={(e) => setBalance(e.target.value)} 
                    placeholder="0"
                    disabled={showModal === 'edit'}
                    style={{ 
                      width: '100%', 
                      padding: '14px 40px 14px 18px', 
                      borderRadius: '14px', 
                      border: '1px solid transparent',
                      background: showModal === 'edit' ? '#F1F5F9' : '#F5F7FA',
                      color: showModal === 'edit' ? '#94A3B8' : '#1E293B',
                      fontWeight: '600',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: showModal === 'edit' ? 'not-allowed' : 'text',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      if (showModal !== 'edit') {
                        e.currentTarget.style.background = '#FFF';
                        e.currentTarget.style.borderColor = '#5F63E8';
                      }
                    }}
                    onBlur={(e) => {
                      if (showModal !== 'edit') {
                        e.currentTarget.style.background = '#F5F7FA';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  />
                  <span style={{ 
                    position: 'absolute', 
                    right: '18px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: showModal === 'edit' ? '#94A3B8' : '#475569', 
                    fontWeight: 'bold' 
                  }}>đ</span>
                </div>
                {showModal === 'edit' && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginTop: '8px' 
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <small style={{ color: '#EF4444', fontSize: '12px', fontWeight: '500' }}>
                      không được thay đổi số dư khi đã đồng ý tạo ví
                    </small>
                  </div>
                )}
              </div>

              {/* Wallet Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>Chọn loại ví</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { key: 'cash', label: 'Tiền mặt', icon: <CardNoteIcon size={16} /> },
                    { key: 'bank', label: 'Ngân hàng', icon: <BankIcon size={16} /> },
                    { key: 'ewallet', label: 'Ví điện tử', icon: <QrIcon size={16} /> }
                  ].map((t) => {
                    const isSelected = type === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setType(t.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '12px 6px',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #5F63E8' : '2px solid transparent',
                          background: isSelected ? '#EEF2FF' : '#F5F7FA',
                          color: isSelected ? '#5F63E8' : '#718EBF',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {t.icon}
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>Chọn biểu tượng</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {[
                    { key: 'cash', component: CardNoteIcon },
                    { key: 'bank', component: BankIcon },
                    { key: 'wallet', component: WalletIcon },
                    { key: 'card', component: CreditCardIcon },
                    { key: 'piggy', component: PiggyBankIcon },
                    { key: 'bag', component: ShoppingBagIcon },
                    { key: 'car', component: CarIcon },
                    { key: 'house', component: HouseIcon },
                    { key: 'utensils', component: UtensilsIcon },
                    { key: 'plane', component: PlaneIcon }
                  ].map((ic) => {
                    const isSelected = icon === ic.key;
                    const IconComp = ic.component;
                    return (
                      <button
                        key={ic.key}
                        type="button"
                        onClick={() => setIcon(ic.key)}
                        style={{
                          padding: '12px 0',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #5F63E8' : '2px solid transparent',
                          background: isSelected ? '#EEF2FF' : '#F5F7FA',
                          color: isSelected ? '#5F63E8' : '#718EBF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <IconComp size={22} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>Chọn màu sắc</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {colorOptions.map((col) => {
                    const isSelected = color === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setColor(col)}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: col,
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 0 2px #fff, 0 0 0 4px #5F63E8' : '0 2px 6px rgba(0,0,0,0.08)',
                          transition: 'transform 0.2s ease',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="submit" 
                  style={{ 
                    flex: 1,
                    background: '#5F63E8', 
                    color: '#fff', 
                    padding: '14px 20px', 
                    borderRadius: '16px', 
                    border: 'none', 
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(95, 99, 232, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4A49E6';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(95, 99, 232, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#5F63E8';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(95, 99, 232, 0.3)';
                  }}
                >
                  <span>{showModal === 'create' ? 'Tạo ví' : 'Lưu thay đổi'}</span>
                  {showModal === 'create' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

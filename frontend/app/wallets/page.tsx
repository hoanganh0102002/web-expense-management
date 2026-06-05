"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { transferApi } from '../lib/api';
import { useLanguage } from '../lib/translations';
import './wallets.css';

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
    updateWallet, deleteWallet, isLoadingWallets, userData,
    transactions, fetchTransactions, deleteTransaction
  } = useAppContext();
  const { t } = useLanguage();

  // State cho Modals
  const [showModal, setShowModal] = useState<'create' | 'edit' | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('linear-gradient(135deg, #3A3FBD, #2E33A8)');
  const [icon, setIcon] = useState('wallet');
  const [isHidden, setIsHidden] = useState(false);

  // State chuyển tiền
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Bộ lọc lịch sử giao dịch theo ví
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchWallets();
      fetchTransactions(selectedWalletFilter ? { wallet_id: selectedWalletFilter } : undefined);
    }
  }, [isLoggedIn, selectedWalletFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert(t('login_required_to_create_wallet'));
      return;
    }
    try {
      await createWallet({ name, type, available_balance: balance, color, icon, is_hidden: isHidden });
      setShowModal(null);
      resetForm();
    } catch (err: any) {
      console.error("Lỗi tạo ví:", err);
      alert(err.message || t('create_wallet_error'));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateWallet(selectedWallet.id, { name, type, color, icon, is_hidden: isHidden });
      setShowModal(null);
      resetForm();
    } catch (err) {
      alert(t('update_wallet_error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('delete_wallet_confirm'))) {
      try {
        await deleteWallet(id);
      } catch (err: any) {
        alert(err.message || t('delete_wallet_error'));
      }
    }
  };

  const resetForm = () => {
    setName('');
    setType('cash');
    setBalance('');
    setColor('linear-gradient(135deg, #3A3FBD, #2E33A8)');
    setIcon('wallet');
    setIsHidden(false);
    setSelectedWallet(null);
  };

  const openEdit = (wallet: any) => {
    setSelectedWallet(wallet);
    setName(wallet.name);
    setType(wallet.type);
    setBalance(wallet.available_balance ? String(wallet.available_balance) : '0');
    setColor(wallet.color || 'linear-gradient(135deg, #3A3FBD, #2E33A8)');
    setIcon(wallet.icon || 'wallet');
    setIsHidden(wallet.is_hidden || false);
    setShowModal('edit');
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWalletId || !toWalletId || !transferAmount) return;
    try {
      await transferApi.create({
        from_wallet_id: fromWalletId,
        to_wallet_id: toWalletId,
        amount: transferAmount,
        notes: transferNotes
      });
      alert("Chuyển tiền nội bộ thành công!");
      setShowTransferModal(false);
      resetTransferForm();
      fetchWallets();
      fetchTransactions(selectedWalletFilter ? { wallet_id: selectedWalletFilter } : undefined);
    } catch (err: any) {
      alert(err.message || "Lỗi khi thực hiện chuyển tiền!");
    }
  };

  const resetTransferForm = () => {
    setFromWalletId('');
    setToWalletId('');
    setTransferAmount('');
    setTransferNotes('');
  };

  const toggleWalletFilter = (walletId: string) => {
    if (selectedWalletFilter === walletId) {
      setSelectedWalletFilter(null);
    } else {
      setSelectedWalletFilter(walletId);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="wallets" />
      <main className="main-content wallets-main">
        <nav className="navbar wallets-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title wallets-title" style={{ margin: 0 }}>{t('wallets_and_accounts')}</h1>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0, width: '20px', height: '20px' }}
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
          <div className="nav-actions">
            <button 
              onClick={() => {
                if (!isLoggedIn) {
                  alert(t('login_required_to_transfer') || "Bạn cần đăng nhập để chuyển tiền!");
                  return;
                }
                if (wallets.length < 2) {
                  alert(t('need_two_wallets') || "Bạn cần ít nhất 2 ví để thực hiện chuyển tiền!");
                  return;
                }
                setShowTransferModal(true);
              }}
              style={{ background: '#FFF', color: '#1814F3', border: '1px solid #1814F3', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' }}
            >
              ⇆ Chuyển tiền nội bộ
            </button>
            <button 
              onClick={() => {
                if (!isLoggedIn) {
                  alert(t('login_required_to_create_wallet'));
                  return;
                }
                setShowModal('create');
              }}
              className="create-wallet-btn"
            >
              {t('create_new_wallet')}
            </button>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: '600', color: '#343C6A', fontSize: '15px' }}>
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img 
                    src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} 
                    alt="Avatar" 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none', color: '#fff', background: '#343C6A', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>{t('login')}</Link>
            )}
          </div>
        </nav>

        <div className="content-area wallets-container">
          {isLoadingWallets ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>{t('loading')}</div>
          ) : wallets.length === 0 ? (
            <div className="wallets-empty-state">
              <div style={{ fontSize: '50px', marginBottom: '20px' }}>👛</div>
              <h3 style={{ color: '#343C6A', marginBottom: '10px' }}>{t('no_wallets')}</h3>
              <p style={{ color: '#718EBF', marginBottom: '25px' }}>{t('no_wallets_desc')}</p>
              <button 
                onClick={() => {
                  if (!isLoggedIn) {
                    alert(t('login_required_to_create_wallet'));
                    return;
                  }
                  setShowModal('create');
                }}
                className="create-wallet-btn"
              >
                {t('create_wallet_now')}
              </button>
            </div>
          ) : (
            <div>
              <div className="wallets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px', marginBottom: '24px' }}>
                {wallets.map((w) => {
                  const cardColor = w.color || 'linear-gradient(135deg, #3A3FBD, #2E33A8)';
                  const txtColor = getContrastColor(cardColor);
                  const muteColor = getMutedContrastColor(cardColor);
                  const iconBg = getIconBgColor(cardColor);
                  const isSelected = selectedWalletFilter === w.id;
                  
                  return (
                    <div 
                      key={w.id} 
                      onClick={() => toggleWalletFilter(w.id)}
                      className="wallet-card"
                      style={{ 
                        background: cardColor, 
                        color: txtColor, 
                        boxShadow: isSelected ? '0 0 0 4px #5F63E8, 0 12px 20px rgba(95, 99, 232, 0.2)' : '0 8px 16px rgba(0,0,0,0.06)',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div className="wallet-card-decoration"></div>
                      <div className="wallet-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="wallet-label" style={{ color: muteColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('balance_label')}</div>
                          <div className="wallet-balance" style={{ fontSize: '26px', fontWeight: '800' }}>
                            {showBalance ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.available_balance || 0) : "********"}
                          </div>
                        </div>
                        <div className="wallet-icon-wrapper" style={{ 
                          background: iconBg, 
                          color: txtColor,
                          width: '46px', 
                          height: '46px', 
                          borderRadius: '12px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center'
                        }}>
                          {renderWalletIcon(w.icon || 'wallet', 22)}
                        </div>
                      </div>
                      
                      <div className="wallet-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', zIndex: 2 }}>
                        <div>
                          <div className="wallet-name" style={{ fontSize: '16px', fontWeight: '700' }}>{w.name}</div>
                          <div className="wallet-type-label" style={{ fontSize: '12px', color: muteColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{t('type_label_prefix')}{w.type === 'cash' ? t('cash') : w.type === 'bank' ? t('bank') : t('ewallet')}</span>
                            {w.is_hidden && (
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '6px', 
                                background: 'rgba(254, 92, 115, 0.2)', 
                                color: txtColor === '#FFFFFF' ? '#FF8A8A' : '#FE5C73',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                              }}>
                                {t('hidden') || 'Đã ẩn'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="wallet-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEdit(w); }}
                            className="action-btn-edit"
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
                            {t('edit')}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(w.id); }}
                            className="action-btn-delete"
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
                            {t('delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>


              {/* LỊCH SỬ GIAO DỊCH RIÊNG BIỆT */}
              <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#343C6A' }}>
                    {selectedWalletFilter 
                      ? `Lịch sử giao dịch: ${wallets.find(w => w.id === selectedWalletFilter)?.name || ''}` 
                      : 'Lịch sử giao dịch: Tất cả các ví'}
                  </h2>
                  {selectedWalletFilter && (
                    <button 
                      onClick={() => setSelectedWalletFilter(null)}
                      style={{ background: 'transparent', color: '#1814F3', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Xem tất cả các ví
                    </button>
                  )}
                </div>

                <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #E6EFF5', boxShadow: '0 8px 16px rgba(0,0,0,0.02)' }}>
                  {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#718EBF' }}>
                      Không có giao dịch nào cho lựa chọn này.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#343C6A', fontSize: '15px' }}>
                      <thead style={{ color: '#718EBF', borderBottom: '1px solid #E6EFF5' }}>
                        <tr>
                          <th style={{ padding: '14px 8px', fontWeight: '500' }}>Mô tả</th>
                          <th style={{ padding: '14px 8px', fontWeight: '500' }}>Ví</th>
                          <th style={{ padding: '14px 8px', fontWeight: '500' }}>Loại</th>
                          <th style={{ padding: '14px 8px', fontWeight: '500' }}>Ngày</th>
                          <th style={{ padding: '14px 8px', fontWeight: '500' }}>Số tiền</th>
                          <th style={{ padding: '14px 8px', fontWeight: '500' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, idx) => {
                          const isExpense = tx.type === 'expense' || tx.type === 'Chi tiêu';
                          const walletName = wallets.find(w => w.id === tx.wallet_id)?.name || 'Ví không tên';
                          const dateText = tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('vi-VN') : tx.date;
                          
                          return (
                            <tr key={tx.id || idx} style={{ borderBottom: '1px solid #E6EFF5' }}>
                              <td style={{ padding: '14px 8px', fontWeight: '600' }}>{tx.title || tx.desc}</td>
                              <td style={{ padding: '14px 8px', color: '#718EBF' }}>{walletName}</td>
                              <td style={{ padding: '14px 8px' }}>
                                <span style={{ 
                                  padding: '4px 10px', 
                                  borderRadius: '20px', 
                                  fontSize: '12px', 
                                  fontWeight: '600', 
                                  background: isExpense ? '#FFE0EB' : '#DCFAF8', 
                                  color: isExpense ? '#FE5C73' : '#16DBCC' 
                                }}>
                                  {isExpense ? 'Chi tiêu' : 'Thu nhập'}
                                </span>
                              </td>
                              <td style={{ padding: '14px 8px', color: '#718EBF' }}>{dateText}</td>
                              <td style={{ padding: '14px 8px', fontWeight: '600', color: isExpense ? '#FE5C73' : '#16DBCC' }}>
                                {(isExpense ? '-' : '+') + new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount || 0)}
                              </td>
                              <td style={{ padding: '14px 8px' }}>
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm("Xóa giao dịch này? Số dư ví tương ứng sẽ được tự động hoàn lại.")) {
                                      try {
                                        await deleteTransaction(tx.id);
                                        fetchTransactions(selectedWalletFilter ? { wallet_id: selectedWalletFilter } : undefined);
                                      } catch (err: any) {
                                        alert(err.message || "Lỗi khi xóa giao dịch");
                                      }
                                    }
                                  }}
                                  style={{ border: '1px solid #FE5C73', color: '#FE5C73', background: 'transparent', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FFE0EB' }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL TẠO / SỬA VÍ */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <button 
                type="button" 
                onClick={() => { setShowModal(null); resetForm(); }}
                className="modal-back-btn"
              >
                ‹
              </button>
              <h2 className="modal-title">
                {showModal === 'create' ? t('add_new_wallet') : t('edit_wallet')}
              </h2>
            </div>

            {/* Live Card Preview */}
            <div className="card-preview" style={{ background: color, color: getContrastColor(color) }}>
              <div className="wallet-card-decoration"></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div className="wallet-label" style={{ color: getMutedContrastColor(color), letterSpacing: '0.5px' }}>{t('wallet_name')}</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', wordBreak: 'break-all' }}>
                    {name.toUpperCase() || t('my_new_wallet_placeholder')}
                  </div>
                </div>
                <div className="wallet-icon-wrapper" style={{ background: getIconBgColor(color), color: getContrastColor(color) }}>
                  {renderWalletIcon(icon, 22)}
                </div>
              </div>
              <div>
                <div className="wallet-label" style={{ color: getMutedContrastColor(color), letterSpacing: '0.5px' }}>{t('initial_balance')}</div>
                <div style={{ fontSize: '26px', fontWeight: '800' }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(balance) || 0)}
                </div>
              </div>
            </div>

            <form onSubmit={showModal === 'create' ? handleCreate : handleUpdate}>
              {/* Wallet Name */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-group-label">{t('wallet_name')}</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder={t('wallet_name_placeholder')}
                  className="wallet-input"
                />
              </div>

              {/* Initial Balance */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-group-label">{t('initial_balance_label')}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    value={balance} 
                    onChange={(e) => setBalance(e.target.value)} 
                    placeholder="0"
                    disabled={showModal === 'edit'}
                    className="wallet-input"
                    style={{ 
                      paddingRight: '40px',
                      background: showModal === 'edit' ? '#F1F5F9' : '#F5F7FA',
                      color: showModal === 'edit' ? '#94A3B8' : '#1E293B',
                      cursor: showModal === 'edit' ? 'not-allowed' : 'text',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <small style={{ color: '#EF4444', fontSize: '12px', fontWeight: '500' }}>
                      {t('balance_locked_warning')}
                    </small>
                  </div>
                )}
              </div>

              {/* Wallet Type */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-group-label">{t('select_wallet_type')}</label>
                <div className="wallet-type-grid">
                  {[
                    { key: 'cash', label: t('cash'), icon: <CardNoteIcon size={16} /> },
                    { key: 'bank', label: t('bank'), icon: <BankIcon size={16} /> },
                    { key: 'ewallet', label: t('ewallet'), icon: <QrIcon size={16} /> }
                  ].map((t) => {
                    const isSelected = type === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setType(t.key)}
                        className="type-select-btn"
                        style={{
                          border: isSelected ? '2px solid #5F63E8' : '2px solid transparent',
                          background: isSelected ? '#EEF2FF' : '#F5F7FA',
                          color: isSelected ? '#5F63E8' : '#718EBF',
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
                <label className="form-group-label">{t('select_icon')}</label>
                <div className="icon-grid">
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
                        className="icon-select-btn"
                        style={{
                          border: isSelected ? '2px solid #5F63E8' : '2px solid transparent',
                          background: isSelected ? '#EEF2FF' : '#F5F7FA',
                          color: isSelected ? '#5F63E8' : '#718EBF',
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
                <label className="form-group-label">{t('select_color')}</label>
                <div className="color-grid">
                  {colorOptions.map((col) => {
                    const isSelected = color === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setColor(col)}
                        className="color-dot"
                        style={{
                          background: col,
                          boxShadow: isSelected ? '0 0 0 2px #fff, 0 0 0 4px #5F63E8' : '0 2px 6px rgba(0,0,0,0.08)',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Checkbox ẩn ví trên dashboard */}
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="isHiddenCheckbox"
                  checked={isHidden} 
                  onChange={(e) => setIsHidden(e.target.checked)} 
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    cursor: 'pointer',
                    accentColor: '#5F63E8'
                  }}
                />
                <label htmlFor="isHiddenCheckbox" style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px', cursor: 'pointer' }}>
                  Ẩn ví này trên Dashboard (Trang chủ)
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn-submit-wallet">
                  <span>{showModal === 'create' ? t('create_wallet_btn') : t('save_changes')}</span>
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

      {/* MODAL CHUYỂN TIỀN NỘI BỘ */}
      {showTransferModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ 
            background: '#fff', 
            padding: '32px', 
            borderRadius: '28px', 
            width: '480px', 
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', position: 'relative', height: '40px' }}>
              <button 
                type="button" 
                onClick={() => { setShowTransferModal(false); resetTransferForm(); }}
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
                }}
              >
                ‹
              </button>
              <h2 style={{ width: '100%', textAlign: 'center', margin: 0, color: '#1E293B', fontSize: '20px', fontWeight: '700' }}>
                Chuyển tiền nội bộ
              </h2>
            </div>

            <form onSubmit={handleTransferSubmit}>
              {/* Ví gửi */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>Ví gửi tiền</label>
                <select 
                  value={fromWalletId} 
                  onChange={(e) => {
                    setFromWalletId(e.target.value);
                    if (toWalletId === e.target.value) {
                      setToWalletId('');
                    }
                  }} 
                  required
                  style={{ 
                    width: '100%', 
                    padding: '14px 18px', 
                    borderRadius: '14px', 
                    border: '1px solid #E6EFF5',
                    background: '#F5F7FA',
                    color: '#1E293B',
                    outline: 'none',
                    fontWeight: '500',
                    fontSize: '14px',
                  }}
                >
                  <option value="">-- Chọn ví gửi --</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.available_balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ví nhận */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>Ví nhận tiền</label>
                <select 
                  value={toWalletId} 
                  onChange={(e) => setToWalletId(e.target.value)} 
                  required
                  disabled={!fromWalletId}
                  style={{ 
                    width: '100%', 
                    padding: '14px 18px', 
                    borderRadius: '14px', 
                    border: '1px solid #E6EFF5',
                    background: !fromWalletId ? '#E2E8F0' : '#F5F7FA',
                    color: '#1E293B',
                    outline: 'none',
                    fontWeight: '500',
                    fontSize: '14px',
                    cursor: !fromWalletId ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">-- Chọn ví nhận --</option>
                  {wallets.filter(w => w.id !== fromWalletId).map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.available_balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Số tiền */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>Số tiền chuyển</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    value={transferAmount} 
                    onChange={(e) => setTransferAmount(e.target.value)} 
                    required 
                    placeholder="0"
                    min="1"
                    style={{ 
                      width: '100%', 
                      padding: '14px 40px 14px 18px', 
                      borderRadius: '14px', 
                      border: '1px solid transparent',
                      background: '#F5F7FA',
                      color: '#1E293B',
                      fontWeight: '600',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ 
                    position: 'absolute', 
                    right: '18px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#475569', 
                    fontWeight: 'bold' 
                  }}>đ</span>
                </div>
              </div>

              {/* Ghi chú */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>Ghi chú chuyển tiền</label>
                <input 
                  type="text" 
                  value={transferNotes} 
                  onChange={(e) => setTransferNotes(e.target.value)} 
                  placeholder="Nhập ghi chú chuyển tiền..."
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
                  }}
                />
              </div>

              {/* Nút submit */}
              <button 
                type="submit" 
                style={{ 
                  width: '100%',
                  background: '#5F63E8', 
                  color: '#fff', 
                  padding: '14px 20px', 
                  borderRadius: '16px', 
                  border: 'none', 
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(95, 99, 232, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                Xác nhận chuyển khoản
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { apiFetch } from '../lib/api';
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

const formatWalletCurrency = (amount: number | string, currencyCode: string = 'VND') => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '0';
  let locale = 'vi-VN';
  if (currencyCode === 'USD') locale = 'en-US';
  else if (currencyCode === 'EUR') locale = 'de-DE';
  else if (currencyCode === 'GBP') locale = 'en-GB';
  else if (currencyCode === 'JPY') locale = 'ja-JP';
  
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(numericAmount);
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function Wallets() {
  const { 
    isLoggedIn, wallets, fetchWallets, createWallet, 
    updateWallet, deleteWallet, isLoadingWallets, userData
  } = useAppContext();
  const { t } = useLanguage();

  // State cho Modals
  const [showModal, setShowModal] = useState<'create' | 'edit' | 'transfer' | 'history' | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [showWalletBalance, setShowWalletBalance] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('linear-gradient(135deg, #3A3FBD, #2E33A8)');
  const [icon, setIcon] = useState('wallet');
  const [walletCurrency, setWalletCurrency] = useState('VND');

  // Internal Transfer states
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const [isTransferring, setIsTransferring] = useState(false);

  // History states
  const [historyWallet, setHistoryWallet] = useState<any>(null);
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const openHistory = async (wallet: any) => {
    setHistoryWallet(wallet);
    setShowModal('history');
    setIsLoadingHistory(true);
    try {
      const response = await apiFetch(`/wallets/${wallet.id}/transactions`);
      setHistoryTransactions(response.data?.data || response.data || []);
    } catch (e: any) {
      alert("Lỗi tải lịch sử: " + (e.message || "Không thể tải"));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferFrom || !transferTo || !transferAmount) {
      alert("Vui lòng điền đầy đủ thông tin chuyển tiền!");
      return;
    }
    if (transferFrom === transferTo) {
      alert("Ví chuyển và ví nhận phải khác nhau!");
      return;
    }
    setIsTransferring(true);
    try {
      await apiFetch('/wallets/transfer', {
        method: 'POST',
        body: JSON.stringify({
          from_wallet_id: transferFrom,
          to_wallet_id: transferTo,
          amount: parseFloat(transferAmount),
        })
      });
      alert("Chuyển tiền nội bộ thành công!");
      setShowModal(null);
      setTransferFrom('');
      setTransferTo('');
      setTransferAmount('');
      fetchWallets();
    } catch (e: any) {
      alert("Lỗi chuyển tiền: " + (e.message || "Đã xảy ra lỗi"));
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchWallets();
    }
  }, [isLoggedIn]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert(t('login_required_to_create_wallet'));
      return;
    }
    try {
      await createWallet({ name, type, available_balance: balance, color, icon, currency_code: walletCurrency });
      setShowModal(null);
      resetForm();
    } catch (err) {
      alert(t('create_wallet_error'));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateWallet(selectedWallet.id, { name, type, color, icon, currency_code: walletCurrency });
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
    setWalletCurrency('VND');
    setSelectedWallet(null);
  };

  const openEdit = (wallet: any) => {
    setSelectedWallet(wallet);
    setName(wallet.name);
    setType(wallet.type);
    setBalance(wallet.available_balance ? String(wallet.available_balance) : '0');
    setColor(wallet.color || 'linear-gradient(135deg, #3A3FBD, #2E33A8)');
    setIcon(wallet.icon || 'wallet');
    setWalletCurrency(wallet.currency_code || 'VND');
    setShowModal('edit');
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="wallets" />
      <main className="main-content wallets-main">
        <nav className="navbar wallets-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title wallets-title" style={{ margin: 0 }}>{t('wallets_and_accounts')}</h1>
            <button 
              onClick={() => setShowWalletBalance(!showWalletBalance)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718EBF', display: 'flex', alignItems: 'center', padding: '5px' }}
              title={showWalletBalance ? "Ẩn số tiền" : "Hiện số tiền"}
            >
              {showWalletBalance ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => {
                if (!isLoggedIn) {
                  alert(t('login_required_to_create_wallet'));
                  return;
                }
                setShowModal('transfer');
              }}
              className="transfer-wallet-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 10L4 6l4-4" />
                <path d="M4 6h16" />
                <path d="M16 14l4 4-4 4" />
                <path d="M20 18H4" />
              </svg>
              Chuyển tiền nội bộ
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
              <div className="empty-state-icon">👛</div>
              <h3 className="empty-state-title">{t('no_wallets')}</h3>
              <p className="empty-state-desc">{t('no_wallets_desc')}</p>
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
            <>

            <div className="wallets-grid">
              {wallets.map((w) => {
                const cardColor = w.color || 'linear-gradient(135deg, #3A3FBD, #2E33A8)';
                const txtColor = getContrastColor(cardColor);
                const muteColor = getMutedContrastColor(cardColor);
                const iconBg = getIconBgColor(cardColor);
                
                return (
                  <div key={w.id} className="wallet-card" style={{ background: cardColor, color: txtColor }}>
                    <div className="wallet-card-decoration"></div>
                    <div className="wallet-card-header">
                      <div>
                        <div className="wallet-label" style={{ color: muteColor }}>{t('balance_label')}</div>
                        <div className="wallet-balance">
                          {showWalletBalance ? formatWalletCurrency(w.available_balance || 0, w.currency_code) : '******'}
                        </div>
                      </div>
                      <div className="wallet-icon-wrapper" style={{ background: iconBg, color: txtColor }}>
                        {renderWalletIcon(w.icon || 'wallet', 22)}
                      </div>
                    </div>
                    
                    <div className="wallet-card-footer">
                      <div>
                        <div className="wallet-name">{w.name}</div>
                        <div className="wallet-type-label" style={{ color: muteColor }}>
                          {t('type_label_prefix')}{w.type === 'cash' ? t('cash') : w.type === 'bank' ? t('bank') : t('ewallet')}
                        </div>
                      </div>
                      <div className="wallet-actions">
                        <button 
                          onClick={() => openHistory(w)}
                          className="action-btn-edit"
                          style={{ background: iconBg, color: txtColor }}
                        >
                          Lịch sử
                        </button>
                        <button 
                          onClick={() => openEdit(w)}
                          className="action-btn-edit"
                          style={{ background: iconBg, color: txtColor }}
                        >
                          {t('edit')}
                        </button>
                        <button 
                          onClick={() => handleDelete(w.id)}
                          className="action-btn-delete"
                          style={{ color: w.color ? (txtColor === '#FFFFFF' ? '#FF8A8A' : '#EF4444') : '#EF4444' }}
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      </main>

      {/* MODAL TẠO / SỬA VÍ */}
      {(showModal === 'create' || showModal === 'edit') && (
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
                  {formatWalletCurrency(Number(balance) || 0, walletCurrency)}
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
                    style={{ paddingRight: '40px' }}
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

              {/* Wallet Currency */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-group-label">Đơn vị tiền tệ</label>
                <select 
                  value={walletCurrency} 
                  onChange={(e) => setWalletCurrency(e.target.value)}
                  className="wallet-input"
                >
                  <option value="VND">VNĐ (₫)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              {/* Wallet Type */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-group-label">Loại ví</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  className="wallet-input"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Tiền gửi ngân hàng</option>
                  <option value="ewallet">Ví điện tử</option>
                </select>
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
                        className={`icon-select-btn ${isSelected ? 'active' : ''}`}
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
                        className={`color-dot ${isSelected ? 'active' : ''}`}
                        style={{ background: col }}
                      />
                    );
                  })}
                </div>
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

      {/* TRANSFER MODAL */}
      {showModal === 'transfer' && (
        <div className="modal-overlay">
          <div className="modal-content wallet-premium-modal" style={{ maxWidth: '500px', position: 'relative' }}>
            <button 
              type="button" 
              onClick={() => { setShowModal(null); setTransferFrom(''); setTransferTo(''); setTransferAmount(''); }}
              className="modal-close-btn"
            >
              ×
            </button>
            <div className="modal-title-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 10L4 6l4-4" />
                <path d="M4 6h16" />
                <path d="M16 14l4 4-4 4" />
                <path d="M20 18H4" />
              </svg>
              <h3>Chuyển tiền nội bộ</h3>
            </div>

            <div className="transfer-row">
              <div className="transfer-col">
                <div className="transfer-label">Tên ví chuyển</div>
                <select 
                  value={transferFrom} 
                  onChange={e => setTransferFrom(e.target.value)}
                  className="wallet-premium-input wallet-input"
                  style={{ appearance: 'none', paddingRight: '36px' }}
                >
                  <option value="" disabled>Chọn tên ví...</option>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatWalletCurrency(w.available_balance, w.currency_code)})</option>)}
                </select>
                <svg style={{ position: 'absolute', right: '14px', bottom: '16px', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8F9BB3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              
              <div className="transfer-arrow-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>

              <div className="transfer-col">
                <div className="transfer-label">Tên ví nhận</div>
                <select 
                  value={transferTo} 
                  onChange={e => setTransferTo(e.target.value)}
                  className="wallet-premium-input wallet-input"
                  style={{ appearance: 'none', paddingRight: '36px' }}
                >
                  <option value="" disabled>Chọn tên ví...</option>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatWalletCurrency(w.available_balance, w.currency_code)})</option>)}
                </select>
                <svg style={{ position: 'absolute', right: '14px', bottom: '16px', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8F9BB3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <input 
                type="number" 
                value={transferAmount} 
                onChange={e => setTransferAmount(e.target.value)}
                placeholder="Nhập số tiền..."
                className="wallet-premium-input wallet-input"
              />
            </div>

            <button 
              onClick={handleTransfer}
              disabled={isTransferring}
              className="wallet-premium-btn"
            >
              {isTransferring ? 'Đang xử lý...' : 'Chuyển tiền ngay'}
            </button>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showModal === 'history' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content wallet-premium-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              type="button" 
              onClick={() => setShowModal(null)}
              className="modal-close-btn"
            >
              ×
            </button>
            <div className="modal-title-left">
              <h3>Lịch sử giao dịch - {historyWallet?.name}</h3>
            </div>

            {isLoadingHistory ? (
              <div style={{ color: '#718EBF', textAlign: 'center', padding: '30px', fontWeight: '600' }}>Đang tải dữ liệu...</div>
            ) : historyTransactions.length === 0 ? (
              <div style={{ color: '#718EBF', textAlign: 'center', padding: '30px', fontWeight: '600' }}>Chưa có giao dịch nào trong ví này.</div>
            ) : (
              <div className="history-list">
                {historyTransactions.map((tx: any) => (
                  <div key={tx.id} className="wallet-history-row">
                    <div>
                      <div className="history-row-title">{tx.title || tx.category_name || tx.notes || 'Giao dịch'}</div>
                      <div className="history-row-date">{new Date(tx.transaction_date).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className={`history-row-amount ${tx.type === 'expense' ? 'expense' : 'income'}`}>
                      {tx.type === 'expense' ? '-' : '+'}
                      {formatWalletCurrency(tx.amount || 0, historyWallet?.currency_code || 'VND')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { apiFetch, savingsApi } from '../lib/api';
import './wallets.css';
import '../savings/savings.css';

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
  
  const fixedAmount = Math.round(numericAmount * 100) / 100;
  const isInteger = fixedAmount % 1 === 0;

  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND', 
    minimumFractionDigits: 0,
    maximumFractionDigits: isInteger ? 0 : 2 
  }).format(fixedAmount);
};

const formatWalletBalance = (amount: number | string) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '0';
  
  const fixedAmount = Math.round(numericAmount * 100) / 100;
  const isInteger = fixedAmount % 1 === 0;

  return new Intl.NumberFormat('vi-VN', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: isInteger ? 0 : 2 
  }).format(fixedAmount);
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

  // Savings tab state and helper functions
  const [activeTab, setActiveTab] = useState<'wallets' | 'savings'>('wallets');
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [isLoadingSavings, setIsLoadingSavings] = useState(false);
  const [savingsError, setSavingsError] = useState('');

  const fetchSavingsGoals = async () => {
    const cached = localStorage.getItem('cached_savings_goals');
    if (cached) {
      try {
        setSavingsGoals(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem('cached_savings_goals');
      }
    }

    setIsLoadingSavings(savingsGoals.length === 0 && !cached);
    try {
      const response = await savingsApi.getAll();
      if (response.status === 'success') {
        const data = response.data || [];
        setSavingsGoals(data);
        localStorage.setItem('cached_savings_goals', JSON.stringify(data));
        setSavingsError('');
      } else {
        setSavingsError(response.message || 'Lỗi tải mục tiêu tiết kiệm');
      }
    } catch (err: any) {
      setSavingsError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsLoadingSavings(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'savings') {
        setActiveTab('savings');
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'savings') {
      fetchSavingsGoals();
    }
  }, [isLoggedIn, activeTab]);

  const calcPercent = (current: string | number, target: string | number) => {
    const curVal = Number(current);
    const tarVal = Number(target);
    if (!tarVal || isNaN(curVal) || isNaN(tarVal)) return 0;
    return parseFloat(((curVal / tarVal) * 100).toFixed(1));
  };

  const getRemainingDays = (targetDateStr: string | null) => {
    if (!targetDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatVND = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const handleCopyId = () => {
    const qrData = userData?.identifier || '';
    if (!qrData) return;
    navigator.clipboard.writeText(String(qrData));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // State & Effects cho QR Code Modal
  const [selectedReceivingWalletId, setSelectedReceivingWalletId] = useState<string>('');
  const [qrAmount, setQrAmount] = useState<string>('');
  const [qrDescription, setQrDescription] = useState<string>('');

  useEffect(() => {
    if (showQrModal && wallets.length > 0) {
      const eligible = wallets.filter(w => w.type !== 'cash');
      const defaultWallet = eligible.find(w => w.is_default_receiving);
      if (defaultWallet) {
        setSelectedReceivingWalletId(defaultWallet.id);
      } else {
        const firstBank = eligible.find(w => w.type === 'bank' || w.type === 'ewallet');
        if (firstBank) {
          setSelectedReceivingWalletId(firstBank.id);
        } else if (eligible[0]) {
          setSelectedReceivingWalletId(eligible[0].id);
        }
      }
    }
  }, [showQrModal, wallets]);

  const handleSelectReceivingWallet = async (walletId: string) => {
    setSelectedReceivingWalletId(walletId);
    try {
      await apiFetch(`/wallets/${walletId}/set-default-receiving`, {
        method: 'POST'
      });
      fetchWallets();
    } catch (e: any) {
      console.error("Lỗi khi đặt ví mặc định nhận tiền:", e);
    }
  };

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
  const [isHidden, setIsHidden] = useState(false);
  const [isDefaultReceiving, setIsDefaultReceiving] = useState(false);
  const [showHiddenWallets, setShowHiddenWallets] = useState(false);

  // Internal Transfer states
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const [isTransferring, setIsTransferring] = useState(false);

  // Currency Converter states
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState('1');
  const [exchangeFrom, setExchangeFrom] = useState('USD');
  const [exchangeTo, setExchangeTo] = useState('VND');

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    VND: 25450,
    USD: 1,
    EUR: 0.93,
    GBP: 0.79,
    JPY: 158
  });

  useEffect(() => {
    if (showExchangeModal) {
      fetch('https://open.er-api.com/v6/latest/USD')
        .then(res => res.json())
        .then(data => {
          if (data && data.rates) {
            setExchangeRates(data.rates);
          }
        })
        .catch(err => {
          console.error("Lỗi khi fetch tỷ giá từ API:", err);
        });
    }
  }, [showExchangeModal]);

  const getConvertedAmount = () => {
    const amt = parseFloat(exchangeAmount);
    if (isNaN(amt) || amt <= 0) return '0';
    const usdAmount = amt / (exchangeRates[exchangeFrom] || 1);
    const finalAmount = usdAmount * (exchangeRates[exchangeTo] || 1);
    return finalAmount.toLocaleString('vi-VN', { 
      maximumFractionDigits: exchangeTo === 'VND' ? 0 : 4 
    });
  };

  const handleSwapCurrencies = () => {
    const temp = exchangeFrom;
    setExchangeFrom(exchangeTo);
    setExchangeTo(temp);
  };

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
      alert(e.message || "Đã xảy ra lỗi");
    } finally {
      setIsTransferring(false);
    }
  };

  // Transfer Tab state
  const [transferTab, setTransferTab] = useState<'internal' | 'p2p'>('internal');

  // P2P states
  const [p2pIdentifier, setP2pIdentifier] = useState('');
  const [isP2pChecking, setIsP2pChecking] = useState(false);
  const [p2pRecipient, setP2pRecipient] = useState<any>(null);
  const [p2pFromWalletId, setP2pFromWalletId] = useState('');
  const [p2pAmount, setP2pAmount] = useState('');
  const [p2pNotes, setP2pNotes] = useState('');
  const [isP2pTransferring, setIsP2pTransferring] = useState(false);

  // Contacts states
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);



  const handleP2pCheck = async () => {
    if (!p2pIdentifier.trim()) {
      alert("Vui lòng nhập mã định danh!");
      return;
    }
    setIsP2pChecking(true);
    setP2pRecipient(null);
    try {
      const response = await apiFetch('/qr/decode', {
        method: 'POST',
        body: JSON.stringify({ qr_string: p2pIdentifier.trim() })
      });
      if (response.status === 'success' && response.data) {
        setP2pRecipient(response.data);
      } else {
        alert(response.message || "Không tìm thấy thông tin người nhận.");
      }
    } catch (e: any) {
      alert(e.message || "Mã định danh không hợp lệ hoặc người dùng không tồn tại.");
    } finally {
      setIsP2pChecking(false);
    }
  };

  const handleP2pTransfer = async () => {
    if (!p2pFromWalletId) {
      alert("Vui lòng chọn ví chuyển tiền!");
      return;
    }
    if (!p2pAmount || parseFloat(p2pAmount) <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!");
      return;
    }

    const fromWallet = wallets.find(w => w.id === p2pFromWalletId);
    if (fromWallet?.type === 'cash') {
      alert("Không cho phép thực hiện giao dịch quét QR bằng ví tiền mặt.");
      return;
    }
    if (p2pRecipient?.type === 'external' && fromWallet?.currency_code !== 'VND') {
      alert("Chuyển khoản liên ngân hàng bằng QR chỉ hỗ trợ đơn vị tiền tệ VND.");
      return;
    }

    setIsP2pTransferring(true);
    try {
      const body: any = {
        from_wallet_id: p2pFromWalletId,
        payee_type: p2pRecipient.type || 'internal',
        amount: parseFloat(p2pAmount),
        notes: p2pNotes || undefined
      };
      if (p2pRecipient.type === 'internal') {
        body.payee_user_id = p2pRecipient.payee_user_id;
        body.to_wallet_id = p2pRecipient.to_wallet_id || undefined;
      } else {
        body.bank_code = p2pRecipient.bank_code;
        body.account_number = p2pRecipient.account_number;
        body.payee_name = p2pRecipient.payee_name;
      }

      const res = await apiFetch('/qr/transfer', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      alert("Chuyển tiền thành công!");
      setShowModal(null);
      // Reset form
      setP2pRecipient(null);
      setP2pIdentifier('');
      setP2pAmount('');
      setP2pNotes('');
      setP2pFromWalletId('');
      
      // Reload data
      fetchWallets();
    } catch (e: any) {
      alert(e.message || "Không thể hoàn tất giao dịch.");
    } finally {
      setIsP2pTransferring(false);
    }
  };

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const res = await apiFetch('/payees');
      setContactsList(res.data?.data || res.data || []);
    } catch (e) {
      console.error("Lỗi lấy danh bạ:", e);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const deleteContact = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa liên hệ này khỏi danh bạ?")) {
      try {
        await apiFetch(`/payees/${id}`, { method: 'DELETE' });
        fetchContacts();
      } catch (e: any) {
        alert("Lỗi khi xóa: " + e.message);
      }
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
      await createWallet({ name, type, available_balance: 0, color, icon, currency_code: walletCurrency });
      setShowModal(null);
      resetForm();
    } catch (err: any) {
      alert(err.message || t('create_wallet_error') || 'Lỗi khi tạo ví');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateWallet(selectedWallet.id, { 
        name, 
        type, 
        color, 
        icon, 
        currency_code: walletCurrency,
        is_hidden: isHidden
      });
      
      if (isDefaultReceiving && !selectedWallet.is_default_receiving) {
        await apiFetch(`/wallets/${selectedWallet.id}/set-default-receiving`, {
          method: 'POST'
        });
        await fetchWallets();
      }
      
      setShowModal(null);
      resetForm();
    } catch (err: any) {
      alert(err.message || t('update_wallet_error') || 'Lỗi khi sửa ví');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('delete_wallet_confirm'))) {
      try {
        await deleteWallet(id);
      } catch (err: any) {
        alert(err.message || t('delete_wallet_error') || 'Lỗi khi xóa ví');
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
    setIsHidden(false);
    setIsDefaultReceiving(false);
    setSelectedWallet(null);
  };

  const openEdit = (wallet: any) => {
    setSelectedWallet(wallet);
    setName(wallet.name);
    setType(wallet.type);
    setBalance(wallet.available_balance ? String(wallet.available_balance) : '0');
    setColor(wallet.color || 'linear-gradient(135deg, #3A3FBD, #2E33A8)');
    setIcon(wallet.icon || 'wallet');
    setWalletCurrency('VND');
    setIsHidden(!!wallet.is_hidden);
    setIsDefaultReceiving(!!wallet.is_default_receiving);
    setShowModal('edit');
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="wallets" />
      <main className="main-content wallets-main">
        <nav className="navbar wallets-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title wallets-title" style={{ margin: 0 }}>{t('wallets_and_accounts')}</h1>
            <span style={{ color: 'var(--text-light)', opacity: 0.6 }}>•</span>
            <button 
              onClick={() => setShowWalletBalance(!showWalletBalance)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718EBF', display: 'flex', alignItems: 'center', padding: '5px' }}
              title={showWalletBalance ? "Ẩn số tiền" : "Hiện số tiền"}
            >
              {showWalletBalance ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => {
                if (!isLoggedIn) {
                  alert(t('login_required_to_create_wallet'));
                  return;
                }
                setShowModal('transfer');
              }}
              className="secondary-action-btn btn-transfer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 10L4 6l4-4" />
                <path d="M4 6h16" />
                <path d="M16 14l4 4-4 4" />
                <path d="M20 18H4" />
              </svg>
              Chuyển tiền
            </button>
            <button 
              onClick={() => setShowExchangeModal(true)}
              className="secondary-action-btn btn-exchange"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Đổi ngoại tệ
            </button>
            {isLoggedIn && (
              <button 
                onClick={() => setShowQrModal(true)}
                className="secondary-action-btn btn-qr"
              >
                <QrIcon size={15} />
                Mã QR
              </button>
            )}
            <button 
              onClick={() => {
                if (!isLoggedIn) {
                  alert(t('login_required_to_create_wallet'));
                  return;
                }
                setShowModal('create');
              }}
              className="primary-action-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Tạo ví mới
            </button>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: '600', color: '#343C6A', fontSize: '15px' }}>
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img 
                    src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=EM&backgroundColor=b6e3f4"} 
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
          {/* Tab Selector */}
          <div className="wallets-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setActiveTab('wallets')} 
                style={{ 
                  padding: '12px 24px', 
                  fontWeight: '700', 
                  fontSize: '16px', 
                  cursor: 'pointer',
                  color: activeTab === 'wallets' ? '#1814F3' : 'var(--text-light)', 
                  borderBottom: activeTab === 'wallets' ? '3px solid #1814F3' : '3px solid transparent',
                  transition: 'all 0.2s',
                  background: 'none',
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none'
                }}
              >
                {t('wallets') || 'Ví của tôi'}
              </button>
              <button 
                onClick={() => setActiveTab('savings')} 
                style={{ 
                  padding: '12px 24px', 
                  fontWeight: '700', 
                  fontSize: '16px', 
                  cursor: 'pointer',
                  color: activeTab === 'savings' ? '#1814F3' : 'var(--text-light)', 
                  borderBottom: activeTab === 'savings' ? '3px solid #1814F3' : '3px solid transparent',
                  transition: 'all 0.2s',
                  background: 'none',
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none'
                }}
              >
                Ví tiết kiệm (Heo đất)
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              {/* Toggle Hidden Wallets (Only show if activeTab === 'wallets') */}
              {activeTab === 'wallets' && (
                <button
                  onClick={() => setShowHiddenWallets(!showHiddenWallets)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    background: showHiddenWallets ? 'rgba(24, 20, 243, 0.05)' : 'var(--card-bg)',
                    color: showHiddenWallets ? '#1814F3' : 'var(--text-light)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  title={showHiddenWallets ? "Ẩn ví ẩn" : "Hiện ví ẩn"}
                >
                  {showHiddenWallets ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                  <span>{showHiddenWallets ? 'Ẩn ví ẩn' : 'Hiện ví ẩn'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="tab-pane-animation" key={activeTab}>
            {activeTab === 'wallets' ? (
              isLoadingWallets ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>{t('loading')}</div>
              ) : wallets.length === 0 ? (
                <div className="wallets-empty-state" style={{ margin: '20px auto' }}>
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
                <div className="wallets-grid">
                  {wallets
                    .filter((w) => !w.is_hidden || showHiddenWallets)
                    .map((w) => {
                      const cardColor = w.color || 'linear-gradient(135deg, #3A3FBD, #2E33A8)';
                      const txtColor = getContrastColor(cardColor);
                      const muteColor = getMutedContrastColor(cardColor);
                      const iconBg = getIconBgColor(cardColor);
                      
                      return (
                        <div key={w.id} className="wallet-card" style={{ background: cardColor, color: txtColor, opacity: w.is_hidden ? 0.6 : 1 }}>
                          <div className="wallet-card-decoration"></div>
                          <div className="wallet-card-header">
                            <div>
                              <div className="wallet-label" style={{ color: muteColor }}>{t('balance_label')}</div>
                              <div className="wallet-balance">
                                {showWalletBalance ? (
                                  <>
                                    {formatWalletBalance(w.available_balance || 0)}
                                    <span className="currency-symbol">đ</span>
                                  </>
                                ) : '******'}
                              </div>
                            </div>
                            <div className="wallet-icon-wrapper" style={{ background: iconBg, color: txtColor }}>
                              {renderWalletIcon(w.icon || 'wallet', 22)}
                            </div>
                          </div>
                          
                          <div className="wallet-card-footer">
                            <div>
                              <div className="wallet-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span>{w.name}</span>
                                {w.is_hidden && (
                                  <span style={{ 
                                    fontSize: '9px', 
                                    fontWeight: '800', 
                                    background: getContrastColor(cardColor) === '#FFFFFF' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)', 
                                    color: getContrastColor(cardColor) === '#FFFFFF' ? '#FF8A8A' : '#EF4444', 
                                    padding: '2px 6px', 
                                    borderRadius: '10px', 
                                    textTransform: 'uppercase' 
                                  }}>
                                    Đã ẩn
                                  </span>
                                )}
                                {w.is_default_receiving && (
                                  <span style={{ 
                                    fontSize: '9px', 
                                    fontWeight: '800', 
                                    background: getContrastColor(cardColor) === '#FFFFFF' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)', 
                                    color: getContrastColor(cardColor) === '#FFFFFF' ? '#B9F6CA' : '#10B981', 
                                    padding: '2px 6px', 
                                    borderRadius: '10px', 
                                    textTransform: 'uppercase' 
                                  }}>
                                    Nhận mặc định
                                  </span>
                                )}
                              </div>
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
              )
            ) : (
              // SAVINGS TAB
              isLoadingSavings ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)', fontWeight: '600' }}>
                  {t('loading') || 'Đang tải dữ liệu...'}
                </div>
              ) : savingsError ? (
                <div className="savings-empty-state" style={{ borderColor: 'var(--danger)', margin: '20px auto' }}>
                  <div className="empty-state-icon" style={{ animation: 'none' }}>⚠️</div>
                  <h3 className="empty-state-title" style={{ color: 'var(--danger)' }}>Đã xảy ra lỗi</h3>
                  <p className="empty-state-desc">{savingsError}</p>
                  <button onClick={fetchSavingsGoals} className="create-wallet-btn" style={{ background: 'var(--danger)' }}>Thử lại</button>
                </div>
              ) : savingsGoals.length === 0 ? (
                <div className="savings-empty-state" style={{ margin: '20px auto' }}>
                  <div className="empty-state-icon">🐷</div>
                  <h3 className="empty-state-title">Chưa có mục tiêu tiết kiệm</h3>
                  <p className="empty-state-desc">Bắt đầu tích lũy tài chính bằng cách tạo mục tiêu tiết kiệm đầu tiên! Đặt tên, số tiền mong muốn và ngày đạt được.</p>
                  <Link href="/savings/create" className="create-wallet-btn" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
                    Tạo mục tiêu ngay
                  </Link>
                </div>
              ) : (
                <>
                  <div className="savings-grid">
                    {savingsGoals.map((goal) => {
                      const percent = calcPercent(goal.current_amount, goal.target_amount);
                      const isReached = percent >= 100;
                      const remainingDays = getRemainingDays(goal.target_date);
                      const hasAutoSave = !!goal.auto_save_frequency;
  
                      return (
                        <Link 
                          href={`/savings/${goal.id}`} 
                          key={goal.id} 
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div className="saving-card">
                            <div className="saving-card-header">
                              <div className="saving-card-title">{goal.name}</div>
                              {isReached ? (
                                <div className="saving-card-days saving-goal-reached-badge">Đạt mục tiêu</div>
                              ) : remainingDays !== null ? (
                                <div className="saving-card-days">
                                  {remainingDays > 0 ? `Còn ${remainingDays} ngày` : remainingDays === 0 ? 'Đến hạn hôm nay' : `Quá hạn ${Math.abs(remainingDays)} ngày`}
                                </div>
                              ) : (
                                <div className="saving-card-days">Không giới hạn</div>
                              )}
                            </div>
  
                            <div className="saving-card-stats">
                              <div className="saving-stat-item">
                                <span className="saving-stat-label">Đã tích lũy</span>
                                <span className="saving-stat-val accumulated">{formatVND(goal.current_amount)}</span>
                              </div>
                              <div className="saving-stat-item" style={{ alignItems: 'flex-end' }}>
                                <span className="saving-stat-label">Mục tiêu</span>
                                <span className="saving-stat-val target">{formatVND(goal.target_amount)}</span>
                              </div>
                            </div>
  
                            <div className="saving-progress-container">
                              <div className="saving-progress-track">
                                <div 
                                  className="saving-progress-fill" 
                                  style={{ 
                                    width: `${percent}%`,
                                    background: isReached ? '#10B981' : undefined
                                  }}
                                ></div>
                              </div>
                            </div>
  
                            <div className="saving-card-footer-info">
                              <div className="saving-auto-badge">
                                <span>Tự động tích lũy:</span>
                                <span style={{ color: hasAutoSave ? '#10B981' : '#FF4B4A' }}>
                                  {hasAutoSave ? 'Bật' : 'Tắt'}
                                </span>
                              </div>
                              <div className="saving-percent">
                                {percent}%
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
  
                  <div className="create-goal-footer-btn-wrapper">
                    <Link href="/savings/create" className="btn-create-goal" style={{ textDecoration: 'none' }}>
                      <span style={{ marginRight: '6px', fontSize: '18px', fontWeight: 'bold' }}>+</span>
                      <span>Tạo mục tiêu tiết kiệm mới</span>
                    </Link>
                  </div>
                </>
              )
            )}
          </div>


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
                <div className="wallet-label" style={{ color: getMutedContrastColor(color), letterSpacing: '0.5px' }}>
                  {showModal === 'create' ? t('balance_label') : t('initial_balance')}
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800' }}>
                  {formatWalletBalance(Number(balance) || 0)}
                  <span className="currency-symbol">đ</span>
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

              {/* Initial Balance (Only visible when editing, locked to current balance) */}
              {showModal === 'edit' && (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-group-label">{t('initial_balance_label')}</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      value={balance} 
                      onChange={(e) => setBalance(e.target.value)} 
                      placeholder="0"
                      disabled={true}
                      className="wallet-input"
                      style={{ paddingRight: '40px' }}
                    />
                    <span style={{ 
                      position: 'absolute', 
                      right: '18px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#94A3B8', 
                      fontWeight: 'bold' 
                    }}>đ</span>
                  </div>
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
                </div>
              )}

              {/* Wallet Currency (Forced to VND) */}
              <div style={{ marginBottom: '20px', display: 'none' }}>
                <label className="form-group-label">Đơn vị tiền tệ</label>
                <select 
                  value={walletCurrency} 
                  onChange={(e) => setWalletCurrency(e.target.value)}
                  className="wallet-input"
                >
                  <option value="VND">VNĐ (₫)</option>
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

              {showModal === 'edit' && (
                <div className="wallet-settings-group">
                  <div className="setting-switch-item">
                    <div className="setting-switch-label">
                      <span className="switch-title">Ẩn ví khỏi màn hình</span>
                      <span className="switch-desc">Ẩn ví này khỏi danh sách hiển thị trên trang chủ và các biểu đồ báo cáo.</span>
                    </div>
                    <label className="premium-switch">
                      <input 
                        type="checkbox" 
                        checked={isHidden} 
                        onChange={(e) => setIsHidden(e.target.checked)} 
                      />
                      <span className="premium-switch-slider"></span>
                    </label>
                  </div>

                  {/* Only show default receiving setting for bank or ewallet */}
                  {(type === 'bank' || type === 'ewallet') && (
                    <div className="setting-switch-item" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <div className="setting-switch-label">
                        <span className="switch-title">Đặt làm ví nhận mặc định</span>
                        <span className="switch-desc">Sử dụng ví này làm điểm nhận tiền mặc định cho các giao dịch chuyển khoản P2P/mã QR.</span>
                      </div>
                      <label className="premium-switch">
                        <input 
                          type="checkbox" 
                          checked={isDefaultReceiving} 
                          onChange={(e) => setIsDefaultReceiving(e.target.checked)} 
                        />
                        <span className="premium-switch-slider"></span>
                      </label>
                    </div>
                  )}
                </div>
              )}

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
              onClick={() => { 
                setShowModal(null); 
                setTransferFrom(''); 
                setTransferTo(''); 
                setTransferAmount(''); 
                setP2pRecipient(null);
                setP2pIdentifier('');
                setP2pAmount('');
                setP2pNotes('');
                setP2pFromWalletId('');
              }}
              className="modal-close-btn"
            >
              ×
            </button>
            <div className="modal-title-left" style={{ marginBottom: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 10L4 6l4-4" />
                <path d="M4 6h16" />
                <path d="M16 14l4 4-4 4" />
                <path d="M20 18H4" />
              </svg>
              <h3>Chuyển khoản</h3>
            </div>

            {/* Tab selection */}
            <div className="qr-modal-tabs" style={{ marginBottom: '20px' }}>
              <div 
                className={`qr-tab-item ${transferTab === 'internal' ? 'active' : ''}`}
                onClick={() => setTransferTab('internal')}
              >
                Chuyển nội bộ
              </div>
              <div 
                className={`qr-tab-item ${transferTab === 'p2p' ? 'active' : ''}`}
                onClick={() => setTransferTab('p2p')}
              >
                Đến người khác
              </div>
            </div>

            {transferTab === 'internal' ? (
              <>
                <div className="transfer-row">
                  <div className="transfer-col" style={{ position: 'relative' }}>
                    <div className="transfer-label">Tên ví chuyển</div>
                    <select 
                      value={transferFrom} 
                      onChange={e => setTransferFrom(e.target.value)}
                      className="wallet-premium-input wallet-input"
                      style={{ appearance: 'none', paddingRight: '36px' }}
                    >
                      <option value="" disabled>Chọn tên ví...</option>
                      {wallets.filter(w => !w.is_hidden).map(w => <option key={w.id} value={w.id}>{w.name} ({formatWalletCurrency(w.available_balance, w.currency_code)})</option>)}
                    </select>
                    <svg style={{ position: 'absolute', right: '14px', bottom: '16px', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8F9BB3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                  
                  <div className="transfer-arrow-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>

                  <div className="transfer-col" style={{ position: 'relative' }}>
                    <div className="transfer-label">Tên ví nhận</div>
                    <select 
                      value={transferTo} 
                      onChange={e => setTransferTo(e.target.value)}
                      className="wallet-premium-input wallet-input"
                      style={{ appearance: 'none', paddingRight: '36px' }}
                    >
                      <option value="" disabled>Chọn tên ví...</option>
                      {wallets.filter(w => !w.is_hidden).map(w => <option key={w.id} value={w.id}>{w.name} ({formatWalletCurrency(w.available_balance, w.currency_code)})</option>)}
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
              </>
            ) : (
              <>
                {!p2pRecipient ? (
                  <>
                    <div className="p2p-form-group">
                      <label className="p2p-form-label">Thông tin người hưởng thụ</label>
                      <input 
                        type="text"
                        value={p2pIdentifier}
                        onChange={e => setP2pIdentifier(e.target.value)}
                        placeholder="Mã định danh (ví dụ: USR123456)"
                        className="wallet-premium-input wallet-input"
                      />
                    </div>
                    
                    <div className="p2p-btn-group">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowContactsModal(true);
                          fetchContacts();
                        }}
                        className="p2p-action-btn btn-contact"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Danh bạ
                      </button>
                      <button 
                        type="button"
                        onClick={handleP2pCheck}
                        disabled={isP2pChecking}
                        className="p2p-action-btn btn-check"
                      >
                        {isP2pChecking ? 'Đang kiểm tra...' : 'Kiểm tra'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ animation: 'fadeIn 0.25s' }}>
                    {/* Beneficiary Info Card */}
                    <div className="beneficiary-card" style={{ marginTop: 0, marginBottom: '20px' }}>
                      <img 
                        src={p2pRecipient.avatar_url || "https://api.dicebear.com/7.x/miniavs/svg?seed=" + p2pRecipient.payee_name} 
                        alt={p2pRecipient.payee_name} 
                        className="beneficiary-avatar"
                      />
                      <div className="beneficiary-info">
                        <div className="beneficiary-name">{p2pRecipient.payee_name}</div>
                        <div className="beneficiary-id">{p2pRecipient.identifier}</div>
                        {p2pRecipient.recipient_wallet_name && (
                          <div className="beneficiary-wallet">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 12V8H6a2 2 0 0 0-2-2c0-1.1.9-2 2-2h12v4" />
                              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                              <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6h-4z" />
                            </svg>
                            <span>Ví nhận: {p2pRecipient.recipient_wallet_name}</span>
                          </div>
                        )}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setP2pRecipient(null)} 
                        className="beneficiary-close-btn"
                      >
                        ✕
                      </button>
                    </div>

                    {/* P2P Send Form Details */}
                    <div>
                      <div className="p2p-form-group">
                        <label className="p2p-form-label">Chọn ví chuyển tiền</label>
                        <select
                          value={p2pFromWalletId}
                          onChange={e => setP2pFromWalletId(e.target.value)}
                          className="p2p-select wallet-premium-input"
                        >
                          <option value="" disabled>Chọn ví chuyển...</option>
                          {/* Filter out cash and hidden wallets */}
                          {wallets.filter(w => w.type !== 'cash' && !w.is_hidden).map(w => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({formatWalletCurrency(w.available_balance, w.currency_code)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p2p-form-group">
                        <label className="p2p-form-label">Số tiền chuyển</label>
                        <input 
                          type="number"
                          value={p2pAmount}
                          onChange={e => setP2pAmount(e.target.value)}
                          placeholder="Nhập số tiền..."
                          className="wallet-premium-input wallet-input"
                        />
                      </div>

                      <div className="p2p-form-group">
                        <label className="p2p-form-label">Lời nhắn / Ghi chú</label>
                        <input 
                          type="text"
                          value={p2pNotes}
                          onChange={e => setP2pNotes(e.target.value)}
                          placeholder="Lời nhắn cho người nhận (tùy chọn)"
                          className="wallet-premium-input wallet-input"
                        />
                      </div>

                      <div className="p2p-btn-group" style={{ marginTop: '24px' }}>
                        <button
                          type="button"
                          onClick={() => setP2pRecipient(null)}
                          className="p2p-action-btn"
                          style={{ background: 'var(--bg-color)', color: 'var(--text-main)', flex: 1 }}
                        >
                          Quay lại
                        </button>
                        <button
                          type="button"
                          onClick={handleP2pTransfer}
                          disabled={isP2pTransferring}
                          className="p2p-action-btn btn-check"
                          style={{ flex: 2 }}
                        >
                          {isP2pTransferring ? 'Đang chuyển khoản...' : 'Xác nhận chuyển'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
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

      {showExchangeModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setShowExchangeModal(false)}>
          <div className="modal-content wallet-premium-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', borderRadius: '24px', padding: '30px', position: 'relative' }}>
            <button 
              type="button" 
              onClick={() => setShowExchangeModal(false)}
              className="modal-close-btn"
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}
            >
              ×
            </button>
            <div className="modal-title-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px' }}>💱</span>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Quy đổi ngoại tệ</h3>
            </div>
            
            <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              {/* Input Số tiền */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '13px', fontWeight: '600' }}>Số tiền cần đổi</label>
                <input 
                  type="number" 
                  value={exchangeAmount} 
                  onChange={e => setExchangeAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                  className="wallet-input"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '16px', fontWeight: '700', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>
              
              {/* Hàng chọn ngoại tệ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '12px', fontWeight: '600' }}>Từ loại tiền</label>
                  <select 
                    value={exchangeFrom} 
                    onChange={e => setExchangeFrom(e.target.value)}
                    className="wallet-input"
                    style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '700', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="VND">VNĐ (₫)</option>
                  </select>
                </div>
                
                <button 
                  type="button" 
                  onClick={handleSwapCurrencies}
                  style={{ 
                    background: 'linear-gradient(135deg, #1814F3 0%, #396AFF 100%)', 
                    border: 'none', 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer', 
                    marginTop: '18px',
                    boxShadow: '0 4px 10px rgba(24, 20, 243, 0.2)',
                    transition: 'all 0.2s',
                    fontSize: '16px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  🔄
                </button>
                
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '12px', fontWeight: '600' }}>Sang loại tiền</label>
                  <select 
                    value={exchangeTo} 
                    onChange={e => setExchangeTo(e.target.value)}
                    className="wallet-input"
                    style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '700', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <option value="VND">VNĐ (₫)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>
              
              {/* Kết quả quy đổi */}
              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#718EBF', marginBottom: '6px', fontWeight: '500' }}>Kết quả quy đổi tương đương</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#16DBCC' }}>
                  {getConvertedAmount()} {exchangeTo}
                </div>
              </div>
            </div>
            
            {/* Bảng tỷ giá hôm nay */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-main)', fontWeight: '700' }}>Tỷ giá quy đổi tham khảo:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '600' }}>💵 1 USD</span>
                  <span style={{ fontWeight: '700', color: '#1814F3' }}>{Math.round(exchangeRates.VND || 25450).toLocaleString('vi-VN')} ₫</span>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '600' }}>💶 1 EUR</span>
                  <span style={{ fontWeight: '700', color: '#1814F3' }}>{Math.round((exchangeRates.VND || 25450) / (exchangeRates.EUR || 0.93)).toLocaleString('vi-VN')} ₫</span>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '600' }}>💷 1 GBP</span>
                  <span style={{ fontWeight: '700', color: '#1814F3' }}>{Math.round((exchangeRates.VND || 25450) / (exchangeRates.GBP || 0.79)).toLocaleString('vi-VN')} ₫</span>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '600' }}>💴 1 JPY</span>
                  <span style={{ fontWeight: '700', color: '#1814F3' }}>{Math.round((exchangeRates.VND || 25450) / (exchangeRates.JPY || 158)).toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={() => setShowExchangeModal(false)}
              className="wallet-premium-btn"
              style={{ marginTop: '20px', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      {showQrModal && isLoggedIn && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="qr-app-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Header: Title and Back button */}
            <div className="qr-modal-header">
              <button 
                type="button" 
                onClick={() => setShowQrModal(false)}
                className="qr-modal-back-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <h2 className="qr-modal-title">Mã QR của tôi</h2>
            </div>
            
            <div className="qr-tab-content">
              {/* White QR Code Card */}
              <div className="qr-code-card">
                <div className="qr-code-wrapper">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      JSON.stringify({
                        type: 'internal',
                        identifier: userData?.identifier,
                        wallet_id: selectedReceivingWalletId || null,
                        amount: qrAmount ? parseFloat(qrAmount) : null,
                        description: qrDescription || null
                      })
                    )}`} 
                    alt="QR Code" 
                    className="qr-code-image-element"
                  />
                </div>
                
                <div className="qr-card-tip">Mã QR nội bộ P2P</div>
                
                <div className="qr-card-id-row">
                  <span className="qr-card-id-val">{userData?.identifier || 'N/A'}</span>
                  <button 
                    onClick={handleCopyId}
                    className="qr-card-copy-btn"
                    title="Sao chép ID"
                    type="button"
                  >
                    {copied ? 'Đã chép! ✓' : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Form Controls */}
              <div className="qr-form-section">
                {/* Select Wallet */}
                <div className="qr-form-group">
                  <label className="qr-form-label">Chọn ví nhận tiền</label>
                  <div className="qr-input-wrapper">
                    <span className="qr-input-icon">
                      {renderWalletIcon(
                        wallets.find(w => w.id === selectedReceivingWalletId)?.icon || 'wallet', 
                        16,
                        { color: '#1814F3' }
                      )}
                    </span>
                    <select
                      value={selectedReceivingWalletId}
                      onChange={(e) => handleSelectReceivingWallet(e.target.value)}
                      className="qr-select-input"
                    >
                      {wallets.filter(w => w.type !== 'cash' && !w.is_hidden).map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatWalletBalance(w.available_balance || 0)}đ)
                        </option>
                      ))}
                    </select>
                    <span className="qr-select-caret">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Amount input */}
                <div className="qr-form-group">
                  <div className="qr-input-wrapper">
                    <span className="qr-input-icon qr-symbol-icon">$</span>
                    <input 
                      type="number"
                      value={qrAmount}
                      onChange={(e) => setQrAmount(e.target.value)}
                      placeholder="Số tiền (Tùy chọn)"
                      className="qr-text-input"
                    />
                  </div>
                </div>

                {/* Notes input */}
                <div className="qr-form-group">
                  <div className="qr-input-wrapper">
                    <span className="qr-input-icon qr-symbol-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                      </svg>
                    </span>
                    <input 
                      type="text"
                      value={qrDescription}
                      onChange={(e) => setQrDescription(e.target.value)}
                      placeholder="Ghi chú (Tùy chọn)"
                      className="qr-text-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTACTS MODAL */}
      {showContactsModal && (
        <div className="modal-overlay" onClick={() => setShowContactsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button 
              type="button" 
              onClick={() => setShowContactsModal(false)}
              className="modal-close-btn"
            >
              ×
            </button>
            <div className="modal-title-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3>Danh bạ người nhận</h3>
            </div>

            {isLoadingContacts ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#718EBF' }}>Đang tải...</div>
            ) : contactsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#718EBF' }}>Danh bạ trống.</div>
            ) : (
              <div className="payees-list">
                {contactsList.map(contact => (
                  <div 
                    key={contact.id} 
                    className="payee-item"
                    onClick={() => {
                      setP2pIdentifier(contact.identifier);
                      setShowContactsModal(false);
                    }}
                  >
                    <div className="payee-item-details">
                      <img 
                        src={contact.avatar_url || "https://api.dicebear.com/7.x/miniavs/svg?seed=" + contact.payee_name} 
                        alt={contact.payee_name} 
                        className="payee-item-avatar"
                      />
                      <div>
                        <div className="payee-item-name">{contact.payee_name}</div>
                        <div className="payee-item-id">{contact.identifier}</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteContact(contact.id);
                      }}
                      className="payee-delete-btn"
                      title="Xóa liên hệ"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
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

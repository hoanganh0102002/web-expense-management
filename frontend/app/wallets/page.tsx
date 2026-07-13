"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { useToast } from '../context/ToastContext';
import { apiFetch, savingsApi, transactionApi } from '../lib/api';
import './wallets.css';
import '../savings/savings.css';

// ==========================================
// CUSTOM PREMIUM SVG ICONS
// ==========================================
// Định nghĩa kiểu dữ liệu cho các thuộc tính của biểu tượng SVG
interface IconProps {
  size?: number;
  style?: React.CSSProperties;
}
//"Làm sao hệ thống biết được dự án tiết kiệm còn bao nhiêu ngày,
//  đạt bao nhiêu phần trăm và trạng thái tự động tích lũy?", bạn giải thích như sau:267
// Biểu tượng tiền mặt / thẻ ghi chú dạng SVG
const CardNoteIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => ( // Hàm xử lý CardNoteIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <rect x="2" y="5" width="20" height="14" rx="2" /> // Hình vẽ khối vuông SVG
    <line x1="2" y1="10" x2="22" y2="10" /> // Đường kẻ SVG
  </svg> // Đóng biểu tượng SVG
);

// Biểu tượng ngân hàng dạng SVG
const BankIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => ( // Hàm xử lý BankIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <path d="M3 22h18M6 18v-7m5 7v-7m5 7v-7M3 11l9-9 9 9M5 22h14" /> // Đoạn văn văn bản
  </svg> // Đóng biểu tượng SVG
);

// Biểu tượng ví tiền dạng SVG
const WalletIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => ( // Hàm xử lý WalletIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <path d="M20 12V8H6a2 2 0 0 0-2-2c0-1.1.9-2 2-2h12v4" /> // Đoạn văn văn bản
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /> // Đoạn văn văn bản
    <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6h-4z" /> // Đoạn văn văn bản
  </svg> // Đóng biểu tượng SVG
);

// Biểu tượng thẻ tín dụng dạng SVG
const CreditCardIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => ( // Hàm xử lý CreditCardIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /> // Hình vẽ khối vuông SVG
    <line x1="1" y1="10" x2="23" y2="10" /> // Đường kẻ SVG
  </svg> // Đóng biểu tượng SVG
);

// Biểu tượng heo đất tiết kiệm dạng SVG
const PiggyBankIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => ( // Hàm xử lý PiggyBankIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <path d="M19 5A2.5 2.5 0 0 0 16.5 7.5c0 .32.06.63.17.92A7.5 7.5 0 1 0 19 12.5V11" /> // Đoạn văn văn bản
    <path d="M2 9h4" /> // Đoạn văn văn bản
    <path d="M10 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" /> // Đoạn văn văn bản
    <path d="M12 18v2M8 18v2M16 17v2" /> // Đoạn văn văn bản
  </svg> // Đóng biểu tượng SVG
);

// Biểu tượng mua sắm dạng SVG
const ShoppingBagIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => ( // Hàm xử lý ShoppingBagIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /> // Đoạn văn văn bản
    <line x1="3" y1="6" x2="21" y2="6" /> // Đường kẻ SVG
    <path d="M16 10a4 4 0 0 1-8 0" /> // Đoạn văn văn bản
  </svg> // Đóng biểu tượng SVG
);

// Biểu tượng phương tiện xe cộ dạng SVG
const CarIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => ( // Hàm xử lý CarIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /> // Đoạn văn văn bản
    <circle cx="7" cy="17" r="2" /> // Hình tròn SVG
    <circle cx="17" cy="17" r="2" /> // Hình tròn SVG
    <path d="M5 17h10" /> // Đoạn văn văn bản
  </svg> // Đóng biểu tượng SVG
);

// Biểu tượng nhà cửa dạng SVG
const HouseIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => ( // Hàm xử lý HouseIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> // Đoạn văn văn bản
    <polyline points="9 22 9 12 15 12 15 22" /> // Đoạn văn văn bản
  </svg> // Đóng biểu tượng SVG
);

// Biểu tượng ăn uống dạng SVG
const UtensilsIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => ( // Hàm xử lý UtensilsIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v4M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z" /> // Đoạn văn văn bản
    <path d="M12 11v11M18 15v7" /> // Đoạn văn văn bản
  </svg> // Đóng biểu tượng SVG
);

// Biểu tượng di chuyển/du lịch máy bay dạng SVG
const PlaneIcon: React.FC<IconProps> = ({ size = 22, style = {} }) => ( // Hàm xử lý PlaneIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <path d="M17.8 20.1L21 17l-9.1-9.1L8.6 3.1 6.5 5.2l3.6 5.6-3.8 3.8-3-1L1 15.9l4.7 2.1L7.9 23l2.2-2.2-1-3 3.8-3.8 5.6 3.6 2.3-2.1c-.6-1.1-.6-2.4 0-3.4z" /> // Đoạn văn văn bản
  </svg> // Đóng biểu tượng SVG
);

// Biểu tượng mã QR dạng SVG
const QrIcon: React.FC<IconProps> = ({ size = 16, style = {} }) => ( // Hàm xử lý QrIcon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}> // Biểu tượng véc tơ SVG
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /> // Đoạn văn văn bản
    <rect x="7" y="7" width="3" height="3" /> // Hình vẽ khối vuông SVG
    <rect x="14" y="7" width="3" height="3" /> // Hình vẽ khối vuông SVG
    <rect x="7" y="14" width="3" height="3" /> // Hình vẽ khối vuông SVG
    <rect x="14" y="14" width="3" height="3" /> // Hình vẽ khối vuông SVG
  </svg> // Đóng biểu tượng SVG
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
// Hàm tự động chọn màu chữ tương phản (Trắng/Tối) dựa trên độ sáng của nền gradient
const getContrastColor = (bgGradient: string) => { // Hàm xử lý getContrastColor
  const g = bgGradient || '';
  if (g.includes('#3A3FBD') || g.includes('#1814F3') || g.includes('#2E33A8') || g.includes('#4F46E5') || g.includes('#6366F1')) {
    return '#FFFFFF';
  }
  return '#1C2755'; // Dark text for light pastel gradients
};

// Hàm tự động chọn màu chữ nhạt (Muted) cho nhãn phụ dựa trên nền gradient
const getMutedContrastColor = (bgGradient: string) => { // Hàm xử lý getMutedContrastColor
  const g = bgGradient || '';
  if (g.includes('#3A3FBD') || g.includes('#1814F3') || g.includes('#2E33A8') || g.includes('#4F46E5') || g.includes('#6366F1')) {
    return 'rgba(255, 255, 255, 0.75)';
  }
  return 'rgba(28, 39, 85, 0.75)';
};

// Hàm tự động chọn màu nền cho khung bao quanh biểu tượng ví
const getIconBgColor = (bgGradient: string) => { // Hàm xử lý getIconBgColor
  const g = bgGradient || '';
  if (g.includes('#3A3FBD') || g.includes('#1814F3') || g.includes('#2E33A8') || g.includes('#4F46E5') || g.includes('#6366F1')) {
    return 'rgba(255, 255, 255, 0.18)';
  }
  return 'rgba(28, 39, 85, 0.08)';
};

// Hàm chọn biểu tượng SVG tương ứng với tên icon
const renderWalletIcon = (iconName: string, size = 22, style = {}) => { // Hàm xử lý renderWalletIcon
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

// Hàm định dạng tiền tệ ví đa quốc gia (VND, USD, EUR...)
const formatWalletCurrency = (amount: number | string, currencyCode: string = 'VND') => { // Hàm xử lý formatWalletCurrency
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '0';

  const fixedAmount = currencyCode === 'VND' ? Math.round(numericAmount) : numericAmount;

  return new Intl.NumberFormat(currencyCode === 'VND' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'VND' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'VND' ? 0 : 2
  }).format(fixedAmount);
};

// Hàm định dạng số dư ví hiển thị (làm tròn số nguyên, theo chuẩn tiếng Việt)
const formatWalletBalance = (amount: number | string) => { // Hàm xử lý formatWalletBalance
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '0';

  const fixedAmount = Math.round(numericAmount);

  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
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
  const { t } = useLanguage(); // Hook quản lý đa ngôn ngữ dịch giao diện
  const toast = useToast(); // Hook hiển thị thông báo góc màn hình (Toast)

  const alert = (msg: string) => { // Hàm xử lý alert
    const lower = msg.toLowerCase();
    if (lower.includes('thành công') || lower.includes('success') || lower.includes('ok') || lower.includes('hoàn thành')) {
      toast.success(msg); // Thông báo thành công
    } else if (
      lower.includes('lỗi') || lower.includes('error') || lower.includes('thất bại') || lower.includes('fail') ||
      lower.includes('không hợp lệ') || lower.includes('không tồn tại') || lower.includes('không đủ') ||
      lower.includes('không thể') || lower.includes('không khớp') || lower.includes('sai') || lower.includes('chưa đủ')
    ) {
      toast.error(msg); // Thông báo thất bại
    } else if (
      lower.includes('vui lòng') || lower.includes('yêu cầu') || lower.includes('không được') ||
      lower.includes('phải') || lower.includes('chỉ hỗ trợ') || lower.includes('cảnh báo') ||
      lower.includes('lưu ý') || lower.includes('chưa') || lower.includes('cần') ||
      lower.includes('bắt buộc') || lower.includes('nhắc nhở')
    ) {
      toast.warning(msg); // Thông báo cảnh báo
    } else {
      toast.info(msg);
    }
  };


  // Savings tab state and helper functions
  const [activeTab, setActiveTab] = useState<'wallets' | 'savings'>('wallets'); // State lưu tab hiện tại (Ví của tôi hoặc Heo đất)
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]); // State lưu danh sách mục tiêu tiết kiệm
  const [isLoadingSavings, setIsLoadingSavings] = useState(false); // State lưu trạng thái đang tải mục tiêu tiết kiệm
  const [savingsError, setSavingsError] = useState(''); // State lưu thông báo lỗi khi tải dữ liệu tiết kiệm

  // Hàm gọi API lấy danh sách các mục tiêu tiết kiệm từ Backend
  const fetchSavingsGoals = async () => { // Hàm bất đồng bộ fetchSavingsGoals
    const cached = localStorage.getItem('cached_savings_goals'); // Đọc bộ nhớ cục bộ localStorage
    if (cached) {
      try {
        setSavingsGoals(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem('cached_savings_goals');
      }
    }


    //Dữ liệu được tải trực tiếp từ server bằng API savingsApi.getAll() trong hàm fetchSavingsGoals tại file 
    //app/wallets/page.tsx
    // (Dòng 267).

    setIsLoadingSavings(savingsGoals.length === 0 && !cached);
    try {
      const response = await savingsApi.getAll();
      if (response.status === 'success') {
        const data = response.data || [];
        setSavingsGoals(data);
        localStorage.setItem('cached_savings_goals', JSON.stringify(data));//Có sử dụng cache localStorage.getItem('cached_savings_goals')
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
  //Logic tính phần trăm tích lũy (Progress %)
  //Công thức: $$\text{Tỷ lệ %} = \frac{\text{Số tiền đã tích lũy (current_amount)}}{\text{Số tiền mục tiêu (target_amount)}} \times 100$$
  // Hàm tính tỷ lệ phần trăm đã hoàn thành của mục tiêu tiết kiệm
  const calcPercent = (current: string | number, target: string | number) => { // Hàm xử lý calcPercent
    const curVal = Number(current); // Chuyển đổi số tiền đã tích lũy hiện tại sang dạng số
    const tarVal = Number(target); // Chuyển đổi số tiền mục tiêu cần tích lũy sang dạng số
    if (!tarVal || isNaN(curVal) || isNaN(tarVal) || tarVal <= 0) return 0; // Nếu mục tiêu trống, không phải số hoặc <= 0 thì trả về 0%
    const pct = (curVal / tarVal) * 100; // Tính tỷ lệ phần trăm tích lũy thực tế
    if (isNaN(pct) || !isFinite(pct)) return 0; // Nếu kết quả không phải là số hoặc vô hạn thì trả về 0%
    return parseFloat(pct.toFixed(1)); // Làm tròn phần trăm lấy 1 chữ số thập phân và trả về
  };
  //Hàm tính số ngày còn lại
  // Hàm tính số ngày còn lại đến hạn mục tiêu tiết kiệm
  const getRemainingDays = (targetDateStr: string | null) => { // Hàm xử lý getRemainingDays
    if (!targetDateStr) return null; // Nếu không có ngày mục tiêu thì trả về rỗng (null)
    const today = new Date(); // Khởi tạo đối tượng ngày giờ hiện tại
    today.setHours(0, 0, 0, 0); // Đặt mốc giờ hôm nay về 00:00:00 để so sánh chuẩn ngày
    const target = new Date(targetDateStr); // Khởi tạo đối tượng ngày mục tiêu từ chuỗi truyền vào
    target.setHours(0, 0, 0, 0); // Đặt mốc giờ của ngày mục tiêu về 00:00:00

    const diffTime = target.getTime() - today.getTime(); // Tính khoảng cách chênh lệch thời gian bằng mili-giây
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Quy đổi khoảng cách mili-giây sang số ngày tròn
    return diffDays; // Trả về số ngày còn lại (hoặc số âm nếu đã quá hạn)
  };

  // Hàm định dạng tiền tệ chuẩn VND và thêm chữ 'đ'
  const formatVND = (val: string | number) => { // Hàm xử lý formatVND
    const num = typeof val === 'string' ? parseFloat(val) : val; // Chuyển đổi giá trị đầu vào thành số thực
    if (isNaN(num)) return '0 đ'; // Nếu giá trị lỗi không phải số thì trả về chuỗi mặc định '0 đ'
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ'; // Định dạng số theo chuẩn Việt Nam và thêm ký tự 'đ'
  };
  const [copied, setCopied] = useState(false); // State lưu trạng thái đã sao chép ID
  const [showQrModal, setShowQrModal] = useState(false); // State lưu trạng thái hiển thị modal QR

  // Hàm sao chép mã định danh người dùng vào clipboard
  const handleCopyId = () => { // Hàm xử lý handleCopyId
    const qrData = userData?.identifier || '';
    if (!qrData) return;
    navigator.clipboard.writeText(String(qrData));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // State & Effects cho QR Code Modal
  const [selectedReceivingWalletId, setSelectedReceivingWalletId] = useState<string>(''); // State lưu ID ví nhận tiền mặc định
  const [qrAmount, setQrAmount] = useState<string>(''); // State lưu số tiền cần chuyển trong mã QR
  const [qrDescription, setQrDescription] = useState<string>(''); // State lưu nội dung ghi chú chuyển khoản trong mã QR

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

  // Hàm đặt ví nhận tiền mặc định và gọi API cập nhật
  const handleSelectReceivingWallet = async (walletId: string) => { // Hàm bất đồng bộ handleSelectReceivingWallet
    setSelectedReceivingWalletId(walletId);
    try {
      await apiFetch(`/wallets/${walletId}/set-default-receiving`, { // Gửi yêu cầu API đến máy chủ
        method: 'POST'
      });
      fetchWallets();
    } catch (e: any) {
      console.error("Lỗi khi đặt ví mặc định nhận tiền:", e); // Ghi lỗi ra màn hình debug
    }
  };

  // State cho Modals
  const [showModal, setShowModal] = useState<'create' | 'edit' | 'transfer' | 'history' | 'deposit' | null>(null); // State kiểm soát loại modal đang mở
  const [selectedWallet, setSelectedWallet] = useState<any>(null); // State lưu trữ thông tin ví đang được chọn
  const [showWalletBalance, setShowWalletBalance] = useState(true); // State ẩn/hiện số dư của các ví

  // Deposit states
  const [depositWalletId, setDepositWalletId] = useState(''); // State lưu ID ví nhận tiền khi nạp tiền
  const [depositAmount, setDepositAmount] = useState(''); // State lưu số tiền nạp vào ví
  const [depositSender, setDepositSender] = useState('NGUYEN VAN B'); // State lưu tên người gửi khi nạp tiền
  const [depositNotes, setDepositNotes] = useState('Chuyển tiền ăn trưa'); // State lưu nội dung ghi chú nạp tiền
  const [isDepositing, setIsDepositing] = useState(false); // State lưu trạng thái đang xử lý nạp tiền

  // Form states
  const [name, setName] = useState(''); // State lưu tên ví mới hoặc tên ví đang sửa
  const [type, setType] = useState('cash'); // State lưu loại ví (tiền mặt, ngân hàng, ví điện tử)
  const [balance, setBalance] = useState(''); // State lưu số dư khởi tạo của ví mới
  const [color, setColor] = useState('linear-gradient(135deg, #3A3FBD, #2E33A8)'); // State lưu trữ màu sắc gradient được chọn
  const [icon, setIcon] = useState('wallet'); // State lưu biểu tượng icon được chọn
  const [walletCurrency, setWalletCurrency] = useState('VND'); // State lưu đơn vị tiền tệ ví
  const [isHidden, setIsHidden] = useState(false); // State lưu trạng thái ẩn ví
  const [isDefaultReceiving, setIsDefaultReceiving] = useState(false); // State lưu trạng thái ví nhận tiền mặc định
  const [showHiddenWallets, setShowHiddenWallets] = useState(false); // State lưu trạng thái ẩn/hiện ví ẩn

  // Internal Transfer states
  const [transferFrom, setTransferFrom] = useState(''); // State lưu ID ví gửi khi chuyển khoản
  const [transferTo, setTransferTo] = useState(''); // State lưu ID ví nhận khi chuyển khoản
  const [transferAmount, setTransferAmount] = useState(''); // State lưu số tiền chuyển khoản nội bộ

  const [isTransferring, setIsTransferring] = useState(false); // State lưu trạng thái đang xử lý chuyển khoản

  // Currency Converter states
  const [showExchangeModal, setShowExchangeModal] = useState(false); // State lưu hiển thị đổi ngoại tệ
  const [exchangeAmount, setExchangeAmount] = useState('1'); // State lưu số lượng đổi ngoại tệ
  const [exchangeFrom, setExchangeFrom] = useState('USD'); // State lưu đồng tiền cần đổi
  const [exchangeTo, setExchangeTo] = useState('VND'); // State lưu đồng tiền đích muốn nhận

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ // State lưu trữ tỷ giá quy đổi ngoại tệ
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
          console.error("Lỗi khi fetch tỷ giá từ API:", err); // Ghi lỗi ra màn hình debug
        });
    }
  }, [showExchangeModal]);

  // Hàm tính toán số tiền quy đổi ngoại tệ dựa theo tỷ giá
  const getConvertedAmount = () => { // Hàm xử lý getConvertedAmount
    const amt = parseFloat(exchangeAmount);
    if (isNaN(amt) || amt <= 0) return '0';
    const usdAmount = amt / (exchangeRates[exchangeFrom] || 1);
    const finalAmount = usdAmount * (exchangeRates[exchangeTo] || 1);
    return finalAmount.toLocaleString('vi-VN', {
      maximumFractionDigits: exchangeTo === 'VND' ? 0 : 4
    });
  };

  // Hàm hoán đổi hai loại tiền tệ đổi ngoại tệ cho nhau
  const handleSwapCurrencies = () => { // Hàm xử lý handleSwapCurrencies
    const temp = exchangeFrom;
    setExchangeFrom(exchangeTo);
    setExchangeTo(temp);
  };

  // History states
  const [historyWallet, setHistoryWallet] = useState<any>(null);
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // Khai báo trạng thái isLoadingHistory

  const openHistory = async (wallet: any) => { // Hàm bất đồng bộ openHistory
    setHistoryWallet(wallet);
    setShowModal('history');
    setIsLoadingHistory(true);
    try {
      const response = await apiFetch(`/wallets/${wallet.id}/transactions`); // Gửi yêu cầu API đến máy chủ
      setHistoryTransactions(response.data?.data || response.data || []);
    } catch (e: any) {
      alert("Lỗi tải lịch sử: " + (e.message || "Không thể tải")); // Hiển thị hộp thông báo
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleTransfer = async () => { // Hàm bất đồng bộ handleTransfer
    if (!transferFrom || !transferTo || !transferAmount) {
      alert("Vui lòng điền đầy đủ thông tin chuyển tiền!"); // Hiển thị hộp thông báo
      return;
    }
    if (transferFrom === transferTo) {
      alert("Ví chuyển và ví nhận phải khác nhau!"); // Hiển thị hộp thông báo
      return;
    }
    setIsTransferring(true);
    try {
      await apiFetch('/wallets/transfer', { // Gửi yêu cầu API đến máy chủ
        method: 'POST',
        body: JSON.stringify({
          from_wallet_id: transferFrom,
          to_wallet_id: transferTo,
          amount: parseFloat(transferAmount),
        })
      });
      alert("Chuyển tiền nội bộ thành công!"); // Hiển thị hộp thông báo
      setShowModal(null);
      setTransferFrom('');
      setTransferTo('');
      setTransferAmount('');
      fetchWallets();
    } catch (e: any) {
      alert(e.message || "Đã xảy ra lỗi"); // Hiển thị hộp thông báo
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => { // Hàm bất đồng bộ handleDeposit
    e.preventDefault(); // Ngăn chặn hành động tải lại trang mặc định
    if (!depositWalletId || !depositAmount) {
      alert("Vui lòng nhập đầy đủ thông tin nạp tiền!"); // Hiển thị hộp thông báo
      return;
    }
    setIsDepositing(true);
    try {
      const formData = new FormData();
      formData.append('title', depositNotes || 'Nạp tiền Sandbox');
      formData.append('amount', depositAmount);
      formData.append('type', 'income');
      formData.append('source_type', 'adjustment');
      formData.append('wallet_id', depositWalletId);
      formData.append('transaction_date', new Date().toISOString().slice(0, 19).replace('T', ' '));
      if (depositSender) {
        formData.append('notes', `Người gửi: ${depositSender}`);
      }

      await transactionApi.create(formData);

      alert("Nhận tiền thành công!"); // Hiển thị hộp thông báo
      setShowModal(null);
      setDepositWalletId('');
      setDepositAmount('');
      setDepositSender('NGUYEN VAN B');
      setDepositNotes('Chuyển tiền ăn trưa');
      fetchWallets();
    } catch (e: any) {
      alert("Nhận tiền thất bại: " + (e.message || "Lỗi không xác định")); // Hiển thị hộp thông báo
    } finally {
      setIsDepositing(false);
    }
  };

  // Transfer Tab state
  const [transferTab, setTransferTab] = useState<'internal' | 'p2p'>('internal');

  // P2P states
  const [p2pIdentifier, setP2pIdentifier] = useState(''); // Khai báo trạng thái p2pIdentifier
  const [isP2pChecking, setIsP2pChecking] = useState(false); // Khai báo trạng thái isP2pChecking
  const [p2pRecipient, setP2pRecipient] = useState<any>(null);
  const [p2pFromWalletId, setP2pFromWalletId] = useState(''); // Khai báo trạng thái p2pFromWalletId
  const [p2pAmount, setP2pAmount] = useState(''); // Khai báo trạng thái p2pAmount
  const [p2pNotes, setP2pNotes] = useState(''); // Khai báo trạng thái p2pNotes
  const [isP2pTransferring, setIsP2pTransferring] = useState(false); // Khai báo trạng thái isP2pTransferring

  // Contacts states
  const [showContactsModal, setShowContactsModal] = useState(false); // Khai báo trạng thái showContactsModal
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false); // Khai báo trạng thái isLoadingContacts



  const handleP2pCheck = async () => { // Hàm bất đồng bộ handleP2pCheck
    if (!p2pIdentifier.trim()) {
      alert("Vui lòng nhập mã định danh!"); // Hiển thị hộp thông báo
      return;
    }
    setIsP2pChecking(true);
    setP2pRecipient(null);
    try {
      const response = await apiFetch('/qr/decode', { // Gửi yêu cầu API đến máy chủ
        method: 'POST',
        body: JSON.stringify({ qr_string: p2pIdentifier.trim() })
      });
      if (response.status === 'success' && response.data) {
        setP2pRecipient(response.data);
      } else {
        alert(response.message || "Không tìm thấy thông tin người nhận."); // Hiển thị hộp thông báo
      }
    } catch (e: any) {
      alert(e.message || "Mã định danh không hợp lệ hoặc người dùng không tồn tại."); // Hiển thị hộp thông báo
    } finally {
      setIsP2pChecking(false);
    }
  };

  const handleP2pTransfer = async () => { // Hàm bất đồng bộ handleP2pTransfer
    if (!p2pFromWalletId) {
      alert("Vui lòng chọn ví chuyển tiền!"); // Hiển thị hộp thông báo
      return;
    }
    if (!p2pAmount || parseFloat(p2pAmount) <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ!"); // Hiển thị hộp thông báo
      return;
    }

    const fromWallet = wallets.find(w => w.id === p2pFromWalletId);
    if (fromWallet?.type === 'cash') {
      alert("Không cho phép thực hiện giao dịch quét QR bằng ví tiền mặt."); // Hiển thị hộp thông báo
      return;
    }
    if (p2pRecipient?.type === 'external' && fromWallet?.currency_code !== 'VND') {
      alert("Chuyển khoản liên ngân hàng bằng QR chỉ hỗ trợ đơn vị tiền tệ VND."); // Hiển thị hộp thông báo
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

      const res = await apiFetch('/qr/transfer', { // Gửi yêu cầu API đến máy chủ
        method: 'POST',
        body: JSON.stringify(body)
      });

      alert("Chuyển tiền thành công!"); // Hiển thị hộp thông báo
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
      alert(e.message || "Không thể hoàn tất giao dịch."); // Hiển thị hộp thông báo
    } finally {
      setIsP2pTransferring(false);
    }
  };

  const fetchContacts = async () => { // Hàm bất đồng bộ fetchContacts
    setIsLoadingContacts(true);
    try {
      const res = await apiFetch('/payees'); // Gửi yêu cầu API đến máy chủ
      setContactsList(res.data?.data || res.data || []);
    } catch (e) {
      console.error("Lỗi lấy danh bạ:", e); // Ghi lỗi ra màn hình debug
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const deleteContact = async (id: string) => { // Hàm bất đồng bộ deleteContact
    if (confirm("Bạn có chắc muốn xóa liên hệ này khỏi danh bạ?")) { // Hiển thị hộp xác nhận
      try {
        await apiFetch(`/payees/${id}`, { method: 'DELETE' }); // Gửi yêu cầu API đến máy chủ
        fetchContacts();
      } catch (e: any) {
        alert("Lỗi khi xóa: " + e.message); // Hiển thị hộp thông báo
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchWallets();
    }
  }, [isLoggedIn]);

  // Hàm gửi yêu cầu tạo ví mới lên server
  const handleCreate = async (e: React.FormEvent) => { // Hàm bất đồng bộ handleCreate
    e.preventDefault(); // Ngăn chặn hành động tải lại trang mặc định
    if (!isLoggedIn) {
      alert(t('login_required_to_create_wallet')); // Hiển thị hộp thông báo
      return;
    }
    try {
      await createWallet({ name, type, available_balance: 0, color, icon, currency_code: walletCurrency });
      setShowModal(null);
      resetForm();
    } catch (err: any) {
      alert(err.message || t('create_wallet_error') || 'Lỗi khi tạo ví'); // Hiển thị hộp thông báo
    }
  };

  // Hàm gửi yêu cầu cập nhật thông tin ví lên server
  const handleUpdate = async (e: React.FormEvent) => { // Hàm bất đồng bộ handleUpdate
    e.preventDefault(); // Ngăn chặn hành động tải lại trang mặc định
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
        await apiFetch(`/wallets/${selectedWallet.id}/set-default-receiving`, { // Gửi yêu cầu API đến máy chủ
          method: 'POST'
        });
        await fetchWallets();
      }

      setShowModal(null);
      resetForm();
    } catch (err: any) {
      alert(err.message || t('update_wallet_error') || 'Lỗi khi sửa ví'); // Hiển thị hộp thông báo
    }
  };

  const handleDelete = async (id: string) => { // Hàm bất đồng bộ handleDelete
    if (confirm(t('delete_wallet_confirm'))) { // Hiển thị hộp xác nhận
      try {
        await deleteWallet(id);
      } catch (err: any) {
        alert(err.message || t('delete_wallet_error') || 'Lỗi khi xóa ví'); // Hiển thị hộp thông báo
      }
    }
  };

  const resetForm = () => { // Hàm xử lý resetForm
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

  const openEdit = (wallet: any) => { // Hàm xử lý openEdit
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
    <div className="dashboard-container"> // Khung chứa bố cục
      <Sidebar activeItem="wallets" />
      <main className="main-content wallets-main">
        <nav className="navbar wallets-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> // Khung chứa bố cục
            <h1 className="page-title wallets-title" style={{ margin: 0 }}>{t('wallets_and_accounts')}</h1> // Tiêu đề cấp 1
            <span style={{ color: 'var(--text-light)', opacity: 0.6 }}>•</span> // Nhãn văn bản ngắn
            <button // Nút bấm chức năng
              onClick={() => setShowWalletBalance(!showWalletBalance)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718EBF', display: 'flex', alignItems: 'center', padding: '5px' }}
              title={showWalletBalance ? "Ẩn số tiền" : "Hiện số tiền"}
            >
              {showWalletBalance ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path> // Đoạn văn văn bản
                  <circle cx="12" cy="12" r="3"></circle> // Hình tròn SVG
                </svg> // Đóng biểu tượng SVG
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path> // Đoạn văn văn bản
                  <line x1="1" y1="1" x2="23" y2="23"></line> // Đường kẻ SVG
                </svg> // Đóng biểu tượng SVG
              )}
            </button> // Đóng nút bấm
          </div> // Đóng khung bố cục
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> // Khung chứa bố cục
            <button // Nút bấm chức năng
              onClick={() => {
                if (!isLoggedIn) {
                  alert(t('login_required_to_create_wallet')); // Hiển thị hộp thông báo
                  return;
                }
                setShowModal('deposit');
              }}
              className="secondary-action-btn btn-deposit"
              style={{ background: '#E8F5E9', color: '#2E7D32', borderColor: '#C8E6C9' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> // Đoạn văn văn bản
              </svg> // Đóng biểu tượng SVG
              Nạp tiền
            </button> // Đóng nút bấm
            <button // Nút bấm chức năng
              onClick={() => {
                if (!isLoggedIn) {
                  alert(t('login_required_to_create_wallet')); // Hiển thị hộp thông báo
                  return;
                }
                setShowModal('transfer');
              }}
              className="secondary-action-btn btn-transfer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                <path d="M8 10L4 6l4-4" /> // Đoạn văn văn bản
                <path d="M4 6h16" /> // Đoạn văn văn bản
                <path d="M16 14l4 4-4 4" /> // Đoạn văn văn bản
                <path d="M20 18H4" /> // Đoạn văn văn bản
              </svg> // Đóng biểu tượng SVG
              Chuyển tiền
            </button> // Đóng nút bấm
            <button // Nút bấm chức năng
              onClick={() => setShowExchangeModal(true)}
              className="secondary-action-btn btn-exchange"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                <line x1="12" y1="1" x2="12" y2="23"></line> // Đường kẻ SVG
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path> // Đoạn văn văn bản
              </svg> // Đóng biểu tượng SVG
              Đổi ngoại tệ
            </button> // Đóng nút bấm
            {isLoggedIn && (
              <button // Nút bấm chức năng
                onClick={() => setShowQrModal(true)}
                className="secondary-action-btn btn-qr"
              >
                <QrIcon size={15} />
                Mã QR
              </button> // Đóng nút bấm
            )}
            <button // Nút bấm chức năng
              onClick={() => {
                if (!isLoggedIn) {
                  alert(t('login_required_to_create_wallet')); // Hiển thị hộp thông báo
                  return;
                }
                setShowModal('create');
              }}
              className="primary-action-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                <line x1="12" y1="5" x2="12" y2="19"></line> // Đường kẻ SVG
                <line x1="5" y1="12" x2="19" y2="12"></line> // Đường kẻ SVG
              </svg> // Đóng biểu tượng SVG
              Tạo ví mới
            </button> // Đóng nút bấm
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}> // Khung chứa bố cục
                <span style={{ fontWeight: '600', color: '#343C6A', fontSize: '15px' }}> // Nhãn văn bản ngắn
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span> // Đóng nhãn văn bản
                <div style={{ position: 'relative', width: '45px', height: '45px' }}> // Khung chứa bố cục
                  <img // Hình ảnh minh họa
                    src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=EM&backgroundColor=b6e3f4"}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div> // Khung chứa bố cục
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục
            ) : (
              <Link href="/login" style={{ textDecoration: 'none', color: '#fff', background: '#343C6A', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>{t('login')}</Link>
            )}
          </div> // Đóng khung bố cục
        </nav>
        <div className="content-area wallets-container"> // Khung chứa bố cục
          {/* Tab Selector */}
          <div className="wallets-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}> // Khung chứa bố cục
            <div style={{ display: 'flex', gap: '8px' }}> // Khung chứa bố cục
              <button // Nút bấm chức năng
                onClick={() => setActiveTab('wallets')}
                style={{
                  padding: '12px 24px', /* Khoảng cách đệm */
                  fontWeight: '700', /* Độ đậm chữ */
                  fontSize: '16px', /* Cỡ chữ */
                  cursor: 'pointer', /* Con trỏ chuột bàn tay */
                  color: activeTab === 'wallets' ? '#1814F3' : 'var(--text-light)', /* Màu chữ */
                  borderBottom: activeTab === 'wallets' ? '3px solid #1814F3' : '3px solid transparent',
                  transition: 'all 0.2s', /* Hiệu ứng mượt mà */
                  background: 'none', /* Màu nền gradient */
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none'
                }}
              >
                {t('wallets') || 'Ví của tôi'}
              </button> // Đóng nút bấm
              <button // Nút bấm chức năng
                onClick={() => setActiveTab('savings')}
                style={{
                  padding: '12px 24px', /* Khoảng cách đệm */
                  fontWeight: '700', /* Độ đậm chữ */
                  fontSize: '16px', /* Cỡ chữ */
                  cursor: 'pointer', /* Con trỏ chuột bàn tay */
                  color: activeTab === 'savings' ? '#1814F3' : 'var(--text-light)', /* Màu chữ */
                  borderBottom: activeTab === 'savings' ? '3px solid #1814F3' : '3px solid transparent',
                  transition: 'all 0.2s', /* Hiệu ứng mượt mà */
                  background: 'none', /* Màu nền gradient */
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none'
                }}
              >
                Ví tiết kiệm (Heo đất)
              </button> // Đóng nút bấm
            </div> // Đóng khung bố cục

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}> // Khung chứa bố cục
              {/* Toggle Hidden Wallets (Only show if activeTab === 'wallets' and there are hidden wallets) */}
              {activeTab === 'wallets' && wallets.some(w => w.is_hidden) && (
                <button // Nút bấm chức năng
                  onClick={() => setShowHiddenWallets(!showHiddenWallets)}
                  style={{
                    display: 'flex', /* Hiển thị kiểu hộp Flex */
                    alignItems: 'center', /* Căn giữa trục phụ */
                    gap: '6px', /* Khoảng cách các ô con */
                    padding: '6px 12px', /* Khoảng cách đệm */
                    borderRadius: '20px', /* Bo tròn góc khung */
                    border: '1px solid var(--border-color)', /* Đường viền */
                    background: showHiddenWallets ? 'rgba(24, 20, 243, 0.05)' : 'var(--card-bg)', /* Màu nền gradient */
                    color: showHiddenWallets ? '#1814F3' : 'var(--text-light)', /* Màu chữ */
                    cursor: 'pointer', /* Con trỏ chuột bàn tay */
                    fontSize: '13px', /* Cỡ chữ */
                    fontWeight: '600', /* Độ đậm chữ */
                    transition: 'all 0.2s' /* Hiệu ứng mượt mà */
                  }}
                  title={showHiddenWallets ? "Ẩn ví ẩn" : "Hiện ví ẩn"}
                >
                  {showHiddenWallets ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path> // Đoạn văn văn bản
                      <line x1="1" y1="1" x2="23" y2="23"></line> // Đường kẻ SVG
                    </svg> // Đóng biểu tượng SVG
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /> // Đoạn văn văn bản
                      <circle cx="12" cy="12" r="3" /> // Hình tròn SVG
                    </svg> // Đóng biểu tượng SVG
                  )}
                  <span>{showHiddenWallets ? 'Ẩn ví ẩn' : 'Hiện ví ẩn'}</span> // Nhãn văn bản ngắn
                </button> // Đóng nút bấm
              )}
            </div> // Đóng khung bố cục
          </div> // Đóng khung bố cục

          <div className="tab-pane-animation" key={activeTab}> // Khung chứa bố cục
            {activeTab === 'wallets' ? (
              isLoadingWallets ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>{t('loading')}</div> // Khung chứa bố cục
              ) : wallets.length === 0 ? (
                <div className="wallets-empty-state" style={{ margin: '20px auto' }}> // Khung chứa bố cục
                  <div className="empty-state-icon">👛</div> // Khung chứa bố cục
                  <h3 className="empty-state-title">{t('no_wallets')}</h3> // Tiêu đề cấp 3
                  <p className="empty-state-desc">{t('no_wallets_desc')}</p> // Đoạn văn văn bản
                  <button // Nút bấm chức năng
                    onClick={() => {
                      if (!isLoggedIn) {
                        alert(t('login_required_to_create_wallet')); // Hiển thị hộp thông báo
                        return;
                      }
                      setShowModal('create');
                    }}
                    className="create-wallet-btn"
                  >
                    {t('create_wallet_now')}
                  </button> // Đóng nút bấm
                </div> // Đóng khung bố cục
              ) : (
                <div className="wallets-grid"> // Khung chứa bố cục
                  {wallets
                    .filter((w) => !w.is_hidden || showHiddenWallets)
                    .map((w) => {
                      const cardColor = w.color || 'linear-gradient(135deg, #3A3FBD, #2E33A8)';
                      const txtColor = getContrastColor(cardColor);
                      const muteColor = getMutedContrastColor(cardColor);
                      const iconBg = getIconBgColor(cardColor);

                      return (
                        <div key={w.id} className="wallet-card" style={{ background: cardColor, color: txtColor, opacity: w.is_hidden ? 0.6 : 1 }}> // Khung chứa bố cục
                          <div className="wallet-card-decoration"></div> // Khung chứa bố cục
                          <div className="wallet-card-header"> // Khung chứa bố cục
                            <div> // Khung chứa bố cục
                              <div className="wallet-label" style={{ color: muteColor }}>{t('balance_label')}</div> // Khung chứa bố cục
                              <div className="wallet-balance"> // Khung chứa bố cục
                                {showWalletBalance ? (
                                  <>
                                    {formatWalletBalance(w.available_balance || 0)}
                                    <span className="currency-symbol">đ</span> // Nhãn văn bản ngắn
                                  </>
                                ) : '******'}
                              </div> // Đóng khung bố cục
                            </div> // Đóng khung bố cục
                            <div className="wallet-icon-wrapper" style={{ background: iconBg, color: txtColor }}> // Khung chứa bố cục
                              {renderWalletIcon(w.icon || 'wallet', 22)}
                            </div> // Đóng khung bố cục
                          </div> // Đóng khung bố cục

                          <div className="wallet-card-footer"> // Khung chứa bố cục
                            <div> // Khung chứa bố cục
                              <div className="wallet-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}> // Khung chứa bố cục
                                <span>{w.name}</span> // Nhãn văn bản ngắn
                                {w.is_hidden && (
                                  <span style={{ /* Nhãn văn bản ngắn */
                                    fontSize: '9px', /* Cỡ chữ */
                                    fontWeight: '800', /* Độ đậm chữ */
                                    background: getContrastColor(cardColor) === '#FFFFFF' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)', /* Màu nền gradient */
                                    color: getContrastColor(cardColor) === '#FFFFFF' ? '#FF8A8A' : '#EF4444', /* Màu chữ */
                                    padding: '2px 6px', /* Khoảng cách đệm */
                                    borderRadius: '10px', /* Bo tròn góc khung */
                                    textTransform: 'uppercase'
                                  }}>
                                    Đã ẩn
                                  </span> // Đóng nhãn văn bản
                                )}
                                {w.is_default_receiving && (
                                  <span style={{ /* Nhãn văn bản ngắn */
                                    fontSize: '9px', /* Cỡ chữ */
                                    fontWeight: '800', /* Độ đậm chữ */
                                    background: getContrastColor(cardColor) === '#FFFFFF' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)', /* Màu nền gradient */
                                    color: getContrastColor(cardColor) === '#FFFFFF' ? '#B9F6CA' : '#10B981', /* Màu chữ */
                                    padding: '2px 6px', /* Khoảng cách đệm */
                                    borderRadius: '10px', /* Bo tròn góc khung */
                                    textTransform: 'uppercase'
                                  }}>
                                    Nhận mặc định
                                  </span> // Đóng nhãn văn bản
                                )}
                              </div> // Đóng khung bố cục
                              <div className="wallet-type-label" style={{ color: muteColor }}> // Khung chứa bố cục
                                {t('type_label_prefix')}{w.type === 'cash' ? t('cash') : w.type === 'bank' ? t('bank') : t('ewallet')}
                              </div> // Đóng khung bố cục
                            </div> // Đóng khung bố cục
                            <div className="wallet-actions"> // Khung chứa bố cục
                              <button // Nút bấm chức năng
                                onClick={() => openHistory(w)}
                                className="action-btn-edit"
                                style={{ background: iconBg, color: txtColor }}
                              >
                                Lịch sử
                              </button> // Đóng nút bấm
                              <button // Nút bấm chức năng
                                onClick={() => openEdit(w)}
                                className="action-btn-edit"
                                style={{ background: iconBg, color: txtColor }}
                              >
                                {t('edit')}
                              </button> // Đóng nút bấm
                              <button // Nút bấm chức năng
                                onClick={() => handleDelete(w.id)}
                                className="action-btn-delete"
                                style={{ color: w.color ? (txtColor === '#FFFFFF' ? '#FF8A8A' : '#EF4444') : '#EF4444' }}
                              >
                                {t('delete')}
                              </button> // Đóng nút bấm
                            </div> // Đóng khung bố cục
                          </div> // Đóng khung bố cục
                        </div> // Đóng khung bố cục
                      );
                    })}
                </div> // Đóng khung bố cục
              )
            ) : (
              // SAVINGS TAB
              isLoadingSavings ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)', fontWeight: '600' }}> // Khung chứa bố cục
                  {t('loading') || 'Đang tải dữ liệu...'}
                </div> // Đóng khung bố cục
              ) : savingsError ? (
                <div className="savings-empty-state" style={{ borderColor: 'var(--danger)', margin: '20px auto' }}> // Khung chứa bố cục
                  <div className="empty-state-icon" style={{ animation: 'none' }}>⚠️</div> // Khung chứa bố cục
                  <h3 className="empty-state-title" style={{ color: 'var(--danger)' }}>Đã xảy ra lỗi</h3> // Tiêu đề cấp 3
                  <p className="empty-state-desc">{savingsError}</p> // Đoạn văn văn bản
                  <button onClick={fetchSavingsGoals} className="create-wallet-btn" style={{ background: 'var(--danger)' }}>Thử lại</button> // Nút bấm chức năng
                </div> // Đóng khung bố cục
              ) : savingsGoals.length === 0 ? (
                <div className="savings-empty-state" style={{ margin: '20px auto' }}> // Khung chứa bố cục
                  <div className="empty-state-icon">🐷</div> // Khung chứa bố cục
                  <h3 className="empty-state-title">Chưa có mục tiêu tiết kiệm</h3> // Tiêu đề cấp 3
                  <p className="empty-state-desc">Bắt đầu tích lũy tài chính bằng cách tạo mục tiêu tiết kiệm đầu tiên! Đặt tên, số tiền mong muốn và ngày đạt được.</p> // Đoạn văn văn bản
                  <Link href="/savings/create" className="create-wallet-btn" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
                    Tạo mục tiêu ngay
                  </Link>
                </div> // Đóng khung bố cục
              ) : (
                <>
                  <div className="savings-grid"> // Khung chứa bố cục
                    {savingsGoals.map((goal) => {
                      const percent = calcPercent(goal.current_amount, goal.target_amount);
                      const isReached = percent >= 100;
                      const remainingDays = getRemainingDays(goal.target_date);
                      let hasAutoSave = !!goal.auto_save_frequency;
                      if (!hasAutoSave && typeof window !== 'undefined') {
                        try {
                          const localConfig = localStorage.getItem(`local_autosave_${goal.id}`); // Đọc bộ nhớ cục bộ localStorage
                          if (localConfig) {
                            const parsed = JSON.parse(localConfig);
                            if (parsed && parsed.enabled) {
                              hasAutoSave = true;
                            }
                          }
                        } catch { }
                      }

                      return (
                        <Link
                          href={`/savings/${goal.id}`}
                          key={goal.id}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div className="saving-card"> // Khung chứa bố cục
                            <div className="saving-card-header"> // Khung chứa bố cục
                              <div className="saving-card-title">{goal.name}</div> // Khung chứa bố cục
                              {isReached ? (
                                <div className="saving-card-days saving-goal-reached-badge">Đạt mục tiêu</div> // Khung chứa bố cục
                              ) : remainingDays !== null ? (
                                <div className="saving-card-days"> // Khung chứa bố cục
                                  {remainingDays > 0 ? `Còn ${remainingDays} ngày` : remainingDays === 0 ? 'Đến hạn hôm nay' : `Quá hạn ${Math.abs(remainingDays)} ngày`}
                                </div> // Đóng khung bố cục
                              ) : (
                                <div className="saving-card-days">Không giới hạn</div> // Khung chứa bố cục
                              )}
                            </div> // Đóng khung bố cục

                            <div className="saving-card-stats"> // Khung chứa bố cục
                              <div className="saving-stat-item"> // Khung chứa bố cục
                                <span className="saving-stat-label">Đã tích lũy</span> // Nhãn văn bản ngắn
                                <span className="saving-stat-val accumulated">{formatVND(goal.current_amount)}</span> // Nhãn văn bản ngắn
                              </div> // Đóng khung bố cục
                              <div className="saving-stat-item" style={{ alignItems: 'flex-end' }}> // Khung chứa bố cục
                                <span className="saving-stat-label">Mục tiêu</span> // Nhãn văn bản ngắn
                                <span className="saving-stat-val target">{formatVND(goal.target_amount)}</span> // Nhãn văn bản ngắn
                              </div> // Đóng khung bố cục
                            </div> // Đóng khung bố cục

                            <div className="saving-progress-container"> // Khung chứa bố cục
                              <div className="saving-progress-track"> // Khung chứa bố cục
                                <div // Khung chứa bố cục
                                  className="saving-progress-fill"
                                  style={{
                                    width: `${percent}%`, /* Chiều rộng */
                                    background: isReached ? '#10B981' : undefined /* Màu nền gradient */
                                  }}
                                ></div>
                              </div> // Đóng khung bố cục
                            </div> // Đóng khung bố cục

                            <div className="saving-card-footer-info"> // Khung chứa bố cục
                              <div className="saving-auto-badge"> // Khung chứa bố cục
                                <span>Tự động tích lũy:</span> // Nhãn văn bản ngắn
                                <span style={{ color: hasAutoSave ? '#10B981' : '#FF4B4A' }}> // Nhãn văn bản ngắn
                                  {hasAutoSave ? 'Bật' : 'Tắt'}
                                </span> // Đóng nhãn văn bản
                              </div> // Đóng khung bố cục
                              <div className="saving-percent"> // Khung chứa bố cục
                                {percent}%
                              </div> // Đóng khung bố cục
                            </div> // Đóng khung bố cục
                          </div> // Đóng khung bố cục
                        </Link>
                      );
                    })}
                  </div> // Đóng khung bố cục

                  <div className="create-goal-footer-btn-wrapper"> // Khung chứa bố cục
                    <Link href="/savings/create" className="btn-create-goal" style={{ textDecoration: 'none' }}>
                      <span style={{ marginRight: '6px', fontSize: '18px', fontWeight: 'bold' }}>+</span> // Nhãn văn bản ngắn
                      <span>Tạo mục tiêu tiết kiệm mới</span> // Nhãn văn bản ngắn
                    </Link>
                  </div> // Đóng khung bố cục
                </>
              )
            )}
          </div> // Đóng khung bố cục


        </div> // Đóng khung bố cục
      </main>

      {/* MODAL TẠO / SỬA VÍ */}
      {(showModal === 'create' || showModal === 'edit') && (
        <div className="modal-overlay"> // Khung chứa bố cục
          <div className="modal-content"> // Khung chứa bố cục
            {/* Modal Header */}
            <div className="modal-header"> // Khung chứa bố cục
              <button // Nút bấm chức năng
                type="button"
                onClick={() => { setShowModal(null); resetForm(); }}
                className="modal-back-btn"
              >
                ‹
              </button> // Đóng nút bấm
              <h2 className="modal-title"> // Tiêu đề cấp 2
                {showModal === 'create' ? t('add_new_wallet') : t('edit_wallet')}
              </h2>
            </div> // Đóng khung bố cục

            {/* Live Card Preview */}
            <div className="card-preview" style={{ background: color, color: getContrastColor(color) }}> // Khung chứa bố cục
              <div className="wallet-card-decoration"></div> // Khung chứa bố cục
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}> // Khung chứa bố cục
                <div> // Khung chứa bố cục
                  <div className="wallet-label" style={{ color: getMutedContrastColor(color), letterSpacing: '0.5px' }}>{t('wallet_name')}</div> // Khung chứa bố cục
                  <div style={{ fontSize: '18px', fontWeight: '700', wordBreak: 'break-all' }}> // Khung chứa bố cục
                    {name.toUpperCase() || t('my_new_wallet_placeholder')}
                  </div> // Đóng khung bố cục
                </div> // Đóng khung bố cục
                <div className="wallet-icon-wrapper" style={{ background: getIconBgColor(color), color: getContrastColor(color) }}> // Khung chứa bố cục
                  {renderWalletIcon(icon, 22)}
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục
              <div> // Khung chứa bố cục
                <div className="wallet-label" style={{ color: getMutedContrastColor(color), letterSpacing: '0.5px' }}> // Khung chứa bố cục
                  {showModal === 'create' ? t('balance_label') : t('initial_balance')}
                </div> // Đóng khung bố cục
                <div style={{ fontSize: '26px', fontWeight: '800' }}> // Khung chứa bố cục
                  {formatWalletBalance(Number(balance) || 0)}
                  <span className="currency-symbol">đ</span> // Nhãn văn bản ngắn
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục
            </div> // Đóng khung bố cục

            <form onSubmit={showModal === 'create' ? handleCreate : handleUpdate}> // Form biểu mẫu nhập
              {/* Wallet Name */}
              <div style={{ marginBottom: '20px' }}> // Khung chứa bố cục
                <label className="form-group-label">{t('wallet_name')}</label> // Nhãn tiêu đề trường nhập
                <input // Ô nhập dữ liệu
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={t('wallet_name_placeholder')}
                  className="wallet-input"
                />
              </div> // Đóng khung bố cục

              {/* Initial Balance (Only visible when editing, locked to current balance) */}
              {showModal === 'edit' && (
                <div style={{ marginBottom: '20px' }}> // Khung chứa bố cục
                  <label className="form-group-label">{t('initial_balance_label')}</label> // Nhãn tiêu đề trường nhập
                  <div style={{ position: 'relative' }}> // Khung chứa bố cục
                    <input // Ô nhập dữ liệu
                      type="number"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      placeholder="0"
                      disabled={true}
                      className="wallet-input"
                      style={{ paddingRight: '40px' }}
                    />
                    <span style={{ /* Nhãn văn bản ngắn */
                      position: 'absolute', /* Định vị phần tử */
                      right: '18px',
                      top: '50%',
                      transform: 'translateY(-50%)', /* Hiệu ứng biến đổi hình học */
                      color: '#94A3B8', /* Màu chữ */
                      fontWeight: 'bold' /* Độ đậm chữ */
                    }}>đ</span>
                  </div> // Đóng khung bố cục
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}> // Khung chứa bố cục
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                      <circle cx="12" cy="12" r="10" /> // Hình tròn SVG
                      <line x1="12" y1="8" x2="12" y2="12" /> // Đường kẻ SVG
                      <line x1="12" y1="16" x2="12.01" y2="16" /> // Đường kẻ SVG
                    </svg> // Đóng biểu tượng SVG
                    <small style={{ color: '#EF4444', fontSize: '12px', fontWeight: '500' }}>
                      {t('balance_locked_warning')}
                    </small>
                  </div> // Đóng khung bố cục
                </div> // Đóng khung bố cục
              )}

              {/* Wallet Currency (Forced to VND) */}
              <div style={{ marginBottom: '20px', display: 'none' }}> // Khung chứa bố cục
                <label className="form-group-label">Đơn vị tiền tệ</label> // Nhãn tiêu đề trường nhập
                <select // Menu thả xuống
                  value={walletCurrency}
                  onChange={(e) => setWalletCurrency(e.target.value)}
                  className="wallet-input"
                >
                  <option value="VND">VNĐ (₫)</option> // Giá trị trong menu
                </select> // Đóng menu thả xuống
              </div> // Đóng khung bố cục

              {/* Wallet Type */}
              <div style={{ marginBottom: '20px' }}> // Khung chứa bố cục
                <label className="form-group-label">Loại ví</label> // Nhãn tiêu đề trường nhập
                <select // Menu thả xuống
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="wallet-input"
                >
                  <option value="cash">Tiền mặt</option> // Giá trị trong menu
                  <option value="bank">Tiền gửi ngân hàng</option> // Giá trị trong menu
                  <option value="ewallet">Ví điện tử</option> // Giá trị trong menu
                </select> // Đóng menu thả xuống
              </div> // Đóng khung bố cục

              {/* Icon Selection */}
              <div style={{ marginBottom: '20px' }}> // Khung chứa bố cục
                <label className="form-group-label">{t('select_icon')}</label> // Nhãn tiêu đề trường nhập
                <div className="icon-grid"> // Khung chứa bố cục
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
                      <button // Nút bấm chức năng
                        key={ic.key}
                        type="button"
                        onClick={() => setIcon(ic.key)}
                        className={`icon-select-btn ${isSelected ? 'active' : ''}`}
                      >
                        <IconComp size={22} />
                      </button> // Đóng nút bấm
                    );
                  })}
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục

              {/* Color Selection */}
              <div style={{ marginBottom: '24px' }}> // Khung chứa bố cục
                <label className="form-group-label">{t('select_color')}</label> // Nhãn tiêu đề trường nhập
                <div className="color-grid"> // Khung chứa bố cục
                  {colorOptions.map((col) => {
                    const isSelected = color === col;
                    return (
                      <button // Nút bấm chức năng
                        key={col}
                        type="button"
                        onClick={() => setColor(col)}
                        className={`color-dot ${isSelected ? 'active' : ''}`}
                        style={{ background: col }}
                      />
                    );
                  })}
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục

              {showModal === 'edit' && (
                <div className="wallet-settings-group"> // Khung chứa bố cục
                  <div className="setting-switch-item"> // Khung chứa bố cục
                    <div className="setting-switch-label"> // Khung chứa bố cục
                      <span className="switch-title">Ẩn ví khỏi màn hình</span> // Nhãn văn bản ngắn
                      <span className="switch-desc">Ẩn ví này khỏi danh sách hiển thị trên trang chủ và các biểu đồ báo cáo.</span> // Nhãn văn bản ngắn
                    </div> // Đóng khung bố cục
                    <label className="premium-switch"> // Nhãn tiêu đề trường nhập
                      <input // Ô nhập dữ liệu
                        type="checkbox"
                        checked={isHidden}
                        onChange={(e) => setIsHidden(e.target.checked)}
                      />
                      <span className="premium-switch-slider"></span> // Nhãn văn bản ngắn
                    </label> // Đóng nhãn tiêu đề
                  </div> // Đóng khung bố cục

                  {/* Only show default receiving setting for bank or ewallet */}
                  {(type === 'bank' || type === 'ewallet') && (
                    <div className="setting-switch-item" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}> // Khung chứa bố cục
                      <div className="setting-switch-label"> // Khung chứa bố cục
                        <span className="switch-title">Đặt làm ví nhận mặc định</span> // Nhãn văn bản ngắn
                        <span className="switch-desc">Sử dụng ví này làm điểm nhận tiền mặc định cho các giao dịch chuyển khoản P2P/mã QR.</span> // Nhãn văn bản ngắn
                      </div> // Đóng khung bố cục
                      <label className="premium-switch"> // Nhãn tiêu đề trường nhập
                        <input // Ô nhập dữ liệu
                          type="checkbox"
                          checked={isDefaultReceiving}
                          onChange={(e) => setIsDefaultReceiving(e.target.checked)}
                        />
                        <span className="premium-switch-slider"></span> // Nhãn văn bản ngắn
                      </label> // Đóng nhãn tiêu đề
                    </div> // Đóng khung bố cục
                  )}
                </div> // Đóng khung bố cục
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}> // Khung chứa bố cục
                <button type="submit" className="btn-submit-wallet"> // Nút bấm chức năng
                  <span>{showModal === 'create' ? t('create_wallet_btn') : t('save_changes')}</span> // Nhãn văn bản ngắn
                  {showModal === 'create' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                      <circle cx="12" cy="12" r="10" /> // Hình tròn SVG
                      <line x1="12" y1="8" x2="12" y2="16" /> // Đường kẻ SVG
                      <line x1="8" y1="12" x2="16" y2="12" /> // Đường kẻ SVG
                    </svg> // Đóng biểu tượng SVG
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                      <polyline points="20 6 9 17 4 12" /> // Đoạn văn văn bản
                    </svg> // Đóng biểu tượng SVG
                  )}
                </button> // Đóng nút bấm
              </div> // Đóng khung bố cục
            </form> // Đóng form biểu mẫu
          </div> // Đóng khung bố cục
        </div> // Đóng khung bố cục
      )}

      {/* TRANSFER MODAL */}
      {showModal === 'transfer' && (
        <div className="modal-overlay"> // Khung chứa bố cục
          <div className="modal-content wallet-premium-modal" style={{ maxWidth: '500px', position: 'relative' }}> // Khung chứa bố cục
            <button // Nút bấm chức năng
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
            </button> // Đóng nút bấm
            <div className="modal-title-left" style={{ marginBottom: '20px' }}> // Khung chứa bố cục
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                <path d="M8 10L4 6l4-4" /> // Đoạn văn văn bản
                <path d="M4 6h16" /> // Đoạn văn văn bản
                <path d="M16 14l4 4-4 4" /> // Đoạn văn văn bản
                <path d="M20 18H4" /> // Đoạn văn văn bản
              </svg> // Đóng biểu tượng SVG
              <h3>Chuyển khoản</h3> // Tiêu đề cấp 3
            </div> // Đóng khung bố cục

            {/* Tab selection */}
            <div className="qr-modal-tabs" style={{ marginBottom: '20px' }}> // Khung chứa bố cục
              <div // Khung chứa bố cục
                className={`qr-tab-item ${transferTab === 'internal' ? 'active' : ''}`}
                onClick={() => setTransferTab('internal')}
              >
                Chuyển nội bộ
              </div> // Đóng khung bố cục
              <div // Khung chứa bố cục
                className={`qr-tab-item ${transferTab === 'p2p' ? 'active' : ''}`}
                onClick={() => setTransferTab('p2p')}
              >
                Đến người khác
              </div> // Đóng khung bố cục
            </div> // Đóng khung bố cục

            {transferTab === 'internal' ? (
              <>
                <div className="transfer-row"> // Khung chứa bố cục
                  <div className="transfer-col" style={{ position: 'relative' }}> // Khung chứa bố cục
                    <div className="transfer-label">Tên ví chuyển</div> // Khung chứa bố cục
                    <select // Menu thả xuống
                      value={transferFrom}
                      onChange={e => setTransferFrom(e.target.value)}
                      className="wallet-premium-input wallet-input"
                      style={{ appearance: 'none', paddingRight: '36px' }}
                    >
                      <option value="" disabled>Chọn tên ví...</option> // Giá trị trong menu
                      {wallets.filter(w => !w.is_hidden).map(w => <option key={w.id} value={w.id}>{w.name} ({formatWalletCurrency(w.available_balance, w.currency_code)})</option>)}
                    </select> // Đóng menu thả xuống
                    <svg style={{ position: 'absolute', right: '14px', bottom: '16px', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8F9BB3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg> // Biểu tượng véc tơ SVG
                  </div> // Đóng khung bố cục

                  <div className="transfer-arrow-icon"> // Khung chứa bố cục
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                      <line x1="5" y1="12" x2="19" y2="12"></line> // Đường kẻ SVG
                      <polyline points="12 5 19 12 12 19"></polyline> // Đoạn văn văn bản
                    </svg> // Đóng biểu tượng SVG
                  </div> // Đóng khung bố cục

                  <div className="transfer-col" style={{ position: 'relative' }}> // Khung chứa bố cục
                    <div className="transfer-label">Tên ví nhận</div> // Khung chứa bố cục
                    <select // Menu thả xuống
                      value={transferTo}
                      onChange={e => setTransferTo(e.target.value)}
                      className="wallet-premium-input wallet-input"
                      style={{ appearance: 'none', paddingRight: '36px' }}
                    >
                      <option value="" disabled>Chọn tên ví...</option> // Giá trị trong menu
                      {wallets.filter(w => !w.is_hidden).map(w => <option key={w.id} value={w.id}>{w.name} ({formatWalletCurrency(w.available_balance, w.currency_code)})</option>)}
                    </select> // Đóng menu thả xuống
                    <svg style={{ position: 'absolute', right: '14px', bottom: '16px', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8F9BB3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg> // Biểu tượng véc tơ SVG
                  </div> // Đóng khung bố cục
                </div> // Đóng khung bố cục

                <div style={{ marginBottom: '30px' }}> // Khung chứa bố cục
                  <input // Ô nhập dữ liệu
                    type="number"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                    className="wallet-premium-input wallet-input"
                  />
                </div> // Đóng khung bố cục

                <button // Nút bấm chức năng
                  onClick={handleTransfer}
                  disabled={isTransferring}
                  className="wallet-premium-btn"
                >
                  {isTransferring ? 'Đang xử lý...' : 'Chuyển tiền ngay'}
                </button> // Đóng nút bấm
              </>
            ) : (
              <>
                {!p2pRecipient ? (
                  <>
                    <div className="p2p-form-group"> // Khung chứa bố cục
                      <label className="p2p-form-label">Thông tin người hưởng thụ</label> // Nhãn tiêu đề trường nhập
                      <input // Ô nhập dữ liệu
                        type="text"
                        value={p2pIdentifier}
                        onChange={e => setP2pIdentifier(e.target.value)}
                        placeholder="Mã định danh (ví dụ: USR123456)"
                        className="wallet-premium-input wallet-input"
                      />
                    </div> // Đóng khung bố cục

                    <div className="p2p-btn-group"> // Khung chứa bố cục
                      <button // Nút bấm chức năng
                        type="button"
                        onClick={() => {
                          setShowContactsModal(true);
                          fetchContacts();
                        }}
                        className="p2p-action-btn btn-contact"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /> // Đoạn văn văn bản
                          <circle cx="9" cy="7" r="4" /> // Hình tròn SVG
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /> // Đoạn văn văn bản
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" /> // Đoạn văn văn bản
                        </svg> // Đóng biểu tượng SVG
                        Danh bạ
                      </button> // Đóng nút bấm
                      <button // Nút bấm chức năng
                        type="button"
                        onClick={handleP2pCheck}
                        disabled={isP2pChecking}
                        className="p2p-action-btn btn-check"
                      >
                        {isP2pChecking ? 'Đang kiểm tra...' : 'Kiểm tra'}
                      </button> // Đóng nút bấm
                    </div> // Đóng khung bố cục
                  </>
                ) : (
                  <div style={{ animation: 'fadeIn 0.25s' }}> // Khung chứa bố cục
                    {/* Beneficiary Info Card */}
                    <div className="beneficiary-card" style={{ marginTop: 0, marginBottom: '20px' }}> // Khung chứa bố cục
                      <img // Hình ảnh minh họa
                        src={p2pRecipient.avatar_url || "https://api.dicebear.com/7.x/miniavs/svg?seed=" + p2pRecipient.payee_name}
                        alt={p2pRecipient.payee_name}
                        className="beneficiary-avatar"
                      />
                      <div className="beneficiary-info"> // Khung chứa bố cục
                        <div className="beneficiary-name">{p2pRecipient.payee_name}</div> // Khung chứa bố cục
                        <div className="beneficiary-id">{p2pRecipient.identifier}</div> // Khung chứa bố cục
                        {p2pRecipient.recipient_wallet_name && (
                          <div className="beneficiary-wallet"> // Khung chứa bố cục
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                              <path d="M20 12V8H6a2 2 0 0 0-2-2c0-1.1.9-2 2-2h12v4" /> // Đoạn văn văn bản
                              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /> // Đoạn văn văn bản
                              <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6h-4z" /> // Đoạn văn văn bản
                            </svg> // Đóng biểu tượng SVG
                            <span>Ví nhận: {p2pRecipient.recipient_wallet_name}</span> // Nhãn văn bản ngắn
                          </div> // Đóng khung bố cục
                        )}
                      </div> // Đóng khung bố cục
                      <button // Nút bấm chức năng
                        type="button"
                        onClick={() => setP2pRecipient(null)}
                        className="beneficiary-close-btn"
                      >
                        ✕
                      </button> // Đóng nút bấm
                    </div> // Đóng khung bố cục

                    {/* P2P Send Form Details */}
                    <div> // Khung chứa bố cục
                      <div className="p2p-form-group"> // Khung chứa bố cục
                        <label className="p2p-form-label">Chọn ví chuyển tiền</label> // Nhãn tiêu đề trường nhập
                        <select // Menu thả xuống
                          value={p2pFromWalletId}
                          onChange={e => setP2pFromWalletId(e.target.value)}
                          className="p2p-select wallet-premium-input"
                        >
                          <option value="" disabled>Chọn ví chuyển...</option> // Giá trị trong menu
                          {/* Filter out cash and hidden wallets */}
                          {wallets.filter(w => w.type !== 'cash' && !w.is_hidden).map(w => (
                            <option key={w.id} value={w.id}> // Giá trị trong menu
                              {w.name} ({formatWalletCurrency(w.available_balance, w.currency_code)})
                            </option>
                          ))}
                        </select> // Đóng menu thả xuống
                      </div> // Đóng khung bố cục

                      <div className="p2p-form-group"> // Khung chứa bố cục
                        <label className="p2p-form-label">Số tiền chuyển</label> // Nhãn tiêu đề trường nhập
                        <input // Ô nhập dữ liệu
                          type="number"
                          value={p2pAmount}
                          onChange={e => setP2pAmount(e.target.value)}
                          placeholder="Nhập số tiền..."
                          className="wallet-premium-input wallet-input"
                        />
                      </div> // Đóng khung bố cục

                      <div className="p2p-form-group"> // Khung chứa bố cục
                        <label className="p2p-form-label">Lời nhắn / Ghi chú</label> // Nhãn tiêu đề trường nhập
                        <input // Ô nhập dữ liệu
                          type="text"
                          value={p2pNotes}
                          onChange={e => setP2pNotes(e.target.value)}
                          placeholder="Lời nhắn cho người nhận (tùy chọn)"
                          className="wallet-premium-input wallet-input"
                        />
                      </div> // Đóng khung bố cục

                      <div className="p2p-btn-group" style={{ marginTop: '24px' }}> // Khung chứa bố cục
                        <button // Nút bấm chức năng
                          type="button"
                          onClick={() => setP2pRecipient(null)}
                          className="p2p-action-btn"
                          style={{ background: 'var(--bg-color)', color: 'var(--text-main)', flex: 1 }}
                        >
                          Quay lại
                        </button> // Đóng nút bấm
                        <button // Nút bấm chức năng
                          type="button"
                          onClick={handleP2pTransfer}
                          disabled={isP2pTransferring}
                          className="p2p-action-btn btn-check"
                          style={{ flex: 2 }}
                        >
                          {isP2pTransferring ? 'Đang chuyển khoản...' : 'Xác nhận chuyển'}
                        </button> // Đóng nút bấm
                      </div> // Đóng khung bố cục
                    </div> // Đóng khung bố cục
                  </div> // Đóng khung bố cục
                )}
              </>
            )}
          </div> // Đóng khung bố cục
        </div> // Đóng khung bố cục
      )}

      {/* HISTORY MODAL */}
      {showModal === 'history' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}> // Khung chứa bố cục
          <div className="modal-content wallet-premium-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}> // Khung chứa bố cục
            <button // Nút bấm chức năng
              type="button"
              onClick={() => setShowModal(null)}
              className="modal-close-btn"
            >
              ×
            </button> // Đóng nút bấm
            <div className="modal-title-left"> // Khung chứa bố cục
              <h3>Lịch sử giao dịch - {historyWallet?.name}</h3> // Tiêu đề cấp 3
            </div> // Đóng khung bố cục

            {isLoadingHistory ? (
              <div style={{ color: '#718EBF', textAlign: 'center', padding: '30px', fontWeight: '600' }}>Đang tải dữ liệu...</div> // Khung chứa bố cục
            ) : historyTransactions.length === 0 ? (
              <div style={{ color: '#718EBF', textAlign: 'center', padding: '30px', fontWeight: '600' }}>Chưa có giao dịch nào trong ví này.</div> // Khung chứa bố cục
            ) : (
              <div className="history-list"> // Khung chứa bố cục
                {historyTransactions.map((tx: any) => (
                  <div key={tx.id} className="wallet-history-row"> // Khung chứa bố cục
                    <div> // Khung chứa bố cục
                      <div className="history-row-title">{tx.title || tx.category_name || tx.notes || 'Giao dịch'}</div> // Khung chứa bố cục
                      <div className="history-row-date">{new Date(tx.transaction_date).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div> // Khung chứa bố cục
                    </div> // Đóng khung bố cục
                    <div className={`history-row-amount ${tx.type === 'expense' ? 'expense' : 'income'}`}> // Khung chứa bố cục
                      {tx.type === 'expense' ? '-' : '+'}
                      {formatWalletCurrency(tx.amount || 0, historyWallet?.currency_code || 'VND')}
                    </div> // Đóng khung bố cục
                  </div> // Đóng khung bố cục
                ))}
              </div> // Đóng khung bố cục
            )}
          </div> // Đóng khung bố cục
        </div> // Đóng khung bố cục
      )}

      {/* Deposit Modal */}
      {showModal === 'deposit' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}> // Khung chứa bố cục
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', borderRadius: '24px', padding: '0', overflow: 'hidden' }}> // Khung chứa bố cục
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px', borderBottom: '1px solid #F1F5F9' }}> // Khung chứa bố cục
              <button // Nút bấm chức năng
                type="button"
                onClick={() => setShowModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#1C2755', fontWeight: 'bold' }}
              >
                &lt;
              </button> // Đóng nút bấm
              <h2 style={{ flex: 1, textAlign: 'center', fontSize: '20px', margin: 0, fontWeight: '800', color: '#1C2755' }}> // Tiêu đề cấp 2
                Sandbox Simulate
              </h2>
              <div style={{ width: '20px' }}></div> // Khung chứa bố cục
            </div> // Đóng khung bố cục

            <div style={{ padding: '24px' }}> // Khung chứa bố cục
              <div style={{ background: '#F4F7FF', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', marginBottom: '24px', border: '1px solid #E5E9F2' }}> // Khung chứa bố cục
                <div style={{ color: '#4F46E5', fontSize: '20px' }}>ⓘ</div> // Khung chứa bố cục
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}> // Khung chứa bố cục
                  Tính năng này dùng để giả lập việc nhận tiền từ tài khoản VietinBank Sandbox của hệ thống.
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục

              <form onSubmit={handleDeposit}> // Form biểu mẫu nhập
                <div style={{ marginBottom: '20px' }}> // Khung chứa bố cục
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}> // Nhãn tiêu đề trường nhập
                    VÍ THỤ HƯỞNG
                  </label> // Đóng nhãn tiêu đề
                  <select // Menu thả xuống
                    className="wallet-input"
                    value={depositWalletId}
                    onChange={(e) => setDepositWalletId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '16px', fontWeight: '700', color: '#1C2755', outline: 'none' }}
                  >
                    <option value="" disabled>-- Chọn ví --</option> // Giá trị trong menu
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}> // Giá trị trong menu
                        🔴 {w.name} ({formatWalletBalance(w.available_balance || 0)} đ)
                      </option>
                    ))}
                  </select> // Đóng menu thả xuống
                </div> // Đóng khung bố cục

                <div style={{ marginBottom: '20px' }}> // Khung chứa bố cục
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}> // Nhãn tiêu đề trường nhập
                    SỐ TIỀN NHẬN (VND)
                  </label> // Đóng nhãn tiêu đề
                  <input // Ô nhập dữ liệu
                    type="number"
                    className="wallet-input"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="VD: 500000"
                    required
                    min="1"
                    style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '18px', fontWeight: '800', color: '#1C2755', outline: 'none' }}
                  />
                  {depositAmount && !isNaN(Number(depositAmount)) && (
                    <div style={{ fontSize: '13px', color: '#64748B', fontStyle: 'italic', marginTop: '8px' }}> // Khung chứa bố cục
                      ({Number(depositAmount).toLocaleString('vi-VN')} đồng)
                    </div> // Đóng khung bố cục
                  )}
                </div> // Đóng khung bố cục

                <div style={{ marginBottom: '20px' }}> // Khung chứa bố cục
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}> // Nhãn tiêu đề trường nhập
                    TÊN NGƯỜI GỬI (SANDBOX)
                  </label> // Đóng nhãn tiêu đề
                  <input // Ô nhập dữ liệu
                    type="text"
                    className="wallet-input"
                    value={depositSender}
                    onChange={(e) => setDepositSender(e.target.value)}
                    required
                    style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: '700', color: '#1C2755', outline: 'none' }}
                  />
                </div> // Đóng khung bố cục

                <div style={{ marginBottom: '32px' }}> // Khung chứa bố cục
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}> // Nhãn tiêu đề trường nhập
                    NỘI DUNG CHUYỂN KHOẢN
                  </label> // Đóng nhãn tiêu đề
                  <input // Ô nhập dữ liệu
                    type="text"
                    className="wallet-input"
                    value={depositNotes}
                    onChange={(e) => setDepositNotes(e.target.value)}
                    style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: '500', color: '#1C2755', outline: 'none' }}
                  />
                </div> // Đóng khung bố cục

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}> // Khung chứa bố cục
                  <button // Nút bấm chức năng
                    type="button"
                    onClick={() => setShowModal(null)}
                    style={{
                      flex: 1, /* Độ giãn chiếm không gian */
                      padding: '14px', /* Khoảng cách đệm */
                      borderRadius: '12px', /* Bo tròn góc khung */
                      border: '1px solid #E2E8F0', /* Đường viền */
                      background: 'white', /* Màu nền gradient */
                      color: '#64748B', /* Màu chữ */
                      fontWeight: '700', /* Độ đậm chữ */
                      cursor: 'pointer' /* Con trỏ chuột bàn tay */
                    }}
                  >
                    Hủy
                  </button> // Đóng nút bấm
                  <button // Nút bấm chức năng
                    type="submit"
                    disabled={isDepositing}
                    style={{
                      flex: 2, /* Độ giãn chiếm không gian */
                      padding: '14px', /* Khoảng cách đệm */
                      borderRadius: '12px', /* Bo tròn góc khung */
                      border: 'none', /* Đường viền */
                      background: 'linear-gradient(135deg, #1814F3 0%, #396AFF 100%)', /* Màu nền gradient */
                      color: 'white', /* Màu chữ */
                      fontWeight: '700', /* Độ đậm chữ */
                      cursor: isDepositing ? 'not-allowed' : 'pointer', /* Con trỏ chuột bàn tay */
                      opacity: isDepositing ? 0.7 : 1, /* Độ mờ */
                      boxShadow: '0 4px 10px rgba(24, 20, 243, 0.2)' /* Độ bóng đổ */
                    }}
                  >
                    {isDepositing ? 'Đang xử lý...' : 'Xác nhận'}
                  </button> // Đóng nút bấm
                </div> // Đóng khung bố cục
              </form> // Đóng form biểu mẫu
            </div> // Đóng khung bố cục
          </div> // Đóng khung bố cục
        </div> // Đóng khung bố cục
      )}

      {showExchangeModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setShowExchangeModal(false)}> // Khung chứa bố cục
          <div className="modal-content wallet-premium-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', borderRadius: '24px', padding: '30px', position: 'relative' }}> // Khung chứa bố cục
            <button // Nút bấm chức năng
              type="button"
              onClick={() => setShowExchangeModal(false)}
              className="modal-close-btn"
              style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}
            >
              ×
            </button> // Đóng nút bấm
            <div className="modal-title-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}> // Khung chứa bố cục
              <span style={{ fontSize: '24px' }}>💱</span> // Nhãn văn bản ngắn
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Quy đổi ngoại tệ</h3> // Tiêu đề cấp 3
            </div> // Đóng khung bố cục

            <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '20px' }}> // Khung chứa bố cục
              {/* Input Số tiền */}
              <div style={{ marginBottom: '15px' }}> // Khung chứa bố cục
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '13px', fontWeight: '600' }}>Số tiền cần đổi</label> // Nhãn tiêu đề trường nhập
                <input // Ô nhập dữ liệu
                  type="number"
                  value={exchangeAmount}
                  onChange={e => setExchangeAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                  className="wallet-input"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '16px', fontWeight: '700', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                />
              </div> // Đóng khung bố cục

              {/* Hàng chọn ngoại tệ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}> // Khung chứa bố cục
                <div style={{ flex: 1 }}> // Khung chứa bố cục
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '12px', fontWeight: '600' }}>Từ loại tiền</label> // Nhãn tiêu đề trường nhập
                  <select // Menu thả xuống
                    value={exchangeFrom}
                    onChange={e => setExchangeFrom(e.target.value)}
                    className="wallet-input"
                    style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '700', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <option value="USD">USD ($)</option> // Giá trị trong menu
                    <option value="EUR">EUR (€)</option> // Giá trị trong menu
                    <option value="GBP">GBP (£)</option> // Giá trị trong menu
                    <option value="JPY">JPY (¥)</option> // Giá trị trong menu
                    <option value="VND">VNĐ (₫)</option> // Giá trị trong menu
                  </select> // Đóng menu thả xuống
                </div> // Đóng khung bố cục

                <button // Nút bấm chức năng
                  type="button"
                  onClick={handleSwapCurrencies}
                  style={{
                    background: 'linear-gradient(135deg, #1814F3 0%, #396AFF 100%)', /* Màu nền gradient */
                    border: 'none', /* Đường viền */
                    width: '36px', /* Chiều rộng */
                    height: '36px', /* Chiều cao */
                    borderRadius: '50%', /* Bo tròn góc khung */
                    color: '#fff', /* Màu chữ */
                    display: 'flex', /* Hiển thị kiểu hộp Flex */
                    alignItems: 'center', /* Căn giữa trục phụ */
                    justifyContent: 'center', /* Căn giữa trục chính */
                    cursor: 'pointer', /* Con trỏ chuột bàn tay */
                    marginTop: '18px',
                    boxShadow: '0 4px 10px rgba(24, 20, 243, 0.2)', /* Độ bóng đổ */
                    transition: 'all 0.2s', /* Hiệu ứng mượt mà */
                    fontSize: '16px' /* Cỡ chữ */
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  🔄
                </button> // Đóng nút bấm

                <div style={{ flex: 1 }}> // Khung chứa bố cục
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '12px', fontWeight: '600' }}>Sang loại tiền</label> // Nhãn tiêu đề trường nhập
                  <select // Menu thả xuống
                    value={exchangeTo}
                    onChange={e => setExchangeTo(e.target.value)}
                    className="wallet-input"
                    style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '700', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <option value="VND">VNĐ (₫)</option> // Giá trị trong menu
                    <option value="USD">USD ($)</option> // Giá trị trong menu
                    <option value="EUR">EUR (€)</option> // Giá trị trong menu
                    <option value="GBP">GBP (£)</option> // Giá trị trong menu
                    <option value="JPY">JPY (¥)</option> // Giá trị trong menu
                  </select> // Đóng menu thả xuống
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục

              {/* Kết quả quy đổi */}
              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}> // Khung chứa bố cục
                <div style={{ fontSize: '13px', color: '#718EBF', marginBottom: '6px', fontWeight: '500' }}>Kết quả quy đổi tương đương</div> // Khung chứa bố cục
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#16DBCC' }}> // Khung chứa bố cục
                  {getConvertedAmount()} {exchangeTo}
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục
            </div> // Đóng khung bố cục

            {/* Bảng tỷ giá hôm nay */}
            <div> // Khung chứa bố cục
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-main)', fontWeight: '700' }}>Tỷ giá quy đổi tham khảo:</h4> // Tiêu đề cấp 4
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}> // Khung chứa bố cục
                <div style={{ padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}> // Khung chứa bố cục
                  <span style={{ fontWeight: '600' }}>💵 1 USD</span> // Nhãn văn bản ngắn
                  <span style={{ fontWeight: '700', color: '#1814F3' }}>{Math.round(exchangeRates.VND || 25450).toLocaleString('vi-VN')} ₫</span> // Nhãn văn bản ngắn
                </div> // Đóng khung bố cục
                <div style={{ padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}> // Khung chứa bố cục
                  <span style={{ fontWeight: '600' }}>💶 1 EUR</span> // Nhãn văn bản ngắn
                  <span style={{ fontWeight: '700', color: '#1814F3' }}>{Math.round((exchangeRates.VND || 25450) / (exchangeRates.EUR || 0.93)).toLocaleString('vi-VN')} ₫</span> // Nhãn văn bản ngắn
                </div> // Đóng khung bố cục
                <div style={{ padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}> // Khung chứa bố cục
                  <span style={{ fontWeight: '600' }}>💷 1 GBP</span> // Nhãn văn bản ngắn
                  <span style={{ fontWeight: '700', color: '#1814F3' }}>{Math.round((exchangeRates.VND || 25450) / (exchangeRates.GBP || 0.79)).toLocaleString('vi-VN')} ₫</span> // Nhãn văn bản ngắn
                </div> // Đóng khung bố cục
                <div style={{ padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}> // Khung chứa bố cục
                  <span style={{ fontWeight: '600' }}>💴 1 JPY</span> // Nhãn văn bản ngắn
                  <span style={{ fontWeight: '700', color: '#1814F3' }}>{Math.round((exchangeRates.VND || 25450) / (exchangeRates.JPY || 158)).toLocaleString('vi-VN')} ₫</span> // Nhãn văn bản ngắn
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục
            </div> // Đóng khung bố cục

            <button // Nút bấm chức năng
              type="button"
              onClick={() => setShowExchangeModal(false)}
              className="wallet-premium-btn"
              style={{ marginTop: '20px', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Đóng
            </button> // Đóng nút bấm
          </div> // Đóng khung bố cục
        </div> // Đóng khung bố cục
      )}
      {showQrModal && isLoggedIn && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}> // Khung chứa bố cục
          <div className="qr-app-modal-content" onClick={(e) => e.stopPropagation()}> // Khung chứa bố cục
            {/* Header: Title and Back button */}
            <div className="qr-modal-header"> // Khung chứa bố cục
              <button // Nút bấm chức năng
                type="button"
                onClick={() => setShowQrModal(false)}
                className="qr-modal-back-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                  <polyline points="15 18 9 12 15 6"></polyline> // Đoạn văn văn bản
                </svg> // Đóng biểu tượng SVG
              </button> // Đóng nút bấm
              <h2 className="qr-modal-title">Mã QR của tôi</h2> // Tiêu đề cấp 2
            </div> // Đóng khung bố cục

            <div className="qr-tab-content"> // Khung chứa bố cục
              {/* White QR Code Card */}
              <div className="qr-code-card"> // Khung chứa bố cục
                <div className="qr-code-wrapper"> // Khung chứa bố cục
                  <img // Hình ảnh minh họa
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
                </div> // Đóng khung bố cục

                <div className="qr-card-tip">Mã QR nội bộ P2P</div> // Khung chứa bố cục

                <div className="qr-card-id-row"> // Khung chứa bố cục
                  <span className="qr-card-id-val">{userData?.identifier || 'N/A'}</span> // Nhãn văn bản ngắn
                  <button // Nút bấm chức năng
                    onClick={handleCopyId}
                    className="qr-card-copy-btn"
                    title="Sao chép ID"
                    type="button"
                  >
                    {copied ? 'Đã chép! ✓' : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /> // Hình vẽ khối vuông SVG
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /> // Đoạn văn văn bản
                      </svg> // Đóng biểu tượng SVG
                    )}
                  </button> // Đóng nút bấm
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục

              {/* Form Controls */}
              <div className="qr-form-section"> // Khung chứa bố cục
                {/* Select Wallet */}
                <div className="qr-form-group"> // Khung chứa bố cục
                  <label className="qr-form-label">Chọn ví nhận tiền</label> // Nhãn tiêu đề trường nhập
                  <div className="qr-input-wrapper"> // Khung chứa bố cục
                    <span className="qr-input-icon"> // Nhãn văn bản ngắn
                      {renderWalletIcon(
                        wallets.find(w => w.id === selectedReceivingWalletId)?.icon || 'wallet',
                        16,
                        { color: '#1814F3' }
                      )}
                    </span> // Đóng nhãn văn bản
                    <select // Menu thả xuống
                      value={selectedReceivingWalletId}
                      onChange={(e) => handleSelectReceivingWallet(e.target.value)}
                      className="qr-select-input"
                    >
                      {wallets.filter(w => w.type !== 'cash' && !w.is_hidden).map((w) => (
                        <option key={w.id} value={w.id}> // Giá trị trong menu
                          {w.name} ({formatWalletBalance(w.available_balance || 0)}đ)
                        </option>
                      ))}
                    </select> // Đóng menu thả xuống
                    <span className="qr-select-caret"> // Nhãn văn bản ngắn
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                        <polyline points="6 9 12 15 18 9"></polyline> // Đoạn văn văn bản
                      </svg> // Đóng biểu tượng SVG
                    </span> // Đóng nhãn văn bản
                  </div> // Đóng khung bố cục
                </div> // Đóng khung bố cục

                {/* Amount input */}
                <div className="qr-form-group"> // Khung chứa bố cục
                  <div className="qr-input-wrapper"> // Khung chứa bố cục
                    <span className="qr-input-icon qr-symbol-icon">$</span> // Nhãn văn bản ngắn
                    <input // Ô nhập dữ liệu
                      type="number"
                      value={qrAmount}
                      onChange={(e) => setQrAmount(e.target.value)}
                      placeholder="Số tiền (Tùy chọn)"
                      className="qr-text-input"
                    />
                  </div> // Đóng khung bố cục
                </div> // Đóng khung bố cục

                {/* Notes input */}
                <div className="qr-form-group"> // Khung chứa bố cục
                  <div className="qr-input-wrapper"> // Khung chứa bố cục
                    <span className="qr-input-icon qr-symbol-icon"> // Nhãn văn bản ngắn
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                        <line x1="3" y1="12" x2="21" y2="12"></line> // Đường kẻ SVG
                        <line x1="3" y1="6" x2="21" y2="6"></line> // Đường kẻ SVG
                        <line x1="3" y1="18" x2="21" y2="18"></line> // Đường kẻ SVG
                      </svg> // Đóng biểu tượng SVG
                    </span> // Đóng nhãn văn bản
                    <input // Ô nhập dữ liệu
                      type="text"
                      value={qrDescription}
                      onChange={(e) => setQrDescription(e.target.value)}
                      placeholder="Ghi chú (Tùy chọn)"
                      className="qr-text-input"
                    />
                  </div> // Đóng khung bố cục
                </div> // Đóng khung bố cục
              </div> // Đóng khung bố cục
            </div> // Đóng khung bố cục
          </div> // Đóng khung bố cục
        </div> // Đóng khung bố cục
      )}

      {/* CONTACTS MODAL */}
      {showContactsModal && (
        <div className="modal-overlay" onClick={() => setShowContactsModal(false)}> // Khung chứa bố cục
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}> // Khung chứa bố cục
            <button // Nút bấm chức năng
              type="button"
              onClick={() => setShowContactsModal(false)}
              className="modal-close-btn"
            >
              ×
            </button> // Đóng nút bấm
            <div className="modal-title-left"> // Khung chứa bố cục
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /> // Đoạn văn văn bản
                <circle cx="9" cy="7" r="4" /> // Hình tròn SVG
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /> // Đoạn văn văn bản
                <path d="M16 3.13a4 4 0 0 1 0 7.75" /> // Đoạn văn văn bản
              </svg> // Đóng biểu tượng SVG
              <h3>Danh bạ người nhận</h3> // Tiêu đề cấp 3
            </div> // Đóng khung bố cục

            {isLoadingContacts ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#718EBF' }}>Đang tải...</div> // Khung chứa bố cục
            ) : contactsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#718EBF' }}>Danh bạ trống.</div> // Khung chứa bố cục
            ) : (
              <div className="payees-list"> // Khung chứa bố cục
                {contactsList.map(contact => (
                  <div // Khung chứa bố cục
                    key={contact.id}
                    className="payee-item"
                    onClick={() => {
                      setP2pIdentifier(contact.identifier);
                      setShowContactsModal(false);
                    }}
                  >
                    <div className="payee-item-details"> // Khung chứa bố cục
                      <img // Hình ảnh minh họa
                        src={contact.avatar_url || "https://api.dicebear.com/7.x/miniavs/svg?seed=" + contact.payee_name}
                        alt={contact.payee_name}
                        className="payee-item-avatar"
                      />
                      <div> // Khung chứa bố cục
                        <div className="payee-item-name">{contact.payee_name}</div> // Khung chứa bố cục
                        <div className="payee-item-id">{contact.identifier}</div> // Khung chứa bố cục
                      </div> // Đóng khung bố cục
                    </div> // Đóng khung bố cục
                    <button // Nút bấm chức năng
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteContact(contact.id);
                      }}
                      className="payee-delete-btn"
                      title="Xóa liên hệ"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> // Biểu tượng véc tơ SVG
                        <polyline points="3 6 5 6 21 6"></polyline> // Đoạn văn văn bản
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> // Đoạn văn văn bản
                      </svg> // Đóng biểu tượng SVG
                    </button> // Đóng nút bấm
                  </div> // Đóng khung bố cục
                ))}
              </div> // Đóng khung bố cục
            )}
          </div> // Đóng khung bố cục
        </div> // Đóng khung bố cục
      )}
    </div> // Đóng khung bố cục
  );
}

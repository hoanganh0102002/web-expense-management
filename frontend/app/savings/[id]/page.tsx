"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { useAppContext } from '../../context/AppContext';
import { useLanguage } from '../../lib/translations';
import { useToast } from '../../context/ToastContext';
import { savingsApi } from '../../lib/api';
import '../savings.css';

// SVG Icons
interface IconProps {
  size?: number;
  style?: React.CSSProperties;
}

const ChevronLeftIcon: React.FC<IconProps> = ({ size = 24, style = {} }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: `${size}px`, height: `${size}px`, ...style }}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const TrashIcon: React.FC<IconProps> = ({ size = 20, style = {} }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: `${size}px`, height: `${size}px`, ...style }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const ArrowDownIcon: React.FC<IconProps> = ({ size = 18, style = {} }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: `${size}px`, height: `${size}px`, ...style }}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const ArrowUpIcon: React.FC<IconProps> = ({ size = 18, style = {} }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: `${size}px`, height: `${size}px`, ...style }}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const getHeoEmoji = (percent: number) => {
  if (percent === 0) return '🥚';
  if (percent < 25) return '🐷';
  if (percent < 50) return '🐖';
  if (percent < 75) return '🐗';
  if (percent < 100) return '👑';
  return '🏆';
};

const getHeoLabel = (percent: number) => {
  if (percent === 0) return 'Trứng heo đang chờ nuôi';
  if (percent < 25) return 'Heo đất sơ sinh';
  if (percent < 50) return 'Heo đất thiếu niên';
  if (percent < 75) return 'Heo đất béo tròn';
  if (percent < 100) return 'Heo hoàng gia sắp về đích';
  return 'Heo vàng đắc đạo (Đạt mục tiêu!)';
};

const Confetti: React.FC = () => {
  const colors = React.useMemo(() => ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849'], []);
  
  const pieces = React.useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? '50%' : '0%',
      width: 5 + Math.random() * 10,
      height: 5 + Math.random() * 10,
    }));
  }, [colors]);

  return (
    <>
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-50px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .confetti-piece {
          position: fixed;
          top: -20px;
          z-index: 9999;
          pointer-events: none;
          animation: fall 3s linear infinite;
        }
      `}</style>
      {pieces.map((p, idx) => (
        <div
          key={idx}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            borderRadius: p.shape,
            width: `${p.width}px`,
            height: `${p.height}px`,
          }}
        />
      ))}
    </>
  );
};

export default function SavingsGoalDetailPage() {
  const { isLoggedIn, wallets, fetchWallets } = useAppContext();
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const toast = useToast();

  const alert = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('thành công') || lower.includes('success') || lower.includes('ok') || lower.includes('hoàn thành')) {
      toast.success(msg);
    } else if (
      lower.includes('lỗi') || lower.includes('error') || lower.includes('thất bại') || lower.includes('fail') || 
      lower.includes('không hợp lệ') || lower.includes('không tồn tại') || lower.includes('không đủ') || 
      lower.includes('không thể') || lower.includes('không khớp') || lower.includes('sai') || lower.includes('chưa đủ')
    ) {
      toast.error(msg);
    } else if (
      lower.includes('vui lòng') || lower.includes('yêu cầu') || lower.includes('không được') || 
      lower.includes('phải') || lower.includes('chỉ hỗ trợ') || lower.includes('cảnh báo') || 
      lower.includes('lưu ý') || lower.includes('chưa') || lower.includes('cần') || 
      lower.includes('bắt buộc') || lower.includes('nhắc nhở')
    ) {
      toast.warning(msg);
    } else {
      toast.info(msg);
    }
  };

  const [goal, setGoal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Transaction Modal state
  const [modalType, setModalType] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [modalError, setModalError] = useState('');

  // 30-Day Savings Challenge State & logic
  const [checkedDays, setCheckedDays] = useState<number[]>([]);
  const [showChallenge, setShowChallenge] = useState(false);

  // Frontend-only auto daily deposit states
  const [localAutoSaveEnabled, setLocalAutoSaveEnabled] = useState(false);
  const [localAutoSaveAmount, setLocalAutoSaveAmount] = useState(10000);
  const [showAutoSaveModal, setShowAutoSaveModal] = useState(false);
  const [autoSaveInputAmount, setAutoSaveInputAmount] = useState('10000');

  // Fetch goal details
  const fetchGoalDetails = async () => {
    const cacheKey = `cached_savings_goal_${id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached && !goal) {
      try {
        setGoal(JSON.parse(cached));
        setIsLoading(false);
      } catch (e) {}
    } else if (!goal) {
      setIsLoading(true);
    }
    try {
      const response = await savingsApi.getById(id);
      if (response.status === 'success') {
        setGoal(response.data);
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
        setErrorMsg('');
      } else {
        if (!cached) {
          setErrorMsg(response.message || 'Không thể lấy thông tin mục tiêu.');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (!cached) {
        setErrorMsg(err.message || 'Lỗi khi kết nối với máy chủ.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchGoalDetails();
      fetchWallets();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, id]);

  // Set default wallet inside modal when modal opens
  useEffect(() => {
    if (modalType && goal) {
      const nonCashWallets = wallets.filter(w => !w.is_hidden && w.type !== 'cash');
      const matchedWallet = nonCashWallets.find(w => w.id === goal.source_wallet_id);
      const defaultWId = matchedWallet ? matchedWallet.id : (nonCashWallets.length > 0 ? nonCashWallets[0].id : '');

      setSourceWalletId(defaultWId);
      setNotes(modalType === 'deposit' ? `Tích lũy heo đất: ${goal.name}` : `Rút tiền heo đất: ${goal.name}`);
      setAmount('');
      setModalError('');
    }
  }, [modalType, goal, wallets]);

  // Format money helper
  const formatVND = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(num)) + ' đ';
  };

  // Format date helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Không thời hạn';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Format timestamp helper
  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes} (UTC+7)`;
    } catch (e) {
      return dateStr;
    }
  };

  // Handle deposit or withdraw submission
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !goal || !modalType) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1000) {
      setModalError('Số tiền tối thiểu giao dịch phải là 1.000 đ!');
      return;
    }

    if (!sourceWalletId) {
      setModalError('Vui lòng chọn ví thực hiện giao dịch!');
      return;
    }

    const selectedW = wallets.find(w => w.id === sourceWalletId);
    if (selectedW && selectedW.type === 'cash') {
      setModalError('Ví tiết kiệm không hỗ trợ thực hiện bằng tiền mặt!');
      return;
    }

    // Balance check for deposit
    if (modalType === 'deposit') {
      const sourceW = wallets.find(w => w.id === sourceWalletId);
      if (sourceW && Number(sourceW.available_balance) < numAmount) {
        setModalError('Số dư tài khoản ví nguồn không đủ để trích nạp!');
        return;
      }
    }

    // Balance check for withdraw
    if (modalType === 'withdraw' && Number(goal.current_amount) < numAmount) {
      setModalError('Số tiền yêu cầu vượt quá số dư tích lũy hiện tại!');
      return;
    }

    setIsSubmittingTx(true);
    setModalError('');

    try {
      let res;
      if (modalType === 'deposit') {
        res = await savingsApi.deposit(id, {
          amount: numAmount,
          source_wallet_id: sourceWalletId,
          notes: notes.trim()
        });
      } else {
        res = await savingsApi.withdraw(id, {
          amount: numAmount,
          source_wallet_id: sourceWalletId,
          notes: notes.trim()
        });
      }

      if (res.status === 'success') {
        setGoal(res.data);
        localStorage.setItem(`cached_savings_goal_${id}`, JSON.stringify(res.data));
        setModalType(null);
        fetchWallets(); // refresh wallet balances
      } else {
        setModalError(res.message || 'Giao dịch thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || 'Lỗi hệ thống khi thực hiện giao dịch.');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  // Handle goal deletion
  const handleDeleteGoal = async () => {
    if (!isLoggedIn || !goal) return;

    if (Number(goal.current_amount) > 0) {
      alert('Vui lòng rút toàn bộ số dư khỏi heo đất về ví nguồn trước khi xóa mục tiêu này.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa mục tiêu tích lũy này không?')) {
      setIsLoading(true);
      try {
        const res = await savingsApi.delete(id);
        if (res.status === 'success') {
          localStorage.removeItem(`cached_savings_goal_${id}`);
          localStorage.removeItem(`challenge_days_${id}`);
          router.push('/wallets?tab=savings');
        } else {
          alert(res.message || 'Xóa mục tiêu thất bại.');
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Có lỗi xảy ra khi thực hiện xóa.');
        setIsLoading(false);
      }
    }
  };

  // Percentage complete calculation
  const curAmt = goal ? Number(goal.current_amount) : 0;
  const tarAmt = goal ? Number(goal.target_amount) : 0;
  let percent = 0;
  if (tarAmt > 0 && !isNaN(curAmt) && !isNaN(tarAmt)) {
    const rawPercent = (curAmt / tarAmt) * 100;
    if (!isNaN(rawPercent) && isFinite(rawPercent)) {
      percent = Math.min(100, Math.max(0, parseFloat(rawPercent.toFixed(1))));
    }
  }

  // SVG Circular progress configurations
  const radius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~502.65
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Load challenge days: Ưu tiên tái tạo từ lịch sử giao dịch backend (source of truth)
  // LocalStorage chỉ dùng làm fallback nhanh khi transactions chưa load
  useEffect(() => {
    if (goal) {
      // Tái tạo checkedDays từ goal.transactions (source of truth từ backend)
      // Mỗi giao dịch challenge có notes format: "Nhiệm vụ Thử thách tích lũy: Ngày X"
      if (goal.transactions && goal.transactions.length > 0) {
        const daysFromTransactions: number[] = [];
        const challengePattern = /Nhiệm vụ Thử thách tích lũy[:\s]*Ngày\s*(\d+)/i;
        
        goal.transactions.forEach((tx: any) => {
          if (tx.type === 'deposit' && tx.notes) {
            const match = tx.notes.match(challengePattern);
            if (match && match[1]) {
              const dayNum = parseInt(match[1], 10);
              if (dayNum >= 1 && dayNum <= 30 && !daysFromTransactions.includes(dayNum)) {
                daysFromTransactions.push(dayNum);
              }
            }
          }
        });

        if (daysFromTransactions.length > 0) {
          setCheckedDays(daysFromTransactions);
          // Đồng bộ lại localStorage cho nhất quán
          localStorage.setItem(`challenge_days_${goal.id}`, JSON.stringify(daysFromTransactions));
          return;
        }
      }

      // Fallback: đọc từ localStorage nếu transactions chưa có dữ liệu challenge
      const stored = localStorage.getItem(`challenge_days_${goal.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCheckedDays(parsed);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      setCheckedDays([]);
    }
  }, [goal?.id, goal?.transactions]);

  // Load local auto save configuration on goal load
  useEffect(() => {
    if (goal) {
      if (goal.auto_save_frequency === 'daily') {
        setLocalAutoSaveEnabled(true);
        setLocalAutoSaveAmount(parseFloat(goal.auto_save_amount || '10000'));
      } else {
        const stored = localStorage.getItem(`local_autosave_${goal.id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setLocalAutoSaveEnabled(!!parsed.enabled);
            setLocalAutoSaveAmount(parseFloat(parsed.amount || '10000'));
          } catch (e) {
            console.error(e);
          }
        } else {
          setLocalAutoSaveEnabled(false);
        }
      }
    }
  }, [goal]);

  // Helper to trigger deposit automatically in background
  const triggerAutoSaveCheck = async (goalId: string, config: any) => {
    if (!config || !config.enabled) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    if (config.last_run === todayStr) {
      return;
    }
    
    try {
      console.log(`[AutoSave] Running daily auto-save for goal ${goalId}: ${config.amount} VND`);
      const res = await savingsApi.deposit(goalId, {
        amount: config.amount,
        source_wallet_id: config.source_wallet_id,
        notes: 'Trích nạp hàng ngày tự động (Auto-Save)'
      });
      
      if (res.status === 'success') {
        config.last_run = todayStr;
        localStorage.setItem(`local_autosave_${goalId}`, JSON.stringify(config));
        setGoal(res.data);
        localStorage.setItem(`cached_savings_goal_${goalId}`, JSON.stringify(res.data));
        fetchWallets();
        console.log(`[AutoSave] Daily auto-save executed successfully!`);
      }
    } catch (e) {
      console.error("[AutoSave] Execution failed:", e);
    }
  };

  // Run auto-save check when goal details or auth state loads
  useEffect(() => {
    if (goal && isLoggedIn) {
      const stored = localStorage.getItem(`local_autosave_${goal.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.enabled) {
            triggerAutoSaveCheck(goal.id, parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [goal?.id, isLoggedIn]);

  // Handler for toggle switch
  const handleToggleLocalAutoSave = () => {
    if (!goal) return;
    
    if (localAutoSaveEnabled) {
      setLocalAutoSaveEnabled(false);
      localStorage.removeItem(`local_autosave_${goal.id}`);
      alert("Đã tắt tính năng tự động tích lũy hàng ngày.");
    } else {
      const sourceWId = goal.source_wallet_id;
      if (!sourceWId) {
        alert("Mục tiêu tiết kiệm này chưa được liên kết với ví nguồn nào. Vui lòng chỉnh sửa và thiết lập ví nguồn trước!");
        return;
      }
      
      setAutoSaveInputAmount(String(localAutoSaveAmount));
      setShowAutoSaveModal(true);
    }
  };

  // Handle submission of the custom Auto-Save modal
  const handleAutoSaveModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;
    
    const amt = parseFloat(autoSaveInputAmount);
    if (isNaN(amt) || amt < 1000) {
      alert("Số tiền tối thiểu tự động nạp hàng ngày là 1.000 đ!");
      return;
    }
    
    const sourceWId = goal.source_wallet_id;
    if (!sourceWId) return;

    setLocalAutoSaveEnabled(true);
    setLocalAutoSaveAmount(amt);
    
    const config = {
      enabled: true,
      amount: amt,
      last_run: '',
      source_wallet_id: sourceWId
    };
    localStorage.setItem(`local_autosave_${goal.id}`, JSON.stringify(config));
    alert(`Đã bật tự động tích lũy hàng ngày với số tiền ${formatVND(amt)}!`);
    
    triggerAutoSaveCheck(goal.id, config);
    setShowAutoSaveModal(false);
  };

  const getSmartTip = (goalName: string) => {
    const nameLower = goalName.toLowerCase();
    if (nameLower.includes('máy tính') || nameLower.includes('macbook') || nameLower.includes('laptop')) {
      return "💡 Mẹo tài chính: Giảm chi ăn ngoài 1 lần mỗi tuần và tích lũy lẻ (Round-up) sẽ giúp bạn rinh chiếc Laptop mới về sớm hơn khoảng 20 ngày!";
    }
    if (nameLower.includes('xe') || nameLower.includes('moto') || nameLower.includes('oto') || nameLower.includes('vespa')) {
      return "💡 Mẹo tài chính: Tối ưu chi phí bảo dưỡng xe hiện tại và trích tiền lẻ vào heo đất để sở hữu phương tiện mới nhanh hơn!";
    }
    if (nameLower.includes('điện thoại') || nameLower.includes('iphone') || nameLower.includes('samsung') || nameLower.includes('ip')) {
      return "💡 Mẹo tài chính: Hạn chế mua ốp lưng và phụ kiện không cần thiết. Gom góp số tiền nhỏ đó vào heo đất sẽ giúp bạn mua điện thoại mà không cần trả góp!";
    }
    if (nameLower.includes('du lịch') || nameLower.includes('đi chơi') || nameLower.includes('phượt') || nameLower.includes('hàn quốc') || nameLower.includes('nhật bản')) {
      return "💡 Mẹo tài chính: Lên kế hoạch săn vé máy bay giá rẻ và đặt phòng sớm trước 2-3 tháng để giảm tới 30% ngân sách chuyến đi!";
    }
    if (nameLower.includes('nhà') || nameLower.includes('căn hộ') || nameLower.includes('đất')) {
      return "💡 Mẹo tài chính: Mục tiêu lớn bắt đầu từ tích lũy nhỏ. Trích lũy đều đặn hàng ngày qua Auto-Save để xây dựng thói quen tài chính bền vững.";
    }
    return "💡 Mẹo tài chính: Hãy bật tính năng tích lũy tiền lẻ (Round-up) khi ghi chép chi tiêu để heo đất của bạn tự động được nuôi lớn mỗi ngày!";
  };



  // 30-Day Savings Challenge execution logic
  const handleToggleDay = async (dayNumber: number) => {
    if (!goal || isSubmittingTx) return;
    
    const dayAmount = 10000 + (dayNumber - 1) * 1000;
    
    if (checkedDays.includes(dayNumber)) {
      alert("Bạn đã hoàn thành ngày này rồi! Để đảm bảo tính minh bạch tài chính, các ngày đã tích lũy sẽ không thể hủy.");
      return;
    }

    const nonCashWallets = wallets.filter(w => !w.is_hidden && w.type !== 'cash');
    const targetWallet = nonCashWallets.find(w => w.id === goal.source_wallet_id) || nonCashWallets[0];

    if (!targetWallet) {
      alert("Bạn cần có ít nhất một ví tài khoản ngân hàng hoặc ví điện tử (không phải ví tiền mặt) để thực hiện thử thách.");
      return;
    }

    if (confirm(`Bạn có đồng ý nạp ${formatVND(dayAmount)} từ Ví nguồn để hoàn thành nhiệm vụ Ngày ${dayNumber} không?`)) {
      setIsSubmittingTx(true);
      try {
        const res = await savingsApi.deposit(id, {
          amount: dayAmount,
          source_wallet_id: targetWallet.id,
          notes: `Nhiệm vụ Thử thách tích lũy: Ngày ${dayNumber}`
        });

        if (res.status === 'success') {
          const newDays = [...checkedDays, dayNumber];
          setCheckedDays(newDays);
          localStorage.setItem(`challenge_days_${goal.id}`, JSON.stringify(newDays));
          setGoal(res.data);
          localStorage.setItem(`cached_savings_goal_${id}`, JSON.stringify(res.data));
          fetchWallets(); // Refresh wallet balances
          
          if (newDays.length === 30) {
            alert("🏆 KINH NGẠC! Bạn đã hoàn thành xuất sắc Thử thách tích lũy 30 ngày! Heo đất của bạn đã vô cùng béo ú!");
          }
        } else {
          alert(res.message || 'Giao dịch thất bại.');
        }
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Lỗi hệ thống khi thực hiện giao dịch thử thách.');
      } finally {
        setIsSubmittingTx(false);
      }
    }
  };



  const renderChallenge = () => {
    if (!goal) return null;
    
    return (
      <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '20px', marginBottom: '28px' }}>
        <div 
          onClick={() => setShowChallenge(!showChallenge)} 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <h4 style={{ margin: '0', fontSize: '15px', fontWeight: '700', color: '#A855F7', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔥</span> Thử thách tích lũy 30 ngày
          </h4>
          <span style={{ fontSize: '13px', color: '#A855F7', fontWeight: '700' }}>
            {checkedDays.length}/30 Ngày {showChallenge ? '▼' : '▶'}
          </span>
        </div>
        
        {showChallenge && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: 'var(--text-light)', lineHeight: '1.5' }}>
              Hãy thử thách bản thân tích lũy một số tiền nhỏ tăng dần mỗi ngày (Ngày 1: 10k, Ngày 2: 11k... Ngày 30: 39k). Bấm vào từng ngày để trích nạp nuôi heo!
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              {Array.from({ length: 30 }).map((_, idx) => {
                const dayNum = idx + 1;
                const isCompleted = checkedDays.includes(dayNum);
                const dayAmt = 10000 + idx * 1000;
                
                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleToggleDay(dayNum)}
                    disabled={isSubmittingTx}
                    title={`Ngày ${dayNum}: ${formatVND(dayAmt)}`}
                    style={{
                      aspectRatio: '1',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      background: isCompleted ? 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)' : 'var(--card-bg)',
                      color: isCompleted ? '#FFFFFF' : 'var(--text-main)',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      opacity: isSubmittingTx ? 0.7 : 1,
                      transition: 'all 0.2s',
                      transform: isCompleted ? 'scale(0.96)' : 'none'
                    }}
                  >
                    <span>D{dayNum}</span>
                    <span style={{ fontSize: '9px', fontWeight: '500', opacity: 0.8 }}>
                      {isCompleted ? '✓' : `${dayAmt / 1000}k`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Forecast and plan logic
  const forecast = React.useMemo(() => {
    if (!goal) return null;
    
    const remaining = tarAmt - curAmt;
    
    if (remaining <= 0) {
      return {
        status: 'completed',
        text: 'Chúc mừng! Bạn đã hoàn thành xuất sắc mục tiêu này! Heo đất đã được nuôi lớn hoàn hảo. 🏆'
      };
    }
    
    // Calculate days active based on created_at
    const createdDate = new Date(goal.created_at || new Date());
    const today = new Date();
    const daysActive = Math.max(1, Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    const averageSavedPerDay = curAmt / daysActive;
    
    let deadlineText = '';
    let alertText = '';
    let suggestionText = '';
    
    if (goal.target_date) {
      const deadlineDate = new Date(goal.target_date);
      const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 0) {
        deadlineText = 'Mục tiêu của bạn đã quá hạn định.';
        suggestionText = `Cần tích lũy thêm ${formatVND(remaining)} nữa để hoàn thành mục tiêu.`;
      } else {
        const requiredDaily = remaining / daysLeft;
        deadlineText = `Còn ${daysLeft} ngày để đạt mục tiêu trước thời hạn (${formatDate(goal.target_date)}).`;
        
        if (averageSavedPerDay > 0) {
          if (averageSavedPerDay < requiredDaily) {
            alertText = `⚠️ Cảnh báo tiến độ: Với tốc độ hiện tại (${formatVND(averageSavedPerDay)}/ngày), bạn sẽ chỉ tích lũy thêm được ${formatVND(averageSavedPerDay * daysLeft)} trước thời hạn, thiếu hụt ${formatVND(remaining - (averageSavedPerDay * daysLeft))}.`;
            suggestionText = `💡 Đề xuất: Hãy tăng số tiền tích lũy lên tối thiểu ${formatVND(requiredDaily)}/ngày (hoặc khoảng ${formatVND(requiredDaily * 7)}/tuần) để kịp về đích đúng hẹn!`;
          } else {
            const estDaysToComplete = remaining / averageSavedPerDay;
            alertText = `⚡ Tuyệt vời! Bạn đang tích lũy với tốc độ tốt (${formatVND(averageSavedPerDay)}/ngày).`;
            suggestionText = `🔮 Dự báo: Bạn sẽ hoàn thành mục tiêu sau khoảng ${Math.ceil(estDaysToComplete)} ngày nữa, sớm hơn thời hạn dự kiến khoảng ${Math.floor(daysLeft - estDaysToComplete)} ngày!`;
          }
        } else {
          suggestionText = `💡 Bạn cần tích lũy tối thiểu ${formatVND(requiredDaily)}/ngày (khoảng ${formatVND(requiredDaily * 30)}/tháng) để hoàn thành mục tiêu đúng hạn.`;
        }
      }
    } else {
      // No target date set
      if (averageSavedPerDay > 0) {
        const estDaysToComplete = remaining / averageSavedPerDay;
        const estFinishDate = new Date();
        estFinishDate.setDate(today.getDate() + estDaysToComplete);
        
        deadlineText = `Tốc độ tích lũy thực tế: ${formatVND(averageSavedPerDay)}/ngày.`;
        suggestionText = `🔮 Dự báo: Bạn dự kiến sẽ hoàn thành mục tiêu sau khoảng ${Math.ceil(estDaysToComplete)} ngày nữa (ngày ${formatDate(estFinishDate.toISOString())}).`;
      } else {
        suggestionText = `💡 Bạn chưa bắt đầu tích lũy. Thử lên kế hoạch nhỏ: trích ${formatVND(remaining / 30)}/ngày để hoàn thành sau 1 tháng, hoặc ${formatVND(remaining / 90)}/ngày để hoàn thành sau 3 tháng.`;
      }
    }
    
    return {
      status: averageSavedPerDay > 0 ? 'active' : 'idle',
      deadlineText,
      alertText,
      suggestionText: `${suggestionText}\n\n${getSmartTip(goal.name)}`
    };
  }, [goal, curAmt, tarAmt]);

  return (
    <div className="dashboard-container savings-main">
      <Sidebar activeItem="wallets" />
      <main className="main-content">
        <nav className="navbar savings-navbar">
          <h1 className="page-title savings-title">{t('savings') || 'Ví Tiết Kiệm'}</h1>
        </nav>

        <div className="content-area savings-container">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)', fontWeight: '600' }}>
              {t('loading') || 'Đang tải dữ liệu...'}
            </div>
          ) : errorMsg ? (
            <div className="savings-empty-state" style={{ borderColor: 'var(--danger)' }}>
              <div className="empty-state-icon" style={{ animation: 'none' }}>⚠️</div>
              <h3 className="empty-state-title" style={{ color: 'var(--danger)' }}>Không tìm thấy mục tiêu</h3>
              <p className="empty-state-desc">{errorMsg}</p>
              <Link href="/savings" className="create-wallet-btn" style={{ background: '#343C6A' }}>Quay lại danh sách</Link>
            </div>
          ) : !goal ? (
            <div className="savings-empty-state">
              <div className="empty-state-icon">🐷</div>
              <h3 className="empty-state-title">Không tìm thấy mục tiêu</h3>
              <p className="empty-state-desc">Vui lòng thử lại hoặc chọn mục tiêu tiết kiệm khác.</p>
              <Link href="/savings" className="create-wallet-btn" style={{ background: '#343C6A' }}>Quay lại danh sách</Link>
            </div>
          ) : (
            <div className="savings-detail-wrapper">
              <div className="savings-detail-header">
                <Link href="/wallets?tab=savings" className="back-btn" title="Quay lại danh sách">
                  <ChevronLeftIcon size={22} />
                </Link>
                <button className="delete-btn" onClick={handleDeleteGoal} title="Xóa mục tiêu tiết kiệm">
                  <TrashIcon size={20} />
                </button>
              </div>

              {/* Confetti celebration when complete */}
              {percent >= 100 && <Confetti />}

              {/* Circular Progress (Screenshot 3) */}
              <div className="circular-progress-section">
                <div className="progress-ring-container">
                  <svg className="progress-ring" style={{ width: '180px', height: '180px' }}>
                    <circle
                      className="progress-ring-circle-bg"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      r={radius}
                      cx="90"
                      cy="90"
                    />
                    <circle
                      className="progress-ring-circle-fill"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      r={radius}
                      cx="90"
                      cy="90"
                      style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                        stroke: percent >= 100 ? '#10B981' : '#6366F1'
                      }}
                    />
                  </svg>
                  <div className="progress-ring-text">
                    <span style={{ fontSize: '36px', marginBottom: '4px', lineHeight: '1' }}>{getHeoEmoji(percent)}</span>
                    <span className="progress-percent-val">{percent}%</span>
                  </div>
                </div>
                <div className="savings-detail-title">{goal.name}</div>
                <div style={{ color: percent >= 100 ? '#10B981' : 'var(--text-light)', fontWeight: '600', fontSize: '13px', marginTop: '6px', textAlign: 'center' }}>
                  Giai đoạn: {getHeoLabel(percent)}
                </div>
              </div>

              {/* Parameter Table */}
              <div className="savings-info-table">
                <div className="savings-info-row">
                  <span className="savings-info-label">Đã tích lũy</span>
                  <span className="savings-info-value blue bold">{formatVND(goal.current_amount)}</span>
                </div>
                <div className="savings-info-row">
                  <span className="savings-info-label">Số tiền mục tiêu</span>
                  <span className="savings-info-value bold">{formatVND(goal.target_amount)}</span>
                </div>
                <div className="savings-info-row">
                  <span className="savings-info-label">Ngày hạn định</span>
                  <span className="savings-info-value">{formatDate(goal.target_date)}</span>
                </div>
                <div className="savings-info-row" style={{ borderBottom: 'none' }}>
                  <span className="savings-info-label">Ví liên kết</span>
                  <span className="savings-info-value">{goal.source_wallet?.name || 'Chưa liên kết'}</span>
                </div>
              </div>

              {/* Auto Save Toggle Section */}
              <div style={{
                background: 'var(--card-bg)',
                borderRadius: '20px',
                padding: '16px 20px',
                border: '1px solid var(--border-color)',
                marginBottom: '28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.005)'
              }}>
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔄</span> Tự động nạp hàng ngày
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', lineHeight: '1.4' }}>
                    {localAutoSaveEnabled 
                      ? `Tự động trích ${formatVND(localAutoSaveAmount)} từ "${goal.source_wallet?.name || 'Ví liên kết'}" hàng ngày`
                      : 'Tự động trích nạp số tiền nhỏ mỗi ngày từ ví liên kết để nhanh đạt mục tiêu'}
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={localAutoSaveEnabled} 
                    onChange={handleToggleLocalAutoSave}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: localAutoSaveEnabled ? '#10B981' : '#ccc',
                    transition: '.3s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px', width: '18px',
                      left: localAutoSaveEnabled ? '24px' : '4px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      transition: '.3s',
                      borderRadius: '50%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }} />
                  </span>
                </label>
              </div>

              {/* Financial Plan Suggestion & Forecast */}
              {forecast && (
                <div style={{
                  background: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '20px',
                  marginBottom: '28px',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                  lineHeight: '1.6'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '700', color: '#6366F1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔮</span> Kế hoạch & Dự báo tích lũy
                  </h4>
                  {forecast.status === 'completed' ? (
                    <div style={{ fontWeight: '600', color: '#10B981' }}>{forecast.text}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {forecast.deadlineText && <div style={{ fontWeight: '600' }}>{forecast.deadlineText}</div>}
                      {forecast.alertText && <div style={{ color: '#F59E0B', fontWeight: '600' }}>{forecast.alertText}</div>}
                      {forecast.suggestionText && <div style={{ fontStyle: 'italic', color: 'var(--text-light)', whiteSpace: 'pre-line' }}>{forecast.suggestionText}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* Deposit / Withdraw Action Buttons */}
              <div className="savings-action-buttons">
                <button className="btn-action-deposit" onClick={() => setModalType('deposit')}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>
                  <span>Nạp tiền</span>
                </button>
                <button className="btn-action-withdraw" onClick={() => setModalType('withdraw')}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>−</span>
                  <span>Rút tiền</span>
                </button>
              </div>

              {/* 30-Day Savings Challenge Grid */}
              {renderChallenge()}

              {/* Transactions Accumulation History */}
              <div className="savings-history-section">
                <h3 className="savings-history-title">Lịch sử tích lũy</h3>
                {(!goal.transactions || goal.transactions.length === 0) ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px 0', fontStyle: 'italic', fontSize: '14px' }}>
                    Chưa có giao dịch tích lũy nào được ghi nhận.
                  </div>
                ) : (
                  <div className="savings-history-list">
                    {goal.transactions.map((tx: any) => {
                      const isDep = tx.type === 'deposit';

                      return (
                        <div key={tx.id} className="savings-history-item">
                          <div className="history-item-left">
                            <div className={`history-icon-circle ${isDep ? 'deposit' : 'withdraw'}`}>
                              {isDep ? <ArrowDownIcon size={18} /> : <ArrowUpIcon size={18} />}
                            </div>
                            <div>
                              <div className="history-tx-title">
                                {isDep ? 'Tích lũy heo đất' : 'Rút tiền heo đất'}
                              </div>
                              <div className="history-tx-meta">
                                {formatTimestamp(tx.transaction_date || tx.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="history-item-right">
                            <div className={`history-tx-amount ${isDep ? 'deposit' : 'withdraw'}`}>
                              {isDep ? '+' : '−'}{formatVND(tx.amount)}
                            </div>
                            {tx.notes && (
                              <div className="history-tx-desc">
                                {tx.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Transaction Modal Overlay (Deposit / Withdraw Form) */}
      {modalType && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setModalType(null)}>&times;</button>
            <div className="modal-title-left" style={{ marginBottom: '20px' }}>
              <h3>{modalType === 'deposit' ? 'Nạp tích lũy heo đất' : 'Rút tiền về ví nguồn'}</h3>
            </div>

            {modalError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit}>
              <div className="form-group-wrapper" style={{ gap: '16px', marginBottom: '24px' }}>
                <div className="form-field">
                  <label className="form-label" style={{ fontSize: '13px' }}>Số tiền giao dịch (VND)</label>
                  <input
                    type="number"
                    className="form-input-text"
                    placeholder="Nhập số tiền giao dịch..."
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={isSubmittingTx}
                  />
                  {amount && (
                    <div className="form-helper" style={{ marginTop: '4px', fontSize: '11px' }}>
                      Bằng chữ: {formatVND(Number(amount))}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" style={{ fontSize: '13px' }}>
                    {modalType === 'deposit' ? 'Ví nguồn trích tiền' : 'Ví nhận tiền rút'}
                  </label>
                  <select
                    className="form-select"
                    value={sourceWalletId}
                    onChange={(e) => setSourceWalletId(e.target.value)}
                    disabled={isSubmittingTx}
                    required
                  >
                    <option value="">Chọn tài khoản ví</option>
                    {wallets
                      .filter(w => !w.is_hidden && w.type !== 'cash')
                      .map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatVND(w.available_balance || 0)})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label" style={{ fontSize: '13px' }}>Ghi chú giao dịch</label>
                  <input
                    type="text"
                    className="form-input-text"
                    placeholder="Nhập ghi chú hoặc mô tả..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isSubmittingTx}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="action-btn-delete"
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '14px', background: 'var(--border-color)', color: 'var(--text-main)' }}
                  onClick={() => setModalType(null)}
                  disabled={isSubmittingTx}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-submit-wallet"
                  style={{ flex: 2, padding: '14px', borderRadius: '12px', fontSize: '14px', background: modalType === 'deposit' ? '#10B981' : '#6366F1', boxShadow: 'none' }}
                  disabled={isSubmittingTx}
                >
                  {isSubmittingTx ? 'Đang giao dịch...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Save Configuration Modal */}
      {showAutoSaveModal && (
        <div className="modal-overlay" onClick={() => setShowAutoSaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAutoSaveModal(false)}>&times;</button>
            <div className="modal-title-left" style={{ marginBottom: '20px' }}>
              <h3>Cấu hình Tự động nạp hàng ngày</h3>
            </div>

            <form onSubmit={handleAutoSaveModalSubmit}>
              <div className="form-group-wrapper" style={{ gap: '16px', marginBottom: '24px' }}>
                <div className="form-field">
                  <label className="form-label" style={{ fontSize: '13px' }}>Số tiền trích nạp mỗi ngày (VND)</label>
                  <input
                    type="number"
                    className="form-input-text"
                    placeholder="Nhập số tiền..."
                    value={autoSaveInputAmount}
                    onChange={(e) => setAutoSaveInputAmount(e.target.value)}
                    required
                    min="1000"
                  />
                  {autoSaveInputAmount && (
                    <div className="form-helper" style={{ marginTop: '4px', fontSize: '11px' }}>
                      Bằng chữ: {formatVND(Number(autoSaveInputAmount))}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px', lineHeight: '1.4' }}>
                    💡 Số tiền này sẽ tự động trích từ ví <strong>{goal?.source_wallet?.name || 'Liên kết'}</strong> của bạn vào lúc bắt đầu ngày mới để tích lũy cho mục tiêu này.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="action-btn-delete"
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '14px', background: 'var(--border-color)', color: 'var(--text-main)' }}
                  onClick={() => setShowAutoSaveModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-submit-wallet"
                  style={{ flex: 2, padding: '14px', borderRadius: '12px', fontSize: '14px', background: '#10B981', boxShadow: 'none' }}
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

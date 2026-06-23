"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { reportApi, transactionApi, budgetApi } from '../lib/api';
import './reports.css';


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

const renderFormatIcon = (type: 'pdf' | 'excel' | 'csv', size: number = 26) => {
  if (type === 'pdf') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M9 15h6" />
        <path d="M9 11h6" />
      </svg>
    );
  }
  if (type === 'excel') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M8 13h2v4H8z" />
        <path d="M14 13h2v4h-2z" />
      </svg>
    );
  }
  if (type === 'csv') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <circle cx="9" cy="14" r="1" />
        <circle cx="15" cy="14" r="1" />
      </svg>
    );
  }
  return null;
};

const formatCurrencyLocal = (val: number | string) => {
  const numericAmount = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(numericAmount)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(Math.round(numericAmount)) + 'đ';
};

const getPrevPeriod = (startStr: string, endStr: string) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  const subOneMonth = (date: Date) => {
    const targetMonth = date.getMonth() - 1;
    const res = new Date(date.getFullYear(), targetMonth, 1);
    const maxDays = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();
    res.setDate(Math.min(date.getDate(), maxDays));
    return res;
  };
  
  const prevStart = subOneMonth(start);
  const prevEnd = subOneMonth(end);
  
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    startDate: `${prevStart.getFullYear()}-${pad(prevStart.getMonth() + 1)}-${pad(prevStart.getDate())}`,
    endDate: `${prevEnd.getFullYear()}-${pad(prevEnd.getMonth() + 1)}-${pad(prevEnd.getDate())}`
  };
};

const getDatesBetween = (startDateStr: string, endDateStr: string): string[] => {
  const dates: string[] = [];
  if (!startDateStr || !endDateStr) return dates;
  let curr = new Date(startDateStr);
  const end = new Date(endDateStr);
  while (curr <= end) {
    const dateString = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
    dates.push(dateString);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

const getMtdPeriods = (startDateStr: string, endDateStr: string) => {
  const today = new Date();
  const start = new Date(startDateStr);
  
  let mtdDay = today.getDate();
  const lastDayOfSelectedMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  mtdDay = Math.min(mtdDay, lastDayOfSelectedMonth);
  
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const currMtdStart = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`;
  const currMtdEnd = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(mtdDay)}`;
  
  const prevMonth = start.getMonth() - 1;
  const prevYear = start.getFullYear();
  const lastDayOfPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
  const prevMtdDay = Math.min(mtdDay, lastDayOfPrevMonth);
  
  const prevMtdStart = `${prevYear}-${pad(prevMonth + 1)}-01`;
  const prevMtdEnd = `${prevYear}-${pad(prevMonth + 1)}-${pad(prevMtdDay)}`;
  
  return {
    currMtdStart,
    currMtdEnd,
    prevMtdStart,
    prevMtdEnd,
    mtdDay
  };
};

const getPast6MonthsRange = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`,
    endDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`
  };
};

const formatCurrencyShort = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'Tr';
  if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
  return val.toFixed(0);
};

const getBalanceRanges = (period: 'week' | 'month' | 'year', baseDateStr: string) => {
  const baseDate = new Date(baseDateStr);
  const ranges = [];
  
  if (period === 'week') {
    const day = baseDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const currentMonday = new Date(baseDate);
    currentMonday.setDate(baseDate.getDate() + diffToMonday);
    
    for (let i = 4; i >= 0; i--) {
      const mon = new Date(currentMonday);
      mon.setDate(currentMonday.getDate() - i * 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      
      const pad = (n: number) => String(n).padStart(2, '0');
      const startStr = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
      const endStr = `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`;
      const label = `${mon.getDate()}/${mon.getMonth() + 1}-${sun.getDate()}/${sun.getMonth() + 1}`;
      ranges.push({ startStr, endStr, label, isDisplayed: i < 4 });
    }
  } else if (period === 'month') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const startStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const endStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const label = `Thg ${d.getMonth() + 1}`;
      ranges.push({ startStr, endStr, label, isDisplayed: i < 5 });
    }
  } else {
    const currentYear = baseDate.getFullYear();
    for (let i = 4; i >= 0; i--) {
      const yr = currentYear - i;
      const startStr = `${yr}-01-01`;
      const endStr = `${yr}-12-31`;
      const label = `Năm ${yr}`;
      ranges.push({ startStr, endStr, label, isDisplayed: i < 4 });
    }
  }
  
  return ranges;
};

const getDateBlock = (r: any, period: 'week' | 'month' | 'year') => {
  const d = new Date(r.startStr);
  if (period === 'week') {
    return {
      top: `${d.getDate()}/${d.getMonth() + 1}`,
      bottom: `${d.getFullYear()}`
    };
  } else if (period === 'month') {
    return {
      top: `${d.getMonth() + 1}`,
      bottom: `${d.getFullYear()}`
    };
  } else {
    return {
      top: `${d.getFullYear()}`,
      bottom: ''
    };
  }
};


const generateFinancialInsights = (
  curr: { income: number; expense: number },
  prev: { income: number; expense: number },
  mtdCurr: { income: number; expense: number },
  mtdPrev: { income: number; expense: number },
  mtdDay: number,
  exceededBudgets: Array<{ name: string; overspent: number }> = [],
  abnormalText: string = ''
) => {
  // 1. Overview
  const netBalance = curr.income - curr.expense;
  const isSurplus = netBalance >= 0;
  const surplusPct = curr.income > 0 ? (netBalance / curr.income) * 100 : 0;
  
  let overviewText = '';
  let overviewStatus: 'surplus' | 'deficit' = 'surplus';
  if (isSurplus) {
    overviewStatus = 'surplus';
    overviewText = `Trong kỳ này, bạn đạt thặng dư tài chính ${formatCurrencyLocal(netBalance)}. Tổng thu nhập (${formatCurrencyLocal(curr.income)}) lớn hơn tổng chi tiêu (${formatCurrencyLocal(curr.expense)}), giúp tích lũy thêm ${surplusPct.toFixed(1)}% thu nhập. Tình hình tài chính rất lành mạnh!`;
  } else {
    overviewStatus = 'deficit';
    overviewText = `Tài chính của bạn đang bị thâm hụt ${formatCurrencyLocal(Math.abs(netBalance))}. Tổng chi tiêu (${formatCurrencyLocal(curr.expense)}) vượt quá tổng thu nhập (${formatCurrencyLocal(curr.income)}). Cần tối ưu và cắt giảm các khoản chi không thiết yếu.`;
  }

  // 2. Saving Rate
  const savingRate = curr.income > 0 ? (netBalance / curr.income) * 100 : (netBalance < 0 ? -100 : 0);
  let savingRateCommentary = '';
  let savingRateStatus: 'excellent' | 'good' | 'fair' | 'warning' = 'fair';
  
  if (savingRate >= 40) {
    savingRateStatus = 'excellent';
    savingRateCommentary = `Tỷ lệ tiết kiệm ${savingRate.toFixed(1)}% (mức xuất sắc, vượt chuẩn khuyến nghị 20%). Hãy tiếp tục duy trì và đầu tư phần tiền nhàn rỗi để sinh lời.`;
  } else if (savingRate >= 20) {
    savingRateStatus = 'good';
    savingRateCommentary = `Tỷ lệ tiết kiệm ${savingRate.toFixed(1)}% (mức tốt, đạt chuẩn tài chính lành mạnh). Bạn nên duy trì phong độ và tối ưu thêm các khoản chi tiêu nhỏ.`;
  } else if (savingRate > 0) {
    savingRateStatus = 'fair';
    savingRateCommentary = `Tỷ lệ tiết kiệm ${savingRate.toFixed(1)}% (chưa đạt khuyến nghị 20%). Bạn nên lập ngân sách chặt chẽ hơn cho các danh mục mua sắm, giải trí.`;
  } else {
    savingRateStatus = 'warning';
    savingRateCommentary = `Tỷ lệ tiết kiệm là ${savingRate.toFixed(1)}% (thâm hụt). Chi tiêu vượt quá thu nhập là dấu hiệu cảnh báo đỏ. Hãy rà soát và cắt giảm chi tiêu không cần thiết ngay lập tức.`;
  }

  // 3. Comparison with previous period
  const incomeDiff = curr.income - prev.income;
  const expenseDiff = curr.expense - prev.expense;
  
  const incomeChangePct = prev.income > 0 ? (incomeDiff / prev.income) * 100 : 0;
  const expenseChangePct = prev.expense > 0 ? (expenseDiff / prev.expense) * 100 : 0;
  
  let comparisonText = '';
  const incStr = incomeDiff > 0 ? `tăng ${incomeChangePct.toFixed(1)}% (+${formatCurrencyLocal(incomeDiff)})` : (incomeDiff < 0 ? `giảm ${Math.abs(incomeChangePct).toFixed(1)}% (-${formatCurrencyLocal(Math.abs(incomeDiff))})` : 'không đổi');
  const expStr = expenseDiff > 0 ? `tăng ${expenseChangePct.toFixed(1)}% (+${formatCurrencyLocal(expenseDiff)})` : (expenseDiff < 0 ? `giảm ${Math.abs(expenseChangePct).toFixed(1)}% (-${formatCurrencyLocal(Math.abs(expenseDiff))})` : 'không đổi');
  
  comparisonText = `Thu nhập ${incStr}, chi tiêu ${expStr}. `;
  if (incomeDiff >= 0 && expenseDiff <= 0) {
    comparisonText += `Xu hướng tài chính rất tích cực (tăng thu, giảm chi), giúp gia tăng tích lũy đáng kể.`;
  } else if (incomeDiff < 0 && expenseDiff > 0) {
    comparisonText += `Xu hướng đáng lo ngại (thu nhập giảm, chi tiêu tăng). Cần nhanh chóng thắt chặt chi tiêu để thích ứng.`;
  } else if (incomeDiff >= 0 && expenseDiff > 0) {
    if (incomeChangePct >= expenseChangePct) {
      comparisonText += `Mặc dù chi tiêu tăng, nhưng tốc độ tăng thu nhập nhanh hơn nên tài chính vẫn trong tầm kiểm soát.`;
    } else {
      comparisonText += `Cảnh báo: Tốc độ tăng chi tiêu đang vượt nhanh hơn tốc độ tăng thu nhập. Cần kiểm soát các khoản chi lớn.`;
    }
  } else {
    comparisonText += `Cả thu nhập và chi tiêu đều giảm. Tỷ lệ tiết kiệm được giữ ở mức tương đối ổn định.`;
  }

  // 4. MTD Comparison (same point in previous month)
  const mtdExpenseDiff = mtdCurr.expense - mtdPrev.expense;
  const mtdExpenseChangePct = mtdPrev.expense > 0 ? (mtdExpenseDiff / mtdPrev.expense) * 100 : 0;
  
  let mtdComparisonText = '';
  let mtdStatus: 'increase' | 'decrease' | 'equal' | 'none' = 'none';
  
  if (mtdPrev.expense > 0) {
    if (mtdExpenseDiff > 0) {
      mtdStatus = 'increase';
      mtdComparisonText = `Lũy kế chi tiêu tính đến ngày ${mtdDay} tháng này đạt ${formatCurrencyLocal(mtdCurr.expense)}, tăng ${mtdExpenseChangePct.toFixed(1)}% (+${formatCurrencyLocal(mtdExpenseDiff)}) so với cùng kỳ tháng trước. Bạn đang tiêu dùng nhanh hơn tháng trước.`;
    } else if (mtdExpenseDiff < 0) {
      mtdStatus = 'decrease';
      mtdComparisonText = `Lũy kế chi tiêu tính đến ngày ${mtdDay} tháng này đạt ${formatCurrencyLocal(mtdCurr.expense)}, tiết kiệm được ${Math.abs(mtdExpenseChangePct).toFixed(1)}% (-${formatCurrencyLocal(Math.abs(mtdExpenseDiff))}) so với cùng kỳ tháng trước. Kiểm soát chi tiêu ngày rất tốt!`;
    } else {
      mtdStatus = 'equal';
      mtdComparisonText = `Lũy kế chi tiêu tính đến ngày ${mtdDay} tháng này đạt ${formatCurrencyLocal(mtdCurr.expense)}, tương đương cùng kỳ tháng trước. Nhịp độ tiêu dùng vẫn ổn định.`;
    }
  } else {
    mtdComparisonText = `Chưa có đủ dữ liệu cùng kỳ ngày này tháng trước để so sánh tốc độ chi tiêu lũy kế.`;
  }

  let exceededText = '';
  if (exceededBudgets.length > 0) {
    const listStr = exceededBudgets.map(item => `${item.name} (lố ${formatCurrencyLocal(item.overspent)})`).join(', ');
    exceededText = `Cảnh báo chi lố ngân sách: Bạn đã chi tiêu vượt hạn mức tại ${exceededBudgets.length} danh mục: ${listStr}.`;
  }

  return {
    savingRate,
    savingRateCommentary,
    savingRateStatus,
    overviewText,
    overviewStatus,
    comparisonText,
    comparisonIncomeChangePct: incomeChangePct,
    comparisonExpenseChangePct: expenseChangePct,
    mtdComparisonText,
    mtdExpenseChangePct,
    mtdStatus,
    exceededText,
    abnormalText
  };
};

export default function Reports() {

  const { isLoggedIn, userData, categories, wallets, hasUnreadNotifications, unreadNotificationsCount } = useAppContext();
  const { t } = useLanguage();

  const categoriesMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    if (categories) {
      categories.forEach((parent: any) => {
        map[String(parent.id)] = parent;
        if (parent.children) {
          parent.children.forEach((child: any) => {
            map[String(child.id)] = { ...child, parent_id: parent.id, parent_name: parent.name, parent_icon: parent.icon, parent_color: parent.color };
          });
        }
      });
    }
    return map;
  }, [categories]);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  });

  const handlePrevMonth = () => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() - 1);
    setStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    setEndDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + 1);
    setStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    setEndDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, '0')}`);
  };

  const getDisplayMonth = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const now = new Date();
    if (s.getMonth() === now.getMonth() && s.getFullYear() === now.getFullYear() && e.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) {
      return 'Tháng này';
    }
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `Tháng ${s.getMonth() + 1}/${s.getFullYear()}`;
    }
    return `${s.getDate()}/${s.getMonth() + 1} - ${e.getDate()}/${e.getMonth() + 1}`;
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Momo Category Details View States
  const [selectedReportCategory, setSelectedReportCategory] = useState<any | null>(null);
  const [categoryTrendsData, setCategoryTrendsData] = useState<any[]>([]);
  const [isLoadingCategoryTrends, setIsLoadingCategoryTrends] = useState(false);
  const [categoryTrendsPeriodIdx, setCategoryTrendsPeriodIdx] = useState<number>(3);
  const [categoryDetailTab, setCategoryDetailTab] = useState<'all' | 'top_spent' | 'top_recipients'>('all');
  const [showAmount, setShowAmount] = useState(true);

  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'balance_trend' | 'budgets' | 'transactions' | 'export'>('analytics');
  
  // Balance Trend Tab States
  const [balancePeriod, setBalancePeriod] = useState<'week' | 'month' | 'year'>('week');
  const [balanceType, setBalanceType] = useState<'income' | 'expense' | 'net'>('expense');
  const [selectedBalancePeriodIdx, setSelectedBalancePeriodIdx] = useState<number>(-1);
  const [balanceTransactions, setBalanceTransactions] = useState<any[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [compareSamePeriod, setCompareSamePeriod] = useState<boolean>(true);
  const [categoryLevel, setCategoryLevel] = useState<'parent' | 'child'>('child');

  // Compute ranges based on active balancePeriod and endDate
  const balanceRanges = React.useMemo(() => {
    return getBalanceRanges(balancePeriod, endDate);
  }, [balancePeriod, endDate]);

  // Set selected period index to the last range on mount or when period changes
  useEffect(() => {
    if (balanceRanges.length > 0) {
      setSelectedBalancePeriodIdx(balanceRanges.length - 1);
    }
  }, [balanceRanges]);

  // Fetch transactions for the balance trend overall range
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const fetchBalanceData = async () => {
      setIsLoadingBalance(true);
      try {
        const overallStart = balanceRanges[0].startStr;
        const overallEnd = balanceRanges[balanceRanges.length - 1].endStr;
        
        const res = await transactionApi.getAll({
          start_date: overallStart,
          end_date: overallEnd,
          per_page: 10000,
          wallet_id: selectedWallet || undefined
        });
        
        const txs = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setBalanceTransactions(txs);
      } catch (err) {
        console.error("Error fetching balance transactions:", err);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    
    fetchBalanceData();
  }, [isLoggedIn, balanceRanges, selectedWallet]);

  // Compute all data points for all ranges (including preceding comparison range)
  const computedRanges = React.useMemo(() => {
    return balanceRanges.map((r, idx) => {
      const txsInRange = balanceTransactions.filter(tx => {
        let txDateStr = tx.transaction_date;
        if (!txDateStr && tx.created_at) txDateStr = tx.created_at.split('T')[0];
        return txDateStr && txDateStr >= r.startStr && txDateStr <= r.endStr;
      });
      
      let income = 0;
      let expense = 0;
      txsInRange.forEach(tx => {
        const amt = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
        if (tx.type === 'income') income += amt;
        else if (tx.type === 'expense') expense += amt;
      });
      const net = income - expense;
      
      return {
        ...r,
        originalIdx: idx,
        income,
        expense,
        net,
        txs: txsInRange
      };
    });
  }, [balanceRanges, balanceTransactions]);
  
  // Momo UI States
  const [viewMode, setViewMode] = useState<'allocation' | 'trend'>('allocation');
  const [reportType, setReportType] = useState<'expense' | 'income'>('expense');
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [isLoadingTopCategories, setIsLoadingTopCategories] = useState(false);
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>({});
  
  const [currentSummary, setCurrentSummary] = useState({ income: 0, expense: 0 });
  const [prevSummary, setPrevSummary] = useState({ income: 0, expense: 0 });
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  // New Fintech Premium States
  const [allocationType, setAllocationType] = useState<'category' | 'wallet'>('category');
  const [topWallets, setTopWallets] = useState<any[]>([]);
  const [isLoadingTopWallets, setIsLoadingTopWallets] = useState(false);
  const [trends6M, setTrends6M] = useState<any[]>([]);
  const [isLoadingTrends6M, setIsLoadingTrends6M] = useState(false);
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);

  // Trend Chart State - Holds both daily income & expense
  const [dailyData, setDailyData] = useState<{ day: number, date: string, income: number, expense: number }[]>([]);
  const [maxDailyAmt, setMaxDailyAmt] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // List Animation State
  const [listVisible, setListVisible] = useState(false);

  // Abnormal Spending State
  const [abnormalDays, setAbnormalDays] = useState<{ day: number, date: string, amount: number, avg: number }[]>([]);

  // Financial Insights State
  const [insights, setInsights] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Report Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    setListVisible(false);
    const timer = setTimeout(() => {
      setListVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [reportType, topCategories, viewMode, allocationType, topWallets]);

  // Fetch category transactions and trends for the past 4 months
  useEffect(() => {
    if (!isLoggedIn || !selectedReportCategory) return;

    const fetchCategoryDetails = async () => {
      setIsLoadingCategoryTrends(true);
      try {
        const d = new Date(startDate);
        const endYear = d.getFullYear();
        const endMonth = d.getMonth(); // 0-indexed (e.g. 5 for June)
        
        // Compute start of 4 months ago
        const startD = new Date(endYear, endMonth - 3, 1);
        const startYear = startD.getFullYear();
        const startMonth = startD.getMonth();
        
        const pad = (n: number) => String(n).padStart(2, '0');
        const calcStartDate = `${startYear}-${pad(startMonth + 1)}-01`;
        const lastDay = new Date(endYear, endMonth + 1, 0).getDate();
        const calcEndDate = `${endYear}-${pad(endMonth + 1)}-${pad(lastDay)}`;
        
        // Fetch transactions for selected category in 4-month range
        const res = await transactionApi.getAll({
          category_id: selectedReportCategory.id,
          start_date: calcStartDate,
          end_date: calcEndDate,
          per_page: 2000
        });
        
        const txList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        // Initialize monthly categories list
        const monthlyTrends = [];
        for (let i = 3; i >= 0; i--) {
          const targetD = new Date(endYear, endMonth - i, 1);
          const monthVal = targetD.getMonth() + 1;
          const yearVal = targetD.getFullYear();
          
          const monthStart = `${yearVal}-${pad(monthVal)}-01`;
          const monthEnd = `${yearVal}-${pad(monthVal)}-${pad(new Date(yearVal, monthVal, 0).getDate())}`;
          
          const monthTxs = txList.filter((tx: any) => {
            let txDateStr = tx.transaction_date;
            if (!txDateStr && tx.created_at) txDateStr = tx.created_at.split('T')[0];
            return txDateStr && txDateStr >= monthStart && txDateStr <= monthEnd;
          });
          
          const totalSpent = monthTxs.reduce((sum: number, tx: any) => {
            const amt = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
            return sum + amt;
          }, 0);
          
          monthlyTrends.push({
            month: monthVal,
            year: yearVal,
            label: `${monthVal}`,
            amount: totalSpent,
            transactions: monthTxs
          });
        }
        
        setCategoryTrendsData(monthlyTrends);
        setCategoryTrendsPeriodIdx(3); // default to current selected month (index 3)
      } catch (err) {
        console.error("Error fetching category details:", err);
      } finally {
        setIsLoadingCategoryTrends(false);
      }
    };
    
    fetchCategoryDetails();
  }, [isLoggedIn, selectedReportCategory, startDate]);

  const formatCurrency = (val: number | string) => {
    const numericAmount = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numericAmount)) return '0';
    return new Intl.NumberFormat('vi-VN').format(Math.round(numericAmount)) + 'đ';
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchData = async () => {
      const cacheKey = `cached_report_${startDate}_${endDate}_${selectedWallet}`;
      let hasCache = false;
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          hasCache = true;
          try {
            const parsed = JSON.parse(cached);
            if (parsed.currentSummary) setCurrentSummary(parsed.currentSummary);
            if (parsed.prevSummary) setPrevSummary(parsed.prevSummary);
            if (parsed.trends6M) setTrends6M(parsed.trends6M);
            if (parsed.budgetMap) setBudgetMap(parsed.budgetMap);
            if (parsed.transactions) setTransactions(parsed.transactions);
            if (parsed.insights) setInsights(parsed.insights);
            if (parsed.topCategories) setTopCategories(parsed.topCategories);
            if (parsed.topWallets) setTopWallets(parsed.topWallets);
            if (parsed.dailyData) setDailyData(parsed.dailyData);
            if (parsed.maxDailyAmt) setMaxDailyAmt(parsed.maxDailyAmt);
            if (parsed.abnormalDays) setAbnormalDays(parsed.abnormalDays);
          } catch (e) {}
        }
      }

      if (!hasCache) {
        setIsLoadingTopCategories(true);
        setIsLoadingTopWallets(true);
        setIsLoadingTrends6M(true);
        setIsLoadingInsights(true);
        setIsLoadingTransactions(true);
      }
      try {
        const d = new Date(startDate);
        let month = d.getMonth() + 1;
        let year = d.getFullYear();
        if (isNaN(month) || isNaN(year)) {
          const now = new Date();
          month = now.getMonth() + 1;
          year = now.getFullYear();
        }

        // Calculate date ranges for parallel fetches
        const prevPeriod = getPrevPeriod(startDate, endDate);
        const mtdPeriod = getMtdPeriods(startDate, endDate);
        const range6M = getPast6MonthsRange();

        // Fetch parallel data (only Trends, Budgets, and All Transactions within custom range)
        const [trends6MRes, budgetsRes, allTxRes] = await Promise.all([
          reportApi.getTrends(range6M.startDate, range6M.endDate, 'month').catch(() => ({ data: [] })),
          budgetApi.getAll(month, year).catch(() => ({ data: [] })),
          transactionApi.getAll({
            start_date: prevPeriod.startDate,
            end_date: endDate,
            per_page: 10000,
            wallet_id: selectedWallet || undefined
          }).catch(() => ({ data: [] }))
        ]);
        
        const trends6MData = Array.isArray(trends6MRes.data) ? trends6MRes.data : (trends6MRes.data?.data || []);
        setTrends6M(trends6MData);

        // Fetch budgets
        const bMap: Record<string, number> = {};
        (budgetsRes.data || []).forEach((b: any) => {
          if (b.category_id) bMap[b.category_id] = parseFloat(b.limit_amount);
        });
        setBudgetMap(bMap);

        const allTxs = Array.isArray(allTxRes.data) ? allTxRes.data : (allTxRes.data?.data || []);

        // Calculate summaries directly at Client (ignoring internal transfers)
        const currentSummaryData = { income: 0, expense: 0 };
        const prevSummaryData = { income: 0, expense: 0 };
        const currMtdSummaryData = { income: 0, expense: 0 };
        const prevMtdSummaryData = { income: 0, expense: 0 };

        allTxs.forEach((tx: any) => {
          if (tx.source_type === 'transfer' && !tx.category_id) return;
          
          let txDateStr = tx.transaction_date;
          if (!txDateStr && tx.created_at) txDateStr = tx.created_at.split('T')[0];
          if (!txDateStr) return;
          const dateStr = txDateStr.substring(0, 10);
          const amount = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
          if (amount === 0) return;

          if (dateStr >= startDate && dateStr <= endDate) {
            if (tx.type === 'income') currentSummaryData.income += amount;
            else if (tx.type === 'expense') currentSummaryData.expense += amount;
          }
          if (dateStr >= prevPeriod.startDate && dateStr <= prevPeriod.endDate) {
            if (tx.type === 'income') prevSummaryData.income += amount;
            else if (tx.type === 'expense') prevSummaryData.expense += amount;
          }
          if (dateStr >= mtdPeriod.currMtdStart && dateStr <= mtdPeriod.currMtdEnd) {
            if (tx.type === 'income') currMtdSummaryData.income += amount;
            else if (tx.type === 'expense') currMtdSummaryData.expense += amount;
          }
          if (dateStr >= mtdPeriod.prevMtdStart && dateStr <= mtdPeriod.prevMtdEnd) {
            if (tx.type === 'income') prevMtdSummaryData.income += amount;
            else if (tx.type === 'expense') prevMtdSummaryData.expense += amount;
          }
        });

        setCurrentSummary(currentSummaryData);
        setPrevSummary(prevSummaryData);

        // Filter transactions for current period to store (include all for display, we filter during calculations)
        const txs = allTxs.filter((tx: any) => {
          let txDateStr = tx.transaction_date;
          if (!txDateStr && tx.created_at) txDateStr = tx.created_at.split('T')[0];
          return txDateStr && txDateStr >= startDate && txDateStr <= endDate;
        });
        setTransactions(txs);

        // Compute spending by category to check exceeded budgets (ignore internal transfers)
        const expenseSpentMap: Record<string, { name: string; amount: number }> = {};
        let totalExpenseVal = 0;
        const dailyExpenseMap: Record<number, number> = {};
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) dailyExpenseMap[i] = 0;

        txs.forEach((tx: any) => {
          if (tx.type !== 'expense') return;
          if (tx.source_type === 'transfer' && !tx.category_id) return;
          const catId = String(tx.category_id || 'other');
          const amount = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
          const name = tx.category?.name || tx.category_name || t('other') || 'Khác';
          if (!expenseSpentMap[catId]) {
            expenseSpentMap[catId] = { name, amount: 0 };
          }
          expenseSpentMap[catId].amount += amount;
          totalExpenseVal += amount;

          let txDateStr = tx.transaction_date;
          if (!txDateStr && tx.created_at) txDateStr = tx.created_at.split('T')[0];
          
          if (txDateStr) {
            const parts = txDateStr.split('-');
            if (parts.length >= 3) {
              const day = parseInt(parts[2], 10);
              if (dailyExpenseMap[day] !== undefined) {
                dailyExpenseMap[day] += amount;
              }
            }
          }
        });

        // Calculate exceeded budgets
        const exceededBudgets: Array<{ name: string; overspent: number }> = [];
        Object.keys(bMap).forEach((catId) => {
          const limit = bMap[catId] || 0;
          const spent = expenseSpentMap[catId]?.amount || 0;
          if (limit > 0 && spent > limit) {
            exceededBudgets.push({
              name: expenseSpentMap[catId]?.name || 'Không xác định',
              overspent: spent - limit
            });
          }
        });

        // Compute abnormal spending alert text
        const dailyExpenseAvg = totalExpenseVal / daysInMonth;
        const dailyExpenseArr = Object.keys(dailyExpenseMap).map(k => ({
          day: parseInt(k),
          amount: dailyExpenseMap[parseInt(k)]
        }));
        const abnormalExpenseDays = dailyExpenseArr.filter(d => d.amount > dailyExpenseAvg * 2 && d.amount > 0);
        abnormalExpenseDays.sort((a, b) => b.amount - a.amount);

        let abnormalText = '';
        if (abnormalExpenseDays.length > 0 && dailyExpenseAvg > 0) {
          abnormalText = `Cảnh báo chi tiêu bất thường: Phát hiện ${abnormalExpenseDays.length} ngày chi tiêu vượt xa mức trung bình. Đáng chú ý là Ngày ${abnormalExpenseDays[0].day} bạn đã chi ${formatCurrencyLocal(abnormalExpenseDays[0].amount)} (gấp ${(abnormalExpenseDays[0].amount / dailyExpenseAvg).toFixed(1)} lần mức trung bình ${formatCurrencyLocal(dailyExpenseAvg)}/ngày).`;
        }

        // Generate and set insights
        const generatedInsightsBase = generateFinancialInsights(
          currentSummaryData,
          prevSummaryData,
          currMtdSummaryData,
          prevMtdSummaryData,
          mtdPeriod.mtdDay,
          exceededBudgets,
          abnormalText
        );

        // Expense Forecasting logic inside insights
        const today = new Date();
        const startD = new Date(startDate);
        const isCurrentMonth = today.getFullYear() === startD.getFullYear() && today.getMonth() === startD.getMonth();
        const elapsedDays = isCurrentMonth ? today.getDate() : new Date(startD.getFullYear(), startD.getMonth() + 1, 0).getDate();
        const totalDaysInMonth = new Date(startD.getFullYear(), startD.getMonth() + 1, 0).getDate();
        
        const forecastedExpense = elapsedDays > 0 ? (currentSummaryData.expense / elapsedDays) * totalDaysInMonth : currentSummaryData.expense;
        const totalBudgetLimit = Object.values(bMap).reduce((sum, limit) => sum + limit, 0);
        
        let forecastStatus: 'safe' | 'warning' | 'exceeded' = 'safe';
        let forecastCommentary = '';
        if (totalBudgetLimit > 0) {
          const forecastPct = (forecastedExpense / totalBudgetLimit) * 100;
          if (forecastPct >= 100) {
            forecastStatus = 'exceeded';
            forecastCommentary = `Cảnh báo: Dự báo chi tiêu cuối tháng đạt ${formatCurrencyLocal(forecastedExpense)} (vượt hạn mức tổng ngân sách ${formatCurrencyLocal(totalBudgetLimit)}). Hãy thắt chặt chi tiêu danh mục không thiết yếu ngay lập tức!`;
          } else if (forecastPct >= 90) {
            forecastStatus = 'warning';
            forecastCommentary = `Cảnh báo: Dự báo chi tiêu cuối tháng đạt ${formatCurrencyLocal(forecastedExpense)} (sắp chạm mốc tổng ngân sách ${formatCurrencyLocal(totalBudgetLimit)}). Nên cân nhắc hạn chế các khoản chi phát sinh.`;
          } else {
            forecastStatus = 'safe';
            forecastCommentary = `Rất tốt! Dự báo chi tiêu cuối tháng đạt ${formatCurrencyLocal(forecastedExpense)}, nằm trong tầm kiểm soát và thấp hơn hạn mức tổng ngân sách (${formatCurrencyLocal(totalBudgetLimit)}).`;
          }
        } else {
          forecastCommentary = `Tổng ngân sách tháng này chưa được thiết lập. Hãy lập hạn mức ngân sách để nhận phân tích dự báo chính xác nhất.`;
        }

        const generatedInsights = {
          ...generatedInsightsBase,
          isCurrentMonth,
          forecastedExpense,
          totalBudgetLimit,
          forecastStatus,
          forecastCommentary,
          totalDaysInMonth,
          forecastPct: totalBudgetLimit > 0 ? (forecastedExpense / totalBudgetLimit) * 100 : 0
        };
        setInsights(generatedInsights);

        // Dual daily trend data calculation (both income & expense, ignore internal transfers)
        const dailyIncomeMap: Record<number, number> = {};
        const dailyExpenseMapTrend: Record<number, number> = {};
        for (let i = 1; i <= daysInMonth; i++) {
          dailyIncomeMap[i] = 0;
          dailyExpenseMapTrend[i] = 0;
        }

        txs.forEach((tx: any) => {
          if (tx.source_type === 'transfer' && !tx.category_id) return;
          const amt = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
          if (amt === 0) return;
          let txDateStr = tx.transaction_date;
          if (!txDateStr && tx.created_at) txDateStr = tx.created_at.split('T')[0];
          
          if (txDateStr) {
            const parts = txDateStr.split('-');
            if (parts.length >= 3) {
              const day = parseInt(parts[2], 10);
              if (tx.type === 'income') {
                if (dailyIncomeMap[day] !== undefined) dailyIncomeMap[day] += amt;
              } else if (tx.type === 'expense') {
                if (dailyExpenseMapTrend[day] !== undefined) dailyExpenseMapTrend[day] += amt;
              }
            }
          }
        });

        const dailyArr = Object.keys(dailyIncomeMap).map(k => {
          const day = parseInt(k);
          return {
            day,
            date: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
            income: dailyIncomeMap[day],
            expense: dailyExpenseMapTrend[day]
          };
        });

        setDailyData(dailyArr);
        setMaxDailyAmt(Math.max(...dailyArr.map(d => Math.max(d.income, d.expense))));

        // Calculate abnormal days using dailyExpenseMap
        const abnormal = Object.keys(dailyExpenseMap).map(k => {
          const day = parseInt(k);
          return {
            day,
            date: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
            amount: dailyExpenseMap[day]
          };
        }).filter(d => d.amount > dailyExpenseAvg * 2 && d.amount > 0);
        abnormal.sort((a, b) => b.amount - a.amount);
        setAbnormalDays(abnormal.map(d => ({ ...d, avg: dailyExpenseAvg })));

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoadingTopCategories(false);
        setIsLoadingTopWallets(false);
        setIsLoadingTrends6M(false);
        setIsLoadingInsights(false);
        setIsLoadingTransactions(false);
      }
    };

    const timer = setTimeout(() => { fetchData(); }, 300);
    return () => clearTimeout(timer);
  }, [isLoggedIn, startDate, endDate, selectedWallet, t, wallets, categoriesMap]);

  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setTopCategories([]);
      setTopWallets([]);
      return;
    }
    
    setIsLoadingTopCategories(true);
    setIsLoadingTopWallets(true);
    
    // Category Totals calculation (ignore internal transfers)
    const categoryTotals: Record<string, any> = {};
    let totalVal = 0;
    const expenseFallbackColors = [
      '#FE5C73', '#FBBF24', '#A78BFA', '#F472B6', '#FB923C', '#E83E8C',
      '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#14B8A6',
      '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E',
      '#9F1239', '#C2410C', '#B45309', '#4D7C0F', '#047857', '#0F766E'
    ];
    const incomeFallbackColors = [
      '#10B981', '#38BDF8', '#34D399', '#2DD4BF', '#4ADE80', '#60A5FA',
      '#059669', '#0284C7', '#0D9488', '#16A34A', '#2563EB', '#4F46E5',
      '#7C3AED', '#C026D3', '#DB2777', '#E11D48', '#EA580C', '#D97706',
      '#65A30D', '#0891B2', '#0284C7', '#4338CA', '#5B21B6', '#9D174D'
    ];
    const fallbackColors = reportType === 'expense' ? expenseFallbackColors : incomeFallbackColors;
    let colorIdx = 0;
    
    transactions.forEach((tx: any) => {
      if (tx.type !== reportType) return;
      if (tx.source_type === 'transfer' && !tx.category_id) return; // ignore internal transfers
      const rawCatId = String(tx.category_id || 'other');
      const amount = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
      if (amount === 0) return;

      totalVal += amount;
      const catInfo = categoriesMap[rawCatId];
      const isChild = catInfo && catInfo.parent_id && catInfo.parent_id !== null;
      const catId = isChild ? String(catInfo.parent_id) : rawCatId;

      if (!categoryTotals[catId]) {
        let catName = tx.category?.name || tx.category_name || t('other') || 'Khác';
        let catColor = tx.category?.color;
        let catIcon = tx.category?.icon || '📁';

        if (isChild) {
           catName = catInfo.parent_name || catName;
           catColor = catInfo.parent_color || catColor;
           catIcon = catInfo.parent_icon || catIcon;
        } else if (catInfo) {
           catName = catInfo.name || catName;
           catColor = catInfo.color || catColor;
           catIcon = catInfo.icon || catIcon;
        }

        if (!catColor || catColor.toLowerCase() === '#ffffff' || catColor.toLowerCase() === '#fff') {
          if (catId === 'other') catColor = '#94A3B8';
          else {
            catColor = fallbackColors[colorIdx % fallbackColors.length];
            colorIdx++;
          }
        }
        categoryTotals[catId] = { id: catId, name: catName, icon: catIcon, color: catColor, amount: 0 };
      }
      categoryTotals[catId].amount += amount;
    });

    const sortedCategories = Object.values(categoryTotals)
      .map((cat: any) => ({ ...cat, percentage: totalVal > 0 ? (cat.amount / totalVal) * 100 : 0 }))
      .sort((a: any, b: any) => b.amount - a.amount);
      
    const topList = sortedCategories.map((cat: any, idx: number) => ({
      ...cat,
      color: fallbackColors[idx % fallbackColors.length]
    }));
      
    setTopCategories(topList);

    // Compute Spending Allocation by Wallet (ignore internal transfers)
    const walletTotals: Record<string, any> = {};
    let totalWalletVal = 0;
    const walletColors = [
      '#1814F3', '#10B981', '#FE5C73', '#FBBF24', '#A78BFA', '#F472B6', '#FB923C',
      '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
      '#06B6D4', '#EAB308', '#D946EF', '#22C55E', '#F43F5E', '#0EA5E9', '#059669',
      '#64748B', '#EF4444', '#34D399', '#FCD34D', '#C084FC', '#FDA4AF', '#FDBA74'
    ];
    let wColorIdx = 0;

    transactions.forEach((tx: any) => {
      if (tx.type !== reportType) return;
      if (tx.source_type === 'transfer' && !tx.category_id) return; // ignore internal transfers
      const walletId = tx.wallet_id || 'other';
      const amount = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
      if (amount === 0) return;

      totalWalletVal += amount;
      if (!walletTotals[walletId]) {
        const wInfo = wallets?.find((w: any) => String(w.id) === String(walletId));
        let wColor = tx.wallet?.color || wInfo?.color || walletColors[wColorIdx % walletColors.length];
        if (!wColor || wColor.toLowerCase() === '#ffffff' || wColor.toLowerCase() === '#fff') {
          wColor = walletColors[wColorIdx % walletColors.length];
        }
        wColorIdx++;
        walletTotals[walletId] = { id: walletId, name: wInfo?.name || tx.wallet_name || tx.wallet?.name || 'Ví khác', icon: wInfo?.icon || tx.wallet?.icon || '👛', color: wColor, amount: 0 };
      }
      walletTotals[walletId].amount += amount;
    });

    const sortedWallets = Object.values(walletTotals)
      .map((w: any) => ({ ...w, percentage: totalWalletVal > 0 ? (w.amount / totalWalletVal) * 100 : 0 }))
      .sort((a: any, b: any) => b.amount - a.amount);
      
    const topWalletsList = sortedWallets.map((w: any, idx: number) => ({
      ...w,
      color: walletColors[idx % walletColors.length]
    }));
      
    setTopWallets(topWalletsList);
    
    setIsLoadingTopCategories(false);
    setIsLoadingTopWallets(false);
  }, [transactions, reportType, categoriesMap, wallets, t]);

  // Save report cache when data updates
  useEffect(() => {
    if (isLoggedIn && typeof window !== 'undefined') {
      const cacheKey = `cached_report_${startDate}_${endDate}_${selectedWallet}`;
      if (
        currentSummary.income !== 0 ||
        currentSummary.expense !== 0 ||
        topCategories.length > 0 ||
        transactions.length > 0
      ) {
        localStorage.setItem(cacheKey, JSON.stringify({
          currentSummary,
          prevSummary,
          trends6M,
          budgetMap,
          transactions,
          insights,
          topCategories,
          topWallets,
          dailyData,
          maxDailyAmt,
          abnormalDays
        }));
      }
    }
  }, [
    currentSummary, prevSummary, trends6M, budgetMap, transactions, insights,
    topCategories, topWallets, dailyData, maxDailyAmt, abnormalDays,
    isLoggedIn, startDate, endDate, selectedWallet
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const history = localStorage.getItem('export_history');
      if (history) {
        setExportHistory(JSON.parse(history));
      }
    }
  }, []);

  const budgetStatuses = React.useMemo(() => {
    if (!categories || !budgetMap) return [];
    
    const flatCats: any[] = [];
    categories.forEach((c: any) => {
      flatCats.push(c);
      if (c.children && Array.isArray(c.children)) {
        c.children.forEach((child: any) => {
          flatCats.push(child);
        });
      }
    });

    const spentMap: Record<string, number> = {};
    transactions.forEach((tx: any) => {
      if (tx.type !== 'expense') return;
      if (tx.source_type === 'transfer' && !tx.category_id) return; // ignore internal transfers
      const catId = String(tx.category_id || 'other');
      const amount = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
      spentMap[catId] = (spentMap[catId] || 0) + amount;
    });

    const list: any[] = [];
    flatCats.forEach((cat: any) => {
      const catIdStr = String(cat.id);
      const limit = budgetMap[catIdStr] || 0;
      const spent = spentMap[catIdStr] || 0;
      
      if (limit > 0 || spent > 0) {
        list.push({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          limit,
          spent
        });
      }
    });
    
    if (spentMap['other'] > 0) {
      list.push({
        id: 'other',
        name: t('other') || 'Khác',
        icon: '📁',
        color: '#94A3B8',
        limit: budgetMap['other'] || 0,
        spent: spentMap['other']
      });
    }

    return list.map(item => {
      const limit = item.limit;
      const spent = item.spent;
      const remaining = limit - spent;
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      
      let status: 'exceeded' | 'warning' | 'safe' | 'none' = 'none';
      let statusText = 'Chưa thiết lập';
      
      if (limit > 0) {
        if (spent > limit) {
          status = 'exceeded';
          statusText = 'Vượt hạn mức';
        } else if (percent >= 90) {
          status = 'warning';
          statusText = 'Sắp chạm mốc';
        } else {
          status = 'safe';
          statusText = 'Còn dư';
        }
      }

      return {
        ...item,
        remaining,
        percent,
        status,
        statusText
      };
    }).sort((a, b) => {
      const priority: Record<string, number> = { exceeded: 0, warning: 1, safe: 2, none: 3 };
      return priority[a.status] - priority[b.status] || b.spent - a.spent;
    });
  }, [categories, budgetMap, transactions, t]);

  const saveExportHistory = (name: string, type: string, size: string) => {
    const filters = { startDate, endDate, selectedCategory, selectedWallet, selectedType };
    const newRecord = {
      id: Date.now().toString(),
      name,
      date: new Date().toLocaleString('vi-VN'),
      size,
      type,
      filters
    };
    const updatedHistory = [newRecord, ...exportHistory].slice(0, 10);
    localStorage.setItem('export_history', JSON.stringify(updatedHistory));
    setExportHistory(updatedHistory);
  };

  const handleReloadExport = (record: any) => {
    if (record.filters) {
      setStartDate(record.filters.startDate || '');
      setEndDate(record.filters.endDate || '');
      setSelectedCategory(record.filters.selectedCategory || '');
      setSelectedWallet(record.filters.selectedWallet || '');
      setSelectedType(record.filters.selectedType || '');
      alert('Đã áp dụng lại bộ lọc của file này. Vui lòng nhấn nút xuất báo cáo tương ứng ở phía trên!');
    }
  };

  const handleExportExcel = async () => {
    if (!isLoggedIn) return;
    setIsExportingExcel(true);
    try {
      const res = await transactionApi.getAll({ 
        start_date: startDate, 
        end_date: endDate, 
        per_page: 10000,
        category_id: selectedCategory || undefined,
        wallet_id: selectedWallet || undefined,
        type: selectedType || undefined
      });
      const data = res.data || res;
      const txs = Array.isArray(data) ? data : (data.data || []);
      
      let tableHtml = `
        <html xmlns:x="urn:schemas-microsoft-com:office:excel">
          <head>
            <meta charset="utf-8">
          </head>
          <body>
            <table border="1">
              <thead>
                <tr>
                  <th width="60" style="background-color: #16DBCC; color: white;">STT</th>
                  <th width="150" style="background-color: #16DBCC; color: white;">Ngày Giao Dịch</th>
                  <th width="100" style="background-color: #16DBCC; color: white;">Giờ</th>
                  <th width="120" style="background-color: #16DBCC; color: white;">Loại</th>
                  <th width="150" style="background-color: #16DBCC; color: white;">Số Tiền</th>
                  <th width="200" style="background-color: #16DBCC; color: white;">Danh Mục</th>
                  <th width="200" style="background-color: #16DBCC; color: white;">Ví</th>
                  <th width="180" style="background-color: #16DBCC; color: white;">Chuyển Tiền Nội Bộ</th>
                  <th width="300" style="background-color: #16DBCC; color: white;">Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
      `;
      txs.forEach((t: any, index: number) => {
        let datePart = '';
        let timePart = '';
        const rawDate = t.transaction_date || t.date || '';
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            datePart = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
            timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          } else {
            datePart = rawDate;
          }
        }
        tableHtml += `
          <tr>
            <td style="text-align:center;">${index + 1}</td>
            <td style="text-align:center;">${datePart}</td>
            <td style="text-align:center;">${timePart}</td>
            <td>${t.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}</td>
            <td>${new Intl.NumberFormat('vi-VN').format(Number(t.amount) || 0)}</td>
            <td>${(() => {
              const catId = String(t.category_id || 'other');
              const catInfo = categoriesMap[catId];
              if (catInfo && catInfo.parent_id) {
                return catInfo.parent_name + ' - ' + (t.category?.name || t.category_name || catInfo.name);
              }
              return t.category?.name || t.category_name || '';
            })()}</td>
            <td>${t.wallet?.name || t.wallet_name || ''}</td>
            <td style="text-align:center;">${!(t.category?.name || t.category_name) ? 'x' : ''}</td>
            <td>${t.description || t.note || ''}</td>
          </tr>
        `;
      });
      tableHtml += `
              </tbody>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Giao_Dich_${startDate}_${endDate}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi xuất Excel!");
    } finally {
      const sizeBytes = 1024 * 5; 
      const sizeStr = sizeBytes > 1024 * 1024 ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : (sizeBytes / 1024).toFixed(0) + ' KB';
      
      saveExportHistory(`Giao_Dich_${startDate}_${endDate}.xls`, 'excel', sizeStr);
      setIsExportingExcel(false);
    }
  };

  const handleExportCSV = async () => {
    if (!isLoggedIn) return;
    setIsExportingCSV(true);
    try {
      const res = await transactionApi.getAll({ 
        start_date: startDate, 
        end_date: endDate, 
        per_page: 10000,
        category_id: selectedCategory || undefined,
        wallet_id: selectedWallet || undefined,
        type: selectedType || undefined
      });
      const data = res.data || res;
      const txs = Array.isArray(data) ? data : (data.data || []);
      
      let csvContent = "\uFEFF"; 
      csvContent += "STT;Ngày Giao Dịch;Giờ;Loại;Số Tiền;Danh Mục;Ví;Chuyển Tiền Nội Bộ;Ghi Chú\n";
      
      txs.forEach((t: any, index: number) => {
        let datePart = '';
        let timePart = '';
        const rawDate = t.transaction_date || t.date || '';
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            datePart = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
            timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          } else {
            datePart = rawDate;
          }
        }
        
        const type = t.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
        const amount = new Intl.NumberFormat('vi-VN').format(Number(t.amount) || 0);
        let category = t.category?.name || t.category_name || '';
        const catId = String(t.category_id || 'other');
        const catInfo = categoriesMap[catId];
        if (catInfo && catInfo.parent_id) {
          category = catInfo.parent_name + ' - ' + category;
        }
        const wallet = t.wallet?.name || t.wallet_name || '';
        const isInternal = !(t.category?.name || t.category_name) ? 'x' : '';
        const note = t.description || t.note || '';

        const escapeCsv = (val: any) => {
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(';') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        csvContent += `${index + 1};${escapeCsv(datePart)};${escapeCsv(timePart)};${escapeCsv(type)};${escapeCsv(amount)};${escapeCsv(category)};${escapeCsv(wallet)};${escapeCsv(isInternal)};${escapeCsv(note)}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Giao_Dich_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi xuất CSV!");
    } finally {
      const sizeBytes = 1024 * 2; 
      const sizeStr = sizeBytes > 1024 * 1024 ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : (sizeBytes / 1024).toFixed(0) + ' KB';

      saveExportHistory(`Giao_Dich_${startDate}_${endDate}.csv`, 'csv', sizeStr);
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    if (!isLoggedIn) return;
    setIsExporting(true);
    try {
      const summaryRes = await reportApi.getSummary(startDate, endDate, selectedWallet || undefined).catch(()=>({data:{income: 0, expense: 0, net: 0}}));
      const txRes = await transactionApi.getAll({ 
        start_date: startDate, 
        end_date: endDate, 
        per_page: 10000,
        category_id: selectedCategory || undefined,
        wallet_id: selectedWallet || undefined,
        type: selectedType || undefined
      }).catch(() => ({ data: [] }));
      const txData = txRes.data || txRes;
      const txs = Array.isArray(txData) ? txData : (txData.data || []);
         
         const range6M = getPast6MonthsRange();
         const trends6MRes = await reportApi.getTrends(range6M.startDate, range6M.endDate, 'month').catch(() => ({ data: [] }));
         const trends6MData = Array.isArray(trends6MRes.data) ? trends6MRes.data : (trends6MRes.data?.data || []);

         const container = document.createElement('div');
         container.style.padding = '40px';
         container.style.background = '#fff';
         container.style.color = '#000';
         container.style.width = '750px';
         container.style.boxSizing = 'border-box';

         const formatCurrency = (val: number | string, customCurrency?: string) => {
            const numericAmount = typeof val === 'string' ? parseFloat(val) : val;
            if (isNaN(numericAmount)) return '0';
            const currencyCode = customCurrency || userData?.preference?.currency || 'VND';
            let locale = 'vi-VN';
            if (currencyCode === 'USD') locale = 'en-US';
            else if (currencyCode === 'EUR') locale = 'de-DE';
            else if (currencyCode === 'GBP') locale = 'en-GB';
            else if (currencyCode === 'JPY') locale = 'ja-JP';
            return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(numericAmount);
         };

         let html = `
           <div style="text-align:center;margin-bottom:30px;">
             <h1 style="font-size:24px;margin-bottom:10px;">BÁO CÁO TỔNG HỢP THU CHI</h1>
             <p style="font-size:16px;color:#666;">Từ ${startDate} đến ${endDate}</p>
           </div>
           <table style="width:100%;border-collapse:collapse;margin-bottom:40px;font-family:sans-serif;">
             <thead>
               <tr style="background:#f4f7fe;">
                 <th style="border:1px solid #ddd;padding:12px;text-align:center;">Tổng Thu</th>
                 <th style="border:1px solid #ddd;padding:12px;text-align:center;">Tổng Chi</th>
                 <th style="border:1px solid #ddd;padding:12px;text-align:center;">Số Dư Ròng</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td style="border:1px solid #ddd;padding:12px;text-align:center;color:#16DBCC;font-weight:bold;">${formatCurrency(summaryRes.data?.income || 0)}</td>
                 <td style="border:1px solid #ddd;padding:12px;text-align:center;color:#FE5C73;font-weight:bold;">${formatCurrency(summaryRes.data?.expense || 0)}</td>
                 <td style="border:1px solid #ddd;padding:12px;text-align:center;font-weight:bold;">${formatCurrency((summaryRes.data?.income || 0) - (summaryRes.data?.expense || 0))}</td>
               </tr>
             </tbody>
           </table>
         `;

          if (insights) {
             html += `
               <div style="margin-top: 30px; page-break-inside: avoid; font-family:sans-serif;">
                  <h3 style="margin-bottom:15px; font-size:16px; color:#333; text-transform:uppercase;">💡 GỢI Ý & PHÂN TÍCH TÀI CHÍNH</h3>
                  ${insights.exceededText ? `
                    <div style="background:#fee2e2; border:1px solid #fca5a5; border-radius:8px; padding:12px; margin-bottom:15px; display:flex; gap:10px; align-items:center; font-family:sans-serif;">
                      <span style="font-size:16px;">⚠️</span>
                      <span style="font-size:11px; color:#b91c1c; font-weight:bold; line-height:1.4;">${insights.exceededText}</span>
                    </div>
                  ` : ''}
                  <table style="width:100%; border-collapse: separate; border-spacing: 15px; margin-bottom: 20px; font-family:sans-serif;">
                    <tr>
                      <!-- CARD 1: OVERVIEW -->
                      <td style="width:50%; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:15px; vertical-align:top;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                          <span style="font-weight:bold; color:#4b5563; font-size:13px;">Tổng quan thu chi</span>
                          <span style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:10px; background:${insights.overviewStatus === 'surplus' ? '#d1fae5' : '#fee2e2'}; color:${insights.overviewStatus === 'surplus' ? '#065f46' : '#991b1b'};">
                            ${insights.overviewStatus === 'surplus' ? 'Thặng dư' : 'Thâm hụt'}
                          </span>
                        </div>
                        <div style="font-size:18px; font-weight:bold; color:${insights.overviewStatus === 'surplus' ? '#10B981' : '#FE5C73'}; margin-bottom:8px;">
                          ${insights.overviewStatus === 'surplus' ? '+' : '-'}${formatCurrency(Math.abs(currentSummary.income - currentSummary.expense))}
                        </div>
                        <div style="font-size:12px; color:#4b5563; line-height:1.4;">${insights.overviewText}</div>
                      </td>
                      
                      <!-- CARD 2: SAVING RATE -->
                      <td style="width:50%; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:15px; vertical-align:top;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                          <span style="font-weight:bold; color:#4b5563; font-size:13px;">Tỷ lệ tiết kiệm</span>
                          <span style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:10px; background:${
                            insights.savingRateStatus === 'excellent' ? '#d1fae5' : insights.savingRateStatus === 'good' ? '#e0f2fe' : insights.savingRateStatus === 'fair' ? '#fef3c7' : '#fee2e2'
                          }; color:${
                            insights.savingRateStatus === 'excellent' ? '#065f46' : insights.savingRateStatus === 'good' ? '#075985' : insights.savingRateStatus === 'fair' ? '#92400e' : '#991b1b'
                          };">
                            ${insights.savingRateStatus === 'excellent' ? 'Xuất sắc' : insights.savingRateStatus === 'good' ? 'Tốt' : insights.savingRateStatus === 'fair' ? 'Tạm ổn' : 'Cảnh báo'}
                          </span>
                        </div>
                        <div style="font-size:18px; font-weight:bold; color:#1f2937; margin-bottom:8px;">
                          ${insights.savingRate.toFixed(1)}%
                        </div>
                        <div style="width:100%; height:6px; background:#e5e7eb; border-radius:3px; margin-bottom:8px; overflow:hidden;">
                          <div style="width:${Math.max(0, Math.min(100, insights.savingRate))}%; height:100%; border-radius:3px; background:${
                            insights.savingRateStatus === 'excellent' ? '#10B981' : insights.savingRateStatus === 'good' ? '#2D9CDB' : insights.savingRateStatus === 'fair' ? '#F59E0B' : '#FE5C73'
                          };"></div>
                        </div>
                        <div style="font-size:12px; color:#4b5563; line-height:1.4;">${insights.savingRateCommentary}</div>
                      </td>
                    </tr>
                    <tr>
                      <!-- CARD 3: COMPARISON -->
                      <td style="width:50%; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:15px; vertical-align:top;">
                        <div style="margin-bottom:10px;">
                          <span style="font-weight:bold; color:#4b5563; font-size:13px;">So với kỳ trước</span>
                        </div>
                        <div style="font-size:12px; color:#4b5563; line-height:1.4; margin-bottom:8px;">${insights.comparisonText}</div>
                        <div style="display:flex; gap:10px;">
                          <div style="flex:1; background:#f3f4f6; border-radius:6px; padding:6px; text-align:center;">
                            <div style="font-size:9px; color:#6b7280; font-weight:bold;">Thu nhập</div>
                            <div style="font-size:11px; font-weight:bold; color:${insights.comparisonIncomeChangePct >= 0 ? '#10B981' : '#FE5C73'};">
                              ${insights.comparisonIncomeChangePct >= 0 ? '↑' : '↓'} ${Math.abs(insights.comparisonIncomeChangePct).toFixed(1)}%
                            </div>
                          </div>
                          <div style="flex:1; background:#f3f4f6; border-radius:6px; padding:6px; text-align:center;">
                            <div style="font-size:9px; color:#6b7280; font-weight:bold;">Chi tiêu</div>
                            <div style="font-size:11px; font-weight:bold; color:${insights.comparisonExpenseChangePct >= 0 ? '#FE5C73' : '#10B981'};">
                              ${insights.comparisonExpenseChangePct >= 0 ? '↑' : '↓'} ${Math.abs(insights.comparisonExpenseChangePct).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <!-- CARD 4: MTD COMPARISON -->
                      <td style="width:50%; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:15px; vertical-align:top;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                          <span style="font-weight:bold; color:#4b5563; font-size:13px;">Tốc độ tiêu dùng (MTD)</span>
                          ${insights.mtdStatus !== 'none' ? `
                            <span style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:10px; background:${insights.mtdStatus === 'decrease' ? '#d1fae5' : insights.mtdStatus === 'increase' ? '#fee2e2' : '#e0f2fe'}; color:${insights.mtdStatus === 'decrease' ? '#065f46' : insights.mtdStatus === 'increase' ? '#991b1b' : '#075985'};">
                              ${insights.mtdStatus === 'decrease' ? 'Tốt' : insights.mtdStatus === 'increase' ? 'Nhanh hơn' : 'Ổn định'}
                            </span>
                          ` : ''}
                        </div>
                        <div style="font-size:12px; color:#4b5563; line-height:1.4;">${insights.mtdComparisonText}</div>
                      </td>
                    </tr>
                  </table>
                </div>
              `;

              // Add Forecast Card in PDF if budget setup exists
              if (insights.totalBudgetLimit > 0) {
                html += `
                  <div style="margin-top: 15px; background:${insights.forecastStatus === 'exceeded' ? '#fdf2f2' : (insights.forecastStatus === 'warning' ? '#fffbeb' : '#f0fdf4')}; border:1px solid ${insights.forecastStatus === 'exceeded' ? '#fde8e8' : (insights.forecastStatus === 'warning' ? '#fef3c7' : '#dcfce7')}; border-radius:12px; padding:15px; page-break-inside: avoid; font-family:sans-serif; margin-bottom: 20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                      <span style="font-weight:bold; color:#1f2937; font-size:13px; display:flex; align-items:center; gap:6px;">🔮 Dự báo chi tiêu & Cảnh báo thông minh</span>
                      <span style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:10px; background:${insights.forecastStatus === 'exceeded' ? '#fee2e2' : (insights.forecastStatus === 'warning' ? '#fef3c7' : '#d1fae5')}; color:${insights.forecastStatus === 'exceeded' ? '#991b1b' : (insights.forecastStatus === 'warning' ? '#92400e' : '#065f46')};">
                        ${insights.forecastStatus === 'exceeded' ? 'Cảnh báo đỏ' : (insights.forecastStatus === 'warning' ? 'Cảnh báo vàng' : 'An toàn')}
                      </span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:20px;">
                      <div style="flex:1; font-size:12px; color:#4b5563; line-height:1.5;">
                        ${insights.forecastCommentary}
                        ${insights.isCurrentMonth ? `<div style="font-size:10px; color:#888; margin-top:4px;">* Tính toán dựa trên mức chi tiêu trung bình thực tế của tháng hiện tại.</div>` : ''}
                      </div>
                      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:10px; min-width:200px; box-sizing: border-box;">
                        <div style="display:flex; justify-content:space-between; font-size:10px; color:#6b7280; margin-bottom:4px;">
                          <span>Dự báo chi tiêu</span>
                          <span>Hạn mức tổng</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:bold; margin-bottom:6px;">
                          <span style="color:${insights.forecastStatus === 'exceeded' ? '#FE5C73' : (insights.forecastStatus === 'warning' ? '#F59E0B' : '#10B981')}">${formatCurrency(insights.forecastedExpense)}</span>
                          <span>${formatCurrency(insights.totalBudgetLimit)}</span>
                        </div>
                        <div style="width:100%; height:6px; background:#e5e7eb; border-radius:3px; overflow:hidden;">
                          <div style="width:${Math.min(100, insights.forecastPct)}%; height:100%; background:${insights.forecastStatus === 'exceeded' ? '#FE5C73' : (insights.forecastStatus === 'warning' ? '#F59E0B' : '#10B981')}; border-radius:3px;"></div>
                        </div>
                        <div style="text-align:right; font-size:9px; color:#6b7280; margin-top:4px; font-weight:bold;">Đã sử dụng dự kiến: ${insights.forecastPct.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                `;
              }
          }

      // Donut Chart Generator Helper
      const generateDonutChartSvg = (data: Array<{ name: string, amount: number, percentage: number }>, totalAmount: number, chartTitle: string, colors: string[]) => {
        let currentPercentage = 0;
        let svgCircles = '';
        const C = 2 * Math.PI * 80;
        
        if (data.length > 0) {
          data.forEach((c, i) => {
            const dashValue = (c.percentage * C) / 100;
            const gapValue = C - dashValue;
            const dashArray = `${dashValue} ${gapValue}`;
            const dashOffset = -(currentPercentage * C) / 100;
            svgCircles += `<circle cx="100" cy="100" r="80" fill="transparent" stroke="${colors[i % colors.length]}" stroke-width="25" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}"></circle>`;
            currentPercentage += c.percentage;
          });
        } else {
          svgCircles = `<circle cx="100" cy="100" r="80" fill="transparent" stroke="#f0f0f0" stroke-width="25"></circle>`;
        }

        const legendHtml = data.map((c, i) => `
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px; font-size:11px;">
            <div style="display:flex; align-items:center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">
              <div style="width:10px; height:10px; border-radius:2px; background:${colors[i % colors.length]}; flex-shrink:0;"></div>
              <span style="color:#333; font-weight:500;">${c.name}</span>
            </div>
            <div style="color:#666; font-size:10px; flex-shrink:0; text-align:right;">
              <span>${formatCurrency(c.amount)}</span>
              <span style="margin-left:4px; font-weight:bold;">(${c.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        `).join('');

        return `
          <div style="border:1px solid #e5e7eb; border-radius:12px; padding:15px; background:#fafafa; height:230px; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
            <h4 style="margin:0 0 10px 0; font-size:12px; color:#4b5563; font-family:sans-serif; text-transform:uppercase; text-align:center;">${chartTitle}</h4>
            <div style="display:flex; align-items:center; justify-content:center; gap: 20px;">
              <div style="position:relative; width: 120px; height: 120px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <svg width="120" height="120" viewBox="0 0 200 200" style="position:absolute; top:0; left:0; width: 120px; height: 120px; transform: rotate(-90deg);">
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke="#f0f0f0" stroke-width="25"></circle>
                  ${svgCircles}
                </svg>
                <div style="position:relative; z-index:10; background: #fff; width: 70px; height: 70px; border-radius: 50%; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                  <div style="font-size:7px; color:#888; font-family:sans-serif; margin-bottom:2px;">TỔNG</div>
                  <div style="font-size:9px; font-weight:bold; font-family:sans-serif; text-align:center; overflow:hidden; text-overflow:ellipsis; width:60px; white-space:nowrap;">${formatCurrency(totalAmount)}</div>
                </div>
              </div>
              <div style="flex:1; font-family:sans-serif; overflow-y:auto; max-height:140px; padding-right:2px;">
                ${legendHtml || '<div style="color:#999; font-size:11px; text-align:center; margin-top:40px;">Không có dữ liệu</div>'}
              </div>
            </div>
          </div>
        `;
      };

      // Compute Expense Allocation by Category
      const expenseTxs = txs.filter((t: any) => t.type === 'expense');
      const categoryExpenseTotals: Record<string, number> = {};
      let totalExpenseAmount = 0;
      expenseTxs.forEach((t: any) => {
         const catId = String(t.category_id || 'other');
         const catInfo = categoriesMap[catId];
         let catName = t.category?.name || t.category_name || 'Khác';
         if (catInfo && catInfo.parent_id) {
           catName = catInfo.parent_name;
         } else if (catInfo) {
           catName = catInfo.name;
         }
         
         const amount = Number(t.amount) || 0;
         if (!categoryExpenseTotals[catName]) categoryExpenseTotals[catName] = 0;
         categoryExpenseTotals[catName] += amount;
         totalExpenseAmount += amount;
      });
      const categoryExpenseData = Object.keys(categoryExpenseTotals).map(name => ({
         name,
         amount: categoryExpenseTotals[name],
         percentage: totalExpenseAmount > 0 ? (categoryExpenseTotals[name] / totalExpenseAmount) * 100 : 0
      })).sort((a, b) => b.amount - a.amount).slice(0, 8);

      // Compute Income Allocation by Category
      const incomeTxs = txs.filter((t: any) => t.type === 'income');
      const categoryIncomeTotals: Record<string, number> = {};
      let totalIncomeAmount = 0;
      incomeTxs.forEach((t: any) => {
         const catId = String(t.category_id || 'other');
         const catInfo = categoriesMap[catId];
         let catName = t.category?.name || t.category_name || 'Khác';
         if (catInfo && catInfo.parent_id) {
           catName = catInfo.parent_name;
         } else if (catInfo) {
           catName = catInfo.name;
         }

         const amount = Number(t.amount) || 0;
         if (!categoryIncomeTotals[catName]) categoryIncomeTotals[catName] = 0;
         categoryIncomeTotals[catName] += amount;
         totalIncomeAmount += amount;
      });
      const categoryIncomeData = Object.keys(categoryIncomeTotals).map(name => ({
         name,
         amount: categoryIncomeTotals[name],
         percentage: totalIncomeAmount > 0 ? (categoryIncomeTotals[name] / totalIncomeAmount) * 100 : 0
      })).sort((a, b) => b.amount - a.amount).slice(0, 8);

      // Compute Expense Allocation by Wallet
      const walletExpenseTotals: Record<string, number> = {};
      expenseTxs.forEach((t: any) => {
         const walletName = t.wallet?.name || t.wallet_name || 'Ví khác';
         const amount = Number(t.amount) || 0;
         if (!walletExpenseTotals[walletName]) walletExpenseTotals[walletName] = 0;
         walletExpenseTotals[walletName] += amount;
      });
      const walletExpenseData = Object.keys(walletExpenseTotals).map(name => ({
         name,
         amount: walletExpenseTotals[name],
         percentage: totalExpenseAmount > 0 ? (walletExpenseTotals[name] / totalExpenseAmount) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

      // Compute Income Allocation by Wallet
      const walletIncomeTotals: Record<string, number> = {};
      incomeTxs.forEach((t: any) => {
         const walletName = t.wallet?.name || t.wallet_name || 'Ví khác';
         const amount = Number(t.amount) || 0;
         if (!walletIncomeTotals[walletName]) walletIncomeTotals[walletName] = 0;
         walletIncomeTotals[walletName] += amount;
      });
      const walletIncomeData = Object.keys(walletIncomeTotals).map(name => ({
         name,
         amount: walletIncomeTotals[name],
         percentage: totalIncomeAmount > 0 ? (walletIncomeTotals[name] / totalIncomeAmount) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

      const donutExpenseCategory = generateDonutChartSvg(categoryExpenseData, totalExpenseAmount, "Chi tiêu theo Danh mục", ['#FE5C73', '#F2994A', '#F2C94C', '#EB5757', '#FF8E9F', '#9B51E0', '#2D9CDB', '#BB6BD9']);
      const donutIncomeCategory = generateDonutChartSvg(categoryIncomeData, totalIncomeAmount, "Thu nhập theo Danh mục", ['#10B981', '#2D9CDB', '#27AE60', '#56CCF2', '#2196F3', '#00BCD4', '#009688', '#4CAF50']);
      const donutExpenseWallet = generateDonutChartSvg(walletExpenseData, totalExpenseAmount, "Chi tiêu theo Ví", ['#FE5C73', '#2D9CDB', '#F2C94C', '#1814F3', '#FE5C73', '#FF8E9F', '#FFB3C1', '#FFD2DC']);
      const donutIncomeWallet = generateDonutChartSvg(walletIncomeData, totalIncomeAmount, "Thu nhập theo Ví", ['#10B981', '#2D9CDB', '#27AE60', '#56CCF2', '#2196F3', '#4CAF50', '#8BC34A', '#CDDC39']);

      let allocationHtml = `
        <div style="margin-top: 30px; page-break-inside: avoid; font-family:sans-serif;">
          <h3 style="margin-bottom:15px; font-size:15px; color:#333; text-transform:uppercase;">📊 PHÂN BỔ THU CHI</h3>
          
          <table style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
              <td style="width:50%; padding-right:10px; vertical-align:top;">
                ${donutExpenseCategory}
              </td>
              <td style="width:50%; padding-left:10px; vertical-align:top;">
                ${donutIncomeCategory}
              </td>
            </tr>
            ${(walletExpenseData.length > 0 || walletIncomeData.length > 0) ? `
              <tr>
                <td colspan="2" style="height: 15px;"></td>
              </tr>
              <tr>
                <td style="width:50%; padding-right:10px; vertical-align:top;">
                  ${donutExpenseWallet}
                </td>
                <td style="width:50%; padding-left:10px; vertical-align:top;">
                  ${donutIncomeWallet}
                </td>
              </tr>
            ` : ''}
          </table>
        </div>
      `;

      html += allocationHtml;

      // Compute Daily Trend Line Chart Data
      const dates = getDatesBetween(startDate, endDate);
      const dailyTrends = dates.map((dateStr: string) => {
        const d = new Date(dateStr);
        return {
          date: dateStr,
          day: d.getDate(),
          label: `${d.getDate()}/${d.getMonth() + 1}`,
          income: 0,
          expense: 0
        };
      });

      txs.forEach((tx: any) => {
        const amt = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
        if (amt === 0) return;
        let txDateStr = tx.transaction_date;
        if (!txDateStr && tx.created_at) txDateStr = tx.created_at.split('T')[0];
        if (txDateStr) {
          const localDate = txDateStr.substring(0, 10);
          const found = dailyTrends.find((item: any) => item.date === localDate);
          if (found) {
            if (tx.type === 'income') found.income += amt;
            else if (tx.type === 'expense') found.expense += amt;
          }
        }
      });

      const maxDailyAmt = Math.max(...dailyTrends.map((d: any) => Math.max(d.income, d.expense)), 100000);
      const chartW = 670;
      const chartH = 200;
      const paddingY = 30;
      const paddingX = 50;

      const points = dailyTrends.map((d: any, i: number) => {
        const x = paddingX + (i / Math.max(1, dailyTrends.length - 1)) * (chartW - paddingX - 20);
        const yIncome = chartH - paddingY - (d.income / maxDailyAmt) * (chartH - paddingY * 2);
        const yExpense = chartH - paddingY - (d.expense / maxDailyAmt) * (chartH - paddingY * 2);
        return { x, yIncome, yExpense, ...d };
      });

      let pathIncomeD = '';
      let pathExpenseD = '';
      if (points.length > 0) {
        pathIncomeD = `M ${points[0].x},${points[0].yIncome}`;
        pathExpenseD = `M ${points[0].x},${points[0].yExpense}`;
        for (let i = 0; i < points.length - 1; i++) {
          const curr = points[i];
          const next = points[i + 1];
          const cpx1 = curr.x + (next.x - curr.x) / 2;
          const cpx2 = curr.x + (next.x - curr.x) / 2;
          pathIncomeD += ` C ${cpx1},${curr.yIncome} ${cpx2},${next.yIncome} ${next.x},${next.yIncome}`;
          pathExpenseD += ` C ${cpx1},${curr.yExpense} ${cpx2},${next.yExpense} ${next.x},${next.yExpense}`;
        }
      }

      const fillIncomePathD = points.length > 0 
        ? `${pathIncomeD} L ${points[points.length - 1].x},${chartH - paddingY} L ${points[0].x},${chartH - paddingY} Z`
        : '';

      const fillExpensePathD = points.length > 0 
        ? `${pathExpenseD} L ${points[points.length - 1].x},${chartH - paddingY} L ${points[0].x},${chartH - paddingY} Z`
        : '';

      let trendLineHtml = `
        <div style="margin-top: 30px; page-break-inside: avoid; font-family:sans-serif;">
          <h3 style="margin-bottom:15px; font-size:15px; color:#333; text-transform:uppercase;">📈 XU HƯỚNG THU CHI HÀNG NGÀY</h3>
          <div style="display: flex; gap: 20px; margin-bottom: 10px; font-size: 12px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10B981;"></span>
              <span style="color: #555; font-weight: bold;">Thu nhập</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #FE5C73;"></span>
              <span style="color: #555; font-weight: bold;">Chi tiêu</span>
            </div>
          </div>
          <svg width="${chartW}" height="${chartH}" viewBox="0 0 ${chartW} ${chartH}" style="width: 100%; height: auto; background: #fafafa; border-radius: 8px; border: 1px solid #eee;">
            <defs>
              <linearGradient id="pdf-income-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10B981" stop-opacity="0.15" />
                <stop offset="100%" stop-color="#10B981" stop-opacity="0.0" />
              </linearGradient>
              <linearGradient id="pdf-expense-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#FE5C73" stop-opacity="0.15" />
                <stop offset="100%" stop-color="#FE5C73" stop-opacity="0.0" />
              </linearGradient>
            </defs>
            
            <!-- Grid lines -->
            <line x1="${paddingX}" y1="${paddingY}" x2="${chartW - 20}" y2="${paddingY}" stroke="#e5e7eb" stroke-dasharray="4 4" />
            <line x1="${paddingX}" y1="${(chartH) / 2}" x2="${chartW - 20}" y2="${(chartH) / 2}" stroke="#e5e7eb" stroke-dasharray="4 4" />
            <line x1="${paddingX}" y1="${chartH - paddingY}" x2="${chartW - 20}" y2="${chartH - paddingY}" stroke="#cccccc" stroke-width="1" />
            
            <!-- Y-Axis labels -->
            <text x="${paddingX - 10}" y="${paddingY + 4}" text-anchor="end" fill="#888" font-size="9" font-weight="bold">${formatCurrencyShort(maxDailyAmt)}</text>
            <text x="${paddingX - 10}" y="${(chartH) / 2 + 4}" text-anchor="end" fill="#888" font-size="9" font-weight="bold">${formatCurrencyShort(maxDailyAmt / 2)}</text>
            <text x="${paddingX - 10}" y="${chartH - paddingY + 4}" text-anchor="end" fill="#888" font-size="9" font-weight="bold">0</text>

            <!-- Fill areas -->
            ${fillIncomePathD ? `<path d="${fillIncomePathD}" fill="url(#pdf-income-grad)" />` : ''}
            ${fillExpensePathD ? `<path d="${fillExpensePathD}" fill="url(#pdf-expense-grad)" />` : ''}

            <!-- Lines -->
            ${pathIncomeD ? `<path d="${pathIncomeD}" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />` : ''}
            ${pathExpenseD ? `<path d="${pathExpenseD}" fill="none" stroke="#FE5C73" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />` : ''}

            <!-- Dots for key points -->
            ${points.map((p: any, i: number) => {
              const shouldRenderDot = points.length <= 15 || i % 2 === 0 || i === points.length - 1;
              if (!shouldRenderDot) return '';
              let dots = '';
              if (p.income > 0) {
                dots += `<circle cx="${p.x}" cy="${p.yIncome}" r="3.5" fill="#fff" stroke="#10B981" stroke-width="2" />`;
              }
              if (p.expense > 0) {
                dots += `<circle cx="${p.x}" cy="${p.yExpense}" r="3.5" fill="#fff" stroke="#FE5C73" stroke-width="2" />`;
              }
              return dots;
            }).join('')}

            <!-- X-Axis Labels -->
            ${points.map((p: any, i: number) => {
              const isFirst = i === 0;
              const isLast = i === points.length - 1;
              const shouldShowLabel = i === 0 || i === points.length - 1 || (i % 5 === 0 && i < points.length - 3);
              if (!shouldShowLabel) return '';
              const anchor = isFirst ? 'start' : (isLast ? 'end' : 'middle');
              return `<text x="${p.x}" y="${chartH - 10}" text-anchor="${anchor}" fill="#888" font-size="9" font-weight="bold">Ngày ${p.day}</text>`;
            }).join('')}
          </svg>
        </div>
      `;

      html += trendLineHtml;

      // Compute 6-Month Historical Bar Chart
      const maxBarVal = Math.max(...trends6MData.map((d: any) => Math.max(d.income, d.expense)), 100000);
      const barChartW = 670;
      const barChartH = 180;
      const barPaddingY = 25;
      const barPaddingLeft = 50;

      let barChartHtml = `
        <div style="margin-top: 30px; page-break-inside: avoid; font-family:sans-serif;">
          <h3 style="margin-bottom:15px; font-size:15px; color:#333; text-transform:uppercase;">📊 XU HƯỚNG THU CHI 6 THÁNG GẦN NHẤT</h3>
          <div style="display: flex; gap: 20px; margin-bottom: 10px; font-size: 12px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10B981;"></span>
              <span style="color: #555; font-weight: bold;">Thu nhập</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #FE5C73;"></span>
              <span style="color: #555; font-weight: bold;">Chi tiêu</span>
            </div>
          </div>
          <svg width="${barChartW}" height="${barChartH}" viewBox="0 0 ${barChartW} ${barChartH}" style="width: 100%; height: auto; background: #fafafa; border-radius: 8px; border: 1px solid #eee;">
            <!-- Grid lines -->
            <line x1="${barPaddingLeft}" y1="${barPaddingY}" x2="${barChartW - 20}" y2="${barPaddingY}" stroke="#e5e7eb" stroke-dasharray="4 4" />
            <line x1="${barPaddingLeft}" y1="${(barChartH) / 2}" x2="${barChartW - 20}" y2="${(barChartH) / 2}" stroke="#e5e7eb" stroke-dasharray="4 4" />
            <line x1="${barPaddingLeft}" y1="${barChartH - barPaddingY}" x2="${barChartW - 20}" y2="${barChartH - barPaddingY}" stroke="#cccccc" stroke-width="1" />
            
            <!-- Y-Axis labels -->
            <text x="${barPaddingLeft - 10}" y="${barPaddingY + 4}" text-anchor="end" fill="#888" font-size="9" font-weight="bold">${formatCurrencyShort(maxBarVal)}</text>
            <text x="${barPaddingLeft - 10}" y="${(barChartH) / 2 + 4}" text-anchor="end" fill="#888" font-size="9" font-weight="bold">${formatCurrencyShort(maxBarVal / 2)}</text>
            <text x="${barPaddingLeft - 10}" y="${barChartH - barPaddingY + 4}" text-anchor="end" fill="#888" font-size="9" font-weight="bold">0</text>
      `;

      if (trends6MData.length > 0) {
        trends6MData.forEach((item: any, i: number) => {
          const groupX = barPaddingLeft + i * ((barChartW - barPaddingLeft - 20) / trends6MData.length);
          const colSpace = (barChartW - barPaddingLeft - 20) / trends6MData.length;
          const barW = 16;
          const incH = (item.income / maxBarVal) * (barChartH - barPaddingY * 2);
          const expH = (item.expense / maxBarVal) * (barChartH - barPaddingY * 2);
          
          const incX = groupX + (colSpace / 2) - barW - 2;
          const expX = groupX + (colSpace / 2) + 2;
          const bottomY = barChartH - barPaddingY;

          barChartHtml += `
            <!-- Income Bar -->
            <rect x="${incX}" y="${bottomY - incH}" width="${barW}" height="${Math.max(incH, 2)}" fill="#10B981" rx="3" />
            <!-- Expense Bar -->
            <rect x="${expX}" y="${bottomY - expH}" width="${barW}" height="${Math.max(expH, 2)}" fill="#FE5C73" rx="3" />
            
            <!-- Label -->
            <text x="${groupX + colSpace / 2}" y="${barChartH - 8}" text-anchor="middle" fill="#555" font-size="9" font-weight="bold">Tháng ${item.label}</text>
          `;
        });
      } else {
        barChartHtml += `<text x="${barChartW / 2}" y="${barChartH / 2}" text-anchor="middle" fill="#999" font-size="12">Không có dữ liệu 6 tháng qua</text>`;
      }

      barChartHtml += `
          </svg>
        </div>
      `;

      html += barChartHtml;

      // 2. Transaction List Table
      html += `
        <div style="margin-top: 40px; page-break-before: auto;">
           <h3 style="font-family:sans-serif; margin-bottom:20px; font-size:16px; color:#333; text-transform:uppercase;">DANH SÁCH GIAO DỊCH CHI TIẾT</h3>
           <table style="width:100%; border-collapse:collapse; font-family:sans-serif; font-size:11px;">
             <thead>
               <tr style="background:#E6E9F4; color:#343C6A;">
                 <th style="padding:12px 8px; text-align:left; border-bottom:2px solid #ddd;">Ngày</th>
                 <th style="padding:12px 8px; text-align:left; border-bottom:2px solid #ddd;">Tiêu đề</th>
                 <th style="padding:12px 8px; text-align:left; border-bottom:2px solid #ddd;">Danh mục</th>
                 <th style="padding:12px 8px; text-align:left; border-bottom:2px solid #ddd;">Ví</th>
                 <th style="padding:12px 8px; text-align:center; border-bottom:2px solid #ddd;">Loại</th>
                 <th style="padding:12px 8px; text-align:right; border-bottom:2px solid #ddd;">Số tiền</th>
                 <th style="padding:12px 8px; text-align:right; border-bottom:2px solid #ddd;">Quy đổi (${userData?.preference?.currency || 'VND'})</th>
               </tr>
             </thead>
             <tbody>
               ${txs.map((t: any) => {
                    let datePart = '';
                    const rawDate = t.transaction_date || t.date || '';
                    if (rawDate) {
                      const d = new Date(rawDate);
                      if (!isNaN(d.getTime())) {
                        const pad = (n: number) => String(n).padStart(2, '0');
                        datePart = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
                      } else {
                        datePart = rawDate;
                      }
                    }
                    
                    const note = t.title || t.description || t.note || '';
                    let categoryName = t.category?.name || t.category_name || 'Không phân mục';
                    const catIdStr = String(t.category_id || 'other');
                    const catInfoObj = categoriesMap[catIdStr];
                    if (catInfoObj && catInfoObj.parent_id) {
                      categoryName = catInfoObj.parent_name + ' - ' + categoryName;
                    }
                    const walletName = t.wallet?.name || t.wallet_name || 'Ví đã xóa';
                    const typeStr = t.type === 'income' ? 'Thu' : 'Chi';
                    
                    const originalCurrency = t.currency_code || t.wallet?.currency_code || 'VND';
                    const origAmountStr = formatCurrency(Number(t.amount) || 0, originalCurrency);

                    const convertedAmt = Number(t.amount_in_user_currency || t.amount) || 0;
                    const convertedStr = formatCurrency(convertedAmt);
                    
                    return `
                      <tr style="page-break-inside: avoid; break-inside: avoid;">
                        <td style="padding:10px 8px; border-bottom:1px solid #eee; color:#333;">${datePart}</td>
                        <td style="padding:10px 8px; border-bottom:1px solid #eee; color:#333; word-break: break-word; max-width: 250px;">${note}</td>
                        <td style="padding:10px 8px; border-bottom:1px solid #eee; color:#333;">${categoryName}</td>
                        <td style="padding:10px 8px; border-bottom:1px solid #eee; color:#333;">${walletName}</td>
                        <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:center; color:#333;">${typeStr}</td>
                        <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:right; color:#333;">${origAmountStr}</td>
                        <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:right; color:#333;">${convertedStr}</td>
                      </tr>
                    `;
               }).join('')}
               ${txs.length === 0 ? '<tr><td colspan="7" style="padding:20px; text-align:center; color:#999; border-bottom:1px solid #eee;">Không có giao dịch nào</td></tr>' : ''}
             </tbody>
           </table>
         </div>
       `;

        container.innerHTML = html;
        
        const opt = {
          margin:       0.5,
          filename:     'Bao_cao_chi_tieu_' + startDate + '_' + endDate + '.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
          pagebreak:    { mode: ['css', 'legacy'], avoid: 'tr' }
        };
        
        // @ts-ignore
        if (window.html2pdf) {
          // @ts-ignore
          window.html2pdf().set(opt).from(container).save().then(() => {
            setIsExporting(false);
            saveExportHistory(`Bao_cao_chi_tieu_${startDate}_${endDate}.pdf`, 'pdf', 'PDF File');
          });
        } else {
          alert("Thư viện xuất PDF chưa sẵn sàng, vui lòng đợi thêm 1 lát!");
          setIsExporting(false);
        }
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi xuất báo cáo!");
        setIsExporting(false);
      }
  };

  return (
    <div className="dashboard-container">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
      <Sidebar activeItem="reports" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar" style={{background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)',backdropFilter:'blur(16px)',position:'sticky',top:0,zIndex:10}}>
          <h1 className="page-title" style={{color:'var(--text-main)'}}>Thống kê & Báo cáo</h1>
          <div className="nav-actions">
            {isLoggedIn && (
              <Link href="/notifications" style={{background: '#F5F7FA', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb300', cursor: 'pointer', fontSize: '20px', textDecoration: 'none', position: 'relative', marginRight: '10px'}}>
                🔔
                {hasUnreadNotifications && unreadNotificationsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    minWidth: '16px',
                    height: '16px',
                    background: '#FE5C73',
                    color: '#fff',
                    borderRadius: '10px',
                    border: '2px solid #fff',
                    fontSize: '9px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px'
                  }}>
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>
            )}
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=EM&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold', marginLeft: '10px'}}>{t('login')}</Link>
            )}
          </div>
        </nav>
        
        <div className="content-area reports-fade-in">
          {/* Consolidated Global Filters Header */}
          <div className="reports-global-controls">
            <div className="momo-month-selector" style={{ margin: 0 }}>
              <button className="momo-month-btn" onClick={handlePrevMonth}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <div className="momo-month-display">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {getDisplayMonth()}
              </div>
              <button className="momo-month-btn" onClick={handleNextMonth}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <div className="reports-filter-dropdowns">
              <select 
                value={selectedWallet} 
                onChange={e => setSelectedWallet(e.target.value)} 
                disabled={!isLoggedIn} 
                className="report-select-compact"
              >
                <option value="">💳 Tất cả ví</option>
                {wallets?.map((w: any) => (
                  <option key={w.id} value={w.id}>{`${parseIcon(w.icon || '')} ${w.name}`.trim()}</option>
                ))}
              </select>

              {(activeTab === 'transactions' || activeTab === 'export') && (
                <>
                  <select 
                    value={selectedCategory} 
                    onChange={e => setSelectedCategory(e.target.value)} 
                    disabled={!isLoggedIn} 
                    className="report-select-compact"
                  >
                    <option value="">📂 Tất cả danh mục</option>
                    {categories?.map((c: any) => (
                      <optgroup key={c.id} label={`${parseIcon(c.icon || '')} ${c.name}`.trim()}>
                        <option value={c.id}>{`${parseIcon(c.icon || '')} ${c.name}`.trim()}</option>
                        {c.children?.map((child: any) => (
                          <option key={child.id} value={child.id}>-- {`${parseIcon(child.icon || '')} ${child.name}`.trim()}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  <select 
                    value={selectedType} 
                    onChange={e => setSelectedType(e.target.value)} 
                    disabled={!isLoggedIn} 
                    className="report-select-compact"
                  >
                    <option value="">🔄 Tất cả loại</option>
                    <option value="income">Thu nhập</option>
                    <option value="expense">Chi tiêu</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Tab Selection Bar */}
          <div className="reports-tab-bar">
            <button 
              className={`reports-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Thống kê
            </button>
            <button 
              className={`reports-tab-btn ${activeTab === 'balance_trend' ? 'active' : ''}`}
              onClick={() => setActiveTab('balance_trend')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Biến động số dư
            </button>
            <button 
              className={`reports-tab-btn ${activeTab === 'budgets' ? 'active' : ''}`}
              onClick={() => setActiveTab('budgets')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
              Ngân sách
            </button>
            <button 
              className={`reports-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Chi tiết giao dịch
            </button>
            <button 
              className={`reports-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Xuất báo cáo
            </button>
          </div>

          {/* TAB 1: ANALYTICS & INSIGHTS */}
          {activeTab === 'analytics' && (
            <div className="reports-fade-in">
              {selectedReportCategory ? (
                <div className="momo-category-detail-container">
                  {/* Momo-style Header Banner Card */}
                  <div className="momo-cat-header-card">
                    <div className="momo-cat-navbar">
                      <button className="momo-cat-back-btn" onClick={() => setSelectedReportCategory(null)} title="Quay lại">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      <h2 className="momo-cat-navbar-title">{selectedReportCategory.name}</h2>
                      <button className="momo-cat-home-btn" onClick={() => setSelectedReportCategory(null)} title="Trang chủ">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </button>
                    </div>
                    <div className="momo-cat-banner-content">
                      <div className="momo-cat-banner-subtitle">
                        {categoryTrendsData[categoryTrendsPeriodIdx] 
                          ? `Tháng ${categoryTrendsData[categoryTrendsPeriodIdx].month}/${categoryTrendsData[categoryTrendsPeriodIdx].year} ${reportType === 'expense' ? 'chi' : 'thu'}`
                          : `${getDisplayMonth()} ${reportType === 'expense' ? 'chi' : 'thu'}`}
                      </div>
                      <div className="momo-cat-banner-amount-row">
                        <span className="momo-cat-banner-amount">
                          {showAmount 
                            ? formatCurrencyLocal(categoryTrendsData[categoryTrendsPeriodIdx]?.amount ?? selectedReportCategory.amount) 
                            : '*********'}
                        </span>
                        <button className="momo-cat-eye-btn" onClick={() => setShowAmount(!showAmount)} title={showAmount ? "Ẩn số tiền" : "Hiện số tiền"}>
                          {showAmount ? '👁️' : '🙈'}
                        </button>
                      </div>
                      {categoryTrendsData.length > 0 && (
                        <div className="momo-cat-banner-avg-badge">
                          T.bình: {formatCurrencyLocal(categoryTrendsData.reduce((s, c) => s + c.amount, 0) / categoryTrendsData.length)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card: Xu hướng chi tiêu */}
                  <div className="momo-cat-card">
                    <h3 className="momo-cat-card-title">Xu hướng chi tiêu</h3>
                    <p className="momo-cat-card-subtext">Nhấn vào cột để lọc danh sách giao dịch bên dưới</p>
                    
                    {isLoadingCategoryTrends ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>Đang tải xu hướng...</div>
                    ) : categoryTrendsData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>Không có dữ liệu xu hướng.</div>
                    ) : (
                      <div className="momo-cat-chart-wrapper">
                        {(() => {
                          const maxVal = Math.max(...categoryTrendsData.map(c => c.amount), 100000);
                          const W = 500;
                          const H = 200;
                          const paddingLeft = 55;
                          const paddingRight = 25;
                          const paddingTop = 30;
                          const paddingBottom = 30;
                          const plotW = W - paddingLeft - paddingRight;
                          const plotH = H - paddingTop - paddingBottom;
                          
                          const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];
                          const avgSpent = categoryTrendsData.reduce((s, c) => s + c.amount, 0) / categoryTrendsData.length;
                          const avgY = H - paddingBottom - (avgSpent / maxVal) * plotH;
                          
                          return (
                            <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', maxWidth: '540px', margin: '0 auto', display: 'block' }}>
                              {/* Horizontal Gridlines & Y Labels */}
                              {yTicks.map((tick, i) => {
                                const y = H - paddingBottom - (tick / maxVal) * plotH;
                                return (
                                  <g key={i}>
                                    <line 
                                      x1={paddingLeft} 
                                      y1={y} 
                                      x2={W - paddingRight} 
                                      y2={y} 
                                      stroke="var(--border-color)" 
                                      strokeWidth="0.8" 
                                      strokeDasharray={tick === 0 ? "none" : "3 3"} 
                                    />
                                    <text 
                                      x={paddingLeft - 8} 
                                      y={y + 3} 
                                      textAnchor="end" 
                                      fill="#718EBF" 
                                      fontSize="9.5" 
                                      fontWeight="700"
                                    >
                                      {formatCurrencyShort(tick)}
                                    </text>
                                  </g>
                                );
                              })}
                              
                              <text x={paddingLeft - 8} y={paddingTop - 10} textAnchor="end" fill="#718EBF" fontSize="8.5" fontWeight="700">(Tr)</text>

                              {/* Dotted Average Line */}
                              <line x1={paddingLeft} y1={avgY} x2={W - paddingRight} y2={avgY} stroke="#F2994A" strokeWidth="1.5" strokeDasharray="3 3" />
                              <text x={W - paddingRight} y={avgY - 4} textAnchor="end" fill="#F2994A" fontSize="9" fontWeight="800">T.bình</text>

                              {/* Bars */}
                              {categoryTrendsData.map((c, i) => {
                                const barW = 32;
                                const barH = (c.amount / maxVal) * plotH;
                                const x = paddingLeft + (i + 0.5) * (plotW / 4);
                                const barX = x - barW / 2;
                                const barY = H - paddingBottom - barH;
                                const isActive = categoryTrendsPeriodIdx === i;
                                const fillUrl = isActive ? '#5843E0' : '#D2D0F9';
                                
                                return (
                                  <g key={i} style={{ cursor: 'pointer' }} onClick={() => setCategoryTrendsPeriodIdx(i)}>
                                    {/* Invisible hit box for easier clicking */}
                                    <rect 
                                      x={x - (plotW / 4) / 2} 
                                      y={paddingTop} 
                                      width={plotW / 4} 
                                      height={plotH} 
                                      fill="transparent" 
                                    />
                                    {/* Month Bar */}
                                    <rect 
                                      x={barX} 
                                      y={barY} 
                                      width={barW} 
                                      height={Math.max(barH, 3)} 
                                      rx="6" 
                                      ry="6" 
                                      fill={fillUrl} 
                                      style={{ transition: 'all 0.3s ease' }}
                                    />
                                    {/* X Label */}
                                    <text 
                                      x={x} 
                                      y={H - 12} 
                                      textAnchor="middle" 
                                      fill={isActive ? '#5843E0' : '#718EBF'} 
                                      fontSize="11" 
                                      fontWeight="800"
                                    >
                                      {c.label}
                                    </text>
                                    
                                    {/* Floating Tooltip/Badge on active column */}
                                    {isActive && (
                                      <g pointerEvents="none">
                                        <rect 
                                          x={x - 28} 
                                          y={barY - 28} 
                                          width="56" 
                                          height="18" 
                                          rx="5" 
                                          fill="#1f2937" 
                                        />
                                        <polygon 
                                          points={`${x - 4},${barY - 10} ${x + 4},${barY - 10} ${x},${barY - 5}`} 
                                          fill="#1f2937" 
                                        />
                                        <text 
                                          x={x} 
                                          y={barY - 16} 
                                          fill="#fff" 
                                          fontSize="9" 
                                          fontWeight="800" 
                                          textAnchor="middle"
                                        >
                                          {formatCurrencyShort(c.amount)}
                                        </text>
                                      </g>
                                    )}
                                  </g>
                                );
                              })}
                            </svg>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Suggestions Section "Gợi ý cho bạn" */}
                  <div className="momo-suggestion-row">
                    <div className="momo-suggestion-icon">...</div>
                    <div className="momo-suggestion-bubble">
                      {(() => {
                        const prevMonths = categoryTrendsData.slice(0, 3);
                        const prevAvg = prevMonths.reduce((s, c) => s + c.amount, 0) / (prevMonths.length || 1);
                        const currentMonthAmount = categoryTrendsData[3]?.amount || 0;
                        const diffPercent = prevAvg > 0 ? ((currentMonthAmount - prevAvg) / prevAvg) * 100 : 0;
                        
                        return `👀 Chi tiêu danh mục ${selectedReportCategory.name} tháng này ${diffPercent >= 0 ? 'cao hơn' : 'thấp hơn'} ${Math.abs(diffPercent).toFixed(0)}% so với trung bình 3 tháng qua.`;
                      })()}
                    </div>
                  </div>

                  {/* Card: Danh sách giao dịch */}
                  <div className="momo-cat-card" style={{ marginTop: '20px' }}>
                    <div className="momo-tab-controls">
                      {[
                        { key: 'all', label: `Tất cả (${categoryTrendsData[categoryTrendsPeriodIdx]?.transactions?.length ?? 0})` },
                        { key: 'top_spent', label: 'Top chi tiêu' },
                        { key: 'top_recipients', label: 'Top người nhận' }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          className={`momo-tab-btn ${categoryDetailTab === tab.key ? 'active' : ''}`}
                          onClick={() => setCategoryDetailTab(tab.key as any)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab contents */}
                    {(() => {
                      const monthData = categoryTrendsData[categoryTrendsPeriodIdx];
                      const txsList = monthData?.transactions ?? [];

                      if (txsList.length === 0) {
                        return <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>Không có giao dịch nào trong tháng này.</div>;
                      }

                      if (categoryDetailTab === 'all') {
                        // Group by date
                        const groups: Record<string, any[]> = {};
                        txsList.forEach((tx: any) => {
                          let dateStr = tx.transaction_date;
                          if (!dateStr && tx.created_at) dateStr = tx.created_at.split('T')[0];
                          
                          let formattedDate = 'Không rõ ngày';
                          if (dateStr) {
                            const d = new Date(dateStr);
                            const pad = (n: number) => String(n).padStart(2, '0');
                            formattedDate = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                          }
                          
                          if (!groups[formattedDate]) groups[formattedDate] = [];
                          groups[formattedDate].push(tx);
                        });

                        return (
                          <div>
                            {Object.keys(groups).map(dateKey => (
                              <div key={dateKey}>
                                <div className="momo-tx-group-header">{dateKey}</div>
                                {groups[dateKey].map((tx: any) => {
                                  const timeStr = tx.transaction_date 
                                    ? new Date(tx.transaction_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                    : '';
                                  const walletName = wallets.find(w => w.id === tx.wallet_id)?.name || 'Ví của tôi';
                                  
                                  return (
                                    <div key={tx.id} className="momo-tx-list-item">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="momo-tx-icon-circle">
                                          {parseIcon(selectedReportCategory.icon)}
                                        </div>
                                        <div className="momo-tx-details">
                                          <div className="momo-tx-title">{tx.title || tx.description || 'Giao dịch'}</div>
                                          <div className="momo-tx-subtext">
                                            {selectedReportCategory.name} {timeStr ? `• ${timeStr}` : ''} • {walletName}
                                          </div>
                                        </div>
                                      </div>
                                      <div className={`momo-tx-amount ${tx.type}`}>
                                        {tx.type === 'expense' ? '-' : '+'}{formatCurrencyLocal(tx.amount)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      if (categoryDetailTab === 'top_spent') {
                        const sorted = [...txsList].sort((a, b) => {
                          const amtA = Math.abs(parseFloat(a.amount || 0));
                          const amtB = Math.abs(parseFloat(b.amount || 0));
                          return amtB - amtA;
                        });

                        return (
                          <div>
                            {sorted.map((tx: any, idx) => {
                              const timeStr = tx.transaction_date 
                                ? new Date(tx.transaction_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                : '';
                              const walletName = wallets.find(w => w.id === tx.wallet_id)?.name || 'Ví của tôi';
                              
                              return (
                                <div key={tx.id} className="momo-tx-list-item">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#718EBF', width: '20px' }}>{idx + 1}</div>
                                    <div className="momo-tx-icon-circle">
                                      {parseIcon(selectedReportCategory.icon)}
                                    </div>
                                    <div className="momo-tx-details">
                                      <div className="momo-tx-title">{tx.title || tx.description || 'Giao dịch'}</div>
                                      <div className="momo-tx-subtext">
                                        {selectedReportCategory.name} {timeStr ? `• ${timeStr}` : ''} • {walletName}
                                      </div>
                                    </div>
                                  </div>
                                  <div className={`momo-tx-amount ${tx.type}`}>
                                    {tx.type === 'expense' ? '-' : '+'}{formatCurrencyLocal(tx.amount)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      if (categoryDetailTab === 'top_recipients') {
                        // Group by payee
                        const payeesMap: Record<string, { name: string; amount: number; count: number }> = {};
                        txsList.forEach((tx: any) => {
                          const payeeName = tx.payee?.payee_name || tx.sender?.name || tx.title || 'UNKNOWN RECIPIENT';
                          const amt = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
                          if (!payeesMap[payeeName]) {
                            payeesMap[payeeName] = { name: payeeName, amount: 0, count: 0 };
                          }
                          payeesMap[payeeName].amount += amt;
                          payeesMap[payeeName].count += 1;
                        });
                        const payeesList = Object.values(payeesMap).sort((a, b) => b.amount - a.amount);

                        return (
                          <div>
                            {payeesList.map((item, idx) => (
                              <div key={item.name} className="momo-tx-list-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ fontWeight: 'bold', color: '#718EBF', width: '20px' }}>{idx + 1}</div>
                                  <div className="momo-tx-icon-circle" style={{ background: '#E6E8FA', color: '#5843E0' }}>
                                    👤
                                  </div>
                                  <div className="momo-tx-details">
                                    <div className="momo-tx-title">{item.name}</div>
                                    <div className="momo-tx-subtext">{item.count} giao dịch</div>
                                  </div>
                                </div>
                                <div className="momo-tx-amount expense">
                                  -{formatCurrencyLocal(item.amount)}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>
                </div>
              ) : (
                <div className="momo-stats-card">
                <div className="momo-stats-header">
                  <h2 className="momo-stats-title">Tình hình thu chi</h2>
                  <div className="momo-view-toggle">
                    <button 
                      className={`momo-view-btn ${viewMode === 'allocation' ? 'active' : ''}`}
                      onClick={() => setViewMode('allocation')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                      Phân bổ
                    </button>
                    <button 
                      className={`momo-view-btn ${viewMode === 'trend' ? 'active' : ''}`}
                      onClick={() => setViewMode('trend')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                      Xu hướng
                    </button>
                  </div>
                </div>

                <div className="momo-type-toggle">
                  <div 
                    className={`momo-type-card ${reportType === 'income' ? 'income-active' : ''}`}
                    onClick={() => setReportType('income')}
                  >
                    <div className="momo-type-title">
                      Thu nhập 
                      {currentSummary.income > prevSummary.income ? <span className="trend-arrow up">↓</span> : <span className="trend-arrow down">↑</span>}
                    </div>
                    <div className="momo-type-amount">{formatCurrency(currentSummary.income)}</div>
                  </div>
                  <div 
                    className={`momo-type-card ${reportType === 'expense' ? 'expense-active' : ''}`}
                    onClick={() => setReportType('expense')}
                  >
                    <div className="momo-type-title">
                      Chi tiêu 
                      {currentSummary.expense > prevSummary.expense ? <span className="trend-arrow up">↑</span> : <span className="trend-arrow down">↓</span>}
                    </div>
                    <div className="momo-type-amount">{formatCurrency(currentSummary.expense)}</div>
                  </div>
                </div>

                <div className="momo-comparison-banner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#2D9CDB" stroke="none"><rect x="4" y="14" width="4" height="6"></rect><rect x="10" y="8" width="4" height="12"></rect><rect x="16" y="2" width="4" height="18"></rect></svg>
                  <span>
                    {(() => {
                      const curr = reportType === 'expense' ? currentSummary.expense : currentSummary.income;
                      const prev = reportType === 'expense' ? prevSummary.expense : prevSummary.income;
                      const diff = curr - prev;
                      if (diff > 0) return `Tăng ${formatCurrency(diff)} so với cùng kỳ tháng trước`;
                      if (diff < 0) return `Giảm ${formatCurrency(Math.abs(diff))} so với cùng kỳ tháng trước`;
                      return 'Tương đương với cùng kỳ tháng trước';
                    })()}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: 'auto'}}><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>

                {viewMode === 'allocation' && (
                  <>
                    {/* Switch Category vs Wallet Allocation */}
                    <div className="momo-sub-toggle">
                      <button 
                        className={`momo-sub-toggle-btn ${allocationType === 'category' ? 'active' : ''}`}
                        onClick={() => setAllocationType('category')}
                      >
                        📂 Theo danh mục
                      </button>
                      <button 
                        className={`momo-sub-toggle-btn ${allocationType === 'wallet' ? 'active' : ''}`}
                        onClick={() => setAllocationType('wallet')}
                      >
                        💳 Theo ví / tài khoản
                      </button>
                    </div>

                    <div className="momo-chart-container">
                      {(() => {
                        let currentPercentage = 0;
                        let svgCircles: any[] = [];
                        const C = 2 * Math.PI * 90;
                        const totalAmt = reportType === 'expense' ? currentSummary.expense : currentSummary.income;
                        const dataItems = allocationType === 'category' ? topCategories : topWallets;

                        if (dataItems.length > 0) {
                          const safeColors = ['#1814F3', '#10B981', '#FE5C73', '#FBBF24', '#A78BFA', '#F472B6', '#FB923C'];
                          const isValidColor = (col: string) => {
                            if (!col) return false;
                            const c = col.trim().toLowerCase();
                            if (['white', '#fff', '#ffffff', 'transparent', 'none', 'null', 'undefined'].includes(c)) return false;
                            if (c.startsWith('#') && [4, 7, 9].includes(c.length)) return true;
                            if (c.startsWith('rgb') || c.startsWith('hsl')) return true;
                            if (/^[a-z]+$/.test(c)) return true;
                            return false;
                          };

                          dataItems.forEach((c, i) => {
                            const dashValue = (c.percentage * C) / 100;
                            const gapValue = C - dashValue;
                            const dashArray = `${dashValue} ${gapValue}`;
                            const dashOffset = -(currentPercentage * C) / 100;
                            
                            const safeStroke = isValidColor(c.color) ? c.color : safeColors[i % safeColors.length];
                            
                            svgCircles.push(
                              <circle 
                                key={i} 
                                cx="120" cy="120" r="90" 
                                fill="transparent" 
                                stroke={safeStroke} 
                                strokeWidth={hoveredCategory === i ? "45" : "40"} 
                                strokeDasharray={dashArray} 
                                strokeDashoffset={dashOffset}
                                onMouseEnter={() => setHoveredCategory(i)}
                                onMouseLeave={() => setHoveredCategory(null)}
                                style={{ fill: 'transparent', transition: 'all 0.3s ease', cursor: 'pointer', opacity: hoveredCategory !== null && hoveredCategory !== i ? 0.25 : 1 }}
                              />
                            );
                            currentPercentage += c.percentage;
                          });
                        } else {
                          svgCircles.push(<circle key="empty" cx="120" cy="120" r="90" fill="transparent" stroke="#f0f0f0" strokeWidth="40" style={{ fill: 'transparent' }} />);
                        }

                        const hoveredItem = hoveredCategory !== null ? dataItems[hoveredCategory] : null;

                        return (
                          <div style={{ position: 'relative', width: '240px', height: '240px', margin: '15px auto' }}>
                            <svg width="240" height="240" viewBox="0 0 240 240" style={{ width: '240px', height: '240px', transform: 'rotate(-90deg)' }}>
                              {svgCircles}
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '140px' }}>
                              {hoveredItem ? (
                                <>
                                  <div style={{ fontSize: '12px', color: hoveredItem.color || '#FE5C73', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase', fontWeight: 'bold' }}>{hoveredItem.name}</div>
                                  <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '2px' }}>{formatCurrency(hoveredItem.amount)}</div>
                                  <div style={{ fontSize: '14px', color: '#718EBF' }}>{hoveredItem.percentage.toFixed(1)}%</div>
                                </>
                              ) : (
                                <>
                                  <div style={{ fontSize: '13px', color: '#718EBF', marginBottom: '4px' }}>Tổng {reportType === 'expense' ? 'chi' : 'thu'}</div>
                                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{formatCurrency(totalAmt)}</div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/* Combined Daily Trend Line Chart (Dual-line) */}
                {viewMode === 'trend' && (() => {
                  const W = Math.max(800, dailyData.length * 35);
                  const H = 220;
                  const paddingY = 40;
                  const safeMax = maxDailyAmt || 1;
                  const points = dailyData.map((d, i) => {
                    const x = (i / Math.max(1, dailyData.length - 1)) * (W - 40) + 20;
                    const yIncome = H - paddingY - (d.income / safeMax) * (H - paddingY * 2);
                    const yExpense = H - paddingY - (d.expense / safeMax) * (H - paddingY * 2);
                    return { x, yIncome, yExpense, day: d.day, date: d.date, income: d.income, expense: d.expense };
                  });

                  // Curved path for Income
                  let pathIncomeD = '';
                  if (points.length > 0) {
                    pathIncomeD = `M ${points[0].x},${points[0].yIncome}`;
                    for (let i = 0; i < points.length - 1; i++) {
                      const curr = points[i];
                      const next = points[i + 1];
                      const cp1x = curr.x + (next.x - curr.x) / 2;
                      const cp2x = curr.x + (next.x - curr.x) / 2;
                      pathIncomeD += ` C ${cp1x},${curr.yIncome} ${cp2x},${next.yIncome} ${next.x},${next.yIncome}`;
                    }
                  }

                  // Curved path for Expense
                  let pathExpenseD = '';
                  if (points.length > 0) {
                    pathExpenseD = `M ${points[0].x},${points[0].yExpense}`;
                    for (let i = 0; i < points.length - 1; i++) {
                      const curr = points[i];
                      const next = points[i + 1];
                      const cp1x = curr.x + (next.x - curr.x) / 2;
                      const cp2x = curr.x + (next.x - curr.x) / 2;
                      pathExpenseD += ` C ${cp1x},${curr.yExpense} ${cp2x},${next.yExpense} ${next.x},${next.yExpense}`;
                    }
                  }

                  const fillIncomePathD = points.length > 0 
                    ? `${pathIncomeD} L ${points[points.length - 1].x},${H} L ${points[0].x},${H} Z`
                    : '';

                  const fillExpensePathD = points.length > 0 
                    ? `${pathExpenseD} L ${points[points.length - 1].x},${H} L ${points[0].x},${H} Z`
                    : '';

                  const hoveredPoint = hoveredDay !== null ? points.find(p => p.day === hoveredDay) : null;

                  return (
                    <div className="momo-line-chart-container">
                      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }}></span>
                          <span style={{ color: 'var(--text-main)' }}>Thu nhập</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#FE5C73' }}></span>
                          <span style={{ color: 'var(--text-main)' }}>Chi tiêu</span>
                        </div>
                      </div>
                      <div className="momo-line-scroll-area">
                        <div style={{ position: 'relative', width: W, height: H }}>
                          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H, overflow: 'visible' }}>
                            <defs>
                              <linearGradient id="income-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                              </linearGradient>
                              <linearGradient id="expense-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FE5C73" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#FE5C73" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            
                            <line x1="0" y1={paddingY} x2={W} y2={paddingY} stroke="var(--border-color)" strokeDasharray="4 4" />
                            <line x1="0" y1={H - paddingY} x2={W} y2={H - paddingY} stroke="var(--border-color)" strokeDasharray="4 4" />

                            {fillIncomePathD && (
                              <path d={fillIncomePathD} fill="url(#income-gradient)" />
                            )}
                            {fillExpensePathD && (
                              <path d={fillExpensePathD} fill="url(#expense-gradient)" />
                            )}

                            {hoveredPoint && (
                              <line 
                                x1={hoveredPoint.x} y1={Math.min(hoveredPoint.yIncome, hoveredPoint.yExpense)} 
                                x2={hoveredPoint.x} y2={H} 
                                stroke="var(--border-color)" 
                                strokeWidth="1.5" 
                                strokeDasharray="4 4" 
                                opacity="0.6"
                              />
                            )}

                            {pathIncomeD && (
                              <path d={pathIncomeD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            )}
                            {pathExpenseD && (
                              <path d={pathExpenseD} fill="none" stroke="#FE5C73" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            )}

                            {points.map((p, i) => (
                              <g key={i}>
                                {p.income > 0 && (
                                  <circle cx={p.x} cy={p.yIncome} r="4.5" fill="#fff" stroke="#10B981" strokeWidth="2.5" />
                                )}
                                {p.expense > 0 && (
                                  <circle cx={p.x} cy={p.yExpense} r="4.5" fill="#fff" stroke="#FE5C73" strokeWidth="2.5" />
                                )}
                                <rect 
                                  x={p.x - 17.5} y={0} width="35" height={H} 
                                  fill="transparent" 
                                  onMouseEnter={() => setHoveredDay(p.day)}
                                  onMouseLeave={() => setHoveredDay(null)}
                                  style={{ cursor: 'pointer' }}
                                />
                              </g>
                            ))}
                          </svg>

                          {hoveredPoint && (
                            <div className="momo-line-tooltip" style={{ 
                              left: hoveredPoint.x, 
                              top: Math.min(hoveredPoint.yIncome, hoveredPoint.yExpense) - 15,
                              position: 'absolute',
                              background: '#1f2937',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                              zIndex: 10,
                              color: '#fff',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              transform: 'translate(-50%, -100%)',
                              pointerEvents: 'none'
                            }}>
                              <div className="momo-line-tooltip-date" style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>Ngày {hoveredPoint.day}</div>
                              <div style={{ color: '#10B981', display: 'flex', gap: '8px', fontSize: '12px', justifyContent: 'space-between' }}>
                                <span>Thu:</span> <span>+{formatCurrency(hoveredPoint.income)}</span>
                              </div>
                              <div style={{ color: '#FE5C73', display: 'flex', gap: '8px', fontSize: '12px', justifyContent: 'space-between' }}>
                                <span>Chi:</span> <span>-{formatCurrency(hoveredPoint.expense)}</span>
                              </div>
                              <div style={{ 
                                color: hoveredPoint.income - hoveredPoint.expense >= 0 ? '#10B981' : '#FE5C73', 
                                display: 'flex', 
                                gap: '8px', 
                                fontSize: '12px', 
                                borderTop: '1px solid #4b5563', 
                                paddingTop: '4px', 
                                marginTop: '4px', 
                                fontWeight: 'bold',
                                justifyContent: 'space-between'
                              }}>
                                <span>Ròng:</span> <span>{hoveredPoint.income - hoveredPoint.expense >= 0 ? '+' : ''}{formatCurrency(hoveredPoint.income - hoveredPoint.expense)}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="momo-line-axis">
                            {points.map((p, i) => {
                              if (p.day === 1 || p.day % 5 === 0 || p.day === points.length) {
                                return (
                                  <div key={i} style={{ position: 'absolute', left: p.x, transform: 'translateX(-50%)' }}>
                                    Ngày {p.day}
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {viewMode === 'trend' && reportType === 'expense' && abnormalDays.length > 0 && abnormalDays[0].avg > 0 && (
                  <div style={{
                    background: 'rgba(254, 92, 115, 0.08)',
                    border: '1px solid rgba(254, 92, 115, 0.3)',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '20px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    animation: 'listSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                  }}>
                    <div style={{ fontSize: '24px' }}>🚨</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#FE5C73', marginBottom: '4px' }}>Cảnh báo chi tiêu bất thường</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                        Phát hiện <strong>{abnormalDays.length} ngày</strong> chi tiêu vượt xa mức trung bình. Đáng chú ý là Ngày {abnormalDays[0].day} bạn đã chi {formatCurrencyLocal(abnormalDays[0].amount)} (gấp ${(abnormalDays[0].amount / abnormalDays[0].avg).toFixed(1)} lần mức trung bình {formatCurrencyLocal(abnormalDays[0].avg)}/ngày).
                      </div>
                    </div>
                  </div>
                )}

                <div className="momo-top-list">
                  {isLoadingTopCategories || isLoadingTopWallets ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>Đang tải dữ liệu...</div>
                  ) : (allocationType === 'category' ? topCategories : topWallets).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>Không có dữ liệu trong tháng này.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {(allocationType === 'category' ? topCategories : topWallets).map((cat, idx) => {
                        const budgetLimit = allocationType === 'category' ? (budgetMap[cat.id] || 0) : 0;
                        const isOverBudget = reportType === 'expense' && budgetLimit > 0 && cat.amount > budgetLimit;
                        const progressPct = reportType === 'expense' && budgetLimit > 0 ? Math.min((cat.amount / budgetLimit) * 100, 100) : cat.percentage;
                        
                        return (
                          <div 
                            className="momo-list-item-card" 
                            key={`${reportType}-${cat.id}-${idx}`} 
                            onMouseEnter={() => setHoveredCategory(idx)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '8px',
                              padding: '12px 16px',
                              borderRadius: '16px',
                              background: hoveredCategory === idx ? 'var(--card-bg)' : (isOverBudget ? 'rgba(254, 92, 115, 0.05)' : 'var(--bg-color)'),
                              border: hoveredCategory === idx ? `1px solid ${cat.color || '#FE5C73'}` : (isOverBudget ? '1px solid rgba(254, 92, 115, 0.2)' : '1px solid transparent'),
                              boxShadow: hoveredCategory === idx ? `0 8px 20px ${cat.color ? cat.color + '26' : 'rgba(254, 92, 115, 0.15)'}` : 'none',
                              opacity: listVisible ? 1 : 0,
                              transform: listVisible ? (hoveredCategory === idx ? 'translateY(0) scale(1.03)' : 'translateY(0) scale(1)') : 'translateY(20px)',
                              transition: listVisible ? 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s`,
                              cursor: 'pointer',
                              zIndex: hoveredCategory === idx ? 10 : 1,
                              position: 'relative'
                            }}
                            onClick={() => {
                              if (allocationType === 'category') {
                                setSelectedReportCategory(cat);
                              }
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="momo-list-item-icon" style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '12px',
                                  background: cat.color ? `${cat.color}1A` : 'rgba(113, 142, 191, 0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '20px',
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                }}>
                                  {parseIcon(cat.icon)}
                                </div>
                                <div>
                                  <div style={{ fontSize: '15px', fontWeight: '700', color: hoveredCategory === idx ? (cat.color || 'var(--text-main)') : 'var(--text-main)', transition: 'color 0.3s ease' }}>{cat.name}</div>
                                  {reportType === 'expense' && budgetLimit > 0 ? (
                                    <div style={{ fontSize: '12px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                                      Ngân sách: {formatCurrency(budgetLimit)}
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '12px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                                      Chiếm {cat.percentage.toFixed(1)}%
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '15px', fontWeight: '800', color: isOverBudget ? '#FE5C73' : (reportType === 'income' ? '#10B981' : 'var(--text-main)') }}>
                                    {formatCurrency(cat.amount)}
                                  </div>
                                  {isOverBudget && (
                                    <div className="momo-badge-pulse" style={{ fontSize: '11px', color: '#fff', background: '#FE5C73', padding: '2px 6px', borderRadius: '8px', display: 'inline-block', marginTop: '4px', fontWeight: 'bold' }}>
                                      Chi lố {formatCurrency(cat.amount - budgetLimit)}
                                    </div>
                                  )}
                                </div>
                                {hoveredCategory === idx && (
                                  <div style={{ color: cat.color || '#FE5C73', fontSize: '18px', fontWeight: 'bold', marginLeft: '4px', transform: 'translateX(2px)' }}>
                                    ›
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div style={{
                              width: '100%',
                              height: '6px',
                              background: 'var(--border-color)',
                              borderRadius: '3px',
                              marginTop: '4px',
                              overflow: 'hidden',
                              position: 'relative'
                            }}>
                              <div style={{
                                width: listVisible ? `${progressPct}%` : '0%',
                                height: '100%',
                                background: isOverBudget ? 'linear-gradient(90deg, #FF6B81 0%, #FE5C73 100%)' : (cat.color || (reportType === 'expense' ? '#718EBF' : '#10B981')),
                                borderRadius: '3px',
                                transition: `width 1s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05 + 0.1}s`
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FINANCIAL INSIGHTS & SUGGESTIONS */}
              {isLoadingInsights && (
                <div className="insights-container" style={{ opacity: 0.6 }}>
                  <div style={{ textAlign: 'center', color: '#718EBF', fontWeight: '500', padding: '20px' }}>
                    Đang phân tích dữ liệu tài chính...
                  </div>
                </div>
              )}

              {isLoggedIn && !isLoadingInsights && insights && (
                <div className="insights-container">
                  <div className="insights-header">
                    <h2 className="insights-title">
                      <span style={{ fontSize: '22px' }}>💡</span>
                      Gợi ý & Phân tích tài chính
                    </h2>
                  </div>

                  {insights.exceededText && (
                    <div style={{
                      background: 'rgba(254, 92, 115, 0.08)',
                      border: '1px solid rgba(254, 92, 115, 0.3)',
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '20px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      animation: 'listSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}>
                      <div style={{ fontSize: '24px' }}>⚠️</div>
                      <div style={{ fontSize: '13px', color: '#FE5C73', fontWeight: '700', lineHeight: '1.5' }}>
                        {insights.exceededText}
                      </div>
                    </div>
                  )}
                  
                  <div className="insights-grid">
                    {/* CARD 1: OVERVIEW */}
                    <div className="insight-card">
                      <div className="insight-card-header">
                        <div className="insight-card-title-group">
                          <div className="insight-icon" style={{ background: 'rgba(24, 20, 243, 0.08)', color: '#1814F3' }}>📊</div>
                          <span className="insight-card-label">Tổng quan thu chi</span>
                        </div>
                        <span className={`insight-badge ${insights.overviewStatus}`}>
                          {insights.overviewStatus === 'surplus' ? 'Thặng dư' : 'Thâm hụt'}
                        </span>
                      </div>
                      <div>
                        <div className="insight-value" style={{ color: insights.overviewStatus === 'surplus' ? '#10B981' : '#FE5C73' }}>
                          {insights.overviewStatus === 'surplus' ? '+' : '-'}{formatCurrency(Math.abs(currentSummary.income - currentSummary.expense))}
                        </div>
                        <p className="insight-desc">{insights.overviewText}</p>
                      </div>
                    </div>

                    {/* CARD 2: SAVING RATE */}
                    <div className="insight-card">
                      <div className="insight-card-header">
                        <div className="insight-card-title-group">
                          <div className="insight-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10B981' }}>🐷</div>
                          <span className="insight-card-label">Tỷ lệ tiết kiệm</span>
                        </div>
                        <span className={`insight-badge ${insights.savingRateStatus}`}>
                          {insights.savingRateStatus === 'excellent' ? 'Xuất sắc' : insights.savingRateStatus === 'good' ? 'Tốt' : insights.savingRateStatus === 'fair' ? 'Tạm ổn' : 'Cảnh báo'}
                        </span>
                      </div>
                      <div>
                        <div className="insight-value">{insights.savingRate.toFixed(1)}%</div>
                        <div className="saving-progress-container">
                          <div className={`saving-progress-bar ${insights.savingRateStatus}`} style={{ width: `${Math.max(0, Math.min(100, insights.savingRate))}%` }} />
                        </div>
                        <p className="insight-desc">{insights.savingRateCommentary}</p>
                      </div>
                    </div>

                    {/* CARD 3: COMPARISON WITH PREVIOUS MONTH */}
                    <div className="insight-card">
                      <div className="insight-card-header">
                        <div className="insight-card-title-group">
                          <div className="insight-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#F59E0B' }}>📅</div>
                          <span className="insight-card-label">So với kỳ trước</span>
                        </div>
                      </div>
                      <div>
                        <p className="insight-desc">{insights.comparisonText}</p>
                        <div className="insight-trend-row">
                          <div className="trend-pill">
                            <span className="trend-pill-label">Thu nhập</span>
                            <span className="trend-pill-value" style={{ color: insights.comparisonIncomeChangePct >= 0 ? '#10B981' : '#FE5C73' }}>
                              {insights.comparisonIncomeChangePct >= 0 ? '↑' : '↓'} {Math.abs(insights.comparisonIncomeChangePct).toFixed(1)}%
                            </span>
                          </div>
                          <div className="trend-pill">
                            <span className="trend-pill-label">Chi tiêu</span>
                            <span className="trend-pill-value" style={{ color: insights.comparisonExpenseChangePct >= 0 ? '#FE5C73' : '#10B981' }}>
                              {insights.comparisonExpenseChangePct >= 0 ? '↑' : '↓'} {Math.abs(insights.comparisonExpenseChangePct).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD 4: MTD COMPARISON */}
                    <div className="insight-card">
                      <div className="insight-card-header">
                        <div className="insight-card-title-group">
                          <div className="insight-icon" style={{ background: 'rgba(45, 156, 219, 0.08)', color: '#2D9CDB' }}>⚡</div>
                          <span className="insight-card-label">Tốc độ tiêu dùng (MTD)</span>
                        </div>
                        {insights.mtdStatus !== 'none' && (
                          <span className={`insight-badge ${insights.mtdStatus === 'decrease' ? 'excellent' : insights.mtdStatus === 'increase' ? 'warning' : 'good'}`}>
                            {insights.mtdStatus === 'decrease' ? 'Tốt' : insights.mtdStatus === 'increase' ? 'Nhanh hơn' : 'Ổn định'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="insight-desc">{insights.mtdComparisonText}</p>
                      </div>
                    </div>

                    {/* CARD 5: FORECAST & SMART ALERTS */}
                    <div className="insight-card" style={{
                      gridColumn: '1 / -1', 
                      background: insights.forecastStatus === 'exceeded' 
                        ? 'rgba(254, 92, 115, 0.04)' 
                        : (insights.forecastStatus === 'warning' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(16, 185, 129, 0.04)'),
                      border: insights.forecastStatus === 'exceeded'
                        ? '1px solid rgba(254, 92, 115, 0.25)'
                        : (insights.forecastStatus === 'warning' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)')
                    }}>
                      <div className="insight-card-header">
                        <div className="insight-card-title-group">
                          <div className="insight-icon" style={{ 
                            background: insights.forecastStatus === 'exceeded' 
                              ? 'rgba(254, 92, 115, 0.1)' 
                              : (insights.forecastStatus === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'), 
                            color: insights.forecastStatus === 'exceeded' 
                              ? '#FE5C73' 
                              : (insights.forecastStatus === 'warning' ? '#F59E0B' : '#10B981')
                          }}>🔮</div>
                          <span className="insight-card-label" style={{ color: 'var(--text-main)' }}>Dự báo chi tiêu & Cảnh báo thông minh</span>
                        </div>
                        <span className={`insight-badge ${insights.forecastStatus === 'exceeded' ? 'deficit' : (insights.forecastStatus === 'warning' ? 'fair' : 'excellent')}`}>
                          {insights.forecastStatus === 'exceeded' ? 'Cảnh báo đỏ' : (insights.forecastStatus === 'warning' ? 'Cảnh báo vàng' : 'An toàn')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', marginTop: '10px' }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                          <p className="insight-desc" style={{ fontSize: '13.5px', lineHeight: '1.6', fontWeight: '600' }}>
                            {insights.forecastCommentary}
                          </p>
                          {insights.isCurrentMonth && (
                            <div style={{ fontSize: '12.5px', color: '#718EBF', marginTop: '6px', fontWeight: '500' }}>
                              * Tính toán dựa trên mức chi tiêu trung bình {formatCurrencyLocal(insights.forecastedExpense / insights.totalDaysInMonth)}/ngày trong {new Date().getDate()} ngày qua của tháng này.
                            </div>
                          )}
                        </div>
                        {insights.totalBudgetLimit > 0 && (
                          <div style={{ width: '100%', maxWidth: '280px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#718EBF', marginBottom: '8px' }}>
                              <span>Dự báo chi tiêu</span>
                              <span>Hạn mức tổng</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>
                              <span style={{ color: insights.forecastStatus === 'exceeded' ? '#FE5C73' : (insights.forecastStatus === 'warning' ? '#F59E0B' : 'var(--text-main)') }}>
                                {formatCurrencyLocal(insights.forecastedExpense)}
                              </span>
                              <span style={{ color: 'var(--text-main)' }}>{formatCurrencyLocal(insights.totalBudgetLimit)}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                              <div style={{ 
                                width: `${Math.min(100, insights.forecastPct)}%`, 
                                height: '100%', 
                                background: insights.forecastStatus === 'exceeded' ? '#FE5C73' : (insights.forecastStatus === 'warning' ? '#F59E0B' : '#10B981'),
                                borderRadius: '4px',
                                transition: 'width 1s ease'
                              }} />
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 'bold', color: '#718EBF', marginTop: '6px' }}>
                              Đã sử dụng dự kiến: {insights.forecastPct.toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6-Month Historical Income vs Expense Bar Chart */}
              <div className="momo-stats-card" style={{ marginTop: '24px' }}>
                <div className="momo-stats-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <h2 className="momo-stats-title">
                    <span style={{ marginRight: '8px' }}>📊</span>
                    Xu hướng thu chi 6 tháng qua
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#10B981' }}></span>
                      <span style={{ color: 'var(--text-light)' }}>Thu nhập</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: '#FE5C73' }}></span>
                      <span style={{ color: 'var(--text-light)' }}>Chi tiêu</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '3px', background: '#2D60FF', borderRadius: '2px' }}></span>
                      <span style={{ color: 'var(--text-light)' }}>Số dư lũy kế</span>
                    </div>
                  </div>
                </div>
                
                {isLoadingTrends6M ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#718EBF', fontWeight: '500' }}>Đang tải dữ liệu 6 tháng...</div>
                ) : trends6M.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#718EBF', fontWeight: '500' }}>Không có dữ liệu 6 tháng qua.</div>
                ) : (
                  <div className="momo-bar-chart-container">
                    <div style={{ width: '500px', height: '240px', position: 'relative', padding: '20px 10px 10px', margin: '0 auto' }}>
                      {(() => {
                        let runningBalance = 0;
                        const trendsWithBalance = trends6M.map(item => {
                          const inc = Number(item.income) || 0;
                          const exp = Number(item.expense) || 0;
                          const net = inc - exp;
                          runningBalance += net;
                          return {
                            ...item,
                            income: inc,
                            expense: exp,
                            balance: runningBalance
                          };
                        });

                        const minY = Math.min(...trendsWithBalance.map(d => d.balance), 0);
                        const maxY = Math.max(...trendsWithBalance.map(d => Math.max(d.income, d.expense, d.balance)), 1000);
                        const valRange = maxY - minY || 1;
                        
                        const getY = (val: number) => 160 - ((val - minY) / valRange) * 140;
                        const zeroY = getY(0);

                        const linePoints = trendsWithBalance.map((item, i) => {
                          const groupX = 40 + i * (440 / trendsWithBalance.length);
                          return {
                            x: groupX + 28,
                            y: getY(item.balance)
                          };
                        });

                        let dPath = '';
                        if (linePoints.length > 0) {
                          dPath = linePoints.reduce((acc, p, idx) => {
                            return idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                          }, '');
                        }
                        
                        return (
                          <>
                            <svg width="500" height="200" viewBox="0 0 500 200" style={{ width: '500px', height: '200px', overflow: 'visible' }}>
                              {/* Grid lines */}
                              <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-color)" strokeDasharray="4 4" />
                              <line x1="40" y1="90" x2="480" y2="90" stroke="var(--border-color)" strokeDasharray="4 4" />
                              <line x1="40" y1="160" x2="480" y2="160" stroke="var(--border-color)" strokeWidth="1" />
                              {minY < 0 && (
                                <line x1="40" y1={zeroY} x2="480" y2={zeroY} stroke="var(--text-light)" strokeWidth="1" opacity="0.4" strokeDasharray="2 2" />
                              )}
                              
                              {/* Labels */}
                              <text x="35" y="24" textAnchor="end" fill="#718EBF" fontSize="10" fontWeight="bold">{formatCurrencyShort(maxY)}</text>
                              <text x="35" y="94" textAnchor="end" fill="#718EBF" fontSize="10" fontWeight="bold">{formatCurrencyShort(minY + valRange * 0.5)}</text>
                              <text x="35" y="164" textAnchor="end" fill="#718EBF" fontSize="10" fontWeight="bold">{formatCurrencyShort(minY)}</text>
                              
                              {trendsWithBalance.map((item, i) => {
                                const groupX = 40 + i * (440 / trendsWithBalance.length);
                                const incY = getY(item.income);
                                const expY = getY(item.expense);
                                
                                const incH = zeroY - incY;
                                const expH = zeroY - expY;
                                
                                return (
                                  <g key={i} onMouseEnter={() => setHoveredBarIdx(i)} onMouseLeave={() => setHoveredBarIdx(null)} style={{ cursor: 'pointer' }}>
                                    {/* Income Bar */}
                                    <rect 
                                      x={groupX + 10} 
                                      y={incY} 
                                      width="16" 
                                      height={Math.max(incH, 2)} 
                                      fill="#10B981" 
                                      rx="3" 
                                      style={{ transition: 'all 0.3s ease' }}
                                    />
                                    {/* Expense Bar */}
                                    <rect 
                                      x={groupX + 30} 
                                      y={expY} 
                                      width="16" 
                                      height={Math.max(expH, 2)} 
                                      fill="#FE5C73" 
                                      rx="3" 
                                      style={{ transition: 'all 0.3s ease' }}
                                    />
                                    
                                    {/* Invisible Hover Area */}
                                    <rect
                                      x={groupX + 5}
                                      y="10"
                                      width="48"
                                      height="170"
                                      fill="transparent"
                                    />
                                    
                                    {/* Label */}
                                    <text 
                                      x={groupX + 28} 
                                      y="180" 
                                      textAnchor="middle" 
                                      fill={hoveredBarIdx === i ? "var(--text-main)" : "#718EBF"} 
                                      fontSize="11" 
                                      fontWeight={hoveredBarIdx === i ? "bold" : "600"}
                                    >
                                      {item.label}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Cumulative Balance Trend Line overlay */}
                              {dPath && (
                                <path 
                                  d={dPath} 
                                  fill="none" 
                                  stroke="#2D60FF" 
                                  strokeWidth="3.5" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  style={{ filter: 'drop-shadow(0px 3px 6px rgba(45,96,255,0.45))' }}
                                />
                              )}

                              {/* Tiny dots on cumulative balance line */}
                              {trendsWithBalance.map((item, i) => {
                                const groupX = 40 + i * (440 / trendsWithBalance.length);
                                return (
                                  <circle
                                    key={`dot-${i}`}
                                    cx={groupX + 28}
                                    cy={getY(item.balance)}
                                    r="4.5"
                                    fill="#2D60FF"
                                    stroke="var(--card-bg)"
                                    strokeWidth="2"
                                    style={{ filter: 'drop-shadow(0px 1.5px 3px rgba(45,96,255,0.4))' }}
                                    pointerEvents="none"
                                  />
                                );
                              })}
                            </svg>

                            {/* Column tooltip */}
                            {hoveredBarIdx !== null && trendsWithBalance[hoveredBarIdx] && (() => {
                              const item = trendsWithBalance[hoveredBarIdx];
                              const groupX = 40 + hoveredBarIdx * (440 / trendsWithBalance.length) + 28;
                              const net = item.income - item.expense;
                              return (
                                <div className="momo-line-tooltip" style={{ 
                                  left: `${groupX}px`, 
                                  top: '5px',
                                  transform: 'translate(-50%, -100%)',
                                  position: 'absolute',
                                  background: '#1f2937',
                                  borderRadius: '8px',
                                  padding: '8px 12px',
                                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                  zIndex: 10,
                                  pointerEvents: 'none',
                                  color: '#fff',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  width: '170px'
                                }}>
                                  <div className="momo-line-tooltip-date" style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px', textAlign: 'center' }}>Tháng {item.label}</div>
                                  <div style={{ color: '#10B981', display: 'flex', gap: '8px', fontSize: '12px', justifyContent: 'space-between' }}>
                                    <span>Thu:</span> <span>+{formatCurrency(item.income)}</span>
                                  </div>
                                  <div style={{ color: '#FE5C73', display: 'flex', gap: '8px', fontSize: '12px', justifyContent: 'space-between' }}>
                                    <span>Chi:</span> <span>-{formatCurrency(item.expense)}</span>
                                  </div>
                                  <div style={{ 
                                    color: net >= 0 ? '#10B981' : '#FE5C73', 
                                    display: 'flex', 
                                    gap: '8px', 
                                    fontSize: '12px', 
                                    borderTop: '1px solid #4b5563', 
                                    paddingTop: '4px', 
                                    marginTop: '4px', 
                                    fontWeight: 'bold',
                                    justifyContent: 'space-between'
                                  }}>
                                    <span>Tích lũy:</span> <span>{net >= 0 ? '+' : ''}{formatCurrency(net)}</span>
                                  </div>
                                  <div style={{ 
                                    color: '#2D60FF', 
                                    display: 'flex', 
                                    gap: '8px', 
                                    fontSize: '12px', 
                                    borderTop: '1px solid #4b5563', 
                                    paddingTop: '4px', 
                                    marginTop: '4px', 
                                    fontWeight: 'bold',
                                    justifyContent: 'space-between'
                                  }}>
                                    <span>Số dư lũy kế:</span> <span>{item.balance >= 0 ? '+' : ''}{formatCurrency(item.balance)}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: BALANCE TRENDS */}
          {activeTab === 'balance_trend' && (
            <div className="reports-fade-in">
              <div className="momo-stats-card">
                {/* 1. Period Selector ("Theo tuần", "Theo tháng", "Theo năm") */}
                <div style={{
                  display: 'flex',
                  background: 'var(--bg-color)',
                  borderRadius: '20px',
                  padding: '4px',
                  border: '1px solid var(--border-color)',
                  width: 'fit-content',
                  margin: '0 auto 20px',
                  gap: '4px'
                }}>
                  <button 
                    style={{
                      background: balancePeriod === 'week' ? 'var(--card-bg)' : 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '8px 18px',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      color: balancePeriod === 'week' ? '#1814F3' : '#718EBF',
                      cursor: 'pointer',
                      boxShadow: balancePeriod === 'week' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setBalancePeriod('week')}
                  >
                    Theo tuần
                  </button>
                  <button 
                    style={{
                      background: balancePeriod === 'month' ? 'var(--card-bg)' : 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '8px 18px',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      color: balancePeriod === 'month' ? '#1814F3' : '#718EBF',
                      cursor: 'pointer',
                      boxShadow: balancePeriod === 'month' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setBalancePeriod('month')}
                  >
                    Theo tháng
                  </button>
                  <button 
                    style={{
                      background: balancePeriod === 'year' ? 'var(--card-bg)' : 'transparent',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '8px 18px',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      color: balancePeriod === 'year' ? '#1814F3' : '#718EBF',
                      cursor: 'pointer',
                      boxShadow: balancePeriod === 'year' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setBalancePeriod('year')}
                  >
                    Theo năm
                  </button>
                </div>

                {/* 2. Type Selector ("Thu nhập", "Chi tiêu", "Chênh lệch") */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '20px'
                }}>
                  <button 
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '12px 20px',
                      fontWeight: '700',
                      fontSize: '14.5px',
                      color: balanceType === 'income' ? '#1814F3' : '#718EBF',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderBottom: '3px solid',
                      borderBottomColor: balanceType === 'income' ? '#1814F3' : 'transparent'
                    }}
                    onClick={() => setBalanceType('income')}
                  >
                    Thu nhập
                  </button>
                  <button 
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '12px 20px',
                      fontWeight: '700',
                      fontSize: '14.5px',
                      color: balanceType === 'expense' ? '#1814F3' : '#718EBF',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderBottom: '3px solid',
                      borderBottomColor: balanceType === 'expense' ? '#1814F3' : 'transparent'
                    }}
                    onClick={() => setBalanceType('expense')}
                  >
                    Chi tiêu
                  </button>
                  <button 
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '12px 20px',
                      fontWeight: '700',
                      fontSize: '14.5px',
                      color: balanceType === 'net' ? '#1814F3' : '#718EBF',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderBottom: '3px solid',
                      borderBottomColor: balanceType === 'net' ? '#1814F3' : 'transparent'
                    }}
                    onClick={() => setBalanceType('net')}
                  >
                    Chênh lệch
                  </button>
                </div>

                {/* 3. Summary Content for Active Range */}
                {(() => {
                  const currRange = computedRanges.find(r => r.originalIdx === selectedBalancePeriodIdx);
                  const prevRange = currRange ? computedRanges[currRange.originalIdx - 1] : null;
                  
                  if (!currRange) {
                    return (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#718EBF' }}>
                        Đang tính toán dữ liệu...
                      </div>
                    );
                  }

                  let totalVal = 0;
                  let totalLabel = '';
                  if (balanceType === 'income') {
                    totalVal = currRange.income;
                    totalLabel = balancePeriod === 'week' ? 'Tổng thu tuần' : (balancePeriod === 'month' ? 'Tổng thu tháng' : 'Tổng thu năm');
                  } else if (balanceType === 'expense') {
                    totalVal = currRange.expense;
                    totalLabel = balancePeriod === 'week' ? 'Tổng chi tuần' : (balancePeriod === 'month' ? 'Tổng chi tháng' : 'Tổng chi năm');
                  } else {
                    totalVal = currRange.net;
                    totalLabel = balancePeriod === 'week' ? 'Tổng chênh lệch tuần' : (balancePeriod === 'month' ? 'Tổng chênh lệch tháng' : 'Tổng chênh lệch năm');
                  }

                  // Calculate comparison
                  let compText = '';
                  let isCompGood = true;
                  let hasComp = false;

                  if (prevRange) {
                    hasComp = true;
                    let currVal = 0;
                    let prevVal = 0;
                    if (balanceType === 'income') {
                      currVal = currRange.income;
                      prevVal = prevRange.income;
                    } else if (balanceType === 'expense') {
                      currVal = currRange.expense;
                      prevVal = prevRange.expense;
                    } else {
                      currVal = currRange.net;
                      prevVal = prevRange.net;
                    }

                    const diff = currVal - prevVal;
                    const diffAbs = Math.abs(diff);
                    
                    if (balanceType === 'expense') {
                      isCompGood = diff < 0;
                      const verb = diff < 0 ? 'Giảm' : 'Tăng';
                      const arrow = diff < 0 ? '↓' : '↑';
                      compText = `${arrow} ${verb} ${formatCurrencyLocal(diffAbs)} so với cùng kỳ ${prevRange.label}`;
                    } else if (balanceType === 'income') {
                      isCompGood = diff >= 0;
                      const verb = diff >= 0 ? 'Tăng' : 'Giảm';
                      const arrow = diff >= 0 ? '↑' : '↓';
                      compText = `${arrow} ${verb} ${formatCurrencyLocal(diffAbs)} so với cùng kỳ ${prevRange.label}`;
                    } else {
                      isCompGood = diff >= 0;
                      const verb = diff >= 0 ? 'Tăng' : 'Giảm';
                      const arrow = diff >= 0 ? '↑' : '↓';
                      compText = `${arrow} ${verb} ${formatCurrencyLocal(diffAbs)} so với cùng kỳ ${prevRange.label}`;
                    }
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                      <div style={{ fontSize: '14px', color: '#718EBF', fontWeight: '600' }}>{totalLabel}</div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', margin: '6px 0' }}>
                        {formatCurrencyLocal(totalVal)}
                      </div>
                      
                      {hasComp && (
                        <div style={{
                          background: isCompGood ? 'rgba(16, 185, 129, 0.08)' : 'rgba(254, 92, 115, 0.08)',
                          color: isCompGood ? '#10B981' : '#FE5C73',
                          border: isCompGood ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(254, 92, 115, 0.15)',
                          borderRadius: '20px',
                          padding: '6px 16px',
                          fontSize: '13px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '4px'
                        }}>
                          {compText}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 4. "Biến động" Comparison Toggle Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 8px',
                  marginBottom: '20px'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>Biến động</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#718EBF', fontWeight: '600' }}>So với cùng kỳ</span>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '46px',
                      height: '24px',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={compareSamePeriod}
                        onChange={e => setCompareSamePeriod(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: compareSamePeriod ? '#1814F3' : '#E4E7EB',
                        borderRadius: '24px',
                        transition: '0.3s'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '18px', width: '18px',
                          left: compareSamePeriod ? '24px' : '4px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: '0.3s'
                        }} />
                      </span>
                    </label>
                  </div>
                </div>

                {/* 5. SVG Bar Chart */}
                <div className="momo-bar-chart-container" style={{ overflowY: 'hidden', marginBottom: '24px' }}>
                  {(() => {
                    const displayed = computedRanges.filter(r => r.isDisplayed);
                    if (displayed.length === 0) return null;

                    const width = 500;
                    const height = 220;
                    const paddingLeft = 50;
                    const paddingRight = 20;
                    const paddingTop = 35;
                    const paddingBottom = 35;
                    const plotW = width - paddingLeft - paddingRight;
                    const plotH = height - paddingTop - paddingBottom;
                    const N = displayed.length;

                    let values = displayed.map(r => {
                      if (balanceType === 'income') return r.income;
                      if (balanceType === 'expense') return r.expense;
                      return r.net;
                    });

                    let maxVal = Math.max(...values, 1000);
                    let minVal = Math.min(...values, 0);

                    let zeroY = height - paddingBottom;
                    let scale = 1;
                    
                    if (balanceType === 'net') {
                      const maxAbs = Math.max(...values.map(Math.abs), 1000);
                      zeroY = paddingTop + plotH / 2;
                      scale = (plotH / 2) / maxAbs;
                      maxVal = maxAbs;
                      minVal = -maxAbs;
                    } else {
                      scale = plotH / maxVal;
                    }

                    let yTicks: number[] = [];
                    if (balanceType === 'net') {
                      yTicks = [-maxVal, -maxVal * 0.5, 0, maxVal * 0.5, maxVal];
                    } else {
                      yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];
                    }

                    return (
                      <div style={{ width: '500px', height: '220px', position: 'relative', margin: '0 auto' }}>
                        <svg width="500" height="220" viewBox={`0 0 ${width} ${height}`} style={{ width: '500px', height: '220px', overflow: 'visible' }}>
                          <defs>
                            {/* Income gradients */}
                            <linearGradient id="incomeActive" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                            <linearGradient id="incomeInactive" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.25)" />
                              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.15)" />
                            </linearGradient>

                            {/* Expense gradients */}
                            <linearGradient id="expenseActive" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FE5C73" />
                              <stop offset="100%" stopColor="#E11D48" />
                            </linearGradient>
                            <linearGradient id="expenseInactive" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(254, 92, 115, 0.25)" />
                              <stop offset="100%" stopColor="rgba(254, 92, 115, 0.15)" />
                            </linearGradient>
                          </defs>

                          {yTicks.map((tick, i) => {
                            let y = zeroY;
                            if (balanceType === 'net') {
                              y = zeroY - tick * scale;
                            } else {
                              y = zeroY - tick * scale;
                            }
                            return (
                              <g key={i}>
                                <line 
                                  x1={paddingLeft} 
                                  y1={y} 
                                  x2={width - paddingRight} 
                                  y2={y} 
                                  stroke="var(--border-color)" 
                                  strokeDasharray={tick === 0 && balanceType === 'net' ? 'none' : '4 4'} 
                                  strokeWidth={tick === 0 && balanceType === 'net' ? 1.5 : 1}
                                />
                                <text 
                                  x={paddingLeft - 8} 
                                  y={y + 3} 
                                  textAnchor="end" 
                                  fill="#718EBF" 
                                  fontSize="9" 
                                  fontWeight="700"
                                >
                                  {formatCurrencyShort(tick)}
                                </text>
                              </g>
                            );
                          })}

                          <text 
                            x={paddingLeft - 8} 
                            y={paddingTop - 10} 
                            textAnchor="end" 
                            fill="#718EBF" 
                            fontSize="9" 
                            fontWeight="700"
                          >
                            (Tr)
                          </text>

                          {displayed.map((r, i) => {
                            const val = balanceType === 'income' ? r.income : (balanceType === 'expense' ? r.expense : r.net);
                            const x = paddingLeft + (i + 0.5) * (plotW / N);
                            const barW = Math.max(16, (plotW / N) * 0.4);
                            
                            let barY = zeroY;
                            let barH = 0;
                            
                            if (balanceType === 'net') {
                              if (val >= 0) {
                                barH = val * scale;
                                barY = zeroY - barH;
                              } else {
                                barH = Math.abs(val) * scale;
                                barY = zeroY;
                              }
                            } else {
                              barH = val * scale;
                              barY = zeroY - barH;
                            }

                            const displayBarH = Math.max(2, barH);
                            const displayBarY = val < 0 && balanceType === 'net' ? barY : zeroY - displayBarH;

                            const isActive = selectedBalancePeriodIdx === r.originalIdx;
                            
                            let fillUrl = '';
                            if (balanceType === 'income') {
                              fillUrl = isActive ? 'url(#incomeActive)' : 'url(#incomeInactive)';
                            } else if (balanceType === 'expense') {
                              fillUrl = isActive ? 'url(#expenseActive)' : 'url(#expenseInactive)';
                            } else {
                              if (val >= 0) {
                                fillUrl = isActive ? 'url(#incomeActive)' : 'url(#incomeInactive)';
                              } else {
                                fillUrl = isActive ? 'url(#expenseActive)' : 'url(#expenseInactive)';
                              }
                            }

                            const activeColorLabel = balanceType === 'income' ? '#10B981' : (balanceType === 'expense' ? '#FE5C73' : (val >= 0 ? '#10B981' : '#FE5C73'));

                            const tooltipW = 55;
                            const tooltipH = 22;
                            const tooltipX = x;
                            const tooltipY = displayBarY - 8;

                            return (
                              <g key={r.label} style={{ cursor: 'pointer' }} onClick={() => setSelectedBalancePeriodIdx(r.originalIdx)}>
                                <rect 
                                  x={x - (plotW / N) / 2} 
                                  y={paddingTop} 
                                  width={plotW / N} 
                                  height={plotH} 
                                  fill="transparent"
                                />

                                <rect 
                                  x={x - barW / 2} 
                                  y={displayBarY} 
                                  width={barW} 
                                  height={displayBarH} 
                                  rx={4} 
                                  ry={4} 
                                  fill={fillUrl}
                                  style={{ transition: 'all 0.3s' }}
                                />

                                {isActive && (
                                  <g>
                                    <rect 
                                      x={tooltipX - tooltipW / 2} 
                                      y={tooltipY - tooltipH} 
                                      width={tooltipW} 
                                      height={tooltipH} 
                                      rx={6} 
                                      fill="#1f2937" 
                                    />
                                    <polygon 
                                      points={`${tooltipX - 4},${tooltipY} ${tooltipX + 4},${tooltipY} ${tooltipX},${tooltipY + 4}`} 
                                      fill="#1f2937" 
                                    />
                                    <text 
                                      x={tooltipX} 
                                      y={tooltipY - tooltipH / 2 + 3} 
                                      fill="#fff" 
                                      fontSize="9.5" 
                                      fontWeight="800" 
                                      textAnchor="middle"
                                    >
                                      {formatCurrencyShort(val)}
                                    </text>
                                  </g>
                                )}

                                <text 
                                  x={x} 
                                  y={height - 12} 
                                  textAnchor="middle" 
                                  fill={isActive ? activeColorLabel : '#718EBF'} 
                                  fontSize="10.5" 
                                  fontWeight="800"
                                >
                                  {r.label}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                {/* 6. List details below the chart */}
                {isLoadingBalance ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>
                    Đang tải dữ liệu biến động...
                  </div>
                ) : balanceType === 'net' ? (
                  (() => {
                    const displayed = computedRanges.filter(r => r.isDisplayed);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                          Lịch sử chênh lệch thu chi
                        </div>
                        {displayed.slice().reverse().map((item) => {
                          const dateBlock = getDateBlock(item, balancePeriod);
                          const isNegative = item.net < 0;
                          
                          return (
                            <div 
                              key={item.label}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                borderRadius: '16px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                  background: 'var(--bg-color)',
                                  borderRadius: '12px',
                                  width: '50px',
                                  height: '50px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '700',
                                  color: '#718EBF',
                                  border: '1px solid var(--border-color)'
                                }}>
                                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.1 }}>
                                    {dateBlock.top}
                                  </span>
                                  {dateBlock.bottom && (
                                    <span style={{ fontSize: '9px', color: '#718EBF', marginTop: '2px' }}>
                                      {dateBlock.bottom}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#718EBF' }}>
                                    Thu <span style={{ color: '#10B981', fontWeight: '700' }}>{formatCurrencyLocal(item.income)}</span>
                                  </div>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#718EBF' }}>
                                    Chi <span style={{ color: '#FE5C73', fontWeight: '700' }}>{formatCurrencyLocal(item.expense)}</span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: '#718EBF', fontWeight: '600', marginBottom: '2px' }}>
                                  Còn lại
                                </div>
                                <div style={{ 
                                  fontSize: '15px', 
                                  fontWeight: '800', 
                                  color: isNegative ? '#FE5C73' : '#10B981' 
                                }}>
                                  {item.net >= 0 ? '+' : ''}{formatCurrencyLocal(item.net)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  (() => {
                    const currRange = computedRanges.find(r => r.originalIdx === selectedBalancePeriodIdx);
                    const prevRange = currRange ? computedRanges[currRange.originalIdx - 1] : null;
                    
                    const breakdown = (() => {
                      if (!currRange) return [];
                      
                      const activeTxs = currRange.txs.filter(tx => tx.type === balanceType);
                      const prevTxs = prevRange ? prevRange.txs.filter(tx => tx.type === balanceType) : [];
                      
                      const activeGroup: Record<string, number> = {};
                      const prevGroup: Record<string, number> = {};
                      let totalActive = 0;
                      
                      activeTxs.forEach(tx => {
                        const amt = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
                        const catId = String(tx.category_id || 'other');
                        
                        let targetId = catId;
                        if (categoryLevel === 'parent') {
                          const catInfo = categoriesMap[catId];
                          if (catInfo && catInfo.parent_id) {
                            targetId = String(catInfo.parent_id);
                          }
                        }
                        
                        activeGroup[targetId] = (activeGroup[targetId] || 0) + amt;
                        totalActive += amt;
                      });
                      
                      prevTxs.forEach(tx => {
                        const amt = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
                        const catId = String(tx.category_id || 'other');
                        
                        let targetId = catId;
                        if (categoryLevel === 'parent') {
                          const catInfo = categoriesMap[catId];
                          if (catInfo && catInfo.parent_id) {
                            targetId = String(catInfo.parent_id);
                          }
                        }
                        
                        prevGroup[targetId] = (prevGroup[targetId] || 0) + amt;
                      });
                      
                      const list = Object.keys(activeGroup).map(catId => {
                        const amount = activeGroup[catId];
                        const prevAmount = prevGroup[catId] || 0;
                        const delta = amount - prevAmount;
                        const percentage = totalActive > 0 ? (amount / totalActive) * 100 : 0;
                        
                        const catInfo = categoriesMap[catId];
                        let name = 'Khác';
                        let icon = '📁';
                        let color = '#94A3B8';
                        
                        if (catId !== 'other' && catInfo) {
                          name = catInfo.name || name;
                          icon = catInfo.icon || icon;
                          color = catInfo.color || color;
                        }
                        
                        return {
                          id: catId,
                          name,
                          icon,
                          color,
                          amount,
                          prevAmount,
                          delta,
                          percentage
                        };
                      });
                      
                      return list.sort((a, b) => b.amount - a.amount);
                    })();

                    const renderDelta = (delta: number) => {
                      if (delta === 0) return <span style={{ color: '#718EBF' }}>Không đổi</span>;
                      const isExpense = balanceType === 'expense';
                      const isPositive = delta > 0;
                      
                      const isGood = (isExpense && !isPositive) || (!isExpense && isPositive);
                      const color = isGood ? '#10B981' : '#FE5C73';
                      const sign = isPositive ? 'Tăng' : 'Giảm';
                      const formattedVal = formatCurrencyShort(Math.abs(delta));
                      
                      return (
                        <span style={{ color, fontWeight: '700' }}>
                          {isPositive ? '↑' : '↓'} {sign} {formattedVal}
                        </span>
                      );
                    };

                    return (
                      <div>
                        <div style={{
                          display: 'flex',
                          background: 'var(--bg-color)',
                          borderRadius: '12px',
                          padding: '4px',
                          border: '1px solid var(--border-color)',
                          width: 'fit-content',
                          margin: '15px auto 5px'
                        }}>
                          <button 
                            style={{
                              padding: '6px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: categoryLevel === 'child' ? 'var(--card-bg)' : 'transparent',
                              color: categoryLevel === 'child' ? '#1814F3' : '#718EBF',
                              fontWeight: '700',
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              boxShadow: categoryLevel === 'child' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => setCategoryLevel('child')}
                          >
                            Danh mục con
                          </button>
                          <button 
                            style={{
                              padding: '6px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: categoryLevel === 'parent' ? 'var(--card-bg)' : 'transparent',
                              color: categoryLevel === 'parent' ? '#1814F3' : '#718EBF',
                              fontWeight: '700',
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              boxShadow: categoryLevel === 'parent' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => setCategoryLevel('parent')}
                          >
                            Danh mục cha
                          </button>
                        </div>

                        {breakdown.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>
                            Không có dữ liệu trong kỳ này.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                            {breakdown.map((item) => (
                              <div 
                                key={item.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '12px 16px',
                                  borderRadius: '16px',
                                  background: 'var(--card-bg)',
                                  border: '1px solid var(--border-color)',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                  cursor: 'pointer'
                                }}
                                className="momo-list-item-card"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: `${item.color}1A`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px'
                                  }}>
                                    {parseIcon(item.icon)}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{item.name}</div>
                                    <div style={{ fontSize: '11px', color: '#718EBF', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                      <span>{item.percentage.toFixed(1)}%</span>
                                      <span>•</span>
                                      {renderDelta(item.delta)}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
                                  {formatCurrencyLocal(item.amount)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BUDGET STATUSES */}
          {activeTab === 'budgets' && (
            <div className="reports-fade-in">
              {isLoggedIn && !isLoadingTransactions && budgetStatuses.length > 0 ? (
                <div className="report-transactions-card" style={{ marginTop: 0 }}>
                  <div className="report-transactions-header">
                    <h2 className="report-transactions-title">
                      <span style={{ fontSize: '20px' }}>🐷</span>
                      Tình trạng ngân sách & Hạn mức chi tiêu
                    </h2>
                  </div>
                  
                  <div className="report-table-wrapper">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Danh mục</th>
                          <th style={{ textAlign: 'right' }}>Hạn mức</th>
                          <th style={{ textAlign: 'right' }}>Đã chi tiêu</th>
                          <th style={{ textAlign: 'center' }}>% Đã dùng</th>
                          <th style={{ textAlign: 'right' }}>Còn dư / Vượt quá</th>
                          <th style={{ textAlign: 'center' }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgetStatuses.map((item: any, idx: number) => {
                          const currencySymbol = userData?.preference?.currency || 'VND';
                          const limitStr = item.limit > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currencySymbol }).format(item.limit) : 'Chưa đặt';
                          const spentStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currencySymbol }).format(item.spent);
                          
                          let remainingStr = '-';
                          let isExceeded = false;
                          if (item.limit > 0) {
                            isExceeded = item.spent > item.limit;
                            remainingStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currencySymbol }).format(Math.abs(item.remaining));
                          }
                          
                          return (
                            <tr key={item.id || idx}>
                              <td>
                                {item.icon ? `${parseIcon(item.icon)} ` : ''}
                                {item.name}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{limitStr}</td>
                              <td style={{ textAlign: 'right', color: '#FE5C73' }}>{spentStr}</td>
                              <td style={{ textAlign: 'center' }}>
                                {item.limit > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.percent.toFixed(1)}%</span>
                                    <div className="saving-progress-container" style={{ margin: 0, width: '80px', height: '6px' }}>
                                      <div 
                                        className={`saving-progress-bar ${item.status === 'exceeded' ? 'warning' : item.status === 'warning' ? 'fair' : 'excellent'}`} 
                                        style={{ width: `${Math.min(100, item.percent)}%` }} 
                                      />
                                    </div>
                                  </div>
                                ) : '-'}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: isExceeded ? '#FE5C73' : (item.limit > 0 ? '#10B981' : 'var(--text-main)') }}>
                                {item.limit > 0 ? (
                                  <>
                                    {isExceeded ? '-' : '+'}
                                    {remainingStr}
                                  </>
                                ) : '-'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`budget-status-badge ${item.status}`}>
                                  {item.statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="report-transactions-card" style={{ marginTop: 0, textAlign: 'center', padding: '40px', color: '#718EBF' }}>
                  Không có ngân sách nào được thiết lập cho tháng này hoặc chưa có dữ liệu giao dịch.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRANSACTION LOG */}
          {activeTab === 'transactions' && (
            <div className="reports-fade-in">
              {isLoadingTransactions ? (
                <div className="report-transactions-card" style={{ opacity: 0.6, marginTop: 0 }}>
                  <div style={{ textAlign: 'center', color: '#718EBF', fontWeight: '500', padding: '20px' }}>
                    Đang tải chi tiết giao dịch...
                  </div>
                </div>
              ) : (
                <div className="report-transactions-card" style={{ marginTop: 0 }}>
                  <div className="report-transactions-header">
                    <h2 className="report-transactions-title">
                      <span style={{ fontSize: '20px' }}>📋</span>
                      Chi tiết giao dịch
                    </h2>
                  </div>
                  
                  <div className="report-table-wrapper">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Tiêu đề</th>
                          <th>Danh mục</th>
                          <th>Ví</th>
                          <th style={{ textAlign: 'right' }}>Số tiền</th>
                          <th style={{ textAlign: 'center' }}>Loại</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filtered = transactions.filter((tx: any) => {
                            if (selectedCategory && String(tx.category_id) !== String(selectedCategory)) return false;
                            if (selectedType && tx.type !== selectedType) return false;
                            return true;
                          });

                          return filtered.map((tx: any, idx: number) => {
                            let datePart = '';
                            const rawDate = tx.transaction_date || tx.date || '';
                            if (rawDate) {
                              const d = new Date(rawDate);
                              if (!isNaN(d.getTime())) {
                                const pad = (n: number) => String(n).padStart(2, '0');
                                datePart = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
                              } else {
                                datePart = rawDate;
                              }
                            }
                            
                            const note = tx.title || tx.description || tx.note || 'Không có ghi chú';
                            const categoryName = tx.category?.name || tx.category_name || 'Không phân mục';
                            const walletName = tx.wallet?.name || tx.wallet_name || 'Ví đã xóa';
                            const typeStr = tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
                            
                            const originalCurrency = tx.currency_code || tx.wallet?.currency_code || 'VND';
                            const originalAmountStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: originalCurrency }).format(Math.abs(Number(tx.amount) || 0));
                            
                            return (
                              <tr key={tx.id || idx}>
                                <td>{datePart}</td>
                                <td style={{ maxWidth: '250px', wordBreak: 'break-word' }}>{note}</td>
                                <td>
                                  {tx.category?.icon ? `${parseIcon(tx.category.icon)} ` : ''}
                                  {categoryName}
                                </td>
                                <td>
                                  {tx.wallet?.icon ? `${parseIcon(tx.wallet.icon)} ` : ''}
                                  {walletName}
                                </td>
                                <td style={{ textAlign: 'right' }} className={`report-amount ${tx.type}`}>
                                  {tx.type === 'income' ? '+' : '-'}{originalAmountStr}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={`report-type-badge ${tx.type}`}>{typeStr}</span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                        {transactions.filter((tx: any) => {
                          if (selectedCategory && String(tx.category_id) !== String(selectedCategory)) return false;
                          if (selectedType && tx.type !== selectedType) return false;
                          return true;
                        }).length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: '#718EBF', padding: '40px', fontWeight: '500' }}>
                              Không có giao dịch nào phù hợp với bộ lọc trong khoảng thời gian này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPORT REPORTS & EXPORT HISTORY */}
          {activeTab === 'export' && (
            <div className="reports-fade-in">
              <div className="report-transactions-card" style={{ marginTop: 0 }}>
                <div className="report-transactions-header" style={{ marginBottom: '28px' }}>
                  <h2 className="report-transactions-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1814F3' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Tải báo cáo định dạng
                  </h2>
                </div>

                {/* FORMATS CARD GRID */}
                <div className="report-cards-grid">
                  {/* PDF CARD */}
                  <div className="report-card pdf" onClick={handleExportPDF}>
                    <div className="report-card-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                      {renderFormatIcon('pdf', 28)}
                    </div>
                    <h3 className="report-card-title">{t('export_pdf')}</h3>
                    <p className="report-card-desc">{t('export_pdf_desc')}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleExportPDF(); }} 
                      className="report-download-btn pdf-btn"
                      disabled={!isLoggedIn || isExporting}
                    >
                      {isExporting ? 'Đang xuất...' : t('download')}
                    </button>
                  </div>

                  {/* EXCEL CARD */}
                  <div className="report-card excel" onClick={handleExportExcel}>
                    <div className="report-card-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
                      {renderFormatIcon('excel', 28)}
                    </div>
                    <h3 className="report-card-title">{t('export_excel')}</h3>
                    <p className="report-card-desc">{t('export_excel_desc')}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleExportExcel(); }} 
                      className="report-download-btn excel-btn"
                      disabled={!isLoggedIn || isExportingExcel}
                    >
                      {isExportingExcel ? 'Đang xuất...' : t('download')}
                    </button>
                  </div>

                  {/* CSV CARD */}
                  <div className="report-card csv" onClick={handleExportCSV}>
                    <div className="report-card-icon-wrapper" style={{ background: 'rgba(24, 20, 243, 0.08)' }}>
                      {renderFormatIcon('csv', 28)}
                    </div>
                    <h3 className="report-card-title">{t('export_csv')}</h3>
                    <p className="report-card-desc">{t('export_csv_desc')}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleExportCSV(); }} 
                      className="report-download-btn csv-btn"
                      disabled={!isLoggedIn || isExportingCSV}
                    >
                      {isExportingCSV ? 'Đang xuất...' : t('download')}
                    </button>
                  </div>
                </div>

                {/* HISTORY SECTION */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '28px', marginTop: '12px' }}>
                  <h3 className="report-transactions-title" style={{ marginBottom: '20px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#718EBF' }}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Lịch sử xuất file gần đây
                  </h3>
                  
                  <div className="report-history-box" style={{ background: 'var(--bg-color)', border: 'none', padding: 0 }}>
                    {isLoggedIn && exportHistory.length > 0 ? exportHistory.map((f: any, i: number)=>(
                      <div key={i} className="report-history-item" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                        <div className={`report-history-icon-circle ${f.type}`}>
                          {renderFormatIcon(f.type, 20)}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:'700', color:'var(--text-main)', fontSize: '14.5px'}}>{f.name}</div>
                          <div style={{fontSize:'12.5px', color:'#718EBF', fontWeight: '500', marginTop: '2px'}}>{f.date} • {f.size}</div>
                        </div>
                        <button onClick={() => handleReloadExport(f)} className="report-history-btn">{t('reload')}</button>
                      </div>
                    )) : (
                      <p style={{color:'#718EBF', textAlign:'center', padding:'30px', fontWeight: '600'}}>
                        {isLoggedIn ? 'Chưa có lịch sử xuất file nào.' : t('login_to_view_history')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );

}

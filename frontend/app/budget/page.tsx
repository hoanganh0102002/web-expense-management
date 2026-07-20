"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { budgetApi, transactionApi } from '../lib/api';
import CategoryPicker from '../components/CategoryPicker';
import './budget.css';

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

const renderSvgIcon = (type: 'wallet' | 'calendar' | 'forecast' | 'limit') => {
  if (type === 'wallet') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b91010" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    );
  }
  if (type === 'calendar') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    );
  }
  if (type === 'forecast') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    );
  }
  if (type === 'limit') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 7h10M7 12h10M7 17h10" />
      </svg>
    );
  }
  return null;
};


const BudgetDoughnutChart = ({ data }: { data: { name: string; value: number; color: string; icon: string }[] }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const { userData } = useAppContext();
  const { t } = useLanguage();
  
  const activeItems = React.useMemo(() => data.filter(item => item.value > 0), [data]);
  const total = React.useMemo(() => activeItems.reduce((sum, item) => sum + item.value, 0), [activeItems]);

  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return '0';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericAmount);
  };
  
  if (total === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '240px', 
        color: '#718EBF', 
        background: 'rgba(255, 255, 255, 0.01)', 
        borderRadius: '24px', 
        border: '2px dashed var(--border-color)',
        padding: '20px'
      }}>
        <span style={{ fontSize: '48px', marginBottom: '14px', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' }}>📊</span>
        <span style={{ fontSize: '15px', fontWeight: '750', color: 'var(--text-main)' }}>{t('budget_no_expenses')}</span>
        <span style={{ fontSize: '12px', color: '#718EBF', marginTop: '6px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.5' }}>
          {t('budget_no_expenses_desc')}
        </span>
      </div>
    );
  }

  // Cấu hình SVG
  const radius = 72;
  const strokeWidth = 16;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  // Tính toán góc vẽ cho phân khúc bo tròn có khoảng cách (gap)
  const gapDegrees = activeItems.length > 1 ? 6 : 0; // Khoảng cách giữa các phần (độ)
  const totalGapsAngle = activeItems.length * gapDegrees;
  const availableAngle = 360 - totalGapsAngle;

  let accumulatedAngle = 0;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '35px', 
      padding: '10px 0', 
      width: '100%',
      maxWidth: '680px', 
      margin: '0 auto',
    }}>
      {/* Khung chứa SVG kèm hiệu ứng phát sáng chuyển màu theo danh mục */}
      <div style={{ 
        position: 'relative', 
        width: '210px', 
        height: '210px', 
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        boxShadow: hoveredIndex !== null 
          ? `0 20px 50px -15px ${activeItems[hoveredIndex]?.color}25` 
          : '0 20px 40px -20px rgba(0,0,0,0.15)',
        background: hoveredIndex !== null 
          ? `radial-gradient(circle, ${activeItems[hoveredIndex]?.color}15 0%, rgba(255,255,255,0) 70%)` 
          : 'radial-gradient(circle, var(--border-color)06 0%, rgba(255,255,255,0) 70%)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Glow blur hiệu ứng Neon phía sau */}
        {hoveredIndex !== null && (
          <div style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: activeItems[hoveredIndex].color,
            filter: 'blur(35px)',
            opacity: 0.25,
            zIndex: 1,
            animation: 'bdg-fadeIn 0.3s ease',
            pointerEvents: 'none'
          }} />
        )}

        <svg width="200" height="200" viewBox="0 0 200 200" style={{ width: '200px', height: '200px', fill: 'none', display: 'block', transform: 'rotate(-90deg)', zIndex: 2 }}>
          {/* Vòng nền xám nhạt phía dưới */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth - 6}
            style={{ opacity: 0.12 }}
          />

          {activeItems.map((item, idx) => {
            const percentage = (item.value / total) * 100;
            const sweepAngle = (item.value / total) * availableAngle;
            
            // Độ dài nét vẽ và khoảng trống nét đứt
            const strokeDashLength = (sweepAngle / 360) * circumference;
            const strokeSpaceLength = circumference - strokeDashLength;
            
            // Góc xoay bắt đầu của phân khúc (gồm cả các khoảng gap tích lũy)
            const rotation = accumulatedAngle;
            accumulatedAngle += sweepAngle + gapDegrees;
            
            const isHovered = hoveredIndex !== null && activeItems[hoveredIndex]?.name === item.name;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${strokeDashLength} ${strokeSpaceLength}`}
                strokeDashoffset={0}
                strokeLinecap="round" // Định dạng bo tròn 2 đầu phân khúc cực sang
                transform={`rotate(${rotation} ${center} ${center})`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                }}
              />
            );
          })}
        </svg>

        {/* Cửa sổ hiển thị thông số ở tâm hình tròn - dạng mặt đồng hồ thông minh */}
        <div style={{
          position: 'absolute',
          zIndex: 3,
          textAlign: 'center',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {hoveredIndex !== null ? (
            <div style={{ animation: 'bdg-slideUp 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '50%', 
                background: `${activeItems[hoveredIndex].color}18`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '22px', 
                margin: '0 auto 6px auto',
                border: `1px solid ${activeItems[hoveredIndex].color}30`
              }}>
                {activeItems[hoveredIndex].icon}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#718EBF', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '0.8px',
                maxWidth: '120px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {activeItems[hoveredIndex].name}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '850', color: 'var(--text-main)', marginTop: '2px' }}>
                {Math.round((activeItems[hoveredIndex].value / total) * 100)}%
              </div>
            </div>
          ) : (
            <div style={{ animation: 'bdg-fadeIn 0.3s ease' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '2px' }}>💰</span>
              <div style={{ fontSize: '10px', color: '#718EBF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('total_spending_label')}</div>
              <div style={{ fontSize: '18px', fontWeight: '850', color: 'var(--text-main)', marginTop: '1px' }}>
                {formatCurrency(total)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid danh sách chú thích 2 cột cực gọn và sang trọng */}
      <div className="budget-legend-list">
        {activeItems.map((item, idx) => {
          const percentage = Math.round((item.value / total) * 100);
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`budget-legend-item ${isHovered ? 'hovered' : ''}`}
              style={{
                '--legend-color': item.color,
                '--legend-color-bg': `${item.color}0c`,
                '--legend-color-border': `${item.color}40`,
                '--legend-color-glow': `${item.color}20`
              } as React.CSSProperties}
            >
              {/* Icon hình tròn nhỏ */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `${item.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                flexShrink: 0
              }}>
                {item.icon}
              </div>

              {/* Tên và số tiền */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.name}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px', opacity: 0.9 }}>
                  {formatCurrency(item.value)}
                </span>
              </div>

              {/* Phần trăm */}
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '850', 
                color: item.color, 
                background: `${item.color}12`, 
                padding: '2px 6px', 
                borderRadius: '8px',
                alignSelf: 'center',
                flexShrink: 0
              }}>
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Budget() {
  const { isLoggedIn, userData, categories } = useAppContext();
  const { t, language, tCategory } = useLanguage();
  
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  // Time-Proportional budget calculation variables
  const currentNow = new Date();
  const currentMonthNum = currentNow.getMonth() + 1;
  const currentYearNum = currentNow.getFullYear();
  const todayDay = currentNow.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  
  let timePct = 0;
  if (year < currentYearNum || (year === currentYearNum && month < currentMonthNum)) {
    timePct = 100;
  } else if (year > currentYearNum || (year === currentYearNum && month > currentMonthNum)) {
    timePct = 0;
  } else {
    timePct = Math.round((todayDay / daysInMonth) * 100);
  }
  const [budgetsList, setBudgetsList] = useState<any[]>([]);
  const [prevBudgetsList, setPrevBudgetsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // States for Budget History
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [budgetHistory, setBudgetHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // States for Add/Update Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // empty string means overall monthly budget
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // States to calculate real-time used_amount on frontend
  const [currentMonthTransactions, setCurrentMonthTransactions] = useState<any[]>([]);
  const [prevMonthTransactions, setPrevMonthTransactions] = useState<any[]>([]);

  // Helper to get category ID and all its children/subcategories IDs recursively
  const getCategoryAndChildrenIds = useCallback((catId: string | null): string[] => {
    if (!catId) return [];
    const ids: string[] = [catId];
    
    const findChildren = (cats: any[]) => {
      cats.forEach(c => {
        if (c.parent_id === catId || ids.includes(c.parent_id)) {
          if (!ids.includes(c.id)) {
            ids.push(c.id);
          }
        }
        if (c.children && c.children.length > 0) {
          findChildren(c.children);
        }
      });
    };

    let prevLength = 0;
    while (ids.length > prevLength) {
      prevLength = ids.length;
      findChildren(categories);
    }
    return ids;
  }, [categories]);

  // Helper to calculate used amount based on transaction list
  const getBudgetRealtimeUsedAmount = useCallback((budget: any, transList: any[]) => {
    if (budget.category_id === null) {
      return transList
        .filter((t: any) => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount_in_user_currency || t.amount || 0)), 0);
    }
    const catIds = getCategoryAndChildrenIds(budget.category_id);
    return transList
      .filter((t: any) => t.type === 'expense' && t.category_id && catIds.includes(t.category_id))
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount_in_user_currency || t.amount || 0)), 0);
  }, [getCategoryAndChildrenIds]);

  // Toast notification state
  const [toasts, setToasts] = useState<{id: number; message: string; type: 'success' | 'error' | 'info'}[]>([]);
  const toastIdRef = useRef(0);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void}>({isOpen: false, title: '', message: '', onConfirm: () => {}});
  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({isOpen: true, title, message, onConfirm});
  }, []);
  const closeConfirm = useCallback(() => setConfirmDialog(prev => ({...prev, isOpen: false})), []);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedCategory('');
    setLimitAmount('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (budget: any) => {
    setIsEditMode(true);
    setSelectedCategory(budget.category_id || '');
    // Convert limit_amount to float then string to remove trailing decimals if any
    setLimitAmount(parseFloat(budget.limit_amount).toString());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedCategory('');
    setLimitAmount('');
  };

  // States for expanding transactions under budget
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [categoryTransactions, setCategoryTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false);

  const handleToggleExpand = async (budget: any) => {
    if (expandedBudgetId === budget.id) {
      setExpandedBudgetId(null);
      setCategoryTransactions([]);
      return;
    }

    setExpandedBudgetId(budget.id);
    setIsLoadingTransactions(true);
    setCategoryTransactions([]);

    try {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const totalDays = new Date(year, month, 0).getDate();
      const start_date = `${year}-${pad(month)}-01`;
      const end_date = `${year}-${pad(month)}-${pad(totalDays)}`;
      
      const params: any = {
        start_date,
        end_date,
        per_page: 50,
        type: 'expense'
      };
      
      if (budget.category_id) {
        params.category_id = budget.category_id;
      }

      const res = await transactionApi.getAll(params);
      const list = res.data?.data || res.data || [];
      setCategoryTransactions(list);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Fetch budgets
  const fetchBudgets = async () => {
    if (!isLoggedIn) return;
    
    const cacheKey = `cached_budget_data_${month}_${year}`;
    const hasCache = budgetsList.length > 0 || (typeof window !== 'undefined' && localStorage.getItem(cacheKey));
    if (!hasCache) {
      setIsLoading(true);
    }

    try {
      const res = await budgetApi.getAll(month, year);
      const resBudgetsList = res.data || [];
      setBudgetsList(resBudgetsList);

      // Fetch all transactions for this month to calculate real-time used_amount
      const pad = (n: number) => n.toString().padStart(2, '0');
      const totalDays = new Date(year, month, 0).getDate();
      const start_date = `${year}-${pad(month)}-01`;
      const end_date = `${year}-${pad(month)}-${pad(totalDays)}`;
      
      let resCurrentTransactions = [];
      try {
        const transRes = await transactionApi.getAll({
          start_date,
          end_date,
          per_page: 1000
        });
        resCurrentTransactions = transRes.data?.data || transRes.data || [];
        setCurrentMonthTransactions(resCurrentTransactions);
      } catch (transErr) {
        console.error('Error fetching current month transactions:', transErr);
      }

      // Fetch previous month's budgets for comparison
      const prevM = month === 1 ? 12 : month - 1;
      const prevY = month === 1 ? year - 1 : year;
      
      let resPrevBudgetsList = [];
      let resPrevTransactions = [];
      try {
        const prevRes = await budgetApi.getAll(prevM, prevY);
        resPrevBudgetsList = prevRes.data || [];
        setPrevBudgetsList(resPrevBudgetsList);

        const prevTotalDays = new Date(prevY, prevM, 0).getDate();
        const prev_start_date = `${prevY}-${pad(prevM)}-01`;
        const prev_end_date = `${prevY}-${pad(prevM)}-${pad(prevTotalDays)}`;
        const prevTransRes = await transactionApi.getAll({
          start_date: prev_start_date,
          end_date: prev_end_date,
          per_page: 1000
        });
        resPrevTransactions = prevTransRes.data?.data || prevTransRes.data || [];
        setPrevMonthTransactions(resPrevTransactions);
      } catch (prevErr) {
        console.error('Error fetching previous month budgets/transactions:', prevErr);
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify({
          budgetsList: resBudgetsList,
          prevBudgetsList: resPrevBudgetsList,
          currentMonthTransactions: resCurrentTransactions,
          prevMonthTransactions: resPrevTransactions
        }));
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Immediate load from cache when month/year changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cacheKey = `cached_budget_data_${month}_${year}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.budgetsList) setBudgetsList(parsed.budgetsList);
          if (parsed.prevBudgetsList) setPrevBudgetsList(parsed.prevBudgetsList);
          if (parsed.currentMonthTransactions) setCurrentMonthTransactions(parsed.currentMonthTransactions);
          if (parsed.prevMonthTransactions) setPrevMonthTransactions(parsed.prevMonthTransactions);
        } catch (e) {}
      }
    }
  }, [month, year]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchBudgets();
    }
  }, [isLoggedIn, month, year]);

  // Fetch budget history (6 tháng gần nhất, trừ tháng đang chọn)
  const fetchBudgetHistory = async () => {
    if (!isLoggedIn) return;
    setIsLoadingHistory(true);
    try {
      const history: any[] = [];
      for (let i = 1; i <= 6; i++) {
        let hMonth = month - i;
        let hYear = year;
        while (hMonth <= 0) {
          hMonth += 12;
          hYear -= 1;
        }
        const res = await budgetApi.getAll(hMonth, hYear);
        const data = res.data || [];
        if (data.length > 0) {
          const overall = data.find((b: any) => b.category_id === null);
          const cats = data.filter((b: any) => b.category_id !== null);
          const limit = overall ? parseFloat(overall.limit_amount) : cats.reduce((s: number, b: any) => s + parseFloat(b.limit_amount), 0);
          const used = overall ? Math.abs(parseFloat(overall.used_amount)) : cats.reduce((s: number, b: any) => s + Math.abs(parseFloat(b.used_amount)), 0);
          history.push({ month: hMonth, year: hYear, limit, used, count: data.length });
        }
      }
      setBudgetHistory(history);
    } catch (e) {
      console.error('Error fetching budget history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory && isLoggedIn && budgetHistory.length === 0) {
      fetchBudgetHistory();
    }
  }, [showHistory, isLoggedIn]);

  // Handle URL parameters for auto-expanding budget category
  useEffect(() => {
    if (typeof window !== 'undefined' && budgetsList.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const categoryId = urlParams.get('categoryId');
      const autoExpandTitle = urlParams.get('autoExpandTitle');
      
      if (!categoryId && !autoExpandTitle) return;

      let targetBudget = null;
      if (categoryId) {
        targetBudget = budgetsList.find((b: any) => String(b.category_id) === categoryId);
      } else if (autoExpandTitle) {
        const titleDecoded = decodeURIComponent(autoExpandTitle).toLowerCase();
        targetBudget = budgetsList.find((b: any) => {
          const rawName = (b.category?.name || '').toLowerCase();
          const translatedName = (tCategory(b.category?.name) || '').toLowerCase();
          return rawName === titleDecoded || rawName.includes(titleDecoded) || 
                 translatedName === titleDecoded || translatedName.includes(titleDecoded);
        });
      }

      if (targetBudget) {
        if (expandedBudgetId !== targetBudget.id) {
          handleToggleExpand(targetBudget);
        }
        window.history.replaceState({}, '', '/budget');
        
        // Scroll to it
        setTimeout(() => {
          const element = document.getElementById(`budget-item-${targetBudget.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.transition = 'box-shadow 0.5s ease';
            element.style.boxShadow = '0 0 20px rgba(254, 92, 115, 0.4)';
            setTimeout(() => {
              element.style.boxShadow = '';
            }, 2000);
          }
        }, 500);
      }
    }
  }, [budgetsList]);

  // Flatten categories list for dropdown selection
  const flatCategories = useMemo(() => {
    const flatten = (cats: any[], prefix = ''): any[] => {
      let result: any[] = [];
      cats.forEach(cat => {
        const emoji = parseIcon(cat.icon || '');
        result.push({ ...cat, displayName: prefix + emoji + ' ' + tCategory(cat.name) });
        if (cat.children && cat.children.length > 0) {
          result = [...result, ...flatten(cat.children, prefix + '— ')];
        }
      });
      return result;
    };
    return flatten(categories);
  }, [categories]);

  // Dynamically inject real-time used_amount into the budget lists
  const budgetsWithRealtimeUsage = useMemo(() => {
    return budgetsList.map(b => ({
      ...b,
      used_amount: getBudgetRealtimeUsedAmount(b, currentMonthTransactions)
    }));
  }, [budgetsList, currentMonthTransactions, getBudgetRealtimeUsedAmount]);

  const prevBudgetsWithRealtimeUsage = useMemo(() => {
    return prevBudgetsList.map(b => ({
      ...b,
      used_amount: getBudgetRealtimeUsedAmount(b, prevMonthTransactions)
    }));
  }, [prevBudgetsList, prevMonthTransactions, getBudgetRealtimeUsedAmount]);

  // Calculate overall budget stats
  const overallBudget = budgetsWithRealtimeUsage.find(b => b.category_id === null);
  const categoryBudgets = budgetsWithRealtimeUsage.filter(b => b.category_id !== null);

  const fallbackColors = [
    '#FE5C73', '#FBBF24', '#A78BFA', '#F472B6', '#FB923C', '#E83E8C',
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#14B8A6',
    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E',
    '#9F1239', '#C2410C', '#B45309', '#4D7C0F', '#047857', '#0F766E'
  ];


  const rawTotalLimit = overallBudget 
    ? parseFloat(overallBudget.limit_amount) 
    : categoryBudgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0);
  const totalLimit = isNaN(rawTotalLimit) || !isFinite(rawTotalLimit) ? 0 : rawTotalLimit;

  const rawTotalUsed = overallBudget 
    ? Math.abs(parseFloat(overallBudget.used_amount)) 
    : categoryBudgets.reduce((sum, b) => sum + Math.abs(parseFloat(b.used_amount)), 0);
  const totalUsed = isNaN(rawTotalUsed) || !isFinite(rawTotalUsed) ? 0 : rawTotalUsed;

  const totalPct = (totalLimit > 0 && isFinite(totalLimit) && !isNaN(totalLimit) && isFinite(totalUsed) && !isNaN(totalUsed)) 
    ? Math.round((totalUsed / totalLimit) * 100) 
    : 0;
  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return '0';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericAmount);
  };
  const fmt = (n: number) => formatCurrency(n);

  // Calculate total days in month
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  
  // Calculate passed days in selected month
  const getPassedDays = () => {
    const today = new Date();
    if (today.getFullYear() === year && (today.getMonth() + 1) === month) {
      return today.getDate();
    }
    return totalDaysInMonth; // If it's a past/future month
  };
  
  const passedDays = Math.max(getPassedDays(), 1);
  
  // Stats calculations
  const remainingAmount = Math.max(totalLimit - totalUsed, 0);
  const averagePerDay = (isNaN(totalUsed) || !isFinite(totalUsed) || isNaN(passedDays) || passedDays <= 0) ? 0 : totalUsed / passedDays;
  const projectedTotal = averagePerDay * totalDaysInMonth;
  const isOverBudget = totalUsed > totalLimit;

  // Previous month comparison calculations
  const prevOverallBudget = prevBudgetsWithRealtimeUsage.find(b => b.category_id === null);
  const prevCategoryBudgets = prevBudgetsWithRealtimeUsage.filter(b => b.category_id !== null);
  
  const rawPrevTotalUsed = prevOverallBudget
    ? Math.abs(parseFloat(prevOverallBudget.used_amount))
    : prevCategoryBudgets.reduce((sum, b) => sum + Math.abs(parseFloat(b.used_amount)), 0);
  const prevTotalUsed = isNaN(rawPrevTotalUsed) || !isFinite(rawPrevTotalUsed) ? 0 : rawPrevTotalUsed;

  const rawPrevTotalLimit = prevOverallBudget
    ? parseFloat(prevOverallBudget.limit_amount)
    : prevCategoryBudgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0);
  const prevTotalLimit = isNaN(rawPrevTotalLimit) || !isFinite(rawPrevTotalLimit) ? 0 : rawPrevTotalLimit;

  const totalDiff = totalUsed - prevTotalUsed;
  const totalPctDiff = (prevTotalUsed > 0 && isFinite(prevTotalUsed) && !isNaN(prevTotalUsed) && isFinite(totalDiff) && !isNaN(totalDiff)) 
    ? Math.round((totalDiff / prevTotalUsed) * 50) 
    : null;

  // Create or update budget
  const handleSaveBudget = async () => {
    if (!limitAmount || parseFloat(limitAmount) <= 0) {
      showToast(t('invalid_limit_msg'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await budgetApi.createOrUpdate({
        category_id: selectedCategory ? selectedCategory : null,
        limit_amount: parseFloat(limitAmount),
        month,
        year
      });
      handleCloseModal();
      showToast(t('save_budget_success'), 'success');
      await fetchBudgets();
    } catch (error: any) {
      showToast(error.message || t('save_budget_error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete budget
  const handleDeleteBudget = async (id: string) => {
    showConfirm(t('delete_budget_confirm_title'), t('delete_budget_confirm_msg'), async () => {
      try {
        await budgetApi.delete(id);
        showToast(t('delete_budget_success'), 'success');
        await fetchBudgets();
      } catch (error: any) {
        showToast(error.message || t('delete_budget_error'), 'error');
      }
    });
  };

  // Copy budgets from previous month
  const handleCopyBudgets = async () => {
    const fromMonth = month === 1 ? 12 : month - 1;
    const fromYear = month === 1 ? year - 1 : year;

    showConfirm(t('copy_budget_confirm_title'), t('copy_budget_confirm_msg').replace('{from}', `${fromMonth}/${fromYear}`).replace('{to}', `${month}/${year}`), async () => {
      setIsLoading(true);
      try {
        const res = await budgetApi.copy({
          from_month: fromMonth,
          from_year: fromYear,
          to_month: month,
          to_year: year
        });
        showToast(t('copy_budget_success').replace('{count}', (res.data?.length || 0).toString()), 'success');
        await fetchBudgets();
      } catch (error: any) {
        showToast(error.message || t('copy_budget_error'), 'error');
      } finally {
        setIsLoading(false);
      }
    });
  };
  
  const maxUsed = Math.max(totalUsed, prevTotalUsed, 1);
  const prevBarHeight = (prevTotalUsed && isFinite(prevTotalUsed) && !isNaN(prevTotalUsed) && isFinite(maxUsed) && maxUsed > 0) ? (prevTotalUsed / maxUsed) * 120 : 0;
  const currBarHeight = (totalUsed && isFinite(totalUsed) && !isNaN(totalUsed) && isFinite(maxUsed) && maxUsed > 0) ? (totalUsed / maxUsed) * 120 : 0;
  const limitLineHeight = (totalLimit > 0 && isFinite(totalLimit) && !isNaN(totalLimit) && isFinite(maxUsed) && maxUsed > 0) ? (totalLimit / maxUsed) * 120 : 0;


  return (
    <div className="dashboard-container">
      <Sidebar activeItem="budget" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar" style={{background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)',backdropFilter:'blur(10px)',position:'sticky',top:0,zIndex:10}}>
          <h1 className="page-title" style={{color:'var(--text-main)'}}>{t('budget')}</h1>
          <div className="nav-actions" style={{display:'flex', alignItems:'center', gap:'12px'}}>
            
            {/* CHỌN THÁNG/NĂM */}
            <div style={{display:'flex', gap:'8px', marginRight: '10px'}}>
              <select 
                value={month} 
                onChange={e => setMonth(parseInt(e.target.value))}
                className="budget-select"
              >
                {Array.from({length:12}, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{t(`month_${m}`)}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={e => setYear(parseInt(e.target.value))}
                className="budget-select"
              >
                {Array.from({length:7}, (_, i) => now.getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{t('year_label')} {y}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleOpenAddModal}
              className="budget-btn-primary"
            >
              {t('set_budget')}
            </button>
            <button 
              onClick={handleCopyBudgets}
              className="budget-btn-secondary"
            >
              {t('copy_from_previous_month')}
            </button>
            
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
        
        <div className="content-area">
          {/* TỔNG QUAN NGÂN SÁCH */}
          <div className="bdg-card-animate budget-overall-card">
            {/* Chip thẻ giả lập */}
            <div className="budget-card-chip"></div>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', position: 'relative', zIndex: 5}}>
              <div style={{fontSize:'14.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.95}}>
                {overallBudget ? t('total_monthly_budget_title') : t('total_category_budget_title')} - {language === 'vi' ? `${t(`month_${month}`)}/${year}` : `${t(`month_${month}`)} ${year}`}
              </div>
              {overallBudget && (
                <div style={{display:'flex', gap:'10px'}}>
                  <button 
                    onClick={() => handleToggleExpand(overallBudget)}
                    className="budget-overall-btn"
                  >
                    {expandedBudgetId === overallBudget.id ? `▲ ${t('close_details')}` : `👁️ ${t('view_details')}`}
                  </button>
                  <button 
                    onClick={() => handleOpenEditModal(overallBudget)}
                    className="budget-overall-btn"
                  >
                    {t('edit_limit')}
                  </button>
                  <button 
                    onClick={() => handleDeleteBudget(overallBudget.id)}
                    className="budget-overall-btn"
                  >
                    {t('delete_total_limit')}
                  </button>
                </div>
              )}
            </div>
            <div style={{fontSize:'40px', fontWeight:'900', marginBottom:'20px', letterSpacing: '-1px', position: 'relative', zIndex: 5}}>
              {fmt(totalUsed)} <span style={{fontSize: '24px', opacity: 12.2, fontWeight: '500'}}>/</span> {fmt(totalLimit)}
            </div>
            <div className="budget-progress-track" style={{ position: 'relative', overflow: 'visible' }}>
                <div 
                  style={{
                    width: `${Math.min(totalPct, 100)}%`,
                    background: totalPct >= 100 ? '#EF4444' : totalPct >= timePct + 15 ? '#F59E0B' : '#10B981'
                  }} 
                  className="budget-progress-bar shimmer-fill"
                ></div>
                
                {/* Time Indicator Line */}
                {timePct > 0 && timePct < 100 && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: `${timePct}%`,
                      width: '0',
                      height: '100%',
                      borderLeft: '1.5px dashed rgba(255, 255, 255, 0.65)',
                      zIndex: 3
                    }} 
                    title={`Mốc thời gian hiện tại: Ngày ${todayDay}/${daysInMonth} (${timePct}%)`}
                  />
                )}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'14px', fontSize:'13.5px', fontWeight: '700', opacity: 0.82, alignItems:'center', position: 'relative', zIndex: 5}}>
                <span>
                  {t('used_label')} {totalPct}%
                  {totalLimit > 0 && (
                    <span style={{ fontSize: '12px', marginLeft: '8px', fontWeight: '500', opacity: 0.9 }}>
                      {totalPct >= 100 ? (
                        ' (Vượt hạn mức 🚨)'
                      ) : totalPct > timePct + 15 ? (
                        ` (Tiêu nhanh ⚠️ - Ngày ${todayDay}/${daysInMonth})`
                      ) : (
                        ` (Chi tiêu an toàn ✓ - Ngày ${todayDay}/${daysInMonth})`
                      )}
                    </span>
                  )}
                </span>
                <span style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  {totalUsed > totalLimit && totalLimit > 0 && <span style={{background: 'rgba(58, 25, 175, 0.35)', color: '#e61111', padding: '2px 8px', borderRadius: '6px'}}>{t('over_limit_by')} {fmt(totalUsed - totalLimit)}</span>}
                  {totalPctDiff !== null && (
                    <span style={{padding:'2.5px 8px', background: totalPctDiff > 0 ? 'rgba(220, 18, 28, 0.35)' : 'hsla(359, 93%, 56%, 0.35)', color: totalPctDiff > 0 ? '#FFD2D7' : '#e62542', borderRadius:'6px', fontSize:'12px'}}>
                      {totalPctDiff > 0 ? `↑ +${totalPctDiff}%` : totalPctDiff < 0 ? `↓ ${totalPctDiff}%` : t('equal_to_last_month')}
                    </span>
                  )}
                </span>
            </div>

            {/* Collapsible Transactions for Overall Budget */}
            {overallBudget && expandedBudgetId === overallBudget.id && (
              <div style={{marginTop:'24px', borderTop:'1px dashed rgba(255,255,255,0.25)', paddingTop:'22px', width:'100%', position: 'relative', zIndex: 5}}>
                <div style={{fontWeight:'800', fontSize:'14.5px', color:'#fff', marginBottom:'14px', letterSpacing: '0.5px'}}>
                  {t('transactions_in_month')} ({categoryTransactions.length})
                </div>
                {isLoadingTransactions ? (
                  <div style={{fontSize:'13px', color:'rgba(255,255,255,0.7)', textAlign:'center', padding:'10px'}}>{t('loading_transactions')}</div>
                ) : categoryTransactions.length > 0 ? (
                  <div style={{maxHeight:'210px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'10px', paddingRight:'4px'}}>
                    {categoryTransactions.map((tx: any) => (
                      <div key={tx.id} className="budget-tx-row-overall">
                        <div style={{display:'flex', flexDirection:'column', gap:'3px', maxWidth:'65%'}}>
                          <span style={{fontWeight:'700', color:'#fff', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap'}}>{tx.title}</span>
                          <span style={{fontSize:'11px', color:'rgba(255,255,255,0.75)', fontWeight: '600'}}>{new Date(tx.transaction_date).toLocaleDateString('vi-VN')} • {tx.category?.name || 'Chưa phân loại'}</span>
                        </div>
                        <span style={{fontWeight:'850', color:'#FFD2D7'}}>
                          -{fmt(parseFloat(tx.amount_in_user_currency || tx.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{fontSize:'13px', color:'rgba(255,255,255,0.7)', textAlign:'center', padding:'10px'}}>{t('no_transactions_found_budget')}</div>
                )}
              </div>
            )}
          </div>

          {/* STATS GRID */}
          <div className="budget-stat-grid">
            {/* Stat 1: Remaining */}
            <div 
              className="bdg-card-animate budget-stat-card" 
              style={{
                animationDelay: '0.08s',
                '--stat-glow-color': 'rgba(16, 185, 129, 0.15)',
                '--stat-glow-shadow': 'rgba(16, 185, 129, 0.12)',
                '--stat-border-hover': '#e00c0c'
              } as React.CSSProperties}
            >
              <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px'}}>
                <div className="budget-stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  {renderSvgIcon('wallet')}
                </div>
                <span style={{fontSize:'14px', color:'#718EBF', fontWeight:'700'}}>{t('remaining')}</span>
              </div>
              <div style={{fontSize:'22px', fontWeight:'850', color: isOverBudget ? '#FE5C73' : 'var(--text-main)', letterSpacing: '-0.5px'}}>
                {isOverBudget ? `${t('over_limit_by')} ${fmt(totalUsed - totalLimit)}` : fmt(remainingAmount)}
              </div>
              <div style={{fontSize:'12px', color:'#718EBF', marginTop:'6px'}}>
                {isOverBudget ? t('all_budget_used') : t('current_available_balance')}
              </div>
            </div>

            {/* Stat 2: Average Spend per Day */}
            <div 
              className="bdg-card-animate budget-stat-card" 
              style={{
                animationDelay: '0.16s',
                '--stat-glow-color': 'rgba(59, 130, 246, 0.15)',
                '--stat-glow-shadow': 'rgba(59, 130, 246, 0.12)',
                '--stat-border-hover': '#3B82F6'
              } as React.CSSProperties}
            >
              <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px'}}>
                <div className="budget-stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  {renderSvgIcon('calendar')}
                </div>
                <span style={{fontSize:'14px', color:'#718EBF', fontWeight:'700'}}>{t('avg_per_day')}</span>
              </div>
              <div style={{fontSize:'22px', fontWeight:'850', color:'var(--text-main)', letterSpacing: '-0.5px'}}>
                {fmt(averagePerDay)}
              </div>
              <div style={{fontSize:'12px', color:'#718EBF', marginTop:'6px'}}>
                {t('based_on_passed_days').replace('{days}', passedDays.toString())}
              </div>
            </div>

            {/* Stat 3: Month End Forecast */}
            <div 
              className="bdg-card-animate budget-stat-card" 
              style={{
                animationDelay: '0.24s',
                '--stat-glow-color': 'rgba(245, 158, 11, 0.15)',
                '--stat-glow-shadow': 'rgba(245, 158, 11, 0.12)',
                '--stat-border-hover': '#F59E0B'
              } as React.CSSProperties}
            >
              <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px'}}>
                <div className="budget-stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  {renderSvgIcon('forecast')}
                </div>
                <span style={{fontSize:'14px', color:'#718EBF', fontWeight:'700'}}>{t('month_end_forecast')}</span>
              </div>
              <div style={{fontSize:'22px', fontWeight:'850', color: projectedTotal > totalLimit && totalLimit > 0 ? '#FE5C73' : '#f0181f', letterSpacing: '-0.5px'}}>
                {fmt(projectedTotal)}
              </div>
              <div style={{fontSize:'12px', color:'#718EBF', marginTop:'6px'}}>
                {projectedTotal > totalLimit && totalLimit > 0 ? t('projected_over_budget') : t('projected_within_budget')}
              </div>
            </div>

            {/* Stat 4: Category Budgets Count */}
            <div 
              className="bdg-card-animate budget-stat-card" 
              style={{
                animationDelay: '0.32s',
                '--stat-glow-color': 'rgba(139, 92, 246, 0.15)',
                '--stat-glow-shadow': 'rgba(139, 92, 246, 0.12)',
                '--stat-border-hover': '#8B5CF6'
              } as React.CSSProperties}
            >
              <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px'}}>
                <div className="budget-stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  {renderSvgIcon('limit')}
                </div>
                <span style={{fontSize:'14px', color:'#718EBF', fontWeight:'700'}}>{t('category_limits_count')}</span>
              </div>
              <div style={{fontSize:'22px', fontWeight:'850', color:'var(--text-main)', letterSpacing: '-0.5px'}}>
                {categoryBudgets.length} {t('categories_unit')}
              </div>
              <div style={{fontSize:'12px', color:'#718EBF', marginTop:'6px'}}>
                {t('out_of_total_categories').replace('{total}', categories.length.toString())}
              </div>
            </div>
          </div>


          {/* CHARTS GRID */}
          {!isLoading && categoryBudgets.length > 0 && (
            <div className="budget-charts-grid">
              {/* BIỂU ĐỒ TRÒN CƠ CẤU CHI TIÊU */}
              <div className="bdg-card-animate budget-chart-card" style={{ animationDelay: '0.4s' }}>
                <h3 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                  <span>📊</span> {t('spending_structure_by_category')}
                </h3>
                <BudgetDoughnutChart data={categoryBudgets.map((b, i) => ({
                  name: tCategory(b.category?.name) || t('other_category'),
                  value: Math.abs(parseFloat(b.used_amount)),
                  color: fallbackColors[i % fallbackColors.length],
                  icon: parseIcon(b.category?.icon || 'grid')
                }))} />
              </div>

              {/* COMPARISON CARD */}
              {(prevTotalLimit > 0 || prevTotalUsed > 0) ? (
                <div className="bdg-card-animate budget-chart-card" style={{
                  animationDelay: '0.45s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '750', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1814F3' }}>
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                      {t('compare_spending_with_last_month')}
                    </h3>
                    <p style={{fontSize: '13px', color: '#718EBF', margin: '0 0 20px 0'}}>
                      {totalDiff > 0 ? (
                        <span>{t('spending_this_month')} <strong style={{color: '#FE5C73'}}>{t('increased')} {fmt(totalDiff)} ({totalPctDiff}%)</strong> {t('compared_to_last_month')}.</span>
                      ) : totalDiff < 0 ? (
                        <span>{t('spending_this_month')} <strong style={{color: '#16DBCC'}}>{t('decreased')} {fmt(Math.abs(totalDiff))} ({Math.abs(totalPctDiff || 0)}%)</strong> {t('compared_to_last_month')}.</span>
                      ) : (
                        <span>{t('spending_equal_last_month')}</span>
                      )}
                    </p>
                  </div>

                  <div className="compare-chart-container">
                    {/* Limit threshold indicator */}
                    {limitLineHeight > 0 && limitLineHeight <= 120 && (
                      <div className="compare-limit-line" style={{ bottom: `${limitLineHeight + 20}px` }}>
                        <span className="compare-limit-label">{t('limit_label')}</span>
                      </div>
                    )}

                    {/* Column 1: Last Month */}
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2}}>
                      <div style={{fontSize: '11px', fontWeight: '700', color: '#718EBF'}}>{fmt(prevTotalUsed)}</div>
                      <div 
                        className="compare-bar-prev" 
                        style={{ height: `${prevBarHeight}px` }}
                      ></div>
                      <div style={{fontSize: '11px', fontWeight: '600', color: 'var(--text-main)', textAlign: 'center'}}>
                        {t(`month_${month === 1 ? 12 : month - 1}`)} {month === 1 ? year - 1 : year}
                      </div>
                    </div>

                    {/* Column 2: This Month */}
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2}}>
                      <div style={{fontSize: '11px', fontWeight: '750', color: '#1814F3'}}>{fmt(totalUsed)}</div>
                      <div 
                        className="compare-bar-curr" 
                        style={{ height: `${currBarHeight}px` }}
                      ></div>
                      <div style={{fontSize: '11px', fontWeight: '600', color: 'var(--text-main)', textAlign: 'center'}}>
                        {t(`month_${month}`)} {year}
                      </div>
                    </div>
                  </div>

                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#718EBF', marginTop: '16px'}}>
                    <span>{t('prev_month_limit')}: <strong>{fmt(prevTotalLimit)}</strong></span>
                    <span>{t('curr_month_limit')}: <strong>{fmt(totalLimit)}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="bdg-card-animate budget-empty-state" style={{ animationDelay: '0.45s', margin: 0, width: '100%', maxWidth: '100%', padding: '30px' }}>
                  <div className="budget-empty-icon">📈</div>
                  <h4 className="budget-empty-title">{t('no_comparison_data')}</h4>
                  <p className="budget-empty-desc" style={{ fontSize: '12px', margin: 0 }}>
                    {t('no_comparison_data_desc')}
                  </p>
                </div>
              )}


            </div>
          )}

          {/* LƯỚI NGÂN SÁCH DANH MỤC */}
          {isLoading ? (
            <div style={{display:'flex', justifyContent:'center', padding:'80px', color:'var(--text-main)', fontSize:'16px'}}>{t('loading')}...</div>
          ) : categoryBudgets.length > 0 ? (
            <div className="budget-grid">
              {categoryBudgets.map((b,i)=>{
                const rawLimit = parseFloat(b.limit_amount);
                const limit = isNaN(rawLimit) || !isFinite(rawLimit) ? 0 : rawLimit;
                const rawUsed = Math.abs(parseFloat(b.used_amount));
                const used = isNaN(rawUsed) || !isFinite(rawUsed) ? 0 : rawUsed;
                const pct = (limit > 0 && isFinite(limit) && !isNaN(limit) && isFinite(used) && !isNaN(used)) ? Math.round(used/limit*100) : 0;
                const catName = tCategory(b.category?.name) || t('other_category');
                const catIcon = parseIcon(b.category?.icon || 'grid');
                const catColor = fallbackColors[i % fallbackColors.length];
                
                const prevB = prevBudgetsList.find(pb => pb.category_id === b.category_id);
                const prevUsed = prevB ? Math.abs(parseFloat(prevB.used_amount)) : 0;
                const diff = used - prevUsed;
                const pctDiff = (prevUsed > 0 && isFinite(prevUsed) && !isNaN(prevUsed) && isFinite(diff) && !isNaN(diff)) ? Math.round((diff / prevUsed) * 100) : null;
                
                return(
                  <div 
                    key={b.id} 
                    id={`budget-item-${b.id}`}
                    className={`bdg-card-animate budget-card ${pct <= 100 ? 'exceeded pulse-exceeded' : ''}`} 
                    style={{
                      animationDelay: `${i * 0.07}s`,
                      '--cat-color-glow': `${catColor}1c`,
                      '--cat-color-border': `${catColor}65`
                    } as React.CSSProperties}
                  >
                    <div>
                      <div className="budget-card-header">
                        <div 
                          onClick={() => handleToggleExpand(b)}
                          className="budget-card-title"
                          title={t('click_to_view_tx')}
                        >
                          <div className="budget-icon-circle" style={{ background: `${catColor}15` }}>{catIcon}</div>
                          <div>
                            <div style={{fontWeight:'750', color:'var(--text-main)', display:'flex', alignItems:'center', gap:'6px', fontSize: '14.5px'}}>
                              {catName}
                              <span style={{fontSize:'10px', color:'#718EBF', opacity: 0.8}}>
                                {expandedBudgetId === b.id ? '▲' : '▼'}
                              </span>
                            </div>
                            <div style={{fontSize:'12.5px', color:'#718EBF', fontWeight: '600', marginTop: '2px'}}>{t('limit_label')} {fmt(limit)}</div>
                          </div>
                        </div>
                        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px'}}>
                          {pct>=80 && (
                            <span style={{padding:'4px 10px', borderRadius:'20px', fontSize:'10.5px', fontWeight:'700', background:pct>=100?'rgba(239, 68, 68, 0.12)':'rgba(245, 158, 11, 0.12)', color:pct>=100?'#EF4444':'#F59E0B', whiteSpace:'nowrap'}}>
                              {pct>=100?t('over_budget'):t('almost_empty')}
                            </span>
                          )}
                          <div className="budget-actions-slide">
                            <button 
                              onClick={() => handleOpenEditModal(b)}
                              style={{background:'none', border:'none', color:'#1814F3', fontSize:'12.5px', fontWeight:'700', cursor:'pointer', padding:'2px 4px'}}
                            >
                              {t('edit_label')}
                            </button>
                            <button 
                              onClick={() => handleDeleteBudget(b.id)}
                              style={{background:'none', border:'none', color:'#FE5C73', fontSize:'12.5px', fontWeight:'700', cursor:'pointer', padding:'2px 4px'}}
                            >
                              {t('delete_label')}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="budget-progress-track" style={{ height: '10px', marginBottom: '8px', position: 'relative', overflow: 'visible' }}>
                        <div 
                          style={{
                            width: `${Math.min(pct, 100)}%`, 
                            background: pct >= 100 ? '#EF4444' : pct >= timePct + 15 ? '#F59E0B' : '#10B981'
                          }} 
                          className="budget-progress-bar"
                        ></div>
                        
                        {/* Time Indicator Line */}
                        {timePct > 0 && timePct < 100 && (
                          <div 
                            style={{
                              position: 'absolute',
                              top: '0',
                              left: `${timePct}%`,
                              width: '0',
                              height: '100%',
                              borderLeft: '1.5px dashed rgba(24, 20, 243, 0.35)',
                              zIndex: 2
                            }} 
                            title={`Mốc thời gian hiện tại: Ngày ${todayDay}/${daysInMonth} (${timePct}%)`}
                          />
                        )}
                      </div>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', alignItems: 'center', marginTop: '4px'}}>
                      <span style={{color: pct >= 100 ? '#EF4444' : pct >= timePct + 15 ? '#F59E0B' : '#10B981', fontWeight:'750', fontSize: '13.5px'}}>{fmt(used)}</span>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        {pctDiff !== null && (
                          <span style={{fontSize:'10.5px', fontWeight:'700', color: pctDiff > 0 ? '#EF4444' : '#d11515', background: pctDiff > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', padding:'2px 6px', borderRadius:'10px'}}>
                            {pctDiff > 0 ? `↑ +${pctDiff}%` : `↓ ${pctDiff}%`}
                          </span>
                        )}
                        <span style={{color:'#718EBF', fontWeight: '700'}}>{pct}%</span>
                      </div>
                    </div>

                    {/* Collapsible Transactions List */}
                    {expandedBudgetId === b.id && (
                      <div className="budget-tx-list">  
                        <div style={{fontWeight:'800', fontSize:'13px', color:'var(--text-main)', marginBottom:'10px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" x2="21" y1="6" y2="6"/>
                            <line x1="8" x2="21" y1="12" y2="12"/>
                            <line x1="8" x2="21" y1="18" y2="18"/>
                            <line x1="3" x2="3.01" y1="6" y2="6"/>
                            <line x1="3" x2="3.01" y1="12" y2="12"/>
                            <line x1="3" x2="3.01" y1="18" y2="18"/>
                          </svg>
                          {t('transactions_in_month')} ({categoryTransactions.length})
                        </div>
                        {isLoadingTransactions ? (
                          <div style={{fontSize:'12px', color:'#718EBF', textAlign:'center', padding:'10px'}}>{t('loading_transactions')}</div>
                        ) : categoryTransactions.length > 0 ? (
                          <div style={{maxHeight:'165px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px', paddingRight:'4px'}}>
                            {categoryTransactions.map((tx: any) => (
                              <div key={tx.id} className="budget-tx-row">
                                <div style={{display:'flex', flexDirection:'column', gap:'2px', maxWidth:'65%'}}>
                                  <span style={{fontWeight:'700', color:'var(--text-main)', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap'}}>{tx.title}</span>
                                  <span style={{fontSize:'10px', color:'#718EBF', fontWeight: '600'}}>{new Date(tx.transaction_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                </div>
                                <span style={{fontWeight:'800', color: tx.type === 'income' ? '#10B981' : '#EF4444'}}>
                                  {tx.type === 'income' ? '+' : '-'}{fmt(parseFloat(tx.amount_in_user_currency || tx.amount))}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{fontSize:'12px', color:'#718EBF', textAlign:'center', padding:'10px'}}>{t('no_transactions_found_budget')}</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="budget-empty-state">
              <div className="budget-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h3 className="budget-empty-title">{t('no_budget_setup')}</h3>
              <p className="budget-empty-desc">{t('no_budget_desc')}</p>
              
              {/* Onboarding Guide steps */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                width: '100%',
                marginBottom: '32px',
                textAlign: 'left'
              }}>
                <div className="budget-onboard-step">
                  <div style={{fontSize: '14.5px', fontWeight: '800', color: '#1814F3', marginBottom: '8px'}}>1. {t('onboard_step1_title')}</div>
                  <div style={{fontSize: '12px', color: '#718EBF', lineHeight: '1.6', fontWeight: '500'}}>
                    {t('onboard_step1_desc')}
                  </div>
                </div>
                <div className="budget-onboard-step">
                  <div style={{fontSize: '14.5px', fontWeight: '800', color: '#1814F3', marginBottom: '8px'}}>2. {t('onboard_step2_title')}</div>
                  <div style={{fontSize: '12px', color: '#718EBF', lineHeight: '1.6', fontWeight: '500'}}>
                    {t('onboard_step2_desc')}
                  </div>
                </div>
                <div className="budget-onboard-step">
                  <div style={{fontSize: '14.5px', fontWeight: '800', color: '#1814F3', marginBottom: '8px'}}>3. {t('onboard_step3_title')}</div>
                  <div style={{fontSize: '12px', color: '#718EBF', lineHeight: '1.6', fontWeight: '500'}}>
                    {t('onboard_step3_desc')}
                  </div>
                </div>
              </div>

              <div style={{display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap'}}>
                <button 
                  onClick={handleOpenAddModal}
                  className="budget-btn-primary"
                  style={{ padding: '12px 28px' }}
                >
                  {t('set_new_budget')}
                </button>
                <button 
                  onClick={handleCopyBudgets}
                  className="budget-btn-secondary"
                  style={{ padding: '12px 28px' }}
                >
                  {t('copy_from_previous_month')}
                </button>
              </div>
            </div>
          )}

          {/* LỊCH SỬ NGÂN SÁCH CÁC THÁNG TRƯỚC */}
          {isLoggedIn && (
            <div style={{marginTop:'32px'}}>
              <div 
                onClick={() => setShowHistory(!showHistory)} 
                className="budget-history-header"
              >
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span style={{fontWeight:'750', color:'var(--text-main)', fontSize:'16px'}}>{t('past_months_budget_history')}</span>
                </div>
                <span style={{color:'#718EBF', fontSize:'20px', transition:'transform 0.3s', transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
              </div>

              {showHistory && (
                <div style={{marginTop:'20px'}}>
                  {isLoadingHistory ? (
                    <div style={{display:'flex', justifyContent:'center', padding:'40px', color:'var(--text-main)'}}>{t('loading')}...</div>
                  ) : budgetHistory.length > 0 ? (
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>
                      {budgetHistory.map((h, i) => {
                        const pct = (h.limit > 0 && isFinite(h.limit) && !isNaN(h.limit) && isFinite(h.used) && !isNaN(h.used)) ? Math.round((h.used / h.limit) * 100) : 0;
                        const barColor = pct <= 100 ? '#EF4444' : pct <= 80 ? '#dc2d39' : '#ff1111';
                        return (
                          <div 
                            key={i} 
                            className="budget-history-card"
                            onClick={() => { setMonth(h.month); setYear(h.year); setShowHistory(false); }}
                          >
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                              <span style={{fontWeight:'750', color:'var(--text-main)', fontSize:'15px'}}>
                                {language === 'vi' ? `${t(`month_${h.month}`)}/${h.year}` : `${t(`month_${h.month}`)} ${h.year}`}
                              </span>
                              <span style={{fontSize:'13px', fontWeight:'800', color: barColor}}>{pct}%</span>
                            </div>
                            <div className="budget-progress-track" style={{ height: '10px', marginBottom: '10px' }}>
                              <div style={{width:`${Math.min(pct, 100)}%`, background: barColor}} className="budget-progress-bar"></div>
                            </div>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#718EBF', fontWeight: '500'}}>
                              <span>{fmt(h.used)} / {fmt(h.limit)}</span>
                              <span>{h.count} {t('item_unit')}</span>
                            </div>
                            {pct >= 80 && (
                              <div style={{marginTop:'8px', fontSize:'12px', color:'#EF4444', fontWeight:'700'}}>{t('over_budget_alert')}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="budget-empty-state" style={{ padding: '40px 20px', margin: 0, width: '100%', maxWidth: '100%' }}>
                      <div className="budget-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#718EBF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <p style={{fontSize:'14px', margin:0, color:'#718EBF', fontWeight: '600'}}>{t('no_past_budgets')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* MODAL ĐẶT NGÂN SÁCH */}
      {isModalOpen && (
        <div className="budget-modal-overlay">
          <div className="budget-modal-content">
             <h2 style={{color: 'var(--text-main)',marginBottom:'24px',fontSize:'20px',fontWeight:'700'}}>
               {isEditMode ? t('edit_budget_limit') : t('setup_budget_limit')}
             </h2>
             
             <div style={{marginBottom:'20px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('apply_to_category') || 'Áp dụng cho'}</label>
               
               {/* Segmented Control */}
               <div className="budget-segmented-control">
                 <button
                   type="button"
                   disabled={isEditMode}
                   onClick={() => setSelectedCategory('')}
                   className={`budget-segmented-btn ${selectedCategory === '' ? 'active' : ''}`}
                   style={{
                     cursor: isEditMode ? 'not-allowed' : 'pointer',
                     opacity: isEditMode && selectedCategory !== '' ? 0.5 : 1
                   }}
                 >
                   {t('overall_budget_option') || 'Ngân sách chung'}
                 </button>
                 <button
                   type="button"
                   disabled={isEditMode}
                   onClick={() => {
                     const expenseParents = categories.filter((c: any) => c.type === 'expense');
                     let defaultSubId = '';
                     for (const parent of expenseParents) {
                       if (parent.children && parent.children.length > 0) {
                         defaultSubId = parent.children[0].id;
                         break;
                       }
                     }
                     setSelectedCategory(defaultSubId);
                   }}
                   className={`budget-segmented-btn ${selectedCategory !== '' ? 'active' : ''}`}
                   style={{
                     cursor: isEditMode ? 'not-allowed' : 'pointer',
                     opacity: isEditMode && selectedCategory === '' ? 0.5 : 1
                   }}
                 >
                   {t('by_category') || 'Theo danh mục'}
                 </button>
               </div>

               {/* Category Picker */}
               {selectedCategory !== '' && (
                 <CategoryPicker
                   value={selectedCategory}
                   onChange={(id) => setSelectedCategory(id)}
                   type="expense"
                   categories={categories}
                   tCategory={tCategory}
                   placeholder={t('select_category') || 'Chọn danh mục'}
                   disabled={isEditMode}
                 />
               )}
             </div>

             <div style={{marginBottom:'24px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('limit_amount_label')}</label>
               <input 
                 type="number" 
                 value={limitAmount} 
                 onChange={e=>setLimitAmount(e.target.value)} 
                 placeholder={t('limit_amount_placeholder')} 
                 className="budget-modal-input"
               />
             </div>
             
             <div className="budget-modal-actions">
               <button className="budget-btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>{t('cancel')}</button>
               <button 
                 className="budget-btn-primary" 
                 onClick={handleSaveBudget} 
                 disabled={isSubmitting}
               >
                 {isSubmitting ? t('saving_label') : t('save_budget_btn')}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmDialog.isOpen && (
        <div className="budget-modal-overlay">
          <div className="budget-modal-content" style={{ width: '400px' }}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
              <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'linear-gradient(135deg,#FF6B6B,#EE5A24)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px'}}>⚠️</div>
              <h3 style={{color:'var(--text-main)',fontSize:'18px',fontWeight:'700',margin:0}}>{confirmDialog.title}</h3>
            </div>
            <p style={{color:'#718EBF',fontSize:'14px',lineHeight:'1.6',margin:'0 0 24px 0'}}>{confirmDialog.message}</p>
            <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button onClick={closeConfirm} className="budget-btn-secondary">{t('cancel')}</button>
              <button onClick={() => { confirmDialog.onConfirm(); closeConfirm(); }} className="budget-btn-primary" style={{ background: 'linear-gradient(135deg,#FF6B6B,#EE5A24)' }}>{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="budget-toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`budget-toast ${toast.type}`}>
            <span style={{fontSize:'18px'}}>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes bdg-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bdg-slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes bdg-toastIn { from { opacity: 0; transform: translateX(80px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bdg-toastOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(80px); } }
        @keyframes bdg-cardFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .bdg-card-animate { animation: bdg-cardFadeIn 0.4s ease both; }
      `}</style>
    </div>
  );
}

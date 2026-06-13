"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { budgetApi, transactionApi } from '../lib/api';

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

// Component Biểu đồ tròn Doughnut SVG cao cấp thiết kế hiện đại (Smartwatch Dial & Premium Grid Legend)
const BudgetDoughnutChart = ({ data }: { data: { name: string; value: number; color: string; icon: string }[] }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  
  const activeItems = React.useMemo(() => data.filter(item => item.value > 0), [data]);
  const total = React.useMemo(() => activeItems.reduce((sum, item) => sum + item.value, 0), [activeItems]);
  
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
        <span style={{ fontSize: '15px', fontWeight: '750', color: 'var(--text-main)' }}>Chưa phát sinh chi tiêu trong tháng này</span>
        <span style={{ fontSize: '12px', color: '#718EBF', marginTop: '6px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.5' }}>
          Biểu đồ phân tích sẽ tự động hiển thị ngay khi bạn có giao dịch chi tiêu được hoàn tất trong tháng.
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
              <div style={{ fontSize: '10px', color: '#718EBF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>TỔNG CHI</div>
              <div style={{ fontSize: '18px', fontWeight: '850', color: 'var(--text-main)', marginTop: '1px' }}>
                {Math.round(total).toLocaleString('vi-VN')}đ
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid danh sách chú thích 2 cột cực gọn và sang trọng */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '12px',
        width: '100%',
        maxHeight: '200px',
        overflowY: 'auto',
        padding: '2px 4px',
        scrollbarWidth: 'none'
      }}>
        {activeItems.map((item, idx) => {
          const percentage = Math.round((item.value / total) * 100);
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '16px',
                background: isHovered ? `${item.color}0c` : 'var(--bg-color)',
                borderTop: isHovered ? `1px solid ${item.color}40` : '1px solid var(--border-color)',
                borderRight: isHovered ? `1px solid ${item.color}40` : '1px solid var(--border-color)',
                borderBottom: isHovered ? `1px solid ${item.color}40` : '1px solid var(--border-color)',
                borderLeft: `4px solid ${item.color}`,
                cursor: 'pointer',
                transform: isHovered ? 'scale(1.03) translateY(-1px)' : 'scale(1) translateY(0)',
                boxShadow: isHovered ? `0 8px 20px -6px ${item.color}20` : 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
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
                  {Math.round(item.value).toLocaleString('vi-VN')}đ
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
  const { t } = useLanguage();
  
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
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
    setIsLoading(true);
    try {
      const res = await budgetApi.getAll(month, year);
      setBudgetsList(res.data || []);

      // Fetch all transactions for this month to calculate real-time used_amount
      const pad = (n: number) => n.toString().padStart(2, '0');
      const totalDays = new Date(year, month, 0).getDate();
      const start_date = `${year}-${pad(month)}-01`;
      const end_date = `${year}-${pad(month)}-${pad(totalDays)}`;
      try {
        const transRes = await transactionApi.getAll({
          start_date,
          end_date,
          per_page: 1000
        });
        setCurrentMonthTransactions(transRes.data?.data || transRes.data || []);
      } catch (transErr) {
        console.error('Error fetching current month transactions:', transErr);
        setCurrentMonthTransactions([]);
      }

      // Fetch previous month's budgets for comparison
      const prevM = month === 1 ? 12 : month - 1;
      const prevY = month === 1 ? year - 1 : year;
      try {
        const prevRes = await budgetApi.getAll(prevM, prevY);
        setPrevBudgetsList(prevRes.data || []);

        const prevTotalDays = new Date(prevY, prevM, 0).getDate();
        const prev_start_date = `${prevY}-${pad(prevM)}-01`;
        const prev_end_date = `${prevY}-${pad(prevM)}-${pad(prevTotalDays)}`;
        const prevTransRes = await transactionApi.getAll({
          start_date: prev_start_date,
          end_date: prev_end_date,
          per_page: 1000
        });
        setPrevMonthTransactions(prevTransRes.data?.data || prevTransRes.data || []);
      } catch (prevErr) {
        console.error('Error fetching previous month budgets/transactions:', prevErr);
        setPrevBudgetsList([]);
        setPrevMonthTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Flatten categories list for dropdown selection
  const flatCategories = useMemo(() => {
    const flatten = (cats: any[], prefix = ''): any[] => {
      let result: any[] = [];
      cats.forEach(cat => {
        const emoji = parseIcon(cat.icon || '');
        result.push({ ...cat, displayName: prefix + emoji + ' ' + cat.name });
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

  const totalLimit = overallBudget 
    ? parseFloat(overallBudget.limit_amount) 
    : categoryBudgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0);

  const totalUsed = overallBudget 
    ? Math.abs(parseFloat(overallBudget.used_amount)) 
    : categoryBudgets.reduce((sum, b) => sum + Math.abs(parseFloat(b.used_amount)), 0);

  const totalPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
  const fmt = (n: number) => Math.round(n).toLocaleString('vi-VN') + '₫';

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
  const averagePerDay = totalUsed / passedDays;
  const projectedTotal = averagePerDay * totalDaysInMonth;
  const isOverBudget = totalUsed > totalLimit;

  // Previous month comparison calculations
  const prevOverallBudget = prevBudgetsWithRealtimeUsage.find(b => b.category_id === null);
  const prevCategoryBudgets = prevBudgetsWithRealtimeUsage.filter(b => b.category_id !== null);
  
  const prevTotalUsed = prevOverallBudget
    ? Math.abs(parseFloat(prevOverallBudget.used_amount))
    : prevCategoryBudgets.reduce((sum, b) => sum + Math.abs(parseFloat(b.used_amount)), 0);

  const prevTotalLimit = prevOverallBudget
    ? parseFloat(prevOverallBudget.limit_amount)
    : prevCategoryBudgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0);

  const totalDiff = totalUsed - prevTotalUsed;
  const totalPctDiff = prevTotalUsed > 0 ? Math.round((totalDiff / prevTotalUsed) * 100) : null;

  // Create or update budget
  const handleSaveBudget = async () => {
    if (!limitAmount || parseFloat(limitAmount) <= 0) {
      showToast('Vui lòng nhập số tiền hạn mức hợp lệ!', 'error');
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
      showToast('Lưu hạn mức ngân sách thành công!', 'success');
      await fetchBudgets();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi lưu hạn mức ngân sách', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete budget
  const handleDeleteBudget = async (id: string) => {
    showConfirm('Xóa ngân sách', 'Bạn có chắc chắn muốn xóa ngân sách này?', async () => {
      try {
        await budgetApi.delete(id);
        showToast('Đã xóa ngân sách thành công!', 'success');
        await fetchBudgets();
      } catch (error: any) {
        showToast(error.message || 'Lỗi khi xóa ngân sách', 'error');
      }
    });
  };

  // Copy budgets from previous month
  const handleCopyBudgets = async () => {
    const fromMonth = month === 1 ? 12 : month - 1;
    const fromYear = month === 1 ? year - 1 : year;

    showConfirm('Sao chép ngân sách', `Bạn có muốn sao chép toàn bộ hạn mức ngân sách từ tháng ${fromMonth}/${fromYear} sang tháng ${month}/${year} không?`, async () => {
      setIsLoading(true);
      try {
        const res = await budgetApi.copy({
          from_month: fromMonth,
          from_year: fromYear,
          to_month: month,
          to_year: year
        });
        showToast(`Sao chép thành công! Đã sao chép ${res.data?.length || 0} mục hạn mức.`, 'success');
        await fetchBudgets();
      } catch (error: any) {
        showToast(error.message || 'Không tìm thấy ngân sách nguồn để sao chép!', 'error');
      } finally {
        setIsLoading(false);
      }
    });
  };
  
  const maxUsed = Math.max(totalUsed, prevTotalUsed, 1);
  const prevBarHeight = (prevTotalUsed / maxUsed) * 120;
  const currBarHeight = (totalUsed / maxUsed) * 120;

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
                style={{padding:'8px 12px', border:'1px solid var(--border-color)', borderRadius:'10px', background:'var(--bg-color)', color:'var(--text-main)', fontSize:'14px', fontWeight:'600'}}
              >
                {Array.from({length:12}, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={e => setYear(parseInt(e.target.value))}
                style={{padding:'8px 12px', border:'1px solid var(--border-color)', borderRadius:'10px', background:'var(--bg-color)', color:'var(--text-main)', fontSize:'14px', fontWeight:'600'}}
              >
                {Array.from({length:7}, (_, i) => now.getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleOpenAddModal}
              style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}
            >
              {t('set_budget')}
            </button>
            <button 
              onClick={handleCopyBudgets}
              style={{background:'transparent',color:'#1814F3',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'1px solid #1814F3',cursor:'pointer'}}
            >
              {t('copy_from_previous_month')}
            </button>
            
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
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
          <div className="bdg-card-animate" style={{background:'linear-gradient(135deg,#1814F3,#6366F1)',borderRadius:'20px',padding:'30px',color:'#fff',marginBottom:'24px', boxShadow:'0 10px 30px rgba(24, 20, 243, 0.2)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
              <div style={{fontSize:'14px',opacity:0.85}}>{overallBudget ? 'TỔNG NGÂN SÁCH THÁNG' : 'TỔNG NGÂN SÁCH CÁC DANH MỤC'} - {month}/{year}</div>
              {overallBudget && (
                <div style={{display:'flex', gap:'8px'}}>
                  <button 
                    onClick={() => handleToggleExpand(overallBudget)}
                    style={{background: expandedBudgetId === overallBudget.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)', border:'none', borderRadius:'8px', color:'#fff', padding:'4px 8px', fontSize:'11px', fontWeight:'600', cursor:'pointer'}}
                  >
                    {expandedBudgetId === overallBudget.id ? '▲ Đóng chi tiết' : '👁️ Xem chi tiết'}
                  </button>
                  <button 
                    onClick={() => handleOpenEditModal(overallBudget)}
                    style={{background:'rgba(255,255,255,0.25)', border:'none', borderRadius:'8px', color:'#fff', padding:'4px 8px', fontSize:'11px', fontWeight:'600', cursor:'pointer'}}
                  >
                    ✏️ Sửa hạn mức
                  </button>
                  <button 
                    onClick={() => handleDeleteBudget(overallBudget.id)}
                    style={{background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', color:'#fff', padding:'4px 8px', fontSize:'11px', fontWeight:'600', cursor:'pointer'}}
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
            <div style={{fontSize:'36px',fontWeight:'800',marginBottom:'15px'}}>{fmt(totalUsed)} / {fmt(totalLimit)}</div>
            <div style={{width:'100%',height:'12px',background:'rgba(255,255,255,0.2)',borderRadius:'6px'}}>
                <div style={{width:`${Math.min(totalPct, 100)}%`,height:'100%',background:totalPct>80?'#FE5C73':'#16DBCC',borderRadius:'6px',transition:'width 0.5s'}}></div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'10px',fontSize:'13px',opacity:0.85, alignItems:'center'}}>
                <span>{t('used_label')} {totalPct}%</span>
                <span style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  {totalUsed > totalLimit && totalLimit > 0 && <span style={{fontWeight:'700'}}>⚠️ Vượt {fmt(totalUsed - totalLimit)}</span>}
                  {totalPctDiff !== null && (
                    <span style={{padding:'2px 6px', background: totalPctDiff > 0 ? 'rgba(254, 92, 115, 0.25)' : 'rgba(22, 219, 204, 0.25)', color: totalPctDiff > 0 ? '#FFD2D7' : '#D1FFF9', borderRadius:'4px', fontWeight:'700', fontSize:'11px'}}>
                      {totalPctDiff > 0 ? `↑ +${totalPctDiff}%` : totalPctDiff < 0 ? `↓ ${totalPctDiff}%` : '~ Bằng tháng trước'}
                    </span>
                  )}
                </span>
            </div>

            {/* Collapsible Transactions for Overall Budget */}
            {overallBudget && expandedBudgetId === overallBudget.id && (
              <div style={{marginTop:'20px', borderTop:'1px dashed rgba(255,255,255,0.3)', paddingTop:'20px', width:'100%'}}>
                <div style={{fontWeight:'700', fontSize:'14px', color:'#fff', marginBottom:'12px'}}>
                  {t('transactions_in_month')} ({categoryTransactions.length})
                </div>
                {isLoadingTransactions ? (
                  <div style={{fontSize:'13px', color:'rgba(255,255,255,0.7)', textAlign:'center', padding:'10px'}}>{t('loading_transactions')}</div>
                ) : categoryTransactions.length > 0 ? (
                  <div style={{maxHeight:'200px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px', paddingRight:'4px'}}>
                    {categoryTransactions.map((tx: any) => (
                      <div key={tx.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'rgba(255,255,255,0.1)', borderRadius:'12px', fontSize:'13px'}}>
                        <div style={{display:'flex', flexDirection:'column', gap:'2px', maxWidth:'65%'}}>
                          <span style={{fontWeight:'600', color:'#fff', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap'}}>{tx.title}</span>
                          <span style={{fontSize:'11px', color:'rgba(255,255,255,0.7)'}}>{new Date(tx.transaction_date).toLocaleDateString('vi-VN')} • {tx.category?.name || 'Chưa phân loại'}</span>
                        </div>
                        <span style={{fontWeight:'800', color:'#FFD2D7'}}>
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
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'16px', marginBottom:'24px'}}>
            {/* Stat 1: Remaining */}
            <div className="bdg-card-animate" style={{background:'var(--card-bg)', borderRadius:'16px', padding:'20px', border:'1px solid var(--border-color)', boxShadow:'0 4px 15px rgba(0,0,0,0.02)', animationDelay:'0.08s'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                <span style={{fontSize:'20px'}}>💰</span>
                <span style={{fontSize:'14px', color:'#718EBF', fontWeight:'600'}}>Còn lại</span>
              </div>
              <div style={{fontSize:'20px', fontWeight:'800', color: isOverBudget ? '#FE5C73' : 'var(--text-main)'}}>
                {isOverBudget ? `Vượt -${fmt(totalUsed - totalLimit)}` : fmt(remainingAmount)}
              </div>
              <div style={{fontSize:'12px', color:'#718EBF', marginTop:'4px'}}>
                {isOverBudget ? 'Bạn đã chi quá hạn mức!' : 'Số dư khả dụng hiện tại'}
              </div>
            </div>

            {/* Stat 2: Average Spend per Day */}
            <div className="bdg-card-animate" style={{background:'var(--card-bg)', borderRadius:'16px', padding:'20px', border:'1px solid var(--border-color)', boxShadow:'0 4px 15px rgba(0,0,0,0.02)', animationDelay:'0.16s'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                <span style={{fontSize:'20px'}}>📅</span>
                <span style={{fontSize:'14px', color:'#718EBF', fontWeight:'600'}}>Trung bình/ngày</span>
              </div>
              <div style={{fontSize:'20px', fontWeight:'800', color:'var(--text-main)'}}>
                {fmt(averagePerDay)}
              </div>
              <div style={{fontSize:'12px', color:'#718EBF', marginTop:'4px'}}>
                Tính trên {passedDays} ngày đã qua
              </div>
            </div>

            {/* Stat 3: Month End Forecast */}
            <div className="bdg-card-animate" style={{background:'var(--card-bg)', borderRadius:'16px', padding:'20px', border:'1px solid var(--border-color)', boxShadow:'0 4px 15px rgba(0,0,0,0.02)', animationDelay:'0.24s'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                <span style={{fontSize:'20px'}}>🔮</span>
                <span style={{fontSize:'14px', color:'#718EBF', fontWeight:'600'}}>Dự báo cuối tháng</span>
              </div>
              <div style={{fontSize:'20px', fontWeight:'800', color: projectedTotal > totalLimit && totalLimit > 0 ? '#FE5C73' : '#16DBCC'}}>
                {fmt(projectedTotal)}
              </div>
              <div style={{fontSize:'12px', color:'#718EBF', marginTop:'4px'}}>
                {projectedTotal > totalLimit && totalLimit > 0 ? '⚠️ Dự kiến vượt hạn mức' : 'Dự kiến chi hết tháng'}
              </div>
            </div>

            {/* Stat 4: Category Budgets Count */}
            <div className="bdg-card-animate" style={{background:'var(--card-bg)', borderRadius:'16px', padding:'20px', border:'1px solid var(--border-color)', boxShadow:'0 4px 15px rgba(0,0,0,0.02)', animationDelay:'0.32s'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                <span style={{fontSize:'20px'}}>🔲</span>
                <span style={{fontSize:'14px', color:'#718EBF', fontWeight:'600'}}>Số danh mục hạn mức</span>
              </div>
              <div style={{fontSize:'20px', fontWeight:'800', color:'var(--text-main)'}}>
                {categoryBudgets.length} danh mục
              </div>
              <div style={{fontSize:'12px', color:'#718EBF', marginTop:'4px'}}>
                Từ tổng số {categories.length} nhóm chi tiêu
              </div>
            </div>
          </div>

          {/* CHARTS GRID */}
          {!isLoading && categoryBudgets.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              marginBottom: '24px'
            }}>
              {/* BIỂU ĐỒ TRÒN CƠ CẤU CHI TIÊU */}
              <div className="bdg-card-animate" style={{
                background: 'var(--card-bg)',
                borderRadius: '24px',
                padding: '28px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
                animationDelay: '0.4s'
              }}>
                <h3 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                  <span>📊</span> Cơ cấu chi tiêu theo ngân sách danh mục
                </h3>
                <BudgetDoughnutChart data={categoryBudgets.map(b => ({
                  name: b.category?.name || 'Danh mục khác',
                  value: Math.abs(parseFloat(b.used_amount)),
                  color: b.category?.color || '#FF6384',
                  icon: parseIcon(b.category?.icon || 'grid')
                }))} />
              </div>

              {/* COMPARISON CARD */}
              {(prevTotalLimit > 0 || prevTotalUsed > 0) ? (
                <div className="bdg-card-animate" style={{
                  background: 'var(--card-bg)',
                  borderRadius: '24px',
                  padding: '28px',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
                  animationDelay: '0.45s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                      <span>📈</span> So sánh chi tiêu với tháng trước
                    </h3>
                    <p style={{fontSize: '13px', color: '#718EBF', margin: '0 0 20px 0'}}>
                      {totalDiff > 0 ? (
                        <span>Chi tiêu tháng này <strong style={{color: '#FE5C73'}}>tăng {fmt(totalDiff)} ({totalPctDiff}%)</strong> so với tháng trước.</span>
                      ) : totalDiff < 0 ? (
                        <span>Chi tiêu tháng này <strong style={{color: '#16DBCC'}}>giảm {fmt(Math.abs(totalDiff))} ({Math.abs(totalPctDiff || 0)}%)</strong> so với tháng trước.</span>
                      ) : (
                        <span>Chi tiêu tháng này tương đương với tháng trước.</span>
                      )}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: '50px',
                    height: '140px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    {/* Column 1: Last Month */}
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                      <div style={{fontSize: '11px', fontWeight: '700', color: '#718EBF'}}>{fmt(prevTotalUsed)}</div>
                      <div style={{
                        width: '32px',
                        height: `${prevBarHeight}px`,
                        background: 'linear-gradient(to top, #718EBF, #A3AED0)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.5s ease',
                        boxShadow: '0 4px 10px rgba(113, 142, 191, 0.15)'
                      }}></div>
                      <div style={{fontSize: '11px', fontWeight: '600', color: 'var(--text-main)', textAlign: 'center'}}>
                        Tháng {month === 1 ? 12 : month - 1}/{month === 1 ? year - 1 : year}
                      </div>
                    </div>

                    {/* Column 2: This Month */}
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                      <div style={{fontSize: '11px', fontWeight: '700', color: '#1814F3'}}>{fmt(totalUsed)}</div>
                      <div style={{
                        width: '32px',
                        height: `${currBarHeight}px`,
                        background: 'linear-gradient(to top, #1814F3, #6366F1)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.5s ease',
                        boxShadow: '0 4px 15px rgba(24, 20, 243, 0.25)'
                      }}></div>
                      <div style={{fontSize: '11px', fontWeight: '600', color: 'var(--text-main)', textAlign: 'center'}}>
                        Tháng {month}/{year}
                      </div>
                    </div>
                  </div>

                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#718EBF', marginTop: '16px'}}>
                    <span>Hạn mức tháng trước: <strong>{fmt(prevTotalLimit)}</strong></span>
                    <span>Hạn mức tháng này: <strong>{fmt(totalLimit)}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="bdg-card-animate" style={{
                  background: 'var(--card-bg)',
                  borderRadius: '24px',
                  padding: '28px',
                  border: '1px dashed var(--border-color)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
                  animationDelay: '0.45s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  color: '#718EBF'
                }}>
                  <span style={{fontSize: '32px', marginBottom: '12px'}}>📈</span>
                  <h4 style={{color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700'}}>Chưa có dữ liệu so sánh</h4>
                  <p style={{fontSize: '12px', margin: 0, lineHeight: '1.5', maxWidth: '240px'}}>
                    Biểu đồ so sánh chi tiêu với tháng trước sẽ hiển thị ở đây khi bạn bắt đầu ghi chép giao dịch trong tháng tiếp theo!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* LƯỚI NGÂN SÁCH DANH MỤC */}
          {isLoading ? (
            <div style={{display:'flex', justifyContent:'center', padding:'80px', color:'var(--text-main)', fontSize:'16px'}}>{t('loading')}...</div>
          ) : categoryBudgets.length > 0 ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))',gap:'20px'}}>
              {categoryBudgets.map((b,i)=>{
                const limit = parseFloat(b.limit_amount);
                const used = Math.abs(parseFloat(b.used_amount));
                const pct = limit > 0 ? Math.round(used/limit*100) : 0;
                const catName = b.category?.name || 'Danh mục khác';
                const catIcon = parseIcon(b.category?.icon || 'grid');
                const catColor = b.category?.color || '#FF6384';
                
                const prevB = prevBudgetsList.find(pb => pb.category_id === b.category_id);
                const prevUsed = prevB ? Math.abs(parseFloat(prevB.used_amount)) : 0;
                const diff = used - prevUsed;
                const pctDiff = prevUsed > 0 ? Math.round((diff / prevUsed) * 100) : null;
                
                return(
                  <div key={b.id} className="bdg-card-animate" style={{background:'var(--card-bg)',borderRadius:'20px',padding:'24px',border:'1px solid var(--border-color)', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:'170px', boxShadow:'0 4px 15px rgba(0,0,0,0.02)', animationDelay:`${i * 0.07}s`}}>
                    <div>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'16px'}}>
                        <div 
                          onClick={() => handleToggleExpand(b)}
                          style={{display:'flex',alignItems:'center',gap:'12px', cursor:'pointer', flex: 1}}
                          title="Bấm để xem chi tiết giao dịch"
                        >
                          <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',background:`${catColor}15`}}>{catIcon}</div>
                          <div>
                            <div style={{fontWeight:'700',color:'var(--text-main)', display:'flex', alignItems:'center', gap:'6px'}}>
                              {catName}
                              <span style={{fontSize:'10px', color:'#718EBF'}}>
                                {expandedBudgetId === b.id ? '▲' : '▼'}
                              </span>
                            </div>
                            <div style={{fontSize:'13px',color:'#718EBF'}}>{t('limit_label')} {fmt(limit)}</div>
                          </div>
                        </div>
                        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px'}}>
                          {pct>=80 && (
                            <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:pct>=100?'#FFE0EB':'#FFF5D9',color:pct>=100?'#FE5C73':'#FF9800', whiteSpace:'nowrap'}}>
                              {pct>=100?t('over_budget'):t('almost_empty')}
                            </span>
                          )}
                          <div style={{display:'flex', gap:'8px'}}>
                            <button 
                              onClick={() => handleOpenEditModal(b)}
                              style={{background:'none', border:'none', color:'#1814F3', fontSize:'12px', fontWeight:'600', cursor:'pointer', padding:'2px 4px'}}
                            >
                              ✏️ Sửa
                            </button>
                            <button 
                              onClick={() => handleDeleteBudget(b.id)}
                              style={{background:'none', border:'none', color:'#FE5C73', fontSize:'12px', fontWeight:'600', cursor:'pointer', padding:'2px 4px'}}
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                      <div style={{width:'100%',height:'10px',background:'var(--bg-color)',borderRadius:'5px',marginBottom:'8px'}}>
                        <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:pct>=80?'#FE5C73':catColor,borderRadius:'5px',transition:'width 0.6s'}}></div>
                      </div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:pct>=80?'#FE5C73':catColor,fontWeight:'600'}}>{fmt(used)}</span>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        {pctDiff !== null && (
                          <span style={{fontSize:'11px', fontWeight:'700', color: pctDiff > 0 ? '#FE5C73' : '#16DBCC', background: pctDiff > 0 ? '#FFE0EB' : '#E0FBF6', padding:'2px 6px', borderRadius:'10px'}}>
                            {pctDiff > 0 ? `↑ +${pctDiff}%` : `↓ ${pctDiff}%`}
                          </span>
                        )}
                        <span style={{color:'#718EBF'}}>{pct}%</span>
                      </div>
                    </div>

                    {/* Collapsible Transactions List */}
                    {expandedBudgetId === b.id && (
                      <div style={{marginTop:'16px', borderTop:'1px solid var(--border-color)', paddingTop:'16px', width:'100%'}}>
                        <div style={{fontWeight:'700', fontSize:'13px', color:'var(--text-main)', marginBottom:'10px'}}>
                          {t('transactions_in_month')} ({categoryTransactions.length})
                        </div>
                        {isLoadingTransactions ? (
                          <div style={{fontSize:'12px', color:'#718EBF', textAlign:'center', padding:'10px'}}>{t('loading_transactions')}</div>
                        ) : categoryTransactions.length > 0 ? (
                          <div style={{maxHeight:'160px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'6px', paddingRight:'4px'}}>
                            {categoryTransactions.map((tx: any) => (
                              <div key={tx.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'var(--bg-color)', borderRadius:'8px', fontSize:'12px'}}>
                                <div style={{display:'flex', flexDirection:'column', gap:'1px', maxWidth:'65%'}}>
                                  <span style={{fontWeight:'600', color:'var(--text-main)', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap'}}>{tx.title}</span>
                                  <span style={{fontSize:'10px', color:'#718EBF'}}>{new Date(tx.transaction_date).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <span style={{fontWeight:'700', color: tx.type === 'income' ? '#16DBCC' : '#FE5C73'}}>
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
            <div style={{
              background: 'var(--card-bg)',
              border: '1px dashed var(--border-color)',
              borderRadius: '24px',
              padding: '50px 30px',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '20px',
              maxWidth: '800px',
              margin: '20px auto 0 auto'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(24, 20, 243, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                marginBottom: '20px'
              }}>
                🎯
              </div>
              <h3 style={{color: 'var(--text-main)', fontSize: '20px', fontWeight: '700', marginBottom: '10px'}}>
                Chưa thiết lập ngân sách tháng này
              </h3>
              <p style={{fontSize: '14px', color: '#718EBF', maxWidth: '500px', lineHeight: '1.6', margin: '0 auto 24px'}}>
                Thiết lập ngân sách giúp bạn kiểm soát việc chi tiêu tốt hơn, tối ưu hóa tiền tích lũy và nhanh chóng đạt được các mục tiêu tài chính của mình.
              </p>
              
              {/* Onboarding Guide steps */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                width: '100%',
                marginBottom: '30px',
                textAlign: 'left'
              }}>
                <div style={{padding: '16px', background: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border-color)'}}>
                  <div style={{fontSize: '14px', fontWeight: '800', color: '#1814F3', marginBottom: '8px'}}>1. Đặt mục tiêu tổng</div>
                  <div style={{fontSize: '12px', color: '#718EBF', lineHeight: '1.5'}}>
                    Đặt ngân sách tổng cho cả tháng để giới hạn tổng chi tiêu của bạn.
                  </div>
                </div>
                <div style={{padding: '16px', background: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border-color)'}}>
                  <div style={{fontSize: '14px', fontWeight: '800', color: '#1814F3', marginBottom: '8px'}}>2. Chia nhỏ danh mục</div>
                  <div style={{fontSize: '12px', color: '#718EBF', lineHeight: '1.5'}}>
                    Phân bổ ngân sách riêng cho các nhóm như Ăn uống, Di chuyển, Mua sắm để dễ quản lý.
                  </div>
                </div>
                <div style={{padding: '16px', background: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border-color)'}}>
                  <div style={{fontSize: '14px', fontWeight: '800', color: '#1814F3', marginBottom: '8px'}}>3. Nhận cảnh báo chi tiêu</div>
                  <div style={{fontSize: '12px', color: '#718EBF', lineHeight: '1.5'}}>
                    Nhận thông báo nhắc nhở tự động khi chi tiêu của bạn chạm mức 80% hoặc vượt quá 100% hạn mức!
                  </div>
                </div>
              </div>

              <div style={{display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap'}}>
                <button 
                  onClick={handleOpenAddModal}
                  style={{
                    background: '#1814F3',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    boxShadow: '0 4px 15px rgba(24, 20, 243, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  ➕ Đặt ngân sách mới
                </button>
                <button 
                  onClick={handleCopyBudgets}
                  style={{
                    background: 'transparent',
                    color: '#1814F3',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    border: '1px solid #1814F3',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  📋 Sao chép từ tháng trước
                </button>
              </div>
            </div>
          )}

          {/* LỊCH SỬ NGÂN SÁCH CÁC THÁNG TRƯỚC */}
          {isLoggedIn && (
            <div style={{marginTop:'28px'}}>
              <div 
                onClick={() => setShowHistory(!showHistory)} 
                style={{display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'16px 20px', background:'var(--card-bg)', borderRadius:'16px', border:'1px solid var(--border-color)'}}
              >
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <span style={{fontSize:'20px'}}>📅</span>
                  <span style={{fontWeight:'700', color:'var(--text-main)', fontSize:'16px'}}>Lịch sử ngân sách các tháng trước</span>
                </div>
                <span style={{color:'#718EBF', fontSize:'20px', transition:'transform 0.3s', transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
              </div>

              {showHistory && (
                <div style={{marginTop:'16px'}}>
                  {isLoadingHistory ? (
                    <div style={{display:'flex', justifyContent:'center', padding:'40px', color:'var(--text-main)'}}>{t('loading')}...</div>
                  ) : budgetHistory.length > 0 ? (
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'16px'}}>
                      {budgetHistory.map((h, i) => {
                        const pct = h.limit > 0 ? Math.round((h.used / h.limit) * 100) : 0;
                        const barColor = pct >= 100 ? '#FE5C73' : pct >= 80 ? '#FF9800' : '#16DBCC';
                        return (
                          <div 
                            key={i} 
                            style={{
                              background:'var(--card-bg)', 
                              borderRadius:'16px', 
                              padding:'20px', 
                              border:'1px solid var(--border-color)',
                              cursor:'pointer',
                              transition:'all 0.2s'
                            }}
                            onClick={() => { setMonth(h.month); setYear(h.year); setShowHistory(false); }}
                          >
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                              <span style={{fontWeight:'700', color:'var(--text-main)', fontSize:'15px'}}>Tháng {h.month}/{h.year}</span>
                              <span style={{fontSize:'13px', fontWeight:'700', color: barColor}}>{pct}%</span>
                            </div>
                            <div style={{width:'100%', height:'10px', background:'var(--bg-color)', borderRadius:'5px', overflow:'hidden', marginBottom:'10px'}}>
                              <div style={{width:`${Math.min(pct, 100)}%`, height:'100%', background: barColor, borderRadius:'5px', transition:'width 0.5s'}}></div>
                            </div>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#718EBF'}}>
                              <span>{fmt(h.used)} / {fmt(h.limit)}</span>
                              <span>{h.count} mục</span>
                            </div>
                            {pct >= 100 && (
                              <div style={{marginTop:'6px', fontSize:'12px', color:'#FE5C73', fontWeight:'600'}}>🚨 Đã vượt ngân sách</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{background:'var(--card-bg)', border:'1px dashed var(--border-color)', borderRadius:'16px', padding:'40px 20px', textAlign:'center', color:'#718EBF'}}>
                      <div style={{fontSize:'32px', marginBottom:'12px'}}>📭</div>
                      <p style={{fontSize:'14px', margin:0}}>{t('no_past_budgets')}</p>
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
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000, backdropFilter: 'blur(4px)'}}>
          <div style={{background: 'var(--card-bg)',borderRadius:'24px',padding:'30px',width:'450px',maxWidth:'95%',boxShadow:'0 10px 40px rgba(0,0,0,0.1)'}}>
             <h2 style={{color: 'var(--text-main)',marginBottom:'24px',fontSize:'20px',fontWeight:'700'}}>
               {isEditMode ? t('edit_budget_limit') : t('setup_budget_limit')}
             </h2>
             
             <div style={{marginBottom:'20px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('apply_to_category')}</label>
               <select 
                 value={selectedCategory} 
                 onChange={e=>setSelectedCategory(e.target.value)} 
                 disabled={isEditMode}
                 style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: isEditMode ? 'var(--border-color)' : 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px', cursor: isEditMode ? 'not-allowed' : 'default'}}
               >
                  <option value="">{t('overall_budget_option')}</option>
                  {flatCategories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
               </select>
             </div>

             <div style={{marginBottom:'24px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('limit_amount_label')}</label>
               <input 
                 type="number" 
                 value={limitAmount} 
                 onChange={e=>setLimitAmount(e.target.value)} 
                 placeholder="VD: 5000000" 
                 style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}} 
               />
             </div>
             
             <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
               <button style={{padding:'12px 24px',background: 'var(--bg-color)',color:'#718EBF',borderRadius:'12px',border: '1px solid var(--border-color)',cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={handleCloseModal} disabled={isSubmitting}>{t('cancel')}</button>
               <button 
                style={{padding:'12px 24px',background:'#1814F3',color:'#fff',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:'600',fontSize:'15px', display:'flex', alignItems:'center', gap:'8px'}} 
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
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,backdropFilter:'blur(4px)',animation:'bdg-fadeIn 0.2s ease'}}>
          <div style={{background:'var(--card-bg)',borderRadius:'20px',padding:'28px',width:'400px',maxWidth:'90%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',animation:'bdg-slideUp 0.25s ease'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
              <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'linear-gradient(135deg,#FF6B6B,#EE5A24)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px'}}>⚠️</div>
              <h3 style={{color:'var(--text-main)',fontSize:'18px',fontWeight:'700',margin:0}}>{confirmDialog.title}</h3>
            </div>
            <p style={{color:'#718EBF',fontSize:'14px',lineHeight:'1.6',margin:'0 0 24px 0'}}>{confirmDialog.message}</p>
            <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button onClick={closeConfirm} style={{padding:'10px 22px',background:'var(--bg-color)',color:'#718EBF',borderRadius:'12px',border:'1px solid var(--border-color)',cursor:'pointer',fontWeight:'600',fontSize:'14px',transition:'all 0.2s'}}>{t('cancel')}</button>
              <button onClick={() => { confirmDialog.onConfirm(); closeConfirm(); }} style={{padding:'10px 22px',background:'linear-gradient(135deg,#FF6B6B,#EE5A24)',color:'#fff',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:'600',fontSize:'14px',transition:'all 0.2s'}}>{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div style={{position:'fixed',top:'24px',right:'24px',zIndex:3000,display:'flex',flexDirection:'column',gap:'10px',pointerEvents:'none'}}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            pointerEvents:'auto',
            padding:'14px 20px',
            borderRadius:'14px',
            background: toast.type === 'success' ? 'linear-gradient(135deg,#00C9A7,#00B4D8)' : toast.type === 'error' ? 'linear-gradient(135deg,#FF6B6B,#EE5A24)' : 'linear-gradient(135deg,#1814F3,#5B73E8)',
            color:'#fff',
            fontSize:'14px',
            fontWeight:'600',
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
            display:'flex',
            alignItems:'center',
            gap:'10px',
            minWidth:'280px',
            maxWidth:'400px',
            animation:'bdg-toastIn 0.35s ease, bdg-toastOut 0.35s ease 3.15s forwards'
          }}>
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

"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from './components/Sidebar';
import { useAppContext } from './context/AppContext';
import { useLanguage } from './lib/translations';
import { budgetApi, reportApi, transactionApi } from './lib/api';
import { getThisMonthRange } from './lib/dateHelpers';

const parseIcon = (iconName: string) => {
  const iconMap: Record<string, string> = {
    food: '🍜', car: '🚗', shopping_cart: '🛒', shopping_bag: '🛍️', gamepad: '🎮', 
    beauty: '💇', health: '🏥', heart: '💖', receipt: '📋', house: '🏠', 
    users: '🤝', chart: '📈', book: '📚', salary: '💰', award: '🏆', 
    business: '🏢', profit: '💹', debt: '📉', support: '🤗', building: '🏙️', 
    rings: '💍', grid: '🔲', monitor: '🖥️', cash: '💵', coffee: '☕', 
    baby_clothing: '👶', book_open: '📖', paw: '🐾', dumbbell: '🏋️', baby_bottle: '🍼', 
    masks: '🎭', beer: '🍺', suitcase: '🧳', tshirt: '👕', croissant: '🥐', 
    graduation_cap: '🎓', water_drop_money: '💧', basket: '🧺', cigarette: '🚬', teddy_bear: '🧸', 
    bread: '🍞', heart_paw: '🐾', globe: '🌍', hand_money: '🤲', coffee_cup: '☕', 
    money_bag: '💰', graduation_cap_alt: '🧑‍🎓', masks_alt: '🎭', house_money: '🏠', handshake: '🤝', 
    clapperboard: '🎬', medical_shield: '🛡️', lightbulb: '💡', gas_station: '⛽', gas_cylinder: '🛢️', 
    flower: '🌸', inbox_archive: '📥', heart_money: '💖', house_settings: '🏠', desktop: '🖥️', 
    shopping_cart_alt: '🛒', hand_coin: '🪙', piggy_bank: '🐷', scissors: '✂️', restaurant: '🍽️', 
    ticket: '🎫', motorcycle: '🏍️', dumbbell_alt: '🏋️‍♀️', house_search: '🏠', school: '🏫', 
    wallet_shield: '🛡️', car_settings: '🚗', first_aid: '🚑', parking: '🅿️', phone_call: '📞', 
    baby_carriage: '🚼', glove: '🧤', car_shopping: '🚗', train: '🚆', chair: '🪑', 
    car_alt: '🚙', bill: '🧾', teddy_bear_alt: '🧸', headphones: '🎧', laptop: '💻', 
    office_chair: '💺', medical_shield_alt: '🛡️', electricity: '⚡', hand_heart: '🫶', heart_plus: '💖', 
    gift_box: '🎁', spa: '💆', gift: '🎁', airplane: '✈️', chart_alt: '📊', 
    wallet: '👛', water_drop: '💧', discount: '🏷️', bill_dollar: '🧾', mobile_dollar: '📱', 
    bank: '🏦', network: '🌐', parking_alt: '🅿️', plane: '✈️', fire: '🔥',
    star: '⭐', music: '🎵', camera: '📷', brush: '🖌️', rocket: '🚀',
    pill: '💊', wine: '🍷', pizza: '🍕', hammer: '🔨', key: '🔑'
  };
  return iconMap[iconName] || null;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
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

const getMonthsBetween = (startDateStr: string, endDateStr: string): any[] => {
  const months: any[] = [];
  if (!startDateStr || !endDateStr) return months;
  let curr = new Date(startDateStr);
  curr.setDate(1); // avoid month overflow issues
  const end = new Date(endDateStr);
  end.setDate(1);
  while (curr <= end) {
    months.push({
      month: curr.getMonth() + 1,
      year: curr.getFullYear(),
      label: `${String(curr.getMonth() + 1).padStart(2, '0')}/${curr.getFullYear()}`
    });
    curr.setMonth(curr.getMonth() + 1);
  }
  return months;
};

export default function Dashboard() {
  const router = useRouter();
  const { isLoggedIn, wallets, transactions, isLoadingWallets, userData, categories } = useAppContext();
  const { t } = useLanguage();
  const [showWalletBalance, setShowWalletBalance] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetsList, setBudgetsList] = useState<any[]>([]);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  // Statistics States
  const [summaryData, setSummaryData] = useState({ income: 0, expense: 0, net: 0 });
  const [lastMonthSummary, setLastMonthSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<{ idx: number, type: 'income' | 'expense' | null }>({ idx: -1, type: null });
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [allocationType, setAllocationType] = useState<'parent' | 'child'>('parent');
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState<number>(0);
  const [dailyTrendsData, setDailyTrendsData] = useState<any[]>([]);
  const [isLoadingDailyTrends, setIsLoadingDailyTrends] = useState(false);
  const [hoveredDailyPoint, setHoveredDailyPoint] = useState<number | null>(null);
  const [hoveredTopCategory, setHoveredTopCategory] = useState<number | null>(null);
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');
  const [trendsGroupBy, setTrendsGroupBy] = useState<'day' | 'month'>('day');

  // Reset selected category index when toggle views or data updates
  useEffect(() => {
    setSelectedCategoryIdx(0);
  }, [allocationType, categoryData]);

  const categoriesMap = useMemo(() => {
    const map: Record<string, any> = {};
    categories.forEach((parent: any) => {
      map[parent.id] = parent;
      if (parent.children) {
        parent.children.forEach((child: any) => {
          map[child.id] = { ...child, parent_name: parent.name };
        });
      }
    });
    return map;
  }, [categories]);

  const mergedTrends = useMemo(() => {
    if (trendsGroupBy === 'day') {
      const dates = getDatesBetween(activeStartDate, activeEndDate);
      return dates.map(dateStr => {
        const found = trendsData.find(t => t.date === dateStr);
        const d = new Date(dateStr);
        return {
          label: `${d.getDate()}/${d.getMonth() + 1}`,
          date: dateStr,
          income: found ? Number(found.income) : 0,
          expense: found ? Number(found.expense) : 0
        };
      });
    } else {
      const months = getMonthsBetween(activeStartDate, activeEndDate);
      return months.map(m => {
        const found = trendsData.find(t => Number(t.month) === m.month && Number(t.year) === m.year);
        return {
          label: m.label,
          month: m.month,
          year: m.year,
          income: found ? Number(found.income) : 0,
          expense: found ? Number(found.expense) : 0
        };
      });
    }
  }, [trendsData, trendsGroupBy, activeStartDate, activeEndDate]);

  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    if (isLoggedIn) {
      setIsLoadingBudget(true);
      budgetApi.getAll(currentMonth, currentYear)
        .then(res => {
          setBudgetsList(res.data || []);
        })
        .catch(err => {
          console.error("Error fetching budgets on dashboard:", err);
        })
        .finally(() => {
          setIsLoadingBudget(false);
        });
    }
  }, [isLoggedIn, currentMonth, currentYear, transactions]);

  // Fetch report data based on time period
  useEffect(() => {
    if (!isLoggedIn) {
      setSummaryData({ income: 0, expense: 0, net: 0 });
      setLastMonthSummary({ income: 0, expense: 0, net: 0 });
      setCategoryData([]);
      setTrendsData([]);
      setDailyTrendsData([]);
      return;
    }

    // Determine date range
    let start_date = '';
    let end_date = '';
    let last_month_start = '';
    let last_month_end = '';
    let trendsGroupBy: 'day' | 'month' = 'day';

    const nowVal = new Date();

    switch (timePeriod) {
      case 'week': {
        const day = nowVal.getDay();
        const diff = nowVal.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(nowVal.setDate(diff));
        start_date = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        end_date = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
        
        // Last week dates
        const prevMonday = new Date(monday);
        prevMonday.setDate(monday.getDate() - 7);
        last_month_start = `${prevMonday.getFullYear()}-${String(prevMonday.getMonth() + 1).padStart(2, '0')}-${String(prevMonday.getDate()).padStart(2, '0')}`;
        
        const prevSunday = new Date(prevMonday);
        prevSunday.setDate(prevMonday.getDate() + 6);
        last_month_end = `${prevSunday.getFullYear()}-${String(prevSunday.getMonth() + 1).padStart(2, '0')}-${String(prevSunday.getDate()).padStart(2, '0')}`;
        
        trendsGroupBy = 'day';
        break;
      }
      case 'month': {
        const firstDay = new Date(nowVal.getFullYear(), nowVal.getMonth(), 1);
        const lastDay = new Date(nowVal.getFullYear(), nowVal.getMonth() + 1, 0);
        start_date = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`;
        end_date = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
        
        // Last month dates
        const lastMonthDate = new Date(nowVal.getFullYear(), nowVal.getMonth() - 1, 1);
        last_month_start = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
        last_month_end = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-${String(new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
        
        trendsGroupBy = 'day';
        break;
      }
      case 'quarter': {
        const quarter = Math.floor(nowVal.getMonth() / 3);
        const firstMonth = quarter * 3;
        const lastMonth = firstMonth + 2;
        const firstDay = new Date(nowVal.getFullYear(), firstMonth, 1);
        const lastDay = new Date(nowVal.getFullYear(), lastMonth + 1, 0);
        start_date = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`;
        end_date = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
        
        // Last quarter dates
        const prevQuarterFirstMonth = firstMonth - 3 >= 0 ? firstMonth - 3 : 9;
        const prevQuarterYear = firstMonth - 3 >= 0 ? nowVal.getFullYear() : nowVal.getFullYear() - 1;
        const prevQuarterFirstDay = new Date(prevQuarterYear, prevQuarterFirstMonth, 1);
        const prevQuarterLastDay = new Date(prevQuarterYear, prevQuarterFirstMonth + 3, 0);
        last_month_start = `${prevQuarterFirstDay.getFullYear()}-${String(prevQuarterFirstDay.getMonth() + 1).padStart(2, '0')}-01`;
        last_month_end = `${prevQuarterLastDay.getFullYear()}-${String(prevQuarterLastDay.getMonth() + 1).padStart(2, '0')}-${String(prevQuarterLastDay.getDate()).padStart(2, '0')}`;
        
        trendsGroupBy = 'month';
        break;
      }
      case 'year': {
        start_date = `${nowVal.getFullYear()}-01-01`;
        end_date = `${nowVal.getFullYear()}-12-31`;
        
        // Last year dates
        last_month_start = `${nowVal.getFullYear() - 1}-01-01`;
        last_month_end = `${nowVal.getFullYear() - 1}-12-31`;
        
        trendsGroupBy = 'month';
        break;
      }
      case 'custom': {
        if (!customStartDate || !customEndDate) return; // Wait until dates are entered
        start_date = customStartDate;
        end_date = customEndDate;
        
        // Compare with same duration shifted back
        const s = new Date(customStartDate);
        const e = new Date(customEndDate);
        const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        const prevS = new Date(s);
        prevS.setDate(s.getDate() - diffDays);
        const prevE = new Date(e);
        prevE.setDate(e.getDate() - diffDays);
        
        last_month_start = `${prevS.getFullYear()}-${String(prevS.getMonth() + 1).padStart(2, '0')}-${String(prevS.getDate()).padStart(2, '0')}`;
        last_month_end = `${prevE.getFullYear()}-${String(prevE.getMonth() + 1).padStart(2, '0')}-${String(prevE.getDate()).padStart(2, '0')}`;
        
        trendsGroupBy = diffDays <= 45 ? 'day' : 'month';
        break;
      }
    }

    setActiveStartDate(start_date);
    setActiveEndDate(end_date);
    setTrendsGroupBy(trendsGroupBy);

    // Fetch summary
    setIsLoadingSummary(true);
    reportApi.getSummary(start_date, end_date, selectedWalletId || undefined)
      .then(res => {
        if (res.status === 'success' && res.data) {
          setSummaryData(res.data);
        }
      })
      .catch(err => console.error("Error fetching summary:", err))
      .finally(() => setIsLoadingSummary(false));

    // Fetch last period's summary for comparison
    if (last_month_start && last_month_end) {
      reportApi.getSummary(last_month_start, last_month_end, selectedWalletId || undefined)
        .then(res => {
          if (res.status === 'success' && res.data) {
            setLastMonthSummary(res.data);
          }
        })
        .catch(err => console.error("Error fetching last period summary:", err));
    }

    // Helper functions for date formatting in client-side calculations
    const getLocalDateString = (isoString: string) => {
      try {
        const d = new Date(isoString);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } catch (e) {
        return isoString.substring(0, 10);
      }
    };

    const getLocalMonthString = (isoString: string) => {
      try {
        const d = new Date(isoString);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } catch (e) {
        return isoString.substring(0, 7);
      }
    };

    if (selectedWalletId) {
      // Fetch category and daily spending stats: We load transactions for the selected range filtered by wallet
      setIsLoadingCategory(true);
      setIsLoadingDailyTrends(true);
      setIsLoadingTrends(true);
      transactionApi.getAll({ start_date, end_date, per_page: 2000, wallet_id: selectedWalletId })
        .then(res => {
          const txList = res.data?.data || res.data || [];
          const grouped: Record<string, any> = {};
          
          // Calculate daily trends client-side
          const dailyMap: Record<string, number> = {};
          const monthlyMap: Record<string, number> = {};
          const trendsMap: Record<string, { income: number; expense: number }> = {};

          txList.forEach((tx: any) => {
            const amt = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
            const type = tx.type;

            // Categories grouping (only for expense)
            if (type === 'expense' && amt > 0) {
              const catId = tx.category_id || 'other';
              const fullCat = categoriesMap[catId];
              
              const catName = fullCat?.name || tx.category?.name || tx.category_name || t('other');
              const catColor = fullCat?.color || tx.category?.color || '#718EBF';
              const catIcon = fullCat?.icon || tx.category?.icon || '📁';
              const parentId = fullCat?.parent_id || tx.category?.parent_id || null;
              
              let parentName = fullCat?.parent_name || tx.category?.parent?.name || null;
              if (!parentName && parentId) {
                parentName = categoriesMap[parentId]?.name || null;
              }
              
              if (!grouped[catId]) {
                grouped[catId] = {
                  category_id: catId,
                  category_name: catName,
                  category_color: catColor,
                  category_icon: catIcon,
                  parent_id: parentId,
                  parent_name: parentName,
                  amount: 0
                };
              }
              grouped[catId].amount += amt;
            }

            // Trends grouping (daily & monthly)
            const dateStr = tx.transaction_date ? tx.transaction_date.substring(0, 10) : '';
            if (dateStr) {
              const localDate = getLocalDateString(tx.transaction_date);
              const localMonth = getLocalMonthString(tx.transaction_date);

              // Daily/monthly expense for spline
              if (type === 'expense') {
                dailyMap[localDate] = (dailyMap[localDate] || 0) + amt;
                monthlyMap[localMonth] = (monthlyMap[localMonth] || 0) + amt;
              }

              // Income vs Expense grouped by day/month for column chart
              const key = trendsGroupBy === 'day' ? localDate : localMonth;
              if (!trendsMap[key]) {
                trendsMap[key] = { income: 0, expense: 0 };
              }
              if (type === 'income') {
                trendsMap[key].income += amt;
              } else if (type === 'expense') {
                trendsMap[key].expense += amt;
              }
            }
          });
          
          setCategoryData(Object.values(grouped));

          // Format daily trends matching SVG expectations
          const computedDailyTrends: any[] = [];
          if (trendsGroupBy === 'day') {
            Object.entries(dailyMap).forEach(([date, expense]) => {
              computedDailyTrends.push({ date, expense });
            });
          } else {
            Object.entries(monthlyMap).forEach(([monthStr, expense]) => {
              const [year, month] = monthStr.split('-');
              computedDailyTrends.push({
                month: parseInt(month, 10),
                year: parseInt(year, 10),
                expense
              });
            });
          }
          setDailyTrendsData(computedDailyTrends);

          // Format trends data for column chart matching API expectations
          const computedTrends: any[] = [];
          if (trendsGroupBy === 'day') {
            Object.entries(trendsMap).forEach(([date, val]) => {
              const d = new Date(date);
              computedTrends.push({
                label: `${d.getDate()}/${d.getMonth() + 1}`,
                date,
                income: val.income,
                expense: val.expense
              });
            });
          } else {
            Object.entries(trendsMap).forEach(([monthStr, val]) => {
              const [year, month] = monthStr.split('-');
              computedTrends.push({
                label: `${month}/${year}`,
                month: parseInt(month, 10),
                year: parseInt(year, 10),
                income: val.income,
                expense: val.expense
              });
            });
          }
          setTrendsData(computedTrends);
        })
        .catch(err => console.error("Error fetching categories and trends via transactions:", err))
        .finally(() => {
          setIsLoadingCategory(false);
          setIsLoadingDailyTrends(false);
          setIsLoadingTrends(false);
        });
    } else {
      // Selected wallet is empty (All wallets) -> Query aggregated backend API
      setIsLoadingCategory(true);
      setIsLoadingDailyTrends(true);
      setIsLoadingTrends(true);

      // 1. Fetch categories
      reportApi.getCategories({ start_date, end_date, type: 'expense' })
        .then(res => {
          if (res.status === 'success' && res.data) {
            setCategoryData(res.data.categories || []);
          }
        })
        .catch(err => console.error("Error fetching categories:", err))
        .finally(() => setIsLoadingCategory(false));

      // 2. Fetch trends (for both columns and line charts)
      reportApi.getTrends(start_date, end_date, trendsGroupBy)
        .then(res => {
          if (res.status === 'success' && res.data) {
            setTrendsData(res.data || []);
            setDailyTrendsData(res.data || []);
          }
        })
        .catch(err => console.error("Error fetching trends:", err))
        .finally(() => {
          setIsLoadingDailyTrends(false);
          setIsLoadingTrends(false);
        });
    }

  }, [isLoggedIn, timePeriod, customStartDate, customEndDate, transactions, categoriesMap, selectedWalletId, trendsGroupBy]);

  const handleCopyBudgets = async () => {
    const fromMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const fromYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    if (window.confirm(t('copy_budget_confirm_msg').replace('{from}', `${fromMonth}/${fromYear}`).replace('{to}', `${currentMonth}/${currentYear}`))) {
      setIsLoadingBudget(true);
      try {
        const res = await budgetApi.copy({
          from_month: fromMonth,
          from_year: fromYear,
          to_month: currentMonth,
          to_year: currentYear
        });
        alert(t('copy_budget_success').replace('{count}', (res.data?.length || 0).toString()));
        const budgetsRes = await budgetApi.getAll(currentMonth, currentYear);
        setBudgetsList(budgetsRes.data || []);
      } catch (error: any) {
        alert(error.message || t('copy_budget_error'));
      } finally {
        setIsLoadingBudget(false);
      }
    }
  };

  // Calculate overall budget stats
  const overallBudget = budgetsList.find(b => b.category_id === null);
  const categoryBudgets = budgetsList.filter(b => b.category_id !== null);

  const totalLimit = overallBudget 
    ? parseFloat(overallBudget.limit_amount) 
    : categoryBudgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0);

  const totalUsed = overallBudget 
    ? parseFloat(overallBudget.used_amount) 
    : categoryBudgets.reduce((sum, b) => sum + parseFloat(b.used_amount), 0);

  const totalPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

  // Tính toán số liệu từ dữ liệu thật
  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.available_balance || 0), 0);
  const displayIncome = summaryData.income;
  const displayExpense = summaryData.expense;
  const displayNet = summaryData.net;

  // So sánh tháng này vs tháng trước (tăng/giảm %)
  const lastExpense = lastMonthSummary.expense;
  const expenseChangePercent = lastExpense > 0 
    ? ((displayExpense - lastExpense) / lastExpense) * 100 
    : (displayExpense > 0 ? 100 : 0);

  // Group all categories by their parent category to avoid double counting
  const rootCategoriesMap: Record<string, any> = {};
  
  categoryData.forEach(cat => {
    const amount = Math.abs(cat.amount);
    if (amount === 0) return;

    if (cat.parent_id === null) {
      // It's a root category
      if (!rootCategoriesMap[cat.category_id]) {
        rootCategoriesMap[cat.category_id] = { ...cat, amount: 0 };
      }
      rootCategoriesMap[cat.category_id].amount += amount;
    } else {
      // It's a subcategory - group it into its parent
      const parentId = cat.parent_id;
      const parentCat = categoriesMap[parentId];
      const parentName = parentCat?.name || cat.parent_name || t('other') || 'Khác';
      const parentColor = parentCat?.color || cat.category_color || '#718EBF';
      const parentIcon = parentCat?.icon || cat.category_icon || '📁';
      
      if (!rootCategoriesMap[parentId]) {
        rootCategoriesMap[parentId] = {
          category_id: parentId,
          category_name: parentName,
          category_color: parentColor,
          category_icon: parentIcon,
          parent_id: null,
          amount: 0
        };
      }
      rootCategoriesMap[parentId].amount += amount;
    }
  });

  const rootCategoriesList = Object.values(rootCategoriesMap).sort((a: any, b: any) => b.amount - a.amount);
  const totalCategoryExpense = rootCategoriesList.reduce((sum, cat) => sum + cat.amount, 0);

  // Compute active categories list based on allocationType
  let activeCategoriesList: any[] = [];
  if (allocationType === 'parent') {
    activeCategoriesList = rootCategoriesList;
  } else {
    // Show child categories (where amount > 0)
    activeCategoriesList = categoryData
      .filter(cat => Math.abs(cat.amount) > 0)
      .map(cat => ({
        ...cat,
        amount: Math.abs(cat.amount)
      }))
      .sort((a: any, b: any) => b.amount - a.amount);
  }

  // Compute correct percentages
  const processedCategoryData = activeCategoriesList.map((cat: any) => {
    const pct = totalCategoryExpense > 0 ? Math.round((cat.amount / totalCategoryExpense) * 100) : 0;
    return {
      ...cat,
      percentage: pct
    };
  });

  const top5Categories = rootCategoriesList.map((cat: any) => {
    const pct = totalCategoryExpense > 0 ? Math.round((cat.amount / totalCategoryExpense) * 100) : 0;
    return {
      ...cat,
      percentage: pct
    };
  }).slice(0, 5);

  // SVG Donut Chart Setup
  const radius = 38;
  const circumference = 2 * Math.PI * radius;



  const filteredRecentTransactions = useMemo(() => {
    if (!selectedWalletId) return transactions;
    return transactions.filter((tx: any) => tx.wallet_id === selectedWalletId);
  }, [transactions, selectedWalletId]);

  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return '0';
    const currencyCode = userData?.preference?.currency || 'VND';
    let locale = 'vi-VN';
    if (currencyCode === 'USD') locale = 'en-US';
    else if (currencyCode === 'EUR') locale = 'de-DE';
    else if (currencyCode === 'GBP') locale = 'en-GB';
    else if (currencyCode === 'JPY') locale = 'ja-JP';
    
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(numericAmount);
  };

  const displayName = userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user');

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="dashboard" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar">
          <h1 className="page-title">{t('dashboard')}</h1>
          <div className="nav-actions">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }} className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-light)">
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input 
                type="text" 
                placeholder={t('search_placeholder')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button 
              onClick={() => router.push('/reports')}
              style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'24px',fontWeight:'600',border:'none',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',gap:'8px',whiteSpace:'nowrap'}}
            >
              {t('add_report')}
            </button>
            <Link href="/notifications" style={{background: '#F5F7FA', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb300', cursor: 'pointer', fontSize: '20px', textDecoration: 'none'}}>
              🔔
            </Link>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>{displayName}</span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>{t('login')}</Link>
            )}
          </div>
        </nav>
        <div className="content-area">
          {/* Time Filter Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--card-bg)',
            padding: '12px 20px',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid var(--border-color)',
            gap: '16px',
            marginBottom: '5px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['week', 'month', 'quarter', 'year', 'custom'] as const).map((p) => {
                const labelMap = {
                  week: t('this_week') || 'Tuần này',
                  month: t('this_month') || 'Tháng này',
                  quarter: t('this_quarter') || 'Quý này',
                  year: t('this_year') || 'Năm này',
                  custom: t('custom_period') || 'Tùy chỉnh'
                };
                const isActive = timePeriod === p;
                return (
                  <button
                    key={p}
                    onClick={() => setTimePeriod(p)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: isActive ? 'var(--accent-gradient)' : 'var(--bg-color)',
                      color: isActive ? '#FFFFFF' : 'var(--text-light)',
                      border: `1px solid ${isActive ? 'transparent' : 'var(--border-color)'}`,
                      boxShadow: isActive ? '0 4px 10px rgba(24, 20, 243, 0.2)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {labelMap[p]}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Inputs & Wallet Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {timePeriod === 'custom' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  animation: 'fadeUpIn 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>{t('from_date')}</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        background: 'var(--bg-color)'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>{t('to_date')}</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        background: 'var(--bg-color)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Wallet Selector Dropdown */}
              {isLoggedIn && wallets.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {t('filter_by_wallet') || 'Lọc theo ví:'}
                  </span>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--text-main)',
                      background: 'var(--card-bg)',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <option value="">{t('all_wallets') || 'Tất cả ví'}</option>
                    {wallets.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(parseFloat(w.available_balance))})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="balance-overview">
            <div className="balance-item">
              <div className="balance-label">{t('total_income')}</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(displayIncome) : formatCurrency(0)}</div>
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">{t('total_expense')}</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(displayExpense) : formatCurrency(0)}</div>
              {isLoggedIn && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '11px', 
                  fontWeight: '600', 
                  marginTop: '4px' 
                }}>
                  {expenseChangePercent > 0 ? (
                    <>
                      <span style={{ color: '#FE5C73', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        📈 +{expenseChangePercent.toFixed(1)}%
                      </span>
                      <span style={{ color: 'var(--text-light)', fontWeight: 'normal' }}>{t('vs_last_month')}</span>
                    </>
                  ) : expenseChangePercent < 0 ? (
                    <>
                      <span style={{ color: '#16DBCC', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        📉 {expenseChangePercent.toFixed(1)}%
                      </span>
                      <span style={{ color: 'var(--text-light)', fontWeight: 'normal' }}>{t('vs_last_month')}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-light)', fontWeight: 'normal' }}>{t('no_change_vs_last_month')}</span>
                  )}
                </div>
              )}
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">{t('net_balance')}</div>
              <div className="balance-val" style={{color: isLoggedIn && displayNet >= 0 ? '#16DBCC' : '#FE5C73'}}>
                {isLoggedIn ? formatCurrency(displayNet) : formatCurrency(0)}
              </div>
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">{t('total_wallet_balance')}</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(totalBalance) : formatCurrency(0)}</div>
            </div>
          </div>


          <div className="row">
            <div className="col-2" style={{flex:1.8}}>
              <div className="section-header"><h2 className="section-title">{t('income_vs_expense')}</h2></div>
              <div className="chart-card">
                <div className="bar-chart-mock" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="bar-legend">
                    <span><div className="dot diposit"></div> {t('income')}</span>
                    <span><div className="dot withdraw" style={{ background: '#FF6B81' }}></div> {t('spending')}</span>
                  </div>
                  <div className="bars-container" style={{
                    position: 'relative',
                    display: 'flex',
                    gap: mergedTrends.length > 15 ? (mergedTrends.length > 25 ? '2px' : '6px') : '24px',
                    alignItems: 'flex-end',
                    justifyContent: 'space-around',
                    height: '200px',
                    paddingBottom: '15px',
                    paddingTop: '20px',
                    borderBottom: '1px solid var(--border-color)',
                    width: '100%',
                    overflow: 'visible'
                  }}>
                    {/* Horizontal Gridlines */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
                      <div style={{ borderTop: '1px dashed var(--border-color)', width: '100%', height: '0', opacity: 0.8 }}></div>
                      <div style={{ borderTop: '1px dashed var(--border-color)', width: '100%', height: '0', opacity: 0.4 }}></div>
                      <div style={{ borderTop: '1px dashed var(--border-color)', width: '100%', height: '0', opacity: 0.4 }}></div>
                      <div style={{ borderTop: '1px dashed var(--border-color)', width: '100%', height: '0', opacity: 0.2 }}></div>
                    </div>

                    {!isLoggedIn || mergedTrends.length === 0 ? (
                      <div style={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                        <p style={{ color: '#718EBF' }}>{isLoadingTrends ? t('loading') : t('no_transaction_data')}</p>
                      </div>
                    ) : (
                      (() => {
                        const maxVal = Math.max(...mergedTrends.map(t => Math.max(t.income, t.expense)), 1000);
                        const colWidth = mergedTrends.length > 15 ? (mergedTrends.length > 25 ? '6px' : '10px') : '16px';
                        const colGap = mergedTrends.length > 15 ? (mergedTrends.length > 25 ? '2px' : '4px') : '6px';
                        const tooltipPrefix = trendsGroupBy === 'day' ? (t('day_label') || 'Ngày') : (t('month_label_prefix') || 'Tháng');

                        return mergedTrends.map((trend, idx) => {
                          const incomeHeight = `${Math.max((trend.income / maxVal) * 100, 2)}%`;
                          const expenseHeight = `${Math.max((trend.expense / maxVal) * 100, 2)}%`;
                          const showLabel = mergedTrends.length <= 12 || idx % Math.ceil(mergedTrends.length / 6) === 0 || idx === mergedTrends.length - 1;

                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', zIndex: 1, position: 'relative' }}>
                              
                              {/* Custom Floating Tooltip */}
                              {hoveredBar.idx === idx && hoveredBar.type !== null && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '165px',
                                  background: 'rgba(15, 23, 42, 0.95)',
                                  color: '#fff',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                                  whiteSpace: 'nowrap',
                                  zIndex: 10,
                                  pointerEvents: 'none',
                                  backdropFilter: 'blur(4px)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  alignItems: 'center'
                                }}>
                                  <span style={{ fontSize: '9px', opacity: 0.7, textTransform: 'uppercase' }}>{tooltipPrefix} {trend.label}</span>
                                  <span style={{ color: hoveredBar.type === 'income' ? '#16DBCC' : '#FF6B81' }}>
                                    {hoveredBar.type === 'income' ? `+ ${formatCurrency(trend.income)}` : `- ${formatCurrency(trend.expense)}`}
                                  </span>
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: colGap, height: '130px', width: '100%', justifyContent: 'center' }}>
                                {/* Income Column */}
                                <div 
                                  onMouseEnter={() => setHoveredBar({ idx, type: 'income' })}
                                  onMouseLeave={() => setHoveredBar({ idx, type: null })}
                                  style={{
                                    width: colWidth,
                                    height: incomeHeight,
                                    background: 'linear-gradient(180deg, #16DBCC 0%, #0BB5A7 100%)',
                                    borderRadius: '8px 8px 0 0',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    boxShadow: hoveredBar.idx === idx && hoveredBar.type === 'income' ? '0 10px 20px rgba(22, 219, 204, 0.4)' : '0 4px 10px rgba(22, 219, 204, 0.1)',
                                    transform: hoveredBar.idx === idx && hoveredBar.type === 'income' ? 'scaleY(1.05) scaleX(1.1)' : 'scale(1)',
                                    filter: hoveredBar.idx === idx && hoveredBar.type === 'income' ? 'brightness(1.1)' : 'none'
                                  }}
                                />
                                {/* Expense Column */}
                                <div 
                                  onMouseEnter={() => setHoveredBar({ idx, type: 'expense' })}
                                  onMouseLeave={() => setHoveredBar({ idx, type: null })}
                                  style={{
                                    width: colWidth,
                                    height: expenseHeight,
                                    background: 'linear-gradient(180deg, #FF6B81 0%, #FE5C73 100%)',
                                    borderRadius: '8px 8px 0 0',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    boxShadow: hoveredBar.idx === idx && hoveredBar.type === 'expense' ? '0 10px 20px rgba(254, 92, 115, 0.4)' : '0 4px 10px rgba(254, 92, 115, 0.1)',
                                    transform: hoveredBar.idx === idx && hoveredBar.type === 'expense' ? 'scaleY(1.05) scaleX(1.1)' : 'scale(1)',
                                    filter: hoveredBar.idx === idx && hoveredBar.type === 'expense' ? 'brightness(1.1)' : 'none'
                                  }}
                                />
                              </div>
                              {showLabel && (
                                <span style={{
                                  position: 'absolute',
                                  bottom: '-28px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  fontSize: '9px',
                                  color: 'var(--text-light)',
                                  fontWeight: '700',
                                  background: 'var(--border-color)',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  whiteSpace: 'nowrap',
                                  zIndex: 2
                                }}>
                                  {trend.label}
                                </span>
                              )}
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-1" style={{flex:1.2}}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title">{t('expense_allocation')}</h2>
                {isLoggedIn && categoryData.length > 0 && (
                  <div style={{
                    display: 'flex',
                    background: 'var(--bg-color)',
                    padding: '3px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={() => setAllocationType('parent')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '16px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: allocationType === 'parent' ? 'var(--card-bg)' : 'transparent',
                        color: allocationType === 'parent' ? 'var(--text-main)' : 'var(--text-light)',
                        boxShadow: allocationType === 'parent' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    >
                      {t('parent') || 'Cha'}
                    </button>
                    <button
                      onClick={() => setAllocationType('child')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '16px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: allocationType === 'child' ? 'var(--card-bg)' : 'transparent',
                        color: allocationType === 'child' ? 'var(--text-main)' : 'var(--text-light)',
                        boxShadow: allocationType === 'child' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    >
                      {t('child') || 'Con'}
                    </button>
                  </div>
                )}
              </div>
              <div className="chart-card" style={{ display: 'flex', flexDirection: 'row', gap: '30px', alignItems: 'center', padding: '24px 30px', minHeight: '260px' }}>
                {!isLoggedIn || categoryData.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '36px' }}>📊</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>
                      {isLoadingCategory ? t('loading') : t('no_data')}
                    </span>
                    <span style={{ color: 'var(--text-light)', fontSize: '11px', maxWidth: '200px' }}>
                      {isLoadingCategory ? t('syncing_chart') : t('no_spending_in_period')}
                    </span>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const activeIdx = hoveredCategory !== null ? hoveredCategory : selectedCategoryIdx;
                      const activeData = processedCategoryData[activeIdx] || null;
                      
                      return (
                        <>
                          <div style={{
                            position: 'relative',
                            width: '160px',
                            height: '160px',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <svg viewBox="0 0 100 100" style={{ width: '160px', height: '160px', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                              {/* Background track circle */}
                              <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="transparent"
                                stroke="var(--border-color)"
                                strokeWidth="8"
                                opacity="0.15"
                              />
                              {/* Segments */}
                              {(() => {
                                let accumulatedFraction = 0;
                                return processedCategoryData.map((cat, idx) => {
                                  const isSelected = activeIdx === idx;
                                  const r = isSelected ? 41 : 38;
                                  const strokeWidth = isSelected ? 12 : 8;
                                  const c = 2 * Math.PI * r;
                                  const segmentLength = (cat.percentage / 100) * c;
                                  const strokeDashArray = `${segmentLength} ${c}`;
                                  const strokeDashOffset = - (accumulatedFraction * c);
                                  accumulatedFraction += (cat.percentage / 100);
                                  
                                  return (
                                    <circle
                                      key={idx}
                                      cx="50"
                                      cy="50"
                                      r={r}
                                      fill="transparent"
                                      stroke={cat.category_color || '#718EBF'}
                                      strokeWidth={strokeWidth}
                                      strokeDasharray={strokeDashArray}
                                      strokeDashoffset={strokeDashOffset}
                                      opacity={activeIdx === null || isSelected ? 1 : 0.4}
                                      style={{
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer',
                                      }}
                                      onMouseEnter={() => setHoveredCategory(idx)}
                                      onMouseLeave={() => setHoveredCategory(null)}
                                      onClick={() => setSelectedCategoryIdx(idx)}
                                    />
                                  );
                                });
                              })()}
                            </svg>
                            
                            {/* Center text overlay */}
                            <div style={{
                              position: 'absolute',
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'none',
                              textAlign: 'center',
                              width: '95px',
                            }}>
                              <span style={{ 
                                fontSize: '10px', 
                                color: activeData ? activeData.category_color || 'var(--text-light)' : 'var(--text-light)', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.5px', 
                                fontWeight: '700',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%',
                                transition: 'color 0.2s ease'
                              }}>
                                {activeData ? activeData.category_name : t('spending')}
                              </span>
                              <span style={{ 
                                fontSize: '13px', 
                                fontWeight: '800', 
                                color: 'var(--text-main)', 
                                width: '100%', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                marginTop: '2px',
                                transition: 'all 0.2s ease'
                              }}>
                                {formatCurrency(activeData ? activeData.amount : totalCategoryExpense)}
                              </span>
                              {activeData && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: 'var(--text-light)',
                                  marginTop: '2px'
                                }}>
                                  {activeData.percentage}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* List of categories */}
                          <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            maxHeight: '230px',
                            overflowY: 'auto',
                            paddingRight: '6px'
                          }}>
                            {processedCategoryData.map((cat, idx) => {
                              const isSelected = activeIdx === idx;
                              return (
                                <div 
                                  key={idx} 
                                  onMouseEnter={() => setHoveredCategory(idx)}
                                  onMouseLeave={() => setHoveredCategory(null)}
                                  onClick={() => setSelectedCategoryIdx(idx)}
                                  style={{ 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    padding: '10px 12px',
                                    borderRadius: '16px',
                                    background: isSelected 
                                      ? (cat.category_color ? `${cat.category_color}0A` : 'var(--border-color)')
                                      : 'transparent',
                                    border: isSelected
                                      ? `1.5px solid ${cat.category_color || '#718EBF'}`
                                      : '1.5px solid transparent',
                                    boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.03)' : 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: isSelected ? 'translateX(2px)' : 'none',
                                    minWidth: 0
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    {/* Left side: Icon & Title */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                      <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        background: cat.category_color ? `${cat.category_color}1A` : 'rgba(113, 142, 191, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        flexShrink: 0
                                      }}>
                                        {parseIcon(cat.category_icon) || '📁'}
                                      </div>
                                      <span style={{
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: 'var(--text-main)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1
                                      }}>
                                        {cat.category_name}
                                      </span>
                                    </div>
                                    {/* Right side: Amount & Chevron */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                      <span style={{
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: 'var(--text-main)'
                                      }}>
                                        {formatCurrency(cat.amount)}
                                      </span>
                                      <span style={{
                                        color: isSelected ? (cat.category_color || '#718EBF') : 'var(--text-light)',
                                        fontSize: '15px',
                                        fontWeight: '800',
                                        marginLeft: '4px',
                                        transition: 'color 0.2s ease'
                                      }}>
                                        ›
                                      </span>
                                    </div>
                                  </div>
                                  {/* Bottom: Progress Bar */}
                                  <div style={{
                                    width: '100%',
                                    height: isSelected ? '6px' : '4px',
                                    background: 'var(--border-color)',
                                    borderRadius: '3px',
                                    marginTop: '6px',
                                    overflow: 'hidden',
                                    position: 'relative'
                                  }}>
                                    <div style={{
                                      width: `${cat.percentage}%`,
                                      height: '100%',
                                      background: cat.category_color || '#718EBF',
                                      borderRadius: '3px',
                                      transition: 'width 0.4s ease-in-out'
                                    }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="row" style={{ marginTop: '24px' }}>
            <div className="col-2" style={{ flex: 2 }}>
              <div className="section-header">
                <h2 className="section-title">
                  {t('daily_spending_trend') || 'Xu hướng chi tiêu hàng ngày'}
                </h2>
              </div>
              <div className="chart-card" style={{ 
                padding: '24px 30px', 
                height: '280px', 
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                overflow: 'visible'
              }}>
                {!isLoggedIn || dailyTrendsData.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '36px' }}>📈</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>
                      {isLoadingDailyTrends ? t('loading') : t('no_transaction_data')}
                    </span>
                    <span style={{ color: 'var(--text-light)', fontSize: '11px', maxWidth: '300px' }}>
                      {isLoadingDailyTrends ? t('syncing_chart') : t('no_spending_in_period')}
                    </span>
                  </div>
                ) : (
                  (() => {


                    const processedDailyTrends: any[] = [];
                    
                    if (trendsGroupBy === 'day') {
                      const dateStrings = getDatesBetween(activeStartDate, activeEndDate);
                      dateStrings.forEach((dateString) => {
                        const found = dailyTrendsData.find(item => item.date === dateString);
                        const dVal = new Date(dateString);
                        processedDailyTrends.push({
                          day: dVal.getDate(),
                          label: `${dVal.getDate()}/${dVal.getMonth() + 1}`,
                          expense: found ? Math.abs(Number(found.expense)) : 0,
                        });
                      });
                    } else {
                      const months = getMonthsBetween(activeStartDate, activeEndDate);
                      months.forEach((m) => {
                        const found = dailyTrendsData.find(item => item.month === m.month && item.year === m.year);
                        processedDailyTrends.push({
                          day: m.month,
                          label: m.label,
                          expense: found ? Math.abs(Number(found.expense)) : 0,
                        });
                      });
                    }

                    const maxExpense = Math.max(...processedDailyTrends.map(t => t.expense), 100000);
                    const getX = (idx: number) => {
                      const len = processedDailyTrends.length;
                      if (len <= 1) return 450;
                      return (idx / (len - 1)) * 900;
                    };
                    const getY = (amount: number) => 170 - (amount / maxExpense) * 135;

                    const points = processedDailyTrends.map((t, idx) => ({
                      x: getX(idx),
                      y: getY(t.expense)
                    }));

                    // Generate a smooth Catmull-Rom cubic bezier spline path
                    let dPath = '';
                    if (points.length > 0) {
                      dPath = points.reduce((acc, p, idx, arr) => {
                        if (idx === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                        const prev = arr[idx - 1];
                        const prevPrev = arr[idx - 2] || prev;
                        const next = arr[idx + 1] || p;
                        
                        const cp1x = prev.x + (p.x - prev.x) / 3;
                        let cp1y = prev.y + (p.y - prevPrev.y) / 6;
                        
                        const cp2x = p.x - (p.x - prev.x) / 3;
                        let cp2y = p.y - (next.y - prev.y) / 6;

                        // Clamp control points Y to avoid overshoot outside local min/max values
                        const minY = Math.min(prev.y, p.y) - 15;
                        const maxY = Math.max(prev.y, p.y) + 15;
                        cp1y = Math.max(minY, Math.min(maxY, cp1y));
                        cp2y = Math.max(minY, Math.min(maxY, cp2y));
                        
                        return `${acc} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                      }, "");
                    }

                    const dArea = points.length > 0 
                      ? `${dPath} L ${points[points.length - 1].x.toFixed(1)} 170 L ${points[0].x.toFixed(1)} 170 Z`
                      : '';

                    return (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <svg viewBox="0 0 900 210" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          <defs>
                            {/* Area Gradient */}
                            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF6B81" stopOpacity="0.45"/>
                              <stop offset="50%" stopColor="#FF6B81" stopOpacity="0.15"/>
                              <stop offset="100%" stopColor="#FF6B81" stopOpacity="0.00"/>
                            </linearGradient>
                            {/* Glow Filter */}
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FF6B81" floodOpacity="0.3"/>
                            </filter>
                          </defs>

                          {/* Grid lines */}
                          <g stroke="var(--border-color)" strokeWidth="1" opacity="0.8">
                            {/* Horizontal Lines */}
                            <line x1="0" y1="35" x2="900" y2="35" strokeDasharray="4 4" />
                            <line x1="0" y1="80" x2="900" y2="80" strokeDasharray="4 4" />
                            <line x1="0" y1="125" x2="900" y2="125" strokeDasharray="4 4" />
                            <line x1="0" y1="170" x2="900" y2="170" strokeWidth="1.5" />
                            
                            {/* Vertical grid lines at label positions */}
                            {processedDailyTrends.filter((_, idx) => idx % 5 === 0 || idx === processedDailyTrends.length - 1).map((item, idx) => {
                              const x = getX(processedDailyTrends.indexOf(item));
                              return (
                                <line
                                  key={idx}
                                  x1={x}
                                  y1="35"
                                  x2={x}
                                  y2="170"
                                  strokeDasharray="4 4"
                                  opacity="0.4"
                                />
                              );
                            })}
                          </g>

                          {/* Area under the path */}
                          <path d={dArea} fill="url(#expenseGrad)" />

                          {/* The line itself with glow */}
                          <path d={dPath} fill="none" stroke="#FF6B81" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

                          {/* Tiny dots on days with transactions */}
                          {processedDailyTrends.map((t, idx) => {
                            if (t.expense === 0) return null;
                            return (
                              <circle
                                key={idx}
                                cx={getX(idx)}
                                cy={getY(t.expense)}
                                r="4"
                                fill="#FF6B81"
                                stroke="var(--card-bg)"
                                strokeWidth="1.5"
                                style={{ filter: 'drop-shadow(0px 1px 3px rgba(255,107,129,0.4))' }}
                                pointerEvents="none"
                              />
                            );
                          })}

                          {/* Interaction helper line */}
                          {hoveredDailyPoint !== null && (
                            <line
                              x1={getX(hoveredDailyPoint as number)}
                              y1="35"
                              x2={getX(hoveredDailyPoint as number)}
                              y2="170"
                              stroke="#FF6B81"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                              opacity="0.8"
                              pointerEvents="none"
                            />
                          )}

                          {/* Glowing dot for hovered day */}
                          {hoveredDailyPoint !== null && (
                            <circle
                              cx={getX(hoveredDailyPoint as number)}
                              cy={getY(processedDailyTrends[hoveredDailyPoint as number].expense)}
                              r="6"
                              fill="#FF6B81"
                              stroke="#fff"
                              strokeWidth="2.5"
                              style={{ filter: 'drop-shadow(0px 2px 6px rgba(255,107,129,0.6))' }}
                              pointerEvents="none"
                            />
                          )}

                          {/* Invisible hover grid columns */}
                          {processedDailyTrends.map((_, idx) => (
                            <rect
                              key={idx}
                              x={getX(idx) - 450 / (processedDailyTrends.length - 1)}
                              y="0"
                              width={900 / (processedDailyTrends.length - 1)}
                              height="170"
                              fill="transparent"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={() => setHoveredDailyPoint(idx)}
                              onMouseLeave={() => setHoveredDailyPoint(null)}
                            />
                          ))}

                          {/* X-axis labels with smart textAnchors */}
                          {processedDailyTrends.filter((_, idx) => idx % 5 === 0 || idx === processedDailyTrends.length - 1).map((item, idx) => {
                            const actualIdx = processedDailyTrends.indexOf(item);
                            const x = getX(actualIdx);
                            const isFirst = actualIdx === 0;
                            const isLast = actualIdx === processedDailyTrends.length - 1;
                            const textAnchor = isFirst ? "start" : isLast ? "end" : "middle";
                            return (
                              <text
                                key={idx}
                                x={x}
                                y="195"
                                textAnchor={textAnchor}
                                fill="var(--text-light)"
                                fontSize="11"
                                fontWeight="600"
                              >
                                {trendsGroupBy === 'day' ? `${t('day_label')} ${item.day}` : `${t('month_label_prefix')} ${item.day}`}
                              </text>
                            );
                          })}

                          {/* Floating Tooltip inside SVG */}
                          {hoveredDailyPoint !== null && (() => {
                            const item = processedDailyTrends[hoveredDailyPoint as number];
                            const xVal = getX(hoveredDailyPoint as number);
                            const yVal = getY(item.expense);
                            
                            const tooltipWidth = 140;
                            const tooltipHeight = 52;
                            
                            // Center the tooltip horizontally, clamp within SVG bounds [10, 890]
                            let tx = xVal - tooltipWidth / 2;
                            if (tx < 10) tx = 10;
                            if (tx + tooltipWidth > 890) tx = 890 - tooltipWidth;
                            
                            // Position above the point by default, but if too close to the top, show below
                            const showBelow = yVal < 75;
                            const ty = showBelow ? yVal + 15 : yVal - tooltipHeight - 15;
                            
                            return (
                              <g pointerEvents="none">
                                {/* Tooltip Shadow Overlay */}
                                <rect
                                  x={tx}
                                  y={ty}
                                  width={tooltipWidth}
                                  height={tooltipHeight}
                                  rx="8"
                                  ry="8"
                                  fill="#0F172A"
                                  opacity="0.95"
                                  stroke="rgba(255, 255, 255, 0.15)"
                                  strokeWidth="1.2"
                                  style={{ filter: 'drop-shadow(0px 6px 16px rgba(0,0,0,0.35))' }}
                                />
                                {/* Tooltip text: Date */}
                                <text
                                  x={tx + tooltipWidth / 2}
                                  y={ty + 20}
                                  textAnchor="middle"
                                  fill="#94A3B8"
                                  fontSize="10"
                                  fontWeight="500"
                                >
                                  {trendsGroupBy === 'day' ? `${t('day_label')} ${item.label}` : `${t('month_label_prefix')} ${item.label}`}
                                </text>
                                {/* Tooltip text: Amount */}
                                <text
                                  x={tx + tooltipWidth / 2}
                                  y={ty + 38}
                                  textAnchor="middle"
                                  fill="#FF6B81"
                                  fontSize="13"
                                  fontWeight="700"
                                >
                                  -{formatCurrency(item.expense)}
                                </text>
                              </g>
                            );
                          })()}
                        </svg>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            <div className="col-1" style={{ flex: 1 }}>
              <div className="section-header">
                <h2 className="section-title">
                  {t('top_categories') || 'Top 5 danh mục chi tiêu nhiều nhất'}
                </h2>
              </div>
              <div className="chart-card" style={{
                padding: '20px 24px',
                height: '280px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {!isLoggedIn || top5Categories.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '36px' }}>🏆</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>
                      {isLoadingCategory ? t('loading') : t('no_data')}
                    </span>
                    <span style={{ color: 'var(--text-light)', fontSize: '11px', maxWidth: '200px' }}>
                      {isLoadingCategory ? t('syncing_chart') : t('no_spending_in_period')}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    {top5Categories.map((cat, idx) => (
                      <div 
                        key={idx}
                        onMouseEnter={() => setHoveredTopCategory(idx)}
                        onMouseLeave={() => setHoveredTopCategory(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '6px 8px',
                          borderRadius: '12px',
                          background: hoveredTopCategory === idx ? 'var(--border-color)' : 'transparent',
                          transform: hoveredTopCategory === idx ? 'translateX(4px)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {/* Rank indicator */}
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--text-light)',
                          width: '16px',
                          textAlign: 'center',
                          flexShrink: 0
                        }}>
                          #{idx + 1}
                        </span>
                        
                        {/* Icon badge with background tint */}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: cat.category_color ? `${cat.category_color}15` : 'rgba(113, 142, 191, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          flexShrink: 0
                        }}>
                          {parseIcon(cat.category_icon) || '📁'}
                        </div>

                        {/* Text, Progress Bar, and Amount details */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, gap: '2px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--text-main)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}>
                              {cat.category_name}
                            </span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--text-main)',
                              flexShrink: 0
                            }}>
                              {formatCurrency(cat.amount)}
                            </span>
                          </div>
                          
                          {/* Progress bar and percentage */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ flex: 1, height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${cat.percentage}%`,
                                height: '100%',
                                background: cat.category_color || '#718EBF',
                                borderRadius: '2px'
                              }} />
                            </div>
                            <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-light)', width: '24px', textAlign: 'right', flexShrink: 0 }}>
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-1" style={{flex:1}}>
              <div className="section-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 className="section-title">{t('recent_transactions')}</h2>
                {isLoggedIn && (
                  <Link href="/transactions" style={{fontSize:'13px', color:'#1814F3', fontWeight:'600', textDecoration:'none'}}>
                    {t('details') || 'Chi tiết'}
                  </Link>
                )}
              </div>
              <div className="transactions-card">
                {!isLoggedIn || filteredRecentTransactions.length === 0 ? (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: '#718EBF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '32px' }}>💸</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '14px' }}>{t('no_transactions')}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', maxWidth: '240px' }}>{t('first_transaction_prompt')}</span>
                  </div>
                ) : (
                  filteredRecentTransactions.slice(0, 4).map((x, i) => (
                    <div className="transaction-item" key={i}>
                      <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',background:'var(--bg-color)',marginRight:'15px'}}>
                        {parseIcon(x.category?.icon) || (x.type === 'expense' ? '💸' : '💰')}
                      </div>
                      <div className="tx-details">
                        <div className="tx-title">{x.title || x.desc || x.notes || t('other')}</div>
                        <div className="tx-date">{formatDate(x.transaction_date)}</div>
                      </div>
                      <div className="tx-amount" style={{color: x.type === 'expense' || x.amount < 0 ? '#FE5C73' : '#16DBCC'}}>
                        {x.type === 'expense' || x.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(parseFloat(x.amount || 0)))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="col-1" style={{flex:1}}>
              <div className="section-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 className="section-title">{t('budget')}</h2>
                {isLoggedIn && budgetsList.length > 0 && (
                  <Link href="/budget" style={{fontSize:'13px', color:'#1814F3', fontWeight:'600', textDecoration:'none'}}>
                    {t('details') || 'Chi tiết'}
                  </Link>
                )}
              </div>
              <div className="transactions-card" style={{height:'auto', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px'}}>
                {isLoadingBudget ? (
                  <div style={{ textAlign: 'center', color: '#718EBF' }}>{t('loading')}</div>
                ) : !isLoggedIn ? (
                  <div style={{ textAlign: 'center', color: '#718EBF' }}>
                    <p style={{marginBottom: '10px'}}>{t('please_login')}</p>
                    <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'6px 12px',borderRadius:'15px',fontWeight:'bold', fontSize:'13px'}}>{t('login')}</Link>
                  </div>
                ) : budgetsList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#718EBF' }}>
                    <p style={{fontSize: '14px', margin: 0}}>{t('no_budget_set')}</p>
                    <div style={{display:'flex', gap:'8px', justifyContent:'center', marginTop:'12px', flexWrap:'wrap'}}>
                      <Link href="/budget" style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#1814F3',
                        color: '#fff',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        {t('set_budget')}
                      </Link>
                      <button 
                        onClick={handleCopyBudgets}
                        disabled={isLoadingBudget}
                        style={{
                          padding: '8px 16px',
                          background: 'transparent',
                          color: '#1814F3',
                          borderRadius: '10px',
                          border: '1px solid #1814F3',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {t('copy_from_previous_month')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', gap:'12px', width:'100%'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontWeight:'700', color:'var(--text-main)', fontSize:'15px'}}>
                        {overallBudget ? t('total_monthly_budget') : (t('category_budgets') || 'Ngân sách danh mục')}
                      </span>
                      <span style={{fontSize:'14px', fontWeight:'700', color: totalPct >= 100 ? '#FE5C73' : totalPct >= 80 ? '#FF9800' : '#16DBCC'}}>
                        {totalPct}%
                      </span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div style={{width:'100%', height:'12px', background:'var(--bg-color)', borderRadius:'6px', overflow:'hidden'}}>
                      <div style={{
                        width: `${Math.min(totalPct, 100)}%`,
                        height: '100%',
                        background: totalPct >= 100 ? '#FE5C73' : totalPct >= 80 ? '#FF9800' : '#16DBCC',
                        borderRadius: '6px',
                        transition: 'width 0.6s ease-in-out'
                      }}></div>
                    </div>
                    
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#718EBF'}}>
                      <div>
                        <span style={{fontWeight:'600', color:'var(--text-main)'}}>{formatCurrency(totalUsed)}</span>
                        <span> / {formatCurrency(totalLimit)}</span>
                      </div>
                    </div>

                    <div style={{fontSize:'12px', marginTop:'2px'}}>
                      {totalUsed > totalLimit ? (
                        <span style={{color:'#FE5C73', fontWeight:'600'}}>
                          🚨 {t('over_budget') || 'Vượt ngân sách!'} ({formatCurrency(totalUsed - totalLimit)})
                        </span>
                      ) : (
                        <span style={{color:'#16DBCC', fontWeight:'600'}}>
                          ✓ {t('remaining_label') || 'Còn lại:'} {formatCurrency(totalLimit - totalUsed)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-1" style={{flex:1}}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title">{t('wallets')}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setShowWalletBalance(!showWalletBalance)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718EBF', display: 'flex', alignItems: 'center', padding: '5px' }}
                    title={showWalletBalance ? t('hide_balance') : t('show_balance')}
                  >
                    {showWalletBalance ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </button>
                  {isLoggedIn && (
                    <Link href="/wallets" style={{fontSize:'13px', color:'#1814F3', fontWeight:'600', textDecoration:'none'}}>
                      {t('details') || 'Chi tiết'}
                    </Link>
                  )}
                </div>
              </div>
              <div className="transactions-card" style={{height:'auto', padding: '16px'}}>
                {isLoadingWallets ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>{t('loading')}</div>
                ) : !isLoggedIn || wallets.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#718EBF' }}>{t('no_wallets')}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {wallets.slice(0, 3).map((w, i) => {
                      const walletTypeMap: Record<string, { icon: string; label: string; gradient: string }> = {
                        cash: { icon: '💵', label: t('cash') || 'Tiền mặt', gradient: 'linear-gradient(135deg, #16DBCC, #0BB5A7)' },
                        bank: { icon: '🏦', label: t('bank') || 'Ngân hàng', gradient: 'linear-gradient(135deg, #1814F3, #396AFF)' },
                        ewallet: { icon: '📱', label: t('ewallet') || 'Ví điện tử', gradient: 'linear-gradient(135deg, #FF6B81, #FE5C73)' },
                      };
                      const wType = walletTypeMap[w.type] || walletTypeMap['bank'];
                      const walletColor = w.color || '#396AFF';
                      
                      return (
                        <div 
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '14px',
                            background: 'var(--bg-color)',
                            border: '1px solid var(--border-color)',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = 'none';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                          }}
                        >
                          {/* Left accent stripe */}
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            background: walletColor,
                            borderRadius: '14px 0 0 14px'
                          }} />
                          
                          {/* Icon */}
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            background: `${walletColor}15`,
                            flexShrink: 0
                          }}>
                            {parseIcon(w.icon) || wType.icon}
                          </div>
                          
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontWeight: '700',
                              fontSize: '13px',
                              color: 'var(--text-main)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {w.name || t('main_account')}
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '3px'
                            }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                color: walletColor,
                                background: `${walletColor}15`,
                                padding: '1px 6px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px'
                              }}>
                                {wType.label}
                              </span>
                              {w.currency_code && w.currency_code !== 'VND' && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: 'var(--text-light)',
                                  background: 'var(--border-color)',
                                  padding: '1px 5px',
                                  borderRadius: '4px'
                                }}>
                                  {w.currency_code}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Balance */}
                          <div style={{
                            fontWeight: '800',
                            fontSize: '13px',
                            color: 'var(--text-main)',
                            flexShrink: 0,
                            textAlign: 'right'
                          }}>
                            {showWalletBalance ? formatCurrency(parseFloat(w.available_balance)) : '••••••'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

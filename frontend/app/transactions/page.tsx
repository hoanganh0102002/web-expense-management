"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { apiFetch, budgetApi, transactionApi } from '../lib/api';

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

interface SmartFilters {
  minAmount?: string;
  maxAmount?: string;
  category_id?: string;
  categoryName?: string;
  wallet_id?: string;
  walletName?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  typeName?: string;
  cleanSearch?: string;
}

const parseSmartQuery = (query: string, flatCategories: any[], wallets: any[]): SmartFilters => {
  if (!query) return {};

  let text = query.toLowerCase().trim();
  const filters: SmartFilters = {};

  // Helper to parse amount strings like "50k" -> 50000, "1.5m" -> 1500000, "1tr" -> 1000000
  const parseAmountVal = (valStr: string): number => {
    let factor = 1;
    let cleanVal = valStr.trim();
    if (cleanVal.endsWith('k')) {
      factor = 1000;
      cleanVal = cleanVal.slice(0, -1);
    } else if (cleanVal.endsWith('m')) {
      factor = 1000000;
      cleanVal = cleanVal.slice(0, -1);
    } else if (cleanVal.endsWith('tr') || cleanVal.endsWith('triệu') || cleanVal.endsWith('trieu')) {
      factor = 1000000;
      if (cleanVal.endsWith('triệu')) cleanVal = cleanVal.slice(0, -5);
      else if (cleanVal.endsWith('trieu')) cleanVal = cleanVal.slice(0, -5);
      else cleanVal = cleanVal.slice(0, -2);
    }
    const num = parseFloat(cleanVal);
    return isNaN(num) ? 0 : num * factor;
  };

  // 1. Lọc khoảng số tiền: e.g. "10k - 50k", "10000 - 50000"
  const rangeRegex = /(\d+(?:\.\d+)?(?:k|m|tr|triệu|trieu)?)\s*-\s*(\d+(?:\.\d+)?(?:k|m|tr|triệu|trieu)?)/i;
  const rangeMatch = rangeRegex.exec(text);
  if (rangeMatch) {
    const min = parseAmountVal(rangeMatch[1]);
    const max = parseAmountVal(rangeMatch[2]);
    if (min > 0) filters.minAmount = min.toString();
    if (max > 0) filters.maxAmount = max.toString();
    text = text.replace(rangeRegex, '');
  }

  // Lọc số tiền tối thiểu: e.g. "> 50k", ">= 100k", "lớn hơn 50k", "lon hon 500"
  const gtRegex = /(?:>=|>|lớn hơn|lon hon)\s*(\d+(?:\.\d+)?(?:k|m|tr|triệu|trieu)?)/i;
  const gtMatch = gtRegex.exec(text);
  if (gtMatch) {
    const val = parseAmountVal(gtMatch[1]);
    if (val > 0) filters.minAmount = val.toString();
    text = text.replace(gtRegex, '');
  }

  // Lọc số tiền tối đa: e.g. "< 50k", "<= 100k", "nhỏ hơn 50k", "nho hon 500"
  const ltRegex = /(?:<=|<|nhỏ hơn|nho hon)\s*(\d+(?:\.\d+)?(?:k|m|tr|triệu|trieu)?)/i;
  const ltMatch = ltRegex.exec(text);
  if (ltMatch) {
    const val = parseAmountVal(ltMatch[1]);
    if (val > 0) filters.maxAmount = val.toString();
    text = text.replace(ltRegex, '');
  }

  // 2. Lọc thời gian tương đối
  const today = new Date();
  const getISOString = (d: Date) => d.toISOString().split('T')[0];

  if (text.includes('hôm nay') || text.includes('today')) {
    filters.startDate = getISOString(today);
    filters.endDate = getISOString(today);
    text = text.replace(/hôm nay|today/gi, '');
  } else if (text.includes('hôm qua') || text.includes('yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    filters.startDate = getISOString(yesterday);
    filters.endDate = getISOString(yesterday);
    text = text.replace(/hôm qua|yesterday/gi, '');
  } else if (text.includes('tuần này') || text.includes('this week')) {
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    filters.startDate = getISOString(monday);
    filters.endDate = getISOString(new Date());
    text = text.replace(/tuần này|this week/gi, '');
  } else if (text.includes('tháng này') || text.includes('this month')) {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    filters.startDate = getISOString(firstDay);
    filters.endDate = getISOString(new Date());
    text = text.replace(/tháng này|this month/gi, '');
  } else {
    // Check specific month: "tháng 5", "tháng 05", "thang 5", "month 5"
    const monthRegex = /(?:tháng|thang|month)\s*(\d+)/i;
    const monthMatch = monthRegex.exec(text);
    if (monthMatch) {
      const targetMonth = parseInt(monthMatch[1]) - 1;
      if (targetMonth >= 0 && targetMonth <= 11) {
        const year = today.getFullYear();
        const firstDay = new Date(year, targetMonth, 1);
        const lastDay = new Date(year, targetMonth + 1, 0);
        filters.startDate = getISOString(firstDay);
        filters.endDate = getISOString(lastDay);
      }
      text = text.replace(monthRegex, '');
    }
  }

  // 3. Lọc Loại giao dịch
  if (text.includes('thu nhập') || text.includes('income')) {
    filters.type = 'income';
    filters.typeName = 'Thu nhập';
    text = text.replace(/thu nhập|income/gi, '');
  } else if (text.includes('chi tiêu') || text.includes('spending') || text.includes('expense')) {
    filters.type = 'expense';
    filters.typeName = 'Chi tiêu';
    text = text.replace(/chi tiêu|spending|expense/gi, '');
  } else if (text.includes('chuyển khoản') || text.includes('chuyển tiền') || text.includes('transfer')) {
    filters.type = 'transfer';
    filters.typeName = 'Chuyển khoản';
    text = text.replace(/chuyển khoản|chuyển tiền|transfer/gi, '');
  }

  // 4. Lọc theo Ví: Duyệt tìm ví phù hợp
  for (const w of wallets) {
    const wName = (w.wallet_name || w.name || '').toLowerCase();
    if (wName && text.includes(wName)) {
      filters.wallet_id = w.id;
      filters.walletName = w.wallet_name || w.name;
      text = text.replace(wName, '');
      break;
    }
  }

  // 5. Lọc theo Danh mục: Duyệt tìm danh mục phù hợp
  for (const c of flatCategories) {
    const cName = (c.name || '').toLowerCase();
    if (cName && text.includes(cName)) {
      filters.category_id = c.id;
      filters.categoryName = c.name;
      text = text.replace(cName, '');
      break;
    }
  }

  // Chuỗi sạch còn lại để tìm kiếm text
  filters.cleanSearch = text.replace(/\s+/g, ' ').trim();
  return filters;
};

export default function Transactions() {
  const {
    isLoggedIn,
    transactions,
    isLoadingTransactions,
    fetchTransactions,
    createTransaction,
    deleteTransaction,
    wallets,
    categories,
    userData
  } = useAppContext();
  const { t } = useLanguage();
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [newTx, setNewTx] = useState({
    title: '',
    amount: '',
    type: 'expense',
    wallet_id: '',
    category_id: '',
    payee_id: '',
    transaction_date: getLocalDateTime(),
    notes: '',
    attachment: null as File | null,
    is_recurring: false,
    frequency: 'monthly',
    end_date: ''
  });

  const [payees, setPayees] = useState<any[]>([]);
  const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
  const [payeeSearchTerm, setPayeeSearchTerm] = useState('');

  useEffect(() => {
    if (isPayeeModalOpen) {
      const fetchPayees = async () => {
        try {
          console.log("Fetching payees from /payees API...");
          const res = await apiFetch('/payees');
          console.log("Payees API response:", res);
          
          // Handle different API response structures robustly
          let payeesArray = [];
          if (Array.isArray(res)) {
            payeesArray = res;
          } else if (res?.data && Array.isArray(res.data)) {
            payeesArray = res.data;
          } else if (res?.data?.data && Array.isArray(res.data.data)) {
            payeesArray = res.data.data;
          }
          
          // Nếu danh sách rỗng (chưa có dữ liệu từ backend), tự động thêm dữ liệu mẫu để test UI
          if (payeesArray.length === 0) {
            console.log("Payees list is empty. Using mock data for testing.");
            payeesArray = [
              { id: 'mock-uuid-1', payee_name: 'Nguyễn Văn A (Dữ liệu mẫu)', identifier: '0901234567' },
              { id: 'mock-uuid-2', payee_name: 'Trần Thị B (Dữ liệu mẫu)', identifier: '0987654321' },
              { id: 'mock-uuid-3', payee_name: 'Lê Văn C (Dữ liệu mẫu)', identifier: 'levanc@example.com' }
            ];
          }
          
          console.log("Parsed payees array:", payeesArray);
          setPayees(payeesArray);
        } catch (e: any) {
          console.error("Lỗi khi lấy danh sách người hưởng thụ:", e);
          alert("Lỗi khi tải danh sách người thụ hưởng: " + (e.message || e));
        }
      };
      
      const token = localStorage.getItem('access_token');
      if (typeof window !== 'undefined' && token) {
        fetchPayees();
      }
    }
  }, [isPayeeModalOpen]);

  const [activeTab, setActiveTab] = useState('all');

  const [internalTransfers, setInternalTransfers] = useState<any[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [isLoadingRecurring, setIsLoadingRecurring] = useState(false);
  const [isEditRecurringModalOpen, setIsEditRecurringModalOpen] = useState(false);
  const [editingRecurringTx, setEditingRecurringTx] = useState<any>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isRuleDetailModalOpen, setIsRuleDetailModalOpen] = useState(false);
  const [viewingRuleTx, setViewingRuleTx] = useState<any>(null);

  // States for search and advanced filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [perPage, setPerPage] = useState('10');

  // Pagination cursors state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [regularPage, setRegularPage] = useState(1);
  const [transferPage, setTransferPage] = useState(1);
  const [recurringPage, setRecurringPage] = useState(1);

  // Flatten category tree into a flat list for the select dropdown
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

  const smartFilters = useMemo(() => {
    return parseSmartQuery(searchTerm, flatCategories, wallets);
  }, [searchTerm, flatCategories, wallets]);

  // Helper to change filter states and automatically reset pagination cursor
  const handleFilterChange = (updater: () => void) => {
    updater();
    setCurrentCursor(null);
    setRegularPage(1);
    setTransferPage(1);
    setRecurringPage(1);
  };

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentCursor(null);
      setRegularPage(1);
      setTransferPage(1);
      setRecurringPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadFilteredTransactions = async (cursorVal?: string | null) => {
    if (!isLoggedIn) return;

    // Parse the query
    const parsed = parseSmartQuery(debouncedSearch, flatCategories, wallets);

    const params: any = {
      sort_by: sortBy,
      sort_order: sortOrder,
      per_page: perPage,
    };

    // Apply clean text search
    if (activeTab === 'recurring_history') {
      params.per_page = 500; // Lấy nhiều để filter client-side
    } else if (parsed.cleanSearch) {
      params.search = parsed.cleanSearch;
    } else if (debouncedSearch && Object.keys(parsed).length === 0) {
      params.search = debouncedSearch;
    }

    const finalStartDate = parsed.startDate || startDate;
    const finalEndDate = parsed.endDate || endDate;
    const finalWalletId = parsed.wallet_id || selectedWallet;
    const finalCategoryId = parsed.category_id || selectedCategory;
    const finalMinAmount = parsed.minAmount || minAmount;
    const finalMaxAmount = parsed.maxAmount || maxAmount;
    const finalType = parsed.type || (activeTab !== 'all' && activeTab !== 'transfer' && activeTab !== 'recurring_history' ? activeTab : undefined);

    if (finalStartDate) params.start_date = finalStartDate;
    if (finalEndDate) params.end_date = finalEndDate;
    if (finalWalletId) params.wallet_id = finalWalletId;
    if (finalCategoryId) params.category_id = finalCategoryId;
    if (finalMinAmount) params.min_amount = finalMinAmount;
    if (finalMaxAmount) params.max_amount = finalMaxAmount;
    if (finalType) params.type = finalType;

    if (cursorVal) {
      params.cursor = cursorVal;
    }

    try {
      const paginatedData = await fetchTransactions(params);
      if (paginatedData) {
        setNextCursor(paginatedData.next_cursor || null);
        setPrevCursor(paginatedData.prev_cursor || null);
      }
    } catch (err) {
      console.error("Lỗi khi tải giao dịch:", err);
    }
  };

  // Trigger transaction reload whenever filters or page cursor changes
  useEffect(() => {
    if (isLoggedIn && activeTab !== 'transfer' && activeTab !== 'recurring') {
      loadFilteredTransactions(currentCursor);
    }
  }, [
    isLoggedIn,
    activeTab,
    debouncedSearch,
    startDate,
    endDate,
    selectedWallet,
    selectedCategory,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
    perPage,
    currentCursor
  ]);

  // Fetch transfers when transfer tab is active
  useEffect(() => {
    if (activeTab === 'transfer') {
      setIsLoadingTransfers(true);
      apiFetch('/wallets/transfers')
        .then(res => setInternalTransfers(res.data || []))
        .catch(err => console.error('Error fetching transfers', err))
        .finally(() => setIsLoadingTransfers(false));
    }
  }, [activeTab]);

  // Fetch recurring when recurring tab is active
  useEffect(() => {
    if (activeTab === 'recurring') {
      setIsLoadingRecurring(true);
      apiFetch('/recurring-rules')
        .then(res => {
          const data = res.data ? res.data : (Array.isArray(res) ? res : []);
          setRecurringTransactions(data);
        })
        .catch(err => console.error('Error fetching recurring transactions', err))
        .finally(() => setIsLoadingRecurring(false));
    }
  }, [activeTab]);

  // Client-side filtering and sorting for internal transfers
  const filteredTransfers = useMemo(() => {
    let result = [...internalTransfers];
    const parsed = parseSmartQuery(debouncedSearch, flatCategories, wallets);

    const searchStr = parsed.cleanSearch || (Object.keys(parsed).length === 0 ? debouncedSearch : '');
    if (searchStr) {
      const s = searchStr.toLowerCase();
      result = result.filter(t =>
        t.from_wallet_name.toLowerCase().includes(s) ||
        t.to_wallet_name.toLowerCase().includes(s)
      );
    }

    const finalStartDate = parsed.startDate || startDate;
    const finalEndDate = parsed.endDate || endDate;
    const finalWalletId = parsed.wallet_id || selectedWallet;
    const finalMinAmount = parsed.minAmount || minAmount;
    const finalMaxAmount = parsed.maxAmount || maxAmount;

    if (finalStartDate) {
      const start = new Date(finalStartDate);
      result = result.filter(t => new Date(t.date) >= start);
    }
    if (finalEndDate) {
      const end = new Date(finalEndDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.date) <= end);
    }

    if (finalWalletId) {
      const walletObj = wallets.find(w => w.id === finalWalletId);
      if (walletObj) {
        const wName = walletObj.name || walletObj.wallet_name;
        result = result.filter(t => t.from_wallet_name === wName || t.to_wallet_name === wName);
      }
    }

    if (finalMinAmount) {
      result = result.filter(t => t.amount >= parseFloat(finalMinAmount));
    }
    if (finalMaxAmount) {
      result = result.filter(t => t.amount <= parseFloat(finalMaxAmount));
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [internalTransfers, debouncedSearch, startDate, endDate, selectedWallet, minAmount, maxAmount, sortBy, sortOrder, wallets, flatCategories]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedWallet('');
    setSelectedCategory('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date');
    setSortOrder('desc');
    setPerPage('10');
    setSearchTerm('');
    setCurrentCursor(null);
    setRegularPage(1);
    setTransferPage(1);
    setRecurringPage(1);
  };

  useEffect(() => {
    if (wallets.length > 0 && !newTx.wallet_id) {
      setNewTx(prev => ({ ...prev, wallet_id: wallets[0].id }));
    }
  }, [wallets]);

  const handleAdd = () => setIsModalOpen(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewTx({ ...newTx, attachment: e.target.files[0] });
    }
  };

  const toggleRecurringRule = async (tx: any) => {
    try {
      // Gửi thẳng POST vì API chỉ nhận POST hoặc DELETE (Bỏ _method: 'PUT' để Laravel không tự ép thành PUT)
      await apiFetch(`/recurring-rules/${tx.id}`, {
        method: 'POST',
        body: JSON.stringify({
          is_active: !tx.is_active
        })
      });
      setRecurringTransactions(prev => prev.map(item => item.id === tx.id ? { ...item, is_active: !tx.is_active } : item));
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      alert('Không thể thay đổi trạng thái lúc này. Vui lòng thử lại sau.');
    }
  };

  const submitAdd = async () => {
    if (!newTx.title || !newTx.amount || !newTx.wallet_id || !newTx.category_id) {
      alert(t('please_fill_all_required_fields') || 'Vui lòng điền các trường bắt buộc');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Luôn tạo giao dịch thực tế để hiển thị ngay lập tức
      const formData = new FormData();
      formData.append('title', newTx.title);
      formData.append('amount', newTx.amount);
      formData.append('type', newTx.type);
      formData.append('wallet_id', newTx.wallet_id);
      if (newTx.category_id) formData.append('category_id', newTx.category_id);
      if (newTx.payee_id) formData.append('payee_id', newTx.payee_id);
      formData.append('transaction_date', new Date(newTx.transaction_date).toISOString());
      if (newTx.notes) formData.append('notes', newTx.notes);
      if (newTx.attachment) formData.append('attachment', newTx.attachment);

      await createTransaction(formData);

      // --- Kiểm tra cảnh báo ngân sách (Frontend) ---
      if (newTx.type === 'expense') {
        try {
          const tDate = new Date(newTx.transaction_date);
          const tMonth = tDate.getMonth() + 1;
          const tYear = tDate.getFullYear();
          const budgetRes = await budgetApi.getAll(tMonth, tYear);
          const budgets = budgetRes.data || [];

          if (budgets.length > 0) {
            const pad = (n: number) => n.toString().padStart(2, '0');
            const totalDays = new Date(tYear, tMonth, 0).getDate();
            const start_date = `${tYear}-${pad(tMonth)}-01`;
            const end_date = `${tYear}-${pad(tMonth)}-${pad(totalDays)}`;
            const transRes = await transactionApi.getAll({ start_date, end_date, per_page: 1000 });
            const allTrans = transRes.data?.data || transRes.data || [];

            const targetBudgets = budgets.filter((b: any) =>
              b.category_id === null || b.category_id === newTx.category_id
            );

            for (const b of targetBudgets) {
              const limit = parseFloat(b.limit_amount);
              if (limit > 0) {
                let used = 0;
                if (b.category_id === null) {
                  used = allTrans.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount_in_user_currency || t.amount || 0)), 0);
                } else {
                  used = allTrans.filter((t: any) => t.type === 'expense' && t.category_id === b.category_id).reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount_in_user_currency || t.amount || 0)), 0);
                }

                const percent = (used / limit) * 100;
                if (percent >= 100) {
                  alert(`⚠️ CẢNH BÁO: Bạn đã vượt quá 100% hạn mức ngân sách ${b.category?.name ? 'cho danh mục ' + b.category.name : 'tổng'} tháng ${tMonth}/${tYear}!`);
                } else if (percent >= 80) {
                  alert(`⚡ LƯU Ý: Bạn đã dùng hết ${Math.round(percent)}% hạn mức ngân sách ${b.category?.name ? 'cho danh mục ' + b.category.name : 'tổng'} tháng ${tMonth}/${tYear}!`);
                }
              }
            }
          }
        } catch (e) {
          console.error("Lỗi khi tính toán cảnh báo ngân sách:", e);
        }
      }

      if (newTx.is_recurring) {
        // 2. Nếu có chọn định kỳ thì tạo THÊM rule để hệ thống tự động chạy cho các lần tiếp theo

        await apiFetch('/recurring-rules', {
          method: 'POST',
          body: JSON.stringify({
            title: newTx.title,
            name: newTx.title,
            description: newTx.title,
            amount: newTx.amount,
            type: newTx.type,
            wallet_id: newTx.wallet_id,
            category_id: newTx.category_id || null,
            payee_id: newTx.payee_id || null,
            frequency: newTx.frequency,
            next_run_at: new Date(newTx.transaction_date).toISOString(),
            end_at: newTx.end_date || null,
            notes: newTx.notes
          })
        });

        if (activeTab === 'recurring') {
          setIsLoadingRecurring(true);
          apiFetch('/recurring-rules')
            .then(res => setRecurringTransactions(res.data ? res.data : (Array.isArray(res) ? res : [])))
            .finally(() => setIsLoadingRecurring(false));
        }
      }

      setNewTx({
        title: '',
        amount: '',
        type: 'expense',
        wallet_id: wallets[0]?.id || '',
        category_id: '',
        payee_id: '',
        transaction_date: getLocalDateTime(),
        notes: '',
        attachment: null,
        is_recurring: false,
        frequency: 'monthly',
        end_date: ''
      });
      setIsModalOpen(false);
      setCurrentCursor(null);
      loadFilteredTransactions(null);
    } catch (error: any) {
      alert(error.message || 'Lỗi khi thêm giao dịch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirm_delete_tx') || 'Bạn có chắc chắn muốn xóa giao dịch này?')) {
      try {
        await deleteTransaction(id);
        loadFilteredTransactions(currentCursor);
      } catch (error: any) {
        alert(error.message || 'Lỗi khi xóa giao dịch');
      }
    }
  };

  const handleDeleteRecurringRule = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch định kỳ này?')) {
      try {
        await apiFetch(`/recurring-rules/${id}`, { method: 'DELETE' });
        setRecurringTransactions(prev => prev.filter(tx => tx.id !== id));
      } catch (error: any) {
        alert(error.message || 'Lỗi khi xóa giao dịch định kỳ');
      }
    }
  };

  const submitEditRecurringRule = async () => {
    if (!editingRecurringTx.title || !editingRecurringTx.amount || !editingRecurringTx.wallet_id || !editingRecurringTx.category_id) {
      alert('Vui lòng điền các trường bắt buộc');
      return;
    }
    setIsSubmittingEdit(true);
    try {
      await apiFetch(`/recurring-rules/${editingRecurringTx.id}`, {
        method: 'POST',
        body: JSON.stringify({
          title: editingRecurringTx.title,
          amount: editingRecurringTx.amount,
          type: editingRecurringTx.type,
          wallet_id: editingRecurringTx.wallet_id,
          category_id: editingRecurringTx.category_id || null,
          frequency: editingRecurringTx.frequency,
          next_run_at: new Date(editingRecurringTx.start_date).toISOString(),
          end_at: editingRecurringTx.end_date || null,
          notes: editingRecurringTx.notes
        })
      });
      setIsLoadingRecurring(true);
      const res = await apiFetch('/recurring-rules');
      setRecurringTransactions(res.data ? res.data : (Array.isArray(res) ? res : []));
      setIsEditRecurringModalOpen(false);
    } catch (error: any) {
      alert(error.message || 'Lỗi khi cập nhật giao dịch định kỳ');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  let filtered = transactions;
  if (activeTab === 'recurring_history') {
    filtered = filtered.filter((tx: any) => tx.source_type === 'recurring');
  }

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="transactions" />
      <main className="main-content" style={{ background: 'var(--bg-color)' }}>
        <nav className="navbar" style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
          <h1 className="page-title" style={{ color: 'var(--text-main)' }}>{t('transactions')}</h1>
          <div className="nav-actions">
            <div className="search-bar" style={{ background: 'var(--bg-color)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#718EBF"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
              <input
                type="text"
                placeholder={t('search_tx_placeholder')}
                value={searchTerm}
                onChange={e => handleFilterChange(() => setSearchTerm(e.target.value))}
              />
            </div>
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              style={{
                background: isFilterPanelOpen ? '#E7EDFF' : 'var(--bg-color)',
                color: isFilterPanelOpen ? '#1814F3' : '#718EBF',
                padding: '10px 18px',
                borderRadius: '24px',
                fontWeight: '600',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Bộ lọc
            </button>
            <button style={{ background: '#1814F3', color: '#fff', padding: '10px 20px', borderRadius: '24px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleAdd}>
              {t('add_transaction')}
            </button>
            <Link href="/notifications" style={{ background: '#F5F7FA', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb300', cursor: 'pointer', fontSize: '20px', textDecoration: 'none' }}>
              🔔
            </Link>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none', color: '#fff', background: '#343C6A', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>{t('login')}</Link>
            )}
          </div>
        </nav>

        <div className="content-area">
          {/* SMART SEARCH FEEDBACK */}
          {searchTerm && Object.keys(smartFilters).length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
              background: 'rgba(24, 20, 243, 0.05)',
              border: '1px dashed rgba(24, 20, 243, 0.2)',
              borderRadius: '12px',
              padding: '8px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--text-main)'
            }}>
              <span style={{ fontWeight: '600', color: '#1814F3' }}>✨ Bộ lọc thông minh:</span>
              {smartFilters.walletName && (
                <span style={{ background: '#E7EDFF', color: '#1814F3', padding: '2px 8px', borderRadius: '6px', fontWeight: '500' }}>
                  Ví: {smartFilters.walletName}
                </span>
              )}
              {smartFilters.categoryName && (
                <span style={{ background: '#E7EDFF', color: '#1814F3', padding: '2px 8px', borderRadius: '6px', fontWeight: '500' }}>
                  Danh mục: {smartFilters.categoryName}
                </span>
              )}
              {smartFilters.minAmount && (
                <span style={{ background: '#E7EDFF', color: '#1814F3', padding: '2px 8px', borderRadius: '6px', fontWeight: '500' }}>
                  Số tiền ≥ {formatCurrency(Number(smartFilters.minAmount))}
                </span>
              )}
              {smartFilters.maxAmount && (
                <span style={{ background: '#E7EDFF', color: '#1814F3', padding: '2px 8px', borderRadius: '6px', fontWeight: '500' }}>
                  Số tiền ≤ {formatCurrency(Number(smartFilters.maxAmount))}
                </span>
              )}
              {smartFilters.startDate && (
                <span style={{ background: '#E7EDFF', color: '#1814F3', padding: '2px 8px', borderRadius: '6px', fontWeight: '500' }}>
                  Thời gian: {smartFilters.startDate} {smartFilters.endDate ? `đến ${smartFilters.endDate}` : ''}
                </span>
              )}
              {smartFilters.typeName && (
                <span style={{ background: '#E7EDFF', color: '#1814F3', padding: '2px 8px', borderRadius: '6px', fontWeight: '500' }}>
                  Loại: {smartFilters.typeName}
                </span>
              )}
              {smartFilters.cleanSearch && (
                <span style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', padding: '2px 8px', borderRadius: '6px', fontStyle: 'italic' }}>
                  Từ khóa: "{smartFilters.cleanSearch}"
                </span>
              )}
            </div>
          )}
          {/* FILTER PANEL */}
          {isFilterPanelOpen && (
            <div style={{
              background: 'var(--card-bg)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid var(--border-color)',
              marginBottom: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                {/* Lọc theo Ví */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '13px', fontWeight: '500' }}>Ví tiền</label>
                  <select
                    value={selectedWallet}
                    onChange={e => handleFilterChange(() => setSelectedWallet(e.target.value))}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px' }}
                  >
                    <option value="">Tất cả ví</option>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.wallet_name || w.name}</option>)}
                  </select>
                </div>

                {/* Lọc theo Danh mục */}
                {activeTab !== 'transfer' && activeTab !== 'recurring' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '13px', fontWeight: '500' }}>Danh mục</label>
                    <select
                      value={selectedCategory}
                      onChange={e => handleFilterChange(() => setSelectedCategory(e.target.value))}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px' }}
                    >
                      <option value="">Tất cả danh mục</option>
                      {flatCategories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                    </select>
                  </div>
                )}

                {/* Lọc theo ngày bắt đầu */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '13px', fontWeight: '500' }}>Từ ngày</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => handleFilterChange(() => setStartDate(e.target.value))}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px' }}
                  />
                </div>

                {/* Lọc theo ngày kết thúc */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '13px', fontWeight: '500' }}>Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => handleFilterChange(() => setEndDate(e.target.value))}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px' }}
                  />
                </div>

                {/* Lọc số tiền tối thiểu */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '13px', fontWeight: '500' }}>Số tiền tối thiểu</label>
                  <input
                    type="number"
                    placeholder="Từ..."
                    value={minAmount}
                    onChange={e => handleFilterChange(() => setMinAmount(e.target.value))}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px' }}
                  />
                </div>

                {/* Lọc số tiền tối đa */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '13px', fontWeight: '500' }}>Số tiền tối đa</label>
                  <input
                    type="number"
                    placeholder="Đến..."
                    value={maxAmount}
                    onChange={e => handleFilterChange(() => setMaxAmount(e.target.value))}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px' }}
                  />
                </div>

                {/* Sắp xếp theo */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '13px', fontWeight: '500' }}>Sắp xếp theo</label>
                  <select
                    value={sortBy}
                    onChange={e => handleFilterChange(() => setSortBy(e.target.value))}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px' }}
                  >
                    <option value="date">Ngày giao dịch</option>
                    <option value="amount">Số tiền</option>
                    {activeTab !== 'transfer' && activeTab !== 'recurring' && <option value="category">Danh mục</option>}
                  </select>
                </div>

                {/* Thứ tự sắp xếp */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '13px', fontWeight: '500' }}>Thứ tự</label>
                  <select
                    value={sortOrder}
                    onChange={e => handleFilterChange(() => setSortOrder(e.target.value))}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '14px' }}
                  >
                    <option value="desc">Mới nhất / Lớn nhất</option>
                    <option value="asc">Cũ nhất / Nhỏ nhất</option>
                  </select>
                </div>

                {/* Fixed maximum 20 transactions per page */}
              </div>

              {/* Hủy bộ lọc */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: 'transparent',
                    color: '#FE5C73',
                    border: '1px solid #FE5C73',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            {[{ k: 'all', l: t('all') }, { k: 'income', l: t('income') }, { k: 'expense', l: t('spending') }, { k: 'transfer', l: 'Chuyển tiền nội bộ' }, { k: 'recurring', l: 'Quy tắc định kỳ' }, { k: 'recurring_history', l: 'Lịch sử định kỳ' }].map(tab => (
              <div key={tab.k} onClick={() => {
                setActiveTab(tab.k);
                setCurrentCursor(null);
                setRegularPage(1);
                setTransferPage(1);
                setRecurringPage(1);
              }} style={{ paddingBottom: '10px', color: activeTab === tab.k ? '#1814F3' : '#718EBF', borderBottom: activeTab === tab.k ? '3px solid #1814F3' : 'none', fontWeight: activeTab === tab.k ? '600' : '400', cursor: 'pointer' }}>{tab.l}</div>
            ))}
          </div>

          <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-color)', minHeight: '400px' }}>
            {(activeTab === 'transfer' && isLoadingTransfers) || (activeTab === 'recurring' && isLoadingRecurring) || (activeTab !== 'transfer' && activeTab !== 'recurring' && isLoadingTransactions) ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-main)' }}>{t('loading')}...</div>
            ) : activeTab === 'transfer' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-main)', fontSize: '15px' }}>
                <thead style={{ color: '#718EBF', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>{t('description')}</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>Từ ví</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>Đến ví</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>{t('date_label')}</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>{t('amount_label')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.length > 0 ? filteredTransfers.slice((transferPage - 1) * 10, transferPage * 10).map((tx: any) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 8px', fontWeight: 600 }}>Chuyển tiền nội bộ</td>
                      <td style={{ padding: '14px 8px', fontWeight: 500, color: '#1814F3' }}>{tx.from_wallet_name}</td>
                      <td style={{ padding: '14px 8px', fontWeight: 500, color: '#16DBCC' }}>{tx.to_wallet_name}</td>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: '500' }}>{new Date(tx.date).toLocaleDateString('vi-VN')}</div>
                        <div style={{ fontSize: '12px', color: '#718EBF' }}>{new Date(tx.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={{ padding: '14px 8px', color: '#8F9BB3', fontWeight: '600' }}>
                        {formatCurrency(tx.amount || 0)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#718EBF' }}>Chưa có chuyển tiền nội bộ nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeTab === 'recurring' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-main)', fontSize: '15px' }}>
                <thead style={{ color: '#718EBF', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>{t('description') || 'Mô tả'}</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>{t('amount_label') || 'Số tiền'}</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>Loại</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>Tần suất</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>Ngày tiếp theo</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>Trạng thái</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringTransactions.length > 0 ? recurringTransactions.slice((recurringPage - 1) * 10, recurringPage * 10).map((tx: any) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 8px', fontWeight: 600 }}>{tx.title || tx.description || tx.name}</td>
                      <td style={{ padding: '14px 8px', color: tx.type === 'income' ? '#16DBCC' : '#FE5C73', fontWeight: '600' }}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(tx.amount)))}
                      </td>
                      <td style={{ padding: '14px 8px' }}>{tx.type === 'income' ? (t('income') || 'Thu nhập') : (t('spending') || 'Chi tiêu')}</td>
                      <td style={{ padding: '14px 8px' }}>{tx.frequency === 'daily' ? 'Hàng ngày' : tx.frequency === 'weekly' ? 'Hàng tuần' : tx.frequency === 'yearly' ? 'Hàng năm' : 'Hàng tháng'}</td>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: '500' }}>{tx.next_run_at ? new Date(tx.next_run_at).toLocaleDateString('vi-VN') : '-'}</div>
                        {tx.next_run_at && <div style={{ fontSize: '12px', color: '#718EBF' }}>{new Date(tx.next_run_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>}
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <button
                          onClick={() => toggleRecurringRule(tx)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            background: tx.is_active ? '#E7EDFF' : '#FFE2E5',
                            color: tx.is_active ? '#1814F3' : '#FE5C73',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          {tx.is_active ? 'Hoạt động' : 'Đã tắt'}
                        </button>
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setViewingRuleTx(tx);
                              setIsRuleDetailModalOpen(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: '#F0F5FF',
                              color: '#1814F3',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={() => {
                              setEditingRecurringTx({
                                id: tx.id,
                                title: tx.title || tx.description || tx.name || '',
                                amount: tx.amount || '',
                                type: tx.type || 'expense',
                                wallet_id: tx.wallet_id || (wallets.length > 0 ? wallets[0].id : ''),
                                category_id: tx.category_id || '',
                                frequency: tx.frequency || 'monthly',
                                start_date: tx.start_date ? new Date(new Date(tx.start_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : (tx.next_run_at ? new Date(new Date(tx.next_run_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : getLocalDateTime()),
                                end_date: tx.end_at ? tx.end_at.split('T')[0] : '',
                                notes: tx.notes || ''
                              });
                              setIsEditRecurringModalOpen(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: '#E7EDFF',
                              color: '#1814F3',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteRecurringRule(tx.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'transparent',
                              color: '#FE5C73',
                              border: '1px solid #FFE2E5',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#FFE2E5'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#718EBF' }}>Chưa có giao dịch định kỳ nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-main)', fontSize: '15px' }}>
                <thead style={{ color: '#718EBF', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>{t('description')}</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>{t('categories')}</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>{t('date_label')}</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>{t('amount_label')}</th>
                    <th style={{ padding: '14px 8px', fontWeight: '500' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((tx: any) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 8px', fontWeight: 600 }}>
                        {tx.title}
                        {tx.source_type === 'recurring' && (
                          <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#E7EDFF', color: '#1814F3', fontSize: '11px', borderRadius: '12px', fontWeight: '500' }}>
                            Tự động
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 8px' }}>{tx.category?.name || '-'}</td>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: '500' }}>{new Date(tx.transaction_date).toLocaleDateString('vi-VN')}</div>
                        <div style={{ fontSize: '12px', color: '#718EBF' }}>{new Date(tx.transaction_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={{ padding: '14px 8px', color: tx.type === 'income' ? '#16DBCC' : '#FE5C73', fontWeight: '600' }}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0)))}
                      </td>
                      <td style={{ padding: '14px 8px', display: 'flex', gap: '8px' }}>
                        <button style={{ border: '1px solid #FE5C73', color: '#FE5C73', background: 'transparent', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleDelete(tx.id)}>{t('delete')}</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#718EBF' }}>{t('no_transactions_found') || 'Không tìm thấy giao dịch nào'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* PHÂN TRANG CHO GIAO DỊCH THƯỜNG */}
            {activeTab !== 'transfer' && activeTab !== 'recurring' && (nextCursor || prevCursor) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                <button
                  disabled={!prevCursor}
                  onClick={() => {
                    if (prevCursor) {
                      setCurrentCursor(prevCursor);
                      setRegularPage(p => Math.max(1, p - 1));
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: prevCursor ? '#1814F3' : 'var(--bg-color)',
                    color: prevCursor ? '#fff' : '#718EBF',
                    border: '1px solid var(--border-color)',
                    cursor: prevCursor ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {t('previous')}
                </button>
                <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                  Trang {regularPage}
                </span>
                <button
                  disabled={!nextCursor}
                  onClick={() => {
                    if (nextCursor) {
                      setCurrentCursor(nextCursor);
                      setRegularPage(p => p + 1);
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: nextCursor ? '#1814F3' : 'var(--bg-color)',
                    color: nextCursor ? '#fff' : '#718EBF',
                    border: '1px solid var(--border-color)',
                    cursor: nextCursor ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {t('next')}
                </button>
              </div>
            )}

            {/* PHÂN TRANG CHO CHUYỂN TIỀN NỘI BỘ */}
            {activeTab === 'transfer' && filteredTransfers.length > 10 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                <button
                  disabled={transferPage === 1}
                  onClick={() => setTransferPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: transferPage > 1 ? '#1814F3' : 'var(--bg-color)',
                    color: transferPage > 1 ? '#fff' : '#718EBF',
                    border: '1px solid var(--border-color)',
                    cursor: transferPage > 1 ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {t('previous')}
                </button>
                <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                  Trang {transferPage} / {Math.ceil(filteredTransfers.length / 10)}
                </span>
                <button
                  disabled={transferPage >= Math.ceil(filteredTransfers.length / 10)}
                  onClick={() => setTransferPage(p => p + 1)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: transferPage < Math.ceil(filteredTransfers.length / 10) ? '#1814F3' : 'var(--bg-color)',
                    color: transferPage < Math.ceil(filteredTransfers.length / 10) ? '#fff' : '#718EBF',
                    border: '1px solid var(--border-color)',
                    cursor: transferPage < Math.ceil(filteredTransfers.length / 10) ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {t('next')}
                </button>
              </div>
            )}

            {/* PHÂN TRANG CHO GIAO DỊCH ĐỊNH KỲ */}
            {activeTab === 'recurring' && recurringTransactions.length > 10 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                <button
                  disabled={recurringPage === 1}
                  onClick={() => setRecurringPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: recurringPage > 1 ? '#1814F3' : 'var(--bg-color)',
                    color: recurringPage > 1 ? '#fff' : '#718EBF',
                    border: '1px solid var(--border-color)',
                    cursor: recurringPage > 1 ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {t('previous')}
                </button>
                <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                  Trang {recurringPage} / {Math.ceil(recurringTransactions.length / 10)}
                </span>
                <button
                  disabled={recurringPage >= Math.ceil(recurringTransactions.length / 10)}
                  onClick={() => setRecurringPage(p => p + 1)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: recurringPage < Math.ceil(recurringTransactions.length / 10) ? '#1814F3' : 'var(--bg-color)',
                    color: recurringPage < Math.ceil(recurringTransactions.length / 10) ? '#fff' : '#718EBF',
                    border: '1px solid var(--border-color)',
                    cursor: recurringPage < Math.ceil(recurringTransactions.length / 10) ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {t('next')}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL THÊM GIAO DỊCH */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '30px', width: '550px', maxWidth: '95%', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '22px', fontWeight: '700' }}>{t('add_new_transaction')}</h2>

            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="is_recurring"
                checked={newTx.is_recurring}
                onChange={e => setNewTx({ ...newTx, is_recurring: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#1814F3' }}
              />
              <label htmlFor="is_recurring" style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}>
                Tạo giao dịch định kỳ (Tự động lặp lại)
              </label>
            </div>

            {newTx.is_recurring && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Tần suất lặp lại *</label>
                  <select
                    value={newTx.frequency}
                    onChange={e => setNewTx({ ...newTx, frequency: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}
                  >
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="monthly">Hàng tháng</option>
                    <option value="yearly">Hàng năm</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ngày kết thúc (Không bắt buộc)</label>
                  <input type="date" value={newTx.end_date} onChange={e => setNewTx({ ...newTx, end_date: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('transaction_name')} *</label>
                <input type="text" value={newTx.title} onChange={e => setNewTx({ ...newTx, title: e.target.value })} placeholder={t('tx_name_placeholder')} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('amount_label')} *</label>
                <input type="number" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} placeholder={t('tx_amount_placeholder')} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('type')} *</label>
                <select value={newTx.type} onChange={e => setNewTx({ ...newTx, type: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  <option value="expense">{t('spending')}</option>
                  <option value="income">{t('income')}</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('wallets')} *</label>
                <select value={newTx.wallet_id} onChange={e => setNewTx({ ...newTx, wallet_id: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('categories')} *</label>
                <select value={newTx.category_id} onChange={e => setNewTx({ ...newTx, category_id: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  <option value="">{t('select_category') || 'Chọn danh mục'}</option>
                  {flatCategories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('date_label')} *</label>
                <input type="datetime-local" value={newTx.transaction_date} onChange={e => setNewTx({ ...newTx, transaction_date: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Người hưởng thụ / Người trả</label>
              <div
                onClick={() => setIsPayeeModalOpen(true)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{newTx.payee_id ? payees.find(p => p.id === newTx.payee_id)?.payee_name || 'Đã chọn' : 'Chọn người thụ hưởng (Tùy chọn)'}</span>
                <span style={{ color: '#718EBF', fontSize: '12px' }}>▼</span>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('notes')}</label>
              <textarea value={newTx.notes} onChange={e => setNewTx({ ...newTx, notes: e.target.value })} placeholder={t('notes_placeholder') || 'Thêm ghi chú...'} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px', minHeight: '80px', resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('receipt_image') || 'Ảnh hóa đơn'}</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '20px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  background: 'var(--bg-color)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: '#718EBF'
                }}
              >
                {newTx.attachment ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{ color: '#16DBCC' }}>✓</span> {newTx.attachment.name}
                  </div>
                ) : (
                  <div>{t('click_to_upload') || 'Nhấn để tải lên ảnh hóa đơn'}</div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button style={{ padding: '12px 24px', background: 'var(--bg-color)', color: '#718EBF', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }} onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>{t('cancel')}</button>
              <button
                style={{ padding: '12px 24px', background: '#1814F3', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={submitAdd}
                disabled={isSubmitting}
              >
                {isSubmitting ? (t('saving') || 'Đang lưu...') : t('save_transaction')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RECURRING MODAL */}
      {isEditRecurringModalOpen && editingRecurringTx && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setIsEditRecurringModalOpen(false)}>
          <div className="modal-content" style={{ background: 'var(--card-bg)', width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--text-main)' }}>Sửa giao dịch định kỳ</h2>
              <button onClick={() => setIsEditRecurringModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}>&times;</button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Tần suất lặp lại *</label>
              <select value={editingRecurringTx.frequency} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, frequency: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
                <option value="yearly">Hàng năm</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Tên giao dịch *</label>
                <input type="text" value={editingRecurringTx.title} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, title: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Số tiền *</label>
                <input type="number" value={editingRecurringTx.amount} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, amount: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Loại *</label>
                <select value={editingRecurringTx.type} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, type: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  <option value="expense">Chi tiêu</option>
                  <option value="income">Thu nhập</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ví *</label>
                <select value={editingRecurringTx.wallet_id} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, wallet_id: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Danh mục *</label>
                <select value={editingRecurringTx.category_id} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, category_id: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  <option value="">Chọn danh mục</option>
                  {flatCategories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ngày bắt đầu *</label>
                <input type="datetime-local" value={editingRecurringTx.start_date} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, start_date: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ngày kết thúc (Không bắt buộc)</label>
              <input type="date" value={editingRecurringTx.end_date} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, end_date: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ghi chú</label>
              <textarea value={editingRecurringTx.notes} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, notes: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px', minHeight: '80px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button style={{ padding: '12px 24px', background: 'var(--bg-color)', color: '#718EBF', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }} onClick={() => setIsEditRecurringModalOpen(false)} disabled={isSubmittingEdit}>Hủy</button>
              <button
                style={{ padding: '12px 24px', background: '#1814F3', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                onClick={submitEditRecurringRule}
                disabled={isSubmittingEdit}
              >
                {isSubmittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* RULE DETAIL MODAL */}
      {isRuleDetailModalOpen && viewingRuleTx && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setIsRuleDetailModalOpen(false)}>
          <div style={{ background: 'var(--card-bg)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-main)', fontWeight: '700' }}>Chi tiết Quy tắc định kỳ</h2>
              <button onClick={() => setIsRuleDetailModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Tên giao dịch</span>
                <span style={{ fontWeight: '600' }}>{viewingRuleTx.title || viewingRuleTx.description || viewingRuleTx.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Số tiền</span>
                <span style={{ fontWeight: '600', color: viewingRuleTx.type === 'income' ? '#16DBCC' : '#FE5C73' }}>
                  {viewingRuleTx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(viewingRuleTx.amount)))}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Loại</span>
                <span style={{ fontWeight: '600' }}>{viewingRuleTx.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Ví</span>
                <span style={{ fontWeight: '600' }}>{viewingRuleTx.wallet?.name || viewingRuleTx.wallet?.wallet_name || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Danh mục</span>
                <span style={{ fontWeight: '600' }}>{viewingRuleTx.category?.name || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Tần suất lặp lại</span>
                <span style={{ fontWeight: '600' }}>
                  {viewingRuleTx.frequency === 'daily' ? 'Hàng ngày' : viewingRuleTx.frequency === 'weekly' ? 'Hàng tuần' : viewingRuleTx.frequency === 'yearly' ? 'Hàng năm' : 'Hàng tháng'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Trạng thái</span>
                <span style={{ fontWeight: '600', color: viewingRuleTx.is_active ? '#1814F3' : '#FE5C73' }}>
                  {viewingRuleTx.is_active ? 'Đang hoạt động' : 'Đã tạm dừng'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Ngày bắt đầu</span>
                <span style={{ fontWeight: '600' }}>{viewingRuleTx.start_date ? new Date(viewingRuleTx.start_date).toLocaleDateString('vi-VN') : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Lần chạy tiếp theo</span>
                <span style={{ fontWeight: '600', textAlign: 'right' }}>
                  <div>{viewingRuleTx.next_run_at ? new Date(viewingRuleTx.next_run_at).toLocaleDateString('vi-VN') : '-'}</div>
                  {viewingRuleTx.next_run_at && <div style={{ fontSize: '13px', color: '#718EBF', marginTop: '4px' }}>{new Date(viewingRuleTx.next_run_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Ngày kết thúc</span>
                <span style={{ fontWeight: '600' }}>{viewingRuleTx.end_at ? new Date(viewingRuleTx.end_at).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
              </div>
              {viewingRuleTx.notes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Ghi chú</span>
                  <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '12px', fontSize: '14px', fontStyle: 'italic' }}>
                    {viewingRuleTx.notes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '25px' }}>
              <button style={{ padding: '12px 30px', background: '#1814F3', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }} onClick={() => setIsRuleDetailModalOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Payee Selection Modal */}
      {isPayeeModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 10000
        }} onClick={() => setIsPayeeModalOpen(false)}>
          <div style={{
            background: 'var(--bg-color)', width: '100%', maxWidth: '500px', height: '80vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Chọn người thụ hưởng</h3>
              <button onClick={() => setIsPayeeModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}>&times;</button>
            </div>

            <div style={{ padding: '15px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#718EBF' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm người thụ hưởng..."
                  value={payeeSearchTerm}
                  onChange={e => setPayeeSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 15px 12px 42px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', fontSize: '15px', outline: 'none', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 15px 15px' }}>
              {payees.filter(p => p.payee_name?.toLowerCase().includes(payeeSearchTerm.toLowerCase()) || p.identifier?.toLowerCase().includes(payeeSearchTerm.toLowerCase())).map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setNewTx({ ...newTx, payee_id: p.id });
                    setIsPayeeModalOpen(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E8E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', color: '#4A46FF' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="20" width="20" height="2" />
                      <path d="M4 20V10" />
                      <path d="M20 20V10" />
                      <path d="M12 2L2 10h20L12 2z" />
                      <path d="M8 10v10" />
                      <path d="M12 10v10" />
                      <path d="M16 10v10" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px' }}>{p.payee_name || p.name}</div>
                    <div style={{ fontSize: '13px', color: '#718EBF', textTransform: 'uppercase' }}>{p.identifier || 'Người dùng'}</div>
                  </div>
                </div>
              ))}
              {payees.filter(p => p.payee_name?.toLowerCase().includes(payeeSearchTerm.toLowerCase()) || p.identifier?.toLowerCase().includes(payeeSearchTerm.toLowerCase())).length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF' }}>
                  Không tìm thấy người thụ hưởng phù hợp
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { apiFetch, budgetApi, transactionApi } from '../lib/api';
import CategoryPicker from '../components/CategoryPicker';

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
    userData,
    fetchWallets
  } = useAppContext();
  const { t, tCategory } = useLanguage();
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

  // States for CSV Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importErrorMsg, setImportErrorMsg] = useState('');

  const fetchImportHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await apiFetch('/transactions/imports');
      setImportHistory(res.data || []);
    } catch (e) {
      console.error('Lỗi khi tải lịch sử import', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isImportModalOpen) {
      fetchImportHistory();
    }
  }, [isImportModalOpen]);

  const handleImportSubmit = async () => {
    if (!importFile) {
      setImportErrorMsg('Vui lòng chọn file CSV để nhập');
      setTimeout(() => setImportErrorMsg(''), 5000);
      return;
    }
    setIsImporting(true);
    setImportSuccessMsg('');
    setImportErrorMsg('');
    try {
      const formData = new FormData();
      
      // Đọc file dạng buffer để xử lý lỗi font ANSI (Windows-1258) do Excel cũ gây ra
      const buffer = await importFile.arrayBuffer();
      let fileText = new TextDecoder('utf-8').decode(buffer);
      if (fileText.includes('\uFFFD')) {
        try {
          fileText = new TextDecoder('windows-1258').decode(buffer);
        } catch (e) {
          // Fallback if unsupported
        }
      }
      
      let lines = fileText.split(/\r?\n/);
      
      if (lines.length > 0 && lines[0].trim().toLowerCase() === 'sep=,') {
        lines.shift();
      }

      // Sửa lỗi Excel tự động đổi định dạng ngày thành DD/MM/YYYY hoặc DD-MM-YYYY
      lines = lines.map(line => {
        return line.replace(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, (match, d, m, y) => {
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        });
      });
      
      if (lines.length > 0 && lines[0].includes(';') && !lines[0].includes(',')) {
        lines = lines.map((line, rowIndex) => {
          return line.split(';').map((field, colIndex) => {
            if (rowIndex > 0 && colIndex === 2 && field) {
              field = field.replace(/[,.]/g, '');
            }
            if (field.includes(',')) return `"${field}"`;
            return field;
          }).join(',');
        });
      }
      
      const normalizedCsvText = lines.join('\n');
      const normalizedBlob = new Blob(['\uFEFF' + normalizedCsvText], { type: 'text/csv' });
      formData.append('file', normalizedBlob, importFile.name);
      const token = localStorage.getItem('access_token');
      // Using process.env to avoid importing API_BASE_URL which is not exported
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://exp-mgmt-dev.onrender.com/api';
      
      const res = await fetch(`${API_BASE_URL}/transactions/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi tải file lên');
      
      setImportSuccessMsg('File đã được tải lên thành công và đang xử lý. Bạn có thể theo dõi ở bảng bên dưới.');
      setTimeout(() => setImportSuccessMsg(''), 8000);
      setImportFile(null);
      if (importFileInputRef.current) importFileInputRef.current.value = '';
      fetchImportHistory();
    } catch (error: any) {
      setImportErrorMsg(error.message || 'Lỗi khi nhập file');
      setTimeout(() => setImportErrorMsg(''), 5000);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const sampleWallet = wallets && wallets.length > 0 ? wallets[0].name : "Tiền mặt";
    
    // Flatten categories quickly to find one expense and one income
    let expCat = "Ăn uống";
    let incCat = "Lương";
    
    if (categories && categories.length > 0) {
      const exp = categories.find((c: any) => c.type === 'expense');
      if (exp) expCat = exp.name;
      const inc = categories.find((c: any) => c.type === 'income');
      if (inc) incCat = inc.name;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const csvContent = `\uFEFFNgày;Loại;Số tiền;Ví;Danh mục;Tiêu đề;Ghi chú;Đơn vị\n${todayStr};Chi tiêu;50000;${sampleWallet};${expCat};Ăn sáng;Bún bò;VND\n${todayStr};Thu nhập;15000000;${sampleWallet};${incCat};Lương tháng này;;VND`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Mau_Nhap_Giao_Dich.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // States for viewing and editing standard transactions
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingTx, setViewingTx] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const getLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const toLocalDateTimeInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
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
  const [isSearchingSystem, setIsSearchingSystem] = useState(false);
  const [searchSystemError, setSearchSystemError] = useState('');
  const [targetModalForPayee, setTargetModalForPayee] = useState<'new' | 'edit'>('new');

  const handleSearchSystemPayee = async () => {
    let term = payeeSearchTerm.trim();
    if (!term) return;

    // Auto format 6-digit code to USRxxxxxx
    if (/^\d{6}$/.test(term)) {
      term = `USR${term}`;
    }

    setIsSearchingSystem(true);
    setSearchSystemError('');

    try {
      console.log(`Decoding recipient ${term} via API /qr/decode...`);
      const res = await apiFetch('/qr/decode', {
        method: 'POST',
        body: JSON.stringify({ qr_string: term })
      });

      console.log("Decode API response:", res);

      if (res?.status === 'success' && res.data) {
        const payeeData = res.data;
        const newPayee = {
          id: payeeData.payee_id,
          payee_name: payeeData.payee_name,
          identifier: payeeData.identifier,
          payee_type: payeeData.type || 'internal'
        };

        // Add to payees list if not already there
        setPayees(prev => {
          if (prev.some(p => p.id === newPayee.id)) return prev;
          // Filter out mock data if they exist to keep list clean
          const filteredPrev = prev.filter(p => !p.id.toString().startsWith('mock-uuid-'));
          return [newPayee, ...filteredPrev];
        });

        // Set the active payee
        if (targetModalForPayee === 'new') {
          setNewTx((prev: any) => ({ ...prev, payee_id: newPayee.id }));
        } else {
          setEditingTx((prev: any) => ({ ...prev, payee_id: newPayee.id }));
        }
        setIsPayeeModalOpen(false);
        setPayeeSearchTerm('');
        alert(`Đã tìm thấy và chọn người thụ hưởng: ${newPayee.payee_name}`);
      } else {
        setSearchSystemError('Không tìm thấy thông tin phù hợp hoặc phản hồi không đúng cấu trúc.');
      }
    } catch (e: any) {
      console.error("Lỗi khi tìm người thụ hưởng trên hệ thống:", e);
      setSearchSystemError(e.message || 'Không tìm thấy người thụ hưởng trên hệ thống.');
    } finally {
      setIsSearchingSystem(false);
    }
  };

  useEffect(() => {
    if (isPayeeModalOpen) {
      setSearchSystemError('');
      setIsSearchingSystem(false);
      const fetchPayees = async () => {
        try {
          console.log("Fetching payees from /payees API...");
          const res = await apiFetch('/payees');
          console.log("Payees API response:", res);

          // Handle different API response structures robustly
          let rawArray: any[] = [];
          if (Array.isArray(res)) {
            rawArray = res;
          } else if (res?.data && Array.isArray(res.data)) {
            rawArray = res.data;
          } else if (res?.data?.data && Array.isArray(res.data.data)) {
            rawArray = res.data.data;
          }

          let payeesArray = rawArray.map((item: any) => {
            if (typeof item === 'string' || typeof item === 'number') {
              return { id: String(item), payee_name: String(item), identifier: 'ID' };
            }
            return {
              ...item,
              id: String(item.id || item.user_id || Math.random()),
              payee_name: String(item.payee_name || item.name || item.full_name || item.id || item.user_id || 'Không xác định'),
              identifier: String(item.identifier || item.email || item.phone || '')
            };
          });

          // Do not use mock data, strictly read from API
          // if (payeesArray.length === 0) { ... }

          console.log("Parsed payees array:", payeesArray);
          setPayees(payeesArray);
          // Store raw res for debugging
          (window as any).debugApiRes = res;
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
    const selectedWallet = wallets.find(w => w.id === newTx.wallet_id);
    if (newTx.is_recurring && selectedWallet?.type === 'cash') {
      alert('Không được phép chọn ví Tiền mặt để thanh toán. Vui lòng chọn ví khác!');
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
      if (newTx.type === 'income') {
        formData.append('source_type', 'adjustment');
      }
      if (newTx.category_id) formData.append('category_id', newTx.category_id);
      if (newTx.payee_id) formData.append('payee_id', newTx.payee_id);
      formData.append('transaction_date', new Date(newTx.transaction_date).toISOString());
      if (newTx.notes) formData.append('notes', newTx.notes);
      if (newTx.attachment) formData.append('attachment', newTx.attachment);

      await transactionApi.create(formData);

      // Đóng modal và reset trạng thái ngay lập tức khi tạo thành công!
      setIsModalOpen(false);
      setActiveTab('all');
      setCurrentCursor(null);
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

      // Tải lại danh sách chạy ngầm
      Promise.all([
        fetchTransactions(),
        fetchWallets(),
        loadFilteredTransactions(null)
      ]).catch(e => console.error("Lỗi khi tải lại dữ liệu chạy ngầm:", e));

      // --- Kiểm tra cảnh báo ngân sách (Chạy ngầm) ---
      if (newTx.type === 'expense') {
        (async () => {
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
                    alert(`⚠️ ${t('budget_warning') || 'CẢNH BÁO'}: ${b.category?.name || t('total_budget') || 'Tổng'} - ${Math.round(percent)}%!`);
                  } else if (percent >= 80) {
                    alert(`⚡ ${t('budget_notice') || 'LƯU Ý'}: ${b.category?.name || t('total_budget') || 'Tổng'} - ${Math.round(percent)}%!`);
                  }
                }
              }
            }
          } catch (e) {
            console.error("Error checking budget alerts:", e);
          }
        })();
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

  const submitEdit = async () => {
    if (!editingTx.title || !editingTx.amount || !editingTx.wallet_id) {
      alert('Vui lòng điền các trường bắt buộc');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const formData = new FormData();
      formData.append('title', editingTx.title);
      formData.append('amount', editingTx.amount);
      formData.append('type', editingTx.type);
      formData.append('wallet_id', editingTx.wallet_id);
      if (editingTx.type === 'income') {
        formData.append('source_type', 'adjustment');
      }
      formData.append('category_id', editingTx.category_id || '');
      formData.append('transaction_date', new Date(editingTx.transaction_date).toISOString());
      formData.append('notes', editingTx.notes || '');
      if (editingTx.payee_id) {
        formData.append('payee_id', editingTx.payee_id);
      }

      if (editingTx.attachment) {
        formData.append('attachment', editingTx.attachment);
      } else if (!editingTx.existing_attachment_url) {
        formData.append('attachment_deleted', 'true');
      }

      await transactionApi.update(editingTx.id, formData);

      setIsEditModalOpen(false);
      setActiveTab('all');
      await Promise.all([
        loadFilteredTransactions(currentCursor),
        fetchWallets()
      ]);
      alert('Cập nhật giao dịch thành công!');
    } catch (error: any) {
      alert(error.message || 'Lỗi khi cập nhật giao dịch');
    } finally {
      setIsSubmittingEdit(false);
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

    const selectedEditWallet = wallets.find(w => w.id === editingRecurringTx.wallet_id);
    if (selectedEditWallet?.type === 'cash') {
      alert('Không được phép chọn ví Tiền mặt để thanh toán. Vui lòng chọn ví khác!');
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
      <style>{`
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeUpIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-slide-down {
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        /* Table enhancements */
        .modern-table th {
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
          padding: 16px 12px !important;
        }
        .modern-table td {
          padding: 16px 12px !important;
          vertical-align: middle;
        }
        
        /* Custom scrollbar for transaction list */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #718EBF;
        }
        
        /* Filter control enhancements */
        .filter-control {
          width: 100%;
          padding: 11px 16px;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          background: var(--bg-color);
          color: var(--text-main);
          font-size: 14px;
          font-family: inherit;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          box-sizing: border-box;
        }
        .filter-control:hover {
          border-color: rgba(24, 20, 243, 0.35);
        }
        .filter-control:focus {
          border-color: #1814F3;
          box-shadow: 0 0 0 3px rgba(24, 20, 243, 0.1);
          background: var(--card-bg);
        }
      `}</style>
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
            <button style={{ background: '#10B981', color: '#fff', padding: '10px 20px', borderRadius: '24px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsImportModalOpen(true)}>
              📥 Nhập CSV
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
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=EM&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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
                    className="filter-control"
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
                      className="filter-control"
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
                    className="filter-control"
                  />
                </div>

                {/* Lọc theo ngày kết thúc */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '13px', fontWeight: '500' }}>Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => handleFilterChange(() => setEndDate(e.target.value))}
                    className="filter-control"
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
                    className="filter-control"
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
                    className="filter-control"
                  />
                </div>

                {/* Sắp xếp theo */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#718EBF', fontSize: '13px', fontWeight: '500' }}>Sắp xếp theo</label>
                  <select
                    value={sortBy}
                    onChange={e => handleFilterChange(() => setSortBy(e.target.value))}
                    className="filter-control"
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
                    className="filter-control"
                  >
                    <option value="desc">Mới nhất / Lớn nhất</option>
                    <option value="asc">Cũ nhất / Nhỏ nhất</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="custom-scrollbar" style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            overflowX: 'auto',
            paddingBottom: '8px',
            paddingTop: '4px',
            whiteSpace: 'nowrap'
          }}>
            {[{ k: 'all', l: t('all') },
            { k: 'income', l: t('income') },
            { k: 'expense', l: t('spending') },
            { k: 'transfer', l: 'Chuyển tiền nội bộ' },
            { k: 'recurring', l: 'Quy tắc định kỳ' },
            { k: 'recurring_history', l: 'Lịch sử định kỳ' }
            ].map(tab => {
              const isActive = activeTab === tab.k;
              return (
                <button
                  key={tab.k}
                  onClick={() => {
                    setActiveTab(tab.k);
                    setCurrentCursor(null);
                    setRegularPage(1);
                    setTransferPage(1);
                    setRecurringPage(1);
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '600',
                    cursor: 'pointer',
                    outline: 'none',
                    background: isActive ? 'linear-gradient(135deg, #1814F3 0%, #396AFF 100%)' : 'var(--card-bg)',
                    color: isActive ? '#FFFFFF' : '#718EBF',
                    boxShadow: isActive ? '0 8px 16px rgba(24, 20, 243, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.02)',
                    border: isActive ? '1px solid transparent' : '1px solid var(--border-color)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(24, 20, 243, 0.05)';
                      e.currentTarget.style.color = '#1814F3';
                      e.currentTarget.style.borderColor = 'rgba(24, 20, 243, 0.2)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--card-bg)';
                      e.currentTarget.style.color = '#718EBF';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }
                  }}
                >
                  {tab.l}
                </button>
              );
            })}
          </div>

          <div key={activeTab} className="animate-fade-in" style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color)', minHeight: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            {(activeTab === 'transfer' && isLoadingTransfers) || (activeTab === 'recurring' && isLoadingRecurring) || (activeTab !== 'transfer' && activeTab !== 'recurring' && isLoadingTransactions) ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-main)', fontWeight: '600' }}>{t('loading')}...</div>
            ) : activeTab === 'transfer' ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-main)' }}>
                  <thead style={{ color: '#718EBF', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ fontWeight: '600' }}>{t('description')}</th>
                      <th style={{ fontWeight: '600' }}>Từ ví</th>
                      <th style={{ fontWeight: '600' }}>Đến ví</th>
                      <th style={{ fontWeight: '600' }}>{t('date_label')}</th>
                      <th style={{ fontWeight: '600' }}>{t('amount_label')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.length > 0 ? filteredTransfers.slice((transferPage - 1) * 10, transferPage * 10).map((tx: any) => {
                      const isHovered = hoveredRowId === tx.id;
                      return (
                        <tr
                          key={tx.id}
                          onMouseEnter={() => setHoveredRowId(tx.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: isHovered ? 'var(--bg-color)' : 'transparent',
                            transform: isHovered ? 'translateY(-2px)' : 'none',
                            boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          <td style={{ fontWeight: 700 }}>
                            <span style={{ marginRight: '8px' }}>🔄</span>
                            Chuyển tiền nội bộ
                          </td>
                          <td>
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '10px',
                              background: 'rgba(24, 20, 243, 0.08)',
                              color: '#1814F3',
                              fontWeight: '600',
                              fontSize: '13px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              🏦 {tx.from_wallet_name}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '10px',
                              background: 'rgba(22, 219, 204, 0.08)',
                              color: '#0BB5A7',
                              fontWeight: '600',
                              fontSize: '13px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              📱 {tx.to_wallet_name}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>
                              {new Date(tx.date).toLocaleDateString('vi-VN')}
                            </div>
                            <div style={{ fontSize: '11px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                              {new Date(tx.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '14px' }}>
                            {formatCurrency(tx.amount || 0)}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#718EBF' }}>Chưa có chuyển tiền nội bộ nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'recurring' ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-main)' }}>
                  <thead style={{ color: '#718EBF', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ fontWeight: '600' }}>{t('description') || 'Mô tả'}</th>
                      <th style={{ fontWeight: '600' }}>{t('amount_label') || 'Số tiền'}</th>
                      <th style={{ fontWeight: '600' }}>Loại</th>
                      <th style={{ fontWeight: '600' }}>Tần suất</th>
                      <th style={{ fontWeight: '600' }}>Ngày tiếp theo</th>
                      <th style={{ fontWeight: '600' }}>Trạng thái</th>
                      <th style={{ fontWeight: '600' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringTransactions.length > 0 ? recurringTransactions.slice((recurringPage - 1) * 10, recurringPage * 10).map((tx: any) => {
                      const isHovered = hoveredRowId === tx.id;
                      return (
                        <tr
                          key={tx.id}
                          onMouseEnter={() => setHoveredRowId(tx.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: isHovered ? 'var(--bg-color)' : 'transparent',
                            transform: isHovered ? 'translateY(-2px)' : 'none',
                            boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          <td style={{ fontWeight: 700 }}>
                            <span style={{ marginRight: '8px' }}>⏰</span>
                            {tx.title || tx.description || tx.name}
                          </td>
                          <td style={{ color: tx.type === 'income' ? '#16DBCC' : '#FE5C73', fontWeight: '700', fontSize: '15px' }}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(tx.amount)))}
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              background: tx.type === 'income' ? 'rgba(22, 219, 204, 0.08)' : 'rgba(254, 92, 115, 0.08)',
                              color: tx.type === 'income' ? '#16DBCC' : '#FE5C73',
                              fontWeight: '600',
                              fontSize: '12px'
                            }}>
                              {tx.type === 'income' ? (t('income') || 'Thu nhập') : (t('spending') || 'Chi tiêu')}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              background: '#F0F5FF',
                              color: '#1814F3',
                              fontWeight: '600',
                              fontSize: '12px'
                            }}>
                              {tx.frequency === 'daily' ? 'Hàng ngày' : tx.frequency === 'weekly' ? 'Hàng tuần' : tx.frequency === 'yearly' ? 'Hàng năm' : 'Hàng tháng'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>
                              {tx.next_run_at ? new Date(tx.next_run_at).toLocaleDateString('vi-VN') : '-'}
                            </div>
                            {tx.next_run_at && (
                              <div style={{ fontSize: '11px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                                {new Date(tx.next_run_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => toggleRecurringRule(tx)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                border: 'none',
                                cursor: 'pointer',
                                background: tx.is_active ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                                color: tx.is_active ? '#27AE60' : '#E74C3C',
                                fontWeight: '700',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                outline: 'none'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                            >
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: tx.is_active ? '#27AE60' : '#E74C3C',
                                display: 'inline-block'
                              }}></span>
                              {tx.is_active ? 'Hoạt động' : 'Đã tắt'}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setViewingRuleTx(tx);
                                  setIsRuleDetailModalOpen(true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '10px',
                                  background: '#F0F5FF',
                                  color: '#1814F3',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  transition: 'all 0.2s ease',
                                  outline: 'none'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 20, 243, 0.1)'}
                                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
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
                                  borderRadius: '10px',
                                  background: '#E7EDFF',
                                  color: '#1814F3',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  transition: 'all 0.2s ease',
                                  outline: 'none'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 20, 243, 0.1)'}
                                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteRecurringRule(tx.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '10px',
                                  background: 'transparent',
                                  color: '#FE5C73',
                                  border: '1px solid #FFE2E5',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  transition: 'all 0.2s ease',
                                  outline: 'none'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#FFE2E5';
                                  e.currentTarget.style.borderColor = '#FE5C73';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderColor = '#FFE2E5';
                                }}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#718EBF' }}>Chưa có giao dịch định kỳ nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-main)' }}>
                  <thead style={{ color: '#718EBF', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ fontWeight: '600' }}>{t('description')}</th>
                      <th style={{ fontWeight: '600' }}>{t('categories')}</th>
                      <th style={{ fontWeight: '600' }}>{t('date_label')}</th>
                      <th style={{ fontWeight: '600' }}>{t('amount_label')}</th>
                      <th style={{ fontWeight: '600' }}>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? filtered.map((tx: any) => {
                      const isHovered = hoveredRowId === tx.id;
                      const categoryColor = tx.category?.color || '#718EBF';
                      const categoryIcon = parseIcon(tx.category?.icon) || '📁';

                      return (
                        <tr
                          key={tx.id}
                          onMouseEnter={() => setHoveredRowId(tx.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: isHovered ? 'var(--bg-color)' : 'transparent',
                            transform: isHovered ? 'translateY(-2px)' : 'none',
                            boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          <td style={{ fontWeight: 700, minWidth: '160px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span>{tx.title}</span>
                              {tx.source_type === 'recurring' && (
                                <span style={{
                                  padding: '2px 8px',
                                  background: 'rgba(24, 20, 243, 0.08)',
                                  color: '#1814F3',
                                  fontSize: '10px',
                                  borderRadius: '12px',
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.3px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <span>🤖</span> Tự động
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {tx.category?.name ? (
                              <span style={{
                                padding: '6px 12px',
                                borderRadius: '12px',
                                background: `${categoryColor}15`,
                                color: categoryColor,
                                fontWeight: '700',
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span>{categoryIcon}</span>
                                {tx.category.name}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-light)', fontSize: '13px', fontWeight: '500' }}>-</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>
                              {new Date(tx.transaction_date).toLocaleDateString('vi-VN')}
                            </div>
                            <div style={{ fontSize: '11px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                              {new Date(tx.transaction_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td style={{ color: tx.type === 'income' ? '#16DBCC' : '#FE5C73', fontWeight: '800', fontSize: '15px' }}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0)))}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setViewingTx(tx);
                                  setIsDetailModalOpen(true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '10px',
                                  background: '#F0F5FF',
                                  color: '#1814F3',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  transition: 'all 0.2s ease',
                                  outline: 'none'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 20, 243, 0.1)'}
                                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                              >
                                Chi tiết
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTx({
                                    id: tx.id,
                                    title: tx.title || '',
                                    amount: tx.amount || '',
                                    type: tx.type || 'expense',
                                    wallet_id: tx.wallet_id || '',
                                    category_id: tx.category_id || '',
                                    payee_id: tx.payee_id || '',
                                    transaction_date: toLocalDateTimeInput(tx.transaction_date),
                                    notes: tx.notes || '',
                                    attachment: null,
                                    existing_attachment_url: tx.attachment_url || tx.attachments?.[0]?.file_url || ''
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '10px',
                                  background: '#E7EDFF',
                                  color: '#1814F3',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  transition: 'all 0.2s ease',
                                  outline: 'none'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 20, 243, 0.1)'}
                                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDelete(tx.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '10px',
                                  background: 'transparent',
                                  color: '#FE5C73',
                                  border: '1px solid #FFE2E5',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  transition: 'all 0.2s ease',
                                  outline: 'none'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#FFE2E5';
                                  e.currentTarget.style.borderColor = '#FE5C73';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderColor = '#FFE2E5';
                                }}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#718EBF' }}>{t('no_transactions_found') || 'Không tìm thấy giao dịch nào'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                    borderRadius: '14px',
                    background: prevCursor ? 'linear-gradient(135deg, #1814F3 0%, #396AFF 100%)' : 'var(--bg-color)',
                    color: prevCursor ? '#fff' : '#718EBF',
                    border: prevCursor ? '1px solid transparent' : '1px solid var(--border-color)',
                    cursor: prevCursor ? 'pointer' : 'not-allowed',
                    fontWeight: '700',
                    fontSize: '13px',
                    boxShadow: prevCursor ? '0 4px 10px rgba(24, 20, 243, 0.15)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {t('previous')}
                </button>
                <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '600' }}>
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
                    borderRadius: '14px',
                    background: nextCursor ? 'linear-gradient(135deg, #1814F3 0%, #396AFF 100%)' : 'var(--bg-color)',
                    color: nextCursor ? '#fff' : '#718EBF',
                    border: nextCursor ? '1px solid transparent' : '1px solid var(--border-color)',
                    cursor: nextCursor ? 'pointer' : 'not-allowed',
                    fontWeight: '700',
                    fontSize: '13px',
                    boxShadow: nextCursor ? '0 4px 10px rgba(24, 20, 243, 0.15)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
                    borderRadius: '14px',
                    background: transferPage > 1 ? 'linear-gradient(135deg, #1814F3 0%, #396AFF 100%)' : 'var(--bg-color)',
                    color: transferPage > 1 ? '#fff' : '#718EBF',
                    border: transferPage > 1 ? '1px solid transparent' : '1px solid var(--border-color)',
                    cursor: transferPage > 1 ? 'pointer' : 'not-allowed',
                    fontWeight: '700',
                    fontSize: '13px',
                    boxShadow: transferPage > 1 ? '0 4px 10px rgba(24, 20, 243, 0.15)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {t('previous')}
                </button>
                <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '600' }}>
                  Trang {transferPage} / {Math.ceil(filteredTransfers.length / 10)}
                </span>
                <button
                  disabled={transferPage >= Math.ceil(filteredTransfers.length / 10)}
                  onClick={() => setTransferPage(p => p + 1)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '14px',
                    background: transferPage < Math.ceil(filteredTransfers.length / 10) ? 'linear-gradient(135deg, #1814F3 0%, #396AFF 100%)' : 'var(--bg-color)',
                    color: transferPage < Math.ceil(filteredTransfers.length / 10) ? '#fff' : '#718EBF',
                    border: transferPage < Math.ceil(filteredTransfers.length / 10) ? '1px solid transparent' : '1px solid var(--border-color)',
                    cursor: transferPage < Math.ceil(filteredTransfers.length / 10) ? 'pointer' : 'not-allowed',
                    fontWeight: '700',
                    fontSize: '13px',
                    boxShadow: transferPage < Math.ceil(filteredTransfers.length / 10) ? '0 4px 10px rgba(24, 20, 243, 0.15)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
                    borderRadius: '14px',
                    background: recurringPage > 1 ? 'linear-gradient(135deg, #1814F3 0%, #396AFF 100%)' : 'var(--bg-color)',
                    color: recurringPage > 1 ? '#fff' : '#718EBF',
                    border: recurringPage > 1 ? '1px solid transparent' : '1px solid var(--border-color)',
                    cursor: recurringPage > 1 ? 'pointer' : 'not-allowed',
                    fontWeight: '700',
                    fontSize: '13px',
                    boxShadow: recurringPage > 1 ? '0 4px 10px rgba(24, 20, 243, 0.15)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {t('previous')}
                </button>
                <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '600' }}>
                  Trang {recurringPage} / {Math.ceil(recurringTransactions.length / 10)}
                </span>
                <button
                  disabled={recurringPage >= Math.ceil(recurringTransactions.length / 10)}
                  onClick={() => setRecurringPage(p => p + 1)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '14px',
                    background: recurringPage < Math.ceil(recurringTransactions.length / 10) ? 'linear-gradient(135deg, #1814F3 0%, #396AFF 100%)' : 'var(--bg-color)',
                    color: recurringPage < Math.ceil(recurringTransactions.length / 10) ? '#fff' : '#718EBF',
                    border: recurringPage < Math.ceil(recurringTransactions.length / 10) ? '1px solid transparent' : '1px solid var(--border-color)',
                    cursor: recurringPage < Math.ceil(recurringTransactions.length / 10) ? 'pointer' : 'not-allowed',
                    fontWeight: '700',
                    fontSize: '13px',
                    boxShadow: recurringPage < Math.ceil(recurringTransactions.length / 10) ? '0 4px 10px rgba(24, 20, 243, 0.15)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {t('next')}
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Modal Nhập CSV */}
        {isImportModalOpen && (
          <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
            <div className="modal-content animate-slide-up" style={{ background: 'var(--card-bg)', width: '600px', maxWidth: '95%', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-main)' }}>Nhập Dữ Liệu (Import CSV)</h2>
                <button onClick={() => setIsImportModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}>&times;</button>
              </div>

              <div style={{ background: 'rgba(24, 20, 243, 0.05)', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#1814F3' }}>💡 Hướng dẫn định dạng file</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.6' }}>
                  <li>Các cột <strong>bắt buộc</strong>: Ngày, Loại, Số tiền, Ví, Tiêu đề.</li>
                  <li>Loại phải là <strong>Chi tiêu</strong> hoặc <strong>Thu nhập</strong>.</li>
                  <li>Tên Ví và Danh mục phải khớp chính xác với dữ liệu đang có trên hệ thống của bạn.</li>
                  <li>File upload phải có định dạng <strong>.csv</strong> hoặc <strong>.txt</strong> và dung lượng tối đa 10MB.</li>
                </ul>
                <button onClick={downloadSampleCsv} style={{ marginTop: '12px', padding: '8px 16px', background: '#fff', border: '1px solid #1814F3', color: '#1814F3', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                  📥 Tải file mẫu (Template)
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)' }}>Chọn file CSV từ máy tính</label>
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: '16px', padding: '30px', textAlign: 'center', background: 'var(--bg-color)', cursor: 'pointer' }} onClick={() => importFileInputRef.current?.click()}>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    ref={importFileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImportFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
                  {importFile ? (
                    <div style={{ color: '#10B981', fontWeight: '600' }}>Đã chọn: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</div>
                  ) : (
                    <div style={{ color: '#718EBF' }}>Bấm vào đây để chọn file (.csv)</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginBottom: '32px', alignItems: 'center' }}>
                {importSuccessMsg && <div style={{ color: '#10B981', fontWeight: '600', fontSize: '14px', marginRight: 'auto', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>✅ {importSuccessMsg}</div>}
                {importErrorMsg && <div style={{ color: '#FE5C73', fontWeight: '600', fontSize: '14px', marginRight: 'auto', padding: '8px 16px', background: 'rgba(254, 92, 115, 0.1)', borderRadius: '12px' }}>❌ {importErrorMsg}</div>}
                <button style={{ padding: '12px 24px', background: 'var(--bg-color)', color: '#718EBF', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }} onClick={() => setIsImportModalOpen(false)}>Hủy</button>
                <button
                  style={{ padding: '12px 30px', background: importFile ? '#1814F3' : '#ccc', color: '#fff', borderRadius: '12px', border: 'none', cursor: importFile ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '15px' }}
                  onClick={handleImportSubmit}
                  disabled={!importFile || isImporting}
                >
                  {isImporting ? 'Đang gửi...' : 'Bắt đầu Nhập'}
                </button>
              </div>

              <h3 style={{ fontSize: '18px', color: 'var(--text-main)', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginBottom: '16px' }}>Lịch sử Nhập liệu</h3>
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', color: '#718EBF', padding: '20px' }}>Đang tải lịch sử...</div>
              ) : importHistory.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ color: '#718EBF', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 8px' }}>Thời gian</th>
                        <th style={{ padding: '10px 8px' }}>Trạng thái</th>
                        <th style={{ padding: '10px 8px' }}>Kết quả</th>
                        <th style={{ padding: '10px 8px' }}>Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importHistory.map(job => (
                        <tr key={job.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                          <td style={{ padding: '10px 8px' }}>{new Date(job.created_at).toLocaleString('vi-VN')}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: job.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : job.status === 'failed' ? 'rgba(254, 92, 115, 0.1)' : 'rgba(24, 20, 243, 0.1)',
                              color: job.status === 'completed' ? '#10B981' : job.status === 'failed' ? '#FE5C73' : '#1814F3'
                            }}>
                              {job.status === 'completed' ? 'Hoàn thành' : job.status === 'failed' ? 'Thất bại' : 'Đang xử lý'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px' }}>{job.success_rows} / {job.total_rows}</td>
                          <td style={{ padding: '10px 8px' }}>
                            {job.error_file_url ? (
                              <a href={job.error_file_url} target="_blank" rel="noreferrer" style={{ color: '#FE5C73', textDecoration: 'none', fontWeight: '600' }}>Tải file lỗi</a>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#718EBF', padding: '20px', background: 'var(--bg-color)', borderRadius: '12px' }}>Chưa có lịch sử nhập liệu nào.</div>
              )}
            </div>
          </div>
        )}

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
                <CategoryPicker
                  value={newTx.category_id}
                  onChange={(id) => setNewTx({ ...newTx, category_id: id })}
                  type={newTx.type}
                  categories={categories}
                  tCategory={tCategory}
                  placeholder={t('select_category') || 'Chọn danh mục'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('date_label')} *</label>
                <input type="datetime-local" value={newTx.transaction_date} onChange={e => setNewTx({ ...newTx, transaction_date: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Người hưởng thụ / Người trả</label>
              <div
                onClick={() => {
                  if (newTx.is_recurring || newTx.type === 'income') return;
                  setTargetModalForPayee('new');
                  setIsPayeeModalOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  background: (newTx.is_recurring || newTx.type === 'income') ? 'rgba(0, 0, 0, 0.05)' : 'var(--bg-color)',
                  color: (newTx.is_recurring || newTx.type === 'income') ? '#9ca3af' : 'var(--text-main)',
                  fontSize: '15px',
                  cursor: (newTx.is_recurring || newTx.type === 'income') ? 'not-allowed' : 'pointer',
                  opacity: (newTx.is_recurring || newTx.type === 'income') ? 0.5 : 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
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
                <CategoryPicker
                  value={editingRecurringTx.category_id}
                  onChange={(id) => setEditingRecurringTx({ ...editingRecurringTx, category_id: id })}
                  type={editingRecurringTx.type}
                  categories={categories}
                  tCategory={tCategory}
                  placeholder="Chọn danh mục"
                />
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
      {/* TRANSACTION DETAIL MODAL */}
      {isDetailModalOpen && viewingTx && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setIsDetailModalOpen(false)}>
          <div style={{ background: 'var(--card-bg)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-main)', fontWeight: '700' }}>Chi tiết giao dịch</h2>
              <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Tên giao dịch</span>
                <span style={{ fontWeight: '600' }}>{viewingTx.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Số tiền</span>
                <span style={{ fontWeight: '600', color: viewingTx.type === 'income' ? '#16DBCC' : '#FE5C73' }}>
                  {viewingTx.type === 'income' ? '+' : '-'}{Math.round(Number(viewingTx.amount)).toLocaleString('vi-VN')}₫
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Loại</span>
                <span style={{ fontWeight: '600' }}>{viewingTx.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Ví</span>
                <span style={{ fontWeight: '600' }}>{viewingTx.wallet?.name || viewingTx.wallet?.wallet_name || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Danh mục</span>
                <span style={{ fontWeight: '600' }}>{viewingTx.category?.name || '-'}</span>
              </div>
              {viewingTx.payee && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Người hưởng thụ</span>
                  <span style={{ fontWeight: '600' }}>{viewingTx.payee.payee_name || viewingTx.payee.name} ({viewingTx.payee.identifier})</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Ngày giao dịch</span>
                <span style={{ fontWeight: '600' }}>{new Date(viewingTx.transaction_date).toLocaleString('vi-VN')}</span>
              </div>
              {viewingTx.notes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Ghi chú</span>
                  <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '12px', fontSize: '14px', fontStyle: 'italic' }}>
                    {viewingTx.notes}
                  </div>
                </div>
              )}
              {(viewingTx.attachment_url || (viewingTx.attachments && viewingTx.attachments[0]?.file_url)) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Ảnh hóa đơn</span>
                  <div style={{ textAlign: 'center', background: 'var(--bg-color)', borderRadius: '12px', padding: '10px' }}>
                    <img
                      src={viewingTx.attachment_url || viewingTx.attachments[0]?.file_url}
                      alt="Receipt"
                      style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <div style={{ marginTop: '10px' }}>
                      <a
                        href={viewingTx.attachment_url || viewingTx.attachments[0]?.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#1814F3', textDecoration: 'underline', fontSize: '13px', fontWeight: '600' }}
                      >
                        Mở ảnh kích thước đầy đủ ↗
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '25px' }}>
              <button style={{ padding: '12px 30px', background: '#1814F3', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }} onClick={() => setIsDetailModalOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TRANSACTION MODAL */}
      {isEditModalOpen && editingTx && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '30px', width: '550px', maxWidth: '95%', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-main)', fontWeight: '700' }}>Chỉnh sửa giao dịch</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Tên giao dịch *</label>
                <input type="text" value={editingTx.title} onChange={e => setEditingTx({ ...editingTx, title: e.target.value })} placeholder={t('tx_name_placeholder')} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Số tiền *</label>
                <input type="number" value={editingTx.amount} onChange={e => setEditingTx({ ...editingTx, amount: e.target.value })} placeholder={t('tx_amount_placeholder')} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Loại *</label>
                <select value={editingTx.type} onChange={e => setEditingTx({ ...editingTx, type: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  <option value="expense">{t('spending')}</option>
                  <option value="income">{t('income')}</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ví *</label>
                <select value={editingTx.wallet_id} onChange={e => setEditingTx({ ...editingTx, wallet_id: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Danh mục *</label>
                <CategoryPicker
                  value={editingTx.category_id}
                  onChange={(id) => setEditingTx({ ...editingTx, category_id: id })}
                  type={editingTx.type}
                  categories={categories}
                  tCategory={tCategory}
                  placeholder={t('select_category') || 'Chọn danh mục'}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ngày giao dịch *</label>
                <input type="datetime-local" value={editingTx.transaction_date} onChange={e => setEditingTx({ ...editingTx, transaction_date: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Người hưởng thụ / Người trả</label>
              <div
                onClick={() => {
                  setTargetModalForPayee('edit');
                  setIsPayeeModalOpen(true);
                }}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{editingTx.payee_id ? payees.find(p => p.id === editingTx.payee_id)?.payee_name || 'Đã chọn' : 'Chọn người thụ hưởng (Tùy chọn)'}</span>
                <span style={{ color: '#718EBF', fontSize: '12px' }}>▼</span>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('notes')}</label>
              <textarea value={editingTx.notes} onChange={e => setEditingTx({ ...editingTx, notes: e.target.value })} placeholder={t('notes_placeholder') || 'Thêm ghi chú...'} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px', minHeight: '80px', resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ảnh hóa đơn</label>
              {editingTx.existing_attachment_url && !editingTx.attachment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', background: 'var(--bg-color)', padding: '10px', borderRadius: '12px' }}>
                  <img src={editingTx.existing_attachment_url} alt="Current" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                  <span style={{ fontSize: '13px', color: '#718EBF', flex: 1 }}>Sử dụng ảnh hóa đơn hiện tại</span>
                  <button
                    type="button"
                    onClick={() => setEditingTx({ ...editingTx, existing_attachment_url: '' })}
                    style={{ background: 'none', border: 'none', color: '#FE5C73', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    Xóa ảnh
                  </button>
                </div>
              )}
              <div
                onClick={() => {
                  const input = document.getElementById('edit-file-input') as HTMLInputElement;
                  input?.click();
                }}
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
                {editingTx.attachment ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{ color: '#16DBCC' }}>✓</span> {editingTx.attachment.name}
                  </div>
                ) : (
                  <div>{t('click_to_upload') || 'Nhấn để tải lên ảnh hóa đơn mới'}</div>
                )}
              </div>
              <input
                id="edit-file-input"
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setEditingTx({ ...editingTx, attachment: e.target.files[0] });
                  }
                }}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button style={{ padding: '12px 24px', background: 'var(--bg-color)', color: '#718EBF', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }} onClick={() => setIsEditModalOpen(false)} disabled={isSubmittingEdit}>{t('cancel')}</button>
              <button
                style={{ padding: '12px 24px', background: '#1814F3', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={submitEdit}
                disabled={isSubmittingEdit}
              >
                {isSubmittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
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
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Chọn người thụ hưởng</h3>
              <button onClick={() => setIsPayeeModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}>&times;</button>
            </div>

            <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#718EBF' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm người thụ hưởng..."
                  value={payeeSearchTerm}
                  onChange={e => {
                    setPayeeSearchTerm(e.target.value);
                    setSearchSystemError('');
                  }}
                  style={{ width: '100%', padding: '12px 15px 12px 42px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', fontSize: '15px', outline: 'none', color: 'var(--text-main)' }}
                />
              </div>

              {payeeSearchTerm.trim() && (
                <button
                  type="button"
                  onClick={handleSearchSystemPayee}
                  disabled={isSearchingSystem}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#1814F3',
                    color: '#fff',
                    border: 'none',
                    cursor: isSearchingSystem ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: isSearchingSystem ? 0.7 : 1
                  }}
                >
                  {isSearchingSystem ? (
                    <>
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Đang tìm kiếm người nhận trên hệ thống...
                    </>
                  ) : (
                    <>
                      🔍 Tìm và thêm người nhận "{/^\d{6}$/.test(payeeSearchTerm.trim()) ? `USR${payeeSearchTerm.trim()}` : payeeSearchTerm.trim()}" từ hệ thống
                    </>
                  )}
                </button>
              )}

              {searchSystemError && (
                <div style={{ color: '#FE5C73', fontSize: '13px', marginTop: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>⚠️</span> {searchSystemError}
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 15px 15px' }}>
              {payees.filter(p => p.payee_name?.toLowerCase().includes(payeeSearchTerm.toLowerCase()) || p.identifier?.toLowerCase().includes(payeeSearchTerm.toLowerCase())).map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    if (targetModalForPayee === 'new') {
                      setNewTx({ ...newTx, payee_id: p.id });
                    } else {
                      setEditingTx({ ...editingTx, payee_id: p.id });
                    }
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

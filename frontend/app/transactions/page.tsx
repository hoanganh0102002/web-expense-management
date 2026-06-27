"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { apiFetch, budgetApi, transactionApi } from '../lib/api';
import CategoryPicker from '../components/CategoryPicker';
import Script from 'next/script';

const urlToFile = async (url: string, filename: string): Promise<File | null> => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const mimeType = blob.type || 'image/jpeg';
    return new File([blob], filename, { type: mimeType });
  } catch (e) {
    console.error("Lỗi khi chuyển đổi URL thành File:", e);
    return null;
  }
};

const parseSafeDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

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

const cleanTransactionTitle = (title: string, payee: any): string => {
  if (!title) return '';
  if (!payee) return title;

  const payeeName = payee.payee_name || payee.name;
  if (!payeeName) return title;

  let cleaned = title;

  // Try to remove "đến [PayeeName]"
  const target1 = `đến ${payeeName}`;
  const target2 = `den ${payeeName}`;

  // Try to remove "cho [PayeeName]"
  const target3 = `cho ${payeeName}`;

  // Try to remove "từ [PayeeName]" or "tu [PayeeName]"
  const target4 = `từ ${payeeName}`;
  const target5 = `tu ${payeeName}`;

  if (cleaned.includes(target1)) {
    cleaned = cleaned.replace(target1, '');
  } else if (cleaned.includes(target2)) {
    cleaned = cleaned.replace(target2, '');
  } else if (cleaned.includes(target3)) {
    cleaned = cleaned.replace(target3, '');
  } else if (cleaned.includes(target4)) {
    cleaned = cleaned.replace(target4, '');
  } else if (cleaned.includes(target5)) {
    cleaned = cleaned.replace(target5, '');
  } else {
    cleaned = cleaned.replace(payeeName, '');
  }

  cleaned = cleaned.trim();

  if (cleaned.endsWith('qua mã QR') || cleaned.endsWith('qua ma QR')) {
    return 'Chuyển tiền qua mã QR';
  }
  if (cleaned === 'Chuyển tiền' || cleaned === 'Chuyen tien') {
    return 'Chuyển tiền';
  }
  if (cleaned.endsWith('đến') || cleaned.endsWith('den') || cleaned.endsWith('cho') || cleaned.endsWith('từ') || cleaned.endsWith('tu')) {
    cleaned = cleaned.replace(/(?:đến|den|cho|từ|tu)$/i, '').trim();
  }

  return cleaned || 'Chuyển tiền';
};

const formatNotesWithTitle = (title: string, notes: string): string => {
  const cleanTitle = title.trim();
  const cleanNotes = notes.trim();
  return cleanNotes ? `[${cleanTitle}] ${cleanNotes}` : `[${cleanTitle}]`;
};

const parseNotesAndTitle = (title: string, notes: string | null, payee: any): { displayTitle: string; displayNotes: string } => {
  const cleanedFallbackTitle = cleanTransactionTitle(title, payee);
  if (!notes) {
    return {
      displayTitle: cleanedFallbackTitle,
      displayNotes: ''
    };
  }

  // Match bracket format: starts with [something] optionally followed by notes
  const match = notes.match(/^\[(.*?)\]\s*([\s\S]*)$/);
  if (match) {
    const extractedTitle = match[1].trim();
    const remainingNotes = match[2].trim();
    return {
      displayTitle: extractedTitle || cleanedFallbackTitle,
      displayNotes: remainingNotes
    };
  }

  return {
    displayTitle: cleanedFallbackTitle,
    displayNotes: notes.trim()
  };
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

interface FlatCategoryItem {
  id: string | number;
  name?: string;
  parent_id?: string | number | null;
  displayName?: string;
}

interface TransactionItem {
  id?: string | number;
  amount_in_user_currency?: string | number;
  amount?: string | number;
  type?: string;
  category?: {
    name?: string;
    parent_id?: string | number;
  } | null;
  category_name?: string;
  category_id?: string | number;
  wallet?: {
    name?: string;
  } | null;
  wallet_name?: string;
  title?: string;
  description?: string;
  note?: string;
  transaction_date?: string;
  date?: string;
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
    const num = parseFloat(cleanVal.replace(',', '.'));
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
  const router = useRouter();
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
    fetchWallets,
    hasUnreadNotifications,
    unreadNotificationsCount,
    fetchUnreadNotificationsCount,
    createSystemNotification
  } = useAppContext();
  const { t, tCategory } = useLanguage();
  const formatCurrency = (amount: number | string, currencyCode: string = 'VND') => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return '0';
    return new Intl.NumberFormat(currencyCode === 'VND' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'VND' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'VND' ? 0 : 2
    }).format(currencyCode === 'VND' ? Math.round(numericAmount) : numericAmount);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);





  // States for viewing and editing standard transactions
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeDropdownTxId, setActiveDropdownTxId] = useState<string | number | null>(null);

  useEffect(() => {
    const handleWindowClick = () => {
      setActiveDropdownTxId(null);
    };
    if (activeDropdownTxId !== null) {
      window.addEventListener('click', handleWindowClick);
    }
    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, [activeDropdownTxId]);

  const [viewingTx, setViewingTx] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editingRecurringTx, setEditingRecurringTx] = useState<any>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // States for internal transfer detail
  const [isTransferDetailModalOpen, setIsTransferDetailModalOpen] = useState(false);
  const [viewingTransferTx, setViewingTransferTx] = useState<any>(null);

  // Deep link resolution state to prevent background fetches from blocking PHP single-threaded server
  const [isDeepLinkResolved, setIsDeepLinkResolved] = useState(false);

  // Check if there is a deep link on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (!searchParams.get('txId') && !searchParams.get('autoOpenTitle') && !searchParams.get('autoOpenAmount') && !searchParams.get('autoOpenDate')) {
        setIsDeepLinkResolved(true);
      }
    }
  }, []);

  const getLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const toLocalDateTimeInput = (isoString: string) => {
    if (!isoString) return '';
    const date = parseSafeDate(isoString);
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
    attachments: [] as File[],
    is_recurring: false,
    frequency: 'monthly',
    end_date: ''
  });

  const [payees, setPayees] = useState<any[]>([]);

  const [isClassifyingNew, setIsClassifyingNew] = useState(false);
  const [isClassifyingEdit, setIsClassifyingEdit] = useState(false);
  const [isClassifyingRecurring, setIsClassifyingRecurring] = useState(false);
  const hasAttemptedOpen = useRef(false);



  // Auto-classify category for newTx
  useEffect(() => {
    const title = newTx.title?.trim();
    const notes = newTx.notes?.trim();
    if (!title && !notes) return;

    const timer = setTimeout(async () => {
      setIsClassifyingNew(true);
      try {
        const res = await apiFetch('/ai/classify-category', {
          method: 'POST',
          body: JSON.stringify({
            title,
            notes,
            type: newTx.type
          })
        });
        if (res.status === 'success' && res.data?.category_id) {
          setNewTx(prev => ({ ...prev, category_id: res.data.category_id }));
        }
      } catch (e) {
        console.log("Lỗi tự động phân loại danh mục:", e);
      } finally {
        setIsClassifyingNew(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [newTx.title, newTx.notes, newTx.type]);

  // Auto-classify category for editingTx
  useEffect(() => {
    if (!editingTx) return;
    const title = editingTx.title?.trim();
    const notes = editingTx.notes?.trim();
    if (!title && !notes) return;

    const timer = setTimeout(async () => {
      setIsClassifyingEdit(true);
      try {
        const res = await apiFetch('/ai/classify-category', {
          method: 'POST',
          body: JSON.stringify({
            title,
            notes,
            type: editingTx.type
          })
        });
        if (res.status === 'success' && res.data?.category_id) {
          setEditingTx((prev: any) => {
            if (!prev) return null;
            return { ...prev, category_id: res.data.category_id };
          });
        }
      } catch (e) {
        console.log("Lỗi tự động phân loại danh mục chỉnh sửa:", e);
      } finally {
        setIsClassifyingEdit(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [editingTx?.title, editingTx?.notes, editingTx?.type]);

  // Auto-classify category for editingRecurringTx
  useEffect(() => {
    if (!editingRecurringTx) return;
    const title = editingRecurringTx.title?.trim();
    const notes = editingRecurringTx.notes?.trim();
    if (!title && !notes) return;

    const timer = setTimeout(async () => {
      setIsClassifyingRecurring(true);
      try {
        const res = await apiFetch('/ai/classify-category', {
          method: 'POST',
          body: JSON.stringify({
            title,
            notes,
            type: editingRecurringTx.type
          })
        });
        if (res.status === 'success' && res.data?.category_id) {
          setEditingRecurringTx((prev: any) => {
            if (!prev) return null;
            return { ...prev, category_id: res.data.category_id };
          });
        }
      } catch (e) {
        console.log("Lỗi tự động phân loại danh mục định kỳ:", e);
      } finally {
        setIsClassifyingRecurring(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [editingRecurringTx?.title, editingRecurringTx?.notes, editingRecurringTx?.type]);

  const runManualClassification = async (formType: 'new' | 'edit' | 'recurring') => {
    let title = '';
    let notes = '';
    let type = 'expense';

    if (formType === 'new') {
      title = newTx.title;
      notes = newTx.notes;
      type = newTx.type;
      setIsClassifyingNew(true);
    } else if (formType === 'edit') {
      title = editingTx.title;
      notes = editingTx.notes;
      type = editingTx.type;
      setIsClassifyingEdit(true);
    } else if (formType === 'recurring') {
      title = editingRecurringTx.title;
      notes = editingRecurringTx.notes;
      type = editingRecurringTx.type;
      setIsClassifyingRecurring(true);
    }

    try {
      const res = await apiFetch('/ai/classify-category', {
        method: 'POST',
        body: JSON.stringify({ title, notes, type })
      });
      if (res.status === 'success' && res.data?.category_id) {
        if (formType === 'new') {
          setNewTx(prev => ({ ...prev, category_id: res.data.category_id }));
        } else if (formType === 'edit') {
          setEditingTx((prev: any) => ({ ...prev, category_id: res.data.category_id }));
        } else if (formType === 'recurring') {
          setEditingRecurringTx((prev: any) => ({ ...prev, category_id: res.data.category_id }));
        }
      } else {
        console.log('AI không tìm thấy danh mục nào phù hợp hơn.');
      }
    } catch (e) {
      console.log(e);
      console.log('Có lỗi xảy ra khi gọi AI phân loại.');
    } finally {
      if (formType === 'new') setIsClassifyingNew(false);
      else if (formType === 'edit') setIsClassifyingEdit(false);
      else if (formType === 'recurring') setIsClassifyingRecurring(false);
    }
  };

  const isCashWallet = useMemo(() => {
    const w = wallets.find(x => x.id === newTx.wallet_id);
    return w?.type === 'cash';
  }, [newTx.wallet_id, wallets]);

  const isEditCashWallet = useMemo(() => {
    if (!editingTx) return false;
    const w = wallets.find(x => x.id === editingTx.wallet_id);
    return w?.type === 'cash';
  }, [editingTx?.wallet_id, wallets]);

  useEffect(() => {
    if (isCashWallet) {
      setNewTx((prev: any) => {
        if (prev.is_recurring || prev.payee_id) {
          return { ...prev, is_recurring: false, payee_id: '' };
        }
        return prev;
      });
    }
  }, [isCashWallet]);

  useEffect(() => {
    if (isEditCashWallet && editingTx) {
      setEditingTx((prev: any) => {
        if (prev && prev.payee_id) {
          return { ...prev, payee_id: '' };
        }
        return prev;
      });
    }
  }, [isEditCashWallet]);


  const [activeTab, setActiveTab] = useState('all');

  const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
  const [payeeSearchTerm, setPayeeSearchTerm] = useState('');
  const [isSearchingSystem, setIsSearchingSystem] = useState(false);
  const [searchSystemError, setSearchSystemError] = useState('');
  const [targetModalForPayee, setTargetModalForPayee] = useState<'new' | 'edit' | 'edit_recurring'>('new');

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
        } else if (targetModalForPayee === 'edit') {
          setEditingTx((prev: any) => ({ ...prev, payee_id: newPayee.id }));
        } else {
          setEditingRecurringTx((prev: any) => ({ ...prev, payee_id: newPayee.id }));
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
    if (isPayeeModalOpen || activeTab === 'recurring_history' || activeTab === 'recurring') {
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
          console.log("Lỗi khi lấy danh sách người hưởng thụ:", e);
          console.log("Lỗi khi tải danh sách người thụ hưởng: " + (e.message || e));
        }
      };

      const token = localStorage.getItem('access_token');
      if (typeof window !== 'undefined' && token && payees.length === 0) {
        fetchPayees();
      }
    }
  }, [isPayeeModalOpen, activeTab]);


  const [internalTransfers, setInternalTransfers] = useState<any[]>([]);
  const [hasLoadedTransfers, setHasLoadedTransfers] = useState(false);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [hasLoadedRecurring, setHasLoadedRecurring] = useState(false);
  const [recurringHistoryList, setRecurringHistoryList] = useState<any[]>([]);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [tabCaches, setTabCaches] = useState<Record<string, any[]>>({});
  const [isLoadingRecurring, setIsLoadingRecurring] = useState(false);
  const [isEditRecurringModalOpen, setIsEditRecurringModalOpen] = useState(false);
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

  // Handle URL parameters for auto-opening transaction details (Optimized)
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoggedIn) {
      const urlParams = new URLSearchParams(window.location.search);
      const txId = urlParams.get('txId');
      const autoOpenTitle = urlParams.get('autoOpenTitle');
      const autoOpenAmount = urlParams.get('autoOpenAmount');
      const autoOpenDate = urlParams.get('autoOpenDate');

      if (!txId && !autoOpenTitle && !autoOpenAmount && !autoOpenDate) return;

      // Create and show a "stub" transaction instantly while waiting for data (only if we have title/amount)
      if (!hasAttemptedOpen.current) {
        if (autoOpenTitle || autoOpenAmount || autoOpenDate) {
          const originalTitle = autoOpenTitle ? decodeURIComponent(autoOpenTitle) : '';
          const amountStr = autoOpenAmount ? autoOpenAmount : '';
          const stubDate = autoOpenDate ? decodeURIComponent(autoOpenDate) : new Date().toISOString();
          const type = originalTitle.toLowerCase().includes('nhận') ? 'income' : 'expense';
          setViewingTx({ id: 'stub', title: originalTitle, amount: amountStr, transaction_date: stubDate, type: type, notes: '', category: null, wallet: null, isStub: true });
          setIsDetailModalOpen(true);
        }
      }

      if (hasAttemptedOpen.current) return;
      hasAttemptedOpen.current = true;

      const attemptOpen = async () => {
        try {
          if (txId) {
            let tx = transactions?.find((t: any) => String(t.id) === txId);
            if (!tx && typeof window !== 'undefined') {
              try {
                const cached = localStorage.getItem('cached_transactions');
                if (cached) {
                  const parsed = JSON.parse(cached);
                  if (Array.isArray(parsed)) tx = parsed.find((t: any) => String(t.id) === txId);
                }
              } catch(e) {}
            }
            if (tx) {
              if (tx.is_internal_transfer) {
                setViewingTransferTx(tx); setIsTransferDetailModalOpen(true);
              } else {
                setViewingTx(tx); setIsDetailModalOpen(true);
              }
              setIsDeepLinkResolved(true); 
              setTimeout(() => router.replace('/transactions', { scroll: false }), 50);
              return;
            }
            const transfer = internalTransfers?.find((t: any) => String(t.id) === txId);
            if (transfer) {
              setViewingTransferTx(transfer); setIsTransferDetailModalOpen(true); setIsDeepLinkResolved(true); 
              setTimeout(() => router.replace('/transactions', { scroll: false }), 50);
              return;
            }
            const rule = recurringTransactions?.find((t: any) => String(t.id) === txId);
            if (rule) {
              setViewingRuleTx(rule); setIsRuleDetailModalOpen(true); setIsDeepLinkResolved(true); 
              setTimeout(() => router.replace('/transactions', { scroll: false }), 50);
              return;
            }

            // If not found locally, fetch it from API
            try {
              const res = await transactionApi.getById(txId);
              const fetchedTx = res.data?.data || res.data;
              if (fetchedTx) {
                if (fetchedTx.is_internal_transfer) {
                  setViewingTransferTx(fetchedTx); setIsTransferDetailModalOpen(true);
                } else {
                  setViewingTx(fetchedTx); setIsDetailModalOpen(true);
                }
              }
            } catch (e) { console.error(e); }
            setIsDeepLinkResolved(true);
            setTimeout(() => router.replace('/transactions', { scroll: false }), 50);

          } else if (autoOpenTitle || autoOpenAmount || autoOpenDate) {
            const titleDecoded = autoOpenTitle ? decodeURIComponent(autoOpenTitle).toLowerCase() : null;
            const targetAmount = autoOpenAmount ? parseFloat(autoOpenAmount) : null;
            const targetDateStr = autoOpenDate ? decodeURIComponent(autoOpenDate).substring(0, 10) : null;

            const matchTx = (t: any) => {
              let isMatch = true;
              if (titleDecoded) {
                const tTitle = (t.title || '').toLowerCase();
                isMatch = isMatch && (tTitle.includes(titleDecoded) || titleDecoded.includes(tTitle));
              }
              if (targetAmount) {
                const tAmt = Math.abs(parseFloat(t.amount_in_user_currency || t.amount || '0'));
                isMatch = isMatch && (tAmt === targetAmount);
              }
              if (targetDateStr) {
                const txDate = (t.transaction_date || t.date || t.created_at || '').substring(0, 10);
                isMatch = isMatch && (txDate === targetDateStr);
              }
              return isMatch;
            };

            let tx = transactions?.find(matchTx);
            if (!tx && typeof window !== 'undefined') {
              try {
                const cached = localStorage.getItem('cached_transactions');
                if (cached) {
                  const parsed = JSON.parse(cached);
                  if (Array.isArray(parsed)) tx = parsed.find(matchTx);
                }
              } catch(e) {}
            }
            
            if (tx) {
              if (tx.is_internal_transfer) {
                setViewingTransferTx(tx); setIsTransferDetailModalOpen(true);
              } else {
                setViewingTx(tx); setIsDetailModalOpen(true);
              }
              setIsDeepLinkResolved(true); 
              setTimeout(() => router.replace('/transactions', { scroll: false }), 50);
              return;
            }
            
            const rule = recurringTransactions?.find(matchTx);
            if (rule) {
              setViewingRuleTx(rule); setIsRuleDetailModalOpen(true); setIsDeepLinkResolved(true); 
              setTimeout(() => router.replace('/transactions', { scroll: false }), 50);
              return;
            }

            // If not found locally, fetch it from API with FAST search
            try {
              const params: any = { per_page: 50 };
              if (titleDecoded) params.search = titleDecoded;
              if (targetDateStr) {
                params.start_date = targetDateStr;
                params.end_date = targetDateStr;
              }
              const res = await transactionApi.getAll(params);
              const allData = res.data?.data || res.data || [];
              const fetchedTx = allData.find(matchTx);
              if (fetchedTx) {
                if (fetchedTx.is_internal_transfer) {
                  setViewingTransferTx(fetchedTx); setIsTransferDetailModalOpen(true);
                } else {
                  setViewingTx(fetchedTx); setIsDetailModalOpen(true);
                }
              } else {
                setIsDetailModalOpen(false);
                if (autoOpenTitle) {
                  setSearchTerm(autoOpenTitle);
                  setDebouncedSearch(autoOpenTitle);
                }
              }
            } catch (e) { console.error(e); }
            setIsDeepLinkResolved(true);
            setTimeout(() => router.replace('/transactions', { scroll: false }), 50);
          }
        } catch (e) {
          console.error(e);
          setIsDeepLinkResolved(true);
        }
      };

      attemptOpen();
    }
  }, [transactions, internalTransfers, recurringTransactions, isLoggedIn, router]);

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
    if (parsed.cleanSearch) {
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

        // Save to cache securely matching the actual fetched data for this tab
        const hasNoExtraFilters = !debouncedSearch && !startDate && !endDate && !selectedWallet && !selectedCategory && !minAmount && !maxAmount;
        if (hasNoExtraFilters && !cursorVal && ['all', 'income', 'expense'].includes(activeTab)) {
          setTabCaches(prev => ({
            ...prev,
            [activeTab]: paginatedData.data || paginatedData || []
          }));
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải giao dịch:", err);
    }
  };

  const handleExportPDF = async () => {
    if (!isLoggedIn) return;
    setIsExporting(true);
    try {
      const parsed = parseSmartQuery(searchTerm, flatCategories, wallets);

      const finalStartDate = parsed.startDate || startDate;
      const finalEndDate = parsed.endDate || endDate;
      const finalWalletId = parsed.wallet_id || selectedWallet;
      const finalCategoryId = parsed.category_id || selectedCategory;
      const finalMinAmount = parsed.minAmount || minAmount;
      const finalMaxAmount = parsed.maxAmount || maxAmount;
      const finalType = parsed.type || (activeTab !== 'all' && activeTab !== 'transfer' && activeTab !== 'recurring_history' ? activeTab : undefined);

      const params: Record<string, unknown> = {
        per_page: 10000
      };

      if (finalStartDate) params.start_date = finalStartDate;
      if (finalEndDate) params.end_date = finalEndDate;
      if (finalWalletId) params.wallet_id = finalWalletId;
      if (finalCategoryId) params.category_id = finalCategoryId;
      if (finalMinAmount) params.min_amount = finalMinAmount;
      if (finalMaxAmount) params.max_amount = finalMaxAmount;
      if (finalType) params.type = finalType;

      const res = await transactionApi.getAll(params);
      const data = res.data || res;
      const txs = Array.isArray(data) ? data : (data.data || []);

      let totalIncome = 0;
      let totalExpense = 0;

      txs.forEach((t: TransactionItem) => {
        const amt = Math.abs(Number(t.amount_in_user_currency || t.amount || 0));
        if (t.type === 'income') {
          totalIncome += amt;
        } else if (t.type === 'expense') {
          totalExpense += amt;
        }
      });

      const netBalance = totalIncome - totalExpense;

      const container = document.createElement('div');
      container.style.padding = '24px';
      container.style.background = '#ffffff';
      container.style.color = '#1e293b';
      container.style.width = '720px'; // Perfect width for standard Letter/A4 page size with 0.5in margins
      container.style.boxSizing = 'border-box';
      container.style.fontFamily = "'Inter', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

      const userCurrency = userData?.preference?.currency || 'VND';

      let html = `
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #f1f5f9; padding-bottom:16px; margin-bottom:24px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px;">
                <svg viewBox="0 0 24 24" fill="none" style="width:100%; height:100%;">
                  <defs>
                    <linearGradient id="pdfLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#60A5FA" />
                      <stop offset="100%" stop-color="#3B82F6" />
                    </linearGradient>
                  </defs>
                  <path d="M4 4h4v16H4zM10 8h4v12h-4zM16 12h4v8h-4z" fill="url(#pdfLogoGrad)" />
                </svg>
              </span>
              <h2 style="margin:0; font-size:22px; color:#0f172a; font-weight:800; letter-spacing:0.5px;">EM</h2>
            </div>
            <div style="font-size:11px; color:#64748b; margin-top:4px; font-weight:500;">Hệ thống Quản lý Chi tiêu Cá nhân</div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Email liên hệ: support@em.vn</div>
          </div>
          <div style="text-align:right;">
            <h1 style="margin:0; font-size:18px; color:#0f172a; font-weight:800; letter-spacing:-0.3px;">SAO KÊ CHI TIẾT GIAO DỊCH</h1>
            <div style="font-size:11px; color:#475569; margin-top:6px; font-weight:600; background:#f1f5f9; padding:4px 8px; border-radius:6px; display:inline-block;">
              ${finalStartDate || finalEndDate ? `Kỳ báo cáo: ${finalStartDate || 'Bắt đầu'} đến ${finalEndDate || 'Hiện tại'}` : 'Tất cả thời gian'}
            </div>
            <div style="font-size:10px; color:#94a3b8; margin-top:4px;">Ngày xuất: ${new Date().toLocaleString('vi-VN')}</div>
          </div>
        </div>

        <!-- Info Block -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:24px; display:flex; justify-content:space-between; font-size:12px; line-height:1.4;">
          <div style="flex:1; padding-right:16px;">
            <div style="font-size:10px; text-transform:uppercase; color:#64748b; font-weight:700; letter-spacing:0.5px; margin-bottom:6px;">Thông tin khách hàng</div>
            <div style="font-size:13px; font-weight:700; color:#0f172a;">${userData?.profile?.full_name || userData?.full_name || userData?.name || 'Khách hàng'}</div>
            <div style="font-size:11px; color:#64748b; margin-top:4px;">Email: ${userData?.email || 'N/A'}</div>
          </div>
          <div style="flex:1; text-align:right; border-left:1px dashed #e2e8f0; padding-left:16px;">
            <div style="font-size:10px; text-transform:uppercase; color:#64748b; font-weight:700; letter-spacing:0.5px; margin-bottom:6px;">Tiêu chí bộ lọc</div>
            <div style="color:#475569; display:flex; flex-direction:column; gap:3px; align-items:flex-end; font-size:11px;">
              <div>Ví tài khoản: <span style="font-weight:600; color:#0f172a;">${(wallets as { id: string | number; name: string }[]).find((w) => String(w.id) === String(finalWalletId))?.name || 'Tất cả ví'}</span></div>
              <div>Danh mục: <span style="font-weight:600; color:#0f172a;">${(flatCategories as FlatCategoryItem[]).find((c) => String(c.id) === String(finalCategoryId))?.name || 'Tất cả danh mục'}</span></div>
              ${finalType ? `<div>Phân loại: <span style="font-weight:600; color:#0f172a;">${finalType === 'income' ? 'Khoản thu' : 'Khoản chi'}</span></div>` : ''}
              ${searchTerm ? `<div>Từ khóa: <span style="font-weight:600; color:#0f172a; font-style:italic;">"${searchTerm}"</span></div>` : ''}
            </div>
          </div>
        </div>

        <!-- Financial Cards -->
        <table style="width:100%; border-collapse:separate; border-spacing:12px; margin-left:-12px; margin-right:-12px; margin-bottom:24px;">
          <tr>
            <td style="width:33.3%; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px; box-sizing:border-box;">
              <div style="font-size:11px; font-weight:700; color:#166534; text-transform:uppercase; letter-spacing:0.5px;">Tổng Thu Nhập</div>
              <div style="font-size:18px; font-weight:800; color:#16a34a; margin-top:6px;">+${formatCurrency(totalIncome, userCurrency)}</div>
            </td>
            <td style="width:33.3%; background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:16px; box-sizing:border-box;">
              <div style="font-size:11px; font-weight:700; color:#991b1b; text-transform:uppercase; letter-spacing:0.5px;">Tổng Chi Tiêu</div>
              <div style="font-size:18px; font-weight:800; color:#dc2626; margin-top:6px;">-${formatCurrency(totalExpense, userCurrency)}</div>
            </td>
            <td style="width:33.3%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; box-sizing:border-box;">
              <div style="font-size:11px; font-weight:700; color:#334155; text-transform:uppercase; letter-spacing:0.5px;">Số Dư Ròng</div>
              <div style="font-size:18px; font-weight:800; color:${netBalance >= 0 ? '#16a34a' : '#dc2626'}; margin-top:6px;">
                ${netBalance >= 0 ? '+' : ''}${formatCurrency(netBalance, userCurrency)}
              </div>
            </td>
          </tr>
        </table>

        <!-- Table Header -->
        <h3 style="font-size:13px; color:#0f172a; text-transform:uppercase; font-weight:800; letter-spacing:0.5px; margin-bottom:12px; margin-top:0;">Danh sách giao dịch phát sinh</h3>

        <!-- Transaction Table -->
        <table style="width:100%; border-collapse:collapse; font-size:10px; margin-bottom:30px;">
          <thead>
            <tr style="background:#0f172a; color:#ffffff;">
              <th style="padding:10px 8px; text-align:center; font-weight:700; width:35px; border-top-left-radius:6px; border-bottom-left-radius:6px;">STT</th>
              <th style="padding:10px 8px; text-align:left; font-weight:700; width:80px;">Ngày GD</th>
              <th style="padding:10px 8px; text-align:left; font-weight:700; width:180px;">Nội dung giao dịch</th>
              <th style="padding:10px 8px; text-align:left; font-weight:700; width:120px;">Danh mục</th>
              <th style="padding:10px 8px; text-align:left; font-weight:700; width:90px;">Tài khoản/Ví</th>
              <th style="padding:10px 8px; text-align:center; font-weight:700; width:45px;">Loại</th>
              <th style="padding:10px 8px; text-align:right; font-weight:700; width:110px; border-top-right-radius:6px; border-bottom-right-radius:6px;">Số tiền</th>
            </tr>
          </thead>
          <tbody>
      `;

      txs.forEach((t: TransactionItem, index: number) => {
        let datePart = '';
        const rawDate = t.transaction_date || t.date || '';
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            datePart = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
          } else {
            datePart = rawDate;
          }
        }

        const note = t.title || t.description || t.note || '';
        let categoryName = t.category?.name || t.category_name || 'Không phân mục';
        const catIdStr = String(t.category_id || 'other');
        const catInfoObj = (flatCategories as FlatCategoryItem[]).find((c) => String(c.id) === catIdStr);
        if (catInfoObj && catInfoObj.parent_id) {
          const parentObj = (flatCategories as FlatCategoryItem[]).find((c) => String(c.id) === String(catInfoObj.parent_id));
          if (parentObj) {
            categoryName = parentObj.name + ' - ' + categoryName;
          }
        }

        const walletName = t.wallet?.name || t.wallet_name || 'Ví đã xóa';
        const isIncome = t.type === 'income';
        const isExpense = t.type === 'expense';
        const typeStr = isIncome ? 'Thu' : (isExpense ? 'Chi' : 'Chuyển');
        const amountVal = Number(t.amount_in_user_currency || t.amount) || 0;
        const amountStr = `${isIncome ? '+' : (isExpense ? '-' : '')}${formatCurrency(amountVal, userCurrency)}`;
        const amountColor = isIncome ? '#16a34a' : (isExpense ? '#dc2626' : '#2563eb');
        const rowBg = index % 2 === 1 ? '#f8fafc' : '#ffffff';

        html += `
          <tr style="background:${rowBg}; page-break-inside: avoid; break-inside: avoid;">
            <td style="padding:10px 8px; text-align:center; border-bottom:1px solid #f1f5f9; color:#64748b;">${index + 1}</td>
            <td style="padding:10px 8px; border-bottom:1px solid #f1f5f9; color:#64748b;">${datePart}</td>
            <td style="padding:10px 8px; border-bottom:1px solid #f1f5f9; color:#0f172a; font-weight:500; word-break:break-word; max-width:180px;">${note}</td>
            <td style="padding:10px 8px; border-bottom:1px solid #f1f5f9; color:#475569;">${categoryName}</td>
            <td style="padding:10px 8px; border-bottom:1px solid #f1f5f9; color:#64748b;">${walletName}</td>
            <td style="padding:10px 8px; border-bottom:1px solid #f1f5f9; text-align:center; color:${amountColor}; font-weight:700;">${typeStr}</td>
            <td style="padding:10px 8px; border-bottom:1px solid #f1f5f9; text-align:right; color:${amountColor}; font-weight:700;">${amountStr}</td>
          </tr>
        `;
      });

      if (txs.length === 0) {
        html += `
          <tr>
            <td colspan="7" style="padding:24px; text-align:center; color:#94a3b8; border-bottom:1px solid #f1f5f9; font-style:italic;">Không có giao dịch nào được ghi nhận phù hợp với bộ lọc hiện tại.</td>
          </tr>
        `;
      }

      html += `
          </tbody>
        </table>

        <!-- Signatures -->
        <div style="display:flex; justify-content:space-between; margin-top:40px; page-break-inside:avoid;">
          <div style="width:200px; text-align:center;">
            <div style="font-size:11px; color:#475569; font-weight:700; margin-bottom:44px;">Người lập biểu</div>
            <div style="font-size:11px; color:#94a3b8;">(Ký và ghi rõ họ tên)</div>
          </div>
          <div style="width:250px; text-align:center;">
            <div style="font-size:11px; color:#475569; font-weight:700; margin-bottom:44px;">Xác nhận Hệ thống EM</div>
            <div style="font-size:11px; color:#4f46e5; font-weight:800; border:2px dashed #4f46e5; padding:6px 12px; border-radius:8px; display:inline-block; transform:rotate(-2deg);">
              ✔ ĐÃ XÁC THỰC HỆ THỐNG
            </div>
          </div>
        </div>

        <!-- Disclaimer -->
        <div style="border-top:1px solid #f1f5f9; padding-top:16px; margin-top:48px; text-align:center; font-size:9px; color:#94a3b8;">
          Đây là tài liệu được xuất tự động từ Hệ thống Quản lý Chi tiêu Cá nhân EM và chỉ mang tính chất thống kê, đối soát cá nhân.
        </div>
      `;

      container.innerHTML = html;

      const opt = {
        margin: 0.5,
        filename: 'Sao_ke_chi_tiet_' + (finalStartDate || 'Bat_dau') + '_den_' + (finalEndDate || 'Hien_tai') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
      };

      interface Html2Pdf {
        set: (opt: unknown) => {
          from: (container: unknown) => {
            save: () => Promise<void>;
          };
        };
      }
      const html2pdf = (window as unknown as { html2pdf?: (opt?: unknown) => Html2Pdf }).html2pdf;
      if (html2pdf) {
        await html2pdf().set(opt).from(container).save();
      } else {
        alert("Thư viện in PDF đang tải, vui lòng đợi 1 giây rồi thử lại!");
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi tạo file sao kê PDF!");
    } finally {
      setIsExporting(false);
    }
  };

  // Trigger transaction reload whenever filters or page cursor changes
  useEffect(() => {
    if (isLoggedIn && isDeepLinkResolved && activeTab !== 'transfer' && activeTab !== 'recurring' && activeTab !== 'recurring_history') {
      const timer = setTimeout(() => {
        loadFilteredTransactions(currentCursor);
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoggedIn,
    isDeepLinkResolved,
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
    currentCursor
  ]);





  // Background prefetching for secondary tabs to make them instantaneous
  useEffect(() => {
    if (isLoggedIn && isDeepLinkResolved) {
      // Prefetch transfers
      if (!hasLoadedTransfers) {
        apiFetch('/wallets/transfers')
          .then(res => {
            setInternalTransfers(res.data || []);
            setHasLoadedTransfers(true);
          })
          .catch(err => console.error('Error prefetching transfers', err));
      }

      // Prefetch recurring
      if (!hasLoadedRecurring) {
        apiFetch('/recurring-rules')
          .then(res => {
            const data = res.data ? res.data : (Array.isArray(res) ? res : []);
            setRecurringTransactions(data);
            setHasLoadedRecurring(true);
          })
          .catch(err => console.error('Error prefetching recurring rules', err));
      }

      // Prefetch recurring history
      if (!hasLoadedHistory) {
        transactionApi.getAll({ per_page: 500 })
          .then(res => {
            const data = res.data?.data || res.data || [];
            setRecurringHistoryList(data.filter((tx: any) => tx.source_type === 'recurring'));
            setHasLoadedHistory(true);
          })
          .catch(err => console.error('Error prefetching recurring history', err));
      }

      // Prefetch payees globally to resolve names when nested payee object is missing
      if (payees.length === 0) {
        apiFetch('/payees')
          .then(res => {
            let rawArray = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : (res?.data?.data && Array.isArray(res.data.data) ? res.data.data : []));
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
            setPayees(payeesArray);
          })
          .catch(err => console.error('Error prefetching payees', err));
      }
    }
  }, [isLoggedIn, isDeepLinkResolved, activeTab]);

  // Fetch transfers when transfer tab is active (fallback if prefetch hasn't finished)
  useEffect(() => {
    if (activeTab === 'transfer' && !hasLoadedTransfers) {
      if (internalTransfers.length === 0) setIsLoadingTransfers(true);
      apiFetch('/wallets/transfers')
        .then(res => {
          setInternalTransfers(res.data || []);
          setHasLoadedTransfers(true);
        })
        .catch(err => console.error('Error fetching transfers', err))
        .finally(() => setIsLoadingTransfers(false));
    }
  }, [activeTab, hasLoadedTransfers]);

  // Fetch recurring when recurring tab is active
  useEffect(() => {
    if ((activeTab === 'recurring' || activeTab === 'recurring_history') && !hasLoadedRecurring) {
      if (recurringTransactions.length === 0) setIsLoadingRecurring(true);
      apiFetch('/recurring-rules')
        .then(res => {
          const data = res.data ? res.data : (Array.isArray(res) ? res : []);
          setRecurringTransactions(data);
          setHasLoadedRecurring(true);
        })
        .catch(err => console.error('Error fetching recurring transactions', err))
        .finally(() => setIsLoadingRecurring(false));
    }
  }, [activeTab, hasLoadedRecurring]);

  // Fetch recurring history once
  useEffect(() => {
    if (activeTab === 'recurring_history' && !hasLoadedHistory) {
      setIsLoadingHistory(true);
      transactionApi.getAll({ per_page: 500 })
        .then(res => {
          const data = res.data?.data || res.data || [];
          setRecurringHistoryList(data.filter((tx: any) => 
            tx.source_type === 'recurring' || 
            (tx.source_type === 'transfer' && (tx.notes?.includes('Recurring transaction automatically created from rule') || tx.notes?.includes('Giao dịch định kỳ tự động tạo từ quy tắc')))
          ));
          setHasLoadedHistory(true);
        })
        .catch(err => console.error('Error fetching recurring history', err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [activeTab, hasLoadedHistory]);

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
      result = result.filter(t => parseSafeDate(t.date || t.transaction_date || t.created_at) >= start);
    }
    if (finalEndDate) {
      const end = new Date(finalEndDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => parseSafeDate(t.date || t.transaction_date || t.created_at) <= end);
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
        comparison = parseSafeDate(a.date || a.transaction_date || a.created_at).getTime() - parseSafeDate(b.date || b.transaction_date || b.created_at).getTime();
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

  const handleAdd = () => {
    setNewTx(prev => ({ ...prev, transaction_date: getLocalDateTime() }));
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setNewTx(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...selectedFiles]
      }));
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
    } catch (error: any) {
      alert(error.message || 'Không thể thay đổi trạng thái lúc này. Vui lòng thử lại sau.');
    }
  };

  const submitAdd = async () => {
    if (!newTx.title || !newTx.amount || !newTx.wallet_id || !newTx.category_id) {
      alert(t('please_fill_all_required_fields') || 'Vui lòng điền các trường bắt buộc');
      return;
    }
    const selectedWallet = wallets.find(w => w.id === newTx.wallet_id);
    const isCashWallet = selectedWallet?.type === 'cash';

    if (!isCashWallet && newTx.type === 'expense' && !newTx.payee_id) {
      alert('Giao dịch thủ công qua ví ngân hàng hoặc ví điện tử bắt buộc phải có người hưởng thụ.');
      return;
    }

    if (selectedWallet && selectedWallet.currency_code !== 'VND') {
      alert('Giao dịch thủ công chỉ hỗ trợ đơn vị tiền tệ VND.');
      return;
    }

    const selectedCategoryObj = flatCategories.find(c => c.id === newTx.category_id);
    if (!isCashWallet && selectedCategoryObj?.type === 'income') {
      alert('Giao dịch thủ công qua ví ngân hàng hoặc ví điện tử không được chọn danh mục thu nhập.');
      return;
    }

    if (newTx.is_recurring) {
      if (isCashWallet) {
        alert('Không thể dùng ví tiền mặt cho giao dịch định kỳ');
        return;
      }
      if (selectedWallet && selectedWallet.currency_code !== 'VND') {
        alert('Giao dịch định kỳ chỉ hỗ trợ đơn vị tiền tệ VND.');
        return;
      }
      if (!isCashWallet && selectedCategoryObj?.type === 'income') {
        alert('Giao dịch định kỳ qua ví ngân hàng hoặc ví điện tử không được chọn danh mục thu nhập.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Luôn tạo giao dịch thực tế để hiển thị ngay lập tức
      const formData = new FormData();
      formData.append('title', newTx.title);
      formData.append('amount', newTx.amount.toString().replace(/\./g, ''));
      formData.append('type', newTx.type);
      formData.append('wallet_id', newTx.wallet_id);
      if (newTx.type === 'income') {
        formData.append('source_type', 'adjustment');
      }
      if (newTx.category_id) formData.append('category_id', newTx.category_id);
      if (newTx.payee_id) formData.append('payee_id', newTx.payee_id);
      formData.append('transaction_date', new Date(newTx.transaction_date).toISOString().slice(0, 19).replace('T', ' '));
      formData.append('notes', formatNotesWithTitle(newTx.title, newTx.notes || ''));
      if (newTx.attachments && newTx.attachments.length > 0) {
        newTx.attachments.forEach((file) => {
          formData.append('attachments[]', file);
        });
      }

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
        attachments: [],
        is_recurring: false,
        frequency: 'monthly',
        end_date: ''
      });

      // Tải lại danh sách chạy ngầm
      Promise.all([
        fetchTransactions(),
        fetchWallets(),
        loadFilteredTransactions(null),
        fetchUnreadNotificationsCount()
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
            next_run_at: new Date(newTx.transaction_date).toISOString().slice(0, 19).replace('T', ' '),
            end_at: newTx.end_date || null,
            notes: formatNotesWithTitle(newTx.title, newTx.notes || '')
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
        attachments: [],
        is_recurring: false,
        frequency: 'monthly',
        end_date: ''
      });
      setIsModalOpen(false);
      setCurrentCursor(null);
      setHasLoadedHistory(false);
      loadFilteredTransactions(null);
    } catch (error: any) {
      alert(error.message || 'Lỗi khi thêm giao dịch');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleQuickCategoryChange = async (tx: any, newCategoryId: string) => {
    if (!newCategoryId || newCategoryId === String(tx.category_id)) return;

    if (newCategoryId === 'CREATE_NEW') {
      window.location.href = '/categories';
      return;
    }

    const newCategory = flatCategories.find(c => String(c.id) === newCategoryId);
    if (!newCategory) return;

    // Optimistic UI update
    const updateFn = (prevList: any[]) => prevList.map(t => {
      if (t.id === tx.id) {
        return {
          ...t,
          category_id: newCategoryId,
          category: {
            ...(t.category || {}),
            id: newCategoryId,
            name: newCategory.name || '',
            icon: newCategory.icon || '',
            color: newCategory.color || ''
          }
        };
      }
      return t;
    });

    setTabCaches(prevCaches => {
      const newCaches = { ...prevCaches };
      Object.keys(newCaches).forEach(key => {
        if (Array.isArray(newCaches[key])) {
          newCaches[key] = updateFn(newCaches[key]);
        }
      });
      return newCaches;
    });

    try {
      const formData = new FormData();
      const rawTitle = parseNotesAndTitle(tx.title || tx.name || tx.description || '', tx.notes, tx.payee).displayTitle;
      const rawNotes = parseNotesAndTitle(tx.title || tx.name || tx.description || '', tx.notes, tx.payee).displayNotes;

      formData.append('title', rawTitle);
      formData.append('amount', Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0)).toString());
      formData.append('type', tx.type);
      formData.append('wallet_id', tx.wallet_id || '');
      // Preserve original source_type to avoid backend treating it as a new manual transaction
      if (tx.source_type) {
        formData.append('source_type', tx.source_type);
      } else if (tx.type === 'income') {
        formData.append('source_type', 'adjustment');
      }
      formData.append('category_id', newCategoryId);
      const tDate = tx.transaction_date || tx.created_at || tx.date;
      if (tDate) {
        formData.append('transaction_date', new Date(tDate).toISOString().slice(0, 19).replace('T', ' '));
      }

      formData.append('notes', formatNotesWithTitle(rawTitle, rawNotes));

      const payeeId = tx.payee_id || tx.payee?.id || tx.payee?.payee_id;
      if (payeeId) {
        formData.append('payee_id', String(payeeId));
      } else if (tx.payee?.payee_name || tx.payee?.name) {
        formData.append('payee_name', tx.payee?.payee_name || tx.payee?.name || '');
      }

      await transactionApi.update(tx.id, formData);
      loadFilteredTransactions(currentCursor);
      fetchTransactions();
    } catch (e: any) {
      console.error('Failed to quick change category', e);
      alert('Đổi danh mục thất bại: ' + (e.message || 'Lỗi không xác định'));
      loadFilteredTransactions(currentCursor);
      fetchTransactions();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirm_delete_tx') || 'Bạn có chắc chắn muốn xóa giao dịch này?')) {
      try {
        await deleteTransaction(id);
        setHasLoadedHistory(false);
        setHasLoadedTransfers(false);
        loadFilteredTransactions(currentCursor);
        fetchUnreadNotificationsCount();
        setInternalTransfers(prev => prev.filter(t => t.id !== id));
      } catch (error: any) {
        alert(error.message || 'Lỗi khi xóa giao dịch');
      }
    }
  };

  const handleDeleteTransfer = async (transferId: string) => {
    if (window.confirm(t('confirm_delete_tx') || 'Bạn có chắc chắn muốn xóa giao dịch này?')) {
      const transferToDelete = internalTransfers.find(t => t.id === transferId);

      // Xóa khỏi UI ngay lập tức để tạo cảm giác mượt mà (Optimistic UI)
      setInternalTransfers(prev => prev.filter(t => t.id !== transferId));

      // Chạy nền các thao tác API chậm
      (async () => {
        try {
          let finalId = transferId;

          if (transferToDelete && transferToDelete.date) {
            const dateStr = transferToDelete.date.split('T')[0];
            const res = await transactionApi.getAll({ type: 'transfer', start_date: dateStr, end_date: dateStr, per_page: 100 });
            const txs = res?.data?.data || res?.data || [];
            const targetTx = txs.find((t: any) => t.source_id === transferId && t.source_type === 'transfer');
            if (targetTx) {
              finalId = targetTx.id;
            } else {
              throw new Error('Không tìm thấy giao dịch chuyển tiền gốc để xóa.');
            }
          } else {
            const res = await transactionApi.getAll({ type: 'transfer', per_page: 100 });
            const txs = res?.data?.data || res?.data || [];
            const targetTx = txs.find((t: any) => t.source_id === transferId && t.source_type === 'transfer');
            if (targetTx) {
              finalId = targetTx.id;
            } else {
              throw new Error('Không tìm thấy giao dịch chuyển tiền gốc để xóa.');
            }
          }

          await deleteTransaction(finalId);
          setHasLoadedHistory(false);
          setHasLoadedTransfers(false);
          loadFilteredTransactions(currentCursor);
          fetchUnreadNotificationsCount();
        } catch (error: any) {
          // Hoàn tác lại giao diện nếu có lỗi
          if (transferToDelete) {
            setInternalTransfers(prev => [...prev, transferToDelete].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          }
          alert(error.message || 'Lỗi khi xóa giao dịch chuyển tiền');
        }
      })();
    }
  };

  const submitEdit = async () => {
    if (!editingTx.title || !editingTx.amount || !editingTx.wallet_id) {
      alert('Vui lòng điền các trường bắt buộc');
      return;
    }
    const selectedWallet = wallets.find(w => w.id === editingTx.wallet_id);
    const isCashWallet = selectedWallet?.type === 'cash';

    if (!isCashWallet && editingTx.type === 'expense' && !editingTx.payee_id) {
      alert('Giao dịch thủ công qua ví ngân hàng hoặc ví điện tử bắt buộc phải có người hưởng thụ.');
      return;
    }

    if (selectedWallet && selectedWallet.currency_code !== 'VND') {
      alert('Giao dịch thủ công chỉ hỗ trợ đơn vị tiền tệ VND.');
      return;
    }

    const selectedCategoryObj = flatCategories.find(c => c.id === editingTx.category_id);
    if (!isCashWallet && selectedCategoryObj?.type === 'income') {
      alert('Giao dịch thủ công qua ví ngân hàng hoặc ví điện tử không được chọn danh mục thu nhập.');
      return;
    }



    setIsSubmittingEdit(true);
    try {
      const formData = new FormData();
      formData.append('title', editingTx.title);
      formData.append('amount', editingTx.amount.toString().replace(/\./g, ''));
      formData.append('type', editingTx.type);
      formData.append('wallet_id', editingTx.wallet_id);
      if (editingTx.type === 'income') {
        formData.append('source_type', 'adjustment');
      }
      formData.append('category_id', editingTx.category_id || '');
      formData.append('transaction_date', new Date(editingTx.transaction_date).toISOString().slice(0, 19).replace('T', ' '));
      formData.append('notes', formatNotesWithTitle(editingTx.title, editingTx.notes || ''));
      if (editingTx.payee_id) {
        formData.append('payee_id', editingTx.payee_id);
      }

      const originalCount = editingTx.original_attachments?.length || 0;
      const currentCount = editingTx.existing_attachments?.length || 0;
      const isAnyDeleted = currentCount < originalCount;
      const isAnyAdded = (editingTx.attachments?.length || 0) > 0;

      if (isAnyDeleted || isAnyAdded) {
        if (currentCount > 0 || isAnyAdded) {
          const remainingFiles = await Promise.all(
            (editingTx.existing_attachments || []).map(async (att: any) => {
              const filename = att.file_url.split('/').pop() || 'existing_image.png';
              return await urlToFile(att.file_url, filename);
            })
          );
          const validRemainingFiles = remainingFiles.filter((f): f is File => f !== null);
          const finalFiles = [...validRemainingFiles, ...(editingTx.attachments || [])];

          finalFiles.forEach((file) => {
            formData.append('attachments[]', file);
          });
        }
      }

      await transactionApi.update(editingTx.id, formData);

      setIsEditModalOpen(false);

      if (activeTab === 'recurring_history') {
        if (payees.length === 0) {
          try {
            const res = await apiFetch('/payees');
            let rawArray = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : (res?.data?.data && Array.isArray(res.data.data) ? res.data.data : []));
            let payeesArray = rawArray.map((item: any) => ({
              ...item,
              id: String(item.id || item.user_id || Math.random()),
              payee_name: String(item.payee_name || item.name || item.full_name || item.id || item.user_id || 'Không xác định'),
              identifier: String(item.identifier || item.email || item.phone || '')
            }));
            setPayees(payeesArray);
          } catch (e) {
            console.error(e);
          }
        }

        const res = await transactionApi.getAll({ per_page: 500 });
        const data = res.data?.data || res.data || [];
        setRecurringHistoryList(data.filter((tx: any) => tx.source_type === 'recurring'));
        setHasLoadedHistory(true);
      } else {
        setHasLoadedHistory(false);
        setActiveTab('all');
      }

      await Promise.all([
        loadFilteredTransactions(currentCursor),
        fetchWallets(),
        fetchUnreadNotificationsCount()
      ]);

      setTimeout(() => {
        alert('Cập nhật giao dịch thành công!');
      }, 100);
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

    if (selectedEditWallet && selectedEditWallet.currency_code !== 'VND') {
      alert('Giao dịch định kỳ chỉ hỗ trợ đơn vị tiền tệ VND.');
      return;
    }

    const selectedCategoryObj = flatCategories.find(c => c.id === editingRecurringTx.category_id);
    if (selectedEditWallet?.type !== 'cash' && selectedCategoryObj?.type === 'income') {
      alert('Giao dịch định kỳ qua ví ngân hàng hoặc ví điện tử không được chọn danh mục thu nhập.');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await apiFetch(`/recurring-rules/${editingRecurringTx.id}`, {
        method: 'POST',
        body: JSON.stringify({
          title: editingRecurringTx.title,
          amount: editingRecurringTx.amount.toString().replace(/\./g, ''),
          type: editingRecurringTx.type,
          wallet_id: editingRecurringTx.wallet_id,
          category_id: editingRecurringTx.category_id || null,
          payee_id: editingRecurringTx.payee_id || null,
          frequency: editingRecurringTx.frequency,
          next_run_at: new Date(editingRecurringTx.start_date).toISOString().slice(0, 19).replace('T', ' '),
          end_at: editingRecurringTx.end_date || null,
          notes: formatNotesWithTitle(editingRecurringTx.title, editingRecurringTx.notes || '')
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
  const hasNoExtraFilters = !debouncedSearch && !startDate && !endDate && !selectedWallet && !selectedCategory && !minAmount && !maxAmount;

  if (activeTab === 'recurring_history') {
    filtered = recurringHistoryList;
    if (debouncedSearch) {
      filtered = filtered.filter((tx: any) => tx.title.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }
  } else if (hasNoExtraFilters && !currentCursor && ['all', 'income', 'expense'].includes(activeTab)) {
    if (tabCaches[activeTab] && tabCaches[activeTab].length > 0) {
      filtered = tabCaches[activeTab];
    } else {
      // Fallback: client-side filter to prevent wrong list flash while API loads
      if (activeTab === 'income') filtered = transactions.filter((t: any) => t.type === 'income');
      if (activeTab === 'expense') filtered = transactions.filter((t: any) => t.type === 'expense');
    }
  }

  return (
    <div className="dashboard-container">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
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
            <div className="search-bar">
              <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center', userSelect: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm..."
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

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              style={{
                background: 'var(--bg-color)',
                color: '#10B981',
                padding: '10px 18px',
                borderRadius: '24px',
                fontWeight: '600',
                border: '1px solid #10B981',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                opacity: isExporting ? 0.7 : 1
              }}
              title="Xuất bảng sao kê giao dịch chi tiết ra file PDF"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              {isExporting ? 'Đang tạo...' : 'In sao kê'}
            </button>

            <button style={{ background: '#1814F3', color: '#fff', padding: '10px 20px', borderRadius: '24px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleAdd}>
              {t('add_transaction')}
            </button>

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
                      <th style={{ fontWeight: '600' }}>{t('actions') || 'Thao tác'}</th>
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
                              {parseSafeDate(tx.date).toLocaleDateString('vi-VN')}
                            </div>
                            <div style={{ fontSize: '11px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                              {parseSafeDate(tx.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '14px' }}>
                            {formatCurrency(tx.amount || 0, tx.currency_code || tx.wallet?.currency_code || 'VND')}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setViewingTransferTx(tx);
                                  setIsTransferDetailModalOpen(true);
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
                                onClick={() => handleDeleteTransfer(tx.id)}
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
                        <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#718EBF' }}>Chưa có chuyển tiền nội bộ nào</td>
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
                      <th style={{ fontWeight: '600' }}>Tên giao dịch</th>
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
                          <td style={{ minWidth: '150px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ marginRight: '8px' }}>⏰</span>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{parseNotesAndTitle(tx.title || tx.description || tx.name, tx.notes, tx.payee).displayTitle}</span>
                            </div>
                          </td>
                          <td style={{ minWidth: '150px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {tx.payee && (
                                <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '14px' }}>👤</span>
                                  <span>
                                    {tx.type === 'income' ? 'Người trả' : 'Người hưởng thụ'}:{' '}
                                    <strong>{tx.payee.payee_name || tx.payee.name}</strong>
                                  </span>
                                </div>
                              )}
                              {parseNotesAndTitle(tx.title || tx.description || tx.name, tx.notes, tx.payee).displayNotes ? (
                                <div style={{ fontSize: '12px', color: '#718EBF', fontStyle: 'italic', marginTop: tx.payee ? '2px' : '0' }}>
                                  {parseNotesAndTitle(tx.title || tx.description || tx.name, tx.notes, tx.payee).displayNotes}
                                </div>
                              ) : (
                                !tx.payee && <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>-</span>
                              )}
                            </div>
                          </td>
                          <td style={{ color: tx.type === 'income' ? '#16DBCC' : '#FE5C73', fontWeight: '700', fontSize: '15px' }}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(tx.amount)), tx.currency_code || tx.wallet?.currency_code || 'VND')}
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
                              {tx.next_run_at ? parseSafeDate(tx.next_run_at).toLocaleDateString('vi-VN') : '-'}
                            </div>
                            {tx.next_run_at && (
                              <div style={{ fontSize: '11px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                                {parseSafeDate(tx.next_run_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
                                  const { displayTitle, displayNotes } = parseNotesAndTitle(tx.title || tx.description || tx.name || '', tx.notes, tx.payee);
                                  setEditingRecurringTx({
                                    id: tx.id,
                                    title: displayTitle,
                                    amount: tx.amount ? parseInt(tx.amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '',
                                    type: tx.type || 'expense',
                                    wallet_id: tx.wallet_id || (wallets.length > 0 ? wallets[0].id : ''),
                                    category_id: tx.category_id || '',
                                    frequency: tx.frequency || 'monthly',
                                    start_date: tx.start_date ? new Date(new Date(tx.start_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : (tx.next_run_at ? new Date(new Date(tx.next_run_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : getLocalDateTime()),
                                    end_date: tx.end_at ? tx.end_at.split('T')[0] : '',
                                    notes: displayNotes
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
                        <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#718EBF' }}>Chưa có giao dịch định kỳ nào</td>
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
                      <th style={{ fontWeight: '600' }}>Tên giao dịch</th>
                      <th style={{ fontWeight: '600' }}>{t('description')}</th>
                      {activeTab === 'recurring_history' && (
                        <th style={{ fontWeight: '600' }}>Người hưởng thụ</th>
                      )}
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

                      // Helper to aggressively resolve payee name
                      const getPayeeName = () => {
                        if (tx.payee?.payee_name || tx.payee?.name) return tx.payee.payee_name || tx.payee.name;
                        if (tx.payee_id && payees.length > 0) {
                          const p = payees.find((p: any) => String(p.id) === String(tx.payee_id));
                          if (p) return p.payee_name || p.name;
                        }
                        if (tx.source_type === 'recurring' && recurringTransactions.length > 0) {
                          const ruleId = tx.recurring_rule_id || tx.rule_id || tx.source_id;
                          if (ruleId) {
                            const rule = recurringTransactions.find((r: any) => String(r.id) === String(ruleId));
                            if (rule) {
                              if (rule.payee?.payee_name || rule.payee?.name) return rule.payee.payee_name || rule.payee.name;
                              if (rule.payee_id && payees.length > 0) {
                                const p = payees.find((p: any) => String(p.id) === String(rule.payee_id));
                                if (p) return p.payee_name || p.name;
                              }
                            }
                          }
                        }
                        return null;
                      };
                      const resolvedPayeeName = getPayeeName();

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
                          <td style={{ minWidth: '150px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{parseNotesAndTitle(tx.title, tx.notes, tx.payee).displayTitle}</span>
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
                          <td style={{ minWidth: '150px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {activeTab !== 'recurring_history' && resolvedPayeeName && (
                                <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '14px' }}>👤</span>
                                  <span>
                                    {tx.type === 'income' ? 'Người trả' : 'Người hưởng thụ'}:{' '}
                                    <strong>{resolvedPayeeName}</strong>
                                  </span>
                                </div>
                              )}
                              {parseNotesAndTitle(tx.title, tx.notes, tx.payee).displayNotes ? (
                                <div style={{ fontSize: '12px', color: '#718EBF', fontStyle: 'italic', marginTop: (activeTab !== 'recurring_history' && resolvedPayeeName) ? '2px' : '0' }}>
                                  {parseNotesAndTitle(tx.title, tx.notes, tx.payee).displayNotes}
                                </div>
                              ) : (
                                ((activeTab !== 'recurring_history' && !resolvedPayeeName) || (activeTab === 'recurring_history')) && <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>-</span>
                              )}
                            </div>
                          </td>
                          {activeTab === 'recurring_history' && (
                            <td style={{ minWidth: '150px' }}>
                              {resolvedPayeeName ? (
                                <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '14px' }}>👤</span>
                                  <span>
                                    <strong>{resolvedPayeeName}</strong>
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-light)', fontSize: '13px', fontWeight: '500' }}>
                                  {tx.payee_id ? `(ID: ${tx.payee_id})` : '-'}
                                </span>
                              )}
                            </td>
                          )}
                          <td>
                            {tx.is_internal_transfer ? (
                              <span style={{ color: 'var(--text-light)', fontSize: '13px', fontWeight: '500' }}>-</span>
                            ) : (
                              <div style={{ position: 'relative', display: 'inline-block' }}>
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
                                    gap: '6px',
                                    cursor: 'pointer'
                                  }}>
                                    <span>{categoryIcon}</span>
                                    {tx.category.name}
                                    <span style={{ fontSize: '10px', marginLeft: '2px', opacity: 0.7 }}>▼</span>
                                  </span>
                                ) : (
                                  <span style={{
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    background: 'rgba(0,0,0,0.05)',
                                    color: 'var(--text-light)',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer'
                                  }}>
                                    <span>➕</span> Thêm
                                  </span>
                                )}
                                <select
                                  value={tx.category_id || ''}
                                  onChange={(e) => handleQuickCategoryChange(tx, e.target.value)}
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer',
                                    appearance: 'none'
                                  }}
                                  title="Đổi danh mục nhanh"
                                >
                                  <option value="" disabled>Chọn danh mục</option>
                                  {flatCategories
                                    .filter((c: any) => c.type === tx.type)
                                    .map((c: any) => (
                                      <option key={c.id} value={c.id}>
                                        {c.displayName}
                                      </option>
                                    ))
                                  }
                                  <option value="CREATE_NEW" style={{ fontWeight: 'bold', color: '#1814F3' }}>
                                    ➕ Tạo danh mục mới
                                  </option>
                                </select>
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>
                              {parseSafeDate(tx.transaction_date).toLocaleDateString('vi-VN')}
                            </div>
                            <div style={{ fontSize: '11px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                              {parseSafeDate(tx.transaction_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td style={{ color: tx.type === 'income' ? '#16DBCC' : '#FE5C73', fontWeight: '800', fontSize: '15px' }}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0)), tx.currency_code || tx.wallet?.currency_code || 'VND')}
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
                                  const { displayTitle, displayNotes } = parseNotesAndTitle(tx.title || '', tx.notes, tx.payee);
                                  setEditingTx({
                                    id: tx.id,
                                    title: displayTitle,
                                    amount: tx.amount ? parseInt(tx.amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '',
                                    type: tx.type || 'expense',
                                    wallet_id: tx.wallet_id || '',
                                    category_id: tx.category_id || '',
                                    payee_id: tx.payee_id || '',
                                    transaction_date: toLocalDateTimeInput(tx.transaction_date),
                                    notes: displayNotes,
                                    attachments: [] as File[],
                                    existing_attachments: tx.attachments || (tx.attachment_url ? [{ id: 'old', file_url: tx.attachment_url }] : []),
                                    original_attachments: tx.attachments || (tx.attachment_url ? [{ id: 'old', file_url: tx.attachment_url }] : [])
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
                        <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#718EBF' }}>{t('no_transactions_found') || 'Không tìm thấy giao dịch nào'}</td>
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


      </main>

      {/* MODAL THÊM GIAO DỊCH */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '30px', width: '550px', maxWidth: '95%', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '22px', fontWeight: '700' }}>{t('add_new_transaction')}</h2>

            {!isCashWallet && (
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={newTx.is_recurring}
                  onChange={e => {
                    const isChecked = e.target.checked;
                    setNewTx({
                      ...newTx,
                      is_recurring: isChecked,
                      type: (isChecked && newTx.type === 'income') ? 'expense' : newTx.type
                    });
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#1814F3' }}
                />
                <label htmlFor="is_recurring" style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}>
                  Tạo giao dịch định kỳ (Tự động lặp lại)
                </label>
              </div>
            )}

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
                <input
                  type="text"
                  value={newTx.amount}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    const formattedValue = rawValue ? parseInt(rawValue, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '';
                    setNewTx({ ...newTx, amount: formattedValue });
                  }}
                  placeholder={t('tx_amount_placeholder')}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('type')} *</label>
                <select value={newTx.type} onChange={e => setNewTx({ ...newTx, type: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  <option value="expense">{t('spending')}</option>
                  {!newTx.is_recurring && <option value="income">{t('income')}</option>}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('wallets')} *</label>
                <select value={newTx.wallet_id} onChange={e => setNewTx({ ...newTx, wallet_id: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('date_label')} *</label>
                <input type="datetime-local" value={newTx.transaction_date} onChange={e => setNewTx({ ...newTx, transaction_date: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '15px', background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Danh mục thông minh
                  {isClassifyingNew && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1814F3', fontWeight: '600' }}>
                      <span className="ai-pulse-dot"></span> Đang phân tích...
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => runManualClassification('new')}
                  disabled={isClassifyingNew || (!newTx.title && !newTx.notes)}
                  style={{
                    background: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(138, 35, 135, 0.25)',
                    opacity: (!newTx.title && !newTx.notes) ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  Quét AI 🔮
                </button>
              </div>
              <CategoryPicker
                value={newTx.category_id}
                onChange={(id) => setNewTx({ ...newTx, category_id: id })}
                type={!isCashWallet ? 'expense' : newTx.type}
                categories={categories}
                tCategory={tCategory}
                placeholder={t('select_category') || 'Chọn danh mục'}
              />
            </div>

            {!isCashWallet && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>
                  {newTx.type === 'income' ? 'Người hưởng thụ / Người trả (Tùy chọn)' : 'Người hưởng thụ / Người trả (Bắt buộc) *'}
                </label>
                <div
                  onClick={() => {
                    setTargetModalForPayee('new');
                    setIsPayeeModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    background: 'var(--bg-color)',
                    color: 'var(--text-main)',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{newTx.payee_id ? payees.find(p => p.id === newTx.payee_id)?.payee_name || 'Đã chọn' : 'Chọn người thụ hưởng'}</span>
                  <span style={{ color: '#718EBF', fontSize: '12px' }}>▼</span>
                </div>
              </div>
            )}



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
                  color: '#718EBF',
                  transition: 'all 0.2s ease',
                  marginBottom: newTx.attachments && newTx.attachments.length > 0 ? '12px' : '0'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#1814F3'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div>{t('click_to_upload') || 'Nhấn để tải lên ảnh hóa đơn (Có thể chọn nhiều)'}</div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple style={{ display: 'none' }} />

              {newTx.attachments && newTx.attachments.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', background: 'var(--bg-color)', padding: '10px', borderRadius: '12px' }}>
                  {newTx.attachments.map((file: File, index: number) => {
                    const previewUrl = URL.createObjectURL(file);
                    return (
                      <div key={index} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--card-bg)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <img src={previewUrl} alt={file.name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-main)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewTx((prev: any) => ({
                              ...prev,
                              attachments: prev.attachments.filter((_: any, i: number) => i !== index)
                            }));
                          }}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'rgba(254, 92, 115, 0.9)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            lineHeight: 1,
                            fontWeight: 'bold'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
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
                <input
                  type="text"
                  value={editingRecurringTx.amount}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    const formattedValue = rawValue ? parseInt(rawValue, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '';
                    setEditingRecurringTx({ ...editingRecurringTx, amount: formattedValue });
                  }}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Loại *</label>
                <select value={editingRecurringTx.type} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, type: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  <option value="expense">Chi tiêu</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ví *</label>
                <select value={editingRecurringTx.wallet_id} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, wallet_id: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  {wallets.filter(w => w.type !== 'cash').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Người hưởng thụ *</label>
                <div
                  onClick={() => {
                    setTargetModalForPayee('edit_recurring');
                    setIsPayeeModalOpen(true);
                  }}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{editingRecurringTx.payee_id ? payees.find(p => p.id === editingRecurringTx.payee_id)?.payee_name || 'Đã chọn' : 'Chọn người thụ hưởng'}</span>
                  <span style={{ color: '#718EBF', fontSize: '12px' }}>▼</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ngày bắt đầu *</label>
                <input type="datetime-local" value={editingRecurringTx.start_date} onChange={e => setEditingRecurringTx({ ...editingRecurringTx, start_date: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '15px', background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Danh mục thông minh
                  {isClassifyingRecurring && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1814F3', fontWeight: '600' }}>
                      <span className="ai-pulse-dot"></span> Đang phân tích...
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => runManualClassification('recurring')}
                  disabled={isClassifyingRecurring || (!editingRecurringTx.title && !editingRecurringTx.notes)}
                  style={{
                    background: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(138, 35, 135, 0.25)',
                    opacity: (!editingRecurringTx.title && !editingRecurringTx.notes) ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  Quét AI 🔮
                </button>
              </div>
              <CategoryPicker
                value={editingRecurringTx.category_id}
                onChange={(id) => setEditingRecurringTx({ ...editingRecurringTx, category_id: id })}
                type="expense"
                categories={categories}
                placeholder="Chọn danh mục"
              />
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
      {isTransferDetailModalOpen && viewingTransferTx && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setIsTransferDetailModalOpen(false)}>
          <div style={{ background: 'var(--card-bg)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-main)', fontWeight: '700' }}>Chi tiết chuyển tiền</h2>
              <button onClick={() => setIsTransferDetailModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Loại giao dịch</span>
                <span style={{ fontWeight: '600' }}>🔄 Chuyển tiền nội bộ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Từ ví</span>
                <span style={{ fontWeight: '600' }}>{viewingTransferTx.from_wallet_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Đến ví</span>
                <span style={{ fontWeight: '600' }}>{viewingTransferTx.to_wallet_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Số tiền chuyển</span>
                <span style={{ fontWeight: '700', fontSize: '16px', color: '#1814F3' }}>
                  {formatCurrency(viewingTransferTx.amount || 0, viewingTransferTx.currency_code || 'VND')}
                </span>
              </div>
              {(viewingTransferTx.fee || viewingTransferTx.fee_amount) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Phí giao dịch</span>
                  <span style={{ fontWeight: '600', color: '#FE5C73' }}>
                    -{formatCurrency(viewingTransferTx.fee || viewingTransferTx.fee_amount || 0, viewingTransferTx.currency_code || 'VND')}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Ngày thực hiện</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '14px' }}>
                    {parseSafeDate(viewingTransferTx.date || viewingTransferTx.created_at).toLocaleDateString('vi-VN')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                    {parseSafeDate(viewingTransferTx.date || viewingTransferTx.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              {(viewingTransferTx.notes || viewingTransferTx.description) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Ghi chú / Mô tả</span>
                  <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '12px', fontSize: '14px', fontStyle: 'italic' }}>
                    {viewingTransferTx.notes || viewingTransferTx.description}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#FE5C73',
                  borderRadius: '12px',
                  border: '1px solid #FFE2E5',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '15px',
                  transition: 'all 0.2s'
                }}
                onClick={async () => {
                  if (viewingTransferTx && viewingTransferTx.id) {
                    setIsTransferDetailModalOpen(false);
                    await handleDelete(viewingTransferTx.id);
                  }
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
                Xóa giao dịch
              </button>
              <button style={{ padding: '12px 24px', background: '#1814F3', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', transition: 'background 0.2s' }} onClick={() => setIsTransferDetailModalOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

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
                <span style={{ fontWeight: '600' }}>{parseNotesAndTitle(viewingRuleTx.title || viewingRuleTx.description || viewingRuleTx.name, viewingRuleTx.notes, viewingRuleTx.payee).displayTitle}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Số tiền</span>
                <span style={{ fontWeight: '600', color: viewingRuleTx.type === 'income' ? '#16DBCC' : '#FE5C73' }}>
                  {viewingRuleTx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(viewingRuleTx.amount)), viewingRuleTx.currency_code || viewingRuleTx.wallet?.currency_code || 'VND')}
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
                <span style={{ fontWeight: '600' }}>{viewingRuleTx.start_date ? parseSafeDate(viewingRuleTx.start_date).toLocaleDateString('vi-VN') : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Lần chạy tiếp theo</span>
                <span style={{ fontWeight: '600', textAlign: 'right' }}>
                  <div>{viewingRuleTx.next_run_at ? parseSafeDate(viewingRuleTx.next_run_at).toLocaleDateString('vi-VN') : '-'}</div>
                  {viewingRuleTx.next_run_at && <div style={{ fontSize: '13px', color: '#718EBF', marginTop: '4px' }}>{parseSafeDate(viewingRuleTx.next_run_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Ngày kết thúc</span>
                <span style={{ fontWeight: '600' }}>{viewingRuleTx.end_at ? parseSafeDate(viewingRuleTx.end_at).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
              </div>
              {parseNotesAndTitle(viewingRuleTx.title || viewingRuleTx.description || viewingRuleTx.name, viewingRuleTx.notes, viewingRuleTx.payee).displayNotes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Ghi chú</span>
                  <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '12px', fontSize: '14px', fontStyle: 'italic' }}>
                    {parseNotesAndTitle(viewingRuleTx.title || viewingRuleTx.description || viewingRuleTx.name, viewingRuleTx.notes, viewingRuleTx.payee).displayNotes}
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
            <style>{`
              @keyframes pulse-stub { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
              .stub-skeleton { height: 20px; background: #E8ECEF; border-radius: 4px; animation: pulse-stub 1.5s ease-in-out infinite; }
            `}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-main)', fontWeight: '700' }}>Chi tiết giao dịch</h2>
              <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#718EBF' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Tên giao dịch</span>
                <span style={{ fontWeight: '600' }}>
                  {viewingTx.isStub && !viewingTx.title ? <div className="stub-skeleton" style={{ width: '150px' }} /> : parseNotesAndTitle(viewingTx.title, viewingTx.notes, viewingTx.payee).displayTitle}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Số tiền</span>
                <span style={{ fontWeight: '600', color: viewingTx.type === 'income' ? '#16DBCC' : '#FE5C73' }}>
                  {viewingTx.isStub && !viewingTx.amount ? <div className="stub-skeleton" style={{ width: '100px' }} /> : (viewingTx.type === 'income' ? '+' : '-') + Math.round(Number(viewingTx.amount)).toLocaleString('vi-VN') + '₫'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Loại</span>
                <span style={{ fontWeight: '600' }}>
                  {viewingTx.isStub && !viewingTx.title ? <div className="stub-skeleton" style={{ width: '80px' }} /> : (viewingTx.type === 'income' ? 'Thu nhập' : 'Chi tiêu')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Ví</span>
                <span style={{ fontWeight: '600' }}>
                  {viewingTx.isStub ? <div className="stub-skeleton" style={{ width: '120px' }} /> : (viewingTx.wallet?.name || viewingTx.wallet?.wallet_name || '-')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Danh mục</span>
                <span style={{ fontWeight: '600' }}>
                  {viewingTx.isStub ? <div className="stub-skeleton" style={{ width: '140px' }} /> : (viewingTx.category?.name || '-')}
                </span>
              </div>
              {viewingTx.payee && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Người hưởng thụ</span>
                  <span style={{ fontWeight: '600' }}>{viewingTx.payee.payee_name || viewingTx.payee.name} ({viewingTx.payee.identifier})</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: '#718EBF', fontWeight: '500' }}>Ngày giao dịch</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '14px' }}>
                    {parseSafeDate(viewingTx.transaction_date).toLocaleDateString('vi-VN')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                    {parseSafeDate(viewingTx.transaction_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              {viewingTx.isStub ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Ghi chú</span>
                  <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '12px' }}>
                    <div className="stub-skeleton" style={{ width: '100%', marginBottom: '8px' }} />
                    <div className="stub-skeleton" style={{ width: '60%' }} />
                  </div>
                </div>
              ) : parseNotesAndTitle(viewingTx.title, viewingTx.notes, viewingTx.payee).displayNotes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Ghi chú</span>
                  <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '12px', fontSize: '14px', fontStyle: 'italic' }}>
                    {parseNotesAndTitle(viewingTx.title, viewingTx.notes, viewingTx.payee).displayNotes}
                  </div>
                </div>
              )}
              {((viewingTx.attachments && viewingTx.attachments.length > 0) || viewingTx.attachment_url) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ color: '#718EBF', fontWeight: '500' }}>Ảnh hóa đơn</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', background: 'var(--bg-color)', borderRadius: '12px', padding: '12px' }}>
                    {viewingTx.attachment_url && (!viewingTx.attachments || !viewingTx.attachments.some((att: any) => att.file_url === viewingTx.attachment_url)) && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                        <img
                          src={viewingTx.attachment_url}
                          alt="Receipt"
                          style={{ width: '100%', height: '100px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <a
                          href={viewingTx.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#1814F3', textDecoration: 'none', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          Xem ảnh đầy đủ ↗
                        </a>
                      </div>
                    )}
                    {viewingTx.attachments && viewingTx.attachments.map((att: any, idx: number) => (
                      <div key={att.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                        <img
                          src={att.file_url}
                          alt={`Receipt ${idx + 1}`}
                          style={{ width: '100%', height: '100px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <a
                          href={att.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#1814F3', textDecoration: 'none', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          Xem ảnh đầy đủ ↗
                        </a>
                      </div>
                    ))}
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
                <input
                  type="text"
                  value={editingTx.amount}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    const formattedValue = rawValue ? parseInt(rawValue, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '';
                    setEditingTx({ ...editingTx, amount: formattedValue });
                  }}
                  placeholder={t('tx_amount_placeholder')}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Loại *</label>
                <select value={editingTx.type} onChange={e => setEditingTx({ ...editingTx, type: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  <option value="expense">Chi tiêu</option>
                  <option value="income">Thu nhập</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ví *</label>
                <select value={editingTx.wallet_id} onChange={e => setEditingTx({ ...editingTx, wallet_id: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ngày giao dịch *</label>
                <input type="datetime-local" value={editingTx.transaction_date} onChange={e => setEditingTx({ ...editingTx, transaction_date: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '15px', background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Danh mục thông minh
                  {isClassifyingEdit && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1814F3', fontWeight: '600' }}>
                      <span className="ai-pulse-dot"></span> Đang phân tích...
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => runManualClassification('edit')}
                  disabled={isClassifyingEdit || (!editingTx.title && !editingTx.notes)}
                  style={{
                    background: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(138, 35, 135, 0.25)',
                    opacity: (!editingTx.title && !editingTx.notes) ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  Quét AI 🔮
                </button>
              </div>
              <CategoryPicker
                value={editingTx.category_id}
                onChange={(id) => setEditingTx({ ...editingTx, category_id: id })}
                type={!isEditCashWallet ? 'expense' : editingTx.type}
                categories={categories}
                tCategory={tCategory}
                placeholder={t('select_category') || 'Chọn danh mục'}
              />
            </div>

            {!isEditCashWallet && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>
                  {editingTx.type === 'income' ? 'Người hưởng thụ / Người trả (Tùy chọn)' : 'Người hưởng thụ / Người trả (Bắt buộc) *'}
                </label>
                <div
                  onClick={() => {
                    setTargetModalForPayee('edit');
                    setIsPayeeModalOpen(true);
                  }}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{editingTx.payee_id ? payees.find(p => p.id === editingTx.payee_id)?.payee_name || 'Đã chọn' : 'Chọn người thụ hưởng'}</span>
                  <span style={{ color: '#718EBF', fontSize: '12px' }}>▼</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>{t('notes')}</label>
              <textarea value={editingTx.notes} onChange={e => setEditingTx({ ...editingTx, notes: e.target.value })} placeholder={t('notes_placeholder') || 'Thêm ghi chú...'} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px', minHeight: '80px', resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ảnh hóa đơn</label>

              {/* Existing attachments list */}
              {editingTx.existing_attachments && editingTx.existing_attachments.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '13px', color: '#718EBF', marginBottom: '6px' }}>Ảnh hóa đơn hiện tại:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', background: 'var(--bg-color)', padding: '10px', borderRadius: '12px' }}>
                    {editingTx.existing_attachments.map((att: any, index: number) => (
                      <div key={att.id || index} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--card-bg)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <img src={att.file_url} alt="Current attachment" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTx((prev: any) => ({
                              ...prev,
                              existing_attachments: prev.existing_attachments.filter((_: any, i: number) => i !== index)
                            }));
                          }}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'rgba(254, 92, 115, 0.9)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            lineHeight: 1,
                            fontWeight: 'bold'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload section for new attachments */}
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
                  color: '#718EBF',
                  transition: 'all 0.2s ease',
                  marginBottom: editingTx.attachments && editingTx.attachments.length > 0 ? '12px' : '0'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#1814F3'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div>{t('click_to_upload') || 'Nhấn để tải lên thêm ảnh hóa đơn mới'}</div>
              </div>
              <input
                id="edit-file-input"
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const selectedFiles = Array.from(e.target.files);
                    setEditingTx((prev: any) => ({
                      ...prev,
                      attachments: [...(prev.attachments || []), ...selectedFiles]
                    }));
                  }
                }}
                accept="image/*"
                style={{ display: 'none' }}
              />

              {/* Newly added attachments list */}
              {editingTx.attachments && editingTx.attachments.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ fontSize: '13px', color: '#718EBF', marginBottom: '6px' }}>Ảnh hóa đơn mới thêm:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', background: 'var(--bg-color)', padding: '10px', borderRadius: '12px' }}>
                    {editingTx.attachments.map((file: File, index: number) => {
                      const previewUrl = URL.createObjectURL(file);
                      return (
                        <div key={index} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--card-bg)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <img src={previewUrl} alt={file.name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-main)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTx((prev: any) => ({
                                ...prev,
                                attachments: prev.attachments.filter((_: any, i: number) => i !== index)
                              }));
                            }}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'rgba(254, 92, 115, 0.9)',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              lineHeight: 1,
                              fontWeight: 'bold'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warning note for backend limitation */}
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(24, 20, 243, 0.05)', borderLeft: '3px solid #1814F3', borderRadius: '4px', fontSize: '12px', color: '#718EBF', lineHeight: '1.4' }}>
                💡 <em>Lưu ý:</em> Để xóa bớt ảnh cũ, bạn bắt buộc phải giữ lại ít nhất 1 ảnh cũ hoặc tải lên ảnh mới để lưu thay đổi. Nếu xóa sạch toàn bộ ảnh đính kèm và không tải lên ảnh mới, API backend vẫn sẽ giữ nguyên các ảnh cũ.
              </div>
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
                    } else if (targetModalForPayee === 'edit') {
                      setEditingTx({ ...editingTx, payee_id: p.id });
                    } else {
                      setEditingRecurringTx({ ...editingRecurringTx, payee_id: p.id });
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

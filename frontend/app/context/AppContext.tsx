"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { walletApi, authApi, categoryApi, transactionApi, notificationApi, savingsApi } from '../lib/api';
import { useToast } from './ToastContext';
import { requestAndRegisterNotificationPermission, setupFCMForegroundListener } from '../lib/firebaseNotification';

type AppContextType = {
  isLoggedIn: boolean;
  userData: any | null;
  login: (data?: any) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateUserPreference: (pref: any) => void;
  updateUserProfile: (profile: any) => void;
  transactions: any[];
  isLoadingTransactions: boolean;
  fetchTransactions: (params?: any) => Promise<any>;
  createTransaction: (formData: FormData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Quản lý Ví
  wallets: any[];
  isLoadingWallets: boolean;
  fetchWallets: () => Promise<void>;
  createWallet: (data: any) => Promise<void>;
  updateWallet: (id: string, data: any) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;

  // Quản lý Danh mục
  categories: any[];
  isLoadingCategories: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (data: any) => Promise<void>;
  updateCategory: (id: string, data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Thông báo chưa đọc
  hasUnreadNotifications: boolean;
  unreadNotificationsCount: number;
  fetchUnreadNotificationsCount: () => Promise<void>;
  setHasUnreadNotifications: (val: boolean) => void;
  setUnreadNotificationsCount: (val: number) => void;
  createSystemNotification: (title: string, content: string, type?: string) => void;
};

const APP_CACHE_VERSION = '1.0.2';
const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const fcmCleanupRef = React.useRef<(() => void) | undefined>(undefined);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Warm up notification state from cache if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let combined = [];
      const localCached = localStorage.getItem('local_notifications');
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached);
          if (Array.isArray(parsed)) combined.push(...parsed);
        } catch (e) { }
      }
      const cachedNotifs = localStorage.getItem('cached_notifications');
      if (cachedNotifs) {
        try {
          const parsed = JSON.parse(cachedNotifs);
          if (Array.isArray(parsed)) combined.push(...parsed);
        } catch (e) { }
      }
      const isErrorNotif = (n: any) => {
        const titleLower = (n.title || '').toLowerCase();
        const contentLower = (n.content || '').toLowerCase();
        return titleLower.includes('lỗi') || titleLower.includes('thất bại') || titleLower.includes('không thành công') ||
          contentLower.includes('lỗi') || contentLower.includes('thất bại') || contentLower.includes('không thành công') || (n.type && n.type.toLowerCase().includes('error'));
      };
      combined = combined.filter((n: any) => !isErrorNotif(n));

      const unreadList = combined.filter((n: any) => n.read_at === null);
      setUnreadNotificationsCount(unreadList.length);
      setHasUnreadNotifications(unreadList.length > 0);
    }
  }, []);

  const isErrorNotif = (n: any) => {
    const titleLower = (n.title || '').toLowerCase();
    const contentLower = (n.content || '').toLowerCase();
    return titleLower.includes('lỗi') || titleLower.includes('thất bại') || titleLower.includes('không thành công') ||
      contentLower.includes('lỗi') || contentLower.includes('thất bại') || contentLower.includes('không thành công') || (n.type && n.type.toLowerCase().includes('error'));
  };

  const fetchUnreadNotificationsCount = async () => {
    if (!localStorage.getItem('access_token')) return;
    try {
      let totalUnread = 0;
      let currentPage = 1;
      let lastPage = 1;
      let firstPageList: any[] = [];

      // Duyệt qua các trang để đếm chính xác tổng unread
      // Dừng sớm nếu gặp trang mà tất cả items đã đọc (vì sorted by created_at desc)
      while (currentPage <= lastPage) {
        const res = await notificationApi.getAll(currentPage);
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);

        if (currentPage === 1) {
          firstPageList = list;
          lastPage = res.pagination?.last_page || 1;
        }

        // Đếm unread trên trang hiện tại (bỏ qua thông báo lỗi)
        const validItems = list.filter((n: any) => !isErrorNotif(n));
        const unreadOnPage = validItems.filter((n: any) => n.read_at === null).length;
        totalUnread += unreadOnPage;

        // Dừng sớm: nếu trang này không có item nào unread → các trang sau cũng vậy
        if (unreadOnPage === 0 && currentPage > 1) break;

        // Tự động xóa thông báo lỗi khỏi DB
        const errorNotifs = list.filter((n: any) => isErrorNotif(n));
        errorNotifs.forEach((n: any) => {
          notificationApi.delete(n.id).catch(() => { });
        });

        currentPage++;
      }

      // Cộng thêm local notifications chưa đọc
      let localNotifs: any[] = [];
      try { localNotifs = JSON.parse(localStorage.getItem('local_notifications') || '[]'); } catch (e) { }
      const localUnread = localNotifs.filter((n: any) => !isErrorNotif(n) && n.read_at === null).length;
      totalUnread += localUnread;

      setUnreadNotificationsCount(totalUnread);
      setHasUnreadNotifications(totalUnread > 0);
      localStorage.setItem('cached_notifications', JSON.stringify(firstPageList.filter((n: any) => !isErrorNotif(n))));
    } catch (e) { }
  };

  const createSystemNotification = (title: string, content: string, type: string = 'info') => {
    const newNotif = {
      id: 'local_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title,
      content,
      type: type === 'warning' ? 'App\\Notifications\\BudgetWarningNotification' : 'App\\Notifications\\SystemNotification',
      read_at: null,
      created_at: new Date().toISOString(),
      metadata: {}
    };

    let localNotifs: any[] = [];
    if (typeof window !== 'undefined') {
      try { localNotifs = JSON.parse(localStorage.getItem('local_notifications') || '[]'); } catch (e) { }
      localNotifs.unshift(newNotif);
      localStorage.setItem('local_notifications', JSON.stringify(localNotifs));
    }

    setUnreadNotificationsCount(prev => prev + 1);
    setHasUnreadNotifications(true);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentVersion = localStorage.getItem('app_cache_version');
      if (currentVersion !== APP_CACHE_VERSION) {
        localStorage.removeItem('cached_wallets');
        localStorage.removeItem('cached_categories');
        localStorage.removeItem('cached_transactions');
        localStorage.removeItem('local_notifications');
        localStorage.setItem('app_cache_version', APP_CACHE_VERSION);
      }
    }

    const savedLogin = localStorage.getItem('isLoggedIn');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);

      // Warm up cache from localStorage to prevent wait time/blank pages
      const cachedWallets = localStorage.getItem('cached_wallets');
      const cachedCategories = localStorage.getItem('cached_categories');
      const cachedTransactions = localStorage.getItem('cached_transactions');

      if (cachedWallets) {
        try {
          const parsed = JSON.parse(cachedWallets);
          if (Array.isArray(parsed)) setWallets(parsed);
        } catch (e) { }
      }
      if (cachedCategories) {
        try {
          const parsed = JSON.parse(cachedCategories);
          if (Array.isArray(parsed)) setCategories(parsed);
        } catch (e) { }
      }
      if (cachedTransactions) {
        try {
          const parsed = JSON.parse(cachedTransactions);
          if (Array.isArray(parsed)) setTransactions(parsed);
        } catch (e) { }
      }

      fetchWallets();
      fetchCategories();
      fetchTransactions();
      fetchUnreadNotificationsCount();
      requestAndRegisterNotificationPermission();
      checkGlobalAutoSave();

      // Đăng ký FCM Foreground Listener để cập nhật realtime khi nhận push notification
      fcmCleanupRef.current = setupFCMForegroundListener((payload) => {
        console.log('[AppContext] FCM foreground message → refreshing notification count & data');
        // Cập nhật notification count realtime
        fetchUnreadNotificationsCount();
        // Cập nhật ví & giao dịch nếu có biến động số dư hoặc giao dịch định kỳ
        fetchWallets();
        fetchTransactions();
      });
    }
    const savedUser = localStorage.getItem('user_data');
    if (savedUser) {
      try {
        setUserData(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user_data from localStorage:', e);
        localStorage.removeItem('user_data');
      }
    }

    // Global listener for 401 errors
    const handleUnauthorized = () => {
      logout();
      window.location.href = '/login';
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
      // Cleanup FCM foreground listener khi unmount
      if (fcmCleanupRef.current) {
        fcmCleanupRef.current();
        fcmCleanupRef.current = undefined;
      }
    };
  }, []);

  const updateUserPreference = (pref: any) => {
    setUserData((prev: any) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        preference: {
          ...(prev.preference || {}),
          ...pref
        }
      };
      localStorage.setItem('user_data', JSON.stringify(updated));
      return updated;
    });
  };

  const updateUserProfile = (profile: any) => {
    setUserData((prev: any) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        profile: {
          ...(prev.profile || {}),
          ...profile
        }
      };
      localStorage.setItem('user_data', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchTransactions = async (params: any = {}) => {
    if (!localStorage.getItem('access_token')) return;

    // Only set loading if no filters are present and we have no cached transactions
    const isFiltered = Object.keys(params).length > 0;
    const hasCache = transactions.length > 0 || localStorage.getItem('cached_transactions');
    if (!isFiltered && !hasCache) {
      setIsLoadingTransactions(true);
    }

    try {
      // Fix: Tăng per_page lên 500 để cache sẵn nhiều giao dịch cũ, giúp ấn thông báo mở chi tiết siêu nhanh
      const fetchParams = Object.keys(params).length === 0 ? { per_page: 500 } : params;
      const response = await transactionApi.getAll(fetchParams);
      const data = response.data?.data || response.data || [];

      // Update state and cache for default transactions list
      if (!isFiltered) {
        setTransactions(data);
        localStorage.setItem('cached_transactions', JSON.stringify(data));
      } else {
        setTransactions(data);
      }
      return response.data;
    } catch (error: any) {
      if (error.message !== 'Refresh token failed' && !error.message?.includes('Hết phiên đăng nhập')) {
        console.error("Lấy danh sách giao dịch thất bại:", error);
      }
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const createTransaction = async (formData: FormData) => {
    const res = await transactionApi.create(formData);
    await Promise.all([
      fetchTransactions(),
      fetchWallets(),
      fetchUnreadNotificationsCount()
    ]);

    let aiAlertMessage = res?.ai_alert;

    // GIẢ LẬP CẢNH BÁO AI (Dành cho việc test local hoặc trình diễn đồ án khi chưa deploy API)
    if (!aiAlertMessage) {
      const type = formData.get('type');
      const amountStr = formData.get('amount');
      const walletId = formData.get('wallet_id');

      if (type === 'expense' && amountStr && walletId) {
        const amount = parseFloat(amountStr as string);
        const selectedWallet = wallets.find((w: any) => w.id === walletId);

        // Nếu ví tiêu là ví Tiền mặt (cash)
        if (selectedWallet && (selectedWallet.type === 'cash' || selectedWallet.name.toLowerCase().includes('tiền mặt'))) {
          // Tính toán số dư giả lập sau giao dịch
          const currentBalance = parseFloat(selectedWallet.available_balance || 0) - amount;

          // Giả lập mức thói quen hàng ngày là 500,000 VND
          if (currentBalance < 500000) {
            const mockAlerts = [
              `🤖 Trợ lý AI: Bạn vừa chi tiêu ${amount.toLocaleString('vi-VN')} VND. Số dư ví Tiền mặt hiện tại chỉ còn ${currentBalance.toLocaleString('vi-VN')} VND, thấp hơn mức thói quen chi tiêu hàng ngày của bạn (500,000 VND). Hãy rút thêm tiền mặt nhé! 💸`,
              `🤖 Cảnh báo AI: Số dư ví Tiền mặt đang xuống mức thấp (${currentBalance.toLocaleString('vi-VN')} VND) so với thói quen chi dùng hàng ngày của bạn. Hãy cân nhắc tiết kiệm hoặc bổ sung ví nhé! 💳`,
              `🤖 Trợ lý tài chính: Ví Tiền mặt chỉ còn lại ${currentBalance.toLocaleString('vi-VN')} VND. Thói quen hàng ngày của bạn cần dùng đến 500,000 VND tiền mặt. Nhớ đi rút tiền mặt khi cần nhé! 🌟`
            ];
            // Lấy ngẫu nhiên câu thông báo để tăng tính sinh động
            aiAlertMessage = mockAlerts[Math.floor(Math.random() * mockAlerts.length)];
          }
        }
      }
    }

    if (aiAlertMessage) {
      toast.warning(aiAlertMessage);
    }
  };

  const deleteTransaction = async (id: string) => {
    await transactionApi.delete(id);
    await Promise.all([
      fetchTransactions(),
      fetchWallets(),
      fetchUnreadNotificationsCount()
    ]);
  };

  const fetchWallets = async () => {
    if (!localStorage.getItem('access_token')) return;

    // Skip visible loading if cached wallets already exist
    const hasCache = wallets.length > 0 || localStorage.getItem('cached_wallets');
    if (!hasCache) {
      setIsLoadingWallets(true);
    }

    try {
      const response = await walletApi.getAll();
      const data = response.data || [];
      setWallets(data);
      localStorage.setItem('cached_wallets', JSON.stringify(data));
    } catch (error: any) {
      if (error.message !== 'Refresh token failed' && !error.message?.includes('Hết phiên đăng nhập')) {
        console.error("Lấy danh sách ví thất bại:", error);
      }
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const isFrequencyDue = (lastRun: string | null, frequency: string): boolean => {
    if (!lastRun) return true;
    const lastRunDate = new Date(lastRun);
    const today = new Date();
    
    lastRunDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - lastRunDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (frequency === 'daily') {
      return diffDays >= 1;
    }
    if (frequency === 'weekly') {
      return diffDays >= 7;
    }
    if (frequency === 'monthly') {
      return diffDays >= 30;
    }
    return false;
  };

  const checkGlobalAutoSave = async () => {
    if (!localStorage.getItem('access_token')) return;
    try {
      const response = await savingsApi.getAll();
      if (response.status === 'success') {
        const goals = response.data || [];
        const todayStr = new Date().toISOString().split('T')[0];
        let hasRunAny = false;

        for (const goal of goals) {
          const currentAmount = parseFloat(goal.current_amount || '0');
          const targetAmount = parseFloat(goal.target_amount || '0');
          if (goal.status === 'completed' || currentAmount >= targetAmount) {
            continue;
          }

          let config: any = null;
          let frequency = 'daily';

          if (goal.auto_save_frequency && goal.source_wallet_id && parseFloat(goal.auto_save_amount) > 0) {
            frequency = goal.auto_save_frequency;
            config = {
              enabled: true,
              amount: parseFloat(goal.auto_save_amount),
              source_wallet_id: goal.source_wallet_id,
            };
          } else {
            const stored = localStorage.getItem(`local_autosave_${goal.id}`);
            if (stored) {
              try {
                config = JSON.parse(stored);
                frequency = 'daily';
              } catch (e) {}
            }
          }

          if (config && config.enabled && config.source_wallet_id && config.amount > 0) {
            const lastRunKey = `global_autosave_lastrun_${goal.id}`;
            const lastRun = localStorage.getItem(lastRunKey) || config.last_run;
            
            if (isFrequencyDue(lastRun, frequency)) {
              console.log(`[GlobalAutoSave] Running daily auto-save for goal ${goal.id}: ${config.amount} VND`);
              try {
                const res = await savingsApi.deposit(goal.id, {
                  amount: config.amount,
                  source_wallet_id: config.source_wallet_id,
                  notes: 'Trích nạp hàng ngày tự động (Auto-Save)'
                });
                if (res.status === 'success') {
                  localStorage.setItem(lastRunKey, todayStr);
                  if (localStorage.getItem(`local_autosave_${goal.id}`)) {
                    config.last_run = todayStr;
                    localStorage.setItem(`local_autosave_${goal.id}`, JSON.stringify(config));
                  }
                  hasRunAny = true;
                  console.log(`[GlobalAutoSave] Auto-save executed for goal ${goal.name}`);
                }
              } catch (err) {
                console.error(`[GlobalAutoSave] Failed for goal ${goal.id}:`, err);
              }
            }
          }
        }
        
        if (hasRunAny) {
          fetchWallets();
          fetchTransactions();
        }
      }
    } catch (e) {
      console.error('[GlobalAutoSave] Error during global auto-save check:', e);
    }
  };

  const createWallet = async (data: any) => {
    await walletApi.create(data);
    await fetchWallets();
  };

  const updateWallet = async (id: string, data: any) => {
    await walletApi.update(id, data);
    await fetchWallets();
  };

  const deleteWallet = async (id: string) => {
    await walletApi.delete(id);
    await fetchWallets();
  };

  const fetchCategories = async () => {
    if (!localStorage.getItem('access_token')) return;

    // Skip visible loading if cached categories already exist
    const hasCache = categories.length > 0 || localStorage.getItem('cached_categories');
    if (!hasCache) {
      setIsLoadingCategories(true);
    }

    try {
      const response = await categoryApi.getAll();
      const data = response.data || [];
      setCategories(data);
      localStorage.setItem('cached_categories', JSON.stringify(data));
    } catch (error: any) {
      if (error.message !== 'Refresh token failed' && !error.message?.includes('Hết phiên đăng nhập')) {
        console.error("Lấy danh sách danh mục thất bại:", error);
      }
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const createCategory = async (data: any) => {
    await categoryApi.create(data);
    await fetchCategories();
  };

  const updateCategory = async (id: string, data: any) => {
    await categoryApi.update(id, data);
    await fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    await categoryApi.delete(id);
    await fetchCategories();
  };

  const login = (data?: any) => {
    // Purge previous user cache and reset states first to avoid data exposure
    if (typeof window !== 'undefined') {
      const keysToKeep = ['app_lang', 'app-theme', 'sidebar_collapsed'];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key) && !key.startsWith('challenge_days_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    setUserData(null);
    setWallets([]);
    setCategories([]);
    setTransactions([]);
    setHasUnreadNotifications(false);
    setUnreadNotificationsCount(0);

    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');

    if (data?.access_token) {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      localStorage.setItem('user_data', JSON.stringify(data.data));
      setUserData(data.data);
    }
    fetchWallets();
    fetchCategories();
    fetchUnreadNotificationsCount();
    requestAndRegisterNotificationPermission();
    checkGlobalAutoSave();

    // Đăng ký FCM foreground listener cho user mới login
    fcmCleanupRef.current = setupFCMForegroundListener((payload) => {
      fetchUnreadNotificationsCount();
      fetchWallets();
      fetchTransactions();
    });
  };

  const logout = async () => {
    const fcmToken = typeof window !== 'undefined' ? localStorage.getItem('fcm_device_token') : null;
    if (fcmToken) {
      try {
        await authApi.unregisterDeviceToken(fcmToken);
      } catch (e) {
        console.error('Unregister device token error:', e);
      }
      localStorage.removeItem('fcm_device_token');
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      try {
        await authApi.logout();
      } catch (e: any) {
        if (e.message !== 'Refresh token failed' && !e.message?.includes('Hết phiên đăng nhập')) {
          console.error('Logout error:', e);
        }
      }
    }
    setIsLoggedIn(false);
    if (typeof window !== 'undefined') {
      const keysToKeep = ['app_lang', 'app-theme', 'sidebar_collapsed'];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key) && !key.startsWith('challenge_days_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      localStorage.setItem('isLoggedIn', 'false');
    }
    setUserData(null);
    setWallets([]);
    setCategories([]);
    setTransactions([]);
    setHasUnreadNotifications(false);
    setUnreadNotificationsCount(0);
  };

  const logoutAll = async () => {
    try {
      const uId = userData?.user_id || userData?.id;
      await authApi.logoutAll(uId);
      toast.success('Đã đăng xuất và thu hồi phiên trên tất cả thiết bị!');
      await logout();
    } catch (e: any) {
      toast.error('Lỗi: ' + e.message);
    }
  };

  const addTransaction = (tx: any) => {
    const newTxns = [tx, ...transactions];
    setTransactions(newTxns);
    localStorage.setItem('transactions', JSON.stringify(newTxns));
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn, userData, login, logout, logoutAll, updateUserPreference, updateUserProfile,
      transactions, isLoadingTransactions, fetchTransactions, createTransaction, deleteTransaction,
      wallets, isLoadingWallets, fetchWallets, createWallet, updateWallet, deleteWallet,
      categories, isLoadingCategories, fetchCategories, createCategory, updateCategory, deleteCategory,
      hasUnreadNotifications, unreadNotificationsCount, fetchUnreadNotificationsCount,
      setHasUnreadNotifications, setUnreadNotificationsCount, createSystemNotification
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}


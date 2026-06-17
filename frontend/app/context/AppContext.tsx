"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { walletApi, authApi, categoryApi, transactionApi } from '../lib/api';
import { requestAndRegisterNotificationPermission } from '../lib/firebaseNotification';

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
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    const savedLogin = localStorage.getItem('isLoggedIn');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
      
      // Warm up cache from localStorage to prevent wait time/blank pages
      const cachedWallets = localStorage.getItem('cached_wallets');
      const cachedCategories = localStorage.getItem('cached_categories');
      const cachedTransactions = localStorage.getItem('cached_transactions');
      
      if (cachedWallets) {
        try { setWallets(JSON.parse(cachedWallets)); } catch (e) {}
      }
      if (cachedCategories) {
        try { setCategories(JSON.parse(cachedCategories)); } catch (e) {}
      }
      if (cachedTransactions) {
        try { setTransactions(JSON.parse(cachedTransactions)); } catch (e) {}
      }

      fetchWallets();
      fetchCategories();
      fetchTransactions();
      requestAndRegisterNotificationPermission();
    }
    const savedUser = localStorage.getItem('user_data');
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }

    // Global listener for 401 errors
    const handleUnauthorized = () => {
      logout();
      window.location.href = '/login';
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
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
      const response = await transactionApi.getAll(params);
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
    await transactionApi.create(formData);
    await Promise.all([
      fetchTransactions(),
      fetchWallets()
    ]);
  };

  const deleteTransaction = async (id: string) => {
    await transactionApi.delete(id);
    await Promise.all([
      fetchTransactions(),
      fetchWallets()
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
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    setTransactions([]);
    localStorage.removeItem('transactions');
    
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
    requestAndRegisterNotificationPermission();
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
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('cached_') || key === 'transactions')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    setUserData(null);
    setWallets([]);
    setCategories([]);
    setTransactions([]);
  };

  const logoutAll = async () => {
    try {
      const uId = userData?.user_id || userData?.id;
      await authApi.logoutAll(uId);
      alert('Đã đăng xuất và thu hồi phiên trên tất cả thiết bị!');
      await logout();
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
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
      categories, isLoadingCategories, fetchCategories, createCategory, updateCategory, deleteCategory
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


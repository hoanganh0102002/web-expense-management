"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { walletApi, transactionApi, authApi, categoryApi } from '../lib/api';

type AppContextType = {
  isLoggedIn: boolean;
  userData: any | null;
  login: (tokenOrData?: any, userData?: any) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  transactions: any[];
  fetchTransactions: (filters?: any) => Promise<void>;
  addTransaction: (tx: any) => Promise<void>;
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
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    const savedLogin = localStorage.getItem('isLoggedIn');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
      fetchWallets();
      fetchTransactions();
      fetchCategories();
    }
    const savedUser = localStorage.getItem('user_data');
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }
    const savedTxns = localStorage.getItem('transactions');
    if (savedTxns) {
      setTransactions(JSON.parse(savedTxns));
    }

    // Global listener for 401 errors
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const fetchWallets = async () => {
    if (!localStorage.getItem('access_token')) return;
    setIsLoadingWallets(true);
    try {
      const response = await walletApi.getAll();
      setWallets(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Lấy danh sách ví thất bại:", error);
      if (error.message && (error.message.includes("hết hạn") || error.message.includes("hợp lệ") || error.message.includes("chặn"))) {
        logout();
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

  const fetchTransactions = async (filters?: any) => {
    if (!localStorage.getItem('access_token')) return;
    try {
      const response = await transactionApi.getAll(filters);
      setTransactions(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Lấy danh sách giao dịch thất bại:", error);
      if (error.message && (error.message.includes("hết hạn") || error.message.includes("hợp lệ") || error.message.includes("chặn"))) {
        logout();
      }
    }
  };

  const addTransaction = async (txData: any) => {
    await transactionApi.create(txData);
    await fetchTransactions();
    await fetchWallets(); // Đồng bộ lại ví vì số dư đã thay đổi!
  };

  const deleteTransaction = async (id: string) => {
    await transactionApi.delete(id);
    await fetchTransactions();
    await fetchWallets(); // Đồng bộ lại ví vì số dư đã thay đổi!
  };

  const fetchCategories = async () => {
    if (!localStorage.getItem('access_token')) return;
    setIsLoadingCategories(true);
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data || []);
    } catch (error: any) {
      console.error("Lấy danh sách danh mục thất bại:", error);
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

  const login = (tokenOrData?: any, userData?: any) => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    setTransactions([]);
    
    if (typeof tokenOrData === 'string') {
      localStorage.setItem('access_token', tokenOrData);
      if (userData) {
        localStorage.setItem('user_data', JSON.stringify(userData));
        setUserData(userData);
      }
    } else if (tokenOrData?.access_token) {
      localStorage.setItem('access_token', tokenOrData.access_token);
      localStorage.setItem('user_data', JSON.stringify(tokenOrData.data));
      setUserData(tokenOrData.data);
    }
    fetchWallets();
    fetchTransactions();
    fetchCategories();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setIsLoggedIn(false);
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUserData(null);
    setWallets([]);
    setCategories([]);
    setTransactions([]);
    localStorage.removeItem('transactions');
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

  return (
    <AppContext.Provider value={{ 
      isLoggedIn, userData, login, logout, logoutAll, transactions, fetchTransactions, addTransaction, deleteTransaction,
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


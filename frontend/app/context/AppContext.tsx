"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { walletApi } from '../lib/api';

type AppContextType = {
  isLoggedIn: boolean;
  userData: any | null;
  login: (data?: any) => void;
  logout: () => void;
  transactions: any[];
  addTransaction: (tx: any) => void;
  
  // Quản lý Ví
  wallets: any[];
  isLoadingWallets: boolean;
  fetchWallets: () => Promise<void>;
  createWallet: (data: any) => Promise<void>;
  updateWallet: (id: string, data: any) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);

  useEffect(() => {
    const savedLogin = localStorage.getItem('isLoggedIn');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
      fetchWallets();
    }
    const savedUser = localStorage.getItem('user_data');
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }
    const savedTxns = localStorage.getItem('transactions');
    if (savedTxns) {
      setTransactions(JSON.parse(savedTxns));
    }
  }, []);

  const fetchWallets = async () => {
    if (!localStorage.getItem('access_token')) return;
    setIsLoadingWallets(true);
    try {
      const response = await walletApi.getAll();
      setWallets(response.data || []);
    } catch (error) {
      console.error("Lấy danh sách ví thất bại:", error);
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

  const login = (data?: any) => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    // Khi đăng nhập tài khoản mới, xóa dữ liệu giao dịch cũ trong localStorage
    // để đảm bảo tài khoản mới bắt đầu với dữ liệu trống (nếu chưa đồng bộ backend)
    setTransactions([]);
    localStorage.removeItem('transactions');
    
    if (data?.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_data', JSON.stringify(data.data));
      setUserData(data.data);
    }
    fetchWallets();
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUserData(null);
    setWallets([]);
    setTransactions([]);
    localStorage.removeItem('transactions');
  };

  const addTransaction = (tx: any) => {
    const newTxns = [tx, ...transactions];
    setTransactions(newTxns);
    localStorage.setItem('transactions', JSON.stringify(newTxns));
  };

  return (
    <AppContext.Provider value={{ 
      isLoggedIn, userData, login, logout, transactions, addTransaction,
      wallets, isLoadingWallets, fetchWallets, createWallet, updateWallet, deleteWallet 
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

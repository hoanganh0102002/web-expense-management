"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type AppContextType = {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  transactions: any[];
  addTransaction: (tx: any) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    // Run only on client
    const savedLogin = localStorage.getItem('isLoggedIn');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
    }
    const savedTxns = localStorage.getItem('transactions');
    if (savedTxns) {
      setTransactions(JSON.parse(savedTxns));
    } else {
      // Default transactions
      const defTxns = [
        {desc:'Grab Di chuyển',id:'#TXN001',type:'Chi tiêu',cat:'Di chuyển',date:'23/05, 08:30',amount:-45000,color:'#FE5C73',icon:'🚗'},
        {desc:'Lương tháng 5',id:'#TXN002',type:'Thu nhập',cat:'Lương',date:'22/05, 09:00',amount:12500000,color:'#16DBCC',icon:'💰'},
        {desc:'Shopee Mua sắm',id:'#TXN003',type:'Chi tiêu',cat:'Mua sắm',date:'20/05, 14:22',amount:-350000,color:'#FE5C73',icon:'🛍️'},
      ];
      setTransactions(defTxns);
    }
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('isLoggedIn', 'false');
  };

  const addTransaction = (tx: any) => {
    const newTxns = [tx, ...transactions];
    setTransactions(newTxns);
    localStorage.setItem('transactions', JSON.stringify(newTxns));
  };

  return (
    <AppContext.Provider value={{ isLoggedIn, login, logout, transactions, addTransaction }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}

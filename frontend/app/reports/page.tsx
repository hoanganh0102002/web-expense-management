"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { reportApi, transactionApi, budgetApi } from '../lib/api';
import './reports.css';


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

const renderFormatIcon = (type: 'pdf' | 'excel' | 'csv', size: number = 26) => {
  if (type === 'pdf') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M9 15h6" />
        <path d="M9 11h6" />
      </svg>
    );
  }
  if (type === 'excel') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M8 13h2v4H8z" />
        <path d="M14 13h2v4h-2z" />
      </svg>
    );
  }
  if (type === 'csv') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <circle cx="9" cy="14" r="1" />
        <circle cx="15" cy="14" r="1" />
      </svg>
    );
  }
  return null;
};

export default function Reports() {

  const { isLoggedIn, userData, categories, wallets } = useAppContext();
  const { t } = useLanguage();
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  });

  const handlePrevMonth = () => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() - 1);
    setStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    setEndDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + 1);
    setStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    setEndDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, '0')}`);
  };

  const getDisplayMonth = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const now = new Date();
    if (s.getMonth() === now.getMonth() && s.getFullYear() === now.getFullYear() && e.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) {
      return 'Tháng này';
    }
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `Tháng ${s.getMonth() + 1}/${s.getFullYear()}`;
    }
    return `${s.getDate()}/${s.getMonth() + 1} - ${e.getDate()}/${e.getMonth() + 1}`;
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const [exportHistory, setExportHistory] = useState<any[]>([]);
  
  // Momo UI States
  const [viewMode, setViewMode] = useState<'allocation' | 'trend'>('allocation');
  const [reportType, setReportType] = useState<'expense' | 'income'>('expense');
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [isLoadingTopCategories, setIsLoadingTopCategories] = useState(false);
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>({});
  
  const [currentSummary, setCurrentSummary] = useState({ income: 0, expense: 0 });
  const [prevSummary, setPrevSummary] = useState({ income: 0, expense: 0 });
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  // Trend Chart State
  const [dailyData, setDailyData] = useState<{ day: number, date: string, amount: number }[]>([]);
  const [maxDailyAmt, setMaxDailyAmt] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // List Animation State
  const [listVisible, setListVisible] = useState(false);

  // Abnormal Spending State
  const [abnormalDays, setAbnormalDays] = useState<{ day: number, date: string, amount: number, avg: number }[]>([]);

  useEffect(() => {
    setListVisible(false);
    const timer = setTimeout(() => {
      setListVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [reportType, topCategories, viewMode]);

  const formatCurrency = (val: number | string) => {
    const numericAmount = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numericAmount)) return '0';
    return new Intl.NumberFormat('vi-VN').format(numericAmount) + 'đ';
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchData = async () => {
      setIsLoadingTopCategories(true);
      try {
        const d = new Date(startDate);
        let month = d.getMonth() + 1;
        let year = d.getFullYear();
        if (isNaN(month) || isNaN(year)) {
          const now = new Date();
          month = now.getMonth() + 1;
          year = now.getFullYear();
        }

        // Prev month dates
        const prevMonthDate = new Date(year, month - 2, 1);
        const prevStartDate = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
        const prevEndDate = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

        // Fetch Summary for both months
        const [currRes, prevRes] = await Promise.all([
          reportApi.getSummary(startDate, endDate, selectedWallet || undefined).catch(() => ({ data: { income: 0, expense: 0 } })),
          reportApi.getSummary(prevStartDate, prevEndDate, selectedWallet || undefined).catch(() => ({ data: { income: 0, expense: 0 } }))
        ]);
        
        setCurrentSummary({ income: currRes.data?.income || 0, expense: currRes.data?.expense || 0 });
        setPrevSummary({ income: prevRes.data?.income || 0, expense: prevRes.data?.expense || 0 });

        // Fetch budgets
        const budgetsRes = await budgetApi.getAll(month, year).catch(() => ({ data: [] }));
        const bMap: Record<string, number> = {};
        (budgetsRes.data || []).forEach((b: any) => {
          if (b.category_id) bMap[b.category_id] = parseFloat(b.limit_amount);
        });
        setBudgetMap(bMap);

        // Fetch transactions for current month
        const txRes = await transactionApi.getAll({
          start_date: startDate,
          end_date: endDate,
          limit: 10000,
          wallet_id: selectedWallet || undefined
        }).catch(() => ({ data: [] }));

        const txs = Array.isArray(txRes.data) ? txRes.data : (txRes.data?.data || []);

        const categoryTotals: Record<string, any> = {};
        let totalVal = 0;
        
        const expenseFallbackColors = ['#FE5C73', '#FBBF24', '#A78BFA', '#F472B6', '#FB923C', '#E83E8C'];
        const incomeFallbackColors = ['#10B981', '#38BDF8', '#34D399', '#2DD4BF', '#4ADE80', '#60A5FA'];
        const fallbackColors = reportType === 'expense' ? expenseFallbackColors : incomeFallbackColors;
        let colorIdx = 0;
        
        txs.forEach((tx: any) => {
          if (tx.type !== reportType) return;
          const catId = tx.category_id || 'other';
          const amount = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
          if (amount === 0) return;

          totalVal += amount;
          if (!categoryTotals[catId]) {
            let catColor = tx.category?.color;
            if (!catColor) {
              if (catId === 'other') catColor = '#94A3B8';
              else {
                catColor = fallbackColors[colorIdx % fallbackColors.length];
                colorIdx++;
              }
            }

            categoryTotals[catId] = {
              id: catId,
              name: tx.category?.name || tx.category_name || t('other') || 'Khác',
              icon: tx.category?.icon || '📁',
              color: catColor,
              amount: 0
            };
          }
          categoryTotals[catId].amount += amount;
        });

        // Daily Data Calculation
        const dailyMap: Record<number, number> = {};
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) dailyMap[i] = 0;

        txs.forEach((tx: any) => {
          if (tx.type !== reportType) return;
          const amt = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
          if (amt === 0) return;
          let txDateStr = tx.transaction_date;
          if (!txDateStr && tx.created_at) txDateStr = tx.created_at.split('T')[0];
          
          if (txDateStr) {
            const parts = txDateStr.split('-');
            if (parts.length >= 3) {
              const day = parseInt(parts[2], 10);
              if (dailyMap[day] !== undefined) {
                dailyMap[day] += amt;
              }
            }
          }
        });

        const dailyArr = Object.keys(dailyMap).map(k => ({
          day: parseInt(k),
          date: `${String(parseInt(k)).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
          amount: dailyMap[parseInt(k)]
        }));

        setDailyData(dailyArr);
        setMaxDailyAmt(Math.max(...dailyArr.map(d => d.amount)));

        // Calculate Abnormal Days
        const dailyAvg = totalVal / daysInMonth;
        const abnormal = dailyArr.filter(d => d.amount > dailyAvg * 2 && d.amount > 0);
        abnormal.sort((a, b) => b.amount - a.amount);
        setAbnormalDays(abnormal.map(d => ({ ...d, avg: dailyAvg })));

        const topList = Object.values(categoryTotals)
          .map((cat: any) => ({
            ...cat,
            percentage: totalVal > 0 ? (cat.amount / totalVal) * 100 : 0
          }))
          .sort((a: any, b: any) => b.amount - a.amount);
          
        setTopCategories(topList);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoadingTopCategories(false);
      }
    };

    const timer = setTimeout(() => { fetchData(); }, 300);
    return () => clearTimeout(timer);
  }, [isLoggedIn, startDate, endDate, selectedWallet, reportType, t]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const history = localStorage.getItem('export_history');
      if (history) {
        setExportHistory(JSON.parse(history));
      }
    }
  }, []);

  const saveExportHistory = (name: string, type: string, size: string) => {
    const filters = { startDate, endDate, selectedCategory, selectedWallet, selectedType };
    const newRecord = {
      id: Date.now().toString(),
      name,
      date: new Date().toLocaleString('vi-VN'),
      size,
      type,
      filters
    };
    // Chỉ cần lưu 10 bản ghi gần nhất để tránh localStorage quá nặng
    const updatedHistory = [newRecord, ...exportHistory].slice(0, 10);
    localStorage.setItem('export_history', JSON.stringify(updatedHistory));
    setExportHistory(updatedHistory);
  };

  const handleReloadExport = (record: any) => {
    if (record.filters) {
      setStartDate(record.filters.startDate || '');
      setEndDate(record.filters.endDate || '');
      setSelectedCategory(record.filters.selectedCategory || '');
      setSelectedWallet(record.filters.selectedWallet || '');
      setSelectedType(record.filters.selectedType || '');
      alert('Đã áp dụng lại bộ lọc của file này. Vui lòng nhấn nút xuất báo cáo tương ứng ở phía trên!');
    }
  };

  const handleExportExcel = async () => {
    if (!isLoggedIn) return;
    setIsExportingExcel(true);
    try {
      const res = await transactionApi.getAll({ 
        start_date: startDate, 
        end_date: endDate, 
        limit: 10000,
        category_id: selectedCategory || undefined,
        wallet_id: selectedWallet || undefined,
        type: selectedType || undefined
      });
      const data = res.data || res;
      const txs = Array.isArray(data) ? data : (data.data || []);
      
      let tableHtml = `
        <html xmlns:x="urn:schemas-microsoft-com:office:excel">
          <head>
            <meta charset="utf-8">
          </head>
          <body>
            <table border="1">
              <thead>
                <tr>
                  <th width="60" style="background-color: #16DBCC; color: white;">STT</th>
                  <th width="150" style="background-color: #16DBCC; color: white;">Ngày Giao Dịch</th>
                  <th width="100" style="background-color: #16DBCC; color: white;">Giờ</th>
                  <th width="120" style="background-color: #16DBCC; color: white;">Loại</th>
                  <th width="150" style="background-color: #16DBCC; color: white;">Số Tiền</th>
                  <th width="200" style="background-color: #16DBCC; color: white;">Danh Mục</th>
                  <th width="200" style="background-color: #16DBCC; color: white;">Ví</th>
                  <th width="180" style="background-color: #16DBCC; color: white;">Chuyển Tiền Nội Bộ</th>
                  <th width="300" style="background-color: #16DBCC; color: white;">Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
      `;
      txs.forEach((t: any, index: number) => {
        let datePart = '';
        let timePart = '';
        const rawDate = t.transaction_date || t.date || '';
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            datePart = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
            timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          } else {
            datePart = rawDate;
          }
        }
        tableHtml += `
          <tr>
            <td style="text-align:center;">${index + 1}</td>
            <td style="text-align:center;">${datePart}</td>
            <td style="text-align:center;">${timePart}</td>
            <td>${t.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}</td>
            <td style="text-align:right;">${new Intl.NumberFormat('vi-VN').format(Number(t.amount) || 0)}</td>
            <td>${t.category?.name || t.category_name || ''}</td>
            <td>${t.wallet?.name || t.wallet_name || ''}</td>
            <td style="text-align:center;">${!(t.category?.name || t.category_name) ? 'x' : ''}</td>
            <td>${t.description || t.note || ''}</td>
          </tr>
        `;
      });
      tableHtml += `
              </tbody>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Giao_Dich_${startDate}_${endDate}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi xuất Excel!");
    } finally {
      const sizeBytes = 1024 * 5; 
      const sizeStr = sizeBytes > 1024 * 1024 ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : (sizeBytes / 1024).toFixed(0) + ' KB';
      
      saveExportHistory(`Giao_Dich_${startDate}_${endDate}.xls`, 'excel', sizeStr);
      setIsExportingExcel(false);
    }
  };

  const handleExportCSV = async () => {
    if (!isLoggedIn) return;
    setIsExportingCSV(true);
    try {
      const res = await transactionApi.getAll({ 
        start_date: startDate, 
        end_date: endDate, 
        limit: 10000,
        category_id: selectedCategory || undefined,
        wallet_id: selectedWallet || undefined,
        type: selectedType || undefined
      });
      const data = res.data || res;
      const txs = Array.isArray(data) ? data : (data.data || []);
      
      let csvContent = "\uFEFF"; // BOM for UTF-8
      csvContent += "STT;Ngày Giao Dịch;Giờ;Loại;Số Tiền;Danh Mục;Ví;Chuyển Tiền Nội Bộ;Ghi Chú\n";
      
      txs.forEach((t: any, index: number) => {
        let datePart = '';
        let timePart = '';
        const rawDate = t.transaction_date || t.date || '';
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            datePart = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
            timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          } else {
            datePart = rawDate;
          }
        }
        
        const type = t.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
        const amount = new Intl.NumberFormat('vi-VN').format(Number(t.amount) || 0);
        const category = t.category?.name || t.category_name || '';
        const wallet = t.wallet?.name || t.wallet_name || '';
        const isInternal = !(t.category?.name || t.category_name) ? 'x' : '';
        const note = t.description || t.note || '';

        const escapeCsv = (val: any) => {
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(';') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        csvContent += `${index + 1};${escapeCsv(datePart)};${escapeCsv(timePart)};${escapeCsv(type)};${escapeCsv(amount)};${escapeCsv(category)};${escapeCsv(wallet)};${escapeCsv(isInternal)};${escapeCsv(note)}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Giao_Dich_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi xuất CSV!");
    } finally {
      const sizeBytes = 1024 * 2; 
      const sizeStr = sizeBytes > 1024 * 1024 ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : (sizeBytes / 1024).toFixed(0) + ' KB';

      saveExportHistory(`Giao_Dich_${startDate}_${endDate}.csv`, 'csv', sizeStr);
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    if (!isLoggedIn) return;
    setIsExporting(true);
    try {
      const summaryRes = await reportApi.getSummary(startDate, endDate, selectedWallet || undefined).catch(()=>({data:{income: 0, expense: 0, net: 0}}));
      const diffDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      const groupBy = diffDays > 60 ? 'month' : 'day';
      const trendsRes = await reportApi.getTrends(startDate, endDate, groupBy).catch(()=>({data:[]}));

      // Fetch transaction list for additional details
      const txRes = await transactionApi.getAll({ 
        start_date: startDate, 
        end_date: endDate, 
        limit: 10000,
        category_id: selectedCategory || undefined,
        wallet_id: selectedWallet || undefined,
        type: selectedType || undefined
      }).catch(() => ({ data: [] }));
      const txData = txRes.data || txRes;
      const txs = Array.isArray(txData) ? txData : (txData.data || []);
         
         const container = document.createElement('div');
         container.style.padding = '40px';
         container.style.background = '#fff';
         container.style.color = '#000';
         container.style.width = '750px';
         container.style.boxSizing = 'border-box';

         const formatCurrency = (val: number | string, customCurrency?: string) => {
            const numericAmount = typeof val === 'string' ? parseFloat(val) : val;
            if (isNaN(numericAmount)) return '0';
            const currencyCode = customCurrency || userData?.preference?.currency || 'VND';
            let locale = 'vi-VN';
            if (currencyCode === 'USD') locale = 'en-US';
            else if (currencyCode === 'EUR') locale = 'de-DE';
            else if (currencyCode === 'GBP') locale = 'en-GB';
            else if (currencyCode === 'JPY') locale = 'ja-JP';
            
            return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(numericAmount);
         };

         let html = `
           <div style="text-align:center;margin-bottom:30px;">
             <h1 style="font-size:24px;margin-bottom:10px;">BÁO CÁO TỔNG HỢP THU CHI</h1>
             <p style="font-size:16px;color:#666;">Từ ${startDate} đến ${endDate}</p>
           </div>
           <table style="width:100%;border-collapse:collapse;margin-bottom:40px;font-family:sans-serif;">
             <thead>
               <tr style="background:#f4f7fe;">
                 <th style="border:1px solid #ddd;padding:12px;text-align:center;">Tổng Thu</th>
                 <th style="border:1px solid #ddd;padding:12px;text-align:center;">Tổng Chi</th>
                 <th style="border:1px solid #ddd;padding:12px;text-align:center;">Số Dư Ròng</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td style="border:1px solid #ddd;padding:12px;text-align:center;color:#16DBCC;font-weight:bold;">${formatCurrency(summaryRes.data?.income || 0)}</td>
                 <td style="border:1px solid #ddd;padding:12px;text-align:center;color:#FE5C73;font-weight:bold;">${formatCurrency(summaryRes.data?.expense || 0)}</td>
                 <td style="border:1px solid #ddd;padding:12px;text-align:center;font-weight:bold;">${formatCurrency((summaryRes.data?.income || 0) - (summaryRes.data?.expense || 0))}</td>
               </tr>
             </tbody>
           </table>
         `;
         

      // --- NEW SECTIONS ---
      // 1. Expense Allocation Donut Chart
      const expenseTxs = txs.filter((t: any) => t.type === 'expense');
      const categoryTotals: Record<string, number> = {};
      let totalExpenseAmount = 0;
      expenseTxs.forEach((t: any) => {
         const catName = t.category?.name || t.category_name || 'Khác';
         const amount = Number(t.amount) || 0;
         if (!categoryTotals[catName]) categoryTotals[catName] = 0;
         categoryTotals[catName] += amount;
         totalExpenseAmount += amount;
      });

      const categoryData = Object.keys(categoryTotals).map(name => ({
         name,
         amount: categoryTotals[name],
         percentage: totalExpenseAmount > 0 ? (categoryTotals[name] / totalExpenseAmount) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

      const colors = ['#FE5C73', '#16DBCC', '#F2C94C', '#9B51E0', '#2D9CDB', '#27AE60', '#F2994A', '#EB5757', '#BB6BD9', '#56CCF2'];
      
      let currentPercentage = 0;
      let svgCircles = '';
      const C = 2 * Math.PI * 80;
      if (categoryData.length > 0) {
         categoryData.forEach((c, i) => {
            const dashValue = (c.percentage * C) / 100;
            const gapValue = C - dashValue;
            const dashArray = `${dashValue} ${gapValue}`;
            const dashOffset = -(currentPercentage * C) / 100;
            svgCircles += `<circle cx="100" cy="100" r="80" fill="transparent" stroke="${colors[i % colors.length]}" stroke-width="30" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}"></circle>`;
            currentPercentage += c.percentage;
         });
      } else {
         svgCircles = `<circle cx="100" cy="100" r="80" fill="transparent" stroke="#f0f0f0" stroke-width="30"></circle>`;
      }

      html += `
        <div style="margin-top: 40px; page-break-before: auto;">
           <h3 style="font-family:sans-serif; margin-bottom:20px; font-size:16px; color:#333; text-transform:uppercase;">PHÂN BỔ CHI TIÊU THEO DANH MỤC</h3>
           <div style="display:flex; align-items:center; gap: 50px; margin-bottom: 40px;">
               <div style="position:relative; width: 200px; height: 200px; display:flex; align-items:center; justify-content:center;">
                   <svg width="200" height="200" viewBox="0 0 200 200" style="position:absolute; top:0; left:0; width: 200px; height: 200px; border-radius:50%; box-shadow: 0 4px 10px rgba(0,0,0,0.1); background: #fff;">
                     <g transform="rotate(-90 100 100)">
                       <circle cx="100" cy="100" r="80" fill="transparent" stroke="#f0f0f0" stroke-width="30"></circle>
                       ${svgCircles}
                     </g>
                   </svg>
                   <div style="position:relative; z-index:10; background: #fff; width: 120px; height: 120px; border-radius: 50%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                       <div style="font-size:12px; color:#666; font-family:sans-serif; margin-bottom:4px;">CHI TIÊU</div>
                       <div style="font-size:14px; font-weight:bold; font-family:sans-serif;">${formatCurrency(totalExpenseAmount)}</div>
                   </div>
               </div>
               <div style="flex:1; font-family:sans-serif;">
                   ${categoryData.map((c, i) => `
                       <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; font-size:13px;">
                           <div style="display:flex; align-items:center; gap: 10px;">
                               <div style="width:14px; height:14px; border-radius:3px; background:${colors[i % colors.length]};"></div>
                               <span style="color:#333; font-weight:500;">${c.name}</span>
                           </div>
                           <div style="color:#666;">
                               <span>${formatCurrency(c.amount)}</span>
                               <span style="margin-left:8px; display:inline-block; width:60px; text-align:right;">(${c.percentage.toFixed(1)}%)</span>
                           </div>
                       </div>
                   `).join('')}
                   ${categoryData.length === 0 ? '<div style="color:#999; font-size:14px;">Không có dữ liệu chi tiêu</div>' : ''}
               </div>
           </div>
        </div>
      `;

      // 2. Transaction List Table
      html += `
        <div style="margin-top: 40px; page-break-before: auto;">
           <h3 style="font-family:sans-serif; margin-bottom:20px; font-size:16px; color:#333; text-transform:uppercase;">DANH SÁCH GIAO DỊCH CHI TIẾT</h3>
           <table style="width:100%; border-collapse:collapse; font-family:sans-serif; font-size:11px;">
             <thead>
               <tr style="background:#E6E9F4; color:#343C6A;">
                 <th style="padding:12px 8px; text-align:left; border-bottom:2px solid #ddd;">Ngày</th>
                 <th style="padding:12px 8px; text-align:left; border-bottom:2px solid #ddd;">Tiêu đề</th>
                 <th style="padding:12px 8px; text-align:left; border-bottom:2px solid #ddd;">Danh mục</th>
                 <th style="padding:12px 8px; text-align:left; border-bottom:2px solid #ddd;">Ví</th>
                 <th style="padding:12px 8px; text-align:center; border-bottom:2px solid #ddd;">Loại</th>
                 <th style="padding:12px 8px; text-align:right; border-bottom:2px solid #ddd;">Số tiền</th>
                 <th style="padding:12px 8px; text-align:right; border-bottom:2px solid #ddd;">Quy đổi (${userData?.preference?.currency || 'VND'})</th>
               </tr>
             </thead>
             <tbody>
               ${txs.map((t: any) => {
                   let datePart = '';
                   const rawDate = t.transaction_date || t.date || '';
                   if (rawDate) {
                     const d = new Date(rawDate);
                     if (!isNaN(d.getTime())) {
                       const pad = (n: number) => String(n).padStart(2, '0');
                       datePart = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
                     } else {
                       datePart = rawDate;
                     }
                   }
                   
                   const note = t.title || t.description || t.note || '';
                   const categoryName = t.category?.name || t.category_name || 'Không phân mục';
                   const walletName = t.wallet?.name || t.wallet_name || 'Ví đã xóa';
                   const typeStr = t.type === 'income' ? 'Thu' : 'Chi';
                   
                   const originalCurrency = t.currency_code || t.wallet?.currency_code || 'VND';
                   const origAmountStr = formatCurrency(Number(t.amount) || 0, originalCurrency);

                   const convertedAmt = Number(t.amount_in_user_currency || t.amount) || 0;
                   const convertedStr = formatCurrency(convertedAmt);
                   
                   return `
                     <tr style="page-break-inside: avoid; break-inside: avoid;">
                       <td style="padding:10px 8px; border-bottom:1px solid #eee; color:#333;">${datePart}</td>
                       <td style="padding:10px 8px; border-bottom:1px solid #eee; color:#333; word-break: break-word; max-width: 250px;">${note}</td>
                       <td style="padding:10px 8px; border-bottom:1px solid #eee; color:#333;">${categoryName}</td>
                       <td style="padding:10px 8px; border-bottom:1px solid #eee; color:#333;">${walletName}</td>
                       <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:center; color:#333;">${typeStr}</td>
                       <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:right; color:#333;">${origAmountStr}</td>
                       <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:right; color:#333;">${convertedStr}</td>
                     </tr>
                   `;
               }).join('')}
               ${txs.length === 0 ? '<tr><td colspan="7" style="padding:20px; text-align:center; color:#999; border-bottom:1px solid #eee;">Không có giao dịch nào</td></tr>' : ''}
             </tbody>
           </table>
        </div>
      `;

      container.innerHTML = html;
      
      const opt = {
        margin:       0.5,
        filename:     'Bao_cao_chi_tieu_' + startDate + '_' + endDate + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'], avoid: 'tr' }
      };
      
      // @ts-ignore
      if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().set(opt).from(container).save().then(() => {
          setIsExporting(false);
          saveExportHistory(`Bao_cao_chi_tieu_${startDate}_${endDate}.pdf`, 'pdf', 'PDF File');
        });
      } else {
        alert("Thư viện xuất PDF chưa sẵn sàng, vui lòng đợi thêm 1 lát!");
        setIsExporting(false);
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi xuất báo cáo!");
      setIsExporting(false);
    }
  };
  return (
    <div className="dashboard-container">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
      <Sidebar activeItem="reports" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar" style={{background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)',backdropFilter:'blur(16px)',position:'sticky',top:0,zIndex:10}}>
          <h1 className="page-title" style={{color:'var(--text-main)'}}>Thống kê & Báo cáo</h1>
          <div className="nav-actions">
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
        
        <div className="content-area reports-fade-in">
          {/* MOMO STYLE: TÌNH HÌNH THU CHI CARD */}
          <div className="momo-stats-card">
            <div className="momo-stats-header">
              <h2 className="momo-stats-title">Tình hình thu chi</h2>
              <div className="momo-view-toggle">
                <button 
                  className={`momo-view-btn ${viewMode === 'allocation' ? 'active' : ''}`}
                  onClick={() => setViewMode('allocation')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                  Phân bổ
                </button>
                <button 
                  className={`momo-view-btn ${viewMode === 'trend' ? 'active' : ''}`}
                  onClick={() => setViewMode('trend')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                </button>
              </div>
            </div>

            <div className="momo-month-selector">
              <button className="momo-month-btn" onClick={handlePrevMonth}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <div className="momo-month-display">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {getDisplayMonth()}
              </div>
              <button className="momo-month-btn" onClick={handleNextMonth}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <div className="momo-type-toggle">
              <div 
                className={`momo-type-card ${reportType === 'expense' ? 'expense-active' : ''}`}
                onClick={() => setReportType('expense')}
              >
                <div className="momo-type-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path></svg>
                  Chi tiêu 
                  {currentSummary.expense > prevSummary.expense ? <span className="trend-arrow up">↑</span> : <span className="trend-arrow down">↓</span>}
                </div>
                <div className="momo-type-amount">{formatCurrency(currentSummary.expense)}</div>
              </div>
              <div 
                className={`momo-type-card ${reportType === 'income' ? 'income-active' : ''}`}
                onClick={() => setReportType('income')}
              >
                <div className="momo-type-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                  Thu nhập 
                  {currentSummary.income > prevSummary.income ? <span className="trend-arrow up">↑</span> : <span className="trend-arrow down">↓</span>}
                </div>
                <div className="momo-type-amount">{formatCurrency(currentSummary.income)}</div>
              </div>
            </div>

            <div className="momo-comparison-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#2D9CDB" stroke="none"><rect x="4" y="14" width="4" height="6"></rect><rect x="10" y="8" width="4" height="12"></rect><rect x="16" y="2" width="4" height="18"></rect></svg>
              <span>
                {(() => {
                  const curr = reportType === 'expense' ? currentSummary.expense : currentSummary.income;
                  const prev = reportType === 'expense' ? prevSummary.expense : prevSummary.income;
                  const diff = curr - prev;
                  if (diff > 0) return `Tăng ${formatCurrency(diff)} so với cùng kỳ tháng trước`;
                  if (diff < 0) return `Giảm ${formatCurrency(Math.abs(diff))} so với cùng kỳ tháng trước`;
                  return 'Tương đương với cùng kỳ tháng trước';
                })()}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: 'auto'}}><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>

            {viewMode === 'allocation' && (
              <div className="momo-chart-container">
                {(() => {
                  let currentPercentage = 0;
                  let svgCircles: any[] = [];
                  const C = 2 * Math.PI * 90;
                  const totalAmt = reportType === 'expense' ? currentSummary.expense : currentSummary.income;

                  if (topCategories.length > 0) {
                    topCategories.forEach((c, i) => {
                      const dashValue = (c.percentage * C) / 100;
                      const gapValue = C - dashValue;
                      const dashArray = `${dashValue} ${gapValue}`;
                      const dashOffset = -(currentPercentage * C) / 100;
                      svgCircles.push(
                        <circle 
                          key={i} 
                          cx="120" cy="120" r="90" 
                          fill="transparent" 
                          stroke={c.color || (reportType === 'expense' ? '#FE5C73' : '#10B981')} 
                          strokeWidth={hoveredCategory === i ? "45" : "40"} 
                          strokeDasharray={dashArray} 
                          strokeDashoffset={dashOffset}
                          onMouseEnter={() => setHoveredCategory(i)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          style={{ fill: 'transparent', transition: 'stroke-width 0.2s', cursor: 'pointer' }}
                        />
                      );
                      currentPercentage += c.percentage;
                    });
                  } else {
                    svgCircles.push(<circle key="empty" cx="120" cy="120" r="90" fill="transparent" stroke="#f0f0f0" strokeWidth="40" style={{ fill: 'transparent' }} />);
                  }

                  const hoveredItem = hoveredCategory !== null ? topCategories[hoveredCategory] : null;

                  return (
                    <div style={{ position: 'relative', width: '240px', height: '240px', margin: '30px auto' }}>
                      <svg width="240" height="240" viewBox="0 0 240 240" style={{ width: '240px', height: '240px', transform: 'rotate(-90deg)' }}>
                        {svgCircles}
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '120px' }}>
                        {hoveredItem ? (
                          <>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: hoveredItem.color }}>{hoveredItem.percentage.toFixed(1)}%</div>
                            <div style={{ fontSize: '13px', color: '#718EBF', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hoveredItem.name}</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: '13px', color: '#718EBF', marginBottom: '4px' }}>Tổng {reportType === 'expense' ? 'chi' : 'thu'}</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{formatCurrency(totalAmt)}</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {viewMode === 'trend' && (() => {
              const W = Math.max(800, dailyData.length * 35);
              const H = 220;
              const paddingY = 40;
              const safeMax = maxDailyAmt || 1;
              const points = dailyData.map((d, i) => {
                const x = (i / Math.max(1, dailyData.length - 1)) * (W - 40) + 20;
                const y = H - paddingY - (d.amount / safeMax) * (H - paddingY * 2);
                return { x, y, day: d.day, date: d.date, amount: d.amount };
              });

              let pathD = '';
              if (points.length > 0) {
                pathD = `M ${points[0].x},${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                  const curr = points[i];
                  const next = points[i + 1];
                  const cp1x = curr.x + (next.x - curr.x) / 2;
                  const cp2x = curr.x + (next.x - curr.x) / 2;
                  pathD += ` C ${cp1x},${curr.y} ${cp2x},${next.y} ${next.x},${next.y}`;
                }
              }

              const fillPathD = points.length > 0 
                ? `${pathD} L ${points[points.length - 1].x},${H} L ${points[0].x},${H} Z`
                : '';

              const color = reportType === 'expense' ? '#C62828' : '#10B981';
              const gradientId = `trend-gradient-${reportType}`;

              const hoveredPoint = hoveredDay !== null ? points.find(p => p.day === hoveredDay) : null;

              return (
                <div className="momo-line-chart-container">
                  <div className="momo-line-scroll-area">
                    <div style={{ position: 'relative', width: W, height: H }}>
                      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H, overflow: 'visible' }}>
                        <defs>
                          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {fillPathD && (
                          <path d={fillPathD} fill={`url(#${gradientId})`} />
                        )}

                        {hoveredPoint && (
                          <line 
                            x1={hoveredPoint.x} y1={hoveredPoint.y} 
                            x2={hoveredPoint.x} y2={H} 
                            stroke={color} 
                            strokeWidth="1.5" 
                            strokeDasharray="4 4" 
                            opacity="0.5"
                          />
                        )}

                        {pathD && (
                          <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        )}

                        {points.map((p, i) => (
                          <g key={i}>
                            {p.amount > 0 && (
                              <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
                            )}
                            {hoveredDay === p.day && (
                              <circle cx={p.x} cy={p.y} r="8" fill={color} opacity="0.3" />
                            )}
                            <rect 
                              x={p.x - 17.5} y={0} width="35" height={H} 
                              fill="transparent" 
                              onMouseEnter={() => setHoveredDay(p.day)}
                              onMouseLeave={() => setHoveredDay(null)}
                              style={{ cursor: 'pointer' }}
                            />
                          </g>
                        ))}
                      </svg>

                      {hoveredPoint && (
                        <div className="momo-line-tooltip" style={{ left: hoveredPoint.x, top: hoveredPoint.y - 15 }}>
                          <div className="momo-line-tooltip-date">Ngày {hoveredPoint.day}</div>
                          <div className="momo-line-tooltip-amt" style={{ color }}>
                            {reportType === 'expense' && hoveredPoint.amount > 0 ? '-' : ''}{formatCurrency(hoveredPoint.amount)}
                          </div>
                        </div>
                      )}
                      
                      <div className="momo-line-axis">
                        {points.map((p, i) => {
                          if (p.day === 1 || p.day % 5 === 0 || p.day === points.length) {
                            return (
                              <div key={i} style={{ position: 'absolute', left: p.x, transform: 'translateX(-50%)' }}>
                                Ngày {p.day}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {viewMode === 'trend' && reportType === 'expense' && abnormalDays.length > 0 && abnormalDays[0].avg > 0 && (
              <div style={{
                background: 'rgba(254, 92, 115, 0.08)',
                border: '1px solid rgba(254, 92, 115, 0.3)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                animation: 'listSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}>
                <div style={{ fontSize: '24px' }}>🚨</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#FE5C73', marginBottom: '4px' }}>Cảnh báo chi tiêu bất thường</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                    Phát hiện <strong>{abnormalDays.length} ngày</strong> chi tiêu vượt xa mức bình thường. Đáng chú ý nhất là <strong>Ngày {abnormalDays[0].day}</strong> bạn đã chi tới <strong>{formatCurrency(abnormalDays[0].amount)}</strong>, cao gấp <strong>{(abnormalDays[0].amount / abnormalDays[0].avg).toFixed(1)} lần</strong> mức trung bình ({formatCurrency(abnormalDays[0].avg)}/ngày).
                  </div>
                </div>
              </div>
            )}

            <div className="momo-top-list">
              {isLoadingTopCategories ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>Đang tải dữ liệu...</div>
              ) : topCategories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>Không có dữ liệu trong tháng này.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {topCategories.map((cat, idx) => {
                    const budgetLimit = budgetMap[cat.id] || 0;
                    const isOverBudget = reportType === 'expense' && budgetLimit > 0 && cat.amount > budgetLimit;
                    const progressPct = reportType === 'expense' && budgetLimit > 0 ? Math.min((cat.amount / budgetLimit) * 100, 100) : cat.percentage;
                    
                    return (
                      <div className="momo-list-item-card" key={`${reportType}-${cat.id}-${idx}`} style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: isOverBudget ? 'rgba(254, 92, 115, 0.05)' : 'var(--bg-color)',
                        border: isOverBudget ? '1px solid rgba(254, 92, 115, 0.2)' : '1px solid transparent',
                        opacity: listVisible ? 1 : 0,
                        transform: listVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s, box-shadow 0.2s, background 0.2s, border 0.2s`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="momo-list-item-icon" style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '12px',
                              background: cat.color ? `${cat.color}1A` : 'rgba(113, 142, 191, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                            }}>
                              {parseIcon(cat.icon)}
                            </div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{cat.name}</div>
                              {reportType === 'expense' && budgetLimit > 0 ? (
                                <div style={{ fontSize: '12px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                                  Ngân sách: {formatCurrency(budgetLimit)}
                                </div>
                              ) : (
                                <div style={{ fontSize: '12px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                                  Chiếm {cat.percentage.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: isOverBudget ? '#FE5C73' : (reportType === 'income' ? '#10B981' : 'var(--text-main)') }}>
                              {formatCurrency(cat.amount)}
                            </div>
                            {isOverBudget && (
                              <div className="momo-badge-pulse" style={{ fontSize: '11px', color: '#fff', background: '#FE5C73', padding: '2px 6px', borderRadius: '8px', display: 'inline-block', marginTop: '4px', fontWeight: 'bold' }}>
                                Chi lố {formatCurrency(cat.amount - budgetLimit)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: 'var(--border-color)',
                          borderRadius: '3px',
                          marginTop: '4px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: listVisible ? `${progressPct}%` : '0%',
                            height: '100%',
                            background: isOverBudget ? 'linear-gradient(90deg, #FF6B81 0%, #FE5C73 100%)' : (cat.color || (reportType === 'expense' ? '#718EBF' : '#10B981')),
                            borderRadius: '3px',
                            transition: `width 1s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05 + 0.1}s`
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Export Section title */}
          <h2 className="report-section-header" style={{marginTop: '40px'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1814F3' }}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Xuất Báo Cáo
          </h2>

          {/* FORMATS CARD GRID */}
          <div className="report-cards-grid">
            {/* PDF CARD */}
            <div className="report-card pdf" onClick={handleExportPDF}>
              <div className="report-card-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                {renderFormatIcon('pdf', 28)}
              </div>
              <h3 className="report-card-title">{t('export_pdf')}</h3>
              <p className="report-card-desc">{t('export_pdf_desc')}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); handleExportPDF(); }} 
                className="report-download-btn pdf-btn"
                disabled={!isLoggedIn || isExporting}
              >
                {isExporting ? 'Đang xuất...' : t('download')}
              </button>
            </div>

            {/* EXCEL CARD */}
            <div className="report-card excel" onClick={handleExportExcel}>
              <div className="report-card-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
                {renderFormatIcon('excel', 28)}
              </div>
              <h3 className="report-card-title">{t('export_excel')}</h3>
              <p className="report-card-desc">{t('export_excel_desc')}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); handleExportExcel(); }} 
                className="report-download-btn excel-btn"
                disabled={!isLoggedIn || isExportingExcel}
              >
                {isExportingExcel ? 'Đang xuất...' : t('download')}
              </button>
            </div>

            {/* CSV CARD */}
            <div className="report-card csv" onClick={handleExportCSV}>
              <div className="report-card-icon-wrapper" style={{ background: 'rgba(24, 20, 243, 0.08)' }}>
                {renderFormatIcon('csv', 28)}
              </div>
              <h3 className="report-card-title">{t('export_csv')}</h3>
              <p className="report-card-desc">{t('export_csv_desc')}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); handleExportCSV(); }} 
                className="report-download-btn csv-btn"
                disabled={!isLoggedIn || isExportingCSV}
              >
                {isExportingCSV ? 'Đang xuất...' : t('download')}
              </button>
            </div>
          </div>

          {false && <>
          {/* FILTER SECTION */}
          <h2 className="report-section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1814F3' }}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {t('filter_before_export')}
          </h2>
          <div className="report-filter-box">
            <div className="report-filter-grid">
              <div>
                <label className="report-filter-label">{t('from_date')}</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={!isLoggedIn} className="report-input"/>
              </div>
              <div>
                <label className="report-filter-label">{t('to_date')}</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={!isLoggedIn} className="report-input"/>
              </div>
              <div>
                <label className="report-filter-label">{t('category_filter')}</label>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} disabled={!isLoggedIn} className="report-select">
                  <option value="">{t('all')}</option>
                  {categories?.map((c: any) => (
                    <optgroup key={c.id} label={`${parseIcon(c.icon || '')} ${c.name}`.trim()}>
                      <option value={c.id}>{`${parseIcon(c.icon || '')} ${c.name}`.trim()}</option>
                      {c.children?.map((child: any) => (
                        <option key={child.id} value={child.id}>-- {`${parseIcon(child.icon || '')} ${child.name}`.trim()}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="report-filter-label">Ví</label>
                <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)} disabled={!isLoggedIn} className="report-select">
                  <option value="">{t('all')}</option>
                  {wallets?.map((w: any) => (
                    <option key={w.id} value={w.id}>{`${parseIcon(w.icon || '')} ${w.name}`.trim()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="report-filter-label">{t('transaction_type')}</label>
                <select value={selectedType} onChange={e => setSelectedType(e.target.value)} disabled={!isLoggedIn} className="report-select">
                  <option value="">{t('all')}</option>
                  <option value="income">Thu nhập</option>
                  <option value="expense">Chi tiêu</option>
                </select>
              </div>
            </div>
          </div>

          {/* TOP CATEGORIES SECTION (MOMO STYLE) */}
          <h2 className="report-section-header" style={{ marginTop: '30px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#FE5C73' }}>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Top chi tiêu {startDate && endDate ? `(${startDate} - ${endDate})` : ''}
          </h2>
          <div className="report-filter-box" style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
            {isLoadingTopCategories ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>Đang tải dữ liệu chi tiêu...</div>
            ) : !isLoggedIn ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>Vui lòng đăng nhập để xem thống kê.</div>
            ) : topCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#718EBF', fontWeight: '500' }}>Không có chi tiêu nào trong thời gian này.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {topCategories.map((cat, idx) => {
                  const budgetLimit = budgetMap[cat.id] || 0;
                  const isOverBudget = budgetLimit > 0 && cat.amount > budgetLimit;
                  const progressPct = budgetLimit > 0 ? Math.min((cat.amount / budgetLimit) * 100, 100) : cat.percentage;
                  
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: isOverBudget ? 'rgba(254, 92, 115, 0.05)' : 'transparent',
                      border: isOverBudget ? '1px solid rgba(254, 92, 115, 0.2)' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: cat.color ? `${cat.color}1A` : 'rgba(113, 142, 191, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                          }}>
                            {parseIcon(cat.icon)}
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{cat.name}</div>
                            {budgetLimit > 0 ? (
                              <div style={{ fontSize: '12px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                                Ngân sách: {new Intl.NumberFormat('vi-VN').format(budgetLimit)} {userData?.preference?.currency || 'VND'}
                              </div>
                            ) : (
                              <div style={{ fontSize: '12px', color: '#718EBF', marginTop: '2px', fontWeight: '500' }}>
                                Chiếm {cat.percentage.toFixed(1)}% tổng chi
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: isOverBudget ? '#FE5C73' : 'var(--text-main)' }}>
                            {new Intl.NumberFormat('vi-VN').format(cat.amount)} {userData?.preference?.currency || 'VND'}
                          </div>
                          {isOverBudget && (
                            <div style={{ fontSize: '11px', color: '#fff', background: '#FE5C73', padding: '2px 6px', borderRadius: '8px', display: 'inline-block', marginTop: '4px', fontWeight: 'bold' }}>
                              Chi lố {new Intl.NumberFormat('vi-VN').format(cat.amount - budgetLimit)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'var(--border-color)',
                        borderRadius: '3px',
                        marginTop: '4px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: isOverBudget ? 'linear-gradient(90deg, #FF6B81 0%, #FE5C73 100%)' : (cat.color || '#718EBF'),
                          borderRadius: '3px',
                          transition: 'width 0.5s ease-in-out'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          </>}
          {/* HISTORY SECTION */}
          <h2 className="report-section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1814F3' }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {t('export_history')}
          </h2>
          <div className="report-history-box">
            {isLoggedIn && exportHistory.length > 0 ? exportHistory.map((f: any, i: number)=>(
              <div key={i} className="report-history-item">
                <div className={`report-history-icon-circle ${f.type}`}>
                  {renderFormatIcon(f.type, 20)}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:'700', color:'var(--text-main)', fontSize: '14.5px'}}>{f.name}</div>
                  <div style={{fontSize:'12.5px', color:'#718EBF', fontWeight: '500', marginTop: '2px'}}>{f.date} • {f.size}</div>
                </div>
                <button onClick={() => handleReloadExport(f)} className="report-history-btn">{t('reload')}</button>
              </div>
            )) : (
              <p style={{color:'#718EBF', textAlign:'center', padding:'30px', fontWeight: '600'}}>
                {isLoggedIn ? 'Chưa có lịch sử xuất file nào.' : t('login_to_view_history')}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );

}

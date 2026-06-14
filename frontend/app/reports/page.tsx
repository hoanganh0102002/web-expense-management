"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { reportApi, transactionApi } from '../lib/api';
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
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().split('T')[0];
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const [exportHistory, setExportHistory] = useState<any[]>([]);

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
          <h1 className="page-title" style={{color:'var(--text-main)'}}>{t('reports_export')}</h1>
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

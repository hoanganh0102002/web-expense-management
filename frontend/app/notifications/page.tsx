"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { notificationApi } from '../lib/api';

import './notifications.css';

interface NotificationMetadata {
  transaction_id?: string | number;
  id?: string | number;
  model_id?: string | number;
  transfer_id?: string | number;
  category_id?: string | number;
  type?: string;
  sender_name?: string;
  senderName?: string;
  amount?: string | number;
  status?: string;
  threshold_percent?: number;
}

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type?: string;
  read_at: string | null;
  created_at: string;
  date?: string;
  transaction_id?: string | number;
  related_id?: string | number;
  category_id?: string | number;
  metadata?: string | NotificationMetadata | null;
  data?: string | NotificationMetadata | null;
}

const formatRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  } catch {
    return dateStr;
  }
};

const renderNotificationIcon = (type: 'danger' | 'warning' | 'info' | 'reminder' | 'success') => {
  if (type === 'danger') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (type === 'warning') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (type === 'info') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      </svg>
    );
  }
  if (type === 'reminder') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9966FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16DBCC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
};


export default function Notifications() {
  const router = useRouter();
  const { isLoggedIn, userData, setHasUnreadNotifications, setUnreadNotificationsCount } = useAppContext();
  const { t } = useLanguage();
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Hydration-safe cache loading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let combined: NotificationItem[] = [];
      const localCached = localStorage.getItem('local_notifications');
      if (localCached) {
        try { 
          const parsed = JSON.parse(localCached);
          if (Array.isArray(parsed)) combined.push(...parsed); 
        } catch {}
      }
      const cached = localStorage.getItem('cached_notifications');
      if (cached) {
        try { 
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) combined.push(...parsed); 
        } catch {}
      }
      const isErrorNotif = (n: NotificationItem) => {
        const titleLower = (n.title || '').toLowerCase();
        const contentLower = (n.content || '').toLowerCase();
        return titleLower.includes('lỗi') || titleLower.includes('thất bại') || titleLower.includes('không thành công') ||
               contentLower.includes('lỗi') || contentLower.includes('thất bại') || contentLower.includes('không thành công') || (n.type && n.type.toLowerCase().includes('error'));
      };
      combined = combined.filter((n) => !isErrorNotif(n));

      if (combined.length > 0) {
        setTimeout(() => {
          setNotificationsList(prev => prev.length === 0 ? combined : prev);
        }, 0);
      }
    }
  }, []);
  
  const fetchNotifications = useCallback(async (page: number = 1) => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const res = await notificationApi.getAll(page);
      const list: NotificationItem[] = res.data || [];
      
      let localNotifs: NotificationItem[] = [];
      try { localNotifs = JSON.parse(localStorage.getItem('local_notifications') || '[]'); } catch {}
      
      const isErrorNotif = (n: NotificationItem) => {
        const titleLower = (n.title || '').toLowerCase();
        const contentLower = (n.content || '').toLowerCase();
        return titleLower.includes('lỗi') || titleLower.includes('thất bại') || titleLower.includes('không thành công') ||
               contentLower.includes('lỗi') || contentLower.includes('thất bại') || contentLower.includes('không thành công') || (n.type && n.type.toLowerCase().includes('error'));
      };

      const filteredList = list.filter((n) => !isErrorNotif(n));
      const filteredLocalNotifs = localNotifs.filter((n) => !isErrorNotif(n));

      // Show local notifications prepended on page 1 only
      if (page === 1) {
        setNotificationsList([...filteredLocalNotifs, ...filteredList]);
      } else {
        setNotificationsList(filteredList);
      }

      if (res.pagination) {
        setTotalPages(res.pagination.last_page || 1);
        setTotalItems(res.pagination.total || 0);
        setCurrentPage(res.pagination.current_page || page);
      }
      
      if (page === 1) {
        localStorage.setItem('cached_notifications', JSON.stringify(filteredList));
      }
    } catch (e) {
      console.error("Lỗi khi tải thông báo:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      const timer = setTimeout(() => {
        fetchNotifications(currentPage);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, currentPage, fetchNotifications]);

  useEffect(() => {
    const unreadList = notificationsList.filter(n => n.read_at === null);
    setUnreadNotificationsCount(unreadList.length);
    setHasUnreadNotifications(unreadList.length > 0);
  }, [notificationsList, setHasUnreadNotifications, setUnreadNotificationsCount]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push('ellipsis-start');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      if (id.includes('-') && !id.startsWith('local_')) {
        await notificationApi.read(id);
      } else if (id.startsWith('local_')) {
        let localNotifs: NotificationItem[] = JSON.parse(localStorage.getItem('local_notifications') || '[]');
        localNotifs = localNotifs.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n);
        localStorage.setItem('local_notifications', JSON.stringify(localNotifs));
      }
      setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (e) {
      console.error("Lỗi khi đánh dấu đã đọc:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.readAll();
      let localNotifs: NotificationItem[] = JSON.parse(localStorage.getItem('local_notifications') || '[]');
      localNotifs = localNotifs.map((n) => ({ ...n, read_at: new Date().toISOString() }));
      localStorage.setItem('local_notifications', JSON.stringify(localNotifs));
      setNotificationsList(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (e) {
      console.error("Lỗi khi đánh dấu đọc tất cả:", e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (window.confirm(t('confirm_delete') || "Bạn có chắc chắn muốn xóa thông báo này?")) {
      try {
        if (id.includes('-') && !id.startsWith('local_')) {
          await notificationApi.delete(id);
        } else if (id.startsWith('local_')) {
          let localNotifs: NotificationItem[] = JSON.parse(localStorage.getItem('local_notifications') || '[]');
          localNotifs = localNotifs.filter((n) => n.id !== id);
          localStorage.setItem('local_notifications', JSON.stringify(localNotifs));
        }
        setNotificationsList(prev => prev.filter(n => n.id !== id));
      } catch (e) {
        console.error("Lỗi khi xóa thông báo:", e);
      }
    }
  };

  const handleNotificationClick = (n: NotificationItem, e: React.MouseEvent) => {
    // Prevent redirect if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    // Mark as read automatically if unread
    if (n.read_at === null) {
      handleMarkAsRead(n.id);
    }

    // If it's an error notification, do not redirect
    const titleLower = (n.title || '').toLowerCase();
    const contentLower = (n.content || '').toLowerCase();
    if (titleLower.includes('lỗi') || titleLower.includes('thất bại') || titleLower.includes('không thành công') || 
        contentLower.includes('lỗi') || contentLower.includes('thất bại') || contentLower.includes('không thành công')) {
      return;
    }

    // Safely parse metadata and data in case they are stringified JSON
    let parsedMetadata: NotificationMetadata | null = null;
    let parsedData: NotificationMetadata | null = null;
    
    if (n.metadata) {
      if (typeof n.metadata === 'string') {
        try {
          parsedMetadata = JSON.parse(n.metadata);
        } catch {}
      } else {
        parsedMetadata = n.metadata;
      }
    }
    
    if (n.data) {
      if (typeof n.data === 'string') {
        try {
          parsedData = JSON.parse(n.data);
        } catch {}
      } else {
        parsedData = n.data;
      }
    }

    // Extract common identifiers generically
    const txId = n.transaction_id || 
                 (parsedMetadata && (parsedMetadata.transaction_id || parsedMetadata.id || parsedMetadata.model_id || parsedMetadata.transfer_id)) || 
                 (parsedData && (parsedData.transaction_id || parsedData.id || parsedData.model_id || parsedData.transfer_id)) || 
                 n.related_id;
    
    const catId = n.category_id || (parsedMetadata && parsedMetadata.category_id) || (parsedData && parsedData.category_id);
    const typeStr = n.type || (parsedMetadata && parsedMetadata.type) || (parsedData && parsedData.type) || '';

    // -- Tốiưu hóa điều hướng (Navigation Optimization) --
    
    // 1. Weekly Summary Notification
    if (typeStr.includes('WeeklySummaryNotification') || typeStr === 'weekly_summary') {
      router.push('/reports');
      return;
    }

    // 2. Financial Month Start Notification
    if (typeStr.includes('FinancialMonthStartNotification')) {
      router.push('/budget');
      return;
    }

    // 3. Import / Export Notifications
    if (typeStr.includes('ImportCompletedNotification') || typeStr.includes('ExportCompletedNotification')) {
      router.push('/transactions');
      return;
    }

    // 4. Daily Reminder Notification
    if (typeStr.includes('DailyReminderNotification')) {
      router.push('/transactions');
      return;
    }

    // 5. P2P Transfer Received
    if (typeStr.includes('P2pTransferReceivedNotification')) {
      if (txId) {
        router.push(`/transactions?txId=${txId}`);
      } else {
        // Fallback: search for P2P transaction by matching sender name and amount
        const sender = (parsedMetadata && (parsedMetadata.sender_name || parsedMetadata.senderName)) ||
                       (parsedData && (parsedData.sender_name || parsedData.senderName));
        const amount = (parsedMetadata && parsedMetadata.amount) || (parsedData && parsedData.amount);
        
        if (sender) {
          let url = `/transactions?autoOpenTitle=${encodeURIComponent(`Nhận tiền từ ${sender}`)}`;
          if (amount) {
            url += `&autoOpenAmount=${amount}`;
          }
          if (n.created_at || n.date) {
            url += `&autoOpenDate=${encodeURIComponent(n.created_at || n.date || '')}`;
          }
          router.push(url);
        } else {
          // If we can't extract sender, use regular text parsing fallback
          const textToSearch = n.content || n.title || '';
          const fromMatch = textToSearch.match(/từ\s+(.*?)(?:\.|$)/i);
          const amountMatch = textToSearch.match(/([0-9,.]+)/);
          
          let url = '/transactions';
          if (fromMatch && fromMatch[1]) {
            url = `/transactions?autoOpenTitle=${encodeURIComponent(`Nhận tiền từ ${fromMatch[1].trim()}`)}`;
          }
          if (amountMatch && amountMatch[1]) {
            const amt = amountMatch[1].replace(/,/g, '');
            url += (url.includes('?') ? '&' : '?') + `autoOpenAmount=${amt}`;
          }
          if (n.created_at || n.date) {
            url += (url.includes('?') ? '&' : '?') + `autoOpenDate=${encodeURIComponent(n.created_at || n.date || '')}`;
          }
          router.push(url);
        }
      }
      return;
    }

    // 6. Recurring Transaction Executed
    if (typeStr.includes('RecurringTransactionExecutedNotification')) {
      const status = (parsedMetadata && parsedMetadata.status) || (parsedData && parsedData.status);
      if (status === 'success' && txId) {
        router.push(`/transactions?txId=${txId}`);
      } else {
        router.push('/transactions');
      }
      return;
    }

    // 7. Budget Warning Notification
    if (typeStr.includes('BudgetWarningNotification') || titleLower.includes('ngân sách') || titleLower.includes('budget')) {
      if (catId) {
        router.push(`/budget?categoryId=${catId}`);
      } else {
        const textToSearch = n.content || n.title || '';
        const match = textToSearch.match(/"(.*?)"/);
        if (match && match[1]) {
           router.push(`/budget?autoExpandTitle=${encodeURIComponent(match[1])}`);
        } else {
           router.push('/budget');
        }
      }
      return;
    } 
    
    // 8. General Transaction Match
    if (txId) {
      router.push(`/transactions?txId=${txId}`);
      return;
    } 
    
    // Fallback: extract title from quotes to find and open the transaction
    const textToSearch = n.content || n.title || '';
    const match = textToSearch.match(/"(.*?)"/);
    if (match && match[1]) {
       router.push(`/transactions?autoOpenTitle=${encodeURIComponent(match[1])}`);
    } else {
       const fromMatch = textToSearch.match(/từ\s+(.*?)(?:\.|$)/i);
       const toMatch = textToSearch.match(/đến\s+(.*?)(?:\.|$)/i);
       const amountMatch = textToSearch.match(/([0-9,.]+)\s*VND/i);

       let url = '/transactions';
       if (fromMatch && fromMatch[1]) {
         url = `/transactions?autoOpenTitle=${encodeURIComponent(fromMatch[1].trim())}`;
       } else if (toMatch && toMatch[1]) {
         url = `/transactions?autoOpenTitle=${encodeURIComponent(toMatch[1].trim())}`;
       }

       if (amountMatch && amountMatch[1]) {
         const amt = amountMatch[1].replace(/,/g, '');
         url += (url.includes('?') ? '&' : '?') + `autoOpenAmount=${amt}`;
       }
       
       router.push(url);
    }
  };

  const typeStyles: Record<string, { color: string, bg: string, glow: string, border: string }> = {
    danger: { color: '#FE5C73', bg: '#FFE0EB', glow: 'rgba(254, 92, 115, 0.15)', border: 'rgba(254, 92, 115, 0.3)' },
    warning: { color: '#FF9800', bg: '#FFF5D9', glow: 'rgba(255, 152, 0, 0.15)', border: 'rgba(255, 152, 0, 0.3)' },
    info: { color: '#1814F3', bg: '#E7EDFF', glow: 'rgba(24, 20, 243, 0.15)', border: 'rgba(24, 20, 243, 0.3)' },
    success: { color: '#16DBCC', bg: '#DCFAF8', glow: 'rgba(22, 219, 204, 0.15)', border: 'rgba(22, 219, 204, 0.3)' },
    reminder: { color: '#9966FF', bg: '#F3E8FF', glow: 'rgba(153, 102, 255, 0.15)', border: 'rgba(153, 102, 255, 0.3)' }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="notifications" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar" style={{background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)',backdropFilter:'blur(10px)',position:'sticky',top:0,zIndex:10}}>
          <h1 className="page-title" style={{color:'var(--text-main)'}}>{t('notifications')}</h1>
          <div className="nav-actions" style={{display:'flex', alignItems:'center'}}>
            {isLoggedIn && notificationsList.some(n => n.read_at === null) && (
              <button 
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'transparent',
                  color: '#1814F3',
                  padding: '10px 20px',
                  borderRadius: '24px',
                  fontWeight: '600',
                  border: '1.5px solid #1814F3',
                  cursor: 'pointer',
                  marginRight: '10px',
                  fontSize: '14px',
                  transition: 'all 0.25s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(24, 20, 243, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Đánh dấu đọc tất cả
              </button>
            )}
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '15px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=EM&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold', marginLeft: '15px'}}>{t('login')}</Link>
            )}
          </div>
        </nav>
        <div className="content-area">
          <div className="notif-stats-grid">
            <div className="notif-stat-card unread">
              <div className="notif-stat-number">{isLoggedIn ? notificationsList.filter(n => n.read_at === null).length : 0}</div>
              <div className="notif-stat-title">{t('unread')}</div>
            </div>
            <div className="notif-stat-card warning">
              <div className="notif-stat-number">
                {isLoggedIn ? notificationsList.filter(n => n.read_at === null && (n.title?.toLowerCase().includes('cảnh báo') || n.title?.toLowerCase().includes('warning') || n.title?.toLowerCase().includes('vượt'))).length : 0}
              </div>
              <div className="notif-stat-title">{t('warning_label')}</div>
            </div>
            <div className="notif-stat-card recurring">
              <div className="notif-stat-number">
                {isLoggedIn ? notificationsList.filter(n => n.title?.toLowerCase().includes('định kỳ') || n.type?.toLowerCase().includes('recurring')).length : 0}
              </div>
              <div className="notif-stat-title">{t('auto_transaction')}</div>
            </div>
          </div>

          {isLoading ? (
            <div style={{display:'flex', justifyContent:'center', padding:'80px', color:'var(--text-main)', fontSize:'16px'}}>{t('loading')}...</div>
          ) : notificationsList.length > 0 ? (
            <>
              {notificationsList.map((n) => {
              let type: 'danger' | 'warning' | 'info' | 'reminder' | 'success' = 'info';
              let threshold: number | undefined = undefined;
              if (n.metadata) {
                if (typeof n.metadata === 'string') {
                  try {
                    const parsed = JSON.parse(n.metadata);
                    threshold = parsed?.threshold_percent;
                  } catch {}
                } else {
                  threshold = n.metadata.threshold_percent;
                }
              }

              if (n.type?.includes('BudgetWarningNotification') || n.title?.toLowerCase().includes('ngân sách') || n.title?.toLowerCase().includes('budget')) {
                if (threshold === 100) {
                  type = 'danger';
                } else {
                  type = 'warning';
                }
              } else if (n.type?.includes('RecurringTransaction') || n.title?.toLowerCase().includes('định kỳ')) {
                type = 'info';
              } else if (n.type?.includes('SystemNotification')) {
                type = 'reminder';
              }

              const isRead = n.read_at !== null;
              const styles = typeStyles[type];
              
              const customStyle = {
                '--notif-color': styles.color,
                '--notif-bg-color': styles.bg,
                '--notif-glow-shadow': styles.glow,
                '--notif-color-border': styles.border,
                cursor: 'pointer'
              } as React.CSSProperties;

              return (
                <div 
                  key={n.id} 
                  className={`notification-item ${isRead ? 'read' : 'unread'} notifications-fade-in`}
                  style={customStyle}
                  onClick={(e) => handleNotificationClick(n, e)}
                >
                  <div className="notif-icon-circle">
                    {renderNotificationIcon(type)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'700',color:'var(--text-main)', fontSize: '15px', marginBottom: '4px'}}>{n.title}</div>
                    <div style={{fontSize:'14px',color:'#718EBF', lineHeight: '1.4'}}>{n.content}</div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px', minWidth: '130px'}}>
                    <span style={{color:'#B1B5C3',fontSize:'13px', fontWeight: '500'}}>{formatRelativeTime(n.created_at)}</span>
                    <div style={{display:'flex', gap:'8px'}}>
                      {!isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(n.id)}
                          className="notif-btn-read"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteNotification(n.id)}
                        className="notif-btn-delete"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {totalPages > 1 && (
              <div className="notif-pagination-wrapper">
                <div style={{ fontSize: '14.5px', color: 'var(--text-light)', fontWeight: '600' }}>
                  Hiển thị {(currentPage - 1) * 15 + 1} - {Math.min(currentPage * 15, totalItems)} trong số {totalItems} thông báo
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Nút Trước */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn-arrow"
                  >
                    {t('previous')}
                  </button>

                  {/* Các số trang */}
                  {getPageNumbers().map((pageNum, idx) => {
                    if (pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end') {
                      return (
                        <span key={`ellipsis-${idx}`} style={{ padding: '0 8px', color: 'var(--text-light)', fontWeight: '600' }}>
                          ...
                        </span>
                      );
                    }
                    const isPageActive = pageNum === currentPage;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setCurrentPage(Number(pageNum))}
                        className={`pagination-btn-number ${isPageActive ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Nút Sau */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn-arrow"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            )}
            </>
          ) : (
            <div className="notif-empty-state notifications-fade-in">
              <div className="notif-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1814F3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3 style={{color:'var(--text-main)', marginBottom:'8px', fontWeight: '700', fontSize: '18px'}}>Không có thông báo</h3>
              <p style={{fontSize:'14px', maxWidth: '360px', margin: '0 auto'}}>Bạn chưa nhận được thông báo nào từ hệ thống.</p>
            </div>
          )}
          {!isLoggedIn && <p style={{color:'#718EBF',textAlign:'center',padding:'40px',background: 'var(--card-bg)',borderRadius:'16px',border: `1px solid var(--border-color)`}}>{t('login_to_view_notifications')}</p>}
        </div>
      </main>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { notificationApi } from '../lib/api';

import './notifications.css';

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
  } catch (e) {
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
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoading, setIsLoading] = useState(false);

  // Hydration-safe cache loading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let combined = [];
      const localCached = localStorage.getItem('local_notifications');
      if (localCached) {
        try { 
          const parsed = JSON.parse(localCached);
          if (Array.isArray(parsed)) combined.push(...parsed); 
        } catch (e) {}
      }
      const cached = localStorage.getItem('cached_notifications');
      if (cached) {
        try { 
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) combined.push(...parsed); 
        } catch (e) {}
      }
      const isErrorNotif = (n: any) => {
        const titleLower = (n.title || '').toLowerCase();
        const contentLower = (n.content || '').toLowerCase();
        return titleLower.includes('lỗi') || titleLower.includes('thất bại') || titleLower.includes('không thành công') ||
               contentLower.includes('lỗi') || contentLower.includes('thất bại') || contentLower.includes('không thành công') || (n.type && n.type.toLowerCase().includes('error'));
      };
      combined = combined.filter((n: any) => !isErrorNotif(n));

      if (combined.length > 0) {
        setNotificationsList(prev => prev.length === 0 ? combined : prev);
      }
    }
  }, []);
  
  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    const hasCache = notificationsList.length > 0 || (typeof window !== 'undefined' && localStorage.getItem('cached_notifications'));
    if (!hasCache) {
      setIsLoading(true);
    }
    try {
      const res = await notificationApi.getAll();
      const list = res.data || [];
      
      let localNotifs = [];
      try { localNotifs = JSON.parse(localStorage.getItem('local_notifications') || '[]'); } catch (e) {}
      
      const isErrorNotif = (n: any) => {
        const titleLower = (n.title || '').toLowerCase();
        const contentLower = (n.content || '').toLowerCase();
        return titleLower.includes('lỗi') || titleLower.includes('thất bại') || titleLower.includes('không thành công') ||
               contentLower.includes('lỗi') || contentLower.includes('thất bại') || contentLower.includes('không thành công') || (n.type && n.type.toLowerCase().includes('error'));
      };

      const filteredList = list.filter((n: any) => !isErrorNotif(n));
      const filteredLocalNotifs = localNotifs.filter((n: any) => !isErrorNotif(n));

      setNotificationsList([...filteredLocalNotifs, ...filteredList]);
      localStorage.setItem('cached_notifications', JSON.stringify(filteredList));
    } catch (e) {
      console.error("Lỗi khi tải thông báo:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const unreadList = notificationsList.filter(n => n.read_at === null);
    setUnreadNotificationsCount(unreadList.length);
    setHasUnreadNotifications(unreadList.length > 0);
  }, [notificationsList, setHasUnreadNotifications, setUnreadNotificationsCount]);

  const handleMarkAsRead = async (id: string) => {
    try {
      if (id.includes('-') && !id.startsWith('local_')) {
        await notificationApi.read(id);
      } else if (id.startsWith('local_')) {
        let localNotifs = JSON.parse(localStorage.getItem('local_notifications') || '[]');
        localNotifs = localNotifs.map((n: any) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n);
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
      let localNotifs = JSON.parse(localStorage.getItem('local_notifications') || '[]');
      localNotifs = localNotifs.map((n: any) => ({ ...n, read_at: new Date().toISOString() }));
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
          let localNotifs = JSON.parse(localStorage.getItem('local_notifications') || '[]');
          localNotifs = localNotifs.filter((n: any) => n.id !== id);
          localStorage.setItem('local_notifications', JSON.stringify(localNotifs));
        }
        setNotificationsList(prev => prev.filter(n => n.id !== id));
      } catch (e) {
        console.error("Lỗi khi xóa thông báo:", e);
      }
    }
  };

  const handleNotificationClick = (n: any, e: React.MouseEvent) => {
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
    let metadataObj = n.metadata;
    if (typeof metadataObj === 'string') {
      try {
        metadataObj = JSON.parse(metadataObj);
      } catch (e) {}
    }
    let dataObj = n.data;
    if (typeof dataObj === 'string') {
      try {
        dataObj = JSON.parse(dataObj);
      } catch (e) {}
    }

    // Extract common identifiers generically
    const txId = n.transaction_id || 
                 (metadataObj && (metadataObj.transaction_id || metadataObj.id || metadataObj.model_id || metadataObj.transfer_id)) || 
                 (dataObj && (dataObj.transaction_id || dataObj.id || dataObj.model_id || dataObj.transfer_id)) || 
                 n.related_id;
    
    const catId = n.category_id || (metadataObj && metadataObj.category_id) || (dataObj && dataObj.category_id);
    const typeStr = n.type || (metadataObj && metadataObj.type) || (dataObj && dataObj.type) || '';

    // -- Tối ưu hóa điều hướng (Navigation Optimization) --
    
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
        const sender = (metadataObj && (metadataObj.sender_name || metadataObj.senderName)) ||
                       (dataObj && (dataObj.sender_name || dataObj.senderName));
        const amount = (metadataObj && metadataObj.amount) || (dataObj && dataObj.amount);
        
        if (sender) {
          let url = `/transactions?autoOpenTitle=${encodeURIComponent(`Nhận tiền từ ${sender}`)}`;
          if (amount) {
            url += `&autoOpenAmount=${amount}`;
          }
          if (n.created_at || n.date) {
            url += `&autoOpenDate=${encodeURIComponent(n.created_at || n.date)}`;
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
            url += (url.includes('?') ? '&' : '?') + `autoOpenDate=${encodeURIComponent(n.created_at || n.date)}`;
          }
          router.push(url);
        }
      }
      return;
    }

    // 6. Recurring Transaction Executed
    if (typeStr.includes('RecurringTransactionExecutedNotification')) {
      const status = (metadataObj && metadataObj.status) || (dataObj && dataObj.status);
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
              {notificationsList.slice(0, visibleCount).map((n) => {
              let type: 'danger' | 'warning' | 'info' | 'reminder' | 'success' = 'info';
              
              if (n.type?.includes('BudgetWarningNotification') || n.title?.toLowerCase().includes('ngân sách') || n.title?.toLowerCase().includes('budget')) {
                const threshold = n.metadata?.threshold_percent;
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
            
            {visibleCount < notificationsList.length && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingBottom: '20px' }}>
                <button
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '24px',
                    background: 'rgba(24, 20, 243, 0.05)',
                    color: '#1814F3',
                    border: '1px solid rgba(24, 20, 243, 0.2)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(24, 20, 243, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(24, 20, 243, 0.05)'}
                >
                  Xem thêm
                </button>
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

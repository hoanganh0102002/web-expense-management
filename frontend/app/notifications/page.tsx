"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { notificationApi } from '../lib/api';

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

export default function Notifications() {
  const { isLoggedIn, userData } = useAppContext();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', desc: '' });
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const res = await notificationApi.getAll();
      setNotificationsList(res.data || []);
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

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.read(id);
      setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (e) {
      console.error("Lỗi khi đánh dấu đã đọc:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.readAll();
      setNotificationsList(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (e) {
      console.error("Lỗi khi đánh dấu đọc tất cả:", e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thông báo này?")) {
      try {
        await notificationApi.delete(id);
        setNotificationsList(prev => prev.filter(n => n.id !== id));
      } catch (e) {
        console.error("Lỗi khi xóa thông báo:", e);
      }
    }
  };

  const submitNotif = () => {
    const localNotif = {
      id: Math.random().toString(),
      title: newNotif.title || 'Thông báo hệ thống',
      content: newNotif.desc || 'Nội dung thông báo...',
      type: 'App\\Notifications\\SystemNotification',
      read_at: null,
      created_at: new Date().toISOString(),
      metadata: {}
    };
    setNotificationsList(prev => [localNotif, ...prev]);
    setIsModalOpen(false);
    setNewNotif({ title: '', desc: '' });
  };
  
  const tc:Record<string,{bg:string,b:string}>={warning:{bg:'#FFF5D9',b:'#FF9800'},info:{bg:'#E7EDFF',b:'#1814F3'},danger:{bg:'#FFE0EB',b:'#FE5C73'},success:{bg:'#DCFAF8',b:'#16DBCC'},reminder:{bg:'#F3E8FF',b:'#9966FF'}};

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
                style={{background:'transparent',color:'#1814F3',padding:'10px 20px',borderRadius:'24px',fontWeight:'600',border:'1px solid #1814F3',cursor:'pointer',marginRight:'10px',fontSize:'14px'}}
              >
                Đánh dấu đọc tất cả
              </button>
            )}
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'24px',fontWeight:'600',border:'none',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',gap:'8px',whiteSpace:'nowrap'}} onClick={()=>setIsModalOpen(true)}>{t('create_notification')}</button>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '15px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold', marginLeft: '15px'}}>{t('login')}</Link>
            )}
          </div>
        </nav>
        <div className="content-area">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'24px'}}>
            <div style={{background:'linear-gradient(135deg,#FE5C73,#FF8A65)',borderRadius:'16px',padding:'20px',color:'#fff'}}>
              <div style={{fontSize:'28px',fontWeight:'800'}}>{isLoggedIn ? notificationsList.filter(n => n.read_at === null).length : 0}</div>
              <div>{t('unread')}</div>
            </div>
            <div style={{background:'linear-gradient(135deg,#FF9800,#FFB74D)',borderRadius:'16px',padding:'20px',color:'#fff'}}>
              <div style={{fontSize:'28px',fontWeight:'800'}}>
                {isLoggedIn ? notificationsList.filter(n => n.read_at === null && (n.title?.toLowerCase().includes('cảnh báo') || n.title?.toLowerCase().includes('warning') || n.title?.toLowerCase().includes('vượt'))).length : 0}
              </div>
              <div>{t('warning_label')}</div>
            </div>
            <div style={{background:'linear-gradient(135deg,#1814F3,#6366F1)',borderRadius:'16px',padding:'20px',color:'#fff'}}>
              <div style={{fontSize:'28px',fontWeight:'800'}}>
                {isLoggedIn ? notificationsList.filter(n => n.title?.toLowerCase().includes('định kỳ') || n.type?.toLowerCase().includes('recurring')).length : 0}
              </div>
              <div>{t('auto_transaction')}</div>
            </div>
          </div>

          {isLoading ? (
            <div style={{display:'flex', justifyContent:'center', padding:'80px', color:'var(--text-main)', fontSize:'16px'}}>{t('loading')}...</div>
          ) : notificationsList.length > 0 ? (
            notificationsList.map((n) => {
              let type = 'info';
              let icon = '🔔';
              
              if (n.type?.includes('BudgetWarningNotification') || n.title?.toLowerCase().includes('ngân sách') || n.title?.toLowerCase().includes('budget')) {
                const threshold = n.metadata?.threshold_percent;
                if (threshold === 100) {
                  type = 'danger';
                  icon = '🚨';
                } else {
                  type = 'warning';
                  icon = '⚠️';
                }
              } else if (n.type?.includes('RecurringTransaction') || n.title?.toLowerCase().includes('định kỳ')) {
                type = 'info';
                icon = '🔄';
              } else if (n.type?.includes('SystemNotification')) {
                type = 'reminder';
                icon = '📝';
              }

              const isRead = n.read_at !== null;
              
              return (
                <div 
                  key={n.id} 
                  style={{
                    background: 'var(--card-bg)',
                    borderRadius:'16px',
                    padding:'20px',
                    border:`1px solid ${isRead ? 'var(--border-color)' : tc[type].b}`,
                    borderLeft:`4px solid ${tc[type].b}`,
                    display:'flex',
                    alignItems:'center',
                    gap:'16px',
                    opacity: isRead ? 0.7 : 1,
                    marginBottom:'12px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',background:tc[type].bg}}>{icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'700',color:'var(--text-main)'}}>{n.title}</div>
                    <div style={{fontSize:'14px',color:'#718EBF'}}>{n.content}</div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px'}}>
                    <span style={{color:'#B1B5C3',fontSize:'13px'}}>{formatRelativeTime(n.created_at)}</span>
                    <div style={{display:'flex', gap:'8px'}}>
                      {!isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(n.id)}
                          style={{background:'none', border:'none', color:'#1814F3', fontSize:'12px', fontWeight:'600', cursor:'pointer'}}
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteNotification(n.id)}
                        style={{background:'none', border:'none', color:'#FE5C73', fontSize:'12px', fontWeight:'600', cursor:'pointer'}}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{background:'var(--card-bg)', border:'1px dashed var(--border-color)', borderRadius:'16px', padding:'60px 20px', textAlign:'center', color:'#718EBF'}}>
              <div style={{fontSize:'40px', marginBottom:'16px'}}>🔔</div>
              <h3 style={{color:'var(--text-main)', marginBottom:'8px'}}>Không có thông báo</h3>
              <p style={{fontSize:'14px'}}>Bạn chưa nhận được thông báo nào từ hệ thống.</p>
            </div>
          )}
          {!isLoggedIn && <p style={{color:'#718EBF',textAlign:'center',padding:'40px',background: 'var(--card-bg)',borderRadius:'16px',border: `1px solid var(--border-color)`}}>{t('login_to_view_notifications')}</p>}
        </div>
      </main>

      {/* MODAL TẠO THÔNG BÁO */}
      {isModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background: 'var(--card-bg)',borderRadius:'24px',padding:'30px',width:'450px',maxWidth:'90%',boxShadow:'0 10px 40px rgba(0,0,0,0.1)'}}>
             <h2 style={{color:'var(--text-main)',marginBottom:'20px',fontSize:'20px',fontWeight:'700'}}>{t('send_system_notification')}</h2>
             
             <div style={{marginBottom:'15px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('title_label')}</label>
               <input type="text" value={newNotif.title} onChange={e=>setNewNotif({...newNotif,title:e.target.value})} placeholder={t('notif_title_placeholder')} style={{width:'100%',padding:'14px',border: `1px solid var(--border-color)`,borderRadius:'12px',background:'var(--input-bg)',color:'var(--text-main)',fontSize:'15px'}} />
             </div>

             <div style={{marginBottom:'25px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('content_label')}</label>
               <textarea value={newNotif.desc} onChange={e=>setNewNotif({...newNotif,desc:e.target.value})} placeholder={t('notif_content_placeholder')} style={{width:'100%',padding:'14px',border: `1px solid var(--border-color)`,borderRadius:'12px',background:'var(--input-bg)',color:'var(--text-main)',fontSize:'15px',minHeight:'100px',fontFamily:'inherit'}}></textarea>
             </div>
             
             <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
               <button style={{padding:'12px 24px',background:'var(--input-bg)',color:'#718EBF',borderRadius:'12px',border: `1px solid var(--border-color)`,cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={()=>setIsModalOpen(false)}>{t('cancel')}</button>
               <button style={{padding:'12px 24px',background:'#1814F3',color:'#fff',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={submitNotif}>{t('send_notification')}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

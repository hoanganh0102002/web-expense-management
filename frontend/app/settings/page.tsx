"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { authApi, notificationApi } from '../lib/api';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface SessionItem {
  id: string;
  device_type?: string;
  device_name?: string;
  is_current?: boolean;
  ip_address?: string;
  created_at: string;
}

export default function Settings() {
  const { isLoggedIn, userData, logout, logoutAll, updateUserPreference, updateUserProfile } = useAppContext();
  const { t, setLanguage: changeGlobalLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // State for Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for Sessions
  const [activeSessions, setActiveSessions] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // State for Activity Logs (Nhật ký hệ thống)
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logSearch, setLogSearch] = useState('');
  const [logGroup, setLogGroup] = useState('');
  const [logTotal, setLogTotal] = useState(0);
  const [logLastPage, setLogLastPage] = useState(1);

  const fetchActivityLogs = async (page = 1, search = '', group = '') => {
    setIsLoadingLogs(true);
    try {
      const res = await authApi.getActivityLogs({ page, search, group });
      if (res.data) {
        setActivityLogs(res.data.data || []);
        setLogTotal(res.data.total || 0);
        setLogLastPage(res.data.last_page || 1);
        setLogPage(res.data.current_page || page);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách nhật ký hoạt động:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const parseUserAgent = (userAgent: string) => {
    if (!userAgent) return 'Không xác định';
    const ua = userAgent.toLowerCase();
    let browser = 'Trình duyệt';
    let os = 'HĐH';

    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    else if (ua.includes('android')) os = 'Android';

    return `${browser} on ${os}`;
  };

  const getActionTitle = (action: string) => {
    const act = action.toLowerCase();
    switch (act) {
      case 'auth.login':
        return 'ĐĂNG NHẬP';
      case 'auth.logout':
        return 'ĐĂNG XUẤT';
      case 'auth.logout_all':
        return 'ĐĂNG XUẤT TẤT CẢ';
      case 'auth.change_password':
        return 'ĐỔI MẬT KHẨU';
      case 'auth.link_social':
        return 'LIÊN KẾT MẠNG XÃ HỘI';
      case 'user.update_avatar':
        return 'CẬP NHẬT ẢNH ĐẠI DIỆN';
      case 'user.update_profile':
        return 'CẬP NHẬT THÔNG TIN HỒ SƠ';
      case 'wallet.create':
        return 'TẠO VÍ MỚI';
      case 'wallet.update':
        return 'CẬP NHẬT VÍ';
      case 'wallet.delete':
        return 'XÓA VÍ';
      case 'wallet.set_default':
        return 'ĐẶT VÍ MẶC ĐỊNH';
      case 'transaction.create':
        return 'THÊM GIAO DỊCH';
      case 'transaction.update':
        return 'CẬP NHẬT GIAO DỊCH';
      case 'transaction.delete':
        return 'XÓA GIAO DỊCH';
      case 'transaction.import':
        return 'NHẬP GIAO DỊCH';
      case 'budget.create':
        return 'THIẾT LẬP NGÂN SÁCH';
      case 'budget.update':
        return 'CẬP NHẬT NGÂN SÁCH';
      case 'budget.delete':
        return 'XÓA NGÂN SÁCH';
      case 'savings.create':
        return 'TẠO TIẾT KIỆM';
      case 'savings.deposit':
        return 'TÍCH LŨY TIẾT KIỆM';
      case 'savings.withdraw':
        return 'RÚT TIỀN TIẾT KIỆM';
      case 'savings.delete':
        return 'XÓA MỤC TIÊU TIẾT KIỆM';
      case 'category.create':
        return 'TẠO DANH MỤC';
      case 'category.update':
        return 'CẬP NHẬT DANH MỤC';
      case 'category.delete':
        return 'XÓA DANH MỤC';
      default:
        const parts = act.split('.');
        const grp = parts[0] || '';
        const method = parts[1] || '';
        
        let grpName = grp.toUpperCase();
        if (grp === 'auth') grpName = 'BẢO MẬT';
        else if (grp === 'user') grpName = 'HỒ SƠ';
        else if (grp === 'wallet') grpName = 'VÍ';
        else if (grp === 'transaction') grpName = 'GIAO DỊCH';
        else if (grp === 'budget') grpName = 'NGÂN SÁCH';
        else if (grp === 'savings') grpName = 'TIẾT KIỆM';
        else if (grp === 'category') grpName = 'DANH MỤC';

        let methodName = method.toUpperCase();
        if (method === 'create') methodName = 'TẠO MỚI';
        else if (method === 'update') methodName = 'CẬP NHẬT';
        else if (method === 'delete') methodName = 'XÓA';
        
        return `${grpName} - ${methodName}`;
    }
  };

  const getActivityIcon = (action: string) => {
    const [category] = action.split('.');
    switch (category) {
      case 'auth':
        return (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
        );
      case 'wallet':
        return (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="10" x2="12" y2="10"/></svg>
          </div>
        );
      case 'transaction':
        return (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
          </div>
        );
      case 'budget':
        return (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
        );
      case 'savings':
        return (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path d="M12 7v5l3 3"/></svg>
          </div>
        );
      case 'category':
        return (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </div>
        );
      default:
        return (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(107, 114, 128, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
        );
    }
  };

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await authApi.getActiveSessions();
      if (res.data) {
        setActiveSessions(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách phiên đăng nhập:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'security' && isLoggedIn) {
      setTimeout(() => {
        fetchSessions();
      }, 0);
    }
    if (activeTab === 'activity' && isLoggedIn) {
      setTimeout(() => {
        fetchActivityLogs(logPage, logSearch, logGroup);
      }, 0);
    }
  }, [activeTab, logPage, logGroup, isLoggedIn]);

  const handleRevokeSession = async (sessionId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn đăng xuất thiết bị này?")) return;
    try {
      await authApi.revokeSession(sessionId);
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success("Đã đăng xuất thiết bị thành công!");
    } catch (error) {
      const errObj = error as Error;
      toast.error("Lỗi: " + errObj.message);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning(t('fill_all_password'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('password_mismatch'));
      return;
    }

    setIsChangingPwd(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword
      });
      toast.success(t('password_change_success'));
      logout();
    } catch (err) {
      const error = err as Error;
      toast.error(t('error_prefix') + error.message);
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm(t('delete_confirm_1'));
    if (!confirm1) return;

    const confirm2 = window.confirm(t('delete_confirm_2'));
    if (!confirm2) return;

    try {
      await authApi.deleteAccount();
      toast.success(t('account_deleted'));
      logout();
    } catch (err) {
      const error = err as Error;
      toast.error(t('delete_error') + error.message);
    }
  };

  // State for Profile
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [timezone, setTimezone] = useState('(GMT+07:00) Bangkok, Hanoi, Jakarta');
  const [language, setLanguage] = useState('Tiếng Việt');
  const [financialStartDay, setFinancialStartDay] = useState<number>(1);
  const [emailReminder, setEmailReminder] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState(false);
  const [recurringAlert, setRecurringAlert] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState('daily');
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state with userData when it changes
  React.useEffect(() => {
    if (userData) {
      setTimeout(() => {
        setFullName(userData.profile?.full_name || userData.full_name || '');
        setCurrency(userData.preference?.currency || 'VND');
        setTimezone(userData.preference?.timezone || '(GMT+07:00) Bangkok, Hanoi, Jakarta');
        setLanguage(userData.preference?.language === 'en' ? 'English' : 'Tiếng Việt');
        setFinancialStartDay(userData.preference?.financial_start_day || 1);
      }, 0);
      
      notificationApi.getPreferences().then(res => {
        if (res.data) {
          setEmailReminder(res.data.daily_reminder_enabled ?? false);
          
          const userId = userData?.user_id || userData?.id || 'default';
          const localBudgetAlert = localStorage.getItem(`budget_alert_enabled_${userId}`);
          const localRecurringAlert = localStorage.getItem(`recurring_alert_enabled_${userId}`);
          
          setBudgetAlert(localBudgetAlert !== null ? localBudgetAlert === 'true' : (res.data.budget_alert_enabled ?? true));
          setRecurringAlert(localRecurringAlert !== null ? localRecurringAlert === 'true' : (res.data.recurring_alert_enabled ?? true));
          
          setNotificationFrequency(res.data.notification_frequency || (res.data.weekly_summary_enabled ? 'weekly' : 'daily'));
        }
      }).catch(err => console.error("Lỗi lấy cài đặt thông báo:", err));
    }
  }, [userData]);

  const handleUpdateProfile = async (fieldSet: 'profile' | 'preferences') => {
    setIsUpdating(true);
    try {
      const payload = fieldSet === 'profile' 
        ? { full_name: fullName }
        : { currency: 'VND', timezone, language: language === 'Tiếng Việt' ? 'vi' : 'en', theme, financial_start_day: financialStartDay };
      
      await authApi.updateProfile(payload);
      
      if (fieldSet === 'profile') {
        updateUserProfile({ full_name: fullName });
      } else {
        updateUserPreference(payload);
      }
      toast.success(t('update_success'));
    } catch (err) {
      const error = err as Error;
      toast.error(t('error_prefix') + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setIsUpdating(true);
      const data = await authApi.updateAvatar(formData);
      if (data && data.data) {
        const updatedUser = { ...userData };
        updatedUser.profile = { ...updatedUser.profile, ...data.data };
        if (data.data.avatar_url) updatedUser.avatar_url = data.data.avatar_url;
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }
      toast.success(t('avatar_update_success'));
      window.location.reload();
    } catch (err) {
      const error = err as Error;
      toast.error(t('error_prefix') + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Lấy dữ liệu thật từ userData
  const profileFields: { label: string; value: string; setter?: (val: string) => void; disabled?: boolean; icon?: React.ReactNode }[] = [
    { 
      label: t('full_name'), 
      value: fullName, 
      setter: setFullName,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      )
    },
    { 
      label: t('email'), 
      value: userData?.email || t('not_updated'), 
      disabled: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      )
    },
  ];

  const displayName = userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user');

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="settings" />
      <main className="main-content" style={{ background: 'var(--bg-color)' }}>
        <nav className="navbar" style={{ background: 'transparent', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
          <h1 className="page-title" style={{ color: 'var(--text-main)', fontWeight: '800' }}>{t('settings_customize')}</h1>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }} className="search-bar">
              <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center', userSelect: 'none' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>{displayName}</span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=EM&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: theme === 'dark' ? '2px solid #0f172a' : '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none', color: '#fff', background: 'var(--active-blue)', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>{t('login')}</Link>
            )}
          </div>
        </nav>

        <div className="content-area">
          <div className="premium-card-settings" style={{ 
            borderRadius: '32px', 
            padding: '0', 
            position: 'relative', 
            overflow: 'hidden',
            backdropFilter: 'blur(30px)'
          }}>
            {/* Header Accent Decor */}
            <div style={{ height: '160px', background: 'var(--accent-gradient)', opacity: 0.1, position: 'absolute', top: 0, left: 0, right: 0 }}></div>
            {/* Fading overlay to eliminate the sharp line */}
            <div style={{ height: '60px', background: 'linear-gradient(to bottom, transparent, var(--card-bg))', position: 'absolute', top: '100px', left: 0, right: 0, pointerEvents: 'none' }}></div>
            <div className="settings-card-body" style={{ padding: '40px', position: 'relative', zIndex: 1 }}>
              {/* Tabs Navigation (Modern Pill Style) */}
              <div className="settings-tabs-wrapper" style={{ 
                display: 'inline-flex', 
                gap: '6px', 
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)', 
                padding: '6px', 
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                marginBottom: '40px',
                position: 'relative',
                zIndex: 2
              }}>
                {[
                  { k: 'profile', l: t('personal_info'), icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  ) },
                  { k: 'preferences', l: t('display_options'), icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  ) },
                  { k: 'notifications', l: t('notifications'), icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  ) },
                  { k: 'security', l: t('security'), icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  ) },
                  { k: 'activity', l: 'Nhật ký hoạt động', icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ) },
                ].map(tab => {
                  const isActive = activeTab === tab.k;
                  return (
                    <div
                      key={tab.k}
                      onClick={() => setActiveTab(tab.k)}
                      className="settings-tab-item"
                      style={{
                        padding: '10px 24px',
                        color: isActive 
                          ? (theme === 'dark' ? '#FFFFFF' : 'var(--active-blue)') 
                          : (theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'var(--text-light)'),
                        background: isActive 
                          ? (theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : '#FFFFFF') 
                          : 'transparent',
                        borderRadius: '10px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '145px',
                        boxShadow: (isActive && theme !== 'dark') ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                        border: isActive 
                          ? (theme === 'dark' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(45, 96, 255, 0.1)')
                          : '1px solid transparent'
                      }}
                    >
                      {tab.icon}
                      {tab.l}
                    </div>
                  );
                })}
              </div>

            {activeTab === 'profile' && (
              <div className="settings-profile-container" style={{ display: 'flex', gap: '60px', alignItems: 'flex-start' }}>
                {/* Avatar Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', minWidth: '200px' }}>
                  <div style={{ position: 'relative' }}>
                    <div className="avatar-ring-glow" style={{ width: '130px', height: '130px', borderRadius: '50%', padding: '4px' }}>
                      <img
                        src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=EM&backgroundColor=b6e3f4"}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: 'var(--card-bg)' }}
                      />
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAvatarChange} 
                      style={{ display: 'none' }} 
                      accept="image/*"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUpdating}
                      style={{ 
                        position: 'absolute', 
                        bottom: '5px', 
                        right: '5px', 
                        background: 'linear-gradient(135deg, #6366F1 0%, #16DBCC 100%)', 
                        border: 'none', 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer', 
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)', 
                        opacity: isUpdating ? 0.7 : 1,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '20px', fontWeight: '800' }}>{displayName}</h3>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-light)', fontSize: '13px' }}>{userData?.email || t('email_not_verified')}</p>
                    {isLoggedIn && (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        marginTop: '10px', 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        color: '#10B981', 
                        background: 'rgba(16, 185, 129, 0.08)', 
                        padding: '4px 12px', 
                        borderRadius: '20px',
                        border: '1px solid rgba(16, 185, 129, 0.12)'
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Thành viên EM
                      </span>
                    )}
                  </div>
                </div>

                {/* Form Section */}
                <div style={{ flex: 1 }}>
                  <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                    {profileFields.map((f, i) => (
                      <div key={i}>
                        <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '700', fontSize: '14px', letterSpacing: '0.3px' }}>{f.label}</label>
                        <div className="input-wrapper-premium">
                          {f.icon && (
                            <div className="input-icon-left">
                              {f.icon}
                            </div>
                          )}
                          <input
                            type="text"
                            value={f.value}
                            onChange={(e) => f.setter && f.setter(e.target.value)}
                            placeholder={isLoggedIn ? `${t('enter_placeholder')} ${f.label.toLowerCase()}...` : t('please_login')}
                            disabled={!isLoggedIn || f.disabled}
                            className="settings-input-premium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                      onClick={() => handleUpdateProfile('profile')}
                      disabled={isUpdating}
                      className="btn-premium-gradient"
                    >
                      {isUpdating ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                          {t('saving')}
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                          {t('save_changes')}
                        </>
                      )}
                    </button>
                    <button className="btn-premium-outline">
                      {t('cancel_changes')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div style={{ maxWidth: '750px' }}>
                <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '35px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '700', fontSize: '14px' }}>{t('currency_label')}</label>
                    <div className="input-wrapper-premium" style={{ background: 'rgba(0,0,0,0.05)', opacity: 0.7 }}>
                      <div className="input-icon-left">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                      </div>
                      <input 
                        type="text" 
                        value="VNĐ (₫)" 
                        disabled 
                        className="settings-input-premium" 
                        style={{ cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '700', fontSize: '14px' }}>{t('language_label')}</label>
                    <div className="input-wrapper-premium select-wrapper">
                      <div className="input-icon-left">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      </div>
                      <select 
                        disabled={!isLoggedIn} 
                        value={language}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLanguage(val);
                          changeGlobalLanguage(val === 'Tiếng Việt' ? 'vi' : 'en');
                        }}
                        className="settings-input-premium"
                      >
                        <option value="Tiếng Việt">Tiếng Việt</option>
                        <option value="English">English</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '700', fontSize: '14px' }}>Ngày bắt đầu tháng tài chính</label>
                    <div className="input-wrapper-premium select-wrapper">
                      <div className="input-icon-left">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <select 
                        disabled={!isLoggedIn} 
                        value={financialStartDay}
                        onChange={(e) => setFinancialStartDay(Number(e.target.value))}
                        className="settings-input-premium"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>Ngày {day} hàng tháng {day === 1 ? '(Mặc định)' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Switch Settings Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
                  
                  {/* Chế độ tối */}
                  <div className="settings-group-card-premium">
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '14px', 
                        background: theme === 'dark' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(99, 102, 241, 0.08)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: theme === 'dark' ? '#F59E0B' : '#6366F1',
                        transition: 'all 0.3s ease'
                      }}>
                        {theme === 'dark' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px', fontSize: '16px' }}>{t('dark_mode')}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '350px' }}>{t('dark_mode_desc')}</div>
                      </div>
                    </div>
                    <div 
                      onClick={toggleTheme}
                      className={`switch-toggle-premium ${theme === 'dark' ? 'active' : ''}`}
                    >
                      <div className="switch-knob"></div>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                  <button 
                    onClick={() => handleUpdateProfile('preferences')}
                    disabled={isUpdating}
                    className="btn-premium-gradient"
                  >
                    {isUpdating ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                        {t('saving')}
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        {t('save_preferences')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div style={{ maxWidth: '750px' }}>
                <h3 style={{ color: 'var(--text-main)', marginBottom: '25px', fontSize: '20px', fontWeight: '800' }}>{t('notifications')}</h3>
                
                {/* Switch Settings Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                  
                  {/* Email nhắc nhở */}
                  <div className="settings-group-card-premium" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '24px',
                    borderRadius: '20px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '16px', 
                        background: 'rgba(16, 185, 129, 0.08)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#10B981',
                        boxShadow: 'inset 0 2px 4px rgba(16, 185, 129, 0.04)'
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: '750', color: 'var(--text-main)', marginBottom: '6px', fontSize: '16px' }}>Email nhắc nhở chi tiêu</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: '1.4' }}>Nhận email nhắc nhở vào cuối ngày nếu bạn chưa nhập chi tiêu.</div>
                      </div>
                    </div>
                    <div 
                      onClick={async () => {
                        const val = !emailReminder;
                        setEmailReminder(val);
                        try {
                          await notificationApi.updatePreferences({ daily_reminder_enabled: val });
                        } catch (err) {
                          console.error("Lỗi cập nhật daily_reminder_enabled:", err);
                          setEmailReminder(!val);
                          toast.error("Không thể lưu cài đặt. Vui lòng thử lại!");
                        }
                      }}
                      className={`switch-toggle-premium ${emailReminder ? 'active' : ''}`}
                    >
                      <div className="switch-knob"></div>
                    </div>
                  </div>

                  {/* Cảnh báo vượt ngân sách */}
                  <div className="settings-group-card-premium" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '24px',
                    borderRadius: '20px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '16px', 
                        background: 'rgba(239, 68, 68, 0.08)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#EF4444',
                        boxShadow: 'inset 0 2px 4px rgba(239, 68, 68, 0.04)'
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: '750', color: 'var(--text-main)', marginBottom: '6px', fontSize: '16px' }}>Cảnh báo vượt ngân sách</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: '1.4' }}>Nhận cảnh báo qua email và ứng dụng khi đạt 80% hoặc vượt 100% ngân sách.</div>
                      </div>
                    </div>
                    <div 
                      onClick={async () => {
                        const val = !budgetAlert;
                        setBudgetAlert(val);
                        try {
                          await notificationApi.updatePreferences({ budget_alert_enabled: val });
                          const userId = userData?.user_id || userData?.id || 'default';
                          localStorage.setItem(`budget_alert_enabled_${userId}`, String(val));
                        } catch (err) {
                          console.error("Lỗi cập nhật budget_alert_enabled:", err);
                          setBudgetAlert(!val);
                          toast.error("Không thể lưu cài đặt. Vui lòng thử lại!");
                        }
                      }}
                      className={`switch-toggle-premium ${budgetAlert ? 'active' : ''}`}
                    >
                      <div className="switch-knob"></div>
                    </div>
                  </div>

                  {/* Giao dịch định kỳ */}
                  <div className="settings-group-card-premium" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '24px',
                    borderRadius: '20px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '16px', 
                        background: 'rgba(59, 130, 246, 0.08)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#3B82F6',
                        boxShadow: 'inset 0 2px 4px rgba(59, 130, 246, 0.04)'
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: '750', color: 'var(--text-main)', marginBottom: '6px', fontSize: '16px' }}>Thông báo giao dịch định kỳ</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: '1.4' }}>Nhận thông báo trong ứng dụng khi hệ thống tự động tạo giao dịch định kỳ.</div>
                      </div>
                    </div>
                    <div 
                      onClick={async () => {
                        const val = !recurringAlert;
                        setRecurringAlert(val);
                        try {
                          await notificationApi.updatePreferences({ recurring_alert_enabled: val });
                          const userId = userData?.user_id || userData?.id || 'default';
                          localStorage.setItem(`recurring_alert_enabled_${userId}`, String(val));
                        } catch (err) {
                          console.error("Lỗi cập nhật recurring_alert_enabled:", err);
                          setRecurringAlert(!val);
                          toast.error("Không thể lưu cài đặt. Vui lòng thử lại!");
                        }
                      }}
                      className={`switch-toggle-premium ${recurringAlert ? 'active' : ''}`}
                    >
                      <div className="switch-knob"></div>
                    </div>
                  </div>

                  {/* Tần suất nhận báo cáo */}
                  <div className="settings-group-card-premium" style={{
                    padding: '24px',
                    borderRadius: '20px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '16px', 
                        background: 'rgba(139, 92, 246, 0.08)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#8B5CF6',
                        boxShadow: 'inset 0 2px 4px rgba(139, 92, 246, 0.04)'
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: '750', color: 'var(--text-main)', marginBottom: '6px', fontSize: '16px' }}>Tần suất nhận báo cáo tổng hợp</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: '1.4' }}>Chọn mức độ thường xuyên bạn muốn nhận email tóm tắt chi tiêu.</div>
                      </div>
                    </div>
                    <div className="input-wrapper-premium select-wrapper" style={{ maxWidth: '320px', marginLeft: '72px' }}>
                      <div className="input-icon-left">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <select 
                        value={notificationFrequency}
                        onChange={async (e) => {
                          const val = e.target.value;
                          setNotificationFrequency(val);
                          try {
                            await notificationApi.updatePreferences({ notification_frequency: val });
                          } catch (err) {
                            console.error("Lỗi cập nhật notification_frequency:", err);
                            toast.error("Không thể lưu cài đặt. Vui lòng thử lại!");
                          }
                        }}
                        className="settings-input-premium"
                      >
                        <option value="daily">Hàng ngày</option>
                        <option value="weekly">Hàng tuần</option>
                        <option value="monthly">Hàng tháng</option>
                        <option value="never">Không bao giờ</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ maxWidth: '600px' }}>
                <h3 style={{ color: 'var(--text-main)', marginBottom: '25px', fontSize: '20px', fontWeight: '800' }}>{t('account_security')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '700', fontSize: '14px' }}>{t('current_password')}</label>
                    <div className="input-wrapper-premium">
                      <div className="input-icon-left">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        disabled={!isLoggedIn} 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="settings-input-premium"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}
                      >
                        {showCurrentPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '700', fontSize: '14px' }}>{t('new_password')}</label>
                    <div className="input-wrapper-premium">
                      <div className="input-icon-left">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                      </div>
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder={t('enter_new_password')} 
                        disabled={!isLoggedIn} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="settings-input-premium"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}
                      >
                        {showNewPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '700', fontSize: '14px' }}>{t('confirm_new_password')}</label>
                    <div className="input-wrapper-premium">
                      <div className="input-icon-left">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                      </div>
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder={t('confirm_password_again')} 
                        disabled={!isLoggedIn} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="settings-input-premium"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}
                      >
                        {showConfirmPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <button 
                      onClick={handleChangePassword}
                      disabled={isChangingPwd || !isLoggedIn}
                      className="btn-premium-gradient"
                      style={{ opacity: (isLoggedIn && !isChangingPwd) ? 1 : 0.5 }}
                    >
                      {isChangingPwd ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                          {t('updating')}
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          {t('update_password')}
                        </>
                      )}
                    </button>
                    <button 
                      onClick={logoutAll}
                      disabled={!isLoggedIn}
                      className="settings-destructive-btn"
                      style={{ opacity: isLoggedIn ? 1 : 0.5, marginTop: 0 }}
                    >
                      {t('revoke_all_devices')}
                    </button>
                  </div>
                </div>
                
                <div style={{ marginTop: '45px', paddingTop: '30px', borderTop: '1px solid var(--border-color)' }}>
                  <h3 style={{ color: 'var(--text-main)', marginBottom: '15px', fontSize: '18px', fontWeight: '800' }}>Quản lý phiên đăng nhập</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Danh sách các thiết bị đang đăng nhập vào tài khoản của bạn.</p>
                  
                  {isLoadingSessions ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải danh sách...</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {activeSessions.map((session) => (
                        <div key={session.id} className="session-card-premium">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
                              {session.device_type === 'desktop' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '15px', display: 'flex', alignItems: 'center' }}>
                                {session.device_name || session.device_type || 'Thiết bị không xác định'}
                                {session.is_current && (
                                  <span style={{ 
                                    marginLeft: '8px', 
                                    fontSize: '11px', 
                                    padding: '2px 8px', 
                                    background: 'rgba(16, 185, 129, 0.08)', 
                                    color: '#10B981', 
                                    borderRadius: '10px',
                                    fontWeight: '700',
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                  }}>
                                    <span className="pulse-online-dot"></span>
                                    Hiện tại
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                IP: {session.ip_address} • Đăng nhập: {new Date(session.created_at).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          </div>
                          {!session.is_current && (
                            <button 
                              onClick={() => handleRevokeSession(session.id)}
                              style={{ background: 'transparent', border: '1px solid #FE5C73', color: '#FE5C73', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s' }}
                              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(254, 92, 115, 0.08)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              Đăng xuất
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="alert-card-destructive">
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(254, 92, 115, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FE5C73', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div>
                      <h3 style={{ color: '#FE5C73', margin: '0 0 6px', fontSize: '18px', fontWeight: '800' }}>{t('delete_account')}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 15px', lineHeight: '1.5' }}>{t('delete_account_warning')}</p>
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={!isLoggedIn}
                        className="settings-destructive-btn"
                        style={{ padding: '12px 25px', borderRadius: '12px', opacity: isLoggedIn ? 1 : 0.5, marginTop: 0 }}
                      >
                        {t('delete_account_now')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'activity' && (
              <div style={{ width: '100%' }}>
                <h3 style={{ color: 'var(--text-main)', marginBottom: '25px', fontSize: '20px', fontWeight: '800' }}>Nhật ký hoạt động hệ thống</h3>
                
                {/* Search and Filters */}
                <div style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  marginBottom: '30px', 
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  {/* Search Input */}
                  <div className="input-wrapper-premium" style={{ flex: 1, minWidth: '250px' }}>
                    <div className="input-icon-left">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm hành động hoặc chi tiết..." 
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setLogPage(1);
                          fetchActivityLogs(1, logSearch, logGroup);
                        }
                      }}
                      className="settings-input-premium"
                    />
                  </div>

                  {/* Group Select */}
                  <div className="input-wrapper-premium select-wrapper" style={{ width: '220px' }}>
                    <div className="input-icon-left">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                    </div>
                    <select 
                      value={logGroup}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLogGroup(val);
                        setLogPage(1);
                        fetchActivityLogs(1, logSearch, val);
                      }}
                      className="settings-input-premium"
                    >
                      <option value="">Tất cả phân nhóm</option>
                      <option value="auth">Đăng nhập & Bảo mật</option>
                      <option value="wallet">Ví & Chuyển tiền</option>
                      <option value="transaction">Giao dịch thu chi</option>
                      <option value="budget">Ngân sách hạn mức</option>
                      <option value="savings">Tích lũy heo đất</option>
                      <option value="category">Danh mục chi tiêu</option>
                    </select>
                  </div>

                  {/* Filter Button */}
                  <button 
                    onClick={() => {
                      setLogPage(1);
                      fetchActivityLogs(1, logSearch, logGroup);
                    }}
                    className="btn-premium-gradient"
                    style={{ height: '48px', padding: '0 24px', borderRadius: '14px', whiteSpace: 'nowrap' }}
                  >
                    Lọc dữ liệu
                  </button>
                </div>

                {isLoadingLogs ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite', marginBottom: '15px' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    <div>Đang lấy dữ liệu nhật ký hệ thống...</div>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div style={{ 
                    padding: '60px 20px', 
                    textAlign: 'center', 
                    background: 'var(--card-bg)', 
                    borderRadius: '24px',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)'
                  }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '15px', opacity: 0.5 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>Không tìm thấy nhật ký hoạt động nào</div>
                    <p style={{ fontSize: '13px', marginTop: '5px' }}>Thử thay đổi từ khóa hoặc bộ lọc phân nhóm của bạn.</p>
                  </div>
                ) : (
                  <div>
                    {/* Timeline Wrapper */}
                    <div style={{ 
                      position: 'relative', 
                      paddingLeft: '35px', 
                      margin: '20px 0 40px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px'
                    }}>
                      {/* Vertical line decor */}
                      <div style={{ 
                        position: 'absolute', 
                        left: '0px', 
                        top: '15px', 
                        bottom: '15px', 
                        width: '2px', 
                        background: 'linear-gradient(to bottom, #6366F1 0%, rgba(99, 102, 241, 0.05) 100%)',
                        borderRadius: '1px'
                      }}></div>

                      {activityLogs.map((log) => (
                        <div key={log.id} style={{ position: 'relative', display: 'flex', gap: '20px' }}>
                          {/* Dot on line */}
                          <div style={{ 
                            position: 'absolute', 
                            left: '-35px', 
                            top: '4px',
                            zIndex: 2,
                            transform: 'translateX(-50%)'
                          }}>
                            {getActivityIcon(log.action)}
                          </div>

                          {/* Log Content Card */}
                          <div className="activity-card-premium" style={{ 
                            flex: 1, 
                            background: 'var(--card-bg)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '18px', 
                            padding: '18px 24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '15px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
                            transition: 'all 0.2s ease-in-out'
                          }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                <span style={{ 
                                  fontWeight: '800', 
                                  color: 'var(--text-main)', 
                                  fontSize: '15px' 
                                }}>
                                  {getActionTitle(log.action)}
                                </span>
                              </div>
                              <p style={{ 
                                margin: 0, 
                                color: 'var(--text-main)', 
                                fontSize: '14.5px',
                                lineHeight: '1.5',
                                fontWeight: '500'
                              }}>
                                {log.description}
                              </p>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '15px', 
                                marginTop: '10px',
                                fontSize: '12px',
                                color: 'var(--text-muted)'
                              }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  🖥️ {parseUserAgent(log.user_agent)}
                                </span>
                              </div>
                            </div>

                            {/* Time Badge */}
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ 
                                fontSize: '13px', 
                                fontWeight: '700', 
                                color: '#6366F1',
                                background: 'rgba(99, 102, 241, 0.08)',
                                padding: '6px 14px',
                                borderRadius: '12px',
                                display: 'inline-block'
                              }}>
                                {new Date(log.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {logLastPage > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '30px' }}>
                        <button 
                          onClick={() => {
                            if (logPage > 1) {
                              setLogPage(logPage - 1);
                              fetchActivityLogs(logPage - 1, logSearch, logGroup);
                            }
                          }}
                          disabled={logPage === 1}
                          className="btn-premium-outline"
                          style={{ minWidth: '100px', opacity: logPage === 1 ? 0.5 : 1 }}
                        >
                          Trước
                        </button>
                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                          Trang {logPage} / {logLastPage}
                        </span>
                        <button 
                          onClick={() => {
                            if (logPage < logLastPage) {
                              setLogPage(logPage + 1);
                              fetchActivityLogs(logPage + 1, logSearch, logGroup);
                            }
                          }}
                          disabled={logPage === logLastPage}
                          className="btn-premium-outline"
                          style={{ minWidth: '100px', opacity: logPage === logLastPage ? 0.5 : 1 }}
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

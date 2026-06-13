"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { authApi, notificationApi } from '../lib/api';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { isLoggedIn, userData, logout, logoutAll, updateUserPreference, updateUserProfile } = useAppContext();
  const { t, setLanguage: changeGlobalLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  // State for Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert(t('fill_all_password'));
      return;
    }
    if (newPassword !== confirmPassword) {
      alert(t('password_mismatch'));
      return;
    }

    setIsChangingPwd(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword
      });
      alert(t('password_change_success'));
      logout();
    } catch (err: any) {
      alert(t('error_prefix') + err.message);
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
      alert(t('account_deleted'));
      logout();
    } catch (err: any) {
      alert(t('delete_error') + err.message);
    }
  };

  // State for Profile
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [timezone, setTimezone] = useState('(GMT+07:00) Bangkok, Hanoi, Jakarta');
  const [language, setLanguage] = useState('Tiếng Việt');
  const [emailReminder, setEmailReminder] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState(false);
  const [recurringAlert, setRecurringAlert] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState('daily');
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state with userData when it changes
  React.useEffect(() => {
    if (userData) {
      setFullName(userData.profile?.full_name || userData.full_name || '');
      setCurrency(userData.preference?.currency || 'VND');
      setTimezone(userData.preference?.timezone || '(GMT+07:00) Bangkok, Hanoi, Jakarta');
      setLanguage(userData.preference?.language === 'en' ? 'English' : 'Tiếng Việt');
      
      // Fetch notification preferences from API
      notificationApi.getPreferences().then(res => {
        if (res.data) {
          setEmailReminder(res.data.daily_reminder_enabled ?? false);
          setBudgetAlert(res.data.budget_alert_enabled ?? true);
          setRecurringAlert(res.data.recurring_alert_enabled ?? true);
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
        : { currency, timezone, language: language === 'Tiếng Việt' ? 'vi' : 'en', theme };
      
      await authApi.updateProfile(payload);
      
      if (fieldSet === 'profile') {
        updateUserProfile({ full_name: fullName });
      } else {
        updateUserPreference(payload);
      }
      alert(t('update_success'));
    } catch (err: any) {
      alert(t('error_prefix') + err.message);
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
      alert(t('avatar_update_success'));
      window.location.reload();
    } catch (err: any) {
      alert(t('error_prefix') + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Lấy dữ liệu thật từ userData
  const profileFields = [
    { label: t('full_name'), value: fullName, setter: setFullName },
    { label: t('email'), value: userData?.email || t('not_updated'), disabled: true },
    { label: t('phone'), value: userData?.phone || '0', disabled: true },
    { label: t('address'), value: userData?.address || t('not_updated'), disabled: true },
  ];

  const displayName = userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user');

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="settings" />
      <main className="main-content" style={{ background: 'var(--bg-color)' }}>
        <nav className="navbar" style={{ background: 'transparent', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
          <h1 className="page-title" style={{ color: 'var(--text-main)', fontWeight: '800' }}>{t('settings_customize')}</h1>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Notification Icon */}
            <Link href="/notifications" style={{background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F5F7FA', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb300', cursor: 'pointer', fontSize: '20px', textDecoration: 'none'}}>
              🔔
            </Link>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>{displayName}</span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: theme === 'dark' ? '2px solid #0f172a' : '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none', color: '#fff', background: 'var(--active-blue)', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>{t('login')}</Link>
            )}
          </div>
        </nav>

        <div className="content-area">
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(99, 102, 241, 0) 50%), var(--card-bg)', 
            borderRadius: '32px', 
            padding: '0', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', 
            border: '1px solid var(--border-color)', 
            position: 'relative', 
            overflow: 'hidden',
            backdropFilter: 'blur(30px)'
          }}>
            {/* Header Accent Decor */}
            <div style={{ height: '160px', background: 'var(--accent-gradient)', opacity: 0.1, position: 'absolute', top: 0, left: 0, right: 0 }}></div>
            {/* Fading overlay to eliminate the sharp line */}
            <div style={{ height: '60px', background: 'linear-gradient(to bottom, transparent, var(--card-bg))', position: 'absolute', top: '100px', left: 0, right: 0, pointerEvents: 'none' }}></div>
            <div style={{ padding: '40px', position: 'relative', zIndex: 1 }}>
              {/* Tabs Navigation (Modern Pill Style) */}
              <div style={{ 
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
                  { k: 'profile', l: t('personal_info') },
                  { k: 'preferences', l: t('display_options') },
                  { k: 'security', l: t('security') },
                ].map(tab => {
                  const isActive = activeTab === tab.k;
                  return (
                    <div
                      key={tab.k}
                      onClick={() => setActiveTab(tab.k)}
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
                        minWidth: '130px',
                        boxShadow: (isActive && theme !== 'dark') ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                        border: isActive 
                          ? (theme === 'dark' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(45, 96, 255, 0.1)')
                          : '1px solid transparent'
                      }}
                    >
                      {tab.l}
                    </div>
                  );
                })}
              </div>

            {activeTab === 'profile' && (
              <div style={{ display: 'flex', gap: '60px', alignItems: 'flex-start' }}>
                {/* Avatar Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '130px', height: '130px', borderRadius: '50%', padding: '4px', border: `2px solid var(--active-blue)` }}>
                      <img
                        src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
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
                      style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'var(--active-blue)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', opacity: isUpdating ? 0.7 : 1 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px' }}>{displayName}</h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '13px' }}>{userData?.email || t('email_not_verified')}</p>
                  </div>
                </div>

                {/* Form Section */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                    {profileFields.map((f: any, i) => (
                      <div key={i}>
                        <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '600', fontSize: '15px' }}>{f.label}</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={f.value}
                            onChange={(e) => f.setter && f.setter(e.target.value)}
                            placeholder={isLoggedIn ? `${t('enter_placeholder')} ${f.label.toLowerCase()}...` : t('please_login')}
                            disabled={!isLoggedIn || f.disabled}
                            className="settings-input"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                      onClick={() => handleUpdateProfile('profile')}
                      disabled={isUpdating}
                      style={{ 
                        padding: '14px 35px', 
                        background: theme === 'dark' ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'linear-gradient(135deg, #2D60FF 0%, #1814F3 100%)', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '15px', 
                        fontWeight: '700', 
                        cursor: 'pointer', 
                        fontSize: '15px', 
                        boxShadow: theme === 'dark' ? '0 4px 15px rgba(99, 102, 241, 0.25)' : '0 4px 15px rgba(45, 96, 255, 0.25)', 
                        transition: 'all 0.25s ease', 
                        opacity: isUpdating ? 0.7 : 1 
                      }}>
                      {isUpdating ? t('saving') : t('save_changes')}
                    </button>
                    <button style={{ 
                      padding: '14px 35px', 
                      background: 'transparent', 
                      color: 'var(--text-light)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '15px', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      fontSize: '15px',
                      transition: 'all 0.25s ease'
                    }}>{t('cancel_changes')}</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div style={{ maxWidth: '700px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '600', fontSize: '15px' }}>{t('currency_label')}</label>
                    <div className="select-wrapper">
                      <select 
                        disabled={!isLoggedIn} 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="settings-select"
                      >
                        <option value="VND">VNĐ (₫)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '600', fontSize: '15px' }}>{t('language_label')}</label>
                    <div className="select-wrapper">
                      <select 
                        disabled={!isLoggedIn} 
                        value={language}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLanguage(val);
                          changeGlobalLanguage(val === 'Tiếng Việt' ? 'vi' : 'en');
                        }}
                        className="settings-select"
                      >
                        <option value="Tiếng Việt">Tiếng Việt</option>
                        <option value="English">English</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="settings-group-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '17px' }}>{t('dark_mode')}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px' }}>{t('dark_mode_desc')}</div>
                  </div>
                  <div 
                    onClick={toggleTheme}
                    style={{ width: '56px', height: '30px', borderRadius: '15px', background: theme === 'dark' ? 'var(--active-blue)' : '#E2E8F0', position: 'relative', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '4px', left: theme === 'dark' ? '30px' : '4px', transition: '0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}></div>
                  </div>
                </div>

                <div style={{ marginTop: '35px', borderTop: '1px solid var(--border-color)', paddingTop: '25px' }}>
                  <h3 style={{ color: 'var(--text-main)', marginBottom: '20px', fontSize: '18px' }}>Cài đặt thông báo</h3>
                  
                  <div className="settings-group-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '17px' }}>Email nhắc nhở chi tiêu</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '350px' }}>Nhận email nhắc nhở vào cuối ngày nếu bạn chưa nhập chi tiêu.</div>
                    </div>
                    <div 
                      onClick={async () => {
                        const val = !emailReminder;
                        setEmailReminder(val);
                        try {
                          await notificationApi.updatePreferences({ daily_reminder_enabled: val });
                        } catch (err) {
                          console.error("Lỗi cập nhật email reminder:", err);
                          setEmailReminder(!val);
                          alert("Không thể lưu cài đặt. Vui lòng thử lại!");
                        }
                      }}
                      style={{ width: '56px', height: '30px', borderRadius: '15px', background: emailReminder ? 'var(--active-blue)' : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0'), position: 'relative', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '4px', left: emailReminder ? '30px' : '4px', transition: '0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}></div>
                    </div>
                  </div>

                  <div className="settings-group-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '17px' }}>Cảnh báo vượt ngân sách</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '350px' }}>Nhận cảnh báo qua email và ứng dụng khi đạt 80% hoặc vượt 100% ngân sách.</div>
                    </div>
                    <div 
                      onClick={async () => {
                        const val = !budgetAlert;
                        setBudgetAlert(val);
                        try {
                          await notificationApi.updatePreferences({ budget_alert_enabled: val });
                        } catch (err) {
                          setBudgetAlert(!val);
                          alert("Không thể lưu cài đặt. Vui lòng thử lại!");
                        }
                      }}
                      style={{ width: '56px', height: '30px', borderRadius: '15px', background: budgetAlert ? 'var(--active-blue)' : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0'), position: 'relative', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '4px', left: budgetAlert ? '30px' : '4px', transition: '0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}></div>
                    </div>
                  </div>

                  <div className="settings-group-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '17px' }}>Thông báo giao dịch định kỳ</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '350px' }}>Nhận thông báo trong ứng dụng khi hệ thống tự động tạo giao dịch định kỳ.</div>
                    </div>
                    <div 
                      onClick={async () => {
                        const val = !recurringAlert;
                        setRecurringAlert(val);
                        try {
                          await notificationApi.updatePreferences({ recurring_alert_enabled: val });
                        } catch (err) {
                          setRecurringAlert(!val);
                          alert("Không thể lưu cài đặt. Vui lòng thử lại!");
                        }
                      }}
                      style={{ width: '56px', height: '30px', borderRadius: '15px', background: recurringAlert ? 'var(--active-blue)' : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0'), position: 'relative', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '4px', left: recurringAlert ? '30px' : '4px', transition: '0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}></div>
                    </div>
                  </div>

                  <div className="settings-group-card">
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '17px' }}>Tần suất nhận báo cáo tổng hợp</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>Chọn mức độ thường xuyên bạn muốn nhận email tóm tắt chi tiêu.</div>
                    <div className="select-wrapper">
                      <select 
                        value={notificationFrequency}
                        onChange={async (e) => {
                          const val = e.target.value;
                          setNotificationFrequency(val);
                          try {
                            await notificationApi.updatePreferences({ notification_frequency: val });
                          } catch (err) {
                            alert("Không thể lưu cài đặt. Vui lòng thử lại!");
                          }
                        }}
                        className="settings-select"
                      >
                        <option value="daily">Hàng ngày</option>
                        <option value="weekly">Hàng tuần</option>
                        <option value="monthly">Hàng tháng</option>
                        <option value="never">Không bao giờ</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleUpdateProfile('preferences')}
                  disabled={isUpdating}
                  style={{ 
                    marginTop: '20px', 
                    padding: '16px 40px', 
                    background: theme === 'dark' ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'linear-gradient(135deg, #2D60FF 0%, #1814F3 100%)', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '16px', 
                    fontWeight: '700', 
                    cursor: 'pointer', 
                    fontSize: '15px', 
                    boxShadow: theme === 'dark' ? '0 10px 20px -5px rgba(99, 102, 241, 0.3)' : '0 10px 20px -5px rgba(45, 96, 255, 0.3)',
                    transition: 'all 0.25s ease',
                    opacity: isUpdating ? 0.7 : 1 
                  }}>
                  {t('save_preferences')}
                </button>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ maxWidth: '600px' }}>
                <h3 style={{ color: 'var(--text-main)', marginBottom: '25px', fontSize: '20px' }}>{t('account_security')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>{t('current_password')}</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      disabled={!isLoggedIn} 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="settings-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>{t('new_password')}</label>
                    <input 
                      type="password" 
                      placeholder={t('enter_new_password')} 
                      disabled={!isLoggedIn} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="settings-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>{t('confirm_new_password')}</label>
                    <input 
                      type="password" 
                      placeholder={t('confirm_password_again')} 
                      disabled={!isLoggedIn} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="settings-input"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                      onClick={handleChangePassword}
                      disabled={isChangingPwd || !isLoggedIn}
                      style={{ 
                        width: 'fit-content', 
                        padding: '14px 30px', 
                        background: theme === 'dark' ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'linear-gradient(135deg, #2D60FF 0%, #1814F3 100%)', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '15px', 
                        fontWeight: '700', 
                        cursor: 'pointer', 
                        marginTop: '10px', 
                        boxShadow: theme === 'dark' ? '0 4px 15px rgba(99, 102, 241, 0.25)' : '0 4px 15px rgba(45, 96, 255, 0.25)',
                        transition: 'all 0.25s ease',
                        opacity: (isLoggedIn && !isChangingPwd) ? 1 : 0.5 
                      }}>
                      {isChangingPwd ? t('updating') : t('update_password')}
                    </button>
                    <button 
                      onClick={logoutAll}
                      disabled={!isLoggedIn}
                      className="settings-destructive-btn"
                      style={{ opacity: isLoggedIn ? 1 : 0.5 }}
                    >
                      {t('revoke_all_devices')}
                    </button>
                  </div>
                </div>
                
                <div style={{ marginTop: '45px', paddingTop: '30px', borderTop: '1px solid var(--border-color)' }}>
                  <h3 style={{ color: '#FE5C73', marginBottom: '10px', fontSize: '18px' }}>{t('delete_account')}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>{t('delete_account_warning')}</p>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={!isLoggedIn}
                    className="settings-destructive-btn"
                    style={{ padding: '12px 25px', borderRadius: '12px', opacity: isLoggedIn ? 1 : 0.5 }}
                  >
                    {t('delete_account_now')}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

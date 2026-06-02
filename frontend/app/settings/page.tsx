"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { authApi } from '../lib/api';
import { useAppContext } from '../context/AppContext';

export default function Settings() {
  const { isLoggedIn, userData, logout, logoutAll } = useAppContext();
  const [activeTab, setActiveTab] = useState('profile');

  // State for Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin mật khẩu!');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    setIsChangingPwd(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword
      });
      alert('Đổi mật khẩu thành công! Bạn sẽ được đăng xuất để bảo mật.');
      logout();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA TÀI KHOẢN? Hành động này không thể hoàn tác và toàn bộ dữ liệu giao dịch, ví tiền sẽ bị xóa sạch.');
    if (!confirm1) return;

    const confirm2 = window.confirm('XÁC NHẬN LẦN CUỐI: Bạn thực sự muốn xóa vĩnh viễn tài khoản SpendWise chứ?');
    if (!confirm2) return;

    try {
      await authApi.deleteAccount();
      alert('Tài khoản của bạn đã được xóa vĩnh viễn khỏi hệ thống.');
      logout();
    } catch (err: any) {
      alert('Lỗi khi xóa tài khoản: ' + err.message);
    }
  };

  // State for Profile
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('VNĐ (₫)');
  const [timezone, setTimezone] = useState('(GMT+07:00) Bangkok, Hanoi, Jakarta');
  const [language, setLanguage] = useState('Tiếng Việt');
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state with userData when it changes
  React.useEffect(() => {
    if (userData) {
      setFullName(userData.profile?.full_name || userData.full_name || '');
      setCurrency(userData.preference?.currency || 'VNĐ (₫)');
      setTimezone(userData.preference?.timezone || '(GMT+07:00) Bangkok, Hanoi, Jakarta');
      setLanguage(userData.preference?.language || 'Tiếng Việt');
    }
  }, [userData]);

  const handleUpdateProfile = async (fieldSet: 'profile' | 'preferences') => {
    setIsUpdating(true);
    try {
      const payload = fieldSet === 'profile' 
        ? { full_name: fullName }
        : { currency, timezone, language: language === 'Tiếng Việt' ? 'vi' : 'en' };
      
      const response = await authApi.updateProfile(payload);
      
      // Update local userData
      const updatedUser = { ...userData };
      if (fieldSet === 'profile') {
        updatedUser.profile = { ...updatedUser.profile, full_name: fullName };
      } else {
        updatedUser.preference = { ...updatedUser.preference, ...payload };
      }
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      alert('Cập nhật thành công!');
      window.location.reload(); // Refresh to update all components
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
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
      alert('Cập nhật ảnh đại diện thành công!');
      window.location.reload();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Lấy dữ liệu thật từ userData
  const profileFields = [
    { label: 'Họ tên', value: fullName, setter: setFullName },
    { label: 'Email', value: userData?.email || 'Chưa cập nhật', disabled: true },
    { label: 'Số điện thoại', value: userData?.phone || '0', disabled: true },
    { label: 'Địa chỉ', value: userData?.address || 'Chưa cập nhật', disabled: true },
  ];

  const displayName = userData?.profile?.full_name || userData?.full_name || userData?.name || 'Người dùng mới';

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="settings" />
      <main className="main-content" style={{ background: '#FFFFFF' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>Cài đặt & Tùy chỉnh</h1>
          <div className="nav-actions">
            {isLoggedIn ? (
              <div style={{ position: 'relative' }}>
                <img src={userData?.profile?.avatar_url || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
              </div>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none', color: '#fff', background: '#343C6A', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>Đăng nhập</Link>
            )}
          </div>
        </nav>

        <div className="content-area">
          <div className="settings-card" style={{ background: '#fff', borderRadius: '24px', padding: '40px', border: '1px solid #E6EFF5', boxShadow: '0 2px 15px rgba(0,0,0,0.02)' }}>
            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '40px', borderBottom: '2px solid #F4F7FE', marginBottom: '40px' }}>
              {[
                { k: 'profile', l: 'Thông tin cá nhân' },
                { k: 'preferences', l: 'Tùy chọn hiển thị' },
                { k: 'security', l: 'Bảo mật' },
              ].map(tab => (
                <div
                  key={tab.k}
                  onClick={() => setActiveTab(tab.k)}
                  style={{
                    paddingBottom: '20px',
                    color: activeTab === tab.k ? '#1814F3' : '#718EBF',
                    borderBottom: activeTab === tab.k ? '3px solid #1814F3' : '3px solid transparent',
                    fontWeight: activeTab === tab.k ? '700' : '500',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.3s'
                  }}
                >
                  {tab.l}
                </div>
              ))}
            </div>

            {activeTab === 'profile' && (
              <div style={{ display: 'flex', gap: '60px', alignItems: 'flex-start' }}>
                {/* Avatar Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '130px', height: '130px', borderRadius: '50%', padding: '4px', border: '2px solid #1814F3' }}>
                      <img
                        src={userData?.profile?.avatar_url || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"}
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
                      style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#1814F3', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', opacity: isUpdating ? 0.7 : 1 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: 0, color: '#343C6A', fontSize: '18px' }}>{displayName}</h3>
                    <p style={{ margin: '4px 0 0', color: '#718EBF', fontSize: '13px' }}>{userData?.email || 'Email chưa xác thực'}</p>
                  </div>
                </div>

                {/* Form Section */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                    {profileFields.map((f: any, i) => (
                      <div key={i}>
                        <label style={{ display: 'block', marginBottom: '10px', color: '#343C6A', fontWeight: '600', fontSize: '15px' }}>{f.label}</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={f.value}
                            onChange={(e) => f.setter && f.setter(e.target.value)}
                            placeholder={isLoggedIn ? `Nhập ${f.label.toLowerCase()}...` : 'Vui lòng đăng nhập'}
                            disabled={!isLoggedIn || f.disabled}
                            style={{
                              width: '100%',
                              padding: '14px 18px',
                              border: '1px solid #E6EFF5',
                              borderRadius: '15px',
                              background: f.disabled ? '#F4F7FE' : '#F8F9FB',
                              color: '#343C6A',
                              fontSize: '15px',
                              fontWeight: '500'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                      onClick={() => handleUpdateProfile('profile')}
                      disabled={isUpdating}
                      style={{ padding: '14px 35px', background: '#1814F3', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 15px rgba(24, 20, 243, 0.25)', transition: 'transform 0.2s', opacity: isUpdating ? 0.7 : 1 }}>
                      {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button style={{ padding: '14px 35px', background: '#F8F9FB', color: '#718EBF', border: '1px solid #E6EFF5', borderRadius: '15px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>Hủy bỏ</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div style={{ maxWidth: '700px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: '#343C6A', fontWeight: '600', fontSize: '15px' }}>Đơn vị tiền tệ</label>
                    <select 
                      disabled={!isLoggedIn} 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      style={{ width: '100%', padding: '14px', border: '1px solid #E6EFF5', borderRadius: '15px', background: '#F8F9FB', color: '#343C6A', fontSize: '15px', appearance: 'none' }}>
                      <option>VNĐ (₫)</option><option>USD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: '#343C6A', fontWeight: '600', fontSize: '15px' }}>Ngôn ngữ</label>
                    <select 
                      disabled={!isLoggedIn} 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      style={{ width: '100%', padding: '14px', border: '1px solid #E6EFF5', borderRadius: '15px', background: '#F8F9FB', color: '#343C6A', fontSize: '15px', appearance: 'none' }}>
                      <option>Tiếng Việt</option><option>English</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '30px', padding: '24px', background: '#F8F9FB', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#343C6A', marginBottom: '4px' }}>Chế độ tối (Dark Mode)</div>
                    <div style={{ fontSize: '13px', color: '#718EBF' }}>Giảm mỏi mắt và tiết kiệm pin trên màn hình OLED</div>
                  </div>
                  <div style={{ width: '50px', height: '26px', borderRadius: '13px', background: isLoggedIn ? '#1814F3' : '#E6EFF5', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: isLoggedIn ? '27px' : '3px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                  </div>
                </div>
                <button 
                  onClick={() => handleUpdateProfile('preferences')}
                  disabled={isUpdating}
                  style={{ marginTop: '30px', padding: '14px 35px', background: '#1814F3', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', opacity: isUpdating ? 0.7 : 1 }}>
                  Lưu tùy chọn
                </button>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ maxWidth: '600px' }}>
                <h3 style={{ color: '#343C6A', marginBottom: '25px', fontSize: '20px' }}>Bảo mật tài khoản</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: '#343C6A', fontWeight: '600', fontSize: '14px' }}>Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      disabled={!isLoggedIn} 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{ width: '100%', padding: '14px', border: '1px solid #E6EFF5', borderRadius: '15px', background: '#F8F9FB' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: '#343C6A', fontWeight: '600', fontSize: '14px' }}>Mật khẩu mới</label>
                    <input 
                      type="password" 
                      placeholder="Nhập mật khẩu mới..." 
                      disabled={!isLoggedIn} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '14px', border: '1px solid #E6EFF5', borderRadius: '15px', background: '#F8F9FB' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: '#343C6A', fontWeight: '600', fontSize: '14px' }}>Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      placeholder="Nhập lại mật khẩu mới..." 
                      disabled={!isLoggedIn} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ width: '100%', padding: '14px', border: '1px solid #E6EFF5', borderRadius: '15px', background: '#F8F9FB' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                      onClick={handleChangePassword}
                      disabled={isChangingPwd}
                      style={{ width: 'fit-content', padding: '14px 30px', background: '#1814F3', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px', opacity: (isLoggedIn && !isChangingPwd) ? 1 : 0.5 }}>
                      {isChangingPwd ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                    <button 
                      onClick={logoutAll}
                      style={{ width: 'fit-content', padding: '14px 30px', background: '#FFE0EB', color: '#FE5C73', border: '1px solid #FE5C73', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px', opacity: isLoggedIn ? 1 : 0.5 }}>
                      Thu hồi tất cả thiết bị
                    </button>
                  </div>
                </div>
                
                <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '2px solid #F4F7FE' }}>
                  <h3 style={{ color: '#FE5C73', marginBottom: '10px', fontSize: '18px' }}>Xóa tài khoản</h3>
                  <p style={{ fontSize: '14px', color: '#718EBF', marginBottom: '20px' }}>Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu giao dịch và ví của bạn.</p>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={!isLoggedIn}
                    style={{ padding: '12px 25px', background: '#FFE0EB', color: '#FE5C73', border: '1px solid #FE5C73', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', opacity: isLoggedIn ? 1 : 0.5 }}>
                    Xóa tài khoản ngay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

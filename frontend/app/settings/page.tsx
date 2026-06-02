"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

export default function Settings() {
  const { isLoggedIn, userData } = useAppContext();
  const [activeTab, setActiveTab] = useState('profile');

  // Lấy dữ liệu thật từ userData
  const profileFields = [
    { label: 'Họ tên', value: userData?.full_name || userData?.name || 'Chưa cập nhật' },
    { label: 'Email', value: userData?.email || 'Chưa cập nhật' },
    { label: 'Số điện thoại', value: userData?.phone || '0' },
    { label: 'Địa chỉ', value: userData?.address || 'Chưa cập nhật' },
  ];

  const displayName = userData?.full_name || userData?.name || 'Người dùng mới';

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="settings" />
      <main className="main-content" style={{ background: '#FFFFFF' }}>
        <nav className="navbar" style={{ background: '#fff', borderBottom: '1px solid #E6EFF5' }}>
          <h1 className="page-title" style={{ color: '#343C6A' }}>Cài đặt & Tùy chỉnh</h1>
          <div className="nav-actions">
            <button style={{ background: '#1814F3', color: '#fff', padding: '12px 24px', borderRadius: '24px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(24, 20, 243, 0.2)' }}>
              + Lưu tất cả
            </button>
            {isLoggedIn ? (
              <div style={{ position: 'relative' }}>
                <img src={userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" />
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
                        src={userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </div>
                    <button style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#1814F3', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
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
                    {profileFields.map((f, i) => (
                      <div key={i}>
                        <label style={{ display: 'block', marginBottom: '10px', color: '#343C6A', fontWeight: '600', fontSize: '15px' }}>{f.label}</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            defaultValue={isLoggedIn ? f.value : ''}
                            placeholder={isLoggedIn ? `Nhập ${f.label.toLowerCase()}...` : 'Vui lòng đăng nhập'}
                            disabled={!isLoggedIn}
                            style={{
                              width: '100%',
                              padding: '14px 18px',
                              border: '1px solid #E6EFF5',
                              borderRadius: '15px',
                              background: '#F8F9FB',
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
                    <button style={{ padding: '14px 35px', background: '#1814F3', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 15px rgba(24, 20, 243, 0.25)', transition: 'transform 0.2s' }}>Lưu thay đổi</button>
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
                    <select disabled={!isLoggedIn} style={{ width: '100%', padding: '14px', border: '1px solid #E6EFF5', borderRadius: '15px', background: '#F8F9FB', color: '#343C6A', fontSize: '15px', appearance: 'none' }}>
                      <option>VNĐ (₫)</option><option>USD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: '#343C6A', fontWeight: '600', fontSize: '15px' }}>Ngôn ngữ</label>
                    <select disabled={!isLoggedIn} style={{ width: '100%', padding: '14px', border: '1px solid #E6EFF5', borderRadius: '15px', background: '#F8F9FB', color: '#343C6A', fontSize: '15px', appearance: 'none' }}>
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
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{ maxWidth: '600px' }}>
                <h3 style={{ color: '#343C6A', marginBottom: '25px', fontSize: '20px' }}>Bảo mật tài khoản</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: '#343C6A', fontWeight: '600', fontSize: '14px' }}>Mật khẩu hiện tại</label>
                    <input type="password" placeholder="••••••••" disabled={!isLoggedIn} style={{ width: '100%', padding: '14px', border: '1px solid #E6EFF5', borderRadius: '15px', background: '#F8F9FB' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', color: '#343C6A', fontWeight: '600', fontSize: '14px' }}>Mật khẩu mới</label>
                    <input type="password" placeholder="Nhập mật khẩu mới..." disabled={!isLoggedIn} style={{ width: '100%', padding: '14px', border: '1px solid #E6EFF5', borderRadius: '15px', background: '#F8F9FB' }} />
                  </div>
                  <button style={{ width: 'fit-content', padding: '14px 30px', background: '#1814F3', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px', opacity: isLoggedIn ? 1 : 0.5 }}>Cập nhật mật khẩu</button>
                </div>
                
                <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '2px solid #F4F7FE' }}>
                  <h3 style={{ color: '#FE5C73', marginBottom: '10px', fontSize: '18px' }}>Xóa tài khoản</h3>
                  <p style={{ fontSize: '14px', color: '#718EBF', marginBottom: '20px' }}>Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu giao dịch và ví của bạn.</p>
                  <button style={{ padding: '12px 25px', background: '#FFE0EB', color: '#FE5C73', border: '1px solid #FE5C73', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Xóa tài khoản ngay</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import '../login/login.css'; // Reusing the awesome auth styles!

export default function ForgotPassword() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('auth-theme');
    if (savedTheme === 'dark') setIsDark(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    localStorage.setItem('auth-theme', nextTheme ? 'dark' : 'light');
  };

  return (
    <div className={`login-wrapper ${isDark ? 'dark-theme' : ''}`}>
      <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
         {isDark ? '☀️' : '🌙'}
      </button>
      {/* Dynamic Background */}
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      <div className="login-container">
        {/* Left Side: Branding & Illustration */}
        <div className="login-left">
          <div className="login-branding">
            <div className="logo">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h4v16H4zM10 8h4v12h-4zM16 12h4v8h-4z" />
              </svg>
              SpendWise.
            </div>
            <h2>Bảo mật tài khoản</h2>
            <p>Chúng tôi coi trọng sự riêng tư và bảo mật của bạn. Lấy lại quyền truy cập vào tài khoản của bạn một cách nhanh chóng và an toàn.</p>
            
            <div className="glass-card-illustration" style={{ transform: 'rotate(-5deg) translateY(10px)', height: '140px', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-0.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                <path d="M12 11.5c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zm0-3c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-right">
          <div className="login-form-box">
            <h1 className="auth-title">Đặt lại mật khẩu</h1>
            <p className="auth-subtitle">Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.</p>

            <form>
              <div className="floating-input-group">
                <input type="email" id="email" placeholder=" " required />
                <label htmlFor="email">Địa chỉ Email</label>
              </div>

              <button type="submit" className="login-btn-glow" style={{ marginTop: '20px' }}>
                <span>Gửi liên kết đặt lại</span>
              </button>
            </form>

            <div className="auth-divider"></div>
            
            <p className="create-account-text" style={{ marginTop: '0' }}>
               Bạn đã nhớ mật khẩu? <Link href="/login">Quay lại Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

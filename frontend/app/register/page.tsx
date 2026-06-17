"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '../lib/api';
import { useLanguage } from '../lib/translations';
import { useTheme } from '../context/ThemeContext';
import '../login/login.css'; 
// --- CẤU HÌNH GITHUB & GOOGLE ---
const GITHUB_CLIENT_ID = "Ov23lisCCCkHQx90IibX";
const GITHUB_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/login` : '';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/login` : '';

export default function Register() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const handleGitHubLogin = () => {
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
    window.location.href = githubUrl;
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google Client ID chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID vào file .env.local!");
      return;
    }
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('google_oauth_nonce', nonce);
    }
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=id_token&scope=${encodeURIComponent('openid email profile')}&nonce=${nonce}`;
    window.location.href = googleUrl;
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const backendData = {
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password
      };
      await authApi.register(backendData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('register_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-wrapper ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-left">
          <div className="login-branding">
            <div className="logo">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h4v16H4zM10 8h4v12h-4zM16 12h4v8h-4z" />
              </svg>
              SpendWise.
            </div>
            <h2>{t('start_your_journey')}</h2>
            <p>{t('register_hero_desc')}</p>

            <div className="glass-card-illustration" style={{ transform: 'rotate(5deg) translateY(20px)' }}>
              <div className="glass-card-chip"></div>
              <div className="glass-card-info">
                <span>{t('new_card_placeholder')}</span>
                <div className="glass-logo"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-box">
            <h1 className="auth-title">{t('create_account')}</h1>
            <p className="auth-subtitle">{t('register_subtitle_detail')}</p>

            {error && <div className="error-message" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
            {success && <div className="success-message" style={{ background: '#D1FAE5', color: '#065F46', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{t('register_success')}</div>}

            <form onSubmit={handleRegister}>
              <div className="floating-input-group">
                <input type="text" id="name" value={formData.name} onChange={handleChange} placeholder=" " required />
                <label htmlFor="name">{t('full_name_label')}</label>
              </div>
              <div className="floating-input-group">
                <input type="email" id="email" value={formData.email} onChange={handleChange} placeholder=" " required />
                <label htmlFor="email">{t('email_address')}</label>
              </div>
              <div className="floating-input-group">
                <input type="password" id="password" value={formData.password} onChange={handleChange} placeholder=" " required />
                <label htmlFor="password">{t('password_label')}</label>
              </div>

              <div className="auth-options" style={{ marginBottom: '20px' }}>
                <label className="checkbox-container">
                  <input type="checkbox" required /> {t('agree_to')} <Link href="#" className="forgot-pwd" style={{ marginLeft: '4px' }}>{t('terms_and_conditions')}</Link>
                </label>
              </div>

              <button type="submit" className="login-btn-glow" disabled={loading}>
                <span>{loading ? t('processing_wait') : t('register_btn')}</span>
              </button>
            </form>

            <div className="auth-social">
              <div className="auth-divider"><span>{t('or_register_with')}</span></div>
              <div className="social-btn-group" style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={handleGoogleLogin} 
                  type="button" 
                  className="social-btn" 
                  style={{ flex: 1 }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t('google')}
                </button>
                <button 
                  onClick={handleGitHubLogin} 
                  type="button" 
                  className="social-btn" 
                  style={{ flex: 1 }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#24292F" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  {t('github')}
                </button>
              </div>
            </div>

            <p className="create-account-text">
              {t('already_have_account')} <Link href="/login">{t('sign_in_now')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

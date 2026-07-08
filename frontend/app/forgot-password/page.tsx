"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { authApi } from '../lib/api';
import { useLanguage } from '../lib/translations';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await authApi.forgotPassword(email);
      setMessage({ type: 'success', text: response.message || t('reset_email_sent') });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('general_error') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="logo-link">
            <div className="auth-logo">
              <span className="logo-icon">
                <svg viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" rx="30" fill="white" />
                  <circle cx="50" cy="50" r="43" fill="#1814F3" opacity="0.1" />
                  <path d="M25 75 L45 75 L45 25 L25 25 Z" fill="#9C27B0" />
                  <path d="M55 75 L55 25 L65 25 L73 60 L81 25 L95 25 L95 75 Z" fill="#343C6A" />
                </svg>
              </span>
              <span className="logo-text">EM</span>
            </div>
          </Link>
          <h1>{t('forgot_password_title')}</h1>
          <p>{t('forgot_password_desc')}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {message && (
            <div className={`auth-alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              backgroundColor: message.type === 'success' ? '#DEF7EC' : '#FDE8E8',
              color: message.type === 'success' ? '#03543F' : '#9B1C1C',
              fontSize: '14px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {message.text}
            </div>
          )}

          <div className="form-group">
            <label>{t('email_address')}</label>
            <div className="input-with-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <input 
                type="email" 
                placeholder="ResetPassword@gmail.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? (t('processing_wait') || 'Đang xử lý...') : t('send_reset_request')}
          </button>
        </form>

        <div className="auth-footer">
           {t('back_to') || 'Quay lại'} <Link href="/login">{t('login')}</Link>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #F5F7FA;
          padding: 20px;
          font-family: 'Inter', sans-serif;
        }
        .auth-card {
          background: white;
          padding: 48px;
          border-radius: 30px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 36px;
        }
        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 24px;
        }
        .logo-icon { width: 36px; height: 36px; }
        .logo-text { font-size: 24px; font-weight: 800; color: #343C6A; }
        h1 { font-size: 28px; font-weight: 800; color: #343C6A; margin-bottom: 12px; }
        p { color: #718EBF; font-size: 15px; line-height: 1.5; }
        .form-group { margin-bottom: 24px; }
        label { display: block; margin-bottom: 10px; font-weight: 600; color: #343C6A; font-size: 15px; }
        .input-with-icon { position: relative; }
        .input-with-icon svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #718EBF; }
        input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          border: 1px solid #E6EFF5;
          border-radius: 15px;
          font-size: 15px;
          transition: all 0.3s;
          background-color: #fff;
        }
        input:focus { outline: none; border-color: #1814F3; box-shadow: 0 0 0 4px rgba(24, 20, 243, 0.1); }
        .auth-submit {
          width: 100%;
          padding: 16px;
          background-color: #1814F3;
          color: white;
          border: none;
          border-radius: 15px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 12px;
        }
        .auth-submit:hover { background-color: #1410c5; transform: translateY(-2px); }
        .auth-submit:disabled { opacity: 0.7; transform: none; cursor: not-allowed; }
        .auth-footer { text-align: center; margin-top: 32px; color: #718EBF; font-size: 15px; }
        .auth-footer a { color: #1814F3; font-weight: 700; text-decoration: none; margin-left: 5px; }
        .auth-footer a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}

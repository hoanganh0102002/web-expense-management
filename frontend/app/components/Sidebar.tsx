import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { useAIChat } from '../context/AIChatContext';

export default function Sidebar({ activeItem }: { activeItem: string }) {
  const { isLoggedIn, logout } = useAppContext();
  const { t } = useLanguage();
  const router = useRouter();
  const { isOpen, setIsOpen } = useAIChat();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileOpen(false);
    router.push('/login');
  };

  const menuItems = [
    { key: 'dashboard', label: t('dashboard'), href: '/', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
    { key: 'transactions', label: t('transactions'), href: '/transactions', icon: 'M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z' },
    { key: 'categories', label: t('categories'), href: '/categories', icon: 'M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z' },
    { key: 'wallets', label: t('wallets'), href: '/wallets', icon: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2-.9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' },
    { key: 'budget', label: t('budget'), href: '/budget', icon: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z' },
    { key: 'reports', label: t('reports'), href: '/reports', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
    { key: 'ai_assistant', label: t('ai_assistant'), href: '#', icon: 'M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z', isAI: true },
    { key: 'notifications', label: t('notifications'), href: '/notifications', icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z' },
    { key: 'settings', label: t('settings'), href: '/settings', icon: 'M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z' },
  ];
  
  return (
    <>
      {/* Mobile Hamburger Toggle Button */}
      <button 
        className={`mobile-menu-toggle ${isMobileOpen ? 'sidebar-open' : ''}`}
        style={{ display: 'none' }} 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
          {isMobileOpen ? (
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </button>

      {/* Backdrop for mobile sidebar drawer */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(2, 6, 23, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        {/* Brand logo section ... */}
        <div className="brand" style={{ display: 'flex', alignItems: 'center' }}>
          <span className="brand-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', marginRight: '10px' }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <path d="M4 4h4v16H4zM10 8h4v12h-4zM16 12h4v8h-4z" fill="url(#logoGrad)" />
            </svg>
          </span>
          <span style={{ fontWeight: '800', fontSize: '24px', letterSpacing: '0.5px' }}>EM</span>
        </div>
        <ul className="menu" style={{ flex: 1 }}>
          {menuItems.map(item => {
            if (item.isAI) {
              return (
                <li 
                  key={item.key} 
                  className={`menu-item ${isOpen ? 'active' : ''}`}
                  onClick={() => {
                    setIsOpen(true);
                    setIsMobileOpen(false);
                  }}
                  style={{
                    cursor: 'pointer',
                    // Highlight with a subtle indigo glow if active/open
                    background: isOpen ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0) 100%)' : 'transparent',
                    borderLeft: isOpen ? '4px solid #6366F1' : 'none'
                  }}
                >
                  <span className="menu-icon" style={{ color: isOpen ? '#A855F7' : 'inherit' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d={item.icon} /></svg>
                  </span>
                  {item.label}
                </li>
              );
            }
            return (
              <Link key={item.key} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setIsMobileOpen(false)}>
                <li className={`menu-item ${activeItem === item.key ? 'active' : ''}`}>
                  <span className="menu-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d={item.icon} /></svg>
                  </span>
                  {item.label}
                </li>
              </Link>
            );
          })}
        </ul>

        {isLoggedIn && (
          <div style={{ padding: '20px 35px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button className="logout-btn" onClick={handleLogout}>
              <span className="logout-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </span>
              {t('logout')}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}


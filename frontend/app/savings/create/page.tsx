"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import { useAppContext } from '../../context/AppContext';
import { useLanguage } from '../../lib/translations';
import { savingsApi } from '../../lib/api';
import '../savings.css';

// SVG Icons
interface IconProps {
  size?: number;
  style?: React.CSSProperties;
}

const ChevronLeftIcon: React.FC<IconProps> = ({ size = 24, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function CreateSavingsGoalPage() {
  const { isLoggedIn, wallets, fetchWallets } = useAppContext();
  const { t } = useLanguage();
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [autoSaveFrequency, setAutoSaveFrequency] = useState('monthly');
  const [autoSaveAmount, setAutoSaveAmount] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Number to Vietnamese words helper
  const numberToViWords = (numStr: string): string => {
    const num = parseInt(numStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num === 0) return 'Không đồng';
    if (num > 500000000) return 'Vượt quá giới hạn 500 triệu đồng';

    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const unitsTen = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];

    const readTriple = (triple: number, showZero: boolean): string => {
      const h = Math.floor(triple / 100);
      const t = Math.floor((triple % 100) / 10);
      const u = triple % 10;

      let res = '';
      if (h > 0 || showZero) {
        res += units[h] + ' trăm ';
      }

      if (t > 0) {
        if (t === 1) res += 'mười ';
        else res += unitsTen[t] + ' ';
      } else if (h > 0 && u > 0) {
        res += 'lẻ ';
      }

      if (u > 0) {
        if (u === 1 && t > 1) res += 'mốt ';
        else if (u === 5 && t > 0) res += 'lăm ';
        else res += units[u] + ' ';
      }

      return res;
    };

    const chunks = [];
    let temp = num;
    while (temp > 0) {
      chunks.push(temp % 1000);
      temp = Math.floor(temp / 1000);
    }

    const names = ['', 'nghìn', 'triệu', 'tỷ'];
    let text = '';
    for (let i = chunks.length - 1; i >= 0; i--) {
      const chunk = chunks[i];
      if (chunk > 0) {
        const showZero = i < chunks.length - 1;
        text += readTriple(chunk, showZero) + names[i] + ' ';
      }
    }

    text = text.trim();
    if (!text) return 'Không đồng';
    return text.charAt(0).toUpperCase() + text.slice(1) + ' đồng';
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchWallets();
    }
  }, [isLoggedIn]);

  // Set default wallet
  useEffect(() => {
    if (wallets.length > 0) {
      const defaultW = wallets.find(w => w.is_default_receiving && !w.is_hidden) || wallets.find(w => !w.is_hidden);
      if (defaultW) {
        setSourceWalletId(defaultW.id);
      }
    }
  }, [wallets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên mục tiêu!');
      return;
    }

    const targetNum = parseFloat(targetAmount);
    if (isNaN(targetNum) || targetNum < 1000) {
      setErrorMsg('Số tiền cần tích lũy phải tối thiểu 1.000 đ!');
      return;
    }

    if (targetNum > 500000000) {
      setErrorMsg('Số tiền tích lũy tối đa là 500.000.000 đ!');
      return;
    }

    // Prepare payload
    const payload: any = {
      name: name.trim(),
      target_amount: targetNum,
      target_date: targetDate ? targetDate : undefined,
      source_wallet_id: sourceWalletId ? sourceWalletId : undefined
    };

    if (autoSaveEnabled) {
      const autoSaveNum = parseFloat(autoSaveAmount);
      if (isNaN(autoSaveNum) || autoSaveNum < 1000) {
        setErrorMsg('Số tiền trích tự động phải từ 1.000 đ trở lên!');
        return;
      }
      payload.auto_save_frequency = autoSaveFrequency;
      payload.auto_save_amount = autoSaveNum;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await savingsApi.create(payload);
      if (res.status === 'success') {
        router.push('/wallets?tab=savings');
      } else {
        setErrorMsg(res.message || 'Lỗi khi tạo mục tiêu tiết kiệm.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Có lỗi xảy ra trong quá trình xử lý.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container savings-main">
      <Sidebar activeItem="wallets" />
      <main className="main-content">
        <nav className="navbar savings-navbar">
          <h1 className="page-title savings-title">{t('create_saving_goal') || 'Tạo Mục Tiêu Tiết Kiệm'}</h1>
        </nav>

        <div className="content-area savings-container">
          <div className="create-saving-wrapper">
            <div className="form-header">
              <Link href="/wallets?tab=savings" className="back-btn" title="Quay lại">
                <ChevronLeftIcon size={22} />
              </Link>
              <h2 className="form-header-title">Thiết lập mục tiêu</h2>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', padding: '12px 18px', borderRadius: '14px', marginBottom: '20px', fontWeight: '600', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group-wrapper">
                {/* Name field */}
                <div className="form-field">
                  <label className="form-label">Tên mục tiêu tích lũy</label>
                  <input
                    type="text"
                    className="form-input-text"
                    placeholder="Ví dụ: Mua iPhone 16 Pro, Đi du lịch ..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Target Amount field */}
                <div className="form-field">
                  <label className="form-label">Số tiền cần tích lũy (đến 500trđ)</label>
                  <input
                    type="number"
                    className="form-input-text"
                    placeholder="0"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <div className="form-helper">
                    Bằng chữ: {numberToViWords(targetAmount)}
                  </div>
                </div>

                {/* Target Date field */}
                <div className="form-field">
                  <label className="form-label">Thời hạn hoàn thành</label>
                  <input
                    type="date"
                    className="form-input-text"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    disabled={isSubmitting}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Target date must be after today
                  />
                  <div className="form-helper" style={{ fontStyle: 'normal' }}>
                    Chọn ngày hạn định (tùy chọn)
                  </div>
                </div>

                {/* Source Wallet field */}
                <div className="form-field">
                  <label className="form-label">Ví nguồn tích lũy chính</label>
                  <select
                    className="form-select"
                    value={sourceWalletId}
                    onChange={(e) => setSourceWalletId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Chọn ví nguồn để tích lũy</option>
                    {wallets
                      .filter(w => !w.is_hidden)
                      .map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(Number(w.available_balance || 0)))}đ)
                        </option>
                      ))}
                  </select>
                </div>

                {/* Auto Save Toggle */}
                <div className="form-field">
                  <div className="form-toggle-row">
                    <div>
                      <div className="form-label" style={{ marginBottom: '4px' }}>Trích tiền tự động (Auto-Save)</div>
                      <div className="form-helper" style={{ fontSize: '11px' }}>Hệ thống sẽ tự động trích tích lũy hàng kỳ</div>
                    </div>
                    <label className="switch-container">
                      <input
                        type="checkbox"
                        checked={autoSaveEnabled}
                        onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>

                  {autoSaveEnabled && (
                    <div className="auto-save-details-form">
                      <div className="form-field">
                        <label className="form-label" style={{ fontSize: '12px' }}>Tần suất trích</label>
                        <select
                          className="form-select"
                          value={autoSaveFrequency}
                          onChange={(e) => setAutoSaveFrequency(e.target.value)}
                          disabled={isSubmitting}
                        >
                          <option value="daily">Hàng ngày</option>
                          <option value="weekly">Hàng tuần</option>
                          <option value="monthly">Hàng tháng</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label className="form-label" style={{ fontSize: '12px' }}>Số tiền mỗi kỳ</label>
                        <input
                          type="number"
                          className="form-input-text"
                          placeholder="0"
                          value={autoSaveAmount}
                          onChange={(e) => setAutoSaveAmount(e.target.value)}
                          disabled={isSubmitting}
                          required={autoSaveEnabled}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn-submit-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tạo heo đất...' : 'Tạo Heo Đất Tích Lũy'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

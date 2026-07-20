"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../lib/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  icon: string;
  name: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { t, tCategory } = useLanguage();
  const toast = useToast();
  const { 
    isLoggedIn, 
    wallets, 
    categories, 
    fetchWallets, 
    fetchCategories,
    createTransaction 
  } = useAppContext();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [autoClassifiedCatId, setAutoClassifiedCatId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setAutoClassifiedCatId(null);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Fetch wallets and categories if empty
      if (isLoggedIn) {
        if (wallets.length === 0) fetchWallets();
        if (categories.length === 0) fetchCategories();
      }
    }
  }, [isOpen, isLoggedIn]);

  // Handle ESC and Arrow keys
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Parse add transaction command: /add <amount> [unit] <description>
  const parsedTransaction = useMemo(() => {
    if (!query.toLowerCase().startsWith('/add ')) return null;
    
    const commandText = query.substring(5).trim();
    if (!commandText) return null;

    // Regex 1: /add <amount> <unit: k|tr|triệu|trieu|nghìn|nghin|đ|d|vnd> <description>
    const matchWithUnit = commandText.match(/^([0-9.,]+)\s*(k|tr|triệu|trieu|nghìn|nghin|đ|d|vnd)?\s+(.+)$/i);
    if (matchWithUnit) {
      const rawAmount = matchWithUnit[1].replace(/,/g, '');
      const unit = matchWithUnit[2] ? matchWithUnit[2].toLowerCase().trim() : '';
      const description = matchWithUnit[3].trim();

      let amount = parseFloat(rawAmount);
      if (!isNaN(amount)) {
        if (unit === 'k') amount *= 1000;
        else if (unit === 'tr' || unit === 'triệu' || unit === 'trieu') amount *= 1000000;
        else if (unit === 'nghìn' || unit === 'nghin') amount *= 1000;

        let type: 'expense' | 'income' = 'expense';
        const incomeKeywords = ['lương', 'salary', 'thu nhập', 'bonus', 'thưởng', 'được cho', 'nhận tiền', 'thu', 'tổng thu'];
        if (incomeKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
          type = 'income';
        }
        return { amount, description, type };
      }
    }

    // Regex 2 (Fallback): /add <amount> <description> (no unit)
    const matchFallback = commandText.match(/^([0-9.,]+)\s+(.+)$/i);
    if (matchFallback) {
      const rawAmount = matchFallback[1].replace(/,/g, '');
      const description = matchFallback[2].trim();
      let amount = parseFloat(rawAmount);
      if (!isNaN(amount)) {
        let type: 'expense' | 'income' = 'expense';
        const incomeKeywords = ['lương', 'salary', 'thu nhập', 'bonus', 'thưởng', 'được cho', 'nhận tiền', 'thu', 'tổng thu'];
        if (incomeKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
          type = 'income';
        }
        return { amount, description, type };
      }
    }

    return null;
  }, [query]);

  // AI Auto-classify category when description changes in /add command
  useEffect(() => {
    if (!parsedTransaction || !parsedTransaction.description) {
      setAutoClassifiedCatId(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch('/ai/classify-category', {
          method: 'POST',
          body: JSON.stringify({
            title: parsedTransaction.description,
            notes: 'Thêm nhanh từ Bảng lệnh Command Palette',
            type: parsedTransaction.type
          })
        });
        if (res.status === 'success' && res.data?.category_id) {
          setAutoClassifiedCatId(res.data.category_id);
        }
      } catch (e) {
        console.log("Lỗi tự động phân loại danh mục trong Command Palette:", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [parsedTransaction?.description, parsedTransaction?.type]);

  // Default wallet
  const defaultWallet = useMemo(() => {
    return wallets[0] || null;
  }, [wallets]);

  // List of standard commands
  const commands: CommandItem[] = useMemo(() => [
    {
      icon: '🏠',
      name: 'Đi tới Bảng điều khiển (Dashboard)',
      category: 'Điều hướng',
      shortcut: 'G D',
      action: () => { router.push('/'); onClose(); }
    },
    {
      icon: '📊',
      name: 'Đi tới Báo cáo (Reports)',
      category: 'Điều hướng',
      shortcut: 'G R',
      action: () => { router.push('/reports'); onClose(); }
    },
    {
      icon: '👛',
      name: 'Đi tới Ví tiền (Wallets)',
      category: 'Điều hướng',
      shortcut: 'G W',
      action: () => { router.push('/wallets'); onClose(); }
    },
    {
      icon: '🎯',
      name: 'Đi tới Ngân sách (Budgets)',
      category: 'Điều hướng',
      shortcut: 'G B',
      action: () => { router.push('/budget'); onClose(); }
    },
    {
      icon: '⚙️',
      name: 'Đi tới Cài đặt (Settings)',
      category: 'Điều hướng',
      shortcut: 'G S',
      action: () => { router.push('/settings'); onClose(); }
    },
    {
      icon: '🌓',
      name: 'Thay đổi giao diện Sáng / Tối',
      category: 'Hệ thống',
      shortcut: 'T T',
      action: () => {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
        window.dispatchEvent(new Event('storage'));
        toast.success(`Đã chuyển sang giao diện ${nextTheme === 'dark' ? 'Tối' : 'Sáng'}`);
        onClose();
      }
    },
    {
      icon: '🎙️',
      name: 'Ghi âm giao dịch giọng nói (AI Voice)',
      category: 'Tính năng nhanh',
      shortcut: 'V',
      action: () => {
        onClose();
        // Dispatch custom event to trigger Voice modal in Sidebar
        window.dispatchEvent(new CustomEvent('open-voice-transaction'));
      }
    },
    {
      icon: '🎨',
      name: 'Tạo ảnh chia sẻ Wrapped Instagram Story',
      category: 'Tính năng nhanh',
      shortcut: 'W',
      action: () => {
        router.push('/reports');
        onClose();
        toast.info('Hãy bấm vào nút "Tạo ảnh Story" trên trang Báo cáo!');
      }
    }
  ], [router, onClose, toast]);

  // Filter commands by search query (if not using /add)
  const filteredCommands = useMemo(() => {
    if (query.startsWith('/')) {
      // Filter commands starting with / or matching search query
      const searchVal = query.substring(1).toLowerCase().trim();
      if (!searchVal) return commands;
      return commands.filter(cmd => 
        cmd.name.toLowerCase().includes(searchVal) || 
        cmd.category.toLowerCase().includes(searchVal)
      );
    }
    const searchVal = query.toLowerCase().trim();
    if (!searchVal) return commands;
    return commands.filter(cmd => 
      cmd.name.toLowerCase().includes(searchVal) || 
      cmd.category.toLowerCase().includes(searchVal)
    );
  }, [query, commands]);

  // Reset selection index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle Quick Add transaction submission
  const handleQuickAddSubmit = async () => {
    if (!parsedTransaction || !isLoggedIn) return;
    if (!defaultWallet) {
      toast.error('Vui lòng tạo ít nhất 1 ví trước!');
      return;
    }

    setIsSavingTransaction(true);
    try {
      const { amount, description, type } = parsedTransaction;
      
      const formData = new FormData();
      formData.append('title', description);
      formData.append('amount', amount.toString());
      formData.append('type', type);
      formData.append('wallet_id', defaultWallet.id.toString());
      
      if (type === 'income') {
        formData.append('source_type', 'adjustment');
      }

      // Associate classified category if found
      if (autoClassifiedCatId) {
        formData.append('category_id', autoClassifiedCatId);
      } else {
        // Fallback to first matching type category
        const fallbackCat = categories.find((c: any) => c.type === type);
        if (fallbackCat) {
          formData.append('category_id', fallbackCat.id.toString());
        }
      }

      const formattedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      formData.append('transaction_date', formattedDate);
      formData.append('notes', 'Ghi chép nhanh bằng Ctrl+K Command Line');

      await createTransaction(formData);
      toast.success(`Đã thêm giao dịch: ${description} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)})`);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Có lỗi xảy ra: ' + error.message);
    } finally {
      setIsSavingTransaction(false);
    }
  };

  // Handle keyboard inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (parsedTransaction) {
      // If we are in /add command mode
      if (e.key === 'Enter') {
        e.preventDefault();
        handleQuickAddSubmit();
      }
      return;
    }

    // Normal command list navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      // Scroll into view logic
      const activeEl = listRef.current?.children[selectedIndex + 1] as HTMLElement;
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      const activeEl = listRef.current?.children[selectedIndex - 1] as HTMLElement;
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  // Render classified category label
  const renderClassifiedCategory = () => {
    if (!autoClassifiedCatId) return '📂 Khác (Đang tự nhận diện...)';
    const cat = categories.find((c: any) => c.id.toString() === autoClassifiedCatId.toString());
    if (!cat) return '📂 Khác';
    
    // Simple icon parsing
    const iconMap: Record<string, string> = {
      food: '🍜', car: '🚗', shopping_cart: '🛒', shopping_bag: '🛍️', gamepad: '🎮',
      beauty: '💇', health: '🏥', heart: '💖', receipt: '📋', house: '🏠',
      salary: '💰', award: '🏆', other: '📁'
    };
    const emoji = iconMap[cat.icon?.toLowerCase()] || cat.icon || '📂';
    return `${emoji} ${tCategory(cat.name)}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 12, 32, 0.4)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 2000,
      paddingTop: '100px',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      
      {/* Search Console Container */}
      <div 
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.25), 0 0 100px rgba(24, 20, 243, 0.05)',
          width: '90%',
          maxWidth: '650px',
          overflow: 'hidden',
          animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input area */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          gap: '15px'
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Gõ tìm kiếm, hoặc nhập '/add 50k ăn trưa'..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '17px',
              fontWeight: '600',
              color: 'var(--text-main)',
              padding: 0
            }}
          />
          <span style={{
            fontSize: '11px',
            fontWeight: '800',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-color)',
            padding: '4px 8px',
            borderRadius: '8px',
            background: 'var(--bg-color)',
            letterSpacing: '0.5px'
          }}>
            ESC
          </span>
        </div>

        {/* Console Body */}
        <div ref={listRef} style={{ maxHeight: '350px', overflowY: 'auto', padding: '10px 0' }}>
          
          {/* Case 1: Active parser for quick transaction add (/add command) */}
          {parsedTransaction ? (
            <div style={{ padding: '15px 24px' }}>
              <div style={{
                background: 'rgba(24, 20, 243, 0.05)',
                border: '1.5px dashed #1814F3',
                borderRadius: '16px',
                padding: '20px',
                animation: 'pulseBorder 2s infinite'
              }}>
                <h4 style={{
                  margin: '0 0 15px 0',
                  color: '#1814F3',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚡ Thêm nhanh giao dịch</span>
                  {isSavingTransaction && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Số tiền</span>
                    <strong style={{
                      fontSize: '22px',
                      fontWeight: '900',
                      color: parsedTransaction.type === 'income' ? '#10B981' : '#FE5C73'
                    }}>
                      {parsedTransaction.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parsedTransaction.amount)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nội dung</span>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {parsedTransaction.description || 'Chưa nhập nội dung...'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Dự đoán danh mục (AI)</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {renderClassifiedCategory()}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ví trích xuất</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      💳 {defaultWallet ? defaultWallet.name : 'Chưa có ví'}
                    </span>
                  </div>
                </div>

                <div style={{
                  marginTop: '20px',
                  background: 'var(--bg-color)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textAlign: 'center'
                }}>
                  Nhấn <kbd style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', margin: '0 3px' }}>Enter</kbd> để hoàn tất và lưu giao dịch!
                </div>
              </div>
            </div>
          ) : (
            
            /* Case 2: Display search results of available commands */
            <>
              {filteredCommands.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Không tìm thấy lệnh nào phù hợp...
                </div>
              ) : (
                filteredCommands.map((cmd, index) => {
                  const isActive = index === selectedIndex;
                  return (
                    <div
                      key={index}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 24px',
                        background: isActive ? 'rgba(24, 20, 243, 0.06)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{
                          fontSize: '20px',
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: isActive ? 'rgba(24, 20, 243, 0.1)' : 'var(--bg-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}>
                          {cmd.icon}
                        </span>
                        <div>
                          <div style={{
                            fontSize: '14.5px',
                            fontWeight: '700',
                            color: isActive ? 'var(--text-main)' : 'var(--text-main)',
                            opacity: isActive ? 1 : 0.85
                          }}>
                            {cmd.name}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {cmd.category}
                          </span>
                        </div>
                      </div>

                      {cmd.shortcut && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {cmd.shortcut.split(' ').map((char, cIdx) => (
                            <kbd
                              key={cIdx}
                              style={{
                                fontSize: '10px',
                                fontWeight: '800',
                                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                background: isActive ? 'rgba(24, 20, 243, 0.08)' : 'var(--bg-color)',
                                border: '1px solid var(--border-color)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}
                            >
                              {char}
                            </kbd>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

        </div>

        {/* Footer info bar */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11.5px',
          fontWeight: '600',
          color: 'var(--text-muted)'
        }}>
          <div>
            Gõ <kbd style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '2px 4px', borderRadius: '4px' }}>/</kbd> để xem tất cả lệnh
          </div>
          <div>
            Sử dụng phím <kbd style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '2px 4px', borderRadius: '4px' }}>↑↓</kbd> để di chuyển, <kbd style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '2px 4px', borderRadius: '4px' }}>Enter</kbd> để chọn
          </div>
        </div>

      </div>

      {/* Embedded local CSS keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseBorder {
          0% { border-color: #1814F3; box-shadow: 0 0 0 rgba(24, 20, 243, 0); }
          50% { border-color: #FE5C73; box-shadow: 0 0 8px rgba(24, 20, 243, 0.1); }
          100% { border-color: #1814F3; box-shadow: 0 0 0 rgba(24, 20, 243, 0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

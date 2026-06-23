"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../context/AIChatContext';
import { useLanguage } from '../lib/translations';

export default function AIChatPanel() {
  const { 
    isOpen, 
    setIsOpen, 
    messages, 
    conversations, 
    currentConversationId,
    sendMessage, 
    isTyping, 
    clearChat, 
    selectConversation, 
    deleteConversation, 
    renameConversation,
    startNewChat
  } = useAIChat();

  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat when messages or typing status updates
  useEffect(() => {
    if (viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, viewMode]);

  // Focus input field when panel is opened
  useEffect(() => {
    if (isOpen && viewMode === 'chat') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, viewMode]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    const text = inputValue;
    setInputValue('');
    await sendMessage(text);
  };

  const handleChipClick = async (text: string) => {
    if (isTyping) return;
    await sendMessage(text);
  };

  // Start inline rename conversation
  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitleValue(currentTitle);
  };

  const saveRename = async (id: string) => {
    if (!editTitleValue.trim()) return;
    await renameConversation(id, editTitleValue);
    setEditingId(null);
  };

  // Default suggestion prompts
  const suggestionChips = [
    { label: '📊 Chi tiêu nhiều nhất', prompt: 'Tháng này tôi tiêu nhiều nhất khoản gì? ✨' },
    { label: '📅 Tóm tắt tuần này', prompt: 'Tóm tắt chi tiêu tuần này' },
    { label: '💡 Gợi ý cắt giảm', prompt: 'Gợi ý cắt giảm chi tiêu tháng này' },
    { label: '🎯 Mục tiêu tiết kiệm', prompt: 'Tôi muốn tiết kiệm 5 triệu trong 3 tháng' }
  ];

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getClientSuggestedQuestions = (question: string, prevQuestions: string[] = []): string[] => {
    if (!question) return [];
    const q = question.toLowerCase();
    
    // Normalize previous questions for matching to filter out duplicates
    const used = new Set<string>();
    prevQuestions.forEach(pq => {
      if (pq) used.add(pq.trim().toLowerCase());
    });
    used.add(question.trim().toLowerCase());
    
    let pool: string[] = [];
    
    if (q.includes('tuần này') || q.includes('tuần') || q.includes('week')) {
      pool = [
        'Tuần này tôi tiêu nhiều nhất vào danh mục nào?',
        'So sánh chi tiêu tuần này với tuần trước',
        'Tôi cần làm gì để tiết kiệm chi phí tuần này?',
        'Tuần này tôi đã nhận được bao nhiêu tiền thu nhập?',
        'Phân tích chi tiêu tuần này theo từng ngày trong tuần',
        'Liệt kê các giao dịch lớn nhất trong tuần này',
        'Lời khuyên kiểm soát chi tiêu tuần này'
      ];
    } else if (q.includes('chi tiêu nhiều nhất') || q.includes('tiêu nhiều nhất') || q.includes('khoản gì') || q.includes('nhiều nhất') || q.includes('cao nhất') || q.includes('lớn nhất')) {
      pool = [
        'Khoản chi đó chiếm bao nhiêu phần trăm tổng chi tiêu?',
        'Làm sao để thiết lập ngân sách/hạn mức cho danh mục này?',
        'Xem chi tiết các giao dịch trong danh mục đó',
        'Tôi có thể cắt giảm chi tiêu danh mục này thế nào?',
        'So sánh danh mục tiêu nhiều nhất tháng này với tháng trước',
        'Liệt kê 5 giao dịch lớn nhất của danh mục này'
      ];
    } else if (q.includes('tháng này') || q.includes('tháng') || q.includes('month')) {
      pool = [
        'Dự báo chi tiêu tháng này có bị vượt ngân sách không?',
        'So sánh chi tiêu tháng này với tháng trước',
        'Lời khuyên cắt giảm chi tiêu tháng này là gì?',
        'Tháng này tôi đã tiết kiệm được bao nhiêu tiền?',
        'Vẽ biểu đồ xu hướng chi tiêu theo tháng',
        'Thống kê thu nhập so với chi tiêu tháng này'
      ];
    } else if (q.includes('ngân sách') || q.includes('hạn mức') || q.includes('budget')) {
      pool = [
        'Những danh mục nào sắp chi vượt ngân sách?',
        'Làm sao để điều chỉnh hạn mức ngân sách hợp lý hơn?',
        'Đặt cảnh báo khi ngân sách đạt 80%',
        'Xem báo cáo tình hình sử dụng ngân sách',
        'Tôi có nên tăng ngân sách cho tháng sau không?',
        'Danh sách các ngân sách tôi đã thiết lập'
      ];
    } else if (q.includes('tiết kiệm') || q.includes('heo đất') || q.includes('tích lũy') || q.includes('savings')) {
      pool = [
        'Tôi cần bao lâu nữa để hoàn thành mục tiêu tiết kiệm?',
        'Gợi ý cách tiết kiệm tiền hiệu quả mỗi ngày',
        'Làm sao để tăng số tiền tích lũy vào heo đất?',
        'Xem lịch sử tích lũy heo đất gần đây',
        'Heo đất nào của tôi đang có nhiều tiền nhất?',
        'Làm sao để tạo một heo đất mới?'
      ];
    } else if (q.includes('ví') || q.includes('tài khoản') || q.includes('wallet') || q.includes('số dư')) {
      pool = [
        'Xem số dư thực tế của từng ví',
        'Ví nào đang chi tiêu nhiều tiền nhất?',
        'Xem lịch sử giao dịch gần đây của ví',
        'Tôi có thể chuyển tiền từ ví này sang ví khác thế nào?',
        'Ví nào nhận được nhiều thu nhập nhất?',
        'Tổng số dư tất cả các ví là bao nhiêu?'
      ];
    } else if (q.includes('báo cáo') || q.includes('thống kê') || q.includes('biểu đồ') || q.includes('phân tích')) {
      pool = [
        'Xu hướng chi tiêu của tôi thay đổi thế nào?',
        'Tôi chi tiêu nhiều vào ngày nào trong tuần?',
        'Lời khuyên tối ưu hóa dòng tiền từ AI',
        'Xem biểu đồ tròn phân bổ chi tiêu tháng này',
        'Xu hướng thu chi trong 3 tháng qua'
      ];
    } else if (q.includes('thu nhập') || q.includes('lương') || q.includes('công việc') || q.includes('income')) {
      pool = [
        'Thành tích tích lũy tháng này có cao hơn không?',
        'Xem chi tiết các nguồn thu nhập',
        'Gợi ý phân bổ thu nhập theo quy tắc 50/30/20',
        'Thu nhập tháng này của tôi thay đổi thế nào so với tháng trước?',
        'Tôi nên phân bổ bao nhiêu lương vào tiết kiệm?'
      ];
    } else {
      pool = [
        'Tháng này tôi tiêu nhiều nhất khoản gì? ✨',
        'Tóm tắt chi tiêu tuần này của tôi',
        'Tôi có đang chi tiêu hợp lý không?',
        'Liệt kê các giao dịch gần đây nhất',
        'Tình hình ngân sách tháng này thế nào?',
        'Heo đất nào sắp hoàn thành mục tiêu?'
      ];
    }

    // Filter out items that are already asked/used
    const available = pool.filter(item => !used.has(item.trim().toLowerCase()));
    
    // Dynamic shift based on history length to rotate questions deterministically
    const shift = prevQuestions.length;
    const shifted = available.length > 0 
      ? [
          ...available.slice(shift % available.length),
          ...available.slice(0, shift % available.length)
        ]
      : [];

    let result = shifted.slice(0, 3);
    
    // If not enough, top up using fallback general pool
    if (result.length < 3) {
      const fallbackPool = [
        'Tháng này tôi tiêu nhiều nhất khoản gì? ✨',
        'Tóm tắt chi tiêu tuần này của tôi',
        'Tôi có đang chi tiêu hợp lý không?',
        'Liệt kê các giao dịch gần đây nhất',
        'Tình hình ngân sách tháng này thế nào?',
        'Heo đất nào sắp hoàn thành mục tiêu?'
      ];
      const extra = fallbackPool.filter(item => 
        !used.has(item.trim().toLowerCase()) && !result.includes(item)
      );
      result = [...result, ...extra].slice(0, 3);
    }

    return result;
  };

  // Parse structured JSON response from Gemini
  const parseMessageContent = (text: string, userQuestion?: string, prevQuestions?: string[]) => {
    if (!text) return { answer: '', insight: null, suggestedQuestions: [] };
    
    // 1. Remove markdown formatting wrapper if Gemini wrapped JSON inside ```json ... ```
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();

    let answer = text;
    let insight = null;
    let suggestedQuestions: string[] = [];

    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.answer !== undefined) {
        answer = parsed.answer;
        insight = parsed.insight || null;
        suggestedQuestions = parsed.suggested_questions || [];
      }
    } catch (e) {
      // Not a valid JSON, handle as raw text
    }

    // Generate client-side suggested questions if none returned by backend
    if (suggestedQuestions.length === 0 && userQuestion) {
      suggestedQuestions = getClientSuggestedQuestions(userQuestion, prevQuestions);
    }

    return {
      answer,
      insight,
      suggestedQuestions
    };
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(2, 6, 23, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 998,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Sliding Chat Drawer */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '460px',
          height: '100dvh',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#F8FAFC',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        {/* Panel Header */}
        <div 
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                fontSize: '20px'
              }}
            >
              🤖
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, letterSpacing: '0.3px', background: 'linear-gradient(90deg, #818CF8, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                EM AI Assistant
              </h2>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                {viewMode === 'chat' ? 'Trợ lý tài chính ảo' : 'Lịch sử cuộc trò chuyện'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {viewMode === 'chat' ? (
              <>
                <button 
                  onClick={() => setViewMode('history')}
                  title="Xem lịch sử trò chuyện"
                  style={{
                    fontSize: '18px',
                    color: '#94A3B8',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  🕒
                </button>
                <button 
                  onClick={startNewChat}
                  title="Bắt đầu chat mới"
                  style={{
                    fontSize: '18px',
                    color: '#818CF8',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    cursor: 'pointer',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                >
                  ➕
                </button>
              </>
            ) : (
              <button 
                onClick={() => setViewMode('chat')}
                style={{
                  fontSize: '12px',
                  color: '#818CF8',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  cursor: 'pointer',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
              >
                ◀ Quay lại chat
              </button>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#94A3B8',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* View Mode: Conversations List */}
        {viewMode === 'history' && (
          <div 
            style={{
              flex: 1,
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <button 
              onClick={() => {
                startNewChat();
                setViewMode('chat');
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                marginBottom: '10px'
              }}
            >
              ➕ Bắt đầu cuộc trò chuyện mới
            </button>

            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
                <div style={{ fontSize: '13px' }}>Chưa có lịch sử trò chuyện nào.</div>
              </div>
            ) : (
              conversations.map((c) => (
                <div 
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: currentConversationId === c.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: currentConversationId === c.id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    selectConversation(c.id);
                    setViewMode('chat');
                  }}
                >
                  <div style={{ flex: 1, overflow: 'hidden', marginRight: '10px' }}>
                    {editingId === c.id ? (
                      <input 
                        type="text"
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(c.id);
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.8)',
                          border: '1px solid #6366F1',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.title || 'Cuộc trò chuyện không tên'}
                        </div>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>
                          {new Date(c.updated_at).toLocaleDateString('vi-VN')} {new Date(c.updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                    {editingId === c.id ? (
                      <button 
                        onClick={() => saveRename(c.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#10B981' }}
                      >
                        ✓
                      </button>
                    ) : (
                      <button 
                        onClick={() => startRename(c.id, c.title)}
                        title="Đổi tên"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#94A3B8' }}
                      >
                        ✏️
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        if (confirm("Bạn có chắc chắn muốn xóa cuộc hội thoại này?")) {
                          deleteConversation(c.id);
                        }
                      }}
                      title="Xóa"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#FE5C73' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* View Mode: Active Chat */}
        {viewMode === 'chat' && (
          <>
            {/* Message Log */}
            <div 
              style={{
                flex: 1,
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                scrollBehavior: 'smooth'
              }}
            >
              {messages.length === 0 && (
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    padding: '0 20px',
                    color: '#94A3B8',
                    animation: 'fadeUpIn 0.5s ease-out'
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#F1F5F9', marginBottom: '8px' }}>
                    Hỏi EM AI bất cứ điều gì!
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '24px', maxWidth: '300px' }}>
                    Tôi có thể đọc dữ liệu thu chi thực tế của bạn để phân tích, vẽ biểu đồ, hoặc tìm kiếm giao dịch nhanh.
                  </p>
                  
                  {/* Suggestion Chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    {suggestionChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChipClick(chip.prompt)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          color: '#E2E8F0',
                          fontSize: '13px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                        }}
                      >
                        <span>{chip.label}</span>
                        <span style={{ opacity: 0.6 }}>➔</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                let userQuestion = '';
                let prevQuestionsList: string[] = [];
                if (!isUser && index > 0) {
                  const prevMsg = messages[index - 1];
                  if (prevMsg && prevMsg.role === 'user') {
                    userQuestion = prevMsg.content;
                  }
                  // Get all user questions asked up to this point in time
                  prevQuestionsList = messages
                    .slice(0, index)
                    .filter(m => m.role === 'user')
                    .map(m => m.content);
                }
                const parsed = parseMessageContent(msg.content, userQuestion, prevQuestionsList);

                return (
                  <div 
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      animation: 'fadeUpIn 0.3s ease-out'
                    }}
                  >
                    {/* Bubble message */}
                    <div 
                      style={{
                        maxWidth: '85%',
                        padding: '14px 18px',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isUser 
                          ? 'rgba(30, 41, 59, 0.8)' 
                          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
                        border: isUser 
                          ? '1px solid rgba(255, 255, 255, 0.05)' 
                          : '1px solid rgba(99, 102, 241, 0.25)',
                        boxShadow: isUser ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(99, 102, 241, 0.05)',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#F1F5F9',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {/* Hiển thị văn bản chính */}
                      <div>{parsed.answer}</div>

                      {/* Hiển thị Insight tài chính nếu có */}
                      {parsed.insight && (
                        <div 
                          style={{ 
                            marginTop: '12px', 
                            padding: '10px 14px', 
                            borderRadius: '8px', 
                            background: 'rgba(245, 158, 11, 0.15)', 
                            borderLeft: '4px solid #F59E0B',
                            fontSize: '12px',
                            color: '#FBBF24',
                            fontWeight: 500
                          }}
                        >
                          💡 <strong>Lời khuyên tài chính:</strong> {parsed.insight}
                        </div>
                      )}

                      {/* Render Table database results if present */}
                      {msg.dbResults && msg.dbResults.length > 0 && (
                        <div style={{ marginTop: '14px', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#94A3B8' }}>
                                {Object.keys(msg.dbResults[0]).slice(0, 3).map((key) => (
                                  <th key={key} style={{ padding: '6px 4px', textTransform: 'capitalize' }}>
                                    {key.replace('_', ' ')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.dbResults.slice(0, 5).map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  {Object.values(row).slice(0, 3).map((val: any, valIdx) => {
                                    const valStr = String(val);
                                    const isNumber = !isNaN(parseFloat(valStr)) && isFinite(Number(valStr)) && valStr.length > 3;
                                    return (
                                      <td key={valIdx} style={{ padding: '6px 4px', color: '#E2E8F0' }}>
                                        {isNumber && (valIdx === 2 || valStr.length > 5) ? formatCurrency(valStr) : valStr}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {msg.dbResults.length > 5 && (
                            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '6px', textAlign: 'center' }}>
                              ...và {msg.dbResults.length - 5} dòng dữ liệu khác
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hiển thị các câu hỏi gợi ý ngay trong message bubble ở dưới cùng */}
                      {parsed.suggestedQuestions && parsed.suggestedQuestions.length > 0 && (
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Gợi ý cho bạn:</span>
                          {parsed.suggestedQuestions.map((q: string, qIdx: number) => (
                            <button
                              key={qIdx}
                              onClick={() => handleChipClick(q)}
                              disabled={isTyping}
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#818CF8',
                                fontSize: '12px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.color = '#818CF8';
                              }}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <span 
                      style={{
                        fontSize: '10px',
                        color: '#64748B',
                        marginTop: '4px',
                        marginRight: isUser ? '4px' : '0',
                        marginLeft: !isUser ? '4px' : '0'
                      }}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div 
                    style={{
                      padding: '12px 18px',
                      borderRadius: '16px 16px 16px 4px',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818CF8', animation: 'pulseDot 1.2s infinite' }}></div>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A78BFA', animation: 'pulseDot 1.2s infinite 0.2s' }}></div>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F472B6', animation: 'pulseDot 1.2s infinite 0.4s' }}></div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '16px 24px 24px 24px' }}>
              <form 
                onSubmit={handleSend}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '24px',
                  padding: '6px 6px 6px 16px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                <input 
                  ref={inputRef}
                  type="text"
                  placeholder="Hỏi EM về tài chính..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isTyping}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    outline: 'none',
                    padding: '8px 0'
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: inputValue.trim() && !isTyping
                      ? 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: inputValue.trim() && !isTyping ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: inputValue.trim() && !isTyping ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    boxShadow: inputValue.trim() && !isTyping ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  ➔
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Global CSS for Animations and Custom keyframes */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeUpIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulseDot {
          0%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

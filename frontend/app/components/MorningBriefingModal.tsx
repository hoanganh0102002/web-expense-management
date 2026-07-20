"use client";
import React, { useState } from 'react';
import { useAIChat } from '../context/AIChatContext';

interface MorningBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiDigest: { summary: string; insight: string | null; suggested_questions: string[] } | null;
  isLoadingDigest: boolean;
  fetchAiDigest: (force?: boolean) => void;
}

export default function MorningBriefingModal({
  isOpen,
  onClose,
  aiDigest,
  isLoadingDigest,
  fetchAiDigest
}: MorningBriefingModalProps) {
  const { setIsOpen: setChatOpen, sendMessage: sendChatMessage, startNewChat } = useAIChat();
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const totalSlides = 3;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleQuestionClick = (q: string) => {
    onClose(); // Close briefing modal
    startNewChat(); // Open new AI chat session
    setChatOpen(true); // Open AI Chat sidebar
    setTimeout(() => {
      sendChatMessage(q); // Submit the selected question
    }, 300);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(2, 6, 23, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .briefing-modal {
          animation: modalUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="briefing-modal" style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        padding: '24px',
        boxShadow: '0 12px 45px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header decoration */}
        <div style={{
          position: 'absolute',
          top: '-40px', right: '-40px',
          width: '120px', height: '120px',
          background: 'radial-gradient(circle, rgba(24,20,243,0.08) 0%, rgba(22,219,204,0.02) 100%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px', right: '16px',
            background: 'var(--bg-color)',
            border: 'none',
            borderRadius: '50%',
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', cursor: 'pointer',
            color: '#718EBF', zIndex: 10
          }}
        >
          ✕
        </button>

        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            color: '#1814F3', 
            background: 'rgba(24,20,243,0.06)',
            padding: '4px 10px',
            borderRadius: '12px',
            letterSpacing: '1px'
          }}>
            Bản tin tài chính hàng ngày
          </span>
        </div>

        {/* Loading State */}
        {isLoadingDigest ? (
          <div style={{ padding: '30px 10px', textAlign: 'center' }}>
            <div style={{
              width: '40px', height: '40px',
              border: '3px solid var(--border-color)',
              borderTopColor: '#1814F3',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }} />

            <p style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '14.5px', margin: 0 }}>
              Đang phân tích dữ liệu ví và tạo bản tin...
            </p>
          </div>
        ) : !aiDigest ? (
          <div style={{ padding: '20px 10px', textAlign: 'center' }}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
            <p style={{ fontWeight: 'bold', color: '#FE5C73', margin: '10px 0 6px' }}>Lỗi dữ liệu</p>
            <p style={{ fontSize: '13px', color: '#718EBF', margin: '0 0 16px' }}>
              Không thể tải hoặc tạo bản tin phân tích dòng tiền vào lúc này.
            </p>
            <button 
              onClick={() => fetchAiDigest(true)}
              style={{
                background: '#1814F3', color: '#fff', border: 'none',
                padding: '8px 20px', borderRadius: '16px', fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 Thử lại
            </button>
          </div>
        ) : (
          /* Carousel Content Area */
          <div>
            <div style={{
              overflow: 'hidden',
              width: '100%',
              minHeight: '220px',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                width: `${totalSlides * 100}%`,
                transform: `translateX(-${(currentSlide * 100) / totalSlides}%)`,
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                {/* Slide 0: Summary */}
                <div style={{ width: `${100 / totalSlides}%`, padding: '0 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>☀️</span>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                      Chào buổi sáng sếp!
                    </h4>
                  </div>
                  <p style={{ 
                    fontSize: '14.5px', 
                    color: 'var(--text-main)', 
                    lineHeight: '1.6', 
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {aiDigest.summary}
                  </p>
                </div>

                {/* Slide 1: Insight */}
                <div style={{ width: `${100 / totalSlides}%`, padding: '0 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>💡</span>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                      Nhận định của Trợ lý AI
                    </h4>
                  </div>
                  <div style={{
                    background: 'rgba(24, 20, 243, 0.04)',
                    borderLeft: '4px solid #1814F3',
                    padding: '16px',
                    borderRadius: '12px',
                    minHeight: '130px',
                    boxSizing: 'border-box'
                  }}>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-main)', 
                      lineHeight: '1.6', 
                      margin: 0,
                      fontWeight: '600'
                    }}>
                      {aiDigest.insight || "Nhìn chung tình hình dòng tiền thu chi của sếp đang rất ổn định! Hãy tiếp tục duy trì thói quen ghi chép tài chính kỷ luật nhé."}
                    </p>
                  </div>
                </div>

                {/* Slide 2: Actions & Questions */}
                <div style={{ width: `${100 / totalSlides}%`, padding: '0 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>🎯</span>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                      Tư vấn Tài chính chuyên sâu
                    </h4>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#718EBF', fontWeight: '600', margin: '0 0 12px' }}>
                    Bấm chọn một câu hỏi gợi ý để trợ lý AI giải đáp chi tiết dòng tiền cho sếp:
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {aiDigest.suggested_questions && aiDigest.suggested_questions.length > 0 ? (
                      aiDigest.suggested_questions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuestionClick(q)}
                          style={{
                            background: 'var(--bg-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontSize: '13px',
                            color: '#1814F3',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            lineHeight: '1.4'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(24, 20, 243, 0.05)';
                            e.currentTarget.style.borderColor = '#1814F3';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'var(--bg-color)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                          }}
                        >
                          {q}
                        </button>
                      ))
                    ) : (
                      <p style={{ fontSize: '13px', color: '#718EBF', fontStyle: 'italic', textAlign: 'center', margin: '10px 0' }}>
                        Không có câu hỏi gợi ý nào được tạo.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Indicator dots */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              margin: '20px 0'
            }}>
              {[...Array(totalSlides)].map((_, i) => (
                <span 
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  style={{
                    width: currentSlide === i ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: currentSlide === i ? '#1814F3' : 'var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease-out'
                  }}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px'
            }}>
              <button
                onClick={handlePrev}
                disabled={currentSlide === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: currentSlide === 0 ? 'rgba(0,0,0,0.15)' : '#718EBF',
                  fontWeight: 'bold',
                  cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  padding: '8px 12px'
                }}
              >
                ◀ Quay lại
              </button>

              {currentSlide === totalSlides - 1 ? (
                <button
                  onClick={onClose}
                  style={{
                    background: '#1814F3',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(24, 20, 243, 0.2)'
                  }}
                >
                  🚀 Bắt đầu ngày mới!
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  style={{
                    background: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    color: '#1814F3',
                    padding: '8px 16px',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Tiếp theo ▶
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import CategoryPicker from './CategoryPicker';
import { apiFetch } from '../lib/api';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrencyLocal = (val: number) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + 'đ';
};

// Vietnamese voice parsing function
function parseVietnameseVoice(text: string): { type: 'income' | 'expense'; amount: number; description: string } {
  const lowercase = text.toLowerCase().trim();
  
  // 1. Detect type
  let type: 'income' | 'expense' = 'expense';
  if (
    lowercase.includes('thu') || 
    lowercase.includes('lương') || 
    lowercase.includes('nhận') || 
    lowercase.includes('được') || 
    lowercase.includes('lãi') ||
    lowercase.includes('cộng')
  ) {
    type = 'income';
  }

  // 2. Detect amount
  let amount = 0;
  
  // Look for digits followed by multipliers
  // Examples: 50k, 50 nghìn, 1.5 triệu, 2.5m, 30.000, 30000
  const numberRegex = /(\d+(?:[.,]\d+)?)\s*(nghìn|ngàn|triệu|tỷ|k|m|đồng|đ)?/gi;
  const matches = [...lowercase.matchAll(numberRegex)];
  
  let multiplier = 1;
  
  if (matches.length > 0) {
    const firstMatch = matches[0];
    let cleanedNum = firstMatch[1];
    
    // Standardize Vietnamese thousand separators
    if (cleanedNum.includes('.') && cleanedNum.split('.')[1].length === 3) {
      cleanedNum = cleanedNum.replace(/\./g, '');
    }
    if (cleanedNum.includes(',') && cleanedNum.split(',')[1].length === 3) {
      cleanedNum = cleanedNum.replace(/,/g, '');
    }
    // Replace remaining commas with dots for parseFloat
    cleanedNum = cleanedNum.replace(/,/g, '.');
    
    const unit = firstMatch[2] ? firstMatch[2].toLowerCase() : '';
    
    if (unit === 'triệu' || unit === 'm') {
      multiplier = 1000000;
    } else if (unit === 'nghìn' || unit === 'ngàn' || unit === 'k') {
      multiplier = 1000;
    } else if (unit === 'tỷ') {
      multiplier = 1000000000;
    }
    
    amount = parseFloat(cleanedNum) * multiplier;
  } else {
    // If no digits are present, try parsing word-based numbers
    const textNumbers: Record<string, number> = {
      'một': 1, 'hai': 2, 'ba': 3, 'bốn': 4, 'tư': 4, 'năm': 5, 'lăm': 5, 
      'sáu': 6, 'bảy': 7, 'tám': 8, 'chín': 9, 'mười': 10, 'trăm': 100
    };
    
    let tempSum = 0;
    let currentVal = 0;
    const words = lowercase.split(/\s+/);
    
    words.forEach((word) => {
      if (textNumbers[word] !== undefined) {
        currentVal = textNumbers[word];
      } else if (word === 'mươi' || word === 'chục') {
        currentVal = currentVal * 10;
      } else if (word === 'trăm') {
        currentVal = currentVal * 100;
      } else if (word === 'nghìn' || word === 'ngàn') {
        tempSum += (currentVal || 1) * 1000;
        currentVal = 0;
      } else if (word === 'triệu') {
        tempSum += (currentVal || 1) * 1000000;
        currentVal = 0;
      }
    });
    tempSum += currentVal;
    amount = tempSum;
  }

  // 3. Extract description
  let description = text;
  
  // Remove trigger words
  description = description.replace(/^(chi|tiêu|mua|trả|mất|lỗ|thu|lương|nhận|được|lãi|cộng)\s+/i, '');
  
  // Remove amount numeric expressions
  description = description.replace(/\d+(?:[.,]\d+)?\s*(nghìn|ngàn|triệu|tỷ|k|m|đồng|đ)?/gi, '');
  
  // Remove text-based numbers
  description = description.replace(/(một|hai|ba|bốn|tư|năm|lăm|sáu|bảy|tám|chín|mười|mươi|chục|trăm|nghìn|ngàn|triệu|tỷ|đồng|đ)/gi, '');
  
  // Clean spaces
  description = description.replace(/\s+/g, ' ').trim();
  
  if (!description) {
    description = type === 'expense' ? 'Chi tiêu bằng giọng nói' : 'Thu nhập bằng giọng nói';
  } else {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  return { type, amount, description };
}

// Get local ISO string YYYY-MM-DDTHH:mm
const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}-${minutes}`.replace('-', '/').replace('-', '/').replace('T', ' '); // Let's use simplified parse or standard HTML input datetime-local format:
  // Datetime-local requires YYYY-MM-DDTHH:mm format exactly.
};

const getDatetimeInputString = () => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
  return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
};

export default function VoiceTransactionModal({ isOpen, onClose }: VoiceTransactionModalProps) {
  const { wallets, categories, createTransaction } = useAppContext();
  
  const [status, setStatus] = useState<'idle' | 'listening' | 'parsed' | 'saving' | 'success' | 'unsupported'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Edit Form states
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState<string>('0');
  const [txDescription, setTxDescription] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [txDate, setTxDate] = useState<string>('');
  const [txNotes, setTxNotes] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setStatus('unsupported');
      } else {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = 'vi-VN';
        rec.interimResults = true;
        
        rec.onstart = () => {
          setStatus('listening');
          setTranscript('');
          setErrorMsg('');
        };
        
        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          setTranscript(resultText);
        };
        
        rec.onend = () => {
          setStatus((prev) => {
            if (prev === 'listening') {
              return 'parsed';
            }
            return prev;
          });
        };
        
        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === 'not-allowed') {
            setErrorMsg('Quyền sử dụng Micro bị từ chối. Vui lòng cho phép ứng dụng truy cập Micro!');
          } else {
            setErrorMsg('Không nhận diện được giọng nói. Vui lòng thử lại!');
          }
          setStatus('idle');
        };
        
        recognitionRef.current = rec;
      }
    }
  }, []);

  // Pre-fill active wallet and categories when modal opens
  useEffect(() => {
    if (isOpen) {
      if (wallets && wallets.length > 0) {
        setSelectedWalletId(wallets[0].id);
      }
      setTxDate(getDatetimeInputString());
      setTxNotes('');
    }
  }, [isOpen, wallets]);

  // Run parser when transcript is finalized
  useEffect(() => {
    if (status === 'parsed' && transcript) {
      const parsed = parseVietnameseVoice(transcript);
      setTxType(parsed.type);
      
      // Formatted amount (like "45.000")
      const formattedAmount = parsed.amount > 0 
        ? parsed.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") 
        : '0';
      setTxAmount(formattedAmount);
      setTxDescription(parsed.description);
      
      // Auto-select a matching category
      if (categories && categories.length > 0) {
        const lowerDesc = parsed.description.toLowerCase();
        let matchedCat = categories.find((c: any) => 
          c.type === parsed.type && lowerDesc.includes(c.name.toLowerCase())
        );
        
        if (!matchedCat) {
          for (const parent of categories) {
            if (parent.children) {
              const matchedChild = parent.children.find((child: any) => 
                lowerDesc.includes(child.name.toLowerCase())
              );
              if (matchedChild) {
                matchedCat = matchedChild;
                break;
              }
            }
          }
        }
        
        if (matchedCat) {
          setSelectedCategoryId(matchedCat.id);
        } else {
          const firstTypeCat = categories.find((c: any) => c.type === parsed.type);
          setSelectedCategoryId(firstTypeCat?.id || '');
        }
      }
    }
  }, [status, transcript, categories]);

  // AI Auto-classification of category based on description and notes
  useEffect(() => {
    if (status !== 'parsed' || !txDescription) return;

    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch('/ai/classify-category', {
          method: 'POST',
          body: JSON.stringify({
            title: txDescription,
            notes: txNotes,
            type: txType
          })
        });
        if (res.status === 'success' && res.data?.category_id) {
          setSelectedCategoryId(res.data.category_id);
        }
      } catch (e) {
        console.log("Lỗi tự động phân loại danh mục bằng AI:", e);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [txDescription, txNotes, txType, status]);

  if (!isOpen) return null;

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSave = async () => {
    if (!selectedWalletId) {
      alert('Vui lòng chọn ví!');
      return;
    }
    const cleanAmountStr = txAmount.replace(/\./g, '');
    const cleanAmount = parseFloat(cleanAmountStr);
    
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      alert('Số tiền không hợp lệ! Vui lòng điền số tiền lớn hơn 0.');
      return;
    }
    if (!txDescription) {
      alert('Vui lòng nhập tên giao dịch!');
      return;
    }

    setStatus('saving');
    try {
      const formData = new FormData();
      formData.append('title', txDescription);
      formData.append('amount', cleanAmountStr);
      formData.append('type', txType);
      formData.append('wallet_id', selectedWalletId);
      if (txType === 'income') {
        formData.append('source_type', 'adjustment');
      }
      if (selectedCategoryId) {
        formData.append('category_id', selectedCategoryId);
      }
      
      const formattedDate = new Date(txDate).toISOString().slice(0, 19).replace('T', ' ');
      formData.append('transaction_date', formattedDate);
      formData.append('notes', txNotes || ('Ghi chép bằng giọng nói: "' + transcript + '"'));

      await createTransaction(formData);
      setStatus('success');
      
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi xảy ra: ' + err.message);
      setStatus('parsed');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setTranscript('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
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
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseMic {
          0% { box-shadow: 0 0 0 0 rgba(24, 20, 243, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(24, 20, 243, 0); }
          100% { box-shadow: 0 0 0 0 rgba(24, 20, 243, 0); }
        }
        @keyframes pulseWave {
          0%, 100% { height: 8px; }
          50% { height: 35px; }
        }
        .voice-modal-content {
          animation: modalUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .mic-btn-recording {
          animation: pulseMic 1.6s infinite;
        }
        .voice-waves {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 40px;
          justify-content: center;
          margin-top: 15px;
        }
        .wave-bar {
          width: 4px;
          height: 8px;
          background: #1814F3;
          border-radius: 2px;
          animation: pulseWave 1s ease-in-out infinite;
        }
        .bar-1 { animation-delay: 0.1s; }
        .bar-2 { animation-delay: 0.2s; }
        .bar-3 { animation-delay: 0.3s; }
        .bar-4 { animation-delay: 0.4s; }
        .bar-5 { animation-delay: 0.5s; }
      `}</style>

      <div className="voice-modal-content" style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        width: '550px',
        maxWidth: '95%',
        padding: '30px',
        boxShadow: '0 12px 45px rgba(0,0,0,0.15)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Close Button */}
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px', right: '20px',
            background: 'transparent',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#718EBF'
          }}
        >
          ✕
        </button>

        {/* Header Title */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            Ghi sổ nhanh bằng Giọng nói
          </h2>
          <p style={{ fontSize: '13.5px', color: '#718EBF', marginTop: '4px', fontWeight: '500' }}>
            Nói khẩu lệnh để hệ thống tự phân tích và điền biểu mẫu giao dịch
          </p>
        </div>

        {/* --- UNSUPPORTED BROWSER --- */}
        {status === 'unsupported' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <span style={{ fontSize: '40px' }}>⚠️</span>
            <p style={{ fontWeight: 'bold', margin: '12px 0 6px', color: '#FE5C73' }}>Trình duyệt không hỗ trợ</p>
            <p style={{ fontSize: '13px', color: '#718EBF', lineHeight: '1.5' }}>
              Tính năng ghi âm giọng nói yêu cầu các trình duyệt nhân Chromium như **Google Chrome** hoặc **Microsoft Edge** để hoạt động ổn định nhất.
            </p>
          </div>
        )}

        {/* --- IDLE STATE --- */}
        {status === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
            <button 
              onClick={startListening}
              style={{
                width: '75px', height: '75px',
                borderRadius: '50%',
                background: '#E6E8FA',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                color: '#1814F3',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(24,20,243,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🎙️
            </button>
            <p style={{ fontSize: '14.5px', color: 'var(--text-main)', fontWeight: 'bold', marginTop: '18px', marginBottom: '6px' }}>
              Nhấp vào micro để bắt đầu nói
            </p>
            <p style={{ fontSize: '12.5px', color: '#718EBF', textAlign: 'center', padding: '0 20px', lineHeight: '1.5' }}>
              Nói tự nhiên: *"Chi 50k ăn phở"* hoặc *"Thu hai triệu năm trăm nghìn lương"*
            </p>
            {errorMsg && (
              <p style={{ fontSize: '13px', color: '#FE5C73', marginTop: '12px', textAlign: 'center', fontWeight: '500' }}>
                {errorMsg}
              </p>
            )}
          </div>
        )}

        {/* --- LISTENING STATE --- */}
        {status === 'listening' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
            <button 
              onClick={stopListening}
              className="mic-btn-recording"
              style={{
                width: '75px', height: '75px',
                borderRadius: '50%',
                background: '#FE5C73',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                color: '#fff',
                transition: 'all 0.2s'
              }}
            >
              🛑
            </button>
            
            <div className="voice-waves">
              <span className="wave-bar bar-1"></span>
              <span className="wave-bar bar-2"></span>
              <span className="wave-bar bar-3"></span>
              <span className="wave-bar bar-4"></span>
              <span className="wave-bar bar-5"></span>
            </div>

            <p style={{ fontSize: '13.5px', color: '#FE5C73', fontWeight: 'bold', marginTop: '16px' }}>
              Hệ thống đang nghe... Nhấn nút dừng khi nói xong
            </p>
            
            <div style={{
              background: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '16px',
              width: '100%',
              minHeight: '70px',
              marginTop: '15px',
              textAlign: 'center',
              fontSize: '15px',
              color: 'var(--text-main)',
              fontStyle: 'italic',
              fontWeight: '600',
              lineHeight: '1.4'
            }}>
              {transcript || "Hãy nói: 'Chi 30.000 ăn trưa'..."}
            </div>
          </div>
        )}

        {/* --- PARSED RESULT STATE (NATIVE LOOKALIKE FORM) --- */}
        {status === 'parsed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '12px 16px',
              fontSize: '13.5px',
              color: '#718EBF',
              fontStyle: 'italic',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              Phân tách khẩu lệnh: "{transcript}"
            </div>

            {/* Grid 1: Name and Amount */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Tên giao dịch *</label>
                <input 
                  type="text" 
                  value={txDescription} 
                  onChange={e => setTxDescription(e.target.value)} 
                  placeholder="VD: Tiền ăn trưa, Mua sắm..." 
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Số tiền *</label>
                <input
                  type="text"
                  value={txAmount}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    const formattedValue = rawValue ? parseInt(rawValue, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '';
                    setTxAmount(formattedValue);
                  }}
                  placeholder="VD: 50000"
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px', fontWeight: 'bold' }}
                />
              </div>
            </div>

            {/* Grid 2: Type, Wallet and Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Loại *</label>
                <select 
                  value={txType} 
                  onChange={e => setTxType(e.target.value as any)} 
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}
                >
                  <option value="expense">Chi tiêu</option>
                  <option value="income">Thu nhập</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ví của tôi *</label>
                <select 
                  value={selectedWalletId} 
                  onChange={e => setSelectedWalletId(e.target.value)} 
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }}
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrencyLocal(w.available_balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ngày *</label>
                <input 
                  type="datetime-local" 
                  value={txDate} 
                  onChange={e => setTxDate(e.target.value)} 
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '15px' }} 
                />
              </div>
            </div>

            {/* Smart Category block with native CategoryPicker */}
            <div style={{ marginBottom: '5px', background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Danh mục thông minh
                </span>
              </div>
              <CategoryPicker
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                type={txType}
                categories={categories}
                placeholder="Chọn danh mục"
              />
            </div>

            {/* Notes input */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#718EBF', fontSize: '14px', fontWeight: '500' }}>Ghi chú</label>
              <textarea
                value={txNotes}
                onChange={e => setTxNotes(e.target.value)}
                placeholder="Thêm ghi chú giao dịch..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  background: 'var(--bg-color)',
                  color: 'var(--text-main)',
                  fontSize: '14.5px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button 
                onClick={startListening}
                style={{
                  flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-color)', color: 'var(--text-main)', fontWeight: '700',
                  fontSize: '14.5px', cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                🎙️ Nói lại
              </button>
              <button 
                onClick={handleSave}
                style={{
                  flex: 1.5, padding: '12px', borderRadius: '14px', border: 'none',
                  background: '#1814F3', color: '#fff', fontWeight: '700',
                  fontSize: '14.5px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(24,20,243,0.2)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                💾 Ghi sổ ngay
              </button>
            </div>
          </div>
        )}

        {/* --- SAVING STATE --- */}
        {status === 'saving' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0' }}>
            <div style={{
              width: '40px', height: '40px',
              border: '3px solid var(--border-color)',
              borderTopColor: '#1814F3',
              borderRadius: '50%',
              animation: 'spinSlow 1s linear infinite'
            }} />
            <p style={{ fontWeight: 'bold', color: 'var(--text-main)', marginTop: '16px', fontSize: '14.5px' }}>
              Đang lưu giao dịch lên hệ thống...
            </p>
          </div>
        )}

        {/* --- SUCCESS STATE --- */}
        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px 0' }}>
            <span style={{ fontSize: '50px', animation: 'scaleUp 0.3s ease-out' }}>🎉</span>
            <p style={{ fontWeight: '955', color: '#10B981', marginTop: '16px', fontSize: '17px' }}>
              Ghi sổ thành công!
            </p>
            <p style={{ fontSize: '13px', color: '#718EBF', marginTop: '4px', fontWeight: 'bold' }}>
              Ví của sếp đã được tự động cập nhật số dư.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

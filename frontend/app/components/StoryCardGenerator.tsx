"use client";
import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useLanguage } from '../lib/translations';

interface StoryCardGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
  userName: string;
  totalIncome: number;
  totalExpense: number;
  topCategories: Array<{
    name: string;
    icon: string;
    amount: number;
    percentage: number;
    color?: string;
  }>;
}

type BackgroundStyle = 'neon' | 'pastel' | 'sunset';

const parseIcon = (iconName: string) => {
  if (!iconName) return '📁';
  const iconMap: Record<string, string> = {
    food: '🍜', car: '🚗', shopping_cart: '🛒', shopping_bag: '🛍️', gamepad: '🎮',
    beauty: '💇', health: '🏥', heart: '💖', receipt: '📋', house: '🏠',
    users: '🤝', chart: '📈', book: '📚', salary: '💰', award: '🏆',
    business: '🏢', profit: '💹', debt: '📉', support: '🤗', building: '🏙️',
    rings: '💍', grid: '🔲', monitor: '🖥️', cash: '💵', coffee: '☕',
    baby_clothing: '👶', paw: '🐾', dumbbell: '🏋️', beer: '🍺', suitcase: '🧳',
    tshirt: '👕', graduation_cap: '🎓', money_bag: '💰', handshake: '🤝',
    lightbulb: '💡', gas_station: '⛽', flower: '🌸', piggy_bank: '🐷',
    restaurant: '🍽️', ticket: '🎫', wallet: '👛', gift: '🎁', airplane: '✈️',
    bank: '🏦', electricity: '⚡', phone_call: '📞', laptop: '💻', headphones: '🎧',
  };
  return iconMap[iconName.toLowerCase().trim()] || iconName;
};

const translateCategoryName = (name: string) => {
  if (!name) return 'Khác';
  const nameLower = name.toLowerCase().trim();
  const map: Record<string, string> = {
    'food': 'Ăn uống',
    'dining': 'Ăn uống',
    'shopping': 'Mua sắm',
    'entertainment': 'Giải trí',
    'game': 'Giải trí',
    'gamepad': 'Giải trí',
    'transport': 'Đi lại',
    'transportation': 'Đi lại',
    'education': 'Giáo dục',
    'health': 'Sức khỏe',
    'medical': 'Sức khỏe',
    'housing': 'Nhà cửa',
    'utilities': 'Tiện ích',
    'salary': 'Lương',
    'gift': 'Quà tặng',
    'other': 'Khác',
    'others': 'Khác'
  };
  return map[nameLower] || name;
};

export default function StoryCardGenerator({
  isOpen,
  onClose,
  month,
  year,
  userName,
  totalIncome,
  totalExpense,
  topCategories,
}: StoryCardGeneratorProps) {
  const { t } = useLanguage();
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>('neon');
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Format currency helpers
  const fmt = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Determine financial personality
  const getPersonality = () => {
    if (totalExpense === 0) {
      return {
        title: '🌱 Tân Binh Ví Mới',
        desc: 'Sếp mới bắt đầu hành trình và chưa có phát sinh chi tiêu nào. Hãy tiếp tục theo dõi nhé!',
        quote: 'Vạn sự khởi đầu nan, gian nan đừng có nản!'
      };
    }
    if (totalIncome > 0 && totalExpense > totalIncome) {
      return {
        title: '💸 Kẻ Hủy Diệt Ví Tiền',
        desc: 'Chi tiêu vượt quá thu nhập! Sếp đang vung tay quá trán rồi đó nha, kiểm soát lại ví thôi.',
        quote: 'Tiền đi như một cơn gió, ví xẹp lại như quả bóng bay!'
      };
    }
    
    // Check if food is top category
    const topCat = topCategories[0];
    const isFood = topCat && (topCat.name.toLowerCase().includes('ăn') || topCat.name.toLowerCase().includes('uống') || topCat.name.toLowerCase().includes('food') || topCat.name.toLowerCase().includes('eat'));
    
    if (isFood && topCat.percentage > 35) {
      return {
        title: '🍕 Thực Thần Vô Đối',
        desc: `Sếp dành tới ${topCat.percentage.toFixed(0)}% ngân sách cho ẩm thực. Con đường ngắn nhất đến trái tim là đi qua dạ dày!`,
        quote: 'Ăn được ngủ được là tiên, tiền ăn hết sạch mới điên cái đầu!'
      };
    }

    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
    if (savingsRate >= 0.3) {
      return {
        title: '🐷 Chiến Thần Tích Lũy',
        desc: `Tiết kiệm được ${(savingsRate * 100).toFixed(0)}% thu nhập. Sếp tích lũy cực đỉnh, heo đất nhà sếp chắc béo lắm đây!`,
        quote: 'Tích tiểu thành đại, có ngày mua được cả lâu đài!'
      };
    }

    return {
      title: '⚖️ Chiến Binh Cân Bằng',
      desc: 'Chi tiêu vừa vặn, quản lý ngân sách cực kỳ khoa học và hợp lý. Rất đáng phát huy!',
      quote: 'Khéo ăn thì no, khéo co thì ấm!'
    };
  };

  const personality = getPersonality();

  // Background style details
  const getBgClass = () => {
    switch (bgStyle) {
      case 'pastel':
        return {
          background: 'linear-gradient(135deg, #FFF0F5 0%, #E6E6FA 50%, #F0F8FF 100%)',
          textColor: '#2E2A47',
          mutedColor: '#7A7593',
          cardBg: 'rgba(255, 255, 255, 0.7)',
          cardBorder: '1px solid rgba(46, 42, 71, 0.08)',
          accentColor: '#8A2BE2',
          statTitleColor: '#4A4376'
        };
      case 'sunset':
        return {
          background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 50%, #4B1248 100%)',
          textColor: '#FFFFFF',
          mutedColor: 'rgba(255, 255, 255, 0.7)',
          cardBg: 'rgba(255, 255, 255, 0.12)',
          cardBorder: '1px solid rgba(255, 255, 255, 0.15)',
          accentColor: '#FFD700',
          statTitleColor: 'rgba(255, 255, 255, 0.8)'
        };
      case 'neon':
      default:
        return {
          background: 'linear-gradient(135deg, #0F0C20 0%, #15102A 50%, #06040A 100%)',
          textColor: '#FFFFFF',
          mutedColor: '#B0A8D2',
          cardBg: 'rgba(255, 255, 255, 0.04)',
          cardBorder: '1px solid rgba(255, 255, 255, 0.06)',
          accentColor: '#16DBCC',
          statTitleColor: '#E0DBFF'
        };
    }
  };

  const currentBg = getBgClass();

  // Download image handler
  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      const element = cardRef.current;
      
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // Double resolution for ultra-sharp output
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Expense_Wrapped_${month}_${year}_${userName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Không thể tạo ảnh, vui lòng thử lại sau.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 12, 32, 0.7)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* Modal Container */}
      <div className="premium-modal-wrapper" style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '28px',
        padding: '30px',
        width: '90%',
        maxWidth: '850px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '30px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Left column: Live Preview */}
        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '15px',
            color: 'var(--text-main)',
            width: '100%',
            textAlign: 'center'
          }}>
            Khung Xem Trước (Instagram Story 9:16)
          </h3>

          {/* Render container (Hidden offscreen or scaled down) */}
          <div style={{
            width: '320px',
            height: '568px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* The actual 1080x1920 DOM element styled inside a container. We use CSS transform to scale it down perfectly in preview */}
            <div 
              ref={cardRef}
              style={{
                width: '1080px',
                height: '1920px',
                background: currentBg.background,
                color: currentBg.textColor,
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                padding: '100px 80px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'absolute',
                top: 0,
                left: 0,
                transform: 'scale(0.296296)',
                transformOrigin: 'top left',
                boxSizing: 'border-box'
              }}
            >
              {/* Top Bubble Decor */}
              <div style={{
                position: 'absolute',
                top: '-100px',
                right: '-100px',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: bgStyle === 'pastel' ? 'rgba(230, 230, 250, 0.4)' : bgStyle === 'sunset' ? 'rgba(255, 215, 0, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                filter: 'blur(80px)',
                zIndex: 1
              }}></div>
              
              <div style={{
                position: 'absolute',
                bottom: '-150px',
                left: '-100px',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: bgStyle === 'pastel' ? 'rgba(255, 192, 203, 0.3)' : bgStyle === 'sunset' ? 'rgba(221, 36, 118, 0.2)' : 'rgba(22, 219, 204, 0.1)',
                filter: 'blur(90px)',
                zIndex: 1
              }}></div>

              {/* CARD CONTENT */}
              <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                
                {/* Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '4px', color: currentBg.accentColor }}>
                      EXPENSE WRAPPED
                    </span>
                    <span style={{ fontSize: '26px', fontWeight: '700', opacity: 0.8 }}>
                      THÁNG {month}/{year}
                    </span>
                  </div>
                  <div style={{ height: '3px', background: currentBg.accentColor, width: '150px', marginBottom: '50px' }}></div>
                  
                  <h1 style={{ fontSize: '64px', fontWeight: '900', lineHeight: '1.2', margin: 0, letterSpacing: '-2px' }}>
                    Nhật Ký Chi Tiêu<br/>
                    Của <span style={{ color: currentBg.accentColor }}>{userName}</span>
                  </h1>
                </div>

                {/* Key stats section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  
                  {/* Total spent card */}
                  <div style={{
                    background: currentBg.cardBg,
                    border: currentBg.cardBorder,
                    borderRadius: '35px',
                    padding: '50px 60px',
                    backdropFilter: 'blur(20px)',
                  }}>
                    <span style={{ fontSize: '32px', fontWeight: '600', color: currentBg.statTitleColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Tổng số tiền đã chi
                    </span>
                    <div style={{ fontSize: '80px', fontWeight: '900', color: bgStyle === 'pastel' ? '#FE5C73' : '#FF4B72', marginTop: '15px', letterSpacing: '-2px' }}>
                      {fmt(totalExpense)}
                    </div>
                  </div>

                  {/* Income & savings split */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div style={{
                      background: currentBg.cardBg,
                      border: currentBg.cardBorder,
                      borderRadius: '30px',
                      padding: '35px 45px',
                      backdropFilter: 'blur(20px)'
                    }}>
                      <span style={{ fontSize: '24px', fontWeight: '600', color: currentBg.statTitleColor }}>
                        Thu nhập
                      </span>
                      <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '10px', color: bgStyle === 'pastel' ? '#10B981' : '#16DBCC' }}>
                        {fmt(totalIncome)}
                      </div>
                    </div>
                    
                    <div style={{
                      background: currentBg.cardBg,
                      border: currentBg.cardBorder,
                      borderRadius: '30px',
                      padding: '35px 45px',
                      backdropFilter: 'blur(20px)'
                    }}>
                      <span style={{ fontSize: '24px', fontWeight: '600', color: currentBg.statTitleColor }}>
                        Tích lũy được
                      </span>
                      <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '10px', color: currentBg.accentColor }}>
                        {totalIncome > totalExpense ? fmt(totalIncome - totalExpense) : fmt(0)}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Top spending categories */}
                <div>
                  <h3 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '30px', color: currentBg.statTitleColor }}>
                    🔥 Danh mục chi nhiều nhất
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {topCategories.length === 0 ? (
                      <div style={{ fontSize: '26px', opacity: 0.6 }}>Chưa ghi nhận chi tiêu nào trong tháng</div>
                    ) : (
                      topCategories.slice(0, 3).map((cat, idx) => (
                        <div key={idx} style={{
                          background: currentBg.cardBg,
                          border: currentBg.cardBorder,
                          borderRadius: '25px',
                          padding: '25px 40px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backdropFilter: 'blur(20px)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                            <span style={{ fontSize: '40px' }}>{parseIcon(cat.icon)}</span>
                            <span style={{ fontSize: '28px', fontWeight: '700' }}>{translateCategoryName(cat.name)}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '30px', fontWeight: '800', color: currentBg.accentColor }}>
                              {cat.percentage.toFixed(0)}%
                            </span>
                            <div style={{ fontSize: '22px', color: currentBg.mutedColor, marginTop: '4px' }}>
                              {fmt(cat.amount)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Personality & Quote */}
                <div style={{
                  background: currentBg.cardBg,
                  border: currentBg.cardBorder,
                  borderRadius: '35px',
                  padding: '45px 50px',
                  backdropFilter: 'blur(20px)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '36px', fontWeight: '900', color: currentBg.accentColor }}>
                      {personality.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '26px', margin: '0 0 20px 0', lineHeight: '1.4', color: currentBg.textColor }}>
                    {personality.desc}
                  </p>
                  <div style={{ fontSize: '24px', fontStyle: 'italic', color: currentBg.mutedColor, borderLeft: `4px solid ${currentBg.accentColor}`, paddingLeft: '20px' }}>
                    "{personality.quote}"
                  </div>
                </div>

                {/* Footer / QR / Slogan */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${bgStyle === 'pastel' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`, paddingTop: '40px' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: '500', opacity: 0.6 }}>Quản lý chi tiêu thông minh tại</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: currentBg.accentColor, marginTop: '5px' }}>expmgmt.site</div>
                  </div>
                  
                  {/* Styled QR Code Box */}
                  <div style={{
                    background: '#FFFFFF',
                    padding: '12px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ width: '80px', height: '80px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                      <div style={{ background: '#fff' }}></div>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                      <div style={{ background: '#fff' }}></div>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                      <div style={{ background: '#fff' }}></div>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                      <div style={{ background: '#fff' }}></div>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                      <div style={{ background: '#fff' }}></div>
                      <div style={{ background: '#111', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Right column: Configurations and Actions */}
        <div style={{
          flex: '1 1 350px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '10px 0'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '800',
                color: 'var(--text-main)',
                margin: 0
              }}>
                Wrapped Chi Tiêu Tháng
              </h2>
              <button 
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '5px'
                }}
                title="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Select Background Option */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '700',
                color: 'var(--text-muted)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Chọn phong cách hình nền:
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {/* Neon Option */}
                <button
                  onClick={() => setBgStyle('neon')}
                  style={{
                    background: 'linear-gradient(135deg, #0F0C20 0%, #15102A 100%)',
                    border: bgStyle === 'neon' ? '2.5px solid #16DBCC' : '1px solid var(--border-color)',
                    borderRadius: '16px',
                    height: '75px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    gap: '4px',
                    boxShadow: bgStyle === 'neon' ? '0 0 10px rgba(22, 219, 204, 0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🌌</span>
                  <span style={{ fontSize: '11px', fontWeight: '700' }}>Neon Dark</span>
                </button>

                {/* Sunset Option */}
                <button
                  onClick={() => setBgStyle('sunset')}
                  style={{
                    background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
                    border: bgStyle === 'sunset' ? '2.5px solid #FFD700' : '1px solid var(--border-color)',
                    borderRadius: '16px',
                    height: '75px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    gap: '4px',
                    boxShadow: bgStyle === 'sunset' ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🌅</span>
                  <span style={{ fontSize: '11px', fontWeight: '700' }}>Sunset</span>
                </button>

                {/* Pastel Option */}
                <button
                  onClick={() => setBgStyle('pastel')}
                  style={{
                    background: 'linear-gradient(135deg, #FFF0F5 0%, #E6E6FA 100%)',
                    border: bgStyle === 'pastel' ? '2.5px solid #8A2BE2' : '1px solid var(--border-color)',
                    borderRadius: '16px',
                    height: '75px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2E2A47',
                    gap: '4px',
                    boxShadow: bgStyle === 'pastel' ? '0 0 10px rgba(138, 43, 226, 0.2)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🌸</span>
                  <span style={{ fontSize: '11px', fontWeight: '700' }}>Pastel</span>
                </button>
              </div>
            </div>

            {/* Display parsed summary data to the user */}
            <div style={{
              background: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '20px',
              fontSize: '13.5px',
              color: 'var(--text-muted)',
              lineHeight: '1.6'
            }}>
              <h4 style={{
                margin: '0 0 10px 0',
                color: 'var(--text-main)',
                fontSize: '14px',
                fontWeight: '700'
              }}>
                📊 Báo cáo tóm tắt
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Tổng chi tiêu:</span>
                <strong style={{ color: '#FE5C73' }}>{fmt(totalExpense)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Tổng thu nhập:</span>
                <strong style={{ color: '#10B981' }}>{fmt(totalIncome)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>Danh hiệu:</span>
                <strong style={{ color: 'var(--text-main)' }}>{personality.title}</strong>
              </div>
              <p style={{ margin: 0, fontSize: '12px', fontStyle: 'italic', opacity: 0.8 }}>
                * Bức ảnh tạo ra sẽ có độ phân giải chuẩn dọc 1080x1920 (High-Definition) lý tưởng để chia sẻ trực tiếp lên các nền tảng mạng xã hội mà không bị vỡ nét.
              </p>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                height: '52px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                background: 'none',
                color: 'var(--text-main)',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Đóng
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              style={{
                flex: 2,
                height: '52px',
                borderRadius: '16px',
                border: 'none',
                background: isDownloading ? 'var(--text-muted)' : 'linear-gradient(135deg, #1814F3 0%, #6366F1 100%)',
                color: '#FFFFFF',
                fontWeight: '700',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(24, 20, 243, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s'
              }}
            >
              {isDownloading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  <span>Đang dựng ảnh...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>Tải ảnh PNG xuống</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

"use client";
import React from 'react';

interface FinancialWeatherProps {
  currentSummary: { income: number; expense: number };
  budgetMap: Record<string, number>;
}

const formatCurrencyLocal = (val: number) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + 'đ';
};

export default function FinancialWeather({ currentSummary, budgetMap }: FinancialWeatherProps) {
  const totalSpent = Math.abs(currentSummary.expense);
  const totalIncome = Math.abs(currentSummary.income);
  
  // Sum all category budgets to get the total budget limit
  const totalBudget = Object.values(budgetMap || {}).reduce((sum, limit) => sum + limit, 0);
  
  let ratio = 0;
  let hasBudget = totalBudget > 0;
  
  if (hasBudget) {
    ratio = (totalSpent / totalBudget) * 100;
  } else if (totalIncome > 0) {
    ratio = (totalSpent / totalIncome) * 100;
  } else if (totalSpent > 0) {
    ratio = 150; // default storm if they only spend without income/budget
  } else {
    ratio = 0;
  }

  // Determine weather status
  let status: 'sunny' | 'cloudy' | 'rainy' | 'stormy' = 'sunny';
  let title = 'Nắng rực rỡ';
  let icon = '';
  let color = 'linear-gradient(135deg, #FFF9E6 0%, #FFD043 100%)';
  let textColor = '#855E00';
  let borderColor = 'rgba(255, 208, 67, 0.3)';
  let advice = '';
  
  if (ratio <= 50) {
    status = 'sunny';
    title = 'Nắng rực rỡ';
    icon = '☀️';
    color = 'linear-gradient(135deg, rgba(254, 240, 138, 0.2) 0%, rgba(253, 224, 71, 0.4) 100%)';
    textColor = '#854d0e';
    borderColor = 'rgba(253, 224, 71, 0.4)';
    advice = 'Thời tiết tài chính rất đẹp! Sếp chi tiêu cực kỳ kỷ luật và tiết kiệm. Hãy duy trì thói quen vàng này nhé!';
  } else if (ratio <= 80) {
    status = 'cloudy';
    title = 'Nhiều mây';
    icon = '⛅';
    color = 'linear-gradient(135deg, rgba(226, 232, 240, 0.3) 0%, rgba(148, 163, 184, 0.4) 100%)';
    textColor = '#334155';
    borderColor = 'rgba(148, 163, 184, 0.4)';
    advice = 'Bầu trời tài chính bắt đầu âm u. Sếp hãy cân nhắc kỹ trước khi mua sắm các khoản chi không thực sự thiết yếu nhé!';
  } else if (ratio <= 100) {
    status = 'rainy';
    title = 'Mưa giông';
    icon = '🌧️';
    color = 'linear-gradient(135deg, rgba(186, 230, 253, 0.25) 0%, rgba(56, 189, 248, 0.4) 100%)';
    textColor = '#0369a1';
    borderColor = 'rgba(56, 189, 248, 0.4)';
    advice = 'Thời tiết xấu! Ngân sách chi tiêu sắp sửa cạn kiệt rồi. Hãy phanh gấp các hoạt động ăn chơi mua sắm lại ngay!';
  } else {
    status = 'stormy';
    title = 'Giông bão sấm sét';
    icon = '⚡';
    color = 'linear-gradient(135deg, rgba(254, 226, 226, 0.3) 0%, rgba(239, 68, 68, 0.35) 100%)';
    textColor = '#991b1b';
    borderColor = 'rgba(239, 68, 68, 0.4)';
    advice = 'Báo động đỏ! Giông bão tài chính đã đổ bộ! Sếp đã chi tiêu vượt hạn mức an toàn của tháng. Cần thắt lưng buộc bụng ngay lập tức!';
  }

  return (
    <div style={{
      background: color,
      border: `1px solid ${borderColor}`,
      borderRadius: '24px',
      padding: '20px 24px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      color: textColor,
      position: 'relative',
      overflow: 'hidden'
    }} className="momo-list-item-card">
      <style jsx>{`
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes floatCloud {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-4px) translateX(3px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        @keyframes shakeLightning {
          0%, 90%, 98%, 100% { transform: scale(1) skewX(0); opacity: 1; }
          95%, 97% { transform: scale(1.1) skewX(-2deg); opacity: 0.8; filter: drop-shadow(0 0 8px #FFD043); }
        }
        .weather-icon-sunny {
          animation: spinSlow 12s linear infinite;
        }
        .weather-icon-cloudy {
          animation: floatCloud 4s ease-in-out infinite;
        }
        .weather-icon-stormy {
          animation: shakeLightning 3s ease-in-out infinite;
        }
        @media (min-width: 768px) {
          .hidden-mobile-flex {
            display: flex !important;
          }
        }
      `}</style>

      {/* Large Visual Icon */}
      <div 
        className={`weather-icon-${status}`} 
        style={{
          fontSize: '56px',
          lineHeight: '1',
          userSelect: 'none',
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '70px',
          height: '70px'
        }}
      >
        {icon}
      </div>

      {/* Weather details */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Thời tiết tài chính</span>
          <span style={{
            fontSize: '11px',
            background: 'rgba(255,255,255,0.4)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 'bold',
            color: textColor
          }}>
            {hasBudget ? `Hạn mức ngân sách` : `Thu nhập tháng`}
          </span>
        </div>
        
        <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {title}
          <span style={{ fontSize: '14px', fontWeight: '700', opacity: 0.9 }}>
            ({ratio.toFixed(0)}% đã dùng)
          </span>
        </h2>

        <p style={{ fontSize: '13px', margin: '6px 0 0', fontWeight: '600', lineHeight: '1.4' }}>
          {advice}
        </p>

        {/* Small progress line showing visual speed */}
        <div style={{
          width: '100%',
          height: '5px',
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '3px',
          marginTop: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(100, ratio)}%`,
            height: '100%',
            background: status === 'sunny' ? '#10B981' : status === 'cloudy' ? '#94A3B8' : status === 'rainy' ? '#38BDF8' : '#EF4444',
            borderRadius: '3px',
            transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
        </div>
      </div>

      {/* Decorative details */}
      <div style={{
        textAlign: 'right',
        display: 'none',
        flexDirection: 'column',
        gap: '4px',
        borderLeft: '1px solid rgba(0,0,0,0.06)',
        paddingLeft: '20px',
        height: '50px',
        justifyContent: 'center',
        opacity: 0.85
      }} className="hidden-mobile-flex">
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Đã chi tiêu:</div>
        <div style={{ fontSize: '15px', fontWeight: '800' }}>
          {formatCurrencyLocal(totalSpent)}
        </div>
      </div>
    </div>
  );
}

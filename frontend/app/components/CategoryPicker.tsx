"use client";
import React, { useState, useEffect } from 'react';

const parseIcon = (iconName: string) => {
  const iconMap: Record<string, string> = {
    food: '🍜', car: '🚗', shopping_cart: '🛒', shopping_bag: '🛍️', gamepad: '🎮', 
    beauty: '💇', health: '🏥', heart: '💖', receipt: '📋', house: '🏠', 
    users: '🤝', chart: '📈', book: '📚', salary: '💰', award: '🏆', 
    business: '🏢', profit: '💹', debt: '📉', support: '🤗', building: '🏙️', 
    rings: '💍', grid: '🔲', monitor: '🖥️', cash: '💵', coffee: '☕', 
    baby_clothing: '👶', book_open: '📖', paw: '🐾', dumbbell: '🏋️', baby_bottle: '🍼', 
    masks: '🎭', beer: '🍺', suitcase: '🧳', tshirt: '👕', croissant: '🥐', 
    graduation_cap: '🎓', water_drop_money: '💧', basket: '🧺', cigarette: '🚬', teddy_bear: '🧸', 
    bread: '🍞', heart_paw: '🐾', globe: '🌍', hand_money: '🤲', coffee_cup: '☕', 
    money_bag: '💰', graduation_cap_alt: '🧑‍🎓', masks_alt: '🎭', house_money: '🏠', handshake: '🤝', 
    clapperboard: '🎬', medical_shield: '🛡️', lightbulb: '💡', gas_station: '⛽', gas_cylinder: '🛢️', 
    flower: '🌸', inbox_archive: '📥', heart_money: '💖', house_settings: '🏠', desktop: '🖥️', 
    shopping_cart_alt: '🛒', hand_coin: '🪙', piggy_bank: '🐷', scissors: '✂️', restaurant: '🍽️', 
    ticket: '🎫', motorcycle: '🏍️', dumbbell_alt: '🏋️‍♀️', house_search: '🏠', school: '🏫', 
    wallet_shield: '🛡️', car_settings: '🚗', first_aid: '🚑', parking: '🅿️', phone_call: '📞', 
    baby_carriage: '🚼', glove: '🧤', car_shopping: '🚗', train: '🚆', chair: '🪑', 
    car_alt: '🚙', bill: '🧾', teddy_bear_alt: '🧸', headphones: '🎧', laptop: '💻', 
    office_chair: '💺', medical_shield_alt: '🛡️', electricity: '⚡', hand_heart: '🫶', heart_plus: '💖', 
    gift_box: '🎁', spa: '💆', gift: '🎁', airplane: '✈️', chart_alt: '📊', 
    wallet: '👛', water_drop: '💧', discount: '🏷️', bill_dollar: '🧾', mobile_dollar: '📱', 
    bank: '🏦', network: '🌐', parking_alt: '🅿️'
  };
  return iconMap[iconName] || iconName;
};

interface CategoryPickerProps {
  value: string;
  onChange: (id: string) => void;
  type: string; // 'expense' or 'income'
  categories: any[]; // tree of categories
  tCategory?: (name: string) => string;
  placeholder?: string;
  disabled?: boolean;
}

export default function CategoryPicker({
  value,
  onChange,
  type,
  categories,
  tCategory = (name) => name,
  placeholder = "Chọn danh mục",
  disabled = false
}: CategoryPickerProps) {
  // Flatten the category list helper
  const getFlatCategories = () => {
    const flat: any[] = [];
    const traverse = (cats: any[]) => {
      cats.forEach(c => {
        flat.push(c);
        if (c.children && c.children.length > 0) {
          traverse(c.children);
        }
      });
    };
    traverse(categories);
    return flat;
  };

  const flatList = getFlatCategories();
  
  // Lọc danh mục cha có type tương ứng
  const parentGroups = categories.filter(c => c.type === type && c.parent_id === null);

  const [activeParentId, setActiveParentId] = useState<string>('');

  // Tự động tìm danh mục cha khi value thay đổi (Ví dụ: khi được AI điền tự động)
  useEffect(() => {
    if (value) {
      const selected = flatList.find(c => c.id === value);
      if (selected) {
        if (selected.parent_id) {
          setActiveParentId(selected.parent_id);
        } else {
          setActiveParentId(selected.id);
        }
      }
    } else if (parentGroups.length > 0 && !activeParentId) {
      setActiveParentId(parentGroups[0].id);
    }
  }, [value, categories, type]);

  // Cập nhật lại khi thay đổi loại (khoản chi / khoản thu)
  useEffect(() => {
    if (parentGroups.length > 0) {
      // Nếu danh mục cha hiện tại không thuộc nhóm mới, reset về danh mục cha đầu tiên
      const exists = parentGroups.some(g => g.id === activeParentId);
      if (!exists) {
        setActiveParentId(parentGroups[0].id);
      }
    }
  }, [type]);

  const currentParent = parentGroups.find(g => g.id === activeParentId) || parentGroups[0];
  const children = currentParent?.children || [];

  if (disabled) {
    const selectedCat = flatList.find(c => c.id === value);
    return (
      <div style={{
        width: '100%',
        padding: '12px 16px',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        background: 'var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '15px',
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {selectedCat ? (
          <>
            <span style={{ fontSize: '18px' }}>{parseIcon(selectedCat.icon || 'grid')}</span>
            <span style={{ fontWeight: '600' }}>{tCategory(selectedCat.name)}</span>
          </>
        ) : (
          <span>{placeholder}</span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', boxSizing: 'border-box' }}>
      {/* Danh mục cha */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#718EBF' }}>
            Danh mục cha
          </span>
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch'
        }}>
          {parentGroups.map((group) => {
            const isActive = activeParentId === group.id;
            const groupColor = group.color || '#1814F3';
            return (
              <div
                key={group.id}
                onClick={() => setActiveParentId(group.id)}
                style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: isActive ? `${groupColor}15` : 'var(--bg-color)',
                  border: isActive ? `2px solid ${groupColor}` : '2px solid var(--border-color)',
                  color: isActive ? groupColor : 'var(--text-main)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 4px 10px ${groupColor}15` : 'none',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)'
                }}
                onMouseOver={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = groupColor;
                }}
                onMouseOut={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <span style={{ fontSize: '18px' }}>{parseIcon(group.icon || 'grid')}</span>
                <span>{tCategory(group.name)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danh mục con */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#718EBF' }}>
            Danh mục con
          </span>
        </div>
        
        {children.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '10px',
            maxHeight: '180px',
            overflowY: 'auto',
            padding: '6px',
            background: 'var(--bg-color)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            {children.map((sub: any) => {
              const isSelected = value === sub.id;
              const subColor = sub.color || '#94a3b8';
              return (
                <div
                  key={sub.id}
                  onClick={() => onChange(sub.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 8px',
                    borderRadius: '12px',
                    background: isSelected ? subColor : 'var(--card-bg)',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    border: isSelected ? `2px solid ${subColor}` : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? `0 4px 8px ${subColor}30` : 'none',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1)'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = subColor;
                      e.currentTarget.style.background = 'var(--border-color)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.background = 'var(--card-bg)';
                    }
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.25)' : `${subColor}15`,
                    color: isSelected ? '#ffffff' : subColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    transition: 'all 0.2s'
                  }}>
                    {parseIcon(sub.icon)}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: isSelected ? '700' : '500',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}>
                    {tCategory(sub.name)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#718EBF',
            fontSize: '13px',
            background: 'var(--bg-color)',
            borderRadius: '12px',
            border: '1px dashed var(--border-color)'
          }}>
            Không có danh mục con nào cho nhóm này
          </div>
        )}
      </div>
    </div>
  );
}

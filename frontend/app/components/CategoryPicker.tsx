"use client";
import React, { useState, useRef, useEffect } from 'react';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
  '#F06292', '#AED581', '#FFD54F', '#4DB6AC', '#7986CB'
];

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
  const selectedCat = flatList.find(c => c.id === value);

  // Filter tree categories by active tab type ('expense' or 'income')
  const parentGroups = categories.filter(c => c.type === type && c.parent_id === null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger selection box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: (isOpen && !disabled) ? '#1814F3' : 'var(--border-color)',
          borderRadius: '12px',
          background: disabled ? 'var(--border-color)' : 'var(--bg-color)',
          color: 'var(--text-main)',
          fontSize: '15px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
          transition: 'all 0.2s',
          boxShadow: (isOpen && !disabled) ? '0 0 0 3px rgba(24, 20, 243, 0.1)' : 'none'
        }}
      >
        {selectedCat ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>{parseIcon(selectedCat.icon || 'grid')}</span>
            <span style={{ fontWeight: '600' }}>{tCategory(selectedCat.name)}</span>
          </div>
        ) : (
          <span style={{ color: '#718EBF' }}>{placeholder}</span>
        )}
        <span style={{ color: '#718EBF', fontSize: '10px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>▼</span>
      </div>

      {/* Popover Selection Panel */}
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'var(--card-bg)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxHeight: '380px',
          overflowY: 'auto',
          padding: '20px',
          boxSizing: 'border-box',
          animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {parentGroups.length > 0 ? (
            parentGroups.map((group) => {
              const children = group.children || [];
              if (children.length === 0) return null;

              return (
                <div key={group.id} style={{ marginBottom: '20px' }}>
                  {/* Group Header */}
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#718EBF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '6px',
                    marginBottom: '12px'
                  }}>
                    {tCategory(group.name)}
                  </div>

                  {/* Grid of Subcategories */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    justifyItems: 'center'
                  }}>
                    {children.map((sub: any) => {
                      const isSelected = value === sub.id;
                      const subColor = sub.color || '#94a3b8';
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            onChange(sub.id);
                            setIsOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'all 0.2s'
                          }}
                        >
                          {/* Circular/Rounded icon wrap */}
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '14px',
                            background: isSelected ? subColor : `${subColor}15`,
                            color: isSelected ? '#ffffff' : subColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            transition: 'all 0.2s',
                            border: isSelected ? `2.5px solid ${subColor}` : '2.5px solid transparent',
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                          }}>
                            {parseIcon(sub.icon)}
                          </div>
                          
                          {/* Subcategory Name */}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: isSelected ? '700' : '500',
                            color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
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
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#718EBF', fontSize: '14px' }}>
              Không có danh mục nào
            </div>
          )}
          
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

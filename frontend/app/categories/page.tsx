"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';

import { categoryApi } from '../lib/api';

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

export default function Categories() {
  const { isLoggedIn, categories, isLoadingCategories, createCategory, updateCategory, deleteCategory, userData } = useAppContext();
  const { t, language } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deleteModeGroupId, setDeleteModeGroupId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    icon: '🍜',
    color: '#FF6B6B'
  });

  const [apiIcons, setApiIcons] = useState<string[]>([]);

  useEffect(() => {
    const fetchIcons = async () => {
      try {
        const res = await categoryApi.getIcons();
        if (res.data) setApiIcons(res.data);
      } catch (err) {
        console.error("Lỗi lấy danh sách icon", err);
      }
    };
    fetchIcons();
  }, []);

  const parentCategories = categories.filter(c => c.type === activeTab);
  const filteredCategories = parentCategories; // The groups to display on the main page for the active tab

  const handleOpenModal = (cat: any = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        parent_id: cat.parent_id,
        icon: cat.icon,
        color: cat.color || '#FF6B6B'
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        parent_id: filteredCategories.length > 0 ? filteredCategories[0].id : '',
        icon: apiIcons.length > 0 ? apiIcons[0] : 'food',
        color: COLORS[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('delete_confirm_msg'))) {
      try {
        await deleteCategory(id);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const getSubcategories = (parentId: string) => {
    const parent = categories.find(c => c.id === parentId);
    return parent?.children || [];
  };

  return (
    <div className="dashboard-container" style={{background: 'var(--bg-color)'}}>
      <Sidebar activeItem="categories" />
      <main className="main-content">
        {/* Modern Header */}
        <nav className="navbar" style={{
          background: 'transparent',
          padding: '15px 40px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div>
            <h1 className="page-title" style={{
              fontSize: '22px',
              fontWeight: '700',
              color: 'var(--text-main)',
              margin: 0
            }}>
              {t('category_management')}
            </h1>
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            {/* Search Bar */}
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <span style={{position: 'absolute', left: '15px', color: '#718EBF', fontSize: '18px'}}>🔍</span>
              <input 
                type="text" 
                placeholder={t('search_placeholder')} 
                style={{
                  background: '#F5F7FA',
                  border: 'none',
                  padding: '10px 15px 10px 45px',
                  borderRadius: '25px',
                  width: '250px',
                  fontSize: '14px',
                  outline: 'none',
                  color: '#718EBF'
                }}
              />
            </div>

            {/* Notification Icon */}
            <Link href="/notifications" style={{background: '#F5F7FA', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb300', cursor: 'pointer', fontSize: '20px', textDecoration: 'none'}}>
              🔔
            </Link>

            {/* User Profile */}
            <div className="nav-actions">
              {isLoggedIn ? (
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <span style={{fontWeight: '600', color: 'var(--text-main)', fontSize: '15px'}}>
                    {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                  </span>
                  <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                    <img 
                      src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=EM&backgroundColor=b6e3f4"} 
                      alt="Avatar" 
                      style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                    />
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                  </div>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  style={{
                    background: '#343C6A', 
                    color: 'white', 
                    padding: '10px 25px', 
                    borderRadius: '40px', 
                    textDecoration: 'none', 
                    fontWeight: '700', 
                    fontSize: '14px'
                  }}
                >
                  {t('login')}
                </Link>
              )}
            </div>
          </div>
        </nav>

        <div className="content-area" style={{padding: '32px 40px'}}>
          {/* Enhanced Tabs */}
          <div className="tabs-container">
            <button 
              onClick={() => setActiveTab('expense')}
              className={`tab-item ${activeTab === 'expense' ? 'active' : ''}`}
            >
              <span style={{fontSize: '18px'}}>💸</span>
              <span>{t('spending')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('income')}
              className={`tab-item ${activeTab === 'income' ? 'active' : ''}`}
            >
              <span style={{fontSize: '18px'}}>💰</span>
              <span>{t('income')}</span>
            </button>
          </div>

          {/* Premium Add Button */}
          <button 
            onClick={() => handleOpenModal()}
            className="add-category-card"
          >
            <div className="plus-icon">+</div>
            <div style={{textAlign: 'left'}}>
              <div style={{fontWeight: '700', color: 'var(--text-main)', fontSize: '15px'}}>{t('add_new_category')}</div>
              <div style={{fontSize: '12px', color: '#718EBF', marginTop: '2px'}}>{t('limit_reached')}</div>
            </div>
          </button>

          {isLoadingCategories ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{t('loading')}...</p>
            </div>
          ) : (
            <div className="categories-grid">
              {filteredCategories.map((group) => (
                <div key={group.id} className="category-group-card">
                  <div className="group-header">
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <div className="group-icon-wrap" style={{background: (group.color || '#6366f1') + '20', color: group.color || '#6366f1'}}>
                        {parseIcon(group.icon || '📁')}
                      </div>
                      <h3 style={{fontSize: '17px', fontWeight: '700', color: 'var(--text-main)', margin: 0}}>{group.name}</h3>
                    </div>
                    <div className="group-actions">
                      <button onClick={() => handleOpenModal(group)} className="action-btn edit">{t('edit')}</button>
                      <button onClick={() => setDeleteModeGroupId(deleteModeGroupId === group.id ? null : group.id)} className={`action-btn delete ${deleteModeGroupId === group.id ? 'active' : ''}`}>
                        {deleteModeGroupId === group.id ? t('done') : t('delete')}
                      </button>
                    </div>
                  </div>

                  <div className="subcategories-grid">
                    {getSubcategories(group.id).map((sub: any) => {
                      const isDefault = sub.is_default || sub.user_id === null;
                      const isDeleting = deleteModeGroupId === group.id;
                      const canDelete = !isDefault;
                      
                      return (
                        <div 
                          key={sub.id} 
                          className={`sub-item-card ${(isDeleting && canDelete) ? 'jiggling' : ''}`}
                          style={{opacity: (isDeleting && !canDelete) ? 0.3 : 1, cursor: (isDeleting && !canDelete) ? 'not-allowed' : 'pointer'}}
                          onClick={(e) => {
                            if (isDeleting) {
                              if (canDelete) {
                                handleDelete(sub.id, e);
                              }
                            } else {
                              handleOpenModal(sub);
                            }
                          }}
                        >
                          <div className="sub-icon-circle" style={{background: (sub.color || '#94a3b8') + '15', color: sub.color || '#94a3b8', border: `1px solid ${(sub.color || '#94a3b8')}30`}}>
                            {parseIcon(sub.icon)}
                          </div>
                          <span className="sub-name">{sub.name}</span>
                          {(isDeleting && canDelete) && (
                            <div className="delete-badge">✕</div>
                          )}
                          <div className="item-hover-indicator"></div>
                        </div>
                      );
                    })}
                    <button 
                      className="sub-item-card add-sub"
                      onClick={() => {
                        setFormData({ ...formData, parent_id: group.id });
                        setEditingCategory(null);
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="sub-icon-circle add">+</div>
                      <span className="sub-name" style={{color: '#718EBF'}}>{t('select') || 'Thêm'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-glass">
            <button className="close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
            <h2 className="modal-title">{editingCategory ? t('edit') : t('management')} {t('categories')}</h2>
            
            <form onSubmit={handleSubmit} className="premium-form">
              <div className="avatar-preview-section">
                 <div className="preview-circle" style={{background: formData.color + '15', color: formData.color, border: '3px solid ' + formData.color}}>
                    {parseIcon(formData.icon)}
                 </div>
                 <button type="button" onClick={() => setIsIconPickerOpen(true)} className="change-btn">
                   <span style={{fontSize: '12px'}}>✨</span> {t('change_icon')}
                 </button>
              </div>

              <div className="form-group">
                <label>{t('category_name')} *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder={t('cat_name_placeholder')} 
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('parent_category')} *</label>
                <div 
                  className="custom-select-trigger"
                  onClick={() => setIsParentPickerOpen(true)}
                >
                  {formData.parent_id ? (
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <span style={{fontSize: '20px'}}>{parseIcon(categories.find(c => c.id === formData.parent_id)?.icon || '📁')}</span>
                      <span style={{fontWeight: '600', color: 'var(--text-main)'}}>{categories.find(c => c.id === formData.parent_id)?.name}</span>
                    </div>
                  ) : (
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <span style={{fontSize: '20px'}}>🌟</span>
                      <span style={{fontWeight: '600', color: 'var(--text-main)'}}>{t('set_as_parent')}</span>
                    </div>
                  )}
                  <span className="arrow-icon">∟</span>
                </div>
              </div>

              <button type="submit" className="submit-btn-gradient">
                {editingCategory ? t('save_changes') : t('confirm')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Icon Picker Popover */}
      {isIconPickerOpen && (
        <div className="modal-overlay secondary">
           <div className="picker-panel">
              <div className="picker-header">
                <h3>{t('choose_icon_color') || 'Chọn Icon & Màu'}</h3>
                <button onClick={() => setIsIconPickerOpen(false)}>✕</button>
              </div>
              <div className="icons-scroll grid">
                {apiIcons.length > 0 ? apiIcons.map(icon => (
                  <div 
                    key={icon} 
                    onClick={() => { setFormData({...formData, icon}); setIsIconPickerOpen(false); }}
                    className={`icon-box ${formData.icon === icon ? 'active' : ''}`}
                    title={icon}
                  >
                    <span style={{fontSize: '24px'}}>{parseIcon(icon)}</span>
                  </div>
                )) : (
                  <div style={{padding: '20px', color: '#718EBF'}}>{t('loading_icons') || 'Đang tải icon...'}</div>
                )}
              </div>
              <div className="color-section">
                <p>{t('select_tone') || 'Chọn tông màu'}</p>
                <div className="colors-grid">
                  {COLORS.map(color => (
                    <div 
                      key={color} 
                      onClick={() => setFormData({...formData, color})}
                      className={`color-dot ${formData.color === color ? 'active' : ''}`}
                      style={{background: color}}
                    />
                  ))}
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Parent Category Picker Modal */}
      {isParentPickerOpen && (
        <div className="modal-overlay secondary">
          <div className="picker-panel parent-picker">
            <div className="picker-header">
              <h3 style={{fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)'}}>{t('choose_parent_cat')}</h3>
              <button onClick={() => setIsParentPickerOpen(false)}>✕</button>
            </div>
            <div className="parent-list">
              {/* Option for Root Category */}
              <div 
                className={`parent-option-card ${!formData.parent_id ? 'selected' : ''}`}
                onClick={() => {
                  setFormData({...formData, parent_id: ''});
                  setIsParentPickerOpen(false);
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div className="parent-icon-circle" style={{background: '#f1f5f9', color: '#718EBF'}}>
                    🌟
                  </div>
                  <span style={{fontWeight: '600', color: 'var(--text-main)'}}>{t('set_as_parent')}</span>
                </div>
                <div className={`radio-circle ${!formData.parent_id ? 'checked' : ''}`}></div>
              </div>

              {/* Show Sample/Fetched Parent Categories */}
              {parentCategories.map(p => (
                <div 
                  key={p.id} 
                  className={`parent-option-card ${formData.parent_id === p.id ? 'selected' : ''}`}
                  onClick={() => {
                    setFormData({...formData, parent_id: p.id});
                    setIsParentPickerOpen(false);
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div className="parent-icon-circle" style={{background: (p.color || '#f1f5f9') + '20', color: p.color || '#718EBF'}}>
                      {parseIcon(p.icon || '📁')}
                    </div>
                    <span style={{fontWeight: '600', color: 'var(--text-main)'}}>{p.name}</span>
                  </div>
                  <div className={`radio-circle ${formData.parent_id === p.id ? 'checked' : ''}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        /* Tabs container & items */
        .tabs-container {
          display: flex;
          gap: 6px;
          margin-bottom: 32px;
          background: #edeff3;
          padding: 6px;
          border-radius: 16px;
          width: fit-content;
          border: 1px solid var(--border-color);
        }

        .tab-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          color: #718EBF;
          background: transparent;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }

        .tab-item:hover {
          color: #1814F3;
        }

        .tab-item.active {
          color: #1814F3;
          background: var(--card-bg);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
          font-weight: 700;
        }

        /* Add category card */
        .add-category-card {
          width: 100%;
          padding: 24px;
          background: var(--card-bg);
          border: 2px dashed var(--border-color);
          border-radius: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 40px;
          outline: none;
          box-sizing: border-box;
        }

        .add-category-card:hover {
          border-color: #1814F3;
          background: rgba(24, 20, 243, 0.02);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(24, 20, 243, 0.04);
        }

        .plus-icon {
          width: 48px;
          height: 48px;
          background: #f1f5f9;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #718EBF;
          font-weight: 700;
          transition: all 0.3s;
        }

        .add-category-card:hover .plus-icon {
          background: #1814F3;
          color: white;
        }

        /* Category Grid */
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
        }

        /* Parent category group card */
        .category-group-card {
          background: var(--card-bg);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.02);
          border: 1px solid var(--border-color);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .category-group-card:hover {
          box-shadow: 0 16px 36px rgba(0,0,0,0.05);
          transform: translateY(-2px);
        }

        .group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .group-icon-wrap {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
        }

        /* Action buttons for parent groups */
        .group-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 6px 14px;
          border-radius: 10px;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          background: #f8fafc;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }

        .action-btn.edit {
          color: #1814F3;
          background: #F0F5FF;
        }
        .action-btn.edit:hover {
          background: #E7EDFF;
          box-shadow: 0 2px 8px rgba(24, 20, 243, 0.1);
        }

        .action-btn.delete {
          color: #ef4444;
          background: #FFF2F4;
        }
        .action-btn.delete:hover {
          background: #FFE2E5;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
        }

        .action-btn.delete.active {
          background: #ef4444;
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        /* Subcategories grid and items */
        .subcategories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 16px;
        }

        .sub-item-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 12px 6px;
          border-radius: 18px;
          position: relative;
          background: transparent;
          border: 1px solid transparent;
        }

        .sub-item-card:hover {
          background: #f8fafc;
          border-color: #f1f5f9;
          transform: translateY(-4px);
        }

        .sub-icon-circle {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sub-item-card:hover .sub-icon-circle {
          transform: scale(1.05);
        }

        .sub-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-main);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          padding: 0 4px;
        }

        /* Delete Mode configurations */
        @keyframes jiggle {
          0% { transform: rotate(-1.5deg); }
          50% { transform: rotate(1.5deg); }
          100% { transform: rotate(-1.5deg); }
        }

        .sub-item-card.jiggling {
          animation: jiggle 0.25s infinite;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
          border-color: #FFE2E5;
          background: #FFF8F8;
        }

        .delete-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
          z-index: 10;
        }

        /* Add sub-item card */
        .sub-item-card.add-sub {
          border: 1.5px dashed var(--border-color);
        }
        .sub-item-card.add-sub:hover {
          background: rgba(24, 20, 243, 0.02);
          border-color: #1814F3;
        }

        .sub-icon-circle.add {
          background: #f1f5f9;
          color: #718EBF;
          font-weight: 700;
          font-size: 20px;
          border: 1px dashed transparent;
        }

        .sub-item-card.add-sub:hover .sub-icon-circle.add {
          background: #1814F3;
          color: white;
        }

        /* Glass Modal & overlays */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .modal-overlay.secondary {
          z-index: 1100;
        }

        .modal-content-glass {
          background: var(--card-bg);
          width: 100%;
          max-width: 480px;
          padding: 40px;
          border-radius: 32px;
          border: 1px solid var(--border-color);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.12);
          position: relative;
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .close-modal {
          position: absolute;
          top: 24px;
          right: 24px;
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #718EBF;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 700;
        }

        .close-modal:hover {
          background: #FFE2E5;
          color: #ef4444;
        }

        .modal-title {
          text-align: center;
          font-size: 22px;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 32px;
        }

        .premium-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .avatar-preview-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
        }

        .preview-circle {
          width: 96px;
          height: 96px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 20px rgba(0,0,0,0.03);
        }

        .change-btn {
          background: #F0F5FF;
          border: none;
          padding: 8px 18px;
          border-radius: 12px;
          color: #1814F3;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .change-btn:hover {
          background: #E7EDFF;
          transform: translateY(-1px);
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .form-group input, .form-group select {
          width: 100%;
          padding: 14px 20px;
          border-radius: 14px;
          border: 1px solid var(--border-color);
          background: var(--bg-color);
          font-size: 15px;
          color: var(--text-main);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          box-sizing: border-box;
        }

        .form-group input:focus {
          border-color: #1814F3;
          box-shadow: 0 0 0 3px rgba(24, 20, 243, 0.1);
          background: var(--card-bg);
        }

        .submit-btn-gradient {
          padding: 16px;
          background: linear-gradient(135deg, #1814F3 0%, #396AFF 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(24, 20, 243, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 10px;
        }

        .submit-btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(24, 20, 243, 0.35);
        }

        /* Picker Panels (Icon & Parent) */
        .picker-panel {
          background: var(--card-bg);
          width: 100%;
          max-width: 440px;
          border-radius: 28px;
          padding: 30px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          border: 1px solid var(--border-color);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .picker-header h3 {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
          color: var(--text-main);
        }

        .picker-header button {
          background: #f1f5f9;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 11px;
          color: #718EBF;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .picker-header button:hover {
          background: #FFE2E5;
          color: #ef4444;
        }

        .icons-scroll {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          max-height: 260px;
          overflow-y: auto;
          padding: 4px;
          margin-bottom: 20px;
        }

        .icon-box {
          aspect-ratio: 1;
          background: #f8fafc;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1.5px solid transparent;
        }

        .icon-box:hover {
          background: #f1f5f9;
          transform: scale(1.05);
        }

        .icon-box.active {
          background: #E7EDFF;
          border-color: #1814F3;
          color: #1814F3;
        }

        .color-section {
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }

        .color-section p {
          margin: 0 0 12px;
          font-weight: 700;
          font-size: 13px;
          color: #718EBF;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .colors-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .color-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
          border: 3px solid white;
          box-shadow: 0 0 0 1px #cbd5e1;
        }

        .color-dot.active {
          box-shadow: 0 0 0 2px #1814F3;
          transform: scale(1.1);
        }

        /* Custom trigger select */
        .custom-select-trigger {
          width: 100%;
          padding: 14px 20px;
          border-radius: 14px;
          border: 1px solid var(--border-color);
          background: var(--bg-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .custom-select-trigger:hover {
          border-color: #1814F3;
        }

        .arrow-icon {
          color: #718EBF;
          font-size: 18px;
          transform: rotate(45deg);
          transition: all 0.2s;
        }

        /* Parent category options */
        .parent-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
          max-height: 340px;
          overflow-y: auto;
          padding-right: 5px;
        }

        .parent-option-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: var(--bg-color);
          border: 1.5px solid transparent;
          border-radius: 18px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .parent-option-card:hover {
          background: var(--card-bg);
          border-color: var(--border-color);
          transform: translateX(4px);
        }

        .parent-option-card.selected {
          border-color: #1814F3;
          background: #F0F5FF;
        }

        .parent-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .radio-circle {
          width: 20px;
          height: 20px;
          border: 2px solid #cbd5e1;
          border-radius: 50%;
          position: relative;
          transition: all 0.2s;
        }

        .radio-circle.checked {
          border-color: #1814F3;
          background: #1814F3;
        }

        .radio-circle.checked::after {
          content: '';
          position: absolute;
          inset: 5px;
          background: white;
          border-radius: 50%;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          color: #718EBF;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #edeff3;
          border-top: 3px solid #1814F3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';
import { budgetApi } from '../lib/api';

const parseIcon = (iconName: string) => {
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
  return iconMap[iconName] || iconName;
};

export default function Budget() {
  const { isLoggedIn, userData, categories } = useAppContext();
  const { t } = useLanguage();
  
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [budgetsList, setBudgetsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // States for Add/Update Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // empty string means overall monthly budget
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch budgets
  const fetchBudgets = async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const res = await budgetApi.getAll(month, year);
      setBudgetsList(res.data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBudgets();
    }
  }, [isLoggedIn, month, year]);

  // Flatten categories list for dropdown selection
  const flatCategories = useMemo(() => {
    const flatten = (cats: any[], prefix = ''): any[] => {
      let result: any[] = [];
      cats.forEach(cat => {
        const emoji = parseIcon(cat.icon || '');
        result.push({ ...cat, displayName: prefix + emoji + ' ' + cat.name });
        if (cat.children && cat.children.length > 0) {
          result = [...result, ...flatten(cat.children, prefix + '— ')];
        }
      });
      return result;
    };
    return flatten(categories);
  }, [categories]);

  // Calculate overall budget stats
  const overallBudget = budgetsList.find(b => b.category_id === null);
  const categoryBudgets = budgetsList.filter(b => b.category_id !== null);

  const totalLimit = overallBudget 
    ? parseFloat(overallBudget.limit_amount) 
    : categoryBudgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0);

  const totalUsed = overallBudget 
    ? parseFloat(overallBudget.used_amount) 
    : categoryBudgets.reduce((sum, b) => sum + parseFloat(b.used_amount), 0);

  const totalPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
  const fmt = (n: number) => Math.round(n).toLocaleString('vi-VN') + '₫';

  // Create or update budget
  const handleSaveBudget = async () => {
    if (!limitAmount || parseFloat(limitAmount) <= 0) {
      alert('Vui lòng nhập số tiền hạn mức hợp lệ!');
      return;
    }

    setIsSubmitting(true);
    try {
      await budgetApi.createOrUpdate({
        category_id: selectedCategory ? selectedCategory : null,
        limit_amount: parseFloat(limitAmount),
        month,
        year
      });
      setIsModalOpen(false);
      setSelectedCategory('');
      setLimitAmount('');
      await fetchBudgets();
    } catch (error: any) {
      alert(error.message || 'Lỗi khi lưu hạn mức ngân sách');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete budget
  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ngân sách này?')) {
      try {
        await budgetApi.delete(id);
        await fetchBudgets();
      } catch (error: any) {
        alert(error.message || 'Lỗi khi xóa ngân sách');
      }
    }
  };

  // Copy budgets from previous month
  const handleCopyBudgets = async () => {
    const fromMonth = month === 1 ? 12 : month - 1;
    const fromYear = month === 1 ? year - 1 : year;

    if (window.confirm(`Bạn có muốn sao chép toàn bộ hạn mức ngân sách từ tháng ${fromMonth}/${fromYear} sang tháng ${month}/${year} không?`)) {
      setIsLoading(true);
      try {
        const res = await budgetApi.copy({
          from_month: fromMonth,
          from_year: fromYear,
          to_month: month,
          to_year: year
        });
        alert(`Sao chép thành công! Đã sao chép ${res.data?.length || 0} mục hạn mức.`);
        await fetchBudgets();
      } catch (error: any) {
        alert(error.message || 'Không tìm thấy ngân sách nguồn để sao chép!');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="budget" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar" style={{background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)',backdropFilter:'blur(10px)',position:'sticky',top:0,zIndex:10}}>
          <h1 className="page-title" style={{color:'var(--text-main)'}}>{t('budget')}</h1>
          <div className="nav-actions" style={{display:'flex', alignItems:'center', gap:'12px'}}>
            
            {/* CHỌN THÁNG/NĂM */}
            <div style={{display:'flex', gap:'8px', marginRight: '10px'}}>
              <select 
                value={month} 
                onChange={e => setMonth(parseInt(e.target.value))}
                style={{padding:'8px 12px', border:'1px solid var(--border-color)', borderRadius:'10px', background:'var(--bg-color)', color:'var(--text-main)', fontSize:'14px', fontWeight:'600'}}
              >
                {Array.from({length:12}, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={e => setYear(parseInt(e.target.value))}
                style={{padding:'8px 12px', border:'1px solid var(--border-color)', borderRadius:'10px', background:'var(--bg-color)', color:'var(--text-main)', fontSize:'14px', fontWeight:'600'}}
              >
                {Array.from({length:7}, (_, i) => now.getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}
            >
              {t('set_budget')}
            </button>
            <button 
              onClick={handleCopyBudgets}
              style={{background:'transparent',color:'#1814F3',padding:'10px 20px',borderRadius:'12px',fontWeight:'600',border:'1px solid #1814F3',cursor:'pointer'}}
            >
              {t('copy_from_previous_month')}
            </button>
            
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
                  {userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user')}
                </span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=SpendWise&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold', marginLeft: '10px'}}>{t('login')}</Link>
            )}
          </div>
        </nav>
        
        <div className="content-area">
          {/* TỔNG QUAN NGÂN SÁCH */}
          <div style={{background:'linear-gradient(135deg,#1814F3,#6366F1)',borderRadius:'20px',padding:'30px',color:'#fff',marginBottom:'24px', boxShadow:'0 10px 30px rgba(24, 20, 243, 0.2)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
              <div style={{fontSize:'14px',opacity:0.85}}>{overallBudget ? 'TỔNG NGÂN SÁCH THÁNG' : 'TỔNG NGÂN SÁCH CÁC DANH MỤC'} - {month}/{year}</div>
              {overallBudget && (
                <button 
                  onClick={() => handleDeleteBudget(overallBudget.id)}
                  style={{background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', color:'#fff', padding:'4px 8px', fontSize:'11px', fontWeight:'600', cursor:'pointer'}}
                >
                  Xóa hạn mức tổng
                </button>
              )}
            </div>
            <div style={{fontSize:'36px',fontWeight:'800',marginBottom:'15px'}}>{fmt(totalUsed)} / {fmt(totalLimit)}</div>
            <div style={{width:'100%',height:'12px',background:'rgba(255,255,255,0.2)',borderRadius:'6px'}}>
                <div style={{width:`${Math.min(totalPct, 100)}%`,height:'100%',background:totalPct>80?'#FE5C73':'#16DBCC',borderRadius:'6px',transition:'width 0.5s'}}></div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'10px',fontSize:'13px',opacity:0.85}}>
                <span>{t('used_label')} {totalPct}%</span>
                <span>{t('remaining_label')} {fmt(Math.max(totalLimit - totalUsed, 0))} {totalUsed > totalLimit && `(Vượt ${fmt(totalUsed - totalLimit)})`}</span>
            </div>
          </div>

          {/* LƯỚI NGÂN SÁCH DANH MỤC */}
          {isLoading ? (
            <div style={{display:'flex', justifyContent:'center', padding:'80px', color:'var(--text-main)', fontSize:'16px'}}>{t('loading')}...</div>
          ) : categoryBudgets.length > 0 ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))',gap:'20px'}}>
              {categoryBudgets.map((b,i)=>{
                const limit = parseFloat(b.limit_amount);
                const used = parseFloat(b.used_amount);
                const pct = limit > 0 ? Math.round(used/limit*100) : 0;
                const catName = b.category?.name || 'Danh mục khác';
                const catIcon = parseIcon(b.category?.icon || 'grid');
                const catColor = b.category?.color || '#FF6384';
                
                return(
                  <div key={b.id} style={{background:'var(--card-bg)',borderRadius:'20px',padding:'24px',border:'1px solid var(--border-color)', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:'170px', boxShadow:'0 4px 15px rgba(0,0,0,0.02)'}}>
                    <div>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                          <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',background:`${catColor}15`}}>{catIcon}</div>
                          <div>
                            <div style={{fontWeight:'700',color:'var(--text-main)'}}>{catName}</div>
                            <div style={{fontSize:'13px',color:'#718EBF'}}>{t('limit_label')} {fmt(limit)}</div>
                          </div>
                        </div>
                        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px'}}>
                          {pct>=80 && (
                            <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:pct>=100?'#FFE0EB':'#FFF5D9',color:pct>=100?'#FE5C73':'#FF9800', whiteSpace:'nowrap'}}>
                              {pct>=100?t('over_budget'):t('almost_empty')}
                            </span>
                          )}
                          <button 
                            onClick={() => handleDeleteBudget(b.id)}
                            style={{background:'none', border:'none', color:'#FE5C73', fontSize:'12px', fontWeight:'600', cursor:'pointer', padding:'2px 4px'}}
                          >
                            Xóa hạn mức
                          </button>
                        </div>
                      </div>
                      <div style={{width:'100%',height:'10px',background:'var(--bg-color)',borderRadius:'5px',marginBottom:'8px'}}>
                        <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:pct>=80?'#FE5C73':catColor,borderRadius:'5px',transition:'width 0.6s'}}></div>
                      </div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                      <span style={{color:pct>=80?'#FE5C73':catColor,fontWeight:'600'}}>{fmt(used)}</span>
                      <span style={{color:'#718EBF'}}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{background:'var(--card-bg)', border:'1px dashed var(--border-color)', borderRadius:'20px', padding:'60px 20px', textAlign:'center', color:'#718EBF'}}>
              <div style={{fontSize:'40px', marginBottom:'16px'}}>📊</div>
              <h3 style={{color:'var(--text-main)', marginBottom:'8px'}}>Chưa thiết lập ngân sách</h3>
              <p style={{fontSize:'14px', maxWidth:'400px', margin:'0 auto 20px'}}>Bắt đầu kiểm soát tài chính bằng cách đặt hạn mức chi tiêu cho các danh mục hoặc ngân sách chung trong tháng này.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{background:'#1814F3',color:'#fff',padding:'10px 24px',borderRadius:'12px',fontWeight:'600',border:'none',cursor:'pointer'}}
              >
                Đặt ngân sách ngay
              </button>
            </div>
          )}
        </div>
      </main>

      {/* MODAL ĐẶT NGÂN SÁCH */}
      {isModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000, backdropFilter: 'blur(4px)'}}>
          <div style={{background: 'var(--card-bg)',borderRadius:'24px',padding:'30px',width:'450px',maxWidth:'95%',boxShadow:'0 10px 40px rgba(0,0,0,0.1)'}}>
             <h2 style={{color: 'var(--text-main)',marginBottom:'24px',fontSize:'20px',fontWeight:'700'}}>Thiết lập ngân sách hạn mức</h2>
             
             <div style={{marginBottom:'20px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>Áp dụng cho danh mục</label>
               <select 
                 value={selectedCategory} 
                 onChange={e=>setSelectedCategory(e.target.value)} 
                 style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}}
               >
                  <option value="">Ngân sách chung (Toàn bộ chi tiêu)</option>
                  {flatCategories.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
               </select>
             </div>

             <div style={{marginBottom:'24px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>Số tiền hạn mức (đ)</label>
               <input 
                 type="number" 
                 value={limitAmount} 
                 onChange={e=>setLimitAmount(e.target.value)} 
                 placeholder="VD: 5000000" 
                 style={{width:'100%',padding:'12px',border: '1px solid var(--border-color)',borderRadius:'12px',background: 'var(--bg-color)',color: 'var(--text-main)',fontSize:'15px'}} 
               />
             </div>
             
             <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
               <button style={{padding:'12px 24px',background: 'var(--bg-color)',color:'#718EBF',borderRadius:'12px',border: '1px solid var(--border-color)',cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={()=>setIsModalOpen(false)} disabled={isSubmitting}>{t('cancel')}</button>
               <button 
                style={{padding:'12px 24px',background:'#1814F3',color:'#fff',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:'600',fontSize:'15px', display:'flex', alignItems:'center', gap:'8px'}} 
                onClick={handleSaveBudget} 
                disabled={isSubmitting}
               >
                 {isSubmitting ? 'Đang lưu...' : 'Lưu ngân sách'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

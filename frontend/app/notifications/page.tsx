"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../lib/translations';

export default function Notifications() {
  const { isLoggedIn, transactions, userData } = useAppContext();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', desc: '' });
  
  const submitNotif = () => setIsModalOpen(false);
  
  const hasData = isLoggedIn && transactions.length > 0;

  const notifs = [
    {title: t('budget_warning') || 'Cảnh báo ngân sách', desc: t('budget_warning_desc') || 'Mua sắm đã đạt 90% ngân sách', time:'2 phút trước', type:'warning', icon:'⚠️', read:false},
    {title: t('recurring_transaction') || 'Giao dịch định kỳ', desc: t('recurring_transaction_desc') || 'Tiền thuê nhà đã tự động ghi nhận', time:'1 giờ trước', type:'info', icon:'🔄', read:false},
    {title: t('over_budget') || 'Vượt ngân sách!', desc: t('over_budget_desc') || 'Tiền thuê đã sử dụng 100%', time:'3 giờ trước', type:'danger', icon:'🚨', read:false},
    {title: t('weekly_summary') || 'Tóm tắt tuần', desc: 'Chi 2.350.000₫, giảm 15% so với tuần trước', time:'1 ngày trước', type:'success', icon:'📊', read:true},
    {title: t('reminder_label') || 'Nhắc nhở', desc: t('reminder_desc') || 'Chưa ghi nhận chi tiêu hôm qua', time:'1 ngày trước', type:'reminder', icon:'📝', read:true},
  ];
  const tc:Record<string,{bg:string,b:string}>={warning:{bg:'#FFF5D9',b:'#FF9800'},info:{bg:'#E7EDFF',b:'#1814F3'},danger:{bg:'#FFE0EB',b:'#FE5C73'},success:{bg:'#DCFAF8',b:'#16DBCC'},reminder:{bg:'#F3E8FF',b:'#9966FF'}};

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="notifications" />
      <main className="main-content" style={{background:'var(--bg-color)'}}>
        <nav className="navbar" style={{background:'var(--card-bg)',borderBottom:'1px solid var(--border-color)',backdropFilter:'blur(10px)',position:'sticky',top:0,zIndex:10}}>
          <h1 className="page-title" style={{color:'var(--text-main)'}}>{t('notifications')}</h1>
          <div className="nav-actions">
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'24px',fontWeight:'600',border:'none',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',gap:'8px',whiteSpace:'nowrap'}} onClick={()=>setIsModalOpen(true)}>{t('create_notification')}</button>
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
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'24px'}}>
            <div style={{background:'linear-gradient(135deg,#FE5C73,#FF8A65)',borderRadius:'16px',padding:'20px',color:'#fff'}}><div style={{fontSize:'28px',fontWeight:'800'}}>{hasData?3:0}</div><div>{t('unread')}</div></div>
            <div style={{background:'linear-gradient(135deg,#FF9800,#FFB74D)',borderRadius:'16px',padding:'20px',color:'#fff'}}><div style={{fontSize:'28px',fontWeight:'800'}}>{hasData?1:0}</div><div>{t('warning_label')}</div></div>
            <div style={{background:'linear-gradient(135deg,#1814F3,#6366F1)',borderRadius:'16px',padding:'20px',color:'#fff'}}><div style={{fontSize:'28px',fontWeight:'800'}}>{hasData?1:0}</div><div>{t('auto_transaction')}</div></div>
          </div>
          {(hasData?notifs:[]).map((n,i)=>(
            <div key={i} style={{background: 'var(--card-bg)',borderRadius:'16px',padding:'20px',border:`1px solid ${n.read?'#E6EFF5':tc[n.type].b}`,borderLeft:`4px solid ${tc[n.type].b}`,display:'flex',alignItems:'center',gap:'16px',opacity:n.read?0.7:1,marginBottom:'12px'}}>
              <div style={{width:'45px',height:'45px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',background:tc[n.type].bg}}>{n.icon}</div>
              <div style={{flex:1}}><div style={{fontWeight:'700',color:'var(--text-main)'}}>{n.title}</div><div style={{fontSize:'14px',color:'#718EBF'}}>{n.desc}</div></div>
              <span style={{color:'#B1B5C3',fontSize:'13px'}}>{n.time}</span>
            </div>
          ))}
          {!isLoggedIn && <p style={{color:'#718EBF',textAlign:'center',padding:'40px',background: 'var(--card-bg)',borderRadius:'16px',border: `1px solid var(--border-color)`}}>{t('login_to_view_notifications')}</p>}
        </div>
      </main>

      {/* MODAL TẠO THÔNG BÁO */}
      {isModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background: 'var(--card-bg)',borderRadius:'24px',padding:'30px',width:'450px',maxWidth:'90%',boxShadow:'0 10px 40px rgba(0,0,0,0.1)'}}>
             <h2 style={{color:'var(--text-main)',marginBottom:'20px',fontSize:'20px',fontWeight:'700'}}>{t('send_system_notification')}</h2>
             
             <div style={{marginBottom:'15px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('title_label')}</label>
               <input type="text" value={newNotif.title} onChange={e=>setNewNotif({...newNotif,title:e.target.value})} placeholder={t('notif_title_placeholder')} style={{width:'100%',padding:'14px',border: `1px solid var(--border-color)`,borderRadius:'12px',background:'var(--input-bg)',color:'var(--text-main)',fontSize:'15px'}} />
             </div>

             <div style={{marginBottom:'25px'}}>
               <label style={{display:'block',marginBottom:'8px',color:'#718EBF',fontSize:'14px',fontWeight:'500'}}>{t('content_label')}</label>
               <textarea value={newNotif.desc} onChange={e=>setNewNotif({...newNotif,desc:e.target.value})} placeholder={t('notif_content_placeholder')} style={{width:'100%',padding:'14px',border: `1px solid var(--border-color)`,borderRadius:'12px',background:'var(--input-bg)',color:'var(--text-main)',fontSize:'15px',minHeight:'100px',fontFamily:'inherit'}}></textarea>
             </div>
             
             <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
               <button style={{padding:'12px 24px',background:'var(--input-bg)',color:'#718EBF',borderRadius:'12px',border: `1px solid var(--border-color)`,cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={()=>setIsModalOpen(false)}>{t('cancel')}</button>
               <button style={{padding:'12px 24px',background:'#1814F3',color:'#fff',borderRadius:'12px',border:'none',cursor:'pointer',fontWeight:'600',fontSize:'15px'}} onClick={submitNotif}>{t('send_notification')}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

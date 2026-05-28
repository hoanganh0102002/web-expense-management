"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

export default function Settings() {
  const { isLoggedIn, logout } = useAppContext();
  const [activeTab, setActiveTab] = useState('profile');
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="settings" />
      <main className="main-content" style={{background:'#F8F9FB'}}>
        <nav className="navbar" style={{background:'#fff',borderBottom:'1px solid #E6EFF5'}}>
          <h1 className="page-title" style={{color:'#343C6A'}}>Cài đặt & Tùy chỉnh</h1>
          <div className="nav-actions">
            <button style={{background:'#1814F3',color:'#fff',padding:'10px 20px',borderRadius:'24px',fontWeight:'600',border:'none',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',gap:'8px'}}>+ Lưu cài đặt</button>
            {isLoggedIn ? <img src="https://i.pravatar.cc/150?img=5" alt="Avatar" className="avatar"/> : <Link href="/login" style={{textDecoration:'none',color:'#fff',background:'#343C6A',padding:'8px 15px',borderRadius:'20px',fontWeight:'bold'}}>Đăng nhập</Link>}
          </div>
        </nav>
        <div className="content-area">
          <div style={{background:'#fff', borderRadius:'20px', padding:'30px', border:'1px solid #E6EFF5', minHeight:'500px'}}>
            <div style={{display:'flex', gap:'30px', borderBottom:'1px solid #E6EFF5', marginBottom:'30px'}}>
              {[{k:'profile',l:'Hồ sơ'},{k:'preferences',l:'Tùy chọn'},{k:'security',l:'Bảo mật & Phiên'},{k:'data',l:'Dữ liệu'}].map(tab=>(
                <div key={tab.k} onClick={()=>setActiveTab(tab.k)} style={{paddingBottom:'10px', color: activeTab===tab.k?'#1814F3':'#718EBF', borderBottom: activeTab===tab.k?'3px solid #1814F3':'none', fontWeight:activeTab===tab.k?'600':'400', cursor:'pointer'}}>{tab.l}</div>
              ))}
            </div>

            {activeTab === 'profile' && (
              <div style={{display:'flex', gap:'40px'}}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'15px'}}>
                  {isLoggedIn ? (
                    <img src="https://i.pravatar.cc/150?img=5" alt="Profile" style={{width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover'}} />
                  ) : (
                    <div style={{width:'100px', height:'100px', borderRadius:'50%', background:'#E6EFF5', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="#B1B5C3"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                  )}
                 <button style={{border:'1px solid #2D60FF', color: isLoggedIn?'#2D60FF':'#B1B5C3', background:'transparent', padding:'6px 16px', borderRadius:'20px', cursor: isLoggedIn?'pointer':'not-allowed', fontSize:'13px', borderColor: isLoggedIn?'#2D60FF':'#E6EFF5'}} disabled={!isLoggedIn}>{isLoggedIn?'Thay đổi ảnh':'Chưa đăng nhập'}</button>
                </div>
                <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                  {[{l:'Họ tên',v:'Nguyễn Văn A'},{l:'Email',v:'nguyenvana@gmail.com'},{l:'SĐT',v:'0987654321'},{l:'Địa chỉ',v:'Quận 1, TP. HCM'}].map((f,i)=>(
                    <div key={i}><label style={{display:'block', marginBottom:'8px', color:'#343C6A', fontWeight:'500', fontSize:'14px'}}>{f.l}</label><input type="text" defaultValue={isLoggedIn?f.v:''} placeholder={isLoggedIn?'':'Vui lòng đăng nhập'} disabled={!isLoggedIn} style={{width:'100%', padding:'12px 16px', border:'1px solid #E6EFF5', borderRadius:'10px', background:'#F8F9FB', color:'#343C6A', fontSize:'14px'}} /></div>
                  ))}
                  <div></div>
                  <button style={{width:'fit-content', padding:'12px 30px', background:'#1814F3', color:'#fff', border:'none', borderRadius:'10px', fontWeight:'600', cursor:'pointer', marginTop:'10px', opacity: isLoggedIn?1:0.5}} disabled={!isLoggedIn}>Lưu thay đổi</button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                  <div>
                    <label style={{display:'block', marginBottom:'8px', color:'#343C6A', fontWeight:'500', fontSize:'14px'}}>Đơn vị tiền tệ hiển thị</label>
                    <select disabled={!isLoggedIn} style={{width:'100%', padding:'12px 16px', border:'1px solid #E6EFF5', borderRadius:'10px', background:'#F8F9FB', color:'#343C6A', fontSize:'14px'}}>
                      <option>VNĐ (₫)</option><option>USD ($)</option><option>EUR (€)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:'8px', color:'#343C6A', fontWeight:'500', fontSize:'14px'}}>Ngày bắt đầu tháng tài chính</label>
                    <select disabled={!isLoggedIn} style={{width:'100%', padding:'12px 16px', border:'1px solid #E6EFF5', borderRadius:'10px', background:'#F8F9FB', color:'#343C6A', fontSize:'14px'}}>
                      <option>Ngày 1 hàng tháng</option><option>Ngày 5 hàng tháng (Ngày lương)</option><option>Ngày 15 hàng tháng</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:'8px', color:'#343C6A', fontWeight:'500', fontSize:'14px'}}>Ngôn ngữ giao diện</label>
                    <select disabled={!isLoggedIn} style={{width:'100%', padding:'12px 16px', border:'1px solid #E6EFF5', borderRadius:'10px', background:'#F8F9FB', color:'#343C6A', fontSize:'14px'}}>
                      <option>Tiếng Việt</option><option>English</option>
                    </select>
                  </div>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px 0', borderBottom:'1px solid #E6EFF5', marginTop:'10px'}}>
                  <span style={{color:'#343C6A', fontWeight:'500'}}>Chế độ tối (Dark Mode)</span>
                  <div style={{width:'44px', height:'24px', borderRadius:'12px', background: isLoggedIn?'#1814F3':'#E6EFF5', position:'relative', cursor:'pointer'}}><div style={{width:'20px', height:'20px', borderRadius:'50%', background:'#fff', position:'absolute', top:'2px', left: isLoggedIn?'22px':'2px', transition:'0.3s'}}></div></div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
                <div>
                  <h3 style={{color:'#343C6A', marginBottom:'15px', fontSize:'18px'}}>Đổi mật khẩu</h3>
                  <div style={{display:'flex', flexDirection:'column', gap:'15px', maxWidth:'400px'}}>
                    {[{l:'Mật khẩu hiện tại'},{l:'Mật khẩu mới'},{l:'Xác nhận mật khẩu mới'}].map((f,i)=>(
                      <div key={i}><input type="password" placeholder={f.l} disabled={!isLoggedIn} style={{width:'100%', padding:'12px 16px', border:'1px solid #E6EFF5', borderRadius:'10px', background:'#F8F9FB', color:'#343C6A', fontSize:'14px'}} /></div>
                    ))}
                    <button style={{width:'fit-content', padding:'10px 20px', background:'#1814F3', color:'#fff', border:'none', borderRadius:'10px', fontWeight:'600', cursor:'pointer', opacity: isLoggedIn?1:0.5}} disabled={!isLoggedIn}>Cập nhật mật khẩu</button>
                  </div>
                </div>
                <div>
                  <h3 style={{color:'#343C6A', marginBottom:'15px', fontSize:'18px'}}>Quản lý phiên đăng nhập</h3>
                  <div style={{border:'1px solid #E6EFF5', borderRadius:'10px', padding:'15px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                      <div style={{display:'flex', gap:'10px'}}>
                        <div style={{fontSize:'24px'}}>💻</div>
                        <div><div style={{fontWeight:'600', color:'#343C6A'}}>Windows 11 - Chrome</div><div style={{fontSize:'12px', color:'#16DBCC'}}>Thiết bị hiện tại</div></div>
                      </div>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'10px', borderTop:'1px solid #E6EFF5'}}>
                      <div style={{display:'flex', gap:'10px'}}>
                        <div style={{fontSize:'24px'}}>📱</div>
                        <div><div style={{fontWeight:'600', color:'#343C6A'}}>iPhone 14 Pro Max</div><div style={{fontSize:'12px', color:'#718EBF'}}>Hoạt động 2 giờ trước</div></div>
                      </div>
                      <button style={{border:'1px solid #FE5C73', color:'#FE5C73', background:'transparent', padding:'6px 16px', borderRadius:'10px', cursor:'pointer', fontSize:'12px', fontWeight:'600'}}>Đăng xuất</button>
                    </div>
                  </div>
                  <button style={{marginTop:'15px', border:'none', color:'#FE5C73', background:'transparent', cursor:'pointer', fontWeight:'600', fontSize:'14px'}}>Đăng xuất khỏi tất cả thiết bị</button>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
                <div>
                  <h3 style={{color:'#343C6A', marginBottom:'10px', fontSize:'18px'}}>Nhập dữ liệu (Import CSV)</h3>
                  <p style={{color:'#718EBF', fontSize:'14px', marginBottom:'15px'}}>Bạn có thể nhập dữ liệu chi tiêu từ các ứng dụng khác (MoneyLover, Sổ Thu Chi...) thông qua file CSV.</p>
                  <label htmlFor="file-upload" style={{display:'inline-block', padding:'12px 20px', background:'#E7EDFF', color:'#1814F3', borderRadius:'10px', cursor: isLoggedIn?'pointer':'not-allowed', fontWeight:'600', opacity: isLoggedIn?1:0.5}}>Chọn file CSV</label>
                  <input id="file-upload" type="file" accept=".csv" disabled={!isLoggedIn} style={{display:'none'}} />
                </div>
                <div style={{borderTop:'1px solid #E6EFF5', paddingTop:'30px'}}>
                  <h3 style={{color:'#FE5C73', marginBottom:'10px', fontSize:'18px'}}>Vùng nguy hiểm</h3>
                  <p style={{color:'#718EBF', fontSize:'14px', marginBottom:'15px'}}>Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu giao dịch, ví, ngân sách. Hành động này không thể hoàn tác.</p>
                  <button style={{padding:'12px 20px', background:'#FFE0EB', color:'#FE5C73', borderRadius:'10px', cursor: isLoggedIn?'pointer':'not-allowed', fontWeight:'600', border:'1px solid #FE5C73', opacity: isLoggedIn?1:0.5}} disabled={!isLoggedIn}>Xóa tài khoản</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

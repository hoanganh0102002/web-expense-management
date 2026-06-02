/**
 * API Service - Kết nối Frontend với PHP Laravel
 */

const API_BASE_URL = 'https://exp-mgmt-dev.onrender.com/api';

// Helper: Lấy token
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      // Đừng phát tín hiệu nếu chính endpoint /logout bị 401
      if (typeof window !== 'undefined' && !endpoint.includes('/logout')) {
        window.dispatchEvent(new CustomEvent('auth-unauthorized'));
      }
    }
    const error: any = new Error(data.message || 'Có lỗi xảy ra từ hệ thống API');
    error.status = response.status;
    throw error;
  }
  return data;
};

// --- AUTH APIs ---
export const authApi = {
  login: (credentials: any) => apiFetch('/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) => apiFetch('/register', { method: 'POST', body: JSON.stringify(userData) }),
  socialLogin: (provider: string, token: string) => {
    const redirect_uri = typeof window !== 'undefined' ? `${window.location.origin}/login` : '';
    return apiFetch('/auth/social', { method: 'POST', body: JSON.stringify({ provider, token, redirect_uri }) });
  },
  logout: () => apiFetch('/logout', { method: 'POST' }),
  logoutAll: (userId?: string) => apiFetch('/logout-all', { 
    method: 'POST',
    headers: userId ? { 'X-User-Id': userId } : {}
  }),
  forgotPassword: (email: string) => apiFetch('/auth/forgot-password', { 
    method: 'POST', 
    body: JSON.stringify({ email }) 
  }),
  changePassword: (data: any) => apiFetch('/user/change-password', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  updateProfile: (data: any) => apiFetch('/user/profile', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  updateAvatar: (formData: FormData) => {
    const token = localStorage.getItem('access_token');
    return fetch('https://exp-mgmt-dev.onrender.com/api/user/avatar', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cập nhật ảnh đại diện thất bại');
      return data;
    });
  },
  deleteAccount: () => apiFetch('/user', { method: 'DELETE' }),
};

// --- WALLET APIs ---
export const walletApi = {
  // Lấy danh sách ví (GET /api/wallets)
  getAll: () => apiFetch('/wallets'),

  // Tạo ví mới (POST /api/wallets)
  create: (data: any) => apiFetch('/wallets', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      available_balance: data.available_balance || '0'
    })
  }),

  // Cập nhật ví (POST /api/wallets/{id} - Theo route Laravel của bạn là POST)
  update: (id: string, data: any) => apiFetch(`/wallets/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Xóa mềm ví (DELETE /api/wallets/{id})
  delete: (id: string) => apiFetch(`/wallets/${id}`, { method: 'DELETE' }),
};

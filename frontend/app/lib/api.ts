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
    throw new Error(data.message || 'Có lỗi xảy ra từ hệ thống API');
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

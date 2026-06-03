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

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  // Nếu bị 401 (Unauthorized)
  if (response.status === 401) {
    // Nếu lỗi xảy ra khi đang cố gắng refresh hoặc logout/login thì văng lỗi luôn
    if (endpoint.includes('/refresh') || endpoint.includes('/logout') || endpoint.includes('/login')) {
      if (typeof window !== 'undefined' && !endpoint.includes('/login')) {
        window.dispatchEvent(new CustomEvent('auth-unauthorized'));
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Hết phiên đăng nhập');
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        // Gọi API refresh token
        // Một số hệ thống dùng POST /refresh với token cũ trong Header Authorization
        const refreshResponse = await fetch(`${API_BASE_URL}/refresh`, {
          method: 'POST',
          headers: getAuthHeaders()
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newToken = refreshData.access_token;
          
          if (newToken) {
            localStorage.setItem('access_token', newToken);
            isRefreshing = false;
            onTokenRefreshed(newToken);
            
            // Thử lại request hiện tại
            return apiFetch(endpoint, options);
          }
        }
        
        throw new Error('Refresh token failed');
      } catch (error) {
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-unauthorized'));
        }
        throw error;
      }
    }

    // Nếu đang có một request khác đang refresh, chờ nó xong rồi thử lại
    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        resolve(apiFetch(endpoint, options));
      });
    });
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
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
  refresh: () => apiFetch('/refresh', { method: 'POST' }),
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
    return fetch(`${API_BASE_URL}/user/avatar`, {
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

// --- CATEGORY APIs ---
export const categoryApi = {
  // Lấy toàn bộ cây danh mục (GET /api/categories)
  getAll: () => apiFetch('/categories'),

  // Lấy danh sách icon
  getIcons: () => apiFetch('/categories/icons'),

  // Tạo danh mục tùy chỉnh mới (POST /api/categories)
  create: (data: { name: string; parent_id: string; icon: string; color: string }) => 
    apiFetch('/categories', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),

  // Cập nhật danh mục (POST /api/categories/{id})
  update: (id: string, data: { name?: string; icon?: string; color?: string }) => 
    apiFetch(`/categories/${id}`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),

  // Xóa danh mục tùy chỉnh (DELETE /api/categories/{id})
  delete: (id: string) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),

  // Gộp danh mục (POST /api/categories/merge)
  merge: (fromId: string, toId: string) => 
    apiFetch('/categories/merge', { 
      method: 'POST', 
      body: JSON.stringify({ from_category_id: fromId, to_category_id: toId }) 
    }),
};


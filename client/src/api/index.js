import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截器：自动添加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理认证过期
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401（未认证/token 过期）或 403 + 令牌相关错误 → 清除登录状态
    const status = error.response?.status;
    const errMsg = error.response?.data?.error || '';
    const isTokenInvalid = status === 401 || (status === 403 && errMsg.includes('令牌'));
    if (isTokenInvalid) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 认证 API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  demo: () => api.post('/auth/demo'),
  logout: () => api.post('/auth/logout'),
  userCount: () => api.get('/auth/user-count'),
  checkUsername: (username) => api.get(`/auth/check-username/${encodeURIComponent(username)}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getTargetLevel: () => api.get('/auth/target-level'),
  setTargetLevel: (targetLevel) => api.put('/auth/target-level', { targetLevel }),
};

// 文章 API
export const articlesAPI = {
  import: (data) => api.post('/articles/import', data),
  getAll: () => api.get('/articles'),
  get: (id) => api.get(`/articles/${id}`),
  clickWord: (articleId, word, wordIndex) => api.post(`/articles/${articleId}/click-word`, { word, wordIndex }),
  unclickWord: (articleId, word) => api.post(`/articles/${articleId}/unclick-word`, { word }),
  clickPhrase: (articleId, phrase, indices) => api.post(`/articles/${articleId}/click-phrase`, { phrase, indices }),
  unclickPhrase: (articleId, phrase) => api.post(`/articles/${articleId}/unclick-phrase`, { phrase }),
  grammarCheck: (text) => api.post('/articles/grammar-check', { text }),
  uploadFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/articles/upload-file', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  finish: (articleId, wordMeanings) => api.post(`/articles/${articleId}/finish`, { wordMeanings }),
  update: (id, data) => api.put(`/articles/${id}`, data),
  delete: (id) => api.delete(`/articles/${id}`),
  saveProgress: (articleId, data) => api.post(`/articles/${articleId}/save-progress`, data),
  getProgress: (articleId) => api.get(`/articles/${articleId}/progress`),
  deleteProgress: (articleId) => api.delete(`/articles/${articleId}/progress`),
  getUnfinished: () => api.get('/articles/reading/unfinished'),
};

// 生词库 API
export const vocabAPI = {
  getAll: (params) => api.get('/vocabulary', { params }),
  get: (id) => api.get(`/vocabulary/${id}`),
  update: (id, data) => api.put(`/vocabulary/${id}`, data),
  updateMeaning: (vocabId, meaningId, data) => api.put(`/vocabulary/${vocabId}/meanings/${meaningId}`, data),
  deleteMeaning: (vocabId, meaningId) => api.delete(`/vocabulary/${vocabId}/meanings/${meaningId}`),
  master: (id) => api.post(`/vocabulary/${id}/master`),
  restore: (id) => api.post(`/vocabulary/${id}/restore`),
};

// 统计 API
export const statsAPI = {
  overview: () => api.get('/stats/overview'),
  levelHistory: () => api.get('/stats/level-history'),
  session: (id) => api.get(`/stats/session/${id}`),
  sessions: () => api.get('/stats/sessions'),
  reviewSuggestions: () => api.get('/stats/review-suggestions'),
};

export default api;

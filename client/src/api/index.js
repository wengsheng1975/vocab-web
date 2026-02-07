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
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证 API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  demo: () => api.post('/auth/demo'),
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
};

// 生词库 API
export const vocabAPI = {
  getAll: (params) => api.get('/vocabulary', { params }),
  get: (id) => api.get(`/vocabulary/${id}`),
  update: (id, data) => api.put(`/vocabulary/${id}`, data),
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

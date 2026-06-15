import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tt_token')
      localStorage.removeItem('tt_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (data) => api.post('/api/auth/register', data),
}

export const loadsApi = {
  getAll: () => api.get('/api/loads'),
  getOne: (id) => api.get(`/api/loads/${id}`),
  create: (data) => api.post('/api/loads', data),
  update: (id, data) => api.put(`/api/loads/${id}`, data),
  addUpdate: (id, message) => api.post(`/api/loads/${id}/updates`, { message }),
  addDocument: (id, name, url) => api.post(`/api/loads/${id}/documents`, { name, url }),
}

export const brokersApi = {
  getAll: () => api.get('/api/brokers'),
}

export default api

import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('user')
    const user = stored && stored !== 'undefined' ? JSON.parse(stored) : null
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`
    }
  } catch {
    localStorage.removeItem('user')
  }
  return config
})

// Auto-logout on 401 Unauthorized or 403 Forbidden (token expired or invalidated)
api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    if (status === 401 || status === 403) {
      const isAuthRoute = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register')
      if (!isAuthRoute) {
        localStorage.removeItem('user')
        window.location.href = '/login?expired=true'
      }
    }
    return Promise.reject(err)
  }
)

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const sendOtp = (email) => api.post(`/auth/send-otp?email=${email}`)
export const verifyOtp = (email, otp) => api.post(`/auth/verify-otp?email=${email}&otp=${otp}`)
export const forgotPassword = (email) => api.post(`/auth/forgot-password?email=${email}`)
export const resetPassword = (token, newPassword) =>
  api.post(`/auth/reset-password?token=${token}&newPassword=${newPassword}`)

// Accounts
export const getAccounts = () => api.get('/accounts')
export const createAccount = (data) => api.post('/accounts', data)
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data)
export const deleteAccount = (id) => api.delete(`/accounts/${id}`)

// Transactions
export const getTransactions = () => api.get('/transactions')
export const createTransaction = (data) => api.post('/transactions', data)
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data)
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`)
export const importCsv = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/transactions/import/csv', form)
}
export const importExcel = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/transactions/import/excel', form)
}

// Dashboard
export const getDashboardSummary = (month = '') =>
  api.get(`/dashboard/summary?month=${month}`)

// Categories
export const getCategories = () => api.get('/categories')
export const createCategory = (data) => api.post('/categories', data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`)

// Budgets
export const getBudgets = (month = '') => api.get(`/budgets?month=${month}`)
export const saveBudget = (data) => api.post('/budgets', data)
export const deleteBudget = (id) => api.delete(`/budgets/${id}`)

// Recurring
export const getRecurring = () => api.get('/recurring')
export const createRecurring = (data) => api.post('/recurring', data)
export const updateRecurring = (id, data) => api.put(`/recurring/${id}`, data)
export const deleteRecurring = (id) => api.delete(`/recurring/${id}`)

// Goals
export const getGoals = () => api.get('/goals')
export const createGoal = (data) => api.post('/goals', data)
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data)
export const addSavings = (id, amount) => api.post(`/goals/${id}/add-savings?amount=${amount}`)
export const deleteGoal = (id) => api.delete(`/goals/${id}`)

// Financial Challenges / Experiments
export const getChallenges = () => api.get('/challenges')
export const createChallenge = (data) => api.post('/challenges', data)
export const deleteChallenge = (id) => api.delete(`/challenges/${id}`)

// Insights & Intelligence
export const getInsights = () => api.get('/insights')
export const getPulse = () => api.get('/analytics/pulse')
export const getStory = () => api.get('/analytics/story')
export const getHealth = () => api.get('/analytics/health')
export const getForecast = () => api.get('/analytics/forecast')
export const simulateScenario = (data) => api.post('/analytics/simulate', data)
export const evaluateDecision = (data) => api.post('/analytics/decision', data)
export const getDigitalTwin = () => api.get('/analytics/digital-twin')
export const getSubscriptionsSummary = () => api.get('/analytics/subscriptions')
export const getBehavior = () => api.get('/analytics/behavior')

// Financial Copilot
export const askCopilot = (question) => api.post('/copilot/ask', { question })

// Currency
export const getRates = (base) => api.get(`/currency/rates/${base}`)
export const convertCurrency = (from, to, amount) =>
  api.get(`/currency/convert?from=${from}&to=${to}&amount=${amount}`)

// Reports
export const downloadPdf = (from, to) =>
  api.get(`/reports/pdf?from=${from}&to=${to}`, { responseType: 'blob' })
export const downloadExcel = (from, to) =>
  api.get(`/reports/excel?from=${from}&to=${to}`, { responseType: 'blob' })

export default api
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import BudgetPage from './pages/BudgetPage'
import GoalsPage from './pages/GoalsPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import InsightsPage from './pages/InsightsPage'
import FinancialHealthPage from './pages/FinancialHealthPage'
import ForecastPage from './pages/ForecastPage'
import SimulatorPage from './pages/SimulatorPage'
import DecisionCenterPage from './pages/DecisionCenterPage'
import DigitalTwinPage from './pages/DigitalTwinPage'
import ReportsPage from './pages/ReportsPage'
import AccountsPage from './pages/AccountsPage'
import CashFlowPage from './pages/CashFlowPage'
import ExperimentsPage from './pages/ExperimentsPage'
import RecurringPage from './pages/RecurringPage'
import SettingsPage from './pages/SettingsPage'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return !user ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right" 
          toastOptions={{
            className: 'bg-panel text-slate-100 border-line text-xs font-sans',
            duration: 4000,
          }}
        />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/verify-otp" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Private Core & Intelligence Routes */}
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
          <Route path="/budgets" element={<PrivateRoute><BudgetPage /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><GoalsPage /></PrivateRoute>} />
          <Route path="/subscriptions" element={<PrivateRoute><SubscriptionsPage /></PrivateRoute>} />
          <Route path="/insights" element={<PrivateRoute><InsightsPage /></PrivateRoute>} />
          <Route path="/health" element={<PrivateRoute><FinancialHealthPage /></PrivateRoute>} />
          <Route path="/forecast" element={<PrivateRoute><ForecastPage /></PrivateRoute>} />
          <Route path="/simulator" element={<PrivateRoute><SimulatorPage /></PrivateRoute>} />
          <Route path="/decision-center" element={<PrivateRoute><DecisionCenterPage /></PrivateRoute>} />
          <Route path="/digital-twin" element={<PrivateRoute><DigitalTwinPage /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
          <Route path="/accounts" element={<PrivateRoute><AccountsPage /></PrivateRoute>} />
          <Route path="/cash-flow" element={<PrivateRoute><CashFlowPage /></PrivateRoute>} />
          <Route path="/experiments" element={<PrivateRoute><ExperimentsPage /></PrivateRoute>} />
          <Route path="/recurring" element={<PrivateRoute><RecurringPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
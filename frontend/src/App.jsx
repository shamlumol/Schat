import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import CallsPage from './pages/CallsPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ChatProvider from './context/ChatProvider'

function App() {
  useEffect(() => {
    if (localStorage.getItem('nova_theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Router>
      <ChatProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage viewMode="all" />} />
          <Route path="/pinned" element={<DashboardPage viewMode="pinned" />} />
          <Route path="/archive" element={<DashboardPage viewMode="archive" />} />
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Routes>
      </ChatProvider>
    </Router>
  )
}

export default App

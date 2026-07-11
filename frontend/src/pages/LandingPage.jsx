import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Show the minimal loading animation for 1.5 seconds, then redirect
    const timer = setTimeout(() => {
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    }, 1500) 

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
      {/* Minimal Animated Loading Logo */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        <span className="material-symbols-outlined text-primary text-3xl absolute animate-pulse">chat</span>
      </div>
      <h1 className="mt-8 text-2xl font-bold tracking-widest text-on-surface opacity-90 animate-pulse">SCHAT</h1>
    </div>
  )
}

export default LandingPage

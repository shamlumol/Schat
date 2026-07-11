import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import axios from 'axios'
import { ChatState } from '../context/ChatProvider'
import GenericModal from '../components/GenericModal'

function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = ChatState() || { setUser: () => { } }
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.login-container', {
        y: 30,
        scale: 0.98,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out(1.2)',
      })
      gsap.from('.animate-item', {
        y: 15,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        delay: 0.15,
        ease: 'power3.out',
      })
    }, cardRef)
    return () => ctx.revert()
  }, [])

  const handleToggleState = (e) => {
    e.preventDefault()
    gsap.to('.glass-card-content', {
      opacity: 0,
      y: 8,
      duration: 0.2,
      onComplete: () => {
        setIsRegister(!isRegister)
        setName('')
        setEmail('')
        setPassword('')
        setErrorMsg('')
        gsap.to('.glass-card-content', {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'power3.out'
        })
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const config = {
        headers: {
          'Content-type': 'application/json',
        },
      }

      let data;
      if (isRegister) {
        const username = email.split('@')[0]
        const res = await axios.post('/api/auth/register', { username, email, password, displayName: name }, config)
        data = res.data
      } else {
        const res = await axios.post('/api/auth/login', { email, password }, config)
        data = res.data
      }

      localStorage.setItem('nova_userInfo', JSON.stringify(data))
      if (setUser) setUser(data)

      gsap.to('.login-container', {
        scale: 0.98,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => navigate('/dashboard'),
      })
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (emailToReset) => {
    if (!emailToReset) return;
    try {
      const config = { headers: { 'Content-type': 'application/json' } };
      await axios.post('/api/auth/forgot-password', { email: emailToReset }, config);
      alert('Password reset link sent to your email.');
      setForgotPasswordModalOpen(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending password reset link');
    }
  };

  return (
    <div ref={cardRef} className="bg-[#f0f4f8] text-on-surface min-h-screen flex p-4 sm:p-6 md:p-8 antialiased font-body relative overflow-y-auto overflow-x-hidden">
      {/* Clean Premium Background */}
      <div aria-hidden="true" className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 bg-surface-container-lowest"></div>

      {/* Login/Register Container */}
      <main className="login-container m-auto w-full max-w-[420px] relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-extrabold text-primary tracking-tight mb-2">Schat</h1>
          <p className="text-on-surface-variant text-sm font-medium">Connect. Chat. Collaborate.</p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-surface rounded-[40px] p-8 sm:p-10 w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10 relative overflow-hidden">

          <div className="flex flex-col gap-6 relative z-10">
            <div className="text-center animate-item">
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">
                {isRegister ? 'Create Account' : 'Sign In'}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Display Name Field */}
              {isRegister && (
                <div className="flex flex-col gap-1.5 animate-item">
                  <label className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="name">Full Name</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-outline-variant text-[20px] pointer-events-none">person</span>
                    <input
                      autoComplete="name"
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-full py-3 pl-12 pr-4 text-on-surface text-sm placeholder:text-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none shadow-sm"
                      id="name"
                      name="name"
                      placeholder="Your Name"
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="flex flex-col gap-1.5 animate-item">
                <label className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="email">Email</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-outline-variant text-[20px] pointer-events-none">mail</span>
                  <input
                    autoComplete="email"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-full py-3 pl-12 pr-4 text-on-surface text-sm placeholder:text-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none shadow-sm"
                    id="email"
                    name="email"
                    placeholder="name@gmail.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5 animate-item">
                <div className="flex justify-between items-end ml-1 mr-1">
                  <label className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="password">Password</label>
                  {!isRegister && (
                    <button type="button" onClick={() => setForgotPasswordModalOpen(true)} className="text-xs text-primary hover:text-primary-fixed hover:underline transition-colors font-bold">Forgot Password?</button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-outline-variant text-[20px] pointer-events-none">lock</span>
                  <input
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-full py-3 pl-12 pr-4 text-on-surface text-sm placeholder:text-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all outline-none shadow-sm"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="animate-item mt-3 w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-full py-3.5 px-6 flex justify-center items-center gap-2 transition-colors duration-200 cursor-pointer relative z-20 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                style={{ minHeight: '56px' }}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {errorMsg && (
              <div className="text-red-600 text-sm text-center font-bold bg-red-50 border border-red-200 p-3 rounded-xl animate-item shadow-sm">
                {errorMsg}
              </div>
            )}

            {/* Switch State CTA */}
            <div className="text-center animate-item mt-2">
              <p className="text-sm text-on-surface-variant font-semibold">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
                <a
                  href="#"
                  onClick={handleToggleState}
                  className="text-primary hover:text-primary-fixed hover:underline font-bold ml-1.5 transition-colors inline-block hover:scale-[1.02] cursor-pointer"
                >
                  {isRegister ? 'Sign In' : 'Create an account'}
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <GenericModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
        onConfirm={handleForgotPassword}
        title="Reset Password"
        message="Enter your email address to receive a password reset link."
        mode="prompt"
        defaultValue={email}
        confirmText="Send Link"
      />

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');
        
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }
      `}</style>
    </div>
  )
}

export default LoginPage
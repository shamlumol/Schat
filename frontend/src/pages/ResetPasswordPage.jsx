import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './LoginPage';

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      await axios.put(`/api/auth/reset-password/${token}`, { password }, config);
      setMessage('Password reset successful. You can now log in with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="pointer-events-none opacity-50 filter blur-[2px]">
        <LoginPage />
      </div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
        <div className="bg-surface rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] w-[90%] max-w-md min-w-[320px] border border-white/10 overflow-hidden flex flex-col transform transition-all animate-slide-up relative">
          
          {/* Decorative Gradient Blob */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[40px] pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[40px] pointer-events-none"></div>

          {/* Close Button */}
          <button onClick={() => navigate('/login')} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-surface-container-highest/50 hover:bg-surface-container-highest backdrop-blur-sm transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          
          <div className="p-8 pb-6 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <span className="material-symbols-outlined text-3xl relative z-10">lock_reset</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-on-surface mb-2 tracking-tight">Create New Password</h2>
            <p className="text-sm text-on-surface-variant max-w-[280px] mx-auto">Your new password must be different from previous used passwords.</p>
          </div>
          
          <div className="px-8 pb-8 z-10">
            {message && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-3 animate-fade-in">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <p className="flex-1 mt-[2px]">{message}</p>
              </div>
            )}
            
            {error && (
              <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-3 animate-fade-in">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <p className="flex-1 mt-[2px]">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider pl-1" htmlFor="password">New Password</label>
                <div className="relative flex items-center group">
                  <span className="material-symbols-outlined absolute left-4 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">password</span>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface placeholder-on-surface-variant/50"
                    placeholder="Must be at least 8 characters"
                    required
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider pl-1" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative flex items-center group">
                  <span className="material-symbols-outlined absolute left-4 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">password</span>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface placeholder-on-surface-variant/50"
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-[#8A2BE2] hover:opacity-90 shadow-lg shadow-primary/25 hover:shadow-primary/40 text-white py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center transition-all disabled:opacity-50 disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPasswordPage;

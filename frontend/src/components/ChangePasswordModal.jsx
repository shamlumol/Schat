import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('nova_userInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.put('/api/auth/change-password', { currentPassword, newPassword }, config);
      toast.success(data.message || 'Password updated successfully');
      
      // Clear fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close modal
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-surface rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] w-[90%] max-w-md min-w-[320px] border border-white/10 overflow-hidden flex flex-col transform transition-all animate-slide-up relative">
        
        {/* Decorative Gradient Blob */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[40px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[40px] pointer-events-none"></div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-surface-container-highest/50 hover:bg-surface-container-highest backdrop-blur-sm transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        
        <div className="p-8 pb-4 text-center relative z-10">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <span className="material-symbols-outlined text-3xl relative z-10">key</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-on-surface mb-2 tracking-tight">Change Password</h2>
          <p className="text-sm text-on-surface-variant max-w-[280px] mx-auto">Update your password to keep your account secure.</p>
        </div>
        
        <div className="px-8 pb-8 z-10">
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider pl-1" htmlFor="currentPassword">Current Password</label>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-4 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">password</span>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface placeholder-on-surface-variant/50"
                  placeholder="Enter current password"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider pl-1" htmlFor="newPassword">New Password</label>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-4 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">lock_reset</span>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface placeholder-on-surface-variant/50"
                  placeholder="Must be at least 8 characters"
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider pl-1" htmlFor="confirmNewPassword">Confirm New Password</label>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-4 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">lock_reset</span>
                <input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface placeholder-on-surface-variant/50"
                  placeholder="Repeat new password"
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
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

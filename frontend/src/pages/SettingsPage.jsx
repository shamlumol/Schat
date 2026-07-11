import React, { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChatState } from '../context/ChatProvider'
import axios from 'axios'
import GenericModal from '../components/GenericModal'
import ChangePasswordModal from '../components/ChangePasswordModal'

function SettingsPage() {
  const navigate = useNavigate()
  const { user, setUser, appTheme, setAppTheme } = ChatState() || {}
  const [activeTab, setActiveTab] = useState('profile')
  const [displayName, setDisplayName] = useState(user?.displayName || localStorage.getItem('nova_displayName') || '')
  const [username, setUsername] = useState(user?.username || localStorage.getItem('nova_username') || '')
  const [bio, setBio] = useState(user?.bio || localStorage.getItem('nova_bio') || '')
  const [email, setEmail] = useState(user?.email || localStorage.getItem('nova_email') || '')
  const [wallpaper, setWallpaper] = useState(user?.wallpaper || 'default')
  const [privacyLastSeen, setPrivacyLastSeen] = useState(user?.privacy?.lastSeen ?? true)
  const [privacyProfilePhoto, setPrivacyProfilePhoto] = useState(user?.privacy?.profilePhoto || 'Everyone')
  const [privacyReadReceipts, setPrivacyReadReceipts] = useState(user?.privacy?.readReceipts ?? true)
  
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewImage, setPreviewImage] = useState(user?.profilePicture || 'https://via.placeholder.com/150')
  const fileInputRef = useRef(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        },
      }
      
      // Axios auto-sets Content-Type to multipart/form-data with boundary when passing FormData
      if (!selectedFile) {
        config.headers['Content-Type'] = 'application/json'
      }

      let updateData
      if (selectedFile) {
        updateData = new FormData()
        updateData.append('displayName', displayName)
        updateData.append('username', username)
        updateData.append('bio', bio)
        updateData.append('email', email)
        updateData.append('theme', appTheme)
        updateData.append('wallpaper', wallpaper)
        updateData.append('privacy', JSON.stringify({
          lastSeen: privacyLastSeen,
          profilePhoto: privacyProfilePhoto,
          readReceipts: privacyReadReceipts
        }))
        updateData.append('profilePicture', selectedFile)
      } else {
        updateData = {
          displayName,
          username,
          bio,
          email,
          theme: appTheme,
          wallpaper,
          privacy: {
            lastSeen: privacyLastSeen,
            profilePhoto: privacyProfilePhoto,
            readReceipts: privacyReadReceipts
          }
        }
      }

      const { data } = await axios.put('/api/users/profile', updateData, config)
      
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
      localStorage.setItem('nova_userInfo', JSON.stringify(updatedUser))
      localStorage.setItem('nova_theme', data.theme)
      localStorage.setItem('nova_displayName', data.displayName)
      localStorage.setItem('nova_username', data.username)
      localStorage.setItem('nova_bio', data.bio)
      localStorage.setItem('nova_email', data.email)
      
      setToastMessage('Changes saved successfully!')
      setToastType('success')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } catch (error) {
      console.log('bug:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('nova_userInfo')
        setUser(null)
        navigate('/login')
        return
      }
      setToastMessage(error.response?.data?.message || 'Failed to save changes')
      setToastType('error')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteModal(false);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete('/api/users/profile', config);
      
      // Clean up and logout
      localStorage.removeItem('nova_userInfo');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.log('bug:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('nova_userInfo')
        setUser(null)
        navigate('/login')
        return
      }
      setToastMessage(error.response?.data?.message || 'Failed to delete account');
      setToastType('error')
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }

  const handleWallpaperChange = async (newWallpaper) => {
    setWallpaper(newWallpaper)
    if (!user) return
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } }
      const { data } = await axios.put('/api/users/profile', { wallpaper: newWallpaper }, config)
      
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
      localStorage.setItem('nova_userInfo', JSON.stringify(updatedUser))
    } catch (error) {
      console.log('err update wallpaper ->', error)
    }
  }

  const handleCustomWallpaperUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage('Image is too large (max 5MB)');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleWallpaperChange(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleTheme = (mode) => {
    setAppTheme(mode)
    localStorage.setItem('nova_theme', mode)
    
    // Save to backend if user is logged in
    if (user) {
      const config = { headers: { Authorization: `Bearer ${user.token}` } }
      axios.put('/api/users/profile', { theme: mode }, config).catch(console.error)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'security', label: 'Security' }
  ]

  // If a tab is passed in URL query param, use it
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && tabs.find(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen flex font-body relative">
      {/* Main Settings Panel */}
      <main className="flex-1 bg-surface min-h-screen">
        {/* Top Header (Persistent) */}
        <header className="bg-surface border-b border-outline-variant/10 fixed top-0 w-full z-50 flex items-center px-4 md:px-margin-desktop h-16 shadow-sm">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 font-semibold"
            title="Back to Chats"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back to Chats
          </button>
        </header>

        {/* Settings Canvas */}
        <div className="max-w-4xl mx-auto pt-24 md:pt-28 px-margin-mobile md:px-margin-desktop pb-12">
          <div className="mb-lg">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-on-surface mb-base">Profile &amp; Appearance</h2>
            <p className="text-sm md:text-base text-on-surface-variant">Manage your identity and customize your workspace.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Left Tabs (In-Page Navigation) */}
            <div className="lg:col-span-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-sm py-2 rounded-lg text-sm transition-colors flex items-center justify-between font-semibold ${
                    activeTab === tab.id
                      ? 'bg-surface-container-highest text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  )}
                </button>
              ))}
            </div>

            {/* Right Settings Form Canvas */}
            <div className="lg:col-span-9 space-y-xl">
              {activeTab === 'profile' && (
                <section className="glass-panel rounded-xl p-md">
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-on-surface mb-md pb-xs border-b border-outline-variant/20">
                    Public Profile
                  </h3>
                  <form onSubmit={handleSave}>
                    <div className="flex flex-col sm:flex-row gap-lg mb-lg">
                      <div className="flex flex-col items-center gap-sm">
                        <div 
                          className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary-container/30 bg-surface-container group cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <img
                            className="w-full h-full object-cover"
                            alt="avatar preview"
                            src={previewImage}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white">photo_camera</span>
                          </div>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary text-xs font-semibold hover:underline"
                        >
                          Change Avatar
                        </button>
                      </div>

                      <div className="flex-1 space-y-md">
                        <div>
                          <label className="block font-mono text-[12px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider">Display Name</label>
                          <input
                            className="w-full input-glass rounded-lg px-sm py-2 text-on-surface text-sm focus:border-primary outline-none"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[12px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider">Username</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-sm text-on-surface-variant">@</span>
                            <input
                              className="w-full input-glass rounded-lg pl-[32px] pr-sm py-2 text-on-surface text-sm focus:border-primary outline-none"
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-md mb-lg">
                      <div>
                        <label className="block font-mono text-[12px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider">Bio</label>
                        <textarea
                          className="w-full input-glass rounded-lg px-sm py-2 text-on-surface text-sm resize-none focus:border-primary outline-none"
                          rows="3"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[12px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider">Email Address</label>
                        <input
                          className="w-full input-glass rounded-lg px-sm py-2 text-on-surface text-sm focus:border-primary outline-none"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-sm pt-sm border-t border-outline-variant/20">
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="px-md py-2 rounded-lg text-sm btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-md py-2 rounded-lg text-sm btn-primary shadow-[0_4px_12px_rgba(0,102,255,0.2)] flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : 'Save Changes'}
                      </button>
                    </div>
                  </form>

                  <div className="mt-8 pt-6 border-t border-error/20">
                    <h4 className="text-sm font-bold text-error mb-2">Danger Zone</h4>
                    <p className="text-xs text-on-surface-variant mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-md py-2 rounded-lg text-sm bg-error/10 text-error hover:bg-error hover:text-white transition-colors border border-error/50"
                    >
                      Delete Account
                    </button>
                  </div>
                </section>
              )}

              {activeTab === 'appearance' && (
                <section className="glass-panel rounded-xl p-md">
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-on-surface mb-md pb-xs border-b border-outline-variant/20">
                    Appearance
                  </h3>
                  <div className="space-y-lg">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">Theme</h4>
                        <p className="text-xs text-on-surface-variant">Choose your preferred theme.</p>
                      </div>
                      <select 
                        value={appTheme}
                        onChange={(e) => handleToggleTheme(e.target.value)}
                        className="input-glass rounded-lg px-sm py-1.5 text-sm outline-none border border-outline-variant/20 focus:border-primary text-on-surface cursor-pointer"
                      >
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                        <option value="system">System Default</option>
                      </select>
                    </div>

                    {/* Custom Wallpapers */}
                    <div className="border-t border-outline-variant/10 pt-lg">
                      <h4 className="text-sm font-semibold text-on-surface mb-xs">Custom Wallpaper</h4>
                      <p className="text-xs text-on-surface-variant mb-md">Personalize your chat window background with smooth gradients and elegant colors.</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { id: 'default', name: 'Default Solid', class: 'bg-surface-dim' },
                          { id: 'gradient-sunset', name: 'Sunset Aura', class: 'bg-gradient-to-br from-rose-400/20 via-fuchsia-500/20 to-indigo-500/20 dark:from-rose-900/30 dark:via-fuchsia-900/30 dark:to-indigo-900/30' },
                          { id: 'gradient-ocean', name: 'Deep Ocean', class: 'bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-600/20 dark:from-cyan-900/30 dark:via-blue-900/30 dark:to-indigo-950/30' },
                          { id: 'gradient-aurora', name: 'Aurora Borealis', class: 'bg-gradient-to-br from-emerald-400/20 via-teal-500/20 to-sky-500/20 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-sky-900/30' },
                          { id: 'gradient-midnight', name: 'Midnight Violet', class: 'bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900/40 dark:from-indigo-950/50 dark:via-purple-950/50 dark:to-slate-950/50' },
                          { id: 'mesh-candy', name: 'Cotton Candy', class: 'bg-gradient-to-tr from-pink-300/20 via-purple-300/20 to-indigo-400/20 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-indigo-950/30' },
                          { id: 'mesh-ember', name: 'Ember Glow', class: 'bg-gradient-to-br from-orange-500/20 via-red-500/20 to-rose-600/20 dark:from-orange-900/30 dark:via-red-900/30 dark:to-rose-950/30' },
                          { id: 'mesh-obsidian', name: 'Obsidian Glass', class: 'bg-gradient-to-br from-zinc-800/80 via-neutral-900/90 to-black/90 dark:from-zinc-950/90 dark:via-black dark:to-black' },
                          { id: 'gradient-cyberpunk', name: 'Cyberpunk Neon', class: 'bg-gradient-to-br from-yellow-300/30 via-pink-500/30 to-purple-600/30 dark:from-yellow-600/20 dark:via-pink-700/20 dark:to-purple-900/20' },
                          { id: 'gradient-emerald', name: 'Emerald Forest', class: 'bg-gradient-to-br from-green-300/30 via-emerald-500/20 to-teal-700/20 dark:from-green-900/30 dark:via-emerald-950/30 dark:to-teal-950/30' },
                          { id: 'gradient-lavender', name: 'Lavender Mist', class: 'bg-gradient-to-tr from-indigo-300/30 via-purple-400/20 to-pink-300/20 dark:from-indigo-900/30 dark:via-purple-950/30 dark:to-pink-900/30' },
                          { id: 'mesh-crimson', name: 'Crimson Eclipse', class: 'bg-gradient-to-bl from-rose-500/30 via-red-700/20 to-stone-900/20 dark:from-rose-900/40 dark:via-red-950/40 dark:to-black/40' },
                          { id: 'style-glass', name: 'Glass Orbs', class: 'bg-style-glass' },
                          { id: 'style-nebula', name: 'Deep Nebula', class: 'bg-style-nebula' },
                          { id: 'style-isometric', name: 'Isometric Grid', class: 'bg-style-isometric' }
                        ].map((wp) => (
                          <button
                            key={wp.id}
                            onClick={() => handleWallpaperChange(wp.id)}
                            className={`relative h-24 rounded-xl border-2 overflow-hidden group transition-all ${
                              wallpaper === wp.id ? 'border-primary shadow-[0_0_15px_rgba(0,102,255,0.3)] scale-105' : 'border-outline-variant/20 hover:border-primary/50'
                            }`}
                          >
                            <div className={`absolute inset-0 ${wp.class} opacity-100`}></div>
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-black/40 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-center">
                              <span className="text-[10px] font-semibold text-white truncate">{wp.name}</span>
                            </div>
                            {wallpaper === wp.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
                              </div>
                            )}
                          </button>
                        ))}
                        
                        {/* Upload Custom Button */}
                        <label className={`relative h-24 rounded-xl border-2 overflow-hidden group transition-all flex flex-col items-center justify-center cursor-pointer ${
                          (wallpaper?.startsWith('http') || wallpaper?.startsWith('data:')) ? 'border-primary shadow-[0_0_15px_rgba(0,102,255,0.3)] scale-105' : 'border-outline-variant/20 hover:border-primary/50 border-dashed'
                        }`}>
                          <input type="file" accept="image/*" className="hidden" onChange={handleCustomWallpaperUpload} />
                          {(wallpaper?.startsWith('http') || wallpaper?.startsWith('data:')) ? (
                             <div className="absolute inset-0 bg-cover bg-center opacity-100" style={{ backgroundImage: `url(${wallpaper})` }}></div>
                          ) : (
                             <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-3xl">add_photo_alternate</span>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-black/40 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-center z-10">
                            <span className="text-[10px] font-semibold text-white truncate">Upload Custom</span>
                          </div>
                          {(wallpaper?.startsWith('http') || wallpaper?.startsWith('data:')) && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md z-10">
                              <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'privacy' && (
                <section className="glass-panel rounded-xl p-md">
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-on-surface mb-md pb-xs border-b border-outline-variant/20">
                    Privacy settings
                  </h3>
                  <form onSubmit={handleSave}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">Last Seen & Online</h4>
                        <p className="text-xs text-on-surface-variant">Allow others to see when you are online</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={privacyLastSeen} onChange={(e) => setPrivacyLastSeen(e.target.checked)} />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">Profile Photo</h4>
                        <p className="text-xs text-on-surface-variant">Who can see your profile photo</p>
                      </div>
                      <select 
                        value={privacyProfilePhoto}
                        onChange={(e) => setPrivacyProfilePhoto(e.target.value)}
                        className="input-glass rounded-lg px-3 py-1.5 text-sm outline-none border border-outline-variant/20 focus:border-primary text-on-surface cursor-pointer bg-surface"
                      >
                        <option value="Everyone">Everyone</option>
                        <option value="My Contacts">My Contacts</option>
                        <option value="Nobody">Nobody</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">Read Receipts</h4>
                        <p className="text-xs text-on-surface-variant">If turned off, you won't send or receive read receipts.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={privacyReadReceipts} onChange={(e) => setPrivacyReadReceipts(e.target.checked)} />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-sm pt-sm mt-6 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="px-md py-2 rounded-lg text-sm btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={`px-md py-2 rounded-lg text-sm btn-primary shadow-[0_4px_12px_rgba(0,102,255,0.2)] flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </button>
                  </div>
                  </form>
                </section>
              )}

              {activeTab === 'security' && (
                <section className="glass-panel rounded-xl p-md">
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-on-surface mb-md pb-xs border-b border-outline-variant/20">
                    Security settings
                  </h3>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <h4 className="text-sm font-semibold text-on-surface">Change Password</h4>
                      <p className="text-xs text-on-surface-variant mb-2">Regularly updating your password helps keep your account secure.</p>
                      <button onClick={() => setShowChangePasswordModal(true)} className="self-start px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                        Change Password
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-outline-variant/10 pt-6">
                      <h4 className="text-sm font-semibold text-on-surface">Two-Step Verification</h4>
                      <p className="text-xs text-on-surface-variant mb-2">For extra security, require a PIN when registering your phone number with Schat again.</p>
                      <button className="self-start px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                        Enable Two-Step Verification
                      </button>
                    </div>

                    <div className="border-t border-outline-variant/10 pt-6 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">Security Notifications</h4>
                        <p className="text-xs text-on-surface-variant max-w-[80%]">Show a notification when your security code changes for a contact's phone.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Save Success Toast */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-xs px-4 py-3 rounded-lg shadow-lg border animate-fade-in-up ${toastType === 'error' ? 'bg-error-container text-on-error-container border-error/20' : 'bg-primary-container text-white border-primary/20'}`}>
          <span className="material-symbols-outlined">{toastType === 'error' ? 'error' : 'check_circle'}</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <GenericModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message="Are you absolutely sure you want to delete your account? This action is irreversible and will delete all your chats and messages."
        mode="confirm"
        type="danger"
        confirmText="Delete"
      />

      <ChangePasswordModal 
        isOpen={showChangePasswordModal} 
        onClose={() => setShowChangePasswordModal(false)} 
      />
    </div>
  )
}

export default SettingsPage

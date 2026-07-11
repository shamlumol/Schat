import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'

function LandingPage() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const bentoRef = useRef(null)

  useEffect(() => {
    // GSAP animations for Hero Section
    const ctx = gsap.context(() => {
      gsap.from('.hero-badge', {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
      gsap.from('.hero-title', {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.1,
        ease: 'power4.out',
      })
      gsap.from('.hero-desc', {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: 'power3.out',
      })
      gsap.from('.hero-ctas', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: 'power3.out',
      })
      gsap.from('.hero-preview', {
        y: 60,
        opacity: 0,
        scale: 0.98,
        duration: 1.2,
        delay: 0.4,
        ease: 'power2.out',
      })
    }, heroRef)

    // Scroll-based or simple entrance animations for bento grid
    const bentoCtx = gsap.context(() => {
      gsap.from('.bento-title', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
      gsap.from('.bento-card', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        delay: 0.2,
        ease: 'power2.out',
      })
    }, bentoRef)

    return () => {
      ctx.revert()
      bentoCtx.revert()
    }
  }, [])

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex items-center gap-xs cursor-pointer" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined text-primary text-[28px] fill">chat</span>
          <span className="font-display text-[20px] font-bold text-primary tracking-tight">Schat</span>
        </div>
        <div className="flex items-center gap-md hidden md:flex">
          <button className="btn-primary text-sm px-4 py-2 rounded-full font-medium" onClick={() => navigate('/login')}>Get Started</button>
        </div>
        <div className="flex md:hidden">
          <button className="btn-primary text-sm px-4 py-1.5 rounded-full font-medium" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </header>

      <main className="flex-1 pt-16 flex flex-col items-center w-full max-w-7xl mx-auto">
        {/* Hero Section */}
        <section ref={heroRef} className="relative w-full min-h-[920px] flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop py-xl overflow-hidden">
          <div className="absolute inset-0 bg-surface-container-lowest -z-10"></div>
          
          <div className="max-w-3xl z-10 flex flex-col items-center gap-md">
            <div className="hero-badge inline-flex items-center gap-xs px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/20 font-mono text-[12px] font-semibold text-primary mb-md">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              Now Available in Beta
            </div>
            
            <h1 className="hero-title font-display text-5xl md:text-6xl font-bold text-on-surface tracking-tight leading-tight">
              Messaging, refined.
            </h1>
            
            <p className="hero-desc text-lg md:text-xl text-on-surface-variant max-w-2xl leading-relaxed">
              A world-class SaaS platform for elegant communication. No phone numbers, no noise. Just pure, secure messaging designed for professionals.
            </p>
            
            <div className="hero-ctas flex flex-col sm:flex-row items-center gap-sm mt-lg w-full sm:w-auto">
              <button 
                className="btn-primary text-base px-8 py-3.5 rounded-full w-full sm:w-auto font-medium transition-transform hover:-translate-y-0.5 shadow-sm"
                onClick={() => navigate('/login')}
              >
                Start for free
              </button>
              <button className="bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-base px-8 py-3.5 rounded-full w-full sm:w-auto flex items-center justify-center gap-2 font-medium">
                <span className="material-symbols-outlined text-[20px]">play_circle</span>
                Watch Demo
              </button>
            </div>
          </div>
          
          {/* Conceptual Dashboard Preview */}
          <div className="hero-preview mt-xl w-full max-w-5xl rounded-[32px] border border-outline-variant/10 overflow-hidden shadow-2xl relative bg-surface">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none"></div>
            {/* Browser Chrome Mockup */}
            <div className="h-10 bg-surface flex items-center px-6 gap-2 border-b border-outline-variant/10">
              <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
              <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
              <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
            </div>
            <div className="relative w-full aspect-video bg-surface cursor-pointer" onClick={() => navigate('/login')}>
              <img 
                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"  
                alt="Schat software dashboard preview" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4T7VC6Mtcr3Hxku3zcEZJ0Bwztb17q4Kbtr6ywSTkUN5CrmPsqAUvkyxp6eCEIVZqAWUrb34SHMcadWaCGC0oZOJ7OZNkJ7JajYaf5bhustxzazOmMJ7ZlFWNSZGAv6Vt9nF6j9a8tJ9YDtq6i0DNXwFDQGehWqdv0zZoCDLPLldcIF2Bgq9NJWBl2NDUS_FkiADebaYnjjkco_SrK1mW69rDp7htxIUzfgZtovQjaPPgEy1INk7fqVLym9OMkN7pcQSM990H1yCM"
              />
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" ref={bentoRef} className="w-full px-margin-mobile md:px-margin-desktop py-xl border-t border-outline-variant/10">
          <div className="bento-title text-center mb-xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-on-surface mb-xs">Engineered for focus.</h2>
            <p className="text-lg text-on-surface-variant">Everything you need to communicate clearly, without the clutter.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md auto-rows-[minmax(250px,auto)]">
            {/* Feature 1: Markdown */}
            <div className="bento-card glass-panel rounded-xl p-md flex flex-col justify-between md:col-span-2 group hover:border-primary/30 transition-all duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-sm border border-primary/20 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-primary">code</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-xs">Rich Markdown Support</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Write code snippets, create lists, and format text precisely with full Markdown rendering in real-time.
                </p>
              </div>
              <div className="mt-lg p-sm rounded-lg bg-surface-container-lowest border border-outline-variant/10 font-mono text-[13px] text-secondary">
                <span className="text-primary-container font-bold">**Bold**</span> text and <code className="bg-white/5 px-1.5 py-0.5 rounded text-primary">inline code</code>
              </div>
            </div>

            {/* Feature 2: File Sharing */}
            <div className="bento-card glass-panel rounded-xl p-md flex flex-col justify-between group hover:border-primary/30 transition-all duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-sm border border-primary/20 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-primary">cloud_upload</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-xs">Seamless File Sharing</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Drag, drop, and share high-resolution assets instantly.
                </p>
              </div>
              <div className="mt-lg h-24 rounded-lg bg-surface-container-lowest border border-outline-variant/10 flex items-center justify-center border-dashed border-outline-variant/30 group-hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-outline-variant text-4xl group-hover:text-primary transition-colors">upload_file</span>
              </div>
            </div>

            {/* Feature 3: Link Previews */}
            <div className="bento-card glass-panel rounded-xl p-md flex flex-col justify-between group hover:border-primary/30 transition-all duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-sm border border-primary/20 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-primary">link</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-xs">Intelligent Previews</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Beautiful, contextual previews for external links that render metadata instantly.
                </p>
              </div>
              <div className="mt-lg p-sm rounded-lg bg-surface-container-lowest border border-outline-variant/10 flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">link</span>
                <span className="text-[12px] truncate text-on-surface-variant font-mono">https://github.com/schat</span>
              </div>
            </div>

            {/* Feature 4: Global Search */}
            <div className="bento-card glass-panel rounded-xl p-md flex flex-col justify-between md:col-span-2 group hover:border-primary/30 transition-all duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-sm border border-primary/20 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-primary">search</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-xs">Lightning Fast Global Search</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Find any message, file, or contact across your entire workspace in milliseconds.
                </p>
              </div>
              <div className="mt-lg p-2 rounded-full bg-surface-container-lowest border border-outline-variant/20 flex items-center px-4">
                <span className="material-symbols-outlined text-outline-variant mr-2">search</span>
                <span className="text-sm text-outline-variant/60 font-mono">Search "Project Alpha"...</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-xl px-margin-desktop flex flex-col md:flex-row justify-between items-center bg-surface-container-lowest border-t border-outline-variant/10 mt-xl gap-lg">
        <div className="font-mono text-xs text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">chat</span>
          © 2026 Schat. Functional Elegance.
        </div>
        <div className="flex flex-wrap justify-center gap-md font-mono text-[12px] uppercase tracking-wider font-semibold">
          <a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Product</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Company</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Resources</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Privacy</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Terms</a>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

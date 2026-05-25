import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email.trim(), password)
    setLoading(false)
    if (err) { setError('Invalid email or password'); return }
    const stored = localStorage.getItem('kalimex_user')
    if (stored) {
      const user = JSON.parse(stored)
      if (user.role === 'super_admin') navigate('/super-admin')
      else if (user.role === 'parent') navigate('/parent')
      else navigate('/dashboard')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) { setError('Full name is required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    if (signUpErr) { setLoading(false); setError(signUpErr.message); return }
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: email.trim(),
        full_name: fullName.trim(),
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString(),
      })
    }
    setLoading(false)
    setSuccess('Account created! Check your email to confirm, then sign in.')
    setMode('login')
    setPassword('')
  }

  const features = [
    'STK Push payment links for parents',
    'Automatic reconciliation & receipts',
    'Sibling discounts & instalment plans',
    'Full audit trail & board reports',
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--surface)', fontFamily: 'var(--font)' }}>

      {/* Left branding */}
      <div style={{ flex: '0 0 480px', background: 'var(--ink)', display: 'flex', flexDirection: 'column', padding: '60px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: -100, right: -100 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', bottom: 60, left: -60 }} />
        <div style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: 'var(--green-mid)', top: 200, right: 80 }} />
        <div style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)', bottom: 200, left: 100 }} />
        <div style={{ marginBottom: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="white" opacity="0.9"/><path d="M12 2v20M2 7l10 5 10-5" stroke="rgba(0,0,0,0.2)" strokeWidth="1"/></svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Kalimex</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.03em' }}>
            School Finance,<br/><span style={{ color: 'var(--green-mid)' }}>Simplified.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 320 }}>
            M-Pesa automation, real-time ledgers, and complete financial oversight for Kenya's private primary schools.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--green-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="animate-in">

          {/* Toggle */}
          <div style={{ display: 'flex', background: 'var(--line)', borderRadius: 12, padding: 4, marginBottom: 32 }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
                background: mode === m ? 'var(--white)' : 'transparent',
                color: mode === m ? 'var(--ink)' : 'var(--muted)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 6 }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>
              {mode === 'login' ? 'Sign in to your Kalimex account' : 'Set up your Kalimex super admin account'}
            </p>
          </div>

          {success && (
            <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>✓ {success}</p>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {mode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>Full Name <span style={{ color: 'var(--red)' }}>*</span></label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ibrahim Hamza" required autoComplete="name"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontSize: 14, color: 'var(--ink)', background: 'var(--white)', outline: 'none' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>Email address <span style={{ color: 'var(--red)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@school.co.ke" required autoComplete="email"
                  style={{ width: '100%', padding: '12px 14px 12px 44px', border: '1.5px solid var(--line)', borderRadius: 12, fontSize: 14, color: 'var(--ink)', background: 'var(--white)', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>Password <span style={{ color: 'var(--red)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'} required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ width: '100%', padding: '12px 44px 12px 44px', border: `1.5px solid ${error ? 'var(--red)' : 'var(--line)'}`, borderRadius: 12, fontSize: 14, color: 'var(--ink)', background: 'var(--white)', outline: 'none' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <p style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>⚠ {error}</p>}
            </div>

            <button type="submit" disabled={loading} style={{
              background: 'var(--ink)', color: 'white', padding: '13px 24px', borderRadius: 12,
              fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4, opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
            }}>
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : <><span>{mode === 'login' ? 'Sign in' : 'Create account'}</span><ArrowRight size={16} /></>}
            </button>

          </form>

          <p style={{ marginTop: 20, fontSize: 12, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
            {mode === 'login'
              ? 'Contact your Kalimex administrator if you need a password reset.'
              : 'Sign up creates a super admin account. Add schools and staff from the dashboard.'}
          </p>

        </div>
      </div>
    </div>
  )
}

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AppUser, UserRole } from '../types'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  changePassword: (current: string, newPass: string) => Promise<{ error: string | null }>
  isRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Demo users — used when Supabase is not configured (env vars are placeholders)
const DEMO_USERS: Record<string, AppUser & { password: string }> = {
  'superadmin@kalimex.co.ke': { id: 'sa-001', email: 'superadmin@kalimex.co.ke', password: 'kalimex2025', full_name: 'Ibrahim Hamza', role: 'super_admin', created_at: new Date().toISOString(), is_active: true },
  'admin@greenvalley.sc.ke':  { id: 'a-001',  email: 'admin@greenvalley.sc.ke',  password: 'demo1234',    full_name: 'Jane Wanjiku',   role: 'school_admin', school_id: 'sch-001', created_at: new Date().toISOString(), is_active: true },
  'bursar@greenvalley.sc.ke': { id: 'b-001',  email: 'bursar@greenvalley.sc.ke', password: 'demo1234',    full_name: 'Peter Mwangi',   role: 'bursar',       school_id: 'sch-001', created_at: new Date().toISOString(), is_active: true },
  'parent@test.com':           { id: 'p-001',  email: 'parent@test.com',          password: 'demo1234',    full_name: 'Grace Kamau',    role: 'parent',       school_id: 'sch-001', phone: '0712345678', created_at: new Date().toISOString(), is_active: true },
}

const isDemo = () => {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || ''
  return !url || url.includes('placeholder') || url.includes('your-project')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('kalimex_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setLoading(false)

    // Real Supabase session listener
    if (!isDemo()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single()
          if (profile) { setUser(profile as AppUser); localStorage.setItem('kalimex_user', JSON.stringify(profile)) }
        } else {
          setUser(null); localStorage.removeItem('kalimex_user')
        }
        setLoading(false)
      })
      return () => subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    // Demo mode
    if (isDemo()) {
      const demo = DEMO_USERS[email.toLowerCase()]
      if (demo && demo.password === password) {
        const { password: _, ...userData } = demo
        setUser(userData); localStorage.setItem('kalimex_user', JSON.stringify(userData))
        return { error: null }
      }
      return { error: 'Invalid email or password' }
    }

    // Real Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      if (profile) { setUser(profile as AppUser); localStorage.setItem('kalimex_user', JSON.stringify(profile)) }
    }
    return { error: null }
  }

  const signOut = async () => {
    setUser(null); localStorage.removeItem('kalimex_user')
    if (!isDemo()) await supabase.auth.signOut()
  }

  const changePassword = async (current: string, newPass: string): Promise<{ error: string | null }> => {
    if (isDemo()) {
      // Demo: just validate current password matches
      const demo = Object.values(DEMO_USERS).find(u => u.id === user?.id)
      if (!demo || demo.password !== current) return { error: 'Current password is incorrect' }
      return { error: null }
    }
    // Real: Supabase handles this — re-authenticate first
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user!.email, password: current })
    if (signInErr) return { error: 'Current password is incorrect' }
    const { error } = await supabase.auth.updateUser({ password: newPass })
    return { error: error?.message ?? null }
  }

  const isRole = (...roles: UserRole[]) => !!user && roles.includes(user.role)

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, changePassword, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

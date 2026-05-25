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

const DEMO_USERS: Record<string, AppUser & { password: string }> = {
  'superadmin@kalimex.co.ke': {
    id: 'sa-001',
    email: 'superadmin@kalimex.co.ke',
    password: 'kalimex2025',
    full_name: 'Ibrahim Hamza',
    role: 'super_admin',
    created_at: new Date().toISOString(),
    is_active: true,
  },
}

const isDemo = () => {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || ''
  return !url || url.includes('placeholder') || url.includes('your-project')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId: string): Promise<AppUser | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Profile fetch error:', error)
      return null
    }

    return data as AppUser | null
  }

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('kalimex_user')
      if (stored) {
        try {
          setUser(JSON.parse(stored))
        } catch {}
      }

      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData?.session?.user) {
        const profile = await loadProfile(sessionData.session.user.id)
        if (profile) {
          setUser(profile)
          localStorage.setItem('kalimex_user', JSON.stringify(profile))
        }
      }

      setLoading(false)
    }

    init()

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await loadProfile(session.user.id)

          if (profile) {
            setUser(profile)
            localStorage.setItem('kalimex_user', JSON.stringify(profile))
          } else {
            console.warn('No profile found for user:', session.user.id)
            setUser(null)
            localStorage.removeItem('kalimex_user')
          }
        } else {
          setUser(null)
          localStorage.removeItem('kalimex_user')
        }

        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    if (isDemo()) {
      const demo = DEMO_USERS[email.toLowerCase()]
      if (demo && demo.password === password) {
        const { password: _, ...userData } = demo
        setUser(userData)
        localStorage.setItem('kalimex_user', JSON.stringify(userData))
        return { error: null }
      }
      return { error: 'Invalid email or password' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return { error: error.message }

    if (data.user) {
      const profile = await loadProfile(data.user.id)

      if (!profile) {
        return { error: 'User profile not found in database' }
      }

      setUser(profile)
      localStorage.setItem('kalimex_user', JSON.stringify(profile))
    }

    return { error: null }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('kalimex_user')
    if (!isDemo()) await supabase.auth.signOut()
  }

  const changePassword = async (
    current: string,
    newPass: string
  ): Promise<{ error: string | null }> => {
    if (isDemo()) {
      return { error: null }
    }

    const { error: signInErr } =
      await supabase.auth.signInWithPassword({
        email: user!.email,
        password: current,
      })

    if (signInErr) return { error: 'Current password is incorrect' }

    const { error } = await supabase.auth.updateUser({
      password: newPass,
    })

    return { error: error?.message ?? null }
  }

  const isRole = (...roles: UserRole[]) =>
    !!user && roles.includes(user.role)

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, changePassword, isRole }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
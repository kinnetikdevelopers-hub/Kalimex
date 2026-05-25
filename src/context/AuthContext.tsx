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

  // ----------------------------
  // Load profile safely
  // ----------------------------
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

  // ----------------------------
  // Init auth session
  // ----------------------------
  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData?.session?.user) {
        const profile = await loadProfile(sessionData.session.user.id)

        if (profile) {
          setUser(profile)
        } else {
          console.warn('No profile found for session user')
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
          } else {
            console.warn('Missing profile for user:', session.user.id)

            // fallback user (prevents login failure)
            setUser({
              id: session.user.id,
              email: session.user.email ?? '',
              full_name: 'User',
              role: 'super_admin',
              created_at: new Date().toISOString(),
              is_active: true,
            })
          }
        } else {
          setUser(null)
        }

        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [])

  // ----------------------------
  // SIGN IN (FIXED)
  // ----------------------------
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    console.log('LOGIN ATTEMPT:', email)

    // Demo mode (only if truly no Supabase config)
    if (isDemo()) {
      console.warn('DEMO MODE ACTIVE')

      const demo = DEMO_USERS[email.toLowerCase()]
      if (demo && demo.password === password) {
        const { password: _, ...userData } = demo
        setUser(userData)
        return { error: null }
      }

      return { error: 'Invalid email or password' }
    }

    // Real Supabase login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      console.error('AUTH ERROR:', error)
      return { error: error.message }
    }

    if (!data.user) {
      return { error: 'Login failed: no user returned' }
    }

    // Load profile (non-blocking)
    const profile = await loadProfile(data.user.id)

    if (profile) {
      setUser(profile)
    } else {
      console.warn('Profile missing, using fallback user')

      setUser({
        id: data.user.id,
        email: data.user.email ?? email,
        full_name: 'User',
        role: 'super_admin',
        created_at: new Date().toISOString(),
        is_active: true,
      })
    }

    return { error: null }
  }

  // ----------------------------
  // SIGN OUT
  // ----------------------------
  const signOut = async () => {
    setUser(null)
    await supabase.auth.signOut()
  }

  // ----------------------------
  // CHANGE PASSWORD
  // ----------------------------
  const changePassword = async (
    current: string,
    newPass: string
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' }

    const { error: signInErr } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      })

    if (signInErr) {
      return { error: 'Current password is incorrect' }
    }

    const { error } = await supabase.auth.updateUser({
      password: newPass,
    })

    return { error: error?.message ?? null }
  }

  // ----------------------------
  // ROLE CHECK
  // ----------------------------
  const isRole = (...roles: UserRole[]) =>
    !!user && roles.includes(user.role)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        changePassword,
        isRole,
      }}
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
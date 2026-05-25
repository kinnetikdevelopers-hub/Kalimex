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

const isDemo = () => {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || ''
  return !url || url.includes('placeholder') || url.includes('your-project')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const loadProfile = async (userId: string): Promise<AppUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Profile error:', error)
        return null
      }

      return data as AppUser | null
    } catch (err) {
      console.error('Profile crash:', err)
      return null
    }
  }

  // -------------------------
  // INIT SESSION (ONCE ONLY)
  // -------------------------
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()

      const sessionUser = data?.session?.user

      if (sessionUser) {
        const profile = await loadProfile(sessionUser.id)

        setUser(
          profile ?? {
            id: sessionUser.id,
            email: sessionUser.email ?? '',
            full_name: 'User',
            role: 'super_admin',
            created_at: new Date().toISOString(),
            is_active: true,
          }
        )
      }

      setLoading(false)
      setInitialized(true)
    }

    init()

    // -------------------------
    // AUTH LISTENER (FIXED)
    // -------------------------
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (event, session) => {
        // IGNORE intermediate noise before init completes
        if (!initialized) return

        if (session?.user) {
          const profile = await loadProfile(session.user.id)

          setUser(
            profile ?? {
              id: session.user.id,
              email: session.user.email ?? '',
              full_name: 'User',
              role: 'super_admin',
              created_at: new Date().toISOString(),
              is_active: true,
            }
          )
        } else {
          setUser(null)
        }

        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [initialized])

  // -------------------------
  // SIGN IN
  // -------------------------
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) return { error: error.message }
      if (!data.user) return { error: 'Login failed' }

      const profile = await loadProfile(data.user.id)

      setUser(
        profile ?? {
          id: data.user.id,
          email: data.user.email ?? email,
          full_name: 'User',
          role: 'super_admin',
          created_at: new Date().toISOString(),
          is_active: true,
        }
      )

      return { error: null }
    } catch (err) {
      return { error: 'Unexpected login error' }
    }
  }

  // -------------------------
  // SIGN OUT
  // -------------------------
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // -------------------------
  // PASSWORD
  // -------------------------
  const changePassword = async (current: string, newPass: string) => {
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
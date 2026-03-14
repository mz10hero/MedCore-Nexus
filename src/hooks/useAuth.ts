// src/hooks/useAuth.ts
// ─────────────────────────────────────────────────────────────
// Authentication hook — wraps Supabase Auth with staff profile
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Staff, UserRole } from '../lib/database.types'

interface AuthState {
  user:        any | null        // Supabase Auth user
  staff:       Staff | null      // Our staff profile
  loading:     boolean
  error:       string | null
}

// ── Hook ──────────────────────────────────────────────────────
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user:    null,
    staff:   null,
    loading: true,
    error:   null,
  })

  // Fetch staff profile once we have an auth user
  const loadStaff = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      setState(s => ({ ...s, staff: null, error: error.message, loading: false }))
    } else {
      setState(s => ({ ...s, staff: data, error: null, loading: false }))
    }
  }, [])

  // Subscribe to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setState(s => ({ ...s, user: session.user, loading: true }))
          await loadStaff(session.user.id)
        } else {
          setState({ user: null, staff: null, loading: false, error: null })
        }
      }
    )

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(s => ({ ...s, user: session.user, loading: true }))
        loadStaff(session.user.id)
      } else {
        setState(s => ({ ...s, loading: false }))
      }
    })

    return () => subscription.unsubscribe()
  }, [loadStaff])

  // ── Auth actions ─────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setState(s => ({ ...s, loading: false, error: error.message }))
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setState({ user: null, staff: null, loading: false, error: null })
  }

  // ── Helpers ──────────────────────────────────────────────────
  const hasRole = (...roles: UserRole[]) =>
    state.staff ? roles.includes(state.staff.role) : false

  const isAuthenticated = !!state.user && !!state.staff

  return {
    ...state,
    isAuthenticated,
    signIn,
    signOut,
    hasRole,
  }
}

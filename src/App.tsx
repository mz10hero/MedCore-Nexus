// src/App.tsx
// ─────────────────────────────────────────────────────────────
// Root router — auth guard + page routing
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import type { Staff, UserRole } from './lib/database.types'

// ── Auth Context ──────────────────────────────────────────────
interface AuthCtx {
  staff:    Staff | null
  signOut:  () => Promise<void>
  hasRole:  (...roles: UserRole[]) => boolean
}

export const AuthContext = createContext<AuthCtx>({
  staff:   null,
  signOut: async () => {},
  hasRole: () => false,
})
export const useAuthContext = () => useContext(AuthContext)

// ── Protected Route ───────────────────────────────────────────
function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, loading, hasRole } = useAuth()

  if (loading) return <FullPageSpinner />

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (roles && !hasRole(...roles)) return <Navigate to="/403" replace />

  return <Outlet />
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={{
      staff:   auth.staff,
      signOut: auth.signOut,
      hasRole: auth.hasRole,
    }}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403"   element={<ForbiddenPage />} />

          {/* Protected — all roles */}
          <Route element={<ProtectedRoute />}>
            <Route path="/"           element={<DashboardPage />} />
            <Route path="/patients"   element={<PatientsPage />} />
            <Route path="/orders"     element={<OrdersPage />} />
            <Route path="/orders/:id" element={<ResultsPage />} />
          </Route>

          {/* Protected — supervisor + admin only */}
          <Route element={<ProtectedRoute roles={['supervisor', 'admin']} />}>
            <Route path="/reports"  element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

// ── Placeholder components (replace with actual implementations) ──
const FullPageSpinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                height:'100vh', background:'#0a0e1a', color:'#00d4ff',
                fontFamily:'monospace', fontSize:14 }}>
    Authenticating...
  </div>
)

// Import these from their respective page files:
declare const LoginPage:    React.FC
declare const DashboardPage:React.FC
declare const PatientsPage: React.FC
declare const OrdersPage:   React.FC
declare const ResultsPage:  React.FC
declare const ReportsPage:  React.FC
declare const SettingsPage: React.FC
declare const ForbiddenPage:React.FC

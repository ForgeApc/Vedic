import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Starfield from './components/Starfield'
import Home from './pages/Home'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import { supabase } from './lib/supabase'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Starfield />
        <div className="relative z-10">
          <Navigation user={user} />
          <main>
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardPage user={user} />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

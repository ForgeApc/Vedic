import { Link, useNavigate } from 'react-router-dom'
import { Star, LogOut, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Navigation({ user }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="relative z-20 border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Star size={16} className="text-indigo-950 fill-indigo-950" />
          </div>
          <span className="font-serif text-xl font-semibold text-amber-300 group-hover:text-amber-200 transition-colors">
            Jyotish AI
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-slate-300 hover:text-amber-300 transition-colors text-sm font-medium">
            New Chart
          </Link>
          {user && (
            <Link to="/dashboard" className="text-slate-300 hover:text-amber-300 transition-colors text-sm font-medium flex items-center gap-1.5">
              <LayoutDashboard size={15} />
              My Charts
            </Link>
          )}
          {user ? (
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm">
              <LogOut size={15} />
              Sign Out
            </button>
          ) : (
            <Link to="/auth" className="btn-primary text-sm px-4 py-2">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-slate-300" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/40 backdrop-blur-md px-4 py-4 flex flex-col gap-4">
          <Link to="/" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-amber-300 transition-colors">New Chart</Link>
          {user && <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-slate-300 hover:text-amber-300 transition-colors">My Charts</Link>}
          {user ? (
            <button onClick={handleLogout} className="text-left text-slate-400 hover:text-slate-200">Sign Out</button>
          ) : (
            <Link to="/auth" onClick={() => setMenuOpen(false)} className="text-amber-400 font-medium">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  )
}

import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSaved } from '../context/SavedContext.jsx';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { savedCount } = useSaved();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              I
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Ivy Homes</span>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/listings" className={navClass}>
                Listings
              </NavLink>
              <NavLink to="/saved" className={navClass}>
                <span>Saved</span>
                {savedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {savedCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/rentals" className={navClass}>
                Rentals
              </NavLink>
              <NavLink to="/projects" className={navClass}>
                Projects
              </NavLink>
              <NavLink to="/insights" className={navClass}>
                Insights
              </NavLink>
            </nav>
          )}

          {/* User actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 hidden sm:inline-block truncate max-w-[180px]">
                  {user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Sub-bar */}
      {isAuthenticated && (
        <div className="md:hidden flex items-center gap-1 border-t border-slate-100 px-4 py-2 overflow-x-auto bg-slate-50/70 scrollbar-none">
          <NavLink to="/listings" className={navClass}>
            Listings
          </NavLink>
          <NavLink to="/saved" className={navClass}>
            <span>Saved</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {savedCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/rentals" className={navClass}>
            Rentals
          </NavLink>
          <NavLink to="/projects" className={navClass}>
            Projects
          </NavLink>
          <NavLink to="/insights" className={navClass}>
            Insights
          </NavLink>
        </div>
      )}
    </header>
  );
}

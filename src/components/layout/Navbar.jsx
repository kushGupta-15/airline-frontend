import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, Compass, Ticket, Tag, User, LogOut, LogIn, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { isAuthenticated, userEmail, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Book Flights', path: '/', icon: Compass },
    { name: 'My Trips', path: '/bookings', icon: Ticket },
    { name: 'Special Offers', path: '/offers', icon: Tag },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Airline Brand */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all">
              <Plane className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white flex items-center gap-2">
                SkyFlow <span className="text-blue-400 font-semibold text-xs tracking-normal px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">Airlines</span>
              </span>
              <p className="text-[11px] text-slate-400">Fly Higher • Dream Bigger</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 text-blue-400" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Controls / Account */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/bookings"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 text-xs text-slate-200 transition-colors shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[130px] truncate font-medium">{userEmail || 'My Account'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/auth"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02]"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In / Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Icon className="w-4 h-4 text-blue-400" />
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-800">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600"
                >
                  <LogIn className="w-4 h-4" /> Sign In / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

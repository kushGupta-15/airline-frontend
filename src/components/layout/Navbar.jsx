import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, Compass, Ticket, Activity, User, LogOut, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { systemApi } from '../../api/client';

export const Navbar = () => {
  const { isAuthenticated, userEmail, logout } = useAuth();
  const location = useLocation();
  const [gatewayStatus, setGatewayStatus] = useState('checking'); // checking | online | offline

  useEffect(() => {
    let isMounted = true;
    const checkGateway = async () => {
      try {
        const res = await systemApi.getHealth();
        if (isMounted) {
          setGatewayStatus(res.status === 200 ? 'online' : 'offline');
        }
      } catch {
        if (isMounted) {
          setGatewayStatus('offline');
        }
      }
    };

    checkGateway();
    const interval = setInterval(checkGateway, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { name: 'Flights', path: '/', icon: Compass },
    { name: 'My Bookings', path: '/bookings', icon: Ticket },
    { name: 'System Telemetry', path: '/telemetry', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Plane className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                SkyFlow <span className="text-blue-400 font-medium text-xs bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Airlines</span>
              </span>
              <p className="text-[10px] text-slate-400 font-mono">Distributed Microservices</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {/* Gateway Health Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                {gatewayStatus === 'online' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : gatewayStatus === 'offline' ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                )}
              </span>
              <span className={gatewayStatus === 'online' ? 'text-emerald-400' : gatewayStatus === 'offline' ? 'text-rose-400' : 'text-amber-400'}>
                Gateway :3005 {gatewayStatus.toUpperCase()}
              </span>
            </div>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-300 max-w-[120px] truncate">{userEmail || 'Active Passenger'}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all hover:shadow-lg"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

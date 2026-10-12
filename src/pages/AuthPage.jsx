import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, ShieldCheck, AlertCircle, CheckCircle2, Sparkles, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const { signin, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  // Validation rules matching backend Zod schemas
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordLengthValid = password.length >= 6;
  const isPasswordMatch = isSignUp ? password === confirmPassword && confirmPassword.length > 0 : true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate inputs
    if (!isEmailValid) {
      setError('Please provide a valid email address format.');
      return;
    }
    if (!isPasswordLengthValid) {
      setError('Password must be at least 6 characters long (backend policy).');
      return;
    }
    if (isSignUp && !isPasswordMatch) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        // Sign up through Gateway
        await signup(email, password);
        setSuccessMsg('Account registered successfully! Signing in...');

        // Auto sign-in
        await signin(email, password);
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1000);
      } else {
        // Sign in through Gateway
        await signin(email, password);
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      setError(err.formattedMessage || err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('user1@example.com');
    setPassword('password123');
    setConfirmPassword('password123');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto pt-6 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-md">
          {isSignUp ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {isSignUp ? 'Create Passenger Account' : 'Sign In to SkyFlow'}
        </h1>
        <p className="text-xs text-slate-400">
          {isSignUp
            ? 'Access bookings, instant seat reservations, and automated reminders'
            : 'Access your flight reservations and manage trips securely'}
        </p>
      </div>

      {/* Main Card */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              !isSignUp ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              isSignUp ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Demo Credentials Quick Button */}
        <button
          type="button"
          onClick={handleFillDemo}
          className="w-full py-2 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-blue-400 border border-blue-500/20 text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Quick Demo: user1@example.com / password123</span>
        </button>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="passenger@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            {email.length > 0 && (
              <p className={`text-[11px] flex items-center gap-1 ${isEmailValid ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isEmailValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {isEmailValid ? 'Valid email format' : 'Enter a valid email address'}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            {password.length > 0 && (
              <p className={`text-[11px] flex items-center gap-1 ${isPasswordLengthValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isPasswordLengthValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {isPasswordLengthValid ? 'Minimum length satisfied (>= 6 chars)' : 'Must be at least 6 characters'}
              </p>
            )}
          </div>

          {/* Confirm Password (only on Sign Up) */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-[11px] flex items-center gap-1 ${isPasswordMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPasswordMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {isPasswordMatch ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isEmailValid || !isPasswordLengthValid || (isSignUp && !isPasswordMatch)}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? 'Communicating with Gateway...' : isSignUp ? 'Create Passenger Account' : 'Sign In'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Auth Service (:3001) • API Gateway (:3005)
          </p>
        </div>
      </div>
    </div>
  );
};

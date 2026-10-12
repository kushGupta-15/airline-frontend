import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LogIn, UserPlus, Mail, Lock, ShieldCheck, AlertCircle, 
  CheckCircle2, Sparkles, Check, X, Eye, EyeOff, Plane, Award, Compass, Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const { signin, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/search';

  // Validation rules
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordLengthValid = password.length >= 6;
  const isPasswordMatch = isSignUp ? password === confirmPassword && confirmPassword.length > 0 : true;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!isEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isPasswordLengthValid) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (isSignUp && !isPasswordMatch) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await signup(email, password);
        setSuccessMsg('Account registered successfully! Signing in...');
        await signin(email, password);
        setTimeout(() => {
          if (email === 'kushg1517@gmail.com') {
            navigate('/admin', { replace: true });
          } else {
            navigate(redirectPath, { replace: true });
          }
        }, 800);
      } else {
        await signin(email, password);
        if (email === 'kushg1517@gmail.com') {
          navigate('/admin', { replace: true });
        } else {
          navigate(redirectPath, { replace: true });
        }
      }
    } catch (err) {
      setError(err.formattedMessage || err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        
        {/* Left Column: Airline Club Perks & Luxury Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight">SkyFlow</span>
                <span className="text-xs uppercase tracking-widest text-blue-400 block font-semibold">SkyClub Membership</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Unlock Premium Travel Privileges
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Sign in to manage flights, enjoy automated flight reminders, and earn SkyMiles on every domestic and international journey.
              </p>
            </div>

            {/* Loyalty Perks List */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Earn 5x SkyMiles</h4>
                  <p className="text-[11px] text-slate-400">Redeem points for seat upgrades and future flight tickets.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Priority Check-in & Boarding</h4>
                  <p className="text-[11px] text-slate-400">Skip airport queues with instant digital boarding passes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Free Seat Selection</h4>
                  <p className="text-[11px] text-slate-400">Choose your preferred window or extra-legroom seats at ₹0 extra.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2 relative z-10">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>256-Bit SSL Encrypted • IATA Accredited Carrier</span>
          </div>

          {/* Decorative glow */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 space-y-6 flex flex-col justify-center">
          
          {/* Tab Switcher */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(null); }}
                className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                  !isSignUp
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Passenger Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(null); }}
                className={`pb-2 text-sm font-bold border-b-2 transition-all ${
                  isSignUp
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Join SkyClub (Register)
              </button>
            </div>

            <span className="text-xs text-slate-500 hidden sm:inline">
              {isSignUp ? 'New Member' : 'Existing Member'}
            </span>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Full Legal Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Captain Kush Gupta"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="passenger@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
              {email.length > 0 && (
                <p className={`text-[11px] flex items-center gap-1 ${isEmailValid ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isEmailValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {isEmailValid ? 'Valid email format' : 'Please provide a valid email format'}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {!isSignUp && (
                  <span className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <p className={`text-[11px] flex items-center gap-1 ${isPasswordLengthValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isPasswordLengthValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {isPasswordLengthValid ? 'Secure password length' : 'Password must be at least 6 characters'}
                </p>
              )}
            </div>

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading || !isEmailValid || !isPasswordLengthValid || (isSignUp && !isPasswordMatch)}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                'Verifying Credentials...'
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" /> Create Passenger Account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to SkyFlow
                </>
              )}
            </button>
          </form>

          {/* Guest browsing prompt */}
          <div className="text-center pt-2">
            <Link
              to="/search"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Want to check flight schedules first? <span className="text-blue-400 underline font-medium">Browse Flights as Guest</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, userEmail } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400 font-medium">Verifying Administrator Privileges...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-red-500/30 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The Airline Flight Operations portal requires authorized <strong className="text-white">ADMIN</strong> credentials. 
          Current account (<span className="text-blue-400 font-mono">{userEmail}</span>) does not have dispatch permissions.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Passenger Portal
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;

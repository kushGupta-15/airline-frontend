import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowRight, ShieldCheck, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BookingsPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-400" />
            Passenger Bookings
          </h1>
          <p className="text-xs text-slate-400">Manage your active flight itineraries and confirmed reservations</p>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <LogIn className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Sign In to View Bookings</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Bookings are securely linked to your authenticated user identity via Gateway token verification.
          </p>
          <div className="pt-2">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-colors"
            >
              Go to Sign In <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <p className="text-sm text-slate-300">You currently have no pending trips.</p>
          <p className="text-xs text-slate-500">Bookings created in Phase 4 will appear here with live notification ticket statuses.</p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              Browse Flights <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

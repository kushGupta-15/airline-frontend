import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plane, X, Armchair, Plus, Minus, CreditCard, ShieldCheck, 
  AlertCircle, Sparkles, Loader2, User, Mail, Phone, Lock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingApi } from '../../api/client';

export const BookingModal = ({ flight, airportsMap = {}, citiesMap = {}, onClose, onBookingSuccess }) => {
  const { isAuthenticated, userEmail } = useAuth();
  const navigate = useNavigate();

  const [noOfSeats, setNoOfSeats] = useState(1);
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState(userEmail || '');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [seatPreference, setSeatPreference] = useState('Window'); // Window | Aisle | Middle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!flight) return null;

  const maxSeats = Math.min(flight.totalSeats || 1, 9); // Max 9 per booking
  const basePrice = Number(flight.price) || 0;
  const taxesAndFees = Math.round(basePrice * 0.12 * noOfSeats); // 12% GST & Airport fees
  const totalPayable = (basePrice * noOfSeats) + taxesAndFees;

  const depAirport = airportsMap[flight.departureAirportId] || {};
  const arrAirport = airportsMap[flight.arrivalAirportId] || {};
  const depCity = citiesMap[depAirport.cityId]?.name || 'Origin';
  const arrCity = citiesMap[arrAirport.cityId]?.name || 'Destination';

  const handleSeatChange = (delta) => {
    const next = noOfSeats + delta;
    if (next >= 1 && next <= maxSeats) {
      setNoOfSeats(next);
      setError(null);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      setError('You must be signed in to reserve flights. Please log in first.');
      return;
    }

    if (!passengerName.trim()) {
      setError('Please provide the primary passenger name.');
      return;
    }

    if (noOfSeats > (flight.totalSeats || 0)) {
      setError(`Cannot reserve ${noOfSeats} seats. Only ${flight.totalSeats} seats remaining.`);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        flightId: flight.id,
        noOfSeats: Number(noOfSeats),
        userEmail: passengerEmail || userEmail || 'passenger@example.com',
      };

      const response = await bookingApi.createBooking(payload);

      if (response.data?.success) {
        onBookingSuccess(response.data.data, flight);
      } else {
        setError(response.data?.message || 'Failed to complete reservation');
      }
    } catch (err) {
      console.error('[BookingModal] Booking failed:', err);
      setError(err.formattedMessage || 'Unable to complete reservation via API Gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Distributed Saga Reservation
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Reserve Flight {flight.flightNumber}
          </h2>
          <p className="text-xs text-slate-400">
            {depCity} ({depAirport.name?.match(/\(([A-Z]{3})\)/)?.[1] || 'DEP'}) ➔ {arrCity} ({arrAirport.name?.match(/\(([A-Z]{3})\)/)?.[1] || 'ARR'})
          </p>
        </div>

        {/* Flight Snapshot Pill */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Departure:</span>
            <p className="font-bold text-white text-sm">
              {flight.departureTime ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>
          <div className="text-center">
            <span className="text-slate-400">Boarding Gate:</span>
            <p className="font-bold text-blue-400 text-sm">
              {flight.boardingGate || 'Gate Assigned at Check-in'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-slate-400">Seats Remaining:</span>
            <p className={`font-bold text-sm ${flight.totalSeats < 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {flight.totalSeats} seats
            </p>
          </div>
        </div>

        {/* Not Authenticated Warning */}
        {!isAuthenticated && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>You must be signed in to confirm your booking.</span>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition-colors"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmitBooking} className="space-y-5">
          {/* Seat Quantity & Preference Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Seat Quantity Controller */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Armchair className="w-3.5 h-3.5 text-blue-400" /> Number of Seats
              </label>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleSeatChange(-1)}
                  disabled={noOfSeats <= 1}
                  className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <span className="text-2xl font-black text-white font-mono">{noOfSeats}</span>
                  <span className="block text-[10px] text-slate-400">Passenger(s)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSeatChange(1)}
                  disabled={noOfSeats >= maxSeats}
                  className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Seat Preference Picker */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <label className="text-xs font-semibold text-slate-300">Seat Preference</label>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['Window', 'Aisle', 'Middle'].map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setSeatPreference(pref)}
                    className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all ${
                      seatPreference === pref
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Passenger Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Passenger & Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Confirmation Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={passengerEmail}
                  onChange={(e) => setPassengerEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Base Fare (₹{basePrice.toLocaleString('en-IN')} × {noOfSeats}):</span>
              <span className="font-mono text-slate-200">₹{(basePrice * noOfSeats).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Taxes, Security & Airport Charges (12%):</span>
              <span className="font-mono text-slate-200">₹{taxesAndFees.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm text-white">
              <span>Total Payable:</span>
              <span className="text-emerald-400 text-base font-black">₹{totalPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading || !isAuthenticated}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Distributed Saga Reservation...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Confirm & Pay ₹{totalPayable.toLocaleString('en-IN')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

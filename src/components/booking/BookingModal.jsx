import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Armchair, Plus, Minus, ShieldCheck, 
  AlertCircle, Sparkles, Loader2, User, Mail, Phone,
  CreditCard, CheckCircle2, Lock, UtensilsCrossed
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingApi } from '../../api/client';

export const BookingModal = ({ flight, airportsMap = {}, citiesMap = {}, onClose, onBookingSuccess }) => {
  const { isAuthenticated, userEmail, signin } = useAuth();
  const navigate = useNavigate();

  const [noOfSeats, setNoOfSeats] = useState(1);
  const [passengerTitle, setPassengerTitle] = useState('Mr');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerEmail, setPassengerEmail] = useState(userEmail || '');
  const [seatPreference, setSeatPreference] = useState('Window'); // Window | Aisle | Extra Legroom
  const [mealPreference, setMealPreference] = useState('Standard Snack');
  const [paymentMethod, setPaymentMethod] = useState('card'); // card | upi | netbanking
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!flight) return null;

  const maxSeats = Math.min(flight.totalSeats || 1, 9);
  const basePrice = Number(flight.price) || 0;
  const taxesAndFees = Math.round(basePrice * 0.12 * noOfSeats);
  const totalPayable = (basePrice * noOfSeats) + taxesAndFees;

  const depAirport = airportsMap[flight.departureAirportId] || {};
  const arrAirport = airportsMap[flight.arrivalAirportId] || {};
  const depCity = citiesMap[depAirport.cityId]?.name || 'Origin';
  const arrCity = citiesMap[arrAirport.cityId]?.name || 'Destination';

  const depCode = depAirport.name?.match(/\(([A-Z]{3})\)/)?.[1] || 'DEP';
  const arrCode = arrAirport.name?.match(/\(([A-Z]{3})\)/)?.[1] || 'ARR';

  const handleSeatChange = (delta) => {
    const next = noOfSeats + delta;
    if (next >= 1 && next <= maxSeats) {
      setNoOfSeats(next);
      setError(null);
    }
  };

  const handleInstantSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signin('pilot@skyflow.com', 'SkyFlow2026!');
      setPassengerEmail('pilot@skyflow.com');
      if (!passengerName) setPassengerName('Captain Passenger');
    } catch (err) {
      setError('Unable to authenticate demo passenger account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      setError('Please sign in to complete your flight booking.');
      return;
    }

    if (!passengerName.trim()) {
      setError('Please enter the primary passenger full name.');
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
        userEmail: passengerEmail || userEmail || 'passenger@skyflow.com',
      };

      const response = await bookingApi.createBooking(payload);

      if (response.data?.success) {
        onBookingSuccess(response.data.data, {
          ...flight,
          passengerName: `${passengerTitle} ${passengerName}`,
          seatPreference,
          mealPreference,
        });
      } else {
        setError(response.data?.message || 'Failed to complete reservation. Please retry.');
      }
    } catch (err) {
      console.error('[BookingModal] Booking failed:', err);
      setError(err.formattedMessage || 'Unable to reserve seats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        
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
            Instant Seat Reservation & E-Ticket
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Confirm Booking • {flight.flightNumber}
          </h2>
          <p className="text-xs text-slate-400">
            {depCity} ({depCode}) ➔ {arrCity} ({arrCode})
          </p>
        </div>

        {/* Flight Snapshot Pill */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block">Departure Schedule</span>
            <p className="font-bold text-white text-sm mt-0.5">
              {flight.departureTime ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>
          <div className="text-center">
            <span className="text-slate-400 block">Assigned Gate</span>
            <p className="font-bold text-blue-400 text-sm mt-0.5">
              {flight.boardingGate || 'Gate Assigned at Check-in'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Available Seats</span>
            <p className={`font-bold text-sm mt-0.5 ${flight.totalSeats < 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {flight.totalSeats} seats
            </p>
          </div>
        </div>

        {/* Sign In Required Notice with 1-Click Option */}
        {!isAuthenticated && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>You must be signed in to confirm passenger reservations.</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleInstantSignIn}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                1-Click Passenger Demo Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-xs text-amber-400 underline font-medium hover:text-amber-300"
              >
                Or Sign In to Your Account
              </button>
            </div>
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
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {['Window', 'Aisle', 'Extra Legroom'].map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setSeatPreference(pref)}
                    className={`py-2 px-1 text-[11px] font-semibold rounded-xl border transition-all text-center ${
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
              Primary Passenger Details
            </h4>
            
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3 space-y-1">
                <label className="text-xs text-slate-300">Title</label>
                <select
                  value={passengerTitle}
                  onChange={(e) => setPassengerTitle(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Mr">Mr</option>
                  <option value="Ms">Ms</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>

              <div className="col-span-9 space-y-1">
                <label className="text-xs text-slate-300 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kush Gupta"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> E-Ticket Email *
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

              <div className="space-y-1">
                <label className="text-xs text-slate-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Mobile (Flight Updates)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Payment Method
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'card', label: 'Credit / Debit Card' },
                { id: 'upi', label: 'UPI / QR Code' },
                { id: 'netbanking', label: 'Net Banking' },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                    paymentMethod === method.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Base Airfare (₹{basePrice.toLocaleString('en-IN')} × {noOfSeats}):</span>
              <span className="font-mono text-slate-200">₹{(basePrice * noOfSeats).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Aviation Security & Taxes (12%):</span>
              <span className="font-mono text-slate-200">₹{taxesAndFees.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm text-white">
              <span>Total Amount Payable:</span>
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
                Confirming Passenger Reservation...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Pay ₹{totalPayable.toLocaleString('en-IN')} & Issue Ticket
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default BookingModal;

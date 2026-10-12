import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Plane, Calendar, CreditCard, BellRing, 
  ExternalLink, ArrowRight, X, ShieldCheck, Hash, Mail
} from 'lucide-react';

export const BookingConfirmationModal = ({ booking, flight, onClose }) => {
  const navigate = useNavigate();

  if (!booking) return null;

  const depTime = flight?.departureTime ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const depDate = flight?.departureTime ? new Date(flight.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Reservation Confirmed!</h2>
          <p className="text-xs text-slate-400">
            Your flight has been securely processed by the distributed Booking Saga.
          </p>
        </div>

        {/* Ticket Summary Card */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Booking Reference</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Hash className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-lg font-bold text-white">BK-{booking.id.toString().padStart(5, '0')}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Status</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {booking.status || 'Booked'}
              </div>
            </div>
          </div>

          {/* Flight Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Flight:</span>
              <p className="font-bold text-white text-sm mt-0.5 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-blue-400" />
                {flight?.flightNumber || `Flight #${booking.flightId}`}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Departure:</span>
              <p className="font-bold text-white text-sm mt-0.5">
                {depTime} {depDate && `• ${depDate}`}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Reserved Seats:</span>
              <p className="font-bold text-white text-sm mt-0.5">
                {booking.noOfSeats} {booking.noOfSeats === 1 ? 'Passenger' : 'Passengers'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Total Amount Paid:</span>
              <p className="font-bold text-emerald-400 text-sm mt-0.5">
                ₹{Number(booking.totalCost).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* RabbitMQ Event Bus Notification Banner */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <BellRing className="w-4 h-4 text-indigo-400 animate-bounce" />
            <span>RabbitMQ Event Bus Dispatched</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Booking confirmation event was published to the <code className="text-indigo-300 font-mono">AIRLINE_BUS</code> exchange. Reminder Service has queued your automated notification.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              onClose();
              navigate('/bookings');
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            Go to My Bookings <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

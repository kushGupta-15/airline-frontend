import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Plane, Calendar, CreditCard, BellRing, 
  Printer, ArrowRight, X, ShieldCheck, Hash, Mail, QrCode,
  Users, User, Armchair, UtensilsCrossed
} from 'lucide-react';

export const BookingConfirmationModal = ({ booking, flight, airportsMap = {}, citiesMap = {}, onClose }) => {
  const navigate = useNavigate();
  const [activePassengerIdx, setActivePassengerIdx] = useState(0);

  if (!booking) return null;

  // Retrieve cached passenger details from localStorage if not passed directly in flight
  let passengerList = flight?.passengers || [];
  if ((!passengerList || passengerList.length === 0) && booking?.id) {
    try {
      const cached = localStorage.getItem(`skyflow_booking_${booking.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.passengers && Array.isArray(parsed.passengers)) {
          passengerList = parsed.passengers;
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached booking:', e);
    }
  }

  // Fallback if no passengers array exists
  if (!passengerList || passengerList.length === 0) {
    const totalSeats = booking.noOfSeats || 1;
    passengerList = Array.from({ length: totalSeats }, (_, i) => ({
      id: i + 1,
      title: i === 0 ? 'Mr' : 'Traveler',
      name: i === 0 ? (flight?.passengerName || 'Primary Passenger') : `Co-Traveler ${i + 1}`,
      category: 'Adult',
      seatPreference: i % 2 === 0 ? 'Window' : 'Aisle',
      mealPreference: 'Standard Snack'
    }));
  }

  const depTime = flight?.departureTime ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM';
  const depDate = flight?.departureTime ? new Date(flight.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '30 Oct 2026';
  
  const depAirport = airportsMap[flight?.departureAirportId] || {};
  const arrAirport = airportsMap[flight?.arrivalAirportId] || {};
  const depCity = citiesMap[depAirport.cityId]?.name || 'Delhi';
  const arrCity = citiesMap[arrAirport.cityId]?.name || 'Mumbai';
  const depCode = depAirport.name?.match(/\(([A-Z]{3})\)/)?.[1] || 'DEL';
  const arrCode = arrAirport.name?.match(/\(([A-Z]{3})\)/)?.[1] || 'BOM';

  const pnr = `SKF-${booking.id.toString().padStart(5, '0')}`;
  
  // Seat letters generator
  const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const getSeatAssignment = (idx, preference) => {
    const row = 12;
    const letter = seatLetters[idx % seatLetters.length];
    return `${row}${letter} (${preference || 'Assigned'})`;
  };

  const activePassenger = passengerList[activePassengerIdx] || passengerList[0];
  const activeSeat = getSeatAssignment(activePassengerIdx, activePassenger.seatPreference);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Booking Confirmed!</h2>
          <p className="text-xs text-slate-400">
            {passengerList.length > 1
              ? `All ${passengerList.length} passenger reservations are ticketed and confirmed.`
              : 'Your flight reservation is ticketed. Boarding pass is ready below.'}
          </p>
        </div>

        {/* Multi-Passenger Tab Switcher (if > 1 passenger) */}
        {passengerList.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Select Passenger Boarding Pass:
              </span>
              <span>Showing {activePassengerIdx + 1} of {passengerList.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {passengerList.map((p, idx) => (
                <button
                  key={p.id || idx}
                  type="button"
                  onClick={() => setActivePassengerIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    activePassengerIdx === idx
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-900/60 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span>{p.title} {p.name || `Traveler ${idx + 1}`}</span>
                  <span className="text-[10px] opacity-75 font-mono">
                    ({getSeatAssignment(idx, p.seatPreference).split(' ')[0]})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Digital Boarding Pass Card for the Active Passenger */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 shadow-2xl relative overflow-hidden space-y-5">
          
          {/* Top Airline Header */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                <Plane className="w-4 h-4 -rotate-45" />
              </div>
              <div>
                <span className="font-black text-white text-base tracking-tight">SkyFlow Airlines</span>
                <span className="text-[10px] uppercase text-blue-400 block tracking-widest font-semibold">
                  Official E-Ticket • Passenger {activePassengerIdx + 1} of {passengerList.length}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Booking PNR</span>
              <span className="font-mono text-base font-black text-blue-400 tracking-wider">{pnr}</span>
            </div>
          </div>

          {/* Passenger & Flight Route Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Passenger</span>
              <p className="font-bold text-white text-sm mt-0.5 truncate">
                {activePassenger.title} {activePassenger.name}
              </p>
              <span className="text-[10px] text-blue-400 font-medium block mt-0.5">
                {activePassenger.category || 'Adult'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Flight Number</span>
              <p className="font-bold text-white text-sm mt-0.5 font-mono">{flight?.flightNumber || 'SF-101'}</p>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {activePassenger.mealPreference || 'Standard Snack'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Assigned Seat</span>
              <p className="font-bold text-emerald-400 text-sm mt-0.5">{activeSeat}</p>
              <span className="text-[10px] text-emerald-400/80 block mt-0.5">Free Selection</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Gate / Terminal</span>
              <p className="font-bold text-blue-400 text-sm mt-0.5">{flight?.boardingGate || 'Gate 4B'} (T3)</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Boarding 45m prior</span>
            </div>
          </div>

          {/* Route Display */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="text-left">
              <span className="text-2xl font-black text-white font-mono">{depCode}</span>
              <p className="text-xs text-slate-300 font-semibold">{depCity}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{depTime}</p>
            </div>

            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] text-slate-400 mb-1">{depDate}</span>
              <div className="w-24 sm:w-32 flex items-center relative">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-blue-500 to-blue-400"></div>
                <Plane className="w-3.5 h-3.5 text-blue-400" />
                <div className="flex-1 h-[2px] bg-gradient-to-r from-blue-400 to-blue-500"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 font-semibold">Non-stop</span>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-white font-mono">{arrCode}</span>
              <p className="text-xs text-slate-300 font-semibold">{arrCity}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Scheduled</p>
            </div>
          </div>

          {/* Barcode & Total Paid Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-dashed border-slate-700">
            {/* Visual Barcode Graphic */}
            <div className="space-y-1">
              <div className="h-8 flex items-center gap-[2px] opacity-80">
                {[2, 4, 1, 3, 5, 2, 6, 2, 4, 1, 3, 2, 5, 1, 4, 2, 6, 3, 1, 4, 2, 5].map((w, i) => (
                  <div key={i} className="bg-slate-300 h-full" style={{ width: `${w * 1.5}px` }}></div>
                ))}
              </div>
              <span className="text-[10px] font-mono text-slate-400 block tracking-widest text-center">
                ELECTRONIC BOARDING PASS
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Total Amount Paid</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                ₹{Number(booking.totalCost).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Passenger Manifest Summary Table (if > 1 passenger) */}
        {passengerList.length > 1 && (
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Complete Passenger Manifest ({passengerList.length} Reserved Seats)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700/60 pb-2">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Traveler Name</th>
                    <th className="py-2 px-2">Category</th>
                    <th className="py-2 px-2">Assigned Seat</th>
                    <th className="py-2 px-2">Meal Selection</th>
                    <th className="py-2 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {passengerList.map((p, idx) => (
                    <tr 
                      key={p.id || idx}
                      onClick={() => setActivePassengerIdx(idx)}
                      className={`cursor-pointer transition-colors ${
                        activePassengerIdx === idx ? 'bg-blue-600/10 text-white font-medium' : 'text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-2 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-semibold">
                        {p.title} {p.name || `Traveler ${idx + 1}`}
                      </td>
                      <td className="py-2.5 px-2 text-slate-400">{p.category || 'Adult'}</td>
                      <td className="py-2.5 px-2 font-mono text-emerald-400">
                        {getSeatAssignment(idx, p.seatPreference)}
                      </td>
                      <td className="py-2.5 px-2 text-slate-400">{p.mealPreference || 'Standard'}</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Passenger Email Notification Banner */}
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/20 text-xs space-y-1">
          <div className="flex items-center gap-2 text-blue-300 font-bold">
            <Mail className="w-4 h-4 text-blue-400" />
            <span>Official E-Ticket Dispatched</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            All {passengerList.length} e-tickets and tax invoices have been dispatched. Automated gate change alerts and flight reminder notifications will be delivered before departure.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print All Boarding Passes
          </button>
          
          <button
            onClick={() => {
              onClose();
              navigate('/bookings');
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            View in My Trips <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookingConfirmationModal;

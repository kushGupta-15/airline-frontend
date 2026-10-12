import React from 'react';
import { Plane, Calendar, Clock, Armchair, ArrowRight, ShieldCheck } from 'lucide-react';

const AIRLINE_INFO = {
  AI: { name: 'Air India', color: 'from-red-600 to-orange-600', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  '6E': { name: 'IndiGo', color: 'from-blue-600 to-indigo-600', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  SG: { name: 'SpiceJet', color: 'from-amber-600 to-red-600', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  QP: { name: 'Akasa Air', color: 'from-orange-500 to-amber-500', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  UK: { name: 'Vistara', color: 'from-purple-700 to-fuchsia-700', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export const FlightCard = ({ flight, airportsMap = {}, citiesMap = {}, onSelect }) => {
  const prefix = flight.flightNumber ? flight.flightNumber.split('-')[0] : '';
  const airline = AIRLINE_INFO[prefix] || {
    name: 'SkyFlow Express',
    color: 'from-slate-600 to-slate-700',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const depAirport = airportsMap[flight.departureAirportId] || {};
  const arrAirport = airportsMap[flight.arrivalAirportId] || {};

  const depCity = citiesMap[depAirport.cityId]?.name || 'Origin';
  const arrCity = citiesMap[arrAirport.cityId]?.name || 'Destination';

  // Format departure & arrival dates/times
  const depDate = flight.departureTime ? new Date(flight.departureTime) : null;
  const arrDate = flight.arrivalTime ? new Date(flight.arrivalTime) : null;

  const formatTime = (date) => {
    if (!date || isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Duration in hours and minutes
  const calculateDuration = () => {
    if (!depDate || !arrDate || isNaN(depDate.getTime()) || isNaN(arrDate.getTime())) return 'Direct';
    const diffMs = arrDate.getTime() - depDate.getTime();
    if (diffMs <= 0) return 'Direct';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  };

  // Extract Airport Code if present in parenthesis like "(DEL)"
  const extractCode = (name) => {
    if (!name) return '---';
    const match = name.match(/\(([A-Z]{3})\)/);
    return match ? match[1] : name.substring(0, 3).toUpperCase();
  };

  const depCode = extractCode(depAirport.name);
  const arrCode = extractCode(arrAirport.name);

  // Seat status
  const seats = flight.totalSeats || 0;
  const isLowSeats = seats < 20;

  return (
    <div className="group relative rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 p-5 sm:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-0.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Airline & Flight Number Info */}
        <div className="flex items-center gap-4 lg:w-1/4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${airline.color} flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0`}>
            {prefix || 'SF'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base tracking-tight">{airline.name}</h3>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${airline.badge}`}>
                {flight.flightNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>Aircraft #{flight.airplaneId}</span>
              {flight.boardingGate && (
                <>
                  <span>•</span>
                  <span className="text-blue-400 font-medium">{flight.boardingGate}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Center: Flight Route & Schedule */}
        <div className="flex-1 flex items-center justify-between sm:justify-center sm:gap-8 border-y sm:border-y-0 border-slate-800 py-3 sm:py-0">
          {/* Departure */}
          <div className="text-left sm:text-right">
            <div className="text-2xl font-black text-white font-mono">{formatTime(depDate)}</div>
            <div className="text-sm font-semibold text-blue-400">{depCode}</div>
            <div className="text-xs text-slate-300 font-medium">{depCity}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">{formatDate(depDate)}</div>
          </div>

          {/* Flight Path Graphic */}
          <div className="flex flex-col items-center px-4 w-32 sm:w-44">
            <span className="text-[11px] text-slate-400 font-medium mb-1">{calculateDuration()}</span>
            <div className="w-full flex items-center relative">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="flex-1 h-[2px] bg-gradient-to-r from-blue-500 via-slate-600 to-blue-500 relative">
                <Plane className="w-4 h-4 text-blue-400 absolute left-1/2 -top-2 -translate-x-1/2 rotate-90" />
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Non-stop
            </span>
          </div>

          {/* Arrival */}
          <div className="text-right sm:text-left">
            <div className="text-2xl font-black text-white font-mono">{formatTime(arrDate)}</div>
            <div className="text-sm font-semibold text-blue-400">{arrCode}</div>
            <div className="text-xs text-slate-300 font-medium">{arrCity}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">{formatDate(arrDate)}</div>
          </div>
        </div>

        {/* Right: Seat Availability, Price & Booking Button */}
        <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-4 lg:w-1/4">
          <div className="text-left lg:text-right">
            <div className="text-xs text-slate-400">Total Price</div>
            <div className="text-2xl font-black text-white tracking-tight">
              ₹{Number(flight.price).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center lg:justify-end gap-1.5 mt-1">
              <Armchair className={`w-3.5 h-3.5 ${isLowSeats ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className={`text-[11px] font-medium ${isLowSeats ? 'text-amber-400' : 'text-slate-300'}`}>
                {isLowSeats ? `Only ${seats} seats left!` : `${seats} seats available`}
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelect && onSelect(flight)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all group-hover:scale-[1.02]"
          >
            Select Flight
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, Plane, Armchair, 
  Clock3, XCircle, ArrowRight, RefreshCw, 
  AlertTriangle, BellRing, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookingApi, flightApi } from '../api/client';

export const MyBookings = () => {
  const { isAuthenticated, userEmail } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [flightsMap, setFlightsMap] = useState({});
  const [airportsMap, setAirportsMap] = useState({});
  const [citiesMap, setCitiesMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | Booked | InProcess | Cancelled

  // Fetch all bookings and flight/airport metadata
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [bookingsRes, flightsRes, airportsRes, citiesRes] = await Promise.all([
        bookingApi.getUserBookings(),
        flightApi.getFlights(),
        flightApi.getAirports(),
        flightApi.getCities(),
      ]);

      if (bookingsRes.data?.success) {
        setBookings(bookingsRes.data.data || []);
      }

      if (flightsRes.data?.success) {
        const fMap = {};
        (flightsRes.data.data || []).forEach((f) => { fMap[f.id] = f; });
        setFlightsMap(fMap);
      }

      if (airportsRes.data?.success) {
        const aMap = {};
        (airportsRes.data.data || []).forEach((a) => { aMap[a.id] = a; });
        setAirportsMap(aMap);
      }

      if (citiesRes.data?.success) {
        const cMap = {};
        (citiesRes.data.data || []).forEach((c) => { cMap[c.id] = c; });
        setCitiesMap(cMap);
      }
    } catch (err) {
      console.error('[MyBookings] Failed to fetch user bookings:', err);
      setError(err.formattedMessage || 'Failed to retrieve bookings from Booking Service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter bookings by status
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.status?.toLowerCase() === activeTab.toLowerCase();
  });

  // Status Badge Component
  const renderStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'booked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Booked & Confirmed
          </span>
        );
      case 'inprocess':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs">
            <Clock3 className="w-3 h-3 animate-spin" />
            In Process
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs">
            <XCircle className="w-3 h-3" />
            Cancelled (Compensated)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            User Booking Dashboard
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Ticket className="w-8 h-8 text-blue-400" />
            My Flight Reservations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track confirmed itineraries, passenger quantities, and asynchronous event notifications.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        )}
      </div>

      {/* Unauthenticated View */}
      {!isAuthenticated && (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Sign In Required</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Your flight bookings are securely scoped to your authenticated user token using API Gateway user propagation headers.
          </p>
          <div className="pt-2">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              Sign In to View Reservations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Authenticated View */}
      {isAuthenticated && (
        <div className="space-y-6">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-2 rounded-2xl">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All Bookings', count: bookings.length },
                { id: 'Booked', label: 'Confirmed', count: bookings.filter((b) => b.status === 'Booked').length },
                { id: 'InProcess', label: 'In Process', count: bookings.filter((b) => b.status === 'InProcess').length },
                { id: 'Cancelled', label: 'Cancelled', count: bookings.filter((b) => b.status === 'Cancelled').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-300">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-500 hidden md:inline px-3 font-mono">
              Account: {userEmail}
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 flex items-center gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-4">
                  <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                  <div className="h-10 bg-slate-800/60 rounded w-full"></div>
                </div>
              ))}
            </div>
          )}

          {/* Bookings List */}
          {!loading && filteredBookings.length > 0 && (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const flight = flightsMap[booking.flightId];
                const depAirport = flight ? airportsMap[flight.departureAirportId] : null;
                const arrAirport = flight ? airportsMap[flight.arrivalAirportId] : null;
                const depCity = depAirport ? citiesMap[depAirport.cityId]?.name : 'Origin';
                const arrCity = arrAirport ? citiesMap[arrAirport.cityId]?.name : 'Destination';

                const depCode = depAirport?.name?.match(/\(([A-Z]{3})\)/)?.[1] || 'DEP';
                const arrCode = arrAirport?.name?.match(/\(([A-Z]{3})\)/)?.[1] || 'ARR';

                const bookingDate = booking.createdAt
                  ? new Date(booking.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={booking.id}
                    className="group rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/30 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 space-y-5"
                  >
                    {/* Top Row: Booking Reference & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-mono font-bold text-sm">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-base">
                              BK-{booking.id.toString().padStart(5, '0')}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              (User #{booking.userId})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Booked on {bookingDate}
                          </span>
                        </div>
                      </div>

                      <div>{renderStatusBadge(booking.status)}</div>
                    </div>

                    {/* Middle Row: Flight Schedule & Route */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      {/* Flight Badge & Airline */}
                      <div className="md:col-span-3 space-y-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flight</span>
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-blue-400" />
                          <span className="font-black text-white text-lg">
                            {flight?.flightNumber || `Flight #${booking.flightId}`}
                          </span>
                        </div>
                        {flight?.boardingGate && (
                          <span className="text-xs text-blue-400 font-medium block">
                            Gate: {flight.boardingGate}
                          </span>
                        )}
                      </div>

                      {/* Route Graphic */}
                      <div className="md:col-span-5 flex items-center justify-between gap-4 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
                        <div className="text-left">
                          <span className="text-lg font-black text-white font-mono">{depCode}</span>
                          <p className="text-xs text-slate-300 font-medium">{depCity}</p>
                          <p className="text-[10px] text-slate-500">
                            {flight?.departureTime ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </p>
                        </div>

                        <div className="flex-1 flex flex-col items-center px-2">
                          <span className="text-[10px] text-slate-400 mb-1">Direct</span>
                          <div className="w-full flex items-center relative">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-blue-500 via-slate-600 to-blue-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-white font-mono">{arrCode}</span>
                          <p className="text-xs text-slate-300 font-medium">{arrCity}</p>
                          <p className="text-[10px] text-slate-500">
                            {flight?.arrivalTime ? new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Seats */}
                      <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-6 text-left md:text-right">
                        <div>
                          <span className="text-xs text-slate-400 flex items-center md:justify-end gap-1">
                            <Armchair className="w-3.5 h-3.5 text-blue-400" /> Reserved Seats
                          </span>
                          <p className="text-base font-bold text-white mt-0.5">
                            {booking.noOfSeats} {booking.noOfSeats === 1 ? 'Seat' : 'Seats'}
                          </p>
                        </div>

                        <div>
                          <span className="text-xs text-slate-400">Total Charged</span>
                          <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                            ₹{Number(booking.totalCost).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: RabbitMQ Event & Reminder Status Pill */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="inline-flex items-center gap-2 text-slate-400">
                        <BellRing className="w-3.5 h-3.5 text-indigo-400" />
                        <span>
                          Notification Pipeline: <strong className="text-indigo-300">Queued via RabbitMQ (AIRLINE_BUS)</strong>
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                        <span>Database: MySQL Booking_DEV</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty Bookings State */}
          {!loading && filteredBookings.length === 0 && (
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Ticket className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {activeTab === 'ALL'
                  ? "You haven't made any flight bookings yet. Discover flights and reserve seats in just a few clicks."
                  : `No bookings found with status '${activeTab}'.`}
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all hover:scale-[1.02]"
                >
                  Explore Flight Catalog <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

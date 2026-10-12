import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, Plane, Armchair, 
  Clock3, XCircle, ArrowRight, RefreshCw, 
  AlertTriangle, CheckCircle2, Sparkles, Printer, Luggage,
  ShieldAlert, Loader2, X, AlertOctagon, Undo2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { bookingApi, flightApi } from '../api/client';
import { BookingConfirmationModal } from '../components/booking/BookingConfirmationModal';

export const MyBookings = () => {
  const { isAuthenticated, userEmail } = useAuth();
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [flightsMap, setFlightsMap] = useState({});
  const [airportsMap, setAirportsMap] = useState({});
  const [citiesMap, setCitiesMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | Booked | InProcess | Cancelled
  const [activeBoardingPass, setActiveBoardingPass] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of personal travel schedule');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelNotification, setCancelNotification] = useState(null);

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
      setError('Unable to retrieve your current trips. Please refresh or retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelConfirm = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    setError(null);

    try {
      const res = await bookingApi.cancelBooking(cancellingBooking.booking.id);
      if (res.data?.success) {
        const refundAmt = res.data.data?.refundAmount || Math.round(cancellingBooking.booking.totalCost * 0.9);
        const restored = res.data.data?.restoredSeats || cancellingBooking.booking.noOfSeats;
        
        setCancelNotification({
          type: 'success',
          message: `Booking SKF-${cancellingBooking.booking.id.toString().padStart(5, '0')} successfully cancelled. Net refund of ₹${refundAmt.toLocaleString('en-IN')} initiated, and ${restored} seat(s) restored to public flight inventory.`
        });
        toast.success(`Booking SKF-${cancellingBooking.booking.id.toString().padStart(5, '0')} cancelled! ₹${refundAmt.toLocaleString('en-IN')} refund initiated.`);
        setCancellingBooking(null);
        await fetchData(true);
      } else {
        setError(res.data?.message || 'Failed to cancel reservation. Please retry.');
      }
    } catch (err) {
      console.error('[MyBookings] Cancellation failed:', err);
      setError(err.response?.data?.message || err.message || 'Unable to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

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
            Confirmed & Ticketed
          </span>
        );
      case 'inprocess':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs">
            <Clock3 className="w-3 h-3 animate-spin" />
            Processing Reservation
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs">
            <XCircle className="w-3 h-3" />
            Cancelled & Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs">
            {status || 'Scheduled'}
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
            Passenger Trip Itinerary Portal
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Ticket className="w-8 h-8 text-blue-400" />
            My Trips & Reservations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access your confirmed itineraries, view digital boarding passes, and manage travel details.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Trips
          </button>
        )}
      </div>

      {/* Unauthenticated View */}
      {!isAuthenticated && (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Sign In to View Your Trips</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Please log in with your SkyFlow passenger account to review your active bookings and boarding passes.
          </p>
          <div className="pt-2">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              Sign In to SkyFlow <ArrowRight className="w-4 h-4" />
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
                { id: 'ALL', label: 'All Trips', count: bookings.length },
                { id: 'Booked', label: 'Confirmed', count: bookings.filter((b) => b.status === 'Booked').length },
                { id: 'InProcess', label: 'Processing', count: bookings.filter((b) => b.status === 'InProcess').length },
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

            <span className="text-xs text-slate-400 hidden md:inline px-3">
              Member: <strong className="text-white font-medium">{userEmail}</strong>
            </span>
          </div>

          {/* Cancellation Success Banner */}
          {cancelNotification && (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 flex items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{cancelNotification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelNotification(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
                  ? new Date(booking.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Recent';

                const pnr = `SKF-${booking.id.toString().padStart(5, '0')}`;

                let cachedManifest = null;
                try {
                  const raw = localStorage.getItem(`skyflow_booking_${booking.id}`);
                  if (raw) cachedManifest = JSON.parse(raw);
                } catch (e) {
                  // Ignore parse error
                }

                return (
                  <div
                    key={booking.id}
                    className="group rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/30 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 space-y-5"
                  >
                    {/* Top Row: PNR & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-mono font-bold text-sm">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-white text-base tracking-wider">
                              {pnr}
                            </span>
                            <span className="text-[11px] text-emerald-400 font-medium">
                              • E-Ticket Ready
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
                      
                      {/* Flight Details */}
                      <div className="md:col-span-3 space-y-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flight</span>
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-blue-400" />
                          <span className="font-black text-white text-lg">
                            {flight?.flightNumber || `Flight #${booking.flightId}`}
                          </span>
                        </div>
                        <span className="text-xs text-blue-400 font-medium block">
                          Gate: {flight?.boardingGate || 'Gate 4B'} (T3)
                        </span>
                      </div>

                      {/* Route Graphic */}
                      <div className="md:col-span-5 flex items-center justify-between gap-4 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
                        <div className="text-left">
                          <span className="text-lg font-black text-white font-mono">{depCode}</span>
                          <p className="text-xs text-slate-300 font-medium">{depCity}</p>
                          <p className="text-[10px] text-slate-400">
                            {flight?.departureTime ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </p>
                        </div>

                        <div className="flex-1 flex flex-col items-center px-2">
                          <span className="text-[10px] text-emerald-400 font-semibold mb-1">Non-stop</span>
                          <div className="w-full flex items-center relative">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-blue-500 via-slate-600 to-blue-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-white font-mono">{arrCode}</span>
                          <p className="text-xs text-slate-300 font-medium">{arrCity}</p>
                          <p className="text-[10px] text-slate-400">
                            {flight?.arrivalTime ? new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Seats */}
                      <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-6 text-left md:text-right">
                        <div>
                          <span className="text-xs text-slate-400 flex items-center md:justify-end gap-1">
                            <Armchair className="w-3.5 h-3.5 text-blue-400" /> Seats
                          </span>
                          <p className="text-base font-bold text-white mt-0.5">
                            {booking.noOfSeats} {booking.noOfSeats === 1 ? 'Passenger' : 'Passengers'}
                          </p>
                          {cachedManifest?.passengers && cachedManifest.passengers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5 md:justify-end max-w-[260px]">
                              {cachedManifest.passengers.map((p, pIdx) => (
                                <span 
                                  key={pIdx} 
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono font-medium"
                                  title={`${p.title} ${p.name || 'Traveler'} • Seat ${p.assignedSeat || 'Assigned'}`}
                                >
                                  {p.name ? p.name.split(' ')[0] : `P${pIdx + 1}`}: {p.assignedSeat || 'Auto'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-xs text-slate-400">Total Paid</span>
                          <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                            ₹{Number(booking.totalCost).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Boarding Pass & Cancellation Action Bar */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="inline-flex items-center gap-2 text-slate-400">
                        {booking.status === 'Cancelled' ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-rose-300 font-medium">Reservation Cancelled • 90% Refund Initiated to Original Source</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Confirmed Booking • Automated SMS Reminders Active</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {booking.status === 'Booked' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingBooking({
                                booking,
                                flight,
                                cachedManifest,
                                depCity,
                                arrCity,
                                depCode,
                                arrCode,
                                pnr
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-xs transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel Reservation
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveBoardingPass({
                              booking,
                              flight: {
                                ...(flight || { flightNumber: `SF-${booking.flightId}` }),
                                passengers: cachedManifest?.passengers
                              }
                            });
                          }}
                          disabled={booking.status === 'Cancelled'}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                            booking.status === 'Cancelled'
                              ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                              : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105'
                          }`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          {booking.status === 'Cancelled' ? 'Trip Cancelled' : 'View Boarding Pass'}
                        </button>
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
              <h3 className="text-lg font-bold text-white">No Trips Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {activeTab === 'ALL'
                  ? "You don't have any bookings in this view. Discover flights and reserve seats in just a few clicks."
                  : `No bookings found under the '${activeTab}' category.`}
              </p>
              <div className="pt-2">
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all hover:scale-[1.02]"
                >
                  Explore Flight Routes <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

        </div>
      )}

      {/* View Boarding Pass Modal */}
      {activeBoardingPass && (
        <BookingConfirmationModal
          booking={activeBoardingPass.booking}
          flight={activeBoardingPass.flight}
          airportsMap={airportsMap}
          citiesMap={citiesMap}
          onClose={() => setActiveBoardingPass(null)}
        />
      )}

      {/* Self-Service Cancellation & Saga Restock Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-6">
            
            <button
              onClick={() => setCancellingBooking(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Cancel Flight Reservation
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  PNR: {cancellingBooking.pnr} • {cancellingBooking.flight?.flightNumber || 'Flight'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Route & Schedule:</span>
                <span className="font-semibold text-white">
                  {cancellingBooking.depCity} ({cancellingBooking.depCode}) ➔ {cancellingBooking.arrCity} ({cancellingBooking.arrCode})
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Seats Reserved:</span>
                <span className="font-semibold text-white">
                  {cancellingBooking.booking.noOfSeats} passenger(s)
                </span>
              </div>
              <div className="border-t border-slate-700 pt-2 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Original Total Fare:</span>
                  <span className="font-mono text-slate-200">₹{Number(cancellingBooking.booking.totalCost).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Aviation Processing Fee (10%):</span>
                  <span className="font-mono text-rose-400">-₹{Math.round(cancellingBooking.booking.totalCost * 0.1).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-slate-700/60 pt-1.5 flex justify-between font-bold text-sm text-white">
                  <span>Net Refund Amount (90%):</span>
                  <span className="text-emerald-400 text-base font-black">
                    ₹{Math.round(cancellingBooking.booking.totalCost * 0.9).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="Change of personal travel schedule">Change of personal travel schedule</option>
                <option value="Found alternative transportation">Found alternative transportation</option>
                <option value="Medical or emergency circumstances">Medical or emergency circumstances</option>
                <option value="Flight schedule clash">Flight schedule clash</option>
                <option value="Other personal reasons">Other personal reasons</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Inventory Restoration Notice</span>
              </div>
              <p className="text-amber-300/80">
                Confirming cancellation will release all {cancellingBooking.booking.noOfSeats} seat(s) back into live flight inventory via Saga compensation. The net refund will be credited to your original payment account within 2-4 business days.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancellingBooking(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelConfirm}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Restock...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Confirm Cancellation
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookings;

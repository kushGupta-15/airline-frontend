import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plane, Calendar, Plus, RefreshCw, CheckCircle2, AlertTriangle, 
  Clock, ShieldCheck, MapPin, Building2, Armchair, DollarSign,
  Layers, Search, ArrowRight, Tag, SlidersHorizontal, Users,
  Radio, Edit3, Printer, FileText, Check, AlertCircle, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { flightApi, bookingApi } from '../api/client';

const AIRPLANES = [
  { id: 1, modelNumber: 'Airbus A320neo', capacity: 180 },
  { id: 2, modelNumber: 'Airbus A330-300', capacity: 250 },
  { id: 3, modelNumber: 'Airbus A350-900', capacity: 350 },
  { id: 4, modelNumber: 'Airbus A380-800', capacity: 450 },
  { id: 5, modelNumber: 'Boeing 777-300ER', capacity: 350 },
];

const DISPATCH_STATUSES = [
  'ON TIME',
  'BOARDING',
  'DELAYED (15m)',
  'DELAYED (30m)',
  'DELAYED (60m)',
  'AIRBORNE',
  'ARRIVED',
  'CANCELLED'
];

export const AdminDashboard = () => {
  const { userEmail } = useAuth();
  const toast = useToast();

  // Active Tab: 'schedule' | 'manifest' | 'passenger_manifest' | 'network'
  const [activeTab, setActiveTab] = useState('schedule');

  // Master Data
  const [flights, setFlights] = useState([]);
  const [cities, setCities] = useState([]);
  const [airports, setAirports] = useState([]);
  const [citiesMap, setCitiesMap] = useState({});
  const [airportsMap, setAirportsMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Form: Schedule New Flight
  const [flightNumber, setFlightNumber] = useState('');
  const [airplaneId, setAirplaneId] = useState('1');
  const [departureAirportId, setDepartureAirportId] = useState('');
  const [arrivalAirportId, setArrivalAirportId] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [price, setPrice] = useState('4500');
  const [boardingGate, setBoardingGate] = useState('T3-Gate 12');

  // Form: Add New City
  const [newCityName, setNewCityName] = useState('');

  // Form: Add New Airport
  const [newAirportName, setNewAirportName] = useState('');
  const [newAirportAddress, setNewAirportAddress] = useState('');
  const [newAirportCityId, setNewAirportCityId] = useState('');

  // Operational Status Dispatcher Overrides
  const [dispatcherOverrides, setDispatcherOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('skyflow_dispatcher_overrides') || '{}');
    } catch (_) {
      return {};
    }
  });

  // Passenger Manifest State
  const [selectedManifestFlightId, setSelectedManifestFlightId] = useState('');
  const [allBookings, setAllBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Fetch Master Data
  const fetchOperationsData = useCallback(async () => {
    setLoading(true);
    try {
      const [flightsRes, citiesRes, airportsRes] = await Promise.all([
        flightApi.getFlights(),
        flightApi.getCities(),
        flightApi.getAirports(),
      ]);

      const flightsList = flightsRes.data?.data || [];
      const citiesList = citiesRes.data?.data || [];
      const airportsList = airportsRes.data?.data || [];

      setFlights(flightsList);
      setCities(citiesList);
      setAirports(airportsList);

      const cMap = {};
      citiesList.forEach((c) => { cMap[c.id] = c; });
      setCitiesMap(cMap);

      const aMap = {};
      airportsList.forEach((a) => { aMap[a.id] = a; });
      setAirportsMap(aMap);

      if (airportsList.length >= 2) {
        if (!departureAirportId) setDepartureAirportId(String(airportsList[0].id));
        if (!arrivalAirportId) setArrivalAirportId(String(airportsList[1].id));
      }
      if (citiesList.length > 0 && !newAirportCityId) {
        setNewAirportCityId(String(citiesList[0].id));
      }

      if (flightsList.length > 0 && !selectedManifestFlightId) {
        setSelectedManifestFlightId(String(flightsList[0].id));
      }
    } catch (err) {
      console.error('[AdminDashboard] Failed to fetch operations metadata:', err);
      setFeedback({ type: 'error', message: 'Unable to synchronize master operations data from API Gateway.' });
    } finally {
      setLoading(false);
    }
  }, [departureAirportId, arrivalAirportId, newAirportCityId, selectedManifestFlightId]);

  useEffect(() => {
    fetchOperationsData();
  }, [fetchOperationsData]);

  // Fetch all bookings for Passenger Manifest tab
  const fetchManifestBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await bookingApi.getAllBookings();
      setAllBookings(res.data?.data || []);
    } catch (err) {
      console.error('[AdminDashboard] Failed to fetch manifest bookings:', err);
      toast.error('Unable to synchronize live booking reservations manifest.');
    } finally {
      setBookingsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'passenger_manifest') {
      fetchManifestBookings();
    }
  }, [activeTab, fetchManifestBookings]);

  // Handle Create Flight
  const handleScheduleFlight = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (departureAirportId === arrivalAirportId) {
      setFeedback({ type: 'error', message: 'Departure and arrival airports cannot be identical.' });
      return;
    }

    if (!departureTime || !arrivalTime) {
      setFeedback({ type: 'error', message: 'Please select valid departure and arrival timestamps.' });
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        flightNumber: flightNumber.trim().toUpperCase(),
        airplaneId: parseInt(airplaneId, 10),
        departureAirportId: parseInt(departureAirportId, 10),
        arrivalAirportId: parseInt(arrivalAirportId, 10),
        departureTime: new Date(departureTime).toISOString(),
        arrivalTime: new Date(arrivalTime).toISOString(),
        price: parseFloat(price),
        boardingGate: boardingGate.trim(),
      };

      const res = await flightApi.createFlight(payload);

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: `Flight ${payload.flightNumber} successfully dispatched & published to passenger search catalog!`,
        });
        toast.success(`Flight ${payload.flightNumber} dispatched to network!`);
        setFlightNumber('');
        await fetchOperationsData();
      } else {
        setFeedback({ type: 'error', message: res.data?.message || 'Failed to dispatch flight.' });
      }
    } catch (err) {
      console.error('[AdminDashboard] Create flight error:', err);
      setFeedback({
        type: 'error',
        message: err.formattedMessage || err.message || 'Unable to schedule flight via Flights Service.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Operational Status Dispatcher Handler
  const handleUpdateFlightStatus = (flightId, flightNum, newStatus) => {
    const updated = {
      ...dispatcherOverrides,
      [flightId]: {
        status: newStatus,
        updatedAt: new Date().toISOString()
      }
    };
    setDispatcherOverrides(updated);
    localStorage.setItem('skyflow_dispatcher_overrides', JSON.stringify(updated));
    toast.success(`Flight ${flightNum} operational status dispatched as ${newStatus}!`);
  };

  // Handle Add City
  const handleAddCity = async (e) => {
    e.preventDefault();
    setFeedback(null);
    if (!newCityName.trim()) return;

    setActionLoading(true);
    try {
      const res = await flightApi.createCity({ name: newCityName.trim() });
      if (res.data?.success) {
        setFeedback({ type: 'success', message: `Destination '${newCityName}' added to route network.` });
        toast.success(`Hub city '${newCityName}' registered.`);
        setNewCityName('');
        await fetchOperationsData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.formattedMessage || 'Failed to register city.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Add Airport
  const handleAddAirport = async (e) => {
    e.preventDefault();
    setFeedback(null);
    if (!newAirportName.trim() || !newAirportCityId) return;

    setActionLoading(true);
    try {
      const res = await flightApi.createAirport({
        name: newAirportName.trim(),
        address: newAirportAddress.trim() || 'Terminal 1',
        cityId: parseInt(newAirportCityId, 10),
      });
      if (res.data?.success) {
        setFeedback({ type: 'success', message: `Airport '${newAirportName}' added successfully.` });
        toast.success(`Aviation airport '${newAirportName}' registered.`);
        setNewAirportName('');
        setNewAirportAddress('');
        await fetchOperationsData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.formattedMessage || 'Failed to register airport.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate fleet network stats
  const totalSeats = flights.reduce((acc, f) => acc + (f.totalSeats || 0), 0);

  // Selected Manifest Calculations
  const selectedFlightObj = useMemo(() => {
    return flights.find((f) => String(f.id) === String(selectedManifestFlightId));
  }, [flights, selectedManifestFlightId]);

  const manifestBookings = useMemo(() => {
    if (!selectedManifestFlightId) return [];
    return allBookings.filter((b) => String(b.flightId) === String(selectedManifestFlightId));
  }, [allBookings, selectedManifestFlightId]);

  const manifestStats = useMemo(() => {
    const confirmed = manifestBookings.filter((b) => b.status === 'Booked');
    const bookedSeats = confirmed.reduce((acc, b) => acc + (b.noOfSeats || 1), 0);
    const grossRevenue = confirmed.reduce((acc, b) => acc + (b.totalCost || 0), 0);
    const totalFlightCapacity = selectedFlightObj?.totalSeats ? (selectedFlightObj.totalSeats + bookedSeats) : 180;
    const loadFactor = totalFlightCapacity > 0 ? Math.round((bookedSeats / totalFlightCapacity) * 100) : 0;

    return {
      totalBookings: manifestBookings.length,
      confirmedCount: confirmed.length,
      bookedSeats,
      grossRevenue,
      loadFactor,
    };
  }, [manifestBookings, selectedFlightObj]);

  const handlePrintManifest = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      
      {/* Admin Operations Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Airline Operations Control Center (AOCC)
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Flight Dispatcher & Operations Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Schedule flight routes, dispatch operational statuses, inspect real-time passenger manifests, and manage aviation network hubs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-0.5">
              <span className="text-slate-400 block text-[11px]">Authorized Dispatcher:</span>
              <span className="font-mono font-bold text-white text-xs">{userEmail}</span>
            </div>
            <button
              onClick={() => {
                fetchOperationsData();
                if (activeTab === 'passenger_manifest') fetchManifestBookings();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Network
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Real-time Fleet Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Plane className="w-4 h-4 text-blue-400" /> Scheduled Flights
          </span>
          <p className="text-2xl font-black text-white font-mono">{flights.length}</p>
          <span className="text-[11px] text-emerald-400 font-medium">Active in Passenger Catalog</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Armchair className="w-4 h-4 text-emerald-400" /> Total Seat Capacity
          </span>
          <p className="text-2xl font-black text-white font-mono">{totalSeats.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-400">Available across routes</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <MapPin className="w-4 h-4 text-amber-400" /> Connected Airports
          </span>
          <p className="text-2xl font-black text-white font-mono">{airports.length}</p>
          <span className="text-[11px] text-slate-400">Active aviation stations</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Building2 className="w-4 h-4 text-purple-400" /> Destination Cities
          </span>
          <p className="text-2xl font-black text-white font-mono">{cities.length}</p>
          <span className="text-[11px] text-slate-400">Domestic & regional hubs</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs shadow-md transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Admin Module Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'schedule', label: 'Schedule New Flight', icon: Plus },
          { id: 'manifest', label: 'Operations & Status Dispatcher', icon: Layers },
          { id: 'passenger_manifest', label: 'Passenger Manifest Inspector', icon: Users },
          { id: 'network', label: 'Airports & Hub Network', icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFeedback(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SCHEDULE NEW FLIGHT */}
      {activeTab === 'schedule' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              Dispatch & Schedule Flight Route
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Define the flight number, aircraft assignment, origin, destination, schedules, and initial seat pricing.
            </p>
          </div>

          <form onSubmit={handleScheduleFlight} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Flight Number */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-400" /> Flight Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UK-950 or AI-202"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 uppercase font-mono"
                />
              </div>

              {/* Aircraft Fleet Selection */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-blue-400" /> Assigned Aircraft *
                </label>
                <select
                  value={airplaneId}
                  onChange={(e) => setAirplaneId(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {AIRPLANES.map((plane) => (
                    <option key={plane.id} value={plane.id}>
                      {plane.modelNumber} ({plane.capacity} seats capacity)
                    </option>
                  ))}
                </select>
              </div>

              {/* Boarding Gate */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" /> Boarding Gate
                </label>
                <input
                  type="text"
                  placeholder="e.g. T3-Gate 14B"
                  value={boardingGate}
                  onChange={(e) => setBoardingGate(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Departure Airport */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> Origin Airport *
                </label>
                <select
                  value={departureAirportId}
                  onChange={(e) => setDepartureAirportId(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {airports.map((airport) => (
                    <option key={airport.id} value={airport.id}>
                      {citiesMap[airport.cityId]?.name || 'City'} — {airport.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Arrival Airport */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 rotate-90" /> Destination Airport *
                </label>
                <select
                  value={arrivalAirportId}
                  onChange={(e) => setArrivalAirportId(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {airports.map((airport) => (
                    <option key={airport.id} value={airport.id}>
                      {citiesMap[airport.cityId]?.name || 'City'} — {airport.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure Timestamp */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Scheduled Departure Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Arrival Timestamp */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Scheduled Arrival Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Base Ticket Price */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Base Ticket Price (INR) *
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
              >
                <Plane className="w-4 h-4" />
                {actionLoading ? 'Publishing Schedule...' : 'Publish & Schedule Flight'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: LIVE FLIGHTS & OPERATIONAL DISPATCHER */}
      {activeTab === 'manifest' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-400" />
                Operations & Flight Status Dispatcher
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live flight schedule table with on-the-fly operational status dispatching synced directly to passenger radar tracker.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Dispatched Flights: <strong className="text-white">{flights.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-800/60 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Flight</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Departure</th>
                  <th className="py-3 px-4">Arrival</th>
                  <th className="py-3 px-4">Gate</th>
                  <th className="py-3 px-4">Remaining Seats</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Operational Status</th>
                  <th className="py-3 px-4 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {flights.map((flight) => {
                  const depA = airportsMap[flight.departureAirportId];
                  const arrA = airportsMap[flight.arrivalAirportId];
                  const depC = depA ? citiesMap[depA.cityId]?.name : 'Origin';
                  const arrC = arrA ? citiesMap[arrA.cityId]?.name : 'Destination';

                  const depTimeStr = flight.departureTime
                    ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--';
                  const arrTimeStr = flight.arrivalTime
                    ? new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--';

                  const override = dispatcherOverrides[flight.id];
                  const currentStatus = override?.status || 'ON TIME';

                  return (
                    <tr key={flight.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {flight.flightNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-white font-medium">{depC}</span> ➔{' '}
                        <span className="text-white font-medium">{arrC}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {depTimeStr}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {arrTimeStr}
                      </td>
                      <td className="py-3.5 px-4 text-blue-400 font-semibold font-mono">
                        {flight.boardingGate || 'Gate 14'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-400">{flight.totalSeats}</span> seats
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        ₹{Number(flight.price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                          currentStatus === 'ON TIME'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : currentStatus === 'BOARDING'
                            ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300 animate-pulse'
                            : currentStatus.includes('DELAYED')
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                            : currentStatus === 'AIRBORNE'
                            ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-800 border border-slate-700 text-slate-400'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <select
                            value={currentStatus}
                            onChange={(e) => handleUpdateFlightStatus(flight.id, flight.flightNumber, e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            {DISPATCH_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                Dispatch: {st}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              setSelectedManifestFlightId(String(flight.id));
                              setActiveTab('passenger_manifest');
                            }}
                            title="Inspect Flight Manifest"
                            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PASSENGER MANIFEST & SEAT ALLOCATIONS INSPECTOR */}
      {activeTab === 'passenger_manifest' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Flight Passenger Manifest & Seat Allocations
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official passenger manifest, ticketed reservations, seat assignments, and revenue telemetry for dispatched flights.
              </p>
            </div>

            {/* Flight Selector & Print Actions */}
            <div className="flex items-center gap-3">
              <select
                value={selectedManifestFlightId}
                onChange={(e) => setSelectedManifestFlightId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer font-mono"
              >
                {flights.map((f) => {
                  const depA = airportsMap[f.departureAirportId];
                  const arrA = airportsMap[f.arrivalAirportId];
                  const depC = depA ? citiesMap[depA.cityId]?.name : 'Origin';
                  const arrC = arrA ? citiesMap[arrA.cityId]?.name : 'Dest';
                  return (
                    <option key={f.id} value={f.id}>
                      {f.flightNumber} ({depC} ➔ {arrC})
                    </option>
                  );
                })}
              </select>

              <button
                onClick={handlePrintManifest}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                Export / Print
              </button>
            </div>
          </div>

          {/* Flight Summary Banner */}
          {selectedFlightObj && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400">Selected Flight</span>
                <p className="text-lg font-black text-white font-mono">{selectedFlightObj.flightNumber}</p>
                <span className="text-[10px] text-blue-400">Airbus A320neo</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400">Total Manifested Seats</span>
                <p className="text-lg font-black text-emerald-400 font-mono">
                  {manifestStats.bookedSeats} seats
                </p>
                <span className="text-[10px] text-slate-400">Confirmed & ticketed</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400">Gross Fare Revenue</span>
                <p className="text-lg font-black text-white font-mono">
                  ₹{manifestStats.grossRevenue.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-emerald-400">Direct booking yield</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400">Seat Load Factor</span>
                <p className="text-lg font-black text-purple-400 font-mono">
                  {manifestStats.loadFactor}%
                </p>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${Math.min(100, manifestStats.loadFactor)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Passenger Table */}
          {bookingsLoading ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Compiling passenger manifest records...</p>
            </div>
          ) : manifestBookings.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Passenger Reservations for this Flight</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No tickets have been booked for flight {selectedFlightObj?.flightNumber} yet. New passenger bookings will instantly appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase bg-slate-800/60 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Passenger Account</th>
                    <th className="py-3 px-4">Seats Reserved</th>
                    <th className="py-3 px-4">Assigned Cabin Seats</th>
                    <th className="py-3 px-4">Total Fare</th>
                    <th className="py-3 px-4">Ticket Status</th>
                    <th className="py-3 px-4 text-right">Reservation Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {manifestBookings.map((booking) => {
                    // Generate representative seat assignment codes for manifest
                    const seatCodes = Array.from({ length: booking.noOfSeats || 1 }).map((_, i) => {
                      const row = 10 + (booking.id % 15);
                      const col = ['A', 'B', 'C', 'D', 'E', 'F'][(i + (booking.id % 6)) % 6];
                      return `${row}${col}`;
                    }).join(', ');

                    return (
                      <tr key={booking.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                          SKF-{String(booking.id).padStart(5, '0')}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-white">
                          Customer #{booking.userId}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-200">
                          {booking.noOfSeats} {booking.noOfSeats > 1 ? 'Passengers' : 'Passenger'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                          {seatCodes}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          ₹{Number(booking.totalCost).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            booking.status === 'Booked'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                          }`}>
                            {booking.status === 'Booked' ? 'CONFIRMED' : 'CANCELLED & REFUNDED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recently'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AIRPORTS & NETWORK */}
      {activeTab === 'network' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Add New Destination City */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                Add Destination Hub / City
              </h3>
              <p className="text-xs text-slate-400">Register new flight destination regions.</p>
            </div>

            <form onSubmit={handleAddCity} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">City Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune, Jaipur, Goa"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Register Destination City
              </button>
            </form>

            <div className="pt-2">
              <span className="text-xs text-slate-400 font-semibold block mb-2">Configured Cities ({cities.length}):</span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {cities.map((c) => (
                  <span key={c.id} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Add New Airport */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                Add Aviation Airport
              </h3>
              <p className="text-xs text-slate-400">Register airports under configured destination cities.</p>
            </div>

            <form onSubmit={handleAddAirport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Airport Name (with IATA Code)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa International Airport (GOI)"
                  value={newAirportName}
                  onChange={(e) => setNewAirportName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">City Assignment</label>
                <select
                  value={newAirportCityId}
                  onChange={(e) => setNewAirportCityId(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Register Airport
              </button>
            </form>

            <div className="pt-2">
              <span className="text-xs text-slate-400 font-semibold block mb-2">Configured Airports ({airports.length}):</span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {airports.map((a) => (
                  <span key={a.id} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium">
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

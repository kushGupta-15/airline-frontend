import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plane, Search, Clock, MapPin, Building2, AlertTriangle, 
  CheckCircle2, RefreshCw, Luggage, ShieldAlert, ArrowRight, 
  Wind, Navigation, Sparkles, Filter, ChevronDown, ChevronUp,
  Compass, Radio, Armchair, Calendar, BellRing
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { flightApi } from '../api/client';
import { useToast } from '../context/ToastContext';

// Helper to determine realistic operational status and telemetry based on time
const computeFlightTelemetry = (flight, liveStatusOverride) => {
  if (liveStatusOverride) {
    return liveStatusOverride;
  }

  const now = new Date().getTime();
  const depTime = flight.departureTime ? new Date(flight.departureTime).getTime() : now + 3600000;
  const arrTime = flight.arrivalTime ? new Date(flight.arrivalTime).getTime() : depTime + 7200000;

  const diffToDep = depTime - now;
  const diffToArr = arrTime - now;

  let status = 'ON TIME';
  let stage = 0; // 0: Scheduled, 1: Check-in Open, 2: Security/Gate, 3: Boarding, 4: Airborne, 5: Arrived
  let progressPct = 0;
  let statusColor = 'emerald';

  if (now > arrTime) {
    status = 'ARRIVED';
    stage = 5;
    progressPct = 100;
    statusColor = 'slate';
  } else if (now >= depTime && now <= arrTime) {
    status = 'AIRBORNE';
    stage = 4;
    const totalFlightDuration = arrTime - depTime;
    const elapsed = now - depTime;
    progressPct = Math.min(95, Math.max(10, Math.round((elapsed / totalFlightDuration) * 100)));
    statusColor = 'indigo';
  } else if (diffToDep <= 45 * 60 * 1000 && diffToDep > 0) {
    status = 'BOARDING';
    stage = 3;
    progressPct = 15;
    statusColor = 'blue';
  } else if (diffToDep <= 120 * 60 * 1000 && diffToDep > 0) {
    status = 'GATE OPEN';
    stage = 2;
    progressPct = 5;
    statusColor = 'amber';
  } else if (diffToDep <= 360 * 60 * 1000 && diffToDep > 0) {
    status = 'CHECK-IN OPEN';
    stage = 1;
    progressPct = 0;
    statusColor = 'emerald';
  } else {
    status = 'SCHEDULED';
    stage = 0;
    progressPct = 0;
    statusColor = 'emerald';
  }

  return { status, stage, progressPct, statusColor };
};

export const FlightStatusPage = () => {
  const toast = useToast();
  const [flights, setFlights] = useState([]);
  const [cities, setCities] = useState([]);
  const [airports, setAirports] = useState([]);
  const [citiesMap, setCitiesMap] = useState({});
  const [airportsMap, setAirportsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedFlightId, setExpandedFlightId] = useState(null);

  // Live Dispatcher Overrides (synced with AOCC command center)
  const [dispatcherOverrides, setDispatcherOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('skyflow_dispatcher_overrides') || '{}');
    } catch (_) {
      return {};
    }
  });

  // Fetch Master Flight Data
  const loadFlightsData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

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

      // Reload local dispatcher overrides
      try {
        const saved = JSON.parse(localStorage.getItem('skyflow_dispatcher_overrides') || '{}');
        setDispatcherOverrides(saved);
      } catch (_) {}

      if (isManualRefresh) {
        toast.success('Live flight status telemetry refreshed from AOCC');
      }
    } catch (err) {
      console.error('[FlightStatus] Failed to load flights:', err);
      toast.error('Unable to synchronize real-time flight telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFlightsData();
  }, [loadFlightsData]);

  // Filtered Flights List
  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      // 1. Flight number or airline code query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const numMatch = flight.flightNumber?.toLowerCase().includes(q);
        const depA = airportsMap[flight.departureAirportId];
        const arrA = airportsMap[flight.arrivalAirportId];
        const depC = depA ? citiesMap[depA.cityId]?.name?.toLowerCase() : '';
        const arrC = arrA ? citiesMap[arrA.cityId]?.name?.toLowerCase() : '';
        const routeMatch = depC?.includes(q) || arrC?.includes(q);
        if (!numMatch && !routeMatch) return false;
      }

      // 2. Origin Filter
      if (selectedOrigin) {
        const depA = airportsMap[flight.departureAirportId];
        if (depA && String(depA.cityId) !== selectedOrigin) return false;
      }

      // 3. Destination Filter
      if (selectedDestination) {
        const arrA = airportsMap[flight.arrivalAirportId];
        if (arrA && String(arrA.cityId) !== selectedDestination) return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'ALL') {
        const override = dispatcherOverrides[flight.id];
        const telemetry = computeFlightTelemetry(flight, override);
        if (statusFilter === 'ON_TIME' && telemetry.status !== 'ON TIME' && telemetry.status !== 'SCHEDULED') return false;
        if (statusFilter === 'BOARDING' && telemetry.status !== 'BOARDING') return false;
        if (statusFilter === 'AIRBORNE' && telemetry.status !== 'AIRBORNE') return false;
        if (statusFilter === 'DELAYED' && !telemetry.status.includes('DELAYED')) return false;
        if (statusFilter === 'ARRIVED' && telemetry.status !== 'ARRIVED') return false;
      }

      return true;
    });
  }, [flights, searchQuery, selectedOrigin, selectedDestination, statusFilter, airportsMap, citiesMap, dispatcherOverrides]);

  const STAGES = [
    { label: 'Scheduled', icon: Calendar },
    { label: 'Check-in Open', icon: Clock },
    { label: 'Security & Gate', icon: Building2 },
    { label: 'Boarding', icon: Armchair },
    { label: 'In Flight', icon: Navigation },
    { label: 'Arrived', icon: CheckCircle2 },
  ];

  const getStatusBadge = (status) => {
    if (status === 'ON TIME' || status === 'SCHEDULED' || status === 'CHECK-IN OPEN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {status}
        </span>
      );
    }
    if (status === 'BOARDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-xs shadow-sm shadow-blue-500/20">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
          BOARDING NOW
        </span>
      );
    }
    if (status === 'AIRBORNE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-xs">
          <Navigation className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          AIRBORNE
        </span>
      );
    }
    if (status.includes('DELAYED')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 border border-blue-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Live Flight Radar & Operations Telemetry
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Real-Time Flight Status Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track live flight departures, arrivals, terminal gates, baggage carousels, and in-flight airborne progress across the SkyFlow domestic network.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => loadFlightsData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing Telemetry...' : 'Refresh Radar'}
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Search by Flight Number */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search flight number (e.g. AI-999, UK-820) or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono tracking-wide"
            />
          </div>

          {/* Origin Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Origin: All Hubs</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  From {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Destination: All Hubs</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  To {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="md:col-span-1 flex items-center justify-center">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedOrigin('');
                setSelectedDestination('');
                setStatusFilter('ALL');
              }}
              title="Reset all filters"
              className="w-full h-full py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Quick Operational Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 mr-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-400" /> Filter Status:
          </span>
          {[
            { id: 'ALL', label: 'All Departures' },
            { id: 'ON_TIME', label: 'On Time / Scheduled' },
            { id: 'BOARDING', label: 'Boarding Now' },
            { id: 'AIRBORNE', label: 'Airborne (En Route)' },
            { id: 'DELAYED', label: 'Delayed' },
            { id: 'ARRIVED', label: 'Arrived' },
          ].map((chip) => {
            const isActive = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Flight Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400">Synchronizing live radar tracking telemetry...</p>
        </div>
      ) : filteredFlights.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <Plane className="w-12 h-12 text-slate-600 mx-auto rotate-45" />
          <h3 className="text-base font-bold text-white">No flights matching tracking criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, selecting different airport hubs, or choosing 'All Departures'.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFlights.map((flight) => {
            const depA = airportsMap[flight.departureAirportId];
            const arrA = airportsMap[flight.arrivalAirportId];
            const depCityName = depA ? citiesMap[depA.cityId]?.name || 'Origin' : 'Origin';
            const arrCityName = arrA ? citiesMap[arrA.cityId]?.name || 'Destination' : 'Destination';

            const depTimeObj = flight.departureTime ? new Date(flight.departureTime) : null;
            const arrTimeObj = flight.arrivalTime ? new Date(flight.arrivalTime) : null;

            const depTimeStr = depTimeObj ? depTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const arrTimeStr = arrTimeObj ? arrTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const depDateStr = depTimeObj ? depTimeObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';

            // Compute dynamic or overridden status
            const override = dispatcherOverrides[flight.id];
            const telemetry = computeFlightTelemetry(flight, override);
            const isExpanded = expandedFlightId === flight.id;

            // Baggage Carousel calculation (e.g. Belt 2 based on flight id)
            const baggageBelt = `Belt ${(flight.id % 5) + 1}`;
            const gate = flight.boardingGate || `Gate ${(flight.id * 3) % 24 + 1}`;

            return (
              <div
                key={flight.id}
                className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all shadow-xl overflow-hidden"
              >
                {/* Main Flight Overview Bar */}
                <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left: Carrier & Flight Number */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                      <Plane className="w-6 h-6 rotate-45" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-white">
                          {flight.flightNumber}
                        </span>
                        {getStatusBadge(telemetry.status)}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Airbus A320neo • Non-Stop Service
                      </p>
                    </div>
                  </div>

                  {/* Center: Route, Times & Visual Flight Path */}
                  <div className="flex-1 max-w-xl">
                    <div className="flex items-center justify-between gap-4">
                      
                      {/* Origin */}
                      <div className="text-left space-y-0.5">
                        <span className="text-xl sm:text-2xl font-black font-mono text-white">
                          {depTimeStr}
                        </span>
                        <div className="font-bold text-xs text-slate-200">
                          {depCityName}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                          {depA?.name || 'Hub Terminal'}
                        </span>
                        <span className="text-[10px] text-blue-400 font-semibold block">
                          Gate: {gate}
                        </span>
                      </div>

                      {/* Flight Path Graphic */}
                      <div className="flex-1 px-4 flex flex-col items-center">
                        <span className="text-[10px] font-mono text-slate-400 mb-1">
                          {depDateStr}
                        </span>
                        <div className="w-full relative flex items-center">
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${telemetry.progressPct}%` }}
                            ></div>
                          </div>
                          <Plane 
                            className="w-4 h-4 text-blue-400 absolute transition-all duration-500 -top-1.5"
                            style={{ left: `calc(${telemetry.progressPct}% - 8px)` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 font-medium">
                          {telemetry.status === 'AIRBORNE' ? `${telemetry.progressPct}% flown` : 'Direct Route'}
                        </span>
                      </div>

                      {/* Destination */}
                      <div className="text-right space-y-0.5">
                        <span className="text-xl sm:text-2xl font-black font-mono text-white">
                          {arrTimeStr}
                        </span>
                        <div className="font-bold text-xs text-slate-200">
                          {arrCityName}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                          {arrA?.name || 'Destination Terminal'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold block">
                          Claim: {baggageBelt}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <button
                      onClick={() => setExpandedFlightId(isExpanded ? null : flight.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                    >
                      {isExpanded ? 'Hide Details' : 'Operational Details'}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <Link
                      to={`/search?origin=${depA?.cityId || ''}&destination=${arrA?.cityId || ''}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold text-xs transition-colors"
                    >
                      Book Flight
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>

                {/* Expanded Operational Telemetry Drawer */}
                {isExpanded && (
                  <div className="p-6 bg-slate-950/60 border-t border-slate-800 space-y-6 animate-in fade-in duration-200">
                    
                    {/* Operational Progress Stages Timeline */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-blue-400" />
                        Flight Progression Milestones
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {STAGES.map((s, idx) => {
                          const Icon = s.icon;
                          const isPassed = idx < telemetry.stage;
                          const isCurrent = idx === telemetry.stage;
                          return (
                            <div
                              key={s.label}
                              className={`p-3 rounded-2xl border text-center space-y-1.5 transition-all ${
                                isCurrent
                                  ? 'bg-blue-600/20 border-blue-500/50 shadow-md text-white'
                                  : isPassed
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-500'
                              }`}
                            >
                              <div className="flex justify-center">
                                <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-400 animate-pulse' : isPassed ? 'text-emerald-400' : 'text-slate-600'}`} />
                              </div>
                              <span className="text-[11px] font-bold block">{s.label}</span>
                              <span className="text-[10px] block opacity-80">
                                {isPassed ? 'Completed' : isCurrent ? 'Active Stage' : 'Pending'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ground & In-Flight Telemetry Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" /> Departure Gate
                        </span>
                        <p className="text-sm font-mono font-bold text-white">{gate}</p>
                        <span className="text-[10px] text-slate-400">Terminal 3 (Main Hall)</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Luggage className="w-3.5 h-3.5 text-emerald-400" /> Baggage Claim
                        </span>
                        <p className="text-sm font-mono font-bold text-white">{baggageBelt}</p>
                        <span className="text-[10px] text-slate-400">Arrivals Carousel</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-amber-400" /> Destination Weather
                        </span>
                        <p className="text-sm font-mono font-bold text-white">28°C • Clear Sky</p>
                        <span className="text-[10px] text-slate-400">Wind 8 kt • Visibility 10 km</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Armchair className="w-3.5 h-3.5 text-purple-400" /> Available Seats
                        </span>
                        <p className="text-sm font-mono font-bold text-white">{flight.totalSeats} seats</p>
                        <span className="text-[10px] text-emerald-400 font-semibold">Ready for Online Check-in</span>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default FlightStatusPage;

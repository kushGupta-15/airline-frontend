import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plane, Search, ArrowLeftRight, Calendar, SlidersHorizontal, 
  RotateCcw, AlertTriangle, ArrowUpDown, Sparkles, Filter 
} from 'lucide-react';
import { flightApi } from '../api/client';
import { FlightCard } from '../components/flights/FlightCard';
import { RedisCacheBadge } from '../components/flights/RedisCacheBadge';
import { BookingModal } from '../components/booking/BookingModal';
import { BookingConfirmationModal } from '../components/booking/BookingConfirmationModal';

export const FlightSearch = () => {
  // Master options from Gateway
  const [cities, setCities] = useState([]);
  const [airports, setAirports] = useState([]);
  const [citiesMap, setCitiesMap] = useState({});
  const [airportsMap, setAirportsMap] = useState({});

  // Filter & Search states
  const [departureAirportId, setDepartureAirportId] = useState('');
  const [arrivalAirportId, setArrivalAirportId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minSeats, setMinSeats] = useState(0);
  const [sortBy, setSortBy] = useState('price-asc'); // price-asc | price-desc | time-asc | seats-desc

  // Results & metadata
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cacheStatus, setCacheStatus] = useState('MISS');
  const [correlationId, setCorrelationId] = useState('');
  const [queryLatency, setQueryLatency] = useState(null);
  const [selectedFlightForBooking, setSelectedFlightForBooking] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // 1. Fetch cities and airports on mount
  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        const [citiesRes, airportsRes] = await Promise.all([
          flightApi.getCities(),
          flightApi.getAirports(),
        ]);

        if (isMounted) {
          const citiesList = citiesRes.data?.data || [];
          const airportsList = airportsRes.data?.data || [];

          setCities(citiesList);
          setAirports(airportsList);

          const cMap = {};
          citiesList.forEach((c) => { cMap[c.id] = c; });
          setCitiesMap(cMap);

          const aMap = {};
          airportsList.forEach((a) => { aMap[a.id] = a; });
          setAirportsMap(aMap);
        }
      } catch (err) {
        console.error('[FlightSearch] Failed to fetch airports/cities metadata:', err);
      }
    };

    fetchMetadata();
    return () => { isMounted = false; };
  }, []);

  // 2. Perform search query via API Gateway
  const executeSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const params = {};
      if (departureAirportId) params.departureAirportId = departureAirportId;
      if (arrivalAirportId) params.arrivalAirportId = arrivalAirportId;
      if (maxPrice && maxPrice < 10000) params.maxPrice = maxPrice;
      if (departureDate) params.date = departureDate;
      if (minSeats && minSeats > 0) params.minSeats = minSeats;

      const response = await flightApi.getFlights(params);
      const endTime = performance.now();
      setQueryLatency(Math.round(endTime - startTime));

      if (response.data?.success) {
        setFlights(response.data.data || []);
      } else {
        setFlights([]);
      }

      setCacheStatus(response.cacheStatus || 'MISS');
      setCorrelationId(response.correlationId || '');
    } catch (err) {
      console.error('[FlightSearch] Query error:', err);
      setError(err.formattedMessage || 'Failed to fetch flights from API Gateway');
      setCorrelationId(err.correlationId || '');
    } finally {
      setLoading(false);
    }
  }, [departureAirportId, arrivalAirportId, maxPrice, departureDate, minSeats]);

  // Initial load
  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  // Swap Departure and Arrival
  const handleSwapAirports = () => {
    const temp = departureAirportId;
    setDepartureAirportId(arrivalAirportId);
    setArrivalAirportId(temp);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setDepartureAirportId('');
    setArrivalAirportId('');
    setDepartureDate('');
    setMaxPrice(10000);
    setMinSeats(0);
    setSortBy('price-asc');
  };

  // Sort results client-side
  const sortedFlights = [...flights].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'seats-desc') return (b.totalSeats || 0) - (a.totalSeats || 0);
    if (sortBy === 'time-asc') {
      return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Search Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Interactive Search Engine • Microservices Gateway
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Discover & Book Flight Routes
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Real-time flight discovery with multi-city routing, sub-millisecond Redis caching, and distributed tracing.
          </p>
        </div>

        {/* Dynamic Search Controls */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
          {/* Departure Airport Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-blue-400" /> Departure Origin
            </label>
            <select
              value={departureAirportId}
              onChange={(e) => setDepartureAirportId(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">All Departure Cities & Airports</option>
              {airports.map((airport) => {
                const cityName = citiesMap[airport.cityId]?.name || 'City';
                return (
                  <option key={airport.id} value={airport.id}>
                    {cityName} — {airport.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Airport Swap Button */}
          <div className="md:col-span-2 flex items-end justify-center pb-1">
            <button
              onClick={handleSwapAirports}
              type="button"
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
              title="Swap Departure and Arrival Airports"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Arrival Airport Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-blue-400 rotate-90" /> Arrival Destination
            </label>
            <select
              value={arrivalAirportId}
              onChange={(e) => setArrivalAirportId(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">All Arrival Destinations</option>
              {airports.map((airport) => {
                const cityName = citiesMap[airport.cityId]?.name || 'City';
                return (
                  <option key={airport.id} value={airport.id}>
                    {cityName} — {airport.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Date Picker */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Departure Date
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Price Range Slider */}
          <div className="md:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" /> Max Budget
              </span>
              <span className="text-blue-400 font-mono font-bold">
                {maxPrice >= 10000 ? 'Any Budget' : `₹${maxPrice.toLocaleString('en-IN')}`}
              </span>
            </div>
            <input
              type="range"
              min="2000"
              max="10000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>₹2,000</span>
              <span>₹6,000</span>
              <span>₹10,000+</span>
            </div>
          </div>

          {/* Seat Availability Filter */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-400" /> Min Seats Required
            </label>
            <select
              value={minSeats}
              onChange={(e) => setMinSeats(Number(e.target.value))}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="0">Any Availability (1+ seats)</option>
              <option value="50">At least 50 seats</option>
              <option value="150">At least 150 seats</option>
              <option value="200">At least 200 seats</option>
            </select>
          </div>

          {/* Action Row */}
          <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            {/* Quick date pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Quick Dates:</span>
              {[
                { label: 'All Dates', value: '' },
                { label: '20 Oct', value: '2026-10-20' },
                { label: '21 Oct', value: '2026-10-21' },
                { label: '22 Oct', value: '2026-10-22' },
                { label: '25 Oct', value: '2026-10-25' },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setDepartureDate(d.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    departureDate === d.value
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={executeSearch}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Redis Performance Bar */}
      <RedisCacheBadge
        cacheStatus={cacheStatus}
        correlationId={correlationId}
        responseTime={queryLatency}
        totalResults={flights.length}
      />

      {/* Results Header: Sort Options */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Available Flights
            <span className="text-xs font-normal text-slate-400">
              (Connecting via Port 3005)
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" /> Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="time-asc">Earliest Departure</option>
            <option value="seats-desc">Most Seats Available</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-red-300/80 mt-1">
              Ensure API Gateway (:3005) and Flight Search (:3000) microservices are operational.
            </p>
          </div>
          <button
            onClick={executeSearch}
            className="px-3 py-1 bg-red-800/60 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 animate-pulse space-y-4">
              <div className="h-6 bg-slate-800 rounded-md w-1/4"></div>
              <div className="h-10 bg-slate-800/50 rounded-md w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Results List */}
      {!loading && !error && sortedFlights.length > 0 && (
        <div className="space-y-4">
          {sortedFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              airportsMap={airportsMap}
              citiesMap={citiesMap}
              onSelect={(selected) => setSelectedFlightForBooking(selected)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedFlights.length === 0 && (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Plane className="w-8 h-8 opacity-40 rotate-45" />
          </div>
          <h3 className="text-lg font-bold text-white">No Flights Match Your Criteria</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Try resetting your price range, choosing different departure dates, or searching for other airport destinations.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Filters
          </button>
        </div>
      )}

      {/* Interactive Booking & Checkout Modal */}
      {selectedFlightForBooking && (
        <BookingModal
          flight={selectedFlightForBooking}
          airportsMap={airportsMap}
          citiesMap={citiesMap}
          onClose={() => setSelectedFlightForBooking(null)}
          onBookingSuccess={(bookingData, flightData) => {
            setSelectedFlightForBooking(null);
            setConfirmedBooking({ booking: bookingData, flight: flightData });
            executeSearch(); // Refresh live flight seat inventory
          }}
        />
      )}

      {/* Booking Confirmation & Event Status Modal */}
      {confirmedBooking && (
        <BookingConfirmationModal
          booking={confirmedBooking.booking}
          flight={confirmedBooking.flight}
          onClose={() => setConfirmedBooking(null)}
        />
      )}
    </div>
  );
};

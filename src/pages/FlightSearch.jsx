import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plane, Search, ArrowLeftRight, Calendar, SlidersHorizontal, 
  RotateCcw, AlertTriangle, ArrowUpDown, Sparkles, Filter, 
  ShieldCheck, Clock, CheckCircle2, Zap, Users, Tag
} from 'lucide-react';
import { flightApi } from '../api/client';
import { FlightCard } from '../components/flights/FlightCard';
import { BookingModal } from '../components/booking/BookingModal';
import { BookingConfirmationModal } from '../components/booking/BookingConfirmationModal';

export const FlightSearch = () => {
  // Master options from Gateway
  const [cities, setCities] = useState([]);
  const [airports, setAirports] = useState([]);
  const [citiesMap, setCitiesMap] = useState({});
  const [airportsMap, setAirportsMap] = useState({});

  // Search form states
  const [tripType, setTripType] = useState('oneway'); // oneway | roundtrip
  const [cabinClass, setCabinClass] = useState('Economy');
  const [passengerCount, setPassengerCount] = useState(1);
  const [departureAirportId, setDepartureAirportId] = useState('');
  const [arrivalAirportId, setArrivalAirportId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  // Round-trip leg selection states
  const [activeLeg, setActiveLeg] = useState('outbound'); // outbound | inbound
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState(null);

  // Filter states
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedAirlines, setSelectedAirlines] = useState([]); // ['AI', '6E', 'SG', 'QP', 'UK']
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('ALL'); // ALL | morning | afternoon | evening
  const [minSeats, setMinSeats] = useState(0);
  const [sortBy, setSortBy] = useState('price-asc'); // price-asc | price-desc | time-asc | seats-desc

  // Results & metadata
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

    try {
      const params = {};
      if (departureAirportId) params.departureAirportId = departureAirportId;
      if (arrivalAirportId) params.arrivalAirportId = arrivalAirportId;
      if (maxPrice && maxPrice < 10000) params.maxPrice = maxPrice;
      if (departureDate) params.date = departureDate;
      if (minSeats && minSeats > 0) params.minSeats = minSeats;

      const response = await flightApi.getFlights(params);

      if (response.data?.success) {
        setFlights(response.data.data || []);
      } else {
        setFlights([]);
      }
    } catch (err) {
      console.error('[FlightSearch] Query error:', err);
      setError('Unable to fetch live flight schedules right now. Please verify your connection and retry.');
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
    setReturnDate('');
    setSelectedOutboundFlight(null);
    setSelectedReturnFlight(null);
    setActiveLeg('outbound');
    setMaxPrice(10000);
    setMinSeats(0);
    setSelectedAirlines([]);
    setSelectedTimeSlot('ALL');
    setSortBy('price-asc');
  };

  // Toggle airline filter
  const toggleAirline = (prefix) => {
    setSelectedAirlines((prev) => 
      prev.includes(prefix) ? prev.filter((p) => p !== prefix) : [...prev, prefix]
    );
  };

  // Client-side filtering & sorting for outbound flights
  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      // Airline prefix filter
      if (selectedAirlines.length > 0) {
        const prefix = flight.flightNumber?.split('-')[0];
        if (!selectedAirlines.includes(prefix)) return false;
      }

      // Time slot filter
      if (selectedTimeSlot !== 'ALL' && flight.departureTime) {
        const hours = new Date(flight.departureTime).getHours();
        if (selectedTimeSlot === 'morning' && (hours < 6 || hours >= 12)) return false;
        if (selectedTimeSlot === 'afternoon' && (hours < 12 || hours >= 18)) return false;
        if (selectedTimeSlot === 'evening' && (hours < 18 || hours >= 24)) return false;
      }

      return true;
    });
  }, [flights, selectedAirlines, selectedTimeSlot]);

  const sortedFlights = useMemo(() => {
    return [...filteredFlights].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'seats-desc') return (b.totalSeats || 0) - (a.totalSeats || 0);
      if (sortBy === 'time-asc') {
        return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      }
      return 0;
    });
  }, [filteredFlights, sortBy]);

  // Compute return flights (reverse route: arrival -> departure)
  const sortedReturnFlights = useMemo(() => {
    return flights.filter((f) => {
      if (arrivalAirportId && f.departureAirportId !== Number(arrivalAirportId)) return false;
      if (departureAirportId && f.arrivalAirportId !== Number(departureAirportId)) return false;
      if (maxPrice && maxPrice < 10000 && f.price > maxPrice) return false;
      if (minSeats && minSeats > 0 && f.totalSeats < minSeats) return false;
      if (selectedAirlines.length > 0) {
        const prefix = f.flightNumber?.split('-')[0];
        if (!selectedAirlines.includes(prefix)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'seats-desc') return (b.totalSeats || 0) - (a.totalSeats || 0);
      return 0;
    });
  }, [flights, arrivalAirportId, departureAirportId, maxPrice, minSeats, selectedAirlines, sortBy]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Flight Search Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Official SkyFlow Flight Booking Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Book Flights at the Best Fares
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Compare non-stop routes across top domestic airlines. Enjoy instant confirmation, seat choice, and 24/7 flight assistance.
          </p>
        </div>

        {/* Flight Booking Panel */}
        <div className="mt-6 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xl backdrop-blur-md space-y-5">
          
          {/* Trip Type & Cabin Class Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTripType('oneway')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  tripType === 'oneway' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                One-Way
              </button>
              <button
                type="button"
                onClick={() => setTripType('roundtrip')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  tripType === 'roundtrip' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                Round-Trip
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <select
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-slate-300">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Economy">Economy</option>
                  <option value="Premium">Premium Economy</option>
                  <option value="Business">Business Class</option>
                </select>
              </div>
            </div>
          </div>

          {/* Route & Date Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Origin Airport */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-blue-400" /> From (Origin City)
              </label>
              <select
                value={departureAirportId}
                onChange={(e) => setDepartureAirportId(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">All Departure Cities</option>
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

            {/* Swap Button */}
            <div className="md:col-span-2 flex items-end justify-center pb-1">
              <button
                onClick={handleSwapAirports}
                type="button"
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
                title="Swap Departure and Arrival Cities"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Airport */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-blue-400 rotate-90" /> To (Destination City)
              </label>
              <select
                value={arrivalAirportId}
                onChange={(e) => setArrivalAirportId(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">All Destination Cities</option>
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

            {/* Departure Date */}
            <div className={`${tripType === 'roundtrip' ? 'md:col-span-3' : 'md:col-span-6'} space-y-1.5`}>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Departure Date
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Return Date (Round-Trip Only) */}
            {tripType === 'roundtrip' && (
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Return Date
                </label>
                <input
                  type="date"
                  min={departureDate || ''}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            )}

            {/* Max Budget Slider */}
            <div className="md:col-span-6 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" /> Maximum Price Budget
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
          </div>

          {/* Quick Date Pills & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Popular Dates:</span>
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
                Search Flights
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Consumer Trust Badges */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">Instant Confirmation</span>
            <span className="text-[11px] text-slate-400">Zero wait booking guarantee</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">Best Fare Assurance</span>
            <span className="text-[11px] text-slate-400">No hidden booking markups</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">Free Seat Selection</span>
            <span className="text-[11px] text-slate-400">Standard seats at ₹0 extra</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">24/7 Flight Alerts</span>
            <span className="text-[11px] text-slate-400">SMS & email gate updates</span>
          </div>
        </div>
      </section>

      {/* Advanced Filter Bar & Sorter */}
      <section className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* Airlines filter */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-400" /> Airlines:
          </span>
          {[
            { code: 'AI', name: 'Air India' },
            { code: '6E', name: 'IndiGo' },
            { code: 'SG', name: 'SpiceJet' },
            { code: 'QP', name: 'Akasa Air' },
            { code: 'UK', name: 'Vistara' },
          ].map((airline) => {
            const isSelected = selectedAirlines.includes(airline.code);
            return (
              <button
                key={airline.code}
                type="button"
                onClick={() => toggleAirline(airline.code)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {airline.name}
              </button>
            );
          })}
        </div>

        {/* Departure Time Slots */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold hidden md:inline">Time:</span>
          <select
            value={selectedTimeSlot}
            onChange={(e) => setSelectedTimeSlot(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Any Time</option>
            <option value="morning">Morning (06:00 - 12:00)</option>
            <option value="afternoon">Afternoon (12:00 - 18:00)</option>
            <option value="evening">Evening (18:00 - 24:00)</option>
          </select>

          {/* Sorter */}
          <div className="flex items-center gap-1.5 ml-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="time-asc">Earliest Departure</option>
              <option value="seats-desc">Most Seats Available</option>
            </select>
          </div>
        </div>
      </section>

      {/* Round-Trip Leg Switcher Tabs (Only in Round-Trip Mode) */}
      {tripType === 'roundtrip' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveLeg('outbound')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeLeg === 'outbound'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-blue-300" />
                <span>1. Outbound Flight</span>
                {selectedOutboundFlight && (
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                    {selectedOutboundFlight.flightNumber}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveLeg('inbound')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeLeg === 'inbound'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-indigo-300 rotate-180" />
                <span>2. Return Flight</span>
                {selectedReturnFlight && (
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                    {selectedReturnFlight.flightNumber}
                  </span>
                )}
              </button>
            </div>

            {/* Selected Round-Trip Overview & Action */}
            {(selectedOutboundFlight || selectedReturnFlight) && (
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[11px]">Combined Round-Trip:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    ₹{(
                      (selectedOutboundFlight ? Number(selectedOutboundFlight.price) : 0) +
                      (selectedReturnFlight ? Number(selectedReturnFlight.price) : 0)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const primaryFlight = selectedOutboundFlight || selectedReturnFlight;
                    const combinedPrice = (
                      (selectedOutboundFlight ? Number(selectedOutboundFlight.price) : 0) +
                      (selectedReturnFlight ? Number(selectedReturnFlight.price) : 0)
                    );
                    setSelectedFlightForBooking({
                      ...primaryFlight,
                      price: combinedPrice,
                      isRoundTrip: true,
                      outboundFlight: selectedOutboundFlight,
                      returnFlight: selectedReturnFlight,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Book Both Flights
                </button>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            {activeLeg === 'outbound'
              ? 'Showing departure flight options. Select your preferred outbound journey.'
              : 'Showing return flight options matching your destination back to origin.'}
          </p>
        </div>
      )}

      {/* Flight Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {tripType === 'roundtrip' 
            ? (activeLeg === 'outbound' ? 'Select Outbound Flight' : 'Select Return Flight')
            : 'Available Flight Routes'}
          <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {(activeLeg === 'outbound' ? sortedFlights : sortedReturnFlights).length} flights available
          </span>
        </h2>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">{error}</p>
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
      {!loading && !error && (activeLeg === 'outbound' ? sortedFlights : sortedReturnFlights).length > 0 && (
        <div className="space-y-4">
          {(activeLeg === 'outbound' ? sortedFlights : sortedReturnFlights).map((flight) => {
            const isSelectedOutbound = selectedOutboundFlight?.id === flight.id;
            const isSelectedReturn = selectedReturnFlight?.id === flight.id;

            return (
              <div key={flight.id} className="relative">
                <FlightCard
                  flight={flight}
                  airportsMap={airportsMap}
                  citiesMap={citiesMap}
                  onSelect={(selected) => {
                    if (tripType === 'roundtrip') {
                      if (activeLeg === 'outbound') {
                        setSelectedOutboundFlight(selected);
                        setActiveLeg('inbound');
                      } else {
                        setSelectedReturnFlight(selected);
                      }
                    } else {
                      setSelectedFlightForBooking(selected);
                    }
                  }}
                />
                {tripType === 'roundtrip' && (isSelectedOutbound || isSelectedReturn) && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isSelectedOutbound ? 'Selected Outbound' : 'Selected Return'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedFlights.length === 0 && (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Plane className="w-8 h-8 opacity-40 rotate-45" />
          </div>
          <h3 className="text-lg font-bold text-white">No Flights Found For This Itinerary</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your travel date, resetting your price filter, or selecting different departure/arrival cities.
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

      {/* Digital Boarding Pass & Confirmation Modal */}
      {confirmedBooking && (
        <BookingConfirmationModal
          booking={confirmedBooking.booking}
          flight={confirmedBooking.flight}
          airportsMap={airportsMap}
          citiesMap={citiesMap}
          onClose={() => setConfirmedBooking(null)}
        />
      )}
    </div>
  );
};

export default FlightSearch;

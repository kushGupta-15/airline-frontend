import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plane, Search, ShieldCheck, Zap, ArrowRight, RefreshCw, 
  Sparkles, Award, Clock, Compass, HeartHandshake, Tag
} from 'lucide-react';
import { flightApi } from '../api/client';

export const HomePage = () => {
  const [featuredFlights, setFeaturedFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        const res = await flightApi.getFlights();
        if (res.data?.success) {
          setFeaturedFlights(res.data.data.slice(0, 3));
        }
      } catch (err) {
        setError('Unable to load flight recommendations right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, []);

  return (
    <div className="space-y-12 pb-12">
      
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 border border-blue-500/20 p-8 sm:p-14 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Voted India's Leading Modern Airline Experience
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Elevate Your Journey with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">SkyFlow Airlines</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Experience unparalleled hospitality, punctuality, and seamless flight bookings across India's top metropolitan destinations. Free seat choice and instant digital boarding passes on every trip.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <Search className="w-4 h-4" /> Book Flights Now
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition-all"
            >
              <Award className="w-4 h-4 text-blue-400" /> Join SkyClub
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Special Offers Banner */}
      <section className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-blue-950/70 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Get ₹500 Off Your First Booking</h3>
            <p className="text-xs text-slate-400">Use promo code <span className="font-mono font-bold text-indigo-300">SKYFIRST</span> at checkout on all domestic flights.</p>
          </div>
        </div>
        <Link
          to="/search"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shrink-0"
        >
          Redeem Offer
        </Link>
      </section>

      {/* Customer Value Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">98.4% On-Time Punctuality</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We value your time. Enjoy industry-leading departure reliability and guaranteed non-stop routes between major hubs.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Guaranteed Best Fares</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Transparent pricing with zero hidden convenience fees. What you see is exactly what you pay at checkout.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Flexible Date Changes</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Plans change? Reschedule your flights effortlessly with free date modifications up to 24 hours before takeoff.
          </p>
        </div>
      </section>

      {/* Featured Flights Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Popular Non-Stop Flight Routes</h2>
            <p className="text-xs text-slate-400">Explore top daily departures from Delhi, Mumbai, and Bengaluru</p>
          </div>
          <Link
            to="/search"
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors"
          >
            View All Routes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
            Fetching today's featured flights...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            {error}
          </div>
        ) : featuredFlights.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
            Check our flight search page for the complete schedule.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredFlights.map((flight) => (
              <div
                key={flight.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {flight.flightNumber}
                  </span>
                  <span className="text-xs font-medium text-emerald-400">
                    {flight.totalSeats} seats available
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-300 py-2 border-y border-slate-800/80">
                  <span className="font-semibold text-white">Origin</span>
                  <Plane className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-semibold text-white">Destination</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs text-slate-400 block">Fares from</span>
                    <span className="text-base font-black text-white">₹{Number(flight.price).toLocaleString('en-IN')}</span>
                  </div>
                  <Link
                    to="/search"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Select
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default HomePage;

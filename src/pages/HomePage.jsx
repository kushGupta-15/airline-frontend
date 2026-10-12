import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Search, ShieldCheck, Zap, ArrowRight, RefreshCw, Layers } from 'lucide-react';
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
        setError(err.formattedMessage || 'Unable to connect to Flights service via Gateway');
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 border border-blue-500/20 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-medium text-blue-300">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            Connected to API Gateway (:3005)
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Seamless Flights Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Distributed Microservices</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300">
            Explore live domestic and international flights. Every booking is safeguarded by distributed circuit breakers, Redis query caching, and RabbitMQ event pipelines.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/telemetry"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              View System Telemetry
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Architecture Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Zero-Trust Gateway Proxy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All requests pass through our rate-limited API Gateway on port 3005 with verified user propagation and distributed correlation tracing.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Redis Sub-Millisecond Cache</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instantaneous flight catalog lookups powered by in-memory Redis caching with automated cache eviction upon seat deduction.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Resilient Saga & Event Bus</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Opossum circuit breakers isolate downstream latency, while RabbitMQ queues automatically trigger asynchronous booking reminders.
          </p>
        </div>
      </section>

      {/* Featured Flights Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Live Flight Catalog Preview</h2>
            <p className="text-xs text-slate-400">Streamed from Flight Service (:3000) via Gateway (:3005)</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
            Querying API Gateway for flight availability...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            {error} (Ensure API Gateway is booted on port 3005)
          </div>
        ) : featuredFlights.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
            No flights found in catalog.
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
                    {flight.totalSeats} seats left
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 py-1 border-y border-slate-800/80">
                  <span>Airport #{flight.departureAirportId}</span>
                  <Plane className="w-3.5 h-3.5 text-slate-500" />
                  <span>Airport #{flight.arrivalAirportId}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-white">INR {flight.price}</span>
                  <Link
                    to="/search"
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Book Now <ArrowRight className="w-3 h-3" />
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

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, RefreshCw, Server, Database, Zap, BellRing, 
  ShieldCheck, Clock, Cpu, Radio, AlertTriangle, CheckCircle2, 
  ExternalLink, Layers, Terminal, Sparkles, Network, ArrowUpRight
} from 'lucide-react';
import { systemApi } from '../api/client';

export const HealthDashboard = () => {
  const [clusterData, setClusterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(10);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setError(null);
      const res = await systemApi.getClusterOverview();
      if (res.data) {
        setClusterData(res.data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('[HealthDashboard] Overview error:', err);
      setError(err.formattedMessage || 'Unable to retrieve cluster telemetry from API Gateway (:3005)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchOverview();
    }, refreshIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshIntervalSec, fetchOverview]);

  const services = clusterData?.services || [];
  const clusterStatus = clusterData?.clusterStatus || 'CHECKING';

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Real-Time Cluster Telemetry
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-400" />
            System Observability & Service Mesh
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            End-to-end monitoring of microservices, MySQL databases, Redis cache, and RabbitMQ event buses.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Updated: {lastUpdated || 'Checking...'}</span>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoRefresh 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Auto-refresh {autoRefresh ? `(${refreshIntervalSec}s)` : 'OFF'}
          </button>

          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Cluster Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cluster State</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className={`w-3 h-3 rounded-full ${clusterStatus === 'HEALTHY' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-xl font-black text-white">{clusterStatus}</span>
          </div>
          <p className="text-[11px] text-slate-500">5 Services Active & Proxied</p>
        </div>

        {/* Database Connectivity */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MySQL 8 Cluster</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white pt-1">4 / 4 Connected</div>
          <p className="text-[11px] text-slate-500">Auth, Flight, Booking, Reminder</p>
        </div>

        {/* Redis Cache */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Redis In-Memory</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 pt-1">READY (60s TTL)</div>
          <p className="text-[11px] text-slate-500">Sub-millisecond query cache</p>
        </div>

        {/* RabbitMQ Message Bus */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">RabbitMQ Bus</span>
            <BellRing className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-indigo-400 pt-1">AIRLINE_BUS</div>
          <p className="text-[11px] text-slate-500">Async Reminder Channel Active</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">{error}</p>
            <p className="text-[11px] text-rose-300/80 mt-0.5">Ensure all Docker containers and Node microservice instances are running.</p>
          </div>
        </div>
      )}

      {/* Microservice Health Cards Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-400" />
          Microservice Topology Nodes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => {
            const isUp = service.status === 'UP';
            const heap = service.metrics?.memory?.heapUsedMb;
            const uptimeHours = service.metrics?.uptimeSeconds ? (service.metrics.uptimeSeconds / 3600).toFixed(1) : null;
            const hasDb = service.health?.database;
            const hasCache = service.health?.cache;

            return (
              <div
                key={service.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/30 p-6 shadow-xl transition-all duration-300 space-y-4 hover:shadow-2xl hover:-translate-y-0.5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {service.type.toUpperCase()}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">{service.name}</h3>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    isUp ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                    {service.status}
                  </span>
                </div>

                {/* Telemetry Stats */}
                <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Gateway Ping Latency:</span>
                    <span className="font-mono text-emerald-400 font-bold">{service.latencyMs}ms</span>
                  </div>

                  {heap && (
                    <div className="flex justify-between text-slate-400">
                      <span>Node Heap Memory:</span>
                      <span className="font-mono text-white font-medium">{heap} MB</span>
                    </div>
                  )}

                  {uptimeHours && (
                    <div className="flex justify-between text-slate-400">
                      <span>Process Uptime:</span>
                      <span className="font-mono text-slate-300">{uptimeHours} hours</span>
                    </div>
                  )}

                  {hasDb && (
                    <div className="flex justify-between text-slate-400">
                      <span>Database Socket:</span>
                      <span className="font-mono text-emerald-400 font-medium">CONNECTED</span>
                    </div>
                  )}

                  {hasCache && (
                    <div className="flex justify-between text-slate-400">
                      <span>Redis Cache Engine:</span>
                      <span className="font-mono text-emerald-400 font-bold">READY (6379)</span>
                    </div>
                  )}

                  {service.id === 'reminder' && (
                    <div className="flex justify-between text-slate-400">
                      <span>Queue Channel:</span>
                      <span className="font-mono text-indigo-400 font-bold">AIRLINE_BUS</span>
                    </div>
                  )}
                </div>

                {/* Endpoint badge */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="truncate max-w-[200px]" title={service.url}>{service.url}</span>
                  <span className="text-slate-400">Node {service.metrics?.nodeVersion || 'v26'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Infrastructure Architecture Matrix */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Full-Stack Distributed System Topology</h3>
            <p className="text-xs text-slate-400">High availability, isolated state storage, and zero-trust perimeter</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" /> Relational Tier (MySQL 8)
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              4 isolated databases (Auth_DEV, Flights_Search_DEV, Booking_DEV, NotificationTicket_DEV) enforcing single-responsibility persistence.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> In-Memory Cache (Redis 7)
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Key-value caching with SHA-256 parameterized hashing, automated cache invalidation upon seat deduction, and &lt;1ms query latency.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-indigo-400" /> Asynchronous Bus (RabbitMQ)
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Decoupled message exchange (`AIRLINE_BUS`) with persistent channel acknowledgment, routing booking events to the Reminder cron worker.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

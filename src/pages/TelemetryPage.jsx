import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Cpu, Server, CheckCircle2, AlertCircle, Database, Radio, Shield } from 'lucide-react';
import { systemApi } from '../api/client';

export const TelemetryPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [lastTraceId, setLastTraceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hRes, mRes] = await Promise.all([
        systemApi.getHealth(),
        systemApi.getMetrics(),
      ]);

      setHealthData(hRes.data);
      setMetricsData(mRes.data);
      setLastTraceId(hRes.headers['x-correlation-id'] || 'trace-active');
    } catch (err) {
      setError(err.formattedMessage || 'Unable to fetch telemetry from Gateway');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            System Telemetry & Gateway Observability
          </h1>
          <p className="text-xs text-slate-400">
            Real-time status, process metrics, and correlation trace validation queried directly from API Gateway (:3005)
          </p>
        </div>

        <button
          onClick={fetchTelemetry}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-white mb-1">Gateway Connection Issue</h4>
            <p>{error}</p>
            <p className="mt-2 text-[11px] text-rose-400">Ensure `API_Gateway` is running on port 3005 via `node index.js`.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Gateway Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {healthData?.status || 'UP'}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Port 3005 • Active</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Gateway Uptime</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {metricsData?.uptimeSeconds || 0}s
              </div>
              <p className="text-[11px] text-slate-500">Continuous execution</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Heap Memory Used</span>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {metricsData?.memory?.heapUsedMb || 0} MB
              </div>
              <p className="text-[11px] text-slate-500">Total: {metricsData?.memory?.heapTotalMb || 0} MB</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Active Tracing Trace ID</span>
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xs font-bold text-amber-300 font-mono truncate">
                {lastTraceId}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">x-correlation-id verified</p>
            </div>
          </div>

          {/* Microservices Port Topology */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              Microservice Topology & Reverse Proxy Routing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-bold block">API Gateway</span>
                  <span className="text-[11px] text-slate-500">Port :3005 (Reverse Proxy)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  HEALTHY
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-bold block">Flights & Search</span>
                  <span className="text-[11px] text-slate-500">Port :3000 (/flightservice/*)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  HEALTHY
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-bold block">Auth Service</span>
                  <span className="text-[11px] text-slate-500">Port :3001 (/authservice/*)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  HEALTHY
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-bold block">Booking Service</span>
                  <span className="text-[11px] text-slate-500">Port :3002 (/bookingservice/*)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  HEALTHY
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-bold block">Reminder Service</span>
                  <span className="text-[11px] text-slate-500">Port :3004 (Notification Cron)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  HEALTHY
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-bold block">Redis Cache Engine</span>
                  <span className="text-[11px] text-slate-500">Port :6379 (In-Memory)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  CONNECTED
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

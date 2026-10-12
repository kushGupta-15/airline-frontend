import React, { useState } from 'react';
import { Zap, Database, Copy, Check, Clock, Server } from 'lucide-react';

export const RedisCacheBadge = ({ cacheStatus, correlationId, responseTime, totalResults }) => {
  const [copied, setCopied] = useState(false);

  const isHit = cacheStatus === 'HIT';

  const copyCorrelationId = () => {
    if (correlationId) {
      navigator.clipboard.writeText(correlationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg text-xs backdrop-blur-md">
      {/* Redis Cache Status Indicator */}
      <div className="flex items-center gap-3">
        {isHit ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold shadow-sm shadow-emerald-500/10 animate-in fade-in duration-300">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/30 animate-pulse" />
            <span>Redis Cache HIT</span>
            <span className="hidden sm:inline text-[10px] text-emerald-300/80 font-normal border-l border-emerald-500/30 pl-2">
              Served from in-memory cache (&lt;2ms)
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-semibold shadow-sm shadow-blue-500/10 animate-in fade-in duration-300">
            <Database className="w-4 h-4 text-blue-400" />
            <span>MySQL DB Query (Cache MISS)</span>
            <span className="hidden sm:inline text-[10px] text-blue-300/80 font-normal border-l border-blue-500/30 pl-2">
              Cached to Redis (60s TTL)
            </span>
          </div>
        )}

        {responseTime && (
          <span className="inline-flex items-center gap-1 text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {responseTime}ms
          </span>
        )}

        {typeof totalResults === 'number' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 font-medium">
            {totalResults} {totalResults === 1 ? 'Flight' : 'Flights'}
          </span>
        )}
      </div>

      {/* Distributed Tracing Correlation ID */}
      {correlationId && (
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] ml-auto">
          <span className="hidden md:inline-flex items-center gap-1 text-slate-500">
            <Server className="w-3 h-3" />
            Trace:
          </span>
          <span className="px-2 py-1 rounded bg-slate-800/80 text-slate-300 truncate max-w-[140px] sm:max-w-[200px]" title={correlationId}>
            {correlationId}
          </span>
          <button
            onClick={copyCorrelationId}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Copy Correlation ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};

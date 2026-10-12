import React, { useState, useEffect } from 'react';
import { 
  Terminal, Activity, ChevronUp, ChevronDown, Copy, Check, 
  Trash2, Search, ArrowUpRight, ShieldCheck, Zap, Server, X 
} from 'lucide-react';
import { subscribeToTraces } from '../../api/client';

export const TraceInspector = () => {
  const [traces, setTraces] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrace, setSelectedTrace] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToTraces((newTraces) => {
      setTraces(newTraces);
    });
    return unsubscribe;
  }, []);

  const handleCopy = (id, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTraces = traces.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.id?.toLowerCase().includes(query) ||
      t.url?.toLowerCase().includes(query) ||
      t.method?.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (status >= 400 && status < 500) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'POST': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'PATCH': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'DELETE': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <aside 
      aria-label="Distributed Tracing Inspector"
      className="fixed bottom-0 right-0 z-40 max-w-full sm:max-w-2xl w-full p-2 sm:p-4 pointer-events-none"
    >
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl pointer-events-auto overflow-hidden transition-all duration-300">
        {/* Header Bar */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/40 select-none border-b border-slate-800/80"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">Distributed Tracing Inspector</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[10px] font-semibold">
                  {traces.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">x-correlation-id propagation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {traces.length > 0 && (
              <span className="text-[11px] font-mono text-emerald-400 hidden sm:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Trace: {traces[0].id.substring(0, 8)}...
              </span>
            )}
            <button className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Body */}
        {isOpen && (
          <div className="p-4 space-y-3 max-h-96 flex flex-col">
            {/* Search & Actions Bar */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by trace ID, URL path, or method..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {traces.length > 0 && (
                <button
                  onClick={() => setTraces([])}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Trace List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/50">
              {filteredTraces.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No network transactions recorded yet. Interact with the application to see distributed traces.
                </div>
              ) : (
                filteredTraces.map((trace) => (
                  <div
                    key={`${trace.id}-${trace.timestamp}`}
                    onClick={() => setSelectedTrace(trace)}
                    className="pt-2 pb-1.5 flex items-center justify-between gap-2 hover:bg-slate-800/40 p-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getMethodColor(trace.method)}`}>
                        {trace.method}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusColor(trace.status)}`}>
                        {trace.status}
                      </span>
                      <span className="text-xs text-slate-300 font-mono truncate max-w-[120px] sm:max-w-[200px]" title={trace.url}>
                        {trace.url}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {trace.cacheStatus && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          trace.cacheStatus === 'HIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {trace.cacheStatus}
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-slate-400">
                        {trace.duration}ms
                      </span>

                      <button
                        onClick={(e) => handleCopy(trace.id, e)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title={`Copy trace: ${trace.id}`}
                      >
                        {copiedId === trace.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Trace Details Modal */}
            {selectedTrace && (
              <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-white">Trace Transaction Details</span>
                  <button onClick={() => setSelectedTrace(null)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">x-correlation-id:</span>
                    <span className="text-blue-400 select-all">{selectedTrace.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Endpoint:</span>
                    <span className="text-slate-200">{selectedTrace.url}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Execution Latency:</span>
                    <span className="text-emerald-400">{selectedTrace.duration}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Redis Cache Header:</span>
                    <span className="text-slate-200">{selectedTrace.cacheStatus || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

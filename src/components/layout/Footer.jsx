import React from 'react';
import { Server, ShieldCheck, Database, Layers, Radio } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800 text-xs">
          <div>
            <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-400" />
              API Gateway
            </h4>
            <p className="text-slate-400">
              Single entry reverse proxy on port 3005 with rate-limiting, authentication guards, and distributed correlation tracking.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              Persistence & Caching
            </h4>
            <p className="text-slate-400">
              MySQL 8 clustered databases with Redis sub-millisecond query caching and smart catalog invalidation.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-amber-400" />
              Event Bus
            </h4>
            <p className="text-slate-400">
              RabbitMQ message broker dispatching asynchronous booking confirmation events to the Reminder notification workers.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Resilience & Saga
            </h4>
            <p className="text-slate-400">
              Opossum circuit breakers, automated 3000ms timeouts, and compensating rollbacks preventing cascading failures.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 SkyFlow Airlines Platform. Built on Microservice Architecture.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono text-[11px]">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Gateway :3005</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Redis :6379</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> RabbitMQ :5672</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

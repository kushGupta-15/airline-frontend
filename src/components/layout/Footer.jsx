import React from 'react';
import { Plane, ShieldCheck, Headphones, CreditCard, Award, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Secure Checkout</h4>
              <p className="text-xs text-slate-400">256-Bit SSL Bank-Grade Encryption</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">24/7 Priority Support</h4>
              <p className="text-xs text-slate-400">Dedicated assistance for all travelers</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Best Fare Guarantee</h4>
              <p className="text-xs text-slate-400">Direct airline partner rates & rewards</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Instant E-Ticket Delivery</h4>
              <p className="text-xs text-slate-400">Confirmed seats & live SMS updates</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
          <div>
            <h5 className="font-bold text-white text-sm mb-3">Popular Routes</h5>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Delhi to Mumbai Flights</Link></li>
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Delhi to Bengaluru Flights</Link></li>
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Mumbai to Kolkata Flights</Link></li>
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Bengaluru to Chennai Flights</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-sm mb-3">Partner Airlines</h5>
            <ul className="space-y-2 text-slate-400">
              <li><span className="hover:text-white transition-colors">Air India (AI)</span></li>
              <li><span className="hover:text-white transition-colors">IndiGo (6E)</span></li>
              <li><span className="hover:text-white transition-colors">SpiceJet (SG)</span></li>
              <li><span className="hover:text-white transition-colors">Akasa Air (QP)</span></li>
              <li><span className="hover:text-white transition-colors">Vistara (UK)</span></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-sm mb-3">Passenger Services</h5>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/bookings" className="hover:text-blue-400 transition-colors">View My Trips & Boarding Pass</Link></li>
              <li><span className="hover:text-white transition-colors">Baggage Allowance Policy</span></li>
              <li><span className="hover:text-white transition-colors">Refunds & Cancellations</span></li>
              <li><span className="hover:text-white transition-colors">Special Assistance</span></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-sm mb-3">About SkyFlow</h5>
            <p className="text-slate-400 leading-relaxed mb-3">
              SkyFlow Airlines is an industry-leading flight reservation portal connecting millions of passengers across premier domestic and global destinations.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>IATA Accredited</span> • <span>PCI-DSS Level 1</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 SkyFlow Airlines Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Carriage</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Cookie Preferences</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

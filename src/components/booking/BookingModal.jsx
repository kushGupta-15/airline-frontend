import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Armchair, Plus, Minus, ShieldCheck, 
  AlertCircle, Sparkles, Loader2, User, Mail, Phone,
  CreditCard, CheckCircle2, Lock, UtensilsCrossed, Users, Tag,
  Luggage, Shield, Percent, Gift
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingApi } from '../../api/client';
import { SeatMapModal } from './SeatMapModal';

export const BookingModal = ({ flight, airportsMap = {}, citiesMap = {}, onClose, onBookingSuccess }) => {
  const { isAuthenticated, userEmail } = useAuth();
  const navigate = useNavigate();

  const [noOfSeats, setNoOfSeats] = useState(1);
  const [passengers, setPassengers] = useState([
    {
      id: 1,
      title: 'Mr',
      name: '',
      category: 'Adult',
      seatPreference: 'Window',
      mealPreference: 'Standard Snack',
      assignedSeat: null,
      seatClass: null,
      seatType: null,
    }
  ]);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [seatMapActiveIdx, setSeatMapActiveIdx] = useState(0);
  const [passengerEmail, setPassengerEmail] = useState(userEmail || '');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // card | upi | netbanking
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ancillary Add-ons state
  const [baggageTier, setBaggageTier] = useState('cabin'); // cabin | checkin15 | heavy25
  const [travelInsurance, setTravelInsurance] = useState(false); // 299 per passenger
  const [priorityPass, setPriorityPass] = useState(false); // 350 per passenger

  // Promo Code Engine state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState(null);

  if (!flight) return null;

  const maxSeats = Math.min(flight.totalSeats || 1, 9);
  const basePrice = Number(flight.price) || 0;
  const subtotalAirfare = basePrice * noOfSeats;
  const taxesAndFees = Math.round(subtotalAirfare * 0.12);

  const baggageCosts = {
    cabin: 0,
    checkin15: 850,
    heavy25: 1450
  };
  const baggageTotal = (baggageCosts[baggageTier] || 0) * noOfSeats;
  const insuranceTotal = travelInsurance ? 299 * noOfSeats : 0;
  const priorityTotal = priorityPass ? 350 * noOfSeats : 0;
  const ancillariesTotal = baggageTotal + insuranceTotal + priorityTotal;

  // Discount computation
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.code === 'SKYFLOW10') {
      discountAmount = Math.round(subtotalAirfare * 0.10);
    } else if (appliedPromo.code === 'FLYFIRST') {
      discountAmount = Math.min(500, subtotalAirfare);
    } else if (appliedPromo.code === 'SUMMER2026') {
      discountAmount = Math.round(subtotalAirfare * 0.15);
    }
  }

  const totalPayable = Math.max(0, subtotalAirfare + taxesAndFees + ancillariesTotal - discountAmount);

  const depAirport = airportsMap[flight.departureAirportId] || {};
  const arrAirport = airportsMap[flight.arrivalAirportId] || {};
  const depCity = citiesMap[depAirport.cityId]?.name || 'Origin';
  const arrCity = citiesMap[arrAirport.cityId]?.name || 'Destination';

  const depCode = depAirport.name?.match(/\(([A-Z]{3})\)/)?.[1] || 'DEP';
  const arrCode = arrAirport.name?.match(/\(([A-Z]{3})\)/)?.[1] || 'ARR';

  const handleSeatChange = (delta) => {
    const next = noOfSeats + delta;
    if (next >= 1 && next <= maxSeats) {
      setNoOfSeats(next);
      setError(null);
      if (next > passengers.length) {
        const added = [];
        for (let i = passengers.length + 1; i <= next; i++) {
          added.push({
            id: i,
            title: i % 2 === 0 ? 'Ms' : 'Mr',
            name: '',
            category: 'Adult',
            seatPreference: i % 3 === 1 ? 'Window' : (i % 3 === 2 ? 'Aisle' : 'Extra Legroom'),
            mealPreference: 'Standard Snack',
            assignedSeat: null,
            seatClass: null,
            seatType: null,
          });
        }
        setPassengers([...passengers, ...added]);
      } else if (next < passengers.length) {
        setPassengers(passengers.slice(0, next));
      }
    }
  };

  const handleOpenSeatMap = (passengerIdx = 0) => {
    setSeatMapActiveIdx(passengerIdx);
    setShowSeatMap(true);
  };

  const handleSaveSeatsFromMap = (updatedPassengers) => {
    setPassengers(updatedPassengers);
  };

  const updatePassenger = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      setError('Please sign in to complete your flight booking.');
      return;
    }

    // Validate that every passenger has a valid full legal name
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name || !passengers[i].name.trim()) {
        setError(`Please enter the full legal name for Passenger #${i + 1}.`);
        return;
      }
    }

    if (!passengerEmail || !passengerEmail.trim()) {
      setError('Please provide an email address for e-ticket delivery.');
      return;
    }

    if (noOfSeats > (flight.totalSeats || 0)) {
      setError(`Cannot reserve ${noOfSeats} seats. Only ${flight.totalSeats} seats remaining.`);
      return;
    }

    setLoading(true);

    try {
      // Auto-assign seats for any passenger who didn't explicitly pick one
      const assignedCols = ['A', 'B', 'C', 'D', 'E', 'F'];
      const usedSeats = new Set(passengers.filter(p => p.assignedSeat).map(p => p.assignedSeat));
      let fallbackRow = 14;
      let colIdx = 0;

      const finalizedPassengers = passengers.map((p, idx) => {
        if (p.assignedSeat) return p;
        
        while (usedSeats.has(`${fallbackRow}${assignedCols[colIdx]}`)) {
          colIdx++;
          if (colIdx >= assignedCols.length) {
            colIdx = 0;
            fallbackRow++;
          }
        }
        const generatedSeat = `${fallbackRow}${assignedCols[colIdx]}`;
        usedSeats.add(generatedSeat);
        const isWin = assignedCols[colIdx] === 'A' || assignedCols[colIdx] === 'F';
        const isAisle = assignedCols[colIdx] === 'C' || assignedCols[colIdx] === 'D';

        colIdx++;
        if (colIdx >= assignedCols.length) {
          colIdx = 0;
          fallbackRow++;
        }

        return {
          ...p,
          assignedSeat: generatedSeat,
          seatClass: 'Economy',
          seatType: isWin ? 'Window' : (isAisle ? 'Aisle' : 'Middle')
        };
      });

      const payload = {
        flightId: flight.id,
        noOfSeats: Number(noOfSeats),
        userEmail: passengerEmail || userEmail || 'passenger@skyflow.com',
      };

      const response = await bookingApi.createBooking(payload);

      if (response.data?.success) {
        const bookingResult = response.data.data;
        
        // Persist complete passenger manifest to localStorage for local retrieval & offline boarding pass viewing
        try {
          localStorage.setItem(`skyflow_booking_${bookingResult.id}`, JSON.stringify({
            bookingId: bookingResult.id,
            flightId: flight.id,
            noOfSeats: Number(noOfSeats),
            passengers: finalizedPassengers,
            primaryEmail: passengerEmail,
            primaryPhone: passengerPhone,
            totalCost: bookingResult.totalCost || totalPayable,
            flightNumber: flight.flightNumber,
            timestamp: new Date().toISOString()
          }));
        } catch (storageErr) {
          console.warn('[BookingModal] LocalStorage caching omitted:', storageErr);
        }

        onBookingSuccess(bookingResult, {
          ...flight,
          passengers: finalizedPassengers,
          passengerName: `${finalizedPassengers[0].title} ${finalizedPassengers[0].name}`,
          seatPreference: finalizedPassengers[0].assignedSeat,
        });
      } else {
        setError(response.data?.message || 'Failed to complete reservation. Please retry.');
      }
    } catch (err) {
      console.error('[BookingModal] Booking failed:', err);
      setError(err.formattedMessage || 'Unable to reserve seats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Instant Seat Reservation & E-Ticket
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Confirm Booking • {flight.flightNumber}
          </h2>
          <p className="text-xs text-slate-400">
            {depCity} ({depCode}) ➔ {arrCity} ({arrCode})
          </p>
        </div>

        {/* Flight Snapshot Pill */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block">Departure Schedule</span>
            <p className="font-bold text-white text-sm mt-0.5">
              {flight.departureTime ? new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>
          <div className="text-center">
            <span className="text-slate-400 block">Assigned Gate</span>
            <p className="font-bold text-blue-400 text-sm mt-0.5">
              {flight.boardingGate || 'Gate Assigned at Check-in'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Available Seats</span>
            <p className={`font-bold text-sm mt-0.5 ${flight.totalSeats < 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {flight.totalSeats} seats
            </p>
          </div>
        </div>

        {/* Sign In Required Notice */}
        {!isAuthenticated && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>You must be signed in to confirm passenger reservations.</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              Sign In to Book
            </button>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmitBooking} className="space-y-6">
          
          {/* Seat Quantity Controller */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Armchair className="w-3.5 h-3.5 text-blue-400" /> Number of Passengers / Seats
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select traveler count to input individual passenger details.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSeatChange(-1)}
                disabled={noOfSeats <= 1}
                className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="text-center min-w-[70px]">
                <span className="text-2xl font-black text-white font-mono">{noOfSeats}</span>
                <span className="block text-[10px] text-slate-400">
                  {noOfSeats === 1 ? 'Passenger' : 'Passengers'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSeatChange(1)}
                disabled={noOfSeats >= maxSeats}
                className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Multi-Passenger Information Forms */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  Passenger Manifest ({noOfSeats} {noOfSeats === 1 ? 'Traveler' : 'Travelers'})
                </h4>
                <span className="text-[11px] text-slate-500">
                  Names must match official Government Photo ID
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenSeatMap(0)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition-all shadow-sm"
              >
                <Armchair className="w-3.5 h-3.5 text-blue-400" />
                Select Seats on 2D Cabin Map
              </button>
            </div>

            <div className="space-y-3">
              {passengers.map((p, index) => (
                <div 
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3 transition-all"
                >
                  {/* Passenger Card Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 text-xs font-mono font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        Passenger {index + 1} {index === 0 ? '(Primary / Lead)' : '(Co-Traveler)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Lead Traveler
                        </span>
                      )}
                      <select
                        value={p.category}
                        onChange={(e) => updatePassenger(index, 'category', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
                      >
                        <option value="Adult">Adult (12+ yrs)</option>
                        <option value="Child">Child (2-11 yrs)</option>
                        <option value="Infant">Infant (Under 2)</option>
                      </select>
                    </div>
                  </div>

                  {/* Title & Full Name Input */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3 sm:col-span-2 space-y-1">
                      <label className="text-[11px] text-slate-300">Title</label>
                      <select
                        value={p.title}
                        onChange={(e) => updatePassenger(index, 'title', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Mr">Mr</option>
                        <option value="Ms">Ms</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Dr">Dr</option>
                        <option value="Master">Mstr</option>
                      </select>
                    </div>

                    <div className="col-span-9 sm:col-span-10 space-y-1">
                      <label className="text-[11px] text-slate-300 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> Full Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={index === 0 ? "e.g. Kush Gupta" : `e.g. Passenger ${index + 1} Name`}
                        value={p.name}
                        onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Allocated 2D Cabin Seat & Meal Options */}
                  <div className="pt-2 border-t border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Armchair className="w-4 h-4 text-blue-400" />
                      <span className="text-[11px] text-slate-300 font-medium">Cabin Seat:</span>
                      {p.assignedSeat ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Seat {p.assignedSeat} ({p.seatClass || 'Economy'} • {p.seatType || 'Assigned'})
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400/90 italic">
                          Not selected (Will be auto-assigned)
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenSeatMap(index)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
                    >
                      <Armchair className="w-3.5 h-3.5" />
                      {p.assignedSeat ? 'Change Seat on Map' : 'Select Seat on 2D Map'}
                    </button>
                  </div>

                  {/* Meal Options for This Specific Passenger */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] text-slate-400 flex items-center gap-1">
                      <UtensilsCrossed className="w-3 h-3 text-slate-400" /> In-Flight Meal / Refreshment
                    </label>
                    <select
                      value={p.mealPreference}
                      onChange={(e) => updatePassenger(index, 'mealPreference', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="Standard Snack">Standard Snack & Beverages (Complimentary)</option>
                      <option value="Vegetarian Meal">Vegetarian Warm Meal (Special Request)</option>
                      <option value="Diabetic / Healthy">Diabetic & Low Sodium Meal</option>
                      <option value="No Meal">No In-Flight Refreshment</option>
                    </select>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Ancillary Baggage & Travel Protection Options */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Luggage className="w-3.5 h-3.5 text-blue-400" />
                Baggage Allowance & Travel Protection
              </h4>
              <span className="text-[11px] text-emerald-400 font-semibold">
                Flexible Add-Ons
              </span>
            </div>

            {/* Baggage Selection Grid */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium">Baggage Options (Per Passenger):</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'cabin', title: 'Cabin Only (7kg)', fee: 'Included (Free)' },
                  { id: 'checkin15', title: 'Check-in (15kg)', fee: '+₹850/seat' },
                  { id: 'heavy25', title: 'Heavy Load (25kg)', fee: '+₹1,450/seat' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setBaggageTier(tier.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      baggageTier === tier.id
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs">{tier.title}</div>
                    <div className="text-[10px] text-blue-400 mt-0.5">{tier.fee}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Protection Add-ons (Checkboxes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                travelInsurance 
                  ? 'bg-blue-600/15 border-blue-500 text-white' 
                  : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
              }`}>
                <input
                  type="checkbox"
                  checked={travelInsurance}
                  onChange={(e) => setTravelInsurance(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-white flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    SkyAssure Travel Insurance
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Medical & trip delay protection (+₹299/seat)
                  </p>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                priorityPass 
                  ? 'bg-blue-600/15 border-blue-500 text-white' 
                  : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
              }`}>
                <input
                  type="checkbox"
                  checked={priorityPass}
                  onChange={(e) => setPriorityPass(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Priority Check-in & Fast Baggage
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Dedicated desk & priority baggage drop (+₹350/seat)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Contact Coordinates (Primary Delivery) */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              E-Ticket Delivery & Travel Alerts
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center gap-1">
                  E-Ticket Recipient Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="passenger@domain.com"
                  value={passengerEmail}
                  onChange={(e) => setPassengerEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Mobile (Flight SMS Alerts)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Boarding passes, PNR reference, and live gate change notifications will be transmitted to these coordinates.
            </p>
          </div>

          {/* Promo Discount Engine */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-400" />
                Promo Code & Airline Vouchers
              </h4>
              <span className="text-[10px] text-slate-500">Tap below to auto-apply</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter code (e.g. SKYFLOW10)"
                  value={promoCodeInput}
                  onChange={(e) => {
                    setPromoCodeInput(e.target.value.toUpperCase());
                    setPromoError(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white uppercase placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setPromoError(null);
                  const code = promoCodeInput.trim().toUpperCase();
                  if (!code) return;
                  if (code === 'SKYFLOW10') {
                    setAppliedPromo({ code: 'SKYFLOW10', description: '10% instant discount on total airfare' });
                    setPromoCodeInput('');
                  } else if (code === 'FLYFIRST') {
                    setAppliedPromo({ code: 'FLYFIRST', description: 'Flat ₹500 off promotional savings' });
                    setPromoCodeInput('');
                  } else if (code === 'SUMMER2026') {
                    setAppliedPromo({ code: 'SUMMER2026', description: '15% Seasonal Summer promo savings' });
                    setPromoCodeInput('');
                  } else {
                    setPromoError('Invalid coupon code. Try SKYFLOW10, FLYFIRST, or SUMMER2026.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-md"
              >
                Apply
              </button>
            </div>

            {/* Quick Promo Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { code: 'SKYFLOW10', desc: '10% Off' },
                { code: 'FLYFIRST', desc: 'Flat ₹500 Off' },
                { code: 'SUMMER2026', desc: '15% Off' }
              ].map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => {
                    setPromoCodeInput(p.code);
                    setPromoError(null);
                    if (p.code === 'SKYFLOW10') {
                      setAppliedPromo({ code: 'SKYFLOW10', description: '10% instant discount on total airfare' });
                    } else if (p.code === 'FLYFIRST') {
                      setAppliedPromo({ code: 'FLYFIRST', description: 'Flat ₹500 off promotional savings' });
                    } else if (p.code === 'SUMMER2026') {
                      setAppliedPromo({ code: 'SUMMER2026', description: '15% Seasonal Summer promo savings' });
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-all ${
                    appliedPromo?.code === p.code
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                  }`}
                >
                  {p.code} ({p.desc})
                </button>
              ))}
            </div>

            {/* Applied Promo Success or Error Alert */}
            {appliedPromo && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{appliedPromo.code} applied! {appliedPromo.description}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedPromo(null)}
                  className="text-[10px] text-slate-400 hover:text-white underline ml-2"
                >
                  Remove
                </button>
              </div>
            )}
            {promoError && (
              <div className="text-[11px] text-red-400 font-medium">
                {promoError}
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Payment Method
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'card', label: 'Credit / Debit Card' },
                { id: 'upi', label: 'UPI / QR Code' },
                { id: 'netbanking', label: 'Net Banking' },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                    paymentMethod === method.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Base Airfare (₹{basePrice.toLocaleString('en-IN')} × {noOfSeats} {noOfSeats === 1 ? 'ticket' : 'tickets'}):</span>
              <span className="font-mono text-slate-200">₹{subtotalAirfare.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Aviation Security & Taxes (12%):</span>
              <span className="font-mono text-slate-200">₹{taxesAndFees.toLocaleString('en-IN')}</span>
            </div>
            {ancillariesTotal > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Add-ons (Baggage & Protection):</span>
                <span className="font-mono text-slate-200">+₹{ancillariesTotal.toLocaleString('en-IN')}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Promo Discount ({appliedPromo?.code}):</span>
                <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm text-white">
              <span>Total Amount Payable:</span>
              <span className="text-emerald-400 text-base font-black">₹{totalPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading || !isAuthenticated}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming Passenger Reservation...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Pay ₹{totalPayable.toLocaleString('en-IN')} & Issue {noOfSeats} {noOfSeats === 1 ? 'Ticket' : 'Tickets'}
              </>
            )}
          </button>
        </form>

      </div>

      {/* Interactive 2D Aircraft Cabin Seat Map Modal */}
      {showSeatMap && (
        <SeatMapModal
          flight={flight}
          passengers={passengers}
          initialActiveIndex={seatMapActiveIdx}
          onSaveSeats={handleSaveSeatsFromMap}
          onClose={() => setShowSeatMap(false)}
        />
      )}
    </div>
  );
};

export default BookingModal;

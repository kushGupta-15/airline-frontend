import React, { useState, useMemo } from 'react';
import { 
  X, Check, Armchair, Plane, Sparkles, AlertCircle, 
  Lock, Crown, DoorOpen, Users, Compass, ChevronRight, CheckCircle2
} from 'lucide-react';

export const SeatMapModal = ({ 
  flight, 
  passengers = [], 
  onSaveSeats, 
  onClose,
  initialActiveIndex = 0 
}) => {
  const [activePassengerIdx, setActivePassengerIdx] = useState(initialActiveIndex);
  
  // Clone passengers array to local state
  const [currentPassengers, setCurrentPassengers] = useState(() => {
    return passengers.map(p => ({ ...p }));
  });

  // Deterministically compute occupied seats based on flight ID so it's consistent
  const occupiedSeats = useMemo(() => {
    const flightIdNum = Number(flight?.id) || 1;
    const occupied = new Set();
    const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    // Seeded pseudo-random occupancy pattern
    for (let r = 1; r <= 24; r++) {
      cols.forEach((c, cIdx) => {
        const hash = (r * 17 + cIdx * 31 + flightIdNum * 43) % 100;
        // Business rows (1-3) 40% occupancy, Exit rows (12-13) 30% occupancy, Economy 45% occupancy
        const threshold = r <= 3 ? 40 : (r === 12 || r === 13 ? 30 : 45);
        if (hash < threshold) {
          occupied.add(`${r}${c}`);
        }
      });
    }
    return occupied;
  }, [flight?.id]);

  // Map of seatId -> passenger object
  const assignedSeatMap = useMemo(() => {
    const map = {};
    currentPassengers.forEach((p, idx) => {
      if (p.assignedSeat) {
        map[p.assignedSeat] = { ...p, index: idx };
      }
    });
    return map;
  }, [currentPassengers]);

  const activePassenger = currentPassengers[activePassengerIdx] || currentPassengers[0];

  const handleSeatClick = (seatCode, seatClass, seatType) => {
    if (occupiedSeats.has(seatCode)) return;

    // Check if another passenger in our party already has this seat
    const existingOwner = assignedSeatMap[seatCode];

    setCurrentPassengers(prev => {
      const next = [...prev];
      
      // If clicking already selected seat of active passenger, deselect it
      if (next[activePassengerIdx]?.assignedSeat === seatCode) {
        next[activePassengerIdx] = {
          ...next[activePassengerIdx],
          assignedSeat: null,
          seatClass: null,
          seatType: null
        };
        return next;
      }

      // If seat belongs to another passenger in party, clear their assignment first
      if (existingOwner && existingOwner.index !== activePassengerIdx) {
        next[existingOwner.index] = {
          ...next[existingOwner.index],
          assignedSeat: null,
          seatClass: null,
          seatType: null
        };
      }

      // Assign to active passenger
      next[activePassengerIdx] = {
        ...next[activePassengerIdx],
        assignedSeat: seatCode,
        seatClass: seatClass,
        seatType: seatType
      };

      return next;
    });

    // Auto-advance to next passenger without a seat
    const nextUnassignedIdx = currentPassengers.findIndex(
      (p, idx) => idx !== activePassengerIdx && !p.assignedSeat
    );
    if (nextUnassignedIdx !== -1) {
      setActivePassengerIdx(nextUnassignedIdx);
    }
  };

  const handleAutoAssign = () => {
    const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
    setCurrentPassengers(prev => {
      const next = [...prev];
      let pIdx = 0;
      
      for (let r = 4; r <= 24; r++) {
        for (const c of cols) {
          if (pIdx >= next.length) break;
          const seatCode = `${r}${c}`;
          if (!occupiedSeats.has(seatCode) && !next.some(p => p.assignedSeat === seatCode)) {
            if (!next[pIdx].assignedSeat) {
              const isWindow = c === 'A' || c === 'F';
              const isAisle = c === 'C' || c === 'D';
              next[pIdx] = {
                ...next[pIdx],
                assignedSeat: seatCode,
                seatClass: 'Economy',
                seatType: isWindow ? 'Window' : (isAisle ? 'Aisle' : 'Middle')
              };
            }
            pIdx++;
          }
        }
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onSaveSeats(currentPassengers);
    onClose();
  };

  // Render individual seat item
  const renderSeat = (row, col, isBusiness = false) => {
    const seatCode = `${row}${col}`;
    const isOccupied = occupiedSeats.has(seatCode);
    const assignedInfo = assignedSeatMap[seatCode];
    const isAssignedToActive = assignedInfo && assignedInfo.index === activePassengerIdx;
    const isAssignedToOther = assignedInfo && assignedInfo.index !== activePassengerIdx;
    const isExitRow = row === 12 || row === 13;
    const isWindow = col === 'A' || col === 'F';
    const isAisle = isBusiness ? (col === 'C' || col === 'D') : (col === 'C' || col === 'D');
    const seatType = isWindow ? 'Window' : (isAisle ? 'Aisle' : 'Middle');
    const seatClass = isBusiness ? 'Business' : 'Economy';

    let seatClasses = "relative w-8 h-9 sm:w-9 sm:h-10 rounded-lg flex flex-col items-center justify-center font-mono text-[10px] font-bold transition-all duration-150 select-none ";

    if (isOccupied) {
      seatClasses += "bg-slate-800/60 border border-slate-700/40 text-slate-600 cursor-not-allowed opacity-50";
    } else if (isAssignedToActive) {
      seatClasses += "bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white text-white shadow-lg shadow-blue-500/30 scale-105 z-10 animate-in zoom-in-95";
    } else if (isAssignedToOther) {
      seatClasses += "bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-white text-white shadow-md shadow-emerald-500/20 scale-100";
    } else if (isBusiness) {
      seatClasses += "bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400 cursor-pointer hover:scale-105";
    } else if (isExitRow) {
      seatClasses += "bg-sky-500/10 border border-sky-400/40 text-sky-300 hover:bg-sky-500/25 hover:border-sky-300 cursor-pointer hover:scale-105";
    } else {
      seatClasses += "bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-blue-600/30 hover:border-blue-400 hover:text-white cursor-pointer hover:scale-105";
    }

    return (
      <button
        key={seatCode}
        type="button"
        disabled={isOccupied}
        onClick={() => handleSeatClick(seatCode, seatClass, seatType)}
        title={
          isOccupied 
            ? `Seat ${seatCode}: Occupied` 
            : assignedInfo 
              ? `Seat ${seatCode}: Assigned to ${assignedInfo.name || `Passenger ${assignedInfo.index + 1}`}`
              : `Seat ${seatCode} (${seatClass} • ${seatType}${isExitRow ? ' • Extra Legroom' : ''})`
        }
        className={seatClasses}
      >
        {isOccupied ? (
          <Lock className="w-3 h-3 text-slate-600" />
        ) : assignedInfo ? (
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black leading-none">P{assignedInfo.index + 1}</span>
            <span className="text-[8px] opacity-80 leading-none mt-0.5">{col}</span>
          </div>
        ) : (
          <span className="text-[10px]">{col}</span>
        )}
      </button>
    );
  };

  const allAssigned = currentPassengers.every(p => Boolean(p.assignedSeat));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  2D Aircraft Cabin Seat Map
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
                  {flight?.flightNumber || 'FLIGHT'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Airbus A320neo • Interactive Visual Fuselage Layout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Passenger Assignment Selector Ribbon */}
        <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Travelers:
            </span>
            {currentPassengers.map((p, idx) => {
              const isActive = idx === activePassengerIdx;
              const hasSeat = Boolean(p.assignedSeat);
              return (
                <button
                  key={p.id || idx}
                  type="button"
                  onClick={() => setActivePassengerIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/50' 
                      : hasSeat
                        ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] font-mono flex items-center justify-center font-bold ${
                    isActive ? 'bg-white text-blue-600' : 'bg-slate-700 text-slate-200'
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{p.name ? p.name.split(' ')[0] : `Passenger ${idx + 1}`}</span>
                  {p.assignedSeat ? (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-emerald-300 font-bold">
                      {p.assignedSeat}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-medium">Unassigned</span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAutoAssign}
            className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Auto-Assign All Seats
          </button>
        </div>

        {/* Legend Bar */}
        <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Crown className="w-2.5 h-2.5" />
            </span>
            <span>Business (Rows 1-3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-sky-500/20 border border-sky-400/40"></span>
            <span>Exit Row (Extra Legroom)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700"></span>
            <span>Economy Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-600 border border-white text-white text-[8px] font-bold flex items-center justify-center">
              P1
            </span>
            <span>Selected by You</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-800/60 border border-slate-700/40 text-slate-600 flex items-center justify-center">
              <Lock className="w-2 h-2" />
            </span>
            <span>Occupied</span>
          </div>
        </div>

        {/* Scrollable Fuselage Graphic & Cabin Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex justify-center">
          <div className="w-full max-w-xl">
            
            {/* Aircraft Nose Cone & Cockpit */}
            <div className="relative mx-auto w-48 sm:w-64 pt-6 pb-4 flex flex-col items-center">
              <div className="w-32 sm:w-44 h-16 sm:h-20 rounded-t-full border-t-2 border-x-2 border-slate-700/80 bg-gradient-to-b from-slate-800/70 to-slate-900 flex flex-col items-center justify-center shadow-lg shadow-blue-500/5">
                <Compass className="w-4 h-4 text-slate-500 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-0.5">
                  Cockpit / Nose
                </span>
              </div>
              <div className="w-40 sm:w-56 h-1 bg-slate-800 my-1 rounded-full"></div>
            </div>

            {/* Fuselage Hull Container */}
            <div className="relative rounded-3xl border-2 border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-2xl backdrop-blur-sm space-y-6">
              
              {/* Forward Galley & Lavatory */}
              <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-800 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Forward Entry L1</span>
                </div>
                <span>Galley & Lavatory A</span>
                <div className="flex items-center gap-1.5">
                  <span>Entry R1</span>
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Business Class Section (Rows 1 to 3) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-amber-500/20 text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Business Class Cabin (2-2 Layout)
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">
                    38" Pitch • Priority Boarding
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="flex items-center justify-between gap-2 sm:gap-4">
                      {/* Left Side (A, C) */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {renderSeat(row, 'A', true)}
                        {renderSeat(row, 'C', true)}
                      </div>

                      {/* Center Aisle with Row Number */}
                      <div className="w-8 sm:w-10 text-center font-mono font-bold text-xs text-amber-400/60">
                        {row}
                      </div>

                      {/* Right Side (D, F) */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {renderSeat(row, 'D', true)}
                        {renderSeat(row, 'F', true)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cabin Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider text-slate-500">
                  <span className="bg-slate-900 px-3">Curtain / Economy Class</span>
                </div>
              </div>

              {/* Economy Class Section (Rows 4 to 24) */}
              <div className="space-y-2">
                {Array.from({ length: 21 }, (_, i) => i + 4).map((row) => {
                  const isExitRow = row === 12 || row === 13;
                  const isWingRow = row >= 10 && row <= 16;

                  return (
                    <React.Fragment key={row}>
                      {/* Exit Row Header Warning */}
                      {row === 12 && (
                        <div className="my-3 py-1 px-3 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-between text-[10px] font-semibold text-sky-300">
                          <span className="flex items-center gap-1">
                            <DoorOpen className="w-3.5 h-3.5 text-sky-400" />
                            Over-Wing Emergency Exit Doors (Rows 12 & 13)
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-wide">
                            Extra Legroom +4"
                          </span>
                        </div>
                      )}

                      <div className="relative flex items-center justify-between gap-1 sm:gap-2">
                        
                        {/* Wing Visual Indicator on outer edge */}
                        {isWingRow && (
                          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-7 bg-slate-700/60 rounded-r"></div>
                        )}
                        {isWingRow && (
                          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1 h-7 bg-slate-700/60 rounded-l"></div>
                        )}

                        {/* Left Triplet: A, B, C */}
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {renderSeat(row, 'A')}
                          {renderSeat(row, 'B')}
                          {renderSeat(row, 'C')}
                        </div>

                        {/* Aisle Row Indicator */}
                        <div className="w-6 sm:w-8 text-center font-mono font-bold text-[11px] text-slate-500">
                          {row}
                        </div>

                        {/* Right Triplet: D, E, F */}
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {renderSeat(row, 'D')}
                          {renderSeat(row, 'E')}
                          {renderSeat(row, 'F')}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Rear Galley, Lavatory & Aft Exits */}
              <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-800 text-[10px] font-mono text-slate-400 mt-6">
                <div className="flex items-center gap-1.5">
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aft Exit L2</span>
                </div>
                <span>Rear Galley & Lavatories B/C</span>
                <div className="flex items-center gap-1.5">
                  <span>Aft Exit R2</span>
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

            </div>

            {/* Aircraft Tail Cone */}
            <div className="mx-auto w-32 sm:w-40 h-8 rounded-b-3xl border-b-2 border-x-2 border-slate-800 bg-slate-900/80 flex items-center justify-center text-[10px] font-mono text-slate-600 mb-4">
              Tail Fin / APU
            </div>

          </div>
        </div>

        {/* Footer Confirmation Bar */}
        <div className="p-4 sm:p-5 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            <span className="text-slate-400 block">Assigned Seats Summary:</span>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {currentPassengers.map((p, idx) => (
                <span 
                  key={idx}
                  className={`px-2 py-0.5 rounded-lg font-mono text-xs font-bold border ${
                    p.assignedSeat 
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' 
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  P{idx + 1}: {p.assignedSeat || 'Unselected'}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              Confirm {allAssigned ? 'All' : ''} Seats & Return
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SeatMapModal;

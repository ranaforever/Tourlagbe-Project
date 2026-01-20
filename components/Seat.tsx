
import React, { useState } from 'react';
import { SeatData, Gender, Religion } from '../types';

interface SeatProps {
  data: SeatData;
  onClick: () => void;
}

const Seat: React.FC<SeatProps> = ({ data, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSeatColor = () => {
    // Priority 1: Temporary Lock (Gray Pulse)
    if (data.lockInfo) return 'bg-gray-400 hover:bg-gray-500 shadow-gray-200 animate-pulse cursor-not-allowed';
    
    // Priority 2: Confirmed Booking
    if (data.isBooked && data.bookingInfo) {
      const info = data.bookingInfo;
      const isFemale = info.gender === Gender.FEMALE;
      const isMuslim = info.religion === Religion.MUSLIM;

      if (isFemale && !isMuslim) return 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200';
      if (isFemale) return 'bg-pink-500 hover:bg-pink-600 shadow-pink-200';
      if (!isMuslim) return 'bg-blue-500 hover:bg-blue-600 shadow-blue-200';
      return 'bg-red-500 hover:bg-red-600 shadow-red-200';
    }
    
    // Priority 3: Available
    return 'bg-green-500 hover:bg-green-600 shadow-green-200';
  };

  const info = data.bookingInfo;
  const lock = data.lockInfo;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 3000)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`${getSeatColor()} w-11 h-11 md:w-14 md:h-14 rounded-[12px] md:rounded-2xl flex items-center justify-center text-white text-[11px] md:text-[13px] font-black transition-all shadow-md md:shadow-lg transform active:scale-90`}
      >
        {data.id}
      </button>

      {/* Held by status for pending locks */}
      {isHovered && lock && !data.isBooked && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[200] w-32 bg-gray-900 text-white p-3 rounded-xl text-center shadow-xl animate-in zoom-in duration-200">
          <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">Held By</p>
          <p className="text-[10px] font-black truncate">{lock.agent_name}</p>
          <div className="w-full bg-gray-700 h-1 rounded-full mt-2 overflow-hidden">
             <div className="bg-orange-500 h-full animate-[progress_300s_linear]" style={{width: '100%'}}></div>
          </div>
        </div>
      )}

      {/* Confirmed booking tooltip */}
      {isHovered && data.isBooked && info && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-[150] w-64 md:w-72 bg-white text-gray-800 p-0 rounded-2xl md:rounded-[28px] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden pointer-events-none">
          <div className="bg-[#001D4A] p-3 md:p-4 flex justify-between items-center">
             <div className="flex flex-col">
               <span className="text-white font-black text-[10px] md:text-xs">Seat {data.id}</span>
               <span className="text-orange-400 text-[8px] font-bold uppercase tracking-tighter">{info.tourName}</span>
             </div>
             <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase ${info.paymentStatus === 'Paid' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
              {info.paymentStatus}
            </span>
          </div>
          <div className="p-4 md:p-5 space-y-3">
            <p className="text-sm font-black text-[#001D4A] leading-tight">{info.name}</p>
            <div className="bg-red-50 p-2 rounded-xl flex justify-between items-center border border-red-100">
               <span className="text-[9px] font-black text-red-400 uppercase">Due</span>
               <span className="text-base font-black text-red-600">৳{info.dueAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seat;

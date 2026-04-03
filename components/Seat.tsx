
import React, { useState } from 'react';
import { SeatData, Gender, Religion } from '../types';

interface SeatProps {
  data: SeatData;
  onClick: () => void;
}

const Seat: React.FC<SeatProps> = ({ data, onClick }) => {
  const getSeatColor = () => {
    // Priority 1: Temporary Lock (Gray Pulse)
    if (data.lockInfo) return 'bg-gray-400 shadow-gray-200 animate-pulse cursor-not-allowed';
    
    // Priority 2: Confirmed Booking
    if (data.isBooked && data.bookingInfo) {
      const info = data.bookingInfo;
      const isFemale = info.gender === Gender.FEMALE;
      const isMuslim = info.religion === Religion.MUSLIM;

      if (isFemale && !isMuslim) return 'bg-yellow-500 shadow-yellow-200';
      if (isFemale) return 'bg-pink-500 shadow-pink-200';
      if (!isMuslim) return 'bg-blue-500 shadow-blue-200';
      return 'bg-red-500 shadow-red-200';
    }
    
    // Priority 3: Available
    return 'bg-green-500 shadow-green-200';
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`${getSeatColor()} w-11 h-11 md:w-14 md:h-14 rounded-[12px] md:rounded-2xl flex items-center justify-center text-white text-[11px] md:text-[13px] font-black transition-all shadow-md md:shadow-lg transform active:scale-90`}
      >
        {data.id}
      </button>
    </div>
  );
};

export default Seat;

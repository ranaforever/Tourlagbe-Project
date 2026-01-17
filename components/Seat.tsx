
import React, { useState } from 'react';
import { SeatData, Gender, Religion } from '../types';

interface SeatProps {
  data: SeatData;
  onClick: () => void;
}

const Seat: React.FC<SeatProps> = ({ data, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSeatColor = () => {
    if (!data.isBooked) return 'bg-green-500 hover:bg-green-600 shadow-green-200';
    
    const info = data.bookingInfo!;
    const isFemale = info.gender === Gender.FEMALE;
    const isMuslim = info.religion === Religion.MUSLIM;

    if (isFemale && !isMuslim) return 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200'; // Gold
    if (isFemale) return 'bg-pink-500 hover:bg-pink-600 shadow-pink-200';
    if (!isMuslim) return 'bg-blue-500 hover:bg-blue-600 shadow-blue-200';
    
    return 'bg-red-500 hover:bg-red-600 shadow-red-200'; // Default booked
  };

  const info = data.bookingInfo;
  const totalFees = info ? (info.tourFees + (info.customerTypeFees || 0)) : 0;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      // Tooltip stays a bit longer on mobile after touch to allow reading
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 3000)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`${getSeatColor()} w-9 h-9 md:w-12 md:h-12 rounded-[10px] md:rounded-2xl flex items-center justify-center text-white text-[10px] md:text-[11px] font-black transition-all shadow-md md:shadow-lg transform active:scale-90`}
      >
        {data.id}
      </button>

      {isHovered && data.isBooked && info && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[110] w-64 md:w-72 bg-white text-gray-800 p-0 rounded-2xl md:rounded-[28px] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden pointer-events-none">
          <div className="bg-[#001D4A] p-3 md:p-4 flex justify-between items-center">
             <div className="flex flex-col">
               <span className="text-white font-black text-[10px] md:text-xs">Seat {data.id} Passenger</span>
               <span className="text-orange-400 text-[8px] font-bold uppercase tracking-tighter">{info.tourName}</span>
             </div>
             <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase ${info.paymentStatus === 'Paid' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
              {info.paymentStatus}
            </span>
          </div>
          
          <div className="p-4 md:p-5 space-y-3">
            {/* Passenger Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-2">
               <div>
                  <p className="text-sm font-black text-[#001D4A] leading-tight">{info.name}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                    {info.gender} • {info.religion}
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-700">+880{info.mobile}</p>
               </div>
            </div>
            
            {/* Financial Details */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase">Total Fees</span>
                <span className="font-black text-gray-700">৳{totalFees.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase">Discount</span>
                <span className="font-black text-blue-600">- ৳{info.discountAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase">Advanced</span>
                <span className="font-black text-green-600">৳{info.advanceAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Due Balance Highlight */}
            <div className="bg-red-50 p-3 rounded-xl flex justify-between items-center border border-red-100">
               <span className="text-[9px] font-black text-red-400 uppercase">Outstanding Due</span>
               <span className="text-lg font-black text-red-600">৳{info.dueAmount.toLocaleString()}</span>
            </div>

            {/* Footer / Agent */}
            <div className="flex justify-between items-center pt-1">
              <span className="text-[8px] text-gray-400 font-bold uppercase italic">Booked By {info.bookedBy}</span>
              <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Code: {info.bookerCode}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-1.5 text-center text-[7px] font-black text-gray-300 uppercase tracking-[0.2em]">
            Digital Booking Terminal 2.0
          </div>
        </div>
      )}
    </div>
  );
};

export default Seat;


import React from 'react';
import { SeatData } from '../types';
import Seat from './Seat';

interface BusLayoutProps {
  seats: SeatData[];
  onSeatClick: (id: string) => void;
}

const BusLayout: React.FC<BusLayoutProps> = ({ seats, onSeatClick }) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const lastRow = 'K';

  return (
    <div className="relative mx-auto w-full max-w-[440px] md:max-w-[480px] bg-white border-[12px] md:border-[16px] border-[#001D4A] rounded-t-[70px] md:rounded-t-[100px] rounded-b-[40px] md:rounded-b-[50px] p-5 md:p-10 pt-24 md:pt-32 shadow-2xl overflow-hidden min-h-[780px] md:min-h-[850px]">
      {/* Visual Accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#001D4A] opacity-10"></div>
      <div className="absolute top-10 md:top-14 left-1/2 -translate-x-1/2 w-28 md:w-40 h-2.5 md:h-3 bg-gray-100 rounded-full"></div>

      {/* Driver Section */}
      <div className="absolute top-8 md:top-10 right-8 md:right-12 text-[#001D4A]">
        <div className="w-12 h-12 md:w-14 md:h-14 border-[3px] md:border-4 border-[#001D4A] rounded-2xl md:rounded-3xl flex items-center justify-center bg-gray-50 shadow-inner">
          <i className="fas fa-dharmachakra text-xl md:text-2xl opacity-80 animate-spin-slow"></i>
        </div>
        <span className="text-[8px] md:text-[9px] uppercase font-black tracking-[0.1em] mt-2 block text-center opacity-40">Pilot</span>
      </div>

      <div className="space-y-5 md:space-y-6 relative z-10">
        {/* Rows A to J */}
        {rows.map((row) => {
          const rowSeats = seats.filter(s => s.id.startsWith(row));
          return (
            <div key={row} className="flex justify-between items-center px-1">
              {/* Left Side (2 seats) */}
              <div className="flex gap-2.5 md:gap-5">
                {rowSeats.slice(0, 2).map(seat => (
                  <Seat key={seat.id} data={seat} onClick={() => onSeatClick(seat.id)} />
                ))}
              </div>

              {/* Aisle Indicator */}
              <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-50 text-[11px] md:text-[12px] font-black text-gray-300 flex items-center justify-center border border-gray-100">
                  {row}
                </div>
              </div>

              {/* Right Side (2 seats) */}
              <div className="flex gap-2.5 md:gap-5">
                {rowSeats.slice(2, 4).map(seat => (
                  <Seat key={seat.id} data={seat} onClick={() => onSeatClick(seat.id)} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Back Bench - Row K */}
        <div className="pt-8 md:pt-10 mt-6 md:mt-6 border-t-4 border-dashed border-gray-50">
           <div className="flex justify-between gap-1.5 md:gap-2">
            {seats.filter(s => s.id.startsWith(lastRow)).map(seat => (
              <Seat key={seat.id} data={seat} onClick={() => onSeatClick(seat.id)} />
            ))}
          </div>
          <div className="text-center mt-5 text-[9px] md:text-[10px] font-black text-gray-200 uppercase tracking-widest">Rear Priority Seating</div>
        </div>
      </div>
      
      {/* Texture Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '15px 15px'}}></div>
    </div>
  );
};

export default BusLayout;

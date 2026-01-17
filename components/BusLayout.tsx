
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
    <div className="relative mx-auto w-full max-w-[380px] md:max-w-[420px] bg-white border-[8px] md:border-[12px] border-[#001D4A] rounded-t-[60px] md:rounded-t-[80px] rounded-b-[30px] md:rounded-b-[40px] p-4 md:p-8 pt-16 md:pt-24 shadow-2xl overflow-hidden min-h-[700px]">
      {/* Visual Accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#001D4A] opacity-10"></div>
      <div className="absolute top-8 md:top-12 left-1/2 -translate-x-1/2 w-24 md:w-32 h-1.5 md:h-2 bg-gray-100 rounded-full"></div>

      {/* Driver Section */}
      <div className="absolute top-4 md:top-6 right-6 md:right-10 text-[#001D4A]">
        <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-[#001D4A] rounded-2xl flex items-center justify-center bg-gray-50 shadow-inner">
          <i className="fas fa-dharmachakra text-lg md:text-xl opacity-80"></i>
        </div>
        <span className="text-[8px] uppercase font-black tracking-[0.1em] mt-1 md:mt-2 block text-center opacity-40">Pilot</span>
      </div>

      <div className="space-y-4 md:space-y-5 relative z-10">
        {/* Rows A to J */}
        {rows.map((row) => {
          const rowSeats = seats.filter(s => s.id.startsWith(row));
          return (
            <div key={row} className="flex justify-between items-center group">
              {/* Left Side */}
              <div className="flex gap-2 md:gap-4">
                {rowSeats.slice(0, 2).map(seat => (
                  <Seat key={seat.id} data={seat} onClick={() => onSeatClick(seat.id)} />
                ))}
              </div>

              {/* Aisle Indicator */}
              <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-50 text-[9px] md:text-[10px] font-black text-gray-300 flex items-center justify-center border border-gray-100">
                  {row}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex gap-2 md:gap-4">
                {rowSeats.slice(2, 4).map(seat => (
                  <Seat key={seat.id} data={seat} onClick={() => onSeatClick(seat.id)} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Back Bench - Row K */}
        <div className="pt-6 md:pt-8 mt-2 md:mt-4 border-t-2 border-dashed border-gray-50">
           <div className="flex justify-between gap-1 px-1">
            {seats.filter(s => s.id.startsWith(lastRow)).map(seat => (
              <Seat key={seat.id} data={seat} onClick={() => onSeatClick(seat.id)} />
            ))}
          </div>
          <div className="text-center mt-3 text-[7px] md:text-[8px] font-black text-gray-200 uppercase tracking-widest">Rear Priority Seating</div>
        </div>
      </div>
      
      {/* Texture Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
    </div>
  );
};

export default BusLayout;

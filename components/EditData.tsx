
import React, { useState } from 'react';
import { BusData, BookingInfo, Booker } from '../types';

interface EditDataProps {
  buses: BusData[];
  onUpdate: (info: BookingInfo) => void;
  onDelete: (busId: string, seatId: string) => void;
  onEdit: (info: BookingInfo) => void;
  bookers: Booker[];
}

const EditData: React.FC<EditDataProps> = ({ buses, onUpdate, onDelete, onEdit }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const allBookings: BookingInfo[] = buses.flatMap(b => b.seats.filter(s => s.isBooked).map(s => s.bookingInfo!));
  const filtered = allBookings.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.mobile.includes(searchQuery) ||
    b.seatNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookerCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto md:pl-12">
       <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-10 mb-10 relative overflow-hidden border">
          <h2 className="text-3xl font-black text-[#001D4A] mb-8">System Entry Editor</h2>
          <div className="relative group">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
            <input 
              className="w-full pl-14 pr-8 py-5 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-orange-500 transition-all text-lg font-bold" 
              placeholder="Search by passenger, mobile, seat, or agent ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-300 font-bold uppercase">No matching records found</div>
          ) : (
            filtered.map(booking => (
              <div key={booking.id} className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl border border-transparent hover:border-indigo-100 transition-all group">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black text-white bg-indigo-600 px-2.5 py-1 rounded-full uppercase">{booking.busNo}</span>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">Seat {booking.seatNo}</span>
                      </div>
                      <h4 className="font-black text-[#001D4A] text-xl truncate max-w-[150px]">{booking.name}</h4>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onEdit(booking)} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><i className="fas fa-edit"></i></button>
                      <button onClick={() => onDelete(booking.busNo, booking.seatNo)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash-alt"></i></button>
                    </div>
                 </div>
                 <div className="space-y-3 pt-6 border-t border-gray-50">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-400 font-bold uppercase">Agent Identity</span>
                       <span className="text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded text-[10px]">ID: {booking.bookerCode}</span>
                    </div>
                    <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl mt-2">
                       <span className="text-indigo-400 font-black uppercase text-[10px]">Paid</span>
                       <span className="text-indigo-700 font-black text-lg">৳{booking.advanceAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-red-50 p-3 rounded-xl">
                       <span className="text-red-400 font-black uppercase text-[10px]">Due</span>
                       <span className="text-red-600 font-black text-lg">৳{booking.dueAmount.toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="mt-4 flex justify-between items-center pt-2 border-t border-gray-50">
                   <span className="text-[9px] text-gray-400 uppercase font-black">Logged by: {booking.bookedBy}</span>
                   <button onClick={() => {/* quick pay logic handled in original code */}} className="text-[10px] font-black text-indigo-600 hover:text-orange-500 transition-colors uppercase underline">Settlement</button>
                 </div>
              </div>
            ))
          )}
       </div>
    </div>
  );
};

export default EditData;

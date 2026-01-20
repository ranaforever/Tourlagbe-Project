
import React, { useState, useMemo } from 'react';
import { BusData, BookingInfo, Booker } from '../types';

interface EditDataProps {
  buses: BusData[];
  onUpdate: (info: BookingInfo) => void;
  onDelete: (busId: string, seatId: string) => void;
  onEdit: (info: BookingInfo) => void;
  bookers: Booker[];
}

const EditData: React.FC<EditDataProps> = ({ buses, onUpdate, onDelete, onEdit, bookers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTour, setFilterTour] = useState('');
  const [filterBooker, setFilterBooker] = useState('');

  const allBookings: BookingInfo[] = useMemo(() => 
    buses.flatMap(b => b.seats.filter(s => s.isBooked).map(s => s.bookingInfo!)),
    [buses]
  );

  const filtered = useMemo(() => {
    return allBookings.filter(b => {
      const matchesSearch = searchQuery === '' || 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.mobile.includes(searchQuery) ||
        b.seatNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookerCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTour = filterTour === '' || b.busNo === filterTour;
      const matchesBooker = filterBooker === '' || b.bookerCode === filterBooker;

      return matchesSearch && matchesTour && matchesBooker;
    });
  }, [allBookings, searchQuery, filterTour, filterBooker]);

  const uniqueTours = useMemo(() => Array.from(new Set(allBookings.map(b => b.busNo))), [allBookings]);

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto md:pl-12">
       {/* Header & Main Search */}
       <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-10 mb-8 relative overflow-hidden border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black text-[#001D4A] tracking-tighter">System Entry Editor</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Found {filtered.length} matching records</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input 
                className="w-full pl-14 pr-8 py-5 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-orange-500 transition-all text-lg font-bold outline-none shadow-inner" 
                placeholder="Search by passenger, mobile, seat..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sub-Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Filter by Tour Route</label>
                <div className="relative">
                  <select 
                    value={filterTour}
                    onChange={(e) => setFilterTour(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-indigo-600 outline-none appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="">All Tours</option>
                    {uniqueTours.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none"></i>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Filter by Booker/Agent</label>
                <div className="relative">
                  <select 
                    value={filterBooker}
                    onChange={(e) => setFilterBooker(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-indigo-600 outline-none appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="">All Agents</option>
                    {bookers.map(agent => <option key={agent.code} value={agent.code}>{agent.name} ({agent.code})</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none"></i>
                </div>
              </div>
            </div>
          </div>
       </div>

       {/* Results Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filtered.length === 0 ? (
            <div className="col-span-full py-32 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-folder-open text-3xl text-gray-200"></i>
              </div>
              <h3 className="text-gray-300 font-black uppercase tracking-[0.2em]">No matching records found</h3>
              <button 
                onClick={() => {setSearchQuery(''); setFilterTour(''); setFilterBooker('');}}
                className="mt-4 text-indigo-500 font-black text-xs uppercase underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filtered.map(booking => (
              <div key={booking.id} className="bg-white p-6 md:p-8 rounded-[32px] shadow-xl border border-transparent hover:border-indigo-100 transition-all group flex flex-col justify-between">
                 <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[9px] font-black text-white bg-indigo-600 px-2.5 py-1 rounded-full uppercase shadow-sm">{booking.busNo}</span>
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">Seat {booking.seatNo}</span>
                        </div>
                        <h4 className="font-black text-[#001D4A] text-xl truncate">{booking.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">+880{booking.mobile}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => onEdit(booking)} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><i className="fas fa-edit"></i></button>
                        <button onClick={() => onDelete(booking.busNo, booking.seatNo)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><i className="fas fa-trash-alt"></i></button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-6 border-t border-gray-50">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold uppercase">Financial Snapshot</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {booking.paymentStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-indigo-50 p-3 rounded-xl">
                            <span className="text-indigo-400 font-black uppercase text-[9px] block mb-1">Paid</span>
                            <span className="text-indigo-700 font-black text-base">৳{booking.advanceAmount.toLocaleString()}</span>
                          </div>
                          <div className="bg-red-50 p-3 rounded-xl">
                            <span className="text-red-400 font-black uppercase text-[9px] block mb-1">Due</span>
                            <span className="text-red-600 font-black text-base">৳{booking.dueAmount.toLocaleString()}</span>
                          </div>
                        </div>
                    </div>
                 </div>

                 <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-50">
                   <div>
                     <span className="text-[8px] text-gray-400 uppercase font-black block tracking-widest">Booked By</span>
                     <span className="text-[10px] text-indigo-600 font-black uppercase">{booking.bookedBy}</span>
                   </div>
                   <div className="text-right">
                     <span className="text-[8px] text-gray-400 uppercase font-black block tracking-widest">Agent ID</span>
                     <span className="text-[10px] text-gray-800 font-black">{booking.bookerCode}</span>
                   </div>
                 </div>
              </div>
            ))
          )}
       </div>
    </div>
  );
};

export default EditData;


import React, { useState, useMemo } from 'react';
import { BusData, BookingInfo } from '../types';

interface BookingLogProps {
  buses: BusData[];
}

const BookingLog: React.FC<BookingLogProps> = ({ buses }) => {
  const [filterTour, setFilterTour] = useState('');
  const [filterBooker, setFilterBooker] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const allBookings: BookingInfo[] = useMemo(() => 
    buses.flatMap(b => b.seats.filter(s => s.isBooked).map(s => s.bookingInfo!)),
    [buses]
  );

  const filteredBookings = useMemo(() => {
    return allBookings.filter(b => {
      const matchesTour = filterTour === '' || b.tourName === filterTour;
      const matchesBooker = filterBooker === '' || b.bookedBy.toLowerCase().includes(filterBooker.toLowerCase()) || b.bookerCode.toLowerCase().includes(filterBooker.toLowerCase());
      const matchesDate = filterDate === '' || b.bookingDate.startsWith(filterDate);
      return matchesTour && matchesBooker && matchesDate;
    });
  }, [allBookings, filterTour, filterBooker, filterDate]);

  const uniqueTours = useMemo(() => Array.from(new Set(allBookings.map(b => b.tourName))), [allBookings]);

  const downloadCSV = () => {
    const headers = ['Seat', 'Name', 'Mobile', 'Tour', 'Total Fees', 'Advance', 'Due', 'Status', 'Booked By', 'Date'];
    const rows = filteredBookings.map(b => [
      `${b.busNo}-${b.seatNo}`,
      b.name,
      `+880${b.mobile}`,
      b.tourName,
      b.tourFees + b.customerTypeFees,
      b.advanceAmount,
      b.dueAmount,
      b.paymentStatus,
      b.bookedBy,
      new Date(b.bookingDate).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `TourLagbe_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 md:p-8 border-b bg-gray-50/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-[#001D4A]">Response Sheet</h2>
            <p className="text-sm text-gray-500">Filtered entries: <span className="text-indigo-600 font-bold">{filteredBookings.length}</span></p>
          </div>
          <button 
            onClick={downloadCSV}
            className="w-full md:w-auto bg-[#001D4A] text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg hover:bg-orange-500 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-csv text-lg"></i> Export CSV
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Tour Name</label>
            <select 
              value={filterTour}
              onChange={(e) => setFilterTour(e.target.value)}
              className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Tours</option>
              {uniqueTours.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Booker/Agent</label>
            <input 
              type="text"
              placeholder="Search Name or Code"
              value={filterBooker}
              onChange={(e) => setFilterBooker(e.target.value)}
              className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Date</label>
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 text-gray-500 font-black uppercase text-[10px] tracking-widest">
              <th className="px-6 py-4">Seat ID</th>
              <th className="px-6 py-4">Passenger</th>
              <th className="px-6 py-4">Tour Info</th>
              <th className="px-6 py-4">Financials</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Agent</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-gray-400 italic">No entries match your search criteria.</td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 font-black text-indigo-600">{b.busNo} - {b.seatNo}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{b.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">+880{b.mobile}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-700">{b.tourName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{b.gender} | {b.religion}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-800">৳{(b.tourFees + b.customerTypeFees).toLocaleString()}</p>
                    <p className="text-[10px] text-red-500 font-black">DUE: ৳{b.dueAmount.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${b.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-800 font-black">{b.bookedBy}</p>
                    <p className="text-[10px] text-indigo-400 font-bold">{b.bookerCode}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-bold">{new Date(b.bookingDate).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingLog;

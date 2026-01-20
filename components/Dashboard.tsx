
import React, { useMemo } from 'react';
import { BusData, BookingInfo, Expense } from '../types';

interface DashboardProps {
  buses: BusData[];
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ buses, expenses }) => {
  const allBookings: BookingInfo[] = useMemo(() => 
    buses.flatMap(b => b.seats.filter(s => s.isBooked).map(s => s.bookingInfo!)),
    [buses]
  );
  
  const totalRevenue = allBookings.reduce((sum, b) => sum + (b.tourFees + b.customerTypeFees - b.discountAmount), 0);
  const totalAdvance = allBookings.reduce((sum, b) => sum + b.advanceAmount, 0);
  const totalDue = allBookings.reduce((sum, b) => sum + b.dueAmount, 0);
  const totalExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const bookerRanking = useMemo(() => {
    const counts: Record<string, { name: string, seats: number, revenue: number }> = {};
    allBookings.forEach(b => {
      if (!counts[b.bookerCode]) {
        counts[b.bookerCode] = { name: b.bookedBy, seats: 0, revenue: 0 };
      }
      counts[b.bookerCode].seats += 1;
      counts[b.bookerCode].revenue += (b.tourFees + b.customerTypeFees - b.discountAmount);
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].seats - a[1].seats)
      .map(([code, data]) => ({ code, ...data }));
  }, [allBookings]);

  const stats = [
    { label: 'Fleet Capacity', value: buses.reduce((acc, b) => acc + b.seats.length, 0), icon: 'fa-chair', color: 'bg-indigo-600' },
    { label: 'Confirmed Seats', value: allBookings.length, icon: 'fa-check-double', color: 'bg-green-500' },
    { label: 'Projected Sales', value: `৳${totalRevenue.toLocaleString()}`, icon: 'fa-sack-dollar', color: 'bg-blue-500' },
    { label: 'Projected Profit', value: `৳${netProfit.toLocaleString()}`, icon: 'fa-chart-pie', color: 'bg-[#001D4A]' },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto md:pl-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-all group">
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
               <i className={`fas ${stat.icon}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-xl md:text-2xl font-black text-[#001D4A]">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Occupancy Chart */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-[#001D4A] mb-8 flex items-center gap-3">
            <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
            Route Occupancy
          </h3>
          <div className="space-y-6">
             {buses.length > 0 ? buses.map(bus => {
               const bookedCount = bus.seats.filter(s => s.isBooked).length;
               const percent = Math.round((bookedCount / bus.seats.length) * 100);
               return (
                 <div key={bus.busId} className="group">
                    <div className="flex justify-between text-[11px] font-black mb-2">
                      <span className="text-gray-600 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">{bus.busId}</span>
                      <span className="text-indigo-600">{bookedCount}/{bus.seats.length} Seats ({percent}%)</span>
                    </div>
                    <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                       <div className="bg-indigo-600 h-full transition-all duration-1000 shadow-sm" style={{ width: `${percent}%` }}></div>
                    </div>
                 </div>
               )
             }) : (
               <p className="text-center text-gray-400 py-10 italic">No active tours to display.</p>
             )}
          </div>
        </div>

        {/* Booker Ranking */}
        <div className="lg:col-span-5 space-y-8">
           <div className="bg-[#001D4A] p-8 rounded-[32px] text-white shadow-2xl overflow-hidden relative">
              <i className="fas fa-trophy absolute top-[-20px] right-[-20px] text-white/5 text-[150px] rotate-12"></i>
              <h3 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10">
                <i className="fas fa-medal text-orange-400"></i>
                Agent Leaderboard
              </h3>
              <div className="space-y-4 relative z-10 max-h-[350px] overflow-y-auto no-scrollbar">
                {bookerRanking.length > 0 ? bookerRanking.map((agent, idx) => (
                  <div key={agent.code} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
                    <div className="flex items-center gap-4">
                       <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-orange-500' : 'bg-white/10'}`}>
                         {idx + 1}
                       </span>
                       <div>
                         <p className="text-sm font-bold truncate max-w-[120px]">{agent.name}</p>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-black bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">ID: {agent.code}</span>
                            <p className="text-[9px] text-white/40 font-bold uppercase">{agent.seats} Seats</p>
                         </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-orange-400">৳{agent.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-white/30 py-10 italic">No agent activities found.</p>
                )}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full border-[6px] border-indigo-50 flex flex-col items-center justify-center mb-4">
                 <span className="text-2xl font-black text-indigo-600">{Math.round((totalAdvance / totalRevenue) * 100) || 0}%</span>
                 <span className="text-[8px] text-gray-400 font-black uppercase tracking-tighter">Collection</span>
              </div>
              <h4 className="text-lg font-black text-[#001D4A]">Revenue Growth</h4>
              <div className="mt-6 w-full grid grid-cols-2 gap-3">
                 <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Sales</p>
                    <p className="text-base font-black text-[#001D4A]">৳{totalRevenue.toLocaleString()}</p>
                 </div>
                 <div className="bg-orange-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-orange-400 uppercase mb-1">Due</p>
                    <p className="text-base font-black text-orange-600">৳{totalDue.toLocaleString()}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

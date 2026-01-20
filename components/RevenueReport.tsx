
import React, { useMemo } from 'react';
import { BusData, BookingInfo, Expense } from '../types';

interface RevenueReportProps {
  buses: BusData[];
  expenses: Expense[];
}

const RevenueReport: React.FC<RevenueReportProps> = ({ buses, expenses }) => {
  const allBookings: BookingInfo[] = useMemo(() => 
    buses.flatMap(b => b.seats.filter(s => s.isBooked).map(s => s.bookingInfo!)),
    [buses]
  );

  const totalSales = allBookings.reduce((sum, b) => sum + (b.tourFees + b.customerTypeFees - b.discountAmount), 0);
  const totalCashCollected = allBookings.reduce((sum, b) => sum + b.advanceAmount, 0);
  const totalDue = allBookings.reduce((sum, b) => sum + b.dueAmount, 0);
  const totalExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const grossProfit = totalSales - totalExpenses;
  const netCashBalance = totalCashCollected - totalExpenses;

  const revenueByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    allBookings.forEach(b => {
      cats[b.tourName] = (cats[b.tourName] || 0) + (b.tourFees + b.customerTypeFees - b.discountAmount);
    });
    return Object.entries(cats).sort((a,b) => b[1] - a[1]);
  }, [allBookings]);

  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.forEach(ex => {
      cats[ex.category] = (cats[ex.category] || 0) + ex.amount;
    });
    return Object.entries(cats).sort((a,b) => b[1] - a[1]);
  }, [expenses]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#001D4A] tracking-tighter">Finance Hub</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Live Financial Overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-10 -mt-10 opacity-40 group-hover:scale-110 transition-transform"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Revenue</p>
            <h4 className="text-3xl font-black text-green-600 relative z-10">৳{totalSales.toLocaleString()}</h4>
            <div className="mt-4 flex items-center gap-2 relative z-10">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
               <span className="text-[9px] font-bold text-gray-400 uppercase">Gross Billing</span>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-10 -mt-10 opacity-40 group-hover:scale-110 transition-transform"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Costs</p>
            <h4 className="text-3xl font-black text-red-600 relative z-10">৳{totalExpenses.toLocaleString()}</h4>
            <div className="mt-4 flex items-center gap-2 relative z-10">
               <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
               <span className="text-[9px] font-bold text-gray-400 uppercase">Operating Expenses</span>
            </div>
         </div>

         <div className="bg-[#001D4A] p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1 relative z-10">Projected Profit</p>
            <h4 className={`text-3xl font-black relative z-10 ${grossProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
               ৳{grossProfit.toLocaleString()}
            </h4>
            <div className="mt-4 flex items-center gap-2 relative z-10">
               <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
               <span className="text-[9px] font-bold text-indigo-300/60 uppercase">After Full Collection</span>
            </div>
         </div>

         <div className="bg-orange-500 p-8 rounded-[40px] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
            <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1 relative z-10">Current Cash</p>
            <h4 className="text-3xl font-black text-white relative z-10">৳{netCashBalance.toLocaleString()}</h4>
            <div className="mt-4 flex items-center gap-2 relative z-10">
               <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
               <span className="text-[9px] font-bold text-white/60 uppercase">In-Hand Balance</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Revenue Breakdown */}
         <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-[#001D4A] uppercase tracking-tighter mb-8 flex items-center gap-3">
               <i className="fas fa-chart-pie text-green-500"></i> Revenue Sources
            </h3>
            <div className="space-y-6">
               {revenueByCategory.map(([cat, val]) => (
                  <div key={cat}>
                     <div className="flex justify-between text-[11px] font-black mb-2">
                        <span className="text-gray-500 uppercase tracking-widest">{cat}</span>
                        <span className="text-green-600">৳{val.toLocaleString()}</span>
                     </div>
                     <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${(val/totalSales)*100}%` }}></div>
                     </div>
                  </div>
               ))}
               {revenueByCategory.length === 0 && <p className="text-center py-10 text-gray-300 italic font-bold">No revenue records found.</p>}
            </div>
         </div>

         {/* Expense Breakdown */}
         <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-[#001D4A] uppercase tracking-tighter mb-8 flex items-center gap-3">
               <i className="fas fa-chart-area text-red-500"></i> Cost Categories
            </h3>
            <div className="space-y-6">
               {expenseByCategory.map(([cat, val]) => (
                  <div key={cat}>
                     <div className="flex justify-between text-[11px] font-black mb-2">
                        <span className="text-gray-500 uppercase tracking-widest">{cat}</span>
                        <span className="text-red-600">৳{val.toLocaleString()}</span>
                     </div>
                     <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full" style={{ width: `${(val/totalExpenses)*100}%` }}></div>
                     </div>
                  </div>
               ))}
               {expenseByCategory.length === 0 && <p className="text-center py-10 text-gray-300 italic font-bold">No expense records found.</p>}
            </div>
         </div>
      </div>
    </div>
  );
};

export default RevenueReport;
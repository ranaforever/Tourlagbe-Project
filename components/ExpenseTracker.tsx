
import React, { useState, useMemo } from 'react';
import { Expense, Booker, Tour } from '../types';

interface ExpenseTrackerProps {
  expenses: Expense[];
  onSubmit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  bookers: Booker[];
  initialAgentCode?: string;
  tours: Tour[];
}

const EXPENSE_CATEGORIES = [
  'Bus Rent',
  'Fuel/Gas',
  'Food/Catering',
  'Marketing/Ads',
  'Agent Commission',
  'Office Rent',
  'Staff Salary',
  'Misc Repairs',
  'Others'
];

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ expenses, onSubmit, onDelete, bookers, initialAgentCode, tours }) => {
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    agentCode: initialAgentCode || '',
    tourName: '' // Default to no specific tour
  });

  const [listFilterTour, setListFilterTour] = useState('');

  const filteredExpenses = useMemo(() => {
    if (!listFilterTour) return expenses;
    return expenses.filter(ex => ex.tourName === listFilterTour);
  }, [expenses, listFilterTour]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Support ADMIN bypass for authorization
    if (formData.agentCode === "@Rana&01625@" || formData.agentCode === "ADMIN") {
       const newExpense: Expense = {
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          category: formData.category,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          recordedBy: 'System Administrator',
          agentCode: 'ADMIN',
          tourName: formData.tourName || undefined
        };
        onSubmit(newExpense);
        setFormData({ ...formData, amount: '', description: '' });
        return;
    }

    const booker = bookers.find(b => b.code.toUpperCase() === formData.agentCode.toUpperCase());
    if (!booker) {
      alert("Verification Failed: Invalid Agent Code.");
      return;
    }

    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
      recordedBy: booker.name,
      agentCode: booker.code,
      tourName: formData.tourName || undefined
    };

    onSubmit(newExpense);
    setFormData({ ...formData, amount: '', description: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto md:pl-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-5 bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-gray-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-xl shadow-inner">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#001D4A] tracking-tighter">Record Cost</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manual Outflow Entry</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-[#001D4A] outline-none appearance-none cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Tour Route</label>
                <select 
                  value={formData.tourName}
                  onChange={e => setFormData({...formData, tourName: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-indigo-600 outline-none appearance-none cursor-pointer"
                >
                  <option value="">General / Office</option>
                  {tours.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Amount (৳)</label>
                <input 
                  required
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-red-600 outline-none placeholder:text-red-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Date</label>
                <input 
                  required
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Description</label>
              <textarea 
                rows={2}
                placeholder="Details of expenditure..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none placeholder:text-gray-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Agent Authorization</label>
              <input 
                required
                readOnly={initialAgentCode === 'ADMIN'}
                placeholder="YOUR AGENT CODE"
                value={formData.agentCode}
                onChange={e => setFormData({...formData, agentCode: e.target.value.toUpperCase()})}
                className={`w-full px-5 py-4 border-2 rounded-2xl font-black text-center text-lg tracking-widest uppercase outline-none transition-all ${initialAgentCode === 'ADMIN' ? 'bg-indigo-50 border-indigo-100 text-indigo-600 cursor-default' : 'bg-white border-gray-100 focus:border-indigo-400'}`}
              />
            </div>

            <button type="submit" className="w-full py-5 bg-[#001D4A] text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-orange-500 transition-all active:scale-95">
              Confirm Outflow
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
               <div>
                  <h3 className="text-xl font-black text-[#001D4A] uppercase tracking-tighter">Recent Outflows</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase mt-1">Total: ৳{filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
               </div>
               <div className="relative">
                  <select 
                    value={listFilterTour} 
                    onChange={e => setListFilterTour(e.target.value)}
                    className="pl-4 pr-10 py-2 bg-gray-50 border-none rounded-xl text-xs font-black text-indigo-600 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">All Route Costs</option>
                    <option value="General">General/Office</option>
                    {tours.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                  <i className="fas fa-filter absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none text-[10px]"></i>
               </div>
             </div>

             <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-20 text-gray-300 italic font-bold">No expenses found matching filter.</div>
                ) : (
                  filteredExpenses.map(ex => (
                    <div key={ex.id} className="group flex items-center justify-between p-5 bg-gray-50 hover:bg-white hover:shadow-xl transition-all rounded-[24px] border border-transparent hover:border-red-100">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                             <i className="fas fa-receipt"></i>
                          </div>
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{ex.category}</p>
                                {ex.tourName && (
                                  <span className="text-[7px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">{ex.tourName}</span>
                                )}
                             </div>
                             <p className="font-black text-[#001D4A] text-sm">{ex.description || 'No description'}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <p className="text-[9px] text-gray-300 font-bold uppercase">{new Date(ex.date).toLocaleDateString()} • {ex.recordedBy}</p>
                                <span className="text-[8px] font-black text-white bg-indigo-500 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">ID: {ex.agentCode}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right">
                             <p className="text-lg font-black text-red-600 leading-none">- ৳{ex.amount.toLocaleString()}</p>
                          </div>
                          <button 
                            onClick={() => onDelete(ex.id)}
                            className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;

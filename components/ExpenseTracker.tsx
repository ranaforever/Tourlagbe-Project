
import React, { useState, useMemo, useEffect } from 'react';
import { Expense, Booker, Tour } from '../types';

interface ExpenseTrackerProps {
  expenses: Expense[];
  onSubmit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  bookers: Booker[];
  initialAgentCode?: string;
  tours: Tour[];
  isAdmin?: boolean;
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

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ expenses, onSubmit, onDelete, bookers, initialAgentCode, tours, isAdmin }) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    agentCode: initialAgentCode || '',
    tourName: ''
  });

  const [listFilterTour, setListFilterTour] = useState('');

  const filteredExpenses = useMemo(() => {
    if (!listFilterTour) return expenses;
    return expenses.filter(ex => ex.tourName === listFilterTour);
  }, [expenses, listFilterTour]);

  const handleEdit = (ex: Expense) => {
    if (!isAdmin) return;
    setEditId(ex.id);
    setFormData({
      category: ex.category,
      amount: ex.amount.toString(),
      description: ex.description || '',
      date: ex.date,
      agentCode: ex.agentCode || initialAgentCode || '',
      tourName: ex.tourName || ''
    });
    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      category: EXPENSE_CATEGORIES[0],
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      agentCode: initialAgentCode || '',
      tourName: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let recorderName = 'System Admin';
    let finalAgentCode = 'ADMIN';

    if (formData.agentCode !== "@Rana&01625@" && formData.agentCode !== "ADMIN") {
      const booker = bookers.find(b => b.code.toUpperCase() === formData.agentCode.toUpperCase());
      if (!booker) {
        alert("Invalid Agent Code.");
        return;
      }
      recorderName = booker.name;
      finalAgentCode = booker.code;
    }

    const newExpense: Expense = {
      id: editId || Math.random().toString(36).substr(2, 9).toUpperCase(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
      recordedBy: recorderName,
      agentCode: finalAgentCode,
      tourName: formData.tourName || undefined
    };

    onSubmit(newExpense);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      alert("Only Admin can delete expenses.");
      return;
    }
    if (confirm("Delete this expense record permanently?")) {
      onDelete(id);
      if (editId === id) resetForm();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto md:pl-12 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white p-6 md:p-10 rounded-[32px] shadow-sm border border-gray-100 h-fit sticky top-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${editId ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'} rounded-xl flex items-center justify-center shadow-inner transition-colors`}>
                <i className={`fas ${editId ? 'fa-pen-to-square' : 'fa-file-invoice-dollar'}`}></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-[#001D4A] tracking-tighter uppercase">
                  {editId ? 'Edit Cost' : 'Cost Entry'}
                </h3>
              </div>
            </div>
            {editId && (
              <button onClick={resetForm} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-xs text-[#001D4A] uppercase outline-none">{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Route (Optional)</label>
              <select value={formData.tourName} onChange={e => setFormData({...formData, tourName: e.target.value})} className="w-full px-5 py-4 bg-indigo-50 border-none rounded-2xl font-black text-xs text-indigo-600 uppercase outline-none"><option value="">General Expense</option>{tours.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}</select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                <input required type="number" inputMode="numeric" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-sm text-red-600 outline-none" placeholder="৳" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-xs outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
              <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none" placeholder="e.g. Bus advanced payment" />
            </div>

            <div className="space-y-1">
               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Security Authentication</label>
               <input required placeholder="YOUR AGENT CODE" value={formData.agentCode} onChange={e => setFormData({...formData, agentCode: e.target.value.toUpperCase()})} className={`w-full px-5 py-4 border-2 rounded-2xl font-black text-center text-sm tracking-widest uppercase transition-all outline-none ${initialAgentCode === 'ADMIN' ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-gray-100'}`} />
            </div>

            <button type="submit" className={`w-full py-5 ${editId ? 'bg-blue-600' : 'bg-[#001D4A]'} text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all`}>
              {editId ? 'Update Record' : 'Submit Expense'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black text-[#001D4A] uppercase tracking-widest">Recent Activity</h3>
              <select value={listFilterTour} onChange={e => setListFilterTour(e.target.value)} className="bg-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-indigo-600 border border-gray-100 outline-none">
                <option value="">All Tours</option>
                {tours.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
           </div>
           
           <div className="space-y-3">
              {filteredExpenses.map(ex => (
                <div key={ex.id} className={`bg-white p-4 rounded-3xl shadow-sm border transition-all ${editId === ex.id ? 'border-blue-500 ring-2 ring-blue-50' : 'border-gray-50'} flex items-center justify-between group`}>
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${editId === ex.id ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'} rounded-xl flex items-center justify-center text-xs transition-colors`}><i className="fas fa-receipt"></i></div>
                      <div>
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight leading-none mb-1">{ex.category} {ex.tourName ? `• ${ex.tourName}` : ''}</p>
                         <p className="font-bold text-[#001D4A] text-xs truncate max-w-[150px]">{ex.description || 'No description'}</p>
                         <p className="text-[8px] font-black text-gray-300 mt-1 uppercase">{new Date(ex.date).toLocaleDateString()} • {ex.recordedBy}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-red-600 mr-2">৳{ex.amount.toLocaleString()}</p>
                      {isAdmin && (
                        <>
                          <button onClick={() => handleEdit(ex)} className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center active:scale-90 transition-all opacity-0 group-hover:opacity-100"><i className="fas fa-edit text-[10px]"></i></button>
                          <button onClick={() => handleDelete(ex.id)} className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center active:scale-90 transition-all opacity-0 group-hover:opacity-100"><i className="fas fa-trash-alt text-[10px]"></i></button>
                        </>
                      )}
                      {/* Mobile Always Visible Actions */}
                      <div className="md:hidden flex gap-1">
                        {isAdmin && (
                          <>
                            <button onClick={() => handleEdit(ex)} className="w-7 h-7 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center"><i className="fas fa-edit text-[9px]"></i></button>
                            <button onClick={() => handleDelete(ex.id)} className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center"><i className="fas fa-trash-alt text-[9px]"></i></button>
                          </>
                        )}
                      </div>
                   </div>
                </div>
              ))}
              {filteredExpenses.length === 0 && (
                <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-gray-100">
                  <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">No expenses found</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;


import React, { useState, useEffect, useCallback } from 'react';
import { BUSINESS_INFO, generateInitialSeats } from './constants';
import { BusData, BookingInfo, Tour, Booker, CustomerType, Expense, SeatLock } from './types';
import BusLayout from './components/BusLayout';
import BookingModal from './components/BookingModal';
import ConfirmationDialog from './components/ConfirmationDialog';
import Dashboard from './components/Dashboard';
import BookingLog from './components/BookingLog';
import EditData from './components/EditData';
import AdminPanel from './components/AdminPanel';
import SeatDetailModal from './components/SeatDetailModal';
import ExpenseTracker from './components/ExpenseTracker';
import RevenueReport from './components/RevenueReport';
import { supabase } from './supabase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'booking' | 'dashboard' | 'log' | 'edit' | 'admin' | 'expenses' | 'revenue'>('booking');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('tl_auth_admin') === 'true' || localStorage.getItem('tl_auth_admin') === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [authenticatedAgent, setAuthenticatedAgent] = useState<Booker | null>(() => {
    const savedSession = sessionStorage.getItem('tl_auth_agent');
    const savedLocal = localStorage.getItem('tl_auth_agent');
    const saved = savedSession || savedLocal;
    return saved ? JSON.parse(saved) : null;
  });
  const [entryCodeInput, setEntryCodeInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [selectedBusIndex, setSelectedBusIndex] = useState(0);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingInfo, setEditingInfo] = useState<BookingInfo | null>(null);

  const [tours, setTours] = useState<Tour[]>([]);
  const [bookers, setBookers] = useState<Booker[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [onlineAgents, setOnlineAgents] = useState<Booker[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [toursRes, bookersRes, typesRes, bookingsRes, expensesRes, locksRes] = await Promise.all([
        supabase.from('tl_tours').select('*').order('name'),
        supabase.from('tl_agents').select('*').order('name'),
        supabase.from('tl_customer_types').select('*').order('type'),
        supabase.from('tl_bookings').select('*'),
        supabase.from('tl_expenses').select('*').order('date', { ascending: false }),
        supabase.from('tl_locks').select('*')
      ]);

      const fetchedTours = toursRes.data || [];
      const fetchedBookers = bookersRes.data || [];
      const fetchedTypes = typesRes.data || [];
      const fetchedBookings: any[] = bookingsRes.data || [];
      const fetchedLocks: any[] = locksRes.data || [];

      const now = new Date();
      const validLocks: SeatLock[] = fetchedLocks.filter(lock => new Date(lock.expires_at) > now);

      const onlineCutoff = new Date(Date.now() - 2 * 60 * 1000);
      const activeAgents = fetchedBookers.filter(b => b.last_active && new Date(b.last_active) > onlineCutoff);
      setOnlineAgents(activeAgents);

      const mappedBookings: BookingInfo[] = fetchedBookings.map(b => ({
        id: b.id, name: b.name, mobile: b.mobile, address: b.address,
        gender: b.gender, religion: b.religion, tourName: b.tour_name,
        tourFees: b.tour_fees, customerType: b.customer_type,
        customerTypeFees: b.customer_type_fees, discountAmount: b.discount_amount,
        advanceAmount: b.advance_amount, dueAmount: b.due_amount,
        paymentStatus: b.payment_status, busNo: b.bus_no, seatNo: b.seat_no,
        bookedBy: b.booked_by, bookerCode: b.booker_code, bookingDate: b.booking_date
      }));

      setTours(fetchedTours);
      setBookers(fetchedBookers);
      setCustomerTypes(fetchedTypes);
      setExpenses((expensesRes.data || []).map(ex => ({
        id: ex.id, category: ex.category, amount: ex.amount, description: ex.description,
        date: ex.date, recordedBy: ex.recorded_by, agentCode: ex.agent_code, tourName: ex.tour_name
      })));

      const busLayouts = fetchedTours.map(t => {
        const seats = generateInitialSeats();
        mappedBookings.forEach(booking => {
          if (booking.busNo === t.name) {
            const seatIdx = seats.findIndex(s => s.id === booking.seatNo);
            if (seatIdx !== -1) seats[seatIdx] = { ...seats[seatIdx], isBooked: true, bookingInfo: booking };
          }
        });
        validLocks.forEach(lock => {
          if (lock.bus_no === t.name) {
            const seatIdx = seats.findIndex(s => s.id === lock.seat_no);
            if (seatIdx !== -1 && !seats[seatIdx].isBooked) {
              seats[seatIdx] = { ...seats[seatIdx], lockInfo: lock };
            }
          }
        });
        return { busId: t.name, seats };
      });
      setBuses(busLayouts);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    const channel = supabase.channel('tl_realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData())
      .subscribe();
    return () => { 
      clearInterval(interval);
      supabase.removeChannel(channel); 
    };
  }, [fetchData]);

  useEffect(() => {
    if (!authenticatedAgent || authenticatedAgent.code === 'ADMIN') return;
    const heartbeat = setInterval(async () => {
      await supabase.from('tl_agents').update({ last_active: new Date().toISOString() }).eq('code', authenticatedAgent.code);
    }, 30000);
    return () => clearInterval(heartbeat);
  }, [authenticatedAgent]);

  const handleSeatClick = async (sid: string) => {
    const currentBus = buses[selectedBusIndex];
    const seat = currentBus.seats.find(s => s.id === sid);

    if (seat?.isBooked) {
      setEditingInfo(seat.bookingInfo!);
      setShowDetailModal(true);
      return;
    }

    if (seat?.lockInfo) {
      if (seat.lockInfo.agent_code === authenticatedAgent?.code) {
        setSelectedSeatId(sid);
        setShowBookingModal(true);
      } else {
        alert(`This seat is currently being booked by ${seat.lockInfo.agent_name}.`);
      }
      return;
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    try {
      const { error } = await supabase.from('tl_locks').insert({
        bus_no: currentBus.busId,
        seat_no: sid,
        agent_code: authenticatedAgent?.code || 'GUEST',
        agent_name: authenticatedAgent?.name || 'Guest',
        expires_at: expiresAt
      });

      if (error) {
        alert("Seat just taken! Refreshing data...");
        fetchData();
        return;
      }

      setSelectedSeatId(sid);
      setShowBookingModal(true);
    } catch (e) {
      alert("System error securing seat.");
    }
  };

  const releaseLock = async (busNo: string, seatId: string) => {
    if (!authenticatedAgent) return;
    await supabase.from('tl_locks').delete().eq('bus_no', busNo).eq('seat_no', seatId).eq('agent_code', authenticatedAgent.code);
    fetchData();
  };

  const handleBookingSubmit = async (info: BookingInfo) => {
    try {
      const { error } = await supabase.from('tl_bookings').upsert({
        id: info.id, name: info.name, mobile: info.mobile, address: info.address,
        gender: info.gender, religion: info.religion, tour_name: info.tourName,
        tour_fees: info.tourFees, customer_type: info.customerType,
        customer_type_fees: info.customerTypeFees, discount_amount: info.discountAmount,
        advance_amount: info.advanceAmount, due_amount: info.dueAmount,
        payment_status: info.paymentStatus, bus_no: info.busNo, seat_no: info.seatNo,
        booked_by: info.bookedBy, booker_code: info.bookerCode, booking_date: info.bookingDate
      });
      if (error) throw error;
      
      await releaseLock(info.busNo, info.seatNo);
      fetchData();
    } catch (error) {
      alert("Booking failed to save.");
    }
    setShowBookingModal(false);
    setShowDetailModal(false);
  };

  const handleBookingDelete = async (busId: string, seatId: string) => {
    if (!isAdminAuthenticated) return;
    try {
      const { error } = await supabase.from('tl_bookings').delete().eq('bus_no', busId).eq('seat_no', seatId);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert("Delete failed.");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!isAdminAuthenticated) return;
    try {
      const { error } = await supabase.from('tl_bookings').delete().in('id', ids);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert("Bulk delete failed.");
    }
  };

  // Admin Master Data Handlers
  const handleTourUpsert = async (tour: Tour) => {
    try {
      const { error } = await supabase.from('tl_tours').upsert({ name: tour.name, fee: tour.fee }, { onConflict: 'name' });
      if (error) throw error;
      fetchData();
    } catch (e) { alert("Failed to save tour."); }
  };

  const handleTourDelete = async (name: string) => {
    if (confirm(`Warning: Deleting tour "${name}" will remove it from future selections. Existing bookings for this tour will remain in logs. Continue?`)) {
      try {
        const { error } = await supabase.from('tl_tours').delete().eq('name', name);
        if (error) throw error;
        fetchData();
      } catch (e) { alert("Failed to delete tour."); }
    }
  };

  const handleAgentUpsert = async (agent: Booker) => {
    try {
      const { error } = await supabase.from('tl_agents').upsert({ code: agent.code, name: agent.name }, { onConflict: 'code' });
      if (error) throw error;
      fetchData();
    } catch (e) { alert("Failed to save agent."); }
  };

  const handleAgentDelete = async (code: string) => {
    try {
      const { error } = await supabase.from('tl_agents').delete().eq('code', code);
      if (error) throw error;
      fetchData();
    } catch (e) { alert("Failed to delete agent."); }
  };

  const handleCustomerTypeUpsert = async (type: CustomerType) => {
    try {
      const { error } = await supabase.from('tl_customer_types').upsert({ type: type.type, fee: type.fee }, { onConflict: 'type' });
      if (error) throw error;
      fetchData();
    } catch (e) { alert("Failed to save pricing type."); }
  };

  const handleCustomerTypeDelete = async (type: string) => {
    try {
      const { error } = await supabase.from('tl_customer_types').delete().eq('type', type);
      if (error) throw error;
      fetchData();
    } catch (e) { alert("Failed to delete pricing type."); }
  };

  const handleExpenseSubmit = async (ex: Expense) => {
    try {
      const { error } = await supabase.from('tl_expenses').upsert({
        id: ex.id, category: ex.category, amount: ex.amount, description: ex.description,
        date: ex.date, recorded_by: ex.recordedBy, agent_code: ex.agentCode, tour_name: ex.tourName
      });
      if (error) throw error;
      fetchData();
    } catch (e) {
      alert("Failed to save expense.");
    }
  };

  const handleExpenseDelete = async (id: string) => {
    if (!isAdminAuthenticated) return;
    try {
      const { error } = await supabase.from('tl_expenses').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e) {
      alert("Delete failed.");
    }
  };

  const handleEntryLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (entryCodeInput === "@Rana&01625@") {
      const adminAgent: Booker = { code: 'ADMIN', name: 'System Administrator' };
      setAuthenticatedAgent(adminAgent);
      setIsAdminAuthenticated(true);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('tl_auth_admin', 'true');
      storage.setItem('tl_auth_agent', JSON.stringify(adminAgent));
      setEntryCodeInput('');
      return;
    }
    const agent = bookers.find(b => b.code.toUpperCase() === entryCodeInput.toUpperCase());
    if (agent) {
      setAuthenticatedAgent(agent);
      setIsAdminAuthenticated(false);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('tl_auth_agent', JSON.stringify(agent));
      storage.setItem('tl_auth_admin', 'false');
      setEntryCodeInput('');
    } else {
      alert("Identity Invalid. Please check your code.");
    }
  };

  if (!authenticatedAgent) {
    return (
      <div className="min-h-screen bg-[#001D4A] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 relative z-10 animate-in zoom-in duration-500">
           <div className="flex flex-col items-center mb-10">
              <img src={BUSINESS_INFO.logo} alt="Logo" className="w-24 mb-6" />
              <h1 className="text-3xl font-black text-[#001D4A] tracking-tighter uppercase leading-none">{BUSINESS_INFO.name}</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Cloud Registry System</p>
           </div>

           <form onSubmit={handleEntryLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access Identity</label>
                 <input 
                    required
                    type="password"
                    placeholder="ENTER CODE"
                    value={entryCodeInput}
                    onChange={(e) => setEntryCodeInput(e.target.value)}
                    className="w-full px-6 py-5 bg-gray-50 border-none rounded-3xl font-black text-center text-xl tracking-[0.2em] uppercase focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                 />
              </div>

              <div className="flex items-center gap-2 px-2">
                 <input 
                    type="checkbox" 
                    id="remember" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    className="w-4 h-4 rounded border-gray-200 text-orange-500" 
                 />
                 <label htmlFor="remember" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Remember Me</label>
              </div>

              <button type="submit" className="w-full py-5 bg-orange-500 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
                Enter System
              </button>
           </form>

           <div className="mt-12 text-center">
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Secured by Cloud Integration</p>
           </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Stats' },
    { id: 'booking', icon: 'fa-bus', label: 'Seats' },
    { id: 'revenue', icon: 'fa-sack-dollar', label: 'Cash' },
    { id: 'expenses', icon: 'fa-file-invoice-dollar', label: 'Cost' },
    { id: 'log', icon: 'fa-clipboard-list', label: 'Log' },
    { id: 'edit', icon: 'fa-user-pen', label: 'Edit' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-24 bg-[#001D4A] flex-col items-center justify-between py-8 shadow-2xl z-50">
        <div className="flex flex-col items-center w-full">
          <img src={BUSINESS_INFO.logo} alt="Logo" className="w-14 mb-12" />
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full py-5 flex flex-col items-center transition-all ${activeTab === item.id ? 'bg-orange-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
              <i className={`fas ${item.icon} text-xl mb-1`}></i>
              <span className="text-[9px] font-black uppercase">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center gap-6">
          {isAdminAuthenticated && (
            <button onClick={() => setActiveTab('admin')} className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all ${activeTab === 'admin' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/40'}`}>
              <i className="fas fa-user-shield text-xl"></i>
            </button>
          )}
          <button onClick={() => setShowLogoutConfirm(true)} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-500"><i className="fas fa-power-off text-xl"></i></button>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[75px] bg-[#001D4A]/95 backdrop-blur-md flex items-center justify-around z-[100] border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] px-1 pb-safe">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all py-2 rounded-2xl mx-0.5 ${activeTab === item.id ? 'bg-orange-500 text-white shadow-lg' : 'text-white/30'}`}>
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="text-[7px] font-black uppercase tracking-tight">{item.label}</span>
          </button>
        ))}
        {isAdminAuthenticated && (
          <button onClick={() => setActiveTab('admin')} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all py-2 rounded-2xl mx-0.5 ${activeTab === 'admin' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/30'}`}>
            <i className="fas fa-user-shield text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tight">Admin</span>
          </button>
        )}
      </nav>

      <main className="flex-grow md:ml-24 p-4 md:p-10 pb-24 md:pb-10">
        <header className="flex justify-between items-center mb-6 md:mb-10">
            <div className="flex items-center gap-3">
               <div className="md:hidden w-10 h-10 bg-white p-2 rounded-xl shadow-sm"><img src={BUSINESS_INFO.logo} className="w-full" /></div>
               <div>
                  <h2 className="text-xl md:text-3xl font-black text-[#001D4A] uppercase tracking-tighter leading-none">{activeTab === 'booking' ? 'Seat Plan' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Online Now: {onlineAgents.map(a => a.name).join(', ') || 'No active agents'}
                    </p>
                  </div>
               </div>
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} className="md:hidden w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><i className="fas fa-power-off"></i></button>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'booking' && (
            <div className="animate-in fade-in duration-500 space-y-6">
               <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3 sticky top-0 z-40 overflow-x-auto no-scrollbar">
                  <select value={selectedBusIndex} onChange={(e) => setSelectedBusIndex(Number(e.target.value))} className="bg-transparent font-black text-[#001D4A] outline-none text-sm uppercase tracking-widest cursor-pointer appearance-none px-4">
                    {buses.map((bus, idx) => <option key={bus.busId} value={idx}>{bus.busId}</option>)}
                  </select>
                  <div className="h-4 w-[1px] bg-gray-200"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-sm animate-pulse"></div>
                    <span className="text-[8px] font-black uppercase text-gray-400">Reserved (Hold)</span>
                  </div>
               </div>
               {buses.length > 0 ? (
                 <div className="flex justify-center w-full">
                    <BusLayout seats={buses[selectedBusIndex]?.seats || []} onSeatClick={handleSeatClick} />
                 </div>
               ) : <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200"><p className="text-gray-400 font-black uppercase text-xs tracking-widest">No Active Routes</p></div>}
            </div>
          )}
          {activeTab === 'dashboard' && <Dashboard buses={buses} expenses={expenses} />}
          {activeTab === 'log' && <BookingLog buses={buses} bookers={bookers} />}
          {activeTab === 'expenses' && <ExpenseTracker expenses={expenses} onSubmit={handleExpenseSubmit} onDelete={handleExpenseDelete} bookers={bookers} initialAgentCode={authenticatedAgent?.code} tours={tours} isAdmin={isAdminAuthenticated} />}
          {activeTab === 'revenue' && <RevenueReport buses={buses} expenses={expenses} tours={tours} />}
          {activeTab === 'edit' && <EditData buses={buses} onUpdate={handleBookingSubmit} onDelete={handleBookingDelete} onBulkDelete={handleBulkDelete} onEdit={(info) => { setEditingInfo(info); setSelectedSeatId(info.seatNo); setShowBookingModal(true); }} bookers={bookers} isAdmin={isAdminAuthenticated} />}
          {activeTab === 'admin' && isAdminAuthenticated && (
            <AdminPanel 
              tours={tours} onUpsertTour={handleTourUpsert} onDeleteTour={handleTourDelete}
              agents={bookers} onUpsertAgent={handleAgentUpsert} onDeleteAgent={handleAgentDelete}
              customerTypes={customerTypes} onUpsertCustomerType={handleCustomerTypeUpsert} onDeleteCustomerType={handleCustomerTypeDelete}
              buses={buses}
            />
          )}
        </div>
      </main>

      {showLogoutConfirm && <ConfirmationDialog message="Are you sure you want to end your session?" onConfirm={() => { setAuthenticatedAgent(null); setIsAdminAuthenticated(false); setShowLogoutConfirm(false); localStorage.removeItem('tl_auth_agent'); sessionStorage.removeItem('tl_auth_agent'); localStorage.removeItem('tl_auth_admin'); sessionStorage.removeItem('tl_auth_admin'); }} onCancel={() => setShowLogoutConfirm(false)} />}
      {showBookingModal && <BookingModal seatId={selectedSeatId!} busNo={editingInfo ? editingInfo.busNo : (buses[selectedBusIndex]?.busId || '')} onClose={() => { releaseLock(buses[selectedBusIndex].busId, selectedSeatId!); setShowBookingModal(false); setEditingInfo(null); }} onSubmit={handleBookingSubmit} tours={tours} bookers={bookers} customerTypes={customerTypes} existingData={editingInfo || undefined} isAdmin={isAdminAuthenticated} />}
      {showDetailModal && editingInfo && <SeatDetailModal info={editingInfo} onClose={() => { setShowDetailModal(false); setEditingInfo(null); }} onEdit={() => { setShowDetailModal(false); setShowBookingModal(true); }} onCancel={() => { handleBookingDelete(editingInfo.busNo, editingInfo.seatNo); setShowDetailModal(false); }} onUpdate={handleBookingSubmit} isAdmin={isAdminAuthenticated} />}
    </div>
  );
};

export default App;


import React, { useState, useEffect, useCallback } from 'react';
import { BUSINESS_INFO, generateInitialSeats, TOURS, BOOKERS, CUSTOMER_TYPES } from './constants';
import { BusData, BookingInfo, Tour, Booker, CustomerType } from './types';
import BusLayout from './components/BusLayout';
import BookingModal from './components/BookingModal';
import ConfirmationDialog from './components/ConfirmationDialog';
import Dashboard from './components/Dashboard';
import BookingLog from './components/BookingLog';
import EditData from './components/EditData';
import AdminPanel from './components/AdminPanel';
import SeatDetailModal from './components/SeatDetailModal';
import SecurityModal from './components/SecurityModal';
import { supabase } from './supabase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'booking' | 'dashboard' | 'log' | 'edit' | 'admin'>('booking');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedBusIndex, setSelectedBusIndex] = useState(0);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmDeselect, setShowConfirmDeselect] = useState(false);
  const [editingInfo, setEditingInfo] = useState<BookingInfo | null>(null);
  const [seatToDeselect, setSeatToDeselect] = useState<{ busId: string, seatId: string } | null>(null);

  const [securityModal, setSecurityModal] = useState<{
    isOpen: boolean;
    targetInfo: BookingInfo;
    action: 'edit' | 'delete';
  } | null>(null);

  const [tours, setTours] = useState<Tour[]>([]);
  const [bookers, setBookers] = useState<Booker[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [toursRes, bookersRes, typesRes, bookingsRes] = await Promise.all([
        supabase.from('tl_tours').select('*').order('name'),
        supabase.from('tl_agents').select('*').order('name'),
        supabase.from('tl_customer_types').select('*').order('type'),
        supabase.from('tl_bookings').select('*')
      ]);

      if (toursRes.error) console.error("Tours Error:", toursRes.error);
      if (bookersRes.error) console.error("Agents Error:", bookersRes.error);

      const fetchedTours = toursRes.data || [];
      const fetchedBookers = bookersRes.data || [];
      const fetchedTypes = typesRes.data || [];
      const fetchedBookings: any[] = bookingsRes.data || [];

      const mappedBookings: BookingInfo[] = fetchedBookings.map(b => ({
        id: b.id,
        name: b.name,
        mobile: b.mobile,
        address: b.address,
        gender: b.gender,
        religion: b.religion,
        tourName: b.tour_name,
        tourFees: b.tour_fees,
        customerType: b.customer_type,
        customerTypeFees: b.customer_type_fees,
        discountAmount: b.discount_amount,
        advanceAmount: b.advance_amount,
        dueAmount: b.due_amount,
        paymentStatus: b.payment_status,
        busNo: b.bus_no,
        seatNo: b.seat_no,
        bookedBy: b.booked_by,
        bookerCode: b.booker_code,
        bookingDate: b.booking_date
      }));

      setTours(fetchedTours);
      setBookers(fetchedBookers);
      setCustomerTypes(fetchedTypes);

      const busLayouts = fetchedTours.map(t => {
        const seats = generateInitialSeats();
        mappedBookings.forEach(booking => {
          if (booking.busNo === t.name) {
            const seatIdx = seats.findIndex(s => s.id === booking.seatNo);
            if (seatIdx !== -1) {
              seats[seatIdx] = { ...seats[seatIdx], isBooked: true, bookingInfo: booking };
            }
          }
        });
        return { busId: t.name, seats };
      });
      setBuses(busLayouts);
    } catch (error) {
      console.error("Critical Cloud Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('tl_realtime_v2')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handleBookingSubmit = async (info: BookingInfo) => {
    try {
      const { error } = await supabase.from('tl_bookings').upsert({
        id: info.id,
        name: info.name,
        mobile: info.mobile,
        address: info.address,
        gender: info.gender,
        religion: info.religion,
        tour_name: info.tourName,
        tour_fees: info.tourFees,
        customer_type: info.customerType,
        customer_type_fees: info.customerTypeFees,
        discount_amount: info.discountAmount,
        advance_amount: info.advanceAmount,
        due_amount: info.dueAmount,
        payment_status: info.paymentStatus,
        bus_no: info.busNo,
        seat_no: info.seatNo,
        booked_by: info.bookedBy,
        booker_code: info.bookerCode,
        booking_date: info.bookingDate
      });
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert("Booking failed. Please check your cloud connection.");
    }
    setShowBookingModal(false);
    setShowDetailModal(false);
    setSelectedSeatId(null);
    setEditingInfo(null);
  };

  const confirmDeselect = async () => {
    if (seatToDeselect) {
      const bus = buses.find(b => b.busId === seatToDeselect.busId);
      const seat = bus?.seats.find(s => s.id === seatToDeselect.seatId);
      if (seat?.bookingInfo) {
        try {
          const { error } = await supabase.from('tl_bookings').delete().eq('id', seat.bookingInfo.id);
          if (error) throw error;
          fetchData();
        } catch (error) {
          alert("Cancellation failed.");
        }
      }
    }
    setShowConfirmDeselect(false);
    setSeatToDeselect(null);
  };

  const syncAdminTours = async (newTours: Tour[]) => {
    try {
      await supabase.from('tl_tours').delete().neq('name', '___'); 
      if (newTours.length > 0) {
        const { error } = await supabase.from('tl_tours').insert(newTours);
        if (error) throw error;
      }
      fetchData();
    } catch (e) { alert("Failed to sync tours."); }
  };

  const syncAdminAgents = async (newAgents: Booker[]) => {
    try {
      await supabase.from('tl_agents').delete().neq('code', '___');
      if (newAgents.length > 0) {
        const { error } = await supabase.from('tl_agents').insert(newAgents);
        if (error) throw error;
      }
      fetchData();
    } catch (e) { alert("Failed to sync agents."); }
  };

  const syncAdminTypes = async (newTypes: CustomerType[]) => {
    try {
      await supabase.from('tl_customer_types').delete().neq('type', '___');
      if (newTypes.length > 0) {
        const { error } = await supabase.from('tl_customer_types').insert(newTypes);
        if (error) throw error;
      }
      fetchData();
    } catch (e) { alert("Failed to sync categories."); }
  };

  const seedDatabase = async () => {
    if (confirm("This will populate your cloud database with default tours and agents. Continue?")) {
      setIsLoading(true);
      try {
        await Promise.all([
          supabase.from('tl_tours').insert(TOURS),
          supabase.from('tl_agents').insert(BOOKERS),
          supabase.from('tl_customer_types').insert(CUSTOMER_TYPES)
        ]);
        await fetchData();
        alert("Cloud Initialized Successfully!");
      } catch (e) {
        alert("Initialization failed. Check if tables exist.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSeatClick = (seatId: string) => {
    if (buses.length === 0) return;
    const bus = buses[selectedBusIndex];
    if (!bus) return;
    const seat = bus.seats.find(s => s.id === seatId);
    setSelectedSeatId(seatId);
    if (seat?.isBooked && seat.bookingInfo) {
      setEditingInfo(seat.bookingInfo);
      setShowDetailModal(true);
    } else {
      setShowBookingModal(true);
    }
  };

  const handleEditSeatRequest = (info: BookingInfo) => {
    setShowDetailModal(false);
    setSecurityModal({ isOpen: true, targetInfo: info, action: 'edit' });
  };

  const triggerCancelBooking = (busId: string, seatId: string) => {
    const bus = buses.find(b => b.busId === busId);
    const seat = bus?.seats.find(s => s.id === seatId);
    if (seat?.bookingInfo) {
      setShowDetailModal(false);
      setSecurityModal({ isOpen: true, targetInfo: seat.bookingInfo, action: 'delete' });
    }
  };

  const handleSecurityVerify = (code: string) => {
    if (!securityModal) return;
    if (code.toUpperCase() === securityModal.targetInfo.bookerCode.toUpperCase()) {
      const { action, targetInfo } = securityModal;
      setSecurityModal(null);
      if (action === 'edit') {
        setEditingInfo(targetInfo);
        setSelectedSeatId(targetInfo.seatNo);
        setShowBookingModal(true);
      } else if (action === 'delete') {
        setSeatToDeselect({ busId: targetInfo.busNo, seatId: targetInfo.seatNo });
        setShowConfirmDeselect(true);
      }
    } else {
      alert("Unauthorized Agent Code!");
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === "@Rana&01625@") {
      setIsAdminAuthenticated(true);
      setShowAdminLogin(false);
      setActiveTab('admin');
      setAdminPasswordInput('');
    } else {
      alert("Incorrect Admin Password!");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#001D4A] text-white">
        <img src={BUSINESS_INFO.logo} className="w-32 animate-pulse mb-8" />
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce delay-75"></div>
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce delay-150"></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Syncing with Tour লাগবে Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans overflow-hidden relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-[55] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <nav className={`fixed md:sticky top-0 h-full transition-all duration-300 ease-in-out bg-[#001D4A] text-white flex flex-col shadow-2xl z-[60] shrink-0 ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:w-20 md:translate-x-0'}`}>
        <div className={`p-8 text-center border-b border-white/10 ${!isSidebarOpen && 'md:p-4'}`}>
          <img src={BUSINESS_INFO.logo} alt="Logo" className={`${isSidebarOpen ? 'w-24' : 'w-10'} transition-all mx-auto mb-2`} />
          {isSidebarOpen && <h1 className="text-2xl font-black text-white">{BUSINESS_INFO.name}</h1>}
        </div>
        <div className="flex-grow py-6 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
            { id: 'booking', icon: 'fa-ticket-alt', label: 'Seat Booking' },
            { id: 'log', icon: 'fa-clipboard-list', label: 'Response Section' },
            { id: 'edit', icon: 'fa-user-edit', label: 'Editor' },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-8 py-4 text-sm font-semibold transition-all group ${activeTab === tab.id ? 'bg-orange-500 text-white shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'} ${!isSidebarOpen && 'md:px-0 md:justify-center'}`}>
              <i className={`fas ${tab.icon} w-6 text-center transition-transform group-hover:scale-110`}></i>
              {isSidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
          <div className={`pt-8 ${isSidebarOpen ? 'px-4' : 'px-1'}`}>
            <div className="border-t border-white/10 pt-4">
              <button onClick={() => setShowAdminLogin(true)} className={`w-full flex items-center gap-4 py-4 text-sm font-bold rounded-2xl transition-all ${activeTab === 'admin' ? 'bg-white text-[#001D4A]' : 'bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600/50'} ${isSidebarOpen ? 'px-6' : 'justify-center'}`}>
                <i className="fas fa-user-shield"></i>
                {isSidebarOpen && <span>Admin Control</span>}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow h-screen overflow-auto relative flex flex-col">
        <header className="sticky top-0 left-0 w-full bg-[#001D4A] text-white p-4 flex items-center justify-between z-50 md:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl"><i className="fas fa-bars"></i></button>
          <div className="flex items-center gap-2"><img src={BUSINESS_INFO.logo} className="h-8" /><span className="font-bold text-xs uppercase tracking-tighter">{BUSINESS_INFO.name}</span></div>
          <div className="w-10"></div>
        </header>

        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex absolute top-6 left-6 z-[70] bg-[#001D4A] text-white w-10 h-10 rounded-xl items-center justify-center shadow-lg hover:bg-orange-500 transition-colors">
          <i className={`fas ${isSidebarOpen ? 'fa-angle-left' : 'fa-angle-right'}`}></i>
        </button>

        <div className="p-4 md:p-10 flex-grow">
          {activeTab === 'booking' && (
            <div className="max-w-6xl mx-auto md:pl-12">
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div>
                  <h2 className="text-3xl font-black text-[#001D4A]">Seat Booking</h2>
                  <p className="text-sm text-gray-400">Cloud synchronized terminals.</p>
                </div>
                {buses.length > 0 && (
                  <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border shadow-sm">
                    <span className="text-[10px] font-black uppercase text-gray-400 pl-2">Selected Tour:</span>
                    <select value={selectedBusIndex} onChange={(e) => setSelectedBusIndex(Number(e.target.value))} className="bg-transparent font-black text-[#001D4A] outline-none min-w-[150px] p-2">
                      {buses.map((bus, idx) => <option key={bus.busId} value={idx}>{bus.busId}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {buses.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-7 overflow-x-auto pb-4">
                    <div className="min-w-[320px] bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-gray-100">
                      <BusLayout seats={buses[selectedBusIndex]?.seats || []} onSeatClick={handleSeatClick} />
                    </div>
                  </div>
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">
                      <h3 className="font-black text-[#001D4A] mb-6 flex items-center gap-3">Visual Key</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                        {[{c:'bg-green-500',l:'Vacant'},{c:'bg-red-500',l:'Male'},{c:'bg-pink-500',l:'Female'},{c:'bg-blue-500',l:'Special'},{c:'bg-yellow-500',l:'Gold'}].map((item,i)=>(
                          <div key={i} className="flex items-center gap-4"><div className={`${item.c} w-10 h-10 rounded-xl`}></div><span className="text-sm font-bold text-gray-700">{item.l}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 text-4xl mb-6"><i className="fas fa-map-marked-alt"></i></div>
                  <h3 className="text-xl font-black text-gray-400">No Active Tours Found</h3>
                  <p className="text-sm text-gray-400 mb-8">Go to Admin Control to initialize your fleet.</p>
                  <button onClick={() => setShowAdminLogin(true)} className="px-8 py-3 bg-[#001D4A] text-white rounded-xl font-black">Open Admin Panel</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard buses={buses} />}
          {activeTab === 'log' && <BookingLog buses={buses} />}
          {activeTab === 'edit' && <EditData buses={buses} onUpdate={handleBookingSubmit} onDelete={triggerCancelBooking} onEdit={handleEditSeatRequest} bookers={bookers} />}
          {activeTab === 'admin' && isAdminAuthenticated && (
            <AdminPanel 
              tours={tours} setTours={syncAdminTours} 
              agents={bookers} setAgents={syncAdminAgents} 
              customerTypes={customerTypes} setCustomerTypes={syncAdminTypes} 
              buses={buses}
              onSeed={seedDatabase}
            />
          )}
        </div>
      </main>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#001D4A]/90 backdrop-blur-md">
           <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-[#001D4A] mb-2 text-center">Admin Access</h3>
              <p className="text-sm text-gray-400 text-center mb-6">Enter secure password</p>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input autoFocus type="password" placeholder="Password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-center" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg">Login</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {securityModal?.isOpen && <SecurityModal info={securityModal.targetInfo} action={securityModal.action} onClose={() => setSecurityModal(null)} onVerify={handleSecurityVerify} />}
      {showBookingModal && <BookingModal seatId={selectedSeatId!} busNo={editingInfo ? editingInfo.busNo : (buses[selectedBusIndex]?.busId || '')} onClose={() => { setShowBookingModal(false); setSelectedSeatId(null); setEditingInfo(null); }} onSubmit={handleBookingSubmit} tours={tours} bookers={bookers} customerTypes={customerTypes} existingData={editingInfo || undefined} />}
      {showDetailModal && editingInfo && <SeatDetailModal info={editingInfo} onClose={() => { setShowDetailModal(false); setEditingInfo(null); }} onEdit={() => handleEditSeatRequest(editingInfo)} onCancel={() => triggerCancelBooking(editingInfo.busNo, editingInfo.seatNo)} onUpdate={handleBookingSubmit} />}
      {showConfirmDeselect && <ConfirmationDialog message="Are you sure you want to cancel this booking? This action is irreversible." onConfirm={confirmDeselect} onCancel={() => setShowConfirmDeselect(false)} />}
    </div>
  );
};

export default App;

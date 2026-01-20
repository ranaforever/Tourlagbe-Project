
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
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('tl_realtime_v3')
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
      alert("Sync failed.");
    }
    setShowBookingModal(false);
    setShowDetailModal(false);
  };

  const confirmDeselect = async () => {
    if (seatToDeselect) {
      const bus = buses.find(b => b.busId === seatToDeselect.busId);
      const seat = bus?.seats.find(s => s.id === seatToDeselect.seatId);
      if (seat?.bookingInfo) {
        try {
          await supabase.from('tl_bookings').delete().eq('id', seat.bookingInfo.id);
          fetchData();
        } catch (error) {
          alert("Cancel failed.");
        }
      }
    }
    setShowConfirmDeselect(false);
  };

  const syncAdminTours = async (newTours: Tour[]) => {
    await supabase.from('tl_tours').delete().neq('name', '___'); 
    if (newTours.length > 0) await supabase.from('tl_tours').insert(newTours);
    fetchData();
  };

  const syncAdminAgents = async (newAgents: Booker[]) => {
    await supabase.from('tl_agents').delete().neq('code', '___');
    if (newAgents.length > 0) await supabase.from('tl_agents').insert(newAgents);
    fetchData();
  };

  const syncAdminTypes = async (newTypes: CustomerType[]) => {
    await supabase.from('tl_customer_types').delete().neq('type', '___');
    if (newTypes.length > 0) await supabase.from('tl_customer_types').insert(newTypes);
    fetchData();
  };

  const seedDatabase = async () => {
    if (confirm("Seed database?")) {
      setIsLoading(true);
      await Promise.all([
        supabase.from('tl_tours').insert(TOURS),
        supabase.from('tl_agents').insert(BOOKERS),
        supabase.from('tl_customer_types').insert(CUSTOMER_TYPES)
      ]);
      await fetchData();
      setIsLoading(false);
    }
  };

  const handleSeatClick = (seatId: string) => {
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
      alert("Invalid Code!");
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === "@Rana&01625@") {
      setIsAdminAuthenticated(true);
      setShowAdminLogin(false);
      setActiveTab('admin');
    } else {
      alert("Access Denied!");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#001D4A] text-white">
        <img src={BUSINESS_INFO.logo} className="w-24 animate-pulse mb-8" />
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Stats' },
    { id: 'booking', icon: 'fa-bus', label: 'Seats' },
    { id: 'log', icon: 'fa-clipboard-list', label: 'Log' },
    { id: 'edit', icon: 'fa-user-pen', label: 'Edit' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative overflow-x-hidden">
      
      {/* Desktop Sidebar (Left) */}
      <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-24 bg-[#001D4A] flex-col items-center justify-between py-8 shadow-2xl z-50 border-r border-white/5">
        <div className="flex flex-col items-center w-full">
          <img src={BUSINESS_INFO.logo} alt="Logo" className="w-14 mb-12 hover:scale-105 transition-transform" />
          <div className="flex flex-col w-full">
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id as any)} 
                className={`w-full py-6 flex flex-col items-center transition-all relative ${activeTab === item.id ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                <i className={`fas ${item.icon} text-2xl mb-1`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                {activeTab === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20"></div>}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full flex flex-col items-center pb-4 px-2">
          <div className="w-full h-[1px] bg-white/10 mb-8"></div>
          <button 
            onClick={() => setShowAdminLogin(true)} 
            className={`w-16 h-16 flex items-center justify-center rounded-[20px] transition-all ${activeTab === 'admin' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
          >
            <i className="fas fa-user-shield text-2xl"></i>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#001D4A] flex items-center justify-around z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] border-t border-white/5">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id as any)} 
            className={`flex-1 h-full flex flex-col items-center justify-center transition-all ${activeTab === item.id ? 'bg-orange-500 text-white' : 'text-white/40'}`}
          >
            <i className={`fas ${item.icon} text-xl mb-1`}></i>
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
        <button 
          onClick={() => setShowAdminLogin(true)} 
          className={`flex-1 h-full flex flex-col items-center justify-center transition-all ${activeTab === 'admin' ? 'bg-orange-500 text-white' : 'text-white/40'}`}
        >
          <i className="fas fa-user-shield text-xl mb-1"></i>
          <span className="text-[8px] font-black uppercase tracking-tighter">Admin</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-grow min-h-screen pb-20 md:pb-10 md:ml-24 overflow-x-hidden`}>
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          {activeTab === 'booking' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-[#001D4A] tracking-tighter">Fleet Terminal</h2>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Live Cloud Access Enabled</p>
                </div>
                {buses.length > 0 && (
                  <div className="flex items-center gap-3 bg-white p-2 md:p-3 rounded-[24px] border shadow-xl w-full md:w-auto overflow-hidden">
                    <span className="text-[10px] font-black uppercase text-gray-300 pl-3 shrink-0">Route:</span>
                    <select value={selectedBusIndex} onChange={(e) => setSelectedBusIndex(Number(e.target.value))} className="bg-transparent font-black text-[#001D4A] outline-none w-full md:min-w-[180px] text-sm pr-4 appearance-none cursor-pointer">
                      {buses.map((bus, idx) => <option key={bus.busId} value={idx}>{bus.busId}</option>)}
                    </select>
                    <i className="fas fa-chevron-down text-gray-300 pr-3 pointer-events-none"></i>
                  </div>
                )}
              </div>
              
              {buses.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
                  <div className="lg:col-span-7 flex justify-center">
                    <BusLayout seats={buses[selectedBusIndex]?.seats || []} onSeatClick={handleSeatClick} />
                  </div>
                  <div className="lg:col-span-5 space-y-8">
                    <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl border border-gray-100">
                      <h3 className="font-black text-[#001D4A] mb-8 flex items-center gap-3 uppercase tracking-tighter text-sm border-b pb-4">
                        <i className="fas fa-palette text-orange-500"></i> Visual Dashboard
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
                        {[
                          {c:'bg-green-500',l:'Vacant Seat', d:'Ready for booking'},
                          {c:'bg-red-500',l:'Male (Muslim)', d:'Red category'},
                          {c:'bg-pink-500',l:'Female (Muslim)', d:'Pink category'},
                          {c:'bg-blue-500',l:'Male (Others)', d:'Blue category'},
                          {c:'bg-yellow-500',l:'Female (Others)', d:'Gold category'}
                        ].map((item,i)=>(
                          <div key={i} className="flex items-center gap-5 group p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                            <div className={`${item.c} w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl shadow-lg transition-transform group-hover:scale-110`}></div>
                            <div>
                                <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest leading-none mb-1">{item.l}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{item.d}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 md:py-32 bg-white rounded-[40px] md:rounded-[60px] border-4 border-dashed border-gray-100 text-center px-6">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 text-4xl md:text-5xl mb-8"><i className="fas fa-bus-simple"></i></div>
                  <h3 className="text-xl md:text-2xl font-black text-gray-400 uppercase tracking-widest">Fleet Terminal Offline</h3>
                  <p className="text-gray-300 mt-2 max-w-xs text-sm font-bold">Please initialize your tour routes and categories in the Admin Panel.</p>
                  <button onClick={() => setShowAdminLogin(true)} className="mt-8 px-10 py-4 bg-[#001D4A] text-white rounded-[24px] font-black shadow-2xl hover:bg-orange-500 transition-all active:scale-95">Go to Admin</button>
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

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#001D4A]/90 backdrop-blur-md">
           <div className="bg-white w-full max-w-sm rounded-[40px] p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-2xl md:text-3xl font-black text-[#001D4A] mb-2 text-center tracking-tighter">Admin Access</h3>
              <p className="text-[10px] font-bold text-gray-400 text-center mb-8 uppercase tracking-[0.2em]">Secure Authentication Required</p>
              <form onSubmit={handleAdminLogin} className="space-y-6">
                <input autoFocus type="password" placeholder="PASSWORD" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} className="w-full px-6 py-4 md:py-5 bg-gray-50 border-none rounded-[20px] focus:ring-2 focus:ring-orange-500 outline-none font-black text-center text-xl" />
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-[20px] transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-orange-500 text-white rounded-[20px] font-black shadow-xl hover:bg-orange-600 transition-all active:scale-95">Unlock</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {securityModal?.isOpen && <SecurityModal info={securityModal.targetInfo} action={securityModal.action} onClose={() => setSecurityModal(null)} onVerify={handleSecurityVerify} />}
      {showBookingModal && <BookingModal seatId={selectedSeatId!} busNo={editingInfo ? editingInfo.busNo : (buses[selectedBusIndex]?.busId || '')} onClose={() => { setShowBookingModal(false); setEditingInfo(null); }} onSubmit={handleBookingSubmit} tours={tours} bookers={bookers} customerTypes={customerTypes} existingData={editingInfo || undefined} />}
      {showDetailModal && editingInfo && <SeatDetailModal info={editingInfo} onClose={() => { setShowDetailModal(false); setEditingInfo(null); }} onEdit={() => handleEditSeatRequest(editingInfo)} onCancel={() => triggerCancelBooking(editingInfo.busNo, editingInfo.seatNo)} onUpdate={handleBookingSubmit} />}
      {showConfirmDeselect && <ConfirmationDialog message="Are you sure you want to cancel this booking permanently?" onConfirm={confirmDeselect} onCancel={() => setShowConfirmDeselect(false)} />}
    </div>
  );
};

export default App;

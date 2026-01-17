
import React, { useState, useEffect } from 'react';
import { BUSINESS_INFO, generateInitialSeats } from './constants';
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'booking' | 'dashboard' | 'log' | 'edit' | 'admin'>('booking');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const [selectedBusIndex, setSelectedBusIndex] = useState(0);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmDeselect, setShowConfirmDeselect] = useState(false);
  const [editingInfo, setEditingInfo] = useState<BookingInfo | null>(null);
  const [seatToDeselect, setSeatToDeselect] = useState<{ busId: string, seatId: string } | null>(null);

  // Security Verification State
  const [securityModal, setSecurityModal] = useState<{
    isOpen: boolean;
    targetInfo: BookingInfo;
    action: 'edit' | 'delete';
  } | null>(null);

  const [tours, setTours] = useState<Tour[]>(() => {
    const saved = localStorage.getItem('tl_tours');
    return saved ? JSON.parse(saved) : [
      { name: "Sajek Valley", fee: 4500 },
      { name: "Cox's Bazar Relax", fee: 6500 }
    ];
  });

  const [bookers, setBookers] = useState<Booker[]>(() => {
    const saved = localStorage.getItem('tl_bookers');
    return saved ? JSON.parse(saved) : [
      { code: "KS101", name: "Kazi Shetu" },
      { code: "SI202", name: "Sadekul Islam" }
    ];
  });

  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>(() => {
    const saved = localStorage.getItem('tl_customer_types');
    return saved ? JSON.parse(saved) : [
      { type: "Standard", fee: 0 },
      { type: "Solo", fee: 1500 }
    ];
  });

  const [buses, setBuses] = useState<BusData[]>(() => {
    const saved = localStorage.getItem('tour_lagbe_buses');
    if (saved) return JSON.parse(saved);
    return tours.map(t => ({
      busId: t.name,
      seats: generateInitialSeats()
    }));
  });

  const updateToursMaster = (newTours: Tour[], renameMap?: { oldName: string, newName: string }) => {
    setBuses(prevBuses => {
      let updatedBuses = [...prevBuses];
      if (renameMap) {
        updatedBuses = updatedBuses.map(b => {
          if (b.busId === renameMap.oldName) {
            return {
              ...b,
              busId: renameMap.newName,
              seats: b.seats.map(s => s.isBooked ? {
                ...s,
                bookingInfo: s.bookingInfo ? { ...s.bookingInfo, busNo: renameMap.newName, tourName: renameMap.newName } : undefined
              } : s)
            };
          }
          return b;
        });
      }
      return newTours.map(tour => {
        const existingBus = updatedBuses.find(b => b.busId === tour.name);
        return existingBus || { busId: tour.name, seats: generateInitialSeats() };
      });
    });
    setTours(newTours);
  };

  useEffect(() => {
    localStorage.setItem('tour_lagbe_buses', JSON.stringify(buses));
    localStorage.setItem('tl_tours', JSON.stringify(tours));
    localStorage.setItem('tl_bookers', JSON.stringify(bookers));
    localStorage.setItem('tl_customer_types', JSON.stringify(customerTypes));
  }, [buses, tours, bookers, customerTypes]);

  const handleSeatClick = (seatId: string) => {
    if (selectedBusIndex >= buses.length) return;
    const seat = buses[selectedBusIndex].seats.find(s => s.id === seatId);
    setSelectedSeatId(seatId);
    if (seat?.isBooked && seat.bookingInfo) {
      setEditingInfo(seat.bookingInfo);
      setShowDetailModal(true);
    } else {
      setShowBookingModal(true);
    }
  };

  const handleBookingSubmit = (info: BookingInfo) => {
    setBuses(prev => {
      let intermediate = prev;
      if (editingInfo && editingInfo.busNo !== info.busNo) {
        intermediate = intermediate.map(bus => {
          if (bus.busId !== editingInfo.busNo) return bus;
          return {
            ...bus,
            seats: bus.seats.map(s => s.id === editingInfo.seatNo ? { ...s, isBooked: false, bookingInfo: undefined } : s)
          };
        });
      }
      return intermediate.map(bus => {
        if (bus.busId !== info.busNo) return bus;
        return {
          ...bus,
          seats: bus.seats.map(s => 
            s.id === info.seatNo ? { ...s, isBooked: true, bookingInfo: info } : s
          )
        };
      });
    });
    setShowBookingModal(false);
    setShowDetailModal(false);
    setSelectedSeatId(null);
    setEditingInfo(null);
  };

  const triggerCancelBooking = (busId: string, seatId: string) => {
    const bus = buses.find(b => b.busId === busId);
    const seat = bus?.seats.find(s => s.id === seatId);
    const info = seat?.bookingInfo;

    if (info) {
      setShowDetailModal(false);
      setSecurityModal({
        isOpen: true,
        targetInfo: info,
        action: 'delete'
      });
    }
  };

  const handleEditSeatRequest = (info: BookingInfo) => {
    setShowDetailModal(false);
    setSecurityModal({
      isOpen: true,
      targetInfo: info,
      action: 'edit'
    });
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
      alert("Unauthorized Agent Code! Only the original booker can authorize this action.");
    }
  };

  const confirmDeselect = () => {
    if (seatToDeselect) {
      setBuses(prev => {
        return prev.map(bus => {
          if (bus.busId !== seatToDeselect.busId) return bus;
          return {
            ...bus,
            seats: bus.seats.map(s => 
              s.id === seatToDeselect.seatId ? { ...s, isBooked: false, bookingInfo: undefined } : s
            )
          };
        });
      });
    }
    setShowConfirmDeselect(false);
    setSeatToDeselect(null);
    setEditingInfo(null);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans overflow-hidden relative">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[55] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <nav className={`fixed md:sticky top-0 h-full transition-all duration-300 ease-in-out bg-[#001D4A] text-white flex flex-col shadow-2xl z-[60] shrink-0 
        ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:w-20 md:translate-x-0'}`}>
        
        <div className={`p-8 text-center border-b border-white/10 ${!isSidebarOpen && 'md:p-4'}`}>
          <img src={BUSINESS_INFO.logo} alt="Logo" className={`${isSidebarOpen ? 'w-24' : 'w-10'} transition-all drop-shadow-lg mx-auto mb-2`} />
          {isSidebarOpen && <h1 className="text-2xl font-black text-white">{BUSINESS_INFO.name}</h1>}
        </div>
        
        <div className="flex-grow py-6 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
            { id: 'booking', icon: 'fa-ticket-alt', label: 'Seat Booking' },
            { id: 'log', icon: 'fa-clipboard-list', label: 'Response Section' },
            { id: 'edit', icon: 'fa-user-edit', label: 'Editor' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-8 py-4 text-sm font-semibold transition-all group ${activeTab === tab.id ? 'bg-orange-500 text-white shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'} ${!isSidebarOpen && 'md:px-0 md:justify-center'}`}
            >
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
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl">
            <i className="fas fa-bars"></i>
          </button>
          <div className="flex items-center gap-2">
            <img src={BUSINESS_INFO.logo} alt="Logo" className="h-8" />
            <span className="font-bold text-xs uppercase tracking-tighter">{BUSINESS_INFO.name}</span>
          </div>
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
                  <p className="text-sm text-gray-400">Manage seating for your tour fleet.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border shadow-sm">
                  <span className="text-[10px] font-black uppercase text-gray-400 pl-2">Selected Tour:</span>
                  <select 
                    value={selectedBusIndex} 
                    onChange={(e) => setSelectedBusIndex(Number(e.target.value))}
                    className="bg-transparent font-black text-[#001D4A] outline-none min-w-[150px] p-2"
                  >
                    {buses.map((bus, idx) => <option key={bus.busId} value={idx}>{bus.busId}</option>)}
                  </select>
                </div>
              </div>
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
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard buses={buses} />}
          {activeTab === 'log' && <BookingLog buses={buses} />}
          {activeTab === 'edit' && <EditData buses={buses} onUpdate={handleBookingSubmit} onDelete={triggerCancelBooking} onEdit={handleEditSeatRequest} bookers={bookers} />}
          {activeTab === 'admin' && isAdminAuthenticated && (
            <AdminPanel 
              tours={tours} setTours={updateToursMaster} 
              agents={bookers} setAgents={setBookers} 
              customerTypes={customerTypes} setCustomerTypes={setCustomerTypes} 
              buses={buses}
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

      {securityModal?.isOpen && (
        <SecurityModal 
          info={securityModal.targetInfo} 
          action={securityModal.action}
          onClose={() => setSecurityModal(null)} 
          onVerify={handleSecurityVerify} 
        />
      )}

      {showBookingModal && (
        <BookingModal 
          seatId={selectedSeatId!} 
          busNo={editingInfo ? editingInfo.busNo : (buses[selectedBusIndex]?.busId || '')}
          onClose={() => { setShowBookingModal(false); setSelectedSeatId(null); setEditingInfo(null); }} 
          onSubmit={handleBookingSubmit}
          tours={tours}
          bookers={bookers}
          customerTypes={customerTypes}
          existingData={editingInfo || undefined}
        />
      )}

      {showDetailModal && editingInfo && (
        <SeatDetailModal 
          info={editingInfo} 
          onClose={() => { setShowDetailModal(false); setEditingInfo(null); }} 
          onEdit={() => handleEditSeatRequest(editingInfo)}
          onCancel={() => triggerCancelBooking(editingInfo.busNo, editingInfo.seatNo)}
          onUpdate={handleBookingSubmit}
        />
      )}

      {showConfirmDeselect && (
        <ConfirmationDialog message="Are you sure you want to cancel this booking? This action is irreversible." onConfirm={confirmDeselect} onCancel={() => setShowConfirmDeselect(false)} />
      )}
    </div>
  );
};

export default App;

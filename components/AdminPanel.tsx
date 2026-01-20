
import React, { useState, useMemo } from 'react';
import { Tour, Booker, CustomerType, BusData, BookingInfo } from '../types';
import { BUSINESS_INFO } from '../constants';

interface AdminPanelProps {
  tours: Tour[];
  setTours: (tours: Tour[]) => void;
  agents: Booker[];
  setAgents: (agents: Booker[]) => void;
  customerTypes: CustomerType[];
  setCustomerTypes: (types: CustomerType[]) => void;
  buses: BusData[];
  onSeed?: () => void;
  onDeleteTourCascading: (name: string) => void;
  onMasterReset: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  tours, setTours, 
  agents, setAgents, 
  customerTypes, setCustomerTypes,
  buses,
  onSeed,
  onDeleteTourCascading,
  onMasterReset
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tours' | 'agents' | 'types' | 'print' | 'food' | 'system'>('tours');
  
  const [newTour, setNewTour] = useState({ name: '', fee: 0 });
  const [newAgent, setNewAgent] = useState({ code: '', name: '' });
  const [newType, setNewType] = useState({ type: '', fee: 0 });

  const [editTourIndex, setEditTourIndex] = useState<number | null>(null);
  const [editTourData, setEditTourData] = useState<Tour | null>(null);

  const [editAgentIndex, setEditAgentIndex] = useState<number | null>(null);
  const [editAgentData, setEditAgentData] = useState<Booker | null>(null);

  const [editTypeIndex, setEditTypeIndex] = useState<number | null>(null);
  const [editTypeData, setEditTypeData] = useState<CustomerType | null>(null);

  const [selectedForPrint, setSelectedForPrint] = useState<string[]>([]);
  
  const [foodType, setFoodType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Special Item' | 'Snacks' | 'Refreshment'>('Breakfast');
  const [foodTime, setFoodTime] = useState('08:30 AM');
  const [foodFilterTour, setFoodFilterTour] = useState('');
  const [foodFilterBooker, setFoodFilterBooker] = useState('');

  const allBookings: BookingInfo[] = useMemo(() => 
    buses.flatMap(b => b.seats.filter(s => s.isBooked).map(s => s.bookingInfo!)),
    [buses]
  );

  const filteredFoodBookings = useMemo(() => {
    return allBookings.filter(b => {
      const matchTour = foodFilterTour === '' || b.tourName === foodFilterTour;
      const matchBooker = foodFilterBooker === '' || b.bookerCode === foodFilterBooker;
      return matchTour && matchBooker;
    });
  }, [allBookings, foodFilterTour, foodFilterBooker]);

  const addTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTour.name.trim()) return;
    const updated = [...tours, { name: newTour.name.trim(), fee: newTour.fee }];
    setTours(updated);
    setNewTour({ name: '', fee: 0 });
  };

  const saveTourEdit = () => {
    if (editTourIndex !== null && editTourData) {
      const updated = [...tours];
      updated[editTourIndex] = editTourData;
      setTours(updated);
      setEditTourIndex(null);
    }
  };

  const addAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.code.trim() || !newAgent.name.trim()) return;
    const updated = [...agents, { code: newAgent.code.trim().toUpperCase(), name: newAgent.name.trim() }];
    setAgents(updated);
    setNewAgent({ code: '', name: '' });
  };

  const saveAgentEdit = () => {
    if (editAgentIndex !== null && editAgentData) {
      const updated = [...agents];
      updated[editAgentIndex] = editAgentData;
      setAgents(updated);
      setEditAgentIndex(null);
    }
  };

  const removeAgent = (code: string) => {
    if (confirm(`Remove agent ${code}?`)) {
      setAgents(agents.filter(a => a.code !== code));
    }
  };

  const addType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.type.trim()) return;
    const updated = [...customerTypes, { type: newType.type.trim(), fee: newType.fee }];
    setCustomerTypes(updated);
    setNewType({ type: '', fee: 0 });
  };

  const saveTypeEdit = () => {
    if (editTypeIndex !== null && editTypeData) {
      const updated = [...customerTypes];
      updated[editTypeIndex] = editTypeData;
      setCustomerTypes(updated);
      setEditTypeIndex(null);
    }
  };

  const removeType = (index: number) => {
    if (confirm("Remove this category?")) {
      setCustomerTypes(customerTypes.filter((_, idx) => idx !== index));
    }
  };

  const handlePrintBatch = () => {
    if (selectedForPrint.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const bookingsToPrint = allBookings.filter(b => selectedForPrint.includes(b.id));
    
    const htmlContent = `
      <html>
        <head>
          <title>Batch Tickets - Tour লাগবে</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 0; }
            body { font-family: 'Inter', 'Hind Siliguri', sans-serif; background: white; margin: 0; padding: 0; }
            .ticket-grid { display: flex; flex-wrap: wrap; width: 210mm; height: 297mm; align-content: flex-start; }
            .ticket-item { 
              width: 50%; 
              height: 25%; 
              border: 0.5pt dashed #ccc; 
              padding: 20px; 
              box-sizing: border-box; 
              display: flex; 
              flex-direction: column; 
              justify-content: space-between;
              break-inside: avoid;
              overflow: hidden;
            }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body onload="window.print()">
          <div class="ticket-grid">
            ${bookingsToPrint.map(info => {
              const qrData = `ID:${info.id}|Seat:${info.seatNo}|Name:${info.name}`;
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;
              
              return `
                <div class="ticket-item">
                  <div class="flex justify-between items-start">
                    <div class="flex items-center gap-4">
                      <img src="${BUSINESS_INFO.logo}" class="h-14" />
                      <div class="flex flex-col">
                        <h1 class="font-black text-sm text-indigo-900 leading-none">${BUSINESS_INFO.name}</h1>
                        <p class="text-[7px] font-bold uppercase text-gray-400 tracking-[0.2em] mt-0.5">${BUSINESS_INFO.motto}</p>
                      </div>
                    </div>
                    <div class="bg-indigo-900 text-white px-4 py-1.5 rounded-xl flex flex-col items-center">
                      <span class="text-[7px] font-black uppercase opacity-60">Seat</span>
                      <span class="text-2xl font-black leading-none">${info.seatNo}</span>
                    </div>
                  </div>

                  <div class="flex gap-2 border-y border-dashed border-gray-100 py-3 my-2">
                    <div class="flex-grow space-y-1.5">
                      <div>
                        <p class="text-[7px] font-black uppercase text-gray-400">Passenger</p>
                        <p class="text-[11px] font-black text-gray-800 leading-none">${info.name}</p>
                      </div>
                      <div>
                        <p class="text-[7px] font-black uppercase text-gray-400">Tour Identity</p>
                        <p class="text-[9px] font-bold text-gray-700 leading-none">${info.tourName}</p>
                      </div>
                      <div class="flex gap-5">
                        <div><p class="text-[7px] font-black text-gray-400 uppercase">Paid</p><p class="text-[11px] font-black text-green-600">৳${info.advanceAmount}</p></div>
                        <div><p class="text-[7px] font-black text-gray-400 uppercase">Due</p><p class="text-[11px] font-black text-red-600">৳${info.dueAmount}</p></div>
                      </div>
                    </div>
                    <div class="shrink-0 flex flex-col items-center">
                      <img src="${qrCodeUrl}" class="w-14 h-14" />
                      <p class="text-[6px] text-gray-300 mt-1 font-bold uppercase tracking-widest">ID: ${info.id.slice(0,8)}</p>
                    </div>
                  </div>

                  <div class="flex justify-between items-end">
                    <div class="text-[7px] font-bold text-gray-400 leading-tight uppercase tracking-tighter">
                      <p>Agent: ${info.bookedBy}</p>
                      <p>Date: ${new Date(info.bookingDate).toLocaleDateString()}</p>
                    </div>
                    <span class="px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${info.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}">
                      ${info.paymentStatus}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintFoodTokens = () => {
    if (selectedForPrint.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const bookingsToPrint = allBookings.filter(b => selectedForPrint.includes(b.id));

    const htmlContent = `
      <html>
        <head>
          <title>Food Tokens - Tour লাগবে</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 0; }
            body { font-family: 'Inter', sans-serif; background: white; margin: 0; padding: 0; }
            .token-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              grid-template-rows: repeat(6, 1fr);
              width: 210mm; 
              height: 297mm; 
              box-sizing: border-box;
            }
            .token-item { 
              border: 0.1pt dashed #aaa; 
              padding: 12px; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: space-between;
              text-align: center;
              position: relative;
              overflow: hidden;
              box-sizing: border-box;
              break-inside: avoid;
            }
            .token-watermark {
              position: absolute;
              font-size: 40px;
              font-weight: 900;
              color: rgba(0,0,0,0.035);
              transform: rotate(-15deg);
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-15deg);
            }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body onload="window.print()">
          <div class="token-grid">
            ${bookingsToPrint.map(info => `
              <div class="token-item">
                <div class="token-watermark">${foodType.toUpperCase()}</div>
                
                <div class="relative z-10 flex flex-col items-center">
                   <img src="${BUSINESS_INFO.logo}" class="h-10 mb-2" />
                   <h2 class="text-[11px] font-black text-indigo-900 uppercase tracking-[0.2em] leading-none mb-1">${foodType}</h2>
                </div>
                
                <div class="relative z-10 w-full">
                   <p class="text-[12px] font-black text-gray-800 leading-tight mb-2">${info.name}</p>
                   <div class="bg-[#001D4A] text-white rounded-[10px] px-3 py-1.5 inline-block shadow-sm">
                      <p class="text-[10px] font-black uppercase tracking-widest">Seat: ${info.seatNo}</p>
                   </div>
                </div>

                <div class="relative z-10 flex flex-col items-center">
                   <span class="text-[8px] font-black text-orange-500 uppercase tracking-[0.1em] mb-1">Serving Time</span>
                   <span class="text-[14px] font-black text-gray-900 leading-none">${foodTime}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const navTabs = [
    { id: 'tours', label: 'Tours', icon: 'fa-route' },
    { id: 'agents', label: 'Agents', icon: 'fa-user-tie' },
    { id: 'types', label: 'Pricing', icon: 'fa-tags' },
    { id: 'print', label: 'Tickets', icon: 'fa-print' },
    { id: 'food', label: 'Food', icon: 'fa-utensils' },
    { id: 'system', label: 'System', icon: 'fa-microchip' }
  ];

  return (
    <div className="max-w-4xl mx-auto md:pl-12 pb-20 px-2 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 px-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#001D4A] tracking-tighter uppercase">Admin Panel</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global System Configuration</p>
        </div>
      </div>

      {/* Grid-based Sub-Nav: All options visible on all screens */}
      <div className="grid grid-cols-3 md:flex md:flex-wrap bg-white p-1.5 rounded-[28px] shadow-sm mb-8 gap-1.5 border">
        {navTabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveSubTab(tab.id as any)} 
            className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 py-3.5 md:px-6 md:py-4 rounded-[20px] transition-all uppercase ${activeSubTab === tab.id ? 'bg-[#001D4A] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <i className={`fas ${tab.icon} text-sm md:text-xs`}></i>
            <span className="font-black text-[8px] md:text-[10px] tracking-tight md:tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeSubTab === 'tours' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={addTour} className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border flex flex-col gap-5">
            <h4 className="font-black text-[10px] uppercase text-[#001D4A] tracking-widest border-l-4 border-orange-500 pl-3">Add New Route</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400">Tour Name</label><input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm" placeholder="e.g. Sajek Valley" value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} /></div>
               <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400">Base Fee (৳)</label><input required type="number" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm" placeholder="4500" value={newTour.fee || ''} onChange={e => setNewTour({...newTour, fee: Number(e.target.value)})} /></div>
            </div>
            <button type="submit" className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest active:scale-95 transition-all">Register Route</button>
          </form>

          <div className="space-y-3">
             {tours.map((t, i) => (
               <div key={i} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="flex-grow">
                    {editTourIndex === i ? (
                       <div className="flex gap-2">
                          <input className="px-3 py-2 border rounded-xl w-full text-xs font-bold" value={editTourData?.name || ''} onChange={e => setEditTourData({...editTourData!, name: e.target.value})} />
                          <input type="number" className="px-3 py-2 border rounded-xl w-24 text-xs font-bold" value={editTourData?.fee || 0} onChange={e => setEditTourData({...editTourData!, fee: Number(e.target.value)})} />
                       </div>
                    ) : (
                       <>
                          <p className="font-black text-[#001D4A] text-sm uppercase">{t.name}</p>
                          <p className="text-[10px] font-bold text-indigo-600">৳{t.fee.toLocaleString()}</p>
                       </>
                    )}
                  </div>
                  <div className="flex gap-2">
                     {editTourIndex === i ? (
                        <button onClick={saveTourEdit} className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><i className="fas fa-check"></i></button>
                     ) : (
                        <>
                           <button onClick={() => {setEditTourIndex(i); setEditTourData(t);}} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><i className="fas fa-pen text-[10px]"></i></button>
                           <button onClick={() => onDeleteTourCascading(t.name)} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><i className="fas fa-trash-alt text-[10px]"></i></button>
                        </>
                     )}
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeSubTab === 'agents' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={addAgent} className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border flex flex-col gap-5">
            <h4 className="font-black text-[10px] uppercase text-[#001D4A] tracking-widest border-l-4 border-indigo-500 pl-3">Register Agent</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400">ID Code</label><input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black uppercase text-sm tracking-widest" placeholder="KS101" value={newAgent.code} onChange={e => setNewAgent({...newAgent, code: e.target.value.toUpperCase()})} /></div>
               <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400">Full Name</label><input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm" placeholder="Kazi Shetu" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} /></div>
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest active:scale-95 transition-all">Add Booker</button>
          </form>

          <div className="space-y-3">
             {agents.map((a, i) => (
               <div key={i} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="flex-grow">
                    {editAgentIndex === i ? (
                       <div className="flex gap-2">
                          <input className="px-3 py-2 border rounded-xl w-24 text-xs font-black uppercase" value={editAgentData?.code || ''} onChange={e => setEditAgentData({...editAgentData!, code: e.target.value.toUpperCase()})} />
                          <input className="px-3 py-2 border rounded-xl w-full text-xs font-bold" value={editAgentData?.name || ''} onChange={e => setEditAgentData({...editAgentData!, name: e.target.value})} />
                       </div>
                    ) : (
                       <div className="flex items-center gap-3">
                          <span className="bg-[#001D4A] text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">{a.code}</span>
                          <p className="font-bold text-gray-800 text-sm">{a.name}</p>
                       </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                     {editAgentIndex === i ? (
                        <button onClick={saveAgentEdit} className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><i className="fas fa-check"></i></button>
                     ) : (
                        <>
                           <button onClick={() => {setEditAgentIndex(i); setEditAgentData(a);}} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><i className="fas fa-pen text-[10px]"></i></button>
                           <button onClick={() => removeAgent(a.code)} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><i className="fas fa-trash-alt text-[10px]"></i></button>
                        </>
                     )}
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeSubTab === 'types' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={addType} className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border flex flex-col gap-5">
            <h4 className="font-black text-[10px] uppercase text-[#001D4A] tracking-widest border-l-4 border-blue-500 pl-3">Pricing Category</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400">Category</label><input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm" placeholder="Solo Traveler" value={newType.type} onChange={e => setNewType({...newType, type: e.target.value})} /></div>
               <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400">Surcharge (৳)</label><input required type="number" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-sm" placeholder="1500" value={newType.fee || ''} onChange={e => setNewType({...newType, fee: Number(e.target.value)})} /></div>
            </div>
            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest active:scale-95 transition-all">Save Category</button>
          </form>

          <div className="space-y-3">
             {customerTypes.map((c, i) => (
               <div key={i} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="flex-grow">
                    {editTypeIndex === i ? (
                       <div className="flex gap-2">
                          <input className="px-3 py-2 border rounded-xl w-full text-xs font-bold" value={editTypeData?.type || ''} onChange={e => setEditTypeData({...editTypeData!, type: e.target.value})} />
                          <input type="number" className="px-3 py-2 border rounded-xl w-24 text-xs font-bold" value={editTypeData?.fee || 0} onChange={e => setEditTypeData({...editTypeData!, fee: Number(e.target.value)})} />
                       </div>
                    ) : (
                       <>
                          <p className="font-black text-[#001D4A] text-sm uppercase">{c.type}</p>
                          <p className="text-[10px] font-bold text-blue-600">+৳{c.fee.toLocaleString()}</p>
                       </>
                    )}
                  </div>
                  <div className="flex gap-2">
                     {editTypeIndex === i ? (
                        <button onClick={saveTypeEdit} className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><i className="fas fa-check"></i></button>
                     ) : (
                        <>
                           <button onClick={() => {setEditTypeIndex(i); setEditTypeData(c);}} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><i className="fas fa-pen text-[10px]"></i></button>
                           <button onClick={() => removeType(i)} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><i className="fas fa-trash-alt text-[10px]"></i></button>
                        </>
                     )}
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeSubTab === 'print' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-[#001D4A] p-6 md:p-8 rounded-[32px] text-white shadow-xl flex flex-col gap-6">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Batch Printing</h3>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">Select bookings to print tickets</p>
               </div>
               <button onClick={() => setSelectedForPrint(allBookings.map(b => b.id))} className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Select All</button>
            </div>
            <button onClick={handlePrintBatch} disabled={selectedForPrint.length === 0} className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl disabled:opacity-50 active:scale-95 transition-all">Execute Print ({selectedForPrint.length})</button>
          </div>

          <div className="space-y-3">
             {allBookings.length === 0 ? (
               <div className="bg-white py-12 text-center rounded-[32px] border border-dashed border-gray-100"><p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">No Active Bookings</p></div>
             ) : (
               allBookings.map((b) => (
                 <div key={b.id} onClick={() => setSelectedForPrint(prev => prev.includes(b.id) ? prev.filter(p => p !== b.id) : [...prev, b.id])} className={`bg-white p-5 rounded-[28px] border transition-all cursor-pointer flex items-center justify-between ${selectedForPrint.includes(b.id) ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                    <div className="flex items-center gap-4 flex-1">
                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${selectedForPrint.includes(b.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-transparent'}`}><i className="fas fa-check text-[10px]"></i></div>
                       <div>
                          <p className="font-black text-[#001D4A] text-sm truncate max-w-[150px]">{b.name}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Seat {b.seatNo} • {b.tourName}</p>
                       </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${b.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{b.paymentStatus}</span>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {activeSubTab === 'food' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-[#001D4A] tracking-tighter uppercase">Token Wizard</h3>
                 <button onClick={() => setSelectedForPrint([])} className="text-[10px] font-black text-gray-400 uppercase">Clear</button>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Meal Period</label>
                    <select value={foodType} onChange={e => setFoodType(e.target.value as any)} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-[#001D4A] uppercase text-xs outline-none">
                       {['Breakfast', 'Lunch', 'Dinner', 'Special Item', 'Snacks', 'Refreshment'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Serving Time</label>
                    <input type="text" value={foodTime} onChange={e => setFoodTime(e.target.value)} className="w-full px-5 py-4 bg-orange-50 border-none rounded-2xl font-black text-orange-600 text-center text-xl outline-none" />
                 </div>
              </div>

              <button onClick={handlePrintFoodTokens} disabled={selectedForPrint.length === 0} className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest active:scale-95 transition-all">Generate {selectedForPrint.length} Tokens</button>
           </div>

           <div className="space-y-3">
              <div className="flex gap-2 mb-4 px-1">
                 <select value={foodFilterTour} onChange={e => setFoodFilterTour(e.target.value)} className="flex-1 bg-white border border-gray-100 px-3 py-3 rounded-xl text-[10px] font-black uppercase text-indigo-600">
                    <option value="">All Tours</option>
                    {tours.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                 </select>
                 <select value={foodFilterBooker} onChange={e => setFoodFilterBooker(e.target.value)} className="flex-1 bg-white border border-gray-100 px-3 py-3 rounded-xl text-[10px] font-black uppercase text-indigo-600">
                    <option value="">All Agents</option>
                    {agents.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                 </select>
              </div>
              {filteredFoodBookings.map(b => (
                 <div key={b.id} onClick={() => setSelectedForPrint(prev => prev.includes(b.id) ? prev.filter(p => p !== b.id) : [...prev, b.id])} className={`bg-white p-5 rounded-[28px] border transition-all cursor-pointer flex items-center justify-between ${selectedForPrint.includes(b.id) ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${selectedForPrint.includes(b.id) ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-transparent'}`}><i className="fas fa-check text-[10px]"></i></div>
                       <div>
                          <p className="font-black text-[#001D4A] text-sm uppercase leading-none">{b.name}</p>
                          <p className="text-[9px] font-black text-orange-500 uppercase tracking-tighter mt-1">Seat {b.seatNo}</p>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeSubTab === 'system' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           <div className="bg-red-50 border-2 border-red-100 p-8 md:p-12 rounded-[48px] shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-8 shadow-inner"><i className="fas fa-radiation"></i></div>
              <h3 className="text-2xl font-black text-red-900 tracking-tighter mb-4 uppercase">System Control</h3>
              <p className="max-w-md text-[10px] text-red-700 font-bold mb-10 uppercase tracking-tight leading-relaxed">Permanent loss of all business records will occur if actions are taken below.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                 {onSeed && <button onClick={onSeed} className="py-6 bg-white border border-red-200 text-red-600 rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex flex-col items-center gap-2"><i className="fas fa-database text-lg"></i>Reset Default</button>}
                 <button onClick={onMasterReset} className="py-6 bg-red-600 text-white rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95 flex flex-col items-center gap-2"><i className="fas fa-trash-arrow-up text-lg"></i>Wipe Database</button>
              </div>
           </div>
           
           <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-5 rounded-3xl"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Routes</p><p className="text-xl font-black text-[#001D4A]">{tours.length}</p></div>
              <div className="bg-gray-50 p-5 rounded-3xl"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Bookers</p><p className="text-xl font-black text-[#001D4A]">{agents.length}</p></div>
              <div className="bg-gray-50 p-5 rounded-3xl"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Entries</p><p className="text-xl font-black text-[#001D4A]">{allBookings.length}</p></div>
              <div className="bg-green-50 p-5 rounded-3xl"><p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Status</p><p className="text-xl font-black text-green-600 uppercase">Live</p></div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

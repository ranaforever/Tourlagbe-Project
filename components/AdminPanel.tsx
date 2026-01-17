
import React, { useState, useMemo } from 'react';
import { Tour, Booker, CustomerType, BusData, BookingInfo } from '../types';
import { BUSINESS_INFO } from '../constants';

interface AdminPanelProps {
  tours: Tour[];
  setTours: (tours: Tour[], renameMap?: { oldName: string, newName: string }) => void;
  agents: Booker[];
  setAgents: React.Dispatch<React.SetStateAction<Booker[]>>;
  customerTypes: CustomerType[];
  setCustomerTypes: React.Dispatch<React.SetStateAction<CustomerType[]>>;
  buses: BusData[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  tours, setTours, 
  agents, setAgents, 
  customerTypes, setCustomerTypes,
  buses
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tours' | 'agents' | 'types' | 'print'>('tours');
  
  // Local states for new entries
  const [newTour, setNewTour] = useState({ name: '', fee: 0 });
  const [newAgent, setNewAgent] = useState({ code: '', name: '' });
  const [newType, setNewType] = useState({ type: '', fee: 0 });

  // Edit states
  const [editTourIndex, setEditTourIndex] = useState<number | null>(null);
  const [editTourData, setEditTourData] = useState<Tour | null>(null);

  const [editAgentIndex, setEditAgentIndex] = useState<number | null>(null);
  const [editAgentData, setEditAgentData] = useState<Booker | null>(null);

  const [editTypeIndex, setEditTypeIndex] = useState<number | null>(null);
  const [editTypeData, setEditTypeData] = useState<CustomerType | null>(null);

  // Print state
  const [selectedForPrint, setSelectedForPrint] = useState<string[]>([]);
  const allBookings: BookingInfo[] = useMemo(() => 
    buses.flatMap(b => b.seats.filter(s => s.isBooked).map(s => s.bookingInfo!)),
    [buses]
  );

  // --- Tour Operations ---
  const addTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTour.name.trim()) return;
    if (tours.some(t => t.name.toLowerCase() === newTour.name.trim().toLowerCase())) {
      alert("A tour with this name already exists.");
      return;
    }
    setTours([...tours, { name: newTour.name.trim(), fee: newTour.fee }]);
    setNewTour({ name: '', fee: 0 });
  };

  const startEditTour = (idx: number) => {
    setEditTourIndex(idx);
    setEditTourData(tours[idx]);
  };

  const saveTourEdit = () => {
    if (editTourIndex !== null && editTourData) {
      const oldName = tours[editTourIndex].name;
      const newName = editTourData.name;
      const updated = [...tours];
      updated[editTourIndex] = editTourData;
      const renameMap = oldName !== newName ? { oldName, newName } : undefined;
      setTours(updated, renameMap);
      setEditTourIndex(null);
      setEditTourData(null);
    }
  };

  const removeTour = (name: string) => {
    if (confirm(`Delete tour "${name}"? This removes all associated bookings!`)) {
      setTours(tours.filter(t => t.name !== name));
    }
  };

  // --- Agent Operations ---
  const addAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.code.trim() || !newAgent.name.trim()) return;
    if (agents.some(a => a.code.toUpperCase() === newAgent.code.trim().toUpperCase())) {
      alert("Agent ID already exists.");
      return;
    }
    setAgents([...agents, { code: newAgent.code.trim().toUpperCase(), name: newAgent.name.trim() }]);
    setNewAgent({ code: '', name: '' });
  };

  const startEditAgent = (idx: number) => {
    setEditAgentIndex(idx);
    setEditAgentData(agents[idx]);
  };

  const saveAgentEdit = () => {
    if (editAgentIndex !== null && editAgentData) {
      const updated = [...agents];
      updated[editAgentIndex] = editAgentData;
      setAgents(updated);
      setEditAgentIndex(null);
      setEditAgentData(null);
    }
  };

  const removeAgent = (code: string) => {
    if (confirm(`Remove agent ${code}?`)) {
      setAgents(agents.filter(a => a.code !== code));
    }
  };

  // --- Pricing Operations ---
  const addType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.type.trim()) return;
    setCustomerTypes([...customerTypes, { type: newType.type.trim(), fee: newType.fee }]);
    setNewType({ type: '', fee: 0 });
  };

  const startEditType = (idx: number) => {
    setEditTypeIndex(idx);
    setEditTypeData(customerTypes[idx]);
  };

  const saveTypeEdit = () => {
    if (editTypeIndex !== null && editTypeData) {
      const updated = [...customerTypes];
      updated[editTypeIndex] = editTypeData;
      setCustomerTypes(updated);
      setEditTypeIndex(null);
      setEditTypeData(null);
    }
  };

  const removeType = (index: number) => {
    if (confirm("Remove this pricing category?")) {
      setCustomerTypes(customerTypes.filter((_, idx) => idx !== index));
    }
  };

  // --- Print Batch Operations ---
  const handleTogglePrintSelect = (id: string) => {
    setSelectedForPrint(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handlePrintBatch = () => {
    if (selectedForPrint.length === 0) {
      alert("Please select at least one booking to print.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const bookingsToPrint = allBookings.filter(b => selectedForPrint.includes(b.id));

    const htmlContent = `
      <html>
        <head>
          <title>Batch Print Tickets</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 0; }
            body { font-family: 'Hind Siliguri', sans-serif; margin: 0; padding: 10mm; box-sizing: border-box; }
            .a4-page {
              width: 190mm;
              height: 277mm;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: repeat(4, 1fr);
              gap: 4mm;
              page-break-after: always;
            }
            .ticket-card {
              border: 1px dashed #cbd5e1;
              border-radius: 10px;
              padding: 8px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              font-size: 9px;
              overflow: hidden;
              background: #fff;
            }
            .qr-code { width: 50px; height: 50px; }
            .header-logo { height: 20px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body onload="window.print()">
          ${Array.from({ length: Math.ceil(bookingsToPrint.length / 8) }).map((_, pageIdx) => {
            const pageBookings = bookingsToPrint.slice(pageIdx * 8, (pageIdx + 1) * 8);
            return `
              <div class="a4-page">
                ${pageBookings.map(info => {
                  const qrData = `ID:${info.id}|Seat:${info.seatNo}|Name:${info.name}|Tour:${info.tourName}`;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;
                  return `
                    <div class="ticket-card">
                      <div class="flex justify-between items-start border-b pb-1 mb-1">
                        <div>
                          <img src="${BUSINESS_INFO.logo}" class="header-logo" />
                          <p class="text-[5px] text-gray-400 font-black uppercase leading-none">${BUSINESS_INFO.name}</p>
                        </div>
                        <div class="text-right">
                          <p class="font-black text-indigo-700 text-[10px]">Seat: ${info.seatNo}</p>
                          <p class="text-[6px] text-gray-400">ID: ${info.id}</p>
                        </div>
                      </div>
                      
                      <div class="flex-grow space-y-0.5 py-0.5">
                        <div class="flex justify-between">
                          <span class="text-gray-400 font-bold uppercase text-[6px]">Passenger:</span>
                          <span class="font-black truncate max-w-[90px] text-gray-800">${info.name}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-400 font-bold uppercase text-[6px]">Tour:</span>
                          <span class="font-bold truncate max-w-[90px] text-gray-700">${info.tourName}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-400 font-bold uppercase text-[6px]">Mobile:</span>
                          <span class="font-bold text-gray-700">+880${info.mobile}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-400 font-bold uppercase text-[6px]">Status:</span>
                          <span class="font-black ${info.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}">${info.paymentStatus}</span>
                        </div>
                      </div>

                      <div class="flex justify-between items-end border-t pt-1">
                        <div class="flex flex-col">
                          <p class="text-[6px] text-gray-400 font-bold uppercase">Booked By:</p>
                          <p class="font-bold text-gray-800 text-[8px]">${info.bookedBy}</p>
                          <p class="text-[8px] font-black text-red-600">Due: ৳${info.dueAmount}</p>
                        </div>
                        <img src="${qrUrl}" class="qr-code" />
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto md:pl-12 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-[#001D4A]">Master Settings</h2>
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider">
          <i className="fas fa-shield-alt mr-2"></i> Admin Mode
        </div>
      </div>

      <div className="flex bg-white p-2 rounded-2xl shadow-sm mb-10 gap-2 border border-gray-100 flex-wrap">
        {[
          { id: 'tours', label: 'Tours', icon: 'fa-map-marked-alt' },
          { id: 'agents', label: 'Agents', icon: 'fa-id-card' },
          { id: 'types', label: 'Pricing', icon: 'fa-hand-holding-usd' },
          { id: 'print', label: 'Tickets', icon: 'fa-print' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 min-w-[100px] py-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeSubTab === tab.id ? 'bg-[#001D4A] text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'tours' && (
        <div className="space-y-8">
          <form onSubmit={addTour} className="bg-white p-8 rounded-[32px] shadow-xl border border-indigo-50 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">New Tour Name</label>
              <input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" placeholder="Destination Name" value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} />
            </div>
            <div className="w-full md:w-48 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Base Fee (৳)</label>
              <input required type="number" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" value={newTour.fee || ''} onChange={e => setNewTour({...newTour, fee: Number(e.target.value)})} />
            </div>
            <button type="submit" className="w-full md:w-auto px-10 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg hover:bg-orange-600">Add Tour</button>
          </form>

          <div className="bg-white rounded-[32px] shadow-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <th className="px-8 py-4 text-left">Tour Identity</th>
                  <th className="px-8 py-4 text-left">Base Fee</th>
                  <th className="px-8 py-4 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tours.map((t, i) => (
                  <tr key={i} className={`hover:bg-gray-50/50 transition-colors ${editTourIndex === i ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-8 py-4">
                      {editTourIndex === i ? (
                        <input className="px-3 py-2 border rounded-lg text-sm font-bold w-full" value={editTourData?.name} onChange={e => setEditTourData({...editTourData!, name: e.target.value})} />
                      ) : (
                        <span className="font-black text-gray-800">{t.name}</span>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      {editTourIndex === i ? (
                        <input type="number" className="px-3 py-2 border rounded-lg text-sm font-bold w-full" value={editTourData?.fee} onChange={e => setEditTourData({...editTourData!, fee: Number(e.target.value)})} />
                      ) : (
                        <span className="font-bold text-indigo-600">৳{t.fee.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-8 py-4 text-right space-x-2">
                      {editTourIndex === i ? (
                        <>
                          <button onClick={saveTourEdit} className="text-green-600 hover:bg-green-100 p-2 rounded-lg font-black text-xs uppercase">Save</button>
                          <button onClick={() => setEditTourIndex(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg font-black text-xs uppercase">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditTour(i)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"><i className="fas fa-pen"></i></button>
                          <button onClick={() => removeTour(t.name)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><i className="fas fa-trash-alt"></i></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'agents' && (
        <div className="space-y-8">
          <form onSubmit={addAgent} className="bg-white p-8 rounded-[32px] shadow-xl border border-indigo-50 flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-48 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Agent ID</label>
              <input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black uppercase" placeholder="AGT-000" value={newAgent.code} onChange={e => setNewAgent({...newAgent, code: e.target.value.toUpperCase()})} />
            </div>
            <div className="flex-1 space-y-1 w-full">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Full Name</label>
              <input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" placeholder="Legal Name" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} />
            </div>
            <button type="submit" className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">Add Agent</button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agents.map((a, i) => (
              <div key={i} className={`p-6 rounded-[24px] border transition-all flex justify-between items-center ${editAgentIndex === i ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
                {editAgentIndex === i ? (
                  <div className="space-y-2 w-full pr-4">
                    <input className="w-full px-3 py-1 text-xs border rounded uppercase font-black" value={editAgentData?.code} onChange={e => setEditAgentData({...editAgentData!, code: e.target.value.toUpperCase()})} />
                    <input className="w-full px-3 py-1 text-sm border rounded font-bold" value={editAgentData?.name} onChange={e => setEditAgentData({...editAgentData!, name: e.target.value})} />
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-100/50 px-2 py-0.5 rounded-full block w-fit mb-1">{a.code}</span>
                    <p className="font-bold text-gray-800">{a.name}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {editAgentIndex === i ? (
                    <>
                      <button onClick={saveAgentEdit} className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-lg text-xs"><i className="fas fa-check"></i></button>
                      <button onClick={() => setEditAgentIndex(null)} className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded-lg text-xs"><i className="fas fa-times"></i></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditAgent(i)} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100"><i className="fas fa-pen"></i></button>
                      <button onClick={() => removeAgent(a.code)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 rounded-xl hover:bg-red-100"><i className="fas fa-trash-alt"></i></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'types' && (
        <div className="space-y-8">
          <form onSubmit={addType} className="bg-white p-8 rounded-[32px] shadow-xl border border-indigo-50 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Pricing Category</label>
              <input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" placeholder="e.g. Deluxe Room" value={newType.type} onChange={e => setNewType({...newType, type: e.target.value})} />
            </div>
            <div className="w-full md:w-48 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Surcharge (৳)</label>
              <input required type="number" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" value={newType.fee || ''} onChange={e => setNewType({...newType, fee: Number(e.target.value)})} />
            </div>
            <button type="submit" className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">Add Tier</button>
          </form>

          <div className="grid grid-cols-1 gap-4">
             {customerTypes.map((c, i) => (
               <div key={i} className={`p-6 rounded-[24px] border transition-all flex justify-between items-center ${editTypeIndex === i ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
                  {editTypeIndex === i ? (
                    <div className="flex-1 flex gap-4 pr-4">
                      <input className="flex-1 px-4 py-2 border rounded-xl font-bold" value={editTypeData?.type} onChange={e => setEditTypeData({...editTypeData!, type: e.target.value})} />
                      <input type="number" className="w-32 px-4 py-2 border rounded-xl font-bold" value={editTypeData?.fee} onChange={e => setEditTypeData({...editTypeData!, fee: Number(e.target.value)})} />
                    </div>
                  ) : (
                    <div>
                      <p className="font-black text-gray-800 text-lg">{c.type}</p>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Pricing Tier</span>
                    </div>
                  )}
                  <div className="flex items-center gap-6">
                    {editTypeIndex === i ? (
                       <div className="flex gap-2">
                        <button onClick={saveTypeEdit} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-xs uppercase">Save</button>
                        <button onClick={() => setEditTypeIndex(null)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl font-black text-xs uppercase">Cancel</button>
                       </div>
                    ) : (
                      <>
                        <span className="text-blue-600 font-black text-xl">৳{c.fee.toLocaleString()}</span>
                        <div className="flex gap-2">
                          <button onClick={() => startEditType(i)} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors"><i className="fas fa-pen"></i></button>
                          <button onClick={() => removeType(i)} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-red-400 rounded-xl hover:bg-red-100 transition-colors"><i className="fas fa-trash-alt"></i></button>
                        </div>
                      </>
                    )}
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeSubTab === 'print' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-[32px] shadow-xl border border-indigo-50">
            <div>
              <h3 className="font-black text-[#001D4A]">Batch Ticket Printing</h3>
              <p className="text-xs text-gray-400">Select tickets to layout 8 per A4 page (2x4 grid).</p>
            </div>
            <div className="flex gap-3">
               <button 
                onClick={() => setSelectedForPrint([])}
                className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl font-black text-xs uppercase"
              >
                Clear All
              </button>
              <button 
                onClick={handlePrintBatch}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg flex items-center gap-2"
              >
                <i className="fas fa-print"></i> Print Selected ({selectedForPrint.length})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-xl border overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b">
                <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <th className="px-6 py-4 w-10">Select</th>
                  <th className="px-6 py-4">Passenger</th>
                  <th className="px-6 py-4">Tour / Seat</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allBookings.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No bookings found to print.</td></tr>
                ) : (
                  allBookings.map((b) => (
                    <tr 
                      key={b.id} 
                      className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${selectedForPrint.includes(b.id) ? 'bg-indigo-50' : ''}`}
                      onClick={() => handleTogglePrintSelect(b.id)}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedForPrint.includes(b.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                          {selectedForPrint.includes(b.id) && <i className="fas fa-check text-[10px] text-white"></i>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">{b.name}</td>
                      <td className="px-6 py-4">
                        <p className="font-black text-gray-700">{b.tourName}</p>
                        <p className="text-[10px] font-black text-indigo-500">Seat {b.seatNo}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-red-600">৳{b.dueAmount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${b.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

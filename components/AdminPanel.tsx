
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
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  tours, setTours, 
  agents, setAgents, 
  customerTypes, setCustomerTypes,
  buses,
  onSeed
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tours' | 'agents' | 'types' | 'print' | 'food'>('tours');
  
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
  
  // Food Token States
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

  // Tours Logic
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

  // Agents Logic
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

  // Types Logic
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
          <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 0; }
            body { font-family: 'Inter', 'Hind Siliguri', sans-serif; background: white; margin: 0; padding: 0; }
            .token-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 25%); 
              grid-template-rows: repeat(6, 16.666%);
              width: 210mm; 
              height: 297mm; 
              box-sizing: border-box;
            }
            .token-item { 
              border: 0.2pt dashed #ccc; 
              padding: 10px; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center;
              text-align: center;
              position: relative;
              overflow: hidden;
              box-sizing: border-box;
              break-inside: avoid;
            }
            .token-watermark {
              position: absolute;
              font-size: 32px;
              font-weight: 900;
              color: rgba(0,0,0,0.03);
              transform: rotate(-15deg);
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
            }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body onload="window.print()">
          <div class="token-grid">
            ${bookingsToPrint.map(info => `
              <div class="token-item">
                <div class="token-watermark">${foodType.toUpperCase()}</div>
                <div class="relative z-10 w-full flex flex-col items-center">
                   <img src="${BUSINESS_INFO.logo}" class="h-20 mb-3" />
                   <h2 class="text-[13px] font-black text-indigo-900 uppercase tracking-[0.2em] leading-none mb-1">${foodType}</h2>
                   
                   <div class="w-full my-2 border-y border-dashed border-gray-200 py-2">
                      <p class="text-[11px] font-black text-gray-800 leading-none mb-1.5">${info.name}</p>
                      <div class="bg-indigo-900 text-white rounded-md px-3 py-1 inline-block">
                         <p class="text-[10px] font-black uppercase tracking-tighter">Seat: ${info.seatNo}</p>
                      </div>
                   </div>

                   <div class="flex flex-col items-center">
                      <span class="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-0.5">Serving Time</span>
                      <span class="text-[14px] font-black text-gray-900 leading-none">${foodTime}</span>
                   </div>
                   
                   <p class="text-[7px] text-gray-300 font-bold uppercase mt-3 tracking-tight">${info.tourName}</p>
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

  return (
    <div className="max-w-4xl mx-auto md:pl-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#001D4A]">Master Settings</h2>
          <p className="text-sm text-gray-400">Configure your global tour parameters.</p>
        </div>
        {tours.length === 0 && onSeed && (
          <button onClick={onSeed} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all">
            <i className="fas fa-cloud-upload-alt mr-2"></i> Initialize Cloud Data
          </button>
        )}
      </div>

      <div className="flex bg-white p-2 rounded-2xl shadow-sm mb-10 gap-2 border flex-wrap">
        {[
          { id: 'tours', label: 'Routes & Fees', icon: 'fa-route' },
          { id: 'agents', label: 'Agents/Bookers', icon: 'fa-user-tie' },
          { id: 'types', label: 'Pricing Categories', icon: 'fa-tags' },
          { id: 'print', label: 'Batch Printing', icon: 'fa-print' },
          { id: 'food', label: 'Food Tokens', icon: 'fa-utensils' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveSubTab(tab.id as any)} 
            className={`flex-1 min-w-[100px] py-4 rounded-xl font-black text-[10px] transition-all uppercase flex flex-col items-center gap-1 ${activeSubTab === tab.id ? 'bg-[#001D4A] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <i className={`fas ${tab.icon} text-sm`}></i>
            {tab.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {activeSubTab === 'tours' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <form onSubmit={addTour} className="bg-white p-8 rounded-[32px] shadow-xl border flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1 w-full"><label className="text-[10px] font-black uppercase text-gray-400">New Tour Name</label><input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} /></div>
            <div className="w-full md:w-48 space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Base Fee</label><input required type="number" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" value={newTour.fee || ''} onChange={e => setNewTour({...newTour, fee: Number(e.target.value)})} /></div>
            <button type="submit" className="px-10 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg">Add Route</button>
          </form>
          <div className="bg-white rounded-[32px] shadow-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest"><th className="px-8 py-4 text-left">Route Identity</th><th className="px-8 py-4 text-left">Base Fee</th><th className="px-8 py-4 text-right">Control</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{tours.map((t, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-8 py-4">{editTourIndex === i ? <input className="px-3 py-2 border rounded-lg w-full font-bold" value={editTourData?.name || ''} onChange={e => setEditTourData({...editTourData!, name: e.target.value})} /> : <span className="font-black text-gray-800">{t.name}</span>}</td>
                  <td className="px-8 py-4">{editTourIndex === i ? <input type="number" className="px-3 py-2 border rounded-lg w-full font-bold" value={editTourData?.fee || 0} onChange={e => setEditTourData({...editTourData!, fee: Number(e.target.value)})} /> : <span className="font-bold text-indigo-600">৳{t.fee.toLocaleString()}</span>}</td>
                  <td className="px-8 py-4 text-right space-x-2">
                    {editTourIndex === i ? (
                      <button onClick={saveTourEdit} className="text-green-600 font-black hover:bg-green-50 px-3 py-1 rounded">SAVE</button>
                    ) : (
                      <>
                        <button onClick={() => {setEditTourIndex(i); setEditTourData(t);}} className="text-blue-500 p-2 hover:bg-blue-50 rounded"><i className="fas fa-pen"></i></button>
                        <button onClick={() => { if(confirm("Delete Route?")) setTours(tours.filter((_, idx) => idx !== i)); }} className="text-red-400 p-2 hover:bg-red-50 rounded"><i className="fas fa-trash-alt"></i></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'agents' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <form onSubmit={addAgent} className="bg-white p-8 rounded-[32px] shadow-xl border flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-48 space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Agent ID</label><input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black uppercase" value={newAgent.code} onChange={e => setNewAgent({...newAgent, code: e.target.value.toUpperCase()})} /></div>
            <div className="flex-1 space-y-1 w-full"><label className="text-[10px] font-black uppercase text-gray-400">Full Name</label><input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} /></div>
            <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black">Add Agent</button>
          </form>
          <div className="bg-white rounded-[32px] shadow-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest"><th className="px-8 py-4 text-left">Code</th><th className="px-8 py-4 text-left">Agent Name</th><th className="px-8 py-4 text-right">Control</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{agents.map((a, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-8 py-4">{editAgentIndex === i ? <input className="px-3 py-2 border rounded-lg w-full font-black uppercase" value={editAgentData?.code || ''} onChange={e => setEditAgentData({...editAgentData!, code: e.target.value.toUpperCase()})} /> : <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{a.code}</span>}</td>
                  <td className="px-8 py-4">{editAgentIndex === i ? <input className="px-3 py-2 border rounded-lg w-full font-bold" value={editAgentData?.name || ''} onChange={e => setEditAgentData({...editAgentData!, name: e.target.value})} /> : <span className="font-bold text-gray-800">{a.name}</span>}</td>
                  <td className="px-8 py-4 text-right space-x-2">
                    {editAgentIndex === i ? (
                      <button onClick={saveAgentEdit} className="text-green-600 font-black px-3 py-1 rounded">SAVE</button>
                    ) : (
                      <>
                        <button onClick={() => {setEditTourIndex(i); setEditAgentData(a);}} className="text-blue-500 p-2 hover:bg-blue-50 rounded"><i className="fas fa-pen"></i></button>
                        <button onClick={() => removeAgent(a.code)} className="text-red-400 p-2 hover:bg-red-50 rounded"><i className="fas fa-trash-alt"></i></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'types' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <form onSubmit={addType} className="bg-white p-8 rounded-[32px] shadow-xl border flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1 w-full"><label className="text-[10px] font-black uppercase text-gray-400">Category Name</label><input required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" value={newType.type} onChange={e => setNewType({...newType, type: e.target.value})} /></div>
            <div className="w-full md:w-48 space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Surcharge</label><input required type="number" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold" value={newType.fee || ''} onChange={e => setNewType({...newType, fee: Number(e.target.value)})} /></div>
            <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black">Add Category</button>
          </form>
          <div className="bg-white rounded-[32px] shadow-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest"><th className="px-8 py-4 text-left">Category</th><th className="px-8 py-4 text-left">Surcharge</th><th className="px-8 py-4 text-right">Control</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{customerTypes.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-8 py-4">{editTypeIndex === i ? <input className="px-3 py-2 border rounded-lg w-full font-black" value={editTypeData?.type || ''} onChange={e => setEditTypeData({...editTypeData!, type: e.target.value})} /> : <span className="font-black text-gray-800">{c.type}</span>}</td>
                  <td className="px-8 py-4">{editTypeIndex === i ? <input type="number" className="px-3 py-2 border rounded-lg w-full font-bold" value={editTypeData?.fee || 0} onChange={e => setEditTypeData({...editTypeData!, fee: Number(e.target.value)})} /> : <span className="font-bold text-blue-600">৳{c.fee}</span>}</td>
                  <td className="px-8 py-4 text-right space-x-2">
                    {editTypeIndex === i ? (
                      <button onClick={saveTypeEdit} className="text-green-600 font-black px-3 py-1 rounded">SAVE</button>
                    ) : (
                      <>
                        <button onClick={() => {setEditTypeIndex(i); setEditTypeData(c);}} className="text-blue-500 p-2 hover:bg-blue-50 rounded"><i className="fas fa-pen"></i></button>
                        <button onClick={() => removeType(i)} className="text-red-400 p-2 hover:bg-red-50 rounded"><i className="fas fa-trash-alt"></i></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'print' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[32px] shadow-xl border gap-4">
            <div>
              <h3 className="font-black text-[#001D4A]">Batch Ticket Print</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A4 Layout Optimized (8 tickets)</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => setSelectedForPrint(allBookings.map(b => b.id))} className="px-4 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase hover:bg-gray-100 transition-all">Select All</button>
              <button onClick={handlePrintBatch} className="flex-grow md:flex-none px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Print Selected ({selectedForPrint.length})</button>
            </div>
          </div>
          <div className="bg-white rounded-[32px] shadow-xl border overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b"><tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest"><th className="px-6 py-4 w-10">Select</th><th className="px-6 py-4">Passenger Info</th><th className="px-6 py-4">Tour Identity</th><th className="px-6 py-4">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{allBookings.length > 0 ? allBookings.map((b) => (
                <tr key={b.id} className={`hover:bg-indigo-50/50 cursor-pointer transition-colors ${selectedForPrint.includes(b.id) ? 'bg-indigo-50' : ''}`} onClick={() => setSelectedForPrint(prev => prev.includes(b.id) ? prev.filter(p => p !== b.id) : [...prev, b.id])}>
                  <td className="px-6 py-4">
                    <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${selectedForPrint.includes(b.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}>
                      {selectedForPrint.includes(b.id) && <i className="fas fa-check text-[10px] text-white"></i>}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-gray-800">
                    {b.name} 
                    <span className="text-[10px] text-indigo-600 font-black block uppercase tracking-widest">Seat: {b.seatNo}</span>
                  </td>
                  <td className="px-6 py-4"><span className="text-gray-500 font-bold text-xs">{b.tourName}</span></td>
                  <td className="px-6 py-4 uppercase font-black text-[10px]"><span className={`${b.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>{b.paymentStatus}</span></td>
                </tr>
              )) : <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">No bookings found in fleet.</td></tr>}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'food' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                   <h3 className="text-2xl font-black text-[#001D4A] tracking-tighter">Food Token Generator</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">4x6 Grid Optimized (24 tokens per page)</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                   <button onClick={() => setSelectedForPrint([])} className="px-4 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase hover:bg-gray-100 transition-all">Reset</button>
                   <button onClick={handlePrintFoodTokens} className="flex-grow md:flex-none px-10 py-5 bg-orange-500 text-white rounded-2xl font-black shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                      <i className="fas fa-print"></i> Generate ({selectedForPrint.length})
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Meal / Item Type</label>
                   <div className="flex bg-gray-50 p-2 rounded-2xl gap-2 flex-wrap">
                      {['Breakfast', 'Lunch', 'Dinner', 'Special Item', 'Snacks', 'Refreshment'].map(type => (
                         <button 
                            key={type}
                            onClick={() => setFoodType(type as any)}
                            className={`flex-1 min-w-[100px] py-3 rounded-xl font-black text-[9px] uppercase transition-all ${foodType === type ? 'bg-[#001D4A] text-white shadow-lg' : 'text-gray-400 hover:bg-white'}`}
                         >
                            {type}
                         </button>
                      ))}
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Serving Time</label>
                   <input 
                      type="text" 
                      value={foodTime}
                      onChange={e => setFoodTime(e.target.value)}
                      placeholder="e.g. 08:30 AM"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-[#001D4A] outline-none text-center text-lg shadow-inner"
                   />
                </div>
             </div>

             <div className="bg-white rounded-[32px] border overflow-hidden shadow-sm">
                <div className="p-6 bg-gray-50 border-b flex flex-col md:flex-row gap-4 justify-between items-center">
                   <div className="flex gap-4 w-full md:w-auto">
                      <div className="space-y-1 flex-1 md:w-48">
                         <label className="text-[8px] font-black uppercase text-gray-400 px-2">Tour Filter</label>
                         <select value={foodFilterTour} onChange={e => setFoodFilterTour(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-black outline-none shadow-sm">
                            <option value="">All Tours</option>
                            {tours.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-1 flex-1 md:w-48">
                         <label className="text-[8px] font-black uppercase text-gray-400 px-2">Agent Filter</label>
                         <select value={foodFilterBooker} onChange={e => setFoodFilterBooker(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-black outline-none shadow-sm">
                            <option value="">All Agents</option>
                            {agents.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                         </select>
                      </div>
                   </div>
                   <button onClick={() => setSelectedForPrint(filteredFoodBookings.map(b => b.id))} className="text-[10px] font-black text-indigo-600 uppercase underline whitespace-nowrap hover:text-orange-500 transition-colors">Select All Results</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                   <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="sticky top-0 bg-white border-b z-10">
                         <tr className="text-[9px] font-black uppercase text-gray-400">
                            <th className="px-6 py-3 w-10">Sel</th>
                            <th className="px-6 py-3">Passenger</th>
                            <th className="px-6 py-3">Seat</th>
                            <th className="px-6 py-3">Agent</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {filteredFoodBookings.length > 0 ? filteredFoodBookings.map(b => (
                            <tr key={b.id} className={`hover:bg-indigo-50/50 cursor-pointer transition-colors ${selectedForPrint.includes(b.id) ? 'bg-indigo-50' : ''}`} onClick={() => setSelectedForPrint(prev => prev.includes(b.id) ? prev.filter(p => p !== b.id) : [...prev, b.id])}>
                               <td className="px-6 py-4">
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedForPrint.includes(b.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 bg-white'}`}>
                                     {selectedForPrint.includes(b.id) && <i className="fas fa-check text-[10px]"></i>}
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <p className="font-black text-[#001D4A] leading-none">{b.name}</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-tight">{b.tourName}</p>
                               </td>
                               <td className="px-6 py-4 font-black text-indigo-600">
                                  <span className="bg-indigo-50 px-2 py-1 rounded-md">Seat {b.seatNo}</span>
                                </td>
                               <td className="px-6 py-4">
                                  <p className="text-[10px] font-black text-gray-500 uppercase">{b.bookedBy}</p>
                                  <p className="text-[8px] font-bold text-gray-300">ID: {b.bookerCode}</p>
                               </td>
                            </tr>
                         )) : (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-300 font-bold uppercase italic tracking-widest">No matching bookings found.</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

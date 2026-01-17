
import React, { useRef } from 'react';
import { BookingInfo } from '../types';
import { BUSINESS_INFO } from '../constants';

interface SeatDetailModalProps {
  info: BookingInfo;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate?: (updatedInfo: BookingInfo) => void;
}

const SeatDetailModal: React.FC<SeatDetailModalProps> = ({ info, onClose, onEdit, onCancel, onUpdate }) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  // Generate QR Code URL based on booking info
  const qrData = `ID:${info.id}|Seat:${info.seatNo}|Name:${info.name}|Tour:${info.tourName}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  const handlePayDue = () => {
    const code = prompt("Security Check: Enter the original Agent Booker Code to settle this balance:");
    if (code && code.toUpperCase() === info.bookerCode.toUpperCase()) {
      if (onUpdate) {
        const updatedInfo: BookingInfo = {
          ...info,
          advanceAmount: info.advanceAmount + info.dueAmount,
          dueAmount: 0,
          paymentStatus: 'Paid'
        };
        onUpdate(updatedInfo);
        alert("Balance settled successfully!");
      }
    } else if (code) {
      alert("Verification Failed: Unauthorized Agent Code. Only the original booker can settle this balance.");
    }
  };

  const printTicket = () => {
    const printContent = ticketRef.current;
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    if (windowPrint && printContent) {
      windowPrint.document.write(`
        <html>
          <head>
            <title>Ticket - ${info.name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Hind Siliguri', sans-serif; }
              @media print {
                .no-print { display: none; }
                .ticket-container { border: 2px dashed #ccc; padding: 20px; border-radius: 20px; }
              }
            </style>
          </head>
          <body onload="window.print();window.close()">
            <div class="p-10 ticket-container">
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
      windowPrint.document.close();
      windowPrint.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#001D4A]/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl my-auto animate-in zoom-in duration-300 overflow-hidden border border-white/20">
        
        <div className="p-6 md:p-8">
           <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-white bg-indigo-600 px-3 py-1 rounded-full uppercase mb-2 inline-block tracking-widest">Booking Record</span>
                <h3 className="text-2xl md:text-3xl font-black text-[#001D4A]">{info.name}</h3>
              </div>
              <button onClick={onClose} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                <i className="fas fa-times"></i>
              </button>
           </div>

           {/* Ticket Design */}
           <div ref={ticketRef} className="bg-white border-2 border-dashed border-gray-200 rounded-[32px] p-6 mb-8 relative overflow-hidden shadow-inner">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full border-r-2 border-dashed border-gray-200"></div>
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full border-l-2 border-dashed border-gray-200"></div>
              
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <img src={BUSINESS_INFO.logo} alt="Logo" className="h-10 mb-2" />
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{BUSINESS_INFO.address}</p>
                 </div>
                 <div className="text-right">
                    <div className="bg-[#001D4A] text-white px-3 py-1 rounded-lg inline-block mb-1">
                      <p className="text-[10px] font-black uppercase tracking-tighter">Seat: {info.seatNo}</p>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400">ID: {info.id}</p>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 border-y border-dashed border-gray-200 py-6 mb-6">
                 <div className="flex-grow grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Passenger</p>
                        <p className="text-sm font-black text-[#001D4A]">{info.name}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Tour</p>
                        <p className="text-sm font-black text-[#001D4A] truncate">{info.tourName}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Contact</p>
                        <p className="text-sm font-bold text-gray-700">+880{info.mobile}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Status</p>
                        <p className={`text-sm font-black uppercase tracking-widest ${info.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>{info.paymentStatus}</p>
                    </div>
                 </div>
                 
                 {/* QR Code Section */}
                 <div className="flex justify-center items-center bg-gray-50 p-2 rounded-2xl border border-gray-100 shrink-0">
                    <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 md:w-28 md:h-28" />
                 </div>
              </div>

              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase">Booked By</p>
                    <p className="text-xs font-bold text-gray-800">{info.bookedBy} ({info.bookerCode})</p>
                 </div>
                 <div className="text-right">
                    {info.dueAmount > 0 ? (
                      <div>
                        <p className="text-[9px] font-black text-red-400 uppercase">Outstanding Due</p>
                        <p className="text-xl font-black text-red-600">৳{info.dueAmount.toLocaleString()}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <i className="fas fa-check-circle"></i>
                        <span className="text-xs font-black uppercase tracking-widest">Fully Paid</span>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Action Controls */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={printTicket}
                className="py-4 bg-[#001D4A] text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <i className="fas fa-print"></i> Print Ticket
              </button>
              
              {info.dueAmount > 0 ? (
                <button 
                  onClick={handlePayDue}
                  className="py-4 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 shadow-xl shadow-green-100 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-money-bill-wave"></i> Pay Due (৳{info.dueAmount})
                </button>
              ) : (
                <button 
                  disabled
                  className="py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-sm cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <i className="fas fa-check-double"></i> Paid
                </button>
              )}
              
              <button 
                onClick={onEdit}
                className="py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <i className="fas fa-user-edit"></i> Full Edit
              </button>
              <button 
                onClick={onCancel}
                className="py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100 flex items-center justify-center gap-2"
              >
                <i className="fas fa-trash-alt"></i> Cancel Booking
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SeatDetailModal;

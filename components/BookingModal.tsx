
import React, { useState, useEffect } from 'react';
import { BookingInfo, Gender, Religion, Tour, CustomerType, Booker } from '../types';

interface BookingModalProps {
  seatId: string;
  busNo: string;
  onClose: () => void;
  onSubmit: (info: BookingInfo) => void;
  tours: Tour[];
  bookers: Booker[];
  customerTypes: CustomerType[];
  existingData?: BookingInfo;
}

const BookingModal: React.FC<BookingModalProps> = ({ seatId, busNo, onClose, onSubmit, tours, bookers, customerTypes, existingData }) => {
  const [formData, setFormData] = useState({
    name: existingData?.name || '',
    mobile: existingData?.mobile || '',
    address: existingData?.address || '',
    gender: existingData?.gender || Gender.MALE,
    religion: existingData?.religion || Religion.MUSLIM,
    tourName: existingData?.tourName || busNo,
    customerType: existingData?.customerType || (customerTypes.length > 0 ? customerTypes[0].type : ''),
    discountAmount: existingData?.discountAmount || 0,
    advanceAmount: existingData?.advanceAmount || 0,
    bookerCode: existingData?.bookerCode || ''
  });

  const [tourFees, setTourFees] = useState(0);
  const [customerTypeFees, setCustomerTypeFees] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);
  const [isRelaxTour, setIsRelaxTour] = useState(false);
  const [bookerName, setBookerName] = useState('');

  useEffect(() => {
    const tour = tours.find(t => t.name === formData.tourName);
    const fee = tour ? tour.fee : 0;
    setTourFees(fee);
    setIsRelaxTour(formData.tourName.toLowerCase().includes('relax'));

    const cType = customerTypes.find(c => c.type === formData.customerType);
    const cFee = cType ? cType.fee : 0;
    setCustomerTypeFees(cFee);

    if (formData.bookerCode.toUpperCase() === 'ADMIN' || formData.bookerCode === '@Rana&01625@') {
       setBookerName('System Admin');
    } else {
       const booker = bookers.find(b => b.code.toUpperCase() === formData.bookerCode.toUpperCase());
       setBookerName(booker ? booker.name : '');
    }

    const total = fee + cFee;
    const due = total - formData.discountAmount - formData.advanceAmount;
    setDueAmount(due);
  }, [formData, tours, bookers, customerTypes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookerName) {
      alert("Invalid Agent Code.");
      return;
    }

    const info: BookingInfo = {
      id: existingData?.id || Math.random().toString(36).substr(2, 9).toUpperCase(),
      ...formData,
      tourFees,
      customerTypeFees,
      dueAmount,
      paymentStatus: dueAmount <= 0 ? 'Paid' : (formData.advanceAmount > 0 ? 'Partial' : 'Due'),
      busNo: formData.tourName,
      seatNo: seatId,
      bookedBy: bookerName,
      bookingDate: existingData?.bookingDate || new Date().toISOString()
    };
    onSubmit(info);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end md:items-center justify-center p-0 md:p-4 bg-[#001D4A]/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-t-[40px] md:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom duration-300 border border-white/20 flex flex-col max-h-[92vh] md:max-h-[95vh] overflow-hidden">
        <div className="bg-[#001D4A] p-6 md:p-8 text-white flex justify-between items-center relative shrink-0">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">{existingData ? 'Modify' : 'Confirm'} Seat {seatId}</h3>
            <p className="text-orange-400 text-[9px] uppercase font-black tracking-widest mt-1">{formData.tourName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center"><i className="fas fa-times"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 overflow-y-auto custom-scrollbar space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h4 className="font-black text-[#001D4A] text-[10px] uppercase tracking-widest border-l-4 border-orange-500 pl-3">Passenger Detail</h4>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Legal Name</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold" placeholder="Full Name" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact No</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+880</span>
                  <input required name="mobile" inputMode="tel" value={formData.mobile} onChange={handleChange} className="w-full pl-16 pr-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold" placeholder="1XXXXXXXXX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase">{Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}</select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Religion</label>
                    <select name="religion" value={formData.religion} onChange={handleChange} className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase">{Object.values(Religion).map(r => <option key={r} value={r}>{r}</option>)}</select>
                 </div>
              </div>
            </div>

            <div className="space-y-5">
              <h4 className="font-black text-[#001D4A] text-[10px] uppercase tracking-widest border-l-4 border-indigo-500 pl-3">Tour & Billing</h4>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Route</label>
                <select name="tourName" value={formData.tourName} onChange={handleChange} className="w-full px-5 py-4 bg-indigo-50 border-none rounded-2xl font-black text-indigo-700 text-xs uppercase tracking-tight">{tours.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount</label><input type="number" inputMode="numeric" name="discountAmount" value={formData.discountAmount || ''} onChange={handleNumericChange} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-black text-sm" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Advance</label><input type="number" inputMode="numeric" name="advanceAmount" value={formData.advanceAmount || ''} onChange={handleNumericChange} className="w-full px-5 py-4 bg-green-50 border-none rounded-2xl font-black text-green-700 text-sm" /></div>
              </div>
              <div className="p-5 bg-gray-900 rounded-[24px] text-white flex justify-between items-center shadow-lg">
                 <span className="text-[9px] font-black text-orange-400 uppercase tracking-[0.2em]">Net Due</span>
                 <span className="text-xl font-black">৳{dueAmount.toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Agent Verification</label>
                <div className="relative">
                  <input required name="bookerCode" value={formData.bookerCode} onChange={handleChange} className={`w-full px-5 py-4 border-2 rounded-2xl font-black text-sm tracking-widest uppercase outline-none transition-all ${bookerName ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-800'}`} placeholder="YOUR CODE" />
                  {bookerName && <i className="fas fa-check-circle absolute right-4 top-1/2 -translate-y-1/2 text-green-500"></i>}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 sticky bottom-0 bg-white pb-2 md:pb-0">
            <button type="submit" className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-100 active:scale-95 transition-all uppercase tracking-widest">Confirm Seat</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;

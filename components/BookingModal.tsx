
import React, { useState, useEffect } from 'react';
import { BookingInfo, Gender, Religion, Tour, CustomerType, Booker } from '../types';
import { BUSINESS_INFO } from '../constants';

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

    // Recognising ADMIN as a master code
    if (formData.bookerCode.toUpperCase() === 'ADMIN' || formData.bookerCode === '@Rana&01625@') {
       setBookerName('System Administrator');
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
      alert("Invalid Agent Code! A verified booker code is required.");
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
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 md:p-4 bg-[#001D4A]/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[30px] md:rounded-[40px] shadow-2xl my-auto animate-in fade-in zoom-in duration-300 border border-white/20 flex flex-col max-h-[95vh] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 md:p-8 text-white flex justify-between items-center relative shrink-0">
          <div>
            <h3 className="text-xl md:text-2xl font-black">{existingData ? 'Edit' : 'Book'} Seat {seatId}</h3>
            <p className="text-orange-100 text-[10px] uppercase font-black tracking-widest mt-1">{busNo} Terminal</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl"><i className="fas fa-times"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h4 className="font-black text-[#001D4A] text-xs uppercase tracking-wider flex items-center gap-2">Passenger Information</h4>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Legal Name</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-5 py-3 md:py-4 bg-gray-50 border-none rounded-2xl text-sm" placeholder="e.g. Arif Hossain" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Mobile (+880)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+880</span>
                  <input required name="mobile" value={formData.mobile} onChange={handleChange} className="w-full pl-16 pr-5 py-3 md:py-4 bg-gray-50 border-none rounded-2xl text-sm" placeholder="1XXXXXXXXX" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Home Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm" placeholder="Detailed Address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">Gender</label><select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold">{Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">Religion</label><select name="religion" value={formData.religion} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold">{Object.values(Religion).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
            </div>

            <div className="space-y-5">
              <h4 className="font-black text-[#001D4A] text-xs uppercase tracking-wider flex items-center gap-2">Tour & Billing</h4>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Tour Name</label>
                <select name="tourName" value={formData.tourName} onChange={handleChange} className="w-full px-5 py-3 md:py-4 bg-indigo-50 border-none rounded-2xl font-black text-indigo-700 text-sm">{tours.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}</select>
              </div>
              {(isRelaxTour || customerTypes.length > 0) && (
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">Extra Category</label><select name="customerType" value={formData.customerType} onChange={handleChange} className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold">{customerTypes.map(c => <option key={c.type} value={c.type}>{c.type} (+৳{c.fee})</option>)}</select></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">Discount</label><input type="number" name="discountAmount" value={formData.discountAmount || ''} onChange={handleNumericChange} className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold text-sm" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase">Advance</label><input type="number" name="advanceAmount" value={formData.advanceAmount || ''} onChange={handleNumericChange} className="w-full px-5 py-3 bg-green-50 border-none rounded-2xl font-bold text-green-700 text-sm" /></div>
              </div>
              <div className="p-6 bg-[#001D4A] rounded-[28px] text-white shadow-xl relative overflow-hidden">
                 <div className="flex justify-between items-center"><span className="text-[10px] font-black text-orange-400 uppercase">Due Balance</span><span className="text-xl md:text-2xl font-black">৳{dueAmount.toLocaleString()}</span></div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Agent Verification Code</label>
                <div className="relative">
                  <input required name="bookerCode" value={formData.bookerCode} onChange={handleChange} className={`w-full px-5 py-3 md:py-4 border-2 rounded-2xl focus:ring-0 outline-none font-mono text-sm uppercase ${bookerName ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-gray-50'}`} placeholder="CODE-123" />
                  {bookerName && <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-green-500 text-white rounded-lg text-[8px] font-black uppercase">{bookerName}</div>}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-8 mt-4 border-t sticky bottom-0 bg-white">
            <button type="submit" className="w-full py-4 md:py-5 bg-orange-500 text-white rounded-2xl font-black text-lg md:text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">Confirm Entry <i className="fas fa-check-circle"></i></button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;

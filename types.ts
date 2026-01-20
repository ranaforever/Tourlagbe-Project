
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHERS = 'Others'
}

export enum Religion {
  MUSLIM = 'Muslim',
  HINDUISM = 'Hinduism',
  BUDDHISM = 'Buddhism',
  CHRISTIANITY = 'Christianity',
  OTHERS = 'Others'
}

export interface BookingInfo {
  id: string; // Unique booking ID
  name: string;
  mobile: string;
  address: string;
  gender: Gender;
  religion: Religion;
  tourName: string;
  tourFees: number;
  customerType?: string;
  customerTypeFees: number;
  discountAmount: number;
  advanceAmount: number;
  dueAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Due';
  busNo: string;
  seatNo: string;
  bookedBy: string; // Booker Name
  bookerCode: string;
  bookingDate: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  recordedBy: string;
  agentCode: string;
}

export interface SeatData {
  id: string; // e.g., 'A1'
  isBooked: boolean;
  bookingInfo?: BookingInfo;
}

export interface BusData {
  busId: string;
  seats: SeatData[];
}

export interface Tour {
  name: string;
  fee: number;
}

export interface Booker {
  code: string;
  name: string;
}

export interface CustomerType {
  type: string;
  fee: number;
}

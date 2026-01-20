
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
  id: string;
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
  bookedBy: string;
  bookerCode: string;
  bookingDate: string;
}

export interface SeatLock {
  id?: string;
  bus_no: string;
  seat_no: string;
  agent_code: string;
  agent_name: string;
  expires_at: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  recordedBy: string;
  agentCode: string;
  tourName?: string;
}

export interface SeatData {
  id: string;
  isBooked: boolean;
  bookingInfo?: BookingInfo;
  lockInfo?: SeatLock;
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
  last_active?: string;
}

export interface CustomerType {
  type: string;
  fee: number;
}

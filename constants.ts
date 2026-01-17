
import { SeatData, Tour, Booker, CustomerType } from './types';

export const BUSINESS_INFO = {
  name: "Tour লাগবে",
  motto: "আপনার বিশস্থ ভ্রমণ সঙ্গী",
  logo: "https://i.ibb.co/gb4jzgXj/Orange-and-Blue-Travel-Agency-Logo-1-1.png",
  address: "Kazi Genarel Store, Hindu Barir Mor, Borad Bazar, Gazipur",
  facebook: "https://www.facebook.com/tourlagbee",
  phonePrefix: "+880"
};

export const TOURS: Tour[] = [
  { name: "Sajek Valley", fee: 4500 },
  { name: "Cox's Bazar Relax", fee: 6500 },
  { name: "Sylhet Tea Garden", fee: 3500 },
  { name: "Saint Martin Relax", fee: 8500 },
  { name: "Sundarban Adventure", fee: 5500 }
];

export const BOOKERS: Booker[] = [
  { code: "KS101", name: "Kazi Shetu" },
  { code: "SI202", name: "Sadekul Islam" },
  { code: "AH303", name: "Akramul Haque" },
  { code: "MH404", name: "MD. Hanjela" },
  { code: "KA505", name: "Khursed Alam" },
  { code: "MR606", name: "Masud Rana" }
];

export const CUSTOMER_TYPES: CustomerType[] = [
  { type: "Standard", fee: 0 },
  { type: "Solo", fee: 1500 },
  { type: "Couple", fee: 0 }
];

const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const lastRow = 'K';

export const generateInitialSeats = (): SeatData[] => {
  const seats: SeatData[] = [];
  rows.forEach(row => {
    for (let i = 1; i <= 4; i++) {
      seats.push({ id: `${row}${i}`, isBooked: false });
    }
  });
  for (let i = 1; i <= 5; i++) {
    seats.push({ id: `${lastRow}${i}`, isBooked: false });
  }
  return seats;
};

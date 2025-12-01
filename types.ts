export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  nid?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  description?: string;
  dailyRentPrice: number;
  sellingPrice?: number; // New field for Sales
  totalQuantity: number;
  photoUrl?: string;
}

export enum RentalStatus {
  ACTIVE = 'Active',
  RETURNED = 'Returned',
  OVERDUE = 'Overdue',
  PARTIAL = 'Partial Return'
}

export interface RentalItem {
  itemId: string;
  itemName: string;
  quantity: number;
  dailyRentPrice: number;
  returned: boolean;
  returnedDate?: string;
}

export interface SaleItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  date: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  rentalId?: string; // Optional now
  saleId?: string;   // New field
  amount: number;
  date: string;
  note?: string;
}

export interface Rental {
  id: string;
  customerId: string;
  customerName: string;
  rentDate: string;
  expectedReturnDate: string;
  items: RentalItem[];
  totalAmount: number;
  status: RentalStatus;
  notes?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export type ViewState = 'dashboard' | 'customers' | 'inventory' | 'rentals' | 'sales' | 'reports';
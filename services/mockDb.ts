import { Customer, InventoryItem, Rental, Payment, RentalStatus, Note, Sale } from '../types';

// Keys for LocalStorage
const KEYS = {
  CUSTOMERS: 'aes_customers',
  INVENTORY: 'aes_inventory',
  RENTALS: 'aes_rentals',
  SALES: 'aes_sales',
  PAYMENTS: 'aes_payments',
  NOTES: 'aes_notes',
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Customers ---
export const getCustomers = (): Customer[] => {
  const data = localStorage.getItem(KEYS.CUSTOMERS);
  return data ? JSON.parse(data) : [];
};

export const saveCustomer = (customer: Omit<Customer, 'id' | 'createdAt'> & { id?: string }) => {
  const customers = getCustomers();
  if (customer.id) {
    const index = customers.findIndex(c => c.id === customer.id);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...customer };
    }
  } else {
    customers.push({
      ...customer,
      id: generateId(),
      createdAt: new Date().toISOString()
    });
  }
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
};

export const deleteCustomer = (id: string) => {
  const customers = getCustomers().filter(c => c.id !== id);
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
};

// --- Inventory ---
export const getInventory = (): InventoryItem[] => {
  const data = localStorage.getItem(KEYS.INVENTORY);
  return data ? JSON.parse(data) : [];
};

export const saveInventoryItem = (item: Omit<InventoryItem, 'id'> & { id?: string }) => {
  const items = getInventory();
  if (item.id) {
    const index = items.findIndex(i => i.id === item.id);
    if (index !== -1) items[index] = { ...items[index], ...item };
  } else {
    items.push({ ...item, id: generateId() });
  }
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
};

export const deleteInventoryItem = (id: string) => {
  const items = getInventory().filter(i => i.id !== id);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
};

// --- Rentals ---
export const getRentals = (): Rental[] => {
  const data = localStorage.getItem(KEYS.RENTALS);
  const rentals: Rental[] = data ? JSON.parse(data) : [];
  
  // Dynamic Status Update logic (Middleware simulation)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return rentals.map(rental => {
    if (rental.status === RentalStatus.RETURNED) return rental;

    const expectedDate = new Date(rental.expectedReturnDate);
    expectedDate.setHours(0, 0, 0, 0);
    
    // Check for Overdue
    if (today > expectedDate && rental.status !== RentalStatus.OVERDUE) {
      return { ...rental, status: RentalStatus.OVERDUE };
    }
    return rental;
  });
};

export const saveRental = (rental: Omit<Rental, 'id' | 'createdAt' | 'status' | 'totalAmount'>) => {
  const rentals = getRentals();
  
  // Calculate Total Amount
  const startDate = new Date(rental.rentDate);
  const endDate = new Date(rental.expectedReturnDate);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum 1 day

  const totalAmount = rental.items.reduce((sum, item) => {
    return sum + (item.dailyRentPrice * item.quantity * diffDays);
  }, 0);

  const newRental: Rental = {
    ...rental,
    id: generateId(),
    status: RentalStatus.ACTIVE,
    totalAmount,
    createdAt: new Date().toISOString(),
  };

  rentals.push(newRental);
  localStorage.setItem(KEYS.RENTALS, JSON.stringify(rentals));
  return newRental;
};

export const updateRentalStatus = (rentalId: string, itemsToReturn: string[]) => {
  const rentals = getRentals();
  const index = rentals.findIndex(r => r.id === rentalId);
  if (index === -1) return;

  const rental = rentals[index];
  
  // Update items returned status
  const updatedItems = rental.items.map(item => {
    if (itemsToReturn.includes(item.itemId)) {
      return { ...item, returned: true, returnedDate: new Date().toISOString() };
    }
    return item;
  });

  const allReturned = updatedItems.every(item => item.returned);
  // Partial Logic: If some returned but not all, set Partial. (Unless Overdue takes precedence?)
  // Let's say if NOT all returned AND some returned -> Partial.
  // Prioritize Overdue? Usually Overdue is important. But Partial Return is also a status.
  // Let's use: If Overdue, keep Overdue unless fully returned. 
  // Actually, user requested Partial Status.
  
  let newStatus = rental.status;
  if (allReturned) {
      newStatus = RentalStatus.RETURNED;
  } else {
      const someReturned = updatedItems.some(i => i.returned);
      // If currently Active or Partial, and some returned -> Partial
      // If currently Overdue, we might want to keep it Overdue or show Partial Overdue. 
      // For simplicity: If Overdue, stay Overdue. If Active, become Partial.
      if (rental.status === RentalStatus.ACTIVE && someReturned) {
          newStatus = RentalStatus.PARTIAL;
      }
  }
  
  rentals[index] = {
    ...rental,
    items: updatedItems,
    status: newStatus
  };

  localStorage.setItem(KEYS.RENTALS, JSON.stringify(rentals));
};

// --- Sales ---
export const getSales = (): Sale[] => {
    const data = localStorage.getItem(KEYS.SALES);
    return data ? JSON.parse(data) : [];
};

export const saveSale = (saleData: { customerId?: string, customerName: string, items: {itemId: string, quantity: number, price: number}[], date: string }) => {
    const inventory = getInventory();
    
    // 1. Verify Stock & Deduct
    saleData.items.forEach(saleItem => {
        const invIndex = inventory.findIndex(i => i.id === saleItem.itemId);
        if (invIndex === -1) throw new Error("Item not found");
        
        // Use getAvailableStock to check if we can physically sell (must be in warehouse, not rented)
        const available = getAvailableStock(saleItem.itemId);
        if (available < saleItem.quantity) {
             throw new Error(`Insufficient stock for item: ${inventory[invIndex].name}. Available: ${available}`);
        }

        // Permanently reduce total quantity
        inventory[invIndex].totalQuantity -= saleItem.quantity;
    });
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));

    // 2. Create Sale Record
    const sales = getSales();
    const totalAmount = saleData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const newSale: Sale = {
        id: generateId(),
        customerId: saleData.customerId,
        customerName: saleData.customerName,
        date: saleData.date,
        items: saleData.items.map(i => {
            const invItem = inventory.find(inv => inv.id === i.itemId);
            return {
                itemId: i.itemId,
                itemName: invItem?.name || 'Unknown',
                quantity: i.quantity,
                unitPrice: i.price,
                total: i.price * i.quantity
            };
        }),
        totalAmount,
        createdAt: new Date().toISOString()
    };
    sales.push(newSale);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));

    // 3. Auto-Record Payment (Sales are usually immediate, or we can leave due. Let's record full payment for MVP)
    addPayment({
        saleId: newSale.id,
        amount: totalAmount,
        date: saleData.date,
        note: 'Sale Payment'
    });
};

// --- Payments ---
export const getPayments = (): Payment[] => {
  const data = localStorage.getItem(KEYS.PAYMENTS);
  return data ? JSON.parse(data) : [];
};

export const addPayment = (payment: Omit<Payment, 'id'>) => {
  const payments = getPayments();
  payments.push({ ...payment, id: generateId() });
  localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
};

export const getRentalPayments = (rentalId: string) => {
  return getPayments().filter(p => p.rentalId === rentalId);
};

// --- Notes ---
export const getNotes = (): Note[] => {
  const data = localStorage.getItem(KEYS.NOTES);
  return data ? JSON.parse(data) : [];
};

export const addNote = (content: string) => {
  const notes = getNotes();
  notes.unshift({ id: generateId(), content, createdAt: new Date().toISOString() });
  localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
};

export const deleteNote = (id: string) => {
    const notes = getNotes().filter(n => n.id !== id);
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
};

// --- Stats Helpers ---
export const getAvailableStock = (itemId: string): number => {
  const inventory = getInventory();
  const item = inventory.find(i => i.id === itemId);
  if (!item) return 0;

  const rentals = getRentals();
  const activeRentals = rentals.filter(r => r.status !== RentalStatus.RETURNED);
  
  let rentedQty = 0;
  activeRentals.forEach(r => {
    r.items.forEach(ri => {
      if (ri.itemId === itemId && !ri.returned) {
        rentedQty += ri.quantity;
      }
    });
  });

  return Math.max(0, item.totalQuantity - rentedQty);
};

export const seedDatabase = () => {
    if(localStorage.getItem(KEYS.CUSTOMERS)) return;

    // Seed Data
    saveCustomer({ name: 'John Doe', phone: '01700000000', address: 'Dhaka, Bangladesh' });
    saveCustomer({ name: 'Event Pro Ltd', phone: '01800000000', address: 'Chittagong' });

    saveInventoryItem({ name: 'LED Par Light', dailyRentPrice: 500, sellingPrice: 2500, totalQuantity: 20, category: 'Lights' });
    saveInventoryItem({ name: 'Wireless Mic', dailyRentPrice: 1000, sellingPrice: 15000, totalQuantity: 5, category: 'Audio' });
    saveInventoryItem({ name: 'Projector 4K', dailyRentPrice: 5000, sellingPrice: 80000, totalQuantity: 2, category: 'Visual' });
}
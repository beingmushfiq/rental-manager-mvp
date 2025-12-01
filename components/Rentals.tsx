import React, { useState, useEffect } from 'react';
import { Rental, Customer, InventoryItem, RentalStatus } from '../types';
import { getRentals, getCustomers, getInventory, saveRental, getAvailableStock, updateRentalStatus, getRentalPayments, addPayment } from '../services/mockDb';
import { Plus, Search, Calendar, ChevronRight, X, AlertCircle, CheckCircle, Banknote, ArrowLeft, Clock } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'details';

interface RentalsProps {
    initialView?: 'list' | 'create';
}

const Rentals: React.FC<RentalsProps> = ({ initialView }) => {
  const [view, setView] = useState<ViewMode>(initialView === 'create' ? 'create' : 'list');
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Form State
  const [formData, setFormData] = useState({
    customerId: '',
    rentDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    items: [] as { itemId: string, quantity: number, price: number }[]
  });

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    refreshData();
  }, [view]);

  // Handle external navigation
  useEffect(() => {
    if (initialView && initialView !== view) {
        if(initialView === 'create') setView('create');
        else if (initialView === 'list') setView('list');
    }
  }, [initialView]);

  const refreshData = () => {
    setRentals(getRentals());
    setCustomers(getCustomers());
    setInventory(getInventory());
  };

  const calculateTotal = () => {
    if (!formData.rentDate || !formData.expectedReturnDate) return 0;
    const start = new Date(formData.rentDate);
    const end = new Date(formData.expectedReturnDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity * days), 0);
  };

  const handleAddItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    
    // Check if already added
    if (formData.items.find(i => i.itemId === itemId)) return;

    setFormData({
      ...formData,
      items: [...formData.items, { itemId, quantity: 1, price: item.dailyRentPrice }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
     const newItems = [...formData.items];
     // Note: In a real app we would check stock against current cart, here simplified
     newItems[index].quantity = qty;
     setFormData({ ...formData, items: newItems });
  };

  const handleSubmitRental = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
        alert("Please add at least one item.");
        return;
    }
    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) return;

    saveRental({
        customerId: customer.id,
        customerName: customer.name,
        rentDate: formData.rentDate,
        expectedReturnDate: formData.expectedReturnDate,
        items: formData.items.map(i => {
            const invItem = inventory.find(inv => inv.id === i.itemId);
            return {
                itemId: i.itemId,
                itemName: invItem?.name || 'Unknown',
                quantity: i.quantity,
                dailyRentPrice: i.price,
                returned: false
            }
        })
    });
    
    // Reset and go back
    setFormData({
        customerId: '',
        rentDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: '',
        items: []
    });
    setView('list');
  };

  // --- Return Logic ---
  const confirmReturn = (itemIds: string[]) => {
      if (!selectedRental) return;
      if (confirm(`Mark ${itemIds.length} items as returned?`)) {
          updateRentalStatus(selectedRental.id, itemIds);
          // Reload rental
          const updated = getRentals().find(r => r.id === selectedRental.id);
          setSelectedRental(updated || null);
          refreshData();
      }
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRental) return;
    addPayment({
        rentalId: selectedRental.id,
        amount: Number(paymentAmount),
        date: new Date().toISOString()
    });
    setIsPayModalOpen(false);
    setPaymentAmount('');
    refreshData(); // updates dashboard logic elsewhere
  };

  // --- Views ---

  if (view === 'create') {
    const totalEst = calculateTotal();
    const days = (new Date(formData.expectedReturnDate).getTime() - new Date(formData.rentDate).getTime()) / (1000 * 3600 * 24) || 1;

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center">
            <button onClick={() => setView('list')} className="mr-4 text-slate-500 hover:text-indigo-600 font-medium transition flex items-center">
                <ArrowLeft className="w-4 h-4 mr-1" /> Cancel
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Create New Rental</h1>
        </div>
        
        <form onSubmit={handleSubmitRental} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                        Customer & Dates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Customer</label>
                            <select required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
                                value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
                                <option value="">-- Choose Customer --</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Issue Date</label>
                            <input required type="date" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
                                value={formData.rentDate} onChange={e => setFormData({...formData, rentDate: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Return Date</label>
                            <input required type="date" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
                                value={formData.expectedReturnDate} onChange={e => setFormData({...formData, expectedReturnDate: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                             <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                             Rental Items
                        </h3>
                        <div className="relative">
                            <select className="appearance-none bg-slate-50 border border-slate-200 rounded-xl text-sm py-2 pl-4 pr-10 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 transition cursor-pointer font-medium text-slate-700" onChange={(e) => {
                                if(e.target.value) handleAddItem(e.target.value);
                                e.target.value = '';
                            }}>
                                <option value="">+ Add Item to Rent</option>
                                {inventory.map(item => (
                                    <option key={item.id} value={item.id} disabled={getAvailableStock(item.id) <= 0}>
                                        {item.name} (Qty: {getAvailableStock(item.id)})
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <Plus className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                    
                    {formData.items.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            No items added yet. Select items from the list above.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {formData.items.map((item, idx) => {
                                const invItem = inventory.find(i => i.id === item.itemId);
                                return (
                                    <div key={item.itemId} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition">
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800">{invItem?.name}</p>
                                            <p className="text-xs text-slate-500">Rate: ৳{item.price}/day</p>
                                        </div>
                                        <div className="flex items-center space-x-6">
                                            <div className="flex items-center bg-white rounded-lg border border-slate-200 px-2 py-1">
                                                <span className="text-xs mr-2 text-slate-500 uppercase font-bold">Qty</span>
                                                <input type="number" min="1" max={getAvailableStock(item.itemId) + item.quantity} 
                                                    className="w-12 text-center text-sm font-bold focus:outline-none"
                                                    value={item.quantity} onChange={e => handleUpdateItemQty(idx, parseInt(e.target.value))} />
                                            </div>
                                            <p className="font-bold w-20 text-right text-slate-700">৳{item.price * item.quantity}</p>
                                            <button type="button" onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-red-500 transition">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center"><Banknote className="w-5 h-5 mr-2 text-emerald-400" /> Summary</h3>
                    <div className="space-y-4 mb-8 text-slate-300 text-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <span>Duration</span>
                            <span className="font-medium text-white">{Math.max(1, days)} Days</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <span>Total Items</span>
                            <span className="font-medium text-white">{formData.items.reduce((s, i) => s + i.quantity, 0)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-end mb-8">
                        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Estimated Total</span>
                        <span className="text-3xl font-bold text-emerald-400">৳{totalEst.toLocaleString()}</span>
                    </div>
                    <button disabled={formData.items.length === 0} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none">
                        Confirm Rental Issue
                    </button>
                </div>
            </div>
        </form>
      </div>
    );
  }

  if (view === 'details' && selectedRental) {
      const payments = getRentalPayments(selectedRental.id);
      const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const dueAmount = selectedRental.totalAmount - paidAmount;
      const unreturnedItems = selectedRental.items.filter(i => !i.returned);

      return (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
             <button onClick={() => setView('list')} className="text-slate-500 hover:text-indigo-600 font-medium transition flex items-center">
                 <ArrowLeft className="w-4 h-4 mr-1" /> Back to Rentals
             </button>
             
             <div className="flex flex-col xl:flex-row gap-8">
                {/* Main Details */}
                <div className="flex-1 space-y-8">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock className="w-32 h-32 text-indigo-600" />
                        </div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">Rental #{selectedRental.id.substring(0,8)}</h1>
                                <p className="text-slate-500 mt-1 flex items-center">Customer: <span className="font-bold text-slate-700 ml-1">{selectedRental.customerName}</span></p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                                selectedRental.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                selectedRental.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100' :
                                selectedRental.status === 'Partial Return' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                                {selectedRental.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm relative z-10">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Issue Date</span>
                                <span className="font-mono font-medium text-slate-700">{selectedRental.rentDate}</span>
                            </div>
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Expected Return</span>
                                <span className={`font-mono font-medium ${selectedRental.status === 'Overdue' ? 'text-red-600' : 'text-slate-700'}`}>{selectedRental.expectedReturnDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Rented Items</h3>
                            {unreturnedItems.length > 0 && (
                                <button onClick={() => confirmReturn(unreturnedItems.map(i => i.itemId))} className="text-xs font-bold bg-white border border-emerald-200 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition shadow-sm">
                                    Return All Remaining
                                </button>
                            )}
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 text-left">Item Name</th>
                                    <th className="px-6 py-3 text-center">Quantity</th>
                                    <th className="px-6 py-3 text-right">Status</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedRental.items.map(item => (
                                    <tr key={item.itemId} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 font-medium text-slate-700">{item.itemName}</td>
                                        <td className="px-6 py-4 text-center">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right">
                                            {item.returned ? 
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Returned</span> : 
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Pending</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!item.returned && (
                                                <button onClick={() => confirmReturn([item.itemId])} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition">
                                                    Mark Returned
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar: Payment & Summary */}
                <div className="w-full xl:w-96 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                            <Banknote className="w-5 h-5 mr-2 text-slate-400" /> Payment Status
                        </h3>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Total Bill</span>
                                <span className="font-bold text-slate-800">৳{selectedRental.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Amount Paid</span>
                                <span className="text-emerald-600 font-medium">- ৳{paidAmount.toLocaleString()}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="font-bold text-slate-800">Due Amount</span>
                                <span className={`font-bold text-2xl ${dueAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>৳{dueAmount.toLocaleString()}</span>
                            </div>
                        </div>
                        {dueAmount > 0 ? (
                            <button onClick={() => setIsPayModalOpen(true)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition transform active:scale-95">
                                Add Payment
                            </button>
                        ) : (
                            <div className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-center flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 mr-2" /> Fully Paid
                            </div>
                        )}
                        
                        <div className="mt-8">
                            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">Payment History</h4>
                            <div className="space-y-2">
                                {payments.map(p => (
                                    <div key={p.id} className="text-sm flex justify-between items-center text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="font-mono text-xs">{new Date(p.date).toLocaleDateString()}</span>
                                        <span className="font-bold text-slate-800">৳{p.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                {payments.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">No payments recorded.</p>}
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             {/* Payment Modal */}
             {isPayModalOpen && (
                 <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
                     <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
                         <h3 className="font-bold text-lg mb-1">Record Payment</h3>
                         <p className="text-sm text-slate-500 mb-6">Enter the amount received from customer.</p>
                         <form onSubmit={handleAddPayment}>
                             <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount (৳)</label>
                             <input type="number" autoFocus max={dueAmount} min="1" required 
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 mb-6 focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold"
                                value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                             <div className="flex space-x-3">
                                 <button type="button" onClick={() => setIsPayModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-600 transition">Cancel</button>
                                 <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 transition">Confirm</button>
                             </div>
                         </form>
                     </div>
                 </div>
             )}
        </div>
      );
  }

  // Default List View
  const filteredRentals = rentals.filter(r => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'Partial') return r.status === RentalStatus.PARTIAL;
      return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rentals</h1>
            <p className="text-slate-500 text-sm mt-1">Manage active issues and returns</p>
        </div>
        <button onClick={() => setView('create')} className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 font-medium">
          <Plus className="w-5 h-5 mr-2" />
          New Rental Issue
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-2 overflow-x-auto">
             {['all', 'Active', 'Overdue', 'Returned', 'Partial'].map(status => (
                 <button 
                    key={status}
                    onClick={() => setStatusFilter(status)} 
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        statusFilter === status 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                 >
                    {status === 'all' ? 'All Rentals' : status}
                 </button>
             ))}
        </div>
        <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-600">
                 <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                     <tr>
                         <th className="px-6 py-4">ID</th>
                         <th className="px-6 py-4">Customer</th>
                         <th className="px-6 py-4">Due Date</th>
                         <th className="px-6 py-4 text-center">Items</th>
                         <th className="px-6 py-4">Total</th>
                         <th className="px-6 py-4">Due</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4">Action</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {filteredRentals.length > 0 ? filteredRentals.map(rental => {
                         const paid = getRentalPayments(rental.id).reduce((sum, p) => sum + p.amount, 0);
                         const due = rental.totalAmount - paid;

                         return (
                         <tr key={rental.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => { setSelectedRental(rental); setView('details'); }}>
                             <td className="px-6 py-4 font-mono text-xs text-slate-400">#{rental.id.substring(0,6)}</td>
                             <td className="px-6 py-4 font-bold text-slate-800">{rental.customerName}</td>
                             <td className="px-6 py-4">
                                 <span className={rental.status === 'Overdue' ? 'text-red-600 font-bold flex items-center' : 'font-mono text-xs'}>
                                    {rental.status === 'Overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                                    {rental.expectedReturnDate}
                                 </span>
                             </td>
                             <td className="px-6 py-4 text-center">
                                 <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{rental.items.length}</span>
                             </td>
                             <td className="px-6 py-4 font-medium">৳{rental.totalAmount.toLocaleString()}</td>
                             <td className="px-6 py-4 font-medium">
                                <span className={due > 0 ? 'text-red-600 font-bold' : 'text-emerald-600 text-xs uppercase tracking-wide'}>
                                    {due > 0 ? `৳${due.toLocaleString()}` : 'Paid'}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    rental.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    rental.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100' :
                                    rental.status === 'Partial Return' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}>
                                    {rental.status}
                                </span>
                             </td>
                             <td className="px-6 py-4"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                         </tr>
                     )}) : (
                         <tr><td colSpan={8} className="text-center py-12 text-slate-400 italic">No rentals found matching this filter.</td></tr>
                     )}
                 </tbody>
             </table>
        </div>
      </div>
    </div>
  );
};

export default Rentals;
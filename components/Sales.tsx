import React, { useState, useEffect } from 'react';
import { Sale, Customer, InventoryItem } from '../types';
import { getSales, getCustomers, getInventory, saveSale, getAvailableStock } from '../services/mockDb';
import { Plus, Search, ShoppingCart, X, ChevronRight, ArrowLeft } from 'lucide-react';

interface SalesProps {
  initialView?: 'list' | 'create';
}

const Sales: React.FC<SalesProps> = ({ initialView }) => {
  const [view, setView] = useState<'list' | 'create'>(initialView || 'list');
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  // Create Form State
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '', // For guests
    date: new Date().toISOString().split('T')[0],
    items: [] as { itemId: string, quantity: number, price: number }[]
  });

  useEffect(() => {
    refreshData();
  }, [view]);

  // Update view if prop changes (though mostly for initial mount)
  useEffect(() => {
    if (initialView) setView(initialView);
  }, [initialView]);

  const refreshData = () => {
    setSales(getSales());
    setCustomers(getCustomers());
    setInventory(getInventory());
  };

  const handleAddItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    if (formData.items.find(i => i.itemId === itemId)) return;

    setFormData({
      ...formData,
      items: [...formData.items, { itemId, quantity: 1, price: item.sellingPrice || 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleUpdateItem = (index: number, field: 'quantity' | 'price', value: number) => {
      const newItems = [...formData.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
        alert("Please add items to sell.");
        return;
    }
    
    let custName = formData.customerName;
    if(formData.customerId) {
        custName = customers.find(c => c.id === formData.customerId)?.name || custName;
    }
    if(!custName) custName = "Guest Customer";

    try {
        saveSale({
            customerId: formData.customerId || undefined,
            customerName: custName,
            date: formData.date,
            items: formData.items
        });
        setFormData({ customerId: '', customerName: '', date: new Date().toISOString().split('T')[0], items: [] });
        setView('list');
    } catch (err: any) {
        alert(err.message);
    }
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (view === 'create') {
      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-center">
                <button onClick={() => setView('list')} className="mr-4 text-slate-500 hover:text-indigo-600 transition flex items-center font-medium">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Cancel
                </button>
                <h1 className="text-2xl font-bold text-slate-800">New Sale</h1>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                          <h3 className="font-bold text-lg text-slate-800 mb-6">Customer Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Customer (Optional)</label>
                                  <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value, customerName: ''})}>
                                      <option value="">-- Guest / Walk-in --</option>
                                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                  </select>
                              </div>
                              {!formData.customerId && (
                                  <div>
                                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer Name</label>
                                      <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        placeholder="Guest Name"
                                        value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                                  </div>
                              )}
                              <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sale Date</label>
                                  <input type="date" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                              </div>
                          </div>
                      </div>

                      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                           <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-800">Cart Items</h3>
                                <div className="relative">
                                    <select className="appearance-none bg-slate-50 border border-slate-200 rounded-xl text-sm py-2 pl-4 pr-10 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 transition cursor-pointer font-medium text-slate-700 min-w-[180px]" onChange={(e) => {
                                        if(e.target.value) handleAddItem(e.target.value);
                                        e.target.value = '';
                                    }}>
                                        <option value="">+ Add to Cart</option>
                                        {inventory.map(item => (
                                            <option key={item.id} value={item.id} disabled={getAvailableStock(item.id) <= 0}>
                                                {item.name} (Stock: {getAvailableStock(item.id)})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {formData.items.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                                        <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-400 text-sm">Cart is empty.</p>
                                    </div>
                                )}
                                {formData.items.map((item, idx) => {
                                    const invItem = inventory.find(i => i.id === item.itemId);
                                    const maxStock = getAvailableStock(item.itemId);
                                    
                                    return (
                                        <div key={item.itemId} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition">
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800">{invItem?.name}</p>
                                                <p className="text-xs text-slate-500">Available Stock: {maxStock}</p>
                                            </div>
                                            <div className="flex items-center space-x-6">
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] text-slate-400 uppercase font-bold mb-1">Qty</label>
                                                    <input type="number" min="1" max={maxStock} 
                                                        className="w-16 p-1.5 border border-slate-200 rounded-lg text-center text-sm font-semibold focus:outline-none focus:border-indigo-500"
                                                        value={item.quantity} onChange={e => handleUpdateItem(idx, 'quantity', parseInt(e.target.value))} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] text-slate-400 uppercase font-bold mb-1">Price</label>
                                                    <input type="number" min="0" 
                                                        className="w-20 p-1.5 border border-slate-200 rounded-lg text-right text-sm font-semibold focus:outline-none focus:border-indigo-500"
                                                        value={item.price} onChange={e => handleUpdateItem(idx, 'price', parseFloat(e.target.value))} />
                                                </div>
                                                <div className="w-24 text-right">
                                                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Total</label>
                                                    <p className="font-bold text-slate-800">৳{(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl">
                        <h3 className="text-lg font-bold mb-6 flex items-center"><ShoppingCart className="w-5 h-5 mr-2 text-purple-400" /> Sale Summary</h3>
                        <div className="space-y-4 mb-8 text-slate-300 text-sm">
                             <div className="flex justify-between pb-2 border-b border-slate-800"><span>Total Items</span><span className="text-white font-medium">{formData.items.reduce((s, i) => s + i.quantity, 0)}</span></div>
                        </div>
                        <div className="flex justify-between items-end mb-8">
                            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Grand Total</span>
                            <span className="text-3xl font-bold text-purple-400">৳{totalAmount.toLocaleString()}</span>
                        </div>
                        <button disabled={formData.items.length === 0} className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white shadow-lg shadow-purple-500/20 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            Complete Sale
                        </button>
                    </div>
                  </div>
              </form>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sales</h1>
            <p className="text-slate-500 text-sm mt-1">Track inventory sales</p>
        </div>
        <button onClick={() => setView('create')} className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 font-medium">
          <Plus className="w-5 h-5 mr-2" />
          New Sale
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                      <tr>
                          <th className="px-6 py-4">Sale ID</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">Items Summary</th>
                          <th className="px-6 py-4">Total Amount</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {sales.length > 0 ? [...sales].reverse().map(sale => (
                          <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-slate-400">#{sale.id.substring(0,6)}</td>
                              <td className="px-6 py-4">{new Date(sale.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-medium text-slate-800">{sale.customerName}</td>
                              <td className="px-6 py-4 text-xs text-slate-500">
                                  {sale.items.map(i => (
                                      <div key={i.itemId}>{i.itemName} <span className="text-slate-400">x{i.quantity}</span></div>
                                  ))}
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-800">৳{sale.totalAmount.toLocaleString()}</td>
                          </tr>
                      )) : (
                          <tr><td colSpan={5} className="text-center py-12 text-slate-400 italic">No sales records found.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default Sales;
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { getCustomers, saveCustomer, deleteCustomer, getRentals, getPayments } from '../services/mockDb';
import { Plus, Search, Trash2, Edit2, Phone, MapPin, User, Eye, Upload, X, ArrowLeft } from 'lucide-react';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    nid: '',
    photoUrl: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      // Try to fetch from API first
      const { fetchCustomers } = await import('../src/api/axios');
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (error) {
      // Fallback to mockDb
      console.error('Failed to load from API, using mock data:', error);
      setCustomers(getCustomers());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomer({
      ...formData,
      id: editingId || undefined
    });
    setFormData({ name: '', phone: '', address: '', nid: '', photoUrl: '' });
    setIsModalOpen(false);
    setEditingId(null);
    loadCustomers();
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      nid: customer.nid || '',
      photoUrl: customer.photoUrl || ''
    });
    setEditingId(customer.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(id);
      loadCustomers();
    }
  };

  const openNewModal = () => {
    setFormData({ name: '', phone: '', address: '', nid: '', photoUrl: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getCustomerStats = (customerId: string) => {
    const rentals = getRentals().filter(r => r.customerId === customerId);
    const payments = getPayments();
    
    let totalRentVal = 0;
    let totalPaid = 0;

    rentals.forEach(r => {
        totalRentVal += r.totalAmount;
        const rPayments = payments.filter(p => p.rentalId === r.id);
        totalPaid += rPayments.reduce((sum, p) => sum + p.amount, 0);
    });

    return {
        totalRentals: rentals.length,
        totalSpent: totalRentVal,
        totalDue: totalRentVal - totalPaid
    };
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  if (selectedCustomer) {
     const stats = getCustomerStats(selectedCustomer.id);
     const customerRentals = getRentals().filter(r => r.customerId === selectedCustomer.id);

     return (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <button onClick={() => setSelectedCustomer(null)} className="flex items-center text-slate-500 hover:text-indigo-600 transition font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customers
            </button>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {selectedCustomer.photoUrl ? (
                            <img src={selectedCustomer.photoUrl} alt={selectedCustomer.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-slate-300" />
                        )}
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800">{selectedCustomer.name}</h2>
                                <div className="flex flex-wrap gap-4 mt-2 text-slate-500 text-sm">
                                    <span className="flex items-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Phone className="w-3 h-3 mr-2 text-slate-400" /> {selectedCustomer.phone}</span>
                                    {selectedCustomer.address && <span className="flex items-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><MapPin className="w-3 h-3 mr-2 text-slate-400" /> {selectedCustomer.address}</span>}
                                    {selectedCustomer.nid && <span className="flex items-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100">NID: {selectedCustomer.nid}</span>}
                                </div>
                            </div>
                            <div className="text-left md:text-right bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Outstanding Due</p>
                                <p className={`text-2xl font-bold mt-1 ${stats.totalDue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>৳{stats.totalDue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Rental History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Items Count</th>
                                <th className="px-6 py-4">Total Amount</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {customerRentals.map(rent => (
                                <tr key={rent.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">{new Date(rent.rentDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{rent.items.length} items</td>
                                    <td className="px-6 py-4 font-medium">৳{rent.totalAmount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                            rent.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            rent.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100' :
                                            rent.status === 'Partial Return' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        }`}>
                                            {rent.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {customerRentals.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No rental history found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Customers</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your client database</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Financials</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => {
                    const stats = getCustomerStats(customer.id);
                    return (
                        <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4 text-slate-400 overflow-hidden border border-slate-200 shadow-sm">
                                {customer.photoUrl ? (
                                    <img src={customer.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5" />
                                )}
                            </div>
                            {customer.name}
                            </td>
                            <td className="px-6 py-4">{customer.phone}</td>
                            <td className="px-6 py-4 text-slate-500">{customer.address || '-'}</td>
                            <td className="px-6 py-4">
                                {stats.totalDue > 0 ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs font-bold">
                                        Due: ৳{stats.totalDue.toLocaleString()}
                                    </span>
                                ) : (
                                    <span className="text-emerald-600 text-xs font-medium flex items-center">
                                        All Clear
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setSelectedCustomer(customer)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="View Profile">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleEdit(customer)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(customer.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                        <User className="w-12 h-12 text-slate-200 mb-2" />
                        <p>No customers found.</p>
                        <button onClick={openNewModal} className="mt-2 text-indigo-600 hover:underline font-medium">Add your first customer</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Customer' : 'New Customer'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition">
                  <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Photo Upload */}
              <div className="flex justify-center mb-2">
                <div className="relative group">
                     <div className="w-28 h-28 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-colors">
                        {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-2">
                                <User className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                                <span className="text-[10px] text-slate-400">No Photo</span>
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg border-2 border-white transition-transform hover:scale-105 active:scale-95">
                        <Upload className="w-4 h-4" />
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                    <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="017..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
                    <textarea className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" rows={2} placeholder="Full address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">NID / Birth Certificate</label>
                    <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="Optional ID number" value={formData.nid} onChange={e => setFormData({...formData, nid: e.target.value})} />
                </div>
              </div>

              <div className="pt-2">
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
                    {editingId ? 'Update Customer' : 'Create Customer'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
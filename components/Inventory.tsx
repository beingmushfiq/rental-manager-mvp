import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { getInventory, saveInventoryItem, deleteInventoryItem, getAvailableStock } from '../services/mockDb';
import { Plus, Search, Trash2, Edit2, Package, Layers, Upload, Image as ImageIcon, X, AlertTriangle } from 'lucide-react';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    dailyRentPrice: '',
    sellingPrice: '',
    totalQuantity: '',
    description: '',
    photoUrl: ''
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = () => {
    setItems(getInventory());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveInventoryItem({
      name: formData.name,
      category: formData.category,
      description: formData.description,
      dailyRentPrice: Number(formData.dailyRentPrice),
      sellingPrice: Number(formData.sellingPrice),
      totalQuantity: Number(formData.totalQuantity),
      photoUrl: formData.photoUrl,
      id: editingId || undefined
    });
    setIsModalOpen(false);
    loadInventory();
  };

  const handleEdit = (item: InventoryItem) => {
    setFormData({
      name: item.name,
      category: item.category || '',
      description: item.description || '',
      dailyRentPrice: item.dailyRentPrice.toString(),
      sellingPrice: item.sellingPrice?.toString() || '',
      totalQuantity: item.totalQuantity.toString(),
      photoUrl: item.photoUrl || ''
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this item from inventory?')) {
      deleteInventoryItem(id);
      loadInventory();
    }
  };

  const openNewModal = () => {
    setFormData({ name: '', category: '', dailyRentPrice: '', sellingPrice: '', totalQuantity: '', description: '', photoUrl: '' });
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

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventory</h1>
            <p className="text-slate-500 text-sm mt-1">Manage equipment and stock</p>
        </div>
        <button onClick={openNewModal} className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 font-medium">
          <Plus className="w-5 h-5 mr-2" />
          Add Item
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
           <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search items by name or category..." 
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
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Rental Price</th>
                <th className="px-6 py-4 text-center">Selling Price</th>
                <th className="px-6 py-4 text-center">Availability</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const available = getAvailableStock(item.id);
                  const isLowStock = available === 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mr-4 text-slate-400 overflow-hidden border border-slate-200 shrink-0">
                           {item.photoUrl ? (
                               <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                           ) : (
                               <Layers className="w-6 h-6" />
                           )}
                        </div>
                        <div>
                            <div className="font-semibold">{item.name}</div>
                            {item.description && <p className="text-xs text-slate-400 font-normal truncate max-w-[150px]">{item.description}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {item.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">৳{item.dailyRentPrice}</td>
                      <td className="px-6 py-4 text-center text-slate-500">{item.sellingPrice ? `৳${item.sellingPrice}` : '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                            <span className={`font-bold text-lg ${isLowStock ? 'text-red-500' : 'text-emerald-600'}`}>
                                {available}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">of {item.totalQuantity} Total</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                         <div className="flex flex-col items-center justify-center">
                            <Package className="w-12 h-12 text-slate-200 mb-2" />
                            <p>No inventory items found.</p>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Item' : 'New Inventory Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition">
                  <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Item Photo</label>
                <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                    </div>
                    <label className="flex-1 cursor-pointer group">
                        <div className="flex flex-col items-center justify-center w-full px-4 py-3 bg-white border border-slate-300 border-dashed rounded-xl group-hover:border-indigo-400 group-hover:bg-indigo-50 transition">
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 mb-1" />
                            <span className="text-xs text-slate-500 group-hover:text-indigo-600 font-medium">Click to upload image</span>
                        </div>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Item Name <span className="text-red-500">*</span></label>
                <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="e.g. LED Par Light" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                    <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" placeholder="e.g. Lighting" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rent Price (Daily) <span className="text-red-500">*</span></label>
                    <input required type="number" min="0" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" value={formData.dailyRentPrice} onChange={e => setFormData({...formData, dailyRentPrice: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Total Quantity <span className="text-red-500">*</span></label>
                    <input required type="number" min="1" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" value={formData.totalQuantity} onChange={e => setFormData({...formData, totalQuantity: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Selling Price</label>
                    <input type="number" min="0" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" rows={2} placeholder="Item details..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <div className="pt-2">
                 <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
                    {editingId ? 'Update Item' : 'Save Item'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
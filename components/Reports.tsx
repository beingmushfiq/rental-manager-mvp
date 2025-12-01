import React, { useState, useEffect, useMemo } from 'react';
import { getPayments, getRentals, getNotes, addNote, deleteNote, getSales } from '../services/mockDb';
import { Note, Payment } from '../types';
import { Trash2, StickyNote, ArrowUpRight, ArrowDownLeft, History, Wallet, TrendingUp, Calendar } from 'lucide-react';

interface ReportStats {
    rentGenerated: number;
    salesRevenue: number;
    paymentsReceived: number;
    dueFromRent: number;
}

interface EnrichedTransaction extends Payment {
    sourceType: 'Rental' | 'Sale' | 'Other';
    sourceRef: string;
    customerName: string;
}

const Reports: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setNotes(getNotes());
    
    // Prepare Transactions
    const payments = getPayments();
    const rentals = getRentals();
    const sales = getSales();

    const enriched = payments.map(p => {
        let sourceType: 'Rental' | 'Sale' | 'Other' = 'Other';
        let sourceRef = '-';
        let customerName = 'Unknown';

        if (p.rentalId) {
            const r = rentals.find(x => x.id === p.rentalId);
            sourceType = 'Rental';
            sourceRef = r ? `#${r.id.substring(0,6)}` : 'Unknown';
            customerName = r?.customerName || 'Unknown';
        } else if (p.saleId) {
            const s = sales.find(x => x.id === p.saleId);
            sourceType = 'Sale';
            sourceRef = s ? `#${s.id.substring(0,6)}` : 'Unknown';
            customerName = s?.customerName || 'Unknown';
        }

        return {
            ...p,
            sourceType,
            sourceRef,
            customerName
        };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTransactions(enriched);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNote(newNote);
    setNewNote('');
    loadData(); // Reload notes
  };

  const handleDeleteNote = (id: string) => {
    if(confirm('Delete this note?')) {
        deleteNote(id);
        loadData();
    }
  };

  const stats = useMemo(() => {
    const rentals = getRentals();
    const sales = getSales();
    const payments = getPayments();
    const today = new Date();
    
    // Helpers
    const isToday = (d: Date) => d.toDateString() === today.toDateString();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const isThisWeek = (d: Date) => d >= weekStart;
    const isThisMonth = (d: Date) => d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

    const calculateStats = (filterFn: (d: Date) => boolean): ReportStats => {
        // 1. Rent Generated
        const periodRentals = rentals.filter(r => filterFn(new Date(r.rentDate)));
        const rentGenerated = periodRentals.reduce((sum, r) => sum + r.totalAmount, 0);

        // 2. Sales Revenue
        const periodSales = sales.filter(s => filterFn(new Date(s.date)));
        const salesRevenue = periodSales.reduce((sum, s) => sum + s.totalAmount, 0);

        // 3. Total Payments Received (Cash Flow)
        const periodPayments = payments.filter(p => filterFn(new Date(p.date)));
        const paymentsReceived = periodPayments.reduce((sum, p) => sum + p.amount, 0);

        // 4. Due Remaining (Rental only, assuming sales are cash)
        const dueFromRent = periodRentals.reduce((sum, r) => {
            const paidForThis = payments.filter(p => p.rentalId === r.id).reduce((s, p) => s + p.amount, 0);
            return sum + Math.max(0, r.totalAmount - paidForThis);
        }, 0);

        return { rentGenerated, salesRevenue, paymentsReceived, dueFromRent };
    };

    return {
        daily: calculateStats(isToday),
        weekly: calculateStats(isThisWeek),
        monthly: calculateStats(isThisMonth),
    };
  }, [transactions]); // Update stats when transactions change (loaded)

  const ReportCard = ({ title, data, colorClass }: { title: string, data: ReportStats, colorClass: string }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
        <div>
            <div className={`flex items-center space-x-2 mb-4 ${colorClass}`}>
                <Calendar className="w-4 h-4" />
                <h3 className="font-bold uppercase text-xs tracking-wider">{title}</h3>
            </div>
            
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wide block mb-1">Rent Value</span>
                        <span className="font-bold text-slate-700">৳{data.rentGenerated.toLocaleString()}</span>
                    </div>
                     <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wide block mb-1">Sales Value</span>
                        <span className="font-bold text-slate-700">৳{data.salesRevenue.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center py-4 border-t border-slate-100">
                    <div className="flex items-center">
                        <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                             <span className="block text-xs text-slate-500 font-medium">Cash Collected</span>
                             <span className="font-bold text-emerald-600 text-lg">৳{data.paymentsReceived.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-400 text-xs font-medium">Unpaid Due</span>
                    <span className={`font-bold text-sm ${data.dueFromRent > 0 ? 'text-red-500' : 'text-slate-300'}`}>৳{data.dueFromRent.toLocaleString()}</span>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
            <div>
                 <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Reports</h1>
                 <p className="text-slate-500 text-sm mt-1">Income, Expenses & Cash Flow</p>
            </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReportCard title="Today's Performance" data={stats.daily} colorClass="text-indigo-600" />
            <ReportCard title="Last 7 Days" data={stats.weekly} colorClass="text-blue-600" />
            <ReportCard title="This Month" data={stats.monthly} colorClass="text-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
             {/* Transaction History - Unified View */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                            <History className="w-5 h-5 text-slate-500" />
                            <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
                        </div>
                    </div>
                    <div className="overflow-auto max-h-[600px]">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Source</th>
                                    <th className="px-6 py-4">Ref ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.length > 0 ? transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${
                                                tx.sourceType === 'Sale' 
                                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                                {tx.sourceType === 'Sale' ? <ArrowDownLeft className="w-3 h-3 mr-1"/> : <ArrowUpRight className="w-3 h-3 mr-1"/>}
                                                {tx.sourceType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{tx.sourceRef}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{tx.customerName}</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">৳{tx.amount.toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="text-center py-12 text-slate-400">No transactions recorded yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Notes / Expenses Section */}
            <div className="lg:col-span-1">
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center space-x-2">
                            <StickyNote className="w-5 h-5 text-amber-500" />
                            <h2 className="text-lg font-bold text-slate-800">Quick Notes & Expenses</h2>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col bg-slate-50/30">
                        {/* Add Note */}
                        <div className="mb-6">
                             <form onSubmit={handleAddNote} className="space-y-3">
                                <div className="relative">
                                    <textarea 
                                        className="w-full border border-slate-200 rounded-xl p-4 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm bg-white shadow-sm resize-none" 
                                        rows={3}
                                        placeholder="Log an expense or reminder..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                    ></textarea>
                                    <button 
                                        disabled={!newNote.trim()} 
                                        type="submit" 
                                        className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                             </form>
                        </div>

                        {/* List Notes */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[400px]">
                             {notes.length === 0 && (
                                <div className="text-center py-8 opacity-50">
                                    <StickyNote className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-slate-400 text-xs">No notes added yet.</p>
                                </div>
                             )}
                             {notes.map(note => (
                                 <div key={note.id} className="group p-4 bg-yellow-50 rounded-xl border border-yellow-100 shadow-sm hover:shadow-md transition relative">
                                     <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{note.content}</p>
                                     <div className="flex justify-between items-center mt-3 pt-3 border-t border-yellow-200/50">
                                         <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{new Date(note.createdAt).toLocaleDateString()}</span>
                                         <button onClick={() => handleDeleteNote(note.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition bg-white p-1 rounded-md shadow-sm">
                                             <Trash2 className="w-3 h-3" />
                                         </button>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default Reports;
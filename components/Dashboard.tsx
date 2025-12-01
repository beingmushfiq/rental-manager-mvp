import React, { useMemo } from 'react';
import { getCustomers, getInventory, getRentals, getPayments } from '../services/mockDb';
import { RentalStatus, ViewState } from '../types';
import { Users, Package, AlertCircle, DollarSign, Activity, ShoppingCart, TrendingUp, Calendar, ChevronRight } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: ViewState, action?: string) => void;
}

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 group">
    <div className="flex justify-between items-start">
        <div className="space-y-1">
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
    </div>
    {trend && (
         <div className="mt-4 flex items-center text-xs font-medium text-emerald-600">
             <TrendingUp className="w-3 h-3 mr-1" />
             <span>{trend}</span>
         </div>
    )}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const stats = useMemo(() => {
    const customers = getCustomers();
    const inventory = getInventory();
    const rentals = getRentals();
    const payments = getPayments();
    
    const activeRentals = rentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE);
    const overdueRentals = rentals.filter(r => r.status === RentalStatus.OVERDUE);
    
    // Calculate items currently out
    let itemsRented = 0;
    activeRentals.forEach(r => {
      r.items.forEach(i => {
        if (!i.returned) itemsRented += i.quantity;
      });
    });

    // Today's Income
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysIncome = payments
      .filter(p => p.date.startsWith(todayStr))
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalCustomers: customers.length,
      totalItems: inventory.length,
      itemsRented,
      overdueCount: overdueRentals.length,
      todaysIncome
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-600">
             <Calendar className="w-4 h-4 text-slate-400" />
             <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Customers" 
          value={stats.totalCustomers} 
          icon={Users} 
          color="bg-blue-500"
          trend="+2 this week"
        />
        <StatCard 
          title="Items Rented Out" 
          value={stats.itemsRented} 
          icon={Activity} 
          color="bg-orange-500"
          trend="Currently active"
        />
        <StatCard 
          title="Overdue Rentals" 
          value={stats.overdueCount} 
          icon={AlertCircle} 
          color="bg-red-500"
          trend="Action needed"
        />
        <StatCard 
          title="Today's Income" 
          value={`৳${stats.todaysIncome.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-emerald-600"
          trend="Daily revenue"
        />
      </div>

      <div className="flex justify-center mt-8">
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Shortcuts</span>
           </div>
           <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <button onClick={() => onNavigate('sales', 'create')} className="group relative p-6 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 text-center flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-purple-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <ShoppingCart className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <span className="block font-bold text-slate-700 group-hover:text-purple-700">New Sale</span>
                        <span className="text-xs text-slate-400 group-hover:text-purple-400">Process item sale</span>
                    </div>
                 </button>

                 <button onClick={() => onNavigate('rentals', 'create')} className="group relative p-6 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 text-center flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-indigo-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Activity className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <span className="block font-bold text-slate-700 group-hover:text-indigo-700">New Rental</span>
                        <span className="text-xs text-slate-400 group-hover:text-indigo-400">Issue equipment</span>
                    </div>
                 </button>

                 <button onClick={() => onNavigate('rentals')} className="group relative p-6 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 text-center flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-emerald-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Package className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <span className="block font-bold text-slate-700 group-hover:text-emerald-700">Returns</span>
                        <span className="text-xs text-slate-400 group-hover:text-emerald-400">Process returns</span>
                    </div>
                 </button>

                 <button onClick={() => onNavigate('customers')} className="group relative p-6 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 text-center flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-blue-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <span className="block font-bold text-slate-700 group-hover:text-blue-700">Customers</span>
                        <span className="text-xs text-slate-400 group-hover:text-blue-400">Manage directory</span>
                    </div>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Package, ShoppingBag, BarChart3, Menu, X, ShoppingCart, Sparkles } from 'lucide-react';
import { ViewState } from './types';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Inventory from './components/Inventory';
import Rentals from './components/Rentals';
import Reports from './components/Reports';
import Sales from './components/Sales';
import { seedDatabase } from './services/mockDb';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    seedDatabase();
  }, []);

  const handleNavigate = (view: ViewState, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => handleNavigate(view)}
      className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentView === view ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
      <span>{label}</span>
      {currentView === view && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
    </button>
  );

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-slate-900/95 backdrop-blur-md p-4 z-50 flex justify-between items-center text-white border-b border-white/5 shadow-md">
        <div className="flex items-center space-x-2">
           <div className="bg-indigo-500 p-1.5 rounded-lg">
             <Sparkles className="w-5 h-5 text-white" />
           </div>
           <span className="font-bold text-lg tracking-tight">Rental Manager</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg transition">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 lg:static lg:flex flex-col shadow-2xl lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-6">
          <div className="flex items-center space-x-3 mb-1">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
               <h1 className="text-xl font-bold tracking-tight text-white leading-none">Rental Manager</h1>
               <p className="text-xs text-slate-400 font-medium mt-1">Event Solutions</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Menu</div>
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="rentals" icon={ShoppingBag} label="Rentals" />
          <NavItem view="sales" icon={ShoppingCart} label="Sales" />
          
          <div className="px-4 py-2 mt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Management</div>
          <NavItem view="customers" icon={Users} label="Customers" />
          <NavItem view="inventory" icon={Package} label="Inventory" />
          <NavItem view="reports" icon={BarChart3} label="Reports" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto pt-20 lg:pt-0 scroll-smooth">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 min-h-full">
          {currentView === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {currentView === 'customers' && <Customers />}
          {currentView === 'inventory' && <Inventory />}
          {currentView === 'rentals' && <Rentals initialView={viewParam as any} />}
          {currentView === 'sales' && <Sales initialView={viewParam as any} />}
          {currentView === 'reports' && <Reports />}
        </div>
        
        <div className="text-center py-6 text-slate-400 text-xs">
            &copy; 2025 Rental Manager MVP. All rights reserved.
        </div>
      </main>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-30 lg:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
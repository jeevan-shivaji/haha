
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, TrendingUp, Landmark, MessageSquareText, Menu, X, PiggyBank, Building2, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/accounts', icon: Building2, label: 'Bank Accounts' },
    { to: '/transactions', icon: Wallet, label: 'Transactions' },
    { to: '/investments', icon: TrendingUp, label: 'Investments' },
    { to: '/tax-hub', icon: Landmark, label: 'Tax Hub' },
    { to: '/advisor', icon: MessageSquareText, label: 'AI Advisor' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 dark:bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <PiggyBank className="text-emerald-400" size={28} />
            <span>WealthMind</span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400 uppercase font-semibold">Appearance</span>
            <button 
              onClick={toggleTheme}
              className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          
          <button 
            onClick={() => {
              navigate('/profile');
              setIsSidebarOpen(false);
            }}
            className="flex items-center gap-3 w-full p-2 -mx-2 rounded-xl hover:bg-slate-800 transition-colors group text-left"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30 group-hover:border-emerald-500/50 transition-colors">
              JS
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-emerald-400 transition-colors">John Smith</p>
              <p className="text-xs text-slate-400">Pro Plan</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
            <PiggyBank className="text-emerald-500" size={24} />
            WealthMind
          </div>
          <button onClick={toggleSidebar} className="text-slate-600 dark:text-slate-400 p-2">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 scroll-smooth bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;


import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, Percent, Smartphone, TrendingUp, Repeat, Coins, ShieldCheck, CheckCircle2, Zap, Info, ArrowUp, Rocket, Target, AlertTriangle, Plus, X, Sparkles } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, BankAccount, Investment, SIP, Budget } from '../types';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';

interface DashboardProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  portfolio: Investment[];
  setPortfolio: React.Dispatch<React.SetStateAction<Investment[]>>;
  sips?: SIP[];
  setSips: React.Dispatch<React.SetStateAction<SIP[]>>;
  budgets?: Budget[];
  setBudgets?: React.Dispatch<React.SetStateAction<Budget[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, accounts, portfolio, setPortfolio, sips = [], setSips, budgets = [], setBudgets }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // --- Budget Module State ---
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: '', limit: '' });

  // Calculate Spend vs Budget
  const budgetAnalysis = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 1. Filter expenses for current month
    const monthlyExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === TransactionType.EXPENSE && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // 2. Map budgets to actual spending
    return budgets.map(b => {
      const spent = monthlyExpenses
        .filter(t => t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...b,
        spent,
        percentage: Math.min((spent / b.limit) * 100, 100),
        isOver: spent > b.limit
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, transactions]);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (setBudgets && budgetForm.category && budgetForm.limit) {
      // Check if exists
      const existingIdx = budgets.findIndex(b => b.category.toLowerCase() === budgetForm.category.toLowerCase());
      if (existingIdx >= 0) {
        // Update
        setBudgets(prev => prev.map((b, idx) => idx === existingIdx ? { ...b, limit: parseFloat(budgetForm.limit) } : b));
      } else {
        // Add
        setBudgets(prev => [...prev, {
          id: Date.now().toString(),
          category: budgetForm.category,
          limit: parseFloat(budgetForm.limit),
          period: 'MONTHLY'
        }]);
      }
      setBudgetForm({ category: '', limit: '' });
      setIsBudgetModalOpen(false);
    }
  };
  // ---------------------------

  // --- Digital Gold Module State ---
  const [metalType, setMetalType] = useState<'GOLD' | 'SILVER'>('GOLD');
  const [buyMode, setBuyMode] = useState<'ONCE' | 'SIP'>('ONCE');
  const [metalAmount, setMetalAmount] = useState('');
  const [isProcessingMetal, setIsProcessingMetal] = useState(false);

  // Live Price Simulation
  const [liveGoldPrice, setLiveGoldPrice] = useState(12500.00);
  const [liveSilverPrice, setLiveSilverPrice] = useState(185.00);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveGoldPrice(prev => Number((prev + (Math.random() - 0.5) * 2).toFixed(2)));
      setLiveSilverPrice(prev => Number((prev + (Math.random() - 0.5) * 0.1).toFixed(2)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentMetalPrice = metalType === 'GOLD' ? liveGoldPrice : liveSilverPrice;
  
  // GST Calculation (3%)
  const amountVal = parseFloat(metalAmount) || 0;
  const netInvestment = amountVal / 1.03;
  const gstAmount = amountVal - netInvestment;
  const estimatedGrams = (netInvestment / currentMetalPrice).toFixed(4);

  const handleMetalInvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metalAmount) return;
    setIsProcessingMetal(true);

    setTimeout(() => {
        if (buyMode === 'ONCE') {
            const newInvestment: Investment = {
                id: `metal-${Date.now()}`,
                symbol: metalType === 'GOLD' ? 'GOLD-999' : 'SILVER-999',
                name: `Digital ${metalType === 'GOLD' ? 'Gold' : 'Silver'}`,
                shares: parseFloat(estimatedGrams),
                avgCost: currentMetalPrice,
                currentPrice: currentMetalPrice,
                type: metalType
            };
            setPortfolio(prev => [...prev, newInvestment]);
            alert(`Successfully purchased ${estimatedGrams}g of Digital ${metalType} (incl. ₹${gstAmount.toFixed(2)} GST)!`);
        } else {
            const newSip: SIP = {
                id: `sip-${Date.now()}`,
                name: `Digital ${metalType === 'GOLD' ? 'Gold' : 'Silver'} SIP`,
                amount: parseFloat(metalAmount),
                frequency: 'MONTHLY',
                nextDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                startDate: new Date().toISOString().split('T')[0],
                active: true,
                type: metalType
            };
            setSips(prev => [...prev, newSip]);
            alert(`${metalType} Autopay SIP setup successful!`);
        }
        setMetalAmount('');
        setIsProcessingMetal(false);
    }, 1500);
  };
  // -------------------------------

  // Compute Stats
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const bankAssets = accounts
    .filter(a => a.type === 'CHECKING' || a.type === 'SAVINGS' || a.type === 'INVESTMENT')
    .reduce((sum, a) => sum + a.balance, 0);
  
  const bankLiabilities = accounts
    .filter(a => a.type === 'CREDIT_CARD')
    .reduce((sum, a) => sum + a.balance, 0);

  const investmentValue = portfolio.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
  
  const hasConnectedData = accounts.length > 0 || portfolio.length > 0;
  const netWorth = hasConnectedData 
    ? (bankAssets + investmentValue - bankLiabilities) 
    : (totalIncome - totalExpense + 45000); 

  // Payment Method Data for Pie Chart
  const expenseTransactions = transactions.filter(t => t.type === TransactionType.EXPENSE);
  const paymentMethods: PaymentMethod[] = ['UPI', 'CARD', 'CASH', 'BANK', 'MOBILE_WALLET'];
  const paymentData = paymentMethods.map(method => ({
    name: method === 'MOBILE_WALLET' ? 'WALLET' : method,
    value: expenseTransactions.filter(t => t.paymentMethod === method).reduce((sum, t) => sum + t.amount, 0)
  })).filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#64748b', '#a855f7']; 

  const cashFlowData = [
    { name: 'Jan', income: 4000, expense: 2400 },
    { name: 'Feb', income: 3000, expense: 1398 },
    { name: 'Mar', income: 2000, expense: 9800 },
    { name: 'Apr', income: 2780, expense: 3908 },
    { name: 'May', income: 1890, expense: 4800 },
    { name: 'Jun', income: 2390, expense: 3800 },
    { name: 'Jul', income: 3490, expense: 4300 },
  ];

  const netWorthTrendData = [
    { month: 'Jan', value: netWorth * 0.85 },
    { month: 'Feb', value: netWorth * 0.88 },
    { month: 'Mar', value: netWorth * 0.87 },
    { month: 'Apr', value: netWorth * 0.91 },
    { month: 'May', value: netWorth * 0.93 },
    { month: 'Jun', value: netWorth * 0.95 },
    { month: 'Jul', value: netWorth * 0.98 },
    { month: 'Aug', value: netWorth * 0.96 },
    { month: 'Sep', value: netWorth * 0.99 },
    { month: 'Oct', value: netWorth * 1.02 },
    { month: 'Nov', value: netWorth * 1.05 },
    { month: 'Dec', value: netWorth } 
  ];

  const StatCard = ({ title, value, trend, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );

  const chartAxisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const chartGridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipStyle = { 
    borderRadius: '12px', 
    border: 'none', 
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
    color: theme === 'dark' ? '#f8fafc' : '#0f172a'
  };

  return (
    <div className="space-y-6 relative">
      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Set Budget Goal</h3>
                    <button onClick={() => setIsBudgetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                 </div>
                 <form onSubmit={handleSaveBudget} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Category</label>
                        <input 
                            type="text"
                            required
                            placeholder="e.g. Food, Travel"
                            value={budgetForm.category}
                            onChange={e => setBudgetForm({...budgetForm, category: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Monthly Limit</label>
                        <input 
                            type="number"
                            required
                            placeholder="500"
                            value={budgetForm.limit}
                            onChange={e => setBudgetForm({...budgetForm, limit: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                        Save Budget
                    </button>
                 </form>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, here's what's happening with your money.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Net Worth" 
          value={`$${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
          trend={12.5} 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Total Income" 
          value={`$${totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
          trend={8.2} 
          icon={Wallet} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Total Expenses" 
          value={`$${totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
          trend={-2.4} 
          icon={ArrowDownRight} 
          color="bg-rose-500" 
        />
        <StatCard 
          title="UPI Spend" 
          value={`$${(paymentData.find(d => d.name === 'UPI')?.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
          trend={15.4} 
          icon={Smartphone} 
          color="bg-indigo-500" 
        />
      </div>

      {/* SIP CTA BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-8 md:p-12 shadow-2xl my-6 group">
         
         {/* Animated Background Visuals */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
         </div>

         {/* Floating Icons Visuals */}
         <div className="absolute top-10 left-10 text-white/10 animate-bounce duration-[3000ms]">
            <DollarSign size={64} />
         </div>
         <div className="absolute bottom-10 right-10 text-white/10 animate-bounce duration-[4000ms] delay-500">
            <TrendingUp size={64} />
         </div>

         <div className="relative z-10 flex flex-col items-center justify-center text-center">
            
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
               <span className="text-white text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                 <Sparkles size={14} className="text-yellow-300" /> Wealth Building
               </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-sm max-w-3xl leading-tight">
               Build Your Fortune with <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-emerald-200">Smart SIPs</span>
            </h2>
            
            <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed opacity-90">
               Automate your monthly investments. Small consistent steps lead to massive financial leaps.
            </p>

            <button 
               onClick={() => navigate('/investments?tab=sip')}
               className="group/btn relative inline-flex items-center gap-4 px-10 py-5 bg-white text-indigo-700 rounded-2xl font-black text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:scale-105 transition-all duration-300 transform active:scale-95"
            >
               <div className="bg-indigo-50 p-2 rounded-full group-hover/btn:rotate-12 transition-transform duration-300">
                  <Rocket size={32} className="text-indigo-600" />
               </div>
               Start SIP Now
               <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white animate-bounce">
                  Best Value
               </div>
            </button>
            
            <div className="mt-8 flex items-center gap-6 text-indigo-200 text-sm font-medium">
               <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-emerald-400" /> Tax Efficient</span>
               <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-emerald-400" /> Auto-Debited</span>
               <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-emerald-400" /> High Returns</span>
            </div>
         </div>
      </div>

      {/* Row 2: Digital Gold & Net Worth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital Precious Metals Module */}
        <div className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-slate-900 dark:to-slate-900 rounded-2xl border border-amber-100 dark:border-slate-800 shadow-sm relative overflow-hidden p-6 flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-yellow-300 dark:bg-amber-600 rounded-full opacity-20 blur-3xl"></div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                        <Coins size={20} />
                    </div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-lg">Digital Bullion</h2>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100/50 dark:bg-amber-900/30 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Live</span>
                  </div>
              </div>

              {/* Market Rates Display & Selector */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                      onClick={() => setMetalType('GOLD')}
                      className={`relative p-3 rounded-xl border text-left transition-all group ${metalType === 'GOLD' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 shadow-sm ring-1 ring-amber-500/50' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-slate-700'}`}
                  >
                      <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-bold ${metalType === 'GOLD' ? 'text-amber-700 dark:text-amber-500' : 'text-slate-500'}`}>Gold 24K</span>
                          {metalType === 'GOLD' && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
                      </div>
                      <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">₹{liveGoldPrice.toFixed(0)}</span>
                          <span className="text-xs text-slate-500">.{liveGoldPrice.toFixed(2).split('.')[1]}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-600">
                          <ArrowUp size={10} /> <span>+0.8% today</span>
                      </div>
                  </button>

                  <button
                      onClick={() => setMetalType('SILVER')}
                      className={`relative p-3 rounded-xl border text-left transition-all group ${metalType === 'SILVER' ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm ring-1 ring-slate-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                      <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-bold ${metalType === 'SILVER' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500'}`}>Silver 999</span>
                          {metalType === 'SILVER' && <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />}
                      </div>
                      <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">₹{liveSilverPrice.toFixed(0)}</span>
                          <span className="text-xs text-slate-500">.{liveSilverPrice.toFixed(2).split('.')[1]}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-600">
                           <ArrowUp size={10} /> <span>+1.2% today</span>
                      </div>
                  </button>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-4 text-sm font-medium mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                          type="radio" 
                          name="buyMode" 
                          checked={buyMode === 'ONCE'} 
                          onChange={() => setBuyMode('ONCE')}
                          className="accent-amber-500 w-4 h-4"
                      />
                      <span className={buyMode === 'ONCE' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}>One-time</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                          type="radio" 
                          name="buyMode" 
                          checked={buyMode === 'SIP'} 
                          onChange={() => setBuyMode('SIP')}
                          className="accent-amber-500 w-4 h-4"
                      />
                      <span className={`flex items-center gap-1 ${buyMode === 'SIP' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                          Autopay SIP <Zap size={12} className="text-amber-500 fill-amber-500" />
                      </span>
                  </label>
              </div>

              {/* Amount Input */}
              <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                      type="number"
                      value={metalAmount}
                      onChange={(e) => setMetalAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-lg"
                  />
                  {metalAmount && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          ~{estimatedGrams}g
                      </span>
                  )}
              </div>
              
              {/* GST Breakdown */}
              {metalAmount && (
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1 mb-3">
                   <div className="flex items-center gap-1">
                     <Info size={10} />
                     <span>Incl. 3% GST: ₹{gstAmount.toFixed(2)}</span>
                   </div>
                   <span>Net: ₹{netInvestment.toFixed(2)}</span>
                </div>
              )}
              
              {/* Quick Amounts */}
              <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                  {[100, 500, 2000, 5000].map(amt => (
                      <button 
                          key={amt}
                          onClick={() => setMetalAmount(amt.toString())}
                          className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-amber-400 transition-colors whitespace-nowrap"
                      >
                          +₹{amt}
                      </button>
                  ))}
              </div>
            </div>

            <button
                onClick={handleMetalInvest}
                disabled={!metalAmount || isProcessingMetal}
                className="w-full py-3 bg-slate-900 dark:bg-amber-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
            >
                {isProcessingMetal ? (
                    <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
                ) : (
                    <>
                       {buyMode === 'ONCE' ? <ShieldCheck size={18} /> : <Repeat size={18} />}
                       {buyMode === 'ONCE' ? `Buy ${metalType === 'GOLD' ? 'Gold' : 'Silver'}` : 'Start Autopay'}
                    </>
                )}
            </button>
        </div>

        {/* Net Worth Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-500" />
                Net Worth Trend
            </h2>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
                +17.6% YTD
            </div>
            </div>
            <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: chartAxisColor, fontSize: 12}} dy={10} />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: chartAxisColor, fontSize: 12}} 
                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} 
                />
                <CartesianGrid vertical={false} stroke={chartGridColor} strokeDasharray="3 3" />
                <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Worth']}
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorNetWorth)" 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cash Flow</h2>
            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-1 outline-none text-slate-700 dark:text-slate-300">
              <option>Last 6 Months</option>
              <option>Year to Date</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: chartAxisColor}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: chartAxisColor}} tickFormatter={(value) => `$${value}`} />
                <CartesianGrid vertical={false} stroke={chartGridColor} strokeDasharray="3 3" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
           {/* Budget Planner */}
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <Target size={20} className="text-indigo-500" /> Monthly Budgets
                 </h2>
                 <button 
                    onClick={() => setIsBudgetModalOpen(true)}
                    className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                 >
                    <Plus size={16} />
                 </button>
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                 {budgetAnalysis.map((b) => (
                    <div key={b.id}>
                       <div className="flex justify-between items-center mb-1 text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{b.category}</span>
                          <span className={`${b.isOver ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                              ${b.spent.toLocaleString()} / ${b.limit.toLocaleString()}
                          </span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                  b.percentage > 100 ? 'bg-rose-500' : 
                                  b.percentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${Math.min(b.percentage, 100)}%` }}
                           ></div>
                       </div>
                       {b.isOver && (
                           <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                               <AlertTriangle size={10} /> Over budget by ${(b.spent - b.limit).toLocaleString()}
                           </p>
                       )}
                    </div>
                 ))}
                 {budgetAnalysis.length === 0 && (
                     <p className="text-sm text-slate-400 text-center py-4">No budgets set. Click + to add.</p>
                 )}
              </div>
           </div>

           {/* Spending vs Budget Chart - Updated to use real data */}
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Spending vs Budget</h2>
              <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetAnalysis.length > 0 ? budgetAnalysis : cashFlowData.slice(-5)}>
                      <CartesianGrid vertical={false} stroke={chartGridColor} strokeDasharray="3 3" />
                      <XAxis dataKey={budgetAnalysis.length > 0 ? "category" : "name"} axisLine={false} tickLine={false} tick={{fill: chartAxisColor, fontSize: 10}} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}} 
                        contentStyle={tooltipStyle}
                        formatter={(value: any, name: any) => [`$${value}`, name === 'spent' ? 'Spent' : name === 'limit' ? 'Budget' : name]}
                      />
                      {budgetAnalysis.length > 0 ? (
                          <>
                             <Bar dataKey="spent" name="Spent" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                             <Bar dataKey="limit" name="Budget" fill={theme === 'dark' ? '#475569' : '#cbd5e1'} radius={[4, 4, 0, 0]} barSize={20} />
                          </>
                      ) : (
                          <>
                             <Bar dataKey="expense" name="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                             <Bar dataKey="income" name="Budget" fill={theme === 'dark' ? '#475569' : '#cbd5e1'} radius={[4, 4, 0, 0]} barSize={20} />
                          </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
              </div>
           </div>

           {/* Payment Methods */}
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Payment Mode</h2>
              <div className="flex items-center">
                 <div className="h-[140px] w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                              data={paymentData}
                              innerRadius={30}
                              outerRadius={50}
                              paddingAngle={5}
                              dataKey="value"
                              stroke={theme === 'dark' ? '#0f172a' : '#fff'}
                          >
                              {paymentData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle}/>
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="w-1/2 space-y-2">
                    {paymentData.map((item, index) => (
                       <div key={item.name} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                          <span className="text-slate-400 ml-auto">
                             {Math.round((item.value / totalExpense) * 100)}%
                          </span>
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

export default Dashboard;

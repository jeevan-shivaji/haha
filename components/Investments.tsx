
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Sparkles, TrendingUp, AlertTriangle, ArrowUp, Briefcase, Newspaper, ExternalLink, RefreshCw, Loader2, Plus, X, Save, Pencil, Trash2, LineChart as LineChartIcon, Search, CheckCircle2, XCircle, Globe, Repeat, CalendarClock, PauseCircle, PlayCircle } from 'lucide-react';
import { Investment, SIP } from '../types';
import { GeminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from './ThemeContext';

interface InvestmentsProps {
  portfolio: Investment[];
  setPortfolio: React.Dispatch<React.SetStateAction<Investment[]>>;
  sips: SIP[];
  setSips: React.Dispatch<React.SetStateAction<SIP[]>>;
}

type TimeRange = '1D' | '1W' | '1M' | '1Y' | 'ALL';

const CURRENCIES = {
  USD: { symbol: '$', rate: 1, label: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.92, label: 'Euro' },
  GBP: { symbol: '£', rate: 0.79, label: 'British Pound' },
  INR: { symbol: '₹', rate: 83.5, label: 'Indian Rupee' },
  JPY: { symbol: '¥', rate: 150.0, label: 'Japanese Yen' },
  CAD: { symbol: 'C$', rate: 1.35, label: 'Canadian Dollar' },
  AUD: { symbol: 'A$', rate: 1.52, label: 'Australian Dollar' },
};

type CurrencyCode = keyof typeof CURRENCIES;

const Investments: React.FC<InvestmentsProps> = ({ portfolio, setPortfolio, sips, setSips }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'SIP'>('PORTFOLIO');
  const { theme } = useTheme();

  useEffect(() => {
    if (searchParams.get('tab') === 'sip') {
        setActiveTab('SIP');
    }
  }, [searchParams]);

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  
  const [news, setNews] = useState<{ content: string; sources: any[] } | null>(null);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  // Currency State
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Investment, 'id'>>({
    symbol: '',
    name: '',
    shares: 0,
    avgCost: 0,
    currentPrice: 0,
    type: 'STOCK'
  });

  // SIP Form State
  const [isSipFormOpen, setIsSipFormOpen] = useState(false);
  const [sipFormData, setSipFormData] = useState<Omit<SIP, 'id' | 'active'>>({
      name: '',
      amount: 0,
      frequency: 'MONTHLY',
      nextDate: new Date().toISOString().split('T')[0],
      type: 'MUTUAL_FUND'
  });

  const sipFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSipFormOpen && sipFormRef.current) {
        sipFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSipFormOpen]);

  // Verification & Search State
  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'VERIFYING' | 'VALID' | 'INVALID'>('IDLE');
  const [symbolSuggestions, setSymbolSuggestions] = useState<{symbol: string, name: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSymbols, setIsSearchingSymbols] = useState(false);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Chart State
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  // Currency Calculations
  const rate = CURRENCIES[currency].rate;
  const symbol = CURRENCIES[currency].symbol;

  const totalValue = portfolio.reduce((sum, item) => sum + (item.shares * item.currentPrice), 0) * rate;
  const totalCost = portfolio.reduce((sum, item) => sum + (item.shares * item.avgCost), 0) * rate;
  const totalGain = totalValue - totalCost;
  const percentageGain = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const COLORS = ['#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
  
  const chartData = portfolio.map(p => ({
    name: p.symbol,
    value: p.shares * p.currentPrice * rate
  }));

  // Debounce search for symbol suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
        // Only search if user is typing (not if verified) and length is sufficient
        if (formData.symbol && formData.symbol.length >= 2 && verificationStatus !== 'VALID' && verificationStatus !== 'VERIFYING') {
            setIsSearchingSymbols(true);
            try {
               const results = await GeminiService.searchSymbols(formData.symbol);
               setSymbolSuggestions(results);
               setShowSuggestions(true);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearchingSymbols(false);
            }
        } else {
            setSymbolSuggestions([]);
            setShowSuggestions(false);
        }
    }, 600); // 600ms debounce to avoid rapid API calls

    return () => clearTimeout(timer);
  }, [formData.symbol, verificationStatus]);

  // Generate Mock Historical Data
  const historicalData = useMemo(() => {
    if (!selectedInvestment) return [];
    
    const dataPoints = [];
    const currentPrice = selectedInvestment.currentPrice * rate; // Convert price for chart
    let points = 30;
    let volatility = 0.02; // 2% daily volatility
    let startDate = new Date();

    switch (timeRange) {
        case '1D':
            points = 24;
            volatility = 0.005;
            startDate.setHours(startDate.getHours() - 24);
            break;
        case '1W':
            points = 7;
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '1M':
            points = 30;
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '1Y':
            points = 52; // Weekly points
            volatility = 0.05;
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        case 'ALL':
            points = 60; // Monthly points for 5 years
            volatility = 0.10;
            startDate.setFullYear(startDate.getFullYear() - 5);
            break;
    }

    const walk = [currentPrice];
    for (let i = 1; i < points; i++) {
        const change = (Math.random() - 0.5) * volatility * walk[0];
        walk.unshift(walk[0] - change);
    }

    for (let i = 0; i < points; i++) {
        const date = new Date(startDate);
        if (timeRange === '1D') date.setHours(startDate.getHours() + i);
        else if (timeRange === '1W' || timeRange === '1M') date.setDate(startDate.getDate() + i);
        else if (timeRange === '1Y') date.setDate(startDate.getDate() + (i * 7));
        else date.setMonth(startDate.getMonth() + i);

        dataPoints.push({
            date: timeRange === '1D' 
                ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                : date.toLocaleDateString([], { month: 'short', day: 'numeric', year: timeRange === 'ALL' ? '2-digit' : undefined }),
            price: walk[i]
        });
    }
    return dataPoints;
  }, [selectedInvestment, timeRange, rate]);

  const runAnalysis = async () => {
    setIsAnalysisLoading(true);
    try {
      const result = await GeminiService.analyzePortfolio(portfolio);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      setAnalysis("Failed to analyze portfolio. Please try again.");
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const fetchNews = async () => {
    setIsNewsLoading(true);
    try {
      const data = await GeminiService.fetchPortfolioNews(portfolio);
      setNews(data);
    } catch (e) {
      console.error(e);
      setNews({ content: "Unable to fetch news at this time.", sources: [] });
    } finally {
      setIsNewsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      symbol: '',
      name: '',
      shares: 0,
      avgCost: 0,
      currentPrice: 0,
      type: 'STOCK'
    });
    setVerificationStatus('IDLE');
    setSymbolSuggestions([]);
    setShowSuggestions(false);
    setIsFormOpen(false);
  };

  const handleEditClick = (inv: Investment) => {
    setEditingId(inv.id);
    setFormData({
      symbol: inv.symbol,
      name: inv.name,
      shares: inv.shares,
      avgCost: inv.avgCost,
      currentPrice: inv.currentPrice,
      type: inv.type
    });
    setVerificationStatus('VALID'); // Assume existing ones are valid or manually overridden
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
        setPortfolio(prev => prev.filter(p => p.id !== deleteId));
        if (editingId === deleteId) resetForm();
        setDeleteId(null);
    }
  };

  const handleVerifySymbol = async () => {
    if (!formData.symbol) return;
    setVerificationStatus('VERIFYING');
    setShowSuggestions(false); // Hide suggestions when actively verifying
    
    try {
        const result = await GeminiService.validateStock(formData.symbol);
        if (result.isValid) {
            setFormData(prev => ({
                ...prev,
                name: result.name || prev.name,
                currentPrice: result.price || prev.currentPrice
            }));
            setVerificationStatus('VALID');
        } else {
            setVerificationStatus('INVALID');
        }
    } catch (e) {
        console.error(e);
        setVerificationStatus('INVALID');
    }
  };

  const handleSuggestionSelect = (suggestion: {symbol: string, name: string}) => {
    setFormData(prev => ({
        ...prev,
        symbol: suggestion.symbol,
        name: suggestion.name
    }));
    setShowSuggestions(false);
    setVerificationStatus('VALID'); // Mark as semi-valid since it came from suggestion
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      setPortfolio(prev => prev.map(p => 
        p.id === editingId ? { ...p, ...formData } : p
      ));
    } else {
      const newInvestment: Investment = {
        id: Date.now().toString(),
        ...formData
      };
      setPortfolio(prev => [...prev, newInvestment]);
    }
    resetForm();
  };

  const handleSipSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newSip: SIP = {
          id: Date.now().toString(),
          active: true,
          startDate: sipFormData.nextDate,
          ...sipFormData
      };
      setSips(prev => [...prev, newSip]);
      setIsSipFormOpen(false);
      setSipFormData({
          name: '',
          amount: 0,
          frequency: 'MONTHLY',
          nextDate: new Date().toISOString().split('T')[0],
          type: 'MUTUAL_FUND'
      });
  };

  const toggleSipStatus = (id: string) => {
      setSips(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const deleteSip = (id: string) => {
      if(confirm('Stop and delete this SIP plan?')) {
          setSips(prev => prev.filter(s => s.id !== id));
      }
  };

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
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform transition-all scale-100 border border-slate-200 dark:border-slate-800">
                 <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <Trash2 size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Remove Investment?</h3>
                 <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Are you sure you want to remove this investment from your portfolio? This action cannot be undone.</p>
                 <div className="flex gap-3">
                    <button 
                        onClick={() => setDeleteId(null)}
                        className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30"
                    >
                        Yes, Remove
                    </button>
                 </div>
            </div>
        </div>
      )}

      {/* Chart Modal Overlay */}
      {selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedInvestment.symbol}</h2>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {selectedInvestment.type}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">{selectedInvestment.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{symbol}{(selectedInvestment.currentPrice * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        <p className={`text-sm font-medium ${selectedInvestment.currentPrice >= selectedInvestment.avgCost ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                           {selectedInvestment.currentPrice >= selectedInvestment.avgCost ? '+' : ''}
                           {((selectedInvestment.currentPrice - selectedInvestment.avgCost) / selectedInvestment.avgCost * 100).toFixed(2)}%
                        </p>
                    </div>
                </div>
                
                <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex justify-end gap-2 mb-4">
                        {(['1D', '1W', '1M', '1Y', 'ALL'] as TimeRange[]).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                                    timeRange === range 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: chartAxisColor}} 
                                    minTickGap={30}
                                />
                                <YAxis 
                                    domain={['auto', 'auto']} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: chartAxisColor}} 
                                    tickFormatter={(val) => `${symbol}${val.toLocaleString(undefined, { notation: "compact" })}`}
                                    width={60}
                                />
                                <Tooltip 
                                    contentStyle={tooltipStyle}
                                    formatter={(val: number) => [`${symbol}${val.toFixed(2)}`, 'Price']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="price" 
                                    stroke="#6366f1" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorPrice)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button 
                        onClick={() => setSelectedInvestment(null)}
                        className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Investments</h1>
          <p className="text-slate-500 dark:text-slate-400">Track your portfolio performance and SIPs.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
            {/* Currency Selector */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm">
                <Globe size={16} className="text-slate-400" />
                <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-transparent outline-none cursor-pointer pr-1"
                >
                    {Object.keys(CURRENCIES).map(c => (
                        <option key={c} value={c}>{c} - {CURRENCIES[c as CurrencyCode].label}</option>
                    ))}
                </select>
            </div>

            <button 
              onClick={runAnalysis}
              disabled={isAnalysisLoading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-70"
            >
              {isAnalysisLoading ? (
                 <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <Sparkles size={18} />
              )}
              {isAnalysisLoading ? 'Analyzing...' : 'AI Analysis'}
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="flex gap-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('PORTFOLIO')}
              className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'PORTFOLIO'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
               <Briefcase size={18} /> Portfolio Holdings
            </button>
            <button
              onClick={() => setActiveTab('SIP')}
              className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'SIP'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
               <Repeat size={18} /> Systematic Plans (SIP)
            </button>
          </nav>
      </div>

      {activeTab === 'PORTFOLIO' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Portfolio Summary Card */}
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Value</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{symbol}{totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Gain/Loss</p>
                        <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {totalGain >= 0 ? '+' : ''}{symbol}{Math.abs(totalGain).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Return</p>
                        <div className="flex items-center gap-1">
                            <p className={`text-2xl font-bold ${percentageGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {percentageGain.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* AI Analysis Result */}
                {analysis && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm ring-4 ring-indigo-50/50 dark:ring-indigo-900/20">
                    <div className="flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-400 font-bold text-lg">
                    <Sparkles size={24} />
                    AI Investment Insights
                    </div>
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                </div>
                )}

                {/* Holdings List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="font-bold text-slate-900 dark:text-white">Your Holdings</div>
                        {!isFormOpen && (
                        <button 
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800 transition-colors"
                        >
                            <Plus size={16} /> Add New
                        </button>
                        )}
                    </div>

                    {/* Add/Edit Form */}
                    {isFormOpen && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">{editingId ? 'Edit Investment' : 'Add Investment'}</h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={20} />
                        </button>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Symbol</label>
                            <div className="relative">
                                <div className="flex gap-2 relative">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            required
                                            value={formData.symbol}
                                            onChange={e => {
                                                setFormData({...formData, symbol: e.target.value.toUpperCase()});
                                                setVerificationStatus('IDLE');
                                            }}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)} // Delay to allow click
                                            placeholder="e.g. AAPL"
                                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-8 bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${verificationStatus === 'INVALID' ? 'border-rose-300 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                                            autoComplete="off"
                                        />
                                        {isSearchingSymbols && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="animate-spin text-slate-400" size={14} />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleVerifySymbol}
                                        disabled={!formData.symbol || verificationStatus === 'VERIFYING'}
                                        className={`px-3 rounded-lg border transition-colors flex items-center justify-center ${
                                            verificationStatus === 'VALID' ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' :
                                            verificationStatus === 'INVALID' ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400' :
                                            'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                        title="Verify Ticker with Market"
                                    >
                                        {verificationStatus === 'VERIFYING' ? <Loader2 className="animate-spin" size={16} /> : 
                                        verificationStatus === 'VALID' ? <CheckCircle2 size={16} /> :
                                        verificationStatus === 'INVALID' ? <XCircle size={16} /> :
                                        <Search size={16} />}
                                    </button>
                                </div>
                                
                                {/* Autocomplete Dropdown */}
                                {showSuggestions && symbolSuggestions.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg mt-1 shadow-lg max-h-48 overflow-auto">
                                        {symbolSuggestions.map((suggestion, idx) => (
                                            <li 
                                                key={idx}
                                                onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking suggestion
                                                onClick={() => handleSuggestionSelect(suggestion)}
                                                className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center"
                                            >
                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{suggestion.symbol}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{suggestion.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {verificationStatus === 'INVALID' && <p className="text-[10px] text-rose-500 mt-1">Symbol not found or invalid.</p>}
                            {verificationStatus === 'VALID' && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Symbol verified.</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Name</label>
                            <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Apple Inc."
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Type</label>
                            <select
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as any})}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                            <option value="STOCK">Stock</option>
                            <option value="ETF">ETF</option>
                            <option value="CRYPTO">Crypto</option>
                            <option value="REAL_ESTATE">Real Estate</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Shares</label>
                            <input
                            type="number"
                            required
                            step="any"
                            value={formData.shares}
                            onChange={e => setFormData({...formData, shares: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Avg Cost (USD)</label>
                            <input
                            type="number"
                            required
                            step="any"
                            value={formData.avgCost}
                            onChange={e => setFormData({...formData, avgCost: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Current Price (USD)</label>
                            <input
                            type="number"
                            required
                            step="any"
                            value={formData.currentPrice}
                            onChange={e => setFormData({...formData, currentPrice: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-2">
                            <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                            Cancel
                            </button>
                            <button
                            type="submit"
                            className="px-4 py-2 text-white bg-slate-900 dark:bg-emerald-600 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-emerald-700 flex items-center gap-2"
                            >
                            <Save size={16} /> {editingId ? 'Update Investment' : 'Save Investment'}
                            </button>
                        </div>
                        </form>
                    </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Asset</th>
                                    <th className="px-6 py-3">Price</th>
                                    <th className="px-6 py-3">Holdings</th>
                                    <th className="px-6 py-3 text-right">Value</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {portfolio.map((p) => (
                                    <tr key={p.id} className={`transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 group ${editingId === p.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform duration-300 ${p.type === 'CRYPTO' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                    {p.symbol[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{p.symbol}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900 dark:text-white">{symbol}{(p.currentPrice * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                            <p className={`text-xs ${p.currentPrice >= p.avgCost ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {p.avgCost > 0 ? ((p.currentPrice - p.avgCost) / p.avgCost * 100).toFixed(1) : '0.0'}%
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900 dark:text-white">{p.shares} Shares</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Avg {symbol}{(p.avgCost * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                            {symbol}{(p.shares * p.currentPrice * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                            onClick={() => { setSelectedInvestment(p); setTimeRange('1M'); }}
                                            className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                            title="View Chart"
                                            >
                                            <LineChartIcon size={16} />
                                            </button>
                                            <button 
                                            onClick={() => handleEditClick(p)}
                                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            title="Edit"
                                            >
                                            <Pencil size={16} />
                                            </button>
                                            <button 
                                            onClick={() => handleDeleteClick(p.id)}
                                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                            title="Delete"
                                            >
                                            <Trash2 size={16} />
                                            </button>
                                        </div>
                                        </td>
                                    </tr>
                                ))}
                                {portfolio.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                    No investments added yet.
                                    </td>
                                </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Sidebar / Allocation */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6">Allocation</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke={theme === 'dark' ? '#0f172a' : '#fff'}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-4">
                        {chartData.map((item, index) => (
                            <div key={item.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white">{totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0'}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex gap-3 mb-3">
                        <div className="bg-emerald-100 dark:bg-emerald-800/50 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Briefcase size={20} />
                        </div>
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Pro Tip</h3>
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                        Diversifying across asset classes like Real Estate or ETFs can reduce volatility risk. Ask the AI Advisor for specific ETF recommendations!
                    </p>
                </div>
            </div>

            {/* Market News Feed Section */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                    <Newspaper size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-lg">Market News Feed</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Real-time updates for your portfolio holdings</p>
                </div>
                </div>
                <button 
                onClick={fetchNews} 
                disabled={isNewsLoading}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                {isNewsLoading ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                {isNewsLoading ? 'Fetching...' : 'Refresh News'}
                </button>
            </div>

            {!news && !isNewsLoading && (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed">
                <Newspaper className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
                <p className="text-slate-500 dark:text-slate-400 mb-2">Get the latest updates on companies in your portfolio.</p>
                <button onClick={fetchNews} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                    Load Latest News
                </button>
                </div>
            )}

            {isNewsLoading && !news && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
                    <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                </div>
            )}

            {news && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
                    <div className="lg:col-span-3 prose prose-slate dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{news.content}</ReactMarkdown>
                    </div>
                    
                    <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-sm uppercase tracking-wide">Sources</h3>
                    {news.sources && news.sources.length > 0 ? (
                        <div className="space-y-3">
                            {news.sources.map((chunk: any, i: number) => chunk.web ? (
                            <a 
                                key={i} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-0.5 line-clamp-2 leading-tight">
                                    {chunk.web.title}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-blue-400">
                                    <ExternalLink size={10} />
                                    <span className="truncate">{new URL(chunk.web.uri).hostname}</span>
                                </div>
                            </a>
                            ) : null)}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No direct sources linked.</p>
                    )}
                    </div>
                </div>
            )}
            </div>
        </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
              {/* Active SIPs List */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Active SIPs</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Systematic Investment Plans</p>
                      </div>
                      <button 
                        onClick={() => setIsSipFormOpen(true)}
                        className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800 transition-colors"
                      >
                        <Plus size={16} /> New Plan
                      </button>
                  </div>
                  
                  {isSipFormOpen && (
                      <div ref={sipFormRef} className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30 animate-fadeIn">
                          <h4 className="font-bold text-emerald-800 dark:text-emerald-200 mb-4 text-sm uppercase">Create New SIP</h4>
                          <form onSubmit={handleSipSubmit} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase mb-1">Asset Name</label>
                                      <input 
                                          type="text" 
                                          required
                                          value={sipFormData.name}
                                          onChange={e => setSipFormData({...sipFormData, name: e.target.value})}
                                          placeholder="e.g. Nifty 50 Index"
                                          className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase mb-1">Amount ({symbol})</label>
                                      <input 
                                          type="number" 
                                          required
                                          value={sipFormData.amount}
                                          onChange={e => setSipFormData({...sipFormData, amount: parseFloat(e.target.value)})}
                                          className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                      />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase mb-1">Frequency</label>
                                      <select 
                                          value={sipFormData.frequency}
                                          onChange={e => setSipFormData({...sipFormData, frequency: e.target.value as any})}
                                          className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                      >
                                          <option value="WEEKLY">Weekly</option>
                                          <option value="MONTHLY">Monthly</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase mb-1">Start Date</label>
                                      <input 
                                          type="date" 
                                          required
                                          value={sipFormData.nextDate}
                                          onChange={e => setSipFormData({...sipFormData, nextDate: e.target.value})}
                                          className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                      />
                                  </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                  <button 
                                      type="button" 
                                      onClick={() => setIsSipFormOpen(false)}
                                      className="px-4 py-2 text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700 dark:hover:text-slate-200 font-medium"
                                  >
                                      Cancel
                                  </button>
                                  <button 
                                      type="submit" 
                                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm"
                                  >
                                      Start Plan
                                  </button>
                              </div>
                          </form>
                      </div>
                  )}

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sips.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                              <CalendarClock size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                              <p>No active SIPs found.</p>
                              <button onClick={() => setIsSipFormOpen(true)} className="text-emerald-600 dark:text-emerald-400 text-sm font-bold mt-2 hover:underline">Create your first SIP</button>
                          </div>
                      ) : (
                          sips.map(sip => (
                              <div key={sip.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 hover:pl-6 flex justify-between items-center group cursor-default">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${sip.active ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                          {sip.name[0]}
                                      </div>
                                      <div>
                                          <h4 className={`font-bold ${sip.active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500 line-through'}`}>{sip.name}</h4>
                                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                              <Repeat size={10} /> {sip.frequency} • Next: {sip.nextDate}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <p className="font-bold text-slate-900 dark:text-white">{symbol}{(sip.amount * rate).toFixed(2)}</p>
                                      <div className="flex items-center gap-1">
                                          <button 
                                              onClick={() => toggleSipStatus(sip.id)}
                                              className={`p-1.5 rounded-lg transition-colors ${sip.active ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                                              title={sip.active ? "Pause SIP" : "Resume SIP"}
                                          >
                                              {sip.active ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                                          </button>
                                          <button 
                                              onClick={() => deleteSip(sip.id)}
                                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                              title="Delete Plan"
                                          >
                                              <Trash2 size={18} />
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              {/* SIP Calculator / Promo */}
              <div className="space-y-6">
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                      <div className="relative z-10">
                          <h3 className="font-bold text-xl mb-2">Power of Compounding</h3>
                          <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                              Investing {symbol}500 monthly at 12% annual return can grow to over {symbol}50,000 in 5 years. Consistency is key!
                          </p>
                          <button className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors">
                              Calculate Returns
                          </button>
                      </div>
                      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-3xl"></div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-4">Upcoming Deductions</h3>
                      <div className="space-y-4">
                          {sips.filter(s => s.active).slice(0, 3).map(sip => (
                              <div key={sip.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                      <span className="text-slate-600 dark:text-slate-300">{sip.name}</span>
                                  </div>
                                  <span className="font-medium text-slate-900 dark:text-white">{symbol}{(sip.amount * rate).toFixed(2)}</span>
                              </div>
                          ))}
                          {sips.filter(s => s.active).length === 0 && (
                              <p className="text-xs text-slate-400 italic">No active plans scheduled.</p>
                          )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Monthly</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                              {symbol}
                              {(sips.filter(s => s.active && s.frequency === 'MONTHLY').reduce((acc, curr) => acc + curr.amount, 0) * rate).toFixed(2)}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Investments;

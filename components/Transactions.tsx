
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Trash2, Smartphone, CreditCard, Banknote, Landmark, Sparkles, QrCode, Send, Loader2, CheckCircle2, XCircle, Wallet, Repeat, CalendarClock, Pencil, X, Camera } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, RecurrenceFrequency } from '../types';
import { GeminiService } from '../services/geminiService';
import { UPIService } from '../services/upiService';

interface TransactionsProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const DEFAULT_CATEGORIES = [
  'Food', 
  'Utilities', 
  'Salary', 
  'Travel', 
  'Rent', 
  'Groceries', 
  'Entertainment', 
  'Health', 
  'Education', 
  'Shopping', 
  'Investment', 
  'Transfer', 
  'Freelance',
  'Software',
  'Meals',
  'Equipment'
];

const Transactions: React.FC<TransactionsProps> = ({ transactions, setTransactions }) => {
  // Tabs: 'RECORD' | 'PAY'
  const [activeTab, setActiveTab] = useState<'RECORD' | 'PAY'>('RECORD');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Common State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Record Mode State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('NONE');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Pay Mode State
  const [payVpa, setPayVpa] = useState('');
  const [payName, setPayName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payStatus, setPayStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [showQr, setShowQr] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Scanner cleanup ref
  const scannerRef = useRef<any>(null);

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
      const query = searchQuery.toLowerCase();
      return (
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.amount.toString().includes(query)
      );
  });

  useEffect(() => {
    if (isScanning) {
        // Need a slight delay to ensure the DOM element "reader" is rendered
        const timer = setTimeout(() => {
            if ((window as any).Html5QrcodeScanner) {
                const onScanSuccess = (decodedText: string, decodedResult: any) => {
                    console.log(`Scan result: ${decodedText}`, decodedResult);
                    
                    // Simple parsing for UPI
                    // Format: upi://pay?pa=...&pn=...&...
                    if (decodedText.startsWith('upi://') || decodedText.includes('pa=')) {
                         try {
                             // Extract parameters crudely to handle various UPI formats
                             const urlParams = new URLSearchParams(decodedText.split('?')[1]);
                             const pa = urlParams.get('pa');
                             const pn = urlParams.get('pn');
                             const am = urlParams.get('am');
                             const tn = urlParams.get('tn') || urlParams.get('note');

                             if (pa) {
                                 setPayVpa(pa);
                                 if (pn) setPayName(decodeURIComponent(pn));
                                 if (am) setAmount(am);
                                 if (tn) setDescription(decodeURIComponent(tn));
                                 
                                 // Stop scanning
                                 if (scannerRef.current) {
                                     scannerRef.current.clear().catch((e: any) => console.error(e));
                                 }
                                 setIsScanning(false);
                             }
                         } catch (e) {
                             console.error("Failed to parse UPI URL", e);
                         }
                    } else if (decodedText.includes('@')) {
                        // Fallback: assume it's just a VPA
                        setPayVpa(decodedText);
                        setIsScanning(false);
                        if (scannerRef.current) {
                            scannerRef.current.clear().catch((e: any) => console.error(e));
                        }
                    }
                };

                const onScanFailure = (error: any) => {
                    // console.warn(`Code scan error = ${error}`);
                };

                const scanner = new (window as any).Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    /* verbose= */ false);
                
                scanner.render(onScanSuccess, onScanFailure);
                scannerRef.current = scanner;
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error: any) => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }
  }, [isScanning]);

  // Handlers for Record Mode
  const handleSuggestCategory = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!description) return;
    
    setIsAiLoading(true);
    try {
      const suggested = await GeminiService.suggestCategory(description);
      setCategory(suggested);
    } catch (err) {
      console.error("AI Category failed", err);
    }
    setIsAiLoading(false);
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setActiveTab('RECORD');
    setDate(t.date);
    setDescription(t.description);
    setAmount(t.amount.toString());
    setType(t.type);
    setCategory(t.category);
    setPaymentMethod(t.paymentMethod);
    setUpiId(t.upiId || '');
    if (t.recurrence) {
        setRecurrenceFrequency(t.recurrence.frequency);
        setRecurrenceEndDate(t.recurrence.endDate || '');
    } else {
        setRecurrenceFrequency('NONE');
        setRecurrenceEndDate('');
    }
  };

  const handleCancelEdit = () => {
      resetForm();
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    // Auto-suggest category if empty upon submit
    let finalCategory = category;
    if (!finalCategory) {
        setIsAiLoading(true);
        try {
            finalCategory = await GeminiService.suggestCategory(description);
        } catch {
            finalCategory = 'Uncategorized';
        }
        setIsAiLoading(false);
    }

    const txData = {
      date,
      description,
      amount: parseFloat(amount),
      type,
      category: finalCategory,
      paymentMethod,
      upiId: paymentMethod === 'UPI' ? upiId : undefined,
      recurrence: recurrenceFrequency !== 'NONE' ? {
        frequency: recurrenceFrequency,
        endDate: recurrenceEndDate || undefined
      } : undefined
    };

    if (editingId) {
        setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, id: t.id, ...txData } : t));
    } else {
        const newTx: Transaction = {
          id: Date.now().toString(),
          ...txData
        };
        setTransactions(prev => [newTx, ...prev]);
    }

    resetForm();
  };

  // Handlers for Pay Mode
  const handleVerifyVPA = async () => {
      if (!payVpa) return;
      setIsVerifying(true);
      setPayName('');
      const result = await UPIService.validateVPA(payVpa);
      setIsVerifying(false);
      if (result.valid && result.name) {
          setPayName(result.name);
      } else {
          alert("Invalid VPA");
      }
  };

  const handlePay = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!payVpa || !amount) return;
      
      setIsPaying(true);
      setPayStatus('IDLE');
      
      const result = await UPIService.processPayment(parseFloat(amount), payVpa);
      
      setIsPaying(false);
      
      if (result.success) {
          setPayStatus('SUCCESS');
          // Automatically record the transaction
          const newTx: Transaction = {
              id: result.transactionId || Date.now().toString(),
              date: new Date().toISOString().split('T')[0],
              description: description || `Payment to ${payName || payVpa}`,
              amount: parseFloat(amount),
              type: TransactionType.EXPENSE,
              category: 'Transfer',
              paymentMethod: 'UPI',
              upiId: payVpa
          };
          setTransactions(prev => [newTx, ...prev]);
          
          // Reset after delay
          setTimeout(() => {
              setPayStatus('IDLE');
              resetForm();
          }, 3000);
      } else {
          setPayStatus('ERROR');
      }
  };

  const resetForm = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setCategory('');
    setUpiId('');
    setPayVpa('');
    setPayName('');
    setShowQr(false);
    setPayStatus('IDLE');
    setRecurrenceFrequency('NONE');
    setRecurrenceEndDate('');
    // Reset date to today for new entries, keep current date if desired or reset
    setDate(new Date().toISOString().split('T')[0]); 
    setType(TransactionType.EXPENSE);
    setPaymentMethod('UPI');
    setIsScanning(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
        setTransactions(prev => prev.filter(t => t.id !== deleteId));
        if (editingId === deleteId) {
            resetForm();
        }
        setDeleteId(null);
    }
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'UPI': return <Smartphone size={16} className="text-indigo-500" />;
      case 'CARD': return <CreditCard size={16} className="text-blue-500" />;
      case 'CASH': return <Banknote size={16} className="text-emerald-500" />;
      case 'BANK': return <Landmark size={16} className="text-slate-500" />;
      case 'MOBILE_WALLET': return <Wallet size={16} className="text-purple-500" />;
      default: return <Banknote size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform transition-all scale-100 border border-slate-200 dark:border-slate-800">
                 <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <Trash2 size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Transaction?</h3>
                 <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Are you sure you want to remove this transaction? This action cannot be undone.</p>
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
                        Yes, Delete
                    </button>
                 </div>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your income, expenses, and UPI payments.</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search by name, category, or amount..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)} 
               className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 placeholder-slate-400"
             />
           </div>
           <button className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
             <Filter size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Forms */}
        <div className="lg:col-span-1 h-fit sticky top-6 space-y-4">
            
            {/* Toggle Tabs */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                <button 
                    onClick={() => { setActiveTab('RECORD'); resetForm(); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'RECORD' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    {editingId ? 'Edit Mode' : 'Record Manual'}
                </button>
                <button 
                    onClick={() => { setActiveTab('PAY'); resetForm(); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'PAY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <Send size={14} /> Pay via UPI
                </button>
            </div>

            {activeTab === 'RECORD' ? (
                // RECORD FORM
                <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border ${editingId ? 'border-amber-200 dark:border-amber-900 ring-4 ring-amber-50/50 dark:ring-amber-900/20' : 'border-slate-100 dark:border-slate-800'} shadow-sm transition-all`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Transaction' : 'Record Transaction'}</h2>
                        {editingId && (
                            <button onClick={handleCancelEdit} className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1">
                                <X size={14} /> Cancel Edit
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleAddRecord} className="space-y-4">
                        
                        {/* Transaction Type */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <button
                            type="button"
                            onClick={() => setType(TransactionType.INCOME)}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                            <TrendingUp size={16} /> Income
                            </button>
                            <button
                            type="button"
                            onClick={() => setType(TransactionType.EXPENSE)}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                            <TrendingDown size={16} /> Expense
                            </button>
                        </div>

                        {/* Date */}
                        <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        </div>

                        {/* Payment Method */}
                        <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Payment Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['UPI', 'CARD', 'CASH', 'BANK', 'MOBILE_WALLET'] as PaymentMethod[]).map((method) => (
                                <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-all ${paymentMethod === method ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                {getPaymentIcon(method)}
                                <span className="text-[10px] font-bold">{method === 'MOBILE_WALLET' ? 'WALLET' : method}</span>
                                </button>
                            ))}
                        </div>
                        </div>

                        {/* UPI ID Conditional Field */}
                        {paymentMethod === 'UPI' && (
                        <div className="animate-fadeIn">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">UPI ID / VPA</label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="user@bankname"
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-slate-400"
                                />
                            </div>
                        </div>
                        )}

                        {/* Description */}
                        <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={type === TransactionType.INCOME ? "e.g. Salary, Freelance" : "e.g. Groceries, Netflix"}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm placeholder-slate-400"
                        />
                        </div>

                        {/* Category with AI */}
                        <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Category</label>
                        <div className="flex gap-2">
                            <input
                            type="text"
                            list="category-options"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Food, Travel"
                            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm placeholder-slate-400"
                            />
                            <datalist id="category-options">
                                {DEFAULT_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                            <button
                            onClick={handleSuggestCategory}
                            disabled={!description || isAiLoading}
                            className="px-3 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                            title="Auto-suggest Category"
                            type="button"
                            >
                            {isAiLoading ? <span className="animate-spin text-xs">↻</span> : <Sparkles size={16} />}
                            </button>
                        </div>
                        </div>

                        {/* Amount */}
                        <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold placeholder-slate-400"
                            />
                        </div>
                        </div>

                        {/* Recurring Toggle */}
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                                <Repeat size={12}/> Recurring
                              </label>
                              <button 
                                  type="button"
                                  onClick={() => setRecurrenceFrequency(prev => prev === 'NONE' ? 'MONTHLY' : 'NONE')}
                                  className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${recurrenceFrequency !== 'NONE' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                              >
                                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 ${recurrenceFrequency !== 'NONE' ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                          </div>
                          
                          {recurrenceFrequency !== 'NONE' && (
                              <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">Frequency</label>
                                    <select 
                                        value={recurrenceFrequency}
                                        onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency)}
                                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="DAILY">Daily</option>
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">End Date (Optional)</label>
                                    <input 
                                        type="date"
                                        value={recurrenceEndDate}
                                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                  </div>
                              </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 py-3 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                className={`flex items-center justify-center gap-2 text-white py-3 rounded-xl font-medium transition-colors shadow-lg ${editingId ? 'flex-[2] bg-amber-600 hover:bg-amber-700 shadow-amber-900/10' : 'w-full bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-slate-900/10'}`}
                            >
                                {editingId ? <CheckCircle2 size={18} /> : <Plus size={18} />} 
                                {editingId ? 'Update Transaction' : 'Add Transaction'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                // PAY MODE FORM
                <div className="bg-indigo-600 p-6 rounded-2xl border border-indigo-500 shadow-xl text-white relative overflow-hidden">
                    {/* ... (UPI Pay UI remains mostly same as it has its own colored background) ... */}
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <QrCode size={100} />
                    </div>
                    
                    {payStatus === 'SUCCESS' ? (
                         <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fadeIn">
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-lg">
                                 <CheckCircle2 size={32} />
                             </div>
                             <div className="text-center">
                                 <h3 className="text-xl font-bold">Payment Successful!</h3>
                                 <p className="text-indigo-200 text-sm">Transaction recorded.</p>
                             </div>
                         </div>
                    ) : payStatus === 'ERROR' ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fadeIn">
                            <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                <XCircle size={32} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold">Payment Failed</h3>
                                <p className="text-indigo-200 text-sm">Please try again.</p>
                                <button 
                                    onClick={() => setPayStatus('IDLE')} 
                                    className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Smartphone className="text-indigo-300" /> Send Money
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsScanning(!isScanning)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${isScanning ? 'bg-white text-rose-600 hover:bg-slate-100' : 'bg-indigo-500 hover:bg-indigo-400 text-white'}`}
                            >
                                {isScanning ? <X size={14} /> : <Camera size={14} />}
                                {isScanning ? 'Close Scanner' : 'Scan QR'}
                            </button>
                        </div>
                        
                        {isScanning ? (
                            <div className="relative z-10 animate-fadeIn bg-white rounded-xl overflow-hidden p-2">
                                <div id="reader" className="w-full"></div>
                                <p className="text-center text-slate-500 text-xs mt-2 font-medium pb-2">Align UPI QR code within frame</p>
                            </div>
                        ) : (
                            <form onSubmit={handlePay} className="space-y-4 relative z-10">
                                {/* VPA Input */}
                                <div>
                                    <label className="block text-xs font-semibold text-indigo-200 uppercase mb-1">Receiver VPA</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">@</span>
                                            <input
                                                type="text"
                                                value={payVpa}
                                                onChange={(e) => setPayVpa(e.target.value)}
                                                placeholder="upi-id@bank"
                                                className="w-full pl-8 pr-3 py-2 bg-indigo-700/50 border border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-sm text-white placeholder-indigo-300/50"
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={handleVerifyVPA}
                                            disabled={!payVpa || isVerifying}
                                            className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-xs font-bold disabled:opacity-50"
                                        >
                                            {isVerifying ? <Loader2 className="animate-spin" size={14} /> : 'VERIFY'}
                                        </button>
                                    </div>
                                    {payName && <p className="text-xs text-emerald-300 mt-1 font-medium flex items-center gap-1"><CheckCircle2 size={10}/> {payName}</p>}
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-xs font-semibold text-indigo-200 uppercase mb-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 font-bold">$</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-3 py-3 bg-indigo-700/50 border border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-xl font-bold text-white placeholder-indigo-300/50"
                                        />
                                    </div>
                                </div>

                                {/* Note */}
                                <div>
                                    <label className="block text-xs font-semibold text-indigo-200 uppercase mb-1">Note (Optional)</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="What's this for?"
                                        className="w-full px-3 py-2 bg-indigo-700/50 border border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-sm text-white placeholder-indigo-300/50"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="pt-2 space-y-3">
                                    <button
                                        type="submit"
                                        disabled={isPaying || !payVpa || !amount}
                                        className="w-full flex items-center justify-center gap-2 bg-white text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors disabled:opacity-70 shadow-lg"
                                    >
                                        {isPaying ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                        {isPaying ? 'Processing...' : 'Pay Now'}
                                    </button>
                                    
                                    <button 
                                        type="button"
                                        onClick={() => setShowQr(!showQr)}
                                        className="w-full py-2 text-xs font-medium text-indigo-200 hover:text-white flex items-center justify-center gap-2"
                                    >
                                        <QrCode size={14} /> {showQr ? 'Hide QR Code' : 'Show Payment QR'}
                                    </button>
                                </div>

                                {/* QR Display */}
                                {showQr && payVpa && amount && (
                                    <div className="mt-4 p-4 bg-white rounded-xl flex flex-col items-center animate-fadeIn text-slate-900">
                                        <img 
                                            src={UPIService.generateQRUrl(payVpa, payName || 'User', parseFloat(amount), description)} 
                                            alt="Payment QR"
                                            className="w-32 h-32 mb-2"
                                        />
                                        <p className="text-xs text-slate-500">Scan to pay with any UPI app</p>
                                    </div>
                                )}
                            </form>
                        )}
                        </>
                    )}
                </div>
            )}
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
             <h3 className="font-bold text-slate-700 dark:text-slate-300">Recent History</h3>
             <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">{filteredTransactions.length} Records</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3 bg-slate-50/30 dark:bg-slate-800/30">Date</th>
                  <th className="px-6 py-3 bg-slate-50/30 dark:bg-slate-800/30">Payment</th>
                  <th className="px-6 py-3 bg-slate-50/30 dark:bg-slate-800/30">Description</th>
                  <th className="px-6 py-3 bg-slate-50/30 dark:bg-slate-800/30">Category</th>
                  <th className="px-6 py-3 bg-slate-50/30 dark:bg-slate-800/30 text-right">Amount</th>
                  <th className="px-6 py-3 bg-slate-50/30 dark:bg-slate-800/30 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className={`transition-colors group ${editingId === t.id ? 'bg-amber-50 dark:bg-amber-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${t.paymentMethod === 'UPI' ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                             {getPaymentIcon(t.paymentMethod)}
                          </div>
                          {t.paymentMethod === 'UPI' && t.upiId && (
                             <div className="flex flex-col">
                               <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">UPI</span>
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 max-w-[80px] truncate" title={t.upiId}>{t.upiId}</span>
                             </div>
                          )}
                          {t.paymentMethod !== 'UPI' && <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{t.paymentMethod === 'MOBILE_WALLET' ? 'WALLET' : t.paymentMethod}</span>}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">
                        {t.description}
                        {t.recurrence && (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-medium mt-1">
                                <Repeat size={10} />
                                <span>{t.recurrence.frequency}</span>
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => handleEdit(t)}
                            className="text-slate-400 hover:text-amber-500 transition-colors p-1"
                            title="Edit"
                        >
                            <Pencil size={16} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(t.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;

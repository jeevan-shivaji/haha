
import React, { useState } from 'react';
import { Landmark, FileSearch, CheckCircle2, AlertCircle, ScanLine } from 'lucide-react';
import { Transaction, TaxDeductionInsight } from '../types';
import { GeminiService } from '../services/geminiService';

interface TaxHubProps {
  transactions: Transaction[];
}

const TaxHub: React.FC<TaxHubProps> = ({ transactions }) => {
  const [insights, setInsights] = useState<TaxDeductionInsight[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Mock Tax Estimation logic
  const taxableIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const estimatedTax = taxableIncome * 0.24; // Simple 24% bracket assumption

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const results = await GeminiService.identifyTaxDeductions(transactions);
      setInsights(results);
    } catch (error) {
      console.error("Scanning failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tax Hub</h1>
          <p className="text-slate-500 dark:text-slate-400">Maximize your savings with AI-powered deduction finding.</p>
        </div>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-70"
        >
          {isScanning ? (
            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
          ) : (
            <ScanLine size={18} />
          )}
          {isScanning ? 'Scanning Expenses...' : 'Scan for Deductions'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase mb-4">Estimated Tax (YTD)</h3>
            <div className="flex items-baseline gap-2 mb-2">
               <span className="text-3xl font-bold text-slate-900 dark:text-white">${estimatedTax.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2">
               <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-slate-400">Based on 24% tax bracket assumption. Consult a professional.</p>
          </div>

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden border border-slate-800">
             <div className="relative z-10">
                <Landmark className="mb-3 text-emerald-400" size={32} />
                <h3 className="font-bold text-lg mb-2">Why Scan?</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                   Gemini analyzes your expense descriptions against common IRS categories to flag potential write-offs you might have missed.
                </p>
             </div>
             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500 rounded-full opacity-20 blur-2xl"></div>
          </div>
        </div>

        <div className="lg:col-span-2">
           {!isScanning && insights.length === 0 ? (
             <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                   <FileSearch size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ready to Analyze</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                  Click "Scan for Deductions" to let AI review your recent expenses for tax saving opportunities.
                </p>
             </div>
           ) : (
             <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                   <h3 className="font-bold text-slate-900 dark:text-white">Potential Deductions Found</h3>
                   <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-1 rounded-full font-medium">
                     {insights.length} Items
                   </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                   {insights.map((item, idx) => {
                     const tx = transactions.find(t => t.id === item.transactionId);
                     if (!tx) return null;
                     
                     return (
                       <div key={idx} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                             <div>
                               <p className="font-bold text-slate-900 dark:text-white text-sm">{tx.description}</p>
                               <p className="text-xs text-slate-400">{tx.date} • ${tx.amount}</p>
                             </div>
                             {item.confidence === 'HIGH' ? (
                               <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                                 <CheckCircle2 size={12} /> High Confidence
                               </span>
                             ) : (
                               <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md">
                                 <AlertCircle size={12} /> Check Rules
                               </span>
                             )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                             <span className="font-semibold text-slate-700 dark:text-slate-200">AI Insight:</span> {item.reason}
                          </p>
                       </div>
                     );
                   })}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default TaxHub;

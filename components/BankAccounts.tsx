
import React, { useState } from 'react';
import { Plus, RefreshCw, CreditCard, Landmark, DollarSign, ShieldCheck, ExternalLink, Trash2, Wallet } from 'lucide-react';
import { BankAccount, Transaction } from '../types';
import { BankService } from '../services/bankService';

interface BankAccountsProps {
  accounts: BankAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const BankAccounts: React.FC<BankAccountsProps> = ({ accounts, setAccounts, setTransactions }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Link Modal State
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedType, setSelectedType] = useState<BankAccount['type']>('CHECKING');
  const [isProcessingLink, setIsProcessingLink] = useState(false);

  const supportedBanks = BankService.getSupportedBanks();

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) return;

    setIsProcessingLink(true);
    try {
      const newAccount = await BankService.linkAccount(selectedBank, selectedType);
      setAccounts(prev => [...prev, newAccount]);
      setIsLinking(false);
      setSelectedBank('');
      setSelectedType('CHECKING');
    } catch (error) {
      console.error("Link failed", error);
    } finally {
      setIsProcessingLink(false);
    }
  };

  const handleSync = async (account: BankAccount) => {
    setSyncingId(account.id);
    try {
      const { updatedBalance, newTransactions } = await BankService.syncAccount(account);
      
      // Update Account Balance
      setAccounts(prev => prev.map(a => 
        a.id === account.id ? { ...a, balance: updatedBalance, lastSynced: new Date().toISOString() } : a
      ));

      // Add New Transactions if any
      if (newTransactions.length > 0) {
        setTransactions(prev => [...newTransactions, ...prev]);
        alert(`Synced! ${newTransactions.length} new transactions found.`);
      }
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setSyncingId(null);
    }
  };

  const handleUnlink = (id: string) => {
      if(confirm("Are you sure you want to disconnect this bank account?")) {
          setAccounts(prev => prev.filter(a => a.id !== id));
      }
  };

  const totalAssets = accounts
    .filter(a => a.type === 'CHECKING' || a.type === 'SAVINGS' || a.type === 'INVESTMENT')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter(a => a.type === 'CREDIT_CARD')
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bank Integration</h1>
          <p className="text-slate-500 dark:text-slate-400">Connect your accounts for real-time tracking.</p>
        </div>
        <button 
          onClick={() => setIsLinking(true)}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} /> Link Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-lg shadow-emerald-500/20">
              <p className="text-emerald-100 text-sm font-medium mb-1">Total Liquid Assets</p>
              <h3 className="text-3xl font-bold">${totalAssets.toLocaleString()}</h3>
          </div>
          <div className="bg-rose-500 text-white p-6 rounded-2xl shadow-lg shadow-rose-500/20">
              <p className="text-rose-100 text-sm font-medium mb-1">Total Credit Debt</p>
              <h3 className="text-3xl font-bold">${totalLiabilities.toLocaleString()}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Net Cash Position</p>
                  <h3 className={`text-3xl font-bold ${(totalAssets - totalLiabilities) >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                      ${(totalAssets - totalLiabilities).toLocaleString()}
                  </h3>
              </div>
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                  <Wallet size={24} />
              </div>
          </div>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accounts.map(account => (
          <div key={account.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold ${account.color}`}>
                      {account.bankName[0]}
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{account.bankName}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                         {account.type === 'CREDIT_CARD' ? 'Credit Card' : account.type === 'CHECKING' ? 'Checking' : 'Savings'} 
                         <span>•••• {account.accountNumber}</span>
                      </p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-sm text-slate-400 mb-1">Current Balance</p>
                   <p className={`text-2xl font-bold ${account.type === 'CREDIT_CARD' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                       {account.type === 'CREDIT_CARD' ? '-' : ''}${account.balance.toLocaleString()}
                   </p>
                </div>
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                   <ShieldCheck size={14} className="text-emerald-500" />
                   <span>Synced {new Date(account.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex gap-2">
                   <button 
                      onClick={() => handleUnlink(account.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Unlink Account"
                   >
                      <Trash2 size={16} />
                   </button>
                   <button 
                      onClick={() => handleSync(account)}
                      disabled={syncingId === account.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                   >
                      <RefreshCw size={14} className={syncingId === account.id ? 'animate-spin' : ''} />
                      {syncingId === account.id ? 'Syncing...' : 'Sync Balance'}
                   </button>
                </div>
             </div>
          </div>
        ))}
        
        {accounts.length === 0 && (
            <div className="lg:col-span-2 py-12 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Landmark className="text-slate-300 dark:text-slate-600 mb-4" size={48} />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Accounts Linked</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Link your bank accounts to automatically sync balances and transactions.</p>
                <button 
                    onClick={() => setIsLinking(true)}
                    className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                    Link First Account
                </button>
            </div>
        )}
      </div>

      {/* Link Account Modal */}
      {isLinking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Connect Bank</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">Securely link your financial institution.</p>
              </div>
              
              <form onSubmit={handleLinkAccount} className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Select Institution</label>
                    <div className="grid grid-cols-2 gap-3">
                        {supportedBanks.map(bank => (
                            <button
                                key={bank.name}
                                type="button"
                                onClick={() => setSelectedBank(bank.name)}
                                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${selectedBank === bank.name ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                            >
                                <div className={`w-6 h-6 rounded-full ${bank.color} flex items-center justify-center text-white text-[10px]`}>
                                    {bank.name[0]}
                                </div>
                                {bank.name}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Account Type</label>
                    <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as BankAccount['type'])}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                        <option value="CHECKING">Checking Account</option>
                        <option value="SAVINGS">Savings Account</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="INVESTMENT">Investment Account</option>
                    </select>
                 </div>

                 <div className="pt-2 flex gap-3">
                    <button 
                        type="button"
                        onClick={() => setIsLinking(false)}
                        className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={!selectedBank || isProcessingLink}
                        className="flex-1 py-3 bg-slate-900 dark:bg-emerald-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isProcessingLink ? <RefreshCw className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                        {isProcessingLink ? 'Connecting...' : 'Connect'}
                    </button>
                 </div>
              </form>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1">
                 <ShieldCheck size={12} /> Bank-level encryption & security
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BankAccounts;

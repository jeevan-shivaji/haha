
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BankAccounts from './components/BankAccounts';
import Transactions from './components/Transactions';
import Investments from './components/Investments';
import TaxHub from './components/TaxHub';
import Advisor from './components/Advisor';
import Profile from './components/Profile';
import { ThemeProvider } from './components/ThemeContext';
import { Transaction, TransactionType, Investment, BankAccount, SIP, Budget } from './types';

const App: React.FC = () => {
  // Mock Data Initialization
  const [transactions, setTransactions] = useState<Transaction[]>([
    { 
      id: '1', 
      date: '2023-10-24', 
      description: 'Web Design Project', 
      amount: 3500, 
      type: TransactionType.INCOME, 
      category: 'Freelance',
      paymentMethod: 'BANK' 
    },
    { 
      id: '2', 
      date: '2023-10-25', 
      description: 'Adobe Creative Cloud', 
      amount: 54.99, 
      type: TransactionType.EXPENSE, 
      category: 'Software',
      paymentMethod: 'CARD',
      recurrence: {
        frequency: 'MONTHLY',
        endDate: '2025-10-25'
      }
    },
    { 
      id: '3', 
      date: '2023-10-26', 
      description: 'Client Dinner', 
      amount: 124.50, 
      type: TransactionType.EXPENSE, 
      category: 'Meals',
      paymentMethod: 'UPI',
      upiId: 'restaurant@okhdfc'
    },
    { 
      id: '4', 
      date: '2023-10-28', 
      description: 'New Office Monitor', 
      amount: 349.00, 
      type: TransactionType.EXPENSE, 
      category: 'Equipment',
      paymentMethod: 'CARD' 
    },
    { 
      id: '5', 
      date: '2023-10-30', 
      description: 'Monthly Retainer', 
      amount: 2000, 
      type: TransactionType.INCOME, 
      category: 'Freelance',
      paymentMethod: 'BANK' 
    },
    { 
      id: '6', 
      date: '2023-11-01', 
      description: 'Office Rent', 
      amount: 800, 
      type: TransactionType.EXPENSE, 
      category: 'Rent',
      paymentMethod: 'UPI',
      upiId: 'landlord@upi',
      recurrence: {
        frequency: 'MONTHLY',
        endDate: '2024-11-01'
      }
    },
    { 
      id: '7', 
      date: '2023-11-02', 
      description: 'Coffee Run', 
      amount: 12.50, 
      type: TransactionType.EXPENSE, 
      category: 'Food',
      paymentMethod: 'CASH' 
    },
  ]);

  const [portfolio, setPortfolio] = useState<Investment[]>([
    { id: '1', symbol: 'AAPL', name: 'Apple Inc.', shares: 15, avgCost: 145.00, currentPrice: 173.50, type: 'STOCK' },
    { id: '2', symbol: 'MSFT', name: 'Microsoft Corp.', shares: 10, avgCost: 280.00, currentPrice: 330.20, type: 'STOCK' },
    { id: '3', symbol: 'VOO', name: 'Vanguard S&P 500 ETF', shares: 25, avgCost: 380.00, currentPrice: 405.10, type: 'ETF' },
    { id: '4', symbol: 'TSLA', name: 'Tesla Inc.', shares: 8, avgCost: 250.00, currentPrice: 215.30, type: 'STOCK' },
  ]);

  const [sips, setSips] = useState<SIP[]>([
    { id: '1', name: 'Vanguard S&P 500', amount: 500, frequency: 'MONTHLY', nextDate: '2023-11-15', active: true, type: 'ETF' },
    { id: '2', name: 'Bitcoin DCA', amount: 50, frequency: 'WEEKLY', nextDate: '2023-11-03', active: true, type: 'CRYPTO' }
  ]);

  const [budgets, setBudgets] = useState<Budget[]>([
    { id: '1', category: 'Food', limit: 500, period: 'MONTHLY' },
    { id: '2', category: 'Rent', limit: 800, period: 'MONTHLY' },
    { id: '3', category: 'Software', limit: 100, period: 'MONTHLY' },
    { id: '4', category: 'Meals', limit: 200, period: 'MONTHLY' },
  ]);

  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  transactions={transactions} 
                  accounts={accounts} 
                  portfolio={portfolio} 
                  setPortfolio={setPortfolio}
                  sips={sips}
                  setSips={setSips} 
                  budgets={budgets}
                  setBudgets={setBudgets}
                />
              } 
            />
            <Route 
              path="/accounts" 
              element={<BankAccounts accounts={accounts} setAccounts={setAccounts} setTransactions={setTransactions} />} 
            />
            <Route 
              path="/transactions" 
              element={<Transactions transactions={transactions} setTransactions={setTransactions} />} 
            />
            <Route 
              path="/investments" 
              element={<Investments portfolio={portfolio} setPortfolio={setPortfolio} sips={sips} setSips={setSips} />} 
            />
            <Route 
              path="/tax-hub" 
              element={<TaxHub transactions={transactions} />} 
            />
            <Route path="/advisor" element={<Advisor transactions={transactions} portfolio={portfolio} accounts={accounts} />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App;

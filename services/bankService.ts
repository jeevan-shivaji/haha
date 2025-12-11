
import { BankAccount, Transaction, TransactionType } from "../types";

const MOCK_BANKS = [
  { name: 'Chase', color: 'bg-blue-600' },
  { name: 'Bank of America', color: 'bg-red-600' },
  { name: 'Wells Fargo', color: 'bg-yellow-600' },
  { name: 'Citi', color: 'bg-cyan-600' },
  { name: 'American Express', color: 'bg-sky-600' },
  { name: 'Capital One', color: 'bg-indigo-600' }
];

export const BankService = {
  getSupportedBanks: () => MOCK_BANKS,

  linkAccount: async (bankName: string, type: BankAccount['type']): Promise<BankAccount> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const bank = MOCK_BANKS.find(b => b.name === bankName) || MOCK_BANKS[0];
    
    // Generate random initial balance
    let balance = 0;
    if (type === 'CREDIT_CARD') {
      balance = Math.floor(Math.random() * 2000) + 500; // Debt
    } else {
      balance = Math.floor(Math.random() * 15000) + 1000; // Asset
    }

    return {
      id: Date.now().toString(),
      bankName: bankName,
      accountNumber: Math.floor(1000 + Math.random() * 9000).toString(),
      type: type,
      balance: balance,
      lastSynced: new Date().toISOString(),
      color: bank.color
    };
  },

  syncAccount: async (account: BankAccount): Promise<{ updatedBalance: number; newTransactions: Transaction[] }> => {
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate a small change in balance and potential new transactions
    const change = (Math.random() - 0.5) * 200; // +/- $100 change
    let newBalance = account.balance;
    const newTransactions: Transaction[] = [];

    // If change is negative (expense) or positive (income/payment)
    // For Credit Cards: Increase in balance = Expense (more debt), Decrease = Payment
    // For Checking: Increase = Income, Decrease = Expense
    
    if (Math.abs(change) > 10) {
       const isCredit = account.type === 'CREDIT_CARD';
       const amount = Math.abs(change);
       
       let type: TransactionType;
       let description = "";
       let category = "";

       if (isCredit) {
          // If credit balance goes UP, we spent money (Expense)
          // If credit balance goes DOWN, we paid it off (Transfer/Expense depending on view, but usually ignore internal transfers for now)
          if (change > 0) {
             type = TransactionType.EXPENSE;
             description = `${account.bankName} Card Purchase`;
             category = 'Shopping';
             newBalance += amount;
          } else {
             // Paid off card
             newBalance -= amount;
             // Don't generate transaction for payment to self to avoid dupe if tracking checking side
          }
       } else {
          // Checking/Savings
          if (change > 0) {
             type = TransactionType.INCOME;
             description = `${account.bankName} Interest/Deposit`;
             category = 'Income';
             newBalance += amount;
          } else {
             type = TransactionType.EXPENSE;
             description = `${account.bankName} Debit`;
             category = 'Misc';
             newBalance -= amount;
          }
       }

       if (description) {
         newTransactions.push({
           id: `sync-${Date.now()}`,
           date: new Date().toISOString().split('T')[0],
           description,
           amount: parseFloat(amount.toFixed(2)),
           type,
           category,
           paymentMethod: isCredit ? 'CARD' : 'BANK'
         });
       }
    }

    return {
      updatedBalance: parseFloat(newBalance.toFixed(2)),
      newTransactions
    };
  }
};


import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCcw, FileBarChart, PieChart } from 'lucide-react';
import { ChatMessage, Transaction, Investment, BankAccount, TransactionType } from '../types';
import { GeminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AdvisorProps {
  transactions: Transaction[];
  portfolio: Investment[];
  accounts: BankAccount[];
}

const Advisor: React.FC<AdvisorProps> = ({ transactions, portfolio, accounts }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! I'm your WealthMind AI financial advisor. How can I help you manage your money, plan investments, or save on taxes today?",
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent, overridePrompt?: string, displayMessage?: string) => {
    if (e) e.preventDefault();
    const promptText = overridePrompt || input;
    const displayText = displayMessage || input;

    if (!promptText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: displayText,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      let fullResponse = "";
      const tempId = (Date.now() + 1).toString();
      
      // Add placeholder for streaming
      setMessages(prev => [...prev, { id: tempId, role: 'model', text: '', isTyping: true }]);

      const stream = GeminiService.chatStream(history, promptText);

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, text: fullResponse, isTyping: false } : m
        ));
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting to the financial servers right now. Please try again later."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateReport = () => {
    // 1. Calculate Income
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    // 2. Calculate Expenses
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    // 3. Calculate Portfolio Value
    const portfolioValue = portfolio.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);

    // 4. Calculate Liquid Cash (Checking + Savings)
    const cashBalance = accounts
        .filter(a => a.type === 'CHECKING' || a.type === 'SAVINGS')
        .reduce((sum, a) => sum + a.balance, 0);
    
    // 5. Categorize Expenses for better context
    const expensesByCategory = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc: Record<string, number>, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);
    
    const topCategories = Object.entries(expensesByCategory)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(([cat, amount]) => `${cat}: $${amount}`)
        .join(', ');

    const prompt = `
      Please generate a comprehensive "Spend & Invest" report based on my current financial snapshot:
      
      **Financial Snapshot:**
      - Total Recorded Income: $${totalIncome}
      - Total Recorded Expenses: $${totalExpense}
      - Current Portfolio Value: $${portfolioValue}
      - Available Liquid Cash: $${cashBalance}
      - Top Expense Categories: ${topCategories || 'None recorded'}
      
      **Request:**
      1. Analyze my current savings rate (Income vs Expenses).
      2. Recommend a specific monthly budget allocation (e.g., 50/30/20 rule) using my actual income numbers.
      3. Suggest how much I should be investing monthly versus keeping in cash.
      4. Provide 3 specific investment strategies or asset allocation tweaks based on my current portfolio size.
      
      Format the response using Markdown with clear headings and bold text for numbers.
    `;

    handleSend(null as any, prompt, "Generate my personalized Spend & Invest Report based on my current income and assets.");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center bg-slate-50 dark:bg-slate-800/50 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">AI Financial Advisor</h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
            <button
                onClick={generateReport}
                disabled={isTyping}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
                <FileBarChart size={14} />
                Generate Report
            </button>
            <button 
                onClick={() => setMessages([messages[0]])}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" 
                title="Reset Chat"
            >
              <RefreshCcw size={18} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50" ref={scrollRef}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[85%] lg:max-w-[70%] rounded-2xl p-4 shadow-sm
              ${msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-none'
              }
            `}>
              {msg.role === 'model' && msg.isTyping && !msg.text ? (
                <div className="flex gap-1 h-6 items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 dark:prose-invert">
                  <ReactMarkdown 
                    components={{
                        p: ({node, ...props}) => <p className={`mb-2 last:mb-0 ${msg.role === 'user' ? 'text-white' : ''}`} {...props} />,
                        strong: ({node, ...props}) => <strong className={`${msg.role === 'user' ? 'text-white' : 'text-slate-900 dark:text-white'}`} {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-bold uppercase tracking-wide mb-2 mt-4 text-slate-900 dark:text-white" {...props} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={(e) => handleSend(e)} className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for advice, budget tips, or investment concepts..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
            disabled={isTyping}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Advisor;

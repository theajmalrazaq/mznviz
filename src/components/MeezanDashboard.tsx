import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  format, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isSameMonth,
  isToday,
  isYesterday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  ShoppingBag,
  CreditCard,
  Wallet,
  Zap,
  Coffee,
  Calendar as CalendarIcon,
  Trash2,
  Upload,
  Sun,
  Moon,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'income' | 'expense';
  amount: number;
}

const MeezanDashboard = () => {
  // Persistence Loading
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('meezan_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((t: any) => ({ ...t, date: new Date(t.date) }));
      } catch (e) { return []; }
    }
    return [];
  });
  const [openingBalance, setOpeningBalance] = useState(() => {
    return parseFloat(localStorage.getItem('meezan_opening') || '0');
  });
  const [closingBalance, setClosingBalance] = useState(() => {
    return parseFloat(localStorage.getItem('meezan_closing') || '0');
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentFilter, setCurrentFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('meezan_theme');
    return (saved === 'dark' ? 'dark' : 'light');
  });

  // Persistence Logic
  React.useEffect(() => {
    localStorage.setItem('meezan_transactions', JSON.stringify(transactions));
    localStorage.setItem('meezan_opening', openingBalance.toString());
    localStorage.setItem('meezan_closing', closingBalance.toString());
    localStorage.setItem('meezan_theme', theme);
    document.documentElement.className = theme;
  }, [transactions, openingBalance, closingBalance, theme]);

  // Handle system file launch (PWA File Handling)
  useEffect(() => {
    // Robust feature detection for File Handling API
    const isFileHandlingSupported = 
      'launchQueue' in window && 
      typeof (window as any).LaunchParams !== 'undefined' && 
      'files' in (window as any).LaunchParams.prototype;

    if (isFileHandlingSupported) {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        if (launchParams.files && launchParams.files.length > 0) {
          const file = await launchParams.files[0].getFile();
          processFile(file);
        }
      });
    }
  }, []);

  const processFile = (file: File) => {
    const isXlsx = file.name.endsWith('.xlsx');
    const reader = new FileReader();

    reader.onload = (event) => {
      let csvContent = '';
      
      if (isXlsx) {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        csvContent = XLSX.utils.sheet_to_csv(firstSheet);
      } else {
        csvContent = event.target?.result as string;
      }

      const lines = csvContent.split(/\r\n|\n|\r/);
      let foundTx: Transaction[] = [];
      let ob = 0;
      let cl = 0;

      const parseAmountString = (str: string) => {
        if (!str) return 0;
        const cleaned = str.replace(/PKR|"/gi, '').replace(/,/g, '').trim();
        return parseFloat(cleaned) || 0;
      };

      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        const upper = trimmedLine.toUpperCase();
        
        if (upper.includes('OPENING') && upper.includes('BALANCE')) {
            const parts = trimmedLine.split(',');
            const balancePart = parts.slice(1).find(p => /\d/.test(p));
            if (balancePart) ob = parseAmountString(balancePart);
            return;
        }
        
        if (upper.includes('CLOSING') && upper.includes('BALANCE')) {
            const parts = trimmedLine.split(',');
            const balancePart = parts.slice(1).find(p => /\d/.test(p));
            if (balancePart) cl = parseAmountString(balancePart);
            return;
        }

        if (!upper.includes('BOOKING DATE') && !upper.includes('DATE,') && !upper.includes('CURRENCY')) {
            try {
                const parts = trimmedLine.split(',').map(p => p.trim().replace(/"/g, ''));
                if (parts.length < 7) return;

                const date = new Date(parts[0]);
                if (isNaN(date.getTime())) return;

                const description = parts[3];
                const debit = parseAmountString(parts[4]);
                const credit = parseAmountString(parts[5]);
                const balance = parseAmountString(parts[6]);

                if (description) {
                    foundTx.push({
                        date,
                        description,
                        debit,
                        credit,
                        balance,
                        type: credit > 0 ? 'income' : 'expense',
                        amount: credit > 0 ? credit : debit
                    });
                }
            } catch (e) {}
        }
      });

      setTransactions(foundTx);
      setOpeningBalance(ob);
      setClosingBalance(cl);
      setSelectedDate(null);
      if (foundTx.length > 0) {
        setCurrentDate(foundTx[0].date);
        localStorage.setItem('is_init', 'true');
      }
    };

    if (isXlsx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const clearData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Helper formatting
  const cur = (val: number) => `PKR ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // Summary logic
  const stats = useMemo(() => {
    const monthTx = transactions.filter(t => isSameMonth(t.date, currentDate));
    const inc = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalInc = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      monthlyIncome: inc,
      monthlyExpense: exp,
      totalIncome: totalInc,
      totalExpense: totalExp,
      netTotal: totalInc - totalExp,
      expenseRatio: totalInc > 0 ? (totalExp / totalInc) * 100 : 0
    };
  }, [transactions, currentDate]);

  // Transaction grouping
  const groupedTransactions = useMemo(() => {
    let filtered = transactions;
    if (searchQuery) {
        filtered = filtered.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (currentFilter !== 'all') {
        filtered = filtered.filter(t => t.type === currentFilter);
    }
    if (selectedDate) {
        filtered = filtered.filter(t => isSameDay(t.date, selectedDate));
    } else {
        // Show by current month if no date selected
        filtered = filtered.filter(t => isSameMonth(t.date, currentDate));
    }

    const groups: { [key: string]: Transaction[] } = {};
    filtered.forEach(t => {
      const key = format(t.date, 'yyyy-MM-dd');
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => ({
      date: new Date(date),
      items: groups[date]
    }));
  }, [transactions, currentDate, selectedDate, searchQuery, currentFilter]);

  // Category Heuristic
  const getIconAndCategory = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('food') || d.includes('kfc') || d.includes('restaurant') || d.includes('pizza')) return { icon: Coffee, color: 'orange', label: 'Dining' };
    if (d.includes('shopping') || d.includes('store') || d.includes('mall')) return { icon: ShoppingBag, color: 'purple', label: 'Shopping' };
    if (d.includes('transfer') || d.includes('raast') || d.includes('nayapay')) return { icon: ArrowUpRight, color: 'blue', label: 'Transfer' };
    if (d.includes('bill') || d.includes('utility') || d.includes('electric')) return { icon: Zap, color: 'yellow', label: 'Utilities' };
    return { icon: Wallet, color: 'zinc', label: 'General' };
  };



  return (
      <div className={cn(
        "min-h-screen flex flex-col items-center py-4 md:py-8 px-4 md:px-6 pb-20 overflow-x-hidden no-scrollbar transition-colors duration-300",
        theme === 'light' ? "bg-[#F9FAFB] text-zinc-900" : "bg-zinc-950 text-zinc-100"
      )}>
        <div className="w-full max-w-4xl space-y-6 md:space-y-10">
        
        {/* Top Actions & Logo */}
        <div className="flex justify-between items-center mb-2">
           <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-none flex items-center justify-center -rotate-12 transition-all",
                theme === 'light' ? "bg-black shadow-lg shadow-black/10" : "bg-white"
              )}>
                 <Activity className={cn(
                   "w-6 h-6",
                   theme === 'light' ? "text-white" : "text-black"
                 )} />
              </div>
              <h2 className="text-xl font-bold tracking-tight lowercase">mznviz</h2>
           </div>
           <div className="flex gap-2">
              <div className={cn(
                "flex p-1 rounded-none transition-colors",
                theme === 'light' ? "bg-zinc-100" : "bg-zinc-800"
              )}>
                <button 
                  onClick={() => setTheme('light')}
                  className={cn("p-2 rounded-none transition-all", theme === 'light' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Sun size={18} />
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={cn("p-2 rounded-none transition-all", theme === 'dark' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Moon size={18} />
                </button>
              </div>
              <button 
                onClick={clearData}
                className={cn(
                  "p-2.5 rounded-none transition-all active:scale-95",
                  theme === 'light' ? "hover:bg-zinc-100 text-zinc-400" : "hover:bg-zinc-800 text-zinc-500"
                )}
              >
                <Trash2 size={20} />
              </button>
              <label htmlFor="csv-upload" className={cn(
                "p-2.5 rounded-none cursor-pointer transition-all active:scale-95 flex items-center justify-center border",
                theme === 'light' ? "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
              )}>
                 <Upload size={20} />
                 <input type="file" id="csv-upload" className="hidden" accept=".csv,.xlsx" onChange={handleFileUpload} />
              </label>
           </div>
        </div>

        {transactions.length > 0 ? (
          <>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                 <div className="flex gap-6 md:gap-16">
                    <div>
                       <p className={cn("font-bold text-[10px] mb-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Opening Balance</p>
                       <h2 className={cn("text-xl md:text-3xl font-black tracking-tight", theme === 'light' ? "text-zinc-900" : "text-zinc-100")}>{cur(openingBalance)}</h2>
                    </div>
                    <div>
                       <p className={cn("font-bold text-[10px] mb-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Closing Balance</p>
                       <h2 className={cn("text-xl md:text-3xl font-black tracking-tight", theme === 'light' ? "text-zinc-900" : "text-zinc-100")}>{cur(closingBalance)}</h2>
                    </div>
                 </div>
                 <div className={cn(
                   "border rounded-none p-1.5 flex items-center gap-1 transition-colors",
                   theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"
                 )}>
                     <button onClick={() => setCurrentDate(prev => subMonths(prev, 1))} className={cn("p-2 rounded-none transition-all", theme === 'light' ? "hover:bg-zinc-50" : "hover:bg-zinc-800 text-zinc-400")}>
                        <ChevronLeft size={16} className="md:w-5 md:h-5" />
                     </button>
                     <span className="px-2 md:px-4 text-xs md:text-sm font-black min-w-[100px] md:min-w-[120px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
                     <button onClick={() => setCurrentDate(prev => addMonths(prev, 1))} className={cn("p-2 rounded-none transition-all", theme === 'light' ? "hover:bg-zinc-50" : "hover:bg-zinc-800 text-zinc-400")}>
                        <ChevronRight size={16} className="md:w-5 md:h-5" />
                     </button>
                 </div>
              </div>

              <div className={cn("relative py-4 border-y", theme === 'light' ? "border-zinc-100" : "border-zinc-900")}>
                 <div className="flex justify-between items-center mb-3">
                    <span className={cn("text-[10px] font-black", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Expense Allocation</span>
                    <div className={cn("text-[10px] font-black tracking-tighter", theme === 'light' ? "text-zinc-900" : "text-zinc-100")}>
                       Spent vs Income: {Math.round(stats.expenseRatio)}%
                    </div>
                 </div>
                 <div className={cn("h-2.5 w-full rounded-none overflow-hidden flex", theme === 'light' ? "bg-zinc-100" : "bg-zinc-900")}>
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-700 ease-out" 
                      style={{ width: `${100 - stats.expenseRatio}%` }} 
                    />
                    <div 
                      className="h-full bg-orange-500 transition-all duration-700 ease-out" 
                      style={{ width: `${stats.expenseRatio}%` }} 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                 {[
                   { label: 'Monthly Income', amount: stats.monthlyIncome, color: 'text-green-600', icon: <ArrowDownLeft size={14} /> },
                   { label: 'Monthly Spent', amount: stats.monthlyExpense, color: 'text-orange-600', icon: <ArrowUpRight size={14} /> },
                   { label: 'Total Deposit', amount: stats.totalIncome, color: 'text-indigo-600', icon: <Wallet size={14} /> },
                   { label: 'Total Spent', amount: stats.totalExpense, color: 'text-zinc-600', icon: <CreditCard size={14} /> },
                 ].map((card, i) => (
                    <div key={i} className="flex flex-col group">
                       <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "w-5 h-5 flex items-center justify-center rounded-none font-bold text-[10px]",
                            card.color,
                            theme === 'light' ? "bg-zinc-50" : "bg-zinc-900"
                          )}>
                            {card.icon}
                          </span>
                          <p className={cn("text-[10px] font-black", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>{card.label}</p>
                       </div>
                       <h3 className={cn("text-base md:text-xl font-black", theme === 'light' ? "text-zinc-900" : "text-zinc-100")}>{cur(card.amount)}</h3>
                    </div>
                 ))}
              </div>
            </div>

            {/* Transaction Feed */}
            <div className="flex flex-col gap-10">
                <div className="w-full space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div>
                        <h2 className={cn("text-xl md:text-2xl font-black tracking-tight", theme === 'light' ? "text-zinc-900" : "text-zinc-100")}>Transaction Feed</h2>
                        <p className={cn("text-[10px] md:text-xs font-bold mt-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Showing {groupedTransactions.reduce((acc, g) => acc + g.items.length, 0)} activities</p>
                     </div>
                     <div className="flex gap-2 w-full md:w-auto">
                        <button 
                           onClick={() => setCurrentFilter('income')}
                           className={cn(
                             "flex-1 md:flex-none px-6 py-2.5 border rounded-none text-xs font-black transition-all",
                             currentFilter === 'income' ? 
                              (theme === 'light' ? "bg-black text-white border-black" : "bg-white text-black border-white") : 
                              (theme === 'light' ? "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700")
                           )}
                        >Income</button>
                        <button 
                           onClick={() => setCurrentFilter('expense')}
                           className={cn(
                             "flex-1 md:flex-none px-6 py-2.5 border rounded-none text-xs font-black transition-all",
                             currentFilter === 'expense' ? 
                              (theme === 'light' ? "bg-black text-white border-black" : "bg-white text-black border-white") : 
                              (theme === 'light' ? "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700")
                           )}
                        >Expenses</button>
                        <button 
                           onClick={() => {
                             setCurrentFilter('all');
                             setSelectedDate(null);
                             setSearchQuery('');
                           }}
                           title="Clear all filters"
                           className={cn(
                             "w-10 h-10 md:w-11 md:h-11 flex items-center justify-center border rounded-none text-xs font-black transition-all",
                             (currentFilter === 'all' && !selectedDate && !searchQuery) ? 
                              (theme === 'light' ? "bg-black text-white border-black" : "bg-white text-black border-white") : 
                              (theme === 'light' ? "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700")
                           )}
                        ><X size={16} className="md:w-5 md:h-5" /></button>
                     </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative group">
                     <Search className={cn(
                       "absolute left-4 md:left-6 top-1/2 -translate-y-1/2 transition-colors md:w-5 md:h-5",
                       theme === 'light' ? "text-zinc-400 group-focus-within:text-indigo-500" : "text-zinc-600 group-focus-within:text-zinc-100"
                     )} size={18} />
                     <input 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       placeholder="Search transactions..." 
                       className={cn(
                         "w-full border py-3.5 md:py-5 pl-12 md:pl-16 pr-6 md:pr-8 rounded-none focus:outline-none focus:ring-4 transition-all font-bold text-sm md:text-base",
                         theme === 'light' ? "bg-white border-zinc-100 focus:ring-indigo-500/5 focus:border-indigo-200 text-zinc-800 placeholder:text-zinc-400" :
                         "bg-zinc-900 border-zinc-800 focus:ring-zinc-100/5 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-700"
                       )}
                     />
                  </div>

                  {/* Activity List */}
                  <div className="space-y-10">
                    {groupedTransactions.length > 0 ? groupedTransactions.map((group, gi) => (
                      <div key={gi} className="space-y-6">
                        <div className="flex items-center gap-6">
                           <span 
                             onClick={() => setSelectedDate(selectedDate && isSameDay(selectedDate, group.date) ? null : group.date)}
                             className={cn(
                               "text-[11px] font-black whitespace-nowrap px-4 py-1.5 rounded-none border cursor-pointer transition-all hover:scale-105 active:scale-95",
                               selectedDate && isSameDay(group.date, selectedDate)
                                ? (theme === 'light' ? "bg-black text-white border-black" : "bg-white text-black border-white")
                                : (theme === 'light' ? "bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-300" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600")
                             )}
                           >
                              {isToday(group.date) ? 'Today' : isYesterday(group.date) ? 'Yesterday' : format(group.date, 'EEEE, MMM d, yyyy')}
                           </span>
                           <div className={cn("h-[1px] w-full", theme === 'light' ? "bg-zinc-100" : "bg-zinc-900")} />
                        </div>
                        
                        <div className="grid gap-4">
                           {group.items.map((t, ii) => {
                             const cat = getIconAndCategory(t.description);
                             return (
                                <div 
                                  key={ii} 
                                  onClick={() => setSelectedTx(t)}
                                  className={cn(
                                    "group p-4 md:p-6 rounded-none border flex items-center justify-between cursor-pointer relative overflow-hidden",
                                    theme === 'light' ? "bg-white border-zinc-50" : "bg-zinc-900 border-zinc-800"
                                  )}
                                >
                                   <div className="flex items-center gap-3 md:gap-6 z-10 flex-1 min-w-0">
                                      <div className={cn(
                                        "w-10 h-10 md:w-14 md:h-14 rounded-none flex items-center justify-center transition-all duration-300 shrink-0",
                                        cat.color === 'indigo' ? (theme === 'light' ? "bg-indigo-50 text-indigo-600" : "bg-indigo-900/40 text-indigo-400") :
                                        cat.color === 'orange' ? (theme === 'light' ? "bg-orange-50 text-orange-600" : "bg-orange-900/40 text-orange-400") :
                                        cat.color === 'purple' ? (theme === 'light' ? "bg-purple-50 text-purple-600" : "bg-purple-900/40 text-purple-400") :
                                        cat.color === 'yellow' ? (theme === 'light' ? "bg-yellow-50 text-yellow-600" : "bg-yellow-900/40 text-yellow-400") :
                                        cat.color === 'blue' ? (theme === 'light' ? "bg-blue-50 text-blue-600" : "bg-blue-900/40 text-blue-400") : 
                                        (theme === 'light' ? "bg-zinc-50 text-zinc-600" : "bg-zinc-800 text-zinc-300")
                                      )}>
                                         <cat.icon size={20} className="md:w-6 md:h-6" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                         <h4 className={cn("text-xs md:text-base font-black line-clamp-1 leading-tight md:leading-snug mb-1", theme === 'light' ? "text-zinc-800" : "text-zinc-100")}>{t.description}</h4>
                                         <div className="flex items-center gap-2 md:gap-3">
                                            <span className={cn(
                                              "text-[9px] md:text-[10px] px-2 md:px-3 py-1 rounded-none font-black border leading-none",
                                              theme === 'light' ? "bg-zinc-100 text-zinc-600 border-zinc-200" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                                            )}>{cat.label}</span>
                                            <span className={cn("text-[9px] md:text-[11px] font-bold", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Bal {t.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="text-right z-10 ml-4 shrink-0">
                                      <div className={cn(
                                        "text-base md:text-xl font-black tracking-tighter",
                                        t.type === 'income' ? "text-green-600" : "text-red-500"
                                      )}>
                                         {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                      </div>
                                      <div className={cn("text-[9px] md:text-[10px] font-black mt-0.5 md:mt-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Confirmed</div>
                                   </div>
                                </div>
                             );
                           })}
                        </div>
                      </div>
                    )) : (
                      <div className={cn(
                        "flex flex-col items-center justify-center py-32 px-10 text-center border-2 border-dashed rounded-none",
                        theme === 'light' ? "bg-zinc-50 border-zinc-100" : "bg-zinc-900/50 border-zinc-800"
                      )}>
                         <div className={cn(
                           "w-24 h-24 rounded-none flex items-center justify-center mb-8",
                           theme === 'light' ? "bg-white" : "bg-zinc-900"
                          )}>
                             <CalendarIcon className={cn("w-8 h-8 md:w-10 md:h-10", theme === 'light' ? "text-zinc-200" : "text-zinc-800")} />
                          </div>
                          <h3 className={cn("font-black text-xl md:text-2xl", theme === 'light' ? "text-zinc-800" : "text-zinc-100")}>No transactions found</h3>
                          <p className={cn("text-xs md:text-sm max-w-[280px] mt-2 md:mt-4 font-bold leading-relaxed", theme === 'light' ? "text-zinc-400" : "text-zinc-600")}>Adjust your filters or click a date header in the feed to filter by day</p>
                       </div>
                    )}
                  </div>
               </div>
            </div>
          </>
        ) : (
          <div className="relative w-full flex flex-col items-center justify-center py-24 overflow-hidden min-h-[60vh]">
            <div className="relative z-10 w-full max-w-sm text-center space-y-10 px-6">
              <div className="space-y-4">
                <div className={cn(
                  "inline-flex p-3 rounded-none transition-all duration-500",
                  theme === 'light' ? "bg-black text-white" : "bg-white text-black"
                )}>
                  <Activity size={28} />
                </div>
                <div className="space-y-1.5">
                  <h1 className={cn(
                    "text-3xl font-bold tracking-tight",
                    theme === 'light' ? "text-zinc-900" : "text-white"
                  )}>
                    mznviz
                  </h1>
                  <p className={cn(
                    "text-sm font-medium",
                    theme === 'light' ? "text-indigo-600" : "text-indigo-400"
                  )}>
                    A smarter way to track your expenses
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label 
                  htmlFor="csv-upload-main" 
                  className={cn(
                    "flex items-center justify-center gap-3 w-full py-4 px-6 rounded-none cursor-pointer transition-all active:scale-95 font-bold text-sm",
                    theme === 'light' ? "bg-black text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-100"
                  )}
                >
                  <Upload size={18} />
                  <span>Import your statement</span>
                  <input type="file" id="csv-upload-main" className="hidden" accept=".csv,.xlsx" onChange={handleFileUpload} />
                </label>
                <p className={cn("text-[11px] font-semibold", theme === 'light' ? "text-zinc-600" : "text-zinc-400")}>
                  Optimized for Meezan Bank CSV & Excel exports
                </p>
              </div>

              <div className="pt-6">
                <p className={cn("text-[10px] font-bold px-4 py-2 inline-block rounded-none border", 
                  theme === 'light' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-emerald-950/30 text-emerald-400 border-emerald-900/50"
                )}>
                   Privacy First: No data ever leaves your device
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Bottom Sheet */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             onClick={() => setSelectedTx(null)}
           />
           <div className={cn(
             "relative w-full max-w-2xl p-8 space-y-8 animate-in slide-in-from-bottom duration-300",
             theme === 'light' ? "bg-white" : "bg-zinc-900 border-t border-zinc-800"
           )}>
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <span className={cn(
                      "text-[10px] uppercase font-black tracking-widest px-3 py-1 border",
                      theme === 'light' ? "bg-zinc-50 text-zinc-400 border-zinc-100" : "bg-zinc-800 text-zinc-500 border-zinc-700"
                    )}>
                      {getIconAndCategory(selectedTx.description).label}
                    </span>
                    <h2 className={cn("text-2xl md:text-3xl font-black tracking-tight mt-4", theme === 'light' ? "text-zinc-900" : "text-white")}>
                      {selectedTx.description}
                    </h2>
                 </div>
                 <button 
                   onClick={() => setSelectedTx(null)}
                   className={cn("p-2", theme === 'light' ? "text-zinc-300 hover:text-zinc-900" : "text-zinc-600 hover:text-white")}
                 >
                   <X size={24} />
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-10">
                 <div>
                    <label className={cn("text-[10px] font-black block mb-2", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Amount</label>
                    <div className={cn(
                      "text-3xl font-black",
                      selectedTx.type === 'income' ? "text-green-600" : "text-red-500"
                    )}>
                       {selectedTx.type === 'income' ? '+' : '-'}{selectedTx.amount.toLocaleString()}
                    </div>
                 </div>
                 <div>
                    <label className={cn("text-[10px] font-black block mb-2", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Status</label>
                    <div className={cn("text-3xl font-black", theme === 'light' ? "text-zinc-300" : "text-zinc-700")}>
                       Confirmed
                    </div>
                 </div>
              </div>

              <div className="h-[1px] w-full bg-zinc-100 dark:bg-zinc-800" />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                 <div>
                    <label className={cn("text-[10px] font-black block mb-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Date</label>
                    <p className="font-black text-sm">{format(selectedTx.date, 'EEEE, d MMM yyyy')}</p>
                 </div>
                 <div>
                    <label className={cn("text-[10px] font-black block mb-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Balance After</label>
                    <p className="font-black text-sm">{cur(selectedTx.balance)}</p>
                 </div>
                 <div className="col-span-2 md:col-span-1">
                    <label className={cn("text-[10px] font-black block mb-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Type</label>
                    <p className="font-black text-sm capitalize">{selectedTx.type}</p>
                 </div>
              </div>

              <button 
                onClick={() => setSelectedTx(null)}
                className={cn(
                  "w-full py-5 font-black text-xs tracking-widest uppercase transition-all",
                  theme === 'light' ? "bg-black text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-100"
                )}
              >
                Done
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default MeezanDashboard;

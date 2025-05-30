
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TransactionType, PieChartData, Budget } from '../../types';
import { 
  getTransactions
} from '../../services/transactionService';
import {
  getBudgetsForMonth,
  addBudget as apiAddBudget,
  updateBudget as apiUpdateBudget,
  deleteBudget as apiDeleteBudget,
} from '../../services/budgetService';
// TransactionForm is no longer used here
import SummaryDisplay from '../visualizations/SummaryDisplay';
import CategoryPieChart from '../visualizations/CategoryPieChart';
import IncomeExpenseTrendChart from '../visualizations/IncomeExpenseTrendChart'; // New Chart
import AiFinancialTip from '../ai/AiFinancialTip';
import BudgetList from '../budgets/BudgetList';
import BudgetForm from '../budgets/BudgetForm';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
// Input is still used by budget modal
import Input from '../ui/Input'; 
import { useAppContext } from '../../contexts/AppContext';
import { DEFAULT_EXPENSE_CATEGORIES, LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES } from '../../constants';

// Icons
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-plus ${className || "w-4 h-4"}`}></i>
);

const BanknotesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-piggy-bank ${className || "w-5 h-5"}`}></i>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-chevron-left ${className || "w-3 h-3"}`}></i>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-chevron-right ${className || "w-3 h-3"}`}></i>
);

interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
}

const Dashboard: React.FC = () => {
  const { t, language } = useAppContext();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  // Removed isTransactionModalOpen state
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  const [currentMonthYear, setCurrentMonthYear] = useState<string>(new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);

  const [allExpenseCategoriesForBudget, setAllExpenseCategoriesForBudget] = useState<{original: string, translated: string}[]>([]);

  useEffect(() => {
    const customExpense = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES) || '[]');
    const combined = Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...customExpense]));
    const translated = combined.map(cat => {
        const key = `categories.${cat.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
        const translatedDisplay = t(key);
        return { original: cat, translated: translatedDisplay === key ? cat : translatedDisplay };
    }).sort((a,b) => a.translated.localeCompare(b.translated));
    setAllExpenseCategoriesForBudget(translated);
  }, [t]);

  const fetchAllData = useCallback(() => {
    setIsLoadingTransactions(true);
    setIsLoadingBudgets(true);

    const userTransactions = getTransactions();
    userTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllTransactions(userTransactions);
    setIsLoadingTransactions(false);

    const monthBudgets = getBudgetsForMonth(currentMonthYear);
    setBudgets(monthBudgets);
    setIsLoadingBudgets(false);
  }, [currentMonthYear]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // handleAddTransaction removed

  const { income, expenses, balance } = useMemo(() => {
    let currentIncome = 0;
    let currentExpenses = 0;
    allTransactions.forEach(transaction => {
      if (transaction.type === TransactionType.INCOME) {
        currentIncome += transaction.amount;
      } else {
        currentExpenses += transaction.amount;
      }
    });
    return { income: currentIncome, expenses: currentExpenses, balance: currentIncome - currentExpenses };
  }, [allTransactions]);

  const expensePieChartData = useMemo((): PieChartData[] => {
    const expenseCategoriesMap: { [key: string]: number } = {};
    allTransactions
      .filter(transaction => transaction.type === TransactionType.EXPENSE)
      .forEach(transaction => {
        const categoryKey = `categories.${transaction.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
        const translatedCategory = t(categoryKey) === categoryKey ? transaction.category : t(categoryKey);
        expenseCategoriesMap[translatedCategory] = (expenseCategoriesMap[translatedCategory] || 0) + transaction.amount;
      });
    return Object.entries(expenseCategoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [allTransactions, t]);
  
  const incomeExpenseTrendData = useMemo((): MonthlyTrendData[] => {
    const data: MonthlyTrendData[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) { // Last 6 months including current
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYearStr = date.toISOString().slice(0, 7); // YYYY-MM
      const monthName = date.toLocaleDateString(language, { month: 'short', year: '2-digit' });

      let monthlyIncome = 0;
      let monthlyExpenses = 0;
      allTransactions.forEach(tx => {
        if (tx.date.startsWith(monthYearStr)) {
          if (tx.type === TransactionType.INCOME) {
            monthlyIncome += tx.amount;
          } else {
            monthlyExpenses += tx.amount;
          }
        }
      });
      data.push({ month: monthName, income: monthlyIncome, expenses: monthlyExpenses });
    }
    return data;
  }, [allTransactions, language]);


  const handleMonthChange = (offset: number) => {
    setCurrentMonthYear(prevMonthYear => {
      const date = new Date(prevMonthYear + '-01');
      date.setMonth(date.getMonth() + offset);
      return date.toISOString().slice(0, 7);
    });
  };

  const handleAddOrUpdateBudget = useCallback((budgetData: Omit<Budget, 'id' | 'userId'>) => {
    if (editingBudget) {
      apiUpdateBudget({ ...editingBudget, ...budgetData });
    } else {
      apiAddBudget(budgetData);
    }
    fetchAllData(); 
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  }, [editingBudget, fetchAllData]);

  const handleDeleteBudget = useCallback((budgetId: string) => {
    if (window.confirm(t('dashboard.budgets.confirmDeleteBudget'))) {
      apiDeleteBudget(budgetId);
      fetchAllData(); 
    }
  }, [fetchAllData, t]);

  const openBudgetModal = useCallback((budgetToEdit?: Budget) => {
    setEditingBudget(budgetToEdit || null);
    setIsBudgetModalOpen(true);
  }, []);

  const budgetsWithSpentAmount = useMemo(() => {
    return budgets.map(budget => {
      const spent = allTransactions
        .filter(t => t.type === TransactionType.EXPENSE && t.category === budget.category && t.date.startsWith(budget.monthYear))
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...budget, spentAmount: spent };
    });
  }, [budgets, allTransactions]);

  const currentMonthDisplay = useMemo(() => {
    const date = new Date(currentMonthYear + '-01');
    return date.toLocaleDateString(language, { year: 'numeric', month: 'long' });
  }, [currentMonthYear, language]);


  if (isLoadingTransactions || isLoadingBudgets) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Spinner size="lg" color="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Add Transaction Button - removed from here */}

      <SummaryDisplay income={income} expenses={expenses} balance={balance} />
      
      {/* New Income/Expense Trend Chart Section */}
      <div className="fintrack-card">
        <h2 className="fintrack-section-title">{t('dashboard.charts.incomeExpenseTrendTitle')}</h2>
        <IncomeExpenseTrendChart data={incomeExpenseTrendData} />
      </div>

      {/* Charts and Budgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 fintrack-card">
            <h2 className="fintrack-section-title">{t('dashboard.expenseBreakdownTitle')}</h2>
            <CategoryPieChart data={expensePieChartData} />
        </div>
        <div className="fintrack-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
              <h2 className="fintrack-section-title flex items-center mb-2 sm:mb-4">
                  <BanknotesIcon className="w-5 h-5 mr-2.5 text-primary dark:text-primaryLight"/>
                  {t('dashboard.budgets.title')}
              </h2>
              <Button onClick={() => openBudgetModal()} variant="primary" size="sm" leftIcon={<PlusIcon />}>
                  {t('dashboard.budgets.addBudgetButton')}
              </Button>
          </div>
          <div className="flex items-center justify-between mb-3 text-sm">
              <Button 
                onClick={() => handleMonthChange(-1)} 
                variant="ghost" 
                size="sm" 
                aria-label={t('dashboard.budgets.previousMonthAriaLabel')}
                className="text-grayText hover:text-primary dark:hover:text-primaryLight p-1.5"
              >
                <ChevronLeftIcon />
              </Button>
              <span className="font-medium text-lighttext dark:text-darktext">{currentMonthDisplay}</span>
              <Button 
                onClick={() => handleMonthChange(1)} 
                variant="ghost" 
                size="sm" 
                aria-label={t('dashboard.budgets.nextMonthAriaLabel')}
                className="text-grayText hover:text-primary dark:hover:text-primaryLight p-1.5"
              >
                <ChevronRightIcon />
              </Button>
          </div>
          {isLoadingBudgets ? <div className="flex justify-center py-4"><Spinner color="text-primary"/></div> : <BudgetList budgets={budgetsWithSpentAmount} onEdit={openBudgetModal} onDelete={handleDeleteBudget} />}
        </div>
      </div>
      
      <section aria-labelledby="ai-tip-heading" className="fintrack-card">
        <AiFinancialTip balance={balance} recentTransactionsCount={allTransactions.length} />
      </section>

      {/* TransactionForm Modal removed from here */}

      <Modal 
        isOpen={isBudgetModalOpen} 
        onClose={() => { setIsBudgetModalOpen(false); setEditingBudget(null); }} 
        title={editingBudget ? t('dashboard.budgets.editBudgetModalTitle') : t('dashboard.budgets.addBudgetModalTitle')}
      >
        <BudgetForm
          onSubmit={handleAddOrUpdateBudget}
          initialData={editingBudget || undefined}
          existingBudgetsForMonth={budgets.filter(b => b.monthYear === (editingBudget?.monthYear || currentMonthYear) && b.id !== editingBudget?.id )}
          availableCategories={allExpenseCategoriesForBudget}
          currentMonthYear={editingBudget?.monthYear || currentMonthYear}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;

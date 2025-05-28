import React, { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import { Transaction, TransactionType, PieChartData, Budget } from '../../types';
import { 
  getTransactions, 
  addTransaction as apiAddTransaction, 
  deleteTransaction as apiDeleteTransaction 
} from '../../services/transactionService';
import {
  getBudgetsForMonth,
  addBudget as apiAddBudget,
  updateBudget as apiUpdateBudget,
  deleteBudget as apiDeleteBudget,
  // getAllBudgets // Not used in this version, can be removed if not needed elsewhere
} from '../../services/budgetService';
import TransactionForm from '../transactions/TransactionForm';
import TransactionList from '../transactions/TransactionList';
import SummaryDisplay from '../visualizations/SummaryDisplay';
import CategoryPieChart from '../visualizations/CategoryPieChart';
import AiFinancialTip from '../ai/AiFinancialTip';
import BudgetList from '../budgets/BudgetList';
import BudgetForm from '../budgets/BudgetForm';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import Input from '../ui/Input';
import { useAppContext } from '../../contexts/AppContext';
import { DEFAULT_EXPENSE_CATEGORIES, LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES } from '../../constants';

// Props interface for Dashboard (empty for now, but good practice)
interface DashboardProps {}

// Icons (already provided in the prompt, ensure they are used or removed if not)
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
  </svg>
);

const ArrowPathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const TagIconSolid: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path d="M3.505 2.365A4.25 4.25 0 0 0 2 5.652V12.5A2.5 2.5 0 0 0 4.5 15h7.044A4.252 4.252 0 0 0 15.59 12.89l4.082-4.081a2.653 2.653 0 0 0 0-3.752L15.78 1.166a2.653 2.653 0 0 0-3.752 0L8.028 5.167A4.252 4.252 0 0 0 3.505 2.365ZM5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
  </svg>
);

const BanknotesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V6.375m0 0V18m0 0h16.5m0 0c.621 0 1.125-.504 1.125-1.125v-9.75c0-.621-.504-1.125-1.125-1.125h-16.5" />
  </svg>
);


interface FilterCriteria {
  keyword: string;
  type: 'ALL' | TransactionType;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  tag: string;
}

const initialFilterCriteria: FilterCriteria = {
  keyword: '',
  type: 'ALL',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  tag: '',
};

const Dashboard: React.FC<DashboardProps> = () => {
  const { t, language, formatCurrency } = useAppContext();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  const [filterInputs, setFilterInputs] = useState<FilterCriteria>(initialFilterCriteria);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria>(initialFilterCriteria);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

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

  const handleAddTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'userId'>) => {
    apiAddTransaction(transaction);
    fetchAllData();
    setIsTransactionModalOpen(false);
  }, [fetchAllData]);

  const handleDeleteTransaction = useCallback((id: string) => {
    if (window.confirm(t('dashboard.confirmDeleteTransaction'))) {
      apiDeleteTransaction(id);
      fetchAllData();
    }
  }, [fetchAllData, t]);
  
  const handleFilterInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setActiveFilters(filterInputs);
    setIsFiltersVisible(false); // Optionally close filter panel after applying
  }, [filterInputs]);

  const handleResetFilters = useCallback(() => {
    setFilterInputs(initialFilterCriteria);
    setActiveFilters(initialFilterCriteria);
  }, []);

  const toggleFiltersVisibility = useCallback(() => {
    setIsFiltersVisible(prev => !prev);
  }, []);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      const keywordLower = activeFilters.keyword.toLowerCase();
      const matchesKeyword = activeFilters.keyword ? transaction.description.toLowerCase().includes(keywordLower) : true;
      const matchesType = activeFilters.type === 'ALL' || transaction.type === activeFilters.type;
      const dateObj = new Date(transaction.date + 'T00:00:00'); // Ensure date is parsed in local timezone consistently
      const startDateObj = activeFilters.startDate ? new Date(activeFilters.startDate + 'T00:00:00') : null;
      const endDateObj = activeFilters.endDate ? new Date(activeFilters.endDate + 'T23:59:59') : null;

      const matchesDate = 
        (!startDateObj || dateObj >= startDateObj) &&
        (!endDateObj || dateObj <= endDateObj);
      const matchesMinAmount = activeFilters.minAmount ? transaction.amount >= parseFloat(activeFilters.minAmount) : true;
      const matchesMaxAmount = activeFilters.maxAmount ? transaction.amount <= parseFloat(activeFilters.maxAmount) : true;
      const matchesTag = activeFilters.tag ? transaction.tags?.map(t => t.toLowerCase()).includes(activeFilters.tag.toLowerCase()) : true;

      return matchesKeyword && matchesType && matchesDate && matchesMinAmount && matchesMaxAmount && matchesTag;
    });
  }, [allTransactions, activeFilters]);

  const isFiltered = useMemo(() => JSON.stringify(activeFilters) !== JSON.stringify(initialFilterCriteria) , [activeFilters]);

  const { income, expenses, balance } = useMemo(() => {
    let currentIncome = 0;
    let currentExpenses = 0;
    filteredTransactions.forEach(transaction => {
      if (transaction.type === TransactionType.INCOME) {
        currentIncome += transaction.amount;
      } else {
        currentExpenses += transaction.amount;
      }
    });
    return { income: currentIncome, expenses: currentExpenses, balance: currentIncome - currentExpenses };
  }, [filteredTransactions]);

  const expensePieChartData = useMemo((): PieChartData[] => {
    const expenseCategoriesMap: { [key: string]: number } = {};
    filteredTransactions
      .filter(transaction => transaction.type === TransactionType.EXPENSE)
      .forEach(transaction => {
        const categoryKey = `categories.${transaction.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
        const translatedCategory = t(categoryKey) === categoryKey ? transaction.category : t(categoryKey);
        expenseCategoriesMap[translatedCategory] = (expenseCategoriesMap[translatedCategory] || 0) + transaction.amount;
      });
    return Object.entries(expenseCategoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredTransactions, t]);
  
  const handleMonthChange = (offset: number) => {
    setCurrentMonthYear(prevMonthYear => {
      const date = new Date(prevMonthYear + '-01'); // Use day 01 to avoid month-end issues
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
    fetchAllData(); // Refresh budgets and potentially transactions if relevant
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  }, [editingBudget, fetchAllData]);

  const handleDeleteBudget = useCallback((budgetId: string) => {
    if (window.confirm(t('dashboard.budgets.confirmDeleteBudget'))) {
      apiDeleteBudget(budgetId);
      fetchAllData(); // Refresh budgets
    }
  }, [fetchAllData, t]);

  const openBudgetModal = useCallback((budgetToEdit?: Budget) => {
    setEditingBudget(budgetToEdit || null);
    setIsBudgetModalOpen(true);
  }, []);

  const budgetsWithSpentAmount = useMemo(() => {
    return budgets.map(budget => {
      const spent = allTransactions // Use allTransactions for budget calculation, not filtered ones
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
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"> {/* Adjust min-height based on Navbar/Footer height */}
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8"> {/* Main content spacing */}
      <SummaryDisplay income={income} expenses={expenses} balance={balance} />

      {/* Filter Section */}
      <section aria-labelledby="filter-section-heading" className="bg-white dark:bg-darkSurface shadow-lg rounded-xl p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 id="filter-section-heading" className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.filters.title')}</h2>
          <Button onClick={toggleFiltersVisibility} variant="ghost" size="sm" leftIcon={<FilterIcon className="w-4 h-4"/>} aria-expanded={isFiltersVisible}>
            {isFiltersVisible ? t('dashboard.filters.hide') : t('dashboard.filters.show')}
          </Button>
        </div>
        {isFiltersVisible && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 border-t pt-4 mt-2 dark:border-darkBorder">
            <Input label={t('dashboard.filters.keywordLabel')} name="keyword" value={filterInputs.keyword} onChange={handleFilterInputChange} placeholder={t('dashboard.filters.keywordPlaceholder')} />
            <div>
                <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.filters.typeLabel')}</label>
                <select id="filter-type" name="type" value={filterInputs.type} onChange={handleFilterInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-darkBorder rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext">
                    <option value="ALL">{t('dashboard.filters.typeAll')}</option>
                    <option value={TransactionType.INCOME}>{t('dashboard.filters.typeIncome')}</option>
                    <option value={TransactionType.EXPENSE}>{t('dashboard.filters.typeExpense')}</option>
                </select>
            </div>
            <Input label={t('dashboard.filters.tagLabel')} name="tag" value={filterInputs.tag} onChange={handleFilterInputChange} placeholder={t('dashboard.filters.tagPlaceholder')} leftIcon={<TagIconSolid className="w-4 h-4 text-gray-400 dark:text-gray-500"/>} />
            <Input label={t('dashboard.filters.startDateLabel')} name="startDate" type="date" value={filterInputs.startDate} onChange={handleFilterInputChange} className="dark:[color-scheme:dark]" />
            <Input label={t('dashboard.filters.endDateLabel')} name="endDate" type="date" value={filterInputs.endDate} onChange={handleFilterInputChange} className="dark:[color-scheme:dark]" />
            <Input label={t('dashboard.filters.minAmountLabel')} name="minAmount" type="number" value={filterInputs.minAmount} onChange={handleFilterInputChange} placeholder="0.00"/>
            <Input label={t('dashboard.filters.maxAmountLabel')} name="maxAmount" type="number" value={filterInputs.maxAmount} onChange={handleFilterInputChange} placeholder="1000.00"/>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end space-x-3 mt-2">
                <Button onClick={handleResetFilters} variant="ghost" size="sm" leftIcon={<ArrowPathIcon className="w-4 h-4"/>}>{t('dashboard.filters.resetButton')}</Button>
                <Button onClick={handleApplyFilters} variant="primary" size="sm">{t('dashboard.filters.applyButton')}</Button>
            </div>
          </div>
        )}
      </section>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section aria-labelledby="transactions-heading" className="bg-white dark:bg-darkSurface shadow-lg rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h2 id="transactions-heading" className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 sm:mb-0">{t('dashboard.transactionsTitle')}</h2>
              <Button onClick={() => setIsTransactionModalOpen(true)} leftIcon={<PlusIcon className="w-5 h-5" />}>
                {t('dashboard.addTransactionButton')}
              </Button>
            </div>
            <TransactionList 
              transactions={filteredTransactions} 
              onDelete={handleDeleteTransaction} 
              isFiltered={isFiltered}
              hasOriginalTransactions={allTransactions.length > 0}
            />
          </section>
          
          <section aria-labelledby="ai-tip-heading">
            <AiFinancialTip balance={balance} recentTransactionsCount={filteredTransactions.length} />
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <section aria-labelledby="expense-breakdown-heading" className="bg-white dark:bg-darkSurface shadow-lg rounded-xl p-4 sm:p-6">
            <h2 id="expense-breakdown-heading" className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('dashboard.expenseBreakdownTitle')}</h2>
            <CategoryPieChart data={expensePieChartData} />
          </section>

          <section aria-labelledby="budgets-heading" className="bg-white dark:bg-darkSurface shadow-lg rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
                <h2 id="budgets-heading" className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 sm:mb-0 flex items-center">
                    <BanknotesIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light"/>
                    {t('dashboard.budgets.title')}
                </h2>
                <Button onClick={() => openBudgetModal()} variant="secondary" size="sm" leftIcon={<PlusIcon className="w-4 h-4"/>}>
                    {t('dashboard.budgets.addBudgetButton')}
                </Button>
            </div>
            <div className="flex items-center justify-between mb-3 text-sm text-gray-600 dark:text-gray-300">
                <Button onClick={() => handleMonthChange(-1)} variant="ghost" size="sm" aria-label={t('dashboard.budgets.previousMonthAriaLabel')}>&lt; {t('dashboard.budgets.prevMonth')}</Button>
                <span className="font-medium">{currentMonthDisplay}</span>
                <Button onClick={() => handleMonthChange(1)} variant="ghost" size="sm" aria-label={t('dashboard.budgets.nextMonthAriaLabel')}>{t('dashboard.budgets.nextMonth')} &gt;</Button>
            </div>
            {isLoadingBudgets ? <div className="flex justify-center py-4"><Spinner/></div> : <BudgetList budgets={budgetsWithSpentAmount} onEdit={openBudgetModal} onDelete={handleDeleteBudget} />}
          </section>
        </div>
      </div>

      <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={t('dashboard.addTransactionModalTitle')}>
        <TransactionForm onSubmit={handleAddTransaction} />
      </Modal>

      <Modal 
        isOpen={isBudgetModalOpen} 
        onClose={() => { setIsBudgetModalOpen(false); setEditingBudget(null); }} 
        title={editingBudget ? t('dashboard.budgets.editBudgetModalTitle') : t('dashboard.budgets.addBudgetModalTitle')}
      >
        <BudgetForm
          onSubmit={handleAddOrUpdateBudget}
          initialData={editingBudget || undefined}
          // Pass budgets for the specific month, excluding the one being edited
          existingBudgetsForMonth={budgets.filter(b => b.monthYear === (editingBudget?.monthYear || currentMonthYear) && b.id !== editingBudget?.id )}
          availableCategories={allExpenseCategoriesForBudget}
          currentMonthYear={editingBudget?.monthYear || currentMonthYear}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;

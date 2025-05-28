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
  getAllBudgets // For checking if category is in use by budget (optional)
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


interface DashboardProps {}

// Icons
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
  tag: string; // New filter for tags
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
  const { t, language } = useAppContext(); // Assuming language is needed for month name
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [filterInputs, setFilterInputs] = useState<FilterCriteria>(initialFilterCriteria);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria>(initialFilterCriteria);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // Budget states
  const [currentMonthYear, setCurrentMonthYear] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
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
    setIsLoading(true);
    setIsLoadingBudgets(true);

    const userTransactions = getTransactions();
    userTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllTransactions(userTransactions);
    setIsLoading(false);

    const monthBudgets = getBudgetsForMonth(currentMonthYear);
    setBudgets(monthBudgets);
    setIsLoadingBudgets(false);
  }, [currentMonthYear]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddTransaction = useCallback((newTransactionData: Omit<Transaction, 'id' | 'userId'>) => {
    apiAddTransaction(newTransactionData);
    fetchAllData(); 
    setIsModalOpen(false);
  }, [fetchAllData]);

  const handleDeleteTransaction = useCallback((transactionId: string) => {
    apiDeleteTransaction(transactionId);
    fetchAllData(); 
  }, [fetchAllData]);

  const handleFilterInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
  };

  const handleResetFilters = () => {
    setFilterInputs(initialFilterCriteria);
    setActiveFilters(initialFilterCriteria);
  };

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      // Keyword filter
      if (activeFilters.keyword) {
        const searchTerm = activeFilters.keyword.toLowerCase();
        if (
          !transaction.description.toLowerCase().includes(searchTerm) &&
          !transaction.category.toLowerCase().includes(searchTerm)
        ) {
          return false;
        }
      }
      // Type filter
      if (activeFilters.type !== 'ALL' && transaction.type !== activeFilters.type) return false;
      // Date range filter
      if (activeFilters.startDate) {
        const transactionDateOnly = new Date(transaction.date).setHours(0,0,0,0);
        const startDateOnly = new Date(activeFilters.startDate).setHours(0,0,0,0);
        if (transactionDateOnly < startDateOnly) return false;
      }
      if (activeFilters.endDate) {
        const transactionDateOnly = new Date(transaction.date).setHours(0,0,0,0);
        const endDateOnly = new Date(activeFilters.endDate).setHours(0,0,0,0);
        if (transactionDateOnly > endDateOnly) return false;
      }
      // Amount range filter
      if (activeFilters.minAmount && !isNaN(parseFloat(activeFilters.minAmount)) && transaction.amount < parseFloat(activeFilters.minAmount)) return false;
      if (activeFilters.maxAmount && !isNaN(parseFloat(activeFilters.maxAmount)) && transaction.amount > parseFloat(activeFilters.maxAmount)) return false;
      // Tag filter
      if (activeFilters.tag) {
        const searchTag = activeFilters.tag.toLowerCase();
        if (!transaction.tags || !transaction.tags.some(tag => tag.toLowerCase().includes(searchTag))) {
          return false;
        }
      }
      return true;
    });
  }, [allTransactions, activeFilters]);
  
  const isCurrentlyFiltered = JSON.stringify(activeFilters) !== JSON.stringify(initialFilterCriteria);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    filteredTransactions.forEach(t => {
      if (t.type === TransactionType.INCOME) income += t.amount;
      else expenses += t.amount;
    });
    return { totalIncome: income, totalExpenses: expenses, balance: income - expenses };
  }, [filteredTransactions]);

  const expensePieChartData: PieChartData[] = useMemo(() => {
    const expenseByCategory: { [key: string]: number } = {};
    filteredTransactions
      .filter(transaction => transaction.type === TransactionType.EXPENSE)
      .forEach(transaction => {
        const categoryKey = `categories.${transaction.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`; 
        const translatedCategory = t(categoryKey) === categoryKey ? transaction.category : t(categoryKey); 
        expenseByCategory[translatedCategory] = (expenseByCategory[translatedCategory] || 0) + transaction.amount;
      });
    return Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions, t]);


  // Budget handlers
  const handleOpenBudgetModal = (budgetToEdit: Budget | null = null) => {
    setEditingBudget(budgetToEdit);
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = (budgetData: Omit<Budget, 'id' | 'userId'>) => {
    if (editingBudget) {
      apiUpdateBudget({ ...editingBudget, ...budgetData });
    } else {
      apiAddBudget(budgetData);
    }
    fetchAllData(); // Refetch budgets and potentially transactions if they affect budget display
    setIsBudgetModalOpen(false);
    setEditingBudget(null);
  };

  const handleDeleteBudget = (budgetId: string) => {
    // Consider adding a confirmation modal here
    apiDeleteBudget(budgetId);
    fetchAllData(); // Refetch budgets
  };

  const budgetsWithSpent = useMemo(() => {
    return budgets.map(budget => {
      const spentAmount = allTransactions
        .filter(t => t.type === TransactionType.EXPENSE && t.category === budget.category && t.date.startsWith(budget.monthYear))
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...budget, spentAmount };
    });
  }, [budgets, allTransactions]);
  
  const handleMonthChange = (offset: number) => {
    setCurrentMonthYear(prevMonthYear => {
      const date = new Date(prevMonthYear + '-01'); // Ensure it's a valid date for the 1st of the month
      date.setMonth(date.getMonth() + offset);
      return date.toISOString().slice(0, 7);
    });
  };
  
  const displayMonthYear = useMemo(() => {
    const date = new Date(currentMonthYear + '-01');
    return date.toLocaleDateString(language, { month: 'long', year: 'numeric' });
  }, [currentMonthYear, language]);


  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">{t('dashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <SummaryDisplay income={totalIncome} expenses={totalExpenses} balance={balance} />

      {/* Filters Section */}
      <div className="my-6 p-4 bg-gray-50 dark:bg-darkSurface/50 rounded-lg shadow-md transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center">
            <FilterIcon className="w-5 h-5 mr-2 text-primary dark:text-primary-light"/>
            {t('dashboard.filtersTitle')}
          </h3>
          <Button 
            onClick={() => setIsFiltersVisible(!isFiltersVisible)} 
            variant="ghost" 
            size="sm"
            className="text-primary dark:text-primary-light"
          >
            {isFiltersVisible ? t('dashboard.hideFiltersButton') : t('dashboard.showFiltersButton')}
          </Button>
        </div>
        {isFiltersVisible && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label={t('dashboard.filterKeywordLabel')}
                id="filterKeyword"
                name="keyword"
                value={filterInputs.keyword}
                onChange={handleFilterInputChange}
                placeholder={t('dashboard.filterKeywordPlaceholder')}
                containerClassName="mb-0"
              />
              <div>
                <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('dashboard.filterTypeLabel')}
                </label>
                <select
                  id="filterType"
                  name="type"
                  value={filterInputs.type}
                  onChange={handleFilterInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-darkBorder 
                            rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary 
                            sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext"
                >
                  <option value="ALL">{t('dashboard.filterTypeAll')}</option>
                  <option value={TransactionType.INCOME}>{t('dashboard.filterTypeIncome')}</option>
                  <option value={TransactionType.EXPENSE}>{t('dashboard.filterTypeExpense')}</option>
                </select>
              </div>
               <Input
                label={t('dashboard.filterTagLabel')}
                id="filterTag"
                name="tag"
                value={filterInputs.tag}
                onChange={handleFilterInputChange}
                placeholder={t('dashboard.filterTagPlaceholder')}
                containerClassName="mb-0"
                leftIcon={<TagIconSolid className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('dashboard.filterStartDateLabel')}
                id="filterStartDate"
                name="startDate"
                type="date"
                value={filterInputs.startDate}
                onChange={handleFilterInputChange}
                containerClassName="mb-0"
                className="dark:[color-scheme:dark]"
              />
              <Input
                label={t('dashboard.filterEndDateLabel')}
                id="filterEndDate"
                name="endDate"
                type="date"
                value={filterInputs.endDate}
                onChange={handleFilterInputChange}
                containerClassName="mb-0"
                className="dark:[color-scheme:dark]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label={t('dashboard.filterMinAmountLabel')}
                    id="filterMinAmount"
                    name="minAmount"
                    type="number"
                    value={filterInputs.minAmount}
                    onChange={handleFilterInputChange}
                    placeholder={t('dashboard.filterMinAmountPlaceholder')}
                    containerClassName="mb-0"
                    min="0"
                    step="0.01"
                />
                <Input
                    label={t('dashboard.filterMaxAmountLabel')}
                    id="filterMaxAmount"
                    name="maxAmount"
                    type="number"
                    value={filterInputs.maxAmount}
                    onChange={handleFilterInputChange}
                    placeholder={t('dashboard.filterMaxAmountPlaceholder')}
                    containerClassName="mb-0"
                    min="0"
                    step="0.01"
                />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button onClick={handleResetFilters} variant="ghost" size="sm" leftIcon={<ArrowPathIcon className="w-4 h-4"/>}>
                {t('dashboard.resetFiltersButton')}
              </Button>
              <Button onClick={handleApplyFilters} variant="primary" size="sm">
                {t('dashboard.applyFiltersButton')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area (Transactions, Budgets, AI Tip, Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Transactions */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-darkSurface p-4 sm:p-6 rounded-lg shadow-lg transition-colors duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-3 sm:mb-0">{t('dashboard.recentActivity')}</h2>
                    <Button onClick={() => setIsModalOpen(true)} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>}>
                    {t('dashboard.addTransactionButton')}
                    </Button>
                </div>
                <TransactionList 
                    transactions={filteredTransactions} 
                    onDelete={handleDeleteTransaction} 
                    isFiltered={isCurrentlyFiltered}
                    hasOriginalTransactions={allTransactions.length > 0}
                />
            </div>

            {/* Budgets Section */}
            <div className="bg-white dark:bg-darkSurface p-4 sm:p-6 rounded-lg shadow-lg transition-colors duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <div className="flex items-center mb-3 sm:mb-0">
                        <BanknotesIcon className="w-7 h-7 text-primary dark:text-primary-light mr-2"/>
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200">
                          {t('dashboard.budgets.title')}
                        </h2>
                    </div>
                    <Button onClick={() => handleOpenBudgetModal()} variant="primary" size="sm" leftIcon={<PlusIcon className="w-4 h-4"/>}>
                        {t('dashboard.budgets.addBudgetButton')}
                    </Button>
                </div>
                 <div className="flex items-center justify-center space-x-2 mb-4">
                    <Button onClick={() => handleMonthChange(-1)} size="sm" variant="ghost" aria-label={t('dashboard.budgets.previousMonth')}>&lt;</Button>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{displayMonthYear}</span>
                    <Button onClick={() => handleMonthChange(1)} size="sm" variant="ghost" aria-label={t('dashboard.budgets.nextMonth')}>&gt;</Button>
                </div>
                {isLoadingBudgets ? (
                    <div className="flex justify-center items-center py-8"> <Spinner size="md" /> </div>
                ) : (
                    <BudgetList
                        budgets={budgetsWithSpent}
                        onEdit={handleOpenBudgetModal}
                        onDelete={handleDeleteBudget}
                    />
                )}
            </div>
        </div>

        {/* Right Column: Pie Chart & AI Tip */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-darkSurface p-6 rounded-lg shadow-lg transition-colors duration-300">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('dashboard.expenseBreakdownTitle')}</h3>
            {expensePieChartData.length > 0 ? (
              <CategoryPieChart data={expensePieChartData} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                { isCurrentlyFiltered ? t('transactionList.noFilteredTransactions') : t('dashboard.noExpensesForChart') }
              </p>
            )}
          </div>
          <AiFinancialTip balance={balance} recentTransactionsCount={filteredTransactions.length} />
        </div>
      </div>


      <Modal title={t('transactionForm.modalTitle')} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <TransactionForm onSubmit={handleAddTransaction} />
      </Modal>
      
      <Modal 
        title={editingBudget ? t('dashboard.budgets.editBudgetModalTitle') : t('dashboard.budgets.addBudgetModalTitle')} 
        isOpen={isBudgetModalOpen} 
        onClose={() => { setIsBudgetModalOpen(false); setEditingBudget(null); }} 
        size="md"
      >
        <BudgetForm 
          onSubmit={handleSaveBudget} 
          initialData={editingBudget || undefined} 
          existingBudgetsForMonth={budgets}
          availableCategories={allExpenseCategoriesForBudget}
          currentMonthYear={currentMonthYear}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
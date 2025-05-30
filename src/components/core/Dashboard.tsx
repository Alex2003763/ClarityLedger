
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

// Icons
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-plus ${className || "w-4 h-4"}`}></i>
);

const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-filter ${className || "w-4 h-4"}`}></i>
);

const ArrowPathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-sync-alt ${className || "w-4 h-4"}`}></i>
);

const TagIconSolid: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-tag ${className || "w-4 h-4"}`}></i>
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

const Dashboard: React.FC = () => {
  const { t, language } = useAppContext();
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
    setIsFiltersVisible(false);
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
      const matchesKeyword = activeFilters.keyword ? transaction.description.toLowerCase().includes(keywordLower) || transaction.category.toLowerCase().includes(keywordLower) : true;
      const matchesType = activeFilters.type === 'ALL' || transaction.type === activeFilters.type;
      const dateObj = new Date(transaction.date + 'T00:00:00'); 
      const startDateObj = activeFilters.startDate ? new Date(activeFilters.startDate + 'T00:00:00') : null;
      const endDateObj = activeFilters.endDate ? new Date(activeFilters.endDate + 'T23:59:59') : null;

      const matchesDate = 
        (!startDateObj || dateObj >= startDateObj) &&
        (!endDateObj || dateObj <= endDateObj);
      const matchesMinAmount = activeFilters.minAmount ? transaction.amount >= parseFloat(activeFilters.minAmount) : true;
      const matchesMaxAmount = activeFilters.maxAmount ? transaction.amount <= parseFloat(activeFilters.maxAmount) : true;
      const matchesTag = activeFilters.tag ? transaction.tags?.map(tg => tg.toLowerCase()).includes(activeFilters.tag.toLowerCase()) : true;

      return matchesKeyword && matchesType && matchesDate && matchesMinAmount && matchesMaxAmount && matchesTag;
    });
  }, [allTransactions, activeFilters]);

  const isFiltered = useMemo(() => JSON.stringify(activeFilters) !== JSON.stringify(initialFilterCriteria) , [activeFilters]);

  const { income, expenses, balance } = useMemo(() => {
    let currentIncome = 0;
    let currentExpenses = 0;
    // Use ALL transactions for summary, not just filtered ones, for overall financial picture.
    // Or use filteredTransactions if summary should reflect filtered data. For FinTrack, summary usually reflects overall.
    // Let's use allTransactions for the main summary cards.
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
    // Pie chart should reflect filtered data if filters are active
    const sourceTransactions = isFiltered ? filteredTransactions : allTransactions;
    sourceTransactions
      .filter(transaction => transaction.type === TransactionType.EXPENSE)
      .forEach(transaction => {
        const categoryKey = `categories.${transaction.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
        const translatedCategory = t(categoryKey) === categoryKey ? transaction.category : t(categoryKey);
        expenseCategoriesMap[translatedCategory] = (expenseCategoriesMap[translatedCategory] || 0) + transaction.amount;
      });
    return Object.entries(expenseCategoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredTransactions, allTransactions, isFiltered, t]);
  
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
      <SummaryDisplay income={income} expenses={expenses} balance={balance} />

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
      
      {/* Filter and Transactions Section */}
      <div className="fintrack-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="fintrack-section-title mb-2 sm:mb-0">{t('dashboard.transactionsTitle')}</h2>
          <div className="flex space-x-3">
            <Button onClick={toggleFiltersVisibility} variant="secondary" size="sm" leftIcon={<FilterIcon/>} aria-expanded={isFiltersVisible}>
              {isFiltersVisible ? t('dashboard.filters.hide') : t('dashboard.filters.show')}
            </Button>
            <Button onClick={() => setIsTransactionModalOpen(true)} leftIcon={<PlusIcon />} variant="primary" size="sm">
              {t('dashboard.addTransactionButton')}
            </Button>
          </div>
        </div>

        {isFiltersVisible && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 border-t border-gray-200 dark:border-darkBorder pt-4 mt-4">
            <Input label={t('dashboard.filters.keywordLabel')} name="keyword" value={filterInputs.keyword} onChange={handleFilterInputChange} placeholder={t('dashboard.filters.keywordPlaceholder')} />
            <div>
                <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.filters.typeLabel')}</label>
                <select id="filter-type" name="type" value={filterInputs.type} onChange={handleFilterInputChange} >
                    <option value="ALL">{t('dashboard.filters.typeAll')}</option>
                    <option value={TransactionType.INCOME}>{t('dashboard.filters.typeIncome')}</option>
                    <option value={TransactionType.EXPENSE}>{t('dashboard.filters.typeExpense')}</option>
                </select>
            </div>
            <Input label={t('dashboard.filters.tagLabel')} name="tag" value={filterInputs.tag} onChange={handleFilterInputChange} placeholder={t('dashboard.filters.tagPlaceholder')} leftIcon={<TagIconSolid className="w-4 h-4 text-gray-400 dark:text-gray-500"/>} />
            <Input label={t('dashboard.filters.startDateLabel')} name="startDate" type="date" value={filterInputs.startDate} onChange={handleFilterInputChange} />
            <Input label={t('dashboard.filters.endDateLabel')} name="endDate" type="date" value={filterInputs.endDate} onChange={handleFilterInputChange} />
            <Input label={t('dashboard.filters.minAmountLabel')} name="minAmount" type="number" value={filterInputs.minAmount} onChange={handleFilterInputChange} placeholder="0.00"/>
            <Input label={t('dashboard.filters.maxAmountLabel')} name="maxAmount" type="number" value={filterInputs.maxAmount} onChange={handleFilterInputChange} placeholder="1000.00"/>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end space-x-3 mt-2">
                <Button onClick={handleResetFilters} variant="ghost" size="sm" leftIcon={<ArrowPathIcon />}>{t('dashboard.filters.resetButton')}</Button>
                <Button onClick={handleApplyFilters} variant="primary" size="sm">{t('dashboard.filters.applyButton')}</Button>
            </div>
          </div>
        )}
        <TransactionList 
          transactions={filteredTransactions} 
          onDelete={handleDeleteTransaction} 
          isFiltered={isFiltered}
          hasOriginalTransactions={allTransactions.length > 0}
        />
      </div>

      <section aria-labelledby="ai-tip-heading" className="fintrack-card">
        <AiFinancialTip balance={balance} recentTransactionsCount={filteredTransactions.length} />
      </section>

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
          existingBudgetsForMonth={budgets.filter(b => b.monthYear === (editingBudget?.monthYear || currentMonthYear) && b.id !== editingBudget?.id )}
          availableCategories={allExpenseCategoriesForBudget}
          currentMonthYear={editingBudget?.monthYear || currentMonthYear}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;

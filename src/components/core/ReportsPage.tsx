
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getTransactions } from '../../services/transactionService';
import { Transaction, TransactionType } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SpendingByCategoryChart from '../visualizations/SpendingByCategoryChart';
import TopExpenseCategoriesChart from '../visualizations/TopExpenseCategoriesChart';

interface MonthlyCategorySpending {
  month: string; // e.g., "Jan '23"
  [category: string]: number | string; // categoryName: amount
}

interface TopCategoryData {
  name: string;
  value: number;
}

type ReportTab = 'trend' | 'topCategories';

const getDefaultDateRange = (): { start: string, end: string } => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start: firstDayOfMonth, end: lastDayOfMonth };
};

const ReportsPage: React.FC = () => {
  const { t, language } = useAppContext();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const defaultRange = getDefaultDateRange();
  const [filterStartDate, setFilterStartDate] = useState<string>(defaultRange.start);
  const [filterEndDate, setFilterEndDate] = useState<string>(defaultRange.end);
  const [activeReportRange, setActiveReportRange] = useState<{start: string, end: string}>(defaultRange);
  const [activeTab, setActiveTab] = useState<ReportTab>('trend');

  useEffect(() => {
    setIsLoading(true);
    const transactions = getTransactions();
    setAllTransactions(transactions);
    setIsLoading(false);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setActiveReportRange({ start: filterStartDate, end: filterEndDate });
  }, [filterStartDate, filterEndDate]);


  const filteredTransactionsForReports = useMemo(() => {
    return allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        const startDate = new Date(activeReportRange.start);
        const endDate = new Date(activeReportRange.end);
        endDate.setHours(23, 59, 59, 999); 
        return txDate >= startDate && txDate <= endDate;
    });
  }, [allTransactions, activeReportRange]);

  const { spendingByCategoryChartData, spendingCategories } = useMemo(() => {
    const expenseTransactions = filteredTransactionsForReports.filter(tx => tx.type === TransactionType.EXPENSE);
    if (expenseTransactions.length === 0) {
      return { spendingByCategoryChartData: [], spendingCategories: [] };
    }

    const monthlyDataMap: { [monthYear: string]: { [category: string]: number } } = {};
    const uniqueCategories = new Set<string>();
    
    const startDate = new Date(activeReportRange.start);
    const endDate = new Date(activeReportRange.end);
    
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while(currentDate <= endDate) {
        const monthDisplay = currentDate.toLocaleDateString(language, { month: 'short', year: '2-digit' });
        monthlyDataMap[monthDisplay] = {}; 

        currentDate.setMonth(currentDate.getMonth() + 1);
    }


    expenseTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const monthDisplay = txDate.toLocaleDateString(language, { month: 'short', year: '2-digit' });
      
      if (monthlyDataMap[monthDisplay]) { 
          const categoryKey = `categories.${tx.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
          const translatedCategory = t(categoryKey) === categoryKey ? tx.category : t(categoryKey);
          
          monthlyDataMap[monthDisplay][translatedCategory] = (monthlyDataMap[monthDisplay][translatedCategory] || 0) + tx.amount;
          uniqueCategories.add(translatedCategory);
      }
    });
    
    const sortedCategories = Array.from(uniqueCategories).sort((a,b) => a.localeCompare(b));

    const finalChartData: MonthlyCategorySpending[] = Object.entries(monthlyDataMap).map(([month, categorySpends]) => {
      const monthEntry: MonthlyCategorySpending = { month };
      sortedCategories.forEach(cat => {
        monthEntry[cat] = categorySpends[cat] || 0;
      });
      return monthEntry;
    }).sort((a, b) => { 
        const parseMonthYear = (myStr: string) => {
            const parts = myStr.split(' ');
            const monthName = parts[0];
            const year = parseInt(`20${parts[1].substring(1)}`, 10);
            const date = new Date(`${monthName} 1, ${year}`);
            return date.getTime();
        };
        return parseMonthYear(a.month) - parseMonthYear(b.month);
    });

    return { spendingByCategoryChartData: finalChartData, spendingCategories: sortedCategories };
  }, [filteredTransactionsForReports, t, language, activeReportRange]);

  const topExpenseCategoriesData = useMemo((): TopCategoryData[] => {
    const expenseTransactions = filteredTransactionsForReports.filter(tx => tx.type === TransactionType.EXPENSE);
    if (expenseTransactions.length === 0) return [];

    const categoryTotals: { [key: string]: number } = {};
    expenseTransactions.forEach(tx => {
      const categoryKey = `categories.${tx.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
      const translatedCategory = t(categoryKey) === categoryKey ? tx.category : t(categoryKey);
      categoryTotals[translatedCategory] = (categoryTotals[translatedCategory] || 0) + tx.amount;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); 
  }, [filteredTransactionsForReports, t]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Spinner size="lg" color="text-primary" />
      </div>
    );
  }

  const renderTabButton = (tabId: ReportTab, labelKey: string, defaultLabel: string) => (
    <button
      role="tab"
      aria-selected={activeTab === tabId}
      aria-controls={`${tabId}-panel`}
      id={`${tabId}-tab`}
      onClick={() => setActiveTab(tabId)}
      className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primaryLight/50 rounded-t-md
        ${activeTab === tabId
          ? 'border-primary text-primary dark:border-primaryLight dark:text-primaryLight bg-primary/5 dark:bg-primaryLight/10'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
        }`}
    >
      {t(labelKey, { defaultValue: defaultLabel })}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <section className="fintrack-card">
        <h2 className="fintrack-section-title mb-4">{t('reportsPage.filters.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label={t('reportsPage.filters.startDateLabel')}
            id="report-startDate"
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            containerClassName="!mb-0"
            className="dark:[color-scheme:dark]"
          />
          <Input
            label={t('reportsPage.filters.endDateLabel')}
            id="report-endDate"
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            containerClassName="!mb-0"
            className="dark:[color-scheme:dark]"
          />
          <Button onClick={handleApplyFilters} variant="primary" className="h-11 md:mt-auto">
            {t('reportsPage.filters.applyButton')}
          </Button>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="mb-0"> {/* Adjusted margin */}
        <div className="border-b border-gray-200 dark:border-darkBorder">
          <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label={t('reportsPage.tabs.ariaLabel', {defaultValue: "Report Tabs"})}>
            {renderTabButton('trend', 'reportsPage.tabs.spendingTrend', 'Spending Trend')}
            {renderTabButton('topCategories', 'reportsPage.tabs.topCategories', 'Top Categories')}
          </nav>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-0"> {/* Adjusted margin if needed, or remove if tabs are directly above content */}
        <div role="tabpanel" hidden={activeTab !== 'trend'} id="trend-panel" aria-labelledby="trend-tab">
          {activeTab === 'trend' && (
            <div className="fintrack-card mt-6 sm:mt-8"> {/* Added margin-top to card for spacing */}
              <h2 className="fintrack-section-title mb-6">{t('reportsPage.spendingByCategoryChart.title')}</h2>
              <SpendingByCategoryChart data={spendingByCategoryChartData} categories={spendingCategories} />
            </div>
          )}
        </div>
        <div role="tabpanel" hidden={activeTab !== 'topCategories'} id="topCategories-panel" aria-labelledby="topCategories-tab">
          {activeTab === 'topCategories' && (
            <div className="fintrack-card mt-6 sm:mt-8"> {/* Added margin-top to card for spacing */}
              <h2 className="fintrack-section-title mb-6">{t('reportsPage.topExpenseCategoriesChart.title')}</h2>
              <TopExpenseCategoriesChart data={topExpenseCategoriesData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getTransactions } from '../../services/transactionService';
import { Transaction, TransactionType } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SpendingByCategoryChart from '../visualizations/SpendingByCategoryChart';
import TopExpenseCategoriesChart from '../visualizations/TopExpenseCategoriesChart'; // New chart

interface MonthlyCategorySpending {
  month: string; // e.g., "Jan '23"
  [category: string]: number | string; // categoryName: amount
}

interface TopCategoryData {
  name: string;
  value: number;
}

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
        // Adjust end date to include the entire day
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
    
    // Iterate through each month in the selected range
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while(currentDate <= endDate) {
        const monthYearKey = currentDate.toISOString().slice(0, 7); // YYYY-MM
        const monthDisplay = currentDate.toLocaleDateString(language, { month: 'short', year: '2-digit' });
        monthlyDataMap[monthDisplay] = {}; // Initialize month entry

        currentDate.setMonth(currentDate.getMonth() + 1);
    }


    expenseTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const monthDisplay = txDate.toLocaleDateString(language, { month: 'short', year: '2-digit' });
      
      if (monthlyDataMap[monthDisplay]) { // Ensure month is within our processed range
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
        // Custom sort for "Mon 'YY" format
        const parseMonthYear = (myStr: string) => {
            const parts = myStr.split(' ');
            const monthName = parts[0];
            const year = parseInt(`20${parts[1].substring(1)}`, 10); // Convert '23 to 2023
            // Create a date object for comparison (day doesn't matter here)
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
      .slice(0, 10); // Top 10 categories
  }, [filteredTransactionsForReports, t]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Spinner size="lg" color="text-primary" />
      </div>
    );
  }

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

      {/* Spending by Category Over Time Chart */}
      <div className="fintrack-card">
        <h2 className="fintrack-section-title mb-6">{t('reportsPage.spendingByCategoryChart.title')}</h2>
        <SpendingByCategoryChart data={spendingByCategoryChartData} categories={spendingCategories} />
      </div>
      
      {/* Top Expense Categories Chart */}
      <div className="fintrack-card">
        <h2 className="fintrack-section-title mb-6">{t('reportsPage.topExpenseCategoriesChart.title')}</h2>
        <TopExpenseCategoriesChart data={topExpenseCategoriesData} />
      </div>
    </div>
  );
};

export default ReportsPage;

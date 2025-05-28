import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface SummaryDisplayProps {
  income: number;
  expenses: number;
  balance: number;
}

const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);
const ArrowDownIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.306-4.306a11.95 11.95 0 0 1 5.814 5.518l2.74 1.22m0 0-5.94 2.281m5.94-2.28L15.75 15M21.75 6v6h-6" />
  </svg>
);

const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6.082A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.082V12m18 0A2.25 2.25 0 0 0 18.75 9.75H5.25A2.25 2.25 0 0 0 3 12m0-4.5h18A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25" />
  </svg>
);


const SummaryCard: React.FC<{ title: string; amount: number; colorClass: string; icon: React.ReactNode; formatCurrency: (amount: number) => string; }> = ({ title, amount, colorClass, icon, formatCurrency }) => (
  <div className="bg-white dark:bg-darkSurface p-6 rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-primary/20 transition-all duration-300">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{title}</h3>
      <div className={`p-2 rounded-full ${colorClass.replace('text-', 'bg-').replace('-600', '-100 dark:bg-opacity-20').replace('-500', '-100 dark:bg-opacity-20')}`}>
        {icon}
      </div>
    </div>
    <p className={`text-3xl font-bold ${colorClass}`}>{formatCurrency(amount)}</p>
  </div>
);

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ income, expenses, balance }) => {
  const { t, formatCurrency } = useAppContext();
  const balanceColor = balance >= 0 ? 'text-primary dark:text-primary-light' : 'text-danger dark:text-red-400';
  const incomeColor = 'text-green-500 dark:text-green-400';
  const expenseColor = 'text-red-500 dark:text-red-400';


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
      <SummaryCard title={t('summaryDisplay.totalIncome')} amount={income} colorClass={incomeColor} icon={<ArrowUpIcon className={`w-5 h-5 ${incomeColor}`}/>} formatCurrency={formatCurrency} />
      <SummaryCard title={t('summaryDisplay.totalExpenses')} amount={expenses} colorClass={expenseColor} icon={<ArrowDownIcon className={`w-5 h-5 ${expenseColor}`}/>} formatCurrency={formatCurrency} />
      <SummaryCard title={t('summaryDisplay.currentBalance')} amount={balance} colorClass={balanceColor} icon={<WalletIcon className={`w-5 h-5 ${balanceColor}`}/>} formatCurrency={formatCurrency} />
    </div>
  );
};

export default SummaryDisplay;
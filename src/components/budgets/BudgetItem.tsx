
import React from 'react';
import { Budget } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Button from '../ui/Button';

interface BudgetItemProps {
  budget: Budget & { spentAmount: number };
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
}

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const TrashIconSmall: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.34-.059.678-.112 1.017-.165m11.543 0a48.297 48.297 0 01-3.478-.397m-12.56 0a48.297 48.297 0 00-3.478-.397M9.75 4.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v.75H9.75v-.75Z" />
  </svg>
);


const BudgetItem: React.FC<BudgetItemProps> = ({ budget, onEdit, onDelete }) => {
  const { t, formatCurrency } = useAppContext();

  const { category, targetAmount, spentAmount } = budget;
  const remainingAmount = targetAmount - spentAmount;
  const progressPercent = targetAmount > 0 ? Math.min((spentAmount / targetAmount) * 100, 100) : 0;
  const overspent = spentAmount > targetAmount;

  const categoryKey = `categories.${category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
  const translatedCategory = t(categoryKey) === categoryKey ? category : t(categoryKey);

  let progressBarColor = 'bg-primary dark:bg-primary-light';
  if (progressPercent > 85 && !overspent) progressBarColor = 'bg-yellow-500 dark:bg-yellow-400';
  if (overspent) progressBarColor = 'bg-danger dark:bg-red-400';


  return (
    <li className="py-3 px-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{translatedCategory}</span>
        <div className="space-x-2">
          <Button onClick={() => onEdit(budget)} variant="ghost" size="sm" className="p-1 text-gray-500 hover:text-primary dark:hover:text-primary-light" aria-label={t('dashboard.budgets.editButtonAriaLabel', { category: translatedCategory })}>
            <EditIcon />
          </Button>
          <Button onClick={() => onDelete(budget.id)} variant="ghost" size="sm" className="p-1 text-gray-500 hover:text-danger dark:hover:text-red-400" aria-label={t('dashboard.budgets.deleteButtonAriaLabel', { category: translatedCategory })}>
            <TrashIconSmall />
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        {t('dashboard.budgets.spent')} {formatCurrency(spentAmount)} / {formatCurrency(targetAmount)}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
        <div 
          className={`h-2.5 rounded-full ${progressBarColor} transition-all duration-500 ease-out`} 
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${translatedCategory} budget progress ${progressPercent.toFixed(0)}%`}
        ></div>
      </div>
      <div className={`text-xs ${overspent ? 'text-danger dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
        {overspent 
          ? `${t('dashboard.budgets.overspentBy')} ${formatCurrency(Math.abs(remainingAmount))}`
          : `${t('dashboard.budgets.remaining')} ${formatCurrency(remainingAmount)}`}
      </div>
    </li>
  );
};

export default BudgetItem;

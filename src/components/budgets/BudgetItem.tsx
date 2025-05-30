
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
  <i className={`fas fa-edit ${className || "w-3.5 h-3.5"}`}></i>
);

const TrashIconSmall: React.FC<{ className?: string }> = ({ className }) => (
  <i className={`fas fa-trash-alt ${className || "w-3.5 h-3.5"}`}></i>
);


const BudgetItem: React.FC<BudgetItemProps> = ({ budget, onEdit, onDelete }) => {
  const { t, formatCurrency } = useAppContext();

  const { category, targetAmount, spentAmount } = budget;
  const remainingAmount = targetAmount - spentAmount;
  const progressPercent = targetAmount > 0 ? Math.min((spentAmount / targetAmount) * 100, 100) : 0;
  const overspent = spentAmount > targetAmount;

  const categoryKey = `categories.${category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
  const translatedCategory = t(categoryKey) === categoryKey ? category : t(categoryKey);

  let progressBarColor = 'bg-primary dark:bg-primaryLight';
  let progressTextColor = 'text-primary dark:text-primaryLight';
  if (progressPercent >= 80 && progressPercent < 100 && !overspent) { // Adjusted threshold for warning
    progressBarColor = 'bg-warning dark:bg-yellow-400';
    progressTextColor = 'text-warning dark:text-yellow-400';
  }
  if (overspent) {
    progressBarColor = 'bg-danger dark:bg-red-400';
    progressTextColor = 'text-danger dark:text-red-400';
  }


  return (
    <li className="py-3 group">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-lighttext dark:text-darktext">{translatedCategory}</span>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button 
            onClick={() => onEdit(budget)} 
            variant="ghost" 
            size="sm" 
            className="text-grayText hover:text-primary dark:hover:text-primaryLight p-1" 
            aria-label={t('dashboard.budgets.editButtonAriaLabel', { category: translatedCategory })}
          >
            <EditIcon />
          </Button>
          <Button 
            onClick={() => onDelete(budget.id)} 
            variant="ghost" 
            size="sm" 
            className="text-grayText hover:text-danger dark:hover:text-red-400 p-1" 
            aria-label={t('dashboard.budgets.deleteButtonAriaLabel', { category: translatedCategory })}
          >
            <TrashIconSmall />
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-baseline text-xs text-grayText dark:text-gray-400 mb-1">
        <span>{t('dashboard.budgets.spent')}: <span className="font-medium text-lighttext dark:text-darktext">{formatCurrency(spentAmount)}</span></span>
        <span>Target: {formatCurrency(targetAmount)}</span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mb-1 relative overflow-hidden">
        <div 
          className={`h-full rounded-full ${progressBarColor} transition-all duration-500 ease-out`} 
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${translatedCategory} budget progress ${progressPercent.toFixed(0)}%`}
        >
        </div>
      </div>

      <div className={`text-xs font-medium ${progressTextColor}`}>
        {overspent 
          ? `${t('dashboard.budgets.overspentBy')} ${formatCurrency(Math.abs(remainingAmount))}`
          : `${t('dashboard.budgets.remaining')} ${formatCurrency(remainingAmount)}`}
      </div>
    </li>
  );
};

export default BudgetItem;
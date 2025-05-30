
import React from 'react';
import { Budget } from '../../types';
import BudgetItem from './BudgetItem';
import { useAppContext } from '../../contexts/AppContext';

interface BudgetListProps {
  budgets: (Budget & { spentAmount: number })[];
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
}

const BudgetList: React.FC<BudgetListProps> = ({ budgets, onEdit, onDelete }) => {
  const { t } = useAppContext();

  if (budgets.length === 0) {
    return <p className="text-center text-grayText dark:text-gray-400 py-8 text-sm">{t('dashboard.budgets.noBudgetsSet')}</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-darkBorder/70 max-h-[300px] sm:max-h-[350px] overflow-y-auto pr-1 space-y-1">
      {budgets.map(budget => (
        <BudgetItem 
          key={budget.id} 
          budget={budget} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      ))}
    </ul>
  );
};

export default BudgetList;
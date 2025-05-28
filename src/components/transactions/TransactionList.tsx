import React from 'react';
import { Transaction, TransactionType } from '../../types';
import Button from '../ui/Button';
import { useAppContext } from '../../contexts/AppContext';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  isFiltered: boolean; 
  hasOriginalTransactions: boolean; 
}

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.34-.059.678-.112 1.017-.165m11.543 0a48.297 48.297 0 01-3.478-.397m-12.56 0a48.297 48.297 0 00-3.478-.397M9.75 4.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v.75H9.75v-.75Z" />
  </svg>
);

const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-3 h-3"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
  </svg>
);


const TransactionItem: React.FC<{ transaction: Transaction; onDelete: (id: string) => void; }> = ({ transaction, onDelete }) => {
  const { t, language, formatCurrency } = useAppContext();
  const isIncome = transaction.type === TransactionType.INCOME;
  const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const sign = isIncome ? '+' : '-';
  
  const categoryKey = `categories.${transaction.category.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
  const translatedCategory = t(categoryKey) === categoryKey ? transaction.category : t(categoryKey);


  return (
    <li className="flex items-start sm:items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/[0.5] transition-colors duration-150 rounded-md flex-col sm:flex-row">
      <div className="flex items-start w-full sm:w-auto">
        <div className={`w-3 h-3 rounded-full mr-3 mt-1.5 ${isIncome ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`}></div>
        <div className="flex-grow">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{transaction.description}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {translatedCategory} · {new Date(transaction.date).toLocaleDateString(language)}
          </p>
          {transaction.tags && transaction.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {transaction.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-200 rounded-full flex items-center">
                  <TagIcon className="w-3 h-3 mr-1 opacity-70" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-3 mt-2 sm:mt-0 self-end sm:self-center">
        <span className={`text-sm font-semibold ${amountColor}`}>
          {sign}{formatCurrency(transaction.amount)}
        </span>
        <Button onClick={() => onDelete(transaction.id)} variant="ghost" size="sm" className="text-gray-400 dark:text-gray-500 hover:text-danger dark:hover:text-red-400 p-1">
           <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
    </li>
  );
};


const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, isFiltered, hasOriginalTransactions }) => {
  const { t } = useAppContext();

  if (transactions.length === 0) {
    let message = t('transactionList.noTransactions');
    if (isFiltered && hasOriginalTransactions) {
      message = t('transactionList.noFilteredTransactions');
    } else if (!hasOriginalTransactions) {
      message = t('transactionList.noTransactions');
    }
    return <p className="text-center text-gray-500 dark:text-gray-400 py-10">{message}</p>;
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-darkBorder max-h-[500px] overflow-y-auto pr-2">
      {transactions.map(transaction => (
        <TransactionItem key={transaction.id} transaction={transaction} onDelete={onDelete} />
      ))}
    </ul>
  );
};

export default TransactionList;
import { Transaction } from '../types';
import { LOCAL_STORAGE_TRANSACTIONS_PREFIX, DEFAULT_USER_ID } from '../constants';

const getStorageKey = (): string => `${LOCAL_STORAGE_TRANSACTIONS_PREFIX}${DEFAULT_USER_ID}`;

export const getTransactions = (): Transaction[] => {
  const storedTransactions = localStorage.getItem(getStorageKey());
  return storedTransactions ? JSON.parse(storedTransactions) : [];
};

export const saveTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(getStorageKey(), JSON.stringify(transactions));
};

export const addTransaction = (transaction: Omit<Transaction, 'id' | 'userId'>): Transaction => {
  const transactions = getTransactions();
  const newTransaction: Transaction = {
    ...transaction,
    id: new Date().toISOString() + Math.random().toString(36).substring(2, 9),
    userId: DEFAULT_USER_ID, // Always use the default user ID
  };
  const updatedTransactions = [...transactions, newTransaction];
  saveTransactions(updatedTransactions);
  return newTransaction;
};

export const deleteTransaction = (transactionId: string): void => {
  const transactions = getTransactions();
  const updatedTransactions = transactions.filter(t => t.id !== transactionId);
  saveTransactions(updatedTransactions);
};

export const updateTransaction = (updatedTransaction: Transaction): void => {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === updatedTransaction.id);
  if (index !== -1) {
    transactions[index] = updatedTransaction;
    // Ensure userId is consistent if it was part of the update
    transactions[index].userId = DEFAULT_USER_ID; 
    saveTransactions(transactions);
  }
};

import { Budget } from '../types';
import { LOCAL_STORAGE_BUDGETS_KEY, DEFAULT_USER_ID } from '../constants';

const getStorageKey = (): string => `${LOCAL_STORAGE_BUDGETS_KEY}_${DEFAULT_USER_ID}`;

export const getAllBudgets = (): Budget[] => {
  const storedBudgets = localStorage.getItem(getStorageKey());
  return storedBudgets ? JSON.parse(storedBudgets) : [];
};

export const saveAllBudgets = (budgets: Budget[]): void => {
  localStorage.setItem(getStorageKey(), JSON.stringify(budgets));
};

export const getBudgetsForMonth = (monthYear: string): Budget[] => {
  const allBudgets = getAllBudgets();
  return allBudgets.filter(budget => budget.monthYear === monthYear);
};

export const addBudget = (budgetData: Omit<Budget, 'id' | 'userId'>): Budget => {
  const allBudgets = getAllBudgets();
  const newBudget: Budget = {
    ...budgetData,
    id: new Date().toISOString() + Math.random().toString(36).substring(2, 9),
    userId: DEFAULT_USER_ID,
  };
  const updatedBudgets = [...allBudgets, newBudget];
  saveAllBudgets(updatedBudgets);
  return newBudget;
};

export const updateBudget = (updatedBudgetData: Budget): void => {
  let allBudgets = getAllBudgets();
  allBudgets = allBudgets.map(budget => 
    budget.id === updatedBudgetData.id ? { ...updatedBudgetData, userId: DEFAULT_USER_ID } : budget
  );
  saveAllBudgets(allBudgets);
};

export const deleteBudget = (budgetId: string): void => {
  let allBudgets = getAllBudgets();
  allBudgets = allBudgets.filter(budget => budget.id !== budgetId);
  saveAllBudgets(allBudgets);
};

export const getBudgetForCategoryAndMonth = (category: string, monthYear: string): Budget | undefined => {
  const budgetsForMonth = getBudgetsForMonth(monthYear);
  return budgetsForMonth.find(b => b.category === category);
};

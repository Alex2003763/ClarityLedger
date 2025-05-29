// src/services/budgetService.ts
import { Budget } from '../types';
import { LOCAL_STORAGE_BUDGETS_KEY, DEFAULT_USER_ID } from '../constants';

// Helper function to get all budgets for the current user from local storage
const getAllUserBudgetsInternal = (): Budget[] => {
  const storedData = localStorage.getItem(LOCAL_STORAGE_BUDGETS_KEY);
  if (storedData) {
    try {
      const allBudgets: Budget[] = JSON.parse(storedData);
      // Filter for the current user, though in this simple app, it's always DEFAULT_USER_ID
      return allBudgets.filter(budget => budget.userId === DEFAULT_USER_ID);
    } catch (e) {
      console.error("Error parsing budgets from local storage:", e);
      return [];
    }
  }
  return [];
};

// Helper function to save all budgets for the current user to local storage
const saveUserBudgetsInternal = (budgets: Budget[]): void => {
  try {
    // Ensure all budgets being saved are for the default user.
    const budgetsToSave = budgets.map(b => ({ ...b, userId: DEFAULT_USER_ID }));
    localStorage.setItem(LOCAL_STORAGE_BUDGETS_KEY, JSON.stringify(budgetsToSave));
  } catch (e) {
    console.error("Error saving budgets to local storage:", e);
  }
};

/**
 * Retrieves all budgets for a specific month (YYYY-MM).
 * @param monthYear The month and year string, e.g., "2023-10".
 * @returns An array of budgets for that month.
 */
export const getBudgetsForMonth = (monthYear: string): Budget[] => {
  const allBudgets = getAllUserBudgetsInternal();
  return allBudgets.filter(budget => budget.monthYear === monthYear);
};

/**
 * Adds a new budget.
 * @param budgetData The budget data to add (without id and userId).
 * @returns The newly added budget.
 */
export const addBudget = (budgetData: Omit<Budget, 'id' | 'userId'>): Budget => {
  const allBudgets = getAllUserBudgetsInternal();
  const newBudget: Budget = {
    ...budgetData,
    id: `budget_${new Date().toISOString()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: DEFAULT_USER_ID,
  };
  allBudgets.push(newBudget);
  saveUserBudgetsInternal(allBudgets);
  return newBudget;
};

/**
 * Updates an existing budget.
 * @param updatedBudget The budget with updated information.
 * @returns The updated budget or null if not found.
 */
export const updateBudget = (updatedBudget: Budget): Budget | null => {
  let allBudgets = getAllUserBudgetsInternal();
  const index = allBudgets.findIndex(budget => budget.id === updatedBudget.id && budget.userId === DEFAULT_USER_ID);
  if (index !== -1) {
    allBudgets[index] = updatedBudget;
    saveUserBudgetsInternal(allBudgets);
    return updatedBudget;
  }
  console.warn(`Budget with id ${updatedBudget.id} not found for update.`);
  return null;
};

/**
 * Deletes a budget by its ID.
 * @param budgetId The ID of the budget to delete.
 */
export const deleteBudget = (budgetId: string): void => {
  let allBudgets = getAllUserBudgetsInternal();
  const initialLength = allBudgets.length;
  const filteredBudgets = allBudgets.filter(budget => !(budget.id === budgetId && budget.userId === DEFAULT_USER_ID));
  if (filteredBudgets.length < initialLength) {
    saveUserBudgetsInternal(filteredBudgets);
  } else {
    console.warn(`Budget with id ${budgetId} not found for deletion.`);
  }
};


/**
 * Retrieves all budgets for the current user.
 * @returns An array of all budgets.
 */
export const getAllBudgets = (): Budget[] => {
  return getAllUserBudgetsInternal();
};

/**
 * Saves all budgets for the default user, overwriting existing ones.
 * @param budgetsToSave The array of budgets to save.
 */
export const saveAllUserBudgets = (budgetsToSave: Budget[]): void => {
  saveUserBudgetsInternal(budgetsToSave);
};

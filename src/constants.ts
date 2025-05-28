
import { CurrencyDefinition } from './types';

export const LOCAL_STORAGE_TRANSACTIONS_PREFIX = 'clarityCoinTransactions_';
export const LOCAL_STORAGE_OPENROUTER_API_KEY = 'clarityCoinOpenRouterApiKey';
export const DEFAULT_USER_ID = 'default_clarity_user';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food', 'Groceries', 'Transport', 'Utilities', 'Housing', 
  'Entertainment', 'Health', 'Shopping', 'Education', 'Travel', 'Other'
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary', 'Bonus', 'Investment', 'Gift', 'Other'
];

// Keys for custom categories
export const LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES = 'clarityCoinCustomIncomeCategories';
export const LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES = 'clarityCoinCustomExpenseCategories';

// Key for budgets
export const LOCAL_STORAGE_BUDGETS_KEY = 'clarityCoinBudgets';


export const LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL = 'clarityCoinSelectedOpenRouterModel';
export const DEFAULT_OPENROUTER_MODEL = 'deepseek/deepseek-chat:free';

// For AppContext
export const LOCAL_STORAGE_LANGUAGE_KEY = 'clarityCoinLanguage';
export const LOCAL_STORAGE_DARK_MODE_KEY = 'clarityCoinDarkMode';
export const LOCAL_STORAGE_SELECTED_CURRENCY_KEY = 'clarityCoinSelectedCurrency';

export type Language = 'en' | 'zh-TW';
export const DEFAULT_LANGUAGE: Language = 'en';

// Currency Settings
export const AVAILABLE_CURRENCIES: CurrencyDefinition[] = [
  { code: 'USD', symbol: '$', nameKey: 'currencies.USD' },
  { code: 'EUR', symbol: '€', nameKey: 'currencies.EUR' },
  { code: 'JPY', symbol: '¥', nameKey: 'currencies.JPY' },
  { code: 'GBP', symbol: '£', nameKey: 'currencies.GBP' },
  { code: 'AUD', symbol: 'A$', nameKey: 'currencies.AUD' },
  { code: 'CAD', symbol: 'C$', nameKey: 'currencies.CAD' },
  { code: 'CNY', symbol: '¥', nameKey: 'currencies.CNY' },
  { code: 'TWD', symbol: 'NT$', nameKey: 'currencies.TWD' },
  { code: 'HKD', symbol: 'HK$', nameKey: 'currencies.HKD' },
];

export const DEFAULT_CURRENCY_CODE = 'USD';


import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import {
  Language,
  DEFAULT_LANGUAGE,
  LOCAL_STORAGE_LANGUAGE_KEY,
  LOCAL_STORAGE_DARK_MODE_KEY,
  AVAILABLE_CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  LOCAL_STORAGE_SELECTED_CURRENCY_KEY
} from '../constants';
import { CurrencyDefinition } from '../types';

// Define the shape of the context data
interface AppContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  selectedCurrencyCode: string;
  setSelectedCurrencyCode: (code: string) => void;
  selectedCurrencySymbol: string;
  formatCurrency: (amount: number) => string;
  isTranslationsLoading: boolean;
}

// Create the context with a default undefined value
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Define translations type
type Translations = Record<string, string | Record<string, any>>;

// Basic fallback translations for offline use
const FALLBACK_TRANSLATIONS: Record<Language, Translations> = {
  'en': {
    appName: 'ClarityLedger',
    footer: '© {year} ClarityLedger. Manage your finances with clarity.',
    navbar: {
      dashboard: 'Dashboard',
      settings: 'Settings',
      transactions: 'Transactions',
      reports: 'Reports',
      billScan: 'Scan Bill',
      recurring: 'Recurring'
    },
    sidebar: {
      helpCenter: 'Help Center'
    },
    topbar: {
      welcomeMessage: 'Manage Your Finances',
      openSidebar: 'Open sidebar',
      closeSidebar: 'Close sidebar'
    },
    dashboard: {
      loading: 'Loading dashboard data...',
      transactionsTitle: 'Transactions',
      addTransactionButton: 'Add Transaction',
      expenseBreakdownTitle: 'Expense Breakdown',
      noExpensesForChart: 'No expenses recorded yet to show a chart.',
      noTransactions: 'No transactions yet. Add one to get started!',
      confirmDeleteTransaction: 'Are you sure you want to delete this transaction?',
      budgets: {
        title: 'Monthly Budgets',
        addBudgetButton: 'Add Budget',
        noBudgetsSet: 'No budgets set for this month. Click Add Budget to create one.'
      },
      addTransactionModalTitle: 'Add New Transaction'
    },
    settingsPage: {
      title: 'Settings',
      languageLabel: 'Language',
      darkModeLabel: 'Dark Mode',
      english: 'English',
      traditionalChinese: '繁體中文',
      switchToLightMode: 'Switch to Light Mode',
      switchToDarkMode: 'Switch to Dark Mode'
    },
    transactionForm: {
      modalTitle: 'Add New Transaction',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'e.g., Groceries, Salary',
      amountLabel: 'Amount',
      amountPlaceholder: '0.00',
      typeLabel: 'Type',
      expenseButton: 'Expense',
      incomeButton: 'Income',
      categoryLabel: 'Category',
      selectCategoryPlaceholder: 'Select a category...',
      dateLabel: 'Date',
      submitAddButton: 'Add Transaction',
      submitUpdateButton: 'Update Transaction'
    },
    transactionTable: {
      category: 'Category',
      description: 'Description',
      date: 'Date',
      amount: 'Amount',
      actions: 'Actions'
    },
    categories: {
      Food: 'Food',
      Groceries: 'Groceries',
      Transport: 'Transport',
      Utilities: 'Utilities',
      Housing: 'Housing',
      Entertainment: 'Entertainment',
      Health: 'Health',
      Shopping: 'Shopping',
      Education: 'Education',
      Travel: 'Travel',
      Other: 'Other',
      Salary: 'Salary',
      Bonus: 'Bonus',
      Investment: 'Investment',
      Gift: 'Gift'
    }
  },
  'zh-TW': {
    appName: 'ClarityLedger',
    footer: '© {year} ClarityLedger。清晰管理您的財務。',
    navbar: {
      dashboard: '儀表板',
      settings: '設定',
      transactions: '交易紀錄',
      reports: '報告',
      billScan: '掃描帳單',
      recurring: '週期性交易'
    },
    sidebar: {
      helpCenter: '幫助中心'
    },
    topbar: {
      welcomeMessage: '管理您的財務',
      openSidebar: '開啟側邊欄',
      closeSidebar: '關閉側邊欄'
    },
    dashboard: {
      loading: '正在載入儀表板資料...',
      transactionsTitle: '交易記錄',
      addTransactionButton: '新增交易',
      expenseBreakdownTitle: '支出分析',
      noExpensesForChart: '尚無支出記錄可顯示圖表。',
      noTransactions: '尚無交易記錄。新增一筆開始吧！',
      confirmDeleteTransaction: '您確定要刪除此交易嗎？',
      budgets: {
        title: '每月預算',
        addBudgetButton: '新增預算',
        noBudgetsSet: '本月尚未設定預算。點擊新增預算以建立。'
      },
      addTransactionModalTitle: '新增交易'
    },
    settingsPage: {
      title: '設定',
      languageLabel: '語言',
      darkModeLabel: '深色模式',
      english: 'English',
      traditionalChinese: '繁體中文',
      switchToLightMode: '切換到淺色模式',
      switchToDarkMode: '切換到深色模式'
    },
    transactionForm: {
      modalTitle: '新增交易',
      descriptionLabel: '描述',
      descriptionPlaceholder: '例如：雜貨、薪水',
      amountLabel: '金額',
      amountPlaceholder: '0.00',
      typeLabel: '類型',
      expenseButton: '支出',
      incomeButton: '收入',
      categoryLabel: '類別',
      selectCategoryPlaceholder: '選擇一個類別...',
      dateLabel: '日期',
      submitAddButton: '新增交易',
      submitUpdateButton: '更新交易'
    },
    transactionTable: {
      category: '類別',
      description: '描述',
      date: '日期',
      amount: '金額',
      actions: '動作'
    },
    categories: {
      Food: '食物',
      Groceries: '雜貨',
      Transport: '交通',
      Utilities: '水電瓦斯',
      Housing: '住房',
      Entertainment: '娛樂',
      Health: '健康',
      Shopping: '購物',
      Education: '教育',
      Travel: '旅遊',
      Other: '其他',
      Salary: '薪水',
      Bonus: '獎金',
      Investment: '投資',
      Gift: '禮物'
    }
  }
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [language, setCurrentLanguage] = useState<Language>(() => {
    const storedLang = localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY);
    return (storedLang ? storedLang : DEFAULT_LANGUAGE) as Language;
  });

  const [isDarkMode, setCurrentDarkMode] = useState<boolean>(() => {
    const storedDarkMode = localStorage.getItem(LOCAL_STORAGE_DARK_MODE_KEY);
    if (storedDarkMode !== null) {
      return storedDarkMode === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [translations, setTranslations] = useState<Translations>({});
  const [isTranslationsLoading, setIsTranslationsLoading] = useState<boolean>(true);

  const [selectedCurrencyCode, setSelectedCurrencyState] = useState<string>(() => {
    const storedCurrency = localStorage.getItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY);
    return storedCurrency || DEFAULT_CURRENCY_CODE;
  });

  const [selectedCurrencySymbol, setSelectedCurrencySymbolState] = useState<string>(() => {
    // Initialize based on selectedCurrencyCode's initial value
    const initialCode = localStorage.getItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY) || DEFAULT_CURRENCY_CODE;
    const currentCurrency = AVAILABLE_CURRENCIES.find(c => c.code === initialCode);
    return currentCurrency ? currentCurrency.symbol : (AVAILABLE_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY_CODE)?.symbol || '$');
  });

  useEffect(() => {
    const loadTranslations = async () => {
      setIsTranslationsLoading(true);
      let effectiveLanguage = language;
      let translationsData: Translations | null = null;

      const fetchTranslationsForLang = async (langToFetch: Language): Promise<Translations | null> => {
        // Locale files are now served from the root, typically from a 'public' or 'static' folder.
        const path = `/locales/${langToFetch}.json`; // Changed to root-relative path
        try {
          const response = await fetch(path);
          if (!response.ok) {
            console.error(`Failed to fetch translations for ${langToFetch} from ${path}. Status: ${response.status} ${response.statusText}`);
            const responseText = await response.text().catch(() => "Could not read response text.");
            console.error(`Response text for ${path}: ${responseText}`);
            return null;
          }
          return await response.json();
        } catch (error) {
          console.error(`Network or other error fetching translations for ${langToFetch} from ${path}:`, error);
          // Check if we're offline and return fallback translations
          if (!navigator.onLine || error instanceof TypeError) {
            console.warn(`Using fallback translations for ${langToFetch} due to network error (possibly offline).`);
            return FALLBACK_TRANSLATIONS[langToFetch] || FALLBACK_TRANSLATIONS[DEFAULT_LANGUAGE];
          }
          return null;
        }
      };

      translationsData = await fetchTranslationsForLang(effectiveLanguage);

      if (!translationsData) {
        console.warn(`Could not load translations for ${effectiveLanguage}. Attempting fallback to ${DEFAULT_LANGUAGE}.`);
        const previousEffectiveLanguage = effectiveLanguage;
        effectiveLanguage = DEFAULT_LANGUAGE;
        translationsData = await fetchTranslationsForLang(DEFAULT_LANGUAGE);
        if (!translationsData) {
            console.error(`CRITICAL: Failed to load even default (${DEFAULT_LANGUAGE}) translations after failing for ${previousEffectiveLanguage}. Using embedded fallback translations.`);
            // Use embedded fallback translations as last resort
            const fallbackLang = previousEffectiveLanguage in FALLBACK_TRANSLATIONS ? previousEffectiveLanguage : DEFAULT_LANGUAGE;
            setTranslations(FALLBACK_TRANSLATIONS[fallbackLang] || FALLBACK_TRANSLATIONS[DEFAULT_LANGUAGE]);
        } else {
            setTranslations(translationsData);
        }
      } else {
        setTranslations(translationsData);
      }
      setIsTranslationsLoading(false);
    };

    loadTranslations();
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang);
  }, []);

  const setIsDarkMode = useCallback((isDark: boolean) => {
    setCurrentDarkMode(isDark);
    localStorage.setItem(LOCAL_STORAGE_DARK_MODE_KEY, String(isDark));
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let current: any = translations;
    for (const k of keys) {
      if (typeof current === 'object' && current !== null && k in current) {
        current = current[k];
      } else {
        return key;
      }
    }

    let parsedString = typeof current === 'string' ? current : key;

    if (replacements && typeof parsedString === 'string') {
      let resultString = parsedString;
      Object.keys(replacements).forEach(placeholderKey => {
        const valueToInsert = String(replacements[placeholderKey]);
        const patternToReplace = `{${placeholderKey}}`;
        // Loop to replace all occurrences, similar to 'g' flag in regex
        // String.prototype.replaceAll could be used if ES2021 is target,
        // but a loop is more compatible.
        while (resultString.includes(patternToReplace)) {
            resultString = resultString.replace(patternToReplace, valueToInsert);
        }
      });
      parsedString = resultString; // Update parsedString with the result of all replacements
    }
    return parsedString;
  }, [translations]);

  const setSelectedCurrencyCode = useCallback((code: string) => {
    const currency = AVAILABLE_CURRENCIES.find(c => c.code === code);
    if (currency) {
      setSelectedCurrencyState(code);
      setSelectedCurrencySymbolState(currency.symbol);
      localStorage.setItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY, code);
    } else {
      // Fallback to default if invalid code is provided
      const defaultCurrency = AVAILABLE_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY_CODE) || AVAILABLE_CURRENCIES[0];
      setSelectedCurrencyState(defaultCurrency.code);
      setSelectedCurrencySymbolState(defaultCurrency.symbol);
      localStorage.setItem(LOCAL_STORAGE_SELECTED_CURRENCY_KEY, defaultCurrency.code);
    }
  }, []);

  // Effect to update symbol if code changes externally (e.g. initial load with different stored value)
  useEffect(() => {
    const currentCurrency = AVAILABLE_CURRENCIES.find(c => c.code === selectedCurrencyCode);
    setSelectedCurrencySymbolState(currentCurrency ? currentCurrency.symbol : (AVAILABLE_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY_CODE)?.symbol || '$'));
  }, [selectedCurrencyCode]);


  const formatCurrency = useCallback((amount: number): string => {
    const isJPY = selectedCurrencyCode === 'JPY';
    // For JPY, no decimals is standard.
    if (isJPY) {
        return `${selectedCurrencySymbol}${amount.toFixed(0)}`;
    }
    return `${selectedCurrencySymbol}${amount.toFixed(2)}`;
  }, [selectedCurrencySymbol, selectedCurrencyCode]);

  const contextValue: AppContextType = {
    language,
    setLanguage,
    isDarkMode,
    setIsDarkMode,
    t,
    selectedCurrencyCode,
    setSelectedCurrencyCode,
    selectedCurrencySymbol,
    formatCurrency,
    isTranslationsLoading
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

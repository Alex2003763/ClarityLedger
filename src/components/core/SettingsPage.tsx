import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { 
  LOCAL_STORAGE_OPENROUTER_API_KEY, 
  LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  Language,
  DEFAULT_USER_ID,
  AVAILABLE_CURRENCIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES,
  LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES
} from '../../constants';
import { useAppContext } from '../../contexts/AppContext';
import { getTransactions, saveTransactions } from '../../services/transactionService';
import { Transaction, TransactionType } from '../../types';
import SettingsIcon from '../ui/SettingsIcon'; // Import the new SettingsIcon

// Icons
const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
  </svg>
);
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591" />
  </svg>
);
const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
</svg>
);
const LanguageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
  </svg>
);
const DatabaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 3v-1.5A2.25 2.25 0 016 0h12A2.25 2.25 0 0120.25 1.5V3M3.75 3H1M3.75 7.5H1M3.75 12H1m19.5 0v.75c0 .621-.504 1.125-1.125 1.125a1.125 1.125 0 01-1.125-1.125v-.75m1.125 0c.094-.317.188-.635.281-.952m-1.688.952a.625.625 0 01-.625-.625V7.5c0-.621.504-1.125 1.125-1.125a1.125 1.125 0 011.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125Z" />
  </svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);
const GlobeAltIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0 1 12 16.5c-.93 0-1.813-.12-2.662-.35M3.284 14.253A11.978 11.978 0 0 0 12 16.5c.93 0 1.813-.12 2.662-.35m0 0a8.959 8.959 0 0 0 2.662-2.352m0 0a8.997 8.997 0 0 0-7.843-4.582M3.284 7.582A8.997 8.997 0 0 1 12 3" />
    </svg>
);
const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.678-.112 1.017-.165M11.543 0a48.297 48.297 0 0 1-3.478-.397m-12.56 0a48.297 48.297 0 0 0-3.478-.397M9.75 4.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v.75H9.75v-.75Z" />
  </svg>
);


const SettingsPage: React.FC = () => {
  const { t, language, setLanguage, isDarkMode, setIsDarkMode, selectedCurrencyCode, setSelectedCurrencyCode } = useAppContext();
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState(DEFAULT_OPENROUTER_MODEL);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error', subText?: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [customIncomeCategories, setCustomIncomeCategories] = useState<string[]>([]);
  const [customExpenseCategories, setCustomExpenseCategories] = useState<string[]>([]);
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');


  useEffect(() => {
    const storedKey = localStorage.getItem(LOCAL_STORAGE_OPENROUTER_API_KEY);
    setApiKey(storedKey || '');

    const storedModel = localStorage.getItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL);
    setModelName(storedModel === null ? DEFAULT_OPENROUTER_MODEL : storedModel);

    // Load custom categories
    setCustomIncomeCategories(JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES) || '[]'));
    setCustomExpenseCategories(JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES) || '[]'));
  }, []);

  const handleSaveSettings = () => {
    setIsLoading(true);
    setMessage(null);
    const trimmedApiKey = apiKey.trim();
    const trimmedModelName = modelName.trim();

    try {
      if (!trimmedApiKey) {
        localStorage.removeItem(LOCAL_STORAGE_OPENROUTER_API_KEY);
        setApiKey(''); 
        setMessage({ text: t('settingsPage.apiKeyRemovedMessage'), type: 'success' });
      } else {
        localStorage.setItem(LOCAL_STORAGE_OPENROUTER_API_KEY, trimmedApiKey);
        setMessage({ text: t('settingsPage.successMessage'), type: 'success' });
      }
      localStorage.setItem(LOCAL_STORAGE_SELECTED_OPENROUTER_MODEL, trimmedModelName);
      setModelName(trimmedModelName);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ text: t('settingsPage.failureMessage'), type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as Language);
  };

  const handleCurrencyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrencyCode(event.target.value);
    setMessage({ text: t('settingsPage.currencyChangedMessage', {currency: event.target.value}), type: 'success'});
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExportData = () => {
    setMessage(null);
    try {
      const transactions = getTransactions();
      const jsonData = JSON.stringify(transactions, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      const filename = `claritycoin_backup_${date}.json`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ text: t('settingsPage.exportSuccessMessage', {filename}), type: 'success' });
    } catch (error) {
      console.error("Error exporting data:", error);
      setMessage({ text: t('settingsPage.exportErrorMessage'), type: 'error' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleImportFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json') {
        setFileToImport(file);
        setIsImportConfirmModalOpen(true);
      } else {
        setMessage({ text: t('settingsPage.importErrorMessageFile'), type: 'error' });
        setFileToImport(null);
      }
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const isValidTransactionArray = (data: any): data is Partial<Transaction>[] => {
    if (!Array.isArray(data)) return false;
    return data.every(item => 
      typeof item === 'object' && item !== null &&
      typeof item.description === 'string' &&
      typeof item.amount === 'number' && item.amount > 0 && 
      (item.type === TransactionType.INCOME || item.type === TransactionType.EXPENSE) &&
      typeof item.category === 'string' &&
      typeof item.date === 'string' && !isNaN(new Date(item.date).getTime()) 
      // Tags are optional, so no strict validation here
    );
  };

  const processAndImportFile = () => {
    if (!fileToImport) return;
    
    setIsImporting(true);
    setMessage({ text: t('settingsPage.importProcessingMessage'), type: 'success'});
    setIsImportConfirmModalOpen(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = JSON.parse(text);

        if (!isValidTransactionArray(parsedData)) {
          setMessage({ text: t('settingsPage.importErrorMessageValidation'), type: 'error' });
          setIsImporting(false);
          setFileToImport(null);
          setTimeout(() => setMessage(null), 5000);
          return;
        }
        
        const processedTransactions: Transaction[] = parsedData.map((item: any, index: number) => ({
          id: item.id || (new Date().toISOString() + Math.random().toString(36).substring(2, 9) + `_import_${index}`), // Preserve ID if exists
          userId: DEFAULT_USER_ID,
          description: item.description.trim(),
          amount: parseFloat(item.amount),
          type: item.type as TransactionType,
          category: item.category.trim(),
          date: new Date(item.date).toISOString().split('T')[0], 
          tags: Array.isArray(item.tags) ? item.tags.map((tag:any) => String(tag).trim()).filter((tag:string) => tag) : [],
        }));

        saveTransactions(processedTransactions);
        setMessage({ 
            text: t('settingsPage.importSuccessMessage'), 
            type: 'success',
            subText: t('settingsPage.importSuccessInfoNavigate')
        });
      } catch (error) {
        console.error("Error importing data:", error);
        setMessage({ text: t('settingsPage.importErrorMessageFormat'), type: 'error' });
      } finally {
        setIsImporting(false);
        setFileToImport(null);
        setTimeout(() => setMessage(null), 7000);
      }
    };
    reader.onerror = () => {
      setMessage({ text: t('settingsPage.importErrorMessageFile'), type: 'error' });
      setIsImporting(false);
      setFileToImport(null);
      setTimeout(() => setMessage(null), 5000);
    };
    reader.readAsText(fileToImport);
  };

  // Custom Category Management
  const handleAddCustomCategory = (type: 'income' | 'expense') => {
    setMessage(null);
    const categoryName = type === 'income' ? newIncomeCategory.trim() : newExpenseCategory.trim();
    if (!categoryName) {
      setMessage({text: t('settingsPage.customCategories.errorEmptyName'), type: 'error'});
      return;
    }

    const allDefaultCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
    if(allDefaultCategories.some(cat => cat.toLowerCase() === categoryName.toLowerCase())) {
        setMessage({text: t('settingsPage.customCategories.errorIsDefault', { categoryName }), type: 'error'});
        return;
    }

    if (type === 'income') {
      if (customIncomeCategories.some(cat => cat.toLowerCase() === categoryName.toLowerCase())) {
        setMessage({text: t('settingsPage.customCategories.errorExists', { categoryName }), type: 'error'});
        return;
      }
      const updated = [...customIncomeCategories, categoryName];
      setCustomIncomeCategories(updated);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES, JSON.stringify(updated));
      setNewIncomeCategory('');
    } else {
      if (customExpenseCategories.some(cat => cat.toLowerCase() === categoryName.toLowerCase())) {
        setMessage({text: t('settingsPage.customCategories.errorExists', { categoryName }), type: 'error'});
        return;
      }
      const updated = [...customExpenseCategories, categoryName];
      setCustomExpenseCategories(updated);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES, JSON.stringify(updated));
      setNewExpenseCategory('');
    }
    setMessage({text: t('settingsPage.customCategories.addSuccess', { categoryName }), type: 'success'});
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteCustomCategory = (nameToDelete: string, type: 'income' | 'expense') => {
    setMessage(null);
    // Basic check: is it a default category? Should not be deletable from custom list anyway.
    if ((type === 'income' && DEFAULT_INCOME_CATEGORIES.includes(nameToDelete)) || 
        (type === 'expense' && DEFAULT_EXPENSE_CATEGORIES.includes(nameToDelete))) {
      setMessage({text: t('settingsPage.customCategories.errorCannotDeleteDefault'), type: 'error'});
      return;
    }

    // Check if category is in use (optional, for now just delete)
    // const transactions = getTransactions();
    // if (transactions.some(t => t.category === nameToDelete && (type === 'income' ? t.type === TransactionType.INCOME : t.type === TransactionType.EXPENSE))) {
    //   if (!confirm(t('settingsPage.customCategories.confirmDeleteInUse', { categoryName: nameToDelete }))) {
    //     return;
    //   }
    // }

    if (type === 'income') {
      const updated = customIncomeCategories.filter(cat => cat !== nameToDelete);
      setCustomIncomeCategories(updated);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_INCOME_CATEGORIES, JSON.stringify(updated));
    } else {
      const updated = customExpenseCategories.filter(cat => cat !== nameToDelete);
      setCustomExpenseCategories(updated);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_EXPENSE_CATEGORIES, JSON.stringify(updated));
    }
    setMessage({text: t('settingsPage.customCategories.deleteSuccess', { categoryName: nameToDelete }), type: 'success'});
    setTimeout(() => setMessage(null), 3000);
  };
  
  const CategoryManager: React.FC<{
    title: string;
    categories: string[];
    customCategories: string[];
    newCategory: string;
    setNewCategory: (val: string) => void;
    onAdd: () => void;
    onDelete: (name: string) => void;
    categoryTypeForTranslation: 'income' | 'expense';
  }> = ({ title, categories, customCategories, newCategory, setNewCategory, onAdd, onDelete, categoryTypeForTranslation }) => (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      <div className="mb-3 p-3 bg-gray-50 dark:bg-darkSurface/50 rounded-md">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('settingsPage.customCategories.defaultCategories')}</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const key = `categories.${cat.replace(/\s+/g, '').replace(/[^\w]/gi, '')}`;
            const translated = t(key) === key ? cat : t(key);
            return (
              <span key={cat} className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md">
                {translated}
              </span>
            );
          })}
        </div>
      </div>
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('settingsPage.customCategories.yourCustomCategories')}</h4>
        {customCategories.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('settingsPage.customCategories.noCustomYet')}</p>
        ) : (
          <ul className="space-y-1 max-h-32 overflow-y-auto pr-2">
            {customCategories.map(cat => (
              <li key={cat} className="flex justify-between items-center text-sm p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                <span className="text-gray-700 dark:text-gray-200">{cat}</span>
                <Button onClick={() => onDelete(cat)} variant="ghost" size="sm" className="p-1 text-danger hover:bg-red-100 dark:hover:bg-red-900/[0.5]">
                  <TrashIcon className="w-4 h-4"/>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex space-x-2">
        <Input
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          placeholder={t('settingsPage.customCategories.addPlaceholder')}
          containerClassName="flex-grow mb-0"
          className="h-10"
        />
        <Button onClick={onAdd} variant="secondary" size="md" className="h-10 px-3" leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>
          {t('settingsPage.customCategories.addButton')}
        </Button>
      </div>
    </div>
  );


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl mx-auto bg-white dark:bg-darkSurface p-6 sm:p-8 rounded-xl shadow-xl transition-colors duration-300">
        
        <div className="flex items-center mb-10">
          <SettingsIcon className="w-10 h-10 text-primary dark:text-primary-light mr-4" /> {/* Use new SettingsIcon */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">{t('settingsPage.title')}</h1>
        </div>

        {/* API Settings Section */}
        <div className="flex items-center mb-6">
          <KeyIcon className="w-8 h-8 text-primary dark:text-primary-light mr-3" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('settingsPage.apiSettingsTitle')}</h2>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {t('settingsPage.apiSettingsDescription')} {' '}
          <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-primary-light hover:underline font-medium">
            {t('settingsPage.openRouterLink')}
          </a>.
        </p>

        <div className="space-y-6">
          <div>
            <Input
              label={t('settingsPage.apiKeyLabel')}
              id="openrouter-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('settingsPage.apiKeyPlaceholder')}
              containerClassName="mb-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('settingsPage.apiKeyHelp')}
            </p>
          </div>

          <div>
            <Input
              label={t('settingsPage.modelNameLabel')}
              id="openrouter-model"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={t('settingsPage.modelNamePlaceholder')}
              containerClassName="mb-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('settingsPage.modelNameHelp', { defaultModel: DEFAULT_OPENROUTER_MODEL })}
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSaveSettings} 
          isLoading={isLoading} 
          variant="primary" 
          className="w-full mt-8"
          leftIcon={message?.type === 'success' && !isLoading && !message.subText && (message.text.includes(t('settingsPage.successMessage')) || message.text.includes(t('settingsPage.apiKeyRemovedMessage'))) ? <CheckCircleIcon className="w-5 h-5" /> : undefined}
        >
          {isLoading ? t('settingsPage.savingButton') : (message?.type === 'success' && !message.subText && (message.text.includes(t('settingsPage.successMessage')) || message.text.includes(t('settingsPage.apiKeyRemovedMessage'))) ? t('settingsPage.settingsSavedButton') : t('settingsPage.saveButton'))}
        </Button>

        {message && !isLoading && !message.subText && (message.text.includes(t('settingsPage.successMessage')) || message.text.includes(t('settingsPage.apiKeyRemovedMessage')) || message.text.includes(t('settingsPage.failureMessage'))) && (
          <div className={`mt-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/[0.3] text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/[0.3] text-red-700 dark:text-red-300'}`}>
            {message.text}
          </div>
        )}
        
        {/* UI Settings */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-darkBorder">
            <div className="flex items-center mb-6">
                <GlobeAltIcon className="w-8 h-8 text-secondary mr-3"/>
                 <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('settingsPage.uiSettingsTitle')}</h2>
            </div>
            <div className="space-y-6">
                <div>
                    <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       <LanguageIcon className="w-5 h-5 inline mr-1 align-text-bottom"/> {t('settingsPage.languageLabel')}
                    </label>
                    <select
                        id="language-select"
                        value={language}
                        onChange={handleLanguageChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-darkBorder rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext"
                    >
                        <option value="en">{t('settingsPage.english')}</option>
                        <option value="zh-TW">{t('settingsPage.traditionalChinese')}</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('settingsPage.currencySettingLabel')}
                    </label>
                    <select
                        id="currency-select"
                        value={selectedCurrencyCode}
                        onChange={handleCurrencyChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-darkBorder rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-darkSurface text-lighttext dark:text-darktext"
                    >
                        {AVAILABLE_CURRENCIES.map(currency => (
                            <option key={currency.code} value={currency.code}>
                                {t(currency.nameKey)} ({currency.symbol})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('settingsPage.darkModeLabel')}
                    </label>
                    <Button 
                        onClick={() => setIsDarkMode(!isDarkMode)} 
                        variant="ghost" 
                        className="w-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-darkBorder"
                        leftIcon={isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400"/> : <MoonIcon className="w-5 h-5 text-indigo-400"/>}
                    >
                        {isDarkMode ? t('settingsPage.switchToLightMode') : t('settingsPage.switchToDarkMode')}
                    </Button>
                </div>
            </div>
             {message && message.type === 'success' && message.text.includes(t('settingsPage.currencyChangedMessage', {currency: ''}).substring(0,10)) && (
              <div className={`mt-4 p-3 rounded-md text-sm bg-green-50 dark:bg-green-900/[0.3] text-green-700 dark:text-green-300`}>
                {message.text}
              </div>
            )}
        </div>
        
        {/* Category Management Settings */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-darkBorder">
            <div className="flex items-center mb-4">
                <SettingsIcon className="w-8 h-8 text-emerald-500 mr-3"/> {/* Use new SettingsIcon */}
                 <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('settingsPage.customCategories.title')}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('settingsPage.customCategories.description')}
            </p>
            <CategoryManager
              title={t('settingsPage.customCategories.incomeTitle')}
              categories={DEFAULT_INCOME_CATEGORIES}
              customCategories={customIncomeCategories}
              newCategory={newIncomeCategory}
              setNewCategory={setNewIncomeCategory}
              onAdd={() => handleAddCustomCategory('income')}
              onDelete={(name) => handleDeleteCustomCategory(name, 'income')}
              categoryTypeForTranslation="income"
            />
            <CategoryManager
              title={t('settingsPage.customCategories.expenseTitle')}
              categories={DEFAULT_EXPENSE_CATEGORIES}
              customCategories={customExpenseCategories}
              newCategory={newExpenseCategory}
              setNewCategory={setNewExpenseCategory}
              onAdd={() => handleAddCustomCategory('expense')}
              onDelete={(name) => handleDeleteCustomCategory(name, 'expense')}
              categoryTypeForTranslation="expense"
            />
             {message && (message.text.includes("category") || message.text.includes("類別")) && (
              <div className={`mt-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/[0.3] text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/[0.3] text-red-700 dark:text-red-300'}`}>
                {message.text}
              </div>
            )}
        </div>


        {/* Data Management */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-darkBorder">
            <div className="flex items-center mb-6">
                <DatabaseIcon className="w-8 h-8 text-accent mr-3"/>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('settingsPage.dataManagementTitle')}</h2>
            </div>
            <div className="space-y-4 sm:flex sm:space-y-0 sm:space-x-4">
                <Button 
                    onClick={handleExportData} 
                    variant="secondary" 
                    className="w-full sm:w-auto"
                    leftIcon={<DownloadIcon/>}
                    disabled={isImporting}
                >
                    {t('settingsPage.exportDataButton')}
                </Button>
                <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="secondary" 
                    className="w-full sm:w-auto"
                    leftIcon={<UploadIcon />}
                    disabled={isImporting}
                >
                    {t('settingsPage.importDataButton')}
                </Button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportFileSelect} 
                    className="hidden" 
                    accept=".json" 
                />
            </div>
             {message && (message.subText || (message.text && (message.text.includes("export") || message.text.includes("import") || message.text.includes(t('settingsPage.exportDataButton')) || message.text.includes(t('settingsPage.importDataButton')) || message.text.includes("Processing") || message.text.includes("處理中") || message.text.includes(t('settingsPage.importProcessingMessage')) ))) && ( 
              <div className={`mt-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/[0.3] text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/[0.3] text-red-700 dark:text-red-300'}`}>
                <p>{message.text}</p>
                {message.subText && <p className="mt-1 text-xs">{message.subText}</p>}
              </div>
            )}
        </div>

         <p className="mt-8 text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('settingsPage.settingsUsageInfo')}
        </p>
      </div>

      <Modal
        isOpen={isImportConfirmModalOpen}
        onClose={() => {
            setIsImportConfirmModalOpen(false);
            setFileToImport(null);
        }}
        title={t('settingsPage.importConfirmTitle')}
        size="md"
      >
        <p className="text-gray-600 dark:text-gray-300 mb-6">{t('settingsPage.importConfirmMessage')}</p>
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => {
              setIsImportConfirmModalOpen(false);
              setFileToImport(null);
          }}>
            {t('settingsPage.importCancelButton')}
          </Button>
          <Button variant="danger" onClick={processAndImportFile}>
            {t('settingsPage.importConfirmButton')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;

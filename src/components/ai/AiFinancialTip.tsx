
import React, { useState, useCallback, useEffect } from 'react';
import { getFinancialTip, AiTipError } from '../../services/aiTipService';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { useAppContext } from '../../contexts/AppContext';

interface AiFinancialTipProps {
  balance: number;
  recentTransactionsCount: number;
}

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.355a7.5 7.5 0 0 1-6 0M12 21a7.5 7.5 0 0 0 7.5-7.5H4.5A7.5 7.5 0 0 0 12 21ZM3.75 10.5A2.25 2.25 0 0 0 6 12.75h12A2.25 2.25 0 0 0 15.75 10.5v-2.625A2.25 2.25 0 0 0 13.5 5.625h-3A2.25 2.25 0 0 0 8.25 7.875v2.625Z" />
  </svg>
);

const AiFinancialTip: React.FC<AiFinancialTipProps> = ({ balance, recentTransactionsCount }) => {
  const { t, selectedCurrencyCode, selectedCurrencySymbol } = useAppContext();
  const [tip, setTip] = useState<string>(''); 
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);


  const fetchTip = useCallback(async () => {
    setIsLoading(true);
    setHasFetchedOnce(true);
    setErrorMessage(''); 
    setTip('');         
    try {
      const fetchedOutcome = await getFinancialTip(balance, recentTransactionsCount, selectedCurrencyCode, selectedCurrencySymbol);
      if (typeof fetchedOutcome === 'string') {
        setTip(fetchedOutcome);
      } else { 
        setErrorMessage(t(fetchedOutcome.key, fetchedOutcome.params) || fetchedOutcome.fallback);
      }
    } catch (err) { 
      console.error("Exception in fetchTip callback:", err);
      let msg = t('aiFinancialTip.errorGenericNetwork'); 
      if (err instanceof Error) {
         msg = t('aiFinancialTip.errorNetwork', { model: 'unknown', message: err.message });
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [balance, recentTransactionsCount, t, selectedCurrencyCode, selectedCurrencySymbol]);

  // Auto-fetch tip when component mounts and currency info is available and transactions exist
  useEffect(() => {
    const apiKey = localStorage.getItem('clarityCoinOpenRouterApiKey');
    if (apiKey && recentTransactionsCount > 0 && !hasFetchedOnce && selectedCurrencyCode && selectedCurrencySymbol) {
        // Only fetch if there are transactions to analyze.
        // And API key exists.
        // And currency details are loaded.
        fetchTip();
    } else if (!hasFetchedOnce) {
      // If auto-fetch conditions are not met on the first attempt (e.g., no API key, no transactions),
      // mark as "attempted" so the initial message is shown by default,
      // rather than an error for a missing API key or lack of transactions.
      // The explicit "Get New Tip" button will still show errors if conditions are not met upon click.
      setHasFetchedOnce(true);
    }

  }, [fetchTip, recentTransactionsCount, hasFetchedOnce, selectedCurrencyCode, selectedCurrencySymbol, t]);


  return (
    <div className="bg-white dark:bg-darkSurface p-6 rounded-lg shadow-lg transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
          <LightbulbIcon className="w-6 h-6 text-yellow-500 mr-2" />
          {t('aiFinancialTip.title')}
        </h3>
        <Button onClick={fetchTip} disabled={isLoading} size="sm" variant="secondary">
          {isLoading ? t('aiFinancialTip.gettingTipButton') : t('aiFinancialTip.getNewTipButton')}
        </Button>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <Spinner size="md" />
        </div>
      )}

      {errorMessage && !isLoading && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/[0.3] p-3 rounded-md">{errorMessage}</p>
      )}

      {tip && !isLoading && !errorMessage && ( 
        <div className="bg-indigo-50 dark:bg-indigo-900/[0.4] border-l-4 border-primary dark:border-primary-light p-4 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-200">{tip}</p>
        </div>
      )}

      {!isLoading && !tip && !errorMessage && (
         <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('aiFinancialTip.initialMessage')}</p>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
        {t('aiFinancialTip.infoText')}
      </p>
    </div>
  );
};

export default AiFinancialTip;

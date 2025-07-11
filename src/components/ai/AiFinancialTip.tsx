
import React, { useState, useCallback } from 'react';
import { getFinancialTip, AiTipError } from '../../services/aiTipService';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { useAppContext } from '../../contexts/AppContext';

interface AiFinancialTipProps {
  balance: number;
  recentTransactionsCount: number;
}

// LightbulbIcon definition removed

const AiFinancialTip: React.FC<AiFinancialTipProps> = ({ balance, recentTransactionsCount }) => {
  const { t, selectedCurrencyCode, selectedCurrencySymbol, language } = useAppContext();
  const [tip, setTip] = useState<string>(''); 
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchTip = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(''); 
    setTip('');         
    try {
      const fetchedOutcome = await getFinancialTip(balance, recentTransactionsCount, selectedCurrencyCode, selectedCurrencySymbol, language);
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
  }, [balance, recentTransactionsCount, selectedCurrencyCode, selectedCurrencySymbol, language, t]);

  return (
    <div className="bg-white dark:bg-darkSurface p-6 rounded-xl shadow-lg transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
          <i className="fas fa-brain w-7 h-7 text-accent dark:text-sky-400 mr-2.5"></i>
          {t('aiFinancialTip.title')}
        </h3>
        <Button onClick={fetchTip} disabled={isLoading} size="sm" variant="secondary">
          {isLoading ? t('aiFinancialTip.gettingTipButton') : t('aiFinancialTip.getNewTipButton')}
        </Button>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center py-6">
          <Spinner size="md" />
        </div>
      )}

      {errorMessage && !isLoading && (
        <div className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/[0.4] p-4 rounded-lg border border-red-300 dark:border-red-600" role="alert">
          <p className="font-medium">{t('aiFinancialTip.errorTitle') || 'Error'}</p>
          <p>{errorMessage}</p>
        </div>
      )}

      {tip && !isLoading && !errorMessage && ( 
        <blockquote className="bg-indigo-50 dark:bg-indigo-900/[0.5] border-l-4 border-primary dark:border-primary-light p-5 rounded-r-lg shadow-sm my-2">
          <p className="text-base text-gray-800 dark:text-gray-100 italic leading-relaxed">{tip}</p>
        </blockquote>
      )}

      {!isLoading && !tip && !errorMessage && (
         <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 italic">{t('aiFinancialTip.initialMessage')}</p>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-5 text-center">
        {t('aiFinancialTip.infoText')}
      </p>
    </div>
  );
};

export default AiFinancialTip;
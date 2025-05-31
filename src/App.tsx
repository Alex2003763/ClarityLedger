

import React, { useState, useCallback, useEffect } from 'react';
import Dashboard from './components/core/Dashboard';
import SettingsPage from './components/core/SettingsPage';
import Sidebar from './components/core/Sidebar'; 
import TopBar from './components/core/TopBar';   
import HelpCenterPage from './components/core/HelpCenterPage'; 
import TransactionsPage from './components/core/TransactionsPage'; 
import ReportsPage from './components/core/ReportsPage'; 
import BillScanPage from './components/ocr/BillScanPage'; // New Bill Scan Page
import { AppProvider, useAppContext } from './contexts/AppContext';

type Page = 'dashboard' | 'settings' | 'help' | 'transactions' | 'reports' | 'billScan';

const AppContent: React.FC = () => {
  const { t } = useAppContext();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768); 

  const handleNavigate = useCallback((page: Page) => {
    setCurrentPage(page);
    if (window.innerWidth <= 768 && isSidebarOpen) { 
      // setIsSidebarOpen(false); // Optional: close sidebar on nav on mobile
    }
  }, [isSidebarOpen]);
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) { 
        setIsSidebarOpen(true); 
      } else { 
        setIsSidebarOpen(false); 
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  let pageTitle = '';
  if (currentPage === 'dashboard') pageTitle = t('navbar.dashboard');
  if (currentPage === 'settings') pageTitle = t('navbar.settings');
  if (currentPage === 'help') pageTitle = t('helpCenterPage.title');
  if (currentPage === 'transactions') pageTitle = t('navbar.transactions');
  if (currentPage === 'reports') pageTitle = t('navbar.reports');
  if (currentPage === 'billScan') pageTitle = t('navbar.billScan', { defaultValue: 'Scan Bill' });


  return (
    <div className="flex min-h-screen bg-lightbg dark:bg-darkbg transition-colors duration-300 w-full">
      <Sidebar onNavigate={handleNavigate} currentPage={currentPage} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20' }`}>
        <TopBar pageTitle={pageTitle} toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'settings' && <SettingsPage />}
          {currentPage === 'help' && <HelpCenterPage />}
          {currentPage === 'transactions' && <TransactionsPage />}
          {currentPage === 'reports' && <ReportsPage />}
          {currentPage === 'billScan' && <BillScanPage onNavigateToTransactions={() => handleNavigate('transactions')} />}
        </main>
        <footer className="bg-white dark:bg-darkContentBg text-grayText text-center p-4 text-sm border-t border-gray-200 dark:border-darkBorder transition-colors duration-300">
           {t('footer', { year: new Date().getFullYear().toString() })}
        </footer>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
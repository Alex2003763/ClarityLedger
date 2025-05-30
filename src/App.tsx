

import React, { useState, useCallback, useEffect } from 'react';
import Dashboard from './components/core/Dashboard';
import SettingsPage from './components/core/SettingsPage';
import Sidebar from './components/core/Sidebar'; // New Sidebar
import TopBar from './components/core/TopBar';   // New TopBar
import HelpCenterPage from './components/core/HelpCenterPage'; // New Help Center Page
import TransactionsPage from './components/core/TransactionsPage'; // New Transactions Page
import ReportsPage from './components/core/ReportsPage'; // New Reports Page
import { AppProvider, useAppContext } from './contexts/AppContext';

type Page = 'dashboard' | 'settings' | 'help' | 'transactions' | 'reports';

const AppContent: React.FC = () => {
  const { t } = useAppContext();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  // Default sidebar to open on desktop (width > 768px), closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768); 

  const handleNavigate = useCallback((page: Page) => {
    setCurrentPage(page);
    // If on mobile and sidebar is fully open, consider closing it on navigation
    if (window.innerWidth <= 768 && isSidebarOpen) { 
      // setIsSidebarOpen(false); // Optional: close sidebar on nav on mobile
    }
  }, [isSidebarOpen]);
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) { // Desktop
        setIsSidebarOpen(true); // Sidebar is open (expanded)
      } else { // Mobile
        setIsSidebarOpen(false); // Sidebar is closed (collapsed)
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
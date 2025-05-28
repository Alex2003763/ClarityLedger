
import React, { useState, useCallback, useEffect } from 'react';
import Dashboard from './components/core/Dashboard';
import Navbar from './components/core/Navbar';
import SettingsPage from './components/core/SettingsPage';
import { AppProvider, useAppContext } from './contexts/AppContext'; // Import useAppContext

type Page = 'dashboard' | 'settings';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { t } = useAppContext(); // Use translations

  const handleNavigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-lightbg dark:bg-darkbg text-lighttext dark:text-darktext transition-colors duration-300">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
      <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8"> {/* Adjusted padding */}
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>
      <footer className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-center p-4 text-sm transition-colors duration-300"> {/* Updated styles */}
        {t('footer', { year: new Date().getFullYear().toString() })}
      </footer>
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

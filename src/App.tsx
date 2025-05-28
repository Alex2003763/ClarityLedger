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
      <main className="flex-grow container mx-auto"> {/* Added container for consistent padding across pages */}
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>
      <footer className="bg-slate-800 dark:bg-gray-900 text-slate-300 dark:text-gray-400 text-center p-4 text-sm transition-colors duration-300">
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
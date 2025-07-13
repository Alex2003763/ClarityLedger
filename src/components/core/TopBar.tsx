
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

type Page = 'dashboard' | 'settings' | 'help' | 'transactions' | 'reports' | 'billScan' | 'recurring';

interface TopBarProps {
  pageTitle: string;
  toggleSidebar: () => void; 
  isSidebarOpen: boolean; 
  isMobileView: boolean; 
  onNavigate: (page: Page) => void; // Added for mobile settings navigation
}

const TopBar: React.FC<TopBarProps> = ({ pageTitle, toggleSidebar, isSidebarOpen, isMobileView, onNavigate }) => {
  const { t } = useAppContext();

  const desktopIconClass = isSidebarOpen ? 'fa-chevron-left' : 'fa-bars'; 

  return (
    <header className="sticky top-0 z-30 bg-lightbg/95 dark:bg-darkbg/95 backdrop-blur-xl shadow-md p-4 sm:px-6 lg:px-8 border-b border-gray-100 dark:border-darkBorder/80">
      <div className="flex items-center justify-between h-12">
        <div className="flex items-center">
            {!isMobileView && (
                 <button
                    onClick={toggleSidebar}
                    className="text-lighttext dark:text-darktext hover:text-primary dark:hover:text-primaryLight focus:outline-none mr-3 p-1 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                    aria-label={isSidebarOpen ? t('topbar.closeSidebar', {defaultValue: 'Collapse sidebar'}) : t('topbar.openSidebar', {defaultValue: 'Expand sidebar'})}
                    aria-expanded={isSidebarOpen}
                >
                    <i className={`fas ${desktopIconClass} text-xl w-6 h-6 flex items-center justify-center transition-transform hover:scale-110`}></i>
                </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primaryLight bg-clip-text text-transparent truncate max-w-[calc(100vw-180px)] sm:max-w-md">
                {pageTitle}
            </h1>
        </div>
        
        <div className="flex items-center">
          {isMobileView ? (
            <button
              onClick={() => onNavigate('settings')}
              className="text-lighttext dark:text-darktext hover:text-primary dark:hover:text-primaryLight focus:outline-none p-2 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
              aria-label={t('navbar.settings')}
            >
              <i className="fas fa-cog text-xl w-6 h-6 flex items-center justify-center"></i>
            </button>
          ) : (
            <span className="text-sm text-grayText hidden sm:block">
              {t('topbar.welcomeMessage', {defaultValue: "Manage Your Finances"})}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;

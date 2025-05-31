import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface TopBarProps {
  pageTitle: string;
  toggleSidebar: () => void; // For desktop sidebar expand/collapse
  isSidebarOpen: boolean; // For desktop sidebar icon state
  isMobileView: boolean; // To hide hamburger on mobile
}

const TopBar: React.FC<TopBarProps> = ({ pageTitle, toggleSidebar, isSidebarOpen, isMobileView }) => {
  const { t } = useAppContext();

  // Icon for desktop sidebar toggle
  const desktopIconClass = isSidebarOpen ? 'fa-chevron-left' : 'fa-bars'; 
  // On mobile, the hamburger is hidden, so this icon is only for desktop.

  return (
    <header className="sticky top-0 z-30 bg-lightbg/80 dark:bg-darkbg/80 backdrop-blur-md shadow-sm p-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-12">
        <div className="flex items-center">
            {/* Hamburger icon: only visible on desktop (md and up) */}
            {!isMobileView && (
                 <button 
                    onClick={toggleSidebar} 
                    className="text-lighttext dark:text-darktext hover:text-primary dark:hover:text-primaryLight focus:outline-none mr-3 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label={isSidebarOpen ? t('topbar.closeSidebar', {defaultValue: 'Collapse sidebar'}) : t('topbar.openSidebar', {defaultValue: 'Expand sidebar'})}
                    aria-expanded={isSidebarOpen}
                >
                    <i className={`fas ${desktopIconClass} text-xl w-6 h-6 flex items-center justify-center`}></i>
                </button>
            )}
            <h1 className="text-xl sm:text-2xl font-semibold text-lighttext dark:text-darktext truncate max-w-xs sm:max-w-md">
                {pageTitle}
            </h1>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm text-grayText hidden sm:block">
            {t('topbar.welcomeMessage', {defaultValue: "Manage Your Finances"})}
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
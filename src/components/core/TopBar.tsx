
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface TopBarProps {
  pageTitle: string;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ pageTitle, toggleSidebar, isSidebarOpen }) => {
  const { t } = useAppContext();

  return (
    <header className="sticky top-0 z-30 bg-lightbg dark:bg-darkbg bg-opacity-80 dark:bg-opacity-80 backdrop-blur-md shadow-sm p-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-12">
        {/* Hamburger for mobile */}
        <button 
            onClick={toggleSidebar} 
            className="md:hidden text-lighttext dark:text-darktext hover:text-primary dark:hover:text-primaryLight focus:outline-none"
            aria-label={isSidebarOpen ? t('topbar.closeSidebar', {defaultValue: 'Close sidebar'}) : t('topbar.openSidebar', {defaultValue: 'Open sidebar'})}
        >
            <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
        </button>

        <h1 className="text-2xl font-semibold text-lighttext dark:text-darktext ml-2 md:ml-0">{pageTitle}</h1>
        
        <div className="flex items-center">
          {/* User Profile Placeholder - FinTrack has a profile image and name */}
          {/* For local app, could be settings shortcut or theme toggle */}
          <span className="text-sm text-grayText hidden sm:block">
            {t('topbar.welcomeMessage', {defaultValue: "Manage Your Finances"})}
          </span>
          {/* Example: Theme toggle icon could go here */}
          {/* <button className="ml-4 text-lighttext dark:text-darktext">
            <i className="fas fa-bell"></i>
          </button> */}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
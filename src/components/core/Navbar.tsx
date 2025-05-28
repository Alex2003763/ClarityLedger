import React from 'react';
import Button from '../ui/Button';
import { Logo } from '../ui/Logo';
import { useAppContext } from '../../contexts/AppContext';
import SettingsIcon from '../ui/SettingsIcon'; // Import the new SettingsIcon

interface NavbarProps {
  onNavigate: (page: 'dashboard' | 'settings') => void;
  currentPage: 'dashboard' | 'settings';
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { t } = useAppContext();

  return (
    <nav className="bg-white dark:bg-darkSurface shadow-md sticky top-0 z-40 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('dashboard')} className="flex items-center focus:outline-none" aria-label={t('appName')}>
            <Logo className="h-8 w-8 text-primary dark:text-primary-light mr-2" />
            <span className="font-bold text-xl text-primary dark:text-primary-light">{t('appName')}</span>
          </button>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button 
              onClick={() => onNavigate('dashboard')} 
              variant={currentPage === 'dashboard' ? 'primary' : 'ghost'} 
              size="sm"
              className={currentPage === 'dashboard' ? '' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light'}
            >
              {t('navbar.dashboard')}
            </Button>
            <Button 
              onClick={() => onNavigate('settings')} 
              variant={currentPage === 'settings' ? 'primary' : 'ghost'} 
              size="sm"
              className={currentPage === 'settings' ? '' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light'}
              leftIcon={<SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />} // Use new SettingsIcon
            >
              <span className="hidden sm:inline">{t('navbar.settings')}</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

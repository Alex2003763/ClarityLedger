
import React from 'react';
import { Logo } from '../ui/Logo'; 
import { useAppContext } from '../../contexts/AppContext';

type PageType = 'dashboard' | 'settings' | 'help' | 'transactions';

interface SidebarProps {
  onNavigate: (page: PageType) => void;
  currentPage: PageType;
  isOpen: boolean;
  toggleSidebar: () => void; 
}

const NavLink: React.FC<{
  onClick: () => void;
  iconClass: string;
  label: string;
  isActive: boolean;
  isSidebarOpen: boolean;
}> = ({ onClick, iconClass, label, isActive, isSidebarOpen }) => (
  <a
    href="#"
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`flex items-center py-3 px-4 my-2 rounded-xl text-gray-200 hover:bg-white/20 hover:text-white transition-all duration-200 ease-in-out
                ${isActive ? 'bg-white/20 text-white font-medium shadow-lg' : 'text-gray-300'}
                ${!isSidebarOpen ? 'justify-center' : ''}`}
    title={!isSidebarOpen ? label : undefined}
  >
    <i className={`${iconClass} text-xl ${isSidebarOpen ? 'mr-3' : 'mr-0'} w-6 text-center`}></i>
    {isSidebarOpen && <span className="text-sm">{label}</span>}
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentPage, isOpen }) => {
  const { t } = useAppContext();

  return (
    <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-secondary to-primary text-white p-4 sm:p-5 flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className={`flex items-center mb-8 ${isOpen ? 'justify-start' : 'justify-center'}`}>
         <Logo className={`h-9 w-9 text-white ${isOpen ? 'mr-2' : 'mr-0'}`} isSidebarOpen={isOpen} />
        {isOpen && <h1 className="text-2xl font-bold text-white">{t('appName')}</h1>}
      </div>

      <nav className="flex-grow">
        <NavLink
          onClick={() => onNavigate('dashboard')}
          iconClass="fas fa-home"
          label={t('navbar.dashboard')}
          isActive={currentPage === 'dashboard'}
          isSidebarOpen={isOpen}
        />
        <NavLink
          onClick={() => onNavigate('transactions')}
          iconClass="fas fa-exchange-alt" 
          label={t('navbar.transactions')}
          isActive={currentPage === 'transactions'}
          isSidebarOpen={isOpen}
        />
        <NavLink
          onClick={() => onNavigate('settings')}
          iconClass="fas fa-cog"
          label={t('navbar.settings')}
          isActive={currentPage === 'settings'}
          isSidebarOpen={isOpen}
        />
      </nav>

      <div className="mt-auto">
        <NavLink
            onClick={() => onNavigate('help')}
            iconClass="fas fa-question-circle"
            label={t('sidebar.helpCenter', {defaultValue: "Help Center"})}
            isActive={currentPage === 'help'}
            isSidebarOpen={isOpen}
        />
      </div>
    </aside>
  );
};

export default Sidebar;


import React from 'react';
import { Logo } from '../ui/Logo'; 
import { useAppContext } from '../../contexts/AppContext';

type PageType = 'dashboard' | 'settings' | 'help' | 'transactions' | 'reports' | 'billScan' | 'recurring';

interface SidebarProps {
  onNavigate: (page: PageType) => void;
  currentPage: PageType;
  isOpen: boolean; // Controls expanded/collapsed state on desktop
  toggleSidebar: () => void; // For desktop collapse/expand icon if any (can be in TopBar)
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
    className={`flex items-center py-3 px-4 my-1 rounded-xl
                hover:bg-white/20 dark:hover:bg-white/30
                hover:text-white transition-all duration-300 ease-out
                transform hover:scale-[1.02] active:scale-[0.98]
                ${isActive ? 'bg-white/30 dark:bg-white/40 text-white font-semibold shadow-sm' : 'text-gray-200 dark:text-gray-300'}
                ${!isSidebarOpen ? 'justify-center' : ''}`}
    title={!isSidebarOpen ? label : undefined} 
  >
    <i className={`${iconClass} text-lg ${isSidebarOpen ? 'mr-3' : 'mr-0'} w-5 text-center`}></i>
    {isSidebarOpen && <span className="text-sm">{label}</span>}
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentPage, isOpen }) => {
  const { t } = useAppContext();

  // Sidebar is always rendered for md+ screens. Its open/collapsed state is controlled by 'isOpen'.
  // On smaller screens (<md), it's not rendered (handled by App.tsx).
  return (
    <aside 
      className={`fixed top-0 left-0 h-full
                bg-gradient-to-br from-primaryDark via-primary to-primaryLight
                dark:from-primaryDark/90 dark:via-primary/80 dark:to-primaryLight/70
                text-white
                p-4 flex-col z-40 transition-all duration-300 ease-in-out hidden md:flex
                ${isOpen ? 'w-64' : 'w-20'}
                shadow-lg hover:shadow-xl transition-shadow`}
    >
      <div className={`flex items-center shrink-0 mb-8 h-12 ${isOpen ? 'justify-start' : 'justify-center'}`}>
         <Logo className={`h-9 w-9 text-white ${isOpen ? 'mr-3' : 'mr-0'}`} isSidebarOpen={isOpen} />
        {isOpen && <h1 className="text-2xl font-bold text-white truncate tracking-tight">{t('appName')}</h1>}
      </div>

      <nav className="flex-grow flex flex-col">
        <div className="flex-grow overflow-y-auto custom-scrollbar -mr-2 pr-2">
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
          onClick={() => onNavigate('recurring')}
          iconClass="fas fa-sync-alt" 
          label={t('navbar.recurring', {defaultValue: "Recurring"})}
          isActive={currentPage === 'recurring'}
          isSidebarOpen={isOpen}
        />
        <NavLink
          onClick={() => onNavigate('billScan')}
          iconClass="fas fa-camera" 
          label={t('navbar.billScan', {defaultValue: "Scan Bill"})}
          isActive={currentPage === 'billScan'}
          isSidebarOpen={isOpen}
        />
        <NavLink
          onClick={() => onNavigate('reports')}
          iconClass="fas fa-chart-pie" 
          label={t('navbar.reports')}
          isActive={currentPage === 'reports'}
          isSidebarOpen={isOpen}
        />
        </div>
        
        <div className="mt-auto shrink-0 pt-4 border-t border-white/20 dark:border-white/30">
            <NavLink
                onClick={() => onNavigate('help')}
                iconClass="fas fa-question-circle"
                label={t('sidebar.helpCenter', {defaultValue: "Help Center"})}
                isActive={currentPage === 'help'}
                isSidebarOpen={isOpen}
            />
            <NavLink
              onClick={() => onNavigate('settings')}
              iconClass="fas fa-cog"
              label={t('navbar.settings')}
              isActive={currentPage === 'settings'}
              isSidebarOpen={isOpen}
            />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiSettings, FiX, FiChevronDown, FiChevronRight, FiChevronLeft,
  FiLogOut, FiDatabase, FiCpu, FiTerminal,
  FiGrid, FiPieChart, FiShoppingBag, FiMenu, FiServer, FiGlobe, FiActivity
} from 'react-icons/fi';
import { useMerchantContext } from '../context/MerchantContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMinimized, onToggleMinimize }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clusters, selectedCluster, setSelectedCluster, viewMode, setViewMode } = useMerchantContext();
  const { logout } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleMenu = (menuName: string) => {
    if (isMinimized) return; // Don't expand menus when minimized
    setExpandedMenu(prev => (prev === menuName ? null : menuName));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-text-main/20 backdrop-blur-sm lg:hidden z-30 transition-all duration-500"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-gradient-to-b from-white via-white to-slate-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950/80 border-r border-neutral-border transition-all duration-300 z-30 lg:relative lg:top-0 lg:translate-x-0 flex flex-col ${isMinimized ? 'w-20' : 'w-72'
          } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 lg:hidden text-neutral-text-muted hover:text-primary-main transition-colors p-2 hover:bg-neutral-bg rounded-full shadow-sm z-50"
        >
          <FiX size={20} />
        </button>

        <nav className="flex flex-col h-full overflow-hidden">
          {/* Main Navigation Scrollable Area */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pt-5 pb-4 dark:bg-transparent">
            <div className={`space-y-4 ${isMinimized ? 'px-2' : 'px-4'}`}>

              {/* Proper Header with Toggle Icon */}
              <div className={`flex items-center ${isMinimized ? 'justify-center' : 'justify-between px-3'} mb-5 h-9`}>
                {!isMinimized && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-900/10 text-blue-900 dark:bg-blue-500/10 dark:text-blue-300 flex items-center justify-center shadow-sm">
                      <FiGrid size={16} />
                    </div>
                    <div className="leading-tight">
                      <h2 className="text-[11px] font-bold tracking-[0.2em] text-neutral-text-muted titlecase opacity-70 truncate">
                        Admin Console
                      </h2>
                      <p className="text-[10px] text-neutral-text-muted/70">Control Center</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={onToggleMinimize}
                  className={`p-2 rounded-xl transition-all ${isMinimized ? 'bg-primary-main/10 text-primary-main shadow-sm' : 'text-neutral-text-muted hover:bg-neutral-bg hover:text-primary-main'}`}
                  title={isMinimized ? "Expand Menu" : "Collapse Menu"}
                >
                  <FiMenu size={18} />
                </button>
              </div>

              {/* Core */}
              {!isMinimized && (
                <div className="px-2">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-text-muted titlecase opacity-60">Core</p>
                </div>
              )}
              <NavLink
                to="/"
                onClick={() => {
                  setSelectedCluster('');
                  setViewMode('cluster');
                  setExpandedMenu(null);
                  onClose();
                }}
                title={isMinimized ? "Home" : ""}
                className={({ isActive }) =>
                  `flex items-center ${isMinimized ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all font-bold text-[12px] relative group ${isActive && !selectedCluster && expandedMenu !== 'dashboard'
                    ? 'bg-blue-900 text-white shadow-md active-nav-indicator'
                    : 'text-neutral-text-secondary hover:bg-blue-50 hover:text-blue-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-blue-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && !selectedCluster && expandedMenu !== 'dashboard' && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full bg-blue-500"></span>
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-all flex-shrink-0 ${isActive && !selectedCluster && expandedMenu !== 'dashboard'
                      ? 'bg-white/15 text-white'
                      : 'bg-gradient-to-br from-slate-100 to-white text-slate-600 group-hover:from-blue-50 group-hover:to-white group-hover:text-blue-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300 dark:group-hover:from-slate-800 dark:group-hover:to-slate-900 dark:group-hover:text-blue-300'
                      }`}>
                      <FiGrid size={18} />
                    </div>
                    {!isMinimized && <span>Home</span>}
                  </>
                )}
              </NavLink>

              {/* Manage */}
              {!isMinimized && (
                <div className="px-2 pt-1">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-text-muted titlecase opacity-60">Manage</p>
                </div>
              )}

              {/* Dashboard Menu with Clusters */}
              <NavMenuWithClusters
                icon={<FiPieChart size={18} />}
                label="Dashboard"
                to="/"
                menuKey="dashboard"
                clusters={clusters}
                selectedCluster={selectedCluster}
                setSelectedCluster={setSelectedCluster}
                viewMode={viewMode}
                setViewMode={setViewMode}
                setExpandedMenu={setExpandedMenu}
                expandedMenu={expandedMenu}
                toggleMenu={toggleMenu}
                onClose={onClose}
                isMinimized={isMinimized}
              />

              {/* Merchants Menu with Clusters */}
              <NavMenuWithClusters
                icon={<FiShoppingBag size={18} />}
                label="Merchants"
                to="/merchants"
                menuKey="merchants"
                clusters={clusters}
                selectedCluster={selectedCluster}
                setSelectedCluster={setSelectedCluster}
                viewMode={viewMode}
                setViewMode={setViewMode}
                setExpandedMenu={setExpandedMenu}
                expandedMenu={expandedMenu}
                toggleMenu={toggleMenu}
                onClose={onClose}
                isMinimized={isMinimized}
              />

            </div>
          </div>

          {/* Bottom Actions Fixed Area */}
          <div className={`mt-auto ${isMinimized ? 'px-2' : 'px-4'} pt-5 pb-6 space-y-2 border-t border-gray-200 bg-gray-50/70 dark:border-slate-800 dark:bg-slate-900/40`}>
            {!isMinimized && (
              <div className="px-2">
                <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-text-muted titlecase opacity-60">System</p>
              </div>
            )}
              <NavItem
                icon={<FiSettings size={18} />}
                label="Settings"
                to="/settings"
                onClose={onClose}
                onNavigate={() => {
                  setSelectedCluster('');
                  setViewMode('cluster');
                  setExpandedMenu(null);
                }}
                isMinimized={isMinimized}
              />

            <button
              onClick={logout}
              title={isMinimized ? "Logout" : ""}
              className={`w-full flex items-center ${isMinimized ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl transition-all font-bold text-[13px] text-gray-500 hover:bg-red-50 hover:text-red-600 group`}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-red-100 transition-colors flex-shrink-0">
                <FiLogOut size={16} />
              </div>
              {!isMinimized && <span>Logout</span>}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  onClose: () => void;
  onNavigate?: () => void;
  isMinimized: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, onClose, onNavigate, isMinimized }) => (
  <NavLink
    to={to}
    onClick={() => {
      onNavigate?.();
      onClose();
    }}
    title={isMinimized ? label : ""}
    className={({ isActive }) =>
      `flex items-center ${isMinimized ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all font-bold text-[12px] relative group ${isActive
        ? 'bg-blue-900 text-white shadow-md active-nav-indicator'
        : 'text-neutral-text-secondary hover:bg-blue-50 hover:text-blue-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-blue-300'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full bg-blue-500"></span>}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm transition-all flex-shrink-0 ${isActive
          ? 'bg-white/15 text-white'
          : 'bg-gradient-to-br from-slate-100 to-white text-slate-600 group-hover:from-blue-50 group-hover:to-white group-hover:text-blue-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300 dark:group-hover:from-slate-800 dark:group-hover:to-slate-900 dark:group-hover:text-blue-300'
          }`}>
          {icon}
        </div>
        {!isMinimized && <span>{label}</span>}
      </>
    )}
  </NavLink>
);

interface NavMenuWithClustersProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  menuKey: string;
  clusters: Array<{ id: string; name: string }>;
  selectedCluster: string | null;
  setSelectedCluster: (clusterId: string) => void;
  viewMode: 'overall' | 'cluster';
  setViewMode: (mode: 'overall' | 'cluster') => void;
  setExpandedMenu: React.Dispatch<React.SetStateAction<string | null>>;
  expandedMenu: string | null;
  toggleMenu: (menuKey: string) => void;
  onClose: () => void;
  isMinimized: boolean;
}

const NavMenuWithClusters: React.FC<NavMenuWithClustersProps> = ({
  icon,
  label,
  to,
  menuKey,
  clusters,
  selectedCluster,
  setSelectedCluster,
  viewMode,
  setViewMode,
  setExpandedMenu,
  expandedMenu,
  toggleMenu,
  onClose,
  isMinimized,
}) => {
  const navigate = useNavigate();
  const isExpanded = expandedMenu === menuKey;
  const clusterCount = clusters.length;

  const handleMenuClick = () => {
    setSelectedCluster('');
    setViewMode('cluster');
    setExpandedMenu(prev => (prev === menuKey ? null : menuKey));
    navigate(to);
    onClose();
  };

  const handleClusterSelect = (clusterId: string) => {
    setSelectedCluster(clusterId);
    setViewMode('cluster');
    setExpandedMenu(menuKey);
    navigate(to);
    onClose();
  };

  return (
    <div className="space-y-1.5">
      <div className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-1'} group`}>
        <button
          onClick={handleMenuClick}
          title={isMinimized ? label : ""}
          className={`relative flex items-center ${isMinimized ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all flex-1 text-left font-bold text-[12px] ${isExpanded && !selectedCluster
            ? 'bg-blue-900 text-white shadow-md'
            : 'text-neutral-text-secondary hover:bg-blue-50 hover:text-blue-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-blue-300'
            }`}
        >
          {isExpanded && !selectedCluster && (
            <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full bg-blue-500"></span>
          )}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm transition-all flex-shrink-0 ${isExpanded && !selectedCluster
            ? 'bg-white/15 text-white'
            : 'bg-gradient-to-br from-slate-100 to-white text-slate-600 group-hover:from-blue-50 group-hover:to-white group-hover:text-blue-700 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300 dark:group-hover:from-slate-800 dark:group-hover:to-slate-900 dark:group-hover:text-blue-300'
            }`}>
            {icon}
          </div>
          {!isMinimized && (
            <div className="flex items-center gap-2">
              <span>{label}</span>
              {clusterCount > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isExpanded && !selectedCluster ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'}`}>
                  {clusterCount}
                </span>
              )}
            </div>
          )}
        </button>
        {!isMinimized && (
          <button
            onClick={() => toggleMenu(menuKey)}
            className={`p-2 rounded-lg transition-all ${isExpanded ? 'text-blue-900 bg-blue-50' : 'text-neutral-text-secondary hover:text-blue-900 hover:bg-gray-100'
              }`}
          >
            {isExpanded ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}
          </button>
        )}
      </div>

      {/* Clusters Submenu */}
      {isExpanded && !isMinimized && (
        <div className="ml-8 pl-4 border-l-2 border-blue-100/70 space-y-1 py-1 animate-in slide-in-from-left-2 duration-300">
          {clusters.map(cluster => {
            const getClusterIcon = (id: string) => {
                switch (id.toLowerCase()) {
                  case 'app30a': return <FiDatabase size={12} />;
                  case 'app30b': return <FiCpu size={12} />;
                  case 'app30d': return <FiGrid size={12} />;
                  case 'dev-instance': return <FiGlobe size={12} />;
                  default: return <div className={`w-1.5 h-1.5 rounded-full ${selectedCluster === cluster.id ? 'bg-white' : 'bg-gray-300 group-hover/cluster:bg-blue-900'}`} />;
                }
            };

            const chipClass = selectedCluster === cluster.id
              ? 'bg-white/15 text-white'
              : 'bg-gradient-to-br from-slate-100 to-white text-slate-600 group-hover/cluster:from-blue-50 group-hover/cluster:to-white group-hover/cluster:text-blue-700';

            return (
              <button
                key={cluster.id}
                onClick={() => handleClusterSelect(cluster.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold titlecase tracking-[0.1em] transition-all flex items-center justify-between group/cluster ${selectedCluster === cluster.id
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-gray-500 hover:text-blue-900 hover:bg-blue-50'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm transition-all duration-300 ${chipClass}`}>
                    {getClusterIcon(cluster.id)}
                  </div>
                  <span className="truncate">{cluster.name}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${selectedCluster === cluster.id ? 'bg-green-400 animate-pulse' : 'bg-gray-300 group-hover/cluster:bg-blue-300'}`}></div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Sidebar;

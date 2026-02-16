import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiSettings, FiX, FiChevronDown, FiChevronRight, FiChevronLeft, FiLogOut, FiActivity, FiServer, FiGlobe, FiDatabase, FiCpu, FiTerminal, FiGrid, FiPieChart, FiShoppingBag, FiBarChart2, FiMenu } from 'react-icons/fi';
import { useMerchantContext } from '../context/MerchantContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMinimized, onToggleMinimize }) => {
  const { clusters, selectedCluster, setSelectedCluster, viewMode, setViewMode } = useMerchantContext();
  const { logout } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleMenu = (menuName: string) => {
    if (isMinimized) return; // Don't expand menus when minimized
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
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
        className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white border-r border-neutral-border transition-all duration-300 z-30 lg:relative lg:top-0 lg:translate-x-0 flex flex-col ${isMinimized ? 'w-20' : 'w-64'
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
          <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pt-6 pb-4">
            <div className={`space-y-1.5 ${isMinimized ? 'px-2' : 'px-4'}`}>

              {/* Proper Header with Toggle Icon */}
              <div className={`flex items-center ${isMinimized ? 'justify-center' : 'justify-between px-4'} mb-4 h-8`}>
                {!isMinimized && (
                  <h2 className="text-[10px] font-bold tracking-[0.2em] text-neutral-text-muted title-case opacity-70 truncate">
                    Admin Console
                  </h2>
                )}
                <button
                  onClick={onToggleMinimize}
                  className={`p-1.5 rounded-lg transition-all ${isMinimized ? 'bg-primary-main/10 text-primary-main shadow-sm' : 'text-neutral-text-muted hover:bg-neutral-bg hover:text-primary-main'}`}
                  title={isMinimized ? "Expand Menu" : "Collapse Menu"}
                >
                  <FiMenu size={18} />
                </button>
              </div>

              {/* Home Navigation */}
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
                  `flex items-center ${isMinimized ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg transition-all font-bold text-[12px] relative group ${isActive && !selectedCluster && expandedMenu !== 'dashboard'
                    ? 'bg-blue-900 text-white shadow-md active-nav-indicator'
                    : 'text-neutral-text-secondary hover:bg-blue-50 hover:text-blue-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${isActive && !selectedCluster && expandedMenu !== 'dashboard' ? 'bg-white/10' : 'bg-gray-100'}`}>
                      <FiGrid size={18} />
                    </div>
                    {!isMinimized && <span>Home</span>}
                  </>
                )}
              </NavLink>

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
                expandedMenu={expandedMenu}
                toggleMenu={toggleMenu}
                onClose={onClose}
                isMinimized={isMinimized}
              />
            </div>
          </div>

          {/* Bottom Actions Fixed Area */}
          <div className={`mt-auto ${isMinimized ? 'px-2' : 'px-4'} pt-6 pb-6 space-y-1.5 border-t border-gray-200 bg-gray-50/50`}>
            <NavItem
              icon={<FiSettings size={18} />}
              label="Settings"
              to="/settings"
              onClose={onClose}
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
  isMinimized: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, onClose, isMinimized }) => (
  <NavLink
    to={to}
    onClick={onClose}
    title={isMinimized ? label : ""}
    className={({ isActive }) =>
      `flex items-center ${isMinimized ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg transition-all font-bold text-[12px] relative group ${isActive
        ? 'bg-blue-900 text-white shadow-md active-nav-indicator'
        : 'text-neutral-text-secondary hover:bg-blue-50 hover:text-blue-900'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${isActive ? 'bg-white/10' : 'bg-gray-100'}`}>
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
  expandedMenu,
  toggleMenu,
  onClose,
  isMinimized,
}) => {
  const navigate = useNavigate();
  const isExpanded = expandedMenu === menuKey;

  const handleMenuClick = () => {
    setSelectedCluster('');
    setViewMode('cluster');
    navigate(to);
    onClose();
    if (!isExpanded) {
      toggleMenu(menuKey);
    }
  };

  const handleClusterSelect = (clusterId: string) => {
    setSelectedCluster(clusterId);
    navigate(to);
    onClose();
  };

  return (
    <div className="space-y-1">
      <div className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-1'} group`}>
        <button
          onClick={handleMenuClick}
          title={isMinimized ? label : ""}
          className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg transition-all flex-1 text-left font-bold text-[12px] ${isExpanded && !selectedCluster
            ? 'bg-blue-900 text-white shadow-md'
            : 'text-neutral-text-secondary hover:bg-blue-50 hover:text-blue-900'
            }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${isExpanded && !selectedCluster ? 'bg-white/10' : 'bg-gray-100'
            }`}>
            {icon}
          </div>
          {!isMinimized && <span>{label}</span>}
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
        <div className="ml-8 pl-4 border-l-2 border-blue-100 space-y-1 py-1 animate-in slide-in-from-left-2 duration-300">
          {clusters.map(cluster => {
            const getClusterIcon = (id: string) => {
              switch (id.toLowerCase()) {
                case 'it-app': return <FiServer size={12} />;
                case 'app6a': return <FiGlobe size={12} />;
                case 'app30a': return <FiDatabase size={12} />;
                case 'app30b': return <FiCpu size={12} />;
                case 'app6e': return <FiTerminal size={12} />;
                default: return <div className={`w-1.5 h-1.5 rounded-full ${selectedCluster === cluster.id ? 'bg-white' : 'bg-gray-300 group-hover/cluster:bg-blue-600'}`} />;
              }
            };

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
                  <div className={`transition-all duration-300 ${selectedCluster === cluster.id ? 'text-white' : 'text-gray-400 group-hover/cluster:text-blue-600'}`}>
                    {getClusterIcon(cluster.id)}
                  </div>
                  <span className="truncate">{cluster.name}</span>
                </div>
                {selectedCluster === cluster.id && (
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Sidebar;

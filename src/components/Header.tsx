import React from 'react';
import { FiMenu, FiLogOut } from 'react-icons/fi';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onLogout }) => {
  return (
    <header className="bg-white border-b border-neutral-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3 w-full">
        {/* Left Section: Logo, Title, and Mobile Menu */}
        <div className="flex items-center gap-4 md:gap-6">
          <img
            src="https://framerusercontent.com/images/rxRzehsbTWOIxWQ9b0ytKSM1ZjY.png?scale-down-to=512"
            alt="Logo"
            className="h-8 w-auto object-contain"
          />

          {/* Moved Title here, added border/divider for visual flair if desired */}
          <h1 className="text-xl font-bold text-neutral-text-main tracking-tight border- pl-14 border-neutral-200">
            Global Admin Portal
          </h1>

          <button
            onClick={onToggleSidebar}
            className="text-neutral-text-secondary hover:text-primary-main lg:hidden p-2 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <FiMenu size={22} />
          </button>
        </div>

        {/* Right Section: Empty or Reserved for future use */}
        <div className="flex items-center gap-4">
          {/* Logout button removed as requested - now available in Sidebar */}
        </div>
      </div>
    </header>
  );
};

export default Header;
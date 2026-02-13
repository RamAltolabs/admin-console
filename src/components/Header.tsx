import React from 'react';
import { FiMenu } from 'react-icons/fi';
import GlobalSearch from './GlobalSearch';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onLogout }) => {
  return (
    <header className="bg-white border-b border-neutral-border sticky top-0 z-40 h-14">
      <div className="flex items-center justify-between px-4 h-full w-full">
        {/* Left Section: Logo, Title, and Mobile Menu */}
        <div className="flex items-center gap-4 flex-1">
          <img
            src="https://framerusercontent.com/images/rxRzehsbTWOIxWQ9b0ytKSM1ZjY.png?scale-down-to=512"
            alt="Logo"
            className="h-6 w-auto object-contain flex-shrink-0"
          />

          <h1 className="text-base font-bold text-neutral-text-main tracking-tight pl-4 border-l border-neutral-200 hidden md:block flex-shrink-0">
            Admin Portal
          </h1>

          <button
            onClick={onToggleSidebar}
            className="text-neutral-text-secondary hover:text-primary-main lg:hidden p-2 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <FiMenu size={22} />
          </button>

          <GlobalSearch />
        </div>

        {/* Right Section: Empty or Reserved for future use */}
        <div className="flex items-center gap-4">
          {/* Support for future desktop navigation or user profile can go here */}
        </div>
      </div>
    </header>
  );
};

export default Header;
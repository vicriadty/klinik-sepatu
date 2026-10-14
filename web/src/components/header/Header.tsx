import { useState } from "react";
import { Link } from "react-router";
import { ThemeToggleButton } from "../common/ThemeToggleButton";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";

interface HeaderProps {
  onClick?: () => void;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClick, onToggle }) => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-99999 flex w-full border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            aria-label="Open sidebar"
            className="focus-ring block h-10 w-10 text-gray-500 lg:hidden dark:text-gray-400"
            onClick={onToggle}
          >
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
              <path
                d="M1 1h14M1 6h14M1 11h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            aria-label="Toggle sidebar"
            className="focus-ring hidden h-10 w-10 items-center justify-center rounded-lg border-gray-200 text-gray-500 lg:flex lg:h-11 lg:w-11 lg:border dark:border-gray-800 dark:text-gray-400"
            onClick={onClick}
          >
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
              <path
                d="M1 1h14M1 6h14M1 11h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <Link to="/" className="lg:hidden" aria-label="Go to dashboard">
            <img className="dark:hidden" src="./images/logo/logo.svg" alt="Klinik Sepatu" />
            <img className="hidden dark:block" src="./images/logo/logo-dark.svg" alt="Klinik Sepatu" />
          </Link>

          <button
            aria-label="Open header menu"
            aria-controls="header-actions"
            aria-expanded={isApplicationMenuOpen}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
            onClick={() => setApplicationMenuOpen((open) => !open)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 12h.01M12 12h.01M18 12h.01"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div
          id="header-actions"
          className={`${isApplicationMenuOpen ? "flex" : "hidden"} w-full items-center justify-between gap-4 px-5 py-4 shadow-theme-md lg:flex lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;

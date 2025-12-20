/**
 * Account Tab List Component
 * Container component for managing multiple account tabs with keyboard navigation
 */

import React, { useEffect, useRef } from "react";
import { UserEntity, Warning } from "../types";
import { AccountTab } from "./AccountTab";

/**
 * Props for AccountTabList component
 */
interface AccountTabListProps {
  accounts: UserEntity[];
  activeTabId: string;
  onTabSelect: (userId: string) => void;
  warnings: Warning[];
}

/**
 * Account Tab List component for managing multiple account tabs
 */
export const AccountTabList: React.FC<AccountTabListProps> = ({
  accounts,
  activeTabId,
  onTabSelect,
  warnings,
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  // Get warnings for a specific user
  const getWarningsForUser = (userId: string): Warning[] => {
    const user = accounts.find((u) => u.userId === userId);
    if (!user) return [];

    return warnings.filter((warning) =>
      user.pages.includes(warning.pageNumber || 0)
    );
  };

  // Handle keyboard navigation between tabs
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const currentIndex = accounts.findIndex(
      (account) => account.userId === activeTabId
    );

    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : accounts.length - 1;
        break;
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        nextIndex = currentIndex < accounts.length - 1 ? currentIndex + 1 : 0;
        break;
      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        event.preventDefault();
        nextIndex = accounts.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      onTabSelect(accounts[nextIndex].userId);
    }
  };

  // Focus management for accessibility
  useEffect(() => {
    const activeTabElement = tabListRef.current?.querySelector(
      `#account-tab-${activeTabId}`
    ) as HTMLElement;

    if (
      activeTabElement &&
      document.activeElement?.closest(".account-tab-list")
    ) {
      activeTabElement.focus();
    }
  }, [activeTabId]);

  return (
    <div
      ref={tabListRef}
      className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative focus-within:outline-2 focus-within:outline-blue-500 focus-within:-outline-offset-2 focus-within:z-10 md:flex-col md:overflow-x-visible md:overflow-y-auto md:max-h-[300px] md:border-b-0 md:border-r md:border-gray-200"
      role="tablist"
      aria-label="Bank accounts"
      onKeyDown={handleKeyDown}
    >
      {accounts.map((account) => (
        <AccountTab
          key={account.userId}
          account={account}
          isActive={activeTabId === account.userId}
          onSelect={() => onTabSelect(account.userId)}
          warnings={getWarningsForUser(account.userId)}
        />
      ))}
    </div>
  );
};

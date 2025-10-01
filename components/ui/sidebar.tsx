"use client";

import { useEffect, useRef, useState } from "react";
import { useAppProvider } from "@/app/app-provider";
import { useSelectedLayoutSegments } from "next/navigation";
import { useWindowWidth } from "@/components/utils/use-window-width";
import SidebarLinkGroup from "./sidebar-link-group";
import SidebarLink from "./sidebar-link";
import Logo from "./logo";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";
import {
  LayoutDashboard,
  FileText,
  Target,
  Megaphone,
  Book,
  Shield,
  BookOpen,
  ToggleLeft,
  Info,
  Settings,
  ChevronDown,
  UserCog,
} from "lucide-react";

// Navigation constants
interface NavItem {
  id: string;
  title: string;
  href?: string;
  segment: string;
  icon: React.ReactNode;
  children?: NavItem[];
  badge?: string;
}

const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    segment: "dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  {
    id: "reports",
    title: "Reports",
    segment: "reports",
    icon: <FileText size={16} />,
    children: [
      {
        id: "revenue-impact",
        title: "Revenue Impact",
        href: "/reports/revenue-impact",
        segment: "revenue-impact",
        icon: null,
      },
      {
        id: "model-performance",
        title: "Model Performance",
        href: "/reports/model-performance",
        segment: "model-performance",
        icon: null,
      },
      {
        id: "advisor-performance",
        title: "Advisor Performance",
        href: "/reports/advisor-performance",
        segment: "advisor-performance",
        icon: null,
      },
      {
        id: "missed-opportunities",
        title: "Missed Opportunities",
        href: "/reports/missed-opportunities",
        segment: "missed-opportunities",
        icon: null,
      },
      {
        id: "maintenance-sales",
        title: "Maintenance Sales",
        href: "/reports/maintenance-sales",
        segment: "maintenance-sales",
        icon: null,
      },
      {
        id: "specialty",
        title: "Specialty (*)",
        href: "/reports/specialty",
        segment: "specialty",
        icon: null,
      },
      {
        id: "tech-performance",
        title: "Tech Performance",
        href: "/reports/tech-performance",
        segment: "tech-performance",
        icon: null,
      },
      {
        id: "labor-performance",
        title: "Labor Performance",
        href: "/reports/labor-performance",
        segment: "labor-performance",
        icon: null,
      },
      {
        id: "parts-performance",
        title: "Parts Performance",
        href: "/reports/parts-performance",
        segment: "parts-performance",
        icon: null,
      },
      {
        id: "custom-reports",
        title: "Custom Reports",
        href: "/reports/custom-reports",
        segment: "custom-reports",
        icon: null,
      },
    ],
  },
  {
    id: "forecast-ai",
    title: "Forecast AI",
    segment: "forecast-ai",
    icon: <Target size={16} />,
    children: [
      {
        id: "users-tabs",
        title: "Users - Tabs",
        href: "/forecast-ai/users-tabs",
        segment: "users-tabs",
        icon: null,
      },
      {
        id: "users-tiles",
        title: "Users - Tiles",
        href: "/forecast-ai/users-tiles",
        segment: "users-tiles",
        icon: null,
      },
      {
        id: "profile",
        title: "Profile",
        href: "/forecast-ai/profile",
        segment: "profile",
        icon: null,
      },
      {
        id: "feed",
        title: "Feed",
        href: "/forecast-ai/feed",
        segment: "feed",
        icon: null,
      },
      {
        id: "forum",
        title: "Forum",
        href: "/forecast-ai/forum",
        segment: "forum",
        icon: null,
      },
      {
        id: "forum-post",
        title: "Forum - Post",
        href: "/forecast-ai/forum/post",
        segment: "post",
        icon: null,
      },
      {
        id: "meetups",
        title: "Meetups",
        href: "/forecast-ai/meetups",
        segment: "meetups",
        icon: null,
      },
      {
        id: "meetups-post",
        title: "Meetups - Post",
        href: "/forecast-ai/meetups/post",
        segment: "post",
        icon: null,
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    segment: "marketing",
    icon: <Megaphone size={16} />,
  },
  {
    id: "cms",
    title: "CMS",
    segment: "cms",
    icon: <Book size={16} />,
  },
  {
    id: "warranty-ai",
    title: "Warranty AI",
    segment: "warranty-ai",
    icon: <Shield size={16} />,
  },
  {
    id: "learning-hub",
    title: "Learning Hub",
    href: "/learning-hub",
    segment: "learning-hub",
    icon: <BookOpen size={16} />,
  },
  {
    id: "dealer-settings",
    title: "Dealer Settings",
    href: "/dealer-settings",
    segment: "dealer-settings",
    icon: <ToggleLeft size={16} />,
  },
  {
    id: "about",
    title: "About",
    href: "/about",
    segment: "about",
    icon: <Info size={16} />,
  },
  {
    id: "administration",
    title: "Administration",
    href: "/administration",
    segment: "administration",
    icon: <UserCog size={16} />,
  },
  {
    id: "settings",
    title: "Settings",
    segment: "settings",
    icon: <Settings size={16} />,
  },
];

export default function Sidebar({
  variant = "default",
}: {
  variant?: "default" | "v2";
}) {
  const sidebar = useRef<HTMLDivElement>(null);
  const { sidebarOpen, setSidebarOpen, sidebarExpanded, setSidebarExpanded } =
    useAppProvider();
  const segments = useSelectedLayoutSegments();
  const breakpoint = useWindowWidth();
  const expandOnly =
    !sidebarExpanded && breakpoint && breakpoint >= 1024 && breakpoint < 1536;
  
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  // Helper function to render navigation items
  const renderNavItem = (item: NavItem) => {
    const isActive = segments.includes(item.segment);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      // Render parent item with children
      return (
        <SidebarLinkGroup key={item.id} open={isActive}>
          {(handleClick, open) => (
            <>
              <a
                href="#0"
                className={`block text-gray-800 dark:text-gray-100 truncate transition ${
                  isActive ? "" : "hover:text-gray-900 dark:hover:text-white"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  expandOnly ? setSidebarExpanded(true) : handleClick();
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`shrink-0 fill-current ${
                        isActive
                          ? "text-violet-500"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                      {item.title}
                    </span>
                  </div>
                  {/* Only show collapse icon if there are children */}
                  <div className="flex shrink-0 ml-2">
                    <ChevronDown
                      size={12}
                      className={`shrink-0 ml-1 text-gray-400 dark:text-gray-500 transition-transform ${
                        open && "rotate-180"
                      }`}
                    />
                  </div>
                </div>
              </a>
              <div className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                <ul className={`pl-8 mt-1 ${!open && "hidden"}`}>
                  {item.children?.map((child) => (
                    <li key={child.id} className="mb-1 last:mb-0">
                      <SidebarLink href={child.href || "#"}>
                        <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                          {child.title}
                        </span>
                      </SidebarLink>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </SidebarLinkGroup>
      );
    } else {
      // Render single item without children
      return (
        <li
          key={item.id}
          className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${
            isActive &&
            "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]"
          }`}
        >
          <SidebarLink href={item.href || "#"}>
            <div className="flex items-center justify-between">
              <div className="grow flex items-center">
                <div
                  className={`shrink-0 fill-current ${
                    isActive
                      ? "text-violet-500"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-sm font-medium ml-4 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                  {item.title}
                </span>
              </div>
              {/* Badge */}
              {item.badge && (
                <div className="flex shrink-0 ml-2">
                  <span className="inline-flex items-center justify-center h-5 text-xs font-medium text-white bg-violet-400 px-2 rounded-sm">
                    {item.badge}
                  </span>
                </div>
              )}
            </div>
          </SidebarLink>
        </li>
      );
    }
  };

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: { target: EventTarget | null }): void => {
      if (!sidebar.current) return;
      if (!sidebarOpen || sidebar.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: { keyCode: number }): void => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  return (
    <div className={`min-w-fit ${sidebarExpanded ? "sidebar-expanded" : ""}`}>
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`flex lg:flex! flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-[100dvh] overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:w-64! shrink-0 bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        } ${
          variant === "v2"
            ? "border-r border-gray-200 dark:border-gray-700/60"
            : "rounded-r-2xl shadow-xs"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-10 pr-3 sm:px-0">
          {/* Close button */}
          <button
            className="lg:hidden text-gray-500 hover:text-gray-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
          {/* Logo */}
          <Logo className="w-full" expanded={!expandOnly} />
        </div>

        {/* Links */}
        <div className="space-y-8">
          {/* Pages group */}
          <div>
            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3">
              <span
                className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6"
                aria-hidden="true"
              >
                •••
              </span>
              <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">
                Pages
              </span>
            </h3>
            <ul className="mt-3">
              {NAVIGATION_ITEMS.map((item) => {
                // Hide Administration menu for non-super admins
                if (item.id === "administration" && !isSuperAdmin) {
                  return null;
                }
                return renderNavItem(item);
              })}
            </ul>
          </div>
        </div>

        {/* Expand / collapse button */}
        <div className="pt-3 hidden lg:inline-flex 2xl:hidden justify-end mt-auto">
          <div className="w-12 pl-4 pr-3 py-2">
            <button
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
            >
              <span className="sr-only">Expand / collapse sidebar</span>
              <svg
                className="shrink-0 fill-current text-gray-400 dark:text-gray-500 sidebar-expanded:rotate-180"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <path d="M15 16a1 1 0 0 1-1-1V1a1 1 0 1 1 2 0v14a1 1 0 0 1-1 1ZM8.586 7H1a1 1 0 1 0 0 2h7.586l-2.793 2.793a1 1 0 1 0 1.414 1.414l4.5-4.5A.997.997 0 0 0 12 8.01M11.924 7.617a.997.997 0 0 0-.217-.324l-4.5-4.5a1 1 0 0 0-1.414 1.414L8.586 7M12 7.99a.996.996 0 0 0-.076-.373Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useAppProvider } from "@/app/app-provider";
import { useSelectedLayoutSegments } from "next/navigation";
import { useWindowWidth } from "@/components/utils/use-window-width";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";
import SidebarLinkGroup from "./sidebar-link-group";
import SidebarLink from "./sidebar-link";
import Logo from "./logo";
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

interface SavedReport {
  id: string;
  name: string;
  reportType: string;
  visibility: string;
}

// Navigation constants
interface NavItem {
  id: string;
  title: string;
  href?: string;
  segment: string;
  icon: React.ReactNode;
  children?: NavItem[];
  badge?: string;
  requiredRoles?: UserRole[];
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
        id: "ro-performance-summary",
        title: "Custom RO",
        href: "/reports/ro-performance-summary",
        segment: "ro-performance-summary",
        icon: null,
      },
      {
        id: "opcode-performance-summary",
        title: "Custom Opcode",
        href: "/reports/opcode-performance-summary",
        segment: "opcode-performance-summary",
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
    href: "/warranty-ai",
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
    title: "Admin Panel",
    href: "/administration",
    segment: "administration",
    icon: <UserCog size={16} />,
    requiredRoles: [UserRole.SUPER_ADMIN],
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
  const { user, getAuthToken } = useAuth();
  const segments = useSelectedLayoutSegments();
  const breakpoint = useWindowWidth();
  const expandOnly =
    !sidebarExpanded && breakpoint && breakpoint >= 1024 && breakpoint < 1536;
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [myReportsOpen, setMyReportsOpen] = useState<boolean>(false);

  // Fetch saved reports
  useEffect(() => {
    const fetchSavedReports = async () => {
      if (!user) return;

      try {
        const token = await getAuthToken();
        const response = await fetch("/api/reports/saved", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setSavedReports(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching saved reports:", error);
      }
    };

    fetchSavedReports();

    // Listen for custom event to refresh saved reports
    const handleRefreshReports = () => {
      fetchSavedReports();
    };

    window.addEventListener("refreshSavedReports", handleRefreshReports);

    return () => {
      window.removeEventListener("refreshSavedReports", handleRefreshReports);
    };
  }, [user, getAuthToken]);

  // Filter navigation items based on user role and add saved reports
  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => {
        // If no required roles specified, show to all users
        if (!item.requiredRoles || item.requiredRoles.length === 0) {
          return true;
        }

        // Check if user has any of the required roles
        if (!user) return false;
        return item.requiredRoles.includes(user.role);
      })
      .map((item) => {
        // Handle Reports section: add My Reports subsection and public reports
        if (item.id === "reports" && item.children) {
          // Get local and public reports - ensure strict filtering
          const localReports = savedReports.filter(
            (report) => report.visibility?.toLowerCase() === "local"
          );
          const publicReports = savedReports.filter(
            (report) => report.visibility?.toLowerCase() === "public"
          );

          // Build the children array: base items, public reports, then My Reports (pinned at bottom)
          const children = [...item.children];

          // Add public reports as separate items first (above My Reports)
          const publicReportItems: NavItem[] = publicReports.map((report) => ({
            id: `public-${report.id}`,
            title: report.name,
            href: `/reports/saved/${report.id}`,
            segment: report.id,
            icon: null,
          }));
          children.push(...publicReportItems);

          // Only add My Reports section if there are local reports (pinned at bottom)
          if (localReports.length > 0) {
            // Create My Reports subsection with ONLY local reports
            const myReportsSection: NavItem = {
              id: "my-reports",
              title: "My Reports",
              segment: "my-reports",
              icon: null,
              children: localReports.map((report) => ({
                id: `local-${report.id}`,
                title: report.name,
                href: `/reports/saved/${report.id}`,
                segment: report.id,
                icon: null,
              })),
            };
            children.push(myReportsSection);
          }

          return {
            ...item,
            children,
          };
        }

        // Recursively filter children if they exist
        if (item.children) {
          return {
            ...item,
            children: filterNavItems(item.children),
          };
        }
        return item;
      });
  };

  const filteredNavItems = filterNavItems(NAVIGATION_ITEMS);

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
                  {item.children?.map((child) => {
                    const childHasChildren =
                      child.children && child.children.length > 0;
                    const childIsActive = segments.includes(child.segment);
                    const isMyReports = child.id === "my-reports";

                    if (childHasChildren) {
                      // Special handling for My Reports - render without SidebarLinkGroup wrapper to avoid extra padding
                      if (isMyReports) {
                        return (
                          <li key={child.id} className="mb-1 last:mb-0">
                            <a
                              href="#0"
                              className={`block text-gray-800 dark:text-gray-100 truncate transition text-sm ${
                                childIsActive
                                  ? ""
                                  : "hover:text-gray-900 dark:hover:text-white"
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                setMyReportsOpen(!myReportsOpen);
                              }}
                            >
                              <div className="flex items-center justify-between py-1">
                                <span className="font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                  {child.title}
                                </span>
                                <ChevronDown
                                  size={10}
                                  className={`shrink-0 ml-1 text-gray-400 dark:text-gray-500 transition-transform ${
                                    myReportsOpen && "rotate-180"
                                  }`}
                                />
                              </div>
                            </a>
                            <ul
                              className={`pl-4 mt-1 ${
                                !myReportsOpen && "hidden"
                              }`}
                            >
                              {child.children?.map((grandchild) => (
                                <li
                                  key={grandchild.id}
                                  className="mb-1 last:mb-0"
                                >
                                  <SidebarLink href={grandchild.href || "#"}>
                                    <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                      {grandchild.title}
                                    </span>
                                  </SidebarLink>
                                </li>
                              ))}
                            </ul>
                          </li>
                        );
                      }

                      // Render other nested expandable items with SidebarLinkGroup
                      return (
                        <li key={child.id} className="mb-1 last:mb-0">
                          <SidebarLinkGroup open={childIsActive}>
                            {(handleChildClick, childOpen) => (
                              <>
                                <a
                                  href="#0"
                                  className={`block text-gray-800 dark:text-gray-100 truncate transition text-sm ${
                                    childIsActive
                                      ? ""
                                      : "hover:text-gray-900 dark:hover:text-white"
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleChildClick();
                                  }}
                                >
                                  <div className="flex items-center justify-between py-1">
                                    <span className="font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                      {child.title}
                                    </span>
                                    <ChevronDown
                                      size={10}
                                      className={`shrink-0 ml-1 text-gray-400 dark:text-gray-500 transition-transform ${
                                        childOpen && "rotate-180"
                                      }`}
                                    />
                                  </div>
                                </a>
                                <ul
                                  className={`pl-4 mt-1 ${
                                    !childOpen && "hidden"
                                  }`}
                                >
                                  {child.children?.map((grandchild) => (
                                    <li
                                      key={grandchild.id}
                                      className="mb-1 last:mb-0"
                                    >
                                      <SidebarLink
                                        href={grandchild.href || "#"}
                                      >
                                        <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                                          {grandchild.title}
                                        </span>
                                      </SidebarLink>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </SidebarLinkGroup>
                        </li>
                      );
                    } else {
                      // Render normal child item
                      return (
                        <li key={child.id} className="mb-1 last:mb-0">
                          <SidebarLink href={child.href || "#"}>
                            <span className="text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200">
                              {child.title}
                            </span>
                          </SidebarLink>
                        </li>
                      );
                    }
                  })}
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
              {filteredNavItems.map((item) => renderNavItem(item))}
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

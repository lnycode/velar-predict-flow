import { NavLink, useLocation } from "react-router-dom";
import { 
  Orbit, 
  History, 
  Settings2, 
  Calendar,
  TrendingUp,
  Zap,
  Satellite,
  Globe
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: Orbit,
    description: "Overview & Status"
  },
  { 
    title: "Calendar", 
    url: "/calendar", 
    icon: Calendar,
    description: "Episode Timeline"
  },
  { 
    title: "History", 
    url: "/history", 
    icon: History,
    description: "Data Archives"
  },
  { 
    title: "Risk Estimation", 
    url: "/forecast", 
    icon: Satellite,
    description: "Pattern-based Forecasting"
  },
  { 
    title: "Analytics", 
    url: "/analytics", 
    icon: TrendingUp,
    description: "Pattern Recognition"
  },
  { 
    title: "Insights", 
    url: "/insights", 
    icon: Zap,
    description: "Decision Support"
  },
  { 
    title: "Settings", 
    url: "/settings", 
    icon: Settings2,
    description: "Configuration"
  }
];

export function AppSidebar() {
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClasses = (path: string) => {
    const baseClasses = "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden";
    
    if (isActive(path)) {
      return `${baseClasses} bg-primary/20 text-primary border border-primary/30 shadow-glow`;
    }
    
    return `${baseClasses} text-gray-300 hover:text-white hover:bg-primary/10`;
  };

  return (
    <Sidebar className="border-r border-primary/20 bg-black shadow-2xl">
      <SidebarContent className="p-4 bg-black">
        {/* Header */}
        <div className="mb-6">
          {sidebarOpen && (
            <div className="animate-fade-in-up">
              <h1 className="text-xl font-bold text-white">Velar</h1>
              <p className="text-xs text-cyan-400">Decision Support Tool</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={getNavClasses(item.url)}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <div className="flex flex-col min-w-0 animate-fade-in-up">
                          <span className="font-medium truncate">{item.title}</span>
                          <span className="text-xs opacity-70 truncate">
                            {item.description}
                          </span>
                        </div>
                      )}
                      
                      {/* Active indicator */}
                      {isActive(item.url) && (
                        <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-xl" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        {sidebarOpen && (
          <div className="mt-auto pt-6 animate-fade-in-up">
            <div className="text-xs text-gray-400 text-center">
              <p className="text-cyan-400 font-medium">Velar v3.0</p>
              <p className="mt-1">Data-driven Decision Support</p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
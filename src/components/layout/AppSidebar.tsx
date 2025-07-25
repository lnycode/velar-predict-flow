import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  Calendar,
  BarChart3,
  Brain,
  CloudRain
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
    icon: LayoutDashboard,
    description: "Overview & Live Alerts"
  },
  { 
    title: "Calendar", 
    url: "/calendar", 
    icon: Calendar,
    description: "Track Episodes"
  },
  { 
    title: "History", 
    url: "/history", 
    icon: History,
    description: "Past Records"
  },
  { 
    title: "Forecast", 
    url: "/forecast", 
    icon: CloudRain,
    description: "7-Day Prediction"
  },
  { 
    title: "Analytics", 
    url: "/analytics", 
    icon: BarChart3,
    description: "Pattern Analysis"
  },
  { 
    title: "AI Insights", 
    url: "/insights", 
    icon: Brain,
    description: "Smart Recommendations"
  },
  { 
    title: "Settings", 
    url: "/settings", 
    icon: Settings,
    description: "Preferences"
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
      return `${baseClasses} bg-gradient-primary text-primary-foreground shadow-glow`;
    }
    
    return `${baseClasses} text-muted-foreground hover:text-foreground hover:bg-secondary/50`;
  };

  return (
    <Sidebar className="border-r border-border/50 bg-card/30 backdrop-blur-xl">
      <SidebarContent className="p-4">
        {/* Velar Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center animate-pulse-glow">
              <span className="text-xl font-bold text-primary-foreground">V</span>
            </div>
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in-up">
              <h1 className="text-xl font-bold text-foreground">Velar</h1>
              <p className="text-xs text-muted-foreground">Migraine Intelligence</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold mb-4">
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
            <div className="text-xs text-muted-foreground text-center">
              <p>Velar AI v2.0</p>
              <p className="mt-1">Advanced Migraine Prediction</p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
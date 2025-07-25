import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-bg">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 h-16 border-b border-border/50 bg-card/30 backdrop-blur-xl">
            <div className="flex items-center justify-between h-full px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden p-2 hover:bg-secondary/50 rounded-md">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                
                <div className="hidden sm:block">
                  <h2 className="text-lg font-semibold text-foreground">
                    Migraine Intelligence Dashboard
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Real-time weather-based predictions
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Emergency Alert Badge */}
                <div className="hidden md:flex items-center gap-2 bg-warning/20 text-warning px-3 py-1 rounded-full border border-warning/30">
                  <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                  <span className="text-xs font-medium">High Risk Alert</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
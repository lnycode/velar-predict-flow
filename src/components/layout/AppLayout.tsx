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
          <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors">
                  <Menu className="w-5 h-5 text-white" />
                </SidebarTrigger>
                
                <div className="hidden sm:block">
                  <h2 className="text-lg font-bold text-white bg-gradient-primary bg-clip-text text-transparent">
                    Velar Neural Interface
                  </h2>
                  <p className="text-sm text-cyan-400">
                    Advanced Predictive Intelligence System
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Status Indicator */}
                <div className="hidden md:flex items-center gap-2 bg-gradient-primary/20 text-cyan-400 px-4 py-2 rounded-full border border-cyan-400/30 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse-glow" />
                  <span className="text-xs font-medium">Neural Network Active</span>
                </div>
                
                {/* Risk Alert */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 px-3 py-1.5 rounded-full border border-orange-500/30">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
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
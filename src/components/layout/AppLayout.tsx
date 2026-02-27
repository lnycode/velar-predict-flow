import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LanguageSelector } from "./LanguageSelector";
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
                    Velar
                  </h2>
                  <p className="text-sm text-cyan-400">
                    Data-driven Migraine Risk Estimation
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <LanguageSelector />
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
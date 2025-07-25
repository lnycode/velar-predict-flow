import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Add Entry",
      description: "Log new migraine episode",
      icon: Plus,
      onClick: () => navigate('/calendar'),
      variant: "default" as const
    },
    {
      title: "View Report",
      description: "Generate PDF report",
      icon: FileText,
      onClick: () => navigate('/history'),
      variant: "secondary" as const
    },
    {
      title: "Calendar",
      description: "Track patterns",
      icon: Calendar,
      onClick: () => navigate('/calendar'),
      variant: "outline" as const
    },
    {
      title: "Analytics",
      description: "Detailed insights",
      icon: TrendingUp,
      onClick: () => navigate('/analytics'),
      variant: "outline" as const
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action, index) => (
        <Button
          key={action.title}
          variant={action.variant}
          className={`h-auto p-4 flex-col gap-2 animate-scale-in ${
            action.variant === 'default' ? 'velar-button-primary' : ''
          }`}
          style={{ animationDelay: `${index * 100}ms` }}
          onClick={action.onClick}
        >
          <action.icon className="w-6 h-6" />
          <div className="text-center">
            <div className="font-semibold text-sm">{action.title}</div>
            <div className="text-xs opacity-70">{action.description}</div>
          </div>
        </Button>
      ))}
    </div>
  );
}
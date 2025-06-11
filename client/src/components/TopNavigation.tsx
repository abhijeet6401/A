import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Podcast, 
  MicOff, 
  Crown, 
  User, 
  LogOut 
} from "lucide-react";
import { removeAuthToken } from "@/lib/authUtils";

interface TopNavigationProps {
  activeView: string;
  setActiveView: (view: "feed" | "interviews" | "fundManager" | "profile") => void;
  user: any;
}

export default function TopNavigation({ activeView, setActiveView, user }: TopNavigationProps) {
  const handleLogout = () => {
    removeAuthToken();
    window.location.reload();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Research Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("feed")}
              className={`nav-btn ${activeView === "feed" ? "active" : ""}`}
            >
              <Podcast className="w-4 h-4 mr-2" />
              Feed
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("interviews")}
              className={`nav-btn ${activeView === "interviews" ? "active" : ""}`}
            >
              <MicOff className="w-4 h-4 mr-2" />
              Interviews
            </Button>
            
            {user?.role === "fund_manager" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView("fundManager")}
                className={`nav-btn ${activeView === "fundManager" ? "active" : ""}`}
              >
                <Crown className="w-4 h-4 mr-2" />
                Fund Manager
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("profile")}
              className={`nav-btn ${activeView === "profile" ? "active" : ""}`}
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {user?.firstName} {user?.lastName}
            </span>
            <Badge variant={user?.role === "fund_manager" ? "default" : "secondary"}>
              {user?.role === "fund_manager" ? "Fund Manager" : "Analyst"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

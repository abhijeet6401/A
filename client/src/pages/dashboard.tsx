import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import TopNavigation from "@/components/TopNavigation";
import FeedView from "@/components/FeedView";
import InterviewsView from "@/components/InterviewsView";
import FundManagerView from "@/components/FundManagerView";
import ProfileView from "@/components/ProfileView";

type ViewType = "feed" | "interviews" | "fundManager" | "profile";

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewType>("feed");
  const { user } = useAuth();

  const renderView = () => {
    switch (activeView) {
      case "feed":
        return <FeedView />;
      case "interviews":
        return <InterviewsView />;
      case "fundManager":
        return <FundManagerView />;
      case "profile":
        return <ProfileView />;
      default:
        return <FeedView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation 
        activeView={activeView} 
        setActiveView={setActiveView} 
        user={user}
      />
      {renderView()}
    </div>
  );
}

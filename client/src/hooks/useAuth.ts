import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/authUtils";

export function useAuth() {
  const token = getAuthToken();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!token,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!token,
  };
}

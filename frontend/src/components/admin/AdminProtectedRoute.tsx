import { Navigate } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'moderator';
}

export function AdminProtectedRoute({ 
  children, 
  requiredRole = 'admin' 
}: AdminProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, isAdmin, isModerator, isLoading: roleLoading } = useAdminRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const hasAccess = requiredRole === 'admin' ? isAdmin : isModerator;

  if (!hasAccess) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this area.
        </p>
        <p className="text-sm text-muted-foreground">
          Current role: {role || 'user'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

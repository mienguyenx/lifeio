import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  // Simple pass-through wrapper for now.
  // Page transitions will be added at the route level later
  // when migrating to React Router v6 data router (createBrowserRouter).
  return (
    <div className="h-full">
      {children}
    </div>
  );
}

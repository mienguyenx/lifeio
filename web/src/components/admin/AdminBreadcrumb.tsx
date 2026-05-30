import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  users: 'Users',
  workspaces: 'Workspaces',
  plans: 'Plans',
  features: 'Features',
  templates: 'Templates',
  goals: 'Goals',
  habits: 'Habits',
  tasks: 'Tasks',
  journal: 'Journal',
  review: 'Review',
  themes: 'Themes',
  languages: 'Languages',
  translations: 'Translations',
  ai: 'AI',
  models: 'Models',
  prompts: 'Prompts',
  'api-keys': 'API Keys',
  analytics: 'Analytics',
  logs: 'Logs',
  flags: 'Runtime Flags',
  settings: 'Settings',
  'email-templates': 'Email Templates',
  'email-logs': 'Email Logs',
  data: 'Data Management',
  backup: 'Google Drive Backup',
};

export function AdminBreadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname
    .replace('/admin', '')
    .split('/')
    .filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {pathSegments.length === 0 ? (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to="/admin">Admin</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const href = '/admin/' + pathSegments.slice(0, index + 1).join('/');
          const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <span key={href} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

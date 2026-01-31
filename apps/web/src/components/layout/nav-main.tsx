import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Plane,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
}

const items: NavItem[] = [
  { title: 'Dashboard', to: '/', icon: LayoutDashboard },
  { title: 'Flight Alerts', to: '/alerts', icon: Plane },
  { title: 'Notifications', to: '/notifications', icon: Bell },
  { title: 'Settings', to: '/settings', icon: Settings },
];

export function NavMain() {
  const { pathname } = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.to === '/'
                ? pathname === '/'
                : pathname.startsWith(item.to);
            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <NavLink to={item.to}>
                    <item.icon />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

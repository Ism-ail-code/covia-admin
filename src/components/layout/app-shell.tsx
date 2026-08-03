import * as React from "react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  FileCheck,
  Gauge,
  Headset,
  LayoutDashboard,
  Menu,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  TicketCheck,
  UserCog,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BrandMark, UserMenu } from "@/components/layout/brand";
import { useAuth, signOut } from "@/lib/auth";

interface NavItem {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const NAVIGATION: NavSection[] = [
  {
    items: [{ title: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { title: "Users", to: "/users", icon: Users },
      { title: "Verifications", to: "/verifications", icon: FileCheck, badge: 3 },
      { title: "Rides", to: "/rides", icon: Gauge },
      { title: "Reports", to: "/reports", icon: Scale, badge: 2 },
      { title: "Appeals", to: "/appeals", icon: Headset, badge: 1 },
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      { title: "Live Monitoring", to: "/monitoring", icon: Activity },
      { title: "Safety & Policies", to: "/safety", icon: ShieldCheck },
      { title: "Standby Pool", to: "/standby", icon: Zap },
    ],
  },
  {
    label: "Growth & Admin",
    items: [
      { title: "Analytics", to: "/analytics", icon: BarChart3 },
      { title: "Team", to: "/team", icon: UserCog },
      { title: "Support Tickets", to: "/tickets", icon: TicketCheck, badge: 2 },
      { title: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const location = useLocation();
  const user = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" as never });
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
        <BrandMark />
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold tracking-tight">Covia</p>
          <p className="text-[11px] text-muted-foreground">Coordination Platform</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {NAVIGATION.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-primary-foreground" : "text-foreground/50",
                      )}
                    />
                    <span className="flex-1">{item.title}</span>
                    {typeof item.badge === "number" && item.badge > 0 ? (
                      <Badge
                        variant={active ? "default" : "secondary"}
                        className="rounded-full px-1.5 py-0 text-[10px] tabular-nums"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t p-3">
        {user && <UserMenu user={user} onSignOut={handleSignOut} />}
      </div>
    </aside>
  );
}

interface TopbarProps {
  onMenu: () => void;
}

export function Topbar({ onMenu }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
        <Menu className="size-5" />
      </Button>
      <div className="relative ml-auto w-full max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search users, rides, tickets…" />
      </div>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="size-4" />
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
      </Button>
    </header>
  );
}

export function AppLayout() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
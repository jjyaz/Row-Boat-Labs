import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  GitBranch,
  Inbox,
  Calendar,
  Bot,
  Settings,
  LogOut,
  Anchor,
} from "lucide-react";

const links = [
  { to: "/app", icon: Bot, label: "Chat", exact: true },
  { to: "/app/vault", icon: FileText, label: "Vault" },
  { to: "/app/graph", icon: GitBranch, label: "Graph" },
  { to: "/app/inbox", icon: Inbox, label: "Inbox" },
  { to: "/app/meetings", icon: Calendar, label: "Meetings" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
];

const AppSidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className="w-16 lg:w-56 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 border-r border-sidebar-border">
      <div className="p-3 lg:p-4 flex items-center gap-2">
        <Anchor className="w-6 h-6 text-sidebar-primary shrink-0" />
        <span className="hidden lg:block font-bold text-sm tracking-tight">Row Boat Labs</span>
      </div>

      <nav className="flex-1 py-2 space-y-1 px-2">
        {links.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;

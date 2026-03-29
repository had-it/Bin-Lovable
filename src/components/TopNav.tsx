import { BarChart3, ClipboardList, Database, Settings, LogOut, Eye, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/assets/bincalc-logo.png";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNav() {
  const navigate = useNavigate();
  const { activeRole, isViewingAs, impersonatedUser, stopImpersonation, can } = useRole();
  const { user, logout } = useAuth();

  const navItems = [
    { title: "Dashboard", url: "/", icon: BarChart3, show: can("analytics_dashboard") },
    { title: "Waste Events", url: "/waste-events", icon: ClipboardList, show: true },
    { title: "Admin Management", url: "/data-management", icon: Database, show: can("access_admin_management") },
  ];

  const displayName = isViewingAs ? impersonatedUser?.name ?? impersonatedUser?.email : user?.name ?? user?.email;
  const initials = (displayName ?? "??")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Impersonation banner - sticky */}
      {isViewingAs && impersonatedUser && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>
              Viewing as <strong>{impersonatedUser.name ?? impersonatedUser.email}</strong>
              <span className="opacity-80 ml-1">({activeRole} — {impersonatedUser.hospitalName}{impersonatedUser.department ? `, ${impersonatedUser.department}` : ""})</span>
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 gap-1 bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={() => { stopImpersonation(); navigate("/data-management"); }}
          >
            <X className="h-3.5 w-3.5" />
            Exit impersonation
          </Button>
        </div>
      )}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="BinCalc" className="h-8 w-8" />
            <div className="flex flex-col leading-none">
              <span className="font-bold text-[16px] tracking-[-0.06em] text-[#1B54DE]">BinCalc</span>
              <span className="text-[10px] font-bold text-foreground">by BinSight</span>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.filter((i) => i.show).map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="text-primary font-medium bg-primary/5"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 cursor-pointer focus:outline-none">
                <span className="text-sm text-muted-foreground hidden sm:block">{displayName}</span>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground ${isViewingAs ? "bg-amber-500" : "bg-primary"}`}>
                  {initials}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/user-settings")}>
                <Settings className="h-4 w-4 mr-2" /> User Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "BinSight Admin" | "Hospital Admin" | "Hospital Manager" | "Department User";

const ALL_ROLES: AppRole[] = ["BinSight Admin", "Hospital Admin", "Hospital Manager", "Department User"];

export type Permission =
  | "view_all_hospitals"
  | "view_own_hospital"
  | "view_all_departments"
  | "view_bins"
  | "view_drug_list"
  | "view_dept_drug_relations"
  | "view_drug_usage"
  | "view_cost_data"
  | "cross_hospital_comparison"
  | "analytics_dashboard"
  | "reports"
  | "create_waste_events"
  | "flag_comment_events"
  | "create_edit_departments"
  | "manage_bins"
  | "manage_users"
  | "assign_roles"
  | "access_admin_management"
  | "benchmarking";

const PERMISSIONS: Record<AppRole, Set<Permission>> = {
  "BinSight Admin": new Set([
    "view_all_hospitals", "view_own_hospital", "view_all_departments", "view_bins",
    "view_drug_list", "view_dept_drug_relations", "view_drug_usage", "view_cost_data",
    "cross_hospital_comparison", "analytics_dashboard", "reports", "benchmarking",
    "create_waste_events", "flag_comment_events",
    "create_edit_departments", "manage_bins", "manage_users", "assign_roles",
    "access_admin_management",
  ]),
  "Hospital Admin": new Set([
    "view_own_hospital", "view_all_departments", "view_bins",
    "flag_comment_events",
    "create_edit_departments", "manage_bins", "manage_users", "assign_roles",
    "access_admin_management",
  ]),
  "Hospital Manager": new Set([
    "view_own_hospital", "view_all_departments", "view_bins",
    "view_drug_list", "view_dept_drug_relations", "view_drug_usage", "view_cost_data",
    "analytics_dashboard", "reports", "benchmarking",
    "flag_comment_events",
  ]),
  "Department User": new Set([
    "view_own_hospital", "view_bins",
    "view_drug_usage",
    "analytics_dashboard", "reports",
    "create_waste_events",
    "flag_comment_events",
  ]),
};

function mapRoleString(role: string | null): AppRole {
  if (!role) return "Department User";
  const lower = role.toLowerCase();
  if (lower.includes("binsight") || lower === "admin" || lower.includes("platform")) return "BinSight Admin";
  if (lower.includes("hospital admin") || lower === "hospitaladmin" || lower.includes("it admin")) return "Hospital Admin";
  if (lower.includes("manager") || lower.includes("sustainability") || lower.includes("finance") || lower.includes("pharmacy")) return "Hospital Manager";
  return "Department User";
}

export interface ImpersonatedUser {
  email: string;
  name: string | null;
  role: string | null;
  department: string | null;
  hospital: string;
  hospitalName: string;
}

interface RoleContextType {
  actualRole: AppRole;
  activeRole: AppRole;
  isViewingAs: boolean;
  impersonatedUser: ImpersonatedUser | null;
  startImpersonation: (user: ImpersonatedUser) => void;
  stopImpersonation: () => void;
  allRoles: AppRole[];
  can: (permission: Permission) => boolean;
  canAny: (...permissions: Permission[]) => boolean;
}

const RoleContext = createContext<RoleContextType>({
  actualRole: "Department User",
  activeRole: "Department User",
  isViewingAs: false,
  impersonatedUser: null,
  startImpersonation: () => {},
  stopImpersonation: () => {},
  allRoles: ALL_ROLES,
  can: () => false,
  canAny: () => false,
});

export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const actualRole: AppRole = mapRoleString(user?.role ?? null);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);

  // Reset impersonation when user changes
  useEffect(() => {
    setImpersonatedUser(null);
  }, [user?.email]);

  const activeRole: AppRole = impersonatedUser
    ? mapRoleString(impersonatedUser.role)
    : actualRole;

  const isViewingAs = impersonatedUser !== null;

  const canImpersonate = actualRole === "BinSight Admin";

  const startImpersonation = (target: ImpersonatedUser) => {
    if (canImpersonate) setImpersonatedUser(target);
  };

  const stopImpersonation = () => setImpersonatedUser(null);

  const can = (permission: Permission): boolean => PERMISSIONS[activeRole]?.has(permission) ?? false;
  const canAny = (...permissions: Permission[]): boolean => permissions.some((p) => can(p));

  return (
    <RoleContext.Provider value={{
      actualRole,
      activeRole,
      isViewingAs,
      impersonatedUser,
      startImpersonation,
      stopImpersonation,
      allRoles: canImpersonate ? ALL_ROLES : [actualRole],
      can,
      canAny,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

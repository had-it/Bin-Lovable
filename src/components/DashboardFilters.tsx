import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X, Building2, LayoutGrid } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";

export interface Filters {
  hospital: string;
  department: string;
  drug: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  hospitals: { id: string; name: string }[];
  departments: string[];
  drugs: { id: string; name: string }[];
}

export function DashboardFilters({ filters, onChange, hospitals, departments, drugs }: Props) {
  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });
  const hasFilters = filters.hospital || filters.department || filters.drug || filters.dateFrom || filters.dateTo;
  const { can, activeRole, impersonatedUser } = useRole();
  const canSeeAllHospitals = can("view_all_hospitals");
  const canSeeAllDepartments = can("view_all_departments");
  const userDepartment = impersonatedUser?.department ?? null;
  // For Department Users, get their department from the auth context if not from impersonation
  const { user } = useAuth();
  const effectiveDepartment = userDepartment ?? user?.department ?? (departments.length === 1 ? departments[0] : null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canSeeAllHospitals ? (
        <Select value={filters.hospital} onValueChange={(v) => set({ hospital: v })}>
          <SelectTrigger className="w-[200px] bg-card">
            <SelectValue placeholder="All Hospitals" />
          </SelectTrigger>
          <SelectContent>
            {hospitals.map((h) => (
              <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2 px-3 h-10 rounded-md border border-input bg-card text-sm text-foreground">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{hospitals.length === 1 ? hospitals[0].name : "My Hospital"}</span>
        </div>
      )}

      {canSeeAllDepartments ? (
        <Select value={filters.department} onValueChange={(v) => set({ department: v })}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2 px-3 h-10 rounded-md border border-input bg-card text-sm text-foreground">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span>{effectiveDepartment ?? "My Department"}</span>
        </div>
      )}

      <Select value={filters.drug} onValueChange={(v) => set({ drug: v })}>
        <SelectTrigger className="w-[200px] bg-card">
          <SelectValue placeholder="All Drugs" />
        </SelectTrigger>
        <SelectContent>
          {drugs.map((d) => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[140px] justify-start bg-card", !filters.dateFrom && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateFrom ? format(filters.dateFrom, "dd MMM yy") : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={filters.dateFrom} onSelect={(d) => set({ dateFrom: d ?? undefined })} className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[140px] justify-start bg-card", !filters.dateTo && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateTo ? format(filters.dateTo, "dd MMM yy") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={filters.dateTo} onSelect={(d) => set({ dateTo: d ?? undefined })} className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ hospital: "", department: "", drug: "", dateFrom: undefined, dateTo: undefined })}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}

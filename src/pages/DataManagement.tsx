import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DrugForm } from "@/components/data-management/DrugForm";
import { BinForm } from "@/components/data-management/BinForm";
import { UserForm } from "@/components/data-management/UserForm";
import { DepartmentForm } from "@/components/data-management/DepartmentForm";
import { HospitalForm } from "@/components/data-management/HospitalForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { Building2 } from "lucide-react";

const HOSPITAL_OPTIONS = [
  {
    value: "karolinska",
    label: "Karolinska University Hospital",
    binsTable: "karolinska_university_hospital_bins" as const,
    departmentsTable: "karolinska_university_hospital_departments" as const,
  },
  {
    value: "capio",
    label: "Capio St Görans Sjukhus",
    binsTable: "capio_st_görans_sjukhus_bins" as const,
    departmentsTable: "capio_st_görans_sjukhus_departments" as const,
  },
];

interface HospitalSelectorProps {
  hospital: string;
  setHospital: (v: string) => void;
  locked?: boolean;
  lockedLabel?: string;
}

function HospitalSelector({ hospital, setHospital, locked, lockedLabel }: HospitalSelectorProps) {
  if (locked) {
    return (
      <div className="mb-4 max-w-xs">
        <label className="text-sm font-medium mb-1 block">Hospital</label>
        <div className="flex items-center gap-2 px-3 h-10 rounded-md border border-input bg-card text-sm text-foreground">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{lockedLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 max-w-xs">
      <label className="text-sm font-medium mb-1 block">Hospital</label>
      <Select value={hospital} onValueChange={setHospital}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOSPITAL_OPTIONS.map((h) => (
            <SelectItem key={h.value} value={h.value}>
              {h.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function DataManagement() {
  const { activeRole, can, impersonatedUser } = useRole();
  const { user } = useAuth();

  const isBinSightAdmin = activeRole === "BinSight Admin";

  // Determine the user's hospital (impersonated or real)
  const userHospitalId = impersonatedUser?.hospital ?? user?.hospital ?? null;

  // If not BinSight Admin, lock to user's hospital
  const defaultHospital = (!isBinSightAdmin && userHospitalId)
    ? userHospitalId
    : HOSPITAL_OPTIONS[0].value;

  const [hospital, setHospital] = useState(defaultHospital);

  // For non-admin, always use the user's hospital
  const effectiveHospital = isBinSightAdmin ? hospital : (userHospitalId ?? hospital);
  const selectedHospital = HOSPITAL_OPTIONS.find((h) => h.value === effectiveHospital) ?? HOSPITAL_OPTIONS[0];

  const showDrugsTab = isBinSightAdmin;
  const showHospitalsTab = isBinSightAdmin;
  const showDepartmentsTab = can("create_edit_departments");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 px-8 py-6 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Admin Management</h1>

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            {showDrugsTab && <TabsTrigger value="drugs">Drugs</TabsTrigger>}
            <TabsTrigger value="bins">Bins</TabsTrigger>
            {showDepartmentsTab && <TabsTrigger value="departments">Departments</TabsTrigger>}
            {showHospitalsTab && <TabsTrigger value="hospitals">Hospitals</TabsTrigger>}
          </TabsList>

          <TabsContent value="users">
            <HospitalSelector
              hospital={effectiveHospital}
              setHospital={setHospital}
              locked={!isBinSightAdmin}
              lockedLabel={selectedHospital.label}
            />
            <UserForm hospitalId={selectedHospital.value} hospitalName={selectedHospital.label} />
          </TabsContent>

          {showDrugsTab && (
            <TabsContent value="drugs">
              <DrugForm />
            </TabsContent>
          )}

          <TabsContent value="bins">
            <HospitalSelector
              hospital={effectiveHospital}
              setHospital={setHospital}
              locked={!isBinSightAdmin}
              lockedLabel={selectedHospital.label}
            />
            <BinForm binsTable={selectedHospital.binsTable} />
          </TabsContent>

          {showDepartmentsTab && (
            <TabsContent value="departments">
              <HospitalSelector
                hospital={effectiveHospital}
                setHospital={setHospital}
                locked={!isBinSightAdmin}
                lockedLabel={selectedHospital.label}
              />
              <DepartmentForm departmentsTable={selectedHospital.departmentsTable} />
            </TabsContent>
          )}

          {showHospitalsTab && (
            <TabsContent value="hospitals">
              <HospitalForm />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

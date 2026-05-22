import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PUBS } from "@/lib/pubs-mock";
import { STAFF_ROLES } from "@/lib/staff-schedule";

type FormState = {
  id?: string;
  pub_id: string;
  first_name: string;
  last_name: string;
  role: string;
  active: boolean;
  personnel_number: string;
  email: string;
  phone: string;
  birth_date: string;
  birth_place: string;
  nationality: string;
  address_street: string;
  address_zip: string;
  address_city: string;
  address_country: string;
  iban: string;
  bic: string;
  tax_id: string;
  social_security_number: string;
  health_insurance: string;
  tax_class: string;
  children_allowance: string;
  religion: string;
  contract_type: string;
  weekly_hours: string;
  hourly_wage: string;
  start_date: string;
  end_date: string;
  notes: string;
};

const EMPTY: FormState = {
  pub_id: PUBS[0]?.id ?? "",
  first_name: "",
  last_name: "",
  role: "Bar",
  active: true,
  personnel_number: "",
  email: "",
  phone: "",
  birth_date: "",
  birth_place: "",
  nationality: "DE",
  address_street: "",
  address_zip: "",
  address_city: "",
  address_country: "DE",
  iban: "",
  bic: "",
  tax_id: "",
  social_security_number: "",
  health_insurance: "",
  tax_class: "",
  children_allowance: "0",
  religion: "",
  contract_type: "",
  weekly_hours: "",
  hourly_wage: "",
  start_date: "",
  end_date: "",
  notes: "",
};

interface Props {
  staffId: string | null; // null = new, string = edit
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}

export function PersonalakteSheet({ staffId, open, onOpenChange, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!staffId) {
      setForm(EMPTY);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("staff_members")
        .select("*")
        .eq("id", staffId)
        .single();
      if (error) {
        toast.error(error.message);
      } else if (data) {
        setForm({
          id: data.id,
          pub_id: data.pub_id,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          active: data.active,
          personnel_number: data.personnel_number ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          birth_date: data.birth_date ?? "",
          birth_place: data.birth_place ?? "",
          nationality: data.nationality ?? "DE",
          address_street: data.address_street ?? "",
          address_zip: data.address_zip ?? "",
          address_city: data.address_city ?? "",
          address_country: data.address_country ?? "DE",
          iban: data.iban ?? "",
          bic: data.bic ?? "",
          tax_id: data.tax_id ?? "",
          social_security_number: data.social_security_number ?? "",
          health_insurance: data.health_insurance ?? "",
          tax_class: data.tax_class?.toString() ?? "",
          children_allowance: data.children_allowance?.toString() ?? "0",
          religion: data.religion ?? "",
          contract_type: data.contract_type ?? "",
          weekly_hours: data.weekly_hours?.toString() ?? "",
          hourly_wage: data.hourly_wage?.toString() ?? "",
          start_date: data.start_date ?? "",
          end_date: data.end_date ?? "",
          notes: data.notes ?? "",
        });
      }
      setLoading(false);
    })();
  }, [staffId, open]);

  const upd = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.first_name || !form.last_name) {
      toast.error("Vor- und Nachname sind Pflicht.");
      return;
    }
    setSaving(true);
    const payload = {
      pub_id: form.pub_id,
      first_name: form.first_name,
      last_name: form.last_name,
      role: form.role,
      active: form.active,
      personnel_number: form.personnel_number || null,
      email: form.email || null,
      phone: form.phone || null,
      birth_date: form.birth_date || null,
      birth_place: form.birth_place || null,
      nationality: form.nationality || null,
      address_street: form.address_street || null,
      address_zip: form.address_zip || null,
      address_city: form.address_city || null,
      address_country: form.address_country || null,
      iban: form.iban || null,
      bic: form.bic || null,
      tax_id: form.tax_id || null,
      social_security_number: form.social_security_number || null,
      health_insurance: form.health_insurance || null,
      tax_class: form.tax_class ? parseInt(form.tax_class, 10) : null,
      children_allowance: form.children_allowance ? parseFloat(form.children_allowance.replace(",", ".")) : 0,
      religion: form.religion || null,
      contract_type: (form.contract_type || null) as "vollzeit" | "teilzeit" | "minijob" | "werkstudent" | "aushilfe" | null,
      weekly_hours: form.weekly_hours ? parseFloat(form.weekly_hours.replace(",", ".")) : null,
      hourly_wage: form.hourly_wage ? parseFloat(form.hourly_wage.replace(",", ".")) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      notes: form.notes || null,
    };
    const { error } = form.id
      ? await supabase.from("staff_members").update(payload).eq("id", form.id)
      : await supabase.from("staff_members").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Personalakte aktualisiert" : "Mitarbeiter angelegt");
    onSaved?.();
    onOpenChange(false);
  };

  const remove = async () => {
    if (!form.id) return;
    if (!confirm("Mitarbeiter wirklich löschen? (Besser: auf inaktiv setzen.)")) return;
    const { error } = await supabase.from("staff_members").delete().eq("id", form.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Mitarbeiter gelöscht");
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {form.id ? `${form.first_name} ${form.last_name}` : "Neuer Mitarbeiter"}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="mt-4">
            <Tabs defaultValue="basis">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="basis">Basis</TabsTrigger>
                <TabsTrigger value="kontakt">Kontakt</TabsTrigger>
                <TabsTrigger value="vertrag">Vertrag</TabsTrigger>
                <TabsTrigger value="steuer">Steuer & Bank</TabsTrigger>
              </TabsList>

              <TabsContent value="basis" className="space-y-3 mt-4">
                <Row>
                  <Field label="Vorname *">
                    <Input value={form.first_name} onChange={(e) => upd("first_name", e.target.value)} />
                  </Field>
                  <Field label="Nachname *">
                    <Input value={form.last_name} onChange={(e) => upd("last_name", e.target.value)} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Personalnummer">
                    <Input value={form.personnel_number} onChange={(e) => upd("personnel_number", e.target.value)} placeholder="z. B. 10234" />
                  </Field>
                  <Field label="Pub">
                    <Select value={form.pub_id} onValueChange={(v) => upd("pub_id", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PUBS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </Row>
                <Row>
                  <Field label="Rolle">
                    <Select value={form.role} onValueChange={(v) => upd("role", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Aktiv">
                    <div className="flex items-center gap-2 h-10">
                      <Switch checked={form.active} onCheckedChange={(v) => upd("active", v)} />
                      <span className="text-sm text-muted-foreground">
                        {form.active ? "beschäftigt" : "ausgetreten / pausiert"}
                      </span>
                    </div>
                  </Field>
                </Row>
                <Row>
                  <Field label="Geburtsdatum">
                    <Input type="date" value={form.birth_date} onChange={(e) => upd("birth_date", e.target.value)} />
                  </Field>
                  <Field label="Geburtsort">
                    <Input value={form.birth_place} onChange={(e) => upd("birth_place", e.target.value)} />
                  </Field>
                </Row>
                <Field label="Staatsangehörigkeit">
                  <Input value={form.nationality} onChange={(e) => upd("nationality", e.target.value)} placeholder="DE" />
                </Field>
              </TabsContent>

              <TabsContent value="kontakt" className="space-y-3 mt-4">
                <Row>
                  <Field label="E-Mail">
                    <Input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} />
                  </Field>
                  <Field label="Telefon">
                    <Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} />
                  </Field>
                </Row>
                <Field label="Straße & Hausnummer">
                  <Input value={form.address_street} onChange={(e) => upd("address_street", e.target.value)} />
                </Field>
                <Row>
                  <Field label="PLZ">
                    <Input value={form.address_zip} onChange={(e) => upd("address_zip", e.target.value)} />
                  </Field>
                  <Field label="Ort">
                    <Input value={form.address_city} onChange={(e) => upd("address_city", e.target.value)} />
                  </Field>
                </Row>
                <Field label="Land">
                  <Input value={form.address_country} onChange={(e) => upd("address_country", e.target.value)} placeholder="DE" />
                </Field>
              </TabsContent>

              <TabsContent value="vertrag" className="space-y-3 mt-4">
                <Row>
                  <Field label="Vertragsart">
                    <Select value={form.contract_type} onValueChange={(v) => upd("contract_type", v)}>
                      <SelectTrigger><SelectValue placeholder="bitte wählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vollzeit">Vollzeit</SelectItem>
                        <SelectItem value="teilzeit">Teilzeit</SelectItem>
                        <SelectItem value="minijob">Minijob (520 €)</SelectItem>
                        <SelectItem value="werkstudent">Werkstudent</SelectItem>
                        <SelectItem value="aushilfe">Aushilfe / kurzfristig</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Wochenstunden">
                    <Input value={form.weekly_hours} onChange={(e) => upd("weekly_hours", e.target.value)} placeholder="z. B. 20" />
                  </Field>
                </Row>
                <Row>
                  <Field label="Stundenlohn (€)">
                    <Input value={form.hourly_wage} onChange={(e) => upd("hourly_wage", e.target.value)} placeholder="z. B. 14,50" />
                  </Field>
                  <Field label="" >
                    <div />
                  </Field>
                </Row>
                <Row>
                  <Field label="Eintritt">
                    <Input type="date" value={form.start_date} onChange={(e) => upd("start_date", e.target.value)} />
                  </Field>
                  <Field label="Austritt">
                    <Input type="date" value={form.end_date} onChange={(e) => upd("end_date", e.target.value)} />
                  </Field>
                </Row>
                <Field label="Notizen">
                  <Textarea rows={3} value={form.notes} onChange={(e) => upd("notes", e.target.value)} />
                </Field>
              </TabsContent>

              <TabsContent value="steuer" className="space-y-3 mt-4">
                <Row>
                  <Field label="Steuer-ID (11-stellig)">
                    <Input value={form.tax_id} onChange={(e) => upd("tax_id", e.target.value)} placeholder="12345678901" />
                  </Field>
                  <Field label="SV-Nummer">
                    <Input value={form.social_security_number} onChange={(e) => upd("social_security_number", e.target.value)} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Steuerklasse">
                    <Select value={form.tax_class} onValueChange={(v) => upd("tax_class", v)}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Kinderfreibeträge">
                    <Input value={form.children_allowance} onChange={(e) => upd("children_allowance", e.target.value)} placeholder="0" />
                  </Field>
                </Row>
                <Row>
                  <Field label="Konfession">
                    <Select value={form.religion} onValueChange={(v) => upd("religion", v)}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="--">keine / vw</SelectItem>
                        <SelectItem value="rk">römisch-katholisch</SelectItem>
                        <SelectItem value="ev">evangelisch</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Krankenkasse">
                    <Input value={form.health_insurance} onChange={(e) => upd("health_insurance", e.target.value)} placeholder="z. B. TK" />
                  </Field>
                </Row>
                <Field label="IBAN">
                  <Input value={form.iban} onChange={(e) => upd("iban", e.target.value)} placeholder="DE…" />
                </Field>
                <Field label="BIC">
                  <Input value={form.bic} onChange={(e) => upd("bic", e.target.value)} />
                </Field>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <SheetFooter className="mt-6 flex-row justify-between gap-2 sm:justify-between">
          {form.id ? (
            <Button variant="ghost" size="sm" onClick={remove} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-1.5" /> Löschen
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Speichern
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

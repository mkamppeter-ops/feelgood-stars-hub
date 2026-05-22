import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Megaphone, Pin, AlertTriangle, CheckCircle2, Send, Trash2, Plus,
} from "lucide-react";
import { useT } from "@/lib/use-t";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { de as deLocale, enUS } from "date-fns/locale";
import { NEWS_CATEGORY_META, type NewsCategory } from "@/lib/hq-news-mock";
import { useHQNews, hqNewsStore } from "@/lib/hq-news-store";
import { PUBS } from "@/lib/pubs-mock";


const CATEGORIES: NewsCategory[] = ["urgent", "marketing", "product", "event", "policy", "ops"];

export function HQNewsComposer() {
  const tt = useT();
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith("de") ? deLocale : enUS;
  const news = useHQNews();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<NewsCategory>("ops");
  const [titleDe, setTitleDe] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [excerptDe, setExcerptDe] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [pinned, setPinned] = useState(false);
  const [requiresAck, setRequiresAck] = useState(false);
  const [author, setAuthor] = useState("Marlene Roth");
  const [authorRole, setAuthorRole] = useState("Head of Operations");

  const sorted = useMemo(
    () => [...news].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)),
    [news]
  );

  const canSend = titleDe.trim() && excerptDe.trim();

  const reset = () => {
    setCategory("ops");
    setTitleDe(""); setTitleEn("");
    setExcerptDe(""); setExcerptEn("");
    setPinned(false); setRequiresAck(false);
  };

  const send = () => {
    if (!canSend) return;
    hqNewsStore.add({
      category,
      titleDe: titleDe.trim(),
      titleEn: titleEn.trim() || titleDe.trim(),
      excerptDe: excerptDe.trim(),
      excerptEn: excerptEn.trim() || excerptDe.trim(),
      pinned,
      requiresAck,
      author: author.trim() || "HQ",
      authorRole: authorRole.trim() || "HQ",
    });
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {tt("HQ News & Briefings", "HQ News & Briefings")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {tt(
                "Nachrichten, Anweisungen & Events an alle Filialen senden",
                "Send announcements, instructions & events to all branches",
              )}
            </p>
          </div>
        </div>
        <Button onClick={() => setOpen((v) => !v)} className="gap-2">
          {open ? "—" : <Plus className="h-4 w-4" />}
          {open ? tt("Schließen", "Close") : tt("Neue Nachricht", "New post")}
        </Button>
      </div>

      {open && (
        <Card className="shadow-sm border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">
              {tt("Nachricht an alle Filialen", "Post to all branches")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {tt(
                "Wird sofort im HQ Connect / News-Feed jeder Filiale sichtbar.",
                "Appears immediately in the HQ News feed of every branch.",
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{tt("Kategorie", "Category")}</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as NewsCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {tt(NEWS_CATEGORY_META[c].de, NEWS_CATEGORY_META[c].en)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{tt("Absender", "Author")}</Label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{tt("Rolle / Abteilung", "Role / Dept.")}</Label>
                <Input value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{tt("Titel (DE)", "Title (DE)")} *</Label>
                <Input value={titleDe} onChange={(e) => setTitleDe(e.target.value)} placeholder={tt("z. B. Neues Happy Hour Konzept ab Freitag", "e.g. New happy hour from Friday")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{tt("Titel (EN, optional)", "Title (EN, optional)")}</Label>
                <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder={tt("Fällt zurück auf DE", "Falls back to DE")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{tt("Nachricht (DE)", "Message (DE)")} *</Label>
                <Textarea rows={4} value={excerptDe} onChange={(e) => setExcerptDe(e.target.value)} placeholder={tt("Worum geht's? Was müssen die Filialen tun?", "What is it about? What do branches need to do?")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{tt("Nachricht (EN, optional)", "Message (EN, optional)")}</Label>
                <Textarea rows={4} value={excerptEn} onChange={(e) => setExcerptEn(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={pinned} onCheckedChange={(v) => setPinned(!!v)} />
                <Pin className="h-3.5 w-3.5 text-primary" />
                {tt("Oben anheften (Top-Ankündigung)", "Pin to top (featured)")}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={requiresAck} onCheckedChange={(v) => setRequiresAck(!!v)} />
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {tt("Bestätigung 'Gelesen & Verstanden' verlangen", "Require 'Read & understood' confirmation")}
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" onClick={() => { reset(); setOpen(false); }}>
                {tt("Abbrechen", "Cancel")}
              </Button>
              <Button onClick={send} disabled={!canSend} className="gap-2">
                <Send className="h-4 w-4" />
                {tt("An alle Filialen senden", "Send to all branches")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {tt("Veröffentlichte Nachrichten", "Published posts")}
            <Badge variant="secondary" className="font-normal">{sorted.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.map((n) => {
            const meta = NEWS_CATEGORY_META[n.category];
            return (
              <div
                key={n.id}
                className="flex flex-wrap items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline" className={meta.cls}>
                      {tt(meta.de, meta.en)}
                    </Badge>
                    {n.pinned && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1">
                        <Pin className="h-3 w-3" /> {tt("Angeheftet", "Pinned")}
                      </Badge>
                    )}
                    {n.requiresAck && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 gap-1">
                        <AlertTriangle className="h-3 w-3" /> {tt("Bestätigung nötig", "Ack required")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-semibold">{tt(n.titleDe, n.titleEn)}</div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {tt(n.excerptDe, n.excerptEn)}
                  </p>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {n.author} · {n.authorRole} · {formatDistanceToNow(new Date(n.publishedAt), { addSuffix: true, locale })}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-600"
                  onClick={() => hqNewsStore.remove(n.id)}
                  title={tt("Löschen", "Delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-md">
              {tt("Noch keine Nachrichten", "No posts yet")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

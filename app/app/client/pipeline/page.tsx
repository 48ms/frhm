import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";

export const dynamic = "force-dynamic";

type Status = "belum" | "jalan" | "selesai";

const STATUS_META: Record<Status, { icon: React.ReactNode; label: string; cls: string }> = {
  belum: { icon: <Icons.circle className="size-4" />, label: "Belum", cls: "text-muted-foreground" },
  jalan: { icon: <Icons.clock className="size-4" />, label: "Dikerjakan", cls: "text-primary" },
  selesai: { icon: <Icons.circleCheck className="size-4" />, label: "Selesai", cls: "text-green-600" },
};

export default async function ClientPipelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/client/pipeline");

  const { data: profile } = await supabase
    .from("users")
    .select("client_id, full_name")
    .eq("id", user.id)
    .single();
  const clientId = profile?.client_id;
  if (!clientId) redirect("/client/dashboard");

  const [{ data: stages }, { data: skills }, { data: clientSkills }] = await Promise.all([
    supabase.from("pipeline_stages").select("key, label, description, sort_order").order("sort_order"),
    supabase.from("skills").select("id, name, stage"),
    supabase.from("client_skills").select("skill_id, status").eq("client_id", clientId),
  ]);

  const statusBySkill: Record<string, Status> = {};
  for (const cs of clientSkills ?? []) {
    statusBySkill[cs.skill_id] = cs.status as Status;
  }

  const allStages = stages ?? [];
  const allSkills = skills ?? [];

  const totalSkills = allSkills.length;
  const doneSkills = allSkills.filter((s) => statusBySkill[s.id] === "selesai").length;
  const overallPct = totalSkills > 0 ? Math.round((doneSkills / totalSkills) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/client/dashboard"
          className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:min-h-0"
        >
          <Icons.chevronLeft className="size-3.5" /> Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icons.workflow className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Progres Pengerjaan</h1>
            <p className="text-sm text-muted-foreground">
              Tahapan yang sedang dan sudah dikerjakan untuk brand kamu
            </p>
          </div>
        </div>
      </div>

      <Card className="border rounded-xl transition-shadow hover:shadow-md hover:border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Progres Keseluruhan</CardTitle>
            <Badge variant="outline" className="h-6 px-2 text-xs">
              {doneSkills}/{totalSkills} skill selesai
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={overallPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progres keseluruhan: ${overallPct}%`}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{overallPct}% selesai</p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {allStages.map((stage, i) => {
          const stageSkills = allSkills.filter((s) => s.stage === stage.key);
          const done = stageSkills.filter((s) => statusBySkill[s.id] === "selesai").length;
          const active = stageSkills.filter((s) => statusBySkill[s.id] === "jalan").length;
          const total = stageSkills.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <Card
              key={stage.key}
              className="border rounded-xl transition-shadow hover:shadow-md hover:border-primary/20"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base">{stage.label}</CardTitle>
                      {stage.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {active > 0 && (
                      <Badge variant="outline" className="gap-1 h-6 px-2 text-xs">
                        <Icons.clock className="size-3" /> {active} dikerjakan
                      </Badge>
                    )}
                    <Badge variant="outline" className="h-6 px-2 text-xs">
                      {done}/{total} skill
                    </Badge>
                  </div>
                </div>
                <div
                  className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progres tahap ${stage.label}: ${pct}%`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardHeader>
              {stageSkills.length > 0 && (
                <CardContent className="pt-0">
                  <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {stageSkills.map((skill) => {
                      const st = statusBySkill[skill.id] ?? "belum";
                      const meta = STATUS_META[st];
                      return (
                        <div
                          key={skill.id}
                          className="flex items-center gap-2 rounded-xl border bg-muted/20 px-3 py-2 text-sm"
                        >
                          <span className={meta.cls}>{meta.icon}</span>
                          <span className="truncate">{skill.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="border rounded-xl">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          <CardDescription>
            Tahapan bertambah saat tim mulai mengerjakan skill berikutnya untuk brand kamu.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Briefcase,
  Sparkles,
  Check,
  X,
  MoreHorizontal,
  ChevronRight,
  Store,
  UtensilsCrossed,
  ChefHat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PriorityTask {
  id: string;
  title: string;
  brand: "Glow Beauty Bar" | "Pawon Sengon" | "Taraju";
  brandColor: string;
  brandBg: string;
  owner: string;
  ownerAvatar: string;
  priority: "P1" | "P2" | "P3";
  due: string;
  status: string;
}

interface PendingApproval {
  id: string;
  type: string;
  title: string;
  amount?: string;
  brand: "Glow Beauty Bar" | "Pawon Sengon" | "Taraju";
  timeAgo: string;
  urgency: "High" | "Normal";
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  status: "success" | "info" | "warning";
}

const INITIAL_TASKS: PriorityTask[] = [
  {
    id: "task-1",
    title: "PO Restock 500 Unit Cushion & Lip Velvet Tint Viral",
    brand: "Glow Beauty Bar",
    brandColor: "text-rose-700 dark:text-rose-300",
    brandBg: "bg-rose-100 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
    owner: "Nadia Cosmetic Lead",
    ownerAvatar: "NC",
    priority: "P1",
    due: "Hari ini, 14:00",
    status: "In Progress",
  },
  {
    id: "task-2",
    title: "Finalisasi Menu Paket Katering 200 Porsi Acara Korporat",
    brand: "Pawon Sengon",
    brandColor: "text-amber-700 dark:text-amber-300",
    brandBg: "bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
    owner: "Chef Haryo Kitchen",
    ownerAvatar: "CH",
    priority: "P1",
    due: "Besok, 09:00",
    status: "Review",
  },
  {
    id: "task-3",
    title: "Jadwalkan Live TikTok Flash Sale Bundle Skincare Akhir Bulan",
    brand: "Glow Beauty Bar",
    brandColor: "text-rose-700 dark:text-rose-300",
    brandBg: "bg-rose-100 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
    owner: "Maya Media",
    ownerAvatar: "MM",
    priority: "P2",
    due: "29 Okt",
    status: "In Progress",
  },
  {
    id: "task-4",
    title: "Pengadaan Bahan Baku Daging Sapi Segar & Bumbu Rempah Dapur",
    brand: "Pawon Sengon",
    brandColor: "text-amber-700 dark:text-amber-300",
    brandBg: "bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
    owner: "Rian Logistik FnB",
    ownerAvatar: "RL",
    priority: "P2",
    due: "30 Okt",
    status: "Scheduled",
  },
  {
    id: "task-5",
    title: "Brand Profiling Taraju: Target Audience & Positioning",
    brand: "Taraju",
    brandColor: "text-emerald-700 dark:text-emerald-300",
    brandBg: "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
    owner: "Frahmadia",
    ownerAvatar: "FR",
    priority: "P2",
    due: "2 hari lagi",
    status: "In Progress",
  },
  {
    id: "task-6",
    title: "Setup Social Media Taraju IG & TikTok",
    brand: "Taraju",
    brandColor: "text-emerald-700 dark:text-emerald-300",
    brandBg: "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
    owner: "Frahmadia",
    ownerAvatar: "FR",
    priority: "P1",
    due: "Besok, 12:00",
    status: "To Do",
  },
];

const INITIAL_APPROVALS: PendingApproval[] = [
  {
    id: "app-1",
    type: "Pengadaan Stok Kosmetik",
    title: "Rp 18.500.000 — Display Akrilik Toko & Restock Serum Kosmetik",
    brand: "Glow Beauty Bar",
    timeAgo: "25m lalu",
    urgency: "High",
  },
  {
    id: "app-2",
    type: "Disbursement Bahan Baku FnB",
    title: "Rp 32.000.000 — Restock Daging Sapi & Bumbu Rempah Dapur Utama",
    brand: "Pawon Sengon",
    timeAgo: "1 jam lalu",
    urgency: "High",
  },
  {
    id: "app-3",
    type: "Promo & Campaign Konten",
    title: "Sponsorship Beauty Influencer & TikTok Live Event Promo",
    brand: "Glow Beauty Bar",
    timeAgo: "3 jam lalu",
    urgency: "Normal",
  },
  {
    id: "app-4",
    type: "Digital Marketing Ad Spend",
    title: "Rp 5.000.000 — Ad Spend IG & TikTok Ads Taraju Launch",
    brand: "Taraju",
    timeAgo: "2 jam lalu",
    urgency: "Normal",
  },
  {
    id: "app-5",
    type: "Content Production",
    title: "Rp 2.500.000 — Food Styling & Visual Menu Photography 10 Produk",
    brand: "Taraju",
    timeAgo: "1 jam lalu",
    urgency: "Normal",
  },
];

const ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    title: "Stok Kosmetik Masuk: 200 Cushion Glow Shade Natural",
    subtitle: "Toko Kosmetik • Glow Beauty Bar",
    time: "15m lalu",
    status: "success",
  },
  {
    id: "act-2",
    title: "Reservasi Meja VIP #BK-208 (8 Pax) Terkonfirmasi",
    subtitle: "Dine-In • Pawon Sengon Resto",
    time: "45m lalu",
    status: "info",
  },
  {
    id: "act-3",
    title: "Batas Minimum Stok Daging Sapi Tercapai (Peringatan Dapur)",
    subtitle: "Inventaris Bahan Baku • Pawon Sengon",
    time: "2 jam lalu",
    status: "warning",
  },
  {
    id: "act-4",
    title: "Brand Profiling Taraju: Riset target audience F&B usia 18-35 dimulai",
    subtitle: "Digital Marketing • Taraju",
    time: "5m lalu",
    status: "info",
  },
];

const BRANDS = [
  { id: "all", label: "Semua Unit Usaha", icon: Briefcase },
  { id: "beauty", label: "Glow Beauty Bar", icon: Store },
  { id: "pawon", label: "Pawon Sengon", icon: UtensilsCrossed },
  { id: "taraju", label: "Taraju", icon: ChefHat },
];

export function CommandCenterView() {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = React.useState<string>("all");
  const [tasks] = React.useState<PriorityTask[]>(INITIAL_TASKS);
  const [approvals, setApprovals] = React.useState<PendingApproval[]>(INITIAL_APPROVALS);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastAction, setToastAction] = React.useState<{ label: string; handler: () => void } | null>(null);
  const [currentActor, setCurrentActor] = React.useState<{ name: string; role: string }>({
    name: "Frahmadia",
    role: "Director",
  });
  const [pendingConfirm, setPendingConfirm] = React.useState<{
    approval: PendingApproval;
    decision: "Approved" | "Rejected";
  } | null>(null);
  const undoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const matchUser = document.cookie.match(/frahmadia_mock_user=([^;]+)/);
    const matchName = document.cookie.match(/frahmadia_mock_name=([^;]+)/);
    const roleKey = matchUser ? matchUser[1] : "director";
    const nameKey = matchName ? decodeURIComponent(matchName[1]) : "Frahmadia";
    const formattedRole =
      roleKey === "manager" ? "Manager" : roleKey === "staff" ? "Staff" : "Director";

    setCurrentActor({
      name: nameKey,
      role: formattedRole,
    });
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (selectedBrand === "all") return true;
    if (selectedBrand === "beauty") return t.brand === "Glow Beauty Bar";
    if (selectedBrand === "pawon") return t.brand === "Pawon Sengon";
    if (selectedBrand === "taraju") return t.brand === "Taraju";
    return true;
  });

  const handleDecision = (id: string, decision: "Approved" | "Rejected") => {
    const approval = approvals.find((a) => a.id === id);
    if (!approval) return;

    setApprovals((prev) => prev.filter((a) => a.id !== id));
    setToastMessage(`Pengajuan berhasil ${decision === "Approved" ? "disetujui" : "ditolak"} oleh ${currentActor.name} (${currentActor.role}).`);
    setToastAction({
      label: "Batalkan",
      handler: () => {
        setApprovals((prev) => {
          const insertAt = INITIAL_APPROVALS.findIndex((a) => a.id === id);
          const insertIdx = insertAt >= 0 ? Math.min(insertAt, prev.length) : prev.length;
          return [...prev.slice(0, insertIdx), approval, ...prev.slice(insertIdx)];
        });
        setToastMessage(`Pengajuan dibatalkan. Item dikembalikan ke antrean.`);
        setToastAction(null);
      },
    });

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      setToastAction(null);
    }, 5000);
  };

  const executeDecision = () => {
    if (!pendingConfirm) return;
    handleDecision(pendingConfirm.approval.id, pendingConfirm.decision);
    setPendingConfirm(null);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification with Motion Spring */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-[8px] border border-emerald-500/30 bg-card p-4 shadow-lg text-xs font-semibold text-foreground"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span>{toastMessage}</span>
            {toastAction && (
              <button
                onClick={toastAction.handler}
                className="ml-2 text-xs font-bold text-primary hover:underline whitespace-nowrap"
              >
                {toastAction.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner & Brand Scope Selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Selamat datang, {currentActor.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ruang kerja terpadu untuk <strong>Glow Beauty Bar</strong>, <strong>Pawon Sengon</strong> &amp; <strong>Taraju</strong>. Bersih, ringan, dan terarah.
          </p>
        </div>

        {/* Brand Scope Filter Pill */}
        <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-[8px] border border-border">
          {BRANDS.map((b) => {
            const isSelected = selectedBrand === b.id;
            const Icon = b.icon;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(b.id)}
                aria-pressed={isSelected}
                aria-label={`Filter: ${b.label}`}
                className={cn(
                  "relative flex items-center gap-1.5 text-xs font-medium rounded-[6px] h-8 px-3.5 transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected ? "text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="command-brand-pill"
                    className="absolute inset-0 bg-[#3D6498] rounded-[6px] -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-3.5 w-3.5" />
                <span>{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LEVEL 1: TOP 4 KPI BENTO CARDS with Staggered Hover Motion */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.06 },
          },
        }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Card 1: Active Operational Tasks */}
        <Link href="/work" className="block">
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="h-full rounded-[10px] border border-border bg-card p-5 shadow-sm transition-all hover:border-[#3D6498] hover:shadow-soft group cursor-pointer"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tugas Operasional</span>
              <Briefcase className="h-4 w-4 text-[#3D6498] group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-foreground tracking-tight tabular-nums mb-2">
              18 <span className="text-xs font-normal text-muted-foreground">Aktif</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-[4px] border border-rose-200/60 dark:border-rose-800">
                10 Glow Beauty
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-[4px] border border-amber-200/60 dark:border-amber-800">
                8 Pawon Sengon
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "65%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-[#3D6498]"
              />
            </div>
          </motion.div>
        </Link>

        {/* Card 2: Pending Approvals for Director */}
        <Link href="/approvals" className="block">
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="h-full rounded-[10px] border border-border bg-card p-5 shadow-sm transition-all hover:border-[#3D6498] hover:shadow-soft group cursor-pointer"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Persetujuan Direktur</span>
              <Clock className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-foreground tracking-tight tabular-nums mb-2">
              {approvals.length} <span className="text-xs font-normal text-muted-foreground">Pengajuan</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-[4px] border border-amber-200/60 dark:border-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                Perlu Review Direktur Frahmadia
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "50%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-amber-500"
              />
            </div>
          </motion.div>
        </Link>

        {/* Card 3: Total Budget Plafond */}
        <Link href="/finance" className="block">
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="h-full rounded-[10px] border border-border bg-card p-5 shadow-sm transition-all hover:border-[#3D6498] hover:shadow-soft group cursor-pointer"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Plafond Anggaran Gabungan</span>
              <DollarSign className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-bold text-foreground tracking-tight tabular-nums mb-1">
              Rp 350.000.000
            </div>
            <div className="text-[11px] text-muted-foreground mb-3">
              Glow Beauty + Pawon Sengon <span className="font-semibold text-[#3D6498]">(68% Terpakai)</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "68%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-[#3D6498]"
              />
            </div>
          </motion.div>
        </Link>

        {/* Card 4: Health & Stock Alert */}
        <Link href="/work" className="block">
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="h-full rounded-[10px] border border-border bg-card p-5 shadow-sm transition-all hover:border-[#3D6498] hover:shadow-soft group cursor-pointer"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider">Status Inventaris &amp; Order</span>
              <AlertTriangle className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight tabular-nums mb-2">
              2 Perhatian
            </div>
            <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Restock Daging Sapi Pawon Sengon
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Display Toko Kosmetik Glow Beauty
              </span>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* MAIN BENTO SPLIT: 65% ACTION ZONE | 35% INTELLIGENCE ZONE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (65% width / 8 cols): Executive Action Canvas */}
        <div className="lg:col-span-8 space-y-6">
          {/* Executive Priorities Table */}
          <div className="rounded-[10px] border border-border bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  Prioritas Eksekutif &amp; Operasional Toko / Resto
                </span>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {filteredTasks.length} Tugas
                </Badge>
              </div>
              <Link
                href="/work"
                className="text-xs font-semibold text-[#3D6498] hover:underline flex items-center gap-1"
              >
                Lihat Seluruh Kanban <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Judul Tugas</th>
                    <th className="py-3 px-3">Unit Usaha</th>
                    <th className="py-3 px-3">Penanggung Jawab</th>
                    <th className="py-3 px-3">Prioritas</th>
                    <th className="py-3 px-3">Tenggat Waktu</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => router.push("/work")}
                      className="hover:bg-muted/40 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-xs">
                        <div className="truncate group-hover:text-[#3D6498] transition-colors">{task.title}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold border",
                            task.brandBg,
                            task.brandColor
                          )}
                        >
                          {task.brand}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[#3D6498]/10 text-[#3D6498] flex items-center justify-center font-bold text-[10px] border border-[#3D6498]/20">
                            {task.ownerAvatar}
                          </div>
                          <span className="text-muted-foreground text-[11px] hidden sm:inline">{task.owner}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[10px]",
                            task.priority === "P1"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          )}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-muted-foreground tabular-nums font-mono text-[11px]">
                        {task.due}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href="/work" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-[#3D6498]/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Multi-Step Approvals Section with AnimatePresence */}
          <div className="rounded-[10px] border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  Menunggu Persetujuan Direktur Frahmadia
                </span>
                <span className="rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 border border-amber-500/20">
                  {approvals.length} Menunggu Tindakan
                </span>
              </div>
              <Link href="/approvals" className="text-xs font-semibold text-[#3D6498] hover:underline">
                Lihat Audit Trail
              </Link>
            </div>

            {approvals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center text-xs text-muted-foreground"
              >
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                Semua permohonan persetujuan telah selesai diproses.
              </motion.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {approvals.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-[8px] border border-border p-4 hover:border-[#3D6498]/60 transition-all bg-card/80 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D6498]">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{item.timeAgo}</span>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-foreground leading-snug">{item.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-semibold text-[#3D6498]">
                          {item.brand}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => setPendingConfirm({ approval: item, decision: "Approved" })}
                          aria-label={`Setujui pengajuan: ${item.title}`}
                          className="flex-1 h-8 bg-primary hover:bg-primary/90 text-white text-xs font-semibold gap-1.5 rounded-[6px] active:scale-[0.98]"
                        >
                          <Check className="h-3.5 w-3.5" /> Setujui
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPendingConfirm({ approval: item, decision: "Rejected" })}
                          aria-label={`Tolak pengajuan: ${item.title}`}
                          className="flex-1 h-8 text-xs font-semibold rounded-[6px] text-muted-foreground hover:text-rose-600 hover:border-rose-300 active:scale-[0.98]"
                        >
                          <X className="h-3.5 w-3.5" /> Tolak
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (35% width / 4 cols): Intelligence & Pulse Canvas */}
        <div className="lg:col-span-4 space-y-6">
          {/* Frahmadia AI Operational Pulse Card */}
          <div className="relative rounded-[10px] border border-[#3D6498]/30 bg-gradient-to-br from-card via-card to-[#3D6498]/5 p-5 shadow-sm overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-[6px] bg-[#3D6498]/10 border border-[#3D6498]/30 flex items-center justify-center text-[#3D6498]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      Frahmadia Intelligence Pulse
                    </span>
                  </div>
                </div>
                <span className="flex h-2 w-2 rounded-full bg-[#3D6498] animate-ping" />
              </div>

              <div className="space-y-2.5">
                <div className="rounded-[8px] border border-border bg-background/80 p-3 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase">
                    <Store className="h-3 w-3" /> Glow Beauty Bar
                  </div>
                  <p className="text-foreground/90 text-[11px]">
                    Stok <strong>Lip Velvet Tint</strong> tersisa 42 unit. Disarankan otorisasi PO restock segera.
                  </p>
                </div>

                <div className="rounded-[8px] border border-border bg-background/80 p-3 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase">
                    <UtensilsCrossed className="h-3 w-3" /> Pawon Sengon
                  </div>
                  <p className="text-foreground/90 text-[11px]">
                    Kapasitas meja reservasi VIP malam Minggu terisi <strong>85%</strong>. Siapkan bahan dapur ekstra.
                  </p>
                </div>

                <div className="rounded-[8px] border border-border bg-background/80 p-3 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">
                    <ChefHat className="h-3 w-3" /> Taraju
                  </div>
                  <p className="text-foreground/90 text-[11px]">
                    Brand profiling tahap riset. Setup IG & TikTok belum dimulai. Ad spend 5 juta menunggu persetujuan.
                  </p>
                </div>

                <div className="rounded-[8px] border border-border bg-background/80 p-3 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 text-[#3D6498] font-bold text-[10px] uppercase">
                    <TrendingUp className="h-3 w-3" /> Arus Kas Operasional
                  </div>
                  <p className="text-foreground/90 text-[11px]">
                    Realisasi pengeluaran gabungan berada di bawah ambang batas aman <strong>(68%)</strong>.
                  </p>
                </div>
              </div>

              <Link href="/copilot">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold text-[#3D6498] mt-2 gap-1.5 rounded-[6px] active:scale-[0.98]">
                  <span>Konsultasi dengan Frahmadia Copilot</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Live Activity Stream Timeline */}
          <div className="rounded-[10px] border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                Aktivitas Bisnis Terkini
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Real-time</span>
            </div>

            <div className="relative pl-3 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              {ACTIVITIES.map((act) => (
                <div key={act.id} className="relative pl-5 text-xs space-y-0.5">
                  <div
                    className={cn(
                      "absolute -left-[5px] top-1 h-2 w-2 rounded-full ring-4 ring-card",
                      act.status === "success" && "bg-emerald-500",
                      act.status === "info" && "bg-[#3D6498]",
                      act.status === "warning" && "bg-amber-500"
                    )}
                  />
                  <div className="font-semibold text-foreground text-[11px] leading-tight">{act.title}</div>
                  <div className="text-[10px] text-muted-foreground">{act.subtitle}</div>
                  <div className="text-[9px] text-muted-foreground/80 font-mono">{act.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Confirmation */}
      <Dialog
        open={!!pendingConfirm}
        onOpenChange={(open) => {
          if (!open) setPendingConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingConfirm?.decision === "Approved" ? "Konfirmasi Persetujuan" : "Konfirmasi Penolakan"}
            </DialogTitle>
            <DialogDescription>Tinjau detail pengajuan sebelum melanjutkan.</DialogDescription>
          </DialogHeader>
          {pendingConfirm && (
          <div className="space-y-3">
            <div className="rounded-[8px] border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {pendingConfirm.approval.type}
                </span>
                <span className="text-[10px] text-muted-foreground">{pendingConfirm.approval.brand}</span>
              </div>
              <div className="text-xs font-bold text-foreground leading-snug">
                {pendingConfirm.approval.title}
              </div>
              {pendingConfirm.approval.amount && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">Nilai Pengajuan</span>
                  <span className="text-sm font-bold text-foreground">
                    {pendingConfirm.approval.amount}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {pendingConfirm.decision === "Approved"
                ? "Pengajuan ini akan disetujui atas nama Anda. Tindakan ini dapat dibatalkan dalam 5 detik setelah eksekusi."
                : "Pengajuan ini akan ditolak atas nama Anda. Tindakan ini dapat dibatalkan dalam 5 detik setelah eksekusi."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingConfirm(null)}
                className="h-8 text-xs rounded-[6px]"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={executeDecision}
                className={cn(
                  "h-8 text-xs font-semibold rounded-[6px] gap-1.5",
                  pendingConfirm.decision === "Approved"
                    ? "bg-primary hover:bg-primary/90 text-white"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                )}
              >
                {pendingConfirm.decision === "Approved" ? (
                  <><Check className="h-3.5 w-3.5" /> Setujui</>
                ) : (
                  <><X className="h-3.5 w-3.5" /> Tolak</>
                )}
              </Button>
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { BrandProfileEditorDialog } from "@/components/client/brand-profile-editor";

interface ClientSetupProps {
  clientId: string;
  stages: unknown[];
  skills: unknown[];
  clientSkills: unknown[];
  files: unknown[];
  provider: unknown;
  guardrails: unknown;
  groundTruths?: unknown[];
  channels?: unknown[];
}

export function ClientSetup({ clientId }: ClientSetupProps) {
  const [editorOpen, setEditorOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Brand Foundation & Setup</h3>
          <p className="text-sm text-muted-foreground">Kelola profile brand, tone of voice, dan foundation document client ini.</p>
        </div>
        <Button onClick={() => setEditorOpen(true)}>
          Edit Brand Profile
        </Button>
      </div>

      <BrandProfileEditorDialog
        clientId={clientId}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </div>
  );
}

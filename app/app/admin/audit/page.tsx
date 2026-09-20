"use client";

import { motion } from "motion/react";
import { Activity, ShieldAlert, LogIn, FileEdit, Settings, Search } from "lucide-react";

export default function AdminAuditPage() {
  const auditLogs = [
    { id: 1, action: "User Login", user: "Bima Maulana", details: "Logged in via Google", time: "10:42 AM, Today", icon: LogIn, color: "text-blue-500" },
    { id: 2, action: "Security Update", user: "System", details: "Updated OAuth configuration", time: "09:15 AM, Today", icon: ShieldAlert, color: "text-rose-500" },
    { id: 3, action: "Modified Deliverable", user: "Aditya", details: "Changed status of 'Rebranding Taraju' to Review", time: "Yesterday", icon: FileEdit, color: "text-amber-500" },
    { id: 4, action: "Settings Changed", user: "Bima Maulana", details: "Updated API Keys for Bridge", time: "2 days ago", icon: Settings, color: "text-emerald-500" },
  ];

  return (
    <div className="flex-1 space-y-8 p-8 max-w-4xl mx-auto w-full">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
          <Activity className="w-8 h-8 text-neutral-400" />
          Audit Log
        </h1>
        <p className="text-neutral-500 mt-2">Rekam jejak aktivitas sistem, perubahan keamanan, dan tindakan pengguna.</p>
      </motion.div>

      {/* Timeline Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm"
      >
        <div className="mb-8 relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Filter log aktivitas..." 
            className="w-full pl-9 pr-4 py-2 bg-neutral-100/50 dark:bg-neutral-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-neutral-900/5 dark:focus:ring-white/5 transition-all outline-none"
          />
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 dark:before:via-neutral-800 before:to-transparent">
          {auditLogs.map((log, index) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-neutral-950 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                <log.icon className={`w-4 h-4 ${log.color}`} />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{log.action}</span>
                  <span className="text-xs font-medium text-neutral-500 tabular-nums">{log.time}</span>
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {log.details}
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800/50 text-xs font-medium text-neutral-500">
                  By: {log.user}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

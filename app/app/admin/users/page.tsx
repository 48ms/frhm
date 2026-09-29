"use client";

import { motion } from "motion/react";
import { Icons } from "@/components/icons"

export default function AdminUsersPage() {
  const users = [
    { id: 1, name: "Bima Maulana", email: "bima@frhm.com", role: "Super Admin", status: "Active", lastActive: "2 min ago" },
    { id: 2, name: "Aditya", email: "adit@taraju.com", role: "Client", status: "Active", lastActive: "1 hour ago" },
    { id: 3, name: "Bunda", email: "bunda@pawonsengon.com", role: "Client", status: "Pending", lastActive: "Never" },
  ];

  return (
    <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Pengguna Sistem</h1>
          <p className="text-neutral-500 mt-1">Kelola akses, peran, dan status seluruh pengguna platform Frahma.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 px-4 py-2 rounded-xl text-sm font-medium hover:scale-105 active:scale-95 transition-all shadow-sm">
          <Icons.add className="w-4 h-4" />
          Tambah Pengguna
        </button>
      </motion.div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              className="w-full pl-9 pr-4 py-2 bg-neutral-100/50 dark:bg-neutral-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-neutral-900/5 dark:focus:ring-white/5 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 dark:bg-neutral-800/20 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Peran (Role)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aktivitas Terakhir</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/50 dark:divide-neutral-800/50">
              {users.map((user, index) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  key={user.id} 
                  className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-600 dark:text-neutral-300">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">{user.name}</div>
                        <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Icons.send className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      <Icons.info className="w-3 h-3" />
                      {user.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.status === 'Active' 
                        ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {user.status === 'Active' ? <Icons.circleCheck className="w-3 h-3" /> : <Icons.clock className="w-3 h-3" />}
                      {user.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500 tabular-nums">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors opacity-0 group-hover:opacity-100">
                      <Icons.moreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

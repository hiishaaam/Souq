/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { SearchPage } from "./components/SearchPage";
import { ManagePage } from "./components/ManagePage";
import { SalesPage } from "./components/SalesPage";
import { Toast } from "./components/Toast";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const [currentView, setCurrentView] = useState<"search" | "manage" | "sales">("search");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === "search" && (
            <motion.div
              key="search"
              className="h-full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <SearchPage />
            </motion.div>
          )}
          {currentView === "manage" && (
            <motion.div
              key="manage"
              className="h-full overflow-y-auto"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ManagePage showToast={showToast} />
            </motion.div>
          )}
          {currentView === "sales" && (
            <motion.div
              key="sales"
              className="h-full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <SalesPage showToast={showToast} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="px-6 py-6 md:px-12 border-t border-gold/20 flex justify-between items-center bg-[#fcfaf7]">
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">© 2026 SOUQ Proprietary Systems</p>
        <div className="flex items-center gap-4">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 hidden sm:inline-block">Firestore Live Connection Active</span>
        </div>
      </footer>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}


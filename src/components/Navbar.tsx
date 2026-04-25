import { cn } from "@/lib/utils";

interface NavbarProps {
  currentView: "search" | "manage";
  onViewChange: (view: "search" | "manage") => void;
}

export function Navbar({ currentView, onViewChange }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-forest px-6 py-5 md:px-12 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-3">
        <img src="/favicon.svg" alt="SOUQ Logo" className="h-10 w-10 object-contain" />
        <span className="text-sand font-serif text-2xl tracking-tighter">
          SOUQ
        </span>
      </div>
      <div className="flex gap-8 md:gap-10 text-sand text-[10px] font-bold tracking-[0.2em] uppercase">
        <button
          onClick={() => onViewChange("search")}
          className={cn(
            "cursor-pointer pb-1 transition-all",
            currentView === "search"
              ? "border-b-2 border-gold opacity-100"
              : "border-b-2 border-transparent opacity-50 hover:opacity-100"
          )}
        >
          Search
        </button>
        <button
          onClick={() => onViewChange("manage")}
          className={cn(
            "cursor-pointer pb-1 transition-all",
            currentView === "manage"
              ? "border-b-2 border-gold opacity-100"
              : "border-b-2 border-transparent opacity-50 hover:opacity-100"
          )}
        >
          Manage
        </button>
      </div>
    </nav>
  );
}

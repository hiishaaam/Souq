import { useState, useEffect } from "react";
import { Check, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={cn(
        "flex items-center space-x-3 px-4 py-4 shadow-xl shadow-forest/10 border w-full max-w-sm md:max-w-md mx-auto md:ml-auto",
        type === "success" ? "bg-white border-gold text-forest" : "bg-red-50 border-red-200 text-red-800"
      )}>
        {type === "success" ? (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-gold-inner text-[#a3802c]" />
          </div>
        ) : (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
        )}
        <p className="font-medium text-sm flex-1">{message}</p>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4 opacity-50" />
        </button>
      </div>
    </div>
  );
}

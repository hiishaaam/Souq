import React from "react";
import { Product } from "@/types";
import { formatDistanceToNow } from "date-fns";

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <div className="bg-white border-t-4 border-forest p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 gap-6">
      <div className="space-y-3">
        <div>
          <span className="bg-gold text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest">
            {product.category}
          </span>
          <h3 className="font-serif text-xl mt-3">{product.name}</h3>
          <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase mt-1">Pack: {product.unit}</p>
          {product.description && (
            <p className="text-xs text-forest/70 mt-2 line-clamp-2">{product.description}</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[9px] text-gray-400 uppercase tracking-widest">Last Updated</p>
          <p className="text-[9px] font-bold italic text-forest">
            {formatDistanceToNow(product.updatedAt, { addSuffix: true })}
          </p>
        </div>
        <div className="text-right">
          <span className="text-forest text-2xl font-serif tracking-tighter">
            ₹ {product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

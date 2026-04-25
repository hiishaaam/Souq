import React, { useState, useEffect } from "react";
import { Product } from "@/types";
import { X } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'updatedAt'>) => Promise<void>;
  productToEdit?: Product | null;
}

export function ProductModal({ isOpen, onClose, onSave, productToEdit }: ProductModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Nitrogen");
  const [unit, setUnit] = useState("1 Ltr");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setUnit(productToEdit.unit);
      setPrice(productToEdit.price.toString());
      setDescription(productToEdit.description || "");
    } else {
      setName("");
      setCategory("Nitrogen");
      setUnit("1 Ltr");
      setPrice("");
      setDescription("");
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        name,
        category,
        unit,
        price: parseFloat(price),
        ...(description ? { description } : {}),
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/80 backdrop-blur-sm">
      <div className="bg-sand border-t-4 border-forest w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gold/20">
          <h2 className="text-2xl font-serif text-forest">
            {productToEdit ? "Edit Product" : "Add Product"}
          </h2>
          <button 
            onClick={onClose}
            className="text-forest/60 hover:text-forest transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-2">Product Name</label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 py-3 bg-white border border-gold/20 focus:border-gold focus:outline-none shadow-sm text-forest transition-colors text-sm font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-2">Category</label>
              <select
                id="category"
                required
                className="w-full px-4 py-3 bg-white border border-gold/20 focus:border-gold focus:outline-none shadow-sm text-forest transition-colors text-sm font-medium appearance-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Nitrogen">Nitrogen</option>
                <option value="Phosphorus">Phosphorus</option>
                <option value="Potassium">Potassium</option>
                <option value="Organic">Organic</option>
                <option value="Pesticide">Pesticide</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="unit" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-2">Unit</label>
              <input
                type="text"
                id="unit"
                list="unit-options"
                required
                className="w-full px-4 py-3 bg-white border border-gold/20 focus:border-gold focus:outline-none shadow-sm text-forest transition-colors text-sm font-medium"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., 500 ml, 1 Ltr, per kg"
              />
              <datalist id="unit-options">
                <option value="100 ml" />
                <option value="250 ml" />
                <option value="500 ml" />
                <option value="1 Ltr" />
                <option value="2 Ltr" />
                <option value="5 Ltr" />
                <option value="100 g" />
                <option value="250 g" />
                <option value="500 g" />
                <option value="1 kg" />
                <option value="5 kg" />
                <option value="per kg" />
                <option value="per bag" />
                <option value="per unit" />
              </datalist>
            </div>
            
            <div>
              <label htmlFor="price" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-2">Price (₹)</label>
              <input
                type="number"
                id="price"
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-white border border-gold/20 focus:border-gold focus:outline-none shadow-sm text-forest transition-colors text-sm font-medium"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-2">Use / Description (Optional)</label>
              <textarea
                id="description"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gold/20 focus:border-gold focus:outline-none shadow-sm text-forest transition-colors text-sm font-medium resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Best pesticide for fungus..."
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-forest/80 hover:text-forest transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-forest text-sand text-[10px] uppercase tracking-widest font-bold hover:bg-forest/90 transition-colors disabled:opacity-70 shadow-sm"
            >
              {isSubmitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

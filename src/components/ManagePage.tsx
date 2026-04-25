import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Product } from "@/types";
import { handleFirestoreError, OperationType } from "@/lib/firestore-error";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ProductModal } from "./ProductModal";

interface ManagePageProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function ManagePage({ showToast }: ManagePageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const prods: Product[] = [];
      querySnapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      // Sort in memory by name
      prods.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(prods);
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("Failed to load products", "error");
      handleFirestoreError(error, OperationType.LIST, "products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'updatedAt'>) => {
    try {
      const now = Date.now();
      
      if (editingProduct && editingProduct.id) {
        // Update
        const docRef = doc(db, "products", editingProduct.id);
        await updateDoc(docRef, {
          ...productData,
          updatedAt: now
        });
        showToast("Product updated successfully", "success");
      } else {
        // Create new
        const newDocRef = doc(collection(db, "products"));
        await setDoc(newDocRef, {
          ...productData,
          updatedAt: now
        });
        showToast("Product added successfully", "success");
      }
      
      await fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("Failed to save product", "error");
      handleFirestoreError(error, editingProduct?.id ? OperationType.UPDATE : OperationType.CREATE, "products");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        showToast("Product deleted successfully", "success");
        await fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        showToast("Failed to delete product", "error");
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-8 md:p-12 w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-forest mb-1 md:mb-2">Manage Products</h1>
          <p className="text-forest/60 font-medium tracking-wide text-sm uppercase">Inventory Control</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-forest text-sand px-6 py-3 font-bold text-[10px] uppercase tracking-widest flex items-center space-x-2 hover:bg-forest/90 transition-all shadow-sm shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white border-t-4 border-forest shadow-sm overflow-hidden">
        <div className="overflow-x-auto p-2 sm:p-4 md:p-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gold/20 text-forest/60 text-[8px] sm:text-[10px] font-bold tracking-[0.2em] uppercase">
                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold">Name</th>
                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold hidden sm:table-cell">Category</th>
                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold">Price</th>
                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold hidden md:table-cell">Last Updated</th>
                <th className="px-2 sm:px-4 py-3 sm:py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-2 sm:px-4 py-3 sm:py-5"><div className="h-5 bg-sand-dark w-20 sm:w-32"></div></td>
                    <td className="px-2 sm:px-4 py-3 sm:py-5 hidden sm:table-cell"><div className="h-5 bg-sand-dark w-16 sm:w-24"></div></td>
                    <td className="px-2 sm:px-4 py-3 sm:py-5"><div className="h-5 bg-sand-dark w-16 sm:w-20"></div></td>
                    <td className="px-2 sm:px-4 py-3 sm:py-5 hidden md:table-cell"><div className="h-5 bg-sand-dark w-28"></div></td>
                    <td className="px-2 sm:px-4 py-3 sm:py-5 text-right"><div className="h-5 bg-sand-dark w-16 mx-auto mr-0"></div></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-forest/60 font-serif italic text-lg">
                    No products found. Add one to get started.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-sand/30 transition-colors group">
                    <td className="px-2 sm:px-4 py-3 sm:py-5">
                      <div className="font-serif text-forest text-lg sm:text-xl">{product.name}</div>
                      <div className="sm:hidden mt-1 inline-block px-1.5 py-0.5 bg-gold text-white font-bold tracking-widest uppercase text-[8px]">
                        {product.category}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-5 hidden sm:table-cell">
                      <span className="inline-block px-2 py-1 bg-gold text-white font-bold tracking-widest uppercase text-[9px]">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-5">
                      <div className="font-serif text-base sm:text-xl tracking-tighter text-forest">₹ {product.price.toFixed(2)}</div>
                      <div className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Pack: {product.unit}</div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-5 text-[10px] text-forest/60 font-bold italic hidden md:table-cell">
                      {formatDistanceToNow(product.updatedAt, { addSuffix: true })}
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-5 text-right">
                      <div className="flex justify-end space-x-1 sm:space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1 sm:p-2 text-forest/60 hover:text-forest transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id!)}
                          className="p-1 sm:p-2 text-red-500/60 hover:text-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Search } from "lucide-react";
import { db } from "@/firebase";
import { Product } from "@/types";
import { handleFirestoreError, OperationType } from "@/lib/firestore-error";
import { ProductCard } from "./ProductCard";

export function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, "products");
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-8 md:p-12 flex flex-col gap-8 md:gap-12 w-full max-w-7xl mx-auto">
      <div className="max-w-3xl mx-auto w-full text-center space-y-4 md:space-y-6">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight text-forest">
          Premium Botanical <br/><span className="italic font-normal">Price Index</span>
        </h1>
        <div className="relative max-w-xl mx-auto mt-4 md:mt-8">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gold" />
          </div>
          <input
            type="text"
            id="search"
            className="w-full bg-white border border-gold/20 py-5 pl-14 pr-6 text-sm focus:outline-none focus:border-gold shadow-sm tracking-wide transition-colors text-forest"
            placeholder="Search urea, organic potash, pesticides..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-white border-t-4 border-forest p-6 h-48 flex flex-col justify-between">
              <div className="h-4 w-16 bg-sand-dark mb-4"></div>
              <div className="h-6 w-3/4 bg-sand-dark mb-2"></div>
              <div className="h-3 w-1/4 bg-sand-dark mt-4"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sand-dark mb-4">
            <Search className="h-8 w-8 text-forest/40" />
          </div>
          <h3 className="text-xl font-serif text-forest mb-2">No products found</h3>
          <p className="text-forest/60">Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  );
}

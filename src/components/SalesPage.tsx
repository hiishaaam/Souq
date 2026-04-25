import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, addDoc, serverTimestamp, setDoc, doc, deleteDoc, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { Product, Sale, Expense } from "../types";
import { Plus, Download, Trash2, Edit2, CheckCircle2, ChevronRight, Calculator, IndianRupee, ArrowDown, ArrowUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { startOfDay, endOfDay, format } from "date-fns";
import { ProductModal } from "./ProductModal";

export function SalesPage({ showToast }: { showToast: (msg: string, type: "success" | "error") => void }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [totalPrice, setTotalPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI">("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const [dateStr, setDateStr] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [expenseSortOrder, setExpenseSortOrder] = useState<"asc" | "desc">("desc");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch products for dropdown
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const p = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(p);
    });
    return () => unsubProducts();
  }, []);

  useEffect(() => {
    // Fetch sales for selected date
    const d = new Date(dateStr);
    const start = startOfDay(d).getTime();
    const end = endOfDay(d).getTime();
    
    // Using string/number for where since timestamp is stored as number
    const q = query(
      collection(db, "sales"),
      where("timestamp", ">=", start),
      where("timestamp", "<=", end),
      orderBy("timestamp", "desc")
    );

    const unsubSales = onSnapshot(q, (snapshot) => {
      const s = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
      setSales(s);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching sales: ", error);
      showToast("Error loading sales. " + error.message, "error");
      setIsLoading(false);
    });

    const expenseQuery = query(
      collection(db, "expenses"),
      where("timestamp", ">=", start),
      where("timestamp", "<=", end),
      orderBy("timestamp", "desc")
    );

    const unsubExpenses = onSnapshot(expenseQuery, (snapshot) => {
      const e = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
      setExpenses(e);
    }, (error) => {
      console.error("Error fetching expenses: ", error);
      showToast("Error loading expenses. " + error.message, "error");
    });

    return () => {
      unsubSales();
      unsubExpenses();
    };
  }, [dateStr]);

  // Suggest price when product or quantity changes
  useEffect(() => {
    if (selectedProductId && quantity) {
      const p = products.find(prod => prod.id === selectedProductId);
      if (p && p.price) {
        const q = parseFloat(quantity) || 0;
        setTotalPrice((p.price * q).toFixed(2).replace(/\.00$/, ''));
      }
    } else if (!selectedProductId) {
       setTotalPrice("");
    }
  }, [selectedProductId, quantity, products]);

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !totalPrice) {
      showToast("Please fill all required fields", "error");
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    setIsSubmitting(true);
    try {
      const newSale: Omit<Sale, "id"> = {
        productId: product.id!,
        productName: product.name,
        quantity: parseFloat(quantity),
        totalPrice: parseFloat(totalPrice),
        paymentMethod,
        timestamp: Date.now() // For backdating, could use `new Date(dateStr).getTime()` but we just use insert time
      };

      // Since sales might be logged later, maybe prompt if they want backdated? 
      // For simplicity let's use Date.now() but if dateStr is not today we should use dateStr time.
      const selectedD = new Date(dateStr);
      const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
      if (!isToday) {
        newSale.timestamp = selectedD.getTime() + 1000 * 60 * 60 * 12; // Noon of that day
      }

      await addDoc(collection(db, "sales"), newSale);
      showToast("Sale recorded!", "success");
      
      // Reset form (keep the same date, reset product)
      setSelectedProductId("");
      setProductSearchTerm("");
      setQuantity("1");
      setTotalPrice("");
    } catch (e: any) {
      showToast("Failed to record sale: " + e.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this sale?")) {
      try {
        await deleteDoc(doc(db, "sales", id));
        showToast("Sale deleted.", "success");
      } catch (err: any) {
        showToast("Error deleting: " + err.message, "error");
      }
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteDoc(doc(db, "expenses", id));
        showToast("Expense deleted.", "success");
      } catch (err: any) {
        showToast("Error deleting: " + err.message, "error");
      }
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseName || !expenseAmount) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const newExpense: Omit<Expense, "id"> = {
        name: expenseName,
        amount: parseFloat(expenseAmount),
        timestamp: Date.now()
      };

      const selectedD = new Date(dateStr);
      const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
      if (!isToday) {
        newExpense.timestamp = selectedD.getTime() + 1000 * 60 * 60 * 12;
      }

      await addDoc(collection(db, "expenses"), newExpense);
      showToast("Expense recorded!", "success");
      
      setExpenseName("");
      setExpenseAmount("");
    } catch (err: any) {
      showToast("Failed to record expense: " + err.message, "error");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add font styles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("SOUQ - Daily Sales Report", 14, 22);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${format(new Date(dateStr), "PP")}`, 14, 32);

    autoTable(doc, {
      startY: 40,
      head: [["Product", "Qty", "Pay Method", "Amount"]],
      body: sales.map(s => [
        s.productName,
        s.quantity.toString(),
        s.paymentMethod,
        s.totalPrice.toFixed(2)
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 60, 40] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: "bold" },
      foot: [
        ["Total Cash", "", "", sales.filter(s => s.paymentMethod === "Cash").reduce((sum, s) => sum + s.totalPrice, 0).toFixed(2)],
        ["Total UPI", "", "", sales.filter(s => s.paymentMethod === "UPI").reduce((sum, s) => sum + s.totalPrice, 0).toFixed(2)],
        ["Total Expenses", "", "", expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)],
        ["GRAND TOTAL", "", "", `Rs. ${(sales.reduce((sum, s) => sum + s.totalPrice, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)).toFixed(2)}`]
      ]
    });
    
    doc.save(`Sales_Report_${dateStr}.pdf`);
  };

  const totalCash = sales.filter(s => s.paymentMethod === "Cash").reduce((acc, s) => acc + s.totalPrice, 0);
  const totalUPI = sales.filter(s => s.paymentMethod === "UPI").reduce((acc, s) => acc + s.totalPrice, 0);
  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const handleProductSave = async (data: Omit<Product, "id">) => {
    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...data,
        updatedAt: Date.now()
      });
      showToast("Product added successfully", "success");
      setIsProductModalOpen(false);
      setProductSearchTerm(data.name);
      
      // Select it immediately and let the onSnapshot sync complete eventually
      setSelectedProductId(docRef.id);
      
      // Update the local state temporarily so the value doesn't unmount
      setProducts(prev => [...prev, { id: docRef.id, ...data } as Product]);
    } catch (e: any) {
      showToast("Error adding product: " + e.message, "error");
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#fcfaf7] overflow-y-auto md:overflow-hidden">
      {/* LEFT: Add Sale Form */}
      <div className="w-full lg:w-[30%] md:h-full bg-white border-r border-gold/20 p-4 sm:p-6 md:overflow-y-auto flex flex-col shadow-sm shrink-0">
        <h2 className="font-serif tracking-tight text-2xl md:text-3xl text-forest mb-4 md:mb-6">New Sale</h2>
        
        <form onSubmit={handleAddSale} className="flex flex-col gap-5">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-2">Product</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white border border-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 shadow-sm text-forest transition-colors text-sm font-medium"
              placeholder="Search product..."
              value={productSearchTerm}
              onChange={(e) => {
                setProductSearchTerm(e.target.value);
                setSelectedProductId(""); // reset ID if they modify text
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              required
            />
            {showProductDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gold/20 shadow-lg max-h-60 flex flex-col">
                <div className="overflow-y-auto w-full">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <div 
                        key={p.id}
                        className="px-4 py-3 hover:bg-sand/30 cursor-pointer border-b border-gold/10 last:border-0"
                        onClick={() => {
                          setSelectedProductId(p.id!);
                          setProductSearchTerm(p.name);
                          setShowProductDropdown(false);
                        }}
                      >
                        <div className="font-semibold text-forest text-sm">{p.name}</div>
                        <div className="text-xs text-forest/60">{p.unit} &bull; ₹{p.price}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-forest/60 text-xs italic">
                      No matching products found.
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-gold/20 bg-[#fcfaf7] sticky bottom-0 shrink-0">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowProductDropdown(false);
                      setIsProductModalOpen(true);
                    }}
                    className="w-full text-xs bg-forest text-sand px-4 py-2 uppercase tracking-widest font-bold hover:bg-forest/90 transition-colors shadow-sm"
                  >
                    + Add New Product
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-2">Quantity</label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                className="w-full px-4 py-3 bg-white border border-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 shadow-sm text-forest transition-colors text-sm font-medium"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            
            <div className="w-1/2">
              <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-2">Total ₹</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                className="w-full px-4 py-3 bg-white border border-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 shadow-sm text-forest transition-colors text-sm font-medium"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-3">Payment Method</label>
            <div className="flex bg-sand/30 rounded-full p-1 border border-gold/20">
              <button
                type="button"
                className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-full transition-all ${paymentMethod === 'Cash' ? 'bg-forest text-sand shadow-md' : 'text-forest/60 hover:text-forest'}`}
                onClick={() => setPaymentMethod('Cash')}
              >
                Cash
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-full transition-all ${paymentMethod === 'UPI' ? 'bg-forest text-sand shadow-md' : 'text-forest/60 hover:text-forest'}`}
                onClick={() => setPaymentMethod('UPI')}
              >
                UPI
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedProductId}
            className="w-full mt-4 bg-gold hover:bg-[#d4b05a] text-forest font-bold tracking-widest uppercase text-xs py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Recording...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Record Sale
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gold/20">
          <h2 className="font-serif tracking-tight text-xl md:text-2xl text-forest mb-4">Add Expense</h2>
          <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-2">Notice / Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-white border border-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 shadow-sm text-forest transition-colors text-sm font-medium"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="E.g. Transport, Restocking..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-2">Amount ₹</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                className="w-full px-4 py-3 bg-white border border-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 shadow-sm text-forest transition-colors text-sm font-medium"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingExpense}
              className="w-full mt-2 bg-red-800 hover:bg-red-900 text-sand font-bold tracking-widest uppercase text-xs py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmittingExpense ? (
                <span className="animate-pulse">Recording...</span>
              ) : (
                <>
                  <IndianRupee size={16} />
                  Record Expense
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: Daily Summary & Sales List */}
      <div className="w-full lg:w-[70%] h-full overflow-y-auto p-4 sm:p-6 md:p-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4">
          <div className="w-full md:w-auto">
            <h1 className="font-serif text-3xl md:text-4xl text-forest tracking-tight">Sales Report</h1>
            <input 
              type="date" 
              className="mt-2 w-full md:w-auto bg-transparent text-sm font-medium tracking-wide text-forest/70 border-b border-gold/40 focus:outline-none focus:border-gold pb-1"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>
          
          <button 
            onClick={generatePDF}
            className="bg-forest text-sand px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 hover:bg-forest/90 transition-all shadow-md mt-2 md:mt-0 w-full md:w-auto justify-center shrink-0"
          >
            <Download size={14} />
            Download PDF
          </button>
        </div>

        {/* Scorecards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white p-4 sm:p-6 border border-gold/20 shadow-sm flex flex-col items-center justify-center">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.2em] text-forest/50 mb-1 sm:mb-2 text-center">Total Cash</span>
            <span className="font-serif text-2xl sm:text-3xl text-forest">₹{totalCash.toFixed(0)}</span>
          </div>
          <div className="bg-white p-4 sm:p-6 border border-gold/20 shadow-sm flex flex-col items-center justify-center">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.2em] text-forest/50 mb-1 sm:mb-2 text-center">Total UPI</span>
            <span className="font-serif text-2xl sm:text-3xl text-forest">₹{totalUPI.toFixed(0)}</span>
          </div>
          <div className="bg-forest p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center col-span-2 lg:col-span-1">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.2em] text-gold mb-1 sm:mb-2 text-center">Grand Total</span>
            <span className="font-serif text-3xl sm:text-4xl text-sand">₹{(totalCash + totalUPI - totalExpense).toFixed(0)}</span>
          </div>
        </div>

        {/* List */}
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60 mb-4 border-b border-gold/20 pb-2">Records</h3>
          {isLoading ? (
            <div className="text-center py-10 opacity-50 font-serif">Loading...</div>
          ) : sales.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gold/50 flex flex-col items-center justify-center text-forest/50">
              <Calculator size={32} className="mb-4 opacity-50" />
              <p className="font-serif text-xl">No sales found on this date.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sales.map((sale) => (
                <div key={sale.id} className="bg-white p-4 border border-gold/10 flex items-center justify-between group shadow-sm hover:border-gold/40 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-serif text-xl text-forest">{sale.productName}</h4>
                    <p className="text-xs text-forest/60 uppercase tracking-widest font-bold mt-1">Qty: {sale.quantity} &nbsp;&bull;&nbsp; {sale.paymentMethod}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="font-serif text-xl text-forest">₹{sale.totalPrice}</span>
                    <button 
                      onClick={() => handleDelete(sale.id!)}
                      className="md:opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-700/60 hover:text-red-700 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="mt-8 mb-16 md:mb-8">
          <div className="flex items-center justify-between border-b border-gold/20 mb-4 pb-2">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-forest/60">Expenses</h3>
            <button 
              onClick={() => setExpenseSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="text-[10px] flex items-center gap-1 font-bold tracking-widest uppercase text-forest/60 hover:text-forest transition-colors"
            >
              Time
              {expenseSortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
            </button>
          </div>
          {isLoading ? (
            <div className="text-center py-10 opacity-50 font-serif">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gold/50 flex flex-col items-center justify-center text-forest/50">
              <p className="font-serif text-xl">No expenses found on this date.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...expenses].sort((a, b) => expenseSortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp).map((expense) => (
                <div key={expense.id} className="bg-white p-4 border border-red-900/10 flex items-center justify-between group shadow-sm hover:border-red-900/40 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-serif text-xl text-forest">{expense.name}</h4>
                    <p className="text-xs text-forest/60 uppercase tracking-widest font-bold mt-1">
                      {format(expense.timestamp, "hh:mm a")}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="font-serif text-xl text-red-800">₹{expense.amount}</span>
                    <button 
                      onClick={() => handleDeleteExpense(expense.id!)}
                      className="md:opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-700/60 hover:text-red-700 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <ProductModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleProductSave}
        productToEdit={null}
      />
    </div>
  );
}

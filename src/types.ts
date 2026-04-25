export interface Product {
  id?: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  description?: string;
  updatedAt: number;
}

export interface Sale {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  paymentMethod: "Cash" | "UPI";
  timestamp: number;
  batchId?: string;
  receiptTotal?: number;
  receiptItemCount?: number;
}

export interface Expense {
  id?: string;
  name: string;
  amount: number;
  timestamp: number;
}

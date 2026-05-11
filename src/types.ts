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
}

export interface Expense {
  id?: string;
  name: string;
  amount: number;
  timestamp: number;
}

export interface DailyCash {
  id?: string;
  date: string;
  openingCash: number;
  updatedAt: number;
}

export interface CreditCollection {
  id?: string;
  customerName: string;
  amount: number;
  paymentMethod: "Cash" | "UPI";
  timestamp: number;
}

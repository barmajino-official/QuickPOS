/**
 * @file index.ts
 * @description All shared TypeScript interfaces for the QuickPOS Pro frontend.
 */

export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  staff: StaffProfile;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface Brand {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  link: string | null;
  imageUrl: string | null;
  createdAt: string;
}


export interface BrandProductRow {
  id: number;
  name: string;
  price: number;
  cost: number;
  stock: number;
  unitsSold: number;
}

export interface BrandAnalytics {
  id: number;
  name: string;
  unitsSold: number;
  revenue: number;
  costOfSold: number;
  profit: number;
  stockUnits: number;
  stockValue: number;
  inventoryBudget: number;
  products: BrandProductRow[];
  imageUrl: string | null;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  cost: number;
  stock: number;
  categoryId: number | null;
  brandId: number | null;
  barcode: string | null;
  imageUrl: string | null;
  expiryDate: string | null;
  createdAt: string;
  category: Category | null;
  brand: Brand | null;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  total: number;
  status: string;
  customerId: number | null;
  customerName: string | null;
  staffId: string | null;
  staffName: string | null;
  createdAt: string;
  items?: OrderItem[];
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  permissions: Record<string, boolean>;
  createdAt: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrderCount: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: { id: number; name: string; stock: number }[];
  expiringSoon: { id: number; name: string; expiryDate: string; stock: number }[];
  topProducts: { id: number; name: string; totalSold: number }[];
  topStaff: { id: string; name: string; orderCount: number }[];
  salesTrend: DailySales[];
}

export interface DailySales {
  date: string;
  revenue: number;
  orderCount: number;
}

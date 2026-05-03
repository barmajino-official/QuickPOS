export interface Permissions {
  dashboard: boolean;
  pos: boolean;
  orders: boolean;
  products: boolean;
  categories: boolean;
  customers: boolean;
  staff: boolean;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions?: Permissions;
  created_at: string;
  isSuperAdmin?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category_id?: string;
  image_url?: string;
  expiry_date?: string;
  created_at: string;
  categories?: { name: string };
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

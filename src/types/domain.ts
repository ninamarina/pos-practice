// Domain types shared by the API (route handlers) and the UI

export type Role = 'owner' | 'cashier';

export type User = {
  id: string;
  name: string;
  role: Role;
};

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  sku: string;
  barcode: string; // EAN-13
  name: string;
  categoryId: string;
  price: number; // MXN cents, IVA included
  stock: number;
  imageUrl: string | null;
};

export type PaymentMethod = 'cash' | 'card';

export type SaleItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type Sale = {
  id: string;
  folio: number;
  createdAt: string;
  cashierId: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived: number | null;
  change: number | null;
};

export type CreateSaleInput = {
  cashierId: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived: number | null;
};

export type UpdateProductInput = Partial<Pick<Product, 'name' | 'price' | 'stock' | 'categoryId'>>;

// GET /api/sales: one page of the filtered sales, plus a summary of the whole filtered set
export type SalesPage = {
  items: Sale[];
  page: number;
  pageSize: number;
  totalPages: number;
  summary: { count: number; total: number }; // total in cents
  newerCount: number; // sales that match the filters but arrived after `asOf`
};

export type ApiError = {
  error: { code: string; message: string };
};

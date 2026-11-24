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

// The client sends only what the cashier chose. The server looks up the prices and computes the total.
// expectedTotal is the total the cashier saw: if prices changed since, the server answers 409 price_changed
export type CreateSaleInput = {
  items: { productId: string; quantity: number }[];
  expectedTotal: number;
  paymentMethod: PaymentMethod;
  cashReceived: number | null;
};

// The sale plus the stock left for each product sold, so the client can update its cache without refetching
export type CreateSaleResult = {
  sale: Sale;
  stock: Record<string, number>;
};

export type UpdateProductInput = Partial<Pick<Product, 'name' | 'price' | 'stock' | 'categoryId'>>;

export type ApiError = {
  error: { code: string; message: string };
};

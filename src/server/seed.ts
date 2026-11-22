import { addDays, dayInZone, startOfDay } from '@/lib/dates';
import { STORE_TIME_ZONE } from '@/lib/store-config';
import type { Category, Product, Sale, User } from '@/types/domain';

export const USERS: User[] = [
  { id: 'usr_ana', name: 'Ana Torres', role: 'owner' },
  { id: 'usr_luis', name: 'Luis Méndez', role: 'cashier' },
];

export const CATEGORIES: Category[] = [
  { id: 'bebidas', name: 'Bebidas' },
  { id: 'botanas', name: 'Botanas y dulces' },
  { id: 'lacteos', name: 'Lácteos' },
  { id: 'panaderia', name: 'Panadería' },
  { id: 'abarrotes', name: 'Abarrotes' },
  { id: 'limpieza', name: 'Limpieza' },
  { id: 'cuidado', name: 'Cuidado personal' },
  { id: 'frutas', name: 'Frutas y verduras' },
];

// Base catalog: [categoryId, product, brands, sizes, base price in pesos]
const BASE: [string, string, string[], string[], number][] = [
  ['bebidas', 'Refresco de cola', ['Cola Real', 'Fiesta', 'Sabritas Cola'], ['355 ml', '600 ml', '2 L', '3 L'], 18],
  ['bebidas', 'Agua natural', ['Ciel', 'Bonafont', 'Epura', 'Santa María'], ['500 ml', '1 L', '1.5 L', '5 L'], 10],
  ['bebidas', 'Jugo de naranja', ['Jumex', 'Del Valle', 'Boing'], ['250 ml', '500 ml', '1 L'], 14],
  ['bebidas', 'Agua mineral', ['Topo Chico', 'Peñafiel', 'Garci Crespo'], ['355 ml', '600 ml', '1.5 L'], 16],
  ['bebidas', 'Bebida energética', ['Volt', 'Vive 100', 'Boost'], ['250 ml', '473 ml'], 22],
  ['bebidas', 'Café frío', ['Nescafé', 'Starbucks', 'Andatti'], ['281 ml', '405 ml'], 28],
  ['botanas', 'Papas fritas', ['Sabritas', 'Barcel', 'Great Value'], ['45 g', '110 g', '240 g'], 17],
  ['botanas', 'Cacahuates japoneses', ['Mafer', 'Nipon', 'Barcel'], ['60 g', '170 g'], 15],
  ['botanas', 'Galletas', ['Gamesa', 'Marinela', 'Pozo'], ['90 g', '300 g', '600 g'], 19],
  ['botanas', 'Chocolate', ['Carlos V', 'Hershey\'s', 'Turín', 'Larín'], ['18 g', '40 g', '100 g'], 12],
  ['botanas', 'Gomitas', ['Ricolino', 'Panditas', 'Vero'], ['50 g', '120 g'], 13],
  ['lacteos', 'Leche entera', ['Lala', 'Alpura', 'Santa Clara'], ['1 L', '1.5 L', '2 L'], 26],
  ['lacteos', 'Yogur bebible', ['Lala', 'Danone', 'Yoplait'], ['220 g', '1 kg'], 15],
  ['lacteos', 'Queso panela', ['Lala', 'Esmeralda', 'Nochebuena'], ['200 g', '400 g'], 45],
  ['lacteos', 'Crema ácida', ['Lala', 'Alpura'], ['200 ml', '450 ml', '900 ml'], 24],
  ['lacteos', 'Mantequilla', ['Gloria', 'Lala', 'Président'], ['90 g', '225 g'], 38],
  ['panaderia', 'Pan de caja', ['Bimbo', 'Wonder', 'Oroweat'], ['blanco', 'integral', 'multigrano'], 42],
  ['panaderia', 'Tortillas de harina', ['Tía Rosa', 'Bimbo', 'Milpa Real'], ['10 pzas', '20 pzas'], 30],
  ['panaderia', 'Pan dulce', ['Bimbo', 'Marinela', 'Tía Rosa'], ['concha', 'mantecada', 'dona'], 16],
  ['abarrotes', 'Arroz', ['Verde Valle', 'SOS', 'Great Value'], ['500 g', '1 kg', '2 kg'], 25],
  ['abarrotes', 'Frijol negro', ['Verde Valle', 'Isadora', 'La Costeña'], ['560 g', '900 g', '1 kg'], 32],
  ['abarrotes', 'Aceite vegetal', ['Nutrioli', '1-2-3', 'Capullo'], ['500 ml', '946 ml', '1.8 L'], 45],
  ['abarrotes', 'Atún en agua', ['Dolores', 'Tuny', 'Herdez'], ['130 g', '295 g'], 22],
  ['abarrotes', 'Salsa picante', ['Valentina', 'Búfalo', 'Tapatío', 'Cholula'], ['150 ml', '370 ml', '1 L'], 18],
  ['abarrotes', 'Sopa instantánea', ['Maruchan', 'Nissin', 'Knorr'], ['pollo', 'camarón', 'res', 'limón'], 13],
  ['abarrotes', 'Café soluble', ['Nescafé', 'Legal', 'Café Oro'], ['50 g', '120 g', '225 g'], 55],
  ['limpieza', 'Detergente en polvo', ['Ariel', 'Roma', 'Foca', 'Persil'], ['500 g', '1 kg', '3 kg'], 35],
  ['limpieza', 'Jabón para trastes', ['Salvo', 'Axion', 'Dawn'], ['300 ml', '750 ml', '1.1 L'], 29],
  ['limpieza', 'Cloro', ['Cloralex', 'Clorox'], ['500 ml', '950 ml', '2 L'], 20],
  ['limpieza', 'Papel higiénico', ['Pétalo', 'Regio', 'Kleenex', 'Suavel'], ['4 rollos', '12 rollos', '18 rollos'], 40],
  ['cuidado', 'Shampoo', ['Head & Shoulders', 'Pantene', 'Sedal', 'Herbal Essences'], ['180 ml', '375 ml', '700 ml'], 58],
  ['cuidado', 'Pasta dental', ['Colgate', 'Crest', 'Sensodyne'], ['50 ml', '100 ml', '150 ml'], 34],
  ['cuidado', 'Desodorante', ['Rexona', 'Axe', 'Dove', 'Nivea'], ['spray', 'barra', 'roll-on'], 52],
  ['cuidado', 'Jabón de tocador', ['Zest', 'Palmolive', 'Escudo', 'Dove'], ['1 pza', '3 pzas', '6 pzas'], 15],
  ['frutas', 'Plátano', ['granel'], ['1 kg'], 24],
  ['frutas', 'Aguacate', ['granel', 'Hass'], ['1 pza', '1 kg'], 20],
  ['frutas', 'Jitomate', ['granel', 'saladette'], ['1 kg'], 28],
  ['frutas', 'Limón', ['granel'], ['500 g', '1 kg'], 22],
];

// Deterministic pseudo-random so the catalog is the same on every server start
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function ean13(n: number) {
  const digits = `750${String(n).padStart(9, '0')}`; // 750: GS1 Mexico prefix
  const sum = [...digits].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return digits + ((10 - (sum % 10)) % 10);
}

export function createProducts(): Product[] {
  const random = seededRandom(42);
  const products: Product[] = [];

  // Each base product × brand × size, repeated in a few "presentations" to reach a realistic catalog size
  const presentations = ['', ' (paquete)', ' (caja)', ' (promo)', ' (sin azúcar)', ' (light)', ' (familiar)', ' (edición especial)'];
  for (const presentation of presentations) {
    for (const [categoryId, name, brands, sizes, basePrice] of BASE) {
      for (const brand of brands) {
        for (const size of sizes) {
          const n = products.length + 1;
          const multiplier = 1 + random() * 1.5;
          products.push({
            id: `prd_${n}`,
            sku: `SKU-${String(n).padStart(5, '0')}`,
            barcode: ean13(n),
            name: `${name} ${brand} ${size}${presentation}`,
            categoryId,
            // Round to 50 cents, like shelf prices
            price: Math.round((basePrice * multiplier * 100) / 50) * 50,
            stock: Math.floor(random() * 60),
            imageUrl: null,
          });
        }
      }
    }
  }
  return products;
}

// ~60 days of history (a couple of thousand sales a month), from 8:00 to 22:00 store time
const HISTORY_DAYS = 60;
const OPENING_HOUR = 8;
const CLOSING_HOUR = 22;

export function createSales(products: Product[]): Sale[] {
  const random = seededRandom(7);
  const now = new Date();
  const today = dayInZone(now, STORE_TIME_ZONE);

  // Sale times, oldest first, so folios grow with time
  const times: number[] = [];
  for (let offset = HISTORY_DAYS - 1; offset >= 0; offset--) {
    const opening = startOfDay(addDays(today, -offset), STORE_TIME_ZONE).getTime() + OPENING_HOUR * 3_600_000;
    const openMs = (CLOSING_HOUR - OPENING_HOUR) * 3_600_000;
    const count = 40 + Math.floor(random() * 50);
    const dayTimes = Array.from({ length: count }, () => opening + Math.floor(random() * openMs))
      .filter(time => time <= now.getTime())
      .sort((a, b) => a - b);
    times.push(...dayTimes);
  }

  const sales = times.map((time, i): Sale => {
    const items = Array.from({ length: 1 + Math.floor(random() * 4) }, () => {
      const product = products[Math.floor(random() * products.length)];
      return { productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 + Math.floor(random() * 3) };
    });
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const paymentMethod = random() > 0.5 ? 'card' : 'cash';
    const cashReceived = paymentMethod === 'cash' ? Math.ceil(total / 10000) * 10000 : null;

    return {
      id: `sale_${i + 1}`,
      folio: 1000 + i,
      createdAt: new Date(time).toISOString(),
      cashierId: random() > 0.3 ? 'usr_luis' : 'usr_ana',
      items,
      total,
      paymentMethod,
      cashReceived,
      change: cashReceived === null ? null : cashReceived - total,
    };
  });

  // Newest first, as the API returns them
  return sales.reverse();
}

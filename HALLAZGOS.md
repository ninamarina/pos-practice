# Hallazgos en Tiendita POS

Los problemas que encontré o que conversamos en los simulacros, con lo que diría de cada uno en una entrevista. Es material de repaso, no una lista completa: **puede haber más problemas en el código**.

Para cada uno:

- **Dónde:** el archivo.
- **Por qué es un problema:** qué le pasa al usuario o al negocio.
- **Cómo lo arreglaría:** del lado del front y lo que le pediría a backend.
- **Para la entrevista:** una frase para decirlo.

---

## 1. El servidor confía en el precio y el total que manda el front

**Dónde:** `POST /api/sales` en `src/app/api/sales/route.ts`. Guarda `line.unitPrice` y `body.total` tal como llegan.

**Por qué es un problema:** cualquiera puede editar el request con DevTools y vender una caja de leche a $0.01. Se llama **mass assignment**: el servidor acepta datos que el cliente no debería poder decidir.

**Cómo lo arreglaría:** el front manda solo lo que el usuario elige (`productId` y `quantity`). El servidor busca los precios y calcula el total. El front puede mostrar un total como **preview**, pero el que vale es el de la respuesta.

**Para la entrevista:** *"El precio y el total los calcula el servidor. El cliente manda ids y cantidades, porque cualquier cosa que viene del navegador se puede manipular."*

---

## 2. El stock puede quedar negativo

**Dónde:** el mismo handler. Hace `product.stock -= line.quantity` sin chequear si alcanza.

**Por qué es un problema:** con dos cajas vendiendo la última unidad al mismo tiempo, las dos ventas pasan. El inventario deja de reflejar la realidad.

**Cómo lo arreglaría:**

- **Backend:** chequear y descontar en una sola operación atómica, por ejemplo `UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock >= 1`. Si no alcanza, responde **`409 out_of_stock`**. Es un 409 y no un 422 porque el request está bien formado: el conflicto es con el estado actual del servidor.
- **Front:** ante el 409, mostrar qué producto no tiene stock y dejar que el cajero lo quite del ticket. Hay que preguntarle a producto si se permite "vender sin stock", porque el cliente tiene el producto en la mano.

**Para la entrevista:** *"El stock no lo puede garantizar el front, porque hay otras cajas. Lo valida el servidor al vender, de forma atómica, y responde 409. El front lo maneja sin perder el ticket."*

---

## 3. Vender no es idempotente: doble click, doble venta

**Dónde:**

- `src/features/checkout/components/CheckoutDialog.tsx`: el botón tiene `disabled={!canConfirm}`, pero no se deshabilita mientras la venta se está enviando.
- `POST /api/sales`: cada request crea una venta nueva.

**Por qué es un problema:** un doble click, o un reintento después de un error de red, registra la venta dos veces y descuenta el stock dos veces.

**Cómo lo arreglaría:**

- **Front:** deshabilitar el botón con `isPending`. Ayuda, pero no alcanza: si la respuesta se pierde por la red, el cajero reintenta.
- **Idempotency-Key:** el front genera un UUID **cuando se abre el diálogo de cobro** y lo manda en un header. Si reintenta, manda la **misma** key.
- **Backend:** guarda key → respuesta. Si llega la misma key, devuelve la respuesta guardada en lugar de crear otra venta.

**Para la entrevista:** *"Deshabilitar el botón es UX. Lo que garantiza que no se duplique es una Idempotency-Key que genero una vez por intento de cobro y reuso en los reintentos."*

---

## 4. Después de cada venta se vuelve a pedir todo el catálogo

**Dónde:** `useCreateSale` en `src/features/checkout/api.ts`. En `onSuccess` hace `invalidateQueries({ queryKey: ['products'] })`.

**Por qué es un problema:** para reflejar el stock de 3 productos, se vuelven a bajar los **2.528**, en cada venta. Además, como las keys son jerárquicas, también se invalidan todos los `['products', id]`.

**Cómo lo arreglaría:**

- Si la respuesta de la venta trae el stock actualizado, usar `setQueryData` para actualizar solo esos productos en el cache, sin requests.
- Otra opción: pedirle a backend un endpoint liviano solo de stock.

**Para la entrevista:** *"Invalidar es lo más simple, pero acá es caro. Uso `setQueryData` con lo que ya me devuelve la mutación y actualizo solo lo que cambió."*

---

## 5. `staleTime` por defecto (0)

**Dónde:** `src/app/providers.tsx` no define `staleTime`, y `useProducts` en `src/features/catalog/api.ts` tampoco.

**Por qué es un problema:** con `staleTime: 0`, cada vez que el cajero vuelve a la pestaña, o que se monta la pantalla, se vuelven a pedir los 2.528 productos.

**Lo que hay que tener claro:** `staleTime: 0` **no** hace que los datos estén siempre actualizados. Solo vuelve a pedirlos cuando pasa algo (montar, foco, reconexión).

- **Mis cambios** se reflejan con la mutación (`invalidateQueries` o `setQueryData`).
- **Los cambios de otros** (otra caja, la dueña) necesitan **polling** (`refetchInterval`) o **push** (SSE o WebSockets).

**Cómo lo arreglaría:** varios minutos de `staleTime` para el catálogo. El stock lo valida el servidor al vender (problema 2). Si producto necesita ver precios o stock casi en vivo, empiezo con polling a un endpoint liviano y paso a SSE si hace falta.

**Para la entrevista:** *"Depende del dato. El catálogo cambia poco, así que le doy minutos de `staleTime`. Lo correcto lo garantiza el servidor, y si hace falta frescura, empiezo con polling y escalo a SSE."*

---

## 6. El carrito se pierde al navegar

**Dónde:** `useCart()` es un `useState` dentro de `src/app/page.tsx`.

**Por qué es un problema:** si el cajero va a **Ventas** a mitad de un ticket, o recarga la página, el ticket se pierde.

**Cómo lo arreglaría:** hay dos cosas distintas:

- **Subir el estado** (lift state): ponerlo en un Context o en un store (por ejemplo, Zustand) arriba de las rutas, para que sobreviva a la navegación.
- **Persistirlo**: `localStorage` o IndexedDB, para que sobreviva a una recarga.

No hace falta un carrito en el servidor: el ticket es local a la caja.

**Para la entrevista:** *"Para un prototipo está bien. Si se necesita, lo subo a un store global y lo persisto en `localStorage`, que además es la base para vender sin conexión."*

---

## 7. Editar un producto manda todos los campos (lost update)

**Dónde:** `ProductForm` en `src/features/products/components/ProductForm.tsx` manda `{ name, price, stock, categoryId }`. Después, `useUpdateProduct` invalida `['products']`.

**Por qué es un problema:**

```
10:00  The owner opens the milk edit page. The form loads with stock = 10
10:01  The cashier sells a carton → the server leaves stock = 9
10:02  The owner changes ONLY the price and saves → it sends stock: 10
       → the server overwrites the stock. A carton "appears" out of nowhere
```

Un cambio pisa a otro hecho en el medio: es un **lost update**.

**Cómo lo arreglaría:**

- Mandar **solo los campos que cambiaron** en el PATCH.
- Con la respuesta del PATCH, hacer `setQueryData` en `['products', id]` y reemplazar el ítem en `['products']`, en lugar de volver a pedir todo.
- Para conflictos más serios, se puede pedir a backend control de versiones (`If-Match` / ETag → `409` si cambió).

**Para la entrevista:** *"Mando solo lo que cambió, para no pisar el stock que otra caja actualizó en el medio, y actualizo el cache con la respuesta del PATCH."*

---

## 8. Calentamiento: las categorías desaparecen

**Dónde:** `src/features/catalog/components/CategoryTabs.tsx`, dentro de la `<section>` de `src/app/page.tsx`.

**Por qué pasa:**

- La `<section>` es `flex flex-col` con `overflow-y-auto` y una altura limitada. Sus hijos tienen `flex-shrink: 1`, así que se achican cuando no entran.
- El contenedor de las categorías tiene `overflow-x-auto`. Un flex item con overflow distinto de `visible` tiene un tamaño mínimo de **0** (en lugar de su contenido), así que se achica hasta desaparecer.
- El buscador no desaparece porque su tamaño mínimo sigue siendo su contenido.

**Cómo lo arreglaría:**

- **Mínimo:** `shrink-0` en el **contenedor** de las categorías. Los botones **mantienen** su `shrink-0`: si se lo sacas, los nombres largos se parten en varias líneas.
- **Mejor UX:** que solo scrollee la grilla de productos (`flex-1 min-h-0 overflow-y-auto`), y que el buscador y las categorías queden fijos arriba.

**Cómo evitar que vuelva a pasar:** tests visuales de regresión (screenshots con Playwright), revisar la UI en el tamaño de una tablet, que es el dispositivo principal de una caja, y verificar que un arreglo no rompa otra cosa.

---

## Lo que está bien hecho

También suma reconocerlo en la entrevista:

- El dinero se maneja en **centavos** y se formatea con `Intl` (es-MX).
- **React Query** para el server state, sin duplicarlo en `useState`.
- Carpetas por **feature**.
- Errores de la API tipados, con una forma consistente.

# Hallazgos en Tiendita POS

Los problemas que encontré o que conversamos en los simulacros, con lo que diría de cada uno en una entrevista. Es material de repaso y cubre todos los problemas que se dejaron a propósito en el código.

Describe el código de la branch `exercise`. En `main` ya están aplicados los arreglos.

Para cada uno:

- **Dónde:** el archivo.
- **Por qué es un problema:** qué le pasa al usuario o al negocio.
- **Cómo lo arreglaría:** del lado del front y lo que le pediría a backend.
- **En una frase:** cómo lo diría, resumido.

---

## 1. El servidor confía en el precio y el total que manda el front

**Dónde:** `POST /api/sales` en `src/app/api/sales/route.ts`. Guarda `line.unitPrice` y `body.total` tal como llegan.

**Por qué es un problema:** cualquiera puede editar el request con DevTools y vender una caja de leche a $0.01. Se llama **mass assignment**: el servidor acepta datos que el cliente no debería poder decidir.

**Cómo lo arreglaría:** el front manda solo lo que el usuario elige (`productId` y `quantity`). El servidor busca los precios y calcula el total. El front puede mostrar un total como **preview**, pero el que vale es el de la respuesta.

**En una frase:** *"El precio y el total los calcula el servidor. El cliente manda ids y cantidades, porque cualquier cosa que viene del navegador se puede manipular."*

---

## 2. El stock puede quedar negativo

**Dónde:** el mismo handler. Hace `product.stock -= line.quantity` sin chequear si alcanza.

**Por qué es un problema:** con dos cajas vendiendo la última unidad al mismo tiempo, las dos ventas pasan. El inventario deja de reflejar la realidad.

**Cómo lo arreglaría:**

- **Backend:** chequear y descontar en una sola operación atómica, por ejemplo `UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock >= 1`. Si no alcanza, responde **`409 out_of_stock`**. Es un 409 y no un 422 porque el request está bien formado: el conflicto es con el estado actual del servidor.
- **Front:** ante el 409, mostrar qué producto no tiene stock y dejar que el cajero lo quite del ticket. Hay que preguntarle a producto si se permite "vender sin stock", porque el cliente tiene el producto en la mano.

**En una frase:** *"El stock no lo puede garantizar el front, porque hay otras cajas. Lo valida el servidor al vender, de forma atómica, y responde 409. El front lo maneja sin perder el ticket."*

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

**En una frase:** *"Deshabilitar el botón es UX. Lo que garantiza que no se duplique es una Idempotency-Key que genero una vez por intento de cobro y reuso en los reintentos."*

---

## 4. Después de cada venta se vuelve a pedir todo el catálogo

**Dónde:** `useCreateSale` en `src/features/checkout/api.ts`. En `onSuccess` hace `invalidateQueries({ queryKey: ['products'] })`.

**Por qué es un problema:** para reflejar el stock de 3 productos, se vuelven a bajar los **2.528**, en cada venta. Además, como las keys son jerárquicas, también se invalidan todos los `['products', id]`.

**Cómo lo arreglaría:**

- Si la respuesta de la venta trae el stock actualizado, usar `setQueryData` para actualizar solo esos productos en el cache, sin requests.
- Otra opción: pedirle a backend un endpoint liviano solo de stock.

**En una frase:** *"Invalidar es lo más simple, pero acá es caro. Uso `setQueryData` con lo que ya me devuelve la mutación y actualizo solo lo que cambió."*

---

## 5. `staleTime` por defecto (0)

**Dónde:** `src/app/providers.tsx` no define `staleTime`, y `useProducts` en `src/features/catalog/api.ts` tampoco.

**Por qué es un problema:** con `staleTime: 0`, cada vez que el cajero vuelve a la pestaña, o que se monta la pantalla, se vuelven a pedir los 2.528 productos.

**Lo que hay que tener claro:** `staleTime: 0` **no** hace que los datos estén siempre actualizados. Solo vuelve a pedirlos cuando pasa algo (montar, foco, reconexión).

- **Mis cambios** se reflejan con la mutación (`invalidateQueries` o `setQueryData`).
- **Los cambios de otros** (otra caja, la dueña) necesitan **polling** (`refetchInterval`) o **push** (SSE o WebSockets).

**Cómo lo arreglaría:** varios minutos de `staleTime` para el catálogo. El stock lo valida el servidor al vender (problema 2). Si producto necesita ver precios o stock casi en vivo, empiezo con polling a un endpoint liviano y paso a SSE si hace falta.

**En una frase:** *"Depende del dato. El catálogo cambia poco, así que le doy minutos de `staleTime`. Lo correcto lo garantiza el servidor, y si hace falta frescura, empiezo con polling y escalo a SSE."*

---

## 6. El carrito se pierde al navegar

**Dónde:** `useCart()` es un `useState` dentro de `src/app/page.tsx`.

**Por qué es un problema:** si el cajero va a **Ventas** a mitad de un ticket, o recarga la página, el ticket se pierde.

**Cómo lo arreglaría:** hay dos cosas distintas:

- **Subir el estado** (lift state): ponerlo en un Context o en un store (por ejemplo, Zustand) arriba de las rutas, para que sobreviva a la navegación.
- **Persistirlo**: `localStorage` o IndexedDB, para que sobreviva a una recarga.

No hace falta un carrito en el servidor: el ticket es local a la caja.

**En una frase:** *"Para un prototipo está bien. Si se necesita, lo subo a un store global y lo persisto en `localStorage`, que además es la base para vender sin conexión."*

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

**En una frase:** *"Mando solo lo que cambió, para no pisar el stock que otra caja actualizó en el medio, y actualizo el cache con la respuesta del PATCH."*

---

## 8. Las categorías desaparecen

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

## 9. Todo el catálogo se baja y se filtra en el navegador

**Dónde:** `useProducts` en `src/features/catalog/api.ts`, usado en la pantalla de Vender (`src/app/page.tsx`). La tabla de `src/app/productos/page.tsx` tiene el mismo problema.

**Por qué es un problema:**

- Se piden los 2.528 productos de una vez.
- Se filtran en el navegador **en cada tecla**, sin debounce.
- La grilla renderiza **todas** las tarjetas, sin virtualizar, y la tabla de Productos todas las filas.
- La API ya acepta `?q=` y `categoryId`, pero nadie los usa.

Con un catálogo más grande (por ejemplo, 20.000 productos), la pantalla de venta es lo primero que se pone lenta.

**Cómo lo arreglaría:**

- Antes que nada, **medir** con el React Profiler y la pestaña Performance, para saber qué es lo lento.
- Búsqueda en el servidor con `?q=`, con debounce y cancelando el request anterior.
- Paginación o scroll infinito, y **virtualizar** la grilla (por ejemplo, con TanStack Virtual), para renderizar solo lo que se ve.

**En una frase:** *"Hoy baja todo el catálogo y filtra en cada tecla. Primero mido; después paso la búsqueda al servidor con debounce, que la API ya soporta, y virtualizo la grilla."*

---

## 10. El precio queda congelado al agregar el producto al ticket

**Dónde:** el carrito guarda el producto entero y usa `line.product.price` (`src/features/cart`).

**Por qué es un problema:** si la dueña cambia el precio mientras el producto está en el ticket, la caja sigue mostrando el anterior.

**Cómo lo arreglaría:** es una regla de negocio que decide producto. Lo normal es cobrar el precio del momento en que se escaneó. Pero el que calcula lo que se cobra es el servidor (hallazgo 1), y si el precio cambió, la caja puede avisar: *"El precio de la leche cambió de $28 a $30"*.

**En una frase:** *"Qué precio se cobra lo decide producto; desde el front, me aseguro de que el servidor sea quien calcula y de avisar si el precio cambió."*

---

## 11. Los roles solo existen en la UI

**Dónde:**

- `src/app/productos/page.tsx` oculta "Editar" para el cajero, pero `/productos/:id` se abre igual escribiendo la URL.
- `PATCH /api/products/:id` no verifica quién lo llama.
- La "sesión" es un selector en el header (`src/features/session`), sin login real.

**Por qué es un problema:** cualquier cajero puede cambiar precios y stock.

**Cómo lo arreglaría:** autenticación real, y que **el backend** verifique el rol en cada endpoint y responda `403` si no corresponde. En el front, ocultar el botón sigue estando bien, pero es solo UX; además, manejar el `403` si llega.

**En una frase:** *"Ocultar el botón no es seguridad. Los permisos los aplica el backend; el front solo adapta la UI y maneja el 403."*

---

## 12. Los usuarios están duplicados

**Dónde:** `DEMO_USERS` en `src/features/session/SessionProvider.tsx` y `USERS` en `src/server/seed.ts`. `GET /api/users` existe, pero el front no lo usa.

**Por qué es un problema:** si se agrega o renombra un cajero en un lugar, el otro queda desactualizado, y la app muestra nombres distintos según la pantalla.

**Cómo lo arreglaría:** una sola fuente de verdad: la API. El front pide `/api/users` con React Query (con un `staleTime` largo, porque cambia poco).

**En una frase:** *"Hay dos listas de usuarios que se pueden desincronizar. Usaría solo la API, que ya existe."*

---

## 13. Errores al cobrar

**Dónde:** `src/features/checkout/components/CheckoutDialog.tsx`.

**Por qué es un problema:**

- Si la venta falla, se muestra el mensaje, pero no hay una forma clara de reintentar. Si el cajero reintenta a mano y la venta en realidad se había registrado, se duplica (hallazgo 3).
- El pago con tarjeta se confirma a mano: no hay ningún vínculo entre la terminal de pago y la venta, así que se puede registrar una venta con tarjeta que nunca se cobró.

**Cómo lo arreglaría:**

- Un botón "Reintentar" que reuse la **misma** Idempotency-Key, así el reintento nunca duplica.
- A futuro, integrar la terminal para que la venta se confirme cuando el pago se aprueba.

**En una frase:** *"Ante un error, el cajero necesita reintentar sin miedo a duplicar: por eso el reintento reusa la misma Idempotency-Key."*

---

## 14. Accesibilidad

**El diálogo de cobro** (`CheckoutDialog.tsx`):

- Al abrirlo, el foco **sí** entra: el campo "Recibido" tiene `autoFocus`.
- Pero el foco **no queda atrapado**: con Tab se sale del diálogo y llega a la grilla de productos que está detrás.
- **Escape no lo cierra.**
- Al cerrarlo, el foco **no vuelve** al botón "Cobrar": queda en el `<body>`, y quien usa teclado o lector de pantalla pierde su lugar.

**Las filas de Ventas** (`src/features/sales/components/SalesTable.tsx`): se expanden con un click en el `<tr>`, pero no se puede hacer con el teclado.

**Cómo lo arreglaría:**

- Un componente `Dialog` reutilizable que resuelva el foco, Escape y la vuelta del foco en un solo lugar (es el ejercicio 2 del README). Por ejemplo, con el elemento nativo `<dialog>` y `showModal()`, o con una librería como Radix o React Aria.
- En la tabla, un `<button>` dentro de la fila para expandirla, con `aria-expanded`.

**En una frase:** *"El diálogo maneja bien el foco al abrir, pero no lo atrapa, no cierra con Escape y no lo devuelve al cerrar. Lo resolvería una vez en un `Dialog` reutilizable, en lugar de en cada diálogo."*

---

## Lo que está bien hecho

También suma reconocerlo en la entrevista:

- El dinero se maneja en **centavos** y se formatea con `Intl` (es-MX).
- **React Query** para el server state, sin duplicarlo en `useState`.
- Carpetas por **feature**.
- Errores de la API tipados, con una forma consistente.

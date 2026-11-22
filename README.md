# Tiendita POS

Punto de venta para tiendas de barrio en México: el cajero busca productos, arma el ticket y cobra en efectivo o con tarjeta. La dueña además administra el catálogo.

Es un prototipo: la API es un mock en memoria servido por Next.js. Los datos se reinician al reiniciar el servidor.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Si el puerto está ocupado, Next usa el siguiente libre.

Para simular un backend inestable (por ejemplo, 30% de errores al registrar ventas):

```bash
SALES_FAILURE_RATE=0.3 npm run dev
```

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- TanStack Query (React Query) para el server state
- Tailwind CSS
- API: Route Handlers de Next (`src/app/api`) con datos en memoria y latencia simulada (200–700 ms)

## Pantallas

| Ruta | Qué hace | Quién |
| --- | --- | --- |
| `/` | **Vender**: catálogo con búsqueda y categorías, ticket y cobro | Todos |
| `/ventas` | Historial de ventas con el detalle de cada ticket | Todos |
| `/productos` | Catálogo con precios y stock | Todos |
| `/productos/:id` | Editar un producto | Solo la dueña |

El usuario actual se elige en el header: **Ana** (dueña) o **Luis** (cajero). No hay login real.

## Estructura

```
src/
  app/                 Rutas (páginas) y API (app/api)
  components/          UI genérica: Button, Badge, Spinner, estados de carga y error
  features/
    catalog/           Productos y categorías para vender (queries + grilla)
    cart/              Estado del ticket (useCart) y su panel
    checkout/          Diálogo de cobro y mutación de la venta
    sales/             Historial de ventas
    products/          Administración del catálogo
    session/           Usuario actual y rol
  lib/                 Cliente HTTP y formato de dinero
  server/              "Base de datos" en memoria, seed y helpers de la API
  types/               Tipos del dominio compartidos entre la API y la UI
```

## API

Los montos son **centavos de MXN** con IVA incluido.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/products?q=&categoryId=` | Lista de productos (~2.500) |
| `GET` | `/api/products/:id` | Un producto |
| `PATCH` | `/api/products/:id` | Edita nombre, precio, stock o categoría |
| `GET` | `/api/categories` | Categorías |
| `GET` | `/api/users` | Usuarios de la tienda |
| `GET` | `/api/sales` | Ventas, de la más nueva a la más vieja |
| `GET` | `/api/sales/:id` | Una venta |
| `POST` | `/api/sales` | Registra una venta y descuenta el stock |

Los errores tienen la forma `{ "error": { "code": "...", "message": "..." } }`.

---

## Ejercicios

Hay tres tipos de ejercicio:

- **Calentamiento:** un bug chico para resolver en vivo. Puedes usar la AI que quieras; nos interesa cómo lo investigas y cómo explicas la causa.
- **Casos:** conversamos cómo resolverías una feature. No hace falta escribir código: nos interesa cómo analizas el problema, qué preguntas harías, qué opciones ves y qué decidirías. Puedes apoyarte en el código existente y proponer cambios en él.
- **Diseño técnico:** a partir de un requerimiento de producto y un contrato de API ya definido, armas el diseño del frontend, hablado.

El foco es **frontend**. Si un caso necesita cambios en la API, alcanza con decir qué le pedirías al equipo de backend y por qué.

### Calentamiento: las categorías desaparecieron

En la pantalla **Vender**, debajo del buscador, deberían verse las categorías (Todo, Bebidas, Botanas y dulces…) para filtrar el catálogo. Hoy solo se ve una línea fina; los botones no aparecen.

Encuentra la causa, arréglalo y explica por qué pasaba. ¿Cómo evitarías que vuelva a pasar?

---

### 1. Descuentos

La tienda quiere aplicar descuentos:

- Un porcentaje o un monto fijo a un producto del ticket.
- Un descuento al total del ticket.
- Los cajeros pueden dar hasta 10%; descuentos mayores necesitan la autorización de la dueña.

¿Cómo lo modelarías y qué cambiarías en el front y en la API?

### 2. Vender sin internet

En muchas tiendas el internet se corta varias veces al día. Hoy, si no hay conexión, no se puede vender.

¿Cómo harías que el cajero pueda seguir cobrando sin conexión? ¿Qué pasa cuando vuelve?

### 3. Varias cajas

La tienda abre una segunda caja. Las dos venden al mismo tiempo sobre el mismo inventario.

¿Qué problemas aparecen? ¿Cómo mantendrías el stock y las ventas actualizados en las dos cajas?

### 4. Lector de código de barras

Queremos que el cajero escanee productos con un lector USB en lugar de buscarlos. El lector se comporta como un teclado: "tipea" el código y presiona Enter.

¿Cómo lo integrarías en la pantalla de venta?

### 5. Catálogo grande

Una cadena de minisúpers quiere usar el sistema con **20.000 productos**. ¿Qué parte de la app sufriría primero y cómo la prepararías?

### 6. Pago mixto

Un cliente quiere pagar una parte en efectivo y el resto con tarjeta. ¿Qué cambiarías?

### 7. Devoluciones

Un cliente vuelve con un producto del ticket #1032. ¿Cómo diseñarías el flujo de devolución?

### 8. Filtros en el historial de ventas

Hoy la pantalla **Ventas** muestra todas las ventas, sin filtros. La dueña quiere:

- Filtrar por **rango de fechas** (hoy, ayer, esta semana o un rango a elección), por **cajero** y por **método de pago**.
- Buscar una venta por su **folio**.
- Que el resumen de arriba (cantidad de ventas y monto total) refleje lo filtrado.
- Poder **compartir el link** de una vista filtrada con su contador.

La tienda tiene miles de ventas por mes. ¿Cómo lo implementarías en el front y qué le pedirías al backend?

---

### Diseño técnico: corte de caja

> **Requerimiento de producto**
>
> Hoy los dueños no saben si el efectivo de la caja cuadra con lo que se vendió. Al cerrar el día cuentan los billetes a mano y lo comparan "a ojo" con el historial.
>
> Queremos que cada cajero trabaje dentro de un **turno de caja**:
>
> - **Apertura:** al empezar, el cajero abre la caja e indica el fondo inicial (el efectivo con el que arranca, por ejemplo $500).
> - **Durante el turno:** todas las ventas quedan asociadas al turno. Se pueden registrar **retiros** de efectivo (por ejemplo, la dueña se lleva $2,000 al banco) e **ingresos** (agregar cambio).
> - **Corte:** al terminar, el cajero cuenta el efectivo por denominación (billetes de $500, $200… y monedas) y el sistema muestra el **efectivo esperado** (fondo + ventas en efectivo − cambio entregado + ingresos − retiros), el **contado** y la **diferencia**.
> - Si la diferencia supera $50, el corte necesita que la dueña lo revise y lo apruebe.
> - La dueña quiere un **reporte de cortes** por día y por cajero, con ventas por método de pago y diferencias.
> - No se puede vender sin un turno abierto.

**El backend ya está definido** (todavía no existe en este repo, pero puedes asumir este contrato):

| Método | Ruta | Respuesta / errores |
| --- | --- | --- |
| `GET` | `/api/shifts/current` | El turno abierto del usuario, o `404` si no hay |
| `POST` | `/api/shifts` | `{ openingFloat }` → `201` turno. `409 shift_already_open` |
| `POST` | `/api/shifts/:id/movements` | `{ type: "deposit" \| "withdrawal", amount, reason }` → `201` |
| `GET` | `/api/shifts/:id/summary` | Fondo, ventas por método, cambio entregado, movimientos y **efectivo esperado** |
| `POST` | `/api/shifts/:id/close` | `{ count: { "50000": 2, "20000": 5, … } }` → `200` con esperado, contado, diferencia y `status: "closed" \| "pending_review"` |
| `POST` | `/api/shifts/:id/approve` | Solo la dueña. `403` para cajeros |
| `GET` | `/api/shifts?date=&cashierId=` | Turnos para el reporte |
| `POST` | `/api/sales` | Ahora responde `409 shift_not_open` si no hay turno abierto |

Explica cómo lo implementarías **en el frontend**, sin escribir código. Por ejemplo:

- Qué preguntas le harías a producto y a diseño antes de empezar.
- Las pantallas y los flujos: qué ve el cajero y qué ve la dueña, y cómo se navega entre ellos.
- El árbol de componentes: qué reutilizas de lo que ya existe y qué es nuevo.
- Dónde vive cada estado: server state con React Query (query keys, cuándo invalidar o actualizar el cache) y client state (formulario del conteo, pasos del flujo).
- Cómo bloqueas la venta sin turno abierto, y qué pasa si el turno se cierra en otra pestaña o en otra caja.
- El formulario del conteo por denominación: validación, cálculo en vivo y accesibilidad (se usa rápido, con teclado numérico).
- Loading, error, vacío y estados intermedios (por ejemplo, "pendiente de revisión").
- Permisos en la UI y qué hace el front con un `403` o un `409`.
- Casos borde del lado del cliente: se corta internet a mitad del conteo, se recarga la página, doble click en "Cerrar turno".
- Cómo lo dividirías en entregas y qué tests escribirías.

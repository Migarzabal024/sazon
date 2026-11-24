# Especificación Funcional y Técnica – MVP
## App de Recetario y Costeo para Emprendedores Gastronómicos

---

## 1. Resumen del producto

Una aplicación web responsive donde emprendedores gastronómicos pueden:

- Cargar y organizar su **recetario personal** (ingredientes, pasos, fotos, tiempos, rendimiento).
- Calcular automáticamente el **costo de producción** de cada receta (ingredientes + costos indirectos).
- **Cotizar el precio de venta** al público según el margen de ganancia que quieran obtener, considerando impuestos y comisiones de venta.
- Visualizar qué productos les dejan más o menos rentabilidad.

Cada usuario tiene su propia cuenta y ve **exclusivamente** sus propias recetas, ingredientes y cotizaciones.

---

## 2. Usuario objetivo

Emprendedores gastronómicos independientes (reposteros, cocineros, catering, food trucks, productores artesanales de alimentos) que hoy calculan sus costos "a mano" o en planillas sueltas, y necesitan una herramienta simple para saber cuánto cobrar sin perder plata.

---

## 3. Alcance del MVP

**Incluye (v1):**
- Registro / login de usuarios con datos aislados por cuenta.
- Recetario completo: ingredientes, cantidades, pasos, fotos, tiempo de preparación, rendimiento.
- Carga de costos directos (ingredientes) e indirectos (packaging, gas, luz, mano de obra, etc.).
- Cotizador: costo total → margen deseado → precio sugerido, con impuestos y comisiones de venta.
- Panel comparativo de márgenes entre recetas.
- Configuración de moneda por usuario (multi-moneda).

**No incluye (v1) — queda para etapas posteriores:**
- Registro de ventas reales / comparación estimado vs. real.
- Control de stock / inventario.
- Exportar cotizaciones a PDF para compartir con clientes.
- Roles múltiples (equipos, empleados).

---

## 4. Módulos funcionales

### 4.1 Autenticación y cuentas de usuario
- Registro con email + contraseña, login, recuperación de contraseña.
- Cada usuario accede únicamente a sus propias recetas, ingredientes, costos indirectos y cotizaciones (aislamiento total de datos entre cuentas).
- Un único rol en el MVP ("emprendedor"), dejando la puerta abierta a roles futuros (ej. equipo/empleados).

### 4.2 Recetario virtual
Cada receta guarda:
- Nombre y categoría del producto (ej. panadería, pastelería, viandas, bebidas).
- Foto(s) del producto.
- Tiempo de preparación.
- **Rendimiento**: cuántas porciones/unidades produce la receta (clave para calcular el costo por unidad).
- Lista de ingredientes con cantidad y unidad.
- Pasos de preparación (texto, en orden).
- Notas libres.

### 4.3 Ingredientes y costos directos
- Base de ingredientes propia por usuario: nombre, unidad y cantidad de compra, precio pagado.
- El sistema calcula el **costo por unidad base** (ej. costo por gramo, por mililitro, por unidad) automáticamente.
- Al agregar un ingrediente a una receta con una cantidad, el costo de esa línea se calcula solo.
- Un ingrediente se carga **una sola vez** y se reutiliza en todas las recetas que lo necesiten: si actualizás su precio, se recalculan automáticamente todas las recetas que lo usan.

### 4.4 Costos indirectos (gastos de producción)
- Costos no atados a un ingrediente puntual: packaging, gas, electricidad, mano de obra, alquiler prorrateado, etc.
- Se pueden asignar a una receta como **monto fijo por lote** o **prorrateado según el rendimiento** (ej. "packaging cuesta $500 el rollo y rinde para 50 unidades" → $10 por unidad).

### 4.5 Cotizador de precio de venta
Toma el costo de producción total (directo + indirecto) y agrega:
- **Margen de ganancia deseado** (%), definido por el usuario.
- **Impuestos** aplicables (ej. IVA), configurables.
- **Comisiones de venta** según canal (efectivo sin comisión, Mercado Pago, apps de delivery, etc. — configurables y seleccionables por cotización).

Devuelve, para cada producto:
- Costo por unidad.
- Precio de venta sugerido.
- Ganancia neta estimada por unidad y por lote completo.
- Margen % sobre el precio de venta y margen % sobre el costo (son distintos, y el usuario podría confundirlos si no se lo mostramos claro).

El usuario también puede "forzar" un precio manual y ver qué margen real le queda con ese precio.

### 4.6 Panel de márgenes y rentabilidad
- Listado comparativo de todas las recetas ordenado por rentabilidad.
- Indicador visual (ej. semáforo) si el margen de una receta está por debajo del mínimo que el usuario definió como aceptable.

### 4.7 Configuración de usuario
- Moneda (selector, multi-moneda por usuario).
- Impuesto por defecto.
- Comisiones por defecto según canal de venta.
- Margen de ganancia deseado por defecto.

---

## 5. Modelo de datos (entidades principales)

```
Usuario
 ├─ id, nombre, email, password_hash
 ├─ moneda_preferida
 ├─ impuesto_default (%)
 └─ margen_default (%)

CanalDeVenta (por usuario)
 ├─ id, usuario_id, nombre (ej. "Mercado Pago", "Delivery App")
 └─ comision (%)

Ingrediente (por usuario)
 ├─ id, usuario_id, nombre
 ├─ unidad_compra, cantidad_comprada, precio_compra
 └─ costo_por_unidad_base (calculado)

Receta (por usuario)
 ├─ id, usuario_id, nombre, categoria, foto_url
 ├─ tiempo_preparacion
 ├─ rendimiento, rendimiento_unidad
 ├─ pasos (texto ordenado)
 └─ notas

RecetaIngrediente
 ├─ receta_id, ingrediente_id
 ├─ cantidad_usada, unidad
 └─ costo_calculado (derivado)

CostoIndirecto (por usuario)
 ├─ id, usuario_id, nombre, monto
 └─ forma_asignacion (fijo por lote / prorrateado por rendimiento)

RecetaCostoIndirecto
 ├─ receta_id, costo_indirecto_id
 └─ monto_asignado

CotizaciónGuardada (opcional, para historial)
 ├─ receta_id, fecha
 ├─ margen_usado, canal_venta, impuesto_usado
 └─ precio_resultante, ganancia_resultante
```

---

## 6. Lógica de cálculo

**Costo directo** = Σ (cantidad de cada ingrediente × costo por unidad de ese ingrediente)

**Costo indirecto asignado** = Σ costos indirectos correspondientes a esa receta (prorrateados si aplica)

**Costo de producción total** = Costo directo + Costo indirecto asignado

**Costo por unidad** = Costo de producción total ÷ Rendimiento

**Precio de venta sugerido** (para que, después de impuestos y comisión del canal, quede la ganancia deseada):

```
Precio final = (Costo por unidad + Ganancia deseada por unidad) ÷ (1 − % impuesto − % comisión del canal)
```

**Ejemplo numérico:**
- Costo por unidad: $800
- Ganancia deseada: 40% sobre el costo → $320
- Impuesto: 0% (monotributista, por ejemplo)
- Comisión del canal (Mercado Pago): 6%

```
Precio final = (800 + 320) ÷ (1 − 0.06) = 1120 ÷ 0.94 ≈ $1.191
```

- **Margen sobre el costo** = Ganancia ÷ Costo = 320 / 800 = 40%
- **Margen sobre el precio de venta** = Ganancia ÷ Precio final = 320 / 1191 ≈ 26,9%

Mostrar ambos números es importante: muchos emprendedores confunden "gano 40% sobre lo que gasté" con "gano 40% de lo que cobro", y son cifras distintas.

---

## 7. Flujos de usuario clave

1. **Registro/login** → configuración inicial (moneda, impuesto default, canales de venta y sus comisiones, margen default).
2. **Cargar ingredientes base** (se puede hacer antes o sobre la marcha al crear una receta).
3. **Crear receta**: datos generales → agregar ingredientes y cantidades (costo automático) → asignar costos indirectos → pasos y fotos → rendimiento → guardar.
4. **Cotizar**: elegir receta → margen deseado (o usar el default) → canal de venta → ver desglose completo y precio sugerido → ajustar precio manualmente si quiere y ver el margen resultante → (opcional) guardar la cotización en el historial.
5. **Ver panel de rentabilidad** de todas las recetas.

---

## 8. Requisitos no funcionales

- **UX**: pocas pantallas, flujo tipo asistente para cotizar, mobile-first (se va a usar mucho desde el celular en la cocina).
- **Seguridad**: contraseñas nunca en texto plano, sesiones con token, aislamiento estricto de datos entre usuarios (nadie ve recetas ajenas).
- **Rendimiento**: los cálculos de costo/margen son instantáneos, sin esperas.
- **Accesibilidad**: tipografía legible, buen contraste, fácil carga de fotos desde el celular.

---

## 9. Consideraciones técnicas para el desarrollo

Esto es importante para planificar bien los próximos pasos:

**Camino A — Prototipo funcional acá mismo (recomendado para arrancar):**
Puedo construir una versión interactiva completa (recetario + cotizador + panel de márgenes) para que pruebes la lógica de cálculo y la experiencia de usuario en el momento. Esta versión sirve para validar todo el producto, pero **no tiene login seguro real ni base de datos compartida entre dispositivos** — es ideal para testear antes de invertir en la versión productiva.

**Camino B — Versión productiva con multiusuario real:**
Para tener login seguro de verdad y que cada usuario acceda a sus datos desde cualquier dispositivo, se necesita un backend con base de datos (por ejemplo Supabase o Firebase, ambos con plan gratuito). El plan sería:
1. Validar el producto con el prototipo (Camino A).
2. Crear una cuenta gratuita en Supabase/Firebase.
3. Desarrollar la app final (con Claude Code, por ejemplo) conectada a esa base, con autenticación real y aislamiento de datos por usuario (row-level security).

Mi sugerencia es empezar por el Camino A para no invertir tiempo de desarrollo "productivo" en algo que todavía puede cambiar de forma, y una vez validado pasar al Camino B.

---

## 10. Roadmap sugerido (post-MVP)

- Registro de ventas reales y comparación entre ganancia estimada vs. real.
- Exportar cotización como imagen/PDF para compartir con clientes o proveedores.
- Control de stock de ingredientes.
- Escalado de recetas (recalcular todo si querés producir el doble o la mitad).
- Alertas cuando sube el precio de un insumo y afecta el margen de varias recetas.
- Roles de equipo (empleados con permisos limitados).

---

## 11. Próximos pasos

1. Revisás este documento y marcás qué agregar, sacar o ajustar.
2. Arrancamos con el **prototipo funcional** (Camino A) acá mismo, para que puedas tocarlo y probar si la lógica de costeo y la experiencia de uso son las que buscás.
3. Con el prototipo validado, definimos juntos el pasaje al desarrollo productivo (Camino B).

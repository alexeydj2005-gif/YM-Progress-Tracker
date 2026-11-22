# Gym Progress Tracker — Frontend

Interfaz HTML, CSS y JavaScript. Esta versión amplía el módulo **02. Biblioteca de ejercicios** y conserva los demás apartados de la aplicación.

## Ejecutar localmente
Desde esta carpeta:
```bash
python3 -m http.server 8080
```
Abre http://localhost:8080

## Módulo 02 — Biblioteca de ejercicios
- Catálogo de ejercicios predefinidos y personalizados.
- 13 movimientos de ejemplo con descripción e instrucciones generales.
- Búsqueda y filtros por músculo, tipo y equipamiento.
- Ficha individual de cada ejercicio.
- Crear, editar y eliminar ejercicios personalizados.
- Diseño responsive.

## Base de datos y API
El módulo toma como referencia el documento de diseño del proyecto: MySQL 8.0, tabla `exercise`, y endpoint `GET /exercises` / `POST /exercises`. El documento también indica que PUT y DELETE están pendientes de implementación.

Esta entrega todavía funciona en modo demostración con `localStorage`; no modifica tu base de datos. Consulta `docs/biblioteca-ejercicios.md` y `database/seed_exercises.sql` antes de integrar los endpoints reales. El script SQL no crea ni altera la tabla existente.

## Desplegar en Cloudflare Pages
1. Sube el contenido de esta carpeta a un repositorio Git.
2. En Cloudflare: Workers & Pages → Create → Pages → Connect to Git.
3. Framework preset: None.
4. Build command: vacío.
5. Build output directory: `/` (raíz del repositorio).

La conexión de la interfaz con el backend se realizará en la siguiente fase, una vez confirmados los nombres reales de columnas y la URL de la API.

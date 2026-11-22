# Módulo 02 — Biblioteca de ejercicios

## Alcance de la interfaz
- Catálogo predefinido y ejercicios personalizados.
- Búsqueda por nombre, grupo muscular, tipo y equipamiento.
- Filtros por grupo muscular, tipo y equipamiento.
- Ficha individual con descripción e instrucciones generales.
- Alta, edición y eliminación de ejercicios personalizados.
- Diseño responsive para escritorio y móvil.

## Correspondencia con la base de datos
El módulo se basa en el documento `Database Design Specification` del proyecto Gym Progress Tracker. La entidad `exercise` contempla los datos de nombre, grupo muscular, tipo de ejercicio, equipamiento y descripción.

| Interfaz | Campo esperado en API/BD |
|---|---|
| Nombre | `exercise_name` |
| Grupo muscular | `muscle_group` |
| Tipo | `exercise_type` |
| Equipamiento | `equipment` |
| Descripción | `description` |

El endpoint documentado para consultar y crear ejercicios es `GET /exercises` y `POST /exercises`. El documento indica que PUT y DELETE todavía deben implementarse y verificarse. Por eso esta entrega mantiene el modo demostración en `localStorage`; no realiza llamadas ficticias a la base de datos.

## JSON de creación esperado
```json
{
  "exercise_name": "Press de banca",
  "muscle_group": "Pecho",
  "exercise_type": "Compuesto",
  "equipment": "Barra",
  "description": "Ejercicio principal para desarrollar fuerza y masa muscular del pectoral."
}
```

## Archivos involucrados
- `index.html`: estructura del apartado Biblioteca.
- `styles.css`: estilos de tarjetas, filtros, pestañas y ficha.
- `app.js`: catálogo inicial, renderizado, filtros, ficha y CRUD de demostración.
- `database/seed_exercises.sql`: inserción de 13 ejercicios de catálogo evitando duplicados por nombre.

## Ejecutar
Desde la carpeta raíz del frontend:
```bash
python3 -m http.server 8080
```
Abrir `http://localhost:8080`.

## Nota sobre el seed SQL
El script usa los nombres de columnas documentados en el ejemplo de API y los requisitos del informe. Antes de ejecutarlo, confirma que la tabla `exercise` de tu MySQL tenga exactamente esas columnas. No crea ni modifica la tabla existente.

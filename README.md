# Gym Progress Tracker — esquema Cloudflare D1

Este paquete contiene el esquema SQL inicial adaptado a SQLite para Cloudflare D1,
basado en el documento Database Design Specification del proyecto.

## Tablas incluidas

1. `app_user`
2. `exercise`
3. `workout_routine`
4. `routine_exercise`
5. `workout_session`
6. `workout_set`
7. `progress_record`

Se conservan los nombres originales de las tablas y columnas. Los identificadores
`INT AUTO_INCREMENT` de MySQL se adaptan a `INTEGER PRIMARY KEY AUTOINCREMENT`
de SQLite. Se incluyen claves foráneas, unicidad e índices.

## Ejecutar en Cloudflare D1

Copia `database/schema.sql` a la carpeta `database/` de tu proyecto local
`~/Documentos/GymProgressTracker` y ejecuta:

```bash
cd ~/Documentos/GymProgressTracker
npx wrangler d1 execute gym-progress-tracker-db --remote --file=database/schema.sql
```

Después verifica:

```bash
npx wrangler d1 info gym-progress-tracker-db
npx wrangler d1 execute gym-progress-tracker-db --remote --command   "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

La primera orden modifica la base de datos de PRODUCCIÓN (`--remote`). Ejecútala
una sola vez después de revisar el SQL.

## Decisiones y discrepancias del documento

- `workout_session.routine_id` permite `NULL`, para que también puedan registrarse
  sesiones sin una rutina asociada. Si el requisito exige siempre una rutina,
  cámbialo a `INTEGER NOT NULL` antes de ejecutar el esquema.
- El ERD menciona una relación `exercise`–`progress_record`, pero el diccionario
  de datos y el esquema relacional no incluyen `exercise_id` en `progress_record`.
  Para respetar el diccionario, no se añadió esa columna.
- El requisito FR-02 menciona el tipo de ejercicio, pero la tabla `exercise` del
  diccionario no define `exercise_type`; no se añadió sin aprobación.
- `password_hash` almacena únicamente hashes de contraseñas, nunca contraseñas
  en texto plano.
- Las imágenes de ejercicios no se añadieron como tabla porque no forman parte
  de las siete tablas del modelo original.


## Autenticación de usuarios (Cloudflare D1)

Se añadió registro, inicio/cierre de sesión y validación de sesión mediante tokens aleatorios. Las contraseñas se almacenan con PBKDF2-SHA-256 (100 000 iteraciones en la implementación actual; pendiente fortalecer con migración compatible); D1 almacena únicamente el hash del token de sesión. Las sesiones caducan a los 7 días.

### Despliegue (desde la raíz del proyecto)

1. Crear la tabla de sesiones en la base remota (una sola vez):

```bash
npx wrangler d1 execute gym-progress-tracker-db --remote --file=database/auth-session.sql
```

2. Desplegar el Worker:

```bash
npx wrangler deploy
```

3. Desplegar el frontend en el proyecto Pages correcto:

```bash
npx wrangler pages deploy frontend --project-name gym-progress-tracker
```

4. Abrir `https://gym-progress-tracker-2si.pages.dev` y probar primero el registro con una cuenta nueva.

### Alcance actual y notas

- El perfil y los datos de entrenamiento locales se guardan bajo una clave de `localStorage` distinta por usuario en ese navegador.
- La API de ejercicios exige sesión, permite un catálogo global (`user_id IS NULL`) y ejercicios propios por usuario.
- Rutinas, sesiones y mediciones se consultan y guardan en Cloudflare D1 mediante endpoints autenticados; `localStorage` mantiene una copia local para la interfaz.
- El registro de series individuales en `workout_set` aún no está implementado en la interfaz/API actual.
- La clave antigua `gpt-demo` no se migra automáticamente a ninguna cuenta para evitar mezclar datos entre usuarios.
- El formulario antiguo de AWS no se usa. La aplicación debe abrirse desde el dominio Pages de Cloudflare listado arriba.

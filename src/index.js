
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};


const enc = new TextEncoder();
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const unb64 = value => Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
async function passwordHash(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2", salt, iterations:100000, hash:"SHA-256"}, key, 256);
  return `pbkdf2$100000$${b64(salt)}$${b64(bits)}`;
}
async function verifyPassword(password, stored) {
  const [kind, rounds, saltText, hashText] = String(stored).split("$");
  if (kind !== "pbkdf2" || Number(rounds) !== 100000 || !saltText || !hashText) return false;
  const computed = await passwordHash(password, unb64(saltText));
  const a = enc.encode(computed.split("$")[3]), b = enc.encode(hashText);
  return a.length === b.length && a.reduce((n,v,i)=>n | (v ^ b[i]),0) === 0;
}
async function digest(value) {
  return b64(await crypto.subtle.digest("SHA-256", enc.encode(value)));
}
async function currentUser(request, env) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i,"");
  if (!token) return null;
  const row = await env.DB.prepare(`SELECT u.user_id,u.full_name,u.email FROM auth_session s JOIN app_user u ON u.user_id=s.user_id WHERE s.token_hash=? AND s.expires_at > datetime('now')`).bind(await digest(token)).first();
  return row || null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Comprobar que la API funciona
    if (path === "/" && request.method === "GET") {
      return json({
        message: "Gym Progress Tracker API funcionando",
      });
    }


    if (path === "/api/register" && request.method === "POST") {
      try {
        const body = await request.json();
        const fullName = String(body.full_name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        if (fullName.length < 2 || fullName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150 || password.length < 8 || password.length > 128) {
          return json({error:"Ingresa un nombre válido, correo válido y contraseña de al menos 8 caracteres."},400);
        }
        const exists = await env.DB.prepare("SELECT user_id FROM app_user WHERE email = ?").bind(email).first();
        if (exists) return json({error:"Ya existe una cuenta con ese correo."},409);
        const hash = await passwordHash(password);
        const result = await env.DB.prepare("INSERT INTO app_user (full_name,email,password_hash) VALUES (?,?,?)").bind(fullName,email,hash).run();
        const userId = result.meta.last_row_id;
        const token = b64(crypto.getRandomValues(new Uint8Array(32)));
        await env.DB.prepare("INSERT INTO auth_session (user_id,token_hash,expires_at) VALUES (?,?,datetime('now','+7 days'))").bind(userId,await digest(token)).run();
        return json({token,user:{id:userId,full_name:fullName,email}},201);
      } catch (e) { console.error("REGISTER_ERROR:", e); return json({error:"No se pudo completar el registro."},500); }
    }

    if (path === "/api/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const user = await env.DB.prepare("SELECT user_id,full_name,email,password_hash FROM app_user WHERE email=?").bind(email).first();
        if (!user || !(await verifyPassword(password,user.password_hash))) return json({error:"Correo o contraseña incorrectos."},401);
        const token = b64(crypto.getRandomValues(new Uint8Array(32)));
        await env.DB.prepare("INSERT INTO auth_session (user_id,token_hash,expires_at) VALUES (?,?,datetime('now','+7 days'))").bind(user.user_id,await digest(token)).run();
        return json({token,user:{id:user.user_id,full_name:user.full_name,email:user.email}});
      } catch (e) { return json({error:"No se pudo iniciar sesión."},500); }
    }

    if (path === "/api/me" && request.method === "GET") {
      const user = await currentUser(request,env);
      return user ? json({user:{id:user.user_id,full_name:user.full_name,email:user.email}}) : json({error:"Sesión inválida o caducada."},401);
    }

    if (path === "/api/logout" && request.method === "POST") {
      const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i,"");
      if (token) await env.DB.prepare("DELETE FROM auth_session WHERE token_hash=?").bind(await digest(token)).run();
      return json({message:"Sesión cerrada."});
    }

    // ============================================
    // EJERCICIOS: CATÁLOGO GLOBAL Y PERSONALES
    // ============================================

    // Listar ejercicios globales y los del usuario autenticado
    if (path === "/api/exercises" && request.method === "GET") {
      try {
        const user = await currentUser(request, env);
        if (!user) return json({ error: "No autorizado." }, 401);

        const { results } = await env.DB.prepare(`
          SELECT * FROM exercise
          WHERE user_id IS NULL OR user_id = ?
          ORDER BY exercise_id DESC
        `).bind(user.user_id).all();

        return json(results);
      } catch (error) {
        console.error("GET_EXERCISES_ERROR:", error);
        return json({ error: "No se pudieron cargar los ejercicios." }, 500);
      }
    }

    // Crear un ejercicio personal
    if (path === "/api/exercises" && request.method === "POST") {
      try {
        const user = await currentUser(request, env);
        if (!user) return json({ error: "No autorizado." }, 401);

        const body = await request.json();

        const {
          exercise_name,
          description = null,
          muscle_group,
          exercise_type = "Compuesto",
          equipment = null,
        } = body;

        if (
          typeof exercise_name !== "string" ||
          !exercise_name.trim() ||
          typeof muscle_group !== "string" ||
          !muscle_group.trim()
        ) {
          return json({
            error: "exercise_name y muscle_group son obligatorios",
          }, 400);
        }

        const result = await env.DB.prepare(`
          INSERT INTO exercise (
            exercise_name,
            description,
            muscle_group,
            exercise_type,
            equipment,
            user_id
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          exercise_name.trim(),
          description,
          muscle_group.trim(),
          exercise_type,
          equipment,
          user.user_id
        ).run();

        return json({
          message: "Ejercicio registrado correctamente",
          exercise_id: result.meta.last_row_id,
        }, 201);

      } catch (error) {
        console.error("POST_EXERCISE_ERROR:", error);
        return json({ error: "No se pudo registrar el ejercicio." }, 400);
      }
    }

    // Consultar, actualizar o eliminar un ejercicio por ID
    const match = path.match(/^\/api\/exercises\/(\d+)$/);

    if (match) {
      const id = Number(match[1]);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return json({ error: "ID inválido" }, 400);
      }

      const user = await currentUser(request, env);
      if (!user) return json({ error: "No autorizado." }, 401);

      // Consultar un ejercicio global o propio
      if (request.method === "GET") {
        const exercise = await env.DB.prepare(`
          SELECT * FROM exercise
          WHERE exercise_id = ?
            AND (user_id IS NULL OR user_id = ?)
        `).bind(id, user.user_id).first();

        if (!exercise) {
          return json({ error: "Ejercicio no encontrado" }, 404);
        }

        return json(exercise);
      }

      // Actualizar únicamente ejercicios propios
      if (request.method === "PUT") {
        try {
          const body = await request.json();

          const {
            exercise_name,
            description = null,
            muscle_group,
            exercise_type = "Compuesto",
            equipment = null,
          } = body;

          if (
            typeof exercise_name !== "string" ||
            !exercise_name.trim() ||
            typeof muscle_group !== "string" ||
            !muscle_group.trim()
          ) {
            return json({
              error: "exercise_name y muscle_group son obligatorios",
            }, 400);
          }

          const result = await env.DB.prepare(`
            UPDATE exercise
            SET exercise_name = ?,
                description = ?,
                muscle_group = ?,
                exercise_type = ?,
                equipment = ?
            WHERE exercise_id = ?
              AND user_id = ?
          `).bind(
            exercise_name.trim(),
            description,
            muscle_group.trim(),
            exercise_type,
            equipment,
            id,
            user.user_id
          ).run();

          if (result.meta.changes === 0) {
            return json({ error: "Ejercicio personal no encontrado." }, 404);
          }

          return json({ message: "Ejercicio actualizado correctamente" });

        } catch (error) {
          console.error("PUT_EXERCISE_ERROR:", error);
          return json({ error: "No se pudo actualizar el ejercicio." }, 400);
        }
      }

      // Eliminar únicamente ejercicios propios
      if (request.method === "DELETE") {
        try {
          const result = await env.DB.prepare(`
            DELETE FROM exercise
            WHERE exercise_id = ?
              AND user_id = ?
          `).bind(id, user.user_id).run();

          if (result.meta.changes === 0) {
            return json({ error: "Ejercicio personal no encontrado." }, 404);
          }

          return json({ message: "Ejercicio eliminado correctamente" });

        } catch (error) {
          console.error("DELETE_EXERCISE_ERROR:", error);
          return json({
            error: "No se pudo eliminar. Comprueba si el ejercicio está asociado a rutinas o sesiones.",
          }, 409);
        }
      }
    }


    // ============================================
    // RUTINAS PERSONALES
    // ============================================

    // Listar rutinas del usuario autenticado
    if (path === "/api/routines" && request.method === "GET") {
      try {
        const user = await currentUser(request, env);
        if (!user) return json({ error: "No autorizado." }, 401);

        const { results: routines } = await env.DB.prepare(
          "SELECT * FROM workout_routine WHERE user_id = ? ORDER BY routine_id DESC"
        ).bind(user.user_id).all();

        const data = await Promise.all(routines.map(async routine => {
          const { results: exercises } = await env.DB.prepare(`
            SELECT
              re.exercise_id,
              re.sets_planned,
              re.reps_planned,
              re.exercise_order,
              e.exercise_name
            FROM routine_exercise re
            JOIN exercise e ON e.exercise_id = re.exercise_id
            WHERE re.routine_id = ?
            ORDER BY re.exercise_order
          `).bind(routine.routine_id).all();

          let metadata = {};
          try {
            metadata = JSON.parse(routine.description || "{}");
          } catch {
            metadata = { focus: routine.description || "" };
          }

          return {
            id: routine.routine_id,
            name: routine.routine_name,
            focus: metadata.focus || "",
            days: metadata.days || "",
            minutes: Number(metadata.minutes || 60),
            exerciseIds: exercises.map(item => Number(item.exercise_id)),
            items: exercises.map(item => item.exercise_name),
            exercises: exercises.map(item => ({
              exercise_id: Number(item.exercise_id),
              name: item.exercise_name,
              sets_planned: Number(item.sets_planned),
              reps_planned: Number(item.reps_planned),
              exercise_order: Number(item.exercise_order)
            }))
          };
        }));

        return json(data);
      } catch (error) {
        console.error("GET_ROUTINES_ERROR:", error);
        return json({ error: "No se pudieron cargar las rutinas." }, 500);
      }
    }

    // Crear rutina y asociar sus ejercicios
    if (path === "/api/routines" && request.method === "POST") {
      let routineId = null;

      try {
        const user = await currentUser(request, env);
        if (!user) return json({ error: "No autorizado." }, 401);

        const body = await request.json();
        const name = String(body.name || "").trim();
        const focus = String(body.focus || "").trim();
        const days = String(body.days || "").trim();
        const minutes = Number(body.minutes);
        const exercises = body.exercises;

        if (!name || name.length > 100) {
          return json({ error: "El nombre de la rutina es obligatorio y no debe superar 100 caracteres." }, 400);
        }

        if (!Array.isArray(exercises) || exercises.length === 0) {
          return json({ error: "Selecciona al menos un ejercicio." }, 400);
        }

        if (!Number.isInteger(minutes) || minutes < 1) {
          return json({ error: "La duración debe ser un número entero mayor que cero." }, 400);
        }

        const normalized = exercises.map((item, index) => ({
          exercise_id: Number(item.exercise_id),
          sets_planned: Number(item.sets_planned),
          reps_planned: Number(item.reps_planned),
          exercise_order: index + 1
        }));

        if (normalized.some(item =>
          !Number.isSafeInteger(item.exercise_id) || item.exercise_id <= 0 ||
          !Number.isInteger(item.sets_planned) || item.sets_planned < 1 || item.sets_planned > 20 ||
          !Number.isInteger(item.reps_planned) || item.reps_planned < 1 || item.reps_planned > 100
        )) {
          return json({ error: "Comprueba los ejercicios, las series y las repeticiones." }, 400);
        }

        const uniqueIds = [...new Set(normalized.map(item => item.exercise_id))];

        if (uniqueIds.length !== normalized.length) {
          return json({ error: "No puedes incluir el mismo ejercicio dos veces en una rutina." }, 400);
        }

        const placeholders = uniqueIds.map(() => "?").join(",");
        const { results: foundExercises } = await env.DB.prepare(
          `SELECT exercise_id FROM exercise
           WHERE exercise_id IN (${placeholders})
             AND (user_id IS NULL OR user_id = ?)`
        ).bind(...uniqueIds, user.user_id).all();

        if (foundExercises.length !== uniqueIds.length) {
          return json({ error: "Uno o más ejercicios no existen en el catálogo." }, 400);
        }

        const description = JSON.stringify({ focus, days, minutes });

        const result = await env.DB.prepare(`
          INSERT INTO workout_routine (user_id, routine_name, description)
          VALUES (?, ?, ?)
        `).bind(user.user_id, name, description).run();

        routineId = Number(result.meta.last_row_id);

        const statements = normalized.map(item =>
          env.DB.prepare(`
            INSERT INTO routine_exercise (
              routine_id,
              exercise_id,
              sets_planned,
              reps_planned,
              exercise_order
            ) VALUES (?, ?, ?, ?, ?)
          `).bind(
            routineId,
            item.exercise_id,
            item.sets_planned,
            item.reps_planned,
            item.exercise_order
          )
        );

        await env.DB.batch(statements);

        return json({
          message: "Rutina guardada correctamente.",
          routine_id: routineId
        }, 201);

      } catch (error) {
        console.error("POST_ROUTINE_ERROR:", error);

        // Evitar dejar una rutina vacía si falla la asociación de ejercicios.
        if (routineId !== null) {
          try {
            await env.DB.prepare(
              "DELETE FROM routine_exercise WHERE routine_id = ?"
            ).bind(routineId).run();

            await env.DB.prepare(
              "DELETE FROM workout_routine WHERE routine_id = ?"
            ).bind(routineId).run();
          } catch (cleanupError) {
            console.error("ROUTINE_CLEANUP_ERROR:", cleanupError);
          }
        }

        return json({ error: "No se pudo guardar la rutina." }, 500);
      }
    }

    // Eliminar una rutina únicamente si pertenece al usuario autenticado
    const routineMatch = path.match(/^\/api\/routines\/(\d+)$/);

    if (routineMatch && request.method === "DELETE") {
      try {
        const user = await currentUser(request, env);
        if (!user) return json({ error: "No autorizado." }, 401);

        const routineId = Number(routineMatch[1]);

        if (!Number.isSafeInteger(routineId) || routineId <= 0) {
          return json({ error: "ID de rutina inválido." }, 400);
        }

        const owned = await env.DB.prepare(`
          SELECT routine_id
          FROM workout_routine
          WHERE routine_id = ? AND user_id = ?
        `).bind(routineId, user.user_id).first();

        if (!owned) {
          return json({ error: "Rutina no encontrada." }, 404);
        }

        const linkedSession = await env.DB.prepare(`
          SELECT session_id
          FROM workout_session
          WHERE routine_id = ? AND user_id = ?
          LIMIT 1
        `).bind(routineId, user.user_id).first();

        if (linkedSession) {
          return json({
            error: "No puedes eliminar esta rutina porque tiene sesiones registradas. Elimina primero esas sesiones."
          }, 409);
        }

        await env.DB.batch([
          env.DB.prepare(`
            DELETE FROM routine_exercise
            WHERE routine_id = ?
          `).bind(routineId),

          env.DB.prepare(`
            DELETE FROM workout_routine
            WHERE routine_id = ? AND user_id = ?
          `).bind(routineId, user.user_id)
        ]);

        return json({ message: "Rutina eliminada correctamente." });

      } catch (error) {
        console.error("DELETE_ROUTINE_ERROR:", error);
        return json({ error: "No se pudo eliminar la rutina." }, 500);
      }
    }


    // ============================================
    // SESIONES PERSONALES
    // ============================================

    if (path === "/api/sessions" && request.method === "GET") {
      try {
        const user = await currentUser(request, env);
        if (!user) return json({ error: "No autorizado." }, 401);

        const { results } = await env.DB.prepare(`
          SELECT
            s.session_id,
            s.routine_id,
            s.session_date,
            s.volume_kg,
            r.routine_name,
            COUNT(re.exercise_id) AS exercise_count,
            GROUP_CONCAT(re.exercise_id) AS exercise_ids
          FROM workout_session s
          LEFT JOIN workout_routine r ON r.routine_id = s.routine_id
          LEFT JOIN routine_exercise re ON re.routine_id = s.routine_id
          WHERE s.user_id = ?
          GROUP BY s.session_id
          ORDER BY s.session_date DESC, s.session_id DESC
        `).bind(user.user_id).all();

        return json(results.map(item => ({
          id: Number(item.session_id),
          routineId: Number(item.routine_id),
          name: item.routine_name || "Entrenamiento",
          routineName: item.routine_name || "Entrenamiento",
          date: String(item.session_date).slice(0, 10),
          volume: Number(item.volume_kg || 0),
          exercises: Number(item.exercise_count || 0),
          exerciseIds: item.exercise_ids
            ? item.exercise_ids.split(",").map(Number)
            : []
        })));
      } catch (error) {
        console.error("GET_SESSIONS_ERROR:", error);
        return json({ error: "No se pudieron cargar las sesiones." }, 500);
      }
    }

    if (path === "/api/sessions" && request.method === "POST") {
      try {
        const user = await currentUser(request, env);
        if (!user) return json({ error: "No autorizado." }, 401);

        const body = await request.json();
        const routineId = Number(body.routine_id);
        const date = String(body.date || "");
        const volume = Number(body.volume);

        if (!Number.isSafeInteger(routineId) || routineId <= 0) {
          return json({ error: "Selecciona una rutina válida." }, 400);
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            !Number.isFinite(Date.parse(date + "T00:00:00Z"))) {
          return json({ error: "La fecha de la sesión no es válida." }, 400);
        }

        if (!Number.isFinite(volume) || volume < 0 || volume > 10000000) {
          return json({ error: "El volumen debe ser un número válido mayor o igual a cero." }, 400);
        }

        const routine = await env.DB.prepare(`
          SELECT routine_id, routine_name
          FROM workout_routine
          WHERE routine_id = ? AND user_id = ?
        `).bind(routineId, user.user_id).first();

        if (!routine) {
          return json({ error: "La rutina no existe o no pertenece a tu cuenta." }, 404);
        }

        const result = await env.DB.prepare(`
          INSERT INTO workout_session (
            user_id, routine_id, session_date, volume_kg
          ) VALUES (?, ?, ?, ?)
        `).bind(user.user_id, routineId, date, volume).run();

        return json({
          message: "Sesión guardada correctamente.",
          session_id: Number(result.meta.last_row_id)
        }, 201);
      } catch (error) {
        console.error("POST_SESSION_ERROR:", error);
        return json({ error: "No se pudo guardar la sesión." }, 500);
      }
    }

    const sessionMatch = path.match(/^\/api\/sessions\/(\d+)$/);

    if (sessionMatch && request.method === "DELETE") {
      try {
        const user = await currentUser(request, env);
        if (!user) return json({ error: "No autorizado." }, 401);

        const sessionId = Number(sessionMatch[1]);

        const owned = await env.DB.prepare(`
          SELECT session_id
          FROM workout_session
          WHERE session_id = ? AND user_id = ?
        `).bind(sessionId, user.user_id).first();

        if (!owned) return json({ error: "Sesión no encontrada." }, 404);

        await env.DB.batch([
          env.DB.prepare(`
            DELETE FROM workout_set
            WHERE session_id = ?
          `).bind(sessionId),
          env.DB.prepare(`
            DELETE FROM workout_session
            WHERE session_id = ? AND user_id = ?
          `).bind(sessionId, user.user_id)
        ]);

        return json({ message: "Sesión eliminada correctamente." });
      } catch (error) {
        console.error("DELETE_SESSION_ERROR:", error);
        return json({ error: "No se pudo eliminar la sesión." }, 500);
      }
    }

    // ============================================
    // PROGRESO PERSONAL
    // ============================================

    if (path === "/api/progress" && request.method === "GET") {
      try {
        const user = await currentUser(request, env);
        if (!user) return json({ error: "No autorizado." }, 401);

        const { results } = await env.DB.prepare(`
          SELECT progress_id, record_date, metric_name,
                 metric_value, unit, notes
          FROM progress_record
          WHERE user_id = ?
          ORDER BY record_date DESC, progress_id DESC
        `).bind(user.user_id).all();

        const grouped = new Map();

        for (const item of results) {
          const date = String(item.record_date).slice(0, 10);

          if (!grouped.has(date)) {
            grouped.set(date, {
              id: Number(item.progress_id),
              date,
              weight: null,
              waist: null,
              chest: null,
              note: item.notes || ""
            });
          }

          const measurement = grouped.get(date);
          const value = Number(item.metric_value);

          if (item.metric_name === "weight") measurement.weight = value;
          if (item.metric_name === "waist") measurement.waist = value;
          if (item.metric_name === "chest") measurement.chest = value;

          if (item.notes) measurement.note = item.notes;
          measurement.id = Math.min(measurement.id, Number(item.progress_id));
        }

        return json([...grouped.values()]);
      } catch (error) {
        console.error("GET_PROGRESS_ERROR:", error);
        return json({ error: "No se pudo cargar el progreso." }, 500);
      }
    }

    if (path === "/api/progress" && request.method === "POST") {
      try {
        const user = await currentUser(request, env);
        if (!user) return json({ error: "No autorizado." }, 401);

        const body = await request.json();
        const date = String(body.date || "");
        const note = String(body.note || "").trim().slice(0, 250);
        const weight = Number(body.weight);
        const waist = body.waist == null || body.waist === "" ? null : Number(body.waist);
        const chest = body.chest == null || body.chest === "" ? null : Number(body.chest);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            !Number.isFinite(Date.parse(date + "T00:00:00Z"))) {
          return json({ error: "La fecha de la medición no es válida." }, 400);
        }

        if (!Number.isFinite(weight) || weight < 1 || weight > 1000) {
          return json({ error: "El peso debe estar entre 1 y 1000 kg." }, 400);
        }

        if (waist !== null && (!Number.isFinite(waist) || waist < 0 || waist > 500)) {
          return json({ error: "La medida de cintura no es válida." }, 400);
        }

        if (chest !== null && (!Number.isFinite(chest) || chest < 0 || chest > 500)) {
          return json({ error: "La medida de pecho no es válida." }, 400);
        }

        const measurements = [
          { name: "weight", value: weight, unit: "kg" },
          ...(waist === null ? [] : [{ name: "waist", value: waist, unit: "cm" }]),
          ...(chest === null ? [] : [{ name: "chest", value: chest, unit: "cm" }])
        ];

        const statements = measurements.map(item =>
          env.DB.prepare(`
            INSERT INTO progress_record (
              user_id, record_date, metric_name, metric_value, unit, notes
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            user.user_id, date, item.name, item.value, item.unit, note
          )
        );

        await env.DB.batch(statements);

        return json({ message: "Medición guardada correctamente." }, 201);
      } catch (error) {
        console.error("POST_PROGRESS_ERROR:", error);
        return json({ error: "No se pudo guardar la medición." }, 500);
      }
    }

    return json({ error: "Ruta no encontrada" }, 404);
  },
};


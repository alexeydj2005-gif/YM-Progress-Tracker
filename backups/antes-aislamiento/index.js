
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

    // Listar todos los ejercicios
    if (path === "/api/exercises" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        `SELECT * FROM exercise ORDER BY exercise_id DESC`
      ).all();

      return json(results);
    }

    // Registrar un ejercicio
    if (path === "/api/exercises" && request.method === "POST") {
      try {
        const body = await request.json();

        const {
          exercise_name,
          description = null,
          muscle_group,
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
            equipment
          )
          VALUES (?, ?, ?, ?)
        `).bind(
          exercise_name.trim(),
          description,
          muscle_group.trim(),
          equipment
        ).run();

        return json({
          message: "Ejercicio registrado correctamente",
          exercise_id: result.meta.last_row_id,
        }, 201);

      } catch (error) {
        return json({ error: "No se pudo registrar el ejercicio" }, 400);
      }
    }

    // Consultar un ejercicio por ID
    const match = path.match(/^\/api\/exercises\/(\d+)$/);

    if (match) {
      const id = Number(match[1]);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return json({ error: "ID inválido" }, 400);
      }

      if (request.method === "GET") {
        const exercise = await env.DB.prepare(
          "SELECT * FROM exercise WHERE exercise_id = ?"
        ).bind(id).first();

        if (!exercise) {
          return json({ error: "Ejercicio no encontrado" }, 404);
        }

        return json(exercise);
      }

      // Actualizar un ejercicio
      if (request.method === "PUT") {
        try {
          const body = await request.json();

          const {
            exercise_name,
            description = null,
            muscle_group,
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
                equipment = ?
            WHERE exercise_id = ?
          `).bind(
            exercise_name.trim(),
            description,
            muscle_group.trim(),
            equipment,
            id
          ).run();

          if (result.meta.changes === 0) {
            return json({ error: "Ejercicio no encontrado" }, 404);
          }

          return json({ message: "Ejercicio actualizado correctamente" });

        } catch (error) {
          return json({ error: "No se pudo actualizar el ejercicio" }, 400);
        }
      }

      // Eliminar un ejercicio
      if (request.method === "DELETE") {
        try {
          const result = await env.DB.prepare(
            "DELETE FROM exercise WHERE exercise_id = ?"
          ).bind(id).run();

          if (result.meta.changes === 0) {
            return json({ error: "Ejercicio no encontrado" }, 404);
          }

          return json({ message: "Ejercicio eliminado correctamente" });

        } catch (error) {
          return json({
            error: "No se pudo eliminar. Comprueba si el ejercicio está asociado a rutinas o sesiones.",
          }, 409);
        }
      }
    }

    return json({ error: "Ruta no encontrada" }, 404);
  },
};



"use strict";

// ============================================
// SELECTORES Y UTILIDADES
// ============================================

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let STORAGE_KEY = "gpt-demo";
const API_BASE_URL = "https://gym-progress-tracker-api.altikodestudio.workers.dev";

const todayISO = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 10);
};

const date = value => {
    if (!value) return "—";

    return new Date(value + "T12:00:00").toLocaleDateString(
        "es-EC",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
};

const num = value =>
    Number(value || 0).toLocaleString("en-US");

const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);

const makeId = () =>
    Date.now() + Math.floor(Math.random() * 1000);

// ============================================
// CATÁLOGO DE EJERCICIOS
// ============================================

const catalog = [
    {
        name: "Press de banca",
        muscle: "Pecho",
        type: "Compuesto",
        equipment: "Barra",
        description: "Ejercicio principal para desarrollar fuerza y masa muscular del pectoral.",
        instructions: [
            "Acuéstate en el banco con los pies firmes en el suelo.",
            "Sujeta la barra ligeramente más allá del ancho de los hombros.",
            "Baja la barra de forma controlada hasta el pecho.",
            "Empuja hacia arriba sin perder la estabilidad de los hombros."
        ],
        icon: "🏋️",
        level: "Intermedio"
    },
    {
        name: "Press inclinado con mancuernas",
        muscle: "Pecho",
        type: "Compuesto",
        equipment: "Mancuernas",
        description: "Variación inclinada que enfatiza la porción clavicular del pectoral.",
        instructions: [
            "Ajusta el banco entre 30 y 45 grados.",
            "Mantén las mancuernas a los lados del pecho.",
            "Empuja hacia arriba y ligeramente hacia dentro.",
            "Desciende lentamente hasta una posición cómoda."
        ],
        icon: "💪",
        level: "Intermedio"
    },
    {
        name: "Aperturas en polea",
        muscle: "Pecho",
        type: "Aislamiento",
        equipment: "Polea",
        description: "Movimiento de aislamiento para trabajar la aducción horizontal del hombro.",
        instructions: [
            "Coloca las poleas a la altura del pecho.",
            "Da un paso al frente y flexiona ligeramente los codos.",
            "Junta las manos frente al torso sin encoger los hombros.",
            "Regresa de forma controlada."
        ],
        icon: "〰️",
        level: "Principiante"
    },
    {
        name: "Jalón al pecho",
        muscle: "Espalda",
        type: "Compuesto",
        equipment: "Polea",
        description: "Tracción vertical orientada al dorsal ancho y la musculatura de la espalda.",
        instructions: [
            "Sujeta la barra con agarre algo más ancho que los hombros.",
            "Inclina el torso ligeramente y lleva los hombros abajo.",
            "Tira de la barra hacia la parte alta del pecho.",
            "Extiende los brazos lentamente sin perder el control."
        ],
        icon: "↘️",
        level: "Principiante"
    },
    {
        name: "Remo con barra",
        muscle: "Espalda",
        type: "Compuesto",
        equipment: "Barra",
        description: "Ejercicio de tracción horizontal para espalda media, dorsales y estabilizadores.",
        instructions: [
            "Coloca los pies al ancho de caderas y flexiona la cadera.",
            "Mantén la espalda neutra y el abdomen firme.",
            "Lleva la barra hacia la zona baja de las costillas.",
            "Baja la barra lentamente sin redondear la espalda."
        ],
        icon: "🏋️",
        level: "Intermedio"
    },
    {
        name: "Peso muerto",
        muscle: "Piernas",
        type: "Compuesto",
        equipment: "Barra",
        description: "Movimiento multiarticular de bisagra de cadera que involucra cadena posterior y piernas.",
        instructions: [
            "Coloca la barra sobre la mitad del pie.",
            "Flexiona cadera y rodillas manteniendo la espalda neutra.",
            "Empuja el suelo y extiende cadera y rodillas a la vez.",
            "Devuelve la barra al suelo con control."
        ],
        icon: "⬆️",
        level: "Avanzado"
    },
    {
        name: "Sentadilla",
        muscle: "Piernas",
        type: "Compuesto",
        equipment: "Barra",
        description: "Patrón básico de flexión de rodilla y cadera para cuádriceps y glúteos.",
        instructions: [
            "Apoya la barra de forma estable sobre la parte alta de la espalda.",
            "Separa los pies aproximadamente al ancho de hombros.",
            "Desciende flexionando cadera y rodillas.",
            "Empuja el suelo para volver a la posición inicial."
        ],
        icon: "🦵",
        level: "Intermedio"
    },
    {
        name: "Prensa de piernas",
        muscle: "Piernas",
        type: "Compuesto",
        equipment: "Máquina",
        description: "Ejercicio guiado para trabajar principalmente cuádriceps y glúteos.",
        instructions: [
            "Apoya toda la espalda en el respaldo.",
            "Coloca los pies en la plataforma al ancho de hombros.",
            "Desbloquea el seguro y baja la plataforma de forma controlada.",
            "Empuja sin bloquear bruscamente las rodillas."
        ],
        icon: "🦿",
        level: "Principiante"
    },
    {
        name: "Press militar",
        muscle: "Hombros",
        type: "Compuesto",
        equipment: "Mancuernas",
        description: "Empuje vertical para desarrollar deltoides y estabilidad del tren superior.",
        instructions: [
            "Coloca las mancuernas a la altura de los hombros.",
            "Activa el abdomen y evita arquear la zona lumbar.",
            "Empuja las mancuernas por encima de la cabeza.",
            "Baja lentamente hasta la posición inicial."
        ],
        icon: "🙌",
        level: "Intermedio"
    },
    {
        name: "Elevaciones laterales",
        muscle: "Hombros",
        type: "Aislamiento",
        equipment: "Mancuernas",
        description: "Aislamiento del deltoides medio para el trabajo de anchura del hombro.",
        instructions: [
            "Sostén las mancuernas a los lados del cuerpo.",
            "Eleva los brazos lateralmente con codos ligeramente flexionados.",
            "Detente aproximadamente a la altura de los hombros.",
            "Desciende lentamente sin balancear el torso."
        ],
        icon: "↗️",
        level: "Principiante"
    },
    {
        name: "Curl de bíceps",
        muscle: "Brazos",
        type: "Aislamiento",
        equipment: "Mancuernas",
        description: "Flexión de codo enfocada en el bíceps braquial.",
        instructions: [
            "Mantén los codos cerca del torso.",
            "Flexiona los codos sin mover los hombros.",
            "Acerca las mancuernas hacia los hombros.",
            "Extiende los brazos lentamente."
        ],
        icon: "💪",
        level: "Principiante"
    },
    {
        name: "Extensión de tríceps en polea",
        muscle: "Brazos",
        type: "Aislamiento",
        equipment: "Polea",
        description: "Movimiento de extensión de codo para trabajar el tríceps.",
        instructions: [
            "Sujeta la cuerda con los codos pegados al cuerpo.",
            "Extiende los codos llevando las manos hacia abajo.",
            "Separa ligeramente los extremos al final del recorrido.",
            "Regresa de forma controlada."
        ],
        icon: "🔱",
        level: "Principiante"
    },
    {
        name: "Plancha abdominal",
        muscle: "Core",
        type: "Isométrico",
        equipment: "Peso corporal",
        description: "Trabajo isométrico de estabilidad anterior del tronco.",
        instructions: [
            "Apoya antebrazos y puntas de los pies.",
            "Alinea cabeza, cadera y talones.",
            "Contrae abdomen y glúteos.",
            "Mantén la posición sin dejar caer la cadera."
        ],
        icon: "🧘",
        level: "Principiante"
    }
];

catalog.push(
    ...[
        ["Press declinado", "Pecho", "Compuesto", "Barra"],
        ["Cruce de poleas", "Pecho", "Aislamiento", "Polea"],
        ["Flexiones", "Pecho", "Compuesto", "Peso corporal"],
        ["Dominadas", "Espalda", "Compuesto", "Peso corporal"],
        ["Remo sentado en polea", "Espalda", "Compuesto", "Polea"],
        ["Remo con mancuerna", "Espalda", "Compuesto", "Mancuernas"],
        ["Pullover", "Espalda", "Aislamiento", "Mancuernas"],
        ["Face pull", "Hombros", "Aislamiento", "Polea"],
        ["Pájaros con mancuernas", "Hombros", "Aislamiento", "Mancuernas"],
        ["Elevaciones frontales", "Hombros", "Aislamiento", "Mancuernas"],
        ["Encogimientos", "Hombros", "Aislamiento", "Mancuernas"],
        ["Curl martillo", "Brazos", "Aislamiento", "Mancuernas"],
        ["Curl con barra", "Brazos", "Aislamiento", "Barra"],
        ["Curl concentrado", "Brazos", "Aislamiento", "Mancuernas"],
        ["Extensión de tríceps sobre la cabeza", "Brazos", "Aislamiento", "Mancuernas"],
        ["Fondos en paralelas", "Brazos", "Compuesto", "Peso corporal"],
        ["Extensión de cuádriceps", "Piernas", "Aislamiento", "Máquina"],
        ["Curl femoral", "Piernas", "Aislamiento", "Máquina"],
        ["Elevación de talones", "Piernas", "Aislamiento", "Máquina"],
        ["Zancadas", "Piernas", "Compuesto", "Mancuernas"],
        ["Hip thrust", "Piernas", "Compuesto", "Barra"],
        ["Abdominales crunch", "Core", "Aislamiento", "Peso corporal"],
        ["Elevación de piernas", "Core", "Aislamiento", "Peso corporal"],
        ["Russian twist", "Core", "Aislamiento", "Peso corporal"],
        ["Plancha lateral", "Core", "Isométrico", "Peso corporal"]
    ].map(([name, muscle, type, equipment], index) => ({
        id: catalog.length + index + 1,
        name,
        muscle,
        type,
        equipment,
        description: "Ejercicio de entrenamiento de fuerza.",
        instructions: [
            "Adopta una posición estable.",
            "Realiza el movimiento de forma controlada.",
            "Mantén una técnica adecuada durante toda la repetición."
        ],
        icon: "🏋️",
        level: "Principiante"
    }))
);

// Músculos secundarios: participación parcial en el análisis.
// Todos los grupos secundarios usan las mismas seis categorías del catálogo.
const secondaryMuscleMap = {
    "Pecho": ["Brazos", "Hombros"],
    "Espalda": ["Brazos"],
    "Piernas": ["Core"],
    "Hombros": ["Brazos"],
    "Brazos": [],
    "Core": []
};

const secondaryMusclesFor = exercise => {
    return secondaryMuscleMap[exercise.muscle] || [];
};


// ============================================
// DATOS INICIALES
// ============================================

const initial = {
    profile: {
        name: "",
        email: "",
        height: null,
        weight: null,
        goalType: "",
        targetWeight: null,
        weeklyTarget: 5,
        targetDate: ""
    },

    exercises: catalog.map((exercise, index) => ({
        id: index + 1,
        ...exercise,
        builtin: true
    })),

    routines: [],
    sessions: [],
    progress: []
};

// ============================================
// CARGA Y PERSISTENCIA
// ============================================

let d;

try {
    const stored = localStorage.getItem(STORAGE_KEY);
    d = stored ? JSON.parse(stored) : structuredClone(initial);
} catch (error) {
    console.error("Error al cargar los datos:", error);
    d = structuredClone(initial);
}

d.profile = {
    ...initial.profile,
    ...(d.profile || {})
};

d.exercises = (Array.isArray(d.exercises) ? d.exercises : [])
    .map(exercise => {
        const preset = catalog.find(
            item => item.name.toLowerCase() ===
                String(exercise.name || "").toLowerCase()
        );

        return {
            ...(preset || {}),
            ...exercise,
            type: exercise.type || preset?.type || "Compuesto",
            description: exercise.description ||
                preset?.description ||
                "Ejercicio registrado en tu biblioteca.",
            instructions: exercise.instructions ||
                preset?.instructions ||
                [
                    "Adopta una posición estable.",
                    "Realiza el movimiento de forma controlada.",
                    "Mantén una técnica adecuada durante toda la repetición."
                ],
            icon: exercise.icon || preset?.icon || "🏋️",
            level: exercise.level || preset?.level || "Intermedio",
            builtin: exercise.builtin ?? !!preset,
            secondaryMuscles: Array.isArray(exercise.secondaryMuscles)
                ? exercise.secondaryMuscles
                : secondaryMusclesFor({ ...preset, ...exercise })
        };
    });

const existingExerciseNames = new Set(
    d.exercises.map(exercise => exercise.name.toLowerCase())
);

for (const preset of catalog) {
    if (!existingExerciseNames.has(preset.name.toLowerCase())) {
        d.exercises.push({
            ...preset,
            secondaryMuscles: secondaryMusclesFor(preset),
            builtin: true
        });
    }
}

d.routines = Array.isArray(d.routines) ? d.routines : [];
d.sessions = Array.isArray(d.sessions) ? d.sessions : [];
d.progress = Array.isArray(d.progress) ? d.progress : [];

// Retirar exclusivamente los registros de demostración originales.
const demoSessionVolumes = [2450, 2180, 2820];
if (
    d.sessions.length === 3 &&
    d.sessions.every(x => demoSessionVolumes.includes(Number(x.volume))) &&
    d.sessions.some(x => x.name === "Push Day")
) {
    d.sessions = [];
    d.routines = [];
}

const demoDates = ["2026-11-19", "2026-11-05", "2026-10-20", "2026-10-05"];
if (
    d.progress.length === 4 &&
    d.progress.every(x => demoDates.includes(x.date)) &&
    d.progress.some(x => x.note === "Medición inicial")
) {
    d.progress = [];
    if (Number(d.profile.weight) === 74.5) d.profile.weight = null;
}


const save = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch (error) {
        console.error("No se pudieron guardar los datos:", error);
        toast("Error al guardar los datos.");
    }
};

// ============================================
// CONEXIÓN CON CLOUDFLARE WORKERS / D1
// ============================================

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || `Error HTTP ${response.status}`);
    }

    return data;
}

async function loadExercisesFromAPI() {
    let remoteExercises = await apiRequest("/api/exercises");

    // Migrar ejercicios personalizados que existían en localStorage.
    const localCustom = d.exercises.filter(exercise => !exercise.builtin);
    const remoteNames = new Set(
        remoteExercises.map(item => item.exercise_name.toLowerCase())
    );

    for (const exercise of localCustom) {
        const name = exercise.name.trim().toLowerCase();

        if (!remoteNames.has(name)) {
            await apiRequest("/api/exercises", {
                method: "POST",
                body: JSON.stringify({
                    exercise_name: exercise.name,
                    description: exercise.description,
                    muscle_group: exercise.muscle,
                    equipment: exercise.equipment
                })
            });

            remoteNames.add(name);
        }
    }

    // Obtener los registros, incluidos los recién migrados.
    remoteExercises = await apiRequest("/api/exercises");

    const customExercises = remoteExercises.map(item => {
        const preset = catalog.find(
            exercise =>
                exercise.name.toLowerCase() ===
                item.exercise_name.toLowerCase()
        );

        return {
            ...(preset || {}),
            id: -Number(item.exercise_id),
            name: item.exercise_name,
            muscle: item.muscle_group,
            type: preset?.type || "Compuesto",
            equipment: item.equipment || preset?.equipment || "Otro",
            description: item.description ||
                preset?.description ||
                "Ejercicio registrado en tu biblioteca.",
            instructions: preset?.instructions || [
                "Adopta una posición estable.",
                "Realiza el movimiento de forma controlada.",
                "Mantén una técnica adecuada."
            ],
            icon: preset?.icon || "🏋️",
            level: preset?.level || "Personalizado",
            builtin: false
        };
    });

    // El catálogo permanece local; los personalizados vienen de D1.
    d.exercises = [
        ...d.exercises.filter(exercise => exercise.builtin),
        ...customExercises
    ];

    save();
}

// ============================================
// NOTIFICACIONES
// ============================================

function toast(message) {
    const element = $("#toast");
    if (!element) return;

    element.textContent = message;
    element.classList.add("show");

    setTimeout(() => {
        element.classList.remove("show");
    }, 2200);
}

// ============================================
// NAVEGACIÓN
// ============================================

function go(id) {
    $$(".page").forEach(page => {
        page.classList.toggle("active", page.id === id);
    });

    $$("[data-page]").forEach(button => {
        button.classList.toggle("active", button.dataset.page === id);
    });

    const crumb = $("#crumb");
    if (crumb) crumb.textContent = id.toUpperCase();

    $(".sidebar")?.classList.remove("open");

    render();
}

$$("[data-page]").forEach(button => {
    button.onclick = () => go(button.dataset.page);
});

if ($("#menu")) {
    $("#menu").onclick = () => $(".sidebar")?.classList.toggle("open");
}

if ($("#today")) {
    $("#today").textContent = new Date().toLocaleDateString(
        "es-EC",
        {
            weekday: "short",
            day: "2-digit",
            month: "short"
        }
    ).toUpperCase();
}

// ============================================
// RENDER PRINCIPAL
// ============================================

function render() {

    // DASHBOARD

    const totalVolume = d.sessions.reduce(
        (total, session) =>
            total + Number(session.volume || 0),
        0
    );

    $("#sideName").textContent = d.profile.name;
    $("#statExercises").textContent = d.exercises.length;

    $("#statWeight").innerHTML =
        d.profile.weight == null ? "—" : `${esc(d.profile.weight)} <i>kg</i>`;

    $("#statSessions").textContent = d.sessions.length;

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    const weeklySessions = d.sessions.filter(session => {
        const sessionDate = new Date(session.date + "T12:00:00");
        return sessionDate >= weekStart && sessionDate <= new Date();
    }).length;

    const weeklyTarget = Math.min(
        7,
        Math.max(1, Number(d.profile.weeklyTarget) || 5)
    );
    const weeklyPercent = Math.min(
        100,
        Math.round(weeklySessions / weeklyTarget * 100)
    );

    if ($("#weeklyCount")) $("#weeklyCount").innerHTML = `${weeklySessions} <em>/ ${weeklyTarget}</em>`;
    if ($("#weeklyBar")) $("#weeklyBar").style.width = `${weeklyPercent}%`;
    if ($("#weeklyPercent")) $("#weeklyPercent").textContent = `${weeklyPercent}% completado`;
    if ($("#weeklyGoal")) $("#weeklyGoal").innerHTML = `${weeklySessions} <small>/ ${weeklyTarget} sesiones</small>`;
    if ($("#weeklyGoalBar")) $("#weeklyGoalBar").style.width = `${weeklyPercent}%`;
    if ($("#weeklyGoalText")) $("#weeklyGoalText").textContent = `${weeklyPercent}% completado`;


    $("#statVolume").innerHTML =
        `${num(totalVolume)} <i>kg</i>`;

    // SESIONES RECIENTES

    const recentSessions = [...d.sessions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3);

    $("#recent").innerHTML = recentSessions.length
        ? recentSessions.map(session => `
            <div class="recent">
                <div>
                    <b>${esc(session.name)}</b>
                    <small>
                        ${date(session.date)} ·
                        ${Number(session.exercises || 0)} ejercicios
                    </small>
                </div>
                <b>${num(session.volume)} kg</b>
            </div>
        `).join("")
        : `<p class="empty">Todavía no tienes sesiones registradas.</p>`;


    // MAPA ANATÓMICO: músculos específicos por ejercicio.
    const anatomyLabels = {
        pectoral: "Pectorales",
        deltoid_front: "Deltoides anterior",
        deltoid_lateral: "Deltoides lateral",
        deltoid_rear: "Deltoides posterior",
        biceps: "Bíceps",
        triceps: "Tríceps",
        forearms: "Antebrazos",
        abs: "Abdominales",
        obliques: "Oblicuos",
        trapezius: "Trapecios",
        latissimus: "Dorsales",
        erector_spinae: "Lumbares",
        quadriceps: "Cuádriceps",
        tibialis: "Tibiales",
        glutes: "Glúteos",
        hamstrings: "Isquiotibiales",
        calves: "Gemelos"
    };

    const anatomyMusclesFor = exercise => {
        const name = String(exercise.name || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const has = pattern => pattern.test(name);

        if (has(/press de banca|press inclinado|press declinado|aperturas|cruce de poleas|flexiones|fondos en paralelas/))
            return [["pectoral", 1], ["triceps", 0.35], ["deltoid_front", 0.3]];

        if (has(/press militar|elevaciones frontales/))
            return [["deltoid_front", 1], ["deltoid_lateral", 0.35], ["triceps", 0.3]];

        if (has(/elevaciones laterales/))
            return [["deltoid_lateral", 1], ["deltoid_front", 0.15]];

        if (has(/face pull|pajaros/))
            return [["deltoid_rear", 1], ["trapezius", 0.45]];

        if (has(/encogimientos/))
            return [["trapezius", 1]];

        if (has(/curl de biceps|curl martillo|curl con barra|curl concentrado/))
            return [["biceps", 1], ["forearms", 0.25]];

        if (has(/extension de triceps/))
            return [["triceps", 1]];

        if (has(/dominadas|jalon al pecho|remo con barra|remo sentado|remo con mancuerna|pullover/))
            return [["latissimus", 1], ["trapezius", 0.45], ["biceps", 0.35], ["forearms", 0.2]];

        if (has(/peso muerto/))
            return [["erector_spinae", 0.8], ["glutes", 1], ["hamstrings", 0.8], ["trapezius", 0.35]];

        if (has(/sentadilla|prensa de piernas|zancadas/))
            return [["quadriceps", 1], ["glutes", 0.65], ["hamstrings", 0.25]];

        if (has(/extension de cuadriceps/))
            return [["quadriceps", 1]];

        if (has(/curl femoral/))
            return [["hamstrings", 1]];

        if (has(/elevacion de talones/))
            return [["calves", 1]];

        if (has(/hip thrust/))
            return [["glutes", 1], ["hamstrings", 0.3]];

        if (has(/crunch|elevacion de piernas|plancha abdominal/))
            return [["abs", 1], ["obliques", 0.2]];

        if (has(/russian twist|plancha lateral/))
            return [["obliques", 1], ["abs", 0.45]];

        // Clasificación de respaldo para ejercicios personalizados.
        const fallback = {
            Pecho: [["pectoral", 1], ["triceps", 0.2]],
            Espalda: [["latissimus", 1], ["trapezius", 0.25]],
            Hombros: [["deltoid_lateral", 1], ["deltoid_front", 0.25]],
            Brazos: [["biceps", 1]],
            Piernas: [["quadriceps", 1], ["glutes", 0.3]],
            Core: [["abs", 1]]
        };

        return fallback[exercise.muscle] || [];
    };

    const muscleTotals = {};

    d.sessions.forEach(session => {
        (session.exerciseIds || []).forEach(id => {
            const exercise = d.exercises.find(item => item.id === Number(id));
            if (!exercise) return;

            anatomyMusclesFor(exercise).forEach(([muscle, weight]) => {
                muscleTotals[muscle] = (muscleTotals[muscle] || 0) + weight;
            });
        });
    });

    const muscleEntries = Object.entries(muscleTotals)
        .sort((a, b) => b[1] - a[1]);

    const muscleTotal = muscleEntries.reduce(
        (sum, item) => sum + item[1], 0
    );

    const muscleMax = Math.max(1, ...muscleEntries.map(item => item[1]));

    const muscleLegend = $("#muscleLegend");

    if (muscleLegend) {
        muscleLegend.innerHTML = muscleEntries.length
            ? muscleEntries.map(([name, value]) => {
                const percent = Math.round(value / muscleTotal * 100);
                return `
                    <div class="muscle-legend-item">
                        <span class="muscle-dot"></span>
                        <span>${esc(anatomyLabels[name] || name)}</span>
                        <b>${percent}%</b>
                    </div>
                `;
            }).join("")
            : "<p>Registra sesiones con ejercicios para visualizar tus músculos.</p>";
    }

    const muscleMap = $("#muscleMap");

    if (muscleMap) {
        muscleMap.querySelectorAll("[data-muscle]").forEach(part => {
            const value = muscleTotals[part.dataset.muscle] || 0;
            const intensity = value ? value / muscleMax : 0;

            part.style.fill = value ? "#b7f34a" : "#34434b";
            part.style.opacity = value
                ? String(0.3 + intensity * 0.7)
                : "0.72";
            part.style.filter = value && intensity >= 0.65
                ? "drop-shadow(0 0 7px #b7f34a)"
                : "none";
        });
    }

    // EJERCICIOS

    renderExercises();

    // RUTINAS

    $("#routineCount").textContent = d.routines.length;

    $("#routineItems").textContent = d.routines.reduce(
        (total, routine) =>
            total + (routine.items || []).length,
        0
    );

    $("#routineGrid").innerHTML = d.routines.length
        ? d.routines.map(routine => `
            <article class="routine">
                <h3>${esc(routine.name)}</h3>
                <p>${esc(routine.focus)}</p>
                <p>
                    ◷ ${Number(routine.minutes || 0)} min ·
                    ${esc(routine.days)}
                </p>

                ${(routine.items || []).map((exercise, index) => `
                    <p>
                        ${index + 1}. ${esc(exercise)}
                        <small>${(routine.exerciseIds || []).length ? "Del catálogo" : "Registro anterior"}</small>
                    </p>
                `).join("")}

                <div class="actions">
                    <button data-del-routine="${routine.id}">
                        Eliminar rutina
                    </button>
                </div>
            </article>
        `).join("")
        : `<p class="empty">Todavía no tienes rutinas creadas.</p>`;

    // SESIONES

    $("#sessionCount").textContent = d.sessions.length;

    $("#sessionVolume").innerHTML =
        `${num(totalVolume)} <i>kg</i>`;

    const lastSession = [...d.sessions]
        .sort((a, b) => b.date.localeCompare(a.date))[0];

    $("#lastSession").textContent = lastSession
        ? date(lastSession.date)
        : "—";

    const sortedSessions = [...d.sessions]
        .sort((a, b) => b.date.localeCompare(a.date));

    $("#sessionRows").innerHTML = sortedSessions.length
        ? sortedSessions.map(session => `
            <tr>
                <td><b>${esc(session.name)}</b></td>
                <td>${date(session.date)}</td>
                <td>${Number(session.exercises || 0)}</td>
                <td>${num(session.volume)} kg</td>
                <td><span class="lime">Completada</span></td>
                <td>
                    <button data-del-session="${session.id}">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="6">No hay sesiones registradas.</td></tr>`;

    // PROGRESO

    const latestMeasurement = [...d.progress]
        .sort((a, b) => b.date.localeCompare(a.date))[0]
        || { weight: d.profile.weight ?? null };

    $("#progressWeight").textContent =
        latestMeasurement.weight == null ? "—" : `${latestMeasurement.weight} kg`;

    $("#metricWeight").textContent =
        latestMeasurement.weight == null ? "—" : `${latestMeasurement.weight} kg`;

    const heightMeters = Number(d.profile.height) / 100;

    $("#metricHeight").textContent =
        heightMeters > 0 ? `${heightMeters.toFixed(2)} m` : "—";

    $("#metricBmi").textContent =
        heightMeters > 0 && latestMeasurement.weight > 0
            ? (Number(latestMeasurement.weight) / (heightMeters ** 2)).toFixed(1)
            : "—";

    $("#metricCount").textContent = d.progress.length;

    const sortedProgress = [...d.progress]
        .sort((a, b) => b.date.localeCompare(a.date));

    $("#progressRows").innerHTML = sortedProgress.length
        ? sortedProgress.map(measurement => `
            <tr>
                <td>${date(measurement.date)}</td>
                <td>${measurement.weight} kg</td>
                <td>${measurement.waist || "—"} cm</td>
                <td>${measurement.chest || "—"} cm</td>
                <td>${esc(measurement.note)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="5">No hay mediciones registradas.</td></tr>`;

    // PERFIL

    $("#name").value = d.profile.name;
    $("#email").value = d.profile.email;
    $("#height").value = d.profile.height;
    $("#weight").value = d.profile.weight ?? "";
    $("#goalType").value = d.profile.goalType || "";
    $("#targetWeight").value = d.profile.targetWeight ?? "";
    $("#weeklyTarget").value = d.profile.weeklyTarget ?? 5;
    $("#targetDate").value = d.profile.targetDate || "";

    const goalLabels = {
        gain_muscle: "Ganar masa muscular",
        lose_fat: "Perder grasa",
        maintain_weight: "Mantener peso"
    };

    $("#goalTypeDisplay").textContent =
        goalLabels[d.profile.goalType] || "Sin definir";

    $("#goalTargetDisplay").textContent =
        d.profile.targetWeight == null
            ? "Peso objetivo sin definir"
            : `${d.profile.targetWeight} kg`;

    $("#goalFrequencyDisplay").textContent =
        `${d.profile.weeklyTarget || 5} entrenamientos por semana`;

    $("#goalDateDisplay").textContent =
        d.profile.targetDate
            ? `Fecha objetivo: ${d.profile.targetDate}`
            : "Sin fecha objetivo";

    $("#profileNameTitle").textContent = d.profile.name || "Mi perfil";
}

// ============================================
// MODALES
// ============================================

function exercisePicker(fieldName, selectedIds = []) {
    return `
        <div class="exercise-picker">
            <span class="picker-title">Selecciona los ejercicios del catálogo</span>

            <input
                type="search"
                id="exerciseSearchPicker"
                placeholder="Buscar ejercicio..."
                autocomplete="off"
            >

            <div class="picker-selection">
                <span id="exercisePickerCount">0 ejercicios seleccionados</span>
            </div>

            <div class="picker-list" id="exercisePickerList">
                ${d.exercises.map(exercise => `
                    <label class="picker-option" data-exercise-search="${esc(
                        `${exercise.name} ${exercise.muscle} ${exercise.equipment}`.toLowerCase()
                    )}">
                        <input
                            type="checkbox"
                            name="${fieldName}"
                            value="${exercise.id}"
                            ${selectedIds.includes(exercise.id) ? "checked" : ""}
                        >
                        <span>
                            <b>${esc(exercise.name)}</b>
                            <small>${esc(exercise.muscle)} · ${esc(exercise.equipment)}</small>
                        </span>
                    </label>
                `).join("")}
            </div>
        </div>
    `;
}

function openModal(type, id) {

    $(".modal").classList.remove("detail-modal");

    const exercise = d.exercises.find(
        item => item.id === id
    );

    const titles = {
        exercise: exercise ? "Editar ejercicio" : "Nuevo ejercicio",
        routine: "Crear rutina",
        session: "Registrar sesión",
        progress: "Añadir medición"
    };

    $("#modalTitle").textContent = titles[type];

    const fields = {

        exercise: `
            <label>
                Nombre del ejercicio
                <input
                    name="name"
                    required
                    maxlength="100"
                    value="${esc(exercise?.name || "")}"
                    placeholder="Ej. Press de banca"
                >
            </label>

            <label>
                Grupo muscular principal
                <select name="muscle">
                    ${[
                        "Pecho",
                        "Espalda",
                        "Piernas",
                        "Hombros",
                        "Brazos",
                        "Core"
                    ].map(value => `
                        <option ${exercise?.muscle === value ? "selected" : ""}>
                            ${value}
                        </option>
                    `).join("")}
                </select>
            </label>

            <label>
                Tipo de ejercicio
                <select name="type">
                    ${[
                        "Compuesto",
                        "Aislamiento",
                        "Isométrico"
                    ].map(value => `
                        <option ${exercise?.type === value ? "selected" : ""}>
                            ${value}
                        </option>
                    `).join("")}
                </select>
            </label>

            <label>
                Equipamiento
                <select name="equipment">
                    ${[
                        "Barra",
                        "Mancuernas",
                        "Máquina",
                        "Polea",
                        "Peso corporal",
                        "Banco",
                        "Otro"
                    ].map(value => `
                        <option ${exercise?.equipment === value ? "selected" : ""}>
                            ${value}
                        </option>
                    `).join("")}
                </select>
            </label>

            <label>
                Descripción
                <textarea
                    name="description"
                    rows="3"
                    required
                    maxlength="500"
                    placeholder="Describe el objetivo y ejecución general"
                >${esc(exercise?.description || "")}</textarea>
            </label>
        `,

        routine: `
            <label>
                Nombre
                <input name="name" required placeholder="Upper Body">
            </label>

            <label>
                Enfoque muscular
                <input name="focus" required placeholder="Pecho · Espalda">
            </label>

            <label>
                Días
                <input name="days" placeholder="Lunes / Jueves">
            </label>

            <label>
                Duración (min)
                <input name="minutes" type="number" min="1" value="60" required>
            </label>

            ${exercisePicker("routineExercises")}
        `,

        session: `
            <label>
                Rutina
                <select name="routineId" required>
                    <option value="" disabled selected>
                        ${d.routines.length ? "Selecciona una rutina" : "Primero crea una rutina"}
                    </option>
                    ${d.routines.map(routine => `
                        <option value="${esc(routine.id)}">${esc(routine.name)}</option>
                    `).join("")}
                </select>
            </label>

            <label>
                Fecha
                <input name="date" type="date" value="${todayISO()}" required>
            </label>

            <label>
                Volumen total (kg)
                <input name="volume" type="number" value="1500" min="0" step="0.1" required>
            </label>
        `,

        progress: `
            <label>
                Fecha
                <input name="date" type="date" value="${todayISO()}" required>
            </label>

            <label>
                Peso (kg)
                <input name="weight" type="number" step="0.1" min="1" value="${d.profile.weight}" required>
            </label>

            <label>
                Cintura (cm)
                <input name="waist" type="number" step="0.1" min="0">
            </label>

            <label>
                Pecho (cm)
                <input name="chest" type="number" step="0.1" min="0">
            </label>

            <label>
                Notas
                <input name="note" maxlength="250" placeholder="Observaciones">
            </label>
        `
    };

    $("#modalContent").innerHTML = `
        <form id="modalForm" class="modal-form">
            ${fields[type]}
            <button class="primary" type="submit">Guardar</button>
        </form>
    `;

    // BÚSQUEDA Y CONTADOR DEL SELECTOR DE EJERCICIOS
    const exerciseSearch = $("#exerciseSearchPicker");
    const exercisePickerList = $("#exercisePickerList");
    const exercisePickerCount = $("#exercisePickerCount");

    if (exerciseSearch && exercisePickerList) {
        const updateExercisePicker = () => {
            const query = exerciseSearch.value.trim().toLowerCase();

            exercisePickerList.querySelectorAll(".picker-option").forEach(option => {
                option.hidden = !option.dataset.exerciseSearch.includes(query);
            });

            const selected = exercisePickerList.querySelectorAll(
                'input[type="checkbox"]:checked'
            ).length;

            exercisePickerCount.textContent =
                `${selected} ${selected === 1 ? "ejercicio seleccionado" : "ejercicios seleccionados"}`;
        };

        exerciseSearch.addEventListener("input", updateExercisePicker);
        exercisePickerList.addEventListener("change", updateExercisePicker);
        updateExercisePicker();
    }

    // VISTA PREVIA DE LOS EJERCICIOS DE LA RUTINA
    const routineSelect = $('#modalForm select[name="routineId"]');
    if (routineSelect) {
        const preview = document.createElement("div");
        preview.id = "sessionRoutinePreview";
        preview.className = "session-routine-preview";
        routineSelect.closest("label").insertAdjacentElement("afterend", preview);

        const updateRoutinePreview = () => {
            const routine = d.routines.find(
                item => String(item.id) === String(routineSelect.value)
            );

            if (!routine) {
                preview.innerHTML = '<p>Selecciona una rutina para ver sus ejercicios.</p>';
                return;
            }

            const ids = routine.exerciseIds?.length
                ? routine.exerciseIds.map(Number)
                : (routine.items || []).map(name =>
                    d.exercises.find(exercise => exercise.name === name)?.id
                ).filter(id => id != null);

            const exercises = ids
                .map(id => d.exercises.find(exercise => exercise.id === id))
                .filter(Boolean);

            preview.innerHTML = `
                <b>${esc(routine.name)}</b>
                <p>${exercises.length} ejercicios en esta rutina</p>
                <ul>
                    ${exercises.map(exercise => `
                        <li>${esc(exercise.name)} <small>· ${esc(exercise.muscle)}</small></li>
                    `).join("")}
                </ul>
            `;
        };

        routineSelect.addEventListener("change", updateRoutinePreview);
        updateRoutinePreview();
    }

    $("#backdrop").classList.add("open");

    $("#modalForm").onsubmit = async event => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const values = Object.fromEntries(formData.entries());

        // EJERCICIO

        if (type === "exercise") {

            const payload = {
                exercise_name: values.name.trim(),
                description: values.description.trim(),
                muscle_group: values.muscle,
                equipment: values.equipment
            };

            try {
                let exerciseId;

                if (exercise) {
                    await apiRequest(
                        `/api/exercises/${Math.abs(exercise.id)}`,
                        {
                            method: "PUT",
                            body: JSON.stringify(payload)
                        }
                    );

                    exerciseId = exercise.id;
                } else {
                    const result = await apiRequest("/api/exercises", {
                        method: "POST",
                        body: JSON.stringify(payload)
                    });

                    exerciseId = -Number(result.exercise_id);
                }

                const object = {
                    id: exerciseId,
                    name: payload.exercise_name,
                    muscle: payload.muscle_group,
                    secondaryMuscles: secondaryMusclesFor({
                        name: payload.exercise_name,
                        muscle: payload.muscle_group
                    }),
                    type: values.type,
                    equipment: payload.equipment,
                    description: payload.description,
                    instructions: exercise?.instructions || [
                        "Adopta una posición estable.",
                        "Realiza el movimiento de forma controlada.",
                        "Mantén una técnica adecuada durante toda la repetición."
                    ],
                    icon: exercise?.icon || "🏋️",
                    level: exercise?.level || "Personalizado",
                    builtin: false
                };

                if (exercise) {
                    d.exercises = d.exercises.map(item =>
                        item.id === exercise.id ? object : item
                    );
                } else {
                    d.exercises.unshift(object);
                }

            } catch (error) {
                console.error("Error guardando ejercicio:", error);
                toast(`No se pudo guardar: ${error.message}`);
                return;
            }
        }

        // RUTINA

        if (type === "routine") {

            d.routines.unshift({
                id: makeId(),
                name: values.name.trim(),
                focus: values.focus.trim(),
                days: values.days.trim(),
                minutes: Number(values.minutes),
                exerciseIds: formData.getAll("routineExercises").map(Number),
                items: formData.getAll("routineExercises")
                    .map(Number)
                    .map(id => d.exercises.find(exercise => exercise.id === id)?.name)
                    .filter(Boolean)
            });

            if (!d.routines[0].exerciseIds.length) {
                d.routines.shift();
                toast("Selecciona al menos un ejercicio para la rutina.");
                return;
            }
        }

        // SESIÓN

        if (type === "session") {

            const selectedRoutine = d.routines.find(
                routine => String(routine.id) === String(values.routineId)
            );

            if (!selectedRoutine) {
                toast("Selecciona una rutina válida.");
                return;
            }

            // Compatibilidad con rutinas antiguas que solo guardaban nombres.
            const routineExerciseIds = selectedRoutine.exerciseIds?.length
                ? selectedRoutine.exerciseIds.map(Number)
                : (selectedRoutine.items || [])
                    .map(name => d.exercises.find(
                        exercise => exercise.name === name
                    )?.id)
                    .filter(id => id != null);

            if (!routineExerciseIds.length) {
                toast("Esta rutina no tiene ejercicios del catálogo. Edita la rutina y añade ejercicios.");
                return;
            }

            const routineExerciseNames = routineExerciseIds
                .map(id => d.exercises.find(exercise => exercise.id === id)?.name)
                .filter(Boolean);

            d.sessions.unshift({
                id: makeId(),
                name: selectedRoutine.name,
                routineId: selectedRoutine.id,
                routineName: selectedRoutine.name,
                date: values.date,
                exerciseIds: routineExerciseIds,
                exerciseNames: routineExerciseNames,
                exercises: routineExerciseNames.length,
                volume: Number(values.volume)
            });
        }

        // PROGRESO

        if (type === "progress") {

            const measurement = {
                date: values.date,
                weight: Number(values.weight),
                waist: Number(values.waist) || null,
                chest: Number(values.chest) || null,
                note: values.note.trim()
            };

            d.progress.push(measurement);

            d.profile.weight = measurement.weight;
        }

        save();

        $("#backdrop").classList.remove("open");

        render();

        toast("Registro guardado correctamente.");
    };
}

// ============================================
// EVENTOS DE MODALES
// ============================================

$$("[data-modal]").forEach(button => {
    button.onclick = () => openModal(button.dataset.modal);
});

$("#close").onclick = () => {
    $("#backdrop").classList.remove("open");
    $(".modal").classList.remove("detail-modal");
};

$("#backdrop").onclick = event => {
    if (event.target.id === "backdrop") {
        $("#backdrop").classList.remove("open");
        $(".modal").classList.remove("detail-modal");
    }
};

// ============================================
// ELIMINAR Y CONSULTAR REGISTROS
// ============================================

document.addEventListener("click", async event => {

    const detailButton = event.target.closest("[data-detail]");

    if (detailButton) {
        showExerciseDetail(Number(detailButton.dataset.detail));
        return;
    }

    const editButton = event.target.closest("[data-edit]");

    if (editButton) {
        openModal("exercise", Number(editButton.dataset.edit));
        return;
    }

    const deleteActions = [
        ["data-del-ex", "exercises"],
        ["data-del-routine", "routines"],
        ["data-del-session", "sessions"]
    ];

    for (const [attribute, collection] of deleteActions) {

        const button = event.target.closest(`[${attribute}]`);

        if (!button) continue;

        if (!confirm("¿Eliminar este registro?")) return;

        const id = Number(button.getAttribute(attribute));

        try {
            if (collection === "exercises") {
                await apiRequest(
                    `/api/exercises/${Math.abs(id)}`,
                    { method: "DELETE" }
                );
            }

            d[collection] = d[collection].filter(
                item => item.id !== id
            );

            save();
            render();
            toast("Registro eliminado.");

        } catch (error) {
            console.error("Error eliminando registro:", error);
            toast(`No se pudo eliminar: ${error.message}`);
        }

        return;
    }
});

// ============================================
// BIBLIOTECA DE EJERCICIOS
// ============================================

let exerciseTab = "all";

["searchExercise", "filterMuscle", "filterType", "filterEquipment"]
    .forEach(id => {
        const element = $("#" + id);

        if (!element) return;

        element.addEventListener(
            id === "searchExercise" ? "input" : "change",
            renderExercises
        );
    });

$$("[data-exercise-tab]").forEach(button => {
    button.onclick = () => {

        exerciseTab = button.dataset.exerciseTab;

        $$("[data-exercise-tab]").forEach(tab => {
            tab.classList.toggle("active", tab === button);
        });

        renderExercises();
    };
});

function renderExercises() {

    const grid = $("#exerciseGrid");

    if (!grid) return;

    const query = $("#searchExercise").value.toLowerCase();
    const muscle = $("#filterMuscle").value;
    const type = $("#filterType").value;
    const equipment = $("#filterEquipment").value;

    const items = d.exercises.filter(exercise => {

        const matchesTab =
            exerciseTab === "all" ||
            (exerciseTab === "builtin" && exercise.builtin) ||
            (exerciseTab === "custom" && !exercise.builtin);

        const searchable = [
            exercise.name,
            exercise.muscle,
            exercise.equipment,
            exercise.type,
            exercise.description
        ].join(" ").toLowerCase();

        return matchesTab &&
            (!query || searchable.includes(query)) &&
            (!muscle || exercise.muscle === muscle) &&
            (!type || exercise.type === type) &&
            (!equipment || exercise.equipment === equipment);
    });

    const builtIn = d.exercises.filter(
        exercise => exercise.builtin
    ).length;

    $("#exerciseCount").textContent =
        `${d.exercises.length} ejercicios`;

    $("#builtInCount").textContent = builtIn;

    $("#customCount").textContent =
        d.exercises.length - builtIn;

    $("#filteredCount").textContent =
        `${items.length} resultados`;

    $("#exerciseEmpty").hidden = items.length > 0;

    grid.innerHTML = items.map((exercise, index) => `
        <article class="library-card">

            <div class="exercise-art">
                <span class="art-number">
                    EX / ${String(index + 1).padStart(2, "0")}
                </span>

                <span class="art-icon">
                    ${esc(exercise.icon)}
                </span>

                <span class="art-label">
                    ${esc(exercise.muscle)}
                </span>
            </div>

            <div class="library-card-body">

                <div class="library-card-top">
                    <span class="muscle-chip">
                        ${esc(exercise.muscle)}
                    </span>

                    <span class="kind-chip">
                        ${exercise.builtin ? "Predefinido" : "Personalizado"}
                    </span>
                </div>

                <h3>${esc(exercise.name)}</h3>

                <p>${esc(exercise.description)}</p>

                <div class="exercise-meta">
                    <span>${esc(exercise.type)}</span>
                    <span>◈ ${esc(exercise.equipment)}</span>
                </div>

                <div class="library-card-actions">

                    <button data-detail="${exercise.id}">
                        Ver ficha
                    </button>

                    ${exercise.builtin ? "" : `
                        <button data-edit="${exercise.id}">
                            Editar
                        </button>

                        <button data-del-ex="${exercise.id}">
                            Eliminar
                        </button>
                    `}

                </div>
            </div>
        </article>
    `).join("");
}

// ============================================
// FICHA DETALLADA DEL EJERCICIO
// ============================================

function showExerciseDetail(id) {

    const exercise = d.exercises.find(
        item => item.id === id
    );

    if (!exercise) return;

    $("#modalTitle").textContent = "Ficha del ejercicio";

    $("#modalContent").innerHTML = `
        <div class="detail-hero">

            <div class="exercise-art">
                <span class="art-icon">
                    ${esc(exercise.icon)}
                </span>
            </div>

            <div>
                <h3>${esc(exercise.name)}</h3>

                <span class="muscle-chip">
                    ${esc(exercise.muscle)}
                </span>

                <div class="detail-badges">
                    <span class="kind-chip">${esc(exercise.type)}</span>
                    <span class="kind-chip">${esc(exercise.equipment)}</span>
                    <span class="kind-chip">${esc(exercise.level || "—")}</span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4>Descripción</h4>
            <p>${esc(exercise.description)}</p>
        </div>

        <div class="detail-section">
            <h4>Cómo ejecutarlo</h4>

            <ol>
                ${(exercise.instructions || []).map(instruction => `
                    <li>${esc(instruction)}</li>
                `).join("")}
            </ol>
        </div>

        <div class="detail-section">
            <p>
                Esta ficha es una guía general. Ajusta el rango de
                movimiento y la carga a tu capacidad y utiliza
                una técnica controlada.
            </p>
        </div>

        <div class="actions">
            <button id="detailClose" class="primary">
                Cerrar ficha
            </button>
        </div>
    `;

    $("#backdrop").classList.add("open");
    $(".modal").classList.add("detail-modal");

    $("#detailClose").onclick = () => {
        $("#backdrop").classList.remove("open");
        $(".modal").classList.remove("detail-modal");
    };
}

// ============================================
// BUSCADOR DE SESIONES
// ============================================

if ($("#searchSession")) {

    $("#searchSession").oninput = event => {

        const query = event.target.value.toLowerCase();

        $$("#sessionRows tr").forEach(row => {
            row.hidden = !row.textContent.toLowerCase().includes(query);
        });
    };
}

// ============================================
// PERFIL
// ============================================

$("#saveProfile").onclick = () => {
    $("#profileForm").requestSubmit();
};

$("#profileForm").onsubmit = event => {

    event.preventDefault();

    d.profile = {
        name: $("#name").value.trim(),
        email: $("#email").value.trim(),
        height: $("#height").value.trim() === "" ? null : Number($("#height").value),
        weight: $("#weight").value.trim() === "" ? null : Number($("#weight").value),
        goalType: $("#goalType").value,
        targetWeight: $("#targetWeight").value.trim() === ""
            ? null
            : Number($("#targetWeight").value),
        weeklyTarget: Math.min(
            7,
            Math.max(1, Number($("#weeklyTarget").value) || 5)
        ),
        targetDate: $("#targetDate").value
    };

    save();
    render();

    toast("Perfil actualizado.");
};

// ============================================
// INICIALIZACIÓN
// ============================================


let authMode = "login";
let authenticatedUser = null;
const TOKEN_KEY = "gpt-auth-token";

async function authRequest(path, payload, token = "") {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: payload ? "POST" : "GET",
        headers: {"Content-Type":"application/json", ...(token ? {Authorization:`Bearer ${token}`} : {})},
        ...(payload ? {body:JSON.stringify(payload)} : {})
    });
    const data = await response.json().catch(()=>({error:"Respuesta inválida del servidor."}));
    if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
    return data;
}

function showAuth(mode = "login") {
    authMode = mode;
    $("#authScreen").hidden = false;
    $("#appShell").hidden = true;
    $("#authNameWrap").hidden = mode !== "register";
    $("#authTitle").innerHTML = mode === "register" ? 'Crear cuenta<span>.</span>' : 'Inicia sesión<span>.</span>';
    $("#authSubtitle").textContent = mode === "register" ? "Crea tu espacio personal para registrar tu progreso." : "Accede a tu espacio personal de entrenamiento.";
    $("#authSubmit").textContent = mode === "register" ? "Crear cuenta" : "Iniciar sesión";
    $("#authSwitchText").textContent = mode === "register" ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?";
    $("#authToggle").textContent = mode === "register" ? "Iniciar sesión" : "Crear cuenta";
    $("#authPassword").autocomplete = mode === "register" ? "new-password" : "current-password";
    $("#authError").textContent = "";
}

function loadAccountData(user) {
    // Limpieza única de los datos locales de todas las cuentas anteriores.
    const resetKey = "gpt-reset-all-user-data-v1";

    if (localStorage.getItem(resetKey) !== "done") {
        Object.keys(localStorage).forEach(key => {
            if (
                key === "gpt-demo" ||
                key.startsWith("gpt-user-")
            ) {
                localStorage.removeItem(key);
            }
        });

        localStorage.setItem(resetKey, "done");
    }

    authenticatedUser = user;
    STORAGE_KEY = `gpt-user-${user.id}`;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        d = stored ? JSON.parse(stored) : structuredClone(initial);
    } catch { d = structuredClone(initial); }

    d.routines = Array.isArray(d.routines) ? d.routines : [];
    d.sessions = Array.isArray(d.sessions) ? d.sessions : [];
    d.progress = Array.isArray(d.progress) ? d.progress : [];

    d.profile = {...initial.profile, ...(d.profile || {}), name:user.full_name, email:user.email};

    let cleanedDemoData = false;

    const demoSessionVolumes = [2450, 2180, 2820];
    if (
        Array.isArray(d.sessions) &&
        d.sessions.length === 3 &&
        d.sessions.every(x => demoSessionVolumes.includes(Number(x.volume))) &&
        d.sessions.some(x => x.name === "Push Day")
    ) {
        d.sessions = [];
        d.routines = [];
        cleanedDemoData = true;
    }

    const demoDates = ["2026-11-19", "2026-11-05", "2026-10-20", "2026-10-05"];
    if (
        Array.isArray(d.progress) &&
        d.progress.length === 4 &&
        d.progress.every(x => demoDates.includes(x.date)) &&
        d.progress.some(x => x.note === "Medición inicial")
    ) {
        d.progress = [];
        cleanedDemoData = true;
    }

    if (cleanedDemoData) {
        if (Number(d.profile.weight) === 74.5) d.profile.weight = null;
        if (Number(d.profile.height) === 175) d.profile.height = null;
        save();
    }

    $("#authScreen").hidden = true;
    $("#appShell").hidden = false;
    $("#sideName").textContent = user.full_name;
    $("#sideInitials").textContent = user.full_name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
    $("#name").value = user.full_name;
    $("#email").value = user.email;

    $("#height").value = d.profile.height ?? "";
    $("#weight").value = d.profile.weight ?? "";
}

$("#authToggle").addEventListener("click", () => showAuth(authMode === "login" ? "register" : "login"));
$("#authForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = $("#authSubmit");
    button.disabled = true;
    $("#authError").textContent = "";
    try {
        const payload = {email:$("#authEmail").value.trim(),password:$("#authPassword").value};
        if (authMode === "register") payload.full_name = $("#authName").value.trim();
        const data = await authRequest(authMode === "register" ? "/api/register" : "/api/login",payload);
        localStorage.setItem(TOKEN_KEY,data.token);
        loadAccountData(data.user);
        await initializeApp();
    } catch (error) {
        $("#authError").textContent = error.message;
    } finally { button.disabled = false; }
});

$("#logoutButton").addEventListener("click", async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    try { if (token) await authRequest("/api/logout",{},token); } catch {}
    localStorage.removeItem(TOKEN_KEY);
    authenticatedUser = null;
    showAuth("login");
});

async function initializeApp() {
    try {
        await loadExercisesFromAPI();
    } catch (error) {
        console.error("No se pudo sincronizar con D1:", error);
        toast("No se pudo conectar con el servidor. Se muestran los datos locales.");
    }
    render();
}

async function bootAuth() {
    showAuth("login");
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
        const data = await authRequest("/api/me",null,token);
        loadAccountData(data.user);
        await initializeApp();
    } catch {
        localStorage.removeItem(TOKEN_KEY);
        showAuth("login");
    }
}
bootAuth();



// La Mejor Taza — Firebase web app
// Auth + Firestore for user passports in the 64 municipalities of Nariño.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Municipalities of Nariño (sourced from municipios.geojson)
const MUNICIPIOS = [
  "ALBÁN", "ALDANA", "ANCUYA", "ARBOLEDA", "BARBACOAS", "BELÉN", "BUESACO",
  "CHACHAGÜÍ", "COLÓN", "CONSACÁ", "CONTADERO", "CUASPUD CARLOSAMA", "CUMBAL",
  "CUMBITARA", "CÓRDOBA", "EL CHARCO", "EL PEÑOL", "EL ROSARIO",
  "EL TABLÓN DE GÓMEZ", "EL TAMBO", "FRANCISCO PIZARRO", "FUNES", "GUACHUCAL",
  "GUAITARILLA", "GUALMATÁN", "ILES", "IMUÉS", "IPIALES", "LA CRUZ",
  "LA FLORIDA", "LA LLANADA", "LA TOLA", "LA UNIÓN", "LEIVA", "LINARES",
  "LOS ANDES", "MAGÜÍ", "MALLAMA", "MOSQUERA", "NARIÑO", "OLAYA HERRERA",
  "OSPINA", "PASTO", "POLICARPA", "POTOSÍ", "PROVIDENCIA", "PUERRES",
  "PUPIALES", "RICAURTE", "ROBERTO PAYÁN", "SAMANIEGO", "SAN ANDRÉS DE TUMACO",
  "SAN BERNARDO", "SAN LORENZO", "SAN PABLO", "SAN PEDRO DE CARTAGO",
  "SANDONÁ", "SANTA BÁRBARA", "SANTACRUZ", "SAPUYES", "TAMINANGO", "TANGUA",
  "TÚQUERRES", "YACUANQUER"
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---- UI helpers ----
function setMessage(formId, text, type = "") {
  const el = document.querySelector(`.form-msg[data-for="${formId}"]`);
  if (!el) return;
  el.textContent = text;
  el.className = `form-msg ${type}`.trim();
}

function show(route) {
  $$(".view").forEach(v => v.classList.add("hidden"));
  const target = $(`#view-${route}`);
  if (target) target.classList.remove("hidden");
}

function authError(code) {
  const map = {
    "auth/invalid-email": "Correo inválido.",
    "auth/email-already-in-use": "Este correo ya está registrado.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-credential": "Credenciales incorrectas.",
    "auth/user-not-found": "Usuario no encontrado.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/network-request-failed": "Sin conexión. Inténtalo de nuevo.",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
  };
  return map[code] || "Ocurrió un error. Inténtalo de nuevo.";
}

function populateMunicipios() {
  const select = document.querySelector('select[name="municipality"]');
  if (!select) return;
  MUNICIPIOS.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
}

function passportIdFromUid(uid) {
  // Short, stable, human-readable identifier for the passport
  let hash = 0;
  for (const ch of uid) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return "#" + hash.toString(36).toUpperCase().padStart(7, "0").slice(-7);
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "☕";
}

// ---- Tabs (login/register) ----
$$(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach(t => t.classList.toggle("active", t === tab));
    const target = tab.dataset.tab;
    $("#loginForm").classList.toggle("hidden", target !== "login");
    $("#registerForm").classList.toggle("hidden", target !== "register");
  });
});

// ---- Navigation ----
$$(".nav-btn[data-route]").forEach(btn => {
  btn.addEventListener("click", () => show(btn.dataset.route));
});
$("#logoutBtn").addEventListener("click", () => signOut(auth));

// ---- Register ----
$("#registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  setMessage("registerForm", "Creando cuenta…");
  try {
    const cred = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
    await updateProfile(cred.user, { displayName: data.fullName.trim() });
    await setDoc(doc(db, "users", cred.user.uid), {
      fullName: data.fullName.trim(),
      documentId: data.documentId.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      municipality: "",
      gender: "",
      ethnicity: "",
      age: null,
      stamps: [],
      termsAcceptedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setMessage("registerForm", "¡Cuenta creada!", "ok");
    form.reset();
  } catch (err) {
    setMessage("registerForm", authError(err.code), "error");
  } finally {
    btn.disabled = false;
  }
});

// ---- Login ----
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  setMessage("loginForm", "Entrando…");
  try {
    await signInWithEmailAndPassword(auth, data.email.trim(), data.password);
    setMessage("loginForm", "");
    form.reset();
  } catch (err) {
    setMessage("loginForm", authError(err.code), "error");
  } finally {
    btn.disabled = false;
  }
});

// ---- Profile form ----
$("#profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  setMessage("profileForm", "Guardando…");
  try {
    const update = {
      fullName: data.fullName.trim(),
      documentId: data.documentId.trim(),
      phone: data.phone.trim(),
      municipality: data.municipality || "",
      gender: data.gender || "",
      ethnicity: data.ethnicity || "",
      age: data.age ? Number(data.age) : null,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, "users", user.uid), update);
    if (update.fullName && update.fullName !== user.displayName) {
      await updateProfile(user, { displayName: update.fullName });
    }
    setMessage("profileForm", "Perfil actualizado.", "ok");
    await renderPassport(user);
  } catch (err) {
    console.error(err);
    setMessage("profileForm", "No se pudo guardar el perfil.", "error");
  } finally {
    btn.disabled = false;
  }
});

// ---- Render passport + profile from Firestore ----
async function loadProfile(user) {
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? snap.data() : null;
}

async function renderPassport(user) {
  const profile = await loadProfile(user);
  $("#passportId").textContent = passportIdFromUid(user.uid);
  $("#passportPhoto").textContent = initials(profile?.fullName || user.displayName || "");
  $("#pName").textContent = profile?.fullName || user.displayName || "—";
  $("#pDocument").textContent = profile?.documentId || "—";
  $("#pMunicipio").textContent = profile?.municipality || "—";
  $("#pCreated").textContent = formatDate(profile?.createdAt);

  const stamps = profile?.stamps || [];
  const grid = $("#stampsGrid");
  grid.innerHTML = "";
  if (stamps.length === 0) {
    grid.innerHTML = '<p class="muted">Aún no tienes sellos. Visita los stands para obtenerlos.</p>';
  } else {
    stamps.forEach(s => {
      const el = document.createElement("div");
      el.className = "stamp stamp--earned";
      el.textContent = s.name || s;
      grid.appendChild(el);
    });
  }
}

function fillProfileForm(profile) {
  const form = $("#profileForm");
  form.fullName.value = profile?.fullName || "";
  form.documentId.value = profile?.documentId || "";
  form.phone.value = profile?.phone || "";
  form.municipality.value = profile?.municipality || "";
  form.gender.value = profile?.gender || "";
  form.ethnicity.value = profile?.ethnicity || "";
  form.age.value = profile?.age ?? "";
}

// ---- Auth state ----
onAuthStateChanged(auth, async (user) => {
  if (user) {
    $("#nav").classList.remove("hidden");
    await renderPassport(user);
    const profile = await loadProfile(user);
    fillProfileForm(profile);
    show("pasaporte");
  } else {
    $("#nav").classList.add("hidden");
    show("auth");
  }
});

// ---- Init ----
populateMunicipios();
$("#year").textContent = new Date().getFullYear();

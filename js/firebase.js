// Wiring Firebase para "La Mejor Taza"
// - Si existe firebase-config.js con un `firebaseConfig` válido, se conecta a Firestore
//   y reemplaza window.STANDS_DATA / COMENTARIOS_DEMO / PASAPORTE_DEMO en tiempo real.
// - Si no, se mantienen los datos demo de data/stands.js (modo desarrollo).
//
// Disparamos el evento "lmt:data" cada vez que llega un snapshot, para que la UI
// pueda re-renderizar (App escucha y forza un re-mount con un contador).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

let cfg = null;
try {
  const mod = await import("../firebase-config.js");
  cfg = mod.firebaseConfig || null;
} catch (_) {
  cfg = null;
}

const dispatch = () => window.dispatchEvent(new CustomEvent("lmt:data"));

if (!cfg || !cfg.apiKey || cfg.apiKey.startsWith("REPLACE")) {
  console.info("[firebase] firebase-config.js no encontrado o incompleto. Modo demo (datos locales).");
  window.LMTFirebase = {
    enabled: false,
    submitVote: async () => { throw new Error("Firebase no configurado"); },
    signInAdmin: async () => { throw new Error("Firebase no configurado"); },
    signOutAdmin: async () => {},
    onAuth: () => () => {},
  };
} else {
  const app = initializeApp(cfg);
  const db = getFirestore(app);
  const auth = getAuth(app);

  try { await setPersistence(auth, browserLocalPersistence); } catch (_) {}
  try { await enableIndexedDbPersistence(db); } catch (_) { /* tab única o no soportado */ }

  // Auth anónimo para que la sesión móvil pueda leer/escribir bajo reglas.
  try { await signInAnonymously(auth); } catch (e) { console.warn("[firebase] auth anónimo falló:", e); }

  // STANDS — lectura en tiempo real
  onSnapshot(collection(db, "stands"), (snap) => {
    const list = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        nombre: data.nombre || "",
        municipio: data.municipio || "",
        region: data.region || "",
        direccion: data.direccion || "",
        correo: data.correo || "",
        descripcion: data.descripcion || "",
        coords: data.coords || { x: 0.5, y: 0.5 },
        color: data.color || "oklch(0.45 0.1 40)",
        votos: data.votos || { bueno: 0, regular: 0, malo: 0 },
      };
    });
    if (list.length) {
      window.STANDS_DATA = list;
      dispatch();
    }
  }, (err) => console.warn("[firebase] stands onSnapshot:", err));

  // VOTOS — últimos 20 para el feed live
  const lastVotes = query(collection(db, "votos"), orderBy("createdAt", "desc"), limit(20));
  onSnapshot(lastVotes, (snap) => {
    const stands = window.STANDS_DATA || [];
    const standMap = Object.fromEntries(stands.map((s) => [s.id, s]));
    const items = snap.docs.map((d) => {
      const v = d.data() || {};
      const created = v.createdAt && v.createdAt.toDate ? v.createdAt.toDate() : new Date();
      const ago = relativeTime(created);
      return {
        stand: v.stand,
        emoji: v.emoji,
        texto: window.LMTSecurity ? window.LMTSecurity.sanitizeText(v.texto || "", 500) : (v.texto || ""),
        compra: !!v.compra,
        autor: window.LMTSecurity ? window.LMTSecurity.maskEmail(v.correo || "") : (v.correo || ""),
        hora: ago,
        _stand: standMap[v.stand],
      };
    });
    window.COMENTARIOS_DEMO = items;
    dispatch();
  }, (err) => console.warn("[firebase] votos onSnapshot:", err));

  function relativeTime(date) {
    const diff = Math.max(0, Date.now() - date.getTime());
    const s = Math.floor(diff / 1000);
    if (s < 60) return `hace ${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    return `hace ${d} d`;
  }

  async function submitVote(raw) {
    if (!window.LMTSecurity) throw new Error("LMTSecurity no cargado");
    const payload = window.LMTSecurity.buildVotePayload(raw);
    if (!window.LMTSecurity.canVote(payload.stand)) {
      throw new Error("rate_limited");
    }
    if (auth.currentUser == null) {
      try { await signInAnonymously(auth); } catch (e) { /* reglas decidirán */ }
    }
    await addDoc(collection(db, "votos"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    await setDoc(
      doc(db, "pasaportes", payload.correo),
      { correo: payload.correo, visitados: arrayUnion(payload.stand) },
      { merge: true }
    );
    window.LMTSecurity.markVote(payload.stand);
  }

  async function signInAdmin(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  async function signOutAdmin() { return signOut(auth); }
  function onAuth(cb) { return onAuthStateChanged(auth, cb); }

  window.LMTFirebase = {
    enabled: true,
    submitVote,
    signInAdmin,
    signOutAdmin,
    onAuth,
  };
}

// Notificación inicial para que React arranque con datos (sea demo o Firestore).
dispatch();

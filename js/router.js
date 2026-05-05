// Router de cliente para "La Mejor Taza".
// - Calcula el path interno (sin el prefijo del subdirectorio).
// - Intercepta clicks en <a data-route> para navegación SPA.
// - Mantiene una lista de subscribers para que React re-renderice.

(function () {
  const BASE = (window.LMT_BASE_URL || "").replace(/\/$/, "");
  const subs = new Set();

  function currentPath() {
    let p = window.location.pathname || "/";
    if (BASE && p.indexOf(BASE) === 0) p = p.slice(BASE.length) || "/";
    if (!p.startsWith("/")) p = "/" + p;
    return p;
  }

  function current() {
    return {
      path: currentPath(),
      search: window.location.search,
      hash: window.location.hash,
    };
  }

  function notify() {
    const r = current();
    subs.forEach((cb) => { try { cb(r); } catch (e) { console.error(e); } });
  }

  function go(path, opts = {}) {
    if (typeof path !== "string") return;
    let url = path;
    if (path.startsWith("/")) {
      url = (BASE || "") + path;
    } else if (/^https?:/i.test(path)) {
      window.location.href = path;
      return;
    }
    if (opts.replace) {
      window.history.replaceState({}, "", url);
    } else {
      window.history.pushState({}, "", url);
    }
    window.scrollTo(0, 0);
    notify();
  }

  function subscribe(cb) {
    subs.add(cb);
    return () => subs.delete(cb);
  }

  function isInternal(href) {
    if (!href) return false;
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return false;
    try {
      const u = new URL(href, window.location.href);
      return u.origin === window.location.origin;
    } catch (_) { return false; }
  }

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest("a");
    if (!a) return;
    if (a.target && a.target !== "" && a.target !== "_self") return;
    if (a.hasAttribute("download")) return;
    if (!a.hasAttribute("data-route")) return;
    if (!isInternal(a.getAttribute("href"))) return;
    e.preventDefault();
    const u = new URL(a.href, window.location.href);
    let path = u.pathname + u.search + u.hash;
    if (BASE && u.pathname.indexOf(BASE) === 0) path = u.pathname.slice(BASE.length) + u.search + u.hash;
    if (!path.startsWith("/")) path = "/" + path;
    go(path);
  });

  window.addEventListener("popstate", notify);

  window.LMTRouter = { current, currentPath, go, subscribe };
})();

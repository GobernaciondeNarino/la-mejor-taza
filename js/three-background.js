// Three.js — fondo animado para "La Mejor Taza"
// Granos de café flotantes en un campo de partículas suaves.
// Se monta sobre cualquier elemento con data-three-bg y se autocontiene
// (respeta prefers-reduced-motion, se pausa cuando la pestaña no es visible).

(function () {
  if (typeof THREE === "undefined") {
    console.warn("[three-background] THREE no está cargado. Saltando montaje.");
    return;
  }

  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cssVar = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  };

  // Convierte un color CSS arbitrario a hex usando el navegador.
  const cssToHex = (cssColor, fallback = 0x6b4f3a) => {
    try {
      const probe = document.createElement("span");
      probe.style.color = cssColor;
      probe.style.display = "none";
      document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      document.body.removeChild(probe);
      const m = rgb.match(/\d+(\.\d+)?/g);
      if (!m) return fallback;
      const [r, g, b] = m.map(Number);
      return (r << 16) | (g << 8) | b;
    } catch (_) {
      return fallback;
    }
  };

  function createBeanGeometry() {
    // Forma de grano: dos elipsoides cortados con un surco central.
    const geo = new THREE.SphereGeometry(1, 24, 16);
    geo.scale(1, 0.62, 0.5);
    return geo;
  }

  function mountScene(container) {
    if (container.dataset.threeMounted === "1") return null;
    container.dataset.threeMounted = "1";

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(cssToHex(cssVar("--paper", "#f6efe2"), 0xf6efe2), 0.06);

    const { clientWidth: w, clientHeight: h } = container;
    const camera = new THREE.PerspectiveCamera(55, Math.max(w, 1) / Math.max(h, 1), 0.1, 100);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0); // transparente para mostrar var(--paper)
    container.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });

    // Iluminación cálida
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffd9a6, 0.9);
    key.position.set(4, 6, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8aa1ff, 0.25);
    fill.position.set(-6, -3, 4);
    scene.add(fill);

    // Granos de café
    const beanGeometry = createBeanGeometry();
    const granoColor = cssToHex(cssVar("--grano", "#6b4f3a"), 0x6b4f3a);
    const galerasColor = cssToHex(cssVar("--galeras", "#a8593a"), 0xa8593a);
    const cafetoColor = cssToHex(cssVar("--cafeto", "#5a7a4a"), 0x5a7a4a);
    const palette = [granoColor, galerasColor, cafetoColor];

    const BEAN_COUNT = Math.min(48, Math.floor((w * h) / 22000) + 12);
    const beans = [];
    for (let i = 0; i < BEAN_COUNT; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: palette[i % palette.length],
        roughness: 0.65,
        metalness: 0.05,
        flatShading: false,
      });
      const mesh = new THREE.Mesh(beanGeometry, mat);
      const r = 6 + Math.random() * 8;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 10;
      mesh.position.set(Math.cos(a) * r, y, Math.sin(a) * r - 4);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const scale = 0.18 + Math.random() * 0.22;
      mesh.scale.setScalar(scale);
      mesh.userData = {
        speed: 0.05 + Math.random() * 0.12,
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6
        ),
        baseY: mesh.position.y,
        amp: 0.4 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      };
      scene.add(mesh);
      beans.push(mesh);
    }

    // Vapor: campo de partículas tenue por encima
    const steamGeo = new THREE.BufferGeometry();
    const steamCount = 220;
    const positions = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    steamGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const steamMat = new THREE.PointsMaterial({
      color: cssToHex(cssVar("--paper-3", "#d6c8a8"), 0xd6c8a8),
      size: 0.08,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const steam = new THREE.Points(steamGeo, steamMat);
    scene.add(steam);

    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener("mousemove", onMouseMove, { passive: true });

    const onResize = () => {
      const rect = container.getBoundingClientRect();
      const ww = Math.max(rect.width, 1);
      const hh = Math.max(rect.height, 1);
      camera.aspect = ww / hh;
      camera.updateProjectionMatrix();
      renderer.setSize(ww, hh, false);
    };
    const ro = "ResizeObserver" in window ? new ResizeObserver(onResize) : null;
    if (ro) ro.observe(container);
    window.addEventListener("resize", onResize);

    let running = true;
    const onVisibility = () => { running = !document.hidden; if (running) tick(); };
    document.addEventListener("visibilitychange", onVisibility);

    const clock = new THREE.Clock();
    let rafId = 0;
    const tick = () => {
      if (!running) return;
      rafId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      const dt = Math.min(0.05, clock.getDelta());

      targetX += (mouseX * 0.4 - targetX) * 0.05;
      targetY += (-mouseY * 0.3 - targetY) * 0.05;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      for (const m of beans) {
        m.rotation.x += m.userData.spin.x * dt;
        m.rotation.y += m.userData.spin.y * dt;
        m.rotation.z += m.userData.spin.z * dt;
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.speed + m.userData.phase) * m.userData.amp;
      }
      steam.rotation.y = t * 0.02;

      renderer.render(scene, camera);
    };

    if (reduceMotion) {
      // Render estático: una pasada y listo.
      renderer.render(scene, camera);
    } else {
      tick();
    }

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        running = false;
        if (ro) ro.disconnect();
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
        container.removeEventListener("mousemove", onMouseMove);
        beans.forEach((b) => b.material.dispose());
        beanGeometry.dispose();
        steamGeo.dispose();
        steamMat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        delete container.dataset.threeMounted;
      },
    };
  }

  // API global, llamable desde React
  window.LMTThree = {
    mount: mountScene,
  };

  // Auto-montaje para cualquier contenedor existente
  const auto = () => {
    document.querySelectorAll("[data-three-bg]").forEach((el) => {
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      mountScene(el);
    });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", auto);
  } else {
    auto();
  }
})();

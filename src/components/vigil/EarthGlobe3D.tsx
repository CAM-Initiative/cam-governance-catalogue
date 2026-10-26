import { useEffect, useRef, useState, type PointerEvent } from "react";
import * as THREE from "three";
import { globePosition, globeRotationForLongitude } from "@/lib/vigilGlobeCoordinates.mjs";

type Location = { id: string; name: string; lat: number; lon: number; count: number };
type GlobeProps = {
  locations: Location[];
  selected: string[];
  onSelect: (country: string) => void;
  onUnavailable: () => void;
};

// The equirectangular image is a publicly served Blue Marble Earth composite.
// Source attribution: NASA Blue Marble, distributed with three-globe.
// The pinned, checksummed image is served from our own GitHub Pages assets.
const EARTH_TEXTURE = `${import.meta.env.BASE_URL}assets/earth-blue-marble.jpg`;
const BACKUP_TEXTURE = "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg";
const RAD = Math.PI / 180;
const GLOBE_RADIUS = 1.36;
const START_LONGITUDE = 18;
const VIEW_DISTANCE = 4.3;

function toGlobeVector(lat: number, lon: number, radius: number) {
  const point = globePosition(lat, lon, radius);
  return new THREE.Vector3(point.x, point.y, point.z);
}

function nearestAngle(current: number, target: number) {
  const full = Math.PI * 2;
  return target + Math.round((current - target) / full) * full;
}

type SceneState = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  tilt: THREE.Group;
  earth: THREE.Group;
  earthGeometry: THREE.SphereGeometry;
  earthMaterial: THREE.MeshPhongMaterial;
  markers: THREE.Group;
  targets: THREE.Mesh[];
  lightMaterials: THREE.SpriteMaterial[];
  glowTexture: THREE.CanvasTexture;
  lightGroups: THREE.Group[];
  targetTilt: number;
  targetSpin: number;
  dragStart?: { x: number; y: number; tilt: number; spin: number };
  lastInteraction: number;
  frame: number;
  resize: ResizeObserver;
  texture?: THREE.Texture;
};

export default function EarthGlobe3D({ locations, selected, onSelect, onUnavailable }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneState | null>(null);
  const callbackRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  const unavailableRef = useRef(onUnavailable);
  const [ready, setReady] = useState(false);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [overBeacon, setOverBeacon] = useState(false);
  const hoverIdRef = useRef<string | null>(null);
  callbackRef.current = onSelect;
  selectedRef.current = selected;
  unavailableRef.current = onUnavailable;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    let state: SceneState | null = null;
    let cancelled = false;
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas, alpha: true, antialias: true, powerPreference: "low-power",
        preserveDrawingBuffer: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.16;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, .1, 40);
      camera.position.set(0, 0, VIEW_DISTANCE);
      camera.lookAt(0, 0, 0);

      const tilt = new THREE.Group();
      const earth = new THREE.Group();
      scene.add(tilt);
      tilt.add(earth);
      tilt.rotation.x = .19;
      earth.rotation.y = globeRotationForLongitude(START_LONGITUDE);

      scene.add(new THREE.AmbientLight(0x87afd4, 1.0));
      const sunlight = new THREE.DirectionalLight(0xfff0d7, 2.35);
      sunlight.position.set(-2.8, 1.8, 4.7);
      scene.add(sunlight);
      const rimLight = new THREE.DirectionalLight(0x0c8bd6, 1.0);
      rimLight.position.set(3.0, -1.5, -3.5);
      scene.add(rimLight);

      const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 72, 48);
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff, specular: 0x25516b, shininess: 14,
      });
      const sphere = new THREE.Mesh(earthGeometry, earthMaterial);
      sphere.name = "Satellite-textured Earth";
      earth.add(sphere);

      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = 96;
      const glowContext = glowCanvas.getContext("2d");
      if (!glowContext) throw new Error("Canvas glow texture unavailable");
      const gradient = glowContext.createRadialGradient(48, 48, 0, 48, 48, 48);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(.15, "rgba(255,255,255,.92)");
      gradient.addColorStop(.38, "rgba(255,255,255,.35)");
      gradient.addColorStop(.67, "rgba(255,255,255,.08)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      glowContext.fillStyle = gradient;
      glowContext.fillRect(0, 0, 96, 96);
      const glowTexture = new THREE.CanvasTexture(glowCanvas);
      glowTexture.colorSpace = THREE.SRGBColorSpace;

      const markers = new THREE.Group();
      markers.name = "Confirmed jurisdiction markers";
      earth.add(markers);

      const resize = new ResizeObserver(() => {
        if (cancelled) return;
        const rect = host.getBoundingClientRect();
        const width = Math.max(180, Math.floor(rect.width));
        const height = Math.max(180, Math.floor(rect.height));
        if (canvas.width !== Math.round(width * renderer.getPixelRatio()) || canvas.height !== Math.round(height * renderer.getPixelRatio())) {
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      });
      resize.observe(host);

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      state = {
        renderer, scene, camera, tilt, earth, earthGeometry, earthMaterial,
        markers, targets: [], lightMaterials: [], lightGroups: [], glowTexture, targetSpin: earth.rotation.y, targetTilt: tilt.rotation.x,
        lastInteraction: Date.now(), frame: 0, resize,
      };
      sceneRef.current = state;

      const animate = () => {
        if (cancelled || !state) return;
        const smoothness = prefersReducedMotion ? 1 : 0.09;
        state.earth.rotation.y += (state.targetSpin - state.earth.rotation.y) * smoothness;
        state.tilt.rotation.x += (state.targetTilt - state.tilt.rotation.x) * smoothness;
        // Gentle ambient motion, disabled entirely for reduced-motion users.
        if (!prefersReducedMotion && !state.dragStart && !selectedRef.current.length &&
          Date.now() - state.lastInteraction > 7000) {
          state.targetSpin += 0.00048;
        }
        // Breathing satellite beacons. Intensity represents case density,
        // never a location for an individual Incident.
        if (!prefersReducedMotion) {
          const phase = Date.now() * 0.00135;
          for (let i = 0; i < state.lightMaterials.length; i++) {
            const mat = state.lightMaterials[i];
            const base = Number(mat.userData.baseOpacity ?? 0.18);
            mat.opacity = base * (0.87 + 0.13 * Math.sin(phase + i * 1.47));
          }
        }
        renderer.render(scene, camera);
        state.frame = window.requestAnimationFrame(animate);
      };
      state.frame = window.requestAnimationFrame(animate);

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      const loaded = (texture: THREE.Texture) => {
        if (cancelled || !state) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
        state.texture = texture;
        earthMaterial.map = texture;
        earthMaterial.needsUpdate = true;
        setReady(true);
      };
      const fail = () => {
        if (!cancelled) unavailableRef.current();
      };
      loader.load(EARTH_TEXTURE, loaded, undefined,
        () => loader.load(BACKUP_TEXTURE, loaded, undefined, fail));
    } catch {
      if (state) {
        window.cancelAnimationFrame(state.frame);
        state.resize.disconnect();
        state.renderer.dispose();
      }
      unavailableRef.current();
    }
    return () => {
      cancelled = true;
      if (!state) return;
      window.cancelAnimationFrame(state.frame);
      state.resize.disconnect();
      for (const group of state.lightGroups) {
        state.markers.remove(group);
        group.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            (object.material as THREE.Material).dispose();
          } else if (object instanceof THREE.Sprite) { object.material.dispose(); }
        });
      }
      state.texture?.dispose();
      state.glowTexture.dispose();
      state.earthGeometry.dispose();
      state.earthMaterial.dispose();
      state.renderer.dispose();
      state.renderer.forceContextLoss();
      sceneRef.current = null;
    };
    // Initialize GPU resources once; subsequent prop updates adjust scene targets.
  }, []);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    for (const group of state.lightGroups) {
      state.markers.remove(group);
      group.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        } else if (object instanceof THREE.Sprite) { object.material.dispose(); }
      });
    }
    state.targets = [];
    state.lightGroups = [];
    state.lightMaterials = [];
    const maximum = Math.max(1, ...locations.map(location => location.count));
    for (const location of locations) {
      const selectedLocation = selected.includes(location.id);
      // Logarithmic scaling prevents a high-volume jurisdiction from drowning
      // out smaller ones; these are source-field-derived COUNTRY anchors.
      const intensity = Math.log1p(location.count) / Math.log1p(maximum);
      const coreSize = (selectedLocation ? .041 : .029) + intensity * .013;
      const beacon = new THREE.Group();
      beacon.position.copy(toGlobeVector(location.lat, location.lon, GLOBE_RADIUS + .019));

      // Feathered billboard bloom, not an opaque coloured dot. All gradients
      // share one procedural texture (no remote image, no fake incident sites).
      const color = selectedLocation ? 0xffe6a1 : 0xffbd59;
      const makeGlow = (scale: number, opacity: number) => {
        const material = new THREE.SpriteMaterial({
          map: state.glowTexture, color, transparent: true, opacity,
          blending: THREE.AdditiveBlending, depthTest: true,
          depthWrite: false, toneMapped: false
        });
        material.userData.baseOpacity = opacity;
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(scale, scale, 1);
        beacon.add(sprite);
        state.lightMaterials.push(material);
      };
      makeGlow(coreSize * (7.5 + 2.5 * intensity), .3 + intensity * .22);
      makeGlow(coreSize * (3.6 + intensity), .43 + intensity * .26);

      const light = new THREE.Mesh(
        new THREE.SphereGeometry(coreSize, 14, 10),
        new THREE.MeshBasicMaterial({ color: selectedLocation ? 0xfff4d1 : 0xffd58a, toneMapped: false })
      );
      beacon.add(light);

      // Transparent enlarged hit sphere: easy to target on touch and mouse;
      // only accepted on the visible hemisphere by the shared hit test.
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(.088, coreSize * 2.1), 12, 10),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hit.userData = { id: location.id, label: location.name, count: location.count };
      beacon.add(hit);
      state.targets.push(hit);
      state.markers.add(beacon);
      state.lightGroups.push(beacon);
    }
  }, [locations, selected, ready]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state || !selected.length) return;
    const marker = locations.find(location => location.id === selected[selected.length - 1]);
    if (!marker) return;
    state.targetSpin = nearestAngle(state.earth.rotation.y, globeRotationForLongitude(marker.lon));
    state.targetTilt = THREE.MathUtils.clamp(marker.lat * RAD, -0.95, 0.95);
    state.lastInteraction = Date.now();
  }, [selected, locations, ready]);

  const hoveredBeacon = (event: PointerEvent<HTMLCanvasElement>) => {
    const state = sceneRef.current;
    if (!state || !state.targets.length) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, state.camera);
    state.scene.updateMatrixWorld(true);
    const matches = raycaster.intersectObjects(state.targets, false);
    // Reject back-of-globe lights; they remain in the same rotating Earth group.
    return matches.find(hit => {
      const position = new THREE.Vector3();
      hit.object.getWorldPosition(position);
      return position.z > 0.2;
    })?.object.userData as { id: string; label: string; count: number } | undefined;
  };

  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const state = sceneRef.current;
    if (!state) return;
    state.dragStart = { x: event.clientX, y: event.clientY, tilt: state.targetTilt, spin: state.targetSpin };
    state.lastInteraction = Date.now();
    setOverBeacon(false);
    setHoverLabel(null);
    hoverIdRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const state = sceneRef.current;
    if (!state) return;
    const drag = state.dragStart;
    if (drag) {
      state.targetSpin = drag.spin + (event.clientX - drag.x) * .008;
      state.targetTilt = THREE.MathUtils.clamp(drag.tilt + (event.clientY - drag.y) * .004, -1.1, 1.1);
      state.lastInteraction = Date.now();
      return;
    }
    const hover = hoveredBeacon(event);
    if (hoverIdRef.current === (hover?.id ?? null)) return;
    hoverIdRef.current = hover?.id ?? null;
    setOverBeacon(Boolean(hover));
    setHoverLabel(hover ? `${hover.label} · ${hover.count} case${hover.count === 1 ? "" : "s"}` : null);
  };
  const pointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const state = sceneRef.current;
    if (!state) return;
    const drag = state.dragStart;
    state.dragStart = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!drag || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) return;
    const hit = hoveredBeacon(event);
    if (hit) {
      callbackRef.current(hit.id);
      setOverBeacon(false);
      setHoverLabel(null);
      hoverIdRef.current = null;
    }
  };

  return (
    <div ref={hostRef} className="vigil-dashboard-globe-scene vigil-dashboard-three-scene">
      <canvas
        ref={canvasRef} className={`vigil-dashboard-globe-three${overBeacon ? " is-over-beacon" : ""}`}
        aria-hidden="true"
        style={{ opacity: ready ? 1 : 0 }}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
        onPointerCancel={() => { if (sceneRef.current) sceneRef.current.dragStart = undefined; }}
        onPointerLeave={() => { setHoverLabel(null); setOverBeacon(false); hoverIdRef.current = null; }}
        onContextMenu={event => event.preventDefault()}
      />
      {!ready && <div className="vigil-dashboard-three-loading" role="status">Loading satellite view…</div>}

      {hoverLabel && <span className="vigil-dashboard-globe-tooltip" role="status">{hoverLabel}</span>}
    </div>
  );
}

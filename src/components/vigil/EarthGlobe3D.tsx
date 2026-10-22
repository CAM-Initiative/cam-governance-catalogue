import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Compass, RotateCcw } from "lucide-react";
import * as THREE from "three";

type Location = { id: string; name: string; lat: number; lon: number; count: number };
type GlobeProps = {
  locations: Location[];
  selected: string;
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
  const latitude = lat * RAD;
  const longitude = lon * RAD;
  // Three's SphereGeometry uses u=.5 (Greenwich) on the -Z meridian.
  return new THREE.Vector3(
    radius * Math.cos(latitude) * Math.sin(longitude),
    radius * Math.sin(latitude),
    -radius * Math.cos(latitude) * Math.cos(longitude)
  );
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
  haloGeometry: THREE.SphereGeometry;
  haloMaterial: THREE.ShaderMaterial;
  markers: THREE.Group;
  targets: THREE.Mesh[];
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
  callbackRef.current = onSelect;
  selectedRef.current = selected;
  unavailableRef.current = onUnavailable;

  const reset = useCallback(() => {
    const state = sceneRef.current;
    if (!state) return;
    state.targetSpin = nearestAngle(state.earth.rotation.y, Math.PI - START_LONGITUDE * RAD);
    state.targetTilt = 0.19;
    state.lastInteraction = Date.now();
  }, []);

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
      earth.rotation.y = Math.PI - START_LONGITUDE * RAD;

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

      const haloGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.095, 64, 48);
      const haloMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vPosition = mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            float intensity = pow(1.0 - max(0.0, dot(normalize(vNormal), normalize(-vPosition))), 2.8);
            gl_FragColor = vec4(0.18, 0.71, 1.0, intensity * 0.53);
          }
        `,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.BackSide,
      });
      tilt.add(new THREE.Mesh(haloGeometry, haloMaterial));

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
        renderer, scene, camera, tilt, earth, earthGeometry, earthMaterial, haloGeometry, haloMaterial,
        markers, targets: [], targetSpin: earth.rotation.y, targetTilt: tilt.rotation.x,
        lastInteraction: Date.now(), frame: 0, resize,
      };
      sceneRef.current = state;

      const animate = () => {
        if (cancelled || !state) return;
        const smoothness = prefersReducedMotion ? 1 : 0.09;
        state.earth.rotation.y += (state.targetSpin - state.earth.rotation.y) * smoothness;
        state.tilt.rotation.x += (state.targetTilt - state.tilt.rotation.x) * smoothness;
        // Gentle ambient motion, disabled entirely for reduced-motion users.
        if (!prefersReducedMotion && !state.dragStart && !selectedRef.current &&
          Date.now() - state.lastInteraction > 7000) {
          state.targetSpin += 0.00048;
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
      for (const item of state.targets) {
        item.geometry.dispose();
        (item.material as THREE.Material).dispose();
      }
      state.texture?.dispose();
      state.earthGeometry.dispose();
      state.earthMaterial.dispose();
      state.haloGeometry.dispose();
      state.haloMaterial.dispose();
      state.renderer.dispose();
      state.renderer.forceContextLoss();
      sceneRef.current = null;
    };
    // Initialize GPU resources once; subsequent prop updates adjust scene targets.
  }, []);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    for (const target of state.targets) {
      state.markers.remove(target);
      target.geometry.dispose();
      (target.material as THREE.Material).dispose();
    }
    state.targets = locations.map(location => {
      const active = selected === location.id;
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(active ? .065 : .042, 12, 10),
        new THREE.MeshBasicMaterial({ color: active ? 0xffcf78 : 0x73fff3, toneMapped: false })
      );
      dot.position.copy(toGlobeVector(location.lat, location.lon, GLOBE_RADIUS + .026));
      dot.userData = { id: location.id, label: location.name, count: location.count };
      state.markers.add(dot);
      return dot;
    });
  }, [locations, selected, ready]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state || !selected) return;
    const marker = locations.find(location => location.id === selected);
    if (!marker) return;
    state.targetSpin = nearestAngle(state.earth.rotation.y, Math.PI - marker.lon * RAD);
    state.targetTilt = THREE.MathUtils.clamp(marker.lat * RAD, -0.95, 0.95);
    state.lastInteraction = Date.now();
  }, [selected, locations, ready]);

  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const state = sceneRef.current;
    if (!state) return;
    state.dragStart = { x: event.clientX, y: event.clientY, tilt: state.targetTilt, spin: state.targetSpin };
    state.lastInteraction = Date.now();
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const state = sceneRef.current;
    if (!state) return;
    const drag = state.dragStart;
    if (!drag) return;
    state.targetSpin = drag.spin + (event.clientX - drag.x) * .008;
    state.targetTilt = THREE.MathUtils.clamp(drag.tilt + (event.clientY - drag.y) * .004, -1.1, 1.1);
    state.lastInteraction = Date.now();
  };
  const pointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const state = sceneRef.current;
    if (!state) return;
    const drag = state.dragStart;
    state.dragStart = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!drag || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, state.camera);
    state.scene.updateMatrixWorld(true);
    const hits = raycaster.intersectObjects(state.targets, false);
    // Only accept a pin on the visible hemisphere; reject back-of-Earth hits.
    const hit = hits.find(result => {
      const position = new THREE.Vector3();
      result.object.getWorldPosition(position);
      return position.z > 0.2;
    });
    if (hit) {
      const id = hit.object.userData.id as string;
      callbackRef.current(selected === id ? "" : id);
      setHoverLabel(null);
    }
  };

  return (
    <div ref={hostRef} className="vigil-dashboard-globe-scene vigil-dashboard-three-scene">
      <canvas
        ref={canvasRef} className="vigil-dashboard-globe-three"
        aria-hidden="true"
        style={{ opacity: ready ? 1 : 0 }}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
        onPointerCancel={() => { if (sceneRef.current) sceneRef.current.dragStart = undefined; }}
        onPointerLeave={() => setHoverLabel(null)}
        onContextMenu={event => event.preventDefault()}
      />
      {!ready && <div className="vigil-dashboard-three-loading" role="status">Loading satellite view…</div>}
      <div className="vigil-dashboard-globe-hint"><Compass size={13} aria-hidden="true" /> Drag to rotate · select countries below</div>
      <button type="button" className="vigil-dashboard-reset-rotation" onClick={reset} aria-label="Reset 3D Earth rotation" title="Reset globe rotation"><RotateCcw size={15} /></button>
      {hoverLabel && <span className="vigil-dashboard-globe-tooltip">{hoverLabel}</span>}
      <span className="vigil-dashboard-globe-credit">Satellite texture: NASA Blue Marble</span>
    </div>
  );
}

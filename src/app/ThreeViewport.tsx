"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function ThreeViewport() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);
    
    const camera = new THREE.PerspectiveCamera(
      60,
      host.clientWidth / host.clientHeight,
      0.1,
      1000
    );
    camera.position.set(3, 2, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = false;
    controls.target.set(0, 0, 0);
    controls.update();

    const grid = new THREE.GridHelper(10, 10);
    scene.add(grid);
    const axes = new THREE.AxesHelper(2);
    scene.add(axes);

    const sphereGeometry = new THREE.SphereGeometry(1.5, 48, 48);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.set(0, 0, 0);
    scene.add(sphereMesh);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(3, 5, 2);
    scene.add(dir)

    const nodeGeometry = new THREE.SphereGeometry(0.2, 24, 24);
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeMaterials: THREE.MeshStandardMaterial[] = [];
    const nodeById = new Map<string, THREE.Mesh>();

    const nodes = [
      {id: "center", pos: [0, 0, 0] as const, color: 0xff4455 },
      { id: "n1",     pos: [1.2, 0.2, 0.0] as const, color: 0x44ffaa },
      { id: "n2",     pos: [-0.9, 0.6, 0.8] as const, color: 0x66a3ff },
      { id: "n3",     pos: [0.3, -0.7, -1.1] as const, color: 0xffcc66 },
    ]

    for (const n of nodes) {
      const mat = new THREE.MeshStandardMaterial({ color: n.color });
      const mesh = new THREE.Mesh(nodeGeometry, mat);
      mesh.position.set(n.pos[0], n.pos[1], n.pos[2]);
      mesh.userData = { id: n.id };
      scene.add(mesh);
      nodeMeshes.push(mesh);
      nodeMaterials.push(mat);
      nodeById.set(n.id, mesh);
    }

    const edges = [
      { from: "center", to: "n1" },
      { from: "center", to: "n2" },
      { from: "center", to: "n3" },
      { from: "n2", to: "n3" },
    ] as const;

    const edgePositions = new Float32Array(edges.length * 2 * 3);
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const a = nodeById.get(e.from);
      const b = nodeById.get(e.to);
      if (!a || !b) continue;

      const base = i * 6;
      edgePositions[base + 0] = a.position.x;
      edgePositions[base + 1] = a.position.y;
      edgePositions[base + 2] = a.position.z;
      edgePositions[base + 3] = b.position.x;
      edgePositions[base + 4] = b.position.y;
      edgePositions[base + 5] = b.position.z;
    }

    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(edgePositions, 3)
    );

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x8aa0b8,
      transparent: true,
      opacity: 0.65
    });

    const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    scene.add(edgeLines);

    let rafId = 0
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(rafId);

      controls.dispose();

      const disposeMaterial = (mat: THREE.Material | THREE.Material[]) => {
        if (Array.isArray(mat)) {
          for (const m of mat) m.dispose();
	} else {
	  mat.dispose();
	}
      };

      scene.remove(edgeLines);
      edgeGeometry.dispose();
      edgeMaterial.dispose();

      scene.remove(sphereMesh);
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      
      for (const mesh of nodeMeshes) {
	scene.remove(mesh);
      }
      for (const mat of nodeMaterials) {
	mat.dispose();
      }
      nodeGeometry.dispose();

      scene.remove(grid);
      grid.geometry.dispose();

      disposeMaterial(grid.material);
      
      scene.remove(ambient);
      scene.remove(dir);
      
      if (renderer.domElement.parentElement === host) {
	host.removeChild(renderer.domElement);
      }

      renderer.dispose();

      scene.remove(axes);
      axes.geometry.dispose();
      
      disposeMaterial(axes.material);
    };
  }, []);

  return <div ref={hostRef} className="h-[70vh] w-full rounded-xl overflow-hidden" />;
}

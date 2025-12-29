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

    const axes = new THREE.AxesHelper(2);
    scene.add(axes);

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

      if (renderer.domElement.parentElement === host) {
	host.removeChild(renderer.domElement);
      }

      renderer.dispose();

      axes.geometry.dispose();
      (axes.material as THREE.Material).dispose();
    };
  }, []);

  return <div ref={hostRef} className="h-[70vh] w-full rounded-xl overflow-hidden" />;
}

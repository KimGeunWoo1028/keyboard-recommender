"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, Center, OrbitControls, useGLTF } from "@react-three/drei";

const MODEL_PATH = "/brand/hero-keyboard.glb";

function CanvasHealthMonitor({ onContextLost }: { onContextLost: () => void }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    return () => canvas.removeEventListener("webglcontextlost", handleContextLost);
  }, [gl, onContextLost]);

  return null;
}

function KeyboardModel({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(MODEL_PATH);
  const hasSignalled = useRef(false);

  // Signal after the first painted frame so the placeholder never uncovers an empty canvas.
  useFrame(() => {
    if (hasSignalled.current) return;
    hasSignalled.current = true;
    onReady();
  });

  return (
    <Bounds fit clip observe margin={0.82}>
      <Center>
        <primitive object={scene} rotation={[-0.16, -0.42, 0.04]} />
      </Center>
    </Bounds>
  );
}

type HomeHeroKeyboardCanvasProps = {
  onReady: () => void;
  onContextLost: () => void;
};

export function HomeHeroKeyboardCanvas({ onReady, onContextLost }: HomeHeroKeyboardCanvasProps) {
  return (
    <Canvas
      camera={{ fov: 28, position: [3.8, 2.7, 4.9] }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    >
      <CanvasHealthMonitor onContextLost={onContextLost} />
      <ambientLight intensity={0.65} />
      <directionalLight color="#ffffff" intensity={1.4} position={[3, 5, 4]} />
      <pointLight color="#9b6bff" intensity={6} position={[-2.3, 0.35, 0]} />
      <pointLight color="#b794ff" intensity={5} position={[0, 0.35, 0]} />
      <pointLight color="#805bff" intensity={6} position={[2.3, 0.35, 0]} />

      <KeyboardModel onReady={onReady} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.78}
        rotateSpeed={0.65}
      />
    </Canvas>
  );
}

"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Center,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

const MODEL_PATH = "/brand/hero-keyboard.glb";

function KeyboardModel({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(MODEL_PATH);

  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <Bounds fit clip observe margin={0.82}>
      <Center>
        <primitive object={scene} rotation={[-0.16, -0.42, 0.04]} />
      </Center>
    </Bounds>
  );
}

export function HomeHeroKeyboardCanvas({ onReady }: { onReady: () => void }) {
  return (
    <Canvas
      camera={{ fov: 28, position: [3.8, 2.7, 4.9] }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={1.15} />
      <directionalLight color="#ffffff" intensity={2.4} position={[3, 5, 4]} />
      <pointLight color="#9b6bff" intensity={18} position={[-2.3, 0.35, 0]} />
      <pointLight color="#b794ff" intensity={16} position={[0, 0.35, 0]} />
      <pointLight color="#805bff" intensity={18} position={[2.3, 0.35, 0]} />

      <KeyboardModel onReady={onReady} />
      <Environment preset="studio" environmentIntensity={0.65} />
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

useGLTF.preload(MODEL_PATH);

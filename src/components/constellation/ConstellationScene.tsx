'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { MemoryNode, CATEGORY_COLORS, deriveConnections, distributeOnSphere } from '@/lib/nodes';

// Individual node mesh
function NodeMesh({
  node,
  position,
  isActive,
  isRelated,
  onSelect,
}: {
  node: MemoryNode;
  position: [number, number, number];
  isActive: boolean;
  isRelated: boolean;
  onSelect: (node: MemoryNode) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = CATEGORY_COLORS[node.category] ?? '#c9a96e';

  useFrame((state) => {
    if (!meshRef.current) return;
    // Gentle float
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.05;
    // Scale pulse on active
    const targetScale = isActive ? 1.8 : isRelated ? 1.3 : 1.0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onSelect(node); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isActive ? 1.2 : isRelated ? 0.6 : 0.3}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

// Connection threads between related nodes
function Connections({
  nodes,
  positions,
  connections,
  activeId,
}: {
  nodes: MemoryNode[];
  positions: [number, number, number][];
  connections: Map<string, string[]>;
  activeId: string | null;
}) {
  const lines = useMemo(() => {
    if (!activeId) return [];
    const related = connections.get(activeId) ?? [];
    const activeIdx = nodes.findIndex(n => n.id === activeId);
    if (activeIdx === -1) return [];

    return related.map(relId => {
      const relIdx = nodes.findIndex(n => n.id === relId);
      if (relIdx === -1) return null;
      return { from: positions[activeIdx], to: positions[relIdx] };
    }).filter(Boolean);
  }, [activeId, connections, nodes, positions]);

  return (
    <>
      {lines.map((line, i) => {
        if (!line) return null;
        const points = [
          new THREE.Vector3(...line.from),
          new THREE.Vector3(...line.to),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <primitive key={i} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#c9a96e", opacity: 0.4, transparent: true }))} />
        );
      })}
    </>
  );
}

// Auto-rotate when idle
function AutoRotate() {
  const { scene } = useThree();
  useFrame((state) => {
    state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.05) * 10;
    state.camera.position.z = Math.cos(state.clock.elapsedTime * 0.05) * 10;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

interface ConstellationSceneProps {
  nodes: MemoryNode[];
  onNodeSelect: (node: MemoryNode | null) => void;
  activeNodeId: string | null;
}

export default function ConstellationScene({ nodes, onNodeSelect, activeNodeId }: ConstellationSceneProps) {
  const positions = useMemo(() => distributeOnSphere(nodes.length, 4), [nodes.length]);
  const connections = useMemo(() => deriveConnections(nodes), [nodes]);

  const relatedIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    return new Set(connections.get(activeNodeId) ?? []);
  }, [activeNodeId, connections]);

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 60 }}
      style={{ background: 'transparent' }}
      onPointerMissed={() => onNodeSelect(null)}
    >
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#c9a96e" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#7eb8c9" />

      {/* Subtle background sphere hint */}
      <Sphere args={[4, 32, 32]}>
        <meshBasicMaterial color="#1e1e22" transparent opacity={0.05} wireframe />
      </Sphere>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <NodeMesh
          key={node.id}
          node={node}
          position={positions[i]}
          isActive={node.id === activeNodeId}
          isRelated={relatedIds.has(node.id)}
          onSelect={onNodeSelect}
        />
      ))}

      {/* Connections */}
      <Connections
        nodes={nodes}
        positions={positions}
        connections={connections}
        activeId={activeNodeId}
      />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={6}
        maxDistance={18}
        autoRotate={!activeNodeId}
        autoRotateSpeed={0.4}
        dampingFactor={0.05}
        enableDamping
      />
    </Canvas>
  );
}

/**
 * Floating background particles for visual ambiance.
 * Pure CSS animation — no JS animation loop needed.
 */

const PARTICLE_COUNT = 15;

/** Pre-generate particle configs for deterministic layout */
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  left: `${(i * 7 + 3) % 100}%`,
  size: 2 + (i % 3),
  duration: 15 + (i % 6) * 3, // 15s - 30s
  delay: -(i * 2), // stagger so they don't all start at bottom
  opacity: 0.1 + (i % 3) * 0.05,
}));

export function BackgroundParticles() {
  return (
    <div className="tc-bg-particles" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="tc-bg-particle"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

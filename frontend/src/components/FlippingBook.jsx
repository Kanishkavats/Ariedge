/**
 * FlippingBook — a decorative 3D book whose pages continuously flip.
 * Purely visual (no data), used as a hero centerpiece.
 */
import { motion } from 'framer-motion';

const PAGE_COLORS = ['#eef2ff', '#e0e7ff', '#c7d2fe'];

function Page({ index, delay }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-r-md"
      style={{
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        background: `linear-gradient(120deg, #ffffff, ${PAGE_COLORS[index % PAGE_COLORS.length]})`,
        boxShadow: '2px 0 6px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        zIndex: 10 - index,
      }}
      animate={{ rotateY: [0, -170, -170, 0] }}
      transition={{
        duration: 3.2,
        times: [0, 0.45, 0.55, 1],
        repeat: Infinity,
        repeatDelay: 1.4,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function FlippingBook({ scale = 1 }) {
  return (
    <div
      className="relative"
      style={{ width: 120 * scale, height: 160 * scale, perspective: 900 }}
    >
      {/* Back cover */}
      <div
        className="absolute inset-0 rounded-r-md rounded-l-sm"
        style={{
          background: 'linear-gradient(135deg, #4338ca, #6366f1)',
          boxShadow: '6px 8px 24px rgba(79,70,229,0.35)',
        }}
      />
      {/* Spine */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-l-sm"
        style={{ width: 10 * scale, background: 'linear-gradient(180deg,#3730a3,#4f46e5)' }}
      />
      {/* Animated flipping pages */}
      <Page index={0} delay={0} />
      <Page index={1} delay={0.15} />
      <Page index={2} delay={0.3} />
      {/* Front cover accent lines (static, under pages so it reads as "open book") */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}

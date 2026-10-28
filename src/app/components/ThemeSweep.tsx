import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, type BezierDefinition } from 'motion/react';

interface ThemeSweepProps {
  /** Centro del botón de tema en coordenadas de viewport: desde ahí nace la forma. */
  origin: { x: number; y: number };
  /** Fondo del tema que entra: la forma lo usa para cubrir la pantalla. */
  color: string;
  /** Se llama cuando la forma cubre toda la pantalla (aquí se cambia el tema). */
  onCovered: () => Promise<void> | void;
  /** Se llama cuando la forma ya se desvaneció y se puede desmontar. */
  onDone: () => void;
}

/** Easing suave y natural: arranque rápido, frenada suave. */
const SMOOTH_EASE: BezierDefinition = [0.25, 0.1, 0.25, 1.0];

/** Easing de entrada: la masa brota con energía y se asienta. */
const BURST_EASE: BezierDefinition = [0.16, 1, 0.3, 1];

/**
 * Barrido de tema: una masa suave y orgánica brota desde el botón sol/luna,
 * se expande cubriendo la pantalla con un efecto de onda, se cambia el tema
 * debajo y finalmente se retrae y desvanece dejando el nuevo tema a la vista.
 * Se monta en un portal para que el `fixed` no dependa de ancestros animados.
 */
export function ThemeSweep({ origin, color, onCovered, onDone }: ThemeSweepProps) {
  const [phase, setPhase] = useState<'cover' | 'reveal'>('cover');

  // Diagonal más larga desde el botón: asegura cobertura total.
  const reach = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Onda expansiva secundaria (ripple) — más lenta y sutil. */}
      <motion.span
        className="absolute block"
        style={{
          width: `${reach * 2.2}px`,
          height: `${reach * 2.2}px`,
          left: origin.x,
          top: origin.y,
          marginLeft: `-${reach * 1.1}px`,
          marginTop: `-${reach * 1.1}px`,
          background: color,
          borderRadius: '50%',
          willChange: 'transform, opacity',
          opacity: 0.35,
        }}
        initial={{ scale: 0, opacity: 0.35 }}
        animate={phase === 'cover'
          ? { scale: 1, opacity: 0.15 }
          : { scale: 1.1, opacity: 0 }}
        transition={phase === 'cover'
          ? { duration: 0.7, ease: SMOOTH_EASE }
          : { duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      />
      {/* Masa principal: borde orgánico que brota y cubre la pantalla. */}
      <motion.span
        className="absolute block"
        style={{
          width: `${reach * 2.4}px`,
          height: `${reach * 2.4}px`,
          left: origin.x,
          top: origin.y,
          marginLeft: `-${reach * 1.2}px`,
          marginTop: `-${reach * 1.2}px`,
          background: color,
          willChange: 'transform, opacity',
        }}
        initial={{ scale: 0, opacity: 1, borderRadius: '46% 54% 48% 52% / 52% 48% 54% 46%' }}
        animate={phase === 'cover'
          ? { scale: 1, opacity: 1, borderRadius: '52% 48% 54% 46% / 48% 52% 46% 54%' }
          : { scale: 0.85, opacity: 0, borderRadius: '50% 50% 50% 50% / 50% 50% 50% 50%' }}
        transition={phase === 'cover'
          ? { duration: 0.65, ease: BURST_EASE }
          : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        onAnimationComplete={() => {
          if (phase === 'cover') {
            void Promise.resolve(onCovered()).then(() => setPhase('reveal'));
            return;
          }
          onDone();
        }}
      />
    </div>,
    document.body,
  );
}
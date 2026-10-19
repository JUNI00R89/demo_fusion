import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

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

/**
 * Barrido de tema: una forma orgánica (borde irregular, no un círculo perfecto)
 * crece desde el botón sol/luna, cubre la pantalla, se cambia el tema debajo y
 * finalmente se desvanece dejando el nuevo tema a la vista.
 * Se monta en un portal para que el `fixed` no dependa de ancestros animados.
 */
export function ThemeSweep({ origin, color, onCovered, onDone }: ThemeSweepProps) {
  const [phase, setPhase] = useState<'cover' | 'reveal'>('cover');

  return createPortal(
    <div aria-hidden="true" className="fixed inset-0 z-[9999] overflow-hidden">
      <motion.span
        className="absolute block"
        style={{
          width: '320vmax',
          height: '320vmax',
          left: origin.x,
          top: origin.y,
          marginLeft: '-160vmax',
          marginTop: '-160vmax',
          background: color,
          borderRadius: '47% 53% 43% 57% / 51% 47% 53% 49%',
          willChange: 'transform, opacity',
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 1, opacity: phase === 'cover' ? 1 : 0 }}
        transition={phase === 'cover'
          ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
          : { duration: 0.35, ease: 'easeOut' }}
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

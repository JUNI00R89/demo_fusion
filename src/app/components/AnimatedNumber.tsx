import { AnimatedCounter } from './motion/AnimatedCounter';

interface AnimatedNumberProps {
  /** Valor final del contador. */
  value: number;
  /** Decimales a mostrar mientras cuenta (el formato puede aportarlos igualmente). */
  decimals?: number;
  /** Formatea el valor en curso (por ejemplo el helper money() de cada página). */
  format?: (value: number) => string;
  /** Duración de la cuenta en milisegundos. */
  duration?: number;
  className?: string;
}

/**
 * Compatibilidad: mantiene la API anterior (duración en milisegundos y decimales)
 * sobre el contador compartido <AnimatedCounter>. El código nuevo debería usar
 * AnimatedCounter directamente.
 */
export function AnimatedNumber({ value, decimals = 0, format, duration = 900, className }: AnimatedNumberProps) {
  const formatter =
    format ??
    ((current: number) =>
      current.toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));

  return <AnimatedCounter value={value} format={formatter} duration={duration / 1000} className={className} />;
}

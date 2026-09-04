import { useMemo, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * Builds a closed, smooth blob from a ring of radii. Midpoints act as the
 * on-curve anchors so neighbouring segments always meet cleanly.
 */
function blobPath(radii: number[], cx = 500, cy = 500) {
  const count = radii.length;
  const point = (index: number) => {
    const angle = ((index % count) / count) * Math.PI * 2;

    return [cx + Math.cos(angle) * radii[index % count], cy + Math.sin(angle) * radii[index % count]];
  };
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  const start = mid(point(count - 1), point(0));
  let path = `M ${start[0].toFixed(1)} ${start[1].toFixed(1)}`;

  for (let index = 0; index < count; index += 1) {
    const control = point(index);
    const end = mid(point(index), point(index + 1));

    path += ` Q ${control[0].toFixed(1)} ${control[1].toFixed(1)} ${end[0].toFixed(1)} ${end[1].toFixed(1)}`;
  }

  return `${path} Z`;
}

/** Deterministic wobble so a given seed always draws the same blob. */
function radiiFor(seed: number, ring: number) {
  const base = 250 + ring * 105;

  return Array.from({ length: 8 }, (_, index) => {
    const wobble = Math.sin(seed * 2.7 + ring * 1.3 + index * 1.9) * 62;

    return base + wobble;
  });
}

interface BlobFieldProps {
  className?: string;
  /** Changes the shape of the whole field. */
  seed?: number;
  rings?: number;
  /** Thinner strokes for smaller panels. */
  small?: boolean;
}

/**
 * The breathing outlines behind each candy section: stroke weight swells and
 * recedes on a long sine, and stops entirely once the section leaves view.
 */
export function BlobField({ className, seed = 1, rings = 3, small = false }: BlobFieldProps) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { amount: 0 });
  const prefersReducedMotion = useReducedMotion();

  const paths = useMemo(
    () => Array.from({ length: rings }, (_, ring) => blobPath(radiiFor(seed, ring))),
    [rings, seed],
  );

  const peak = small ? 34 : 58;

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    >
      {paths.map((path, index) => (
        <motion.path
          key={path}
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={prefersReducedMotion ? peak * 0.45 : 0}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          animate={
            prefersReducedMotion || !inView
              ? undefined
              : { strokeWidth: [0, peak - index * 8, 0], rotate: [0, 2, 0] }
          }
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.6,
          }}
        />
      ))}
    </svg>
  );
}

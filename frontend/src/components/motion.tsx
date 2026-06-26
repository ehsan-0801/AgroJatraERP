import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from 'motion/react';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ *
 * Shared easing + transition presets
 * ------------------------------------------------------------------ */

/** A crisp "settle" ease used across the app (matches the CSS reveal curve). */
export const EASE = [0.16, 1, 0.3, 1] as const;

export const transitions = {
  soft: { duration: 0.5, ease: EASE },
  snappy: { duration: 0.35, ease: EASE },
  spring: { type: 'spring', stiffness: 380, damping: 30 } as const,
};

/* ------------------------------------------------------------------ *
 * Reusable variants
 * ------------------------------------------------------------------ */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: transitions.soft },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: transitions.soft },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: transitions.snappy },
};

/** Container that staggers its children's entrance. */
export const staggerContainer = (stagger = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/* ------------------------------------------------------------------ *
 * Page transition — wrap routed content so every navigation animates
 * ------------------------------------------------------------------ */

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={transitions.snappy}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * Stagger — animate a list/grid of items in sequence
 * ------------------------------------------------------------------ */

export function Stagger({
  children,
  className,
  stagger = 0.06,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  variants = fadeUp,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}) {
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * FadeIn — Framer-powered scroll reveal (complements the CSS <Reveal/>)
 * ------------------------------------------------------------------ */

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 24,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '0px 0px -40px 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ ...transitions.soft, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * MotionCard — your <Card/> with an entrance + subtle hover lift
 * ------------------------------------------------------------------ */

const MCard = motion.create(Card);

export function MotionCard({
  children,
  className,
  hover = true,
  ...rest
}: React.ComponentProps<typeof MCard> & { hover?: boolean }) {
  return (
    <MCard
      className={cn(hover && 'transition-shadow hover:shadow-md', className)}
      variants={fadeUp}
      whileHover={hover ? { y: -4 } : undefined}
      transition={transitions.spring}
      {...rest}
    >
      {children}
    </MCard>
  );
}

/* ------------------------------------------------------------------ *
 * AnimatedNumber — springs to its value when scrolled into view
 * ------------------------------------------------------------------ */

export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '0px 0px -20px 0px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20 });
  const [display, setDisplay] = React.useState(() => format(0));

  React.useEffect(() => {
    if (reduce) {
      setDisplay(format(value));
      return;
    }
    if (inView) mv.set(value);
  }, [inView, value, reduce, mv, format]);

  React.useEffect(() => spring.on('change', (v) => setDisplay(format(v))), [spring, format]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

export { AnimatePresence, motion };

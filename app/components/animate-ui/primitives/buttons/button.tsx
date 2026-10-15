'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

import { Slot, type WithAsChild } from '@/components/animate-ui/primitives/animate/slot';

type ButtonProps = WithAsChild<
  HTMLMotionProps<'button'> & {
    hoverScale?: number;
    tapScale?: number;
  }
>;

function Button({
  hoverScale = 1.05,
  tapScale = 0.95,
  asChild = false,
  ...props
}: ButtonProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const motionProps = mounted
    ? {
        whileTap: { scale: tapScale },
        whileHover: { scale: hoverScale },
      }
    : {};

  if (asChild) {
    return (
      <Slot
        {...motionProps}
        {...(props as any)}
      />
    );
  }

  return (
    <motion.button
      {...motionProps}
      {...(props as any)}
    />
  );
}

export { Button, type ButtonProps };

import * as React from "react"
import { motion, useInView, useAnimation } from "motion/react"
import { cn } from "@/lib/utils"

export interface TypingTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  speed?: number
}

export function TypingText({ text, speed = 50, className, ...props }: TypingTextProps) {
  const controls = useAnimation()
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true })

  React.useEffect(() => {
    if (isInView) {
      controls.start((i) => ({
        opacity: 1,
        transition: { delay: i * (speed / 1000) },
      }))
    }
  }, [isInView, controls, speed])

  return (
    <div ref={ref} className={cn("inline-block", className)} {...props}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          custom={i}
          animate={controls}
          initial={{ opacity: 0 }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  )
}

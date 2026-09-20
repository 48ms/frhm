"use client"

import * as React from "react"
import { motion, useSpring, useTransform, useMotionValue } from "motion/react"
import { cn } from "cn"

type SlidingNumberRollerProps = {
  prevValue: number
  value: number
  place: number
  transition: { stiffness: number; damping: number; mass?: number }
  delay?: number
}

function SlidingNumberRoller({
  prevValue,
  value,
  place,
  transition,
  delay = 0,
}: SlidingNumberRollerProps) {
  const startNumber = Math.floor(prevValue / place) % 10
  const targetNumber = Math.floor(value / place) % 10
  const animatedValue = useSpring(startNumber, transition)

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      animatedValue.set(targetNumber)
    }, delay)
    return () => clearTimeout(timeoutId)
  }, [targetNumber, animatedValue, delay])

  return (
    <span
      data-slot="sliding-number-roller"
      style={{
        position: "relative",
        display: "inline-block",
        width: "1ch",
        overflowX: "visible",
        overflowY: "clip",
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span style={{ visibility: "hidden" }}>0</span>
      {Array.from({ length: 10 }, (_, i) => (
        <SlidingNumberDisplay
          key={i}
          motionValue={animatedValue as ReturnType<typeof useMotionValue<number>>}
          number={i}
          transition={transition}
        />
      ))}
    </span>
  )
}

type SlidingNumberDisplayProps = {
  motionValue: ReturnType<typeof useMotionValue<number>>
  number: number
  transition: { stiffness: number; damping: number; mass?: number }
}

function SlidingNumberDisplay({
  motionValue,
  number,
  transition,
}: SlidingNumberDisplayProps) {
  const y = useTransform(motionValue, (latest: number) => {
    const currentNumber = latest % 10
    const offset = (10 + number - currentNumber) % 10
    let translateY = offset * 1.25
    if (offset > 5) translateY -= 10 * 1.25
    return translateY
  })

  return (
    <motion.span
      data-slot="sliding-number-display"
      style={{
        y,
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      transition={{ ...transition, type: "spring" }}
    >
      {number}
    </motion.span>
  )
}

type SlidingNumberProps = React.ComponentPropsWithoutRef<"span"> & {
  number: number
  fromNumber?: number
  onNumberChange?: (number: number) => void
  padStart?: boolean
  decimalSeparator?: string
  decimalPlaces?: number
  thousandSeparator?: string
  transition?: { stiffness: number; damping: number; mass?: number }
  delay?: number
  initiallyStable?: boolean
}

export const SlidingNumber = React.forwardRef<HTMLSpanElement, SlidingNumberProps>(
  (
    {
      number,
      fromNumber,
      onNumberChange,
      padStart = false,
      decimalSeparator = ".",
      decimalPlaces = 0,
      thousandSeparator,
      transition = { stiffness: 200, damping: 20, mass: 0.4 },
      delay = 0,
      initiallyStable = false,
      className,
      ...props
    },
    ref
  ) => {
    const localRef = React.useRef<HTMLSpanElement>(null)
    // forward ref via assignment after render
    React.useImperativeHandle(ref, () => localRef.current as HTMLSpanElement, [])

    const [isInView, setIsInView] = React.useState(false)
    React.useEffect(() => {
      if (!localRef.current) return
      const observer = new IntersectionObserver(
        ([entry]) => setIsInView(entry.isIntersecting),
        { rootMargin: "0px" }
      )
      observer.observe(localRef.current)
      return () => observer.disconnect()
    }, [])

    const initialNumeric = Math.abs(Number(number))
    const prevNumberRef = React.useRef<number>(
      initiallyStable ? initialNumeric : 0
    )

    const hasAnimated = fromNumber !== undefined

    const motionVal = useMotionValue(
      initiallyStable ? initialNumeric : fromNumber ?? 0
    )
    const springVal = useSpring(motionVal, { stiffness: 90, damping: 50 })

    const skippedInitialWhenStable = React.useRef(false)

    React.useEffect(() => {
      if (!hasAnimated) return
      if (initiallyStable && !skippedInitialWhenStable.current) {
        skippedInitialWhenStable.current = true
        return
      }
      const timeoutId = setTimeout(() => {
        if (isInView || initiallyStable) motionVal.set(number)
      }, delay)
      return () => clearTimeout(timeoutId)
    }, [hasAnimated, initiallyStable, isInView, number, motionVal, delay])

    const [effectiveNumber, setEffectiveNumber] = React.useState<number>(
      initiallyStable ? initialNumeric : 0
    )

    React.useEffect(() => {
      if (hasAnimated) {
        const inferredDecimals =
          typeof decimalPlaces === "number" && decimalPlaces >= 0
            ? decimalPlaces
            : (() => {
                const s = String(number)
                const idx = s.indexOf(".")
                return idx >= 0 ? s.length - idx - 1 : 0
              })()

        const factor = Math.pow(10, inferredDecimals)

        const unsubscribe = springVal.on("change", (latest: number) => {
          const newValue =
            inferredDecimals > 0
              ? Math.round(latest * factor) / factor
              : Math.round(latest)

          if (effectiveNumber !== newValue) {
            setEffectiveNumber(newValue)
            onNumberChange?.(newValue)
          }
        })
        return () => unsubscribe()
      } else {
        setEffectiveNumber(
          initiallyStable ? initialNumeric : !isInView ? 0 : initialNumeric
        )
      }
    }, [
      hasAnimated,
      springVal,
      isInView,
      number,
      decimalPlaces,
      onNumberChange,
      effectiveNumber,
      initiallyStable,
      initialNumeric,
    ])

    const formatNumber = React.useCallback(
      (num: number) =>
        decimalPlaces != null ? num.toFixed(decimalPlaces) : num.toString(),
      [decimalPlaces]
    )

    const numberStr = formatNumber(effectiveNumber)
    const [newIntStrRaw, newDecStrRaw = ""] = numberStr.split(".")

    const finalIntLength = padStart
      ? Math.max(
          Math.floor(Math.abs(number)).toString().length,
          newIntStrRaw.length
        )
      : newIntStrRaw.length

    const newIntStr = padStart
      ? newIntStrRaw.padStart(finalIntLength, "0")
      : newIntStrRaw

    const prevFormatted = formatNumber(prevNumberRef.current)
    const [prevIntStrRaw = "", prevDecStrRaw = ""] = prevFormatted.split(".")
    const prevIntStr = padStart
      ? prevIntStrRaw.padStart(finalIntLength, "0")
      : prevIntStrRaw

    const adjustedPrevInt = React.useMemo(() => {
      return prevIntStr.length > finalIntLength
        ? prevIntStr.slice(-finalIntLength)
        : prevIntStr.padStart(finalIntLength, "0")
    }, [prevIntStr, finalIntLength])

    const adjustedPrevDec = React.useMemo(() => {
      if (!newDecStrRaw) return ""
      return prevDecStrRaw.length > newDecStrRaw.length
        ? prevDecStrRaw.slice(0, newDecStrRaw.length)
        : prevDecStrRaw.padEnd(newDecStrRaw.length, "0")
    }, [prevDecStrRaw, newDecStrRaw])

    React.useEffect(() => {
      if (isInView || initiallyStable) {
        prevNumberRef.current = effectiveNumber
      }
    }, [effectiveNumber, isInView, initiallyStable])

    const intPlaces = React.useMemo(
      () =>
        Array.from({ length: finalIntLength }, (_, i) =>
          Math.pow(10, finalIntLength - i - 1)
        ),
      [finalIntLength]
    )
    const decPlaces = React.useMemo(
      () =>
        newDecStrRaw
          ? Array.from({ length: newDecStrRaw.length }, (_, i) =>
              Math.pow(10, newDecStrRaw.length - i - 1)
            )
          : [],
      [newDecStrRaw]
    )

    const newDecValue = newDecStrRaw ? parseInt(newDecStrRaw, 10) : 0
    const prevDecValue = adjustedPrevDec ? parseInt(adjustedPrevDec, 10) : 0

    return (
      <span
        ref={localRef}
        data-slot="sliding-number"
        style={{
          display: "inline-flex",
          alignItems: "center",
        }}
        className={cn(className)}
        {...props}
      >
        {isInView && Number(number) < 0 && (
          <span style={{ marginRight: "0.25rem" }}>-</span>
        )}

        {intPlaces.map((place, idx) => {
          const digitsToRight = intPlaces.length - idx - 1
          const isSeparatorPosition =
            typeof thousandSeparator !== "undefined" &&
            digitsToRight > 0 &&
            digitsToRight % 3 === 0

          return (
            <React.Fragment key={`int-${place}`}>
              <SlidingNumberRoller
                prevValue={parseInt(adjustedPrevInt, 10)}
                value={parseInt(newIntStr ?? "0", 10)}
                place={place}
                transition={transition}
              />
              {isSeparatorPosition && <span>{thousandSeparator}</span>}
            </React.Fragment>
          )
        })}

        {newDecStrRaw && (
          <>
            <span>{decimalSeparator}</span>
            {decPlaces.map((place) => (
              <SlidingNumberRoller
                key={`dec-${place}`}
                prevValue={prevDecValue}
                value={newDecValue}
                place={place}
                transition={transition}
                delay={delay}
              />
            ))}
          </>
        )}
      </span>
    )
  }
)

SlidingNumber.displayName = "SlidingNumber"
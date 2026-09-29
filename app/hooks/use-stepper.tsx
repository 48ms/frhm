import * as React from 'react'

export interface Step {
  id: string
  title: string
  description?: string
  isOptional?: boolean
}

export interface UseStepperOptions {
  steps: Step[]
  initialStep?: number
  onStepChange?: (step: number) => void
}

export function useStepper({
  steps,
  initialStep = 0,
  onStepChange,
}: UseStepperOptions) {
  const [currentStep, setCurrentStep] = React.useState(initialStep)

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const goToNext = React.useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < steps.length - 1) {
        const next = prev + 1
        onStepChange?.(next)
        return next
      }
      return prev
    })
  }, [steps.length, onStepChange])

  const goToPrevious = React.useCallback(() => {
    setCurrentStep((prev) => {
      if (prev > 0) {
        const next = prev - 1
        onStepChange?.(next)
        return next
      }
      return prev
    })
  }, [onStepChange])

  const goToStep = React.useCallback(
    (step: number) => {
      if (step >= 0 && step < steps.length) {
        setCurrentStep(step)
        onStepChange?.(step)
      }
    },
    [steps.length, onStepChange]
  )

  return {
    steps,
    currentStep,
    currentStepData: steps[currentStep],
    isFirstStep,
    isLastStep,
    progress: ((currentStep + 1) / steps.length) * 100,
    goToNext,
    goToPrevious,
    goToStep,
  }
}

export function StepperNav({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: Step[]
  currentStep: number
  onStepClick?: (index: number) => void
}) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between gap-2 border-b pb-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <li
              key={step.id}
              className="flex flex-1 items-center gap-2 cursor-pointer"
              onClick={() => onStepClick && index <= currentStep && onStepClick(index)}
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                    ? 'border-2 border-primary text-primary bg-background'
                    : 'border border-border text-muted-foreground bg-muted/40'
                }`}
              >
                {index + 1}
              </div>
              <div className="hidden sm:flex flex-col min-w-0">
                <span
                  className={`text-xs font-medium truncate ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-[10px] text-muted-foreground/80 truncate">
                    {step.description}
                  </span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors hidden md:block ${
                    isCompleted ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

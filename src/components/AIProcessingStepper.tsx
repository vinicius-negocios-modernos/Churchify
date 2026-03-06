import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';

export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface StepperStep {
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface AIProcessingStepperProps {
  currentStep: number;
  status: ProcessingStatus;
  className?: string;
}

const STEPS = [
  'Analisando sermao',
  'Gerando conteudo',
  'Finalizando',
];

function getSteps(currentStep: number, status: ProcessingStatus): StepperStep[] {
  return STEPS.map((label, index) => {
    let stepStatus: StepperStep['status'] = 'pending';

    if (status === 'error') {
      if (index < currentStep) stepStatus = 'completed';
      else if (index === currentStep) stepStatus = 'error';
    } else if (status === 'completed') {
      stepStatus = 'completed';
    } else if (status === 'processing') {
      if (index < currentStep) stepStatus = 'completed';
      else if (index === currentStep) stepStatus = 'active';
    }

    return { label, status: stepStatus };
  });
}

function getProgressPercentage(currentStep: number, status: ProcessingStatus): number {
  if (status === 'idle') return 0;
  if (status === 'completed') return 100;
  if (status === 'error') return Math.round(((currentStep) / STEPS.length) * 100);

  // Processing: partial progress within current step
  const stepSize = 100 / STEPS.length;
  const baseProgress = currentStep * stepSize;
  const withinStep = stepSize * 0.5; // halfway through current step
  return Math.round(Math.min(baseProgress + withinStep, 95));
}

function getStatusMessage(currentStep: number, status: ProcessingStatus): string {
  if (status === 'idle') return '';
  if (status === 'completed') return 'Processamento concluido!';
  if (status === 'error') return `Erro na etapa: ${STEPS[currentStep]}`;
  return `${STEPS[currentStep]}...`;
}

function StepIcon({ stepStatus }: { stepStatus: StepperStep['status'] }) {
  switch (stepStatus) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />;
    case 'active':
      return <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" aria-hidden="true" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />;
    default:
      return <Circle className="w-5 h-5 text-gray-300" aria-hidden="true" />;
  }
}

export const AIProcessingStepper: React.FC<AIProcessingStepperProps> = ({
  currentStep,
  status,
  className,
}) => {
  if (status === 'idle') return null;

  const steps = getSteps(currentStep, status);
  const percentage = getProgressPercentage(currentStep, status);
  const statusMessage = getStatusMessage(currentStep, status);

  return (
    <div className={cn('space-y-4', className)} data-testid="ai-processing-stepper">
      {/* aria-live region for screen readers (AC3) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      {/* Progress bar (AC2) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-gray-700">{statusMessage}</span>
          <span className="text-gray-500">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>

      {/* Step indicators (AC1) */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <StepIcon stepStatus={step.status} />
            <span
              className={cn(
                'text-sm',
                step.status === 'active' && 'text-indigo-700 font-medium',
                step.status === 'completed' && 'text-green-700',
                step.status === 'error' && 'text-red-700',
                step.status === 'pending' && 'text-gray-400',
              )}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'hidden sm:block w-8 h-px mx-2',
                  index < currentStep || status === 'completed'
                    ? 'bg-green-300'
                    : 'bg-gray-200',
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

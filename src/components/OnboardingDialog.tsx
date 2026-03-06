import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Video, PlusCircle } from 'lucide-react';

const ONBOARDING_KEY = 'onboarding_completed';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Bem-vindo ao Churchify!',
    description:
      'Transforme suas pregacoes em conteudo otimizado para Spotify, YouTube e redes sociais com o poder da Inteligencia Artificial.',
    icon: <Sparkles className="w-10 h-10 text-indigo-600" aria-hidden="true" />,
  },
  {
    title: 'Como funciona',
    description:
      'Cole o link do video do YouTube, informe o nome do pregador e o titulo da pregacao. Nossa IA analisa o conteudo e gera titulos, descricoes, tags SEO e momentos-chave automaticamente.',
    icon: <Video className="w-10 h-10 text-indigo-600" aria-hidden="true" />,
  },
  {
    title: 'Criar primeiro episodio',
    description:
      'Comece agora! Va ate "Nova Analise" no menu lateral e insira as informacoes do seu primeiro video. Em segundos, voce tera conteudo pronto para publicar.',
    icon: <PlusCircle className="w-10 h-10 text-indigo-600" aria-hidden="true" />,
  },
];

interface OnboardingDialogProps {
  forceOpen?: boolean;
}

function getInitialOpen(forceOpen?: boolean): boolean {
  if (forceOpen !== undefined) return forceOpen;
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem(ONBOARDING_KEY);
}

export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  forceOpen,
}) => {
  const [open, setOpen] = useState(() => getInitialOpen(forceOpen));
  const [currentStep, setCurrentStep] = useState(0);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOpen(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOpen(false);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) handleSkip();
    }}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="onboarding-dialog"
        aria-describedby="onboarding-description"
      >
        <DialogHeader>
          <div className="flex justify-center mb-4">{step.icon}</div>
          <DialogTitle className="text-center text-xl">
            {step.title}
          </DialogTitle>
          <DialogDescription id="onboarding-description" className="text-center pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step dots */}
        <div className="flex justify-center gap-2 py-2" aria-label={`Passo ${currentStep + 1} de ${ONBOARDING_STEPS.length}`}>
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            data-testid="onboarding-skip"
          >
            Pular tutorial
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                data-testid="onboarding-previous"
              >
                Anterior
              </Button>
            )}
            <Button
              onClick={handleNext}
              data-testid="onboarding-next"
            >
              {isLastStep ? 'Comecar' : 'Proximo'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

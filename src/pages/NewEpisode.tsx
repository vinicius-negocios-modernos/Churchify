import React, { useState, useRef, useCallback } from 'react';
import { SermonForm } from '@/components/SermonForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { AIProcessingStepper, ProcessingStatus } from '@/components/AIProcessingStepper';
import { analyzeSermonContent, generateSermonImages } from '@/services/geminiService';
import { createEpisode, updateEpisode } from '@/services/episodeService';
import { SermonInput, AnalysisResult } from '@/types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NewEpisode: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [processingStep, setProcessingStep] = useState(0);

  // Preserve last form data for retry (AC5)
  const lastFormDataRef = useRef<SermonInput | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = useCallback(async (data: SermonInput) => {
    // Save form data for retry (AC5)
    lastFormDataRef.current = data;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProcessingStatus('processing');
    setProcessingStep(0);

    let episodeId: string | null = null;

    try {
      // Create episode as draft in DB before starting AI processing
      try {
        const episode = await createEpisode({
          church_id: data.churchId ?? '',
          title: data.title,
          youtube_url: data.youtubeUrl,
          status: 'processing',
        });
        episodeId = episode.id;
      } catch (dbErr) {
        console.warn('Could not persist episode (DB may be unavailable):', dbErr);
        // Continue without persistence — graceful degradation
      }

      // Step 0: Analyzing sermon
      setProcessingStep(0);
      const analysis = await analyzeSermonContent(data);

      let finalResult = { ...analysis };

      // Step 1: Generating content
      setProcessingStep(1);

      if (data.thumbnailFile) {
        try {
          const base64Image = await fileToBase64(data.thumbnailFile);
          const mimeType = data.thumbnailFile.type;

          const images = await generateSermonImages(
            base64Image,
            mimeType,
            data.title,
            data.preacherName
          );
          finalResult.generatedImages = images;
        } catch (imgErr) {
          console.error("Error generating images:", imgErr);
          // Non-fatal error
        }
      }

      // Step 2: Finalizing — persist analysis result to DB
      setProcessingStep(2);

      if (episodeId) {
        try {
          await updateEpisode(episodeId, {
            status: 'completed',
            analysis_result: finalResult,
          });
        } catch (dbErr) {
          console.warn('Could not update episode in DB:', dbErr);
        }
      }

      setResult(finalResult);
      setProcessingStatus('completed');
    } catch (err) {
      console.error(err);

      // Mark episode as failed in DB
      if (episodeId) {
        try {
          await updateEpisode(episodeId, { status: 'failed' });
        } catch {
          // Silently fail — already in error state
        }
      }

      setError("Ocorreu um erro ao processar o conteudo. Por favor, tente novamente.");
      setProcessingStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastFormDataRef.current) {
      handleAnalyze(lastFormDataRef.current);
    }
  }, [handleAnalyze]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Analise</h1>
          <p className="text-gray-500">Gere conteudo a partir de um video do YouTube.</p>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <SermonForm onSubmit={handleAnalyze} isLoading={isLoading} />
        </div>
      </section>

      {/* Processing Stepper (AC1, AC2, AC3) */}
      {(processingStatus === 'processing' || processingStatus === 'completed') && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <AIProcessingStepper
            currentStep={processingStep}
            status={processingStatus}
          />
        </section>
      )}

      {/* Error with Retry Button (AC4, AC5) */}
      {error && (
        <div
          className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fade-in"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <h3 className="text-red-800 font-medium">Erro na Analise</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                data-testid="retry-button"
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      )}

      {result && !isLoading && (
        <div className="animate-fade-in-up">
          <ResultsDisplay result={result} />
        </div>
      )}
    </div>
  );
};

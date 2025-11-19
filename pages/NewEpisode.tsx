import React, { useState } from 'react';
import { SermonForm } from '../components/SermonForm';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { analyzeSermonContent, generateSermonImages } from '../services/geminiService';
import { SermonInput, AnalysisResult } from '../types';
import { Loader2, AlertCircle } from 'lucide-react';

export const NewEpisode: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleAnalyze = async (data: SermonInput) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Text Analysis
      setLoadingStep("Analisando conteúdo e gerando metadados...");
      const analysis = await analyzeSermonContent(data);
      
      let finalResult = { ...analysis };

      // Step 2: Image Generation (if file provided)
      if (data.thumbnailFile) {
        setLoadingStep("Gerando artes visuais personalizadas (16:9 e 1:1)...");
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

      setResult(finalResult);
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao analisar o conteúdo. Verifique sua chave API e tente novamente.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Análise</h1>
          <p className="text-gray-500">Gere conteúdo a partir de um vídeo do YouTube.</p>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <SermonForm onSubmit={handleAnalyze} isLoading={isLoading} />
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3 animate-fade-in">
          <AlertCircle className="text-red-500 w-5 h-5 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Erro na Análise</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 animate-pulse">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
          <p className="font-medium text-lg text-gray-800">{loadingStep || "Processando..."}</p>
          <p className="text-sm text-gray-400 mt-2">A Inteligência Artificial está trabalhando para você.</p>
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
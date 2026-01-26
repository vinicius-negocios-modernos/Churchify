
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SermonForm } from '../components/SermonForm';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { analyzeSermonContent, generateSermonImages, regenerateSingleImage } from '../services/geminiService';
import { SermonInput, AnalysisResult } from '../types';
import { Loader2, AlertCircle, ArrowLeft, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { saveEpisode, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const EpisodeCreator: React.FC = () => {
  const { campusId, episodeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const dateStr = searchParams.get('date');
  const timeStr = searchParams.get('time');
  const formattedDate = dateStr ? format(new Date(dateStr), "dd 'de' MMMM", { locale: ptBR }) : 'Data desconhecida';

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  // Armazena a imagem original em memória para regeneração
  const [sourceImage, setSourceImage] = useState<{ base64: string, mimeType: string, title: string, preacher: string } | null>(null);

  // Tentar carregar dados se já existirem
  useEffect(() => {
    const checkExisting = async () => {
      if (!episodeId) return;
      const docRef = doc(db, 'episodes', episodeId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Reconstrói o objeto AnalysisResult a partir do banco
        if (data.aiAnalysis) {
          setResult(data.aiAnalysis);
          setAlreadySaved(true);
        }
      }
    };
    checkExisting();
  }, [episodeId]);

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
    setAlreadySaved(false); // Reset saved state on new analysis
    setSourceImage(null);

    try {
      setLoadingStep("Analisando conteúdo e gerando metadados...");
      const analysis = await analyzeSermonContent(data);
      let finalResult = { ...analysis };

      if (data.thumbnailFile) {
        setLoadingStep("Gerando artes visuais personalizadas...");
        try {
          const base64Image = await fileToBase64(data.thumbnailFile);
          const mimeType = data.thumbnailFile.type;
          
          // Guardar estado para regeneração futura
          setSourceImage({
            base64: base64Image,
            mimeType: mimeType,
            title: data.title,
            preacher: data.preacherName
          });

          const images = await generateSermonImages(base64Image, mimeType, data.title, data.preacherName);
          finalResult.generatedImages = images;
        } catch (imgErr) {
          console.error("Error generating images:", imgErr);
        }
      }
      setResult(finalResult);
    } catch (err) {
      console.error(err);
      setError("Erro na análise. Verifique a API Key.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleRegenerateImage = async (type: 'thumbnail' | 'cover'): Promise<void> => {
    if (!sourceImage || !result || !result.generatedImages) return;

    try {
      const newImageBase64 = await regenerateSingleImage(
        sourceImage.base64,
        sourceImage.mimeType,
        sourceImage.title,
        type
      );

      setResult(prev => {
        if (!prev || !prev.generatedImages) return prev;
        return {
          ...prev,
          generatedImages: {
            ...prev.generatedImages,
            // Atualiza apenas o campo correto
            thumbnail16_9: type === 'thumbnail' ? newImageBase64 : prev.generatedImages.thumbnail16_9,
            artwork1_1: type === 'cover' ? newImageBase64 : prev.generatedImages.artwork1_1
          }
        };
      });
    } catch (e) {
      console.error("Erro ao regenerar imagem", e);
      alert("Erro ao gerar nova imagem. Tente novamente.");
    }
  };

  const handleSaveToDatabase = async () => {
    if (!result || !episodeId) return;
    setIsSaving(true);
    
    try {
      // LIMPEZA DE DADOS: Remover as imagens Base64 pesadas antes de salvar
      const resultToSave = { ...result };
      if (resultToSave.generatedImages) {
        // Removemos o objeto de imagens para não estourar o limite do Firestore
        // e não gastar com Storage.
        delete resultToSave.generatedImages;
      }

      // Salvar no Firestore apenas os metadados de texto
      await saveEpisode(episodeId, {
        campusId,
        date: dateStr,
        time: timeStr,
        aiAnalysis: resultToSave,
        status: 'published'
      });

      setAlreadySaved(true);
      alert("Episódio salvo com sucesso no histórico! (Imagens não foram salvas, baixe-as agora se precisar).");
      navigate('/'); // Voltar ao Dashboard
    } catch (e) {
      alert("Erro ao salvar. Verifique sua conexão ou permissões.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="text-center">
             <h1 className="font-bold text-gray-900">
               {campusId === 'campos85' ? 'Campos 85' : 'Campos 153'}
             </h1>
             <p className="text-xs text-gray-500">{formattedDate} às {timeStr}</p>
          </div>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {!alreadySaved && (
             <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerar Análise</h2>
                <SermonForm onSubmit={handleAnalyze} isLoading={isLoading} />
             </section>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
              <AlertCircle className="text-red-500 w-5 h-5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 animate-pulse">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
              <p className="font-medium text-lg text-gray-800">{loadingStep}</p>
            </div>
          )}

          {result && !isLoading && (
            <div className="animate-fade-in-up space-y-6">
              {/* Barra de Salvamento */}
              <div className="bg-indigo-900 text-white p-4 rounded-lg flex flex-col md:flex-row items-center justify-between shadow-lg sticky top-20 z-30 gap-4">
                <div>
                    <h3 className="font-bold flex items-center gap-2">
                        Análise Gerada 
                        {result.generatedImages && (
                            <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Baixe as imagens!
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-indigo-200">As imagens <strong className="text-white">NÃO</strong> serão salvas. Baixe-as antes de clicar em salvar.</p>
                </div>
                <button 
                    onClick={handleSaveToDatabase}
                    disabled={isSaving || alreadySaved}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${alreadySaved ? 'bg-green-500 cursor-default' : 'bg-white text-indigo-900 hover:bg-indigo-50'}`}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : alreadySaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {alreadySaved ? "Salvo!" : "Salvar Texto no Histórico"}
                </button>
              </div>

              <ResultsDisplay 
                result={result} 
                onRegenerateImage={sourceImage ? handleRegenerateImage : undefined}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

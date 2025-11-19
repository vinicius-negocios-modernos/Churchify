
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { Copy, Check, Music, Share2, TrendingUp, Hash, Youtube, BookOpen, Clock, ListChecks, MessageCircle, Download, ImageIcon, HelpCircle } from 'lucide-react';

interface ResultsDisplayProps {
  result: AnalysisResult;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper to reconstruct full description for copying in the requested order:
  // 1. Snippet SEO
  // 2. Body
  // 3. References
  // 4. CTA
  const fullDescription = [
    result.spotifyDescriptionSnippet,
    "", // Empty line
    result.spotifyDescriptionBody,
    "", // Empty line
    "📖 Referências Bíblicas:",
    result.biblicalReferences.join('\n'),
    "", // Empty line
    "💬 " + result.spotifyCTA
  ].join('\n');

  return (
    <div className="space-y-8">
      
      {/* Spotify Optimization Section */}
      <section className="bg-white rounded-xl shadow-lg border-t-4 border-green-500 overflow-hidden">
        <div className="bg-green-50 px-6 py-4 flex items-center justify-between border-b border-green-100">
          <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
            <Music className="w-5 h-5" />
            Otimização para Spotify (SEO/PSO)
          </h3>
          <span className="text-xs font-semibold bg-green-200 text-green-800 px-2 py-1 rounded">SEO Ready</span>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Titles Options */}
          <div>
            <label className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3 block">3 Opções de Títulos (Ação + Benefício + Keyword)</label>
            <div className="space-y-3">
              {result.spotifyTitles.map((title, idx) => (
                <div key={idx} className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-400 transition-colors">
                  <span className="text-gray-900 font-medium">{title}</span>
                  <button 
                    onClick={() => copyToClipboard(title, `title-${idx}`)}
                    className="text-gray-400 hover:text-green-600 transition-colors p-2 opacity-0 group-hover:opacity-100"
                    title="Copiar título"
                  >
                    {copiedField === `title-${idx}` ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description Assembly Visualizer */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
             <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  Estrutura da Descrição
                </label>
                <button 
                  onClick={() => copyToClipboard(fullDescription, 'full')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors shadow-sm"
                >
                  {copiedField === 'full' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copiar Descrição Pronta
                </button>
             </div>
             
             <div className="space-y-4 text-sm bg-white p-4 rounded-lg border border-gray-100 shadow-inner">
                {/* 1. Snippet */}
                <div>
                  <span className="text-xs font-bold text-purple-600 uppercase mb-1 block">1. Snippet SEO (Início)</span>
                  <p className="text-gray-900 font-medium">{result.spotifyDescriptionSnippet}</p>
                </div>
                
                {/* 2. Body */}
                <div className="border-t border-dashed border-gray-200 pt-3">
                  <span className="text-xs font-bold text-gray-500 uppercase mb-1 block">2. Corpo (Resumo + Takeaways)</span>
                  <p className="text-gray-700 whitespace-pre-wrap">{result.spotifyDescriptionBody}</p>
                </div>

                {/* 3. References */}
                <div className="border-t border-dashed border-gray-200 pt-3">
                  <span className="text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> 3. Referências Bíblicas
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                     {result.biblicalReferences.map((ref, idx) => (
                      <span key={idx} className="text-gray-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. CTA */}
                 <div className="border-t border-dashed border-gray-200 pt-3">
                  <span className="text-xs font-bold text-orange-600 uppercase mb-1 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> 4. Call to Action (Final)
                  </span>
                  <p className="text-gray-800 font-medium italic">"{result.spotifyCTA}"</p>
                </div>
             </div>
             <p className="text-xs text-gray-400 mt-2 text-center">Esta é a ordem exata que será copiada para a área de transferência.</p>
          </div>

           {/* Polls Section */}
           <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 text-white">
                <div className="mb-4">
                  <label className="text-sm font-bold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-green-400" />
                    Enquete do Spotify
                  </label>
                  <div className="mt-2 p-3 bg-white/10 rounded-lg border border-white/10">
                    <p className="text-xs text-green-400 font-bold uppercase mb-1">Pergunta da Enquete</p>
                    <p className="font-medium text-white">{result.spotifyPollQuestion}</p>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {result.spotifyPollOptions.map((option, idx) => (
                    <li key={idx} className="flex items-center gap-3 bg-white/5 p-2 rounded-md border border-white/5 hover:bg-white/10 transition">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-600 text-white text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-200">{option}</span>
                    </li>
                  ))}
                </ul>
                 <button 
                    onClick={() => copyToClipboard(result.spotifyPollQuestion + '\n' + result.spotifyPollOptions.join('\n'), 'poll')}
                    className="mt-4 w-full text-xs text-gray-400 hover:text-white border border-gray-600 rounded py-2 hover:bg-white/10 transition-colors"
                  >
                    {copiedField === 'poll' ? "Enquete Copiada!" : "Copiar Pergunta e Opções"}
                  </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Tags SEO
                </label>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white border border-gray-300 text-gray-600 rounded text-xs shadow-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
                <button 
                  onClick={() => copyToClipboard(result.tags.join(', '), 'tags')}
                  className="mt-4 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  {copiedField === 'tags' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  Copiar Tags
                </button>
             </div>
           </div>
        </div>
      </section>

      {/* Generated Images Section */}
      {result.generatedImages && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100">
           <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
            <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Identidade Visual (IA Generativa)
            </h3>
          </div>
          
          <div className="p-6 grid md:grid-cols-2 gap-8">
             {/* 16:9 Thumbnail */}
             <div className="space-y-3">
               <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                 Miniatura YouTube / Vídeo (16:9)
                 <span title="Imagem gerada com IA mantendo o pregador e adicionando o título">
                   <HelpCircle className="w-4 h-4 text-gray-400" />
                 </span>
               </label>
               <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group shadow-sm hover:shadow-md transition">
                 <img src={result.generatedImages.thumbnail16_9} alt="Generated Thumbnail" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <a 
                     href={result.generatedImages.thumbnail16_9} 
                     download="thumbnail-16-9.png"
                     className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-100"
                   >
                     <Download className="w-4 h-4" /> Baixar
                   </a>
                 </div>
               </div>
             </div>

             {/* 1:1 Artwork */}
             <div className="space-y-3">
               <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                 Capa do Episódio Spotify (1:1)
                 <span title="Imagem quadrada otimizada para players de áudio">
                   <HelpCircle className="w-4 h-4 text-gray-400" />
                 </span>
               </label>
               <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group shadow-sm hover:shadow-md transition w-3/4 mx-auto md:w-full">
                 <img src={result.generatedImages.artwork1_1} alt="Generated Artwork" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <a 
                     href={result.generatedImages.artwork1_1} 
                     download="artwork-1-1.png"
                     className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-100"
                   >
                     <Download className="w-4 h-4" /> Baixar
                   </a>
                 </div>
               </div>
             </div>
          </div>
        </section>
      )}

      {/* Key Moments Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
         <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
          <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
            <Youtube className="w-5 h-5" />
            Momentos Chaves (Shorts & Reels)
          </h3>
        </div>
        
        <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {result.keyMoments.map((moment, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {moment.timestamp}
              </div>
              
              <div className="mb-4 mt-2">
                <h4 className="font-bold text-gray-900 leading-tight mb-1 text-lg">{moment.title}</h4>
              </div>
              
              <div className="space-y-4 flex-grow">
                 <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Hook Sugerido</p>
                    <p className="text-sm text-gray-800 italic border-l-4 border-indigo-400 pl-3 py-1 bg-indigo-50 mt-1 rounded-r">
                      "{moment.hook}"
                    </p>
                 </div>
                 
                 <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Contexto</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                      {moment.estimatedContext}
                    </p>
                 </div>

                 <div className="pt-3 mt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                       <TrendingUp className="w-3 h-3 text-green-600" />
                       Engajamento
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {moment.reasoning}
                    </p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Marketing Hooks Section */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg text-white">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold">Calls to Action (Divulgação)</h3>
        </div>
        <div className="p-6 grid gap-4 sm:grid-cols-3">
          {result.marketingHooks.map((hook, idx) => (
            <div key={idx} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
              <p className="text-sm leading-relaxed font-medium">"{hook}"</p>
              <button 
                onClick={() => copyToClipboard(hook, `hook-${idx}`)}
                className="mt-3 text-xs text-blue-300 hover:text-white transition-colors flex items-center gap-1"
              >
                {copiedField === `hook-${idx}` ? "Copiado!" : "Copiar Texto"}
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

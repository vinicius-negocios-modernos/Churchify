
import React, { useState } from 'react';
import { SermonInput } from '../types';
import { Youtube, User, Type, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';

interface SermonFormProps {
  onSubmit: (data: SermonInput) => void;
  isLoading: boolean;
}

export const SermonForm: React.FC<SermonFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<SermonInput>({
    youtubeUrl: '',
    preacherName: '',
    title: '',
    thumbnailFile: null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, thumbnailFile: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.youtubeUrl || !formData.preacherName || !formData.title) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Video URL Input */}
        <div className="space-y-2">
          <label htmlFor="youtubeUrl" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Youtube className="w-4 h-4 text-red-500" />
            Link do Vídeo (YouTube) <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="youtubeUrl"
            name="youtubeUrl"
            value={formData.youtubeUrl}
            onChange={handleChange}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm shadow-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preacher Name Input */}
          <div className="space-y-2">
            <label htmlFor="preacherName" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="w-4 h-4 text-indigo-500" />
              Nome do Pregador(a) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="preacherName"
              name="preacherName"
              value={formData.preacherName}
              onChange={handleChange}
              placeholder="Ex: Pr. João da Silva"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm shadow-sm"
              required
            />
          </div>

          {/* Sermon Title Input */}
          <div className="space-y-2">
            <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Type className="w-4 h-4 text-indigo-500" />
              Título da Pregação <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Vencendo Gigantes pela Fé"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm shadow-sm"
              required
            />
          </div>
        </div>

        {/* Thumbnail Upload Input */}
        <div className="space-y-2">
          <label htmlFor="thumbnail" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <ImageIcon className="w-4 h-4 text-green-500" />
            Upload da Thumbnail/Foto (Opcional)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors bg-gray-50">
            <div className="space-y-1 text-center">
              {formData.thumbnailFile ? (
                <div className="flex flex-col items-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-indigo-500" />
                  <p className="text-sm text-gray-900 mt-2 font-medium">{formData.thumbnailFile.name}</p>
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, thumbnailFile: null}))}
                    className="text-xs text-red-500 hover:text-red-700 mt-2"
                  >
                    Remover arquivo
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                    >
                      <span>Carregar um arquivo</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF até 10MB. Usado para gerar artes 16:9 e 1:1.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98]
            ${isLoading 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl'
            }`}
        >
          {isLoading ? (
            <>Processando...</>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analisar Vídeo e Gerar Conteúdo
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          A IA analisará o contexto e, se fornecida uma imagem, gerará novas artes para o episódio.
        </p>
      </div>
    </form>
  );
};

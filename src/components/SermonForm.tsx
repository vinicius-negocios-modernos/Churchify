
import React, { useState, useCallback, useRef } from 'react';
import { SermonInput } from '@/types';
import { Youtube, User, Type, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isValidYouTubeUrl } from '@/lib/validation';
import { useFormPersistence } from '@/hooks/useFormPersistence';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FormErrors {
  youtubeUrl?: string;
  preacherName?: string;
  title?: string;
}

interface SermonFormProps {
  onSubmit: (data: SermonInput) => void;
  isLoading: boolean;
}

export const SermonForm: React.FC<SermonFormProps> = ({ onSubmit, isLoading }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData, clearFormPersistence] = useFormPersistence<SermonInput>(
    'churchify:sermon-form',
    {
      youtubeUrl: '',
      preacherName: '',
      title: '',
      thumbnailFile: null,
    },
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: `O arquivo "${file.name}" excede o limite de 10MB. Por favor, escolha um arquivo menor.`,
      });
      return false;
    }
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, envie apenas imagens (PNG, JPG, GIF).',
      });
      return false;
    }
    return true;
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setFormData(prev => ({ ...prev, thumbnailFile: file }));
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setFormData(prev => ({ ...prev, thumbnailFile: file }));
      }
    }
  }, [validateFile, setFormData]);

  const handleDropZoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.youtubeUrl.trim()) {
      newErrors.youtubeUrl = 'O link do vídeo é obrigatório.';
    } else if (!isValidYouTubeUrl(formData.youtubeUrl)) {
      newErrors.youtubeUrl = 'Por favor, insira um link válido do YouTube.';
    }
    if (!formData.preacherName.trim()) {
      newErrors.preacherName = 'O nome do pregador é obrigatório.';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'O título da pregação é obrigatório.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    clearFormPersistence();
    onSubmit(formData);
  };

  const inputClassName = (fieldName: keyof FormErrors) =>
    `w-full px-4 py-3 rounded-lg border ${
      errors[fieldName]
        ? 'border-red-500 focus:ring-2 focus:ring-red-500'
        : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
    } focus:border-transparent transition-all outline-none text-sm shadow-sm`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate aria-live="polite">
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
            className={inputClassName('youtubeUrl')}
            aria-invalid={!!errors.youtubeUrl}
            aria-describedby={errors.youtubeUrl ? 'youtubeUrl-error' : undefined}
          />
          {errors.youtubeUrl && (
            <p id="youtubeUrl-error" className="text-sm text-red-600" role="alert">
              {errors.youtubeUrl}
            </p>
          )}
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
              className={inputClassName('preacherName')}
              aria-invalid={!!errors.preacherName}
              aria-describedby={errors.preacherName ? 'preacherName-error' : undefined}
            />
            {errors.preacherName && (
              <p id="preacherName-error" className="text-sm text-red-600" role="alert">
                {errors.preacherName}
              </p>
            )}
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
              className={inputClassName('title')}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-red-600" role="alert">
                {errors.title}
              </p>
            )}
          </div>
        </div>

        {/* Thumbnail Upload Input — D&D + Click */}
        <div className="space-y-2">
          <label htmlFor="thumbnail" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <ImageIcon className="w-4 h-4 text-green-500" />
            Upload da Thumbnail/Foto (Opcional)
          </label>
          <div
            role="button"
            tabIndex={0}
            aria-label="Área de upload de imagem. Clique ou arraste um arquivo"
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer bg-gray-50 ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleDropZoneClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDropZoneClick(); } }}
          >
            <div className="space-y-1 text-center">
              {formData.thumbnailFile ? (
                <div className="flex flex-col items-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-indigo-500" />
                  <p className="text-sm text-gray-900 mt-2 font-medium">{formData.thumbnailFile.name}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, thumbnailFile: null})); }}
                    className="text-xs text-red-500 hover:text-red-700 mt-2"
                  >
                    Remover arquivo
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-500" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <span className="font-medium text-indigo-600">Carregar um arquivo</span>
                    <p className="pl-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF até 10MB. Usado para gerar artes 16:9 e 1:1.
                  </p>
                </>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept="image/*"
            onChange={handleFileChange}
            tabIndex={-1}
            aria-label="Upload da Thumbnail"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
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
        <p className="text-center text-xs text-gray-500 mt-3">
          A IA analisará o contexto e, se fornecida uma imagem, gerará novas artes para o episódio.
        </p>
      </div>
    </form>
  );
};

import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Trash2, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { ImportStep } from '../types';

interface ExcelUploadProps {
  step: ImportStep;
  file: File | null;
  totalLinhasLidas: number;
  onFileSelect: (file: File) => void;
  onRemoverFicheiro: () => void;
  onValidarFicheiro: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({
  step,
  file,
  totalLinhasLidas,
  onFileSelect,
  onRemoverFicheiro,
  onValidarFicheiro
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidating = step === 'validating';
  const isParsing = step === 'parsing';
  const isConfirming = step === 'confirming';
  const isValidated = step === 'validated';

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const name = droppedFile.name.toLowerCase();
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        onFileSelect(droppedFile);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (file) {
    return (
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                  {file.name}
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 size={10} />
                  Carregado
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {totalLinhasLidas} {totalLinhasLidas === 1 ? 'linha lida' : 'linhas lidas'}
                </span>
                {isValidated && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">Validação concluída</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={onRemoverFicheiro}
              disabled={isValidating || isConfirming}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>Remover</span>
            </button>

            <button
              type="button"
              onClick={onValidarFicheiro}
              disabled={isValidating || isParsing || isConfirming || totalLinhasLidas === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>A validar...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={13} />
                  <span>Revalidar Ficheiro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary/60 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <UploadCloud className="w-5 h-5" />
        </div>

        <div>
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
            Arraste o ficheiro Excel (.xlsx) para aqui ou{' '}
            <span className="text-primary underline">clique para procurar</span>
          </span>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Preenchido a partir do modelo oficial com listas suspensas.
          </p>
        </div>
      </div>
    </div>
  );
};

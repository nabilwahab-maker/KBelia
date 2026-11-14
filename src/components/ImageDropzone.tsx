import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';

interface ImageDropzoneProps {
  label: string;
  sublabel?: string;
  value?: string;
  onChange: (base64OrUrl: string) => void;
  aspectRatio?: 'landscape' | 'square' | 'banner' | '16:9' | '1:1' | '21:9';
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  label,
  sublabel = 'Seret & lepas gambar di sini atau klik untuk pilih dari galeri / fail peranti (JPG, PNG, WebP)',
  value,
  onChange,
  aspectRatio = 'landscape'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirmDelete } = useConfirmDelete();

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Sila pilih fail imej yang sah (JPG, PNG, WebP).');
      return;
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Saiz imej terlalu besar. Maksimum 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setError('Gagal membaca fail imej.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirmDelete({
      itemName: label || 'Imej Muat Naik',
      itemType: 'Imej',
      onConfirm: () => {
        onChange('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  const aspectClass = 
    aspectRatio === 'square' || aspectRatio === '1:1'
      ? 'aspect-square max-h-48' 
      : aspectRatio === 'banner' || aspectRatio === '21:9'
        ? 'aspect-21/9 max-h-52' 
        : 'aspect-16/9 max-h-52';

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-black dark:text-white">
          {label}
        </label>
        {value && (
          <span className="text-[11px] font-semibold text-black dark:text-white/75 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Imej dipilih</span>
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-900 group shadow-xs`}>
          <img
            src={value}
            alt="Pratonton Imej"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-black rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tukar Imej
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
              title="Padam Imej"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer select-none ${
            isDragging
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-black dark:text-white scale-[0.99]'
              : 'border-slate-300 dark:border-slate-600 hover:border-blue-600 dark:hover:border-blue-400/70 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-800 text-black dark:text-white/75'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-300 dark:border-slate-600 flex items-center justify-center mb-2.5 text-black dark:text-white/75">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-black dark:text-white">
            Tekan untuk muat naik atau heret fail ke sini
          </div>
          <p className="text-[11px] text-black/70 dark:text-white/75 mt-0.5 max-w-sm">
            {sublabel}
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs font-semibold text-black dark:text-white/75 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

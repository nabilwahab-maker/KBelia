import React, { useEffect, useState } from 'react';
import { X, Save, CheckCircle2, XCircle, Loader2, Edit3, AlertCircle } from 'lucide-react';
import { ProductItem } from '../types';
import { ImageDropzone } from './ImageDropzone';
import { saveProduct } from '../services/dataService';

const DEFAULT_PRODUCT_IMAGE = '/assets/generated/product_kelantan_delights_1793924253401.jpg';

interface EditProductModalProps {
  isOpen: boolean;
  product: ProductItem | null;
  onClose: () => void;
  onSaved: (updated: ProductItem) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(DEFAULT_PRODUCT_IMAGE);
  const [inStock, setInStock] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setName(product.name || '');
      setPrice(product.price !== undefined && product.price !== null ? String(product.price) : '0');
      setCategory(product.category || 'Menu Utama');
      setDescription(product.description || '');
      setImageUrl(product.imageUrl || DEFAULT_PRODUCT_IMAGE);
      setInStock(product.inStock !== false);
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedCategory = category.trim() || 'Umum';
    const trimmedDesc = description.trim();
    const parsedPrice = parseFloat(price);

    if (!trimmedName) {
      setError('Sila masukkan nama produk.');
      return;
    }
    if (trimmedName.length > 150) {
      setError('Nama produk tidak boleh melebihi 150 aksara.');
      return;
    }
    if (price.trim() === '' || isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Sila masukkan harga jualan yang sah (RM0.00 atau lebih).');
      return;
    }
    if (trimmedCategory.length > 60) {
      setError('Kategori produk tidak boleh melebihi 60 aksara.');
      return;
    }
    if (trimmedDesc.length > 1000) {
      setError('Penerangan produk tidak boleh melebihi 1000 aksara.');
      return;
    }

    const finalImageUrl = imageUrl.trim() || DEFAULT_PRODUCT_IMAGE;
    if (finalImageUrl.length > 900000) {
      setError('Saiz imej terlalu besar untuk disimpan. Sila pilih imej yang lebih kecil.');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await saveProduct({
        id: product.id,
        businessId: product.businessId,
        ownerId: product.ownerId,
        createdAt: product.createdAt,
        name: trimmedName,
        price: parsedPrice,
        category: trimmedCategory,
        description: trimmedDesc,
        imageUrl: finalImageUrl,
        inStock
      });
      onSaved(updated);
    } catch (err) {
      console.error('Gagal mengemaskini produk:', err);
      setError('Gagal mengemaskini produk. Sila semak sambungan anda dan cuba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-product-modal-title"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="kbelia-important-header sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3
                id="edit-product-modal-title"
                className="text-sm sm:text-base font-bold text-black dark:text-white truncate"
              >
                Sunting Maklumat Produk
              </h3>
              <p className="text-[11px] text-black/70 dark:text-white/75 truncate">
                Kemaskini harga, gambar, penerangan dan status stok produk anda.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Tutup tetingkap suntingan"
            className="p-2 rounded-xl text-black/70 dark:text-white/75 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-1.5">
                Nama Produk <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Nasi Kerabu Daging Bakar"
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-1.5">
                Harga Jualan (RM) <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.10"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-1.5">
                Kategori Produk
              </label>
              <input
                type="text"
                maxLength={60}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Contoh: Menu Utama"
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Stock Availability Toggle */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-1.5">
              Status Ketersediaan Stok
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                aria-pressed={inStock}
                onClick={() => setInStock(true)}
                className={`min-h-[42px] px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  inStock
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-black/70 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Stok Tersedia</span>
              </button>
              <button
                type="button"
                aria-pressed={!inStock}
                onClick={() => setInStock(false)}
                className={`min-h-[42px] px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  !inStock
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 dark:border-rose-600 text-rose-800 dark:text-rose-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-black/70 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Kehabisan Stok</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-black dark:text-white mb-1.5">
                Penerangan Produk &amp; Keistimewaan
              </label>
              <textarea
                rows={5}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Terangkan bahan, saiz hidangan, atau keistimewaan produk anda..."
                className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-black dark:text-white placeholder:text-black/45 dark:placeholder:text-white/45 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-all"
              />
              <div className="mt-1 text-[11px] text-black/60 dark:text-white/60 text-right tabular-nums">
                {description.length}/1000 aksara
              </div>
            </div>

            <div>
              <ImageDropzone
                label="Gambar Produk"
                value={imageUrl}
                onChange={(val) => setImageUrl(val)}
                aspectRatio="1:1"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-black dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[42px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

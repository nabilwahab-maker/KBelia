import React, { useState } from 'react';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  MessageCircle, 
  Store, 
  Truck,
  CheckCircle2
} from 'lucide-react';
import { CartItem } from '../types';

interface ProductCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const ProductCartDrawer: React.FC<ProductCartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const [fulfillmentMode, setFulfillmentMode] = useState<'kiosk' | 'delivery'>('kiosk');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const totalAmount = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const targetWhatsApp = cart[0]?.merchantWhatsApp || '60123456789';
  const targetMerchant = cart[0]?.merchantBusinessName || 'Peniaga Kiosk Belia';

  const handleCheckoutWhatsApp = () => {
    if (!customerName || !customerPhone) {
      alert('Sila masukkan nama dan nombor telefon anda sebelum membuat pesanan.');
      return;
    }

    const orderLines = cart.map(item => 
      `- ${item.product.name} (x${item.quantity}): RM ${(item.product.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const message = 
`*PESANAN PRODUK KIOSK NIAGA BELIA KELANTAN*
Nama Pelanggan: ${customerName}
No. Telefon: ${customerPhone}
Kaedah Pesanan: ${fulfillmentMode === 'kiosk' ? 'Ambil Sendiri di Kiosk' : 'Penghantaran Tempatan'}
Peniaga: ${targetMerchant}

*SENARAI PESANAN:*
${orderLines}

*JUMLAH KESELURUHAN: RM ${totalAmount.toFixed(2)}*
Catatan Tambahan: ${notes || 'Tiada'}

Pesanan dibuat melalui Portal Rasmi Niaga Belia Kelantan. Mohon sahkan penerimaan stok dan bayaran DuitNow QR. Terima kasih!`;

    const url = `https://wa.me/${targetWhatsApp.replace(/[\s-+]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Troli Pra-Pesanan Kiosk ({totalItems} Item)
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pesanan Terus ke WhatsApp Peniaga
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p>Troli pesanan anda masih kosong.</p>
                <p className="text-[11px] text-slate-400 mt-1">Pilih produk kegemaran anda daripada katalog direktori kiosk!</p>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.product.id}
                  className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.product.name}
                    </h5>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                      RM {item.product.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="p-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="p-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Controls */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 space-y-3 text-xs">
              {/* Delivery / Pickup Choice */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentMode('kiosk')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all ${
                    fulfillmentMode === 'kiosk'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" /> Ambil di Kiosk
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentMode('delivery')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all ${
                    fulfillmentMode === 'delivery'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" /> Penghantaran
                </button>
              </div>

              {/* Customer Info Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nama anda"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="Nombor telefon"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-baseline justify-between pt-2">
                <span className="text-slate-500 font-semibold">Jumlah Perlu Dibayar:</span>
                <span className="text-lg font-extrabold text-amber-700 dark:text-amber-400 tabular-nums">
                  RM {totalAmount.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckoutWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Hantar Pesanan ke WhatsApp Peniaga
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

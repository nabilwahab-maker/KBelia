import React, { createContext, useCallback, useContext, useState } from 'react';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

export interface ConfirmDeleteOptions {
  title?: string;
  itemName: string;
  itemType?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
}

interface ConfirmDeleteContextValue {
  confirmDelete: (options: ConfirmDeleteOptions) => void;
  closeConfirmDelete: () => void;
}

const ConfirmDeleteContext = createContext<ConfirmDeleteContextValue | undefined>(undefined);

export const ConfirmDeleteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingOptions, setPendingOptions] = useState<ConfirmDeleteOptions | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = useCallback((options: ConfirmDeleteOptions) => {
    setPendingOptions(options);
  }, []);

  const closeConfirmDelete = useCallback(() => {
    if (isDeleting) return;
    setPendingOptions(null);
  }, [isDeleting]);

  const handleConfirm = async () => {
    if (!pendingOptions) return;
    try {
      setIsDeleting(true);
      await pendingOptions.onConfirm();
    } finally {
      setIsDeleting(false);
      setPendingOptions(null);
    }
  };

  return (
    <ConfirmDeleteContext.Provider value={{ confirmDelete, closeConfirmDelete }}>
      {children}
      <DeleteConfirmationModal
        isOpen={Boolean(pendingOptions)}
        title={pendingOptions?.title}
        itemName={pendingOptions?.itemName || ''}
        itemType={pendingOptions?.itemType}
        description={pendingOptions?.description}
        confirmLabel={pendingOptions?.confirmLabel}
        cancelLabel={pendingOptions?.cancelLabel}
        isDeleting={isDeleting}
        onConfirm={handleConfirm}
        onCancel={closeConfirmDelete}
      />
    </ConfirmDeleteContext.Provider>
  );
};

export const useConfirmDelete = () => {
  const context = useContext(ConfirmDeleteContext);
  if (!context) {
    throw new Error('useConfirmDelete must be used within a ConfirmDeleteProvider');
  }
  return context;
};

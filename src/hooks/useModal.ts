import { useState, useCallback } from 'react';

export type ModalType = 'alerts' | 'radar' | 'actions' | 'category' | 'timeline' | null;

export interface ModalState {
  type: ModalType;
  isOpen: boolean;
  data?: any;
}

/**
 * Hook to manage modal state and data
 * - Open/close modals
 * - Pass data between components
 * - Handle modal navigation
 */
export const useModal = (initialModal: ModalType = null) => {
  const [modal, setModal] = useState<ModalState>({
    type: initialModal,
    isOpen: initialModal !== null,
    data: undefined,
  });

  const openModal = useCallback((type: ModalType, data?: any) => {
    setModal({
      type,
      isOpen: true,
      data,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal({
      type: null,
      isOpen: false,
      data: undefined,
    });
  }, []);

  const switchModal = useCallback((type: ModalType, data?: any) => {
    setModal({
      type,
      isOpen: true,
      data,
    });
  }, []);

  const updateModalData = useCallback((data: any) => {
    setModal(prev => ({
      ...prev,
      data: { ...prev.data, ...data },
    }));
  }, []);

  return {
    modal,
    openModal,
    closeModal,
    switchModal,
    updateModalData,
    isModalOpen: modal.isOpen,
    modalType: modal.type,
    modalData: modal.data,
  };
};

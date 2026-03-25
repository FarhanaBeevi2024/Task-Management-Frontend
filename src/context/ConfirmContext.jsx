import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    danger: false,
  });
  const resolveRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    const {
      title = 'Confirm',
      message = '',
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
      danger = false,
    } = options;

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({
        open: true,
        title,
        message,
        confirmLabel,
        cancelLabel,
        danger,
      });
    });
  }, []);

  const finish = useCallback((value) => {
    const r = resolveRef.current;
    resolveRef.current = null;
    setDialog((d) => ({ ...d, open: false }));
    if (r) r(value);
  }, []);

  const handleConfirm = useCallback(() => finish(true), [finish]);
  const handleCancel = useCallback(() => finish(false), [finish]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        cancelLabel={dialog.cancelLabel}
        danger={dialog.danger}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx.confirm;
}

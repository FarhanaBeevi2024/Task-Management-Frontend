import { toast } from 'react-toastify';

const defaultOpts = {
  autoClose: 4500,
};

function asText(message) {
  if (message == null || message === '') return 'Something went wrong';
  return String(message);
}

export function notifyError(message, options = {}) {
  return toast.error(asText(message), { ...defaultOpts, ...options });
}

export function notifySuccess(message, options = {}) {
  return toast.success(asText(message), { ...defaultOpts, autoClose: 3200, ...options });
}

export function notifyWarning(message, options = {}) {
  return toast.warning(asText(message), { ...defaultOpts, ...options });
}

export function notifyInfo(message, options = {}) {
  return toast.info(asText(message), { ...defaultOpts, ...options });
}

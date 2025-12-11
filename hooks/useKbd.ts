import { useEffect } from 'react';

export const useKbd = (callback: () => void, keys: string[]) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && keys.includes(event.key)) {
        event.preventDefault();
        callback();
      }
    };
    
    window.addEventListener('keydown', handler);
    
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [callback, keys]);
};

import { useCallback, useEffect, useState } from 'react';
const currentPath = () => window.location.pathname.replace(/\/$/, '') || '/';
export default function useNavigation() {
  const [path, setPath] = useState(currentPath);
  const [message, setMessage] = useState('');
  const navigate = useCallback((to, notice = '') => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setMessage(notice);
  }, []);
  useEffect(() => {
    const onPop = () => {
      setPath(currentPath());
      setMessage('');
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return {
    path,
    message,
    navigate
  };
}

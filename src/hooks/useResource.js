import { useState, useEffect, useCallback } from 'react';
export default function useResource(loader) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: ''
  });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => {
    let active = true;
    loader().then(data => {
      if (active) setState({
        data,
        loading: false,
        error: '',
        loader
      });
    }).catch(error => {
      if (active) setState(previous => ({
        ...previous,
        loading: false,
        error: error.message,
        loader
      }));
    });
    return () => {
      active = false;
    };
  }, [loader, revision]);
  return {
    ...state,
    loading: state.loading || state.loader !== loader,
    reload
  };
}

import { useState, useEffect } from 'react';

export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, deps);

  return { data, loading, error, refetch: fetchData };
}

export function useApiMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const mutate = async (fn, ...args) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await fn(...args);
      setSuccess(true);
      return result;
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Operation failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(false);

  return { mutate, loading, error, success, clearError, clearSuccess };
}

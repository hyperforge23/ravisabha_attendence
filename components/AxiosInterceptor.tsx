'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function AxiosInterceptor() {
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 403) {
          toast.error("You don't have permission to do that.");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return null;
}

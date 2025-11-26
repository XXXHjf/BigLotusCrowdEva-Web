// src/hooks/useDynamicData.ts
import { useState, useEffect } from 'react';

export const useDynamicData = <T,>(
  generator: () => T,
  interval: number
): T => {
  const [data, setData] = useState(generator());

  useEffect(() => {
    const handle = setInterval(() => {
      setData(generator());
    }, interval);

    return () => clearInterval(handle);
  }, [generator, interval]);

  return data;
};

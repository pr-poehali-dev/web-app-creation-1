import { useState, useEffect } from 'react';
import { contentAPI } from '@/services/api';

type ContentMap = Record<string, string>;

let cache: ContentMap | null = null;
let cachePromise: Promise<ContentMap> | null = null;

async function fetchContent(): Promise<ContentMap> {
  if (cache) return cache;
  if (cachePromise) return cachePromise;

  cachePromise = contentAPI.getContent().then((data) => {
    const map: ContentMap = {};
    if (data && Array.isArray(data.content)) {
      (data.content as Record<string, unknown>[]).forEach((item) => {
        if (item?.key) map[String(item.key)] = String(item.value ?? '');
      });
    }
    cache = map;
    cachePromise = null;
    return map;
  });

  return cachePromise;
}

export function invalidateSiteContentCache() {
  cache = null;
  cachePromise = null;
}

export function useSiteContent(keys: string[]): ContentMap {
  const [content, setContent] = useState<ContentMap>({});

  useEffect(() => {
    fetchContent().then((map) => {
      const result: ContentMap = {};
      keys.forEach((k) => { result[k] = map[k] ?? ''; });
      setContent(result);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return content;
}

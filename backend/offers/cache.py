'''
Простая in-memory кэш система для backend функций
'''

import time
from typing import Any, Optional, Dict, Tuple

class SimpleCache:
    def __init__(self):
        self._cache: Dict[str, Tuple[Any, float, float]] = {}
        self._max_size = 100
    
    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        
        value, timestamp, ttl = self._cache[key]
        
        if time.time() - timestamp > ttl:
            del self._cache[key]
            return None
        
        return value
    
    def set(self, key: str, value: Any, ttl: float = 120) -> None:
        if len(self._cache) >= self._max_size:
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][1])
            del self._cache[oldest_key]
        
        self._cache[key] = (value, time.time(), ttl)
    
    def invalidate(self, pattern: str) -> int:
        keys_to_delete = [k for k in self._cache.keys() if pattern in k]
        for key in keys_to_delete:
            del self._cache[key]
        return len(keys_to_delete)
    
    def clear(self) -> None:
        self._cache.clear()
    
    def size(self) -> int:
        return len(self._cache)

offers_cache = SimpleCache()

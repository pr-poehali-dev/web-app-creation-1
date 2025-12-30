'''
Простая система rate limiting для защиты API
'''

import time
from typing import Dict, Tuple
from collections import defaultdict

class RateLimiter:
    def __init__(self):
        self._requests: Dict[str, list] = defaultdict(list)
        
    def check_rate_limit(
        self, 
        identifier: str, 
        max_requests: int = 60,
        window_seconds: int = 60
    ) -> Tuple[bool, int]:
        """
        Проверяет rate limit для идентификатора (IP или user_id)
        
        Возвращает:
        - (True, оставшихся запросов) если лимит не превышен
        - (False, 0) если лимит превышен
        """
        now = time.time()
        window_start = now - window_seconds
        
        # Удаляем старые записи
        if identifier in self._requests:
            self._requests[identifier] = [
                req_time for req_time in self._requests[identifier]
                if req_time > window_start
            ]
        
        # Проверяем лимит
        current_requests = len(self._requests[identifier])
        
        if current_requests >= max_requests:
            return False, 0
        
        # Добавляем текущий запрос
        self._requests[identifier].append(now)
        
        remaining = max_requests - current_requests - 1
        return True, remaining
    
    def get_retry_after(self, identifier: str, window_seconds: int = 60) -> int:
        """Возвращает количество секунд до сброса лимита"""
        if identifier not in self._requests or not self._requests[identifier]:
            return 0
        
        oldest_request = min(self._requests[identifier])
        retry_after = int(window_seconds - (time.time() - oldest_request))
        return max(0, retry_after)
    
    def cleanup(self, max_identifiers: int = 10000):
        """Очистка старых идентификаторов для экономии памяти"""
        if len(self._requests) > max_identifiers:
            # Удаляем 20% самых старых записей
            sorted_identifiers = sorted(
                self._requests.items(),
                key=lambda x: max(x[1]) if x[1] else 0
            )
            
            to_remove = int(max_identifiers * 0.2)
            for identifier, _ in sorted_identifiers[:to_remove]:
                del self._requests[identifier]

rate_limiter = RateLimiter()

"""Вспомогательные утилиты для orders: подключение к БД, уведомления, вспомогательные функции"""
import json
import os
import sys
import http.client
import threading
from typing import Dict, Any
from datetime import datetime
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

# Импортируем offers_cache для инвалидации кэша
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'offers'))
try:
    from cache import offers_cache
except ImportError:
    class DummyCache:
        def clear(self): pass
    offers_cache = DummyCache()


def decimal_to_float(obj):
    """Рекурсивно конвертирует Decimal в float"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(item) for item in obj]
    return obj

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def get_schema():
    return os.environ.get('DB_SCHEMA', 'public')

def generate_order_number():
    """Генерация уникального номера заказа"""
    import random
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = random.randint(1000, 9999)
    return f'ORD-{timestamp}-{random_part}'

def _send_call_sync(phone: str, call_type: str):
    """Внутренняя синхронная отправка звонка (вызывается в отдельном потоке)"""
    try:
        func2url_path = os.path.join(os.path.dirname(__file__), '..', 'func2url.json')
        with open(func2url_path) as f:
            func2url = json.load(f)
        exolve_url = func2url.get('exolve-call', '')
        if not exolve_url:
            print('[EXOLVE] exolve-call URL not found in func2url.json')
            return
        from urllib.parse import urlparse
        parsed = urlparse(exolve_url)
        host = parsed.netloc
        path = parsed.path or '/'
        payload = json.dumps({'phone': phone, 'type': call_type})
        conn = http.client.HTTPSConnection(host, timeout=20)
        conn.request('POST', path, payload, {'Content-Type': 'application/json'})
        resp = conn.getresponse()
        resp_body = resp.read().decode('utf-8')
        conn.close()
        print(f'[EXOLVE] Call to {phone} type={call_type}: status={resp.status} resp={resp_body[:200]}')
    except Exception as e:
        print(f'[EXOLVE] Call error: {e}')


def send_call(phone: str, text: str = '', call_type: str = 'order'):
    """Голосовой звонок через МТС Exolve (асинхронно в отдельном потоке)"""
    if not phone:
        return
    t = threading.Thread(target=_send_call_sync, args=(phone, call_type), daemon=True)
    t.start()


def _send_notification_sync(user_id: int, title: str, message: str, url: str):
    """Внутренняя синхронная отправка уведомлений (вызывается в отдельном потоке)"""
    notification_data = json.dumps({
        'userId': user_id,
        'title': title,
        'message': message,
        'url': url
    })
    headers = {'Content-Type': 'application/json'}

    # Web Push-уведомление
    try:
        conn = http.client.HTTPSConnection('functions.poehali.dev', timeout=8)
        conn.request('POST', '/a1c8fafd-b64f-45e5-b9b9-0a050cca4f7a',  # push-send
                    notification_data, headers)
        response = conn.getresponse()
        body_resp = response.read()
        conn.close()
        print(f'[NOTIFICATION] Push sent to user {user_id}: {title} | status={response.status} resp={body_resp[:200]}')
    except Exception as e:
        print(f'[NOTIFICATION] Push error: {e}')

    # Email-уведомление
    try:
        conn = http.client.HTTPSConnection('functions.poehali.dev', timeout=5)
        conn.request('POST', '/dd3295a9-ffa3-4842-8c95-de00a018ecf0',  # email-notify
                    notification_data, headers)
        response = conn.getresponse()
        response.read()
        conn.close()
        print(f'[NOTIFICATION] Email sent to user {user_id}: {title}')
    except Exception as e:
        print(f'[NOTIFICATION] Email error: {e}')


def send_notification(user_id: int, title: str, message: str, url: str = '/my-orders'):
    """Отправка push и email уведомлений (асинхронно в отдельном потоке)"""
    t = threading.Thread(target=_send_notification_sync, args=(user_id, title, message, url), daemon=True)
    t.start()

def reject_other_responses(cur, schema: str, offer_id: str, accepted_order_id: str, title: str, is_request: bool = True):
    """Отклоняет все остальные отклики на тот же запрос/предложение при принятии одного"""
    from psycopg2 import sql as pgsql
    
    cur.execute(
        pgsql.SQL("""
            SELECT id, buyer_id, order_number 
            FROM {schema}.orders 
            WHERE offer_id = %s 
              AND id != %s
              AND status IN ('new', 'pending', 'negotiating')
        """).format(schema=pgsql.Identifier(schema)),
        (offer_id, accepted_order_id)
    )
    other_orders = cur.fetchall()
    
    if not other_orders:
        print(f"[AUTO_REJECT] No other responses to reject for offer {offer_id}")
        return
    
    entity_type = 'запрос' if is_request else 'предложение'
    reason_text = 'Автоматически отклонён — выбран другой исполнитель'
    
    other_ids = [o['id'] for o in other_orders]
    cur.execute(
        pgsql.SQL("""
            UPDATE {schema}.orders 
            SET status = 'rejected', 
                cancellation_reason = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ANY(%s)
        """).format(schema=pgsql.Identifier(schema)),
        (reason_text, other_ids)
    )
    
    print(f"[AUTO_REJECT] Rejected {len(other_orders)} other responses for {entity_type} {offer_id}")
    
    notify_text = f'К сожалению, по {entity_type}у «{title}» выбран другой исполнитель'
    for o in other_orders:
        try:
            send_notification(
                o['buyer_id'],
                'Ваш отклик отклонён',
                notify_text,
                f'/my-orders?tab=my-responses'
            )
        except Exception as e:
            print(f"[AUTO_REJECT] Notification error for user {o['buyer_id']}: {e}")
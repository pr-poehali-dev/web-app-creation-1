import json
import os
import base64
from datetime import datetime, timedelta
from urllib.parse import urlparse

import psycopg2
from cryptography.hazmat.primitives.serialization import load_pem_private_key, Encoding, PrivateFormat, NoEncryption
from pywebpush import webpush, WebPushException

DB_SCHEMA = os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')
HEADERS = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}


def load_vapid_key() -> str:
    raw = os.environ.get('VAPID_PRIVATE_KEY', '').strip()
    if raw.startswith('-----'):
        pem = raw.replace('\\n', '\n').strip() + '\n'
        key = load_pem_private_key(pem.encode(), password=None)
        der = key.private_bytes(Encoding.DER, PrivateFormat.PKCS8, NoEncryption())
        return base64.urlsafe_b64encode(der).rstrip(b'=').decode('ascii')
    return raw


def handler(event: dict, context) -> dict:
    '''Рассылает push-напоминания о делах помощника, срок которых наступил. Вызывать по расписанию раз в минуту.'''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    vapid_key = load_vapid_key()
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    now_utc = datetime.utcnow()

    # due_at хранится как местное время пользователя, tz_offset = минуты (UTC - местное)
    cur.execute(f'''
        SELECT id, user_id, title FROM {DB_SCHEMA}.assistant_tasks
        WHERE done = FALSE AND reminded = FALSE AND due_at IS NOT NULL
          AND due_at + (tz_offset * INTERVAL '1 minute') <= %s
          AND due_at + (tz_offset * INTERVAL '1 minute') > %s
        LIMIT 200
    ''', (now_utc, now_utc - timedelta(hours=12)))
    tasks = cur.fetchall()

    # просроченные более чем на 12 часов тоже помечаем, чтобы не слать запоздало
    cur.execute(f'''
        UPDATE {DB_SCHEMA}.assistant_tasks SET reminded = TRUE
        WHERE reminded = FALSE AND due_at IS NOT NULL
          AND due_at + (tz_offset * INTERVAL '1 minute') <= %s
    ''', (now_utc - timedelta(hours=12),))
    conn.commit()

    sent = 0
    for task_id, user_id, title in tasks:
        cur.execute(f'UPDATE {DB_SCHEMA}.assistant_tasks SET reminded = TRUE WHERE id = %s AND reminded = FALSE', (task_id,))
        if cur.rowcount == 0:
            continue
        conn.commit()
        cur.execute(f'SELECT endpoint, subscription_data FROM {DB_SCHEMA}.assistant_push_subscriptions WHERE user_id = %s', (user_id,))
        payload = json.dumps({
            'title': 'Помощник: напоминание',
            'body': title,
            'icon': '/favicon.png',
            'badge': '/favicon.png',
            'tag': f'assistant-task-{task_id}',
            'requireInteraction': True,
            'data': {'url': '/assistant', 'type': 'assistant_reminder'},
        }, ensure_ascii=False)
        for endpoint, sub_data in cur.fetchall():
            try:
                parsed = urlparse(endpoint)
                webpush(
                    subscription_info=json.loads(sub_data),
                    data=payload,
                    vapid_private_key=vapid_key,
                    vapid_claims={'sub': 'mailto:noreply@erttp.ru', 'aud': f'{parsed.scheme}://{parsed.netloc}'},
                )
                sent += 1
            except WebPushException as e:
                status = e.response.status_code if e.response is not None else 0
                print(f'[ASSISTANT PUSH] failed {status}')
                if status in (404, 410):
                    cur.execute(f'DELETE FROM {DB_SCHEMA}.assistant_push_subscriptions WHERE endpoint = %s', (endpoint,))
                    conn.commit()
            except Exception as e:
                print(f'[ASSISTANT PUSH] error {e}')

    cur.close()
    conn.close()
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True, 'due': len(tasks), 'sent': sent})}

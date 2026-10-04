'''
Личный помощник «Рядом»: вход по имени и PIN-коду, чат с ИИ, память о пользователе, дела.
Независим от основной системы пользователей сайта: свои таблицы assistant_*, свой JWT.
Хранит только то, что человек сам написал; всё можно посмотреть и удалить.
Args: event - dict with httpMethod, body (action), headers (X-Assistant-Token)
      context - object with attributes: request_id
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
import re
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import jwt
import requests

DATABASE_URL = os.environ.get('DATABASE_URL')
DB_SCHEMA = os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', '')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 30
JWT_ISSUER = 'assistant-section'

MAX_MESSAGE_LEN = 2000
MAX_FACT_LEN = 300
MAX_MEMORY_FACTS = 40
HISTORY_LIMIT = 12
DAILY_LIMIT = 60

MODES = {
    'home': 'Дом и кухня: рецепты из имеющихся продуктов, пошаговая готовка, меню на неделю, список покупок, домашние дела.',
    'work': 'Работа и бизнес: письма, тексты выступлений, планы, идеи, деловое общение.',
    'study': 'Учёба: планы и черновики курсовых, презентаций, конспекты. Помогай строить текст по частям и объясняй, а не просто выдавай готовую работу.',
    'life': 'Личное: дела, напоминания, привычки, распорядок дня, советы на каждый день.',
}

SYSTEM_PROMPT = (
    'Ты добрый и спокойный личный помощник «Рядом». Говори по-русски, просто и тепло, без сложных слов. '
    'Отвечай по делу, короткими абзацами, шаги нумеруй. Если не хватает данных, задай один уточняющий вопрос. '
    'Не выдумывай факты, цены, телефоны и адреса. В вопросах здоровья, права и денег напомни, что это совет, '
    'а не замена специалисту. Если пользователь просит запомнить что-то о себе, согласись и скажи, что запомнил.'
)


def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def cors_headers() -> Dict[str, str]:
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Assistant-Token, X-User-Id',
        'Access-Control-Max-Age': '86400'
    }


def reply(status: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': cors_headers(),
        'body': json.dumps(payload, ensure_ascii=False, default=str),
        'isBase64Encoded': False
    }


def err(status: int, message: str) -> Dict[str, Any]:
    return reply(status, {'error': message})


def hash_pin(pin: str) -> str:
    return bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_pin(pin: str, pin_hash: str) -> bool:
    return bcrypt.checkpw(pin.encode('utf-8'), pin_hash.encode('utf-8'))


def make_token(user_id: int, name: str) -> str:
    payload = {
        'assistant_user_id': user_id,
        'name': name,
        'iss': JWT_ISSUER,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def user_from_event(event: Dict[str, Any]) -> Optional[int]:
    headers = event.get('headers', {}) or {}
    token = headers.get('X-Assistant-Token') or headers.get('x-assistant-token')
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('iss') != JWT_ISSUER:
            return None
        return int(payload['assistant_user_id'])
    except Exception:
        return None


def valid_name(name: str) -> bool:
    return bool(re.match(r'^[A-Za-zА-Яа-яЁё0-9 _-]{2,30}$', name or ''))


def valid_pin(pin: str) -> bool:
    return bool(re.match(r'^\d{4,6}$', pin or ''))


def clean_modes(raw: Any) -> str:
    items = raw if isinstance(raw, list) else []
    return ','.join([m for m in items if m in MODES])


def public_user(row: Dict[str, Any]) -> Dict[str, Any]:
    modes = [m for m in (row.get('modes') or '').split(',') if m]
    return {'id': row['id'], 'name': row['name'], 'modes': modes, 'about': row.get('about') or ''}


def call_ai(system: str, messages: List[Dict[str, str]], max_tokens: int = 900, temperature: float = 0.6) -> str:
    api_key = os.environ['YANDEX_API_KEY']
    folder_id = os.environ['YANDEX_FOLDER_ID']
    response = requests.post(
        'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Api-Key {api_key}',
            'x-folder-id': folder_id,
        },
        json={
            'modelUri': f'gpt://{folder_id}/yandexgpt-lite',
            'completionOptions': {'stream': False, 'temperature': temperature, 'maxTokens': max_tokens},
            'messages': [{'role': 'system', 'text': system}] + [
                {'role': m['role'], 'text': m['text']} for m in messages
            ],
        },
        timeout=40,
    )
    response.raise_for_status()
    return response.json()['result']['alternatives'][0]['message']['text'].strip()


def extract_fact(message: str) -> Optional[str]:
    '''Просим ИИ выделить из реплики один постоянный факт о человеке (аллергия, семья, профессия).'''
    system = (
        'Из сообщения пользователя выдели ОДИН устойчивый факт о нём, полезный для будущих советов '
        '(аллергия, состав семьи, профессия, предпочтения, цели). Если такого факта нет, ответь словом НЕТ. '
        'Ответ: короткая фраза до 120 символов от третьего лица, без пояснений. '
        'Не сохраняй пароли, номера карт, документы, адреса и телефоны.'
    )
    try:
        text = call_ai(system, [{'role': 'user', 'text': message}], max_tokens=60, temperature=0.1)
    except Exception:
        return None
    text = text.strip().strip('«»"')
    if not text or text.upper().startswith('НЕТ') or len(text) < 5:
        return None
    if re.search(r'\d{9,}', text):
        return None
    return text[:MAX_FACT_LEN]


ASSISTANT_ACTIONS = {
    'register', 'login', 'me', 'save_profile', 'chat', 'history', 'clear_history',
    'memory_list', 'memory_add', 'memory_delete', 'tasks_list', 'task_add', 'task_toggle',
    'task_delete', 'delete_account',
}


def handle_assistant(event: Dict[str, Any], body: Dict[str, Any]) -> Dict[str, Any]:
    '''Обработка действий помощника «Рядом» (вызывается из ai-assist по action).'''
    action = body.get('action')

    if action == 'register':
        name = (body.get('name') or '').strip()
        pin = body.get('pin') or ''
        if not valid_name(name):
            return err(400, 'Имя: от 2 до 30 символов, буквы и цифры. Можно придумать любое, настоящее не нужно')
        if not valid_pin(pin):
            return err(400, 'PIN-код должен содержать от 4 до 6 цифр')
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(f'SELECT id FROM {DB_SCHEMA}.assistant_users WHERE name_lower = %s', (name.lower(),))
                if cur.fetchone():
                    return err(409, 'Такое имя уже занято, попробуйте другое')
                cur.execute(
                    f'''INSERT INTO {DB_SCHEMA}.assistant_users (name, name_lower, pin_hash, last_login_at)
                        VALUES (%s, %s, %s, CURRENT_TIMESTAMP) RETURNING id, name, modes, about''',
                    (name, name.lower(), hash_pin(pin))
                )
                user = cur.fetchone()
                conn.commit()
                return reply(200, {'success': True, 'user': public_user(user), 'token': make_token(user['id'], user['name'])})
        finally:
            conn.close()

    if action == 'login':
        name = (body.get('name') or '').strip()
        pin = body.get('pin') or ''
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f'''SELECT id, name, pin_hash, modes, about, failed_attempts, locked_until
                        FROM {DB_SCHEMA}.assistant_users WHERE name_lower = %s''',
                    (name.lower(),)
                )
                user = cur.fetchone()
                if not user:
                    return err(401, 'Неверное имя или PIN-код')
                if user['locked_until'] and datetime.now() < user['locked_until']:
                    return err(423, 'Слишком много попыток. Подождите несколько минут и попробуйте снова')
                if not check_pin(pin, user['pin_hash']):
                    attempts = (user['failed_attempts'] or 0) + 1
                    locked = datetime.now() + timedelta(minutes=5) if attempts >= 5 else None
                    cur.execute(
                        f'UPDATE {DB_SCHEMA}.assistant_users SET failed_attempts = %s, locked_until = %s WHERE id = %s',
                        (0 if locked else attempts, locked, user['id'])
                    )
                    conn.commit()
                    return err(401, 'Неверное имя или PIN-код')
                cur.execute(
                    f'''UPDATE {DB_SCHEMA}.assistant_users
                        SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = %s''',
                    (user['id'],)
                )
                conn.commit()
                return reply(200, {'success': True, 'user': public_user(user), 'token': make_token(user['id'], user['name'])})
        finally:
            conn.close()

    user_id = user_from_event(event)
    if not user_id:
        return err(401, 'Сессия истекла, войдите снова')

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f'SELECT id, name, modes, about FROM {DB_SCHEMA}.assistant_users WHERE id = %s', (user_id,)
            )
            me = cur.fetchone()
            if not me:
                return err(401, 'Сессия истекла, войдите снова')

            if action == 'me':
                return reply(200, {'success': True, 'user': public_user(me)})

            if action == 'save_profile':
                modes = clean_modes(body.get('modes'))
                about = (body.get('about') or '').strip()[:500]
                cur.execute(
                    f'UPDATE {DB_SCHEMA}.assistant_users SET modes = %s, about = %s WHERE id = %s RETURNING id, name, modes, about',
                    (modes, about, user_id)
                )
                row = cur.fetchone()
                conn.commit()
                return reply(200, {'success': True, 'user': public_user(row)})

            if action == 'chat':
                message = (body.get('message') or '').strip()
                if not message:
                    return err(400, 'Напишите сообщение')
                if len(message) > MAX_MESSAGE_LEN:
                    return err(400, 'Сообщение слишком длинное, сократите его')

                cur.execute(
                    f'''SELECT COUNT(*) AS cnt FROM {DB_SCHEMA}.assistant_messages
                        WHERE user_id = %s AND role = 'user' AND created_at > NOW() - INTERVAL '1 day' ''',
                    (user_id,)
                )
                if cur.fetchone()['cnt'] >= DAILY_LIMIT:
                    return err(429, 'На сегодня лимит вопросов исчерпан. Возвращайтесь завтра')

                cur.execute(
                    f'SELECT fact FROM {DB_SCHEMA}.assistant_memory WHERE user_id = %s ORDER BY id DESC LIMIT %s',
                    (user_id, MAX_MEMORY_FACTS)
                )
                facts = [r['fact'] for r in cur.fetchall()]

                cur.execute(
                    f'''SELECT role, content FROM {DB_SCHEMA}.assistant_messages
                        WHERE user_id = %s ORDER BY id DESC LIMIT %s''',
                    (user_id, HISTORY_LIMIT)
                )
                history = list(reversed(cur.fetchall()))

                mode_lines = [MODES[m] for m in (me['modes'] or '').split(',') if m in MODES]
                system = SYSTEM_PROMPT
                system += f"\nИмя пользователя: {me['name']}."
                if mode_lines:
                    system += '\nС чем пользователь просит помогать:\n- ' + '\n- '.join(mode_lines)
                if me['about']:
                    system += f"\nО себе пользователь рассказал: {me['about']}"
                if facts:
                    system += '\nЧто ты помнишь о пользователе:\n- ' + '\n- '.join(facts)

                ai_messages = [{'role': h['role'], 'text': h['content']} for h in history]
                ai_messages.append({'role': 'user', 'text': message})

                try:
                    answer = call_ai(system, ai_messages)
                except Exception:
                    return err(502, 'Помощник сейчас занят, попробуйте через минуту')

                cur.execute(
                    f"INSERT INTO {DB_SCHEMA}.assistant_messages (user_id, role, content) VALUES (%s, 'user', %s)",
                    (user_id, message)
                )
                cur.execute(
                    f"INSERT INTO {DB_SCHEMA}.assistant_messages (user_id, role, content) VALUES (%s, 'assistant', %s)",
                    (user_id, answer)
                )
                conn.commit()

                remembered = None
                if len(facts) < MAX_MEMORY_FACTS and re.search(
                    r'запомни|я живу|у меня|мой |моя |моё |мои |я работаю|я учусь|аллерги|не ем|не люблю|люблю|мы с |нас ', message.lower()
                ):
                    fact = extract_fact(message)
                    if fact and fact.lower() not in [f.lower() for f in facts]:
                        cur.execute(
                            f'INSERT INTO {DB_SCHEMA}.assistant_memory (user_id, fact) VALUES (%s, %s)',
                            (user_id, fact)
                        )
                        conn.commit()
                        remembered = fact

                return reply(200, {'success': True, 'answer': answer, 'remembered': remembered})

            if action == 'history':
                cur.execute(
                    f'''SELECT id, role, content, created_at FROM {DB_SCHEMA}.assistant_messages
                        WHERE user_id = %s ORDER BY id DESC LIMIT 40''',
                    (user_id,)
                )
                return reply(200, {'success': True, 'messages': list(reversed(cur.fetchall()))})

            if action == 'clear_history':
                cur.execute(f'DELETE FROM {DB_SCHEMA}.assistant_messages WHERE user_id = %s', (user_id,))
                conn.commit()
                return reply(200, {'success': True})

            if action == 'memory_list':
                cur.execute(
                    f'SELECT id, fact FROM {DB_SCHEMA}.assistant_memory WHERE user_id = %s ORDER BY id DESC', (user_id,)
                )
                return reply(200, {'success': True, 'facts': cur.fetchall()})

            if action == 'memory_add':
                fact = (body.get('fact') or '').strip()[:MAX_FACT_LEN]
                if len(fact) < 3:
                    return err(400, 'Напишите, что запомнить')
                cur.execute(f'SELECT COUNT(*) AS cnt FROM {DB_SCHEMA}.assistant_memory WHERE user_id = %s', (user_id,))
                if cur.fetchone()['cnt'] >= MAX_MEMORY_FACTS:
                    return err(400, 'Памяти много, удалите что-то лишнее')
                cur.execute(
                    f'INSERT INTO {DB_SCHEMA}.assistant_memory (user_id, fact) VALUES (%s, %s) RETURNING id, fact',
                    (user_id, fact)
                )
                row = cur.fetchone()
                conn.commit()
                return reply(200, {'success': True, 'fact': row})

            if action == 'memory_delete':
                cur.execute(
                    f'DELETE FROM {DB_SCHEMA}.assistant_memory WHERE id = %s AND user_id = %s',
                    (body.get('id'), user_id)
                )
                conn.commit()
                return reply(200, {'success': True})

            if action == 'tasks_list':
                cur.execute(
                    f'''SELECT id, title, due_at, done FROM {DB_SCHEMA}.assistant_tasks
                        WHERE user_id = %s ORDER BY done ASC, due_at ASC NULLS LAST, id DESC LIMIT 100''',
                    (user_id,)
                )
                return reply(200, {'success': True, 'tasks': cur.fetchall()})

            if action == 'task_add':
                title = (body.get('title') or '').strip()[:200]
                if len(title) < 2:
                    return err(400, 'Напишите, что нужно сделать')
                due_raw = body.get('due_at')
                due_at = None
                if due_raw:
                    try:
                        due_at = datetime.fromisoformat(str(due_raw).replace('Z', ''))
                    except ValueError:
                        return err(400, 'Не удалось понять дату')
                cur.execute(
                    f'''INSERT INTO {DB_SCHEMA}.assistant_tasks (user_id, title, due_at)
                        VALUES (%s, %s, %s) RETURNING id, title, due_at, done''',
                    (user_id, title, due_at)
                )
                row = cur.fetchone()
                conn.commit()
                return reply(200, {'success': True, 'task': row})

            if action == 'task_toggle':
                cur.execute(
                    f'''UPDATE {DB_SCHEMA}.assistant_tasks SET done = NOT done
                        WHERE id = %s AND user_id = %s RETURNING id, title, due_at, done''',
                    (body.get('id'), user_id)
                )
                row = cur.fetchone()
                conn.commit()
                if not row:
                    return err(404, 'Дело не найдено')
                return reply(200, {'success': True, 'task': row})

            if action == 'task_delete':
                cur.execute(
                    f'DELETE FROM {DB_SCHEMA}.assistant_tasks WHERE id = %s AND user_id = %s',
                    (body.get('id'), user_id)
                )
                conn.commit()
                return reply(200, {'success': True})

            if action == 'delete_account':
                for table in ('assistant_messages', 'assistant_memory', 'assistant_tasks'):
                    cur.execute(f'DELETE FROM {DB_SCHEMA}.{table} WHERE user_id = %s', (user_id,))
                cur.execute(f'DELETE FROM {DB_SCHEMA}.assistant_users WHERE id = %s', (user_id,))
                conn.commit()
                return reply(200, {'success': True})
    finally:
        conn.close()

    return err(400, 'Неизвестное действие')

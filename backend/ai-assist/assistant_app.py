'''
Личный ассистент «Ассистент»: вход по имени и PIN-коду, чат с ИИ, память о пользователе, дела.
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
from urllib.parse import quote

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
    'Ты добрый и спокойный личный ассистент по имени «Ассистент». Говори по-русски, просто и тепло, без сложных слов. '
    'Ты можешь ответить на любой вопрос по любой теме, как умный поисковик: при необходимости ищи свежую информацию в интернете. '
    'Отвечай по делу, короткими абзацами, шаги нумеруй. Если не хватает данных, задай один уточняющий вопрос. '
    'Не выдумывай факты, цены, телефоны, адреса и ссылки. В вопросах здоровья, права и денег коротко напомни, что это совет, '
    'а не замена специалисту, но всё равно дай полезный ответ. Если пользователь просит запомнить что-то о себе, согласись и скажи, что запомнил. '
    'Если вопрос про «как сделать», ремонт, настройку, рецепт, упражнение и подобное, где полезна видео или фото инструкция, '
    'в самом конце ответа добавь отдельную строку строго в формате: ВИДЕО: короткий поисковый запрос на русском. '
    'Видео-строку добавляй ТОЛЬКО для вопросов «как сделать»; для вопросов о фактах, бирже, новостях, ценах и т.п. её не добавляй. '
    'Не пиши сам ссылки на видео, их добавит система. '
    'Относись к каждому вопросу серьёзно и с заботой: сначала дай прямой ответ по существу, затем при необходимости пояснение и ссылку на официальный источник. '
    'Никогда не отвечай просто «у меня нет информации»: дай всё, что знаешь, честно отметь, что именно стоит уточнить, и подскажи, где проверить.'
)

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def cors_headers() -> Dict[str, str]:
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Assistant-Token, X-User-Id, Authorization, X-Authorization',
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


GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']


def call_gemini(system: str, messages: List[Dict[str, str]], max_tokens: int = 1500) -> Dict[str, Any]:
    last = None
    for model in GEMINI_MODELS:
        try:
            res = _call_gemini_model(model, system, messages, max_tokens)
            if res['text']:
                return res
            last = ValueError(f'{model}: empty answer')
        except Exception as e:
            last = e
            print(f'[gemini] {model} failed: {e}')
    raise last or ValueError('gemini failed')


def _call_gemini_model(model: str, system: str, messages: List[Dict[str, str]], max_tokens: int) -> Dict[str, Any]:
    api_key = os.environ['GEMINI_API_KEY']
    contents = [
        {'role': 'user' if m['role'] == 'user' else 'model', 'parts': [{'text': m['text']}]}
        for m in messages
    ]
    response = requests.post(
        f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        headers={'Content-Type': 'application/json', 'x-goog-api-key': api_key},
        json={
            'system_instruction': {'parts': [{'text': system}]},
            'contents': contents,
            'tools': [{'google_search': {}}],
            'generationConfig': dict(
                {'temperature': 0.6, 'maxOutputTokens': max_tokens},
                **({'thinkingConfig': {'thinkingBudget': 0}} if '2.5' in model else {}),
            ),
        },
        timeout=40,
    )
    if response.status_code >= 400:
        raise RuntimeError(f'HTTP {response.status_code}: {response.text[:300]}')
    cand = response.json()['candidates'][0]
    text = ''.join(p.get('text', '') for p in (cand.get('content') or {}).get('parts', [])).strip()
    sources = []
    for ch in (cand.get('groundingMetadata') or {}).get('groundingChunks', []):
        web = ch.get('web') or {}
        if web.get('uri'):
            sources.append({'title': web.get('title') or '', 'uri': web['uri']})
    return {'text': text, 'sources': sources}


def call_openai_search(system: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    api_key = os.environ['OPENAI_API_KEY']
    response = requests.post(
        'https://api.openai.com/v1/responses',
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
        json={
            'model': 'gpt-4o-mini',
            'instructions': system,
            'input': [{'role': m['role'], 'content': m['text']} for m in messages],
            'tools': [{'type': 'web_search_preview'}],
            'max_output_tokens': 1500,
        },
        timeout=40,
    )
    if response.status_code >= 400:
        raise RuntimeError(f'OpenAI HTTP {response.status_code}: {response.text[:300]}')
    text, sources = '', []
    for item in response.json().get('output', []):
        if item.get('type') != 'message':
            continue
        for c in item.get('content', []):
            if c.get('type') == 'output_text':
                text += c.get('text', '')
                for a in c.get('annotations', []):
                    if a.get('type') == 'url_citation' and a.get('url'):
                        sources.append({'title': a.get('title') or '', 'uri': a['url']})
    return {'text': text.strip(), 'sources': sources}


def build_answer(raw: str, sources: List[Dict[str, str]]) -> str:
    video_query = ''
    lines = []
    for line in raw.splitlines():
        m = re.match(r'^\s*\**ВИДЕО:\**\s*(.+)$', line.strip())
        if m:
            video_query = m.group(1).strip(' *')[:120]
        else:
            lines.append(line)
    answer = '\n'.join(lines).strip()
    if video_query:
        q = quote(video_query)
        answer += (
            '\n\nСмотреть: '
            f'[Rutube](https://rutube.ru/search/?query={q}) · '
            f'[YouTube](https://www.youtube.com/results?search_query={q}) · '
            f'[Фото](https://yandex.ru/images/search?text={q})'
        )
    seen = set()
    src_lines = []
    for src in sources:
        if src['uri'] in seen:
            continue
        seen.add(src['uri'])
        src_lines.append(f"[{(src['title'] or 'Источник')[:60]}]({src['uri']})")
        if len(src_lines) >= 3:
            break
    if src_lines:
        answer += '\n\nГде прочитать подробнее:\n' + '\n'.join(src_lines)
    return answer


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
    'task_delete', 'delete_account', 'push_subscribe', 'push_unsubscribe', 'popular_list', 'popular_answer', 'site_login',
}


def handle_assistant(event: Dict[str, Any], body: Dict[str, Any]) -> Dict[str, Any]:
    '''Обработка действий ассистента (вызывается из ai-assist по action).'''
    action = body.get('action')

    if action == 'site_login':
        headers = event.get('headers', {}) or {}
        auth = headers.get('X-Authorization') or headers.get('x-authorization') or headers.get('Authorization') or ''
        raw = auth[7:] if auth.startswith('Bearer ') else auth
        try:
            payload = jwt.decode(raw, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            site_id = int(payload['user_id'])
        except Exception:
            return err(401, 'Войдите в профиль на сайте')
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(f'SELECT id, name, modes, about FROM {DB_SCHEMA}.assistant_users WHERE site_user_id = %s', (site_id,))
                row = cur.fetchone()
                if not row:
                    cur.execute(f'SELECT first_name FROM {DB_SCHEMA}.users WHERE id = %s', (site_id,))
                    u = cur.fetchone()
                    if not u:
                        return err(401, 'Войдите в профиль на сайте')
                    base = re.sub(r'[^A-Za-zА-Яа-яЁё0-9 _-]', '', u['first_name'] or '').strip()[:24]
                    if len(base) < 2:
                        base = 'Друг'
                    name = base
                    cur.execute(f'SELECT 1 FROM {DB_SCHEMA}.assistant_users WHERE name_lower = %s', (name.lower(),))
                    if cur.fetchone():
                        name = f'{base}-{site_id}'[:30]
                    cur.execute(
                        f'''INSERT INTO {DB_SCHEMA}.assistant_users (name, name_lower, pin_hash, site_user_id, last_login_at)
                            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP) RETURNING id, name, modes, about''',
                        (name, name.lower(), hash_pin(os.urandom(12).hex()), site_id)
                    )
                    row = cur.fetchone()
                else:
                    cur.execute(f'UPDATE {DB_SCHEMA}.assistant_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = %s', (row['id'],))
                conn.commit()
                return reply(200, {'success': True, 'user': public_user(row), 'token': make_token(row['id'], row['name'])})
        finally:
            conn.close()

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

    if action == 'popular_list':
        from popular_questions import public_categories
        return reply(200, {'success': True, 'categories': public_categories()})

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
                    g = call_gemini(system, ai_messages)
                    if not g['text']:
                        raise ValueError('empty')
                    answer = build_answer(g['text'], g['sources'])
                except Exception as e:
                    print(f'[assistant] gemini error: {e}')
                    answer = None
                    try:
                        o = call_openai_search(system, ai_messages)
                        if o['text']:
                            answer = build_answer(o['text'], o['sources'])
                    except Exception as e2:
                        print(f'[assistant] openai error: {e2}')
                    if not answer:
                        try:
                            print('[assistant] fallback to yandex')
                            raw = call_ai(system + '\nУ тебя сейчас нет доступа к интернету. Ответь по своим знаниям как можно полезнее, уверенно и по существу. Если вопрос про сайт или сервис, назови его официальный адрес, если он тебе точно известен. Коротко предупреди, что свежие данные лучше сверить по ссылке ниже. Не пиши фразу «у меня нет информации».', ai_messages, max_tokens=900)
                            answer = build_answer(raw, [])
                            answer += '\n\nПроверить в интернете:\n' + f'[Найти в Яндексе: {message[:50]}](https://yandex.ru/search/?text={quote(message[:150])})'
                        except Exception:
                            return err(502, 'Ассистент сейчас занят, попробуйте через минуту')

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

            if action == 'popular_answer':
                from popular_questions import QUESTION_TEXT
                qid = (body.get('id') or '').strip()
                question = QUESTION_TEXT.get(qid)
                if not question:
                    return err(400, 'Такого вопроса нет в списке')
                cur.execute(
                    f"SELECT answer FROM {DB_SCHEMA}.assistant_popular_answers WHERE question_id = %s AND created_at > NOW() - INTERVAL '30 days'",
                    (qid,)
                )
                cached = cur.fetchone()
                if cached:
                    return reply(200, {'success': True, 'question': question, 'answer': cached['answer']})
                pop_system = (
                    'Ты опытный и добрый консультант. Отвечай по-русски, понятно для обычного человека, подробно и по делу. '
                    'Структура: короткое вступление, затем пошаговая инструкция или список советов с нумерацией, '
                    'в конце важные предостережения и что делать, если не получилось. Используй актуальную информацию из интернета. '
                    'Не выдумывай факты, цены и ссылки. По здоровью, праву и деньгам добавь, что это общая информация, а не замена специалисту. '
                    'Последней строкой добавь: ВИДЕО: короткий поисковый запрос на русском для поиска видео и фото инструкции. '
                    'Ссылки на видео сам не пиши.'
                )
                try:
                    g = call_gemini(pop_system, [{'role': 'user', 'text': question}], max_tokens=2500)
                    if not g['text']:
                        raise ValueError('empty')
                    answer = build_answer(g['text'], g['sources'])
                except Exception:
                    try:
                        answer = build_answer(call_ai(pop_system, [{'role': 'user', 'text': question}], max_tokens=1500), [])
                    except Exception:
                        return err(502, 'Не удалось подготовить ответ, попробуйте через минуту')
                cur.execute(
                    f'''INSERT INTO {DB_SCHEMA}.assistant_popular_answers (question_id, answer) VALUES (%s, %s)
                        ON CONFLICT (question_id) DO UPDATE SET answer = EXCLUDED.answer, created_at = CURRENT_TIMESTAMP''',
                    (qid, answer)
                )
                conn.commit()
                return reply(200, {'success': True, 'question': question, 'answer': answer})

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
                try:
                    tz_offset = int(body.get('tz_offset', -180))
                except (TypeError, ValueError):
                    tz_offset = -180
                if tz_offset < -840 or tz_offset > 840:
                    tz_offset = -180
                cur.execute(
                    f'''INSERT INTO {DB_SCHEMA}.assistant_tasks (user_id, title, due_at, tz_offset)
                        VALUES (%s, %s, %s, %s) RETURNING id, title, due_at, done''',
                    (user_id, title, due_at, tz_offset)
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

            if action == 'push_subscribe':
                sub = body.get('subscription') or {}
                endpoint = sub.get('endpoint') if isinstance(sub, dict) else None
                if not endpoint or not isinstance(sub.get('keys'), dict):
                    return err(400, 'Не удалось включить уведомления')
                cur.execute(
                    f'''INSERT INTO {DB_SCHEMA}.assistant_push_subscriptions (user_id, endpoint, subscription_data)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id,
                        subscription_data = EXCLUDED.subscription_data''',
                    (user_id, endpoint, json.dumps(sub))
                )
                conn.commit()
                return reply(200, {'success': True})

            if action == 'push_unsubscribe':
                cur.execute(
                    f'DELETE FROM {DB_SCHEMA}.assistant_push_subscriptions WHERE user_id = %s',
                    (user_id,)
                )
                conn.commit()
                return reply(200, {'success': True})

            if action == 'delete_account':
                for table in ('assistant_messages', 'assistant_memory', 'assistant_tasks', 'assistant_push_subscriptions'):
                    cur.execute(f'DELETE FROM {DB_SCHEMA}.{table} WHERE user_id = %s', (user_id,))
                cur.execute(f'DELETE FROM {DB_SCHEMA}.assistant_users WHERE id = %s', (user_id,))
                conn.commit()
                return reply(200, {'success': True})
    finally:
        conn.close()

    return err(400, 'Неизвестное действие')

'''
Чат внутри игровой комнаты: отправка и получение сообщений.
Args: event - dict with httpMethod, body, queryStringParameters, headers (X-Game-Token)
      context - object with attributes: request_id
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
import base64
import uuid
import boto3
import requests
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt

DATABASE_URL = os.environ.get('DATABASE_URL')
DB_SCHEMA = os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', '')
JWT_ALGORITHM = 'HS256'
GAME_JWT_ISSUER = 'games-section'

PUSH_SEND_URL = 'https://functions.poehali.dev/a1c8fafd-b64f-45e5-b9b9-0a050cca4f7a'
GAME_TITLES = {'chess': 'Шахматы', 'checkers': 'Шашки', 'poker': 'Покер'}
PUSH_COOLDOWN_SECONDS = 20


def notify_chat_message(room_id: int, recipients, sender: str, game_type: str, message: str, media_type) -> None:
    if media_type == 'image':
        preview = 'отправил(а) фото'
    elif media_type == 'audio':
        preview = 'отправил(а) голосовое сообщение'
    else:
        preview = message[:100]
    for uid in recipients:
        try:
            requests.post(
                PUSH_SEND_URL,
                json={
                    'userId': f'game_{uid}',
                    'title': f'💬 {sender} · {GAME_TITLES.get(game_type, "Игра")}',
                    'message': preview,
                    'url': f'/games/room/{room_id}',
                    'type': 'game_chat',
                },
                timeout=3,
            )
        except Exception:
            pass


def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def get_user_from_token(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    headers = event.get('headers', {}) or {}
    token = headers.get('X-Game-Token') or headers.get('x-game-token')
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('iss') != GAME_JWT_ISSUER:
            return None
        return {'id': payload['game_user_id'], 'nickname': payload['nickname']}
    except Exception:
        return None


def cors_headers() -> Dict[str, str]:
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Game-Token',
        'Access-Control-Max-Age': '86400'
    }


MEDIA_TYPES = {
    'image/jpeg': ('image', 'jpg', 3 * 1024 * 1024),
    'image/png': ('image', 'png', 3 * 1024 * 1024),
    'image/webp': ('image', 'webp', 3 * 1024 * 1024),
    'audio/webm': ('audio', 'webm', 2 * 1024 * 1024),
    'audio/ogg': ('audio', 'ogg', 2 * 1024 * 1024),
    'audio/mp4': ('audio', 'm4a', 2 * 1024 * 1024),
    'audio/mpeg': ('audio', 'mp3', 2 * 1024 * 1024),
}


def upload_media(room_id: int, data_url: str):
    if not data_url.startswith('data:') or ',' not in data_url:
        return None
    head, b64 = data_url.split(',', 1)
    mime = head[5:].split(';')[0]
    if mime not in MEDIA_TYPES:
        return None
    kind, ext, limit = MEDIA_TYPES[mime]
    raw = base64.b64decode(b64)
    if len(raw) > limit:
        return None
    s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
                      aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                      aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
    key = f"game-chat/{room_id}/{uuid.uuid4().hex}.{ext}"
    s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=mime)
    return kind, f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def error_response(status: int, message: str) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': cors_headers(),
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': '', 'isBase64Encoded': False}

    user = get_user_from_token(event)
    if not user:
        return error_response(401, 'Требуется вход в игровой раздел')

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        room_id = params.get('room_id')
        if not room_id:
            return error_response(400, 'room_id обязателен')

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT c.id, c.user_id, c.message, c.created_at, c.is_system, c.media_url, c.media_type, u.nickname, u.avatar_emoji, u.avatar_url
                       FROM {DB_SCHEMA}.game_chat_messages c
                       JOIN {DB_SCHEMA}.game_users u ON u.id = c.user_id
                       WHERE c.room_id = %s
                       ORDER BY c.created_at ASC LIMIT 200""",
                    (room_id,)
                )
                messages = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': cors_headers(),
                    'body': json.dumps([dict(m) for m in messages], default=str),
                    'isBase64Encoded': False
                }
        finally:
            conn.close()

    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
        except (json.JSONDecodeError, TypeError):
            return error_response(400, 'Некорректный запрос')

        room_id = body.get('room_id')
        message = (body.get('message') or '').strip()[:500]
        media = body.get('media')

        if not room_id or (not message and not media):
            return error_response(400, 'room_id и message обязательны')

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id FROM {DB_SCHEMA}.game_room_players WHERE room_id = %s AND user_id = %s",
                    (room_id, user['id'])
                )
                if not cur.fetchone():
                    return error_response(403, 'Вы не участник этой комнаты')

                cur.execute(
                    f"""SELECT COUNT(*) AS n FROM {DB_SCHEMA}.game_chat_messages
                       WHERE room_id = %s AND user_id = %s AND is_system = FALSE
                         AND created_at > NOW() - INTERVAL '{PUSH_COOLDOWN_SECONDS} seconds'""",
                    (room_id, user['id'])
                )
                recently_sent = cur.fetchone()['n'] > 0

                media_type = None
                media_url = None
                if media:
                    uploaded = upload_media(room_id, media)
                    if not uploaded:
                        return error_response(400, 'Файл не подходит: слишком большой или неподдерживаемый формат')
                    media_type, media_url = uploaded
                    if not message:
                        message = '🎤 Голосовое сообщение' if media_type == 'audio' else '📷 Фото'

                cur.execute(
                    f"""INSERT INTO {DB_SCHEMA}.game_chat_messages (room_id, user_id, message, media_url, media_type)
                       VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at""",
                    (room_id, user['id'], message, media_url, media_type)
                )
                result = cur.fetchone()
                conn.commit()

                if not recently_sent:
                    cur.execute(
                        f"""SELECT p.user_id, r.game_type FROM {DB_SCHEMA}.game_room_players p
                           JOIN {DB_SCHEMA}.game_rooms r ON r.id = p.room_id
                           WHERE p.room_id = %s AND p.user_id <> %s""",
                        (room_id, user['id'])
                    )
                    rows = cur.fetchall()
                    if rows:
                        notify_chat_message(room_id, [r['user_id'] for r in rows], user['nickname'], rows[0]['game_type'], message, media_type)

                return {
                    'statusCode': 200,
                    'headers': cors_headers(),
                    'body': json.dumps({
                        'success': True,
                        'id': result['id'],
                        'created_at': str(result['created_at'])
                    }),
                    'isBase64Encoded': False
                }
        finally:
            conn.close()

    return error_response(405, 'Method not allowed')
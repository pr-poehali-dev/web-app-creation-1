'''
Чат внутри игровой комнаты: отправка и получение сообщений.
Args: event - dict with httpMethod, body, queryStringParameters, headers (X-Game-Token)
      context - object with attributes: request_id
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt

DATABASE_URL = os.environ.get('DATABASE_URL')
DB_SCHEMA = os.environ.get('DB_SCHEMA', 'public')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', '')
JWT_ALGORITHM = 'HS256'
GAME_JWT_ISSUER = 'games-section'


def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    with conn.cursor() as cur:
        cur.execute(f"SET search_path TO {DB_SCHEMA}")
    return conn


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
                    """SELECT c.id, c.user_id, c.message, c.created_at, u.nickname, u.avatar_emoji
                       FROM game_chat_messages c
                       JOIN game_users u ON u.id = c.user_id
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

        if not room_id or not message:
            return error_response(400, 'room_id и message обязательны')

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM game_room_players WHERE room_id = %s AND user_id = %s",
                    (room_id, user['id'])
                )
                if not cur.fetchone():
                    return error_response(403, 'Вы не участник этой комнаты')

                cur.execute(
                    """INSERT INTO game_chat_messages (room_id, user_id, message)
                       VALUES (%s, %s, %s) RETURNING id, created_at""",
                    (room_id, user['id'], message)
                )
                result = cur.fetchone()
                conn.commit()

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

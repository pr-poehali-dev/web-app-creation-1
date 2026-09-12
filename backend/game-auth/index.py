'''
Аутентификация пользователей игрового раздела (шахматы/шашки/покер).
Независима от основной системы пользователей сайта — свои таблицы, свой JWT.
Args: event - dict with httpMethod, body (action: register|login|verify)
      context - object with attributes: request_id
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
import re
from typing import Dict, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import jwt

DATABASE_URL = os.environ.get('DATABASE_URL')
DB_SCHEMA = os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', '')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 30
GAME_JWT_ISSUER = 'games-section'


def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def hash_pin(pin: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pin.encode('utf-8'), salt).decode('utf-8')


def verify_pin(pin: str, pin_hash: str) -> bool:
    return bcrypt.checkpw(pin.encode('utf-8'), pin_hash.encode('utf-8'))


def generate_game_token(user_id: int, nickname: str) -> str:
    payload = {
        'game_user_id': user_id,
        'nickname': nickname,
        'iss': GAME_JWT_ISSUER,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def validate_nickname(nickname: str) -> bool:
    return bool(re.match(r'^[A-Za-zА-Яа-яЁё0-9_]{3,20}$', nickname or ''))


def validate_pin(pin: str) -> bool:
    return bool(re.match(r'^\d{4,6}$', pin or ''))


def cors_headers() -> Dict[str, str]:
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Game-Token',
        'Access-Control-Max-Age': '86400'
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': '', 'isBase64Encoded': False}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    try:
        body = json.loads(event.get('body', '{}'))
    except (json.JSONDecodeError, TypeError):
        return {
            'statusCode': 400,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Некорректный запрос'}),
            'isBase64Encoded': False
        }

    action = body.get('action')

    if action == 'register':
        nickname = (body.get('nickname') or '').strip()
        pin = body.get('pin') or ''

        if not validate_nickname(nickname):
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Никнейм: 3-20 символов, буквы/цифры/подчёркивание'}),
                'isBase64Encoded': False
            }
        if not validate_pin(pin):
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'PIN-код должен содержать 4-6 цифр'}),
                'isBase64Encoded': False
            }

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT id FROM {DB_SCHEMA}.game_users WHERE nickname = %s", (nickname,))
                if cur.fetchone():
                    return {
                        'statusCode': 409,
                        'headers': cors_headers(),
                        'body': json.dumps({'error': 'Такой никнейм уже занят'}),
                        'isBase64Encoded': False
                    }

                pin_hash = hash_pin(pin)
                cur.execute(
                    f"""INSERT INTO {DB_SCHEMA}.game_users (nickname, pin_hash, last_login_at)
                       VALUES (%s, %s, CURRENT_TIMESTAMP)
                       RETURNING id, nickname, avatar_emoji, chips_balance, games_played, games_won""",
                    (nickname, pin_hash)
                )
                user = cur.fetchone()
                conn.commit()

                token = generate_game_token(user['id'], user['nickname'])
                return {
                    'statusCode': 200,
                    'headers': cors_headers(),
                    'body': json.dumps({'success': True, 'user': dict(user), 'token': token}),
                    'isBase64Encoded': False
                }
        finally:
            conn.close()

    elif action == 'login':
        nickname = (body.get('nickname') or '').strip()
        pin = body.get('pin') or ''

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, nickname, pin_hash, avatar_emoji, chips_balance, games_played, games_won
                       FROM {DB_SCHEMA}.game_users WHERE nickname = %s""",
                    (nickname,)
                )
                user = cur.fetchone()

                if not user or not verify_pin(pin, user['pin_hash']):
                    return {
                        'statusCode': 401,
                        'headers': cors_headers(),
                        'body': json.dumps({'error': 'Неверный никнейм или PIN-код'}),
                        'isBase64Encoded': False
                    }

                cur.execute(
                    f"UPDATE {DB_SCHEMA}.game_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (user['id'],)
                )
                conn.commit()

                user_data = {k: v for k, v in dict(user).items() if k != 'pin_hash'}
                token = generate_game_token(user['id'], user['nickname'])
                return {
                    'statusCode': 200,
                    'headers': cors_headers(),
                    'body': json.dumps({'success': True, 'user': user_data, 'token': token}),
                    'isBase64Encoded': False
                }
        finally:
            conn.close()

    elif action == 'verify':
        token = body.get('token') or ''
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get('iss') != GAME_JWT_ISSUER:
                raise jwt.InvalidTokenError('Wrong issuer')

            conn = get_db_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        f"""SELECT id, nickname, avatar_emoji, chips_balance, games_played, games_won
                           FROM {DB_SCHEMA}.game_users WHERE id = %s""",
                        (payload['game_user_id'],)
                    )
                    user = cur.fetchone()
                    if not user:
                        raise ValueError('User not found')

                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps({'success': True, 'user': dict(user)}),
                        'isBase64Encoded': False
                    }
            finally:
                conn.close()
        except Exception:
            return {
                'statusCode': 401,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Сессия истекла, войдите снова'}),
                'isBase64Encoded': False
            }

    return {
        'statusCode': 400,
        'headers': cors_headers(),
        'body': json.dumps({'error': 'Неизвестное действие'}),
        'isBase64Encoded': False
    }
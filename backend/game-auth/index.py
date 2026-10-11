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
import secrets
import base64
import uuid
import boto3
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

        if not validate_nickname(nickname):
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Никнейм: 3-20 символов, буквы/цифры/подчёркивание'}),
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

                pin_hash = hash_pin(secrets.token_hex(16))
                cur.execute(
                    f"""INSERT INTO {DB_SCHEMA}.game_users (nickname, pin_hash, last_login_at)
                       VALUES (%s, %s, CURRENT_TIMESTAMP)
                       RETURNING id, nickname, avatar_emoji, avatar_url, chips_balance, games_played, games_won""",
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

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, nickname, avatar_emoji, avatar_url, chips_balance, games_played, games_won
                       FROM {DB_SCHEMA}.game_users WHERE nickname = %s""",
                    (nickname,)
                )
                user = cur.fetchone()

                if not user:
                    return {
                        'statusCode': 401,
                        'headers': cors_headers(),
                        'body': json.dumps({'error': 'Игрок с таким никнеймом не найден'}),
                        'isBase64Encoded': False
                    }

                cur.execute(
                    f"UPDATE {DB_SCHEMA}.game_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (user['id'],)
                )
                conn.commit()

                user_data = dict(user)
                token = generate_game_token(user['id'], user['nickname'])
                return {
                    'statusCode': 200,
                    'headers': cors_headers(),
                    'body': json.dumps({'success': True, 'user': user_data, 'token': token}),
                    'isBase64Encoded': False
                }
        finally:
            conn.close()

    elif action in ('set_avatar', 'clear_avatar'):
        token = body.get('token') or ''
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get('iss') != GAME_JWT_ISSUER:
                raise jwt.InvalidTokenError('Wrong issuer')
        except Exception:
            return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Нужно войти заново'}), 'isBase64Encoded': False}

        avatar_url = None
        if action == 'set_avatar':
            data_url = body.get('image') or ''
            mime = data_url[5:].split(';')[0] if data_url.startswith('data:') else ''
            exts = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}
            if mime not in exts or ',' not in data_url:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Нужна картинка JPG, PNG или WebP'}), 'isBase64Encoded': False}
            raw = base64.b64decode(data_url.split(',', 1)[1])
            if len(raw) > 2 * 1024 * 1024:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Картинка слишком большая'}), 'isBase64Encoded': False}
            s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
                              aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                              aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            key = f"game-avatars/{payload['game_user_id']}_{uuid.uuid4().hex[:8]}.{exts[mime]}"
            s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=mime)
            avatar_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {DB_SCHEMA}.game_users SET avatar_url = %s WHERE id = %s",
                    (avatar_url, payload['game_user_id'])
                )
                conn.commit()
                return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'success': True, 'avatar_url': avatar_url}), 'isBase64Encoded': False}
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
                        f"""SELECT id, nickname, avatar_emoji, avatar_url, chips_balance, games_played, games_won
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
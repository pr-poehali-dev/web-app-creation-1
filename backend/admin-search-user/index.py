'''
API для поиска пользователя по email (для назначения администратором)
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt

DATABASE_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'fallback-dev-secret-DO-NOT-USE-IN-PRODUCTION')
JWT_ALGORITHM = 'HS256'

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def verify_superadmin(token: str) -> dict:
    '''Проверка, что пользователь - суперадминистратор'''
    if not token:
        return None
    
    try:
        token = token.replace('Bearer ', '').strip()
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, email, role, is_root_admin FROM users WHERE id = %s AND removed_at IS NULL",
                (user_id,)
            )
            user = cur.fetchone()
            conn.close()
            
            if user and user['role'] == 'superadmin':
                return dict(user)
        return None
    except:
        return None

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    admin_user = verify_superadmin(auth_header)
    
    if not admin_user:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Доступ запрещён. Только для суперадминистраторов'}),
            'isBase64Encoded': False
        }
    
    # Только главный суперадмин может искать пользователей для назначения
    if not admin_user.get('is_root_admin'):
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Только главный суперадминистратор может назначать роли'}),
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters') or {}
    email = query_params.get('email', '').strip()
    
    if not email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email обязателен'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, email, first_name, last_name, middle_name, user_type, 
                   phone, role, is_root_admin, created_at, is_active
                   FROM users 
                   WHERE email = %s AND removed_at IS NULL""",
                (email,)
            )
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user': dict(user)
                }, default=str),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            conn.close()

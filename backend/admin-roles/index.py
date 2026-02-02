'''
API для управления ролями администраторов
Только суперадминистраторы могут назначать и снимать роли
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
                "SELECT id, email, role FROM users WHERE id = %s AND removed_at IS NULL",
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    
    conn = get_db_connection()
    
    try:
        if method == 'GET':
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id, email, first_name, last_name, role, created_at 
                       FROM users 
                       WHERE role IN ('moderator', 'admin', 'superadmin') AND removed_at IS NULL
                       ORDER BY 
                           CASE role 
                               WHEN 'superadmin' THEN 1
                               WHEN 'admin' THEN 2
                               WHEN 'moderator' THEN 3
                           END,
                           created_at DESC"""
                )
                admins = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'admins': [dict(a) for a in admins]
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            user_email = body_data.get('email', '').strip()
            new_role = body_data.get('role', '').strip()
            
            if action == 'set_role':
                if not user_email or not new_role:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email и роль обязательны'}),
                        'isBase64Encoded': False
                    }
                
                if new_role not in ['user', 'moderator', 'admin', 'superadmin']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Недопустимая роль'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT id, email, role FROM users WHERE email = %s AND removed_at IS NULL",
                        (user_email,)
                    )
                    target_user = cur.fetchone()
                    
                    if not target_user:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Пользователь не найден'}),
                            'isBase64Encoded': False
                        }
                    
                    if target_user['id'] == admin_user['id'] and new_role != 'superadmin':
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Нельзя изменить свою роль суперадминистратора'}),
                            'isBase64Encoded': False
                        }
                    
                    old_role = target_user['role']
                    
                    cur.execute(
                        "UPDATE users SET role = %s WHERE id = %s RETURNING id, email, role",
                        (new_role, target_user['id'])
                    )
                    updated_user = cur.fetchone()
                    
                    cur.execute(
                        """INSERT INTO admin_actions_log (admin_id, action_type, target_user_id, details)
                           VALUES (%s, %s, %s, %s)""",
                        (admin_user['id'], 'role_change', target_user['id'], 
                         json.dumps({'old_role': old_role, 'new_role': new_role}))
                    )
                    
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': dict(updated_user),
                        'message': f'Роль изменена с {old_role} на {new_role}'
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неизвестное действие'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
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

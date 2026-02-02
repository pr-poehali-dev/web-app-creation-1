import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    '''Создание подключения к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: dict, context) -> dict:
    '''API для управления настройками сайта (техподдержка и другие параметры)'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        
        # GET - получить все настройки или конкретную
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            setting_key = query_params.get('key')
            
            with conn.cursor() as cur:
                if setting_key:
                    cur.execute(
                        "SELECT * FROM site_settings WHERE setting_key = %s",
                        (setting_key,)
                    )
                    setting = cur.fetchone()
                    if not setting:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Настройка не найдена'}),
                            'isBase64Encoded': False
                        }
                    result = dict(setting)
                else:
                    cur.execute("SELECT * FROM site_settings ORDER BY setting_key")
                    settings = cur.fetchall()
                    result = [dict(s) for s in settings]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        # PUT/POST - обновить настройку (только для админов)
        if method in ['PUT', 'POST']:
            # Проверка авторизации администратора
            auth_header = event.get('headers', {}).get('X-Authorization', '')
            if not auth_header:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            # Простая проверка токена (можно улучшить через JWT)
            token = auth_header.replace('Bearer ', '').strip()
            
            with conn.cursor() as cur:
                # Проверяем, что пользователь - администратор
                cur.execute(
                    "SELECT role FROM users WHERE id = (SELECT user_id FROM user_sessions WHERE token = %s LIMIT 1)",
                    (token,)
                )
                user = cur.fetchone()
                
                if not user or user.get('role') != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещён. Только для администраторов'}),
                        'isBase64Encoded': False
                    }
            
            body_data = json.loads(event.get('body', '{}'))
            setting_key = body_data.get('setting_key', '').strip()
            setting_value = body_data.get('setting_value', '').strip()
            
            if not setting_key:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Ключ настройки обязателен'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO site_settings (setting_key, setting_value) 
                       VALUES (%s, %s)
                       ON CONFLICT (setting_key) 
                       DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP
                       RETURNING *""",
                    (setting_key, setting_value)
                )
                updated_setting = cur.fetchone()
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'setting': dict(updated_setting)
                }, default=str),
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

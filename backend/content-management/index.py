'''
API для управления контентом сайта
GET / - получить весь контент или по ключу
GET /?banners=true - получить активные праздничные баннеры
POST / - создать/обновить контент (только админ)
PUT /?id=uuid - обновить баннер (только админ)
DELETE /?id=uuid - удалить баннер (только админ)
'''

import json
import os
from typing import Dict, Any
from datetime import datetime, date
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor


def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(item) for item in obj]
    elif isinstance(obj, date):
        return obj.isoformat()
    return obj


def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)


def get_schema():
    return os.environ.get('DB_SCHEMA', 'public')


def is_admin(user_id: str) -> bool:
    if not user_id:
        return False
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    user_id_escaped = user_id.replace("'", "''")
    cur.execute(f"SELECT role FROM {schema}.users WHERE id = '{user_id_escaped}'")
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user and user.get('role') == 'admin'


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            
            if query_params.get('banners') == 'true':
                return get_active_banners(headers)
            elif query_params.get('key'):
                return get_content_by_key(query_params['key'], headers)
            else:
                return get_all_content(headers)
        
        elif method == 'POST':
            user_headers = event.get('headers', {})
            user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
            
            if not is_admin(user_id):
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Admin access required'}),
                    'isBase64Encoded': False
                }
            
            return create_or_update_content(event, headers)
        
        elif method == 'PUT':
            user_headers = event.get('headers', {})
            user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
            
            if not is_admin(user_id):
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Admin access required'}),
                    'isBase64Encoded': False
                }
            
            query_params = event.get('queryStringParameters', {}) or {}
            banner_id = query_params.get('id')
            if banner_id:
                return update_banner(banner_id, event, headers)
            else:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Banner ID required'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            user_headers = event.get('headers', {})
            user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
            
            if not is_admin(user_id):
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Admin access required'}),
                    'isBase64Encoded': False
                }
            
            query_params = event.get('queryStringParameters', {}) or {}
            banner_id = query_params.get('id')
            if banner_id:
                return delete_banner(banner_id, headers)
            else:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Banner ID required'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f'ERROR: {str(e)}')
        print(f'Traceback: {error_trace}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e), 'trace': error_trace}),
            'isBase64Encoded': False
        }


def get_all_content(headers: Dict[str, str]) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    
    cur.execute(f"SELECT * FROM {schema}.site_content ORDER BY category, key")
    content = cur.fetchall()
    
    cur.execute(f"SELECT * FROM {schema}.holiday_banners WHERE is_active = TRUE ORDER BY start_date DESC")
    banners = cur.fetchall()
    
    cur.close()
    conn.close()
    
    result = {
        'content': [dict(row) for row in content],
        'banners': [decimal_to_float(dict(row)) for row in banners]
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(result, default=str),
        'isBase64Encoded': False
    }


def get_content_by_key(key: str, headers: Dict[str, str]) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    key_escaped = key.replace("'", "''")
    
    cur.execute(f"SELECT * FROM {schema}.site_content WHERE key = '{key_escaped}'")
    content = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not content:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Content not found'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(dict(content), default=str),
        'isBase64Encoded': False
    }


def get_active_banners(headers: Dict[str, str]) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    
    today = date.today().isoformat()
    
    cur.execute(f"""
        SELECT * FROM {schema}.holiday_banners 
        WHERE is_active = TRUE 
        AND start_date <= '{today}' 
        AND end_date >= '{today}'
        ORDER BY created_at DESC
    """)
    banners = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps([decimal_to_float(dict(row)) for row in banners], default=str),
        'isBase64Encoded': False
    }


def create_or_update_content(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    
    content_type = body.get('type', 'content')
    
    if content_type == 'banner':
        title = body['title'].replace("'", "''")
        message = body['message'].replace("'", "''")
        banner_type = body.get('bannerType', 'banner').replace("'", "''")
        start_date = body['startDate']
        end_date = body['endDate']
        is_active = body.get('isActive', True)
        bg_color = body.get('backgroundColor', '#4F46E5').replace("'", "''")
        text_color = body.get('textColor', '#FFFFFF').replace("'", "''")
        icon = body.get('icon', '').replace("'", "''")
        show_on_pages = body.get('showOnPages', ['home'])
        
        pages_array = "ARRAY[" + ",".join([f"'{p}'" for p in show_on_pages]) + "]"
        
        sql = f"""
            INSERT INTO {schema}.holiday_banners 
            (title, message, type, start_date, end_date, is_active, background_color, text_color, icon, show_on_pages)
            VALUES ('{title}', '{message}', '{banner_type}', '{start_date}', '{end_date}', {is_active}, '{bg_color}', '{text_color}', '{icon}', {pages_array})
            RETURNING id
        """
        
        cur.execute(sql)
        result = cur.fetchone()
        conn.commit()
        
        message_text = 'Banner created successfully'
        result_id = result['id']
    else:
        key = body['key'].replace("'", "''")
        value = body['value'].replace("'", "''")
        description = body.get('description', '').replace("'", "''")
        category = body.get('category', '').replace("'", "''")
        
        sql = f"""
            INSERT INTO {schema}.site_content (key, value, description, category)
            VALUES ('{key}', '{value}', '{description}', '{category}')
            ON CONFLICT (key) DO UPDATE SET 
                value = EXCLUDED.value,
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        """
        
        cur.execute(sql)
        result = cur.fetchone()
        conn.commit()
        
        message_text = 'Content created/updated successfully'
        result_id = result['id']
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({'id': result_id, 'message': message_text}),
        'isBase64Encoded': False
    }


def update_banner(banner_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    
    banner_id_escaped = banner_id.replace("'", "''")
    updates = []
    
    if 'title' in body:
        title = body['title'].replace("'", "''")
        updates.append(f"title = '{title}'")
    
    if 'message' in body:
        message = body['message'].replace("'", "''")
        updates.append(f"message = '{message}'")
    
    if 'isActive' in body:
        updates.append(f"is_active = {body['isActive']}")
    
    if 'startDate' in body:
        updates.append(f"start_date = '{body['startDate']}'")
    
    if 'endDate' in body:
        updates.append(f"end_date = '{body['endDate']}'")
    
    if 'backgroundColor' in body:
        bg_color = body['backgroundColor'].replace("'", "''")
        updates.append(f"background_color = '{bg_color}'")
    
    if 'textColor' in body:
        text_color = body['textColor'].replace("'", "''")
        updates.append(f"text_color = '{text_color}'")
    
    if not updates:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    sql = f"UPDATE {schema}.holiday_banners SET {', '.join(updates)} WHERE id = '{banner_id_escaped}'"
    
    cur.execute(sql)
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Banner updated successfully'}),
        'isBase64Encoded': False
    }


def delete_banner(banner_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    banner_id_escaped = banner_id.replace("'", "''")
    
    cur.execute(f"DELETE FROM {schema}.holiday_banners WHERE id = '{banner_id_escaped}'")
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Banner deleted successfully'}),
        'isBase64Encoded': False
    }

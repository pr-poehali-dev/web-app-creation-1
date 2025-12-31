'''
Long-polling API для чата с оптимизацией запросов
GET /?orderId=uuid&since=timestamp - получить новые сообщения с момента since
Минимизирует трафик: возвращает только новые сообщения
'''

import json
import os
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def get_schema():
    return os.environ.get('DB_SCHEMA', 't_p42562714_web_app_creation_1')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Получение новых сообщений для чата с timestamp фильтрацией'''
    
    method = event.get('httpMethod', 'GET')
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    if method == 'GET':
        query_params = event.get('queryStringParameters', {})
        order_id = query_params.get('orderId')
        since_timestamp = query_params.get('since')
        
        if not order_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'orderId required'})
            }
        
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            schema = get_schema()
            
            # Если есть since - получаем только новые сообщения
            if since_timestamp:
                query = f'''
                    SELECT id, order_id, sender_id, message, created_at
                    FROM {schema}.order_messages
                    WHERE order_id = %s AND created_at > %s
                    ORDER BY created_at ASC
                '''
                cur.execute(query, (order_id, since_timestamp))
            else:
                # Если since нет - получаем все сообщения
                query = f'''
                    SELECT id, order_id, sender_id, message, created_at
                    FROM {schema}.order_messages
                    WHERE order_id = %s
                    ORDER BY created_at ASC
                '''
                cur.execute(query, (order_id,))
            
            messages = cur.fetchall()
            cur.close()
            conn.close()
            
            messages_list = [{
                'id': str(msg['id']),
                'orderId': str(msg['order_id']),
                'senderId': str(msg['sender_id']),
                'message': msg['message'],
                'timestamp': msg['created_at'].isoformat()
            } for msg in messages]
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'messages': messages_list,
                    'count': len(messages_list)
                })
            }
            
        except Exception as e:
            print(f'❌ Error: {str(e)}')
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }
    
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Method not allowed'})
    }
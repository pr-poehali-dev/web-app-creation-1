import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Бэкенд для управления пользователями в админ-панели
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    conn = None
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            query_params = event.get('queryStringParameters', {})
            search = query_params.get('search', '')
            status_filter = query_params.get('status', 'all')
            type_filter = query_params.get('type', 'all')
            
            where_clauses = []
            if search:
                where_clauses.append(f"(email ILIKE '%{search}%' OR first_name ILIKE '%{search}%' OR last_name ILIKE '%{search}%' OR company_name ILIKE '%{search}%')")
            
            if status_filter != 'all':
                where_clauses.append(f"status = '{status_filter}'")
            
            if type_filter != 'all':
                where_clauses.append(f"user_type = '{type_filter}'")
            
            where_sql = ' AND '.join(where_clauses) if where_clauses else '1=1'
            
            query = f"""
                SELECT 
                    u.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.company_name,
                    u.user_type,
                    u.created_at,
                    COALESCE(uv.status = 'approved', false) as verified
                FROM users u
                LEFT JOIN user_verifications uv ON u.id = uv.user_id
                WHERE {where_sql}
                ORDER BY u.created_at DESC
                LIMIT 100
            """
            
            cur.execute(query)
            users = cur.fetchall()
            
            users_list = []
            for user in users:
                name = user.get('company_name') if user.get('company_name') else f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                users_list.append({
                    'id': str(user['id']),
                    'email': user['email'],
                    'name': name,
                    'type': user['user_type'],
                    'status': 'active',
                    'verified': user['verified'],
                    'registeredAt': user['created_at'].isoformat() if user['created_at'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': users_list, 'total': len(users_list)}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('userId')
            action = body_data.get('action')
            
            if not user_id or not action:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'userId and action required'}),
                    'isBase64Encoded': False
                }
            
            if action == 'block':
                cur.execute("UPDATE users SET status = 'blocked' WHERE id = %s", (user_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'User blocked'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'unblock':
                cur.execute("UPDATE users SET status = 'active' WHERE id = %s", (user_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'User unblocked'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'update':
                email = body_data.get('email')
                verified = body_data.get('verified')
                
                if email:
                    cur.execute("UPDATE users SET email = %s WHERE id = %s", (email, user_id))
                
                if verified is not None:
                    if verified:
                        cur.execute("""
                            INSERT INTO user_verifications (user_id, status)
                            VALUES (%s, 'approved')
                            ON CONFLICT (user_id) DO UPDATE SET status = 'approved'
                        """, (user_id,))
                    else:
                        cur.execute("DELETE FROM user_verifications WHERE user_id = %s", (user_id,))
                
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'User updated'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('userId')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'userId required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'User deleted'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
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

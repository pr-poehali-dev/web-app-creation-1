import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, timedelta


def check_rate_limit(conn, identifier: str, endpoint: str, max_requests: int = 30, window_minutes: int = 1) -> bool:
    with conn.cursor() as cur:
        window_start = datetime.now() - timedelta(minutes=window_minutes)
        
        cur.execute(
            """SELECT request_count, window_start 
               FROM t_p42562714_web_app_creation_1.rate_limits 
               WHERE identifier = %s AND endpoint = %s""",
            (identifier, endpoint)
        )
        result = cur.fetchone()
        
        if result:
            if result['window_start'] > window_start:
                if result['request_count'] >= max_requests:
                    return False
                cur.execute(
                    """UPDATE t_p42562714_web_app_creation_1.rate_limits 
                       SET request_count = request_count + 1 
                       WHERE identifier = %s AND endpoint = %s""",
                    (identifier, endpoint)
                )
            else:
                cur.execute(
                    """UPDATE t_p42562714_web_app_creation_1.rate_limits 
                       SET request_count = 1, window_start = CURRENT_TIMESTAMP 
                       WHERE identifier = %s AND endpoint = %s""",
                    (identifier, endpoint)
                )
        else:
            cur.execute(
                """INSERT INTO t_p42562714_web_app_creation_1.rate_limits (identifier, endpoint, request_count, window_start) 
                   VALUES (%s, %s, 1, CURRENT_TIMESTAMP)""",
                (identifier, endpoint)
            )
        
        conn.commit()
        return True

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
        conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        
        headers = event.get('headers', {})
        user_id = headers.get('X-User-Id') or headers.get('x-user-id', 'anonymous')
        
        if not check_rate_limit(conn, user_id, 'admin_users', max_requests=30, window_minutes=1):
            return {
                'statusCode': 429,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Слишком много запросов. Попробуйте через минуту.'}),
                'isBase64Encoded': False
            }
        
        cur = conn.cursor()
        
        if method == 'GET':
            query_params = event.get('queryStringParameters', {})
            user_id_param = query_params.get('id')
            
            if user_id_param:
                cur.execute("""
                    SELECT 
                        u.id,
                        u.email,
                        u.first_name,
                        u.last_name,
                        u.middle_name,
                        u.company_name,
                        u.user_type,
                        u.phone,
                        u.inn,
                        u.ogrnip,
                        u.ogrn,
                        u.created_at
                    FROM t_p42562714_web_app_creation_1.users u
                    WHERE u.id = %s AND u.removed_at IS NULL
                """, (user_id_param,))
                
                user_data = cur.fetchone()
                if not user_data:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
                
                # Конвертируем datetime в строку для JSON сериализации
                user_dict = dict(user_data)
                if user_dict.get('created_at'):
                    user_dict['created_at'] = user_dict['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(user_dict),
                    'isBase64Encoded': False
                }
            
            search = query_params.get('search', '')
            status_filter = query_params.get('status', 'all')
            type_filter = query_params.get('type', 'all')
            role_filter = query_params.get('role', '')
            show_deleted = query_params.get('deleted', 'false') == 'true'
            
            where_clauses = []
            params = []
            
            # Фильтр для удаленных/активных пользователей
            if show_deleted:
                where_clauses.append("u.removed_at IS NOT NULL")
            else:
                where_clauses.append("u.removed_at IS NULL")
            
            if search:
                search_pattern = f"%{search}%"
                where_clauses.append("(u.email ILIKE %s OR u.first_name ILIKE %s OR u.last_name ILIKE %s OR u.company_name ILIKE %s)")
                params.extend([search_pattern, search_pattern, search_pattern, search_pattern])
            
            if status_filter != 'all' and not show_deleted:
                where_clauses.append("status = %s")
                params.append(status_filter)
            
            if type_filter != 'all':
                where_clauses.append("u.user_type = %s")
                params.append(type_filter)
            
            if role_filter:
                where_clauses.append("u.role = %s")
                params.append(role_filter)
            
            where_sql = ' AND '.join(where_clauses)
            
            if show_deleted:
                # Запрос для удаленных пользователей с подсчетом их данных
                query = f"""
                    SELECT 
                        u.id,
                        REGEXP_REPLACE(u.email, '^removed_[0-9]+@removed\\.local$', 'user_' || u.id || '@hidden.email') as email,
                        u.first_name,
                        u.last_name,
                        u.middle_name,
                        u.company_name,
                        u.user_type,
                        u.phone,
                        u.inn,
                        u.ogrnip,
                        u.ogrn,
                        u.removed_at,
                        (SELECT COUNT(*) FROM t_p42562714_web_app_creation_1.orders WHERE buyer_id = u.id OR seller_id = u.id) as orders_count,
                        (SELECT COUNT(*) FROM t_p42562714_web_app_creation_1.offers WHERE user_id = u.id) as offers_count,
                        (SELECT COUNT(*) FROM t_p42562714_web_app_creation_1.requests WHERE user_id = u.id) as requests_count
                    FROM t_p42562714_web_app_creation_1.users u
                    WHERE {where_sql}
                    ORDER BY u.removed_at DESC
                    LIMIT 100
                """
            else:
                # Обычный запрос для активных пользователей
                query = f"""
                    SELECT 
                        u.id,
                        u.email,
                        u.first_name,
                        u.last_name,
                        u.middle_name,
                        u.company_name,
                        u.user_type,
                        u.phone,
                        u.inn,
                        u.ogrnip,
                        u.ogrn,
                        u.position,
                        u.director_name,
                        u.legal_address,
                        u.is_active,
                        u.locked_until,
                        u.created_at,
                        COALESCE(uv.status = 'approved', false) as verified
                    FROM t_p42562714_web_app_creation_1.users u
                    LEFT JOIN t_p42562714_web_app_creation_1.user_verifications uv ON u.id = uv.user_id
                    WHERE {where_sql}
                    ORDER BY u.created_at DESC
                    LIMIT 100
                """
            
            cur.execute(query, tuple(params))
            users = cur.fetchall()
            
            users_list = []
            for user in users:
                name = user.get('company_name') if user.get('company_name') else f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                
                if show_deleted:
                    # Для удаленных пользователей
                    users_list.append({
                        'id': str(user['id']),
                        'originalEmail': user['email'],
                        'name': name,
                        'type': user['user_type'],
                        'phone': user.get('phone'),
                        'inn': user.get('inn'),
                        'companyName': user.get('company_name'),
                        'removedAt': user['removed_at'].isoformat() if user.get('removed_at') else None,
                        'ordersCount': user.get('orders_count', 0),
                        'offersCount': user.get('offers_count', 0),
                        'requestsCount': user.get('requests_count', 0)
                    })
                else:
                    # Для активных пользователей
                    status = 'active'
                    if not user.get('is_active'):
                        status = 'blocked'
                    elif user.get('locked_until') and user['locked_until'] > datetime.now():
                        status = 'blocked'
                    
                    users_list.append({
                        'id': str(user['id']),
                        'email': user['email'],
                        'name': name,
                        'firstName': user.get('first_name'),
                        'lastName': user.get('last_name'),
                        'middleName': user.get('middle_name'),
                        'companyName': user.get('company_name'),
                        'type': user['user_type'],
                        'phone': user.get('phone'),
                        'inn': user.get('inn'),
                        'ogrnip': user.get('ogrnip'),
                        'ogrn': user.get('ogrn'),
                        'position': user.get('position'),
                        'directorName': user.get('director_name'),
                        'legalAddress': user.get('legal_address'),
                        'status': status,
                        'isActive': user.get('is_active', True),
                        'lockedUntil': user['locked_until'].isoformat() if user.get('locked_until') else None,
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
                duration = body_data.get('duration', 0)
                
                # Отменяем только активные ставки пользователя (не удаляем историю)
                cur.execute("UPDATE t_p42562714_web_app_creation_1.bids SET status = 'cancelled' WHERE user_id = %s AND status = 'active'", (user_id,))
                
                # Блокируем пользователя (временно или навсегда)
                if duration > 0:
                    # Временная блокировка
                    locked_until = datetime.now() + timedelta(hours=duration)
                    cur.execute(
                        "UPDATE t_p42562714_web_app_creation_1.users SET locked_until = %s, is_active = true WHERE id = %s",
                        (locked_until, user_id)
                    )
                else:
                    # Постоянная блокировка
                    cur.execute(
                        "UPDATE t_p42562714_web_app_creation_1.users SET is_active = false, locked_until = NULL WHERE id = %s",
                        (user_id,)
                    )
                
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'User blocked, orders/offers/requests preserved'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'unblock':
                cur.execute(
                    "UPDATE t_p42562714_web_app_creation_1.users SET is_active = true, locked_until = NULL WHERE id = %s",
                    (user_id,)
                )
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'User unblocked'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'restore':
                # Получаем данные удаленного пользователя
                cur.execute("SELECT first_name, last_name FROM t_p42562714_web_app_creation_1.users WHERE id = %s AND removed_at IS NOT NULL", (user_id,))
                user_data = cur.fetchone()
                
                if not user_data:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found or not deleted'}),
                        'isBase64Encoded': False
                    }
                
                # Генерируем новый email на основе имени и ID
                first_name = user_data['first_name'] or 'user'
                new_email = f"restored_{first_name.lower()}_{user_id}@needsemail.local"
                
                # Восстанавливаем пользователя
                cur.execute("""
                    UPDATE t_p42562714_web_app_creation_1.users 
                    SET removed_at = NULL,
                        is_active = true,
                        email = %s
                    WHERE id = %s
                """, (new_email, user_id))
                
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True, 
                        'message': 'User restored successfully',
                        'tempEmail': new_email
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'update':
                email = body_data.get('email')
                verified = body_data.get('verified')
                
                if email:
                    cur.execute("UPDATE t_p42562714_web_app_creation_1.users SET email = %s WHERE id = %s", (email, user_id))
                
                if verified is not None:
                    if verified:
                        cur.execute("""
                            INSERT INTO t_p42562714_web_app_creation_1.user_verifications (user_id, status)
                            VALUES (%s, 'approved')
                            ON CONFLICT (user_id) DO UPDATE SET status = 'approved'
                        """, (user_id,))
                    else:
                        cur.execute("DELETE FROM t_p42562714_web_app_creation_1.user_verifications WHERE user_id = %s", (user_id,))
                
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
            
            # Проверяем, существует ли пользователь и не удален ли он уже
            cur.execute("""
                SELECT id, removed_at 
                FROM t_p42562714_web_app_creation_1.users 
                WHERE id = %s
            """, (user_id,))
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            if user['removed_at'] is not None:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User already deleted'}),
                    'isBase64Encoded': False
                }
            
            # Soft delete: помечаем пользователя как удаленного
            # Заказы, предложения, запросы, аукционы остаются в истории
            cur.execute("""
                UPDATE t_p42562714_web_app_creation_1.users 
                SET removed_at = CURRENT_TIMESTAMP, 
                    is_active = false,
                    email = 'removed_' || id || '@removed.local'
                WHERE id = %s AND removed_at IS NULL
            """, (user_id,))
            
            # Отменяем только активные ставки пользователя
            cur.execute("""
                UPDATE t_p42562714_web_app_creation_1.bids 
                SET status = 'cancelled' 
                WHERE user_id = %s AND status = 'active'
            """, (user_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'User deleted successfully'}),
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
"""Административные операции с заказами: архивирование, очистка, отмена рейса"""
import json
from typing import Dict, Any
from datetime import datetime
from psycopg2.extras import RealDictCursor
from orders_utils import get_db_connection, get_schema, send_notification, offers_cache


def cancel_trip_handler(offer_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    '''Отмена всего рейса исполнителем — все принятые заказы по предложению отменяются'''
    body = json.loads(event.get('body', '{}'))
    reason = body.get('cancellationReason', 'Рейс отменён исполнителем')

    user_headers = event.get('headers', {})
    seller_user_id = int(user_headers.get('X-User-Id') or user_headers.get('x-user-id') or 0)
    if not seller_user_id:
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'}), 'isBase64Encoded': False}

    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    from psycopg2 import sql as pgsql

    cur.execute(
        pgsql.SQL("SELECT id, seller_id FROM {schema}.offers WHERE id = %s").format(schema=pgsql.Identifier(schema)),
        (offer_id,)
    )
    offer = cur.fetchone()
    if not offer or int(offer['seller_id']) != seller_user_id:
        cur.close(); conn.close()
        return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'}), 'isBase64Encoded': False}

    cur.execute(
        pgsql.SQL("""
            SELECT id, buyer_id, quantity, order_number
            FROM {schema}.orders
            WHERE offer_id = %s AND status = 'accepted'
        """).format(schema=pgsql.Identifier(schema)),
        (offer_id,)
    )
    accepted_orders = cur.fetchall()

    if accepted_orders:
        order_ids = [o['id'] for o in accepted_orders]
        cancellation_reason = f'Рейс отменён исполнителем: {reason}'
        cur.execute(
            pgsql.SQL("""
                UPDATE {schema}.orders
                SET status = 'cancelled',
                    cancelled_by = 'seller',
                    cancellation_reason = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ANY(%s)
            """).format(schema=pgsql.Identifier(schema)),
            (cancellation_reason, order_ids)
        )

        total_returned = sum(o['quantity'] for o in accepted_orders)
        cur.execute(
            pgsql.SQL("""
                UPDATE {schema}.offers
                SET sold_quantity = GREATEST(0, COALESCE(sold_quantity, 0) - %s),
                    updated_at = NOW()
                WHERE id = %s
            """).format(schema=pgsql.Identifier(schema)),
            (total_returned, offer_id)
        )
        offers_cache.clear()

        cur.execute(
            pgsql.SQL("""
                UPDATE {schema}.users
                SET rating = GREATEST(0, COALESCE(rating, 100) * 0.95)
                WHERE id = %s
            """).format(schema=pgsql.Identifier(schema)),
            (seller_user_id,)
        )
        print(f"[CANCEL_TRIP] Seller {seller_user_id} rating decreased 5% for cancelled trip")

        for o in accepted_orders:
            try:
                send_notification(
                    o['buyer_id'],
                    'Рейс отменён',
                    f'Исполнитель отменил рейс. Причина: {reason}',
                    '/my-orders'
                )
            except Exception as e:
                print(f"[CANCEL_TRIP] Notification error: {e}")

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'success': True, 'cancelledOrders': len(accepted_orders), 'message': 'Рейс отменён'})
    }


def cleanup_orphaned_orders(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Удаление заказов с несуществующими предложениями"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Authentication required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    
    sql_find = f"""
        SELECT o.id, o.title, o.offer_id 
        FROM {schema}.orders o
        LEFT JOIN {schema}.offers of ON o.offer_id = of.id
        WHERE of.id IS NULL
    """
    
    cur.execute(sql_find)
    orphaned = cur.fetchall()
    orphaned_ids = [order['id'] for order in orphaned]
    
    deleted_count = 0
    if orphaned_ids:
        ids_str = "', '".join([str(oid).replace("'", "''") for oid in orphaned_ids])
        sql_delete_messages = f"DELETE FROM {schema}.order_messages WHERE order_id IN ('{ids_str}')"
        cur.execute(sql_delete_messages)
        
        sql_delete_orders = f"DELETE FROM {schema}.orders WHERE id IN ('{ids_str}')"
        cur.execute(sql_delete_orders)
        deleted_count = cur.rowcount
        
        conn.commit()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'deleted': deleted_count,
            'orphaned_orders': [{'id': str(o['id']), 'title': o['title'], 'offer_id': str(o['offer_id'])} for o in orphaned],
            'message': f'Deleted {deleted_count} orphaned orders'
        }),
        'isBase64Encoded': False
    }


def admin_archive_order(order_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Архивирование заказа администратором с указанием причины + уведомления покупателю и продавцу"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')

    if not user_id:
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Authentication required'}), 'isBase64Encoded': False}

    body = json.loads(event.get('body') or '{}')
    reason = body.get('reason', '').strip()

    if not reason:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите причину архивирования'}), 'isBase64Encoded': False}

    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    order_id_escaped = order_id.replace("'", "''")
    reason_escaped = reason.replace("'", "''")
    now = datetime.utcnow()

    cur.execute(f"SELECT id, buyer_id, seller_id, order_number, title FROM {schema}.orders WHERE id = '{order_id_escaped}'")
    order = cur.fetchone()
    if not order:
        cur.close()
        conn.close()
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Order not found'}), 'isBase64Encoded': False}

    cur.execute(f"""
        UPDATE {schema}.orders
        SET status = 'archived',
            archived_at = %s,
            archived_by_admin = TRUE,
            admin_archive_reason = '{reason_escaped}',
            updated_at = %s
        WHERE id = '{order_id_escaped}'
    """, (now, now))

    conn.commit()
    cur.close()
    conn.close()

    order_number = order.get('order_number', order_id[:8])
    order_title = order.get('title', 'заказ')
    archive_url = '/my-orders?tab=archived'
    notif_title = f'Заказ №{order_number} перемещён в архив'
    notif_message = f'Администратор переместил заказ «{order_title}» в архив. Причина: {reason}'

    try:
        send_notification(order['buyer_id'], notif_title, notif_message, archive_url)
    except Exception as e:
        print(f'[ADMIN_ARCHIVE] Buyer notification error: {e}')

    try:
        send_notification(order['seller_id'], notif_title, notif_message, archive_url)
    except Exception as e:
        print(f'[ADMIN_ARCHIVE] Seller notification error: {e}')

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Order archived by admin'}), 'isBase64Encoded': False}


def delete_order(order_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Удаление конкретного заказа по ID"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Authentication required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    
    order_id_escaped = order_id.replace("'", "''")
    
    cur.execute(f"SELECT buyer_id, seller_id, status FROM {schema}.orders WHERE id = '{order_id_escaped}'")
    order = cur.fetchone()
    
    if not order:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Order not found'}),
            'isBase64Encoded': False
        }
    
    user_id_int = int(user_id)
    if order['buyer_id'] != user_id_int and order['seller_id'] != user_id_int:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': 'Access denied'}),
            'isBase64Encoded': False
        }
    
    allowed_statuses = ['new', 'negotiating']
    if order['status'] not in allowed_statuses:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': f'Нельзя отменить заказ в статусе "{order["status"]}"'}),
            'isBase64Encoded': False
        }
    
    cur.execute(f"DELETE FROM {schema}.order_messages WHERE order_id = '{order_id_escaped}'")
    cur.execute(f"DELETE FROM {schema}.orders WHERE id = '{order_id_escaped}'")
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Order deleted successfully'}),
        'isBase64Encoded': False
    }


def cleanup_all_orders(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Удаление ВСЕХ заказов и сообщений - полная очистка для начала с чистого листа"""
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Authentication required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    schema = get_schema()
    
    cur.execute(f"SELECT COUNT(*) as cnt FROM {schema}.orders")
    orders_count = cur.fetchone()['cnt']
    
    cur.execute(f"SELECT COUNT(*) as cnt FROM {schema}.order_messages")
    messages_count = cur.fetchone()['cnt']
    
    cur.execute(f"DELETE FROM {schema}.order_messages")
    cur.execute(f"DELETE FROM {schema}.orders")
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'deleted_orders': orders_count,
            'deleted_messages': messages_count,
            'message': f'Deleted all {orders_count} orders and {messages_count} messages'
        }),
        'isBase64Encoded': False
    }

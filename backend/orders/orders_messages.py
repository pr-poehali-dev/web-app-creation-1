"""Работа с сообщениями чата по заказам"""
import json
import os
import base64
import uuid
import mimetypes
import boto3
from typing import Dict, Any
from orders_utils import get_db_connection, get_schema, send_notification


def get_messages_by_offer(offer_id: str, headers: Dict[str, str]) -> Dict[str, Any]:
    """Получить все сообщения по предложению"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    offer_id_escaped = offer_id.replace("'", "''")
    
    # Сначала находим все заказы по offer_id
    sql_orders = f"SELECT id, order_number, buyer_name FROM {schema}.orders WHERE offer_id = '{offer_id_escaped}'"
    cur.execute(sql_orders)
    orders_data = cur.fetchall()
    
    if not orders_data:
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps([]),
            'isBase64Encoded': False
        }
    
    # Получаем ID всех заказов
    order_ids = [f"'{str(o['id'])}'" for o in orders_data]
    order_map = {str(o['id']): {'order_number': o['order_number'], 'buyer_name': o.get('buyer_name', 'Пользователь')} for o in orders_data}
    
    # Получаем сообщения по этим заказам
    sql_messages = f"""
        SELECT * FROM {schema}.order_messages 
        WHERE order_id IN ({','.join(order_ids)})
        ORDER BY created_at DESC
    """
    
    cur.execute(sql_messages)
    messages = cur.fetchall()
    
    result = []
    for msg in messages:
        msg_dict = dict(msg)
        order_id = str(msg_dict.get('order_id'))
        
        # Добавляем данные заказа
        if order_id in order_map:
            msg_dict['order_number'] = order_map[order_id]['order_number']
            msg_dict['sender_name'] = order_map[order_id]['buyer_name']
        else:
            msg_dict['order_number'] = 'N/A'
            msg_dict['sender_name'] = 'Пользователь'
        
        msg_dict['createdAt'] = msg_dict.pop('created_at').isoformat() if msg_dict.get('created_at') else None
        
        # Преобразуем UUID и нестандартные типы в строки
        for k, v in list(msg_dict.items()):
            if hasattr(v, 'hex'):  # UUID
                msg_dict[k] = str(v)
            elif hasattr(v, 'isoformat'):  # datetime
                msg_dict[k] = v.isoformat()
        
        result.append(msg_dict)
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(result),
        'isBase64Encoded': False
    }


def get_messages_by_order(order_id: str, headers: Dict[str, str], event: Dict[str, Any] = None) -> Dict[str, Any]:
    """Получить все сообщения по заказу и отметить чужие как прочитанные"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    order_id_escaped = order_id.replace("'", "''")
    
    user_id = None
    if event:
        user_headers = event.get('headers', {})
        user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    if user_id:
        cur.execute(f"""
            UPDATE {schema}.order_messages 
            SET is_read = true 
            WHERE order_id = '{order_id_escaped}' 
            AND sender_id != {int(user_id)} 
            AND is_read = false
        """)
        conn.commit()
    
    sql = f"SELECT * FROM {schema}.order_messages WHERE order_id = '{order_id_escaped}' ORDER BY created_at ASC"
    
    cur.execute(sql)
    messages = cur.fetchall()
    
    result = []
    for msg in messages:
        result.append({
            'id': msg['id'],
            'order_id': msg['order_id'],
            'sender_id': msg['sender_id'],
            'sender_name': msg['sender_name'],
            'sender_type': msg['sender_type'],
            'message': msg['message'],
            'is_read': msg['is_read'],
            'attachments': msg.get('attachments') or [],
            'createdAt': msg['created_at'].isoformat() if msg.get('created_at') else None
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'messages': result}),
        'isBase64Encoded': False
    }


def upload_message_file(file_data_b64: str, file_name: str, content_type: str) -> str:
    """Загрузить файл в S3 и вернуть CDN URL"""
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    file_bytes = base64.b64decode(file_data_b64)
    ext = os.path.splitext(file_name)[1] or mimetypes.guess_extension(content_type) or ''
    key = f"order-messages/{uuid.uuid4()}{ext}"
    s3.put_object(Bucket='files', Key=key, Body=file_bytes, ContentType=content_type)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return cdn_url


def create_message(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Создать новое сообщение по заказу (поддерживает вложения фото/видео)"""
    body = json.loads(event.get('body', '{}'))
    user_headers = event.get('headers', {})
    user_id = user_headers.get('X-User-Id') or user_headers.get('x-user-id')
    
    print(f"[CREATE_MESSAGE] user_id={user_id}, body keys={list(body.keys())}")
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = get_schema()
    sender_id = body['senderId']
    
    # Получаем имя отправителя
    cur.execute(f"SELECT first_name, last_name FROM {schema}.users WHERE id = {sender_id}")
    user = cur.fetchone()
    
    if user:
        sender_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    else:
        sender_name = 'Пользователь'
    
    order_id_escaped = body['orderId'].replace("'", "''")
    sender_type_escaped = body['senderType'].replace("'", "''")
    message_text = body.get('message', '')
    message_escaped = message_text.replace("'", "''")
    sender_name_escaped = sender_name.replace("'", "''")
    
    # Загружаем файл-вложение если есть
    attachments = []
    if body.get('fileData') and body.get('fileName'):
        file_url = upload_message_file(
            body['fileData'],
            body['fileName'],
            body.get('fileType', 'application/octet-stream')
        )
        attachments.append({
            'url': file_url,
            'name': body['fileName'],
            'type': body.get('fileType', 'application/octet-stream')
        })
    
    attachments_json = json.dumps(attachments, ensure_ascii=False).replace("'", "''")
    
    # Получаем информацию о заказе для определения получателя уведомления
    cur.execute(f"SELECT buyer_id, seller_id, order_number FROM {schema}.orders WHERE id = '{order_id_escaped}'")
    order = cur.fetchone()
    
    sql = f"""
        INSERT INTO {schema}.order_messages (order_id, sender_id, sender_name, sender_type, message, attachments)
        VALUES ('{order_id_escaped}', {sender_id}, '{sender_name_escaped}', '{sender_type_escaped}', '{message_escaped}', '{attachments_json}')
        RETURNING id, created_at
    """
    
    cur.execute(sql)
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    # Отправляем уведомление получателю сообщения
    if order:
        try:
            recipient_id = order['seller_id'] if int(sender_id) == order['buyer_id'] else order['buyer_id']
            notif_text = message_text if message_text else '📎 Файл'
            send_notification(
                recipient_id,
                'Новое сообщение по заказу',
                f'{sender_name}: {notif_text[:50]}...' if len(notif_text) > 50 else f'{sender_name}: {notif_text}',
                f'/my-orders?id={body["orderId"]}'
            )
        except Exception as e:
            print(f'Message notification error: {e}')
    
    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({
            'id': str(result['id']),
            'createdAt': result['created_at'].isoformat(),
            'message': 'Message created successfully'
        }),
        'isBase64Encoded': False
    }


def delete_message(message_id: str, event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Удаление сообщений отключено — сообщения хранятся навсегда"""
    return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Удаление сообщений запрещено'}), 'isBase64Encoded': False}

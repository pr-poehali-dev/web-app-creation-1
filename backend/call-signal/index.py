"""
Сигнализация видео/аудио звонков через БД.
POST /?action=call   — инициатор записывает входящий звонок в orders.pending_call
POST /?action=clear  — снять звонок (принят/отклонён/завершён)
GET  /?orderId=uuid  — получить текущий звонок для заказа (polling получателем)
"""
import json
import os
import psycopg2
from datetime import datetime, timezone


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Content-Type': 'application/json',
}

SCHEMA = os.environ.get('DB_SCHEMA', 'public')


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ok(data):
    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(data)}


def err(msg, code=400):
    return {'statusCode': code, 'headers': CORS_HEADERS, 'body': json.dumps({'error': msg})}


def handler(event: dict, context) -> dict:
    """Сигнальный сервер для видео/аудио звонков через БД"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    headers = event.get('headers') or {}
    user_id = headers.get('X-User-Id', '')

    # GET — получатель опрашивает наличие звонка для заказа
    if method == 'GET':
        order_id = params.get('orderId', '').strip()
        if not order_id or not user_id:
            return err('orderId и X-User-Id обязательны')

        conn = get_db()
        try:
            cur = conn.cursor()
            # Получаем pending_call только если этот пользователь — участник заказа
            cur.execute(
                f"""
                SELECT pending_call FROM {SCHEMA}.orders
                WHERE id = %s
                  AND (buyer_id = %s OR seller_id = %s)
                  AND pending_call IS NOT NULL
                """,
                (order_id, user_id, user_id)
            )
            row = cur.fetchone()
            if row:
                call_data = row[0]
                # Если звонок старше 35 секунд — автоматически очищаем
                called_at = call_data.get('calledAt')
                if called_at:
                    age = (datetime.now(timezone.utc).timestamp() - called_at)
                    if age > 35:
                        cur.execute(
                            f"UPDATE {SCHEMA}.orders SET pending_call = NULL WHERE id = %s",
                            (order_id,)
                        )
                        conn.commit()
                        return ok({'call': None})
                return ok({'call': call_data})
            return ok({'call': None})
        finally:
            conn.close()

    # POST — инициатор ставит/снимает звонок
    if method == 'POST':
        if not user_id:
            return err('X-User-Id обязателен', 401)

        body = {}
        try:
            body = json.loads(event.get('body') or '{}')
        except Exception:
            pass

        action = params.get('action', body.get('action', ''))
        order_id = body.get('orderId', '').strip()

        if not order_id:
            return err('orderId обязателен')

        conn = get_db()
        try:
            cur = conn.cursor()

            if action == 'call':
                # Записываем звонок — только участник заказа может инициировать
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.orders WHERE id = %s AND (buyer_id = %s OR seller_id = %s)",
                    (order_id, user_id, user_id)
                )
                if not cur.fetchone():
                    return err('Заказ не найден или нет доступа', 403)

                call_data = {
                    'callerId': body.get('callerId', user_id),
                    'callerName': body.get('callerName', ''),
                    'roomId': body.get('roomId', f'erttp-order-{order_id}'),
                    'callMode': body.get('callMode', 'video'),  # 'video' | 'audio'
                    'type': 'incoming_call',
                    'calledAt': datetime.now(timezone.utc).timestamp(),
                }

                cur.execute(
                    f"UPDATE {SCHEMA}.orders SET pending_call = %s WHERE id = %s",
                    (json.dumps(call_data), order_id)
                )
                conn.commit()
                return ok({'success': True, 'call': call_data})

            elif action == 'clear':
                # Снимаем звонок
                cur.execute(
                    f"""
                    UPDATE {SCHEMA}.orders SET pending_call = NULL
                    WHERE id = %s AND (buyer_id = %s OR seller_id = %s)
                    """,
                    (order_id, user_id, user_id)
                )
                conn.commit()
                return ok({'success': True})

            return err('action должен быть call или clear')
        finally:
            conn.close()

    return err('Метод не поддерживается', 405)

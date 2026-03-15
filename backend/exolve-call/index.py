"""Голосовой звонок через МТС Exolve API при новом заказе/отклике"""
import json
import os
import http.client


def handler(event: dict, context) -> dict:
    """Совершает автоматический голосовой звонок через МТС Exolve с уведомлением о новом заказе/отклике"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    try:
        body = json.loads(event.get('body', '{}'))
    except Exception:
        body = {}

    phone = body.get('phone', '').strip()
    text = body.get('text', 'Вам поступил новый заказ на вашем сайте.')

    if not phone:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'phone is required'})
        }

    # Нормализуем номер: убираем пробелы, скобки, тире
    normalized = ''.join(c for c in phone if c.isdigit() or c == '+')
    if normalized.startswith('8') and len(normalized) == 11:
        normalized = '+7' + normalized[1:]
    elif normalized.startswith('7') and len(normalized) == 11:
        normalized = '+' + normalized
    elif not normalized.startswith('+'):
        normalized = '+7' + normalized

    api_key = os.environ.get('EXOLVE_API_KEY', '')
    caller_number = os.environ.get('EXOLVE_CALLER_NUMBER', '')

    payload = json.dumps({
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'MakeCall',
        'params': {
            'number': normalized,
            'caller_id': caller_number,
            'voice_message_text': text,
            'voice_message_language': 'ru-RU',
            'voice_message_repeat': 1
        }
    })

    try:
        conn = http.client.HTTPSConnection('api.exolve.ru', timeout=15)
        conn.request(
            'POST',
            '/calling/v1/MakeCall',
            payload,
            {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            }
        )
        resp = conn.getresponse()
        resp_body = resp.read().decode('utf-8')
        conn.close()

        print(f'[EXOLVE] Call to {normalized}: status={resp.status} response={resp_body[:300]}')

        if resp.status in (200, 201):
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'phone': normalized})
            }
        else:
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': resp_body, 'status': resp.status})
            }
    except Exception as e:
        print(f'[EXOLVE] Call error: {e}')
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)})
        }
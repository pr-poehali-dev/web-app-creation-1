"""Голосовой звонок через МТС Exolve Voice API при новом заказе/отклике. v3"""
import json
import os
import http.client


def exolve_request(path: str, payload: str, api_key: str) -> tuple:
    conn = http.client.HTTPSConnection('api.exolve.ru', timeout=15)
    conn.request('POST', path, payload, {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    })
    resp = conn.getresponse()
    body = resp.read().decode('utf-8')
    conn.close()
    return resp.status, body


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
    call_type = body.get('type', 'order')

    if not phone:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'phone is required'})
        }

    normalized = ''.join(c for c in phone if c.isdigit())
    if normalized.startswith('8') and len(normalized) == 11:
        normalized = '7' + normalized[1:]
    elif not normalized.startswith('7'):
        normalized = '7' + normalized

    api_key = os.environ.get('EXOLVE_API_KEY', '')
    caller_number = os.environ.get('EXOLVE_CALLER_NUMBER', '')
    source = ''.join(c for c in caller_number if c.isdigit())
    if source.startswith('8'):
        source = '7' + source[1:]

    # resource_id — UUID ресурса "Голосовое SMS" из Exolve
    if call_type == 'response':
        resource_id = os.environ.get('EXOLVE_SERVICE_ID_RESPONSE', '')
    else:
        resource_id = os.environ.get('EXOLVE_SERVICE_ID_ORDER', '')

    print(f'[EXOLVE] Calling {normalized} type={call_type} resource_id={resource_id} source={source}')

    # service_id — числовой file_id аудиофайла (uint64), resource_id хранит его как строку
    try:
        service_id = int(resource_id)
    except (ValueError, TypeError):
        # resource_id — UUID, нужно получить file_id через GetList
        getlist_payload = json.dumps({'resource_id': resource_id})
        gl_status, gl_body = exolve_request('/media/v1/GetList', getlist_payload, api_key)
        print(f'[EXOLVE] GetList status={gl_status} body={gl_body[:300]}')
        service_id = None
        if gl_status == 200:
            try:
                gl_data = json.loads(gl_body)
                files = gl_data.get('files', [])
                if files:
                    service_id = int(files[0].get('file_id', 0))
            except Exception as e:
                print(f'[EXOLVE] GetList parse error: {e}')
        if not service_id:
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': f'Could not resolve file_id from resource_id={resource_id}', 'getlist': gl_body[:200]})
            }

    call_payload = json.dumps({
        'source': source,
        'destination': normalized,
        'service_id': service_id
    })

    call_status, call_body = exolve_request('/voice/v1/MakeVoiceMessage', call_payload, api_key)
    print(f'[EXOLVE] MakeVoiceMessage status={call_status} body={call_body[:300]}')

    if call_status in (200, 201):
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'phone': normalized})
        }
    else:
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': call_body, 'status': call_status})
        }
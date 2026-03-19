'''API для работы с запросами'''
import json
from typing import Dict, Any

from requests_list import get_requests_list
from requests_detail import get_request_by_id
from requests_crud import create_request, update_request, delete_request


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для работы с запросами (requests)
    GET / - получить список запросов с фильтрами
    GET /{id} - получить запрос по ID
    POST / - создать новый запрос
    PUT /{id} - обновить запрос
    DELETE /{id} - удалить запрос (мягкое удаление)
    """
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
            request_id = query_params.get('id')

            if request_id:
                return get_request_by_id(request_id, headers)
            else:
                return get_requests_list(event, headers)

        elif method == 'POST':
            return create_request(event, headers)

        elif method == 'PUT':
            query_params = event.get('queryStringParameters', {}) or {}
            request_id = query_params.get('id')
            if not request_id:
                path_params = event.get('pathParams', {})
                request_id = path_params.get('id')
            if not request_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Request ID required'}),
                    'isBase64Encoded': False
                }
            return update_request(request_id, event, headers)

        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {}) or {}
            request_id = query_params.get('id')
            if not request_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Request ID required'}),
                    'isBase64Encoded': False
                }
            return delete_request(request_id, headers)

        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        import traceback
        print(f'[ERROR] {str(e)}\n{traceback.format_exc()}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

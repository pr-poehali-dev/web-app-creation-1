'''
Business: Search company data by INN using DaData API
Args: event - dict with httpMethod, queryStringParameters (inn)
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with company data
'''

import json
import os
from typing import Dict, Any, Optional
import requests

DADATA_API_KEY = os.environ.get('DADATA_API_KEY')
DADATA_API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        inn = params.get('inn', '').strip()
        
        if not inn:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'ИНН обязателен'}),
                'isBase64Encoded': False
            }
        
        if not DADATA_API_KEY:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'API ключ DaData не настроен'}),
                'isBase64Encoded': False
            }
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Token {DADATA_API_KEY}'
        }
        
        payload = {'query': inn}
        
        response = requests.post(DADATA_API_URL, json=payload, headers=headers)
        
        if response.status_code != 200:
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Ошибка запроса к DaData'}),
                'isBase64Encoded': False
            }
        
        data = response.json()
        
        if not data.get('suggestions'):
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Организация не найдена'}),
                'isBase64Encoded': False
            }
        
        suggestion = data['suggestions'][0]
        company_data = suggestion.get('data', {})
        
        ogrn = company_data.get('ogrn')
        ogrnip = company_data.get('ogrnip')
        
        # Получаем ФИО для ИП/самозанятых
        fio_data = company_data.get('fio', {})
        owner_fio = None
        if isinstance(fio_data, dict) and fio_data:
            owner_fio = f"{fio_data.get('surname', '')} {fio_data.get('name', '')} {fio_data.get('patronymic', '') or ''}".strip()
        
        result = {
            'inn': company_data.get('inn'),
            'ogrn': ogrn,
            'ogrnip': ogrnip,
            'company_name': company_data.get('name', {}).get('full_with_opf') if isinstance(company_data.get('name'), dict) else company_data.get('name'),
            'legal_address': company_data.get('address', {}).get('value') if isinstance(company_data.get('address'), dict) else company_data.get('address'),
            'director_name': company_data.get('management', {}).get('name') if isinstance(company_data.get('management'), dict) else None,
            'owner_fio': owner_fio,
            'kpp': company_data.get('kpp'),
            'okpo': company_data.get('okpo'),
            'okved': company_data.get('okved'),
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'data': result}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Метод не поддерживается'}),
        'isBase64Encoded': False
    }
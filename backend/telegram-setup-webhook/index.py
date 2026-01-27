import json
import os
import urllib.request
import urllib.parse

def handler(event: dict, context) -> dict:
    '''Вспомогательная функция для настройки Telegram вебхука'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not bot_token:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': 'Токен бота не настроен. Добавьте TELEGRAM_BOT_TOKEN в секреты проекта.'
            }),
            'isBase64Encoded': False
        }
    
    webhook_url = 'https://functions.poehali.dev/a0fb050f-4c4d-4081-887c-ebc6eb867030'
    
    if method == 'GET':
        # Получить информацию о текущем вебхуке
        try:
            url = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"
            req = urllib.request.Request(url, method='GET')
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'webhook_info': result.get('result', {}),
                        'expected_url': webhook_url
                    }),
                    'isBase64Encoded': False
                }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'error': f'Ошибка получения информации о вебхуке: {str(e)}'
                }),
                'isBase64Encoded': False
            }
    
    elif method == 'POST':
        # Настроить вебхук
        try:
            url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
            data = json.dumps({'url': webhook_url}).encode('utf-8')
            
            req = urllib.request.Request(
                url,
                data=data,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                if result.get('ok'):
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'message': 'Вебхук успешно настроен!',
                            'webhook_url': webhook_url,
                            'description': result.get('description', '')
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': False,
                            'error': result.get('description', 'Не удалось настроить вебхук')
                        }),
                        'isBase64Encoded': False
                    }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'error': f'Ошибка настройки вебхука: {str(e)}'
                }),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }

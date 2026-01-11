import json
import os
from openai import OpenAI

def handler(event: dict, context) -> dict:
    '''AI-чат для помощи администратору с задачами по управлению сайтом'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        messages = body.get('messages', [])
        
        if not messages:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Сообщения не предоставлены'}),
                'isBase64Encoded': False
            }
        
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'API ключ OpenAI не настроен'}),
                'isBase64Encoded': False
            }
        
        client = OpenAI(api_key=api_key)
        
        system_prompt = """Ты - AI-ассистент для помощи администратору сайта ЕРТТП (Единый региональный торгово-транспортный портал).

Твоя задача:
- Помогать с управлением контентом сайта
- Генерировать тексты для страниц, объявлений, описаний
- Давать советы по SEO и маркетингу
- Помогать с формулировками и правками текстов
- Отвечать на вопросы о функционале платформы

Особенности платформы:
- Это торговая площадка для B2B торговли в Республике Алтай
- Есть предложения (товары от продавцов), запросы (заявки от покупателей), аукционы
- Поддержка юридических лиц и ИП
- Система районов для фильтрации по географии

Общайся профессионально, но дружелюбно. Давай конкретные советы. Если нужно написать текст - пиши готовый вариант."""

        full_messages = [
            {'role': 'system', 'content': system_prompt}
        ] + messages
        
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=full_messages,
            max_tokens=1500,
            temperature=0.7
        )
        
        assistant_message = response.choices[0].message.content
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': assistant_message,
                'model': 'gpt-4o-mini'
            }, ensure_ascii=False),
            'isBase64Encoded': False
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Некорректный JSON'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }

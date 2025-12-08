"""
Создание нового аукциона с загрузкой изображений
"""
import json
import os
import base64
import uuid
from datetime import datetime, timedelta
import psycopg2
import boto3
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        
        # Загрузка изображений в S3
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        
        image_urls = []
        images_data = body_data.get('images', [])
        
        for idx, img_data in enumerate(images_data):
            # Декодируем base64
            img_base64 = img_data.split(',')[1] if ',' in img_data else img_data
            img_bytes = base64.b64decode(img_base64)
            
            # Генерируем уникальное имя файла
            file_ext = 'jpg'
            if 'image/png' in img_data:
                file_ext = 'png'
            elif 'image/webp' in img_data:
                file_ext = 'webp'
            
            file_name = f'auctions/{uuid.uuid4()}.{file_ext}'
            
            # Загружаем в S3
            content_type = f'image/{file_ext}'
            s3.put_object(
                Bucket='files',
                Key=file_name,
                Body=img_bytes,
                ContentType=content_type
            )
            
            # Формируем CDN URL
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_name}"
            image_urls.append(cdn_url)
        
        # Подключение к БД
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Расчет даты окончания
        start_datetime = datetime.fromisoformat(body_data['startDate'] + 'T' + body_data['startTime'])
        duration_days = int(body_data['duration'])
        end_datetime = start_datetime + timedelta(days=duration_days)
        
        # Если availableDistricts пуст, добавляем хотя бы район местонахождения
        available_districts = body_data.get('availableDistricts', [])
        if not available_districts and body_data['district']:
            available_districts = [body_data['district']]
        
        # Вставка аукциона
        cur.execute("""
            INSERT INTO auctions (
                user_id, title, description, category, subcategory,
                quantity, unit, starting_price, current_bid, min_bid_step,
                buy_now_price, has_vat, vat_rate, district, full_address,
                gps_coordinates, available_districts, available_delivery_types,
                start_date, end_date, duration_days, status
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id
        """, (
            int(user_id),
            body_data['title'],
            body_data['description'],
            body_data['category'],
            body_data.get('subcategory'),
            float(body_data['quantity']) if body_data.get('quantity') else None,
            body_data.get('unit'),
            float(body_data['startingPrice']),
            float(body_data['startingPrice']),
            float(body_data['minBidStep']),
            float(body_data['buyNowPrice']) if body_data.get('buyNowPrice') else None,
            body_data.get('hasVAT', False),
            float(body_data['vatRate']) if body_data.get('vatRate') else None,
            body_data['district'],
            body_data.get('fullAddress'),
            body_data.get('gpsCoordinates'),
            available_districts,
            body_data['availableDeliveryTypes'],
            start_datetime,
            end_datetime,
            duration_days,
            'pending'
        ))
        
        auction_id = cur.fetchone()[0]
        
        # Вставка изображений
        for idx, url in enumerate(image_urls):
            cur.execute("""
                INSERT INTO auction_images (auction_id, url, alt, sort_order)
                VALUES (%s, %s, %s, %s)
            """, (auction_id, url, body_data['title'], idx))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'auctionId': auction_id, 'message': 'Auction created successfully'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
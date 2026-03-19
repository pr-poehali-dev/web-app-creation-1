import os
import base64
import uuid
from io import BytesIO
from datetime import datetime
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3


def get_s3_client():
    return boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])


def upload_image_to_s3(img_url: str) -> str:
    """Если base64 — загружает в S3, возвращает CDN URL. Иначе возвращает как есть."""
    if not img_url.startswith('data:image'):
        return img_url
    try:
        from PIL import Image, ImageOps
        header, b64data = img_url.split(',', 1)
        image_data = base64.b64decode(b64data)
        img = Image.open(BytesIO(image_data))
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass
        if img.mode in ('RGBA', 'LA', 'P'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            bg.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = bg
        if img.width > 800:
            ratio = 800 / img.width
            img = img.resize((800, int(img.height * ratio)), Image.Resampling.LANCZOS)
        output = BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        optimized = output.getvalue()
        file_id = str(uuid.uuid4())
        s3_key = f"request-images/{file_id}.jpg"
        s3 = get_s3_client()
        s3.put_object(Bucket='files', Key=s3_key, Body=optimized, ContentType='image/jpeg')
        return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
    except Exception as e:
        print(f"S3 upload failed: {e}")
        return img_url


def get_db_connection():
    """Подключение к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])


def json_default(obj):
    """JSON serializer для специальных типов"""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)

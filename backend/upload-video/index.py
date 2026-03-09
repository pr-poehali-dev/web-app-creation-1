import json
import os
import base64
import uuid
import re
import io
from typing import Dict, Any, Optional, List, Tuple
import boto3


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для загрузки видео и изображений.
    При загрузке фото авто (isAutoPhoto=true) автоматически скрывает гос. номер текстом ЕРТТП.
    POST / - загрузить медиа и получить URL
    """
    method: str = event.get('httpMethod', 'GET')

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

    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    try:
        if method == 'POST':
            return upload_media(event, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f'ERROR in upload-video handler: {str(e)}')
        print(f'Traceback: {error_trace}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def fix_image_orientation(img):
    """
    Исправляет ориентацию изображения по EXIF-тегу (актуально для фото с телефона).
    """
    try:
        from PIL import ImageOps
        return ImageOps.exif_transpose(img)
    except Exception:
        return img


def detect_license_plate_regions(img) -> List[Tuple[int, int, int, int]]:
    """
    Детектирует вероятные зоны гос. номеров на изображении.
    Ищет только в нижней половине кадра (где обычно находится номер авто).
    Возвращает список (x, y, w, h) найденных зон в координатах оригинального изображения.
    Использует numpy для быстрых матричных вычислений.
    """
    from PIL import Image
    import math
    import numpy as np

    orig_width, orig_height = img.size

    # Уменьшаем рабочий размер до 400px — достаточно для детекции, в 2× быстрее чем 600
    MAX_DIM = 400
    scale = min(MAX_DIM / orig_width, MAX_DIM / orig_height, 1.0)
    work_w = max(1, int(orig_width * scale))
    work_h = max(1, int(orig_height * scale))
    small = img.resize((work_w, work_h), Image.BILINEAR)

    width, height = small.size
    # Конвертируем в numpy-массив сразу — быстрее чем crop+getdata на каждой итерации
    gray_arr = np.array(small.convert('L'), dtype=np.float32)

    # Номер авто — нижние 65% изображения (расширено для захвата тёмных номеров)
    y_start = int(height * 0.35)

    # Крупный шаг — достаточно для детекции
    step_x = max(1, width // 20)
    step_y = max(1, height // 20)

    plate_configs = [
        (0.15, 4.0),  # небольшой номер
        (0.18, 4.2),  # небольшой номер
        (0.22, 4.8),  # стандарт (520x112 мм ≈ 4.6:1)
        (0.26, 5.2),  # крупный
        (0.30, 5.5),  # очень крупный / квадратный кадр
    ]

    candidates = []

    for pw_ratio, aspect in plate_configs:
        pw = int(width * pw_ratio)
        ph = max(5, int(pw / aspect))

        if pw < 8 or ph < 4:
            continue

        for y in range(y_start, height - ph, step_y):
            for x in range(0, width - pw, step_x):
                region = gray_arr[y:y + ph, x:x + pw]

                avg_brightness = region.mean()
                contrast = float(region.max() - region.min())
                variance = float(region.var())

                # Принимаем и светлые (белые номера) и тёмные (затенённые)
                # Главный признак — высокий контраст и дисперсия (текст на фоне)
                if contrast <= 60:
                    continue
                if variance <= 500:
                    continue
                # Отсекаем только совсем однородные тёмные зоны без контраста
                if avg_brightness <= 40 and contrast <= 80:
                    continue

                y_position_ratio = y / height
                position_bonus = y_position_ratio * 60
                # Для тёмных номеров снижаем вес яркости, повышаем вес контраста
                score = min(avg_brightness, 200) * 0.1 + contrast * 0.6 + math.sqrt(variance) * 0.3 + position_bonus
                candidates.append((score, x, y, pw, ph))

    if not candidates:
        return []

    candidates.sort(reverse=True)
    top_candidates = candidates[:15]

    # NMS — убираем перекрывающиеся зоны
    selected = []
    for score, x, y, w, h in top_candidates:
        is_duplicate = False
        for sx, sy, sw, sh in selected:
            overlap_x = max(0, min(x + w, sx + sw) - max(x, sx))
            overlap_y = max(0, min(y + h, sy + sh) - max(y, sy))
            overlap_area = overlap_x * overlap_y
            min_area = min(w * h, sw * sh)
            if min_area > 0 and overlap_area / min_area > 0.3:
                is_duplicate = True
                break
        if not is_duplicate:
            selected.append((x, y, w, h))

    # Переводим координаты обратно в масштаб оригинального изображения
    if scale < 1.0:
        inv = 1.0 / scale
        selected = [(int(x * inv), int(y * inv), int(w * inv), int(h * inv)) for x, y, w, h in selected]

    return selected[:2]  # максимум 2 зоны (перед + зад)


def cover_license_plates(image_data: bytes, image_format: str) -> Optional[bytes]:
    """
    Находит гос. номер(а) на фото и заменяет их прямоугольником с текстом ЕРТТП.
    Возвращает обработанные байты или None если обработка не нужна/не удалась.
    """
    try:
        from PIL import Image, ImageDraw, ImageFont

        img = Image.open(io.BytesIO(image_data))

        # Исправляем ориентацию по EXIF (критично для фото с телефона)
        img = fix_image_orientation(img)

        # Конвертируем в RGB для рисования (на случай RGBA/P)
        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGB')

        # Сжимаем очень большие изображения чтобы не было таймаута
        max_side = 2000
        if img.width > max_side or img.height > max_side:
            img.thumbnail((max_side, max_side), Image.LANCZOS)
            print(f'Image resized to {img.width}x{img.height} for processing')

        regions = detect_license_plate_regions(img)

        if not regions:
            print('License plate detection: no plates found')
            return None

        print(f'License plate detection: found {len(regions)} candidate(s)')

        draw = ImageDraw.Draw(img)
        width, height = img.size

        for (x, y, w, h) in regions:
            # Немного расширяем зону для надёжности
            pad_x = int(w * 0.05)
            pad_y = int(h * 0.1)
            x1 = max(0, x - pad_x)
            y1 = max(0, y - pad_y)
            x2 = min(width, x + w + pad_x)
            y2 = min(height, y + h + pad_y)

            # Рисуем белый прямоугольник с чёрной рамкой
            draw.rectangle([x1, y1, x2, y2], fill=(255, 255, 255), outline=(0, 0, 0), width=3)

            # Рассчитываем размер текста чтобы вписать в прямоугольник
            box_w = x2 - x1
            box_h = y2 - y1
            text = 'ЕРТТП'

            # Подбираем размер шрифта — увеличен до 85% высоты блока
            font_size = max(12, int(box_h * 0.85))
            font = None
            for font_path in [
                '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
                '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
            ]:
                try:
                    font = ImageFont.truetype(font_path, font_size)
                    break
                except Exception:
                    continue
            if font is None:
                try:
                    font = ImageFont.load_default()
                except Exception:
                    pass

            # Центрируем текст, подгоняем размер если не влезает по ширине
            if font:
                for attempt in range(3):
                    try:
                        bbox = draw.textbbox((0, 0), text, font=font)
                        text_w = bbox[2] - bbox[0]
                        text_h = bbox[3] - bbox[1]
                    except Exception:
                        text_w = len(text) * font_size // 2
                        text_h = font_size
                    if text_w <= box_w * 0.9:
                        break
                    font_size = int(font_size * 0.8)
                    try:
                        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
                    except Exception:
                        break
            else:
                text_w = len(text) * 6
                text_h = 11

            text_x = x1 + (box_w - text_w) // 2
            text_y = y1 + (box_h - text_h) // 2

            draw.text((text_x, text_y), text, fill=(20, 20, 20), font=font)

        # Сохраняем в буфер
        output = io.BytesIO()
        save_format = 'JPEG' if image_format in ('jpg', 'jpeg') else image_format.upper()
        if save_format == 'WEBP':
            img.save(output, format='WEBP', quality=90)
        elif save_format == 'PNG':
            img.save(output, format='PNG')
        else:
            img = img.convert('RGB')
            img.save(output, format='JPEG', quality=90)
        output.seek(0)
        return output.read()

    except Exception as e:
        import traceback
        print(f'cover_license_plates error: {str(e)}')
        print(traceback.format_exc())
        return None


def upload_media(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Загрузить видео или изображение на S3"""
    body = json.loads(event.get('body', '{}'))

    if not body.get('video'):
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Video/Image data required'}),
            'isBase64Encoded': False
        }

    media_data_url = body['video']
    is_auto_photo = bool(body.get('isAutoPhoto', False))

    is_video = media_data_url.startswith('data:video')
    is_image = media_data_url.startswith('data:image')

    if not is_video and not is_image:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid media format. Must be video or image'}),
            'isBase64Encoded': False
        }

    try:
        header, base64_data = media_data_url.split(',', 1)
        media_data = base64.b64decode(base64_data)

        if is_video:
            content_type = 'video/mp4'
            extension = 'mp4'
            folder = 'offer-videos'
            if 'video/quicktime' in header or 'video/mov' in header:
                content_type = 'video/quicktime'
                extension = 'mov'
            elif 'video/webm' in header:
                content_type = 'video/webm'
                extension = 'webm'
        else:
            content_type = 'image/jpeg'
            extension = 'jpg'
            folder = 'offer-images'
            if 'image/png' in header:
                content_type = 'image/png'
                extension = 'png'
            elif 'image/webp' in header:
                content_type = 'image/webp'
                extension = 'webp'
            elif 'image/gif' in header:
                content_type = 'image/gif'
                extension = 'gif'

        max_size = 50 * 1024 * 1024 if is_video else 10 * 1024 * 1024
        if len(media_data) > max_size:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': f'{"Video" if is_video else "Image"} too large',
                    'maxSize': f'{"50" if is_video else "10"} MB',
                    'actualSize': f'{len(media_data) / 1024 / 1024:.1f} MB'
                }),
                'isBase64Encoded': False
            }

        # Если это фото авто — скрываем гос. номер
        plate_covered = False
        if is_image and is_auto_photo:
            print(f'Auto photo upload: running license plate detection (size={len(media_data)} bytes)')
            processed = cover_license_plates(media_data, extension)
            if processed:
                media_data = processed
                plate_covered = True
                print('License plate covered with ЕРТТП')
            else:
                print('No license plate found or processing skipped')

        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )

        file_id = str(uuid.uuid4())
        s3_key = f"{folder}/{file_id}.{extension}"

        s3.put_object(Bucket='files', Key=s3_key, Body=media_data, ContentType=content_type)

        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"

        media_type = "Video" if is_video else "Image"
        print(f"{media_type} uploaded: {cdn_url}, size: {len(media_data) / 1024 / 1024:.2f} MB, plate_covered={plate_covered}")

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'url': cdn_url,
                'size': len(media_data),
                'message': f'{media_type} uploaded successfully',
                'plateCovered': plate_covered
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        import traceback
        print(f'ERROR uploading media: {str(e)}')
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to upload media: {str(e)}'}),
            'isBase64Encoded': False
        }
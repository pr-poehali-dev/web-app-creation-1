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
            params = event.get('queryStringParameters') or {}
            action = params.get('action', '')
            if action == 'chunk':
                return upload_video_chunk(event, headers, params)
            if action == 'complete':
                return complete_video_chunks(event, headers, params)
            if params.get('binary') == '1':
                content_type = params.get('ct', 'video/mp4')
                return upload_binary_video(event, headers, content_type)
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


def detect_license_plate_google_vision(image_data: bytes) -> List[Tuple[int, int, int, int]]:
    """
    Использует Google Vision API для точного обнаружения гос. номеров.
    Возвращает список (x, y, w, h) найденных зон.
    Требует секрет GOOGLE_VISION_API_KEY.
    """
    api_key = os.environ.get('GOOGLE_VISION_API_KEY', '')
    if not api_key:
        return []

    try:
        import requests

        encoded = base64.b64encode(image_data).decode('utf-8')
        url = f'https://vision.googleapis.com/v1/images:annotate?key={api_key}'
        payload = {
            'requests': [{
                'image': {'content': encoded},
                'features': [
                    {'type': 'TEXT_DETECTION', 'maxResults': 20},
                    {'type': 'OBJECT_LOCALIZATION', 'maxResults': 20},
                ]
            }]
        }

        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code != 200:
            print(f'Google Vision API error: {resp.status_code} {resp.text[:200]}')
            return []

        data = resp.json()
        result = data.get('responses', [{}])[0]
        regions = []

        # 1. Ищем через OBJECT_LOCALIZATION — ищем объект с именем "Vehicle registration plate"
        for obj in result.get('localizedObjectAnnotations', []):
            name = obj.get('name', '').lower()
            if 'license' in name or 'plate' in name or 'registration' in name or 'number plate' in name:
                verts = obj['boundingPoly']['normalizedVertices']
                xs = [v.get('x', 0) for v in verts]
                ys = [v.get('y', 0) for v in verts]
                # normalizedVertices — будет умножено на реальные размеры позже
                regions.append(('normalized', min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)))

        # 2. Если объекты не нашли — ищем через TEXT_DETECTION по паттернам номеров
        if not regions:
            text_ann = result.get('textAnnotations', [])
            # Российский номер: А123ВС78, A123BC78 (латиница или кириллица)
            plate_pattern = re.compile(
                r'^[АВЕКМНОРСТУХABEKMHOPCTYX]\d{3}[АВЕКМНОРСТУХABEKMHOPCTYX]{2}\d{2,3}$',
                re.IGNORECASE
            )
            for ann in text_ann[1:]:  # первый — весь текст, пропускаем
                text = ann.get('description', '').strip().replace(' ', '').upper()
                if plate_pattern.match(text):
                    verts = ann['boundingPoly']['vertices']
                    xs = [v.get('x', 0) for v in verts]
                    ys = [v.get('y', 0) for v in verts]
                    x1, y1 = min(xs), min(ys)
                    w = max(xs) - x1
                    h = max(ys) - y1
                    # добавляем отступ 20%
                    pad_x = int(w * 0.2)
                    pad_y = int(h * 0.2)
                    regions.append(('pixel', max(0, x1 - pad_x), max(0, y1 - pad_y), w + 2 * pad_x, h + 2 * pad_y))

        print(f'Google Vision found {len(regions)} plate region(s)')
        return regions

    except Exception as e:
        print(f'Google Vision API exception: {e}')
        return []


def resolve_regions(regions: list, img_width: int, img_height: int) -> List[Tuple[int, int, int, int]]:
    """
    Преобразует регионы (normalized или pixel) в пиксельные координаты (x, y, w, h).
    """
    result = []
    for r in regions:
        if r[0] == 'normalized':
            _, nx, ny, nw, nh = r
            x = int(nx * img_width)
            y = int(ny * img_height)
            w = int(nw * img_width)
            h = int(nh * img_height)
            # добавляем отступ 10%
            pad_x = int(w * 0.10)
            pad_y = int(h * 0.10)
            result.append((max(0, x - pad_x), max(0, y - pad_y), w + 2 * pad_x, h + 2 * pad_y))
        else:
            _, x, y, w, h = r
            result.append((x, y, w, h))
    return result


def draw_erttp_on_regions(img, regions: List[Tuple[int, int, int, int]]):
    """
    Рисует белый прямоугольник с текстом ЕРТТП поверх каждой зоны гос. номера.
    """
    from PIL import ImageDraw, ImageFont

    draw = ImageDraw.Draw(img)
    width, height = img.size
    text = 'ЕРТТП'

    for (x, y, w, h) in regions:
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(width, x + w)
        y2 = min(height, y + h)
        box_w = x2 - x1
        box_h = y2 - y1

        draw.rectangle([x1, y1, x2, y2], fill=(255, 255, 255), outline=(0, 0, 0), width=3)

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

        text_w, text_h = box_w, box_h
        if font:
            for _ in range(3):
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


def merge_overlapping_regions(regions: List[Tuple[int, int, int, int]], overlap_threshold: float = 0.3) -> List[Tuple[int, int, int, int]]:
    """
    Объединяет перекрывающиеся регионы, оставляя только уникальные зоны (NMS).
    """
    if not regions:
        return []
    merged = []
    for (x, y, w, h) in regions:
        is_dup = False
        for (mx, my, mw, mh) in merged:
            overlap_x = max(0, min(x + w, mx + mw) - max(x, mx))
            overlap_y = max(0, min(y + h, my + mh) - max(y, my))
            overlap_area = overlap_x * overlap_y
            min_area = min(w * h, mw * mh)
            if min_area > 0 and overlap_area / min_area > overlap_threshold:
                is_dup = True
                break
        if not is_dup:
            merged.append((x, y, w, h))
    return merged


def cover_license_plates(image_data: bytes, image_format: str) -> Optional[bytes]:
    """
    Находит гос. номер(а) на фото и заменяет их прямоугольником с текстом ЕРТТП.
    Сначала пробует Google Vision API (точный), затем собственный алгоритм (запасной).
    Возвращает обработанные байты или None если обработка не нужна/не удалась.
    """
    try:
        from PIL import Image

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

        # 1. Пробуем Google Vision API — самый точный метод
        raw_regions = detect_license_plate_google_vision(image_data)
        pixel_regions = resolve_regions(raw_regions, img.width, img.height)
        pixel_regions = merge_overlapping_regions(pixel_regions)

        if pixel_regions:
            print(f'Using Google Vision: {len(pixel_regions)} plate(s) found')
            draw_erttp_on_regions(img, pixel_regions)
        else:
            # 2. Запасной алгоритм — собственная детекция через PIL/numpy
            fallback_regions = detect_license_plate_regions(img)
            fallback_regions = merge_overlapping_regions(fallback_regions)
            if not fallback_regions:
                print('License plate detection: no plates found (both methods)')
                return None
            print(f'Using fallback detector: {len(fallback_regions)} plate(s) found')
            draw_erttp_on_regions(img, fallback_regions)

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


VIDEO_MIME_EXTENSIONS = {
    'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
    'video/avi': 'avi', 'video/x-msvideo': 'avi', 'video/x-matroska': 'mkv',
    'video/3gpp': '3gp', 'video/3gpp2': '3g2', 'video/mpeg': 'mpeg',
    'video/x-m4v': 'm4v', 'video/x-ms-wmv': 'wmv', 'video/x-flv': 'flv',
}


def upload_binary_video(event: Dict[str, Any], headers: Dict[str, str], content_type: str) -> Dict[str, Any]:
    """Принимает видео файл как бинарное тело запроса (isBase64Encoded от платформы)"""
    body_raw = event.get('body', '')
    if not body_raw:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Empty body'}), 'isBase64Encoded': False}

    if event.get('isBase64Encoded'):
        video_data = base64.b64decode(body_raw)
    else:
        video_data = body_raw.encode('latin-1') if isinstance(body_raw, str) else body_raw

    # Получаем расширение из Content-Type или query params
    params = event.get('queryStringParameters') or {}
    filename = params.get('filename', '')
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else VIDEO_MIME_EXTENSIONS.get(content_type, 'mp4')
    ct = content_type if content_type in VIDEO_MIME_EXTENSIONS else 'video/mp4'

    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    file_id = str(uuid.uuid4())
    s3_key = f"offer-videos/{file_id}.{ext}"
    s3.put_object(Bucket='files', Key=s3_key, Body=video_data, ContentType=ct)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
    print(f"Binary video uploaded: {cdn_url}, size: {len(video_data) / 1024 / 1024:.2f} MB")

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'url': cdn_url, 'message': 'Video uploaded successfully'}),
        'isBase64Encoded': False
    }


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

    VIDEO_MIME_TYPES = {
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'video/mov': 'mov',
        'video/webm': 'webm',
        'video/avi': 'avi',
        'video/x-msvideo': 'avi',
        'video/x-matroska': 'mkv',
        'video/mkv': 'mkv',
        'video/3gpp': '3gp',
        'video/3gpp2': '3g2',
        'video/ogg': 'ogv',
        'video/mpeg': 'mpeg',
        'video/x-m4v': 'm4v',
        'video/m4v': 'm4v',
        'video/ts': 'ts',
        'video/x-flv': 'flv',
        'video/hevc': 'mp4',
        'video/x-ms-wmv': 'wmv',
    }

    header_part = media_data_url.split(',', 1)[0].lower() if ',' in media_data_url else ''
    detected_mime = ''
    for mime in VIDEO_MIME_TYPES:
        if mime in header_part:
            detected_mime = mime
            break

    is_video = media_data_url.startswith('data:video') or bool(detected_mime)
    # application/octet-stream с расширением видео — тоже видео
    if not is_video and 'application/octet-stream' in header_part:
        filename = body.get('filename', '')
        video_exts = ('.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.m4v', '.mpeg', '.mpg', '.flv', '.wmv', '.ts')
        if any(filename.lower().endswith(ext) for ext in video_exts):
            is_video = True

    is_image = not is_video and media_data_url.startswith('data:image')

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
            folder = 'offer-videos'
            if detected_mime and detected_mime in VIDEO_MIME_TYPES:
                content_type = detected_mime
                extension = VIDEO_MIME_TYPES[detected_mime]
            elif 'video/quicktime' in header or 'video/mov' in header:
                content_type = 'video/quicktime'
                extension = 'mov'
            elif 'video/webm' in header:
                content_type = 'video/webm'
                extension = 'webm'
            else:
                content_type = 'video/mp4'
                extension = 'mp4'
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

        max_size = 100 * 1024 * 1024 if is_video else 10 * 1024 * 1024
        if len(media_data) > max_size:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': f'{"Video" if is_video else "Image"} too large',
                    'maxSize': f'{"100" if is_video else "10"} MB',
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


def get_s3():
    return boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def upload_video_chunk(event: Dict[str, Any], headers: Dict[str, str], params: Dict[str, str]) -> Dict[str, Any]:
    """Принимает один чанк видео (base64) и сохраняет во временный S3-объект"""
    upload_id = params.get('uploadId', '')
    part_number = params.get('part', '0')
    if not upload_id:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing uploadId'}), 'isBase64Encoded': False}

    body_raw = event.get('body', '')
    if event.get('isBase64Encoded'):
        body_bytes = base64.b64decode(body_raw)
        chunk_data = body_bytes
    else:
        try:
            body_json = json.loads(body_raw)
            chunk_data = base64.b64decode(body_json.get('chunk', ''))
        except Exception:
            chunk_data = body_raw.encode('latin-1') if isinstance(body_raw, str) else body_raw

    s3 = get_s3()
    tmp_key = f"tmp-video-chunks/{upload_id}/part_{part_number.zfill(5)}"
    s3.put_object(Bucket='files', Key=tmp_key, Body=chunk_data)
    print(f"Chunk {part_number} saved: {tmp_key}, size={len(chunk_data)}")

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'ok': True, 'part': part_number}),
        'isBase64Encoded': False
    }


def complete_video_chunks(event: Dict[str, Any], headers: Dict[str, str], params: Dict[str, str]) -> Dict[str, Any]:
    """Склеивает все чанки, загружает финальный файл, удаляет временные"""
    body_raw = event.get('body', '{}')
    if event.get('isBase64Encoded'):
        body_raw = base64.b64decode(body_raw).decode('utf-8')
    body = json.loads(body_raw)

    upload_id = body.get('uploadId', '')
    filename = body.get('filename', 'video.mp4')
    content_type = body.get('contentType', 'video/mp4')
    total_parts = int(body.get('totalParts', 0))

    if not upload_id or not total_parts:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing uploadId or totalParts'}), 'isBase64Encoded': False}

    s3 = get_s3()

    # Читаем и склеиваем все чанки по порядку
    final_data = bytearray()
    for i in range(total_parts):
        tmp_key = f"tmp-video-chunks/{upload_id}/part_{str(i).zfill(5)}"
        try:
            obj = s3.get_object(Bucket='files', Key=tmp_key)
            final_data.extend(obj['Body'].read())
            print(f"Read chunk {i}: {tmp_key}")
        except Exception as e:
            print(f"ERROR reading chunk {i}: {e}")
            return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': f'Missing chunk {i}'}), 'isBase64Encoded': False}

    # Сохраняем финальный файл
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'mp4'
    file_id = str(uuid.uuid4())
    s3_key = f"offer-videos/{file_id}.{ext}"
    s3.put_object(Bucket='files', Key=s3_key, Body=bytes(final_data), ContentType=content_type)
    print(f"Final video uploaded: {s3_key}, size={len(final_data) / 1024 / 1024:.2f} MB")

    # Удаляем временные чанки
    for i in range(total_parts):
        tmp_key = f"tmp-video-chunks/{upload_id}/part_{str(i).zfill(5)}"
        try:
            s3.delete_object(Bucket='files', Key=tmp_key)
        except Exception:
            pass

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'url': cdn_url, 'message': 'Video uploaded successfully'}),
        'isBase64Encoded': False
    }
import json
import os
import traceback
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
}

DATABASE_URL = os.environ.get('DATABASE_URL')


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def handler(event: dict, context) -> dict:
    """
    Сохранение и обновление контракта.
    POST / — создать контракт (status='draft') или опубликовать (status='open')
    PUT / — обновить существующий контракт (body.contractId обязателен, только автор)
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if event.get('httpMethod') == 'PUT':
        user_id = (event.get('headers') or {}).get('X-User-Id') or (event.get('headers') or {}).get('x-user-id')
        if not user_id:
            return {'statusCode': 401, 'headers': {**CORS, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Unauthorized'})}
        body = json.loads(event.get('body') or '{}')
        contract_id = body.get('contractId')
        if not contract_id:
            return {'statusCode': 400, 'headers': {**CORS, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'contractId обязателен'})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('SELECT seller_id, status FROM contracts WHERE id = %s', (int(contract_id),))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': {**CORS, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Контракт не найден'})}
        if str(row[0]) != str(user_id):
            cur.close(); conn.close()
            return {'statusCode': 403, 'headers': {**CORS, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Нет доступа'})}
        product_name = body.get('productName', '').strip()
        title = body.get('title', '').strip() or f"{product_name} {body.get('quantity', '')} {body.get('unit', '')}"
        contract_type = body.get('contractType', 'forward')
        product_specs = None
        if contract_type == 'barter':
            product_specs = json.dumps({
                'productNameB': body.get('productNameB', ''),
                'quantityB': body.get('quantityB', ''),
                'unitB': body.get('unitB', ''),
                'categoryB': body.get('categoryB', ''),
            })
        publish = body.get('publish', False)
        new_status = 'open' if publish else (row[1] if row[1] in ('draft', 'open') else row[1])
        product_images_raw = body.get('productImages') or []
        product_images = product_images_raw if product_images_raw else None
        product_images_b = body.get('productImagesB') or []
        if product_type := body.get('contractType', contract_type):
            if product_type == 'barter' and product_images_b:
                existing_specs = json.loads(product_specs) if product_specs else {}
                existing_specs['productImagesB'] = product_images_b
                product_specs = json.dumps(existing_specs)
        upd_delivery_types = body.get('deliveryTypes') or []
        upd_delivery_method = ', '.join(upd_delivery_types) if upd_delivery_types else body.get('deliveryMethod', '')
        upd_delivery_districts = json.dumps(body.get('deliveryDistricts') or [])
        upd_is_barter = contract_type == 'barter'
        upd_needs_default_dates = upd_is_barter or contract_type == 'forward-request'
        upd_delivery_date = body.get('deliveryDate') or ('2099-12-31' if upd_needs_default_dates else None)
        upd_start_date = body.get('contractStartDate') or ('2000-01-01' if upd_needs_default_dates else None)
        upd_end_date = body.get('contractEndDate') or ('2099-12-31' if upd_needs_default_dates else None)
        cur.execute("""
            UPDATE contracts SET
                contract_type=%s, title=%s, category=%s, product_name=%s, product_specs=%s,
                quantity=%s, unit=%s, price_per_unit=%s, total_amount=%s,
                delivery_date=%s, contract_start_date=%s, contract_end_date=%s,
                delivery_address=%s, delivery_method=%s, delivery_districts=%s,
                prepayment_percent=%s, prepayment_amount=%s,
                terms_conditions=%s, status=%s, product_images=%s, updated_at=NOW()
            WHERE id=%s
        """, (
            contract_type, title, body.get('category', 'other'), product_name, product_specs,
            float(body.get('quantity') or 0), body.get('unit', 'шт'),
            float(body.get('pricePerUnit') or 0), float(body.get('totalAmount') or 0),
            upd_delivery_date, upd_start_date, upd_end_date,
            body.get('deliveryAddress', ''), upd_delivery_method, upd_delivery_districts,
            float(body.get('prepaymentPercent') or 0), float(body.get('prepaymentAmount') or 0),
            body.get('termsConditions', ''), new_status, product_images,
            int(contract_id),
        ))
        conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True, 'contractId': int(contract_id), 'status': new_status})}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Method not allowed'})}

    user_id = (event.get('headers') or {}).get('X-User-Id') or (event.get('headers') or {}).get('x-user-id')
    if not user_id:
        return {'statusCode': 401, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Unauthorized'})}

    body = json.loads(event.get('body') or '{}')

    contract_type = body.get('contractType', 'forward')
    if contract_type not in ('forward', 'barter', 'forward-request'):
        contract_type = 'forward'
    title = (body.get('title') or '').strip()[:255]
    category = body.get('category') or 'other'
    product_name = (body.get('productName') or '').strip()
    quantity = float(body.get('quantity') or 0)
    unit = (body.get('unit') or 'шт')[:50]
    is_barter = contract_type == 'barter'
    is_request = contract_type == 'forward-request'
    needs_default_dates = is_barter or is_request
    price_per_unit = float(body.get('pricePerUnit') or 0)
    total_amount = float(body.get('totalAmount') or 0)
    prepayment_percent = float(body.get('prepaymentPercent') or 0)
    prepayment_amount = float(body.get('prepaymentAmount') or 0)
    delivery_date = (body.get('deliveryDate') or '').strip() or ('2099-12-31' if needs_default_dates else None)
    contract_start_date = (body.get('contractStartDate') or '').strip() or ('2000-01-01' if needs_default_dates else None)
    contract_end_date = (body.get('contractEndDate') or '').strip() or ('2099-12-31' if needs_default_dates else None)
    if not delivery_date:
        delivery_date = '2099-12-31'
    if not contract_start_date:
        contract_start_date = '2000-01-01'
    if not contract_end_date:
        contract_end_date = '2099-12-31'
    delivery_address = (body.get('deliveryAddress') or '')
    delivery_types = body.get('deliveryTypes') or []
    delivery_method = (', '.join(delivery_types) if delivery_types else (body.get('deliveryMethod') or ''))[:100]
    delivery_districts = body.get('deliveryDistricts') or []
    terms_conditions = body.get('termsConditions') or ''
    document_url = body.get('documentUrl') or None
    publish = body.get('publish', False)

    product_images_raw = body.get('productImages') or []
    product_images_b = body.get('productImagesB') or []
    product_images = product_images_raw if product_images_raw else None
    product_specs = None
    if contract_type == 'barter':
        product_specs = json.dumps({
            'productNameB': body.get('productNameB', ''),
            'quantityB': body.get('quantityB', ''),
            'unitB': body.get('unitB', ''),
            'categoryB': body.get('categoryB', ''),
            'totalAmountB': body.get('totalAmountB', ''),
            'productImagesB': product_images_b,
        })
    elif contract_type == 'forward-request':
        price_type = body.get('priceType', 'negotiable')
        product_specs = json.dumps({'priceType': price_type})

    status = 'open' if publish else 'draft'

    if not product_name:
        return {'statusCode': 400, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Укажите название товара'})}

    if not title:
        title = f"{product_name} {quantity} {unit}"

    print(f"[save-contract] INSERT: type={contract_type} status={status} dd={delivery_date} user={user_id} imgs={product_images}")

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO contracts
                (contract_type, title, category, product_name, product_specs,
                 quantity, unit, price_per_unit, total_amount, currency,
                 delivery_date, contract_start_date, contract_end_date,
                 seller_id, status,
                 delivery_address, delivery_method, delivery_districts,
                 prepayment_percent, prepayment_amount,
                 terms_conditions, product_video_url, product_images,
                 created_at, updated_at)
            VALUES
                (%s, %s, %s, %s, %s,
                 %s, %s, %s, %s, 'RUB',
                 %s, %s, %s,
                 %s, %s,
                 %s, %s, %s,
                 %s, %s,
                 %s, %s, %s,
                 NOW(), NOW())
            RETURNING id
        """, (
            contract_type, title, category, product_name, product_specs,
            quantity, unit, price_per_unit, total_amount,
            delivery_date, contract_start_date, contract_end_date,
            int(user_id), status,
            delivery_address, delivery_method, json.dumps(delivery_districts),
            prepayment_percent, prepayment_amount,
            terms_conditions, document_url, product_images,
        ))

        contract_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True,
                'contractId': contract_id,
                'status': status,
            }),
        }
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        print(f"[save-contract] DB ERROR: {e}\n{traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': f'Ошибка БД: {str(e)}'}),
        }
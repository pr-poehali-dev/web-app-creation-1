import json
import os
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
    Сохранение контракта в БД после генерации документа.
    POST / — создать контракт (status='draft') или опубликовать (status='open')
    Body: { contractType, title, category, productName, quantity, unit, pricePerUnit,
            deliveryDate, contractStartDate, contractEndDate, deliveryAddress, deliveryMethod,
            prepaymentPercent, prepaymentAmount, totalAmount, termsConditions, documentUrl,
            publish (bool), productNameB, quantityB, unitB, categoryB }
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Method not allowed'})}

    user_id = (event.get('headers') or {}).get('X-User-Id') or (event.get('headers') or {}).get('x-user-id')
    if not user_id:
        return {'statusCode': 401, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Unauthorized'})}

    body = json.loads(event.get('body') or '{}')

    contract_type = body.get('contractType', 'forward')
    title = body.get('title', '').strip()
    category = body.get('category', 'other')
    product_name = body.get('productName', '').strip()
    quantity = float(body.get('quantity') or 0)
    unit = body.get('unit', 'шт')
    price_per_unit = float(body.get('pricePerUnit') or 0)
    total_amount = float(body.get('totalAmount') or 0)
    prepayment_percent = float(body.get('prepaymentPercent') or 0)
    prepayment_amount = float(body.get('prepaymentAmount') or 0)
    delivery_date = body.get('deliveryDate') or None
    contract_start_date = body.get('contractStartDate') or None
    contract_end_date = body.get('contractEndDate') or None
    delivery_address = body.get('deliveryAddress', '')
    delivery_method = body.get('deliveryMethod', '')
    terms_conditions = body.get('termsConditions', '')
    document_url = body.get('documentUrl') or None
    publish = body.get('publish', False)

    product_specs = None
    if contract_type == 'barter':
        product_specs = json.dumps({
            'productNameB': body.get('productNameB', ''),
            'quantityB': body.get('quantityB', ''),
            'unitB': body.get('unitB', ''),
            'categoryB': body.get('categoryB', ''),
            'totalAmountB': body.get('totalAmountB', ''),
        })

    status = 'open' if publish else 'draft'

    if not product_name:
        return {'statusCode': 400, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Укажите название товара'})}

    if not title:
        title = f"{product_name} {quantity} {unit}"

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO contracts
            (contract_type, title, category, product_name, product_specs,
             quantity, unit, price_per_unit, total_amount, currency,
             delivery_date, contract_start_date, contract_end_date,
             seller_id, status,
             delivery_address, delivery_method,
             prepayment_percent, prepayment_amount,
             terms_conditions, product_video_url,
             created_at, updated_at)
        VALUES
            (%s, %s, %s, %s, %s,
             %s, %s, %s, %s, 'RUB',
             %s, %s, %s,
             %s, %s,
             %s, %s,
             %s, %s,
             %s, %s,
             NOW(), NOW())
        RETURNING id
    """, (
        contract_type, title, category, product_name, product_specs,
        quantity, unit, price_per_unit, total_amount,
        delivery_date, contract_start_date, contract_end_date,
        int(user_id), status,
        delivery_address, delivery_method,
        prepayment_percent, prepayment_amount,
        terms_conditions, document_url,
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

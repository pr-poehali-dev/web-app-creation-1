'''
Business: Resubmit verification request with updated documents after rejection
Args: event - dict with httpMethod, body with verification data, headers with X-User-Id
      context - object with request_id attribute
Returns: HTTP response dict with updated verification request
'''

import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL environment variable is not set')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
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
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
        
        headers = event.get('headers', {})
        user_id = headers.get('X-User-Id') or headers.get('x-user-id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        verification_id = body_data.get('verificationId')
        
        if not verification_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Verification ID is required'}),
                'isBase64Encoded': False
            }
        
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute(f"SELECT user_id, status FROM user_verifications WHERE id = {verification_id}")
            verification = cursor.fetchone()
            
            if not verification:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Verification request not found'}),
                    'isBase64Encoded': False
                }
            
            if str(verification[0]) != str(user_id):
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Access denied'}),
                    'isBase64Encoded': False
                }
            
            if verification[1] != 'rejected':
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Can only resubmit rejected verification requests'}),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            
            if body_data.get('passportScanUrl'):
                update_fields.append(f"passport_scan_url = '{body_data['passportScanUrl']}'")
            if body_data.get('passportRegistrationUrl'):
                update_fields.append(f"passport_registration_url = '{body_data['passportRegistrationUrl']}'")
            if body_data.get('utilityBillUrl'):
                update_fields.append(f"utility_bill_url = '{body_data['utilityBillUrl']}'")
            if body_data.get('registrationCertUrl'):
                update_fields.append(f"registration_cert_url = '{body_data['registrationCertUrl']}'")
            if body_data.get('agreementFormUrl'):
                update_fields.append(f"agreement_form_url = '{body_data['agreementFormUrl']}'")
            if body_data.get('phone'):
                update_fields.append(f"phone = '{body_data['phone']}'")
            if body_data.get('registrationAddress'):
                update_fields.append(f"registration_address = '{body_data['registrationAddress']}'")
            if body_data.get('actualAddress'):
                update_fields.append(f"actual_address = '{body_data['actualAddress']}'")
            if body_data.get('companyName'):
                update_fields.append(f"company_name = '{body_data['companyName']}'")
            if body_data.get('inn'):
                update_fields.append(f"inn = '{body_data['inn']}'")
            
            if body_data.get('message'):
                update_fields.append(f"admin_message = '{body_data['message']}'")
            
            update_fields.append("status = 'pending'")
            update_fields.append("rejection_reason = NULL")
            update_fields.append("is_resubmitted = TRUE")
            update_fields.append(f"updated_at = CURRENT_TIMESTAMP")
            
            update_query = f"UPDATE user_verifications SET {', '.join(update_fields)} WHERE id = {verification_id}"
            cursor.execute(update_query)
            conn.commit()
            
            cursor.execute(f"SELECT uv.verification_type, u.first_name, u.last_name, u.email FROM user_verifications uv JOIN users u ON uv.user_id = u.id WHERE uv.id = {verification_id}")
            verification_info = cursor.fetchone()
            
            if verification_info:
                import urllib.request
                import urllib.error
                
                user_name = f"{verification_info[1]} {verification_info[2]}"
                user_email = verification_info[3]
                verification_type_value = verification_info[0]
                
                email_payload = {
                    'userName': user_name,
                    'userEmail': user_email,
                    'verificationType': verification_type_value,
                    'phone': body_data.get('phone', '')
                }
                
                if verification_type_value == 'legal_entity':
                    email_payload['companyName'] = body_data.get('companyName', '')
                    email_payload['inn'] = body_data.get('inn', '')
                    email_payload['registrationCertUrl'] = body_data.get('registrationCertUrl', '')
                    email_payload['agreementFormUrl'] = body_data.get('agreementFormUrl', '')
                else:
                    email_payload['registrationAddress'] = body_data.get('registrationAddress', '')
                    email_payload['actualAddress'] = body_data.get('actualAddress', '')
                    email_payload['passportScanUrl'] = body_data.get('passportScanUrl', '')
                    email_payload['passportRegistrationUrl'] = body_data.get('passportRegistrationUrl', '')
                    email_payload['utilityBillUrl'] = body_data.get('utilityBillUrl', '')
                    email_payload['inn'] = body_data.get('inn', '')
                
                # NOTE: Email-уведомления отключены (функция send-verification-email удалена)
                # Если нужны уведомления - используйте Telegram или пуш-уведомления
                # try:
                #     email_data = json.dumps(email_payload).encode('utf-8')
                #     email_req = urllib.request.Request(
                #         'https://functions.poehali.dev/42f9ef7b-b116-430a-ac8a-681742e10551',
                #         data=email_data,
                #         headers={'Content-Type': 'application/json'}
                #     )
                #     urllib.request.urlopen(email_req, timeout=5)
                # except (urllib.error.URLError, Exception):
                #     pass
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'message': 'Verification request resubmitted successfully'
                }),
                'isBase64Encoded': False
            }
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'}),
            'isBase64Encoded': False
        }
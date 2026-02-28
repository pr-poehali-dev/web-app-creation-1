import json
import os
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import load_pem_private_key

def generate_vapid_keys():
    private_key = ec.generate_private_key(ec.SECP256R1())
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    public_key_bytes = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    public_key_b64 = base64.urlsafe_b64encode(public_key_bytes).rstrip(b'=').decode('utf-8')
    return private_pem, public_key_b64

def get_public_key_from_pem(pem_str: str) -> str:
    private_key = load_pem_private_key(pem_str.encode('utf-8'), password=None)
    public_key_bytes = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    return base64.urlsafe_b64encode(public_key_bytes).rstrip(b'=').decode('utf-8')

def handler(event: dict, context) -> dict:
    """Генерация и получение публичного VAPID-ключа для push-уведомлений"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }

    private_key_pem = os.environ.get('VAPID_PRIVATE_KEY', '')

    if not private_key_pem:
        private_pem, public_key = generate_vapid_keys()
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'generated',
                'publicKey': public_key,
                'privateKeyPem': private_pem,
                'message': 'Save privateKeyPem as VAPID_PRIVATE_KEY secret, publicKey goes to frontend'
            })
        }

    public_key = get_public_key_from_pem(private_key_pem)
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'publicKey': public_key})
    }
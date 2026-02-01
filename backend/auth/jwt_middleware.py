import os
import jwt
from typing import Dict, Any, Optional

JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'fallback-dev-secret-DO-NOT-USE-IN-PRODUCTION')
JWT_ALGORITHM = 'HS256'

def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_from_request(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    headers = event.get('headers', {})
    
    auth_header = headers.get('X-Authorization') or headers.get('Authorization')
    if not auth_header:
        return None
    
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
    else:
        token = auth_header
    
    return verify_jwt_token(token)

def require_auth(event: Dict[str, Any]) -> tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    user = get_user_from_request(event)
    
    if not user:
        error_response = {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': '{"error": "Требуется авторизация"}',
            'isBase64Encoded': False
        }
        return None, error_response
    
    return user, None

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
    
    payload = verify_jwt_token(token)
    if not payload:
        return None
    
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    DATABASE_URL = os.environ.get('DATABASE_URL')
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        with conn.cursor() as cur:
            cur.execute(
                "SELECT is_root_admin FROM t_p42562714_web_app_creation_1.users WHERE id = %s",
                (payload.get('user_id'),)
            )
            result = cur.fetchone()
            if result:
                payload['is_root_admin'] = result['is_root_admin']
        conn.close()
    except:
        pass
    
    return payload

"""
Вспомогательные функции для отправки уведомлений в Telegram
"""
import os
import urllib.request
import json
from typing import Optional

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://preview--web-app-creation-1.poehali.dev')

def send_telegram_message(chat_id: str, text: str, parse_mode: str = 'HTML') -> bool:
    """Отправка сообщения в Telegram"""
    if not TELEGRAM_BOT_TOKEN or not chat_id:
        return False
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': parse_mode
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('ok', False)
    except Exception as e:
        print(f'Error sending Telegram message: {str(e)}')
        return False

def send_reset_password_link_telegram(chat_id: str, reset_link: str) -> bool:
    """Отправка ссылки для сброса пароля в Telegram"""
    text = (
        f"🔑 <b>Восстановление пароля</b>\n\n"
        f"Вы запросили восстановление пароля.\n"
        f"Перейдите по ссылке ниже, чтобы создать новый пароль:\n\n"
        f"<a href='{reset_link}'>Восстановить пароль</a>\n\n"
        f"Ссылка действительна в течение 1 часа.\n"
        f"Если вы не запрашивали восстановление пароля, проигнорируйте это сообщение."
    )
    
    return send_telegram_message(chat_id, text)

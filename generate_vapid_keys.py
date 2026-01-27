#!/usr/bin/env python3
"""
Скрипт для генерации VAPID ключей для Web Push API
Использование: python3 generate_vapid_keys.py
"""

try:
    from py_vapid import Vapid
    
    print("=== Генерация VAPID ключей для Web Push API ===\n")
    
    # Генерируем ключи
    vapid = Vapid()
    vapid.generate_keys()
    
    # Получаем ключи
    public_key = vapid.public_key.public_bytes()
    private_key = vapid.private_key.private_bytes()
    
    print("✅ Ключи успешно сгенерированы!\n")
    print("=" * 60)
    print("VAPID_PUBLIC_KEY:")
    print(public_key.decode('utf-8'))
    print("=" * 60)
    print("\nVAPID_PRIVATE_KEY:")
    print(private_key.decode('utf-8'))
    print("=" * 60)
    print("\nVAPID_EMAIL:")
    print("mailto:support@erttp.ru")
    print("=" * 60)
    
    print("\n📝 Инструкция:")
    print("1. Скопируйте каждый ключ")
    print("2. Добавьте их в секреты проекта через админ-панель")
    print("3. Обновите VAPID_PUBLIC_KEY в src/utils/pushNotifications.ts")
    print("\n✨ Готово! Теперь push-уведомления будут работать даже оффлайн!")
    
except ImportError:
    print("❌ Ошибка: библиотека py-vapid не установлена")
    print("\n📦 Установите её командой:")
    print("   pip install py-vapid")
    print("\nИли используйте онлайн-генератор:")
    print("   https://web-push-codelab.glitch.me/")
except Exception as e:
    print(f"❌ Ошибка при генерации ключей: {e}")
    print("\nПопробуйте альтернативный способ:")
    print("   npm install -g web-push")
    print("   web-push generate-vapid-keys")

"""
ИИ-помощник для заполнения формы предложений через Gemini API.
POST /ai-assist
Body: { action: "improve_title"|"improve_description"|"suggest_description", title?: string, description?: string, category?: string }
Возвращает: { result: string }
"""
import json
import os
import requests


def call_gemini(prompt: str) -> str:
    api_key = os.environ["GEMINI_API_KEY"]
    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
        headers={"Content-Type": "application/json"},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 400,
            },
        },
        timeout=25,
    )
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()


def handler(event: dict, context) -> dict:
    """
    ИИ-помощник для улучшения текстов в форме предложений (Gemini).
    """
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")
    title = body.get("title", "").strip()
    description = body.get("description", "").strip()
    category = body.get("category", "")

    if not action:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "action is required"})}

    if action == "improve_title":
        if not title:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "title is required"})}
        prompt = (
            f"Улучши название торгового предложения для платформы ЕРТТП (электронная торговая площадка). "
            f"Категория: {category or 'не указана'}. "
            f"Текущее название: «{title}». "
            f"Сделай название чётким, конкретным и привлекательным. "
            f"Верни ТОЛЬКО улучшенное название, без пояснений и кавычек, не более 80 символов."
        )
    elif action == "improve_description":
        if not description:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "description is required"})}
        prompt = (
            f"Улучши описание торгового предложения для платформы ЕРТТП. "
            f"Категория: {category or 'не указана'}. "
            f"{'Название: «' + title + '». ' if title else ''}"
            f"Текущее описание: «{description}». "
            f"Исправь орфографию, улучши стиль, сделай текст профессиональным и понятным. "
            f"Верни ТОЛЬКО улучшенное описание, без пояснений, не более 900 символов."
        )
    elif action == "suggest_description":
        if not title:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "title is required"})}
        prompt = (
            f"Напиши описание торгового предложения для платформы ЕРТТП. "
            f"Категория: {category or 'не указана'}. "
            f"Название: «{title}». "
            f"Напиши профессиональное, конкретное описание товара/услуги: характеристики, условия, преимущества. "
            f"Верни ТОЛЬКО описание, без пояснений, 150-400 символов."
        )
    else:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "unknown action"})}

    result = call_gemini(prompt)

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({"result": result}, ensure_ascii=False),
    }

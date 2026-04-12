"""
ИИ-помощник для улучшения текстов в предложениях и контрактах через YandexGPT API. v2
POST /ai-assist
Body: { action: string, title?: string, description?: string, category?: string,
        productName?: string, termsConditions?: string, contractType?: string }
Возвращает: { result: string }
"""
import json
import os
import requests


def call_yandex_gpt(prompt: str, max_tokens: int = 400) -> str:
    api_key = os.environ["YANDEX_API_KEY"]
    folder_id = os.environ["YANDEX_FOLDER_ID"]
    response = requests.post(
        "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Api-Key {api_key}",
            "x-folder-id": folder_id,
        },
        json={
            "modelUri": f"gpt://{folder_id}/yandexgpt-lite",
            "completionOptions": {
                "stream": False,
                "temperature": 0.7,
                "maxTokens": max_tokens,
            },
            "messages": [
                {
                    "role": "system",
                    "text": "Ты помощник для торговой платформы ЕРТТП (Единая Российская Торговая Площадка). Отвечай кратко, строго по заданию, без лишних пояснений."
                },
                {"role": "user", "text": prompt}
            ],
        },
        timeout=25,
    )
    response.raise_for_status()
    return response.json()["result"]["alternatives"][0]["message"]["text"].strip()


def handler(event: dict, context) -> dict:
    """
    ИИ-помощник для улучшения текстов в форме предложений и контрактов (YandexGPT).
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
    product_name = body.get("productName", "").strip()
    terms = body.get("termsConditions", "").strip()
    contract_type = body.get("contractType", "")

    if not action:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "action is required"})}

    # --- Действия для предложений ---
    if action == "improve_title":
        if not title:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "title is required"})}
        prompt = (
            f"Улучши название торгового предложения для платформы ЕРТТП.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"Текущее название: «{title}».\n"
            f"Сделай название чётким, конкретным и привлекательным.\n"
            f"Верни ТОЛЬКО улучшенное название, без пояснений и кавычек, не более 80 символов."
        )
        max_tokens = 60

    elif action == "improve_description":
        if not description:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "description is required"})}
        prompt = (
            f"Улучши описание торгового предложения для платформы ЕРТТП.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"{'Название: «' + title + '». ' if title else ''}"
            f"Текущее описание: «{description}».\n"
            f"Исправь орфографию, улучши стиль, сделай текст профессиональным и понятным.\n"
            f"Верни ТОЛЬКО улучшенное описание, без пояснений, не более 900 символов."
        )
        max_tokens = 500

    elif action == "suggest_description":
        if not title:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "title is required"})}
        prompt = (
            f"Напиши описание торгового предложения для платформы ЕРТТП.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"Название: «{title}».\n"
            f"Напиши профессиональное, конкретное описание: характеристики, условия, преимущества.\n"
            f"Верни ТОЛЬКО описание, без пояснений, 150-400 символов."
        )
        max_tokens = 300

    # --- Действия для контрактов ---
    elif action == "improve_contract_title":
        if not title:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "title is required"})}
        contract_type_label = {"forward": "форвардный контракт", "forward-request": "заявка на форвард", "barter": "бартер"}.get(contract_type, "контракт")
        prompt = (
            f"Улучши название контракта для платформы ЕРТТП ({contract_type_label}).\n"
            f"{'Товар: ' + product_name + '. ' if product_name else ''}"
            f"Категория: {category or 'не указана'}.\n"
            f"Текущее название: «{title}».\n"
            f"Сделай название конкретным, информативным (товар, объём, срок).\n"
            f"Верни ТОЛЬКО улучшенное название, без кавычек, не более 100 символов."
        )
        max_tokens = 80

    elif action == "suggest_contract_title":
        if not product_name:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "productName is required"})}
        contract_type_label = {"forward": "форвардный контракт", "forward-request": "заявка на форвард", "barter": "бартер"}.get(contract_type, "контракт")
        prompt = (
            f"Придумай название контракта для платформы ЕРТТП ({contract_type_label}).\n"
            f"Товар: {product_name}.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"Название должно быть конкретным и информативным (что поставляется, тип сделки).\n"
            f"Верни ТОЛЬКО название, без кавычек и пояснений, не более 100 символов."
        )
        max_tokens = 80

    elif action == "improve_contract_terms":
        if not terms:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "termsConditions is required"})}
        prompt = (
            f"Улучши текст дополнительных условий контракта для платформы ЕРТТП.\n"
            f"{'Товар: ' + product_name + '. ' if product_name else ''}"
            f"Текущий текст: «{terms}».\n"
            f"Исправь орфографию, сделай текст юридически корректным и понятным.\n"
            f"Верни ТОЛЬКО улучшенный текст условий, без пояснений, не более 600 символов."
        )
        max_tokens = 400

    elif action == "suggest_contract_terms":
        if not product_name:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "productName is required"})}
        contract_type_label = {"forward": "форвардный контракт", "forward-request": "заявка", "barter": "бартер"}.get(contract_type, "контракт")
        prompt = (
            f"Напиши типовые дополнительные условия для контракта на платформе ЕРТТП ({contract_type_label}).\n"
            f"Товар: {product_name}.\n"
            f"Категория: {category or 'не указана'}.\n"
            f"Укажи требования к качеству, упаковке, документации, форс-мажорным обстоятельствам.\n"
            f"Верни ТОЛЬКО текст условий, без заголовков и пояснений, 150-500 символов."
        )
        max_tokens = 400

    else:
        return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "unknown action"})}

    result = call_yandex_gpt(prompt, max_tokens)

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({"result": result}, ensure_ascii=False),
    }
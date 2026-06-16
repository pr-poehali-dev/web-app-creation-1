"""
Одноразовая функция: скачивает royalty-free MP3 с incompetech.com (CC BY лицензия)
и сохраняет в S3. Запустить один раз POST /.
"""
import os
import json
import boto3
import urllib.request

TRACKS = {
    "all":    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Relaxing%20Piano%20Music.mp3",
    "focus":  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2001.mp3",
    "stress": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Flutey%20Funk.mp3",
    "energy": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Intended%20Force.mp3",
    "eyes":   "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Comfortable%20Mystery.mp3",
}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"ok": True, "status": "send POST to upload sounds"})}

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    results = {}

    for mode, url in TRACKS.items():
        key = f"brain-sounds/{mode}.mp3"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=55) as resp:
            data = resp.read()
        s3.put_object(Bucket="files", Key=key, Body=data, ContentType="audio/mpeg")
        results[mode] = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "urls": results}),
    }
"""
Загружает по одному royalty-free MP3 с incompetech.com (CC BY Kevin MacLeod) в S3.
GET / — список треков. POST /?track=name — загрузить один трек.
"""
import os
import json
import boto3
import urllib.request

TRACKS = {
    "all":               "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Relaxing%20Piano%20Music.mp3",
    "focus":             "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2001.mp3",
    "stress":            "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Flutey%20Funk.mp3",
    "energy":            "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Intended%20Force.mp3",
    "eyes":              "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Comfortable%20Mystery.mp3",
    "extra_gymnopedie":  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%203.mp3",
    "extra_bright":      "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Open%20Those%20Bright%20Eyes.mp3",
    "extra_meditation3": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2003.mp3",
    "extra_cipher":      "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cipher.mp3",
    "extra_hypnotic":    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hypnotic%20Puzzle.mp3",
    "extra_groove":      "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Groove%20Grove.mp3",
    "extra_impact":      "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Impact%20Moderato.mp3",
}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def handler(event: dict, context) -> dict:
    """Загружает один трек в S3. GET — список доступных, POST ?track=name — загрузить."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    track_name = params.get("track")

    if event.get("httpMethod") == "GET" or not track_name:
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "tracks": list(TRACKS.keys()), "usage": "POST /?track=name"}),
        }

    if track_name not in TRACKS:
        return {
            "statusCode": 404,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": False, "error": f"Unknown: {track_name}", "available": list(TRACKS.keys())}),
        }

    url = TRACKS[track_name]
    key = f"brain-sounds/{track_name}.mp3"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    access_key = os.environ["AWS_ACCESS_KEY_ID"]

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = resp.read()

    s3.put_object(Bucket="files", Key=key, Body=data, ContentType="audio/mpeg")
    cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "track": track_name, "url": cdn_url}),
    }
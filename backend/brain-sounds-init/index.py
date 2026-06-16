"""
Загружает по одному royalty-free MP3 с incompetech.com (CC BY Kevin MacLeod) в S3.
GET / — список треков. POST /?track=name — загрузить один трек.
"""
import os
import json
import boto3
import urllib.request

TRACKS = {
    # Основные треки режимов
    "all":    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Relaxing%20Piano%20Music.mp3",
    "focus":  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2001.mp3",
    "stress": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Flutey%20Funk.mp3",
    "energy": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Intended%20Force.mp3",
    "eyes":   "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Comfortable%20Mystery.mp3",

    # Расслабляющие / ambient — для all, stress, eyes
    "long_slow":       "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Slow%20Burn.mp3",
    "long_healing":    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Healing.mp3",
    "long_dreamy":     "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dreamy%20Flashback.mp3",
    "long_space":      "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Space%20Fighter.mp3",
    "long_cipher2":    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cipher.mp3",
    "long_whisper":    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Whisper%20of%20the%20Woods.mp3",

    # Фокус / медитативные — для focus
    "long_ambient1":   "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ambient%20Ambulance.mp3",
    "long_neural":     "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Neural%20Seq.mp3",
    "long_hypno":      "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hypnotic%20Puzzle.mp3",

    # Энергия / динамичные — для energy
    "long_groove":     "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Groove%20Grove.mp3",
    "long_impact":     "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Impact%20Moderato.mp3",
    "long_electro":    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Electrodoodle.mp3",
    "long_funky":      "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Funky%20Chunk.mp3",
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
    with urllib.request.urlopen(req, timeout=28) as resp:
        chunks = []
        while True:
            chunk = resp.read(65536)
            if not chunk:
                break
            chunks.append(chunk)
        data = b"".join(chunks)

    s3.put_object(Bucket="files", Key=key, Body=data, ContentType="audio/mpeg")
    cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "track": track_name, "url": cdn_url}),
    }
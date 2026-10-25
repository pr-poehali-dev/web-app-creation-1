import indicators

SCHEMA_FIELDS = {
    "sma_fast": (20, 5, 100, int),
    "sma_slow": (50, 20, 200, int),
    "rsi_period": (14, 5, 30, int),
    "rsi_long": (40, 20, 50, float),
    "rsi_short": (60, 50, 80, float),
    "atr_period": (14, 5, 30, int),
    "lookback": (20, 5, 60, int),
    "adx_period": (14, 7, 30, int),
    "adx_min": (20, 0, 50, float),
    "adx_max": (0, 0, 80, float),
    "short_adx": (25, 0, 60, float),
    "htf": (0, 0, 300, int),
    "ext_max": (0, 0, 10, float),
    "fresh": (0, 0, 200, int),
    "stop_atr": (2.0, 0.5, 6, float),
    "t1_atr": (1.5, 0.3, 6, float),
    "t2_atr": (3.0, 0.5, 12, float),
    "t1_frac": (0.5, 0, 1, float),
    "cooldown_hours": (6, 0, 48, int),
    "max_days": (7, 1, 30, int),
}

FLAGS = {"use_breakout": True, "use_pullback": True, "allow_short": True, "short_bounce": True, "trend_exit": True}

DEFAULTS = {k: v[0] for k, v in SCHEMA_FIELDS.items()}
DEFAULTS.update(FLAGS)
DEFAULTS["skip_hours"] = [12, 13, 14]

NEUTRAL = dict(DEFAULTS)
NEUTRAL.update({"adx_min": 0, "short_adx": 0, "skip_hours": [], "stop_atr": 1.5})

LEGACY = {"sm": "stop_atr", "t1m": "t1_atr", "t2m": "t2_atr"}


def sanitize(raw, base=None) -> dict:
    out = dict(base or DEFAULTS)
    raw = dict(raw or {})
    for old, new in LEGACY.items():
        if old in raw and new not in raw:
            raw[new] = raw[old]
    for k, (_, lo, hi, typ) in SCHEMA_FIELDS.items():
        if k in raw and raw[k] is not None and raw[k] != "":
            try:
                v = typ(float(raw[k]))
            except (TypeError, ValueError):
                continue
            out[k] = min(max(v, lo), hi)
    for k in FLAGS:
        if k in raw:
            out[k] = bool(raw[k])
    if raw.get("no_short"):
        out["allow_short"] = False
    if raw.get("no_short_bounce"):
        out["short_bounce"] = False
    if "skip_hours" in raw:
        hrs = raw["skip_hours"]
        if isinstance(hrs, str):
            hrs = [x for x in hrs.replace(";", ",").split(",") if x.strip()]
        try:
            out["skip_hours"] = sorted({int(h) for h in (hrs or []) if 0 <= int(h) <= 23})
        except (TypeError, ValueError):
            pass
    if out["sma_fast"] >= out["sma_slow"]:
        out["sma_fast"] = max(5, out["sma_slow"] // 2)
    return out


def merge_explicit(raw) -> dict:
    out = sanitize(raw, NEUTRAL)
    for k in ("mode", "range_adx", "range_src", "pb_src", "pb_short"):
        if raw and k in raw:
            out[k] = raw[k]
    return out


def min_bars(cfg) -> int:
    return max(cfg["sma_slow"], cfg["lookback"] + 1, cfg["rsi_period"] + 1, cfg["atr_period"] + 1, cfg["htf"]) + 5


def trend_exit(closes, direction, cfg) -> str:
    if not cfg.get("trend_exit", True):
        return ""
    f, s = cfg["sma_fast"], cfg["sma_slow"]
    if len(closes) < s:
        return ""
    fast = sum(closes[-f:]) / f
    slow = sum(closes[-s:]) / s
    last = closes[-1]
    if direction == "ЛОНГ" and fast < slow and last < slow:
        return "тренд развернулся"
    if direction == "ШОРТ" and fast > slow and last > slow:
        return "тренд развернулся"
    return ""


def analyze(candles: list, allow_short: bool, cfg: dict):
    closes = [c["close"] for c in candles]
    if len(closes) < min_bars(cfg):
        return None
    f, s = cfg["sma_fast"], cfg["sma_slow"]
    last = closes[-1]
    sma_f = sum(closes[-f:]) / f
    sma_s = sum(closes[-s:]) / s
    n = cfg["rsi_period"]
    gains = losses = 0.0
    for i in range(len(closes) - n, len(closes)):
        d = closes[i] - closes[i - 1]
        if d > 0:
            gains += d
        else:
            losses -= d
    rsi = 100.0 if losses == 0 else 100 - 100 / (1 + gains / losses)
    na = cfg["atr_period"]
    trs = []
    for i in range(len(candles) - na, len(candles)):
        c, pc = candles[i], candles[i - 1]["close"]
        trs.append(max(c["high"] - c["low"], abs(c["high"] - pc), abs(c["low"] - pc)))
    atr = sum(trs) / len(trs)
    prev = candles[-cfg["lookback"] - 1:-1]
    hh = max(c["high"] for c in prev)
    ll = min(c["low"] for c in prev)
    up = last > sma_s and sma_f > sma_s
    down = last < sma_s and sma_f < sma_s

    if cfg["skip_hours"]:
        try:
            if int(candles[-1]["begin"][11:13]) in cfg["skip_hours"]:
                return None
        except ValueError:
            pass
    ax = None
    if cfg["adx_min"] or cfg["short_adx"] or cfg["adx_max"]:
        ax = indicators.adx(candles[-(cfg["adx_period"] * 8 + 8):], cfg["adx_period"])
        if ax is None:
            return None
        if cfg["adx_min"] and ax[0] < cfg["adx_min"]:
            return None
        if cfg["adx_max"] and ax[0] > cfg["adx_max"]:
            return None
    if cfg["ext_max"] and atr and abs(last - sma_s) / atr > cfg["ext_max"]:
        return None
    if cfg["fresh"]:
        crossed = False
        for k in range(1, cfg["fresh"] + 1):
            seg = closes[:len(closes) - k + 1] if k > 1 else closes
            if len(seg) < s:
                break
            if (sum(seg[-f:]) / f > sum(seg[-s:]) / s) != (sma_f > sma_s):
                crossed = True
                break
        if not crossed:
            return None

    long_ok = True
    short_ok = down
    if cfg["htf"] and len(closes) >= cfg["htf"]:
        smah = sum(closes[-cfg["htf"]:]) / cfg["htf"]
        long_ok = last > smah
        short_ok = down and last < smah
    if cfg["short_adx"]:
        short_ok = short_ok and ax[0] >= cfg["short_adx"] and ax[2] > ax[1]
    allow = allow_short and cfg["allow_short"]

    def build(direction, why):
        k = 1 if direction == "ЛОНГ" else -1
        return (direction, last, last - k * cfg["stop_atr"] * atr, last + k * cfg["t1_atr"] * atr,
                last + k * cfg["t2_atr"] * atr, why, last, atr)

    nb = cfg["lookback"]
    if up and long_ok and cfg["use_breakout"] and last > hh:
        return build("ЛОНГ", f"Пробой максимума {nb} свечей {hh:.2f} в восходящем тренде (SMA{f}>SMA{s}), RSI {rsi:.0f}")
    if up and long_ok and cfg["use_pullback"] and rsi < cfg["rsi_long"]:
        return build("ЛОНГ", f"Откат в восходящем тренде, RSI {rsi:.0f}")
    if allow and short_ok and cfg["use_breakout"] and last < ll:
        return build("ШОРТ", f"Пробой минимума {nb} свечей {ll:.2f} в нисходящем тренде (SMA{f}<SMA{s}), RSI {rsi:.0f}")
    if allow and short_ok and cfg["use_pullback"] and cfg["short_bounce"] and rsi > cfg["rsi_short"]:
        return build("ШОРТ", f"Отскок в нисходящем тренде, RSI {rsi:.0f}")
    return None

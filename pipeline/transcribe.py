"""Расшифровка ролика в слова с таймкодами (faster-whisper, локально, CPU).

Использование:
    .venv/Scripts/python transcribe.py <video> <out.json> [--model small] [--lang ru]

Выход: {"duration": сек, "language": "ru", "words": [{"text", "start", "end", "prob"}]}
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

from faster_whisper import WhisperModel


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(out.stdout.strip())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--model", default="small")
    ap.add_argument("--lang", default="ru")
    args = ap.parse_args()

    duration = probe_duration(args.video)
    if duration > 61:
        sys.exit(f"Ролик {duration:.1f} с — больше 60 секунд, это вне скоупа.")

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        str(args.video),
        language=args.lang,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 300},
    )

    words = []
    for seg in segments:
        for w in seg.words or []:
            text = w.word.strip()
            if text:
                words.append({"text": text, "start": round(w.start, 3), "end": round(w.end, 3), "prob": round(w.probability, 3)})

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps({"duration": round(duration, 3), "language": info.language, "words": words}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    print(f"{len(words)} слов, {duration:.1f} с -> {args.out}")


if __name__ == "__main__":
    main()

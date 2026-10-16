# Конвейер автомонтажа (ручная проба)

Тот же путь, что будет в сервисе. Сейчас шаги запускаются руками, потом станут воркерами (media / ai / render).

```
ролик.mp4 ──► 1. Расшифровка ──► transcript.json ──► 2. Режиссёр (Claude) ──► props.json ──► 3. Рендер ──► out.mp4
              faster-whisper      слова + тайминги      план монтажа:           Remotion,
              (локально)                                пресеты + параметры     та же композиция,
                                                        + вырезы                что в Player редактора
```

1. **Расшифровка** — `transcribe.py`: слова с таймкодами начала/конца. В сервисе — media-воркер.
2. **Режиссёр** — Claude читает расшифровку и промпт пользователя и выдаёт JSON-таймлайн:
   - `cuts` — что вырезать (паузы, «эээ», дубли);
   - `words[].emphasis` — ключевые слова для акцента;
   - `blocks` — какие пресеты где стоят и с какими параметрами (`presetId` из библиотеки `prototype/src/presets`).
   Claude не рисует графику, он выбирает и настраивает готовые пресеты — поэтому дёшево и предсказуемо.
3. **Рендер** — `npx remotion render Short out.mp4 --props=props.json` в `prototype/`. Композиция `ShortComposition` одна для предпросмотра в браузере и для финального файла, поэтому «что видишь — то и получишь».

Правки в редакторе (чатом или руками) меняют только `props.json`; предпросмотр обновляется мгновенно, рендер запускается по кнопке «Экспорт».

## Запуск

```bash
# 1. расшифровка
pipeline/.venv/Scripts/python pipeline/transcribe.py input/clip.mp4 pipeline/jobs/clip/transcript.json

# 2. props.json пишет режиссёр (пока — Claude в этой сессии)

# 3. рендер (файл должен лежать в prototype/public/, путь в props — "/input/clip.mp4")
cd prototype && npx remotion render Short ../pipeline/jobs/clip/out.mp4 --props=../pipeline/jobs/clip/props.json
```

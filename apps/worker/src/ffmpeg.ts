import { spawn } from "node:child_process";

/*
 * ffmpeg/ffprobe из PATH (или FFMPEG_PATH / FFPROBE_PATH). В Docker-образе воркера ставится пакетом.
 * Форматы производных файлов совпадают с тем, что ждёт таймлайн редактора.
 */

const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe";

function run(bin: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const p = spawn(bin, args, { windowsHide: true });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${bin} ${code}: ${err.slice(-500)}`))));
  });
}

export const ffmpeg = (args: string[]) => run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args]);

export type Probe = { duration: number; width: number; height: number; hasAudio: boolean };

export async function probe(file: string): Promise<Probe> {
  const out = await run(FFPROBE, ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]);
  const data = JSON.parse(out) as {
    format: { duration?: string };
    streams: { codec_type: string; width?: number; height?: number; side_data_list?: { rotation?: number }[]; tags?: { rotate?: string } }[];
  };
  const video = data.streams.find((s) => s.codec_type === "video");
  if (!video?.width || !video.height) throw new Error("В файле нет видеодорожки");
  // Телефоны пишут вертикальное видео как горизонтальное + поворот в метаданных
  const rotation = Math.abs(Number(video.side_data_list?.find((d) => d.rotation != null)?.rotation ?? video.tags?.rotate ?? 0));
  const swap = rotation === 90 || rotation === 270;
  return {
    duration: Number(data.format.duration ?? 0),
    width: swap ? video.height : video.width,
    height: swap ? video.width : video.height,
    hasAudio: data.streams.some((s) => s.codec_type === "audio"),
  };
}

/** Кадр-обложка 360 px по ширине */
export const poster = (src: string, out: string, at: number) =>
  ffmpeg(["-ss", String(at), "-i", src, "-frames:v", "1", "-vf", "scale=360:-2", out]);

/** Беззвучное превью для карточки проекта: первые 6 с, 270 px */
export const preview = (src: string, out: string) =>
  ffmpeg(["-i", src, "-t", "6", "-an", "-vf", "scale=270:-2,fps=24", "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);

/** Лента кадров для таймлайна: 1 кадр/с, высота 120 px, в одну строку */
export const filmstrip = (src: string, out: string, duration: number) =>
  ffmpeg(["-i", src, "-vf", `fps=1,scale=-2:120,tile=${Math.max(1, Math.ceil(duration))}x1`, "-frames:v", "1", "-q:v", "4", out]);

/** Волна звука для таймлайна: 50 px на секунду, прозрачный фон, цвет как в прототипе */
export const waveform = (src: string, out: string, duration: number) =>
  ffmpeg(["-i", src, "-filter_complex", `aformat=channel_layouts=mono,showwavespic=s=${Math.max(50, Math.round(duration * 50))}x96:colors=#34d399`, "-frames:v", "1", out]);

/** Сжатая моно-дорожка для расшифровки (минута ≈ 350 КБ — далеко от лимита 25 МБ) */
export const speechAudio = (src: string, out: string) =>
  ffmpeg(["-i", src, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libmp3lame", "-b:a", "48k", out]);

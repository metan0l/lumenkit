import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { DemoBg } from "./types";

/*
 * Собственные демо-фоны для превью пресетов. Всё рисуется кодом и анимируется
 * покадрово — никаких чужих роликов. «Студия» — условный силуэт спикера,
 * чтобы субтитры и плашки читались в привычном контексте talking head.
 */
export function DemoBackground({ variant }: { variant: DemoBg }) {
  switch (variant) {
    case "studio":
      return <Studio />;
    case "dusk":
      return <Dusk />;
    case "city":
      return <City />;
    case "mint":
      return <Mint />;
    case "paper":
      return <Paper />;
    case "ember":
      return <Ember />;
  }
}

function Studio() {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const sway = Math.sin(frame / 22) * width * 0.006;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 20%, #3a3f4a 0%, #1b1d22 55%, #0d0e10 100%)" }}>
      {/* Контровой свет */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(50% 40% at 78% 30%, rgba(120,170,255,0.35), transparent 70%)",
          opacity: interpolate(Math.sin(frame / 30), [-1, 1], [0.7, 1]),
        }}
      />
      {/* Силуэт: голова и плечи */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          width: "78%",
          height: "58%",
          translate: `calc(-50% + ${sway}px) 0`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: "36%",
            aspectRatio: "0.82",
            translate: "-50% 0",
            borderRadius: "50% 50% 46% 46%",
            background: "linear-gradient(160deg, #5b6170 0%, #2a2d35 70%)",
            boxShadow: "inset -10px 0 30px rgba(140,180,255,0.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "58%",
            borderRadius: "48% 48% 0 0 / 60% 60% 0 0",
            background: "linear-gradient(170deg, #464b57 0%, #1f2128 80%)",
            boxShadow: "inset -14px 6px 40px rgba(140,180,255,0.25)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

function Dusk() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #2b1b5a 0%, #8a3b7a 45%, #ff8a4c 75%, #ffcf7a 100%)" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: `${interpolate(frame, [0, 300], [58, 52], { extrapolateRight: "clamp" })}%`,
          width: "46%",
          aspectRatio: "1",
          translate: "-50% 0",
          borderRadius: "50%",
          background: "radial-gradient(circle, #fff3c4 0%, #ffb35c 60%, rgba(255,140,60,0) 72%)",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "26%", background: "linear-gradient(180deg, #1c1430 0%, #0b0814 100%)" }} />
    </AbsoluteFill>
  );
}

function City() {
  const frame = useCurrentFrame();
  const dots = Array.from({ length: 14 }, (_, i) => i);
  const hues = ["#ffb347", "#ff6f91", "#7ad7ff", "#ffe066", "#b388ff"];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0a1024 0%, #141a33 60%, #1d1530 100%)" }}>
      {dots.map((i) => {
        const x = (i * 37) % 100;
        const y = ((i * 53) % 90) + 5;
        const drift = Math.sin((frame + i * 20) / 40) * 2;
        const size = 14 + ((i * 7) % 18);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x + drift}%`,
              top: `${y}%`,
              width: `${size}%`,
              aspectRatio: "1",
              borderRadius: "50%",
              background: hues[i % hues.length],
              opacity: 0.18 + ((i * 13) % 20) / 100,
              filter: "blur(6px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

function Mint() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #0f3d3a 0%, #1f7a62 50%, #9be7c4 100%)" }}>
      <div
        style={{
          position: "absolute",
          width: "90%",
          aspectRatio: "1",
          left: "-20%",
          top: `${interpolate(Math.sin(frame / 45), [-1, 1], [-10, 5])}%`,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(220,255,240,0.5), transparent 65%)",
        }}
      />
    </AbsoluteFill>
  );
}

function Paper() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#efe9df",
        backgroundImage: "linear-gradient(#e2dacd 1px, transparent 1px), linear-gradient(90deg, #e2dacd 1px, transparent 1px)",
        backgroundSize: "8% 4.5%",
      }}
    />
  );
}

function Ember() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(200deg, #1a0b0b 0%, #5a1414 50%, #e0452b 100%)" }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(70% 50% at 30% 80%, rgba(255,180,90,0.55), transparent 70%)",
          translate: `${Math.sin(frame / 35) * 3}% 0`,
        }}
      />
    </AbsoluteFill>
  );
}

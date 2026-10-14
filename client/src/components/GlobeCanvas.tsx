// Midnight Atlas reminder: this is a live cartographic instrument, not a bitmap globe.

import { useEffect, useRef } from "react";

type GlobeCanvasProps = {
  className?: string;
};

type Point = { lat: number; lon: number; label: string; tone: string };

const points: Point[] = [
  { lat: 38.72, lon: -9.14, label: "LIS", tone: "#E35B3F" },
  { lat: 35.67, lon: 139.65, label: "KYO", tone: "#D5B37A" },
  { lat: 55.68, lon: 12.57, label: "CPH", tone: "#A9B9AA" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function GlobeCanvas({ className = "" }: GlobeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let elapsed = 0;
    let last = performance.now();
    let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const drawLine = (from: Point, to: Point, radius: number, cx: number, cy: number, rotation: number, tilt: number) => {
      const project = (point: Point) => {
        const lat = (point.lat * Math.PI) / 180;
        const lon = (point.lon * Math.PI) / 180 + rotation;
        const x = Math.sin(lon) * Math.cos(lat);
        const z = Math.cos(lon) * Math.cos(lat);
        const y = Math.sin(lat);
        return {
          x: cx + x * radius,
          y: cy + (y * Math.cos(tilt) - z * Math.sin(tilt)) * radius,
          z: z * Math.cos(tilt) + y * Math.sin(tilt),
        };
      };
      const a = project(from);
      const b = project(to);
      const midX = (a.x + b.x) / 2;
      const midY = Math.min(a.y, b.y) - radius * 0.42;
      context.save();
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.quadraticCurveTo(midX, midY, b.x, b.y);
      context.strokeStyle = "rgba(227, 91, 63, .72)";
      context.lineWidth = 1.2;
      context.setLineDash([4, 7]);
      context.lineDashOffset = -elapsed * 0.022;
      context.stroke();
      context.restore();
    };

    const draw = (now: number) => {
      const delta = Math.min(now - last, 40);
      last = now;
      if (!reduced) elapsed += delta;
      context.clearRect(0, 0, width, height);

      const cx = width * 0.52 + pointer.current.x * 16;
      const cy = height * 0.48 + pointer.current.y * 9;
      const radius = Math.min(width, height) * 0.39;
      const rotation = reduced ? -0.72 : -0.72 + elapsed * 0.00007 + pointer.current.x * 0.11;
      const tilt = 0.18 + pointer.current.y * 0.08;

      const atmosphere = context.createRadialGradient(cx - radius * 0.26, cy - radius * 0.28, radius * 0.2, cx, cy, radius * 1.18);
      atmosphere.addColorStop(0, "rgba(114, 150, 154, .18)");
      atmosphere.addColorStop(0.62, "rgba(49, 80, 85, .08)");
      atmosphere.addColorStop(0.86, "rgba(227, 91, 63, .09)");
      atmosphere.addColorStop(1, "rgba(227, 91, 63, 0)");
      context.fillStyle = atmosphere;
      context.beginPath();
      context.arc(cx, cy, radius * 1.18, 0, Math.PI * 2);
      context.fill();

      const sphere = context.createRadialGradient(cx - radius * 0.36, cy - radius * 0.42, radius * 0.1, cx + radius * 0.12, cy + radius * 0.12, radius * 1.05);
      sphere.addColorStop(0, "#253e42");
      sphere.addColorStop(0.36, "#152b30");
      sphere.addColorStop(0.78, "#0b171b");
      sphere.addColorStop(1, "#050b0e");
      context.fillStyle = sphere;
      context.shadowBlur = 28;
      context.shadowColor = "rgba(88, 158, 157, .13)";
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;

      context.save();
      context.beginPath();
      context.arc(cx, cy, radius - 0.5, 0, Math.PI * 2);
      context.clip();

      for (let lat = -60; lat <= 60; lat += 20) {
        context.beginPath();
        let open = false;
        for (let lon = -180; lon <= 180; lon += 5) {
          const latitude = (lat * Math.PI) / 180;
          const longitude = (lon * Math.PI) / 180 + rotation;
          const x = Math.sin(longitude) * Math.cos(latitude);
          const z = Math.cos(longitude) * Math.cos(latitude);
          const y = Math.sin(latitude);
          if (z <= -0.03) {
            open = false;
            continue;
          }
          const px = cx + x * radius;
          const py = cy + (y * Math.cos(tilt) - z * Math.sin(tilt)) * radius;
          if (!open) {
            context.moveTo(px, py);
            open = true;
          } else context.lineTo(px, py);
        }
        context.strokeStyle = "rgba(154, 188, 180, .14)";
        context.lineWidth = 0.65;
        context.stroke();
      }

      for (let lon = -150; lon <= 150; lon += 30) {
        context.beginPath();
        let open = false;
        for (let lat = -90; lat <= 90; lat += 5) {
          const latitude = (lat * Math.PI) / 180;
          const longitude = (lon * Math.PI) / 180 + rotation;
          const x = Math.sin(longitude) * Math.cos(latitude);
          const z = Math.cos(longitude) * Math.cos(latitude);
          const y = Math.sin(latitude);
          if (z <= -0.03) {
            open = false;
            continue;
          }
          const px = cx + x * radius;
          const py = cy + (y * Math.cos(tilt) - z * Math.sin(tilt)) * radius;
          if (!open) {
            context.moveTo(px, py);
            open = true;
          } else context.lineTo(px, py);
        }
        context.strokeStyle = "rgba(154, 188, 180, .10)";
        context.lineWidth = 0.65;
        context.stroke();
      }

      drawLine(points[0], points[1], radius, cx, cy, rotation, tilt);
      drawLine(points[0], points[2], radius, cx, cy, rotation, tilt);
      drawLine(points[2], points[1], radius, cx, cy, rotation, tilt);

      const project = (point: Point) => {
        const lat = (point.lat * Math.PI) / 180;
        const lon = (point.lon * Math.PI) / 180 + rotation;
        const x = Math.sin(lon) * Math.cos(lat);
        const z = Math.cos(lon) * Math.cos(lat);
        const y = Math.sin(lat);
        return {
          x: cx + x * radius,
          y: cy + (y * Math.cos(tilt) - z * Math.sin(tilt)) * radius,
          z: z * Math.cos(tilt) + y * Math.sin(tilt),
        };
      };

      points.forEach((point) => {
        const projected = project(point);
        if (projected.z < -0.1) return;
        context.save();
        context.beginPath();
        context.arc(projected.x, projected.y, 10, 0, Math.PI * 2);
        context.fillStyle = `${point.tone}22`;
        context.fill();
        context.beginPath();
        context.arc(projected.x, projected.y, 3.2, 0, Math.PI * 2);
        context.fillStyle = point.tone;
        context.shadowBlur = 10;
        context.shadowColor = point.tone;
        context.fill();
        context.shadowBlur = 0;
        context.font = "600 9px Manrope, sans-serif";
        context.letterSpacing = "1px";
        context.fillStyle = "rgba(244, 238, 225, .78)";
        context.fillText(point.label, projected.x + 8, projected.y + 3);
        context.restore();
      });
      context.restore();

      for (let i = 0; i < 22; i += 1) {
        const theta = i * 2.399 + elapsed * 0.00006;
        const px = cx + Math.cos(theta) * (radius * (1.12 + (i % 4) * 0.04));
        const py = cy + Math.sin(theta * 1.7) * (radius * 0.77);
        context.fillStyle = i % 6 === 0 ? "rgba(227,91,63,.65)" : "rgba(221,220,197,.32)";
        context.fillRect(px, py, i % 6 === 0 ? 2 : 1, i % 6 === 0 ? 2 : 1);
      }

      frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
      pointer.current.y = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
    };
    const onPointerLeave = () => {
      pointer.current.x *= 0.75;
      pointer.current.y *= 0.75;
    };
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => { reduced = media.matches; };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    media.addEventListener?.("change", onMotionChange);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      media.removeEventListener?.("change", onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className={`h-full w-full ${className}`} aria-label="A rotating 3D globe showing TripMind routes" role="img" />;
}

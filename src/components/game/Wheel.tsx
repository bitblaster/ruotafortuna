/*
 * Copyright (C) 2026 Bitblaster
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import { getSegmentColor, getSegmentTextColor, getSegmentLabel, JOLLY_INDEX } from '@/lib/wheelConfig';
import { playSpinStartSound } from '@/lib/wheelSounds';
import { playSound, playSoundThrottled } from "@/lib/sounds.ts";

interface WheelProps {
  segments: (number | string)[];
  onResult: (value: number | string, index: number) => void;
  disabled: boolean;
  jollyClaimed: boolean;
  jollyUsed: boolean;
}

const SEGMENT_COUNT = 24;

const Wheel = ({ segments, onResult, disabled, jollyClaimed, jollyUsed }: WheelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastDragAngleRef = useRef(0);
  const lastDragTimeRef = useRef(0);
  const isSpinningRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const lastPinZoneRef = useRef(-1);
  const sizeRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const jollyRemovedRef = useRef(jollyUsed);
  const pointerDeflectionRef = useRef(0);
  const pointerAngVelRef = useRef(0);
  const lastCollidedPinRef = useRef(-1);

  function drawJesterHat(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    const s = size;
    // Brim
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.3, s * 0.7, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d4a017';
    ctx.fill();
    // Left tip
    ctx.beginPath();
    ctx.moveTo(x - s * 0.6, y + s * 0.2);
    ctx.quadraticCurveTo(x - s * 0.7, y - s * 0.6, x - s * 0.3, y - s * 0.15);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    // Right tip
    ctx.beginPath();
    ctx.moveTo(x + s * 0.6, y + s * 0.2);
    ctx.quadraticCurveTo(x + s * 0.7, y - s * 0.6, x + s * 0.3, y - s * 0.15);
    ctx.fillStyle = '#2980b9';
    ctx.fill();
    // Center tip
    ctx.beginPath();
    ctx.moveTo(x - s * 0.25, y + s * 0.1);
    ctx.quadraticCurveTo(x, y - s * 0.9, x + s * 0.25, y + s * 0.1);
    ctx.fillStyle = '#27ae60';
    ctx.fill();
    // Bells
    for (const bx of [x - s * 0.3, x, x + s * 0.3]) {
      ctx.beginPath();
      ctx.arc(bx, y - s * 0.55, s * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = '#f1c40f';
      ctx.fill();
    }
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = sizeRef.current;
    const center = size / 2;
    const radius = center - 16;
    const segAngle = (2 * Math.PI) / SEGMENT_COUNT;

    ctx.clearRect(0, 0, size, size);

    // Draw outer ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angleRef.current);

    // Draw segments
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const startA = i * segAngle;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      //ctx.lineTo(120,0);
      ctx.arc(0, 0, radius, startA - Math.PI / 2, startA - Math.PI / 2 + segAngle);
      ctx.closePath();
      ctx.fillStyle = getSegmentColor(segments[i], i);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';//'#0d0d0d';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      

      // Vertical text (letter by letter, outer to inner)
      ctx.save();
      ctx.rotate(startA + segAngle / 2);
      const label = getSegmentLabel(segments[i]);

      let fontSize = Math.max(32, size / 16);
      if(label.length > 5) {
        fontSize = fontSize/2;
        ctx.scale(2, 1.0);
      }
      
      //console.log(i, label, fontSize );
      ctx.fillStyle = getSegmentTextColor(segments[i]);
      ctx.font = `bold ${fontSize}px Oswald, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const chars = label.split('');
      const startR = radius * 0.96;
      const spacing = fontSize * 0.9;
      for (let ci = 0; ci < chars.length; ci++) {
        const r = startR - ci * spacing;
        if (r < radius * 0.18) break;
        ctx.fillText(chars[ci], 0, -r);
      }
      ctx.restore();

      // Jester hat on Jolly segment
      if (i === JOLLY_INDEX && !jollyRemovedRef.current) {
        ctx.save();
        ctx.rotate(startA + segAngle / 2);
        drawJesterHat(ctx, 0, -(radius * 0.55), fontSize * 0.5);
        ctx.restore();
      }
    }

    // Draw pins (white dots on border)
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
    const pinR = Math.max(2, Math.round(size * (isMobile ? 0.008 : 0.006))); // mobile leggermente più grande
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const pinA = i * segAngle - Math.PI / 2;
      const px = Math.cos(pinA) * radius;
      const py = Math.sin(pinA) * radius;
      ctx.beginPath();
      ctx.arc(px, py, pinR, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Center cap
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.12, 0, 2 * Math.PI);
    ctx.fillStyle = '#d4a017';
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }, [segments]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Imposta una misura iniziale immediata per evitare width=0
    const initialW = Math.round(el.getBoundingClientRect().width || el.parentElement?.getBoundingClientRect().width || window.innerWidth);
    if (initialW > 0) setContainerWidth(initialW);

    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // Imposta size in base alla larghezza del contenitore, senza limite
    const s = Math.max(0, Math.round(containerWidth));
    if (s <= 0) return;
    sizeRef.current = s;
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = s * dpr;
      canvas.height = s * dpr;
      canvas.style.width = s + 'px';
      canvas.style.height = s + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    }
    draw();
  }, [containerWidth, draw]);

  // Una volta che jollyClaimed diventa true almeno una volta, rimuovi permanentemente il jolly dalla ruota
  useEffect(() => {
    if (jollyClaimed && !jollyRemovedRef.current) {
      jollyRemovedRef.current = true;
      draw();
    }
  }, [jollyClaimed, draw]);

  const getAngleFromEvent = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return Math.atan2(clientY - cy, clientX - cx);
  }, []);

  const getSelectedIndex = useCallback(() => {
    const segAngle = (2 * Math.PI) / SEGMENT_COUNT;
    // Pointer is at top center (angle = -π/2 in canvas space)
    // The wheel is rotated by angleRef.current
    // The segment under the pointer: we need to find which segment index
    // is at the top. Segments are drawn starting at -π/2.
    // Effective pointer angle in wheel's local space = -angleRef.current
    // Offset by -π/2 since segments start there
    const pointerInWheel = (-angleRef.current) % (2 * Math.PI);
    const normalized = ((pointerInWheel % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const idx = Math.floor(normalized / segAngle);
    return ((idx % SEGMENT_COUNT) + SEGMENT_COUNT) % SEGMENT_COUNT;
  }, []);

  const handleResult = useCallback(() => {
    isSpinningRef.current = false;
    const idx = getSelectedIndex();
    onResult(segments[idx], idx);
  }, [onResult, segments, getSelectedIndex]);

  const animate = useCallback(() => {
    if (Math.abs(velocityRef.current) > 0.0008) {
      angleRef.current += velocityRef.current;
      if(Math.abs(velocityRef.current) > 0.005)
        velocityRef.current *= 0.994;
      else
        velocityRef.current *= 0.980;

      // --- Physics-based pin-pointer collision ---
      const segAngle = (2 * Math.PI) / SEGMENT_COUNT;

      // Find the pin closest to the pointer (top center, angle = 0 in normalized space)
      let closestDist = Infinity;
      let closestOffset = 0;
      let closestPin = -1;

      for (let i = 0; i < SEGMENT_COUNT; i++) {
        // Pin's angular offset from the pointer position (top)
        let offset = (i * segAngle + angleRef.current) % (2 * Math.PI);
        if (offset > Math.PI) offset -= 2 * Math.PI;
        if (offset < -Math.PI) offset += 2 * Math.PI;
        if (Math.abs(offset) < Math.abs(closestDist)) {
          closestDist = offset;
          closestOffset = offset;
          closestPin = i;
        }
      }

      // Collision zone — pointer tip covers a small angular range around the pin path
      const collisionThreshold = 0.13; // radians
      if (Math.abs(closestOffset) < collisionThreshold) {
        const overlap = collisionThreshold - Math.abs(closestOffset);
        const pushDirection = closestOffset > 0 ? -1 : 1;
        // Force proportional to overlap squared for more realistic feel
        const normalizedOverlap = overlap / collisionThreshold;
        const force = normalizedOverlap * normalizedOverlap * 18;
        pointerAngVelRef.current += pushDirection * force;

        // Sound & friction on new pin contact
        if (closestPin !== lastCollidedPinRef.current) {
          lastCollidedPinRef.current = closestPin;
          velocityRef.current *= 0.99;
          if (Math.abs(velocityRef.current) > 0.006)
            playSoundThrottled('tick', 80);
          else
            playSound('tick');
        }
      }

      // Spring-damper physics for pointer returning to rest
      const springK = 0.22;
      const damping = 0.80;
      pointerAngVelRef.current -= pointerDeflectionRef.current * springK;
      pointerAngVelRef.current *= damping;
      pointerDeflectionRef.current += pointerAngVelRef.current;
      pointerDeflectionRef.current = Math.max(-65, Math.min(65, pointerDeflectionRef.current));

      // Apply pointer transform directly (no CSS transition — physics drives it)
      if (pointerRef.current) {
        pointerRef.current.style.transition = 'none';
        pointerRef.current.style.transform = `translateX(-50%) rotate(${pointerDeflectionRef.current}deg)`;
      }

      draw();
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      velocityRef.current = 0;

      // Let pointer settle back to rest
      const settlePointer = () => {
        const springK = 0.22;
        const damping = 0.80;
        pointerAngVelRef.current -= pointerDeflectionRef.current * springK;
        pointerAngVelRef.current *= damping;
        pointerDeflectionRef.current += pointerAngVelRef.current;
        if (pointerRef.current) {
          pointerRef.current.style.transition = 'none';
          pointerRef.current.style.transform = `translateX(-50%) rotate(${pointerDeflectionRef.current}deg)`;
        }
        if (Math.abs(pointerDeflectionRef.current) > 0.3 || Math.abs(pointerAngVelRef.current) > 0.1) {
          requestAnimationFrame(settlePointer);
        } else {
          pointerDeflectionRef.current = 0;
          pointerAngVelRef.current = 0;
          if (pointerRef.current) {
            pointerRef.current.style.transform = 'translateX(-50%) rotate(0deg)';
          }
          handleResult();
        }
      };

      draw();
      settlePointer();
    }
  }, [draw, handleResult, getSelectedIndex]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || isSpinningRef.current) return;
    e.preventDefault();
    isDraggingRef.current = true;
    lastDragAngleRef.current = getAngleFromEvent(e.nativeEvent as MouseEvent | TouchEvent);
    lastDragTimeRef.current = performance.now();
    velocityRef.current = 0;
  }, [disabled, getAngleFromEvent]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const angle = getAngleFromEvent(e.nativeEvent as MouseEvent | TouchEvent);
    let delta = angle - lastDragAngleRef.current;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    angleRef.current += delta;
    const now = performance.now();
    const dt = now - lastDragTimeRef.current;
    if (dt > 0) velocityRef.current = delta / Math.max(dt / 16, 1);

    lastDragAngleRef.current = angle;
    lastDragTimeRef.current = now;
    draw();
  }, [draw, getAngleFromEvent]);

  const handleEnd = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Debug mode: CTRL+ALT+SHIFT → stop immediately at current position
    const isDebug = 'ctrlKey' in e && e.ctrlKey && e.altKey && e.shiftKey;

    if (isDebug) {
      velocityRef.current = 0;
      isSpinningRef.current = true;
      lastPinZoneRef.current = -1;
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    if (Math.abs(velocityRef.current) < 0.01) {
      velocityRef.current = 0;
      return;
    }

    velocityRef.current *= 2.5;
    velocityRef.current = Math.sign(velocityRef.current) * Math.min(Math.abs(velocityRef.current), 0.5);

    isSpinningRef.current = true;
    lastPinZoneRef.current = -1;
    playSpinStartSound();
    animFrameRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const size = Math.max(0, Math.round(containerWidth));
  const pointerW = Math.round(size * 0.057);
  const pointerH = Math.round(size * 0.074);
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
  const pinR = Math.max(2, Math.round(size * (isMobile ? 0.008 : 0.006))); // mobile leggermente più grande
  const pointerTop = 16 - pinR - pointerH + (pinR * 2); // bordo inferiore puntatore allineato alla sommità del pin superiore

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto select-none" style={{ width: '100%' }}>
      {/* Pointer assoluto rispetto al contenitore esterno (non clippato) */}
      <div
        ref={pointerRef}
        className="absolute z-10"
        style={{
          top: pointerTop,
          left: '50%',
          transform: 'translateX(-50%)',
          transformOrigin: 'top center',
        }}
      >
        <svg width={pointerW} height={pointerH} viewBox="0 0 40 52" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
          <path
            d="M 20,52 C 17.622014,52 4,30 4,18 4,9.163438 11.163444,2.0000069 20,2.0000069 28.836556,2.0000069 36,9.163438 36,18 36,30 22.266839,52 20,52 Z"
            fill="#d4a017"
            stroke="#b8860b"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Inner wrapper: dimensione esatta della ruota, clippata a metà superiore */}
      <div
        className="relative mx-auto flex items-start justify-center md:mt-6"
        style={{
          width: size,
          height: Math.max(0, Math.floor(size / 2)),
          boxSizing: 'content-box',
          overflow: 'hidden',
          //transform: isMobile ? 'translateX(-8px)' : undefined,
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className={`block rounded-full ${disabled || isSpinningRef.current ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
          style={{ width: size, height: size, touchAction: 'none', margin: '0 auto' }}
        />
      </div>
    </div>
  );
};

export default Wheel;

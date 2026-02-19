import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  HurufServerEvent,
  HurufSessionState,
  Team,
} from '../../../../shared/huruf/types';
import { connectHurufSocket, createHurufSession } from '../../lib/huruf';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const TIMER_DURATION = 10; // seconds

/* ─────────────────────────────────────────
   CSS
───────────────────────────────────────── */
const HURUF_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Lalezar&display=swap');

  :root {
    --green:       #6A8D56;
    --green-dark:  #4a6b38;
    --green-glow:  rgba(106,141,86,0.35);
    --orange:      #E08C36;
    --orange-dark: #b86e20;
    --dark:        #2D3436;
    --cream:       #FDF8E8;
    --tan:         #F3EAD3;
    --tan2:        #e8dfc4;
    --red:         #E67E22;
    --red-dark:    #B85C0A;
    --red-glow:    rgba(230,126,34,0.35);
  }

  .huruf-root * { box-sizing: border-box; }
  .huruf-root { direction: rtl; font-family: 'Cairo', sans-serif; }

  /* ══════ HONEYCOMB (SVG, pixel-perfect) ══════ */
  .hc-svg-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px 0;
    user-select: none;
  }

  .hc-svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .hc-svg text { pointer-events: none; }

  .hc-cell { cursor: pointer; }
  .hc-cell.locked { cursor: default; }
  .hc-cell.disabled { cursor: default; }

  @keyframes activeGlow {
    from { opacity: 0.4; }
    to   { opacity: 1; }
  }

  .hc-active-glow {
    animation: activeGlow 1.2s ease infinite alternate;
  }

  /* ══════ DIRECTION STRIPS ══════ */
  .dir-strip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    font-family: 'Lalezar', serif;
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;
  }
  .dir-strip.green { background: var(--green); }
  .dir-strip.red   { background: var(--red); }

  /* ══════ QUESTION OVERLAY ══════ */
  .question-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: overlayIn 0.3s ease;
  }

  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .question-overlay-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(20,24,20,0.75);
    backdrop-filter: blur(6px);
  }

  .question-card {
    position: relative;
    z-index: 2;
    background: #FDF8E8;
    border-radius: 24px;
    border: 4px solid var(--dark);
    box-shadow: 12px 12px 0 var(--dark);
    padding: 32px 36px;
    max-width: 560px;
    width: 100%;
    animation: cardPop 0.35s cubic-bezier(0.22,1,0.36,1);
  }

  @keyframes cardPop {
    from { transform: scale(0.85) translateY(20px); opacity: 0; }
    to   { transform: scale(1) translateY(0); opacity: 1; }
  }

  .q-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .q-stage-badge {
    font-family: 'Lalezar', serif;
    font-size: 15px;
    padding: 5px 16px;
    border-radius: 30px;
    color: #fff;
  }

  .q-letter-badge {
    font-family: 'Lalezar', serif;
    font-size: 15px;
    padding: 5px 16px;
    border-radius: 30px;
    background: var(--dark);
    color: #fff;
  }

  .q-prompt {
    font-family: 'Lalezar', serif;
    font-size: 28px;
    color: var(--dark);
    text-align: center;
    line-height: 1.5;
    margin: 20px 0;
  }

  /* ══════ BUZZER PANEL ══════ */
  .buzzer-panel {
    background: #fff;
    border-radius: 16px;
    border: 3px solid var(--tan2);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .buzzer-icon {
    font-size: 32px;
    transition: transform 0.2s;
  }
  .buzzer-locked .buzzer-icon { transform: scale(1.2); }

  .buzzer-timer-bar {
    flex: 1;
    height: 8px;
    background: #f0ebe0;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 6px;
  }

  .buzzer-timer-fill {
    height: 100%;
    border-radius: 8px;
    transition: width 0.1s linear, background 0.3s;
  }

  /* ══════ CONTROL BTNS ══════ */
  .ctrl-btn {
    flex: 1;
    padding: 12px 8px;
    border-radius: 12px;
    border: 2px solid;
    cursor: pointer;
    font-family: 'Lalezar', serif;
    font-size: 16px;
    transition: filter 0.15s, transform 0.1s;
  }
  .ctrl-btn:hover:not(:disabled) { filter: brightness(1.08); }
  .ctrl-btn:active:not(:disabled) { transform: scale(0.96); }
  .ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ══════ SPINNER ══════ */
  @keyframes spin { to { transform: rotate(360deg); } }
  .huruf-spinner {
    width: 52px; height: 52px;
    border-radius: 50%;
    border: 4px solid var(--tan2);
    border-top-color: var(--green);
    animation: spin 0.9s linear infinite;
  }

  /* ══════ WINNER BANNER ══════ */
  @keyframes winPop {
    from { transform: scale(0.6); opacity: 0; }
    60%  { transform: scale(1.08); }
    to   { transform: scale(1); opacity: 1; }
  }
  .winner-banner { animation: winPop 0.65s cubic-bezier(.22,1,.36,1); }

  /* ══════ TOAST ══════ */
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .toast { animation: toastIn 0.2s ease; }

  /* ══════ QR LOBBY ══════ */
  @keyframes lobbyFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lobby-card { animation: lobbyFadeUp 0.45s cubic-bezier(.22,1,.36,1); }

  /* ══════ STAGE COLOR ══════ */
  .stage-first  { background: var(--green); }
  .stage-other  { background: var(--orange); }
`;

function injectCSS(id: string, css: string) {
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   HONEYCOMB BOARD (SVG, pixel-perfect)
───────────────────────────────────────── */
interface HexBoardProps {
  board: HurufSessionState['board'];
  activeCellId: string | null;
  isPlaying: boolean;
  onSelect: (id: string) => void;
}

const COLS = 6;
const ROWS = 6;

function HexBoard({ board, activeCellId, isPlaying, onSelect }: HexBoardProps) {
  // Geometry (pointy-top, row-stagger) — matches your “Perfect” reference math style.
  const R = 50; // circumradius
  const W = R * Math.sqrt(3);
  const H = 2 * R;
  const stepX = W;
  const stepY = H * 0.75;
  const oddShift = W / 2;
  const PAD = 40;

  const strokeOuter = 7;
  const innerInset = 3.5;

  const rows: typeof board[] = [];
  for (let r = 0; r < ROWS; r++) rows.push(board.slice(r * COLS, r * COLS + COLS));

  const svgW = PAD * 2 + (COLS - 1) * stepX + W + oddShift;
  const svgH = PAD * 2 + (ROWS - 1) * stepY + H;

  const cx0 = svgW / 2;
  const cy0 = svgH / 2;

  const hexPoints = (cx: number, cy: number, rad: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`);
    }
    return pts.join(' ');
  };

  const getCellStyle = (cell: HurufSessionState['board'][number], isActive: boolean) => {
    if (isActive) {
      return {
        fill: '#fff3cc',
        innerFill: '#ffffff',
        stroke: '#111',
        text: '#00008B',
        ring: true,
      };
    }
    if (cell.closed && cell.owner === 'green') {
      return { fill: '#6A8D56', innerFill: '#6A8D56', stroke: '#111', text: '#ffffff', ring: false };
    }
    if (cell.closed && cell.owner === 'red') {
      return { fill: '#E67E22', innerFill: '#E67E22', stroke: '#111', text: '#ffffff', ring: false };
    }
    if (cell.closed) {
      return { fill: '#e0ddd4', innerFill: '#e0ddd4', stroke: '#111', text: '#777777', ring: false };
    }
    return { fill: '#FDF8E8', innerFill: '#ffffff', stroke: '#111', text: '#00008B', ring: false };
  };

  return (
    <div className="hc-svg-wrap">
      <svg
        className="hc-svg"
        xmlns="http://www.w3.org/2000/svg"
        width={Math.ceil(svgW)}
        height={Math.ceil(svgH)}
        viewBox={`0 0 ${Math.ceil(svgW)} ${Math.ceil(svgH)}`}
      >
        <defs>
          <style>
            {`@import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@700&display=swap');`}
          </style>

          <filter id="activeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 0.6 0 0 0
                0 0 0 0 0
                0 0 0 0.55 0"
              result="colored"
            />
            <feMerge>
              <feMergeNode in="colored" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background like your HTML demo */}
        <rect width={svgW} height={svgH} fill="#2e7d32" />
        <polygon points={`0,0 ${svgW},0 ${cx0},${cy0}`} fill="#e65100" />
        <polygon points={`0,${svgH} ${svgW},${svgH} ${cx0},${cy0}`} fill="#e65100" />

        {rows.map((row, r) => {
          const shift = r % 2 === 1 ? oddShift : 0;
          return row.map((cell, c) => {
            const cx = PAD + W / 2 + c * stepX + shift;
            const cy = PAD + H / 2 + r * stepY;

            const isActive = cell.id === activeCellId;
            const st = getCellStyle(cell, isActive);
            const isDisabled = cell.closed || !isPlaying || (!!activeCellId && !isActive);
            const isDimmed = !cell.closed && isDisabled;

            return (
              <g
                key={cell.id}
                className={`hc-cell${cell.closed ? ' locked' : ''}${isDisabled ? ' disabled' : ''}`}
                onClick={() => {
                  if (!isDisabled) onSelect(cell.id);
                }}
                style={{ pointerEvents: isDisabled ? 'none' : 'auto' }}
              >
                {/* Outer */}
                <polygon
                  points={hexPoints(cx, cy, R)}
                  fill={st.fill}
                  stroke={st.stroke}
                  strokeWidth={strokeOuter}
                  strokeLinejoin="round"
                  filter={isActive ? 'url(#activeGlow)' : 'none'}
                  className={isActive ? 'hc-active-glow' : undefined}
                />

                {/* Inner (double-border effect) */}
                <polygon
                  points={hexPoints(cx, cy, R - innerInset)}
                  fill={st.innerFill}
                  stroke="none"
                />

                {/* Active ring */}
                {st.ring && (
                  <polygon
                    points={hexPoints(cx, cy, R - 2)}
                    fill="none"
                    stroke="#E08C36"
                    strokeWidth={4}
                    strokeLinejoin="round"
                  />
                )}

                {/* Letter */}
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="Noto Naskh Arabic, Arial, sans-serif"
                  fontSize={28}
                  fontWeight={700}
                  fill={st.text}
                >
                  {cell.letter}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCORE PANEL
───────────────────────────────────────── */
function ScorePanel({ greenWins, redWins }: { greenWins: number; redWins: number }) {
  const total = Math.max(1, greenWins + redWins);
  const greenWidth = (greenWins / total) * 100;
  const redWidth = (redWins / total) * 100;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: '#fff', border: '2px solid #e8dfc4',
      borderRadius: 14, padding: '12px 20px',
    }}>
      <div style={{ textAlign: 'center', minWidth: 64 }}>
        <div style={{ fontFamily: 'Lalezar, serif', fontSize: 32, color: '#6A8D56', lineHeight: 1 }}>
          {greenWins}
        </div>
        <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: 11, color: '#999' }}>فوز أخضر</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 6, fontFamily: 'Lalezar, serif', fontSize: 16, color: '#2D3436' }}>
          النتيجة الإجمالية
        </div>
        <div style={{
          position: 'relative',
          background: '#f0ebe0',
          borderRadius: 10,
          height: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            insetInlineStart: 0,
            top: 0,
            bottom: 0,
            width: `${greenWidth}%`,
            background: 'linear-gradient(90deg,#6A8D56,#4a6b38)',
            transition: 'width .5s ease',
          }} />
          <div style={{
            position: 'absolute',
            insetInlineEnd: 0,
            top: 0,
            bottom: 0,
            width: `${redWidth}%`,
            background: 'linear-gradient(90deg,#B85C0A,#E67E22)',
            transition: 'width .5s ease',
          }} />
          <div style={{
            position: 'absolute',
            left: '50%',
            top: -3,
            bottom: -3,
            width: 2,
            transform: 'translateX(-50%)',
            background: 'rgba(45,52,54,.35)',
          }} />
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'Lalezar, serif',
            fontSize: 12,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,.35)',
            letterSpacing: '.3px',
          }}>
            VS
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', minWidth: 64 }}>
        <div style={{ fontFamily: 'Lalezar, serif', fontSize: 32, color: '#E67E22', lineHeight: 1 }}>
          {redWins}
        </div>
        <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: 11, color: '#999' }}>فوز برتقالي</div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────
   QUESTION OVERLAY (shown when cell active)
───────────────────────────────────────── */
function QuestionOverlay({
  state,
  timer,
  timerActive,
  onCorrect,
  onWrong,
  onNewQuestion,
  onResetBuzzer,
}: {
  state: HurufSessionState;
  timer: number;
  timerActive: boolean;
  onCorrect: () => void;
  onWrong: () => void;
  onNewQuestion: () => void;
  onResetBuzzer: () => void;
}) {
  if (!state.activeCellId) return null;

  const question = state.activeQuestion;
  const { lockedBy, locked } = state.buzzer;
  const stage = state.stage;
  const stageBg = stage === 'first' ? '#6A8D56' : '#E08C36';
  const stageLabel = stage === 'first' ? 'الفرصة الأولى' : 'فرصة الفريق الآخر';
  const lockedByLabel = lockedBy === 'green' ? 'الفريق الأخضر' : lockedBy === 'red' ? 'الفريق البرتقالي' : null;
  const lockedColor = lockedBy === 'green' ? '#6A8D56' : '#E67E22';
  const timerPercent = timer / TIMER_DURATION;
  const timerColor =
    timerPercent > 0.5 ? '#6A8D56' :
    timerPercent > 0.25 ? '#E08C36' : '#E67E22';

  return (
    <div className="question-overlay">
      <div className="question-overlay-backdrop" />
      <div className="question-card">
        {/* Header */}
        <div className="q-header">
          <span className="q-stage-badge" style={{ background: stageBg }}>
            {stageLabel}
          </span>
          <span className="q-letter-badge">
            حرف {state.board.find(c => c.id === state.activeCellId)?.letter}
          </span>
        </div>

        {/* Question */}
        {question ? (
          <p className="q-prompt">{question.prompt}</p>
        ) : (
          <p className="q-prompt" style={{ color: '#aaa', fontSize: 20 }}>
            في انتظار السؤال...
          </p>
        )}

        {/* Timer bar */}
        {timerActive && (
          <div style={{ margin: '16px 0 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'Lalezar, serif', fontSize: 14, color: lockedColor }}>
                {lockedByLabel ? `${lockedByLabel} يجاوب` : 'في انتظار الجرس'}
              </span>
              <span style={{
                fontFamily: 'Lalezar, serif', fontSize: 22,
                color: timerColor,
                fontWeight: 900,
              }}>
                {timer}s
              </span>
            </div>
            <div style={{
              height: 10, background: '#f0ebe0', borderRadius: 8, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${timerPercent * 100}%`,
                background: timerColor,
                borderRadius: 8,
                transition: 'width 0.1s linear, background 0.3s',
              }} />
            </div>
          </div>
        )}

        {/* Buzzer status */}
        {locked && lockedBy && !timerActive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: `${lockedColor}18`,
            border: `2px solid ${lockedColor}`,
            borderRadius: 12, padding: '10px 16px', margin: '12px 0',
          }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <span style={{ fontFamily: 'Lalezar, serif', fontSize: 18, color: lockedColor }}>
              {lockedByLabel} ضغط الجرس!
            </span>
          </div>
        )}

        {!locked && !timerActive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#f3ead3', border: '2px dashed #d6c9a8',
            borderRadius: 12, padding: '10px 16px', margin: '12px 0',
          }}>
            <span style={{ fontSize: 22 }}>⏳</span>
            <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: 15, color: '#aaa', fontWeight: 700 }}>
              في انتظار الجرس...
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            className="ctrl-btn"
            disabled={!locked}
            onClick={onCorrect}
            style={{
              background: locked ? 'linear-gradient(135deg,#6A8D56,#4a6b38)' : '#ececec',
              borderColor: locked ? '#6A8D56' : '#ddd',
              color: locked ? '#fff' : '#bbb',
            }}
          >
            ✓ صحيح
          </button>
          <button
            className="ctrl-btn"
            disabled={!locked}
            onClick={onWrong}
            style={{
              background: locked ? 'linear-gradient(135deg,#E67E22,#B85C0A)' : '#ececec',
              borderColor: locked ? '#E67E22' : '#ddd',
              color: locked ? '#fff' : '#bbb',
            }}
          >
            ✗ خطأ
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            className="ctrl-btn"
            onClick={onNewQuestion}
            style={{
              background: '#fff', borderColor: '#2D3436', color: '#2D3436',
            }}
          >
            ↻ سؤال جديد
          </button>
          <button
            className="ctrl-btn"
            onClick={onResetBuzzer}
            style={{
              background: '#f3ead3', borderColor: '#d6c9a8', color: '#5F6A56',
            }}
          >
            ⊘ إعادة الجرس
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   QR LOBBY
───────────────────────────────────────── */
function QrCard({ accent, label, link }: { accent: string; label: string; link: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: `3px solid ${accent}`, boxShadow: `4px 4px 0 ${accent}`,
      overflow: 'hidden',
    }}>
      <div style={{ background: accent, padding: '8px 14px' }}>
        <span style={{ fontFamily: 'Lalezar, serif', fontSize: 17, color: '#fff' }}>{label}</span>
      </div>
      <div style={{ padding: '14px 14px 4px', display: 'flex', justifyContent: 'center' }}>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(link)}&color=2D3436&bgcolor=FFFDF5`}
          alt={`QR ${label}`}
          style={{ width: 140, height: 140, borderRadius: 8, display: 'block' }}
        />
      </div>
      <p style={{
        fontFamily: 'monospace', fontSize: 8, color: '#bbb',
        padding: '4px 10px 10px', wordBreak: 'break-all', textAlign: 'center',
        direction: 'ltr',
      }}>
        {link}
      </p>
    </div>
  );
}

function QrLobby({
  greenLink, redLink, onSkip, onStart,
}: {
  greenLink: string; redLink: string;
  onSkip: () => void; onStart: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(45,52,54,.88)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, direction: 'rtl',
    }}>
      <div className="lobby-card" style={{
        background: '#FDF8E8', borderRadius: 26,
        border: '4px solid #2D3436', boxShadow: '14px 14px 0 #2D3436',
        padding: '36px 42px', maxWidth: 560, width: '92vw',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 36 }}>⬡</span>
        <h2 style={{ fontFamily: 'Lalezar, serif', fontSize: 32, color: '#2D3436', margin: '10px 0 6px' }}>
          خلية الحروف
        </h2>
        <p style={{ fontFamily: 'Cairo, sans-serif', fontSize: 14, color: '#999', marginBottom: 28 }}>
          امسح رمز QR لكل فريق لربط جرس الهاتف
        </p>

        {/* Win direction hints */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div style={{
            flex: 1, background: '#6A8D5618', border: '2px solid #6A8D56',
            borderRadius: 12, padding: '10px 14px', textAlign: 'center',
          }}>
            
          </div>
          <div style={{
            flex: 1, background: '#E67E2218', border: '2px solid #E67E22',
            borderRadius: 12, padding: '10px 14px', textAlign: 'center',
          }}>
            
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <QrCard accent="#6A8D56" label="الفريق الأخضر" link={greenLink} />
          <QrCard accent="#E67E22" label="الفريق البرتقالي"  link={redLink}   />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onStart}
            style={{
              flex: 1, padding: '13px 0',
              background: 'linear-gradient(135deg,#6A8D56,#4a6b38)',
              border: '2px solid #6A8D56', borderRadius: 14, cursor: 'pointer',
              fontFamily: 'Lalezar, serif', fontSize: 20, color: '#fff',
              boxShadow: '0 5px 16px rgba(106,141,86,.4)',
            }}
          >
            ابدأ اللعبة ▶
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────── */
export const HurufMain: React.FC = () => {
  injectCSS('huruf-main-css', HURUF_CSS);

  const [sessionId, setSessionId]   = useState('');
  const [state, setState]           = useState<HurufSessionState | null>(null);
  const [send, setSend]             = useState<((e: any) => void) | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLobby, setShowLobby]   = useState(true);
  const [timer, setTimer]           = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerTeam, setTimerTeam]   = useState<Team | null>(null);

  const toastRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartRef = useRef<number>(0);

  const startTimer = (team: Team) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerStartRef.current = Date.now();
    setTimer(TIMER_DURATION);
    setTimerActive(true);
    setTimerTeam(team);

    timerIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - timerStartRef.current) / 1000;
      const remaining = Math.max(0, TIMER_DURATION - elapsed);
      setTimer(Math.ceil(remaining));
      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current!);
        setTimerActive(false);
      }
    }, 100);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerActive(false);
    setTimerTeam(null);
    setTimer(0);
  };

  /* ── Session init ── */
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setSessionInUrl = (id: string) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      url.searchParams.set('sessionId', id);
      window.history.replaceState({}, '', url.toString());
    };

    const connectToSession = (id: string) => {
      setSessionId(id);
      setSessionInUrl(id);

      const socket = connectHurufSocket(id, (event: HurufServerEvent) => {
        if (event.type === 'SESSION_STATE') {
          setState(event.state);
          if (!event.state.buzzer.locked) stopTimer();
        }
        if (event.type === 'TIMER_START') {
          startTimer(event.team);
        }
        if (event.type === 'BUZZ_RESET' || event.type === 'TIMER_EXPIRED_SERVER') {
          stopTimer();
        }
      });

      setSend(() => socket.send);
      socket.ws.onopen = () => {
        socket.send({ type: 'JOIN', role: 'main' });
        setLoading(false);
      };
      socket.ws.onerror = async () => {
        try {
          const { sessionId: newId } = await createHurufSession();
          connectToSession(newId);
        } catch {
          setError('فشل في إنشاء جلسة اللعبة. يرجى المحاولة لاحقاً.');
          setLoading(false);
        }
      };

      cleanup = () => socket.ws.close();
    };

    if (typeof window !== 'undefined') {
      const existingSessionId = new URL(window.location.href).searchParams.get('sessionId');
      if (existingSessionId) {
        connectToSession(existingSessionId);
      } else {
        createHurufSession()
          .then(({ sessionId: id }) => connectToSession(id))
          .catch(() => {
            setError('فشل في إنشاء جلسة اللعبة. يرجى المحاولة لاحقاً.');
            setLoading(false);
          });
      }
    } else {
      createHurufSession()
        .then(({ sessionId: id }) => connectToSession(id))
        .catch(() => {
          setError('فشل في إنشاء جلسة اللعبة. يرجى المحاولة لاحقاً.');
          setLoading(false);
        });
    }

    return () => {
      cleanup?.();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const joinLinks = useMemo(() => {
    if (!sessionId) return null;
    const base = `${window.location.origin}/games/huruf/join?sessionId=${sessionId}`;
    return {
      green: `${base}&team=green`,
      red: `${base}&team=red`,
    };
  }, [sessionId]);

  const showToast = (label: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(label);
    toastRef.current = setTimeout(() => setToast(null), 1800);
  };

  const onControl = (type: string, label: string) => {
    send?.({ type });
    showToast(label);
  };

  const selectCell = (cellId: string) => send?.({ type: 'MAIN_SELECT_CELL', cellId });

  const handleLobbyStart = () => {
    setShowLobby(false);
    send?.({ type: 'MAIN_START_GAME' });
    showToast('▶ بدأت اللعبة!');
  };
  const handleLobbySkip = () => setShowLobby(false);

  const handlePlayAgain = () => {
    stopTimer();
    send?.({ type: 'MAIN_START_GAME' });
    showToast('↺ لعبة جديدة!');
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="huruf-root" style={{
        minHeight: '80vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18,
        background: 'linear-gradient(160deg,#fdf8ee,#f3ead3)',
      }}>
        <div className="huruf-spinner" />
        <p style={{ fontFamily: 'Cairo, sans-serif', fontSize: 18, color: '#6A8D56', fontWeight: 700 }}>
          جاري تحميل اللعبة...
        </p>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="huruf-root" style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg,#fdf8ee,#f3ead3)',
      }}>
        <div style={{
          maxWidth: 420, background: '#fff', borderRadius: 22,
          border: '3px solid #E67E22', boxShadow: '8px 8px 0 #E67E22',
          padding: 44, textAlign: 'center',
        }}>
          <span style={{ fontSize: 54 }}>⚠️</span>
          <h2 style={{ fontFamily: 'Lalezar, serif', fontSize: 28, color: '#E67E22', margin: '14px 0 10px' }}>
            عذراً!
          </h2>
          <p style={{ fontFamily: 'Cairo, sans-serif', color: '#666', marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#6A8D56', color: '#fff', border: 'none',
              borderRadius: 12, padding: '11px 28px',
              fontFamily: 'Lalezar, serif', fontSize: 18, cursor: 'pointer',
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const isPlaying = state?.status === 'playing';
  const isEnded   = state?.status === 'ended';
  const hasActive = !!state?.activeCellId;

  return (
    <div
      className="huruf-root"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg,#fdf8ee 0%,#f3ead3 60%,#e8dfc4 100%)',
        paddingBottom: 56,
      }}
    >

      {/* ═══ STICKY HEADER ═══ */}
      <header style={{
        background: 'linear-gradient(90deg,#2D3436,#3d4649)',
        borderBottom: '4px solid #6A8D56',
        position: 'sticky', top: 0, zIndex: 80,
        boxShadow: '0 4px 20px rgba(0,0,0,.25)',
      }}>
        <div style={{
          maxWidth: 1380, margin: '0 auto', padding: '0 28px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24, color: '#E08C36' }}>⬡</span>
            <span style={{ fontFamily: 'Lalezar, serif', fontSize: 26, color: '#FDF8E8' }}>
              خلية الحروف
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {joinLinks && !showLobby && (
              <button
                onClick={() => setShowLobby(true)}
                style={{
                  background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)',
                  borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
                  fontFamily: 'Cairo, sans-serif', fontSize: 13, color: '#ddd',
                }}
              >
                📱 رموز QR
              </button>
            )}
            <button
              onClick={() => setShowHowToPlay(true)}
              style={{
                background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)',
                borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif', fontSize: 13, color: '#ddd',
              }}
            >
              📘 كيفية اللعب
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: isPlaying ? '#6A8D56' : isEnded ? '#E67E22' : '#555',
              padding: '5px 16px', borderRadius: 30,
              fontFamily: 'Lalezar, serif', fontSize: 14, color: '#fff',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'rgba(255,255,255,.85)',
                display: 'inline-block',
              }} />
              {isPlaying ? 'جارية' : isEnded ? 'انتهت' : 'انتظار'}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ QR LOBBY ═══ */}
      {showLobby && joinLinks && (
        <QrLobby
          greenLink={joinLinks.green}
          redLink={joinLinks.red}
          onSkip={handleLobbySkip}
          onStart={handleLobbyStart}
        />
      )}

      {/* ═══ QUESTION OVERLAY ═══ */}
      {isPlaying && hasActive && state && (
        <QuestionOverlay
          state={state}
          timer={timer}
          timerActive={timerActive}
          onCorrect={() => onControl('MAIN_MARK_CORRECT', '✓ إجابة صحيحة!')}
          onWrong={() => onControl('MAIN_MARK_WRONG', '✗ إجابة خاطئة')}
          onNewQuestion={() => onControl('MAIN_NEW_QUESTION', '↻ سؤال جديد')}
          onResetBuzzer={() => { stopTimer(); onControl('MAIN_RESET_BUZZER', '⊘ أعيد الجرس'); }}
        />
      )}


      {showHowToPlay && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 120,
          background: 'rgba(20,24,20,0.74)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setShowHowToPlay(false)}>
          <div style={{
            width: 'min(760px, 100%)', maxHeight: '85vh', overflowY: 'auto',
            background: '#fff', borderRadius: 22, border: '3px solid #2D3436',
            boxShadow: '10px 10px 0 #2D3436', padding: '24px 24px 20px',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h3 style={{ margin: 0, fontFamily: 'Lalezar, serif', fontSize: 30, color: '#2D3436' }}>كيفية اللعب</h3>
              <button onClick={() => setShowHowToPlay(false)} style={{ border: 'none', background: 'transparent', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <ol style={{ margin: '16px 0 0', paddingInlineStart: 22, fontFamily: 'Cairo, sans-serif', lineHeight: 1.9, color: '#384244', fontWeight: 700 }}>
              <li>قبل البدء: افتح زر <b>📱 رموز QR</b> ليظهر رابط كل فريق، ثم يدخل كل فريق من جواله على الرابط الخاص به.</li>
              <li>بعد الضغط على <b>▶ بدء اللعبة</b> يختار النظام أول خلية عشوائياً، وتظهر بطاقة السؤال تلقائياً.</li>
              <li>كل فريق يضغط الجرس من جهازه، وأول ضغط صحيح يحصل على فرصة الإجابة خلال 10 ثوانٍ.</li>
              <li>إذا كانت الإجابة صحيحة تُحجز الخلية بلون الفريق. إذا كانت خاطئة تنتقل الفرصة للفريق الآخر.</li>
              <li><b>شرط الفوز (الاتصال):</b> الفريق الأخضر يوصل مساراً متصلاً من أعلى اللوحة إلى أسفلها، والفريق البرتقالي يوصل مساراً متصلاً من اليمين إلى اليسار.</li>
            </ol>
          </div>
        </div>
      )}


      {/* ═══ WINNER BANNER ═══ */}
      {isEnded && state?.winner && (
        <div style={{ maxWidth: 1380, margin: '24px auto 0', padding: '0 24px' }}>
          <div
            className="winner-banner"
            style={{
              background: state.winner === 'green'
                ? 'linear-gradient(135deg,#6A8D56,#4a6b38)'
                : 'linear-gradient(135deg,#E67E22,#B85C0A)',
              borderRadius: 18, padding: '22px 36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,.2)',
            }}
          >
            <span style={{ fontSize: 36 }}>🏆</span>
            <span style={{ fontFamily: 'Lalezar, serif', fontSize: 28, color: '#fff' }}>
              الفائز: {state.winner === 'green' ? 'الفريق الأخضر' : 'الفريق البرتقالي'}
            </span>
            <span style={{ fontSize: 36 }}>🏆</span>
            <button
              onClick={handlePlayAgain}
              style={{
                marginRight: 'auto',
                background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.4)',
                borderRadius: 12, padding: '8px 20px', cursor: 'pointer',
                fontFamily: 'Lalezar, serif', fontSize: 16, color: '#fff',
              }}
            >
              لعبة جديدة
            </button>
          </div>
        </div>
      )}

      {/* ═══ BODY ═══ */}
      <div style={{
        maxWidth: 1380, margin: '28px auto 0', padding: '0 24px',
        display: 'block',
      }}>

        {/* ════ LEFT: BOARD ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ScorePanel greenWins={state?.matchWins.green ?? 0} redWins={state?.matchWins.red ?? 0} />

          <div style={{
            background: '#fff', borderRadius: 22,
            border: '3px solid #2D3436', boxShadow: '8px 8px 0 #2D3436',
            padding: '20px 18px',
            position: 'relative',
          }}>
            {/* Board header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <span style={{ fontFamily: 'Lalezar, serif', fontSize: 20, color: '#2D3436' }}>
                لوحة اللعب
              </span>
              {state && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: 13, color: '#999' }}>
                    دور:
                  </span>
                  <span style={{
                    fontFamily: 'Lalezar, serif', fontSize: 16,
                    color: state.currentTeamTurn === 'green' ? '#6A8D56' : '#E67E22',
                  }}>
                    {state.currentTeamTurn === 'green' ? '🟢 الأخضر' : '🟠 البرتقالي'}
                  </span>
                </div>
              )}
            </div>

            {/* Hex grid */}
            {state ? (
              <HexBoard
                board={state.board}
                activeCellId={state.activeCellId}
                isPlaying={isPlaying}
                onSelect={selectCell}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>
                في انتظار بيانات اللعبة...
              </div>
            )}

            {/* Legend */}
            <div style={{
              display: 'flex', gap: 16, justifyContent: 'center',
              marginTop: 20, flexWrap: 'wrap',
            }}>
              {[
                { label: 'أخضر', bg: 'linear-gradient(135deg,#6A8D56,#4a6b38)' },
                { label: 'برتقالي',  bg: 'linear-gradient(135deg,#E67E22,#B85C0A)' },
                { label: 'نشطة',  bg: 'linear-gradient(135deg,#fff4d6,#ffe099)', border: '2px solid #E08C36' },
                { label: 'متاحة', bg: '#fffcf0', border: '2px solid #d6c9a8' },
              ].map(({ label, bg, border }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 4,
                    background: bg, border: border ?? 'none', display: 'inline-block',
                  }} />
                  <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: 12, color: '#777', fontWeight: 600 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

          {/* Toast */}
          {toast && (
            <div className="toast" style={{
              textAlign: 'center', background: '#2D3436', color: '#FDF8E8',
              borderRadius: 10, padding: '10px 16px',
              fontFamily: 'Cairo, sans-serif', fontSize: 14, fontWeight: 700,
            }}>
              {toast}
            </div>
          )}
        </div>
      </div>
  );
};

export default HurufMain;

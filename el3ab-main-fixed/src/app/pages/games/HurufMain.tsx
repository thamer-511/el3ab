import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  HurufServerEvent,
  HurufSessionState,
  Team,
} from '../../../../shared/huruf/types';
import { connectHurufSocket, createHurufSession } from '../../lib/huruf';

/* ─────────────────────────────────────────
   STAGE HELPERS
───────────────────────────────────────── */
const stageText: Record<HurufSessionState['stage'], string> = {
  first: 'المحاولة الأولى',
  other: 'فرصة الفريق الآخر',
  final: 'الفرصة الأخيرة',
};

/* ─────────────────────────────────────────
   CSS
───────────────────────────────────────── */
const HURUF_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Lalezar&display=swap');

  :root {
    --green:      #6A8D56;
    --green2:     #4a6b38;
    --orange:     #E08C36;
    --orange2:    #b86e20;
    --dark:       #2D3436;
    --cream:      #FDF8E8;
    --tan:        #F3EAD3;
    --tan2:       #e8dfc4;
    --red-team:   #c0392b;
    --red-team2:  #922b21;
  }

  .huruf-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .huruf-root { direction: rtl; font-family: 'Cairo', sans-serif; }

  /* ── HEXAGONS (flat-top) ── */
  .hex-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    position: relative;
  }

  .hex-row {
    display: flex;
    flex-direction: row;
    position: relative;
  }

  .hex-wrap {
    position: relative;
    width: 80px;
    height: 92px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hex {
    position: absolute;
    inset: 0;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: filter .18s, transform .18s;
    border: none;
    outline: none;
    font-family: 'Lalezar', serif;
    font-size: 22px;
    color: var(--dark);
    font-weight: 700;
  }

  .hex:hover:not(:disabled):not(.hex-active) {
    filter: brightness(1.12);
    transform: scale(1.08);
    z-index: 2;
  }
  .hex:disabled:not(.hex-green):not(.hex-red) { cursor: default; }

  /* colours */
  .hex-empty  { background: var(--cream); box-shadow: inset 0 0 0 3px #d6c9a8; }
  .hex-green  { background: linear-gradient(160deg, var(--green), var(--green2)); color: #fff; box-shadow: inset 0 0 0 3px #3a5a28; }
  .hex-red    { background: linear-gradient(160deg, var(--red-team), var(--red-team2)); color: #fff; box-shadow: inset 0 0 0 3px #7a1d12; }
  .hex-active {
    background: linear-gradient(160deg,#fff4d6,#ffe099);
    box-shadow: 0 0 0 3px var(--orange), 0 0 20px rgba(224,140,54,.5);
    transform: scale(1.12);
    z-index: 3;
  }
  .hex-blurred {
    opacity: 0.35;
    filter: blur(1.5px);
    transition: opacity .3s, filter .3s;
  }

  /* ── EDGE INDICATORS ── */
  .board-wrapper {
    position: relative;
  }

  .edge-label {
    position: absolute;
    font-family: 'Lalezar', serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .edge-top {
    top: -28px;
    left: 50%;
    transform: translateX(-50%);
    color: var(--green);
  }

  .edge-bottom {
    bottom: -28px;
    left: 50%;
    transform: translateX(-50%);
    color: var(--green);
  }

  .edge-right {
    right: -52px;
    top: 50%;
    transform: translateY(-50%) rotate(90deg);
    color: var(--orange);
  }

  .edge-left {
    left: -52px;
    top: 50%;
    transform: translateY(-50%) rotate(-90deg);
    color: var(--orange);
  }

  /* ── TIMER RING ── */
  .timer-ring-wrap {
    position: relative;
    width: 72px;
    height: 72px;
    flex-shrink: 0;
  }
  .timer-ring-wrap svg {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
  }
  .timer-number {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Lalezar', serif;
    font-size: 26px;
    font-weight: 700;
    transition: color .3s;
  }

  /* ── BUZZER PULSE ── */
  @keyframes buzzerPulse {
    0%,100% { box-shadow: 0 0 0 0 currentColor; }
    50%      { box-shadow: 0 0 0 16px transparent; }
  }
  .buzzer-active { animation: buzzerPulse .85s ease infinite; }

  /* ── QUESTION BAR SLIDE-IN ── */
  @keyframes slideDown {
    from { transform: translateY(-12px); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
  }
  .question-bar { animation: slideDown .3s cubic-bezier(.22,1,.36,1); }

  /* ── LOBBY FADE UP ── */
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .lobby-card { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) forwards; }

  /* ── WINNER POP ── */
  @keyframes winnerPop {
    0%   { transform:scale(.75); opacity:0; }
    70%  { transform:scale(1.06); }
    100% { transform:scale(1);   opacity:1; }
  }
  .winner-banner { animation: winnerPop .6s cubic-bezier(.22,1,.36,1) forwards; }

  /* ── SPINNER ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  .huruf-spinner {
    width: 52px; height: 52px;
    border-radius: 50%;
    border: 4px solid var(--tan2);
    border-top-color: var(--green);
    animation: spin .9s linear infinite;
  }

  /* ── TOAST ── */
  @keyframes toastIn {
    from { opacity:0; transform:translateY(6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .action-toast { animation: toastIn .2s ease; }

  /* ── TIMER DANGER ── */
  @keyframes timerDanger {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }
  .timer-danger { animation: timerDanger .4s ease infinite; }
`;

function injectCSS(id: string, css: string) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   TIMER RING COMPONENT
───────────────────────────────────────── */
function TimerRing({ seconds, total = 10, color }: { seconds: number; total?: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const progress = seconds / total;
  const dash = circ * progress;
  const isDanger = seconds <= 3;

  return (
    <div className={`timer-ring-wrap ${isDanger ? 'timer-danger' : ''}`}>
      <svg viewBox="0 0 72 72" width={72} height={72}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="#e8dfc4" strokeWidth={5} />
        <circle
          cx={36} cy={36} r={r}
          fill="none"
          stroke={isDanger ? '#c0392b' : color}
          strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .25s linear, stroke .3s' }}
        />
      </svg>
      <div className="timer-number" style={{ color: isDanger ? '#c0392b' : color }}>
        {seconds}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   HEX BOARD  – true honeycomb tessellation
   Flat-top hexagons, odd columns offset down
───────────────────────────────────────── */
const COLS = 6;
const ROWS = 6;

// Flat-top hex dimensions
const HEX_W = 80;   // px  (tip-to-tip horizontal)
const HEX_H = 92;   // px  (flat edge to flat edge vertical, approx HEX_W * sin60 * 2)
const H_OFFSET = HEX_W * 0.75;   // horizontal distance between hex centers
const V_OFFSET = HEX_H;           // vertical distance between hex centers in same col
const COL_STAGGER = HEX_H * 0.5;  // odd cols shifted down by half

interface HexBoardProps {
  board: HurufSessionState['board'];
  activeCellId: string | null;
  isPlaying: boolean;
  hasQuestion: boolean;
  onSelect: (id: string) => void;
}

function HexBoard({ board, activeCellId, isPlaying, hasQuestion, onSelect }: HexBoardProps) {
  // Build grid: cells are [row][col]
  const grid: (typeof board[0])[][] = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push([]);
    for (let c = 0; c < COLS; c++) {
      grid[r].push(board[r * COLS + c]);
    }
  }

  // Container size
  const boardW = COLS * H_OFFSET + HEX_W * 0.25;
  const boardH = ROWS * V_OFFSET + COL_STAGGER;

  return (
    <div className="board-wrapper" style={{ margin: '36px auto', width: boardW, height: boardH, position: 'relative' }}>
      {/* Edge labels */}
      <div className="edge-label edge-top">🟢 أخضر ↑↓</div>
      <div className="edge-label edge-bottom">🟢 أخضر ↑↓</div>
      <div className="edge-label edge-right">🟠 برتقالي ↔</div>
      <div className="edge-label edge-left">🟠 برتقالي ↔</div>

      {grid.map((row, ri) =>
        row.map((cell, ci) => {
          const x = ci * H_OFFSET;
          const y = ri * V_OFFSET + (ci % 2 === 1 ? COL_STAGGER : 0);

          const isActive = cell.id === activeCellId;
          const isBlurred = hasQuestion && !isActive && !cell.closed;

          const colorClass =
            cell.owner === 'green' ? 'hex-green' :
            cell.owner === 'red'   ? 'hex-red'   :
            isActive               ? 'hex-active' :
                                     'hex-empty';

          return (
            <div
              key={cell.id}
              className={`hex-wrap ${isBlurred ? 'hex-blurred' : ''}`}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                zIndex: isActive ? 5 : 1,
              }}
            >
              <button
                className={`hex ${colorClass}`}
                disabled={!!cell.closed || !isPlaying || (!!activeCellId && !isActive)}
                onClick={() => onSelect(cell.id)}
                title={cell.letter}
              >
                {cell.letter}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   BUZZER INDICATOR with timer
───────────────────────────────────────── */
function BuzzerIndicator({
  lockedBy,
  locked,
  timerSeconds,
  timerRunning,
}: {
  lockedBy: Team | null;
  locked: boolean;
  timerSeconds: number;
  timerRunning: boolean;
}) {
  const isGreen = lockedBy === 'green';
  const isRed   = lockedBy === 'red';
  const pressed = locked && !!lockedBy;

  const accent = isGreen ? '#6A8D56' : isRed ? '#c0392b' : '#aaa';
  const label  = isGreen ? 'الفريق الأخضر' : isRed ? 'الفريق الأحمر' : null;
  const emoji  = isGreen ? '🟢' : isRed ? '🔴' : null;

  return (
    <div
      className={pressed ? 'buzzer-active' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: pressed ? `${accent}18` : '#f3ead3',
        border: `3px solid ${pressed ? accent : '#e0d5be'}`,
        borderRadius: 16, padding: '12px 18px',
        transition: 'all .3s',
        color: accent,
      }}
    >
      <span style={{ fontSize: 26 }}>🔔</span>

      {pressed ? (
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Lalezar, serif', fontSize: 20, color: accent, lineHeight: 1 }}>
            {emoji} {label}
          </div>
          <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: 12, color: '#888', marginTop: 3 }}>
            ضغط الجرس! {timerRunning ? '— يجيب الآن' : ''}
          </div>
        </div>
      ) : (
        <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: 14, color: '#aaa', fontWeight: 700, flex: 1 }}>
          الجرس متاح — في انتظار الفرق
        </span>
      )}

      {timerRunning && (
        <TimerRing seconds={timerSeconds} total={10} color={accent} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   QUESTION BAR
───────────────────────────────────────── */
function QuestionBar({
  question,
  stage,
  attemptNo,
}: {
  question: HurufSessionState['activeQuestion'];
  stage: HurufSessionState['stage'];
  attemptNo: number;
}) {
  const stageBg: Record<string, string> = {
    first: '#6A8D56',
    other: '#E08C36',
    final: '#c0392b',
  };
  const bg = stageBg[stage] ?? '#6A8D56';

  if (!question) {
    return (
      <div style={{
        background: '#f3ead3', border: '2px dashed #d6c9a8',
        borderRadius: 16, padding: '20px 24px', textAlign: 'center',
      }}>
        <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: 15, color: '#bbb' }}>
          اختر خلية من اللوحة لعرض السؤال
        </span>
      </div>
    );
  }

  return (
    <div
      className="question-bar"
      style={{ borderRadius: 16, overflow: 'hidden', border: `3px solid ${bg}`, boxShadow: `0 8px 28px ${bg}33` }}
    >
      <div style={{
        background: bg, padding: '7px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontFamily: 'Lalezar, serif', fontSize: 14, color: '#fff', opacity: .85 }}>
          {stageText[stage]}
        </span>
        <span style={{
          marginRight: 'auto',
          background: 'rgba(255,255,255,.22)', borderRadius: 20,
          padding: '2px 13px', fontFamily: 'Lalezar, serif', fontSize: 14, color: '#fff',
        }}>
          حرف {question.letter}
        </span>
        <span style={{
          background: 'rgba(255,255,255,.18)', borderRadius: 20,
          padding: '2px 12px', fontFamily: 'Cairo, sans-serif', fontSize: 12, color: '#fff',
        }}>
          محاولة {attemptNo}
        </span>
      </div>

      <div style={{ background: '#fff', padding: '22px 26px' }}>
        <p style={{
          fontFamily: 'Lalezar, serif', fontSize: 28,
          color: '#2D3436', lineHeight: 1.45, textAlign: 'center',
        }}>
          {question.prompt}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CONTROL BUTTONS
───────────────────────────────────────── */
function Controls({
  onControl,
  isPlaying,
  hasActiveCell,
  toast,
}: {
  onControl: (type: string, label: string) => void;
  isPlaying: boolean;
  hasActiveCell: boolean;
  toast: string | null;
}) {
  const Btn = ({
    label, action, bg, borderCol, color = '#fff', disabled = false, fullWidth = false,
  }: {
    label: string; action: string; bg: string; borderCol: string;
    color?: string; disabled?: boolean; fullWidth?: boolean;
  }) => (
    <button
      onClick={() => onControl(action, label)}
      disabled={disabled}
      style={{
        flex: fullWidth ? undefined : 1,
        width: fullWidth ? '100%' : undefined,
        padding: '12px 10px',
        background: disabled ? '#ececec' : bg,
        border: `2px solid ${disabled ? '#d0d0d0' : borderCol}`,
        borderRadius: 12,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Lalezar, serif', fontSize: 17,
        color: disabled ? '#bbb' : color,
        boxShadow: disabled ? 'none' : `0 4px 12px ${borderCol}44`,
        transition: 'all .15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn label="✓ صحيح" action="MAIN_MARK_CORRECT"
          bg="linear-gradient(135deg,#6A8D56,#4a6b38)" borderCol="#6A8D56"
          disabled={!hasActiveCell} />
        <Btn label="✗ خطأ"  action="MAIN_MARK_WRONG"
          bg="linear-gradient(135deg,#c0392b,#922b21)" borderCol="#c0392b"
          disabled={!hasActiveCell} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn label="↻ سؤال جديد"   action="MAIN_NEW_QUESTION"
          bg="#fff" borderCol="#2D3436" color="#2D3436"
          disabled={!hasActiveCell} />
        <Btn label="⊘ إعادة الجرس" action="MAIN_RESET_BUZZER"
          bg="#f3ead3" borderCol="#d6c9a8" color="#5F6A56" />
      </div>

      {!isPlaying && (
        <button
          onClick={() => onControl('MAIN_START_GAME', '▶ بدأت اللعبة!')}
          style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg,#2D3436,#3d4649)',
            border: '2px solid #2D3436', borderRadius: 12, cursor: 'pointer',
            fontFamily: 'Lalezar, serif', fontSize: 20, color: '#FDF8E8',
            boxShadow: '0 6px 18px rgba(45,52,54,.35)',
          }}
        >
          ▶ بدء اللعبة
        </button>
      )}

      {toast && (
        <div className="action-toast" style={{
          textAlign: 'center', background: '#2D3436', color: '#FDF8E8',
          borderRadius: 10, padding: '9px 16px',
          fontFamily: 'Cairo, sans-serif', fontSize: 13, fontWeight: 700,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   SCORE PANEL
───────────────────────────────────────── */
function ScorePanel({ board }: { board: HurufSessionState['board'] }) {
  const greenCount = board.filter(c => c.owner === 'green').length;
  const redCount   = board.filter(c => c.owner === 'red').length;
  const total      = board.length;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: '#fff', border: '2px solid #e8dfc4',
      borderRadius: 14, padding: '12px 20px',
    }}>
      <div style={{ textAlign: 'center', minWidth: 40 }}>
        <div style={{ fontFamily: 'Lalezar, serif', fontSize: 30, color: '#6A8D56', lineHeight: 1 }}>
          {greenCount}
        </div>
        <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: 11, color: '#888' }}>أخضر</div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
        <div style={{ flex: 1, background: '#f0ebe0', borderRadius: 8, height: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(greenCount / total) * 100}%`,
            background: 'linear-gradient(90deg,#6A8D56,#4a6b38)',
            borderRadius: 8, transition: 'width .5s ease',
          }} />
        </div>
        <span style={{ fontFamily: 'Lalezar, serif', fontSize: 14, color: '#ccc', margin: '0 4px' }}>vs</span>
        <div style={{ flex: 1, background: '#f0ebe0', borderRadius: 8, height: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(redCount / total) * 100}%`,
            background: 'linear-gradient(90deg,#c0392b,#922b21)',
            borderRadius: 8, transition: 'width .5s ease',
            marginLeft: 'auto',
          }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', minWidth: 40 }}>
        <div style={{ fontFamily: 'Lalezar, serif', fontSize: 30, color: '#c0392b', lineHeight: 1 }}>
          {redCount}
        </div>
        <div style={{ fontFamily: 'Cairo, sans-serif', fontSize: 11, color: '#888' }}>أحمر</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   QR LOBBY MODAL
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
      <div style={{ padding: '14px 14px 6px', display: 'flex', justifyContent: 'center' }}>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(link)}&color=2D3436&bgcolor=FFFDF5`}
          alt={`QR ${label}`}
          style={{ width: 148, height: 148, borderRadius: 8, display: 'block' }}
        />
      </div>
      <p style={{
        fontFamily: 'monospace', fontSize: 8.5, color: '#bbb',
        padding: '4px 12px 12px', wordBreak: 'break-all', textAlign: 'center',
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
        padding: '38px 44px', maxWidth: 580, width: '92vw',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 38, lineHeight: 1 }}>⬡</span>
        <h2 style={{ fontFamily: 'Lalezar, serif', fontSize: 34, color: '#2D3436', margin: '10px 0 6px' }}>
          خلية الحروف
        </h2>
        <p style={{ fontFamily: 'Cairo, sans-serif', fontSize: 14, color: '#999', marginBottom: 8 }}>
          امسح رمز QR لكل فريق لربط جرس الهاتف
        </p>
        <p style={{ fontFamily: 'Cairo, sans-serif', fontSize: 13, color: '#aaa', marginBottom: 30 }}>
          🟢 الفريق الأخضر: يربط أعلى ↔ أسفل &nbsp;|&nbsp; 🟠 الفريق البرتقالي: يربط يمين ↔ يسار
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 30 }}>
          <QrCard accent="#6A8D56" label="فريق أخضر" link={greenLink} />
          <QrCard accent="#E08C36" label="فريق برتقالي" link={redLink} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onStart}
            style={{
              flex: 1, padding: '13px 0',
              background: 'linear-gradient(135deg,#6A8D56,#4a6b38)',
              border: '2px solid #6A8D56', borderRadius: 14, cursor: 'pointer',
              fontFamily: 'Lalezar, serif', fontSize: 21, color: '#fff',
              boxShadow: '0 5px 16px rgba(106,141,86,.4)',
            }}
          >
            ابدأ اللعبة ▶
          </button>
          <button
            onClick={onSkip}
            style={{
              padding: '13px 22px',
              background: 'transparent', border: '2px solid #d0c8b8',
              borderRadius: 14, cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif', fontSize: 15, color: '#aaa',
            }}
          >
            تخطي
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

  const [sessionId, setSessionId] = useState('');
  const [state,     setState]     = useState<HurufSessionState | null>(null);
  const [send,      setSend]      = useState<((e: any) => void) | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState<string | null>(null);
  const [showLobby, setShowLobby] = useState(true);

  // Client-side countdown timer (starts when buzzer locks)
  const [timerSeconds, setTimerSeconds]   = useState(10);
  const [timerRunning, setTimerRunning]   = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerRunning(false);
    setTimerSeconds(10);
  };

  const startTimer = () => {
    clearTimer();
    setTimerSeconds(10);
    setTimerRunning(true);
    let remaining = 10;
    timerIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setTimerSeconds(remaining);
      if (remaining <= 0) {
        clearTimer();
      }
    }, 1000);
  };

  /* ── Session init ── */
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    createHurufSession()
      .then(({ sessionId: id }) => {
        setSessionId(id);
        const socket = connectHurufSocket(id, (event: HurufServerEvent) => {
          if (event.type === 'SESSION_STATE') {
            setState(event.state);
            // Stop timer if buzzer was reset
            if (!event.state.buzzer.locked) {
              clearTimer();
            }
          }
          if (event.type === 'BUZZ_LOCKED') {
            // Start 10s client-side timer when someone buzzes
            startTimer();
          }
          if (event.type === 'BUZZ_RESET') {
            clearTimer();
          }
        });
        setSend(() => socket.send);
        socket.ws.onopen = () => socket.send({ type: 'JOIN', role: 'main' });
        cleanup = () => socket.ws.close();
        setLoading(false);
      })
      .catch(() => {
        setError('فشل في إنشاء جلسة اللعبة. يرجى المحاولة لاحقاً.');
        setLoading(false);
      });

    return () => {
      cleanup?.();
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Join links – NO auth required */
  const joinLinks = useMemo(() => {
    if (!sessionId) return null;
    const base = `${window.location.origin}/games/huruf/join?sessionId=${sessionId}`;
    return {
      green: `${base}&team=green`,
      red:   `${base}&team=red`,
    };
  }, [sessionId]);

  /* ── Control helpers ── */
  const onControl = (type: string, label: string) => {
    send?.({ type });
    // Reset timer on mark correct/wrong/reset
    if (type === 'MAIN_MARK_CORRECT' || type === 'MAIN_MARK_WRONG' || type === 'MAIN_RESET_BUZZER') {
      clearTimer();
    }
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(label);
    toastRef.current = setTimeout(() => setToast(null), 1500);
  };

  const selectCell = (cellId: string) => send?.({ type: 'MAIN_SELECT_CELL', cellId });

  const handleLobbyStart = () => {
    setShowLobby(false);
    onControl('MAIN_START_GAME', '▶ بدأت اللعبة!');
  };
  const handleLobbySkip = () => setShowLobby(false);

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
          border: '3px solid #c0392b', boxShadow: '8px 8px 0 #c0392b',
          padding: 44, textAlign: 'center',
        }}>
          <span style={{ fontSize: 54 }}>⚠️</span>
          <h2 style={{ fontFamily: 'Lalezar, serif', fontSize: 28, color: '#c0392b', margin: '14px 0 10px' }}>
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

  const isPlaying     = state?.status === 'playing';
  const isEnded       = state?.status === 'ended';
  const hasActiveCell = !!state?.activeCellId;
  const hasQuestion   = !!state?.activeQuestion;

  /* ── Main UI ── */
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
          maxWidth: 1440, margin: '0 auto', padding: '0 28px', height: 66,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26, color: '#E08C36' }}>⬡</span>
            <span style={{ fontFamily: 'Lalezar, serif', fontSize: 27, color: '#FDF8E8' }}>
              خلية الحروف
            </span>
            <span style={{
              fontFamily: 'Cairo, sans-serif', fontSize: 12, color: '#aaa',
              background: 'rgba(255,255,255,.09)', padding: '3px 11px', borderRadius: 20,
            }}>
              الشاشة الرئيسية
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
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: isPlaying ? '#6A8D56' : isEnded ? '#c0392b' : '#555',
              padding: '5px 16px', borderRadius: 30,
              fontFamily: 'Lalezar, serif', fontSize: 15, color: '#fff',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'rgba(255,255,255,.85)', boxShadow: '0 0 6px #fff',
                display: 'inline-block',
              }} />
              {isPlaying ? 'جارية' : isEnded ? 'انتهت' : 'انتظار'}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ QR LOBBY MODAL ═══ */}
      {showLobby && joinLinks && (
        <QrLobby
          greenLink={joinLinks.green}
          redLink={joinLinks.red}
          onSkip={handleLobbySkip}
          onStart={handleLobbyStart}
        />
      )}

      {/* ═══ WINNER BANNER ═══ */}
      {isEnded && state?.winner && (
        <div style={{ maxWidth: 1440, margin: '24px auto 0', padding: '0 24px' }}>
          <div
            className="winner-banner"
            style={{
              background: state.winner === 'green'
                ? 'linear-gradient(135deg,#6A8D56,#4a6b38)'
                : 'linear-gradient(135deg,#E08C36,#b86e20)',
              borderRadius: 18, padding: '22px 36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,.2)',
            }}
          >
            <span style={{ fontSize: 38 }}>🏆</span>
            <span style={{ fontFamily: 'Lalezar, serif', fontSize: 30, color: '#fff' }}>
              الفائز: {state.winner === 'green' ? '🟢 الفريق الأخضر' : '🟠 الفريق البرتقالي'}
            </span>
            <span style={{ fontSize: 38 }}>🏆</span>
          </div>
        </div>
      )}

      {/* ═══ BODY ═══ */}
      <div style={{
        maxWidth: 1440, margin: '28px auto 0', padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: 26, alignItems: 'start',
      }}>

        {/* ════ LEFT: BOARD ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {state && <ScorePanel board={state.board} />}

          <div style={{
            background: '#fff', borderRadius: 22,
            border: '3px solid #2D3436', boxShadow: '8px 8px 0 #2D3436',
            padding: '26px 22px 26px',
            overflowX: 'auto',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <span style={{ fontFamily: 'Lalezar, serif', fontSize: 20, color: '#2D3436' }}>
                لوحة اللعب
              </span>
              {state?.activeCellId && (
                <span style={{
                  background: '#E08C36', color: '#fff',
                  fontFamily: 'Lalezar, serif', fontSize: 14,
                  padding: '3px 15px', borderRadius: 20,
                  boxShadow: '0 2px 8px rgba(224,140,54,.35)',
                }}>
                  خلية نشطة: {state.board.find(c => c.id === state.activeCellId)?.letter}
                </span>
              )}
            </div>

            {/* Win condition reminder */}
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: 12, color: '#6A8D56', fontWeight: 700 }}>
                🟢 الأخضر: يربط أعلى ↕ أسفل
              </span>
              <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: 12, color: '#E08C36', fontWeight: 700 }}>
                🟠 البرتقالي: يربط يمين ↔ يسار
              </span>
            </div>

            {state ? (
              <HexBoard
                board={state.board}
                activeCellId={state.activeCellId}
                isPlaying={isPlaying}
                hasQuestion={hasQuestion}
                onSelect={selectCell}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontFamily: 'Cairo, sans-serif' }}>
                في انتظار بيانات اللعبة...
              </div>
            )}

            {/* Legend */}
            <div style={{
              display: 'flex', gap: 20, justifyContent: 'center',
              marginTop: 16, flexWrap: 'wrap',
            }}>
              {[
                { label: 'الفريق الأخضر',     bg: 'linear-gradient(135deg,#6A8D56,#4a6b38)' },
                { label: 'الفريق البرتقالي',  bg: 'linear-gradient(135deg,#E08C36,#b86e20)' },
                { label: 'نشطة',              bg: 'linear-gradient(135deg,#fff4d6,#ffe099)', border: '2px solid #E08C36' },
                { label: 'متاحة',             bg: '#FDF8E8', border: '2px solid #d6c9a8' },
              ].map(({ label, bg, border }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 4,
                    background: bg, border: border ?? 'none', display: 'inline-block',
                  }} />
                  <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: 13, color: '#777', fontWeight: 600 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ RIGHT: SIDEBAR ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Question bar */}
          <QuestionBar
            question={state?.activeQuestion ?? null}
            stage={state?.stage ?? 'first'}
            attemptNo={state?.attemptNo ?? 1}
          />

          {/* Buzzer with timer */}
          <BuzzerIndicator
            lockedBy={state?.buzzer?.lockedBy ?? null}
            locked={state?.buzzer?.locked ?? false}
            timerSeconds={timerSeconds}
            timerRunning={timerRunning}
          />

          {/* Control panel */}
          <div style={{
            background: '#fff', borderRadius: 18,
            border: '3px solid #2D3436', boxShadow: '6px 6px 0 #2D3436',
            padding: 18,
          }}>
            <div style={{
              fontFamily: 'Lalezar, serif', fontSize: 18, color: '#2D3436',
              marginBottom: 14, borderBottom: '2px dashed #e8dfc4', paddingBottom: 10,
            }}>
              التحكم
            </div>
            <Controls
              onControl={onControl}
              isPlaying={isPlaying}
              hasActiveCell={hasActiveCell}
              toast={toast}
            />
          </div>

          {/* Session info */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '2px solid #e8dfc4', padding: '14px 18px',
          }}>
            <div style={{
              fontFamily: 'Lalezar, serif', fontSize: 16, color: '#2D3436',
              marginBottom: 12,
            }}>
              معلومات الجلسة
            </div>
            {[
              {
                label: 'الدور الحالي',
                value: state?.currentTeamTurn === 'green' ? '🟢 الفريق الأخضر' : '🟠 الفريق البرتقالي',
                color: state?.currentTeamTurn === 'green' ? '#6A8D56' : '#E08C36',
              },
              {
                label: 'المرحلة',
                value: state ? stageText[state.stage] : '—',
                color: '#E08C36',
              },
              {
                label: 'رقم المحاولة',
                value: String(state?.attemptNo ?? 1),
                color: '#2D3436',
              },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid #f0ebe0',
              }}>
                <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: 13, color: '#999', fontWeight: 600 }}>
                  {label}
                </span>
                <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: 14, color, fontWeight: 700 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HurufMain;

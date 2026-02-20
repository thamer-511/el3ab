import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { HurufServerEvent, Team } from '../../../../shared/huruf/types';
import { connectHurufSocket } from '../../lib/huruf';

type ViewState = 'READY' | 'YOU_BUZZED' | 'OTHER_TEAM_BUZZED' | 'DISCONNECTED' | 'WAITING';

const TIMER_DURATION = 10; // seconds

// Brand colors
const GREEN       = '#6A8D56';
const GREEN_DARK  = '#4a6b38';
const GREEN_GLOW  = 'rgba(106,141,86,0.5)';
const GREEN_GLOW2 = 'rgba(106,141,86,0.25)';

const ORANGE       = '#E08C36';
const ORANGE_DARK  = '#b86e20';
const ORANGE_GLOW  = 'rgba(224,140,54,0.5)';
const ORANGE_GLOW2 = 'rgba(224,140,54,0.25)';

const JOIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Lalezar&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  
  .join-root {
    min-height: 100vh;
    direction: rtl;
    font-family: 'Cairo', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    transition: background 0.4s ease;
  }

  .join-root.green-theme {
    background: linear-gradient(160deg, #1a2e1a 0%, #2d4a2d 50%, #1a3a1a 100%);
  }

  .join-root.orange-theme {
    background: linear-gradient(160deg, #2e1e0a 0%, #4a2e0a 50%, #3a200a 100%);
  }

  .join-root.buzzing-green {
    background: linear-gradient(160deg, #2a4e2a 0%, #4a7a4a 50%, #2a4e2a 100%);
    animation: greenPulse 0.6s ease infinite alternate;
  }

  .join-root.buzzing-orange {
    background: linear-gradient(160deg, #4e2e0a 0%, #7a4a10 50%, #4e2e0a 100%);
    animation: orangePulse 0.6s ease infinite alternate;
  }

  @keyframes greenPulse {
    from { filter: brightness(1); }
    to { filter: brightness(1.3); }
  }

  @keyframes orangePulse {
    from { filter: brightness(1); }
    to { filter: brightness(1.3); }
  }

  .team-badge {
    font-family: 'Lalezar', serif;
    font-size: 18px;
    padding: 8px 24px;
    border-radius: 40px;
    margin-bottom: 32px;
    border: 2px solid rgba(255,255,255,0.3);
    color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
  }

  .buzz-btn {
    position: relative;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    font-family: 'Lalezar', serif;
    font-size: 48px;
    color: #fff;
    transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.2s;
    outline: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .buzz-btn:active:not(:disabled) {
    transform: scale(0.93) !important;
  }

  .buzz-btn:disabled {
    cursor: not-allowed;
    filter: saturate(0.4) brightness(0.7);
    transform: scale(0.95);
  }

  /* ── GREEN button ── */
  .buzz-btn.green-btn {
    background: radial-gradient(circle at 35% 35%, #8ab56a, #4a7a2a);
    box-shadow: 0 12px 40px rgba(106,141,86,0.5), 0 4px 0 #2a5a10, inset 0 -4px 0 rgba(0,0,0,0.2);
  }

  .buzz-btn.green-btn:hover:not(:disabled) {
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(106,141,86,0.65), 0 8px 0 #2a5a10, inset 0 -4px 0 rgba(0,0,0,0.2);
  }

  .buzz-btn.green-btn.buzzing {
    box-shadow: 0 0 0 20px rgba(106,141,86,0.3), 0 0 0 40px rgba(106,141,86,0.15), 0 12px 40px rgba(106,141,86,0.5);
    animation: buzzScale 0.3s ease infinite alternate;
  }

  /* ── ORANGE button ── */
  .buzz-btn.orange-btn {
    background: radial-gradient(circle at 35% 35%, #f0a855, #b86e20);
    box-shadow: 0 12px 40px rgba(224,140,54,0.5), 0 4px 0 #7a4a10, inset 0 -4px 0 rgba(0,0,0,0.2);
  }

  .buzz-btn.orange-btn:hover:not(:disabled) {
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(224,140,54,0.65), 0 8px 0 #7a4a10, inset 0 -4px 0 rgba(0,0,0,0.2);
  }

  .buzz-btn.orange-btn.buzzing {
    box-shadow: 0 0 0 20px rgba(224,140,54,0.3), 0 0 0 40px rgba(224,140,54,0.15), 0 12px 40px rgba(224,140,54,0.5);
    animation: buzzScale 0.3s ease infinite alternate;
  }

  @keyframes buzzScale {
    from { transform: scale(1); }
    to { transform: scale(1.05); }
  }

  .status-text {
    margin-top: 28px;
    font-family: 'Cairo', sans-serif;
    font-size: 20px;
    font-weight: 700;
    text-align: center;
    color: rgba(255,255,255,0.9);
    min-height: 32px;
  }

  .timer-ring {
    position: absolute;
    top: -12px; left: -12px;
    width: calc(100% + 24px);
    height: calc(100% + 24px);
    border-radius: 50%;
    pointer-events: none;
  }

  .timer-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Lalezar', serif;
    font-size: 48px;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0,0,0,0.4);
    pointer-events: none;
  }

  .other-buzz {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 32px 40px;
    background: rgba(0,0,0,0.3);
    border-radius: 24px;
    border: 2px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
  }

  .other-buzz .emoji { font-size: 48px; }
  .other-buzz .msg {
    font-family: 'Lalezar', serif;
    font-size: 24px;
    color: rgba(255,255,255,0.8);
    text-align: center;
  }

  .timer-display {
    font-family: 'Lalezar', serif;
    font-size: 72px;
    color: #fff;
    text-shadow: 0 4px 20px rgba(0,0,0,0.5);
    line-height: 1;
  }

  .timer-display.urgent {
    color: #ffcc44;
    animation: urgentBlink 0.5s ease infinite alternate;
  }

  @keyframes urgentBlink {
    from { opacity: 1; }
    to { opacity: 0.6; }
  }
`;

function injectJoinCSS() {
  const id = 'huruf-join-css';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = JOIN_CSS;
  document.head.appendChild(s);
}

// SVG Timer Ring
function TimerRing({ progress, color }: { progress: number; color: string }) {
  const r = 110;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;

  return (
    <svg className="timer-ring" viewBox="0 0 244 244">
      <circle cx="122" cy="122" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
      <circle
        cx="122"
        cy="122"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transformOrigin: 'center', transform: 'rotate(-90deg)', transition: 'stroke-dasharray 0.1s linear' }}
      />
    </svg>
  );
}

export const HurufJoin = () => {
  injectJoinCSS();

  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') ?? '';
  const team = (searchParams.get('team') as Team) || 'green';
  const [status, setStatus] = useState<ViewState>('DISCONNECTED');
  const [timer, setTimer] = useState<number>(0); // seconds remaining
  const [timerActive, setTimerActive] = useState(false);
  const [myTimerRunning, setMyTimerRunning] = useState(false);
  const sendRef = useRef<((event: any) => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartRef = useRef<number>(0);

  const startTimer = (forTeam: Team) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerStartRef.current = Date.now();
    setTimer(10);
    setTimerActive(true);
    setMyTimerRunning(forTeam === team);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - timerStartRef.current) / 1000;
      const remaining = Math.max(0, 10 - elapsed);
      setTimer(Math.ceil(remaining));
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setTimerActive(false);
        setMyTimerRunning(false);
        // Notify server timer expired
        sendRef.current?.({ type: 'TIMER_EXPIRED', team: forTeam });
      }
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    setMyTimerRunning(false);
    setTimer(0);
  };

  const connect = () => {
    if (!sessionId) return;
    const socket = connectHurufSocket(sessionId, (event: HurufServerEvent) => {
      if (event.type === 'SESSION_STATE') {
        if (!event.state.buzzer.locked) {
          setStatus('READY');
          stopTimer();
        } else if (event.state.buzzer.lockedBy === team) {
          setStatus('YOU_BUZZED');
        } else {
          setStatus('OTHER_TEAM_BUZZED');
        }
      }
      if (event.type === 'BUZZ_LOCKED') {
        if (event.team === team) {
          setStatus('YOU_BUZZED');
        } else {
          setStatus('OTHER_TEAM_BUZZED');
          stopTimer();
        }
      }
      if (event.type === 'TIMER_START') {
        startTimer(event.team);
      }
      if (event.type === 'BUZZ_RESET' || event.type === 'TIMER_EXPIRED_SERVER') {
        setStatus('READY');
        stopTimer();
      }
    });

    sendRef.current = socket.send;
    socket.ws.onopen = () => {
      setStatus('READY');
      socket.send({ type: 'JOIN', role: 'mobile', team });
    };
    socket.ws.onclose = () => {
      setStatus('DISCONNECTED');
      setTimeout(connect, 2000);
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, team]);

  const canBuzz = status === 'READY';
  const isBuzzing = status === 'YOU_BUZZED';
  const isOtherBuzzing = status === 'OTHER_TEAM_BUZZED';

  // ✅ Use 'orange' theme for red team instead of 'red'
  const themeClass = isBuzzing
    ? `buzzing-${team === 'green' ? 'green' : 'orange'}`
    : `${team === 'green' ? 'green' : 'orange'}-theme`;

  const teamLabel      = team === 'green' ? 'الفريق الأخضر'    : 'الفريق البرتقالي';
  const otherTeamLabel = team === 'green' ? 'الفريق البرتقالي' : 'الفريق الأخضر';
  const timerProgress  = timer / 10;

  // ✅ Brand colors for ring
  const timerRingColor = team === 'green' ? '#90ff60' : '#ffb340';
  // ✅ Other team emoji
  const otherEmoji = team === 'green' ? '🟠' : '🟢';
  const myEmoji    = team === 'green' ? '🟢' : '🟠';

  return (
    <div className={`join-root ${themeClass}`}>
      <div className="team-badge">
        {myEmoji} {teamLabel}
      </div>

      {status === 'DISCONNECTED' ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
          <div style={{ fontFamily: 'Lalezar, serif', fontSize: 24, color: 'rgba(255,255,255,0.7)' }}>
            جاري الاتصال...
          </div>
        </div>
      ) : isOtherBuzzing ? (
        <div className="other-buzz">
          <div className="emoji">{otherEmoji}</div>
          <div className="msg">{otherTeamLabel}<br />ضغط الجرس!</div>
          {timerActive && !myTimerRunning && (
            <div className={`timer-display ${timer <= 3 ? 'urgent' : ''}`}>{timer}</div>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            disabled={!canBuzz}
            onClick={() => sendRef.current?.({ type: 'BUZZ_REQUEST', team })}
            className={`buzz-btn ${team === 'green' ? 'green-btn' : 'orange-btn'} ${isBuzzing ? 'buzzing' : ''}`}
          >
            {/* Timer ring */}
            {timerActive && myTimerRunning && (
              <TimerRing
                progress={timerProgress}
                color={timerRingColor}
              />
            )}

            {/* Button content */}
            {isBuzzing && timerActive ? (
              <span className={`timer-text ${timer <= 3 ? 'urgent' : ''}`}>{timer}</span>
            ) : (
              <span style={{ position: 'relative', zIndex: 1 }}>🔔</span>
            )}
          </button>
        </div>
      )}

      <div className="status-text">
        {canBuzz && 'اضغط للإجابة!'}
        {isBuzzing && timerActive && `جاوب الآن!`}
        {isBuzzing && !timerActive && 'ضغطت الجرس!'}
        {isOtherBuzzing && myTimerRunning && `دورك بعد ${timer} ثانية`}
      </div>
    </div>
  );
};

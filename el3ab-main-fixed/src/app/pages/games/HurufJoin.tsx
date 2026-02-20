import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { HurufServerEvent, Team } from '../../../../shared/huruf/types';
import { connectHurufSocket } from '../../lib/huruf';

type ViewState = 'READY' | 'YOU_BUZZED' | 'OTHER_TEAM_BUZZED' | 'DISCONNECTED';

const TIMER_DURATION = 15;

const GREEN       = '#6A8D56';
const GREEN_DARK  = '#4a6b38';
const ORANGE      = '#E08C36';
const ORANGE_DARK = '#b86e20';

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

  .join-root.green-theme  { background: linear-gradient(160deg,#1a2e1a 0%,#2d4a2d 50%,#1a3a1a 100%); }
  .join-root.orange-theme { background: linear-gradient(160deg,#2e1e0a 0%,#4a2e0a 50%,#3a200a 100%); }

  .join-root.buzzing-green {
    background: linear-gradient(160deg,#2a4e2a 0%,#4a7a4a 50%,#2a4e2a 100%);
    animation: greenPulse 0.6s ease infinite alternate;
  }
  .join-root.buzzing-orange {
    background: linear-gradient(160deg,#4e2e0a 0%,#7a4a10 50%,#4e2e0a 100%);
    animation: orangePulse 0.6s ease infinite alternate;
  }

  @keyframes greenPulse  { from{filter:brightness(1)} to{filter:brightness(1.3)} }
  @keyframes orangePulse { from{filter:brightness(1)} to{filter:brightness(1.3)} }

  .team-badge {
    font-family:'Lalezar',serif; font-size:18px; padding:8px 24px; border-radius:40px;
    margin-bottom:32px; border:2px solid rgba(255,255,255,0.3);
    color:rgba(255,255,255,0.85); background:rgba(255,255,255,0.1); backdrop-filter:blur(10px);
  }

  /* ── BUZZ BUTTON ── */
  .buzz-btn {
    position:relative; width:220px; height:220px; border-radius:50%; border:none;
    cursor:pointer; font-family:'Lalezar',serif; font-size:48px; color:#fff;
    transition:transform 0.12s ease, box-shadow 0.12s ease, filter 0.2s;
    outline:none; user-select:none; -webkit-tap-highlight-color:transparent;
  }
  .buzz-btn:active:not(:disabled) { transform:scale(0.93)!important; }
  .buzz-btn:disabled { cursor:not-allowed; filter:saturate(0.4) brightness(0.7); transform:scale(0.95); }

  .buzz-btn.green-btn {
    background:radial-gradient(circle at 35% 35%,#8ab56a,#4a7a2a);
    box-shadow:0 12px 40px rgba(106,141,86,0.5),0 4px 0 #2a5a10,inset 0 -4px 0 rgba(0,0,0,0.2);
  }
  .buzz-btn.green-btn:hover:not(:disabled) {
    transform:translateY(-4px);
    box-shadow:0 20px 60px rgba(106,141,86,0.65),0 8px 0 #2a5a10,inset 0 -4px 0 rgba(0,0,0,0.2);
  }

  .buzz-btn.orange-btn {
    background:radial-gradient(circle at 35% 35%,#f0a855,#b86e20);
    box-shadow:0 12px 40px rgba(224,140,54,0.5),0 4px 0 #7a4a10,inset 0 -4px 0 rgba(0,0,0,0.2);
  }
  .buzz-btn.orange-btn:hover:not(:disabled) {
    transform:translateY(-4px);
    box-shadow:0 20px 60px rgba(224,140,54,0.65),0 8px 0 #7a4a10,inset 0 -4px 0 rgba(0,0,0,0.2);
  }

  @keyframes buzzScale { from{transform:scale(1)} to{transform:scale(1.05)} }

  .status-text {
    margin-top:28px; font-family:'Cairo',sans-serif; font-size:20px; font-weight:700;
    text-align:center; color:rgba(255,255,255,0.9); min-height:32px;
  }

  /* ── OTHER TEAM BUZZED ── */
  .other-buzz {
    display:flex; flex-direction:column; align-items:center; gap:16px;
    padding:32px 40px; background:rgba(0,0,0,0.3); border-radius:24px;
    border:2px solid rgba(255,255,255,0.1); backdrop-filter:blur(10px);
  }
  .other-buzz .emoji { font-size:48px; }
  .other-buzz .msg { font-family:'Lalezar',serif; font-size:24px; color:rgba(255,255,255,0.8); text-align:center; }

  .timer-display { font-family:'Lalezar',serif; font-size:72px; color:#fff; text-shadow:0 4px 20px rgba(0,0,0,0.5); line-height:1; }
  .timer-display.urgent { color:#ffcc44; animation:urgentBlink 0.5s ease infinite alternate; }

  @keyframes urgentBlink { from{opacity:1} to{opacity:0.6} }

  /* ── ANSWER PANEL ── */
  .answer-panel {
    width:100%; max-width:420px; background:rgba(0,0,0,0.35);
    border:2px solid rgba(255,255,255,0.15); border-radius:24px;
    padding:24px 20px; display:flex; flex-direction:column; align-items:center;
    gap:16px; backdrop-filter:blur(10px);
  }

  .answer-timer-row {
    display:flex; align-items:center; justify-content:space-between; width:100%;
  }

  .answer-timer-num {
    font-family:'Lalezar',serif; font-size:44px; color:#fff;
    text-shadow:0 2px 8px rgba(0,0,0,0.5); min-width:52px; text-align:center;
  }
  .answer-timer-num.urgent { color:#ffcc44; animation:urgentBlink 0.5s ease infinite alternate; }

  .answer-progress { flex:1; height:10px; background:rgba(255,255,255,0.15); border-radius:8px; overflow:hidden; margin:0 12px; }
  .answer-progress-bar { height:100%; border-radius:8px; transition:width 0.1s linear,background 0.3s; }

  .answer-label {
    font-family:'Lalezar',serif; font-size:20px; color:rgba(255,255,255,0.95); text-align:center;
  }

  .answer-input {
    width:100%; padding:14px 16px; font-family:'Cairo',sans-serif; font-size:20px; font-weight:700;
    border:3px solid rgba(255,255,255,0.3); border-radius:14px;
    background:rgba(255,255,255,0.12); color:#fff; text-align:center;
    direction:rtl; outline:none; transition:border-color 0.2s,background 0.2s;
  }
  .answer-input:focus { border-color:rgba(255,255,255,0.7); background:rgba(255,255,255,0.18); }
  .answer-input::placeholder { color:rgba(255,255,255,0.4); }

  .answer-submit-btn {
    width:100%; padding:14px 0; font-family:'Lalezar',serif; font-size:22px;
    color:#fff; border:none; border-radius:14px; cursor:pointer;
    transition:filter 0.15s,transform 0.1s;
  }
  .answer-submit-btn:active:not(:disabled) { transform:scale(0.96); }
  .answer-submit-btn:disabled { opacity:0.45; cursor:not-allowed; }

  /* ── RESULT ── */
  .result-box {
    display:flex; flex-direction:column; align-items:center; gap:10px;
    text-align:center; animation:resultPop 0.4s cubic-bezier(.22,1,.36,1);
  }
  @keyframes resultPop { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
`;

function injectJoinCSS() {
  const id = 'huruf-join-css';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = JOIN_CSS;
  document.head.appendChild(s);
}

type AnswerResult = { correct: boolean; correctAnswer?: string } | null;

export const HurufJoin = () => {
  injectJoinCSS();

  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') ?? '';
  const team = (searchParams.get('team') as Team) || 'green';

  const [status, setStatus]           = useState<ViewState>('DISCONNECTED');
  const [timer, setTimer]             = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [myTurn, setMyTurn]           = useState(false);
  const [answer, setAnswer]           = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [result, setResult]           = useState<AnswerResult>(null);

  const sendRef     = useRef<((e: any) => void) | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStart  = useRef(0);
  const inputRef    = useRef<HTMLInputElement | null>(null);

  const startTimer = (forTeam: Team) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerStart.current = Date.now();
    const isMe = forTeam === team;
    setTimer(TIMER_DURATION);
    setTimerActive(true);
    setMyTurn(isMe);
    setSubmitted(false);
    setResult(null);
    setAnswer('');

    if (isMe) setTimeout(() => inputRef.current?.focus(), 150);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - timerStart.current) / 1000;
      const remaining = Math.max(0, TIMER_DURATION - elapsed);
      setTimer(Math.ceil(remaining));
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setTimerActive(false);
        setMyTurn(false);
        sendRef.current?.({ type: 'TIMER_EXPIRED', team: forTeam });
      }
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    setMyTurn(false);
    setTimer(0);
    setAnswer('');
    setSubmitted(false);
    setResult(null);
  };

  const handleSubmit = () => {
    if (!answer.trim() || submitted) return;
    setSubmitted(true);
    sendRef.current?.({ type: 'SUBMIT_ANSWER', team, answer: answer.trim() });
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
          setMyTurn(true);   // show input immediately
          setTimeout(() => inputRef.current?.focus(), 80);
        } else {
          setStatus('OTHER_TEAM_BUZZED');
          stopTimer();
        }
      }
      if (event.type === 'TIMER_START') startTimer(event.team);
      if (event.type === 'BUZZ_RESET' || event.type === 'TIMER_EXPIRED_SERVER') {
        setStatus('READY');
        stopTimer();
      }
      if ((event as any).type === 'ANSWER_RESULT' && (event as any).team === team) {
        const e = event as any;
        setResult({ correct: e.correct, correctAnswer: e.correctAnswer });
        setTimeout(() => { setResult(null); setSubmitted(false); }, 2500);
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, team]);

  const canBuzz       = status === 'READY';
  const isBuzzing     = status === 'YOU_BUZZED';
  const isOtherBuzz   = status === 'OTHER_TEAM_BUZZED';
  const accentColor   = team === 'green' ? GREEN : ORANGE;
  const accentDark    = team === 'green' ? GREEN_DARK : ORANGE_DARK;
  const timerProgress = timer / TIMER_DURATION;
  const progressColor = timerProgress > 0.5 ? accentColor : timerProgress > 0.25 ? '#E08C36' : '#ff5555';
  const themeClass    = isBuzzing
    ? `buzzing-${team === 'green' ? 'green' : 'orange'}`
    : `${team === 'green' ? 'green' : 'orange'}-theme`;

  const teamLabel      = team === 'green' ? 'الفريق الأخضر'    : 'الفريق البرتقالي';
  const otherTeamLabel = team === 'green' ? 'الفريق البرتقالي' : 'الفريق الأخضر';
  const otherEmoji     = team === 'green' ? '🟠' : '🟢';
  const myEmoji        = team === 'green' ? '🟢' : '🟠';

  return (
    <div className={`join-root ${themeClass}`}>
      <div className="team-badge">{myEmoji} {teamLabel}</div>

      {status === 'DISCONNECTED' ? (
        <div style={{ textAlign:'center', color:'rgba(255,255,255,0.6)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔄</div>
          <div style={{ fontFamily:'Lalezar,serif', fontSize:24, color:'rgba(255,255,255,0.7)' }}>
            جاري الاتصال...
          </div>
        </div>

      ) : isOtherBuzz ? (
        <div className="other-buzz">
          <div className="emoji">{otherEmoji}</div>
          <div className="msg">{otherTeamLabel}<br />ضغط الجرس!</div>
          {timerActive && !myTurn && (
            <div className={`timer-display ${timer <= 3 ? 'urgent' : ''}`}>{timer}</div>
          )}
        </div>

      ) : isBuzzing ? (
        /* ── ANSWER INPUT PANEL — appears IMMEDIATELY on buzz ── */
        <div className="answer-panel">
          {result ? (
            <div className="result-box">
              <div style={{ fontSize:60 }}>{result.correct ? '✅' : '❌'}</div>
              <div style={{ fontFamily:'Lalezar,serif', fontSize:28, color:'#fff' }}>
                {result.correct ? 'إجابة صحيحة! 🎉' : 'إجابة خاطئة'}
              </div>
              {!result.correct && result.correctAnswer && (
                <div style={{ fontFamily:'Cairo,sans-serif', fontSize:16, color:'rgba(255,255,255,0.8)' }}>
                  الإجابة الصحيحة:{' '}
                  <b style={{ color:'#ffcc44' }}>{result.correctAnswer}</b>
                </div>
              )}
            </div>
          ) : (
            <>
              {timerActive && myTurn ? (
                <div className="answer-timer-row">
                  <div className={`answer-timer-num ${timer <= 5 ? 'urgent' : ''}`}>{timer}</div>
                  <div className="answer-progress">
                    <div
                      className="answer-progress-bar"
                      style={{ width:`${timerProgress*100}%`, background:progressColor }}
                    />
                  </div>
                  <div style={{ fontFamily:'Lalezar,serif', fontSize:13, color:'rgba(255,255,255,0.55)' }}>ثانية</div>
                </div>
              ) : (
                <div style={{
                  fontFamily:'Lalezar,serif', fontSize:18,
                  color:'rgba(255,255,255,0.6)', letterSpacing:2,
                }}>
                  🔔 ضغطت الجرس!
                </div>
              )}

              <div className="answer-label">✏️ اكتب إجابتك!</div>

              <input
                ref={inputRef}
                className="answer-input"
                type="text"
                placeholder="الإجابة هنا..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                disabled={submitted}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />

              <button
                className="answer-submit-btn"
                style={{
                  background: submitted
                    ? 'rgba(255,255,255,0.15)'
                    : `linear-gradient(135deg,${accentColor},${accentDark})`,
                }}
                onClick={handleSubmit}
                disabled={submitted || !answer.trim()}
              >
                {submitted ? '⏳ جاري التحقق...' : '✓ إرسال الإجابة'}
              </button>
            </>
          )}
        </div>

      ) : (
        /* ── BUZZ BUTTON ── */
        <div style={{ position:'relative', display:'inline-block' }}>
          <button
            disabled={!canBuzz}
            onClick={() => sendRef.current?.({ type:'BUZZ_REQUEST', team })}
            className={`buzz-btn ${team === 'green' ? 'green-btn' : 'orange-btn'}`}
          >
            <span style={{ position:'relative', zIndex:1 }}>🔔</span>
          </button>
        </div>
      )}

      <div className="status-text">
        {canBuzz     && 'اضغط للإجابة!'}
        {isBuzzing   && !result && (timerActive ? `${timer}s` : '')}
        {isOtherBuzz && `${otherTeamLabel} يجاوب`}
      </div>
    </div>
  );
};

export default HurufJoin;

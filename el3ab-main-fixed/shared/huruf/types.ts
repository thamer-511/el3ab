export type Team = 'green' | 'red';
export type SessionStatus = 'lobby' | 'playing' | 'ended';
export type BuzzStage = 'first' | 'other';
export type AttemptNo = 1 | 2;
export type ClientRole = 'main' | 'mobile';

export interface HurufCell {
  id: string;
  letter: string;
  owner: Team | null;
  closed: boolean;
  neighbors: string[];
}

export interface HurufQuestion {
  id: string;
  letter: string;
  prompt: string;
  answer: string;
}

export interface BuzzerState {
  locked: boolean;
  lockedBy: Team | null;
  timerStart: number | null;
}

export interface HurufSessionState {
  sessionId: string;
  status: SessionStatus;
  board: HurufCell[];
  currentTeamTurn: Team;
  activeCellId: string | null;
  activeQuestion: HurufQuestion | null;
  buzzer: BuzzerState;
  attemptNo: AttemptNo;
  stage: BuzzStage;
  winner: Team | null;
  matchWins: { green: number; red: number };
  autoJudge: boolean;
  updatedAt: number;
}

export type HurufClientEvent =
  | { type: 'JOIN'; role: ClientRole; team?: Team }
  | { type: 'BUZZ_REQUEST'; team: Team }
  | { type: 'SUBMIT_ANSWER'; team: Team; answer: string }  // ✅ ADDED
  | { type: 'MAIN_START_GAME' }
  | { type: 'MAIN_SELECT_CELL'; cellId: string }
  | { type: 'MAIN_MARK_CORRECT' }
  | { type: 'MAIN_MARK_WRONG' }
  | { type: 'MAIN_NEW_QUESTION' }
  | { type: 'MAIN_RESET_BUZZER' }
  | { type: 'MAIN_TOGGLE_AUTO_JUDGE' }
  | { type: 'TIMER_EXPIRED'; team: Team }
  | { type: 'PING' };

export type HurufServerEvent =
  | { type: 'SESSION_STATE'; state: HurufSessionState }
  | { type: 'BUZZ_LOCKED'; team: Team }
  | { type: 'BUZZ_RESET' }
  | { type: 'QUESTION_CHANGED'; cellId: string; question: HurufQuestion }
  | { type: 'CELL_OWNED'; cellId: string; team: Team }
  | { type: 'GAME_ENDED'; winner: Team }
  | { type: 'TIMER_START'; team: Team; durationMs: number }
  | { type: 'TIMER_EXPIRED_SERVER'; nextTeam: Team | null }
  | { type: 'ANSWER_RESULT'; team: Team; answer: string; correct: boolean; correctAnswer: string }
  | { type: 'ERROR'; message: string };

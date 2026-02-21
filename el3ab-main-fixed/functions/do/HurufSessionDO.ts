import type {
  HurufCell,
  HurufClientEvent,
  HurufQuestion,
  HurufServerEvent,
  HurufSessionState,
  Team,
} from '../../shared/huruf/types';
import questionBank from '../../shared/huruf/questions_ar.json';

type SocketMeta = { role: 'main' | 'mobile'; team?: Team };

const GRID_SIZE = 5;
const TIMER_DURATION_MS = 15000;

const ALL_LETTERS = Object.keys(questionBank as Record<string, HurufQuestion[]>);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class HurufSessionDO {
  private readonly sockets = new Map<WebSocket, SocketMeta>();
  private state: HurufSessionState;
  private readonly usedQuestionsByCell = new Map<string, string[]>();
  private timerHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly stateStore: DurableObjectState) {
    this.state = this.buildInitialState();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/init') && request.method === 'POST') {
      const initPayload = (await request.json().catch(() => ({}))) as {
        matchWins?: { green?: number; red?: number };
      };
      await this.restoreOrInit(initPayload.matchWins);
      return new Response(
        JSON.stringify({ ok: true, sessionId: this.state.sessionId }),
        { headers: { 'content-type': 'application/json' } }
      );
    }

    if (request.headers.get('Upgrade') === 'websocket') {
      await this.restoreOrInit();
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.acceptSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not found', { status: 404 });
  }

  private buildInitialState(sessionId = this.stateStore.id.toString()): HurufSessionState {
    const board = this.generateBoard();
    return {
      sessionId,
      status: 'lobby',
      board,
      currentTeamTurn: 'green',
      activeCellId: null,
      activeQuestion: null,
      buzzer: { locked: false, lockedBy: null, timerStart: null },
      attemptNo: 1,
      stage: 'first',
      winner: null,
      matchWins: { green: 0, red: 0 },
      autoJudge: true,
      updatedAt: Date.now(),
    };
  }

  private async restoreOrInit(initialWins?: { green?: number; red?: number }) {
    const saved = await this.stateStore.storage.get<HurufSessionState>('session_state');
    if (saved) {
      this.state = {
        ...saved,
        matchWins: saved.matchWins ?? { green: 0, red: 0 },
        autoJudge: saved.autoJudge ?? true,
      };
      if (!saved.matchWins) await this.persistState();
      return;
    }
    this.state = this.buildInitialState();
    if (initialWins) {
      this.state.matchWins = {
        green: Number(initialWins.green ?? 0),
        red: Number(initialWins.red ?? 0),
      };
    }
    await this.persistState();
  }

  private acceptSocket(socket: WebSocket) {
    socket.accept();
    this.sockets.set(socket, { role: 'main' });
    socket.send(JSON.stringify({ type: 'SESSION_STATE', state: this.state } satisfies HurufServerEvent));

    socket.addEventListener('message', async (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as HurufClientEvent;
        await this.handleEvent(socket, payload);
      } catch {
        socket.send(JSON.stringify({ type: 'ERROR', message: 'Malformed event payload' } satisfies HurufServerEvent));
      }
    });

    socket.addEventListener('close', () => { this.sockets.delete(socket); });
  }

  private async handleEvent(socket: WebSocket, event: HurufClientEvent) {
    switch (event.type) {
      case 'JOIN':                   this.handleJoin(socket, event); return;
      case 'BUZZ_REQUEST':           await this.handleBuzzRequest(event.team); return;
      case 'MAIN_START_GAME':        await this.startGame(); return;
      case 'MAIN_SELECT_CELL':       await this.selectCell(event.cellId); return;
      case 'MAIN_MARK_WRONG':        await this.markWrong(); return;
      case 'MAIN_MARK_CORRECT':      await this.markCorrect(); return;
      case 'SUBMIT_ANSWER':          await this.handleSubmitAnswer(event.team, event.answer); return;
      case 'MAIN_RESET_BUZZER':      await this.resetBuzzer(); return;
      case 'MAIN_NEW_QUESTION':      await this.newQuestion(); return;
      case 'MAIN_TOGGLE_AUTO_JUDGE': await this.toggleAutoJudge(); return;
      case 'TIMER_EXPIRED':          await this.handleTimerExpired(event.team); return;
      case 'PING':
        socket.send(JSON.stringify({ type: 'SESSION_STATE', state: this.state } satisfies HurufServerEvent));
        return;
      default: return;
    }
  }

  private handleJoin(socket: WebSocket, event: Extract<HurufClientEvent, { type: 'JOIN' }>) {
    if (event.role === 'mobile' && event.team) {
      for (const [peer, meta] of this.sockets.entries()) {
        if (peer !== socket && meta.role === 'mobile' && meta.team === event.team) {
          peer.send(JSON.stringify({ type: 'ERROR', message: 'تم استبدال هذا الجهاز.' } satisfies HurufServerEvent));
          peer.close(4001, 'Replaced');
          this.sockets.delete(peer);
        }
      }
    }
    this.sockets.set(socket, { role: event.role, team: event.team });
    socket.send(JSON.stringify({ type: 'SESSION_STATE', state: this.state } satisfies HurufServerEvent));
  }

  private async startGame() {
    this.clearTimer();
    this.usedQuestionsByCell.clear();

    const previousWins = {
      green: this.state.matchWins?.green ?? 0,
      red:   this.state.matchWins?.red   ?? 0,
    };

    const freshBoard = this.generateBoard();
    const randomCell = freshBoard[Math.floor(Math.random() * freshBoard.length)] ?? null;

    this.state = {
      sessionId:       this.state.sessionId,
      status:          'playing',
      board:           freshBoard,
      currentTeamTurn: 'green',
      activeCellId:    randomCell?.id ?? null,
      activeQuestion:  randomCell ? this.pickQuestionFromBoard(freshBoard, randomCell.id) : null,
      buzzer:          { locked: false, lockedBy: null, timerStart: null },
      attemptNo:       1,
      stage:           'first',
      winner:          null,
      matchWins:       previousWins,
      autoJudge:       this.state.autoJudge ?? true,
      updatedAt:       Date.now(),
    };

    await this.persistState();
    this.broadcastState();
  }

  private async selectCell(cellId: string) {
    if (this.state.status !== 'playing') return;
    const cell = this.state.board.find((c) => c.id === cellId);
    if (!cell || cell.closed) return;
    if (this.state.activeCellId && this.state.activeCellId !== cellId) return;

    this.state.activeCellId = cellId;
    this.state.attemptNo = 1;
    this.state.stage = 'first';
    this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };

    const question = this.pickQuestion(cellId);
    if (question) {
      this.state.activeQuestion = question;
      this.broadcast({ type: 'QUESTION_CHANGED', cellId, question });
    }

    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcastState();
  }

  private async newQuestion() {
    if (!this.state.activeCellId) return;
    const question = this.pickQuestion(this.state.activeCellId);
    if (!question) return;

    this.state.activeQuestion = question;
    this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcast({ type: 'QUESTION_CHANGED', cellId: this.state.activeCellId, question });
    this.broadcastState();
  }

  private async resetBuzzer() {
    this.clearTimer();
    this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcast({ type: 'BUZZ_RESET' });
    this.broadcastState();
  }

  private async handleBuzzRequest(team: Team) {
    if (this.state.status !== 'playing') return;
    if (this.state.buzzer.locked) return;

    const now = Date.now();
    this.state.buzzer = { locked: true, lockedBy: team, timerStart: now };
    this.state.updatedAt = now;
    await this.persistState();
    this.broadcast({ type: 'BUZZ_LOCKED', team });
    this.broadcast({ type: 'TIMER_START', team, durationMs: TIMER_DURATION_MS });
    this.broadcastState();

    this.clearTimer();
    this.timerHandle = setTimeout(async () => {
      await this.handleTimerExpired(team);
    }, TIMER_DURATION_MS + 1000);
  }

  private async handleTimerExpired(team: Team) {
    if (!this.state.buzzer.locked || this.state.buzzer.lockedBy !== team) return;
    this.clearTimer();

    if (this.state.stage === 'first') {
      const otherTeam: Team = team === 'green' ? 'red' : 'green';
      this.state.stage = 'other';
      this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
      this.state.updatedAt = Date.now();
      await this.persistState();
      this.broadcast({ type: 'TIMER_EXPIRED_SERVER', nextTeam: otherTeam });
      this.broadcastState();
    } else {
      this.state.stage = 'first';
      this.state.activeCellId = null;
      this.state.activeQuestion = null;
      this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
      this.state.currentTeamTurn = team === 'green' ? 'red' : 'green';
      this.state.updatedAt = Date.now();
      await this.persistState();
      this.broadcast({ type: 'TIMER_EXPIRED_SERVER', nextTeam: null });
      this.broadcastState();
    }
  }

  /** Mobile auto-submit: server fuzzy-checks the answer */
  private async handleSubmitAnswer(team: Team, answer: string) {
    if (!this.state.buzzer.locked || this.state.buzzer.lockedBy !== team) return;

    // Always respond — never silently drop
    if (!this.state.activeQuestion) {
      this.broadcast({
        type: 'ANSWER_RESULT',
        team,
        answer,
        correct: false,
        correctAnswer: '—',
      });
      return;
    }

    const correct = this.isAnswerCorrect(answer, this.state.activeQuestion.answer);

    this.broadcast({
      type: 'ANSWER_RESULT',
      team,
      answer,
      correct,
      correctAnswer: this.state.activeQuestion.answer,
    });

    if (this.state.autoJudge) {
      if (correct) {
        await this.markCorrect();
      } else {
        await this.markWrong();
      }
    }
  }

  private async toggleAutoJudge() {
    this.state.autoJudge = !this.state.autoJudge;
    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcastState();
  }

  private async markWrong() {
    if (!this.state.activeCellId) return;
    this.clearTimer();

    if (this.state.stage === 'first') {
      this.state.stage = 'other';
      this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
    } else {
      this.state.stage = 'first';
      this.state.activeCellId = null;
      this.state.activeQuestion = null;
      this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
      this.state.currentTeamTurn = this.state.currentTeamTurn === 'green' ? 'red' : 'green';
    }

    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcastState();
  }

  private async markCorrect() {
    const team = this.state.buzzer.lockedBy;
    const activeCellId = this.state.activeCellId;
    if (!team || !activeCellId) return;

    this.clearTimer();

    const cell = this.state.board.find((c) => c.id === activeCellId);
    if (!cell || cell.closed) return;

    cell.owner = team;
    cell.closed = true;
    this.broadcast({ type: 'CELL_OWNED', cellId: cell.id, team });

    const won = this.checkWin(team);
    if (won) {
      this.state.matchWins = {
        green: (this.state.matchWins?.green ?? 0) + (team === 'green' ? 1 : 0),
        red:   (this.state.matchWins?.red   ?? 0) + (team === 'red'   ? 1 : 0),
      };
      this.state.status = 'ended';
      this.state.winner = team;
      this.broadcast({ type: 'GAME_ENDED', winner: team });
    }

    this.state.currentTeamTurn = team;
    this.state.activeCellId = null;
    this.state.activeQuestion = null;
    this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
    this.state.attemptNo = 1;
    this.state.stage = 'first';
    this.state.updatedAt = Date.now();

    await this.persistState();
    this.broadcastState();
  }

  // ── FUZZY ARABIC MATCHING ──────────────────

  private normalizeArabic(text: string): string {
    return text
      .trim()
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
      .replace(/\u0629/g, '\u0647')
      .replace(/\u0649/g, '\u064A')
      .replace(/\u0640/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private isAnswerCorrect(submitted: string, correct: string): boolean {
    const a = this.normalizeArabic(submitted);
    const b = this.normalizeArabic(correct);

    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;

    const maxDist = Math.max(1, Math.floor(b.length * 0.3));
    if (this.levenshtein(a, b) <= maxDist) return true;

    const wordsA = a.split(' ').filter(Boolean);
    const wordsB = b.split(' ').filter(Boolean);
    if (wordsB.length >= 2) {
      const matched = wordsB.filter(w => wordsA.some(wa => wa === w || this.levenshtein(wa, w) <= 1));
      if (matched.length / wordsB.length >= 0.6) return true;
    }

    return false;
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
  }

  // ── BOARD CREATION ─────────────────────────

  private generateBoard(): HurufCell[] {
    const totalCells = GRID_SIZE * GRID_SIZE;

    let letters: string[];
    if (ALL_LETTERS.length >= totalCells) {
      letters = shuffle(ALL_LETTERS).slice(0, totalCells);
    } else {
      letters = [...ALL_LETTERS];
      const extra = shuffle(ALL_LETTERS);
      let i = 0;
      while (letters.length < totalCells) letters.push(extra[i++ % extra.length]);
    }
    letters = shuffle(letters);

    const cells: HurufCell[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        cells.push({
          id: `${row}-${col}`,
          letter: letters[row * GRID_SIZE + col],
          owner: null,
          closed: false,
          neighbors: [],
        });
      }
    }

    const offsetsEven = [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]];
    const offsetsOdd  = [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = cells[row * GRID_SIZE + col];
        const offsets = row % 2 === 0 ? offsetsEven : offsetsOdd;
        cell.neighbors = offsets
          .map(([dr, dc]) => [row + dr, col + dc] as const)
          .filter(([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE)
          .map(([r, c]) => `${r}-${c}`);
      }
    }

    return cells;
  }

  // ── WIN DETECTION ──────────────────────────

  private checkWin(team: Team): boolean {
    const owned = new Map(this.state.board.map((c) => [c.id, c.owner]));
    const queue: string[] = [];
    const visited = new Set<string>();

    for (const cell of this.state.board) {
      if (owned.get(cell.id) !== team) continue;
      const [row, col] = cell.id.split('-').map(Number);
      const isStart = team === 'green' ? row === 0 : col === 0;
      if (isStart) { queue.push(cell.id); visited.add(cell.id); }
    }

    while (queue.length) {
      const id = queue.shift()!;
      const [row, col] = id.split('-').map(Number);
      const reached = team === 'green' ? row === GRID_SIZE - 1 : col === GRID_SIZE - 1;
      if (reached) return true;

      const cell = this.state.board.find((c) => c.id === id);
      if (!cell) continue;
      for (const neighbor of cell.neighbors) {
        if (visited.has(neighbor) || owned.get(neighbor) !== team) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    return false;
  }

  // ── QUESTION PICKING ───────────────────────

  private pickQuestionFromBoard(board: HurufCell[], cellId: string): HurufQuestion | null {
    const cell = board.find((c) => c.id === cellId);
    if (!cell) return null;

    const all = (questionBank as Record<string, Array<{ id: string; prompt: string; answer: string }>>)[cell.letter] ?? [];
    if (!all.length) return null;

    const used = this.usedQuestionsByCell.get(cellId) ?? [];
    let candidates = all.filter((q) => !used.includes(q.id));
    if (!candidates.length) { this.usedQuestionsByCell.set(cellId, []); candidates = [...all]; }

    const next = candidates[Math.floor(Math.random() * candidates.length)];
    this.usedQuestionsByCell.set(cellId, [...used, next.id]);
    return { ...next, letter: cell.letter };
  }

  private pickQuestion(cellId: string): HurufQuestion | null {
    return this.pickQuestionFromBoard(this.state.board, cellId);
  }

  // ── STORAGE & BROADCAST ────────────────────

  private clearTimer() {
    if (this.timerHandle !== null) { clearTimeout(this.timerHandle); this.timerHandle = null; }
  }

  private async persistState() {
    await this.stateStore.storage.put('session_state', this.state);
  }

  private broadcastState() {
    this.broadcast({ type: 'SESSION_STATE', state: this.state });
  }

  private broadcast(event: HurufServerEvent) {
    const msg = JSON.stringify(event);
    for (const socket of this.sockets.keys()) {
      try { socket.send(msg); } catch { /* ignore */ }
    }
  }
}

export default HurufSessionDO;

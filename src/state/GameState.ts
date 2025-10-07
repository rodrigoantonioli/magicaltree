export interface HighScoreEntry {
  name: string;
  score: number;
  stage: number;
  timestamp: number;
}

class GameState {
  private static readonly STORAGE_KEY = 'magicaltree:highscores';

  private readonly maxLives = 3;

  private readonly maxContinues = 3;

  private lives = this.maxLives;

  private continues = this.maxContinues;

  private stage = 1;

  private score = 0;

  private maxStageReached = 1;

  private highScores: HighScoreEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  startNewGame(startStage = 1): void {
    this.lives = this.maxLives;
    this.continues = this.maxContinues;
    this.stage = Math.max(1, Math.floor(startStage));
    this.score = 0;
    this.maxStageReached = Math.max(this.maxStageReached, this.stage);
  }

  resetProgress(): void {
    this.startNewGame(1);
  }

  getLives(): number {
    return this.lives;
  }

  getMaxLives(): number {
    return this.maxLives;
  }

  getContinues(): number {
    return this.continues;
  }

  getMaxContinues(): number {
    return this.maxContinues;
  }

  getStage(): number {
    return this.stage;
  }

  setStage(stage: number): void {
    this.stage = Math.max(1, Math.floor(stage));
    this.maxStageReached = Math.max(this.maxStageReached, this.stage);
  }

  getScore(): number {
    return this.score;
  }

  setScore(score: number): void {
    this.score = Math.max(0, Math.floor(score));
  }

  addScore(amount: number): number {
    this.score = Math.max(0, this.score + Math.floor(amount));
    return this.score;
  }

  loseLife(): number {
    if (this.lives > 0) {
      this.lives -= 1;
    }
    return this.lives;
  }

  restoreLives(): void {
    this.lives = this.maxLives;
  }

  tryContinue(): boolean {
    if (this.continues <= 0) {
      return false;
    }
    this.continues -= 1;
    this.restoreLives();
    return true;
  }

  recordStageClear(nextStage?: number): void {
    if (typeof nextStage === 'number') {
      this.stage = Math.max(1, Math.floor(nextStage));
    } else {
      this.stage += 1;
    }
    this.maxStageReached = Math.max(this.maxStageReached, this.stage);
  }

  getMaxStageReached(): number {
    return this.maxStageReached;
  }

  updateMaxStage(stage: number): void {
    this.maxStageReached = Math.max(this.maxStageReached, stage);
  }

  getHighScores(): HighScoreEntry[] {
    return [...this.highScores];
  }

  submitScore(name: string): void {
    const cleaned = name.replace(/[^A-Za-z0-9À-ÿ\s]/g, '').trim();
    const finalName = (cleaned || 'ANÔNIMO').toUpperCase().slice(0, 8);
    const entry: HighScoreEntry = {
      name: finalName,
      score: this.score,
      stage: Math.max(1, this.stage - 1),
      timestamp: Date.now()
    };
    this.highScores.push(entry);
    this.highScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.stage !== a.stage) {
        return b.stage - a.stage;
      }
      return a.timestamp - b.timestamp;
    });
    this.highScores = this.highScores.slice(0, 10);
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined') {
        this.highScores = [];
        return;
      }
      const raw = window.localStorage.getItem(GameState.STORAGE_KEY);
      if (!raw) {
        this.highScores = [];
        return;
      }
      const parsed = JSON.parse(raw) as HighScoreEntry[];
      if (Array.isArray(parsed)) {
        this.highScores = parsed
          .filter((entry) => typeof entry.score === 'number' && typeof entry.name === 'string')
          .map((entry) => ({
            name: entry.name.slice(0, 8),
            score: Math.max(0, Math.floor(entry.score)),
            stage: Math.max(1, Math.floor(entry.stage)),
            timestamp: entry.timestamp ?? Date.now()
          }));
      }
    } catch (error) {
      console.warn('Não foi possível carregar placar:', error);
      this.highScores = [];
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.setItem(GameState.STORAGE_KEY, JSON.stringify(this.highScores));
    } catch (error) {
      console.warn('Não foi possível salvar placar:', error);
    }
  }
}

const gameState = new GameState();

export default gameState;

import Phaser from 'phaser';

type Outcome = 'victory' | 'gameover';

interface ScoreData {
  outcome: Outcome;
  score: number;
  stage: number;
  nextStage?: number;
}

export default class ScoreScene extends Phaser.Scene {
  private jingle?: Phaser.Sound.BaseSound;

  constructor() {
    super('score');
  }

  create(data: ScoreData = { outcome: 'gameover', score: 0, stage: 1 }): void {
    const payload: ScoreData = {
      outcome: data.outcome,
      score: data.score,
      stage: data.stage,
      nextStage: data.nextStage
    };
    this.sound.stopAll();

    const bg = this.add.image(0, 0, 'forest-background').setOrigin(0, 0);
    const scaleX = this.scale.width / bg.width;
    const scaleY = this.scale.height / bg.height;
    bg.setScale(Math.max(scaleX, scaleY));

    const title = payload.outcome === 'victory' ? 'FASE CONCLUIDA!' : 'FIM DE JOGO';
    const subtitle = payload.outcome === 'victory' ? 'A GRANDE MACIEIRA FOI ALCANCADA!' : 'DESCANSE E TENTE DE NOVO!';
    const prompt =
      payload.outcome === 'victory'
        ? 'APERTE ESPACO PARA PROXIMA FASE'
        : 'APERTE ESPACO PARA VOLTAR AO TITULO';

    this.add
      .text(this.scale.width / 2, 48, title, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#fef4bc',
        stroke: '#1c0f2a',
        strokeThickness: 6
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(this.scale.width / 2, 96, subtitle, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: this.scale.width - 32 }
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(this.scale.width / 2, 150, `FASE ${payload.stage.toString().padStart(2, '0')}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#f8e1a8'
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(this.scale.width / 2, 178, `PONTOS ${payload.score.toString().padStart(7, '0')}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#f8e1a8'
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(this.scale.width / 2, this.scale.height - 36, prompt, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#fef4bc'
      })
      .setOrigin(0.5, 0.5);

    const key = payload.outcome === 'victory' ? 'music-victory' : 'music-gameover';
    this.jingle = this.sound.add(key, { loop: false, volume: 0.35 });
    this.jingle.play();

    this.input.keyboard.once('keydown-SPACE', () => this.handleContinue(payload));
    this.input.keyboard.once('keydown-ENTER', () => this.handleContinue(payload));
    this.input.once('pointerdown', () => this.handleContinue(payload));
  }

  private handleContinue(data: ScoreData): void {
    this.jingle?.stop();
    this.jingle?.destroy();
    if (data.outcome === 'victory') {
      this.scene.start('game', {
        stage: data.nextStage ?? data.stage + 1,
        score: data.score
      });
    } else {
      this.scene.start('title');
    }
  }
}

import Phaser from 'phaser';
import gameState from '../state/GameState';

export default class TitleScene extends Phaser.Scene {
  private blinkTween?: Phaser.Tweens.Tween;

  constructor() {
    super('title');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0c1a2a');
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.tileSprite(centerX, centerY, this.scale.width, this.scale.height, 'sky').setAlpha(0.4);
    this.add.image(centerX, this.scale.height - 12, 'trunk').setScale(4, 1.2).setAlpha(0.12);

    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffe082',
      stroke: '#401000',
      strokeThickness: 6
    };

    const subtitleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#0a1d30',
      strokeThickness: 4
    };

    this.add.text(centerX, 64, 'MAGICAL TREE', titleStyle).setOrigin(0.5, 0.5);
    this.add.text(centerX, 104, 'ESCALADA ENCANTADA', subtitleStyle).setOrigin(0.5, 0.5);

    const prompt = this.add
      .text(centerX, 172, 'APERTE ESPAÇO PARA COMEÇAR', subtitleStyle)
      .setOrigin(0.5, 0.5);

    this.blinkTween = this.tweens.add({
      targets: prompt,
      alpha: { from: 0.15, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    const instructions = this.add
      .text(
        centerX,
        212,
        'SETAS MOVEM • ESPAÇO PULA\nCOLETE FRUTAS E SUBA SEM CAIR!',
        {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '9px',
          color: '#aef78d',
          align: 'center',
          stroke: '#143f24',
          strokeThickness: 3
        }
      )
      .setOrigin(0.5, 0.5);

    instructions.setAlpha(0.9);

    const highScores = gameState.getHighScores();
    const topEntries = highScores.slice(0, 5);
    if (topEntries.length > 0) {
      const scoreLines = topEntries
        .map((entry, index) => {
          const rank = (index + 1).toString().padStart(2, '0');
          return `${rank} ${entry.name.padEnd(8, ' ')} ${entry.score.toString().padStart(7, '0')}`;
        })
        .join('\n');
      this.add
        .text(12, 12, `RANKING\n${scoreLines}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '9px',
          color: '#ffffff',
          stroke: '#001428',
          strokeThickness: 3
        })
        .setOrigin(0, 0)
        .setAlpha(0.85);
    }

    const startGame = () => {
      this.input.keyboard.off('keydown-SPACE', startGame, this);
      this.input.keyboard.off('keydown-ENTER', startGame, this);
      this.input.off('pointerdown', startGame, this);
      gameState.resetProgress();
      this.scene.start('intro', { mode: 'selection' });
    };

    this.input.keyboard.once('keydown-SPACE', startGame, this);
    this.input.keyboard.once('keydown-ENTER', startGame, this);
    this.input.once('pointerdown', startGame, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.blinkTween?.stop();
    });
  }
}

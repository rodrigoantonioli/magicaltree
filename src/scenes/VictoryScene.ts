import Phaser from 'phaser';

export default class VictoryScene extends Phaser.Scene {
  private finalScore = 0;

  constructor() {
    super('victory');
  }

  init(data: { score?: number } = {}): void {
    this.finalScore = data.score ?? 0;
  }

  create(): void {
    const background = this.add.rectangle(128, 120, 256, 240, 0x002d1f, 0.92);
    background.setDepth(0);

    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '12px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffe082',
      stroke: '#204010',
      strokeThickness: 4,
      align: 'center'
    };

    const scoreStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      ...titleStyle,
      fontSize: '10px'
    };

    this.add.text(128, 70, 'PARABÉNS!', titleStyle).setOrigin(0.5, 0.5).setDepth(1);

    const formattedScore = this.finalScore.toString().padStart(7, '0');
    this.add.text(128, 120, `PONTOS\n${formattedScore}`, scoreStyle).setOrigin(0.5, 0.5).setDepth(1);

    const prompt = this.add
      .text(128, 170, 'PRESSIONE ESPAÇO\nPARA RECOMEÇAR', {
        ...titleStyle,
        fontSize: '8px'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(1);

    this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        prompt.setVisible(!prompt.visible);
      }
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('game', { stage: 1, score: 0 });
    });
  }
}

import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  private themeMusic?: Phaser.Sound.BaseSound;

  constructor() {
    super('title');
  }

  create(): void {
    this.sound.stopAll();

    const bg = this.add.image(0, 0, 'forest-background').setOrigin(0, 0);
    const scaleX = this.scale.width / bg.width;
    const scaleY = this.scale.height / bg.height;
    bg.setScale(Math.max(scaleX, scaleY));

    this.add
      .text(this.scale.width / 2, 64, 'MAGICAL TREE', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '16px',
        color: '#fef4bc',
        stroke: '#2a143c',
        strokeThickness: 6
      })
      .setOrigin(0.5, 0.5);

    this.add.image(this.scale.width / 2, this.scale.height / 2 + 30, 'goal-banner-msx').setScale(1.2);

    this.add
      .text(this.scale.width / 2, this.scale.height - 72, 'APERTE ESPACO OU CLIQUE PARA SUBIR', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        align: 'center',
        color: '#f4e8c0',
        wordWrap: { width: this.scale.width - 20 }
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(this.scale.width / 2, this.scale.height - 36, 'EVITE PERIGOS, PEGUE FRUTAS E CORRA CONTRA O TEMPO!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        align: 'center',
        color: '#ffffff',
        wordWrap: { width: this.scale.width - 24 }
      })
      .setOrigin(0.5, 0.5);

    this.themeMusic = this.sound.add('music-theme', { loop: true, volume: 0.3 });
    this.themeMusic.play();

    this.input.keyboard.once('keydown-SPACE', () => this.startGame());
    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  private startGame(): void {
    this.themeMusic?.stop();
    this.themeMusic?.destroy();
    this.scene.start('game', { stage: 1, score: 0 });
  }
}

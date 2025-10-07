import Phaser from 'phaser';

import heroSheetBase64 from '../assets/player/hero_spritesheet.base64?raw';
import condorSheetBase64 from '../assets/inimigos/condor_spritesheet.base64?raw';
import coconutBase64 from '../assets/inimigos/coco.base64?raw';
import fruitBase64 from '../assets/frutas/magical_fruit.base64?raw';
import branchBase64 from '../assets/ui/branch_platform.base64?raw';
import trunkBase64 from '../assets/ui/trunk_segment.base64?raw';
import bannerBase64 from '../assets/ui/goal_banner.base64?raw';
import backgroundBase64 from '../assets/ui/forest_background.base64?raw';
import warningLeftBase64 from '../assets/ui/warning_arrow_left.base64?raw';
import warningRightBase64 from '../assets/ui/warning_arrow_right.base64?raw';
import warningDownBase64 from '../assets/ui/warning_arrow_down.base64?raw';
import themeBase64 from '../assets/musicas/tema_principal.base64?raw';
import timerBase64 from '../assets/musicas/contagem_tempo.base64?raw';
import gameOverBase64 from '../assets/musicas/game_over.base64?raw';
import victoryBase64 from '../assets/musicas/vitoria.base64?raw';
import jumpBase64 from '../assets/musicas/efeito_pulo.base64?raw';
import climbBase64 from '../assets/musicas/efeito_subida.base64?raw';
import pickupBase64 from '../assets/musicas/efeito_coleta.base64?raw';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.image('forest-background', `data:image/svg+xml;base64,${backgroundBase64}`);
    this.load.image('trunk-segment', `data:image/svg+xml;base64,${trunkBase64}`);
    this.load.image('branch-platform', `data:image/svg+xml;base64,${branchBase64}`);
    this.load.image('magical-fruit', `data:image/svg+xml;base64,${fruitBase64}`);
    this.load.image('coconut-danger', `data:image/svg+xml;base64,${coconutBase64}`);
    this.load.image('goal-banner-msx', `data:image/svg+xml;base64,${bannerBase64}`);
    this.load.image('warning-arrow-left', `data:image/svg+xml;base64,${warningLeftBase64}`);
    this.load.image('warning-arrow-right', `data:image/svg+xml;base64,${warningRightBase64}`);
    this.load.image('warning-arrow-down', `data:image/svg+xml;base64,${warningDownBase64}`);

    this.load.spritesheet('player-hero', `data:image/svg+xml;base64,${heroSheetBase64}` as string, {
      frameWidth: 16,
      frameHeight: 24
    });
    this.load.spritesheet('condor-enemy', `data:image/svg+xml;base64,${condorSheetBase64}` as string, {
      frameWidth: 20,
      frameHeight: 16
    });

    this.load.audio('music-theme', [`data:audio/wav;base64,${themeBase64}`]);
    this.load.audio('music-timer', [`data:audio/wav;base64,${timerBase64}`]);
    this.load.audio('music-gameover', [`data:audio/wav;base64,${gameOverBase64}`]);
    this.load.audio('music-victory', [`data:audio/wav;base64,${victoryBase64}`]);
    this.load.audio('sfx-jump', [`data:audio/wav;base64,${jumpBase64}`]);
    this.load.audio('sfx-climb', [`data:audio/wav;base64,${climbBase64}`]);
    this.load.audio('sfx-pickup', [`data:audio/wav;base64,${pickupBase64}`]);
  }

  create(): void {
    this.createAnimations();
    this.scene.start('title');
  }

  private createAnimations(): void {
    if (!this.anims.exists('player-idle')) {
      this.anims.create({
        key: 'player-idle',
        frames: [{ key: 'player-hero', frame: 0 }],
        frameRate: 1
      });
    }

    if (!this.anims.exists('player-run')) {
      this.anims.create({
        key: 'player-run',
        frames: this.anims.generateFrameNumbers('player-hero', { frames: [0, 1, 2] }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!this.anims.exists('player-climb')) {
      this.anims.create({
        key: 'player-climb',
        frames: this.anims.generateFrameNumbers('player-hero', { frames: [3, 4] }),
        frameRate: 6,
        repeat: -1
      });
    }

    if (!this.anims.exists('player-rise')) {
      this.anims.create({
        key: 'player-rise',
        frames: [{ key: 'player-hero', frame: 5 }],
        frameRate: 1
      });
    }

    if (!this.anims.exists('player-fall')) {
      this.anims.create({
        key: 'player-fall',
        frames: [{ key: 'player-hero', frame: 2 }],
        frameRate: 1
      });
    }

    if (!this.anims.exists('condor-fly')) {
      this.anims.create({
        key: 'condor-fly',
        frames: this.anims.generateFrameNumbers('condor-enemy', { frames: [0, 1, 2, 3] }),
        frameRate: 6,
        repeat: -1
      });
    }
  }
}

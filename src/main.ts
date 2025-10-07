import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import TitleScene from './scenes/TitleScene';
import IntroScene from './scenes/IntroScene';
import ProgressScene from './scenes/ProgressScene';
import ScoreScene from './scenes/ScoreScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0c1a2a',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 256,
    height: 240
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false
    }
  },
  render: {
    antialias: false,
    pixelArt: true
  },
  scene: [BootScene, TitleScene, IntroScene, GameScene, ProgressScene, ScoreScene]
};

export default new Phaser.Game(config);

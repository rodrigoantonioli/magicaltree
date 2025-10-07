import GameScene from '../scenes/GameScene';
import BaseEnemy, { EnemySpawnParams } from './BaseEnemy';
import CoconutProjectile, { CoconutSpawnParams } from './CoconutProjectile';
import CondorEnemy, { CondorSpawnParams } from './CondorEnemy';
import MonkeyEnemy, { MonkeySpawnParams } from './MonkeyEnemy';
import ScorpionEnemy, { ScorpionSpawnParams } from './ScorpionEnemy';
import SnakeEnemy, { SnakeSpawnParams } from './SnakeEnemy';
import VineSpiderEnemy, { SpiderSpawnParams } from './VineSpiderEnemy';

export type EnemyType = 'condor' | 'scorpion' | 'monkey' | 'snake' | 'spider' | 'coconut';

export function createEnemy(scene: GameScene, type: EnemyType, params: EnemySpawnParams): BaseEnemy {
  switch (type) {
    case 'condor':
      return new CondorEnemy(scene, params as CondorSpawnParams);
    case 'scorpion':
      return new ScorpionEnemy(scene, params as ScorpionSpawnParams);
    case 'monkey':
      return new MonkeyEnemy(scene, params as MonkeySpawnParams);
    case 'snake':
      return new SnakeEnemy(scene, params as SnakeSpawnParams);
    case 'spider':
      return new VineSpiderEnemy(scene, params as SpiderSpawnParams);
    case 'coconut':
      return new CoconutProjectile(scene, params as CoconutSpawnParams);
    default:
      throw new Error(`Unknown enemy type: ${type}`);
  }
}

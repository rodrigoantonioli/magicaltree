import Phaser from 'phaser';

export interface PlayerMovementProfile {
  runAcceleration: number;
  runDrag: number;
  airDrag: number;
  jumpVelocity: number;
  climbSpeedUp: number;
  climbSpeedDown: number;
  slideSpeed: number;
  controlledFallSpeed: number;
  maxVelocityX: number;
  maxVelocityY: number;
}

export const basePlayerMovement: PlayerMovementProfile = {
  runAcceleration: 780,
  runDrag: 640,
  airDrag: 120,
  jumpVelocity: -335,
  climbSpeedUp: -60,
  climbSpeedDown: 96,
  slideSpeed: 132,
  controlledFallSpeed: 150,
  maxVelocityX: 120,
  maxVelocityY: 420
};

export function scalePlayerMovement(
  base: PlayerMovementProfile,
  speedBoost: number
): PlayerMovementProfile {
  const clampedBoost = Phaser.Math.Clamp(speedBoost, 0.25, 3);
  return {
    runAcceleration: base.runAcceleration * clampedBoost,
    runDrag: base.runDrag,
    airDrag: base.airDrag,
    jumpVelocity: base.jumpVelocity * clampedBoost,
    climbSpeedUp: base.climbSpeedUp * clampedBoost,
    climbSpeedDown: base.climbSpeedDown * clampedBoost,
    slideSpeed: base.slideSpeed * clampedBoost,
    controlledFallSpeed: base.controlledFallSpeed * clampedBoost,
    maxVelocityX: base.maxVelocityX * clampedBoost,
    maxVelocityY: base.maxVelocityY * clampedBoost
  };
}

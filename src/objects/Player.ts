import Phaser from 'phaser';
import {
  basePlayerMovement,
  PlayerMovementProfile,
  scalePlayerMovement
} from '../config/playerPhysics';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

enum PlayerState {
  Idle = 'idle',
  Run = 'run',
  Jump = 'jump',
  Fall = 'fall',
  Climb = 'climb',
  Slide = 'slide',
  Hang = 'hang',
  Stunned = 'stunned'
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: CursorKeys;

  private jumpKey: Phaser.Input.Keyboard.Key;

  private climbZone?: Phaser.GameObjects.Zone;

  private currentState: PlayerState = PlayerState.Idle;

  private lastOnGroundTime = 0;

  private hangTimer?: Phaser.Time.TimerEvent;

  private hangCooldownUntil = 0;

  private readonly baseMovementProfile: PlayerMovementProfile = basePlayerMovement;

  private movementProfile: PlayerMovementProfile = scalePlayerMovement(basePlayerMovement, 1);

  private readonly controlledFallDuration = 900;

  private readonly hangDuration = 600;

  private readonly hitStunDuration = 420;

  private readonly invulnerabilityDuration = 1600;

  private controlledFallUntil = 0;

  private invulnerableUntil = 0;

  private speedBoost = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.setBounce(0.05);
    this.setSize(10, 18);
    this.setOffset(3, 10);
    this.applyMovementProfile();
    this.setGravityY(760);

    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.anims.play('player-idle');
  }

  setClimbZone(zone: Phaser.GameObjects.Zone): void {
    this.climbZone = zone;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.handleInput();
  }

  isInvulnerable(): boolean {
    return this.invulnerableUntil > this.scene.time.now;
  }

  forceReset(): void {
    this.currentState = PlayerState.Idle;
    this.clearTint();
    this.invulnerableUntil = 0;
    this.controlledFallUntil = 0;
    this.hangTimer?.remove(false);
    this.hangTimer = undefined;
    this.setGravityY(760);
    this.setVelocity(0, 0);
    this.applyMovementProfile();
  }

  takeHit(fromDirection: 'left' | 'right' | 'vertical'): void {
    const now = this.scene.time.now;
    if (this.isInvulnerable()) {
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setMovementState(PlayerState.Stunned);
    this.setTint(0xffd1d1);
    this.invulnerableUntil = now + this.invulnerabilityDuration;
    body.setAllowGravity(true);

    const horizontalKnockback = fromDirection === 'vertical' ? 0 : fromDirection === 'left' ? 80 : -80;
    body.setVelocity(horizontalKnockback, -160);

    this.scene.time.delayedCall(this.hitStunDuration, () => {
      this.clearTint();
      if (body.blocked.down) {
        this.setMovementState(PlayerState.Idle);
      } else {
        this.setMovementState(PlayerState.Fall);
      }
    });

    this.controlledFallUntil = now + this.controlledFallDuration;
  }

  private handleInput(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    const now = this.scene.time.now;

    if (onGround) {
      this.lastOnGroundTime = now;
    }

    this.updateDrag(onGround);

    const wantsLeft = this.cursors.left?.isDown ?? false;
    const wantsRight = this.cursors.right?.isDown ?? false;
    const wantsUp = this.cursors.up?.isDown ?? false;
    const wantsDown = this.cursors.down?.isDown ?? false;
    const wantsJump = this.jumpKey.isDown || wantsUp;

    const overlapWithTrunk = this.checkTrunkOverlap();

    if (this.currentState === PlayerState.Stunned) {
      if (onGround && now > this.invulnerableUntil - this.invulnerabilityDuration + this.hitStunDuration) {
        this.setMovementState(Math.abs(body.velocity.x) > 4 ? PlayerState.Run : PlayerState.Idle);
      } else if (!onGround && body.velocity.y > 0) {
        this.setMovementState(PlayerState.Fall);
      }
      this.updateAnimation();
      return;
    }

    if (this.currentState === PlayerState.Hang) {
      body.setAllowGravity(false);
      body.setVelocity(0, 0);
      if (wantsJump) {
        this.releaseHang(true);
        return;
      }
      if (wantsDown) {
        this.releaseHang(false);
        this.setMovementState(PlayerState.Slide);
        return;
      }
      if (!this.hangTimer || this.hangTimer.getProgress() >= 1) {
        this.releaseHang(false);
      }
      this.updateAnimation();
      return;
    }

    if (this.currentState === PlayerState.Climb) {
      if (!overlapWithTrunk || (!wantsUp && !wantsDown)) {
        this.setMovementState(onGround ? PlayerState.Idle : PlayerState.Fall);
        body.setAllowGravity(true);
      } else {
        body.setAllowGravity(false);
        if (wantsUp) {
          body.setVelocity(0, this.movementProfile.climbSpeedUp);
        } else if (wantsDown) {
          body.setVelocity(0, this.movementProfile.climbSpeedDown);
        } else {
          body.setVelocity(0, 0);
        }
        this.updateAnimation();
        return;
      }
    }

    if (overlapWithTrunk && wantsDown && !onGround && body.velocity.y >= 0) {
      this.setMovementState(PlayerState.Slide);
    }

    if (this.currentState === PlayerState.Slide) {
      if (!overlapWithTrunk || (!wantsDown && now > this.controlledFallUntil)) {
        this.setMovementState(PlayerState.Fall);
      } else {
        body.setAllowGravity(false);
        body.setVelocity(0, this.movementProfile.slideSpeed);
        this.updateAnimation();
        return;
      }
    }

    if (
      !onGround &&
      overlapWithTrunk &&
      wantsUp &&
      now > this.hangCooldownUntil &&
      body.velocity.y > 80
    ) {
      this.beginHang();
      return;
    }

    body.setAllowGravity(true);

    if (onGround && wantsJump) {
      body.setVelocityY(this.movementProfile.jumpVelocity);
      this.setMovementState(PlayerState.Jump);
    }

    const canMoveHorizontally =
      this.currentState === PlayerState.Idle ||
      this.currentState === PlayerState.Run ||
      this.currentState === PlayerState.Jump ||
      this.currentState === PlayerState.Fall;

    if (canMoveHorizontally) {
      const direction = (wantsRight ? 1 : 0) - (wantsLeft ? 1 : 0);
      if (direction !== 0) {
        body.setAccelerationX(direction * this.movementProfile.runAcceleration);
        this.setFlipX(direction < 0);
      } else {
        body.setAccelerationX(0);
      }
    } else {
      body.setAccelerationX(0);
    }

    if (!onGround && now < this.controlledFallUntil) {
      body.setVelocityY(
        Math.max(body.velocity.y, this.movementProfile.controlledFallSpeed)
      );
    }

    this.refreshStateFromPhysics(onGround, body.velocity.y);
    this.updateAnimation();

    if (overlapWithTrunk && (wantsUp || wantsDown) && !onGround) {
      this.setMovementState(PlayerState.Climb);
      body.setAllowGravity(false);
      body.setVelocityX(0);
      body.setVelocityY(
        wantsUp
          ? this.movementProfile.climbSpeedUp
          : wantsDown
          ? this.movementProfile.climbSpeedDown
          : 0
      );
      this.updateAnimation();
    }
  }

  private beginHang(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    this.setMovementState(PlayerState.Hang);
    this.hangCooldownUntil = this.scene.time.now + 900;
    this.hangTimer?.remove(false);
    this.hangTimer = this.scene.time.delayedCall(this.hangDuration, () => {
      if (this.currentState === PlayerState.Hang) {
        this.releaseHang(false);
      }
    });
  }

  private releaseHang(jump: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    if (jump) {
      body.setVelocityY(this.movementProfile.jumpVelocity * 0.85);
      this.setMovementState(PlayerState.Jump);
    } else {
      this.setMovementState(PlayerState.Fall);
    }
  }

  private applyMovementProfile(): void {
    this.movementProfile = scalePlayerMovement(this.baseMovementProfile, this.speedBoost);
    this.setMaxVelocity(
      this.movementProfile.maxVelocityX,
      this.movementProfile.maxVelocityY
    );
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.setDragX(this.movementProfile.runDrag);
    }
  }

  private refreshStateFromPhysics(onGround: boolean, velocityY: number): void {
    if (this.currentState === PlayerState.Climb || this.currentState === PlayerState.Slide) {
      return;
    }

    if (onGround) {
      this.setMovementState(Math.abs((this.body as Phaser.Physics.Arcade.Body).velocity.x) > 4 ? PlayerState.Run : PlayerState.Idle);
    } else if (velocityY < 0) {
      this.setMovementState(PlayerState.Jump);
    } else {
      this.setMovementState(PlayerState.Fall);
    }
  }

  private updateAnimation(): void {
    switch (this.currentState) {
      case PlayerState.Run:
        this.anims.play('player-run', true);
        break;
      case PlayerState.Jump:
        this.anims.play('player-jump', true);
        break;
      case PlayerState.Fall:
        this.anims.play('player-fall', true);
        break;
      case PlayerState.Climb:
        this.anims.play('player-climb', true);
        break;
      case PlayerState.Slide:
        this.anims.play('player-slide', true);
        break;
      case PlayerState.Hang:
        this.anims.play('player-hang', true);
        break;
      case PlayerState.Stunned:
        this.anims.play('player-hit', true);
        break;
      default:
        this.anims.play('player-idle', true);
        break;
    }
  }

  private setMovementState(state: PlayerState): void {
    if (this.currentState === state) {
      return;
    }
    this.currentState = state;
  }

  private updateDrag(onGround: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setDragX(onGround ? this.movementProfile.runDrag : this.movementProfile.airDrag);
  }

  private checkTrunkOverlap(): boolean {
    if (!this.climbZone) {
      return false;
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    const zoneBounds = this.climbZone.getBounds();
    const playerBounds = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
    return Phaser.Geom.Rectangle.Overlaps(zoneBounds, playerBounds);
  }

  setSpeedBoost(multiplier: number): void {
    this.speedBoost = Phaser.Math.Clamp(multiplier, 0.25, 3);
    this.applyMovementProfile();
  }
}

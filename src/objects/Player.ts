import Phaser from 'phaser';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: CursorKeys;

  private jumpKey: Phaser.Input.Keyboard.Key;

  private isClimbing = false;

  private climbZone?: Phaser.GameObjects.Zone;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.setBounce(0.05);
    this.setSize(10, 18);
    this.setOffset(3, 10);
    this.setDragX(600);
    this.setMaxVelocity(180, 420);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  setClimbZone(zone: Phaser.GameObjects.Zone): void {
    this.climbZone = zone;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.handleInput();
  }

  private handleInput(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    if (this.cursors.left?.isDown) {
      body.setVelocityX(-140);
      this.setFlipX(true);
    } else if (this.cursors.right?.isDown) {
      body.setVelocityX(140);
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    const wantsClimbUp = this.cursors.up?.isDown ?? false;
    const wantsClimbDown = this.cursors.down?.isDown ?? false;
    let overlapWithTrunk = false;
    if (this.climbZone) {
      const zoneBounds = this.climbZone.getBounds();
      const playerBounds = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
      overlapWithTrunk = Phaser.Geom.Rectangle.Overlaps(zoneBounds, playerBounds);
    }

    const wantsClimb = overlapWithTrunk && (wantsClimbUp || wantsClimbDown);

    if (wantsClimb) {
      if (!this.isClimbing) {
        this.setClimbing(true);
      }
      if (wantsClimbUp) {
        body.setVelocityY(-110);
      } else if (wantsClimbDown) {
        body.setVelocityY(150);
      }
      return;
    }

    if (this.isClimbing) {
      this.setClimbing(false);
    }

    if (onGround && (this.cursors.up?.isDown || this.jumpKey.isDown)) {
      body.setVelocityY(-320);
    }
  }

  private setClimbing(enabled: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.isClimbing = enabled;
    if (enabled) {
      body.setAllowGravity(false);
      body.setVelocityX(0);
    } else {
      body.setAllowGravity(true);
    }
  }

  detachFromClimb(impulseX: number, impulseY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.isClimbing) {
      this.setClimbing(false);
    }
    body.setVelocity(impulseX, impulseY);
  }
}

import Phaser from 'phaser';

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: CursorKeys;

  private jumpKey: Phaser.Input.Keyboard.Key;

  private isClimbing = false;

  private climbZone?: Phaser.GameObjects.Zone;

  private jumpSound: Phaser.Sound.BaseSound;

  private climbSound: Phaser.Sound.BaseSound;

  private collectSound: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-hero');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.setBounce(0.05);
    this.setSize(10, 18);
    this.setOffset(3, 6);
    this.setDragX(600);
    this.setMaxVelocity(180, 420);

    this.anims.play('player-idle');

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.jumpSound = scene.sound.add('sfx-jump', { volume: 0.45 });
    this.climbSound = scene.sound.add('sfx-climb', { volume: 0.35 });
    this.collectSound = scene.sound.add('sfx-pickup', { volume: 0.45 });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroySounds());
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroySounds());
  }

  setClimbZone(zone: Phaser.GameObjects.Zone): void {
    this.climbZone = zone;
  }

  playCollectSound(): void {
    this.collectSound.stop();
    this.collectSound.play();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.handleInput();
  }

  private handleInput(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    let movingHorizontally = false;
    if (this.cursors.left?.isDown) {
      body.setVelocityX(-140);
      this.setFlipX(true);
      movingHorizontally = true;
    } else if (this.cursors.right?.isDown) {
      body.setVelocityX(140);
      this.setFlipX(false);
      movingHorizontally = true;
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
        this.climbSound.stop();
        this.climbSound.play();
      }
      if (wantsClimbUp) {
        body.setVelocityY(-110);
      } else if (wantsClimbDown) {
        body.setVelocityY(150);
      } else {
        body.setVelocityY(0);
      }
      this.updateAnimation(onGround, movingHorizontally);
      return;
    }

    if (this.isClimbing) {
      this.setClimbing(false);
    }

    const pressedUp = this.cursors.up ? Phaser.Input.Keyboard.JustDown(this.cursors.up) : false;
    if (onGround && (Phaser.Input.Keyboard.JustDown(this.jumpKey) || pressedUp)) {
      body.setVelocityY(-320);
      this.jumpSound.stop();
      this.jumpSound.play();
    }

    this.updateAnimation(onGround, movingHorizontally);
  }

  private updateAnimation(onGround: boolean, movingHorizontally: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.isClimbing) {
      this.setFlipX(false);
      this.anims.play('player-climb', true);
      return;
    }

    if (!onGround) {
      if (body.velocity.y < 0) {
        this.anims.play('player-rise', true);
      } else {
        this.anims.play('player-fall', true);
      }
      return;
    }

    if (movingHorizontally) {
      this.anims.play('player-run', true);
    } else {
      this.anims.play('player-idle', true);
    }
  }

  private setClimbing(enabled: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.isClimbing = enabled;
    if (enabled) {
      body.setAllowGravity(false);
      body.setVelocityX(0);
      this.setFlipX(false);
    } else {
      body.setAllowGravity(true);
    }
  }

  private destroySounds(): void {
    this.jumpSound.destroy();
    this.climbSound.destroy();
    this.collectSound.destroy();
  }
}

import Phaser from 'phaser';
import gameState from '../state/GameState';

interface IntroData {
  stage?: number;
  skipSelection?: boolean;
  message?: string;
  mode?: 'selection' | 'intro';
}

export default class IntroScene extends Phaser.Scene {
  private stage = 1;

  private selectionMode = false;

  private selectedStage = 1;

  private selectionText?: Phaser.GameObjects.Text;

  private hintText?: Phaser.GameObjects.Text;

  private confirmText?: Phaser.GameObjects.Text;

  private introMessage?: string;

  constructor() {
    super('intro');
  }

  init(data: IntroData): void {
    this.stage = data.stage ?? gameState.getStage();
    this.selectionMode = !(data.skipSelection ?? false) || data.mode === 'selection';
    this.selectedStage = this.stage;
    this.introMessage = data.message;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0c1a2a');
    const centerX = this.scale.width / 2;

    this.add.tileSprite(centerX, this.scale.height / 2, this.scale.width, this.scale.height, 'sky').setAlpha(0.35);

    if (this.selectionMode) {
      this.createSelectionUI();
    } else {
      this.showStageIntro(this.introMessage);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.removeAllListeners();
    });
  }

  private createSelectionUI(): void {
    const centerX = this.scale.width / 2;
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ffe082',
      stroke: '#2b1300',
      strokeThickness: 4
    };

    const infoStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#0a1930',
      strokeThickness: 3
    };

    this.add.text(centerX, 54, 'ESCOLHA A FASE', titleStyle).setOrigin(0.5, 0.5);
    this.selectionText = this.add.text(centerX, 108, '', titleStyle).setOrigin(0.5, 0.5);
    this.hintText = this.add
      .text(centerX, 156, '← → SELECIONAM', infoStyle)
      .setOrigin(0.5, 0.5);
    this.confirmText = this.add
      .text(centerX, 188, 'ESPAÇO PARA COMEÇAR', infoStyle)
      .setOrigin(0.5, 0.5);

    const maxStage = Math.max(1, gameState.getMaxStageReached());
    const updateSelection = () => {
      const label = this.selectedStage.toString().padStart(2, '0');
      this.selectionText?.setText(`FASE ${label}`);
      const history = `MAIOR FASE ${maxStage.toString().padStart(2, '0')}`;
      this.hintText?.setText(`← → SELECIONAM | ${history}`);
    };

    updateSelection();

    const changeSelection = (delta: number) => {
      this.selectedStage = Phaser.Math.Clamp(this.selectedStage + delta, 1, maxStage);
      updateSelection();
    };

    const handleLeft = () => changeSelection(-1);
    const handleRight = () => changeSelection(1);

    this.input.keyboard.on('keydown-LEFT', handleLeft, this);
    this.input.keyboard.on('keydown-RIGHT', handleRight, this);

    const confirm = () => {
      this.input.keyboard.off('keydown-LEFT', handleLeft, this);
      this.input.keyboard.off('keydown-RIGHT', handleRight, this);
      this.input.keyboard.off('keydown-SPACE', confirm, this);
      this.input.keyboard.off('keydown-ENTER', confirm, this);
      this.stage = this.selectedStage;
      gameState.startNewGame(this.stage);
      this.selectionMode = false;
      this.time.delayedCall(180, () => this.showStageIntro('VAMOS SUBIR!'));
    };

    this.input.keyboard.once('keydown-SPACE', confirm, this);
    this.input.keyboard.once('keydown-ENTER', confirm, this);
  }

  private showStageIntro(customMessage?: string): void {
    this.introMessage = undefined;
    const centerX = this.scale.width / 2;
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffe082',
      stroke: '#401000',
      strokeThickness: 5
    };

    const infoStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#0a1930',
      strokeThickness: 3,
      align: 'center'
    };

    const stageLabel = this.stage.toString().padStart(2, '0');
    const message = customMessage ?? this.getStageMessage(this.stage);
    const livesInfo = `VIDAS ${gameState.getLives().toString().padStart(2, '0')}  CONT ${gameState
      .getContinues()
      .toString()
      .padStart(2, '0')}`;

    this.add.text(centerX, 78, `FASE ${stageLabel}`, titleStyle).setOrigin(0.5, 0.5);
    this.add.text(centerX, 126, message, infoStyle).setOrigin(0.5, 0.5);
    this.add
      .text(centerX, 172, livesInfo, infoStyle)
      .setOrigin(0.5, 0.5)
      .setAlpha(0.9);

    gameState.setStage(this.stage);

    this.time.delayedCall(1800, () => {
      this.scene.start('game', { stage: this.stage });
    });
  }

  private getStageMessage(stage: number): string {
    const messages = [
      'BRISAS LEVES NO INÍCIO',
      'VENTOS MUDAM DE LADO',
      'GALHOS MAIS ESPAÇADOS',
      'NEBLINA E RAÍZES LARGAS',
      'FRUTOS RAROS E PERIGOS',
      'CORUJAS OBSERVAM A SUBIDA',
      'TROVÕES AO FUNDO',
      'TOPO BRILHANTE SE APROXIMA'
    ];
    const index = (stage - 1) % messages.length;
    return messages[index];
  }
}

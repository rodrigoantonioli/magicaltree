import Phaser from 'phaser';

export interface StageFruitConfig {
  type: 'regular' | 'golden';
  value: number;
  offsetY?: number;
  texture?: string;
  timeBonus?: number;
}

export interface StageBranchConfig {
  x: number;
  y: number;
  fruit?: StageFruitConfig | null;
}

export interface StageHazardEvent {
  at: number;
  type: 'horizontal' | 'falling';
  fromLeft?: boolean;
  x?: number;
  y?: number;
  speed?: number;
  gravity?: number;
}

export interface LadderConfig {
  x: number;
  top: number;
  bottom: number;
  width?: number;
}

export interface StageCheckpointConfig {
  y: number;
  label?: string;
}

export interface StageFinaleConfig {
  canopyY: number;
  canopyHeight: number;
  stairs?: LadderConfig[];
}

export interface StageItemConfig {
  x: number;
  y: number;
  texture?: string;
  value: number;
  timeBonus?: number;
}

export interface StageDefinition {
  id: number;
  label: string;
  intro: string;
  levelHeight: number;
  goalHeight: number;
  timeLimit: number;
  maxTime: number;
  playerStart: { x: number; y: number };
  layout: StageBranchConfig[];
  hazardDefaults: { horizontalSpeed: number; fallingGravity: number };
  hazardEvents: StageHazardEvent[];
  checkpoints?: StageCheckpointConfig[];
  ladders?: LadderConfig[];
  items?: StageItemConfig[];
  fruitTimeBonus: number;
  climbZoneWidth?: number;
  finale?: StageFinaleConfig;
  nextStage?: number;
  isFinal?: boolean;
}

export const LANE_POSITIONS: Record<string, number> = {
  L: 72,
  ML: 104,
  MR: 152,
  R: 184,
  C: 128
};

const seconds = (value: number): number => value * 1000;

const regularFruit = (): StageFruitConfig => ({
  type: 'regular',
  value: 200,
  offsetY: 20,
  texture: 'fruit',
  timeBonus: 2
});

const goldenFruit = (): StageFruitConfig => ({
  type: 'golden',
  value: 500,
  offsetY: 22,
  texture: 'fruit-golden',
  timeBonus: 4
});

const buildLayout = (
  levelHeight: number,
  goalHeight: number,
  rows: string[],
  options: { spacing?: number; startOffset?: number; goalLane?: keyof typeof LANE_POSITIONS } = {}
): StageBranchConfig[] => {
  const spacing = options.spacing ?? 120;
  const startOffset = options.startOffset ?? 140;
  const goalLane = options.goalLane ?? 'C';
  const layout: StageBranchConfig[] = [];
  layout.push({ x: LANE_POSITIONS.C, y: levelHeight - 42, fruit: null });
  rows.forEach((rawRow, index) => {
    const trimmed = rawRow.trim();
    if (!trimmed || trimmed === '-') {
      return;
    }
    const rowY = levelHeight - startOffset - index * spacing;
    trimmed.split(/\s+/).forEach((token) => {
      if (!token) {
        return;
      }
      let laneToken = token;
      let fruit: StageFruitConfig | null = null;
      if (laneToken.endsWith('*')) {
        laneToken = laneToken.slice(0, -1);
        fruit = regularFruit();
      }
      if (laneToken.endsWith('!')) {
        laneToken = laneToken.slice(0, -1);
        fruit = goldenFruit();
      }
      const lane = LANE_POSITIONS[laneToken] ?? LANE_POSITIONS.C;
      layout.push({ x: lane, y: rowY, fruit });
    });
  });
  layout.push({ x: LANE_POSITIONS[goalLane], y: goalHeight + 28, fruit: null });
  return layout;
};

const stage1Rows = [
  'ML',
  'MR*',
  'L',
  'R*',
  'ML MR',
  'L',
  'R',
  'ML*',
  'MR',
  'L R*',
  'ML',
  'MR',
  'L*',
  'R',
  'ML MR*',
  'L',
  'R*',
  'ML',
  'MR',
  'L',
  'R',
  'ML*',
  'MR',
  'R'
];

const stage2Rows = [
  'MR',
  'ML*',
  'R',
  'L',
  'MR ML',
  'R*',
  'L',
  'MR',
  'ML*',
  'R',
  'L',
  'MR',
  'ML',
  'R*',
  'L',
  'MR',
  'ML*',
  'R',
  'L',
  'MR ML',
  'R',
  'L*',
  'MR',
  'ML',
  'R*',
  'L',
  'MR',
  'ML',
  'R'
];

const stage3Rows = [
  'ML',
  'MR',
  'L*',
  'R',
  'ML MR',
  'L',
  'R*',
  'ML',
  'MR',
  'L',
  'R',
  'ML*',
  'MR',
  'L',
  'R',
  'ML',
  'MR*',
  'L',
  'R',
  'ML',
  'MR',
  'L*',
  'R',
  'ML MR',
  'L',
  'R',
  'ML*',
  'MR',
  'L',
  'R',
  'ML',
  'MR',
  'L*'
];

const finalRows = [
  'ML MR',
  'L',
  'R',
  'ML',
  'MR',
  '-',
  '-',
  'ML MR',
  'L*',
  'R',
  'ML',
  'MR',
  'L',
  'R',
  'ML MR*',
  'L',
  'R',
  'ML',
  'MR',
  'L',
  'R',
  'ML',
  'MR',
  'L',
  'R',
  'ML',
  'MR'
];

const stage1: StageDefinition = {
  id: 1,
  label: 'FASE 01',
  intro: 'SUBA AO TOPO!',
  levelHeight: 3200,
  goalHeight: 220,
  timeLimit: 120,
  maxTime: 180,
  playerStart: { x: 128, y: 3200 - 140 },
  layout: buildLayout(3200, 220, stage1Rows, { spacing: 120, startOffset: 140, goalLane: 'R' }),
  hazardDefaults: { horizontalSpeed: 110, fallingGravity: 360 },
  hazardEvents: [
    { at: seconds(8), type: 'horizontal', fromLeft: true, y: 2200 },
    { at: seconds(14), type: 'horizontal', fromLeft: false, y: 1800 },
    { at: seconds(18), type: 'falling', x: 152, y: 600 },
    { at: seconds(24), type: 'horizontal', fromLeft: true, y: 1400 },
    { at: seconds(30), type: 'falling', x: 104, y: 500 }
  ],
  checkpoints: [
    { y: 2400, label: 'CHECK A' },
    { y: 1600, label: 'CHECK B' }
  ],
  ladders: [],
  items: [
    { x: 128, y: 2800, value: 400, texture: 'fruit-golden', timeBonus: 3 }
  ],
  fruitTimeBonus: 2,
  climbZoneWidth: 48,
  nextStage: 2
};

const stage2: StageDefinition = {
  id: 2,
  label: 'FASE 02',
  intro: 'EVITE OS TROVÕES!',
  levelHeight: 3320,
  goalHeight: 210,
  timeLimit: 110,
  maxTime: 170,
  playerStart: { x: 128, y: 3320 - 140 },
  layout: buildLayout(3320, 210, stage2Rows, { spacing: 112, startOffset: 140, goalLane: 'ML' }),
  hazardDefaults: { horizontalSpeed: 130, fallingGravity: 380 },
  hazardEvents: [
    { at: seconds(6), type: 'horizontal', fromLeft: true, y: 2500 },
    { at: seconds(10), type: 'falling', x: 184, y: 900 },
    { at: seconds(14), type: 'horizontal', fromLeft: false, y: 2100 },
    { at: seconds(18), type: 'falling', x: 104, y: 780 },
    { at: seconds(24), type: 'horizontal', fromLeft: true, y: 1700 },
    { at: seconds(30), type: 'falling', x: 152, y: 640 },
    { at: seconds(36), type: 'horizontal', fromLeft: false, y: 1300 }
  ],
  checkpoints: [
    { y: 2500, label: 'CHECK A' },
    { y: 1700, label: 'CHECK B' }
  ],
  ladders: [],
  items: [
    { x: 184, y: 2200, value: 400, texture: 'fruit-golden', timeBonus: 3 },
    { x: 72, y: 1500, value: 500, texture: 'fruit-golden', timeBonus: 4 }
  ],
  fruitTimeBonus: 2,
  climbZoneWidth: 48,
  nextStage: 3
};

const stage3: StageDefinition = {
  id: 3,
  label: 'FASE 03',
  intro: 'VENTOS FORTES!',
  levelHeight: 3440,
  goalHeight: 200,
  timeLimit: 100,
  maxTime: 160,
  playerStart: { x: 128, y: 3440 - 140 },
  layout: buildLayout(3440, 200, stage3Rows, { spacing: 108, startOffset: 140, goalLane: 'MR' }),
  hazardDefaults: { horizontalSpeed: 150, fallingGravity: 400 },
  hazardEvents: [
    { at: seconds(5), type: 'horizontal', fromLeft: true, y: 2700 },
    { at: seconds(9), type: 'falling', x: 104, y: 1000 },
    { at: seconds(12), type: 'horizontal', fromLeft: false, y: 2300 },
    { at: seconds(16), type: 'falling', x: 184, y: 860 },
    { at: seconds(20), type: 'horizontal', fromLeft: true, y: 1900 },
    { at: seconds(24), type: 'falling', x: 152, y: 720 },
    { at: seconds(28), type: 'horizontal', fromLeft: false, y: 1500 },
    { at: seconds(34), type: 'falling', x: 104, y: 600 }
  ],
  checkpoints: [
    { y: 2600, label: 'CHECK A' },
    { y: 1800, label: 'CHECK B' }
  ],
  ladders: [],
  items: [
    { x: 152, y: 2400, value: 500, texture: 'fruit-golden', timeBonus: 4 }
  ],
  fruitTimeBonus: 3,
  climbZoneWidth: 48,
  nextStage: 4
};

const finalStage: StageDefinition = {
  id: 4,
  label: 'FASE FINAL',
  intro: 'CHEGUE À COPA!',
  levelHeight: 3560,
  goalHeight: 160,
  timeLimit: 90,
  maxTime: 150,
  playerStart: { x: 128, y: 3560 - 140 },
  layout: buildLayout(3560, 160, finalRows, { spacing: 104, startOffset: 148, goalLane: 'C' }),
  hazardDefaults: { horizontalSpeed: 170, fallingGravity: 420 },
  hazardEvents: [
    { at: seconds(8), type: 'horizontal', fromLeft: true, y: 2600 },
    { at: seconds(16), type: 'horizontal', fromLeft: false, y: 2100 },
    { at: seconds(24), type: 'horizontal', fromLeft: true, y: 1600 }
  ],
  checkpoints: [
    { y: 2600, label: 'CHECK A' },
    { y: 1800, label: 'CHECK B' }
  ],
  ladders: [
    { x: 128, top: 320, bottom: 600, width: 32 }
  ],
  items: [
    { x: 128, y: 400, value: 800, texture: 'fruit-golden', timeBonus: 5 }
  ],
  fruitTimeBonus: 3,
  climbZoneWidth: 52,
  finale: {
    canopyY: 280,
    canopyHeight: 160,
    stairs: [
      { x: 110, top: 260, bottom: 400, width: 20 },
      { x: 146, top: 260, bottom: 400, width: 20 }
    ]
  },
  isFinal: true
};

const STAGES: StageDefinition[] = [stage1, stage2, stage3, finalStage];

export const getStageDefinition = (stage: number): StageDefinition => {
  const normalized = Phaser.Math.Clamp(stage, 1, STAGES.length);
  const definition = STAGES.find((candidate) => candidate.id === normalized);
  return definition ?? STAGES[STAGES.length - 1];
};

export const getStageLabel = (stage: number): string => getStageDefinition(stage).label;

export const getNextStageId = (stage: number): number | undefined => {
  const definition = getStageDefinition(stage);
  return definition.nextStage;
};

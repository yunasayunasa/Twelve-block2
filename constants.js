// --- 定数 ---
export const PADDLE_WIDTH_RATIO = 0.2;
export const PADDLE_HEIGHT = 20;
export const PADDLE_Y_OFFSET = 50;
export const BALL_RADIUS = 18;
export const PHYSICS_BALL_RADIUS = 60; // Ballの物理半径 (setCircle用)
export const BALL_INITIAL_VELOCITY_Y = -350;
export const BALL_INITIAL_VELOCITY_X_RANGE = [-150, 150];
export const BRICK_ROWS = 5; // 基本行数 (ステージで増加)
export const BRICK_COLS = 8; // 基本列数 (ステージで増加)
export const BRICK_WIDTH_RATIO = 0.095; // 画面幅に対するブロック幅の割合 (見切れ対策)
export const BRICK_HEIGHT = 20;
export const BRICK_SPACING = 4;
export const BRICK_OFFSET_TOP = 50;
export const DURABLE_BRICK_CHANCE = 0.2; // (現在はステージ進行度で計算)
export const MAX_DURABLE_HITS = 3;
export const DURABLE_BRICK_COLOR = 0xaaaaaa;
export const DURABLE_BRICK_HIT_DARKEN = 40; // ヒット毎の暗さ増加量
export const INDESTRUCTIBLE_BRICK_COLOR = 0x333333;
export const MAX_STAGE = 12; // 最大ステージ数

export const BRICK_COLORS = [ 0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff ];
export const BRICK_MARKED_COLOR = 0x666666; // ビカラ陰用マーク色

export const BAISRAVA_DROP_RATE = 0.01; // バイシュラヴァの直接ドロップ率
export const POWERUP_SIZE = 40;5
export const POWERUP_SPEED_Y = 100;
export const POWERUP_TYPES = { KUBIRA: 'kubira', SHATORA: 'shatora', HAILA: 'haila', ANCHIRA: 'anchira', SINDARA: 'sindara', BIKARA: 'bikara', INDARA: 'indara', ANILA: 'anila', BAISRAVA: 'baisrava', VAJRA: 'vajra', MAKIRA: 'makira', MAKORA: 'makora' };
export const ALL_POSSIBLE_POWERUPS = [ POWERUP_TYPES.KUBIRA, POWERUP_TYPES.SHATORA, POWERUP_TYPES.HAILA, POWERUP_TYPES.ANCHIRA, POWERUP_TYPES.SINDARA, POWERUP_TYPES.BIKARA, POWERUP_TYPES.INDARA, POWERUP_TYPES.ANILA, POWERUP_TYPES.VAJRA, POWERUP_TYPES.MAKIRA, POWERUP_TYPES.MAKORA ];
export const MAKORA_COPYABLE_POWERS = [ POWERUP_TYPES.KUBIRA, POWERUP_TYPES.SHATORA, POWERUP_TYPES.HAILA, POWERUP_TYPES.ANCHIRA, POWERUP_TYPES.SINDARA, POWERUP_TYPES.BIKARA, POWERUP_TYPES.INDARA, POWERUP_TYPES.ANILA, POWERUP_TYPES.VAJRA, POWERUP_TYPES.MAKIRA ];
export const POWERUP_DURATION = { [POWERUP_TYPES.KUBIRA]: 10000, [POWERUP_TYPES.SHATORA]: 3000, [POWERUP_TYPES.HAILA]: 10000, [POWERUP_TYPES.MAKIRA]: 6667 };
export const BIKARA_YANG_COUNT_MAX = 2; // 陽転換で破壊できる回数
export const INDARA_MAX_HOMING_COUNT = 3; // 壁反射時のホーミング回数
export const NORMAL_BALL_SPEED = Math.abs(BALL_INITIAL_VELOCITY_Y);
export const BALL_SPEED_MODIFIERS = { [POWERUP_TYPES.SHATORA]: 3.0, [POWERUP_TYPES.HAILA]: 0.3 };
export const SINDARA_ATTRACTION_DELAY = 3000; // 分裂後、引き寄せ開始までの時間
export const SINDARA_ATTRACTION_FORCE = 400; // 引き寄せの強さ
export const SINDARA_MERGE_DURATION = 500; // 合体演出（停止）時間
export const SINDARA_POST_MERGE_PENETRATION_DURATION = 3000; // 合体後の貫通持続時間
export const VAJRA_GAUGE_MAX = 100;
export const VAJRA_GAUGE_INCREMENT = 10; // ブロック破壊毎のゲージ増加量
export const VAJRA_DESTROY_COUNT = 5; // 奥義発動時の破壊ブロック数
export const MAKIRA_ATTACK_INTERVAL = 1000; // マキラビーム発射間隔
export const MAKIRA_BEAM_SPEED = 400;
export const MAKIRA_BEAM_WIDTH = 10;
export const MAKIRA_BEAM_HEIGHT = 15;
export const MAKIRA_BEAM_COLOR = 0xff0000;
export const MAKIRA_FAMILIAR_OFFSET = 40; // パドルからの左右オフセット
export const MAKIRA_FAMILIAR_SIZE = 10;
export const DROP_POOL_UI_ICON_SIZE = 20;
export const DROP_POOL_UI_SPACING = 5;
export const UI_BOTTOM_OFFSET = 50; // UI要素の下部オフセット

// 画像キーとファイル名のマッピング
export const POWERUP_ICON_KEYS = {
    [POWERUP_TYPES.KUBIRA]: 'icon_kubira', [POWERUP_TYPES.SHATORA]: 'icon_shatora', [POWERUP_TYPES.HAILA]: 'icon_haila',
    [POWERUP_TYPES.ANCHIRA]: 'icon_anchira', [POWERUP_TYPES.SINDARA]: 'icon_sindara', SINDARA_SUPER: 'icon_super_sindara',
    [POWERUP_TYPES.BIKARA]: 'icon_bikara_yin', BIKARA_YANG: 'icon_bikara_yang', [POWERUP_TYPES.INDARA]: 'icon_indara',
    [POWERUP_TYPES.ANILA]: 'icon_anila', [POWERUP_TYPES.BAISRAVA]: 'icon_baisrava', [POWERUP_TYPES.VAJRA]: 'icon_vajra',
    [POWERUP_TYPES.MAKIRA]: 'icon_makira', [POWERUP_TYPES.MAKORA]: 'icon_makora',
};

// 音声ファイルキー定義
export const AUDIO_KEYS = {
    BGM1: 'bgm1', BGM2: 'bgm2',
    SE_START: 'se_start', SE_LAUNCH: 'se_launch', SE_REFLECT: 'se_reflect',
    SE_DESTROY: 'se_destroy', SE_STAGE_CLEAR: 'se_stage_clear', SE_GAME_OVER: 'se_game_over',
    SE_SINDARA_MERGE: 'se_sindara_merge',
    SE_BIKARA_CHANGE: 'se_bikara_change', SE_VAJRA_TRIGGER: 'se_vajra_trigger',
    VOICE_KUBIRA: 'voice_kubira', VOICE_SHATORA: 'voice_shatora', VOICE_HAILA: 'voice_haila',
    VOICE_ANCHIRA: 'voice_anchira', VOICE_SINDARA: 'voice_sindara', VOICE_SINDARA_MERGE: 'voice_sindara_merge',
    VOICE_BIKARA_YIN: 'voice_bikara_yin', VOICE_BIKARA_YANG: 'voice_bikara_yang', VOICE_INDARA: 'voice_indara',
    VOICE_ANILA: 'voice_anila', VOICE_BAISRAVA: 'voice_baisrava',
    VOICE_VAJRA_GET: 'voice_vajra', // ヴァジラ取得時
    VOICE_VAJRA_TRIGGER: 'voice_vajra_trigger', // ヴァジラ奥義発動時
    VOICE_MAKIRA: 'voice_makira', VOICE_MAKORA:'voice_makora',
    // --- ▼▼▼ ボス戦用に追加 ▼▼▼ ---
    SE_CUTSCENE_START: 'se_cutscene_start',     // カットイン開始SE (シャキーン)
    SE_IMPACT_FLASH: 'se_impact_flash',       // 登場前フラッシュSE (衝撃音)
    VOICE_BOSS_APPEAR: 'voice_boss_appear',     // ボス登場ボイス
    SE_BOSS_ZOOM: 'se_boss_zoom',            // ボスズームSE
    SE_SHRINK: 'se_shrink',                 // ボス瞬間縮小SE (パッ)
    SE_FIGHT_START: 'se_fight_start',          // 戦闘開始SE
    VOICE_BOSS_DAMAGE: 'voice_boss_damage',     // ボス被ダメージボイス
    VOICE_BOSS_RANDOM_1: 'voice_boss_random_1', // 戦闘中ランダムボイス1
    VOICE_BOSS_RANDOM_2: 'voice_boss_random_2', // 戦闘中ランダムボイス2
    VOICE_BOSS_RANDOM_3: 'voice_boss_random_3', // 戦闘中ランダムボイス3
    VOICE_BOSS_DEFEAT: 'voice_boss_defeat',     // ボス撃破ボイス
    SE_DEFEAT_FLASH: 'se_defeat_flash',        // 撃破時フラッシュSE (1回再生)
    //SE_SHAKE_FADE: 'se_shake_fade'           // シェイク＆フェードSE (任意)
    // --- ▲▲▲ ボス戦用に追加 ▲▲▲ ---
};

// 特殊ステージのパターン (文字/記号)
export const SYMBOL_PATTERNS = {
    '3': [[1,1,1,1,1],[0,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[1,1,1,1,1]],
    '9': [[1,1,1,1,1],[1,0,0,0,1],[1,1,1,1,1],[0,0,0,0,1],[1,1,1,1,1]],
    '11': [[0,1,1,1,0,0,0,0,1,0,0],[0,1,1,1,0,0,0,0,1,0,0],[1,1,1,1,1,0,1,1,1,1,0],[0,0,1,0,0,0,0,1,0,1,1],[0,0,1,0,0,0,0,1,0,0,1],[0,0,1,0,0,0,0,1,0,0,1],[0,0,1,0,0,0,1,0,0,1,0]],
};
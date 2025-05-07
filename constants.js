// constants.js (リファクタリング・レスポンシブ対応版 - 割合ベース)

// --- ▼▼▼ 画面調整のための基本方針 ▼▼▼ ---
// 多くのサイズ関連の値を画面サイズに対する割合で定義し、
// Phaserのスケールマネージャー(FITモード想定)による拡縮に基本的な見た目を任せます。
// 一部の要素（パドルの高さなど）は固定ピクセル値とし、拡縮に任せる形とします。
// 極端な画面サイズでの破綻を防ぐため、Clamp処理と最低/最大マージンは各シーン側で行います。

// --- サイズ・配置関連 (割合ベース) ---
export const PADDLE_WIDTH_RATIO = 0.2;        // パドル幅 (画面幅比)
export const PADDLE_Y_OFFSET_RATIO = 0.1;     // パドルY位置オフセット (画面下端からの高さ比)
export const BALL_RADIUS_RATIO = 0.04;        // ★ ボール半径 (画面幅比 - 見た目基準、PHYSICS_BALL_RADIUS も連動させるか検討)
export const POWERUP_SIZE_RATIO = 0.09;       // ★ パワーアップアイテムサイズ (画面幅比)
export const MAKIRA_FAMILIAR_SIZE_RATIO = 0.025;// ★ マキラ子機サイズ (画面幅比)
export const MAKIRA_FAMILIAR_OFFSET_RATIO = 0.1; // ★ パドルからの左右オフセット (画面幅比)
export const MAKIRA_BEAM_WIDTH_RATIO = 0.02;  // ★ マキラビーム幅 (画面幅比)
export const MAKIRA_BEAM_HEIGHT_RATIO = 0.02; // ★ マキラビーム高さ (画面高さ比)
export const DROP_POOL_UI_ICON_SIZE_RATIO = 0.04; // ★ ドロッププールアイコンサイズ (画面幅比)
export const DROP_POOL_UI_SPACING_RATIO = 0.01; // ★ ドロッププールアイコン間隔 (画面幅比)
export const UI_BOTTOM_OFFSET_RATIO = 0.08;   // UI要素下部オフセット (画面高さ比)
// export const BRICK_WIDTH_RATIO = 0.095;    // 通常ステージ用 (不要)
// export const BRICK_OFFSET_TOP_RATIO = 0.15; // 通常ステージ用 (不要)

// --- サイズ・配置関連 (固定ピクセル値 - 拡縮で調整) ---
export const PADDLE_HEIGHT = 20;
export const PHYSICS_BALL_RADIUS = 60; // 見た目(BALL_RADIUS_RATIO)と連動させるか、固定値のままか要検討
export const BRICK_HEIGHT = 20;     // 通常ステージ用 (不要)
export const BRICK_SPACING = 4;       // 通常ステージ用 (不要)

// --- 速度・物理関連 ---
export const BALL_INITIAL_VELOCITY_Y = -350; // 固定値でOK (相対速度は維持される)
export const BALL_INITIAL_VELOCITY_X_RANGE = [-150, 150]; // 固定値でOK
export const NORMAL_BALL_SPEED = Math.abs(BALL_INITIAL_VELOCITY_Y);
export const POWERUP_SPEED_Y = 100; // 固定値でOK (相対速度)
export const BALL_SPEED_MODIFIERS = { [POWERUP_TYPES.SHATORA]: 3.0, [POWERUP_TYPES.HAILA]: 0.3 };
export const INDARA_HOMING_SPEED_MULTIPLIER = 1.2; // NORMAL_BALL_SPEEDに対する倍率
export const MAKIRA_BEAM_SPEED = 400; // 固定値でOK
export const MAKIRA_ATTACK_INTERVAL = 1000;

// --- 色 ---
export const MAKIRA_BEAM_COLOR = 0xff0000;
// export const DURABLE_BRICK_COLOR = 0xaaaaaa; // 不要
// export const INDESTRUCTIBLE_BRICK_COLOR = 0x333333; // 不要
// export const BRICK_COLORS = [ ... ]; // 不要

// --- ゲームシステム (ボスラッシュ用) ---
export const TOTAL_BOSSES = 5;
export const BAISRAVA_DROP_RATE = 0.01; // バイシュラヴァの直接ドロップ率
export const VAJRA_GAUGE_MAX = 100;
export const VAJRA_GAUGE_INCREMENT = 10;

// --- パワーアップ関連 ---
export const POWERUP_TYPES = { KUBIRA: 'kubira', SHATORA: 'shatora', HAILA: 'haila', ANCHIRA: 'anchira', SINDARA: 'sindara', BIKARA: 'bikara', INDARA: 'indara', ANILA: 'anila', BAISRAVA: 'baisrava', VAJRA: 'vajra', MAKIRA: 'makira', MAKORA: 'makora' };
// export const ALL_POSSIBLE_POWERUPS = [ ... ]; // CommonBossScene で動的生成推奨
export const MAKORA_COPYABLE_POWERS = Object.values(POWERUP_TYPES).filter(type => type !== POWERUP_TYPES.BAISRAVA && type !== POWERUP_TYPES.MAKORA);
export const POWERUP_DURATION = { // 効果時間 (ms)
    [POWERUP_TYPES.KUBIRA]: 10000,
    [POWERUP_TYPES.SHATORA]: 3000,
    [POWERUP_TYPES.HAILA]: 10000,
    [POWERUP_TYPES.MAKIRA]: 6667,
    [POWERUP_TYPES.ANCHIRA]: 8000, // 要調整
    [POWERUP_TYPES.BIKARA]: 7000,  // 要調整
    [POWERUP_TYPES.ANILA]: 10000, // 要調整
};

// --- 画像キー ---
export const POWERUP_ICON_KEYS = {
    [POWERUP_TYPES.KUBIRA]: 'icon_kubira', [POWERUP_TYPES.SHATORA]: 'icon_shatora', [POWERUP_TYPES.HAILA]: 'icon_haila',
    [POWERUP_TYPES.ANCHIRA]: 'icon_anchira', [POWERUP_TYPES.SINDARA]: 'icon_sindara',
    [POWERUP_TYPES.BIKARA]: 'icon_bikara_yin', // または 'icon_bikara'
    [POWERUP_TYPES.INDARA]: 'icon_indara', [POWERUP_TYPES.ANILA]: 'icon_anila',
    [POWERUP_TYPES.BAISRAVA]: 'icon_baisrava', [POWERUP_TYPES.VAJRA]: 'icon_vajra',
    [POWERUP_TYPES.MAKIRA]: 'icon_makira', [POWERUP_TYPES.MAKORA]: 'icon_makora',
};

// --- 音声キー ---
export const AUDIO_KEYS = {
    BGM1: 'bgm1', BGM2: 'bgm2',
    SE_START: 'se_start', SE_LAUNCH: 'se_launch', SE_REFLECT: 'se_reflect',
    SE_DESTROY: 'se_destroy', SE_STAGE_CLEAR: 'se_stage_clear', SE_GAME_OVER: 'se_game_over',
    VOICE_KUBIRA: 'voice_kubira', VOICE_SHATORA: 'voice_shatora', VOICE_HAILA: 'voice_haila',
    VOICE_ANCHIRA: 'voice_anchira', VOICE_SINDARA: 'voice_sindara',
    VOICE_BIKARA_YIN: 'voice_bikara_yin', // ビカラ取得時用
    VOICE_INDARA: 'voice_indara', VOICE_ANILA: 'voice_anila', VOICE_BAISRAVA: 'voice_baisrava',
    VOICE_VAJRA_GET: 'voice_vajra', VOICE_VAJRA_TRIGGER: 'voice_vajra_trigger',
    VOICE_MAKIRA: 'voice_makira', VOICE_MAKORA:'voice_makora',
    // ボス戦用
    SE_CUTSCENE_START: 'se_cutscene_start', VOICE_BOSS_APPEAR: 'voice_boss_appear',
    SE_IMPACT_FLASH: 'se_impact_flash', SE_BOSS_ZOOM: 'se_boss_zoom', SE_SHRINK: 'se_shrink',
    SE_FIGHT_START: 'se_fight_start', VOICE_BOSS_DAMAGE: 'voice_boss_damage',
    VOICE_BOSS_RANDOM_1: 'voice_boss_random_1', VOICE_BOSS_RANDOM_2: 'voice_boss_random_2',
    VOICE_BOSS_RANDOM_3: 'voice_boss_random_3', VOICE_BOSS_DEFEAT: 'voice_boss_defeat',
    SE_DEFEAT_FLASH: 'se_defeat_flash', // SE_SHAKE_FADE: 'se_shake_fade'
};

// --- 不要な定数 (コメントアウトまたは削除) ---
// export const PADDLE_Y_OFFSET = 50;
// export const BALL_RADIUS = 18;
// export const POWERUP_SIZE = 40;
// export const MAKIRA_FAMILIAR_SIZE = 10;
// export const MAKIRA_FAMILIAR_OFFSET = 40;
// export const MAKIRA_BEAM_WIDTH = 10;
// export const MAKIRA_BEAM_HEIGHT = 15;
// export const DROP_POOL_UI_ICON_SIZE = 20;
// export const DROP_POOL_UI_SPACING = 5;
// export const UI_BOTTOM_OFFSET = 50;
// export const BRICK_ROWS = 5;
// export const BRICK_COLS = 8;
// export const BRICK_WIDTH_RATIO = 0.095;
// export const BRICK_HEIGHT = 20;
// export const BRICK_SPACING = 4;
// export const BRICK_OFFSET_TOP = 50;
// export const MAX_STAGE = 12;
// export const BRICK_COLORS = [ ... ];
// export const BRICK_MARKED_COLOR = 0x666666;
// export const BIKARA_YANG_COUNT_MAX = 2;
// export const INDARA_MAX_HOMING_COUNT = 3;
// export const SINDARA_ATTRACTION_DELAY = 3000;
// export const SINDARA_ATTRACTION_FORCE = 400;
// export const SINDARA_MERGE_DURATION = 500;
// export const SINDARA_POST_MERGE_PENETRATION_DURATION = 3000;
// export const VAJRA_DESTROY_COUNT = 5;
// export const SYMBOL_PATTERNS = { ... };
// export const POWERUP_ICON_KEYS = { ..., BIKARA_YANG: 'icon_bikara_yang', SINDARA_SUPER: 'icon_super_sindara', };
// export const AUDIO_KEYS = { ..., VOICE_BIKARA_YANG: 'voice_bikara_yang', SE_SINDARA_MERGE: 'se_sindara_merge', etc. };
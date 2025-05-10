// constants.js (UI関連定数追加・割合ベース 最終版 - インポートエラー対応)

// --- ▼▼▼ 画面調整のための基本方針 ▼▼▼ ---
// 多くのサイズ関連の値を画面サイズに対する割合で定義し、
// Phaserのスケールマネージャー(FITモード想定)による拡縮に基本的な見た目を任せます。
// 一部の要素（パドルの高さなど）は固定ピクセル値とし、拡縮に任せる形とします。
// 極端な画面サイズでの破綻を防ぐため、Clamp処理と最低/最大マージンは各シーン側で行います。

// --- サイズ・配置関連 (割合ベース) ---
export const PADDLE_WIDTH_RATIO = 0.2;        // パドル幅 (画面幅比)
export const PADDLE_Y_OFFSET_RATIO = 0.1;     // パドルY位置オフセット (画面下端からの高さ比)
export const BALL_RADIUS_RATIO = 0.05;       // ボール半径 (画面幅比)
export const POWERUP_SIZE_RATIO = 0.08;       // パワーアップアイテムサイズ (画面幅比)
export const MAKIRA_FAMILIAR_SIZE_RATIO = 0.025;// マキラ子機サイズ (画面幅比)
export const MAKIRA_FAMILIAR_OFFSET_RATIO = 0.1; // パドルからの左右オフセット (画面幅比)
export const MAKIRA_BEAM_WIDTH_RATIO = 0.02;  // マキラビーム幅 (画面幅比)
export const MAKIRA_BEAM_HEIGHT_RATIO = 0.05; // マキラビーム長さの目安 (画面高さ比)

// --- ▼ UI関連の割合ベース定数 ▼ ---
export const UI_BOTTOM_OFFSET_RATIO = 0.07;
export const DROP_POOL_UI_ICON_SIZE_RATIO = 0.045;
export const DROP_POOL_UI_SPACING_RATIO = 0.015;

// --- ▼ UIマージン・フォントサイズ関連の定数 (UISceneで使用) ▼ ---
export const UI_TOP_MARGIN_MIN = 15;
export const UI_TOP_MARGIN_RATIO = 0.04;
export const UI_SIDE_MARGIN_MIN = 10;
export const UI_SIDE_MARGIN_RATIO = 0.025;
export const UI_FONT_SIZE_MIN = 12;
export const UI_FONT_SIZE_MAX = 26;
export const UI_FONT_SIZE_SCALE_DIVISOR = 16;

// --- サイズ・配置関連 (固定ピクセル値 - 拡縮で調整) ---
export const PADDLE_HEIGHT = 20;

// --- 速度・物理関連 ---
export const BALL_INITIAL_VELOCITY_Y = -380;
export const BALL_INITIAL_VELOCITY_X_RANGE = [-180, 180];
export const NORMAL_BALL_SPEED = Math.abs(BALL_INITIAL_VELOCITY_Y);
export const POWERUP_SPEED_Y = 120;

// --- パワーアップ関連 ---
export const POWERUP_TYPES = {
    KUBIRA: 'kubira', SHATORA: 'shatora', HAILA: 'haila', ANCHIRA: 'anchira', SINDARA: 'sindara',
    BIKARA: 'bikara', INDARA: 'indara', ANILA: 'anila', BAISRAVA: 'baisrava', VAJRA: 'vajra',
    MAKIRA: 'makira', MAKORA: 'makora',BIKARA_YANG: 'bikara_yang', // ★ ビカラ陽を追加
    BADRA: 'badra' // ★ バドラを追加
    // 新しい特殊ボールの定義場所 (例: BIKARA_YANG: 'bikara_yang', BADRA: 'badra', BAISYURA: 'baisyura')
};

export const BALL_SPEED_MODIFIERS = { // POWERUP_TYPESをキーとして使用
    [POWERUP_TYPES.SHATORA]: 2.8,
    [POWERUP_TYPES.HAILA]: 0.35
};
export const INDARA_HOMING_SPEED_MULTIPLIER = 1.25;
export const MAKIRA_BEAM_SPEED = 450;
export const MAKIRA_ATTACK_INTERVAL = 900;
export const FAMILIAR_MOVE_SPEED_X = 200;

// --- 色 ---
export const MAKIRA_BEAM_COLOR = 0xff3333;
export const PADDLE_NORMAL_TINT = 0xffff00;
export const PADDLE_ANILA_TINT = 0xffffff;

// --- ゲームシステム (ボスラッシュ用) ---
export const TOTAL_BOSSES = 5;
export const BAISRAVA_DROP_RATE = 0.015;
export const VAJRA_GAUGE_MAX = 100;
export const VAJRA_GAUGE_INCREMENT = 10;
export const MAX_PLAYER_LIVES = 9; // ★★★ 最大プレイヤーライフ数を定義 (例: 5) ★★★
export const INITIAL_PLAYER_LIVES = 9; // ★★★ 初期プレイヤーライフ数を定義 (例: 3) ★★★

// ALL_POSSIBLE_POWERUPS は CommonBossScene で POWERUP_TYPES から動的に生成することを推奨
// export const ALL_POSSIBLE_POWERUPS = Object.values(POWERUP_TYPES);
export const MAKORA_COPYABLE_POWERS = Object.values(POWERUP_TYPES).filter(
    type => type !== POWERUP_TYPES.BAISRAVA && type !== POWERUP_TYPES.MAKORA
);
export const POWERUP_DURATION = { // 効果時間 (ms)
    [POWERUP_TYPES.KUBIRA]: 10000,
    [POWERUP_TYPES.SHATORA]: 3000,
    [POWERUP_TYPES.HAILA]: 10000,
    [POWERUP_TYPES.MAKIRA]: 6700,
    [POWERUP_TYPES.ANCHIRA]: 8000, // アンチラの効果時間
    [POWERUP_TYPES.BIKARA]: 7000,  // ビカラの効果時間
    [POWERUP_TYPES.ANILA]: 10000,  // アニラの効果時間
    // 新しい特殊ボールの効果時間もここに追加
    // [POWERUP_TYPES.BADRA]: 5000,
};

// --- 画像キー ---
export const POWERUP_ICON_KEYS = {
    [POWERUP_TYPES.KUBIRA]: 'icon_kubira', [POWERUP_TYPES.SHATORA]: 'icon_shatora',
    [POWERUP_TYPES.HAILA]: 'icon_haila', [POWERUP_TYPES.ANCHIRA]: 'icon_anchira',
    [POWERUP_TYPES.SINDARA]: 'icon_sindara',
    [POWERUP_TYPES.BIKARA]: 'icon_bikara_yin',
    [POWERUP_TYPES.INDARA]: 'icon_indara', [POWERUP_TYPES.ANILA]: 'icon_anila',
    [POWERUP_TYPES.BAISRAVA]: 'icon_baisrava', [POWERUP_TYPES.VAJRA]: 'icon_vajra',
    [POWERUP_TYPES.MAKIRA]: 'icon_makira', [POWERUP_TYPES.MAKORA]: 'icon_makora',
    // 新しい特殊ボールのアイコンキー
     [POWERUP_TYPES.BIKARA_YANG]: 'icon_bikara_yang',
    [POWERUP_TYPES.BADRA]: 'icon_badra',
    // [POWERUP_TYPES.BAISYURA]: 'icon_baisyura',
};

// --- 音声キー ---
export const AUDIO_KEYS = {
    BGM1: 'bgm1', BGM2: 'bgm2',
    SE_START: 'se_start', SE_LAUNCH: 'se_launch', SE_REFLECT: 'se_reflect',
    SE_DESTROY: 'se_destroy', SE_STAGE_CLEAR: 'se_stage_clear', SE_GAME_OVER: 'se_game_over',
    SE_CUTSCENE_START: 'se_cutscene_start', SE_IMPACT_FLASH: 'se_impact_flash',
    SE_BOSS_ZOOM: 'se_boss_zoom', SE_SHRINK: 'se_shrink', SE_FIGHT_START: 'se_fight_start',
    SE_DEFEAT_FLASH: 'se_defeat_flash',
    SE_BIKARA_CHANGE: 'se_bikara_change',

    VOICE_KUBIRA: 'voice_kubira', VOICE_SHATORA: 'voice_shatora', VOICE_HAILA: 'voice_haila',
    VOICE_ANCHIRA: 'voice_anchira', VOICE_SINDARA: 'voice_sindara', VOICE_SINDARA_MERGE: 'voice_sindara_merge',
    VOICE_BIKARA_YIN: 'voice_bikara_yin', VOICE_BIKARA_YANG: 'voice_bikara_yang',
    VOICE_INDARA: 'voice_indara', VOICE_ANILA: 'voice_anila',
    VOICE_BAISRAVA: 'voice_baisrava', VOICE_VAJRA_GET: 'voice_vajra', VOICE_VAJRA_TRIGGER: 'voice_vajra_trigger',
    VOICE_MAKIRA: 'voice_makira', VOICE_MAKORA:'voice_makora',

    VOICE_BOSS_APPEAR: 'voice_boss_appear', VOICE_BOSS_DAMAGE: 'voice_boss_damage',
    VOICE_BOSS_DEFEAT: 'voice_boss_defeat',
    VOICE_BOSS_RANDOM_1: 'voice_boss_random_1',
    VOICE_BOSS_RANDOM_2: 'voice_boss_random_2',
    VOICE_BOSS_RANDOM_3: 'voice_boss_random_3',
    // 新しい特殊ボールのボイスキー
    VOICE_BADRA: 'voice_badra',
    // VOICE_BAISYURA: 'voice_baisyura',
};

// --- ボス戦共通のデフォルト値 ---
export const DEFAULT_BOSS_MAX_HEALTH = 100;
export const DEFAULT_BOSS_MOVE_DURATION = 3500;
export const DEFAULT_BOSS_MOVE_RANGE_X_RATIO = 0.75;
export const DEFAULT_BOSS_WIDTH_RATIO = 0.25;

// --- 攻撃ブロック関連の共通デフォルト値 ---
export const DEFAULT_ATTACK_BRICK_VELOCITY_Y = 180;
export const DEFAULT_ATTACK_BRICK_SPAWN_DELAY_MIN = 800;
export const DEFAULT_ATTACK_BRICK_SPAWN_DELAY_MAX = 1600;
export const DEFAULT_ATTACK_BRICK_ITEM_DROP_RATE = 0.3;
export const DEFAULT_ATTACK_BRICK_SCALE_RATIO = 0.08;
// constants.js (UI関連定数追加・割合ベース 最終版)

// --- ▼▼▼ 画面調整のための基本方針 ▼▼▼ ---
// 多くのサイズ関連の値を画面サイズに対する割合で定義し、
// Phaserのスケールマネージャー(FITモード想定)による拡縮に基本的な見た目を任せます。
// 一部の要素（パドルの高さなど）は固定ピクセル値とし、拡縮に任せる形とします。
// 極端な画面サイズでの破綻を防ぐため、Clamp処理と最低/最大マージンは各シーン側で行います。

// --- サイズ・配置関連 (割合ベース) ---
export const PADDLE_WIDTH_RATIO = 0.2;        // パドル幅 (画面幅比)
export const PADDLE_Y_OFFSET_RATIO = 0.1;     // パドルY位置オフセット (画面下端からの高さ比)
export const BALL_RADIUS_RATIO = 0.035;       // ボール半径 (画面幅比) - 少し小さく調整
export const POWERUP_SIZE_RATIO = 0.08;       // パワーアップアイテムサイズ (画面幅比) - 少し小さく調整
export const MAKIRA_FAMILIAR_SIZE_RATIO = 0.025;// マキラ子機サイズ (画面幅比)
export const MAKIRA_FAMILIAR_OFFSET_RATIO = 0.1; // パドルからの左右オフセット (画面幅比)
export const MAKIRA_BEAM_WIDTH_RATIO = 0.02;  // マキラビーム幅 (画面幅比)
export const MAKIRA_BEAM_HEIGHT_RATIO = 0.05; // マキラビーム長さの目安 (画面高さ比) - 実際は速度による

// --- ▼ UI関連の割合ベース定数 ▼ ---
export const UI_BOTTOM_OFFSET_RATIO = 0.07;   // 下部UI全体の基準オフセット (画面高さ比) - 少し調整
export const DROP_POOL_UI_ICON_SIZE_RATIO = 0.045; // ドロッププールアイコンサイズ (画面幅比) - 少し調整
export const DROP_POOL_UI_SPACING_RATIO = 0.015; // ドロッププールアイコン間隔 (画面幅比) - 少し調整

// --- ▼ UIマージン・フォントサイズ関連の定数 (UISceneで使用) ▼ ---
export const UI_TOP_MARGIN_MIN = 10;        // 上部UIの最小マージン (px) - 少し調整
export const UI_TOP_MARGIN_RATIO = 0.025;   // 上部UIのマージン (画面高さ比) - 少し調整
export const UI_SIDE_MARGIN_MIN = 10;       // 左右UIの最小マージン (px) - 少し調整
export const UI_SIDE_MARGIN_RATIO = 0.025;  // 左右UIのマージン (画面幅比) - 少し調整
export const UI_FONT_SIZE_MIN = 12;         // UIテキストの最小フォントサイズ (px) - 少し調整
export const UI_FONT_SIZE_MAX = 26;         // UIテキストの最大フォントサイズ (px) - 少し調整
export const UI_FONT_SIZE_SCALE_DIVISOR = 22; // 画面幅をこれで割ってフォントサイズを出す目安 - 少し調整

// --- サイズ・配置関連 (固定ピクセル値 - 拡縮で調整) ---
export const PADDLE_HEIGHT = 20;
// PHYSICS_BALL_RADIUS は CommonBossScene の createAndAddBall で BALL_RADIUS_RATIO から動的に計算する方針に変更
// export const PHYSICS_BALL_RADIUS = 10;

// --- 速度・物理関連 ---
export const BALL_INITIAL_VELOCITY_Y = -380; // 少し速く
export const BALL_INITIAL_VELOCITY_X_RANGE = [-180, 180]; // 少し範囲を広げる
export const NORMAL_BALL_SPEED = Math.abs(BALL_INITIAL_VELOCITY_Y);
export const POWERUP_SPEED_Y = 120; // 少し速く
export const BALL_SPEED_MODIFIERS = { SHATORA: 2.8, HAILA: 0.35 }; // POWERUP_TYPES.SHATORA 形式にすべきだが、CommonBossScene内で対応
export const INDARA_HOMING_SPEED_MULTIPLIER = 1.25; // インダラ追尾速度の通常速度に対する倍率
export const MAKIRA_BEAM_SPEED = 450; // 少し速く
export const MAKIRA_ATTACK_INTERVAL = 900; // 少し短く
export const FAMILIAR_MOVE_SPEED_X = 200; // マキラ子機の左右移動速度

// --- 色 ---
export const MAKIRA_BEAM_COLOR = 0xff3333; // 少し明るい赤
export const PADDLE_NORMAL_TINT = 0xffff00; // 通常のパドルの色 (黄色)
export const PADDLE_ANILA_TINT = 0xffffff;  // アニラ効果中のパドルの色 (白)

// --- ゲームシステム (ボスラッシュ用) ---
export const TOTAL_BOSSES = 5;
export const BAISRAVA_DROP_RATE = 0.015; // バイシュラヴァの直接ドロップ率 (やや上げ)
export const VAJRA_GAUGE_MAX = 100;
export const VAJRA_GAUGE_INCREMENT = 10;

// --- パワーアップ関連 ---
export const POWERUP_TYPES = {
    KUBIRA: 'kubira', SHATORA: 'shatora', HAILA: 'haila', ANCHIRA: 'anchira', SINDARA: 'sindara',
    BIKARA: 'bikara', INDARA: 'indara', ANILA: 'anila', BAISRAVA: 'baisrava', VAJRA: 'vajra',
    MAKIRA: 'makira', MAKORA: 'makora'
    // 新しい特殊ボールの定義場所 (例: BIKARA_YANG: 'bikara_yang')
};
// ALL_POSSIBLE_POWERUPS は CommonBossScene で POWERUP_TYPES から動的に生成することを推奨
// export const ALL_POSSIBLE_POWERUPS = Object.values(POWERUP_TYPES);
export const MAKORA_COPYABLE_POWERS = Object.values(POWERUP_TYPES).filter(
    type => type !== POWERUP_TYPES.BAISRAVA && type !== POWERUP_TYPES.MAKORA
);
export const POWERUP_DURATION = { // 効果時間 (ms)
    [POWERUP_TYPES.KUBIRA]: 10000,
    [POWERUP_TYPES.SHATORA]: 3000,
    [POWERUP_TYPES.HAILA]: 10000,
    [POWERUP_TYPES.MAKIRA]: 6700, // 約6.7秒 (調整)
    [POWERUP_TYPES.ANCHIRA]: 8000,
    [POWERUP_TYPES.BIKARA]: 7000,
    [POWERUP_TYPES.ANILA]: 10000,
};
// CommonBossSceneで直接参照するため、個別定数は不要
// export const ANILA_DURATION = POWERUP_DURATION[POWERUP_TYPES.ANILA];
// export const ANCHIRA_DURATION = POWERUP_DURATION[POWERUP_TYPES.ANCHIRA];
// export const BIKARA_DURATION = POWERUP_DURATION[POWERUP_TYPES.BIKARA];


// --- 画像キー ---
export const POWERUP_ICON_KEYS = {
    [POWERUP_TYPES.KUBIRA]: 'icon_kubira', [POWERUP_TYPES.SHATORA]: 'icon_shatora',
    [POWERUP_TYPES.HAILA]: 'icon_haila', [POWERUP_TYPES.ANCHIRA]: 'icon_anchira',
    [POWERUP_TYPES.SINDARA]: 'icon_sindara',
    [POWERUP_TYPES.BIKARA]: 'icon_bikara_yin', // または 'icon_bikara' (陰陽で分けるなら別途定義)
    [POWERUP_TYPES.INDARA]: 'icon_indara', [POWERUP_TYPES.ANILA]: 'icon_anila',
    [POWERUP_TYPES.BAISRAVA]: 'icon_baisrava', [POWERUP_TYPES.VAJRA]: 'icon_vajra',
    [POWERUP_TYPES.MAKIRA]: 'icon_makira', [POWERUP_TYPES.MAKORA]: 'icon_makora',
    // 新しい特殊ボールのアイコンキー (例: [POWERUP_TYPES.BIKARA_YANG]: 'icon_bikara_yang')
};

// --- 音声キー ---
export const AUDIO_KEYS = {
    BGM1: 'bgm1', BGM2: 'bgm2', // ボス戦BGMはBossScene側で指定することを推奨
    SE_START: 'se_start', SE_LAUNCH: 'se_launch', SE_REFLECT: 'se_reflect',
    SE_DESTROY: 'se_destroy', SE_STAGE_CLEAR: 'se_stage_clear', SE_GAME_OVER: 'se_game_over',
    SE_CUTSCENE_START: 'se_cutscene_start', SE_IMPACT_FLASH: 'se_impact_flash',
    SE_BOSS_ZOOM: 'se_boss_zoom', SE_SHRINK: 'se_shrink', SE_FIGHT_START: 'se_fight_start',
    SE_DEFEAT_FLASH: 'se_defeat_flash',
    // SE_SHAKE_FADE: 'se_shake_fade', // 必要なら追加

    VOICE_KUBIRA: 'voice_kubira', VOICE_SHATORA: 'voice_shatora', VOICE_HAILA: 'voice_haila',
    VOICE_ANCHIRA: 'voice_anchira', VOICE_SINDARA: 'voice_sindara', VOICE_SINDARA_MERGE: 'voice_sindara_merge',
    VOICE_BIKARA_YIN: 'voice_bikara_yin', VOICE_BIKARA_YANG: 'voice_bikara_yang', // 陰陽ボイス
    SE_BIKARA_CHANGE: 'se_bikara_change', // ビカラ陰陽変更SE
    VOICE_INDARA: 'voice_indara', VOICE_ANILA: 'voice_anila',
    VOICE_BAISRAVA: 'voice_baisrava', VOICE_VAJRA_GET: 'voice_vajra', VOICE_VAJRA_TRIGGER: 'voice_vajra_trigger',
    VOICE_MAKIRA: 'voice_makira', VOICE_MAKORA:'voice_makora',

    VOICE_BOSS_APPEAR: 'voice_boss_appear', VOICE_BOSS_DAMAGE: 'voice_boss_damage',
    VOICE_BOSS_DEFEAT: 'voice_boss_defeat',
    VOICE_BOSS_RANDOM_1: 'voice_boss_random_1', // ボス固有のランダムボイスはBossScene側で配列管理推奨
    VOICE_BOSS_RANDOM_2: 'voice_boss_random_2',
    VOICE_BOSS_RANDOM_3: 'voice_boss_random_3',
    // 新しい特殊ボールのボイスキー
};

// --- ボス戦共通のデフォルト値 (各ボスシーンでオーバーライド可能) ---
export const DEFAULT_BOSS_MAX_HEALTH = 100;
export const DEFAULT_BOSS_MOVE_DURATION = 3500;
export const DEFAULT_BOSS_MOVE_RANGE_X_RATIO = 0.75;
export const DEFAULT_BOSS_WIDTH_RATIO = 0.25; // ボスの表示幅のデフォルト (画面幅比)

// --- 攻撃ブロック関連の共通デフォルト値 (各ボスシーンで調整) ---
export const DEFAULT_ATTACK_BRICK_VELOCITY_Y = 180;
export const DEFAULT_ATTACK_BRICK_SPAWN_DELAY_MIN = 800;
export const DEFAULT_ATTACK_BRICK_SPAWN_DELAY_MAX = 1600;
export const DEFAULT_ATTACK_BRICK_ITEM_DROP_RATE = 0.3; // 攻撃ブロック破壊時のアイテムドロップ率
export const DEFAULT_ATTACK_BRICK_SCALE_RATIO = 0.08; // 攻撃ブロックの表示幅の目安 (画面幅比)

// 不要な固定ピクセル値定数は削除またはコメントアウト済み
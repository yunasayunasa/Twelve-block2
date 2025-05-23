// constants.js (音声キー整理・サンカラソワカ仮キー追加版)

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
    MAKIRA: 'makira', MAKORA: 'makora',BIKARA_YANG: 'bikara_yang',
    BADRA: 'badra'
};

export const BALL_SPEED_MODIFIERS = {
    [POWERUP_TYPES.SHATORA]: 2.8,
    [POWERUP_TYPES.HAILA]: 0.35
};
export const INDARA_HOMING_SPEED_MULTIPLIER = 1.25;
export const MAKIRA_BEAM_SPEED = 450;       // (マキラは仕様変更でビームなし)
export const MAKIRA_ATTACK_INTERVAL = 900;  // (マキラは仕様変更で攻撃なし)
export const FAMILIAR_MOVE_SPEED_X = 200;   // (マキラは仕様変更で子機挙動変更)

// --- 色 ---
export const MAKIRA_BEAM_COLOR = 0xff3333; // (マキラは仕様変更でビームなし)
export const PADDLE_NORMAL_TINT = 0xffff00;
export const PADDLE_ANILA_TINT = 0xffffff;

// --- ゲームシステム (ボスラッシュ用) ---
export const TOTAL_BOSSES = 4;
export const BAISRAVA_DROP_RATE = 0.015; // バイシュラヴァの特別ドロップは廃止し、通常プールへ
export const VAJRA_GAUGE_MAX = 100;
export const VAJRA_GAUGE_INCREMENT = 10;
export const SYSTEM_MAX_LIVES = 20;
export const INITIAL_PLAYER_LIVES = 9;
export const MAX_PLAYER_LIVES = 20;

export const MAKORA_COPYABLE_POWERS = Object.values(POWERUP_TYPES).filter(
    type => type !== POWERUP_TYPES.BAISRAVA && type !== POWERUP_TYPES.MAKORA
);
export const POWERUP_DURATION = { // 効果時間 (ms)
    [POWERUP_TYPES.KUBIRA]: 10000,
    [POWERUP_TYPES.SHATORA]: 3000,
    [POWERUP_TYPES.HAILA]: 10000,
    // [POWERUP_TYPES.MAKIRA]: 6700, // マキラは即時効果に変更
    [POWERUP_TYPES.ANCHIRA]: 8000,
    [POWERUP_TYPES.BIKARA]: 7000,
    [POWERUP_TYPES.ANILA]: 10000,
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
    [POWERUP_TYPES.BIKARA_YANG]: 'icon_bikara_yang',
    [POWERUP_TYPES.BADRA]: 'icon_badra',

    
};

// --- 音声キー ---
export const AUDIO_KEYS = {
    // --- BGM ---
    BGM1: 'bgm1', // サンカラ戦などで使用
    BGM2: 'bgm2', // ソワカ戦、アートマン戦などで使用

    // --- 共通 SE ---
    SE_START: 'se_start', SE_LAUNCH: 'se_launch', SE_REFLECT: 'se_reflect',
    SE_DESTROY: 'se_destroy', SE_STAGE_CLEAR: 'se_stage_clear', SE_GAME_OVER: 'se_game_over',
    SE_CUTSCENE_START: 'se_cutscene_start',
    SE_FLASH_IMPACT_COMMON: 'se_flash_impact_common', // ★ 新しい共通インパクトSEキー
    SE_BOSS_ZOOM: 'se_boss_zoom', // (ズーム演出を使う場合)
    SE_SHRINK: 'se_shrink',       // (ズーム演出を使う場合)
    SE_FIGHT_START: 'se_fight_start',
    SE_DEFEAT_FLASH: 'se_defeat_flash',
    SE_BIKARA_CHANGE: 'se_bikara_change', // (ビカラ陰陽変更SE、もし使うなら)

    // --- パワーアップボイス ---
    VOICE_KUBIRA: 'voice_kubira', VOICE_SHATORA: 'voice_shatora', VOICE_HAILA: 'voice_haila',
    VOICE_ANCHIRA: 'voice_anchira', VOICE_SINDARA: 'voice_sindara', VOICE_SINDARA_MERGE: 'voice_sindara_merge',
    VOICE_BIKARA_YIN: 'voice_bikara_yin', VOICE_BIKARA_YANG: 'voice_bikara_yang',
    VOICE_INDARA: 'voice_indara', VOICE_ANILA: 'voice_anila',
    VOICE_BAISRAVA: 'voice_baisrava', VOICE_VAJRA_GET: 'voice_vajra', VOICE_VAJRA_TRIGGER: 'voice_vajra_trigger',
    VOICE_MAKIRA: 'voice_makira', VOICE_MAKORA:'voice_makora',
    VOICE_BADRA: 'voice_badra',

    // --- アートマンHL (Boss1) 専用ボイス ---
    VOICE_ARTMAN_APPEAR: 'voice_boss_appear', // ★ アートマン登場ボイス (現在の se_impact_flash.mp3 の内容)
    SE_ARTMAN_IMPACT: 'se_impact_flash',   // ★ アートマン登場インパクトSE (現在の voice_boss_appear.mp3 の内容)
    VOICE_ARTMAN_DAMAGE: 'voice_boss_damage', // ★ アートマン専用被ダメージ (現状は汎用と同じキー)
    VOICE_ARTMAN_DEFEAT: 'voice_boss_defeat', // ★ アートマン専用撃破 (現状は汎用と同じキー)
    VOICE_ARTMAN_RANDOM_1: 'voice_boss_random_1',// ★ アートマン専用ランダム1 (現状は汎用と同じキー)
    VOICE_ARTMAN_RANDOM_2: 'voice_boss_random_2',// ★ アートマン専用ランダム2 (現状は汎用と同じキー)
    VOICE_ARTMAN_RANDOM_3: 'voice_boss_random_3',// ★ アートマン専用ランダム3 (現状は汎用と同じキー)

    // --- サンカラ (Boss2前半) 専用ボイス ---
    VOICE_SANKARA_APPEAR: 'voice_sankara_appear',   // (要新規ファイル)
    VOICE_SANKARA_DAMAGE: 'voice_sankara_damage',   // (要新規ファイル or 汎用)
    VOICE_SANKARA_DEFEAT: 'voice_sankara_defeat',   // (要新規ファイル or 汎用)
    VOICE_SANKARA_RANDOM_1: 'voice_sankara_random_1', // (要新規ファイル or 汎用)
    VOICE_SANKARA_RANDOM_2: 'voice_sankara_random_2', // ★追加


    // --- ソワカ (Boss2後半) 専用ボイス ---
    VOICE_SOWAKA_APPEAR: 'voice_sowaka_appear',     // (要新規ファイル)
    VOICE_SOWAKA_DAMAGE: 'voice_sowaka_damage',     // (要新規ファイル or 汎用)
    VOICE_SOWAKA_DEFEAT: 'voice_sowaka_defeat',     // (要新規ファイル or 汎用)
    VOICE_SOWAKA_RANDOM_1: 'voice_sowaka_random_1',   // (要新規ファイル or 汎用)
    VOICE_SOWAKA_RANDOM_2: 'voice_sowaka_random_2',   // ★追加


      // --- キングゴールドスライム (Boss3) 専用ボイス・SE ---
VOICE_KING_SLIME_APPEAR: 'voice_king_slime_appear',     // キングスライム登場ボイス
VOICE_KING_SLIME_DAMAGE: 'voice_king_slime_damage',     // キングスライム被ダメージボイス
VOICE_KING_SLIME_DEFEAT: 'voice_king_slime_defeat',     // キングスライム撃破ボイス
VOICE_KING_SLIME_RANDOM_1: 'voice_king_slime_appear', // キングスライムランダムボイス1
// VOICE_KING_SLIME_RANDOM_2: 'voice_king_slime_random_2', // 必要なら追加
SE_KING_SLIME_RUMBLE: 'voice_king_slime_defeat',         // 登場時の地響き/競り上がりSE
SE_SLIME_BEAM_CHARGE: 'se_cutscene_start',         // スライムビーム チャージSE
SE_SLIME_BEAM_FIRE: 'se_shrink',           // スライムビーム 放出SE

// --- キングゴールドスライム (Boss3) 専用BGM ---
BGM_KING_SLIME: 'bgm_king_slime',                   // キングスライム戦BGM
    
    
    // (他のボスも同様に専用ボイスキーを追加していく)
     // --- ルシゼロ (Boss4) 専用ボイス ---
    VOICE_LUCILIUS_APPEAR: 'voice_lucilius_appear',       // ルシゼロ登場ボイス
    VOICE_LUCILIUS_DAMAGE: 'voice_lucilius_damage',       // ルシゼロ被ダメージボイス (決着の刻)
    VOICE_LUCILIUS_DEFEAT: 'voice_lucilius_defeat',       // ルシゼロ撃破ボイス (決着の刻)
    VOICE_LUCILIUS_RANDOM_1: 'voice_lucilius_random_1',   // ルシゼロランダムボイス1
   VOICE_LUCILIUS_RANDOM_2: 'voice_lucilius_random_2',   // ルシゼロランダムボイス1
   VOICE_LUCILIUS_RANDOM_3: 'voice_lucilius_random_3',   // ルシゼロランダムボイス1
   VOICE_LUCILIUS_RANDOM_4: 'voice_lucilius_random_4',   // ルシゼロランダムボイス1
    // VOICE_LUCILIUS_RANDOM_2: 'voice_lucilius_random_2',   // 必要に応じて追加
    VOICE_LUCILIUS_TRIAL_START: 'voice_lucilius_trial_start', // 新しい試練開始時のセリフなど (任意)
    VOICE_LUCILIUS_TRIAL_COMPLETE: 'voice_lucilius_trial_complete', // 試練達成時のセリフなど (任意)
    VOICE_LUCILIUS_ICE: 'voice_lucilius_choice',         // 「調和と破壊」選択を促すセリフ (任意)
    VOICE_LUCILIUS_PARがADISE_LOST: 'voice_lucilius_paradise_lost', // パラダイス・ロスト詠唱 (任意)

    // --- ルシゼロ (Boss4) 専用SE ---
    SE_JI_END_BELL: 'se_ji_end_bell',                 // ジエンドタイマーの鐘の音
    SE_TRIAL_ANNOUNCE: 'se_trial_announce',           // 新しい試練が提示される時のSE (UI表示と同期)
    SE_TRIAL_SUCCESS: 'se_trial_success',             // 試練達成時の成功SE
    SE_CRYSTAL_SPAWN: 'se_crystal_spawn',             // 「調和と破壊」クリスタル出現SE
    SE_CRYSTAL_BREAK_ORDER: 'se_crystal_break_order',   // 秩序クリスタル破壊SE
    SE_CRYSTAL_BREAK_CHAOS: 'se_crystal_break_chaos',   // 混沌クリスタル破壊SE
    SE_PARADISE_LOST_CHARGE: 'se_paradise_lost_charge', // 「パラダイス・ロスト」チャージSE
    SE_PARADISE_LOST_EXECUTE: 'se_paradise_lost_execute',// 「パラダイス・ロスト」発動SE
    SE_LUCILIUS_WARP_EFFECT: 'se_lucilius_warp',        // ルシゼロワープSE
    SE_ABYSS_CORE_SHOW: 'se_abyss_core_show',           // アビス・コア出現SE (任意)
    SE_ABYSS_CORE_HIT_SOUND: 'se_abyss_core_hit',         // アビス・コアヒットSE (任意)
    SE_TIME_FIELD_ON: 'se_time_field_on',               // 「時の超越」フィールド展開SE
    SE_TIME_FIELD_OFF: 'se_time_field_off',              // 「時の超越」フィールド解除SE
    SE_LUCILIUS_ATTACK_RADIAL: 'se_lucilius_attack_radial', // 放射攻撃SE
    SE_LUCILIUS_ATTACK_TARGET: 'se_lucilius_attack_target', // ターゲット攻撃SE
    SE_LUCILIUS_INVULNERABLE_HIT: 'se_lucilius_invul_hit', // 試練中ボスにボールが当たった時の無効音 (任意)
    BGM_LUCILIUS_PHASE1: 'bgm_lucilius_phase1.mp3',
SE_FINAL_BATTLE_START:'se_final_battle_start',

    //追加
    SE_VOID_WALL_BREAK: 'se_void_wall_break',             // 虚無の壁ブロック破壊音
   SE_ABYSS_CORE_DESTROY: 'se_abyss_core_destroy',     // アビス・コア破壊SE
     SE_CHAOS_FRAGMENT_DESTROY: 'se_chaos_fragment_destroy', // 混沌の欠片 破壊SE

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

// constants.js
// ... (他の定数) ...

// --- 演出・サウンド関連定数 (CommonBossScene や各ボスシーンで使用) ---
export const CUTSCENE_DURATION = 1800;
export const CUTSCENE_FLASH_DURATION = 200;
export const INTRO_FLASH_DURATION = 200;
export const ZOOM_IN_DURATION = 800;
export const ZOOM_WAIT_DURATION = 200;
export const SHRINK_DURATION = 50;
export const SHRINK_FLASH_DURATION = 150;
export const VOICE_START_DELAY = 100;
export const GAMEPLAY_START_DELAY = 600;
export const BOSS_RANDOM_VOICE_MIN_DELAY = 8000;
export const BOSS_RANDOM_VOICE_MAX_DELAY = 15000;
export const BOSS_DAMAGE_VOICE_THROTTLE = 2000;
export const DEFEAT_FLASH_DURATION = 150;
export const DEFEAT_FLASH_INTERVAL = 700;
export const DEFEAT_FLASH_COUNT = 3; // ★ export する
export const DEFEAT_SHAKE_DURATION = 1200;
export const DEFEAT_FADE_DURATION = 1500;
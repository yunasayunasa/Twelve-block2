// BootScene.js
import { POWERUP_ICON_KEYS, AUDIO_KEYS } from './constants.js';

export default class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    

    preload() {
        console.log("BootScene Preload Start");
        this.textures.generate('whitePixel', { data: ['1'], pixelWidth: 1 });

        // --- 画像読み込み ---
        console.log("Loading images...");
        this.load.image('ball_image', 'assets/ball.png');
        Object.values(POWERUP_ICON_KEYS).forEach(key => {
             if (key && typeof key === 'string') {
                 this.load.image(key, `assets/${key}.png`);
             }
        });
        this.load.image('joykun', 'assets/joykun.png');
        this.load.image('gameBackground', 'assets/gamebackground.jpg');
        this.load.image('gameBackground2', 'assets/gamebackground2.jpg');
        this.load.image('gameBackground3', 'assets/gamebackground3.jpg');

        // --- ▼ ボス関連アセット読み込み ▼ ---
        console.log("Loading boss assets...");
        this.load.image('bossStand', 'assets/boss_stand.png');   // ★ ボス立ち絵 (必須)
       // this.load.image('orbiter', 'assets/orbiter.png');         // ★ 子機画像 (必須)
        // 以下のファイルはまだ無くてもOK (後で追加)
        // this.load.image('bossDamage', 'assets/boss_damage.png'); // ダメージ絵
         this.load.image('attackBrick', 'assets/attack_brick_common.png'); // 攻撃ブロック
         // BootScene.js - preload内に追加
this.load.image('bossNegative', 'assets/bossNegative.png'); // ボス撃墜、キー名とファイル名を合わせる
        // --- ▲ ボス関連アセット読み込み ▲ ---

         // --- サンカラソワカ戦画像 (例) ---
    this.load.image('boss_sankara_stand', 'assets/boss_sankara_stand.png');
    this.load.image('boss_sankara_negative', 'assets/boss_sankara_negative.png');
    this.load.image('boss_sowaka_stand', 'assets/boss_sowaka_stand.png');
    this.load.image('boss_sowaka_negative', 'assets/boss_sowaka_negative.png');
    this.load.image('gameBackground_Boss2', 'assets/gameBackground_Boss2.jpg'); // ボス2専用背景
this.load.image('attack_brick_common', 'assets/attack_brick_common.png'); // ファイル名は実際の画像ファイルに合わせる


        // --- 音声読み込み ---
        console.log("Loading audio files (all as .mp3)...");
        this.load.audio(AUDIO_KEYS.BGM1, 'assets/stage_bgm1.mp3');
        this.load.audio(AUDIO_KEYS.BGM2, 'assets/stage_bgm2.mp3');
        this.load.audio(AUDIO_KEYS.SE_START, 'assets/se_start.mp3');
        this.load.audio(AUDIO_KEYS.SE_LAUNCH, 'assets/se_launch.mp3');
        this.load.audio(AUDIO_KEYS.SE_REFLECT, 'assets/se_reflect.mp3'); // 壁は鳴らないが読み込む
        this.load.audio(AUDIO_KEYS.SE_DESTROY, 'assets/se_destroy.mp3');
        this.load.audio(AUDIO_KEYS.SE_STAGE_CLEAR, 'assets/se_stage_clear.mp3');
        this.load.audio(AUDIO_KEYS.SE_GAME_OVER, 'assets/se_game_over.mp3');
        // this.load.audio(AUDIO_KEYS.SE_SINDARA_MERGE, 'assets/se_sindara_merge.mp3'); // 実装不要
        this.load.audio(AUDIO_KEYS.SE_BIKARA_CHANGE, 'assets/se_bikara_change.mp3');
        // this.load.audio(AUDIO_KEYS.SE_VAJRA_TRIGGER, 'assets/se_vajra_trigger.mp3'); // 実装不要
        this.load.audio(AUDIO_KEYS.VOICE_KUBIRA, 'assets/voice_kubira.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SHATORA, 'assets/voice_shatora.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_HAILA, 'assets/voice_haila.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_ANCHIRA, 'assets/voice_anchira.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SINDARA, 'assets/voice_sindara.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SINDARA_MERGE, 'assets/voice_sindara_merge.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BIKARA_YIN, 'assets/voice_bikara_yin.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BIKARA_YANG, 'assets/voice_bikara_yang.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_INDARA, 'assets/voice_indara.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_ANILA, 'assets/voice_anila.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BAISRAVA, 'assets/voice_baisrava.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_VAJRA_GET, 'assets/voice_vajra.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_VAJRA_TRIGGER, 'assets/voice_vajra_trigger.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_MAKIRA, 'assets/voice_makira.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_MAKORA, 'assets/voice_makora.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BADRA, `assets/${AUDIO_KEYS.VOICE_BADRA}.mp3`);
        // --- ▼▼▼ ボス戦用サウンド読み込み (キーとファイル名を整理) ▼▼▼ ---
        console.log("Loading boss scene sounds (revised keys)...");
        this.load.audio(AUDIO_KEYS.SE_CUTSCENE_START, 'assets/se_cutscene_start.mp3');
        // ★ アートマン専用インパクトSE (元 VOICE_BOSS_APPEAR のファイル) ★
        this.load.audio(AUDIO_KEYS.SE_ARTMAN_IMPACT, 'assets/voice_boss_appear.mp3');
        // ★ 共通インパクトSE (新規ファイル) ★
        this.load.audio(AUDIO_KEYS.SE_FLASH_IMPACT_COMMON, 'assets/se_flash_impact_common.mp3');

        // SE_BOSS_ZOOM と SE_FIGHT_START は constants.js からキーが消えていたので、
        // もし使うなら constants.js にキーを戻し、ここでロードする
        // this.load.audio(AUDIO_KEYS.SE_BOSS_ZOOM, 'assets/se_boss_zoom.mp3');
        this.load.audio(AUDIO_KEYS.SE_SHRINK, 'assets/se_shrink.mp3');
        // this.load.audio(AUDIO_KEYS.SE_FIGHT_START, 'assets/se_fight_start.mp3');

        this.load.audio(AUDIO_KEYS.SE_DEFEAT_FLASH, 'assets/se_defeat_flash.mp3');

        // --- ボス専用ボイス ---
        // ★ アートマン専用登場ボイス (元 SE_IMPACT_FLASH のファイル) ★
        this.load.audio(AUDIO_KEYS.VOICE_ARTMAN_APPEAR, 'assets/se_impact_flash.mp3');
        // ★ アートマン専用ダメージボイス (現状は汎用キー VOICE_BOSS_DAMAGE を流用しているが、専用ファイルがあるなら) ★
        this.load.audio(AUDIO_KEYS.VOICE_ARTMAN_DAMAGE, 'assets/voice_artman_damage.mp3'); // または assets/voice_boss_damage.mp3
        // ★ アートマン専用撃破ボイス ★
        this.load.audio(AUDIO_KEYS.VOICE_ARTMAN_DEFEAT, 'assets/voice_artman_defeat.mp3'); // または assets/voice_boss_defeat.mp3
        // ★ アートマン専用ランダムボイス ★
        this.load.audio(AUDIO_KEYS.VOICE_ARTMAN_RANDOM_1, 'assets/voice_artman_random_1.mp3'); // または assets/voice_boss_random_1.mp3
        this.load.audio(AUDIO_KEYS.VOICE_ARTMAN_RANDOM_2, 'assets/voice_artman_random_2.mp3'); // または assets/voice_boss_random_2.mp3
        this.load.audio(AUDIO_KEYS.VOICE_ARTMAN_RANDOM_3, 'assets/voice_artman_random_3.mp3'); // または assets/voice_boss_random_3.mp3

        // ★ サンカラ専用ボイス (新規ファイル) ★
        this.load.audio(AUDIO_KEYS.VOICE_SANKARA_APPEAR, 'assets/voice_sankara_appear.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SANKARA_DAMAGE, 'assets/voice_sankara_damage.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SANKARA_DEFEAT, 'assets/voice_sankara_defeat.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SANKARA_RANDOM_1, 'assets/voice_sankara_random_1.mp3');
         this.load.audio(AUDIO_KEYS.VOICE_SANKARA_RANDOM_2, `assets/${AUDIO_KEYS.VOICE_SANKARA_RANDOM_2}.mp3`);


        // ★ ソワカ専用ボイス (新規ファイル) ★
        this.load.audio(AUDIO_KEYS.VOICE_SOWAKA_APPEAR, 'assets/voice_sowaka_appear.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SOWAKA_DAMAGE, 'assets/voice_sowaka_damage.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SOWAKA_DEFEAT, 'assets/voice_sowaka_defeat.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SOWAKA_RANDOM_1, 'assets/voice_sowaka_random_1.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SOWAKA_RANDOM_2, `assets/${AUDIO_KEYS.VOICE_SOWAKA_RANDOM_2}.mp3`);
        // --- ▲▲▲ ボス戦用サウンド読み込み ▲▲▲ ---

        // --- キングゴールドスライム (Boss3) 関連アセット ---
console.log("Loading King Gold Slime (Boss3) assets...");

// 画像 (テクスチャ)
this.load.image('boss_king_slime_stand', 'assets/boss_king_slime_stand.png');
this.load.image('boss_king_slime_negative', 'assets/boss_king_slime_negative.png');
this.load.image('attack_brick_gold', 'assets/attack_brick_common.png'); // 流れる壁用ブロック
this.load.image('attack_brick_slime_projectile', 'assets/attack_brick_common.png'); // 通常攻撃弾
//this.load.image('target_marker_slime', 'assets/target_marker_slime.png'); // ターゲット攻撃マーカー
this.load.image('slime_beam_particle', 'assets/attack_brick_common.png'); // スライムビーム構成要素
this.load.image('gameBackground_Boss3', 'assets/gameBackground_Boss3.jpg'); // 専用背景

// 音声 (上記 constants.js で定義したキーを使用)
if (AUDIO_KEYS.BGM_KING_SLIME) { // キーが存在するか一応確認
    this.load.audio(AUDIO_KEYS.BGM_KING_SLIME, 'assets/bgm_king_slime.mp3');
}
if (AUDIO_KEYS.VOICE_KING_SLIME_APPEAR) {
    this.load.audio(AUDIO_KEYS.VOICE_KING_SLIME_APPEAR, 'assets/voice_king_slime_appear.mp3');
}
if (AUDIO_KEYS.VOICE_KING_SLIME_DAMAGE) {
    this.load.audio(AUDIO_KEYS.VOICE_KING_SLIME_DAMAGE, 'assets/voice_king_slime_damage.mp3');
}
if (AUDIO_KEYS.VOICE_KING_SLIME_DEFEAT) {
    this.load.audio(AUDIO_KEYS.VOICE_KING_SLIME_DEFEAT, 'assets/voice_king_slime_defeat.mp3');
}
if (AUDIO_KEYS.VOICE_KING_SLIME_RANDOM_1) {
    this.load.audio(AUDIO_KEYS.VOICE_KING_SLIME_RANDOM_1, 'assets/voice_king_slime_random_1.mp3');
}
// if (AUDIO_KEYS.VOICE_KING_SLIME_RANDOM_2) { // 必要なら
//     this.load.audio(AUDIO_KEYS.VOICE_KING_SLIME_RANDOM_2, 'assets/voice_king_slime_random_2.mp3');
// }
if (AUDIO_KEYS.SE_KING_SLIME_RUMBLE) {
    this.load.audio(AUDIO_KEYS.SE_KING_SLIME_RUMBLE, 'assets/se_king_slime_rumble.mp3');
}
if (AUDIO_KEYS.SE_SLIME_BEAM_CHARGE) {
    this.load.audio(AUDIO_KEYS.SE_SLIME_BEAM_CHARGE, 'assets/se_slime_beam_charge.mp3');
}
if (AUDIO_KEYS.SE_SLIME_BEAM_FIRE) {
    this.load.audio(AUDIO_KEYS.SE_SLIME_BEAM_FIRE, 'assets/se_slime_beam_fire.mp3');
}
// --- キングゴールドスライム (Boss3) 関連アセット読み込み終了 ---

// --- ルシゼロ (Boss4) 関連アセット ---
console.log("Loading Lucilius Zero (Boss4) assets...");
this.load.image('boss_lucilius_stand', 'assets/boss_lucilius_stand.png');
this.load.image('boss_lucilius_negative', 'assets/boss_lucilius_negative.png');
this.load.image('crystal_order', 'assets/attack_brick_lucilius.png');
this.load.image('crystal_chaos', 'assets/attack_brick_lucilius_target.png');
this.load.image('chaos_fragment', 'assets/chaos_fragment.png');
this.load.image('abyss_core', 'assets/chaos_fragment.png');
this.load.image('void_wall_block', 'assets/void_wall_block.png');
this.load.image('attack_brick_lucilius', 'assets/attack_brick_lucilius.png');
this.load.image('attack_brick_lucilius_target', 'assets/attack_brick_lucilius_target.png');
this.load.image('gameBackground_Boss4', 'assets/gameBackground_Boss4.jpg');
 this.load.image('light_pillar_texture', 'assets/light_pillar.png'); // 仮パス
 this.load.image('impact_spark_particle', 'assets/spark.png');    // 仮パス
// (その他必要な画像アセット)

this.load.video('gameOverVideo_JiEnd', 'assets/ji_end.mp4');

// 音声 (AUDIO_KEYS に定義したキーを使ってロード)
if (AUDIO_KEYS.BGM_LUCILIUS_PHASE1) {
    this.load.audio(AUDIO_KEYS.BGM_LUCILIUS_PHASE1, 'assets/bgm_lucilius_phase1.mp3');


}
if (AUDIO_KEYS.VOICE_LUCILIUS_APPEAR) {this.load.audio(AUDIO_KEYS.VOICE_LUCILIUS_APPEAR, 'assets/voice_lucilius_appear.mp3');}
if (AUDIO_KEYS.SE_PARADISE_LOST_CHARGE) this.load.audio(AUDIO_KEYS.SE_PARADISE_LOST_CHARGE, 'assets/paradise_lost_charge.mp3'); // 「パラダイス・ロスト」チャージSE
if (AUDIO_KEYS.SE_PARADISE_LOST_EXECUTE) this.load.audio(AUDIO_KEYS.SE_PARADISE_LOST_EXECUTE, 'assets/paradise_lost_execute.mp3');// 「パラダイス・ロスト」発動SE

if (AUDIO_KEYS.SE_TRIAL_ANNOUNCE) this.load.audio(AUDIO_KEYS.SE_TRIAL_ANNOUNCE, 'assets/trial_announce.mp3');           // 新しい試練が提示される時のSE
if (AUDIO_KEYS.SE_TRIAL_SUCCESS) this.load.audio(AUDIO_KEYS.SE_TRIAL_SUCCESS, 'assets/trial_success.mp3');             // 試練達成時の成功SE

if (AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_1) this.load.audio(AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_1, 'assets/lucilius_random_1.mp3');   // ルシゼロランダムボイス1
if (AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_1) this.load.audio(AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_2, 'assets/lucilius_random_2.mp3');   // ルシゼロランダムボイス1
if (AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_1) this.load.audio(AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_3, 'assets/lucilius_random_3.mp3');   // ルシゼロランダムボイス1
if (AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_1) this.load.audio(AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_4, 'assets/lucilius_random_4.mp3');   // ルシゼロランダムボイス1

if (AUDIO_KEYS.VOICE_LUCILIUS_DAMAGE) this.load.audio(AUDIO_KEYS.VOICE_LUCILIUS_DAMAGE, 'assets/lucilius_damage.mp3');       // ルシゼロ被ダメージボイス (決着の刻)
if (AUDIO_KEYS.VOICE_LUCILIUS_DEFEAT) this.load.audio(AUDIO_KEYS.VOICE_LUCILIUS_DEFEAT, 'assets/lucilius_defeat.mp3');       // ルシゼロ撃破ボイス (決着の刻)

if (AUDIO_KEYS.SE_VOID_WALL_BREAK) this.load.audio(AUDIO_KEYS.SE_VOID_WALL_BREAK, 'assets/se_destroy.mp3');             // 虚無の壁ブロック破壊音
if (AUDIO_KEYS.SE_ABYSS_CORE_DESTROY) this.load.audio(AUDIO_KEYS.SE_ABYSS_CORE_DESTROY, 'assets/se_destroy.mp3');     // アビス・コア破壊SE
if (AUDIO_KEYS.SE_CHAOS_FRAGMENT_DESTROY) this.load.audio(AUDIO_KEYS.SE_CHAOS_FRAGMENT_DESTROY, 'assets/se_destroy.mp3'); // 混沌の欠片 破壊SE
if (AUDIO_KEYS.SE_LUCILIUS_INVULNERABLE_HIT) this.load.audio(AUDIO_KEYS.SE_LUCILIUS_INVULNERABLE_HIT, 'assets/lucilius_invul_hit.mp3'); // 試練中ボスにボールが当たった時の無効音

if (AUDIO_KEYS.SE_FINAL_BATTLE_START) this.load.audio(AUDIO_KEYS.SE_FINAL_BATTLE_START, 'assets/se_final_battle_start.mp3');             // 虚無の壁ブロック破壊音


// ... 他の音声ファイルも同様にロード ...
if (AUDIO_KEYS.SE_JI_END_BELL) {this.load.audio(AUDIO_KEYS.SE_JI_END_BELL, 'assets/se_ji_end_bell.mp3');}

// --- ▼▼▼ ルシゼロ戦 ジ・エンド演出用動画 ▼▼▼ ---
      //  console.log("Loading Ji-End GameOver Video for Boss4...");
        // アセットフォルダ直下に動画ファイルを置く場合
       // this.load.video('gameOverVideo_JiEnd', 'assets
        // もし 'assets/videos/' フォルダに入れるなら
        // this.load.video('gameOverVideo_JiEnd', 'assets/videos/ji_end_연출.mp4');
        // --- ▲▲▲ ------------------------------------ ▲▲▲ ---
// --- ルシゼロ (Boss4) 関連アセット読み込み終了 ---

        
        console.log("Finished loading audio files setup.");
    }

    create() {
        console.log("BootScene Create Start");
        const loaderElement = document.getElementById('loader-container');
        if (loaderElement) {
            loaderElement.style.display = 'none';
            console.log("Loader hidden.");
        } else {
            console.warn("Loader element not found.");
        }
        this.scene.start('TitleScene');
        console.log("BootScene Create End");
    }
}
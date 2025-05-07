// BootScene.js (constants.js のリファクタリングに合わせた整理案)
import { POWERUP_ICON_KEYS, AUDIO_KEYS } from './constants.js';

export default class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
        console.log("BootScene Preload Start");
        this.textures.generate('whitePixel', { data: ['1'], pixelWidth: 1 });

        // --- 画像読み込み ---
        console.log("Loading images...");
        this.load.image('ball_image', 'assets/ball.png');
        // POWERUP_ICON_KEYS を使ったループ読み込み (修正不要)
        Object.values(POWERUP_ICON_KEYS).forEach(key => {
             if (key && typeof key === 'string') {
                 // 注意: もし constants.js から BIKARA_YANG や SINDARA_SUPER などのキーを削除した場合、
                 // このループ内でエラーにはなりませんが、該当画像が assets フォルダにあれば読み込まれます。
                 // 不要な画像を assets から削除するか、POWERUP_ICON_KEYS からキー定義を削除するのが確実です。
                 this.load.image(key, `assets/${key}.png`);
             }
        });
        this.load.image('joykun', 'assets/joykun.png'); // マキラ子機用 (もし使わないなら削除)
        // 背景画像 (全種類読み込む)
        this.load.image('gameBackground', 'assets/gamebackground.jpg');
        this.load.image('gameBackground2', 'assets/gamebackground2.jpg');
        this.load.image('gameBackground3', 'assets/gamebackground3.jpg');

        // --- ボス関連アセット読み込み ---
        console.log("Loading boss assets...");
        this.load.image('bossStand', 'assets/boss_stand.png');
        this.load.image('attackBrick', 'assets/attack_brick.PNG'); // ★ 拡張子注意 PNG? png?
        this.load.image('bossNegative', 'assets/bossNegative.png');

        // --- 音声読み込み ---
        console.log("Loading audio files (all as .mp3)...");
        // ▼ 基本 BGM/SE ▼
        this.load.audio(AUDIO_KEYS.BGM1, 'assets/stage_bgm1.mp3'); // ボスラッシュで使うか？
        this.load.audio(AUDIO_KEYS.BGM2, 'assets/stage_bgm2.mp3');
        this.load.audio(AUDIO_KEYS.SE_START, 'assets/se_start.mp3');
        this.load.audio(AUDIO_KEYS.SE_LAUNCH, 'assets/se_launch.mp3');
        this.load.audio(AUDIO_KEYS.SE_REFLECT, 'assets/se_reflect.mp3');
        this.load.audio(AUDIO_KEYS.SE_DESTROY, 'assets/se_destroy.mp3');
        this.load.audio(AUDIO_KEYS.SE_STAGE_CLEAR, 'assets/se_stage_clear.mp3'); // ゲームクリア音として使う
        this.load.audio(AUDIO_KEYS.SE_GAME_OVER, 'assets/se_game_over.mp3');

        // ▼ パワーアップ関連ボイス/SE (constants.js 整理案に合わせてコメントアウト) ▼
        // this.load.audio(AUDIO_KEYS.SE_SINDARA_MERGE, 'assets/se_sindara_merge.mp3');
        // this.load.audio(AUDIO_KEYS.SE_BIKARA_CHANGE, 'assets/se_bikara_change.mp3');
        // this.load.audio(AUDIO_KEYS.SE_VAJRA_TRIGGER, 'assets/se_vajra_trigger.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_KUBIRA, 'assets/voice_kubira.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SHATORA, 'assets/voice_shatora.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_HAILA, 'assets/voice_haila.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_ANCHIRA, 'assets/voice_anchira.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SINDARA, 'assets/voice_sindara.mp3');
        // this.load.audio(AUDIO_KEYS.VOICE_SINDARA_MERGE, 'assets/voice_sindara_merge.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BIKARA_YIN, 'assets/voice_bikara_yin.mp3'); // ビカラ取得時用
        // this.load.audio(AUDIO_KEYS.VOICE_BIKARA_YANG, 'assets/voice_bikara_yang.mp3'); // 不要
        this.load.audio(AUDIO_KEYS.VOICE_INDARA, 'assets/voice_indara.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_ANILA, 'assets/voice_anila.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BAISRAVA, 'assets/voice_baisrava.mp3'); // バイシュラヴァ本体の効果ボイス？
        this.load.audio(AUDIO_KEYS.VOICE_VAJRA_GET, 'assets/voice_vajra.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_VAJRA_TRIGGER, 'assets/voice_vajra_trigger.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_MAKIRA, 'assets/voice_makira.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_MAKORA, 'assets/voice_makora.mp3');

        // ▼ ボス戦用サウンド (修正不要) ▼
        console.log("Loading boss scene sounds...");
        this.load.audio(AUDIO_KEYS.SE_CUTSCENE_START, 'assets/se_cutscene_start.mp3');
        this.load.audio(AUDIO_KEYS.SE_IMPACT_FLASH, 'assets/se_impact_flash.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BOSS_APPEAR, 'assets/voice_boss_appear.mp3');
        this.load.audio(AUDIO_KEYS.SE_BOSS_ZOOM, 'assets/se_boss_zoom.mp3');
        this.load.audio(AUDIO_KEYS.SE_SHRINK, 'assets/se_shrink.mp3');
        this.load.audio(AUDIO_KEYS.SE_FIGHT_START, 'assets/se_fight_start.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BOSS_DAMAGE, 'assets/voice_boss_damage.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BOSS_RANDOM_1, 'assets/voice_boss_random_1.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BOSS_RANDOM_2, 'assets/voice_boss_random_2.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BOSS_RANDOM_3, 'assets/voice_boss_random_3.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BOSS_DEFEAT, 'assets/voice_boss_defeat.mp3');
        this.load.audio(AUDIO_KEYS.SE_DEFEAT_FLASH, 'assets/se_defeat_flash.mp3');
        // this.load.audio(AUDIO_KEYS.SE_SHAKE_FADE, 'assets/se_shake_fade.mp3'); // 任意

        console.log("Finished loading audio files setup.");
    }

    create() {
        console.log("BootScene Create Start");
        const loaderElement = document.getElementById('loader-container');
        if (loaderElement) {
            loaderElement.style.display = 'none';
            console.log("Loader hidden.");
        } else { console.warn("Loader element not found."); }
        this.scene.start('TitleScene'); // 常にTitleSceneから開始
        console.log("BootScene Create End");
    }
}
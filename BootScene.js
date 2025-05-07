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
         this.load.image('attackBrick', 'assets/attack_brick.PNG'); // 攻撃ブロック
         // BootScene.js - preload内に追加
this.load.image('bossNegative', 'assets/bossNegative.png'); // ボス撃墜、キー名とファイル名を合わせる
        // --- ▲ ボス関連アセット読み込み ▲ ---


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
        // --- ▼▼▼ ボス戦用サウンド読み込み ▼▼▼ ---
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
        // --- ▲▲▲ ボス戦用サウンド読み込み ▲▲▲ ---
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
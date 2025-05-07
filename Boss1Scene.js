// Boss1Scene.js (テスト用 - 最小構成)
import CommonBossScene from './CommonBossScene.js';
import { AUDIO_KEYS } from './constants.js'; // ボスデータで使うかもしれないのでインポート

export default class Boss1Scene extends CommonBossScene {
    constructor() {
        super('Boss1Scene'); // ★ 必ず親クラスにシーンキーを渡す
    }

    // ▼▼▼ CommonBossScene のプレースホルダーメソッドを空でオーバーライド ▼▼▼

    /**
     * ボス固有データを初期化 (この段階では最低限)
     */
    initializeBossData() {
        console.log("--- Boss1Scene initializeBossData ---");
        // CommonBossScene のデフォルト値を一旦そのまま使うか、
        // このボス用の最低限のデータだけ設定する
        this.bossData = {
            health: 150, // 例: ボス1の体力
            textureKey: 'bossStand', // 使用するテクスチャキー
            negativeKey: 'bossNegative', // 撃破時テクスチャキー
            voiceAppear: AUDIO_KEYS.VOICE_BOSS_APPEAR, // 登場ボイスキー
            voiceDamage: AUDIO_KEYS.VOICE_BOSS_DAMAGE, // ダメージボイスキー
            voiceDefeat: AUDIO_KEYS.VOICE_BOSS_DEFEAT, // 撃破ボイスキー
            voiceRandom: [AUDIO_KEYS.VOICE_BOSS_RANDOM_1], // ランダムボイスキー配列
            bgmKey: AUDIO_KEYS.BGM1, // ボス戦BGMキー
            cutsceneText: 'VS テストボス1', // カットシーン表示テキスト
            widthRatio: 0.2, // ボスの画面幅に対する表示幅の割合
            moveRangeXRatio: 0.6, // 左右移動範囲の割合
            moveDuration: 4500, // 左右移動の片道時間(ms)
            // ボス固有の攻撃パターン定義など (後で追加)
            // attackPatterns: [...]
        };
        // CommonBossScene の bossVoiceKeys も設定
        this.bossVoiceKeys = this.bossData.voiceRandom;
        console.log("Boss1 Specific Data Initialized:", this.bossData);
    }

    /**
     * ボスオブジェクトを生成・初期化 (必須)
     */
    createSpecificBoss() {
        console.log("--- Boss1Scene createSpecificBoss ---");
        // CommonBossScene のメソッドを利用して基本的なボスを生成
        super.createSpecificBoss(); // これで this.boss が生成されるはず

        // ボス1固有の見た目調整や追加設定があればここで行う
        // 例: this.boss.setTint(0x00ff00);
        if(this.boss) {
            console.log("Boss1 created successfully using CommonBossScene method.");
        } else {
            console.error("Boss1 could not be created!");
        }
    }

    /**
     * ボス固有の動きを開始 (最初は空でもOK)
     */
    startSpecificBossMovement() {
        console.log("--- Boss1Scene startSpecificBossMovement ---");
        // CommonBossScene のデフォルトの左右移動を使う場合は super を呼ぶ
        super.startSpecificBossMovement();
        // もしボス1固有の動きがあればここで実装
    }

    /**
     * ボス固有の行動更新 (最初は空でもOK)
     */
    updateSpecificBossBehavior(time, delta) {
        // CommonBossScene のデフォルトの攻撃ブロック生成を使う場合は super を呼ぶ
        super.updateSpecificBossBehavior(time, delta);
        // ボス1固有の攻撃パターンなどをここで実装
    }

    /**
     * ボス撃破後の遷移 (必須)
     */
    handleBossDefeatCompletion() {
        console.log("--- Boss1Scene handleBossDefeatCompletion ---");
        // とりあえずタイトルに戻る処理にしておく
        // super.handleBossDefeatCompletion(); // CommonBossSceneの処理を呼ぶと次のボスへ行こうとする
        console.log("Boss 1 defeated. Returning to Title for now.");
        this.triggerGameClear(); // ここでは仮にクリア扱いにするか、タイトルに戻る
        // this.scene.start('TitleScene'); // または直接タイトルへ
    }

    // ▲▲▲ CommonBossScene のプレースホルダーメソッド ▲▲▲
}
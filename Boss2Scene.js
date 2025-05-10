// Boss2Scene.js (サンカラ＆ソワカ戦)
import CommonBossScene from './CommonBossScene.js';
import {
    AUDIO_KEYS,
    POWERUP_TYPES, // ソワカのフィールドギミックで使う可能性
    // サンカラ・ソワカ固有の攻撃パラメータなどを constants.js に定義する場合はここでインポート
    // 例: SANKARA_ATTACK_INTERVAL_MIN, SOWAKA_PROJECTILE_SPEED など
    DEFAULT_ATTACK_BRICK_VELOCITY_Y // 汎用攻撃で使う場合
} from './constants.js';

export default class Boss2Scene extends CommonBossScene {
    constructor() {
        super('Boss2Scene'); // ★ シーンキーを Boss2Scene に

        // ボス2固有のプロパティ (形態管理など)
        this.currentPhase = 'sankara'; // 'sankara' または 'sowaka'
        this.sankaraData = {}; // サンカラ形態用のデータを保持
            // ★ サンカラ突進攻撃用プロパティ ★
        this.sankaraRushTimer = null;
        this.isSankaraRushing = false; // 現在突進中かどうかのフラグ
        this.sowakaData = {};  // ソワカ形態用のデータを保持

        // ソワカのフィールド効果用
        this.sowakaFieldActive = false;
        this.sowakaFieldTimer = null;
        this.sowakaFieldDuration = 15000; // 例: フィールド効果15秒
        this.sowakaFieldCooldown = 10000; // 例: 再展開まで10秒
        this.sowakaLimitedItemType = null; // 限定されるアイテムタイプ
    }

    init(data) {
        super.init(data); // 親のinitを呼び出す
        this.isSankaraRushing = false; // シーン初期化時にリセット
        if (this.sankaraRushTimer) {
            this.sankaraRushTimer.remove();
            this.sankaraRushTimer = null;
        }
    }

    // initializeBossData: 現在のフェーズに応じて適切なボスデータをロード
    initializeBossData() {
        console.log(`--- Boss2Scene initializeBossData (Phase: ${this.currentPhase}) ---`);

        // サンカラ形態のデータを定義
        this.sankaraData = {
            health: 10,
            textureKey: 'boss_sankara_stand', // ★ アセット準備後に正しいキーに
            negativeKey: 'boss_sankara_negative', // ★
            voiceAppear: AUDIO_KEYS.VOICE_SANKARA_APPEAR,
            voiceDamage: AUDIO_KEYS.VOICE_SANKARA_DAMAGE,
            voiceDefeat: AUDIO_KEYS.VOICE_SANKARA_DEFEAT, // 形態変化時のボイス
            voiceRandom: [
                AUDIO_KEYS.VOICE_SANKARA_RANDOM_1,
                AUDIO_KEYS.VOICE_SANKARA_RANDOM_2
            ],
            bgmKey: AUDIO_KEYS.BGM1,
            cutsceneText: 'VS サンカラ',
            widthRatio: 0.22, // サンカラの見た目幅の割合 (要調整)
            moveRangeXRatio: 0.7,
            moveDuration: 3800,
            // サンカラ固有の攻撃パラメータ
            sankaraRushIntervalMin: 5000, // 突進攻撃の最小間隔 (ms)
            sankaraRushIntervalMax: 8000, // 突進攻撃の最大間隔 (ms)
            sankaraRushSpeed: 450,        // 突進速度
            sankaraBrickReleaseCount: 3,  // 1回の突進でのブロック放出回数
            sankaraBrickAngleMin: 30,     // ブロック放出角度の最小 (左右対称)
            sankaraBrickAngleMax: 60,     // ブロック放出角度の最大
            sankaraBrickVelocity: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 30, // 少し速め
        };

        // ソワカ形態のデータを定義
        this.sowakaData = {
            health: 10,
            textureKey: 'boss_sowaka_stand', // ★ アセット準備後に正しいキーに
            negativeKey: 'boss_sowaka_negative', // ★
            voiceAppear: AUDIO_KEYS.VOICE_SOWAKA_APPEAR,
            voiceDamage: AUDIO_KEYS.VOICE_SOWAKA_DAMAGE,
            voiceDefeat: AUDIO_KEYS.VOICE_SOWAKA_DEFEAT,
            voiceRandom: [
                AUDIO_KEYS.VOICE_SOWAKA_RANDOM_1,
                AUDIO_KEYS.VOICE_SOWAKA_RANDOM_2
            ],
            bgmKey: AUDIO_KEYS.BGM2,
            cutsceneText: 'VS ソワカ', // ソワカ登場時のカットシーン用
            widthRatio: 0.23, // ソワカの見た目幅の割合 (要調整)
            moveRangeXRatio: 0.65,
            moveDuration: 3500,
            // ソワカ固有の攻撃パラメータ
            sowakaAttackIntervalMin: 3000,
            sowakaAttackIntervalMax: 6000,
            sowakaBrickCount: 5, // 放射状ブロックの数
            sowakaBrickAngleSpread: 90, // 5個のブロックを90度の範囲に放射 (-45 to 45)
            sowakaBrickVelocity: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 50, // さらに速め
            // ソワカフィールド関連
            sowakaFieldItemCandidates: [ // 限定アイテムの候補
                POWERUP_TYPES.ANCHIRA, POWERUP_TYPES.SINDARA, POWERUP_TYPES.INDARA,
                POWERUP_TYPES.BIKARA, POWERUP_TYPES.BAISRAVA, POWERUP_TYPES.VAJRA,
                POWERUP_TYPES.BADRA
            ]
        };

        // 現在のフェーズに応じて this.bossData を設定
        if (this.currentPhase === 'sankara') {
            this.bossData = { ...this.sankaraData }; // スプレッド構文でコピー
        } else if (this.currentPhase === 'sowaka') {
            this.bossData = { ...this.sowakaData };
        } else {
            console.error("Invalid phase in Boss2Scene:", this.currentPhase);
            this.bossData = { ...this.sankaraData }; // デフォルトはサンカラ
        }

        // CommonBossScene のプロパティも更新
        this.bossVoiceKeys = Array.isArray(this.bossData.voiceRandom) ? this.bossData.voiceRandom : [];
        console.log(`Boss2Scene (${this.currentPhase}) Specific Data Initialized:`, this.bossData);
    }

    // createSpecificBoss: ボスオブジェクトを生成 (Commonのを呼ぶ)
    createSpecificBoss() {
        console.log(`--- Boss2Scene createSpecificBoss (Phase: ${this.currentPhase}) ---`);
        // CommonBossScene の汎用生成メソッドを呼び出し、
        // this.bossData (initializeBossDataで設定済み) を使ってボスを生成・初期化
        super.createSpecificBoss();

        if (this.boss) {
            console.log(`Boss2 (${this.currentPhase}) created successfully.`);
            // UIへの初期HP反映 (CommonBossSceneのsetupUIが遅延実行するので、ここでも念のため発行)
            this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth'));
            this.events.emit('updateBossNumber', this.currentBossIndex, this.totalBosses); // ボス番号も
        } else {
            console.error(`Boss2 (${this.currentPhase}) could not be created!`);
        }
    }

    // startSpecificBossMovement: 各形態の動きを開始
    startSpecificBossMovement() {
        console.log(`--- Boss2Scene startSpecificBossMovement (Phase: ${this.currentPhase}) ---`);
        if (!this.boss || !this.boss.active) {
            console.warn("Cannot start movement, boss not ready.");
            return;
        }
        // CommonBossScene の汎用左右往復移動を開始 (パラメータはthis.bossDataから読まれる)
        super.startSpecificBossMovement();
        console.log(`Boss2 (${this.currentPhase}) movement started.`);
    // ★ 最初の突進攻撃を予約 ★
        if (this.currentPhase === 'sankara' && !this.isSankaraRushing) {
            this.scheduleSankaraRush();
        }
    }

    // updateSpecificBossBehavior: 各形態の攻撃ロジックを呼び出す
    updateSpecificBossBehavior(time, delta) {
        if (!this.playerControlEnabled || !this.boss || !this.boss.active || this.bossDefeated || this.isGameOver) {
            return;
        }

            if (this.currentPhase === 'sankara') {
            // ★ 突進中でなければ、次の突進のスケジューリングを確認 ★
            // (executeSankaraRushの最後に次のスケジュールを呼ぶので、ここでは不要になるかも)
            // if (!this.isSankaraRushing && (!this.sankaraRushTimer || this.sankaraRushTimer.getProgress() === 1)) {
            //     this.scheduleSankaraRush();
            // }
            // サンカラの他の攻撃パターンがあればここに追加
        } else if (this.currentPhase === 'sowaka') {
            this.updateSowakaAttacksAndField(time, delta);
        }
    }

    // --- ▼ サンカラ形態の攻撃ロジック (後で実装) ▼ ---
    updateSankaraAttacks(time, delta) {
        // TODO: 一定時間ごとに突進攻撃を予約・実行するタイマー管理
        // if (!this.sankaraRushTimer || this.sankaraRushTimer.getProgress() === 1) {
        //     this.scheduleSankaraRush();
        // }
    }
   // --- ▼ サンカラ形態の攻撃ロジック ▼ ---

    /**
     * 次のサンカラの突進攻撃をランダムな間隔で予約する
     */
    scheduleSankaraRush() {
        if (this.isSankaraRushing || this.bossDefeated || this.isGameOver) return; // 突進中や終了時は予約しない

        if (this.sankaraRushTimer) this.sankaraRushTimer.remove();

        const minDelay = this.bossData.sankaraRushIntervalMin || 5000;
        const maxDelay = this.bossData.sankaraRushIntervalMax || 8000;
        const nextDelay = Phaser.Math.Between(minDelay, maxDelay);

        console.log(`[Sankara] Scheduling next rush attack in ${nextDelay}ms.`);
        this.sankaraRushTimer = this.time.addEvent({
            delay: nextDelay,
            callback: this.executeSankaraRush,
            callbackScope: this,
            loop: false
        });
    }

    /**
     * サンカラの突進攻撃を実行する (予備動作とターゲット設定まで)
     */
    executeSankaraRush() {
        if (!this.boss || !this.boss.active || this.isSankaraRushing || this.bossDefeated || this.isGameOver) {
            // 条件を満たさなければ次の突進を予約して終了
            if (!this.isSankaraRushing && !this.bossDefeated && !this.isGameOver) this.scheduleSankaraRush();
            return;
        }

        console.log("[Sankara] Executing Rush Attack Sequence...");
        this.isSankaraRushing = true; // 突進開始フラグ
        this.bossMoveTween?.pause(); // 通常の左右移動を一時停止

        // 1. 予備動作: 少し後ろに下がる (Y座標は変えない想定)
        const retreatDistance = this.boss.displayWidth * 0.3; // ボス幅の30%程度後退
        const originalX = this.boss.x; // 元のX座標を覚えておく

        console.log(`[Sankara Rush] Retreating... Original X: ${originalX.toFixed(0)}`);
        this.tweens.add({
            targets: this.boss,
            // ボスが向いている方向と逆へ後退 (X座標のみ)
            // 現在は単純に画面中央から見て遠ざかる方向にしてみる (要調整)
            x: (this.boss.x < this.gameWidth / 2) ? this.boss.x - retreatDistance : this.boss.x + retreatDistance,
            duration: 500, // 0.5秒で後退
            ease: 'Quad.easeOut',
            onComplete: () => {
                console.log("[Sankara Rush] Retreat complete.");
                // 2. パドルのX座標をターゲットとして記録
                const targetPaddleX = this.paddle ? this.paddle.x : this.gameWidth / 2;
                console.log(`[Sankara Rush] Paddle target X acquired: ${targetPaddleX.toFixed(0)}`);

                // TODO: ここに実際の突進移動Tweenと攻撃ブロック放出処理を追加
                console.log("[Sankara Rush] TODO: Implement actual rush movement and projectile launch.");

                // (テスト用) 一定時間後に突進完了として状態を戻し、次の突進を予約
                this.time.delayedCall(1500, () => { // 仮に1.5秒後に突進完了
                    console.log("[Sankara Rush] (Test) Rush finished. Returning to normal movement.");
                    this.boss.x = originalX; // 簡単のため元のX座標に戻す (本来は突進後の位置)
                    this.isSankaraRushing = false;
                    this.bossMoveTween?.resume();
                    this.scheduleSankaraRush(); // 次の突進を予約
                }, [], this);
            }
        });
    }

    spawnSankaraAttackBlock() {
        // TODO: サンカラ本体の左右から斜め下に攻撃ブロックを生成
        // this.bossData.sankaraBrickAngleMin/Max, sankaraBrickVelocity を使用
    }
    // --- ▲ サンカラ形態の攻撃ロジック ▲ ---

    // --- ▼ ソワカ形態の攻撃とフィールドロジック (後で実装) ▼ ---
    updateSowakaAttacksAndField(time, delta) {
        // TODO: フィールド展開/解除/再展開のタイマー管理とロジック
        // if (this.sowakaFieldActive) { ... } else if (!this.sowakaFieldTimer || ...) { this.tryActivateSowakaField(); }

        // TODO: 放射状攻撃ブロックのタイマー管理と実行
        // if (!this.sowakaAttackTimer || this.sowakaAttackTimer.getProgress() === 1) {
        //     this.scheduleSowakaAttack();
        // }
    }
    // ... (ソワカのフィールド管理、攻撃メソッドなど) ...
    // --- ▲ ソワカ形態の攻撃とフィールドロジック ▲ ---


    // --- ▼ 形態変化処理 (後で実装) ▼ ---
    triggerSankaraDefeatAndTransition() {
        console.log("Sankara defeated! Starting transition to Sowaka...");
        // 1. 全リセット (ボール、アイテム、攻撃ブロック、プレイヤーパワーアップ)
        // 2. 時間停止
        // 3. サンカラデフィート演出 (CommonのdefeatBossを参考に、ボイスは専用)
        //    this.sound.play(this.sankaraData.voiceDefeat);
        //    ... (フラッシュ、ネガ、シェイク＆フェード) ...
        //    フェードアウト完了後にソワカ登場へ
        //    onComplete: () => { this.startSowakaAppearance(); }
    }
    startSowakaAppearance() {
        // ソワカカットイン表示
        // ... (カットインテキストは this.sowakaData.cutsceneText)
        // カットイン完了後にソワカ登場演出
        // onComplete: () => {
        //      this.currentPhase = 'sowaka';
        //      this.initializeBossData(); // ソワカ用データに切り替え
        //      this.createSpecificBoss(); // ソワカオブジェクト再生成または更新
        //      this.startFusionIntro();   // Commonの登場演出をソワカデータで実行
        //      // startGameplay は startFusionIntro の完了時に呼ばれる
        //      // ソワカのフィールドを初回展開
        //      this.activateSowakaField();
        // }
    }
    // --- ▲ 形態変化処理 ▲ ---

    // ボス撃破後の共通処理 (最終ボスならゲームクリア、そうでなければ次のボスへ)
    // このシーンでは、ソワカ撃破時に CommonBossScene の handleBossDefeatCompletion が呼ばれる
}
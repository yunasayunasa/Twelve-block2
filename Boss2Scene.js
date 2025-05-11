// Boss2Scene.js (サンカラ＆ソワカ戦)
import CommonBossScene from './CommonBossScene.js';
import {
  // ★★★ ボス撃破演出関連の定数をインポート (もしこのファイル内で直接使うなら) ★★★
    DEFEAT_FLASH_DURATION, DEFEAT_FLASH_INTERVAL, DEFEAT_FLASH_COUNT,
    DEFEAT_SHAKE_DURATION, DEFEAT_FADE_DURATION,CUTSCENE_DURATION, // CommonBossSceneから参照しているが、ここで直接使うなら
    // ★★★--------------------------------------------
      BALL_RADIUS_RATIO, // ★★★ BALL_RADIUS_RATIO をインポート ★★★
    PADDLE_HEIGHT, PADDLE_Y_OFFSET_RATIO, // createAndAddBallで使う可能性のある他の定数も念のため
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
         this.bossDefeatedThisPhase = false; // ★ constructor で初期化
      

        // ソワカのフィールド効果用

         this.sowakaAttackTimer = null; // ★ ソワカ攻撃タイマー用
         // --- ソワカフィールド用プロパティ ---
        this.sowakaFieldActive = false;         // フィールドが現在有効か
        this.sowakaFieldDurationTimer = null;   // フィールド効果の持続時間タイマー
        this.sowakaFieldCooldownTimer = null;   // フィールド再展開までのクールダウンタイマー
        this.sowakaLimitedItemType = null;      // 現在限定されているアイテムのタイプ
        this.sowakaFieldVisual = null;          // ★ フィールドの見た目用オブジェクト (後で使う)
        this.sowakaFieldDamageToDeactivate = 0; // ★ フィールド解除に必要な残りダメージ
    }

    init(data) {
        super.init(data); // 親のinitを呼び出す
        this.currentPhase = 'sankara'; // ★ シーン開始時は必ずサンカラから
        this.isSankaraRushing = false; // シーン初期化時にリセット
        this.bossDefeatedThisPhase = false; // ★ initでも確実にリセット
       
        if (this.sankaraRushTimer) {
            this.sankaraRushTimer.remove();
            this.sankaraRushTimer = null;
        }
           if (this.sowakaAttackTimer) { // ★ ソワカ攻撃タイマーもリセット
            this.sowakaAttackTimer.remove();
            this.sowakaAttackTimer = null;
        }
         // フィールド関連リセット
        this.sowakaFieldActive = false;
        this.sowakaFieldDurationTimer?.remove(); this.sowakaFieldDurationTimer = null;
        this.sowakaFieldCooldownTimer?.remove(); this.sowakaFieldCooldownTimer = null;
        this.sowakaLimitedItemType = null;
        this.sowakaFieldVisual?.destroy(); this.sowakaFieldVisual = null; // ★ 見た目もクリア
    this.sowakaFieldDamageToDeactivate = 0;
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
            sankaraRushIntervalMin: 4000, // 突進攻撃の最小間隔 (ms)
            sankaraRushIntervalMax: 7000, // 突進攻撃の最大間隔 (ms)
            sankaraRushSpeed: 450,        // 突進速度
            sankaraBrickReleaseCount: 3,  // 1回の突進でのブロック放出回数
            sankaraBrickAngleMin: 30,     // ブロック放出角度の最小 (左右対称)
            sankaraBrickAngleMax: 60,     // ブロック放出角度の最大
            sankaraBrickVelocity: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 30, // 少し速め
        };

        // ソワカ形態のデータを定義
        this.sowakaData = {
            health: 20,
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
             sowakaAttackIntervalMin: 2500,  // 攻撃の最小間隔 (ms) - 要調整
            sowakaAttackIntervalMax: 4500,  // 攻撃の最大間隔 (ms) - 要調整
            sowakaProjectileCount: 3,       // 常に3個
            sowakaProjectileAngles: [75, 90, 105], // 放射角度 (度)
            sowakaProjectileVelocity: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 60, // サンカラより少し速く
            sowakaProjectileScale: this.sankaraData.attackBrickScale || 0.2, // サンカラと同じスケールを使う例
            // ★★★--------------------------★★★
            // ソワカフィールド関連
              sowakaFieldDuration: 30000, // フィールド効果時間 (ms)
            sowakaFieldCooldown: 10000, // 再展開までのクールダウン (ms)
            sowakaFieldDamageThreshold: 5, // ★ フィールド解除に必要な総ダメージ量 (例: 5ダメージ)
            sowakaFieldItemCandidates: [
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
        super.startSpecificBossMovement(); // Commonの左右移動を開始
        console.log(`[Boss2Scene] Boss (${this.currentPhase}) movement started.`);
        if (this.currentPhase === 'sankara' && !this.isSankaraRushing) {
            this.scheduleSankaraRush();
        } else if (this.currentPhase === 'sowaka') {
            // ★ ソワカの最初の放射攻撃を予約 ★
            console.log("[Boss2Scene] Scheduling first Sowaka radial attack.");
            this.scheduleSowakaAttack();
            // ★ ここでソワカのフィールド初回展開も呼び出すのが良い
            if (!this.sowakaFieldActive) { // まだ展開されていなければ
                 this.activateSowakaField(); // (このメソッドは後で実装)
            }
        }
    }

   // updateSpecificBossBehavior: 各形態の攻撃ロジックを呼び出す
    updateSpecificBossBehavior(time, delta) {
        if (!this.playerControlEnabled || !this.boss || !this.boss.active || this.bossDefeated || this.isGameOver) {
            return;
        }

        if (this.currentPhase === 'sankara') {
            // サンカラの突進攻撃のスケジューリングは executeSankaraRush の onComplete で行う
        } else if (this.currentPhase === 'sowaka') {
            // ★ ソワカの放射攻撃タイマーをチェック (scheduleSowakaAttackで予約される) ★
            // (タイマーが完了したら spawnSowakaRadialAttack が呼ばれ、その中で次の予約をする)
            // ★ ソワカのフィールド効果の更新/再展開処理もここで行う ★
           // this.updateSowakaField(time, delta); // (このメソッドは後で実装)
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
    // Boss2Scene.js の executeSankaraRush メソッドを修正

     /**
     * サンカラの突進攻撃を実行する
     */
    executeSankaraRush() {
        if (!this.boss || !this.boss.active || this.isSankaraRushing || this.bossDefeated || this.isGameOver) {
            if (!this.isSankaraRushing && !this.bossDefeated && !this.isGameOver) this.scheduleSankaraRush();
            return;
        }

        console.log("[Sankara] Executing Rush Attack Sequence...");
        this.isSankaraRushing = true;
        this.bossMoveTween?.pause();

        const retreatDistanceY = this.boss.displayHeight * 0.4;
        const originalY = this.boss.y;
        const targetRetreatY = Math.max(this.boss.displayHeight / 2 + this.topMargin, originalY - retreatDistanceY); // 上部マージンも考慮

        console.log(`[Sankara Rush] Retreating upwards...`);
        this.tweens.add({
            targets: this.boss,
            y: targetRetreatY,
            duration: 400,
            ease: 'Quad.easeOut',
            onComplete: () => {
                console.log("[Sankara Rush] Retreat complete.");
                const targetPaddleX = this.paddle ? this.paddle.x : this.gameWidth / 2;
                // ★★★ 突進の目標Y座標 (パドルの少し上、または画面下端など) ★★★
                const targetRushY = this.paddle ? this.paddle.y - this.paddle.displayHeight : this.gameHeight - this.boss.displayHeight / 2 - 20;
                console.log(`[Sankara Rush] Targeting Paddle X: ${targetPaddleX.toFixed(0)}, Target Rush Y: ${targetRushY.toFixed(0)}`);

                // ★★★ 突進移動のTween ★★★
                const rushDuration = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, targetPaddleX, targetRushY) / (this.bossData.sankaraRushSpeed || 450) * 1000; // 距離と速度から時間を計算
                console.log(`[Sankara Rush] Calculated rush duration: ${rushDuration.toFixed(0)}ms`);

                this.tweens.add({
                    targets: this.boss,
                    x: targetPaddleX,
                    y: targetRushY,
                    duration: Math.max(500, rushDuration), // 最低0.5秒はかける
                    ease: 'Quad.easeIn', // 加速する感じ
                    onUpdate: (tween, target) => {
                        // ★ 突進中に攻撃ブロックを放出する処理 (タイミング調整) ★
                        // この onUpdate は毎フレーム呼ばれるので、回数やタイミングを管理する
                        // ここではTweenの進行度に応じて3回放出する例
                        const progress = tween.progress;
                        // bossDataに attackReleaseTimings: [0.2, 0.4, 0.6] のように定義しておくと良い
                        const releaseTimings = this.bossData.sankaraBrickReleaseTimings || [0.25, 0.5, 0.75]; // 進行度 25%, 50%, 75% で放出

                        releaseTimings.forEach((timing, index) => {
                            // 各タイミングで一度だけ放出されるようにフラグ管理
                            if (!target[`releasedBrickSet${index}`] && progress >= timing) {
                                console.log(`[Sankara Rush] Releasing brick set ${index + 1} at progress ${progress.toFixed(2)}`);
                                this.spawnSankaraAttackBlock(); // 左右に1個ずつ放出
                                target[`releasedBrickSet${index}`] = true; // 放出済みフラグ
                            }
                        });
                    },
                    onComplete: () => {
                        console.log("[Sankara Rush] Rush to target complete.");
                        // リリースフラグをリセット
                        const releaseTimings = this.bossData.sankaraBrickReleaseTimings || [0.25, 0.5, 0.75];
                        releaseTimings.forEach((timing, index) => {
                            this.boss[`releasedBrickSet${index}`] = false;
                        });

                        // 元のY座標に戻るTween
                        console.log("[Sankara Rush] Returning to original Y position.");
                        this.tweens.add({
                            targets: this.boss,
                            y: originalY,
                            duration: 600, // 0.6秒で戻る
                            ease: 'Quad.easeOut',
                            onComplete: () => {
                                console.log("[Sankara Rush] Return complete. Resuming normal movement.");
                                this.isSankaraRushing = false;
                                this.bossMoveTween?.resume();
                                this.scheduleSankaraRush(); // 次の突進を予約
                            }
                        });
                    }
                });
                // ★★★-----------------------★★★
            }
        });
    }

      /**
     * サンカラがパドルに接触した際にダメージを受けるかの判定
     * サンカラが突進中 (isSankaraRushing === true) の場合のみダメージ
     */
    shouldPaddleTakeDamageFromBossContact(paddle, boss) {
        if (this.currentPhase === 'sankara' && this.isSankaraRushing) {
            // さらに、ボスが無敵時間中でないことも確認 (CommonのapplyBossDamageで考慮済みだが念のため)
            // if (!boss.getData('isInvulnerable')) {
            //     return true;
            // }
            return true; // サンカラ突進中はダメージ
        }
        // ソワカ形態での接触ダメージ条件もここに追加できる
        if (this.currentPhase === 'sowaka' && this.isSowakaSomeAttackActive) return true;
        return false; // それ以外はダメージなし
    }

    /**
     * サンカラの攻撃ブロックを左右に1個ずつ放出する
     */
   // Boss2Scene.js

    /**
     * サンカラの攻撃ブロックを左右に1個ずつ放出する
     */
  // Boss2Scene.js

    /**
     * サンカラの攻撃ブロックを左右に1個ずつ放出する (アートマンの生成方式を参考)
     */
    spawnSankaraAttackBlock() {
        if (!this.attackBricks || !this.boss || !this.boss.active) {
            console.warn("[SpawnSankaraBlock] Conditions not met to spawn bricks.");
            return;
        }

        const bossX = this.boss.x;
        const bossY = this.boss.y + this.boss.displayHeight / 4; // 発射開始Y座標
        const velocity = this.bossData.sankaraBrickVelocity || 200;
        const textureKey = 'attack_brick_common'; // ★ 新しい共通テクスチャキー
        const displayScale = this.bossData.attackBrickScale || 0.2;

        const angleMin = this.bossData.sankaraBrickAngleMin || 30;
        const angleMax = this.bossData.sankaraBrickAngleMax || 60;

        console.log(`[SpawnSankaraBlock - ArtmanStyle] Spawning. Texture: ${textureKey}, Scale: ${displayScale}`);

        // 左斜め下
        const angleLeft = Phaser.Math.Between(180 - angleMax, 180 - angleMin);
        const velocityLeft = this.physics.velocityFromAngle(angleLeft, velocity);
        const brickLeft = this.attackBricks.create(bossX, bossY, textureKey); // ★ create時にテクスチャ指定
        if (brickLeft) {
            brickLeft.setScale(displayScale); // スケール設定
            brickLeft.setVelocity(velocityLeft.x, velocityLeft.y); // 速度設定
            if (brickLeft.body) {
                brickLeft.body.setAllowGravity(false);
                brickLeft.body.setCollideWorldBounds(false);
                // ★ 物理ボディに関する他の明示的な設定は行わない ★
            }
            console.log(`  Spawned Left Brick. DisplaySize: ${brickLeft.displayWidth.toFixed(1)}x${brickLeft.displayHeight.toFixed(1)}`);
        } else {
            console.error("[SpawnSankaraBlock] Failed to create left brick.");
        }

        // 右斜め下
        const angleRight = Phaser.Math.Between(angleMin, angleMax);
        const velocityRight = this.physics.velocityFromAngle(angleRight, velocity);
        const brickRight = this.attackBricks.create(bossX, bossY, textureKey); // ★ create時にテクスチャ指定
        if (brickRight) {
            brickRight.setScale(displayScale); // スケール設定
            brickRight.setVelocity(velocityRight.x, velocityRight.y); // 速度設定
            if (brickRight.body) {
                brickRight.body.setAllowGravity(false);
                brickRight.body.setCollideWorldBounds(false);
                // ★ 物理ボディに関する他の明示的な設定は行わない ★
            }
            console.log(`  Spawned Right Brick. DisplaySize: ${brickRight.displayWidth.toFixed(1)}x${brickRight.displayHeight.toFixed(1)}`);
        } else {
            console.error("[SpawnSankaraBlock] Failed to create right brick.");
        }
    }

     /**
     * ソワカが放射状に3つの攻撃ブロックを放出する
     */
   // Boss2Scene.js の spawnSowakaRadialAttack を修正

    spawnSowakaRadialAttack() {
        if (!this.attackBricks || !this.boss || !this.boss.active || this.currentPhase !== 'sowaka') {
            this.scheduleSowakaAttack();
            return;
        }
        console.log("--- Sowaka Spawning Radial Attack (Minimal Body Setup) ---");

        const bossX = this.boss.x;
        const bossY = this.boss.y + this.boss.displayHeight / 3;
        const velocity = this.bossData.sowakaProjectileVelocity || 220;
        const textureKey = 'attack_brick_common'; // ★ 共通テクスチャ
        const displayScale = this.bossData.sowakaProjectileScale || 0.2;
        const angles = this.bossData.sowakaProjectileAngles || [-105, -90, -75];

        angles.forEach(angleDeg => {
            // ★★★ 攻撃ブロック生成と最小限の設定 ★★★
            const attackBrick = this.attackBricks.create(bossX, bossY, textureKey);
            if (attackBrick) {
                attackBrick.setOrigin(0.5, 0.5); // 原点は中心に
                attackBrick.setScale(displayScale);

                const projectileVelocity = this.physics.velocityFromAngle(angleDeg, velocity);
                attackBrick.setVelocity(projectileVelocity.x, projectileVelocity.y);

                if (attackBrick.body) {
                    attackBrick.body.setAllowGravity(false);
                    attackBrick.body.setCollideWorldBounds(false); // 画面外で消える処理はCommonにある
                    // setSize, setOffset, updateFromGameObject は呼び出さない
                    // refreshBody も不要
                }
                console.log(`  Spawned Sowaka brick (Angle: ${angleDeg} deg). DisplaySize: ${attackBrick.displayWidth.toFixed(1)}x${attackBrick.displayHeight.toFixed(1)}`);
            } else {
                console.error("[Sowaka Attack] Failed to create an attack brick.");
            }
            // ★★★-----------------------------------★★★
        });
        this.scheduleSowakaAttack();
    }
    

  handleZeroHealth(bossInstance) {
        console.log(`[Boss2Scene handleZeroHealth] Called for phase: ${this.currentPhase}. Boss defeated this phase: ${this.bossDefeatedThisPhase}`);
        if (this.currentPhase === 'sankara') {
            if (!this.bossDefeatedThisPhase) { // ★ まだサンカラ撃破処理が開始されていなければ
                console.log("[Boss2Scene] Sankara's health is zero. Triggering transition to Sowaka.");
                this.triggerSankaraDefeatAndTransitionToSowaka(bossInstance);
            } else {
                console.log("[Boss2Scene] Sankara defeat sequence ALREADY TRIGGERED. Ignoring duplicate call.");
            }
        } else if (this.currentPhase === 'sowaka') {
            // ソワカが倒されたら CommonBossScene の通常の撃破処理
            if (!this.bossDefeated) { // Commonの全体撃破フラグもチェック
                 console.log("[Boss2Scene] Sowaka's health is zero. Calling Common's defeatBoss.");
                 super.defeatBoss(bossInstance); // Commonの defeatBoss を呼ぶ
            } else {
                 console.log("[Boss2Scene] Sowaka defeat (via Common) ALREADY TRIGGERED.");
            }
        } else { /* ... */ }
    }

    // ★ 新しいメソッド：サンカラ撃破とソワカへの移行処理を開始
    triggerSankaraDefeatAndTransitionToSowaka(sankaraBossObject) {
        // このメソッドの冒頭の this.bossDefeatedThisPhase = true; は正しい
        console.log("[Boss2Scene] triggerSankaraDefeatAndTransitionToSowaka actually executing.");   // this.bossDefeated = true; // ← Commonのフラグはまだ立てない
        this.bossDefeatedThisPhase = true; // ★ この形態は倒された
        this.playerControlEnabled = false;


        // 1. 全リセット (ボール、アイテム、攻撃ブロック、プレイヤーパワーアップ)
        console.log("[Transition] Clearing game objects and player power-ups...");
        this.balls?.clear(true, true);
        this.powerUps?.clear(true, true);
        this.attackBricks?.clear(true, true);
        // プレイヤーパワーアップ解除 (loseLifeから持ってくる)
     //   this.deactivateMakira(); 
        this.deactivateAnila(); /* ...他のパワーアップ解除... */
        Object.values(this.powerUpTimers).forEach(timer => timer?.remove()); this.powerUpTimers = {};
        Object.values(this.bikaraTimers).forEach(timer => timer?.remove()); this.bikaraTimers = {};
        this.isVajraSystemActive = false; this.vajraGauge = 0; // ヴァジラもリセット
        this.events.emit('deactivateVajraUI');
        this.events.emit('updateDropPoolUI', []); // ドロッププールもクリア
        // TODO: ボールのパワーアップ状態 (isKubiraActiveなど) もリセットする必要があるか確認

        // 2. 時間停止 (演出用)
        console.log("[Transition] Pausing physics and tweens...");
        this.physics.pause();
        this.tweens.pauseAll(); // シーン全体のTweenを止める (必要なら)
        this.bossMoveTween?.pause(); // サンカラの動きを確実に止める

         // 3. サンカラのデフィート演出
        console.log("[Transition] Starting Sankara's defeat visual sequence...");
        if (sankaraBossObject?.active) {
            // ★★★ まず撃破ボイスを再生 ★★★
            if (this.sankaraData.voiceDefeat) {
                try {
                    this.sound.play(this.sankaraData.voiceDefeat);
                    console.log(`[Transition] Playing Sankara defeat voice: ${this.sankaraData.voiceDefeat}`);
                } catch (e) { console.error("Error playing Sankara defeat voice:", e); }
            }

            // ★★★ 次に他の音を止める (BGM以外) ★★★
            console.log("[Transition] Stopping active game sounds (except BGM and current defeat voice).");
            this.randomVoiceTimer?.remove(); // 戦闘中ランダムボイス停止
            this.attackBrickTimer?.remove(); // 攻撃ブロック生成タイマー停止 (サンカラの)
            // 他にサンカラ戦特有のループ音などがあればここで停止
            // this.sound.stopByKey('some_sankara_loop_se');

            // ネガ反転
            try { sankaraBossObject.setTexture(this.sankaraData.negativeKey); } catch(e) {}
            // フラッシュ (DEFEAT_FLASH_COUNT は Boss2Scene で import されていること)
            console.log("[Transition] Starting flash sequence...");
            for (let i = 0; i < DEFEAT_FLASH_COUNT; i++) {
                this.time.delayedCall(i * DEFEAT_FLASH_INTERVAL, () => {
                    if (!this.scene.isActive() || !this.bossDefeatedThisPhase) return; // シーンが有効かつ処理が継続中か
                    this.cameras.main.flash(DEFEAT_FLASH_DURATION, 255, 255, 255);
                    console.log(`[Transition] Flash ${i + 1}`);
                }, [], this);
            }

          this.tweens.resumeAll()
        

         // シェイク＆フェード (完了後にソワカ登場処理を呼ぶ)
        console.log(`[Transition Debug] Using constants - DEFEAT_SHAKE_DURATION: ${DEFEAT_SHAKE_DURATION}, DEFEAT_FADE_DURATION: ${DEFEAT_FADE_DURATION}`);
        const shakeDuration = (DEFEAT_SHAKE_DURATION || 1200) / 1.5;
        const fadeDuration = (DEFEAT_FADE_DURATION || 1500) / 1.5;
        const fadeDelay = shakeDuration * 0.2;
        console.log(`[Transition] Starting Shake (calc dur: ${shakeDuration.toFixed(0)}) and Fade (calc dur: ${fadeDuration.toFixed(0)}, delay: ${fadeDelay.toFixed(0)}) for Sankara.`);

        if (sankaraBossObject.active) {
            // ★★★ シェイクTweenを try...catch で囲む ★★★
            try {
                console.log("[Transition] Attempting to add Shake Tween for Sankara...");
                this.tweens.add({
                    targets: sankaraBossObject,
                    props: { x: { value: `+=${sankaraBossObject.displayWidth * 0.03}`, duration: 40, yoyo: true, ease: 'Sine.InOut' }, y: { value: `+=${sankaraBossObject.displayWidth * 0.015}`, duration: 50, yoyo: true, ease: 'Sine.InOut' } },
                    repeat: Math.max(0, Math.floor(shakeDuration / 50) -1)
                });
                console.log("[Transition] Shake Tween for Sankara ADDED.");
            } catch (e) {
                console.error("!!! ERROR creating Shake Tween for Sankara:", e);
            }
            // ★★★--------------------------------------★★★

            // ★★★ フェードアウトTweenを try...catch で囲む ★★★
            try {
                console.log("[Transition] Attempting to add Fade Tween for Sankara...");
                this.tweens.add({
                    targets: sankaraBossObject,
                    alpha: 0,
                    duration: fadeDuration,
                    delay: fadeDelay,
                    ease: 'Linear',
                    onComplete: () => {
                        console.log("[Transition] Sankara fade out complete.");
                        if (sankaraBossObject && sankaraBossObject.scene) {
                            sankaraBossObject.destroy();
                        }
                        this.startSowakaAppearance();
                    }
                });
                console.log("[Transition] Fade Tween for Sankara ADDED.");
            } catch (e) {
                console.error("!!! ERROR creating Fade Tween for Sankara:", e);
            }
            // ★★★-----------------------------------------★★★
        } else {
             console.warn("[Transition] Sankara object was inactive before shake/fade could start.");
             this.startSowakaAppearance(); // ボスがいなければ直接次へ
        }
        }}    

  // Boss2Scene.js の startSowakaAppearance メソッドを修正

      startSowakaAppearance() {
        console.log("[Boss2Scene] startSowakaAppearance called.");
        this.bossDefeatedThisPhase = false; // ソワカ戦開始のため、このフェーズの撃破フラグをリセット

        // フェーズとボスデータをソワカ用に切り替え
        console.log("[Transition] Setting phase to Sowaka and re-initializing bossData...");
        this.currentPhase = 'sowaka';
        this.initializeBossData(); // this.bossData がソワカ用に更新される

        // ★★★ ソワカ専用のカットイン演出を開始 ★★★
        this.triggerSowakaCutscene();
    }

    // ★★★ 新しいメソッド：ソワカ専用カットイン演出 ★★★
    triggerSowakaCutscene() {
        console.log("[SowakaCutscene] Starting Sowaka's cutscene...");
        // CommonBossSceneのstartIntroCutsceneのロジックを参考に、ソワカ用に調整
        const cutsceneDurationToUse = CUTSCENE_DURATION || 1800; // constants.jsからかデフォルト値
        try { this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START); } catch(e) {} // 必要ならカットインSE

        const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x100010, 0.8) // ソワカ用オーバーレイ色
            .setOrigin(0,0).setDepth(1900);

        // this.bossData は initializeBossData でソワカ用に更新済みのはず
        const sowakaImage = this.add.image(this.gameWidth / 2, this.gameHeight / 2, this.bossData.textureKey)
            .setOrigin(0.5, 0.5).setDepth(1901);
        const targetImageWidth = this.gameWidth * 0.75;
        sowakaImage.displayWidth = targetImageWidth;
        sowakaImage.scaleY = sowakaImage.scaleX;

        const textContent = this.bossData.cutsceneText; // ソワカ用のカットシーンテキスト
        const fontSize = this.calculateDynamicFontSize(50); // ソワカ用フォントサイズ
        const textStyle = { fontSize: `${fontSize}px`, fill: '#ffeecc', stroke: '#330011', strokeThickness: Math.max(4, fontSize*0.1), fontFamily: 'MyGameFont, sans-serif', align: 'center' };
        const vsText = this.add.text(this.gameWidth / 2, sowakaImage.getBounds().bottom + this.gameHeight * 0.04, textContent, textStyle)
            .setOrigin(0.5, 0).setDepth(1902);

        console.log(`[SowakaCutscene] Displaying text: "${textContent}"`);

        // 一定時間後に要素を破棄し、ソワカの登場演出（フュージョン）へ
        this.time.delayedCall(cutsceneDurationToUse, () => {
            console.log("[SowakaCutscene] End. Proceeding to Sowaka's boss object creation and fusion intro.");
            if (overlay.scene) overlay.destroy();
            if (sowakaImage.scene) sowakaImage.destroy();
            if (vsText.scene) vsText.destroy();

            // 1. ソワカのボスオブジェクトを生成/設定 (Commonのメソッドを利用)
            super.createSpecificBoss(); // this.bossData はソワカ用なので、これでソワカが設定される
            if (!this.boss) {
                console.error("!!! FAILED TO CREATE SOWAKA BOSS OBJECT before fusion intro !!!");
                this.scene.start('TitleScene'); return;
            }
            console.log("[SowakaCutscene] Sowaka boss object created/updated:", this.boss);
            // UIにHPを反映 (createSpecificBoss内で既に呼ばれている可能性もあるが念のため)
            this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth'));
            this.events.emit('updateBossNumber', this.currentBossIndex, this.totalBosses);


            // 2. ソワカ登場演出 (Commonの左右合体演出を使用)
            this.startFusionIntro(); // this.bossData.voiceAppear でソワカボイスが流れるはず
                                    // このメソッドの完了時に CommonBossScene の startGameplay が呼ばれる

            // 3. ★★★ ボールを再生成 (startGameplayが呼ばれる前が良いか後が良いか) ★★★
            // startGameplay は playerControlEnabled = true にするので、その前にボールがないとおかしい。
            // かつ、isBallLaunched = false にしたい。
            // フュージョン演出が完了し、startGameplay が呼ばれる【直前】にボールを準備するのが自然。
            // CommonBossSceneのstartFusionIntroのonCompleteでstartGameplayを呼んでいるので、
            // その onComplete の中でボール生成を挟むか、あるいは startGameplay をオーバーライドする。

            // 今回は、ソワカの startFusionIntro が完了し、startGameplay が呼び出される
            // CommonBossScene の startGameplay の中で、現在のボスがソワカならボールを生成する、という形にするか、
            // もっと単純に、このカットシーン完了時にボールを生成し、isBallLaunched = false にしておく。
            console.log("[SowakaAppearance] Clearing any existing balls and creating a new one for Sowaka phase.");
            if (this.balls) this.balls.clear(true, true);
            else this.balls = this.physics.add.group({ bounceX: 1, bounceY: 1, collideWorldBounds: true });

            if (this.paddle && this.paddle.active) {
                 this.createAndAddBall(this.paddle.x, this.paddle.y - (this.paddle.displayHeight / 2) - (this.gameWidth * BALL_RADIUS_RATIO));
            } else {
                 this.createAndAddBall(this.gameWidth / 2, this.gameHeight * 0.7);
            }
            this.isBallLaunched = false; // ★ 新しいボールは未発射状態
            console.log(`[SowakaAppearance] New ball created. isBallLaunched: ${this.isBallLaunched}`);
            // ★★★-----------------------------------------------------------------★★★


            // 4. 物理演算とTweenを再開
            //    (CommonBossSceneのstartGameplayで playerControlEnabled=true になるタイミングで
            //     this.physics.resume() も行う方が一貫性があるかもしれない)
            console.log("[SowakaAppearance] Resuming physics and tweens for Sowaka phase.");
            this.tweens.resumeAll();
            this.physics.resume();

            // 5. ソワカのフィールドを初回展開
            //    (これも startGameplay の後や、ソワカの updateSpecificBossBehavior で管理する方が良いかも)
            this.activateSowakaField(); // ← 新しいメソッド (後で中身を実装)

        }, [], this);
    }
     // applyBossDamage (CommonBossSceneでオーバーライド)
    // ボスダメージ時にフィールド解除をトリガー
    applyBossDamage(bossInstance, damageAmount, source = "Unknown") {
        const wasFieldActiveBeforeDamage = this.sowakaFieldActive; // ダメージ前のフィールド状態を記憶

        super.applyBossDamage(bossInstance, damageAmount, source); // まず親のダメージ処理

        // ★★★ ソワカのフィールド効果中にダメージを受けたら ★★★
        if (this.currentPhase === 'sowaka' && this.sowakaFieldActive && bossInstance === this.boss && damageAmount > 0 && !this.bossDefeated) {
            this.sowakaFieldDamageToDeactivate -= damageAmount;
            console.log(`[SowakaField] Damaged while field active. Damage taken for field: ${damageAmount}, Remaining to deactivate: ${this.sowakaFieldDamageToDeactivate}`);

            if (this.sowakaFieldDamageToDeactivate <= 0) {
                console.log("[Sowaka] Field damage threshold reached, deactivating field effect.");
                this.deactivateSowakaField(false); // 時間切れではない解除
            }
        }
        // ★★★-------------------------------------------★★★
    }


     /**
     * 次のソワカの放射攻撃をランダムな間隔で予約する
     */
    scheduleSowakaAttack() {
        if (this.currentPhase !== 'sowaka' || !this.boss || !this.boss.active || this.bossDefeated || this.isGameOver) {
            return; // ソワカでない、または戦闘終了時は予約しない
        }
        if (this.sowakaAttackTimer) this.sowakaAttackTimer.remove();

        const minDelay = this.bossData.sowakaAttackIntervalMin || 2500;
        const maxDelay = this.bossData.sowakaAttackIntervalMax || 4500;
        const nextDelay = Phaser.Math.Between(minDelay, maxDelay);

        console.log(`[Sowaka] Scheduling next radial attack in ${nextDelay}ms.`);
        this.sowakaAttackTimer = this.time.addEvent({
            delay: nextDelay,
            callback: this.spawnSowakaRadialAttack,
            callbackScope: this,
            loop: false
        });
    }

    // activateSowakaField メソッドの骨子 (後で実装)
    /**
     * ソワカのフィールド効果を展開する
     */
    activateSowakaField() {
        if (this.currentPhase !== 'sowaka' || this.sowakaFieldActive || this.bossDefeated || this.isGameOver) {
            console.log(`[SowakaField Activate] Conditions not met or already active/ended. Phase: ${this.currentPhase}, FieldActive: ${this.sowakaFieldActive}, BossDefeated: ${this.bossDefeated}, GameOver: ${this.isGameOver}`);
            return;
        }
        console.log("[SowakaField] Activating field...");
        this.sowakaFieldActive = true;

        // 1. 限定アイテムを選定
        if (this.bossData.sowakaFieldItemCandidates && this.bossData.sowakaFieldItemCandidates.length > 0) {
            this.sowakaLimitedItemType = Phaser.Utils.Array.GetRandom(this.bossData.sowakaFieldItemCandidates);
            console.log(`[SowakaField] Limited item type set to: ${this.sowakaLimitedItemType}`);
        } else {
            this.sowakaLimitedItemType = null;
            console.warn("[SowakaField] No item candidates defined!");
        }

        // 2. UIに通知 (後で実装)
        this.events.emit('sowakaFieldUpdate', { active: true, itemType: this.sowakaLimitedItemType, duration: this.bossData.sowakaFieldDuration });
        console.log("[SowakaField] Emitted sowakaFieldUpdate event (activated).");

        // 3. 効果時間タイマーを開始
        const duration = this.bossData.sowakaFieldDuration;
        this.sowakaFieldDurationTimer?.remove();
        this.sowakaFieldDurationTimer = this.time.delayedCall(duration, () => {
            console.log("[SowakaField] Field duration ended by timer.");
            this.deactivateSowakaField(true); // true は時間切れを示す
        }, [], this);
        console.log(`[SowakaField] Duration timer started for ${duration}ms.`);

            // ★★★ フィールド展開モーション ★★★
        console.log("[SowakaField] Starting field activation animation.");
        // 既存のビジュアルがあれば破棄
        this.sowakaFieldVisual?.destroy();

        // 半透明の円を生成 (画面中央)
        this.sowakaFieldVisual = this.add.circle(this.gameWidth / 2, this.gameHeight / 2, 0, 0x6600cc, 0.5); // 初期半径0、紫っぽい色、透明度30%
        this.sowakaFieldVisual.setDepth(-1); // ボスやボールより後ろ、背景より手前くらい

        // Tweenで円を画面全体を覆うくらいまで広げる
        const targetRadius = Math.max(this.gameWidth, this.gameHeight) / 1.5; // 画面の長辺の半分強くらい
        this.tweens.add({
            targets: this.sowakaFieldVisual,
            radius: targetRadius,
            alpha: { from: 0, to: 0.5 }, // 最初は見えなくて徐々に現れる
            duration: 800, // 0.8秒で広がる (調整可能)
            ease: 'Sine.easeOut' // ゆっくり広がる感じ
        });
       // ★★★ フィールド解除に必要なダメージを設定 ★★★
        this.sowakaFieldDamageToDeactivate = this.bossData.sowakaFieldDamageThreshold || 5;
        console.log(`[SowakaField] Damage needed to deactivate field: ${this.sowakaFieldDamageToDeactivate}`);
        // ★★★-----------------------------------★★★
    }


    /**
     * ソワカのフィールド効果を解除する
     * @param {boolean} [triggeredByTimeout=false] 時間切れで解除された場合は true
     */
    deactivateSowakaField(triggeredByTimeout = false) {
        if (!this.sowakaFieldActive) return;
        console.log(`[SowakaField] Deactivating field... Triggered by timeout: ${triggeredByTimeout}`);
        this.sowakaFieldActive = false;
        this.sowakaLimitedItemType = null; // 限定アイテムを解除
        this.sowakaFieldDurationTimer?.remove(); // 効果時間タイマーが残っていればクリア
        this.sowakaFieldDurationTimer = null;

        // UIに通知
        this.events.emit('sowakaFieldUpdate', { active: false, itemType: null });
        console.log("[SowakaField] Emitted sowakaFieldUpdate event (deactivated).");
 // ★★★ フィールド解除モーション ★★★
        if (this.sowakaFieldVisual && this.sowakaFieldVisual.active) {

               // ★★★ 消えるアニメーションの開始アルファを targetAlpha に合わせる ★★★
            const currentAlpha = this.sowakaFieldVisual.alpha; // 現在のアルファ (Tween中かもしれないので)
            const startAlphaForFadeOut = Math.min(currentAlpha, 0.5); // 例: activateSowakaFieldのtargetAlphaと同じ
            // ★★★-------------------------------------------------------★★★
            console.log("[SowakaField] Starting field deactivation animation.");
            this.tweens.add({
                targets: this.sowakaFieldVisual,
                alpha: 0, // 透明にして消す
                radius: this.sowakaFieldVisual.radius * 0.5, // 少し縮みながら消える (任意)
                duration: 500, // 0.5秒で消える (調整可能)
                ease: 'Sine.easeIn',
                onComplete: () => {
                    this.sowakaFieldVisual?.destroy(); // アニメーション完了後に破棄
                    this.sowakaFieldVisual = null;
                    console.log("[SowakaField] Visual field object destroyed.");
                }
            });
        } else {
            this.sowakaFieldVisual?.destroy(); // 即座に破棄
            this.sowakaFieldVisual = null;
        }
        // ★★★--------------------------★★★
        // クールダウンタイマーを開始して再展開を予約 (戦闘中のみ)
        if (!this.bossDefeated && !this.isGameOver) {
            const cooldown = this.bossData.sowakaFieldCooldown;
            this.sowakaFieldCooldownTimer?.remove();
            console.log(`[SowakaField] Starting cooldown timer for ${cooldown}ms.`);
            this.sowakaFieldCooldownTimer = this.time.delayedCall(cooldown, () => {
                console.log("[SowakaField] Cooldown ended. Attempting to reactivate field.");
                this.sowakaFieldCooldownTimer = null;
                this.activateSowakaField(); // 再展開
            }, [], this);
        } else {
             console.log("[SowakaField] Boss defeated or game over, not scheduling field reactivation.");
        }
    }


    // startGameplay をオーバーライドして、ソワカ登場時のボールとフィールド処理を確実にする
    startGameplay() {
        super.startGameplay(); // 親の処理 (playerControlEnabled=true, ボス移動開始, ランダムボイス)

        if (this.currentPhase === 'sowaka') {
            console.log("[Boss2 startGameplay] Specific setup for Sowaka phase.");
            // ボールがまだ生成されていなければここで生成 (startSowakaAppearanceで既に生成済みなら不要)
            if (this.balls && this.balls.countActive(true) === 0) { // ボールがない場合のみ
                console.log("[Boss2 startGameplay] No active balls, creating one for Sowaka.");
                if (this.paddle && this.paddle.active) {
                    this.createAndAddBall(this.paddle.x, this.paddle.y - (this.paddle.displayHeight / 2) - (this.gameWidth * BALL_RADIUS_RATIO));
                } else {
                    this.createAndAddBall(this.gameWidth / 2, this.gameHeight * 0.7);
                }
                this.isBallLaunched = false;
                  console.log(`[${this.scene.key} startGameplay for Sowaka] Calling setColliders. Boss active: ${this.boss?.active}, Boss body enabled: ${this.boss?.body?.enable}`);
        this.setColliders(); // ★ ここで確実に呼ぶ
            }

            // ソワカのフィールドを初回展開
            // (startSowakaAppearanceで呼ぶか、ここで呼ぶか、updateSpecificBossBehaviorで管理するかは設計次第)
            // ここで呼ぶ方が、戦闘開始と同時感が出る
             if (!this.sowakaFieldActive) { // まだ展開されていなければ
                this.activateSowakaField();
         }
        }
    


        this.tweens.resumeAll();
        this.physics.resume();
        console.log("[Transition] Physics and tweens resumed.");
    }
       // shutdownScene でタイマーとビジュアルをクリア
    shutdownScene() {
        super.shutdownScene(); // 親のシャットダウン処理を呼ぶ
        this.sowakaFieldDurationTimer?.remove();
        this.sowakaFieldCooldownTimer?.remove();
        this.sowakaFieldVisual?.destroy(); // ★ フィールドビジュアルも破棄
        this.sowakaFieldDurationTimer = null;
        this.sowakaFieldCooldownTimer = null;
        this.sowakaFieldVisual = null;
    }

    // activateSowakaField() やソワカの攻撃メソッドはこれから実装

    // --- ▲ 形態変化処理 ▲ ---

    // ボス撃破後の共通処理 (最終ボスならゲームクリア、そうでなければ次のボスへ)
    // このシーンでは、ソワカ撃破時に CommonBossScene の handleBossDefeatCompletion が呼ばれる
}
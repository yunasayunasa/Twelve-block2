// Boss2Scene.js (サンカラ＆ソワカ戦)
import CommonBossScene from './CommonBossScene.js';
import {
  // ★★★ ボス撃破演出関連の定数をインポート (もしこのファイル内で直接使うなら) ★★★
    DEFEAT_FLASH_DURATION, DEFEAT_FLASH_INTERVAL, DEFEAT_FLASH_COUNT,
    DEFEAT_SHAKE_DURATION, DEFEAT_FADE_DURATION,CUTSCENE_DURATION, // CommonBossSceneから参照しているが、ここで直接使うなら
    // ★★★--------------------------------------------
     
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
        this.sowakaFieldActive = false;
        this.sowakaFieldTimer = null;
        this.sowakaFieldDuration = 15000; // 例: フィールド効果15秒
        this.sowakaFieldCooldown = 10000; // 例: 再展開まで10秒
        this.sowakaLimitedItemType = null; // 限定されるアイテムタイプ
        this.bossDefeatedThisPhase = false; // ★ 形態ごとの撃破フラグ
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
        // if (this.currentPhase === 'sowaka' && this.isSowakaSomeAttackActive) return true;
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
        // ... (フェーズ変更、データ初期化、ボスオブジェクト生成、フュージョンイントロ開始まで) ...
        this.startFusionIntro(); // Commonの左右合体演出

        // startGameplay は startFusionIntro の完了時に CommonBossScene によって呼ばれる。
        // startGameplay の中で startSpecificBossMovement (ソワカ用) も呼ばれる。

        // ★★★ ソワカ戦開始時にボールを再生成 ★★★
        // startGameplay が呼ばれた後、またはその直前の適切なタイミングで。
        // ここでは、フュージョン演出後に戦闘準備が整う startGameplay の中で行うのが良いかもしれない。
        // CommonBossScene の startGameplay をオーバーライドしてボール生成を挟むか、
        // あるいは、startFusionIntro の onComplete で startGameplay を呼ぶ前にボールを生成する。

        // より簡単なのは、startGameplay が呼ばれた後にボールを生成することです。
        // CommonBossScene の startGameplay の最後にボール生成をフックする、
        // または Boss2Scene で startGameplay をオーバーライドする。

        // 今回は、ソワカのフィールド展開などもあるので、
        // ソワカの戦闘開始準備が全て整った後 (startGameplayが呼ばれた後) にボールを出すのが自然。
        // CommonBossSceneのstartGameplayを呼び出す前にisBallLaunchedをfalseにしておき、
        // 最初のタップでボールが発射されるようにする。

        console.log("[Transition] Sowaka appearance sequence initiated.");

        this.tweens.resumeAll();
        this.physics.resume();
        console.log("[Transition] Physics and tweens resumed.");

        // ★★★ isBallLaunched を false に戻し、ボール再生成を促す ★★★
        this.isBallLaunched = false; // これにより、次のタップで launchBall が呼ばれる
        // ただし、ボールオブジェクトがまだ存在しない。

        // ★★★ ボールオブジェクトをここで生成する ★★★
        // (resetForNewLife と同様のロジックで)
        console.log("[Sowaka Start] Creating initial ball for Sowaka phase.");
        if (this.balls) this.balls.clear(true, true); // 念のため既存をクリア
        else this.balls = this.physics.add.group({ bounceX: 1, bounceY: 1, collideWorldBounds: true }); // なければ作成

        if (this.paddle && this.paddle.active) {
             this.createAndAddBall(this.paddle.x, this.paddle.y - (this.paddle.displayHeight / 2) - (this.gameWidth * BALL_RADIUS_RATIO));
        } else {
             this.createAndAddBall(this.gameWidth / 2, this.gameHeight * 0.7);
        }
        // ★★★--------------------------------------★★★

        // ソワカのフィールドを初回展開
        this.activateSowakaField(); // ← 新しいメソッドを後で作成
    }

    // (もし CommonBossScene の startGameplay をオーバーライドする場合)
    // startGameplay() {
    //     super.startGameplay(); // 親の処理を呼ぶ
    //     // ★ ここでボールを生成 ★
    //     if (this.currentPhase === 'sowaka') {
    //         console.log("[Boss2 startGameplay] Creating ball for Sowaka.");
    //         if (this.balls) this.balls.clear(true, true);
    //         else this.balls = this.physics.add.group({ /* ... */ });
    //         this.createAndAddBall(/* ... */);
    //         this.isBallLaunched = false;
    //         // フィールド展開
    //         this.activateSowakaField();
    //     }
    // }

    // ★★★ 新しいメソッド：ソワカ専用カットイン演出 ★★★
    triggerSowakaCutscene() {
        console.log("[SowakaCutscene] Starting Sowaka's cutscene...");

        // (時間停止中のはずなので、必要ならここで this.tweens.resumeAll() や this.physics.resume() を一時的に行うか、
        //  あるいはカットイン要素は時間停止の影響を受けない add.image などを使う)
        //  Commonのカットインは時間停止の影響を受けないように作られているはず。

        // CommonBossSceneのstartIntroCutsceneのロジックを参考に、ソワカ用に調整
        const cutsceneDuration = CUTSCENE_DURATION || 2500; // constants.js からかデフォルト値
        // try { this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START); } catch(e) {} // カットイン開始SE

        const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x110022, 0.8) // 少し色味を変えるなど
            .setOrigin(0,0).setDepth(1900); // 他のUIやポップアップより手前だが、ゲームクリアよりは奥

        // ソワカの画像 (this.bossData.textureKey は initializeBossData でソワカ用に更新済みのはず)
        const sowakaImage = this.add.image(this.gameWidth / 2, this.gameHeight / 2, this.bossData.textureKey)
            .setOrigin(0.5, 0.5).setDepth(1901);
        const targetImageWidth = this.gameWidth * 0.75;
        sowakaImage.displayWidth = targetImageWidth;
        sowakaImage.scaleY = sowakaImage.scaleX;

        // VS ソワカ テキスト (this.bossData.cutsceneText もソワカ用に更新済みのはず)
        const textContent = this.bossData.cutsceneText || "VS ソワカ";
        const fontSize = this.calculateDynamicFontSize(52); // 少し大きめでも良いかも
        const textStyle = { fontSize: `${fontSize}px`, fill: '#ffeecc', stroke: '#330011', strokeThickness: Math.max(4, fontSize*0.1), fontFamily: 'MyGameFont, sans-serif', align: 'center' };
        const vsText = this.add.text(this.gameWidth / 2, sowakaImage.getBounds().bottom + this.gameHeight * 0.04, textContent, textStyle)
            .setOrigin(0.5, 0).setDepth(1902);

        console.log(`[SowakaCutscene] Displaying text: "${textContent}"`);

        // 一定時間後に要素を破棄し、ソワカの登場演出（フュージョン）へ
        this.time.delayedCall(cutsceneDuration, () => {
            console.log("[SowakaCutscene] End. Proceeding to Sowaka's fusion intro.");
            if (overlay.scene) overlay.destroy();
            if (sowakaImage.scene) sowakaImage.destroy();
            if (vsText.scene) vsText.destroy();

            // ★★★ ソワカのボスオブジェクトを生成/設定し、フュージョン演出開始 ★★★
            super.createSpecificBoss(); // this.bossData はソワカ用になっているので、これでソワカが設定される
            if (!this.boss) {
                console.error("!!! FAILED TO CREATE SOWAKA BOSS OBJECT before fusion intro !!!");
                this.scene.start('TitleScene'); return;
            }
            console.log("[SowakaCutscene] Sowaka boss object created/updated:", this.boss);

            this.startFusionIntro(); // Commonの左右合体演出 (this.bossData.voiceAppear でソワカボイス)
            // startGameplay は startFusionIntro の完了時に呼ばれ、物理演算もそこで再開される想定
            // ソワカのフィールド初回展開は startGameplay の後か、updateSpecificBossBehavior で行う
            // this.activateSowakaField(); // ← タイミングを再検討

        }, [], this);
    
    // ★★★------------------------------------------★★★

        // startGameplay は startFusionIntro の完了時に CommonBossScene によって呼ばれる
        // その中でソワカの動き (startSpecificBossMovement) も開始される

        // ★ ソワカのフィールドを初回展開 (startGameplayの後がより安全かもしれない)
        // this.time.delayedCall(GAMEPLAY_START_DELAY + 500, this.activateSowakaField, [], this);
        // または、ソワカの updateSpecificBossBehavior で初回フィールド展開を管理
        console.log("[Transition] Sowaka appearance sequence initiated.");

        this.tweens.resumeAll();
        this.physics.resume();
        console.log("[Transition] Physics and tweens resumed.");
    }

    // activateSowakaField() やソワカの攻撃メソッドはこれから実装

    // --- ▲ 形態変化処理 ▲ ---

    // ボス撃破後の共通処理 (最終ボスならゲームクリア、そうでなければ次のボスへ)
    // このシーンでは、ソワカ撃破時に CommonBossScene の handleBossDefeatCompletion が呼ばれる
}
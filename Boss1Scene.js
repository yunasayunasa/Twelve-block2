// Boss1Scene.js (CommonBossSceneを継承し、旧BossSceneの挙動を移植)
import CommonBossScene from './CommonBossScene.js';
import { AUDIO_KEYS, DEFAULT_ATTACK_BRICK_SPAWN_DELAY_MIN, DEFAULT_ATTACK_BRICK_SPAWN_DELAY_MAX, DEFAULT_ATTACK_BRICK_VELOCITY_Y } from './constants.js';


export default class Boss1Scene extends CommonBossScene {
    constructor() {
        super('Boss1Scene'); // 親クラスにシーンキーを渡す
        // ボス1固有の状態変数などがあればここで初期化
        // 例: this.attackPhase = 1;
    }

    /**
     * ボス1固有のデータを初期化
     * 旧BossSceneの設定を元に値を設定
     */
     initializeBossData() {
        console.log("--- Boss1Scene initializeBossData (Artman HL) ---");
        this.bossData = {
            health: 20,
            textureKey: 'bossStand',
            negativeKey: 'bossNegative',
            // ★★★ アートマンHL専用のボイスキーを設定 ★★★
            voiceAppear: AUDIO_KEYS.VOICE_ARTMAN_APPEAR,    // 内容はボイス
            voiceDamage: AUDIO_KEYS.VOICE_ARTMAN_DAMAGE,    // アートマン専用被ダメージ
            voiceDefeat: AUDIO_KEYS.VOICE_ARTMAN_DEFEAT,    // アートマン専用撃破
            voiceRandom: [                                  // アートマン専用ランダムボイス配列
                AUDIO_KEYS.VOICE_ARTMAN_RANDOM_1,
                AUDIO_KEYS.VOICE_ARTMAN_RANDOM_2,
                AUDIO_KEYS.VOICE_ARTMAN_RANDOM_3
            ],
            // ★★★------------------------------------★★★
           bgmKey: AUDIO_KEYS.BGM2,
            cutsceneText: 'VS アートマンHL',
            widthRatio: 0.22,
            moveRangeXRatio: 0.65,
            moveDuration: 4200,
            attackIntervalMin: 600,
            attackIntervalMax: 1400,
            attackVelocityY: 150,
            attackSpawnFromTopChance: 0.5,
            attackBrickScale: 0.2
        };
         // CommonBossScene のプロパティも更新 (これが重要！)
        this.bossVoiceKeys = Array.isArray(this.bossData.voiceRandom) ? this.bossData.voiceRandom : [];
        console.log("Artman HL Specific Data Initialized:", this.bossData);
        console.log("Artman HL Random Voices Set:", this.bossVoiceKeys);
    }

 createSpecificBoss() {
        super.createSpecificBoss(); // Common の処理で this.boss が生成・初期化される

        if (this.boss) {
            console.log(`Boss2 (${this.currentPhase}) created successfully.`);
            // ★★★ ボス生成後にUI初期化イベントを発行 ★★★
            this.time.delayedCall(50, () => { // UISceneの準備を少し待つ
                if (this.scene.isActive('UIScene')) { // UISceneがアクティブか確認
                    console.log(`[${this.scene.key} Create] Emitting initial UI updates.`);
                    this.events.emit('updateLives', this.lives);
                    this.events.emit('updateBossNumber', this.currentBossIndex, this.totalBosses);
                    this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth'));
                    this.events.emit('deactivateVajraUI'); // ボス戦開始時はリセット
                    this.events.emit('updateDropPoolUI', this.bossDropPool); // setupBossDropPool後
                } else {
                     console.warn(`[${this.scene.key} Create] UIScene not active, cannot emit initial UI updates.`);
                }
            }, [], this);
            // ★★★------------------------------------★★★
        } else { /* エラー処理 */ }
    }

    /**
     * ボス1固有の動きを開始 (旧BossSceneのランダムイージング左右往復)
     */
    startSpecificBossMovement() {
        console.log("--- Boss1Scene startSpecificBossMovement (Random Ease) ---");
        if (!this.boss || !this.boss.active) {
            console.warn("Cannot start movement, boss not ready.");
            return;
        }
        // 既存のTweenがあれば停止・削除
        if (this.bossMoveTween) {
            this.tweens.killTweensOf(this.boss); // 対象のTweenを停止・削除
            this.bossMoveTween = null;
        }

        const moveWidth = this.gameWidth * this.bossData.moveRangeXRatio / 2;
        const leftX = this.gameWidth / 2 - moveWidth;
        const rightX = this.gameWidth / 2 + moveWidth;
        const startX = this.gameWidth / 2; // 開始位置
        this.boss.setX(startX); // 初期位置を中央に

        const easeFunctions = [ 'Sine.easeInOut', 'Quad.easeInOut', 'Cubic.easeInOut', 'Quart.easeInOut', 'Expo.easeInOut', 'Circ.easeInOut' ];

        const moveToRight = () => {
            if (!this.boss?.active || this.isGameOver || this.bossDefeated) return;
            const randomEase = Phaser.Utils.Array.GetRandom(easeFunctions);
            this.bossMoveTween = this.tweens.add({
                targets: this.boss, x: rightX, duration: this.bossData.moveDuration,
                ease: randomEase, onComplete: moveToLeft
            });
        };
        const moveToLeft = () => {
            if (!this.boss?.active || this.isGameOver || this.bossDefeated) return;
            const randomEase = Phaser.Utils.Array.GetRandom(easeFunctions);
            this.bossMoveTween = this.tweens.add({
                targets: this.boss, x: leftX, duration: this.bossData.moveDuration,
                ease: randomEase, onComplete: moveToRight
            });
        };
        moveToRight(); // 開始
        console.log("Boss1 random ease movement initiated.");
    }

    // アートマン登場時の特別なインパクトSEを鳴らす場合は、startFusionIntroをオーバーライド
    startFusionIntro() {
        console.log("[Boss1Scene] Overriding startFusionIntro for Artman HL specific SE.");
        // CommonBossScene の基本的なフュージョン演出を呼び出す
        super.startFusionIntro(); // これにより this.bossData.voiceAppear が再生される

        // アートマン専用の登場インパクトSEを追加で再生 (少し遅らせるなど調整可能)
        // CommonBossSceneのstartFusionIntroで共通インパクトSE (SE_FLASH_IMPACT_COMMON) も鳴るので、
        // アートマンだけ違う音にしたい、または追加で鳴らしたい場合に記述。
        // もしCommonのSE_FLASH_IMPACT_COMMONで十分なら、このオーバーライドは不要。
        this.time.delayedCall(100, () => { // 例: 0.1秒遅延
             try {
                 console.log("[Boss1Scene] Playing Artman specific impact SE:", AUDIO_KEYS.SE_ARTMAN_IMPACT);
                 this.sound.play(AUDIO_KEYS.SE_ARTMAN_IMPACT);
             } catch(e) { console.error("Error playing Artman specific impact SE:", e); }
        }, [], this);
    }


    /**
     * ボス1固有の行動更新 (旧BossSceneの攻撃パターン)
     */
    updateSpecificBossBehavior(time, delta) {
        // タイマーを使って攻撃を管理
        if (!this.attackBrickTimer || this.attackBrickTimer.getProgress() === 1) {
             if (this.playerControlEnabled && this.boss && this.boss.active && !this.bossDefeated && !this.isGameOver) {
                 this.scheduleNextBoss1Attack(); // 次の攻撃を予約
             }
         }
         // ボス1固有の他の行動（例：HPによるパターン変化など）があればここに追加
    }

    /**
     * ボス1用の次の攻撃を予約するメソッド
     */
    scheduleNextBoss1Attack() {
        if (this.attackBrickTimer) this.attackBrickTimer.remove();
        const nextDelay = Phaser.Math.Between(
            this.bossData.attackIntervalMin,
            this.bossData.attackIntervalMax
        );
        this.attackBrickTimer = this.time.addEvent({
            delay: nextDelay,
            callback: this.spawnBoss1Attack, // ボス1用の攻撃生成メソッドを呼ぶ
            callbackScope: this,
            loop: false // 攻撃生成後に再度スケジュールする
        });
    }

    /**
     * ボス1用の攻撃を生成するメソッド (旧BossSceneのロジック)
     */
    spawnBoss1Attack() {
        // CommonBossSceneから必要なプロパティを参照
        if (!this.attackBricks || !this.boss?.active || this.isGameOver || this.bossDefeated) {
            this.scheduleNextBoss1Attack(); // 攻撃できない状況でも次の予約はする
            return;
        }
        console.log("--- Boss1 Spawning Attack ---");

        let spawnX;
        const spawnY = -30; // 画面上部から

        // 旧BossSceneの生成位置決定ロジック
        if (Phaser.Math.FloatBetween(0, 1) < this.bossData.attackSpawnFromTopChance) {
            spawnX = Phaser.Math.Between(this.sideMargin, this.gameWidth - this.sideMargin); // 画面上部のランダムな位置
        } else {
            spawnX = this.boss.x; // ボスの現在位置
        }

        const brickTexture = 'attackBrick'; // 使用するテクスチャ
        const attackBrick = this.attackBricks.create(spawnX, spawnY, brickTexture);

        if (attackBrick) {
            // スケール設定 (bossDataから取得、なければデフォルト)
            const brickScale = this.bossData.attackBrickScale || 0.2;
            attackBrick.setScale(brickScale);
            // 落下速度設定 (bossDataから取得、なければデフォルト)
            attackBrick.setVelocityY(this.bossData.attackVelocityY || DEFAULT_ATTACK_BRICK_VELOCITY_Y);

            if (attackBrick.body) {
                attackBrick.body.setAllowGravity(false).setCollideWorldBounds(false);
                // 必要に応じて当たり判定サイズ調整
                // attackBrick.body.setSize(...).setOffset(...);
            }
            console.log(`Boss1 attack brick spawned at (${spawnX.toFixed(0)}, ${spawnY})`);
        } else {
            console.error("Failed to create Boss1 attack brick!");
        }
        // 次の攻撃を予約
        this.scheduleNextBoss1Attack();
    }

    /**
     * ボス1撃破後の遷移
     * CommonBossSceneのデフォルト処理（次のボスへ）を呼び出す
     */
    handleBossDefeatCompletion() {
        console.log("--- Boss1Scene handleBossDefeatCompletion ---");
        // CommonBossScene のデフォルト処理を呼び出して次のシーンへ遷移
        super.handleBossDefeatCompletion();
    }

    // ボス1固有のメソッドがあればここに追加
    // (例: 特定の体力になったら攻撃パターンを変えるメソッドなど)
}
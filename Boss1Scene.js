// Boss1Scene.js (CommonBossSceneを継承し、旧BossSceneの挙動を移植)
import CommonBossScene from './CommonBossScene.js';
import {
    AUDIO_KEYS,
    // ボス1固有の挙動で直接使う定数があればここに追加
    // (多くの定数は CommonBossScene または this.bossData 経由で利用)
    DEFAULT_ATTACK_BRICK_SPAWN_DELAY_MIN, // Commonのデフォルト値を参照する場合など
    DEFAULT_ATTACK_BRICK_SPAWN_DELAY_MAX,
    DEFAULT_ATTACK_BRICK_VELOCITY_Y
  //  ATTACK_BRICK_ITEM_DROP_RATE // これは chaosSettings で上書きされるはずだが念のため
} from './constants.js';

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
        console.log("--- Boss1Scene initializeBossData ---");
        // 旧BossSceneで使われていた値をボス1のデータとして設定
        const oldBossMaxHealth = 20; // 旧BossSceneの値 (少なすぎるので調整)
        const oldBossScore = 1500;   // 旧BossSceneの値 (スコアは廃止だが参考)
        const oldMoveRangeRatio = 0.8; // 旧BossSceneの値
        const oldMoveDuration = 4000;  // 旧BossSceneの値

        this.bossData = {
            health: 10,                     // HPを調整 (旧20 -> 150)
            textureKey: 'bossStand',         // 旧BossSceneで使用していたテクスチャ
            negativeKey: 'bossNegative',     // 旧BossSceneで使用していたテクスチャ
            voiceAppear: AUDIO_KEYS.VOICE_BOSS_APPEAR, // 旧BossSceneで使用していたボイス
            voiceDamage: AUDIO_KEYS.VOICE_BOSS_DAMAGE, // 旧BossSceneで使用していたボイス
            voiceDefeat: AUDIO_KEYS.VOICE_BOSS_DEFEAT, // 旧BossSceneで使用していたボイス
            voiceRandom: [                   // 旧BossSceneで使用していたランダムボイス
                AUDIO_KEYS.VOICE_BOSS_RANDOM_1,
                AUDIO_KEYS.VOICE_BOSS_RANDOM_2,
                AUDIO_KEYS.VOICE_BOSS_RANDOM_3
            ],
            bgmKey: AUDIO_KEYS.BGM2,         // 旧BossSceneで使用していたBGM (BGM2)
            cutsceneText: 'VS アートマンHL',      // 旧BossSceneのカットシーンテキスト

            // --- ボスの見た目・動きに関するデータ ---
            widthRatio: 0.20,                // 旧BossSceneのupdateBossSizeでの計算に近い値？ (要調整)
            moveRangeXRatio: oldMoveRangeRatio, // 旧BossSceneの移動範囲
            moveDuration: oldMoveDuration,     // 旧BossSceneの移動時間

            // --- ボス1固有の攻撃データ (旧BossSceneの攻撃パターンを反映) ---
            attackIntervalMin: 600, // 旧BossSceneの値 (ATTACK_BRICK_SPAWN_DELAY_MIN)
            attackIntervalMax: 1400, // 旧BossSceneの値 (ATTACK_BRICK_SPAWN_DELAY_MAX)
            attackVelocityY: 150, // 旧BossSceneの値 (ATTACK_BRICK_VELOCITY_Y)
            attackSpawnFromTopChance: 0.5, // 旧BossSceneの値
            attackBrickScale: 0.2 // 旧BossSceneで設定していた値 (要調整)
            // ---
        };
        // CommonBossScene のプロパティも更新
        this.bossVoiceKeys = this.bossData.voiceRandom;
        console.log("Boss1 Specific Data Initialized:", this.bossData);
    }

    createSpecificBoss() {
        console.log("--- Boss1Scene createSpecificBoss ---");
        // ★ super を呼ぶ前後の this.boss の状態を確認
        console.log("[Boss1Scene] Value of this.boss BEFORE calling super.createSpecificBoss:", this.boss);
        super.createSpecificBoss(); // Commonの汎用生成メソッドを呼び出す
        console.log("[Boss1Scene] Value of this.boss AFTER calling super.createSpecificBoss:", this.boss);
        if (this.boss) {
            console.log("[Boss1Scene] Boss body object AFTER super call:", this.boss.body);
             console.log(`[Boss1Scene] Boss body enabled state AFTER super call: ${this.boss.body?.enable}`);
        }
        // ★------------------------------------------★

        if(this.boss) {
            console.log("Boss1 created successfully using CommonBossScene method.");
            // UIへのHP反映イベント発行
             try {
                 this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth'));
                 console.log("[Boss1Scene] Emitted updateBossHp event.");
             } catch (e) { console.error("!!! Error emitting updateBossHp event:", e); }
        } else {
            console.error("!!! Boss1 could not be created after calling super.createSpecificBoss !!!");
        }
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
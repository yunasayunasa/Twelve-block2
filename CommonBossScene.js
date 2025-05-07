// CommonBossScene.js (ボスラッシュ共通ロジック)
import {
    // --- 画面・オブジェクトサイズ/位置 (割合ベース) ---
    PADDLE_WIDTH_RATIO, PADDLE_Y_OFFSET_RATIO,
    BALL_RADIUS_RATIO, POWERUP_SIZE_RATIO,
    MAKIRA_FAMILIAR_SIZE_RATIO, MAKIRA_FAMILIAR_OFFSET_RATIO,
    MAKIRA_BEAM_WIDTH_RATIO, MAKIRA_BEAM_HEIGHT_RATIO, // MAKIRA_BEAM_HEIGHT_RATIO は実際には長さが速度依存
    // BOSS_MOVE_RANGE_X_RATIO, // ボス固有データで管理推奨

    // --- UI関連 (割合ベース) ---
    UI_BOTTOM_OFFSET_RATIO, DROP_POOL_UI_ICON_SIZE_RATIO, DROP_POOL_UI_SPACING_RATIO,
    UI_TOP_MARGIN_MIN, UI_TOP_MARGIN_RATIO, UI_SIDE_MARGIN_MIN, UI_SIDE_MARGIN_RATIO,
    UI_FONT_SIZE_MIN, UI_FONT_SIZE_MAX, UI_FONT_SIZE_SCALE_DIVISOR,

    // --- 固定ピクセル値 ---
    PADDLE_HEIGHT, PHYSICS_BALL_RADIUS,

    // --- 速度・物理 ---
    BALL_INITIAL_VELOCITY_Y, BALL_INITIAL_VELOCITY_X_RANGE, NORMAL_BALL_SPEED,
    POWERUP_SPEED_Y, BALL_SPEED_MODIFIERS,
    INDARA_HOMING_SPEED_MULTIPLIER, MAKIRA_BEAM_SPEED, MAKIRA_ATTACK_INTERVAL,
    FAMILIAR_MOVE_SPEED_X,

    // --- 色 ---
    MAKIRA_BEAM_COLOR, PADDLE_NORMAL_TINT, PADDLE_ANILA_TINT,

    // --- ゲームシステム (ボスラッシュ) ---
    TOTAL_BOSSES, BAISRAVA_DROP_RATE,
    VAJRA_GAUGE_MAX, VAJRA_GAUGE_INCREMENT,

    // --- パワーアップ ---
    POWERUP_TYPES, ALL_POSSIBLE_POWERUPS, POWERUP_ICON_KEYS, POWERUP_DURATION,
    MAKORA_COPYABLE_POWERS, ANILA_DURATION, ANCHIRA_DURATION, BIKARA_DURATION,

    // --- 音声キー ---
    AUDIO_KEYS
} from './constants.js';

// --- 共通ボス戦用定数 (CommonBossScene内で使用) ---
// (これらは各ボスシーンでオーバーライドされるボスデータで上書きされることが多い)
const COMMON_BOSS_MAX_HEALTH = 100; // デフォルト値、ボスごとに設定
const COMMON_BOSS_SCORE_ON_DEFEAT = 0; // スコアは廃止

// ボスの動き設定 (共通のデフォルト値、ボスごとに変更可能)
const DEFAULT_BOSS_MOVE_DURATION = 4000; // 片道にかかる時間 (ms)
const DEFAULT_BOSS_MOVE_RANGE_X_RATIO = 0.7; // 画面幅の70%を往復 (ボスごとに調整)

// 演出・サウンド関連定数 (共通で使用)
const CUTSCENE_DURATION = 1800;
const CUTSCENE_FLASH_DURATION = 200;
const INTRO_FLASH_DURATION = 200;
const ZOOM_IN_DURATION = 1300;
const ZOOM_WAIT_DURATION = 200;
const SHRINK_DURATION = 50;
const SHRINK_FLASH_DURATION = 150;
const VOICE_START_DELAY = 100;
const GAMEPLAY_START_DELAY = 600; // ボイス再生から操作可能になるまでの遅延
const BOSS_RANDOM_VOICE_MIN_DELAY = 8000;
const BOSS_RANDOM_VOICE_MAX_DELAY = 15000;
const BOSS_DAMAGE_VOICE_THROTTLE = 2000;
const DEFEAT_FLASH_DURATION = 150;
const DEFEAT_FLASH_INTERVAL = 700; // 少し短縮
const DEFEAT_FLASH_COUNT = 3;
const DEFEAT_SHAKE_DURATION = 1200;
const DEFEAT_FADE_DURATION = 1500;

// 攻撃ブロック関連の共通定数 (ボスによって攻撃パターンは異なる)
const ATTACK_BRICK_VELOCITY_Y = 180; // 少し速く
const ATTACK_BRICK_SPAWN_DELAY_MIN = 700; // ボス固有の攻撃間隔で調整
const ATTACK_BRICK_SPAWN_DELAY_MAX = 1500;// ボス固有の攻撃間隔で調整
const ATTACK_BRICK_ITEM_DROP_RATE = 0.35; // ボス固有の攻撃ブロックからのドロップ率

const PADDLE_ANILA_ALPHA = 0.9;
const MAKORA_COPY_DELAY = 150;
// const INDARA_HOMING_SPEED = NORMAL_BALL_SPEED * INDARA_HOMING_SPEED_MULTIPLIER; // update内で計算

export default class CommonBossScene extends Phaser.Scene {
    constructor(sceneKey = 'CommonBossScene') { // 継承先でキーを渡せるように
        super(sceneKey);

        // --- プレイヤー関連 ---
        this.paddle = null;
        this.balls = null;
        this.lives = 3;
        this.playerControlEnabled = true;
        this.isBallLaunched = false;

        // --- ボス関連 ---
        this.boss = null;
        this.bossData = {}; // ボス固有データを格納 (HP, textures, voice keys, etc.)
        this.bossMoveTween = null;
        this.bossAfterImageEmitter = null;
        this.bossDefeated = false;
        this.randomVoiceTimer = null;
        this.lastDamageVoiceTime = 0;
        this.bossVoiceKeys = []; // ボス固有のランダムボイスキー

        // --- 攻撃ブロック関連 ---
        this.attackBricks = null;
        this.attackBrickTimer = null; // ボス固有の攻撃生成タイマー

        // --- パワーアップ関連 ---
        this.powerUps = null;
        this.bossDropPool = [];
        this.powerUpTimers = {}; // { type: Phaser.Time.TimerEvent }
        this.isVajraSystemActive = false;
        this.vajraGauge = 0;
        this.isAnilaActive = false;
        this.anilaTimer = null;
        this.anchiraTimer = null;
        this.bikaraTimers = {}; // { ball.name: Phaser.Time.TimerEvent }
        this.isMakiraActive = false;
        this.makiraAttackTimer = null;
        this.familiars = null; // マキラ子機
        this.makiraBeams = null; // マキラビーム

        // --- ゲーム進行・状態 ---
        this.currentBossIndex = 1; // 現在のボス番号 (1から)
        this.totalBosses = TOTAL_BOSSES; // 総ボス数
        this.chaosSettings = { count: 4, ratePercent: 50 }; // デフォルトのハチャメチャ度
        this.isGameOver = false;
        this.gameClearText = null; // ゲームクリアテキスト
        this.gameOverText = null; // ゲームオーバーテキスト

        // --- コライダー参照 ---
        this.ballPaddleCollider = null;
        this.ballBossCollider = null;
        this.ballAttackBrickCollider = null;
        this.ballAttackBrickOverlap = null; // インダラ/ビカラ用
        this.paddlePowerUpOverlap = null;
        this.paddleAttackBrickCollider = null;
        this.makiraBeamBossOverlap = null;

        // --- UI・その他 ---
        this.uiScene = null;
        this.gameWidth = 0;
        this.gameHeight = 0;
        this.currentBgm = null;
        this.lastPlayedVoiceTime = {}; // パワーアップボイス再生抑制用
        this.voiceThrottleTime = 500;  // 0.5秒

        // --- レスポンシブ対応マージン ---
        this.topMargin = 0;
        this.sideMargin = 0;
    }

    init(data) {
        console.log(`--- ${this.scene.key} INIT ---`);
        console.log("Received data:", data);

        this.lives = data?.lives ?? 3;
        // ハチャメチャ度設定の引き継ぎと正規化
        if (data && data.chaosSettings) {
            this.chaosSettings = {
                count: Phaser.Math.Clamp(data.chaosSettings.count ?? 4, 0, ALL_POSSIBLE_POWERUPS.length),
                ratePercent: Phaser.Math.Clamp(data.chaosSettings.ratePercent ?? 50, 0, 100)
            };
        } else {
            this.chaosSettings = { count: 4, ratePercent: 50 };
        }
        console.log('Chaos Settings Set:', this.chaosSettings);

        this.currentBossIndex = data?.currentBossIndex ?? 1;
        this.totalBosses = TOTAL_BOSSES; // constantsから

        // 各種状態リセット
        Object.values(this.powerUpTimers).forEach(timer => timer?.remove());
        this.powerUpTimers = {};
        this.bossDropPool = [];
        this.isBallLaunched = false;
        this.isGameOver = false;
        this.bossDefeated = false;
        this.playerControlEnabled = true; // 演出開始まではfalseになる
        this.currentBgm = null;
        this.isVajraSystemActive = false;
        this.vajraGauge = 0;
        this.isAnilaActive = false;
        this.anilaTimer?.remove(); this.anilaTimer = null;
        this.anchiraTimer?.remove(); this.anchiraTimer = null;
        Object.values(this.bikaraTimers).forEach(timer => timer?.remove());
        this.bikaraTimers = {};
        this.isMakiraActive = false;
        this.makiraAttackTimer?.remove(); this.makiraAttackTimer = null;
        this.familiars?.destroy(true); this.familiars = null;
        this.makiraBeams?.destroy(true); this.makiraBeams = null;

        this.bossMoveTween?.stop(); this.bossMoveTween = null;
        this.randomVoiceTimer?.remove(); this.randomVoiceTimer = null;
        this.lastDamageVoiceTime = 0;

        // プレースホルダー: ボス固有データの初期化 (継承先で実装)
        this.initializeBossData();
        console.log(`Boss data for ${this.scene.key}:`, this.bossData);

        console.log(`Initialized with Lives: ${this.lives}, Boss: ${this.currentBossIndex}/${this.totalBosses}`);
        console.log(`--- ${this.scene.key} INIT End ---`);
    }

    preload() {
        // アセットはBootSceneで一括ロードするため、ここでは通常何もしない
        console.log(`--- ${this.scene.key} PRELOAD ---`);
    }

    create() {
        console.log(`--- ${this.scene.key} CREATE Start ---`);
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
        this.calculateDynamicMargins(); // 先にマージン計算

        // 1. 背景・UI・物理設定
        this.setupBackground();
        this.setupUI(); // UISceneを起動し連携
        this.setupPhysics();

        // 2. 基本ゲームオブジェクト生成
        this.createPaddle();
        this.createBalls(); // 初期ボールも生成
        this.createPowerUpsGroup();
        this.createAttackBricksGroup(); // ボス共通の攻撃ブロックグループ (攻撃パターンはボス固有)
        this.createMakiraGroups();   // マキラ用グループ

        // 3. ボス固有処理呼び出し (プレースホルダー)
        // createSpecificBoss内でボスオブジェクト(this.boss)が生成されることを期待
        this.createSpecificBoss();
        if (!this.boss) {
            console.error("!!!!!! BOSS OBJECT WAS NOT CREATED BY createSpecificBoss() !!!!!!");
            // フォールバックとしてダミーボスを生成するか、エラーを投げる
            this.boss = this.physics.add.image(this.gameWidth / 2, this.gameHeight * 0.2, 'whitePixel').setTint(0xff00ff).setVisible(false);
            this.boss.setData('health', 1).setData('maxHealth', 1).setData('isInvulnerable', false);
            this.updateBossSize(this.boss, this.bossData.textureKey || 'bossStand', this.bossData.widthRatio || 0.2); // ダミーサイズ
        }
        this.setupAfterImageEmitter(); // ボス生成後に残像エミッタ設定

        // 4. プール、コライダー、テキスト、入力
        this.setupBossDropPool();
        this.setColliders(); // ボスオブジェクト参照後にコライダー設定
        this.createGameOverText();
        this.createGameClearText(); // ゲームクリアテキストも生成
        this.setupInputAndEvents();

        // 5. 登場演出開始
        this.playerControlEnabled = false; // 演出中は操作不可
        this.sound.stopAll(); // 前のシーンの音などを全て停止
        this.stopBgm();
        this.startIntroCutscene(); // ボス登場演出を開始

        console.log(`--- ${this.scene.key} CREATE End - Waiting for intro ---`);
    }

    update(time, delta) {
        if (this.isGameOver || this.bossDefeated) {
            this.bossAfterImageEmitter?.stop();
            return;
        }

        // ボスオブジェクトが存在し、アクティブな場合のみ更新処理
        if (this.boss && this.boss.active) {
            // 残像エミッタの位置追従と放出
            if (this.bossAfterImageEmitter) {
                this.bossAfterImageEmitter.setPosition(this.boss.x, this.boss.y);
                if (!this.bossAfterImageEmitter.emitting && this.boss.body.velocity.lengthSq() > 0) { // 動いているときだけ
                    this.bossAfterImageEmitter.start();
                } else if (this.bossAfterImageEmitter.emitting && this.boss.body.velocity.lengthSq() === 0) {
                    this.bossAfterImageEmitter.stop();
                }
            }
            // プレースホルダー: ボス固有の行動更新 (継承先で実装)
            this.updateSpecificBossBehavior(time, delta);
        }

        this.updateBallFall();
        this.updateAttackBricks(); // 画面外に出た攻撃ブロックの処理
        this.updateMakiraBeams();  // 画面外に出たマキラビームの処理

        // インダラホーミング処理
        this.balls?.getMatching('active', true).forEach(ball => {
            if (ball.getData('isIndaraActive') && this.boss && this.boss.active && ball.body) {
                const direction = Phaser.Math.Angle.BetweenPoints(ball.body.center, this.boss.body.center);
                const homingSpeed = NORMAL_BALL_SPEED * INDARA_HOMING_SPEED_MULTIPLIER;
                this.physics.velocityFromAngle(Phaser.Math.RadToDeg(direction), homingSpeed, ball.body.velocity);
            }
        });
    }

    // --- ▼▼▼ プレースホルダーメソッド (継承先で実装) ▼▼▼ ---
    /**
     * ボス固有のデータを初期化する（HP、テクスチャキー、ボイスキーなど）。
     * this.bossData オブジェクトに格納する。
     * 例: this.bossData = { health: 200, textureKey: 'boss1_stand', negativeKey: 'boss1_neg', ... };
     */
    initializeBossData() {
        console.warn(`CommonBossScene: initializeBossData() not implemented in ${this.scene.key}`);
        this.bossData = {
            health: COMMON_BOSS_MAX_HEALTH,
            textureKey: 'bossStand', // デフォルトの立ち絵キー
            negativeKey: 'bossNegative', // デフォルトのネガ画像キー
            voiceAppear: AUDIO_KEYS.VOICE_BOSS_APPEAR,
            voiceDamage: AUDIO_KEYS.VOICE_BOSS_DAMAGE,
            voiceDefeat: AUDIO_KEYS.VOICE_BOSS_DEFEAT,
            voiceRandom: [AUDIO_KEYS.VOICE_BOSS_RANDOM_1, AUDIO_KEYS.VOICE_BOSS_RANDOM_2, AUDIO_KEYS.VOICE_BOSS_RANDOM_3],
            bgmKey: AUDIO_KEYS.BGM2, // デフォルトBGM
            cutsceneText: `VS BOSS ${this.currentBossIndex}`,
            moveRangeXRatio: DEFAULT_BOSS_MOVE_RANGE_X_RATIO,
            moveDuration: DEFAULT_BOSS_MOVE_DURATION,
            widthRatio: 0.25, // ボスの表示幅（画面幅比）
            // ボス固有の攻撃パターン定義などもここに含めることができる
            // attackPatterns: [ {type: 'dropFromTop', interval: 2000}, {type: 'shootLaser', chance: 0.3} ]
        };
        this.bossVoiceKeys = this.bossData.voiceRandom;
    }

    /**
     * ボス固有のゲームオブジェクトを生成し、初期設定を行う。
     * this.boss にボスオブジェクトを割り当てる。
     * this.updateBossSize を呼び出してサイズ調整も行う。
     */
    createSpecificBoss() {
        console.warn(`CommonBossScene: createSpecificBoss() not implemented in ${this.scene.key}. Creating generic boss.`);
        if (this.boss) this.boss.destroy();
        const bossX = this.gameWidth / 2;
        const bossY = this.gameHeight * 0.25; // ボスの基準Y座標

        this.boss = this.physics.add.image(bossX, bossY, this.bossData.textureKey || 'bossStand')
            .setImmovable(true)
            .setVisible(false) // 登場演出で表示する
            .setAlpha(0);

        this.boss.setData('health', this.bossData.health || COMMON_BOSS_MAX_HEALTH);
        this.boss.setData('maxHealth', this.bossData.health || COMMON_BOSS_MAX_HEALTH);
        this.boss.setData('isInvulnerable', false);
        this.boss.setData('targetY', bossY); // 登場演出後のY座標

        // ボスサイズ更新 (テクスチャキーと幅比率を使用)
        this.updateBossSize(this.boss, this.bossData.textureKey || 'bossStand', this.bossData.widthRatio || 0.25);
        this.boss.setData('targetScale', this.boss.scale); // 登場演出後のスケール
    }

    /**
     * ボス固有の動きを開始する（例：左右往復、特定パターンでの移動など）。
     * startGameplay から呼び出される。
     */
    startSpecificBossMovement() {
        console.warn(`CommonBossScene: startSpecificBossMovement() not implemented in ${this.scene.key}. Starting generic movement.`);
        if (!this.boss || !this.boss.active) return;
        if (this.bossMoveTween) this.bossMoveTween.stop();

        const moveWidth = this.gameWidth * (this.bossData.moveRangeXRatio || DEFAULT_BOSS_MOVE_RANGE_X_RATIO) / 2;
        const leftX = this.gameWidth / 2 - moveWidth;
        const rightX = this.gameWidth / 2 + moveWidth;
        const startX = this.gameWidth / 2;
        this.boss.setX(startX);

        const easeFunctions = ['Sine.easeInOut', 'Quad.easeInOut', 'Cubic.easeInOut', 'Quart.easeInOut', 'Expo.easeInOut', 'Circ.easeInOut'];
        const moveToRight = () => {
            if (!this.boss?.active || this.isGameOver || this.bossDefeated) return;
            this.bossMoveTween = this.tweens.add({
                targets: this.boss, x: rightX, duration: this.bossData.moveDuration || DEFAULT_BOSS_MOVE_DURATION,
                ease: Phaser.Utils.Array.GetRandom(easeFunctions), onComplete: moveToLeft
            });
        };
        const moveToLeft = () => {
            if (!this.boss?.active || this.isGameOver || this.bossDefeated) return;
            this.bossMoveTween = this.tweens.add({
                targets: this.boss, x: leftX, duration: this.bossData.moveDuration || DEFAULT_BOSS_MOVE_DURATION,
                ease: Phaser.Utils.Array.GetRandom(easeFunctions), onComplete: moveToRight
            });
        };
        moveToRight();
    }

    /**
     * ボス固有の攻撃パターンを実行・更新する。
     * update メソッドから毎フレーム呼び出されるか、タイマーイベントで管理。
     * @param {number} time - 現在のゲーム時間
     * @param {number} delta - 前フレームからの経過時間
     */
    updateSpecificBossBehavior(time, delta) {
        // console.warn(`CommonBossScene: updateSpecificBossBehavior() not implemented in ${this.scene.key}`);
        // 例: 汎用的な攻撃ブロック生成タイマー (シンプル版)
        if (!this.attackBrickTimer || !this.attackBrickTimer.getProgress() === 1) { // タイマーが終了または未設定
            if (this.playerControlEnabled && this.boss && this.boss.active && !this.bossDefeated && !this.isGameOver) {
                this.scheduleNextGenericAttackBrick();
            }
        }
    }

    /**
     * ボス撃破後、次のボスへの遷移処理やゲームクリア処理を呼び出す。
     * gameComplete から呼び出される想定だったが、直接 defeatBoss の最後で分岐する方が良い。
     */
    handleBossDefeatCompletion() {
        console.log(`--- ${this.scene.key} Boss Defeated Completion ---`);
        if (this.currentBossIndex < this.totalBosses) {
            const nextBossIndex = this.currentBossIndex + 1;
            console.log(`Proceeding to Boss ${nextBossIndex}`);
            this.scene.start(`Boss${nextBossIndex}Scene`, {
                lives: this.lives,
                chaosSettings: this.chaosSettings, // ハチャメチャ度は引き継ぐ
                currentBossIndex: nextBossIndex
            });
        } else {
            console.log("All bosses defeated! Game Clear!");
            this.triggerGameClear();
        }
    }
    // --- ▲▲▲ プレースホルダーメソッド ▲▲▲ ---


    // --- ▼ Create ヘルパーメソッド ▼ ---
    calculateDynamicMargins() {
        this.topMargin = Math.max(UI_TOP_MARGIN_MIN, this.gameHeight * UI_TOP_MARGIN_RATIO);
        this.sideMargin = Math.max(UI_SIDE_MARGIN_MIN, this.gameWidth * UI_SIDE_MARGIN_RATIO);
    }

    setupBackground() {
        this.add.image(this.gameWidth / 2, this.gameHeight / 2, 'gameBackground3') // TODO: ボスごとに背景変更できるように
            .setOrigin(0.5, 0.5)
            .setDisplaySize(this.gameWidth, this.gameHeight)
            .setDepth(-10) // 他より奥
            .setAlpha(0.85);
    }

    setupUI() {
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene', { parentSceneKey: this.scene.key });
        }
        this.uiScene = this.scene.get('UIScene');
        // UISceneのcreate完了を待って初期値をUIに反映させる
        this.time.delayedCall(100, () => { // 少し遅延させてUISceneの準備を待つ
            if (this.uiScene && this.uiScene.scene.isActive()) {
                this.events.emit('updateLives', this.lives);
                this.events.emit('updateBossNumber', this.currentBossIndex, this.totalBosses);
                if (this.boss) { // ボスが生成されていればHPも更新
                     this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth'));
                }
                this.events.emit('deactivateVajraUI');
                this.events.emit('updateDropPoolUI', this.bossDropPool);
            } else {
                console.warn("UIScene not ready for initial UI update in CommonBossScene.");
            }
        }, [], this);
    }

    setupPhysics() {
        this.physics.world.setBoundsCollision(true, true, true, false); // 下は落ちる
        this.physics.world.off('worldbounds', this.handleWorldBounds, this); // 念のため解除
        this.physics.world.on('worldbounds', this.handleWorldBounds, this);
    }

    createPaddle() {
        if (this.paddle) this.paddle.destroy();
        const paddleX = this.gameWidth / 2;
        // Y座標はclampPaddleYPositionで最終調整されるが、初期目標値は設定
        const targetPaddleY = this.gameHeight * (1 - PADDLE_Y_OFFSET_RATIO);

        this.paddle = this.physics.add.image(paddleX, targetPaddleY, 'whitePixel')
            .setTint(PADDLE_NORMAL_TINT)
            .setImmovable(true)
            .setCollideWorldBounds(true) // パドルが画面外に出ないように
            .setData('originalWidthRatio', PADDLE_WIDTH_RATIO); // 割合を保存

        this.updatePaddleSize(); // 割合に基づいた初期サイズ設定
        this.clampPaddleYPosition(); // Y座標のClamp処理
        this.paddle.body.onWorldBounds = true; // 壁衝突イベント用
    }

    createBalls() {
        if (this.balls) this.balls.destroy(true);
        this.balls = this.physics.add.group({
            bounceX: 1, bounceY: 1,
            collideWorldBounds: true
        });
        if (this.paddle && this.paddle.active) {
            const ballY = this.paddle.y - (this.paddle.displayHeight / 2) - (this.gameWidth * BALL_RADIUS_RATIO);
            this.createAndAddBall(this.paddle.x, ballY);
        } else { // パドルがない場合のフォールバック
            this.createAndAddBall(this.gameWidth / 2, this.gameHeight * 0.7);
        }
    }

    createPowerUpsGroup() {
        if (this.powerUps) this.powerUps.destroy(true);
        this.powerUps = this.physics.add.group();
    }

    createAttackBricksGroup() {
        if (this.attackBricks) this.attackBricks.destroy(true);
        this.attackBricks = this.physics.add.group();
    }

    createMakiraGroups() {
        if (this.familiars) this.familiars.destroy(true);
        this.familiars = this.physics.add.group({ collideWorldBounds: true, bounceX: 1 }); // 物理グループ、左右反射
        if (this.makiraBeams) this.makiraBeams.destroy(true);
        this.makiraBeams = this.physics.add.group();
    }

    setupBossDropPool() {
        const possibleDrops = [...ALL_POSSIBLE_POWERUPS]; // constantsからコピー
        const shuffledPool = Phaser.Utils.Array.Shuffle(possibleDrops);
        const countToUse = this.chaosSettings.count;
        this.bossDropPool = shuffledPool.slice(0, countToUse);
        console.log(`Boss Drop Pool (Count: ${countToUse}): [${this.bossDropPool.join(',')}]`);
        if (this.uiScene?.scene.isActive()) {
            this.events.emit('updateDropPoolUI', this.bossDropPool);
        }
    }

    setColliders() {
        // 既存コライダーを安全に破棄
        this.safeDestroyCollider(this.ballPaddleCollider, "ballPaddleCollider");
        this.safeDestroyCollider(this.ballBossCollider, "ballBossCollider");
        this.safeDestroyCollider(this.ballAttackBrickCollider, "ballAttackBrickCollider");
        this.safeDestroyCollider(this.ballAttackBrickOverlap, "ballAttackBrickOverlap");
        this.safeDestroyCollider(this.paddlePowerUpOverlap, "paddlePowerUpOverlap");
        this.safeDestroyCollider(this.paddleAttackBrickCollider, "paddleAttackBrickCollider");
        this.safeDestroyCollider(this.makiraBeamBossOverlap, "makiraBeamBossOverlap");

        // ボール vs パドル
        if (this.paddle && this.balls) {
            this.ballPaddleCollider = this.physics.add.collider(this.paddle, this.balls, this.hitPaddle, null, this);
        }
        // ボール vs ボス
        if (this.boss && this.balls) {
            this.ballBossCollider = this.physics.add.collider(this.boss, this.balls, this.hitBoss, (boss, ball) => !boss.getData('isInvulnerable'), this);
        }
        // パドル vs パワーアップアイテム
        if (this.paddle && this.powerUps) {
            this.paddlePowerUpOverlap = this.physics.add.overlap(this.paddle, this.powerUps, this.collectPowerUp, null, this);
        }
        // パドル vs 攻撃ブロック
        if (this.paddle && this.attackBricks) {
            this.paddleAttackBrickCollider = this.physics.add.collider(this.paddle, this.attackBricks, this.handlePaddleHitByAttackBrick, null, this);
        }
        // マキラビーム vs ボス
        if (this.makiraBeams && this.boss) {
            this.makiraBeamBossOverlap = this.physics.add.overlap(this.makiraBeams, this.boss, this.hitBossWithMakiraBeam, (beam, boss) => !boss.getData('isInvulnerable'), this);
        }

        // ボール vs 攻撃ブロック (インダラ/ビカラ貫通を考慮)
        let needsColliderForAttackBricks = false;
        let needsOverlapForAttackBricks = false;
        this.balls?.getMatching('active', true).forEach(ball => {
            if (ball.getData('isIndaraActive') || ball.getData('isBikaraPenetrating')) {
                needsOverlapForAttackBricks = true;
            } else {
                needsColliderForAttackBricks = true;
            }
        });

        if (needsColliderForAttackBricks && this.attackBricks && this.balls) {
            this.ballAttackBrickCollider = this.physics.add.collider(this.attackBricks, this.balls, this.hitAttackBrick,
                (brick, ball) => !ball.getData('isIndaraActive') && !ball.getData('isBikaraPenetrating'), this);
        }
        if (needsOverlapForAttackBricks && this.attackBricks && this.balls) {
            this.ballAttackBrickOverlap = this.physics.add.overlap(this.attackBricks, this.balls, this.handleBallAttackBrickOverlap,
                (brick, ball) => ball.getData('isIndaraActive') || ball.getData('isBikaraPenetrating'), this);
        }
    }

    createGameOverText() {
        if (this.gameOverText) this.gameOverText.destroy();
        this.gameOverText = this.add.text(this.gameWidth / 2, this.gameHeight / 2,
            '会議は中断されました...\nタップで最初から', {
                fontSize: `${this.calculateDynamicFontSize(40)}px`, fill: '#f00', align: 'center',
                stroke: '#000', strokeThickness: 4,
                fontFamily: 'MyGameFont, sans-serif'
            })
            .setOrigin(0.5).setVisible(false).setDepth(1001); // UIより手前
    }

    createGameClearText() {
        if (this.gameClearText) this.gameClearText.destroy();
        // 実際のテキスト内容は triggerGameClear で設定
        this.gameClearText = this.add.text(this.gameWidth / 2, this.gameHeight * 0.4, '', {
                fontSize: `${this.calculateDynamicFontSize(48)}px`, fill: '#ffd700', align: 'center',
                stroke: '#000', strokeThickness: 5,
                fontFamily: 'MyGameFont, sans-serif',
                wordWrap: { width: this.gameWidth * 0.9, useAdvancedWrap: true }
            })
            .setOrigin(0.5).setVisible(false).setDepth(1001);
    }

    setupInputAndEvents() {
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.on('pointermove', this.handlePointerMove, this);
        this.input.off('pointerdown', this.handlePointerDown, this);
        this.input.on('pointerdown', this.handlePointerDown, this);

        this.scale.off('resize', this.handleResize, this); // 念のため解除
        this.scale.on('resize', this.handleResize, this);

        this.events.off('shutdown', this.shutdownScene, this); // 念のため解除
        this.events.on('shutdown', this.shutdownScene, this);
    }
    // --- ▲ Create ヘルパーメソッド ▲ ---


    // --- ▼ 登場・撃破演出メソッド群 ▼ ---
    startIntroCutscene() {
        console.log("[Intro] Starting Cutscene...");
        this.cameras.main.flash(CUTSCENE_FLASH_DURATION, 255, 255, 255);
        this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START);

        const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.75)
            .setOrigin(0,0).setDepth(900);

        const bossImage = this.add.image(this.gameWidth / 2, this.gameHeight / 2, this.bossData.textureKey || 'bossStand')
            .setOrigin(0.5, 0.5).setDepth(901);
        const targetImageWidth = this.gameWidth * 0.75;
        bossImage.displayWidth = targetImageWidth;
        bossImage.scaleY = bossImage.scaleX;

        const textContent = this.bossData.cutsceneText || `VS BOSS ${this.currentBossIndex}`;
        const textStyle = {
            fontSize: `${this.calculateDynamicFontSize(38)}px`, fill: '#ffffff', stroke: '#000000',
            strokeThickness: 5, fontFamily: 'MyGameFont, sans-serif', align: 'center'
        };
        const vsText = this.add.text(this.gameWidth / 2, bossImage.getBounds().bottom + this.gameHeight * 0.05, textContent, textStyle)
            .setOrigin(0.5, 0).setDepth(902);

        this.time.delayedCall(CUTSCENE_DURATION, () => {
            overlay.destroy();
            bossImage.destroy();
            vsText.destroy();
            this.startFlashAndZoomIntro();
        }, [], this);
    }

    startFlashAndZoomIntro() {
        this.sound.play(AUDIO_KEYS.SE_IMPACT_FLASH);
        this.cameras.main.flash(INTRO_FLASH_DURATION, 255, 255, 255);
        this.time.delayedCall(INTRO_FLASH_DURATION, this.startBossZoomIn, [], this);
    }

    startBossZoomIn() {
        if (!this.boss) return;
        console.log("[Intro] Starting Boss Zoom In...");
        this.playBossBgm(); // BGM再生開始

        const zoomInStartY = this.gameHeight * 0.8;
        const zoomInStartScale = 0.05;
        const zoomInEndScale = Math.min(5, this.gameWidth / (this.boss.width / this.boss.scaleX) * 1.5); // 画面一杯より少し大きめ
        const zoomInEndY = this.gameHeight / 2;

        this.boss.setPosition(this.gameWidth / 2, zoomInStartY)
                 .setScale(zoomInStartScale)
                 .setAlpha(0)
                 .setVisible(true);
        if (this.boss.body) this.boss.body.setSize(1,1); // 物理ボディを一時的に最小化

        this.sound.play(this.bossData.voiceAppear || AUDIO_KEYS.VOICE_BOSS_APPEAR);
        this.sound.play(AUDIO_KEYS.SE_BOSS_ZOOM);

        this.tweens.add({
            targets: this.boss, y: zoomInEndY, scale: zoomInEndScale, alpha: 1,
            duration: ZOOM_IN_DURATION, ease: 'Quad.easeIn',
            onComplete: () => {
                this.time.delayedCall(ZOOM_WAIT_DURATION, this.startBossQuickShrink, [], this);
            }
        });
    }

    startBossQuickShrink() {
        if (!this.boss || !this.boss.active) return;
        console.log("[Intro] Starting Boss Quick Shrink...");
        this.sound.play(AUDIO_KEYS.SE_SHRINK);
        this.cameras.main.flash(SHRINK_FLASH_DURATION, 255, 255, 255);

        this.tweens.add({
            targets: this.boss,
            x: this.gameWidth / 2,
            y: this.boss.getData('targetY'),
            scale: this.boss.getData('targetScale'),
            alpha: 1, // 透明度も確実に1に
            duration: SHRINK_DURATION,
            ease: 'Expo.easeOut',
            onComplete: () => {
                this.sound.play(AUDIO_KEYS.SE_FIGHT_START);
                this.updateBossSizeAfterIntro(); // ボディサイズ等を最終調整
                this.time.delayedCall(GAMEPLAY_START_DELAY, this.startGameplay, [], this);
            }
        });
    }

    startGameplay() {
        console.log("[Intro] Enabling player control. Boss fight start!");
        this.playerControlEnabled = true;
        if (this.boss?.body) this.boss.body.enable = true; // 物理ボディを有効化
        this.startSpecificBossMovement(); // ボス固有の動きを開始
        this.startRandomVoiceTimer();     // 戦闘中ランダムボイス開始
        // ボス固有の攻撃タイマーは updateSpecificBossBehavior や startSpecificBossMovement 内で開始される想定
    }

    defeatBoss(bossObject) { // 引数名を変更して this.boss との混同を避ける
        if (this.bossDefeated) return;
        console.log("[Defeat] Boss defeated! Starting defeat sequence.");
        this.bossDefeated = true;
        this.playerControlEnabled = false;

        this.sound.stopAll(); // BGM以外を停止
        this.randomVoiceTimer?.remove();

        this.safeDestroyCollider(this.ballBossCollider);
        this.ballBossCollider = null;
        // 他のボス関連コライダーも停止 (マキラビームなど)
        this.safeDestroyCollider(this.makiraBeamBossOverlap);
        this.makiraBeamBossOverlap = null;


        this.bossMoveTween?.stop();
        this.attackBrickTimer?.remove(); // ボス固有の攻撃タイマーも停止
        this.balls?.children.each(ball => ball.body?.stop());
        if (bossObject?.body) bossObject.disableBody(false, false); // GameObjectは残す

        this.sound.play(this.bossData.voiceDefeat || AUDIO_KEYS.VOICE_BOSS_DEFEAT);
        this.sound.play(AUDIO_KEYS.SE_DEFEAT_FLASH); // 最初のフラッシュSE

        if (bossObject?.active) {
            try {
                bossObject.setTexture(this.bossData.negativeKey || 'bossNegative');
            } catch (e) { console.error("Error setting negative texture:", e); }
        }

        // 3回フラッシュ
        for (let i = 0; i < DEFEAT_FLASH_COUNT; i++) {
            this.time.delayedCall(i * DEFEAT_FLASH_INTERVAL, () => {
                if (!this.scene.isActive()) return;
                this.cameras.main.flash(DEFEAT_FLASH_DURATION, 255, 255, 255);
                if (i === DEFEAT_FLASH_COUNT - 1) { // 最後のフラッシュ後
                    if (bossObject?.active) {
                        this.startBossShakeAndFade(bossObject);
                    } else { // ボスが既にいない場合は直接完了処理へ
                        this.handleBossDefeatCompletion();
                    }
                }
            }, [], this);
        }
    }

    startBossShakeAndFade(bossObject) {
        if (!bossObject || !bossObject.active) {
            this.handleBossDefeatCompletion(); // ボスがいないなら即完了
            return;
        }
        console.log("[Defeat] Starting shake and fade animation.");
        // this.sound.play(AUDIO_KEYS.SE_SHAKE_FADE); // TODO: シェイクフェード用SEがあれば

        const shakeAmount = bossObject.displayWidth * 0.05;
        this.tweens.add({
            targets: bossObject,
            props: {
                 x: { value: `+=${shakeAmount}`, duration: 50, yoyo: true, ease: 'Sine.easeInOut' },
                 y: { value: `+=${shakeAmount/2}`, duration: 60, yoyo: true, ease: 'Sine.easeInOut' }
            },
            repeat: Math.floor(DEFEAT_SHAKE_DURATION / 60)
        });

        this.tweens.add({
            targets: bossObject, alpha: 0, duration: DEFEAT_FADE_DURATION, ease: 'Linear',
            onComplete: () => {
                bossObject.destroy();
                if(this.boss === bossObject) this.boss = null;
                this.handleBossDefeatCompletion(); // 次の処理へ
            }
        });
    }
    // --- ▲ 登場・撃破演出メソッド群 ▲ ---


    // --- ▼ ゲーム進行メソッド ▼ ---
    loseLife() {
        if (this.isGameOver || this.bossDefeated) return;
        console.log(`Losing life. Lives remaining: ${this.lives - 1}`);

        // 持続系パワーアップ解除
        this.deactivateMakira();
        this.deactivateAnila();
        this.deactivateAnchira(true); // isImmediate = true で即時解除
        this.deactivateSindara(null, true); // all = true, isImmediate = true
        // 他のタイマー系もクリア
        Object.values(this.powerUpTimers).forEach(timer => timer?.remove());
        this.powerUpTimers = {};
        this.balls?.getChildren().forEach(ball => {
             if(ball?.active) this.resetBallState(ball);
        });
        this.updateBallAndPaddleAppearance(); // パドルも元に戻す

        this.lives--;
        this.events.emit('updateLives', this.lives);
        this.isBallLaunched = false;
        this.balls?.clear(true, true);

        if (this.lives > 0) {
             this.time.delayedCall(800, this.resetForNewLife, [], this);
        } else {
            this.sound.play(AUDIO_KEYS.SE_GAME_OVER);
            this.stopBgm();
            this.time.delayedCall(500, this.gameOver, [], this);
        }
    }

    resetForNewLife() {
        if (this.isGameOver || this.bossDefeated) return;
        if (this.paddle && this.paddle.active) {
            const ballY = this.paddle.y - (this.paddle.displayHeight / 2) - (this.gameWidth * BALL_RADIUS_RATIO);
            this.createAndAddBall(this.paddle.x, ballY);
        } else {
            this.createAndAddBall(this.gameWidth / 2, this.gameHeight * 0.7);
        }
        this.isBallLaunched = false;
        this.playerControlEnabled = true; // 操作再開
    }

    gameOver() {
        if (this.isGameOver) return;
        console.log("GAME OVER");
        this.isGameOver = true;
        this.playerControlEnabled = false;
        this.gameOverText?.setVisible(true);
        this.physics.pause();
        this.balls?.children.each(ball => ball.setVelocity(0,0).setActive(false));
        this.bossMoveTween?.pause();
        this.attackBrickTimer?.pause();
        this.randomVoiceTimer?.remove();
        // UISceneにゲームオーバーを通知することも可能
    }

    triggerGameClear() { // gameCompleteから改名
        console.log("GAME CLEAR SEQUENCE TRIGGERED!");
        this.stopBgm();
        this.sound.play(AUDIO_KEYS.SE_STAGE_CLEAR);

        this.gameClearText?.setText(`会議終了！\nお疲れ様でした！\n\n残りライフ: ${this.lives}\nハチャメチャ度: ${this.chaosSettings.count} / ${this.chaosSettings.ratePercent}%\n\nタップでタイトルへ`)
            .setVisible(true);

        this.input.once('pointerdown', this.returnToTitle, this);
    }

    returnToTitle() {
         this.stopBgm();
         // UIScene を停止してからリロード
         if (this.scene.isActive('UIScene')) {
            this.scene.stop('UIScene');
         }
         // 他の関連シーンも停止するならここ
         window.location.reload();
    }
    // --- ▲ ゲーム進行メソッド ▲ ---


    // --- ▼ パワーアップ関連メソッド (BossSceneから大部分を移行) ▼ ---
    collectPowerUp(paddle, powerUp) {
        if (!powerUp?.active || this.isGameOver || this.bossDefeated) return;
        const type = powerUp.getData('type');
        if (!type) { powerUp.destroy(); return; }
        console.log(`Collected power up: ${type}`);
        powerUp.destroy();

        if (type === POWERUP_TYPES.SINDARA || type === POWERUP_TYPES.ANCHIRA) {
            this.deactivateSindara(null, true); // 全シンダラ即時解除
            this.deactivateAnchira(true);    // アンチラ即時解除
        }

        this.playPowerUpVoice(type);

        switch (type) {
            case POWERUP_TYPES.KUBIRA:   this.activateKubira();   break;
            case POWERUP_TYPES.SHATORA:  this.activateShatora();  break;
            case POWERUP_TYPES.HAILA:    this.activateHaira();    break;
            case POWERUP_TYPES.ANCHIRA:  this.activateAnchira();  break;
            case POWERUP_TYPES.SINDARA:  this.activateSindara();  break;
            case POWERUP_TYPES.BIKARA:   this.activateBikara();   break;
            case POWERUP_TYPES.INDARA:   this.activateIndara();   break;
            case POWERUP_TYPES.ANILA:    this.activateAnila();    break;
            case POWERUP_TYPES.VAJRA:    this.activateVajra();    break;
            case POWERUP_TYPES.MAKIRA:   this.activateMakira();   break;
            case POWERUP_TYPES.MAKORA:   this.activateMakora();   break;
            case POWERUP_TYPES.BAISRAVA:
                if (this.boss?.active && !this.boss.getData('isInvulnerable')) {
                     this.applyBossDamage(this.boss, 50, "Baisrava"); // バイシュラヴァは直接ダメージ
                }
                // バイシュラヴァは即時効果なのでアイコン表示や状態管理は不要
                return; // 見た目更新は不要
            default:
                console.log(`Power up ${type} has no specific activation.`);
                this.setBallPowerUpState(type, true); // 未定義でもアイコン表示試行
                break;
        }
        this.updateBallAndPaddleAppearance();
    }

    activateTemporaryEffect(type, duration, onStartCallback, onEndCallback) {
        if (this.powerUpTimers[type]) this.powerUpTimers[type].remove();
        onStartCallback?.();
        this.setBallPowerUpState(type, true); // ボールに状態設定

        this.powerUpTimers[type] = this.time.delayedCall(duration, () => {
            onEndCallback?.();
            this.setBallPowerUpState(type, false); // ボール状態解除
            delete this.powerUpTimers[type];
            this.updateBallAndPaddleAppearance();
        }, [], this);
        this.updateBallAndPaddleAppearance(); // 開始時の見た目更新
    }

    setBallPowerUpState(type, isActive, specificBall = null) {
        const targetBalls = specificBall ? [specificBall] : this.balls?.getChildren() ?? [];
        targetBalls.forEach(ball => {
            if (ball?.active && ball.getData) {
                let activePowers = ball.getData('activePowers') || new Set();
                if (isActive) {
                    activePowers.add(type);
                    ball.setData('lastActivatedPower', type);
                } else {
                    activePowers.delete(type);
                    if (ball.getData('lastActivatedPower') === type) {
                        const remaining = Array.from(activePowers);
                        ball.setData('lastActivatedPower', remaining.length > 0 ? remaining[remaining.length - 1] : null);
                    }
                }
                ball.setData('activePowers', activePowers);

                // 個別フラグ設定
                if (type === POWERUP_TYPES.KUBIRA) ball.setData('isKubiraActive', isActive);
                if (type === POWERUP_TYPES.SHATORA) ball.setData('isFast', isActive);
                if (type === POWERUP_TYPES.HAILA) ball.setData('isSlow', isActive);
                if (type === POWERUP_TYPES.INDARA) ball.setData('isIndaraActive', isActive);
                if (type === POWERUP_TYPES.BIKARA) {
                    ball.setData('isBikaraPenetrating', isActive);
                    if (!isActive && this.bikaraTimers[ball.name]) {
                        this.bikaraTimers[ball.name].remove();
                        delete this.bikaraTimers[ball.name];
                    }
                }
                if (type === POWERUP_TYPES.SINDARA) ball.setData('isSindaraActive', isActive);
                if (type === POWERUP_TYPES.ANCHIRA) ball.setData('isAnchiraActive', isActive);
                if (type === POWERUP_TYPES.MAKORA) ball.setData('isMakoraActive', isActive); // 主に一時的なアイコン表示用
                // ANILAはボールではなくパドルが状態を持つのでここでは管理しない
            }
        });
        if (!specificBall) this.updateBallAndPaddleAppearance(); // 全体更新時のみ
    }

    updateBallAndPaddleAppearance() {
        this.balls?.getChildren().forEach(ball => {
            if (ball?.active) this.updateBallAppearance(ball);
        });
        if (this.paddle?.active) {
            this.paddle.setTint(this.isAnilaActive ? PADDLE_ANILA_TINT : PADDLE_NORMAL_TINT);
            this.paddle.setAlpha(this.isAnilaActive ? PADDLE_ANILA_ALPHA : 1.0);
        }
    }

    updateBallAppearance(ball) {
        if (!ball?.active || !ball.getData) return;
        let textureKey = 'ball_image';
        const lastPower = ball.getData('lastActivatedPower');
        if (lastPower && POWERUP_ICON_KEYS[lastPower]) {
            textureKey = POWERUP_ICON_KEYS[lastPower];
        }
        if (ball.texture.key !== textureKey) ball.setTexture(textureKey);
        ball.clearTint(); // 基本的にTintは使わない方針で、特殊な場合のみ別途設定
    }

    resetBallState(ball) { // ライフ失った時などにボールの状態を完全にリセット
        if (!ball?.active) return;
        ball.setData('activePowers', new Set());
        ball.setData('lastActivatedPower', null);
        ball.setData('isKubiraActive', false);
        ball.setData('isFast', false);
        ball.setData('isSlow', false);
        ball.setData('isIndaraActive', false);
        ball.setData('isBikaraPenetrating', false);
        ball.setData('isSindaraActive', false);
        ball.setData('isAnchiraActive', false);
        ball.setData('isMakoraActive', false);
        if (this.bikaraTimers[ball.name]) {
            this.bikaraTimers[ball.name].remove();
            delete this.bikaraTimers[ball.name];
        }
        this.updateBallAppearance(ball); // 見た目もデフォルトに戻す
    }

    // --- 各パワーアップの activate/deactivate メソッド群 (BossSceneから移行) ---
    // Kubira
    activateKubira() { this.activateTemporaryEffect(POWERUP_TYPES.KUBIRA, POWERUP_DURATION[POWERUP_TYPES.KUBIRA]); }
    // Shatora
    activateShatora() {
        this.activateTemporaryEffect(POWERUP_TYPES.SHATORA, POWERUP_DURATION[POWERUP_TYPES.SHATORA],
            () => this.balls?.getChildren().forEach(b => { if(b.active) this.applySpeedModifier(b, POWERUP_TYPES.SHATORA); }),
            () => this.balls?.getChildren().forEach(b => { if(b.active) this.resetBallSpeed(b); })
        );
    }
    // Haila
    activateHaira() {
        this.activateTemporaryEffect(POWERUP_TYPES.HAILA, POWERUP_DURATION[POWERUP_TYPES.HAILA],
            () => this.balls?.getChildren().forEach(b => { if(b.active) this.applySpeedModifier(b, POWERUP_TYPES.HAILA); }),
            () => this.balls?.getChildren().forEach(b => { if(b.active) this.resetBallSpeed(b); })
        );
    }
    // Anchira
    activateAnchira() {
        if (this.anchiraTimer) return; // アンチラは効果時間中には再取得できない想定
        console.log("[Anchira] Activating!");
        const sourceBall = this.keepFurthestBallAndClearOthers();
        if (!sourceBall?.active) return;

        const previousData = { ...sourceBall.data.getAll(), activePowers: new Set(sourceBall.getData('activePowers')) };
        previousData.activePowers.delete(POWERUP_TYPES.ANCHIRA);
        previousData.lastActivatedPower = Array.from(previousData.activePowers).pop() || null;

        this.setBallPowerUpState(POWERUP_TYPES.ANCHIRA, true, sourceBall);

        const ballsToCreate = 3;
        for (let i = 0; i < ballsToCreate; i++) {
            const vx = sourceBall.body.velocity.x * Phaser.Math.FloatBetween(0.6, 1.4) + Phaser.Math.Between(-80, 80);
            const vy = sourceBall.body.velocity.y * Phaser.Math.FloatBetween(0.6, 1.2) + Phaser.Math.Between(-80, 20);
            const newBall = this.createAndAddBall(
                sourceBall.x + Phaser.Math.Between(-20, 20), sourceBall.y + Phaser.Math.Between(-20, 20),
                vx, vy, previousData
            );
            if (newBall) this.setBallPowerUpState(POWERUP_TYPES.ANCHIRA, true, newBall);
        }
        this.updateBallAndPaddleAppearance();
        this.anchiraTimer = this.time.delayedCall(ANCHIRA_DURATION, () => this.deactivateAnchira(false), [], this);
    }
    deactivateAnchira(isImmediate = false) {
        if (!this.anchiraTimer && !isImmediate) return;
        console.log("[Anchira] Deactivating!");
        this.anchiraTimer?.remove(); this.anchiraTimer = null;

        const keptBall = this.keepFurthestBallAndClearOthers();
        this.balls?.getMatching('active', true).forEach(b => this.setBallPowerUpState(POWERUP_TYPES.ANCHIRA, false, b));
        if (keptBall?.active) this.updateBallAppearance(keptBall);
        else this.updateBallAndPaddleAppearance(); // 残すボールがなければ全体更新
    }
    // Sindara
    activateSindara() {
        console.log("[Sindara] Activating!");
        const sourceBall = this.keepFurthestBallAndClearOthers(); // 複数あった場合、1つだけ残す
        if (!sourceBall?.active) return;

        const ballData = { ...sourceBall.data.getAll(), activePowers: new Set(sourceBall.getData('activePowers')) };
        this.setBallPowerUpState(POWERUP_TYPES.SINDARA, true, sourceBall);

        const vx = sourceBall.body.velocity.x * -0.6 + Phaser.Math.Between(-60, 60);
        const vy = sourceBall.body.velocity.y * 0.7 + Phaser.Math.Between(-60, 10);
        const newBall = this.createAndAddBall(
            sourceBall.x + Phaser.Math.Between(-15, 15), sourceBall.y + Phaser.Math.Between(-15, 15),
            vx, vy, ballData
        );
        if (newBall) this.setBallPowerUpState(POWERUP_TYPES.SINDARA, true, newBall);
        this.updateBallAndPaddleAppearance();
    }
    deactivateSindara(ballToKeep = null, isImmediate = false) { // isImmediate: 即時解除フラグ
        const sindaraBalls = this.balls?.getMatching('isSindaraActive', true) ?? [];
        if (sindaraBalls.length === 0) return;
        console.log(`[Sindara] Deactivating. Found ${sindaraBalls.length} Sindara balls.`);

        if (!isImmediate && sindaraBalls.length <= 1 && ballToKeep && sindaraBalls.includes(ballToKeep)) {
            // 最後の1球が落ちたのでなく、ボール自身が他の分裂系を取得した場合など
             this.setBallPowerUpState(POWERUP_TYPES.SINDARA, false, ballToKeep);
             console.log(`  - Deactivated for kept ball: ${ballToKeep.name}`);
        } else if (isImmediate || (sindaraBalls.length > 0 && (!ballToKeep || !sindaraBalls.includes(ballToKeep)))) {
            // 即時解除、またはシンダラボールが落ちた場合など
            sindaraBalls.forEach(b => this.setBallPowerUpState(POWERUP_TYPES.SINDARA, false, b));
            console.log(`  - Deactivated for all ${sindaraBalls.length} Sindara balls.`);
        }
        this.updateBallAndPaddleAppearance();
    }
    // Bikara
    activateBikara() {
        console.log("[Bikara] Activating Penetration!");
        this.balls?.getMatching('active', true).forEach(ball => {
            if (this.bikaraTimers[ball.name]) this.bikaraTimers[ball.name].remove();
            this.setBallPowerUpState(POWERUP_TYPES.BIKARA, true, ball);
            this.bikaraTimers[ball.name] = this.time.delayedCall(BIKARA_DURATION, () => {
                this.deactivateBikara(ball); // 時間切れで解除
            }, [], this);
        });
        this.updateBallAndPaddleAppearance();
        this.setColliders(); // 貫通のためコライダー更新
    }
    deactivateBikara(ball) {
        if (!ball?.active || !ball.getData('isBikaraPenetrating')) return;
        console.log(`[Bikara] Deactivating Penetration for ball ${ball.name}`);
        this.setBallPowerUpState(POWERUP_TYPES.BIKARA, false, ball); // フラグ解除とタイマー解除
        this.setColliders(); // コライダーを戻す
        this.updateBallAppearance(ball); // 見た目も戻す
    }
    // Indara
    activateIndara() {
        console.log("[Indara] Activating Homing & Pierce!");
        this.balls?.getMatching('active', true).forEach(ball => {
            this.setBallPowerUpState(POWERUP_TYPES.INDARA, true, ball);
        });
        this.updateBallAndPaddleAppearance();
        this.setColliders(); // Overlapに切り替え
    }
    deactivateIndara(ball) { // ボスヒット時などに呼ばれる
        if (!ball?.active || !ball.getData('isIndaraActive')) return;
        console.log("[Indara] Deactivating for specific ball.");
        this.setBallPowerUpState(POWERUP_TYPES.INDARA, false, ball);
        this.setColliders(); // Colliderに戻す
        this.updateBallAppearance(ball);
    }
    // Anila
    activateAnila() {
        if (this.isAnilaActive) { this.anilaTimer?.remove(); }
        else {
            this.isAnilaActive = true;
            this.setBallPowerUpState(POWERUP_TYPES.ANILA, true); // ボールアイコン用
        }
        this.anilaTimer = this.time.delayedCall(ANILA_DURATION, this.deactivateAnila, [], this);
        this.updateBallAndPaddleAppearance(); // パドルとボールの見た目更新
    }
    deactivateAnila() {
        if (!this.isAnilaActive) return;
        this.isAnilaActive = false;
        this.anilaTimer?.remove(); this.anilaTimer = null;
        this.setBallPowerUpState(POWERUP_TYPES.ANILA, false); // ボールアイコン解除
        this.updateBallAndPaddleAppearance();
    }
    // Vajra
    activateVajra() {
        if (!this.isVajraSystemActive) {
            this.isVajraSystemActive = true; this.vajraGauge = 0;
            this.events.emit('activateVajraUI', this.vajraGauge, VAJRA_GAUGE_MAX);
            this.setBallPowerUpState(POWERUP_TYPES.VAJRA, true);
            this.updateBallAndPaddleAppearance();
        }
    }
    increaseVajraGauge() {
        if (!this.isVajraSystemActive || this.isGameOver || this.bossDefeated) return;
        this.vajraGauge = Math.min(this.vajraGauge + VAJRA_GAUGE_INCREMENT, VAJRA_GAUGE_MAX);
        this.events.emit('updateVajraGauge', this.vajraGauge);
        if (this.vajraGauge >= VAJRA_GAUGE_MAX) this.triggerVajraOugi();
    }
    triggerVajraOugi() { // triggerVajraDestroyから改名
        if (!this.isVajraSystemActive) return;
        this.isVajraSystemActive = false;
        this.events.emit('deactivateVajraUI');
        this.setBallPowerUpState(POWERUP_TYPES.VAJRA, false);
        this.updateBallAndPaddleAppearance();
        this.sound.play(AUDIO_KEYS.VOICE_VAJRA_TRIGGER);
        if (this.boss?.active) this.applyBossDamage(this.boss, 7, "Vajra Ougi"); // ダメージ7
    }
    // Makira
    activateMakira() {
        if (!this.isMakiraActive) {
            this.isMakiraActive = true;
            this.familiars?.clear(true, true); this.createFamiliars();
            this.makiraBeams?.clear(true, true);
            this.makiraAttackTimer?.remove();
            this.makiraAttackTimer = this.time.addEvent({ delay: MAKIRA_ATTACK_INTERVAL, callback: this.fireMakiraBeam, callbackScope: this, loop: true });
            this.setBallPowerUpState(POWERUP_TYPES.MAKIRA, true);
        }
        if (this.powerUpTimers[POWERUP_TYPES.MAKIRA]) this.powerUpTimers[POWERUP_TYPES.MAKIRA].remove();
        this.powerUpTimers[POWERUP_TYPES.MAKIRA] = this.time.delayedCall(POWERUP_DURATION[POWERUP_TYPES.MAKIRA], this.deactivateMakira, [], this);
        this.updateBallAndPaddleAppearance();
        this.setColliders(); // ビーム用コライダー設定
    }
    deactivateMakira() {
        if (!this.isMakiraActive) return;
        this.isMakiraActive = false;
        this.makiraAttackTimer?.remove(); this.makiraAttackTimer = null;
        this.powerUpTimers[POWERUP_TYPES.MAKIRA]?.remove(); delete this.powerUpTimers[POWERUP_TYPES.MAKIRA];
        this.familiars?.clear(true, true);
        this.makiraBeams?.clear(true, true);
        this.setBallPowerUpState(POWERUP_TYPES.MAKIRA, false);
        this.updateBallAndPaddleAppearance();
        this.setColliders(); // コライダー戻す
    }
    createFamiliars() { // マキラ子機生成
        if (!this.paddle?.active || !this.familiars) return;
        const paddleX = this.paddle.x;
        const familiarY = this.paddle.y - (PADDLE_HEIGHT / 2) - (this.gameWidth * MAKIRA_FAMILIAR_SIZE_RATIO);
        const familiarSize = this.gameWidth * MAKIRA_FAMILIAR_SIZE_RATIO;
        const familiarOffset = this.gameWidth * MAKIRA_FAMILIAR_OFFSET_RATIO;

        const leftF = this.familiars.create(paddleX - familiarOffset, familiarY, 'joykun')
            .setDisplaySize(familiarSize, familiarSize).setImmovable(true);
        const rightF = this.familiars.create(paddleX + familiarOffset, familiarY, 'joykun')
            .setDisplaySize(familiarSize, familiarSize).setImmovable(true);

        [leftF, rightF].forEach((fam, index) => {
            if (fam?.body) {
                fam.body.setAllowGravity(false);
                fam.setVelocityX(index === 0 ? -FAMILIAR_MOVE_SPEED_X : FAMILIAR_MOVE_SPEED_X); // 左右移動
                fam.body.onWorldBounds = true; // 壁で跳ね返る
            } else if (fam) fam.destroy();
        });
    }
    fireMakiraBeam() {
        if (!this.isMakiraActive || !this.familiars || this.familiars.countActive(true) === 0) return;
        const beamWidth = this.gameWidth * MAKIRA_BEAM_WIDTH_RATIO;
        const beamHeight = this.gameHeight * MAKIRA_BEAM_HEIGHT_RATIO; // 見た目の高さ、実際は速度で飛ぶ

        this.familiars.getChildren().forEach(familiar => {
            if (familiar.active) {
                const beam = this.makiraBeams.create(familiar.x, familiar.y - familiar.displayHeight / 2, 'whitePixel')
                    .setDisplaySize(beamWidth, beamHeight).setTint(MAKIRA_BEAM_COLOR);
                if (beam?.body) {
                    beam.setVelocity(0, -MAKIRA_BEAM_SPEED);
                    beam.body.setAllowGravity(false);
                } else if (beam) beam.destroy();
            }
        });
    }
    updateMakiraBeams() { // 画面外に出たビームを処理
        this.makiraBeams?.getChildren().forEach(beam => {
            if (beam.active && beam.y < -beam.displayHeight) beam.destroy();
        });
    }
    // Makora
    activateMakora() {
        console.log("[Makora] Activating!");
        if (!this.balls?.countActive(true)) return;
        this.setBallPowerUpState(POWERUP_TYPES.MAKORA, true); // 一時的にマコラアイコン
        this.updateBallAndPaddleAppearance();

        const copiedType = Phaser.Utils.Array.GetRandom(MAKORA_COPYABLE_POWERS);
        this.time.delayedCall(MAKORA_COPY_DELAY, () => {
            this.setBallPowerUpState(POWERUP_TYPES.MAKORA, false); // マコラアイコン解除
            console.log(`[Makora] Copying: ${copiedType}`);
            // 既存の activate 関数を呼び出す
            const activateMethodName = `activate${copiedType.charAt(0).toUpperCase() + copiedType.slice(1)}`;
            if (typeof this[activateMethodName] === 'function') {
                this[activateMethodName]();
            } else {
                console.warn(`[Makora] No activate function ${activateMethodName} for ${copiedType}`);
                this.updateBallAndPaddleAppearance(); // コピー失敗時は通常に戻す
            }
            // コピー先で updateBallAndPaddleAppearance が呼ばれることが多い
        }, [], this);
    }

    playPowerUpVoice(type) {
        let voiceKey = AUDIO_KEYS[`VOICE_${type.toUpperCase()}`];
        if (type === POWERUP_TYPES.VAJRA) voiceKey = AUDIO_KEYS.VOICE_VAJRA_GET;
        if (type === POWERUP_TYPES.BIKARA) voiceKey = AUDIO_KEYS.VOICE_BIKARA_YIN; // 取得時は陰固定など

        const now = this.time.now;
        if (voiceKey && (now - (this.lastPlayedVoiceTime[voiceKey] || 0) > this.voiceThrottleTime)) {
            try {
                this.sound.play(voiceKey);
                this.lastPlayedVoiceTime[voiceKey] = now;
            } catch (e) { console.error(`Error playing voice ${voiceKey}:`, e); }
        }
    }
    // --- ▲ パワーアップ関連メソッド ▲ ---


    // --- ▼ 衝突処理メソッド ▼ ---
    hitPaddle(paddle, ball) {
        if (!paddle || !ball?.active || !ball.body) return;
        let diff = ball.x - paddle.x;
        let influence = Phaser.Math.Clamp(diff / (paddle.displayWidth / 2), -1, 1);
        let newVx = (NORMAL_BALL_SPEED * 0.85) * influence; // X速度の影響を少し強く
        let newVyAbs = Math.sqrt(Math.pow(NORMAL_BALL_SPEED, 2) - Math.pow(newVx, 2)) || NORMAL_BALL_SPEED * 0.5; // Y速度計算
        let newVy = -Math.abs(newVyAbs); // 必ず上向き
        if (Math.abs(newVy) < NORMAL_BALL_SPEED * 0.3) newVy = -NORMAL_BALL_SPEED * 0.3; // 最低Y速度

        let speedMultiplier = 1.0;
        if (ball.getData('isFast')) speedMultiplier = BALL_SPEED_MODIFIERS.SHATORA;
        else if (ball.getData('isSlow')) speedMultiplier = BALL_SPEED_MODIFIERS.HAILA;
        const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier;

        const finalVel = new Phaser.Math.Vector2(newVx, newVy).normalize().scale(targetSpeed);
        ball.setVelocity(finalVel.x, finalVel.y);

        this.sound.play(AUDIO_KEYS.SE_REFLECT);
        this.createImpactParticles(ball.x, ball.y + ball.displayHeight/2 * 0.8, [240, 300], 0xffffcc); // パドル下部エフェクト

        if (ball.getData('isIndaraActive')) this.deactivateIndara(ball); // パドルヒットでインダラ解除
    }

    hitBoss(boss, ball) {
        if (!boss || !ball?.active || boss.getData('isInvulnerable')) return;
        let damage = 1; // 基本ダメージ
        if (ball.getData('isKubiraActive')) damage += 1;
        // TODO: ビカラ陽のダメージ計算 (ball.getData('bikaraState') === 'yang' などで判断)
        this.applyBossDamage(boss, damage, "Ball Hit");

        if (ball.getData('isIndaraActive')) {
            this.deactivateIndara(ball);
        } else { // インダラでない場合のみ跳ね返す
            let speedMultiplier = 1.0;
            if (ball.getData('isFast')) speedMultiplier = BALL_SPEED_MODIFIERS.SHATORA;
            else if (ball.getData('isSlow')) speedMultiplier = BALL_SPEED_MODIFIERS.HAILA;
            const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier;
            const bounceVy = -ball.body.velocity.y; // 単純反転
            const minBounceSpeedY = NORMAL_BALL_SPEED * 0.4;
            const finalVy = Math.abs(bounceVy) < minBounceSpeedY ? -minBounceSpeedY * Math.sign(bounceVy || -1) : bounceVy;
            const finalVel = new Phaser.Math.Vector2(ball.body.velocity.x, finalVy).normalize().scale(targetSpeed);
            ball.setVelocity(finalVel.x, finalVel.y);
        }
    }

    applyBossDamage(bossInstance, damageAmount, source = "Unknown") { // 引数名変更
        if (!bossInstance?.active || bossInstance.getData('isInvulnerable')) return;
        let currentHealth = bossInstance.getData('health') - damageAmount;
        bossInstance.setData('health', currentHealth);
        this.events.emit('updateBossHp', currentHealth, bossInstance.getData('maxHealth'));
        console.log(`[Boss Damage] ${damageAmount} by ${source}. HP: ${currentHealth}/${bossInstance.getData('maxHealth')}`);

        const now = this.time.now;
        if (now - this.lastDamageVoiceTime > BOSS_DAMAGE_VOICE_THROTTLE) {
            this.sound.play(this.bossData.voiceDamage || AUDIO_KEYS.VOICE_BOSS_DAMAGE);
            this.lastDamageVoiceTime = now;
        }
        bossInstance.setTint(0xff0000); bossInstance.setData('isInvulnerable', true);
        const shakeAmount = bossInstance.displayWidth * 0.03;
        this.tweens.add({ targets: bossInstance, x: `+=${shakeAmount}`, duration: 40, yoyo: true, ease: 'Sine.InOut', repeat: 1 });
        this.time.delayedCall(250, () => { if (bossInstance.active) { bossInstance.clearTint(); bossInstance.setData('isInvulnerable', false); } });

        if (currentHealth <= 0) this.defeatBoss(bossInstance);
    }

    hitAttackBrick(brick, ball) { // Collider用 (インダラ/ビカラでないボール)
        if (!brick?.active || !ball?.active) return;
        this.destroyAttackBrickAndDropItem(brick);
        // ボール速度維持・再設定は hitPaddle, hitBoss で行われるのでここでは不要なことが多い
        // 必要ならボールの速度をここで再正規化
    }

    handleBallAttackBrickOverlap(brick, ball) { // Overlap用 (インダラ/ビカラ貫通ボール)
        if (!brick?.active || !ball?.active) return;
        console.log(`[Pierce] ${ball.getData('isIndaraActive') ? 'Indara' : 'Bikara'} piercing attack brick.`);
        this.destroyAttackBrick(brick, false); // アイテムドロップなしで破壊
    }

    destroyAttackBrickAndDropItem(brick) { // 通常の攻撃ブロック破壊 (アイテムドロップあり)
        const brickX = brick.x; const brickY = brick.y;
        this.destroyAttackBrick(brick, true); // アイテムドロップありで破壊
        // アイテムドロップ判定
        const dropRatePercent = this.chaosSettings.ratePercent;
        if (Phaser.Math.Between(1, 100) <= dropRatePercent) {
            if (this.bossDropPool?.length > 0) {
                const pool = this.bossDropPool.filter(type => type !== POWERUP_TYPES.BAISRAVA); // バイシュラヴァは特別枠
                if (pool.length > 0) {
                    this.dropSpecificPowerUp(brickX, brickY, Phaser.Utils.Array.GetRandom(pool));
                }
            }
        }
        // バイシュラヴァ特別ドロップ
        if (Phaser.Math.FloatBetween(0, 1) < BAISRAVA_DROP_RATE) {
            this.dropSpecificPowerUp(brickX, brickY, POWERUP_TYPES.BAISRAVA);
        }
    }

    destroyAttackBrick(brick, triggerItemDropLogic = false) { // 実際の破壊処理
        if (!brick?.active) return;
        this.sound.play(AUDIO_KEYS.SE_DESTROY);
        this.createImpactParticles(brick.x, brick.y, [0, 360], brick.tintTopLeft || 0xaa88ff, 10);
        brick.destroy();
        this.increaseVajraGauge(); // 攻撃ブロック破壊でヴァジラゲージ増加
    }

    dropSpecificPowerUp(x, y, type) {
        if (!type || !this.powerUps) return;
        let textureKey = POWERUP_ICON_KEYS[type] || 'whitePixel';
        const itemSize = this.gameWidth * POWERUP_SIZE_RATIO;
        let tintColor = (textureKey === 'whitePixel' && type === POWERUP_TYPES.BAISRAVA) ? 0xffd700 : (textureKey === 'whitePixel' ? 0xcccccc : null);

        const powerUp = this.powerUps.create(x, y, textureKey)
            .setDisplaySize(itemSize, itemSize)
            .setData('type', type);
        if (tintColor) powerUp.setTint(tintColor);
        if (powerUp.body) {
            powerUp.setVelocity(0, POWERUP_SPEED_Y);
            powerUp.body.setCollideWorldBounds(false).setAllowGravity(false);
        } else if (powerUp) powerUp.destroy();
    }

    handlePaddleHitByAttackBrick(paddle, attackBrick) {
        if (!paddle?.active || !attackBrick?.active) return;
        this.destroyAttackBrick(attackBrick, false); // アイテムドロップなしで破壊
        if (!this.isAnilaActive) {
            this.loseLife();
        } else {
            console.log("[Anila] Paddle hit blocked by Anila effect!");
            // TODO: アニラ無敵ヒットエフェクト
        }
    }

    hitBossWithMakiraBeam(beam, boss) {
         if (!beam?.active || !boss?.active || boss.getData('isInvulnerable')) return;
         beam.destroy();
         this.applyBossDamage(boss, 1, "Makira Beam");
    }
    // --- ▲ 衝突処理メソッド ▲ ---


    // --- ▼ ヘルパーメソッド ▼ ---
    createAndAddBall(x, y, vx = 0, vy = 0, dataToCopy = null) {
        if (!this.balls) return null;
        const ballRadius = this.gameWidth * BALL_RADIUS_RATIO;
        // 物理円半径は表示半径より少し小さくすることが多いが、今回は同じにするか調整
        const physicsRadius = ballRadius * 0.9;

        const ball = this.balls.create(x, y, 'ball_image')
            .setOrigin(0.5)
            .setDisplaySize(ballRadius * 2, ballRadius * 2)
            .setCircle(physicsRadius) // 見た目より少し小さい物理円
            .setCollideWorldBounds(true)
            .setBounce(1);

        if (ball.body) {
            ball.setVelocity(vx !== 0 ? vx : Phaser.Math.Between(BALL_INITIAL_VELOCITY_X_RANGE[0]/2, BALL_INITIAL_VELOCITY_X_RANGE[1]/2),
                             vy !== 0 ? vy : BALL_INITIAL_VELOCITY_Y/1.5); // 分裂時は少し弱めに
            ball.body.onWorldBounds = true;
        } else { if (ball) ball.destroy(); return null; }

        // データコピーと初期化
        ball.setData({
            activePowers: dataToCopy?.activePowers ? new Set(dataToCopy.activePowers) : new Set(),
            lastActivatedPower: dataToCopy?.lastActivatedPower ?? null,
            isKubiraActive: dataToCopy?.isKubiraActive ?? false,
            isFast: dataToCopy?.isFast ?? false,
            isSlow: dataToCopy?.isSlow ?? false,
            isIndaraActive: dataToCopy?.isIndaraActive ?? false,
            isBikaraPenetrating: dataToCopy?.isBikaraPenetrating ?? false,
            isSindaraActive: false, // 新規ボールはシンダラではない（activateSindaraで設定）
            isAnchiraActive: false, // 同上
            isMakoraActive: false,  // 同上
        });
        // ボール名はデバッグ用に一意にする
        ball.name = `ball_${this.balls.getLength()}_${Phaser.Math.RND.uuid()}`;
        if (dataToCopy) console.log(`Ball created by copying data from ${dataToCopy.name || 'source'}`);
        this.updateBallAppearance(ball);
        return ball;
    }

    keepFurthestBallAndClearOthers() { // 既存ボールを1つ（一番遠いもの）だけ残して他を消す
        const activeBalls = this.balls?.getMatching('active', true);
        if (!activeBalls || activeBalls.length === 0) return null;
        if (activeBalls.length === 1) return activeBalls[0];

        let furthestBall = activeBalls[0];
        let maxDistSq = -1;
        const paddleCenterY = this.paddle?.y ?? this.gameHeight; // パドルがない場合は画面下を基準

        activeBalls.forEach(ball => {
            const distSq = Phaser.Math.Distance.Squared(ball.x, ball.y, this.paddle?.x ?? this.gameWidth/2, paddleCenterY);
            if (distSq > maxDistSq) {
                maxDistSq = distSq;
                furthestBall = ball;
            }
        });
        activeBalls.forEach(ball => {
            if (ball !== furthestBall) ball.destroy();
        });
        return furthestBall;
    }

    updatePaddleSize() {
        if (!this.paddle) return;
        const newWidth = this.gameWidth * (this.paddle.getData('originalWidthRatio') || PADDLE_WIDTH_RATIO);
        this.paddle.setDisplaySize(newWidth, PADDLE_HEIGHT);
        // this.paddle.refreshBody(); // setDisplaySizeが内部で呼ぶはずだが念のため
        const halfWidth = this.paddle.displayWidth / 2;
        this.paddle.x = Phaser.Math.Clamp(this.paddle.x, halfWidth, this.gameWidth - halfWidth);
        if (this.paddle.body) this.paddle.body.updateFromGameObject(); // ボディサイズを確実に更新
    }

    clampPaddleYPosition() {
        if (!this.paddle) return;
        const paddleHalfHeight = this.paddle.displayHeight / 2;
        // 画面下端からの最小マージン（ブラウザUI対策など）
        const deadSpaceHeight = this.gameHeight * 0.05; // 例: 画面高さの5%
        const minY = this.gameHeight - paddleHalfHeight - deadSpaceHeight;
        // パドルが上がれる上限 (画面中央よりは下など)
        const maxY = this.gameHeight * 0.75;
        const targetY = this.gameHeight * (1 - PADDLE_Y_OFFSET_RATIO);
        this.paddle.y = Phaser.Math.Clamp(targetY, maxY, minY);
        if (this.paddle.body) this.paddle.body.updateFromGameObject();
    }

    updateBossSize(bossInstance, textureKey, widthRatio) { // ボスオブジェクトとテクスチャ、幅比率を引数に
        if (!bossInstance?.texture?.source[0]?.width) { // テクスチャがロードされているか確認
            console.warn("Boss texture not ready for size update, or bossInstance is invalid.");
            // フォールバックとしてデフォルトサイズを設定することも検討
            if (bossInstance) bossInstance.setDisplaySize(this.gameWidth * 0.2, this.gameWidth * 0.2);
            return;
        }
        const originalWidth = bossInstance.texture.source[0].width;
        const targetBossWidth = this.gameWidth * widthRatio;
        let desiredScale = targetBossWidth / originalWidth;
        desiredScale = Phaser.Math.Clamp(desiredScale, 0.05, 2.0); // 極端なスケールを防止
        bossInstance.setScale(desiredScale);

        // 当たり判定のサイズもテクスチャの表示サイズに合わせるのが一般的
        // 必要であれば、当たり判定専用の幅・高さを設定
        // const hitboxWidth = bossInstance.displayWidth * 0.8; // 例: 表示幅の80%
        // const hitboxHeight = bossInstance.displayHeight * 0.7; // 例: 表示高さの70%
        // bossInstance.body?.setSize(hitboxWidth, hitboxHeight).setOffset(...);
        if (bossInstance.body) bossInstance.body.updateFromGameObject(); // 表示サイズに合わせてボディ更新
        console.log(`Boss (${textureKey}) size updated. Scale: ${desiredScale.toFixed(2)}`);
    }

    updateBossSizeAfterIntro() { // 登場演出後のボスサイズ最終調整
        if (!this.boss?.active) return;
        // createSpecificBossで設定された widthRatio を使う
        this.updateBossSize(this.boss, this.bossData.textureKey, this.bossData.widthRatio);
        // ボディを確実に有効化
        if (this.boss.body) {
            this.boss.body.enable = true;
            this.boss.body.updateFromGameObject(); // 表示に合わせて更新
        }
    }

    applySpeedModifier(ball, type) {
        if (!ball?.active || !ball.body) return;
        const modifier = (type === POWERUP_TYPES.SHATORA) ? BALL_SPEED_MODIFIERS.SHATORA :
                         (type === POWERUP_TYPES.HAILA) ? BALL_SPEED_MODIFIERS.HAILA : 1.0;
        const currentVelocity = ball.body.velocity;
        const direction = currentVelocity.lengthSq() > 0 ? currentVelocity.clone().normalize() : new Phaser.Math.Vector2(0, -1);
        const newSpeed = NORMAL_BALL_SPEED * modifier;
        ball.setVelocity(direction.x * newSpeed, direction.y * newSpeed);
    }
    resetBallSpeed(ball) {
        if (!ball?.active || !ball.body) return;
        const currentVelocity = ball.body.velocity;
        const direction = currentVelocity.lengthSq() > 0 ? currentVelocity.clone().normalize() : new Phaser.Math.Vector2(0, -1);
        ball.setVelocity(direction.x * NORMAL_BALL_SPEED, direction.y * NORMAL_BALL_SPEED);
    }

    // --- 汎用攻撃ブロック生成 (updateSpecificBossBehavior から呼ばれる例) ---
    scheduleNextGenericAttackBrick() {
        if (this.attackBrickTimer) this.attackBrickTimer.remove();
        const nextDelay = Phaser.Math.Between(ATTACK_BRICK_SPAWN_DELAY_MIN, ATTACK_BRICK_SPAWN_DELAY_MAX);
        this.attackBrickTimer = this.time.addEvent({
            delay: nextDelay,
            callback: this.spawnGenericAttackBrick,
            callbackScope: this,
            loop: false
        });
    }
    spawnGenericAttackBrick() {
        if (!this.attackBricks || !this.boss?.active || this.isGameOver || this.bossDefeated) {
            this.scheduleNextGenericAttackBrick(); // ボスがいない場合も次の予約だけする
            return;
        }
        const spawnX = Phaser.Math.FloatBetween(0, 1) < 0.6 ? Phaser.Math.Between(this.sideMargin, this.gameWidth - this.sideMargin) : this.boss.x;
        const spawnY = -30; // 画面上部から
        const brickTexture = 'attackBrick'; // 攻撃ブロック用テクスチャキー
        const attackBrick = this.attackBricks.create(spawnX, spawnY, brickTexture);

        if (attackBrick) {
            // サイズはテクスチャ固有サイズか、割合で調整
            const brickScale = this.gameWidth * 0.08 / attackBrick.width; // 例: 画面幅の8%に
            attackBrick.setScale(brickScale);
            attackBrick.setVelocityY(ATTACK_BRICK_VELOCITY_Y);
            if (attackBrick.body) {
                attackBrick.body.setAllowGravity(false).setCollideWorldBounds(false);
                // 必要なら当たり判定サイズ調整
                // attackBrick.body.setSize(attackBrick.displayWidth * 0.8, attackBrick.displayHeight * 0.8);
            }
        }
        this.scheduleNextGenericAttackBrick(); // 次の生成を予約
    }
    updateAttackBricks() {
        this.attackBricks?.getChildren().forEach(brick => {
            if (brick.active && brick.y > this.gameHeight + brick.displayHeight) {
                brick.destroy();
            }
        });
    }
    // --- ▲ 汎用攻撃ブロック ---

    setupAfterImageEmitter() {
        if (this.bossAfterImageEmitter) this.bossAfterImageEmitter.destroy();
        if (!this.boss) return;

        this.bossAfterImageEmitter = this.add.particles(0, 0, 'whitePixel', { // whitePixelで柔軟に色付け
            lifespan: { min: 300, max: 700 },
            speed: 0, // その場に残る
            scale: { start: this.boss.scale * 0.7, end: 0.1 },
            alpha: { start: 0.6, end: 0 },
            quantity: 1,
            frequency: 50, // ms ごとに放出
            blendMode: 'ADD', // 光る感じ
            tint: [0xaaaaff, 0xaaaaff, 0xddddff], // ボスの色に合わせた薄い色
            emitting: false
        });
        this.bossAfterImageEmitter.setDepth(this.boss.depth - 1);
    }

    startRandomVoiceTimer() {
        if (this.randomVoiceTimer) this.randomVoiceTimer.remove();
        if (!this.bossVoiceKeys || this.bossVoiceKeys.length === 0) return;

        const playRandomVoice = () => {
            if (this.bossDefeated || this.isGameOver || !this.boss?.active) {
                this.randomVoiceTimer?.remove(); return;
            }
            this.sound.play(Phaser.Utils.Array.GetRandom(this.bossVoiceKeys));
            const nextDelay = Phaser.Math.Between(BOSS_RANDOM_VOICE_MIN_DELAY, BOSS_RANDOM_VOICE_MAX_DELAY);
            this.randomVoiceTimer = this.time.delayedCall(nextDelay, playRandomVoice, [], this);
        };
        this.randomVoiceTimer = this.time.delayedCall(
            Phaser.Math.Between(BOSS_RANDOM_VOICE_MIN_DELAY / 2, BOSS_RANDOM_VOICE_MAX_DELAY / 2), // 最初は少し早め
            playRandomVoice, [], this
        );
    }

    // --- リサイズ処理 ---
    handleResize(gameSize) {
        console.log(`${this.scene.key} resized to ${gameSize.width}x${gameSize.height}`);
        this.gameWidth = gameSize.width;
        this.gameHeight = gameSize.height;
        this.calculateDynamicMargins();

        this.updatePaddleSize();
        this.clampPaddleYPosition();
        if (this.boss?.active) { // ボスがいればサイズ更新
             this.updateBossSize(this.boss, this.bossData.textureKey, this.bossData.widthRatio);
             // ボス移動範囲も再計算が必要な場合がある (startSpecificBossMovement内で画面サイズ使うなら)
        }
        this.balls?.getChildren().forEach(ball => { // ボールの半径も画面サイズ依存なら更新
            const newBallRadius = this.gameWidth * BALL_RADIUS_RATIO;
            ball.setDisplaySize(newBallRadius * 2, newBallRadius * 2);
            if (ball.body) ball.setCircle(newBallRadius * 0.9);
        });
        // 攻撃ブロックやアイテムの表示サイズも再計算が必要ならここで
        this.powerUps?.getChildren().forEach(item => {
            item.setDisplaySize(this.gameWidth * POWERUP_SIZE_RATIO, this.gameWidth * POWERUP_SIZE_RATIO);
        });
        // UIScene にもリサイズ通知
        if (this.scene.isActive('UIScene')) {
            this.events.emit('gameResize'); // UISceneが購読するイベント
        }
        // ゲームオーバー/クリアテキストの位置・サイズ更新
        this.gameOverText?.setPosition(this.gameWidth/2, this.gameHeight/2).setFontSize(`${this.calculateDynamicFontSize(40)}px`);
        this.gameClearText?.setPosition(this.gameWidth/2, this.gameHeight*0.4).setFontSize(`${this.calculateDynamicFontSize(48)}px`)
                          .setWordWrapWidth(this.gameWidth * 0.9);
    }
    calculateDynamicFontSize(baseSizeMax) { // UISceneのものを流用
        const calculatedSize = Math.floor(this.gameWidth / (UI_FONT_SIZE_SCALE_DIVISOR || 25));
        return Phaser.Math.Clamp(calculatedSize, UI_FONT_SIZE_MIN, baseSizeMax);
    }

    // --- ポインター処理 ---
    handlePointerMove(pointer) {
        if (!this.playerControlEnabled || this.isGameOver || !this.paddle?.active) return;
        const targetX = pointer.x;
        const halfWidth = this.paddle.displayWidth / 2;
        const clampedX = Phaser.Math.Clamp(targetX, halfWidth + this.sideMargin/2, this.gameWidth - halfWidth - this.sideMargin/2); // マージン考慮
        this.paddle.x = clampedX;
        if (!this.isBallLaunched && this.balls?.countActive(true) > 0) {
            this.balls.getFirstAlive().x = clampedX;
        }
    }
    handlePointerDown() {
        if (this.isGameOver && this.gameOverText?.visible) this.returnToTitle();
        else if (this.bossDefeated && this.gameClearText?.visible) this.returnToTitle(); // クリア後も
        else if (this.playerControlEnabled && this.lives > 0 && !this.isBallLaunched && this.balls?.countActive(true) > 0) {
            this.launchBall();
        }
    }
    launchBall() {
        if (!this.balls?.countActive(true)) return;
        const ballToLaunch = this.balls.getFirstAlive();
        if (ballToLaunch) {
            ballToLaunch.setVelocity(
                Phaser.Math.Between(BALL_INITIAL_VELOCITY_X_RANGE[0], BALL_INITIAL_VELOCITY_X_RANGE[1]),
                BALL_INITIAL_VELOCITY_Y
            );
            this.isBallLaunched = true;
            this.sound.play(AUDIO_KEYS.SE_LAUNCH);
        }
    }
    updateBallFall() {
        if (!this.balls?.active) return;
        let activeBallCount = 0;
        let shouldLoseLifeThisFrame = false;
        let droppedSindaraBall = null;

        this.balls.getChildren().forEach(ball => {
            if (ball.active) {
                activeBallCount++;
                if (this.isBallLaunched && ball.y > this.gameHeight + ball.displayHeight * 2) { // 画面外判定を少し余裕持たせる
                    if (this.isAnilaActive) {
                        this.deactivateAnila(); // アニラ効果消費
                        ball.y = this.paddle.y - this.paddle.displayHeight; // パドルの少し上に
                        ball.setVelocityY(BALL_INITIAL_VELOCITY_Y * 0.8); // 少し弱めに跳ね返す
                        console.log("[Anila] Ball bounced by Anila effect!");
                    } else {
                        ball.setActive(false).setVisible(false);
                        if (ball.body) ball.body.enable = false;
                        shouldLoseLifeThisFrame = true;
                        if (ball.getData('isSindaraActive')) droppedSindaraBall = ball;
                    }
                }
            }
        });

        if (droppedSindaraBall) { // シンダラ解除判定
            const remainingSindara = this.balls.getMatching('isSindaraActive', true);
            if (remainingSindara.length <= 1) { // 自身を含めて1つ以下なら
                remainingSindara.forEach(b => this.deactivateSindara(b, true)); // 即時解除
            }
        }

        if (shouldLoseLifeThisFrame && this.balls.countActive(true) === 0 && this.lives > 0 && !this.isGameOver && !this.bossDefeated) {
            this.loseLife();
        }
    }
    handleWorldBounds(body, up, down, left, right) {
        const gameObject = body.gameObject;
        if (!gameObject || !(gameObject instanceof Phaser.Physics.Arcade.Image) || !gameObject.active) return;

        if (this.balls.contains(gameObject)) { // ボールが壁に当たった場合
            if (up || left || right) { // 下以外
                this.sound.play(AUDIO_KEYS.SE_REFLECT, { volume: 0.7 });
                let impactPointX = gameObject.x, impactPointY = gameObject.y;
                let angleRange = [0,0];
                if(up) { impactPointY = body.y; angleRange = [60, 120]; }
                else if(left) { impactPointX = body.x; angleRange = [-30, 30]; }
                else if(right) { impactPointX = body.x + body.width; angleRange = [150, 210]; }
                this.createImpactParticles(impactPointX, impactPointY, angleRange, 0xffffff, 5);
            }
        } else if (this.familiars?.contains(gameObject)) { // マキラ子機が壁に当たった場合
             // console.log("Familiar hit world bounds");
             // 跳ね返りSEなど（必要なら）
        }
    }
    createImpactParticles(x, y, angleRange, tint, count = 8) {
        const particles = this.add.particles(0,0, 'whitePixel', {
            x: x, y: y,
            lifespan: { min: 100, max: 300 },
            speed: { min: 80, max: 150 },
            angle: { min: angleRange[0], max: angleRange[1] },
            gravityY: 200,
            scale: { start: 0.6, end: 0 },
            quantity: count,
            blendMode: 'ADD',
            emitting: false
        });
        particles.setParticleTint(tint);
        particles.explode(count);
        this.time.delayedCall(400, () => particles.destroy());
    }

    // --- BGM・SE ---
    playBossBgm() {
        this.stopBgm();
        const bgmKey = this.bossData.bgmKey || AUDIO_KEYS.BGM2; // ボスデータにBGMキーがなければデフォルト
        this.currentBgm = this.sound.add(bgmKey, { loop: true, volume: 0.45 });
        try { this.currentBgm.play(); }
        catch (e) { console.error(`Error playing BGM ${bgmKey}:`, e); }
    }
    stopBgm() {
        if (this.currentBgm) {
            try { this.currentBgm.stop(); this.sound.remove(this.currentBgm); }
            catch (e) { console.error("Error stopping BGM:", e); }
            this.currentBgm = null;
        }
    }

    // --- クリーンアップ ---
    safeDestroyCollider(colliderRef, name = "collider") {
        if (colliderRef) {
            try {
                colliderRef.destroy();
                // console.log(`[Shutdown] ${name} destroyed.`);
            } catch (e) { console.error(`[Shutdown] Error destroying ${name}:`, e.message); }
        }
        colliderRef = null; // プロパティの参照もクリア
    }
    safeDestroy(obj, name, destroyChildren = false) {
        if (obj && obj.scene) { // Phaser.GameObjects.GameObject は scene プロパティを持つ
            try {
                obj.destroy(destroyChildren);
                // console.log(`[Shutdown] ${name} destroyed.`);
            } catch (e) { console.error(`[Shutdown] Error destroying ${name}:`, e.message); }
        }
        obj = null; // プロパティの参照もクリア
    }

    shutdownScene() {
        console.log(`--- ${this.scene.key} SHUTDOWN ---`);
        this.stopBgm();
        this.sound.stopAll(); // 全ての音を停止

        this.tweens.killAll(); // このシーンの全Tweenを停止・破棄
        this.time.removeAllEvents(); // 全てのタイマーイベントを削除

        // イベントリスナー解除
        this.scale.off('resize', this.handleResize, this);
        if (this.physics.world) this.physics.world.off('worldbounds', this.handleWorldBounds, this);
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.off('pointerdown', this.handlePointerDown, this);
        this.events.off('shutdown', this.shutdownScene, this); // 自分自身のシャットダウンリスナーも解除
        this.events.removeAllListeners(); // 他のカスタムイベントも全て解除

        // コライダー破棄
        this.safeDestroyCollider(this.ballPaddleCollider, "ballPaddleCollider");
        this.safeDestroyCollider(this.ballBossCollider, "ballBossCollider");
        this.safeDestroyCollider(this.ballAttackBrickCollider, "ballAttackBrickCollider");
        this.safeDestroyCollider(this.ballAttackBrickOverlap, "ballAttackBrickOverlap");
        this.safeDestroyCollider(this.paddlePowerUpOverlap, "paddlePowerUpOverlap");
        this.safeDestroyCollider(this.paddleAttackBrickCollider, "paddleAttackBrickCollider");
        this.safeDestroyCollider(this.makiraBeamBossOverlap, "makiraBeamBossOverlap");

        // ゲームオブジェクト破棄 (グループは子要素も一緒に破棄)
        this.safeDestroy(this.paddle, "paddle");
        this.safeDestroy(this.balls, "balls group", true);
        this.safeDestroy(this.boss, "boss");
        this.safeDestroy(this.attackBricks, "attackBricks group", true);
        this.safeDestroy(this.powerUps, "powerUps group", true);
        this.safeDestroy(this.familiars, "familiars group", true);
        this.safeDestroy(this.makiraBeams, "makiraBeams group", true);
        this.safeDestroy(this.gameOverText, "gameOverText");
        this.safeDestroy(this.gameClearText, "gameClearText");
        this.safeDestroy(this.bossAfterImageEmitter, "bossAfterImageEmitter");

        // プロパティ参照クリア
        this.paddle = null; this.balls = null; this.boss = null;
        this.attackBricks = null; this.powerUps = null; this.familiars = null; this.makiraBeams = null;
        this.gameOverText = null; this.gameClearText = null; this.bossAfterImageEmitter = null;
        this.uiScene = null; this.currentBgm = null;
        this.powerUpTimers = {}; this.bikaraTimers = {}; this.lastPlayedVoiceTime = {};
        this.bossMoveTween = null; this.randomVoiceTimer = null; this.attackBrickTimer = null;
        this.anilaTimer = null; this.anchiraTimer = null; this.makiraAttackTimer = null;

        console.log(`--- ${this.scene.key} SHUTDOWN Complete ---`);
    }
    // --- ▲ ヘルパーメソッド ▲ ---
}
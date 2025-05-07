// BossScene.js (修正版4 - 省略なし完全コード - 子機削除、単純Tween)

import {
    PADDLE_WIDTH_RATIO, PADDLE_HEIGHT, PADDLE_Y_OFFSET, BALL_RADIUS, PHYSICS_BALL_RADIUS,
    BALL_INITIAL_VELOCITY_Y, BALL_INITIAL_VELOCITY_X_RANGE, NORMAL_BALL_SPEED, AUDIO_KEYS, MAX_STAGE, POWERUP_TYPES,
    ALL_POSSIBLE_POWERUPS, // アイテムドロップで使う可能性
    POWERUP_ICON_KEYS, // アイテムドロップで使う可能性
    BRICK_WIDTH_RATIO, POWERUP_SIZE, POWERUP_SPEED_Y,
    POWERUP_DURATION, BALL_SPEED_MODIFIERS,// 時間・速度関連の定数を追加
    // --- ▼ マキラ関連の定数をインポート ▼ ---
    MAKIRA_ATTACK_INTERVAL,
    MAKIRA_FAMILIAR_SIZE,
    MAKIRA_FAMILIAR_OFFSET,
    MAKIRA_BEAM_WIDTH,
    MAKIRA_BEAM_HEIGHT,
    MAKIRA_BEAM_COLOR,
    MAKIRA_BEAM_SPEED,
    // --- ▲ マキラ関連の定数をインポート ▲ ---
    MAKORA_COPYABLE_POWERS,
     // ▼▼▼ ここに VAJRA_GAUGE_MAX を追加 ▼▼▼
     VAJRA_GAUGE_MAX,
     VAJRA_GAUGE_INCREMENT // ヴァジラ関連の他の定数もここでインポートしておくと良い
} from './constants.js';

// --- ボス戦用定数 ---
const BOSS_MAX_HEALTH = 20;
const BOSS_SCORE = 1500;
// ▼ ボスの動き設定 (左右往復) ▼
const BOSS_MOVE_RANGE_X_RATIO = 0.8; // 画面幅の60%を往復
const BOSS_MOVE_DURATION = 4000; // 片道にかかる時間 (ms)

// --- ▼ 演出・サウンド関連定数 (調整用) ▼ ---
const CUTSCENE_DURATION = 1500;       // カットイン表示時間
const CUTSCENE_FLASH_DURATION = 200;  // カットイン開始時フラッシュ時間
const INTRO_FLASH_DURATION = 200;     // 登場前フラッシュ時間
const ZOOM_IN_DURATION = 1300;        // ズームイン時間
const ZOOM_WAIT_DURATION = 200;       // ドアップでの待機時間
const SHRINK_DURATION = 50;           // 瞬間縮小時間
const SHRINK_FLASH_DURATION = 150;    // 縮小完了時フラッシュ時間
const VOICE_START_DELAY = 100;        // ボイス再生開始までの遅延
const GAMEPLAY_START_DELAY = 600;     // ボイス再生から操作可能になるまでの遅延
const BOSS_RANDOM_VOICE_MIN_DELAY = 8000;  // 戦闘中ボイス最小間隔
const BOSS_RANDOM_VOICE_MAX_DELAY = 15000; // 戦闘中ボイス最大間隔
const BOSS_DAMAGE_VOICE_THROTTLE = 2000; // ダメージボイスのスロットリング時間(ms)
const DEFEAT_FLASH_DURATION = 150;    // 撃破時フラッシュ時間
const DEFEAT_FLASH_INTERVAL = 800;    // ★ 撃破時フラッシュ間隔 (少し長く)
const DEFEAT_FLASH_COUNT = 3;
const DEFEAT_SHAKE_DURATION = 1200;   // ★ シェイク時間 (少し長く)
const DEFEAT_FADE_DURATION = 1500;    // ★ フェードアウト時間 (少し長く)
// --- ▲ 演出・サウンド関連定数 ▲ ---
// --- ▲ ボスの動き設定 ▲ ---
// ★ 攻撃ブロック関連の定数
const ATTACK_BRICK_VELOCITY_Y = 150; // 落下速度
const ATTACK_BRICK_SPAWN_DELAY_MIN = 600; // 最短生成間隔 (ms)
const ATTACK_BRICK_SPAWN_DELAY_MAX = 1400; // 最長生成間隔 (ms)
const ATTACK_BRICK_SCALE = 0.8; // ブロックの表示スケール (仮)
const ATTACK_BRICK_SPAWN_FROM_TOP_CHANCE = 0.5; // 上から降ってくる確率 (60%)
const ATTACK_BRICK_ITEM_DROP_RATE = 0.4; // 破壊時にアイテムを落とす確率 (40%)
const FAMILIAR_MOVE_SPEED_X = 180; // ★ 子機の左右移動速度 (追加
const ANILA_DURATION = POWERUP_DURATION[POWERUP_TYPES.ANILA] || 10000; // アニラ効果時間 (10秒)
const PADDLE_NORMAL_TINT = 0xffff00; // 通常のパドルの色 (黄色)
const PADDLE_ANILA_TINT = 0xffffff; // アニラ効果中のパドルの色 (白)
const PADDLE_ANILA_ALPHA = 0.9;     // アニラ効果中のパドルの透明度 (少し透明)
const ANCHIRA_DURATION = POWERUP_DURATION[POWERUP_TYPES.ANCHIRA] || 5000; // アンチラ効果時間 (8秒)
const MAKORA_COPY_DELAY = 150; // マコラ取得からコピー発動までの時間 (ms)

// --- 定数 (追尾速度調整用) ---
const INDARA_HOMING_SPEED = NORMAL_BALL_SPEED * 1.2; // 通常より少し速く？
const BIKARA_DURATION = POWERUP_DURATION[POWERUP_TYPES.BIKARA] || 8000;


export default class BossScene extends Phaser.Scene {
    constructor() {
        super('BossScene');

        // --- プロパティ初期化 ---
        this.paddle = null;
        this.balls = null;
        this.boss = null;
        this.attackBricks = null; // 子機は削除

        this.randomVoiceTimer = null;     // ★ 戦闘中ランダムボイスタイマー
        this.lastDamageVoiceTime = 0;   // ★ ダメージボイスのスロットリング用
        // 正しい書き方 (直接キー指定の場合)
this.bossVoiceKeys = [
    'voice_boss_random_1',
    'voice_boss_random_2',
    'voice_boss_random_3'
];


        this.lives = 3;
        this.score = 0;
        this.chaosSettings = null;
        this.currentStage = MAX_STAGE;

        this.isBallLaunched = false;
        this.isGameOver = false;
        this.bossDefeated = false;
        this.playerControlEnabled = true;
        this.bossMoveTween = null;
        this.bossAfterImageEmitter = null; // ★ 残像用エミッタのプロパテ
        this.attackBrickTimer = null; // ★ 攻撃ブロック生成タイマー用
        this.powerUps = null; // ★ パワーアップグループ用プロパティ追加
        this.bossDropPool = []; // ★ ボス戦用ドロッププールプロパティ追加
        this.powerUpTimers = {}; // ★ パワーアップタイマー用プロパティ
        this.isVajraSystemActive = false; // ★ ヴァジラゲージシステムが有効か
        this.vajraGauge = 0;              // ★ ヴァジラゲージの現在値
        this.isAnilaActive = false; // ★ アニラ効果が有効か
        this.anilaTimer = null;     // ★ アニラ効果タイマー
        this.anchiraTimer = null; // ★ アンチラ効果タイマー (シーン全体で1つ)
        // isAnchiraActive フラグはボールデータで管理
        this.bikaraTimers = {}; // ボールごとのタイマー管理は維持
        this.paddleAttackBrickCollider = null; // ★ パドルと攻撃ブロックのコライダー参照

        // コライダー参照
        this.ballPaddleCollider = null;
        this.ballBossCollider = null;
        this.ballAttackBrickCollider = null; // 子機削除
        this.ballAttackBrickCollider = null;
         this.paddlePowerUpOverlap = null; // ★ パドルとアイテムのオーバーラップ参照
         // ...
         this.lastPlayedVoiceTime = {}; // ★ ボイス再生抑制用 (GameSceneからコピー)
         this.voiceThrottleTime = 500;  // ★ ボイス再生抑制用 (GameSceneからコピー)

        // UI連携用
        this.uiScene = null;

        // その他
        this.gameWidth = 0;
        this.gameHeight = 0;
        this.currentBgm = null;
    }

    init(data) {
        console.log("BossScene Init Start");
        console.log("Received data in BossScene init:", data); // ★ 受け取ったデータ全体をログ出力
        this.lives = data.lives || 3;
        this.score = data.score || 0;
        if (data && data.chaosSettings) {
            // ★ GameSceneから(rate)かTitleSceneから(ratePercent)かで処理を分けるか、
            //    または、常に ratePercent を期待して変換するのが安全かも？
            // 例：常に ratePercent を期待する方式
            this.chaosSettings = {
                count: data.chaosSettings.count,
                rate: (data.chaosSettings.ratePercent ?? (data.chaosSettings.rate ? data.chaosSettings.rate * 100 : 50)) / 100.0 // ratePercent優先、なければrate*100、それもなければ50%
            };
            this.chaosSettings.rate = Phaser.Math.Clamp(this.chaosSettings.rate, 0, 1);
            console.log('Chaos Settings Set in BossScene:', this.chaosSettings); // ★ 設定後の値を確認
       } else {
            console.log('No Chaos Settings received in BossScene, using defaults.');
            this.chaosSettings = { count: 4, rate: 0.5 }; // デフォルト値
       }
        console.log(`BossScene Initialized with Lives: ${this.lives}, Score: ${this.score}`);
        Object.values(this.powerUpTimers).forEach(timer => { if (timer) timer.remove(); });
        this.powerUpTimers = {};
        this.bossDropPool = []; // ★ initでも初期化
        this.isBallLaunched = false;
        this.isGameOver = false;
        this.bossDefeated = false;
        this.playerControlEnabled = true;
        this.currentBgm = null;
        this.isVajraSystemActive = false; // ★ initでも初期化
        this.vajraGauge = 0;              // ★ initでも初期化
        this.isAnilaActive = false; // ★ initでも初期化
        if (this.anilaTimer) this.anilaTimer.remove();
        this.anilaTimer = null;
        if (this.anchiraTimer) this.anchiraTimer.remove(); // ★ initでタイマークリア
        this.anchiraTimer = null;
        if (this.bossMoveTween) {
            this.bossMoveTween.stop();
            this.bossMoveTween = null;
        }
        if (this.randomVoiceTimer) this.randomVoiceTimer.remove(); // ★ タイマークリア
        this.randomVoiceTimer = null;
        this.lastDamageVoiceTime = 0; // ★ スロットリング初期化
    }

    preload() {
        console.log("BossScene Preload");
    }

    create() {
        console.log("BossScene Create Start");
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;

        // --- 1. 基本設定とUI ---
        this.setupBackground(); // 背景とBGM設定を分離
        this.setupUI();
        this.setupPhysics();

        // --- 2. ゲームオブジェクト生成 (ボスは最初は非表示) ---
        this.createPaddle();
        this.createBalls();
        this.createBoss(false); // ★ initiallyVisible = false で生成
        this.createAttackBricksGroup();
        this.setupAfterImageEmitter();
        this.createPowerUpsGroup();

        // --- 3. プール設定、コライダー、テキスト、入力 ---
        this.setupBossDropPool();
        this.setColliders();
        this.createGameOverText();
        this.setupInputAndEvents();

        // --- 4. ★ 演出開始 ★ ---
        this.playerControlEnabled = false; // 最初は操作不可
        // ▼▼▼ サウンド停止 ▼▼▼
    console.log("[Intro] Stopping all sounds and previous BGM before cutscene.");
    this.sound.stopAll();
    this.stopBgm(); // ★ 前のBGMがあれば止める
    // this.playBossBgm(); // ← ここでのBGM再生は削除！
    // ▲▲▲ サウンド停止 ▲▲▲
        this.startIntroCutscene();      // カットイン演出を開始

        console.log("BossScene Create End - Waiting for intro");
    

    

    // --- ▼ Create ヘルパーメソッド分割 ▼ ---
        // --- 5. ゲームオーバーテキスト ---
        this.createGameOverText();

        // --- 6. 入力・イベントリスナー設定 ---
        this.setupInputAndEvents();

        // --- 7. ボスの動きを開始 ---
        //this.startBossMovement();

        // --- ▼ 攻撃ブロック生成タイマーを開始 ▼ ---
        //this.scheduleNextAttackBrick();
        // --- ▲ 攻撃ブロック生成タイマーを開始 ▲ ---

        console.log("BossScene Create End");
    }

    /// BossScene.js の update メソッド (最終デバッグ)

    // BossScene.js 内
update(time, delta) {
    if (this.isGameOver || this.bossDefeated) {
         if (this.bossAfterImageEmitter && this.bossAfterImageEmitter.emitting) {
             this.bossAfterImageEmitter.stop();
         }
        return;
    }

    // --- 残像エミッタの位置追従 ---
    if (this.bossAfterImageEmitter && this.boss && this.boss.active) {
        this.bossAfterImageEmitter.setPosition(this.boss.x, this.boss.y);
        if (!this.bossAfterImageEmitter.emitting) {
             // console.log("[DEBUG AfterImage] Force starting emitter in update."); // 必要ならデバッグログ復活
             this.bossAfterImageEmitter.start();
        }
    }

    // --- ▼▼▼ マキラ子機追従ロジック削除 ▼▼▼ ---
    /*
    // このブロック全体を削除またはコメントアウト
    console.log(`[Update Tick ${time.toFixed(0)}] isMakiraActive: ${this.isMakiraActive}`);
    if (this.isMakiraActive) {
         // ... (追従のための setPosition などの処理) ...
    } else {
         // ...
    }
    */
    // --- ▲▲▲ マキラ子機追従ロジック削除 ▲▲▲ ---

    this.updateBallFall();
    this.updateAttackBricks();
    // updateMakiraBeams(); // このメソッドは定義されていなければ不要
}
    

    // --- ▼ Create ヘルパーメソッド ▼ ---

    setupUI() {
         // ▼▼▼ 起動前チェック ▼▼▼
    console.log("[BossScene setupUI] Checking UIScene status before launch. Active?", this.scene.isActive('UIScene'));
    // ▲▲▲ 起動前チェック ▲▲▲
        console.log("Launching UIScene for Boss...");
       // ▼▼▼ 既にアクティブなら launch しないようにする（より安全）▼▼▼
    if (!this.scene.isActive('UIScene')) {
        const dataToPass = { parentSceneKey: 'BossScene' };
        console.log(">>> Preparing to launch UIScene. Data:", JSON.stringify(dataToPass));
        try {
            this.scene.launch('UIScene', dataToPass);
            console.log("<<< UIScene launch command sent.");
        } catch (e) { console.error("!!! ERROR during UIScene launch:", e); }
   } else {
       console.warn("[BossScene setupUI] UIScene is already active. Skipping launch, but trying to get reference.");
       // 既にアクティブでも参照取得は試みる
   }
   // ▲▲▲ 既にアクティブなら launch しない ▲▲▲
        this.uiScene = this.scene.get('UIScene');
        // 初期UI更新 (少し遅延させるのは良いプラクティス)
        this.time.delayedCall(50, () => {
            if (this.uiScene && this.uiScene.scene.isActive()) {
                console.log("Updating initial UI for BossScene.");
                // ★ this (BossScene) のプロパティを使ってイベントを発行 ★
                this.events.emit('updateLives', this.lives);
                this.events.emit('updateScore', this.score);
                this.events.emit('updateStage', this.currentStage);
                 // ボス戦開始時はヴァジラUIは非表示、ドロッププールは空のはず
                 this.events.emit('deactivateVajraUI');
                 this.events.emit('updateDropPoolUI', this.bossDropPool); // bossDropPool を渡す
            } else { console.warn("UIScene not ready for initial UI update in BossScene."); }
        }, [], this);
    }

    setupBackground() {
        this.add.image(this.gameWidth / 2, this.gameHeight / 2, 'gameBackground3')
            .setOrigin(0.5, 0.5)
            .setDisplaySize(this.gameWidth, this.gameHeight)
            .setDepth(-1) // 背景は一番奥
            .setAlpha(0.8); // ★ 例: 少し透明にする (80%)
    }
    



    // --- ▼ Create ヘルパーメソッドに setupBossDropPool を追加 ▼ ---
    setupBossDropPool() {
        console.log("Setting up boss drop pool...");
        const possibleDrops = [...ALL_POSSIBLE_POWERUPS];
        const shuffledPool = Phaser.Utils.Array.Shuffle(possibleDrops);
        const countToUse = this.chaosSettings?.count ?? 0; // 安全に取得
        this.bossDropPool = shuffledPool.slice(0, countToUse);
        console.log(`Boss Drop Pool (Count: ${countToUse}): [${this.bossDropPool.join(',')}]`);
    }
    // --- ▲ Create ヘルパーメソッドに setupBossDropPool を追加 ▲ ---

    setupPhysics() {
        console.log("Setting up physics world for BossScene...");
        this.physics.world.setBoundsCollision(true, true, true, false);
        this.physics.world.off('worldbounds', this.handleWorldBounds, this);
        this.physics.world.on('worldbounds', this.handleWorldBounds, this);
        console.log("Physics world setup complete.");
    }

    createPaddle() {
        console.log("Creating paddle...");
        if (this.paddle) { this.paddle.destroy(); this.paddle = null; }
        this.paddle = this.physics.add.image(this.gameWidth / 2, this.gameHeight - PADDLE_Y_OFFSET, 'whitePixel')
            .setTint(0xffff00).setImmovable(true).setData('originalWidthRatio', PADDLE_WIDTH_RATIO);
        this.updatePaddleSize();
        console.log("Paddle created.");
    }

    createBalls() {
        console.log("Creating balls group and initial ball...");
        if (this.balls) { this.balls.destroy(true); this.balls = null; }
        this.balls = this.physics.add.group({ bounceX: 1, bounceY: 1, collideWorldBounds: true });
        if (this.paddle && this.paddle.active) {
            this.createAndAddBall(this.paddle.x, this.paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS);
        } else {
            console.warn("Paddle not available, creating ball at default position.");
            this.createAndAddBall(this.gameWidth / 2, this.gameHeight - PADDLE_Y_OFFSET - PADDLE_HEIGHT/2 - BALL_RADIUS);
        }
        console.log("Balls group and initial ball created.");
    }

     // createBoss メソッドに initiallyVisible 引数を追加
     createBoss(initiallyVisible = true) { // ★ 引数追加
        console.log(`Creating boss (Visible: ${initiallyVisible})...`);
        if (this.boss) { this.boss.destroy(); this.boss = null; }
        const bossStartX = this.gameWidth / 2;
        const bossStartY = this.gameHeight * 0.25; // ★ 定位置 Y
        this.boss = this.physics.add.image(bossStartX, bossStartY, 'bossStand')
             .setImmovable(true)
             .setVisible(initiallyVisible) // ★ 初期表示設定
             .setAlpha(initiallyVisible ? 1 : 0); // ★ 初期透明度設定

        this.boss.setData('health', BOSS_MAX_HEALTH);
        this.boss.setData('maxHealth', BOSS_MAX_HEALTH);
        this.boss.setData('isInvulnerable', false);
        this.updateBossSize();
        this.boss.setData('targetY', bossStartY); // ★ 定位置Yを保存しておく
        this.updateBossSize(); // これで正しいスケールも計算される
        this.boss.setData('targetScale', this.boss.scale); // ★ 定位置スケールも保存
        console.log(`Boss created. Initial Scale: ${this.boss.scale}, Target Scale: ${this.boss.getData('targetScale')}`);
    

        console.log(`Boss created with health: ${this.boss.getData('health')}`);

    }

     // ★ パワーアップグループ作成メソッド (新規追加)
     createPowerUpsGroup() {
        console.log("Creating power ups group...");
        if (this.powerUps) { this.powerUps.destroy(true); }
        this.powerUps = this.physics.add.group();
        console.log("Power ups group created.");
    }

    createAttackBricksGroup() {
     //   console.log("Creating attack bricks group...");
        if (this.attackBricks) { this.attackBricks.destroy(true); this.attackBricks = null; }
        this.attackBricks = this.physics.add.group();
     //   console.log("Attack bricks group created.");
    }

    createGameOverText() {
        if (this.gameOverText) { this.gameOverText.destroy(); this.gameOverText = null; }
        this.gameOverText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '全滅した...\nタイトルに戻る', { fontSize: '48px', fill: '#f00', align: 'center' })
            .setOrigin(0.5).setVisible(false).setDepth(1);
    }

    setupInputAndEvents() {
        console.log("Setting up input and scene events...");
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.off('pointerdown', this.handlePointerDown, this);
        this.input.on('pointermove', this.handlePointerMove, this);
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.scale.off('resize', this.handleResize, this);
        this.scale.on('resize', this.handleResize, this);
        this.events.off('shutdown', this.shutdownScene, this);
        this.events.on('shutdown', this.shutdownScene, this);
        console.log("Input and scene events set up.");
    }

    // --- ▲ Create ヘルパーメソッド ▲ ---

    // --- ▼ 演出用メソッド ▼ ---

    // 1. カットイン演出
    startIntroCutscene() {
        console.log("[Intro] Starting Cutscene...");
        const cutsceneDuration = 2000; // 3秒
// ▼▼▼ カットイン開始時フラッシュ ▼▼▼
this.cameras.main.flash(CUTSCENE_FLASH_DURATION, 255, 255, 255); // 白フラッシュ
// ▲▲▲ カットイン開始時フラッシュ ▲▲▲

        // 背景暗転用オブジェクト
        const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setDepth(900); // UIより手前、カットイン要素より奥

        // ▼▼▼ ボス立ち絵 (全身表示に変更) ▼▼▼
        const bossImage = this.add.image(this.gameWidth / 2, this.gameHeight / 2, 'bossStand') // 画面中央に配置
            .setOrigin(0.5, 0.5) // 中央基準に変更
            .setDepth(901);

        // サイズ調整 (画面幅の70%くらいに？ 要調整)
        const targetImageWidth = this.gameWidth * 0.7;
        bossImage.displayWidth = targetImageWidth;
        bossImage.scaleY = bossImage.scaleX; // アスペクト比維持
        // 下半分を切り取る (画像の高さの半分でクロップ)
        //bossImage.setCrop(0, 0, bossImage.width, bossImage.height / 2);

        /// ▼▼▼ テキスト表示の確認・修正 ▼▼▼
        const textContent = 'VS アートマンHL';
        const textStyle = {
            fontSize: '36px',
            fill: '#ffffff', // ★ 色を白(#ffffff)に明示的に指定
            stroke: '#000000', // ★ 縁取りを黒(#000000)に明示的に指定
            strokeThickness: 4,
            fontFamily: 'MyGameFont, sans-serif', // フォント指定確認
            align: 'center' // 中央揃え指定（念のため）
            
        };
        console.log(`[Intro] Creating VS Text with style:`, textStyle, `Content: ${textContent}`); // ★ ログ追加

        // Y座標をボス画像の上部か下部、または固定位置に調整
        // 例1: ボス画像の上
        // const textY = bossImage.getBounds().top - 10; // ボックスの上端から少し上
        // 例2: ボス画像の下
        const textY = bossImage.getBounds().bottom + 10; // ボックスの下端から少し下
        // 例3: 画面下部の固定位置
        // const textY = this.gameHeight * 0.85;


        // ★★★ テキストオブジェクトを this.vsText として保持 ★★★
        this.vsText = this.add.text(this.gameWidth / 2, textY, textContent, textStyle)
            .setOrigin(0.5, (textY === bossImage.getBounds().top - 10) ? 1 : 0) // 上に置くなら下基準(1)、下に置くなら上基準(0)
            .setDepth(902);
        // ▲▲▲ テキスト表示 (位置調整) ▲▲▲

        // ★★★ 生成直後の状態をログ出力 ★★★
        if (this.vsText) {
             console.log(`[Intro] VS Text created: Visible=${this.vsText.visible}, Alpha=${this.vsText.alpha}, Depth=${this.vsText.depth}, Text='${this.vsText.text}'`);
             console.log(`  - Position: (${this.vsText.x.toFixed(0)}, ${this.vsText.y.toFixed(0)})`);
             console.log(`  - Display Size: (${this.vsText.displayWidth.toFixed(0)}, ${this.vsText.displayHeight.toFixed(0)})`);
        } else {
             console.error("!!! Failed to create VS Text object !!!");
        }
        // ▲▲▲ テキスト表示の確認・修正 ▲▲▲

        // SE再生 (シャキーン)
        try {
             this.sound.play('se_cutscene_start'); // ★ SEキーを指定
            console.log("[Intro] Cutscene Start SE (Shakin!) should play here.");
        } catch (e) { console.error("Error playing cutscene SE:", e); }

        // 時間経過でカットイン終了 → フラッシュ＆ズーム演出へ
        this.time.delayedCall(cutsceneDuration, () => {
            console.log("[Intro] Cutscene End. Starting Flash & Zoom.");
            // カットイン要素を破棄
            overlay.destroy();
            bossImage.destroy();
            // ▼▼▼ this.vsText を参照して破棄 ▼▼▼
            if (this.vsText) { // this.vsText が存在するか確認
                this.vsText.destroy();
                this.vsText = null; // 参照もクリア
            }
            // ▲▲▲ this.vsText を参照して破棄 ▲▲▲
            // 次の演出を開始
            // 次の演出を開始
            this.startFlashAndZoomIntro();
        }, [], this);
    }

    // 2. フラッシュ＆ズームイン演出
    startFlashAndZoomIntro() {
        // フラッシュ設定
        const flashDuration = 200; // 0.2秒
        // SE再生 (衝撃音)
        try {
             this.sound.play('se_impact_flash'); // ★ SEキーを指定
            console.log("[Intro] Impact Flash SE should play here.");
        } catch (e) { console.error("Error playing flash SE:", e); }
        // カメラフラッシュ
        this.cameras.main.flash(INTRO_FLASH_DURATION, 255, 255, 255);
        // フラッシュ後にズームイン開始
        this.time.delayedCall(flashDuration, () => {
            this.startBossZoomIn();
        }, [], this);
    }

    // 3. ボスズームイン (奥からドアップまで)
    startBossZoomIn() {
        console.log("[Intro] Starting Boss Zoom In...");
        if (!this.boss) { console.error("Boss object missing for zoom in!"); return; }

        const zoomInDuration = 1300; // 1.3秒
        const zoomInStartY = this.gameHeight * 0.8; // 開始Y座標 (画面下の方)
        const zoomInStartScale = 0.1; // 開始スケール
        const zoomInEndScale = 5; // ドアップ時のスケール (画面サイズに合わせて要調整)
        const zoomInEndY = this.gameHeight / 2; // ドアップ時のY座標 (画面中央)

        // ボスを初期状態に設定
        this.boss.setPosition(this.gameWidth / 2, zoomInStartY);
        this.boss.setScale(zoomInStartScale);
        this.boss.setAlpha(0); // 最初は見えない

        // ▼▼▼ 物理ボディのサイズを一時的に最小化 ▼▼▼
        if (this.boss.body) {
            console.log("[Intro] Temporarily shrinking boss physics body for zoom.");
            this.boss.body.setSize(1, 1); // 非常に小さいサイズに設定
            this.boss.body.setOffset(this.boss.displayWidth/2 - 0.5, this.boss.displayHeight/2 - 0.5); // オフセットも中央に
        }
        // ▲▲▲ 物理ボディのサイズを一時的に最小化 ▲▲▲

        this.boss.setVisible(true); // 表示はする

        // ▼▼▼ ボス戦BGM再生開始 ▼▼▼
    this.playBossBgm();
    // ▲▲▲ ボス戦BGM再生開始 ▲▲▲


        // Tweenでズームイン
        this.tweens.add({
            targets: this.boss,
            y: zoomInEndY,
            scale: zoomInEndScale,
            alpha: 1,
            duration: zoomInDuration,
            ease: 'Quad.easeIn', // 加速する感じ
            onComplete: () => {
                console.log("[Intro] Zoom In Complete. Starting quick shrink.");
                // ズームイン完了後、短い待機を経て縮小演出へ
                this.time.delayedCall(200, this.startBossQuickShrink, [], this); // 0.2秒待つ
            }
        });
        

    }

    // 4. ドアップから定位置へ瞬間縮小
    startBossQuickShrink() {
        console.log("[Intro] Starting Boss Quick Shrink...");
        if (!this.boss || !this.boss.active) { console.error("Boss object missing or inactive for shrink!"); return; }

        const shrinkDuration = SHRINK_DURATION; // 0.05秒 (一瞬)
        const targetX = this.gameWidth / 2;
        const targetY = this.boss.getData('targetY');
        const targetScale = this.boss.getData('targetScale');

        // 効果音再生 (縮小音)
        try {
             this.sound.play('se_shrink'); // ★ SEキーを指定
            console.log("[Intro] Quick Shrink SE should play here.");
        } catch (e) { console.error("Error playing shrink SE:", e); }

                // Tweenで瞬間的に移動＆縮小
                this.tweens.add({
                    targets: this.boss,
                    x: targetX,
                    y: targetY,
                    scale: targetScale,
                    duration: shrinkDuration,
                    ease: 'Expo.easeOut',
                    // onCompleteScope: this, // アロー関数を使うので不要
                    // ▼▼▼ onComplete をアロー関数に変更 ▼▼▼
                    onComplete: () => { // ★ function() から () => に変更
                        // ★ アロー関数内なら this は BossScene を指す ★
                        console.log("[Intro] Quick Shrink Complete.");
        
                        // ▼▼▼ 縮小完了時フラッシュ (this が使える) ▼▼▼
                        console.log("[Intro] Initiating shrink completion flash.");
                        try { // 念のため try...catch
                             this.cameras.main.flash(SHRINK_FLASH_DURATION, 255, 255, 255); // this.cameras が使える
                        } catch(e) { console.error("Error during shrink completion flash:", e);}
                        // ▲▲▲ 縮小完了時フラッシュ ▲▲▲
        
                        // ▼▼▼ 戦闘開始SE再生 (this が使える) ▼▼▼
                        try {
                            // this.sound.play('SE_FIGHT_START');
                            console.log("[Intro] Fight Start SE should play here.");
                        } catch (e) { console.error("Error playing fight start SE:", e); }
                        // ▲▲▲ 戦闘開始SE再生 ▲▲▲
        
                        // ▼▼▼ ボディサイズ復元 (this が使える) ▼▼▼
                        console.log(">>> Checking this.boss before restoring body size:", this.boss);
                        if (this.boss && this.boss.active) {
                            console.log("[Intro] Restoring boss physics body size via updateBossSize.");
                            this.updateBossSize(); // this.updateBossSize が使える
                        } else {
                            console.error("!!! Cannot restore body size because this.boss is invalid !!!");
                        }
                        // ▲▲▲ ボディサイズ復元 ▲▲▲
        
                        // ▼▼▼ ボイス再生とゲーム開始 (this が使える) ▼▼▼
                        console.log(`[Intro] Scheduling boss intro voice in ${VOICE_START_DELAY}ms`);
                        this.time.delayedCall(VOICE_START_DELAY, () => { /* ... this.sound.play ... */ }, [], this); // delayedCall の this もOK
                        console.log(`[Intro] Scheduling gameplay start in ${GAMEPLAY_START_DELAY}ms`);
                        this.time.delayedCall(GAMEPLAY_START_DELAY, this.startGameplay, [], this); // this.startGameplay が使える
                        // ▲▲▲ ボイス再生とゲーム開始 ▲▲▲
                    } // onComplete (アロー関数) の終わり
                    // ▲▲▲ onComplete をアロー関数に変更 ▲▲▲
                }); // tween の終わり
    }

    // 5. ゲームプレイ開始処理
    startGameplay() {
        console.log("[Intro] Enabling player control. Boss fight start!");
        this.playerControlEnabled = true;
         // ▼▼▼ 物理ボディが有効か最終確認 (デバッグ用) ▼▼▼
         if (this.boss?.body?.enable) {
            console.log("[Gameplay Start] Boss physics body is enabled.");
        } else {
            console.warn("[Gameplay Start] Boss physics body is NOT enabled!");
        }
        // ▲▲▲ 物理ボディが有効か最終確認 ▲▲▲
        // ...
        // 必要ならボス移動や攻撃ブロック生成タイマーをここで開始しても良い

         // ▼▼▼ ここでボス移動と攻撃ブロック生成を開始 ▼▼▼
    this.startBossMovement(); // ボスの動きを開始
    this.scheduleNextAttackBrick(); // 最初の攻撃ブロック生成を予約
    // ▲▲▲ ここでボス移動と攻撃ブロック生成を開始 ▲▲▲
        this.startBossMovement(); // ボスの動きを開始
        // this.scheduleNextAttackBrick(); // 攻撃ブロック生成タイマーはcreateで既に開始しているはず
        // ★ TODO: 戦闘中ランダムボイスタイマーを開始 ★
        // ▼▼▼ 戦闘中ランダムボイスタイマー開始 ▼▼▼
        this.startRandomVoiceTimer();
        // ▲▲▲ 戦闘中ランダムボイスタイマー開始 ▲▲▲
    }

    // --- ▲ 演出用メソッド ▲ ---

// --- ▼ 見た目更新ヘルパー (優先順位考慮) ▼ ---
// --- ▼ updateBallAppearance (ログ追加・優先順位確認) ▼ ---
updateBallAppearance(ball) {
    console.log(`>>> Entering updateBallAppearance. Ball texture: ${ball?.texture?.key}`);

    if (!ball || !ball.active || !ball.getData) {
        console.log("<<< Exiting updateBallAppearance early: Ball invalid or inactive.");
        return;
    }

    let textureKey = 'ball_image'; // デフォルト
    const currentTexture = ball.texture.key;
    const lastPower = ball.getData('lastActivatedPower'); // 最後に有効になったパワーアップタイプを取得

    console.log(`[updateBallAppearance] Checking ball ${ball.name || currentTexture}. Last Activated Power: ${lastPower}`);

    // ▼▼▼ 条件分岐を lastPower 最優先に変更 ▼▼▼
    if (lastPower && POWERUP_ICON_KEYS[lastPower]) {
        // 最後に有効になったパワーアップに対応するアイコンキーがあれば、それを使用
        textureKey = POWERUP_ICON_KEYS[lastPower];
        console.log(`  Priority: Last power (${lastPower}). Target texture: ${textureKey}`);
    } else {
        // lastPower が null か、対応するアイコンキーがなければデフォルト
        textureKey = 'ball_image';
        console.log(`  Priority: Default or no icon for last power. Target texture: ${textureKey}`);
    }
    // ▲▲▲ 条件分岐を lastPower 最優先に変更 ▲▲▲


    // テクスチャが実際に変更されるかチェック
    if (currentTexture !== textureKey) {
        try {
            ball.setTexture(textureKey);
            console.log(`  ===> Texture CHANGED from ${currentTexture} to: ${textureKey}`);
        } catch (e) {
            console.error(`  !!! Error setting texture to ${textureKey}:`, e);
        }
    } else {
        // console.log(`  Texture already ${textureKey}. No change needed.`);
    }
    ball.clearTint(); // Tint は常にクリア

    console.log(`<<< updateBallAppearance finished (lastPower priority).`); // 出口ログ変更
}
 // --- ▲ updateBallAppearance ▲ ---

 // --- ▼ 戦闘中・ダメージ・撃破関連メソッド ▼ ---

    // 戦闘中ランダムボイスタイマー開始 (新規追加)
    startRandomVoiceTimer() {
        if (this.randomVoiceTimer) this.randomVoiceTimer.remove(); // 既存があれば削除
        if (this.bossVoiceKeys.length === 0) {
            console.warn("[Random Voice] No boss voice keys defined.");
            return;
        }
        console.log("[Random Voice] Starting timer...");

        const playRandomVoice = () => {
            if (this.bossDefeated || this.isGameOver || !this.boss?.active) { // ボス戦闘中か確認
                if(this.randomVoiceTimer) this.randomVoiceTimer.remove(); // 戦闘終了ならタイマー停止
                return;
            }
            const randomKey = Phaser.Utils.Array.GetRandom(this.bossVoiceKeys);
            try {
                console.log(`[Random Voice] Playing: ${randomKey}`);
                this.sound.play(randomKey);
            } catch (e) { console.error(`Error playing random voice ${randomKey}:`, e); }

            // 次のタイマーを再設定
            const nextDelay = Phaser.Math.Between(BOSS_RANDOM_VOICE_MIN_DELAY, BOSS_RANDOM_VOICE_MAX_DELAY);
            this.randomVoiceTimer = this.time.delayedCall(nextDelay, playRandomVoice, [], this);
            console.log(`[Random Voice] Next voice scheduled in ${nextDelay}ms`);
        };

        // 最初の呼び出しを予約
        const firstDelay = Phaser.Math.Between(BOSS_RANDOM_VOICE_MIN_DELAY, BOSS_RANDOM_VOICE_MAX_DELAY);
        this.randomVoiceTimer = this.time.delayedCall(firstDelay, playRandomVoice, [], this);
        console.log(`[Random Voice] First voice scheduled in ${firstDelay}ms`);
    }



// ★★★ このメソッド定義を追加 ★★★
scheduleNextAttackBrick() {
    if (this.attackBrickTimer) { // 既存タイマーがあればクリア
        this.attackBrickTimer.remove();
    }
    // 次回実行までの遅延時間をランダムに決定
    const nextDelay = Phaser.Math.Between(ATTACK_BRICK_SPAWN_DELAY_MIN, ATTACK_BRICK_SPAWN_DELAY_MAX);
 //   console.log(`Scheduling next attack brick in ${nextDelay}ms`);
    // タイマーを設定
    this.attackBrickTimer = this.time.addEvent({
        delay: nextDelay,
        callback: this.spawnAttackBrick, // spawnAttackBrick を呼び出す
        callbackScope: this,
        loop: false // 1回実行したら、spawnAttackBrick内で再度スケジュールする
    });
}
// ★★★ このメソッド定義を追加 ★★★

    // --- ▼ Update ヘルパーメソッド ▼ ---

   

    updateAttackBricks() {
        if (!this.attackBricks || !this.attackBricks.active) return;
        this.attackBricks.children.each(brick => {
            if (brick.active && brick.y > this.gameHeight + brick.displayHeight) {
             //   console.log("Attack brick went out of bounds.");
                brick.destroy();
            }
        });
    }

    // updateOrbiters(time, delta) メソッド削除

    // --- ▲ Update ヘルパーメソッド ▲ ---

    // --- ▼ 攻撃ブロック生成関連メソッド (新規・修正) ▼ ---

    // 次の攻撃ブロック生成を予約するメソッド
    scheduleNextAttackBrick() {
        // 既存のタイマーがあれば削除
        if (this.attackBrickTimer) {
            this.attackBrickTimer.remove();
        }
        // ランダムな遅延時間を計算
        const nextDelay = Phaser.Math.Between(ATTACK_BRICK_SPAWN_DELAY_MIN, ATTACK_BRICK_SPAWN_DELAY_MAX);
        //console.log(`Scheduling next attack brick in ${nextDelay}ms`);

        this.attackBrickTimer = this.time.addEvent({
            delay: nextDelay,
            callback: this.spawnAttackBrick, // 生成関数を呼び出す
            callbackScope: this,
            loop: false // ループはせず、コールバック内で再度スケジュールする
        });
    }

    spawnAttackBrick() {
        // ... (生成位置決定ロジック spawnX, spawnY) ...
        //console.log("Spawning attack brick...");
        let spawnX; // ★★★ この行を追加 ★★★
        const spawnY = -30;

        // --- 生成位置を決定 ---
        if (Phaser.Math.FloatBetween(0, 1) < ATTACK_BRICK_SPAWN_FROM_TOP_CHANCE) {
            spawnX = Phaser.Math.Between(30, this.gameWidth - 30);
          //  console.log("Spawning from top random position.");
        } else {
            if (this.boss && this.boss.active) {
                spawnX = this.boss.x;
               // console.log("Spawning from boss position.");
            } else {
               // console.log("Boss not available, spawning at center top.");
                spawnX = this.gameWidth / 2;
            }
        }
        // --- 生成位置決定終わり ---

        // --- ▼ attackBrick テクスチャを使うように修正 ▼ ---
        // ★ テクスチャキーを 'attackBrick' に固定 (読み込み前提)
        //    もし読み込めなかった場合のフォールバックは create でチェックする方が良いかも
        const brickTexture = 'attackBrick';
       // console.log(`[Spawn Debug] Using texture: ${brickTexture}`);

        const attackBrick = this.attackBricks.create(spawnX, spawnY, brickTexture);

        if (attackBrick) {
            // --- ▼ 見た目の調整 ▼ ---
            const desiredScale = 0.2; // ★ 画像に合わせた適切なスケールに調整
            attackBrick.setScale(desiredScale);

            // ★ Tint設定は attackBrick 画像を使うので不要 → 削除
            // if (brickTexture === 'whitePixel') {
            //     attackBrick.setTint(0xcc99ff);
            // } else {
            //     attackBrick.clearTint();
            // }
            attackBrick.clearTint(); // 念のためクリア

            // // --- ▼ 当たり判定を表示サイズより大きくする ▼ ---
            try {
                if (attackBrick.body) {
                    // ★ 当たり判定の倍率を設定 ★
                    const hitboxScaleMultiplier = 3.8; // 例: 見た目の1.8倍の当たり判定サイズにする

                    const hitboxWidth = attackBrick.displayWidth * hitboxScaleMultiplier;
                    const hitboxHeight = attackBrick.displayHeight * hitboxScaleMultiplier;

                    attackBrick.body.setSize(hitboxWidth, hitboxHeight);

                    // ★ setSize で中央基準に拡大されるため、オフセットは通常不要 ★
                    // もしズレる場合は調整:
                    // const offsetX = (attackBrick.displayWidth - hitboxWidth) / 2;
                    // const offsetY = (attackBrick.displayHeight - hitboxHeight) / 2;
                    // attackBrick.body.setOffset(offsetX, offsetY);

                  //  console.log(`Attack brick body size set to: ${hitboxWidth.toFixed(0)}x${hitboxHeight.toFixed(0)} (Multiplier: ${hitboxScaleMultiplier})`);
                } else { console.warn("Attack brick body not ready for size setting."); }
            } catch (e) { console.error("Error setting attack brick body size:", e); }
            // --- ▲ 当たり判定を表示サイズより大きくする ▲ ---


            // 落下速度など
            attackBrick.setVelocityY(ATTACK_BRICK_VELOCITY_Y);
            attackBrick.body.setAllowGravity(false);
            attackBrick.body.setCollideWorldBounds(false);

          //  console.log(`Attack brick spawned at (${spawnX.toFixed(0)}, ${spawnY})`);
            this.scheduleNextAttackBrick();

    

        } else {
         //   console.error("Failed to create attack brick object!");
             // エラー発生時も次の生成を試みる (無限ループ防止のため遅延を入れる)
             this.time.delayedCall(ATTACK_BRICK_SPAWN_DELAY_MAX, this.scheduleNextAttackBrick, [], this);
        }
    }


    // --- ▼ アイテムドロップメソッド (GameSceneから移植・ボス戦用に調整) ▼ ---
    dropSpecificPowerUp(x, y, type) {
        if (!type) { console.warn("Attempted to drop powerup with no type."); return; }
        if (!this.powerUps) { console.error("PowerUps group does not exist!"); return; }

        let textureKey = POWERUP_ICON_KEYS[type] || 'whitePixel';
        let displaySize = POWERUP_SIZE;
        let tintColor = null;
        if (textureKey === 'whitePixel') { tintColor = (type === POWERUP_TYPES.BAISRAVA) ? 0xffd700 : 0xcccccc; }

        console.log(`[BossScene] Dropping power up ${type} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
        try {
            const powerUp = this.powerUps.create(x, y, textureKey);
            if (powerUp) {
                powerUp.setDisplaySize(displaySize, displaySize).setData('type', type);
                if (tintColor !== null) { powerUp.setTint(tintColor); }
                else { powerUp.clearTint(); }
                if (powerUp.body) {
                    powerUp.setVelocity(0, POWERUP_SPEED_Y);
                     // ★★★ ボディの状態をログ出力 ★★★
                console.log(`[Drop PowerUp] ${type} - Body enabled: ${powerUp.body.enable}, Allow gravity: ${powerUp.body.allowGravity}, CollideWorldBounds: ${powerUp.body.collideWorldBounds}`);
                    powerUp.body.setCollideWorldBounds(false);
                    powerUp.body.setAllowGravity(false);
                } else { powerUp.destroy(); console.error("No body for powerup!"); }
            } else { console.error("Failed to create powerup object!"); }
        } catch (e) { console.error("CRITICAL Error in dropSpecificPowerUp:", e); }
    }
    // --- ▲ アイテムドロップメソッド ▲ ---

     // --- ▼ アイテム取得メソッド (ボス戦効果実装開始) ▼ ---
     // BossScene.js

collectPowerUp(paddle, powerUp) {
    console.log("--- collectPowerUp ---");
    if (!(this instanceof BossScene)) { console.error("!!! 'this' is NOT BossScene in collectPowerUp !!!"); return; }
    if (!powerUp || !powerUp.active || this.isGameOver || this.bossDefeated) return;
    const type = powerUp.getData('type');
    if (!type) { powerUp.destroy(); return; }

    console.log(`[BossScene] Collected power up: ${type}`);
    powerUp.destroy();

     // ▼▼▼ 分裂系取得時の既存効果解除 ▼▼▼
     if (type === POWERUP_TYPES.SINDARA || type === POWERUP_TYPES.ANCHIRA) {
        console.log(`[Split Power Check] New split power: ${type}. Deactivating existing splits.`);
        this.deactivateSindara(); // 既存のシンダラを解除
         this.deactivateAnchira(); // アンチラ実装後に追加
   }
   // ▲▲▲ 分裂系取得時の既存効果解除 ▲▲▲

    // --- ボイス再生 (共通処理) ---
    const voiceKeyBase = `voice_${type}`; const upperCaseKey = voiceKeyBase.toUpperCase();
    // 特殊なキー名を持つボイスの処理
    let actualAudioKey = AUDIO_KEYS[upperCaseKey];
    if (type === POWERUP_TYPES.VAJRA) actualAudioKey = AUDIO_KEYS.VOICE_VAJRA_GET; // ヴァジラ取得時用
    
    // ビカラは陰陽でボイスが分かれる可能性があるが、取得時は共通か？ 일단 Bikara Yin 으로?
     if (type === POWERUP_TYPES.BIKARA) actualAudioKey = AUDIO_KEYS.VOICE_BIKARA_YIN;
    // シンダラ合体ボイスは別途

    const now = this.time.now; const lastPlayed = this.lastPlayedVoiceTime[upperCaseKey] || 0;
    if (actualAudioKey && (now - lastPlayed > this.voiceThrottleTime)) {
        try {
            console.log(`Playing voice: ${actualAudioKey}`); // ★再生するキー名をログ出力
            this.sound.play(actualAudioKey);
            this.lastPlayedVoiceTime[upperCaseKey] = now;
        }
        catch (e) { console.error(`Error playing voice ${actualAudioKey}:`, e); }
    } else if (!actualAudioKey) { console.warn(`Voice key ${upperCaseKey} / ${actualAudioKey} not found or invalid for type ${type}.`);} // ★見つからない場合もログ
    else { console.log(`Voice ${upperCaseKey} throttled.`); }
    // --- ボイス再生 終了 ---


    // --- ボス戦でのパワーアップ効果 ---
    switch (type) {
        case POWERUP_TYPES.KUBIRA:
            console.log("Activating Kubira (Boss Fight - Damage +1 for 10s)");
            this.activateTemporaryEffect(
                type, POWERUP_DURATION[type] || 10000,
                () => this.setBallPowerUpState(type, true),
                () => this.setBallPowerUpState(type, false)
            );
            break;
        case POWERUP_TYPES.SHATORA:
            console.log("Activating Shatora (Boss Fight - Speed Up for 3s)");
            this.activateTemporaryEffect(
                type, POWERUP_DURATION[type] || 3000,
                () => { this.balls.getChildren().forEach(ball => { if (ball.active) this.applySpeedModifier(ball, type); }); },
                () => { this.balls.getChildren().forEach(ball => { if (ball.active) this.resetBallSpeed(ball); }); }
            );
             this.setBallPowerUpState(type, true); // アイコン表示のため状態設定も必要
            break;
        case POWERUP_TYPES.HAILA:
            console.log("Activating Haila (Boss Fight - Speed Down for 10s)");
             this.activateTemporaryEffect(
                 type, POWERUP_DURATION[type] || 10000,
                 () => { this.balls.getChildren().forEach(ball => { if (ball.active) this.applySpeedModifier(ball, type); }); },
                 () => { this.balls.getChildren().forEach(ball => { if (ball.active) this.resetBallSpeed(ball); }); }
             );
             this.setBallPowerUpState(type, true); // アイコン表示のため状態設定も必要
            break;
        case POWERUP_TYPES.BAISRAVA:
            console.log("Activating Baisrava (Boss Fight - 50 Damage)");
            if (this.boss && this.boss.active && !this.boss.getData('isInvulnerable')) {
                 this.applyBossDamage(this.boss, 50, "Baisrava");
            } else { console.log("Baisrava hit, but boss is inactive or invulnerable."); }
             // バイシュラヴァはアイコン表示不要（即時効果のため）
            break;
        case POWERUP_TYPES.MAKIRA:
            console.log("Activating Makira (Boss Fight - Paddle Beam for 6.7s).");
            this.activateMakira(); // activateMakira 内で状態設定とタイマー管理
            break;

        // --- ▼▼▼ 未実装パワーアップのアイコン＆ボイス対応 ▼▼▼ ---
        case POWERUP_TYPES.SINDARA:
                console.log("Power up Sindara collected - Activating Persistent Split.");
                this.activateSindara(); // ★ シンダラ有効化
                break;
                case POWERUP_TYPES.ANCHIRA:
                    console.log("Power up Anchira collected - Activating 4-Split.");
                    this.activateAnchira(); // ★ アンチラ有効化
                    break;
            case POWERUP_TYPES.BIKARA:
                console.log("Power up Bikara collected - Activating Penetration."); // メッセージ変更
                this.activateBikara(); // ★ ビカラ有効化
                break;
            case POWERUP_TYPES.INDARA:
                console.log("Power up Indara collected - Activating Homing & Pierce.");
                this.activateIndara(); // ★ インダラ有効化
                break;
            case POWERUP_TYPES.ANILA:
                console.log("Power up Anila collected - Activating Invincible Paddle & Bounce.");
                this.activateAnila(); // ★ アニラ有効化関数呼び出し
                break;
                case POWERUP_TYPES.MAKORA:
                    console.log("Power up Makora collected - Activating Random Copy.");
                    this.activateMakora(); // ★ マコラ有効化
                    break;
            case POWERUP_TYPES.VAJRA:
                console.log("Power up Vajra collected - Activating Gauge System.");
                this.activateVajra(); // ★ activateVajra を呼び出す
                // activateVajra内で状態設定するのでここでは不要
               break;
        // --- ▲▲▲ 未実装パワーアップのアイコン＆ボイス対応 ▲▲▲ ---

        default:
            console.log(`Power up ${type} collected, no specific handler defined yet.`);
            // デフォルトでもアイコン表示を試みる（もし対応キーがあれば）
            this.setBallPowerUpState(type, true);
            break;
    }
    // ★★★ 見た目更新呼び出しを追加 ★★★
    // （setBallPowerUpState内で呼ばれるが、念のためここでも呼ぶと確実かも）
    this.updateBallAndPaddleAppearance();
}


    // --- ▼ パワーアップ効果管理ヘルパー ▼ ---

    // 一定時間だけ効果を有効にする汎用関数
    activateTemporaryEffect(type, duration, onStartCallback = null, onEndCallback = null) {
        console.log(`--- activateTemporaryEffect for ${type} ---`);
        console.log("Context 'this' in activateTemporaryEffect:", this); // ★ this の内容確認
        if (!(this instanceof BossScene)) { console.error("!!! 'this' is NOT BossScene in activateTemporaryEffect !!!"); return; } // ★ 型チェック
        // 既存タイマー解除
        if (this.powerUpTimers[type]) {
            this.powerUpTimers[type].remove();
        }
        // 開始時処理実行
        if (onStartCallback) {
            try { onStartCallback(); } catch (e) { console.error(`Error onStart for ${type}:`, e); }
        }
        // ボールに状態を設定 (例)
        this.setBallPowerUpState(type, true);

        // 終了タイマー設定
        this.powerUpTimers[type] = this.time.delayedCall(duration, () => {
            console.log(`Deactivating temporary effect: ${type}`);
            // 終了時処理実行
            if (onEndCallback) {
                try { onEndCallback(); } catch (e) { console.error(`Error onEnd for ${type}:`, e); }
            }
            // ボールの状態を解除
            this.setBallPowerUpState(type, false);
            this.powerUpTimers[type] = null; // タイマー参照クリア
            this.updateBallAndPaddleAppearance(); // 見た目更新
        }, [], this);

        this.updateBallAndPaddleAppearance(); // 開始時の見た目更新
    }

 // --- ▼ updateBallAndPaddleAppearance (ループ確認ログ追加) ▼ ---
updateBallAndPaddleAppearance() {
    console.log("--- updateBallAndPaddleAppearance called ---");
    console.log("Context 'this' inside updateBallAndPaddleAppearance:", this); // ★ this の内容確認
    if (this.balls && this.balls.active) {
        const children = this.balls.getChildren(); // 先に子を取得
        console.log(`  Checking ${children.length} balls in group.`); // ★ ボールの数をログ出力
        children.forEach((ball, index) => {
            console.log(`  Looping ball index ${index}. Ball active: ${ball?.active}`); // ★ ループ実行ログ
            if (ball && ball.active) { // ボールが存在しアクティブか確認
                try {
                    console.log(`    Calling updateBallAppearance for ball index ${index}...`); // ★ 関数呼び出し直前ログ
                    this.updateBallAppearance(ball);
                }
                catch (e) { console.error(`Error during individual ball appearance update (index ${index}):`, e); }
            } else {
                console.log(`    Skipping inactive/null ball index ${index}.`); // ★ スキップログ
            }
        });
    } else {
        console.log("  Balls group not active or does not exist."); // ★ グループがない場合のログ
    }
    console.log("--- updateBallAndPaddleAppearance finished ---");
    // ▼▼▼ パドルの見た目更新を追加 ▼▼▼
    if (this.paddle && this.paddle.active) {
        if (this.isAnilaActive) { // アニラが有効なら
            this.paddle.setTint(PADDLE_ANILA_TINT);
            this.paddle.setAlpha(PADDLE_ANILA_ALPHA);
        } else { // アニラが無効なら通常状態に
            this.paddle.setTint(PADDLE_NORMAL_TINT);
            this.paddle.setAlpha(1.0);
        }
   }
   // ▲▲▲ パドルの見た目更新を追加 ▲▲▲
}
// --- ▲ updateBallAndPaddleAppearance ▲ ---

 // collectPowerUp メソッド (シンダラのcase追加、他分裂系取得時の解除処理)
/* collectPowerUp(paddle, powerUp) {
    // ... (ボイス再生など) ...
    const type = powerUp.getData('type'); // type をここで取得

    // ▼▼▼ 分裂系取得時の既存効果解除 ▼▼▼
    if (type === POWERUP_TYPES.SINDARA || type === POWERUP_TYPES.ANCHIRA) {
         console.log(`[Split Power Check] New split power: ${type}. Deactivating existing splits.`);
         this.deactivateSindara(); // 既存のシンダラを解除
         // this.deactivateAnchira(); // アンチラ実装後に追加
    }
    // ▲▲▲ 分裂系取得時の既存効果解除 ▲▲▲

    switch (type) {
        // ... (他のcase) ...
        case POWERUP_TYPES.SINDARA:
            console.log("Power up Sindara collected - Activating Persistent Split.");
            this.activateSindara(); // ★ シンダラ有効化
            break;
        // ... (他のcase) ...
    }*/
    // this.updateBallAndPaddleAppearance();


// keepFurthestBall メソッド (GameSceneから移植 or 新規作成)
keepFurthestBall() {
    console.log("[Split Prep] Keeping furthest ball.");
    const activeBalls = this.balls?.getMatching('active', true);
    if (!activeBalls || activeBalls.length <= 1) {
        console.log("  - Less than 2 active balls, no need to remove.");
        return activeBalls ? activeBalls[0] : null; // 存在するボールを返すか null
    }

    let furthestBall = null;
    let maxDistSq = -1;
    const paddlePos = new Phaser.Math.Vector2(this.paddle.x, this.paddle.y);

    activeBalls.forEach(ball => {
        const distSq = Phaser.Math.Distance.Squared(paddlePos.x, paddlePos.y, ball.x, ball.y);
        if (distSq > maxDistSq) {
            maxDistSq = distSq;
            furthestBall = ball;
        }
    });

    if (!furthestBall) { // 念のためチェック
        console.warn("  - Could not determine furthest ball!");
        return activeBalls[0]; // とりあえず最初のボールを返す
    }

    let removedCount = 0;
    activeBalls.forEach(ball => {
        if (ball !== furthestBall) {
            console.log(`  - Removing ball closer to paddle: ${ball.name || ball.texture.key}`);
            // ★ TODO: 消えるボールのエフェクト ★
            ball.destroy(); // グループからも削除
            removedCount++;
        }
    });
    console.log(`[Split Prep] Kept ball: ${furthestBall.name || furthestBall.texture.key}. Removed ${removedCount} balls.`);
    return furthestBall; // 残したボールを返す
}




    // マコラ有効化メソッド (新規追加)
    // BossScene.js クラス内に新しいメソッドとして追加

activateMakora() {
    console.log("[Makora] Activating!");
    const targetBalls = this.balls?.getMatching('active', true);
    if (!targetBalls || targetBalls.length === 0) { console.warn("No active balls for Makora."); return; }

    // 1. 一時的に全ボールをマコラ状態にしてアイコン表示
    //    setBallPowerUpState(type, isActive, specificBall = null) を利用
    //    第3引数を指定しない -> 全ボール対象
    this.setBallPowerUpState(POWERUP_TYPES.MAKORA, true); // 全ボールにマコラ状態セット
    this.updateBallAndPaddleAppearance(); // マコラアイコン表示

    // 2. コピー対象をランダムに選択
    if (!MAKORA_COPYABLE_POWERS || MAKORA_COPYABLE_POWERS.length === 0) {
        console.error("[Makora] MAKORA_COPYABLE_POWERS list is empty or not defined!");
        this.setBallPowerUpState(POWERUP_TYPES.MAKORA, false); // エラー時はマコラ解除
        this.updateBallAndPaddleAppearance();
        return;
    }
    const copiedType = Phaser.Utils.Array.GetRandom(MAKORA_COPYABLE_POWERS);
    console.log(`[Makora] Randomly selected power to copy: ${copiedType}`);

    // 3. 短いディレイ後にコピーを実行
    const MAKORA_COPY_DELAY = 150; // ディレイ時間
    this.time.delayedCall(MAKORA_COPY_DELAY, () => {
        console.log(`[Makora] Executing copy of ${copiedType}`);

        // 3a. まず全ボールからマコラ状態を解除
        this.setBallPowerUpState(POWERUP_TYPES.MAKORA, false); // 全ボールからマコラ解除

        // 3b. コピー先の activate 関数を呼び出す
        switch (copiedType) {
            // ★★★ 既存の activate 関数を呼び出す ★★★
            case POWERUP_TYPES.KUBIRA:   this.activateKubira();   break; // activateKubira が必要
            case POWERUP_TYPES.SHATORA:  this.activateShatora();  break; // activateShatora が必要
            case POWERUP_TYPES.HAILA:    this.activateHaira();    break; // activateHaira が必要
            case POWERUP_TYPES.ANCHIRA:  this.activateAnchira();  break;
            case POWERUP_TYPES.SINDARA:  this.activateSindara();  break;
            case POWERUP_TYPES.BIKARA:   this.activateBikara();   break;
            case POWERUP_TYPES.INDARA:   this.activateIndara();   break;
            case POWERUP_TYPES.ANILA:    this.activateAnila();    break;
            case POWERUP_TYPES.VAJRA:    this.activateVajra();    break;
            case POWERUP_TYPES.MAKIRA:   this.activateMakira();   break;
            default: console.warn(`[Makora] No activate function defined for copied type: ${copiedType}`);
        }
        // ★★★ コピー先の activate 関数が存在しない場合は追加が必要 ★★★

        // 3c. 見た目を最終的に更新 (コピー先で更新されることが多いので不要な場合も)
        // this.updateBallAndPaddleAppearance();

    }, [], this);
}

    // ▼▼▼ 単純な効果の Activate 関数 (もし必要なら追加) ▼▼▼
    // 例: Kubira, Shatora, Haila は activateTemporaryEffect を直接呼んでも良いが、
    //     activate 関数があった方が activateMakora から呼び出しやすい
    activateKubira() {
        console.log("[Activate Kubira] (Likely from Makora copy)");
        this.activateTemporaryEffect(
            POWERUP_TYPES.KUBIRA, POWERUP_DURATION[POWERUP_TYPES.KUBIRA] || 10000,
            () => this.setBallPowerUpState(POWERUP_TYPES.KUBIRA, true), // isKubiraActive は setBallPowerUpState 内で処理
            () => this.setBallPowerUpState(POWERUP_TYPES.KUBIRA, false)
        );
    }
    activateShatora() {
        console.log("[Activate Shatora] (Likely from Makora copy)");
        this.activateTemporaryEffect(
            POWERUP_TYPES.SHATORA, POWERUP_DURATION[POWERUP_TYPES.SHATORA] || 3000,
            () => { this.balls.getChildren().forEach(ball => { if (ball.active) this.applySpeedModifier(ball, POWERUP_TYPES.SHATORA); }); },
            () => { this.balls.getChildren().forEach(ball => { if (ball.active) this.resetBallSpeed(ball); }); }
        );
        this.setBallPowerUpState(POWERUP_TYPES.SHATORA, true); // アイコン表示のため
    }
    activateHaira() {
        console.log("[Activate Haila] (Likely from Makora copy)");
        this.activateTemporaryEffect(
            POWERUP_TYPES.HAILA, POWERUP_DURATION[POWERUP_TYPES.HAILA] || 10000,
            () => { this.balls.getChildren().forEach(ball => { if (ball.active) this.applySpeedModifier(ball, POWERUP_TYPES.HAILA); }); },
            () => { this.balls.getChildren().forEach(ball => { if (ball.active) this.resetBallSpeed(ball); }); }
        );
        this.setBallPowerUpState(POWERUP_TYPES.HAILA, true); // アイコン表示のため
    }
    // ▲▲▲ 単純な効果の Activate 関数 ▲▲▲


    // アンチラメソッド

activateAnchira() {
    console.log("[Anchira] Activating!");
    // 1. 起点ボール決定
    const sourceBall = this.keepFurthestBall();
    if (!sourceBall || !sourceBall.active) { console.warn("[Anchira] Activation failed: No source ball."); return; }
    console.log(`[Anchira] Source ball: ${sourceBall.name || sourceBall.texture.key}`);

    // 2. 起点ボールの直前の状態を取得
    let previousData = sourceBall.data.getAll();
    previousData.activePowers = new Set(previousData.activePowers);
    previousData.activePowers.delete(POWERUP_TYPES.ANCHIRA); // アンチラ自体は除外
    const remainingPowers = Array.from(previousData.activePowers);
    previousData.lastActivatedPower = remainingPowers.length > 0 ? remainingPowers[remainingPowers.length - 1] : null;
    console.log(`[Anchira] Previous data for split: LastPower=${previousData.lastActivatedPower}`);

    // 3. 起点ボールにアンチラ状態設定
    this.setBallPowerUpState(POWERUP_TYPES.ANCHIRA, true, sourceBall);

    // ▼▼▼ ボール生成を delayedCall で分散 ▼▼▼
    const ballsToCreate = 3; // 作成するボールの数
    let createdCount = 0;    // 作成したボールのカウンター

    // 再帰的にボールを生成する内部関数
    const createSplitBallRecursive = (index) => {
        // --- 終了条件 ---
        // 指定数作り終えたか、起点ボールが消えてしまったら終了
        if (index >= ballsToCreate || !sourceBall?.active) {
            console.log(`[Anchira Split] Finished creating ${createdCount} balls.`);
            // ★ 全てのボール生成後に見た目更新とタイマー設定を行う ★
            this.updateBallAndPaddleAppearance();
             // 効果終了タイマー設定 (既存があれば上書き)
             if (this.anchiraTimer) this.anchiraTimer.remove();
             this.anchiraTimer = this.time.delayedCall(ANCHIRA_DURATION, this.deactivateAnchira, [], this);
             console.log(`[Anchira] Deactivation timer set for ${ANCHIRA_DURATION}ms`);
            return;
        }

        console.log(`[Anchira Split] Attempting to create ball ${index + 1}/${ballsToCreate}`);

        // --- ボール生成処理 ---
        // 速度や位置を少しランダムにする
        const vx = sourceBall.body.velocity.x * Phaser.Math.FloatBetween(0.7, 1.3) + Phaser.Math.Between(-60, 60);
        const vy = sourceBall.body.velocity.y * Phaser.Math.FloatBetween(0.7, 1.3) + Phaser.Math.Between(-60, 0);
        const spawnX = sourceBall.x + Phaser.Math.Between(-15, 15);
        const spawnY = sourceBall.y + Phaser.Math.Between(-15, 15);

        // 新しいボールを生成
        const newBall = this.createAndAddBall(spawnX, spawnY, vx, vy, previousData);

        if (newBall) {
            // 新しいボールにもアンチラ状態を設定
            this.setBallPowerUpState(POWERUP_TYPES.ANCHIRA, true, newBall);
            createdCount++;
            //console.log(`[Anchira Split] Ball ${index + 1} created successfully.`);
        } else {
            //console.error(`[Anchira Split] Failed to create ball ${index + 1}!`);
        }

        // --- 次のフレームで次のボール生成を予約 ---
        // 1ms の遅延は、ほぼ次のフレームで実行されることを意図
        this.time.delayedCall(1, () => createSplitBallRecursive(index + 1));
    };

    // 最初のボール生成を開始 (インデックス 0 から)
    createSplitBallRecursive(0);
    // ▲▲▲ ボール生成を delayedCall で分散 ▲▲▲

    // ★ 見た目更新とタイマー設定は再帰関数の最後で行うため、ここでは削除 ★
    // this.updateBallAndPaddleAppearance();
    // if (this.anchiraTimer) this.anchiraTimer.remove();
    // this.anchiraTimer = this.time.delayedCall(...)
}
    // アンチラ無効化メソッド (新規追加)
    deactivateAnchira() {
        if (!this.anchiraTimer) return; // タイマーがなければ既に解除済み
        console.log("[Anchira] Deactivating!");
        this.anchiraTimer.remove(); // タイマー解除
        this.anchiraTimer = null;

        // 1. 起点となるボールを決定 (タイマー切れなので一番遠いものを残す)
        const keepBall = this.keepFurthestBall();

        // 2. 全てのアクティブなボールからアンチラ状態を解除
        const activeBalls = this.balls?.getMatching('active', true) ?? [];
        activeBalls.forEach(ball => {
             if (ball && ball.active) {
                 this.setBallPowerUpState(POWERUP_TYPES.ANCHIRA, false, ball);
             }
        });

        // 3. 残すボールがあれば、その見た目を更新
        if (keepBall && keepBall.active) {
            console.log(`[Anchira] Kept ball ${keepBall.name || keepBall.texture.key} after deactivation.`);
            this.updateBallAppearance(keepBall); // keepBallの見た目を最終状態に
        } else {
            console.log("[Anchira] No ball kept after deactivation.");
        }
         // ★ TODO: ボール消滅エフェクト ★
    }

// シンダラ有効化メソッド (新規追加)
activateSindara() {
    console.log("[Sindara] Activating!");
    // 1. 起点となるボールを決定（複数あれば遠い方）
    const sourceBall = this.keepFurthestBall();
    if (!sourceBall || !sourceBall.active) {
        console.warn("[Sindara] Activation failed: No source ball found after keepFurthestBall.");
        return;
    }
     console.log(`[Sindara] Source ball selected: ${sourceBall.name || sourceBall.texture.key}`);

    // 2. 起点ボールのデータを取得 (分裂後のボールに引き継ぐため)
    const ballData = sourceBall.data.getAll(); // 現在の全データをコピー
    ballData.activePowers = new Set(ballData.activePowers); // Setもコピー

    // 3. 起点ボールにシンダラ状態を設定
    this.setBallPowerUpState(POWERUP_TYPES.SINDARA, true, sourceBall);

    // 4. 新しいボールを複製して追加
    const vx = sourceBall.body.velocity.x * -0.5 + Phaser.Math.Between(-50, 50); // 少し逆向きに分裂
    const vy = sourceBall.body.velocity.y * 0.8 + Phaser.Math.Between(-50, 0); // Y速度は少し維持
    const newBall = this.createAndAddBall(
        sourceBall.x + Phaser.Math.Between(-10, 10), // 少しずらす
        sourceBall.y + Phaser.Math.Between(-10, 10),
        vx,
        vy,
        ballData // ★ 取得したデータを渡す
    );

    if (newBall) {
         // 5. 新しいボールにもシンダラ状態を設定
         this.setBallPowerUpState(POWERUP_TYPES.SINDARA, true, newBall);
         console.log(`[Sindara] New ball created: ${newBall.name || newBall.texture.key}`);
         // ★ TODO: 分裂エフェクト ★
    } else {
        console.error("[Sindara] Failed to create the second ball!");
        // 失敗した場合、元のボールのシンダラ状態も解除した方が良いかも
        this.deactivateSindara(sourceBall);
    }

    this.updateBallAndPaddleAppearance(); // 両方のボールのアイコンを更新
}

// シンダラ無効化メソッド (ボール単位 or 全体)
deactivateSindara(ball = null) { // 引数なしなら全体解除
    const targetBalls = ball ? [ball] : this.balls?.getMatching('isSindaraActive', true) ?? [];
    if (!targetBalls || targetBalls.length === 0) return;

    console.log(`[Sindara] Deactivating for ${ball ? 'specific ball' : 'all active Sindara balls'} (${targetBalls.length} found).`);
    targetBalls.forEach(b => {
        if (b && b.active) {
             this.setBallPowerUpState(POWERUP_TYPES.SINDARA, false, b);
             // ★ TODO: 解除エフェクト ★
        }
    });
    // this.updateBallAndPaddleAppearance(); // 呼び出し元で更新
}


// インダラ有効化メソッド (新規追加)
activateIndara() {
    console.log("[Indara] Activating!");
    // アクティブなボール全てにインダラ効果を付与
    this.balls?.getMatching('active', true).forEach(ball => {
        this.setBallPowerUpState(POWERUP_TYPES.INDARA, true);
    });
    this.updateBallAndPaddleAppearance(); // ボールアイコン変更
    this.setColliders(); // 衝突判定変更 (Overlapへ)
    // ★ TODO: ホーミング開始エフェクト ★
}

// インダラ無効化メソッド (主にボスヒット時用)
deactivateIndara(ball) {
    if (!ball || !ball.active || !ball.getData('isIndaraActive')) return; // 対象ボールの状態チェック
    console.log("[Indara] Deactivating for specific ball.");
    this.setBallPowerUpState(POWERUP_TYPES.INDARA, false); // フラグ解除
    // 見た目更新は deactivateIndara を呼んだ後に行う
    // ★ TODO: ホーミング終了エフェクト ★
}

// ビカラ有効化メソッド (貫通仕様に修正)
activateBikara() {
    console.log("[Bikara] Activating Penetration!");
    const targetBalls = this.balls?.getMatching('active', true);
    if (!targetBalls || targetBalls.length === 0) { console.warn("No active balls for Bikara."); return; }

    targetBalls.forEach(ball => {
        if (this.bikaraTimers[ball.name]) { /* 既存タイマー解除 */ }

        // 状態設定 (貫通フラグを立てる)
        this.setBallPowerUpState(POWERUP_TYPES.BIKARA, true, ball);

        // 効果時間タイマー設定
        const timer = this.time.delayedCall(BIKARA_DURATION, () => {
            console.log(`[Bikara] Penetration expired for ball ${ball.name}`);
            this.deactivateBikara(ball); // 時間切れで解除
            this.setColliders(); // 衝突判定を戻す
            this.updateBallAndPaddleAppearance(); // 見た目も戻す
        }, [], this);
        this.bikaraTimers[ball.name] = timer;
        console.log(`[Bikara] Penetration Timer set for ball ${ball.name}`);
        // ★ TODO: ビカラ開始エフェクト ★
    });

    this.updateBallAndPaddleAppearance(); // ボールアイコン変更
    this.setColliders(); // 衝突判定変更 (Overlapへ)
}

// ビカラ無効化メソッド (貫通仕様)
deactivateBikara(ball) {
    if (!ball || !ball.active || !ball.getData('isBikaraPenetrating')) return; // 貫通状態かチェック
    console.log(`[Bikara] Deactivating Penetration for ball ${ball.name}`);
    this.setBallPowerUpState(POWERUP_TYPES.BIKARA, false, ball); // フラグ解除 (タイマーも内部で解除)
}




    // --- ▼ ボール状態設定ヘルパー (lastActivatedPower再設定ロジック省略なし) ▼ ---
    // --- ▼ setBallPowerUpState (ログ強化) ▼ ---
setBallPowerUpState(type, isActive) {
    console.log(`[setBallPowerUpState] Called for type: ${type}, isActive: ${isActive}`); // ★ 関数呼び出しログ
    
    this.balls?.getChildren().forEach(ball => {
        if (ball?.active && ball.getData) { // getDataの存在も確認
            let activePowers = ball.getData('activePowers');
            if (!activePowers) activePowers = new Set();
            let oldLastPower = ball.getData('lastActivatedPower'); // ★ 古い lastActivatedPower を記録

            if (isActive) {
                activePowers.add(type);
                ball.setData('lastActivatedPower', type);
                console.log(`  Ball ${ball.name || ball.texture.key}: Added ${type}. Last Power: ${type} (was ${oldLastPower})`); // ★ ログ追加
            } else {
                activePowers.delete(type);
                console.log(`  Ball ${ball.name || ball.texture.key}: Removed ${type}. Current Powers: [${Array.from(activePowers).join(', ')}]`); // ★ 削除ログ
                if (ball.getData('lastActivatedPower') === type) {
                    const remainingPowers = Array.from(activePowers);
                    const newLastPower = remainingPowers.length > 0 ? remainingPowers[remainingPowers.length - 1] : null;
                    ball.setData('lastActivatedPower', newLastPower);
                    console.log(`    Last Power was ${type}, reset to: ${newLastPower}`); // ★ リセットログ
                }
            }
            ball.setData('activePowers', activePowers);

            // 各パワーアップに対応するフラグの設定/解除
            if (type === POWERUP_TYPES.KUBIRA) {
                ball.setData('isKubiraActive', isActive);
                console.log(`    Set isKubiraActive to: ${isActive}`); // ★ isKubiraActive 設定ログ
            }
            if (type === POWERUP_TYPES.SHATORA) { // 他のフラグも同様にログ追加推奨
                ball.setData('isFast', isActive);
                 console.log(`    Set isFast to: ${isActive}`);
            }
            if (type === POWERUP_TYPES.HAILA) {
                ball.setData('isSlow', isActive);
                 console.log(`    Set isSlow to: ${isActive}`);
            }
             if (type === POWERUP_TYPES.MAKIRA) { // マキラ用フラグはないが、activePowersで管理
                 console.log(`    Makira power status set to: ${isActive}`);
             }
             // ▼▼▼ インダラフラグ ▼▼▼
             if (type === POWERUP_TYPES.INDARA) {
                ball.setData('isIndaraActive', isActive);
                console.log(`    Set isIndaraActive to: ${isActive}`);
            }
            // ▲▲▲ インダラフラグ ▲▲▲
            // ▼▼▼ ビカラ貫通フラグ設定 ▼▼▼
            if (type === POWERUP_TYPES.BIKARA) {
                ball.setData('isBikaraPenetrating', isActive); // ★ 貫通フラグを設定/解除
                console.log(`    Set isBikaraPenetrating to: ${isActive}`);
                // bikaraState は削除
                // タイマー解除は deactivateBikara で行う
                if (!isActive) { // ★ 無効化時にタイマー解除
                    const timer = this.bikaraTimers[ball.name];
                    if (timer) {
                        console.log(`    Removing Bikara timer for ball ${ball.name}`);
                        timer.remove();
                        delete this.bikaraTimers[ball.name];
                    }
                }
            }
            // ▲▲▲ ビカラ貫通フラグ設定 ▲▲▲
              // ▼▼▼ シンダラフラグ ▼▼▼
              if (type === POWERUP_TYPES.SINDARA) {
                ball.setData('isSindaraActive', isActive);
                console.log(`    Set isSindaraActive to: ${isActive}`);
                // シンダラにはタイマーはない
            }
            // ▲▲▲ シンダラフラグ ▲▲▲
             // ▼▼▼ アンチラフラグ ▼▼▼
             if (type === POWERUP_TYPES.ANCHIRA) {
                ball.setData('isAnchiraActive', isActive);
                console.log(`    Set isAnchiraActive to: ${isActive}`);
            }
            // ▲▲▲ アンチラフラグ ▲▲▲
             // ▼▼▼ マコラフラグ (主に一時的なアイコン表示用) ▼▼▼
             if (type === POWERUP_TYPES.MAKORA) {
                ball.setData('isMakoraActive', isActive); // フラグは念のため
                console.log(`    Set isMakoraActive to: ${isActive}`);
            }
            // ▲▲▲ マコラフラグ ▲▲▲
        
            // 他のパワーアップフラグもここに追加

        }
    });
    // ★★★ setBallPowerUpState の最後に見た目更新を強制呼び出し ★★★
    console.log("[setBallPowerUpState] Forcing appearance update after state change.");
    this.updateBallAndPaddleAppearance(); // 変更を即時反映させるため
// ★★★ 直接呼び出しテスト ★★★
const firstBall = this.balls?.getFirstAlive();
if (firstBall) {
     console.log(">>> Attempting DIRECT call to updateBallAppearance for first ball...");
     try {
         this.updateBallAppearance(firstBall);
         console.log("<<< DIRECT call finished.");
     } catch(e) {
          console.error("!!! ERROR during DIRECT call:", e);
     }
} else {
     console.log("No active ball found for direct call test.");
}
 // ★★★ 直接呼び出しテスト終了 ★★★
// ★★★ 単純なテスト関数呼び出し ★★★
console.log(">>> Attempting call to testLogFunction...");
try {
    this.testLogFunction("Hello from setBallPowerUpState");
    console.log("<<< testLogFunction call finished.");
} catch(e) {
    console.error("!!! ERROR during testLogFunction call:", e);
}
 // ★★★ 単純なテスト関数呼び出し終了 ★★★
}
// --- ▲ setBallPowerUpState ▲ ---
    // --- ▲ ボール状態設定ヘルパー ▲ ---

// アニラ有効化メソッド (新規追加)
activateAnila() {
    if (this.isAnilaActive) {
        // 既に有効ならタイマーをリセット
        console.log("[Anila] Already active, resetting timer.");
        if (this.anilaTimer) this.anilaTimer.remove();
    } else {
        console.log("[Anila] Activating!");
        this.isAnilaActive = true;
        // パドルの見た目を変更
        if (this.paddle) {
            this.paddle.setTint(PADDLE_ANILA_TINT);
            this.paddle.setAlpha(PADDLE_ANILA_ALPHA);
            // ★ TODO: オーラなどのエフェクトを追加 ★
        }
        // ボール状態更新 (アイコン表示用)
        this.setBallPowerUpState(POWERUP_TYPES.ANILA, true);
        this.updateBallAndPaddleAppearance(); // ボールとパドルの見た目更新
    }

    // 効果時間タイマー設定
    this.anilaTimer = this.time.delayedCall(ANILA_DURATION, this.deactivateAnila, [], this);
    console.log(`[Anila] Timer set for ${ANILA_DURATION}ms`);
}

// アニラ無効化メソッド (新規追加)
deactivateAnila() {
    if (!this.isAnilaActive) return; // 既に無効なら何もしない
    console.log("[Anila] Deactivating!");
    this.isAnilaActive = false;
    if (this.anilaTimer) { // タイマーがまだ存在すればクリア
        this.anilaTimer.remove();
        this.anilaTimer = null;
    }
    // パドルの見た目を元に戻す
    if (this.paddle) {
        this.paddle.setTint(PADDLE_NORMAL_TINT);
        this.paddle.setAlpha(1.0);
         // ★ TODO: オーラエフェクト解除 ★
    }
    // ボール状態解除
    this.setBallPowerUpState(POWERUP_TYPES.ANILA, false);
    this.updateBallAndPaddleAppearance();
    console.log("[Anila] Deactivated.");
}

// updateBallFall メソッド (アニラ跳ね返し処理込みの完全版)
updateBallFall() {
    if (!this.balls || !this.balls.active) return;
    let activeBallCount = 0;
    let shouldLoseLife = false; // ライフ減少フラグ
    let droppedSindaraBall = null; // 落ちたシンダラボールを追跡

    this.balls.getChildren().forEach(ball => {
        if (ball.active) {
            activeBallCount++;
            // ボールが画面下に落ちた判定
            if (this.isBallLaunched && ball.y > this.gameHeight + ball.displayHeight) {
                const isSindara = ball.getData('isSindaraActive') === true;

                // ▼▼▼ アニラ効果判定 ▼▼▼
                if (this.isAnilaActive) {
                    console.log("[Anila] Ball bounce triggered!");
                    // ▼▼▼ ★★★ 跳ね返し処理 (省略されていた箇所) ★★★ ▼▼▼
                    // アニラ効果を先に解除 (タイミング変更案)
                    this.deactivateAnila();

                    // Y座標をもっと安全な位置に戻す
                    ball.y = this.gameHeight * 0.7; // 例: 画面下から70%の位置

                    // 跳ね返し速度を設定 (強めにする案)
                    const bounceVy = BALL_INITIAL_VELOCITY_Y; // 元の初期Y速度と同じ強さ
                    const bounceVx = ball.body ? ball.body.velocity.x : 0; // X速度は維持

                    // 速度を設定
                    ball.setVelocity(bounceVx, bounceVy);
                    console.log(`[Anila] Ball bounced back! New Velocity: (${bounceVx.toFixed(0)}, ${bounceVy.toFixed(0)})`);
                    // ▲▲▲ ★★★ 跳ね返し処理 (省略されていた箇所) ★★★ ▲▲▲

                } else { // ★ アニラ無効時のみボール消滅処理 ★
                    console.log("Ball went out of bounds (Anila inactive).");
                    ball.setActive(false).setVisible(false);
                    if (ball.body) ball.body.enable = false;
                    shouldLoseLife = true;
                    if (isSindara) {
                        droppedSindaraBall = ball;
                    }
                }
                // ▲▲▲ アニラ効果判定 ▲▲▲
            }
        }
    }); // forEach ループの終わり

    // --- シンダラ解除判定 ---
    if (droppedSindaraBall) {
        const remainingSindaraBalls = this.balls.getMatching('isSindaraActive', true);
        console.log(`[Sindara Check] A Sindara ball dropped. Remaining: ${remainingSindaraBalls.length}`);
        if (remainingSindaraBalls.length === 1) {
            console.log("[Sindara] Only one left, deactivating effect.");
            this.deactivateSindara(remainingSindaraBalls[0]);
            this.updateBallAndPaddleAppearance();
        }
    }

     // --- ライフ減少判定 ---
     const currentActiveBalls = this.balls.countActive(true);
     if (shouldLoseLife && currentActiveBalls === 0 && this.isBallLaunched && this.lives > 0 && !this.isGameOver && !this.bossDefeated) {
         console.log("No active balls left, losing life.");
         this.loseLife();
     }
 }

// --- ▼ マキラ関連メソッド (GameSceneから移植・調整) ▼ ---

activateMakira() {
    if (!this.isMakiraActive) {
        console.log("[BossScene] Activating Makira.");
        this.isMakiraActive = true; // フラグを立てる
        // ファミリアグループ準備
        if (this.familiars) this.familiars.clear(true, true);
        else this.familiars = this.physics.add.group(); // ★ familiarsプロパティが必要
        this.createFamiliars(); // ファミリア生成
        // ビームグループ準備
        if (this.makiraBeams) this.makiraBeams.clear(true, true);
        else this.makiraBeams = this.physics.add.group(); // ★ makiraBeamsプロパティが必要

        // 攻撃タイマー開始
        if (this.makiraAttackTimer) this.makiraAttackTimer.remove();
        this.makiraAttackTimer = this.time.addEvent({
            delay: MAKIRA_ATTACK_INTERVAL, // constants.js から
            callback: this.fireMakiraBeam,
            callbackScope: this,
            loop: true
        });
        // ボール状態設定
        this.setBallPowerUpState(POWERUP_TYPES.MAKIRA, true);
        this.updateBallAndPaddleAppearance(); // 見た目更新
    }
    // 効果時間タイマー設定
    const duration = POWERUP_DURATION[POWERUP_TYPES.MAKIRA] || 6667;
    if (this.powerUpTimers[POWERUP_TYPES.MAKIRA]) this.powerUpTimers[POWERUP_TYPES.MAKIRA].remove();
    this.powerUpTimers[POWERUP_TYPES.MAKIRA] = this.time.delayedCall(duration, () => {
        console.log("Deactivating Makira due to duration.");
        this.deactivateMakira();
        this.powerUpTimers[POWERUP_TYPES.MAKIRA] = null;
    }, [], this);
    // ★ 衝突判定の更新が必要 (ビーム用) ★
    this.setColliders();
}

deactivateMakira() {
    if (this.isMakiraActive) {
        console.log("[BossScene] Deactivating Makira.");
        this.isMakiraActive = false;
        if (this.makiraAttackTimer) { this.makiraAttackTimer.remove(); this.makiraAttackTimer = null; }
        if (this.powerUpTimers[POWERUP_TYPES.MAKIRA]) { this.powerUpTimers[POWERUP_TYPES.MAKIRA].remove(); this.powerUpTimers[POWERUP_TYPES.MAKIRA] = null; }
        if (this.familiars) { this.familiars.clear(true, true); }
        if (this.makiraBeams) { this.makiraBeams.clear(true, true); }
        // ボール状態解除
        this.setBallPowerUpState(POWERUP_TYPES.MAKIRA, false);
        this.updateBallAndPaddleAppearance();
         // ★ 衝突判定の更新 (ビーム用を解除) ★
        this.setColliders();
    }
}

// BossScene.js 内
createFamiliars() {
    if (!this.paddle || !this.paddle.active || !this.familiars) { console.warn("Cannot create familiars."); return; }
    console.log("Creating familiars (physics enabled for independent movement)..."); // ログ変更
    const paddleX = this.paddle.x; // 初期位置の基準には使う
    const familiarY = this.paddle.y - PADDLE_HEIGHT / 2 - MAKIRA_FAMILIAR_SIZE; // Y座標はパドルの少し上

    try {
        // 左の子機
        const familiarLeft = this.familiars.create(paddleX - MAKIRA_FAMILIAR_OFFSET, familiarY, 'joykun') // physics group から create
            .setDisplaySize(MAKIRA_FAMILIAR_SIZE * 2, MAKIRA_FAMILIAR_SIZE * 2)
            .setCollideWorldBounds(true) // ★ ワールド境界と衝突
            .setBounceX(1)               // ★ X方向(左右)に反射
            .setImmovable(true);         // ★ 他からの影響を受けないように

        if (familiarLeft.body) {
            familiarLeft.body.setAllowGravity(false); // 重力無効
            familiarLeft.setVelocityX(-FAMILIAR_MOVE_SPEED_X); // ★ 左へ移動開始
            familiarLeft.body.onWorldBounds = true; // ★ 境界衝突イベント有効化 (もし必要ならSE再生などに使える)
        } else { console.error("Failed to create familiarLeft body!"); if(familiarLeft) familiarLeft.destroy(); }

        // 右の子機
        const familiarRight = this.familiars.create(paddleX + MAKIRA_FAMILIAR_OFFSET, familiarY, 'joykun')
            .setDisplaySize(MAKIRA_FAMILIAR_SIZE * 2, MAKIRA_FAMILIAR_SIZE * 2)
            .setCollideWorldBounds(true)
            .setBounceX(1)
            .setImmovable(true);

        if (familiarRight.body) {
            familiarRight.body.setAllowGravity(false);
            familiarRight.setVelocityX(FAMILIAR_MOVE_SPEED_X); // ★ 右へ移動開始
            familiarRight.body.onWorldBounds = true;
        } else { console.error("Failed to create familiarRight body!"); if(familiarRight) familiarRight.destroy(); }

        console.log(`Physics familiars created. Count: ${this.familiars.getLength()}`);
    } catch (e) {
        console.error("Error creating/setting up physics familiars:", e);
    }
}


fireMakiraBeam() {
    if (!this.isMakiraActive || !this.familiars || this.familiars.countActive(true) === 0 || this.isGameOver || this.bossDefeated) return;
    // SEは無しでOK

    this.familiars.getChildren().forEach(familiar => {
        if (familiar.active) {
            const beam = this.makiraBeams.create(familiar.x, familiar.y - MAKIRA_FAMILIAR_SIZE, 'whitePixel') // 定数が必要
                .setDisplaySize(MAKIRA_BEAM_WIDTH, MAKIRA_BEAM_HEIGHT).setTint(MAKIRA_BEAM_COLOR); // 定数が必要
            if (beam && beam.body) {
                beam.setVelocity(0, -MAKIRA_BEAM_SPEED); // 定数が必要
                beam.body.setAllowGravity(false);
                 // ★ ビームとボスの衝突判定を設定する必要あり ★
                 //    setColliders内か、ここで毎回設定するか
                 this.physics.add.overlap(beam, this.boss, this.hitBossWithMakiraBeam, (theBeam, boss) => !boss.getData('isInvulnerable'), this); // 例
            } else { if (beam) beam.destroy(); }
        }
    });
}

// ★ マキラビームがボスに当たった時の処理 (新規追加)
hitBossWithMakiraBeam(beam, boss) {
     if (!beam || !boss || !beam.active || !boss.active || boss.getData('isInvulnerable')) return;
     console.log("Makira beam hit boss!");
     beam.destroy(); // ビームは消える
     this.applyBossDamage(boss, 1, "Makira Beam"); // ダメージ1を与える
}
     
    // ★ applyBossDamage メソッド (新規追加 - hitBossを汎用化)
    applyBossDamage(boss, damage, source = "Unknown") {
        if (!boss || !boss.active || boss.getData('isInvulnerable')) {
             console.log(`Damage (${damage} from ${source}) blocked: Boss inactive or invulnerable.`);
             return;
        }
         let currentHealth = boss.getData('health');
         currentHealth -= damage;
         boss.setData('health', currentHealth);
         console.log(`[Boss Damage] ${damage} damage dealt by ${source}. Boss health: ${currentHealth}/${boss.getData('maxHealth')}`);
         // ダメージリアクション
         boss.setTint(0xff0000); boss.setData('isInvulnerable', true);
         const shakeDuration = 60; const shakeAmount = boss.displayWidth * 0.03;
         this.tweens.add({ targets: boss, props: { x: { value: `+=${shakeAmount}`, duration: shakeDuration / 4, yoyo: true, ease: 'Sine.InOut' } }, repeat: 1 });
         // try { this.sound.add('seBossHit').play(); } catch(e) {}
         this.time.delayedCall(150, () => { if (boss.active) { boss.clearTint(); boss.setData('isInvulnerable', false); } });
         // 体力ゼロ判定
         if (currentHealth <= 0) { this.defeatBoss(boss); }
    }


    // --- ▲ パワーアップ効果管理ヘルパー ▲ ---


    // --- ▼ 速度変更ヘルパー (GameSceneから移植) ▼ ---
    applySpeedModifier(ball, type) {
        if (!ball || !ball.active || !ball.body) return;
        const modifier = BALL_SPEED_MODIFIERS[type];
        if (!modifier) return;
        const currentVelocity = ball.body.velocity;
        const direction = currentVelocity.length() > 0 ? currentVelocity.clone().normalize() : new Phaser.Math.Vector2(0, -1);
        const newSpeed = NORMAL_BALL_SPEED * modifier;
        ball.setVelocity(direction.x * newSpeed, direction.y * newSpeed);
         console.log(`Applied speed modifier ${modifier} for ${type}`);
         this.setBallPowerUpState(type === POWERUP_TYPES.SHATORA ? 'isFast' : 'isSlow', true); // 状態フラグ設定
    }

    resetBallSpeed(ball) {
        if (!ball || !ball.active || !ball.body) return;
        console.log("Resetting ball speed...");
         // isFast/isSlow フラグをボールデータに持たせる必要がある
         // this.setBallPowerUpState('isFast', false); // 仮
         // this.setBallPowerUpState('isSlow', false); // 仮
         // if (ball.getData('isFast')) ... else if (ball.getData('isSlow')) ... else ...
         // GameSceneの実装を参照し、ボールのdataに必要なフラグを追加する必要あり
         // → 簡略化のため、一旦単純にNORMAL_BALL_SPEEDに戻す
         const currentVelocity = ball.body.velocity;
         const direction = currentVelocity.length() > 0 ? currentVelocity.clone().normalize() : new Phaser.Math.Vector2(0, -1);
         ball.setVelocity(direction.x * NORMAL_BALL_SPEED, direction.y * NORMAL_BALL_SPEED);
          console.log("Ball speed reset to normal.");
    }
    // --- ▲ 速度変更ヘルパー ▲ ---


    // ... (他のメソッド: hitBoss, hitOrbiter(削除済), defeatBoss など) ...

    hitAttackBrick(brick, ball) {
        if (!brick || !brick.active || !ball || !ball.active) return;
      //  console.log(`[hitAttackBrick] Current chaosSettings.count: ${this.chaosSettings?.count}`);
      //  console.log("Attack brick hit by ball!");
        const brickX = brick.x; const brickY = brick.y; const brickColor = brick.tintTopLeft;
        // エフェクト & SE
        try { /* ...パーティクル... */ } catch (e) { /*...*/ }
        try { this.sound.add(AUDIO_KEYS.SE_DESTROY).play(); } catch (e) { /*...*/ }
        brick.destroy(); // 先にブロックを破壊

        // ★★★ ヴァジラゲージ増加処理を追加 ★★★
        this.increaseVajraGauge(); // 攻撃ブロック破壊でゲージ増加

        // --- ▼ アイテムドロップ判定 (バイシュラヴァ特別判定追加) ▼ ---
        const dropRate = this.chaosSettings?.rate ?? ATTACK_BRICK_ITEM_DROP_RATE;

        // 1. まずバイシュラヴァが特別にドロップするか判定 (GameSceneと同じ定数を使用)
        if (Phaser.Math.FloatBetween(0, 1) < BAISRAVA_DROP_RATE) {
            console.log("[Drop Logic] Baisrava special drop!");
            this.dropSpecificPowerUp(brickX, brickY, POWERUP_TYPES.BAISRAVA);
        }
        // 2. バイシュラヴァが出なかった場合、通常のドロップ判定を行う
        else if (Phaser.Math.FloatBetween(0, 1) < dropRate) {
             console.log(`[Drop Logic] Checking drop against rate: ${dropRate.toFixed(2)}`);
             if (this.bossDropPool && this.bossDropPool.length > 0) {
                 // ★ バイシュラヴァを除いたプールから選ぶ (任意) ★
                 //    これにより、特別ドロップ以外ではバイシュラヴァが出なくなる
                 const poolWithoutBaisrava = this.bossDropPool.filter(type => type !== POWERUP_TYPES.BAISRAVA);
                 if (poolWithoutBaisrava.length > 0) {
                     const dropType = Phaser.Utils.Array.GetRandom(poolWithoutBaisrava);
                     console.log(`[Drop Logic] Dropping item: ${dropType} (From pool excluding Baisrava)`);
                     this.dropSpecificPowerUp(brickX, brickY, dropType);
                 } else {
                      console.log("Drop pool only contained Baisrava, nothing else to drop.");
                 }
             } else { console.log("No items in boss drop pool."); }
        } else {
             console.log("[Drop Logic] No item drop based on rate.");
        }
        
        // --- ▲ アイテムドロップ判定 (バイシュラヴァ特別判定追加) ▲ ---

        // --- ▼ ボール速度を維持/再設定 ▼ ---
        if (ball.body) { // ボディがあるか確認
            let speedMultiplier = 1.0;
            const isFast = ball.getData('isFast') === true;
            const isSlow = ball.getData('isSlow') === true;
            if (isFast) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA];
            else if (isSlow) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA];
            const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier;

            // 現在の速度ベクトルを維持しつつ、速度だけ再設定
            const currentVelocity = ball.body.velocity;
            if (currentVelocity.lengthSq() > 0) { // 速度が0でない場合
                currentVelocity.normalize().scale(targetSpeed); // 方向を維持して速度を適用
                ball.setVelocity(currentVelocity.x, currentVelocity.y);
                console.log(`[hitAttackBrick] Ball speed reset to targetSpeed: ${targetSpeed.toFixed(0)}`);
            } else {
                 console.warn("[hitAttackBrick] Ball velocity was zero, cannot normalize.");
                 // 速度ゼロの場合はデフォルトで上向きに飛ばすなど検討
                 ball.setVelocity(0, -targetSpeed);
            }
        }
        // --- ▲ ボール速度を維持/再設定 ▲ ---

    }


    // --- ▼ ヴァジラ関連メソッド (GameSceneから移植・調整) ▼ ---
    activateVajra() {
        if (!this.isVajraSystemActive) {
            console.log("[BossScene] Activating Vajra system.");
            this.isVajraSystemActive = true; // ★ フラグを立てる
            this.vajraGauge = 0;              // ★ ゲージリセット
            // ▼▼▼ UISceneに通知 ▼▼▼
            if(this.uiScene?.scene.isActive()) {
                this.events.emit('activateVajraUI', this.vajraGauge, VAJRA_GAUGE_MAX);
            } else { console.warn("Vajra activated, but UIScene not ready."); }
            // ▲▲▲ UISceneに通知 ▲▲▲
            // ボールに状態付与 (アイコン表示用)
            this.setBallPowerUpState(POWERUP_TYPES.VAJRA, true);
            this.updateBallAndPaddleAppearance(); // 見た目更新
        } else {
             console.log("[BossScene] Vajra system already active."); // 既に有効な場合
             // 既に有効な場合はゲージをリセットする？ or 何もしない？ -> 今回は何もしない
        }
    }

    // increaseVajraGauge メソッド (追加)
    increaseVajraGauge() {
        // ★ ゲージシステムが有効で、ゲームが進行中の場合のみ増加
        if (this.isVajraSystemActive && !this.isGameOver && !this.bossDefeated) {
            this.vajraGauge += VAJRA_GAUGE_INCREMENT; // 定数で増加
            this.vajraGauge = Math.min(this.vajraGauge, VAJRA_GAUGE_MAX); // 上限チェック
            console.log(`[Vajra Gauge] Increased to ${this.vajraGauge}/${VAJRA_GAUGE_MAX}`);

            // ▼▼▼ UISceneに通知 ▼▼▼
            if(this.uiScene?.scene.isActive()) {
                this.events.emit('updateVajraGauge', this.vajraGauge);
            }
            // ▲▲▲ UISceneに通知 ▲▲▲

            // ★ ゲージMAX判定 ★
            if (this.vajraGauge >= VAJRA_GAUGE_MAX) {
                console.log("[Vajra Gauge] MAX! Triggering Ougi!");
                this.triggerVajraDestroy(); // 奥義発動
            }
        }
    }

    // triggerVajraDestroy メソッド (ダメージ値修正)
    triggerVajraDestroy() {
        if (!this.isVajraSystemActive) return; // 発動状態でなければ何もしない
        console.log("[BossScene] Triggering Vajra destroy (Boss Damage: 10)."); // ダメージ明記
        this.isVajraSystemActive = false; // 発動したらゲージシステム終了

        // ▼▼▼ UISceneに通知 ▼▼▼
        if(this.uiScene?.scene.isActive()) {
            this.events.emit('deactivateVajraUI');
        }
        // ▲▲▲ UISceneに通知 ▲▲▲

        // ボール状態解除 (アイコン戻すなど)
        this.setBallPowerUpState(POWERUP_TYPES.VAJRA, false);
        this.updateBallAndPaddleAppearance();

        // ボイス・SE再生
        try { this.sound.add(AUDIO_KEYS.VOICE_VAJRA_TRIGGER).play(); } catch (e) { console.error("Error playing VOICE_VAJRA_TRIGGER:", e); }
        // try { this.sound.add(AUDIO_KEYS.SE_VAJRA_TRIGGER).play(); } catch (e) { console.error("Error playing SE_VAJRA_TRIGGER:", e); } // SEは任意

        // ボスに10ダメージ
        if (this.boss && this.boss.active) {
            this.applyBossDamage(this.boss, 7, "Vajra Ougi"); // ★ ダメージを10に変更
        } else {
             console.log("Vajra Ougi triggered, but boss is inactive.");
        }
    }
    // --- ▲ ヴァジラ関連メソッド ▲ ---


// BossScene.js の create ヘルパー

// BossScene.js 内
createMakiraGroups() {
    console.log("Creating Makira groups (familiars as physics group)..."); // ログ変更
    if (this.familiars) { this.familiars.destroy(true); this.familiars = null; }
    // ★★★ ファミリアを物理グループにする ★★★
    this.familiars = this.physics.add.group(); // physics.add.group() に変更
    if (this.makiraBeams) { this.makiraBeams.destroy(true); this.makiraBeams = null; }
    this.makiraBeams = this.physics.add.group(); // ビームは物理のまま
    console.log("Makira groups created (familiars as physics).");
}


    

    //* --- ▼ ボスの動きメソッド ▼ ---
   /* startBossMovement() {
        if (!this.boss || !this.boss.active) { console.warn("Cannot start movement, boss not ready."); return; }
        if (this.bossMoveTween) { this.bossMoveTween.stop(); this.bossMoveTween = null; }

        console.log("Starting simple boss horizontal movement tween...");
        const moveWidth = this.gameWidth * BOSS_MOVE_RANGE_X_RATIO / 2;
        const leftX = this.gameWidth / 2 - moveWidth;
        const rightX = this.gameWidth / 2 + moveWidth;

        this.bossMoveTween = this.tweens.add({
            targets: this.boss,
            x: rightX,
            duration: BOSS_MOVE_DURATION,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay: 500
        });
        console.log("Simple boss movement tween started.");
    }*/
    // --- ▲ ボスの動きメソッド 元に戻す用▲ ---*/

// BossScene.js の startBossMovement メソッド (中央開始 - Tween連結方式)

startBossMovement() {
    if (!this.boss || !this.boss.active) { console.warn("Cannot start movement, boss not ready."); return; }
    // 既存のTweenがあれば停止・削除
    if (this.bossMoveTween) {
         if (this.tweens.getTweensOf(this.boss).length > 0) { // 念のため対象のTweenか確認
             this.tweens.killTweensOf(this.boss); // 対象オブジェクトのTweenを全て停止・削除
         }
        this.bossMoveTween = null;
    }

   // console.log("Starting boss horizontal movement (Center Start - Chained Tweens)...");
    const moveWidth = this.gameWidth * BOSS_MOVE_RANGE_X_RATIO / 2;
    const leftX = this.gameWidth / 2 - moveWidth;
    const rightX = this.gameWidth / 2 + moveWidth;
    const startX = this.gameWidth / 2; // 開始位置

    this.boss.setX(startX); // 初期位置を中央に

    // ★ 利用するイージング関数の名前リスト
    const easeFunctions = [
        'Sine.easeInOut',
        'Quad.easeInOut',
        'Cubic.easeInOut',
        'Quart.easeInOut', // Sineより急→緩やか→急
        'Expo.easeInOut',  // 最初と最後が非常に急 (サッピタッに近い)
        'Circ.easeInOut'   // 円曲線的な滑らかさ
    ];

    const moveToRight = () => {
        const randomEase = Phaser.Utils.Array.GetRandom(easeFunctions); // ★ ランダム選択
      //  console.log(`Tween: Moving to Right (Ease: ${randomEase})`);
        this.bossMoveTween = this.tweens.add({
            targets: this.boss,
            x: rightX,
            duration: BOSS_MOVE_DURATION,
            ease: randomEase, // ★ ランダムなEaseを適用
            onComplete: () => {
                if (this.boss?.active && !this.isGameOver && !this.bossDefeated) {
                    moveToLeft();
                }
            }
        });
    };

    const moveToLeft = () => {
        const randomEase = Phaser.Utils.Array.GetRandom(easeFunctions); // ★ ランダム選択
     //   console.log(`Tween: Moving to Left (Ease: ${randomEase})`);
        this.bossMoveTween = this.tweens.add({
            targets: this.boss,
            x: leftX,
            duration: BOSS_MOVE_DURATION,
            ease: randomEase, // ★ ランダムなEaseを適用
            onComplete: () => {
                 if (this.boss?.active && !this.isGameOver && !this.bossDefeated) {
                    moveToRight();
                }
            }
        });
    };

    moveToRight(); // 開始
  //  console.log("Chained boss movement tweens with random ease initiated.");
}

// --- ▼ 残像エミッタ設定メソッド (新規追加) ▼ ---
setupAfterImageEmitter() {
    if (this.bossAfterImageEmitter) { this.bossAfterImageEmitter.destroy(); } // 既存があれば破棄

    this.bossAfterImageEmitter = this.add.particles(0, 0, 'whitePixel', { // ★ whitePixel を使う
        // frame: 'bossStand', // 画像を使う場合はフレーム指定
        x: { min: -5, max: 5 }, // X座標を少しばらつかせる
        y: { min: -5, max: 5 }, // Y座標を少しばらつかせる
        lifespan: 1000, // 短い寿命 (ms)
        speed: 0, // 速度は不要 (その場に残る)
        scale: { start: this.boss.scale * 0.8, end: 0 }, // ★ ボスのスケールに合わせて開始、小さくなって消える
        alpha: { start: 0.8, end: 0 }, // 半透明で開始し、消える
        quantity: 3, // 一度に1つ放出
        frequency: 10, // 放出頻度 (ms) - 小さいほど頻繁
        blendMode: 'NORMAL', // NORMALかADDかお好みで
        tint: 0xfffff, // ★ 残像の色 (例: 少し暗い白、ボスの色に合わせても良い)
        emitting: false // ★ updateで追従させるので最初は止めておく
    });
    this.bossAfterImageEmitter.setDepth(this.boss.depth - 1); // ボスより後ろに表示
    console.log("After image emitter created.");
}
// --- ▲ 残像エミッタ設定メソッド ▲ ---


update(time, delta) {
    if (this.isGameOver || this.bossDefeated) {
         // ゲーム終了時は残像エミッタを停止
         if (this.bossAfterImageEmitter && this.bossAfterImageEmitter.emitting) {
             this.bossAfterImageEmitter.stop();
         }
        return;
    }
    // --- ▼ ホーミング処理 ▼ ---
    this.balls?.getMatching('active', true).forEach(ball => {
        if (ball.getData('isIndaraActive') && this.boss && this.boss.active && ball.body) {
            // ボスへの方向ベクトルを計算
            const direction = Phaser.Math.Angle.BetweenPoints(ball.body.center, this.boss.body.center);
            // 計算した角度と定義した速度でボールの速度を設定
            this.physics.velocityFromAngle(Phaser.Math.RadToDeg(direction), INDARA_HOMING_SPEED, ball.body.velocity);
        }
    });
    // --- ▲ ホーミング処理 ▲ --

    // --- ▼ 残像エミッタの位置追従 & 強制放出 (デバッグ用) ▼ ---
    if (this.bossAfterImageEmitter && this.boss && this.boss.active) {
        // 位置を常にボスに合わせる
        this.bossAfterImageEmitter.setPosition(this.boss.x, this.boss.y);

        // ★★★ デバッグのため、常にエミッタを開始してみる ★★★
        if (!this.bossAfterImageEmitter.emitting) {
             console.log("[DEBUG AfterImage] Force starting emitter in update.");
             this.bossAfterImageEmitter.start();
        }
        // --- ▲ 速度チェックを外して、常にstart()を試みる ---
    } else {
         // オブジェクトが存在しない場合のログ (デバッグ用)
         // if (!this.bossAfterImageEmitter) console.warn("[AfterImage Update] Emitter not ready.");
         // if (!this.boss) console.warn("[AfterImage Update] Boss not ready.");
    }
    // --- ▲ 残像エミッタの位置追従 & 強制放出 (デバッグ用) ▲ ---
    this.updateBallFall();
    this.updateAttackBricks();
    // updateOrbiters は削除済み
}


    // --- ▼ 当たり判定・ダメージ処理など ▼ ---
    setColliders() {
        console.log("[BossScene] Setting colliders (No Orbiters)...");
        // 既存コライダー破棄
        this.safeDestroy(this.ballPaddleCollider, "ballPaddleCollider");
        this.safeDestroy(this.ballBossCollider, "ballBossCollider");
        // this.safeDestroy(this.ballOrbiterCollider, "ballOrbiterCollider"); // 削除
        this.safeDestroy(this.ballAttackBrickCollider, "ballAttackBrickCollider",
        "paddlePowerUpOverlap"); // ★ 追加
        this.safeDestroy(this.paddleAttackBrickCollider, "paddleAttackBrickCollider"); // 既存参照を破棄
        this.safeDestroy(this.ballAttackBrickCollider, "ballAttackBrickCollider");
        this.safeDestroy(this.ballAttackBrickOverlap, "ballAttackBrickOverlap"); // ★ Overlap参照も破棄
        


        
// ▼▼▼ パドル vs 攻撃ブロックの衝突判定を追加 ▼▼▼
if (this.paddle && this.attackBricks) {
    this.paddleAttackBrickCollider = this.physics.add.collider(
        this.paddle,
        this.attackBricks,
        this.handlePaddleHitByAttackBrick, // 衝突時のコールバック
        null, // processCallback は不要
        this
    );
    console.log("[Colliders] Paddle-AttackBrick collider added.");
} else { console.warn("Cannot set Paddle-AttackBrick collider."); }
// ▲▲▲ パドル vs 攻撃ブロックの衝突判定を追加 ▲▲▲


        // ボール vs パドル
        if (this.paddle && this.balls) { this.ballPaddleCollider = this.physics.add.collider(this.paddle, this.balls, this.hitPaddle, null, this); }
        else { console.warn("Cannot set Ball-Paddle collider."); }

        // ボール vs ボス本体
        if (this.boss && this.balls) { this.ballBossCollider = this.physics.add.collider(this.boss, this.balls, this.hitBoss, (boss, ball) => !boss.getData('isInvulnerable'), this); }
        else { console.warn("Cannot set Ball-Boss collider."); }

        this.safeDestroy(this.makiraBeamBossOverlap, "makiraBeamBossOverlap"); // 参照追加

         // ★ マキラビーム vs ボス (fireMakiraBeam内でoverlap設定するなら不要かも？)
         // if (this.makiraBeams && this.boss) {
         //     this.makiraBeamBossOverlap = this.physics.add.overlap(this.makiraBeams, this.boss, this.hitBossWithMakiraBeam, (beam, boss) => !boss.getData('isInvulnerable'), this);
         // }

         // ★ (オプション) マキラビーム vs 攻撃ブロック の判定も追加？

        // --- ▼ ボール vs 攻撃ブロック (インダラ状態を考慮) ▼ ---
        let needsCollider = false;
        let needsOverlap = false;
        this.balls?.getMatching('active', true).forEach(ball => {
            if (ball.getData('isIndaraActive')) {
                needsOverlap = true; // インダラボールがあればOverlapが必要
            } else {
                needsCollider = true; // 通常ボールがあればColliderが必要
            }
        });

        if (needsCollider) {
            this.ballAttackBrickCollider = this.physics.add.collider(
                this.attackBricks,
                this.balls,
                this.hitAttackBrick,
                (brick, ball) => !ball.getData('isIndaraActive') && !ball.getData('isBikaraPenetrating'),
                this
            );
            console.log("[Colliders] Ball-AttackBrick Collider added (for non-Indara).");
        }
        if (needsOverlap) {
            this.ballAttackBrickOverlap = this.physics.add.overlap(
                this.attackBricks,
                this.balls,
                this.handleBallAttackBrickOverlap, // ★ Overlap用コールバック
                (brick, ball) => ball.getData('isIndaraActive') || ball.getData('isBikaraPenetrating'), // インダラ状態のボールのみ検知
                this
            );
            console.log("[Colliders] Ball-AttackBrick Overlap added (for Indara).");
        }
        // --- ▲ ボール vs 攻撃ブロック ▲ ---

      // ★★★ パドル vs パワーアップアイテム (Overlap) ★★★
    this.safeDestroy(this.paddlePowerUpOverlap, "paddlePowerUpOverlap"); // 既存参照を破棄
    if (this.paddle && this.powerUps) {
        this.paddlePowerUpOverlap = this.physics.add.overlap(
            this.paddle,
            this.powerUps,
            this.collectPowerUp, // ★ アイテム取得処理のコールバック
            null, // processCallback は通常不要
            this // コールバックのコンテキスト
        );
        console.log("[Colliders] Paddle-PowerUp overlap added.");
   } else { console.warn("[Colliders] Cannot set Paddle-PowerUp overlap."); }
    // ★★★ パドル vs パワーアップアイテム (Overlap) ★★★
}
// --- ▲ setColliders メソッド修正 ▲ ---

// ボールが攻撃ブロックとオーバーラップした時の処理 (新規追加)
handleBallAttackBrickOverlap(brick, ball) {
    // この関数は isIndaraActive が true のボールに対してのみ呼ばれるはず
    if (!brick || !brick.active || !ball || !ball.active) return;
       // ★ インダラ または ビカラ貫通 の場合 ★
       if (ball.getData('isIndaraActive') || ball.getData('isBikaraPenetrating')) {
        const powerType = ball.getData('isIndaraActive') ? 'Indara' : 'Bikara';
        console.log(`[${powerType}] Ball piercing attack brick!`);
    }
    // ★ TODO: 貫通エフェクト・SE ★
    // 攻撃ブロックを破壊する (アイテムドロップはしない)
    this.handleAttackBrickDestruction(brick); // ★ 破壊処理メソッド呼び出し (後で作成or既存利用)

    // ボールはそのまま進むので速度変更は不要
}

// 攻撃ブロックの破壊処理メソッド (新規追加 or hitAttackBrickから分離)
    // (アイテムドロップ無し版)
    handleAttackBrickDestruction(brick) {
        if (!brick || !brick.active) return;
        const brickX = brick.x; const brickY = brick.y; const brickColor = brick.tintTopLeft;
        // エフェクト
        try {
            const particles = this.add.particles(0, 0, 'whitePixel', { /* ... エフェクト設定 ... */ });
             if(particles) { particles.setParticleTint(brickColor || 0xcccccc); particles.explode(12); this.time.delayedCall(600, () => { if(particles.scene) particles.destroy();});}
        } catch (e) { console.error("Error creating attack brick destroy effect:", e); }
        // SE
        try { this.sound.add(AUDIO_KEYS.SE_DESTROY).play(); } catch (e) { /*...*/ }
        // 破壊
        brick.destroy();
        // ★ ヴァジラゲージ増加はここで行うか、元のhitAttackBrickに任せるか要検討
        // this.increaseVajraGauge();
    }

    // パドルが攻撃ブロックに当たった時の処理 (新規追加)
    handlePaddleHitByAttackBrick(paddle, attackBrick) {
        if (!paddle || !attackBrick || !paddle.active || !attackBrick.active) return;
        console.log("Paddle hit by attack brick!");

        // ★ TODO: 攻撃ブロックヒットエフェクト・SE ★
        attackBrick.destroy(); // 攻撃ブロックは消える

        // ▼▼▼ アニラ無敵判定 ▼▼▼
        if (this.isAnilaActive) {
            console.log("[Anila] Paddle hit blocked by Anila effect!");
            // 無敵中はライフ減少なし
             // ★ TODO: 無敵ヒットエフェクト ★
        } else {
            // 通常時：ライフ減少処理
            console.log("Paddle hit, should lose life (but commented out for now).");
            // --- ▼▼▼ ライフ減少処理 (将来的に有効化) ▼▼▼ ---
            
            if (!this.isGameOver && !this.bossDefeated) { // ゲームオーバー/クリア前か確認
                console.log("Losing life due to paddle hit.");
                this.loseLife();
            }
            
            // --- ▲▲▲ ライフ減少処理 (将来的に有効化) ▲▲▲ ---
        }
        // ▲▲▲ アニラ無敵判定 ▲▲▲
    }
    // BossScene.js 内

    // --- ▼ hitPaddle メソッド (速度計算修正) ▼ ---
    hitPaddle(paddle, ball) {
        if (!paddle || !ball || !ball.active || !ball.body) return;
        console.log("[BossScene] Ball hit paddle.");

        // --- 反射角度計算 ---
        let diff = ball.x - paddle.x;
        const maxDiff = paddle.displayWidth / 2;
        let influence = diff / maxDiff;
        influence = Phaser.Math.Clamp(influence, -1, 1);
        const maxVx = NORMAL_BALL_SPEED * 0.8; // X方向の最大速度成分
        let newVx = maxVx * influence;
        const minVy = NORMAL_BALL_SPEED * 0.5; // Y方向の最低速度
        let currentVy = ball.body.velocity.y;
        let newVy = -Math.abs(currentVy); // 必ず上向きに
        if (Math.abs(newVy) < minVy) newVy = -minVy; // 最低速度保証

        // --- ▼ 速度設定 (パワーアップ考慮) ▼ ---
        let speedMultiplier = 1.0; // 通常速度倍率
        const isFast = ball.getData('isFast') === true; // シャトラ状態か (明確にtrueか比較)
        const isSlow = ball.getData('isSlow') === true; // ハイラ状態か (明確にtrueか比較)

        if (isFast) {
            speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA];
            console.log("[hitPaddle] Shatora active, applying speed multiplier:", speedMultiplier);
        } else if (isSlow) {
            speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA];
            console.log("[hitPaddle] Haila active, applying speed multiplier:", speedMultiplier);
        } else {
            console.log("[hitPaddle] Normal speed.");
        }
        const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier; // ★ 目標速度を計算

        const newVelocity = new Phaser.Math.Vector2(newVx, newVy);
        if (newVelocity.lengthSq() === 0) { newVelocity.set(0, -1); } // ゼロベクトル回避
        newVelocity.normalize().scale(targetSpeed); // ★ 計算した目標速度で設定

        console.log(`[hitPaddle] Setting velocity to (${newVelocity.x.toFixed(2)}, ${newVelocity.y.toFixed(2)}) with targetSpeed ${targetSpeed.toFixed(0)}`);
        ball.setVelocity(newVelocity.x, newVelocity.y);
        // --- ▲ 速度設定 (パワーアップ考慮) ▲ ---


        // --- SE再生 ---
        try { this.sound.add(AUDIO_KEYS.SE_REFLECT).play(); } catch (e) { console.error("Error playing SE_REFLECT (paddle):", e); }

        // --- パドルヒットエフェクト ---
        try {
            const impactPointY = ball.y + BALL_RADIUS * 0.8;
            const impactPointX = ball.x;
            const particles = this.add.particles(0, 0, 'whitePixel', { x: impactPointX, y: impactPointY, lifespan: 150, speed: { min: 100, max: 200 }, angle: { min: 240, max: 300 }, gravityY: 300, scale: { start: 0.4, end: 0 }, quantity: 5, blendMode: 'ADD', emitting: false });
            if(particles) { particles.setParticleTint(0xffffcc); particles.explode(5); this.time.delayedCall(200, () => { if (particles && particles.scene) particles.destroy(); }); }
        } catch (e) { console.error("Error creating paddle hit particle effect:", e); }

        // ★ パドルヒットで解除される効果があればここで処理 ★
        // 例: if (ball.getData('isIndaraActive')) { this.deactivateIndaraForBall(ball); }
    }
    // --- ▲ hitPaddle メソッド ▲ ---


    // --- ▼ hitBoss メソッド (ボール跳ね返し処理追加) ▼ ---
    hitBoss(boss, ball) {
        if (!boss || !ball || !boss.active || !ball.active || boss.getData('isInvulnerable')) return;
        console.log("[hitBoss] Boss hit by ball.");
        // ★★★ 衝突時のボールデータをログ出力 ★★★
        console.log('[hitBoss] Ball data at impact:', ball.data?.getAll());

        let damage = 1;
        const lastPower = ball.getData('lastActivatedPower');
        const isBikara = lastPower === POWERUP_TYPES.BIKARA;
        const bikaraState = ball.getData('bikaraState');
        const isKubiraActive = ball.getData('isKubiraActive') === true;
        console.log('[hitBoss] Checking isKubiraActive:', isKubiraActive); // ★ isKubiraActive の値確認
        const isIndara = ball.getData('isIndaraActive') === true; // ★ インダラ状態か取得

        // ダメージ適用
        console.log(`[hitBoss] Final calculated damage before applying: ${damage}`);
        this.applyBossDamage(boss, damage, "Ball Hit");

        // ▼▼▼ インダラ解除処理 ▼▼▼
        if (isIndara) {
            console.log("[Indara] Ball hit boss, deactivating Indara.");
            this.deactivateIndara(ball); // インダラ状態を解除
            this.setColliders(); // 衝突判定を Collider に戻す
            this.updateBallAndPaddleAppearance(); // アイコンを戻す
        }
        // ▲▲▲ インダラ解除処理 ▲▲▲


        // --- ▼ ダメージ計算ロジック (省略なし) ▼ ---
        if (isBikara && bikaraState === 'yang') {
            // ビカラ陽が最優先で基本ダメージ2
            damage = 2;
            if (isKubiraActive) {
                damage += 1; // クビラ重複なら+1で計3
                console.log("[hitBoss] Bikara Yang + Kubira hit! Calculated Damage: 3");
            } else {
                console.log("[hitBoss] Bikara Yang hit! Calculated Damage: 2");
            }
        } else if (isKubiraActive) {
            // 次にクビラをチェック、基本ダメージ1に+1して2にする
            damage += 1;
            console.log("[hitBoss] Kubira hit! Calculated Damage: 2");
        } else if (isBikara && bikaraState === 'yin') {
             // 次にビカラ陰、基本ダメージ1のまま
             console.log("[hitBoss] Bikara Yin hit. Calculated Damage: 1");
        } else {
            // それ以外（通常ヒット）も基本ダメージ1
            console.log(`[hitBoss] Normal hit. Calculated Damage: ${damage}`); // damage は初期値 1
        }
        // --- ▲ ダメージ計算ロジック (省略なし) ▲ ---

        console.log(`[hitBoss] Final calculated damage before applying: ${damage}`); // ★適用直前の最終ダメージ確認ログ
        this.applyBossDamage(boss, damage, "Ball Hit"); // 計算されたダメージを適用
        // --- ▼ ボール跳ね返し処理 (パワーアップ考慮) ▼ ---
        if (ball && ball.active && ball.body) { // ボールがまだ有効か確認
             console.log("[hitBoss] Calculating ball reflection velocity...");
             let speedMultiplier = 1.0;
             const isFast = ball.getData('isFast') === true; // isFast状態取得
             const isSlow = ball.getData('isSlow') === true; // isSlow状態取得
             if (isFast) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA];
             else if (isSlow) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA];
             const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier;

             // 跳ね返る方向 (単純にY方向反転)
             let bounceVx = ball.body.velocity.x;
             let bounceVy = -ball.body.velocity.y; // Y速度を反転
             // 最低速度保証 (跳ね返りが弱すぎないように)
             const minBounceSpeedY = NORMAL_BALL_SPEED * 0.3;
             if(Math.abs(bounceVy) < minBounceSpeedY) {
                 bounceVy = -minBounceSpeedY * Math.sign(bounceVy || -1); // 方向を維持しつつ最低速度に
             }

             const bounceVel = new Phaser.Math.Vector2(bounceVx, bounceVy).normalize().scale(targetSpeed);
             console.log(`[hitBoss] Reflecting ball with velocity (${bounceVel.x.toFixed(2)}, ${bounceVel.y.toFixed(2)}) targetSpeed: ${targetSpeed.toFixed(0)}`);
             ball.setVelocity(bounceVel.x, bounceVel.y);
         }
        // --- ▲ ボール跳ね返し処理 ▲ ---

        // 体力ゼロ判定は applyBossDamage 内で行われる
    }
    // --- ▲ hitBoss メソッド ▲ ---


    // --- ▼ applyBossDamage メソッド (変更なし) ▼ ---
    applyBossDamage(boss, damage, source = "Unknown") {
        if (!boss || !boss.active || boss.getData('isInvulnerable')) {
             console.log(`Damage (${damage} from ${source}) blocked: Boss inactive or invulnerable.`);
             return;
        }
        let currentHealth = boss.getData('health') - damage;
        boss.setData('health', currentHealth);
        console.log(`[Boss Damage] ${damage} damage dealt by ${source}. Boss health: ${currentHealth}/${boss.getData('maxHealth')}`);

         // ▼▼▼ ダメージボイス再生 (スロットリング付き) ▼▼▼
         const now = this.time.now;
         if (now - this.lastDamageVoiceTime > BOSS_DAMAGE_VOICE_THROTTLE) {
             try {
                  this.sound.play('voice_boss_damage'); // ★ ダメージボイスキーを指定
                 console.log("[Damage Voice] Playing damage voice.");
                 this.lastDamageVoiceTime = now; // 最後に再生した時間を記録
             } catch (e) { console.error("Error playing damage voice:", e); }
         } else { console.log("[Damage Voice] Throttled."); }
         // ▲▲▲ ダメージボイス再生 ▲▲▲
        // ダメージリアクション (Tint, 無敵, 揺れ)
        boss.setTint(0xff0000);
        boss.setData('isInvulnerable', true);
        const shakeDuration = 60;
        const shakeAmount = boss.displayWidth * 0.03;
        try {
            this.tweens.add({ targets: boss, props: { x: { value: `+=${shakeAmount}`, duration: shakeDuration / 4, yoyo: true, ease: 'Sine.InOut' } }, repeat: 1 });
        } catch (e) { console.error("[applyBossDamage] Error creating shake tween:", e); }
        // try { this.sound.add('seBossHit').play(); } catch(e) {}
        this.time.delayedCall(300, () => { if (boss.active) { boss.clearTint(); boss.setData('isInvulnerable', false); } });
        
        // 体力ゼロ判定
        if (currentHealth <= 0) { this.defeatBoss(boss); }
    }
    // --- ▲ applyBossDamage メソッド ▲ ---
    // --- ▼ 攻撃ブロック衝突処理メソッド (実装) ▼ ---
    hitAttackBrick(brick, ball) {
        if (!brick || !brick.active || !ball || !ball.active) return;
         // ★★★ chaosSettings の値をログに出力 ★★★
    console.log(`[hitAttackBrick] Current chaosSettings.count: ${this.chaosSettings?.count}`);
    // ★★★ chaosSettings の値をログに出力 ★★★

       // console.log("Attack brick hit by ball!");

        const brickX = brick.x;
        const brickY = brick.y;
        const brickColor = brick.tintTopLeft; // Tintから色を取得 (whitePixelの場合)

        // --- 破壊エフェクト (GameScene流用) ---
        try {
            const particles = this.add.particles(0, 0, 'whitePixel', {
                frame: 0, x: brickX, y: brickY, lifespan: 500, speed: { min: 80, max: 150 },
                angle: { min: 0, max: 360 }, gravityY: 100, scale: { start: 0.7, end: 0 },
                quantity: 12, blendMode: 'NORMAL', emitting: false
            });
           if(particles) { particles.setParticleTint(brickColor || 0xcccccc); particles.explode(12); this.time.delayedCall(600, () => { if(particles.scene) particles.destroy();});}
        } catch (e) { console.error("Error creating attack brick destroy effect:", e); }

        // --- 破壊SE (GameScene流用) ---
        try {
            this.sound.add(AUDIO_KEYS.SE_DESTROY).play();
             console.log("SE_DESTROY playback attempted for attack brick.");
        } catch (e) { console.error("Error playing SE_DESTROY:", e); }

        // --- ブロックを破壊 ---
        brick.destroy(); // destroy() はグループからも削除する

        // ★★★ ヴァジラゲージ増加処理を追加 ★★★
        this.increaseVajraGauge(); // 攻撃ブロック破壊でゲージ増加

        // --- ▼ アイテムドロップ判定 (ドロップ率を chaosSettings から取得) ▼ ---
        // ★ 固定値ではなく this.chaosSettings.rate を使う ★
        const dropRate = this.chaosSettings?.rate ?? ATTACK_BRICK_ITEM_DROP_RATE; // 安全に取得 (なければ定数をフォールバック)
        console.log(`[Drop Logic] Checking drop against rate: ${dropRate.toFixed(2)}`); // 現在のレートをログ表示

        if (Phaser.Math.FloatBetween(0, 1) < dropRate) { // ★ dropRate で判定

            if (this.bossDropPool && this.bossDropPool.length > 0) {
                const dropType = Phaser.Utils.Array.GetRandom(this.bossDropPool);
                console.log(`[Drop Logic] Dropping item: ${dropType} (From fixed pool: [${this.bossDropPool.join(',')}])`);
                this.dropSpecificPowerUp(brick.x, brick.y, dropType);
            } else {
                 console.log("No items in boss drop pool.");
            }
        } else {
             console.log("[Drop Logic] No item drop based on rate."); // ドロップしなかった場合のログ
        }
        // --- ▲ アイテムドロップ判定 (ドロップ率を chaosSettings から取得) ▲ ---
    }
    // --- ▲ hitAttackBrick メソッド修正 ▲ ---


    // --- ▼ アイテムドロップメソッド (GameSceneから移植・修正) ▼ ---
 /*   dropSpecificPowerUp(x, y, type) {
        if (!type) { console.warn("Attempted to drop powerup with no type."); return; }
        if (!this.powerUps) { console.error("PowerUps group does not exist!"); return; } // グループ確認

        let textureKey = POWERUP_ICON_KEYS[type] || 'whitePixel';
        let displaySize = POWERUP_SIZE;
        let tintColor = null;
        if (textureKey === 'whitePixel') { tintColor = (type === POWERUP_TYPES.BAISRAVA) ? 0xffd700 : 0xcccccc; } // BAISRAVA特別対応

        console.log(`[BossScene] Dropping power up ${type} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
        try {
            const powerUp = this.powerUps.create(x, y, textureKey);
            if (powerUp) {
                powerUp.setDisplaySize(displaySize, displaySize).setData('type', type);
                if (tintColor !== null) { powerUp.setTint(tintColor); }
                else { powerUp.clearTint(); }
                if (powerUp.body) {
                    powerUp.setVelocity(0, POWERUP_SPEED_Y);
                    powerUp.body.setCollideWorldBounds(false);
                    powerUp.body.setAllowGravity(false);
                } else { powerUp.destroy(); console.error("No body for powerup!"); }
            } else { console.error("Failed to create powerup object!"); }
        } catch (e) { console.error("CRITICAL Error in dropSpecificPowerUp:", e); }
    }
    // --- ▲ アイテムドロップメソッド ▲ ---


    // --- ▼ アイテム取得メソッド (GameSceneから移植・ボス戦用に調整) ▼ ---
    collectPowerUp(paddle, powerUp) {
        if (!powerUp || !powerUp.active || this.isGameOver || this.bossDefeated) return;
        const type = powerUp.getData('type');
        if (!type) { powerUp.destroy(); return; }

        console.log(`[BossScene] Collected power up: ${type}`);
        powerUp.destroy();

        // ボイス再生 (GameScene流用)
        const voiceKeyBase = `voice_${type}`; const upperCaseKey = voiceKeyBase.toUpperCase();
        let actualAudioKey = AUDIO_KEYS[upperCaseKey]; if (type === POWERUP_TYPES.VAJRA) actualAudioKey = AUDIO_KEYS.VOICE_VAJRA_GET;
        const now = this.time.now; const lastPlayed = this.lastPlayedVoiceTime[upperCaseKey] || 0;
        if (actualAudioKey && (now - lastPlayed > this.voiceThrottleTime)) {
            try { this.sound.play(actualAudioKey); this.lastPlayedVoiceTime[upperCaseKey] = now; }
            catch (e) { console.error(`Error playing voice ${actualAudioKey}:`, e); }
        } else if (!actualAudioKey) {/*console.warn(`Voice key ${upperCaseKey} not found.`);}
        else { console.log(`Voice ${upperCaseKey} throttled.`); }

        // ★★★ ボス戦でのパワーアップ効果 ★★★
        // GameScene の activatePower は複雑すぎるので、ボス戦専用の効果にするか、
        // 必要なものだけを限定的に実装するのがおすすめ。
        // 例：単純な効果のみ有効にする
        switch (type) {
            case POWERUP_TYPES.KUBIRA:
                // ボス戦でクビラ貫通を有効にする？ (ダメージ2になるだけ？)
                // this.activateTemporaryPower(type, 5000); // 例: 5秒間だけ有効化
                console.log("Kubira effect (Boss fight) - currently no effect");
                break;
            case POWERUP_TYPES.SHATORA:
                 // ボス戦でボール加速？
                 // this.activateTemporaryPower(type, 3000);
                 console.log("Shatora effect (Boss fight) - currently no effect");
                 break;
             // 他のパワーアップも同様に、ボス戦での効果を定義・実装
            default:
                console.log(`Power up ${type} collected, no specific effect in boss fight yet.`);
                break;
        }
    }*/
    // ★ (オプション) 一時的なパワーアップ有効化メソッド (もし必要なら)
    // activateTemporaryPower(type, duration) { ... }*/
    // --- ▲ アイテム取得メソッド ▲ ---*/
 
    // ▼▼▼ ボス撃破からゲームクリアまでのメソッド群 ▼▼▼

    /**
     * ボス撃破時のメイン処理
     * 演出を開始し、各種タイマーや動きを停止する
     * @param {Phaser.Physics.Arcade.Image} boss - 撃破されたボスオブジェクト
     */
    defeatBoss(boss) {
        if (this.bossDefeated) return;
        console.log("[defeatBoss] Boss defeated! Starting defeat sequence (Simple Flash)."); // ログ変更
        this.bossDefeated = true;
        this.playerControlEnabled = false;

          // ▼▼▼ ★★★ 撃破の瞬間にサウンド停止 ★★★ ▼▼▼
          console.log("[defeatBoss] Stopping ongoing sounds (BGM will be stopped later).");
          // BGM以外の再生中の音（戦闘中ボイス、ボールの音など）を停止
          this.sound.stopAll();
          // 戦闘中ランダムボイスタイマーも停止
          if (this.randomVoiceTimer) {
              this.randomVoiceTimer.remove();
              this.randomVoiceTimer = null;
              console.log("  - Random voice timer stopped.");
          }
          // ボスBGMは gameComplete で止めるのでここでは止めない (任意)
          // this.stopBgm(); // ← もしここでBGMも止めたければコメント解除
          // ▲▲▲ ★★★ 撃破の瞬間にサウンド停止 ★★★ ▲▲▲

          // defeatBoss 内
this.score += BOSS_SCORE; // BOSS_SCORE は定数 (例: 1500)
console.log(`[defeatBoss] Score added. Current score: ${this.score}`); // ★ 加算後のスコアをログ出力

        // ▼▼▼ 衝突判定削除 (変更なし) ▼▼▼
        console.log("[defeatBoss] Destroying Ball-Boss collider...");
        this.safeDestroy(this.ballBossCollider, "ballBossCollider");
        this.ballBossCollider = null;
        // ... (必要なら他の衝突判定も) ...

        // --- 1. 動きを止める ---
        console.log("[defeatBoss] Stopping movements and timers...");
        if (this.bossMoveTween) this.bossMoveTween.stop();
        if (this.attackBrickTimer) this.attackBrickTimer.remove();
        this.balls?.children.each(ball => ball.body?.stop());
        // this.tweens.pauseAll(); // 必要なら
        // ▼▼▼ disableBody の引数を変更 ▼▼▼
        if (boss && boss.body) {
            // disableBody(disableGameObject, hideGameObject)
            // disableGameObject を false にして、GameObject自体はアクティブなままにする
            boss.disableBody(false, false); // ★ 第1引数を false に！
            console.log("  - Boss physics body disabled (GameObject remains active)."); // ログ変更
       } else { console.warn("[defeatBoss] Could not disable boss body."); }
       // ▲▲▲ disableBody の引数を変更 ▲▲▲

       // ▼▼▼ 撃破ボイス＆フラッシュSE (最初の1回) ▼▼▼
       try {
         this.sound.play('voice_boss_defeat'); // ★ 撃破ボイスキー
        console.log("[Defeat] Defeat Voice should play here.");
    } catch (e) { console.error("Error playing defeat voice:", e); }
    try {
         this.sound.play('se_defeat_flash'); // ★ 撃破フラッシュSEキー (3回分が1つの音源)
        console.log("[Defeat] Defeat Flash SE should play here (once).");
    } catch (e) { console.error("Error playing defeat flash SE:", e); }
    // ▲▲▲ 撃破ボイス＆フラッシュSE ▲▲▲



       // BossScene.js - defeatBoss メソッド内

        // --- 2. 即時ネガ画像化 ---
        const negativeTextureKey = 'bossNegative';
        console.log("[defeatBoss] Setting texture to negative:", negativeTextureKey);
        try {
            if (boss && boss.active) {
                 boss.setTexture(negativeTextureKey);
                 console.log(`   Texture key AFTER setTexture: ${boss.texture.key}`);
            } else { console.warn("Boss inactive, cannot set texture.");}
        } catch (e) { console.error(`!!! Error setting negative texture:`, e); }

        // --- 3. 画面フラッシュ (3回) ---
        console.log("[defeatBoss] Initiating 3 flashes...");
        // SE再生 (try...catch) - 最初のフラッシュと撃破ボイスと同時でOK
        try {
             // this.sound.play('SE_DEFEAT_FLASH'); // ★ フラッシュSEキー (1回だけ再生)
             console.log("[Defeat] Defeat Flash SE should play here (once).");
        } catch (e) { console.error("Error playing defeat flash SE:", e); }
         try {
             // this.sound.play('VOICE_BOSS_DEFEAT'); // ★ 撃破ボイスキー
             console.log("[Defeat] Defeat Voice should play here.");
         } catch (e) { console.error("Error playing defeat voice:", e); }


        const flashColor = [255, 255, 255]; // 白

        // 1回目のフラッシュ
        this.cameras.main.flash(DEFEAT_FLASH_DURATION, ...flashColor);
        console.log("  - Flash 1 initiated.");

        // 2回目のフラッシュを予約
        this.time.delayedCall(DEFEAT_FLASH_INTERVAL, () => {
            if (!this.scene.isActive() || !this.boss || !this.boss.active) return; // シーンやボスが有効かチェック
            console.log("  - Flash 2 initiated.");
            this.cameras.main.flash(DEFEAT_FLASH_DURATION, ...flashColor);

            // 3回目のフラッシュを予約
            this.time.delayedCall(DEFEAT_FLASH_INTERVAL, () => {
                 if (!this.scene.isActive() || !this.boss || !this.boss.active) return;
                 console.log("  - Flash 3 initiated.");
                 this.cameras.main.flash(DEFEAT_FLASH_DURATION, ...flashColor);

                 // 最後のフラッシュが終わったらシェイク＆フェードへ
                 console.log("[Defeat Flash] Flashing complete. Starting shake and fade.");
                 // ★★★ startBossShakeAndFade を呼び出す前にボスが存在するか最終確認 ★★★
                 if (this.boss && this.boss.active){
                      this.startBossShakeAndFade(this.boss);
                 } else {
                      console.warn("!!! Boss became inactive during flashing! Skipping shake/fade.");
                      // この場合、直接 gameComplete に飛ぶか、何もしないか
                      // this.gameComplete(); // 演出スキップしてクリア
                 }
            }, [], this); // 3回目の delayedCall

        }, [], this); // 2回目の delayedCall
        console.log("[defeatBoss] Flash sequence initiated.");
    }

    /**
     * ボスのシェイク＆フェードアウト演出
     * @param {Phaser.Physics.Arcade.Image} boss - 対象のボスオブジェクト
     */
    startBossShakeAndFade(boss) {
        console.log(">>> Entering startBossShakeAndFade <<<");
        // ★★★ 関数入口での boss.active チェック強化 ★★★
        if (!boss || !boss.active) {
             console.warn("!!! startBossShakeAndFade called but boss is already inactive!");
             // 既に非アクティブなら、即 gameComplete に進むべきか？
             // this.gameComplete();
             return;
        }
        console.log("[Shake&Fade] Starting shake and fade animation.");

        // SE再生 (try...catch)
        try {
            // this.sound.play('your_shake_fade_se_key'); // ★ 消滅SE
            console.log("[Shake&Fade] Shake/Fade SE should play here.");
        } catch (e) { console.error("Error playing shake/fade SE:", e); }

        // シェイクTween
        const shakeAmount = boss.displayWidth * 0.05;
        this.tweens.add({
            targets: boss,
            props: {
                 x: { value: `+=${shakeAmount}`, duration: 50, yoyo: true, ease: 'Sine.easeInOut' },
                 y: { value: `+=${shakeAmount/2}`, duration: 60, yoyo: true, ease: 'Sine.easeInOut' }
            },
            // loop: -1, // ループさせてフェードで消す
             repeat: Math.floor(DEFEAT_SHAKE_DURATION / 60), // 時間指定の場合
            onComplete: () => { console.log("[Shake&Fade] Shake tween part completed (or looped)."); } // ループ時は完了しない
        });

        // フェードアウトTween
        this.tweens.add({
            targets: boss,
            alpha: 0,
            duration: DEFEAT_FADE_DURATION,
            ease: 'Linear',
            onCompleteScope: this, // onCompleteのthisをBossSceneに
            // ▼▼▼ onComplete をアロー関数に変更 ▼▼▼
            onComplete: () => { // ★ function() から () => に変更
                // ★ アロー関数内なら this は BossScene を指す ★
                console.log(">>> Fade tween complete. Calling gameComplete NOW. <<<");
                console.log("[Shake&Fade] Fade complete. Destroying boss.");
                // ボスオブジェクトを破棄 (boss 変数はコールバックに引き継がれる)
                if (boss && boss.active) {
                    boss.destroy();
                }
                if(this.boss === boss) this.boss = null;

                // ★ this.gameComplete() を安全に呼び出せる ★
                this.gameComplete();
            }
            // ▲▲▲ onComplete をアロー関数に変更 ▲▲▲
            // onCompleteScope: this, // アロー関数なら Scope 指定は不要
        });
        console.log("[Shake&Fade] Shake and Fade tweens started.");
    }

    /**
     * ゲームクリア処理
     */
    // gameComplete メソッド (テキストとSE変更)
    gameComplete() {
        console.log(">>> Entering gameComplete <<<");
        console.log("[BossScene] Game Complete!");
        // ▼▼▼ ゲームクリアSE (通常ステージと同じキーを想定) ▼▼▼
        try {
            this.sound.play(AUDIO_KEYS.SE_STAGE_CLEAR);
            console.log("[Game Complete] Play SE_STAGE_CLEAR.");
        } catch(e) { console.error("Error playing SE_STAGE_CLEAR:", e); }
        // ▲▲▲ ゲームクリアSE ▲▲▲
        this.stopBgm();

        // スコアUI更新 (defeatBoss内で加算済みのはず)
        if (this.uiScene?.scene.isActive()) {
             this.uiScene.events.emit('updateScore', this.score);
             console.log("[Game Complete] Final score updated on UI.");
        } else { console.warn("[Game Complete] UIScene not active, cannot update score."); }

        // ゲームクリア表示 (例)
        this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 50, 'GAME CLEAR!', { fontSize: '60px', fill: '#ff0', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(1100); // 最前面に
        this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 20, `スコア: ${this.score}`, { fontSize: '40px', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(1100);
        this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 80, 'タップでタイトルに戻る', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setDepth(1100);

        // タップでタイトルに戻る
        console.log("[Game Complete] Setting up input listener for returning to title.");
        this.input.once('pointerdown', this.returnToTitle, this);
    }

    // ▲▲▲ ボス撃破からゲームクリアまでのメソッド群 ▲▲▲


    // --- ▼ ゲーム進行メソッド (省略なし) ▼ ---
    loseLife() {
        if (this.isGameOver || this.bossDefeated) return;
        console.log(`[BossScene] Losing life. Lives remaining: ${this.lives - 1}`);

        // ★★★ ライフ減少時にマキラ効果を停止 ★★★
        this.deactivateMakira();
        // ★★★ ライフ減少時にマキラ効果を停止 ★★★

        // ★★★ 他の持続系パワーアップも停止する方が自然 ★★★
        // (ボールがリセットされるため効果もリセットするのが一般的)
        Object.values(this.powerUpTimers).forEach(timer => timer?.remove());
        this.powerUpTimers = {};
        // ボールの状態もリセット (activateTemporaryEffect で管理している場合)
        this.balls?.getChildren().forEach(ball => {
             if(ball?.active) {
                 ball.setData('activePowers', new Set()); // 全パワー解除
                 ball.setData('lastActivatedPower', null);
                 ball.setData('isKubiraActive', false);
                 ball.setData('isFast', false);
                 ball.setData('isSlow', false);
                 // 他のフラグもリセット
             }
        });
        this.updateBallAndPaddleAppearance(); // 見た目もリセット
        // ★★★ 他の持続系パワーアップも停止 ★★★


        this.lives--;
        if (this.uiScene && this.uiScene.scene.isActive()) {
            this.uiScene.events.emit('updateLives', this.lives);
        }
        this.isBallLaunched = false;
        if (this.balls) { this.balls.clear(true, true); } // 古いボールクリア
        // ▼▼▼ UI更新イベントを発行 ▼▼▼
        this.events.emit('updateLives', this.lives);
        // ▲▲▲ UI更新イベントを発行 ▲▲▲
        // ...
        if (this.lives > 0) {
             this.time.delayedCall(500, this.resetForNewLife, [], this);
        } else {
            console.log("[BossScene] Game Over condition met.");
            try { this.sound.add(AUDIO_KEYS.SE_GAME_OVER).play(); } catch(e) { /*...*/ }
            this.stopBgm();
            this.time.delayedCall(500, this.gameOver, [], this);
        }
    }
    resetForNewLife() {
        if (this.isGameOver || this.bossDefeated) return;
        console.log("[BossScene] Resetting for new life...");
        if (this.paddle && this.paddle.active) {
             this.createAndAddBall(this.paddle.x, this.paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS);
        } else {
             this.createAndAddBall(this.scale.width / 2, this.scale.height - PADDLE_Y_OFFSET - PADDLE_HEIGHT/2 - BALL_RADIUS);
        }
        this.isBallLaunched = false;
    }

    gameOver() {
        if (this.isGameOver) return;
        console.log("[BossScene] Executing gameOver sequence.");
        this.isGameOver = true;
        if (this.gameOverText) this.gameOverText.setVisible(true);
        try { if (this.physics.world.running) this.physics.pause(); } catch(e) { console.error("Error pausing physics:", e); }
        if (this.balls) { this.balls.children.each(ball => { if(ball.active) ball.setVelocity(0,0).setActive(false); }); }
    }

    /*gameComplete() {
        console.log("[BossScene] Game Complete!");
        try { this.sound.add(AUDIO_KEYS.SE_STAGE_CLEAR).play(); } catch(e) { console.error("Error playing SE_STAGE_CLEAR:", e); }
        this.stopBgm();
        alert(`ゲームクリア！ スコア: ${this.score}`);
        this.returnToTitle();
    }*/

    returnToTitle() {
         console.log("[BossScene] Attempting to reload page...");
         this.stopBgm();
         window.location.reload();
    }

    // --- ▼ BGMメソッド (省略なし) ▼ ---
    playBossBgm() {
        this.stopBgm();
        const bossBgmKey = AUDIO_KEYS.BGM2; // 後半用BGMキーを使用
        console.log(`Playing Boss BGM (Using ${bossBgmKey})`);
        this.currentBgm = this.sound.add(bossBgmKey, { loop: true, volume: 0.5 });
        try {
            this.currentBgm.play();
        } catch (e) {
            console.error("Error playing boss BGM:", e);
        }
    }

    stopBgm() {
        if (this.currentBgm) {
            console.log("Stopping Boss BGM");
            try {
                 this.currentBgm.stop();
                 this.sound.remove(this.currentBgm);
            } catch (e) {
                 console.error("Error stopping BGM:", e);
            }
            this.currentBgm = null;
        }
    }

    // BossScene.js 内に追加
testLogFunction(message) {
    console.log(">>> Entering testLogFunction. Message:", message);
    console.log("<<< Exiting testLogFunction.");
}

    // --- ▼ ユーティリティメソッド (省略なし) ▼ ---
    updatePaddleSize() {
        if (!this.paddle) return;
        const newWidth = this.scale.width * this.paddle.getData('originalWidthRatio');
        this.paddle.setDisplaySize(newWidth, PADDLE_HEIGHT);
        this.paddle.refreshBody();
        const halfWidth = this.paddle.displayWidth / 2;
        this.paddle.x = Phaser.Math.Clamp(this.paddle.x, halfWidth, this.scale.width - halfWidth);
    }

    // handleResize メソッドを修正 (または新規追加)
    handleResize(gameSize) {
        console.log("BossScene resized.");
        this.gameWidth = gameSize.width;
        this.gameHeight = gameSize.height;
        this.updatePaddleSize();
        if (this.boss) { this.updateBossSize(); }

        // ▼▼▼ UIScene にリサイズを通知 ▼▼▼
        if (this.scene.isActive('UIScene')) {
            // 'gameResize' というイベント名で通知 (UIScene側と合わせる)
            this.events.emit('gameResize');
            console.log("Emitted gameResize event for UIScene from BossScene.");
        }
        // ▲▲▲ UIScene にリサイズを通知 ▲▲▲
    }


    updateBossSize() {
        if (!this.boss || !this.boss.texture || !this.boss.texture.source[0]) return;
        const texture = this.boss.texture;
        const originalWidth = texture.source[0].width;
        const originalHeight = texture.source[0].height;
        const targetWidthRatio = 0.20;
        const targetBossWidth = this.scale.width * targetWidthRatio;
        let desiredScale = targetBossWidth / originalWidth;
        desiredScale = Phaser.Math.Clamp(desiredScale, 0.1, 1.0);
        this.boss.setScale(desiredScale);
        // 当たり判定調整
        const hitboxWidth = originalWidth * desiredScale;
        const blockWidth = this.scale.width * BRICK_WIDTH_RATIO;
        const hitboxHeight = blockWidth * 8;
        this.boss.body.setSize(hitboxWidth, hitboxHeight);
        console.log(`Boss size updated. Scale: ${desiredScale.toFixed(2)}, Hitbox: ${hitboxWidth.toFixed(0)}x${hitboxHeight.toFixed(0)}`);
    }

    
    createAndAddBall(x, y, vx = 0, vy = 0, data = null) { // data引数があることを確認
        console.log(`Creating ball at (${x}, ${y}) with initial data:`, data); // データログ追加
        if (!this.balls) { console.error("Balls group missing!"); return null; }
        const ball = this.balls.create(x, y, 'ball_image')
            .setOrigin(0.5, 0.5)
            .setDisplaySize(BALL_RADIUS * 2, BALL_RADIUS * 2)
            .setCircle(PHYSICS_BALL_RADIUS)
            .setCollideWorldBounds(true)
            .setBounce(1);
        if (ball.body) {
            ball.setVelocity(vx, vy);
            ball.body.onWorldBounds = true;
            console.log("Ball body enabled:", ball.body.enable);
        } else { console.error("Failed to create ball body!"); if(ball) ball.destroy(); return null; }
        // ▼▼▼ データ設定 (アンチラ対応強化) ▼▼▼
        ball.setData({
            activePowers: data?.activePowers ? new Set(data.activePowers) : new Set(), // 他の効果を引き継ぐ
            lastActivatedPower: data?.lastActivatedPower ?? null, // 直前の効果を引き継ぐ
            // 各種フラグを引き継ぐ
            isKubiraActive: data?.isKubiraActive ?? false,
            isFast: data?.isFast ?? false,
            isSlow: data?.isSlow ?? false,
            isIndaraActive: data?.isIndaraActive ?? false,
            isBikaraPenetrating: data?.isBikaraPenetrating ?? false,
            isSindaraActive: false, // 分裂元がシンダラでも新規ボールはシンダラではない
            isAnchiraActive: false, // この時点ではまだアンチラではない (後で設定)
        });
        // ▲▲▲ データ設定 ▲▲
     //   this.updateBallAppearance(ball);
        console.log("Ball created successfully.");
        return ball;
    }

    handlePointerMove(pointer) {
        if (this.playerControlEnabled && !this.isGameOver && this.paddle && this.paddle.active) {
            const targetX = pointer.x;
            const halfWidth = this.paddle.displayWidth / 2;
            const clampedX = Phaser.Math.Clamp(targetX, halfWidth, this.scale.width - halfWidth);
            this.paddle.x = clampedX;
            if (!this.isBallLaunched && this.balls && this.balls.active) {
                 this.balls.getChildren().forEach(ball => {
                     if (ball.active) ball.x = clampedX;
                 });
            }
        }
    }

    handlePointerDown() {
        console.log("BossScene Pointer down event detected.");
        if (this.isGameOver && this.gameOverText?.visible) {
            console.log("Game Over detected, reloading page...");
            this.returnToTitle();
        } else if (this.playerControlEnabled && this.lives > 0 && !this.isBallLaunched) {
            this.launchBall();
        } else {
             console.log("Pointer down ignored in BossScene.");
        }
    }

    launchBall() {
        console.log("Attempting to launch ball in BossScene.");
        if (!this.isBallLaunched && this.balls) {
            const firstBall = this.balls.getFirstAlive();
            if (firstBall) {
                console.log("Launching ball!");
                const initialVelocityX = Phaser.Math.Between(BALL_INITIAL_VELOCITY_X_RANGE[0], BALL_INITIAL_VELOCITY_X_RANGE[1]);
                const initialVelocityY = BALL_INITIAL_VELOCITY_Y !== 0 ? BALL_INITIAL_VELOCITY_Y : -350;
                firstBall.setVelocity(initialVelocityX, initialVelocityY);
                this.isBallLaunched = true;
                try { this.sound.add(AUDIO_KEYS.SE_LAUNCH).play(); } catch (error) { console.error("Error playing SE_LAUNCH:", error); }
            } else { console.log("No active ball found to launch."); }
        } else { console.log("Cannot launch ball."); }
    }

    handleWorldBounds(body, up, down, left, right) {
        const gameObject = body.gameObject;
        if (!gameObject || !(gameObject instanceof Phaser.Physics.Arcade.Image) || !this.balls?.contains(gameObject) || !gameObject.active) {
            return;
        }
        const ball = gameObject;

        if (up || left || right) {
            // 壁ヒットエフェクト
            try {
                let impactPointX = ball.x; let impactPointY = ball.y; let angleMin = 0, angleMax = 0;
                if (up) { impactPointY = ball.body.y; angleMin = 60; angleMax = 120; }
                else if (left) { impactPointX = ball.body.x; angleMin = -30; angleMax = 30; }
                else if (right) { impactPointX = ball.body.x + ball.body.width; angleMin = 150; angleMax = 210; }
                const particles = this.add.particles(0, 0, 'whitePixel', { x: impactPointX, y: impactPointY, lifespan: 150, speed: { min: 100, max: 200 }, angle: { min: angleMin, max: angleMax }, gravityY: 100, scale: { start: 0.4, end: 0 }, quantity: 4, blendMode: 'ADD', emitting: false });
                if(particles) { particles.setParticleTint(0xffffff); particles.explode(4); this.time.delayedCall(200, () => { if (particles && particles.scene) particles.destroy(); });}
            } catch (e) { console.error("Error creating wall hit particle effect:", e); }
        }
    }

    // --- ▼ クリーンアップ (省略なし) ▼ ---
    shutdownScene() {
        console.log("BossScene shutdown initiated.");
        this.stopBgm();
        if (this.bossMoveTween) { this.bossMoveTween.stop(); this.bossMoveTween = null; console.log("[Shutdown] Boss movement tween stopped."); }
        // イベントリスナー解除
        console.log("[Shutdown] Removing event listeners...");
        try {
            if (this.scale) this.scale.off('resize', this.handleResize, this);
            if (this.physics.world) this.physics.world.off('worldbounds', this.handleWorldBounds, this);
            if (this.input) this.input.removeAllListeners();
            this.events.removeAllListeners();
             console.log("[Shutdown] Event listeners removed.");
        } catch (e) { console.error("[Shutdown] Error removing event listeners:", e); }
        // ★ 攻撃ブロックタイマーも停止
        if (this.attackBrickTimer) {
            this.attackBrickTimer.remove();
            this.attackBrickTimer = null;
        
            console.log("[Shutdown] Attack brick timer removed.");
        }
        // オブジェクト破棄
        console.log("[Shutdown] Destroying GameObjects...");
        this.safeDestroy(this.paddle, "paddle");
        this.safeDestroy(this.balls, "balls group", true);
        this.safeDestroy(this.boss, "boss");
        // this.safeDestroy(this.orbiters, "orbiters group", true); // 削除
        this.safeDestroy(this.attackBricks, "attackBricks group", true);
        this.safeDestroy(this.gameOverText, "gameOverText");
        console.log("[Shutdown] Finished destroying GameObjects.");
        this.safeDestroy(this.bossAfterImageEmitter, "bossAfterImageEmitter"); // ★ エミッタも破棄
        this.isVajraSystemActive = false; // ★ フラグクリア
        this.vajraGauge = 0;              // ★ ゲージクリア
        // ...
        this.safeDestroy(this.powerUps, "powerUps group", true); // ★ powerUps も破棄
        if (this.attackBrickTimer) { this.attackBrickTimer.remove(); this.attackBrickTimer = null; }
        
        this.powerUps = null; // ★ 参照クリア
        this.paddlePowerUpOverlap = null; // ★ 参照クリア
        this.safeDestroy(this.ballAttackBrickOverlap, "ballAttackBrickOverlap"); // ★ Overlap参照クリア
        this.ballAttackBrickOverlap = null;
        console.log("[Shutdown] Indara overlap cleared.");
        console.log("[Shutdown] Clearing Sindara state (just in case)...");
        // deactivateSindara(); // シーン終了時はボールごと消えるので通常は不要
        console.log("[Shutdown] Sindara state cleared.");
        if (this.anchiraTimer) { this.anchiraTimer.remove(); this.anchiraTimer = null; } // ★ タイマークリア
        console.log("[Shutdown] Anchira timer cleared.");
        if (this.makiraAttackTimer) { this.makiraAttackTimer.remove(); this.makiraAttackTimer = null; }
        this.safeDestroy(this.familiars, "familiars group", true);
        this.safeDestroy(this.makiraBeams, "makiraBeams group", true);
        console.log("[Shutdown] Clearing Bikara timers...");
        Object.values(this.bikaraTimers).forEach(timer => timer?.remove());
        this.bikaraTimers = {};
        console.log("[Shutdown] Bikara state cleared."); // メッセージはそのまま
        this.familiars = null; this.makiraBeams = null; this.makiraAttackTimer = null;
        this.safeDestroy(this.makiraBeamBossOverlap, "makiraBeamBossOverlap"); this.makiraBeamBossOverlap = null;
        this.bossAfterImageEmitter = null; // 参照クリア
        console.log("[Shutdown] Clearing defeat sequence elements...");
        // flashEvent など、addEventで生成したタイマーがあればここでremoveする (今回はdefeatBoss内で完結)
        this.tweens.killTweensOf(this.boss); // ボス関連のTweenを確実に停止・削除
        console.log("[Shutdown] Defeat sequence elements cleared.");
        this.paddle = null; this.balls = null; this.boss = null; /*this.orbiters = null;*/ this.attackBricks = null; this.gameOverText = null;
        this.uiScene = null; this.ballPaddleCollider = null; this.ballBossCollider = null; /*this.ballOrbiterCollider = null;*/ this.ballAttackBrickCollider = null;
        console.log("BossScene shutdown complete.");
        this.isAnilaActive = false; // ★ フラグクリア
        if (this.anilaTimer) { this.anilaTimer.remove(); this.anilaTimer = null; } // ★ タイマークリア
        this.paddleAttackBrickCollider = null; // ★ コライダー参照クリア
        console.log("[Shutdown] Anila state cleared.");
        if (this.randomVoiceTimer) { // ★ ランダムボイスタイマー解除
            this.randomVoiceTimer.remove();
            this.randomVoiceTimer = null;
            console.log("[Shutdown] Random voice timer removed.");
       }
    }

    safeDestroy(obj, name, destroyChildren = false) {
        if (obj && obj.scene) { // Check if it exists and belongs to a scene
            console.log(`[Shutdown] Attempting to destroy ${name}...`);
            try {
                obj.destroy(destroyChildren);
                console.log(`[Shutdown] ${name} destroyed.`);
            } catch (e) {
                console.error(`[Shutdown] Error destroying ${name}:`, e.message);
            }
        } else {
            // console.log(`[Shutdown] ${name} was null or already destroyed.`);
        }
    }
    // --- ▲ クリーンアップ ▲ ---

} // <-- BossScene クラスの終わり
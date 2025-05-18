// CommonBossScene.js (ボスラッシュ共通ロジック - インポートエラー対応)
import {
    // --- 画面・オブジェクトサイズ/位置 (割合ベース) ---
    PADDLE_WIDTH_RATIO, PADDLE_Y_OFFSET_RATIO,
    BALL_RADIUS_RATIO, POWERUP_SIZE_RATIO,
    
    

    // --- UI関連 (割合ベース) ---
    UI_BOTTOM_OFFSET_RATIO, DROP_POOL_UI_ICON_SIZE_RATIO, DROP_POOL_UI_SPACING_RATIO,
    UI_TOP_MARGIN_MIN, UI_TOP_MARGIN_RATIO, UI_SIDE_MARGIN_MIN, UI_SIDE_MARGIN_RATIO,
    UI_FONT_SIZE_MIN, UI_FONT_SIZE_MAX, UI_FONT_SIZE_SCALE_DIVISOR,

    // --- 固定ピクセル値 ---
    PADDLE_HEIGHT,
    // PHYSICS_BALL_RADIUS, // createAndAddBall で動的に計算

    // --- 速度・物理 ---
    BALL_INITIAL_VELOCITY_Y, BALL_INITIAL_VELOCITY_X_RANGE, NORMAL_BALL_SPEED,
    POWERUP_SPEED_Y, BALL_SPEED_MODIFIERS, // BALL_SPEED_MODIFIERS は POWERUP_TYPES をキーとして使用
    INDARA_HOMING_SPEED_MULTIPLIER, MAKIRA_BEAM_SPEED, MAKIRA_ATTACK_INTERVAL,
    FAMILIAR_MOVE_SPEED_X,

    // --- 色 ---
    MAKIRA_BEAM_COLOR, PADDLE_NORMAL_TINT, PADDLE_ANILA_TINT,

    // --- ゲームシステム (ボスラッシュ) ---
    TOTAL_BOSSES, BAISRAVA_DROP_RATE,
    VAJRA_GAUGE_MAX, VAJRA_GAUGE_INCREMENT,  DEFAULT_BOSS_MAX_HEALTH,
    INITIAL_PLAYER_LIVES, MAX_PLAYER_LIVES, // ★ 追加


    // --- パワーアップ ---
    POWERUP_TYPES, POWERUP_ICON_KEYS, POWERUP_DURATION, // POWERUP_DURATION をインポート
    MAKORA_COPYABLE_POWERS,
    // ANILA_DURATION, ANCHIRA_DURATION, BIKARA_DURATION は POWERUP_DURATION から取得するため個別インポート不要

     // ★★★ ボス撃破演出関連の定数をインポート ★★★
    DEFEAT_FLASH_DURATION, DEFEAT_FLASH_INTERVAL, DEFEAT_FLASH_COUNT,
    DEFEAT_SHAKE_DURATION, DEFEAT_FADE_DURATION,
    // ★★★----------------------------------★★★


    // --- 音声キー ---
    AUDIO_KEYS
} from './constants.js';

// --- 共通ボス戦用定数 (CommonBossScene内で使用) ---
const COMMON_BOSS_MAX_HEALTH = 100;
const COMMON_BOSS_SCORE_ON_DEFEAT = 0;

const DEFAULT_BOSS_MOVE_DURATION = 4000;
const DEFAULT_BOSS_MOVE_RANGE_X_RATIO = 0.7;

const CUTSCENE_DURATION = 1800;
const CUTSCENE_FLASH_DURATION = 200;
const INTRO_FLASH_DURATION = 200;
const ZOOM_IN_DURATION = 800;
const ZOOM_WAIT_DURATION = 200;
const SHRINK_DURATION = 50;
const SHRINK_FLASH_DURATION = 150;
const VOICE_START_DELAY = 100;
const GAMEPLAY_START_DELAY = 600;
const BOSS_RANDOM_VOICE_MIN_DELAY = 8000;
const BOSS_RANDOM_VOICE_MAX_DELAY = 15000;
const BOSS_DAMAGE_VOICE_THROTTLE = 2000;

const ATTACK_BRICK_VELOCITY_Y = 180;
const ATTACK_BRICK_SPAWN_DELAY_MIN = 700;
const ATTACK_BRICK_SPAWN_DELAY_MAX = 1500;
const ATTACK_BRICK_ITEM_DROP_RATE = 0.35;

const PADDLE_ANILA_ALPHA = 0.9;
const MAKORA_COPY_DELAY = 150;

export default class CommonBossScene extends Phaser.Scene {
    constructor(sceneKey = 'CommonBossScene') {
        super(sceneKey);

        // --- プレイヤー関連 ---
        this.paddle = null;
        this.balls = null;
        this.lives = 3;
        this.playerControlEnabled = true;
        this.isBallLaunched = false;
        this.paddleInvulnerableTimer = null; // ★ パドル無敵タイマー用
        this.isPaddleInvulnerable = false;   // ★ パドル無敵フラグ
        this.wasAnilaJustDeactivatedByBallLoss = false; // ★ このフラグは不要にする
        this.lastPlayedItemVoiceTime = 0;
    this.lastPlayedBossVoiceTime = 0;

    this.itemVoiceMargin = 300;  // アイテムボイスは0.3秒は連続で鳴らない
    this.bossVoiceMargin = 1500; // ボス関連ボイスは1.5秒は連続で鳴らない (調整可能)

        // --- ボス関連 ---
        this.boss = null;
        this.bossData = {};
        this.bossMoveTween = null;
        this.bossAfterImageEmitter = null;
        this.bossDefeated = false;
        this.randomVoiceTimer = null;
        this.lastDamageVoiceTime = 0;
        this.bossVoiceKeys = [];
     //   this.startIntroPending = false; // ★ 登場演出開始待ちフラグを追加
      //  this.originalBodySize = { width: 0, height: 0 }; // ★ ボディサイズ保存用
        //this.originalBodyOffset = { x: 0, y: 0 };   // ★ ボディオフセット保存用

        // --- 攻撃ブロック関連 ---
        this.attackBricks = null;
        this.attackBrickTimer = null;

        // --- パワーアップ関連 ---
        this.powerUps = null;
        this.bossDropPool = [];
        this.powerUpTimers = {};
        this.isVajraSystemActive = false;
        this.vajraGauge = 0;
        this.isAnilaActive = false;
        this.anilaTimer = null;
        this.anchiraTimer = null;
        this.bikaraTimers = {};
        this.isPlayerTrulyInvincible = false; // ★ アニラ完全無敵フラグ
        
        this.ALL_POSSIBLE_POWERUPS = Object.values(POWERUP_TYPES); // constants.jsから移動
      
        // --- ゲーム進行・状態 ---
        this.currentBossIndex = 1;
        this.totalBosses = TOTAL_BOSSES;
        this.chaosSettings = { count: 4, ratePercent: 50 };
        this.isGameOver = false;
        this.gameClearText = null;
        this.gameOverText = null;
        this.stageClearPopup = null; // ★ ステージクリアポップアップ用
        this.canProceedToNextStage = false; // ★ 次ステージへ進めるかのフラグ

        // --- コライダー参照 ---
        this.ballPaddleCollider = null;
        this.ballBossCollider = null;
        this.ballAttackBrickCollider = null;
        this.ballAttackBrickOverlap = null;
        this.paddlePowerUpOverlap = null;
        this.paddleAttackBrickCollider = null;
      
        // --- UI・その他 ---
        this.uiScene = null;
        this.gameWidth = 0;
        this.gameHeight = 0;
        this.currentBgm = null;
        this.lastPlayedVoiceTime = {};
        this.voiceThrottleTime = 500;

        this.dynamicBottomMargin = 0; // ★ 動的な下部マージン用プロパティ

        this.topMargin = 0;
        this.sideMargin = 0;
    }

    init(data) {
        console.log(`--- ${this.scene.key} INIT ---`);
        console.log("Received data:", data);

        this.lives = data?.lives ?? 3;
        if (data && data.chaosSettings) {
            this.chaosSettings = {
                count: Phaser.Math.Clamp(data.chaosSettings.count ?? 4, 0, this.ALL_POSSIBLE_POWERUPS.length),
                ratePercent: Phaser.Math.Clamp(data.chaosSettings.ratePercent ?? 50, 0, 100)
            };
        } else {
            this.chaosSettings = { count: 4, ratePercent: 50 };
        }
        console.log('Chaos Settings Set:', this.chaosSettings);

        this.currentBossIndex = data?.currentBossIndex ?? 1;
        this.totalBosses = TOTAL_BOSSES;
        this.initializeBossData(); // ★ ボス固有データ初期化を呼ぶ
        // initializeBossData の中で this.bossVoiceKeys = this.bossData.voiceRandom; が実行される想定
        console.log(`[Init - ${this.scene.key}] Boss voice keys for random:`, this.bossVoiceKeys);

        Object.values(this.powerUpTimers).forEach(timer => timer?.remove());
        this.powerUpTimers = {};
        this.bossDropPool = [];
        this.isBallLaunched = false;
        this.isGameOver = false;
        this.bossDefeated = false;
        this.playerControlEnabled = true;
        this.currentBgm = null;
        this.isVajraSystemActive = false;
        this.vajraGauge = 0;
        this.isAnilaActive = false;
        this.anilaTimer?.remove(); this.anilaTimer = null;
        this.isPlayerTrulyInvincible = false; // ★ initでリセット
        this.anchiraTimer?.remove(); this.anchiraTimer = null;
        Object.values(this.bikaraTimers).forEach(timer => timer?.remove());
        this.bikaraTimers = {};
           // ★ 初期ライフを INITIAL_PLAYER_LIVES から設定し、MAX_PLAYER_LIVES を超えないようにする
        this.lives = Math.min(data?.lives ?? INITIAL_PLAYER_LIVES, MAX_PLAYER_LIVES);
        console.log(`Initial lives set to: ${this.lives} (Max: ${MAX_PLAYER_LIVES})`);
        this.lastPlayedItemVoiceTime = 0; // シーン開始/リスタート時にリセット
    this.lastPlayedBossVoiceTime = 0;
      
        this.bossMoveTween?.stop(); this.bossMoveTween = null;
        this.randomVoiceTimer?.remove(); this.randomVoiceTimer = null;
        this.lastDamageVoiceTime = 0;
        this.canProceedToNextStage = false; // ★ initでリセット
        this.isPaddleInvulnerable = false; // ★ initでリセット
        if (this.paddleInvulnerableTimer) {
            this.paddleInvulnerableTimer.remove();
            this.paddleInvulnerableTimer = null;
        }
    

        this.startIntroPending = false; // ★ init でもリセット
        this.isBallLaunched = false;
        this.playerControlEnabled = true; // ★ init時点ではtrue

        this.initializeBossData(); // ボス固有データ初期化
        console.log(`Boss data for ${this.scene.key}:`, this.bossData);

        console.log(`Initialized with Lives: ${this.lives}, Boss: ${this.currentBossIndex}/${this.totalBosses}`);
        console.log(`--- ${this.scene.key} INIT End ---`);
    }

    preload() {
        console.log(`--- ${this.scene.key} PRELOAD ---`);
    }

    create() {
        console.log(`--- ${this.scene.key} CREATE Start ---`);
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
        this.calculateDynamicMargins();

        this.setupBackground();
        this.setupUI();
        this.setupPhysics();
        

        // ★★★ create 内でのフラグ設定 ★★★
        this.playerControlEnabled = false; // まず操作不可に
        this.isBallLaunched = false;     // ボール未発射状態
        // ★★★----------------------★★★

        this.calculateDynamicBottomMargin(); // ★ create時にも計算
        // ...
        this.setupInputAndEvents(); // この中でリサイズリスナーが設定される

        this.createPaddle();
        this.createBalls();
        this.createPowerUpsGroup();
        this.createAttackBricksGroup();
       
        this.createSpecificBoss(); // ボスオブジェクト生成
        if (!this.boss) {
            console.error("BOSS WAS NOT CREATED!");
            // エラー処理 or ダミー生成
            return; // ボスがいないと進めないので終了
        }
        this.setupAfterImageEmitter();

        this.setupBossDropPool();
        this.setColliders();
        this.createGameOverText();
        this.createGameClearText();
        this.setupInputAndEvents();

        // 5. 登場演出開始 ★変更★
        this.playerControlEnabled = false;
        this.isBallLaunched = false;
        this.sound.stopAll();
        this.stopBgm();

        // ★ 新しい演出メソッドを直接呼び出す ★
       // this.startFusionIntro();

          // ★ カットイン演出メソッドを呼び出す ★
          this.startIntroCutscene();

        console.log(`--- ${this.scene.key} CREATE End - Fusion Intro Started ---`);
    }


        // CommonBossScene.js の update メソッド
        update(time, delta) {
            // ★★★ 登場演出開始チェック (これは必要) ★★★
            if (this.startIntroPending) {
                if (this.boss && this.boss.body && this.boss.active) { // activeもチェックに追加
                     console.log("[Update Check] Boss object and body seem ready. Starting intro now.");
                     this.startIntroPending = false;
                     this.startIntroCutscene();
                } else {
                     console.log(`[Update Check] Waiting for boss ready... Boss: ${!!this.boss}, Body: ${!!this.boss?.body}, Active: ${this.boss?.active}`); // ログ追加
                     return; // まだ準備できていなければ他の処理はしない
                }
            }
            // ★★★---------------------------------------★★★
    
            // --- 通常のUpdate処理 ---
            if (this.isGameOver || this.bossDefeated || this.startIntroPending) {
                this.bossAfterImageEmitter?.stop();
                return;
            }

          // if (this.isMakiraActive && this.familiars && this.familiars.countActive(true) > 0) {
       // const familiarBase = this.familiars.getFirstAlive(); // 1体しかいない前提
      //  if (familiarBase && familiarBase.active) {
             // ★★★ 毎フレームの表示状態をログ出力 ★★★
           //  console.log(`[Update Makira] Familiar visible: ${familiarBase.visible}, alpha: ${familiarBase.alpha}, x: ${familiarBase.x.toFixed(0)}, y: ${familiarBase.y.toFixed(0)}`);
             // ★★★-------------------------------★★★

            // 装飾の追従 (もしコメントアウト解除するならここに)
            // if (familiarBase.getData('decoration')) { ... }
     // }
 //   }
             
    
            if (this.boss && this.boss.active) {
                if (this.bossAfterImageEmitter) {
                     this.bossAfterImageEmitter.setPosition(this.boss.x, this.boss.y);
                     if (!this.bossAfterImageEmitter.emitting && this.boss.body?.velocity.lengthSq() > 10) { this.bossAfterImageEmitter.start(); }
                     else if (this.bossAfterImageEmitter.emitting && this.boss.body?.velocity.lengthSq() <= 10) { this.bossAfterImageEmitter.stop(); }
                }
                // ★★★ ボス固有行動の呼び出しを一時的にコメントアウト ★★★
                // console.log("[Update] Calling updateSpecificBossBehavior..."); // 呼び出す前のログ
                 this.updateSpecificBossBehavior(time, delta);
                // ★★★-----------------------------------------------★★★
            }
    
            // --- 残りの update 処理はそのまま実行 ---
            this.updateBallFall();
            this.updateAttackBricks();
            
           
        }

          // startIntroCutscene メソッドを復活させ、最後に fusionIntro を呼ぶ
      // CommonBossScene.js 内

    /**
     * ボス登場演出：カットイン表示
     * 完了後、次の演出 (startFusionIntro) を呼び出す
     */
    startIntroCutscene() {
        console.log("[Intro Cutscene] Starting...");
        // カメラフラッシュ (任意)
        // this.cameras.main.flash(CUTSCENE_FLASH_DURATION, 255, 255, 255);
        try { this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START); } catch(e) { console.error("Error playing cutscene SE:", e); }

        // 背景暗転用オーバーレイ
        const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.75)
            .setOrigin(0,0).setDepth(900); // UI(1000)より奥、カットイン要素より奥

        // ボス画像表示
        const bossImage = this.add.image(this.gameWidth / 2, this.gameHeight / 2, this.bossData.textureKey || 'bossStand')
            .setOrigin(0.5, 0.5).setDepth(901); // オーバーレイより手前
        // サイズ調整
        const targetImageWidth = this.gameWidth * 0.75; // 画面幅の75%程度
        bossImage.displayWidth = targetImageWidth;
        bossImage.scaleY = bossImage.scaleX; // アスペクト比維持

        // --- ▼▼▼ VS テキスト表示 ▼▼▼ ---
        // bossData からテキストを取得、なければデフォルト
        const textContent = this.bossData.cutsceneText || `VS BOSS ${this.currentBossIndex}`;

        // ★★★ calculateDynamicFontSize の最大値を調整 ★★★
        const desiredMaxSize = 100; // ← ウィンドウ幅が広い時に最大でこのpxサイズになるように調整
        const fontSize = this.calculateDynamicFontSize(desiredMaxSize);
        // ★★★------------------------------------------★★★

        const textStyle = {
            fontSize: `${fontSize}px`,
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: Math.max(3, fontSize * 0.1), // 縁取りも調整
            fontFamily: 'MyGameFont, sans-serif',
            align: 'center',
        };

            // ★★★ スタイルオブジェクトとフォントサイズをログ出力 ★★★
    console.log(`[Cutscene Text] Applying style:`, textStyle);
    console.log(`[Cutscene Text] Applying fontSize: ${fontSize}px`);
    // ★★★--------------------------------------------★★★
        const textY = bossImage.getBounds().bottom + this.gameHeight * 0.04;
        const vsText = this.add.text(this.gameWidth / 2, textY, textContent, textStyle)
            .setOrigin(0.5, 0).setDepth(902);

        console.log(`[Intro Cutscene] Displaying text: "${textContent}"`);
        // --- ▲▲▲ VS テキスト表示 ▲▲▲ ---

        // 一定時間後に要素を破棄し、次の演出へ
        this.time.delayedCall(CUTSCENE_DURATION, () => {
            console.log("[Intro Cutscene] End. Starting Fusion Intro.");
            // 安全に破棄
            if (overlay && overlay.scene) overlay.destroy();
            if (bossImage && bossImage.scene) bossImage.destroy();
            if (vsText && vsText.scene) vsText.destroy();
            // 次の演出を呼び出す
            this.startFusionIntro();
        }, [], this);
    }


         // --- ▼▼▼ 新しい「左右分身合体」演出メソッド ▼▼▼ ---
    startFusionIntro() {
        console.log("[Intro Fusion] === Starting Fusion Intro ===");
        if (!this.boss) { console.error("!!! ERROR: Boss object missing for Fusion Intro!"); return; }

        // --- 準備 ---
        // 本体は非表示、物理ボディも無効のまま (createSpecificBossで設定済みのはず)
        this.boss.setVisible(false).setAlpha(0);
        if (this.boss.body) {
            this.boss.disableBody(true, false); // ボディ無効化
            console.log("[Intro Fusion] Main boss body disabled.");
        }

        // ボス戦BGM再生開始
        this.playBossBgm();
         // ★ ボス固有の登場ボイスを再生 (キーが設定されていれば) ★
        if (this.bossData.voiceAppear && typeof this.bossData.voiceAppear === 'string') {
            try {
                this.sound.play(this.bossData.voiceAppear);
                console.log(`[Intro Fusion] Playing boss appear voice: ${this.bossData.voiceAppear}`);
            } catch(e) { console.error(`Error playing boss appear voice (${this.bossData.voiceAppear}):`, e);}
        } else {
            console.log("[Intro Fusion] No specific 'voiceAppear' key set in this.bossData for this boss.");
        }

        // ★ インパクトSEは共通のものを使う (新しいキーに変更) ★
        try {
            this.sound.play(AUDIO_KEYS.SE_FLASH_IMPACT_COMMON); // 汎用インパクトSE
            console.log("[Intro Fusion] Common impact SE played.");
        } catch(e) { console.error("Error playing common impact SE:", e); }
        // --- 左右の分身を作成 ---
        const startXOffset = this.gameWidth * 0.6; // 画面外から開始するためのオフセット量
        const startY = this.boss.getData('targetY'); // 最終的なボスのY座標を使う
        const targetX = this.gameWidth / 2;          // 合体目標地点（画面中央）
        const fusionDuration = 1500; // 合体までにかかる時間 (ms) - 調整可能
        const startAlpha = 0;
        const endAlpha = 0.85; // 合体直前は少し半透明にする

        // 演出用の画像をグループ化すると管理しやすい
        const fusionGroup = this.add.group();

        // 左側の分身
        const leftClone = this.add.image(targetX - startXOffset, startY, this.bossData.textureKey)
            .setAlpha(startAlpha)
            .setScale(this.boss.getData('targetScale')); // 本体と同じスケール
        // 右側の分身
        const rightClone = this.add.image(targetX + startXOffset, startY, this.bossData.textureKey)
            .setAlpha(startAlpha)
            .setScale(this.boss.getData('targetScale'))
            .setFlipX(true); // 右側は左右反転させる

        fusionGroup.addMultiple([leftClone, rightClone]);
        console.log("[Intro Fusion] Clones created off-screen.");

        // --- Tweenで移動とフェードイン ---
        console.log("[Intro Fusion] Starting movement and fade-in tweens...");
        let tweensCompleted = 0;
        const totalTweens = 2;

        const onTweenComplete = () => {
            tweensCompleted++;
            if (tweensCompleted >= totalTweens) {
                // 全てのTweenが完了したら合体処理へ
                console.log("[Intro Fusion] Movement tweens completed.");
                this.triggerFusionFlash(fusionGroup); // 次のステップへ
            }
        };

        try {
            // 左クローンのTween
            this.tweens.add({
                targets: leftClone,
                x: targetX, // 中央へ移動
                alpha: endAlpha, // フェードイン
                duration: fusionDuration,
                ease: 'Expo.easeOut', // 例: Expo.easeOut
                onComplete: onTweenComplete
            });
            // 右クローンのTween
            this.tweens.add({
                targets: rightClone,
                x: targetX, // 中央へ移動
                alpha: endAlpha, // フェードイン
                duration: fusionDuration,
                ease: 'Expo.easeOut',
                onComplete: onTweenComplete
            });
            console.log("[Intro Fusion] Movement tweens added.");
        } catch (e) {
             console.error("!!! ERROR adding fusion movement tweens:", e);
             // エラーが起きたら演出を中断し、ボスを直接表示させるなどのフォールバックが必要
             fusionGroup.destroy(true); // クローン削除
             this.finalizeBossAppearanceAndStart(); // 強制的に戦闘開始
        }
    }

    // 合体時のフラッシュと本体登場処理
    triggerFusionFlash(fusionGroup) {
        console.log("[Intro Fusion] Triggering fusion flash and finalizing...");

        // 1. フラッシュと効果音
        try { this.cameras.main.flash(SHRINK_FLASH_DURATION, 255, 255, 255); } catch(e) { console.error("Flash error:", e); } // 既存の定数を流用
      try { this.sound.play(AUDIO_KEYS.SE_SHRINK); } catch(e) { console.error("Impact sound error:", e); } // 衝撃音

        // 2. 演出用クローンを破棄
        fusionGroup.destroy(true); // 子要素も一緒に破棄
        console.log("[Intro Fusion] Clones destroyed.");

        // 3. 本体を表示させ、物理ボディを有効化
        this.finalizeBossAppearanceAndStart();
    }

 // CommonBossScene.js

// ボス本体の最終的な表示設定とゲームプレイ開始
finalizeBossAppearanceAndStart() {
    if (!this.boss) {
        console.error("!!! ERROR: Boss object missing in finalizeBossAppearanceAndStart!");
        return;
    }

    console.log("[Finalize Appearance] Finalizing boss appearance...");
    try {
        // 見た目の設定
        // this.bossData.targetY や targetScale は各ボスシーンの initializeBossData で設定される想定
        // または、CommonBossScene の createSpecificBoss で設定されたデフォルト値
        const targetY = this.boss.getData('targetY') || (this.gameHeight * 0.25); // フォールバック
        const targetScale = this.boss.getData('targetScale') || this.boss.scale; // フォールバック

        this.boss.setPosition(this.gameWidth / 2, targetY);
        this.boss.setScale(targetScale);
        this.boss.setAlpha(1);
        this.boss.setVisible(true);

        // 物理ボディを有効化し、updateFromGameObject で見た目に合わせる
        if (this.boss.body) {
            // immovable をここで再確認・再設定
            this.boss.setImmovable(true);
            console.log(`[Finalize Appearance] Boss immovable set to: ${this.boss.body.immovable}`);

            // ボディを有効化し、位置を合わせる
            this.boss.enableBody(true, this.boss.x, this.boss.y, true, true);
            console.log(`[Finalize Appearance] Body enabled. Current enabled state: ${this.boss.body.enable}`);

            // updateFromGameObject を呼び出してサイズとオフセットを同期
            try {
                this.boss.body.updateFromGameObject();
                console.log(`[Finalize Appearance] Body updated from GameObject. Size: ${this.boss.body.width.toFixed(0)}x${this.boss.body.height.toFixed(0)}, Offset: (${this.boss.body.offset.x.toFixed(1)}, ${this.boss.body.offset.y.toFixed(1)})`);
            } catch (e) {
                 console.error("!!! ERROR calling updateFromGameObject in finalize:", e);
                 // エラー発生時のフォールバックとして updateBossSize を呼ぶことを検討
                 // if (this.bossData) this.updateBossSize(this.boss, this.bossData.textureKey, this.bossData.widthRatio);
            }
        } else {
            console.error("!!! ERROR: Boss body missing when finalizing appearance!");
        }

        // 戦闘開始直前に無敵を確実に解除
        this.boss.setData('isInvulnerable', false);
        console.log(`[Finalize Appearance] Boss invulnerability set to: ${this.boss.getData('isInvulnerable')}`);

        // コライダーを最新の状態に更新
        console.log("[Finalize Appearance] Calling setColliders before starting gameplay.");
        this.setColliders(); // 通常のCollider設定 (ボール対ボスなど)

        // ボールがボス内部にスタックした場合の救済用 Overlap 設定
        // (setColliders の後に行う)
        if (this.balls && this.boss && this.boss.active && this.boss.body?.enable && this.boss.body.immovable) {
            this.physics.add.overlap(
                this.balls, // ボールグループ
                this.boss,  // ボスオブジェクト
                this.handleBallOverlapBossEject, // コールバック関数
                (ball, currentBoss) => { // processCallback: 実行条件のフィルタリング
                    // ボスが無敵でなく、ボールとボスがアクティブで、ボスに物理ボディがある場合
                    if (!currentBoss.getData('isInvulnerable') && ball.active && currentBoss.active && currentBoss.body) {
                        // さらに、ボールの中心がボスの物理ボディの境界内に実際にあるかをチェック
                        const ballBounds = ball.getBounds(); // ボールの表示境界
                        const bossPhysicsBounds = currentBoss.body; // ボスの物理ボディ境界
                        return Phaser.Geom.Rectangle.Contains(bossPhysicsBounds, ballBounds.centerX, ballBounds.centerY);
                    }
                    return false; // 上記条件を満たさなければ overlap を処理しない
                },
                this // ★★★ コンテキストとして現在のシーンインスタンス (this) を渡す ★★★
            );
            console.log("Overlap check between balls and BOSS (for ejection) SET after colliders.");
        } else {
            console.warn(
                "[Finalize Appearance] Conditions not met for Boss Overlap (ejection). Details:",
                `Balls ready: ${!!this.balls}`,
                `Boss ready: ${!!this.boss}`,
                `Boss active: ${this.boss?.active}`,
                `Boss body enabled: ${this.boss?.body?.enable}`,
                `Boss immovable: ${this.boss?.body?.immovable}`
            );
        }

    } catch(e) {
        console.error("!!! ERROR finalizing boss appearance or enabling body:", e);
    }

    // 戦闘開始のSEと遅延呼び出し
    try {
        if (AUDIO_KEYS.SE_FIGHT_START) this.sound.play(AUDIO_KEYS.SE_FIGHT_START);
    } catch(e) {
        console.error("Error playing SE_FIGHT_START:", e);
    }
    const gameplayDelay = GAMEPLAY_START_DELAY || 600; // constants.js からかデフォルト値
    this.time.delayedCall(gameplayDelay, this.startGameplay, [], this);
    console.log(`--- ${this.scene.key} finalizeBossAppearanceAndStart Complete ---`);
}


// ボールがボス内部にめり込んだ場合に呼び出されるコールバック関数 (CommonBossScene内)
handleBallOverlapBossEject(ball, boss) { // ballはgameObject1, bossはgameObject2
    // --- 冒頭のログとガード処理 ---
    console.log("-------------------------------------------");
    console.log("[Overlap Boss Eject] Method called.");
    console.log("[Overlap Boss Eject] Argument `ball` object:", ball);
    console.log("[Overlap Boss Eject] Argument `ball` texture key:", ball?.texture?.key);
    console.log("[Overlap Boss Eject] Argument `boss` object:", boss);
    console.log("[Overlap Boss Eject] Argument `boss` texture key:", boss?.texture?.key);
    console.log("[Overlap Boss Eject] `this` (context) is:", this);
    console.log("[Overlap Boss Eject] `this.physics` is:", this.physics);
    console.log("[Overlap Boss Eject] `this.physics.velocityFromAngle` is:", this.physics?.velocityFromAngle);
    console.log("-------------------------------------------");

    // this.physics と velocityFromAngle が利用可能かチェック
    if (!this.physics || typeof this.physics.velocityFromAngle !== 'function') {
        console.error("CRITICAL: this.physics or this.physics.velocityFromAngle is not available here in handleBallOverlapBossEject! Cannot eject ball.");
        // フォールバック: ボールに上向きの速度を少し与えてみる（ただし、これがボスを動かす原因にはならないはず）
        if (ball && ball.body) {
            // ball.setVelocity(Phaser.Math.Between(-50, 50), -200);
        }
        return; // 処理を中断
    }

    // ボールやボスのボディがない、またはボスが無敵なら処理しない
    if (!ball || !ball.body || !boss || !boss.body || boss.getData('isInvulnerable')) {
        console.log("[Overlap Boss Eject] Conditions not met for actual ejection (no body, boss invulnerable, etc.).");
        return;
    }

    // ★重要★: このコールバックに渡される `boss` が、本当にこのシーンのメインボス (`this.boss`) であるか確認
    // (processCallbackでフィルタリングしているが、念のため)
    if (boss !== this.boss) {
        console.error(`[Overlap Boss Eject] The 'boss' argument (texture: ${boss?.texture?.key}) is NOT the main scene boss (this.boss texture: ${this.boss?.texture?.key})! Aborting ejection.`);
        return;
    }

    // --- 速度変更による押し出しロジック ---
    console.log(`[Overlap Boss Eject] Ball ${ball.name} truly overlapped with Boss ${boss.texture.key}. Applying velocity change to eject.`);

    // ボスの中心からボールの中心へ向かう角度を計算
    const repelAngleRad = Phaser.Math.Angle.Between(boss.x, boss.y, ball.x, ball.y);
    const repelAngleDeg = Phaser.Math.RadToDeg(repelAngleRad);

    // パワーアップによる速度補正
    let speedMultiplier = 1.0;
    if (ball.getData('isFast') === true && BALL_SPEED_MODIFIERS && POWERUP_TYPES) { // 定数存在チェック
        speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA] || 1.0;
    } else if (ball.getData('isSlow') === true && BALL_SPEED_MODIFIERS && POWERUP_TYPES) {
        speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA] || 1.0;
    }

    // 押し出し時の基本速度と最低速度
    const baseEjectSpeed = (NORMAL_BALL_SPEED || 380) * 0.7; // 通常速度の70%で押し出す
    const minEjectSpeed = 150; // 最低でもこの速度は出す
    const targetSpeed = Math.max(baseEjectSpeed * speedMultiplier, minEjectSpeed);

    // 計算した角度と速度でボールの速度を設定 (ボールをボスから離す方向へ)
    try {
        this.physics.velocityFromAngle(repelAngleDeg, targetSpeed, ball.body.velocity);
        console.log(`[Overlap Boss Eject] Ball ${ball.name} velocity set to escape. Angle: ${repelAngleDeg.toFixed(1)}, Speed: ${targetSpeed.toFixed(1)}, New V:(${ball.body.velocity.x.toFixed(1)}, ${ball.body.velocity.y.toFixed(1)})`);
    } catch (e) {
        console.error("[Overlap Boss Eject] Error setting velocity for ball ejection:", e);
    }

    // 通常のダメージ処理は、別途設定されている `this.physics.add.collider` の `hitBoss` に任せる。
    // この overlap はあくまでスタックからの救済が目的。
}


     // startGameplay: 戦闘開始処理に加え、遅延してコライダーを設定
     startGameplay() {
        console.log("[Gameplay Start] Enabling player control.");
       this.playerControlEnabled = true;
    this.isBallLaunched = false; // ボールもリセット
    // ★★★ 登場演出フラグをここで確実にfalseにする ★★★
    if (this.isIntroAnimating !== undefined) { // プロパティが存在すれば
        this.isIntroAnimating = false;
        console.log(`[${this.scene.key} Gameplay Start] isIntroAnimating set to false.`);
    }
    // ★★★-----------------------------------------★★★

        this.startSpecificBossMovement();
        this.startRandomVoiceTimer();

        // ★★★ 少し遅れて衝突判定を設定 ★★★
        const colliderDelay = 50; // 50ms (約3フレーム) 遅延させる (調整可能)
        console.log(`[Gameplay Start] Scheduling setColliders in ${colliderDelay}ms...`);
        this.time.delayedCall(colliderDelay, () => {
            if (!this.scene.isActive() || this.isGameOver || this.bossDefeated) return; // シーンが有効か確認
            console.log("[Gameplay Start] Delayed: Calling setColliders NOW.");
            this.setColliders(); // ここで全てのコライダーを設定し直す
             // または、makiraBeamBossOverlapだけを設定し直す場合：
             // if (this.makiraBeams && this.boss) {
             //     this.safeDestroyCollider(this.makiraBeamBossOverlap); // 既存があれば念のため破棄
             //     this.makiraBeamBossOverlap = this.physics.add.overlap(this.makiraBeams, this.boss, this.hitBossWithMakiraBeam, (beam, b) => !b.getData('isInvulnerable'), this);
             //     console.log("[Gameplay Start] Delayed: Makira beam overlap re-added.");
             // }
        }, [], this);
        // ★★★-----------------------------★★★
    }


       // このメソッドは各ボスシーンでオーバーライドされ、具体的な値が設定される
    initializeBossData() {
        console.warn(`CommonBossScene: initializeBossData() MUST BE IMPLEMENTED in ${this.scene.key}. Setting minimal defaults.`);
        this.bossData = {
            health: DEFAULT_BOSS_MAX_HEALTH,
            textureKey: 'bossStand',
            negativeKey: 'bossNegative',
            // ★ ボイスキーは各ボスシーンで責任を持って設定する ★
            voiceAppear: null,         // (例: AUDIO_KEYS.VOICE_ARTMAN_APPEAR)
            voiceDamage: null,         // (例: AUDIO_KEYS.VOICE_ARTMAN_DAMAGE)
            voiceDefeat: null,         // (例: AUDIO_KEYS.VOICE_ARTMAN_DEFEAT)
            voiceRandom: [],           // (例: [AUDIO_KEYS.VOICE_ARTMAN_RANDOM_1])
            bgmKey: AUDIO_KEYS.BGM2,   // デフォルトBGM
            cutsceneText: `VS BOSS ${this.currentBossIndex}`,moveRangeXRatio: DEFAULT_BOSS_MOVE_RANGE_X_RATIO,
            moveDuration: DEFAULT_BOSS_MOVE_DURATION,
            widthRatio: 0.25,
        };
         // ★ initializeBossDataの最後に必ずこれを呼んで、Commonのプロパティも更新 ★
        this.bossVoiceKeys = Array.isArray(this.bossData.voiceRandom) ? this.bossData.voiceRandom : [];
    }

      /**
     * ボスオブジェクトを生成・初期化し、初期の物理ボディ情報を保存する
     * (createSpecificBoss 自体は CommonBossScene にあり、
     *  Boss1Scene などで super.createSpecificBoss() を呼ぶか、
     *  完全にオーバーライドしてこの内容を参考に実装する)
     */
  // CommonBossScene.js の createSpecificBoss メソッドを修正

    createSpecificBoss() {
        console.warn(`CommonBossScene: createSpecificBoss() called. Ensure derived scene (like Boss1Scene) has called initializeBossData to set this.bossData first.`); // ログを少し親切に
        if (this.boss) {
            console.log("[CommonBossScene] Existing boss found, destroying it first.");
            this.boss.destroy();
            this.boss = null; // 参照もクリア
        }

        const bossX = this.gameWidth / 2;
        const bossY = this.gameHeight * 0.25;

        // ★★★ bossData が存在するか、health が定義されているか確認 ★★★
        if (!this.bossData || typeof this.bossData.health === 'undefined') {
            console.error("!!! CRITICAL ERROR: this.bossData or this.bossData.health is not defined BEFORE creating boss! Did initializeBossData run correctly in the derived scene?");
            // this.bossData が未定義の場合、デフォルト値でフォールバックするか、処理を中断する
            this.bossData = this.bossData || {}; // bossDataがnull/undefinedなら空オブジェクトに
            this.bossData.health = this.bossData.health || DEFAULT_BOSS_MAX_HEALTH; // healthもフォールバック
            this.bossData.textureKey = this.bossData.textureKey || 'bossStand';
            this.bossData.widthRatio = this.bossData.widthRatio || 0.25;
            console.warn("[CommonBossScene] Using fallback bossData due to missing initialization.");
        }
        // ★★★----------------------------------------------------★★★
        const textureKey = this.bossData.textureKey; // || 'bossStand' は上記のフォールバックで対応済み

        try {
            this.boss = this.physics.add.image(bossX, bossY, textureKey)
                .setImmovable(true).setVisible(false).setAlpha(0);
            console.log("[CommonBossScene] Boss object created with texture:", textureKey, this.boss);
            console.log("[CommonBossScene] Boss body object:", this.boss.body);
            if (!this.boss.body) { console.error("!!! CRITICAL: Physics body was NOT created for the boss!"); }

        } catch (e) {
            console.error(`!!! FATAL ERROR during physics.add.image for boss (texture: ${textureKey}):`, e);
            this.boss = null;
            return;
        }

        if (this.boss) {
            try {
                const initialHealth = this.bossData.health; // フォールバック済みなので || DEFAULT_BOSS_MAX_HEALTH は不要
                console.log(`[CommonBossScene] Attempting to set initial health to: ${initialHealth} (from this.bossData.health)`);

                this.boss.setData('health', initialHealth);
                this.boss.setData('maxHealth', initialHealth); // maxHealthも同じ初期値で

                // ★★★ 設定直後のHPを getData で取得してログ出力 ★★★
                const currentHp = this.boss.getData('health');
                const currentMaxHp = this.boss.getData('maxHealth');
                console.log(`[CommonBossScene] AFTER setData - Health: ${currentHp}, MaxHealth: ${currentMaxHp}, Typeof Health: ${typeof currentHp}`);
                if (typeof currentHp !== 'number' || isNaN(currentHp)) {
                     console.error("!!!!!!!! INITIAL BOSS HP IS NOT A VALID NUMBER AFTER setData !!!!!!!!");
                }
                // ★★★--------------------------------------------★★★

                this.boss.setData('isInvulnerable', false);  
                console.log(`[CreateSpecificBoss - ${this.scene.key}] Set isInvulnerable to: ${this.boss.getData('isInvulnerable')}`);
  
                this.boss.setData('targetY', bossY);
                console.log("[CommonBossScene] Boss data (invulnerable, targetY) set.");

            } catch(e) { console.error("!!! ERROR setting boss data (health, etc.):", e); }

            try {
                this.updateBossSize(this.boss, textureKey, this.bossData.widthRatio);
                this.boss.setData('targetScale', this.boss.scale);
                console.log("[CommonBossScene] Boss initial size updated and targetScale set.");
            } catch(e) { console.error("!!! ERROR during initial boss size update / targetScale storage:", e); }
        }
    }
    startSpecificBossMovement() {
        console.warn(`CommonBossScene: startSpecificBossMovement() not implemented in ${this.scene.key}. Starting generic movement.`);
        if (!this.boss || !this.boss.active) return;
        if (this.bossMoveTween) this.bossMoveTween.stop();
        const moveWidth = this.gameWidth * (this.bossData.moveRangeXRatio || DEFAULT_BOSS_MOVE_RANGE_X_RATIO) / 2;
        const leftX = this.gameWidth / 2 - moveWidth;
        const rightX = this.gameWidth / 2 + moveWidth;
        this.boss.setX(this.gameWidth / 2);
        const easeFunctions = ['Sine.easeInOut', 'Quad.easeInOut', 'Cubic.easeInOut', 'Quart.easeInOut', 'Expo.easeInOut', 'Circ.easeInOut'];
        const moveToRight = () => {
            if (!this.boss?.active || this.isGameOver || this.bossDefeated) return;
            this.bossMoveTween = this.tweens.add({ targets: this.boss, x: rightX, duration: this.bossData.moveDuration || DEFAULT_BOSS_MOVE_DURATION, ease: Phaser.Utils.Array.GetRandom(easeFunctions), onComplete: moveToLeft });
        };
        const moveToLeft = () => {
            if (!this.boss?.active || this.isGameOver || this.bossDefeated) return;
            this.bossMoveTween = this.tweens.add({ targets: this.boss, x: leftX, duration: this.bossData.moveDuration || DEFAULT_BOSS_MOVE_DURATION, ease: Phaser.Utils.Array.GetRandom(easeFunctions), onComplete: moveToRight });
        };
        moveToRight();
    }

    updateSpecificBossBehavior(time, delta) {
        // 汎用的な攻撃ブロック生成タイマーの例
       /* if (!this.attackBrickTimer || this.attackBrickTimer.getProgress() === 1) {
            if (this.playerControlEnabled && this.boss && this.boss.active && !this.bossDefeated && !this.isGameOver) {
                this.scheduleNextGenericAttackBrick();
            }
        }*/
    }

    handleBossDefeatCompletion() {
        console.log(`--- ${this.scene.key} Boss Defeated Completion ---`);
        if (this.currentBossIndex < this.totalBosses) {
            const nextBossIndex = this.currentBossIndex + 1;
            console.log(`Proceeding to Boss ${nextBossIndex}`);
               // ★★★ UIシーンを一度停止してから、次のボスシーンを開始 ★★★
            if (this.scene.isActive('UIScene')) {
                this.scene.stop('UIScene');
                console.log("[HandleDefeat] UIScene stopped before starting next boss.");
            }
            // ★★★-------------------------------------------------★★★

            this.scene.start(`Boss${nextBossIndex}Scene`, {
                lives: this.lives, chaosSettings: this.chaosSettings, currentBossIndex: nextBossIndex
            });
        } else {
            console.log("All bosses defeated! Game Clear!");
            this.triggerGameClear();
        }
    }
    // --- ▲▲▲ プレースホルダーメソッド ▲▲▲ ---

    // ★ 動的な下部マージンを計算するメソッド
    calculateDynamicBottomMargin() {
        // window.innerHeight は実際の表示領域の高さ
        // this.scale.displaySize.height は Phaser が FIT モードで合わせているCanvasの表示上の高さ
        const availableHeight = window.innerHeight;
        const gameDisplayHeight = this.scale.displaySize.height;

        if (gameDisplayHeight > availableHeight) {
             // ゲームの表示高さが表示領域より大きい場合、差分をマージンとする
             this.dynamicBottomMargin = gameDisplayHeight - availableHeight;
           //  console.log(`[Dynamic Margin] Calculated bottom margin: ${this.dynamicBottomMargin.toFixed(0)}px`);
        } else {
             this.dynamicBottomMargin = 0; // はみ出てなければマージン不要
        }
         // セーフエリアも考慮に入れる場合 (より高度)
         // const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0');
         // this.dynamicBottomMargin = Math.max(this.dynamicBottomMargin, safeAreaBottom);
         // console.log(`[Dynamic Margin] Adjusted for safe area: ${this.dynamicBottomMargin.toFixed(0)}px`);

         // ★★★ UIScene にマージン情報を伝える (イベント経由など) ★★★
         this.events.emit('updateDynamicMargin', this.dynamicBottomMargin);
    }

    // --- ▼ Create ヘルパーメソッド ▼ ---
    calculateDynamicMargins() {
        this.topMargin = Math.max(UI_TOP_MARGIN_MIN, this.gameHeight * UI_TOP_MARGIN_RATIO);
        this.sideMargin = Math.max(UI_SIDE_MARGIN_MIN, this.gameWidth * UI_SIDE_MARGIN_RATIO);
        // デバッグ用に topMargin の値を確認
      //  console.log(`[Calculate Margins] Top: ${this.topMargin.toFixed(1)}, Side: ${this.sideMargin.toFixed(1)}`);
    }
    setupBackground() {
        this.add.image(this.gameWidth / 2, this.gameHeight / 2, this.bossData.backgroundKey || 'gameBackground3')
            .setOrigin(0.5, 0.5).setDisplaySize(this.gameWidth, this.gameHeight)
            .setDepth(-10).setAlpha(0.85);
    }
    setupUI() {
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene', { parentSceneKey: this.scene.key });
        }
        this.uiScene = this.scene.get('UIScene');
        this.time.delayedCall(100, () => {
            if (this.uiScene?.scene.isActive()) {
                this.events.emit('updateLives', this.lives);
                this.events.emit('updateBossNumber', this.currentBossIndex, this.totalBosses);
                if (this.boss) this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth'));
                this.events.emit('deactivateVajraUI');
                this.events.emit('updateDropPoolUI', this.bossDropPool);
            } else console.warn("UIScene not ready for initial UI update.");
        }, [], this);
    }
    setupPhysics() {
        // 物理世界の衝突設定 (左、右、上は衝突、下は衝突しない)
        this.physics.world.setBoundsCollision(true, true, true, false);

        // ★★★ 物理ワールドの上端境界を調整 ★★★
        // 計算済みの画面上部マージン (this.topMargin) を使うか、固定ピクセル値を使う
        // this.topMargin は calculateDynamicMargins で計算されている想定
        const additionalTopOffset = 30; // <--- この値を調整 (例: 20, 40, 50 など)
        const physicsTopBoundY = this.topMargin > 10 ? this.topMargin : 20; // 例: マージンがあればそれを、なければ最低20px確保
        // setBounds(x, y, width, height)
        this.physics.world.setBounds(
            0,                     // X座標の開始は0
            physicsTopBoundY,      // Y座標の開始を少し下げる
            this.gameWidth,        // 幅はゲーム幅全体
            this.gameHeight - physicsTopBoundY // 高さは開始位置を下げた分だけ減らす
        );
        console.log(`[Physics] World bounds set. Top bound at Y: ${physicsTopBoundY}`);
        // ★★★----------------------------------★★★

        // ワールド境界衝突イベントの設定 (変更なし)
        this.physics.world.off('worldbounds', this.handleWorldBounds, this);
        this.physics.world.on('worldbounds', this.handleWorldBounds, this);
        console.log("Physics world setup complete.");
    }
    createPaddle() {
        if (this.paddle) this.paddle.destroy();
        this.paddle = this.physics.add.image(this.gameWidth / 2, this.gameHeight * (1 - PADDLE_Y_OFFSET_RATIO), 'whitePixel')
            .setTint(PADDLE_NORMAL_TINT).setImmovable(true).setCollideWorldBounds(true)
            .setData('originalWidthRatio', PADDLE_WIDTH_RATIO);
        this.updatePaddleSize();
        this.clampPaddleYPosition();
        if (this.paddle.body) this.paddle.body.onWorldBounds = true;
    }
    createBalls() {
        if (this.balls) this.balls.destroy(true);
        this.balls = this.physics.add.group({ bounceX: 1, bounceY: 1, collideWorldBounds: true });
        if (this.paddle?.active) {
            const ballY = this.paddle.y - (this.paddle.displayHeight / 2) - (this.gameWidth * BALL_RADIUS_RATIO);
            this.createAndAddBall(this.paddle.x, ballY);
        } else this.createAndAddBall(this.gameWidth / 2, this.gameHeight * 0.7);
    }
    createPowerUpsGroup() { if (this.powerUps) this.powerUps.destroy(true); this.powerUps = this.physics.add.group(); }
    createAttackBricksGroup() { if (this.attackBricks) this.attackBricks.destroy(true); this.attackBricks = this.physics.add.group(); }
 

    setupBossDropPool() {
        const shuffledPool = Phaser.Utils.Array.Shuffle([...this.ALL_POSSIBLE_POWERUPS]);
        this.bossDropPool = shuffledPool.slice(0, this.chaosSettings.count);
        console.log(`Boss Drop Pool (Count: ${this.chaosSettings.count}): [${this.bossDropPool.join(',')}]`);
        if (this.uiScene?.scene.isActive()) this.events.emit('updateDropPoolUI', this.bossDropPool);
    }
    setColliders() {
        console.log(`[SetColliders] Starting for scene: ${this.scene.key}. Boss: ${this.boss?.texture?.key}, Active: ${this.boss?.active}, BodyEnabled: ${this.boss?.body?.enable}`);
  
        this.safeDestroyCollider(this.ballPaddleCollider); 
         // ボール vs ボス
        this.safeDestroyCollider(this.ballBossCollider);
        this.ballBossCollider = null;
        console.log(`[SetColliders] Checking conditions for Ball-Boss collider. Boss Texture: ${this.boss?.texture?.key}, Active: ${this.boss?.active}, BodyEnabled: ${this.boss?.body?.enable}`);
        if (this.boss && this.boss.active && this.boss.body && this.boss.body.enable) {
            this.ballBossCollider = this.physics.add.collider(
                this.boss,
                this.balls,
                this.hitBoss, // ★ コールバックは hitBoss
                (bossObj, ball) => { // ★ processCallback
                    const invulnerable = bossObj.getData('isInvulnerable');
                    // ★★★ このログで isInvulnerable の状態を確認 ★★★
                  //  console.log(`[Ball-Boss ProcessCallback] Boss: ${bossObj.texture.key}, isInvulnerable: ${invulnerable}`);
                    return !invulnerable; // 無敵でなければ衝突を処理 (trueを返す)
                },
                this
            );
            console.log("[SetColliders] Ball-Boss collider ADDED/UPDATED.");
        } else {
            console.log("[SetColliders] Ball-Boss collider SKIPPED due to conditions.");
        }
         this.safeDestroyCollider(this.ballAttackBrickCollider);
    this.safeDestroyCollider(this.ballAttackBrickOverlap);
    this.ballAttackBrickCollider = null;
    this.ballAttackBrickOverlap = null;

    let needsCollider = false; // 通常衝突が必要なボールがあるか
    let needsOverlap = false;  // すり抜けが必要なボールがあるか

    this.balls?.getMatching('active', true).forEach(ball => {
        if (ball.getData('isIndaraActive') || ball.getData('isBikaraPenetrating')) {
            needsOverlap = true;
        } else {
            needsCollider = true;
        }
    });

    if (needsCollider && this.attackBricks && this.balls) {
        this.ballAttackBrickCollider = this.physics.add.collider(
            this.attackBricks,
            this.balls,
            this.hitAttackBrick, // 通常の衝突コールバック
            (brick, ball) => !ball.getData('isIndaraActive') && !ball.getData('isBikaraPenetrating'), // すり抜け効果がないボールのみ
            this
        );
    }
    if (needsOverlap && this.attackBricks && this.balls) {
        this.ballAttackBrickOverlap = this.physics.add.overlap(
            this.attackBricks,
            this.balls,
            this.handleBallAttackBrickOverlap, // すり抜け時のコールバック
            (brick, ball) => ball.getData('isIndaraActive') || ball.getData('isBikaraPenetrating'), // すり抜け効果があるボールのみ
            this
        );
    }
        this.safeDestroyCollider(this.paddlePowerUpOverlap); this.safeDestroyCollider(this.paddleAttackBrickCollider);
        this.safeDestroyCollider(this.makiraBeamBossOverlap);this.safeDestroyCollider(this.paddleBossOverlap, "paddleBossOverlap"); // ★ 新しい参照用
          this.safeDestroyCollider(this.ballFamiliarCollider);
this.ballFamiliarCollider = null; // 明示的にnullに
console.log(`[SetColliders] Checking conditions for Ball-Familiar collider: isMakiraActive=${this.isMakiraActive}, balls=${!!this.balls}, familiars=${!!this.familiars}, familiars.countActive=${this.familiars?.countActive(true)}`);

if (this.isMakiraActive && this.balls && this.familiars && this.familiars.countActive(true) > 0) {
    console.log("[SetColliders] ADDING Ball-Familiar collider."); // ★追加
    this.ballFamiliarCollider = this.physics.add.collider(
        this.balls,
        this.familiars, // ★ 物理グループ 'familiars' を指定
        this.hitFamiliarWithBall,
        null,
        this
    );
    // ★ コライダーが生成されたか確認
    console.log("[SetColliders] ballFamiliarCollider object:", this.ballFamiliarCollider);
    if (!this.ballFamiliarCollider || !this.ballFamiliarCollider.active) {
        console.error("!!! FAILED to create or activate ballFamiliarCollider !!!");
    }
} else {
    console.log("[SetColliders] Conditions NOT MET for Ball-Familiar collider or it was removed.");
}

    // ★★★ パドル vs ボス本体のオーバーラップ判定 ★★★
        if (this.paddle && this.boss && this.boss.active && this.boss.body?.enable) {
            this.paddleBossOverlap = this.physics.add.overlap(
                this.paddle,
                this.boss,
                this.handlePaddleBossContact, // ★ 新しいコールバック関数
                null, // processCallback はここでは不要（コールバック内で条件判定）
                this
            );
            console.log("[SetColliders] Paddle-Boss overlap ADDED.");
        } else {
            console.log("[SetColliders] Paddle-Boss overlap SKIPPED.");
        }
        if (this.paddle && this.balls) this.ballPaddleCollider = this.physics.add.collider(this.paddle, this.balls, this.hitPaddle, null, this);
        if (this.boss && this.balls) this.ballBossCollider = this.physics.add.collider(this.boss, this.balls, this.hitBoss, (b, ball) => !b.getData('isInvulnerable'), this);
        if (this.paddle && this.powerUps) this.paddlePowerUpOverlap = this.physics.add.overlap(this.paddle, this.powerUps, this.collectPowerUp, null, this);
        if (this.paddle && this.attackBricks) this.paddleAttackBrickCollider = this.physics.add.collider(this.paddle, this.attackBricks, this.handlePaddleHitByAttackBrick, null, this);
      //  if (this.makiraBeams && this.boss) this.makiraBeamBossOverlap = this.physics.add.overlap(this.makiraBeams, this.boss, this.hitBossWithMakiraBeam, (beam, b) => !b.getData('isInvulnerable'), this);

     
        this.balls?.getMatching('active', true).forEach(ball => {
            if (ball.getData('isIndaraActive') || ball.getData('isBikaraPenetrating')) needsOverlap = true;
            else needsCollider = true;
        });
        if (needsCollider && this.attackBricks && this.balls) this.ballAttackBrickCollider = this.physics.add.collider(this.attackBricks, this.balls, this.hitAttackBrick, (br, ball) => !ball.getData('isIndaraActive') && !ball.getData('isBikaraPenetrating'), this);
        if (needsOverlap && this.attackBricks && this.balls) this.ballAttackBrickOverlap = this.physics.add.overlap(this.attackBricks, this.balls, this.handleBallAttackBrickOverlap, (br, ball) => ball.getData('isIndaraActive') || ball.getData('isBikaraPenetrating'), this);
    }
    createGameOverText() {
        if (this.gameOverText) this.gameOverText.destroy();
        this.gameOverText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '全滅した...\nタップで最初から', { fontSize: `${this.calculateDynamicFontSize(40)}px`, fill: '#f00', align: 'center', stroke: '#000', strokeThickness: 4, fontFamily: 'MyGameFont, sans-serif' }).setOrigin(0.5).setVisible(false).setDepth(1001);
    }
    createGameClearText() {
        if (this.gameClearText) this.gameClearText.destroy();
        this.gameClearText = this.add.text(this.gameWidth / 2, this.gameHeight * 0.4, '', { fontSize: `${this.calculateDynamicFontSize(48)}px`, fill: '#ffd700', align: 'center', stroke: '#000', strokeThickness: 5, fontFamily: 'MyGameFont, sans-serif', wordWrap: { width: this.gameWidth * 0.9, useAdvancedWrap: true } }).setOrigin(0.5).setVisible(false).setDepth(1001);
    }
    setupInputAndEvents() {
        this.input.off('pointermove', this.handlePointerMove, this); this.input.on('pointermove', this.handlePointerMove, this);
        this.input.off('pointerdown', this.handlePointerDown, this); this.input.on('pointerdown', this.handlePointerDown, this);
        this.scale.off('resize', this.handleResize, this); this.scale.on('resize', this.handleResize, this);
        this.events.off('shutdown', this.shutdownScene, this); this.events.on('shutdown', this.shutdownScene, this);
    }
    // --- ▲ Create ヘルパーメソッド ▲ ---

    // --- ▼ 登場・撃破演出メソッド群 ▼ ---
    
   

    // defeatBoss
    defeatBoss(bossObject) {
        if (this.bossDefeated) return;
        console.log("[Defeat] Boss defeated! Starting defeat sequence.");
        this.bossDefeated = true;
        this.playerControlEnabled = false; // ★ プレイヤー操作をまず無効化

        // 1. ボス固有の撃破ボイスを再生 (これが一番最初に聞こえてほしい)
        if (this.bossData.voiceDefeat && typeof this.bossData.voiceDefeat === 'string') {
            try {
                this.sound.play(this.bossData.voiceDefeat);
                console.log(`[Defeat] Playing boss defeat voice: ${this.bossData.voiceDefeat}`);
            } catch (e) { console.error(`Error playing boss defeat voice (${this.bossData.voiceDefeat}):`, e); }
        } else {
             console.log("[Defeat] No specific 'voiceDefeat' key for this boss.");
        }

        // 2. ボイス以外の戦闘に関連する音を止める
        //    - BGMは後で止めるか、ポップアップ表示時に止める
        //    - ランダムボイスタイマーは確実に停止
        this.randomVoiceTimer?.remove();
        this.randomVoiceTimer = null; // 参照もクリア
        console.log("[Defeat] Random voice timer stopped.");
        //    - 他の持続的なSEがあればここで個別に stop() する

        // 3. ゲームオブジェクトの動きを止める
        this.bossMoveTween?.stop(); // ボスの動きのTweenを停止
        this.bossMoveTween = null;
        console.log("[Defeat] Boss movement tween stopped.");

        this.attackBrickTimer?.remove(); // 攻撃ブロック生成タイマーを停止
        this.attackBrickTimer = null;
        console.log("[Defeat] Attack brick timer stopped.");

        this.balls?.children.each(ball => { // 全てのボールの動きを止める
            if (ball.active && ball.body) {
                ball.setVelocity(0, 0);
                ball.body.stop(); // 念のため
            }
        });
        console.log("[Defeat] All active balls stopped.");

        // マキラがアクティブなら解除 (子機やビームタイマーも停止される)
        if (this.isMakiraActive) {
            this.deactivateMakira();
            console.log("[Defeat] Deactivated Makira effect.");
        }
        // 他の持続系パワーアップもここで解除した方が良い場合がある (loseLifeと共通化も検討)
        // this.deactivateAnila();
        // this.deactivateAnchira(true);
        // this.deactivateSindara(null, true);
        // Object.values(this.bikaraTimers).forEach(timer => timer?.remove());
        // this.bikaraTimers = {};
        // Object.values(this.powerUpTimers).forEach(timer => timer?.remove());
        // this.powerUpTimers = {};


        // 4. 物理ボディの無効化 (ボールや他のものと衝突しなくなる)
        if (bossObject?.body) {
            bossObject.disableBody(false, false); // GameObjectは表示されたまま
            console.log("[Defeat] Boss physics body disabled.");
        }

        // 5. 撃破演出SE (ボイスと多少重なっても良いインパクト音など)
        try { this.sound.play(AUDIO_KEYS.SE_DEFEAT_FLASH); } catch(e) { /* ... */ }

        // 6. 見た目の変更 (ネガ反転など)
        if (bossObject?.active) {
            try {
                bossObject.setTexture(this.bossData.negativeKey || 'bossNegative');
                console.log("[Defeat] Boss texture set to negative.");
            } catch (e) { console.error("Error setting negative texture:", e); }
        }

        // 7. 画面フラッシュ演出と、その完了後にシェイク＆フェードを開始
        for (let i = 0; i < DEFEAT_FLASH_COUNT; i++) {
            this.time.delayedCall(i * DEFEAT_FLASH_INTERVAL, () => {
                if (!this.scene.isActive() || !this.bossDefeated) return; // すでに次の処理に進んでいないか確認
                this.cameras.main.flash(DEFEAT_FLASH_DURATION, 255, 255, 255);
                if (i === DEFEAT_FLASH_COUNT - 1) { // 最後のフラッシュ後
                    if (bossObject?.active) { // ボスオブジェクトがまだ存在すれば
                        this.startBossShakeAndFade(bossObject, true); // ポップアップ表示を指示
                    } else {
                        console.warn("[Defeat] Boss object became inactive during flash sequence. Showing popup directly.");
                        this.showStageClearPopup(); // ボスがいないなら直接ポップアップ
                    }
                }
            }, [], this);
        }
    }

  // CommonBossScene.js

    /**
     * ボスのシェイク＆フェードアウト演出を開始する
     * @param {Phaser.Physics.Arcade.Image} bossObject 対象のボスオブジェクト
     * @param {boolean} [showPopupAfter=false] 完了後にステージクリアポップアップを表示するかどうか
     */
   startBossShakeAndFade(bossObject, showPopupAfter = false) {
        if (!bossObject || !bossObject.active) {
            console.warn("[Shake&Fade] Target boss is missing or inactive. Proceeding to next step.");
            if (showPopupAfter) {
                this.showStageClearPopup();
            } else {
                this.handleBossDefeatCompletion();
            }
            return;
        }
        console.log(`[Shake&Fade] Starting for boss. ShowPopupAfter: ${showPopupAfter}`);

        // --- シェイクTween ---
        // DEFEAT_SHAKE_DURATION とシェイクの強さ(amplitude)は constants.js または bossData から取得
        const shakeDuration = DEFEAT_SHAKE_DURATION || 1200; // デフォルト値
        const shakeAmplitude = bossObject.displayWidth * 0.03; // 表示幅の3%程度揺らす (調整可能)

        console.log(`[Shake&Fade] Shake params - Duration: ${shakeDuration}, Amplitude: ${shakeAmplitude.toFixed(1)}`);
        try {
            this.tweens.add({
                targets: bossObject,
                props: {
                    x: { value: `+=${shakeAmplitude}`, duration: 50, yoyo: true, ease: 'Sine.easeInOut' },
                    y: { value: `+=${shakeAmplitude * 0.5}`, duration: 60, yoyo: true, ease: 'Sine.easeInOut' } // Y揺れはXより少し小さく
                },
                // シェイクを指定時間繰り返す (loopDelay を使うとより自然な揺れになることも)
                repeat: Math.floor(shakeDuration / (60 + 50)) -1, // (durationY + durationX) の近似値で割る
                // loop: -1, // もしフェードと同時に開始し、フェードで消えるまで揺らし続けるなら
            });
        } catch (e) {
            console.error("Error creating shake tween:", e);
        }

        // --- フェードアウトTween ---
        // DEFEAT_FADE_DURATION は constants.js から取得
        const fadeDuration = DEFEAT_FADE_DURATION || 1500; // デフォルト値
        // シェイクが少し終わってからフェードを開始するか、ほぼ同時に開始するかは演出次第
        // ここではシェイク開始から少し遅れてフェード開始する例
        const fadeDelay = shakeDuration * 0.3; // シェイクが少し進んでからフェード開始 (調整可能)

        console.log(`[Shake&Fade] Fade params - Duration: ${fadeDuration}, Delay: ${fadeDelay.toFixed(0)}`);
        try {
            this.tweens.add({
                targets: bossObject,
                alpha: 0,
                duration: fadeDuration,
                delay: fadeDelay,
                ease: 'Linear',
                onComplete: () => {
                    console.log("[Shake&Fade] Fade tween completed.");
                    // ボスオブジェクトを安全に破棄
                    if (bossObject && bossObject.scene) { // まだシーンに存在するか確認
                        bossObject.destroy();
                        console.log("[Shake&Fade] Boss object destroyed.");
                    }
                    // this.boss の参照もクリア (もしbossObjectがthis.bossと同一なら)
                    if (this.boss === bossObject) {
                        this.boss = null;
                    }

                    // ★ 完了後の処理を分岐 ★
                    if (showPopupAfter) {
                        console.log("[Shake&Fade] Proceeding to showStageClearPopup.");
                        this.showStageClearPopup();
                    } else {
                        console.log("[Shake&Fade] Proceeding to handleBossDefeatCompletion.");
                        this.handleBossDefeatCompletion();
                    }
                }
            });
        } catch (e) {
            console.error("Error creating fade tween:", e);
        }
        console.log("[Shake&Fade] Shake and Fade tweens initiated.");
    }
     // ★★★ 新しいメソッド：ステージクリアポップアップ表示 ★★★
  showStageClearPopup() {
        console.log("[StageClear] Showing Stage Clear Popup for Boss:", this.currentBossIndex);
        this.canProceedToNextStage = false;

        // ★★★ BGMをここで停止 ★★★
        this.stopBgm();
        console.log("[StageClear] BGM stopped.");
        // ★★★------------------★★★

        try {
            this.sound.play(AUDIO_KEYS.SE_STAGE_CLEAR, { volume: 0.8 });
            console.log(`[StageClear] Playing SE_STAGE_CLEAR for Boss ${this.currentBossIndex}.`);
        } catch(e) { console.error("Error playing SE_STAGE_CLEAR in popup:", e); }


        // 既存のポップアップがあれば破棄
        if (this.stageClearPopup) {
            this.stageClearPopup.destroy(true); // グループなら子も破棄
            this.stageClearPopup = null;
        }

        // ポップアップ用のコンテナ（またはグループ）
        this.stageClearPopup = this.add.container(this.gameWidth / 2, this.gameHeight / 2);
        this.stageClearPopup.setDepth(2000); // 最前面に

        // 背景
        const bgGraphics = this.add.graphics();
        bgGraphics.fillStyle(0x336699, 0.6); // 暗めの背景色
        bgGraphics.fillRoundedRect(-this.gameWidth * 0.4, -this.gameHeight * 0.15, this.gameWidth * 0.8, this.gameHeight * 0.3, 20);
        this.stageClearPopup.add(bgGraphics);

        // テキスト
        const clearMessage = `ボス ${this.currentBossIndex} 討伐！`;
        const fontSize = this.calculateDynamicFontSize(40);
        const textStyle = { fontSize: `${fontSize}px`, fill: '#fff', fontFamily: 'MyGameFont, sans-serif', align: 'center' };
        const messageText = this.add.text(0, -this.gameHeight * 0.05, clearMessage, textStyle).setOrigin(0.5);
        this.stageClearPopup.add(messageText);

        const continueMessage = 'タップして次へ';
        const continueFontSize = this.calculateDynamicFontSize(28);
        const continueTextStyle = { fontSize: `${continueFontSize}px`, fill: '#ccc', fontFamily: 'MyGameFont, sans-serif', align: 'center' };
        const continueText = this.add.text(0, this.gameHeight * 0.05, continueMessage, continueTextStyle).setOrigin(0.5);
        this.stageClearPopup.add(continueText);

        // 入力待ちを設定
        this.time.delayedCall(500, () => { // すぐにタップ反応しないように少し遅延
             this.canProceedToNextStage = true; // タップで進めるようにする
             console.log("[StageClear] Popup visible, can proceed to next stage.");
        }, [], this);
    }


    // --- ▲ 登場・撃破演出メソッド群 ▲ ---

    // --- ▼ ゲーム進行メソッド ▼ ---
  // CommonBossScene.js 内

    /**
     * ライフを処理し、ボールをリセットする。
     * アニラ効果でボールが失われた場合はライフを減らさない。
     */
    loseLife() {
        // isPlayerTrulyInvincible は、このメソッドが呼ばれる直前に
        // deactivateAnila によって false になっている「はず」(アニラ効果時間終了の場合)
        // または、updateBallFall でアニラ中にボールが落ちた場合も false になっている。
        // この最初のチェックは、何らかの予期せぬタイミングで isPlayerTrulyInvincible が true のまま
        // loseLife が呼ばれた場合の最終防衛ライン。
        if (this.isPlayerTrulyInvincible) {
            console.log("[LoseLife] Called, but Player True Invincibility is (unexpectedly) STILL ACTIVE. Preventing life loss and attempting to deactivate Anila.");
            this.deactivateAnila(); // 強制的に解除を試みる
            //ボール再生成は行うべきか検討。ここでは行わない。
            return;
        }

        if (this.isGameOver || this.bossDefeated) {
            console.log("[LoseLife] Called, but game is over or boss defeated. Skipping.");
            return;
        }

        // (オプション) 短時間に連続して呼ばれるのを防ぐためのフラグ
        // if (this.isProcessingLifeLoss) return;
        // this.isProcessingLifeLoss = true;

        console.log(">>> loseLife called <<<");

        let actuallyReduceLife = true; // デフォルトではライフを減らす

        // アニラ効果が「たった今」ボールロストによって解除されたかチェック
        if (this.wasAnilaJustDeactivatedByBallLoss) {
            console.log("[LoseLife] Life loss PREVENTED because Anila was just deactivated by ball loss.");
            actuallyReduceLife = false;
            this.wasAnilaJustDeactivatedByBallLoss = false; // フラグを消費して戻す
        }

        if (actuallyReduceLife) {
            if (this.lives > 0) { // ライフが0より大きい場合のみ実際に減らす
                console.log(`Losing life. Current lives: ${this.lives}, Remaining after loss: ${this.lives - 1}`);
                this.lives--; // ★★★ ライフ減少はここ一箇所のみ ★★★
                this.events.emit('updateLives', this.lives);
            } else {
                console.log("[LoseLife] Attempted to lose life, but lives already at 0 or less.");
            }
        }

        // --- 持続系パワーアップ解除 ---
        console.log("[LoseLife] Deactivating persistent power-ups (if any remain).");
        // アニラは上で解除されているか、効果が切れているはずなので、
        // deactivateAnila() をここで再度呼んでも、重複実行防止があれば問題ない。
        this.deactivateAnila(); // 念のため＆タイマーが残っている場合のため
        this.deactivateAnchira(true);
        this.deactivateSindara(null, true);

        console.log("[LoseLife] Deactivating any active Bikara penetration effects.");
        Object.values(this.bikaraTimers).forEach(timer => timer?.remove());
        this.bikaraTimers = {};
        this.balls?.getChildren().forEach(ball => {
             if (ball?.active && ball.getData('isBikaraPenetrating')) {
                 this.setBallPowerUpState(POWERUP_TYPES.BIKARA, false, ball);
             }
        });

        Object.values(this.powerUpTimers).forEach(timer => timer?.remove());
        this.powerUpTimers = {};

        // ボールの状態もリセット (汎用的なパワーアップフラグやlastActivatedPowerなど)
        this.balls?.getChildren().forEach(ball => {
            if(ball?.active) this.resetBallState(ball);
        });
        this.updateBallAndPaddleAppearance(); // ボールとパドルの見た目もリセット

        // --- ボールのクリアと状態リセット ---
        this.isBallLaunched = false; // 新しいボールは未発射状態
        console.log("[LoseLife] Clearing existing balls...");
        this.balls?.clear(true, true); // 古いボールを全て破棄

        // --- 次の処理 ---
        // ライフが0より大きい場合のみボール再生成
        // (アニラでライフが減らなかった場合も this.lives > 0 は true のまま)
        if (this.lives > 0) {
            console.log("[LoseLife] Scheduling resetForNewLife.");
            this.time.delayedCall(800, () => {
                // this.isProcessingLifeLoss = false; // もし使うならここで戻す
                this.resetForNewLife();
            }, [], this);
        } else {
            // ライフが0の場合（実際に減った結果0になった場合）
            console.log("[LoseLife] No lives remaining. Triggering Game Over.");
            // this.isProcessingLifeLoss = false; // もし使うならここで戻す
            this.sound.play(AUDIO_KEYS.SE_GAME_OVER);
            this.stopBgm();
            this.time.delayedCall(500, this.gameOver, [], this);
        }
        console.log("<<< loseLife finished >>>");
    }
       // resetForNewLife メソッド (ボール再生成時にコライダーも更新)
    resetForNewLife() {
        if (this.isGameOver || this.bossDefeated) return;
        console.log("[ResetForNewLife] Resetting for new life...");
        let newBall = null;

        if (this.paddle && this.paddle.active) {
             newBall = this.createAndAddBall(this.paddle.x, this.paddle.y - (this.paddle.displayHeight / 2) - (this.gameWidth * BALL_RADIUS_RATIO));
        } else {
             newBall = this.createAndAddBall(this.scale.width / 2, this.scale.height - PADDLE_Y_OFFSET_RATIO - PADDLE_HEIGHT/2 - (this.gameWidth * BALL_RADIUS_RATIO));
        }
        this.isBallLaunched = false;
        this.playerControlEnabled = true;

        if (newBall && newBall.body) {
            console.log(`[ResetForNewLife] New ball created. Name: ${newBall.name}`);
        } else {
            console.error("[ResetForNewLife] Failed to create new ball or its body!");
        }
        console.log("[ResetForNewLife] Calling setColliders after new ball creation.");
        this.setColliders();
    }

    // CommonBossScene.js 内の gameOver メソッド
// CommonBossScene.js

gameOver() {
    console.log(">>> CommonBossScene gameOver() - Method ENTERED <<<"); // ★最重要ログ1

    if (this._commonGameOverAlreadyCalled) { // 専用フラグで重複防止
        console.warn("[Common GameOver] Already called. Exiting.");
        return;
    }
    this._commonGameOverAlreadyCalled = true; // 呼び出しフラグを立てる
    // this.isGameOver = true; // isGameOver は Boss4Scene で既に true になっているはず

    this.playerControlEnabled = false; // 念のため
    console.log("[Common GameOver] playerControlEnabled set to false.");

    // ゲームオーバーテキストの表示
    console.log("[Common GameOver] Checking gameOverText:", this.gameOverText);
    if (this.gameOverText && this.gameOverText.scene) { // ★シーンに存在するか確認
        console.log(`[Common GameOver] gameOverText exists. Current visible: ${this.gameOverText.visible}, alpha: ${this.gameOverText.alpha}, depth: ${this.gameOverText.depth}`);
        try {
            this.gameOverText.setText("GAME OVER\nTap to Restart"); // テキスト内容を再設定
            this.gameOverText.setVisible(true).setDepth(10001); // 最前面に
            console.log(`[Common GameOver] gameOverText setVisible(true). New visible: ${this.gameOverText.visible}`);
        } catch (e) {
            console.error("!!! ERROR setting gameOverText visible in Common:", e);
        }
    } else {
        console.error("!!! ERROR: this.gameOverText is null, undefined, or already destroyed in Common gameOver() !!!");
        // フォールバックで新しいテキストを生成してみる (デバッグ用)
        try {
            if (this._fallbackGameOverText) this._fallbackGameOverText.destroy();
            this._fallbackGameOverText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, 'GAME OVER (Fallback)\nTap to Restart', { fontSize: '32px', fill: '#f00', align: 'center' }).setOrigin(0.5).setDepth(10001);
            console.log("[Common GameOver] Fallback gameOverText created.");
        } catch (e_fb) {
            console.error("!!! ERROR creating fallback gameOverText:", e_fb);
        }
    }

    // 物理演算やゲームオブジェクトの停止
    console.log("[Common GameOver] Pausing physics and stopping objects...");
    try {
        if (this.physics.world.running) this.physics.pause();
    } catch(e) { console.error("Error pausing physics in Common gameOver:", e); }

    this.balls?.getChildren().forEach(ball => {
        if(ball.active) ball.setVelocity(0,0).setActive(false).setVisible(false);
    });
    this.bossMoveTween?.stop();
    // attackBricks は Boss4Scene で既に止めているかもしれないが、念のため
    // this.attackBricks?.clear(true, true); // 全て破棄

    // 各種タイマーの停止
    console.log("[Common GameOver] Stopping common timers...");
    this.attackBrickTimer?.remove(); this.attackBrickTimer = null;
    this.randomVoiceTimer?.remove(); this.randomVoiceTimer = null;
    // (他にもCommonBossSceneが管理しているタイマーがあればここで停止)

    // ★★★ プレイヤーの入力を待ってタイトルへ戻る処理 ★★★
    console.log("[Common GameOver] Attempting to set up input listener for returnToTitle.");
    try {
        // 既存のリスナーをクリア (特に 'pointerdown')
        // this.input.off('pointerdown'); // 全てのpointerdownをクリアするのは影響が大きいかも
        // this.input.off('pointerdown', this.returnToTitle, this); // 以前のものが残っていればクリア

        this.input.once('pointerdown', () => { // ★アロー関数でラップしてログ追加
            console.log(">>> CommonBossScene gameOver() - POINTERDOWN detected! <<<");
            this.returnToTitle();
        }, this);
        console.log("[Common GameOver] Input listener for returnToTitle SET UP.");
    } catch (e) {
        console.error("!!! ERROR setting up input listener in Common gameOver:", e);
    }
    // ★★★----------------------------------------------------★★★

    console.log("<<< Exiting CommonBossScene gameOver() - Input listener is now active. Waiting for tap. >>>"); // ★最重要ログ2
}

returnToTitle() {
    console.log(">>> CommonBossScene returnToTitle() - Method ENTERED <<<"); // ★最重要ログ3
    try {
        this.stopBgm(); // BGM停止
        console.log("[Common ReturnToTitle] BGM stopped.");
        if (this.scene.isActive('UIScene')) { // UISceneが存在しアクティブなら停止
            this.scene.stop('UIScene');
            console.log("[Common ReturnToTitle] UIScene stopped.");
        }
        console.log("[Common ReturnToTitle] Reloading window...");
        window.location.reload(); // ページリロードでタイトルへ
        // (もしページリロードでなく、this.scene.start('TitleScene') を使う場合は、
        //  このシーンのシャットダウン処理が完全に終わるように注意が必要)
    } catch (e) {
        console.error("!!! ERROR in returnToTitle:", e);
    }
    console.log("<<< Exiting CommonBossScene returnToTitle() - Should have reloaded. >>>"); // このログはリロード後なので出ないはず
}
    triggerGameClear() {
        console.log("GAME CLEAR SEQUENCE TRIGGERED!"); this.stopBgm(); this.sound.play(AUDIO_KEYS.SE_STAGE_CLEAR);
        this.gameClearText?.setText(`全ボス制覇！\nThank you you playing！\n\n残りライフ: ${this.lives}\nハチャメチャ度: ${this.chaosSettings.count} / ${this.chaosSettings.ratePercent}%\n\nタップでタイトルへ`).setVisible(true);
        this.input.once('pointerdown', this.returnToTitle, this);
    }
    
    // --- ▲ ゲーム進行メソッド ▲ ---

    // --- ▼ パワーアップ関連メソッド (主要部分) ▼ ---
 
    setBallPowerUpState(type, isActive, specificBall = null) {
        const targetBalls = specificBall ? [specificBall] : this.balls?.getChildren() ?? [];
        targetBalls.forEach(ball => {
            if (ball?.active && ball.getData) {
                let activePowers = ball.getData('activePowers') || new Set();
                if (isActive) { activePowers.add(type); ball.setData('lastActivatedPower', type); }
                else { activePowers.delete(type); if (ball.getData('lastActivatedPower') === type) ball.setData('lastActivatedPower', Array.from(activePowers).pop() || null); }
                ball.setData('activePowers', activePowers);
                if (type === POWERUP_TYPES.KUBIRA) ball.setData('isKubiraActive', isActive);
                if (type === POWERUP_TYPES.SHATORA) ball.setData('isFast', isActive);
                if (type === POWERUP_TYPES.HAILA) ball.setData('isSlow', isActive);
             //   if (type === POWERUP_TYPES.INDARA) ball.setData('isIndaraActive', isActive);
                if (type === POWERUP_TYPES.BIKARA) { ball.setData('isBikaraPenetrating', isActive); if (!isActive && this.bikaraTimers[ball.name]) { this.bikaraTimers[ball.name].remove(); delete this.bikaraTimers[ball.name]; } }
                if (type === POWERUP_TYPES.SINDARA) ball.setData('isSindaraActive', isActive);
                if (type === POWERUP_TYPES.ANCHIRA) ball.setData('isAnchiraActive', isActive);
                if (type === POWERUP_TYPES.MAKORA) ball.setData('isMakoraActive', isActive);
            }
        });
        if (!specificBall) this.updateBallAndPaddleAppearance();
    }
    updateBallAndPaddleAppearance() {
        this.balls?.getChildren().forEach(ball => { if (ball?.active) this.updateBallAppearance(ball); });
        if (this.paddle?.active) { this.paddle.setTint(this.isAnilaActive ? PADDLE_ANILA_TINT : PADDLE_NORMAL_TINT).setAlpha(this.isAnilaActive ? PADDLE_ANILA_ALPHA : 1.0); }
    }
    updateBallAppearance(ball) {
        if (!ball?.active || !ball.getData) return; let textureKey = 'ball_image';
        const lastPower = ball.getData('lastActivatedPower'); if (lastPower && POWERUP_ICON_KEYS[lastPower]) textureKey = POWERUP_ICON_KEYS[lastPower];
        if (ball.texture.key !== textureKey) ball.setTexture(textureKey); ball.clearTint();
    }
    resetBallState(ball) {
        if (!ball?.active) return; ball.setData({ activePowers: new Set(), lastActivatedPower: null, isKubiraActive: false, isFast: false, isSlow: false, isIndaraActive: false, isBikaraPenetrating: false, isSindaraActive: false, isAnchiraActive: false, isMakoraActive: false });
        if (this.bikaraTimers[ball.name]) { this.bikaraTimers[ball.name].remove(); delete this.bikaraTimers[ball.name]; } this.updateBallAppearance(ball);
    }

    // CommonBossScene.js 内に追加（またはコメントアウト解除）

    /**
     * 一定時間だけ効果を有効にする汎用ヘルパーメソッド
     * @param {string} type パワーアップのタイプ
     * @param {number} duration 効果持続時間 (ms)
     * @param {function} [onStartCallback=null] 効果開始時に実行するコールバック
     * @param {function} [onEndCallback=null] 効果終了時に実行するコールバック
     */
    activateTemporaryEffect(type, duration, onStartCallback = null, onEndCallback = null) {
        console.log(`[TempEffect] Activating temporary effect for ${type} for ${duration}ms.`);

        // 既存の同じタイプのタイマーがあればクリア
        if (this.powerUpTimers[type]) {
            console.log(`[TempEffect] Removing existing timer for ${type}.`);
            this.powerUpTimers[type].remove();
            delete this.powerUpTimers[type]; // 明示的にプロパティも削除
        }

        // 効果開始時の処理
        if (onStartCallback) {
            try {
                onStartCallback();
            } catch (e) {
                console.error(`Error during onStartCallback for ${type}:`, e);
            }
        }

        // ボールにパワーアップ状態を設定 (アイコン表示などのため)
        // (注意: この setBallPowerUpState はボールの見た目を担当。実際の効果は onStart/onEnd で)
        this.setBallPowerUpState(type, true);
        // this.updateBallAndPaddleAppearance(); // 開始時の見た目更新は呼び出し元やsetBallPowerUpState内部で行うことが多い

        // 効果終了タイマーを設定
        this.powerUpTimers[type] = this.time.delayedCall(duration, () => {
            console.log(`[TempEffect] Deactivating temporary effect for ${type}.`);

            // 効果終了時の処理
            if (onEndCallback) {
                try {
                    onEndCallback();
                } catch (e) {
                    console.error(`Error during onEndCallback for ${type}:`, e);
                }
            }

            // ボールのパワーアップ状態を解除
            this.setBallPowerUpState(type, false);
            // this.updateBallAndPaddleAppearance(); // 終了時の見た目更新は呼び出し元やsetBallPowerUpState内部で

            delete this.powerUpTimers[type]; // タイマー参照をクリア
            console.log(`[TempEffect] Timer for ${type} removed.`);
        }, [], this); // this をスコープとして渡す

        // 開始直後の見た目更新 (setBallPowerUpStateが内部で呼ぶか、ここで明示的に呼ぶ)
        this.updateBallAndPaddleAppearance();
    }
    // --- 各パワーアップの activate/deactivate メソッド ---
    activateKubira() { this.activateTemporaryEffect(POWERUP_TYPES.KUBIRA, POWERUP_DURATION[POWERUP_TYPES.KUBIRA]); }
    activateShatora() { this.activateTemporaryEffect(POWERUP_TYPES.SHATORA, POWERUP_DURATION[POWERUP_TYPES.SHATORA], () => this.balls?.getChildren().forEach(b => { if(b.active) this.applySpeedModifier(b, POWERUP_TYPES.SHATORA); }), () => this.balls?.getChildren().forEach(b => { if(b.active) this.resetBallSpeed(b); })); }
    activateHaira() { this.activateTemporaryEffect(POWERUP_TYPES.HAILA, POWERUP_DURATION[POWERUP_TYPES.HAILA], () => this.balls?.getChildren().forEach(b => { if(b.active) this.applySpeedModifier(b, POWERUP_TYPES.HAILA); }), () => this.balls?.getChildren().forEach(b => { if(b.active) this.resetBallSpeed(b); })); }
    activateAnchira() {
        if (this.anchiraTimer) return; const sourceBall = this.keepFurthestBallAndClearOthers(); if (!sourceBall?.active) return;
        const prevData = { ...sourceBall.data.getAll(), activePowers: new Set(sourceBall.getData('activePowers')) }; prevData.activePowers.delete(POWERUP_TYPES.ANCHIRA); prevData.lastActivatedPower = Array.from(prevData.activePowers).pop() || null;
        this.setBallPowerUpState(POWERUP_TYPES.ANCHIRA, true, sourceBall);
        for (let i = 0; i < 3; i++) { const newB = this.createAndAddBall(sourceBall.x + Phaser.Math.Between(-20, 20), sourceBall.y + Phaser.Math.Between(-20, 20), sourceBall.body.velocity.x * Phaser.Math.FloatBetween(0.6, 1.4) + Phaser.Math.Between(-80, 80), sourceBall.body.velocity.y * Phaser.Math.FloatBetween(0.6, 1.2) + Phaser.Math.Between(-80, 20), prevData); if (newB) this.setBallPowerUpState(POWERUP_TYPES.ANCHIRA, true, newB); }
        this.updateBallAndPaddleAppearance(); this.anchiraTimer = this.time.delayedCall(POWERUP_DURATION[POWERUP_TYPES.ANCHIRA], () => this.deactivateAnchira(false), [], this);
    }
    deactivateAnchira(isImmediate = false) {
        if (!this.anchiraTimer && !isImmediate) return; this.anchiraTimer?.remove(); this.anchiraTimer = null;
        const keptBall = this.keepFurthestBallAndClearOthers(); this.balls?.getMatching('active', true).forEach(b => this.setBallPowerUpState(POWERUP_TYPES.ANCHIRA, false, b));
        if (keptBall?.active) this.updateBallAppearance(keptBall); else this.updateBallAndPaddleAppearance();
    }
    activateSindara() {
        const sourceBall = this.keepFurthestBallAndClearOthers(); if (!sourceBall?.active) return;
        const ballData = { ...sourceBall.data.getAll(), activePowers: new Set(sourceBall.getData('activePowers')) }; this.setBallPowerUpState(POWERUP_TYPES.SINDARA, true, sourceBall);
        const newB = this.createAndAddBall(sourceBall.x + Phaser.Math.Between(-15, 15), sourceBall.y + Phaser.Math.Between(-15, 15), sourceBall.body.velocity.x * -0.6 + Phaser.Math.Between(-60, 60), sourceBall.body.velocity.y * 0.7 + Phaser.Math.Between(-60, 10), ballData);
        if (newB) this.setBallPowerUpState(POWERUP_TYPES.SINDARA, true, newB); this.updateBallAndPaddleAppearance();
    }
    deactivateSindara(ballToKeep = null, isImmediate = false) {
        const sindaraBalls = this.balls?.getMatching('isSindaraActive', true) ?? []; if (sindaraBalls.length === 0) return;
        if (!isImmediate && sindaraBalls.length <= 1 && ballToKeep && sindaraBalls.includes(ballToKeep)) this.setBallPowerUpState(POWERUP_TYPES.SINDARA, false, ballToKeep);
        else if (isImmediate || (sindaraBalls.length > 0 && (!ballToKeep || !sindaraBalls.includes(ballToKeep)))) sindaraBalls.forEach(b => this.setBallPowerUpState(POWERUP_TYPES.SINDARA, false, b));
        this.updateBallAndPaddleAppearance();
    }
    activateBikara() { this.balls?.getMatching('active', true).forEach(ball => { if (this.bikaraTimers[ball.name]) this.bikaraTimers[ball.name].remove(); this.setBallPowerUpState(POWERUP_TYPES.BIKARA, true, ball); this.bikaraTimers[ball.name] = this.time.delayedCall(POWERUP_DURATION[POWERUP_TYPES.BIKARA], () => this.deactivateBikara(ball), [], this); }); this.updateBallAndPaddleAppearance(); this.setColliders(); }
    deactivateBikara(ball) { if (!ball?.active || !ball.getData('isBikaraPenetrating')) return; this.setBallPowerUpState(POWERUP_TYPES.BIKARA, false, ball); this.setColliders(); this.updateBallAppearance(ball); }
  activateIndara() {
    console.log("[ActivateIndara] Applying one-time homing effect to all active balls.");
    if (!this.boss || !this.boss.active || !this.balls) {
        console.warn("[ActivateIndara] Boss or balls not available. Skipping effect.");
        return;
    }

    // (オプション) インダラ取得のボイスやSE
    // this.playPowerUpVoice(POWERUP_TYPES.INDARA);

    const activeBalls = this.balls.getMatching('active', true);
    if (activeBalls.length === 0) {
        console.log("[ActivateIndara] No active balls to apply homing to.");
        return;
    }

    activeBalls.forEach(ball => {
        if (ball.body) {
            const currentSpeed = ball.body.velocity.length(); // 現在のボールの速さを維持する
            // または、インダラ専用の固定速度にする場合は以下のように
            // let homingSpeed = (NORMAL_BALL_SPEED || 380) * (this.bossData.indaraSpeedMultiplier || 1.1); // bossDataで倍率指定
            // if (ball.getData('isFast')) homingSpeed *= (BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA] || 1);
            // if (ball.getData('isSlow')) homingSpeed *= (BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA] || 1);
            // homingSpeed = Phaser.Math.Clamp(homingSpeed, NORMAL_BALL_SPEED * 0.5, NORMAL_BALL_SPEED * 2.5); // 速度をClamp

            const angleToBossRad = Phaser.Math.Angle.BetweenPoints(ball, this.boss); // ボールからボスへの角度
            
            try {
                // 現在の速さを維持しつつ方向だけ変える場合
                const newVelocity = new Phaser.Math.Vector2();
                this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angleToBossRad), currentSpeed, newVelocity);
                ball.setVelocity(newVelocity.x, newVelocity.y);
                
                // 固定速度にする場合
                // this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angleToBossRad), homingSpeed, ball.body.velocity);

                console.log(`[ActivateIndara] Ball ${ball.name} direction changed towards boss. New V approx angle: ${Phaser.Math.RadToDeg(angleToBossRad).toFixed(1)}`);
            } catch (e) {
                console.error("[ActivateIndara] Error setting velocity for homing ball:", e);
            }

            // (オプション) インダラ効果が一瞬であることを示すエフェクトをボールに
            // 例えば、一瞬だけ色を変えてすぐ戻すなど
            // const originalTint = ball.tintTopLeft;
            // ball.setTint(0x00ff00); // 緑色に
            // this.time.delayedCall(100, () => {
            //     if (ball.active) ball.clearTint().setTint(originalTint); // 元に戻す
            // });
        }
    });

    // ボールの見た目更新 (もしインダラアイコンを一瞬表示するなら、この後すぐに解除処理が必要)
    // 今回は持続的な状態フラグは不要なので、setBallPowerUpState(INDARA, true) は呼ばないか、
    // 呼んでもすぐにfalseにする。
    // this.setBallPowerUpState(POWERUP_TYPES.INDARA, true); // アイコン表示のため一時的に
    // this.updateBallAndPaddleAppearance();
    // this.time.delayedCall(150, () => { // 0.15秒後にアイコンを消す
    //     this.setBallPowerUpState(POWERUP_TYPES.INDARA, false);
    //     this.updateBallAndPaddleAppearance();
    // });

    // setColliders() の呼び出しは不要 (ボールの衝突特性は変わらないため)
} deactivateIndara(ball) { if (!ball?.active || !ball.getData('isIndaraActive')) return; this.setBallPowerUpState(POWERUP_TYPES.INDARA, false, ball); this.setColliders(); this.updateBallAppearance(ball); }
    // アニラ有効化メソッド (完全版)
    activateAnila() {
        // 既に見た目効果がアクティブならタイマーをリセットするだけ
        if (this.isAnilaActive) {
            console.log("[Anila Activate] Already visually active, resetting duration timer.");
            this.anilaTimer?.remove(); // 既存タイマーがあればクリア
        } else {
            console.log("[Anila Activate] Activating visual effect!");
            this.isAnilaActive = true; // パドルの見た目変更用フラグなど
        }

        // ★ 完全無敵フラグを立てる (これが主要な効果) ★
         this.isPlayerTrulyInvincible = true;
    this.isAnilaActive = true; // 見た目用フラグなども
    console.log("[ActivateAnila] isPlayerTrulyInvincible set to true.");
        // 見た目の変更
        this.updateBallAndPaddleAppearance(); // これでパドルが白くなるなどの処理を期待
        // ボールにANILA状態を設定 (アイコン表示用など)
        this.setBallPowerUpState(POWERUP_TYPES.ANILA, true);

        // 効果時間タイマー設定
        const duration = POWERUP_DURATION[POWERUP_TYPES.ANILA] || 10000;
        console.log(`[Anila Activate] Setting deactivation timer for ${duration}ms.`);
        // 既存のタイマーがあればクリアしてから新しいタイマーを設定
        if (this.anilaTimer) this.anilaTimer.remove();
        this.anilaTimer = this.time.delayedCall(duration, () => {
            console.log(">>> Anila Timer CALLBACK EXECUTED <<<");
            this.deactivateAnila(); // 効果時間が終了したら解除メソッドを呼ぶ
        }, [], this);
    }
      // アニラ無効化メソッド (完全版)
    deactivateAnila() {
        
        console.log(">>> deactivateAnila called <<<");
        // 効果が既に無効なら何もしない (重複呼び出しや手動解除後のタイマー発動に対応)
        if (!this.isAnilaActive && !this.isPlayerTrulyInvincible) {
            console.log("[Anila Deactivate] Already fully inactive. Skipping.");
            return;
        }

        console.log(`[Anila Deactivate] Before deactivation: isAnilaActive: ${this.isAnilaActive}, isPlayerTrulyInvincible: ${this.isPlayerTrulyInvincible}`);

        this.isAnilaActive = false;           // 見た目用フラグ解除
        this.isPlayerTrulyInvincible = false; // ★ 完全無敵フラグOFF ★

        console.log(`[Anila Deactivate] Player True Invincibility DISABLED. isAnilaActive: ${this.isAnilaActive}, isPlayerTrulyInvincible: ${this.isPlayerTrulyInvincible}`);

        // タイマー参照をクリア (タイマー自身はdelayedCallの完了で自動的に消えるが、参照は残る可能性がある)
        if (this.anilaTimer) {
            // this.anilaTimer.remove(); // delayedCall のタイマーは remove しなくても良いが、念のため
            this.anilaTimer = null;
            console.log("[Anila Deactivate] Anila timer reference nulled.");
        }
         this.isPlayerTrulyInvincible = false;
    this.isAnilaActive = false;
    console.log("[DeactivateAnila] isPlayerTrulyInvincible set to false.");

        // ボールのANILA状態を解除 (アイコンなど)
        this.setBallPowerUpState(POWERUP_TYPES.ANILA, false);
        // パドルの見た目を元に戻す
        this.updateBallAndPaddleAppearance();

        console.log("[Anila Deactivate] Anila fully deactivated.");
    }
  
    activateVajra() { if (!this.isVajraSystemActive) { this.isVajraSystemActive = true;
         // ★★★ 完全無敵フラグを解除 ★★★
        this.isPlayerTrulyInvincible = false;
        console.log("[Anila] Player True Invincibility DISABLED.");
        // ★★★--------------------------★★★
        this.vajraGauge = 0; this.events.emit('activateVajraUI', this.vajraGauge, VAJRA_GAUGE_MAX); this.setBallPowerUpState(POWERUP_TYPES.VAJRA, true); this.updateBallAndPaddleAppearance(); } }
    increaseVajraGauge() { if (!this.isVajraSystemActive || this.isGameOver || this.bossDefeated) return; this.vajraGauge = Math.min(this.vajraGauge + VAJRA_GAUGE_INCREMENT, VAJRA_GAUGE_MAX); this.events.emit('updateVajraGauge', this.vajraGauge); if (this.vajraGauge >= VAJRA_GAUGE_MAX) this.triggerVajraOugi(); }
    triggerVajraOugi() { if (!this.isVajraSystemActive) return; this.isVajraSystemActive = false; this.events.emit('deactivateVajraUI'); this.setBallPowerUpState(POWERUP_TYPES.VAJRA, false); this.updateBallAndPaddleAppearance(); this.sound.play(AUDIO_KEYS.VOICE_VAJRA_TRIGGER); if (this.boss?.active) this.applyBossDamage(this.boss, 5, "Vajra Ougi"); }
     
 // activateMakira メソッドを「画面内アイテム全取得」に書き換え
    activateMakira() {
        console.log("[Makira] Activating: Collect all on-screen items!");

        // ボールにマキラのアイコンを一瞬表示させる場合 (任意)
        // this.setBallPowerUpState(POWERUP_TYPES.MAKIRA, true);
        // this.updateBallAndPaddleAppearance();
        // this.time.delayedCall(200, () => { // 0.2秒後にアイコンを戻す
        //     this.setBallPowerUpState(POWERUP_TYPES.MAKIRA, false);
        //     this.updateBallAndPaddleAppearance();
        // }, [], this);

        if (!this.powerUps || this.powerUps.countActive(true) === 0) {
            console.log("[Makira] No active power-ups on screen to collect.");
            return;
        }

        console.log(`[Makira] Found ${this.powerUps.countActive(true)} items to collect.`);

        // ★★★ 画面上の全アクティブなパワーアップアイテムを取得して効果を発動 ★★★
        // getChildren() は配列のコピーを返すので、ループ中に要素を削除しても安全
        const itemsToCollect = [...this.powerUps.getChildren()];
        let collectedCount = 0;

        itemsToCollect.forEach(item => {
            if (item && item.active) { // アイテムがまだアクティブか再確認
                const itemType = item.getData('type');
                if (itemType) {
                    console.log(`[Makira] Automatically collecting item: ${itemType}`);
                    // SEとボイスは collectPowerUp内部で再生されるので、ここでは何もしない
                    // item.destroy() も collectPowerUp内部で行われるか、
                    // あるいは collectPowerUp が item を引数に取るようにしてそこで破棄する。
                    // ここでは、既存の collectPowerUp を呼び出すのが手っ取り早い。
                    // ただし、マキラ自身を再取得しないようにする。
                    if (itemType !== POWERUP_TYPES.MAKIRA) {
                        // this.collectPowerUp(this.paddle, item); // ← これだと item が既に destroy されている可能性がある
                        // 代わりに、アイテムタイプを指定して直接効果を発動するようなヘルパーメソッドを呼ぶ方が安全
                        // 今回は、collectPowerUp の最初の item.destroy() をコメントアウトし、
                        // 取得済みフラグをアイテムに立てるなどで対応も可能だが、
                        // 一旦、直接 collectPowerUp を呼んでみる（SE重複の可能性あり）

                        // collectPowerUpがアイテムを破棄するので、ここで安全に呼び出す
                        // ただし、SEが複数回鳴る可能性がある
                        this.triggerPowerUpEffect(itemType, item); // 新しいヘルパーを想定
                        collectedCount++;
                    } else {
                        console.log("[Makira] Skipping self-collection of Makira item.");
                        // マキラ自身のアイテムは取得せずに消すだけにするなど
                        item.destroy();
                    }
                } else {
                    console.warn("[Makira] Item found without a type, destroying it.", item);
                    item.destroy();
                }
            }
        });
        console.log(`[Makira] Collected ${collectedCount} items.`);
        // マキラ自体は即時効果なので、持続効果のタイマーは不要
    }
 // ★ 新しいヘルパーメソッド: 指定されたタイプのパワーアップ効果を発動し、アイテムを破棄
   // CommonBossScene.js

    // triggerPowerUpEffect メソッドを修正

    /**
     * 指定されたタイプのパワーアップ効果を実際に発動し、対象アイテムを（必要なら）破棄する
     * @param {string} type 発動するパワーアップのタイプ
     * @param {Phaser.Physics.Arcade.Image} [itemObject=null] 取得したアイテムオブジェクト（破棄用、任意）
     */
    triggerPowerUpEffect(type, itemObject = null) {
        if (!type) {
            if (itemObject && itemObject.active) itemObject.destroy();
            return;
        }
        console.log(`[TriggerEffect] Activating effect for: ${type}`);

        // ボイス再生 (アイテムオブジェクトの有無に関わらずタイプで再生)
        this.playPowerUpVoice(type);

        // アイテムオブジェクトがあればここで破棄
        if (itemObject && itemObject.active) {
            console.log(`[TriggerEffect] Destroying itemObject for ${type}`);
            itemObject.destroy();
        }

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
            // MAKIRA の case は activateMakira が直接呼ばれるので、ここには不要
            case POWERUP_TYPES.MAKORA:   this.activateMakora();   break;

            case POWERUP_TYPES.BAISRAVA: // ★★★ バイシュラヴァの新しい効果 ★★★
                console.log("[Baisrava Effect] Destroying all attack bricks and damaging boss!");

                // 1. 画面内の全攻撃ブロックを破壊 (アイテムドロップ・ヴァジラゲージ上昇あり)
                if (this.attackBricks && this.attackBricks.countActive(true) > 0) {
                    const bricksToDestroy = [...this.attackBricks.getChildren()]; // 安全なループのため配列コピー
                    let destroyedBrickCount = 0;
                    bricksToDestroy.forEach(brick => {
                        if (brick && brick.active) {
                            // destroyAttackBrickAndDropItem は内部でヴァジラゲージ増加も行う
                            this.destroyAttackBrickAndDropItem(brick);
                            destroyedBrickCount++;
                        }
                    });
                    console.log(`[Baisrava Effect] Destroyed ${destroyedBrickCount} attack bricks.`);
                } else {
                    console.log("[Baisrava Effect] No active attack bricks to destroy.");
                }

                // 2. ボスに固定1ダメージ
                if (this.boss?.active && !this.boss.getData('isInvulnerable')) {
                    console.log("[Baisrava Effect] Applying 1 damage to boss.");
                    this.applyBossDamage(this.boss, 1, "Baisrava Effect");
                } else {
                    console.log("[Baisrava Effect] Boss inactive or invulnerable, no damage applied.");
                }
                // バイシュラヴァは即時効果なので、ボールの状態変更やタイマーは不要
                break; // ★★★------------------------------------★★★
                 // ★★★ ビカラ陽（ライフ回復）の処理を追加 ★★★
            case POWERUP_TYPES.BIKARA_YANG:
                console.log("[Bikara Yang] Activating: Heal 1 HP!");
                if (this.lives < MAX_PLAYER_LIVES) {    this.lives++;
                    console.log(`[Bikara Yang] HP recovered. Current lives: ${this.lives}`);
                    // UIにライフ更新を通知
                    this.events.emit('updateLives', this.lives);
                    // TODO: 回復エフェクトや専用SEがあればここで再生
                    // this.sound.play('se_heal');
                } else {
                    console.log(`[Bikara Yang] HP already at max (${this.lives}). No recovery.`);
                    // TODO: 最大HP時に取得した場合のフィードバック（音だけ鳴らすなど）
                }
                // ビカラ陽は即時効果なので、ボールの状態変更やタイマーは不要
                break;
            // ★★★------------------------------------★★★
             // ★★★ バドラ（ボール位置リセット、強化維持）の処理を追加 ★★★
            case POWERUP_TYPES.BADRA:
                console.log("[Badra] Activating: Teleport all balls to paddle!");
                if (this.balls && this.balls.countActive(true) > 0 && this.paddle && this.paddle.active) {
                    const paddleX = this.paddle.x;
                    // パドル上部のY座標 (ボールの半径を考慮して少し上に)
                    const targetY = this.paddle.y - (this.paddle.displayHeight / 2) - (this.gameWidth * BALL_RADIUS_RATIO);
                    let teleportedCount = 0;

                    // 全てのアクティブなボールに対して処理
                    // ループ中にボールの状態を変更するので、先に配列にコピーする方が安全
                    const activeBalls = [...this.balls.getMatching('active', true)];

                    activeBalls.forEach(ball => {
                        if (ball && ball.active && ball.body) { // 存在とアクティブ状態、ボディを確認
                            // 1. 速度を0にする
                            ball.setVelocity(0, 0);
                            ball.body.stop(); // 物理的な動きを完全に停止

                            // 2. パドル中央上部に位置をセット
                            ball.setPosition(paddleX, targetY);

                            // 3. isBallLaunched フラグは全ボールがリセットされた後にまとめて false にする
                            teleportedCount++;
                            console.log(`[Badra] Teleported ball ${ball.name} to (${paddleX.toFixed(0)}, ${targetY.toFixed(0)})`);
                        }
                    });

                    if (teleportedCount > 0) {
                        this.isBallLaunched = false; // ボールは再発射が必要な状態になる
                        console.log(`[Badra] ${teleportedCount} balls teleported. isBallLaunched set to false.`);
                    } else {
                        console.log("[Badra] No active balls found to teleport.");
                    }
                } else {
                    console.log("[Badra] No active balls or paddle to perform teleport.");
                }
                // バドラは即時効果なので、ボールの状態変更（アイコンなど）やタイマーは不要
                // ただし、もしボールに「バドラ効果でテレポートした」という一時的なフラグを立てたい場合はここで設定可能
                break;
            // ★★★-------------------------------------------------★★★


            default:
                console.log(`[TriggerEffect] Power up ${type} has no specific activation in triggerPowerUpEffect.`);
                // デフォルトではボールの状態を変更する (アイコン表示など)
                this.setBallPowerUpState(type, true);
                break;
        }
        // 全体的な見た目更新は、個別のactivateXXXメソッド内か、
        // このメソッドの最後にまとめて呼ぶか、呼び出し元(activateMakiraなど)で行う
        this.updateBallAndPaddleAppearance();
    }

    // CommonBossScene.js クラス内に、他のメソッドと同列に追加してください

/**
 * プレイヤーが現在クビラのパワーアップ効果を受けているかを判定します。
 * this.powerUpTimers を参照し、該当するタイマーが存在し、
 * かつまだ完了していない（進行度が1未満）場合にtrueを返します。
 * @returns {boolean} クビラ効果がアクティブであればtrue、そうでなければfalse。
 */
isPlayerKubiraActive() {
    // powerUpTimers プロパティが存在し、オブジェクトであることを確認
    if (this.powerUpTimers && typeof this.powerUpTimers === 'object') {
        // クビラのタイマーイベントを取得
        const kubiraTimerEvent = this.powerUpTimers[POWERUP_TYPES.KUBIRA];

        // タイマーイベントが存在し、PhaserのTimerEventのインスタンスであり、
        // getProgressメソッドを持ち、かつ進行度が1未満（つまり完了していない）かを確認
        if (kubiraTimerEvent &&
            kubiraTimerEvent instanceof Phaser.Time.TimerEvent && // より厳密な型チェック
            typeof kubiraTimerEvent.getProgress === 'function' &&
            kubiraTimerEvent.getProgress() < 1) {
            // console.log("[PowerUpCheck] Kubira effect is ACTIVE.");
            return true;
        }
    }
    // console.log("[PowerUpCheck] Kubira effect is INACTIVE or powerUpTimers not set up correctly.");
    return false;
}

// CommonBossScene.js クラス内に、他のメソッドと同列に追加してください
// (isPlayerKubiraActive や isPowerUpActive の近くが良いでしょう)

/**
 * プレイヤーが現在アニラの「完全無敵」効果を受けているかを判定します。
 * this.isPlayerTrulyInvincible フラグを参照します。
 * @returns {boolean} 完全無敵効果がアクティブであればtrue、そうでなければfalse。
 */
isPlayerAnilaActive() { // メソッド名は isPlayerAnilaActive のままでも良いですが、意味的には isTrulyInvincible
    console.log("[AnilaCheck by Flag] Checking isPlayerTrulyInvincible:", this.isPlayerTrulyInvincible);
    return this.isPlayerTrulyInvincible === true;
}

// (オプション) より汎用的な判定メソッド
/**
 * 指定されたタイプのパワーアップが現在有効かを判定します。
 * @param {string} powerUpType POWERUP_TYPESのいずれかの値
 * @returns {boolean} 指定されたパワーアップ効果がアクティブであればtrue、そうでなければfalse。
 */
isPowerUpActive(powerUpType) {
    if (!powerUpType) return false; // タイプ指定がなければfalse
    if (this.powerUpTimers && typeof this.powerUpTimers === 'object') {
        const timerEvent = this.powerUpTimers[powerUpType];
        if (timerEvent &&
            timerEvent instanceof Phaser.Time.TimerEvent &&
            typeof timerEvent.getProgress === 'function' &&
            timerEvent.getProgress() < 1) {
            return true;
        }
    }
    return false;
}

    // activateMakira メソッド (triggerPowerUpEffect を使うように修正)
    activateMakira() {
        console.log("[Makira] Activating: Collect all on-screen items!");

        if (!this.powerUps || this.powerUps.countActive(true) === 0) {
            console.log("[Makira] No active power-ups on screen to collect.");
            return;
        }
        console.log(`[Makira] Found ${this.powerUps.countActive(true)} items to collect.`);
        const itemsToCollect = [...this.powerUps.getChildren()];
        let collectedCount = 0;

        itemsToCollect.forEach(item => {
            if (item && item.active) {
                const itemType = item.getData('type');
                if (itemType) {
                    if (itemType !== POWERUP_TYPES.MAKIRA) { // マキラ自身は再帰的に発動しない
                        console.log(`[Makira] Automatically triggering effect for item: ${itemType}`);
                        // ★ itemObject を渡して triggerPowerUpEffect を呼び出す ★
                        this.triggerPowerUpEffect(itemType, item); // item はここで破棄される
                        collectedCount++;
                    } else {
                        console.log("[Makira] Skipping self-collection of Makira item.");
                        if (item.active) item.destroy(); // 自分自身のアイテムは消すだけ
                    }
                } else {
                    console.warn("[Makira] Item found without a type, destroying it.", item);
                    if (item.active) item.destroy();
                }
            }
        });
        console.log(`[Makira] Triggered effects for ${collectedCount} items.`);
        // マキラ取得時のボールアイコン変更は任意 (即時効果なので通常は不要)
        // this.setBallPowerUpState(POWERUP_TYPES.MAKIRA, true);
        // this.updateBallAndPaddleAppearance();
        // this.time.delayedCall(100, () => {
        //     this.setBallPowerUpState(POWERUP_TYPES.MAKIRA, false);
        //     this.updateBallAndPaddleAppearance();
        // });
    }

    // collectPowerUp メソッド (triggerPowerUpEffect を呼ぶようにシンプル化も可能)
    collectPowerUp(paddle, powerUp) {
        if (!powerUp?.active || this.isGameOver || this.bossDefeated) return;
        const type = powerUp.getData('type');
        if (!type) {
            if (powerUp.active) powerUp.destroy();
            return;
        }

        // マキラの場合は activateMakira を直接呼ぶ (triggerPowerUpEffect には渡さない)
        if (type === POWERUP_TYPES.MAKIRA) {
            console.log(`Collected power up: ${type} (Special handling for Makira activation)`);
            this.playPowerUpVoice(type); // ボイス再生
            if (powerUp.active) powerUp.destroy(); // アイテムオブジェクトをここで破棄
            this.activateMakira();   // マキラの全取得効果を発動
            return;
        }

        // その他のパワーアップは triggerPowerUpEffect に任せる
        console.log(`Collected power up: ${type} (Passing to triggerPowerUpEffect)`);
        // triggerPowerUpEffect がボイス再生とアイテム破棄を行うので、ここでは何もしない
        this.triggerPowerUpEffect(type, powerUp);
    }
  
   activateMakora() {
        if (!this.balls?.countActive(true)) return; this.setBallPowerUpState(POWERUP_TYPES.MAKORA, true); this.updateBallAndPaddleAppearance();
        const copiedType = Phaser.Utils.Array.GetRandom(MAKORA_COPYABLE_POWERS);
        this.time.delayedCall(MAKORA_COPY_DELAY, () => { this.setBallPowerUpState(POWERUP_TYPES.MAKORA, false); const activateMethodName = `activate${copiedType.charAt(0).toUpperCase() + copiedType.slice(1)}`; if (typeof this[activateMethodName] === 'function') this[activateMethodName](); else { console.warn(`[Makora] No activate function ${activateMethodName} for ${copiedType}`); this.updateBallAndPaddleAppearance(); } }, [], this);
    }
    // CommonBossScene.js またはパワーアップボイスを管理するクラス内

// constructor や init でプロパティ初期化
// this.lastPlayedPowerUpVoiceTime = {}; // パワーアップボイスキーごとの最終再生時刻
// this.powerUpVoiceMargin = 300;       // パワーアップボイスのデフォルトマージン

/**
 * パワーアップ取得ボイスをマージンを考慮して再生試行します。
 * 同じパワーアップボイスキーの音声が指定されたマージン時間内に既に再生されていた場合は再生しません。
 * @param {string} voiceKey 再生するパワーアップボイスのキー
 * @param {object} [soundConfig] this.sound.playに渡す追加のコンフィグ
 * @returns {boolean} 音声が再生された場合はtrue、スキップされた場合はfalse
 */
playPowerUpVoice(voiceKey, soundConfig = {}) {
    // voiceKeyの有効性チェック
    if (!voiceKey || typeof voiceKey !== 'string') {
        console.warn("[PlayPowerUpVoice] Invalid voiceKey provided:", voiceKey);
        return false;
    }
    if (!this.sound.manager) { // サウンドマネージャーの準備確認
        console.warn("[PlayPowerUpVoice] Sound manager not ready.");
        return false;
    }
    if (!this.cache.audio.has(voiceKey)) { // キャッシュに存在するか確認
        console.warn(`[PlayPowerUpVoice] Audio key not found in cache: ${voiceKey}`);
        return false;
    }

    const now = this.time.now;
    // this.lastPlayedPowerUpVoiceTime が初期化されていることを確認
    this.lastPlayedPowerUpVoiceTime = this.lastPlayedPowerUpVoiceTime || {};
    // this.powerUpVoiceMargin が初期化されていることを確認
    const margin = this.powerUpVoiceMargin === undefined ? 300 : this.powerUpVoiceMargin; // デフォルトマージン

    const lastPlayTime = this.lastPlayedPowerUpVoiceTime[voiceKey] || 0;

    if (now - lastPlayTime > margin) {
        try {
            // ★★★ Phaserの sound.play を直接呼び出す ★★★
            this.sound.play(voiceKey, soundConfig);
            // ★★★--------------------------------------★★★
            this.lastPlayedPowerUpVoiceTime[voiceKey] = now; // 最終再生時刻を更新
            console.log(`[PlayPowerUpVoice] Playing: ${voiceKey}`);
            return true;
        } catch (e) {
            console.error(`[PlayPowerUpVoice] Error playing power-up voice ${voiceKey}:`, e);
            return false;
        }
    } else {
        // console.log(`[PlayPowerUpVoice] Skipped (cooldown): ${voiceKey}. Margin: ${margin}ms`);
        return false;
    }
}

    /**
 * アイテム取得ボイスをマージンを考慮して再生試行します。
 * @param {string} voiceKey 再生する音声のキー
 * @param {object} [soundConfig] this.sound.playに渡す追加のコンフィグ
 * @returns {boolean} 再生された場合はtrue
 */
tryPlayItemVoice(voiceKey, soundConfig = {}) {
    if (!voiceKey || !this.sound.manager || !this.cache.audio.has(voiceKey)) {
        // console.warn(`[PlayItemVoice] Invalid key or sound system not ready: ${voiceKey}`);
        return false;
    }
    const now = this.time.now;
    if (now - this.lastPlayedItemVoiceTime > this.itemVoiceMargin) {
        try {
            this.sound.play(voiceKey, soundConfig);
            this.lastPlayedItemVoiceTime = now;
            // console.log(`[PlayItemVoice] Playing: ${voiceKey}`);
            return true;
        } catch (e) {
            console.error(`[PlayItemVoice] Error playing ${voiceKey}:`, e);
            return false;
        }
    } else {
        // console.log(`[PlayItemVoice] Skipped (margin): ${voiceKey}`);
        return false;
    }
}
    // --- ▲ パワーアップ関連メソッド ▲ ---

     // launchBall の再確認
     launchBall() {
        // ★ isBallLaunched と playerControlEnabled のチェックが最初にあるか確認
        if (!this.isBallLaunched && this.playerControlEnabled && this.balls?.countActive(true) > 0) {
            const ballToLaunch = this.balls.getFirstAlive();
            if (ballToLaunch) {
                 console.log(">>> launchBall() called! Launching ball."); // ログ追加
                 ballToLaunch.setVelocity(
                     Phaser.Math.Between(BALL_INITIAL_VELOCITY_X_RANGE[0], BALL_INITIAL_VELOCITY_X_RANGE[1]),
                     BALL_INITIAL_VELOCITY_Y
                 );
                 // ★ isBallLaunched を true にするタイミングが重要 ★
                 this.isBallLaunched = true;
                 this.sound.play(AUDIO_KEYS.SE_LAUNCH);
            }
        } else {
             console.log(">>> launchBall() called but conditions not met (isBallLaunched:", this.isBallLaunched, "playerControlEnabled:", this.playerControlEnabled, ")");
        }
    }



    // --- ▼ 衝突処理メソッド (主要部分) ▼ ---
        // CommonBossScene.js 内

    /**
     * ボールがパドルに衝突した際の処理
     * @param {Phaser.Physics.Arcade.Image} paddle 衝突したパドル
     * @param {Phaser.Physics.Arcade.Image} ball 衝突したボール
     */
    hitPaddle(paddle, ball) {
        if (!paddle || !ball?.active || !ball.body) {
             console.log("[HitPaddle] Collision ignored, invalid object state.");
             return;
        }
        console.log("[HitPaddle] Ball hit detected.");

        // --- 反射角度計算 ---
        let diff = ball.x - paddle.x;
        let influence = Phaser.Math.Clamp(diff / (paddle.displayWidth / 2), -1, 1);
        // パドルの端に当たるほどX方向の影響を強くする（より鋭角に跳ね返る）
        // influence = influence * 1.2; // 例: 影響を少し強くする（任意）
        // influence = Phaser.Math.Clamp(influence, -1, 1); // 念のためClamp

        let newVx = (NORMAL_BALL_SPEED * 0.85) * influence; // X速度の影響度合いを調整
        // Y速度は Pythagoras の定理から計算し、必ず上向きに
        let newVyAbs = Math.sqrt(Math.max(0, Math.pow(NORMAL_BALL_SPEED, 2) - Math.pow(newVx, 2))); // 負にならないようにMax(0,..)
        // Y方向の最低速度を保証（真横に飛ばないように）
        const minVyRatio = 0.3;
        if (newVyAbs < NORMAL_BALL_SPEED * minVyRatio) {
             newVyAbs = NORMAL_BALL_SPEED * minVyRatio;
             // Yが最低速度になった場合、X速度も再計算して全体の速度をNORMAL_BALL_SPEEDに近づける
             newVx = Math.sign(newVx) * Math.sqrt(Math.max(0, Math.pow(NORMAL_BALL_SPEED, 2) - Math.pow(newVyAbs, 2)));
        }
        let newVy = -newVyAbs; // 必ず上向き

        // --- パワーアップによる速度補正 ---
        let speedMultiplier = 1.0;
        if (ball.getData('isFast') === true) {
            speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA];
            console.log("[HitPaddle] Applying Shatora speed multiplier:", speedMultiplier);
        } else if (ball.getData('isSlow') === true) {
            speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA];
            console.log("[HitPaddle] Applying Haila speed multiplier:", speedMultiplier);
        }
        const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier; // 目標速度

        // 最終的な速度ベクトルを計算・正規化・適用
        const finalVel = new Phaser.Math.Vector2(newVx, newVy);
        if (finalVel.lengthSq() === 0) finalVel.set(0, -1); // ゼロベクトル回避
        finalVel.normalize().scale(targetSpeed);

        console.log(`[HitPaddle] Setting velocity to (${finalVel.x.toFixed(1)}, ${finalVel.y.toFixed(1)}), Target Speed: ${targetSpeed.toFixed(0)}`);
        try {
             ball.setVelocity(finalVel.x, finalVel.y);
        } catch(e) { console.error("!!! Error setting velocity in hitPaddle:", e); }

        // --- SEとエフェクト ---
        try { this.sound.play(AUDIO_KEYS.SE_REFLECT, { volume: 0.8 }); } catch (e) { /* ... */ }
        // パドルヒットエフェクト（ボールの下端あたり）
        this.createImpactParticles(ball.x, paddle.getBounds().top, [240, 300], 0xffffcc, 6);

       
    }

      // ★★★ 新しいメソッド：パドルとボスが接触した際の共通処理 ★★★
    // handlePaddleBossContact メソッドを修正
    handlePaddleBossContact(paddle, boss) {
        if (!paddle.active || !boss.active || this.isPaddleInvulnerable) { // ★ パドル無敵中は処理しない
            return;
        }
             // ★★★ 完全無敵チェックを追加 ★★★
        if (this.isPlayerTrulyInvincible) {
            console.log("[PaddleBossContact] Damage avoided due to Player True Invincibility (Anila).");
            // TODO: 無敵ヒットエフェクト (パドル側)
            return;
        }
        // ★★★-------------------------★★★

        if (this.shouldPaddleTakeDamageFromBossContact(paddle, boss)) {
            console.log(`[PaddleBossContact] Paddle contacted boss (${boss.texture.key}) under damage conditions.`);
            this.loseLife();

            // ★★★ パドルに一時的な無敵時間を設定 ★★★
            this.isPaddleInvulnerable = true;
            const paddleInvulnerableDuration = 1000; // 1秒間の無敵 (調整可能)
            console.log(`[PaddleBossContact] Paddle became invulnerable for ${paddleInvulnerableDuration}ms.`);
            // 既存のタイマーがあればクリア
            if (this.paddleInvulnerableTimer) this.paddleInvulnerableTimer.remove();
            this.paddleInvulnerableTimer = this.time.delayedCall(paddleInvulnerableDuration, () => {
                this.isPaddleInvulnerable = false;
                console.log("[PaddleBossContact] Paddle invulnerability ended.");
            }, [], this);
            // ★★★------------------------------------★★★

            // (オプション) パドルが点滅するなどの視覚フィードバック
            this.tweens.add({ targets: paddle, alpha: 0.5, duration: 100, yoyo: true, repeat: Math.floor(paddleInvulnerableDuration / 200) -1 });

        } else {
            // console.log(`[PaddleBossContact] Paddle contacted boss but no damage condition or paddle invulnerable.`);
        }
    }

     // ★★★ プレースホルダーメソッド：ボスシーンでオーバーライドして接触ダメージ条件を定義 ★★★
    /**
     * パドルがボスと接触した際にダメージを受けるべきか判定する。
     * 各ボスシーンで、そのボスの状態（例: 突進中か）に応じて true/false を返すようにオーバーライドする。
     * @param {Phaser.Physics.Arcade.Image} paddle
     * @param {Phaser.Physics.Arcade.Image} boss
     * @returns {boolean} ダメージを受けるべきなら true
     */
    shouldPaddleTakeDamageFromBossContact(paddle, boss) {
        // CommonBossScene ではデフォルトで false (ダメージなし)
        // console.warn(`shouldPaddleTakeDamageFromBossContact not implemented in ${this.scene.key}`);
        return false;
    }

   // CommonBossScene.js

   // CommonBossScene.js
 
    



    /**
     * ボールがボスに衝突した際の処理
     * @param {Phaser.Physics.Arcade.Image} boss 衝突したボスオブジェクト
     * @param {Phaser.Physics.Arcade.Image} ball 衝突したボールオブジェクト
     */
    hitBoss(boss, ball) {
        // オブジェクトと状態の基本的なチェック
        if (!boss || !ball || !boss.active || !ball.active || boss.getData('isInvulnerable')) {
             console.log("[HitBoss] Collision ignored due to invalid state (boss/ball inactive or boss invulnerable).");
             // ボールがアクティブでない場合は何もしないが、無敵のボスに当たったボールは跳ね返すか検討
             return;
        }
        console.log("[HitBoss] Ball hit detected.");

          // ★★★ ボスが無敵の場合の処理を追加 ★★★
        if (boss.getData('isInvulnerable') === true) {
            console.log("[HitBoss] Boss is invulnerable. Ball will be repelled.");
            // ダメージは与えずにボールを跳ね返す処理のみ行う
            if (ball.body) {
                // ボス中心からボール中心へのベクトル
                const repelAngle = Phaser.Math.Angle.Between(boss.x, boss.y, ball.x, ball.y);
                const repelSpeed = NORMAL_BALL_SPEED * 1.5; // 通常より少し弱めに跳ね返すか、同じ強さで
                // 角度から速度ベクトルを計算して設定
                try {
                    this.physics.velocityFromAngle(Phaser.Math.RadToDeg(repelAngle), repelSpeed, ball.body.velocity);
                } catch(e) { console.error("Error setting repel velocity:", e); }

                // (オプション) 無敵ヒットのSEやエフェクト
                // this.sound.play('se_invincible_hit');
                // this.createImpactParticles(ball.x, ball.y, [Phaser.Math.RadToDeg(repelAngle) - 30, Phaser.Math.RadToDeg(repelAngle) + 30], 0xaaaaaa, 3);
            }
            return; // 無敵なのでここで処理終了
        }
        // ★★★----------------------------------★★★

        // --- ダメージ計算 ---
        let damage = 1; // 基本ダメージ
        if (ball.getData('isKubiraActive') === true) { damage += 1; console.log("[HitBoss] Kubira active, damage increased."); }
        // TODO: ビカラ陽などのダメージ増加効果
        // if (ball.getData('bikaraState') === 'yang') { damage = Math.max(damage, 2); }

        // --- ダメージ適用 ---
        console.log(`[HitBoss] Applying ${damage} damage from Ball Hit.`);
        this.applyBossDamage(boss, damage, "Ball Hit");

        // --- ボールへの影響 ---
       if (ball.active && ball.body) { // ボールがまだ存在し、インダラでない場合のみ跳ね返す
            console.log("[HitBoss] Calculating reflection velocity...");
            let speedMultiplier = 1.0;
            if (ball.getData('isFast') === true) { speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA]; }
            else if (ball.getData('isSlow') === true) { speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA]; }
            const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier;

            let bounceVx = ball.body.velocity.x;
            let bounceVy = -ball.body.velocity.y;
            const minBounceSpeedY = NORMAL_BALL_SPEED * 0.4;
            if (Math.abs(bounceVy) < minBounceSpeedY) { bounceVy = -minBounceSpeedY * Math.sign(bounceVy || -1); }
            const bounceVel = new Phaser.Math.Vector2(bounceVx, bounceVy);
            if (bounceVel.lengthSq() === 0) bounceVel.set(0, -1);
            bounceVel.normalize().scale(targetSpeed);

            console.log(`[HitBoss] Reflecting ball with velocity (${bounceVel.x.toFixed(1)}, ${bounceVel.y.toFixed(1)}), targetSpeed: ${targetSpeed.toFixed(0)}`);
            try { ball.setVelocity(bounceVel.x, bounceVel.y); }
            catch (e) { console.error("!!! ERROR setting ball velocity after hitting boss:", e); }
        } else { console.log("[HitBoss] Skipping ball reflection (Indara active or ball/body invalid)."); }
    }

    /**
     * ボスにダメージを与え、リアクションとHP更新、撃破判定を行う
     * @param {Phaser.Physics.Arcade.Image} bossInstance ダメージを受けるボスオブジェクト
     * @param {number} damageAmount ダメージ量
     * @param {string} source ダメージ源を示す文字列（ログ用）
     */
    applyBossDamage(bossInstance, damageAmount, source = "Unknown") {
        if (!bossInstance?.active || bossInstance.getData('isInvulnerable')) {
             console.log(`[Apply Damage - ${source}] Damage (${damageAmount}) blocked: Boss inactive or invulnerable.`);
             return;
        }

        const hpBefore = bossInstance.getData('health');
        console.log(`[Apply Damage - ${source}] HP Before: ${hpBefore}, Damage: ${damageAmount}`);

        // HPが数値でない場合のフォールバック
        let currentHealth;
        if (typeof hpBefore !== 'number' || isNaN(hpBefore)) {
             console.error(`!!! ERROR: Boss HP before damage is invalid (${hpBefore})! Source: ${source}. Resetting HP to 0.`);
             currentHealth = 0; // 不正な値なら強制的に0にする
        } else {
             currentHealth = hpBefore - damageAmount;
        }

        console.log(`[Apply Damage - ${source}] Calculated HP After: ${currentHealth}`);

        // HPがマイナスにならないようにする場合
        currentHealth = Math.max(0, currentHealth);

        // NaNチェック (念のため)
        if (isNaN(currentHealth)) {
            console.error(`!!! ERROR: Calculated health became NaN! Source: ${source}. Setting health to 0.`);
            currentHealth = 0;
        }

        bossInstance.setData('health', currentHealth);
        console.log(`[Apply Damage - ${source}] Set boss data health to: ${currentHealth}`);
        try {
             this.events.emit('updateBossHp', currentHealth, bossInstance.getData('maxHealth'));
        } catch (e) { console.error("Error emitting updateBossHp:", e); }

        // --- ダメージリアクション ---
         const now = this.time.now;
        // ★ ボス固有のダメージボイスを再生 (キーが設定されていれば) ★
        if (now - (this.lastDamageVoiceTime || 0) > BOSS_DAMAGE_VOICE_THROTTLE) {
            if (this.bossData.voiceDamage && typeof this.bossData.voiceDamage === 'string') {
                try {
                    this.sound.play(this.bossData.voiceDamage);
                    console.log(`[ApplyDamage] Playing boss damage voice: ${this.bossData.voiceDamage}`);
                } catch(e) { console.error(`Error playing boss damage voice (${this.bossData.voiceDamage}):`, e); }
            } else {
                 console.log("[ApplyDamage] No specific 'voiceDamage' key for this boss or key is invalid.");
            }
            this.lastDamageVoiceTime = now;
        }
        try {
            bossInstance.setTint(0xff0000); // 赤点滅
            bossInstance.setData('isInvulnerable', true); // 短い無敵時間
            // 揺れ演出
            const shakeAmount = bossInstance.displayWidth * 0.03;
            this.tweens.add({ targets: bossInstance, x: `+=${shakeAmount}`, duration: 40, yoyo: true, ease: 'Sine.InOut', repeat: 1 });
            // 一定時間後にTint解除と無敵解除
            this.time.delayedCall(350, () => {
                 if (bossInstance?.active) { // オブジェクトがまだ存在・アクティブか確認
                     bossInstance.clearTint();
                     bossInstance.setData('isInvulnerable', false);
                 }
            }, [], this);
        } catch (e) { console.error("Error during boss damage reaction:", e); }


        // --- 体力ゼロ判定と撃破処理 ---
       console.log(`[Apply Damage - ${source}] Checking if health <= 0: (${currentHealth} <= 0) is ${currentHealth <= 0}`);
      if (currentHealth <= 0) {
            // ★★★ 既にこのボスが撃破処理に入っていないか、より厳密にチェック ★★★
            // CommonBossSceneの全体的なボス撃破フラグと、
            // Boss2Sceneのような形態変化を持つシーンのフェーズごとの撃破フラグを考慮
            const sceneSpecificDefeatFlag = this.bossDefeatedThisPhase; // Boss2Sceneならこれ、他はundefinedのはず

            if (!this.bossDefeated && !sceneSpecificDefeatFlag) { // 全体もフェーズもまだ倒されていない
                console.log(`[Apply Damage - ${source}] Health is zero or below. Calling handleZeroHealth for boss:`, bossInstance.name || bossInstance.texture.key);
                if (bossInstance.active) {
                    // ★★★ ここで this.bossDefeated を true にしても良いかもしれない (形態変化がないボスの場合) ★★★
                    // ただし、形態変化がある場合は、最終形態が倒された時に true にする
                    this.handleZeroHealth(bossInstance);
                } else {
                    console.warn(`[Apply Damage - ${source}] Boss became inactive BEFORE calling handleZeroHealth!`);
                }
            } else {
                console.log(`[Apply Damage - ${source}] Health is zero or below, BUT defeat sequence already initiated (bossDefeated: ${this.bossDefeated}, sceneSpecificDefeatFlag: ${sceneSpecificDefeatFlag}). Skipping duplicate call.`);
            }
        } else { /* ボス生存 */ }
    }

      /**
     * ボスのHPが0になったときに呼び出される。
     * 形態変化など、通常の defeatBoss とは異なる処理を行いたい場合に各ボスシーンでオーバーライドする。
     * デフォルトでは defeatBoss を呼び出す。
     * @param {Phaser.Physics.Arcade.Image} bossInstance HPが0になったボスオブジェクト
     */
    handleZeroHealth(bossInstance) {
        console.log(`[CommonBossScene] handleZeroHealth called for scene: ${this.scene.key}. Boss:`, bossInstance?.name || bossInstance?.texture?.key);
        // 既にこのボスインスタンスに対する撃破処理が開始されていないか、
        // あるいはシーン全体のボス撃破フラグが立っていないかを確認
        if (!this.bossDefeated && bossInstance && bossInstance.active) { // bossDefeated は CommonBossScene のフラグ
            console.log(`[CommonBossScene] Proceeding with default defeatBoss for boss in ${this.scene.key}.`);
            this.defeatBoss(bossInstance); // デフォルトの撃破処理
        } else {
            console.log(`[CommonBossScene] Defeat process for boss in ${this.scene.key} already initiated or boss invalid. Skipping duplicate defeatBoss call.`);
        }
    }

    hitAttackBrick(brick, ball) { if (!brick?.active || !ball?.active) return;
           // ★★★ ボールが未発射の場合の処理を追加 ★★★
    if (!this.isBallLaunched) {
        console.log("[HitAttackBrick] Hit by brick while ball was NOT launched. Launching ball now.");
        // ボールに初期速度（またはブロックからの反発速度）を与えて発射済みにする
        // ここでは例として、ブロックの真下に少し跳ねるような速度を与える
        const initialVy = ATTACK_BRICK_VELOCITY_Y * 0.5; // ブロック落下速度の半分で上に
        const initialVx = Phaser.Math.Between(-50, 50); // 少し左右にランダム
        ball.setVelocity(initialVx, initialVy);
        this.isBallLaunched = true; // ★ 発射済みフラグを立てる
        this.sound.play(AUDIO_KEYS.SE_LAUNCH); // 発射音

        // 通常のブロック破壊処理も行う
        this.destroyAttackBrickAndDropItem(brick);
        return; // この後のボール速度維持処理などはスキップ
    }
    // ★★★------------------------------------★★★

         this.destroyAttackBrickAndDropItem(brick); }
    handleBallAttackBrickOverlap(brick, ball) { if (!brick?.active || !ball?.active) return;
           // ★★★ ボールが未発射の場合の処理を追加 ★★★
    if (!this.isBallLaunched) {
        console.log("[OverlapAttackBrick] Overlapped by brick while ball was NOT launched. Launching ball now.");
        const initialVy = ATTACK_BRICK_VELOCITY_Y * 0.3; // 少し弱めに
        const initialVx = Phaser.Math.Between(-30, 30);
        ball.setVelocity(initialVx, initialVy);
        this.isBallLaunched = true;
        this.sound.play(AUDIO_KEYS.SE_LAUNCH);

        this.destroyAttackBrick(brick, false); // アイテムドロップなしで破壊
        return;
    }
    // ★★★------------------------------------★★★
        this.destroyAttackBrick(brick, false); }
   // CommonBossScene.js
    destroyAttackBrickAndDropItem(brick) {
        const brickX = brick.x; const brickY = brick.y;

 // ★★★ フックポイント呼び出しと処理 ★★★
    const overrideItemType = this.getOverrideDropItem(brick);

    if (overrideItemType && typeof overrideItemType === 'string') {
        console.log(`[Override Drop] Dropping overridden item: ${overrideItemType} from brick type: ${brick.getData('blockType')}`);
        this.dropSpecificPowerUp(brickX, brickY, overrideItemType); // アイテムを直接ドロップ
        
        // ブロック破壊処理 (アイテムドロップ抽選なしバージョン)
        // (destroyAttackBrick を呼ぶか、ここで直接処理)
        this.sound.play(AUDIO_KEYS.SE_DESTROY);
        this.createImpactParticles(brick.x, brick.y, [0, 360], brick.tintTopLeft || 0xaa88ff, 10); // TODO: 定数化
        brick.destroy();
        this.increaseVajraGauge(); // ヴァジラゲージは増やす

        return; // ★★★ オーバーライドドロップしたのでここで処理終了 ★★★
    }
    // ★★★---------------------------------★★★

        this.destroyAttackBrick(brick, true); // ヴァジラゲージ増加はこの中で

        const dropRatePercent = this.chaosSettings.ratePercent;
        if (Phaser.Math.Between(1, 100) <= dropRatePercent) {
            let itemToDrop = null;
            let currentScene = this.scene.get(this.scene.key); // 現在のボスシーンインスタンスを取得

            // ★★★ 現在のシーンがBoss2Sceneで、ソワカのフィールドがアクティブか確認 ★★★
            // (プロパティに直接アクセスするために currentScene を使う)
            if (currentScene.sys.config === 'Boss2Scene' && currentScene.currentPhase === 'sowaka' && currentScene.sowakaFieldActive && currentScene.sowakaLimitedItemType) {
                itemToDrop = currentScene.sowakaLimitedItemType;
                console.log(`[DropItem - SowakaFieldActive] Dropping limited item: ${itemToDrop}`);
            } else if (this.bossDropPool && this.bossDropPool.length > 0) {
                itemToDrop = Phaser.Utils.Array.GetRandom(this.bossDropPool);
                console.log(`[DropItem - Normal] Dropping item: ${itemToDrop}`);
            }
            // ★★★---------------------------------------------------------★★★

            if (itemToDrop) {
                this.dropSpecificPowerUp(brickX, brickY, itemToDrop);
            } else {
                console.log("[DropItem] No item to drop (pool empty or limited item not set).");
            }
        } else {
             console.log("[DropItem] No item drop based on rate.");
        }
    }

    destroyAttackBrick(brick, triggerItemDropLogic = false) { if (!brick?.active) return; this.sound.play(AUDIO_KEYS.SE_DESTROY); this.createImpactParticles(brick.x,brick.y,[0,360],brick.tintTopLeft||0xaa88ff,10); brick.destroy(); this.increaseVajraGauge(); }
    dropSpecificPowerUp(x,y,type){if(!type||!this.powerUps)return;let tK=POWERUP_ICON_KEYS[type]||'whitePixel';const iS=this.gameWidth*POWERUP_SIZE_RATIO;let tC=(tK==='whitePixel'&&type===POWERUP_TYPES.BAISRAVA)?0xffd700:(tK==='whitePixel'?0xcccccc:null);const pU=this.powerUps.create(x,y,tK).setDisplaySize(iS,iS).setData('type',type);if(tC)pU.setTint(tC);if(pU.body){pU.setVelocity(0,POWERUP_SPEED_Y);pU.body.setCollideWorldBounds(false).setAllowGravity(false);}else if(pU)pU.destroy();}
     handlePaddleHitByAttackBrick(paddle, attackBrick) {
        if (!paddle?.active || !attackBrick?.active) return;
        this.destroyAttackBrick(attackBrick, false);
        if (this.isPlayerTrulyInvincible) { // ★ アニラ完全無敵チェック
            console.log("[PaddleAttackBrick] Damage avoided due to Player True Invincibility (Anila).");
            return;
        }
        if (!this.isGameOver && !this.bossDefeated) this.loseLife();
    }

  hitFamiliarWithBall
    // --- ▼ ヘルパーメソッド (主要部分) ▼ ---
    createAndAddBall(x, y, vx = 0, vy = 0, dataToCopy = null) {
        if (!this.balls) return null;

        // 1. 見た目の半径を計算
        const visualRadius = this.gameWidth * BALL_RADIUS_RATIO;
        const visualDiameter = visualRadius * 2;

        // 2. ★ 当たり判定の半径を計算 (見た目より大きくする) ★
        //    この倍率を調整して当たり判定の大きさを変えます (例: 1.0なら見た目と同じ)
        const hitboxRadiusMultiplier = 3.0; // <--- この値を調整 (例: 1.2, 1.8, 2.0 など)
        const hitboxRadius = visualRadius * hitboxRadiusMultiplier;

        console.log(`[Create Ball] Visual Radius: ${visualRadius.toFixed(1)}, Hitbox Radius: ${hitboxRadius.toFixed(1)} (Multiplier: ${hitboxRadiusMultiplier})`);

        // 3. ボールオブジェクトを生成し、見た目のサイズを設定
        const ball = this.balls.create(x, y, 'ball_image')
            .setOrigin(0.5)
            .setDisplaySize(visualDiameter, visualDiameter); // 見た目のサイズはそのまま

        // 4. 物理ボディを円形にし、計算した「当たり判定の半径」を設定
        if (ball.body) {
             // ★★★ setCircle で当たり判定用の半径 hitboxRadius を使う ★★★
             ball.setCircle(hitboxRadius);
             // ★★★----------------------------------------------------★★★

             // setCircle は通常、GameObjectの中心基準で円を設定するため、
             // 見た目と当たり判定の中心がずれている場合を除き、
             // オフセットの手動調整は不要なことが多いです。
             // もし当たり判定の中心がズレる場合は、以下のコメントアウトを解除して調整してください。
             // const centerOffset = 0; // 基本的にズレないはずなので0
             // ball.body.setOffset(ball.body.offset.x + centerOffset, ball.body.offset.y + centerOffset);

             ball.setVelocity(vx, vy);
             if (!this.isBallLaunched && vx === 0 && vy === 0) {
                 ball.body.stop();
             }
             ball.body.onWorldBounds = true;
             ball.setCollideWorldBounds(true);
             ball.setBounce(1);
        } else {
             console.error(`!!! Failed to get body for ball ${ball.name}`);
             if (ball) ball.destroy();
             return null;
        }

       
    
        ball.setData({ activePowers: dataToCopy?.activePowers ? new Set(dataToCopy.activePowers) : new Set(), lastActivatedPower: dataToCopy?.lastActivatedPower ?? null, isKubiraActive: dataToCopy?.isKubiraActive ?? false, isFast: dataToCopy?.isFast ?? false, isSlow: dataToCopy?.isSlow ?? false, isIndaraActive: dataToCopy?.isIndaraActive ?? false, isBikaraPenetrating: dataToCopy?.isBikaraPenetrating ?? false, isSindaraActive: false, isAnchiraActive: false, isMakoraActive: false });
        ball.name = `ball_${this.balls.getLength()}_${Phaser.Math.RND.uuid()}`; this.updateBallAppearance(ball); return ball;
    }

    
    keepFurthestBallAndClearOthers() { const aB=this.balls?.getMatching('active',true); if(!aB||aB.length===0)return null; if(aB.length===1)return aB[0]; let fB=aB[0],mDSq=-1;const pY=this.paddle?.y??this.gameHeight;aB.forEach(b=>{const dSq=Phaser.Math.Distance.Squared(b.x,b.y,this.paddle?.x??this.gameWidth/2,pY);if(dSq>mDSq){mDSq=dSq;fB=b;}});aB.forEach(b=>{if(b!==fB)b.destroy();});return fB; }
    updatePaddleSize() { if(!this.paddle)return; const nW=this.gameWidth*(this.paddle.getData('originalWidthRatio')||PADDLE_WIDTH_RATIO); this.paddle.setDisplaySize(nW,PADDLE_HEIGHT); const hW=this.paddle.displayWidth/2; this.paddle.x=Phaser.Math.Clamp(this.paddle.x,hW,this.gameWidth-hW); if(this.paddle.body)this.paddle.body.updateFromGameObject(); }
    clampPaddleYPosition() {
        if (!this.paddle) return;
        const paddleHalfHeight = this.paddle.displayHeight / 2;
        // ★ dynamicBottomMargin を考慮に入れる ★
        const minY = this.scale.height - paddleHalfHeight - this.dynamicBottomMargin - 5; // 5px程度の追加マージン
        const maxY = this.gameHeight * 0.75; // 上限は変更なし (または調整)
        const targetY = this.scale.height * (1 - PADDLE_Y_OFFSET_RATIO);
        this.paddle.y = Phaser.Math.Clamp(targetY, maxY, minY);
        if (this.paddle.body) this.paddle.body.updateFromGameObject();
        //log console.log(`[Clamp Paddle Y] Clamped to ${this.paddle.y.toFixed(0)}, Bottom Margin: ${this.dynamicBottomMargin.toFixed(0)}`);
    }

        // CommonBossScene.js のクラス内に以下のメソッドを追加してください

    /**
     * 画面リサイズ時に呼び出されるメソッド
     * @param {Phaser.Structs.Size} gameSize - 新しいゲームサイズオブジェクト (width, height を持つ)
     */
    handleResize(gameSize) {
        // gameSize が渡されない場合 (Phaserのバージョンや呼び出し方による差異吸収)
        if (!gameSize) {
            gameSize = this.scale; // scaleオブジェクト自体がサイズ情報を持つことが多い
        }

     //   console.log(`${this.scene.key} resized to ${gameSize.width}x${gameSize.height}`);

        // 内部の幅・高さを更新
        this.gameWidth = gameSize.width;
        this.gameHeight = gameSize.height;

        // 動的なマージンを再計算 (左右、上部、そして下部隠れ対策)
        this.calculateDynamicMargins(); // 左右・上部マージン用
        this.calculateDynamicBottomMargin(); // 下部隠れ対策用マージン

        // --- ゲーム内要素のサイズと位置を更新 ---

        // 1. パドル
        this.updatePaddleSize(); // 幅と物理ボディを更新、X座標をClamp
        this.clampPaddleYPosition(); // Y座標をマージン考慮でClamp

        // 2. ボス (存在し、アクティブなら)
        if (this.boss?.active) {
            this.updateBossSize(this.boss, this.bossData.textureKey, this.bossData.widthRatio);
            // ボスの動きに関する再計算が必要な場合はここで行う
            // (例: 移動範囲の再計算など。startSpecificBossMovementを再実行するなど)
            // ただし、単純な左右移動なら startSpecificBossMovement 内で
            // this.gameWidth を参照していれば自動的に範囲が変わる可能性あり。要確認。
        }

      
        // 3. ボール (表示サイズと物理ボディサイズを更新)
        this.balls?.getChildren().forEach(ball => {
            if (ball.active) { // アクティブなボールのみ処理
                const newVisualRadius = this.gameWidth * BALL_RADIUS_RATIO;
                const newVisualDiameter = newVisualRadius * 2;

                // ★ 当たり判定の倍率を createAndAddBall と同じにする ★
                const hitboxMultiplier = 3.0; // ← createAndAddBall と同じ値を使用
                const newHitboxRadius = newVisualRadius * hitboxMultiplier;

                try {
                    // 見た目のサイズを更新
                    ball.setDisplaySize(newVisualDiameter, newVisualDiameter);

                    if (ball.body) {
                        // ★ 物理ボディの円サイズも更新 ★
                        ball.setCircle(newHitboxRadius);
                        // ★★★ 設定直後のボディ半径をログ出力 ★★★
   // console.log(`[Resize Ball ${ball.name}] Set Circle Radius: ${newHitboxRadius.toFixed(1)}, Actual Body Radius: ${ball.body.radius.toFixed(1)}`);
    // ★★★--------------------------------★★★
                        // setCircle後はupdateFromGameObjectが必要な場合があるが、
                        // setCircleが内部で呼ぶことも多い。必要ならコメント解除。
                      //  ball.body.updateFromGameObject();
                        // console.log(`[Resize Ball] Updated Visual Size: ${newVisualDiameter.toFixed(1)}, Hitbox Radius: ${newHitboxRadius.toFixed(1)}`);
                    }
                } catch (e) {
                   // console.error("Error updating ball size/body on resize:", e);
                }
            }
        });

        // 4. パワーアップアイテム (表示サイズを更新)
        this.powerUps?.getChildren().forEach(item => {
            if (item.active) {
                 try {
                     item.setDisplaySize(this.gameWidth * POWERUP_SIZE_RATIO, this.gameWidth * POWERUP_SIZE_RATIO);
                     if (item.body) item.body.updateFromGameObject(); // ボディも更新
                 } catch (e) { console.error("Error updating powerup size on resize:", e); }
            }
        });
  // 5. 攻撃ブロック (表示サイズを更新、必要なら)
        this.attackBricks?.getChildren().forEach(brick => {
            // ★★★ brickオブジェクト、texture、widthの存在と有効性をチェック ★★★
            if (brick && brick.active && brick.texture && brick.texture.key !== '__MISSING' && typeof brick.width === 'number' && brick.width > 0) {
                try {
                    // bossData と attackBrickScaleRatio の存在確認とデフォルト値
                    const scaleRatioToUse = (this.bossData && typeof this.bossData.attackBrickScaleRatio === 'number')
                                          ? this.bossData.attackBrickScaleRatio
                                          : (typeof DEFAULT_ATTACK_BRICK_SCALE_RATIO === 'number' ? DEFAULT_ATTACK_BRICK_SCALE_RATIO : 0.08); // 更にフォールバック

                    // desiredScale の計算
                    let desiredScale = (this.gameWidth * scaleRatioToUse) / brick.width;

                    // 計算結果が有効な数値か確認
                    if (!Number.isFinite(desiredScale) || desiredScale <= 0) {
                     //   console.warn(`[Resize AttackBrick] Invalid calculated scale (${desiredScale}) for brick. Using default scale 1.`);
                        desiredScale = 1; // 不正な場合はデフォルトスケール
                    }

                    brick.setScale(desiredScale);
                    if (brick.body) {
                        brick.body.updateFromGameObject();
                    }
                    // console.log(`[Resize AttackBrick] Brick ${brick.texture?.key} resized. Scale: ${desiredScale.toFixed(2)}`); // 成功ログは必要なら
                } catch (e) {
                    // エラーログは既にここでキャッチされているので、内容は同じ
                  //  console.error(`Error updating attack brick (${brick.texture?.key}) size on resize:`, e, "Brick details:", brick);
                }
            } else if (brick && brick.active) {
                // width が不正だった場合のログ
             //   console.warn(`[Resize AttackBrick] Skipping size update for brick due to invalid width or texture. Width: ${brick.width}, Texture: ${brick.texture?.key}`);
            }
        });

        


        // 7. ゲームオーバー/クリアテキストの位置とフォントサイズを更新
        const gameOverFontSize = this.calculateDynamicFontSize(40);
        this.gameOverText?.setPosition(this.gameWidth / 2, this.gameHeight / 2)
                         .setFontSize(`${gameOverFontSize}px`);

        const gameClearFontSize = this.calculateDynamicFontSize(48);
        this.gameClearText?.setPosition(this.gameWidth / 2, this.gameHeight * 0.4)
                          .setFontSize(`${gameClearFontSize}px`)
                          .setWordWrapWidth(this.gameWidth * 0.9); // 折り返し幅も更新

        // 8. UIScene にリサイズとマージン情報を通知
        if (this.scene.isActive('UIScene')) {
            // 'gameResizeWithMargin' イベントを発行し、マージン情報を渡す
            this.events.emit('gameResizeWithMargin', { margin: this.dynamicBottomMargin });
           // console.log("Emitted gameResizeWithMargin event for UIScene.");
        }
    }
    
         // CommonBossScene.js 内

    /**
     * ボスオブジェクトの表示スケール、物理ボディサイズ、オフセットを更新する
     * @param {Phaser.Physics.Arcade.Image} bossInstance 更新対象のボスオブジェクト
     * @param {string} textureKey 使用するテクスチャキー（ログ・確認用）
     * @param {number} widthRatio 画面幅に対するボスの目標表示幅の割合
     */
    updateBossSize(bossInstance, textureKey, widthRatio) {
        // テクスチャとソースの存在チェックを強化
        if (!bossInstance || !bossInstance.texture || !bossInstance.texture.key || bossInstance.texture.key === '__MISSING' || !bossInstance.texture.source || !bossInstance.texture.source[0]?.width) {
          //  console.warn(`[updateBossSize] Invalid bossInstance or texture not ready for key: ${textureKey}. Cannot update size.`);
            if (bossInstance) { // フォールバック
                const fallbackSize = this.gameWidth * 0.2;
                try { bossInstance.setDisplaySize(fallbackSize, fallbackSize); } catch(e) { console.error("Error setting fallback display size:", e); }
               // console.log("[updateBossSize] Applied fallback display size.");
            }
            return;
        }

        const originalWidth = bossInstance.texture.source[0].width;
        const targetBossWidth = this.gameWidth * widthRatio;
        let desiredScale = (originalWidth > 0) ? targetBossWidth / originalWidth : 1;
        desiredScale = Phaser.Math.Clamp(desiredScale, 0.05, 2.0);

        try {
            // 1. 見た目のスケールを設定
            bossInstance.setScale(desiredScale);
           // console.log(`[updateBossSize] Set scale to ${desiredScale.toFixed(3)}`);
          //  console.log(`[updateBossSize] AFTER setScale - Display Size: ${bossInstance.displayWidth?.toFixed(1)}x${bossInstance.displayHeight?.toFixed(1)}`);

            // 2. 物理ボディを GameObject の見た目に合わせる
            if (bossInstance.body) {
                 try {
                     bossInstance.body.updateFromGameObject();
                    // console.log(`[updateBossSize] Updated body from GameObject. Initial Size: ${bossInstance.body.width.toFixed(0)}x${bossInstance.body.height.toFixed(0)}`);

                     // 3. ★★★ ボディのスケールを少しだけ縮小 ★★★
                     const hitboxScaleMultiplier = 0.4; // ← 1.0 より少し小さく (90%にする例)
                     bossInstance.body.transform.scaleX = hitboxScaleMultiplier;
                     bossInstance.body.transform.scaleY = hitboxScaleMultiplier;
                     // スケール変更後はサイズを再計算させる必要があるかもしれない
                     // (Phaserバージョンによるが、通常スケール変更でサイズは自動更新されるはず)
                     // 必要なら: bossInstance.body.setSize(bossInstance.displayWidth * hitboxScaleMultiplier, bossInstance.displayHeight * hitboxScaleMultiplier);
                     // オフセットは自動調整されるはずなので setOffset は不要

                    // console.log(`[updateBossSize] Applied body scale multiplier: ${hitboxScaleMultiplier}. Final Body Size approx: ${(bossInstance.body.width * hitboxScaleMultiplier).toFixed(0)}x${(bossInstance.body.height * hitboxScaleMultiplier).toFixed(0)}`);
                 } catch (e) { console.error("!!! ERROR updating body from GameObject or scaling body:", e); }

            } else {
               // console.warn("[updateBossSize] Boss body does not exist.");
            }
            // ★★★------------------------------------------★★★

        } catch(e) { console.error(`!!! ERROR setting scale in updateBossSize for ${textureKey}:`, e); }
    }

    
      
    applySpeedModifier(ball,type){if(!ball?.active||!ball.body)return;const mod=(type===POWERUP_TYPES.SHATORA)?BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA]:(type===POWERUP_TYPES.HAILA)?BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA]:1.0;const cV=ball.body.velocity;const dir=cV.lengthSq()>0?cV.clone().normalize():new Phaser.Math.Vector2(0,-1);const nS=NORMAL_BALL_SPEED*mod;ball.setVelocity(dir.x*nS,dir.y*nS);}
    resetBallSpeed(ball){if(!ball?.active||!ball.body)return;const cV=ball.body.velocity;const dir=cV.lengthSq()>0?cV.clone().normalize():new Phaser.Math.Vector2(0,-1);ball.setVelocity(dir.x*NORMAL_BALL_SPEED,dir.y*NORMAL_BALL_SPEED);}
    scheduleNextGenericAttackBrick(){if(this.attackBrickTimer)this.attackBrickTimer.remove();this.attackBrickTimer=this.time.addEvent({delay:Phaser.Math.Between(DEFAULT_ATTACK_BRICK_SPAWN_DELAY_MIN,DEFAULT_ATTACK_BRICK_SPAWN_DELAY_MAX),callback:this.spawnGenericAttackBrick,callbackScope:this,loop:false});}
    spawnGenericAttackBrick(){if(!this.attackBricks||!this.boss?.active||this.isGameOver||this.bossDefeated){this.scheduleNextGenericAttackBrick();return;}const sX=Phaser.Math.FloatBetween(0,1)<0.6?Phaser.Math.Between(this.sideMargin,this.gameWidth-this.sideMargin):this.boss.x;const attackBrick=this.attackBricks.create(sX,-30,'attackBrick');if(attackBrick){const bS=this.gameWidth*(DEFAULT_ATTACK_BRICK_SCALE_RATIO||0.08)/attackBrick.width;attackBrick.setScale(bS).setVelocityY(DEFAULT_ATTACK_BRICK_VELOCITY_Y||ATTACK_BRICK_VELOCITY_Y);if(attackBrick.body)attackBrick.body.setAllowGravity(false).setCollideWorldBounds(false);}this.scheduleNextGenericAttackBrick();}
    updateAttackBricks(){this.attackBricks?.getChildren().forEach(b=>{if(b.active&&b.y>this.gameHeight+b.displayHeight)b.destroy();});}
    setupAfterImageEmitter(){if(this.bossAfterImageEmitter)this.bossAfterImageEmitter.destroy();if(!this.boss)return;this.bossAfterImageEmitter=this.add.particles(0,0,'whitePixel',{lifespan:{min:300,max:700},speed:0,scale:{start:this.boss.scale*0.7,end:0.1},alpha:{start:0.6,end:0},quantity:1,frequency:50,blendMode:'ADD',tint:[0xaaaaff,0xaaaaff,0xddddff],emitting:false});this.bossAfterImageEmitter.setDepth(this.boss.depth-1);}
     startRandomVoiceTimer() {
        if (this.randomVoiceTimer) this.randomVoiceTimer.remove();
        // ★ this.bossVoiceKeys は this.bossData.voiceRandom から設定される ★
        //    (initializeBossData の最後で this.bossVoiceKeys に代入済みのはず)
        if (!this.bossVoiceKeys || this.bossVoiceKeys.length === 0) {
            console.warn(`[Random Voice] No random voice keys array (this.bossVoiceKeys) defined for ${this.scene.key}. Check this.bossData.voiceRandom in initializeBossData.`);
            return;
        }
        const playRandomVoice = () => {
            if (this.bossDefeated || this.isGameOver || !this.boss?.active) {
                this.randomVoiceTimer?.remove(); return;
            }
            const randomKey = Phaser.Utils.Array.GetRandom(this.bossVoiceKeys);
            if (randomKey && typeof randomKey === 'string') { // キーが有効かチェック
                try {
                    this.sound.play(randomKey);
                    console.log(`[Random Voice] Playing: ${randomKey}`);
                } catch (e) { console.error(`Error playing random voice ${randomKey}:`, e); }
            } else {
                 console.warn("[Random Voice] Invalid or no key selected from bossVoiceKeys.");
            }
            const nextDelay = Phaser.Math.Between(BOSS_RANDOM_VOICE_MIN_DELAY, BOSS_RANDOM_VOICE_MAX_DELAY);
            this.randomVoiceTimer = this.time.delayedCall(nextDelay, playRandomVoice, [], this);
        };
        const firstDelay = Phaser.Math.Between(BOSS_RANDOM_VOICE_MIN_DELAY / 2, BOSS_RANDOM_VOICE_MAX_DELAY / 2);
        this.randomVoiceTimer = this.time.delayedCall(firstDelay, playRandomVoice, [], this);
        console.log(`[Random Voice] Timer started for keys: [${this.bossVoiceKeys.join(', ')}]`);
    }
 // CommonBossScene.js に追加または修正
calculateDynamicFontSize(baseSizeMax) {
    const divisor = (UI_FONT_SIZE_SCALE_DIVISOR || 18); // constants.jsの値
    const minSize = (UI_FONT_SIZE_MIN || 12); // constants.jsの値
    // ★★★ 計算過程のログを追加 ★★★
 //   console.log(`[Calc Font] Input - baseSizeMax: ${baseSizeMax}, gameWidth: ${this.gameWidth}, divisor: ${divisor}, minSize: ${minSize}`);
    if (this.gameWidth === undefined || this.gameWidth <= 0) {
     //   console.warn("[Calc Font] gameWidth is invalid! Using minSize.");
        return minSize;
    }
    const calculatedSize = Math.floor(this.gameWidth / divisor);
   // console.log(`[Calc Font] Calculated size before clamp: ${calculatedSize}`);
    const finalSize = Phaser.Math.Clamp(calculatedSize, minSize, baseSizeMax);
 //   console.log(`[Calc Font] Final clamped size: ${finalSize}`);
    // ★★★----------------------★★★
    return finalSize;
} 
   // handlePointerMove メソッドを修正
   // CommonBossScene.js の handlePointerMove メソッドを修正

    handlePointerMove(pointer) {
        if (!this.playerControlEnabled || this.isGameOver || !this.paddle?.active) return;

        const targetX = pointer.x;
        const halfWidth = this.paddle.displayWidth / 2;
        const clampedX = Phaser.Math.Clamp(targetX, halfWidth + this.sideMargin/2, this.gameWidth - halfWidth - this.sideMargin/2);
        this.paddle.x = clampedX;

        // ★★★ isBallLaunched が false の時、アクティブなボールが1つだけなら追従させる ★★★
        if (!this.isBallLaunched && this.balls) {
            const activeBalls = this.balls.getMatching('active', true);
            if (activeBalls.length === 1) { // アクティブなボールが1つの場合のみ
                const ballToFollow = activeBalls[0]; // その唯一のボール
                if (ballToFollow && ballToFollow.body) { // 念のためボディも確認
                    ballToFollow.x = clampedX;
                    // Y座標は変更しない（パドル上に固定されているはず）
                }
            } else if (activeBalls.length > 1) {
                // 複数ボールがある場合は、バドラ効果後などを想定し、追従させない
                // (全てのボールがパドル上で静止し、次のタップで一斉発射を待つ)
                console.log("[PointerMove] Multiple balls present and not launched, no X follow.");
            }
        }
    }// handlePointerDown メソッドを修正してポップアップ対応
    handlePointerDown() {
        if (this.isGameOver && this.gameOverText?.visible) {
            this.returnToTitle();
        } else if (this.bossDefeated && this.stageClearPopup && this.canProceedToNextStage) { // ★ ポップアップ表示中かつ進行可能なら
            console.log("[Input] Proceeding to next stage from popup.");
            if (this.stageClearPopup) this.stageClearPopup.destroy(true); // ポップアップを消す
            this.stageClearPopup = null;
            this.canProceedToNextStage = false; // フラグを戻す
            this.handleBossDefeatCompletion();    // 次の処理へ
        } else if (this.bossDefeated && this.gameClearText?.visible) { // ゲームクリア後
            this.returnToTitle();
        } else if (this.playerControlEnabled && this.lives > 0 && !this.isBallLaunched && this.balls?.countActive(true) > 0) {
            this.launchBall();
        }
    }
 // launchBall メソッドを修正 (複数ボール同時発射)
    launchBall() {
        // isBallLaunched と playerControlEnabled のチェック
        if (!this.isBallLaunched && this.playerControlEnabled && this.balls?.countActive(true) > 0) {
            console.log(">>> launchBall() called! Launching ALL active balls. <<<");
            let launchedCount = 0;
            const initialVy = BALL_INITIAL_VELOCITY_Y; // Y方向の初速は共通

            // ★★★ アクティブなボール全てに速度を設定 ★★★
            this.balls.getChildren().forEach(ball => {
                if (ball.active) { // アクティブなボールのみ対象
                    const initialVx = Phaser.Math.Between(BALL_INITIAL_VELOCITY_X_RANGE[0], BALL_INITIAL_VELOCITY_X_RANGE[1]);
                    try {
                        ball.setVelocity(initialVx, initialVy);
                        console.log(`  Launched ball ${ball.name} with V(${initialVx}, ${initialVy})`);
                        launchedCount++;
                    } catch (e) {
                        console.error(`Error setting velocity for ball ${ball.name}:`, e);
                    }
                }
            });
            // ★★★------------------------------------★★★

            if (launchedCount > 0) {
                this.isBallLaunched = true; // 全て発射したらフラグを立てる
                try {
                    this.sound.play(AUDIO_KEYS.SE_LAUNCH);
                } catch (e) { console.error("Error playing launch SE:", e); }
            } else {
                console.log("No active balls were launched.");
            }
        } else {
             console.log(">>> launchBall() called but conditions not met (isBallLaunched:", this.isBallLaunched, "playerControlEnabled:", this.playerControlEnabled, "Active Balls:", this.balls?.countActive(true), ")");
        }
    }





    
       // ボール落下処理 (完全版 - アニラバウンド削除済み)
    updateBallFall() {
        if (!this.balls || !this.balls.active || this.balls.countActive(true) === 0) {
            return;
        }
           let shouldTriggerBallResetCycle = false; // ★ ボール再生成サイクルを開始するかのフラグ
        const currentActiveBalls = [...this.balls.getMatching('active', true)];

        if (currentActiveBalls.length === 0 && this.isBallLaunched) {
            console.log("[UpdateBallFall] No active balls found while ball was launched. Triggering reset cycle.");
            shouldTriggerBallResetCycle = true;
        }

        currentActiveBalls.forEach(currentBall => {
            if (currentBall.active) {
                if (this.isBallLaunched && currentBall.y > this.gameHeight + currentBall.displayHeight * 2) {
                    console.log(`[UpdateBallFall] Ball ${currentBall.name} went out of bounds.`);
                    currentBall.setActive(false).setVisible(false);
                    if (currentBall.body) currentBall.body.enable = false;

                    shouldTriggerBallResetCycle = true; // ボールが落ちたら再生成サイクルへ

                    if (currentBall.getData('isSindaraActive')) {
                        const remainingSindara = this.balls.getMatching('isSindaraActive', true);
                        if (remainingSindara.length === 0) {
                            this.balls.getChildren().forEach(b => {
                                if (b.getData('isSindaraActive')) {
                                    this.setBallPowerUpState(POWERUP_TYPES.SINDARA, false, b);
                                }
                            });
                            this.updateBallAndPaddleAppearance();
                        }
                    }
                       // ★★★ アニラ効果中にボールが落ちた場合の特別処理 ★★★
                    if (this.isPlayerTrulyInvincible) {
                        console.log("[UpdateBallFall] Ball lost during Anila's True Invincibility. Deactivating Anila and preparing for ball reset WITHOUT life loss.");
                        this.deactivateAnila(); // ★ アニラ効果を即座に解除
                        // shouldTriggerBallResetCycle は既に true
                        // ライフは減らさないので、loseLife を直接呼ばないか、特別なフラグで呼ぶ
                        // ここでは、下の共通のボール数チェックで resetForNewLife のみが呼ばれるようにする
                    }
                }
            }
        });

         // ボール再生成サイクルの判定
        if (shouldTriggerBallResetCycle && this.balls.countActive(true) === 0) {
            if (!this.isGameOver && !this.bossDefeated) {
                // ★★★ アニラ無敵が「直前まで」有効だったかを判断 ★★★
                // (deactivateAnilaが呼ばれた直後なら、まだ isPlayerTrulyInvincible は false になっているはず)
                // しかし、この updateBallFall の一連の処理中に deactivateAnila が呼ばれたことを
                // loseLife に伝える必要がある。
                // もっと簡単なのは、loseLife でライフを減らすかどうかを isPlayerTrulyInvincible "だったか"で判断する。
                // ただし、deactivateAnila が isPlayerTrulyInvincible を false にするので、
                // loseLife が呼ばれるときには既に false になっている。

                // 対策：アニラ効果でボールをロストしたことを示す一時的なフラグを使うか、
                // loseLife に引数を渡す。
                // ここでは、loseLife の中で isPlayerTrulyInvincible を再度チェックさせる方針を維持し、
                // deactivateAnila が呼ばれたことを信じる。
                // isPlayerTrulyInvincible は deactivateAnila で false になっているはず。

                // もしアニラでボールを失った直後なら、ライフは減らしたくない。
                // しかし、deactivateAnila で isPlayerTrulyInvincible は false になっている。
                // → loseLife に「ライフを減らさない」オプションを追加するのが一番クリーン。

                if (this.wasAnilaJustDeactivatedByBallLoss) { // ★ このようなフラグを使う
                    console.log("[UpdateBallFall] Anila was just deactivated by ball loss. Resetting ball without life loss.");
                    this.loseLife(true); // true は "don't actually lose life" の意
                    this.wasAnilaJustDeactivatedByBallLoss = false; // フラグを戻す
                } else {
                    console.log("[UpdateBallFall] Ball lost (not due to immediate Anila deactivation). Calling loseLife normally.");
                    this.loseLife(false); // 通常のライフ減少
                }
            }
        }
    }

    // CommonBossScene.js クラス内に追加
/**
 * 攻撃ブロック破壊時に、通常のドロップ抽選をオーバーライドして
 * 特定のアイテムをドロップさせるためのフックメソッド。
 * 各ボスシーンで必要に応じてオーバーライドする。
 * @param {Phaser.Physics.Arcade.Image} brick 破壊された攻撃ブロック
 * @returns {string|null} ドロップさせたいアイテムのタイプ(string)、またはnull(通常ドロップ)
 */
getOverrideDropItem(brick) {
    // デフォルトでは何もオーバーライドしないので、通常のドロップ抽選が行われる
    return null;
}

    handleWorldBounds(body,up,down,left,right){const gO=body.gameObject;if(!gO||!(gO instanceof Phaser.Physics.Arcade.Image)||!gO.active)return;if(this.balls.contains(gO)){if(up||left||right){this.sound.play(AUDIO_KEYS.SE_REFLECT,{volume:0.7});let iX=gO.x,iY=gO.y,aR=[0,0];if(up){iY=body.y;aR=[60,120];}else if(left){iX=body.x;aR=[-30,30];}else if(right){iX=body.x+body.width;aR=[150,210];}this.createImpactParticles(iX,iY,aR,0xffffff,5);}}}
    createImpactParticles(x,y,angleRange,tint,count=8){const p=this.add.particles(0,0,'whitePixel',{x:x,y:y,lifespan:{min:100,max:300},speed:{min:80,max:150},angle:{min:angleRange[0],max:angleRange[1]},gravityY:200,scale:{start:0.6,end:0},quantity:count,blendMode:'ADD',emitting:false});p.setParticleTint(tint);p.explode(count);this.time.delayedCall(400,()=>p.destroy());}
    playBossBgm(){this.stopBgm();const bK=this.bossData.bgmKey||AUDIO_KEYS.BGM2;this.currentBgm=this.sound.add(bK,{loop:true,volume:0.45});try{this.currentBgm.play();}catch(e){console.error(`Error playing BGM ${bK}:`,e);}}
    stopBgm(){if(this.currentBgm){try{this.currentBgm.stop();this.sound.remove(this.currentBgm);}catch(e){console.error("Error stopping BGM:",e);}this.currentBgm=null;}}
     // safeDestroyCollider メソッドを堅牢化
    safeDestroyCollider(colliderRef, name = "collider") {
        // ★ colliderRef が存在し、かつ active プロパティも持っていることを確認 (PhaserのColliderなら持つはず) ★
        if (colliderRef && typeof colliderRef.destroy === 'function' && colliderRef.active !== undefined) {
            console.log(`[SafeDestroy] Attempting to destroy ${name}. Active: ${colliderRef.active}`);
            if (colliderRef.active) { // ★ アクティブな場合のみ destroy を試みる ★
                try {
                    colliderRef.destroy();
                    console.log(`[SafeDestroy] ${name} destroyed.`);
                } catch (e) {
                    console.error(`[SafeDestroy] Error destroying active ${name}:`, e, "Collider Ref was:", colliderRef);
                }
            } else {
                console.log(`[SafeDestroy] ${name} was already inactive.`);
            }
        } else if (colliderRef) {
            console.warn(`[SafeDestroy] ${name} exists but is not a valid active collider or already destroyed (no active prop or destroy func). Ref:`, colliderRef);
        }
        // 呼び出し元でプロパティをnullにするので、ここでは何もしない
    }safeDestroy(obj,name,destroyChildren=false){if(obj&&obj.scene){try{obj.destroy(destroyChildren);}catch(e){console.error(`[Shutdown] Error destroying ${name}:`,e.message);}}obj=null;}
   // shutdownScene メソッドを確認 (変更は不要かもしれないが、呼び出し方を意識)
    shutdownScene() {
        console.log(`--- ${this.scene.key} SHUTDOWN ---`);
        this.stopBgm();
        this.sound.stopAll();
        this.tweens.killAll();
        this.time.removeAllEvents(); // これで paddleInvulnerableTimer などもクリアされるはず

        // イベントリスナー解除
        this.scale.off('resize', this.handleResize, this);
        if (this.physics.world) this.physics.world.off('worldbounds', null, this); // 特定のコンテキストではなく全てのリスナー
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.off('pointerdown', this.handlePointerDown, this);
        this.events.off('shutdown', this.shutdownScene, this);
        this.events.removeAllListeners();

        // コライダー破棄 (setColliders で null にしているので、ここでは再度 destroy する必要はないかもしれない)
        // しかし、シーン終了時には確実に破棄する
        console.log("[Shutdown] Destroying colliders via safeDestroyCollider...");
        this.safeDestroyCollider(this.ballPaddleCollider, "ballPaddleCollider");
        this.safeDestroyCollider(this.ballBossCollider, "ballBossCollider");
        this.safeDestroyCollider(this.ballAttackBrickCollider, "ballAttackBrickCollider");
        this.safeDestroyCollider(this.ballAttackBrickOverlap, "ballAttackBrickOverlap");
        this.safeDestroyCollider(this.paddlePowerUpOverlap, "paddlePowerUpOverlap");
        this.safeDestroyCollider(this.paddleAttackBrickCollider, "paddleAttackBrickCollider");
        this.safeDestroyCollider(this.ballFamiliarCollider, "ballFamiliarCollider");
        // makiraBeamBossOverlap は setColliders で設定していないので不要

        // ゲームオブジェクト破棄
        console.log("[Shutdown] Destroying GameObjects...");
        this.safeDestroy(this.paddle, "paddle");
        this.safeDestroy(this.balls, "balls group", true);
        this.safeDestroy(this.boss, "boss");
        this.safeDestroy(this.attackBricks, "attackBricks group", true);
        this.safeDestroy(this.powerUps, "powerUps group", true);
        this.safeDestroy(this.familiars, "familiars group", true);
        // this.safeDestroy(this.makiraBeams, "makiraBeams group", true); // 削除済みのはず
        this.safeDestroy(this.gameOverText, "gameOverText");
        this.safeDestroy(this.gameClearText, "gameClearText");
        this.safeDestroy(this.stageClearPopup, "stageClearPopup", true); // ポップアップも
        this.safeDestroy(this.bossAfterImageEmitter, "bossAfterImageEmitter");

        // プロパティ参照クリア (重要)
        console.log("[Shutdown] Nullifying references...");
        this.paddle = null; this.balls = null; this.boss = null;
        this.attackBricks = null; this.powerUps = null; this.familiars = null;
        this.gameOverText = null; this.gameClearText = null; this.stageClearPopup = null;
        this.bossAfterImageEmitter = null; this.uiScene = null; this.currentBgm = null;
        this.powerUpTimers = {}; this.bikaraTimers = {}; this.lastPlayedVoiceTime = {};
        this.bossMoveTween = null; this.randomVoiceTimer = null; this.attackBrickTimer = null;
        this.anilaTimer = null; this.anchiraTimer = null; /*this.makiraAttackTimer = null;*/ // マキラタイマーは削除済み
        this.paddleInvulnerableTimer = null; this.isPaddleInvulnerable = false;

        this.ballPaddleCollider = null; this.ballBossCollider = null;
        this.ballAttackBrickCollider = null; this.ballAttackBrickOverlap = null;
        this.paddlePowerUpOverlap = null; this.paddleAttackBrickCollider = null;
        this.ballFamiliarCollider = null;

        console.log(`--- ${this.scene.key} SHUTDOWN Complete ---`);
    }// --- ▲ ヘルパーメソッド ▲ ---
}
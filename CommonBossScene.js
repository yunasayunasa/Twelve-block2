// CommonBossScene.js (ボスラッシュ共通ロジック - インポートエラー対応)
import {
    // --- 画面・オブジェクトサイズ/位置 (割合ベース) ---
    PADDLE_WIDTH_RATIO, PADDLE_Y_OFFSET_RATIO,
    BALL_RADIUS_RATIO, POWERUP_SIZE_RATIO,
    MAKIRA_FAMILIAR_SIZE_RATIO, MAKIRA_FAMILIAR_OFFSET_RATIO,
    MAKIRA_BEAM_WIDTH_RATIO, MAKIRA_BEAM_HEIGHT_RATIO,

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
    VAJRA_GAUGE_MAX, VAJRA_GAUGE_INCREMENT,

    // --- パワーアップ ---
    POWERUP_TYPES, POWERUP_ICON_KEYS, POWERUP_DURATION, // POWERUP_DURATION をインポート
    MAKORA_COPYABLE_POWERS,
    // ANILA_DURATION, ANCHIRA_DURATION, BIKARA_DURATION は POWERUP_DURATION から取得するため個別インポート不要

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
const DEFEAT_FLASH_DURATION = 150;
const DEFEAT_FLASH_INTERVAL = 700;
const DEFEAT_FLASH_COUNT = 3;
const DEFEAT_SHAKE_DURATION = 1200;
const DEFEAT_FADE_DURATION = 1500;

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
        this.isMakiraActive = false;
        this.makiraAttackTimer = null;
        this.familiars = null;
        this.makiraBeams = null;
        this.ALL_POSSIBLE_POWERUPS = Object.values(POWERUP_TYPES); // constants.jsから移動

        // --- ゲーム進行・状態 ---
        this.currentBossIndex = 1;
        this.totalBosses = TOTAL_BOSSES;
        this.chaosSettings = { count: 4, ratePercent: 50 };
        this.isGameOver = false;
        this.gameClearText = null;
        this.gameOverText = null;

        // --- コライダー参照 ---
        this.ballPaddleCollider = null;
        this.ballBossCollider = null;
        this.ballAttackBrickCollider = null;
        this.ballAttackBrickOverlap = null;
        this.paddlePowerUpOverlap = null;
        this.paddleAttackBrickCollider = null;
        this.makiraBeamBossOverlap = null;

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
        this.createMakiraGroups();

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
    
            if (this.boss && this.boss.active) {
                if (this.bossAfterImageEmitter) {
                     this.bossAfterImageEmitter.setPosition(this.boss.x, this.boss.y);
                     if (!this.bossAfterImageEmitter.emitting && this.boss.body?.velocity.lengthSq() > 10) { this.bossAfterImageEmitter.start(); }
                     else if (this.bossAfterImageEmitter.emitting && this.boss.body?.velocity.lengthSq() <= 10) { this.bossAfterImageEmitter.stop(); }
                }
                // ★★★ ボス固有行動の呼び出しを一時的にコメントアウト ★★★
                 console.log("[Update] Calling updateSpecificBossBehavior..."); // 呼び出す前のログ
                 this.updateSpecificBossBehavior(time, delta);
                // ★★★-----------------------------------------------★★★
            }
    
            // --- 残りの update 処理はそのまま実行 ---
            this.updateBallFall();
            this.updateAttackBricks();
            this.updateMakiraBeams();
            this.balls?.getMatching('active', true).forEach(ball => {
                 if (ball.getData('isIndaraActive') && this.boss && this.boss.active && ball.body) {
                     const direction = Phaser.Math.Angle.BetweenPoints(ball.body.center, this.boss.body.center);
                     const homingSpeed = NORMAL_BALL_SPEED * INDARA_HOMING_SPEED_MULTIPLIER;
                     this.physics.velocityFromAngle(Phaser.Math.RadToDeg(direction), homingSpeed, ball.body.velocity);
                 }
            });
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
        // 登場ボイスもここで再生
        try { this.sound.play(this.bossData.voiceAppear || AUDIO_KEYS.VOICE_BOSS_APPEAR); } catch(e) { console.error("Error playing appear voice:", e);}

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
        try { this.sound.play(AUDIO_KEYS.SE_IMPACT_FLASH); } catch(e) { console.error("Impact sound error:", e); } // 衝撃音

        // 2. 演出用クローンを破棄
        fusionGroup.destroy(true); // 子要素も一緒に破棄
        console.log("[Intro Fusion] Clones destroyed.");

        // 3. 本体を表示させ、物理ボディを有効化
        this.finalizeBossAppearanceAndStart();
    }

    // ボス本体の最終的な表示設定とゲームプレイ開始
   finalizeBossAppearanceAndStart() {
        if (!this.boss) { console.error("!!! ERROR: Boss object missing in finalizeBossAppearanceAndStart!"); return; }

        console.log("[Intro Fusion] Finalizing boss appearance...");
        try {
            // 見た目の設定
            this.boss.setPosition(this.gameWidth / 2, this.boss.getData('targetY'));
            this.boss.setScale(this.boss.getData('targetScale'));
            this.boss.setAlpha(1);
            this.boss.setVisible(true);

            // ★ 物理ボディを有効化し、updateFromGameObject で見た目に合わせる ★
            if (this.boss.body) {
                // 1. ボディを有効化し、位置を合わせる
                this.boss.enableBody(true, this.boss.x, this.boss.y, true, true);
                console.log(`[Intro Fusion] Body enabled. Current enabled state: ${this.boss.body.enable}`);

                // 2. updateFromGameObject を呼び出してサイズとオフセットを同期
                try {
                    this.boss.body.updateFromGameObject();
                    console.log(`[Intro Fusion] Body updated from GameObject. Size: ${this.boss.body.width.toFixed(0)}x${this.boss.body.height.toFixed(0)}, Offset: (${this.boss.body.offset.x.toFixed(1)}, ${this.boss.body.offset.y.toFixed(1)})`);
                } catch (e) {
                     console.error("!!! ERROR calling updateFromGameObject in finalize:", e);
                     // エラー発生時のフォールバックとして updateBossSize を呼ぶ？
                     // this.updateBossSize(this.boss, this.bossData.textureKey, this.bossData.widthRatio);
                }
            } else { console.error("!!! ERROR: Boss body missing when finalizing appearance!"); }
            // ★-------------------------------------------------------★

        } catch(e) { console.error("!!! ERROR finalizing boss appearance or enabling body:", e); }

        // --- 戦闘開始 ---
        try { this.sound.play(AUDIO_KEYS.SE_FIGHT_START); } catch(e) { /*...*/ }
        this.time.delayedCall(GAMEPLAY_START_DELAY, this.startGameplay, [], this);
    }


    // startGameplay メソッドは基本的に変更なし
    startGameplay() {
        console.log("[Gameplay Start] Enabling player control.");
        this.playerControlEnabled = true;
        if (this.boss?.body) {
            this.boss.body.enable = true; // 念のため有効化
            console.log(`[Gameplay Start] Boss body enabled: ${this.boss.body.enable}`);
        } else { console.warn("[Gameplay Start] Boss body missing!"); }
        this.startSpecificBossMovement(); // ボス固有の動きを開始
        this.startRandomVoiceTimer();     // 戦闘中ランダムボイス開始
        // updateSpecificBossBehavior が攻撃タイマーを開始することを期待
    }


    // --- ▼▼▼ プレースホルダーメソッド (継承先で実装) ▼▼▼ ---
    initializeBossData() {
        console.warn(`CommonBossScene: initializeBossData() not implemented in ${this.scene.key}`);
        this.bossData = {
            health: COMMON_BOSS_MAX_HEALTH,
            textureKey: 'bossStand',
            negativeKey: 'bossNegative',
            voiceAppear: AUDIO_KEYS.VOICE_BOSS_APPEAR,
            voiceDamage: AUDIO_KEYS.VOICE_BOSS_DAMAGE,
            voiceDefeat: AUDIO_KEYS.VOICE_BOSS_DEFEAT,
            voiceRandom: [AUDIO_KEYS.VOICE_BOSS_RANDOM_1, AUDIO_KEYS.VOICE_BOSS_RANDOM_2, AUDIO_KEYS.VOICE_BOSS_RANDOM_3],
            bgmKey: AUDIO_KEYS.BGM2,
            cutsceneText: `VS BOSS ${this.currentBossIndex}`,
            moveRangeXRatio: DEFAULT_BOSS_MOVE_RANGE_X_RATIO,
            moveDuration: DEFAULT_BOSS_MOVE_DURATION,
            widthRatio: 0.25,
        };
        this.bossVoiceKeys = this.bossData.voiceRandom;
    }

      /**
     * ボスオブジェクトを生成・初期化し、初期の物理ボディ情報を保存する
     * (createSpecificBoss 自体は CommonBossScene にあり、
     *  Boss1Scene などで super.createSpecificBoss() を呼ぶか、
     *  完全にオーバーライドしてこの内容を参考に実装する)
     */
      createSpecificBoss() {
        console.warn(`CommonBossScene: createSpecificBoss() called. Ensure derived scene sets bossData first.`);
        if (this.boss) this.boss.destroy();

        const bossX = this.gameWidth / 2;
        const bossY = this.gameHeight * 0.25;
        const textureKey = this.bossData.textureKey || 'bossStand';

        try {
            this.boss = this.physics.add.image(bossX, bossY, textureKey)
                .setImmovable(true).setVisible(false).setAlpha(0);
            console.log("[CommonBossScene] Boss object created:", this.boss);
            console.log("[CommonBossScene] Boss body object:", this.boss.body);
            if (!this.boss.body) { console.error("!!! CRITICAL: Physics body was NOT created!"); }
        } catch (e) {
            console.error("!!! FATAL ERROR during physics.add.image for boss:", e);
            this.boss = null;
            return; // ボス生成失敗
        }

        if (this.boss) {
            try {
                // データ設定
                this.boss.setData('health', this.bossData.health || DEFAULT_BOSS_MAX_HEALTH);
                this.boss.setData('maxHealth', this.bossData.health || DEFAULT_BOSS_MAX_HEALTH);
                this.boss.setData('isInvulnerable', false);
                this.boss.setData('targetY', bossY);
                console.log("[CommonBossScene] Boss data set."); 
            } catch(e) { console.error("!!! ERROR setting boss data:", e); }

            try {
                // ★ updateBossSize を呼んで初期サイズ/オフセットを設定（見た目準拠）
                this.updateBossSize(this.boss, textureKey, this.bossData.widthRatio || 0.25);
                // ★ ボディ情報の保存は不要になったので削除
                this.boss.setData('targetScale', this.boss.scale); // targetScaleは保存
                console.log("[CommonBossScene] Boss initial size updated using updateBossSize.");
            } catch(e) { console.error("!!! ERROR during initial boss size update / data storage:", e); }
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
        if (!this.attackBrickTimer || this.attackBrickTimer.getProgress() === 1) {
            if (this.playerControlEnabled && this.boss && this.boss.active && !this.bossDefeated && !this.isGameOver) {
                this.scheduleNextGenericAttackBrick();
            }
        }
    }

    handleBossDefeatCompletion() {
        console.log(`--- ${this.scene.key} Boss Defeated Completion ---`);
        if (this.currentBossIndex < this.totalBosses) {
            const nextBossIndex = this.currentBossIndex + 1;
            console.log(`Proceeding to Boss ${nextBossIndex}`);
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
             console.log(`[Dynamic Margin] Calculated bottom margin: ${this.dynamicBottomMargin.toFixed(0)}px`);
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
        console.log(`[Calculate Margins] Top: ${this.topMargin.toFixed(1)}, Side: ${this.sideMargin.toFixed(1)}`);
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
    createMakiraGroups() {
        if (this.familiars) this.familiars.destroy(true); this.familiars = this.physics.add.group({ collideWorldBounds: true, bounceX: 1 });
        if (this.makiraBeams) this.makiraBeams.destroy(true); this.makiraBeams = this.physics.add.group();
    }
    setupBossDropPool() {
        const shuffledPool = Phaser.Utils.Array.Shuffle([...this.ALL_POSSIBLE_POWERUPS]);
        this.bossDropPool = shuffledPool.slice(0, this.chaosSettings.count);
        console.log(`Boss Drop Pool (Count: ${this.chaosSettings.count}): [${this.bossDropPool.join(',')}]`);
        if (this.uiScene?.scene.isActive()) this.events.emit('updateDropPoolUI', this.bossDropPool);
    }
    setColliders() {
        this.safeDestroyCollider(this.ballPaddleCollider); this.safeDestroyCollider(this.ballBossCollider);
        this.safeDestroyCollider(this.ballAttackBrickCollider); this.safeDestroyCollider(this.ballAttackBrickOverlap);
        this.safeDestroyCollider(this.paddlePowerUpOverlap); this.safeDestroyCollider(this.paddleAttackBrickCollider);
        this.safeDestroyCollider(this.makiraBeamBossOverlap);

        if (this.paddle && this.balls) this.ballPaddleCollider = this.physics.add.collider(this.paddle, this.balls, this.hitPaddle, null, this);
        if (this.boss && this.balls) this.ballBossCollider = this.physics.add.collider(this.boss, this.balls, this.hitBoss, (b, ball) => !b.getData('isInvulnerable'), this);
        if (this.paddle && this.powerUps) this.paddlePowerUpOverlap = this.physics.add.overlap(this.paddle, this.powerUps, this.collectPowerUp, null, this);
        if (this.paddle && this.attackBricks) this.paddleAttackBrickCollider = this.physics.add.collider(this.paddle, this.attackBricks, this.handlePaddleHitByAttackBrick, null, this);
        if (this.makiraBeams && this.boss) this.makiraBeamBossOverlap = this.physics.add.overlap(this.makiraBeams, this.boss, this.hitBossWithMakiraBeam, (beam, b) => !b.getData('isInvulnerable'), this);

        let needsCollider = false, needsOverlap = false;
        this.balls?.getMatching('active', true).forEach(ball => {
            if (ball.getData('isIndaraActive') || ball.getData('isBikaraPenetrating')) needsOverlap = true;
            else needsCollider = true;
        });
        if (needsCollider && this.attackBricks && this.balls) this.ballAttackBrickCollider = this.physics.add.collider(this.attackBricks, this.balls, this.hitAttackBrick, (br, ball) => !ball.getData('isIndaraActive') && !ball.getData('isBikaraPenetrating'), this);
        if (needsOverlap && this.attackBricks && this.balls) this.ballAttackBrickOverlap = this.physics.add.overlap(this.attackBricks, this.balls, this.handleBallAttackBrickOverlap, (br, ball) => ball.getData('isIndaraActive') || ball.getData('isBikaraPenetrating'), this);
    }
    createGameOverText() {
        if (this.gameOverText) this.gameOverText.destroy();
        this.gameOverText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '会議は中断されました...\nタップで最初から', { fontSize: `${this.calculateDynamicFontSize(40)}px`, fill: '#f00', align: 'center', stroke: '#000', strokeThickness: 4, fontFamily: 'MyGameFont, sans-serif' }).setOrigin(0.5).setVisible(false).setDepth(1001);
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
    
   

    startGameplay() {
        console.log("[Intro] Enabling player control. Boss fight start!"); this.playerControlEnabled = true;
        if (this.boss?.body) this.boss.body.enable = true; this.startSpecificBossMovement(); this.startRandomVoiceTimer();
    }
    defeatBoss(bossObject) {
        if (this.bossDefeated) return; console.log("[Defeat] Boss defeated! Starting defeat sequence."); this.bossDefeated = true; this.playerControlEnabled = false;
        this.sound.stopAll(); this.randomVoiceTimer?.remove();
        this.safeDestroyCollider(this.ballBossCollider); this.ballBossCollider = null;
        this.safeDestroyCollider(this.makiraBeamBossOverlap); this.makiraBeamBossOverlap = null;
        this.bossMoveTween?.stop(); this.attackBrickTimer?.remove(); this.balls?.children.each(ball => ball.body?.stop());
        if (bossObject?.body) bossObject.disableBody(false, false);
        this.sound.play(this.bossData.voiceDefeat || AUDIO_KEYS.VOICE_BOSS_DEFEAT); this.sound.play(AUDIO_KEYS.SE_DEFEAT_FLASH);
        if (bossObject?.active) try { bossObject.setTexture(this.bossData.negativeKey || 'bossNegative'); } catch (e) { console.error("Error setting negative texture:", e); }
        for (let i = 0; i < DEFEAT_FLASH_COUNT; i++) this.time.delayedCall(i * DEFEAT_FLASH_INTERVAL, () => { if (!this.scene.isActive()) return; this.cameras.main.flash(DEFEAT_FLASH_DURATION, 255, 255, 255); if (i === DEFEAT_FLASH_COUNT - 1) if (bossObject?.active) this.startBossShakeAndFade(bossObject); else this.handleBossDefeatCompletion(); }, [], this);
    }
    startBossShakeAndFade(bossObject) {
        if (!bossObject?.active) { this.handleBossDefeatCompletion(); return; } console.log("[Defeat] Starting shake and fade animation.");
        this.tweens.add({ targets: bossObject, props: { x: { value: `+=${bossObject.displayWidth * 0.05}`, duration: 50, yoyo: true, ease: 'Sine.easeInOut' }, y: { value: `+=${bossObject.displayWidth * 0.025}`, duration: 60, yoyo: true, ease: 'Sine.easeInOut' } }, repeat: Math.floor(DEFEAT_SHAKE_DURATION / 60) });
        this.tweens.add({ targets: bossObject, alpha: 0, duration: DEFEAT_FADE_DURATION, ease: 'Linear', onComplete: () => { bossObject.destroy(); if(this.boss === bossObject) this.boss = null; this.handleBossDefeatCompletion(); } });
    }
    // --- ▲ 登場・撃破演出メソッド群 ▲ ---

    // --- ▼ ゲーム進行メソッド ▼ ---
    loseLife() {
        if (this.isGameOver || this.bossDefeated) return; console.log(`Losing life. Lives remaining: ${this.lives - 1}`);
        this.deactivateMakira(); this.deactivateAnila(); this.deactivateAnchira(true); this.deactivateSindara(null, true);
        Object.values(this.powerUpTimers).forEach(timer => timer?.remove()); this.powerUpTimers = {};
        this.balls?.getChildren().forEach(ball => { if(ball?.active) this.resetBallState(ball); }); this.updateBallAndPaddleAppearance();
        this.lives--; this.events.emit('updateLives', this.lives); this.isBallLaunched = false; this.balls?.clear(true, true);
        if (this.lives > 0) this.time.delayedCall(800, this.resetForNewLife, [], this);
        else { this.sound.play(AUDIO_KEYS.SE_GAME_OVER); this.stopBgm(); this.time.delayedCall(500, this.gameOver, [], this); }
    }
    resetForNewLife() {
        if (this.isGameOver || this.bossDefeated) return;
        if (this.paddle?.active) this.createAndAddBall(this.paddle.x, this.paddle.y - (this.paddle.displayHeight / 2) - (this.gameWidth * BALL_RADIUS_RATIO));
        else this.createAndAddBall(this.gameWidth / 2, this.gameHeight * 0.7);
        this.isBallLaunched = false; this.playerControlEnabled = true;
    }
      // CommonBossScene.js 内の gameOver メソッド
      gameOver() {
        if (this.isGameOver) return;
        console.log(">>> Entering gameOver() <<<");
        this.isGameOver = true;
        this.playerControlEnabled = false;

        console.log("[gameOver] Checking gameOverText object:", this.gameOverText);
        if (this.gameOverText) {
            console.log(`[gameOver] gameOverText visible before setVisible: ${this.gameOverText.visible}, active: ${this.gameOverText.active}, depth: ${this.gameOverText.depth}`);
            try {
                this.gameOverText.setVisible(true);
                console.log(`[gameOver] gameOverText.setVisible(true) called. Now visible: ${this.gameOverText.visible}`);
            } catch (e) { console.error("!!! ERROR setting gameOverText visible:", e); }
        } else { console.error("!!! ERROR: this.gameOverText is null or undefined in gameOver() !!!"); }

        try { if (this.physics.world.running) this.physics.pause(); } catch(e) { console.error("Error pausing physics:", e); }
        this.balls?.children.each(ball => { if(ball.active) ball.setVelocity(0,0).setActive(false); });
        this.bossMoveTween?.pause(); // Tween は pause できる

        // ★★★ タイマーイベントの停止（削除） ★★★
        if (this.attackBrickTimer) {
             try {
                 this.attackBrickTimer.remove(); // pause() ではなく remove()
                 this.attackBrickTimer = null; // 参照もクリア
                 console.log("[gameOver] Attack brick timer removed.");
             } catch (e) { console.error("!!! ERROR removing attackBrickTimer:", e); }
        }
        if (this.randomVoiceTimer) {
             try {
                 this.randomVoiceTimer.remove(); // こちらも remove()
                 this.randomVoiceTimer = null;
                 console.log("[gameOver] Random voice timer removed.");
             } catch (e) { console.error("!!! ERROR removing randomVoiceTimer:", e); }
        }
        // 他にも remove() すべきタイマーがあればここに追加 (パワーアップタイマーなどは loseLife で解除済みのはず)
        // ★★★-----------------------------★★★

        console.log("<<< Exiting gameOver() >>>");
    }
    triggerGameClear() {
        console.log("GAME CLEAR SEQUENCE TRIGGERED!"); this.stopBgm(); this.sound.play(AUDIO_KEYS.SE_STAGE_CLEAR);
        this.gameClearText?.setText(`会議終了！\nお疲れ様でした！\n\n残りライフ: ${this.lives}\nハチャメチャ度: ${this.chaosSettings.count} / ${this.chaosSettings.ratePercent}%\n\nタップでタイトルへ`).setVisible(true);
        this.input.once('pointerdown', this.returnToTitle, this);
    }
    returnToTitle() {
        this.stopBgm(); if (this.scene.isActive('UIScene')) this.scene.stop('UIScene'); window.location.reload();
    }
    // --- ▲ ゲーム進行メソッド ▲ ---

    // --- ▼ パワーアップ関連メソッド (主要部分) ▼ ---
    collectPowerUp(paddle, powerUp) {
        if (!powerUp?.active || this.isGameOver || this.bossDefeated) return; const type = powerUp.getData('type');
        if (!type) { powerUp.destroy(); return; } console.log(`Collected power up: ${type}`); powerUp.destroy();
        if (type === POWERUP_TYPES.SINDARA || type === POWERUP_TYPES.ANCHIRA) { this.deactivateSindara(null, true); this.deactivateAnchira(true); }
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
            case POWERUP_TYPES.BAISRAVA: if (this.boss?.active && !this.boss.getData('isInvulnerable')) this.applyBossDamage(this.boss, 50, "Baisrava"); return;
            default: console.log(`Power up ${type} has no specific activation.`); this.setBallPowerUpState(type, true); break;
        }
        this.updateBallAndPaddleAppearance();
    }
    activateTemporaryEffect(type, duration, onStartCallback, onEndCallback) {
        if (this.powerUpTimers[type]) this.powerUpTimers[type].remove(); onStartCallback?.(); this.setBallPowerUpState(type, true);
        this.powerUpTimers[type] = this.time.delayedCall(duration, () => { onEndCallback?.(); this.setBallPowerUpState(type, false); delete this.powerUpTimers[type]; this.updateBallAndPaddleAppearance(); }, [], this);
        this.updateBallAndPaddleAppearance();
    }
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
                if (type === POWERUP_TYPES.INDARA) ball.setData('isIndaraActive', isActive);
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
    activateIndara() { this.balls?.getMatching('active', true).forEach(ball => this.setBallPowerUpState(POWERUP_TYPES.INDARA, true, ball)); this.updateBallAndPaddleAppearance(); this.setColliders(); }
    deactivateIndara(ball) { if (!ball?.active || !ball.getData('isIndaraActive')) return; this.setBallPowerUpState(POWERUP_TYPES.INDARA, false, ball); this.setColliders(); this.updateBallAppearance(ball); }
    activateAnila() { if (this.isAnilaActive) this.anilaTimer?.remove(); else { this.isAnilaActive = true; this.setBallPowerUpState(POWERUP_TYPES.ANILA, true); } this.anilaTimer = this.time.delayedCall(POWERUP_DURATION[POWERUP_TYPES.ANILA], this.deactivateAnila, [], this); this.updateBallAndPaddleAppearance(); }
    deactivateAnila() { if (!this.isAnilaActive) return; this.isAnilaActive = false; this.anilaTimer?.remove(); this.anilaTimer = null; this.setBallPowerUpState(POWERUP_TYPES.ANILA, false); this.updateBallAndPaddleAppearance(); }
    activateVajra() { if (!this.isVajraSystemActive) { this.isVajraSystemActive = true; this.vajraGauge = 0; this.events.emit('activateVajraUI', this.vajraGauge, VAJRA_GAUGE_MAX); this.setBallPowerUpState(POWERUP_TYPES.VAJRA, true); this.updateBallAndPaddleAppearance(); } }
    increaseVajraGauge() { if (!this.isVajraSystemActive || this.isGameOver || this.bossDefeated) return; this.vajraGauge = Math.min(this.vajraGauge + VAJRA_GAUGE_INCREMENT, VAJRA_GAUGE_MAX); this.events.emit('updateVajraGauge', this.vajraGauge); if (this.vajraGauge >= VAJRA_GAUGE_MAX) this.triggerVajraOugi(); }
    triggerVajraOugi() { if (!this.isVajraSystemActive) return; this.isVajraSystemActive = false; this.events.emit('deactivateVajraUI'); this.setBallPowerUpState(POWERUP_TYPES.VAJRA, false); this.updateBallAndPaddleAppearance(); this.sound.play(AUDIO_KEYS.VOICE_VAJRA_TRIGGER); if (this.boss?.active) this.applyBossDamage(this.boss, 7, "Vajra Ougi"); }
    activateMakira() {
        if (!this.isMakiraActive) { this.isMakiraActive = true; this.familiars?.clear(true, true); this.createFamiliars(); this.makiraBeams?.clear(true, true); this.makiraAttackTimer?.remove(); this.makiraAttackTimer = this.time.addEvent({ delay: MAKIRA_ATTACK_INTERVAL, callback: this.fireMakiraBeam, callbackScope: this, loop: true }); this.setBallPowerUpState(POWERUP_TYPES.MAKIRA, true); }
        if (this.powerUpTimers[POWERUP_TYPES.MAKIRA]) this.powerUpTimers[POWERUP_TYPES.MAKIRA].remove(); this.powerUpTimers[POWERUP_TYPES.MAKIRA] = this.time.delayedCall(POWERUP_DURATION[POWERUP_TYPES.MAKIRA], this.deactivateMakira, [], this);
        this.updateBallAndPaddleAppearance(); this.setColliders();
    }
    deactivateMakira() { if (!this.isMakiraActive) return; this.isMakiraActive = false; this.makiraAttackTimer?.remove(); this.makiraAttackTimer = null; this.powerUpTimers[POWERUP_TYPES.MAKIRA]?.remove(); delete this.powerUpTimers[POWERUP_TYPES.MAKIRA]; this.familiars?.clear(true, true); this.makiraBeams?.clear(true, true); this.setBallPowerUpState(POWERUP_TYPES.MAKIRA, false); this.updateBallAndPaddleAppearance(); this.setColliders(); }
    createFamiliars() {
        if (!this.paddle?.active || !this.familiars) return; const pX = this.paddle.x; const fY = this.paddle.y - (PADDLE_HEIGHT / 2) - (this.gameWidth*MAKIRA_FAMILIAR_SIZE_RATIO); const fS = this.gameWidth*MAKIRA_FAMILIAR_SIZE_RATIO; const fO = this.gameWidth*MAKIRA_FAMILIAR_OFFSET_RATIO;
        [this.familiars.create(pX - fO, fY, 'joykun').setDisplaySize(fS,fS).setImmovable(true), this.familiars.create(pX + fO, fY, 'joykun').setDisplaySize(fS,fS).setImmovable(true)].forEach((fam, i) => { if (fam?.body) { fam.body.setAllowGravity(false).setVelocityX(i===0 ? -FAMILIAR_MOVE_SPEED_X : FAMILIAR_MOVE_SPEED_X).onWorldBounds = true; } else if (fam) fam.destroy(); });
    }
    fireMakiraBeam() { if (!this.isMakiraActive || !this.familiars || this.familiars.countActive(true) === 0) return; this.familiars.getChildren().forEach(fam => { if (fam.active) { const beam = this.makiraBeams.create(fam.x, fam.y - fam.displayHeight/2, 'whitePixel').setDisplaySize(this.gameWidth*MAKIRA_BEAM_WIDTH_RATIO, this.gameHeight*MAKIRA_BEAM_HEIGHT_RATIO).setTint(MAKIRA_BEAM_COLOR); if (beam?.body) beam.setVelocity(0, -MAKIRA_BEAM_SPEED).body.setAllowGravity(false); else if (beam) beam.destroy(); } }); }
    updateMakiraBeams() { this.makiraBeams?.getChildren().forEach(beam => { if (beam.active && beam.y < -beam.displayHeight) beam.destroy(); }); }
    activateMakora() {
        if (!this.balls?.countActive(true)) return; this.setBallPowerUpState(POWERUP_TYPES.MAKORA, true); this.updateBallAndPaddleAppearance();
        const copiedType = Phaser.Utils.Array.GetRandom(MAKORA_COPYABLE_POWERS);
        this.time.delayedCall(MAKORA_COPY_DELAY, () => { this.setBallPowerUpState(POWERUP_TYPES.MAKORA, false); const activateMethodName = `activate${copiedType.charAt(0).toUpperCase() + copiedType.slice(1)}`; if (typeof this[activateMethodName] === 'function') this[activateMethodName](); else { console.warn(`[Makora] No activate function ${activateMethodName} for ${copiedType}`); this.updateBallAndPaddleAppearance(); } }, [], this);
    }
    playPowerUpVoice(type) { let vK = AUDIO_KEYS[`VOICE_${type.toUpperCase()}`]; if (type === POWERUP_TYPES.VAJRA) vK = AUDIO_KEYS.VOICE_VAJRA_GET; if (type === POWERUP_TYPES.BIKARA) vK = AUDIO_KEYS.VOICE_BIKARA_YIN; if (vK && (this.time.now - (this.lastPlayedVoiceTime[vK] || 0) > this.voiceThrottleTime)) try { this.sound.play(vK); this.lastPlayedVoiceTime[vK] = this.time.now; } catch (e) { console.error(`Error playing voice ${vK}:`, e); } }
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
    hitPaddle(paddle, ball) { /* ... (CommonBossScene.js 前回のコードと同様、内容は省略) ... */ if (!paddle || !ball?.active || !ball.body) return; let diff = ball.x - paddle.x; let influence = Phaser.Math.Clamp(diff / (paddle.displayWidth / 2), -1, 1); let newVx = (NORMAL_BALL_SPEED * 0.85) * influence; let newVyAbs = Math.sqrt(Math.pow(NORMAL_BALL_SPEED, 2) - Math.pow(newVx, 2)) || NORMAL_BALL_SPEED * 0.5; let newVy = -Math.abs(newVyAbs); if (Math.abs(newVy) < NORMAL_BALL_SPEED * 0.3) newVy = -NORMAL_BALL_SPEED * 0.3; let speedMultiplier = 1.0; if (ball.getData('isFast')) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA]; else if (ball.getData('isSlow')) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA]; const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier; const finalVel = new Phaser.Math.Vector2(newVx, newVy).normalize().scale(targetSpeed); ball.setVelocity(finalVel.x, finalVel.y); this.sound.play(AUDIO_KEYS.SE_REFLECT); this.createImpactParticles(ball.x, ball.y + ball.displayHeight/2 * 0.8, [240, 300], 0xffffcc); if (ball.getData('isIndaraActive')) this.deactivateIndara(ball); }
    hitBoss(boss, ball) { /* ... (CommonBossScene.js 前回のコードと同様、内容は省略) ... */  if (!boss || !ball?.active || boss.getData('isInvulnerable')) return; let damage = 1; if (ball.getData('isKubiraActive')) damage += 1; this.applyBossDamage(boss, damage, "Ball Hit"); if (ball.getData('isIndaraActive')) this.deactivateIndara(ball); else { let speedMultiplier = 1.0; if (ball.getData('isFast')) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA]; else if (ball.getData('isSlow')) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA]; const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier; const bounceVy = -ball.body.velocity.y; const minBounceSpeedY = NORMAL_BALL_SPEED * 0.4; const finalVy = Math.abs(bounceVy) < minBounceSpeedY ? -minBounceSpeedY * Math.sign(bounceVy || -1) : bounceVy; const finalVel = new Phaser.Math.Vector2(ball.body.velocity.x, finalVy).normalize().scale(targetSpeed); ball.setVelocity(finalVel.x, finalVel.y); } }
    applyBossDamage(bossInstance, damageAmount, source = "Unknown") { /* ... (CommonBossScene.js 前回のコードと同様、内容は省略) ... */ if (!bossInstance?.active || bossInstance.getData('isInvulnerable')) return; let currentHealth = bossInstance.getData('health') - damageAmount; bossInstance.setData('health', currentHealth); this.events.emit('updateBossHp', currentHealth, bossInstance.getData('maxHealth')); console.log(`[Boss Damage] ${damageAmount} by ${source}. HP: ${currentHealth}/${bossInstance.getData('maxHealth')}`); const now = this.time.now; if (now - this.lastDamageVoiceTime > BOSS_DAMAGE_VOICE_THROTTLE) { this.sound.play(this.bossData.voiceDamage || AUDIO_KEYS.VOICE_BOSS_DAMAGE); this.lastDamageVoiceTime = now; } bossInstance.setTint(0xff0000); bossInstance.setData('isInvulnerable', true); this.tweens.add({ targets: bossInstance, x: `+=${bossInstance.displayWidth * 0.03}`, duration: 40, yoyo: true, ease: 'Sine.InOut', repeat: 1 }); this.time.delayedCall(250, () => { if (bossInstance.active) { bossInstance.clearTint(); bossInstance.setData('isInvulnerable', false); } }); if (currentHealth <= 0) this.defeatBoss(bossInstance); }
    hitAttackBrick(brick, ball) { if (!brick?.active || !ball?.active) return; this.destroyAttackBrickAndDropItem(brick); }
    handleBallAttackBrickOverlap(brick, ball) { if (!brick?.active || !ball?.active) return; this.destroyAttackBrick(brick, false); }
    destroyAttackBrickAndDropItem(brick) { const bX=brick.x, bY=brick.y; this.destroyAttackBrick(brick,true); if(Phaser.Math.Between(1,100)<=this.chaosSettings.ratePercent && this.bossDropPool?.length>0){ const pool=this.bossDropPool.filter(t=>t!==POWERUP_TYPES.BAISRAVA); if(pool.length>0)this.dropSpecificPowerUp(bX,bY,Phaser.Utils.Array.GetRandom(pool));} if(Phaser.Math.FloatBetween(0,1)<BAISRAVA_DROP_RATE)this.dropSpecificPowerUp(bX,bY,POWERUP_TYPES.BAISRAVA); }
    destroyAttackBrick(brick, triggerItemDropLogic = false) { if (!brick?.active) return; this.sound.play(AUDIO_KEYS.SE_DESTROY); this.createImpactParticles(brick.x,brick.y,[0,360],brick.tintTopLeft||0xaa88ff,10); brick.destroy(); this.increaseVajraGauge(); }
    dropSpecificPowerUp(x,y,type){if(!type||!this.powerUps)return;let tK=POWERUP_ICON_KEYS[type]||'whitePixel';const iS=this.gameWidth*POWERUP_SIZE_RATIO;let tC=(tK==='whitePixel'&&type===POWERUP_TYPES.BAISRAVA)?0xffd700:(tK==='whitePixel'?0xcccccc:null);const pU=this.powerUps.create(x,y,tK).setDisplaySize(iS,iS).setData('type',type);if(tC)pU.setTint(tC);if(pU.body){pU.setVelocity(0,POWERUP_SPEED_Y);pU.body.setCollideWorldBounds(false).setAllowGravity(false);}else if(pU)pU.destroy();}
    handlePaddleHitByAttackBrick(paddle, attackBrick) { if (!paddle?.active || !attackBrick?.active) return; this.destroyAttackBrick(attackBrick, false); if (!this.isAnilaActive) this.loseLife(); else console.log("[Anila] Paddle hit blocked!"); }
    hitBossWithMakiraBeam(beam, boss) { if (!beam?.active || !boss?.active || boss.getData('isInvulnerable')) return; beam.destroy(); this.applyBossDamage(boss, 1, "Makira Beam"); }
    // --- ▲ 衝突処理メソッド ▲ ---

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
         console.log(`[Clamp Paddle Y] Clamped to ${this.paddle.y.toFixed(0)}, Bottom Margin: ${this.dynamicBottomMargin.toFixed(0)}`);
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

        console.log(`${this.scene.key} resized to ${gameSize.width}x${gameSize.height}`);

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
    console.log(`[Resize Ball ${ball.name}] Set Circle Radius: ${newHitboxRadius.toFixed(1)}, Actual Body Radius: ${ball.body.radius.toFixed(1)}`);
    // ★★★--------------------------------★★★
                        // setCircle後はupdateFromGameObjectが必要な場合があるが、
                        // setCircleが内部で呼ぶことも多い。必要ならコメント解除。
                      //  ball.body.updateFromGameObject();
                        // console.log(`[Resize Ball] Updated Visual Size: ${newVisualDiameter.toFixed(1)}, Hitbox Radius: ${newHitboxRadius.toFixed(1)}`);
                    }
                } catch (e) {
                    console.error("Error updating ball size/body on resize:", e);
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
            if (brick.active) {
                try {
                    // スケールは元のテクスチャサイズに依存するため、単純なsetDisplaySizeより
                    // 再度スケール計算をする方が良い場合がある
                    const desiredScale = (brick.width > 0) ? (this.gameWidth * (this.bossData?.attackBrickScaleRatio || DEFAULT_ATTACK_BRICK_SCALE_RATIO)) / brick.width : 1;
                    brick.setScale(desiredScale);
                    if (brick.body) brick.body.updateFromGameObject();
                } catch (e) { console.error("Error updating attack brick size on resize:", e); }
            }
        });

        // 6. マキラの子機とビーム (表示サイズを更新)
        const familiarSize = this.gameWidth * MAKIRA_FAMILIAR_SIZE_RATIO;
        this.familiars?.getChildren().forEach(fam => {
            if(fam.active) {
                try {
                    fam.setDisplaySize(familiarSize, familiarSize);
                    if(fam.body) fam.body.updateFromGameObject();
                } catch(e) { console.error("Error updating familiar size on resize:", e); }
            }
        });
        const beamWidth = this.gameWidth * MAKIRA_BEAM_WIDTH_RATIO;
        const beamHeight = this.gameHeight * MAKIRA_BEAM_HEIGHT_RATIO;
         this.makiraBeams?.getChildren().forEach(beam => {
             if(beam.active) {
                 try {
                     beam.setDisplaySize(beamWidth, beamHeight);
                     if(beam.body) beam.body.updateFromGameObject();
                 } catch(e) { console.error("Error updating beam size on resize:", e); }
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
            console.log("Emitted gameResizeWithMargin event for UIScene.");
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
            console.warn(`[updateBossSize] Invalid bossInstance or texture not ready for key: ${textureKey}. Cannot update size.`);
            if (bossInstance) { // フォールバック
                const fallbackSize = this.gameWidth * 0.2;
                try { bossInstance.setDisplaySize(fallbackSize, fallbackSize); } catch(e) { console.error("Error setting fallback display size:", e); }
                console.log("[updateBossSize] Applied fallback display size.");
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
            console.log(`[updateBossSize] Set scale to ${desiredScale.toFixed(3)}`);
            console.log(`[updateBossSize] AFTER setScale - Display Size: ${bossInstance.displayWidth?.toFixed(1)}x${bossInstance.displayHeight?.toFixed(1)}`);

            // 2. 物理ボディを GameObject の見た目に合わせる
            if (bossInstance.body) {
                 try {
                     bossInstance.body.updateFromGameObject();
                     console.log(`[updateBossSize] Updated body from GameObject. Initial Size: ${bossInstance.body.width.toFixed(0)}x${bossInstance.body.height.toFixed(0)}`);

                     // 3. ★★★ ボディのスケールを少しだけ縮小 ★★★
                     const hitboxScaleMultiplier = 0.8; // ← 1.0 より少し小さく (90%にする例)
                     bossInstance.body.transform.scaleX = hitboxScaleMultiplier;
                     bossInstance.body.transform.scaleY = hitboxScaleMultiplier;
                     // スケール変更後はサイズを再計算させる必要があるかもしれない
                     // (Phaserバージョンによるが、通常スケール変更でサイズは自動更新されるはず)
                     // 必要なら: bossInstance.body.setSize(bossInstance.displayWidth * hitboxScaleMultiplier, bossInstance.displayHeight * hitboxScaleMultiplier);
                     // オフセットは自動調整されるはずなので setOffset は不要

                     console.log(`[updateBossSize] Applied body scale multiplier: ${hitboxScaleMultiplier}. Final Body Size approx: ${(bossInstance.body.width * hitboxScaleMultiplier).toFixed(0)}x${(bossInstance.body.height * hitboxScaleMultiplier).toFixed(0)}`);
                 } catch (e) { console.error("!!! ERROR updating body from GameObject or scaling body:", e); }

            } else {
                console.warn("[updateBossSize] Boss body does not exist.");
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
    startRandomVoiceTimer(){if(this.randomVoiceTimer)this.randomVoiceTimer.remove();if(!this.bossVoiceKeys||this.bossVoiceKeys.length===0)return;const pRV=()=>{if(this.bossDefeated||this.isGameOver||!this.boss?.active){this.randomVoiceTimer?.remove();return;}this.sound.play(Phaser.Utils.Array.GetRandom(this.bossVoiceKeys));this.randomVoiceTimer=this.time.delayedCall(Phaser.Math.Between(BOSS_RANDOM_VOICE_MIN_DELAY,BOSS_RANDOM_VOICE_MAX_DELAY),pRV,[],this);};this.randomVoiceTimer=this.time.delayedCall(Phaser.Math.Between(BOSS_RANDOM_VOICE_MIN_DELAY/2,BOSS_RANDOM_VOICE_MAX_DELAY/2),pRV,[],this);}
    calculateDynamicFontSize(baseSizeMax){const cS=Math.floor(this.gameWidth/(UI_FONT_SIZE_SCALE_DIVISOR||25));return Phaser.Math.Clamp(cS,UI_FONT_SIZE_MIN,baseSizeMax);}
    handlePointerMove(pointer){if(!this.playerControlEnabled||this.isGameOver||!this.paddle?.active)return;const tX=pointer.x;const hW=this.paddle.displayWidth/2;const cX=Phaser.Math.Clamp(tX,hW+this.sideMargin/2,this.gameWidth-hW-this.sideMargin/2);this.paddle.x=cX;if(!this.isBallLaunched&&this.balls?.countActive(true)>0)this.balls.getFirstAlive().x=cX;}
    handlePointerDown(){if(this.isGameOver&&this.gameOverText?.visible)this.returnToTitle();else if(this.bossDefeated&&this.gameClearText?.visible)this.returnToTitle();else if(this.playerControlEnabled&&this.lives>0&&!this.isBallLaunched&&this.balls?.countActive(true)>0)this.launchBall();}
    launchBall(){if(!this.balls?.countActive(true))return;const bTL=this.balls.getFirstAlive();if(bTL){bTL.setVelocity(Phaser.Math.Between(BALL_INITIAL_VELOCITY_X_RANGE[0],BALL_INITIAL_VELOCITY_X_RANGE[1]),BALL_INITIAL_VELOCITY_Y);this.isBallLaunched=true;this.sound.play(AUDIO_KEYS.SE_LAUNCH);}}
    updateBallFall(){if(!this.balls?.active)return;let aBC=0,sLLTF=false,dSB=null;this.balls.getChildren().forEach(b=>{if(b.active){aBC++;if(this.isBallLaunched&&b.y>this.gameHeight+b.displayHeight*2){if(this.isAnilaActive){this.deactivateAnila();b.y=this.paddle.y-this.paddle.displayHeight;b.setVelocityY(BALL_INITIAL_VELOCITY_Y*0.8);console.log("[Anila] Ball bounced!");}else{b.setActive(false).setVisible(false);if(b.body)b.body.enable=false;sLLTF=true;if(b.getData('isSindaraActive'))dSB=b;}}}});if(dSB){const rS=this.balls.getMatching('isSindaraActive',true);if(rS.length<=1)rS.forEach(b=>this.deactivateSindara(b,true));}if(sLLTF&&this.balls.countActive(true)===0&&this.lives>0&&!this.isGameOver&&!this.bossDefeated)this.loseLife();}
    handleWorldBounds(body,up,down,left,right){const gO=body.gameObject;if(!gO||!(gO instanceof Phaser.Physics.Arcade.Image)||!gO.active)return;if(this.balls.contains(gO)){if(up||left||right){this.sound.play(AUDIO_KEYS.SE_REFLECT,{volume:0.7});let iX=gO.x,iY=gO.y,aR=[0,0];if(up){iY=body.y;aR=[60,120];}else if(left){iX=body.x;aR=[-30,30];}else if(right){iX=body.x+body.width;aR=[150,210];}this.createImpactParticles(iX,iY,aR,0xffffff,5);}}}
    createImpactParticles(x,y,angleRange,tint,count=8){const p=this.add.particles(0,0,'whitePixel',{x:x,y:y,lifespan:{min:100,max:300},speed:{min:80,max:150},angle:{min:angleRange[0],max:angleRange[1]},gravityY:200,scale:{start:0.6,end:0},quantity:count,blendMode:'ADD',emitting:false});p.setParticleTint(tint);p.explode(count);this.time.delayedCall(400,()=>p.destroy());}
    playBossBgm(){this.stopBgm();const bK=this.bossData.bgmKey||AUDIO_KEYS.BGM2;this.currentBgm=this.sound.add(bK,{loop:true,volume:0.45});try{this.currentBgm.play();}catch(e){console.error(`Error playing BGM ${bK}:`,e);}}
    stopBgm(){if(this.currentBgm){try{this.currentBgm.stop();this.sound.remove(this.currentBgm);}catch(e){console.error("Error stopping BGM:",e);}this.currentBgm=null;}}
    safeDestroyCollider(colliderRef,name="collider"){if(colliderRef){try{colliderRef.destroy();}catch(e){console.error(`[Shutdown] Error destroying ${name}:`,e.message);}}colliderRef=null;}
    safeDestroy(obj,name,destroyChildren=false){if(obj&&obj.scene){try{obj.destroy(destroyChildren);}catch(e){console.error(`[Shutdown] Error destroying ${name}:`,e.message);}}obj=null;}
    shutdownScene() { /* ... (CommonBossScene.js 前回のコードと同様、内容は省略) ... */ console.log(`--- ${this.scene.key} SHUTDOWN ---`); this.stopBgm(); this.sound.stopAll(); this.tweens.killAll(); this.time.removeAllEvents(); this.scale.off('resize', this.handleResize, this); if (this.physics.world) this.physics.world.off('worldbounds', this.handleWorldBounds, this); this.input.off('pointermove', this.handlePointerMove, this); this.input.off('pointerdown', this.handlePointerDown, this); this.events.off('shutdown', this.shutdownScene, this); this.events.removeAllListeners(); this.safeDestroyCollider(this.ballPaddleCollider); this.safeDestroyCollider(this.ballBossCollider); this.safeDestroyCollider(this.ballAttackBrickCollider); this.safeDestroyCollider(this.ballAttackBrickOverlap); this.safeDestroyCollider(this.paddlePowerUpOverlap); this.safeDestroyCollider(this.paddleAttackBrickCollider); this.safeDestroyCollider(this.makiraBeamBossOverlap); this.safeDestroy(this.paddle,"paddle"); this.safeDestroy(this.balls,"balls group",true); this.safeDestroy(this.boss,"boss"); this.safeDestroy(this.attackBricks,"attackBricks group",true); this.safeDestroy(this.powerUps,"powerUps group",true); this.safeDestroy(this.familiars,"familiars group",true); this.safeDestroy(this.makiraBeams,"makiraBeams group",true); this.safeDestroy(this.gameOverText,"gameOverText"); this.safeDestroy(this.gameClearText,"gameClearText"); this.safeDestroy(this.bossAfterImageEmitter,"bossAfterImageEmitter"); this.paddle=null;this.balls=null;this.boss=null;this.attackBricks=null;this.powerUps=null;this.familiars=null;this.makiraBeams=null;this.gameOverText=null;this.gameClearText=null;this.bossAfterImageEmitter=null;this.uiScene=null;this.currentBgm=null;this.powerUpTimers={};this.bikaraTimers={};this.lastPlayedVoiceTime={};this.bossMoveTween=null;this.randomVoiceTimer=null;this.attackBrickTimer=null;this.anilaTimer=null;this.anchiraTimer=null;this.makiraAttackTimer=null; console.log(`--- ${this.scene.key} SHUTDOWN Complete ---`); }
    // --- ▲ ヘルパーメソッド ▲ ---
}
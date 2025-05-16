// Boss4Scene.js
import CommonBossScene from './CommonBossScene.js';
import {
    AUDIO_KEYS, POWERUP_TYPES, TOTAL_BOSSES, GAMEPLAY_START_DELAY,
    NORMAL_BALL_SPEED, BALL_SPEED_MODIFIERS, DEFAULT_ATTACK_BRICK_VELOCITY_Y,
    CUTSCENE_DURATION, POWERUP_ICON_KEYS,
    // (その他必要な定数を constants.js からインポート)
    // SE_JI_END_BELL, SE_TRIAL_COMPLETE などもAUDIO_KEYS経由で
} from './constants.js';


export default class Boss4Scene extends CommonBossScene {
    constructor() {
        super('Boss4Scene'); // シーンキー

        // --- ジエンドタイマー関連 ---
        this.jiEndTimerText = null;
        this.jiEndTimeRemaining = 0;
        this.isJiEndTimerRunning = false;
        this.bellSoundTimings = [
            4 * 60 * 1000, 3 * 60 * 1000, 2 * 60 * 1000, 1 * 60 * 1000,
            30 * 1000, 10 * 1000
        ];
        this.playedBellTimings = {};
        this.jiEndVideoKey = 'gameOverVideo_JiEnd';

        this.trialsData = [];
        this.activeTrialIndex = -1;
        this.trialUiText = null;

        this.currentRoute = null;
        this.harmonyCrystal = null;
        this.destructionCrystal = null;
        this.isChoiceEventActive = false;

        this.isFinalBattleActive = false;
        this.lastAttackTime = 0;
        this.lastWarpTime = 0;
        this.isIntroAnimating = false; // 登場演出中フラグ (startIntroCutsceneで管理)
    }

   init(data) {
        super.init(data);
        this.isJiEndTimerRunning = false;
        this.playedBellTimings = {};
        this.activeTrialIndex = -1;
        this.currentRoute = null;
        this.isChoiceEventActive = false;
        this.isFinalBattleActive = false;
        this.lastAttackTime = 0;
        this.lastWarpTime = 0;
        this.isIntroAnimating = false;

        this.jiEndTimerText?.destroy(); this.jiEndTimerText = null;
        this.harmonyCrystal?.destroy(); this.harmonyCrystal = null;
        this.destructionCrystal?.destroy(); this.destructionCrystal = null;
        this.trialUiText?.destroy(); this.trialUiText = null;
        console.log("--- Boss4Scene INIT Complete ---");
    }

    initializeBossData() {
        console.log("--- Boss4Scene initializeBossData (Lucilius Zero) ---");
        this.bossData = {
            health: Infinity,
            finalBattleHp: 5,
            textureKey: 'boss_lucilius_stand',
            negativeKey: 'boss_lucilius_negative',
              backgroundKey: 'gameBackground_Boss4',
            voiceAppear: AUDIO_KEYS.VOICE_LUCILIUS_APPEAR,
            voiceDamage: AUDIO_KEYS.VOICE_LUCILIUS_DAMAGE,
            voiceDefeat: AUDIO_KEYS.VOICE_LUCILIUS_DEFEAT,
            voiceRandom: AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_1 ? [AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_1] : [],
            bgmKey: AUDIO_KEYS.BGM_LUCILIUS_PHASE1, // 初期BGM
            // (ルート選択後や最終決戦でBGMを変える場合は、別途ロジックが必要)
            cutsceneText: 'VS ダークラプチャー・ゼロ', // Commonのカットシーンで使われる場合
            widthRatio: 0.35,
            moveRangeXRatioFinal: 0.7, // 最終決戦時の移動範囲
            moveDurationFinal: 3000,   // 最終決戦時の移動時間

            jiEndCountInitialMinutes: 5,
            jiEndTimerYPosRatio: 0.1,
            jiEndTimerFontSizeRatio: 1 / 15,

            attackIntervalOrder: { min: 3500, max: 5500 }, // 攻撃間隔 (秩序) - 少し速め
            attackIntervalChaos: { min: 7000, max: 11000 }, // 攻撃間隔 (混沌) - 遅め
            // (弾速、弾数などもここで定義し、fireRadialAttack/fireTargetedAttackで参照する)
            radialAttackParamsOrder: { count: 5, speedMultiplier: 1.2 },
            radialAttackParamsChaos: { count: 3, speedMultiplier: 0.8 },
            targetedAttackParamsOrder: { chargeTime: 600, speedMultiplier: 1.1 },
            targetedAttackParamsChaos: { chargeTime: 900, speedMultiplier: 0.9 },

            warpYRange: { minRatio: 0.15, maxRatio: 0.25 }, // ワープ先のY座標範囲 (画面高さ比)
    warpDelayAfterAttack: 300, // 攻撃後のワープ開始までの遅延 (ms)
    warpDelayAfterHit: 100,    // ボールヒット後のワープ開始までの遅延 (ms)
    warpDurationFadeOut: 200,  // ワープで消える時間
    warpDurationHold: 150,     // 消えている時間
    warpDurationFadeIn: 200,   // 再出現する時間
    pauseAfterWarp: 800,       // ワープ後の行動停止時間 (ms)
            trials: this.defineTrials(),
            trialRewardItem: POWERUP_TYPES.BIKARA_YANG,
            // ルシゼロ専用攻撃弾のテクスチャキー
            projectileTextureKey: 'attack_brick_lucilius',
            targetProjectileTextureKey: 'attack_brick_lucilius_target',
            // 放射攻撃パラメータ
    radialAttackProjectileCount: 5, // 例: 5方向
    radialAttackAngles: [60, 75, 90, 105, 120], // 例: 下方向広範囲
    radialAttackProjectileSpeed: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 30,
    radialAttackProjectileTexture: 'attack_brick_lucilius', // 剣のテクスチャ
    radialAttackProjectileScale: 0.15, // テクスチャに合わせたスケール
    radialAttackProjectileSpinRate: 180, // 1秒あたりの回転角度 (度)

    // ターゲット攻撃パラメータ
    targetedAttackProjectileSpeed: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 50, // 少し速め
    targetedAttackProjectileTexture: 'attack_brick_lucilius_target', // 剣のテクスチャ (同じでも別でも)
    targetedAttackProjectileScale: 0.15,
    targetedAttackProjectileSpinRate: 270, // こちらは少し速く回転させるなど変化をつけても

        };
        this.bossVoiceKeys = Array.isArray(this.bossData.voiceRandom) ? this.bossData.voiceRandom : [];
        this.trialsData = this.bossData.trials;
        console.log("Lucilius Zero Specific Data Initialized.");
    }

    // 試練内容を定義するヘルパーメソッド
    defineTrials() {
        return [
            { id: 1, name: "絶対否定と永遠拒絶", conditionText: "絶対否定か永遠拒絶、どちらかを選べ", targetItem: null, completed: false, isChoiceEvent: true },
            { id: 2, name: "原初の契約", conditionText: "ルシファー本体にボールを5回当てる。(0/5)", targetItem: POWERUP_TYPES.ANCHIRA, completed: false, hitCount: 0, requiredHits: 5 },
            { id: 3, name: "混沌の残滓", conditionText: "混沌の欠片を全て破壊せよ。(0/5)", targetItemRandom: [POWERUP_TYPES.MAKIRA, POWERUP_TYPES.BAISRAVA], completed: false, objectsToDestroy: 5, destroyedCount: 0, /* ...欠片生成ロジックなど... */ },
            { id: 4, name: "天穿つ最終奥義", conditionText: "ヴァジラ奥義を1回発動せよ。", targetItem: POWERUP_TYPES.VAJRA, completed: false, ougiUsed: false },
            { id: 5, name: "星光の追撃", conditionText: "クビラ効果中に本体にボールを3回当てる。(0/3)", targetItem: POWERUP_TYPES.KUBIRA, completed: false, hitCountKubira: 0, requiredHitsKubira: 3 },
            { id: 6, name: "楽園追放", conditionText: "「パラダイス・ロスト」を受けよ。", targetItem: null, anilaDropLocation: null, completed: false, paradiseLostTriggered: false }, // anilaDropLocation はドロップ時に設定
            { id: 7, name: "三宝の導き", conditionText: "指定の三種の神器を集めよ。(0/3)", targetItemsToCollect: [POWERUP_TYPES.BIKARA_YANG, POWERUP_TYPES.BADRA, POWERUP_TYPES.MAKORA], collectedItems: [], targetItem: null, completed: false }, // targetItemは進行中に設定
            { id: 8, name: "深淵より来る核金", conditionText: "「アビス・コア」にボールを1回当てよ。", targetItem: POWERUP_TYPES.SINDARA, completed: false, coreHit: false, /* ...コア出現ロジック... */ },
            { id: 9, name: "時の超越、歪む流れの中で", conditionText: "速度変化フィールド内で本体にボールを3回当てる。(0/3)", targetItemAlternate: [POWERUP_TYPES.HAILA, POWERUP_TYPES.SHATORA], completed: false, hitCountTimeField: 0, requiredHitsTimeField: 3, /* ...フィールド展開ロジック... */ },
            { id: 10, name: "連鎖する星々の輝き", conditionText: "本体にボールを連続3回当てる。(0/3)", targetItem: POWERUP_TYPES.INDARA, completed: false, consecutiveHits: 0, requiredConsecutiveHits: 3 },
            { id: 11, name: "虚無の壁", conditionText: "虚無の壁の奥の本体にボールを1回当てよ。", targetItem: POWERUP_TYPES.BIKARA_YIN, completed: false, wallBreachedAndHit: false, /* ...壁生成ロジック... */ },
            { id: 12, name: "終焉の刻 ", conditionText: "決着を付けろ", targetItem: null, completed: false, isFinalBattle: true }
        ];
    }


   // ボスオブジェクトの初期設定 (CommonBossSceneから呼ばれる)
    createSpecificBoss() {
        super.createSpecificBoss(); // this.boss が CommonBossScene で生成される
        if (this.boss) {
            // ルシゼロは試練中は画面上部中央に固定
            const initialY = this.gameHeight * 0.4; // Y座標 (調整可能)
            this.boss.setPosition(this.gameWidth / 2, initialY);
            this.boss.setImmovable(true);
            if (this.boss.body) this.boss.body.moves = false; // 物理的に動かないように
            this.boss.setData('targetY', initialY); // finalizeBossAppearanceAndStart で使われる可能性
            this.boss.setData('targetScale', this.boss.scale); // 同上

            // UIへの初期HP表示 (試練中は "∞")
            this.events.emit('updateBossHp', '∞', '∞');
            this.events.emit('updateBossNumber', this.currentBossIndex, TOTAL_BOSSES);
            console.log(`[Boss4 Create] Lucilius Zero (Boss ${this.currentBossIndex}) initialized at static position.`);
        } else {
            console.error("!!! Boss4Scene: this.boss was not created by super.createSpecificBoss()!");
        }
    }


    // CommonBossSceneのapplyBossDamageをオーバーライド
applyBossDamage(bossInstance, damageAmount, source = "Unknown") {
    if (!bossInstance || !bossInstance.active) return;

    if (this.isFinalBattleActive) {
        // 「決着の刻」のみ、親クラスの通常のダメージ処理を実行
        console.log(`[Boss4 ApplyDamage - FinalBattle] Applying damage. Source: ${source}, Amount: ${damageAmount}`);
        super.applyBossDamage(bossInstance, damageAmount, source);
    } else {
        // 試練中はダメージモーションも、ボイスも、HP変動も一切なし。
        // ボールがボスに当たったという事実は hitBoss で処理される（反射など）。
        // ここでは何もせず、ダメージが通らないことを表現する。
        console.log(`[Boss4 ApplyDamage - TrialPhase] Damage attempt (Source: ${source}, Amount: ${damageAmount}). Lucilius is invulnerable during trials.`);

        // (オプション) もし、試練中にボスにボールが当たった際に、
        // 何か特別なSE（金属音のような、効いていない感じの音）を鳴らしたい場合はここで再生可能。
        // try { if (AUDIO_KEYS.SE_LUCILIUS_INVULNERABLE_HIT) this.sound.play(AUDIO_KEYS.SE_LUCILIUS_INVULNERABLE_HIT); } catch(e){}

        // ボスへのヒットエフェクト（赤点滅など）も行わない。
        // ただし、ボールの反射自体は hitBoss で行われる。
    }
}

   // startIntroCutscene: ボス4専用のシンプルなカットイン後、finalizeBossAppearanceAndStartを呼ぶ
// Boss4Scene.js

// (constructor, init, initializeBossData, defineTrials, createSpecificBoss, applyBossDamage は前回提示のものをベースに)

// Boss4Scene.js

// (constructor, init, initializeBossData, defineTrials, createSpecificBoss, applyBossDamage などは変更なしの想定)

// CommonBossSceneのcreateから呼ばれる登場演出をオーバーライド
// 目的: ルシゼロ専用のカットイン内容にしつつ、Commonのフュージョン演出フローに繋げる
startIntroCutscene() {
    console.log("[Boss4Scene] Overriding startIntroCutscene for Lucilius Zero's specific cutscene content.");
    this.isIntroAnimating = true;
    this.playerControlEnabled = false;
    this.isBallLaunched = false;
    // this.sound.stopAll(); // CommonBossSceneのstartIntroCutsceneで呼ばれるなら不要
    // this.stopBgm();       // 同上

    // --- ▼ Boss4Scene 専用のカットイン内容を bossData 経由で設定するイメージ ▼ ---
    // CommonBossSceneのstartIntroCutsceneがthis.bossDataを参照して描画すると仮定。
    // もしCommonのstartIntroCutsceneが固定のテキストや画像を使っているなら、
    // このオーバーライドメソッド内でCommonとほぼ同じ描画処理を書く必要がある。

    // ここでは、CommonBossSceneのstartIntroCutsceneが以下を行うと仮定して、
    // 単にsuperを呼ぶか、あるいはbossDataを適切に設定した上でsuperを呼ぶ。
    // 1. this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START)
    // 2. 暗幕表示 (this.add.rectangle)
    // 3. ボス画像表示 (this.add.image(..., this.bossData.textureKeyForCutscene || this.bossData.textureKey, ...))
    // 4. VSテキスト表示 (this.add.text(..., this.bossData.cutsceneText, ...))
    // 5. delayedCall で上記要素を破棄し、this.startFusionIntro() を呼び出す

    // Boss4SceneのinitializeBossDataで以下が設定されていること:
    // this.bossData.textureKey = 'boss_lucilius_stand'; // フュージョン演出や最終表示用
    // this.bossData.cutsceneText = 'VS ダークラプチャー・ゼロ';
    // (オプション) this.bossData.textureKeyForCutscene = 'boss_lucilius_cutscene_image'; // カットイン専用画像キー

    // --- ▼ 選択肢A: Commonのカットインをそのまま使う (bossDataで内容制御) ▼ ---
    // この場合、Boss4Sceneでのこのメソッドのオーバーライドはほぼ不要になるか、
    // bossDataの特定項目の上書き程度で済む。
    // super.startIntroCutscene();

    // --- ▼ 選択肢B: Boss4Sceneでカットインを完全に自前描画し、Commonのフュージョンへ繋ぐ ▼ ---
    // (これが「カットインのボス立ち絵が出ない」問題の直接的な解決になる)
    console.log("[Boss4Scene] Implementing custom cutscene draw, then calling Common's startFusionIntro.");

    try { if (AUDIO_KEYS.SE_CUTSCENE_START) this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START); 
        
        
    } catch(e) {}

     this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START); 

    const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x100020, 0.75)
        .setOrigin(0,0).setDepth(899);

    // ★★★ カットイン用のボス画像を表示 ★★★
    const cutsceneBossTexture = this.bossData.textureKeyForCutscene || this.bossData.textureKey; // 専用がなければ本体流用
    const bossImage = this.add.image(this.gameWidth / 2, this.gameHeight * 0.45, cutsceneBossTexture)
        .setOrigin(0.5, 0.5)
        .setScale(this.bossData.widthRatio ) // スケール調整 (widthRatio基準)
        .setDepth(900);
    console.log(`[Boss4 Cutscene] Displaying cutscene boss image: ${cutsceneBossTexture}`);

    const textContent = this.bossData.cutsceneText || `VS ${this.currentBossIndex}`;
    const fontSize = this.calculateDynamicFontSize(60);
    const textStyle = { fontSize: `${fontSize}px`, fill: '#E0E0E0', fontFamily: 'serif', align: 'center', stroke: '#100010', strokeThickness: Math.max(4, fontSize * 0.07)};
    const vsText = this.add.text(this.gameWidth / 2, bossImage.getBounds().bottom + (this.gameHeight * 0.03), textContent, textStyle)
        .setOrigin(0.5, 0).setDepth(901);

    // ルシゼロ登場ボイスは startFusionIntro で Common のロジックで再生される想定
    // もしカットインと同時に鳴らしたいならここで再生
    // if (this.bossData.voiceAppear) try { this.sound.play(this.bossData.voiceAppear); } catch(e) {}

    const cutsceneDurationToUse = CUTSCENE_DURATION || 1800;
    this.time.delayedCall(cutsceneDurationToUse, () => {
        if (overlay?.scene) overlay.destroy();
        if (bossImage?.scene) bossImage.destroy(); // ★カットイン用ボス画像を破棄
        if (vsText?.scene) vsText.destroy();

        if (this.isGameOver || this.bossDefeated) return;

        console.log("[Boss4Scene Cutscene] Custom cutscene part done. Now calling CommonBossScene's startFusionIntro.");
        // ★★★ CommonBossScene のフュージョン演出（メイン登場演出）を呼び出す ★★★
        this.startFusionIntro(); // これが最終的に finalizeBossAppearanceAndStart を呼ぶ
        // this.isIntroAnimating は Common のフローで管理されるか、startGameplay で false にする
    }, [], this);
}


// startGameplay (オーバーライド版 - 前回提示の通り)
// finalizeBossAppearanceAndStart は CommonBossScene のものをそのまま使用するので、Boss4Sceneではオーバーライド不要
// startSpecificBossMovement (オーバーライド版 - 前回提示の通り、試練中は静止、最終決戦で移動)
// (その他の Boss4Scene 固有メソッド)

// startGameplay (オーバーライド版 - 前回提示の通り)
// finalizeBossAppearanceAndStart は CommonBossScene のものをそのまま使用するので、Boss4Sceneではオーバーライド不要
// startSpecificBossMovement (オーバーライド版 - 前回提示の通り、試練中は静止、最終決戦で移動)
// (その他の Boss4Scene 固有メソッド: setupJiEndTimer, setupTrialUI, startNextTrial, etc. は前回提示のものをベースに)


  // startGameplay (オーバーライド): Commonの処理を呼びつつ、ルシゼロ専用の初期化
startGameplay() {
    console.log("[Boss4Scene] startGameplay override called.");

    // ★★★ ジエンドタイマーと試練UIをここでセットアップ ★★★
    // (super.startGameplay() より前にセットアップすることで、
    //  プレイヤーが操作可能になる瞬間にUIも準備完了している)
    if (!this.jiEndTimerText) this.setupJiEndTimer();
    if (!this.trialUiText) this.setupTrialUI();

    // ★★★ 最初の試練 (調和と破壊) をここで開始 ★★★
    // (activeTrialIndexが-1の時だけ呼ぶなど、重複呼び出し防止)
    if (this.activeTrialIndex < 0) {
        this.startNextTrial(); // これが startHarmonyAndDestructionChoice を呼び出す
    }
    // この時点で this.isChoiceEventActive が true になり、
    // playerControlEnabled はまだ CommonBossScene の startGameplay で
    // true になっていないか、あるいはこの直後に true になる。

    // CommonBossSceneの主要な戦闘開始処理を実行
    // これによりBGM再生、playerControlEnabled=true、startSpecificBossMovementなどが呼ばれる
    super.startGameplay();

    // ★★★ startHarmonyAndDestructionChoice でプレイヤー操作を確実に有効化 ★★★
    // (super.startGameplay() で true になっているはずだが、念のため＆ボール準備のため)
    if (this.activeTrial && this.activeTrial.isChoiceEvent) {
        // startHarmonyAndDestructionChoice の中で playerControlEnabled = true と
        // ボールの準備 (生成またはリセット) を行う。
        // super.startGameplay() が呼ばれた後なので、paddle は存在するはず。
        console.log("[Boss4Scene startGameplay] Choice event is active. Ensuring player can act.");
        this.playerControlEnabled = true; // Commonで設定済みのはずだが明示
        this.isBallLaunched = false;    // Commonで設定済みのはずだが明示
        this.prepareBallForChoice();   // ボールを準備する専用ヘルパー呼び出し
    }

    console.log(`[Boss4Scene startGameplay] Exiting. playerControlEnabled: ${this.playerControlEnabled}`);
}

// ボールを調和と破壊の選択のために準備するヘルパーメソッド (新規)
prepareBallForChoice() {
    if (this.balls && this.balls.countActive(true) === 0) {
        console.log("[PrepareBallForChoice] No active balls, creating one.");
        this.createAndAddBallToPaddle();
    } else if (this.balls) {
        console.log("[PrepareBallForChoice] Resetting existing balls to paddle.");
        this.resetAllBallsToPaddle();
    }
    this.isBallLaunched = false; // 確実にする
}


    // ジエンドタイマーのセットアップと初期演出
    setupJiEndTimer() {
        if (this.jiEndTimerText) this.jiEndTimerText.destroy();
        const initialTime = (this.bossData.jiEndCountInitialMinutes || 5) * 60 * 1000;
        this.jiEndTimeRemaining = initialTime;

        const timerFontSize = Math.floor(this.gameWidth * (this.bossData.jiEndTimerFontSizeRatio || 1/15));
        const timerTextStyle = { fontSize: `${timerFontSize}px`, fill: '#ffffff', fontFamily: 'serif', align: 'center', stroke: '#000000', strokeThickness: Math.max(2, timerFontSize * 0.05) };

        this.jiEndTimerText = this.add.text(
            this.gameWidth / 2, this.gameHeight * (this.bossData.jiEndTimerYPosRatio || 0.1),
            this.formatTime(this.jiEndTimeRemaining), timerTextStyle
        ).setOrigin(0.5, 0.5).setDepth(-5); // ★背景とボスの間 (背景-10, ボス0と仮定)

          // --- ▼ 初期登場演出の削除または変更 ▼ ---
    // 以前の拡大縮小・点滅Tweenは削除

    // シンプルに、数秒間だけ少し手前に表示するだけにする (任意)
    const initialDisplayDuration = 2000; // 2秒間 (調整可能)
    const originalDepth = this.jiEndTimerText.depth;

    // もし「最初に少しだけ目立たせたい」という意図が少しでも残っているなら、
    // 深度を一時的に上げる程度に留める。完全に不要ならこのブロックごと削除。
    if (false) { // ← ここを true にすれば一時的な深度変更が有効になる。false なら何もしない。
        this.jiEndTimerText.setDepth(100); // 一時的に少し手前に (例: ボスより手前、UIより奥)
        this.time.delayedCall(initialDisplayDuration, () => {
            if (this.jiEndTimerText && this.jiEndTimerText.active) {
                this.jiEndTimerText.setDepth(originalDepth); // 元の深度に戻す
                console.log(`[JiEndTimer] Depth reset to: ${this.jiEndTimerText.depth} after initial display.`);
            }
        }, [], this);

    }
     // タイマー開始時の鐘の音 (初回) - これは残しても良い演出
    this.playBellSound();
    // --- ▲ 初期登場演出の削除または変更 終了 ▲ ---

        this.isJiEndTimerRunning = true;
        console.log("[JiEndTimer] Setup complete.");
    }

    // 試練UIの初期セットアップ
    setupTrialUI() {
        if (this.trialUiText) this.trialUiText.destroy();
        // UISceneに依頼するか、Boss4Sceneで直接描画するか
        // ここではBoss4Sceneで直接描画する例 (UISceneと連携する方が望ましい場合もある)
        const trialFontSize = Math.floor(this.gameWidth / 20);
        const trialTextStyle = { fontSize: `${trialFontSize}px`, fill: '#ffffff', fontFamily: 'serif', align: 'center', lineSpacing: trialFontSize * 0.2, stroke: '#000000', strokeThickness: Math.max(1, trialFontSize*0.03)};
        this.trialUiText = this.add.text(
            this.gameWidth / 2,
            (this.uiScene?.livesText?.y || this.gameHeight * 0.05) + 70, // ボスHPバーの下あたり (調整)
            "", // 最初は空
            trialTextStyle
        ).setOrigin(0.5, 0).setDepth(100); // ボスより手前、UIよりは奥など
        console.log("[TrialUI] Setup complete.");
    }

    // 次の試練を開始する (または現在の試練のUIを更新) - 攻撃タイマーリセット追加
startNextTrial() {
    this.activeTrialIndex++;
    if (this.activeTrialIndex >= this.trialsData.length) {
        console.error("[TrialLogic] Attempted to start trial beyond available trials.");
        this.triggerJiEndGameOver();
        return;
    }

    const currentTrial = this.trialsData[this.activeTrialIndex];
    this.activeTrial = currentTrial;

    console.log(`[TrialLogic] Starting Trial ${currentTrial.id}: ${currentTrial.name}`);
    if (this.trialUiText && this.trialUiText.active) {
        let displayText = `十二の試練：試練 ${currentTrial.id}「${currentTrial.name}」\n`;
        displayText += `${currentTrial.conditionText}`;
        // 進捗表示も初期化 (updateTrialProgressUIで現在の進捗を表示するようにする)
        if (this.trialUiText) this.updateTrialProgressUI(currentTrial);
        else this.trialUiText.setText(displayText); // フォールバック
    }

    if (currentTrial.isChoiceEvent) { // 試練I: 調和と破壊
        this.startHarmonyAndDestructionChoice();
        this.playerControlEnabled = false; // 選択中はボール操作をさせない想定だったが、選択UIではtrueにする
        console.log("[TrialLogic] Player control will be handled by startHarmonyAndDestructionChoice.");
    } else if (currentTrial.isFinalBattle) { // 試練XII: 決着の刻
        this.startFinalBattle();
        this.playerControlEnabled = true;
        // 最終決戦用BGMの再生 (startFinalBattle内でも良い)
        const finalBgmKey = this.bossData.bgmKeyFinalBattle || AUDIO_KEYS.BGM_LUCILIUS_FINAL_BATTLE; // bossDataに定義
        if (finalBgmKey) this.playSpecificBgm(finalBgmKey); // playSpecificBgmはBGMを切り替えるヘルパーと仮定
        else if (!this.currentBgm || !this.currentBgm.isPlaying) this.playBossBgm();
    } else { // 通常の試練 (試練II ～ XI)
        this.setupCurrentTrialEnvironment(currentTrial); // 試練ごとのオブジェクト配置など

        // プレイヤー操作を確実に有効化
        if (!this.playerControlEnabled) {
            this.playerControlEnabled = true;
            console.log("[TrialLogic] Player control ENABLED for current trial.");
        }
        this.isBallLaunched = false; // ボールは常に再発射待ちから開始

        // ボールがなければ生成、あればパドル上へリセット
        this.prepareBallForTrial(); // 新しいヘルパーメソッド

        // ★★★ 攻撃・ワープタイマーを現在の時間でリセット ★★★
        this.lastAttackTime = this.time.now;
        this.lastWarpTime = this.time.now;
        console.log(`[TrialLogic] Attack/Warp timers reset for Trial ${currentTrial.id}. lastAttackTime: ${this.lastAttackTime.toFixed(0)}, lastWarpTime: ${this.lastWarpTime.toFixed(0)}`);
        // ★★★---------------------------------------------★★★

        // BGMが流れていなければ再生 (ルートによってBGMを変えるならここで判定)
        let bgmToPlay = this.bossData.bgmKey; // デフォルト
        if (this.currentRoute === 'order' && this.bossData.bgmKeyOrder) {
            bgmToPlay = this.bossData.bgmKeyOrder;
        } else if (this.currentRoute === 'chaos' && this.bossData.bgmKeyChaos) {
            bgmToPlay = this.bossData.bgmKeyChaos;
        }
        if (bgmToPlay && (!this.currentBgm || this.currentBgm.key !== bgmToPlay || !this.currentBgm.isPlaying)) {
            this.playSpecificBgm(bgmToPlay); // playSpecificBgmは指定キーのBGMを再生/切り替え
        } else if (!this.currentBgm || !this.currentBgm.isPlaying) {
            this.playBossBgm(); // フォールバック
        }
    }
}
// 新しいヘルパーメソッド: 試練開始時にボールを準備する
prepareBallForTrial() {
    if (this.balls && this.balls.countActive(true) === 0) {
        console.log("[PrepareBallForTrial] No active balls, creating one.");
        this.createAndAddBallToPaddle();
    } else if (this.balls) {
        console.log("[PrepareBallForTrial] Resetting existing balls to paddle.");
        this.resetAllBallsToPaddle();
    }
    this.isBallLaunched = false;
}
// (createAndAddBallToPaddle, resetAllBallsToPaddle は前回定義したものを想定)

// playSpecificBgm ヘルパーメソッド (BGM切り替え用)
playSpecificBgm(bgmKey) {
    this.stopBgm(); // 現在のBGMを停止
    if (bgmKey && this.cache.audio.has(bgmKey)) {
        console.log(`[BGM] Playing specific BGM: ${bgmKey}`);
        this.currentBgm = this.sound.add(bgmKey, { loop: true, volume: 0.45 });
        try { this.currentBgm.play(); } catch (e) { console.error(`Error playing BGM ${bgmKey}:`, e); }
    } else {
        console.warn(`[BGM] Specific BGM key "${bgmKey}" not found or not loaded. Playing default.`);
        this.playBossBgm(); // デフォルトBGMを再生
    }
}


    // 現在の試練に応じた環境設定 (専用オブジェクト召喚など)
    setupCurrentTrialEnvironment(trial) {
        // 例: 試練III「混沌の残滓」なら欠片を召喚
        if (trial.id === 3) this.spawnChaosFragments(trial.objectsToDestroy);
        // 例: 試練XI「虚無の壁」なら壁を召喚
        if (trial.id === 11) this.spawnVoidWall();
        // 他の試練の準備も同様に
    }


    // 「調和と破壊」の選択イベントを開始
 // Boss4Scene.js

// (constructor, init, initializeBossData, createSpecificBoss などは既存のものを想定)
// (defineTrials で trial ID 1 が isChoiceEvent: true になっていること)
// Boss4Scene.js

// startHarmonyAndDestructionChoice: クリスタル表示と衝突設定
startHarmonyAndDestructionChoice() {
    this.isChoiceEventActive = true;
    this.playerControlEnabled = false; // UI選択中はゲーム操作を止める
    this.isBallLaunched = true;      // ボールも動かないように (あるいは非表示)
    if(this.balls?.getFirstAlive()?.body) { // ボールが存在すれば動きを止める
        this.balls.getChildren().forEach(ball => ball.body.stop());
    }


    if (this.trialUiText && this.activeTrial && this.activeTrial.isChoiceEvent) {
        this.trialUiText.setText(`十二の試練：試練 ${this.activeTrial.id}「${this.activeTrial.name}」\n${this.activeTrial.conditionText}`);
    }
    console.log("[ChoiceEvent] Presenting Harmony and Destruction choice via Text Buttons.");

    // --- ▼ テキストボタンのスタイル定義 ▼ ---
    const buttonFontSize = Math.floor(this.gameWidth / 12); // 画面幅に応じた大きめのフォント
    const buttonBaseStyle = {
        fontSize: `${buttonFontSize}px`,
        fontFamily: 'serif', // 明朝体など、雰囲気に合わせて
        // fill: '#FFFFFF',    // 文字色 (アクティブ時)
        // stroke: '#000000',  // 縁取り色 (アクティブ時)
        // strokeThickness: buttonFontSize * 0.08,
        align: 'center',
        // backgroundColor: 'rgba(0,0,0,0.0)', // 背景を完全に透明に
        // padding: { y: buttonFontSize * 0.3 }, // 上下の余白でクリック範囲を調整
    };
    // ホバー時のスタイル（任意）
    // const buttonHoverStyle = { fill: '#FFD700' }; // 例: 金色に光る

    // --- ▼ 選択肢のテキストと対応するルート ▼ ---
    const choices = [
        { text: "絶対否定", route: "order", description: "(秩序の道：時は緩やかに、敵は猛る)" }, // 説明はログ用
        { text: "永遠拒絶", route: "chaos", description: "(混沌の道：時は加速し、敵は沈黙)" }
    ];

    // 画面を覆う半透明の暗幕 (ボタンを目立たせるため、任意)
    this.choiceOverlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.5)
        .setOrigin(0,0).setDepth(999).setInteractive(); // 他のクリックをブロック

    this.choiceButtons = []; // ボタンオブジェクトを保持する配列

    const buttonYStep = this.gameHeight * 0.25; // ボタン間の縦の間隔
    let startButtonY = this.gameHeight / 2 - (choices.length - 1) * buttonYStep / 2; // 最初のボタンのY座標 (中央揃え)

   choices.forEach((choice, index) => {
        const buttonText = this.add.text(
            this.gameWidth / 2,
            startButtonY + (index * buttonYStep),
            choice.text,
            { ...buttonBaseStyle, fill: '#DDDDDD' }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setPadding(20, 20, 20, 20)
        .setDepth(1000);

        buttonText.setFixedSize(this.gameWidth * 0.8, buttonFontSize * 1.8);

        buttonText.on('pointerover', () => {
            buttonText.setStyle({ fill: '#FFFF99' });
        });
        buttonText.on('pointerout', () => {
            buttonText.setStyle({ fill: '#DDDDDD' });
        });

        // --- ▼▼▼ pointerdown の設定はここに1つだけ ▼▼▼ ---
         buttonText.on('pointerdown', (pointer, localX, localY, event) => {
            // ★★★ isChoiceEventActive でガードし、先にフラグを下ろす ★★★
            if (!this.isChoiceEventActive) {
                console.log("[ChoiceButton] Choice already made, ignoring further clicks.");
                return;
            }
            // isChoiceEventActive を false にするのは selectRoute の責務でも良いが、
            // ここで一度無効化の意思を示すのもあり。
            // ただし、selectRoute が呼ばれないケースも考慮すると、
            // やはり selectRoute の中でフラグ管理するのが一貫する。

            // ★★★ ここでガードするなら selectRoute には渡さない ★★★
            // if (!this.isChoiceEventActive) return; // このガードはselectRoute内に任せる

            console.log(`Choice button "${choice.text}" clicked. Selecting route: ${choice.route}`);
            event.stopPropagation();

            // 他のボタンのインタラクションを無効化 (視覚的なフィードバックも兼ねて)
            this.choiceButtons.forEach(btn => {
                if (btn && btn.input && btn !== buttonText) { // 自分自身以外
                     btn.disableInteractive();
                     // btn.setAlpha(0.5); // 選択されなかった方を少し暗くするなど
                }
            });
            if (this.choiceOverlay?.input) { // ?.で安全に
                this.choiceOverlay.disableInteractive();
            }
            buttonText.disableInteractive(); // 押されたボタンも無効化

            this.selectRoute(choice.route);
        });
        this.choiceButtons.push(buttonText);
    });
}


// createAndAddBallToPaddle と resetAllBallsToPaddle はCommonBossSceneにあるか、ここで定義するヘルパー
createAndAddBallToPaddle() {
    if (this.paddle && this.paddle.active) {
        this.createAndAddBall(this.paddle.x, this.paddle.y - (this.paddle.displayHeight / 2) - (this.gameWidth * (BALL_RADIUS_RATIO || 0.05)));
    } else { this.createAndAddBall(this.gameWidth / 2, this.gameHeight * 0.7); }
}
resetAllBallsToPaddle() {
    this.balls?.getChildren().forEach(ball => {
        if (ball.active && ball.body && this.paddle?.active) {
            ball.setVelocity(0,0).setPosition(this.paddle.x, this.paddle.y - (this.paddle.displayHeight / 2) - ball.displayHeight / 2);
        } // ... (パドルがない場合のフォールバックも)
    });
}



// selectRoute: ルートを設定し、次の試練へ
 // Boss4Scene.js - selectRoute メソッド修正案 (Tweenでフェードアウト)
// Boss4Scene.js - selectRoute メソッド修正案
selectRoute(route) {
    if (!this.isChoiceEventActive) return;
    this.isChoiceEventActive = false;
    this.currentRoute = route;
    console.log(`[SelectRoute] Route set to: ${this.currentRoute}. isChoiceEventActive is now: ${this.isChoiceEventActive}`);

    console.log("[SelectRoute] Hiding and destroying choice UI elements...");
    if (this.choiceOverlay) {
        this.choiceOverlay.setVisible(false); // ★まず非表示に
        if (this.choiceOverlay.scene) this.choiceOverlay.destroy();
        this.choiceOverlay = null;
        console.log("[SelectRoute] Overlay hidden and destroyed.");
    }

    this.choiceButtons.forEach((button, index) => {
        if (button) {
            button.setVisible(false); // ★まず非表示に
            if (button.scene) button.destroy();
            console.log(`[SelectRoute] Button ${index} hidden and destroyed.`);
        }
    });
    this.choiceButtons = [];
    console.log("[SelectRoute] Choice buttons array cleared.");

    // 次の試練への遅延を少し延ばす
    const nextTrialDelay = 500; // 0.5秒 (調整可能)
    console.log(`[SelectRoute] Method END. Scheduling startNextTrial in ${nextTrialDelay}ms.`);
    this.time.delayedCall(nextTrialDelay, () => {
        console.log("[SelectRoute DelayedCall] Now calling startNextTrial.");
        this.startNextTrial();
    }, [], this);
}

// クリスタル破壊の共通処理 (演出など)
shatterCrystal(crystal) {
    if (!crystal || !crystal.active) return;
    console.log(`[ChoiceEvent] Shattering ${crystal.getData('crystalType')} crystal.`);
    // TODO: 破壊エフェクト (例: パーティクル、縮小して消えるTween)
    // try { this.sound.play(AUDIO_KEYS.SE_CRYSTAL_BREAK_ORDER or CHAOS); } catch(e){}
    crystal.disableBody(true, true); // 物理ボディを無効化し、非表示・非アクティブに
                                     // destroy() でも良いが、演出を挟むなら disableBody
    // destroy() の方がシンプル
    // crystal.destroy();
    this.tweens.add({ // 簡単な破壊演出例
        targets: crystal,
        alpha: 0,
        scale: crystal.scale * 0.5,
        duration: 300,
        onComplete: () => {
            if(crystal.scene) crystal.destroy();
        }
    });
}



     // ボスの移動パターン (CommonBossSceneのstartGameplayから呼ばれる)
    startSpecificBossMovement() {
        if (this.isFinalBattleActive) {
            console.log("[Boss4Scene FinalBattle] Lucilius Zero starts moving!");
            // 最終決戦時の移動ロジック (例: CommonBossSceneの左右移動)
            const moveWidth = this.gameWidth * (this.bossData.moveRangeXRatioFinal || 0.7) / 2;
            const leftX = this.gameWidth / 2 - moveWidth;
            const rightX = this.gameWidth / 2 + moveWidth;
            this.boss.setX(this.gameWidth / 2); // 中央から開始

            const easeFunctions = ['Sine.easeInOut', 'Quad.easeInOut', 'Cubic.easeInOut'];
            const moveToRight = () => {
                if (!this.boss?.active || !this.isFinalBattleActive) return;
                this.bossMoveTween = this.tweens.add({ targets: this.boss, x: rightX, duration: (this.bossData.moveDurationFinal || 3000), ease: Phaser.Utils.Array.GetRandom(easeFunctions), onComplete: moveToLeft });
            };
            const moveToLeft = () => {
                if (!this.boss?.active || !this.isFinalBattleActive) return;
                this.bossMoveTween = this.tweens.add({ targets: this.boss, x: leftX, duration: (this.bossData.moveDurationFinal || 3000), ease: Phaser.Utils.Array.GetRandom(easeFunctions), onComplete: moveToRight });
            };
            moveToRight();
        } else {
            console.log("[Boss4Scene TrialPhase] Lucilius Zero remains stationary.");
            if (this.bossMoveTween) this.tweens.killTweensOf(this.boss); // 既存のTween停止
            if (this.boss && this.boss.body) {
                this.boss.setVelocity(0, 0); // 完全に静止
            }
        }
    }

    // ボスの攻撃パターンとワープ - lastAttackTime の更新を確認

   updateSpecificBossBehavior(time, delta) {
  

    // --- ガード処理 ---
    if (this.isIntroAnimating || !this.playerControlEnabled || !this.boss || !this.boss.active ||
        this.bossDefeated || this.isGameOver || this.isChoiceEventActive || this.isFinalBattleActive) {

        // どの条件でガードされたかログで確認 (任意)
        if (this.isIntroAnimating) console.log("[UpdateSpecific] Guarded by isIntroAnimating");
        else if (!this.playerControlEnabled) console.log("[UpdateSpecific] Guarded by !playerControlEnabled");
        else if (!this.boss || !this.boss.active) console.log("[UpdateSpecific] Guarded by !boss or !boss.active");
        else if (this.bossDefeated) console.log("[UpdateSpecific] Guarded by bossDefeated");
        else if (this.isGameOver) console.log("[UpdateSpecific] Guarded by isGameOver");
        else if (this.isChoiceEventActive) console.log("[UpdateSpecific] Guarded by isChoiceEventActive");
        else if (this.isFinalBattleActive && this.activeTrialIndex < (this.trialsData.length -1) ) { // 最終決戦だが、まだ試練中という矛盾状態を避ける
             // 最終決戦のAI呼び出しはここ
             this.updateFinalBattleBossAI(time, delta);
        }
        return;
    }

    // --- 攻撃処理 (試練中: activeTrialIndex が 1 以上、つまり試練II以降) ---
    // activeTrialIndex は 0 から始まるので、試練IIはインデックス 1
    if (this.activeTrialIndex >= 1) { // 試練ID 2 (原初の契約) 以降
        const attackIntervalConfig = this.currentRoute === 'order' ?
            (this.bossData.attackIntervalOrder || {min:1800, max:2800}) :
            (this.bossData.attackIntervalChaos || {min:3500, max:5500});
        const interval = Phaser.Math.Between(attackIntervalConfig.min, attackIntervalConfig.max);

        // デバッグログ (条件確認用)
         console.log(`[Attack Check] time: ${time.toFixed(0)}, lastAttack: ${this.lastAttackTime.toFixed(0)}, interval: ${interval}, diff: ${(time - (this.lastAttackTime + interval)).toFixed(0)}`);

        if (time > this.lastAttackTime + interval) {
            if (Phaser.Math.Between(0, 1) === 0) {
                this.fireRadialAttack();
            } else {
                this.fireTargetedAttack();
            }
            this.lastAttackTime = time; // ★★★ 攻撃実行後に lastAttackTime を更新 ★★★
            console.log(`[Attack] Attack executed. Next attack possible after ${interval}ms. Updated lastAttackTime: ${this.lastAttackTime.toFixed(0)}`);

            // 攻撃後に少し遅れてワープ
            this.time.delayedCall(this.bossData.warpDelayAfterAttack || 300, this.warpBoss, [], this);
        }
    }
}

// (オプション) 最終決戦用のボスAIメソッド
updateFinalBattleBossAI(time, delta) {
    // ここに「決着の刻」のルシファーの動きや攻撃パターンを記述
    // 例: super.updateSpecificBossBehavior(time, delta); // CommonBossSceneの汎用的な動きや攻撃を使う場合
    //     または、専用の攻撃タイマーや移動ロジック
    console.log("[FinalBattleAI] Updating final battle AI (placeholder)...");
    // (時間経過ワープや、専用の最終攻撃など)
}

   // CommonBossSceneのhitBossをオーバーライド (試練中のワープと、決着の刻の通常のヒット処理)
// Boss4Scene.js
hitBoss(boss, ball) {
    if (!boss || !ball || !ball.body || !boss.active) return;

    let trialJustCompleted = false; // ★★★ 変数宣言をメソッドの早い段階に移動 ★★★
    console.log(`[Boss4 hitBoss Start] Initial trialJustCompleted: ${trialJustCompleted}`);

    if (this.isFinalBattleActive) {
        console.log("[Boss4 hitBoss - FinalBattle] Standard boss hit.");
        super.hitBoss(boss, ball);
        // 最終決戦中は試練判定は不要なので、ここでreturnしても良い
        return;
    }

    // --- 試練中の処理 ---
    console.log("[Boss4 hitBoss - TrialPhase] Ball hit, reflecting.");

    // ボール反射ロジック
    const escapeAngleRad = Phaser.Math.Angle.Between(boss.x, boss.y, ball.x, ball.y); // ボス中心からボールへの角度
const escapeAngleDeg = Phaser.Math.RadToDeg(escapeAngleRad);
    let speedMultiplier = 1.0;
    const baseReflectSpeed = (NORMAL_BALL_SPEED || 380) * 0.8; // 反射時は少し減速させるなど調整
const targetReflectSpeed = baseReflectSpeed * speedMultiplier;
    if (ball.getData('isFast') === true && BALL_SPEED_MODIFIERS && POWERUP_TYPES) {
        speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA] || 1.0;
    } else if (ball.getData('isSlow') === true && BALL_SPEED_MODIFIERS && POWERUP_TYPES) {
        speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA] || 1.0;
    }
    const targetSpeed = (NORMAL_BALL_SPEED || 380) * speedMultiplier;
    const reflectAngleRad = Phaser.Math.Angle.Between(boss.x, boss.y, ball.x, ball.y);
    const reflectAngleDeg = Phaser.Math.RadToDeg(reflectAngleRad) + 180;
    try {
        this.physics.velocityFromAngle(escapeAngleDeg, targetReflectSpeed, ball.body.velocity);
    console.log(`[Boss4 hitBoss - TrialPhase] Ball reflected. Angle: ${escapeAngleDeg.toFixed(1)}, Speed: ${targetReflectSpeed.toFixed(1)}`);
} catch (e) {
    console.error("[Boss4 hitBoss - TrialPhase] Error setting ball velocity for reflection:", e);
}

    // 試練達成判定 (ボールがボスに当たることが条件の試練)
    if (this.activeTrial && !this.activeTrial.completed) {
        console.log(`[Boss4 hitBoss - TrialCheck] Active Trial ID: ${this.activeTrial.id}`);
        // trialJustCompleted は既に false で初期化済み

        switch (this.activeTrial.id) {
            case 2: // 原初の契約
                if (boss === this.boss) {
                    this.activeTrial.hitCount = (this.activeTrial.hitCount || 0) + 1;
                    if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial);
                    if (this.activeTrial.hitCount >= this.activeTrial.requiredHits) {
                        trialJustCompleted = true;
                    }
                }
                break;
            case 5: // 星光の追撃
                if (boss === this.boss && this.isPlayerKubiraActive()) {
                    this.activeTrial.hitCountKubira = (this.activeTrial.hitCountKubira || 0) + 1;
                    if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial);
                    if (this.activeTrial.hitCountKubira >= this.activeTrial.requiredHitsKubira) {
                        trialJustCompleted = true; // ここも代入先に変更
                    }
                }
                break;
            case 9: // 時の超越
                if (boss === this.boss && this.isTimeFieldActive()) {
                    this.activeTrial.hitCountTimeField = (this.activeTrial.hitCountTimeField || 0) + 1;
                    if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial);
                    if (this.activeTrial.hitCountTimeField >= this.activeTrial.requiredHitsTimeField) {
                        trialJustCompleted = true; // ここも代入先に変更
                    }
                }
                break;
            case 10: // 連鎖する星々の輝き
                if (boss === this.boss) {
                    this.activeTrial.consecutiveHits = (this.activeTrial.consecutiveHits || 0) + 1;
                    if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial);
                    if (this.activeTrial.consecutiveHits >= this.activeTrial.requiredConsecutiveHits) {
                        trialJustCompleted = true; // ここも代入先に変更
                    }
                }
                break;
            // --- 他の「ボスにヒット」が条件の試練の case をここに追加 ---
        }
        console.log(`[Boss4 hitBoss - TrialCheck After Switch] trialJustCompleted: ${trialJustCompleted}`);
    }

    // trialJustCompleted の値に基づいて試練完了処理を呼び出す
    if (trialJustCompleted) {
        console.log("[Boss4 hitBoss] trialJustCompleted is true, calling completeCurrentTrial.");
        this.completeCurrentTrial();
    }

    // ボスをワープさせる
    if (boss === this.boss) { // ボス本体に当たった場合のみワープ
        this.time.delayedCall(this.bossData.warpDelayAfterHit || 100, this.warpBoss, [], this);
    }
}

spawnChaosFragments(count) {
    // this.chaosFragmentsGroup = this.physics.add.group(); // 専用グループ
    // for (let i = 0; i < count; i++) {
    //     const fragment = this.chaosFragmentsGroup.create(x, y, 'chaos_fragment_texture');
    //     fragment.setData('isChaosFragment', true);
    // }
    // ボールと欠片のコライダー設定
    // this.physics.add.collider(this.balls, this.chaosFragmentsGroup, this.hitChaosFragment, null, this);
    this.activeTrial.destroyedCount = 0; // カウンター初期化
    this.updateTrialProgressUI(this.activeTrial);
    console.log(`[Trial] Spawned ${count} Chaos Fragments. Need to destroy.`);
}

// ボールが混沌の欠片に当たった時のコールバック
hitChaosFragment(ball, fragment) {
    if (!fragment.active) return;
    // (破片破壊のSEやエフェクト)
    fragment.destroy();

    if (this.activeTrial && !this.activeTrial.completed && this.activeTrial.id === 3) {
        this.activeTrial.destroyedCount++;
        this.updateTrialProgressUI(this.activeTrial); // UI更新 (例: "破壊数: 3/5")
        if (this.activeTrial.destroyedCount >= this.activeTrial.objectsToDestroy) {
            this.completeCurrentTrial();
        }
    }
}



// Boss4Scene.js の warpBoss メソッド (createTimeline を使わないリッチな演出案)

warpBoss() {
    if (!this.boss || !this.boss.active || this.isWarping) { // isWarping フラグを追加して管理
        return;
    }
    console.log("[BossAction] Initiating Rich Warp Sequence (Sequential Tweens)...");
    this.isWarping = true; // ワープ中フラグを立てる

    // ワープSE（開始音）
    if (AUDIO_KEYS.SE_LUCILIUS_WARP_EFFECT_START) { // キーの存在確認
        try { this.sound.play(AUDIO_KEYS.SE_LUCILIUS_WARP_EFFECT_START); } catch(e){}
    }

    // 1. 現在地で収束・消滅エフェクト
    this.tweens.add({
        targets: this.boss,
        scaleX: (this.boss.getData('targetScale') || this.boss.scaleX) * 0.05, // 元のスケールの5%に
        scaleY: (this.boss.getData('targetScale') || this.boss.scaleY) * 0.05,
        alpha: 0,
        angle: this.boss.angle + Phaser.Math.RND.pick([-90, 90, 180, 270]), // 少し回転
        duration: this.bossData.warpDurationFadeOut || 250, // 消える時間を少し長く
        ease: 'Cubic.easeIn', // 徐々に加速して消える感じ
        onComplete: () => {
            if (!this.boss || !this.isWarping) return; // ワープがキャンセルされた場合など

            // 2. 短い消滅維持時間 (delayedCallで表現)
            this.time.delayedCall(this.bossData.warpDurationHold || 100, () => {
                if (!this.boss || !this.isWarping) return;

                // 3. 新しい位置を決定
                const targetX = Phaser.Math.Between(
                    this.boss.displayWidth / 2 + 60, // マージンを少し増やす
                    this.gameWidth - this.boss.displayWidth / 2 - 60
                );
                const minY = this.gameHeight * (this.bossData.warpYRange.minRatio || 0.15);
                const maxY = this.gameHeight * (this.bossData.warpYRange.maxRatio || 0.25);
                // ボス自身の高さを考慮してY座標の範囲を決定
                const bossHeightForCalc = this.boss.height * (this.boss.getData('targetScale') || this.boss.scaleY); // 表示高さを取得
                const finalTargetY = Phaser.Math.Clamp(
                    Phaser.Math.Between(minY + bossHeightForCalc / 2, maxY - bossHeightForCalc / 2),
                    bossHeightForCalc / 2, // 画面上端にはみ出ない最小Y
                    this.gameHeight - bossHeightForCalc / 2 // 画面下端にはみ出ない最大Y (通常はここまで下がらないが念のため)
                );

                this.boss.setPosition(targetX, finalTargetY);
                // 消滅時と同じ小さいスケールから開始 (alphaは0のまま)
                this.boss.setScale((this.boss.getData('targetScale') || this.boss.scaleX) * 0.05);

                console.log(`[BossAction] Warped to new position: X:${this.boss.x.toFixed(0)}, Y:${this.boss.y.toFixed(0)}`);
                // ワープSE（出現音）
                if (AUDIO_KEYS.SE_LUCILIUS_WARP_EFFECT_END) { // キーの存在確認
                     try { this.sound.play(AUDIO_KEYS.SE_LUCILIUS_WARP_EFFECT_END); } catch(e){}
                }

                // 4. 新しい位置で拡散・出現エフェクト
                this.tweens.add({
                    targets: this.boss,
                    scaleX: this.boss.getData('targetScale') || (this.bossData.widthRatio / (this.boss.texture.source[0].width / this.gameWidth)), // 元のスケールに戻す
                    scaleY: this.boss.getData('targetScale') || (this.bossData.widthRatio / (this.boss.texture.source[0].width / this.gameWidth)),
                    alpha: 1,
                    angle: this.boss.angle + Phaser.Math.RND.pick([-90, 90, 180, 270]), // 元の角度に戻るか、さらに回転
                    duration: this.bossData.warpDurationFadeIn || 250, // 出現時間を少し長く
                    ease: 'Cubic.easeOut', // 徐々に減速して現れる感じ
                    onComplete: () => {
                        this.isWarping = false; // ワープ終了
                        // ワープ後の行動停止時間を考慮して次の攻撃タイミングを調整
                        // (この計算は前回同様だが、平均攻撃間隔の取得はbossDataから行うようにする)
                        const avgAttackInterval = this.currentRoute === 'order' ?
                            (this.bossData.attackIntervalOrder.min + this.bossData.attackIntervalOrder.max) / 2 :
                            (this.bossData.attackIntervalChaos.min + this.bossData.attackIntervalChaos.max) / 2;
                        this.lastAttackTime = this.time.now + (this.bossData.pauseAfterWarp || 800) - avgAttackInterval;
                        console.log("[BossAction] Rich Warp Sequence (Sequential Tweens) Complete.");
                    }
                });
            }, [], this);
        }
    });
}


    // 放射攻撃 (仮実装)
    // Boss4Scene.js
fireRadialAttack() {
    if (!this.attackBricks || !this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) {
        return;
    }
    console.log(`[BossAttack] Firing Radial Attack (Route: ${this.currentRoute})`);
    // if (AUDIO_KEYS.SE_LUCILIUS_ATTACK_RADIAL) this.sound.play(AUDIO_KEYS.SE_LUCILIUS_ATTACK_RADIAL);

    const params = this.currentRoute === 'order' ?
        (this.bossData.radialAttackParamsOrder || {}) : // フォールバック用の空オブジェクト
        (this.bossData.radialAttackParamsChaos || {});
    const count = params.count || this.bossData.radialAttackProjectileCount || 5;
    const speed = (params.speedMultiplier ? (this.bossData.radialAttackProjectileSpeed * params.speedMultiplier) : this.bossData.radialAttackProjectileSpeed) || (DEFAULT_ATTACK_BRICK_VELOCITY_Y + 30);
    const angles = this.bossData.radialAttackAngles || [75, 90, 105]; // デフォルト角度
    const texture = this.bossData.radialAttackProjectileTexture || 'attack_brick_lucilius';
    const scale = this.bossData.radialAttackProjectileScale || 0.15;
    const spinRate = this.bossData.radialAttackProjectileSpinRate || 0;

    const spawnX = this.boss.x;
    const spawnY = this.boss.y + (this.boss.displayHeight / 2) * 0.7; // ボス下部から少し

    console.log(`[Radial Attack Params] Count:${count}, Speed:${speed.toFixed(0)}, Angles:${angles.join(',')}`);

    angles.slice(0, count).forEach(angleDeg => { // countの数だけ角度配列から取り出す
        const projectile = this.attackBricks.create(spawnX, spawnY, texture);
        if (projectile) {
            projectile.setScale(scale).setOrigin(0.5, 0.5);
            if (projectile.body) {
                this.physics.velocityFromAngle(angleDeg, speed, projectile.body.velocity);
                projectile.body.setAllowGravity(false);
                projectile.body.setCollideWorldBounds(true);
                projectile.body.onWorldBounds = true;
            }
            projectile.setData('blockType', 'projectile');
            projectile.setData('isGuaranteedDropSource', true); // ★確定ドロップ源の印
            projectile.setDepth(1);

            if (spinRate !== 0) {
                this.tweens.add({
                    targets: projectile, angle: 360, duration: (360 / Math.abs(spinRate)) * 1000, repeat: -1, ease: 'Linear'
                });
            }
        }
    });
}// ターゲット攻撃 (仮実装)
    // Boss4Scene.js
fireTargetedAttack() {
    if (!this.attackBricks || !this.boss || !this.boss.active || !this.paddle?.active || this.isGameOver || this.bossDefeated) {
        return;
    }
    console.log(`[BossAttack] Firing Targeted Attack (Route: ${this.currentRoute}) - No Prediction Marker`);
    // if (AUDIO_KEYS.SE_LUCILIUS_ATTACK_TARGET) this.sound.play(AUDIO_KEYS.SE_LUCILIUS_ATTACK_TARGET);

    const params = this.currentRoute === 'order' ?
        (this.bossData.targetedAttackParamsOrder || {}) :
        (this.bossData.targetedAttackParamsChaos || {});
    const speed = (params.speedMultiplier ? (this.bossData.targetedAttackProjectileSpeed * params.speedMultiplier) : this.bossData.targetedAttackProjectileSpeed) || (DEFAULT_ATTACK_BRICK_VELOCITY_Y + 50);
    // const chargeTime = params.chargeTime || (this.currentRoute === 'order' ? 600 : 900); // 予兆がないのでチャージ時間は不要に

    const texture = this.bossData.targetedAttackProjectileTexture || 'attack_brick_lucilius_target';
    const scale = this.bossData.targetedAttackProjectileScale || 0.15;
    const spinRate = this.bossData.targetedAttackProjectileSpinRate || 0;

    const targetX = this.paddle.x; // 発射決定時のパドルX座標
    const spawnFromBossY = this.boss.y + (this.boss.displayHeight / 2) * 0.7;

    // 予兆マーカーは表示しない

    // 即座に発射 (またはごく短い遅延)
    // this.time.delayedCall(100, () => { // 0.1秒のディレイなど、調整用
        if (!this.attackBricks || !this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) return;

        const projectile = this.attackBricks.create(this.boss.x, spawnFromBossY, texture);
        if (projectile) {
            projectile.setScale(scale).setOrigin(0.5, 0.5);
            if (projectile.body) {
                const angleToTarget = Phaser.Math.Angle.Between(
                    projectile.x, projectile.y,
                    targetX, this.gameHeight - 30 // 画面下端より少し手前を狙う
                );
                this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angleToTarget), speed, projectile.body.velocity);
                projectile.body.setAllowGravity(false);
                projectile.body.setCollideWorldBounds(true);
                projectile.body.onWorldBounds = true;
            }
            projectile.setData('blockType', 'projectile');
            projectile.setData('isGuaranteedDropSource', true); // ★確定ドロップ源の印
            projectile.setDepth(1);

            if (spinRate !== 0) {
                this.tweens.add({
                    targets: projectile, angle: projectile.angle + 360, duration: (360 / Math.abs(spinRate)) * 1000, repeat: -1, ease: 'Linear'
                });
            }
            console.log(`[Targeted Attack] Projectile fired towards X:${targetX.toFixed(0)} at Speed:${speed.toFixed(0)}`);
        }
    // }, [], this);
}// 混沌の欠片召喚 (仮実装)
    spawnChaosFragments(count) { /* TODO */ console.log(`[Trial] Spawning ${count} Chaos Fragments.`);}
    // 虚無の壁召喚 (仮実装)
    spawnVoidWall() { /* TODO */ console.log("[Trial] Spawning Void Wall.");}
    // 試練達成チェック (仮実装 - 各試練の条件に応じて詳細化)
    checkTrialCompletion(trial, ball = null, brick = null) {
        if (!trial || trial.completed) return;
        let trialJustCompleted = false;
        // --- ここに各試練IDごとの達成判定ロジックを書く ---
        // 例: trial.id === 2 (原初の契約)
        // if (trial.id === 2 && /* ボールがボスに当たった */) {
        //     trial.hitCount++;
        //     this.updateTrialProgressUI(trial); // UI更新
        //     if (trial.hitCount >= trial.requiredHits) trialJustCompleted = true;
        // }
        // ... 他の試練の判定 ...

        if (trialJustCompleted) {
            this.completeCurrentTrial();
        }
    }
    // updateTrialProgressUI (試練の進捗UIを更新するメソッド)
updateTrialProgressUI(trial) {
    if (!this.trialUiText || !this.trialUiText.active || !trial) return;
    let progressText = "";
    switch (trial.id) {
        case 2: progressText = `(${trial.hitCount || 0}/${trial.requiredHits})`; break;
        case 3: progressText = `(破壊数: ${trial.destroyedCount || 0}/${trial.objectsToDestroy})`; break;
        // ... 他の試練の進捗表示 ...
        default: break;
    }
    this.trialUiText.setText(`十二の試練：試練 ${trial.id}「${trial.name}」\n${trial.conditionText} ${progressText}`);
}


    // --- ジエンドタイマー関連メソッド (前回のものを流用) ---
    formatTime(milliseconds) { /* ... */ return `ジ・エンドまで… ${String(Math.floor(milliseconds/60000)).padStart(2,'0')}:${String(Math.floor((milliseconds%60000)/1000)).padStart(2,'0')}:${String(Math.floor((milliseconds%1000)/10)).padStart(2,'0')}`; }
    playBellSound() { /* ... */ try { if(AUDIO_KEYS.SE_JI_END_BELL) this.sound.play(AUDIO_KEYS.SE_JI_END_BELL); } catch(e){} }
    triggerJiEndGameOver() { /* ... (動画再生とsuper.gameOver()) ... */
        if (this.isGameOver) return; this.isGameOver = true; this.playerControlEnabled = false;
        this.physics.pause(); this.stopAllBossTimers(); this.sound.stopAll(); if(this.currentBgm)this.currentBgm=null;
        if (this.cache.video.has(this.jiEndVideoKey)) { /* ... 動画再生 ... */
             const video = this.add.video(this.gameWidth / 2, this.gameHeight / 2, this.jiEndVideoKey).setOrigin(0.5, 0.5).setDepth(9999);
             this.uiScene?.scene.setVisible(false); if(this.jiEndTimerText) this.jiEndTimerText.setVisible(false); if(this.trialUiText) this.trialUiText.setVisible(false);
             video.play(false); video.on('complete', () => { if(video.scene)video.destroy(); super.gameOver();}, this); video.on('error', () => super.gameOver(), this);
        } else { super.gameOver(); }
    }
    stopAllBossTimers() { /* ... (このシーンのタイマーを全て止める) ... */
        this.radialAttackTimer?.remove(); this.targetedAttackTimer?.remove();
        // 他の試練用タイマーなども
    }
    // --- ジエンドタイマー関連メソッド終了 ---


    // --- 「十二神将の導き」アイテムドロップ制御 (Commonからオーバーライド) ---
    getOverrideDropItem(brick) {
        if (!this.activeTrial || this.isFinalBattleActive || this.isChoiceEventActive || !brick.getData('blockType')) {
            // 「決着の刻」、選択中、または通常の攻撃ブロックでない場合は通常ドロップ
            if (this.isFinalBattleActive) { // 最終決戦は全アイテム100%ドロップ
                return Phaser.Utils.Array.GetRandom(Object.values(POWERUP_TYPES));
            }
            return null;
        }

        // 試練III「混沌の残滓」: マキラかバイシュラヴァをランダム
        if (this.activeTrial.id === 3 && this.activeTrial.targetItemRandom) {
            return Phaser.Utils.Array.GetRandom(this.activeTrial.targetItemRandom);
        }
        // 試練VII「三宝の導き」: 現在集めているターゲットアイテム
        if (this.activeTrial.id === 7 && this.activeTrial.targetItemsToCollect) {
            const currentTarget = this.activeTrial.targetItemsToCollect.find(item => !this.activeTrial.collectedItems.includes(item));
            return currentTarget || null; // まだ集め終わっていない最初のアイテム
        }
        // 試練IX「時の超越」: ハイラかシャトラを交互
        if (this.activeTrial.id === 9 && this.activeTrial.targetItemAlternate) {
            // (交互ドロップのロジックをここに。例: 前回ドロップを記録)
            // 簡単な例: 破壊されたブロックのX座標で決めるなど
            return brick.x < this.gameWidth / 2 ? this.activeTrial.targetItemAlternate[0] : this.activeTrial.targetItemAlternate[1];
        }

        // 上記以外で、試練に targetItem が設定されていればそれを返す
        if (this.activeTrial.targetItem) {
            return this.activeTrial.targetItem;
        }
        return null; // それ以外は通常ドロップ
    }


    // updateメソッド (ジエンドタイマー更新など)
    update(time, delta) {
        if (this.boss && this.boss.active) { // ボスが存在しアクティブなら
  //  console.log(`Boss Update - Visible: ${this.boss.visible}, Alpha: ${this.boss.alpha}, Depth: ${this.boss.depth}, X: ${this.boss.x.toFixed(0)}, Y: ${this.boss.y.toFixed(0)}`);
    // this.boss.setAlpha(1); // ★強制的にアルファを1にしてみる (テスト用)
}
if (this.backgroundObject && this.backgroundObject.active) { // 背景オブジェクトの変数名に合わせてください
    console.log(`Background Update - Visible: ${this.backgroundObject.visible}, Alpha: ${this.backgroundObject.alpha}, Depth: ${this.backgroundObject.depth}`);
    // this.backgroundObject.setAlpha(1); // ★テスト用
}
        super.update(time, delta); // CommonBossSceneのupdateを呼ぶ (ボス行動など)

        if (this.isJiEndTimerRunning && !this.isGameOver && !this.bossDefeated) {
            let speedMultiplier = 1.0;
            if (this.currentRoute === 'order') speedMultiplier = 0.75;
            else if (this.currentRoute === 'chaos') speedMultiplier = 1.25;
            this.jiEndTimeRemaining -= delta * speedMultiplier;

            if (this.jiEndTimerText?.active) this.jiEndTimerText.setText(this.formatTime(this.jiEndTimeRemaining));

            for (const timing of this.bellSoundTimings) {
                if (this.jiEndTimeRemaining <= timing && !this.playedBellTimings[timing]) {
                    this.playBellSound(); this.playedBellTimings[timing] = true; break;
                }
            }
            if (this.jiEndTimeRemaining <= 0) {
                this.jiEndTimeRemaining = 0; this.isJiEndTimerRunning = false;
                this.triggerJiEndGameOver();
            }
        }
    }

    // シーン終了時の処理
    shutdownScene() {
        super.shutdownScene();
        this.jiEndTimerText?.destroy();
        this.trialUiText?.destroy();
        this.harmonyCrystal?.destroy();
        this.destructionCrystal?.destroy();
        // 他のこのシーン固有のオブジェクトやタイマーもクリア
        console.log("--- Boss4Scene SHUTDOWN Complete ---");
    }
}
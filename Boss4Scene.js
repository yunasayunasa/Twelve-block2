// Boss4Scene.js
import CommonBossScene from './CommonBossScene.js';
import {
    AUDIO_KEYS, POWERUP_TYPES, TOTAL_BOSSES, GAMEPLAY_START_DELAY,VAJRA_GAUGE_MAX, 
    NORMAL_BALL_SPEED, BALL_SPEED_MODIFIERS, DEFAULT_ATTACK_BRICK_VELOCITY_Y,BALL_RADIUS_RATIO,
    CUTSCENE_DURATION, POWERUP_ICON_KEYS,BALL_INITIAL_VELOCITY_Y,BALL_INITIAL_VELOCITY_X_RANGE,
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
this.lastFinalBattleWarpTime = 0; // 最終決戦中のワープ用タイマー
    this.lastParadiseLostTime = 0;  // 最終決戦中のパラダイス・ロスト用タイマ
        this.trialsData = [];
        this.activeTrialIndex = -1;
        this.trialUiText = null;

        this.currentRoute = null;
        this.harmonyCrystal = null;
        this.destructionCrystal = null;
        this.isChoiceEventActive = false;
        this.chaosFragmentsGroup = null; // 専用グループ
        this.isCompletingTrial = false;
         this.isSpecialSequenceActive = false; // ★専用演出中フラグ
         this.isTrialShatoraActive = false;
         this.currentTrialBallSpeedMultiplier = 1.0;

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
          this.chaosFragmentsGroup?.destroy(true, true); // シーン初期化で破棄
    this.chaosFragmentsGroup = null;
    this.isCompletingTrial = false;
    this.isSpecialSequenceActive = false; // ★リセット
    this.currentTrialBallSpeedMultiplier = 1.0;
    this.isTrialShatoraActive = false;
this.lastFinalBattleWarpTime = 0;
    this.lastParadiseLostTime = 0;
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
            finalBattleHp: 10,
            textureKey: 'boss_lucilius_stand',
            negativeKey: 'boss_lucilius_negative',
              backgroundKey: 'gameBackground_Boss4',
            voiceAppear: AUDIO_KEYS.VOICE_LUCILIUS_APPEAR,
            voiceDamage: AUDIO_KEYS.VOICE_LUCILIUS_DAMAGE,
            voiceDefeat: AUDIO_KEYS.VOICE_LUCILIUS_DEFEAT,
            voiceRandom: AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_1 ? [AUDIO_KEYS. AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_1, // 1つ目のランダムボイスキー
        AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_2, // 2つ目のランダムボイスキー
        AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_3, 
        AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_4
        // 3つ目のランダムボイスキー (もしあれば)
        ] : [],
            bgmKey: AUDIO_KEYS.BGM_LUCILIUS_PHASE1, // 初期BGM
            // (ルート選択後や最終決戦でBGMを変える場合は、別途ロジックが必要)
            cutsceneText: 'VS ダークラプチャー・ゼロ', // Commonのカットシーンで使われる場合
            widthRatio: 0.35,
            moveRangeXRatioFinal: 0.7, // 最終決戦時の移動範囲
            moveDurationFinal: 1000,   // 最終決戦時の移動時間
            paradiseLostDamage: 8, // パラダイス・ロストの基本ダメージ

             paradiseLostPillarCount: 13, // パラダイス・ロストの光の柱の数
    paradiseLostPillarDuration: 550, // 光の柱1本の基本落下時間(ms)
    lightPillarTexture: 'light_pillar_effect', // ★要アセット＆BootSceneロード
            jiEndCountInitialMinutes: 8,//ジエンドまでの時間
            jiEndTimerYPosRatio: 0.1,
            jiEndTimerFontSizeRatio: 1 / 15,

               warpYRange: { minRatio: 0.15, maxRatio: 0.5 }, // ワープ先のY座標範囲 (画面高さ比)
    warpDelayAfterAttack: 300, // 攻撃後のワープ開始までの遅延 (ms)
    warpDelayAfterHit: 100,    // ボールヒット後のワープ開始までの遅延 (ms)
    warpDurationFadeOut: 200,  // ワープで消える時間
    warpDurationHold: 150,     // 消えている時間
    warpDurationFadeIn: 200,   // 再出現する時間
    pauseAfterWarp: 800,       // ワープ後の行動停止時間 (ms)
            trials: this.defineTrials(),
            trialRewardItem: POWERUP_TYPES.BIKARA_YANG,

             // --- ▼ 攻撃頻度の調整 ▼ ---
    attackIntervalOrder: { min: 5000, max: 7500 }, // 秩序: 2.2秒～3.5秒間隔 (以前より少し遅く)
    attackIntervalChaos: { min: 11000, max: 15000 }, // 混沌: 4.5秒～7秒間隔 (かなり遅く)
    // --- ▲ ------------------ ▲ ---

    // --- ▼ 放射攻撃パラメータのルート別調整（例）▼ ---
    radialAttackParamsBase: { // 基本パラメータ
        angles: [70, 80, 90, 100, 110], // 5方向を基本とする
        projectileSpeed: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 20, // 基本速度
        projectileTexture: 'attack_brick_lucilius',
        projectileScale: 0.15,
        projectileSpinRate: 180,
    },
    radialAttackParamsOrder: { // 秩序ルート: 弾数を増やし、少し速く
        count: 2, // 5方向全て
        speedMultiplier: 1.3,
        // (オプション) 角度を少し狭めて密度を上げるなども
    },
    radialAttackParamsChaos: { // 混沌ルート: 弾数を減らし、かなり遅く
        count: 1, // 中央3方向のみなど
        speedMultiplier: 0.5,
        // (オプション) 角度を広げて避けやすくするなども
    },
    // --- ▲ ------------------------------------ ▲ ---
 finalBattleWarpInterval: 1000,     // 最終決戦中のワープ間隔 (ms) - 例: 8秒ごと
    finalBattleParadiseLostInterval: 15000, // 最終決戦中のパラダイス・ロスト間隔 (ms) - 例: 45秒ごと
    // ...
    // --- ▼ ターゲット攻撃パラメータのルート別調整（例）▼ ---
    targetedAttackParamsBase: {
        projectileSpeed: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 40,
        projectileTexture: 'attack_brick_lucilius_target',
        projectileScale: 0.15,
        projectileSpinRate: 270,
    },
    targetedAttackParamsOrder: { // 秩序ルート: 速度微増
        speedMultiplier: 1.05,
        // (オプション) 2発連続で撃ってくるなども
    },
    targetedAttackParamsChaos: { // 混沌ルート: 速度大幅減
        speedMultiplier: 0.6,
    },

        };
        this.bossVoiceKeys = Array.isArray(this.bossData.voiceRandom) ? this.bossData.voiceRandom : [];
        this.trialsData = this.bossData.trials;
        console.log("Lucilius Zero Specific Data Initialized.");
    }

    // 試練内容を定義するヘルパーメソッド
    defineTrials() {
        return [
            { id: 1, name: "運命の岐路", conditionText: "滅びへの道を選べ", targetItem: null, completed: false, isChoiceEvent: true },
            { id: 2, name: "原初の契約", conditionText: "ルシファー本体にボールを5回当てよ。", targetItem: POWERUP_TYPES.ANCHIRA, completed: false, hitCount: 0, requiredHits: 5 },
            { id: 3, name: "混沌の残滓", conditionText: "混沌の欠片を全て破壊せよ。", targetItemRandom: [POWERUP_TYPES.MAKIRA, POWERUP_TYPES.BAISRAVA], completed: false, objectsToDestroy: 5, destroyedCount: 0, /* ...欠片生成ロジックなど... */ },
            { id: 4, name: "天穿つ最終奥義", conditionText: "ヴァジラ奥義を1回発動せよ。", targetItem: POWERUP_TYPES.VAJRA, completed: false, ougiUsed: false },
            { id: 5, name: "怪力無双", conditionText: "クビラ効果中にボールを3回当てよ。", targetItem: POWERUP_TYPES.KUBIRA, completed: false, hitCountKubira: 0, requiredHitsKubira: 3 },
            { id: 6, name: "楽園追放", conditionText: "「パラダイス・ロスト」を受けよ。", targetItem: null, anilaDropLocation: null, completed: false, paradiseLostTriggered: false }, // anilaDropLocation はドロップ時に設定
            { id: 7, name: "三宝の導き", conditionText: "三種の神将を集めよ。", 
                 dropCandidateSanpo: [POWERUP_TYPES.BIKARA_YANG, POWERUP_TYPES.BADRA, POWERUP_TYPES.MAKORA], // ★この試練中のドロップ候補
                itemsToCollectForTrial7: [POWERUP_TYPES.BIKARA_YANG, POWERUP_TYPES.BADRA, POWERUP_TYPES.MAKORA], // ★収集目標リスト
                collectedFlagsForTrial7: [false, false, false], // ★収集済みフラグ (配列の順序はitemsToCollectForTrial7に対応)
                collectedCountForTrial7: 0, // ★集めた種類の数
                completed: false
            },
            { id: 8, name: "深淵の核金", conditionText: "全てのアビス・コアを破壊せよ。",
                targetItem: POWERUP_TYPES.SINDARA,
                completed: false,
                coreCount: 3,
                initialCoreHp: 3, // 各コアの初期HP
                coresData: [],    // 各コアの状態（HPなど）を格納する配列
                destroyedCoreCount: 0
            },
            { id: 9, name: "加速する世界",
                conditionText: "高低速世界でボールを3度当てよ",
                targetItem: POWERUP_TYPES.HAILA, // この試練中のドロップアイテム
                completed: false,
                hitCountTimeField: 0,
                requiredHitsTimeField: 3,
                
                trialBallSpeedMultiplier: 3.0, // この試練中のボール速度倍率
                trialJiEndTimerMultiplier: 3.0 }, // この試練中のジエンドタイマー速度倍率
            { id: 10, name: "連鎖する星々の輝き", conditionText: "落とさずに3回当てよ。", targetItem: POWERUP_TYPES.INDARA, completed: false, consecutiveHits: 0, requiredConsecutiveHits: 3 },
            { id: 11, name: "虚無の壁", conditionText: "虚無の壁の奥の本体にボールを1回当てよ。", targetItem: POWERUP_TYPES.BIKARA_YIN, completed: false, 
               wallBlockRows: 4,
                wallBlockCols: 10,
                wallBlockWidthRatio: 0.075, // 画面幅の7.5%
                wallBlockHeight: 18,      // 固定高さ
                wallBlockSpacingX: 3,
                wallBlockSpacingY: 3,
                wallStartYRatio: 0.35, // ルシファー(Y:0.2)の少し下
                bossHitInThisTrial: false,
                bossShouldBeStatic: false },// 初期値はfalse。setupCurrentTrialEnvironmentでtrueにする },// この試練中にボスにヒットしたか
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
         try { if (AUDIO_KEYS.SE_LUCILIUS_INVULNERABLE_HIT) 
         this.sound.play(AUDIO_KEYS.SE_LUCILIUS_INVULNERABLE_HIT); } catch(e){}

        // ボスへのヒットエフェクト（赤点滅など）も行わない。
        // ただし、ボールの反射自体は hitBoss で行われる。
    }
}

// Boss4Scene.js クラス内に、他のメソッドと同列に追加してください

/**
 * ルシゼロ戦専用の攻撃ブロック（projectile）を生成し、初期設定を行う。
 * @param {number} x 生成するX座標
 * @param {number} y 生成するY座標
 * @param {string} textureKey 使用するテクスチャのキー
 * @param {object} config 設定オブジェクト（scale, speed, angleDeg など）
 * @returns {Phaser.Physics.Arcade.Image | null} 生成された攻撃ブロック、または失敗時はnull
 */
spawnLuciliusProjectile(x, y, textureKey, config = {}) {
    // attackBricksグループやボスが存在し、アクティブであることを確認
    if (!this.attackBricks || !this.boss || !this.boss.active) {
        console.warn("[SpawnLuciProjectile] Cannot spawn projectile: attackBricks group or boss is not ready/active.");
        return null;
    }

    // 設定値にデフォルト値を設定
    const scale = config.scale || 0.15; // configにscaleがなければ0.15を使用
    const speed = config.speed || (DEFAULT_ATTACK_BRICK_VELOCITY_Y + 30); // configにspeedがなければデフォルト値
    const angleDeg = config.angleDeg || 90; // configにangleDegがなければ真下(90度)
  const localSpinRate = config.spinRate || 0; // 変数名を変更して明確化 (spinRate のままでもOK)
    // 攻撃ブロック（projectile）を生成
    const projectile = this.attackBricks.create(x, y, textureKey);

    if (projectile) {
        projectile.setScale(scale).setOrigin(0.5, 0.5);
        projectile.setDepth(1); // 描画深度（ボールと同じか少し手前など、適宜調整）

        // 物理ボディの設定
        if (projectile.body) {
            this.physics.velocityFromAngle(angleDeg, speed, projectile.body.velocity); // 指定された角度と速度で発射
            projectile.body.setAllowGravity(false);       // 重力無効
             projectile.body.setCollideWorldBounds(config.speed > 0); // 速度がある弾だけ画面端と衝突
            projectile.body.onWorldBounds = (config.speed > 0);
            if (config.speed === 0) { // 静止しているブロックの場合
                projectile.setImmovable(true); // 他のボールなどに動かされないように
            }

            projectile.body.onWorldBounds = true;         // 画面の境界との衝突イベントを有効化 (跳ね返るように)
            // 必要であれば、当たり判定のサイズやオフセットをここで調整
            // projectile.body.setSize(width, height);
            // projectile.body.setOffset(offsetX, offsetY);
        } else {
            console.error(`[SpawnLuciProjectile] Failed to get physics body for projectile using texture: ${textureKey}. Destroying projectile.`);
            projectile.destroy(); // 物理ボディがなければオブジェクトを破棄して終了
            return null;
        }

        // 共通のデータ設定
        projectile.setData('blockType', 'projectile');      // これが攻撃弾であることを示す
        projectile.setData('isGuaranteedDropSource', true); // この弾からはアイテムが確定ドロップする印

          // --- ▼▼▼ 回転Tween ▼▼▼ ---
        // ★★★ ローカル変数 localSpinRate (または spinRate) を使用 ★★★
        if (localSpinRate !== 0 && Math.abs(localSpinRate) > 0.01 && this.tweens && typeof this.tweens.add === 'function') {
            const rotationDuration = (360 / Math.abs(localSpinRate)) * 1000;
            if (rotationDuration > 0 && isFinite(rotationDuration)) {
                try {
                    this.tweens.add({
                        targets: projectile,
                        angle: projectile.angle + (localSpinRate > 0 ? 359.9 : -359.9),
                        duration: rotationDuration,
                        repeat: -1,
                        ease: 'Linear'
                    });
                    // console.log(`[SpawnLuciProjectile] Spin tween added. Rate: ${localSpinRate} deg/s`);
                } catch (e_tween) { /* ... */ }
            } else { /* ... */ }
        }
        // --- ▲▲▲ 回転Tween 終了 ▲▲▲ ---
        return projectile;
        

        // console.log(`[SpawnLuciProjectile] Successfully created projectile: ${textureKey} at (${x.toFixed(0)},${y.toFixed(0)}) with Angle:${angleDeg.toFixed(1)}, Speed:${speed.toFixed(0)}`);
        return projectile; // 生成したprojectileオブジェクトを返す
    } else {
        console.error(`[SpawnLuciProjectile] Failed to create projectile image with texture: ${textureKey}`);
        return null; // 生成に失敗したらnullを返す
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

// CommonBossSceneのtriggerVajraOugiをオーバーライドして試練達成を検知
triggerVajraOugi() {
    // まず親クラスの奥義効果を実行（ボスへのダメージなど）
    // super.triggerVajraOugi(); // CommonBossSceneにこのメソッドがあれば
    // もし CommonBossScene で奥義発動が別の方法で行われている場合は、その処理をここに書くか、
    // CommonBossScene側で奥義発動時にイベントを発行し、Boss4Sceneでそれをリッスンする形でも良い。
    // ここでは、CommonBossSceneに triggerVajraOugi があると仮定。
    // なければ、奥義発動のコアロジック（ボスへのダメージ、SE再生など）をここに直接記述。

    let ougiActuallyFired = false;
    if (this.isVajraSystemActive && this.vajraGauge >= VAJRA_GAUGE_MAX) { // Commonのプロパティを参照
        console.log("[Boss4Scene Vajra] Attempting to trigger Vajra Ougi (Boss4Scene override).");
        // 奥義のコア処理 (CommonBossSceneから持ってくるか、superを呼ぶ)
        this.isVajraSystemActive = false; // 奥義使用後はゲージシステム非アクティブ化
        this.events.emit('deactivateVajraUI'); // UIに通知
        if (this.setBallPowerUpState) this.setBallPowerUpState(POWERUP_TYPES.VAJRA, false); // ボールの見た目変更
        this.updateBallAndPaddleAppearance();
        if (AUDIO_KEYS.VOICE_VAJRA_TRIGGER) this.sound.play(AUDIO_KEYS.VOICE_VAJRA_TRIGGER);

        if (this.boss?.active && !this.boss.getData('isInvulnerable')) {
            // 奥義ダメージ (CommonBossSceneのapplyBossDamageを呼ぶ)
            // 注意: 試練中はダメージ無効にしているので、決着の刻以外ではダメージは通らないが、
            // 奥義発動の事実としてダメージ処理を試みるのは良い。
            const ougiDamage = this.bossData.vajraOugiDamage || 7; // bossDataに定義
            if (this.isFinalBattleActive) { // 最終決戦中のみダメージが通る
                 super.applyBossDamage(this.boss, ougiDamage, "Vajra Ougi");
            } else {
                 console.log("[Boss4Scene Vajra] Vajra Ougi used during trial phase. No actual HP damage to Lucilius.");
                 // ダメージモーションだけは見せても良いかも
                 if (this.boss && this.boss.active) {
                    this.boss.setTintFill(0xffff00); // 金色に光るなど
                    this.time.delayedCall(300, () => this.boss?.clearTint());
                 }
            }
        }
        ougiActuallyFired = true;
        // CommonBossSceneにもtriggerVajraOugiがあるなら、super.triggerVajraOugi(); で上記を置き換える
    }


    // 試練達成判定
    if (ougiActuallyFired && this.activeTrial && !this.activeTrial.completed && this.activeTrial.id === 4) {
        console.log("[Trial IV] Vajra Ougi triggered! Trial Condition Met.");
        this.activeTrial.ougiUsed = true; // 達成フラグを立てる
        if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial); // UI更新
        this.completeCurrentTrial(); // 試練完了処理へ
    } else if (ougiActuallyFired) {
        console.log("[Boss4Scene Vajra] Ougi fired, but not for current trial or trial already complete.");
    } else {
        console.log("[Boss4Scene Vajra] Ougi trigger conditions not met (gauge not full, etc.).");
    }
}

// Boss4Scene.js (または、より汎用的にするなら CommonBossScene.js) に追加

/**
 * プレイヤーが現在クビラのパワーアップ効果を受けているかを判定する。
 * @returns {boolean} クビラ効果中であればtrue、そうでなければfalse。
 */
isPlayerKubiraActive() {
    // CommonBossSceneで管理している powerUpTimers を参照する
    // powerUpTimers は、キーがパワーアップタイプ、値がPhaserのTimerEventオブジェクトの想定
    if (this.powerUpTimers && this.powerUpTimers[POWERUP_TYPES.KUBIRA]) {
        const kubiraTimer = this.powerUpTimers[POWERUP_TYPES.KUBIRA];
        // タイマーが存在し、かつまだ完了していない（getProgress() < 1）なら効果中
        if (kubiraTimer && typeof kubiraTimer.getProgress === 'function' && kubiraTimer.getProgress() < 1) {
            // console.log("[KubiraCheck] Kubira effect is ACTIVE.");
            return true;
        }
    }
    // console.log("[KubiraCheck] Kubira effect is INACTIVE.");
    return false;
}
// }
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
              //  console.log(`[JiEndTimer] Depth reset to: ${this.jiEndTimerText.depth} after initial display.`);
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

   // Boss4Scene.js

// (constructor, init, initializeBossData, defineTrials, createSpecificBoss, applyBossDamage,
//  startIntroCutscene, startGameplay, setupJiEndTimer, setupTrialUI,
//  startHarmonyAndDestructionChoice, selectRoute, shatterCrystal,
//  startFinalBattle, completeCurrentTrial (修正済みと仮定), hitBoss, isPlayerKubiraActive, isTimeFieldActive,
//  spawnChaosFragments, hitChaosFragment, warpBoss, fireRadialAttack, fireTargetedAttack,
//  spawnVoidWall, checkTrialCompletion (仮), updateTrialProgressUI (仮),
//  formatTime, playBellSound, triggerJiEndGameOver, stopAllBossTimers, getOverrideDropItem,
//  update, shutdownScene, prepareBallForTrial, playSpecificBgm, warpBossToPosition などは前回までのものをベースに)

/**
 * 次の試練を開始する。UIを更新し、試練ごとの環境を設定し、
 * 準備時間後にプレイヤー操作を有効化し、ボスの行動を再開させる。
 */
startNextTrial() {
    // --- 1. 次の試練へインデックスを進める ---
    this.activeTrialIndex++;
    console.log(`[TrialLogic] Attempting to start next trial. New activeTrialIndex: ${this.activeTrialIndex}`);

    // --- 2. 全ての試練が完了したか、または範囲外かチェック ---
    if (this.activeTrialIndex >= this.trialsData.length) {
        console.error(`[TrialLogic] No more trials left or index out of bounds (Index: ${this.activeTrialIndex}, Total Trials defined: ${this.trialsData.length}). This should ideally lead to final battle or be caught earlier.`);
        // ここに到達するのは通常、defineTrialsの最後の要素が isFinalBattle: true でない場合など、設計ミス
        this.triggerJiEndGameOver(); // 予期せぬエラーとしてゲームオーバー
        return;
    }

    // --- 3. 現在の試練データを取得し、クラスプロパティに設定 ---
    const currentTrial = this.trialsData[this.activeTrialIndex];
    this.activeTrial = currentTrial; // activeTrialプロパティを更新

     // ★★★ 他の試練が始まるなら、パラダイスロスト演出は終わっているはずなのでフラグをfalseに ★★★
    if (currentTrial.id !== 6 && this.isSpecialSequenceActive) { // 試練VI以外でフラグがtrueならリセット
        console.warn(`[TrialLogic] Resetting isSpecialSequenceActive at start of trial ${currentTrial.id}`);
        this.isSpecialSequenceActive = false;
    }
    // ★★★---------------------------------------------------------------------------★★★

    if (!currentTrial) { // 万が一 currentTrial が undefined の場合
        console.error(`[TrialLogic] Failed to get current trial data for index ${this.activeTrialIndex}.`);
        this.triggerJiEndGameOver();
        return;
    }
    console.log(`[TrialLogic] Starting Trial ${currentTrial.id}: "${currentTrial.name}"`);

    // --- 4. 試練UIを更新 ---
    if (this.trialUiText && this.trialUiText.active) {
        let displayText = `十二の試練：試練 ${currentTrial.id}「${currentTrial.name}」\n`;
        displayText += `${currentTrial.conditionText}`;
        // updateTrialProgressUI で進捗表示も初期化（または表示）する
        if (typeof this.updateTrialProgressUI === 'function') {
            this.updateTrialProgressUI(currentTrial); // これが setText も行う想定
        } else {
            this.trialUiText.setText(displayText); // フォールバック
        }
        console.log("[TrialLogic] Trial UI updated for new trial.");
    } else {
        console.warn("[TrialLogic] trialUiText not available to update for new trial.");
    }

    // --- 5. ボスの状態をリセット（角度、試練中はまだ無敵のまま） ---
    if (this.boss && this.boss.active && !currentTrial.isFinalBattle) {
        this.boss.setAngle(0); // 角度を0に戻す
        // ボスの無敵状態は、completeCurrentTrialでtrueに設定され、
        // このメソッドの準備時間終了後にfalseに戻される。
        console.log(`[TrialLogic] Boss angle reset for Trial ${currentTrial.id}. Boss should still be invulnerable from previous trial completion.`);
    }

     // ★★★ 新しい試練開始時に isWarping フラグをリセット ★★★
    if (this.isWarping) {
        console.warn(`[TrialLogic Start Trial ${currentTrial.id}] Forcibly resetting isWarping from true to false.`);
        this.isWarping = false;
        // もし実行中のワープTweenがあれば、ここでキャンセルするのも手
        // this.tweens.killTweensOf(this.boss, ['angle', 'scaleX', 'scaleY', 'alpha']);
        // this.boss.setAlpha(1).setAngle(0).setScale(this.boss.getData('targetScaleX') || /*...*/); // 見た目を元に戻す
    }
    // ★★★-------------------------------------------------★★

    // --- 6. 試練の種類に応じた分岐処理 ---
    if (currentTrial.isChoiceEvent) { // 試練I: 「調和と破壊の選択」
        console.log("[TrialLogic] Current trial is a Choice Event. Starting Harmony/Destruction choice.");
        // 準備時間タイマーなどを一旦クリア (もしあれば)
        // this.time.removeAllEvents(); // やりすぎると他の重要なタイマーも消えるので注意
        if (this.preparationTimer) this.preparationTimer.remove();

        this.startHarmonyAndDestructionChoice(); // これがプレイヤー操作やボール準備も行う
        // startHarmonyAndDestructionChoice の中で playerControlEnabled は true になる
    } else if (currentTrial.isFinalBattle) { // 試練XII: 「決着の刻」
        console.log("[TrialLogic] Current trial is the Final Battle. Starting final phase.");
        if (this.preparationTimer) this.preparationTimer.remove();

        this.startFinalBattle(); // これがボスHP設定、移動開始、プレイヤー操作有効化などを行う
        this.playerControlEnabled = true; // 念のため
        // 最終決戦用BGMの再生
        const finalBgmKey = this.bossData.bgmKeyFinalBattle || AUDIO_KEYS.BGM_LUCILIUS_FINAL_BATTLE;
        if (finalBgmKey) this.playSpecificBgm(finalBgmKey);
    } else { // 通常の試練 (試練II ～ XI)
        console.log("[TrialLogic] Current trial is a standard trial. Setting up environment and preparation time.");
        this.setupCurrentTrialEnvironment(currentTrial); // 試練ごとのオブジェクト配置など

        // プレイヤー操作は既に有効になっているはず (completeCurrentTrial で false にしていないため)
        // もし試練クリア演出で操作を止めていた場合は、ここで再度有効化する
        if (!this.playerControlEnabled) {
             this.playerControlEnabled = true;
             console.log("[TrialLogic] Player control RE-ENABLED for standard trial.");
        }
        this.isBallLaunched = false;    // ボールは常に再発射待ちから開始
        this.prepareBallForTrial();     // ボールをパドル上などにリセット

        // --- 準備時間タイマー ---
        const preparationTime = 3000; // 3秒 (調整可能)
        console.log(`[TrialLogic] Starting ${preparationTime/1000}s preparation time for trial ${currentTrial.id}.`);
        // 既存の準備タイマーがあればクリア
        if (this.preparationTimer) this.preparationTimer.remove();

        this.preparationTimer = this.time.delayedCall(preparationTime, () => {
            this.preparationTimer = null; // タイマー参照クリア
            if (this.isGameOver || this.bossDefeated || !this.activeTrial || this.activeTrial.id !== currentTrial.id) {
                console.log("[TrialLogic PrepTimeEnd] Game state changed or trial mismatch during prep time. Aborting boss activation.");
                return;
            }
            console.log(`[TrialLogic PrepTimeEnd] Preparation time for trial ${currentTrial.id} ended. Activating boss.`);

            // ボスを攻撃可能にし、行動タイマーをリセット
            if (this.boss && this.boss.active) {
                this.boss.setData('isInvulnerable', false); // ★ここで無敵解除★
                console.log(`[TrialLogic PrepTimeEnd] Boss invulnerability REMOVED for trial ${currentTrial.id}.`);
            }
            this.lastAttackTime = this.time.now; // 攻撃タイマーリセット
            this.lastWarpTime = this.time.now;   // ワープタイマーリセット
            console.log(`[TrialLogic PrepTimeEnd] Attack/Warp timers reset. Boss will now act for trial ${currentTrial.id}.`);

            // (オプション) 新しい試練開始の短いSEや演出
            if (AUDIO_KEYS.SE_TRIAL_ANNOUNCE) this.sound.play(AUDIO_KEYS.SE_TRIAL_ANNOUNCE);

        }, [], this);
        // --- 準備時間タイマー終了 ---

        // BGMの確認・再生 (ルートによってBGMを変える場合のロジック)
        let bgmToPlay = this.bossData.bgmKeyDefaultTrials || this.bossData.bgmKey; // bossDataに試練中デフォルトBGMキーを持たせる
        if (this.currentRoute === 'order' && this.bossData.bgmKeyTrialsOrder) {
            bgmToPlay = this.bossData.bgmKeyTrialsOrder;
        } else if (this.currentRoute === 'chaos' && this.bossData.bgmKeyTrialsChaos) {
            bgmToPlay = this.bossData.bgmKeyTrialsChaos;
        }
        if (bgmToPlay && (!this.currentBgm || this.currentBgm.key !== bgmToPlay || !this.currentBgm.isPlaying)) {
            this.playSpecificBgm(bgmToPlay);
        } else if (!this.currentBgm || !this.currentBgm.isPlaying) {
            this.playBossBgm(); // フォールバック
        }
    }
    console.log(`--- Boss4Scene startNextTrial for Trial ID ${currentTrial.id} Complete ---`);
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
    console.log("[SetupTrialEnv] Setting up for Trial ID:", trial?.id, "TrialData:", trial); // trial の中身を確認
    if (trial.id === 3) { // 試練III「混沌の残滓」
        this.spawnChaosFragments(trial.objectsToDestroy || 5); }
        // 例: 試練XI「虚無の壁」なら壁を召喚
         else if (trial.id === 6) { // 試練VI「楽園追放」
        this.executeParadiseLostSequence();
    }
 if (trial.id === 8) {
        this.spawnAbyssCores(trial.coreCount || 3);
    }
 if (trial.id === 9) { // 時の超越
        this.activateTrialShatora(trial.trialBallSpeedMultiplier || 1.5);
        // ジエンドタイマーの速度変更は update メソッドで trial.trialJiEndTimerMultiplier を参照
    }
       if (trial && trial.id === 11) { // ★trial が存在し、IDが11か確認★
        this.spawnVoidWall(trial); // ★この trial が spawnVoidWall に渡される★
    }}

    // Boss4Scene.js
// Boss4Scene.js
spawnVoidWall(trialData) {
    console.log("[Trial XI] Spawning Void Wall. Boss will attack but not warp.");
    if (this.boss && this.boss.active) {
        this.boss.setY(this.gameHeight * 0.1); // 画面最上部に固定
        this.boss.setImmovable(true);
        if (this.boss.body) this.boss.body.moves = false;

        if (this.activeTrial && this.activeTrial.id === 11) {
            this.activeTrial.bossShouldBeStatic = true; // ★このフラグを「ワープしない」という意味で使う★
            // (あるいは、this.activeTrial.canBossWarp = false; のような新しいフラグでも良い)
        }
        // ★攻撃タイマーはリセットして、攻撃できるようにする★
        this.lastAttackTime = this.time.now;
        console.log(`[Trial XI] Boss attack timer reset. LastAttackTime: ${this.lastAttackTime.toFixed(0)}`);
    }

    if (this.voidWallBlocksGroup) this.voidWallBlocksGroup.clear(true, true);
    else this.voidWallBlocksGroup = this.physics.add.group({ immovable: true }); // ブロック自体は動かない

    const rows = trialData.wallBlockRows || 4;
    const cols = trialData.wallBlockCols || 10;
    const blockWidth = this.gameWidth * (trialData.wallBlockWidthRatio || 0.075);
    const blockHeight = trialData.wallBlockHeight || 18;
    const spacingX = trialData.wallBlockSpacingX || 3;
    const spacingY = trialData.wallBlockSpacingY || 3;
    const totalWallWidth = (blockWidth * cols) + (spacingX * (cols - 1));
    const startX = (this.gameWidth - totalWallWidth) / 2; // 壁全体を中央揃え
    const startY = this.gameHeight * (trialData.wallStartYRatio || 0.35);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const blockX = startX + c * (blockWidth + spacingX) + blockWidth / 2; // 中心X
            const blockY = startY + r * (blockHeight + spacingY) + blockHeight / 2; // 中心Y

            const wallBlock = this.voidWallBlocksGroup.create(blockX, blockY, 'whitePixel')
                .setDisplaySize(blockWidth, blockHeight)
                .setTintFill(0x553377) // 濃い紫色など
                .setOrigin(0.5)
                .setData('blockType', 'voidWallBlock'); // 専用タイプ
            // wallBlock.body.setAllowGravity(false); // group作成時にimmovableなら不要のはず
        }
    }

    // ボールと壁ブロックの衝突設定
    if (this.ballVoidWallCollider) this.ballVoidWallCollider.destroy();
    this.ballVoidWallCollider = this.physics.add.collider(this.balls, this.voidWallBlocksGroup, this.hitVoidWallBlock, null, this);

    this.activeTrial.bossHitInThisTrial = false; // リセット
    console.log("[Trial XI] Void Wall spawned. Boss hit flag reset.");
}
    
// Boss4Scene.js
hitVoidWallBlock(ball, wallBlock) {
    if (!wallBlock.active) return;
    console.log("[Trial XI] Ball hit Void Wall Block.");
    // (破壊SE、シンプルな破片パーティクルなど)
    // this.sound.play('se_void_block_break');
    // this.createImpactParticles(wallBlock.x, wallBlock.y, [0,360], 0x553377, 5);
    wallBlock.destroy();
    this.increaseVajraGauge(); // ヴァジラゲージは増やす

    // 全ての壁ブロックが破壊されたかチェック (クリア条件ではないが、何らかのボーナスがあっても良い)
    if (this.voidWallBlocksGroup && this.voidWallBlocksGroup.countActive(true) === 0) {
        console.log("[Trial XI] All Void Wall blocks destroyed!");
        // (特別なSEやエフェクトなど)
    }
}

   // Boss4Scene.js
spawnAbyssCores(coreCount) {
    if (this.abyssCoresGroup) this.abyssCoresGroup.clear(true, true);
    else this.abyssCoresGroup = this.physics.add.group({ immovable: true });

    console.log(`[Trial VIII] Spawning ${coreCount} Abyss Cores.`);
    this.activeTrial.coresData = []; // コアデータ配列を初期化
    this.activeTrial.destroyedCoreCount = 0;

    const coreY = this.boss.y - (this.boss.displayHeight * 0.3); // ボスより少し上
    const coreSpacing = this.gameWidth / (coreCount + 1);

    for (let i = 0; i < coreCount; i++) {
        const coreX = coreSpacing * (i + 1);
        const core = this.abyssCoresGroup.create(coreX, coreY, 'abyss_core')
            .setScale(0.15) // 仮スケール
            .setData('coreIndex', i)
            .setData('health', this.activeTrial.initialCoreHp || 3) // 初期HP設定
            .setDepth(2)
            .setImmovable(true); // ボールで動かないように
        if (core.body) core.body.setAllowGravity(false);

        this.activeTrial.coresData.push({ instance: core, currentHp: this.activeTrial.initialCoreHp || 3 });
    }

    if (this.ballAbyssCoreCollider) this.ballAbyssCoreCollider.destroy();
    this.ballAbyssCoreCollider = this.physics.add.collider(this.balls, this.abyssCoresGroup, this.hitAbyssCore, null, this);
    this.updateTrialProgressUI(this.activeTrial);
}

// Boss4Scene.js
// Boss4Scene.js
hitAbyssCore(ball, core) {
    if (!core.active || !this.activeTrial || this.activeTrial.id !== 8 || this.activeTrial.completed) return;

    const coreIndex = core.getData('coreIndex');
    let currentCoreHp = core.getData('health');

    if (currentCoreHp > 0) {
        currentCoreHp--;
        core.setData('health', currentCoreHp);
        console.log(`[Trial VIII] Abyss Core ${coreIndex} hit. Remaining HP: ${currentCoreHp}`);

        // ヒットエフェクト（色を変える、小さくするなど）
        this.tweens.add({ targets: core, scale: core.scale * 0.9, duration: 50, yoyo: true });
        // (ヒットSE)

        if (currentCoreHp <= 0) {
            console.log(`[Trial VIII] Abyss Core ${coreIndex} destroyed.`);
            // (コア破壊SE、エフェクト)
            core.destroy(); // コアを破壊
            this.activeTrial.destroyedCoreCount++;
            this.updateTrialProgressUI(this.activeTrial);

            if (this.activeTrial.destroyedCoreCount >= this.activeTrial.coreCount) {
                console.log("[Trial VIII] All Abyss Cores destroyed.");
                this.completeCurrentTrial();
                if (this.ballAbyssCoreCollider) this.ballAbyssCoreCollider.destroy();
                this.ballAbyssCoreCollider = null;
            }
        }
    }
}

    // executeParadiseLostSequence (演出シーケンス開始)
executeParadiseLostSequence() {
    if (this.isSpecialSequenceActive || this.isGameOver || this.bossDefeated) return;
    this.isSpecialSequenceActive = true;
    console.log(`[ParadiseLost Sequence] Starting. FinalBattle mode: ${this.isFinalBattleActive}`);

    // ★★★ パラダイス・ロスト演出開始時にボスを無敵にする ★★★
    if (this.boss && this.boss.active) {
        this.boss.setData('isInvulnerable', true);
        console.log("[ParadiseLost Sequence] Boss set to INVULNERABLE.");
    }
    const moveToCenterDuration = 500;
    const flyOffDuration = 300;
    const pauseOffScreenDuration = 500;
    const returnDuration = 700;
    const chargeDuration = 3000;

    // 1a. 画面中央へ移動
    this.warpBossToPosition(this.gameWidth / 2, this.gameHeight / 2, moveToCenterDuration, () => {
        if (this.isGameOver || this.bossDefeated) return;
        // 1b. 高速で画面上部画面外へ
        this.tweens.add({
            targets: this.boss, y: -this.boss.displayHeight, scale: this.boss.scale * 0.5, duration: flyOffDuration, ease: 'Power2.easeIn',
            onComplete: () => {
                if (this.isGameOver || this.bossDefeated) return;
                this.boss.setVisible(false); // 一旦見えなくする
                // executeParadiseLostSequence の1c部分 (再出現)
                this.time.delayedCall(pauseOffScreenDuration, () => {
                    if (this.isGameOver || this.bossDefeated) return;

                    // ★★★ 再出現の開始位置とスケール ★★★
                    const reappearStartY = -this.boss.displayHeight / 2; // 画面上部画面外
                    const reappearStartScale = (this.bossData.widthRatio / (this.boss.texture.source[0].width / this.gameWidth)) * 1.5; // 最初は少し大きめに見せる (奥にいるので)
                    this.boss.setPosition(this.gameWidth / 2, reappearStartY);
                    this.boss.setScale(reappearStartScale);
                    this.boss.setAlpha(0.8).setVisible(true); // 少し半透明で出現開始
                    // ★★★------------------------------★★★

                    // (再出現SE)
                    console.log("[Trial VI] Boss reappearing from top, moving to center and shrinking...");
                    this.tweens.add({
                        targets: this.boss,
                        y: this.gameHeight / 2, // ★画面の完全な中央Yへ★
                        scale: (this.bossData.widthRatio / (this.boss.texture.source[0].width / this.gameWidth)) * 0.7, // ★最終的に少し小さめのスケールに (チャージ演出用)★
                        alpha: 1,
                        duration: returnDuration, // 0.7秒 (調整可能)
                        ease: 'Power1.easeOut', // ゆっくりと近づいてくる感じ
                        onComplete: () => {
                            if (this.isGameOver || this.bossDefeated) return;
                            // ★ルシファーが画面中央、少し小さめの状態でチャージ開始★
                            console.log("[Trial VI] Boss reached center, starting Paradise Lost charge.");
                            this.startParadiseLostCharge(chargeDuration);
                        }
                    });
                }, [], this);
            }
        });
    });
}

startParadiseLostCharge(duration) {
    console.log("[Trial VI] Paradise Lost charging for", duration, "ms");
    this.isChargingParadiseLost = true; // チャージ中フラグ (もし必要なら)

    // ボイス再生
    if (this.bossData.voiceParadiseLost && AUDIO_KEYS[this.bossData.voiceParadiseLost]) { // キーの存在確認
        try { this.sound.play(this.bossData.voiceParadiseLost); } catch(e) {}
    }
    // チャージSE開始 (ループまたは持続音)
    if (AUDIO_KEYS.SE_PARADISE_LOST_CHARGE && this.sound.get(AUDIO_KEYS.SE_PARADISE_LOST_CHARGE)) {
        this.paradiseLostChargeSound = this.sound.add(AUDIO_KEYS.SE_PARADISE_LOST_CHARGE, { loop: true, volume: 0.7 });
        try { this.paradiseLostChargeSound.play(); } catch(e) {}
    }

    // --- ▼ チャージ演出 ▼ ---
    // 1. ルシファー本体の発光・色変化
    if (this.boss && this.boss.active) {
        this.tweens.add({
            targets: this.boss,
            alpha: { from: 1, to: 0.7, yoyo: true, duration: duration / 6 }, // わずかに明滅
            tint: 0xff6666, // 赤みがかったティント
            repeat: 2, // 3回実行 (duration/6 * 2 * 3 = duration)
            ease: 'Sine.easeInOut',
            onComplete: () => { // 最後に元の状態に戻す
                if (this.boss?.active) this.boss.clearTint().setAlpha(1);
            }
        });
    }

    // 2. 画面全体の薄い赤フィルター (徐々に濃くなる)
    this.screenRedFilter = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0xff0000, 0)
        .setOrigin(0,0).setDepth(800); // ボスやUIよりは奥、背景よりは手前
    this.tweens.add({
        targets: this.screenRedFilter,
        alpha: 0.25, // 最大の赤み (調整可能)
        duration: duration * 0.8, // チャージ時間の80%かけて濃くする
        ease: 'Linear'
    });

    // 3. シンプルな光の筋の収束
    const lightBeamCount = 8; // 収束する光の筋の数
    this.convergingLightBeams = this.add.group();
    for (let i = 0; i < lightBeamCount; i++) {
        // 画面外周のランダムな位置から開始
        const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 359));
        const radius = Math.max(this.gameWidth, this.gameHeight) * 0.7; // 画面外から十分な距離
        const startX = this.boss.x + Math.cos(angle) * radius;
        const startY = this.boss.y + Math.sin(angle) * radius;

        const beam = this.add.line(0, 0, startX, startY, this.boss.x, this.boss.y, 0xffffff, 0.7)
            .setOrigin(0,0) // lineの原点は(0,0)で、x,y,x2,y2で描画
            .setLineWidth(Phaser.Math.Between(1, 3)) // 線の太さをランダムに
            .setAlpha(0)
            .setDepth(801); // 赤フィルターより手前
        this.convergingLightBeams.add(beam);

        this.tweens.add({
            targets: beam,
            alpha: { from: 0, to: 0.7, duration: 500, yoyo: true, hold: duration - 1500, ease: 'Sine.easeInOut' }, // チャージ中盤に表示
            // x: this.boss.x, // Lineのx1,y1を動かすTween (より高度)
            // y: this.boss.y,
            delay: Phaser.Math.Between(0, duration - 1000), // ランダムな遅延で出現
            onComplete: () => { if (beam.scene) beam.destroy(); } // 終わったら消す
        });
    }
    // --- ▲ チャージ演出 終了 ▲ ---

    // アニラドロップ (タイミングはチャージ開始直後が良い)
    this.time.delayedCall(500, () => { // 0.5秒後くらい
        if (this.isGameOver || this.bossDefeated || !this.isSpecialSequenceActive) return;
        const anilaDropX = Phaser.Math.Between(this.gameWidth * 0.2, this.gameWidth * 0.8);
        const anilaDropY = this.gameHeight * 0.5;
        this.dropSpecificPowerUp(anilaDropX, anilaDropY, POWERUP_TYPES.ANILA);
        // (アニラドロップSE)
    }, [], this);


    // チャージ時間後に発動
    this.time.delayedCall(duration, this.fireParadiseLost, [], this);
}


fireParadiseLost() {
    console.log("[Trial VI] Firing Paradise Lost! (Shape & Camera FX Version)");
    this.isChargingParadiseLost = false; // チャージ終了

    // --- ▼ 発動前準備 (チャージエフェクト停止など) ▼ ---
    if (this.paradiseLostChargeSound?.isPlaying) this.paradiseLostChargeSound.stop();
    this.tweens.killTweensOf(this.boss); // ボスのチャージ中Tweenを停止
    if (this.boss?.active) this.boss.clearTint().setAlpha(1).setAngle(0); // 見た目を元に戻し、角度もリセット
    if (this.screenRedFilter?.active) {
        this.tweens.add({targets: this.screenRedFilter, alpha:0, duration:200, onComplete: ()=>this.screenRedFilter?.destroy()});
    }
    this.convergingLightBeams?.clear(true, true); // 光の筋を全て破棄
    // (画面揺れなどもここで止める)
    // this.cameras.main.shakeEffect.reset(); // もしシェイク中なら
    // --- ▲ 発動前準備 終了 ▲ ---

    if (AUDIO_KEYS.SE_PARADISE_LOST_EXECUTE) try { this.sound.play(AUDIO_KEYS.SE_PARADISE_LOST_EXECUTE); } catch(e){}

    // --- ▼ 発動演出シーケンス (図形とカメラエフェクト主体) ▼ ---
    const effectDuration = this.bossData.paradiseLostEffectDuration || 2000; // 演出全体の時間(ms)

    // ステップ1: 画面全体の強力な白フラッシュ (一瞬)
    this.cameras.main.flash(250, 255, 255, 255, true); // 0.25秒白く光る (force=true)
    console.log("[ParadiseLost GFX] Initial screen flash.");

    // ステップ2: ボス中心からの衝撃波エフェクト (複数回、少し遅れて開始)
    const shockwaveCount = 3;
    const shockwaveInterval = 200; // 各衝撃波の発生間隔
    const shockwaveDuration = 800; // 1つの衝撃波が消えるまでの時間
    for (let i = 0; i < shockwaveCount; i++) {
        this.time.delayedCall(100 + i * shockwaveInterval, () => { // フラッシュの少し後から開始
            if (this.isGameOver || this.bossDefeated || !this.scene.isActive() || !this.boss?.active) return;
            const shockwave = this.add.circle(this.boss.x, this.boss.y, 0, 0xffffff, 0.7) // 初期半径0, 半透明の白
                .setStrokeStyle(4, 0xffffff, 0.4) // 白い輪郭
                .setDepth(9995); // 非常に手前
            this.tweens.add({
                targets: shockwave,
                radius: this.gameWidth, // 画面幅まで広がる (またはgameHeightとの大きい方)
                alpha: 0,
                duration: shockwaveDuration,
                ease: 'Expo.easeOut', // 急速に広がってゆっくり消える
                onComplete: () => { if (shockwave?.scene) shockwave.destroy(); }
            });
        });
    }
    console.log(`[ParadiseLost GFX] ${shockwaveCount} shockwaves initiated.`);

   // Boss4Scene.js - fireParadiseLost 内の光の柱生成ループを置き換え

    // ステップ3: 光の柱（Rectangle組み合わせバージョン）
    const pillarCount = this.bossData.paradiseLostPillarCount || 7; // 柱の数を増やす
    const pillarBaseWidth = this.gameWidth / 25; // 柱の芯の基本幅
    const pillarFallDuration = this.bossData.paradiseLostPillarDuration || 700;

    console.log(`[ParadiseLost GFX] Scheduling ${pillarCount} advanced light pillars.`);
    for (let i = 0; i < pillarCount; i++) {
        this.time.delayedCall(Phaser.Math.Between(50, 300) + i * 120, () => { // 少しずつずらして開始
            if (this.isGameOver || this.bossDefeated || !this.scene.isActive()) return;

            const pillarX = Phaser.Math.Between(this.gameWidth * 0.05, this.gameWidth * 0.95);
            const startY = -this.gameHeight * 0.1; // 画面上部画面外から
            const endY = this.gameHeight;       // 画面下端まで

            // --- 柱の芯 ---
            const corePillar = this.add.rectangle(
                pillarX, startY,
                pillarBaseWidth, this.gameHeight * 1.2, // 画面より少し長い
                0xffffff, 1 // 真っ白、不透明
            ).setOrigin(0.5, 0).setAlpha(0).setDepth(850);

            // --- オーラ (芯の両側に2つ) ---
            const auraWidthMultiplier = 2.5;
            const auraAlpha = 0.3;
            const auraPillarLeft = this.add.rectangle(
                pillarX - pillarBaseWidth * 0.6, startY,
                pillarBaseWidth * auraWidthMultiplier, corePillar.height,
                0xaaaaff, auraAlpha // 薄い青紫
            ).setOrigin(0.5, 0).setAlpha(0).setDepth(849); // 芯より少し奥

            const auraPillarRight = this.add.rectangle(
                pillarX + pillarBaseWidth * 0.6, startY,
                pillarBaseWidth * auraWidthMultiplier, corePillar.height,
                0xaaaaff, auraAlpha
            ).setOrigin(0.5, 0).setAlpha(0).setDepth(849);

            const allPillarParts = [corePillar, auraPillarLeft, auraPillarRight];

            // 落下とフェードイン・アウトのTween
            this.tweens.add({
                targets: allPillarParts,
                y: endY,
                alpha: { from: 0.9, to: 0, start: 0.8, end: 0 }, // 現れてから消える
                duration: pillarFallDuration * Phaser.Math.FloatBetween(0.9, 1.3), // 落下時間に揺らぎ
                ease: 'Cubic.easeIn', // 加速して落ちる
                delay: i * 50, // 各柱の開始をさらにわずかに遅延
                onComplete: () => {
                    allPillarParts.forEach(p => { if (p.scene) p.destroy(); }); // 全パーツ破棄

                    // 着弾エフェクト (円形の衝撃波)
                    if (!this.isGameOver && this.scene.isActive()) { // ゲームオーバーでなければ
                        const impactCircle = this.add.circle(pillarX, endY - 50, 0, 0xffffff, 0.7) // 地面より少し上
                            .setDepth(851);
                        this.tweens.add({
                            targets: impactCircle,
                            radius: pillarBaseWidth * 3,
                            alpha: 0,
                            duration: 300,
                            ease: 'Quad.easeOut',
                            onComplete: () => { if (impactCircle.scene) impactCircle.destroy(); }
                        });
                        // 短いカメラシェイク
                        if (i % 2 === 0) this.cameras.main.shake(100, 0.003); // 偶数番目の柱でシェイク
                    }
                }
            });
        });
    }
    // --- ▲ 発動演出シーケンス 終了 ▲ ---



    // ダメージ処理と試練達成 (演出がある程度落ち着くのを待つ)
    // (白フラッシュ300ms + 衝撃波や光の柱の主要部分が終わるまでを想定)
    const damageDelay = 800; // 演出とダメージ処理の間の遅延
     this.time.delayedCall(damageDelay, () => {
        if (this.isGameOver || this.bossDefeated || !this.scene.isActive()) {
            this.isSpecialSequenceActive = false;
            if (this.boss?.active) this.boss.setData('isInvulnerable', false); // 念のため解除
            return;
        }

       
        let damage = this.bossData.paradiseLostDamage || 8;
        if (this.isPlayerAnilaActive()) { // isPlayerAnilaActive は CommonBossScene に定義
            damage = 0;
            console.log("[ParadiseLost] NEGATED by Anila!");
            if (typeof this.deactivateAnila === 'function') { // deactivateAnila も CommonBossScene に定義
                this.deactivateAnila(); // ★アニラ効果を消費（解除）★
                console.log("[ParadiseLost] Anila effect consumed.");
            }
        }
        console.log(`[Trial VI] Player to take ${damage} damage from Paradise Lost.`);

        if (damage > 0) {
            for(let i=0; i < damage; i++) {
                if(this.lives > 0 && !this.isGameOver) this.loseLife();
                else break;
            }
        }


        // ライフが0になった場合のゲームオーバー処理 (loseLife内でgameOverが呼ばれる想定だが念のため)
        if (this.lives <= 0 && !this.isGameOver) {
            console.log("[Trial VI] Lives reached 0 after Paradise Lost. Triggering game over.");
            this.isGameOver = true; // isGameOverを立ててから
            this.playerControlEnabled = false;
            // 派手なエフェクトが少し収まるのを待ってからゲームオーバー処理へ
            this.time.delayedCall(500, () => {
                if (this.scene.isActive()) super.gameOver();
            }, [], this);
             this.isSpecialSequenceActive = false;
            if (this.boss?.active) this.boss.setData('isInvulnerable', false); // 無敵解除
            return; // 試練達成には進まない
        }

         // パラダイス・ロストの攻撃シーケンスが完了
        this.isSpecialSequenceActive = false;
        console.log("[ParadiseLost] Attack sequence finished. SpecialSequenceActive = false.");

        // ★★★ ボスの無敵状態を解除し、行動タイマーをリセット ★★★
        if (this.boss && this.boss.active) {
            this.boss.setData('isInvulnerable', false);
            console.log("[ParadiseLost] Boss invulnerability REMOVED. Boss will resume actions.");
        }
        this.lastAttackTime = this.time.now; // 次の通常攻撃までのインターバルをリセット
        if (this.isFinalBattleActive) {
             this.lastFinalBattleWarpTime = this.time.now; // 最終決戦中のワープタイマーもリセット
        }
        // ★★★-------------------------------------------------★★★


        // 試練VIの場合のみ、試練達成処理へ
        if (!this.isFinalBattleActive && this.activeTrial && this.activeTrial.id === 6) {
            this.activeTrial.paradiseLostTriggered = true;
            this.completeCurrentTrial();
        } else if (this.isFinalBattleActive) {
            console.log("[ParadiseLost] Finished in Final Battle. Boss AI continues.");
            // 最終決戦では、この後 updateFinalBattleBossAI が通常の攻撃/ワープを再開する
        }
    }, [], this);
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



    // Boss4Scene.js
startSpecificBossMovement() {
    if (this.isFinalBattleActive) { // ★最終決戦かどうかの分岐★
        console.log("[Boss4Movement] Final Battle: Lucilius Zero starts moving with attack patterns!");
        if (this.bossMoveTween) this.tweens.killTweensOf(this.boss); // 既存のTweenがあれば停止
        this.boss.setAngle(0); // 念のため角度リセット

        // 最終決戦用の移動パターン (例: CommonBossSceneの左右移動)
        const moveWidth = this.gameWidth * (this.bossData.moveRangeXRatioFinal || 0.7) / 2;
        const leftX = this.gameWidth / 2 - moveWidth;
        const rightX = this.gameWidth / 2 + moveWidth;
        if (this.boss) this.boss.setX(this.gameWidth / 2); // 中央から開始

        const easeFunctions = ['Sine.easeInOut', 'Quad.easeInOut', 'Cubic.easeInOut'];
        const moveToRight = () => {
            if (!this.boss?.active || !this.isFinalBattleActive || this.isGameOver || this.bossDefeated) return;
            this.bossMoveTween = this.tweens.add({ targets: this.boss, x: rightX, duration: (this.bossData.moveDurationFinal || 3000), ease: Phaser.Utils.Array.GetRandom(easeFunctions), onComplete: moveToLeft });
        };
        const moveToLeft = () => {
            if (!this.boss?.active || !this.isFinalBattleActive || this.isGameOver || this.bossDefeated) return;
            this.bossMoveTween = this.tweens.add({ targets: this.boss, x: leftX, duration: (this.bossData.moveDurationFinal || 3000), ease: Phaser.Utils.Array.GetRandom(easeFunctions), onComplete: moveToRight });
        };
        moveToRight(); // 移動開始
        // (ここに最終決戦用の攻撃タイマー初期化なども入れても良い)
        // this.lastAttackTime = this.time.now; // updateFinalBattleBossAI で管理するなら不要
    } else { // 試練中
        console.log("[Boss4Movement] Trial Phase: Lucilius Zero remains stationary.");
        if (this.bossMoveTween) this.tweens.killTweensOf(this.boss);
        if (this.boss && this.boss.body) {
            this.boss.setVelocity(0, 0);
            this.boss.setAngle(0); // 試練開始時にも角度リセット
        }
    }
}

    // ボスの攻撃パターンとワープ - lastAttackTime の更新を確認

  updateSpecificBossBehavior(time, delta) {
       // --- ▼ ガード処理 ▼ ---
       
     // --- ▼ ガード処理用の変数をここで宣言・設定 ▼ ---
    let blockBossActions = this.isIntroAnimating ||
                           !this.playerControlEnabled ||
                           !this.boss || !this.boss.active ||
                           this.bossDefeated ||
                           this.isGameOver ||
                           this.isChoiceEventActive || // 選択イベント中は通常のボス行動はしない
                           this.isCompletingTrial ||   // 試練完了演出中も同様
                           this.isSpecialSequenceActive; // パラダイス・ロスト演出中も同様
      if (this.isFinalBattleActive) { // 最終決戦モードか？
        // 最終決戦中でも、他の基本的なガード条件（ゲームオーバーなど）は blockBossActions でチェックされる
        if (!blockBossActions) { // ゲームオーバーや演出中でなければAI実行
            this.updateFinalBattleBossAI(time, delta);
        }
        return; // 最終決戦中は、以下の試練中ロジックは実行しない
    }

    // 試練XI「虚無の壁」中でボスが静止すべき場合も、通常の攻撃/ワープをブロック
    if (this.activeTrial && this.activeTrial.id === 11 && this.activeTrial.bossShouldBeStatic === true) {
        // console.log("[UpdateSpecificBossBehavior] Trial XI: Boss is static, no standard actions.");
        return; // 通常の攻撃/ワープ処理をスキップ
    }

    // 上記以外のガード条件でブロックされていれば、ここでリターン
    if (blockBossActions) {
        // (どのフラグでブロックされたかを知りたい場合は、個別のログをここに書く)
        // if (this.isCompletingTrial) console.log("[UpdateSpecificBossBehavior] Paused during trial completion sequence.");
        return;
    }


  
    // --- ▲ ガード処理 終了 ▲ ---


    // --- ▼ 時間経過によるワープ (現在はコメントアウト想定) ▼ ---
    /*
    if (time > this.lastWarpTime + (this.bossData.warpInterval || 7000)) {
        // if (!this.activeTrial?.bossShouldBeStatic) { // 試練XI中でなければ
             this.warpBoss();
        // }
    }
    */
    // --- ▲ 時間経過によるワープ 終了 ▲ ---


        // --- ▼ 攻撃処理 (試練II以降、最終決戦前、かつ試練XIのボス静止中でない場合) ▼ ---
    if (this.activeTrialIndex >= 1) { // 試練I「調和と破壊」選択後から
        const attackIntervalConfig = this.currentRoute === 'order' ?
            (this.bossData.attackIntervalOrder || {min:5000, max:7500}) :
            (this.bossData.attackIntervalChaos || {min:7500, max:11000});
        const interval = Phaser.Math.Between(attackIntervalConfig.min, attackIntervalConfig.max);

        if (time > this.lastAttackTime + interval) {
            if (Phaser.Math.Between(0, 1) === 0) {
                this.fireRadialAttack();
            } else {
                this.fireTargetedAttack();
            }
            this.lastAttackTime = time;
            // console.log(`[Attack] Attack executed. Next attack possible after ${interval}ms. Updated lastAttackTime: ${this.lastAttackTime.toFixed(0)}`);

            // 攻撃後に少し遅れてワープ (試練XI中でなければ)
            // (warpBossメソッドの冒頭で試練XIのワープ禁止ガードがあるので、ここでの個別チェックは必須ではない)
            this.time.delayedCall(this.bossData.warpDelayAfterAttack || 300, this.warpBoss, [], this);
        }
    }
    // --- ▲ 攻撃処理 終了 ▲ ---

    // (時間経過によるワープは現在コメントアウト中のはず)
}


// (オプション) 最終決戦用のボスAIメソッド
updateFinalBattleBossAI(time, delta) {

      if (this.isSpecialSequenceActive || this.isCompletingTrial || !this.playerControlEnabled || this.isGameOver || this.bossDefeated) {
        return;
    }
    // ここに「決着の刻」のルシファーの攻撃パターンやワープ（もし使うなら）を記述
    console.log("[FinalBattleAI] Updating final battle AI (placeholder)...");

     // --- 2. ワープ処理 (一定時間ごと) ---
    const warpInterval = this.bossData.finalBattleWarpInterval || 1000;
    if (time > this.lastFinalBattleWarpTime + warpInterval) {
        if (!this.isWarping) { // 現在ワープ中でなければ
            console.log("[FinalBattleAI] Triggering Warp.");
            this.warpBoss(); // 試練中と同じリッチなワープ
            this.lastFinalBattleWarpTime = time; // ワープ開始時間を記録 (warpBossの完了時でも良い)
        }
    }

    // --- 3. パラダイス・ロスト (一定時間ごと、かつ他の特別演出中でない場合) ---
      const paradiseLostInterval = this.bossData.finalBattleParadiseLostInterval || 15000;
    if (time > this.lastParadiseLostTime + paradiseLostInterval && !this.isWarping) { // isWarpingもチェック
        console.log("[FinalBattleAI] Triggering Paradise Lost.");
        this.executeParadiseLostSequence(); // これが isSpecialSequenceActive を true にする
        this.lastParadiseLostTime = time;
        return; // パラダイス・ロスト実行に入ったら、このフレームの他のAI処理はスキップ
    }

    // --- 4. 通常攻撃 (最終決戦バージョン) ---
    // (パラダイス・ロストのシーケンスが動いていない場合のみ攻撃)
    if (!this.isSpecialSequenceActive) {
        const attackIntervalFinal = Phaser.Math.Between(700, 1300); // 試練中よりかなり短い間隔
        if (time > this.lastAttackTime + attackIntervalFinal) {
            const attackType = Phaser.Math.Between(1, 3);
            if (attackType === 1) {
                this.fireRadialAttack({ count: this.bossData.radialAttackParamsOrder?.count || 7, speedMultiplier: this.bossData.radialAttackParamsOrder?.speedMultiplier || 2.0, angles: [/*より広範囲・多方向*/] });
            } else if (attackType === 2) {
                this.fireTargetedAttack({ speedMultiplier: this.bossData.targetedAttackParamsOrder?.speedMultiplier || 2.0 });
            } else {
              //  this.fireSpecialFinalAttack(); // 新しい最終決戦専用攻撃 (未実装ならコメントアウト)
            }
            this.lastAttackTime = time;
            // 攻撃後のワープは、時間経過ワープがあるのでここでは必須ではないかも。入れるなら確率で。
            // if (Phaser.Math.Between(0, 2) === 0) { // 33%の確率で攻撃後ワープ
            //     this.time.delayedCall(this.bossData.warpDelayAfterAttack || 200, this.warpBoss, [], this);
            // }
        }
    }
}


fireSpecialFinalAttack() { /* TODO: 最終決戦専用の派手な攻撃 */ console.log("[FinalBattleAttack] Firing SPECIAL FINAL ATTACK!"); }

   // CommonBossSceneのhitBossをオーバーライド (試練中のワープと、決着の刻の通常のヒット処理)
// Boss4Scene.js
hitBoss(boss, ball) {
    if (!boss || !ball || !ball.body || !boss.active || this.isCompletingTrial) { // ★isCompletingTrial を追加★
        if(this.isCompletingTrial) console.log("[HitBoss] Ignoring hit, trial completion in progress.");
        return;
    }
       // ★★★ ボールごとのヒットクールダウンを導入 ★★★
    const now = this.time.now;
    const lastHitTime = ball.getData('lastHitBossTime') || 0;
    const hitCooldown = 200; // 0.2秒間は同じボールからの連続ヒットを無視 (調整可能)

    if (now - lastHitTime < hitCooldown) {
        // console.log(`[Boss4 hitBoss] Ball ${ball.name} hit boss too soon. Ignoring.`);
        // クールダウン中は反射だけさせるか、何もしないか
        // ここでは、反射はさせるが試練カウントは進めない、としてみる
        if (!this.isFinalBattleActive) { // 試練中のみこの簡易反射
            const escapeAngleRad = Phaser.Math.Angle.Between(boss.x, boss.y, ball.x, ball.y);
            // targetSpeedの計算は省略 (前のクールダウン外の処理と同じものを想定)
            const tempTargetSpeed = (NORMAL_BALL_SPEED || 380) * (ball.getData('isFast') ? (BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA] || 1) : (ball.getData('isSlow') ? (BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA] || 1) : 1)) * (this.isTrialShatoraActive ? (this.currentTrialBallSpeedMultiplier || 1) : 1);
            this.physics.velocityFromAngle(Phaser.Math.RadToDeg(escapeAngleRad), tempTargetSpeed, ball.body.velocity);
        } else {
            super.hitBoss(boss, ball); // 最終決戦なら通常のヒット
        }
        return;
    }
    ball.setData('lastHitBossTime', now); // ヒット時刻を記録
    // ★★★------------------------------------★★★
      let trialJustCompleted = false;
    console.log(`[Boss4 hitBoss Start] Initial trialJustCompleted: ${trialJustCompleted}, ActiveTrialID: ${this.activeTrial?.id}`);

    if (this.isFinalBattleActive) {
        console.log("[Boss4 hitBoss - FinalBattle] Standard boss hit.");
        super.hitBoss(boss, ball);
        return;
    }
if (ball.getData('isIndaraActive')) {
    console.log("[Boss4 hitBoss - TrialPhase] Indara ball hit, temporarily disabling homing.");
    // this.deactivateIndara(ball); // CommonBossSceneのインダラ解除メソッドを呼ぶか、
    ball.setData('isIndaraActive', false); // ボール側のフラグを直接操作
    // (効果時間タイマーも止める必要があるかもしれない)
    this.time.delayedCall(2000, () => { // 2秒後にホーミング再開 (例)
        if (ball.active && !ball.getData('isIndaraActive') /* 他の条件も */) {
            // ball.setData('isIndaraActive', true);
            // もしactivateIndaraがシーンのプロパティに影響を与えるなら、それを呼ぶ
        }
    }, [], this);
}
    // --- 試練中の処理 ---
    console.log("[Boss4 hitBoss - TrialPhase] Ball hit, reflecting.");

    

  // hitBoss 内の試練中の反射ロジック (修正案B)
    let speedMultiplier = 1.0;
    // ... (speedMultiplier の計算) ...
    let baseSpeedForReflection = NORMAL_BALL_SPEED || 380;
    if (this.isTrialShatoraActive && typeof this.currentTrialBallSpeedMultiplier === 'number') {
        baseSpeedForReflection *= this.currentTrialBallSpeedMultiplier;
    }
    const targetSpeed = baseSpeedForReflection * speedMultiplier;

    // ボールからボスへの角度を計算 (これが押し出す方向の基準になる)
    const angleFromBallToBossRad = Phaser.Math.Angle.BetweenPoints(ball, boss);
    // その反対方向（ボスからボールを離す方向）へ速度を設定
    const escapeAngleDeg = Phaser.Math.RadToDeg(angleFromBallToBossRad) + 180; // 180度反対

    // ★位置補正は一旦削除または非常に慎重に★
    // const correctionDistance = 1;
    // ball.x += Math.cos(Phaser.Math.DegToRad(escapeAngleDeg)) * correctionDistance;
    // ball.y += Math.sin(Phaser.Math.DegToRad(escapeAngleDeg)) * correctionDistance;

    try {
        this.physics.velocityFromAngle(escapeAngleDeg, targetSpeed, ball.body.velocity);
        console.log(`[Boss4 hitBoss - TrialPhase] Ball reflected (Center Eject). Angle: ${escapeAngleDeg.toFixed(1)}, Speed: ${targetSpeed.toFixed(1)}`);
    } catch (e) {
        console.error("[Boss4 hitBoss - TrialPhase] Error setting ball velocity for reflection:", e);
    }


    // --- ▼ 試練達成判定 (ボールがボスに当たることが条件の試練) ▼ ---
    if (this.activeTrial && !this.activeTrial.completed) {
        console.log(`[Boss4 hitBoss - TrialCheck] Active Trial ID: ${this.activeTrial.id}`);

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
                if (boss === this.boss && this.isPlayerKubiraActive()) { // isPlayerKubiraActive は CommonBossScene にある想定
                    this.activeTrial.hitCountKubira = (this.activeTrial.hitCountKubira || 0) + 1;
                    if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial);
                    if (this.activeTrial.hitCountKubira >= this.activeTrial.requiredHitsKubira) {
                        trialJustCompleted = true;
                    }
                }
                break;
            // ★★★ 試練IX「時の超越、加速する運命」の判定 ★★★
            case 9:
                if (boss === this.boss) { // ボス本体へのヒットか確認
                    // isTrialShatoraActive フラグは試練IX中はずっとtrueのはずなので、
                    // 特別な条件は不要で、単純にヒットカウントを増やす。
                    this.activeTrial.hitCountTimeField = (this.activeTrial.hitCountTimeField || 0) + 1;console.log(`[Trial IX Hit] Hit count: ${this.activeTrial.hitCountTimeField} / ${this.activeTrial.requiredHitsTimeField}`); // ★ログ追加★
                    if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial);
                    if (this.activeTrial.hitCountTimeField >= this.activeTrial.requiredHitsTimeField) {
                        trialJustCompleted = true;
                    }
                }
                break;
            // ★★★------------------------------------------★★★
            case 10: // 連鎖する星々の輝き
                if (boss === this.boss) {
                    this.activeTrial.consecutiveHits = (this.activeTrial.consecutiveHits || 0) + 1;
                    // ボールロストで this.activeTrial.consecutiveHits = 0; にする処理が別途必要
                    if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial);
                    if (this.activeTrial.consecutiveHits >= this.activeTrial.requiredConsecutiveHits) {
                        trialJustCompleted = true;
                    }
                }
                break;
            // --- 他の「ボスにヒット」が条件の試練の case をここに追加 ---
            // 例: 試練XI「虚無の壁を打ち破れ」も、最終的にボスに当てる必要があるのでここで判定
             case 11: // 虚無の壁を打ち破れ
                if (boss === this.boss && this.activeTrial.id === 11) { // この試練がアクティブか再確認
                    // 壁召喚後に初めてボスにヒットしたか
                    // (spawnVoidWallでボスが最上部に移動するので、その後にヒットしたと見なせる)
                    this.activeTrial.bossHitInThisTrial = true;
                    if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial); // UI更新 (例: "本体にヒット！")
                    trialJustCompleted = true;
                }
                break;
        }
        console.log(`[Boss4 hitBoss - TrialCheck After Switch] trialJustCompleted: ${trialJustCompleted}`);
    }
    // --- ▲ 試練達成判定 終了 ▲ ---

    if (trialJustCompleted) {
        console.log("[Boss4 hitBoss] trialJustCompleted is true, calling completeCurrentTrial.");
        this.completeCurrentTrial();
    }

     // ボスをワープさせる (試練中のみ、かつボス本体へのヒット時、かつ試練XI中でなければ)
    if (!this.isFinalBattleActive && boss === this.boss) {
        if (!(this.activeTrial && this.activeTrial.id === 11 && this.activeTrial.bossShouldBeStatic === true)) { // ★試練XIのワープ禁止★
            this.time.delayedCall(this.bossData.warpDelayAfterHit || 100, this.warpBoss, [], this);
        } else {
            console.log("[HitBoss] Ball hit boss, but warp skipped due to Trial XI static boss.");
        }
        super.hitBoss(boss, ball); // 親クラスのヒット処理 (ここでもインダラ解除が行われるはず)
    }
}

// Boss4Scene.js
startFinalBattle() {
    console.log("[FinalBattle] All trials cleared! Starting FINAL BATTLE with Lucilius Zero!");
    this.isFinalBattleActive = true; // 最終決戦フラグON
    this.playerControlEnabled = true; // プレイヤー操作は既に有効のはずだが念のため
    this.isBallLaunched = false;    // ボールは再発射状態から
    this.prepareBallForTrial();     // ボールを準備

    // ボスにHPを設定し、無敵を解除
    if (this.boss && this.boss.active) {
        this.boss.setData('health', this.bossData.finalBattleHp || 5);
        this.boss.setData('maxHealth', this.bossData.finalBattleHp || 5);
        this.boss.setData('isInvulnerable', false);
        console.log(`[FinalBattle] Boss HP set to: ${this.boss.getData('health')}/${this.boss.getData('maxHealth')}. Invulnerable: false.`);
        // UIにHPを表示
        this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth'));
        this.boss.clearTint(); // 以前のTintが残っていればクリア
        this.boss.setAngle(0);   // 角度もリセット
    } else {
        console.error("[FinalBattle] Boss not available to start final battle!");
        this.triggerJiEndGameOver(); // ボスがいないならエラーとしてゲームオーバー
        return;
    }

    // ボスを動けるようにする (startSpecificBossMovementで実際の動きを開始)
    if (this.boss.body) this.boss.body.moves = true;
    this.startSpecificBossMovement(); // これが最終決戦用の移動パターンを開始する

    // アイテムドロップは「全種100%」になる (getOverrideDropItemでisFinalBattleActiveを見る)
    console.log("[FinalBattle] Item drops will now be all types at 100%.");

    

    // (オプション) 最終決戦開始の画面演出（画面フラッシュ、専用SEなど）
    this.cameras.main.flash(500, 200, 200, 255, true); // 赤みがかった強いフラッシュ
   this.sound.play(AUDIO_KEYS.SE_FINAL_BATTLE_START); // 仮のSEキー

    // 攻撃/ワープタイマーをリセットして、最終決戦用のAIがすぐに動き出せるようにする
    this.lastAttackTime = this.time.now;
    this.lastWarpTime = this.time.now; // もしワープを使うなら
    console.log("[FinalBattle] Attack/Warp timers reset for final phase.");
      // ★★★ ここで最終決戦開始直後のフラグ状態を確認 ★★★
    console.log("--- Flags at start of Final Battle AI activation ---");
    console.log("isSpecialSequenceActive:", this.isSpecialSequenceActive);
    console.log("isCompletingTrial:", this.isCompletingTrial);
    console.log("playerControlEnabled:", this.playerControlEnabled);
    console.log("isGameOver:", this.isGameOver);
    console.log("bossDefeated:", this.bossDefeated);
    console.log("----------------------------------------------------");
}

// Boss4Scene.js クラス内に、他のメソッドと同列に追加してください

/**
 * 現在アクティブな試練を完了としてマークし、報酬処理と次の試練への移行を行う。
 * このメソッドは、各試練の達成条件が満たされたと判断された箇所から呼び出される。
 */
/// Boss4Scene.js

// (constructor, init, initializeBossData, defineTrials, createSpecificBoss, applyBossDamage,
//  startIntroCutscene, startGameplay, setupJiEndTimer, setupTrialUI,
//  startHarmonyAndDestructionChoice, selectRoute, shatterCrystal,
//  startFinalBattle, hitBoss, isPlayerKubiraActive, isTimeFieldActive,
//  spawnChaosFragments, hitChaosFragment, warpBoss, fireRadialAttack, fireTargetedAttack,
//  spawnVoidWall, checkTrialCompletion (仮), updateTrialProgressUI (仮),
//  formatTime, playBellSound, triggerJiEndGameOver, stopAllBossTimers, getOverrideDropItem,
//  update, shutdownScene, prepareBallForTrial, playSpecificBgm などは前回までのものをベースに)

// 新しいヘルパーメソッド：ボスを指定座標へTween移動させる
warpBossToPosition(targetX, targetY, duration = 500, onCompleteCallback = null) {
    if (this.boss && this.boss.active) {
        console.log(`[WarpToPosition] Moving boss to X:${targetX.toFixed(0)}, Y:${targetY.toFixed(0)} over ${duration}ms`);
        this.tweens.killTweensOf(this.boss); // 既存のボスに対する移動・アルファ・スケールTweenを止める (角度は止めない)

        this.boss.setAlpha(1); // 移動開始時は見えるように
        this.tweens.add({
            targets: this.boss,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Sine.easeInOut',
            onStart: () => {
                // (もし専用の短い移動開始SEがあれば)
                // console.log("[WarpToPosition] Tween started.");
            },
            onComplete: () => {
                console.log("[WarpToPosition] Boss reached target position.");
                if (this.boss && this.boss.active) {
                    this.boss.setAngle(0); // 移動完了時に角度を0にリセット
                    this.boss.setVelocity(0,0); // 移動完了時に速度も0に
                }
                if (onCompleteCallback && typeof onCompleteCallback === 'function') {
                    onCompleteCallback();
                }
            }
        });
    } else {
        console.warn("[WarpToPosition] Boss not active or does not exist. Skipping move.");
        if (onCompleteCallback && typeof onCompleteCallback === 'function') {
            onCompleteCallback(); // ボスがいなくてもコールバックは呼ぶ（処理を進めるため）
        }
    }
}

// Boss4Scene.js
completeCurrentTrial() {
    // --- ▼ ガード処理: アクティブな試練があり、未完了、かつ現在完了処理中でない場合のみ実行 ▼ ---
    if (!this.activeTrial || this.activeTrial.completed || this.isCompletingTrial) {
        if (this.isCompletingTrial) {
            console.warn(`[CompleteTrial] Called while already completing trial ${this.activeTrial?.id}. Ignoring.`);
        } else if (this.activeTrial?.completed) {
            console.warn(`[CompleteTrial] Trial ${this.activeTrial.id}「${this.activeTrial.name}」 is already marked as completed. Ignoring.`);
        } else {
            console.warn("[CompleteTrial] No active trial to complete or called unexpectedly.");
        }
        return;
    }
    // --- ▲ ガード処理 終了 ▲ ---

    this.isCompletingTrial = true; // ★試練完了処理を開始
    this.activeTrial.completed = true;
   // this.playerControlEnabled = false; // 演出中はプレイヤー操作を一時的に制限
// ★★★ ボスを即座に無敵にする ★★★
    if (this.boss && this.boss.active) {
        this.boss.setData('isInvulnerable', true);
        console.log("[CompleteTrial] Boss set to INVULNERABLE at start of completion sequence.");
    }
    // ★★★--------------------------★★★
    console.log(`[TrialLogic] Trial ${this.activeTrial.id}「${this.activeTrial.name}」 MARKED COMPLETED! Initiating post-trial sequence.`);

    // ボスの現在の攻撃/ワープタイマーを実質的に停止させる (次の行動を遅らせる)
    this.lastAttackTime = this.time.now + 100000; // 非常に大きな値を設定して一時停止
    this.lastWarpTime = this.time.now + 100000;   // 同上
    console.log("[CompleteTrial] Boss action timers temporarily paused.");
if (this.activeTrial && this.activeTrial.id === 9) { // 試練IXが完了した場合
        this.deactivateTrialShatora();
        // ジエンドタイマー速度も元に戻る (次のフレームのupdateで this.activeTrial.id が9でなくなるため)
    }

    if (this.activeTrial && this.activeTrial.id === 11) { // 試練XIが完了した場合
        console.log("[Trial XI Complete] Clearing void wall blocks.");
        this.voidWallBlocksGroup?.clear(true, true); // ?.で安全に
        if (this.ballVoidWallCollider) this.ballVoidWallCollider.destroy();
        this.ballVoidWallCollider = null;
        if (this.boss && this.activeTrial.bossShouldBeStatic) { // もし固定していたなら解除
            this.activeTrial.bossShouldBeStatic = false;
            // ボスを元のY座標に戻すか、次の試練で再配置されるのを待つ
            // this.boss.setY(this.gameHeight * 0.2);
        }
    }
    
    if (this.activeTrial && this.activeTrial.id === 11) {
        console.log("[Trial XI Complete] Resetting bossShouldBeStatic flag and clearing void wall.");
        if (this.activeTrial.bossShouldBeStatic) {
            this.activeTrial.bossShouldBeStatic = false; // ★ボス静止フラグOFF★
        }
        this.voidWallBlocksGroup?.clear(true, true);
        if (this.ballVoidWallCollider) this.ballVoidWallCollider.destroy();
        this.ballVoidWallCollider = null;
        // ボスを元のY座標に戻す (次の試練で再配置されるが、念のため)
        if (this.boss && this.boss.active) {
            // this.boss.setY(this.gameHeight * 0.2); // 元の基本Y座標
            // あるいは、warpBossToPosition でスムーズに戻しても良い
            this.warpBossToPosition(this.gameWidth / 2, this.gameHeight * 0.2, 300);
        }
    }
    // --- ▼ 試練クリア演出シーケンス (delayedCallで順番に実行) ▼ ---

     // ステップ1: ルシファーのダメージモーションとSE
    if (this.boss && this.boss.active) {
        console.log("[Trial Complete GFX] Boss damage reaction start.");
        const damageReactionColor = 0xffaa00; // オレンジっぽい色

        // ★★★ damageReactionDuration をここで宣言・初期化 ★★★
        const damageReactionDuration = 2500;   // 点滅を含めた合計時間 (ms) - 調整可能
        // ★★★-------------------------------------------------★★★

        const flashInterval = 150;            // 1回の点滅の間隔 (ms)
        // numberOfFlashes の計算は、点滅の「山」の回数とするなら (明暗で1セットの半分)
        // あるいは、明暗の「セット」の回数とするか。
        // ここでは、damageReactionDuration の間に flashInterval ごとに処理を行う回数として考える。
        let flashLoops = Math.max(1, Math.floor(damageReactionDuration / flashInterval)); // 最低1回は実行

        this.boss.setTintFill(damageReactionColor);
        let isTintedForReaction = true; // 現在Tintされているかどうかのフラグ

        const reactionTimer = this.time.addEvent({
            delay: flashInterval,
            callback: () => {
                if (!this.boss || !this.boss.active || !this.isCompletingTrial || flashLoops <= 0) {
                    if (this.boss?.active) {
                        this.boss.clearTint();
                        this.boss.setAlpha(1);
                    }
                    console.log("[Trial Complete GFX] Boss damage reaction ended or aborted. Tint cleared.");
                    reactionTimer.remove(); // タイマー自身を停止
                    return;
                }

                flashLoops--;
                if (isTintedForReaction) {
                    this.boss.clearTint();
                    this.boss.setAlpha(0.7);
                } else {
                    this.boss.setTintFill(damageReactionColor);
                    this.boss.setAlpha(1);
                }
                isTintedForReaction = !isTintedForReaction; // フラグ反転

                if (flashLoops === 0) { // 最後のループなら確実にクリア
                    this.boss.clearTint();
                    this.boss.setAlpha(1);
                    console.log("[Trial Complete GFX] Boss damage reaction final clear. Tint cleared.");
                    reactionTimer.remove();
                }
            },
            callbackScope: this,
            loop: true // flashInterval ごとに繰り返す (ただし、flashLoopsで回数を制御)
        });
        // 試練達成SE
        if (AUDIO_KEYS.SE_TRIAL_SUCCESS) try { this.sound.play(AUDIO_KEYS.SE_TRIAL_SUCCESS); } catch(e){}
    }
    const step1Duration = (this.bossData.damageReactionOverallDuration || 600); // ★bossDataから取得するか固定値★

    // ステップ2: 画面内の敵弾消去 (ダメージリアクションとほぼ同時か、少し後)
    this.time.delayedCall(step1Duration - 400 > 0 ? step1Duration - 400 : 50, () => { // リアクションの途中から
        if (!this.isCompletingTrial || this.isGameOver || this.bossDefeated) { this.isCompletingTrial = false; return; }
        if (this.attackBricks) {
            console.log("[Trial Complete GFX] Clearing all active enemy projectiles.");
            const projectilesToClear = this.attackBricks.getChildren().filter(
                brick => brick.active && brick.getData('blockType') === 'projectile'
            );
            projectilesToClear.forEach(projectile => projectile.destroy());
            console.log(`[Trial Complete GFX] Cleared ${projectilesToClear.length} projectiles.`);
        }
    }, [], this);

    // ステップ3: ルシファーが画面中央へワープ (ステップ1完了後)
    this.time.delayedCall(step1Duration + 100, () => { // ダメージリアクションが終わってから少し
        if (!this.isCompletingTrial || this.isGameOver || this.bossDefeated) { this.isCompletingTrial = false; return; }

        const centralX = this.gameWidth / 2;
        const centralY = this.gameHeight * 0.2;
        const moveToCenterDuration = 700;

        this.warpBossToPosition(centralX, centralY, moveToCenterDuration, () => {
            // --- ▼ 中央ワープ完了後の処理 ▼ ---
            if (!this.isCompletingTrial || this.isGameOver || this.bossDefeated) { this.isCompletingTrial = false; return; }

            // ステップ4: 報酬ドロップ（ビカラ陽）
            if (this.bossData.trialRewardItem && this.boss && this.boss.active) {
                console.log(`[Trial Reward] Dropping ${this.bossData.trialRewardItem}.`);
                this.dropSpecificPowerUp(this.boss.x, this.boss.y + this.boss.displayHeight / 2 + 30, this.bossData.trialRewardItem);
            }

            // ステップ5: ジエンドタイマー30秒加算
            if (this.isJiEndTimerRunning) {
                const timeToAdd = 30 * 1000;
                this.jiEndTimeRemaining += timeToAdd;
              //  console.log(`[Trial Complete] JiEndTimer +${timeToAdd/1000}s.`);
                if (this.jiEndTimerText?.active) this.jiEndTimerText.setText(this.formatTime(this.jiEndTimeRemaining)); // UI即時更新
                // (タイマー加算SE)
            }

            // ステップ6: 次の試練へ (報酬ドロップやタイマー加算を見せるための遅延)
            const nextTrialStartDelay = 2500;
            console.log(`[Trial Complete] Post-trial actions finished. Scheduling next trial in ${nextTrialStartDelay}ms.`);
            this.time.delayedCall(nextTrialStartDelay, () => {
                this.isCompletingTrial = false; // ★★★ 全ての演出が終わり、次の試練へ進む直前にフラグを下ろす ★★★
                if (this.isGameOver || this.bossDefeated) return; // 再度チェック
                this.startNextTrial();
            }, [], this);
            // --- ▲ 中央ワープ完了後の処理 終了 ▲ ---
        });
    }, [], this);
    // --- ▲ 試練クリア演出シーケンス 終了 ▲ ---
}

spawnChaosFragments(count) {
     this.chaosFragmentsGroup = this.physics.add.group(); // 専用グループ
     for (let i = 0; i < count; i++) {
        const fragment = this.chaosFragmentsGroup.create(x, y, 'chaos_fragment');
        fragment.setData('isChaosFragment', true);
    }
    // ボールと欠片のコライダー設定
     this.physics.add.collider(this.balls, this.chaosFragmentsGroup, this.hitChaosFragment, null, this);
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



/// Boss4Scene.js

// (constructor や init で this.isWarping = false; を設定)

/**
 * ボスをリッチな演出でランダムな新しい位置にワープさせる。
 * ワープ中は isWarping フラグを true にする。
 */
warpBoss() {
    // --- ▼ ガード処理: ボスが存在しない、非アクティブ、または既にワープ中の場合は実行しない ▼ ---
    if (!this.boss || !this.boss.active || this.isWarping) {
        // ...
        console.warn("[WarpBoss] Boss is not active or does not exist. Skipping warp.");
        return;
    }
    if (this.isWarping) {
        console.log("[WarpBoss] Already warping. Skipping new warp request to prevent overlap.");
        return;
    }
    // --- ▲ ガード処理 終了 ▲ ---

 // ★★★ 試練XI中はワープしない ★★★
    if (this.activeTrial && this.activeTrial.id === 11 && this.activeTrial.bossShouldBeStatic === true) {
        console.log("[WarpBoss] Skipping warp: Trial XI active and bossShouldBeStatic is true.");
        this.isWarping = false; // 念のためフラグを戻す (呼ばれないはずだが)
        return;
    }
    // ★★★-----------------------★★★
    this.isWarping = true; // ★ワープ処理開始フラグを立てる
  //  console.log("[BossAction] Initiating Rich Warp Sequence (Guarded & Sequential Tweens)...");

    // ワープ開始SE (キーが存在すれば再生)
    if (AUDIO_KEYS.SE_LUCILIUS_WARP_EFFECT_START && this.sound.get(AUDIO_KEYS.SE_LUCILIUS_WARP_EFFECT_START)) {
        try { this.sound.play(AUDIO_KEYS.SE_LUCILIUS_WARP_EFFECT_START); } catch(e) { console.error("Error playing warp start SE:", e); }
    }

    // 既存のボスに対する移動・見た目関連のTweenを停止 (新しいワープ演出との競合を防ぐ)
    this.tweens.killTweensOf(this.boss, ['x', 'y', 'angle', 'scaleX', 'scaleY', 'alpha']);
    this.boss.setAngle(0); // ★ワープ開始前に角度を0にリセット

    // --- 1. 現在地で収束・消滅エフェクト ---
    const fadeOutDuration = this.bossData.warpDurationFadeOut || 250; // bossDataから取得、なければデフォルト
    this.tweens.add({
        targets: this.boss,
        scaleX: (this.boss.getData('targetScaleX') || this.boss.scaleX) * 0.05, // 元のスケールの5%に
        scaleY: (this.boss.getData('targetScaleY') || this.boss.scaleY) * 0.05,
        alpha: 0,
        angle: Phaser.Math.RND.pick([-45, 45, -90, 90]), // 消える際に少し回転
        duration: fadeOutDuration,
        ease: 'Cubic.easeIn', // 徐々に加速して消える感じ
        onComplete: () => {
            // ワープ処理が途中でキャンセルされたか（ボスが非アクティブになったなど）確認
            if (!this.boss || !this.boss.active || !this.isWarping) {
                this.isWarping = false; // フラグを戻す
                console.warn("[WarpBoss] FadeOut onComplete: Boss became inactive or warp cancelled. Aborting.");
                return;
            }

            // --- 2. 短い消滅維持時間 ---
            const holdDuration = this.bossData.warpDurationHold || 100;
            this.time.delayedCall(holdDuration, () => {
                if (!this.boss || !this.boss.active || !this.isWarping) {
                    this.isWarping = false;
                    console.warn("[WarpBoss] Hold Delay: Boss became inactive or warp cancelled. Aborting.");
                    return;
                }

                // --- 3. 新しい位置を決定 & 設定 ---
                // ボス自身の表示スケールを考慮してX座標のマージンを計算
                const currentBossDisplayWidth = this.boss.displayWidth * ( (this.boss.getData('targetScaleX') || this.boss.scaleX) * 0.05 ); // 消滅時のスケールでの幅
                const xMargin = currentBossDisplayWidth / 2 + 60; // マージンを少し広めにとる
                const targetX = Phaser.Math.Between(
                    xMargin,
                    this.gameWidth - xMargin
                );

                // Y座標の範囲 (ボス自身の表示高さを考慮)
                const minYRatio = this.bossData.warpYRange?.minRatio || 0.15; // ?.で安全にアクセス
                const maxYRatio = this.bossData.warpYRange?.maxRatio || 0.25;
                const bossHeightForCalc = this.boss.height * (this.boss.getData('targetScaleY') || this.boss.scaleY); // 元のスケールでの高さ
                const targetY = Phaser.Math.Clamp(
                    Phaser.Math.Between(this.gameHeight * minYRatio + bossHeightForCalc / 2, this.gameHeight * maxYRatio - bossHeightForCalc / 2),
                    bossHeightForCalc / 2, // 画面上端にはみ出ない最小Y
                    this.gameHeight - bossHeightForCalc / 2 // 画面下端にはみ出ない最大Y (通常はここまで下がらない)
                );

                this.boss.setPosition(targetX, targetY);
                // 消滅時と同じ小さいスケール、角度0、アルファ0で出現準備
                this.boss.setScale((this.boss.getData('targetScaleX') || this.boss.scaleX) * 0.05);
                this.boss.setAngle(0);
                this.boss.setAlpha(0); // alphaは次のTweenで1に戻すので、ここで0にしておく

                console.log(`[BossAction] Boss logically warped to new position: X:${this.boss.x.toFixed(0)}, Y:${this.boss.y.toFixed(0)}`);

                // ワープSE（出現音）
                if (AUDIO_KEYS.SE_LUCILIUS_WARP_EFFECT_END && this.sound.get(AUDIO_KEYS.SE_LUCILIUS_WARP_EFFECT_END)) {
                    try { this.sound.play(AUDIO_KEYS.SE_LUCILIUS_WARP_EFFECT_END); } catch(e) {}
                }

                // --- 4. 新しい位置で拡散・出現エフェクト ---
                const fadeInDuration = this.bossData.warpDurationFadeIn || 250;
                const finalScaleX = this.boss.getData('targetScaleX') || (this.bossData.widthRatio / (this.boss.texture.source[0].width / this.gameWidth)); // 元のXスケール
                const finalScaleY = this.boss.getData('targetScaleY') || finalScaleX; // Yスケールもアスペクト比維持か、個別に設定

                this.tweens.add({
                    targets: this.boss,
                    scaleX: finalScaleX,
                    scaleY: finalScaleY,
                    alpha: 1,
                    angle: Phaser.Math.RND.pick([-20, 0, 20]), // 出現時に少しだけ揺れる感じ（任意）
                    duration: fadeInDuration,
                    ease: 'Cubic.easeOut', // 徐々に減速して現れる感じ
                    onComplete: () => {
                        console.log("[BossAction] Rich Warp Sequence (Sequential Tweens) Complete.");
                        if (this.boss && this.boss.active) {
                            this.boss.setAngle(0); // ★最終的に角度を確実に0にリセット★
                        }
                        this.isWarping = false; // ★ワープ処理終了フラグを下ろす★
                        this.lastWarpTime = this.time.now; // ★時間経過ワープ用のタイマーをリセット (もし使うなら)

                        // ワープ後の行動停止時間を考慮して次の攻撃タイミングを調整
                        const avgAttackInterval = this.currentRoute === 'order' ?
                            ((this.bossData.attackIntervalOrder?.min || 1800) + (this.bossData.attackIntervalOrder?.max || 2800)) / 2 :
                            ((this.bossData.attackIntervalChaos?.min || 3500) + (this.bossData.attackIntervalChaos?.max || 5500)) / 2;
                        const pauseAfter = this.bossData.pauseAfterWarp || 800;
                        this.lastAttackTime = this.time.now + pauseAfter - avgAttackInterval; // 次の攻撃がpauseAfter後に来るように調整
                        console.log(`[WarpBoss] Next attack possible around ${pauseAfter}ms. lastAttackTime adjusted.`);
                    }
                });
            }, [], this); // delayedCall for hold
        }
    }); // First tween (fade out)
}


    // 放射攻撃 (仮実装)
    // Boss4Scene.js
fireRadialAttack() {
    if (!this.attackBricks || !this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) {
        return;
    }
    console.log(`[BossAttack] Firing Radial Attack (Route: ${this.currentRoute})`);
    // if (AUDIO_KEYS.SE_LUCILIUS_ATTACK_RADIAL) this.sound.play(AUDIO_KEYS.SE_LUCILIUS_ATTACK_RADIAL);

    const baseParams = this.bossData.radialAttackParamsBase || {};
    const routeParams = this.currentRoute === 'order' ?
        (this.bossData.radialAttackParamsOrder || {}) :
        (this.bossData.radialAttackParamsChaos || {});

    const count = routeParams.count !== undefined ? routeParams.count : (baseParams.count || 5);
    const speed = (baseParams.projectileSpeed || (DEFAULT_ATTACK_BRICK_VELOCITY_Y + 20)) * (routeParams.speedMultiplier !== undefined ? routeParams.speedMultiplier : 1.0);
    const angles = baseParams.angles || [75, 90, 105];
    const texture = baseParams.projectileTexture || 'attack_brick_lucilius';
    const scale = baseParams.projectileScale || 0.15;
    // ★★★ bossData から回転速度を取得 ★★★
    const spinRateForThisAttack = baseParams.projectileSpinRate || this.bossData.radialAttackProjectileSpinRate || 0; // ルート別も考慮するなら routeParamsからも
    // ★★★-------------------------★★★
    const spawnX = this.boss.x;
    const spawnY = this.boss.y + (this.boss.displayHeight / 2) * 0.7;

  //  console.log(`[Radial Attack] Final Params - Count:${count}, Speed:${speed.toFixed(0)}, Angles:${angles.slice(0,count).join(',')}, SpinRate:${spinRate}`);

     angles.slice(0, count).forEach(angleDeg => {
        const projectile = this.spawnLuciliusProjectile(spawnX, spawnY, texture, {
            scale: scale,
            speed: speed,
            angleDeg: angleDeg,
            spinRate: spinRateForThisAttack // ★★★ spinRate を config オブジェクトに含めて渡す ★★★
        });
    });
}
    // Boss4Scene.js
fireTargetedAttack() {
    if (!this.attackBricks || !this.boss || !this.boss.active || !this.paddle?.active || this.isGameOver || this.bossDefeated) {
        return;
    }
    console.log(`[BossAttack] Firing Targeted Attack (Route: ${this.currentRoute}) - No Prediction Marker`);
    // if (AUDIO_KEYS.SE_LUCILIUS_ATTACK_TARGET) this.sound.play(AUDIO_KEYS.SE_LUCILIUS_ATTACK_TARGET);

    const baseParams = this.bossData.targetedAttackParamsBase || {};
    const routeParams = this.currentRoute === 'order' ?
        (this.bossData.targetedAttackParamsOrder || {}) :
        (this.bossData.targetedAttackParamsChaos || {});

    const speed = (baseParams.projectileSpeed || (DEFAULT_ATTACK_BRICK_VELOCITY_Y + 40)) * (routeParams.speedMultiplier !== undefined ? routeParams.speedMultiplier : 1.0);
    const texture = baseParams.projectileTexture || 'attack_brick_lucilius_target';
    const scale = baseParams.projectileScale || 0.15;
    // ★★★ bossData から回転速度を取得 ★★★
    const spinRateForThisAttack = baseParams.projectileSpinRate || this.bossData.targetedAttackProjectileSpinRate || 0;
    // ★★★-------------------------★★★

    // ... (targetX, spawnX, spawnY の計算は変更なし) ...
    const targetX = this.paddle.x;
    const spawnFromBossX = this.boss.x;
    const spawnFromBossY = this.boss.y + (this.boss.displayHeight / 2) * 0.7;

    const angleToTargetRad = Phaser.Math.Angle.Between(spawnFromBossX, spawnFromBossY, targetX, this.gameHeight - 30);
    const angleToTargetDeg = Phaser.Math.RadToDeg(angleToTargetRad);
const projectile = this.spawnLuciliusProjectile(spawnFromBossX, spawnFromBossY, texture, {
        scale: scale,
        speed: speed,
        angleDeg: angleToTargetDeg,
        spinRate: spinRateForThisAttack // ★★★ spinRate を config オブジェクトに含めて渡す ★★★
    });
 //   console.log(`[Targeted Attack] Final Params - Speed:${speed.toFixed(0)}, TargetX:${targetX.toFixed(0)}, Angle:${angleToTargetDeg.toFixed(1)}, SpinRate:${spinRate}`);

 
}
spawnChaosFragments(count) {
    if (this.chaosFragmentsGroup) this.chaosFragmentsGroup.clear(true, true); // 既存があればクリア
    else this.chaosFragmentsGroup = this.physics.add.group();

    console.log(`[Trial III] Spawning ${count} Chaos Fragments.`);
    this.activeTrial.destroyedCount = 0; // 破壊カウンターリセット

    for (let i = 0; i < count; i++) {
        // 画面内のランダムな位置、または特定パターンで配置
        const x = Phaser.Math.Between(this.gameWidth * 0.1, this.gameWidth * 0.9);
        const y = Phaser.Math.Between(this.gameHeight * 0.3, this.gameHeight * 0.6);
        const fragment = this.chaosFragmentsGroup.create(x, y, 'chaos_fragment'); // ★専用テクスチャキー
        if (fragment) {
            fragment.setScale(0.12); // 仮スケール
            fragment.setImmovable(true); // ボールが当たっても動かない
            // fragment.body.setAllowGravity(false); // Group作成時に設定も可
            // (もし欠片が少し動くなら setImmovable(false) にして setBounce など設定)
        }
    }
    // ボールと欠片の衝突設定
    if (this.ballChaosFragmentCollider) this.ballChaosFragmentCollider.destroy(); // 既存コライダー破棄
    this.ballChaosFragmentCollider = this.physics.add.collider(
        this.balls,
        this.chaosFragmentsGroup,
        this.hitChaosFragment, // 専用の衝突コールバック
        null,
        this
    );
    this.updateTrialProgressUI(this.activeTrial); // UI初期表示
}

// ボールが混沌の欠片に当たった時のコールバック
hitChaosFragment(ball, fragment) {
    if (!fragment.active || !this.activeTrial || this.activeTrial.id !== 3 || this.activeTrial.completed) {
        return; // 無効な衝突は無視
    }

    console.log("[Trial III] Ball hit Chaos Fragment.");
    // (破片破壊のSEやエフェクト)
    // this.createImpactParticles(fragment.x, fragment.y, ...);
     this.sound.play(AUDIO_KEYS.SE_DESTROY);
    fragment.destroy(); // 1ヒットで破壊

    this.activeTrial.destroyedCount++;
    this.updateTrialProgressUI(this.activeTrial);

    if (this.activeTrial.destroyedCount >= (this.activeTrial.objectsToDestroy || 5)) {
        console.log("[Trial III] All Chaos Fragments destroyed.");
        this.completeCurrentTrial(); // 試練達成
        if (this.ballChaosFragmentCollider) this.ballChaosFragmentCollider.destroy(); // コライダーも不要に
        this.ballChaosFragmentCollider = null;
    }
}

    // updateTrialProgressUI (試練の進捗UIを更新するメソッド)
updateTrialProgressUI(trial) {
    if (!this.trialUiText || !this.trialUiText.active || !trial) return;
    let progressText = "";
    switch (trial.id) {
        case 2: progressText = `(${trial.hitCount || 0}/${trial.requiredHits})`; break;
        case 3: progressText = `(破壊数: ${trial.destroyedCount || 0}/${trial.objectsToDestroy})`; break;
         case 5: // ★★★ 星光の追撃 ★★★
            progressText = ` (${trial.hitCountKubira || 0}/${trial.requiredHitsKubira || 3})`;
            console.log(`[UpdateTrialUI V] Progress: ${trial.hitCountKubira || 0}/${trial.requiredHitsKubira || 3}`);
            break;
              case 7: // 三宝の導き
            progressText = ` (${trial.collectedCountForTrial7 || 0}/${(trial.itemsToCollectForTrial7 || []).length})`;
            break;
             case 8: // 深淵より来る核を狙え
        progressText = ` (破壊コア: ${trial.hitCoreCount || 0}/${trial.coreCount || 3})`;
        break;
        case 10: // 連鎖する星々の輝き
        progressText = ` (連続: ${trial.consecutiveHits || 0}/${trial.requiredConsecutiveHits || 3})`;
        // ... 他の試練の進捗表示 ...
        default: break;
    }
    this.trialUiText.setText(`十二の試練：試練 ${trial.id}「${trial.name}」\n${trial.conditionText} ${progressText}`);
}


    // --- ジエンドタイマー関連メソッド (前回のものを流用) ---
    formatTime(milliseconds) { /* ... */ return `ジ・エンドまで… ${String(Math.floor(milliseconds/60000)).padStart(2,'0')}:${String(Math.floor((milliseconds%60000)/1000)).padStart(2,'0')}:${String(Math.floor((milliseconds%1000)/10)).padStart(2,'0')}`; }
    playBellSound() { /* ... */ try { if(AUDIO_KEYS.SE_JI_END_BELL) this.sound.play(AUDIO_KEYS.SE_JI_END_BELL); } catch(e){} }
    // Boss4Scene.js の triggerJiEndGameOver メソッド (再掲・確認)
/// Boss4Scene.js の triggerJiEndGameOver メソッド (修正案)
triggerJiEndGameOver() {
    if (this.isGameOver) return;
    console.log("[JiEndTimer] JI END! Triggering custom game over sequence.");
    this.isGameOver = true;
    this.playerControlEnabled = false;
    if (this.physics.world.running) this.physics.pause();
    this.stopAllBossTimers();
    this.sound.stopAll();
    if (this.currentBgm) this.currentBgm = null;

    this.uiScene?.scene.setVisible(false);
    if (this.jiEndTimerText) this.jiEndTimerText.setVisible(false);
    if (this.trialUiText) this.trialUiText.setVisible(false);

    // --- ▼ 世界終焉風演出 ▼ ---
    // 1. 画面暗転 (これはすぐ実行)
    const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0)
        .setOrigin(0,0).setDepth(9990);
    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 2000, ease: 'Linear' });

    // 2. ボスや背景の演出 (これもすぐ実行)
    if (this.boss) {
        this.tweens.add({ targets: this.boss, tint: 0xff0000, duration: 1000, ease: 'Linear' });
    }
    if (this.paddle) this.tweens.add({ targets: this.paddle, alpha: 0, duration: 500, delay: 1000 });
    this.balls?.getChildren().forEach(ball => {
        if(ball.active) this.tweens.add({ targets: ball, alpha: 0, scale: 0, duration: 500, delay: 1200 });
    });

    // 3. 「JI・END」テキスト表示 (少し遅れて)
    const jiEndTextDelay = 2500; // 暗転や他の演出がある程度進むのを待つ
    console.log(`[JiEndGameOver] Scheduling JI・END text display in ${jiEndTextDelay}ms.`);

    this.time.delayedCall(jiEndTextDelay, () => {
        if (this.scene.key !== 'Boss4Scene' || !this.scene.isActive()) { // シーンがまだアクティブか確認
            console.warn("[JiEndGameOver] Scene no longer active when trying to show JI・END text. Aborting further GFX.");
            // この時点で super.gameOver() を呼んでしまうか、何もしないか
            // super.gameOver(); // 強制的に終了させる場合
            return;
        }
        console.log("[JiEndGameOver] Displaying JI・END text now.");
        const endText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, "THE・END", {
            fontSize: `${this.gameWidth / 8}px`, fill: '#cc0000', fontFamily: 'serif', // 色を少し調整
            stroke: '#550000', strokeThickness: 10, align: 'center'
        }).setOrigin(0.5).setDepth(9999);

        // 4. JI・END 表示後、さらに遅れて通常のゲームオーバー処理へ
        const finalGameOverDelay = 3000; // JI・END テキストを3秒間表示
        console.log(`[JiEndGameOver] JI・END text displayed. Scheduling final game over in ${finalGameOverDelay}ms.`);

        this.time.delayedCall(finalGameOverDelay, () => {
            if (this.scene.key !== 'Boss4Scene' || !this.scene.isActive()) { // 再度シーンの状態確認
                console.warn("[JiEndGameOver] Scene no longer active when trying to call super.gameOver().");
                return;
            }
            console.log("[JiEndGameOver] Cleaning up JI・END GFX and calling super.gameOver().");
            if (endText && endText.scene) endText.destroy();
            if (overlay && overlay.scene) overlay.destroy(); // overlayもここで破棄
            
            // ★★★ super.gameOver() の呼び出し ★★★
            super.gameOver();
            console.log("[JiEndGameOver] super.gameOver() called.");
        }, [], this);
    }, [], this);
    // --- ▲ 世界終焉風演出 終了 ▲ ---
}
    stopAllBossTimers() { /* ... (このシーンのタイマーを全て止める) ... */
        this.radialAttackTimer?.remove(); this.targetedAttackTimer?.remove();
        // 他の試練用タイマーなども
    }
    // --- ジエンドタイマー関連メソッド終了 ---

    // CommonBossSceneのtriggerPowerUpEffectをオーバーライド
triggerPowerUpEffect(type, itemObject = null) {
    // ★試練VII「三宝の導き」の収集状況を更新★
    if (this.activeTrial && !this.activeTrial.completed && this.activeTrial.id === 7) {
        const trialData = this.activeTrial;
        const itemIndex = trialData.itemsToCollectForTrial7.indexOf(type);

        if (itemIndex !== -1 && !trialData.collectedFlagsForTrial7[itemIndex]) {
            // 目標アイテムであり、かつまだ収集していなければ
            trialData.collectedFlagsForTrial7[itemIndex] = true;
            trialData.collectedCountForTrial7 = (trialData.collectedCountForTrial7 || 0) + 1;
            console.log(`[Trial VII] Collected: ${type}. Total unique collected: ${trialData.collectedCountForTrial7}/${trialData.itemsToCollectForTrial7.length}`);
            if (this.trialUiText) this.updateTrialProgressUI(trialData); // UI更新

            if (trialData.collectedCountForTrial7 >= trialData.itemsToCollectForTrial7.length) {
                console.log("[Trial VII] All Sanpo items collected!");
                this.completeCurrentTrial(); // 試練達成
            }
        }
    }
    // ★★★------------------------------------★★★

    super.triggerPowerUpEffect(type, itemObject); // 親の通常のアイテム効果発動処理を呼ぶ
}



    // --- 「十二神将の導き」アイテムドロップ制御 (Commonからオーバーライド) ---
    getOverrideDropItem(brick) {
        if (!this.activeTrial || this.isFinalBattleActive || this.isChoiceEventActive || !brick.getData('blockType')) {
            // 「決着の刻」、選択中、または通常の攻撃ブロックでない場合は通常ドロップ
              if (this.isFinalBattleActive) { // ★最終決戦中は全アイテム100%ドロップ★
        return Phaser.Utils.Array.GetRandom(Object.values(POWERUP_TYPES));
    }
            return null;
        }

        // 試練III「混沌の残滓」: マキラかバイシュラヴァをランダム
        if (this.activeTrial.id === 3 && this.activeTrial.targetItemRandom) {
            return Phaser.Utils.Array.GetRandom(this.activeTrial.targetItemRandom);
        }
         // 試練VII「三宝の導き」: 指定3種からランダムドロップ
    if (this.activeTrial.id === 7 && this.activeTrial.dropCandidateSanpo && this.activeTrial.dropCandidateSanpo.length > 0) {
        return Phaser.Utils.Array.GetRandom(this.activeTrial.dropCandidateSanpo);
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

activateTrialShatora(multiplier) {
    console.log(`[Trial IX] Activating permanent Shatora effect. Multiplier: ${multiplier}`);
     this.isTrialShatoraActive = true;
    this.currentTrialBallSpeedMultiplier = multiplier;

    // ★★★ プレイヤー操作とボール発射状態を明確にする ★★★
    this.playerControlEnabled = true; // 試練中は操作可能
    this.isBallLaunched = false;    // 発射待ち状態にする
    // ★★★-----------------------------------------★★★

    // 既存のボール全ての速度を変更 & パドル上に戻す
    if (this.balls) {
        this.balls.getChildren().forEach(ball => {
            if (ball.active && ball.body) {
                // まずパドル上に戻して速度を0にする
                if (this.paddle?.active) {
                    ball.setVelocity(0,0).setPosition(this.paddle.x, this.paddle.y - (this.paddle.displayHeight / 2) - ball.displayHeight / 2);
                }
                // その後、試練IXの速度を適用するか、launchBallに任せるか。
                // launchBallで速度設定するので、ここではリセットだけでOK。
            }
        });
    }
    this.updateBallAndPaddleAppearance(); // 見た目更新 (シャトラアイコンなど)
    if (AUDIO_KEYS.SE_TIME_FIELD_ON) try { this.sound.play(AUDIO_KEYS.SE_TIME_FIELD_ON); } catch(e){}
    console.log("[Trial IX Effect] Permanent Shatora activated. Player can launch.");

    // --- ▼▼▼ 強制ランチが必要な場合 ▼▼▼ ---
    // もし試練IX開始と同時にボールを自動発射させたいなら、ここでlaunchBallを呼ぶ
     console.log("[Trial IX] Attempting forced launch at trial start.");
     this.launchBall();
    // --- ▲▲▲ ---
}

deactivateIndara(ball) {
    if (!ball?.active || !ball.getData('isIndaraActive')) return;
    console.log(`[DeactivateIndara] Deactivating Indara for ball: ${ball.name}`);
    this.setBallPowerUpState(POWERUP_TYPES.INDARA, false, ball); // ボールからインダラ状態を解除
    this.updateBallAppearance(ball); // ボールの見た目を元に戻す
    // (必要なら setColliders() を呼び出して、ボールと攻撃ブロックの衝突タイプを再設定)
    // ただし、毎ヒットでsetCollidersは重いので、setBallPowerUpStateで対応できるならそれがベスト
}

/**
 * ボールに特定のパワーアップ状態を設定/解除する (CommonBossSceneのメソッドをオーバーライド)。
 * 特にインダラ解除時にコライダーを再設定する。
 * @param {string} type パワーアップのタイプ (POWERUP_TYPES)
 * @param {boolean} isActive 有効にするか無効にするか
 * @param {Phaser.Physics.Arcade.Image} [specificBall=null] 対象のボール (nullなら全ボール)
 */
setBallPowerUpState(type, isActive, specificBall = null) {
    console.log(`[Boss4 SetBallPowerUp] Type: ${type}, IsActive: ${isActive}, Ball: ${specificBall ? specificBall.name : 'All'}`);

    // まず親クラスの基本的な状態設定処理を呼び出す
    // (activePowersの更新、ボールの見た目変更フラグ設定など)
    super.setBallPowerUpState(type, isActive, specificBall);

    // ★★★ インダラ効果が「解除」された場合の特別処理 ★★★
    if (type === POWERUP_TYPES.INDARA && !isActive) {
        console.log("[Boss4 SetBallPowerUp] Indara effect DEACTIVATED. Re-setting colliders.");
        // インダラが解除されたので、ボールと攻撃ブロックの衝突判定を
        // 「すり抜けない」通常のcolliderに戻す必要がある。
        // CommonBossSceneのsetColliders()を呼び出すことで、
        // ballAttackBrickCollider と ballAttackBrickOverlap が適切に再設定されることを期待。
        this.setColliders(); // ★コライダーを再設定★

        // (オプション) ボールの見た目を確実に元に戻す
        // super.setBallPowerUpState で既に updateBallAppearance が呼ばれているかもしれないが念のため
        // const targetBalls = specificBall ? [specificBall] : this.balls?.getChildren() ?? [];
        // targetBalls.forEach(ball => {
        //     if (ball?.active) this.updateBallAppearance(ball);
        // });
    }
    // ★★★-------------------------------------------★★★

    // 全体的な見た目更新 (これはsuper.setBallPowerUpStateの後か、その中で呼ばれるべき)
    // this.updateBallAndPaddleAppearance(); // super側で呼ばれていなければここで
}

deactivateTrialShatora() {
    if (!this.isTrialShatoraActive) return;
    console.log("[Trial IX] Deactivating permanent Shatora effect.");
    this.isTrialShatoraActive = false;
    this.currentTrialBallSpeedMultiplier = 1.0; // 通常に戻す

    // 既存のボール全ての速度を通常に戻す
    this.balls?.getChildren().forEach(ball => {
        if (ball.active && ball.body) {
            const currentDirection = ball.body.velocity.clone().normalize();
            // パワーアップ効果を考慮した基本速度に戻す
            let baseSpeed = NORMAL_BALL_SPEED || 380;
            if (ball.getData('isFast')) baseSpeed *= (BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA] || 1);
            if (ball.getData('isSlow')) baseSpeed *= (BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA] || 1);
            ball.setVelocity(currentDirection.x * baseSpeed, currentDirection.y * baseSpeed);
        }
    });
    // (ボールの見た目を通常に戻す this.setBallPowerUpState(POWERUP_TYPES.SHATORA, false) など)
    this.updateBallAndPaddleAppearance();
}

// launchBall をオーバーライドして、試練IX中は強制的に高速で発射
launchBall() {
    console.log(`[LaunchBall Boss4] Called. isTrialShatoraActive: ${this.isTrialShatoraActive}, currentTrialBallSpeedMultiplier: ${this.currentTrialBallSpeedMultiplier}`);
    if (this.isTrialShatoraActive && typeof this.currentTrialBallSpeedMultiplier === 'number') {
        console.log(`[LaunchBall Override] Trial IX active. isBallLaunched: ${this.isBallLaunched}, playerControlEnabled: ${this.playerControlEnabled}, ActiveBalls: ${this.balls?.countActive(true)}`);
        if (!this.isBallLaunched && this.playerControlEnabled && this.balls?.countActive(true) > 0) {
            const baseSpeedY = BALL_INITIAL_VELOCITY_Y || -380;
            const finalSpeedY = baseSpeedY * this.currentTrialBallSpeedMultiplier;

            // X速度の計算を見直し (より安全に)
            const baseSpeedXAbs = Math.abs(Phaser.Math.Between(BALL_INITIAL_VELOCITY_X_RANGE[0], BALL_INITIAL_VELOCITY_X_RANGE[1]));
            let finalSpeedX = Phaser.Math.RND.pick([-1, 1]) * baseSpeedXAbs * this.currentTrialBallSpeedMultiplier;
            // X速度が0にならないように最低値を設定 (任意)
            if (Math.abs(finalSpeedX) < 50 * this.currentTrialBallSpeedMultiplier) {
                finalSpeedX = (finalSpeedX >= 0 ? 1 : -1) * 50 * this.currentTrialBallSpeedMultiplier;
            }

            console.log(`[LaunchBall Override] Calculated Speeds -> finalSpeedX: ${finalSpeedX.toFixed(1)}, finalSpeedY: ${finalSpeedY.toFixed(1)}`);

            let ballLaunchedThisCall = false;
            this.balls.getChildren().forEach(ball => {
                if (ball.active && this.isBallOnPaddle(ball)) { // パドル上のボールのみ発射
                    ball.setVelocity(finalSpeedX, finalSpeedY);
                    console.log(`[LaunchBall Override] Ball ${ball.name} launched with V(${finalSpeedX.toFixed(1)}, ${finalSpeedY.toFixed(1)})`);
                    ballLaunchedThisCall = true;
                } else if (ball.active && !this.isBallOnPaddle(ball) && this.isTrialShatoraActive) {
                    // 既に動いているボールも試練IXの速度に合わせる (オプション)
                    const currentDirection = ball.body.velocity.clone().normalize();
                    const newSpeed = (NORMAL_BALL_SPEED || 380) * this.currentTrialBallSpeedMultiplier;
                    ball.setVelocity(currentDirection.x * newSpeed, currentDirection.y * newSpeed);
                     console.log(`[LaunchBall Override] Existing ball ${ball.name} speed adjusted for Trial IX.`);
                }
            });

            if (ballLaunchedThisCall) {
                this.isBallLaunched = true;
                if (AUDIO_KEYS.SE_LAUNCH) this.sound.play(AUDIO_KEYS.SE_LAUNCH);
                console.log("[LaunchBall Override] Ball launch confirmed. isBallLaunched set to true.");
            } else {
                console.log("[LaunchBall Override] No ball was on paddle to launch this call.");
            }
        } else {
            console.log("[LaunchBall Override] Conditions not met for launch.");
        }
    } else {
        console.log("[LaunchBall Boss4] Trial IX not active or multiplier not set, calling super.launchBall().");
        super.launchBall(); // 通常の発射処理
    }
}

// (isBallOnPaddle(ball) はパドル上にボールがあるか判定するヘルパー)
// (isBallOnPaddle(ball) ヘルパーメソッド - ボールがパドル上にあるか判定)
isBallOnPaddle(ball) {
    if (!ball || !ball.body || !this.paddle || !this.paddle.active) return false;
    // 簡易的な判定: ボールのY座標がパドルの上端より少し上で、X座標がパドルの範囲内
    const paddleBounds = this.paddle.getBounds();
    return ball.y < paddleBounds.top && ball.y > paddleBounds.top - ball.displayHeight * 2 &&
           ball.x > paddleBounds.left && ball.x < paddleBounds.right;
}

// hitPaddle, hitBoss の反射ロジックでも this.currentTrialBallSpeedMultiplier を考慮する必要がある
// (ボールの最終速度を計算する際に、この倍率を掛ける)

// Boss4Scene.js
hitPaddle(paddle, ball) {
    if (!paddle || !ball?.active || !ball.body) return;

    // --- 反射角度計算 (CommonBossSceneのロジックをベースに) ---
    let diff = ball.x - paddle.x;
    let influence = Phaser.Math.Clamp(diff / (paddle.displayWidth / 2), -1, 1);
    let newVx = ((NORMAL_BALL_SPEED || 380) * 0.85) * influence;
    let newVyAbs = Math.sqrt(Math.max(0, Math.pow((NORMAL_BALL_SPEED || 380), 2) - Math.pow(newVx, 2)));
    const minVyRatio = 0.3;
    if (newVyAbs < (NORMAL_BALL_SPEED || 380) * minVyRatio) { /* ... Y最低速度保証 ... */ }
    let newVy = -newVyAbs;

    // --- パワーアップと試練による速度補正 ---
    let itemSpeedMultiplier = 1.0;
    if (ball.getData('isFast')) itemSpeedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA] || 1.0;
    else if (ball.getData('isSlow')) itemSpeedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA] || 1.0;

    let trialSpeedMultiplier = 1.0;
    if (this.isTrialShatoraActive && typeof this.currentTrialBallSpeedMultiplier === 'number') {
        trialSpeedMultiplier = this.currentTrialBallSpeedMultiplier;
    }

    const targetSpeed = (NORMAL_BALL_SPEED || 380) * itemSpeedMultiplier * trialSpeedMultiplier;
    console.log(`[HitPaddle Boss4] ItemMultiplier: ${itemSpeedMultiplier}, TrialMultiplier: ${trialSpeedMultiplier}, TargetSpeed: ${targetSpeed.toFixed(0)}`);


    const finalVel = new Phaser.Math.Vector2(newVx, newVy);
    if (finalVel.lengthSq() === 0) finalVel.set(0, -1);
    finalVel.normalize().scale(targetSpeed);
    ball.setVelocity(finalVel.x, finalVel.y);

    // SEとエフェクト、インダラ解除などは super で呼ぶか、Commonからコピー
    if (AUDIO_KEYS.SE_REFLECT) this.sound.play(AUDIO_KEYS.SE_REFLECT, { volume: 0.8 });
    this.createImpactParticles(ball.x, paddle.getBounds().top, [240, 300], 0xffffcc, 6); // Commonのメソッド
    if (ball.getData('isIndaraActive') && typeof this.deactivateIndara === 'function') { // deactivateIndara は Common にある想定
        this.deactivateIndara(ball);
    }
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
        super.update(time, delta); // CommonBossSceneのupdateを呼ぶ (ボス行動など)ジエンドタイマー調整もここ

        if (this.isJiEndTimerRunning && !this.isGameOver && !this.bossDefeated) {
            let speedMultiplier = 1.0;
            if (this.currentRoute === 'order') speedMultiplier = 0.5;
            else if (this.currentRoute === 'chaos') speedMultiplier = 2.0;
            this.jiEndTimeRemaining -= delta * speedMultiplier;

             // ★試練IXのジエンドタイマー加速★
        if (this.activeTrial && this.activeTrial.id === 9 && this.activeTrial.trialJiEndTimerMultiplier) {
            speedMultiplier *= this.activeTrial.trialJiEndTimerMultiplier;
           // console.log(`[JiEndTimer Update] Trial IX active, final speed multiplier: ${speedMultiplier.toFixed(2)}`);
        }
        // ★★★----------------------★★★

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
    // Boss4Scene.js クラス内に新しいメソッドとして追加

/**
 * ライフを失った際の処理。CommonBossSceneの処理に加え、
 * 試練X「連鎖する星々の輝き」の連続ヒットカウントをリセットする。
 */
loseLife() {
    const livesBefore = this.lives; // loseLife前のライフを記録

    // まず親クラスのloseLife処理を実行（ライフ減少、パワーアップ解除、ボールリセットなど）
    super.loseLife();
    console.log(`[Boss4 LoseLife] Called. Lives changed from ${livesBefore} to ${this.lives}.`);

    // ★★★ 試練Xの連続ヒットカウントをリセット ★★★
    if (this.activeTrial && !this.activeTrial.completed && this.activeTrial.id === 10) {
        if (this.activeTrial.consecutiveHits > 0) { // カウントが進んでいた場合のみログ出す
            console.log(`[Trial X Reset] Ball lost. Resetting consecutive hits from ${this.activeTrial.consecutiveHits} to 0.`);
        }
        this.activeTrial.consecutiveHits = 0;
        if (this.trialUiText) {
            // UIの進捗表示もリセットする必要がある
            this.updateTrialProgressUI(this.activeTrial);
        }
    }
    // ★★★------------------------------------★★★
}
// Boss4Scene.js

// CommonBossSceneのdefeatBossをオーバーライド
defeatBoss(bossObject) {
    // isFinalBattleActive や this.bossDefeated のチェックは CommonBossScene の defeatBoss の冒頭でも行われるはず
    // なので、ここではシンプルに super を呼ぶだけでも良いかもしれない。
    // ただし、最終ボスであることの特別なログなどはここにあっても良い。

    if (this.isFinalBattleActive) { // 最終決戦で倒された場合
        console.log(`[Boss4Scene] Lucilius Zero (Boss ${this.currentBossIndex}) defeated in Final Battle!`);
        // ★★★ CommonBossScene の標準デフィート演出を開始させる ★★★
        super.defeatBoss(bossObject);
        // ★★★-------------------------------------------------★★★
        // この後、CommonBossScene の defeatBoss -> startBossShakeAndFade ->
        // (showStageClearPopup ではなく) handleBossDefeatCompletion -> triggerGameClear
        // という流れになることを期待する。
        // triggerGameClear() をここで直接呼ばない。
    } else {
        // 試練中にこのメソッドが呼ばれることは通常ないはずだが、念のため親を呼ぶ
        console.warn("[Boss4Scene] defeatBoss called unexpectedly during trial phase.");
        super.defeatBoss(bossObject);
    }
}

    // シーン終了時の処理
    shutdownScene() {
        super.shutdownScene();
         this.voidWallBlocksGroup?.destroy(true, true);
    this.ballVoidWallCollider?.destroy();
        this.jiEndTimerText?.destroy();
        this.trialUiText?.destroy();
        this.harmonyCrystal?.destroy();
        this.destructionCrystal?.destroy();
         this.chaosFragmentsGroup?.destroy(true, true);
    this.chaosFragmentsGroup = null;
    this.ballChaosFragmentCollider?.destroy();
    this.ballChaosFragmentCollider = null;
        // 他のこのシーン固有のオブジェクトやタイマーもクリア
        console.log("--- Boss4Scene SHUTDOWN Complete ---");
    }
}
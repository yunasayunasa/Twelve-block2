// Boss4Scene.js
import CommonBossScene from './CommonBossScene.js';
import {
    AUDIO_KEYS, POWERUP_TYPES, TOTAL_BOSSES, GAMEPLAY_START_DELAY,VAJRA_GAUGE_MAX, 
    NORMAL_BALL_SPEED, BALL_SPEED_MODIFIERS, DEFAULT_ATTACK_BRICK_VELOCITY_Y,
    CUTSCENE_DURATION, POWERUP_ICON_KEYS,POWERUP_SIZE_RATIO,OWERUP_SPEED_Y,
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
         this.isTimeFieldTrialActive = false; // Boss4Sceneがtrue/falseする
this.timeFieldData = null;           // Boss4Sceneが設定する {boundaryY, slowFactor, fastFactor}

        this.currentRoute = null;
        this.harmonyCrystal = null;
        this.destructionCrystal = null;
        this.isChoiceEventActive = false;
        this.chaosFragmentsGroup = null; // 専用グループ
        this.isCompletingTrial = false;
         this.isSpecialSequenceActive = false; // ★専用演出中フラグ

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

             paradiseLostPillarCount: 7, // パラダイス・ロストの光の柱の数
    paradiseLostPillarDuration: 550, // 光の柱1本の基本落下時間(ms)
    lightPillarTexture: 'light_pillar_effect', // ★要アセット＆BootSceneロード
            jiEndCountInitialMinutes: 10,
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
    attackIntervalOrder: { min: 2200, max: 3500 }, // 秩序: 2.2秒～3.5秒間隔 (以前より少し遅く)
    attackIntervalChaos: { min: 4500, max: 7000 }, // 混沌: 4.5秒～7秒間隔 (かなり遅く)
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
        count: 3, // 5方向全て
        speedMultiplier: 1.1,
        // (オプション) 角度を少し狭めて密度を上げるなども
    },
    radialAttackParamsChaos: { // 混沌ルート: 弾数を減らし、かなり遅く
        count: 1, // 中央3方向のみなど
        speedMultiplier: 0.7,
        // (オプション) 角度を広げて避けやすくするなども
    },
    // --- ▲ ------------------------------------ ▲ ---

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
            { id: 9, name: "時の超越、歪む流れ",  conditionText: "惑わされることなく、本体にボールを3回当てよ。(0/3)",
                dropLogic: 'mixedFakeAndReal', // ドロップロジックのタイプ
                // この試練でドロップするアイテムはHAILAかSHATORAのどちらかの「見た目」
                // その上で、それが本物か偽物かはランダム
                baseItemTypesForMix: [POWERUP_TYPES.HAILA, POWERUP_TYPES.SHATORA],
                completed: false,
                hitCountTimeField: 0, // ボスへのヒット数
                requiredHitsTimeField: 3
            },
            { id: 10, name: "連鎖する星々の輝き", conditionText: "ライフを失わずにボールを連続3回当てよ。", targetItem: POWERUP_TYPES.INDARA, completed: false, consecutiveHits: 0, requiredConsecutiveHits: 3 },
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
            // if (AUDIO_KEYS.SE_TRIAL_START) this.sound.play(AUDIO_KEYS.SE_TRIAL_START);

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
        this.activateTimeField(trial);
    }

        if (trial.id === 11) this.spawnVoidWall();
        // 他の試練の準備も同様に
    }

    activateTimeField(trialData) {
    console.log("[Trial IX] Activating Time Field.");
    this.isTimeFieldTrialActive = true; // CommonBossSceneのフラグを立てる
    this.timeFieldData = { // CommonBossSceneに渡すデータ
        boundaryY: this.gameHeight * (trialData.timeFieldBoundaryYRatio || 0.5),
        slowFactor: trialData.timeFieldSlowFactor || 0.7,
        fastFactor: trialData.timeFieldFastFactor || 1.3
    };

    // 視覚エフェクト生成 (例: 半透明オーバーレイ)
    this.timeFieldSlowOverlay = this.add.rectangle(0, 0, this.gameWidth, this.timeFieldData.boundaryY, 0x0000ff, 0.1).setOrigin(0,0).setDepth(-1);
    this.timeFieldFastOverlay = this.add.rectangle(0, this.timeFieldData.boundaryY, this.gameWidth, this.gameHeight - this.timeFieldData.boundaryY, 0xff0000, 0.1).setOrigin(0,0).setDepth(-1);

    if (AUDIO_KEYS.SE_TIME_FIELD_ON) this.sound.play(AUDIO_KEYS.SE_TIME_FIELD_ON);
}
// completeCurrentTrial や shutdownScene で timeField を解除する処理
deactivateTimeField() {
    console.log("[Trial IX] Deactivating Time Field.");
    this.isTimeFieldTrialActive = false;
    this.timeFieldData = null;
    this.timeFieldSlowOverlay?.destroy(); this.timeFieldSlowOverlay = null;
    this.timeFieldFastOverlay?.destroy(); this.timeFieldFastOverlay = null;
    if (AUDIO_KEYS.SE_TIME_FIELD_OFF) this.sound.play(AUDIO_KEYS.SE_TIME_FIELD_OFF);
    // ボールの速度を通常に戻す処理も必要ならここで行う
    this.balls?.getChildren().forEach(ball => {
        if(ball.active && ball.body) {
            const currentSpeed = ball.body.velocity.length();
            let baseSpeedWithPowerUp = NORMAL_BALL_SPEED;
            if (ball.getData('isFast')) baseSpeedWithPowerUp *= (BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA] || 1);
            if (ball.getData('isSlow')) baseSpeedWithPowerUp *= (BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA] || 1);
            if (Math.abs(currentSpeed - baseSpeedWithPowerUp) > 10) {
                ball.body.velocity.normalize().scale(baseSpeedWithPowerUp);
            }
        }
    });
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

    // Boss4Scene.js
executeParadiseLostSequence() {
    if (this.isSpecialSequenceActive) return; // 多重実行防止
    this.isSpecialSequenceActive = true; // ★演出開始
    console.log("[Trial VI] Starting Paradise Lost sequence. SpecialSequenceActive = true");
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
    const damageAndCompletionDelay = 1000; // 1秒後 (調整可能)
    this.time.delayedCall(damageAndCompletionDelay, () => {
        if (this.isGameOver || this.bossDefeated || !this.activeTrial || this.activeTrial.id !== 6 || !this.scene.isActive()) {
            // 試練VI中でない、またはゲームが終わっていたら何もしない
            if(this.activeTrial && this.activeTrial.id === 6) this.isSpecialSequenceActive = false; // フラグだけ戻す
            return;
        }

        console.log("[ParadiseLost] Applying damage and checking trial completion...");
        let damage = 8;
        if (this.isPlayerAnilaActive()) { // isPlayerAnilaActive は CommonBossScene に定義済みと仮定
            damage = 0;
            console.log("[Trial VI] Paradise Lost NEGATED by Anila!");
            if (typeof this.deactivateAnila === 'function') this.deactivateAnila(); // アニラ消費
        }
        console.log(`[Trial VI] Player to take ${damage} damage from Paradise Lost.`);

        if (damage > 0) {
            for(let i=0; i < damage; i++) {
                if(this.lives > 0 && !this.isGameOver) { // isGameOverもチェック
                    this.loseLife();
                } else { break; }
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
            this.isSpecialSequenceActive = false; // ここでもフラグを下ろす
            return; // 試練達成には進まない
        }

        // 生き残れば試練達成
        this.activeTrial.paradiseLostTriggered = true; // 試練内の達成フラグ
        this.isSpecialSequenceActive = false; // ★専用演出終了フラグを下ろす
        console.log("[Trial VI] Paradise Lost sequence (attack part) finished. SpecialSequenceActive = false.");
        this.completeCurrentTrial(); // 試練完了処理へ
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
    if (this.isIntroAnimating || !this.playerControlEnabled || !this.boss || !this.boss.active ||
        this.bossDefeated || this.isGameOver || this.isChoiceEventActive || this.isFinalBattleActive ||
        this.isCompletingTrial || this.isSpecialSequenceActive) { // ★isCompletingTrial を追加★
          if (this.isFinalBattleActive && !this.isCompletingTrial && !this.isSpecialSequenceActive) { // 最終決戦AIは特別演出中でなければ動く
            this.updateFinalBattleBossAI(time, delta);
        }
        if(this.isSpecialSequenceActive) //console.log("[UpdateSpecificBossBehavior] Guarded by isSpecialSequenceActive");
        
        if(this.isCompletingTrial) console.log("[UpdateSpecificBossBehavior] Paused during trial completion sequence.");if (this.isFinalBattleActive) this.updateFinalBattleBossAI(time, delta);
        return;
    }
    // ..

    // --- 攻撃処理 (試練中: activeTrialIndex が 1 以上、つまり試練II以降) ---
    // activeTrialIndex は 0 から始まるので、試練IIはインデックス 1
    if (this.activeTrialIndex >= 1) { // 試練ID 2 (原初の契約) 以降
        const attackIntervalConfig = this.currentRoute === 'order' ?
            (this.bossData.attackIntervalOrder || {min:1800, max:2800}) :
            (this.bossData.attackIntervalChaos || {min:3500, max:5500});
        const interval = Phaser.Math.Between(attackIntervalConfig.min, attackIntervalConfig.max);

        // デバッグログ (条件確認用)
        // console.log(`[Attack Check] time: ${time.toFixed(0)}, lastAttack: ${this.lastAttackTime.toFixed(0)}, interval: ${interval}, diff: ${(time - (this.lastAttackTime + interval)).toFixed(0)}`);

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
    if (!boss || !ball || !ball.body || !boss.active || this.isCompletingTrial) { // ★isCompletingTrial を追加★
        if(this.isCompletingTrial) console.log("[HitBoss] Ignoring hit, trial completion in progress.");
        return;
    }
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
            case 5: // 試練V「星光の追撃」
            if (this.activeTrial.id === 5 && boss === this.boss) { // ★ボス本体へのヒットか確認★
                if (this.isPlayerKubiraActive()) { // ★このメソッドが定義されていればエラーは出ない★
                    this.activeTrial.hitCountKubira = (this.activeTrial.hitCountKubira || 0) + 1;
                    if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial);
                    if (this.activeTrial.hitCountKubira >= this.activeTrial.requiredHitsKubira) {
                        trialJustCompleted = true;
                    }
                } else {
                    console.log("[Trial V Check] Hit boss, but Kubira is not active.");
                }
            }
                break;
            case 9: // 時の超越
                if (boss === this.boss && this.isTimeFieldTrialActive) { // フィールド効果中か確認
                    this.activeTrial.hitCountTimeField = (this.activeTrial.hitCountTimeField || 0) + 1;
                    if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial);
                    if (this.activeTrial.hitCountTimeField >= this.activeTrial.requiredHitsTimeField) {
                        trialJustCompleted = true;
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

    console.log(`[TrialLogic] Trial ${this.activeTrial.id}「${this.activeTrial.name}」 MARKED COMPLETED! Initiating post-trial sequence.`);

    // ボスの現在の攻撃/ワープタイマーを実質的に停止させる (次の行動を遅らせる)
    this.lastAttackTime = this.time.now + 100000; // 非常に大きな値を設定して一時停止
    this.lastWarpTime = this.time.now + 100000;   // 同上
    console.log("[CompleteTrial] Boss action timers temporarily paused.");

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
                console.log(`[Trial Complete] JiEndTimer +${timeToAdd/1000}s.`);
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
    if (!this.boss || !this.boss.active) {
        console.warn("[WarpBoss] Boss is not active or does not exist. Skipping warp.");
        return;
    }
    if (this.isWarping) {
        console.log("[WarpBoss] Already warping. Skipping new warp request to prevent overlap.");
        return;
    }
    // --- ▲ ガード処理 終了 ▲ ---

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
        progressText = ` (: ${trial.hitCoreCount || 0}/${trial.coreCount || 3})`;
        break;
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
// Boss4Scene.js

triggerPowerUpEffect(type, itemObject = null) {
    let effectToApply = type; // 実際に発動する効果のタイプ
    const originalVisualType = type; // アイテムの見た目上のタイプ (引数で渡ってきたもの)
    const isFake = itemObject ? itemObject.getData('isFake') : false; // アイテムオブジェクトから偽物フラグ取得

    console.log(`[TriggerEffect Boss4 ENTER] VisualType: ${originalVisualType}, isFake: ${isFake}, ActiveTrialID: ${this.activeTrial?.id}`);

    // --- ▼ 試練IX「惑わしの秘薬」効果反転処理 ▼ ---
    if (this.activeTrial && !this.activeTrial.completed && this.activeTrial.id === 9 && isFake) {
        console.log(`[Trial IX Effect] Item looked like ${originalVisualType}, but it's FAKE! Applying opposite.`);
        if (originalVisualType === POWERUP_TYPES.HAILA) {
            effectToApply = POWERUP_TYPES.SHATORA;
        } else if (originalVisualType === POWERUP_TYPES.SHATORA) {
            effectToApply = POWERUP_TYPES.HAILA;
        }
        // (もし他のアイテムも偽物にするなら、ここに追加の反転ロジック)
        console.log(`[Trial IX Effect] Actual effect to apply: ${effectToApply}`);
    }
    // --- ▲ 試練IX 効果反転処理 終了 ▲ ---


    // --- ▼ 試練VII「三宝の導き」の収集状況を更新 ▼ ---
    // 注意: この判定は「実際に発動する効果(effectToApply)」ではなく、「取得したアイテムの見た目(originalVisualType)」で行うべきか、
    //       あるいは「実際に発動した効果」で集めるのか、仕様によります。
    //       ここでは「見た目上のアイテムを集める」と仮定します。
    if (this.activeTrial && !this.activeTrial.completed && this.activeTrial.id === 7) {
        const trialData = this.activeTrial;
        // itemsToCollectForTrial7 には、ビカラ陽、バドラ、マコラが入っている想定
        const itemIndex = trialData.itemsToCollectForTrial7.indexOf(originalVisualType); // ★originalVisualTypeで判定

        if (itemIndex !== -1 && !trialData.collectedFlagsForTrial7[itemIndex]) {
            trialData.collectedFlagsForTrial7[itemIndex] = true;
            trialData.collectedCountForTrial7 = (trialData.collectedCountForTrial7 || 0) + 1;
            console.log(`[Trial VII] Collected (見た目): ${originalVisualType}. Total unique: ${trialData.collectedCountForTrial7}/${trialData.itemsToCollectForTrial7.length}`);
            if (this.trialUiText) this.updateTrialProgressUI(trialData);

            if (trialData.collectedCountForTrial7 >= trialData.itemsToCollectForTrial7.length) {
                console.log("[Trial VII] All Sanpo items collected! Completing trial.");
                // this.completeCurrentTrial(); // ★注意: ここで呼ぶとsuperより先になる
                                             // 試練達成判定はメソッドの最後にまとめて行う方が安全
            }
        }
    }
    // --- ▲ 試練VII 収集処理 終了 ▲ ---


    // --- 親の通常のアイテム効果発動処理を呼び出す (effectToApply を渡す) ---
    // itemObject はここで破棄されるので、親に渡す場合は注意。
    // もし親のメソッドで itemObject が必要なら、ここで破棄せずに渡す。
    // CommonBossSceneのtriggerPowerUpEffectがitemObjectを破棄すると仮定。
    console.log(`[TriggerEffect Boss4] Calling super.triggerPowerUpEffect with ACTUAL effect: ${effectToApply}`);
    super.triggerPowerUpEffect(effectToApply, itemObject); // ★★★ effectToApply を渡す ★★★
    // これにより、CommonBossScene側では、実際に発動すべき効果に基づいて処理が行われる。
    // (例: activateShatora(), activateHaira() などが effectToApply に応じて呼ばれる)


    // --- ▼ 試練達成判定 (アイテム効果発動後に行う方が確実な場合もある) ▼ ---
    // 特に、試練の達成が「特定の効果が発動したこと」に依存する場合など。
    // 今回の試練VIIは「アイテムを集めること」が条件なので、上記の収集処理内で判定完了でOK。
    // 試練IXのクリア条件は「ボスに3回当てる」なので、このメソッド内では達成判定しない。
    // (hitBossメソッド内で別途行う)
    if (this.activeTrial && !this.activeTrial.completed && this.activeTrial.id === 7) {
        if (this.activeTrial.collectedCountForTrial7 >= this.activeTrial.itemsToCollectForTrial7.length) {
            this.completeCurrentTrial(); // 改めてここで呼ぶ
        }
    }
    // --- ▲ 試練達成判定 終了 ▲ ---

    console.log(`[TriggerEffect Boss4 EXIT] Finished processing for visual type: ${originalVisualType}, applied effect: ${effectToApply}`);
}


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
         // 試練VII「三宝の導き」: 指定3種からランダムドロップ
    if (this.activeTrial.id === 7 && this.activeTrial.dropCandidateSanpo && this.activeTrial.dropCandidateSanpo.length > 0) {
        return Phaser.Utils.Array.GetRandom(this.activeTrial.dropCandidateSanpo);
    }
        // 試練IX「時の超越」: ハイラかシャトラを交互
          if (this.activeTrial.id === 9 && this.activeTrial.dropLogic === 'mixedFakeAndReal') {
        // 見た目としてハイラかシャトラかをまずランダムに決める
        const visualType = Phaser.Utils.Array.GetRandom(this.activeTrial.baseItemTypesForMix);
        // それが本物か偽物かもランダムに決める (50%の確率で偽物)
        const isFake = Phaser.Math.Between(0, 1) === 0;

        console.log(`[Trial IX Drop] Visual: ${visualType}, IsFake: ${isFake}`);
        // dropSpecificPowerUp に渡す情報として、オブジェクトで返す
        return { typeToDrop: visualType, makeItFake: isFake };
    }

        // 上記以外で、試練に targetItem が設定されていればそれを返す
        if (this.activeTrial.targetItem) {
            return this.activeTrial.targetItem;
        }
        return null; // それ以外は通常ドロップ
    }

    // Boss4Scene.js
dropSpecificPowerUp(x, y, itemDropData) { // itemDropData は { typeToDrop: 'haila', makeItFake: true } のようなオブジェクト
    let typeToDisplay;
    let isActuallyFake = false;
    let customTint = null;

    if (typeof itemDropData === 'object' && itemDropData !== null && itemDropData.typeToDrop) {
        // getOverrideDropItem からオブジェクトが渡された場合
        typeToDisplay = itemDropData.typeToDrop;
        isActuallyFake = itemDropData.makeItFake || false;
    } else if (typeof itemDropData === 'string') {
        // 他の試練などから直接タイプ文字列が渡された場合
        typeToDisplay = itemDropData;
    } else {
        console.error("[DropSpecific] Invalid itemDropData:", itemDropData);
        return;
    }

    if (!this.powerUps) return;
    let iconKey = POWERUP_ICON_KEYS[typeToDisplay] || 'whitePixel';
    const itemSize = this.gameWidth * (POWERUP_SIZE_RATIO || 0.08);
    let defaultTintColor = (iconKey === 'whitePixel' && typeToDisplay === POWERUP_TYPES.BAISRAVA) ? 0xffd700 : (iconKey === 'whitePixel' ? 0xcccccc : null);

    const powerUpItem = this.powerUps.create(x, y, iconKey)
        .setDisplaySize(itemSize, itemSize)
        .setData('actualType', typeToDisplay) // 見た目上のタイプ
        .setData('isFake', isActuallyFake);   // 偽物かどうかのフラグ

    if (isActuallyFake) {
        if (typeToDisplay === POWERUP_TYPES.HAILA) customTint = 0xffaaaa; // 偽ハイラは赤っぽく
        else if (typeToDisplay === POWERUP_TYPES.SHATORA) customTint = 0xaaaaff; // 偽シャトラは青っぽく
        console.log(`[Fake Item Drop Visual] Dropping FAKE ${typeToDisplay} with tint ${customTint?.toString(16)}`);
    }

    const finalTintColor = customTint !== null ? customTint : defaultTintColor;
    if (finalTintColor !== null) {
        powerUpItem.setTint(finalTintColor);
    } else {
        powerUpItem.clearTint();
    }

    if (powerUpItem.body) {
        powerUpItem.setVelocity(0, POWERUP_SPEED_Y || 120);
        powerUpItem.body.setAllowGravity(false).setCollideWorldBounds(false);
    } else if (powerUpItem) {
        powerUpItem.destroy();
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
        super.update(time, delta); // CommonBossSceneのupdateを呼ぶ (ボス行動など)

        if (this.isJiEndTimerRunning && !this.isGameOver && !this.bossDefeated) {
            let speedMultiplier = 1.0;
            if (this.currentRoute === 'order') speedMultiplier = 0.5;
            else if (this.currentRoute === 'chaos') speedMultiplier = 1.5;
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
         this.chaosFragmentsGroup?.destroy(true, true);
    this.chaosFragmentsGroup = null;
    this.ballChaosFragmentCollider?.destroy();
    this.ballChaosFragmentCollider = null;
        // 他のこのシーン固有のオブジェクトやタイマーもクリア
        console.log("--- Boss4Scene SHUTDOWN Complete ---");
    }
}
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

            attackIntervalOrder: { min: 1800, max: 2800 }, // 攻撃間隔 (秩序) - 少し速め
            attackIntervalChaos: { min: 3500, max: 5500 }, // 攻撃間隔 (混沌) - 遅め
            // (弾速、弾数などもここで定義し、fireRadialAttack/fireTargetedAttackで参照する)
            radialAttackParamsOrder: { count: 5, speedMultiplier: 1.2 },
            radialAttackParamsChaos: { count: 3, speedMultiplier: 0.8 },
            targetedAttackParamsOrder: { chargeTime: 600, speedMultiplier: 1.1 },
            targetedAttackParamsChaos: { chargeTime: 900, speedMultiplier: 0.9 },

            warpInterval: 6000, // ワープ間隔 (ms)

            trials: this.defineTrials(),
            trialRewardItem: POWERUP_TYPES.BIKARA_YANG,
            // ルシゼロ専用攻撃弾のテクスチャキー
            projectileTextureKey: 'attack_brick_lucilius',
            targetProjectileTextureKey: 'attack_brick_lucilius_target',
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
            const initialY = this.gameHeight * 0.20; // Y座標 (調整可能)
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
startIntroCutscene() {
    console.log("[Boss4Scene] Starting Lucilius Zero intro sequence with custom (simplified) cutscene...");
    this.isIntroAnimating = true;
    this.playerControlEnabled = false;
    this.isBallLaunched = false;
    this.sound.stopAll();
    this.stopBgm(); // CommonBossSceneのメソッドを呼ぶ

      // ★★★ 以下を一つずつコメント解除してテスト ★★★

    // テストA: CUTSCENE_DURATION の参照
     const cutsceneDuration = CUTSCENE_DURATION || 1800;
     console.log("Test A: cutsceneDuration =", cutsceneDuration);

    // テストB: オーバーレイ生成
    // const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x100020, 0.75)
    //     .setOrigin(0,0).setDepth(899);
    // console.log("Test B: overlay created:", overlay);

    // テストC: textContent の準備
    // const textContent = this.bossData.cutsceneText || "VS DARK RUPTURE ZERO";
    // console.log("Test C: textContent =", textContent);

    // テストD: calculateDynamicFontSize の呼び出し
    // const fontSize = this.calculateDynamicFontSize(60);
    // console.log("Test D: fontSize =", fontSize);

    // テストE: textStyle の準備
    // const textStyle = { fontSize: `${fontSize}px`, fill: '#E0E0E0', fontFamily: 'serif', align: 'center', stroke: '#111111', strokeThickness: Math.max(4, fontSize * 0.07) };
    // console.log("Test E: textStyle prepared.");

    // テストF: VSテキスト生成
    // const vsText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, textContent, textStyle)
    //     .setOrigin(0.5).setDepth(900);
    // console.log("Test F: vsText created:", vsText);

    // テストG: SE_CUTSCENE_START の再生
    // try { if (AUDIO_KEYS.SE_CUTSCENE_START) this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START); console.log("Test G: Played SE_CUTSCENE_START"); } catch(e) { console.error("Error G:", e); }

    // テストH: voiceAppear の再生
    // if (this.bossData.voiceAppear) try { this.sound.play(this.bossData.voiceAppear); console.log("Test H: Played voiceAppear"); } catch(e) { console.error("Error H:", e); }

    console.log("[Boss4Scene Intro] Fine-grained test point reached.");
    // delayedCallなどはまだコメントアウトのまま

  /*  this.time.delayedCall(cutsceneDuration, () => {
        if (overlay.scene) overlay.destroy();
        if (vsText.scene) vsText.destroy();

        if (this.isGameOver || this.bossDefeated) return;
        console.log("[Boss4Scene Intro] Custom cutscene finished. Proceeding to finalize boss appearance.");
        // CommonBossSceneの戦闘開始準備フローを呼び出す
        // これにより、ボスが表示され、物理が有効になり、startGameplayが呼ばれる
        this.finalizeBossAppearanceAndStart();
        this.isIntroAnimating = false;
    }, [], this);*/
}


    // startGameplay: Commonの処理後、UIセットアップと最初の試練開始を遅延実行
startGameplay() {
    console.log("[Boss4Scene] startGameplay override called.");
    super.startGameplay(); // BGM再生, playerControlEnabled=true (Commonで), startSpecificBossMovement (Boss4の静止処理)

    const uiSetupDelay = 500; // 0.5秒遅らせる (調整可能)
    this.time.delayedCall(uiSetupDelay, () => {
        if (this.isGameOver || this.bossDefeated) return;
        console.log(`[Boss4Scene startGameplay] Delayed UI setup executing after ${uiSetupDelay}ms.`);
        if (!this.jiEndTimerText) this.setupJiEndTimer();
        if (!this.trialUiText) this.setupTrialUI();
        if (this.activeTrialIndex < 0) this.startNextTrial(); // 最初の試練へ
    }, [], this);
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

    // 次の試練を開始する (または現在の試練のUIを更新)
    startNextTrial() {
        this.activeTrialIndex++;
        if (this.activeTrialIndex >= this.trialsData.length) {
            console.error("[TrialLogic] Attempted to start trial beyond a_vailable trials.");
            // 本来は「決着の刻」の前に全ての試練が終わるはず
            this.triggerJiEndGameOver(); // 予期せぬエラーとしてゲームオーバー
            return;
        }

        const currentTrial = this.trialsData[this.activeTrialIndex];
        this.activeTrial = currentTrial; // CommonBossSceneのプロパティにも設定 (getOverrideDropItemで参照のため)

        console.log(`[TrialLogic] Starting Trial ${currentTrial.id}: ${currentTrial.name}`);
        if (this.trialUiText && this.trialUiText.active) {
            let displayText = `十二の試練：試練 ${currentTrial.id}「${currentTrial.name}」\n`;
            displayText += `${currentTrial.conditionText}`;
            this.trialUiText.setText(displayText);
        }

        if (currentTrial.isChoiceEvent) {
        this.startHarmonyAndDestructionChoice();
        this.playerControlEnabled = false; // 選択イベント中は操作不可のまま
    } else if (currentTrial.isFinalBattle) {
        this.startFinalBattle();
        this.playerControlEnabled = true; // 最終決戦は操作可能
        if (!this.currentBgm || !this.currentBgm.isPlaying) this.playBossBgm(); // 最終決戦BGM
    } else {
        // 通常の試練開始
        this.setupCurrentTrialEnvironment(currentTrial);
        // ★★★ 選択イベント後、または最初の通常試練からプレイヤー操作を有効化 ★★★
        if (!this.playerControlEnabled) { // まだ操作不可なら
            this.playerControlEnabled = true;
            this.isBallLaunched = false; // ボールは再発射待ち
            if (!this.currentBgm || !this.currentBgm.isPlaying) this.playBossBgm();
            console.log("[TrialLogic] Player control ENABLED for current trial.");
        }
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
    // ★プレイヤー操作はこのメソッドの冒頭ではなく、startGameplayで既に有効になっているはず★
    // ★ボールもstartGameplay -> super.startGameplay() -> createBalls で準備されているはず★
    // ★もしボールがなければここで生成するロジックは残しても良いが、通常は不要のはず★
    // this.playerControlEnabled = true; // CommonのstartGameplayでtrueになる想定
    // this.isBallLaunched = false;    // CommonのstartGameplayでfalseになる想定

    if (this.trialUiText && this.activeTrial && this.activeTrial.isChoiceEvent) {
        this.trialUiText.setText(`十二の試練：試練 ${this.activeTrial.id}「${this.activeTrial.name}」\n${this.activeTrial.conditionText}`);
    }
    console.log("[ChoiceEvent] Presenting Harmony and Destruction choice. Player needs to destroy a crystal.");

    const crystalY = this.gameHeight * 0.45; // Y位置調整
    const crystalScale = 0.28; // スケール調整
    const crystalDepth = 10;  // ボールより手前、ボスより手前

    const crystalHitCallback = (ball, crystal) => {
        if (!this.isChoiceEventActive || !crystal.active) return; // イベント中かつクリスタルがアクティブな場合のみ
        
        const route = crystal.getData('crystalType');
        console.log(`[ChoiceEvent] Ball hit ${route} Crystal.`);

        // 両方のクリスタルを破壊演出（shatterCrystal内でdestroyも行う）
        this.shatterCrystal(this.harmonyCrystal);
        this.shatterCrystal(this.destructionCrystal);
        // colliderも不要になるので破棄できるとベストだが、シーン終了まで残っても大きな問題はない
        // (あるいは、shatterCrystal内でcolliderもdisableする)

        this.selectRoute(route); // ルート選択処理（クリスタルオブジェクトは渡さない）
    };

    // 秩序のクリスタル
    if (this.harmonyCrystal) this.harmonyCrystal.destroy();
    this.harmonyCrystal = this.physics.add.image(this.gameWidth * 0.3, crystalY, 'crystal_order')
        .setScale(crystalScale).setImmovable(true).setDepth(crystalDepth).setData('crystalType', 'order').setActive(true).setVisible(true);
    if (this.harmonyCrystal.body) this.harmonyCrystal.body.setAllowGravity(false);
    this.physics.add.collider(this.balls, this.harmonyCrystal, crystalHitCallback, (b,c)=>c.active, this);

    // 混沌のクリスタル
    if (this.destructionCrystal) this.destructionCrystal.destroy();
    this.destructionCrystal = this.physics.add.image(this.gameWidth * 0.7, crystalY, 'crystal_chaos')
        .setScale(crystalScale).setImmovable(true).setDepth(crystalDepth).setData('crystalType', 'chaos').setActive(true).setVisible(true);
    if (this.destructionCrystal.body) this.destructionCrystal.body.setAllowGravity(false);
    this.physics.add.collider(this.balls, this.destructionCrystal, crystalHitCallback, (b,c)=>c.active, this);

    // プレイヤー操作はCommonのstartGameplayで有効になっているはず
    // ボールがなければここで生成 (念のため)
    if (this.balls && this.balls.countActive(true) === 0) {
        this.createAndAddBallToPaddle(); // パドル上にボールを生成するヘルパーを想定
        this.isBallLaunched = false;
    } else { // 既にボールがある場合はパドル上に戻して未発射に
        this.resetAllBallsToPaddle(); // 全ボールをパドル上に戻すヘルパーを想定
        this.isBallLaunched = false;
    }
    console.log("[ChoiceEvent] Crystals displayed. Waiting for player to hit one.");
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


shatterCrystal(crystal) {
    if (!crystal || !crystal.active) return;
    console.log(`[ChoiceEvent] Shattering ${crystal.getData('crystalType')} crystal visually.`);
    crystal.disableBody(true, false); // ボディだけ無効化、非表示にはしない
    // crystal.setActive(false); // activeもfalseに
    this.tweens.add({
        targets: crystal, alpha: 0, scale: crystal.scale * 0.3, angle: 180, duration: 400, ease: 'Power2',
        onComplete: () => { if (crystal.scene) crystal.destroy(); }
    });
    // TODO: 破壊音 (AUDIO_KEYS.SE_CRYSTAL_BREAK_ORDER or CHAOS)
}

// selectRoute: ルートを設定し、次の試練へ
selectRoute(route) { // destroyedCrystal引数は不要に
    if (!this.isChoiceEventActive) return; // 重複呼び出し防止

    console.log(`[ChoiceEvent] Player selected route: ${route}`);
    this.currentRoute = route;
    this.isChoiceEventActive = false; // 選択イベント終了

    // (破壊されなかった方のクリスタルは、shatterCrystalが両方呼ばれることで対応済みのはず)
    // (あるいは、ここで明示的に両方destroyしても良い)
    if(this.harmonyCrystal?.scene) this.harmonyCrystal.destroy();
    if(this.destructionCrystal?.scene) this.destructionCrystal.destroy();
    this.harmonyCrystal = null;
    this.destructionCrystal = null;


    // 少し間を置いてから次の試練へ
    this.time.delayedCall(800, () => { // 破壊演出を見せるため少し長めに
        console.log("[ChoiceEvent] Proceeding to next trial after selection.");
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


selectRoute(route, destroyedCrystalOriginal = null) { // 引数名変更
    if (!this.isChoiceEventActive) return;

    console.log(`[ChoiceEvent] Player selected route: ${route}`);
    this.currentRoute = route;
    this.isChoiceEventActive = false;

    // ★破壊されなかった方のクリスタルを特定して消す★
    let remainingCrystal = null;
    if (destroyedCrystalOriginal === this.harmonyCrystal && this.destructionCrystal && this.destructionCrystal.active) {
        remainingCrystal = this.destructionCrystal;
    } else if (destroyedCrystalOriginal === this.destructionCrystal && this.harmonyCrystal && this.harmonyCrystal.active) {
        remainingCrystal = this.harmonyCrystal;
    }

    if (remainingCrystal) {
        console.log(`[ChoiceEvent] Destroying remaining crystal: ${remainingCrystal.getData('crystalType')}`);
        // こちらは即座に消すか、簡単なフェードアウト
        // remainingCrystal.destroy();
        this.tweens.add({ targets: remainingCrystal, alpha: 0, duration: 200, onComplete: () => {if(remainingCrystal.scene)remainingCrystal.destroy();} });

    }
    // 選択されたクリスタルはshatterCrystalで処理済み (またはここで改めてdestroy)
    // if (destroyedCrystalOriginal && destroyedCrystalOriginal.active) destroyedCrystalOriginal.destroy();

    this.harmonyCrystal = null;
    this.destructionCrystal = null;

    // 少し間を置いてから次の試練へ (演出のため)
    this.time.delayedCall(500, () => { // 0.5秒後
        this.startNextTrial();
    }, [], this);
}
    // 最終決戦「決着の刻」を開始
    startFinalBattle() {
        console.log("[FinalBattle] All trials cleared! Starting final battle with Lucilius Zero!");
        this.isFinalBattleActive = true;
        this.boss.setData('health', this.bossData.finalBattleHp);
        this.boss.setData('maxHealth', this.bossData.finalBattleHp);
        this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth')); // UIにHP表示
        // ボスを動けるようにする
        if (this.boss.body) this.boss.body.moves = true;
        this.startSpecificBossMovement(); // Commonの左右移動などを開始させる
        // アイテムドロップは「全種100%」になるように getOverrideDropItem で制御
    }

    // CommonBossSceneのメソッドをオーバーライドして試練達成時の報酬を追加
    // (これは試練達成条件を判定する各箇所から呼ぶ)
    completeCurrentTrial() {
        if (this.activeTrial && !this.activeTrial.completed) {
            console.log(`[TrialLogic] Trial ${this.activeTrial.id}「${this.activeTrial.name}」 COMPLETED!`);
            this.activeTrial.completed = true;

            // 報酬：ビカラ陽ドロップ
            if (this.bossData.trialRewardItem && this.boss && this.boss.active) {
                console.log(`[Trial Reward] Dropping ${this.bossData.trialRewardItem}`);
                this.dropSpecificPowerUp(this.boss.x, this.boss.y + this.boss.displayHeight/2, this.bossData.trialRewardItem);
            }
            // (試練達成SEなど)

            // 次の試練へ
            this.time.delayedCall(1000, this.startNextTrial, [], this); // 1秒後に次の試練
        }
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

    // ボスの攻撃パターンとワープ
    updateSpecificBossBehavior(time, delta) {
        if (this.isIntroAnimating || !this.playerControlEnabled || !this.boss || !this.boss.active || this.bossDefeated || this.isGameOver || this.isChoiceEventActive) {
            return;
        }

        // ワープ処理 (試練XII「決着の刻」以外)
        if (!this.isFinalBattleActive && time > this.lastWarpTime + (this.bossData.warpInterval || 5000)) {
            // (ボールヒット時と攻撃直後にもワープするロジックは別途 hitBoss や攻撃メソッド内に追加)
            // ここでは時間経過による定期ワープの例
            this.warpBoss();
            this.lastWarpTime = time;
        }

        // 攻撃処理 (試練I「調和と破壊」以降、かつ「決着の刻」ではない場合)
        if (this.activeTrialIndex > 0 && !this.isFinalBattleActive) {
            const attackIntervalConfig = this.currentRoute === 'order' ? this.bossData.attackIntervalOrder : this.bossData.attackIntervalChaos;
            const interval = Phaser.Math.Between(attackIntervalConfig.min, attackIntervalConfig.max);

            if (time > this.lastAttackTime + interval) {
                // ランダムで放射攻撃かターゲット攻撃を選択
                if (Phaser.Math.Between(0, 1) === 0) {
                    this.fireRadialAttack();
                } else {
                    this.fireTargetedAttack();
                }
                this.lastAttackTime = time;
                // 攻撃直後にもワープ
                this.warpBoss();
            }
        }

        // 「決着の刻」のボスAIはここに記述
        if (this.isFinalBattleActive) {
            // (最終決戦用の特別な攻撃パターンや動き)
        }

        // 各試練の達成条件チェック (例)
        if (this.activeTrial && !this.activeTrial.completed) {
           
        }
    }

   // CommonBossSceneのhitBossをオーバーライド (試練中のワープと、決着の刻の通常のヒット処理)
hitBoss(boss, ball) {
    if (!boss || !ball || !ball.body || !boss.active) return;

    if (this.isFinalBattleActive) {
        // 「決着の刻」は、CommonBossSceneの通常のヒット処理
        // (ダメージ計算、反射、インダラ解除など)
        console.log("[Boss4 hitBoss - FinalBattle] Standard boss hit.");
        super.hitBoss(boss, ball);
    } else {
        // 試練中は、ダメージは通らないがボールは反射させ、ボスはワープする。
        console.log("[Boss4 hitBoss - TrialPhase] Ball hit, reflecting and warping.");

        // ボール反射ロジック (CommonBossSceneのhitBossから持ってくるか、専用の簡易反射)
        // ここではCommonBossSceneの反射ロジックの一部を参考に簡易的に実装
        let speedMultiplier = 1.0;
        if (ball.getData('isFast') === true && BALL_SPEED_MODIFIERS && POWERUP_TYPES) {
            speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA] || 1.0;
        } else if (ball.getData('isSlow') === true && BALL_SPEED_MODIFIERS && POWERUP_TYPES) {
            speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA] || 1.0;
        }
        const targetSpeed = (NORMAL_BALL_SPEED || 380) * speedMultiplier;

        // ボス中心からボールへの角度で反射させるのが自然
        const reflectAngleRad = Phaser.Math.Angle.Between(boss.x, boss.y, ball.x, ball.y);
        const reflectAngleDeg = Phaser.Math.RadToDeg(reflectAngleRad) + 180; // 反対方向へ

        try {
            this.physics.velocityFromAngle(reflectAngleDeg, targetSpeed, ball.body.velocity);
        } catch (e) {
            console.error("[Boss4 hitBoss - TrialPhase] Error setting ball velocity for reflection:", e);
        }

        // (オプション) ボールヒット時のSE（効いていない感じの音）
        // try { if (AUDIO_KEYS.SE_LUCILIUS_INVULNERABLE_HIT) this.sound.play(AUDIO_KEYS.SE_LUCILIUS_INVULNERABLE_HIT); } catch(e){}


        // 試練達成判定 (ボールがボスに当たることが条件の試練)
        if (this.activeTrial && !this.activeTrial.completed) {
        let trialJustCompleted = false;
        // 試練II「原初の契約」
           if (this.activeTrial.id === 2 && boss === this.boss) { // ボス本体へのヒットか確認
            this.activeTrial.hitCount = (this.activeTrial.hitCount || 0) + 1;
            if (this.trialUiText) this.updateTrialProgressUI(this.activeTrial);
            if (this.activeTrial.hitCount >= this.activeTrial.requiredHits) {
                trialJustCompleted = true;
            }
        }
            // 試練V「星光の追撃」 (クビラ効果中かどうかの判定はプレイヤーのフラグか、ボールに付与されたデータで)
            if (this.activeTrial.id === 5 && this.isPlayerKubiraActive()) { // isPlayerKubiraActive() は仮のメソッド
                this.activeTrial.hitCountKubira = (this.activeTrial.hitCountKubira || 0) + 1;
                this.updateTrialProgressUI(this.activeTrial);
                if (this.activeTrial.hitCountKubira >= this.activeTrial.requiredHitsKubira) {
                    this.completeCurrentTrial();
                }
            }
            // 試練IX「時の超越」(速度変化フィールドで当てる)
            if (this.activeTrial.id === 9 && this.isTimeFieldActive()) { // isTimeFieldActive() は仮のメソッド
                this.activeTrial.hitCountTimeField = (this.activeTrial.hitCountTimeField || 0) + 1;
                this.updateTrialProgressUI(this.activeTrial);
                if (this.activeTrial.hitCountTimeField >= this.activeTrial.requiredHitsTimeField) {
                    this.completeCurrentTrial();
                }
            }
            // 試練X「連鎖する星々の輝き」(連続ヒット)
            if (this.activeTrial.id === 10) {
                this.activeTrial.consecutiveHits = (this.activeTrial.consecutiveHits || 0) + 1;
                // (ボールロストで consecutiveHits をリセットする処理が別途必要)
                this.updateTrialProgressUI(this.activeTrial);
                if (this.activeTrial.consecutiveHits >= this.activeTrial.requiredConsecutiveHits) {
                    this.completeCurrentTrial();
                }
            }
            
        }

         if (trialJustCompleted) {
            this.completeCurrentTrial();
        }
    }

    if (this.isFinalBattleActive) {
        super.hitBoss(boss, ball);
    } else {
        // ... (試練中の反射とワープ処理) ...
        if (boss === this.boss) this.warpBoss(); // ボス本体に当たった時だけワープ
    }
}
// isPlayerKubiraActive() や isTimeFieldActive() は、
// Boss4Scene のプロパティや状態に応じて true/false を返すヘルパーメソッドとして実装します。
// 例:
// isPlayerKubiraActive() {
//     return this.playerKubiraTimer && this.playerKubiraTimer.getProgress() < 1;
// }
// isTimeFieldActive() {
//     return this.timeFieldVisual && this.timeFieldVisual.active;
// }

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

    // ワープ処理の本体
    warpBoss() {
        if (!this.boss || !this.boss.active) return;
        // 画面上部のランダムなX座標にワープ (Yは固定)
        const targetX = Phaser.Math.Between(this.boss.displayWidth / 2, this.gameWidth - this.boss.displayWidth / 2);
        // (ワープエフェクトなど)
        this.boss.setX(targetX);
        console.log(`[BossAction] Lucilius warped to X: ${targetX.toFixed(0)}`);
    }

    // 放射攻撃 (仮実装)
    fireRadialAttack() { /* TODO: 放射状に弾を撃つ */ console.log("[BossAttack] Firing Radial Attack!");}
    // ターゲット攻撃 (仮実装)
    fireTargetedAttack() { /* TODO: パドル狙いの弾を撃つ */ console.log("[BossAttack] Firing Targeted Attack!");}
    // 混沌の欠片召喚 (仮実装)
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
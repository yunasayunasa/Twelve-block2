// Boss4Scene.js (ルシゼロ戦 - 骨子)
import CommonBossScene from './CommonBossScene.js';
import {
    // 必須に近いもの
    AUDIO_KEYS,
    POWERUP_TYPES,
    TOTAL_BOSSES, // ボス番号表示のため
    GAMEPLAY_START_DELAY,

    // あると便利なもの、使う可能性が高いもの
    NORMAL_BALL_SPEED,
    BALL_SPEED_MODIFIERS,
    DEFAULT_ATTACK_BRICK_VELOCITY_Y,
    CUTSCENE_DURATION, // VS表示などで使う可能性
    POWERUP_ICON_KEYS, // 試練UIでアイテムアイコン表示などするなら

    // 念のため (CommonBossSceneとの兼ね合いやデバッグで参照するかも)
    // PADDLE_HEIGHT,
    // MAX_PLAYER_LIVES,

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
        this.jiEndVideoKey = 'gameOverVideo_JiEnd'; // BootSceneでロードする動画キー

        // --- 試練関連 ---
        this.trialsData = []; // 各試練の情報（名前、条件、達成状況、ドロップアイテムなど）
        this.activeTrialIndex = -1; // 現在の試練のインデックス (-1は未開始または選択中)
        this.trialUiText = null; // 試練表示用テキストオブジェクト (UISceneに依頼も可)

        // --- 「調和と破壊」関連 ---
        this.currentRoute = null; // 'order', 'chaos', or null (選択前)
        this.harmonyCrystal = null;
        this.destructionCrystal = null;
        this.isChoiceEventActive = false;

        // --- ルシゼロ本体関連 ---
        this.isFinalBattleActive = false; // 「決着の刻」フラグ
        this.lastAttackTime = 0; // 攻撃間隔管理用
        this.lastWarpTime = 0;   // ワープ間隔管理用
    }

    init(data) {
        super.init(data);
        this.isJiEndTimerRunning = false;
        this.playedBellTimings = {};
        this.activeTrialIndex = -1; // 念のためリセット
        this.currentRoute = null;
        this.isChoiceEventActive = false;
        this.isFinalBattleActive = false;
        this.lastAttackTime = 0;
        this.lastWarpTime = 0;

        // タイマーやクリスタルオブジェクトが残っていれば破棄
        this.jiEndTimerText?.destroy(); this.jiEndTimerText = null;
        this.harmonyCrystal?.destroy(); this.harmonyCrystal = null;
        this.destructionCrystal?.destroy(); this.destructionCrystal = null;
        this.trialUiText?.destroy(); this.trialUiText = null;

        console.log("--- Boss4Scene INIT Complete ---");
    }

    initializeBossData() {
        console.log("--- Boss4Scene initializeBossData (Lucilius Zero) ---");
        this.bossData = {
            health: Infinity, // 試練中はHP無限
            finalBattleHp: 5,   // 「決着の刻」のHP
            textureKey: 'boss_lucilius_stand', // ★要アセット
            negativeKey: 'boss_lucilius_negative', // ★要アセット
            voiceAppear: AUDIO_KEYS.VOICE_LUCILIUS_APPEAR, // ★要定数・アセット
            voiceDamage: AUDIO_KEYS.VOICE_LUCILIUS_DAMAGE,
            voiceDefeat: AUDIO_KEYS.VOICE_LUCILIUS_DEFEAT,
            voiceRandom: [AUDIO_KEYS.VOICE_LUCILIUS_RANDOM_1],
            bgmKey: AUDIO_KEYS.BGM_LUCILIUS_PHASE1, // ★ルートやフェーズでBGM変えるなら複数用意
            cutsceneText: 'VS ルシファーゼロ', // 最初のカットシーン用 (もしあれば)
            widthRatio: 0.25, // 通常時の表示幅
            // ルシゼロは試練中は中央固定なので移動関連パラメータは最終決戦用
            moveRangeXRatioFinal: 0.7,
            moveDurationFinal: 3000,

            jiEndCountInitialMinutes: 5,
            jiEndTimerYPosRatio: 0.1, // タイマーのY位置 (画面高さ比)
            jiEndTimerFontSizeRatio: 1 / 15, // タイマーフォントサイズ (画面幅比)

            // 攻撃パターンパラメータ (秩序/混沌で変わる)
            attackIntervalOrder: { min: 1500, max: 2500 }, // 秩序ルートの攻撃間隔
            attackIntervalChaos: { min: 4000, max: 6000 }, // 混沌ルートの攻撃間隔
            // (弾速、弾数などもルート別に設定可能)
            warpInterval: 5000, // 通常時のワープ間隔の目安

            // 試練データ配列
            trials: this.defineTrials(), // 別メソッドで試練内容を定義

            // 試練達成時の報酬アイテム
            trialRewardItem: POWERUP_TYPES.BIKARA_YANG,
        };

        this.bossVoiceKeys = Array.isArray(this.bossData.voiceRandom) ? this.bossData.voiceRandom : [];
        this.trialsData = this.bossData.trials; // trialsDataプロパティに格納
        console.log("Lucilius Zero Specific Data Initialized.");
    }

    // 試練内容を定義するヘルパーメソッド
    defineTrials() {
        return [
            { id: 1, name: "調和と破壊の選択", conditionText: "調和か混沌、どちらかを選べ", targetItem: null, completed: false, isChoiceEvent: true },
            { id: 2, name: "原初の契約", conditionText: "ルシファー本体にボールを5回当てる。(0/5)", targetItem: POWERUP_TYPES.ANCHIRA, completed: false, hitCount: 0, requiredHits: 5 },
            { id: 3, name: "混沌の残滓を掃討せよ", conditionText: "混沌の欠片を全て破壊せよ。(0/5)", targetItemRandom: [POWERUP_TYPES.MAKIRA, POWERUP_TYPES.BAISRAVA], completed: false, objectsToDestroy: 5, destroyedCount: 0, /* ...欠片生成ロジックなど... */ },
            { id: 4, name: "天穿つ最終奥義", conditionText: "ヴァジラ奥義を1回発動せよ。", targetItem: POWERUP_TYPES.VAJRA, completed: false, ougiUsed: false },
            { id: 5, name: "星光の追撃", conditionText: "クビラ効果中に本体にボールを3回当てる。(0/3)", targetItem: POWERUP_TYPES.KUBIRA, completed: false, hitCountKubira: 0, requiredHitsKubira: 3 },
            { id: 6, name: "楽園追放 ～神罰の洗礼～", conditionText: "全画面攻撃「パラダイス・ロスト」を受けよ。", targetItem: null, anilaDropLocation: null, completed: false, paradiseLostTriggered: false }, // anilaDropLocation はドロップ時に設定
            { id: 7, name: "三宝の導き", conditionText: "指定の三種の神器を集めよ。(0/3)", targetItemsToCollect: [POWERUP_TYPES.BIKARA_YANG, POWERUP_TYPES.BADRA, POWERUP_TYPES.MAKORA], collectedItems: [], targetItem: null, completed: false }, // targetItemは進行中に設定
            { id: 8, name: "深淵より来る核を狙え", conditionText: "「アビス・コア」にボールを1回当てよ。", targetItem: POWERUP_TYPES.SINDARA, completed: false, coreHit: false, /* ...コア出現ロジック... */ },
            { id: 9, name: "時の超越、歪む流れの中で", conditionText: "速度変化フィールド内で本体にボールを3回当てる。(0/3)", targetItemAlternate: [POWERUP_TYPES.HAILA, POWERUP_TYPES.SHATORA], completed: false, hitCountTimeField: 0, requiredHitsTimeField: 3, /* ...フィールド展開ロジック... */ },
            { id: 10, name: "連鎖する星々の輝き", conditionText: "本体にボールを連続3回当てる。(0/3)", targetItem: POWERUP_TYPES.INDARA, completed: false, consecutiveHits: 0, requiredConsecutiveHits: 3 },
            { id: 11, name: "虚無の壁を打ち破れ", conditionText: "虚無の壁の奥の本体にボールを1回当てよ。", targetItem: POWERUP_TYPES.BIKARA_YIN, completed: false, wallBreachedAndHit: false, /* ...壁生成ロジック... */ },
            { id: 12, name: "終焉の刻 ～決着を付ける～", conditionText: "ルシファーを撃破せよ！", targetItem: null, completed: false, isFinalBattle: true }
        ];
    }


    createSpecificBoss() {
        super.createSpecificBoss(); // this.boss 生成
        if (this.boss) {
            this.boss.setPosition(this.gameWidth / 2, this.gameHeight * 0.2); // 仮：画面上部中央に固定
            this.boss.setImmovable(true); // 最初は動かない
            if(this.boss.body) this.boss.body.moves = false;

            // UIへの初期HP反映 (試練中は無限なので特殊表示の可能性も)
            this.events.emit('updateBossHp', '∞', '∞'); // または '????'
            this.events.emit('updateBossNumber', this.currentBossIndex, TOTAL_BOSSES); // TOTAL_BOSSESをimport
        }
        console.log("--- Boss4Scene createSpecificBoss Complete ---");
    }

    // CommonBossSceneのcreateから呼ばれる登場演出
    startIntroCutscene() {
        console.log("[Boss4Scene] Starting Lucilius Zero intro sequence...");
        // (専用の登場カットシーンがあればここに実装)
        // 今回はシンプルに、すぐにジエンドタイマーと試練開始へ
        this.playerControlEnabled = false;
        this.isBallLaunched = false;
        this.sound.stopAll(); // 念のため
        this.stopBgm();       // 同上

        // ボスはcreateSpecificBossで配置済みなので、ここでは何もしないか、短い登場エフェクト
        this.time.delayedCall(500, () => { // 少し間を置いて
            this.setupJiEndTimer(); // ジエンドタイマー表示開始 (初期演出含む)
            this.setupTrialUI();    // 試練UI表示の初期化
            this.startNextTrial();  // 最初の試練（調和と破壊）を開始
        }, [], this);
    }

    // ジエンドタイマーのセットアップと初期演出
    setupJiEndTimer() {
        if (this.jiEndTimerText) this.jiEndTimerText.destroy();
        const initialTime = (this.bossData.jiEndCountInitialMinutes || 5) * 60 * 1000;
        this.jiEndTimeRemaining = initialTime;

        const timerFontSize = Math.floor(this.gameWidth * (this.bossData.jiEndTimerFontSizeRatio || 1/15));
        const timerTextStyle = { fontSize: `${timerFontSize}px`, fill: '#ffffff', fontFamily: 'sans-serif', align: 'center', stroke: '#000000', strokeThickness: Math.max(2, timerFontSize * 0.05) };

        this.jiEndTimerText = this.add.text(
            this.gameWidth / 2, this.gameHeight * (this.bossData.jiEndTimerYPosRatio || 0.1),
            this.formatTime(this.jiEndTimeRemaining), timerTextStyle
        ).setOrigin(0.5, 0.5).setDepth(-5); // ★背景とボスの間 (背景-10, ボス0と仮定)

        const initialFxDuration = 3000;
        const originalDepth = this.jiEndTimerText.depth;
        const originalScale = this.jiEndTimerText.scale;
        this.jiEndTimerText.setDepth(9998).setScale(originalScale * 1.2);
        this.tweens.add({ targets: this.jiEndTimerText, scale: originalScale * 1.3, alpha: 0.7, duration: 300, yoyo: true, repeat: Math.floor(initialFxDuration / 600) - 1, onStart: () => this.playBellSound() });
        this.time.delayedCall(initialFxDuration, () => {
            if (this.jiEndTimerText?.active) {
                this.jiEndTimerText.setDepth(originalDepth).setScale(originalScale).setAlpha(1);
            }
        }, [], this);
        this.isJiEndTimerRunning = true;
        console.log("[JiEndTimer] Setup complete.");
    }

    // 試練UIの初期セットアップ
    setupTrialUI() {
        if (this.trialUiText) this.trialUiText.destroy();
        // UISceneに依頼するか、Boss4Sceneで直接描画するか
        // ここではBoss4Sceneで直接描画する例 (UISceneと連携する方が望ましい場合もある)
        const trialFontSize = Math.floor(this.gameWidth / 20);
        const trialTextStyle = { fontSize: `${trialFontSize}px`, fill: '#ffffff', fontFamily: 'sans-serif', align: 'center', lineSpacing: trialFontSize * 0.2, stroke: '#000000', strokeThickness: Math.max(1, trialFontSize*0.03)};
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
        } else if (currentTrial.isFinalBattle) {
            this.startFinalBattle();
        } else {
            // 通常の試練開始時の処理 (専用オブジェクトの召喚など)
            this.setupCurrentTrialEnvironment(currentTrial);
            // 戦闘開始 (プレイヤー操作有効化など) - finalizeBossAppearanceAndStart から呼ばれる startGameplay で行う
            if (!this.playerControlEnabled && this.activeTrialIndex > 0) { // 最初の選択イベント後から操作可能に
                 this.time.delayedCall(500, () => { // 少し間をおいて
                    if (!this.isGameOver && !this.bossDefeated) {
                        this.playerControlEnabled = true;
                        this.isBallLaunched = false; // ボールは再発射待ち
                        if (!this.currentBgm || !this.currentBgm.isPlaying) this.playBossBgm(); // BGMもここで
                        console.log("[TrialLogic] Player control enabled for current trial.");
                    }
                }, [], this);
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
    startHarmonyAndDestructionChoice() {
        this.isChoiceEventActive = true;
        this.playerControlEnabled = false; // 選択中は操作させないか、ボールは打てるようにするか
        console.log("[ChoiceEvent] Presenting Harmony/Destruction choice.");

        // TODO: 画面に秩序と混沌のクリスタルを表示
        // this.harmonyCrystal = this.add.sprite(...).setInteractive();
        // this.destructionCrystal = this.add.sprite(...).setInteractive();
        // クリスタル破壊のコールバックで this.currentRoute を設定し、
        // this.isChoiceEventActive = false; this.startNextTrial(); を呼ぶ
        // (この骨子ではダミーで一定時間後に進む)
        this.time.delayedCall(1000, () => {
            // ダミーで混沌ルートを選択
            this.currentRoute = 'chaos'; // or 'order'
            console.log(`[ChoiceEvent] Player (dummy) chose: ${this.currentRoute}`);
            this.isChoiceEventActive = false;
            this.startNextTrial(); // 次の試練へ
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


    // ボス本体の移動は試練中はなし、最終決戦でのみ
    startSpecificBossMovement() {
        if (this.isFinalBattleActive) {
            console.log("[FinalBattle] Lucilius Zero starts moving!");
            // CommonBossSceneの汎用移動を呼び出すか、専用の動きを実装
            // super.startSpecificBossMovement(); // 例: Commonの左右移動
            // ここでは仮に何もしない (専用の動きをupdateSpecificBossBehaviorで書く想定)
        } else {
            console.log("[TrialPhase] Lucilius Zero remains stationary.");
            // ボスは動かないので、既存の移動Tweenがあれば停止
            if (this.bossMoveTween) {
                this.tweens.killTweensOf(this.boss);
                this.bossMoveTween = null;
            }
            if (this.boss && this.boss.body) { // 念のため速度を0に
                this.boss.setVelocity(0,0);
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

    hitBoss(boss, ball) {
    super.hitBoss(boss, ball); // まず親クラスの通常のボスヒット処理を実行

    if (this.activeTrial && !this.activeTrial.completed && this.activeTrial.id === 2) { // 試練IIか？
        this.activeTrial.hitCount = (this.activeTrial.hitCount || 0) + 1;
        this.updateTrialProgressUI(this.activeTrial); // UI更新 (例: "3/5")
        if (this.activeTrial.hitCount >= this.activeTrial.requiredHits) {
            this.completeCurrentTrial();
        }
    }
    // 他にも「ボスにボールが当たること」が条件の試練があれば、ここで判定を追加
    // 例: 試練V「星光の追撃」（クビラ効果中にヒット）
    if (this.activeTrial && !this.activeTrial.completed && this.activeTrial.id === 5) {
        if (ball.getData('isKubiraActive')) { // クビラはボールダメージアップなので、ボールにフラグがない想定。プレイヤーのクビラ状態を見る必要がある
             // or this.isPlayerKubiraActive のようなフラグで判断
            // ここでは仮に、ボールがクビラ状態を持つ（CommonBossSceneでそのように設定している）とする
            this.activeTrial.hitCountKubira = (this.activeTrial.hitCountKubira || 0) + 1;
            this.updateTrialProgressUI(this.activeTrial);
            if (this.activeTrial.hitCountKubira >= this.activeTrial.requiredHitsKubira) {
                this.completeCurrentTrial();
            }
        }
    }
    // ワープ処理 (ボールヒット時)
    if (!this.isFinalBattleActive) {
        this.warpBoss();
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
    updateTrialProgressUI(trial) { /* TODO: UIの達成状況を更新 */ }


    // --- ジエンドタイマー関連メソッド (前回のものを流用) ---
    formatTime(milliseconds) { /* ... */ return `ジ・エンドまで 残り ${String(Math.floor(milliseconds/60000)).padStart(2,'0')}:${String(Math.floor((milliseconds%60000)/1000)).padStart(2,'0')}:${String(Math.floor((milliseconds%1000)/10)).padStart(2,'0')}`; }
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
// Boss4Scene.js (ルシゼロ戦 - 骨子)
import CommonBossScene from './CommonBossScene.js';
import {
    AUDIO_KEYS, POWERUP_TYPES, NORMAL_BALL_SPEED, BALL_SPEED_MODIFIERS,
    PADDLE_HEIGHT, // 必要に応じて追加していく
    // ...その他、Boss4Sceneで直接参照するconstants.jsの定数
} from './constants.js';

// --- ルシゼロ戦固有の定数 (必要であれば) ---
const JIHEND_COUNT_INITIAL_MINUTES = 5;
const TRIAL_COUNT = 11; // 「決着の刻」を除く試練の数

export default class Boss4Scene extends CommonBossScene {
    constructor() {
        super('Boss4Scene');

        // --- ジエンドカウント関連 ---
        this.jihendTimer = null; // Phaser.Time.TimerEvent
        this.jihendRemainingMs = JIHEND_COUNT_INITIAL_MINUTES * 60 * 1000;
        this.jihendTimerText = null; // this.add.text で生成するタイマー表示用

        // --- 試練進行関連 ---
        this.trialsData = []; // 各試練の設定と状態を格納する配列
        this.currentTrialIndex = -1; // 現在進行中の試練のインデックス (-1:未開始, 0:調和と破壊, 1-10:試練II-XI, 11:決着の刻)
        this.activeTrialObject = null; // 現在の試練のデータオブジェクト
        this.trialUiText = null;    // this.add.text または UIScene連携で試練内容表示

        // --- 「調和と破壊」関連 ---
        this.harmonyDestructionChoice = null; // 'harmony' (秩序), 'destruction' (混沌), or null (未選択)
        this.orderCrystal = null;
        this.chaosCrystal = null;

        // --- ルシファー本体関連 ---
        this.isFinalBattle = false; // 「決着の刻」かどうかのフラグ
        // (ルシファーの攻撃パターン管理用タイマーなどは initializeBossData や startSpecificBossMovement で)
        this.radiateAttackTimer = null;
        this.lockOnAttackTimer = null;

        // --- その他 ---
    }

    init(data) {
        super.init(data);
        this.jihendRemainingMs = (this.bossData?.jihendInitialMinutes || JIHEND_COUNT_INITIAL_MINUTES) * 60 * 1000; // bossDataから取得できるように
        this.currentTrialIndex = -1;
        this.activeTrialObject = null;
        this.harmonyDestructionChoice = null;
        this.isFinalBattle = false;

        // タイマー類クリア
        this.jihendTimer?.remove(); this.jihendTimer = null;
        this.radiateAttackTimer?.remove(); this.radiateAttackTimer = null;
        this.lockOnAttackTimer?.remove(); this.lockOnAttackTimer = null;
        this.orderCrystal?.destroy(); this.orderCrystal = null;
        this.chaosCrystal?.destroy(); this.chaosCrystal = null;

        console.log("--- Boss4Scene INIT Complete ---");
    }

    initializeBossData() {
        console.log("--- Boss4Scene initializeBossData (Lucilius Zero) ---");
        this.bossData = {
            health: 5, // 「決着の刻」でのHP
            textureKey: 'boss_lucilius_zero_stand', // ★要アセット
            negativeKey: 'boss_lucilius_zero_negative', // ★要アセット
            // ... (ボイス、BGM、移動、基本攻撃のパラメータなど) ...
            jihendInitialMinutes: 5,
            ワープタイミング: { onHit: true, afterAttack: true }, // ワープ条件

            // 試練ごとの設定とドロップアイテム
            trialsDefinition: [
                { name: "調和と破壊の選択", conditionText: "調和か混沌、どちらかを選べ", targetItem: null, duration: 0 /* 他の試練とは性質が異なる */ },
                { name: "原初の契約", conditionText: "ルシファー本体にボールを5回当てる。", targetItem: POWERUP_TYPES.ANCHIRA, targetHits: 5, currentHits: 0 },
                { name: "混沌の残滓を掃討せよ", conditionText: "召喚された5つの「混沌の欠片」を全て破壊する。", targetItems: [POWERUP_TYPES.BAISRAVA, POWERUP_TYPES.MAKIRA], targetCount: 5, currentCount: 0, summonedObjects: [] },
                { name: "天穿つ最終奥義", conditionText: "ヴァジラ奥義を1回発動する。", targetItem: POWERUP_TYPES.VAJRA, targetActivations: 1, currentActivations: 0 },
                { name: "星光の追撃", conditionText: "クビラ効果中に本体にボールを3回当てる。", targetItem: POWERUP_TYPES.KUBIRA, targetHitsInState: 3, currentHitsInState: 0 },
                { name: "楽園追放 ～神罰の洗礼～", conditionText: "全画面攻撃「パラダイス・ロスト」を受けろ。", targetItem: POWERUP_TYPES.ANILA /*ドロップ方法特殊*/, needsToBeHitBySpecial: true, hasBeenHit: false },
                { name: "三宝の導き", conditionText: "指定のアイテム3種（ビカラ陽、バドラ、マコラ）を全て集めろ。", targetItemPool: [POWERUP_TYPES.BIKARA_YANG, POWERUP_TYPES.BADRA, POWERUP_TYPES.MAKORA], collectedItems: new Set(), currentTargetItemIndex: 0},
                { name: "深淵より来る核を狙え", conditionText: "ルシファー上部の「アビス・コア」にボールを1回当てる。", targetItem: POWERUP_TYPES.SINDARA, targetCoreHits: 1, currentCoreHits: 0, coreObject: null },
                { name: "時の超越、歪む流れの中で", conditionText: "速度変化フィールド内で本体にボールを3回当てる。", targetItems: [POWERUP_TYPES.HAILA, POWERUP_TYPES.SHATORA], targetHitsInField: 3, currentHitsInField: 0, isFieldActive: false },
                { name: "連鎖する星々の輝き", conditionText: "本体にボールを連続3回当てる。", targetItem: POWERUP_TYPES.INDARA, targetConsecutiveHits: 3, currentConsecutiveHits: 0 },
                { name: "虚無の壁を打ち破れ", conditionText: "「虚無の壁」の奥の本体にボールを1回当てる。", targetItem: POWERUP_TYPES.BIKARA_YIN, wallBlocks: [], targetHitsAfterWall: 1, currentHitsAfterWall: 0 },
                { name: "終焉の刻 ～決着を付ける～", conditionText: "ルシファーを撃破せよ！", targetItem: null /*特別ドロップ*/ }
            ],
            // ルートによる攻撃頻度調整値など
            orderRouteAttackMultiplier: 0.75, // 例: 攻撃間隔が75%に（激化）
            chaosRouteAttackMultiplier: 1.5,  // 例: 攻撃間隔が150%に（激減）
        };
        // trialsData に bossData.trialsDefinition をコピーして、実行時の状態を持たせる
        this.trialsData = JSON.parse(JSON.stringify(this.bossData.trialsDefinition)); // ディープコピー

        this.bossVoiceKeys = []; // ルシゼロ専用ボイス設定
        console.log("Lucilius Zero Specific Data Initialized.");
    }

    create() {
        super.create(); // CommonBossSceneのcreateを呼ぶ（UIや基本オブジェクト生成）
                        // この中で createSpecificBoss, startIntroCutscene が呼ばれる

        // --- ジエンドタイマーUI生成 ---
        const timerStyle = { fontSize: `${this.calculateDynamicFontSize(40)}px`, fill: '#FFFFFF', fontFamily: 'Arial, sans-serif', stroke: '#000000', strokeThickness: 4 };
        this.jihendTimerText = this.add.text(this.gameWidth / 2, 50, 'ジ・エンドまで 残り --:--:--', timerStyle)
            .setOrigin(0.5, 0.5)
            .setDepth(-5); // ボスより奥、背景より手前 (要調整)
        // (横いっぱいにするには、テキスト幅を監視してスケール調整するか、複数のテキストオブジェクトを使うなど工夫が必要)

        // --- 試練UI生成 ---
        const trialUiStyle = { fontSize: `${this.calculateDynamicFontSize(28)}px`, fill: '#FFFFFF', align: 'center', stroke: '#000000', strokeThickness: 3};
        this.trialUiText = this.add.text(this.gameWidth / 2, this.boss.y + this.boss.displayHeight / 2 + 60, "試練待機中...", trialUiStyle) // ボスHPバーの下あたりを想定
            .setOrigin(0.5, 0)
            .setDepth(1000); // UIなので手前 (UISceneと被らないように)
            // もしUISceneで一括管理するならイベント発行方式

        console.log("--- Boss4Scene CREATE Complete ---");
    }

    // createSpecificBoss: ルシゼロの初期位置などを設定
    createSpecificBoss() {
        super.createSpecificBoss();
        if (this.boss) {
            this.boss.setPosition(this.gameWidth / 2, this.gameHeight * 0.2); // 例: 画面上部中央
            this.boss.setImmovable(true); // 基本的に動かない
            if(this.boss.body) this.boss.body.moves = false;
            // updateBossSizeでスケール調整
            this.updateBossSize(this.boss, this.bossData.textureKey, this.bossData.widthRatio || 0.25);
        }
    }

    // startIntroCutscene: ルシゼロ専用の登場演出、その後 setupFirstTrial を呼ぶ
    startIntroCutscene() {
        // (CommonBossSceneのものをベースに、ルシゼロ専用の演出を追加・変更)
        // super.startIntroCutscene(); // もしCommonのカットインを流用しつつ何かしたい場合
        console.log("[Boss4Scene] Starting Lucilius Zero's intro sequence...");
        // ... (専用演出) ...
        // 演出完了後:
        // this.finalizeBossAppearanceAndStart(); // これの中でstartGameplayが呼ばれる
        // startGameplay の中で戦闘BGM再生とジエンドタイマー開始、最初の試練設定を行う
        // finalizeBossAppearanceAndStart は Common のものをそのまま使うと仮定
        super.finalizeBossAppearanceAndStart(); // これを呼ぶと、最終的に super.startGameplay() が呼ばれる
    }

    // startGameplay: CommonBossSceneから呼ばれる。ここで戦闘BGM、ジエンドタイマー、最初の試練を開始。
    startGameplay() {
        super.startGameplay(); // BGM再生、プレイヤー操作有効化など
        console.log("[Boss4Scene] Lucilius Zero gameplay started.");

        this.startJihendTimer();
        this.setupNextTrial(); // 最初の試練（調和と破壊）を開始
    }

    // --- ▼ ジエンドカウント関連 ▼ ---
    startJihendTimer() {
        this.updateJihendTimerDisplay();
        if (this.jihendTimer) this.jihendTimer.remove();
        this.jihendTimer = this.time.addEvent({
            delay: 10, // 10ミリ秒ごとに更新 (表示のため)
            callback: this.updateJihendCount,
            callbackScope: this,
            loop: true
        });
        console.log("Jihend Timer Started.");
    }

    updateJihendCount() {
        if (this.isGameOver || this.bossDefeated) {
            this.jihendTimer?.remove();
            return;
        }

        let speedMultiplier = 1.0;
        if (this.harmonyDestructionChoice === 'harmony') { // 秩序選択
            speedMultiplier = this.bossData.orderRouteJihendMultiplier || 0.75; // 速度75% (遅くなる)
        } else if (this.harmonyDestructionChoice === 'destruction') { // 混沌選択
            speedMultiplier = this.bossData.chaosRouteJihendMultiplier || 1.25; // 速度125% (早くなる)
        }

        this.jihendRemainingMs -= 10 * speedMultiplier; // 10ms経過 (delayに合わせる)

        if (this.jihendRemainingMs <= 0) {
            this.jihendRemainingMs = 0;
            this.updateJihendTimerDisplay();
            this.triggerJihend(); // ジ・エンド発動
            this.jihendTimer?.remove();
        } else {
            this.updateJihendTimerDisplay();
        }
    }

    updateJihendTimerDisplay() {
        if (!this.jihendTimerText || !this.jihendTimerText.active) return;
        const totalSeconds = Math.floor(this.jihendRemainingMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((this.jihendRemainingMs % 1000) / 10); // 下2桁ミリ秒

        this.jihendTimerText.setText(`ジ・エンドまで 残り ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`);
    }

    triggerJihend() {
        console.log("!!! JIHEND TRIGGERED !!!");
        // TODO: 強制ゲームオーバー演出
        this.gameOver("ジ・エンド"); // CommonBossSceneのgameOverをメッセージ付きで呼ぶなど
    }
    // --- ▲ ジエンドカウント関連 ▲ ---


    // --- ▼ 試練システム関連 ▼ ---
    setupNextTrial() {
        this.currentTrialIndex++;
        if (this.currentTrialIndex < this.trialsData.length) {
            this.activeTrialObject = this.trialsData[this.currentTrialIndex];
            console.log(`[Trial System] Starting Trial ${this.currentTrialIndex + 1}: ${this.activeTrialObject.name}`);
            this.updateTrialDisplay();
            this.initializeCurrentTrial(); // 各試練の初期化処理
        } else {
            console.log("[Trial System] All trials should be complete or final battle started.");
            // ここに来る場合は「決着の刻」の条件を満たしたか、何かおかしい
            if (!this.isFinalBattle) { // まだ決着の刻が始まっていないなら
                this.startFinalBattle();
            }
        }
    }

    updateTrialDisplay() {
        if (!this.trialUiText || !this.trialUiText.active || !this.activeTrialObject) {
            if (this.trialUiText) this.trialUiText.setText(""); // 何も表示しない
            return;
        }
        const trial = this.activeTrialObject;
        let displayText = `十二の試練：${trial.name}\n${trial.conditionText}`;
        // TODO: ここに各試練の達成状況（例: (3/5)）を追加するロジック
        // (これは各試練の達成判定時に更新するのが良い)
        this.trialUiText.setText(displayText);
    }

    initializeCurrentTrial() {
        // 現在の試練に応じた初期設定（例：オブジェクト召喚、フラグクリアなど）
        // 例：試練III「混沌の残滓」なら、ここで混沌の欠片を召喚
        // 例：試練VI「楽園追放」なら、ここでルシファーの特殊行動を開始させる
        // 例：試練XI「虚無の壁」なら、ここで壁ブロックを生成
        console.log(`[Trial System] Initializing specific logic for trial: ${this.activeTrialObject?.name}`);
        // TODO: 各試練の初期化ロジックを実装
        if (this.activeTrialObject?.name === "調和と破壊の選択") {
            this.presentHarmonyDestructionChoice();
        }
    }

    completeCurrentTrial() {
        if (!this.activeTrialObject || this.isFinalBattle) return;
        console.log(`[Trial System] Trial COMPLETED: ${this.activeTrialObject.name}`);
        // 試練達成報酬：ビカラ陽ドロップ
        if (this.activeTrialObject.name !== "調和と破壊の選択" && this.activeTrialObject.name !== "終焉の刻 ～決着を付ける～") { //報酬がない試練もある
            this.dropSpecificPowerUp(this.boss.x, this.boss.y, POWERUP_TYPES.BIKARA_YANG);
        }
        // (試練達成のSEやエフェクト)
        this.setupNextTrial(); // 次の試練へ
    }

    presentHarmonyDestructionChoice() {
        // TODO: 画面に秩序と混沌のクリスタルを生成・表示
        // それぞれに当たり判定を設定し、破壊されたら this.harmonyDestructionChoice に結果をセットし、
        // completeCurrentTrial() を呼んで次の試練に進む
        console.log("[Trial System] Presenting Harmony/Destruction choice to player.");
    }

    startFinalBattle() {
        console.log("[Trial System] All trials done! Starting FINAL BATTLE (決着の刻)!");
        this.isFinalBattle = true;
        this.activeTrialObject = this.trialsData.find(t => t.name.includes("終焉の刻")); // 最終試練オブジェクトを取得
        this.updateTrialDisplay();
        // ボスにHPを設定し、攻撃パターンを変更、移動を開始させる
        if (this.boss) {
            this.boss.setData('health', this.bossData.health); // 有限HPに
            this.boss.setData('maxHealth', this.bossData.health);
            this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth'));
            // this.boss.setImmovable(false); // 動けるように (Commonの移動TWEENを使うなら不要かも)
            // if(this.boss.body) this.boss.body.moves = true;
            this.startSpecificBossMovementForFinalBattle(); // 最終決戦用の動きを開始
        }
    }
    // --- ▲ 試練システム関連 ▲ ---


    // --- ▼ ボスAI・攻撃パターン ▼ ---
    // startSpecificBossMovement: 試練中は中央固定、決着の刻で動き出す
    startSpecificBossMovement() {
        console.log(`--- Boss4Scene startSpecificBossMovement (FinalBattle: ${this.isFinalBattle}) ---`);
        if (!this.boss || !this.boss.active) return;

        if (this.isFinalBattle) {
            // 最終決戦時の動き (CommonBossSceneの左右移動TWEENなどを呼び出す)
            console.log("[Final Battle] Boss starts moving!");
            super.startSpecificBossMovement(); // 親の移動ロジックを借用
            // または、専用の激しい移動パターンをここで開始
        } else {
            // 試練中は基本的に中央上部で静止 (ワープはある)
            console.log("[Trial Phase] Boss remains stationary (except for warps).");
            this.boss.setPosition(this.gameWidth / 2, this.gameHeight * 0.2); // 位置再固定
            // ボスが攻撃を行うタイマーはここで開始（または updateSpecificBossBehavior で管理）
            this.scheduleNextBossAttacks();
        }
    }
    startSpecificBossMovementForFinalBattle(){ // isFinalBattle=true の時に呼ばれる
        console.log("[Boss4Scene] Starting final battle movement for Lucilius Zero.");
        super.startSpecificBossMovement(); // Commonの左右移動など
    }


    scheduleNextBossAttacks() {
        // 秩序/混沌ルートに応じて攻撃頻度を変える
        let attackIntervalMultiplier = 1.0;
        if (this.harmonyDestructionChoice === 'harmony') {
            attackIntervalMultiplier = this.bossData.orderRouteAttackMultiplier || 0.75;
        } else if (this.harmonyDestructionChoice === 'destruction') {
            attackIntervalMultiplier = this.bossData.chaosRouteAttackMultiplier || 1.5;
        }
        // TODO: この倍率を使って、放射攻撃とターゲット攻撃のタイマーを設定する
        // (キングスライムの scheduleNextRadialAttackなどを参考にする)
        console.log(`[Boss AI] Scheduling attacks with multiplier: ${attackIntervalMultiplier}`);
    }
    // (放射攻撃、ターゲット攻撃のspawnメソッドはキングスライムのものを参考に実装)
    // (パラダイス・ロストなどの特殊攻撃メソッドもここに追加)
    // --- ▲ ボスAI・攻撃パターン ▲ ---


    // --- ▼ アイテムドロップ制御 (CommonBossSceneのフックを利用) ▼ ---
    getOverrideDropItem(brick) {
        if (this.isFinalBattle) { // 決着の刻
            // 全アイテムランダムドロップ (100%)
            const allItems = Object.values(POWERUP_TYPES);
            return Phaser.Utils.Array.GetRandom(allItems);
        }

        if (this.activeTrialObject && this.activeTrialObject.targetItem) {
            // 試練に対応する固定アイテム
            return this.activeTrialObject.targetItem;
        }
        if (this.activeTrialObject && this.activeTrialObject.targetItems && this.activeTrialObject.targetItems.length > 0) {
            // 試練III（混沌の残滓）や試練IX（時の超越）のように複数候補からランダム
            return Phaser.Utils.Array.GetRandom(this.activeTrialObject.targetItems);
        }
        if (this.activeTrialObject && this.activeTrialObject.name === "三宝の導き") {
            // 三宝の輝きの現在のターゲットアイテムを返す
            if(this.activeTrialObject.collectedItems && this.activeTrialObject.targetItemPool) {
                const currentTarget = this.activeTrialObject.targetItemPool[this.activeTrialObject.collectedItems.size];
                return currentTarget || null; // まだ集めるべきアイテムがあればそれを返す
            }
        }
        return null; // それ以外はCommonBossSceneの通常ドロップ
    }
    // --- ▲ アイテムドロップ制御 ▲ ---


    // --- ▼ ボールとボスのOverlap処理 (スタック対策) ▼ ---
    // (handleBallOverlapBossEject は CommonBossScene にあるので、ここでは何もしないか、
    //  もしBoss4Sceneで特別な処理が必要ならオーバーライド)
    // --- ▲ ボールとボスのOverlap処理 ▲ ---


    // --- ▼ ボスHPが0になった際の処理 (決着の刻のみ) ▼ ---
    handleZeroHealth(bossInstance) {
        if (this.isFinalBattle && bossInstance === this.boss) {
            console.log("[Boss4Scene] Lucilius Zero (Final Battle) HP reached zero! Victory!");
            this.bossDefeated = true; // Commonの撃破フラグを立てる
            super.defeatBoss(bossInstance); // Commonの撃破演出へ
        } else {
            // 試練中はHP無限なので、ここには来ないはずだが、念のため
            console.warn("[Boss4Scene] handleZeroHealth called unexpectedly during trials phase.");
        }
    }
    // --- ▲ ボスHPが0になった際の処理 ▲ ---

    shutdownScene() {
        super.shutdownScene();
        this.jihendTimer?.remove();
        this.jihendTimerText?.destroy();
        this.trialUiText?.destroy();
        this.orderCrystal?.destroy();
        this.chaosCrystal?.destroy();
        // 他のタイマーやオブジェクトもクリア
        console.log("--- Boss4Scene SHUTDOWN Complete ---");
    }
}
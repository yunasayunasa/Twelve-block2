// Boss3Scene.js (キングゴールドスライム戦 - 骨子)
import CommonBossScene from './CommonBossScene.js';
import {
     POWERUP_TYPES, // ★POWERUP_TYPES をインポート (BALL_SPEED_MODIFIERS で使うため)
    NORMAL_BALL_SPEED, // ★NORMAL_BALL_SPEED をインポート
    BALL_SPEED_MODIFIERS, // ★BALL_SPEED_MODIFIERS をインポート
    AUDIO_KEYS,
    // ★★★ ここから追加する可能性のある定数 ★★★
    PADDLE_HEIGHT,              // ボス下降の目標Y座標計算で使用
    PADDLE_Y_OFFSET_RATIO,      // (もしパドル位置を再計算するような場面があれば)
    BALL_RADIUS_RATIO,          // (もしボール関連の計算をここでするなら)
    POWERUP_ICON_KEYS,        // (もし特定のパワーアップアイコンを直接参照するなら)
    MAX_PLAYER_LIVES,           // (もしライフ上限を参照するなら)
    DEFAULT_BOSS_MAX_HEALTH,    // (もしデフォルトボスHPを参照するなら)
    // ボス戦共通の演出時間なども必要に応じて追加
    DEFEAT_FLASH_DURATION,
    DEFEAT_FLASH_INTERVAL,
    DEFEAT_FLASH_COUNT,
    DEFEAT_SHAKE_DURATION,
    DEFEAT_FADE_DURATION,
    // ★★★ ここまで ★★★
    DEFAULT_ATTACK_BRICK_VELOCITY_Y, // 通常攻撃弾のデフォルト速度などに使う可能性
    CUTSCENE_DURATION, // VSオーバーレイ表示時間などに使用
    GAMEPLAY_START_DELAY // 戦闘開始までのディレイ
} from './constants.js';

export default class Boss3Scene extends CommonBossScene {
    constructor() {
        super('Boss3Scene');

        // キングゴールドスライム固有のプロパティを初期化
        this.isHpBelowHalf = false;
        this.wallBlockSpawnTimers = { lineA: null, lineB: null };
        this.slimeBeamChargeTimer = null;
        this.slimeBeamActive = false;
        this.slimeBeamObject = null; // スライムビームの予兆・本体オブジェクト用
        this.radialAttackTimer = null;
        this.targetedAttackTimer = null;

        // ボス登場演出用フラグなど (必要に応じて)
        this.isIntroAnimating = false;
    }

    init(data) {
        super.init(data);
        this.isHpBelowHalf = false;
        this.isIntroAnimating = false; // 登場演出中フラグもリセット

        // 各種タイマーのリセット
        this.wallBlockSpawnTimers.lineA?.remove(); this.wallBlockSpawnTimers.lineA = null;
        this.wallBlockSpawnTimers.lineB?.remove(); this.wallBlockSpawnTimers.lineB = null;
        this.slimeBeamChargeTimer?.remove(); this.slimeBeamChargeTimer = null;
        this.radialAttackTimer?.remove(); this.radialAttackTimer = null;
        this.targetedAttackTimer?.remove(); this.targetedAttackTimer = null;

        this.slimeBeamActive = false;
        this.slimeBeamObject?.destroy(); this.slimeBeamObject = null;

        console.log("--- Boss3Scene INIT Complete ---");
    }

    /**
     * キングゴールドスライム固有のデータを初期化
     */
    initializeBossData() {
        console.log("--- Boss3Scene initializeBossData (King Gold Slime) ---");
        this.bossData = {
            // --- 基本情報 ---
            health: 30, //仮
            textureKey: 'boss_king_slime_stand',
            negativeKey: 'boss_king_slime_negative',
            voiceAppear: AUDIO_KEYS.VOICE_KING_SLIME_APPEAR || AUDIO_KEYS.VOICE_BOSS_APPEAR_GENERIC, // 専用がなければ汎用
            voiceDamage: AUDIO_KEYS.VOICE_KING_SLIME_DAMAGE || AUDIO_KEYS.VOICE_BOSS_DAMAGE_GENERIC,
            voiceDefeat: AUDIO_KEYS.VOICE_KING_SLIME_DEFEAT || AUDIO_KEYS.VOICE_BOSS_DEFEAT_GENERIC,
            voiceRandom: AUDIO_KEYS.VOICE_KING_SLIME_RANDOM_1 ? [AUDIO_KEYS.VOICE_KING_SLIME_RANDOM_1] : [],
            bgmKey: AUDIO_KEYS.BGM_KING_SLIME || AUDIO_KEYS.BGM1, // 専用がなければ汎用
            descendTimeMinutes: 1, // ボスが最下部まで下降するおおよその時間(分)
    descendFinalPaddingY: 30, // ボス下端が画面下からこの値だけ手前を最終目標とする
    wallLineToDisableOnHpBelowHalf: 'B', // ★HP半減時に無効化する壁ラインを指定 'A' or 'B'
            cutsceneText: 'VS キングゴールドスライム',
            widthRatio: 0.75,  // 画面幅の75% (テクスチャのアスペクト比で調整)
            heightRatio: 0.3, // ボス本体が表示されるY軸方向の目安
   // --- 流れる壁ギミック関連 ---
            // wallLineAYOffsetRatio と wallLineBYOffsetRatio は削除またはコメントアウト
            // wallLineAYOffsetRatio: 0.28, (古い)
            // wallLineBYOffsetRatio: 0.32, (古い)
            wallLineAYOffsetFromBottom: 0.03, // ボスの下端から画面高さの3%下に壁Aの中心 (めり込ませるならこの値を小さく、または負にする)
            wallLineBYOffsetFromBottom: 0.08, // ボスの下端から画面高さの8%下に壁Bの中心 (壁Aより下)
            wallBlockSpeed: 120,
            wallBlockSpawnInterval: 350,
            wallBlockTexture: 'attack_brick_gold',
            wallBlockScale: 0.12,
            // --- 通常攻撃 ---
            radialAttackIntervalMin: 3500,
            radialAttackIntervalMax: 5500,
            radialAttackProjectileCount: 3,
            radialAttackAngles: [75, 90, 105],
            radialAttackProjectileSpeed: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 10,
            radialAttackProjectileTexture: 'attack_brick_slime_projectile',
            radialAttackProjectileScale: 0.1,

            targetedAttackIntervalMin: 4500,
            targetedAttackIntervalMax: 6500,
            targetedAttackProjectileSpeed: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 30,
            targetedAttackProjectileTexture: 'attack_brick_slime_projectile',
            targetedAttackProjectileScale: 0.13,
            targetedAttackChargeTime: 700, // ターゲットマーカー表示から発射までの時間
            targetedAttackMarkerDuration: 700, //マーカー表示時間

            // --- HP半減後の強化・スライムビーム関連 ---
            // (後半の攻撃間隔は、isHpBelowHalf フラグを見て動的に変更する)
            slimeBeamChargeTime: 2500,
            slimeBeamDuration: 1800,
            slimeBeamWidthRatio: 0.33,
            // slimeBeamTextureKey は不要 (プログラム描画のため)
            slimeBeamFlashCount: 3,
            slimeBeamInterval: 12000, // スライムビームの再使用間隔

             // ★このボス戦でドロッププールから除外するパワーアップのリスト★
      //  excludedPowerUps: [POWERUP_TYPES.SINDARA, POWERUP_TYPES.ANCHIRA],


            backgroundKey: 'gameBackground_Boss3',
            // 専用登場演出用SEキー (あれば)
            seKingSlimeRumble: AUDIO_KEYS.SE_KING_SLIME_RUMBLE
        };

        this.bossVoiceKeys = Array.isArray(this.bossData.voiceRandom) ? this.bossData.voiceRandom : [];
        console.log("King Gold Slime Specific Data Initialized:", this.bossData);
        console.log("--- Boss3Scene initializeBossData Complete ---");
    }

    // createSpecificBoss をオーバーライドして、ボスの表示位置などを調整
    createSpecificBoss() {
        super.createSpecificBoss();

        if (this.boss) {
            // キングスライムは画面上部に大きく表示
            // Y座標は、画像の上端が画面の上の方に来るように調整
            // heightRatio はボス画像の高さを画面高さの何割にするか、というよりは
            // ボス画像中心のY座標の目安として使う
            const bossCenterY = this.gameHeight * (this.bossData.heightRatio || 0.33) / 2;
            this.boss.setPosition(this.gameWidth / 2, bossCenterY);
            this.boss.setDepth(0); // 0か-1あたり (壁や弾より奥)

            // updateBossSize は CommonBossScene の createSpecificBoss 内で呼ばれる想定
            // もし呼ばれていない、または追加調整が必要な場合はここで呼ぶ
            // this.updateBossSize(this.boss, this.bossData.textureKey, this.bossData.widthRatio);

            console.log(`Boss3 (King Gold Slime) created. Position: (${this.boss.x.toFixed(0)}, ${this.boss.y.toFixed(0)}), DisplaySize: (${this.boss.displayWidth.toFixed(0)}, ${this.boss.displayHeight.toFixed(0)})`);

            // UIへの初期HP反映 (CommonBossSceneのsetupUIが遅延実行するので、ここでも念のため発行)
            this.time.delayedCall(100, () => { // UISceneの準備を少し待つ
                if (this.uiScene && this.uiScene.scene.isActive()) {
                    this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth'));
                    this.events.emit('updateBossNumber', this.currentBossIndex, this.totalBosses);
                }
            });
        } else {
            console.error("Boss3 (King Gold Slime) could not be created!");
        }
        console.log("--- Boss3Scene createSpecificBoss Complete ---");
    }
// Boss3Scene.js クラス内に追加

/**
 * キングゴールドスライム戦専用のドロッププールを設定する。
 * 特定のパワーアップを除外する。
 */
setupBossDropPool() {
    console.log("[Boss3Scene] Setting up custom boss drop pool, excluding SINDARA and ANCHIRA.");

    // 1. 除外対象を取得 (bossData から)
    const excluded = this.bossData.excludedPowerUps || [];

    // 2. 全てのパワーアップから除外対象を除いたリストを作成
    //    CommonBossScene の ALL_POSSIBLE_POWERUPS を参照
    let candidatePool = [];
    if (this.ALL_POSSIBLE_POWERUPS && Array.isArray(this.ALL_POSSIBLE_POWERUPS)) {
        candidatePool = this.ALL_POSSIBLE_POWERUPS.filter(type => !excluded.includes(type));
    } else {
        // フォールバック: CommonBossScene に ALL_POSSIBLE_POWERUPS がないか、不正な場合
        // (通常は CommonBossScene の constructor で定義されているはず)
        console.warn("[Boss3Scene setupBossDropPool] this.ALL_POSSIBLE_POWERUPS is not available. Using all types without exclusion.");
        candidatePool = Object.values(POWERUP_TYPES).filter(type => !excluded.includes(type));
    }

    console.log(`[Boss3Scene] Candidate pool after exclusion: [${candidatePool.join(',')}]`);

    // 3. 候補リストをシャッフル
    const shuffledPool = Phaser.Utils.Array.Shuffle([...candidatePool]); // 配列をコピーしてからシャッフル

    // 4. chaosSettings.count の数だけ取り出してボスドロッププールに設定
    this.bossDropPool = shuffledPool.slice(0, this.chaosSettings.count);

    console.log(`[Boss3Scene] Final Boss Drop Pool (Count: ${this.chaosSettings.count}): [${this.bossDropPool.join(',')}]`);

    // 5. UIに更新を通知 (CommonBossSceneのsetupBossDropPoolにもあった処理)
    if (this.uiScene && this.uiScene.scene.isActive()) {
        this.events.emit('updateDropPoolUI', this.bossDropPool);
    }
}
    // --- ▼ 専用登場演出 (ゴゴゴ...) ▼ ---
    // CommonBossScene の create で startIntroCutscene が呼ばれるので、それをオーバーライド
   startIntroCutscene() {
    console.log("[Boss3Scene] Starting King Gold Slime's custom intro (競り上がり)...");
    this.isIntroAnimating = true;
    this.playerControlEnabled = false; // プレイヤー操作不可
    this.isBallLaunched = false;     // ボール未発射

    if (!this.boss) {
        console.error("Boss object not found for intro animation. Aborting intro.");
        this.finalizeBossAppearanceAndStart(); // フォールバック
        return;
    }

    // ★★★ ボス本体の物理ボディを明示的に無効化 ★★★
    if (this.boss.body) {
        this.boss.disableBody(true, false); // GameObjectは表示するが、ボディは無効
        console.log("[Boss3 Intro] Boss body explicitly disabled for intro animation.");
    }
    // ★★★------------------------------------★★★


        // ボスを画面下外に配置し、透明にしておく
           const bossTextureHeight = this.boss.height * this.boss.scaleY;
    const startBossY = this.gameHeight + bossTextureHeight / 2;
    this.boss.setPosition(this.gameWidth / 2, startBossY);
    this.boss.setAlpha(0).setVisible(true);

    if (this.bossData.seKingSlimeRumble) {
        try { this.sound.play(this.bossData.seKingSlimeRumble, {loop: true, volume: 0.7}); } catch(e) {}
    }

    const finalBossY = this.gameHeight * (this.bossData.heightRatio || 0.33) / 2;
    const introDuration = 3000;
    const shakeAmountX = this.gameWidth * 0.01; // ★画面幅の1%程度の揺れ幅 (調整可能)
    const shakeDuration = 100; // ★1回の揺れの期間 (ms)

    this.tweens.add({
        targets: this.boss,
        props: {
            y: { value: finalBossY, duration: introDuration, ease: 'Sine.easeOut' },
            alpha: { value: 1, duration: introDuration * 0.8, ease: 'Sine.easeIn' }, // Yが上がりきる少し前に完全に表示
            x: { // ★横揺れアニメーション
                value: `+=${shakeAmountX}`, // 現在位置から少し右へ
                duration: shakeDuration,
                yoyo: true,          // 元の位置に戻る
                repeat: Math.floor(introDuration / (shakeDuration * 2)) -1, // introDuration中に揺れを繰り返す回数
                                                                        // (yoyoで往復するので期間はshakeDuration*2)
                ease: 'Sine.easeInOut' // 滑らかな揺れ
            }
        },
        // duration: introDuration, // props を使う場合、全体のdurationは各propで設定するか、このトップレベルdurationで統一
        onComplete: () => {
            console.log("[Boss3Scene] King Gold Slime intro animation (競り上がり+揺れ) complete.");
            if (this.bossData.seKingSlimeRumble) {
                try {this.sound.stopByKey(this.bossData.seKingSlimeRumble);}catch(e){}
            }
            // ★揺れ終わった後にX座標を中央に戻す（念のため）★
            if (this.boss && this.boss.active) {
                this.boss.setX(this.gameWidth / 2);
            }
            this.isIntroAnimating = false;
            this.showKingSlimeVSOverlay();
        }
    });
    console.log("--- Boss3Scene startIntroCutscene (競り上がり+揺れ) Initiated ---");
}
// Boss3Scene.js
showKingSlimeVSOverlay() {
    console.log("[Boss3Scene] Showing VS Overlay for King Gold Slime (using add.image)...");
    if (this.bossData.voiceAppear) {
         try { this.sound.play(this.bossData.voiceAppear); } catch(e) {console.error("Error playing appear voice:",e);}
    }
    try { this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START); } catch(e) {}

    // --- オーバーレイ表示 ---
    const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.7)
        .setOrigin(0,0)
        .setDepth(900); // 奥

    // --- ボス画像の表示 (新規生成) ---
    // このカットシーン専用のボス画像。this.boss (スライム本体) とは別オブジェクト。
    const bossImageScale = 0.7; // カットイン用の表示スケール (調整してください)
    const bossImage = this.add.image(
        this.gameWidth / 2,
        this.gameHeight * 0.4, // Y座標: 画面中央より少し上 (調整してください)
        this.bossData.textureKey   // スライム本体と同じテクスチャキーを使用
    )
        .setOrigin(0.5, 0.5)
        .setScale(bossImageScale)
        .setDepth(901); // オーバーレイより手前、テキストより奥

    // --- VSテキストの表示 ---
    const textContent = this.bossData.cutsceneText;
    const fontSize = this.calculateDynamicFontSize(70);
    const textStyle = {
        fontSize: `${fontSize}px`,
        fill: '#F9A602',
        stroke: '#4A2E04',
        strokeThickness: Math.max(5, fontSize * 0.08),
        fontFamily: 'MyGameFont, Impact, sans-serif',
        align: 'center',
        shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, stroke: true, fill: true }
    };

    // テキストのY座標を、表示したカットシーン用ボス画像の下にする
    const bossImageBottom = bossImage.getBounds().bottom;
    const textMarginTop = this.gameHeight * 0.05;

    const vsText = this.add.text(
        this.gameWidth / 2,
        bossImageBottom + textMarginTop,
        textContent,
        textStyle
    )
        .setOrigin(0.5, 0) // 上端中央基準
        .setDepth(902);    // 最前面

    console.log(`[VS Overlay] Created new bossImage for cutscene. Depth: ${bossImage.depth}. Text Y: ${vsText.y.toFixed(0)}`);

    const cutsceneDisplayDuration = CUTSCENE_DURATION || 1800;
    this.time.delayedCall(cutsceneDisplayDuration, () => {
        if (overlay && overlay.scene) overlay.destroy();
        if (bossImage && bossImage.scene) bossImage.destroy(); // ★カットシーン用画像を破棄
        if (vsText && vsText.scene) vsText.destroy();

        console.log("[Boss3Scene] VS Overlay finished.");
        // この後、this.boss (スライム本体) の物理ボディを有効化し戦闘開始
        this.finalizeBossAppearanceAndStart();
    }, [], this);
    console.log("--- Boss3Scene showKingSlimeVSOverlay Complete (using add.image) ---");
}

    // CommonBossSceneのfinalizeBossAppearanceAndStartは、ボスを見えるようにして物理ボディを有効化し、
    // startGameplayを遅延呼び出しする。キングスライムの場合、そのままで良いか、
    // BGM再生タイミングなどを調整したければオーバーライド。
    // 今回はCommonのものをそのまま使う想定。
    // finalizeBossAppearanceAndStart() {
    //     super.finalizeBossAppearanceAndStart();
    //     console.log("[Boss3Scene] Custom finalize (if needed).");
    // }


    // キングスライムは動かないので、startSpecificBossMovement は攻撃関連の初期化に使う
   startSpecificBossMovement() {
    console.log("--- Boss3Scene startSpecificBossMovement (King Slime is static, initializing attacks) ---");
    if (!this.boss || !this.boss.active || this.isIntroAnimating) {
        console.warn("Boss not ready or intro animating, delaying attack initialization.");
        this.time.delayedCall(200, this.startSpecificBossMovement, [], this); // 少し待って再試行
        return;
    }
    console.log("King Gold Slime is static. Initializing wall spawners and attack timers.");

    // 流れる壁の生成を開始
    this.startWallBlockSpawners(); // ★今回の実装対象

    // 通常攻撃のタイマーを開始 (これは次のステップで)
    // this.scheduleNextRadialAttack();
     this.scheduleNextTargetedAttack();

    console.log("--- Boss3Scene startSpecificBossMovement Complete ---");
}


   // updateSpecificBossBehavior での下降処理
updateSpecificBossBehavior(time, delta) {
    if (this.isIntroAnimating || !this.playerControlEnabled || !this.boss || !this.boss.active || this.bossDefeated || this.isGameOver) {
        return;
    }
    this.cleanupWallBlocks();

    // --- ボス下降処理 ---
    if (this.isDescending) {
        if (this.boss.y < this.descendTargetY) {
            const actualDescendAmount = this.descendSpeedY * (delta / 1000); // deltaはmsなので秒に変換
            this.boss.y += actualDescendAmount;
            // 目標Y座標を超えないようにクランプ
            if (this.boss.y > this.descendTargetY) {
                this.boss.y = this.descendTargetY;
                console.log("[Descend] Boss reached target Y. Stopping descent.");
                // (オプション) ここでさらに何かイベントを起こす（例：壁の速度が上がるなど）
                // this.isDescending = false; // もし一度きりの下降ならここで止める
            }
        } else if (this.descendSpeedY > 0) { // 既に目標地点にいるが、速度が設定されていた場合
             console.log("[Descend] Boss already at or below target Y. Descent effectively stopped.");
             // this.isDescending = false; // もし一度きりの下降ならここで止める
        }
    }
    // --- ボス下降処理 終了 ---

    // (スライムビーム関連は削除済み)
}


  // --- ▼ 流れる壁ギミック ▼ ---
startWallBlockSpawners() {
    const spawnInterval = this.bossData.wallBlockSpawnInterval || 450; // デフォルト300ms
    const initialDelay = 100; // 最初のブロックが少し遅れて出始めるように (任意)

    console.log(`[Wall] Starting wall block spawners. Interval: ${spawnInterval}ms`);

    // 壁ラインA (右から左)
    if (this.wallBlockSpawnTimers.lineA) this.wallBlockSpawnTimers.lineA.remove(); // 既存タイマー削除
    this.wallBlockSpawnTimers.lineA = this.time.addEvent({
        delay: spawnInterval,
        callback: () => this.spawnWallBlock('A'),
        callbackScope: this,
        loop: true,
        startAt: initialDelay // 最初の実行を少し遅らせる
    });

    // 壁ラインB (左から右)
    if (this.wallBlockSpawnTimers.lineB) this.wallBlockSpawnTimers.lineB.remove(); // 既存タイマー削除
    this.wallBlockSpawnTimers.lineB = this.time.addEvent({
        delay: spawnInterval,
        callback: () => this.spawnWallBlock('B'),
        callbackScope: this,
        loop: true,
        startAt: initialDelay + spawnInterval / 2 // ラインBはAと少しタイミングをずらす (任意)
    });
}

// spawnWallBlock メソッド (エラー箇所を修正する可能性のあるバージョン)
spawnWallBlock(line) { // line は 'A' または 'B'
    if (!this.attackBricks || !this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) {
        return;
    }

    const texture = this.bossData.wallBlockTexture || 'attack_brick_gold';
    const scale = this.bossData.wallBlockScale || 0.12;
    const speed = this.bossData.wallBlockSpeed || 120;

    let spawnX, velocityX, spawnY;

    // ★★★ bossDisplayBottomY を if文の外、spawnYの計算の直前で定義 ★★★
    const bossDisplayBottomY = this.boss.y + (this.boss.displayHeight / 2);
    console.log(`[Wall Spawn] Boss Y: ${this.boss.y.toFixed(1)}, DisplayHeight: ${this.boss.displayHeight.toFixed(1)}, bossDisplayBottomY: ${bossDisplayBottomY.toFixed(1)}`);

    let yOffsetValue; // yOffsetValue も if の外で宣言し、if の中で値を設定する

    if (line === 'A') { // 右から左へ、上層
        spawnX = this.gameWidth + (this.gameWidth * scale * 0.5) + 10;
        velocityX = -speed;
        yOffsetValue = this.gameHeight * (this.bossData.wallLineAYOffsetFromBottom || 0.05);
        spawnY = bossDisplayBottomY + yOffsetValue; // ★ここで bossDisplayBottomY を使用
        console.log(`[Wall A] OffsetFromBottomRatio: ${this.bossData.wallLineAYOffsetFromBottom || 0.05}, yOffsetValue: ${yOffsetValue.toFixed(1)}, SpawnY: ${spawnY.toFixed(1)}`);
    } else { // line === 'B', 左から右へ、下層
        spawnX = -(this.gameWidth * scale * 0.5) - 10;
        velocityX = speed;
        yOffsetValue = this.gameHeight * (this.bossData.wallLineBYOffsetFromBottom || 0.1);
        spawnY = bossDisplayBottomY + yOffsetValue; // ★ここで bossDisplayBottomY を使用
        console.log(`[Wall B] OffsetFromBottomRatio: ${this.bossData.wallLineBYOffsetFromBottom || 0.1}, yOffsetValue: ${yOffsetValue.toFixed(1)}, SpawnY: ${spawnY.toFixed(1)}`);
    }

    // wallBlock の生成と設定 (ここは変更なし)
    const wallBlock = this.attackBricks.create(spawnX, spawnY, texture);
    if (wallBlock) {
        wallBlock.setScale(scale);
        wallBlock.setOrigin(0.5, 0.5);

        if (wallBlock.body) {
            wallBlock.body.setAllowGravity(false);
            wallBlock.body.setCollideWorldBounds(false);
            wallBlock.body.setVelocityX(velocityX);
        } else {
            wallBlock.setData('velocityX', velocityX);
        }

        wallBlock.setData('blockType', 'wall');
        wallBlock.setData('wallLine', line);
        wallBlock.setDepth(-1);
    } else {
        console.error(`[Wall] Failed to create wall block for line ${line}`);
    }
}

cleanupWallBlocks() {
    if (!this.attackBricks) return;

    this.attackBricks.getChildren().forEach(block => {
        if (block.active && block.getData('blockType') === 'wall') {
            // 画面の左右の端を完全に超えたものを破棄
            // ブロックの表示幅の半分を考慮して、画面外判定を少し甘くする
            const blockHalfWidth = block.displayWidth / 2;
            if (block.body && block.body.velocity.x < 0 && block.x < -blockHalfWidth) { // 左へ移動中
                // console.log(`[Wall] Destroying wall block (left out): ${block.getData('wallLine')}`);
                block.destroy();
            } else if (block.body && block.body.velocity.x > 0 && block.x > this.gameWidth + blockHalfWidth) { // 右へ移動中
                // console.log(`[Wall] Destroying wall block (right out): ${block.getData('wallLine')}`);
                block.destroy();
            } else if (!block.body && block.getData('velocityX') < 0 && block.x < -blockHalfWidth) { // ボディなしで手動移動の場合
                 block.destroy();
            } else if (!block.body && block.getData('velocityX') > 0 && block.x > this.gameWidth + blockHalfWidth) { // ボディなしで手動移動の場合
                 block.destroy();
            }
        }
    });
}
// --- ▲ 流れる壁ギミック ▲ ---



    // --- ▼ 通常攻撃パターン ▼ ---
scheduleNextRadialAttack() {
    if (this.radialAttackTimer) this.radialAttackTimer.remove();
    if (!this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) return;

    const minInterval = this.isHpBelowHalf ?
        (this.bossData.後半_radialAttackIntervalMin || 2000) :
        (this.bossData.radialAttackIntervalMin || 3500);
    const maxInterval = this.isHpBelowHalf ?
        (this.bossData.後半_radialAttackIntervalMax || 3500) :
        (this.bossData.radialAttackIntervalMax || 5500);

    const nextDelay = Phaser.Math.Between(minInterval, maxInterval);
    console.log(`[Attack] Scheduling next Radial Attack in ${nextDelay}ms. HP Below Half: ${this.isHpBelowHalf}`);
    this.radialAttackTimer = this.time.delayedCall(nextDelay, this.spawnRadialAttack, [], this);
}

spawnRadialAttack() {
    if (!this.attackBricks || !this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) {
        if (!this.isGameOver && !this.bossDefeated) this.scheduleNextRadialAttack(); // 戦闘中なら再スケジュール
        return;
    }
    console.log("King Slime: Spawning Radial Attack");
    // this.sound.play(AUDIO_KEYS.SE_BOSS_ATTACK_1); // 攻撃SE

    const count = this.bossData.radialAttackProjectileCount || 3;
    const angles = this.bossData.radialAttackAngles || [75, 90, 105]; // 真下とその左右
    const speed = this.bossData.radialAttackProjectileSpeed || DEFAULT_ATTACK_BRICK_VELOCITY_Y + 10;
    const texture = this.bossData.radialAttackProjectileTexture || 'attack_brick_slime_projectile';
    const scale = this.bossData.radialAttackProjectileScale || 0.1;
    // ボス本体の下部中央あたりから発射
    const spawnX = this.boss.x;
    const spawnY = this.boss.y + (this.boss.displayHeight / 2) * 0.8; // ボス下端より少し内側から

    angles.forEach(angleDeg => {
        const projectile = this.attackBricks.create(spawnX, spawnY, texture);
        if (projectile) {
            projectile.setScale(scale).setOrigin(0.5, 0.5);
            if (projectile.body) {
                this.physics.velocityFromAngle(angleDeg, speed, projectile.body.velocity);
                projectile.body.setAllowGravity(false);
                projectile.body.setCollideWorldBounds(true); // ★画面端で反射させる
                projectile.body.onWorldBounds = true; // ★ワールド境界イベント有効化
            }
            projectile.setData('blockType', 'projectile');
            projectile.setDepth(1); // 壁より手前、ボールと同じくらいか
        }
    });
    this.scheduleNextRadialAttack(); // 次の攻撃を予約
}

scheduleNextTargetedAttack() {
    if (this.targetedAttackTimer) this.targetedAttackTimer.remove();
    if (!this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) return;

    const minInterval = this.isHpBelowHalf ?
        (this.bossData.後半_targetedAttackIntervalMin || 2500) :
        (this.bossData.targetedAttackIntervalMin || 4500);
    const maxInterval = this.isHpBelowHalf ?
        (this.bossData.後半_targetedAttackIntervalMax || 4000) :
        (this.bossData.targetedAttackIntervalMax || 6500);

    const nextDelay = Phaser.Math.Between(minInterval, maxInterval);
    console.log(`[Attack] Scheduling next Targeted Attack in ${nextDelay}ms. HP Below Half: ${this.isHpBelowHalf}`);
    this.targetedAttackTimer = this.time.delayedCall(nextDelay, this.spawnTargetedAttack, [], this);
}

spawnTargetedAttack() {
    if (!this.attackBricks || !this.boss || !this.boss.active || !this.paddle || !this.paddle.active || this.isGameOver || this.bossDefeated) {
        if (!this.isGameOver && !this.bossDefeated) this.scheduleNextTargetedAttack();
        return;
    }
    console.log("King Slime: Spawning Targeted Attack");
    // this.sound.play(AUDIO_KEYS.SE_BOSS_ATTACK_2); // 攻撃SE

    const targetX = this.paddle.x; // 発射決定時のパドルX座標
    const spawnFromBossY = this.boss.y + (this.boss.displayHeight / 2) * 0.8;
    const speed = this.bossData.targetedAttackProjectileSpeed || DEFAULT_ATTACK_BRICK_VELOCITY_Y + 30;
    const texture = this.bossData.targetedAttackProjectileTexture || 'attack_brick_slime_projectile';
    const scale = this.bossData.targetedAttackProjectileScale || 0.13;
    const chargeTime = this.bossData.targetedAttackChargeTime || 700; // 予兆表示時間
    const markerDuration = this.bossData.targetedAttackMarkerDuration || 700;

    // --- 予兆マーカー表示 (プログラム描画) ---
    const markerRadius = this.paddle.displayWidth * 0.5; // パドル幅の半分くらいの円
    const markerY = this.paddle.y - this.paddle.displayHeight; // パドルの少し上に表示
    const marker = this.add.graphics({fillStyle: { color: 0xff0000, alpha: 0 }}); // 最初は透明
    marker.fillCircle(targetX, markerY, markerRadius);
    marker.setDepth(0);
    // フェードイン・フェードアウトするマーカー
    this.tweens.add({
        targets: marker,
        alpha: 0.3,
        duration: markerDuration / 2,
        yoyo: true, // alpha 0.3 -> 0 に戻る
        onComplete: () => {
            if (marker.scene) marker.destroy(); // Tween完了時に破棄
        }
    });
    console.log(`[Targeted Attack] Marker displayed at X:${targetX.toFixed(0)}, Y:${markerY.toFixed(0)}`);

    // 予兆表示時間後に発射
    this.time.delayedCall(chargeTime, () => {
        if (!this.attackBricks || !this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) return;

        const projectile = this.attackBricks.create(this.boss.x, spawnFromBossY, texture);
        if (projectile) {
            projectile.setScale(scale).setOrigin(0.5, 0.5);
            if (projectile.body) {
                // 発射決定時のターゲットXと、画面下端（またはパドルY座標の少し下）へ向かう角度
                const angleToTarget = Phaser.Math.Angle.Between(
                    this.boss.x, spawnFromBossY,
                    targetX, this.gameHeight - 50 // 画面下端より少し手前を狙う
                );
                this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angleToTarget), speed, projectile.body.velocity);
                projectile.body.setAllowGravity(false);
                projectile.body.setCollideWorldBounds(true); // ★画面端で反射させる
                projectile.body.onWorldBounds = true; // ★ワールド境界イベント有効化
            }
            projectile.setData('blockType', 'projectile');
            projectile.setDepth(1);
            console.log(`[Targeted Attack] Projectile fired towards X:${targetX.toFixed(0)}`);
        }
    }, [], this);

    this.scheduleNextTargetedAttack(); // 次の攻撃を予約
}
// --- ▲ 通常攻撃パターン ▲ ---


   // applyBossDamage (HP半減検知のためにオーバーライド)
applyBossDamage(bossInstance, damageAmount, source = "Unknown") {
    if (!bossInstance || !bossInstance.active) return;

    const hpBefore = bossInstance.getData('health');
    super.applyBossDamage(bossInstance, damageAmount, source);
    const hpAfter = bossInstance.getData('health');

    if (!this.isHpBelowHalf && hpAfter <= this.bossData.health / 2 && hpBefore > this.bossData.health / 2) {
        this.isHpBelowHalf = true;
        console.log("[HP Half] Boss HP reached half or less. Triggering phase 2 effects.");
        this.triggerHpHalfEffect();
    }
}

// triggerHpHalfEffect の実装を修正
triggerHpHalfEffect() {
    console.log("[HP Half] Activating phase 2: Screen flash, BOSS IS DESCENDING FASTER, one wall line disabled!");
    this.cameras.main.flash(400, 255, 230, 100, false); // 演出用フラッシュ

    this.isDescending = true; // 下降開始フラグ

    // 1. 指定された壁ラインの生成を停止
    const lineToDisable = this.bossData.wallLineToDisableOnHpBelowHalf;
    if (lineToDisable === 'A' && this.wallBlockSpawnTimers.lineA) {
        this.wallBlockSpawnTimers.lineA.remove();
        this.wallBlockSpawnTimers.lineA = null;
        console.log("[HP Half] Wall Line A spawner disabled.");
        // 既存のラインAの壁を全て消す (任意だが、即座に効果を見せるなら)
        this.attackBricks.getChildren().forEach(block => {
            if (block.active && block.getData('wallLine') === 'A') block.destroy();
        });
    } else if (lineToDisable === 'B' && this.wallBlockSpawnTimers.lineB) {
        this.wallBlockSpawnTimers.lineB.remove();
        this.wallBlockSpawnTimers.lineB = null;
        console.log("[HP Half] Wall Line B spawner disabled.");
        this.attackBricks.getChildren().forEach(block => {
            if (block.active && block.getData('wallLine') === 'B') block.destroy();
        });
    }

    // 2. 新しい下降速度と目標Y座標を計算
    const paddleApproxHeight = (PADDLE_HEIGHT || 20);
    // 目標Y座標 (ボスの原点が中心なので、ボスの下端が目標位置に来るように)
    this.descendTargetY = this.gameHeight - (this.boss.displayHeight / 2) - paddleApproxHeight - (this.bossData.descendFinalPaddingY || 30);

    const distanceToDescend = this.descendTargetY - this.boss.y;
    const timeToDescendSeconds = (this.bossData.hpBelowHalfDescendTimeMinutes || 1) * 60;

    if (timeToDescendSeconds <= 0 || distanceToDescend <= 0) {
        this.descendSpeedY = 0;
        if (distanceToDescend > 0 && this.boss && this.boss.active) this.boss.setY(this.descendTargetY); // 即時移動
        console.warn("[Descend Setup] Cannot calculate descendSpeedY or already at target for HP half phase.");
    } else {
        this.descendSpeedY = distanceToDescend / timeToDescendSeconds; // ピクセル/秒
    }
    console.log(`[HP Half Descend] Started. TargetY: ${this.descendTargetY.toFixed(1)}, New SpeedY: ${this.descendSpeedY.toFixed(2)} px/s (Target Time: ${timeToDescendSeconds}s)`);

    // (オプション) 下降開始を知らせるSE
    // if (this.bossData.seBossDescendFast) this.sound.play(this.bossData.seBossDescendFast);
}






    /**
     * ボールが攻撃ブロックに衝突した際の処理 (CommonBossSceneからオーバーライド)
     * 壁ブロックの場合は特殊な下向き反射を行う。
     * @param {Phaser.Physics.Arcade.Image} brick 衝突した攻撃ブロック
     * @param {Phaser.Physics.Arcade.Image} ball 衝突したボール
     */
    hitAttackBrick(brick, ball) {
        if (!brick?.active || !ball?.active || !ball.body) {
            console.warn("[Boss3 hitAttackBrick] Invalid brick or ball state.");
            return;
        }

        const blockType = brick.getData('blockType');

        if (blockType === 'wall') {
            console.log(`[Boss3 hitAttackBrick] Ball hit WALL component (Line: ${brick.getData('wallLine')}). Forcing downward reflection.`);

            // --- 特殊な下向き反射ロジック ---
            let newVx = ball.body.velocity.x; // 現在のX速度をベースにする
            let newVy = Math.abs(ball.body.velocity.y); // 現在のY速度の絶対値（上向きでも下向きでも正の値に）

            // Y速度を必ず下向きにし、最低速度を保証
            const minBounceSpeedY = NORMAL_BALL_SPEED * 0.5; // 仮: 通常ボール速度の50%
            newVy = Math.max(newVy, minBounceSpeedY);

            // X速度の調整 (任意)
            // 例: あまりにも真横に近い角度で壁に当たった場合、X速度を少し抑える
            if (Math.abs(newVy) < Math.abs(newVx) * 0.3) { // YがXの30%未満なら
                newVx *= 0.8; // X速度を20%減らす
            }
            // 例: 左右の壁の端の方で当たった場合、少し中央に戻るようにX速度を調整する (高度)

            // パワーアップによる速度補正を考慮
            let speedMultiplier = 1.0;
            if (ball.getData('isFast') === true) {
                speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA];
            } else if (ball.getData('isSlow') === true) {
                speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA];
            }
            const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier;

            // 最終的な速度ベクトルを計算・正規化・適用
            const finalVel = new Phaser.Math.Vector2(newVx, newVy); // newVyは既に正
            if (finalVel.lengthSq() === 0) { // ゼロベクトル回避
                finalVel.set(Phaser.Math.Between(-50, 50), targetSpeed * 0.7); // とりあえずランダムなXと下向きY
            }
            finalVel.normalize().scale(targetSpeed);

            ball.setVelocity(finalVel.x, finalVel.y);
            console.log(`[Wall Hit] Ball new velocity: (${finalVel.x.toFixed(1)}, ${finalVel.y.toFixed(1)})`);

            // --- ブロック破壊とアイテムドロップ ---
            // CommonBossScene のメソッドを呼び出す
            this.destroyAttackBrickAndDropItem(brick);

        } else if (blockType === 'projectile') {
            // 通常の攻撃弾の場合は、CommonBossSceneの処理に任せる
            console.log("[Boss3 hitAttackBrick] Ball hit PROJECTILE component. Calling super.hitAttackBrick.");
            super.hitAttackBrick(brick, ball);
        } else {
            // 未定義のタイプの場合は、とりあえずCommonBossSceneの処理に任せる
            console.warn(`[Boss3 hitAttackBrick] Ball hit UNKNOWN blockType: ${blockType}. Calling super.hitAttackBrick.`);
            super.hitAttackBrick(brick, ball);
        }
    }

// ... (他のメソッド) ...
    // ボールと壁ブロックの衝突処理のオーバーライド
    // (CommonBossSceneのhitAttackBrickから呼ばれることを想定し、
    //  CommonBossScene側でblockTypeによる分岐を実装するか、ここで完全に上書き)
    /*
    hitAttackBrick(brick, ball) {
        if (!brick?.active || !ball?.active) return;
        const blockType = brick.getData('blockType');

        if (blockType === 'wall') {
            console.log("Ball hit WALL component (King Slime). Forcing downward reflection.");
            // ... 強制下向き反射ロジック ...
            this.destroyAttackBrickAndDropItem(brick);
        } else if (blockType === 'projectile') {
            console.log("Ball hit PROJECTILE component (King Slime). Using default reflection.");
            super.hitAttackBrick(brick, ball); // 親のメソッドを呼ぶ (アイテムドロップなども含む)
        } else {
            super.hitAttackBrick(brick, ball); // 不明なタイプは親に任せる
        }
    }
    */

    // shutdownScene でタイマーなどをクリア
   
// shutdownScene でタイマーなどをクリア (スライムビーム関連も含む)
shutdownScene() {
    super.shutdownScene(); // 親のシャットダウン処理を必ず呼ぶ

  

    // 他のタイマー (radialAttackTimer, targetedAttackTimer, wallBlockSpawnTimers) も
    // super.shutdownScene() で this.time.removeAllEvents() が呼ばれていればクリアされるはず。
    // 個別に参照をnullにしたい場合はここで行う。
    this.radialAttackTimer = null;
    this.targetedAttackTimer = null;
    this.wallBlockSpawnTimers = { lineA: null, lineB: null };


    console.log("--- Boss3Scene SHUTDOWN (Slime Beam specific cleanup) Complete ---");
}
}
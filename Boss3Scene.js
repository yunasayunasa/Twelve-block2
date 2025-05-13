// Boss3Scene.js (キングゴールドスライム戦 - 骨子)
import CommonBossScene from './CommonBossScene.js';
import {
    AUDIO_KEYS,
    // POWERUP_TYPES, // 現時点では未使用
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
            health: 20, //仮
            textureKey: 'boss_king_slime_stand',
            negativeKey: 'boss_king_slime_negative',
            voiceAppear: AUDIO_KEYS.VOICE_KING_SLIME_APPEAR || AUDIO_KEYS.VOICE_BOSS_APPEAR_GENERIC, // 専用がなければ汎用
            voiceDamage: AUDIO_KEYS.VOICE_KING_SLIME_DAMAGE || AUDIO_KEYS.VOICE_BOSS_DAMAGE_GENERIC,
            voiceDefeat: AUDIO_KEYS.VOICE_KING_SLIME_DEFEAT || AUDIO_KEYS.VOICE_BOSS_DEFEAT_GENERIC,
            voiceRandom: AUDIO_KEYS.VOICE_KING_SLIME_RANDOM_1 ? [AUDIO_KEYS.VOICE_KING_SLIME_RANDOM_1] : [],
            bgmKey: AUDIO_KEYS.BGM_KING_SLIME || AUDIO_KEYS.BGM1, // 専用がなければ汎用
            cutsceneText: 'VS キングゴールドスライム',
            widthRatio: 0.75,  // 画面幅の75% (テクスチャのアスペクト比で調整)
            heightRatio: 0.33, // ボス本体が表示されるY軸方向の目安

            // --- 流れる壁ギミック関連 ---
            wallLineAYOffsetRatio: 0.28, // ボス本体の画像の上端からの相対Y位置(画面高さ比)を想定
            wallLineBYOffsetRatio: 0.32, // 壁Bは壁Aより少し下に
            wallBlockSpeed: 120,
            wallBlockSpawnInterval: 350,
            wallBlockTexture: 'attack_brick_gold',
            wallBlockScale: 0.12, // 壁ブロックのスケール (元画像のサイズによる)

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
        const bossTextureHeight = this.boss.height * this.boss.scaleY; // 表示スケール考慮
        const startBossY = this.gameHeight + bossTextureHeight / 2;
        this.boss.setPosition(this.gameWidth / 2, startBossY);
        this.boss.setAlpha(0).setVisible(true); // 見えるようにしてからTween開始

        // 「ゴゴゴゴ...」SE再生
        if (this.bossData.seKingSlimeRumble) {
            try { this.sound.play(this.bossData.seKingSlimeRumble, {loop: true, volume: 0.7}); } catch(e) {console.error("Error playing rumble SE:", e);}
        }

        // ボスの最終Y座標 (initializeBossData/createSpecificBossで設定されたY座標)
        const finalBossY = this.gameHeight * (this.bossData.heightRatio || 0.33) / 2;
        const introDuration = 3000; // 3秒かけて競り上がる (要調整)

        this.tweens.add({
            targets: this.boss,
            y: finalBossY,
            alpha: 1,
            duration: introDuration,
            ease: 'Sine.easeOut', // ゆっくりと登場する感じ
            onComplete: () => {
                console.log("[Boss3Scene] King Gold Slime intro animation (競り上がり) complete.");
                if (this.bossData.seKingSlimeRumble) { // 地響きSE停止
                    try {this.sound.stopByKey(this.bossData.seKingSlimeRumble);}catch(e){}
                }
                this.isIntroAnimating = false;
                this.showKingSlimeVSOverlay(); // VS表示へ
            }
        });
        console.log("--- Boss3Scene startIntroCutscene (競り上がり) Initiated ---");
    }

  showKingSlimeVSOverlay() {
    console.log("[Boss3Scene] Showing VS Overlay for King Gold Slime (using existing this.boss)...");
    if (this.bossData.voiceAppear) {
         try { this.sound.play(this.bossData.voiceAppear); } catch(e) {console.error("Error playing appear voice:",e);}
    }
    try { this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START); } catch(e) {}

    if (!this.boss || !this.boss.active) {
        console.error("[VS Overlay] this.boss is not available or not active! Cannot show cutscene properly.");
        // フォールバック処理: 即座に戦闘開始など
        this.finalizeBossAppearanceAndStart();
        return;
    }

    // --- オーバーレイ表示 ---
    const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.7)
        .setOrigin(0,0)
        .setDepth(900); // オーバーレイはボスより奥、テキストより奥

    // --- ★既存の this.boss をカットインに使用 ★ ---
    const originalBossDepth = this.boss.depth; // 元の深度を保持
    this.boss.setDepth(901); // ★オーバーレイより手前、テキストより奥に設定
    // ボス本体の表示位置やスケールは、競り上がり演出完了時の状態をそのまま利用。
    // もしカットイン用に一時的にスケールや位置を変えたい場合はここでTweenなどを使う。

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

    // テキストのY座標は、画面中央か、ボスが見えるように少し下寄りに調整
    const vsTextY = this.gameHeight * 0.65; // 例: 画面高さの65%の位置 (要調整)

    const vsText = this.add.text(
        this.gameWidth / 2,
        vsTextY,
        textContent,
        textStyle
    )
        .setOrigin(0.5, 0.5) // 原点: テキストの中央
        .setDepth(902);     // 最前面に表示

    console.log(`[VS Overlay] Using this.boss (Depth: ${this.boss.depth}). Text Y: ${vsText.y.toFixed(0)}`);

    const cutsceneDisplayDuration = CUTSCENE_DURATION || 1800;
    this.time.delayedCall(cutsceneDisplayDuration, () => {
        if (overlay.scene) overlay.destroy();
        // bossImage.destroy(); // ★これは不要、this.boss は破棄しない
        if (vsText.scene) vsText.destroy();

        // ★ ボスの深度を元に戻す (または戦闘時の深度に設定) ★
        if (this.boss && this.boss.active) {
            this.boss.setDepth(originalBossDepth); // 元の深度に戻す
            // あるいは、戦闘時の決まった深度があるならそれに設定: this.boss.setDepth(0); など
        }

        console.log("[Boss3Scene] VS Overlay finished.");
        this.finalizeBossAppearanceAndStart();
    }, [], this);
    console.log("--- Boss3Scene showKingSlimeVSOverlay Complete (using this.boss) ---");
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
            // イントロが終わってから再度呼ばれるようにするなど
            return;
        }
        console.log("King Gold Slime is static. Initializing wall spawners and attack timers.");

        // 流れる壁の生成を開始
        this.startWallBlockSpawners();

        // 通常攻撃のタイマーを開始
        this.scheduleNextRadialAttack();
        this.scheduleNextTargetedAttack();

        // (HP半減後のスライムビームは、applyBossDamageのオーバーライド等でトリガー)
        console.log("--- Boss3Scene startSpecificBossMovement Complete ---");
    }

    // updateSpecificBossBehavior: 各種攻撃の実行管理、HP半減時の処理など
    // (このメソッドは CommonBossScene の update から毎フレーム呼ばれる)
    updateSpecificBossBehavior(time, delta) {
        if (this.isIntroAnimating || !this.playerControlEnabled || !this.boss || !this.boss.active || this.bossDefeated || this.isGameOver) {
            return;
        }

        // 流れる壁ブロックの画面外処理
        this.cleanupWallBlocks();

        // スライムビームの当たり判定更新 (もしビームがアクティブなら)
        if (this.slimeBeamActive && this.slimeBeamObject) {
            this.checkSlimeBeamCollisions();
        }
    }

    // --- ▼ 流れる壁ギミック (骨子) ▼ ---
    startWallBlockSpawners() {
        // (実装は次のステップ)
        console.log("[Wall] TODO: Implement startWallBlockSpawners");
    }
    spawnWallBlock(line) {
        // (実装は次のステップ)
        console.log(`[Wall] TODO: Implement spawnWallBlock for line ${line}`);
    }
    cleanupWallBlocks() {
        // (実装は次のステップ)
        // console.log("[Wall] TODO: Implement cleanupWallBlocks");
    }
    // --- ▲ 流れる壁ギミック ▲ ---


    // --- ▼ 通常攻撃パターン (骨子) ▼ ---
    scheduleNextRadialAttack() {
        // (実装は次のステップ)
        console.log("[Attack] TODO: Implement scheduleNextRadialAttack");
    }
    spawnRadialAttack() {
        // (実装は次のステップ)
        console.log("[Attack] TODO: Implement spawnRadialAttack");
    }
    scheduleNextTargetedAttack() {
        // (実装は次のステップ)
        console.log("[Attack] TODO: Implement scheduleNextTargetedAttack");
    }
    spawnTargetedAttack() {
        // (実装は次のステップ)
        console.log("[Attack] TODO: Implement spawnTargetedAttack");
    }
    // --- ▲ 通常攻撃パターン ▲ ---


    // --- ▼ HP半減時処理＆スライムビーム (骨子) ▼ ---
    // applyBossDamage をオーバーライドしてHP半減を検知
    applyBossDamage(bossInstance, damageAmount, source = "Unknown") {
        const hpBefore = bossInstance.getData('health');
        super.applyBossDamage(bossInstance, damageAmount, source); // 親のダメージ処理
        const hpAfter = bossInstance.getData('health');

        if (!this.isHpBelowHalf && hpAfter <= this.bossData.health / 2 && hpBefore > this.bossData.health / 2) {
            this.isHpBelowHalf = true; // フラグを立てる
            console.log("[HP Half] Boss HP reached half or less. Triggering phase 2.");
            this.triggerHpHalfEffect();
        }
    }

    triggerHpHalfEffect() {
        console.log("[HP Half] Activating phase 2 effects (flash, beam schedule)...");
        this.cameras.main.flash(400, 230, 200, 80, false); // 黄色っぽいフラッシュ

        // スライムビーム攻撃をここから定期的に行うようにする
        this.scheduleSlimeBeam();
    }

    scheduleSlimeBeam() {
        // (実装は次のステップ)
        console.log("[Beam] TODO: Implement scheduleSlimeBeam");
    }
    startSlimeBeamCharge() {
        // (実装は次のステップ)
        console.log("[Beam] TODO: Implement startSlimeBeamCharge");
    }
    fireSlimeBeam() {
        // (実装は次のステップ)
        console.log("[Beam] TODO: Implement fireSlimeBeam");
    }
    endSlimeBeam() {
        // (実装は次のステップ)
        console.log("[Beam] TODO: Implement endSlimeBeam");
    }
    checkSlimeBeamCollisions() {
        // (実装は次のステップ)
        // console.log("[Beam] TODO: Implement checkSlimeBeamCollisions");
    }
    // --- ▲ HP半減時処理＆スライムビーム ▲ ---


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
    shutdownScene() {
        super.shutdownScene();
        // このシーン固有のタイマーやオブジェクトをクリア
        this.wallBlockSpawnTimers.lineA?.remove();
        this.wallBlockSpawnTimers.lineB?.remove();
        this.slimeBeamChargeTimer?.remove();
        this.radialAttackTimer?.remove();
        this.targetedAttackTimer?.remove();
        this.slimeBeamObject?.destroy();
        // SEの停止などもここで念のため
        if (this.bossData.seKingSlimeRumble) {
            try {this.sound.stopByKey(this.bossData.seKingSlimeRumble);}catch(e){}
        }
        console.log("--- Boss3Scene SHUTDOWN Complete ---");
    }
}
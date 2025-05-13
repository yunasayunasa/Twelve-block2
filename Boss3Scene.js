// Boss3Scene.js (キングゴールドスライム戦)
import CommonBossScene from './CommonBossScene.js';
import {
    AUDIO_KEYS,
    POWERUP_TYPES, // 必要に応じて
    // キングゴールドスライム固有の定数があればここでインポート
    // 例: KING_SLIME_WALL_SPEED, KING_SLIME_BEAM_DURATION など
    DEFAULT_ATTACK_BRICK_VELOCITY_Y // 汎用的な値として
} from './constants.js';

export default class Boss3Scene extends CommonBossScene {
    constructor() {
        super('Boss3Scene'); // シーンキーを Boss3Scene に

        // キングゴールドスライム固有のプロパティを初期化
        this.isHpBelowHalf = false; // HP半減フラグ
        this.wallBlockSpawnTimers = { lineA: null, lineB: null }; // 流れる壁の生成タイマー
        this.slimeBeamChargeTimer = null; // スライムビームのチャージタイマー
        this.slimeBeamActive = false;   // スライムビームが現在アクティブか
        this.slimeBeamObject = null;    // スライムビームのビジュアル/当たり判定オブジェクト
        // その他、攻撃パターンの管理に必要なタイマーなど
        this.radialAttackTimer = null;
        this.targetedAttackTimer = null;
    }

    init(data) {
        super.init(data); // 親のinitを呼び出す
        this.isHpBelowHalf = false; // シーン開始時にリセット

        // 各種タイマーのリセット
        this.wallBlockSpawnTimers.lineA?.remove(); this.wallBlockSpawnTimers.lineA = null;
        this.wallBlockSpawnTimers.lineB?.remove(); this.wallBlockSpawnTimers.lineB = null;
        this.slimeBeamChargeTimer?.remove(); this.slimeBeamChargeTimer = null;
        this.radialAttackTimer?.remove(); this.radialAttackTimer = null;
        this.targetedAttackTimer?.remove(); this.targetedAttackTimer = null;

        this.slimeBeamActive = false;
        this.slimeBeamObject?.destroy(); this.slimeBeamObject = null;
    }

    /**
     * キングゴールドスライム固有のデータを初期化
     */
    initializeBossData() {
        console.log("--- Boss3Scene initializeBossData (King Gold Slime) ---");
        this.bossData = {
            // --- 基本情報 ---
            health: 20, //仮のHP
            textureKey: 'boss_king_slime_stand', // ★要アセット準備: キングスライムの立ち絵
            negativeKey: 'boss_king_slime_negative', // ★要アセット準備: ネガ反転画像
            voiceAppear: AUDIO_KEYS.VOICE_BOSS_APPEAR_GENERIC, // ★仮: 汎用登場ボイス (専用があれば差し替え)
            voiceDamage: AUDIO_KEYS.VOICE_BOSS_DAMAGE_GENERIC, // ★仮: 汎用被ダメージボイス
            voiceDefeat: AUDIO_KEYS.VOICE_BOSS_DEFEAT_GENERIC, // ★仮: 汎用撃破ボイス
            voiceRandom: [
                // AUDIO_KEYS.VOICE_KING_SLIME_RANDOM_1, // ★専用ランダムボイスがあれば
            ],
            bgmKey: AUDIO_KEYS.BGM_KING_SLIME, // ★仮: 専用BGMキー (なければ汎用)
            cutsceneText: 'VS キングゴールドスライム', // 登場時のカットシーンテキスト
            widthRatio: 0.8,  // 画面幅の80%を占める想定 (要調整)
            heightRatio: 0.33, // 画面高さの1/3を占める想定 (表示位置と合わせて調整)
            // キングスライムは動かないので moveRangeXRatio, moveDuration は不要か、特殊な意味を持たせる

            // --- 流れる壁ギミック関連 ---
            wallLineAYOffsetRatio: 0.28, // ボス本体の上端から壁ラインA中心までのYオフセット(画面高さ比、ボスにめり込むように調整)
            wallLineBYOffsetRatio: 0.32, // ボス本体の上端から壁ラインB中心までのYオフセット(画面高さ比、Aの下)
            wallBlockSpeed: 150,         // 壁ブロックの水平移動速度 (px/s)
            wallBlockSpawnInterval: 300, // 壁ブロックの生成間隔 (ms) - 各ラインごと
            wallBlockTexture: 'attack_brick_gold', // ★要アセット準備: 壁用の金色のブロックテクスチャ
            wallBlockScale: 0.1,         // 壁ブロックのスケール (テクスチャサイズによる)

            // --- 通常攻撃（前半・後半共通だが、後半で頻度等変更） ---
            radialAttackIntervalMin: 3000,
            radialAttackIntervalMax: 5000,
            radialAttackProjectileCount: 3, // 放射する弾の数
            radialAttackAngles: [70, 90, 110], // 放射角度 (真下90度)
            radialAttackProjectileSpeed: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 20,
            radialAttackProjectileTexture: 'attack_brick_slime_projectile', // ★要アセット準備: スライム弾テクスチャ
            radialAttackProjectileScale: 0.12,

            targetedAttackIntervalMin: 4000,
            targetedAttackIntervalMax: 6000,
            targetedAttackProjectileSpeed: DEFAULT_ATTACK_BRICK_VELOCITY_Y + 40, // 少し速め
            targetedAttackProjectileTexture: 'attack_brick_slime_projectile',
            targetedAttackProjectileScale: 0.15,
          //  targetedAttackMarkerTexture: 'target_marker_slime', // ★要アセット準備: ターゲットマーカー

            // --- HP半減後の強化・スライムビーム関連 ---
            後半_radialAttackIntervalMin: 2000, // 後半の放射攻撃間隔
            後半_radialAttackIntervalMax: 3500,
            後半_targetedAttackIntervalMin: 2500, // 後半のターゲット攻撃間隔
            後半_targetedAttackIntervalMax: 4000,

            slimeBeamChargeTime: 3000,  // スライムビームのチャージ時間 (ms)
            slimeBeamDuration: 2000,    // スライムビームの持続時間 (ms)
            slimeBeamWidthRatio: 0.33,  // ビームの横幅 (画面幅比)
            slimeBeamTextureKey: 'slime_beam_particle', // ★要アセット準備: ビーム用のスライム画像/パーティクル
            // (スライムビームの見た目に関する詳細パラメータもここに追加可能)
            slimeBeamFlashCount: 3,     // チャージ中の画面明滅回数

            // --- その他 ---
            backgroundKey: 'gameBackground_Boss3', // ★要アセット準備: ボス3専用背景
        };

        // CommonBossScene のプロパティも更新
        this.bossVoiceKeys = Array.isArray(this.bossData.voiceRandom) ? this.bossData.voiceRandom : [];
        console.log("King Gold Slime Specific Data Initialized:", this.bossData);
    }

    // createSpecificBoss をオーバーライドして、ボスの表示位置やスケールを調整
    createSpecificBoss() {
        super.createSpecificBoss(); // Common の処理で this.boss が生成・初期化される

        if (this.boss) {
            // キングスライムは動かないので Immovable は true のまま
            // 表示位置を画面上部に固定 (Y座標は bossData.heightRatio などから計算)
            const bossY = (this.gameHeight * (this.bossData.heightRatio || 0.33)) / 2; // 画像中心がY座標の半分
            this.boss.setPosition(this.gameWidth / 2, bossY);
            this.boss.setDepth(0); // 他のオブジェクトより奥か手前か

            // スケールは updateBossSize で bossData.widthRatio に基づいて調整されるはず
            // 必要ならここでさらに調整
            // this.updateBossSize(this.boss, this.bossData.textureKey, this.bossData.widthRatio);

            console.log(`Boss3 (King Gold Slime) created at (${this.boss.x}, ${this.boss.y}).`);

            // UIへの初期HP反映
            this.events.emit('updateBossHp', this.boss.getData('health'), this.boss.getData('maxHealth'));
            this.events.emit('updateBossNumber', this.currentBossIndex, this.totalBosses);
        } else {
            console.error("Boss3 (King Gold Slime) could not be created!");
        }
    }

    // --- ▼ 専用登場演出 (ゴゴゴ...) ▼ ---
    startIntroCutscene() {
        console.log("[Boss3Scene] Starting King Gold Slime's custom intro sequence...");
        this.playerControlEnabled = false;
        this.isBallLaunched = false;
        this.sound.stopAll();
        this.stopBgm(); // CommonのBGM再生を止める

        // ボスオブジェクトはまだ表示しない (または透明にしておく)
        if (this.boss) {
            this.boss.setVisible(false).setAlpha(0);
            if (this.boss.body) this.boss.disableBody(true, false);
        }

        // 1. 背景表示など (CommonBossSceneのcreateで行われるものも考慮)
        // this.setupBackground(); // もしCommonのcreateで呼ばれていない場合

        // 2. 「ゴゴゴゴ...」SE再生 (専用SEがあれば)
        // try { this.sound.play(AUDIO_KEYS.SE_KING_SLIME_RUMBLE); } catch(e) {}

        // 3. ボスのY座標とアルファをTweenでアニメーション
        const finalBossY = (this.gameHeight * (this.bossData.heightRatio || 0.33)) / 2;
        const startBossY = this.gameHeight + this.boss.displayHeight; // 画面下外から
        if (this.boss) {
            this.boss.setPosition(this.gameWidth / 2, startBossY);
            this.boss.setVisible(true); // 見えるようにしてからTween開始

            this.tweens.add({
                targets: this.boss,
                y: finalBossY,
                alpha: 1,
                duration: 2500, // 2.5秒かけて競り上がる (要調整)
                ease: 'Power1', // ゆっくりと力強く
                onComplete: () => {
                    console.log("[Boss3Scene] King Gold Slime intro animation complete.");
                    // CommonBossSceneのフュージョン演出はスキップし、直接戦闘開始処理へ
                    // ただし、カットシーンテキスト表示などは行いたい
                    this.showKingSlimeVSOverlay();
                }
            });
        } else {
            console.error("Boss object not available for intro animation!");
            // エラー発生時は通常の戦闘開始処理へフォールバック
            this.finalizeBossAppearanceAndStart();
        }
    }

    showKingSlimeVSOverlay() {
        // CommonBossSceneのstartIntroCutsceneのロジックを参考にVS表示
        try { this.sound.play(AUDIO_KEYS.SE_CUTSCENE_START); } catch(e) {}
        // ボス登場ボイス再生
        if (this.bossData.voiceAppear) {
             try { this.sound.play(this.bossData.voiceAppear); } catch(e) {}
        }


        const overlay = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.75)
            .setOrigin(0,0).setDepth(900);
        const bossImage = this.add.image(this.gameWidth / 2, this.gameHeight * 0.3, this.bossData.textureKey) // 少し上に表示
            .setOrigin(0.5, 0.5).setDepth(901).setScale(0.6); // 少し小さめに表示
        const textContent = this.bossData.cutsceneText;
        const fontSize = this.calculateDynamicFontSize(70);
        const textStyle = { fontSize: `${fontSize}px`, fill: '#FFD700', stroke: '#000000', strokeThickness: 6, fontFamily: 'MyGameFont, sans-serif', align: 'center' };
        const vsText = this.add.text(this.gameWidth / 2, this.gameHeight * 0.6, textContent, textStyle)
            .setOrigin(0.5, 0).setDepth(902);

        this.time.delayedCall(CUTSCENE_DURATION, () => {
            overlay.destroy();
            bossImage.destroy();
            vsText.destroy();
            // ボス本体の物理ボディ有効化と戦闘開始
            this.finalizeBossAppearanceAndStart();
        }, [], this);
    }

    // CommonBossSceneのfinalizeBossAppearanceAndStartをオーバーライドするか、
    // この中で直接 this.startGameplay() を呼ぶ
    finalizeBossAppearanceAndStart() {
        if (!this.boss) return;
        console.log("[Boss3Scene] Finalizing King Slime appearance and starting gameplay.");
        this.boss.setAlpha(1).setVisible(true); // 最終状態を確定
        if (this.boss.body) {
            this.boss.enableBody(true, this.boss.x, this.boss.y, true, true);
            this.boss.body.updateFromGameObject();
        }
        // ボス戦BGM再生
        this.playBossBgm();
        // 戦闘開始処理
        this.time.delayedCall(GAMEPLAY_START_DELAY, this.startGameplay, [], this);
    }
    // --- ▲ 専用登場演出 ▲ ---


    // startSpecificBossMovement: キングスライムは動かないので、このメソッドは空か、
    // 流れる壁や通常攻撃の初期タイマー設定を行う場所にしても良い。
    startSpecificBossMovement() {
        console.log("--- Boss3Scene startSpecificBossMovement (King Slime is static) ---");
        if (!this.boss || !this.boss.active) return;

        // キングスライムは動かないので、CommonBossSceneの移動Tweenは不要。
        // ここで流れる壁の生成を開始する
        this.startWallBlockSpawners();

        // 通常攻撃のタイマーを開始
        this.scheduleNextRadialAttack();
        this.scheduleNextTargetedAttack();
    }

    // updateSpecificBossBehavior: 各種攻撃の実行管理、HP半減時の処理など
    updateSpecificBossBehavior(time, delta) {
        if (!this.playerControlEnabled || !this.boss || !this.boss.active || this.bossDefeated || this.isGameOver) {
            return;
        }

        // --- 流れる壁ブロックの画面外処理 ---
        this.cleanupWallBlocks(this.attackBricks); // attackBricksグループを渡す

        // --- HP半減チェック ---
        if (!this.isHpBelowHalf && this.boss.getData('health') <= this.bossData.health / 2) {
            this.isHpBelowHalf = true;
            this.triggerHpHalfEffect();
        }

        // --- スライムビーム関連の更新 (もしチャージ中や発動中なら) ---
        if (this.slimeBeamActive) {
            // this.updateSlimeBeamVisuals(); // ビームの見た目の更新など
        }

        // 通常攻撃のタイマーは startSpecificBossMovement や各攻撃メソッドの最後で再スケジュールされる
    }

    // --- ▼ 流れる壁ギミック ▼ ---
    startWallBlockSpawners() {
        const spawnInterval = this.bossData.wallBlockSpawnInterval || 300;

        // 壁ラインA (右から左)
        this.wallBlockSpawnTimers.lineA?.remove();
        this.wallBlockSpawnTimers.lineA = this.time.addEvent({
            delay: spawnInterval,
            callback: () => this.spawnWallBlock('A'),
            callbackScope: this,
            loop: true
        });

        // 壁ラインB (左から右)
        this.wallBlockSpawnTimers.lineB?.remove();
        this.wallBlockSpawnTimers.lineB = this.time.addEvent({
            delay: spawnInterval,
            callback: () => this.spawnWallBlock('B'),
            callbackScope: this,
            loop: true
        });
        console.log("Wall block spawners started.");
    }

    spawnWallBlock(line) { // line は 'A' または 'B'
        if (!this.attackBricks || !this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) {
            return;
        }

        const texture = this.bossData.wallBlockTexture || 'attackBrick';
        const scale = this.bossData.wallBlockScale || 0.1;
        const speed = this.bossData.wallBlockSpeed || 150;

        let spawnX, velocityX, spawnY;

        if (line === 'A') { // 右から左へ、上層
            spawnX = this.gameWidth + 50; // 画面右外
            velocityX = -speed;
            // ボスY座標とテクスチャ高さを考慮してY座標を決定
            const bossTopY = this.boss.y - (this.boss.displayHeight / 2);
            spawnY = bossTopY + (this.gameHeight * (this.bossData.wallLineAYOffsetRatio || 0.28));
        } else { // 左から右へ、下層
            spawnX = -50; // 画面左外
            velocityX = speed;
            const bossTopY = this.boss.y - (this.boss.displayHeight / 2);
            spawnY = bossTopY + (this.gameHeight * (this.bossData.wallLineBYOffsetRatio || 0.32));
        }

        const wallBlock = this.attackBricks.create(spawnX, spawnY, texture);
        if (wallBlock) {
            wallBlock.setScale(scale);
            wallBlock.setVelocityX(velocityX);
            wallBlock.setData('blockType', 'wall'); // 壁であるフラグ
            wallBlock.setData('wallLine', line);    // どちらのラインか
            if (wallBlock.body) {
                wallBlock.body.setAllowGravity(false);
                wallBlock.body.setCollideWorldBounds(false); // 画面端での反射は不要
            }
        }
    }

    cleanupWallBlocks(attackBricksGroup) {
        if (!attackBricksGroup) return;
        attackBricksGroup.getChildren().forEach(block => {
            if (block.getData('blockType') === 'wall') {
                if (block.x < -block.displayWidth || block.x > this.gameWidth + block.displayWidth) {
                    block.destroy();
                }
            }
            // 通常の攻撃ブロックの画面外処理は CommonBossScene の updateAttackBricks で行われる
        });
    }
    // --- ▲ 流れる壁ギミック ▲ ---


    // --- ▼ 通常攻撃パターン ▼ ---
    scheduleNextRadialAttack() {
        this.radialAttackTimer?.remove();
        const minInterval = this.isHpBelowHalf ? this.bossData.後半_radialAttackIntervalMin : this.bossData.radialAttackIntervalMin;
        const maxInterval = this.isHpBelowHalf ? this.bossData.後半_radialAttackIntervalMax : this.bossData.radialAttackIntervalMax;
        this.radialAttackTimer = this.time.delayedCall(Phaser.Math.Between(minInterval, maxInterval), this.spawnRadialAttack, [], this);
    }

    spawnRadialAttack() {
        if (!this.attackBricks || !this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) {
            this.scheduleNextRadialAttack(); return;
        }
        console.log("King Slime: Spawning Radial Attack");
        const count = this.bossData.radialAttackProjectileCount;
        const angles = this.bossData.radialAttackAngles; // 例: [70, 90, 110]
        const speed = this.bossData.radialAttackProjectileSpeed;
        const texture = this.bossData.radialAttackProjectileTexture;
        const scale = this.bossData.radialAttackProjectileScale;

        angles.forEach(angle => {
            const projectile = this.attackBricks.create(this.boss.x, this.boss.y + this.boss.displayHeight / 3, texture);
            if (projectile) {
                projectile.setScale(scale);
                this.physics.velocityFromAngle(angle, speed, projectile.body.velocity);
                projectile.setData('blockType', 'projectile'); // 通常の攻撃弾フラグ
                if (projectile.body) projectile.body.setAllowGravity(false).setCollideWorldBounds(true); // 画面端で跳ね返る
            }
        });
        this.scheduleNextRadialAttack();
    }

    scheduleNextTargetedAttack() {
        this.targetedAttackTimer?.remove();
        const minInterval = this.isHpBelowHalf ? this.bossData.後半_targetedAttackIntervalMin : this.bossData.targetedAttackIntervalMin;
        const maxInterval = this.isHpBelowHalf ? this.bossData.後半_targetedAttackIntervalMax : this.bossData.targetedAttackIntervalMax;
        this.targetedAttackTimer = this.time.delayedCall(Phaser.Math.Between(minInterval, maxInterval), this.spawnTargetedAttack, [], this);
    }

    // Boss3Scene.js の spawnTargetedAttack メソッド内 (修正案)
spawnTargetedAttack() {
    if (!this.attackBricks || !this.boss || !this.boss.active || !this.paddle || this.isGameOver || this.bossDefeated) {
        this.scheduleNextTargetedAttack(); return;
    }
    console.log("King Slime: Spawning Targeted Attack");
    const targetX = this.paddle.x;
    const spawnY = this.boss.y + this.boss.displayHeight / 2;
    const speed = this.bossData.targetedAttackProjectileSpeed;
    const texture = this.bossData.targetedAttackProjectileTexture;
    const scale = this.bossData.targetedAttackProjectileScale;

    // --- ▼ 予兆マーカー表示 (プログラム描画) ▼ ---
    const markerRadius = this.paddle.displayWidth * 0.6; // パドル幅の60%程度の円形マーカー
    const markerY = this.paddle.y; // パドルのY座標あたりに表示
    const marker = this.add.graphics();
    marker.fillStyle(0xff0000, 0.25); // 薄い赤色 (alpha 0.25)
    marker.fillCircle(targetX, markerY, markerRadius);
    marker.setDepth(0); // 適切な深度に設定 (ボールやパドルより奥、背景より手前など)

    this.time.delayedCall(700, () => marker.destroy()); // 0.7秒で消滅
    // --- ▲ 予兆マーカー表示 ▲ ---

    this.time.delayedCall(500, () => { // 少し遅れて発射 (マーカー表示時間との兼ね合い)
        if (!this.attackBricks || !this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) return;
        const projectile = this.attackBricks.create(this.boss.x, spawnY, texture);
        if (projectile) {
            projectile.setScale(scale);
            const angleToTarget = Phaser.Math.Angle.Between(this.boss.x, spawnY, targetX, this.gameHeight);
            this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angleToTarget), speed, projectile.body.velocity);
            projectile.setData('blockType', 'projectile');
            if (projectile.body) projectile.body.setAllowGravity(false).setCollideWorldBounds(true);
        }
    }, [], this);
    this.scheduleNextTargetedAttack();
}
    }
    // --- ▲ 通常攻撃パターン ▲ ---


    // --- ▼ HP半減時処理＆スライムビーム ▼ ---
    triggerHpHalfEffect() {
        console.log("King Slime: HP below half! Activating phase 2 behaviors.");
        // 画面フラッシュ
        this.cameras.main.flash(300, 200, 200, 50); // 赤みがかったフラッシュ

        // (通常攻撃の頻度変更は scheduleNext... メソッド内の isHpBelowHalf フラグで対応済み)

        // スライムビーム攻撃を定期的に行うようにタイマー設定
        this.scheduleSlimeBeam();
    }

    scheduleSlimeBeam() {
        this.slimeBeamChargeTimer?.remove();
        // スライムビームの間隔は固定でもランダムでも (ここでは仮に固定＋初回ディレイ)
        const beamInterval = 10000; // 10秒ごと
        const initialDelay = 3000; // 最初のビームまでの遅延
        this.slimeBeamChargeTimer = this.time.delayedCall(this.isHpBelowHalf ? initialDelay : beamInterval, this.startSlimeBeamCharge, [], this);
    }

    startSlimeBeamCharge() {
        if (!this.boss || !this.boss.active || this.isGameOver || this.bossDefeated) {
            this.scheduleSlimeBeam(); return;
        }
        console.log("King Slime: Starting Slime Beam Charge!");
        this.slimeBeamActive = true; // チャージ開始でフラグを立てる

        // チャージ音SE
        // try { this.sound.play(AUDIO_KEYS.SE_SLIME_BEAM_CHARGE); } catch(e) {}

        // 画面赤明滅演出
        for (let i = 0; i < (this.bossData.slimeBeamFlashCount || 3); i++) {
            this.time.delayedCall(i * 800, () => { // 0.8秒ごとに明滅
                 if (!this.slimeBeamActive) return; // チャージがキャンセルされた場合など
                 this.cameras.main.flash(200, 255, 50, 50, false); // 赤くフラッシュ
            });
        }

        // --- ▼ スライムビーム予兆マーカー表示 (プログラム描画) ▼ ---
    const beamWidth = this.gameWidth * (this.bossData.slimeBeamWidthRatio || 0.33);
    const beamX = this.gameWidth / 2;
    const beamMarkerY = this.boss.y + this.boss.displayHeight / 2; // ボス下端から
    const beamMarkerHeight = this.gameHeight - beamMarkerY;     // 画面下端まで

    // 既存のビームオブジェクトがあれば破棄
    this.slimeBeamObject?.destroy();

    this.slimeBeamObject = this.add.rectangle(
        beamX,
        beamMarkerY + beamMarkerHeight / 2, // 矩形の中心Y
        beamWidth,
        beamMarkerHeight,
        0xff0000, // 赤色
        0.3       // 薄いアルファ値 (例: 0.3)
    );
    this.slimeBeamObject.setOrigin(0.5, 0.5).setDepth(1); // 適切な深度
    console.log("Slime Beam charge marker (rectangle) displayed.");
    // --- ▲ スライムビーム予兆マーカー表示 ▲ ---
        // チャージ時間後にビーム発射
        this.time.delayedCall(this.bossData.slimeBeamChargeTime || 3000, this.fireSlimeBeam, [], this);
    }

    fireSlimeBeam() {
        if (!this.boss || !this.boss.active || !this.slimeBeamActive || this.isGameOver || this.bossDefeated) {
            this.slimeBeamActive = false;
            this.slimeBeamObject?.destroy(); this.slimeBeamObject = null;
            if (!this.isGameOver && !this.bossDefeated) this.scheduleSlimeBeam();
            return;
        }
        console.log("King Slime: Firing Slime Beam!");
        // 予兆マーカーがあった場所に実際のビームエフェクトを生成
        // (今回はマーカーをそのままビームとして扱うので、見た目を変えるなど)
        if (this.slimeBeamObject) {
            this.slimeBeamObject.setFillStyle(0x00ff00, 0.6); // 緑色のビームに変化
            // ここでパーティクルや複数スプライトのTweenアニメーションを開始
            // (例: Tiny PhaserやPhaserのパーティクルエミッターを使用)
        }

        // ビーム放出音SE
        // try { this.sound.play(AUDIO_KEYS.SE_SLIME_BEAM_FIRE); } catch(e) {}

        // 当たり判定は slimeBeamObject (Rectangle) を使う
        // updateメソッドなどで、この slimeBeamObject とパドル・ボールの overlap をチェックする

        // 持続時間後にビーム終了
        this.time.delayedCall(this.bossData.slimeBeamDuration || 2000, this.endSlimeBeam, [], this);
    }

    endSlimeBeam() {
        console.log("King Slime: Slime Beam Ended.");
        this.slimeBeamActive = false;
        this.slimeBeamObject?.destroy();
        this.slimeBeamObject = null;

        // 次のビームを予約 (戦闘中なら)
        if (!this.isGameOver && !this.bossDefeated) {
            this.scheduleSlimeBeam();
        }
    }
    // --- ▲ HP半減時処理＆スライムビーム ▲ ---


    // applyBossDamage をオーバーライドしてHP半減を検知
    applyBossDamage(bossInstance, damageAmount, source = "Unknown") {
        const hpBefore = bossInstance.getData('health');
        super.applyBossDamage(bossInstance, damageAmount, source); // 親のダメージ処理
        const hpAfter = bossInstance.getData('health');

        if (!this.isHpBelowHalf && hpAfter <= this.bossData.health / 2 && hpBefore > this.bossData.health / 2) {
            // HPが初めて半分以下になった瞬間
            this.isHpBelowHalf = true;
            this.triggerHpHalfEffect();
        }
    }

    // ボールと攻撃ブロックの衝突処理 (CommonBossSceneから呼ばれる)
    // CommonBossSceneの hitAttackBrick や handleBallAttackBrickOverlap を確認し、
    // blockType に応じた反射を実装する。
    // (CommonBossScene側でこの分岐を実装する方が良いかもしれない)

    // 例: CommonBossSceneのhitAttackBrickをオーバーライドする場合
    /*
    hitAttackBrick(brick, ball) {
        if (!brick?.active || !ball?.active) return;

        const blockType = brick.getData('blockType');

        if (blockType === 'wall') {
            // 壁ブロックの場合：強制的に斜め下に反射
            console.log("Ball hit WALL component. Forcing downward reflection.");
            // Y速度を必ず正に、X速度は左右ランダムかボールのX速度を維持
            let newVx = ball.body.velocity.x * 0.8; // 少し減速させるなど
            let newVy = Math.abs(ball.body.velocity.y) * 0.5 + 100; // 必ず下向きで最低速度保証
            if (Math.abs(newVx) < 50) newVx = Phaser.Math.Between(-100, 100); // Xが遅すぎたらランダムに

            ball.setVelocity(newVx, newVy);
            this.destroyAttackBrickAndDropItem(brick); // アイテムドロップありで破壊
        } else if (blockType === 'projectile') {
            // 通常の攻撃弾の場合：CommonBossSceneのデフォルトの反射ロジック
            console.log("Ball hit PROJECTILE component. Using default reflection.");
            super.hitAttackBrick(brick, ball); // 親のメソッドを呼ぶ
        } else {
            // 未定義のタイプの場合はデフォルト処理
            super.hitAttackBrick(brick, ball);
        }
    }
    */

    // shutdownScene でタイマーなどをクリア
    shutdownScene() {
        super.shutdownScene(); // 親のシャットダウン処理を呼ぶ
        this.wallBlockSpawnTimers.lineA?.remove();
        this.wallBlockSpawnTimers.lineB?.remove();
        this.slimeBeamChargeTimer?.remove();
        this.radialAttackTimer?.remove();
        this.targetedAttackTimer?.remove();
        this.slimeBeamObject?.destroy();

        this.wallBlockSpawnTimers = { lineA: null, lineB: null };
        this.slimeBeamChargeTimer = null;
        this.radialAttackTimer = null;
        this.targetedAttackTimer = null;
        this.slimeBeamObject = null;
    }
}
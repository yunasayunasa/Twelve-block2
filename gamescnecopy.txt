// GameScene.js (完全なコード - hitPaddleとhandleWorldBoundsを修正)

// 定数と型をインポート
import {
    PADDLE_WIDTH_RATIO, PADDLE_HEIGHT, PADDLE_Y_OFFSET, BALL_RADIUS, PHYSICS_BALL_RADIUS,
    BALL_INITIAL_VELOCITY_Y, BALL_INITIAL_VELOCITY_X_RANGE, BRICK_ROWS, BRICK_COLS,
    BRICK_WIDTH_RATIO, BRICK_HEIGHT, BRICK_SPACING, BRICK_OFFSET_TOP,
    MAX_DURABLE_HITS, DURABLE_BRICK_COLOR, DURABLE_BRICK_HIT_DARKEN,
    INDESTRUCTIBLE_BRICK_COLOR, MAX_STAGE, BRICK_COLORS, BRICK_MARKED_COLOR,
    BAISRAVA_DROP_RATE, POWERUP_SIZE, POWERUP_SPEED_Y, POWERUP_TYPES,
    ALL_POSSIBLE_POWERUPS, MAKORA_COPYABLE_POWERS, POWERUP_DURATION,
    BIKARA_YANG_COUNT_MAX, INDARA_MAX_HOMING_COUNT, NORMAL_BALL_SPEED,
    BALL_SPEED_MODIFIERS, SINDARA_ATTRACTION_DELAY, SINDARA_ATTRACTION_FORCE,
    SINDARA_MERGE_DURATION, SINDARA_POST_MERGE_PENETRATION_DURATION,
    VAJRA_GAUGE_MAX, VAJRA_GAUGE_INCREMENT, VAJRA_DESTROY_COUNT,
    MAKIRA_ATTACK_INTERVAL, MAKIRA_BEAM_SPEED, MAKIRA_BEAM_WIDTH,
    MAKIRA_BEAM_HEIGHT, MAKIRA_BEAM_COLOR, MAKIRA_FAMILIAR_OFFSET,
    MAKIRA_FAMILIAR_SIZE, POWERUP_ICON_KEYS, AUDIO_KEYS, SYMBOL_PATTERNS
} from './constants.js';

export default class GameScene extends Phaser.Scene {
     constructor() {
        super('GameScene');
        // --- プロパティ初期化 ---
        this.paddle = null;
        this.balls = null; // Phaser.Physics.Arcade.Group
        this.bricks = null; // Phaser.Physics.Arcade.StaticGroup
        this.powerUps = null; // Phaser.Physics.Arcade.Group
        this.familiars = null; // Phaser.Physics.Arcade.Group (マキラ用)
        this.makiraBeams = null; // Phaser.Physics.Arcade.Group (マキラ用)

        this.lives = 0;
        this.score = 0;
        this.currentStage = 1;
        this.chaosSettings = { count: 4, rate: 0.5 }; // デフォルト値

        this.isBallLaunched = false;
        this.isStageClearing = false;
        this.isGameOver = false;

        // コライダー参照
        this.ballPaddleCollider = null;
        this.ballBrickCollider = null;
        this.ballBrickOverlap = null;
        this.ballBallCollider = null;
        this.makiraBeamBrickOverlap = null;

        // パワーアップタイマー
        this.powerUpTimers = {}; // { [type]: Phaser.Time.TimerEvent }
        this.sindaraAttractionTimer = null;
        this.sindaraMergeTimer = null;
        this.sindaraPenetrationTimer = null;
        this.makiraAttackTimer = null;

        // 各種フラグ・ゲージ
        this.isVajraSystemActive = false;
        this.vajraGauge = 0;
        this.isMakiraActive = false;

        // その他
        this.stageDropPool = []; // 現在のステージでドロップする可能性のあるパワーアップ種類
        this.gameOverText = null;
        this.bgImage = null;
        this.gameWidth = 0;
        this.gameHeight = 0;
        this.currentBgm = null; // BGM管理用
        this.lastPlayedVoiceTime = {}; // ボイス再生抑制用 { [key]: time }
        this.voiceThrottleTime = 500; // ボイス再生の最小間隔(ms)
     }

    init(data) {
        console.log("GameScene Init Start");
        console.log("Received data in GameScene init:", data); // ★ 受け取ったデータ全体をログ出力
        // タイトルシーンからのデータ受け取り
        if (data && data.chaosSettings) {
            this.chaosSettings.count = data.chaosSettings.count;
            this.chaosSettings.rate = data.chaosSettings.ratePercent / 100; // %から少数に変換
            console.log('Chaos Settings Received:', this.chaosSettings);
        } else {
            console.log('No Chaos Settings received, using defaults:', this.chaosSettings);
            this.chaosSettings = { count: 4, rate: 0.5 }; // フォールバック
        }

        // --- ゲーム状態リセット ---
        this.lives = 3;
        this.score = 0;
        this.currentStage = 1;
        this.isBallLaunched = false;
        this.isStageClearing = false;
        this.isGameOver = false;
        this.isVajraSystemActive = false;
        this.vajraGauge = 0;
        this.isMakiraActive = false;
        this.stageDropPool = [];
        this.bgImage = null; // 背景はcreateで設定
        this.currentBgm = null; // BGMもcreateで設定
        this.lastPlayedVoiceTime = {};

        // --- タイマー解除 ---
        Object.values(this.powerUpTimers).forEach(timer => { if (timer) timer.remove(); });
        this.powerUpTimers = {};
        if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null;
        if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); this.sindaraMergeTimer = null;
        if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); this.sindaraPenetrationTimer = null;
        if (this.makiraAttackTimer) this.makiraAttackTimer.remove(); this.makiraAttackTimer = null;

        console.log("GameScene Init End");
    }

    // preload は BootScene で行うため、ここでは通常不要
    preload() {
        console.log("GameScene Preload (nothing to load here usually)");
    }

    create() {
        console.log("GameScene Create Start");
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
    
        // --- ▼ setBackgroundColor を元のシンプルな呼び出しに戻す ▼ ---
        // (初回起動時は this.cameras.main が存在するはず)
        this.cameras.main.setBackgroundColor('#222');
        // --- ▲ setBackgroundColor を元のシンプルな呼び出しに戻す ▲ ---
    
        // --- ▼ 2回目以降のための再初期化ロジックは削除し、初回起動時のコードに戻す ▼ ---
        // (例: オブジェクトの破棄確認などは不要)
        const initialBgKey = this.getBackgroundKeyForStage(this.currentStage);
        this.bgImage = this.add.image(this.gameWidth / 2, this.gameHeight / 2, initialBgKey)
            .setOrigin(0.5, 0.5)
            .setDepth(-1);
        this.resizeBackground();
    
        this.updateBgm();

        // 初期UI更新 (UISceneの準備ができてから)
        this.time.delayedCall(50, () => {
            console.log("Delayed call: Updating initial UI.");
            if (this.scene.isActive('UIScene')) {
                this.events.emit('updateLives', this.lives);
                this.events.emit('updateScore', this.score);
                this.events.emit('updateStage', this.currentStage);
                if (this.isVajraSystemActive) {
                    this.events.emit('activateVajraUI', this.vajraGauge, VAJRA_GAUGE_MAX);
                } else {
                    this.events.emit('deactivateVajraUI');
                }
                this.events.emit('updateDropPoolUI', this.stageDropPool); // 初期のドロッププール表示
            }
        });

        // 物理ワールド設定
        this.physics.world.setBoundsCollision(true, true, true, false); // 上左右の壁と衝突、下は通過
        // 物理境界イベントリスナー
        this.physics.world.on('worldbounds', this.handleWorldBounds, this);

        // パドル作成
        this.paddle = this.physics.add.image(this.scale.width / 2, this.scale.height - PADDLE_Y_OFFSET, 'whitePixel')
            .setTint(0xffff00) // 黄色
            .setImmovable(true)
            .setData('originalWidthRatio', PADDLE_WIDTH_RATIO); // サイズ調整用に比率を保持
        this.updatePaddleSize(); // 初期サイズ設定

        // ボールグループ作成
        this.balls = this.physics.add.group({
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true
        });
        // 初期ボール作成 (パドルの上)
        this.createAndAddBall(this.paddle.x, this.paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS);

        // ブロックグループ作成 (setupStage内で)
        this.bricks = this.physics.add.staticGroup(); // 初回は空で作成

        // パワーアップグループ作成
        this.powerUps = this.physics.add.group();

        // マキラ用グループ作成
        this.familiars = this.physics.add.group();
        this.makiraBeams = this.physics.add.group();

        // ステージ初期設定 (ブロック生成、ドロッププール決定)
        this.setupStage();

        // ゲームオーバーテキスト (最初は非表示)
        this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, '全滅した...\nタップで戻る', { fontSize: '48px', fill: '#f00', align: 'center' })
            .setOrigin(0.5)
            .setVisible(false)
            .setDepth(1); // 最前面に

        // 衝突判定設定
        this.setColliders();

        // パワーアップ取得判定
        this.physics.add.overlap(this.paddle, this.powerUps, this.collectPowerUp, null, this);

        // 入力イベント (重複防止offは残す)
    this.input.off('pointermove');
    this.input.off('pointerdown');
        this.input.on('pointermove', (pointer) => {
            if (!this.isGameOver && this.lives > 0 && this.paddle && !this.isStageClearing) {
                const targetX = pointer.x;
                const halfWidth = this.paddle.displayWidth / 2;
                // パドルが画面外に出ないように制限
                const clampedX = Phaser.Math.Clamp(targetX, halfWidth, this.scale.width - halfWidth);
                this.paddle.x = clampedX;
                // ボール発射前はボールもパドルに追従
                if (!this.isBallLaunched) {
                    this.balls.getChildren().forEach(ball => {
                        if (ball.active) ball.x = clampedX;
                    });
                }
            }
        });

        // ポインターダウン (ボール発射 / ゲームオーバーリスタート)
        this.input.on('pointerdown', () => {
            console.log("Pointer down event detected.");
            if (this.isGameOver && this.gameOverText?.visible) {
                 console.log("Game Over detected on pointer down, reloading page...");
                 try {
                     this.returnToTitle(); // リロード処理を呼び出す
                 } catch(e) {
                      console.error("Error calling returnToTitle:", e);
                 }
            } else if (this.lives > 0 && !this.isBallLaunched && !this.isStageClearing) {
                 this.launchBall();
            } else {
                 console.log("Pointer down ignored.");
            }
        });


        // リサイズイベント
        this.scale.on('resize', this.handleResize, this);

        // シーン終了イベント
        this.events.on('shutdown', this.shutdownScene, this);

        console.log("GameScene Create End");
    }

    // ステージ番号に応じた背景画像のキーを返す
    getBackgroundKeyForStage(stage) {
        if (stage >= 7 && stage <= 12) { return 'gameBackground3'; }
        else if (stage >= 1 && stage <= 6) { return 'gameBackground2'; }
        else { return 'gameBackground'; } // デフォルトまたはステージ1未満(ありえないはず)
    }

    // ステージ番号に応じたBGMのキーを返す
    getBgmKeyForStage(stage) {
        if (stage >= 7 && stage <= 12) { return AUDIO_KEYS.BGM2; }
        else { return AUDIO_KEYS.BGM1; }
    }

    // 現在のステージに合わせてBGMを更新（必要なら再生開始・切り替え）
    updateBgm() {
        const newBgmKey = this.getBgmKeyForStage(this.currentStage);
        if (!this.currentBgm || this.currentBgm.key !== newBgmKey) {
            this.stopBgm(); // 現在のBGMを停止
            console.log(`Playing BGM for stage ${this.currentStage}: ${newBgmKey}`);
            this.currentBgm = this.sound.add(newBgmKey, { loop: true, volume: 0.5 });
            this.currentBgm.play();
        }
    }

    // 現在のBGMを停止・破棄
    stopBgm() {
        if (this.currentBgm) {
            console.log("Stopping current BGM:", this.currentBgm.key);
            this.currentBgm.stop();
            this.sound.remove(this.currentBgm); // キャッシュからも削除
            this.currentBgm = null;
        }
    }

    // 背景画像をリサイズして中央に配置、半透明にする
    resizeBackground() {
        if (!this.bgImage) return;
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const texture = this.textures.get(this.bgImage.texture.key);
        if (!texture || !texture.source || texture.source.length === 0) return; // テクスチャ未ロードの場合

        const imageWidth = texture.source[0].width;
        const imageHeight = texture.source[0].height;

        // アスペクト比を維持しつつ、画面全体を覆うようにスケールを計算 (短い辺に合わせる)
        const scaleX = gameWidth / imageWidth;
        const scaleY = gameHeight / imageHeight;
        const scale = Math.max(scaleX, scaleY); // ここはmaxで全体を覆う

        this.bgImage.setScale(scale);
        this.bgImage.setPosition(gameWidth / 2, gameHeight / 2);
        this.bgImage.setAlpha(0.7); // 半透明にする
    }

    // パドルサイズを画面幅に合わせて更新
    updatePaddleSize() {
        if (!this.paddle) return;
        const newWidth = this.scale.width * this.paddle.getData('originalWidthRatio');
        this.paddle.setDisplaySize(newWidth, PADDLE_HEIGHT);
        this.paddle.refreshBody(); // 物理ボディのサイズも更新
        // サイズ変更後にパドルが画面外にはみ出ないように位置を再調整
        const halfWidth = this.paddle.displayWidth / 2;
        this.paddle.x = Phaser.Math.Clamp(this.paddle.x, halfWidth, this.scale.width - halfWidth);
    }

    // 画面リサイズ時の処理
    handleResize(gameSize, baseSize, displaySize, resolution) {
        console.log("Game resized.");
        this.gameWidth = gameSize.width;
        this.gameHeight = gameSize.height;
        this.updatePaddleSize();
        this.resizeBackground();
        // UISceneにもリサイズを通知
        if (this.scene.isActive('UIScene')) {
            this.events.emit('gameResize');
        }
    }

    // ステージ開始時のセットアップ (ブロック生成、ドロッププール決定)
    setupStage() {
        console.log(`Setting up Stage ${this.currentStage}`);

        // --- ドロッププール決定 ---
        const possibleDrops = [...ALL_POSSIBLE_POWERUPS]; // コピーを作成
        const shuffledPool = Phaser.Utils.Array.Shuffle(possibleDrops);
        // chaosSettings.count の数だけランダムに選択
        this.stageDropPool = shuffledPool.slice(0, this.chaosSettings.count);
        console.log(`Stage ${this.currentStage} Drop Pool (${this.chaosSettings.count} types):`, this.stageDropPool);
        // UIにドロッププールを通知
        this.events.emit('updateDropPoolUI', this.stageDropPool);

        // --- ブロック生成 ---
        this.createBricks();
    }

    // メインループ (毎フレーム呼ばれる)
    update() {
        // ゲームオーバー中、ステージクリア中、ライフ0の場合は何もしない
        if (this.isGameOver || this.isStageClearing || this.lives <= 0) {
            return;
        }

        let activeBallCount = 0;
        let sindaraBalls = []; // シンデレラ能力中のボールを追跡

        // --- ボールごとの処理 ---
        this.balls.getChildren().forEach(ball => {
            if (ball.active) {
                activeBallCount++;

                // ボールが画面下に落ちた判定
                if (this.isBallLaunched && !this.isStageClearing && ball.y > this.gameHeight + ball.displayHeight) {
                    if (ball.getData('isAnilaActive')) {
                        // アニラ能力発動中ならバウンド
                        this.triggerAnilaBounce(ball);
                    } else {
                        // 通常はボール消滅
                        console.log("Ball went out of bounds.");
                        ball.setActive(false).setVisible(false);
                        if (ball.body) ball.body.enable = false; // 物理演算も無効化
                    }
                }

                // シンデレラ能力関連の処理
                const lastPower = ball.getData('lastActivatedPower');
                if (lastPower === POWERUP_TYPES.SINDARA) {
                    sindaraBalls.push(ball);
                    if (ball.getData('isAttracting')) {
                        // 引き寄せ中の場合、パートナーに向かって移動
                        this.updateSindaraAttraction(ball);
                    }
                }

                // ボールの速度が極端になりすぎないように調整
                if (ball.body && this.isBallLaunched) {
                    const minSpeed = NORMAL_BALL_SPEED * 0.1; // 最低速度
                    const maxSpeed = NORMAL_BALL_SPEED * 5;   // 最高速度
                    const speed = ball.body.velocity.length();
                    if (speed < minSpeed && speed > 0) {
                        // 遅すぎる場合は最低速度まで加速
                        ball.body.velocity.normalize().scale(minSpeed);
                    } else if (speed > maxSpeed) {
                        // 速すぎる場合は最高速度まで減速
                        ball.body.velocity.normalize().scale(maxSpeed);
                    }
                }
            }
        });

        // シンデレラボールが1つだけになったら能力解除
        if (sindaraBalls.length === 1 && this.balls.getTotalUsed() > 1) { // 他のボールも存在する場合
            const remainingBall = sindaraBalls[0];
            if (remainingBall.getData('lastActivatedPower') === POWERUP_TYPES.SINDARA) {
                console.log("Deactivating Sindara power (only one Sindara ball left).");
                this.deactivatePowerByType(POWERUP_TYPES.SINDARA);
            }
        }

        // アクティブなボールが0個になったらライフ減少処理へ
        if (activeBallCount === 0 && this.isBallLaunched && !this.isStageClearing && this.lives > 0) {
            console.log("No active balls left, losing life.");
            this.loseLife();
            return; // loseLife内で状態が変わる可能性があるので一旦抜ける
        }

        // --- パワーアップアイテムの処理 ---
        this.powerUps.children.each(powerUp => {
            if (powerUp.active && powerUp.y > this.gameHeight + POWERUP_SIZE) {
                powerUp.destroy(); // 画面外に出たら削除
            }
        });

        // --- マキラ能力中の処理 ---
        if (this.isMakiraActive && this.paddle && this.familiars) {
            // ファミリアをパドルの左右に追従させる
            const paddleX = this.paddle.x;
            const familiarY = this.paddle.y - PADDLE_HEIGHT / 2 - MAKIRA_FAMILIAR_SIZE;
            const children = this.familiars.getChildren();
            if (children.length >= 1 && children[0].active) children[0].setPosition(paddleX - MAKIRA_FAMILIAR_OFFSET, familiarY);
            if (children.length >= 2 && children[1].active) children[1].setPosition(paddleX + MAKIRA_FAMILIAR_OFFSET, familiarY);
        }
        if (this.makiraBeams) {
             // マキラビームが画面外に出たら削除
            this.makiraBeams.children.each(beam => {
                if (beam.active && beam.y < -MAKIRA_BEAM_HEIGHT) {
                    beam.destroy();
                }
            });
        }
    }

    // 衝突判定を設定/再設定する
    setColliders() {
        console.log("Setting colliders.");
        // 既存のコライダーを破棄
        if (this.ballPaddleCollider) this.ballPaddleCollider.destroy();
        if (this.ballBrickCollider) this.ballBrickCollider.destroy();
        if (this.ballBrickOverlap) this.ballBrickOverlap.destroy();
        if (this.ballBallCollider) this.ballBallCollider.destroy();
        if (this.makiraBeamBrickOverlap) this.makiraBeamBrickOverlap.destroy();

        // 必要なオブジェクトが存在しない場合は中断
        if (!this.balls || !this.paddle || !this.bricks) {
            console.warn("Cannot set colliders: balls, paddle or bricks missing.");
            return;
        }

        // --- 新しいコライダーを設定 ---
        // ボール vs パドル
        this.ballPaddleCollider = this.physics.add.collider(this.paddle, this.balls, this.hitPaddle, null, this);

        // ボール vs ブロック (通常の衝突)
        this.ballBrickCollider = this.physics.add.collider(this.bricks, this.balls, this.hitBrick, (brick, ball) => {
            // 衝突を有効にする条件判定
            const lastPower = ball.getData('lastActivatedPower');
            const isBikaraYin = lastPower === POWERUP_TYPES.BIKARA && ball.getData('bikaraState') === 'yin';
            const isPenetrating = ball.getData('isPenetrating'); // クビラ、合体後シンダラなど
            const isSindaraSpecial = lastPower === POWERUP_TYPES.SINDARA && (ball.getData('isAttracting') || ball.getData('isMerging'));
            // 無敵ブロックは常に衝突しない（貫通も効かないように見えるが、貫通はoverlapで処理）
            // const isIndestructible = brick.getData('maxHits') === -1;

            // 貫通中、ビカラ陰、シンダラ特殊状態の場合は衝突しない (overlapで処理)
            return !isPenetrating && !isBikaraYin && !isSindaraSpecial;
        }, this);

        // ボール vs ブロック (オーバーラップ - 貫通や特殊効果用)
        this.ballBrickOverlap = this.physics.add.overlap(this.balls, this.bricks, this.handleBallBrickOverlap, (ball, brick) => {
             // overlapを有効にする条件判定
             const lastPower = ball.getData('lastActivatedPower');
             const isBikaraYin = lastPower === POWERUP_TYPES.BIKARA && ball.getData('bikaraState') === 'yin';
             const isSindaraSpecial = lastPower === POWERUP_TYPES.SINDARA && (ball.getData('isAttracting') || ball.getData('isMerging'));
             const isPenetrating = ball.getData('isPenetrating');
             // ビカラ陰、シンダラ特殊状態、または貫通状態の場合にoverlapを検知
             return isBikaraYin || isSindaraSpecial || isPenetrating;
         }, this);

        // ボール vs ボール (シンデレラ合体用)
        this.ballBallCollider = this.physics.add.collider(this.balls, this.balls, this.handleBallCollision, (ball1, ball2) => {
             // 衝突を有効にする条件判定 (シンデレラ能力中で、互いに引き寄せあっている場合のみ)
             const lastPower1 = ball1.getData('lastActivatedPower');
             const lastPower2 = ball2.getData('lastActivatedPower');
             return lastPower1 === POWERUP_TYPES.SINDARA && lastPower2 === POWERUP_TYPES.SINDARA &&
                    ball1.getData('isAttracting') && ball2.getData('isAttracting');
        }, this);

        // マキラビーム vs ブロック (オーバーラップ)
        if (this.makiraBeams && this.bricks) {
            this.makiraBeamBrickOverlap = this.physics.add.overlap(this.makiraBeams, this.bricks, this.hitBrickWithMakiraBeam, null, this);
        }
    }

    // 新しいボールを作成してグループに追加
    createAndAddBall(x, y, vx = 0, vy = 0, data = null) {
        console.log("Creating and adding ball.");
        const ball = this.balls.create(x, y, 'ball_image')
            .setOrigin(0.5, 0.5)
            .setDisplaySize(BALL_RADIUS * 2, BALL_RADIUS * 2)
            .setCircle(PHYSICS_BALL_RADIUS) // 物理円を設定 (画像サイズと異なる場合がある)
            .setCollideWorldBounds(true)
            .setBounce(1); // 反射率

        if (ball.body) {
            ball.setVelocity(vx, vy);
            ball.body.onWorldBounds = true; // 物理境界イベントを有効化
        } else {
            console.error("Failed to create ball physics body!");
            ball.destroy(); // ボディがなければ削除
            return null;
        }

        // ボールの状態をデータとして設定 (分裂などで引き継ぐため)
        ball.setData({
            activePowers: data ? new Set(data.activePowers) : new Set(), // 現在有効なパワーアップ種類
            lastActivatedPower: data ? data.lastActivatedPower : null, // 最後に追加されたor見た目に影響するパワー
            isPenetrating: data ? data.isPenetrating : false, // 貫通フラグ
            isFast: data ? data.isFast : false,         // シャトラ状態
            isSlow: data ? data.isSlow : false,         // ハイラ状態
            sindaraPartner: data ? data.sindaraPartner : null, // シンデレラパートナー
            isAttracting: data ? data.isAttracting : false,   // シンデレラ引き寄せ中
            isMerging: data ? data.isMerging : false,       // シンデレラ合体中
            bikaraState: data ? data.bikaraState : null,      // ビカラ状態 ('yin' or 'yang')
            bikaraYangCount: data ? data.bikaraYangCount : 0, // ビカラ陽での破壊回数
            isIndaraActive: data ? data.isIndaraActive : false, // インダラ状態
            indaraHomingCount: data ? data.indaraHomingCount : 0, // インダラ残ホーミング回数
            isAnilaActive: data ? data.isAnilaActive : false    // アニラ状態
        });

        this.updateBallAppearance(ball); // 見た目を更新

        // データ引き継ぎ時に速度も反映
        if (data) {
            if (ball.getData('isFast')) this.applySpeedModifier(ball, POWERUP_TYPES.SHATORA);
            else if (ball.getData('isSlow')) this.applySpeedModifier(ball, POWERUP_TYPES.HAILA);
        }
        return ball;
    }

    // ボールを発射する
    launchBall() {
        console.log("Attempting to launch ball.");
        if (!this.isBallLaunched && this.balls) {
            const firstBall = this.balls.getFirstAlive(); // 最初のアクティブなボールを取得
            if (firstBall) {
                console.log("Launching ball!");
                // 初期X速度をランダムに決定
                const initialVelocityX = Phaser.Math.Between(BALL_INITIAL_VELOCITY_X_RANGE[0], BALL_INITIAL_VELOCITY_X_RANGE[1]);
                firstBall.setVelocity(initialVelocityX, BALL_INITIAL_VELOCITY_Y);
                this.isBallLaunched = true;
                // --- ▼ SE_LAUNCH の再生方法を変更 ▼ ---
                try {
                    // 元のコード: this.sound.play(AUDIO_KEYS.SE_LAUNCH);
                    // 変更後: add() でサウンドインスタンスを作成してから play()
                    this.sound.add(AUDIO_KEYS.SE_LAUNCH).play();
                    console.log("SE_LAUNCH playback attempted via add().play()."); // ログ変更
                } catch (error) {
                    // エラーログは引き続き表示させる
                    console.error("Error playing SE_LAUNCH:", error);
                }
                // --- ▲ SE_LAUNCH の再生方法を変更 ▲ ---
            }
        }
    }

    // ブロックを生成する
    createBricks() {
        console.log(`Generating Bricks (Stage ${this.currentStage})`);
        // 既存のブロックがあればクリア
        if (this.bricks) {
            this.bricks.clear(true, true);
            // グループ自体を破棄して作り直す方が安全かもしれない
            // this.bricks.destroy();
            // this.bricks = this.physics.add.staticGroup();
        } else {
            this.bricks = this.physics.add.staticGroup();
        }


        const stage = this.currentStage;
        const maxStage = MAX_STAGE;

        // ステージ進行度に応じてブロックの行数・列数を増やす
        const rows = BRICK_ROWS + Math.floor(stage / 3);
        const cols = BRICK_COLS + Math.floor(stage / 4);

        // 画面サイズから配置可能な最大数を考慮（念のため）
        const maxTotalBricks = Math.floor((this.scale.height * 0.5) / (BRICK_HEIGHT + BRICK_SPACING)) * (BRICK_COLS + 4) * 1.2;
        const actualRows = Math.min(rows, Math.floor(maxTotalBricks / (BRICK_COLS + 4)));
        const actualCols = Math.min(cols, BRICK_COLS + 4);

        // ステージ進行度に応じた耐久・破壊不能ブロックの出現率
        let durableRatio = 0;
        let indestructibleRatio = 0;
        let progress = 0; // ステージ進行度 (0.0 ~ 1.0)
        if (stage >= 3) { // ステージ3から登場し始め、最大ステージで最大率になる
            progress = Phaser.Math.Clamp((stage - 3) / (maxStage - 3), 0, 1);
            durableRatio = progress * 0.5; // 最大50%
            indestructibleRatio = progress * 0.15; // 最大15%
        }

        // ブロックの描画サイズとオフセット計算
        const bW = this.scale.width * BRICK_WIDTH_RATIO; // 画面幅基準
        const totalBrickWidth = actualCols * bW + (actualCols - 1) * BRICK_SPACING;
        const oX = (this.scale.width - totalBrickWidth) / 2; // X軸オフセット (中央揃え)

        // 特殊レイアウト判定
        let specialLayoutType = null;
        const stageString = stage.toString();
        if (stage > 2 && stage % 8 === 0) { specialLayoutType = 's_shape'; }
        else if (stage > 2 && stage % 4 === 0) { specialLayoutType = 'wall'; }
        else if (stage > 4 && stage % 6 === 0) { specialLayoutType = 'center_hollow'; }
        else if (stage >= 3 && SYMBOL_PATTERNS[stageString]) { specialLayoutType = 'symbol'; }

        // ブロック密度 (ステージ進行度で増加)
        let density;
        if (stage <= 3) { density = 0.4; }
        else { density = 0.4 + 0.5 * progress; } // 最大0.9

        // --- レイアウト生成 ---
        if (specialLayoutType === 'wall') {
            // --- 壁レイアウト ---
            console.log(`Generating Special Layout: Wall (Stage ${stage}, Density: ${density.toFixed(3)})`);
             // --- ▼ 出口の幅を広げる ▼ ---
            // const exitColTop = Math.floor(actualCols / 2); // 元のコード
            // const exitColBottom = Math.floor(actualCols / 2); // 元のコード
            const exitColCenter = Math.floor(actualCols / 2);
            const exitColStartTop = Math.max(0, exitColCenter - 1); // 中央から左に1つ (最低0列目)
            const exitColEndTop = Math.min(actualCols - 1, exitColCenter); // 中央 (最低 (列数-1)列目)
            const exitColStartBottom = exitColStartTop; // 下も同じにする場合
            const exitColEndBottom = exitColEndTop;
            console.log(`Wall Exit Top Cols: ${exitColStartTop} to ${exitColEndTop}`);
            console.log(`Wall Exit Bottom Cols: ${exitColStartBottom} to ${exitColEndBottom}`);
            // --- ▲ 出口の幅を広げる ▲ ---
            for (let i = 0; i < actualRows; i++) {
                for (let j = 0; j < actualCols; j++) {
                    const bX = oX + j * (bW + BRICK_SPACING) + bW / 2;
                    const bY = BRICK_OFFSET_TOP + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2;

                    let generateBrick = true;
                    let brickType = 'normal';
                    let brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS);
                    let maxHits = 1;
                    let isDurable = false;

                    const isOuterWall = (i === 0 || i === actualRows - 1 || j === 0 || j === actualCols - 1);
                    // --- ▼ 出口判定を修正 ▼ ---
                    // const isExit = (i === 0 && j === exitColTop) || (i === actualRows - 1 && j === exitColBottom); // 元のコード
                    const isTopExit = (i === 0 && j >= exitColStartTop && j <= exitColEndTop);
                    const isBottomExit = (i === actualRows - 1 && j >= exitColStartBottom && j <= exitColEndBottom);
                    const isExit = isTopExit || isBottomExit;
                    // --- ▲ 出口判定を修正 ▲ ---
                    if (isOuterWall && !isExit) {
                        // 外壁 (出口以外) は破壊不能
                        brickType = 'indestructible';
                        brickColor = INDESTRUCTIBLE_BRICK_COLOR;
                        maxHits = -1;
                    } else {
                        // 内側または出口
                        if (Phaser.Math.FloatBetween(0, 1) > density) {
                             generateBrick = false; // 密度に応じて生成しない
                        } else {
                             if (isExit) { /* 出口は常に通常ブロック */ }
                             else {
                                // 内側のブロックタイプ抽選
                                const rand = Phaser.Math.FloatBetween(0, 1);
                                if (stage >= 3 && rand < durableRatio) {
                                    brickType = 'durable';
                                    brickColor = DURABLE_BRICK_COLOR;
                                    maxHits = Phaser.Math.Between(2, MAX_DURABLE_HITS);
                                    isDurable = true;
                                } else { /* Normal */ }
                            }
                        }
                    }

                    if (generateBrick) {
                        const brick = this.bricks.create(bX, bY, 'whitePixel')
                            .setDisplaySize(bW, BRICK_HEIGHT)
                            .setTint(brickColor);
                        brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType });
                        brick.refreshBody();
                        if (maxHits === -1) brick.body.immovable = true; // 破壊不能は完全に固定
                    }
                }
            }
             // 破壊可能ブロックが0個なら再生成を試みる
            if (this.getDestroyableBrickCount() === 0 && stage > 1) {
                console.warn("Wall layout generated no destroyable bricks, retrying...");
                this.time.delayedCall(10, this.createBricks, [], this); // 少し遅れて再帰呼び出し
                return;
            }
        } else if (specialLayoutType === 's_shape') {
            // --- S字レイアウト ---
            console.log(`Generating Special Layout: S-Shape (Stage ${stage}, Density: ${density.toFixed(3)})`);
            // --- ▼ 壁の位置を調整して間隔を広げる ▼ ---
            // const wallRow1 = Math.floor(actualRows / 3); // 元のコード
            // const wallRow2 = Math.floor(actualRows * 2 / 3); // 元のコード
            const gapHeight = 3; // ★ 壁と壁の間の行数（3行分のスペースを確保）
            const wallRow1 = Math.floor((actualRows - gapHeight) / 2); // 上の壁の位置を少し上げる
            const wallRow2 = wallRow1 + gapHeight; // 下の壁の位置を wallRow1 から gapHeight 行下に設定
            console.log(`S-Shape Wall Rows: ${wallRow1} and ${wallRow2} (Gap: ${gapHeight})`);
            // --- ▲ 壁の位置を調整して間隔を広げる ▲ ---
            const wallLengthCols = Math.floor(actualCols * 2 / 3); // 壁の長さ（列数）
            let generatedDestroyableCount = 0;

            for (let i = 0; i < actualRows; i++) {
                for (let j = 0; j < actualCols; j++) {
                    const bX = oX + j * (bW + BRICK_SPACING) + bW / 2;
                    const bY = BRICK_OFFSET_TOP + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2;

                    let generateBrick = true;
                    let brickType = 'normal';
                    let brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS);
                    let maxHits = 1;
                    let isDurable = false;

                    // 壁判定 (wallRow1 と wallRow2 を使う)
                    const isWallPart = (i === wallRow1 && j >= actualCols - wallLengthCols) || (i === wallRow2 && j < wallLengthCols);

                    if (isWallPart) {
                         brickType = 'indestructible'; brickColor = INDESTRUCTIBLE_BRICK_COLOR; maxHits = -1;
                    } else {
                         if (Phaser.Math.FloatBetween(0, 1) > density) { generateBrick = false; } else {
                            const rand = Phaser.Math.FloatBetween(0, 1);
                            if (stage >= 3 && rand < durableRatio) {
                                brickType = 'durable';
                                brickColor = DURABLE_BRICK_COLOR;
                                maxHits = Phaser.Math.Between(2, MAX_DURABLE_HITS);
                                isDurable = true;
                            } else { /* Normal */ }
                        }
                    }

                    if (generateBrick) {
                        const brick = this.bricks.create(bX, bY, 'whitePixel')
                            .setDisplaySize(bW, BRICK_HEIGHT)
                            .setTint(brickColor);
                        brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType });
                        brick.refreshBody();
                        if (maxHits === -1) brick.body.immovable = true;
                        if (maxHits !== -1) generatedDestroyableCount++; // 破壊可能数をカウント
                    }
                }
            }
             // 破壊可能ブロックが少なすぎる場合も再生成を試みる
            if (generatedDestroyableCount < 5 && stage > 1) {
                console.warn(`S-Shape generated only ${generatedDestroyableCount} destroyable bricks, retrying...`);
                this.time.delayedCall(10, this.createBricks, [], this);
                return;
            }

        } else if (specialLayoutType === 'center_hollow') {
            // --- 中央空洞レイアウト ---
            console.log(`Generating Special Layout: Center Hollow (Stage ${stage}, Density: ${density.toFixed(3)})`);
            let generatedCount = 0;
            const hollowRowStart = Math.floor(actualRows / 4);
            const hollowRowEnd = Math.floor(actualRows * 3 / 4);
            const hollowColStart = Math.floor(actualCols / 4);
            const hollowColEnd = Math.floor(actualCols * 3 / 4);

            for (let i = 0; i < actualRows; i++) {
                for (let j = 0; j < actualCols; j++) {
                    const bX = oX + j * (bW + BRICK_SPACING) + bW / 2;
                    const bY = BRICK_OFFSET_TOP + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2;

                    // 空洞エリアはスキップ
                    const isInHollowArea = (i >= hollowRowStart && i < hollowRowEnd && j >= hollowColStart && j < hollowColEnd);
                    if (isInHollowArea) {
                        continue;
                    }

                    // 密度判定 (最低5個は保証)
                    if (Phaser.Math.FloatBetween(0, 1) > density && generatedCount > 5) {
                        continue;
                    }

                    // ブロックタイプ抽選 (破壊不能 -> 耐久 -> 通常 の順で判定)
                    const rand = Phaser.Math.FloatBetween(0, 1);
                    let brickType = 'normal';
                    let brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS);
                    let maxHits = 1;
                    let isDurable = false;
                    if (stage >= 3 && rand < indestructibleRatio) {
                         brickType = 'indestructible';
                         brickColor = INDESTRUCTIBLE_BRICK_COLOR;
                         maxHits = -1;
                    } else if (stage >= 3 && rand < indestructibleRatio + durableRatio) {
                        brickType = 'durable';
                        brickColor = DURABLE_BRICK_COLOR;
                        maxHits = Phaser.Math.Between(2, MAX_DURABLE_HITS);
                        isDurable = true;
                    } else { /* Normal */ }

                    const brick = this.bricks.create(bX, bY, 'whitePixel')
                        .setDisplaySize(bW, BRICK_HEIGHT)
                        .setTint(brickColor);
                    brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType });
                    brick.refreshBody();
                    if (maxHits === -1) brick.body.immovable = true;
                    generatedCount++;
                }
            }
            // 破壊可能ブロックが0個なら再生成を試みる
            if (this.getDestroyableBrickCount() === 0 && stage > 1) {
                console.warn("Center Hollow layout generated no destroyable bricks, retrying...");
                this.time.delayedCall(10, this.createBricks, [], this);
                return;
            }
        } else if (specialLayoutType === 'symbol') {
            // --- 記号/文字レイアウト ---
            console.log(`Generating Special Layout: Symbol '${stageString}' (Stage ${stage})`);
            const pattern = SYMBOL_PATTERNS[stageString];
            let generatedCount = 0;

            if (pattern && pattern.length > 0 && pattern[0].length > 0) {
                const patternRows = pattern.length;
                const patternCols = pattern[0].length;
                const patternTotalHeight = patternRows * BRICK_HEIGHT + (patternRows - 1) * BRICK_SPACING;
                const patternTotalWidth = patternCols * bW + (patternCols - 1) * BRICK_SPACING;

                // 画面中央付近に配置
                const startY = BRICK_OFFSET_TOP + Math.max(0, (this.scale.height * 0.4 - patternTotalHeight) / 2); // 上部40%の中央あたり
                const startX = (this.scale.width - patternTotalWidth) / 2; // X軸中央

                for (let i = 0; i < patternRows; i++) {
                    for (let j = 0; j < patternCols; j++) {
                        if (pattern[i][j] === 1) { // パターンで1の部分にブロックを生成
                            const bX = startX + j * (bW + BRICK_SPACING) + bW / 2;
                            const bY = startY + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2;

                            // シンボルステージは通常ブロックのみとする（難易度調整）
                            const brickType = 'normal';
                            const brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS);
                            const maxHits = 1;
                            const isDurable = false;

                            const brick = this.bricks.create(bX, bY, 'whitePixel')
                                .setDisplaySize(bW, BRICK_HEIGHT)
                                .setTint(brickColor);
                            brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType });
                            brick.refreshBody();
                            generatedCount++;
                        }
                    }
                }
                // ブロック数が少なすぎる場合は通常生成にフォールバック
                 if (generatedCount < 3 && stage > 1) {
                    console.warn(`Symbol layout '${stageString}' generated only ${generatedCount} bricks, retrying as normal...`);
                    this.time.delayedCall(10, () => { this.createBricksFallbackToNormal(); }, [], this);
                    return;
                }
            } else {
                // パターンが見つからないか不正な場合もフォールバック
                console.warn(`Symbol pattern for stage ${stage} not found or invalid. Falling back to normal layout.`);
                this.createBricksFallbackToNormal();
                return;
            }

        } else {
            // --- 通常レイアウト (ランダム配置) ---
            console.log(`Generating Normal Layout (Stage ${stage}, Density: ${density.toFixed(3)})`);
            this.createBricksFallbackToNormal(); // 通常生成ロジックを呼び出し
        }

        console.log(`Bricks generated: ${this.bricks.getLength()}, Destroyable: ${this.getDestroyableBrickCount()}`);
        // ブロック生成後にコライダーを再設定
        this.setColliders();
    }

    // 通常のランダム配置ロジック（フォールバック用）
    createBricksFallbackToNormal() {
        // ※ createBricks 内の通常レイアウト部分と同じロジックをここに記述
        // （コード重複を避けるため、createBricksから呼び出す形にした）

        // 既存のブロックがあればクリア (念のため)
        if (this.bricks) {
            this.bricks.clear(true, true);
        } else {
            this.bricks = this.physics.add.staticGroup();
        }

        const stage = this.currentStage;
        const maxStage = MAX_STAGE;
        const rows = BRICK_ROWS + Math.floor(stage / 3);
        const cols = BRICK_COLS + Math.floor(stage / 4);
        const maxTotalBricks = Math.floor((this.scale.height * 0.5) / (BRICK_HEIGHT + BRICK_SPACING)) * (BRICK_COLS + 4) * 1.2;
        const actualRows = Math.min(rows, Math.floor(maxTotalBricks / (BRICK_COLS + 4)));
        const actualCols = Math.min(cols, BRICK_COLS + 4);
        let durableRatio = 0, indestructibleRatio = 0, progress = 0;
        if (stage >= 3) {
            progress = Phaser.Math.Clamp((stage - 3) / (maxStage - 3), 0, 1);
            durableRatio = progress * 0.5;
            indestructibleRatio = progress * 0.15;
        }
        const bW = this.scale.width * BRICK_WIDTH_RATIO;
        const totalBrickWidth = actualCols * bW + (actualCols - 1) * BRICK_SPACING;
        const oX = (this.scale.width - totalBrickWidth) / 2;
        let density;
        if (stage <= 3) { density = 0.4; } else { density = 0.4 + 0.5 * progress; }

        let generatedCount = 0;
        for (let i = 0; i < actualRows; i++) {
            for (let j = 0; j < actualCols; j++) {
                const bX = oX + j * (bW + BRICK_SPACING) + bW / 2;
                const bY = BRICK_OFFSET_TOP + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2;

                if (Phaser.Math.FloatBetween(0, 1) > density && generatedCount > 5) { continue; }

                const rand = Phaser.Math.FloatBetween(0, 1);
                let brickType = 'normal';
                let brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS);
                let maxHits = 1;
                let isDurable = false;

                if (stage >= 3 && rand < indestructibleRatio) {
                    brickType = 'indestructible'; brickColor = INDESTRUCTIBLE_BRICK_COLOR; maxHits = -1;
                } else if (stage >= 3 && rand < indestructibleRatio + durableRatio) {
                    brickType = 'durable'; brickColor = DURABLE_BRICK_COLOR; maxHits = Phaser.Math.Between(2, MAX_DURABLE_HITS); isDurable = true;
                } else {
                    brickType = 'normal'; brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS); maxHits = 1; isDurable = false;
                }

                const brick = this.bricks.create(bX, bY, 'whitePixel')
                    .setDisplaySize(bW, BRICK_HEIGHT)
                    .setTint(brickColor);
                brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType });
                brick.refreshBody();
                if (maxHits === -1) brick.body.immovable = true;
                generatedCount++;
            }
        }

        // 破壊可能ブロックが0なら再試行
        if (this.getDestroyableBrickCount() === 0 && stage > 1) {
            console.warn("Normal layout (fallback) generated no destroyable bricks, retrying...");
            // createBricksを呼び出すことで、レイアウトタイプ判定からやり直す
            this.time.delayedCall(10, this.createBricks, [], this);
            return; // ここでの処理は中断
        }

         console.log(`Bricks generated (fallback/normal): ${this.bricks.getLength()}, Destroyable: ${this.getDestroyableBrickCount()}`);
         // コライダー再設定は呼び出し元の createBricks で行う
         // this.setColliders();
    }


    // ブロックへのヒット処理（ダメージ計算と破壊判定）
    handleBrickHit(brick, damage = 1) {
        if (!brick || !brick.active || !brick.getData) return false;
        const maxHits = brick.getData('maxHits');
        const isDurable = brick.getData('isDurable');
        const isIndestructible = (maxHits === -1);

        // 無敵ブロックへのヒット（ダメージInfinity以外）は何もしない
        if (isIndestructible && damage !== Infinity) {
            return false;
        }

        let currentHits = brick.getData('currentHits');

        if (damage === Infinity) {
            currentHits = 0; // 即死
        } else {
            currentHits -= damage;
        }
        brick.setData('currentHits', currentHits);

        if (currentHits <= 0) {
            // 破壊される
            this.handleBrickDestruction(brick); // 破壊処理とエフェクトへ
            return true; // 破壊されたことを示す
        } else if (isDurable) {
            // 耐久ブロックの色を暗くする
            const darknessFactor = (maxHits - currentHits) * DURABLE_BRICK_HIT_DARKEN;
            const originalColor = Phaser.Display.Color.ValueToColor(DURABLE_BRICK_COLOR);
            const newColor = originalColor.darken(darknessFactor);
            brick.setTint(newColor.color);
            return false; // まだ破壊されていない
        } else {
            // 通常ブロック（複数ヒットは想定しないが念のため）
            return false; // まだ破壊されていない
        }
    }

    // ブロック破壊時の処理（エフェクト、スコア加算、アイテムドロップなど）
    handleBrickDestruction(brick) {
        if (!brick || !brick.active) return false;
        const brickX = brick.x;
        const brickY = brick.y;
        const brickColor = brick.getData('originalTint') || 0xffffff; // ブロックの色を取得

        // --- ▼ 調整後のエフェクト生成処理 ▼ ---
        try {
            // パーティクルエミッタを作成
            const particles = this.add.particles(0, 0, 'whitePixel', {
                // エミッタの設定
                frame: 0, // whitePixelは単一フレーム
                x: brickX, // 発生源 X座標
                y: brickY, // 発生源 Y座標
                lifespan: 500, // パーティクルの生存時間
                speed: { min: 80, max: 150 }, // パーティクルの速度範囲
                angle: { min: 0, max: 360 },   // パーティクルの放出角度 (全方位)
                gravityY: 100,                 // 少し重力をかける
                scale: { start: 0.7, end: 0 }, // 開始時のスケール (少し大きめ)
                quantity: 12, // 一度に放出するパーティクルの数
                blendMode: 'NORMAL', // ブレンドモード
                emitting: false // すぐには放出しない
            });

            // パーティクルにブロックの色を適用
            particles.setParticleTint(brickColor);

            // 一度だけパーティクルを放出する
            particles.explode(12);

            // エミッタ自体を少し遅れて破棄する
            this.time.delayedCall(600, () => { // lifespanより少し長く
                // particlesオブジェクトがまだ存在するか確認してからdestroyを呼ぶ
                if (particles && particles.scene) {
                    particles.destroy();
                }
            });

        } catch (error) {
            console.error("Error creating particle effect:", error);
        }
        // --- ▲ 調整後のエフェクト生成処理 ▲ ---

        // ブロック本体の無効化（エフェクト生成後に行う）
        brick.disableBody(true, true);

        // --- ▼ SE_DESTROY の再生処理を修正・復活 ▼ ---
    console.log("[Debug] Attempting to play SE_DESTROY..."); // ログ変更
    try {
        // コメントアウト解除 & 再生方法変更
        this.sound.add(AUDIO_KEYS.SE_DESTROY).play();
        console.log("SE_DESTROY playback attempted via add().play().");
        // 元のコード: /* this.sound.play(AUDIO_KEYS.SE_DESTROY); */
        // 元のログ: console.log("[Temporary] SE_DESTROY playback disabled due to errors.");
    } catch (error) {
        console.error("Error playing SE_DESTROY:", error); // エラーログは維持
    }
    // --- ▲ SE_DESTROY の再生処理を修正・復活 ▲ ---

        // スコア加算など
        this.score += 10;
        this.events.emit('updateScore', this.score);
        this.increaseVajraGauge(); // ヴァジラゲージ増加

        // アイテムドロップ判定
        if (Phaser.Math.FloatBetween(0, 1) < BAISRAVA_DROP_RATE) {
            this.dropSpecificPowerUp(brickX, brickY, POWERUP_TYPES.BAISRAVA);
        } else if (this.stageDropPool.length > 0 && Phaser.Math.FloatBetween(0, 1) < this.chaosSettings.rate) {
            this.dropPowerUp(brickX, brickY);
        }

        return true; // 破壊処理が成功したことを示す
    }

    // ボールがブロックに衝突した時 (collider)
    hitBrick(brick, ball) {
        if (!brick || !ball || !brick.active || !ball.active || this.isStageClearing) return;

        const lastPower = ball.getData('lastActivatedPower');
        const isBikaraYang = lastPower === POWERUP_TYPES.BIKARA && ball.getData('bikaraState') === 'yang';

        if (isBikaraYang) {
            // ビカラ陽状態: 特殊破壊処理
            this.handleBikaraYangDestroy(ball, brick);
            // 破壊されたかもしれないのでステージクリアチェック
            if (!this.isStageClearing && this.getDestroyableBrickCount() === 0) {
                this.time.delayedCall(50, this.stageClear, [], this); // 少し遅延してクリア処理へ
            }
            return; // 陽での処理はここで終了
        }

        // 通常のヒット処理（エフェクトは handleBrickDestruction 内で発生）
        const destroyed = this.handleBrickHit(brick, 1); // ダメージ1でヒット
        if (destroyed && !this.isStageClearing && this.getDestroyableBrickCount() === 0) {
             // 破壊されて、かつ破壊可能ブロックが0になったらステージクリア
            this.time.delayedCall(50, this.stageClear, [], this); // 少し遅延してクリア処理へ
        }
         // ★★★ ここにブロック衝突エフェクトを追加することも可能 ★★★
         // ただし、破壊エフェクトと被るので、別の見た目（軽い火花など）が良いか？
         // if (!destroyed) { /* 破壊されなかった場合のエフェクト */ }
    }

    // ボールがブロックとオーバーラップした時 (貫通、ビカラ陰など)
    handleBallBrickOverlap(ball, brick) {
        if (!ball || !brick || !ball.active || !brick.active || this.isStageClearing) return;
        const lastPower = ball.getData('lastActivatedPower');
        const isBikaraYin = lastPower === POWERUP_TYPES.BIKARA && ball.getData('bikaraState') === 'yin';
        const isPenetrating = ball.getData('isPenetrating');
        const isSindaraSpecial = lastPower === POWERUP_TYPES.SINDARA && (ball.getData('isAttracting') || ball.getData('isMerging'));

        if (isBikaraYin) {
            // ビカラ陰状態: ブロックをマークする（無敵ブロックは除く）
            if (brick.getData('maxHits') !== -1) {
                this.markBrickByBikara(brick);
                 // ★★★ ここにマークエフェクトを追加することも可能 ★★★
            }
        } else if (isPenetrating && !isSindaraSpecial) {
            // 貫通状態 (シンデレラ特殊状態を除く): ブロックを即破壊
             // 貫通ヒット処理（エフェクトは handleBrickDestruction 内で発生）
            const destroyed = this.handleBrickHit(brick, Infinity); // Infinityダメージで即破壊
            if (destroyed && !this.isStageClearing && this.getDestroyableBrickCount() === 0) {
                 // 破壊されて、かつ破壊可能ブロックが0になったらステージクリア
                 this.time.delayedCall(50, this.stageClear, [], this); // 少し遅延してクリア処理へ
            }
             // ★★★ ここに貫通エフェクトを追加することも可能 ★★★
        }
        // シンデレラ特殊状態のoverlapは何もしない（衝突判定を無効化するためだけ）
    }

    // ビカラ陽転換時のブロック破壊処理
    handleBikaraYangDestroy(ball, hitBrick) {
        if (!ball || !ball.active || ball.getData('lastActivatedPower') !== POWERUP_TYPES.BIKARA || ball.getData('bikaraState') !== 'yang') return;
        let destroyedCount = 0;
        const markedToDestroy = [];

        // まず、陽転換のトリガーとなったブロック（無敵でなければ）を破壊リストに追加
        if (hitBrick.active && hitBrick.getData('maxHits') !== -1) {
            markedToDestroy.push(hitBrick);
            hitBrick.setData('isMarkedByBikara', false); // 念のためマーク解除
        }

        // 次に、陰状態でマークされていた他のブロックをリストに追加
        this.bricks.getChildren().forEach(br => {
            if (br.active && br.getData && br.getData('isMarkedByBikara') && !markedToDestroy.includes(br)) {
                markedToDestroy.push(br);
                br.setData('isMarkedByBikara', false); // マーク解除
            }
        });

        // リストにあるブロックを破壊
        markedToDestroy.forEach(br => {
            if (br.active) {
                 // 陽転換による破壊（エフェクトは handleBrickDestruction 内で発生）
                const destroyed = this.handleBrickDestruction(br);
                if (destroyed) destroyedCount++;
            }
        });

        // 陽転換での破壊回数をカウント
        let currentYangCount = ball.getData('bikaraYangCount') || 0;
        currentYangCount++;
        ball.setData('bikaraYangCount', currentYangCount);

        if (destroyedCount > 0) {
            console.log(`Bikara Yang destroyed ${destroyedCount} bricks.`);
             // ★★★ ここにビカラ陽破壊エフェクト（全体的な）を追加することも可能 ★★★
        }

        // 規定回数破壊したらビカラ能力を解除
        if (currentYangCount >= BIKARA_YANG_COUNT_MAX) {
            this.deactivatePowerByType(POWERUP_TYPES.BIKARA);
        }
    }

    // マキラビームがブロックにヒットした時
    hitBrickWithMakiraBeam(beam, brick) {
        if (!beam || !brick || !beam.active || !brick.active || this.isStageClearing || this.isGameOver || !brick.getData) return;

        // 無敵ブロックにはビームも効かず、ビームが消える
        if (brick.getData('maxHits') === -1) {
             // ★★★ ここにビームがブロックに弾かれるエフェクトを追加可能 ★★★
            beam.destroy();
            return;
        }

        // ビームはヒットしたら消える
        try {
             // ★★★ ここにビームヒットエフェクトを追加可能 ★★★
            beam.destroy();
        } catch (error) {
            console.error("Error destroying Makira beam:", error);
             // 安全策として非アクティブ化
            if (beam && beam.active) {
                beam.setActive(false).setVisible(false);
                if (beam.body) beam.body.enable = false;
            }
        }

         // マキラビームによるヒット処理（エフェクトは handleBrickDestruction 内で発生）
        const destroyed = this.handleBrickHit(brick, 1); // ダメージ1
        if (destroyed && !this.isStageClearing && this.getDestroyableBrickCount() === 0) {
             // 破壊されて、かつ破壊可能ブロックが0になったらステージクリア
             this.time.delayedCall(50, this.stageClear, [], this); // 少し遅延してクリア処理へ
        }
    }

    // ヴァジラ奥義発動
    triggerVajraDestroy() {
        if (this.isStageClearing || this.isGameOver) return;
        if (!this.isVajraSystemActive) return; // 発動状態でなければ何もしない

        this.isVajraSystemActive = false; // 発動したらゲージシステムは一旦終了
        this.events.emit('deactivateVajraUI'); // UIにも通知
        console.log("Triggering Vajra destroy.");
        // ★★★ ここにヴァジラ奥義発動の全体エフェクトを追加可能 ★★★

        // ボイス・SE再生 (エラーハンドリング付き)
        console.log("[Debug] Attempting to play VOICE_VAJRA_TRIGGER...");
        try { this.sound.play(AUDIO_KEYS.VOICE_VAJRA_TRIGGER); } catch (error) { console.error("[Debug] Error playing VOICE_VAJRA_TRIGGER:", error); }
        console.log("[Debug] Attempting to play SE_VAJRA_TRIGGER...");
         try { this.sound.play(AUDIO_KEYS.SE_VAJRA_TRIGGER); } catch (error) { console.error("[Debug] Error playing SE_VAJRA_TRIGGER:", error); }

        // 破壊対象のブロックを取得 (アクティブかつ破壊可能なもの)
        const activeBricks = this.bricks.getMatching('active', true);
        const destroyableBricks = activeBricks.filter(b => b.getData && b.getData('maxHits') !== -1);

        if (destroyableBricks.length === 0) {
            console.log("No destroyable bricks for Vajra to destroy.");
            this.deactivateVajra(); // ゲージリセット等は行う
            return;
        }

        // 破壊する数を決定
        const countToDestroy = Math.min(destroyableBricks.length, VAJRA_DESTROY_COUNT);
        // 破壊対象をランダムにシャッフル
        const shuffledBricks = Phaser.Utils.Array.Shuffle(destroyableBricks);
        let destroyedCount = 0;

        // 決定した数だけ破壊
        for (let i = 0; i < countToDestroy; i++) {
            const brick = shuffledBricks[i];
            if (brick && brick.active) {
                 // ヴァジラによる破壊（エフェクトは handleBrickDestruction 内で発生）
                const destroyed = this.handleBrickHit(brick, Infinity); // 即死ダメージ
                if (destroyed) destroyedCount++;
            }
        }
        console.log(`Vajra destroyed ${destroyedCount} bricks.`);

        // 破壊後にステージクリア判定
        if (!this.isStageClearing && this.getDestroyableBrickCount() === 0) {
            console.log("Vajra cleared the stage.");
             this.time.delayedCall(50, this.stageClear, [], this); // 少し遅延してクリア処理へ
        } else {
             // ステージクリアしない場合、ヴァジラシステムの後処理（ゲージリセットなど）を行う
             // ※ isVajraSystemActive は既に false になっているので、実質ゲージリセットのみ
             this.deactivateVajra();
        }
    }

    // バイシュラヴァ能力発動 (全破壊)
    activateBaisrava() {
        if (this.isStageClearing || this.isGameOver) return;
        console.log("Activating Baisrava.");
        // ★★★ ここにバイシュラヴァ発動の全体エフェクトを追加可能 ★★★

        // ボイス再生
        try { this.sound.play(AUDIO_KEYS.VOICE_BAISRAVA); } catch (e) { console.error(`Error playing voice ${AUDIO_KEYS.VOICE_BAISRAVA}:`, e); }

        // アクティブな破壊可能ブロックを取得
        const activeBricks = this.bricks.getMatching('active', true);
        const destroyableBricks = activeBricks.filter(b => b.getData && b.getData('maxHits') !== -1);
        let destroyedCount = 0;

        // 全て破壊
        destroyableBricks.forEach(brick => {
            if (brick && brick.active) {
                 // バイシュラヴァによる破壊（エフェクトは handleBrickDestruction 内で発生）
                const destroyed = this.handleBrickHit(brick, Infinity); // 即死ダメージ
                if (destroyed) destroyedCount++;
            }
        });

        if (destroyedCount > 0) {
            console.log(`Baisrava destroyed ${destroyedCount} bricks.`);
        }
        // バイシュラヴァ取得時は即時ステージクリア
        this.stageClear();
    }

    // 現在の破壊可能なブロック数を返す
    getDestroyableBrickCount() {
        if (!this.bricks) return 0;
        return this.bricks.getMatching('active', true).filter(brick => brick.getData && brick.getData('maxHits') !== -1).length;
    }

    // 特定の種類のパワーアップをドロップさせる
    dropSpecificPowerUp(x, y, type) {
        let textureKey = POWERUP_ICON_KEYS[type] || 'whitePixel'; // アイコンキー取得、なければ白四角
        let displaySize = POWERUP_SIZE;
        let tintColor = null;

        // 白四角を使う場合は、種類に応じて色をつける（例: Baisravaは金色）
        if (textureKey === 'whitePixel') {
            console.warn(`Powerup icon key not found for type: ${type}, using white pixel.`);
            tintColor = (type === POWERUP_TYPES.BAISRAVA) ? 0xffd700 : 0xcccccc; // 例
        }
        if (!type) {
            console.warn(`Attempted to drop powerup with no type.`);
            return; // タイプ指定がない場合は中断
        }

        let powerUp = null;
        try {
            powerUp = this.powerUps.create(x, y, textureKey); // グループから作成
            if (powerUp) {
                powerUp.setDisplaySize(displaySize, displaySize).setData('type', type);
                if (tintColor !== null) {
                    powerUp.setTint(tintColor);
                } else {
                    powerUp.clearTint(); // テクスチャがある場合は Tint をクリア
                }

                // 物理設定
                if (powerUp.body) {
                    powerUp.setVelocity(0, POWERUP_SPEED_Y); // 真下に落下
                    powerUp.body.setCollideWorldBounds(false); // 画面下に落ちるように
                    powerUp.body.setAllowGravity(false); // Phaserの重力は使わない
                } else {
                    console.error(`No physics body for powerup type: ${type}! Destroying.`);
                    powerUp.destroy();
                    powerUp = null;
                }
            } else {
                console.error(`Failed to create powerup object for type: ${type}!`);
            }
        } catch (error) {
            console.error(`CRITICAL ERROR in dropSpecificPowerUp (${type}):`, error);
            if (powerUp && powerUp.active) { powerUp.destroy(); } // エラー時も破棄を試みる
        }
    }

    // 現在のステージドロッププールからランダムにパワーアップをドロップ
    dropPowerUp(x, y) {
        if (this.stageDropPool.length === 0) return; // プールが空なら何もしない
        const type = Phaser.Utils.Array.GetRandom(this.stageDropPool); // プールからランダム選択
        this.dropSpecificPowerUp(x, y, type);
    }

    // ボールがパドルにヒットした時の処理
    hitPaddle(paddle, ball) {
        if (!paddle || !ball || !ball.active || !ball.body) return;
        console.log("[Debug] hitPaddle called.");

        // --- 反射角度の計算 ---
        let diff = ball.x - paddle.x;
        const maxDiff = paddle.displayWidth / 2;
        let influence = diff / maxDiff;
        influence = Phaser.Math.Clamp(influence, -1, 1);
        const maxVx = NORMAL_BALL_SPEED * 0.8;
        let newVx = maxVx * influence;
        const minVy = NORMAL_BALL_SPEED * 0.5;
        let currentVy = ball.body.velocity.y;
        let newVy = -Math.abs(currentVy);
        if (Math.abs(newVy) < minVy) newVy = -minVy;

        // --- 速度の再計算 ---
        let speedMultiplier = 1.0;
        if (ball.getData('isFast')) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA];
        else if (ball.getData('isSlow')) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA];
        const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier;
        const newVelocity = new Phaser.Math.Vector2(newVx, newVy).normalize().scale(targetSpeed);
        ball.setVelocity(newVelocity.x, newVelocity.y);

        // --- パドルヒットエフェクト ---
        try {
            const impactPointY = ball.y + BALL_RADIUS * 0.8; // ボールの少し下あたり
            const impactPointX = ball.x;
            const particles = this.add.particles(0, 0, 'whitePixel', {
                x: impactPointX,
                y: impactPointY,
                lifespan: 150,       // 短い寿命
                speed: { min: 100, max: 200 }, // 速度
                angle: { min: 240, max: 300 }, // 上向きに広がる
                gravityY: 300,       // 少し重力で下に落ちる
                scale: { start: 0.4, end: 0 }, // 小さな粒子
                quantity: 5,        // 少量
                blendMode: 'ADD',   // 加算合成で明るく光る
                emitting: false
            });
            particles.setParticleTint(0xffffcc); // やや黄色みがかった白
            particles.explode(5); // 放出
            // 短時間後にエミッタを破棄
            this.time.delayedCall(200, () => {
                if (particles && particles.scene) particles.destroy();
            });
        } catch (error) {
            console.error("Error creating paddle hit particle effect:", error);
        }
        // --- エフェクト終了 ---


        // --- ▼ SE_REFLECT の再生処理を修正・復活 ▼ ---
    console.log("[Debug] Attempting to play SE_REFLECT (paddle)...");
    try {
        this.sound.add(AUDIO_KEYS.SE_REFLECT).play();
        console.log("SE_REFLECT (paddle) playback attempted via add().play().");
        // 元のコード: /* this.sound.play(AUDIO_KEYS.SE_REFLECT); */
    } catch (error) {
        console.error("Error playing SE_REFLECT (paddle):", error);
    }
    // --- ▲ SE_REFLECT の再生処理を修正・復活 ▲ ---

        // --- パワーアップ関連の処理 ---
        if (ball.getData('lastActivatedPower') === POWERUP_TYPES.BIKARA) {
            this.switchBikaraState(ball);
        }
        if (ball.getData('isIndaraActive')) {
            this.deactivateIndaraForBall(ball);
            this.updateBallAppearance(ball);
        }
    }

    // パワーアップアイテムを収集した時の処理
    collectPowerUp(paddle, powerUp) {
        if (!powerUp || !powerUp.active || this.isStageClearing) return; // ステージクリア中は拾えない

        const type = powerUp.getData('type');
        if (!type) {
            console.warn("Collected powerup with no type data!");
            powerUp.destroy(); // タイプ不明は削除
            return;
        }

        // アイテムを消す
        powerUp.destroy();
         // ★★★ ここにアイテム取得エフェクトを追加可能 ★★★

        // --- ボイス再生 (スロットリング付き) ---
        const voiceKeyBase = `voice_${type}`;
        const upperCaseKey = voiceKeyBase.toUpperCase();
        let actualAudioKey = AUDIO_KEYS[upperCaseKey];
        if (type === POWERUP_TYPES.VAJRA) { actualAudioKey = AUDIO_KEYS.VOICE_VAJRA_GET; }

        const now = this.time.now;
        const lastPlayed = this.lastPlayedVoiceTime[upperCaseKey] || 0;
        if (actualAudioKey && (now - lastPlayed > this.voiceThrottleTime)) {
            console.log(`Playing voice: ${actualAudioKey}`);
            try {
                this.sound.play(actualAudioKey);
                this.lastPlayedVoiceTime[upperCaseKey] = now;
            } catch (e) {
                console.error(`Error playing voice ${actualAudioKey} for type ${type}:`, e);
            }
        } else if (!actualAudioKey) { /* console.warn(`Voice key ${upperCaseKey} not found.`); */ }
        else { console.log(`Voice ${upperCaseKey} throttled.`); }

        // --- パワーアップ効果発動 ---
        if (type === POWERUP_TYPES.BAISRAVA) { this.activateBaisrava(); return; }
        if (type === POWERUP_TYPES.VAJRA) { this.activateVajra(); return; }
        if (type === POWERUP_TYPES.MAKIRA) { this.activateMakira(); return; }
        if (type === POWERUP_TYPES.MAKORA) { this.activateMakora(); return; }

        if (type === POWERUP_TYPES.ANCHIRA || type === POWERUP_TYPES.SINDARA) {
            if (this.balls.countActive(true) > 1) { this.keepFurthestBall(); }
        }
        this.activatePower(type);
    }

    // マコラ能力発動
    activateMakora() {
        const copyablePowerType = Phaser.Utils.Array.GetRandom(MAKORA_COPYABLE_POWERS);
        console.log(`Makora copied: ${copyablePowerType}`);
         // ★★★ ここにマコラエフェクト（コピー演出）を追加可能 ★★★

        this.balls.getMatching('active', true).forEach(ball => {
            ball.getData('activePowers').add(POWERUP_TYPES.MAKORA);
            ball.setData('lastActivatedPower', POWERUP_TYPES.MAKORA);
            this.updateBallAppearance(ball);
        });

        this.time.delayedCall(100, () => {
            switch(copyablePowerType) {
                case POWERUP_TYPES.KUBIRA: case POWERUP_TYPES.SHATORA: case POWERUP_TYPES.HAILA: case POWERUP_TYPES.BIKARA: case POWERUP_TYPES.INDARA: case POWERUP_TYPES.ANILA:
                    this.activatePower(copyablePowerType); break;
                case POWERUP_TYPES.ANCHIRA: case POWERUP_TYPES.SINDARA:
                    if (this.balls.countActive(true) > 1) { this.keepFurthestBall(); } this.activatePower(copyablePowerType); break;
                case POWERUP_TYPES.VAJRA: this.activateVajra(); break;
                case POWERUP_TYPES.MAKIRA: this.activateMakira(); break;
            }
             this.balls.getMatching('active', true).forEach(ball => {
                 ball.getData('activePowers').delete(POWERUP_TYPES.MAKORA);
             });
        }, [], this);
    }


    // ボール分裂系能力発動前に、パドルから一番遠いボール以外を削除
    keepFurthestBall() {
        console.log("Keeping furthest ball.");
        const activeBalls = this.balls.getMatching('active', true);
        if (activeBalls.length <= 1) return; // ボールが1つ以下なら何もしない

        let furthestBall = null;
        let maxDistSq = -1;
        const paddlePos = new Phaser.Math.Vector2(this.paddle.x, this.paddle.y);

        activeBalls.forEach(ball => {
            const distSq = Phaser.Math.Distance.Squared(paddlePos.x, paddlePos.y, ball.x, ball.y);
            if (distSq > maxDistSq) {
                maxDistSq = distSq;
                furthestBall = ball;
            }
        });

        activeBalls.forEach(ball => {
            if (ball !== furthestBall) {
                console.log("Destroying closer ball.");
                 // ★★★ ここに消えるボールのエフェクトを追加可能 ★★★
                ball.destroy();
            }
        });
    }


    // 指定されたタイプのパワーアップを発動
    activatePower(type) {
        console.log(`Activating power: ${type}`);
        const targetBalls = this.balls.getMatching('active', true); // アクティブなボール全てが対象
        if (targetBalls.length === 0) {
            console.warn(`No active balls to activate power ${type} on.`);
            return;
        }
         // ★★★ ここにパワーアップ取得時のボールエフェクト（オーラなど）を追加可能 ★★★

        // --- タイマー管理 ---
        if (POWERUP_DURATION[type]) {
            if (this.powerUpTimers[type]) { this.powerUpTimers[type].remove(); }
        }

        // --- ボールへの効果適用 ---
        targetBalls.forEach(ball => {
            if (ball.active) {
                ball.getData('activePowers').add(type);
                ball.setData('lastActivatedPower', type);
            }
        });

        // --- タイプごとの個別処理 ---
        switch (type) {
            case POWERUP_TYPES.KUBIRA: this.activateKubira(targetBalls); break;
            case POWERUP_TYPES.SHATORA: this.activateShatora(targetBalls); break;
            case POWERUP_TYPES.HAILA: this.activateHaira(targetBalls); break;
            case POWERUP_TYPES.ANCHIRA: if (targetBalls.length === 1) this.activateAnchira(targetBalls[0]); break;
            case POWERUP_TYPES.SINDARA: if (targetBalls.length === 1) this.activateSindara(targetBalls[0]); break;
            case POWERUP_TYPES.BIKARA: this.activateBikara(targetBalls); break;
            case POWERUP_TYPES.INDARA: this.activateIndara(targetBalls); break;
            case POWERUP_TYPES.ANILA: this.activateAnila(targetBalls); break;
        }

        // 見た目更新 (分裂系とビカラは個別処理内で更新するので除外)
        if (type !== POWERUP_TYPES.ANCHIRA && type !== POWERUP_TYPES.SINDARA && type !== POWERUP_TYPES.BIKARA) {
            targetBalls.forEach(ball => { if (ball.active) { this.updateBallAppearance(ball); } });
        }

        // --- 効果時間タイマー設定 ---
        const duration = POWERUP_DURATION[type];
        if (duration) {
            this.powerUpTimers[type] = this.time.delayedCall(duration, () => {
                console.log(`Deactivating power ${type} due to duration.`);
                 // ★★★ ここにパワーアップ時間切れエフェクトを追加可能 ★★★
                this.deactivatePowerByType(type); // 時間切れで解除
                this.powerUpTimers[type] = null;
            }, [], this);
        }
        this.setColliders();
    }

    // 指定されたタイプのパワーアップを解除
    deactivatePowerByType(type) {
        console.log(`Deactivating power: ${type}`);
        const targetBalls = this.balls.getMatching('active', true);
        if (targetBalls.length === 0) return;
        if (type === POWERUP_TYPES.VAJRA || type === POWERUP_TYPES.MAKIRA || type === POWERUP_TYPES.MAKORA || type === POWERUP_TYPES.BAISRAVA) return;

        // --- タイプごとの個別解除処理 ---
        switch (type) {
            case POWERUP_TYPES.KUBIRA: this.deactivateKubira(targetBalls); break;
            case POWERUP_TYPES.SHATORA: this.deactivateShatora(targetBalls); break;
            case POWERUP_TYPES.HAILA: this.deactivateHaira(targetBalls); break;
            case POWERUP_TYPES.ANCHIRA: this.deactivateAnchira(targetBalls); break;
            case POWERUP_TYPES.BIKARA: this.deactivateBikara(targetBalls); break;
            case POWERUP_TYPES.SINDARA: this.deactivateSindara(targetBalls); break;
            case POWERUP_TYPES.INDARA: targetBalls.forEach(b => this.deactivateIndaraForBall(b)); break;
            case POWERUP_TYPES.ANILA: targetBalls.forEach(b => this.deactivateAnilaForBall(b)); break;
        }

        // --- ボール共通の解除処理 ---
        targetBalls.forEach(ball => {
            if (ball.active) {
                ball.getData('activePowers').delete(type);
                if (ball.getData('lastActivatedPower') === type) {
                    const remainingPowers = Array.from(ball.getData('activePowers'));
                    ball.setData('lastActivatedPower', remainingPowers.length > 0 ? remainingPowers[remainingPowers.length - 1] : null);
                }
                this.updateBallAppearance(ball);
            }
        });
        this.setColliders();
    }

    // ボールの見た目（テクスチャ、色など）を現在の状態に合わせて更新
    updateBallAppearance(ball) {
        if (!ball || !ball.active) return;
        const activePowers = ball.getData('activePowers');
        const lastPower = ball.getData('lastActivatedPower');
        let textureKey = 'ball_image'; // デフォルト

        if (activePowers && activePowers.size > 0 && lastPower) {
            if (lastPower === POWERUP_TYPES.BIKARA) {
                textureKey = (ball.getData('bikaraState') === 'yang') ? POWERUP_ICON_KEYS.BIKARA_YANG : POWERUP_ICON_KEYS[POWERUP_TYPES.BIKARA];
            } else if (lastPower === POWERUP_TYPES.SINDARA) {
                if (ball.getData('isPenetrating') && !ball.getData('isMerging') && !ball.getData('isAttracting')) {
                    textureKey = POWERUP_ICON_KEYS.SINDARA_SUPER;
                } else {
                    textureKey = POWERUP_ICON_KEYS[POWERUP_TYPES.SINDARA];
                }
            } else if (POWERUP_ICON_KEYS[lastPower]) {
                textureKey = POWERUP_ICON_KEYS[lastPower];
            }
        }

        if (ball.texture.key !== textureKey) { ball.setTexture(textureKey); }
        ball.clearTint();
         // ★★★ ここでパワーアップに応じたオーラエフェクトなどを追加/削除できる ★★★
    }

    // --- 個別パワーアップ処理 ---

    activateKubira(balls) { balls.forEach(b => b.setData('isPenetrating', true)); }
    deactivateKubira(balls) {
        balls.forEach(b => {
            const lastPower = b.getData('lastActivatedPower');
            const isSindaraActive = lastPower === POWERUP_TYPES.SINDARA && b.getData('isPenetrating');
            const isBikaraYangActive = lastPower === POWERUP_TYPES.BIKARA && b.getData('bikaraState') === 'yang';
            if (!isSindaraActive && !isBikaraYangActive) {
                b.setData('isPenetrating', false);
            }
        });
    }

    applySpeedModifier(ball, type) {
        if (!ball || !ball.active || !ball.body) return;
        const modifier = BALL_SPEED_MODIFIERS[type];
        if (!modifier) return;
        const currentVelocity = ball.body.velocity;
        const direction = currentVelocity.length() > 0 ? currentVelocity.clone().normalize() : new Phaser.Math.Vector2(0, -1);
        const newSpeed = NORMAL_BALL_SPEED * modifier;
        ball.setVelocity(direction.x * newSpeed, direction.y * newSpeed);
    }

    resetBallSpeed(ball) {
        if (!ball || !ball.active || !ball.body) return;
        if (ball.getData('isFast')) { this.applySpeedModifier(ball, POWERUP_TYPES.SHATORA); }
        else if (ball.getData('isSlow')) { this.applySpeedModifier(ball, POWERUP_TYPES.HAILA); }
        else {
            const currentVelocity = ball.body.velocity;
            const direction = currentVelocity.length() > 0 ? currentVelocity.clone().normalize() : new Phaser.Math.Vector2(0, -1);
            ball.setVelocity(direction.x * NORMAL_BALL_SPEED, direction.y * NORMAL_BALL_SPEED);
        }
    }

    activateShatora(balls) { balls.forEach(b => { b.setData({ isFast: true, isSlow: false }); this.applySpeedModifier(b, POWERUP_TYPES.SHATORA); }); }
    deactivateShatora(balls) { balls.forEach(b => { if (b.getData('isFast')) { b.setData('isFast', false); this.resetBallSpeed(b); } }); }
    activateHaira(balls) { balls.forEach(b => { b.setData({ isSlow: true, isFast: false }); this.applySpeedModifier(b, POWERUP_TYPES.HAILA); }); }
    deactivateHaira(balls) { balls.forEach(b => { if (b.getData('isSlow')) { b.setData('isSlow', false); this.resetBallSpeed(b); } }); }

    activateAnchira(sourceBall) {
        if (!sourceBall || !sourceBall.active) return;
        console.log("Activating Anchira split.");
        this.updateBallAppearance(sourceBall);
        // ★★★ ここに分裂エフェクトを追加可能 ★★★

        const x = sourceBall.x; const y = sourceBall.y; const numSplits = 3;
        const ballData = sourceBall.data.getAll();
        ballData.lastActivatedPower = POWERUP_TYPES.ANCHIRA;
        if (!ballData.activePowers) ballData.activePowers = new Set();
        ballData.activePowers.add(POWERUP_TYPES.ANCHIRA);

        for (let i = 0; i < numSplits; i++) {
            const offsetX = Phaser.Math.Between(-5, 5); const offsetY = Phaser.Math.Between(-5, 5);
            const vx = Phaser.Math.Between(-150, 150); const vy = -Math.abs(Phaser.Math.Between(NORMAL_BALL_SPEED * 0.5, NORMAL_BALL_SPEED * 0.8));
            this.createAndAddBall(x + offsetX, y + offsetY, vx, vy, ballData);
        }
    }
    deactivateAnchira(balls) { /* Common deactivation handles reset */ }

    activateSindara(sourceBall) {
        if (!sourceBall || !sourceBall.active) return;
        console.log("Activating Sindara split.");
        const theBall = sourceBall;
        this.updateBallAppearance(theBall);
        // ★★★ ここに分裂エフェクトを追加可能 ★★★

        const x = theBall.x; const y = theBall.y;
        const ballData = theBall.data.getAll();
        ballData.lastActivatedPower = POWERUP_TYPES.SINDARA;
        if (!ballData.activePowers) ballData.activePowers = new Set();
        ballData.activePowers.add(POWERUP_TYPES.SINDARA);
        ballData.isAttracting = false; ballData.isMerging = false;

        const vx = Phaser.Math.Between(-150, 150); const vy = -Math.abs(Phaser.Math.Between(NORMAL_BALL_SPEED * 0.5, NORMAL_BALL_SPEED * 0.8));
        const partnerBall = this.createAndAddBall(x + Phaser.Math.Between(-5, 5), y + Phaser.Math.Between(-5, 5), vx, vy, ballData);

        if (partnerBall) {
            theBall.setData({ sindaraPartner: partnerBall, isAttracting: false, isMerging: false });
            partnerBall.setData({ sindaraPartner: theBall, isAttracting: false, isMerging: false });
            if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove();
            console.log("Scheduling Sindara attraction.");
            this.sindaraAttractionTimer = this.time.delayedCall(SINDARA_ATTRACTION_DELAY, () => { this.startSindaraAttraction(theBall, partnerBall); }, [], this);
        } else {
            console.warn("Failed to create partner ball for Sindara.");
            theBall.getData('activePowers').delete(POWERUP_TYPES.SINDARA);
            const remainingPowers = Array.from(theBall.getData('activePowers'));
            theBall.setData('lastActivatedPower', remainingPowers.length > 0 ? remainingPowers[remainingPowers.length - 1] : null);
            this.updateBallAppearance(theBall);
        }
    }

    startSindaraAttraction(ball1, ball2) {
        this.sindaraAttractionTimer = null;
        if (!ball1 || !ball2 || !ball1.active || !ball2.active || ball1.getData('lastActivatedPower') !== POWERUP_TYPES.SINDARA || ball2.getData('lastActivatedPower') !== POWERUP_TYPES.SINDARA) {
            console.warn("Sindara attraction aborted: balls missing or lost power.");
            const activeSindaraBalls = this.balls.getMatching('lastActivatedPower', POWERUP_TYPES.SINDARA);
            if (activeSindaraBalls.length > 0) { this.deactivatePowerByType(POWERUP_TYPES.SINDARA); } return;
        }
        console.log("Starting Sindara attraction.");
         // ★★★ ここに引き寄せ開始エフェクト（オーラなど）を追加可能 ★★★
        ball1.setData({ isAttracting: true, isPenetrating: true });
        ball2.setData({ isAttracting: true, isPenetrating: true });
        this.updateBallAppearance(ball1); this.updateBallAppearance(ball2); this.setColliders();
    }

    updateSindaraAttraction(ball) { const partner = ball.getData('sindaraPartner'); if (partner && partner.active && ball.active && ball.getData('isAttracting') && partner.getData('isAttracting') && !ball.getData('isMerging') && !partner.getData('isMerging')) { this.physics.moveToObject(ball, partner, SINDARA_ATTRACTION_FORCE); } }
    handleBallCollision(ball1, ball2) { if (ball1.active && ball2.active && ball1.getData('sindaraPartner') === ball2 && ball1.getData('isAttracting')) { console.log("Sindara balls collided, merging."); this.mergeSindaraBalls(ball1, ball2); } }

    mergeSindaraBalls(ballToKeep, ballToRemove) {
        console.log("[Debug] mergeSindaraBalls called.");
        // ★★★ ここに合体エフェクトを追加可能 ★★★
        console.log("[Debug] Attempting to play VOICE_SINDARA_MERGE..."); try { this.sound.play(AUDIO_KEYS.VOICE_SINDARA_MERGE); } catch (error) { console.error("[Debug] Error playing VOICE_SINDARA_MERGE:", error); }
        console.log("[Debug] Attempting to play SE_SINDARA_MERGE..."); try { this.sound.play(AUDIO_KEYS.SE_SINDARA_MERGE); } catch (error) { console.error("[Debug] Error playing SE_SINDARA_MERGE:", error); }

        const mergeX = (ballToKeep.x + ballToRemove.x) / 2; const mergeY = (ballToKeep.y + ballToRemove.y) / 2;
        ballToKeep.setPosition(mergeX, mergeY); ballToRemove.destroy();
        ballToKeep.setData({ isMerging: true, isAttracting: false, isPenetrating: true, sindaraPartner: null });
        this.updateBallAppearance(ballToKeep); // 見た目更新 (まだ通常アイコンのはず)

        if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); if (this.sindaraAttractionTimer) { this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null; }

        console.log("Scheduling Sindara merge finish.");
        this.sindaraMergeTimer = this.time.delayedCall(SINDARA_MERGE_DURATION, () => { this.finishSindaraMerge(ballToKeep); }, [], this);
        this.setColliders();
    }

    finishSindaraMerge(mergedBall) {
        this.sindaraMergeTimer = null; if (!mergedBall || !mergedBall.active) return;
        console.log("Finishing Sindara merge.");
         // ★★★ ここに合体完了エフェクトを追加可能 ★★★
        mergedBall.setData({ isMerging: false });
        this.updateBallAppearance(mergedBall); // 見た目をスーパーシンダラアイコンに

        if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove();
        console.log("Scheduling Sindara post-merge penetration deactivation.");
        this.sindaraPenetrationTimer = this.time.delayedCall(SINDARA_POST_MERGE_PENETRATION_DURATION, () => { this.deactivateSindaraPenetration(mergedBall); }, [], this);
        this.setColliders();
    }

    deactivateSindaraPenetration(ball) {
        this.sindaraPenetrationTimer = null; if (!ball || !ball.active) return;
        console.log("Deactivating Sindara post-merge penetration.");
         // ★★★ ここに貫通終了エフェクトを追加可能 ★★★
        if (!ball.getData('activePowers').has(POWERUP_TYPES.KUBIRA)) {
            const isBikaraYang = ball.getData('lastActivatedPower') === POWERUP_TYPES.BIKARA && ball.getData('bikaraState') === 'yang';
            if (!isBikaraYang) { ball.setData('isPenetrating', false); }
        }
        this.deactivatePowerByType(POWERUP_TYPES.SINDARA);
    }

    deactivateSindara(balls) {
        console.log("Deactivating Sindara power completely.");
        if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null;
        if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); this.sindaraMergeTimer = null;
        if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); this.sindaraPenetrationTimer = null;
        balls.forEach(b => {
            if (b.active) {
                b.setData({ sindaraPartner: null, isAttracting: false, isMerging: false });
                if (!b.getData('activePowers').has(POWERUP_TYPES.KUBIRA)) {
                    const isBikaraYang = b.getData('lastActivatedPower') === POWERUP_TYPES.BIKARA && b.getData('bikaraState') === 'yang';
                    if (!isBikaraYang) { b.setData('isPenetrating', false); }
                }
            }
        });
    }

    activateBikara(balls) {
        balls.forEach(ball => {
            if (ball.active) {
                ball.setData({ bikaraState: 'yin', bikaraYangCount: 0 });
                if (!ball.getData('activePowers').has(POWERUP_TYPES.KUBIRA)) {
                    const isSindaraActive = ball.getData('lastActivatedPower') === POWERUP_TYPES.SINDARA && ball.getData('isPenetrating');
                    if (!isSindaraActive) { ball.setData('isPenetrating', false); }
                }
                this.updateBallAppearance(ball);
            }
        });
        this.setColliders();
    }

    deactivateBikara(balls) {
        balls.forEach(ball => {
            if (ball.active) {
                ball.setData({ bikaraState: null, bikaraYangCount: 0 });
                 if (!ball.getData('activePowers').has(POWERUP_TYPES.KUBIRA)) {
                     const isSindaraActive = ball.getData('lastActivatedPower') === POWERUP_TYPES.SINDARA && ball.getData('isPenetrating');
                     if (!isSindaraActive) { ball.setData('isPenetrating', false); }
                 }
            }
        });
        this.bricks.getChildren().forEach(br => {
            if (br.getData && br.getData('isMarkedByBikara')) {
                br.setData('isMarkedByBikara', false);
                br.setTint(br.getData('originalTint') || 0xffffff);
            }
        });
    }

    switchBikaraState(ball) {
        if (!ball || !ball.active || ball.getData('lastActivatedPower') !== POWERUP_TYPES.BIKARA) return;
        const currentState = ball.getData('bikaraState');
        const nextState = (currentState === 'yin') ? 'yang' : 'yin';
        console.log(`Switching Bikara state from ${currentState} to ${nextState}`);
        ball.setData('bikaraState', nextState);
        // ★★★ ここに陰陽転換エフェクトを追加可能 ★★★

        console.log("[Debug] Attempting to play SE_BIKARA_CHANGE..."); try { this.sound.play(AUDIO_KEYS.SE_BIKARA_CHANGE); } catch (error) { console.error("[Debug] Error playing SE_BIKARA_CHANGE:", error); }
        if (nextState === 'yang') {
            ball.setData('bikaraYangCount', 0);
            console.log("[Debug] Attempting to play VOICE_BIKARA_YANG..."); try { this.sound.play(AUDIO_KEYS.VOICE_BIKARA_YANG); } catch (error) { console.error("[Debug] Error playing VOICE_BIKARA_YANG:", error); }
        } else {
             console.log("[Debug] Attempting to play VOICE_BIKARA_YIN..."); try { this.sound.play(AUDIO_KEYS.VOICE_BIKARA_YIN); } catch (error) { console.error("[Debug] Error playing VOICE_BIKARA_YIN:", error); }
        }
        this.updateBallAppearance(ball); this.setColliders();
    }

    markBrickByBikara(brick) {
        if (!brick || !brick.active || !brick.getData || brick.getData('isMarkedByBikara') || brick.getData('maxHits') === -1) return;
        brick.setData('isMarkedByBikara', true);
        brick.setTint(BRICK_MARKED_COLOR);
         // ★★★ ここにマークエフェクトを追加可能（再掲） ★★★
    }

    activateIndara(balls) { balls.forEach(b => b.setData({ isIndaraActive: true, indaraHomingCount: INDARA_MAX_HOMING_COUNT })); }
    deactivateIndaraForBall(ball) { if (!ball || !ball.active || !ball.getData('isIndaraActive')) return; console.log("Deactivating Indara for ball."); ball.setData({ isIndaraActive: false, indaraHomingCount: 0 }); }

    // 物理世界の境界線に衝突した時の処理 (壁反射)
    handleWorldBounds(body, up, down, left, right) {
        const ball = body.gameObject;
        if (!ball || !(ball instanceof Phaser.Physics.Arcade.Image) || !this.balls.contains(ball) || !ball.active) return;

        if (up || left || right) { // 上左右の壁
            // --- 壁ヒットエフェクト ---
            try {
                let impactPointX = ball.x;
                let impactPointY = ball.y;
                let angleMin = 0, angleMax = 0;

                // 衝突した壁に応じて発生位置と角度を設定
                if (up) {
                    impactPointY = ball.body.y; // 上端
                    angleMin = 60; angleMax = 120; // 下向きに広がる
                } else if (left) {
                    impactPointX = ball.body.x; // 左端
                    angleMin = -30; angleMax = 30; // 右向きに広がる
                } else if (right) {
                    impactPointX = ball.body.x + ball.body.width; // 右端
                    angleMin = 150; angleMax = 210; // 左向きに広がる
                }

                const particles = this.add.particles(0, 0, 'whitePixel', {
                    x: impactPointX,
                    y: impactPointY,
                    lifespan: 150, // 短い寿命
                    speed: { min: 100, max: 200 }, // 速度
                    angle: { min: angleMin, max: angleMax }, // 壁からの反射方向
                    gravityY: 100, // 少し重力
                    scale: { start: 0.4, end: 0 }, // 小さな粒子
                    quantity: 4, // 少量
                    blendMode: 'ADD', // 加算合成
                    emitting: false
                });
                particles.setParticleTint(0xffffff); // 壁は白
                particles.explode(4); // 放出
                // 短時間後にエミッタを破棄
                this.time.delayedCall(200, () => {
                    if (particles && particles.scene) particles.destroy();
                });

            } catch (error) {
                console.error("Error creating wall hit particle effect:", error);
            }
             // --- エフェクト終了 ---

             /// --- ▼ SE_REFLECT の再生処理を修正・復活 ▼ ---
        console.log("[Debug] Attempting to play SE_REFLECT (wall)...");
        try {
            this.sound.add(AUDIO_KEYS.SE_REFLECT).play();
            console.log("SE_REFLECT (wall) playback attempted via add().play().");
            // 元のコード: /* this.sound.play(AUDIO_KEYS.SE_REFLECT); */
        } catch(e) {
            console.error("Error playing SE_REFLECT (wall):", e);
        }
        // --- ▲ SE_REFLECT の再生処理を修正・復活 ▲ ---

             // インダラ能力チェック
             if (ball.getData('isIndaraActive') && ball.getData('indaraHomingCount') > 0) {
                 console.log("Indara homing attempt on world bounds.");
                 const currentHomingCount = ball.getData('indaraHomingCount');
                 const targetBricks = this.bricks.getMatching('active', true).filter(b => b.getData && b.getData('maxHits') !== -1);

                 if (targetBricks.length > 0) {
                     let closestBrick = null; let minDistSq = Infinity;
                     const ballCenter = ball.body.center;
                     targetBricks.forEach(brick => {
                         const distSq = Phaser.Math.Distance.Squared(ballCenter.x, ballCenter.y, brick.body.center.x, brick.body.center.y);
                         if (distSq < minDistSq) { minDistSq = distSq; closestBrick = brick; }
                     });

                     if (closestBrick) {
                         console.log("Indara homing target found, changing velocity.");
                          // ★★★ ここにホーミング開始エフェクトを追加可能 ★★★
                         const currentSpeed = ball.body.velocity.length();
                         const angle = Phaser.Math.Angle.BetweenPoints(ballCenter, closestBrick.body.center);
                         this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), currentSpeed, ball.body.velocity);

                         const newHomingCount = currentHomingCount - 1;
                         ball.setData('indaraHomingCount', newHomingCount);
                         if (newHomingCount <= 0) {
                             console.log("Indara homing count reached zero.");
                             this.deactivateIndaraForBall(ball);
                         }
                     }
                 }
             }
        }
    }


    activateAnila(balls) { balls.forEach(b => { if (!b.getData('isAnilaActive')) { b.setData('isAnilaActive', true); } }); }
    deactivateAnilaForBall(ball) { if (!ball || !ball.active || !ball.getData('isAnilaActive')) return; ball.setData('isAnilaActive', false); }

    triggerAnilaBounce(ball) {
        if (!ball || !ball.active || !ball.getData('isAnilaActive')) return;
        console.log("Triggering Anila bounce.");
        // ★★★ ここにアニラバウンドエフェクトを追加可能 ★★★

        const currentVy = ball.body.velocity.y;
        const bounceVy = -Math.abs(currentVy > -10 ? BALL_INITIAL_VELOCITY_Y * 0.7 : currentVy * 0.8);
        ball.setVelocityY(bounceVy);
        ball.y = this.gameHeight - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
        this.deactivateAnilaForBall(ball);
        this.deactivatePowerByType(POWERUP_TYPES.ANILA);
    }


    activateVajra() {
        if (!this.isVajraSystemActive) {
            console.log("Activating Vajra system.");
             // ★★★ ここにヴァジラゲージ出現エフェクトを追加可能 ★★★
            this.isVajraSystemActive = true;
            this.vajraGauge = 0;
            this.events.emit('activateVajraUI', this.vajraGauge, VAJRA_GAUGE_MAX);
            this.balls.getMatching('active', true).forEach(ball => {
                ball.getData('activePowers').add(POWERUP_TYPES.VAJRA);
                ball.setData('lastActivatedPower', POWERUP_TYPES.VAJRA);
                this.updateBallAppearance(ball);
            });
        }
    }

    increaseVajraGauge() {
        if (this.isVajraSystemActive && !this.isStageClearing && !this.isGameOver) {
            this.vajraGauge += VAJRA_GAUGE_INCREMENT;
            this.vajraGauge = Math.min(this.vajraGauge, VAJRA_GAUGE_MAX);
             // ★★★ ここにゲージ増加エフェクトを追加可能 ★★★
            this.events.emit('updateVajraGauge', this.vajraGauge);
            if (this.vajraGauge >= VAJRA_GAUGE_MAX) {
                 // ★★★ ここにゲージMAXエフェクトを追加可能 ★★★
                this.triggerVajraDestroy();
            }
        }
    }

    // GameScene.js の deactivateVajra メソッド

    deactivateVajra() {
        console.log("[Shutdown] Entering deactivateVajra method..."); // 開始ログ
        if (this.isVajraSystemActive) {
            console.log("[Shutdown] Deactivating Vajra system flag.");
            this.isVajraSystemActive = false;
        }
        this.vajraGauge = 0;
        // UIイベントの発行は try-catch で囲むとより安全
        try {
            this.events.emit('deactivateVajraUI');
            console.log("[Shutdown] Vajra gauge reset and UI event emitted.");
        } catch (e) {
            console.error("[Shutdown] Error emitting deactivateVajraUI event:", e.message);
        }


        // ▼▼▼ this.balls が存在し、かつ有効かチェック ▼▼▼
        if (this.balls && this.balls.scene && this.balls.active) { // グループが存在し、シーンに属し、アクティブか確認
            console.log("[Shutdown] Attempting to clear Vajra status from active balls...");
            try {
                 // getMatching('active', true) はエラーの原因になりうるので、childrenを直接ループする方が安全かもしれない
                 const children = this.balls.getChildren();
                 console.log(`[Shutdown] Iterating over ${children.length} balls in group for Vajra clear.`);
                 children.forEach(ball => {
                    // ループ中にボールが破棄される可能性も考慮
                    if (ball && ball.active && ball.getData) { // ボールが有効か、getDataが存在するか確認
                        try {
                             ball.getData('activePowers')?.delete(POWERUP_TYPES.VAJRA); // Optional chaining
                             if (ball.getData('lastActivatedPower') === POWERUP_TYPES.VAJRA) {
                                 const remainingPowers = Array.from(ball.getData('activePowers') || []); // Ensure iterable
                                 ball.setData('lastActivatedPower', remainingPowers.length > 0 ? remainingPowers[remainingPowers.length - 1] : null);
                             }
                             this.updateBallAppearance(ball);
                        } catch (ballError) {
                             console.error("[Shutdown] Error processing individual ball in deactivateVajra:", ballError.message, ball?.name); // エラー発生時のボール情報も出す
                        }
                    }
                 });
                 console.log("[Shutdown] Finished clearing Vajra status from balls.");
            } catch (e) {
                 console.error("[Shutdown] Error during ball iteration in deactivateVajra:", e.message, e.stack);
            }
        } else {
            console.log("[Shutdown] this.balls group does not exist or is inactive, skipping ball status clear.");
        }
         console.log("[Shutdown] Exiting deactivateVajra method."); // 終了ログ
    }

    activateMakira() {
        if (!this.isMakiraActive) {
            console.log("Activating Makira.");
             // ★★★ ここにマキラ（ファミリア召喚）エフェクトを追加可能 ★★★
            this.isMakiraActive = true;
            if (this.familiars) this.familiars.clear(true, true); else this.familiars = this.physics.add.group();
            this.createFamiliars();
            if (this.makiraBeams) this.makiraBeams.clear(true, true); else this.makiraBeams = this.physics.add.group();
            if (this.makiraAttackTimer) this.makiraAttackTimer.remove();
            this.makiraAttackTimer = this.time.addEvent({ delay: MAKIRA_ATTACK_INTERVAL, callback: this.fireMakiraBeam, callbackScope: this, loop: true });
            this.balls.getMatching('active', true).forEach(ball => {
                ball.getData('activePowers').add(POWERUP_TYPES.MAKIRA);
                ball.setData('lastActivatedPower', POWERUP_TYPES.MAKIRA);
                this.updateBallAppearance(ball);
            });
        }
        const duration = POWERUP_DURATION[POWERUP_TYPES.MAKIRA];
        if (this.powerUpTimers[POWERUP_TYPES.MAKIRA]) this.powerUpTimers[POWERUP_TYPES.MAKIRA].remove();
        this.powerUpTimers[POWERUP_TYPES.MAKIRA] = this.time.delayedCall(duration, () => {
            console.log("Deactivating Makira due to duration.");
             // ★★★ ここにマキラ終了エフェクトを追加可能 ★★★
            this.deactivateMakira();
            this.powerUpTimers[POWERUP_TYPES.MAKIRA] = null;
        }, [], this);
        this.setColliders();
    }

    deactivateMakira() {
        if (this.isMakiraActive) {
            console.log("Deactivating Makira.");
            this.isMakiraActive = false;
            if (this.makiraAttackTimer) { this.makiraAttackTimer.remove(); this.makiraAttackTimer = null; }
            if (this.powerUpTimers[POWERUP_TYPES.MAKIRA]) { this.powerUpTimers[POWERUP_TYPES.MAKIRA].remove(); this.powerUpTimers[POWERUP_TYPES.MAKIRA] = null; }
            if (this.familiars) { this.familiars.clear(true, true); }
            if (this.makiraBeams) { this.makiraBeams.clear(true, true); }
            this.balls.getMatching('active', true).forEach(ball => {
                ball.getData('activePowers').delete(POWERUP_TYPES.MAKIRA);
                if (ball.getData('lastActivatedPower') === POWERUP_TYPES.MAKIRA) {
                    const remainingPowers = Array.from(ball.getData('activePowers'));
                    ball.setData('lastActivatedPower', remainingPowers.length > 0 ? remainingPowers[remainingPowers.length - 1] : null);
                }
                this.updateBallAppearance(ball);
            });
        }
    }

    createFamiliars() {
        if (!this.paddle) return;
        const paddleX = this.paddle.x; const familiarY = this.paddle.y - PADDLE_HEIGHT / 2 - MAKIRA_FAMILIAR_SIZE;
        const familiarLeft = this.familiars.create(paddleX - MAKIRA_FAMILIAR_OFFSET, familiarY, 'joykun').setDisplaySize(MAKIRA_FAMILIAR_SIZE * 2, MAKIRA_FAMILIAR_SIZE * 2).clearTint();
        if (familiarLeft.body) { familiarLeft.body.setAllowGravity(false).setImmovable(true); } else { console.error("Failed to create familiarLeft physics body!"); if(familiarLeft) familiarLeft.destroy(); }
        const familiarRight = this.familiars.create(paddleX + MAKIRA_FAMILIAR_OFFSET, familiarY, 'joykun').setDisplaySize(MAKIRA_FAMILIAR_SIZE * 2, MAKIRA_FAMILIAR_SIZE * 2).clearTint();
        if (familiarRight.body) { familiarRight.body.setAllowGravity(false).setImmovable(true); } else { console.error("Failed to create familiarRight physics body!"); if(familiarRight) familiarRight.destroy();}
    }

    fireMakiraBeam() {
        if (!this.isMakiraActive || !this.familiars || this.familiars.countActive(true) === 0 || this.isStageClearing || this.isGameOver) return;
        /* this.sound.play(AUDIO_KEYS.SE_MAKIRA_BEAM); */
        this.familiars.getChildren().forEach(familiar => {
            if (familiar.active) {
                 // ★★★ ここにビーム発射エフェクトを追加可能 ★★★
                const beam = this.makiraBeams.create(familiar.x, familiar.y - MAKIRA_FAMILIAR_SIZE, 'whitePixel').setDisplaySize(MAKIRA_BEAM_WIDTH, MAKIRA_BEAM_HEIGHT).setTint(MAKIRA_BEAM_COLOR);
                if (beam && beam.body) { beam.setVelocity(0, -MAKIRA_BEAM_SPEED); beam.body.setAllowGravity(false); }
                else { console.error("Failed to create Makira beam body!"); if (beam) beam.destroy(); }
            }
        });
    }


    // --- ゲーム進行管理 ---

    loseLife() {
        if (this.isStageClearing || this.isGameOver || this.lives <= 0) return;
        console.log(`Losing life. Lives remaining: ${this.lives - 1}`);
         // ★★★ ここにライフ減少エフェクトを追加可能 ★★★

        this.deactivateMakira(); this.deactivateVajra();
        Object.keys(this.powerUpTimers).forEach(key => { if (this.powerUpTimers[key]) { this.powerUpTimers[key].remove(); this.powerUpTimers[key] = null; } });
        if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null;
        if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); this.sindaraMergeTimer = null;
        if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); this.sindaraPenetrationTimer = null;

        this.lives--;
        this.events.emit('updateLives', this.lives);
        this.isBallLaunched = false;

        const activeBalls = this.balls.getMatching('active', true);
        if (activeBalls.length > 0) {
            activeBalls.forEach(ball => {
                if (ball.active) {
                    ball.setData('activePowers', new Set()); ball.setData('lastActivatedPower', null);
                    ball.setData({ isPenetrating: false, isFast: false, isSlow: false, sindaraPartner: null, isAttracting: false, isMerging: false, bikaraState: null, bikaraYangCount: 0, isIndaraActive: false, indaraHomingCount: 0, isAnilaActive: false });
                    this.resetBallSpeed(ball); this.updateBallAppearance(ball);
                }
            });
        }

        if (this.lives > 0) {
            this.time.delayedCall(500, this.resetForNewLife, [], this);
        } else {
            console.log("Game Over condition met.");
               // --- ▼ SE_GAME_OVER を try...catch で囲む ▼ ---
               try {
                this.sound.play(AUDIO_KEYS.SE_GAME_OVER); // ゲームオーバー音
            } catch (error) {
                console.error("Error playing SE_GAME_OVER:", error);
            }
            // --- ▲ SE_GAME_OVER を try...catch で囲む ▲ ---
            this.stopBgm();
             // ★★★ ここにゲームオーバー演出を追加可能 ★★★
            this.time.delayedCall(500, this.gameOver, [], this);
        }
    }

    resetForNewLife() {
        if (this.isGameOver || this.isStageClearing) { console.warn(`resetForNewLife aborted: isGameOver=${this.isGameOver}, isStageClearing=${this.isStageClearing}`); return; }
        console.log("Resetting for new life...");
         // ★★★ ここに復活エフェクトを追加可能 ★★★

        if (this.balls) { this.balls.clear(true, true); } else { console.warn("this.balls was null..."); this.balls = this.physics.add.group({ bounceX: 1, bounceY: 1, collideWorldBounds: true }); }
        if (this.paddle && this.paddle.active) { this.paddle.x = this.scale.width / 2; this.updatePaddleSize(); } else { console.warn("Paddle not found..."); }

        let newBall = null;
        if (this.paddle && this.paddle.active) { newBall = this.createAndAddBall(this.paddle.x, this.paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS); }
        else { newBall = this.createAndAddBall(this.scale.width / 2, this.scale.height - PADDLE_Y_OFFSET - PADDLE_HEIGHT / 2 - BALL_RADIUS); }

        if (newBall) { this.isBallLaunched = false; this.setColliders(); console.log("New ball created and colliders set."); }
        else { console.error("Failed to create new ball in resetForNewLife!"); this.gameOver(); }
    }

    gameOver() {
        // --- ▼ gameOver メソッド全体を try...catch で囲む ▼ ---
        try {
            if (this.isGameOver) return;
            console.log("Executing gameOver sequence.");
            this.isGameOver = true;

            this.deactivateMakira();
            this.deactivateVajra();

            if (this.gameOverText) this.gameOverText.setVisible(true);

            // 物理演算を停止 (エラーが起きやすい可能性)
            try {
                if (this.physics.world.running) { // 実行中か確認
                    this.physics.pause();
                    console.log("Physics paused for game over.");
                } else {
                    console.log("Physics already paused.");
                }
            } catch(e) {
                 console.error("Error pausing physics in gameOver:", e);
            }


            if (this.balls) { /* ... ボール停止 ... */ }
            Object.values(this.powerUpTimers).forEach(timer => { /* ... タイマー削除 ... */ });
            this.powerUpTimers = {};
            if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); /* ... */
            if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); /* ... */
            if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); /* ... */
            if (this.makiraAttackTimer) this.makiraAttackTimer.remove(); /* ... */

        } catch (error) {
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("Error occurred during gameOver method:", error);
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
             // フォールバックとして、最低限ゲームオーバー状態にする
             this.isGameOver = true;
             if (this.gameOverText) this.gameOverText.setVisible(true);
        }
        // --- ▲ gameOver メソッド全体を try...catch で囲む ▲ ---
    }

    stageClear() {
        if (this.isStageClearing || this.isGameOver) return;
        console.log(`Stage ${this.currentStage} Clear Initiated.`);
        this.isStageClearing = true;
        // ★★★ ここにステージクリア演出（画面フラッシュなど）を追加可能 ★★★

        this.deactivateMakira(); this.deactivateVajra();
        // --- ▼ SE_STAGE_CLEAR の再生処理を修正・復活 ▼ ---
    try {
        console.log("[Debug] Attempting to play SE_STAGE_CLEAR (stage clear)...");
        this.sound.add(AUDIO_KEYS.SE_STAGE_CLEAR).play();
        console.log("SE_STAGE_CLEAR (stage clear) playback attempted via add().play().");
        // 元のコード: /* this.sound.play(AUDIO_KEYS.SE_STAGE_CLEAR); */
    } catch (e) {
        console.error("Error playing SE_STAGE_CLEAR (stage clear):", e);
    }
    // --- ▲ SE_STAGE_CLEAR の再生処理を修正・復活 ▲ ---
        this.physics.pause();
        Object.keys(this.powerUpTimers).forEach(key => { if (this.powerUpTimers[key]) { this.powerUpTimers[key].remove(); this.powerUpTimers[key] = null; } });
        if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null;
        if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); this.sindaraMergeTimer = null;
        if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); this.sindaraPenetrationTimer = null;

        const activeBalls = this.balls.getMatching('active', true);
        if (activeBalls.length > 0) {
            activeBalls.forEach(ball => {
                if (ball.active) {
                     // ★★★ ここにボール消滅/吸収エフェクトを追加可能 ★★★
                    ball.setData('activePowers', new Set()); ball.setData('lastActivatedPower', null);
                    ball.setData({ /* reset state */ });
                    this.updateBallAppearance(ball); ball.setVelocity(0, 0);
                }
            });
        }
        if (this.bricks) { this.bricks.getChildren().forEach(br => { if (br.getData && br.getData('isMarkedByBikara')) { br.setData('isMarkedByBikara', false); } }); }
        if (this.powerUps) { this.powerUps.clear(true, true); }

        this.currentStage++;
        console.log(`Incrementing stage to ${this.currentStage}`);

        // --- ▼ ステージ遷移処理 (再掲) ▼ ---
       if (this.currentStage === MAX_STAGE) { // ★ ステージ12になったら
        console.log("Proceeding to Boss Stage!");
        console.log("Passing chaosSettings to BossScene:", this.chaosSettings); // ★ 渡す直前の値を確認
        this.scene.start('BossScene', { // ★ BossSceneを開始
            lives: this.lives,
            score: this.score,
            chaosSettings: this.chaosSettings // ★ カオス設定も引き継ぐ
        });
         // GameScene用のUIは停止 (BossScene側で再起動する想定)
        if (this.scene.isActive('UIScene')) {
             this.scene.stop('UIScene');
        }
    } else if (this.currentStage > MAX_STAGE) {
        console.log("Game Complete triggered (from stageClear).");
        this.gameComplete();
    } else { // ★ 通常ステージクリア
        this.events.emit('updateStage', this.currentStage);
        this.updateBgm();
        const nextBgKey = this.getBackgroundKeyForStage(this.currentStage);
        if (this.bgImage && this.bgImage.texture.key !== nextBgKey) { this.bgImage.setTexture(nextBgKey); this.resizeBackground(); }
        console.log("Scheduling next stage setup...");
        this.time.delayedCall(1000, () => {
              if (this.isGameOver || !this.scene || !this.scene.isActive()) { return; }
              this.isStageClearing = false;
              try {
                  this.setupStage(); this.resetForNewLife(); this.physics.resume();
              } catch (e_inner) { if (!this.isGameOver) { this.returnToTitle(); } }
          }, [], this);
    }
    // --- ▲ ステージ遷移処理 ▲ ---
}

    gameComplete() {
        console.log("Game Complete!");
         // ★★★ ここにゲームクリア演出を追加可能 ★★★
        this.sound.play(AUDIO_KEYS.SE_STAGE_CLEAR);
        this.stopBgm();
        alert(`ゲームクリア！ スコア: ${this.score}`);
        this.returnToTitle();
    }

returnToTitle() {
    // --- ▼ シーン遷移の代わりにページリロードを実行 ▼ ---
    try {
        console.log("[ReturnToTitle] Attempting to reload the page...");
        this.stopBgm(); // BGMは止めておく

        // ★ ページ全体をリロード ★
        window.location.reload();

        // リロード後は以下のコードは実行されない
        // console.log("[ReturnToTitle] Reload command sent.");

    } catch (error) {
         console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
         console.error("[ReturnToTitle] CRITICAL Error occurred during returnToTitle (reload):", error);
         console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
         // リロード失敗時のフォールバックは難しい
    }
    // --- ▲ シーン遷移の代わりにページリロードを実行 ▲ ---
}
// shutdownScene メソッドは変更なし (scene.start によって自動的に呼ばれる)
// safeDestroy ヘルパーメソッドも変更なし
    

    // GameScene.js の shutdownScene メソッド（再掲、エラー詳細化版）

    shutdownScene() {
        try {
            console.log("[Shutdown] GameScene shutdown initiated.");
            console.log("[Shutdown] Stopping BGM...");
            this.stopBgm();
            console.log("[Shutdown] BGM stopped.");

            // --- イベントリスナー解除など ---
            console.log("[Shutdown] Removing event listeners...");
            try {
                if (this.scale) this.scale.off('resize', this.handleResize, this);
                if (this.physics.world) this.physics.world.off('worldbounds', this.handleWorldBounds, this);
                this.events.removeAllListeners();
                if (this.input) this.input.removeAllListeners();
                console.log("[Shutdown] Event listeners removed.");
            } catch (e) {
                console.error("[Shutdown] Error removing event listeners:", e.message, e.stack);
            }

            // --- 状態リセット & 関連処理停止 ---
            console.log("[Shutdown] Resetting flags and deactivating systems...");
            this.isGameOver = false;
            this.isStageClearing = false;
            try {
                console.log("[Shutdown] Deactivating Makira...");
                this.deactivateMakira();
                console.log("[Shutdown] Makira deactivated.");
            } catch(e) {
                console.error("[Shutdown] Error during deactivateMakira:", e.message, e.stack);
            }
             try {
                console.log("[Shutdown] Deactivating Vajra...");
                this.deactivateVajra();
                console.log("[Shutdown] Vajra deactivated.");
            } catch(e) {
                console.error("[Shutdown] Error during deactivateVajra:", e.message, e.stack);
            }
            console.log("[Shutdown] Flags reset and systems deactivated.");


            // --- タイマー解除 ---
            console.log("[Shutdown] Removing timers...");
             try {
                Object.values(this.powerUpTimers).forEach(timer => { if (timer) timer.remove(false); });
                this.powerUpTimers = {};
                if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(false); this.sindaraAttractionTimer = null;
                if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(false); this.sindaraMergeTimer = null;
                if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(false); this.sindaraPenetrationTimer = null;
                if (this.makiraAttackTimer) this.makiraAttackTimer.remove(false); this.makiraAttackTimer = null;
                console.log("[Shutdown] Timers removed.");
            } catch (e) {
                 console.error("[Shutdown] Error removing timers:", e.message, e.stack);
            }


            // --- オブジェクト破棄 (safeDestroyを使用) ---
            console.log("[Shutdown] Destroying GameObjects...");
            this.safeDestroy(this.bgImage, "bgImage");
            this.safeDestroy(this.balls, "balls group", true);
            this.safeDestroy(this.bricks, "bricks group", true);
            this.safeDestroy(this.powerUps, "powerUps group", true);
            this.safeDestroy(this.paddle, "paddle");
            this.safeDestroy(this.familiars, "familiars group", true);
            this.safeDestroy(this.makiraBeams, "makiraBeams group", true);
            this.safeDestroy(this.gameOverText, "gameOverText");
            console.log("[Shutdown] Finished destroying GameObjects.");

            // --- オブジェクト参照をnullに設定 ---
            this.bgImage = null; this.balls = null; this.bricks = null; this.powerUps = null; this.paddle = null; this.familiars = null; this.makiraBeams = null; this.gameOverText = null;


            // --- コライダー参照クリア ---
            console.log("[Shutdown] Clearing collider references...");
            this.ballPaddleCollider = null;
            this.ballBrickCollider = null;
            this.ballBrickOverlap = null;
            this.ballBallCollider = null;
            this.makiraBeamBrickOverlap = null;
            console.log("[Shutdown] Collider references cleared.");

            console.log("[Shutdown] GameScene shutdown COMPLETE."); // ★ 完了ログ

        } catch (error) { // shutdownScene全体のcatchブロック
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("[Shutdown] CRITICAL Error occurred during shutdownScene method:");
            console.error(" Message:", error.message); // ★エラーメッセージ
            console.error(" Stack:", error.stack);     // ★スタックトレース
            console.error(" Error Object:", error);
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
             // エラーが起きても、最低限参照はnullにしておく
             this.bgImage = null; this.balls = null; this.bricks = null; this.powerUps = null; this.paddle = null; this.familiars = null; this.makiraBeams = null; this.gameOverText = null;
             this.ballPaddleCollider = null; this.ballBrickCollider = null; this.ballBrickOverlap = null; this.ballBallCollider = null; this.makiraBeamBrickOverlap = null;
        }
    }

    // オブジェクトを安全に破棄するためのヘルパーメソッド (変更なし)
    safeDestroy(obj, name, destroyChildren = false) {
        if (obj && obj.scene) {
            console.log(`[Shutdown] Attempting to destroy ${name}...`);
            try {
                obj.destroy(destroyChildren);
                console.log(`[Shutdown] ${name} destroyed.`);
            } catch (e) {
                console.error(`[Shutdown] Error destroying ${name}:`, e.message, e.stack);
            }
        } else {
            console.log(`[Shutdown] ${name} was null or already destroyed.`);
        }
    }
} // <-- GameScene クラスの終わ
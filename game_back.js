// --- 定数 ---
const PADDLE_WIDTH_RATIO = 0.2;
const PADDLE_HEIGHT = 20;
const PADDLE_Y_OFFSET = 50;
const BALL_RADIUS = 18;
const PHYSICS_BALL_RADIUS = 60;
const BALL_INITIAL_VELOCITY_Y = -350;
const BALL_INITIAL_VELOCITY_X_RANGE = [-150, 150];
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH_RATIO = 0.095; // 見切れ対策
const BRICK_HEIGHT = 20;
const BRICK_SPACING = 4;
const BRICK_OFFSET_TOP = 100;
const DURABLE_BRICK_CHANCE = 0.2;
const MAX_DURABLE_HITS = 3;
const DURABLE_BRICK_COLOR = 0xaaaaaa;
const DURABLE_BRICK_HIT_DARKEN = 40;
const INDESTRUCTIBLE_BRICK_COLOR = 0x333333;
const MAX_STAGE = 12;

const BRICK_COLORS = [ 0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff ];
const BRICK_MARKED_COLOR = 0x666666;

const BAISRAVA_DROP_RATE = 0.02;
const POWERUP_SIZE = 40;
const POWERUP_SPEED_Y = 100;
const POWERUP_TYPES = { KUBIRA: 'kubira', SHATORA: 'shatora', HAILA: 'haila', ANCHIRA: 'anchira', SINDARA: 'sindara', BIKARA: 'bikara', INDARA: 'indara', ANILA: 'anila', BAISRAVA: 'baisrava', VAJRA: 'vajra', MAKIRA: 'makira', MAKORA: 'makora' };
const ALL_POSSIBLE_POWERUPS = [ POWERUP_TYPES.KUBIRA, POWERUP_TYPES.SHATORA, POWERUP_TYPES.HAILA, POWERUP_TYPES.ANCHIRA, POWERUP_TYPES.SINDARA, POWERUP_TYPES.BIKARA, POWERUP_TYPES.INDARA, POWERUP_TYPES.ANILA, POWERUP_TYPES.VAJRA, POWERUP_TYPES.MAKIRA, POWERUP_TYPES.MAKORA ];
const MAKORA_COPYABLE_POWERS = [ POWERUP_TYPES.KUBIRA, POWERUP_TYPES.SHATORA, POWERUP_TYPES.HAILA, POWERUP_TYPES.ANCHIRA, POWERUP_TYPES.SINDARA, POWERUP_TYPES.BIKARA, POWERUP_TYPES.INDARA, POWERUP_TYPES.ANILA, POWERUP_TYPES.VAJRA, POWERUP_TYPES.MAKIRA ];
const POWERUP_DURATION = { [POWERUP_TYPES.KUBIRA]: 10000, [POWERUP_TYPES.SHATORA]: 3000, [POWERUP_TYPES.HAILA]: 10000, [POWERUP_TYPES.MAKIRA]: 6667 };
const BIKARA_YANG_COUNT_MAX = 2;
const INDARA_MAX_HOMING_COUNT = 3;
const NORMAL_BALL_SPEED = Math.abs(BALL_INITIAL_VELOCITY_Y);
const BALL_SPEED_MODIFIERS = { [POWERUP_TYPES.SHATORA]: 3.0, [POWERUP_TYPES.HAILA]: 0.3 };
const SINDARA_ATTRACTION_DELAY = 3000;
const SINDARA_ATTRACTION_FORCE = 400;
const SINDARA_MERGE_DURATION = 500;
const SINDARA_POST_MERGE_PENETRATION_DURATION = 2000;
const VAJRA_GAUGE_MAX = 100;
const VAJRA_GAUGE_INCREMENT = 10;
const VAJRA_DESTROY_COUNT = 5;
const MAKIRA_ATTACK_INTERVAL = 1000;
const MAKIRA_BEAM_SPEED = 400;
const MAKIRA_BEAM_WIDTH = 10;
const MAKIRA_BEAM_HEIGHT = 15;
const MAKIRA_BEAM_COLOR = 0xff0000;
const MAKIRA_FAMILIAR_OFFSET = 40;
const MAKIRA_FAMILIAR_SIZE = 10;
const DROP_POOL_UI_ICON_SIZE = 18;
const DROP_POOL_UI_SPACING = 5;
const UI_BOTTOM_OFFSET = 30;

const POWERUP_ICON_KEYS = {
    [POWERUP_TYPES.KUBIRA]: 'icon_kubira', [POWERUP_TYPES.SHATORA]: 'icon_shatora', [POWERUP_TYPES.HAILA]: 'icon_haila',
    [POWERUP_TYPES.ANCHIRA]: 'icon_anchira', [POWERUP_TYPES.SINDARA]: 'icon_sindara', SINDARA_SUPER: 'icon_super_sindara',
    [POWERUP_TYPES.BIKARA]: 'icon_bikara_yin', BIKARA_YANG: 'icon_bikara_yang', [POWERUP_TYPES.INDARA]: 'icon_indara',
    [POWERUP_TYPES.ANILA]: 'icon_anila', [POWERUP_TYPES.BAISRAVA]: 'icon_baisrava', [POWERUP_TYPES.VAJRA]: 'icon_vajra',
    [POWERUP_TYPES.MAKIRA]: 'icon_makira', [POWERUP_TYPES.MAKORA]: 'icon_makora',
};

// ★★★ 音声ファイルキー定義 (ヴァジラ取得時/バイシュラを確定) ★★★
const AUDIO_KEYS = {
    BGM1: 'bgm1', BGM2: 'bgm2',
    SE_START: 'se_start', SE_LAUNCH: 'se_launch', SE_REFLECT: 'se_reflect',
    SE_DESTROY: 'se_destroy', SE_STAGE_CLEAR: 'se_stage_clear', SE_GAME_OVER: 'se_game_over',
    SE_SINDARA_MERGE: 'se_sindara_merge',
    SE_BIKARA_CHANGE: 'se_bikara_change', SE_VAJRA_TRIGGER: 'se_vajra_trigger',
    VOICE_KUBIRA: 'voice_kubira', VOICE_SHATORA: 'voice_shatora', VOICE_HAILA: 'voice_haila',
    VOICE_ANCHIRA: 'voice_anchira', VOICE_SINDARA: 'voice_sindara', VOICE_SINDARA_MERGE: 'voice_sindara_merge',
    VOICE_BIKARA_YIN: 'voice_bikara_yin', VOICE_BIKARA_YANG: 'voice_bikara_yang', VOICE_INDARA: 'voice_indara',
    VOICE_ANILA: 'voice_anila', VOICE_BAISRAVA: 'voice_baisrava', // ★ ファイル名も 'voice_baisrava.mp3' になっている想定
    VOICE_VAJRA_GET: 'voice_vajra', // ★ ファイル名も 'voice_vajra.mp3' になっている想定
    VOICE_VAJRA_TRIGGER: 'voice_vajra_trigger', VOICE_MAKIRA: 'voice_makira', VOICE_MAKORA: 'voice_makora'
};

const SYMBOL_PATTERNS = {
    '3': [[1,1,1,1,1],[0,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[1,1,1,1,1]],
    '9': [[1,1,1,1,1],[1,0,0,0,1],[1,1,1,1,1],[0,0,0,0,1],[1,1,1,1,1]],
    '11': [[0,1,1,1,0,0,0,0,1,0,0],[0,1,1,1,0,0,0,0,1,0,0],[1,1,1,1,1,0,1,1,1,1,0],[0,0,1,0,0,0,0,1,0,1,1],[0,0,1,0,0,0,0,1,0,0,1],[0,0,1,0,0,0,0,1,0,0,1],[0,0,1,0,0,0,1,0,0,1,0]],
};

// --- BootScene ---
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
    preload() {
        console.log("BootScene Preload Start");
        this.textures.generate('whitePixel', { data: ['1'], pixelWidth: 1 });
        this.load.image('ball_image', 'assets/ball.png');
        Object.values(POWERUP_ICON_KEYS).forEach(key => {
             if (key && typeof key === 'string') this.load.image(key, `assets/${key}.png`);
        });
        this.load.image('joykun', 'assets/joykun.png');
        this.load.image('gameBackground', 'assets/gamebackground.jpg');
        this.load.image('gameBackground2', 'assets/gamebackground2.jpg');
        this.load.image('gameBackground3', 'assets/gamebackground3.jpg');

        console.log("Loading audio files (all as .mp3)...");
        // ★★★ 全て .mp3 で読み込み ★★★
        this.load.audio(AUDIO_KEYS.BGM1, 'assets/stage_bgm1.mp3');
        this.load.audio(AUDIO_KEYS.BGM2, 'assets/stage_bgm2.mp3');
        this.load.audio(AUDIO_KEYS.SE_START, 'assets/se_start.mp3');
        this.load.audio(AUDIO_KEYS.SE_LAUNCH, 'assets/se_launch.mp3');
        this.load.audio(AUDIO_KEYS.SE_REFLECT, 'assets/se_reflect.mp3');
        this.load.audio(AUDIO_KEYS.SE_DESTROY, 'assets/se_destroy.mp3');
        this.load.audio(AUDIO_KEYS.SE_STAGE_CLEAR, 'assets/se_stage_clear.mp3');
        this.load.audio(AUDIO_KEYS.SE_GAME_OVER, 'assets/se_game_over.mp3');
        this.load.audio(AUDIO_KEYS.SE_SINDARA_MERGE, 'assets/se_sindara_merge.mp3');
        this.load.audio(AUDIO_KEYS.SE_BIKARA_CHANGE, 'assets/se_bikara_change.mp3');
        this.load.audio(AUDIO_KEYS.SE_VAJRA_TRIGGER, 'assets/se_vajra_trigger.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_KUBIRA, 'assets/voice_kubira.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SHATORA, 'assets/voice_shatora.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_HAILA, 'assets/voice_haila.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_ANCHIRA, 'assets/voice_anchira.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SINDARA, 'assets/voice_sindara.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_SINDARA_MERGE, 'assets/voice_sindara_merge.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BIKARA_YIN, 'assets/voice_bikara_yin.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BIKARA_YANG, 'assets/voice_bikara_yang.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_INDARA, 'assets/voice_indara.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_ANILA, 'assets/voice_anila.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_BAISRAVA, 'assets/voice_baisrava.mp3'); // ★
        this.load.audio(AUDIO_KEYS.VOICE_VAJRA_GET, 'assets/voice_vajra.mp3'); // ★
        this.load.audio(AUDIO_KEYS.VOICE_VAJRA_TRIGGER, 'assets/voice_vajra_trigger.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_MAKIRA, 'assets/voice_makira.mp3');
        this.load.audio(AUDIO_KEYS.VOICE_MAKORA, 'assets/voice_makora.mp3');
        console.log("Finished loading audio files setup.");
    }
    create() { console.log("BootScene Create Start"); this.scene.start('TitleScene'); console.log("BootScene Create End"); }
}

// --- TitleScene ---
class TitleScene extends Phaser.Scene {
     constructor() { super('TitleScene'); this.selectedCount = 4; this.selectedRate = 50; this.domElements = []; this.currentBgm = null; }
    create() { console.log("TitleScene Create Start"); const w = this.scale.width; const h = this.scale.height; this.cameras.main.setBackgroundColor('#222'); this.playTitleBgm(); this.add.text(w / 2, h * 0.15, '十二神将ブロック崩し', { fontSize: '40px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5); this.add.text(w / 2, h * 0.25, '(仮)', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5); const sliderContainer = document.createElement('div'); sliderContainer.style.width = '80%'; sliderContainer.style.maxWidth = '400px'; sliderContainer.style.color = 'white'; sliderContainer.style.fontSize = '18px'; sliderContainer.style.backgroundColor = 'rgba(0,0,0,0.6)'; sliderContainer.style.padding = '15px'; sliderContainer.style.borderRadius = '8px'; sliderContainer.style.textAlign = 'left'; const countDiv = document.createElement('div'); countDiv.style.marginBottom = '10px'; const countLabel = document.createElement('label'); countLabel.htmlFor = 'count-slider'; countLabel.textContent = '抽選候補数: '; countLabel.style.display = 'inline-block'; countLabel.style.width = '150px'; const countValueSpan = document.createElement('span'); countValueSpan.id = 'count-value'; countValueSpan.textContent = this.selectedCount.toString(); countValueSpan.style.display = 'inline-block'; countValueSpan.style.minWidth = '2em'; countValueSpan.style.textAlign = 'right'; countValueSpan.style.marginRight = '10px'; const countSlider = document.createElement('input'); countSlider.type = 'range'; countSlider.id = 'count-slider'; countSlider.min = '0'; countSlider.max = '11'; countSlider.value = this.selectedCount.toString(); countSlider.step = '1'; countSlider.style.width = 'calc(100% - 190px)'; countSlider.style.verticalAlign = 'middle'; countDiv.appendChild(countLabel); countDiv.appendChild(countValueSpan); countDiv.appendChild(countSlider); const rateDiv = document.createElement('div'); const rateLabel = document.createElement('label'); rateLabel.htmlFor = 'rate-slider'; rateLabel.textContent = 'ドロップ率: '; rateLabel.style.display = 'inline-block'; rateLabel.style.width = '150px'; const rateValueSpan = document.createElement('span'); rateValueSpan.id = 'rate-value'; rateValueSpan.textContent = this.selectedRate.toString() + '%'; rateValueSpan.style.display = 'inline-block'; rateValueSpan.style.minWidth = '4em'; rateValueSpan.style.textAlign = 'right'; rateValueSpan.style.marginRight = '10px'; const rateSlider = document.createElement('input'); rateSlider.type = 'range'; rateSlider.id = 'rate-slider'; rateSlider.min = '0'; rateSlider.max = '100'; rateSlider.value = this.selectedRate.toString(); rateSlider.step = '10'; rateSlider.style.width = 'calc(100% - 200px)'; rateSlider.style.verticalAlign = 'middle'; rateDiv.appendChild(rateLabel); rateDiv.appendChild(rateValueSpan); rateDiv.appendChild(rateSlider); sliderContainer.appendChild(countDiv); sliderContainer.appendChild(rateDiv); const domElement = this.add.dom(w / 2, h * 0.5, sliderContainer).setOrigin(0.5); this.domElements.push(domElement); countSlider.addEventListener('input', (event) => { this.selectedCount = parseInt(event.target.value); countValueSpan.textContent = this.selectedCount.toString(); }); rateSlider.addEventListener('input', (event) => { this.selectedRate = parseInt(event.target.value); rateValueSpan.textContent = this.selectedRate.toString() + '%'; }); const buttonStyle = { fontSize: '32px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 } }; const buttonHoverStyle = { fill: '#ff0' }; const startButton = this.add.text(w / 2, h * 0.75, 'ゲーム開始', buttonStyle).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerover', () => { startButton.setStyle(buttonHoverStyle) }).on('pointerout', () => { startButton.setStyle(buttonStyle) }).on('pointerdown', () => { console.log("Start button clicked."); this.sound.play(AUDIO_KEYS.SE_START); this.stopTitleBgm(); this.scene.start('GameScene', { chaosSettings: { count: this.selectedCount, ratePercent: this.selectedRate } }); this.scene.launch('UIScene'); }); this.events.on('shutdown', this.shutdownScene, this); console.log("TitleScene Create End"); }
    playTitleBgm() { this.stopTitleBgm(); console.log("Playing Title BGM (BGM2)"); this.currentBgm = this.sound.add(AUDIO_KEYS.BGM2, { loop: true, volume: 0.5 }); this.currentBgm.play(); }
    stopTitleBgm() { if (this.currentBgm) { console.log("Stopping Title BGM"); this.currentBgm.stop(); this.sound.remove(this.currentBgm); this.currentBgm = null; } }
    shutdownScene() { console.log("TitleScene shutdown initiated."); this.clearDOM(); this.stopTitleBgm(); this.events.off('shutdown', this.shutdownScene, this); console.log("TitleScene shutdown complete."); }
    clearDOM() { console.log("Clearing DOM elements."); this.domElements.forEach(element => element.destroy()); this.domElements = []; }
}

// --- GameScene ---
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); this.paddle = null; this.balls = null; this.bricks = null; this.powerUps = null; this.lives = 0; this.gameOverText = null; this.isBallLaunched = false; this.gameWidth = 0; this.gameHeight = 0; this.currentStage = 1; this.score = 0; this.ballPaddleCollider = null; this.ballBrickCollider = null; this.ballBrickOverlap = null; this.ballBallCollider = null; this.powerUpTimers = {}; this.sindaraAttractionTimer = null; this.sindaraMergeTimer = null; this.sindaraPenetrationTimer = null; this.isStageClearing = false; this.isGameOver = false; this.isVajraSystemActive = false; this.vajraGauge = 0; this.isMakiraActive = false; this.familiars = null; this.makiraBeams = null; this.makiraAttackTimer = null; this.makiraBeamBrickOverlap = null; this.stageDropPool = []; this.bgImage = null; this.chaosSettings = { count: 4, rate: 0.5 }; this.currentBgm = null; this.lastPlayedVoiceTime = {}; this.voiceThrottleTime = 500; }
   init(data) { console.log("GameScene Init Start"); if (data && data.chaosSettings) { this.chaosSettings.count = data.chaosSettings.count; this.chaosSettings.rate = data.chaosSettings.ratePercent / 100; console.log('Chaos Settings Received:', this.chaosSettings); } else { console.log('No Chaos Settings received, using defaults:', this.chaosSettings); } this.lives = 3; this.isBallLaunched = false; this.currentStage = 1; this.score = 0; Object.values(this.powerUpTimers).forEach(timer => { if (timer) timer.remove(); }); this.powerUpTimers = {}; if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null; if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); this.sindaraMergeTimer = null; if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); this.sindaraPenetrationTimer = null; this.isStageClearing = false; this.isGameOver = false; this.isVajraSystemActive = false; this.vajraGauge = 0; this.isMakiraActive = false; if (this.makiraAttackTimer) this.makiraAttackTimer.remove(); this.makiraAttackTimer = null; this.stageDropPool = []; this.bgImage = null; this.currentBgm = null; this.lastPlayedVoiceTime = {}; console.log("GameScene Init End"); }
   preload() { console.log("GameScene Preload (nothing to load here usually)");}
   create() { console.log("GameScene Create Start"); this.gameWidth = this.scale.width; this.gameHeight = this.scale.height; this.cameras.main.setBackgroundColor('#222'); const initialBgKey = this.getBackgroundKeyForStage(this.currentStage); this.bgImage = this.add.image(this.gameWidth / 2, this.gameHeight / 2, initialBgKey).setOrigin(0.5, 0.5).setDepth(-1); this.updateBgm(); this.time.delayedCall(50, () => { console.log("Delayed call: Updating initial UI."); if (this.scene.isActive('UIScene')) { this.events.emit('updateLives', this.lives); this.events.emit('updateScore', this.score); this.events.emit('updateStage', this.currentStage); if (this.isVajraSystemActive) { this.events.emit('activateVajraUI', this.vajraGauge, VAJRA_GAUGE_MAX); } else { this.events.emit('deactivateVajraUI'); } this.events.emit('updateDropPoolUI', this.stageDropPool); } }); this.physics.world.setBoundsCollision(true, true, true, false); this.physics.world.on('worldbounds', this.handleWorldBounds, this); this.paddle = this.physics.add.image(this.scale.width / 2, this.scale.height - PADDLE_Y_OFFSET, 'whitePixel').setTint(0xffff00).setImmovable(true).setData('originalWidthRatio', PADDLE_WIDTH_RATIO); this.updatePaddleSize(); this.balls = this.physics.add.group({ bounceX: 1, bounceY: 1, collideWorldBounds: true }); this.createAndAddBall(this.paddle.x, this.paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS); this.setupStage(); this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER\nTap to Restart', { fontSize: '48px', fill: '#f00', align: 'center' }).setOrigin(0.5).setVisible(false).setDepth(1); this.powerUps = this.physics.add.group(); this.familiars = this.physics.add.group(); this.makiraBeams = this.physics.add.group(); this.setColliders(); this.physics.add.overlap(this.paddle, this.powerUps, this.collectPowerUp, null, this); this.input.on('pointermove', (pointer) => { if (!this.isGameOver && this.lives > 0 && this.paddle && !this.isStageClearing) { const targetX = pointer.x; const halfWidth = this.paddle.displayWidth / 2; const clampedX = Phaser.Math.Clamp(targetX, halfWidth, this.scale.width - halfWidth); this.paddle.x = clampedX; if (!this.isBallLaunched) { this.balls.getChildren().forEach(ball => { if (ball.active) ball.x = clampedX; }); } } }); this.input.on('pointerdown', () => { console.log("Pointer down event."); if (this.isGameOver && this.gameOverText?.visible) { this.returnToTitle(); } else if (this.lives > 0 && !this.isBallLaunched && !this.isStageClearing) { this.launchBall(); } }); this.scale.on('resize', this.handleResize, this); this.events.on('shutdown', this.shutdownScene, this); this.resizeBackground(); console.log("GameScene Create End"); }
   getBackgroundKeyForStage(stage) { if (stage >= 7 && stage <= 12) { return 'gameBackground3'; } else if (stage >= 1 && stage <= 6) { return 'gameBackground2'; } else { return 'gameBackground'; } }
   getBgmKeyForStage(stage) { if (stage >= 7 && stage <= 12) { return AUDIO_KEYS.BGM2; } else { return AUDIO_KEYS.BGM1; } }
   updateBgm() { const newBgmKey = this.getBgmKeyForStage(this.currentStage); if (!this.currentBgm || this.currentBgm.key !== newBgmKey) { this.stopBgm(); console.log(`Playing BGM for stage ${this.currentStage}: ${newBgmKey}`); this.currentBgm = this.sound.add(newBgmKey, { loop: true, volume: 0.5 }); this.currentBgm.play(); } }
   stopBgm() { if (this.currentBgm) { console.log("Stopping current BGM:", this.currentBgm.key); this.currentBgm.stop(); this.sound.remove(this.currentBgm); this.currentBgm = null; } }
   resizeBackground() { if (!this.bgImage) return; const gameWidth = this.scale.width; const gameHeight = this.scale.height; const texture = this.textures.get(this.bgImage.texture.key); if (!texture || !texture.source || texture.source.length === 0) return; const imageWidth = texture.source[0].width; const imageHeight = texture.source[0].height; const scaleX = gameWidth / imageWidth; const scaleY = gameHeight / imageHeight; const scale = Math.min(scaleX, scaleY); this.bgImage.setScale(scale); this.bgImage.setPosition(gameWidth / 2, gameHeight / 2); this.bgImage.setAlpha(0.7); }
   updatePaddleSize() { if (!this.paddle) return; const newWidth = this.scale.width * this.paddle.getData('originalWidthRatio'); this.paddle.setDisplaySize(newWidth, PADDLE_HEIGHT); this.paddle.refreshBody(); const halfWidth = this.paddle.displayWidth / 2; this.paddle.x = Phaser.Math.Clamp(this.paddle.x, halfWidth, this.scale.width - halfWidth); }
   handleResize(gameSize, baseSize, displaySize, resolution) { console.log("Game resized."); this.gameWidth = gameSize.width; this.gameHeight = gameSize.height; this.updatePaddleSize(); this.resizeBackground(); if (this.scene.isActive('UIScene')) { this.events.emit('gameResize'); } }
   setupStage() { console.log(`Setting up Stage ${this.currentStage}`); const possibleDrops = [...ALL_POSSIBLE_POWERUPS]; const shuffledPool = Phaser.Utils.Array.Shuffle(possibleDrops); this.stageDropPool = shuffledPool.slice(0, this.chaosSettings.count); console.log(`Stage ${this.currentStage} Drop Pool (${this.chaosSettings.count} types):`, this.stageDropPool); this.events.emit('updateDropPoolUI', this.stageDropPool); this.createBricks(); }
   update() { if (this.isGameOver || this.isStageClearing || this.lives <= 0) { return; } let activeBallCount = 0; let sindaraBalls = []; this.balls.getChildren().forEach(ball => { if (ball.active) { activeBallCount++; if (this.isBallLaunched && !this.isStageClearing && ball.y > this.gameHeight + ball.displayHeight) { if (ball.getData('isAnilaActive')) { this.triggerAnilaBounce(ball); } else { console.log("Ball went out of bounds."); ball.setActive(false).setVisible(false); if (ball.body) ball.body.enable = false; } } const lastPower = ball.getData('lastActivatedPower'); if (lastPower === POWERUP_TYPES.SINDARA) { sindaraBalls.push(ball); if (ball.getData('isAttracting')) { this.updateSindaraAttraction(ball); } } if (ball.body && this.isBallLaunched) { const minSpeed = NORMAL_BALL_SPEED * 0.1; const maxSpeed = NORMAL_BALL_SPEED * 5; const speed = ball.body.velocity.length(); if (speed < minSpeed && speed > 0) { ball.body.velocity.normalize().scale(minSpeed); } else if (speed > maxSpeed) { ball.body.velocity.normalize().scale(maxSpeed); } } } }); if (sindaraBalls.length === 1 && this.balls.getTotalUsed() > 1) { const remainingBall = sindaraBalls[0]; if (remainingBall.getData('lastActivatedPower') === POWERUP_TYPES.SINDARA) { console.log("Deactivating Sindara power (only one Sindara ball left)."); this.deactivatePowerByType(POWERUP_TYPES.SINDARA); } } if (activeBallCount === 0 && this.isBallLaunched && !this.isStageClearing && this.lives > 0) { console.log("No active balls left, losing life."); this.loseLife(); return; } this.powerUps.children.each(powerUp => { if (powerUp.active && powerUp.y > this.gameHeight + POWERUP_SIZE) { powerUp.destroy(); } }); if (this.isMakiraActive && this.paddle && this.familiars) { const paddleX = this.paddle.x; const familiarY = this.paddle.y - PADDLE_HEIGHT / 2 - MAKIRA_FAMILIAR_SIZE; const children = this.familiars.getChildren(); if (children.length >= 1 && children[0].active) children[0].setPosition(paddleX - MAKIRA_FAMILIAR_OFFSET, familiarY); if (children.length >= 2 && children[1].active) children[1].setPosition(paddleX + MAKIRA_FAMILIAR_OFFSET, familiarY); } if (this.makiraBeams) { this.makiraBeams.children.each(beam => { if (beam.active && beam.y < -MAKIRA_BEAM_HEIGHT) { beam.destroy(); } }); } }
   setColliders() { console.log("Setting colliders."); if (this.ballPaddleCollider) this.ballPaddleCollider.destroy(); if (this.ballBrickCollider) this.ballBrickCollider.destroy(); if (this.ballBrickOverlap) this.ballBrickOverlap.destroy(); if (this.ballBallCollider) this.ballBallCollider.destroy(); if (this.makiraBeamBrickOverlap) this.makiraBeamBrickOverlap.destroy(); if (!this.balls || !this.paddle || !this.bricks) { console.warn("Cannot set colliders: balls, paddle or bricks missing."); return; } this.ballPaddleCollider = this.physics.add.collider(this.paddle, this.balls, this.hitPaddle, null, this); this.ballBrickCollider = this.physics.add.collider(this.bricks, this.balls, this.hitBrick, (brick, ball) => { const lastPower = ball.getData('lastActivatedPower'); const isBikaraYin = lastPower === POWERUP_TYPES.BIKARA && ball.getData('bikaraState') === 'yin'; const isPenetrating = ball.getData('isPenetrating'); const isSindaraSpecial = lastPower === POWERUP_TYPES.SINDARA && (ball.getData('isAttracting') || ball.getData('isMerging')); const isIndestructible = brick.getData('maxHits') === -1; return !isPenetrating && !isBikaraYin && !isSindaraSpecial; }, this); this.ballBrickOverlap = this.physics.add.overlap(this.balls, this.bricks, this.handleBallBrickOverlap, (ball, brick) => { const lastPower = ball.getData('lastActivatedPower'); const isBikaraYin = lastPower === POWERUP_TYPES.BIKARA && ball.getData('bikaraState') === 'yin'; const isSindaraSpecial = lastPower === POWERUP_TYPES.SINDARA && (ball.getData('isAttracting') || ball.getData('isMerging')); const isPenetrating = ball.getData('isPenetrating'); return isBikaraYin || isSindaraSpecial || isPenetrating; }, this); this.ballBallCollider = this.physics.add.collider(this.balls, this.balls, this.handleBallCollision, (ball1, ball2) => { const lastPower1 = ball1.getData('lastActivatedPower'); const lastPower2 = ball2.getData('lastActivatedPower'); return lastPower1 === POWERUP_TYPES.SINDARA && lastPower2 === POWERUP_TYPES.SINDARA && ball1.getData('isAttracting') && ball2.getData('isAttracting'); }, this); if (this.makiraBeams && this.bricks) { this.makiraBeamBrickOverlap = this.physics.add.overlap(this.makiraBeams, this.bricks, this.hitBrickWithMakiraBeam, null, this); } }
   createAndAddBall(x, y, vx = 0, vy = 0, data = null) { console.log("Creating and adding ball."); const ball = this.balls.create(x, y, 'ball_image').setOrigin(0.5, 0.5).setDisplaySize(BALL_RADIUS * 2, BALL_RADIUS * 2).setCircle(PHYSICS_BALL_RADIUS).setCollideWorldBounds(true).setBounce(1); if (ball.body) { ball.setVelocity(vx, vy); ball.body.onWorldBounds = true; } else { console.error("Failed to create ball physics body!"); ball.destroy(); return null; } ball.setData({ activePowers: data ? new Set(data.activePowers) : new Set(), lastActivatedPower: data ? data.lastActivatedPower : null, isPenetrating: data ? data.isPenetrating : false, isFast: data ? data.isFast : false, isSlow: data ? data.isSlow : false, sindaraPartner: data ? data.sindaraPartner : null, isAttracting: data ? data.isAttracting : false, isMerging: data ? data.isMerging : false, bikaraState: data ? data.bikaraState : null, bikaraYangCount: data ? data.bikaraYangCount : 0, isIndaraActive: data ? data.isIndaraActive : false, indaraHomingCount: data ? data.indaraHomingCount : 0, isAnilaActive: data ? data.isAnilaActive : false }); this.updateBallAppearance(ball); if (data) { if (ball.getData('isFast')) this.applySpeedModifier(ball, POWERUP_TYPES.SHATORA); else if (ball.getData('isSlow')) this.applySpeedModifier(ball, POWERUP_TYPES.HAILA); } return ball; }
   launchBall() { console.log("Attempting to launch ball."); if (!this.isBallLaunched && this.balls) { const firstBall = this.balls.getFirstAlive(); if (firstBall) { console.log("Launching ball!"); const initialVelocityX = Phaser.Math.Between(BALL_INITIAL_VELOCITY_X_RANGE[0], BALL_INITIAL_VELOCITY_X_RANGE[1]); firstBall.setVelocity(initialVelocityX, BALL_INITIAL_VELOCITY_Y); this.isBallLaunched = true; this.sound.play(AUDIO_KEYS.SE_LAUNCH); } } }
   createBricks() { console.log(`Generating Bricks (Stage ${this.currentStage})`); if (this.bricks) { this.bricks.clear(true, true); this.bricks.destroy(); } this.bricks = this.physics.add.staticGroup(); const stage = this.currentStage; const maxStage = MAX_STAGE; const rows = BRICK_ROWS + Math.floor(stage / 3); const cols = BRICK_COLS + Math.floor(stage / 4); const maxTotalBricks = Math.floor((this.scale.height * 0.5) / (BRICK_HEIGHT + BRICK_SPACING)) * (BRICK_COLS + 4) * 1.2; const actualRows = Math.min(rows, Math.floor(maxTotalBricks / (BRICK_COLS + 4))); const actualCols = Math.min(cols, BRICK_COLS + 4); let durableRatio = 0; let indestructibleRatio = 0; let progress = 0; if (stage >= 3) { progress = Phaser.Math.Clamp((stage - 3) / (maxStage - 3), 0, 1); durableRatio = progress * 0.5; indestructibleRatio = progress * 0.15; } const bW = this.scale.width * BRICK_WIDTH_RATIO; const totalBrickWidth = actualCols * bW + (actualCols - 1) * BRICK_SPACING; const oX = (this.scale.width - totalBrickWidth) / 2; let specialLayoutType = null; const stageString = stage.toString(); if (stage > 2 && stage % 8 === 0) { specialLayoutType = 's_shape'; } else if (stage > 2 && stage % 4 === 0) { specialLayoutType = 'wall'; } else if (stage > 4 && stage % 6 === 0) { specialLayoutType = 'center_hollow'; } else if (stage >= 3 && SYMBOL_PATTERNS[stageString]) { specialLayoutType = 'symbol'; } let density; if (stage <= 3) { density = 0.4; } else { density = 0.4 + 0.5 * progress; } if (specialLayoutType === 'wall') { console.log(`Generating Special Layout: Wall (Stage ${stage}, Density: ${density.toFixed(3)})`); const exitColTop = Math.floor(actualCols / 2); const exitColBottom = Math.floor(actualCols / 2); for (let i = 0; i < actualRows; i++) { for (let j = 0; j < actualCols; j++) { const bX = oX + j * (bW + BRICK_SPACING) + bW / 2; const bY = BRICK_OFFSET_TOP + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2; let generateBrick = true; let brickType = 'normal'; let brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS); let maxHits = 1; let isDurable = false; const isOuterWall = (i === 0 || i === actualRows - 1 || j === 0 || j === actualCols - 1); const isExit = (i === 0 && j === exitColTop) || (i === actualRows - 1 && j === exitColBottom); if (isOuterWall && !isExit) { brickType = 'indestructible'; brickColor = INDESTRUCTIBLE_BRICK_COLOR; maxHits = -1; } else { if (Phaser.Math.FloatBetween(0, 1) > density) { generateBrick = false; } else { if (isExit) { /* Normal */ } else { const rand = Phaser.Math.FloatBetween(0, 1); if (stage >= 3 && rand < durableRatio) { brickType = 'durable'; brickColor = DURABLE_BRICK_COLOR; maxHits = Phaser.Math.Between(2, MAX_DURABLE_HITS); isDurable = true; } else { /* Normal */ } } } } if (generateBrick) { const brick = this.bricks.create(bX, bY, 'whitePixel').setDisplaySize(bW, BRICK_HEIGHT).setTint(brickColor); brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType }); brick.refreshBody(); if (maxHits === -1) brick.body.immovable = true; } } } if (this.getDestroyableBrickCount() === 0 && stage > 1) { console.warn("Wall layout generated no destroyable bricks, retrying..."); this.time.delayedCall(10, this.createBricks, [], this); return; } } else if (specialLayoutType === 's_shape') { console.log(`Generating Special Layout: S-Shape (Stage ${stage}, Density: ${density.toFixed(3)})`); const wallRow1 = Math.floor(actualRows / 3); const wallRow2 = Math.floor(actualRows * 2 / 3); const wallLengthCols = Math.floor(actualCols * 2 / 3); let generatedDestroyableCount = 0; for (let i = 0; i < actualRows; i++) { for (let j = 0; j < actualCols; j++) { const bX = oX + j * (bW + BRICK_SPACING) + bW / 2; const bY = BRICK_OFFSET_TOP + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2; let generateBrick = true; let brickType = 'normal'; let brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS); let maxHits = 1; let isDurable = false; const isWallPart = (i === wallRow1 && j >= actualCols - wallLengthCols) || (i === wallRow2 && j < wallLengthCols); if (isWallPart) { brickType = 'indestructible'; brickColor = INDESTRUCTIBLE_BRICK_COLOR; maxHits = -1; } else { if (Phaser.Math.FloatBetween(0, 1) > density) { generateBrick = false; } else { const rand = Phaser.Math.FloatBetween(0, 1); if (stage >= 3 && rand < durableRatio) { brickType = 'durable'; brickColor = DURABLE_BRICK_COLOR; maxHits = Phaser.Math.Between(2, MAX_DURABLE_HITS); isDurable = true; } else { /* Normal */ } } } if (generateBrick) { const brick = this.bricks.create(bX, bY, 'whitePixel').setDisplaySize(bW, BRICK_HEIGHT).setTint(brickColor); brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType }); brick.refreshBody(); if (maxHits === -1) brick.body.immovable = true; if (maxHits !== -1) generatedDestroyableCount++; } } } if (generatedDestroyableCount < 5 && stage > 1) { console.warn(`S-Shape generated only ${generatedDestroyableCount} destroyable bricks, retrying...`); this.time.delayedCall(10, this.createBricks, [], this); return; } } else if (specialLayoutType === 'center_hollow') { console.log(`Generating Special Layout: Center Hollow (Stage ${stage}, Density: ${density.toFixed(3)})`); let generatedCount = 0; const hollowRowStart = Math.floor(actualRows / 4); const hollowRowEnd = Math.floor(actualRows * 3 / 4); const hollowColStart = Math.floor(actualCols / 4); const hollowColEnd = Math.floor(actualCols * 3 / 4); for (let i = 0; i < actualRows; i++) { for (let j = 0; j < actualCols; j++) { const bX = oX + j * (bW + BRICK_SPACING) + bW / 2; const bY = BRICK_OFFSET_TOP + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2; const isInHollowArea = (i >= hollowRowStart && i < hollowRowEnd && j >= hollowColStart && j < hollowColEnd); if (isInHollowArea) { continue; } if (Phaser.Math.FloatBetween(0, 1) > density && generatedCount > 5) { continue; } const rand = Phaser.Math.FloatBetween(0, 1); let brickType = 'normal'; let brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS); let maxHits = 1; let isDurable = false; if (stage >= 3 && rand < indestructibleRatio) { brickType = 'indestructible'; brickColor = INDESTRUCTIBLE_BRICK_COLOR; maxHits = -1; } else if (stage >= 3 && rand < indestructibleRatio + durableRatio) { brickType = 'durable'; brickColor = DURABLE_BRICK_COLOR; maxHits = Phaser.Math.Between(2, MAX_DURABLE_HITS); isDurable = true; } else { /* Normal */ } const brick = this.bricks.create(bX, bY, 'whitePixel').setDisplaySize(bW, BRICK_HEIGHT).setTint(brickColor); brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType }); brick.refreshBody(); if (maxHits === -1) brick.body.immovable = true; generatedCount++; } } if (this.getDestroyableBrickCount() === 0 && stage > 1) { console.warn("Center Hollow layout generated no destroyable bricks, retrying..."); this.time.delayedCall(10, this.createBricks, [], this); return; } } else if (specialLayoutType === 'symbol') { console.log(`Generating Special Layout: Symbol '${stageString}' (Stage ${stage})`); const pattern = SYMBOL_PATTERNS[stageString]; let generatedCount = 0; if (pattern && pattern.length > 0 && pattern[0].length > 0) { const patternRows = pattern.length; const patternCols = pattern[0].length; const patternTotalHeight = patternRows * BRICK_HEIGHT + (patternRows - 1) * BRICK_SPACING; const patternTotalWidth = patternCols * bW + (patternCols - 1) * BRICK_SPACING; const startY = BRICK_OFFSET_TOP + Math.max(0, (this.scale.height * 0.4 - patternTotalHeight) / 2); const startX = (this.scale.width - patternTotalWidth) / 2; for (let i = 0; i < patternRows; i++) { for (let j = 0; j < patternCols; j++) { if (pattern[i][j] === 1) { const bX = startX + j * (bW + BRICK_SPACING) + bW / 2; const bY = startY + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2; const brickType = 'normal'; const brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS); const maxHits = 1; const isDurable = false; const brick = this.bricks.create(bX, bY, 'whitePixel').setDisplaySize(bW, BRICK_HEIGHT).setTint(brickColor); brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType }); brick.refreshBody(); generatedCount++; } } } if (generatedCount < 3 && stage > 1) { console.warn(`Symbol layout '${stageString}' generated only ${generatedCount} bricks, retrying as normal...`); this.time.delayedCall(10, () => { this.createBricksFallbackToNormal(); }, [], this); return; } } else { console.warn(`Symbol pattern for stage ${stage} not found or invalid. Falling back to normal layout.`); this.createBricksFallbackToNormal(); return; } } else { console.log(`Generating Normal Layout (Stage ${stage}, Density: ${density.toFixed(3)})`); let generatedCount = 0; for (let i = 0; i < actualRows; i++) { for (let j = 0; j < actualCols; j++) { const bX = oX + j * (bW + BRICK_SPACING) + bW / 2; const bY = BRICK_OFFSET_TOP + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2; if (Phaser.Math.FloatBetween(0, 1) > density && generatedCount > 5) { continue; } const rand = Phaser.Math.FloatBetween(0, 1); let brickType = 'normal'; let brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS); let maxHits = 1; let isDurable = false; if (stage >= 3 && rand < indestructibleRatio) { brickType = 'indestructible'; brickColor = INDESTRUCTIBLE_BRICK_COLOR; maxHits = -1; } else if (stage >= 3 && rand < indestructibleRatio + durableRatio) { brickType = 'durable'; brickColor = DURABLE_BRICK_COLOR; maxHits = Phaser.Math.Between(2, MAX_DURABLE_HITS); isDurable = true; } else { brickType = 'normal'; brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS); maxHits = 1; isDurable = false; } const brick = this.bricks.create(bX, bY, 'whitePixel').setDisplaySize(bW, BRICK_HEIGHT).setTint(brickColor); brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType }); brick.refreshBody(); if (maxHits === -1) brick.body.immovable = true; generatedCount++; } } if (this.getDestroyableBrickCount() === 0 && stage > 1) { console.warn("Normal layout generated no destroyable bricks, retrying..."); this.time.delayedCall(10, this.createBricks, [], this); return; } } console.log(`Bricks generated: ${this.bricks.getLength()}, Destroyable: ${this.getDestroyableBrickCount()}`); this.setColliders(); }
   createBricksFallbackToNormal() { console.log("Falling back to Normal Layout generation..."); if (this.bricks) { this.bricks.clear(true, true); this.bricks.destroy(); } this.bricks = this.physics.add.staticGroup(); const stage = this.currentStage; const maxStage = MAX_STAGE; const rows = BRICK_ROWS + Math.floor(stage / 3); const cols = BRICK_COLS + Math.floor(stage / 4); const maxTotalBricks = Math.floor((this.scale.height * 0.5) / (BRICK_HEIGHT + BRICK_SPACING)) * (BRICK_COLS + 4) * 1.2; const actualRows = Math.min(rows, Math.floor(maxTotalBricks / (BRICK_COLS + 4))); const actualCols = Math.min(cols, BRICK_COLS + 4); let durableRatio = 0; let indestructibleRatio = 0; let progress = 0; if (stage >= 3) { progress = Phaser.Math.Clamp((stage - 3) / (maxStage - 3), 0, 1); durableRatio = progress * 0.5; indestructibleRatio = progress * 0.15; } const bW = this.scale.width * BRICK_WIDTH_RATIO; const totalBrickWidth = actualCols * bW + (actualCols - 1) * BRICK_SPACING; const oX = (this.scale.width - totalBrickWidth) / 2; let density; if (stage <= 3) { density = 0.4; } else { density = 0.4 + 0.5 * progress; } let generatedCount = 0; for (let i = 0; i < actualRows; i++) { for (let j = 0; j < actualCols; j++) { const bX = oX + j * (bW + BRICK_SPACING) + bW / 2; const bY = BRICK_OFFSET_TOP + i * (BRICK_HEIGHT + BRICK_SPACING) + BRICK_HEIGHT / 2; if (Phaser.Math.FloatBetween(0, 1) > density && generatedCount > 5) { continue; } const rand = Phaser.Math.FloatBetween(0, 1); let brickType = 'normal'; let brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS); let maxHits = 1; let isDurable = false; if (stage >= 3 && rand < indestructibleRatio) { brickType = 'indestructible'; brickColor = INDESTRUCTIBLE_BRICK_COLOR; maxHits = -1; } else if (stage >= 3 && rand < indestructibleRatio + durableRatio) { brickType = 'durable'; brickColor = DURABLE_BRICK_COLOR; maxHits = Phaser.Math.Between(2, MAX_DURABLE_HITS); isDurable = true; } else { brickType = 'normal'; brickColor = Phaser.Utils.Array.GetRandom(BRICK_COLORS); maxHits = 1; isDurable = false; } const brick = this.bricks.create(bX, bY, 'whitePixel').setDisplaySize(bW, BRICK_HEIGHT).setTint(brickColor); brick.setData({ originalTint: brickColor, isMarkedByBikara: false, maxHits: maxHits, currentHits: maxHits, isDurable: isDurable, type: brickType }); brick.refreshBody(); if (maxHits === -1) brick.body.immovable = true; generatedCount++; } } if (this.getDestroyableBrickCount() === 0 && stage > 1) { console.warn("Normal layout (fallback) generated no destroyable bricks, retrying..."); this.time.delayedCall(10, this.createBricks, [], this); return; } console.log(`Bricks generated (fallback): ${this.bricks.getLength()}, Destroyable: ${this.getDestroyableBrickCount()}`); this.setColliders(); }

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
           this.handleBrickDestruction(brick);
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

   handleBrickDestruction(brick) {
       if (!brick || !brick.active) return false;
       const brickX = brick.x;
       const brickY = brick.y;
       const brickColor = brick.getData('originalTint') || 0xffffff; // ブロックの色を取得

       // --- ▼ エフェクト生成処理を追加 ▼ ---
       try {
           // パーティクルエミッタを作成
           const particles = this.add.particles(0, 0, 'whitePixel', {
               // エミッタの設定
               frame: 0, // whitePixelは単一フレーム
               x: brickX, // 発生源 X座標
               y: brickY, // 発生源 Y座標
               lifespan: 400, // パーティクルの生存時間 (ミリ秒)
               speed: { min: 80, max: 150 }, // パーティクルの速度範囲
               angle: { min: 0, max: 360 },   // パーティクルの放出角度 (全方位)
               gravityY: 100,                 // 少し重力をかける (任意)
               scale: { start: 0.5, end: 0 }, // 開始時のスケール、終了時のスケール (小さくなって消える)
               quantity: 10, // 一度に放出するパーティクルの数
               blendMode: 'NORMAL', // ブレンドモード
               emitting: false // すぐには放出しない
           });

           // パーティクルにブロックの色を適用
           particles.setParticleTint(brickColor);

           // 一度だけパーティクルを放出する
           particles.explode(10);

           // エミッタ自体を少し遅れて破棄する (パーティクルが見える時間を確保)
           this.time.delayedCall(500, () => {
               // particlesオブジェクトがまだ存在するか確認してからdestroyを呼ぶ
               if (particles && particles.scene) {
                   particles.destroy();
               }
           });

       } catch (error) {
           console.error("Error creating particle effect:", error);
       }
       // --- ▲ エフェクト生成処理を追加 ▲ ---

       // ブロック本体の無効化（エフェクト生成後に行う）
       brick.disableBody(true, true);

       console.log("[Debug] Attempting to play SE_DESTROY (simple)...");
       try {
            /* this.sound.play(AUDIO_KEYS.SE_DESTROY); */
            console.log("[Temporary] SE_DESTROY playback disabled due to errors.");
       } catch (error) {
           /* console.error("[Debug] Error occurred directly when trying to play SE_DESTROY:", error); */
       }

       // スコア加算など
       this.score += 10;
       this.events.emit('updateScore', this.score);
       this.increaseVajraGauge();

       // アイテムドロップ判定
       if (Phaser.Math.FloatBetween(0, 1) < BAISRAVA_DROP_RATE) {
           this.dropSpecificPowerUp(brickX, brickY, POWERUP_TYPES.BAISRAVA);
       } else if (this.stageDropPool.length > 0 && Phaser.Math.FloatBetween(0, 1) < this.chaosSettings.rate) {
           this.dropPowerUp(brickX, brickY);
       }

       return true; // 破壊処理が成功したことを示す
   }

   hitBrick(brick, ball) {
       if (!brick || !ball || !brick.active || !ball.active || this.isStageClearing) return;
       const lastPower = ball.getData('lastActivatedPower');
       const isBikaraYang = lastPower === POWERUP_TYPES.BIKARA && ball.getData('bikaraState') === 'yang';

       if (isBikaraYang) {
           this.handleBikaraYangDestroy(ball, brick);
           // 破壊されたかもしれないのでステージクリアチェック
           if (!this.isStageClearing && this.getDestroyableBrickCount() === 0) {
               this.time.delayedCall(50, this.stageClear, [], this); // 少し遅延してクリア処理へ
           }
           return;
       }

       // 通常のヒット処理（エフェクトは handleBrickDestruction 内で発生）
       const destroyed = this.handleBrickHit(brick, 1);
       if (destroyed && !this.isStageClearing && this.getDestroyableBrickCount() === 0) {
           this.time.delayedCall(50, this.stageClear, [], this); // 少し遅延してクリア処理へ
       }
   }
   handleBallBrickOverlap(ball, brick) {
       if (!ball || !brick || !ball.active || !brick.active || this.isStageClearing) return;
       const lastPower = ball.getData('lastActivatedPower');
       const isBikaraYin = lastPower === POWERUP_TYPES.BIKARA && ball.getData('bikaraState') === 'yin';
       const isPenetrating = ball.getData('isPenetrating');
       const isSindaraSpecial = lastPower === POWERUP_TYPES.SINDARA && (ball.getData('isAttracting') || ball.getData('isMerging'));

       if (isBikaraYin) {
           if (brick.getData('maxHits') !== -1) {
               this.markBrickByBikara(brick);
           }
       } else if (isPenetrating && !isSindaraSpecial) {
            // 貫通ヒット処理（エフェクトは handleBrickDestruction 内で発生）
           const destroyed = this.handleBrickHit(brick, Infinity); // Infinityダメージで即破壊
           if (destroyed && !this.isStageClearing && this.getDestroyableBrickCount() === 0) {
                this.time.delayedCall(50, this.stageClear, [], this); // 少し遅延してクリア処理へ
           }
       }
   }
   handleBikaraYangDestroy(ball, hitBrick) {
       if (!ball || !ball.active || ball.getData('lastActivatedPower') !== POWERUP_TYPES.BIKARA || ball.getData('bikaraState') !== 'yang') return;
       let destroyedCount = 0;
       const markedToDestroy = [];
       if (hitBrick.active && hitBrick.getData('maxHits') !== -1) {
           markedToDestroy.push(hitBrick);
           hitBrick.setData('isMarkedByBikara', false);
       }
       this.bricks.getChildren().forEach(br => {
           if (br.active && br.getData && br.getData('isMarkedByBikara') && !markedToDestroy.includes(br)) {
               markedToDestroy.push(br);
               br.setData('isMarkedByBikara', false);
           }
       });

       markedToDestroy.forEach(br => {
           if (br.active) {
                // 陽転換による破壊（エフェクトは handleBrickDestruction 内で発生）
               const destroyed = this.handleBrickDestruction(br);
               if (destroyed) destroyedCount++;
           }
       });

       let currentYangCount = ball.getData('bikaraYangCount') || 0;
       currentYangCount++;
       ball.setData('bikaraYangCount', currentYangCount);

       if (destroyedCount > 0) {
           console.log(`Bikara Yang destroyed ${destroyedCount} bricks.`);
       }
       if (currentYangCount >= BIKARA_YANG_COUNT_MAX) {
           this.deactivatePowerByType(POWERUP_TYPES.BIKARA);
       }
   }
   hitBrickWithMakiraBeam(beam, brick) {
       if (!beam || !brick || !beam.active || !brick.active || this.isStageClearing || this.isGameOver || !brick.getData) return;
       if (brick.getData('maxHits') === -1) {
           beam.destroy(); // 無敵ブロックにはビームも消える
           return;
       }

       try {
           beam.destroy(); // ビームはヒットしたら消える
       } catch (error) {
           console.error("Error destroying Makira beam:", error);
           if (beam && beam.active) {
               beam.setActive(false).setVisible(false);
               if (beam.body) beam.body.enable = false;
           }
       }

        // マキラビームによるヒット処理（エフェクトは handleBrickDestruction 内で発生）
       const destroyed = this.handleBrickHit(brick, 1);
       if (destroyed && !this.isStageClearing && this.getDestroyableBrickCount() === 0) {
            this.time.delayedCall(50, this.stageClear, [], this); // 少し遅延してクリア処理へ
       }
   }
   triggerVajraDestroy() {
       if (this.isStageClearing || this.isGameOver) return;
       if (!this.isVajraSystemActive) return;

       this.isVajraSystemActive = false;
       this.events.emit('deactivateVajraUI');
       console.log("Triggering Vajra destroy.");

       console.log("[Debug] Attempting to play VOICE_VAJRA_TRIGGER...");
       try {
           this.sound.play(AUDIO_KEYS.VOICE_VAJRA_TRIGGER);
           console.log("[Debug] this.sound.play(AUDIO_KEYS.VOICE_VAJRA_TRIGGER) called.");
       } catch (error) {
           console.error("[Debug] Error occurred directly when trying to play VOICE_VAJRA_TRIGGER:", error);
       }
       console.log("[Debug] Attempting to play SE_VAJRA_TRIGGER...");
        try {
           this.sound.play(AUDIO_KEYS.SE_VAJRA_TRIGGER);
           console.log("[Debug] this.sound.play(AUDIO_KEYS.SE_VAJRA_TRIGGER) called.");
       } catch (error) {
           console.error("[Debug] Error occurred directly when trying to play SE_VAJRA_TRIGGER:", error);
       }

       const activeBricks = this.bricks.getMatching('active', true);
       if (activeBricks.length === 0) {
           console.log("No active bricks for Vajra to destroy.");
           this.deactivateVajra(); // システムは非アクティブ化
           return;
       }

       const destroyableBricks = activeBricks.filter(b => b.getData && b.getData('maxHits') !== -1);
       const countToDestroy = Math.min(destroyableBricks.length, VAJRA_DESTROY_COUNT);
       const shuffledBricks = Phaser.Utils.Array.Shuffle(destroyableBricks);
       let destroyedCount = 0;

       for (let i = 0; i < countToDestroy; i++) {
           const brick = shuffledBricks[i];
           if (brick && brick.active) {
                // ヴァジラによる破壊（エフェクトは handleBrickDestruction 内で発生）
               const destroyed = this.handleBrickHit(brick, Infinity); // 即死ダメージ
               if (destroyed) destroyedCount++;
           }
       }
       console.log(`Vajra destroyed ${destroyedCount} bricks.`);

       if (!this.isStageClearing && this.getDestroyableBrickCount() === 0) {
           console.log("Vajra cleared the stage.");
            this.time.delayedCall(50, this.stageClear, [], this); // 少し遅延してクリア処理へ
       } else {
           this.deactivateVajra(); // システムは非アクティブ化（ゲージリセット）
       }
   }
   activateBaisrava() {
       if (this.isStageClearing || this.isGameOver) return;
       console.log("Activating Baisrava.");

       try {
           this.sound.play(AUDIO_KEYS.VOICE_BAISRAVA);
           console.log("[Debug] this.sound.play(AUDIO_KEYS.VOICE_BAISRAVA) called.");
       } catch (e) {
           console.error(`Error playing voice ${AUDIO_KEYS.VOICE_BAISRAVA} for type BAISRAVA:`, e);
       }

       const activeBricks = this.bricks.getMatching('active', true);
       let destroyedCount = 0;
       activeBricks.forEach(brick => {
           if (brick && brick.active && brick.getData && brick.getData('maxHits') !== -1) {
                // バイシュラヴァによる破壊（エフェクトは handleBrickDestruction 内で発生）
               const destroyed = this.handleBrickHit(brick, Infinity); // 即死ダメージ
               if (destroyed) destroyedCount++;
           }
       });

       if (destroyedCount > 0) {
           console.log(`Baisrava destroyed ${destroyedCount} bricks.`);
       }
       this.stageClear(); // バイシュラヴァは即時ステージクリア
   }
   getDestroyableBrickCount() { if (!this.bricks) return 0; return this.bricks.getMatching('active', true).filter(brick => brick.getData && brick.getData('maxHits') !== -1).length; }
   dropSpecificPowerUp(x, y, type) { let textureKey = POWERUP_ICON_KEYS[type] || 'whitePixel'; let displaySize = POWERUP_SIZE; let tintColor = null; if (textureKey === 'whitePixel') { console.warn(`Powerup icon key not found for type: ${type}, using white pixel.`); tintColor = (type === POWERUP_TYPES.BAISRAVA) ? 0xffd700 : 0xcccccc; } if (!type) { console.warn(`Attempted to drop powerup with no type.`); return; } let powerUp = null; try { powerUp = this.powerUps.create(x, y, textureKey); if (powerUp) { powerUp.setDisplaySize(displaySize, displaySize).setData('type', type); if (tintColor !== null) { powerUp.setTint(tintColor); } else { powerUp.clearTint(); } if (powerUp.body) { powerUp.setVelocity(0, POWERUP_SPEED_Y); powerUp.body.setCollideWorldBounds(false); powerUp.body.setAllowGravity(false); } else { console.error(`No physics body for powerup type: ${type}! Destroying.`); powerUp.destroy(); powerUp = null; } } else { console.error(`Failed to create powerup object for type: ${type}!`); } } catch (error) { console.error(`CRITICAL ERROR in dropSpecificPowerUp (${type}):`, error); if (powerUp && powerUp.active) { powerUp.destroy(); } } }
   dropPowerUp(x, y) { if (this.stageDropPool.length === 0) return; const type = Phaser.Utils.Array.GetRandom(this.stageDropPool); this.dropSpecificPowerUp(x, y, type); }
   hitPaddle(paddle, ball) { if (!paddle || !ball || !ball.active || !ball.body) return; console.log("[Debug] hitPaddle called."); let diff = ball.x - paddle.x; const maxDiff = paddle.displayWidth / 2; let influence = diff / maxDiff; influence = Phaser.Math.Clamp(influence, -1, 1); const maxVx = NORMAL_BALL_SPEED * 0.8; let newVx = maxVx * influence; const minVy = NORMAL_BALL_SPEED * 0.5; let currentVy = ball.body.velocity.y; let newVy = -Math.abs(currentVy); if (Math.abs(newVy) < minVy) newVy = -minVy; let speedMultiplier = 1.0; if (ball.getData('isFast')) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.SHATORA]; else if (ball.getData('isSlow')) speedMultiplier = BALL_SPEED_MODIFIERS[POWERUP_TYPES.HAILA]; const targetSpeed = NORMAL_BALL_SPEED * speedMultiplier; const newVelocity = new Phaser.Math.Vector2(newVx, newVy).normalize().scale(targetSpeed); ball.setVelocity(newVelocity.x, newVelocity.y); console.log("[Debug] Attempting to play SE_REFLECT..."); try { /* this.sound.play(AUDIO_KEYS.SE_REFLECT); */ console.log("[Temporary] SE_REFLECT playback disabled due to errors."); } catch (error) { /* console.error("[Debug] Error occurred directly when trying to play SE_REFLECT:", error); */ } if (ball.getData('lastActivatedPower') === POWERUP_TYPES.BIKARA) { this.switchBikaraState(ball); } if (ball.getData('isIndaraActive')) { this.deactivateIndaraForBall(ball); this.updateBallAppearance(ball); } }
   collectPowerUp(paddle, powerUp) { if (!powerUp || !powerUp.active || this.isStageClearing) return; const type = powerUp.getData('type'); if (!type) { console.warn("Collected powerup with no type data!"); powerUp.destroy(); return; } powerUp.destroy(); const voiceKeyBase = `voice_${type}`; const upperCaseKey = voiceKeyBase.toUpperCase(); let actualAudioKey = AUDIO_KEYS[upperCaseKey]; if (type === POWERUP_TYPES.VAJRA) { actualAudioKey = AUDIO_KEYS.VOICE_VAJRA_GET; } // VOICE_VAJRA_GET は 'voice_vajra' になっているはず
   const now = this.time.now; const lastPlayed = this.lastPlayedVoiceTime[upperCaseKey] || 0; if (actualAudioKey && (now - lastPlayed > this.voiceThrottleTime)) { console.log(`Playing voice: ${actualAudioKey}`); try { this.sound.play(actualAudioKey); this.lastPlayedVoiceTime[upperCaseKey] = now; } catch (e) { console.error(`Error playing voice ${actualAudioKey} for type ${type}:`, e); } } else if (!actualAudioKey) { /* console.warn(`Voice key ${upperCaseKey} (for type ${type}) not found in AUDIO_KEYS.`); */ } else { console.log(`Voice ${upperCaseKey} (for type ${type}) throttled.`); } if (type === POWERUP_TYPES.BAISRAVA) { this.activateBaisrava(); return; } if (type === POWERUP_TYPES.VAJRA) { this.activateVajra(); return; } if (type === POWERUP_TYPES.MAKIRA) { this.activateMakira(); return; } if (type === POWERUP_TYPES.MAKORA) { this.activateMakora(); return; } if (type === POWERUP_TYPES.ANCHIRA || type === POWERUP_TYPES.SINDARA) { if (this.balls.countActive(true) > 1) { this.keepFurthestBall(); } } this.activatePower(type); }
   activateMakora() { const copyablePowerType = Phaser.Utils.Array.GetRandom(MAKORA_COPYABLE_POWERS); console.log(`Makora copied: ${copyablePowerType}`); this.balls.getMatching('active', true).forEach(ball => { ball.getData('activePowers').add(POWERUP_TYPES.MAKORA); ball.setData('lastActivatedPower', POWERUP_TYPES.MAKORA); this.updateBallAppearance(ball); }); this.time.delayedCall(100, () => { switch(copyablePowerType) { case POWERUP_TYPES.KUBIRA: case POWERUP_TYPES.SHATORA: case POWERUP_TYPES.HAILA: case POWERUP_TYPES.BIKARA: case POWERUP_TYPES.INDARA: case POWERUP_TYPES.ANILA: this.activatePower(copyablePowerType); break; case POWERUP_TYPES.ANCHIRA: case POWERUP_TYPES.SINDARA: if (this.balls.countActive(true) > 1) { this.keepFurthestBall(); } this.activatePower(copyablePowerType); break; case POWERUP_TYPES.VAJRA: this.activateVajra(); break; case POWERUP_TYPES.MAKIRA: this.activateMakira(); break; } this.balls.getMatching('active', true).forEach(ball => { ball.getData('activePowers').delete(POWERUP_TYPES.MAKORA); }); }, [], this); }
   keepFurthestBall() { console.log("Keeping furthest ball."); const activeBalls = this.balls.getMatching('active', true); if (activeBalls.length <= 1) return; let furthestBall = null; let maxDistSq = -1; const paddlePos = new Phaser.Math.Vector2(this.paddle.x, this.paddle.y); activeBalls.forEach(ball => { const distSq = Phaser.Math.Distance.Squared(paddlePos.x, paddlePos.y, ball.x, ball.y); if (distSq > maxDistSq) { maxDistSq = distSq; furthestBall = ball; } }); activeBalls.forEach(ball => { if (ball !== furthestBall) { console.log("Destroying closer ball."); ball.destroy(); } }); }
   activatePower(type) { console.log(`Activating power: ${type}`); const targetBalls = this.balls.getMatching('active', true); if (targetBalls.length === 0) { console.warn(`No active balls to activate power ${type} on.`); return; } if (POWERUP_DURATION[type]) { if (this.powerUpTimers[type]) { this.powerUpTimers[type].remove(); } } targetBalls.forEach(ball => { if (ball.active) { ball.getData('activePowers').add(type); ball.setData('lastActivatedPower', type); } }); switch (type) { case POWERUP_TYPES.KUBIRA: this.activateKubira(targetBalls); break; case POWERUP_TYPES.SHATORA: this.activateShatora(targetBalls); break; case POWERUP_TYPES.HAILA: this.activateHaira(targetBalls); break; case POWERUP_TYPES.ANCHIRA: if (targetBalls.length === 1) this.activateAnchira(targetBalls[0]); break; case POWERUP_TYPES.SINDARA: if (targetBalls.length === 1) this.activateSindara(targetBalls[0]); break; case POWERUP_TYPES.BIKARA: this.activateBikara(targetBalls); break; case POWERUP_TYPES.INDARA: this.activateIndara(targetBalls); break; case POWERUP_TYPES.ANILA: this.activateAnila(targetBalls); break; } if (type !== POWERUP_TYPES.ANCHIRA && type !== POWERUP_TYPES.SINDARA && type !== POWERUP_TYPES.BIKARA) { targetBalls.forEach(ball => { if (ball.active) { this.updateBallAppearance(ball); } }); } const duration = POWERUP_DURATION[type]; if (duration) { this.powerUpTimers[type] = this.time.delayedCall(duration, () => { console.log(`Deactivating power ${type} due to duration.`); this.deactivatePowerByType(type); this.powerUpTimers[type] = null; }, [], this); } this.setColliders(); }
   deactivatePowerByType(type) { console.log(`Deactivating power: ${type}`); const targetBalls = this.balls.getMatching('active', true); if (targetBalls.length === 0) return; if (type === POWERUP_TYPES.VAJRA || type === POWERUP_TYPES.MAKIRA || type === POWERUP_TYPES.MAKORA) return; switch (type) { case POWERUP_TYPES.KUBIRA: this.deactivateKubira(targetBalls); break; case POWERUP_TYPES.SHATORA: this.deactivateShatora(targetBalls); break; case POWERUP_TYPES.HAILA: this.deactivateHaira(targetBalls); break; case POWERUP_TYPES.ANCHIRA: this.deactivateAnchira(targetBalls); break; case POWERUP_TYPES.BIKARA: this.deactivateBikara(targetBalls); break; case POWERUP_TYPES.SINDARA: this.deactivateSindara(targetBalls); break; case POWERUP_TYPES.INDARA: targetBalls.forEach(b => this.deactivateIndaraForBall(b)); break; case POWERUP_TYPES.ANILA: targetBalls.forEach(b => this.deactivateAnilaForBall(b)); break; } targetBalls.forEach(ball => { if (ball.active) { ball.getData('activePowers').delete(type); if (ball.getData('lastActivatedPower') === type) { const remainingPowers = Array.from(ball.getData('activePowers')); ball.setData('lastActivatedPower', remainingPowers.length > 0 ? remainingPowers[remainingPowers.length - 1] : null); } this.updateBallAppearance(ball); } }); this.setColliders(); }
   updateBallAppearance(ball) { if (!ball || !ball.active) return; const activePowers = ball.getData('activePowers'); const lastPower = ball.getData('lastActivatedPower'); let textureKey = 'ball_image'; if (activePowers && activePowers.size > 0 && lastPower) { if (lastPower === POWERUP_TYPES.BIKARA) { textureKey = (ball.getData('bikaraState') === 'yang') ? POWERUP_ICON_KEYS.BIKARA_YANG : POWERUP_ICON_KEYS[POWERUP_TYPES.BIKARA]; } else if (lastPower === POWERUP_TYPES.SINDARA) { if (ball.getData('isPenetrating') && !ball.getData('isMerging') && !ball.getData('isAttracting')) { textureKey = POWERUP_ICON_KEYS.SINDARA_SUPER; } else { textureKey = POWERUP_ICON_KEYS[POWERUP_TYPES.SINDARA]; } } else if (POWERUP_ICON_KEYS[lastPower]) { textureKey = POWERUP_ICON_KEYS[lastPower]; } } if (ball.texture.key !== textureKey) { ball.setTexture(textureKey); } ball.clearTint(); }
   activateKubira(balls) { balls.forEach(b => b.setData('isPenetrating', true)); }
   deactivateKubira(balls) { balls.forEach(b => { const lastPower = b.getData('lastActivatedPower'); const isSindaraActive = lastPower === POWERUP_TYPES.SINDARA && (b.getData('isAttracting') || b.getData('isMerging')); const isBikaraYangActive = lastPower === POWERUP_TYPES.BIKARA && b.getData('bikaraState') === 'yang'; const kubiraIsActive = b.getData('activePowers').has(POWERUP_TYPES.KUBIRA); if (kubiraIsActive && !isSindaraActive && !isBikaraYangActive) { b.setData('isPenetrating', false); } }); }
   applySpeedModifier(ball, type) { if (!ball || !ball.active || !ball.body) return; const modifier = BALL_SPEED_MODIFIERS[type]; if (!modifier) return; const currentVelocity = ball.body.velocity; const direction = currentVelocity.length() > 0 ? currentVelocity.clone().normalize() : new Phaser.Math.Vector2(0, -1); const newSpeed = NORMAL_BALL_SPEED * modifier; ball.setVelocity(direction.x * newSpeed, direction.y * newSpeed); }
   resetBallSpeed(ball) { if (!ball || !ball.active || !ball.body) return; if (ball.getData('isFast')) { this.applySpeedModifier(ball, POWERUP_TYPES.SHATORA); } else if (ball.getData('isSlow')) { this.applySpeedModifier(ball, POWERUP_TYPES.HAILA); } else { const currentVelocity = ball.body.velocity; const direction = currentVelocity.length() > 0 ? currentVelocity.clone().normalize() : new Phaser.Math.Vector2(0, -1); ball.setVelocity(direction.x * NORMAL_BALL_SPEED, direction.y * NORMAL_BALL_SPEED); } }
   activateShatora(balls) { balls.forEach(b => { b.setData({ isFast: true, isSlow: false }); this.applySpeedModifier(b, POWERUP_TYPES.SHATORA); }); }
   deactivateShatora(balls) { balls.forEach(b => { if (b.getData('isFast')) { b.setData('isFast', false); this.resetBallSpeed(b); } }); }
   activateHaira(balls) { balls.forEach(b => { b.setData({ isSlow: true, isFast: false }); this.applySpeedModifier(b, POWERUP_TYPES.HAILA); }); }
   deactivateHaira(balls) { balls.forEach(b => { if (b.getData('isSlow')) { b.setData('isSlow', false); this.resetBallSpeed(b); } }); }
   activateAnchira(sourceBall) { if (!sourceBall || !sourceBall.active) return; console.log("Activating Anchira split."); this.updateBallAppearance(sourceBall); const x = sourceBall.x; const y = sourceBall.y; const numSplits = 3; const ballData = sourceBall.data.getAll(); ballData.lastActivatedPower = POWERUP_TYPES.ANCHIRA; if (!ballData.activePowers) ballData.activePowers = new Set(); ballData.activePowers.add(POWERUP_TYPES.ANCHIRA); for (let i = 0; i < numSplits; i++) { const offsetX = Phaser.Math.Between(-5, 5); const offsetY = Phaser.Math.Between(-5, 5); const vx = Phaser.Math.Between(-150, 150); const vy = -Math.abs(Phaser.Math.Between(NORMAL_BALL_SPEED * 0.5, NORMAL_BALL_SPEED * 0.8)); this.createAndAddBall(x + offsetX, y + offsetY, vx, vy, ballData); } }
   deactivateAnchira(balls) { /* Handled by deactivatePowerByType */ }
   activateSindara(sourceBall) { if (!sourceBall || !sourceBall.active) return; console.log("Activating Sindara split."); const theBall = sourceBall; this.updateBallAppearance(theBall); const x = theBall.x; const y = theBall.y; const ballData = theBall.data.getAll(); ballData.lastActivatedPower = POWERUP_TYPES.SINDARA; if (!ballData.activePowers) ballData.activePowers = new Set(); ballData.activePowers.add(POWERUP_TYPES.SINDARA); ballData.isAttracting = false; ballData.isMerging = false; const vx = Phaser.Math.Between(-150, 150); const vy = -Math.abs(Phaser.Math.Between(NORMAL_BALL_SPEED * 0.5, NORMAL_BALL_SPEED * 0.8)); const partnerBall = this.createAndAddBall(x + Phaser.Math.Between(-5, 5), y + Phaser.Math.Between(-5, 5), vx, vy, ballData); if (partnerBall) { theBall.setData({ sindaraPartner: partnerBall, isAttracting: false, isMerging: false }); partnerBall.setData({ sindaraPartner: theBall, isAttracting: false, isMerging: false }); if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); console.log("Scheduling Sindara attraction."); this.sindaraAttractionTimer = this.time.delayedCall(SINDARA_ATTRACTION_DELAY, () => { this.startSindaraAttraction(theBall, partnerBall); }, [], this); } else { console.warn("Failed to create partner ball for Sindara."); theBall.getData('activePowers').delete(POWERUP_TYPES.SINDARA); const remainingPowers = Array.from(theBall.getData('activePowers')); theBall.setData('lastActivatedPower', remainingPowers.length > 0 ? remainingPowers[remainingPowers.length - 1] : null); this.updateBallAppearance(theBall); } }
   startSindaraAttraction(ball1, ball2) { this.sindaraAttractionTimer = null; if (!ball1 || !ball2 || !ball1.active || !ball2.active || ball1.getData('lastActivatedPower') !== POWERUP_TYPES.SINDARA || ball2.getData('lastActivatedPower') !== POWERUP_TYPES.SINDARA) { console.warn("Sindara attraction aborted: balls missing or lost power."); const activeSindaraBalls = this.balls.getMatching('lastActivatedPower', POWERUP_TYPES.SINDARA); if (activeSindaraBalls.length > 0) { this.deactivatePowerByType(POWERUP_TYPES.SINDARA); } return; } console.log("Starting Sindara attraction."); ball1.setData({ isAttracting: true, isPenetrating: true }); ball2.setData({ isAttracting: true, isPenetrating: true }); this.updateBallAppearance(ball1); this.updateBallAppearance(ball2); this.setColliders(); }
   updateSindaraAttraction(ball) { const partner = ball.getData('sindaraPartner'); if (partner && partner.active && ball.active && ball.getData('isAttracting') && partner.getData('isAttracting') && !ball.getData('isMerging') && !partner.getData('isMerging')) { this.physics.moveToObject(ball, partner, SINDARA_ATTRACTION_FORCE); } }
   handleBallCollision(ball1, ball2) { if (ball1.active && ball2.active && ball1.getData('sindaraPartner') === ball2 && ball1.getData('isAttracting')) { console.log("Sindara balls collided, merging."); this.mergeSindaraBalls(ball1, ball2); } }
   mergeSindaraBalls(ballToKeep, ballToRemove) { console.log("[Debug] mergeSindaraBalls called."); console.log("[Debug] Attempting to play VOICE_SINDARA_MERGE..."); try { this.sound.play(AUDIO_KEYS.VOICE_SINDARA_MERGE); console.log("[Debug] this.sound.play(AUDIO_KEYS.VOICE_SINDARA_MERGE) called."); } catch (error) { console.error("[Debug] Error occurred directly when trying to play VOICE_SINDARA_MERGE:", error); } console.log("[Debug] Attempting to play SE_SINDARA_MERGE..."); try { this.sound.play(AUDIO_KEYS.SE_SINDARA_MERGE); console.log("[Debug] this.sound.play(AUDIO_KEYS.SE_SINDARA_MERGE) called."); } catch (error) { console.error("[Debug] Error occurred directly when trying to play SE_SINDARA_MERGE:", error); } const mergeX = (ballToKeep.x + ballToRemove.x) / 2; const mergeY = (ballToKeep.y + ballToRemove.y) / 2; ballToKeep.setPosition(mergeX, mergeY); ballToRemove.destroy(); ballToKeep.setData({ isMerging: true, isAttracting: false, isPenetrating: true, sindaraPartner: null }); this.updateBallAppearance(ballToKeep); if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); console.log("Scheduling Sindara merge finish."); this.sindaraMergeTimer = this.time.delayedCall(SINDARA_MERGE_DURATION, () => { this.finishSindaraMerge(ballToKeep); }, [], this); if (this.sindaraAttractionTimer) { this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null; } this.setColliders(); }
   finishSindaraMerge(mergedBall) { this.sindaraMergeTimer = null; if (!mergedBall || !mergedBall.active) return; console.log("Finishing Sindara merge."); mergedBall.setData({ isMerging: false }); this.updateBallAppearance(mergedBall); if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); console.log("Scheduling Sindara post-merge penetration deactivation."); this.sindaraPenetrationTimer = this.time.delayedCall(SINDARA_POST_MERGE_PENETRATION_DURATION, () => { this.deactivateSindaraPenetration(mergedBall); }, [], this); this.setColliders(); }
   deactivateSindaraPenetration(ball) { this.sindaraPenetrationTimer = null; if (!ball || !ball.active) return; console.log("Deactivating Sindara post-merge penetration."); if (!ball.getData('activePowers').has(POWERUP_TYPES.KUBIRA)) { const isBikaraYang = ball.getData('lastActivatedPower') === POWERUP_TYPES.BIKARA && ball.getData('bikaraState') === 'yang'; if (!isBikaraYang) { ball.setData('isPenetrating', false); } } this.deactivatePowerByType(POWERUP_TYPES.SINDARA); }
   deactivateSindara(balls) { console.log("Deactivating Sindara power completely."); if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null; if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); this.sindaraMergeTimer = null; if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); this.sindaraPenetrationTimer = null; balls.forEach(b => { if (b.active) { b.setData({ sindaraPartner: null, isAttracting: false, isMerging: false }); if (!b.getData('activePowers').has(POWERUP_TYPES.KUBIRA)) { const isBikaraYang = b.getData('lastActivatedPower') === POWERUP_TYPES.BIKARA && b.getData('bikaraState') === 'yang'; if (!isBikaraYang) { b.setData('isPenetrating', false); } } } }); }
   activateBikara(balls) { balls.forEach(ball => { if (ball.active) { ball.setData({ bikaraState: 'yin', bikaraYangCount: 0 }); if (!ball.getData('activePowers').has(POWERUP_TYPES.KUBIRA)) { const isSindaraActive = ball.getData('lastActivatedPower') === POWERUP_TYPES.SINDARA && (ball.getData('isAttracting') || ball.getData('isMerging')); if (!isSindaraActive) { ball.setData('isPenetrating', false); } } this.updateBallAppearance(ball); } }); }
   deactivateBikara(balls) { balls.forEach(ball => { if (ball.active) { ball.setData({ bikaraState: null, bikaraYangCount: 0 }); if (!ball.getData('activePowers').has(POWERUP_TYPES.KUBIRA)) { const isSindaraActive = ball.getData('lastActivatedPower') === POWERUP_TYPES.SINDARA && (ball.getData('isAttracting') || ball.getData('isMerging')); if (!isSindaraActive) { ball.setData('isPenetrating', false); } } } }); this.bricks.getChildren().forEach(br => { if (br.getData && br.getData('isMarkedByBikara')) { br.setData('isMarkedByBikara', false); br.setTint(br.getData('originalTint') || 0xffffff); } }); }
   switchBikaraState(ball) { if (!ball || !ball.active || ball.getData('lastActivatedPower') !== POWERUP_TYPES.BIKARA) return; const currentState = ball.getData('bikaraState'); const nextState = (currentState === 'yin') ? 'yang' : 'yin'; console.log(`Switching Bikara state from ${currentState} to ${nextState}`); ball.setData('bikaraState', nextState); console.log("[Debug] Attempting to play SE_BIKARA_CHANGE..."); try { this.sound.play(AUDIO_KEYS.SE_BIKARA_CHANGE); console.log("[Debug] this.sound.play(AUDIO_KEYS.SE_BIKARA_CHANGE) called."); } catch (error) { console.error("[Debug] Error occurred directly when trying to play SE_BIKARA_CHANGE:", error); } if (nextState === 'yang') { ball.setData('bikaraYangCount', 0); console.log("[Debug] Attempting to play VOICE_BIKARA_YANG..."); try { this.sound.play(AUDIO_KEYS.VOICE_BIKARA_YANG); console.log("[Debug] this.sound.play(AUDIO_KEYS.VOICE_BIKARA_YANG) called."); } catch (error) { console.error("[Debug] Error occurred directly when trying to play VOICE_BIKARA_YANG:", error); } } else { console.log("[Debug] Attempting to play VOICE_BIKARA_YIN..."); try { this.sound.play(AUDIO_KEYS.VOICE_BIKARA_YIN); console.log("[Debug] this.sound.play(AUDIO_KEYS.VOICE_BIKARA_YIN) called."); } catch (error) { console.error("[Debug] Error occurred directly when trying to play VOICE_BIKARA_YIN:", error); } } this.updateBallAppearance(ball); this.setColliders(); }
   markBrickByBikara(brick) { if (!brick || !brick.active || !brick.getData || brick.getData('isMarkedByBikara') || brick.getData('maxHits') === -1) return; brick.setData('isMarkedByBikara', true); brick.setTint(BRICK_MARKED_COLOR); }
   activateIndara(balls) { balls.forEach(b => b.setData({ isIndaraActive: true, indaraHomingCount: INDARA_MAX_HOMING_COUNT })); }
   deactivateIndaraForBall(ball) { if (!ball || !ball.active || !ball.getData('isIndaraActive')) return; console.log("Deactivating Indara for ball."); ball.setData({ isIndaraActive: false, indaraHomingCount: 0 }); }
   handleWorldBounds(body, up, down, left, right) { const ball = body.gameObject; if (!ball || !(ball instanceof Phaser.Physics.Arcade.Image) || !this.balls.contains(ball) || !ball.active) return; if (up || left || right) { try { /* this.sound.play(AUDIO_KEYS.SE_REFLECT); */ console.log("[Temporary] SE_REFLECT playback disabled due to errors (handleWorldBounds)."); } catch(e) { /* console.error("[Debug] Error playing SE_REFLECT in handleWorldBounds:", e); */ } } if (ball.getData('isIndaraActive') && ball.getData('indaraHomingCount') > 0 && (up || left || right)) { console.log("Indara homing attempt on world bounds."); const currentHomingCount = ball.getData('indaraHomingCount'); const targetBricks = this.bricks.getMatching('active', true).filter(b => b.getData && b.getData('maxHits') !== -1); if (targetBricks.length > 0) { let closestBrick = null; let minDistSq = Infinity; const ballCenter = ball.body.center; targetBricks.forEach(brick => { const distSq = Phaser.Math.Distance.Squared(ballCenter.x, ballCenter.y, brick.body.center.x, brick.body.center.y); if (distSq < minDistSq) { minDistSq = distSq; closestBrick = brick; } }); if (closestBrick) { console.log("Indara homing target found, changing velocity."); const currentSpeed = ball.body.velocity.length(); const angle = Phaser.Math.Angle.BetweenPoints(ballCenter, closestBrick.body.center); this.physics.velocityFromAngle(angle, currentSpeed, ball.body.velocity); const newHomingCount = currentHomingCount - 1; ball.setData('indaraHomingCount', newHomingCount); if (newHomingCount <= 0) { console.log("Indara homing count reached zero."); this.deactivateIndaraForBall(ball); this.deactivatePowerByType(POWERUP_TYPES.INDARA); } } } } }
   activateAnila(balls) { balls.forEach(b => { if (!b.getData('isAnilaActive')) { b.setData('isAnilaActive', true); } }); }
   deactivateAnilaForBall(ball) { if (!ball || !ball.active || !ball.getData('isAnilaActive')) return; ball.setData('isAnilaActive', false); }
   triggerAnilaBounce(ball) { if (!ball || !ball.active || !ball.getData('isAnilaActive')) return; console.log("Triggering Anila bounce."); const currentVy = ball.body.velocity.y; const bounceVy = -Math.abs(currentVy > -10 ? BALL_INITIAL_VELOCITY_Y * 0.7 : currentVy * 0.8); ball.setVelocityY(bounceVy); ball.y = this.gameHeight - PADDLE_Y_OFFSET - PADDLE_HEIGHT; this.deactivateAnilaForBall(ball); this.deactivatePowerByType(POWERUP_TYPES.ANILA); }
   activateVajra() { if (!this.isVajraSystemActive) { console.log("Activating Vajra system."); this.isVajraSystemActive = true; this.vajraGauge = 0; this.events.emit('activateVajraUI', this.vajraGauge, VAJRA_GAUGE_MAX); this.balls.getMatching('active', true).forEach(ball => { ball.getData('activePowers').add(POWERUP_TYPES.VAJRA); ball.setData('lastActivatedPower', POWERUP_TYPES.VAJRA); this.updateBallAppearance(ball); }); } }
   increaseVajraGauge() { if (this.isVajraSystemActive && !this.isStageClearing && !this.isGameOver) { this.vajraGauge += VAJRA_GAUGE_INCREMENT; this.vajraGauge = Math.min(this.vajraGauge, VAJRA_GAUGE_MAX); this.events.emit('updateVajraGauge', this.vajraGauge); if (this.vajraGauge >= VAJRA_GAUGE_MAX) { this.triggerVajraDestroy(); } } }
   deactivateVajra() { if (this.isVajraSystemActive) { console.log("Deactivating Vajra system."); this.isVajraSystemActive = false; this.vajraGauge = 0; this.events.emit('deactivateVajraUI'); this.balls.getMatching('active', true).forEach(ball => { ball.getData('activePowers').delete(POWERUP_TYPES.VAJRA); if (ball.getData('lastActivatedPower') === POWERUP_TYPES.VAJRA) { const remainingPowers = Array.from(ball.getData('activePowers')); ball.setData('lastActivatedPower', remainingPowers.length > 0 ? remainingPowers[remainingPowers.length - 1] : null); } this.updateBallAppearance(ball); }); } else { this.vajraGauge = 0; this.events.emit('deactivateVajraUI'); } }
   activateMakira() { if (!this.isMakiraActive) { console.log("Activating Makira."); this.isMakiraActive = true; if (this.familiars) this.familiars.clear(true, true); else this.familiars = this.physics.add.group(); this.createFamiliars(); if (this.makiraBeams) this.makiraBeams.clear(true, true); else this.makiraBeams = this.physics.add.group(); if (this.makiraAttackTimer) this.makiraAttackTimer.remove(); this.makiraAttackTimer = this.time.addEvent({ delay: MAKIRA_ATTACK_INTERVAL, callback: this.fireMakiraBeam, callbackScope: this, loop: true }); this.balls.getMatching('active', true).forEach(ball => { ball.getData('activePowers').add(POWERUP_TYPES.MAKIRA); ball.setData('lastActivatedPower', POWERUP_TYPES.MAKIRA); this.updateBallAppearance(ball); }); } const duration = POWERUP_DURATION[POWERUP_TYPES.MAKIRA]; if (this.powerUpTimers[POWERUP_TYPES.MAKIRA]) this.powerUpTimers[POWERUP_TYPES.MAKIRA].remove(); this.powerUpTimers[POWERUP_TYPES.MAKIRA] = this.time.delayedCall(duration, () => { console.log("Deactivating Makira due to duration."); this.deactivateMakira(); this.powerUpTimers[POWERUP_TYPES.MAKIRA] = null; }, [], this); this.setColliders(); }
   deactivateMakira() { if (this.isMakiraActive) { console.log("Deactivating Makira."); this.isMakiraActive = false; if (this.makiraAttackTimer) { this.makiraAttackTimer.remove(); this.makiraAttackTimer = null; } if (this.powerUpTimers[POWERUP_TYPES.MAKIRA]) { this.powerUpTimers[POWERUP_TYPES.MAKIRA].remove(); this.powerUpTimers[POWERUP_TYPES.MAKIRA] = null; } if (this.familiars) { this.familiars.clear(true, true); } if (this.makiraBeams) { this.makiraBeams.clear(true, true); } this.balls.getMatching('active', true).forEach(ball => { ball.getData('activePowers').delete(POWERUP_TYPES.MAKIRA); if (ball.getData('lastActivatedPower') === POWERUP_TYPES.MAKIRA) { const remainingPowers = Array.from(ball.getData('activePowers')); ball.setData('lastActivatedPower', remainingPowers.length > 0 ? remainingPowers[remainingPowers.length - 1] : null); } this.updateBallAppearance(ball); }); } }
   createFamiliars() { if (!this.paddle) return; const paddleX = this.paddle.x; const familiarY = this.paddle.y - PADDLE_HEIGHT / 2 - MAKIRA_FAMILIAR_SIZE; const familiarLeft = this.familiars.create(paddleX - MAKIRA_FAMILIAR_OFFSET, familiarY, 'joykun').setDisplaySize(MAKIRA_FAMILIAR_SIZE * 2, MAKIRA_FAMILIAR_SIZE * 2).clearTint(); if (familiarLeft.body) { familiarLeft.body.setAllowGravity(false).setImmovable(true); } else { console.error("Failed to create familiarLeft physics body!"); if(familiarLeft) familiarLeft.destroy(); } const familiarRight = this.familiars.create(paddleX + MAKIRA_FAMILIAR_OFFSET, familiarY, 'joykun').setDisplaySize(MAKIRA_FAMILIAR_SIZE * 2, MAKIRA_FAMILIAR_SIZE * 2).clearTint(); if (familiarRight.body) { familiarRight.body.setAllowGravity(false).setImmovable(true); } else { console.error("Failed to create familiarRight physics body!"); if(familiarRight) familiarRight.destroy();} }
   fireMakiraBeam() { if (!this.isMakiraActive || !this.familiars || this.familiars.countActive(true) === 0 || this.isStageClearing || this.isGameOver) return; /* this.sound.play(AUDIO_KEYS.SE_MAKIRA_BEAM); */ this.familiars.getChildren().forEach(familiar => { if (familiar.active) { const beam = this.makiraBeams.create(familiar.x, familiar.y - MAKIRA_FAMILIAR_SIZE, 'whitePixel').setDisplaySize(MAKIRA_BEAM_WIDTH, MAKIRA_BEAM_HEIGHT).setTint(MAKIRA_BEAM_COLOR); if (beam && beam.body) { beam.setVelocity(0, -MAKIRA_BEAM_SPEED); beam.body.setAllowGravity(false); } else { console.error("Failed to create Makira beam body!"); if (beam) beam.destroy(); } } }); }
   loseLife() { if (this.isStageClearing || this.isGameOver || this.lives <= 0) return; console.log(`Losing life. Lives remaining: ${this.lives - 1}`); this.deactivateMakira(); this.deactivateVajra(); Object.keys(this.powerUpTimers).forEach(key => { if (this.powerUpTimers[key]) { this.powerUpTimers[key].remove(); this.powerUpTimers[key] = null; } }); if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null; if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); this.sindaraMergeTimer = null; if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); this.sindaraPenetrationTimer = null; this.lives--; this.events.emit('updateLives', this.lives); this.isBallLaunched = false; const activeBalls = this.balls.getMatching('active', true); if (activeBalls.length > 0) { activeBalls.forEach(ball => { if (ball.active) { ball.setData('activePowers', new Set()); ball.setData('lastActivatedPower', null); ball.setData({ isPenetrating: false, isFast: false, isSlow: false, sindaraPartner: null, isAttracting: false, isMerging: false, bikaraState: null, bikaraYangCount: 0, isIndaraActive: false, indaraHomingCount: 0, isAnilaActive: false }); this.resetBallSpeed(ball); this.updateBallAppearance(ball); } }); } if (this.lives > 0) { this.time.delayedCall(500, this.resetForNewLife, [], this); } else { console.log("Game Over condition met."); this.sound.play(AUDIO_KEYS.SE_GAME_OVER); this.stopBgm(); this.time.delayedCall(500, this.gameOver, [], this); } }
   resetForNewLife() { if (this.isGameOver || this.isStageClearing) { console.warn(`resetForNewLife aborted: isGameOver=${this.isGameOver}, isStageClearing=${this.isStageClearing}`); return; } console.log("Resetting for new life..."); if (this.balls) { this.balls.clear(true, true); } else { console.warn("this.balls was null in resetForNewLife. Recreating group."); this.balls = this.physics.add.group({ bounceX: 1, bounceY: 1, collideWorldBounds: true }); } if (this.paddle && this.paddle.active) { this.paddle.x = this.scale.width / 2; this.paddle.y = this.scale.height - PADDLE_Y_OFFSET; this.updatePaddleSize(); } else { console.warn("Paddle not found or inactive in resetForNewLife."); } let newBall = null; if (this.paddle && this.paddle.active) { newBall = this.createAndAddBall(this.paddle.x, this.paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS); } else { console.warn("Creating ball without active paddle reference."); newBall = this.createAndAddBall(this.scale.width / 2, this.scale.height - PADDLE_Y_OFFSET - PADDLE_HEIGHT / 2 - BALL_RADIUS); } if (newBall) { this.isBallLaunched = false; this.setColliders(); console.log("New ball created and colliders set."); } else { console.error("Failed to create new ball in resetForNewLife!"); this.gameOver(); } }
   gameOver() { if (this.isGameOver) return; console.log("Executing gameOver sequence."); this.isGameOver = true; this.deactivateMakira(); this.deactivateVajra(); if (this.gameOverText) this.gameOverText.setVisible(true); this.physics.pause(); if (this.balls) { this.balls.getChildren().forEach(ball => { if (ball.active) { ball.setVelocity(0, 0); if (ball.body) ball.body.enable = false; } }); } Object.values(this.powerUpTimers).forEach(timer => { if (timer) timer.remove(); }); this.powerUpTimers = {}; if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null; if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); this.sindaraMergeTimer = null; if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); this.sindaraPenetrationTimer = null; if (this.makiraAttackTimer) this.makiraAttackTimer.remove(); this.makiraAttackTimer = null; }
   stageClear() { if (this.isStageClearing || this.isGameOver) return; console.log(`Stage ${this.currentStage} Clear Initiated.`); this.isStageClearing = true; this.deactivateMakira(); this.deactivateVajra(); try { console.log("[Debug] Attempting to play SE_STAGE_CLEAR..."); /* this.sound.play(AUDIO_KEYS.SE_STAGE_CLEAR); */ console.log("[Temporary] SE_STAGE_CLEAR playback disabled due to errors."); this.physics.pause(); Object.keys(this.powerUpTimers).forEach(key => { if (this.powerUpTimers[key]) { this.powerUpTimers[key].remove(); this.powerUpTimers[key] = null; } }); if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(); this.sindaraAttractionTimer = null; if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(); this.sindaraMergeTimer = null; if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(); this.sindaraPenetrationTimer = null; const activeBalls = this.balls.getMatching('active', true); if (activeBalls.length > 0) { activeBalls.forEach(ball => { if (ball.active) { ball.setData('activePowers', new Set()); ball.setData('lastActivatedPower', null); ball.setData({ isPenetrating: false, isFast: false, isSlow: false, sindaraPartner: null, isAttracting: false, isMerging: false, bikaraState: null, bikaraYangCount: 0, isIndaraActive: false, indaraHomingCount: 0, isAnilaActive: false }); this.updateBallAppearance(ball); ball.setVelocity(0, 0); } }); } if (this.bricks) { this.bricks.getChildren().forEach(br => { if (br.getData && br.getData('isMarkedByBikara')) { br.setData('isMarkedByBikara', false); } }); } if (this.powerUps) { this.powerUps.clear(true, true); } this.currentStage++; console.log(`Incrementing stage to ${this.currentStage}`); if (this.currentStage > MAX_STAGE) { console.log("Game Complete triggered."); this.gameComplete(); } else { this.events.emit('updateStage', this.currentStage); this.updateBgm(); const nextBgKey = this.getBackgroundKeyForStage(this.currentStage); if (this.bgImage && this.bgImage.texture.key !== nextBgKey) { this.bgImage.setTexture(nextBgKey); this.resizeBackground(); } console.log("Scheduling next stage setup..."); this.time.delayedCall(1000, () => { console.log("Executing delayed call for next stage setup."); if (this.isGameOver || !this.scene || !this.scene.isActive()) { console.warn("Next stage setup aborted: Game Over or Scene inactive."); return; } this.isStageClearing = false; console.log("isStageClearing set to false before reset/setup."); try { console.log("Setting up next stage..."); this.setupStage(); console.log("Resetting for new life..."); this.resetForNewLife(); console.log("Resuming physics..."); this.physics.resume(); console.log("Next stage setup complete."); } catch (e_inner) { console.error("CRITICAL Error during next stage setup:", e_inner); if (!this.isGameOver) { this.returnToTitle(); } } }, [], this); } } catch (e_outer) { console.error("CRITICAL Error during stage clear process (outside delayed call):", e_outer); if (!this.isGameOver) { this.isStageClearing = false; this.returnToTitle(); } } }
   gameComplete() { console.log("Game Complete!"); this.sound.play(AUDIO_KEYS.SE_STAGE_CLEAR); this.stopBgm(); alert(`ゲームクリア！ スコア: ${this.score}`); this.returnToTitle(); }
   returnToTitle() { console.log("Returning to Title Scene..."); this.stopBgm(); if (this.physics.world && !this.physics.world.running) { try { this.physics.resume(); } catch (e) { console.warn("Error resuming physics before returning to title:", e); } } if (this.scene.isActive('UIScene')) { try { this.scene.stop('UIScene'); console.log("UIScene stopped."); } catch (e) { console.error("Error stopping UIScene:", e); } } try { this.scene.stop(); console.log("GameScene stopping..."); } catch (e) { console.error("Error stopping GameScene:", e); } this.time.delayedCall(50, () => { if (this.scene && this.scene.manager) { try { this.scene.start('TitleScene'); console.log("Started TitleScene."); } catch (e) { console.error("Error starting TitleScene:", e); } } else { console.error("Scene Manager not found, cannot return to Title."); } }); }
   shutdownScene() { console.log("GameScene shutdown initiated."); this.stopBgm(); if (this.scale) this.scale.off('resize', this.handleResize, this); if (this.physics.world) this.physics.world.off('worldbounds', this.handleWorldBounds, this); this.events.off('shutdown', this.shutdownScene, this); this.events.removeAllListeners(); if (this.input) this.input.removeAllListeners(); this.isGameOver = false; this.isStageClearing = false; this.deactivateMakira(); this.deactivateVajra(); Object.values(this.powerUpTimers).forEach(timer => { if (timer) timer.remove(false); }); this.powerUpTimers = {}; if (this.sindaraAttractionTimer) this.sindaraAttractionTimer.remove(false); this.sindaraAttractionTimer = null; if (this.sindaraMergeTimer) this.sindaraMergeTimer.remove(false); this.sindaraMergeTimer = null; if (this.sindaraPenetrationTimer) this.sindaraPenetrationTimer.remove(false); this.sindaraPenetrationTimer = null; if (this.makiraAttackTimer) this.makiraAttackTimer.remove(false); this.makiraAttackTimer = null; if (this.bgImage) { try { this.bgImage.destroy(); } catch (e) { console.error("Error destroying bgImage:", e); } this.bgImage = null; } if (this.balls) { try { this.balls.destroy(true); } catch (e) { console.error("Error destroying balls group:", e); } this.balls = null; } if (this.bricks) { try { this.bricks.destroy(true); } catch (e) { console.error("Error destroying bricks group:", e); } this.bricks = null; } if (this.powerUps) { try { this.powerUps.destroy(true); } catch (e) { console.error("Error destroying powerUps group:", e); } this.powerUps = null; } if (this.paddle) { try { this.paddle.destroy(); } catch (e) { console.error("Error destroying paddle:", e); } this.paddle = null; } if (this.familiars) { try { this.familiars.destroy(true); } catch (e) { console.error("Error destroying familiars group:", e); } this.familiars = null; } if (this.makiraBeams) { try { this.makiraBeams.destroy(true); } catch (e) { console.error("Error destroying makiraBeams group:", e); } this.makiraBeams = null; } if (this.gameOverText) { try { this.gameOverText.destroy(); } catch (e) { console.error("Error destroying gameOverText:", e); } this.gameOverText = null; } this.ballPaddleCollider = null; this.ballBrickCollider = null; this.ballBrickOverlap = null; this.ballBallCollider = null; this.makiraBeamBrickOverlap = null; console.log("GameScene shutdown complete."); }
} // <-- GameScene クラスの終わり

// --- UIScene ---
class UIScene extends Phaser.Scene {
     constructor() { super({ key: 'UIScene', active: false }); this.livesText = null; this.scoreText = null; this.stageText = null; this.vajraGaugeText = null; this.dropPoolIconsGroup = null; this.gameSceneListenerAttached = false; this.gameScene = null; }
    create() { console.log("UIScene create started"); this.gameWidth = this.scale.width; this.gameHeight = this.scale.height; const textStyle = { fontSize: '24px', fill: '#fff' }; this.livesText = this.add.text(16, 16, 'ライフ: ', textStyle); this.stageText = this.add.text(this.gameWidth / 2, 16, 'ステージ: ', textStyle).setOrigin(0.5, 0); this.scoreText = this.add.text(this.gameWidth - 16, 16, 'スコア: ', textStyle).setOrigin(1, 0); this.vajraGaugeText = this.add.text(16, this.gameHeight - UI_BOTTOM_OFFSET, '奥義: -/-', { fontSize: '20px', fill: '#fff' }).setOrigin(0, 1).setVisible(false); this.dropPoolIconsGroup = this.add.group(); this.updateDropPoolDisplay([]); this.gameScene = this.scene.get('GameScene'); if (this.gameScene) { this.gameScene.events.on('gameResize', this.onGameResize, this); } try { const gameScene = this.scene.get('GameScene'); if (gameScene && gameScene.scene.settings.status === Phaser.Scenes.RUNNING) { this.registerGameEventListeners(gameScene); } else { this.scene.get('GameScene').events.once('create', () => { this.registerGameEventListeners(this.scene.get('GameScene')); }, this); } } catch (e) { console.error("Error setting up UIScene listeners:", e); } this.events.on('shutdown', () => { console.log("UIScene shutdown initiated."); this.unregisterGameEventListeners(); if (this.gameScene && this.gameScene.events) { this.gameScene.events.off('gameResize', this.onGameResize, this); } console.log("UIScene shutdown complete.");}); }
    onGameResize() { this.gameWidth = this.scale.width; this.gameHeight = this.scale.height; this.livesText?.setPosition(16, 16); this.stageText?.setPosition(this.gameWidth / 2, 16); this.scoreText?.setPosition(this.gameWidth - 16, 16); this.vajraGaugeText?.setPosition(16, this.gameHeight - UI_BOTTOM_OFFSET); this.updateDropPoolPosition(); }
    registerGameEventListeners(gameScene) { if (!gameScene || !gameScene.events || this.gameSceneListenerAttached) return; console.log("Registering GameScene event listeners in UIScene..."); this.unregisterGameEventListeners(gameScene); gameScene.events.on('updateLives', this.updateLivesDisplay, this); gameScene.events.on('updateScore', this.updateScoreDisplay, this); gameScene.events.on('updateStage', this.updateStageDisplay, this); gameScene.events.on('activateVajraUI', this.activateVajraUIDisplay, this); gameScene.events.on('updateVajraGauge', this.updateVajraGaugeDisplay, this); gameScene.events.on('deactivateVajraUI', this.deactivateVajraUIDisplay, this); gameScene.events.on('updateDropPoolUI', this.updateDropPoolDisplay, this); this.gameSceneListenerAttached = true; try { this.updateLivesDisplay(gameScene.lives); this.updateScoreDisplay(gameScene.score); this.updateStageDisplay(gameScene.currentStage); if (gameScene.isVajraSystemActive) this.activateVajraUIDisplay(gameScene.vajraGauge, VAJRA_GAUGE_MAX); else this.deactivateVajraUIDisplay(); this.updateDropPoolDisplay(gameScene.stageDropPool); } catch (e) { console.error("Error reflecting initial state in UIScene:", e); } }
    unregisterGameEventListeners(gameScene = null) { console.log("Unregistering GameScene event listeners from UIScene..."); const gs = gameScene || this.gameScene || (this.scene.manager ? this.scene.manager.getScene('GameScene') : null); if (gs && gs.events) { gs.events.off('updateLives', this.updateLivesDisplay, this); gs.events.off('updateScore', this.updateScoreDisplay, this); gs.events.off('updateStage', this.updateStageDisplay, this); gs.events.off('activateVajraUI', this.activateVajraUIDisplay, this); gs.events.off('updateVajraGauge', this.updateVajraGaugeDisplay, this); gs.events.off('deactivateVajraUI', this.deactivateVajraUIDisplay, this); gs.events.off('create', this.registerGameEventListeners, this); gs.events.off('updateDropPoolUI', this.updateDropPoolDisplay, this); } this.gameSceneListenerAttached = false; }
    updateLivesDisplay(lives) { if (this.livesText) this.livesText.setText(`ライフ: ${lives}`); } updateScoreDisplay(score) { if (this.scoreText) this.scoreText.setText(`スコア: ${score}`); } updateStageDisplay(stage) { if (this.stageText) this.stageText.setText(`ステージ: ${stage}`); }
    activateVajraUIDisplay(initialValue, maxValue) { if (this.vajraGaugeText) { this.vajraGaugeText.setText(`奥義: ${initialValue}/${maxValue}`).setVisible(true); this.updateDropPoolPosition(); } }
    updateVajraGaugeDisplay(currentValue) { if (this.vajraGaugeText && this.vajraGaugeText.visible) { this.vajraGaugeText.setText(`奥義: ${currentValue}/${VAJRA_GAUGE_MAX}`); } }
    deactivateVajraUIDisplay() { if (this.vajraGaugeText) { this.vajraGaugeText.setVisible(false); this.updateDropPoolPosition(); } }
    updateDropPoolDisplay(dropPoolTypes) { if (!this.dropPoolIconsGroup) return; this.dropPoolIconsGroup.clear(true, true); if (!dropPoolTypes || dropPoolTypes.length === 0) { this.updateDropPoolPosition(); return; } dropPoolTypes.forEach((type, index) => { let iconKey = POWERUP_ICON_KEYS[type] || 'whitePixel'; let tintColor = null; if (iconKey === 'whitePixel') { tintColor = (type === POWERUP_TYPES.BAISRAVA) ? 0xffd700 : 0xcccccc; } const icon = this.add.image(0, 0, iconKey).setDisplaySize(DROP_POOL_UI_ICON_SIZE, DROP_POOL_UI_ICON_SIZE).setOrigin(0, 0.5); if (tintColor !== null) { icon.setTint(tintColor); } else { icon.clearTint(); } this.dropPoolIconsGroup.add(icon); }); this.updateDropPoolPosition(); }
    updateDropPoolPosition() { if (!this.dropPoolIconsGroup || !this.vajraGaugeText) return; const startX = this.vajraGaugeText.visible ? this.vajraGaugeText.x + this.vajraGaugeText.width + 15 : 16; const startY = this.gameHeight - UI_BOTTOM_OFFSET; let currentX = startX; this.dropPoolIconsGroup.getChildren().forEach(icon => { icon.x = currentX; icon.y = startY; currentX += DROP_POOL_UI_ICON_SIZE + DROP_POOL_UI_SPACING; }); }
} // <-- UIScene

// --- Phaserゲーム設定 ---
const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.FIT, parent: 'phaser-game-container', autoCenter: Phaser.Scale.CENTER_BOTH, width: '100%', height: '100%' },
    dom: { createContainer: true },
    physics: { default: 'arcade', arcade: { debug: false, gravity: { y: 0 } } },
    scene: [BootScene, TitleScene, GameScene, UIScene],
    input: { activePointers: 3, },
    render: { pixelArt: false, antialias: true, }
};

// --- ゲーム開始 ---
window.onload = () => {
    console.log("Window loaded. Creating Phaser game.");
    try {
        const game = new Phaser.Game(config);
    } catch (e) {
        console.error("CRITICAL: Failed to initialize Phaser game:", e);
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'ゲームの起動に致命的なエラーが発生しました。開発者コンソールを確認してください。 Error: ' + e.message;
        errorDiv.style.color = 'red'; errorDiv.style.padding = '20px'; errorDiv.style.border = '2px solid red';
        document.body.appendChild(errorDiv);
    }
};
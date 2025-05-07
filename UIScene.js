// UIScene.js (レスポンシブ対応・ボスラッシュ仕様 完全版)
import {
    VAJRA_GAUGE_MAX,
    POWERUP_ICON_KEYS,
    POWERUP_TYPES,
    TOTAL_BOSSES, // 総ボス数をインポート
    // --- 割合ベースの定数をインポート ---
    UI_BOTTOM_OFFSET_RATIO,
    DROP_POOL_UI_ICON_SIZE_RATIO,
    DROP_POOL_UI_SPACING_RATIO,
    // --- UIマージン・フォント用定数 ---
    UI_TOP_MARGIN_MIN, UI_TOP_MARGIN_RATIO,
    UI_SIDE_MARGIN_MIN, UI_SIDE_MARGIN_RATIO,
    UI_FONT_SIZE_MIN, UI_FONT_SIZE_MAX, UI_FONT_SIZE_SCALE_DIVISOR
} from './constants.js';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
        this.livesText = null;
        // this.scoreText = null; // スコアは廃止
        this.bossHpText = null;    // ボス体力表示用 (HP: X/Y形式)
        this.bossNumberText = null; // ボス番号表示用 (Boss X/Y形式)
        this.vajraGaugeText = null;
        this.dropPoolIconsGroup = null;

        this.parentSceneKey = null;
        this.parentScene = null;
        this.parentResizeListener = null;
        this.eventListenerAttached = false;
        this.gameWidth = 0;
        this.gameHeight = 0;
    }

    init(data) {
        console.log("--- UIScene INIT ---");
        this.parentSceneKey = data?.parentSceneKey;
        console.log("Parent scene key set in INIT:", this.parentSceneKey);
        this.parentScene = null;
        this.parentResizeListener = null;
        this.eventListenerAttached = false;
        console.log("--- UIScene INIT End ---");
    }

    create(data) {
        console.log("--- UIScene CREATE Start ---");
        if (!this.parentSceneKey) {
            console.error("UIScene cannot proceed without parentSceneKey! Aborting.");
            this.scene.stop();
            return;
        }

        try {
            this.parentScene = this.scene.get(this.parentSceneKey);
            if (!this.parentScene) {
                console.error(`UIScene could not find parent scene: ${this.parentSceneKey}! Aborting.`);
                this.scene.stop();
                return;
            }
            console.log(`UIScene linked to parent: ${this.parentSceneKey}`);

            this.updateGameDimensions();
            const textStyle = this.createTextStyle();
            const topMargin = this.calculateTopMargin();
            const sideMargin = this.calculateSideMargin();

            console.log("[UIScene Create] Creating UI elements...");
            this.destroyUIElements(); // 既存要素を破棄

            // ライフ表示 (左上)
            this.livesText = this.add.text(sideMargin, topMargin, 'ライフ: ?', textStyle).setOrigin(0, 0.5);

            // ボス番号表示 (中央上)
            this.bossNumberText = this.add.text(this.gameWidth / 2, topMargin, 'Boss: ?/?', textStyle).setOrigin(0.5, 0.5);

            // ボス体力表示 (右上)
            this.bossHpText = this.add.text(this.gameWidth - sideMargin, topMargin, 'HP: ?/?', textStyle).setOrigin(1, 0.5);

            // ヴァジラゲージ (左下)
            const gaugeStyle = { ...textStyle, fontSize: `${this.calculateFontSize(UI_FONT_SIZE_MIN + 2)}px` }; // 少し小さめ
            const vajraGaugeY = this.gameHeight * (1 - UI_BOTTOM_OFFSET_RATIO);
            this.vajraGaugeText = this.add.text(sideMargin, vajraGaugeY, '奥義: -/-', gaugeStyle)
                .setOrigin(0, 1) // 左下基準
                .setVisible(false);

            // ドロッププール (ヴァジラゲージの右側、または左下)
            this.dropPoolIconsGroup = this.add.group();

            console.log("[UIScene Create] UI elements created.");

            this.registerParentEventListeners(this.parentScene);
            this.parentResizeListener = this.onGameResize.bind(this);
            this.parentScene.events.on('gameResize', this.parentResizeListener); // 親シーンのリサイズイベントを購読
            console.log(`[UIScene Create] Listening for events from ${this.parentSceneKey}`);

            this.setElementDepths();
            this.scene.bringToTop();
            console.log("[UIScene Create] UI elements depth set and scene brought to top.");

            this.events.on('shutdown', this.shutdownScene, this);

        } catch (e_create) {
            console.error("!!! CRITICAL ERROR during UIScene CREATE !!!", e_create.message, e_create.stack);
            this.scene.stop();
            return;
        }
        console.log("--- UIScene CREATE End ---");
    }

    updateGameDimensions() {
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
        console.log(`UIScene dimensions updated: ${this.gameWidth}x${this.gameHeight}`);
    }

    createTextStyle(baseSize = UI_FONT_SIZE_MAX) { // デフォルトの最大フォントサイズを使用
        const fontSize = this.calculateFontSize(baseSize);
        return {
            fontSize: `${fontSize}px`,
            fill: '#fff',
            fontFamily: 'MyGameFont, sans-serif' // 引き継ぎ書の指定フォント
        };
    }

    calculateFontSize(baseSize = UI_FONT_SIZE_MAX) {
        const calculatedSize = Math.floor(this.gameWidth / (UI_FONT_SIZE_SCALE_DIVISOR || 25));
        return Phaser.Math.Clamp(calculatedSize, UI_FONT_SIZE_MIN, baseSize);
    }

    calculateTopMargin() {
        const minMargin = UI_TOP_MARGIN_MIN;
        const ratioMargin = this.gameHeight * UI_TOP_MARGIN_RATIO;
        return Math.max(minMargin, ratioMargin);
    }

    calculateSideMargin() {
        const minMargin = UI_SIDE_MARGIN_MIN;
        const ratioMargin = this.gameWidth * UI_SIDE_MARGIN_RATIO;
        return Math.max(minMargin, ratioMargin);
    }

    destroyUIElements() {
        this.livesText?.destroy(); this.livesText = null;
        this.bossHpText?.destroy(); this.bossHpText = null;
        this.bossNumberText?.destroy(); this.bossNumberText = null;
        this.vajraGaugeText?.destroy(); this.vajraGaugeText = null;
        this.dropPoolIconsGroup?.destroy(true, true); this.dropPoolIconsGroup = null; // 子要素も一緒に破棄
        console.log("[Destroy UI] Existing UI elements destroyed.");
    }

    setElementDepths() {
        const uiDepth = 1000;
        this.livesText?.setDepth(uiDepth);
        this.bossHpText?.setDepth(uiDepth);
        this.bossNumberText?.setDepth(uiDepth);
        this.vajraGaugeText?.setDepth(uiDepth);
        this.dropPoolIconsGroup?.setDepth(uiDepth);
    }

    registerParentEventListeners(parentScene) {
        if (!parentScene || !parentScene.events || this.eventListenerAttached) return;
        console.log(`[Register Listeners] Registering for ${this.parentSceneKey}...`);
        this.unregisterParentEventListeners(parentScene); // 念のため解除

        parentScene.events.on('updateLives', this.updateLivesDisplay, this);
        parentScene.events.on('updateBossHp', this.updateBossHpDisplay, this);
        parentScene.events.on('updateBossNumber', this.updateBossNumberDisplay, this); // ボス番号更新用
        parentScene.events.on('activateVajraUI', this.activateVajraUIDisplay, this);
        parentScene.events.on('updateVajraGauge', this.updateVajraGaugeDisplay, this);
        parentScene.events.on('deactivateVajraUI', this.deactivateVajraUIDisplay, this);
        parentScene.events.on('updateDropPoolUI', this.updateDropPoolDisplay, this);

        this.eventListenerAttached = true;
        console.log("[Register Listeners] Listeners registered.");
        this.reflectInitialState(parentScene);
    }

    unregisterParentEventListeners(parentScene = null) {
        if (!this.eventListenerAttached) return;
        const ps = parentScene || this.parentScene;
        if (ps && ps.events) {
            ps.events.off('updateLives', this.updateLivesDisplay, this);
            ps.events.off('updateBossHp', this.updateBossHpDisplay, this);
            ps.events.off('updateBossNumber', this.updateBossNumberDisplay, this);
            ps.events.off('activateVajraUI', this.activateVajraUIDisplay, this);
            ps.events.off('updateVajraGauge', this.updateVajraGaugeDisplay, this);
            ps.events.off('deactivateVajraUI', this.deactivateVajraUIDisplay, this);
            ps.events.off('updateDropPoolUI', this.updateDropPoolDisplay, this);
        }
        this.eventListenerAttached = false;
    }

    reflectInitialState(parentScene) {
        console.log(`[Reflect State] Reading initial data from ${this.parentSceneKey}:`);
        try {
            this.updateLivesDisplay(parentScene.lives ?? '?');
            // ボスHPは親シーンのボスオブジェクトから取得することを想定
            const boss = parentScene.boss; // CommonBossScene に boss プロパティがあると仮定
            this.updateBossHpDisplay(boss?.getData('health') ?? '?', boss?.getData('maxHealth') ?? '?');
            // ボス番号は親シーンの currentBossIndex と totalBosses から取得
            this.updateBossNumberDisplay(parentScene.currentBossIndex ?? '?', parentScene.totalBosses ?? TOTAL_BOSSES);

            if (parentScene.isVajraSystemActive) {
                this.activateVajraUIDisplay(parentScene.vajraGauge ?? 0, VAJRA_GAUGE_MAX);
            } else {
                this.deactivateVajraUIDisplay();
            }
            this.updateDropPoolDisplay(parentScene.bossDropPool ?? []);

        } catch (e) { console.error(`!!! ERROR reflecting initial state:`, e.message, e.stack); }
        console.log(`[Reflect State] Initial state reflected.`);
    }

    onGameResize() {
        console.log("[On Resize] UIScene handling resize...");
        this.updateGameDimensions();
        const topMargin = this.calculateTopMargin();
        const sideMargin = this.calculateSideMargin();
        const textStyle = this.createTextStyle(); // フォントサイズ再計算
        const gaugeStyle = { ...textStyle, fontSize: `${this.calculateFontSize(UI_FONT_SIZE_MIN + 2)}px` };
        const vajraGaugeY = this.gameHeight * (1 - UI_BOTTOM_OFFSET_RATIO);

        this.livesText?.setPosition(sideMargin, topMargin).setStyle(textStyle).setOrigin(0, 0.5);
        this.bossNumberText?.setPosition(this.gameWidth / 2, topMargin).setStyle(textStyle).setOrigin(0.5, 0.5);
        this.bossHpText?.setPosition(this.gameWidth - sideMargin, topMargin).setStyle(textStyle).setOrigin(1, 0.5);
        this.vajraGaugeText?.setPosition(sideMargin, vajraGaugeY).setStyle(gaugeStyle).setOrigin(0, 1);
        this.updateDropPoolPosition(); // ドロッププールも再配置
        console.log("[On Resize] UI elements repositioned and resized.");
    }

    updateLivesDisplay(lives) {
        console.log(`[Update UI] Updating Lives: ${lives}`);
        if (this.livesText) this.livesText.setText(`ライフ: ${lives ?? '?'}`);
    }

    updateBossHpDisplay(currentHp, maxHp) {
        console.log(`[Update UI] Updating Boss HP: ${currentHp}/${maxHp}`);
        if (this.bossHpText) {
            // 2体ボスの場合は、maxHpが配列で渡されるなどの工夫が必要かもしれないが、一旦は単体前提
            if (Array.isArray(currentHp) && Array.isArray(maxHp) && currentHp.length === 2 && maxHp.length === 2) {
                this.bossHpText.setText(`HP1: ${currentHp[0] ?? '?'}/${maxHp[0] ?? '?'}\nHP2: ${currentHp[1] ?? '?'}/${maxHp[1] ?? '?'}`);
                // TODO: フォントサイズや位置を調整する必要があるかもしれない
            } else {
                this.bossHpText.setText(`HP: ${currentHp ?? '?'}/${maxHp ?? '?'}`);
            }
        }
    }

    updateBossNumberDisplay(currentBossNum, totalBosses) {
        console.log(`[Update UI] Updating Boss Number: ${currentBossNum}/${totalBosses}`);
        if (this.bossNumberText) this.bossNumberText.setText(`Boss ${currentBossNum ?? '?'}/${totalBosses ?? TOTAL_BOSSES}`);
    }

    activateVajraUIDisplay(initialValue, maxValue) {
        console.log(`[Update UI] Activating Vajra UI: ${initialValue}/${maxValue}`);
        if (this.vajraGaugeText) {
            this.vajraGaugeText.setText(`奥義: ${initialValue ?? 0}/${maxValue ?? VAJRA_GAUGE_MAX}`).setVisible(true);
            this.updateDropPoolPosition(); // ドロッププールの位置を更新
        }
    }

    updateVajraGaugeDisplay(currentValue) {
        console.log(`[Update UI] Updating Vajra Gauge: ${currentValue}`);
        if (this.vajraGaugeText && this.vajraGaugeText.visible) {
            this.vajraGaugeText.setText(`奥義: ${currentValue ?? 0}/${VAJRA_GAUGE_MAX}`);
        }
    }

    deactivateVajraUIDisplay() {
        console.log(`[Update UI] Deactivating Vajra UI`);
        if (this.vajraGaugeText) {
            this.vajraGaugeText.setVisible(false);
            this.updateDropPoolPosition(); // ドロッププールの位置を更新
        }
    }

    updateDropPoolDisplay(dropPoolTypes) {
        console.log(`[Update UI] Updating Drop Pool: [${dropPoolTypes?.join(', ') ?? 'Empty'}]`);
        if (!this.dropPoolIconsGroup) return;
        this.dropPoolIconsGroup.clear(true, true);
        if (!dropPoolTypes || dropPoolTypes.length === 0) {
            this.updateDropPoolPosition(); // 空でも位置調整は呼ぶ
            return;
        }

        const iconSize = this.gameWidth * DROP_POOL_UI_ICON_SIZE_RATIO;
        // const iconSpacing = this.gameWidth * DROP_POOL_UI_SPACING_RATIO; // updateDropPoolPosition内で計算

        dropPoolTypes.forEach((type) => {
            let iconKey = POWERUP_ICON_KEYS[type] || 'whitePixel'; // 存在しないキーなら白四角
            let tintColor = null;
            if (iconKey === 'whitePixel') { // 白四角の場合、BAISRAVAだけ色を変えるなど
                tintColor = (type === POWERUP_TYPES.BAISRAVA) ? 0xffd700 : 0xcccccc;
            }
            const icon = this.add.image(0, 0, iconKey)
                .setDisplaySize(iconSize, iconSize)
                .setOrigin(0, 0.5); // 左中央基準 (Yは共通)
            if (tintColor !== null) { icon.setTint(tintColor); } else { icon.clearTint(); }
            this.dropPoolIconsGroup.add(icon);
        });
        this.updateDropPoolPosition();
    }

    updateDropPoolPosition() {
        if (!this.dropPoolIconsGroup || !this.vajraGaugeText) return;

        const iconSize = this.gameWidth * DROP_POOL_UI_ICON_SIZE_RATIO;
        const iconSpacing = this.gameWidth * DROP_POOL_UI_SPACING_RATIO;
        const sideMargin = this.calculateSideMargin();
        const startY = this.gameHeight * (1 - UI_BOTTOM_OFFSET_RATIO); // Y座標は共通

        let startX;
        if (this.vajraGaugeText.visible) {
            // ヴァジラゲージが表示されていれば、その右隣から開始
            startX = this.vajraGaugeText.x + this.vajraGaugeText.width + iconSpacing * 2; // 少し広めに
        } else {
            // ヴァジラゲージが非表示なら、画面左端から開始
            startX = sideMargin;
        }

        let currentX = startX;
        this.dropPoolIconsGroup.getChildren().forEach(icon => {
            icon.setPosition(currentX, startY)
                .setDisplaySize(iconSize, iconSize); // リサイズ時にもサイズ反映
            currentX += iconSize + iconSpacing;
        });
    }

    shutdownScene() {
        console.log("--- UIScene SHUTDOWN Start ---");
        this.unregisterParentEventListeners();
        if (this.parentScene && this.parentScene.events && this.parentResizeListener) {
            this.parentScene.events.off('gameResize', this.parentResizeListener);
            console.log(`UIScene stopped listening for resize events from ${this.parentSceneKey}`);
        }
        this.destroyUIElements();
        this.parentScene = null; this.parentSceneKey = null; this.parentResizeListener = null; this.eventListenerAttached = false;
        this.events.off('shutdown', this.shutdownScene, this);
        console.log("--- UIScene SHUTDOWN End ---");
    }
}
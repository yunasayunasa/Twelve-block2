// UIScene.js (リファクタリング・レスポンシブ強化版)
import {
    VAJRA_GAUGE_MAX, // ヴァジラゲージ最大値
    POWERUP_ICON_KEYS, // パワーアップアイコンのキー
    POWERUP_TYPES, // パワーアップの種類
    // --- ▼ 割合ベースの定数をインポート ▼ ---
    UI_BOTTOM_OFFSET_RATIO, // 下部UIオフセット (画面高さ比)
    DROP_POOL_UI_ICON_SIZE_RATIO, // ドロッププールアイコンサイズ (画面幅比)
    DROP_POOL_UI_SPACING_RATIO, // ドロッププールアイコン間隔 (画面幅比)
    // --- ▲ 割合ベースの定数をインポート ▲ ---
    // --- ▼ UIマージン用定数 (例) - constants.js に定義推奨 ▼ ---
    UI_TOP_MARGIN_MIN, UI_TOP_MARGIN_RATIO,
    UI_SIDE_MARGIN_MIN, UI_SIDE_MARGIN_RATIO,
    UI_FONT_SIZE_MIN, UI_FONT_SIZE_MAX, UI_FONT_SIZE_SCALE_DIVISOR
    // --- ▲ UIマージン用定数 ---
} from './constants.js'; // ★★★ constants.js に上記★の定数を追加してください ★★★

// constants.js に追加する定数の例:
// export const UI_TOP_MARGIN_MIN = 16;
// export const UI_TOP_MARGIN_RATIO = 0.03;
// export const UI_SIDE_MARGIN_MIN = 16;
// export const UI_SIDE_MARGIN_RATIO = 0.03;
// export const UI_FONT_SIZE_MIN = 14;
// export const UI_FONT_SIZE_MAX = 24;
// export const UI_FONT_SIZE_SCALE_DIVISOR = 25; // 画面幅をこれで割ってフォントサイズを出す目安

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
        this.livesText = null;
        // this.scoreText = null; // スコア廃止
        this.bossHpText = null; // ★ ボス体力表示用
        this.stageText = null; // 「Boss X/5」表示用？ or 削除？ -> 一旦残す
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
        this.parentScene = null; this.parentResizeListener = null; this.eventListenerAttached = false;
        console.log("--- UIScene INIT End ---");
    }

    create(data) {
        console.log("--- UIScene CREATE Start ---");
        if (!this.parentSceneKey) { /* ...エラー処理... */ return; }

        try {
            this.parentScene = this.scene.get(this.parentSceneKey);
            if (!this.parentScene) { /* ...エラー処理... */ return; }
            console.log(`UIScene linked to parent: ${this.parentSceneKey}`);

            // --- 画面サイズ取得 ---
            this.updateGameDimensions(); // サイズ取得をメソッド化

            // --- スタイルとマージン計算 ---
            const textStyle = this.createTextStyle(); // スタイル生成をメソッド化
            const topMargin = this.calculateTopMargin();
            const sideMargin = this.calculateSideMargin();
            console.log(`Margins - Top: ${topMargin}, Side: ${sideMargin}`);

            // --- UI要素の生成 ---
            console.log("[UIScene Create] Creating UI elements...");
            this.destroyUIElements(); // 既存要素破棄

            // ★ ライフ表示 (Y原点0.5推奨)
            this.livesText = this.add.text(sideMargin, topMargin, 'ライフ: ?', textStyle).setOrigin(0, 0.5);
            // ★ ステージ表示 → ボス番号表示？ (Y原点0.5)
            this.stageText = this.add.text(this.gameWidth / 2, topMargin, 'Boss: ?/?', textStyle).setOrigin(0.5, 0.5);
            // ★ ボス体力表示 (Y原点0.5)
            this.bossHpText = this.add.text(this.gameWidth - sideMargin, topMargin, 'HP: ?/?', textStyle).setOrigin(1, 0.5);
            // ★ ヴァジラゲージ (フォントサイズ調整)
            const gaugeStyle = { ...textStyle, fontSize: `${this.calculateFontSize(18)}px` }; // 少し小さめ
            this.vajraGaugeText = this.add.text(sideMargin, this.gameHeight * (1 - UI_BOTTOM_OFFSET_RATIO), '奥義: -/-', gaugeStyle)
                .setOrigin(0, 1).setVisible(false);
            // ★ ドロッププール
            this.dropPoolIconsGroup = this.add.group();
            console.log("[UIScene Create] UI elements created.");

            // --- リスナー登録 ---
            this.registerParentEventListeners(this.parentScene);
            this.parentResizeListener = this.onGameResize.bind(this);
            this.parentScene.events.on('gameResize', this.parentResizeListener);
            console.log(`[UIScene Create] Listening for events from ${this.parentSceneKey}`);

            // --- 深度・表示順 ---
            this.setElementDepths();
            this.scene.bringToTop();
            console.log("[UIScene Create] UI elements depth set and scene brought to top.");

            // --- 終了処理 ---
            this.events.on('shutdown', this.shutdownScene, this);

        } catch (e_create) { /* ...エラー処理... */ return; }
        console.log("--- UIScene CREATE End ---");
    }

    // --- Create ヘルパーメソッド ---

    updateGameDimensions() {
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
        console.log(`UIScene dimensions updated: ${this.gameWidth}x${this.gameHeight}`);
    }

    createTextStyle() {
        const fontSize = this.calculateFontSize(); // 動的フォントサイズ
        return {
            fontSize: `${fontSize}px`,
            fill: '#fff',
            fontFamily: 'MyGameFont, sans-serif'
        };
    }

    calculateFontSize(baseSize = 24) { // 基本サイズを引数で受け取れるように
        // 画面幅に基づいてフォントサイズを計算 (最小・最大値でClamp)
        const calculatedSize = Math.floor(this.gameWidth / (UI_FONT_SIZE_SCALE_DIVISOR || 25));
        return Phaser.Math.Clamp(calculatedSize, UI_FONT_SIZE_MIN || 14, UI_FONT_SIZE_MAX || baseSize);
    }

    calculateTopMargin() {
        const minMargin = UI_TOP_MARGIN_MIN || 16;
        const ratioMargin = this.gameHeight * (UI_TOP_MARGIN_RATIO || 0.03);
        return Math.max(minMargin, ratioMargin);
    }

    calculateSideMargin() {
        const minMargin = UI_SIDE_MARGIN_MIN || 16;
        const ratioMargin = this.gameWidth * (UI_SIDE_MARGIN_RATIO || 0.03);
        return Math.max(minMargin, ratioMargin);
    }

    destroyUIElements() {
        this.livesText?.destroy(); this.livesText = null;
        this.bossHpText?.destroy(); this.bossHpText = null;
        this.stageText?.destroy(); this.stageText = null;
        this.vajraGaugeText?.destroy(); this.vajraGaugeText = null;
        this.dropPoolIconsGroup?.destroy(true); this.dropPoolIconsGroup = null;
        console.log("[Destroy UI] Existing UI elements destroyed.");
    }

    setElementDepths() {
        const uiDepth = 1000;
        this.livesText?.setDepth(uiDepth);
        this.bossHpText?.setDepth(uiDepth);
        this.stageText?.setDepth(uiDepth);
        this.vajraGaugeText?.setDepth(uiDepth);
        this.dropPoolIconsGroup?.setDepth(uiDepth);
    }

    // --- イベントリスナー登録・解除 ---

    registerParentEventListeners(parentScene) {
        if (!parentScene || !parentScene.events || this.eventListenerAttached) { return; }
        console.log(`[Register Listeners] Registering for ${this.parentSceneKey}...`);
        this.unregisterParentEventListeners(parentScene); // 念のため解除

        parentScene.events.on('updateLives', this.updateLivesDisplay, this);
        parentScene.events.on('updateBossHp', this.updateBossHpDisplay, this); // ★ ボス体力用イベント
        parentScene.events.on('updateStage', this.updateStageDisplay, this); // ステージ/ボス番号更新用
        parentScene.events.on('activateVajraUI', this.activateVajraUIDisplay, this);
        parentScene.events.on('updateVajraGauge', this.updateVajraGaugeDisplay, this);
        parentScene.events.on('deactivateVajraUI', this.deactivateVajraUIDisplay, this);
        parentScene.events.on('updateDropPoolUI', this.updateDropPoolDisplay, this);

        this.eventListenerAttached = true;
        console.log("[Register Listeners] Listeners registered.");
        this.reflectInitialState(parentScene); // 初期値反映
    }

    unregisterParentEventListeners(parentScene = null) {
        // ... (内容は変更なし、updateBossHp を追加) ...
        const ps = parentScene || this.parentScene;
        if (ps && ps.events) {
             ps.events.off('updateLives', this.updateLivesDisplay, this);
             ps.events.off('updateBossHp', this.updateBossHpDisplay, this); // ★ 追加
             ps.events.off('updateStage', this.updateStageDisplay, this);
             ps.events.off('activateVajraUI', this.activateVajraUIDisplay, this);
             ps.events.off('updateVajraGauge', this.updateVajraGaugeDisplay, this);
             ps.events.off('deactivateVajraUI', this.deactivateVajraUIDisplay, this);
             ps.events.off('updateDropPoolUI', this.updateDropPoolDisplay, this);
        }
        this.eventListenerAttached = false;
    }

    // --- 初期値反映 ---
    reflectInitialState(parentScene) {
        console.log(`[Reflect State] Reading initial data from ${this.parentSceneKey}:`);
        try {
            this.updateLivesDisplay(parentScene.lives ?? '?');
            this.updateBossHpDisplay(parentScene.boss?.getData('health') ?? '?', parentScene.boss?.getData('maxHealth') ?? '?'); // ★ ボス体力を取得
            // ★ ステージ表示をボス番号に (parentSceneにcurrentBossIndexとtotalBossesがあると仮定)
            this.updateStageDisplay(`${parentScene.currentBossIndex ?? '?'}/${parentScene.totalBosses ?? TOTAL_BOSSES}`);
            // ... (Vajra, DropPool) ...
        } catch (e) { console.error(`!!! ERROR reflecting initial state:`, e.message, e.stack); }
        console.log(`[Reflect State] Initial state reflected.`);
    }

    // --- リサイズ処理 ---
    onGameResize() {
        console.log("[On Resize] UIScene handling resize...");
        this.updateGameDimensions(); // 画面サイズ更新
        const topMargin = this.calculateTopMargin();
        const sideMargin = this.calculateSideMargin();
        const textStyle = this.createTextStyle(); // フォントサイズ再計算

        // 位置とスタイル（フォントサイズ）を再設定
        this.livesText?.setPosition(sideMargin, topMargin).setStyle(textStyle);
        this.stageText?.setPosition(this.gameWidth / 2, topMargin).setStyle(textStyle);
        this.bossHpText?.setPosition(this.gameWidth - sideMargin, topMargin).setStyle(textStyle);
        // Vajraゲージのフォントサイズも再設定
        const gaugeStyle = { ...textStyle, fontSize: `${this.calculateFontSize(18)}px` };
        this.vajraGaugeText?.setPosition(sideMargin, this.gameHeight * (1 - UI_BOTTOM_OFFSET_RATIO)).setStyle(gaugeStyle);
        // ドロッププール位置更新 (内部でサイズ・間隔も再計算するとより良い)
        this.updateDropPoolPosition();
        console.log("[On Resize] UI elements repositioned and resized.");
    }

    // --- UI更新メソッド群 ---
    updateLivesDisplay(lives) { /* ... (変更なし) ... */ }
    // ★ ボス体力更新メソッド (新規追加)
    updateBossHpDisplay(currentHp, maxHp) {
        console.log(`[Update UI] Updating Boss HP: ${currentHp}/${maxHp}`);
        // TODO: 2体ボスの表示形式に対応
        if (this.bossHpText) {
             this.bossHpText.setText(`HP: ${currentHp ?? '?'}/${maxHp ?? '?'}`);
             // 体力に応じて色を変えるなどの演出も可能
             // if (currentHp / maxHp < 0.3) this.bossHpText.setColor('#ff0000');
             // else this.bossHpText.setColor('#ffffff');
        }
    }
    updateStageDisplay(stageText) { // 引数を汎用的なテキストに
        console.log(`[Update UI] Updating Stage/Boss Text: ${stageText}`);
        if (this.stageText) this.stageText.setText(`${stageText ?? '?'}`);
    }
    activateVajraUIDisplay(initialValue, maxValue) { /* ... (変更なし) ... */ }
    updateVajraGaugeDisplay(currentValue) { /* ... (変更なし) ... */ }
    deactivateVajraUIDisplay() { /* ... (変更なし) ... */ }

    // ★ ドロッププール表示 (サイズ・間隔を割合で計算)
    updateDropPoolDisplay(dropPoolTypes) {
        console.log(`[Update UI] Updating Drop Pool: [${dropPoolTypes?.join(', ') ?? 'Empty'}]`);
        if (!this.dropPoolIconsGroup) return;
        this.dropPoolIconsGroup.clear(true, true);
        if (!dropPoolTypes || dropPoolTypes.length === 0) { this.updateDropPoolPosition(); return; }

        // ★ 画面サイズからアイコンサイズと間隔を計算 ★
        const iconSize = this.gameWidth * (DROP_POOL_UI_ICON_SIZE_RATIO || 0.04);
        const iconSpacing = this.gameWidth * (DROP_POOL_UI_SPACING_RATIO || 0.01);

        dropPoolTypes.forEach((type) => {
            let iconKey = POWERUP_ICON_KEYS[type] || 'whitePixel';
            let tintColor = null;
            if (iconKey === 'whitePixel') { tintColor = (type === POWERUP_TYPES.BAISRAVA) ? 0xffd700 : 0xcccccc; }
            const icon = this.add.image(0, 0, iconKey)
                .setDisplaySize(iconSize, iconSize) // ★ 計算したサイズを使用
                .setOrigin(0, 0.5);
            if (tintColor !== null) { icon.setTint(tintColor); } else { icon.clearTint(); }
            this.dropPoolIconsGroup.add(icon);
        });
        this.updateDropPoolPosition(iconSize, iconSpacing); // ★ 計算結果を渡す
    }

    // ★ ドロッププール位置調整 (サイズ・間隔を受け取る)
    updateDropPoolPosition(iconSize = null, iconSpacing = null) {
        if (!this.dropPoolIconsGroup || !this.vajraGaugeText) return;
        // サイズと間隔が渡されなければ再計算 (デフォルト値)
        iconSize = iconSize ?? this.gameWidth * (DROP_POOL_UI_ICON_SIZE_RATIO || 0.04);
        iconSpacing = iconSpacing ?? this.gameWidth * (DROP_POOL_UI_SPACING_RATIO || 0.01);

        const startX = this.vajraGaugeText.visible ? this.vajraGaugeText.x + this.vajraGaugeText.width + 15 : (this.calculateSideMargin()); // ★ sideMargin を使う
        const startY = this.gameHeight * (1 - UI_BOTTOM_OFFSET_RATIO); // ★ 割合で計算
        let currentX = startX;
        this.dropPoolIconsGroup.getChildren().forEach(icon => {
            icon.setPosition(currentX, startY)
                 .setDisplaySize(iconSize, iconSize); // ★ リサイズ時にもサイズ反映
            currentX += iconSize + iconSpacing;
        });
    }

    // --- シャットダウン ---
    shutdownScene() {
        console.log("--- UIScene SHUTDOWN Start ---");
        // ...(リスナー解除)...
        this.destroyUIElements(); // ★ UI要素破棄メソッド呼び出し
        this.parentScene = null; this.parentSceneKey = null; this.parentResizeListener = null; this.eventListenerAttached = false;
        console.log("--- UIScene SHUTDOWN End ---");
    }
}
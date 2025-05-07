// UIScene.js
import { VAJRA_GAUGE_MAX, POWERUP_ICON_KEYS, POWERUP_TYPES, DROP_POOL_UI_ICON_SIZE, DROP_POOL_UI_SPACING, UI_BOTTOM_OFFSET } from './constants.js';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
        // UI要素のプロパティ
        this.livesText = null;
        this.scoreText = null;
        this.stageText = null;
        this.vajraGaugeText = null;
        this.dropPoolIconsGroup = null;

        // 連携と状態管理
        this.parentSceneKey = null;
        this.parentScene = null;
        this.parentResizeListener = null;
        this.eventListenerAttached = false; // リスナーが登録済みかどうかのフラグ
        this.gameWidth = 0;
        this.gameHeight = 0;
    }

    init(data) {
        console.log("--- UIScene INIT ---");
        console.log("Received data type in INIT:", typeof data);
        try {
            console.log("Received data in INIT (stringified):", JSON.stringify(data));
        } catch (e) { console.error("Error stringifying data in INIT", e); }
        this.parentSceneKey = data?.parentSceneKey;
        console.log("Parent scene key set in INIT:", this.parentSceneKey);
        // init段階では参照はクリアしておく
        this.parentScene = null;
        this.parentResizeListener = null;
        this.eventListenerAttached = false;
        console.log("--- UIScene INIT End ---");
    }

    create(data) { // data引数は念のため残す
        console.log("--- UIScene CREATE Start ---");
        console.log("parentSceneKey available in CREATE:", this.parentSceneKey);

        if (!this.parentSceneKey) {
            console.error("UIScene cannot proceed without parentSceneKey! Aborting.");
            this.scene.stop();
            return;
        }

        try {
            // --- 1. 親シーンへの参照を取得 ---
            this.parentScene = this.scene.get(this.parentSceneKey);
            if (!this.parentScene) {
                console.error(`UIScene could not find parent scene: ${this.parentSceneKey}! Aborting.`);
                this.scene.stop();
                return;
            }
            console.log(`UIScene linked to parent: ${this.parentSceneKey}`);

            // --- 2. 画面サイズとスタイル設定 ---
            this.gameWidth = this.scale.width;
            this.gameHeight = this.scale.height;
            const textStyle = {
                fontSize: '24px',
                fill: '#fff',
                fontFamily: 'MyGameFont, sans-serif' // ★ 元のフォントに戻す
            };
            console.log(`UIScene dimensions set: ${this.gameWidth}x${this.gameHeight}`);

            // --- 3. UI要素の生成 ---
            console.log("[UIScene Create] Creating UI elements...");
            // 既存要素があれば破棄 (シーン再起動時のため)
            if (this.livesText) this.livesText.destroy();
            if (this.scoreText) this.scoreText.destroy();
            if (this.stageText) this.stageText.destroy();
            if (this.vajraGaugeText) this.vajraGaugeText.destroy();
            if (this.dropPoolIconsGroup) this.dropPoolIconsGroup.destroy(true); // Groupは子要素も破棄

            this.livesText = this.add.text(16, 16, 'ライフ: ?', textStyle).setOrigin(0, 0);
            this.scoreText = this.add.text(this.gameWidth - 16, 16, 'スコア: ?', textStyle).setOrigin(1, 0); // 右上
            this.stageText = this.add.text(this.gameWidth / 2, 16, 'ステージ: ?', textStyle).setOrigin(0.5, 0); // 中央上
            this.vajraGaugeText = this.add.text(16, this.gameHeight - UI_BOTTOM_OFFSET, '奥義: -/-', { fontSize: '20px', fill: '#fff', fontFamily: 'MyGameFont, sans-serif' })
                .setOrigin(0, 1).setVisible(false); // 左下、最初は非表示
            this.dropPoolIconsGroup = this.add.group(); // 右下用グループ
            console.log("[UIScene Create] UI elements created.");


            // --- 4. イベントリスナー登録 (UI要素生成後) ---
            this.registerParentEventListeners(this.parentScene);

            // --- 5. リサイズリスナー登録 ---
            this.parentResizeListener = this.onGameResize.bind(this);
            this.parentScene.events.on('gameResize', this.parentResizeListener);
            console.log(`[UIScene Create] Listening for resize from ${this.parentSceneKey}`);

            // --- 6. 深度と表示順序の設定 ---
            this.setElementDepths(); // 深度設定を別メソッドに
            this.scene.bringToTop(); // このシーン自体を最前面に
            console.log("[UIScene Create] UI elements depth set and scene brought to top.");

            // --- 7. 終了時処理の設定 ---
            this.events.on('shutdown', this.shutdownScene, this); // shutdownSceneメソッドを登録

        } catch (e_create) { // create全体のcatch
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("!!! CRITICAL ERROR during UIScene CREATE !!!", e_create.message, e_create.stack);
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            this.scene.stop(); // エラー発生時はシーン停止
            return;
        }

        console.log("--- UIScene CREATE End ---");
    } // create メソッドの終わり

    // 親シーンのイベントリスナーを登録
    registerParentEventListeners(parentScene) {
        if (!parentScene || !parentScene.events || this.eventListenerAttached) {
            console.warn("[Register Listeners] Invalid parent scene or listeners already attached.");
            return;
        }
        console.log(`[Register Listeners] Registering event listeners for ${this.parentSceneKey}...`);
        this.unregisterParentEventListeners(parentScene); // 念のため既存を解除

        // 各イベントに対応するUI更新メソッドを紐付け
        parentScene.events.on('updateLives', this.updateLivesDisplay, this);
        parentScene.events.on('updateScore', this.updateScoreDisplay, this);
        parentScene.events.on('updateStage', this.updateStageDisplay, this);
        parentScene.events.on('activateVajraUI', this.activateVajraUIDisplay, this);
        parentScene.events.on('updateVajraGauge', this.updateVajraGaugeDisplay, this);
        parentScene.events.on('deactivateVajraUI', this.deactivateVajraUIDisplay, this);
        parentScene.events.on('updateDropPoolUI', this.updateDropPoolDisplay, this);

        this.eventListenerAttached = true;
        console.log("[Register Listeners] Listeners registered.");

        // 登録直後に初期値を反映
        this.reflectInitialState(parentScene);
    }

    // 親シーンのイベントリスナーを解除
    unregisterParentEventListeners(parentScene = null) {
        if (!this.eventListenerAttached) return; // 未登録なら何もしない
        console.log(`[Unregister Listeners] Unregistering event listeners for ${this.parentSceneKey}...`);
        const ps = parentScene || this.parentScene;
        if (ps && ps.events) {
            ps.events.off('updateLives', this.updateLivesDisplay, this);
            ps.events.off('updateScore', this.updateScoreDisplay, this);
            ps.events.off('updateStage', this.updateStageDisplay, this);
            ps.events.off('activateVajraUI', this.activateVajraUIDisplay, this);
            ps.events.off('updateVajraGauge', this.updateVajraGaugeDisplay, this);
            ps.events.off('deactivateVajraUI', this.deactivateVajraUIDisplay, this);
            ps.events.off('updateDropPoolUI', this.updateDropPoolDisplay, this);
        }
        this.eventListenerAttached = false;
        console.log("[Unregister Listeners] Listeners unregistered.");
    }

    // 親シーンから初期値を取得してUIに反映
    reflectInitialState(parentScene) {
        console.log(`[Reflect State] Reading initial data from ${this.parentSceneKey}:`);
        try {
            this.updateLivesDisplay(parentScene.lives ?? '?'); // ?? で未定義時のフォールバック
            this.updateScoreDisplay(parentScene.score ?? '?');
            this.updateStageDisplay(parentScene.currentStage ?? '?');
            if (parentScene.isVajraSystemActive) {
                 this.activateVajraUIDisplay(parentScene.vajraGauge ?? 0, VAJRA_GAUGE_MAX);
                 console.log(`  - Vajra UI: Active (Gauge: ${parentScene.vajraGauge ?? 0})`);
            } else { this.deactivateVajraUIDisplay(); console.log(`  - Vajra UI: Inactive`); }
            const dropPool = parentScene.stageDropPool ?? parentScene.bossDropPool ?? [];
            this.updateDropPoolDisplay(dropPool); console.log(`  - Drop Pool: [${dropPool.join(', ')}]`);
        } catch (e) { console.error(`!!! ERROR reflecting initial state:`, e.message, e.stack); }
        console.log(`[Reflect State] Initial state reflected.`);
    }

    // 画面リサイズ時の処理
    onGameResize() {
        console.log("[On Resize] UIScene handling resize...");
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
        // 各UI要素の位置を再計算 (存在確認を強化)
        this.livesText?.setPosition(16, 16);
        this.scoreText?.setPosition(this.gameWidth - 16, 16);
        this.stageText?.setPosition(this.gameWidth / 2, 16);
        this.vajraGaugeText?.setPosition(16, this.gameHeight - UI_BOTTOM_OFFSET);
        this.updateDropPoolPosition();
        console.log("[On Resize] UI elements repositioned.");
    }

    // UI要素の深度を設定 (描画順調整用)
    setElementDepths() {
        const uiDepth = 1000; // 他のゲーム要素より大きな値
        this.livesText?.setDepth(uiDepth);
        this.scoreText?.setDepth(uiDepth);
        this.stageText?.setDepth(uiDepth);
        this.vajraGaugeText?.setDepth(uiDepth);
        this.dropPoolIconsGroup?.setDepth(uiDepth); // グループ自体にも設定可能
    }

    // --- UI更新メソッド群 ---
    updateLivesDisplay(lives) {
        console.log(`[Update UI] Updating Lives: ${lives}`); // ログ追加
        if (this.livesText) this.livesText.setText(`ライフ: ${lives ?? '?'}`);
    }
    updateScoreDisplay(score) {
        console.log(`[Update UI] Updating Score: ${score}`); // ログ追加
        if (this.scoreText) this.scoreText.setText(`スコア: ${score ?? '?'}`);
    }
    updateStageDisplay(stage) {
        console.log(`[Update UI] Updating Stage: ${stage}`); // ログ追加
        if (this.stageText) this.stageText.setText(`ステージ: ${stage ?? '?'}`);
    }
    activateVajraUIDisplay(initialValue, maxValue) {
        console.log(`[Update UI] Activating Vajra UI: ${initialValue}/${maxValue}`); // ログ追加
        if (this.vajraGaugeText) {
            this.vajraGaugeText.setText(`奥義: ${initialValue ?? 0}/${maxValue ?? VAJRA_GAUGE_MAX}`).setVisible(true);
            this.updateDropPoolPosition();
        }
    }
    updateVajraGaugeDisplay(currentValue) {
        console.log(`[Update UI] Updating Vajra Gauge: ${currentValue}`); // ログ追加
        if (this.vajraGaugeText && this.vajraGaugeText.visible) {
            this.vajraGaugeText.setText(`奥義: ${currentValue ?? 0}/${VAJRA_GAUGE_MAX}`);
        }
    }
    deactivateVajraUIDisplay() {
        console.log(`[Update UI] Deactivating Vajra UI`); // ログ追加
        if (this.vajraGaugeText) {
            this.vajraGaugeText.setVisible(false);
            this.updateDropPoolPosition();
        }
    }
    updateDropPoolDisplay(dropPoolTypes) {
        console.log(`[Update UI] Updating Drop Pool: [${dropPoolTypes?.join(', ') ?? 'Empty'}]`); // ログ追加
        if (!this.dropPoolIconsGroup) return;
        this.dropPoolIconsGroup.clear(true, true);
        if (!dropPoolTypes || dropPoolTypes.length === 0) { this.updateDropPoolPosition(); return; }
        dropPoolTypes.forEach((type) => {
            let iconKey = POWERUP_ICON_KEYS[type] || 'whitePixel';
            let tintColor = null;
            if (iconKey === 'whitePixel') { tintColor = (type === POWERUP_TYPES.BAISRAVA) ? 0xffd700 : 0xcccccc; }
            const icon = this.add.image(0, 0, iconKey)
                .setDisplaySize(DROP_POOL_UI_ICON_SIZE, DROP_POOL_UI_ICON_SIZE)
                .setOrigin(0, 0.5);
            if (tintColor !== null) { icon.setTint(tintColor); } else { icon.clearTint(); }
            this.dropPoolIconsGroup.add(icon);
        });
        this.updateDropPoolPosition();
    }
    updateDropPoolPosition() {
        if (!this.dropPoolIconsGroup || !this.vajraGaugeText) return;
        const startX = this.vajraGaugeText.visible ? this.vajraGaugeText.x + this.vajraGaugeText.width + 15 : 16;
        const startY = this.gameHeight - UI_BOTTOM_OFFSET;
        let currentX = startX;
        this.dropPoolIconsGroup.getChildren().forEach(icon => { icon.setPosition(currentX, startY); currentX += DROP_POOL_UI_ICON_SIZE + DROP_POOL_UI_SPACING; });
    }

    // シーン終了時の処理
    shutdownScene() {
        console.log("UIScene shutdown initiated.");
        // リスナー解除
        this.unregisterParentEventListeners();
        if (this.parentScene && this.parentScene.events && this.parentResizeListener) {
            this.parentScene.events.off('gameResize', this.parentResizeListener);
            console.log(`UIScene stopped listening for resize events from ${this.parentSceneKey}`);
        }
        // UI要素などのプロパティをクリア (destroyはPhaserが適切に行うはずだが念のため)
        this.livesText = null; this.scoreText = null; this.stageText = null; this.vajraGaugeText = null; this.dropPoolIconsGroup = null;
        this.parentScene = null; this.parentSceneKey = null; this.parentResizeListener = null; this.eventListenerAttached = false;
        console.log("UIScene shutdown complete.");
    }

} // <-- UIScene クラスの終わり
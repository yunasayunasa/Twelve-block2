// TitleScene.js (ボスラッシュ対応・テストボタン修正・完全版)
import { AUDIO_KEYS, /* TOTAL_BOSSES */ } from './constants.js'; // TOTAL_BOSSESは任意

export default class TitleScene extends Phaser.Scene {
     constructor() {
        super('TitleScene');
        // デフォルトのハチャメチャ度設定
        this.selectedCount = 4; // 抽選候補数 (0-11) - 必要なら調整
        this.selectedRate = 50; // ドロップ率 (0-100%)
        this.domElements = []; // DOM要素管理用
        this.currentBgm = null; // BGM管理用
        // ▼▼▼ テスト用: 開始するボスシーン番号 (1から TOTAL_BOSSES まで) ▼▼▼
        this.testStartBossIndex = 2; // ★ ここを変えるだけでテスト対象を変更
        // ▲▲▲ テスト用: 開始するボスシーン番号 ▲▲▲
     }

    create() {
        console.log("TitleScene Create Start");
        const w = this.scale.width;
        const h = this.scale.height;

        // --- 背景 ---
        this.add.image(w / 2, h / 2, 'gameBackground3')
           .setOrigin(0.5, 0.5)
           .setDisplaySize(w, h);

        // --- BGM再生 ---
        this.playTitleBgm();

        // --- タイトルロゴ ---
        this.add.text(w / 2, h * 0.15, 'はちゃめちゃ！\n十二神将会議！\n-ボスラッシュ-', { // ★ サブタイトル追加 (任意)
            fontSize: '48px',
            fontFamily: '"Comic Sans MS", "Chalkduster", "Arial Rounded MT Bold", sans-serif',
            fill: '#FFD700',
            stroke: '#C71585',
            strokeThickness: 6,
            align: 'center',
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 6, stroke: true, fill: true }
        }).setOrigin(0.5);

        // --- ハチャメチャ度設定UI (DOM要素) ---
        const sliderContainer = document.createElement('div');
        sliderContainer.id = 'chaos-slider-container'; // CSSでスタイル指定

        // 抽選候補数スライダー
        const countDiv = document.createElement('div');
        countDiv.style.marginBottom = '10px';
        const countLabel = document.createElement('label');
        countLabel.htmlFor = 'count-slider';
        countLabel.textContent = 'アイテム抽選数: '; // ラベル変更 (任意)
        countLabel.style.display = 'inline-block';
        countLabel.style.width = '150px';
        const countValueSpan = document.createElement('span');
        countValueSpan.id = 'count-value';
        countValueSpan.textContent = this.selectedCount.toString();
        countValueSpan.style.display = 'inline-block';
        countValueSpan.style.minWidth = '2em';
        countValueSpan.style.textAlign = 'right';
        countValueSpan.style.marginRight = '10px';
        const countSlider = document.createElement('input');
        countSlider.type = 'range';
        countSlider.id = 'count-slider';
        countSlider.min = '0';
        countSlider.max = '11'; // 最大値確認 (ALL_POSSIBLE_POWERUPS基準)
        countSlider.value = this.selectedCount.toString();
        countSlider.step = '1';
        countSlider.style.width = 'calc(100% - 190px)'; // 要調整
        countSlider.style.verticalAlign = 'middle';
        countDiv.appendChild(countLabel);
        countDiv.appendChild(countValueSpan);
        countDiv.appendChild(countSlider);

        // ドロップ率スライダー
        const rateDiv = document.createElement('div');
        const rateLabel = document.createElement('label');
        rateLabel.htmlFor = 'rate-slider';
        rateLabel.textContent = 'アイテムドロップ率: '; // ラベル変更 (任意)
        rateLabel.style.display = 'inline-block';
        rateLabel.style.width = '150px';
        const rateValueSpan = document.createElement('span');
        rateValueSpan.id = 'rate-value';
        rateValueSpan.textContent = this.selectedRate.toString() + '%';
        rateValueSpan.style.display = 'inline-block';
        rateValueSpan.style.minWidth = '4em';
        rateValueSpan.style.textAlign = 'right';
        rateValueSpan.style.marginRight = '10px';
        const rateSlider = document.createElement('input');
        rateSlider.type = 'range';
        rateSlider.id = 'rate-slider';
        rateSlider.min = '0';
        rateSlider.max = '100';
        rateSlider.value = this.selectedRate.toString();
        rateSlider.step = '10';
        rateSlider.style.width = 'calc(100% - 200px)'; // 要調整
        rateSlider.style.verticalAlign = 'middle';
        rateDiv.appendChild(rateLabel);
        rateDiv.appendChild(rateValueSpan);
        rateDiv.appendChild(rateSlider);

        sliderContainer.appendChild(countDiv);
        sliderContainer.appendChild(rateDiv);

        // DOM要素をPhaserに追加
        const domElement = this.add.dom(w / 2, h * 0.5, sliderContainer).setOrigin(0.5);
        this.domElements.push(domElement); // 破棄用に保持

        // スライダーイベントリスナー
        countSlider.addEventListener('input', (event) => {
            this.selectedCount = parseInt(event.target.value);
            countValueSpan.textContent = this.selectedCount.toString();
        });
        rateSlider.addEventListener('input', (event) => {
            this.selectedRate = parseInt(event.target.value);
            rateValueSpan.textContent = this.selectedRate.toString() + '%';
        });
        // --- ハチャメチャ度設定UI 終了 ---


        // --- ▼ ボスラッシュ開始ボタン ▼ ---
        const startButtonW = 280; // 少し幅広に
        const startButtonH = 70;
        const startButtonX = w / 2;
        const startButtonY = h * 0.75; // 位置調整
        const startButtonRadius = 15;
        const startButtonTextStyle = { fontSize: '32px', fill: '#fff', fontFamily: '"Arial Black", Gadget, sans-serif', shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, stroke: true, fill: true } };
        const startButtonNormalAlpha = 0.8; const startButtonHoverAlpha = 0.95;
        const startButtonNormalColor = 0x4CAF50; // 緑系に変更 (例)
        const startButtonHoverColor = 0x8BC34A; // 明るい緑系 (例)

        // コンテナを使用
        const startButtonContainer = this.add.container(startButtonX, startButtonY);
        const startButtonBg = this.add.graphics();
        startButtonBg.fillStyle(startButtonNormalColor, startButtonNormalAlpha);
        startButtonBg.fillRoundedRect(-startButtonW / 2, -startButtonH / 2, startButtonW, startButtonH, startButtonRadius);
        startButtonContainer.add(startButtonBg);
        const startButtonText = this.add.text(0, 0, 'ボスラッシュ開始', startButtonTextStyle).setOrigin(0.5); // テキスト変更
        startButtonContainer.add(startButtonText);
        startButtonContainer.setSize(startButtonW, startButtonH);
        startButtonContainer.setInteractive({ useHandCursor: true });

        // ホバーエフェクト
        startButtonContainer.on('pointerover', () => {
            startButtonBg.clear();
            startButtonBg.fillStyle(startButtonHoverColor, startButtonHoverAlpha);
            startButtonBg.fillRoundedRect(-startButtonW / 2, -startButtonH / 2, startButtonW, startButtonH, startButtonRadius);
        });
        startButtonContainer.on('pointerout', () => {
            startButtonBg.clear();
            startButtonBg.fillStyle(startButtonNormalColor, startButtonNormalAlpha);
            startButtonBg.fillRoundedRect(-startButtonW / 2, -startButtonH / 2, startButtonW, startButtonH, startButtonRadius);
        });

        // クリック処理 (Boss1Scene開始)
        startButtonContainer.on('pointerdown', () => {
            console.log("Boss Rush Start button clicked.");
            this.sound.play(AUDIO_KEYS.SE_START);
            this.stopTitleBgm();
            this.clearDOM();
            // 引き継ぐデータ (初期ライフとハチャメチャ度)
            const startData = {
                lives: 3, // ★ ボスラッシュ初期ライフ
                chaosSettings: { count: this.selectedCount, ratePercent: this.selectedRate },
                currentBossIndex: 1 // ★ 最初のボス番号
            };
            console.log("Passing data to Boss1Scene:", startData);
            this.scene.start('Boss1Scene', startData); // ★ Boss1Scene を開始
        });
        // --- ▲ ボスラッシュ開始ボタン ▲ ---


        // --- ▼ ボス直行テストボタン (指定ボスシーンを開始) ▼ ---
        const testButtonY = startButtonY + startButtonH + 20; // 開始ボタンの下
        const testButtonStyle = { fontSize: '20px', fill: '#fff', backgroundColor: '#555', padding: { x: 12, y: 6 } }; // 少し小さめに
        const testButtonHoverStyle = { fill: '#ff0', backgroundColor: '#777'};

        // ボタンテキストに開始ボス番号を表示
        const testButtonLabel = `テスト開始: Boss ${this.testStartBossIndex}`;
        const testButtonText = this.add.text(w / 2, testButtonY, testButtonLabel, testButtonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => testButtonText.setStyle(testButtonHoverStyle))
            .on('pointerout', () => testButtonText.setStyle(testButtonStyle))
            .on('pointerdown', () => {
                console.log(`Test Boss ${this.testStartBossIndex} button clicked.`);
                this.sound.play(AUDIO_KEYS.SE_START);
                this.stopTitleBgm();
                this.clearDOM();

                // テスト開始データ
                const testData = {
                    lives: 5, // ★ テスト用にライフ多め
                    chaosSettings: { count: this.selectedCount, ratePercent: this.selectedRate },
                    currentBossIndex: this.testStartBossIndex // ★ テスト対象ボス番号
                };
                // 開始シーンキーを動的に生成
                const targetSceneKey = `Boss${this.testStartBossIndex}Scene`;
                console.log(`Starting ${targetSceneKey} with test data:`, testData);

                // 指定シーンを開始 (存在チェック付き)
                try {
                     if (this.scene.manager.keys[targetSceneKey]) {
                         this.scene.start(targetSceneKey, testData);
                     } else {
                         console.error(`Error: Scene with key '${targetSceneKey}' not found!`);
                         alert(`エラー: シーン '${targetSceneKey}' が見つかりません。\nmain.jsを確認してください。`);
                         this.scene.start('TitleScene'); // タイトルに戻る
                     }
                } catch (e) {
                     console.error(`Error starting scene ${targetSceneKey}:`, e);
                     alert(`シーン '${targetSceneKey}' の開始中にエラー。\n開発者コンソールを確認してください。`);
                     this.scene.start('TitleScene');
                }
            })
            .setVisible(true); // ★ 表示する
        // --- ▲ ボス直行テストボタン ▲ ---


        // --- シーン終了処理 ---
        this.events.on('shutdown', this.shutdownScene, this);

        console.log("TitleScene Create End");
    } // create メソッドの終わり

    playTitleBgm() {
        this.stopTitleBgm(); // 念のため既存のBGMを停止
        console.log("Playing Title BGM (BGM2)");
        // ★ BGMキーを直接指定 or AUDIO_KEYS から取得 ★
        this.currentBgm = this.sound.add(AUDIO_KEYS.BGM2, { loop: true, volume: 0.5 });
        try {
             this.currentBgm.play();
        } catch (e) { console.error("Error playing title BGM:", e); }
    }

    stopTitleBgm() {
        if (this.currentBgm) {
            console.log("Stopping Title BGM");
            try {
                 this.currentBgm.stop();
                 this.sound.remove(this.currentBgm); // キャッシュからも削除
            } catch (e) { console.error("Error stopping title BGM:", e); }
            this.currentBgm = null;
        }
    }

    shutdownScene() {
        console.log("TitleScene shutdown initiated.");
        this.clearDOM(); // DOM要素を削除
        this.stopTitleBgm(); // BGMを停止
        this.events.off('shutdown', this.shutdownScene, this); // イベントリスナー解除
        console.log("TitleScene shutdown complete.");
    }

    clearDOM() {
        console.log("Clearing DOM elements.");
        this.domElements.forEach(element => {
             try { element.destroy(); } catch(e) { console.error("Error destroying DOM element:", e);}
        });
        this.domElements = [];
        // スライダーコンテナが残っている可能性があれば直接削除
        const container = document.getElementById('chaos-slider-container');
        if (container) {
             console.log("Removing slider container element from DOM.");
             container.remove();
        }
    }
} // TitleScene クラスの終わり
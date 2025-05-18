// TitleScene.js
import { AUDIO_KEYS, POWERUP_TYPES, INITIAL_PLAYER_LIVES, TOTAL_BOSSES } from './constants.js'; // TOTAL_BOSSES もインポート

export default class TitleScene extends Phaser.Scene {
     constructor() {
        super('TitleScene');
        this.selectedCount = 6;
        this.selectedRate = 50;
        this.domElements = [];
        this.currentBgm = null;
        this.testStartBossIndex = 4; // 初期値はルシゼロ

        this.testButtonTextObject = null; // ★テストボタンのテキストオブジェクトを保持するプロパティ
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
        this.add.text(w / 2, h * 0.15, 'はちゃめちゃ！\n十二神将会議！\n-ボスラッシュ-', {
            fontSize: `${Math.min(48, w / 10)}px`, // フォントサイズを画面幅にも少し連動
            fontFamily: '"Comic Sans MS", "Chalkduster", "Arial Rounded MT Bold", sans-serif',
            fill: '#FFD700',
            stroke: '#C71585',
            strokeThickness: 6,
            align: 'center',
            shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 6, stroke: true, fill: true }
        }).setOrigin(0.5);

        // --- ハチャメチャ度設定UI (DOM要素) ---
        const sliderContainer = document.createElement('div');
        sliderContainer.id = 'chaos-slider-container';
        sliderContainer.style.width = '80%'; // コンテナの幅を画面の80%に
        sliderContainer.style.maxWidth = '400px'; // 最大幅も設定
        sliderContainer.style.margin = 'auto'; // 中央揃えの試み (DOM要素なのでCSS依存)
        sliderContainer.style.padding = '15px';
        sliderContainer.style.backgroundColor = 'rgba(0,0,0,0.6)';
        sliderContainer.style.borderRadius = '10px';


        const countDiv = document.createElement('div');
        countDiv.style.marginBottom = '15px'; // 少し余白を増やす
        countDiv.style.display = 'flex';      // flexboxで要素を横並び
        countDiv.style.alignItems = 'center'; // 垂直方向中央揃え
        const countLabel = document.createElement('label');
        countLabel.htmlFor = 'count-slider';
        countLabel.textContent = 'アイテム抽選数:';
        countLabel.style.color = 'white';
        countLabel.style.fontSize = '16px';
        countLabel.style.marginRight = '10px';
        countLabel.style.flexShrink = '0'; // ラベルが縮まないように
        const countValueSpan = document.createElement('span');
        countValueSpan.id = 'count-value';
        countValueSpan.textContent = this.selectedCount.toString();
        countValueSpan.style.color = 'white';
        countValueSpan.style.fontSize = '16px';
        countValueSpan.style.minWidth = '2em';
        countValueSpan.style.textAlign = 'right';
        countValueSpan.style.marginRight = '10px';
        const countSlider = document.createElement('input');
        countSlider.type = 'range';
        countSlider.id = 'count-slider';
        countSlider.min = '0';
        const totalPowerUps = Object.keys(POWERUP_TYPES).length;
        countSlider.max = totalPowerUps.toString();
        countSlider.value = this.selectedCount.toString();
        countSlider.step = '1';
        countSlider.style.flexGrow = '1'; // スライダーが残りの幅を埋める
        countSlider.style.width = 'auto'; // width指定を削除してflexに任せる
        countDiv.appendChild(countLabel);
        countDiv.appendChild(countValueSpan);
        countDiv.appendChild(countSlider);

        const rateDiv = document.createElement('div');
        rateDiv.style.display = 'flex';
        rateDiv.style.alignItems = 'center';
        const rateLabel = document.createElement('label');
        rateLabel.htmlFor = 'rate-slider';
        rateLabel.textContent = 'アイテムドロップ率:';
        rateLabel.style.color = 'white';
        rateLabel.style.fontSize = '16px';
        rateLabel.style.marginRight = '10px';
        rateLabel.style.flexShrink = '0';
        const rateValueSpan = document.createElement('span');
        rateValueSpan.id = 'rate-value';
        rateValueSpan.textContent = this.selectedRate.toString() + '%';
        rateValueSpan.style.color = 'white';
        rateValueSpan.style.fontSize = '16px';
        rateValueSpan.style.minWidth = '3.5em'; // 少し調整
        rateValueSpan.style.textAlign = 'right';
        rateValueSpan.style.marginRight = '10px';
        const rateSlider = document.createElement('input');
        rateSlider.type = 'range';
        rateSlider.id = 'rate-slider';
        rateSlider.min = '0';
        rateSlider.max = '100';
        rateSlider.value = this.selectedRate.toString();
        rateSlider.step = '10';
        rateSlider.style.flexGrow = '1';
        rateSlider.style.width = 'auto';
        rateDiv.appendChild(rateLabel);
        rateDiv.appendChild(rateValueSpan);
        rateDiv.appendChild(rateSlider);

        sliderContainer.appendChild(countDiv);
        sliderContainer.appendChild(rateDiv);

        const domSliderElement = this.add.dom(w / 2, h * 0.45, sliderContainer).setOrigin(0.5); // Y位置を少し上げる
        this.domElements.push(domSliderElement);

        countSlider.addEventListener('input', (event) => { /* ... */ });
        rateSlider.addEventListener('input', (event) => { /* ... */ });


        // --- ▼▼▼ ボス選択ドロップダウンリスト ▼▼▼ ---
        const bossSelectContainerHTML = document.createElement('div');
        bossSelectContainerHTML.style.marginTop = '20px'; // スライダーからのマージン
        bossSelectContainerHTML.style.textAlign = 'center';

        const bossSelectLabel = document.createElement('label');
        bossSelectLabel.textContent = 'テスト開始ボス: ';
        bossSelectLabel.style.color = 'white';
        bossSelectLabel.style.fontSize = '18px';
        bossSelectLabel.style.marginRight = '5px';

        const bossSelectDropdown = document.createElement('select');
        bossSelectDropdown.id = 'boss-select-dropdown';
        bossSelectDropdown.style.fontSize = '16px';
        bossSelectDropdown.style.padding = '5px 8px'; // 少しパディング調整
        bossSelectDropdown.style.borderRadius = '3px';

        const bossList = [
            { name: 'Boss 1 (アートマンHL)', value: 1 },
            { name: 'Boss 2 (サンカラ＆ソワカ)', value: 2 },
            { name: 'Boss 3 (キングスライム)', value: 3 },
            { name: 'Boss 4 (ルシゼロ)', value: 4 }
        ];

        bossList.forEach(boss => {
            const option = document.createElement('option');
            option.value = boss.value.toString();
            option.textContent = boss.name;
            if (boss.value === this.testStartBossIndex) {
                option.selected = true;
            }
            bossSelectDropdown.appendChild(option);
        });

        bossSelectDropdown.addEventListener('change', (event) => {
            this.testStartBossIndex = parseInt(event.target.value);
            console.log("Selected Boss Index for Test:", this.testStartBossIndex);
            if (this.testButtonTextObject) { // テストボタンのテキストを更新
                 const selectedBoss = bossList.find(b => b.value === this.testStartBossIndex);
                 this.testButtonTextObject.setText(`テスト: ${selectedBoss ? selectedBoss.name : `Boss ${this.testStartBossIndex}`}`);
            }
        });

        bossSelectContainerHTML.appendChild(bossSelectLabel);
        bossSelectContainerHTML.appendChild(bossSelectDropdown);

        // ドロップダウンのY座標を、スライダーの下に調整
        const dropdownY = domSliderElement.y + domSliderElement.height / 2 + 45; // スライダーの下 + 余白 (要微調整)
        const domBossSelect = this.add.dom(w / 2, dropdownY, bossSelectContainerHTML).setOrigin(0.5);
        this.domElements.push(domBossSelect);
        // --- ▲▲▲ ボス選択ドロップダウンリスト 終了 ▲▲▲ ---


        // --- ▼ ボスラッシュ開始ボタン ▼ ---
        const startButtonW = 280;
        const startButtonH = 70;
        const startButtonRadius = 15;
        const startButtonTextStyle = { /* ... */ };
        // 開始ボタンのY座標を、ドロップダウンやテストボタンとの兼ね合いで調整
        const startButtonY = dropdownY + domBossSelect.height + 100; // ドロップダウンの下 + さらにテストボタン分のスペースと余白 (要微調整)
        const startButtonContainer = this.add.container(w / 2, startButtonY);
        // ... (開始ボタンのグラフィックとテキスト、イベントリスナーは変更なし) ...
         const startButtonBg = this.add.graphics();
        startButtonBg.fillStyle(0x4CAF50, 0.8);
        startButtonBg.fillRoundedRect(-startButtonW / 2, -startButtonH / 2, startButtonW, startButtonH, startButtonRadius);
        startButtonContainer.add(startButtonBg);
        const startButtonText = this.add.text(0, 0, 'ボスラッシュ開始', startButtonTextStyle).setOrigin(0.5);
        startButtonContainer.add(startButtonText);
        startButtonContainer.setSize(startButtonW, startButtonH).setInteractive({ useHandCursor: true });
        startButtonContainer.on('pointerover', () => { /* ... */ });
        startButtonContainer.on('pointerout', () => { /* ... */ });
        startButtonContainer.on('pointerdown', () => { /* ... (既存の処理) ... */ });


        // --- ▼ ボス直行テストボタン (Y座標をドロップダウンの下、開始ボタンの上に調整) ▼ ---
        const testButtonY = dropdownY + domBossSelect.height + 35; // ドロップダウンの下 + 少し余白 (要微調整)
        const testButtonStyle = { fontSize: '20px', fill: '#fff', backgroundColor: 'rgba(85,85,85,0.8)', padding: { x: 15, y: 8 }, borderRadius: '5px' };
        const testButtonHoverStyle = { fill: '#ff0', backgroundColor: 'rgba(119,119,119,0.9)'};

        const initialTestButtonLabel = `テスト: ${bossList.find(b => b.value === this.testStartBossIndex)?.name || `Boss ${this.testStartBossIndex}`}`;
        this.testButtonTextObject = this.add.text(w / 2, testButtonY, initialTestButtonLabel, testButtonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.testButtonTextObject.setStyle(testButtonHoverStyle))
            .on('pointerout', () => this.testButtonTextObject.setStyle(testButtonStyle))
            .on('pointerdown', () => {
                console.log(`Test Boss ${this.testStartBossIndex} button clicked.`);
                this.sound.play(AUDIO_KEYS.SE_START);
                this.stopTitleBgm();
                this.clearDOM(); // DOM要素をクリア

                const testData = {
                    lives: 9,
                    chaosSettings: { count: this.selectedCount, ratePercent: this.selectedRate },
                    currentBossIndex: this.testStartBossIndex
                };
                const targetSceneKey = `Boss${this.testStartBossIndex}Scene`;
                console.log(`Starting ${targetSceneKey} with test data:`, testData);
                try {
                     if (this.scene.manager.keys[targetSceneKey]) {
                         this.scene.start(targetSceneKey, testData);
                     } else {
                         console.error(`Error: Scene '${targetSceneKey}' not found!`);
                         alert(`エラー: シーン '${targetSceneKey}' が見つかりません。\nmain.jsを確認してください。`);
                         this.scene.start('TitleScene');
                     }
                } catch (e) {
                     console.error(`Error starting scene ${targetSceneKey}:`, e);
                     alert(`シーン '${targetSceneKey}' の開始中にエラー。\n開発者コンソールを確認。`);
                     this.scene.start('TitleScene');
                }
            });
        // --- ▲ ボス直行テストボタン ▲ ---


        // --- シーン終了処理 ---
        this.events.on('shutdown', this.shutdownScene, this);

        console.log("TitleScene Create End");
    }

    playTitleBgm() {
        this.stopTitleBgm();
        this.currentBgm = this.sound.add(AUDIO_KEYS.BGM2, { loop: true, volume: 0.5 });
        try { this.currentBgm.play(); } catch (e) { console.error("Error playing title BGM:", e); }
    }

    stopTitleBgm() {
        if (this.currentBgm) {
            try {
                this.currentBgm.stop();
                this.sound.remove(this.currentBgm);
            } catch (e) { console.error("Error stopping title BGM:", e); }
            this.currentBgm = null;
        }
    }

    shutdownScene() {
        console.log("TitleScene shutdown initiated.");
        this.clearDOM();
        this.stopTitleBgm();
        this.events.off('shutdown', this.shutdownScene, this);
        this.testButtonTextObject = null; // ★プロパティもクリア
        console.log("TitleScene shutdown complete.");
    }

    clearDOM() {
        console.log("Clearing DOM elements.");
        this.domElements.forEach(element => {
             try { if(element && element.scene) element.destroy(); } // sceneプロパティ確認
             catch(e) { console.error("Error destroying DOM element:", e);}
        });
        this.domElements = [];
        // HTML要素を直接IDで取得して削除するのは、PhaserのDOM要素として追加した場合、
        // element.destroy() で行われるはずなので、通常は不要。
        // もし残る場合は、PhaserのDOMElementのライフサイクル管理に問題があるか、
        // またはHTMLに直接記述した要素が別にある場合。
        const sliderEl = document.getElementById('chaos-slider-container');
        if(sliderEl) sliderEl.remove();
        // ドロップダウンももし直接IDを振っていたらここで削除
        // const dropdownEl = document.getElementById('boss-select-container-manual-id');
        // if(dropdownEl) dropdownEl.remove();
    }
}
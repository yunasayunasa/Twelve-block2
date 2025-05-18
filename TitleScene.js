// TitleScene.js
import { AUDIO_KEYS, POWERUP_TYPES, INITIAL_PLAYER_LIVES, TOTAL_BOSSES } from './constants.js'; // TOTAL_BOSSES もインポート

export default class TitleScene extends Phaser.Scene {
     constructor() {
        super('TitleScene');
        this.selectedCount = 6;
        this.selectedRate = 50;
        this.domElements = [];
        this.currentBgm = null;
        this.testStartBossIndex = 1; // 初期値はルシゼロ

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
        this.add.text(w / 2, h * 0.15, 'はちゃめちゃ！\n十二神将会議2！\n〜ぼすらっしゅ！〜', {
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

        countSlider.addEventListener('input', (event) => {
            this.selectedCount = parseInt(event.target.value);
            countValueSpan.textContent = this.selectedCount.toString();
            console.log("Selected Count:", this.selectedCount); // ★デバッグログ追加
        });
        rateSlider.addEventListener('input', (event) => {
            this.selectedRate = parseInt(event.target.value);
            rateValueSpan.textContent = this.selectedRate.toString() + '%';
            console.log("Selected Rate:", this.selectedRate); // ★デバッグログ追加
        });

        // --- ▼▼▼ ボス選択ドロップダウンリスト ▼▼▼ ---
        const bossSelectContainerHTML = document.createElement('div');
        bossSelectContainerHTML.style.marginTop = '20px'; // スライダーからのマージン
        bossSelectContainerHTML.style.textAlign = 'center';

        const bossSelectLabel = document.createElement('label');
        bossSelectLabel.textContent = '好きなボスから: ';
        bossSelectLabel.style.color = 'white';
        bossSelectLabel.style.fontSize = '18px';
        bossSelectLabel.style.marginRight = '5px';

        const bossSelectDropdown = document.createElement('select');
        bossSelectDropdown.id = 'boss-select-dropdown';
        bossSelectDropdown.style.fontSize = '16px';
        bossSelectDropdown.style.padding = '5px 8px'; // 少しパディング調整
        bossSelectDropdown.style.borderRadius = '3px';

        const bossList = [
            { name: ' (アートマンHL)', value: 1 },
            { name: ' (サンカラ＆ソワカ)', value: 2 },
            { name: ' (キングスライム)', value: 3 },
            { name: ' (ダークラプチャーゼロ)', value: 4 }
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
                 this.testButtonTextObject.setText(`このボスから: ${selectedBoss ? selectedBoss.name : `Boss ${this.testStartBossIndex}`}`);
            }
        });

        bossSelectContainerHTML.appendChild(bossSelectLabel);
        bossSelectContainerHTML.appendChild(bossSelectDropdown);

        // ドロップダウンのY座標を、スライダーの下に調整
        const dropdownY = domSliderElement.y + domSliderElement.height / 2 + 45; // スライダーの下 + 余白 (要微調整)
        const domBossSelect = this.add.dom(w / 2, dropdownY, bossSelectContainerHTML).setOrigin(0.5);
        this.domElements.push(domBossSelect);
        // --- ▲▲▲ ボス選択ドロップダウンリスト 終了 ▲▲▲ ---


        // --- ▼▼▼ 各ボタンのY座標を明確に定義 ▼▼▼
        // スライダーUIのDOM要素 (domSliderElement) とドロップダウンのDOM要素 (domBossSelect) は生成済みとする
        let currentY = h * 0.45; // スライダーのY座標の目安

        // スライダーの表示 (Y座標は domSliderElement で設定済み)
        // const domSliderElement = this.add.dom(w / 2, currentY, sliderContainer).setOrigin(0.5);
        // this.domElements.push(domSliderElement);
        // currentY += (domSliderElement.height || 100) + 20; // スライダーの高さ分とマージン (仮に高さを100とする)
                                                        // DOM要素の高さ取得が不安定なため固定値か割合で調整推奨
        currentY = h * 0.58; // ドロップダウンのY座標 (固定値や画面比率で調整)

        // ボス選択ドロップダウンリスト (Y座標を設定)
        // const domBossSelect = this.add.dom(w / 2, currentY, bossSelectContainerHTML).setOrigin(0.5);
        // this.domElements.push(domBossSelect);
        // currentY += (domBossSelect.height || 50) + 30; // ドロップダウンの高さ分とマージン (仮に高さを50とする)
        currentY = h * 0.68; // 「このボスと戦う」ボタンのY座標

        // --- ▼ 「選択したボスと戦う」ボタン (元テストボタン) ▼ ---
        const fightSelectedBossButtonY = currentY;
        const fightSelectedBossButtonStyle = { fontSize: '22px', fill: '#E0E0E0', backgroundColor: 'rgba(0,100,200,0.8)', padding: { x: 20, y: 10 }, borderRadius: '5px' }; // 少し目立つスタイルに
        const fightSelectedBossButtonHoverStyle = { fill: '#FFF', backgroundColor: 'rgba(0,120,240,0.9)'};

        const initialFightButtonLabel = `このボスと戦う (${bossList.find(b => b.value === this.testStartBossIndex)?.name || `Boss ${this.testStartBossIndex}`})`;
        this.testButtonTextObject = this.add.text(w / 2, fightSelectedBossButtonY, initialFightButtonLabel, fightSelectedBossButtonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.testButtonTextObject.setStyle(fightSelectedBossButtonHoverStyle))
            .on('pointerout', () => this.testButtonTextObject.setStyle(fightSelectedBossButtonStyle))
            .on('pointerdown', () => {
                // ★★★ ドロップダウンで選択されたボスで開始 ★★★
                console.log(`"Fight Selected Boss" button clicked for Boss ${this.testStartBossIndex}.`);
                this.sound.play(AUDIO_KEYS.SE_START);
                this.stopTitleBgm();
                this.clearDOM();

                const testData = {
                    lives: 9, // 通常の初期ライフでも良い INITIAL_PLAYER_LIVES
                    chaosSettings: { count: this.selectedCount, ratePercent: this.selectedRate },
                    currentBossIndex: this.testStartBossIndex
                };
                const targetSceneKey = `Boss${this.testStartBossIndex}Scene`;
                // ... (シーン開始処理は既存のまま) ...
                try {
                     if (this.scene.manager.keys[targetSceneKey]) {
                         this.scene.start(targetSceneKey, testData);
                     } else { /* ... エラー処理 ... */ }
                } catch (e) { /* ... エラー処理 ... */ }
            });
        // currentY += (this.testButtonTextObject.displayHeight || 40) + 30; // 「このボスと戦う」ボタンの高さ分とマージン
        currentY = h * 0.80; // ボスラッシュ開始ボタンのY座標

        // --- ▼ ボスラッシュ開始ボタン (本来のゲーム開始ボタン) ▼ ---
        const startButtonW = 280;
        const startButtonH = 70;
        const startRushButtonY = currentY; // ★Y座標を明確に設定★
        const startButtonTextStyle = { fontSize: '32px', fill: '#fff', fontFamily: '"Arial Black", Gadget, sans-serif', shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, stroke: true, fill: true } };
        const startButtonContainer = this.add.container(w / 2, startRushButtonY); // ★X座標, Y座標★
        const startButtonBg = this.add.graphics();
        startButtonBg.fillStyle(0x4CAF50, 0.8); // Normal color and alpha
        startButtonBg.fillRoundedRect(-startButtonW / 2, -startButtonH / 2, startButtonW, startButtonH, 15);
        startButtonContainer.add(startButtonBg);
        const startButtonText = this.add.text(0, 0, 'ボスラッシュ開始', startButtonTextStyle).setOrigin(0.5);
        startButtonContainer.add(startButtonText);
        startButtonContainer.setSize(startButtonW, startButtonH);
        startButtonContainer.setInteractive({ useHandCursor: true }); // ★インタラクティブ設定★

        startButtonContainer.on('pointerover', () => {
            startButtonBg.clear().fillStyle(0x8BC34A, 0.95).fillRoundedRect(-startButtonW / 2, -startButtonH / 2, startButtonW, startButtonH, 15);
        });
        startButtonContainer.on('pointerout', () => {
            startButtonBg.clear().fillStyle(0x4CAF50, 0.8).fillRoundedRect(-startButtonW / 2, -startButtonH / 2, startButtonW, startButtonH, 15);
        });

        // ★★★ クリック処理を正しく設定 ★★★
        startButtonContainer.on('pointerdown', () => {
            console.log("Boss Rush Start button clicked.");
            this.sound.play(AUDIO_KEYS.SE_START);
            this.stopTitleBgm();
            this.clearDOM();
            const startData = {
                 lives: INITIAL_PLAYER_LIVES,
                chaosSettings: { count: this.selectedCount, ratePercent: this.selectedRate },
                currentBossIndex: 1 // ボスラッシュは必ずBoss1から
            };
            console.log("Passing data to Boss1Scene for Boss Rush:", startData);
            this.scene.start('Boss1Scene', startData);
        });
        // --- ▲ ボスラッシュ開始ボタン ▲ ---


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
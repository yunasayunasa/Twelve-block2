// TitleScene.js
import { AUDIO_KEYS, POWERUP_TYPES, INITIAL_PLAYER_LIVES, MAX_PLAYER_LIVES as SYSTEM_MAX_LIVES, TOTAL_BOSSES } from './constants.js';

export default class TitleScene extends Phaser.Scene {
     constructor() {
        super('TitleScene');
        this.selectedCount = 6; // アイテム抽選候補数
        this.selectedRate = 50; // アイテムドロップ率
        this.domElements = [];  // DOM要素管理用
        this.currentBgm = null; // BGM管理用

        // 難易度設定
        this.difficultySettings = {
            easy:     { name: "イージー", initialLives: 15, maxLives: 15 },
            normal:   { name: "ノーマル", initialLives: 9,  maxLives: 9  },
            hard:     { name: "ハード",   initialLives: 5,  maxLives: 5  },
            shura:    { name: "修羅",     initialLives: 1,  maxLives: 1  },
           
        };
        this.selectedDifficultyKey = 'normal'; // デフォルト難易度

        // ボス選択用
        this.bossList = [ // ボス選択肢をプロパティとして定義
            { name: 'Stage 1 (アートマンHL)', value: 1 },
            { name: 'Stage 2 (サンカラ＆ソワカ)', value: 2 },
            { name: 'Stage 3 (キングスライム)', value: 3 },
            { name: 'Stage 4 (ダークラプチャーゼロ)', value: 4 }
        ];
        this.selectedBossStartValue = 1; // 初期選択ボス (最初のボス)

        this.selectedBossButtonTextObject = null; // 「このボスから」ボタンのテキストオブジェクト
     }

    create() {
        console.log("TitleScene Create Start");
        const w = this.scale.width;
        const h = this.scale.height;

        // --- 1. 背景 ---
        this.add.image(w / 2, h / 2, 'gameBackground3')
           .setOrigin(0.5, 0.5)
           .setDisplaySize(w, h);

        // --- 2. BGM再生 ---
        this.playTitleBgm();

        // --- 3. タイトルロゴ ---
        this.add.text(w / 2, h * 0.15, 'はちゃめちゃ！\n十二神将会議2！\n〜ぼすらっしゅ！〜', {
            fontSize: `${Math.min(h * 0.06, w / 8)}px`, // 画面サイズに応じたフォントサイズ
            fontFamily: '"Comic Sans MS", "Chalkduster", "Arial Rounded MT Bold", sans-serif',
            fill: '#FFD700', stroke: '#C71585', strokeThickness: 6, align: 'center',
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 4, stroke: true, fill: true }
        }).setOrigin(0.5);

        // --- 4. ハチャメチャ度設定UI (DOM要素) ---
        const sliderContainer = document.createElement('div');
        sliderContainer.id = 'chaos-slider-container';
        sliderContainer.style.width = 'clamp(300px, 80%, 500px)'; // 幅を柔軟に
        sliderContainer.style.margin = '0 auto'; // 水平中央
        sliderContainer.style.padding = '15px';
        sliderContainer.style.backgroundColor = 'rgba(20, 20, 40, 0.75)';
        sliderContainer.style.borderRadius = '12px';
        sliderContainer.style.boxShadow = '0 0 10px rgba(255,255,255,0.2)';

        // アイテム抽選数スライダー
        const countDiv = document.createElement('div');
        countDiv.style.marginBottom = '12px'; countDiv.style.display = 'flex'; countDiv.style.alignItems = 'center';
        const countLabel = document.createElement('label');
        countLabel.textContent = 'アイテム抽選数:'; countLabel.style.color = '#E0E0E0'; countLabel.style.fontSize = '16px'; countLabel.style.marginRight = '8px'; countLabel.style.flexBasis = '140px'; countLabel.style.flexShrink = '0';
        const countValueSpan = document.createElement('span');
        countValueSpan.textContent = this.selectedCount.toString(); countValueSpan.style.color = '#FFF'; countValueSpan.style.fontSize = '16px'; countValueSpan.style.minWidth = '2.5em'; countValueSpan.style.textAlign = 'right'; countValueSpan.style.marginRight = '8px';
        const countSlider = document.createElement('input');
        countSlider.type = 'range'; countSlider.min = '0'; countSlider.max = Object.keys(POWERUP_TYPES).length.toString(); countSlider.value = this.selectedCount.toString(); countSlider.step = '1'; countSlider.style.flexGrow = '1';
        countDiv.appendChild(countLabel); countDiv.appendChild(countValueSpan); countDiv.appendChild(countSlider);
        sliderContainer.appendChild(countDiv);

        // アイテムドロップ率スライダー
        const rateDiv = document.createElement('div');
        rateDiv.style.display = 'flex'; rateDiv.style.alignItems = 'center';
        const rateLabel = document.createElement('label');
        rateLabel.textContent = 'アイテムドロップ率:'; rateLabel.style.color = '#E0E0E0'; rateLabel.style.fontSize = '16px'; rateLabel.style.marginRight = '8px'; rateLabel.style.flexBasis = '140px'; rateLabel.style.flexShrink = '0';
        const rateValueSpan = document.createElement('span');
        rateValueSpan.textContent = this.selectedRate.toString() + '%'; rateValueSpan.style.color = '#FFF'; rateValueSpan.style.fontSize = '16px'; rateValueSpan.style.minWidth = '3.5em'; rateValueSpan.style.textAlign = 'right'; rateValueSpan.style.marginRight = '8px';
        const rateSlider = document.createElement('input');
        rateSlider.type = 'range'; rateSlider.min = '0'; rateSlider.max = '100'; rateSlider.value = this.selectedRate.toString(); rateSlider.step = '10'; rateSlider.style.flexGrow = '1';
        rateDiv.appendChild(rateLabel); rateDiv.appendChild(rateValueSpan); rateDiv.appendChild(rateSlider);
        sliderContainer.appendChild(rateDiv);

        const sliderY = h * 0.40; // Y座標調整
        const domSliderElement = this.add.dom(w / 2, sliderY, sliderContainer).setOrigin(0.5);
        this.domElements.push(domSliderElement);

        countSlider.addEventListener('input', (event) => {
            this.selectedCount = parseInt(event.target.value);
            countValueSpan.textContent = this.selectedCount.toString();
            console.log("Selected Count (Chaos):", this.selectedCount);
        });
        rateSlider.addEventListener('input', (event) => {
            this.selectedRate = parseInt(event.target.value);
            rateValueSpan.textContent = this.selectedRate.toString() + '%';
            console.log("Selected Rate (Chaos):", this.selectedRate);
        });

        // --- 5. 難易度選択ドロップダウンリスト ---
        const difficultySelectContainerHTML = document.createElement('div');
        difficultySelectContainerHTML.style.marginTop = '25px'; // 上からのマージン
        difficultySelectContainerHTML.style.textAlign = 'center';
        const difficultySelectLabel = document.createElement('label');
        difficultySelectLabel.textContent = '難易度: '; difficultySelectLabel.style.color = 'white'; difficultySelectLabel.style.fontSize = '18px'; difficultySelectLabel.style.marginRight = '5px';
        const difficultySelectDropdown = document.createElement('select');
        difficultySelectDropdown.style.fontSize = '16px'; difficultySelectDropdown.style.padding = '6px 10px'; difficultySelectDropdown.style.borderRadius = '4px';
        for (const key in this.difficultySettings) {
            const option = document.createElement('option'); option.value = key; option.textContent = this.difficultySettings[key].name;
            if (key === this.selectedDifficultyKey) option.selected = true;
            difficultySelectDropdown.appendChild(option);
        }
        difficultySelectDropdown.addEventListener('change', (event) => {
            this.selectedDifficultyKey = event.target.value;
            console.log("Selected Difficulty Key:", this.selectedDifficultyKey);
            this.updateSelectedBossButtonText(); // ボタンテキスト更新
        });
        difficultySelectContainerHTML.appendChild(difficultySelectLabel);
        difficultySelectContainerHTML.appendChild(difficultySelectDropdown);
        const difficultyDropdownY = sliderY + 100; // スライダーの下 (固定値で調整)
        const domDifficultySelect = this.add.dom(w / 2, difficultyDropdownY, difficultySelectContainerHTML).setOrigin(0.5);
        this.domElements.push(domDifficultySelect);

        // --- 6. ボス選択ドロップダウンリスト ---
        const bossSelectContainerHTML = document.createElement('div');
        bossSelectContainerHTML.style.marginTop = '15px';
        bossSelectContainerHTML.style.textAlign = 'center';
        const bossSelectLabel = document.createElement('label');
        bossSelectLabel.textContent = '挑戦するボス: '; bossSelectLabel.style.color = 'white'; bossSelectLabel.style.fontSize = '18px'; bossSelectLabel.style.marginRight = '5px';
        const bossSelectDropdown = document.createElement('select');
        bossSelectDropdown.style.fontSize = '16px'; bossSelectDropdown.style.padding = '6px 10px'; bossSelectDropdown.style.borderRadius = '4px';
        this.bossList.forEach(boss => {
            const option = document.createElement('option'); option.value = boss.value.toString(); option.textContent = boss.name;
            if (boss.value === this.selectedBossStartValue) option.selected = true;
            bossSelectDropdown.appendChild(option);
        });
        bossSelectDropdown.addEventListener('change', (event) => {
            this.selectedBossStartValue = parseInt(event.target.value);
            console.log("Selected Boss Start Value:", this.selectedBossStartValue);
            this.updateSelectedBossButtonText(); // ボタンテキスト更新
        });
        bossSelectContainerHTML.appendChild(bossSelectLabel);
        bossSelectContainerHTML.appendChild(bossSelectDropdown);
        const bossDropdownY = difficultyDropdownY + 60; // 難易度選択の下 (固定値で調整)
        const domBossSelect = this.add.dom(w / 2, bossDropdownY, bossSelectContainerHTML).setOrigin(0.5);
        this.domElements.push(domBossSelect);

        // --- 7. 「選択したボスから挑戦」ボタン ---
        const fightSelectedBossButtonY = bossDropdownY + 65; // ボス選択の下 (固定値で調整)
        const fightSelectedBossButtonStyle = { fontSize: '22px', fill: '#E8E8E8', backgroundColor: 'rgba(0, 80, 180, 0.85)', padding: { x: 25, y: 12 }, borderRadius: '8px', align: 'center' };
        const fightSelectedBossButtonHoverStyle = { fill: '#FFFFFF', backgroundColor: 'rgba(0, 100, 220, 1)'};
        this.selectedBossButtonTextObject = this.add.text(w / 2, fightSelectedBossButtonY, "", fightSelectedBossButtonStyle) // 初期テキストはupdateメソッドで設定
            .setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.selectedBossButtonTextObject.setStyle(fightSelectedBossButtonHoverStyle))
            .on('pointerout', () => this.selectedBossButtonTextObject.setStyle(fightSelectedBossButtonStyle))
            .on('pointerdown', () => {
                const selectedDiff = this.difficultySettings[this.selectedDifficultyKey] || this.difficultySettings.normal;
                const startData = {
                    lives: selectedDiff.initialLives,
                    maxLives: selectedDiff.maxLives,
                    chaosSettings: { count: this.selectedCount, ratePercent: this.selectedRate },
                    currentBossIndex: this.selectedBossStartValue
                };
                const targetSceneKey = `Boss${this.selectedBossStartValue}Scene`;
                console.log(`"らっしゅ！" button clicked. Starting ${targetSceneKey} with difficulty ${this.selectedDifficultyKey}`, startData);
                this.sound.play(AUDIO_KEYS.SE_START); this.stopTitleBgm(); this.clearDOM();
                try {
                     if (this.scene.manager.keys[targetSceneKey]) this.scene.start(targetSceneKey, startData);
                     else { console.error(`Scene '${targetSceneKey}' not found!`); alert(`エラー: シーン '${targetSceneKey}' が見つかりません。`); this.scene.start('TitleScene');}
                } catch (e) { console.error(`Error starting scene ${targetSceneKey}:`, e); alert(`シーン '${targetSceneKey}' 開始エラー。`); this.scene.start('TitleScene');}
            });
        this.updateSelectedBossButtonText(); // 初期テキスト設定

        // --- 8. 「最初から挑戦」ボタン (ボスラッシュ開始) ---
        const startRushButtonY = fightSelectedBossButtonY + 85; // 「このボスから」の下 (固定値で調整)
        const startButtonW = 300; const startButtonH = 75; const startButtonRadius = 18;
        const startButtonTextStyle = { fontSize: `${Math.min(32, w/15)}px`, fill: '#fff', fontFamily: '"Arial Black", Gadget, sans-serif', shadow: { offsetX: 2, offsetY: 2, color: '#333', blur: 3, stroke: true, fill: true }};
        const startButtonContainer = this.add.container(w / 2, startRushButtonY);
        const startButtonBg = this.add.graphics();
        startButtonBg.fillStyle(0x388E3C, 0.9).fillRoundedRect(-startButtonW / 2, -startButtonH / 2, startButtonW, startButtonH, startButtonRadius); // 少し濃い緑
        startButtonContainer.add(startButtonBg);
        const startButtonText = this.add.text(0, 0, '最初かららっしゅ！', startButtonTextStyle).setOrigin(0.5);
        startButtonContainer.add(startButtonText);
        startButtonContainer.setSize(startButtonW, startButtonH).setInteractive({ useHandCursor: true });
        startButtonContainer.on('pointerover', () => { startButtonBg.clear().fillStyle(0x66BB6A, 1).fillRoundedRect(-startButtonW / 2, -startButtonH / 2, startButtonW, startButtonH, startButtonRadius); });
        startButtonContainer.on('pointerout', () => { startButtonBg.clear().fillStyle(0x388E3C, 0.9).fillRoundedRect(-startButtonW / 2, -startButtonH / 2, startButtonW, startButtonH, startButtonRadius); });
        startButtonContainer.on('pointerdown', () => {
            const selectedDiff = this.difficultySettings[this.selectedDifficultyKey] || this.difficultySettings.normal;
            const startData = {
                 lives: selectedDiff.initialLives,
                 maxLives: selectedDiff.maxLives,
                chaosSettings: { count: this.selectedCount, ratePercent: this.selectedRate },
                currentBossIndex: 1
            };
            console.log("Boss Rush Start button clicked. Starting Boss1Scene with difficulty " + this.selectedDifficultyKey, startData);
            this.sound.play(AUDIO_KEYS.SE_START); this.stopTitleBgm(); this.clearDOM();
            this.scene.start('Boss1Scene', startData);
        });

        // --- シーン終了処理 ---
        this.events.on('shutdown', this.shutdownScene, this);
        console.log("TitleScene Create End");
    }

    // 「このボスから挑戦」ボタンのテキストを更新するヘルパーメソッド
    updateSelectedBossButtonText() {
        if (this.selectedBossButtonTextObject) {
            const selectedDiffName = this.difficultySettings[this.selectedDifficultyKey]?.name || "ノーマル";
            const selectedBossName = this.bossList.find(b => b.value === this.selectedBossStartValue)?.name || `Boss ${this.selectedBossStartValue}`;
            this.selectedBossButtonTextObject.setText(`【${selectedDiffName}】でらっしゅ\n${selectedBossName} から`);
        }
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
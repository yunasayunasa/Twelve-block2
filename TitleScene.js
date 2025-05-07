import { AUDIO_KEYS } from './constants.js';

export default class TitleScene extends Phaser.Scene {
     constructor() {
        super('TitleScene');
        // デフォルトのハチャメチャ度設定
        this.selectedCount = 4; // 抽選候補数 (0-11)
        this.selectedRate = 50; // ドロップ率 (0-100%)
        this.domElements = []; // DOM要素管理用
        this.currentBgm = null; // BGM管理用
     }

    create() {
        console.log("TitleScene Create Start");
        const w = this.scale.width;
        const h = this.scale.height;
        //this.cameras.main.setBackgroundColor('#222'); // 暗めの背景色
        // --- ▼ 背景画像を gameBackground3 に変更 ▼ ---
       this.add.image(w / 2, h / 2, 'gameBackground3') // キーを 'gameBackground3' に変更
       .setOrigin(0.5, 0.5)
       .setDisplaySize(w, h); // 画面全体に表示 (アスペクト比無視)
       // 必要なら setScale や resizeBackground のような処理を追加
   // --- ▲ 背景画像を gameBackground3 に変更 ▲ ---


        // タイトルBGM再生
        this.playTitleBgm();

        // --- ▼ テキストタイトル表示を修正 ▼ ---
this.add.text(w / 2, h * 0.15, 'はちゃめちゃ！\n十二神将会議！', {
    fontSize: '48px', // 少し大きく？
    // ポップな丸文字系フォント候補 (環境依存)
    fontFamily: '"Comic Sans MS", "Chalkduster", "Arial Rounded MT Bold", sans-serif',
    fill: '#FFD700',      // ゴールドっぽい色 (例)
    stroke: '#C71585',      // 縁取りを濃いピンクに (例)
    strokeThickness: 6,   // 縁取りを太く
    align: 'center',
    shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 6, stroke: true, fill: true } // 影も少し調整
}).setOrigin(0.5);
// --- ▲ テキストタイトル表示を修正 ▲ ---

    // (仮) のテキストは削除またはコメントアウト？ 必要なら残す
    // this.add.text(w / 2, h * 0.25, '(仮)', { /* ... */ }).setOrigin(0.5);
    // --- ▲ テキストタイトル表示を修正 ▲ ---

        // --- ハチャメチャ度設定UI ---
   
        const sliderContainer = document.createElement('div');
    sliderContainer.id = 'chaos-slider-container';
    // CSSでスタイルを設定するので、JSでのスタイル設定は最小限に
    // sliderContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // CSSで設定するので削除可能
    //sliderContainer.style.width = '80%'; // 必要なら残す
   // sliderContainer.style.maxWidth = '400px'; // 必要なら残す
    // sliderContainer.style.color = 'white'; // CSSで設定
    // sliderContainer.style.fontSize = '18px'; // CSSで設定
    // sliderContainer.style.padding = '15px'; // CSSで設定
    // sliderContainer.style.borderRadius = '8px'; // CSSで設定
    // sliderContainer.style.textAlign = 'left'; // CSSで設定

        // 抽選候補数スライダー
        const countDiv = document.createElement('div');
        countDiv.style.marginBottom = '10px';
        const countLabel = document.createElement('label');
        countLabel.htmlFor = 'count-slider';
        countLabel.textContent = 'でてくる神将: ';
        countLabel.style.display = 'inline-block';
        countLabel.style.width = '150px'; // ラベル幅調整
        const countValueSpan = document.createElement('span');
        countValueSpan.id = 'count-value';
        countValueSpan.textContent = this.selectedCount.toString();
        countValueSpan.style.display = 'inline-block';
        countValueSpan.style.minWidth = '2em'; // 幅確保
        countValueSpan.style.textAlign = 'right';
        countValueSpan.style.marginRight = '10px';
        const countSlider = document.createElement('input');
        countSlider.type = 'range';
        countSlider.id = 'count-slider';
        countSlider.min = '0';
        countSlider.max = '11'; // ALL_POSSIBLE_POWERUPSの要素数 - 1 (0から数えるため)
        countSlider.value = this.selectedCount.toString();
        countSlider.step = '1';
        countSlider.style.width = 'calc(100% - 190px)'; // ラベルと数値表示分引く
        countSlider.style.verticalAlign = 'middle';
        countDiv.appendChild(countLabel);
        countDiv.appendChild(countValueSpan);
        countDiv.appendChild(countSlider);

        // ドロップ率スライダー
        const rateDiv = document.createElement('div');
        const rateLabel = document.createElement('label');
        rateLabel.htmlFor = 'rate-slider';
        rateLabel.textContent = 'ドロップ率: ';
        rateLabel.style.display = 'inline-block';
        rateLabel.style.width = '150px'; // ラベル幅調整
        const rateValueSpan = document.createElement('span');
        rateValueSpan.id = 'rate-value';
        rateValueSpan.textContent = this.selectedRate.toString() + '%';
        rateValueSpan.style.display = 'inline-block';
        rateValueSpan.style.minWidth = '4em'; // 幅確保 (例: 100%)
        rateValueSpan.style.textAlign = 'right';
        rateValueSpan.style.marginRight = '10px';
        const rateSlider = document.createElement('input');
        rateSlider.type = 'range';
        rateSlider.id = 'rate-slider';
        rateSlider.min = '0';
        rateSlider.max = '100';
        rateSlider.value = this.selectedRate.toString();
        rateSlider.step = '10';
        rateSlider.style.width = 'calc(100% - 200px)'; // ラベルと数値表示分引く
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

        // --- ▼ ゲーム開始ボタン (インタラクション設定修正) ▼ ---
    const buttonW = 240; const buttonH = 70; const buttonX = w / 2; const buttonY = h * 0.75; const buttonRadius = 15;
    const buttonTextStyle = { fontSize: '36px', fill: '#fff', fontFamily: '"Arial Black", Gadget, sans-serif', shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, stroke: true, fill: true } };
    const buttonNormalAlpha = 0.8; const buttonHoverAlpha = 0.95;
    const buttonNormalColor = 0xff6347; const buttonHoverColor = 0xff8c00;

    // 1. 角丸背景を描画 (Graphicsオブジェクト)
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(buttonNormalColor, buttonNormalAlpha);
    buttonBg.fillRoundedRect(buttonX - buttonW / 2, buttonY - buttonH / 2, buttonW, buttonH, buttonRadius);
    // ★★★ buttonBg.setInteractive() は削除 ★★★

    // 2. テキストを描画 (背景の上に)
    const startButtonText = this.add.text(buttonX, buttonY, 'ゲーム開始', buttonTextStyle).setOrigin(0.5);
    // ★★★ startButtonText をインタラクティブにする ★★★
    startButtonText.setInteractive({ useHandCursor: true }); // テキストにインタラクションを設定
    // ★★★ 当たり判定の形状として背景の矩形を使用 (必要に応じて) ★★★
    // startButtonText.input.hitArea.setTo(buttonX - buttonW / 2, buttonY - buttonH / 2, buttonW, buttonH); // これだと Graphics の形とずれる可能性あり
    // → Graphics の形状を使う場合は setHitArea を使うのが確実 (Phaser 3.60 以降)
    // または、より簡単なのは Graphics を直接使うのではなく、コンテナを使う方法

    // --- ▼ より確実な方法: コンテナを使う ▼ ---
    // 上記の buttonBg と startButtonText の作成を一旦コメントアウトし、以下のように変更

    /*
    // 古いコードをコメントアウト
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(buttonNormalColor, buttonNormalAlpha);
    buttonBg.fillRoundedRect(buttonX - buttonW / 2, buttonY - buttonH / 2, buttonW, buttonH, buttonRadius);
    const startButtonText = this.add.text(buttonX, buttonY, 'ゲーム開始', buttonTextStyle).setOrigin(0.5);
    */

    // コンテナを作成
    const buttonContainer = this.add.container(buttonX, buttonY);

    // コンテナ内に背景 (Graphics) を追加 (座標はコンテナ基準で 0, 0 が中心になるように)
    const buttonBg_cont = this.add.graphics();
    buttonBg_cont.fillStyle(buttonNormalColor, buttonNormalAlpha);
    buttonBg_cont.fillRoundedRect(-buttonW / 2, -buttonH / 2, buttonW, buttonH, buttonRadius);
    buttonContainer.add(buttonBg_cont); // コンテナに追加

    // コンテナ内にテキストを追加 (座標はコンテナ基準で 0, 0)
    const startButtonText_cont = this.add.text(0, 0, 'ゲーム開始', buttonTextStyle).setOrigin(0.5);
    buttonContainer.add(startButtonText_cont); // コンテナに追加

    // コンテナのサイズを設定してインタラクティブにする
    buttonContainer.setSize(buttonW, buttonH); // コンテナ自体のサイズを設定
    buttonContainer.setInteractive({ useHandCursor: true }); // コンテナをインタラクティブに

    console.log("Button container interactive enabled:", buttonContainer.input?.enabled);

    // 3. コンテナに対するインタラクションを設定
    console.log("Adding button container event listeners...");
    buttonContainer.on('pointerover', () => {
        console.log("Button pointerover");
        buttonBg_cont.clear(); // コンテナ内の背景をクリア
        buttonBg_cont.fillStyle(buttonHoverColor, buttonHoverAlpha);
        buttonBg_cont.fillRoundedRect(-buttonW / 2, -buttonH / 2, buttonW, buttonH, buttonRadius);
        // this.input.setDefaultCursor('pointer'); // setInteractive で設定済み
    });
    buttonContainer.on('pointerout', () => {
        console.log("Button pointerout");
        buttonBg_cont.clear();
        buttonBg_cont.fillStyle(buttonNormalColor, buttonNormalAlpha);
        buttonBg_cont.fillRoundedRect(-buttonW / 2, -buttonH / 2, buttonW, buttonH, buttonRadius);
        // this.input.setDefaultCursor('default');
    });
    buttonContainer.on('pointerdown', () => {
        console.log("Start button clicked.");
        this.sound.play(AUDIO_KEYS.SE_START);
        this.stopTitleBgm();
        this.clearDOM();
        const settingsToPass = { count: this.selectedCount, ratePercent: this.selectedRate };
        console.log("Passing settings to GameScene:", settingsToPass);
        this.scene.start('GameScene', { chaosSettings: settingsToPass }); // GameScene を開始
        // ▼▼▼ UIScene 起動時にデータを渡す ▼▼▼
        this.scene.launch('UIScene', { parentSceneKey: 'GameScene' });
        // ▲▲▲ UIScene 起動時にデータを渡す ▲▲▲
    });
    console.log("Button container event listeners added.");
    // --- ▲ ゲーム開始ボタン (コンテナ使用) ▲ ---
     
     // --- ▼ ボス直行テストボタンを追加 ▼ ---
     const testButtonY = buttonY + buttonH + 10; // 開始ボタンの下に配置
     const testButtonStyle = { fontSize: '24px', fill: '#fff', backgroundColor: '#888', padding: { x: 15, y: 8 } };
     const testButtonHoverStyle = { fill: '#ff0', backgroundColor: '#aaa'};

     const testButtonText = this.add.text(w / 2, testButtonY, 'VS:アートマンHL戦', testButtonStyle)
         .setOrigin(0.5)
         .setInteractive({ useHandCursor: true })
         .on('pointerover', () => testButtonText.setStyle(testButtonHoverStyle))
         .on('pointerout', () => testButtonText.setStyle(testButtonStyle))
         .on('pointerdown', () => {
             console.log("Test Boss Battle button clicked.");
             this.sound.play(AUDIO_KEYS.SE_START);
             this.stopTitleBgm();
             this.clearDOM(); // スライダーを消す

             // テスト用の初期値を設定して BossScene を開始
             const testData = {
                 lives: 3, // テスト時のライフ
                 score: 0, // テスト時のスコア
                 chaosSettings: { count: this.selectedCount, ratePercent: this.selectedRate } // カオス設定も引き継ぐ
             };
             
             console.log("Starting BossScene with test data:", testData);
             console.log("Passing settings to BossScene (Test):", testData.chaosSettings); // ★ ログ追加
             this.scene.start('BossScene', testData); // BossSceneへ遷移
             // ★ BossScene 側で UIScene を launch する必要あり ★
             // ここで launch すると BossScene より先に UI が表示されてしまう可能性
             // this.scene.launch('UIScene'); // ← ここでは launch しない
         })
           // ▼▼▼ この行を追加 ▼▼▼
           .setVisible(true); // ★ ボタンを非表示にする
           // --- ▲ ボス直行テストボタンを追加 ▲ ---
         
     // --- ▲ ボス直行テストボタンを追加 ▲ ---


    // シーン終了時の処理を登録
        this.events.on('shutdown', this.shutdownScene, this);

        console.log("TitleScene Create End");
    }

    playTitleBgm() {
        this.stopTitleBgm(); // 念のため既存のBGMを停止
        console.log("Playing Title BGM (BGM2)");
        this.currentBgm = this.sound.add(AUDIO_KEYS.BGM2, { loop: true, volume: 0.5 });
        this.currentBgm.play();
    }

    stopTitleBgm() {
        if (this.currentBgm) {
            console.log("Stopping Title BGM");
            this.currentBgm.stop();
            this.sound.remove(this.currentBgm); // サウンドキャッシュからも削除
            this.currentBgm = null;
        }
    }

    // シーンがシャットダウンする（他のシーンに遷移するなど）時に呼ばれる
    shutdownScene() {
        console.log("TitleScene shutdown initiated.");
        this.clearDOM(); // DOM要素を削除
        this.stopTitleBgm(); // BGMを停止
        this.events.off('shutdown', this.shutdownScene, this); // イベントリスナー解除
        console.log("TitleScene shutdown complete.");
    }

    // DOM要素をクリアする
    clearDOM() {
        console.log("Clearing DOM elements.");
        this.domElements.forEach(element => element.destroy());
        this.domElements = [];
    }
}
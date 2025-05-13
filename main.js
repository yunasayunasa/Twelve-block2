// シーンファイルをインポート
import BootScene from './BootScene.js';
import TitleScene from './TitleScene.js';
import CommonBossScene from './CommonBossScene.js';
import UIScene from './UIScene.js';
import Boss1Scene from './Boss1Scene.js'; // ★ インポート追加
import Boss2Scene from './Boss2Scene.js'; // ★ Boss2Scene をインポート
import Boss3Scene from './Boss3Scene.js'; // 今後追加
// import Boss4Scene from './Boss4Scene.js'; // 今後追加
// import Boss5Scene from './Boss5Scene.js'; // 今後追加

// Phaserゲーム設定
const config = {
    type: Phaser.AUTO, // WebGL優先、不可ならCanvas
    scale: {
        mode: Phaser.Scale.FIT, // アスペクト比を維持してコンテナにフィット
        parent: 'phaser-game-container', // HTML内の描画コンテナID
        autoCenter: Phaser.Scale.CENTER_BOTH, // コンテナ内で中央揃え
         // ▼▼▼ 基準解像度を設定 (例: スマホ縦画面想定) ▼▼▼
         width: 450,
         height: 800,
         // ▲▲▲ 基準解像度を設定 ▲▲▲
    },
    dom: {
        createContainer: true // DOM要素（スライダーなど）を使うために必要
    },
    physics: {
        default: 'arcade', // Arcade Physicsを使用
        arcade: {
            debug: true, // 物理ボディのデバッグ表示 (trueで見えるfalseでみえない)
            gravity: { y: 0 } // 重力は使用しない
        }
    },
    // 使用するシーンのリスト (インポートしたクラスを指定)
    scene: [BootScene, TitleScene, CommonBossScene, UIScene, Boss1Scene,Boss2Scene,//★ シーンリストに追加
         Boss3Scene, // 今後追加
        // Boss4Scene, // 今後追加
        // Boss5Scene  // 今後追加
        ],
    input: {
        activePointers: 3, // 同時に認識するポインター数（マルチタッチ対応）
    },
    render: {
        pixelArt: false, // ピクセルアート調にするか (今回はfalse)
        antialias: true, // アンチエイリアスを有効にするか
    }
};

// --- ゲーム開始 ---
window.onload = () => {
    console.log("Window loaded. Creating Phaser game.");
    try {
        // Phaserゲームインスタンスを作成
        const game = new Phaser.Game(config);
    } catch (e) {
        // 致命的なエラー発生時のフォールバック表示
        console.error("CRITICAL: Failed to initialize Phaser game:", e);
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'ゲームの起動に致命的なエラーが発生しました。開発者コンソールを確認してください。 Error: ' + e.message;
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '20px';
        errorDiv.style.border = '2px solid red';
        document.body.appendChild(errorDiv);
    }
};
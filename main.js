// シーンファイルをインポート
import BootScene from './BootScene.js';
import TitleScene from './TitleScene.js';
import GameScene from './GameScene.js';
import UIScene from './UIScene.js';
import BossScene from './BossScene.js'; // ★ インポート追加
// Phaserゲーム設定
const config = {
    type: Phaser.AUTO, // WebGL優先、不可ならCanvas
    scale: {
        mode: Phaser.Scale.FIT, // アスペクト比を維持してコンテナにフィット
        parent: 'phaser-game-container', // HTML内の描画コンテナID
        autoCenter: Phaser.Scale.CENTER_BOTH, // コンテナ内で中央揃え
        width: '100%', // コンテナの幅に合わせる
        height: '100%' // コンテナの高さに合わせる
    },
    dom: {
        createContainer: true // DOM要素（スライダーなど）を使うために必要
    },
    physics: {
        default: 'arcade', // Arcade Physicsを使用
        arcade: {
            debug: false, // 物理ボディのデバッグ表示 (trueで見える)
            gravity: { y: 0 } // 重力は使用しない
        }
    },
    // 使用するシーンのリスト (インポートしたクラスを指定)
    scene: [BootScene, TitleScene, GameScene, UIScene, BossScene],
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
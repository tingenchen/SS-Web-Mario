const {ccclass, property} = cc._decorator;

@ccclass
export default class LevelSelectController extends cc.Component {

    // 當玩家點擊「第一關」時執行
    onLevel1Clicked () {
        console.log("進入第一關...");
        // 載入我們做好的瑪利歐遊戲場景
        cc.director.loadScene("GameScene");
    }

    // 當玩家點擊「返回」時執行
    onBackClicked () {
        console.log("返回開始畫面...");
        // 返回開始選單
        cc.director.loadScene("StartMenu");
    }
    
    // 如果你有做第二關，可以再加一個 onLevel2Clicked 函數
    onLevel2Clicked () {
        console.log("進入第二關...");
        // cc.director.loadScene("GameScene2");
    }
}
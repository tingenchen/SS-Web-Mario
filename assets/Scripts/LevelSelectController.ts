const {ccclass, property} = cc._decorator;

@ccclass
export default class LevelSelectController extends cc.Component {

    // 綁定教學視窗，用來開啟/關閉它
    @property(cc.Node)
    tutorialPanel: cc.Node = null;

    // 當玩家點擊「？」按鈕時執行
    onQuestionButtonClicked () {
        if (this.tutorialPanel) {
            this.tutorialPanel.active = true; // 顯示教學視窗
        }
    }

    // 當玩家點擊教學視窗上的「關閉」按鈕時執行
    onCloseTutorialClicked () {
        if (this.tutorialPanel) {
            this.tutorialPanel.active = false; // 隱藏教學視窗
        }
    }

    // 進入第一關的按鈕
    onLevel1Clicked () {
        console.log("進入第一關...");
        cc.director.loadScene("GameScene");
    }

    // 返回開始畫面的按鈕
    onBackClicked () {
        console.log("返回開始畫面...");
        cc.director.loadScene("StartMenu");
    }
}
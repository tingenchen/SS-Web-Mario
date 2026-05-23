const {ccclass, property} = cc._decorator;
// 引入 PlayerController 以便控制瑪利歐能不能動
import PlayerController from "./PlayerController"; 

@ccclass
export default class GameManager extends cc.Component {

    public static instance: GameManager = null;

    @property(cc.Label) lifeLabel: cc.Label = null;
    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) timerLabel: cc.Label = null;

    // 🌟 新增：綁定畫面上的 Game Start 和 Game Over 視窗
    @property(cc.Node) gameStartPanel: cc.Node = null;
    @property(cc.Node) gameOverPanel: cc.Node = null;

    // 🌟 新增：綁定瑪利歐，用來在過場時把他的控制權鎖住
    @property(PlayerController) playerCtrl: PlayerController = null;

    private life: number = 3;
    private score: number = 0;
    private timer: number = 300;
    private isPlaying: boolean = false; // 記錄遊戲是否正在進行中

    onLoad () {
        GameManager.instance = this;
        this.updateUI();
        
        // 場景一載入，立刻播放 Game Start 動畫
        this.playGameStartSequence();
    }

    // 播放 Game Start 流程
    playGameStartSequence () {
        this.isPlaying = false;
        
        // 1. 鎖住瑪利歐的控制權
        if (this.playerCtrl) this.playerCtrl.isControllable = false;
        
        // 2. 顯示 Game Start 畫面，隱藏 Game Over 畫面
        if (this.gameStartPanel) this.gameStartPanel.active = true;
        if (this.gameOverPanel) this.gameOverPanel.active = false;

        // 3. 等待 2 秒後，遊戲正式開始！
        this.scheduleOnce(() => {
            if (this.gameStartPanel) this.gameStartPanel.active = false;
            if (this.playerCtrl) this.playerCtrl.isControllable = true;
            this.isPlaying = true;
            console.log("遊戲開始！");
        }, 2.0);
    }

    update (dt) {
        // 只有在遊玩狀態下才倒數時間
        if (this.isPlaying && this.timer > 0) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.timer = 0;
                this.handleTimeUp();
            }
            if (this.timerLabel) {
                this.timerLabel.string = "TIME: " + Math.ceil(this.timer).toString();
            }
        }
    }

    updateUI () {
        if (this.lifeLabel) this.lifeLabel.string = "LIFE: " + this.life;
        if (this.scoreLabel) this.scoreLabel.string = "SCORE: " + this.score;
    }

    public addScore (points: number) {
        this.score += points;
        this.updateUI();
    }

    public decreaseLife () {
        this.life -= 1;
        this.updateUI();

        if (this.life > 0) {
            // 還有命：重置位子，再播一次 Game Start
            if (this.playerCtrl) {
                // 請把這裡的座標換成你的地圖起點座標！
                this.playerCtrl.node.setPosition(cc.v2(-400, -200));
                // 把瑪利歐身上殘留的速度歸零，避免他帶著死掉前的速度亂飛
                this.playerCtrl.getComponent(cc.RigidBody).linearVelocity = cc.v2(0, 0);
            }
            // 重新播放 Game Start 流程
            this.playGameStartSequence();
        } else {
            // 沒命了：Game Over！
            this.gameOver();
        }
    }

    private handleTimeUp () {
        console.log("時間到！");
        this.decreaseLife();
    }

    private gameOver () {
        console.log("Game Over!");
        this.isPlaying = false;
        
        // 1. 鎖住瑪利歐的控制
        if (this.playerCtrl) this.playerCtrl.isControllable = false;
        
        // 2. 顯示 Game Over 畫面
        if (this.gameOverPanel) this.gameOverPanel.active = true;

        // 3. 等待 3 秒後，回到關卡選擇畫面
        this.scheduleOnce(() => {
            cc.director.loadScene("LevelSelect");
        }, 3.0);
    }
}
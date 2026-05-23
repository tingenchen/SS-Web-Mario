const {ccclass, property} = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    public static instance: GameManager = null;

    @property(cc.Label) lifeLabel: cc.Label = null;
    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) timerLabel: cc.Label = null;

    @property(cc.Node) gameStartPanel: cc.Node = null;
    @property(cc.Node) gameOverPanel: cc.Node = null;

    private static globalLife: number = 3;
    private static globalScore: number = 0;

    private timer: number = 300;
    private isPlaying: boolean = false; 
    
    private isResetting: boolean = false; 

    onLoad () {
        GameManager.instance = this;
        this.updateUI();
        this.playGameStartSequence();
    }

    getPlayerCtrl () {
        let playerNode = cc.find("Canvas/Player");
        if (!playerNode) playerNode = cc.find("Player");
        if (playerNode) return playerNode.getComponent("PlayerController");
        return null;
    }

    playGameStartSequence () {
        this.isPlaying = false;
        this.isResetting = false; 
        
        if (this.gameStartPanel) {
            this.gameStartPanel.active = true;
            this.gameStartPanel.zIndex = 999; 
        }
        if (this.gameOverPanel) this.gameOverPanel.active = false;

        this.scheduleOnce(() => {
            let pCtrl = this.getPlayerCtrl();
            if (pCtrl) {
                // @ts-ignore
                pCtrl.isControllable = false;
                // @ts-ignore
                pCtrl.isInvincible = true;
            }
        }, 0);

        this.scheduleOnce(() => {
            if (this.gameStartPanel) this.gameStartPanel.active = false;
            
            let pCtrl2 = this.getPlayerCtrl();
            if (pCtrl2) {
                // @ts-ignore
                pCtrl2.isControllable = true;
                
                this.scheduleOnce(() => {
                    // @ts-ignore
                    pCtrl2.isInvincible = false;
                }, 1.0);
            }
            this.isPlaying = true; 
        }, 2.0);
    }

    update (dt) {
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
        if (this.lifeLabel) this.lifeLabel.string = "LIFE: " + GameManager.globalLife;
        if (this.scoreLabel) this.scoreLabel.string = "SCORE: " + GameManager.globalScore;
    }

    public addScore (points: number) {
        GameManager.globalScore += points;
        this.updateUI();
    }

    public decreaseLife () {
        if (this.isResetting) return; 
        this.isResetting = true;

        GameManager.globalLife -= 1;
        this.updateUI();

        // 🌟 新增：發送全域廣播，要求場上的蘑菇立刻自我毀滅！
        cc.systemEvent.emit("CLEANUP_ITEMS");

        if (GameManager.globalLife > 0) {
            // 🌟 關鍵修復：拿掉原本 0.5 秒的定格延遲！
            // 瞬間重新載入場景，舊場景會直接被抹除，無縫接軌新場景的 Game Start 黑幕。
            let sceneName = cc.director.getScene().name;
            cc.director.loadScene(sceneName);
        } else {
            this.gameOver();
        }
    }

    private handleTimeUp () {
        this.decreaseLife();
    }

    private gameOver () {
        this.isPlaying = false;
        
        let pCtrl = this.getPlayerCtrl();
        if (pCtrl) {
            // @ts-ignore
            pCtrl.isControllable = false;
        }
        
        if (this.gameOverPanel) {
            this.gameOverPanel.active = true;
            this.gameOverPanel.zIndex = 999;
        }

        let physicsManager = cc.director.getPhysicsManager();
        if (physicsManager) physicsManager.enabled = false;

        this.scheduleOnce(() => {
            GameManager.globalLife = 3;
            GameManager.globalScore = 0;
            cc.director.loadScene("LevelSelect");
        }, 3.0);
    }
}
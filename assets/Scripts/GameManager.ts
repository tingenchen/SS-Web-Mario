const {ccclass, property} = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    public static instance: GameManager = null;

    @property(cc.Label) lifeLabel: cc.Label = null;
    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) timerLabel: cc.Label = null;

    @property(cc.Node) gameStartPanel: cc.Node = null;
    @property(cc.Node) gameOverPanel: cc.Node = null;
    
    // 🌟 新增：用來顯示 YOU WIN 或 YOU LOSE 的文字標籤
    @property(cc.Label) resultLabel: cc.Label = null; 

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
                this.timerLabel.string = ": " + Math.ceil(this.timer).toString();
            }
        }
    }

    updateUI () {
        if (this.lifeLabel) this.lifeLabel.string = ": " + GameManager.globalLife;
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

        cc.systemEvent.emit("CLEANUP_ITEMS");

        if (GameManager.globalLife > 0) {
            let sceneName = cc.director.getScene().name;
            cc.director.loadScene(sceneName);
        } else {
            // 命扣光了，傳入 false 代表「失敗」
            this.gameOver(false);
        }
    }

    private handleTimeUp () {
        this.decreaseLife();
    }

    // 🌟 新增：讓終點線呼叫的「勝利」函數
    public winGame () {
        if (!this.isPlaying) return; // 避免重複觸發
        console.log("玩家抵達終點，遊戲勝利！");
        this.gameOver(true); // 傳入 true 代表「勝利」
    }

    // 🌟 修改：接收 isWin 參數，決定要不要上傳分數與顯示什麼字
    private gameOver (isWin: boolean) {
        this.isPlaying = false;
        
        let pCtrl = this.getPlayerCtrl();
        if (pCtrl) {
            // @ts-ignore
            pCtrl.isControllable = false;
        }
        
        // 顯示結算面板，並根據勝負改變文字與顏色
        if (this.gameOverPanel) {
            this.gameOverPanel.active = true;
            this.gameOverPanel.zIndex = 999;
        }
        
        if (this.resultLabel) {
            this.resultLabel.string = isWin ? "YOU\nWIN" : "YOU\nLOSE";
            //this.resultLabel.node.color = isWin ? cc.Color.YELLOW : cc.Color.RED;
        }

        let physicsManager = cc.director.getPhysicsManager();
        if (physicsManager) physicsManager.enabled = false;

        // 🌟 關鍵邏輯：只有「勝利 (isWin == true)」時，才上傳分數
        if (isWin) {
            let firebase = window['firebase'];
            if (firebase && firebase.database && firebase.auth && firebase.auth().currentUser) {
                let email = firebase.auth().currentUser.email;
                let finalScore = GameManager.globalScore;
                let playerName = email.split('@')[0]; 
                
                let timeSpent = 300 - Math.ceil(this.timer);
                
                firebase.database().ref("leaderboard").push({
                    name: playerName,
                    score: finalScore,
                    time: timeSpent,
                    level: 1
                });
                console.log("勝利！分數已上傳:", finalScore, "時間:", timeSpent);
            }
        } else {
            console.log("失敗，不記錄分數。");
        }

        this.scheduleOnce(() => {
            GameManager.globalLife = 3;
            GameManager.globalScore = 0;
            cc.director.loadScene("LevelSelect");
        }, 3.0);
    }
}
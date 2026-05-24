const {ccclass, property} = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    public static instance: GameManager = null;

    @property(cc.Label) lifeLabel: cc.Label = null;
    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) timerLabel: cc.Label = null;

    @property(cc.Node) gameStartPanel: cc.Node = null;
    @property(cc.Node) gameOverPanel: cc.Node = null;
    @property(cc.Label) resultLabel: cc.Label = null; 

    // ==========================================
    // 🌟 聲音資源綁定 (Audio Clips)
    // ==========================================
    @property({ type: cc.AudioClip, tooltip: "背景音樂 (會循環)" })
    bgmClip: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "過關音效" })
    levelClearClip: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "遊戲徹底結束音效" })
    gameOverClip: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "死掉一次的音效" })
    loseLifeClip: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "吃到金幣音效" })
    coinClip: cc.AudioClip = null;

    private static globalLife: number = 3;
    private static globalScore: number = 0;

    private timer: number = 300;
    private isPlaying: boolean = false; 
    private isResetting: boolean = false; 

    // 用來記錄目前正在播放的 BGM ID，方便停止
    private bgmAudioId: number = -1;

    onLoad () {
        GameManager.instance = this;
        
        // 🌟 進入遊戲場景時，立刻停止選單的音樂
        cc.audioEngine.stopMusic();

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

            // 🌟 遊戲正式開始，播放背景音樂 (BGM)
            this.playBGM();

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
        
        // 🌟 吃到金幣時呼叫此函數，播放金幣音效
        if (points === 100 && this.coinClip) { // 假設金幣是 100 分
            cc.audioEngine.playEffect(this.coinClip, false);
        }
    }

    public decreaseLife () {
        if (this.isResetting) return; 
        this.isResetting = true;

        GameManager.globalLife -= 1;
        this.updateUI();

        cc.systemEvent.emit("CLEANUP_ITEMS");

        this.stopBGM(); // 死掉時停掉 BGM

        if (GameManager.globalLife > 0) {
            // 🌟 播放扣命音效
            if (this.loseLifeClip) cc.audioEngine.playEffect(this.loseLifeClip, false);
            
            let sceneName = cc.director.getScene().name;
            cc.director.loadScene(sceneName);
        } else {
            this.gameOver(false);
        }
    }

    private handleTimeUp () {
        this.decreaseLife();
    }

    public winGame () {
        if (!this.isPlaying) return; 
        console.log("玩家抵達終點，遊戲勝利！");
        this.gameOver(true); 
    }

    private gameOver (isWin: boolean) {
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
        
        if (this.resultLabel) {
            this.resultLabel.string = isWin ? "YOU WIN!" : "YOU LOSE!";
            this.resultLabel.node.color = isWin ? cc.Color.YELLOW : cc.Color.RED;
        }

        let physicsManager = cc.director.getPhysicsManager();
        if (physicsManager) physicsManager.enabled = false;

        // 🌟 停掉 BGM 並播放結算音效
        this.stopBGM();
        if (isWin && this.levelClearClip) {
            cc.audioEngine.playEffect(this.levelClearClip, false);
        } else if (!isWin && this.gameOverClip) {
            cc.audioEngine.playEffect(this.gameOverClip, false);
        }

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
        }

        this.scheduleOnce(() => {
            GameManager.globalLife = 3;
            GameManager.globalScore = 0;
            cc.director.loadScene("LevelSelect");
        }, 5.0); // 延長到 5 秒，讓玩家聽完結算音效
    }

    // ==========================================
    // 🌟 音效控制輔助函數
    // ==========================================
    private playBGM () {
        if (this.bgmClip) {
            // playMusic 第二個參數 true 代表要循環播放 (Loop)
            this.bgmAudioId = cc.audioEngine.playMusic(this.bgmClip, true);
        }
    }

    private stopBGM () {
        cc.audioEngine.stopMusic();
    }
}
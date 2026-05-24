const {ccclass, property} = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    public static instance: GameManager = null;

    // 🌟 新增：用來設定當前是第幾關 (Level 1 就設 1, Level 2 就設 2)
    @property(cc.Integer)
    currentLevel: number = 1;

    @property(cc.Label) lifeLabel: cc.Label = null;
    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) timerLabel: cc.Label = null;

    @property(cc.Node) gameStartPanel: cc.Node = null;
    @property(cc.Node) gameOverPanel: cc.Node = null;
    @property(cc.Label) resultLabel: cc.Label = null; 

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

    private bgmAudioId: number = -1;

    onLoad () {
        GameManager.instance = this;
        cc.audioEngine.stopMusic();
        //要刪掉!
        //cc.director.getPhysicsManager().debugDrawFlags = cc.PhysicsManager.DrawBits.e_aabbBit | cc.PhysicsManager.DrawBits.e_shapeBit;
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
        if (points === 100 && this.coinClip) { 
            cc.audioEngine.playEffect(this.coinClip, false);
        }
    }

    public decreaseLife () {
        if (this.isResetting) return; 
        this.isResetting = true;

        GameManager.globalLife -= 1;
        this.updateUI();

        cc.systemEvent.emit("CLEANUP_ITEMS");
        this.stopBGM(); 

        if (GameManager.globalLife > 0) {
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

        this.stopBGM();
        if (isWin && this.levelClearClip) {
            cc.audioEngine.playEffect(this.levelClearClip, false);
        } else if (!isWin && this.gameOverClip) {
            cc.audioEngine.playEffect(this.gameOverClip, false);
        }

        if (isWin) {
            let firebase = window['firebase'];
            if (firebase && firebase.database && firebase.auth && firebase.auth().currentUser) {
                let user = firebase.auth().currentUser;
                let finalScore = GameManager.globalScore;
                let playerName = user.email.split('@')[0]; 
                let timeSpent = 300 - Math.ceil(this.timer);
                
                // 上傳至排行榜
                firebase.database().ref("leaderboard").push({
                    name: playerName,
                    score: finalScore,
                    time: timeSpent,
                    level: this.currentLevel // 🌟 動態記錄是第幾關
                });
                console.log(`勝利！分數已上傳: 關卡 ${this.currentLevel}`);

                // 🌟 記錄玩家解鎖進度 (將下一關解鎖)
                let nextLevel = this.currentLevel + 1;
                let userRef = firebase.database().ref("users/" + user.uid + "/unlockedLevel");
                
                // 檢查雲端紀錄，如果現在的通關進度大於雲端，就更新它
                userRef.once("value").then((snapshot) => {
                    let currentUnlocked = snapshot.val() || 1;
                    if (nextLevel > currentUnlocked) {
                        userRef.set(nextLevel);
                        console.log(`恭喜！已解鎖 Level ${nextLevel}`);
                    }
                });
            }
        }

        this.scheduleOnce(() => {
            GameManager.globalLife = 3;
            GameManager.globalScore = 0;
            cc.director.loadScene("LevelSelect");
        }, 5.0); 
    }

    private playBGM () {
        if (this.bgmClip) {
            this.bgmAudioId = cc.audioEngine.playMusic(this.bgmClip, true);
        }
    }

    private stopBGM () {
        cc.audioEngine.stopMusic();
    }
}
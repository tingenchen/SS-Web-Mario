const {ccclass, property} = cc._decorator;

// 🌟 移除了對 PlayerController 的 import，斬斷循環依賴引發的當機風險！

@ccclass
export default class GameManager extends cc.Component {

    public static instance: GameManager = null;

    @property(cc.Label) lifeLabel: cc.Label = null;
    @property(cc.Label) scoreLabel: cc.Label = null;
    @property(cc.Label) timerLabel: cc.Label = null;

    @property(cc.Node) gameStartPanel: cc.Node = null;
    @property(cc.Node) gameOverPanel: cc.Node = null;

    private life: number = 3;
    private score: number = 0;
    private timer: number = 300;
    private isPlaying: boolean = false; 

    onLoad () {
        GameManager.instance = this;
        this.updateUI();
        this.playGameStartSequence();
    }

    // 🌟 動態尋找玩家腳本，不需要你在 Inspector 裡拖曳！
    getPlayerCtrl () {
        // 🌟 核心修正：因為瑪利歐放在 Canvas 底下，所以路徑必須加上 Canvas/
        let playerNode = cc.find("Canvas/Player");
        
        if (!playerNode) {
            // 如果 Canvas 找不到，試著找最外層當作備用
            playerNode = cc.find("Player");
        }

        if (playerNode) {
            return playerNode.getComponent("PlayerController");
        }
        
        console.error("🚨 嚴重錯誤：GameManager 找不到名叫 Player 的節點！請確認瑪利歐放在 Canvas 底下。");
        return null;
    }

    playGameStartSequence () {
        this.isPlaying = false;
        console.log("🎬 【GameManager】開始播放 Game Start 過場...");
        
        // 1. 顯示黑幕
        if (this.gameStartPanel) {
            this.gameStartPanel.active = true;
        } else {
            console.warn("🚨 警告：找不到 Game Start Panel！");
        }
        if (this.gameOverPanel) this.gameOverPanel.active = false;

        // 2. 傳送瑪利歐並鎖定
        // 🌟 關鍵修復：物理引擎在「發生碰撞的瞬間」會鎖定座標，不允許強行移動物體。
        // 我們利用 scheduleOnce(..., 0) 延遲到下一個影格（物理運算解鎖後），再把玩家抓回起點！
        this.scheduleOnce(() => {
            let pCtrl = this.getPlayerCtrl();
            if (pCtrl) {
                // @ts-ignore
                pCtrl.isControllable = false;
                // @ts-ignore
                pCtrl.isInvincible = true;
                // @ts-ignore
                if (pCtrl.resetPosition) pCtrl.resetPosition();
            } else {
                console.warn("🚨 警告：GameManager 找不到瑪利歐 (Player)！請確認他叫做 Player");
            }
        }, 0);

        // 3. 計時 2 秒後開始遊戲
        this.scheduleOnce(() => {
            console.log("🎮 【GameManager】過場結束，遊戲開始！");
            if (this.gameStartPanel) this.gameStartPanel.active = false;
            
            let pCtrl2 = this.getPlayerCtrl();
            if (pCtrl2) {
                // @ts-ignore
                pCtrl2.isControllable = true;
                
                // 遊戲開始後，再多給 1 秒的無敵保護時間，避免一重生就被怪碰到
                this.scheduleOnce(() => {
                    // @ts-ignore
                    pCtrl2.isInvincible = false;
                    console.log("🛡️ 【GameManager】無敵時間結束！");
                }, 1.0);
            }
            this.isPlaying = true; // 🌟 恢復計時器
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
        if (this.lifeLabel) this.lifeLabel.string = "LIFE: " + this.life;
        if (this.scoreLabel) this.scoreLabel.string = "SCORE: " + this.score;
    }

    public addScore (points: number) {
        this.score += points;
        this.updateUI();
    }

    public decreaseLife () {
        console.log("🩸 【GameManager】執行扣血！目前命數：", this.life - 1);
        this.life -= 1;
        this.updateUI();

        if (this.life > 0) {
            this.playGameStartSequence();
        } else {
            this.gameOver();
        }
    }

    private handleTimeUp () {
        console.log("⏰ 時間到！");
        this.decreaseLife();
    }

    private gameOver () {
        console.log("💀 Game Over!");
        this.isPlaying = false;
        
        let pCtrl = this.getPlayerCtrl();
        if (pCtrl) {
            // @ts-ignore
            pCtrl.isControllable = false;
        }
        
        if (this.gameOverPanel) this.gameOverPanel.active = true;

        this.scheduleOnce(() => {
            cc.director.loadScene("LevelSelect");
        }, 3.0);
    }
}
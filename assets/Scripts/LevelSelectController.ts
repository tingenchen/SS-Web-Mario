const {ccclass, property} = cc._decorator;

@ccclass
export default class LevelSelectController extends cc.Component {

    @property(cc.Node) tutorialPanel: cc.Node = null;
    @property(cc.Node) leaderboardPanel: cc.Node = null;
    @property(cc.Label) leaderboardLabel: cc.Label = null;

    @property({ type: cc.AudioClip, tooltip: "選單背景音樂" })
    menuBgm: cc.AudioClip = null;

    // 🌟 新增：綁定 Level 2 的按鈕
    @property(cc.Button)
    level2Button: cc.Button = null;

    onLoad() {
        if (this.menuBgm && !cc.audioEngine.isMusicPlaying()) {
            cc.audioEngine.playMusic(this.menuBgm, true);
        }

        // 預設將 Level 2 按鈕鎖起來 (變灰且不能按)
        if (this.level2Button) {
            this.level2Button.interactable = false;
        }

        if (typeof window['firebase'] !== 'undefined' && !window['firebase'].database) {
            let scriptDb = document.createElement('script');
            scriptDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
            document.head.appendChild(scriptDb);
            
            scriptDb.onload = () => {
                this.checkLevelUnlock(); // 載入完畢後檢查進度
            };
        } else {
            this.checkLevelUnlock(); // 已經載入過就直接檢查
        }
    }

    // 🌟 新增：去 Firebase 查詢這個玩家解鎖到了第幾關
    checkLevelUnlock() {
        let firebase = window['firebase'];
        if (firebase && firebase.auth && firebase.database) {
            // 監聽玩家是否已登入
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    let userRef = firebase.database().ref("users/" + user.uid + "/unlockedLevel");
                    userRef.once("value").then(snapshot => {
                        let unlockedLevel = snapshot.val() || 1; // 預設至少解鎖第 1 關
                        console.log(`玩家 ${user.email} 目前解鎖至第 ${unlockedLevel} 關`);
                        
                        // 如果進度大於等於 2，就把 Level 2 按鈕解鎖！
                        if (unlockedLevel >= 2 && this.level2Button) {
                            this.level2Button.interactable = true;
                        }
                    });
                } else {
                    // 如果是訪客(未登入)，永遠只能玩第一關
                    console.log("訪客狀態，僅開放第一關。");
                }
            });
        }
    }

    onQuestionButtonClicked () {
        if (this.tutorialPanel) this.tutorialPanel.active = true;
    }

    onCloseTutorialClicked () {
        if (this.tutorialPanel) this.tutorialPanel.active = false;
    }

    // 進入第一關
    onLevel1Clicked () {
        console.log("進入第一關...");
        cc.director.loadScene("GameScene"); // 第一關場景名稱
    }

    // 🌟 新增：進入第二關
    onLevel2Clicked () {
        console.log("進入第二關...");
        cc.director.loadScene("Level2"); // 請確保你第二關的場景命名為 "Level2"
    }

    onBackClicked () {
        cc.director.loadScene("StartMenu");
    }

    onLogoutClicked () {
        let firebase = window['firebase'];
        if (firebase && firebase.auth().currentUser) {
            firebase.auth().signOut().then(() => {
                cc.director.loadScene("StartMenu"); 
            });
        } else {
            cc.director.loadScene("StartMenu");
        }
    }

    onLeaderboardClicked () {
        if (this.leaderboardPanel) this.leaderboardPanel.active = true;
        if (this.leaderboardLabel) this.leaderboardLabel.string = "資料讀取中...\n請稍候";

        let firebase = window['firebase'];
        if (!firebase || !firebase.database) return;

        let db = firebase.database();
        db.ref("leaderboard").orderByChild("score").limitToLast(5).once("value")
            .then((snapshot) => {
                if (!snapshot.exists()) {
                    if (this.leaderboardLabel) this.leaderboardLabel.string = "目前還沒有分數紀錄喔！";
                    return;
                }
                let scores = [];
                snapshot.forEach((child) => { scores.push(child.val()); });
                scores.reverse();

                let displayText = "英雄榜 Top 5\n\n排名 | 玩家 | 關卡 | 時間 | 分數\n----------------------------------------\n";
                for (let i = 0; i < scores.length; i++) {
                    let lvl = scores[i].level || 1; 
                    let timeVal = scores[i].time !== undefined ? scores[i].time : "--";
                    displayText += `  ${i + 1}   | ${scores[i].name} |   ${lvl}   |   ${timeVal}   | ${scores[i].score}\n`;
                }
                if (this.leaderboardLabel) this.leaderboardLabel.string = displayText;
            });
    }

    onCloseLeaderboardClicked () {
        if (this.leaderboardPanel) this.leaderboardPanel.active = false;
    }
}
const {ccclass, property} = cc._decorator;

@ccclass
export default class LevelSelectController extends cc.Component {

    @property(cc.Node) tutorialPanel: cc.Node = null;
    @property(cc.Node) leaderboardPanel: cc.Node = null;
    @property(cc.Label) leaderboardLabel: cc.Label = null;

    @property({ type: cc.AudioClip, tooltip: "選單背景音樂" })
    menuBgm: cc.AudioClip = null;

    @property(cc.Button)
    level2Button: cc.Button = null;

    onLoad() {
        if (this.menuBgm && !cc.audioEngine.isMusicPlaying()) {
            cc.audioEngine.playMusic(this.menuBgm, true);
        }

        if (this.level2Button) {
            this.level2Button.interactable = false;
        }

        if (typeof window['firebase'] !== 'undefined' && !window['firebase'].database) {
            let scriptDb = document.createElement('script');
            scriptDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
            document.head.appendChild(scriptDb);
            
            scriptDb.onload = () => {
                this.checkLevelUnlock(); 
            };
        } else {
            this.checkLevelUnlock(); 
        }
    }

    checkLevelUnlock() {
        let firebase = window['firebase'];
        if (firebase && firebase.auth && firebase.database) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    let userRef = firebase.database().ref("users/" + user.uid + "/unlockedLevel");
                    userRef.once("value").then(snapshot => {
                        let unlockedLevel = snapshot.val() || 1; 
                        console.log(`玩家 ${user.email} 目前解鎖至第 ${unlockedLevel} 關`);
                        
                        if (unlockedLevel >= 2 && this.level2Button) {
                            this.level2Button.interactable = true;
                        }
                    });
                } else {
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

    onLevel1Clicked () {
        console.log("進入第一關...");
        cc.director.loadScene("GameScene"); 
    }

    onLevel2Clicked () {
        console.log("進入第二關...");
        cc.director.loadScene("Level2"); 
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
        
        // 🌟 修改 1：多抓一點資料回來自己排 (抓前 20 筆)
        db.ref("leaderboard").orderByChild("score").limitToLast(20).once("value")
            .then((snapshot) => {
                if (!snapshot.exists()) {
                    if (this.leaderboardLabel) this.leaderboardLabel.string = "目前還沒有分數紀錄喔！";
                    return;
                }
                
                let scores = [];
                snapshot.forEach((child) => { scores.push(child.val()); });

                // 🌟 修改 2：JavaScript 自定義雙重排序 (分數降序 -> 時間升序)
                scores.sort((a, b) => {
                    // 先比分數 (b - a 代表由大到小排)
                    if (b.score !== a.score) {
                        return b.score - a.score;
                    } 
                    // 分數相同時，比時間 (a - b 代表由小到大排，時間越少越前面)
                    else {
                        // 防呆：如果早期測試資料沒有 time，當作 999 秒處理
                        let timeA = a.time !== undefined ? a.time : 999;
                        let timeB = b.time !== undefined ? b.time : 999;
                        return timeA - timeB;
                    }
                });

                // 🌟 修改 3：只切出前 5 名來顯示
                let top5Scores = scores.slice(0, 5);

                let displayText = "英雄榜 Top 5\n\n排名 | 玩家 | 關卡 | 時間 | 分數\n----------------------------------------\n";
                for (let i = 0; i < top5Scores.length; i++) {
                    let lvl = top5Scores[i].level || 1; 
                    let timeVal = top5Scores[i].time !== undefined ? top5Scores[i].time : "--";
                    displayText += `  ${i + 1}   | ${top5Scores[i].name} |   ${lvl}   |   ${timeVal}   | ${top5Scores[i].score}\n`;
                }
                if (this.leaderboardLabel) this.leaderboardLabel.string = displayText;
            });
    }

    onCloseLeaderboardClicked () {
        if (this.leaderboardPanel) this.leaderboardPanel.active = false;
    }
}
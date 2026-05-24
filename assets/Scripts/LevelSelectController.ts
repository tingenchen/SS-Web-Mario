const {ccclass, property} = cc._decorator;

@ccclass
export default class LevelSelectController extends cc.Component {

    @property(cc.Node)
    tutorialPanel: cc.Node = null;

    @property(cc.Node)
    leaderboardPanel: cc.Node = null;

    @property(cc.Label)
    leaderboardLabel: cc.Label = null;

    onLoad() {
        if (typeof window['firebase'] !== 'undefined' && !window['firebase'].database) {
            let scriptDb = document.createElement('script');
            scriptDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
            document.head.appendChild(scriptDb);
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

    onBackClicked () {
        console.log("返回開始畫面...");
        cc.director.loadScene("StartMenu");
    }

    onLogoutClicked () {
        let firebase = window['firebase'];
        if (firebase && firebase.auth().currentUser) {
            firebase.auth().signOut().then(() => {
                console.log("玩家已登出 Firebase，返回主選單");
                cc.director.loadScene("StartMenu"); 
            }).catch((error) => {
                console.error("登出發生錯誤:", error);
                cc.director.loadScene("StartMenu");
            });
        } else {
            console.log("訪客離開，返回主選單");
            cc.director.loadScene("StartMenu");
        }
    }

    // ==========================================
    // 🌟 排行榜功能 (乾淨表格版)
    // ==========================================

    onLeaderboardClicked () {
        if (this.leaderboardPanel) this.leaderboardPanel.active = true;
        if (this.leaderboardLabel) this.leaderboardLabel.string = "資料讀取中...\n請稍候";

        let firebase = window['firebase'];
        
        if (!firebase || !firebase.database) {
            if (this.leaderboardLabel) this.leaderboardLabel.string = "資料庫載入中，請稍後再按一次";
            return;
        }

        let db = firebase.database();
        
        db.ref("leaderboard").orderByChild("score").limitToLast(5).once("value")
            .then((snapshot) => {
                if (!snapshot.exists()) {
                    if (this.leaderboardLabel) this.leaderboardLabel.string = "目前還沒有分數紀錄喔！\n快去挑戰吧！";
                    return;
                }

                let scores = [];
                snapshot.forEach((childSnapshot) => {
                    scores.push(childSnapshot.val());
                });

                scores.reverse();

                // 🌟 更新排版：第一列為說明，加入分隔線，後續只顯示純數值
                let displayText = "英雄榜 Top 5\n\n";
                displayText += "排名 | 玩家 | 關卡 | 時間 | 分數\n";
                displayText += "----------------------------------------\n";
                
                for (let i = 0; i < scores.length; i++) {
                    let lvl = scores[i].level || 1; 
                    let timeVal = scores[i].time !== undefined ? scores[i].time : "--";
                    
                    // 只填入純數據，拿掉表情符號與多餘字母
                    displayText += `  ${i + 1}   | ${scores[i].name} |   ${lvl}   |   ${timeVal}   | ${scores[i].score}\n`;
                }

                if (this.leaderboardLabel) {
                    this.leaderboardLabel.string = displayText;
                }
            })
            .catch((error) => {
                console.error("讀取排行榜失敗:", error);
                if (this.leaderboardLabel) this.leaderboardLabel.string = "讀取失敗，請檢查資料庫權限";
            });
    }

    onCloseLeaderboardClicked () {
        if (this.leaderboardPanel) {
            this.leaderboardPanel.active = false;
        }
    }
}
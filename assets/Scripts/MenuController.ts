const {ccclass, property} = cc._decorator;

@ccclass
export default class MenuController extends cc.Component {

    @property(cc.EditBox)
    emailInput: cc.EditBox = null;

    @property(cc.EditBox)
    passwordInput: cc.EditBox = null;

    @property(cc.Label)
    alertLabel: cc.Label = null;

    // 🌟 新增：綁定選單音樂
    @property({ type: cc.AudioClip, tooltip: "選單背景音樂" })
    menuBgm: cc.AudioClip = null;

    private isFirebaseReady: boolean = false;

    onLoad() {
        // 預設顏色改為黑色
        this.setAlert("正在連線至伺服器...", cc.Color.BLACK);

        // 🌟 播放選單音樂 (如果還沒在播放的話)
        if (this.menuBgm && !cc.audioEngine.isMusicPlaying()) {
            cc.audioEngine.playMusic(this.menuBgm, true);
        }

        this.loadFirebaseScripts();
    }

    loadFirebaseScripts() {
        if (typeof window['firebase'] !== 'undefined') {
            this.initFirebase();
            return;
        }

        let scriptApp = document.createElement('script');
        scriptApp.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
        document.head.appendChild(scriptApp);

        scriptApp.onload = () => {
            let scriptAuth = document.createElement('script');
            scriptAuth.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js";
            document.head.appendChild(scriptAuth);

            scriptAuth.onload = () => {
                this.initFirebase();
            };
        };
    }

    initFirebase() {
        let firebase = window['firebase'];
        if (!firebase.apps.length) {
            const firebaseConfig = {
                apiKey: "AIzaSyAvYObZsq6rwk2fswS8JAKyV8U6-GpknA0",
                authDomain: "mario-9c275.firebaseapp.com",
                databaseURL: "https://mario-9c275-default-rtdb.asia-southeast1.firebasedatabase.app",
                projectId: "mario-9c275",
                storageBucket: "mario-9c275.firebasestorage.app",
                messagingSenderId: "836461475375",
                appId: "1:836461475375:web:a046b8a052a74e4214b8da",
                measurementId: "G-BCXW3WS2E1"
            };
            firebase.initializeApp(firebaseConfig);
        }
        
        this.isFirebaseReady = true;

        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log("偵測到已登入狀態:", user.email);
                // 🌟 改為簡短提示，並使用黑色
                this.setAlert("已登入帳號: " + user.email, cc.Color.BLACK);
                
                if (this.emailInput) this.emailInput.string = user.email;
                if (this.passwordInput) this.passwordInput.string = "********";
            } else {
                this.setAlert("請輸入帳號密碼登入或註冊", cc.Color.BLACK);
            }
        });
    }

    onLoginClicked () {
        if (!this.isFirebaseReady) return;

        let email = this.emailInput.string.trim();
        let password = this.passwordInput.string.trim();
        let firebase = window['firebase'];
        
        if (firebase.auth().currentUser) {
            if (email === firebase.auth().currentUser.email && password === "********") {
                console.log("玩家使用既有狀態進入遊戲");
                this.setAlert("載入中...", cc.Color.BLACK);
                cc.director.loadScene("LoadingScene");
                return;
            } else {
                firebase.auth().signOut();
            }
        }

        if (email === "" || password === "") {
            this.setAlert("請輸入完整的 Email 與密碼！", cc.Color.BLACK);
            return;
        }
        
        this.setAlert("登入中，請稍候...", cc.Color.BLACK);

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                this.setAlert("登入成功！載入中...", cc.Color.BLACK);
                cc.director.loadScene("LoadingScene");
            })
            .catch((error) => {
                let errorMsg = "登入失敗！";
                if (error.code === 'auth/user-not-found') errorMsg = "找不到此帳號，請先註冊。";
                if (error.code === 'auth/wrong-password') errorMsg = "密碼錯誤！";
                if (error.code === 'auth/invalid-email') errorMsg = "Email 格式錯誤！";
                this.setAlert(errorMsg, cc.Color.BLACK);
            });
    }

    onSignUpClicked () {
        if (!this.isFirebaseReady) return;

        let email = this.emailInput.string.trim();
        let password = this.passwordInput.string.trim();
        let firebase = window['firebase'];

        if (firebase.auth().currentUser) firebase.auth().signOut();
        
        if (email === "" || password === "" || password === "********") {
            this.setAlert("請輸入有效的 Email 與新密碼！", cc.Color.BLACK);
            return;
        }

        this.setAlert("註冊中，請稍候...", cc.Color.BLACK);
        
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                this.setAlert("註冊成功！請點擊 Log In 登入。", cc.Color.BLACK);
            })
            .catch((error) => {
                let errorMsg = "註冊失敗！";
                if (error.code === 'auth/email-already-in-use') errorMsg = "此 Email 已被註冊！";
                if (error.code === 'auth/weak-password') errorMsg = "密碼太弱，請至少輸入 6 個字元。";
                if (error.code === 'auth/invalid-email') errorMsg = "Email 格式錯誤！";
                this.setAlert(errorMsg, cc.Color.BLACK);
            });
    }

    onGuestStartClicked () {
        console.log("訪客登入，切換至載入場景...");
        if (typeof window['firebase'] !== 'undefined') {
            window['firebase'].auth().signOut();
        }
        cc.director.loadScene("LoadingScene");
    }

    // 🌟 將預設顏色改為 cc.Color.BLACK
    private setAlert(msg: string, color: cc.Color = cc.Color.BLACK) {
        if (this.alertLabel) {
            this.alertLabel.string = msg;
            this.alertLabel.node.color = color;
        }
    }
}
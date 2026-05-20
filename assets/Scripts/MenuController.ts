const {ccclass, property} = cc._decorator;

@ccclass
export default class MenuController extends cc.Component {

    @property(cc.EditBox)
    emailInput: cc.EditBox = null;

    @property(cc.EditBox)
    passwordInput: cc.EditBox = null;

    onLoginClicked () {
        let email = this.emailInput.string;
        let password = this.passwordInput.string;
        
        if (email === "" || password === "") {
            console.log("請輸入完整的 Email 與密碼！");
            return;
        }
        
        console.log("嘗試登入, Email:", email, "Password:", password);
        // TODO: 之後接 Firebase
        // 登入成功後，切換到「關卡選擇」場景
        cc.director.loadScene("LevelSelect");
    }

    onSignUpClicked () {
        let email = this.emailInput.string;
        let password = this.passwordInput.string;
        
        if (email === "" || password === "") {
            console.log("請輸入完整的 Email 與密碼！");
            return;
        }
        
        console.log("嘗試註冊, Email:", email, "Password:", password);
        // TODO: 之後接 Firebase
        // 註冊成功後，切換到「關卡選擇」場景
        cc.director.loadScene("LevelSelect");
    }

    onGuestStartClicked () {
        console.log("訪客登入，切換至關卡選擇場景...");
        // 原本是 GameScene，現在改成切換到 LevelSelect
        cc.director.loadScene("LevelSelect");
    }
}
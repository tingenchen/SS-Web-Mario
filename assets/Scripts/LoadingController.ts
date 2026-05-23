const {ccclass, property} = cc._decorator;

@ccclass
export default class LoadingController extends cc.Component {

    onLoad () {
        console.log("載入中...");
        
        // 使用 scheduleOnce 來設定一個計時器
        // 2 秒 (2.0) 後，自動切換到 LevelSelect 場景
        this.scheduleOnce(() => {
            cc.director.loadScene("LevelSelect");
        }, 1.0);
    }
}
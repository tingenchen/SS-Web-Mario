const {ccclass, property} = cc._decorator;

@ccclass
export default class CameraController extends cc.Component {

    // 用來綁定我們的瑪利歐角色
    @property(cc.Node)
    player: cc.Node = null;

    // 攝影機最左邊的限制 (預設 0 代表畫面不會捲動到出生點更左邊)
    @property(cc.Integer)
    minX: number = 0; 

    // 攝影機最右邊的限制 (避免看到地圖最右邊外的黑邊)
    // 💡 公式：地圖總寬度 - 960 (Canvas寬度)。假設地圖寬 1600，這裡就是 640。
    @property(cc.Integer)
    maxX: number = 640; 

    update (dt) {
        // 如果沒有綁定玩家，就不執行
        if (!this.player) return;

        // 取得玩家目前的 X 座標
        let targetX = this.player.x;

        // 限制攝影機的移動範圍，避免超出地圖邊界
        if (targetX < this.minX) {
            targetX = this.minX;
        }
        if (targetX > this.maxX) {
            targetX = this.maxX;
        }

        // 讓攝影機平滑跟隨 (原為: this.node.x = targetX)
        // 加上一點延遲插值，畫面看起來會更柔和專業！
        this.node.x = this.node.x + (targetX - this.node.x) * dt * 5;
    }
}
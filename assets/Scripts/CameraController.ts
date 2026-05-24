const {ccclass, property} = cc._decorator;

@ccclass
export default class CameraController extends cc.Component {

    @property(cc.Node)
    player: cc.Node = null;

    @property(cc.Integer)
    minX: number = 0; 

    @property(cc.Integer)
    maxX: number = 2000;

    // 使用 lateUpdate 確保在物理引擎算完瑪利歐位置後，鏡頭才跟上
    lateUpdate (dt) {
        if (!this.player) return;

        let targetX = this.player.x;

        if (targetX < this.minX) targetX = this.minX;
        if (targetX > this.maxX) targetX = this.maxX;

        if (Math.abs(targetX - this.node.x) > 300) {
            this.node.x = targetX;
        } else {
            // 🌟 修正：拿掉 Math.round()！
            // 讓相機跟隨帶有小數點的物理座標，這樣才不會跟瑪利歐產生「相對錯位」而抖動
            this.node.x = this.node.x + (targetX - this.node.x) * dt * 15;
        }
    }
}
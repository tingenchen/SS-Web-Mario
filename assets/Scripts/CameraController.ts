const {ccclass, property} = cc._decorator;

@ccclass
export default class CameraController extends cc.Component {

    @property(cc.Node)
    player: cc.Node = null;

    @property(cc.Integer)
    minX: number = 0; 

    @property(cc.Integer)
    maxX: number = 2000; // 給一個大一點的極限值

    update (dt) {
        if (!this.player) return;

        let targetX = this.player.x;

        if (targetX < this.minX) targetX = this.minX;
        if (targetX > this.maxX) targetX = this.maxX;

        // 🌟 關鍵修改 1：檢查瑪利歐是不是剛「重生」
        // 如果攝影機距離瑪利歐超過 300，代表發生了瞬間移動，攝影機也直接跟過去
        if (Math.abs(targetX - this.node.x) > 300) {
            this.node.x = targetX;
        } else {
            // 🌟 關鍵修改 2：把原本的 5 調大到 15。
            // 這樣既保留了平滑的效果(不會震動)，又不會因為瑪利歐跑太快而落後！
            this.node.x = this.node.x + (targetX - this.node.x) * dt * 15;
        }
    }
}
const {ccclass, property} = cc._decorator;

@ccclass
export default class Coin extends cc.Component {

    @property(cc.Integer)
    scoreValue: number = 100; // 這個金幣值幾分

    // 碰撞發生時觸發
    onBeginContact (contact, selfCollider, otherCollider) {
        // 檢查撞到金幣的是不是名叫 "Player" 的節點
        if (otherCollider.node.name === "Player") {
            console.log("瑪利歐吃到金幣了！+" + this.scoreValue);

            // 1. 尋找 GameManager 並加分
            let canvasNode = cc.find("Canvas");
            if (canvasNode) {
                let gm = canvasNode.getComponent("GameManager");
                if (gm) {
                    // @ts-ignore
                    gm.addScore(this.scoreValue);
                }
            }

            // 2. 銷毀金幣節點 (讓畫面上的金幣消失)
            // 使用 setTimeout 延遲一微秒銷毀，避免在物理運算途中直接刪除節點引發報錯
            setTimeout(() => {
                if (cc.isValid(this.node)) {
                    this.node.destroy();
                }
            }, 0);
        }
    }
}
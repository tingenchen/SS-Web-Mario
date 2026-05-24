const {ccclass, property} = cc._decorator;
import GameManager from "./GameManager";

@ccclass
export default class FinishLine extends cc.Component {

    // 當物理碰撞發生時自動觸發 (需確保物理引擎有開啟 Contact Listener)
    onBeginContact (contact, selfCollider, otherCollider) {
        
        // 確認碰到終點的是不是玩家 (假設玩家節點名稱為 "Player")
        if (otherCollider.node.name === "Player" || otherCollider.node.name.includes("Player")) {
            
            // 關閉終點的碰撞體，避免玩家在終點線上重複摩擦觸發多次勝利
            let collider = this.getComponent(cc.Collider);
            if (collider) collider.enabled = false;

            // 呼叫 GameManager 的勝利函數
            if (GameManager.instance) {
                GameManager.instance.winGame();
            } else {
                console.error("找不到 GameManager.instance！");
            }
        }
    }
}
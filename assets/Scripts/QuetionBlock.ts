const {ccclass, property} = cc._decorator;

@ccclass
export default class QuestionBlock extends cc.Component {

    @property(cc.SpriteFrame)
    emptySprite: cc.SpriteFrame = null; // 頂過之後變成的空方塊圖片

    @property(cc.Prefab)
    itemPrefab: cc.Prefab = null; // 要生成的物品 (例如：蘑菇 Prefab)

    private isHit: boolean = false; // 紀錄是否已經被頂過了

    onBeginContact(contact, selfCollider, otherCollider) {
        // 如果已經被頂過，就不再反應
        if (this.isHit) return;

        let other = otherCollider.node;

        if (other.name === "Player") {
            let playerRb = other.getComponent(cc.RigidBody);
            
            // 🌟 核心判定：判斷瑪利歐是不是「正在往上跳」且「瑪利歐的位置低於方塊」
            if (playerRb && playerRb.linearVelocity.y > 0 && other.y < this.node.y) {
                this.hitBlock();
                
                // 讓瑪利歐撞到方塊後，瞬間失去向上的速度 (模擬頭撞到天花板掉下來)
                let v = playerRb.linearVelocity;
                v.y = 0;
                playerRb.linearVelocity = v;
            }
        }
    }

    hitBlock() {
        this.isHit = true;
        
        // 1. 更換成空方塊的圖片
        let sprite = this.getComponent(cc.Sprite);
        if (sprite && this.emptySprite) {
            sprite.spriteFrame = this.emptySprite;
        }

        // 2. 播放方塊「彈跳一下」的動畫效果 (使用 Tween)
        cc.tween(this.node)
            .by(0.1, { y: 15 })  // 往上彈 15 像素
            .by(0.1, { y: -15 }) // 掉回原位
            .start();

        // 3. 生成蘑菇
        if (this.itemPrefab) {
            let item = cc.instantiate(this.itemPrefab);
            // 將蘑菇生成在方塊的「正上方」 (假設方塊大小為 40，往上加 40 剛好在頭頂)
            item.setPosition(this.node.x, this.node.y + 40);
            
            // 把蘑菇加進場景中 (和方塊放在同一個父節點下)
            this.node.parent.addChild(item);
        }
    }
}
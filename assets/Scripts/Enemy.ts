const {ccclass, property} = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {

    @property(cc.Integer) moveSpeed: number = 100;
    @property(cc.Integer) scoreValue: number = 200;

    private rb: cc.RigidBody = null;
    private direction: number = -1;
    private isDead: boolean = false;
    private lastFlipTime: number = 0;

    onLoad () {
        this.rb = this.getComponent(cc.RigidBody);
    }

    update (dt) {
        if (!this.rb || this.isDead) return;
        
        let velocity = this.rb.linearVelocity;
        velocity.x = this.direction * this.moveSpeed;
        this.rb.linearVelocity = velocity;

        // 根據方向翻轉圖片
        if (this.direction > 0) {
            this.node.scaleX = -Math.abs(this.node.scaleX);
        } else {
            this.node.scaleX = Math.abs(this.node.scaleX);
        }
        
        if (this.node.y < -600) this.node.destroy();
    }

    onBeginContact (contact, selfCollider, otherCollider) {
        if (this.isDead) return;
        let other = otherCollider.node;

        // 🌟 核心修改：只對名為 "InvisibleWall" 的物件執行轉向
        if (other.name === "InvisibleWall") {
            let now = Date.now();
            // 加一個簡單的防呆，避免短時間內重複觸發轉向
            if (now - this.lastFlipTime > 100) {
                this.direction *= -1;
                this.lastFlipTime = now;
            }
            return; // 處理完轉向就離開，不執行下面的玩家邏輯
        }

        // 處理玩家邏輯
        if (other.name === "Player") {
            // 判斷瑪利歐是不是從上方踩下來
            if (other.y > this.node.y + 10) {
                this.die(); 
                
                let playerRb = other.getComponent(cc.RigidBody);
                if (playerRb) {
                    let v = playerRb.linearVelocity;
                    v.y = 500; 
                    playerRb.linearVelocity = v;
                }
                
                let canvasNode = cc.find("Canvas");
                if (canvasNode) {
                    let gm = canvasNode.getComponent("GameManager");
                    // @ts-ignore
                    if (gm) gm.addScore(this.scoreValue);
                }
            } else {
                let playerCtrl = other.getComponent("PlayerController");
                if (playerCtrl) {
                    // @ts-ignore
                    playerCtrl.handleDeath();
                }
            }
        }
    }

    die () {
        this.isDead = true;
        if (this.rb) this.rb.linearVelocity = cc.v2(0, 0);
        // 死亡時把碰撞體關掉，避免死亡後還會擋路
        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) collider.enabled = false;
        
        setTimeout(() => {
            if (cc.isValid(this.node)) this.node.destroy();
        }, 50);
    }
}
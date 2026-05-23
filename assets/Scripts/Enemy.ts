const {ccclass, property} = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {

    @property(cc.Integer) moveSpeed: number = 100;
    @property(cc.Integer) scoreValue: number = 200;

    private rb: cc.RigidBody = null;
    // 🌟 新增：宣告動畫元件
    private anim: cc.Animation = null;
    
    private direction: number = -1;
    private isDead: boolean = false;
    private lastFlipTime: number = 0;

    onLoad () {
        this.rb = this.getComponent(cc.RigidBody);
        // 🌟 取得動畫元件
        this.anim = this.getComponent(cc.Animation);
    }

    start () {
        // 🌟 遊戲一開始，就讓敵人自動播放走路動畫
        if (this.anim) {
            this.anim.play("EnemyWalk");
        }
    }

    update (dt) {
        if (!this.rb || this.isDead) return;
        
        let velocity = this.rb.linearVelocity;
        velocity.x = this.direction * this.moveSpeed;
        this.rb.linearVelocity = velocity;

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

        if (other.name === "InvisibleWall") {
            let now = Date.now();
            if (now - this.lastFlipTime > 100) {
                this.direction *= -1;
                this.lastFlipTime = now;
            }
            return; 
        }

        if (other.name === "Player") {
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
        
        // 死亡時關閉碰撞體，瑪利歐就能直接穿過去不會卡住
        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) collider.enabled = false;
        
        // 🌟 播放死亡動畫 (例如變成扁掉的烏龜/蘑菇)
        if (this.anim) {
            this.anim.play("EnemyDeath");
        }
        
        // 🌟 關鍵修改：將銷毀時間從原本的 50ms 延長到 0.5 秒 (500ms)
        // 這樣「死亡扁掉」的動畫才有時間播完給玩家看，然後才消失！
        // 我們改用 Cocos 內建的 scheduleOnce 比較安全
        this.scheduleOnce(() => {
            if (cc.isValid(this.node)) this.node.destroy();
        }, 0.5); 
    }
}
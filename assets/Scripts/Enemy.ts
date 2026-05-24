const {ccclass, property} = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {

    @property(cc.Integer) moveSpeed: number = 100;
    @property(cc.Integer) scoreValue: number = 200;

    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null;
    
    private direction: number = -1;
    private isDead: boolean = false;
    private lastFlipTime: number = 0;

    onLoad () {
        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);
    }

    start () {
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

        // 1. 如果撞到設定好的隱形牆，翻轉！
        if (other.name === "InvisibleWall") {
            this.flipDirection();
            return; 
        }

        // 2. 如果撞到玩家，執行傷害或被踩死的邏輯
        if (other.name === "Player" || other.name.includes("Player")) {
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
            return;
        }

        // 🌟 3. 關鍵修復：如果是撞到一般的實體牆壁或地板 (Static RigidBody)
        let otherRb = other.getComponent(cc.RigidBody);
        if (otherRb && otherRb.type === cc.RigidBodyType.Static) {
            // 取得碰撞的「法線」(Normal)，用來判斷是撞到側面還是上下
            let normal = contact.getWorldManifold().normal;
            
            // 如果 X 軸的碰撞力道大於 Y 軸，代表是撞到了「側面」的牆壁或水管！
            if (Math.abs(normal.x) > Math.abs(normal.y)) {
                this.flipDirection();
            }
        }
    }

    // 🌟 新增：把翻轉方向獨立成一個輔助函數，避免程式碼重複
    private flipDirection() {
        let now = Date.now();
        // 加上 100ms 的冷卻時間，避免卡在牆角一秒鐘翻轉好幾十次
        if (now - this.lastFlipTime > 100) {
            this.direction *= -1;
            this.lastFlipTime = now;
        }
    }

    die () {
        this.isDead = true;
        if (this.rb) this.rb.linearVelocity = cc.v2(0, 0);
        
        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) collider.enabled = false;
        
        if (this.anim) {
            this.anim.play("EnemyDeath");
        }
        
        this.scheduleOnce(() => {
            if (cc.isValid(this.node)) this.node.destroy();
        }, 0.5); 
    }
}
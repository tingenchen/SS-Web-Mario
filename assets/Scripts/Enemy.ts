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

        if (other.name === "InvisibleWall") {
            this.flipDirection();
            return; 
        }

        if (other.name === "Player" || other.name.includes("Player")) {
            // 判斷玩家是否在敵人上方 (踩踏判定)
            if (other.y > this.node.y + 10) {
                this.die(); 
                
                let playerRb = other.getComponent(cc.RigidBody);
                let playerCtrl = other.getComponent("PlayerController"); // 🌟 取得玩家控制器

                // 讓玩家彈跳
                if (playerRb) {
                    let v = playerRb.linearVelocity;
                    v.y = 500; 
                    playerRb.linearVelocity = v;
                }
                
                // 🌟 呼叫播放踩踏音效
                if (playerCtrl) {
                    // @ts-ignore
                    playerCtrl.playStompSound();
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

        let otherRb = other.getComponent(cc.RigidBody);
        if (otherRb && otherRb.type === cc.RigidBodyType.Static) {
            let normal = contact.getWorldManifold().normal;
            if (Math.abs(normal.x) > Math.abs(normal.y)) {
                this.flipDirection();
            }
        }
    }

    private flipDirection() {
        let now = Date.now();
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
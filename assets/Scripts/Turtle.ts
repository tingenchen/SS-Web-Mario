const {ccclass, property} = cc._decorator;

// 🌟 定義烏龜的三種狀態
enum TurtleState {
    WALK,       // 正常走路
    SHELL_IDLE, // 靜止龜殼
    SHELL_MOVE  // 高速滑行龜殼
}

@ccclass
export default class Turtle extends cc.Component {

    @property(cc.Integer) walkSpeed: number = 100;    
    @property(cc.Integer) shellSpeed: number = 400;   
    @property(cc.Integer) scoreValue: number = 200;   
    
    @property(cc.SpriteFrame)
    shellSprite: cc.SpriteFrame = null; 

    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null;
    private sprite: cc.Sprite = null;
    
    private direction: number = -1;
    private state: TurtleState = TurtleState.WALK;
    private lastFlipTime: number = 0;
    
    private kickCooldown: boolean = false; 

    onLoad () {
        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);
        this.sprite = this.getComponent(cc.Sprite);

        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) {
            collider.friction = 0;
            collider.apply();
        }
    }

    start () {
        if (this.anim) this.anim.play("TurtleWalk");
    }

    update (dt) {
        if (!this.rb) return;
        
        let velocity = this.rb.linearVelocity;

        if (this.state === TurtleState.WALK) {
            velocity.x = this.direction * this.walkSpeed;
            this.node.scaleX = (this.direction > 0) ? -Math.abs(this.node.scaleX) : Math.abs(this.node.scaleX);
        } else if (this.state === TurtleState.SHELL_IDLE) {
            velocity.x = 0; 
        } else if (this.state === TurtleState.SHELL_MOVE) {
            velocity.x = this.direction * this.shellSpeed; 
            
            // 🌟 核心解法：當處於滑行狀態時，每幀手動掃描並輾死敵人！
            this.checkKillEnemies();
        }

        this.rb.linearVelocity = velocity;
        
        if (this.node.y < -600) this.node.destroy();
    }

    // 🌟 新增：手動偵測並擊殺敵人 (AABB 矩形碰撞檢查)
    checkKillEnemies() {
        // 取得龜殼目前的「世界座標碰撞框」
        let myBox = this.node.getBoundingBoxToWorld();
        
        // 取得場景上同階層的所有節點 (敵人們通常都在同一個父節點下)
        let siblings = this.node.parent.children;
        
        for (let i = 0; i < siblings.length; i++) {
            let other = siblings[i];
            
            // 略過自己，以及被隱藏/銷毀的節點
            if (other === this.node || !other.active) continue;
            
            let enemyCtrl = other.getComponent("Enemy");
            let turtleCtrl = other.getComponent("Turtle");
            
            // 只要對方身上有敵人腳本，或是名字叫做敵人
            if (enemyCtrl || turtleCtrl || other.name.includes("Enemy") || other.name.includes("Turtle")) {
                let otherBox = other.getBoundingBoxToWorld();
                
                // 💥 如果雙方的框框重疊了！代表撞到了！
                if (myBox.intersects(otherBox)) {
                    // 防呆：如果對方正在翻肚死亡中 (scaleY 為 -1)，就忽略他
                    if (other.scaleY === -1) continue; 

                    console.log("💥 【龜殼】無視物理群組，手動輾死敵人：", other.name);
                    
                    if (enemyCtrl) {
                        // @ts-ignore
                        enemyCtrl.die();
                    } else if (turtleCtrl) {
                        turtleCtrl.die();
                    } else {
                        other.destroy();
                    }
                }
            }
        }
    }

    // 🌟 關鍵修復：物理穿透機制！
    // 讓滑行的龜殼可以直接無視對方的剛體撞過去，才不會因為互相推擠而無法擊殺
    onPreSolve (contact, selfCollider, otherCollider) {
        let other = otherCollider.node;

        if (other.name === "InvisibleWall") {
            contact.disabled = true;
            return;
        }

        if (this.state === TurtleState.SHELL_MOVE) {
            let enemyCtrl = other.getComponent("Enemy");
            let turtleCtrl = other.getComponent("Turtle");
            // 如果撞到的是敵人，直接取消物理推擠，準備秒殺他
            if (enemyCtrl || (turtleCtrl && turtleCtrl !== this) || other.name.includes("Enemy")) {
                contact.disabled = true;
            }
        }
    }

    onBeginContact (contact, selfCollider, otherCollider) {
        let other = otherCollider.node;

        if (other.name === "InvisibleWall") {
            if (this.state !== TurtleState.SHELL_IDLE) {
                let now = Date.now();
                if (now - this.lastFlipTime > 100) {
                    this.direction *= -1;
                    this.lastFlipTime = now;
                }
            }
            return; 
        }

        if (other.name === "Player") {
            let playerCtrl = other.getComponent("PlayerController");
            if (playerCtrl && playerCtrl.isInvincible) return; 

            let playerRb = other.getComponent(cc.RigidBody);

            if (this.state === TurtleState.WALK) {
                if (other.y > this.node.y + 10) {
                    this.becomeShell();
                    this.bouncePlayer(playerRb);
                    this.addScore();
                } else {
                    if (playerCtrl) playerCtrl.handleDeath();
                }
            } 
            else if (this.state === TurtleState.SHELL_IDLE) {
                this.state = TurtleState.SHELL_MOVE;
                this.direction = (other.x < this.node.x) ? 1 : -1;
                
                this.kickCooldown = true;
                setTimeout(() => { this.kickCooldown = false; }, 200);

                // 🌟 新增：播放龜殼滑行的動畫
                if (this.anim) {
                    this.anim.play("TurtleShellMove");
                }

                this.node.x += this.direction * 5;
            } 
            else if (this.state === TurtleState.SHELL_MOVE) {
                if (this.kickCooldown) return; 

                if (other.y > this.node.y + 10) {
                    this.state = TurtleState.SHELL_IDLE;
                    this.bouncePlayer(playerRb);
                    this.becomeShell(); // 踩停時，變回靜止的龜殼
                } else {
                    if (playerCtrl) playerCtrl.handleDeath();
                }
            }
        } 
        else {
            if (this.state === TurtleState.SHELL_MOVE) {
                let isEnemy = false;

                // 嘗試用元件尋找並殺死
                let enemyCtrl = other.getComponent("Enemy");
                if (enemyCtrl) {
                    enemyCtrl.die(); 
                    isEnemy = true;
                }

                let turtleCtrl = other.getComponent("Turtle");
                if (turtleCtrl && turtleCtrl !== this) {
                    turtleCtrl.die(); 
                    isEnemy = true;
                }

                // 🌟 終極防呆：就算腳本抓不到，只要節點名字有 Enemy 或 Turtle，強制抹殺！
                if (!isEnemy && (other.name.includes("Enemy") || other.name.includes("Turtle"))) {
                    console.log("【龜殼】強制輾死敵人：", other.name);
                    other.destroy();
                }
            }

            let otherRb = other.getComponent(cc.RigidBody);
            if (otherRb && otherRb.type === cc.RigidBodyType.Static) {
                let normal = contact.getWorldManifold().normal;
                if (Math.abs(normal.x) > Math.abs(normal.y)) {
                    let now = Date.now();
                    if (now - this.lastFlipTime > 100) {
                        this.direction *= -1;
                        this.lastFlipTime = now;
                    }
                }
            }
        }
    }

    becomeShell() {
        this.state = TurtleState.SHELL_IDLE;
        if (this.anim) this.anim.stop(); 
        
        if (this.sprite && this.shellSprite) {
            this.sprite.spriteFrame = this.shellSprite;
        }
    }

    bouncePlayer(playerRb) {
        if (playerRb) {
            let v = playerRb.linearVelocity;
            v.y = 500;
            playerRb.linearVelocity = v;
        }
    }

    addScore() {
        let canvasNode = cc.find("Canvas");
        if (canvasNode) {
            let gm = canvasNode.getComponent("GameManager");
            // @ts-ignore
            if (gm) gm.addScore(this.scoreValue);
        }
    }

    die () {
        if (this.rb) this.rb.linearVelocity = cc.v2(0, 0);
        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) collider.enabled = false;
        
        this.node.scaleY = -1; 
        
        this.scheduleOnce(() => {
            if (cc.isValid(this.node)) this.node.destroy();
        }, 0.5);
    }
}
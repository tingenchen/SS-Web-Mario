const {ccclass, property} = cc._decorator;

enum TurtleState {
    WALK,       
    SHELL_IDLE, 
    SHELL_MOVE, 
    DEAD        
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

        if (this.state === TurtleState.DEAD) {
            if (this.node.y < -600) this.node.destroy(); 
            return;
        }
        
        let velocity = this.rb.linearVelocity;

        if (this.state === TurtleState.WALK) {
            velocity.x = this.direction * this.walkSpeed;
            this.node.scaleX = (this.direction > 0) ? -Math.abs(this.node.scaleX) : Math.abs(this.node.scaleX);
        } else if (this.state === TurtleState.SHELL_IDLE) {
            velocity.x = 0; 
        } else if (this.state === TurtleState.SHELL_MOVE) {
            velocity.x = this.direction * this.shellSpeed; 
            
            this.checkKillEnemies();
        }

        this.rb.linearVelocity = velocity;
        
        if (this.node.y < -600) this.node.destroy();
    }

    checkKillEnemies() {
        let myBox = this.node.getBoundingBoxToWorld();
        let siblings = this.node.parent.children;
        
        for (let i = 0; i < siblings.length; i++) {
            let other = siblings[i];
            
            if (other === this.node || !other.active) continue;
            
            let enemyCtrl = other.getComponent("Enemy");
            let turtleCtrl = other.getComponent("Turtle");
            
            if (enemyCtrl || turtleCtrl || other.name.includes("Enemy") || other.name.includes("Turtle")) {
                let otherBox = other.getBoundingBoxToWorld();
                
                if (myBox.intersects(otherBox)) {
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

    onPreSolve (contact, selfCollider, otherCollider) {
        let other = otherCollider.node;

        if (other.name === "InvisibleWall") {
            contact.disabled = true;
            return;
        }

        if (this.state === TurtleState.SHELL_MOVE) {
            let enemyCtrl = other.getComponent("Enemy");
            let turtleCtrl = other.getComponent("Turtle");
            if (enemyCtrl || (turtleCtrl && turtleCtrl !== this) || other.name.includes("Enemy")) {
                contact.disabled = true;
            }
        }
    }

    onBeginContact (contact, selfCollider, otherCollider) {
        let other = otherCollider.node;

        if (other.name === "InvisibleWall") {
            if (this.state !== TurtleState.SHELL_IDLE && this.state !== TurtleState.DEAD) {
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

                    // 🌟 呼叫播放踩踏音效 (踩成龜殼)
                    if (playerCtrl) {
                        // @ts-ignore
                        playerCtrl.playStompSound();
                    }
                } else {
                    if (playerCtrl) playerCtrl.handleDeath();
                }
            } 
            else if (this.state === TurtleState.SHELL_IDLE) {
                this.state = TurtleState.SHELL_MOVE;
                this.direction = (other.x < this.node.x) ? 1 : -1;
                
                this.kickCooldown = true;
                setTimeout(() => { this.kickCooldown = false; }, 200);

                if (this.anim) {
                    this.anim.play("TurtleShellMove");
                }

                // 🌟 (選擇性) 如果你有踢龜殼的特別音效，可以加在這裡。這裡暫時不加，保留原本手感。
                this.node.x += this.direction * 5;
            } 
            else if (this.state === TurtleState.SHELL_MOVE) {
                if (this.kickCooldown) return; 

                if (other.y > this.node.y + 10) {
                    this.state = TurtleState.SHELL_IDLE;
                    this.bouncePlayer(playerRb);
                    this.becomeShell(); 

                    // 🌟 呼叫播放踩踏音效 (踩停龜殼)
                    if (playerCtrl) {
                        // @ts-ignore
                        playerCtrl.playStompSound();
                    }
                } else {
                    if (playerCtrl) playerCtrl.handleDeath();
                }
            }
        } 
        else {
            if (this.state === TurtleState.SHELL_MOVE) {
                let isEnemy = false;

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
        if (this.state === TurtleState.DEAD) return; 
        this.state = TurtleState.DEAD; 

        if (this.anim) this.anim.stop(); 
        
        if (this.sprite && this.shellSprite) {
            this.sprite.spriteFrame = this.shellSprite;
        }

        this.node.scaleY = -1; 
        
        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) collider.enabled = false; 
        
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, 500); 
        }
    }
}
const {ccclass, property} = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    @property(cc.Integer) moveSpeed: number = 200; 
    @property(cc.Integer) jumpForce: number = 600;
    @property(cc.SpriteFrame) idleSprite: cc.SpriteFrame = null;
    @property(cc.Vec2) spawnPos: cc.Vec2 = cc.v2(-400, -200);

    public isControllable: boolean = true; 
    public isInvincible: boolean = false; 

    // 🌟 記錄狀態：是否是超級瑪利歐，以及預設縮放大小
    public isSuper: boolean = false;
    private baseScale: number = 1.0; 

    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null;
    private sprite: cc.Sprite = null; 
    
    private isMovingLeft: boolean = false;
    private isMovingRight: boolean = false;
    private isGrounded: boolean = false;
    private currentAnim: string = "";

    onLoad () {
        let physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.gravity = cc.v2(0, -980);

        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);
        this.sprite = this.getComponent(cc.Sprite);

        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) {
            collider.friction = 0;
            collider.apply();
        }

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    start () {
        if (this.rb) this.rb.awake = true;
    }

    onDestroy () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown (event) {
        if (!this.isControllable) return; 
        switch(event.keyCode) {
            case cc.macro.KEY.a: case cc.macro.KEY.left: this.isMovingLeft = true; break;
            case cc.macro.KEY.d: case cc.macro.KEY.right: this.isMovingRight = true; break;
            case cc.macro.KEY.w: case cc.macro.KEY.up: case cc.macro.KEY.space: this.jump(); break;
        }
    }

    onKeyUp (event) {
        if (!this.isControllable) return;
        switch(event.keyCode) {
            case cc.macro.KEY.a: case cc.macro.KEY.left: this.isMovingLeft = false; break;
            case cc.macro.KEY.d: case cc.macro.KEY.right: this.isMovingRight = false; break;
        }
    }

    jump () {
        if (this.isGrounded && this.rb) {
            let velocity = this.rb.linearVelocity;
            velocity.y = this.jumpForce;
            this.rb.linearVelocity = velocity;
            this.isGrounded = false;
            this.playAnimation("PlayerJump");
        }
    }

    onBeginContact (contact, selfCollider, otherCollider) {
        if (otherCollider.node.name === "InvisibleWall") return; 
        this.isGrounded = true;
    }

    onPreSolve (contact, selfCollider, otherCollider) {
        if (otherCollider.node.name === "InvisibleWall") {
            contact.disabled = true; 
        }
    }

    update (dt) {
        if (!this.rb) return;

        let velocity = this.rb.linearVelocity;

        if (!this.isControllable) {
            velocity.x = 0;
            this.rb.linearVelocity = velocity;
            this.isMovingLeft = false;
            this.isMovingRight = false;
            // 🌟 如果掉出地圖，強制死亡 (不管是不是超大瑪利歐)
            if (this.node.y < -500) this.handleDeath(true);
            this.resetToIdle();
            return;
        }

        // 🌟 修正縮放邏輯，套用 baseScale (才能讓瑪利歐變大)
        if (this.isMovingLeft) {
            velocity.x = -this.moveSpeed;
            this.node.scaleX = -this.baseScale;
        } else if (this.isMovingRight) {
            velocity.x = this.moveSpeed;
            this.node.scaleX = this.baseScale;
        } else {
            velocity.x = 0;
            this.node.scaleX = Math.sign(this.node.scaleX) * this.baseScale;
        }
        this.node.scaleY = this.baseScale;

        this.rb.linearVelocity = velocity;

        if (!this.isGrounded) {
            this.playAnimation("PlayerJump");
        } 
        else if (this.isMovingLeft || this.isMovingRight) {
            this.playAnimation("PlayerWalk");
        } 
        else {
            this.resetToIdle();
        }

        if (this.node.y < -500) this.handleDeath(true);
    }

    playAnimation(animName: string) {
        if (this.anim && this.currentAnim !== animName) {
            this.anim.play(animName);
            this.currentAnim = animName;
        }
    }

    resetToIdle() {
        if (this.currentAnim !== "Idle") {
            if (this.anim) this.anim.stop(); 
            if (this.sprite && this.idleSprite) {
                this.sprite.spriteFrame = this.idleSprite;
            }
            this.currentAnim = "Idle";
        }
    }

    resetPosition() {
        this.node.setPosition(this.spawnPos);
        if (this.rb) this.rb.linearVelocity = cc.v2(0, 0);
        
        // 🌟 重生時變回小瑪利歐
        this.isSuper = false;
        this.baseScale = 1.0;
    }

    // 🌟 新增：吃蘑菇變大
    grow() {
        if (this.isSuper) return; // 已經是大的就不再變大
        
        console.log("🍄 吃到蘑菇了！變大！");
        this.isSuper = true;
        this.baseScale = 1.5; // 放大 1.5 倍
        
        let canvasNode = cc.find("Canvas");
        if (canvasNode) {
            let gm = canvasNode.getComponent("GameManager");
            // @ts-ignore
            if (gm) gm.addScore(1000);
        }
    }

    // 🌟 更新死亡邏輯：加入 forceKill 參數，以及變小保護機制
    handleDeath (forceKill: boolean = false) {
        // 如果已經無敵，且不是強制死亡(掉進深淵)，就忽略
        if (this.isInvincible && !forceKill) return;

        // 如果是超級瑪利歐，且沒有掉進深淵 -> 縮小並獲得無敵，不用死！
        if (this.isSuper && !forceKill) {
            console.log("🛡️ 超級瑪利歐受傷，退回小瑪利歐！");
            this.isSuper = false;
            this.baseScale = 1.0; // 縮回原大小
            this.isInvincible = true;
            
            // 給予 2 秒的無敵閃爍時間
            setTimeout(() => {
                if (cc.isValid(this.node)) {
                    this.isInvincible = false;
                    console.log("退化無敵時間結束！");
                }
            }, 2000);
            return; // 提早結束，不呼叫扣命
        }

        // --- 真正死亡的流程 ---
        console.log("💥 【玩家】觸發死亡！");
        this.isInvincible = true;
        this.isControllable = false;
        if (this.rb) this.rb.linearVelocity = cc.v2(0, 0);
        
        let canvasNode = cc.find("Canvas");
        if (canvasNode) {
            let gm = canvasNode.getComponent("GameManager");
            if (gm) {
                // @ts-ignore
                gm.decreaseLife();
            }
        }
    }
}
const {ccclass, property} = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    @property(cc.Integer) moveSpeed: number = 200; 
    @property(cc.Integer) jumpForce: number = 600;
    @property(cc.SpriteFrame) idleSprite: cc.SpriteFrame = null;
    @property(cc.Vec2) spawnPos: cc.Vec2 = cc.v2(-400, -200);

    public isControllable: boolean = true; 
    public isInvincible: boolean = false; 

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

    // 🌟 修正 1：如果碰到的是隱形牆，不要把它當成地板 (避免在空中碰到牆還能無限跳)
    onBeginContact (contact, selfCollider, otherCollider) {
        if (otherCollider.node.name === "InvisibleWall") {
            return; 
        }
        this.isGrounded = true;
    }

    // 🌟 修正 2：利用 onPreSolve 實現穿牆術
    // 這個函數會在物理引擎計算「要不要阻擋」之前觸發
    onPreSolve (contact, selfCollider, otherCollider) {
        if (otherCollider.node.name === "InvisibleWall") {
            // 命令物理引擎：忽略這次的實體碰撞，讓我穿過去！
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
            
            if (this.node.y < -500) this.handleDeath();
            
            this.resetToIdle();
            return;
        }

        if (this.isMovingLeft) {
            velocity.x = -this.moveSpeed;
            this.node.scaleX = -Math.abs(this.node.scaleX);
        } else if (this.isMovingRight) {
            velocity.x = this.moveSpeed;
            this.node.scaleX = Math.abs(this.node.scaleX);
        } else {
            velocity.x = 0;
        }

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

        if (this.node.y < -500) {
            this.handleDeath();
        }
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
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, 0);
        }
    }

    handleDeath () {
        if (this.isInvincible) return;

        console.log("💥 【玩家】觸發死亡/受傷機制！");
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
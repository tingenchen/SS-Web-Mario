const {ccclass, property} = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    @property(cc.Integer) moveSpeed: number = 200; 
    @property(cc.Integer) jumpForce: number = 600;
    @property(cc.SpriteFrame) idleSprite: cc.SpriteFrame = null;
    @property(cc.Vec2) spawnPos: cc.Vec2 = cc.v2(-400, -200);

    @property({ type: cc.AudioClip, tooltip: "跳躍音效" })
    jumpClip: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "吃蘑菇變大音效" })
    powerUpClip: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "受傷縮小音效" })
    powerDownClip: cc.AudioClip = null;

    // 🌟 新增：踩踏敵人音效
    @property({ type: cc.AudioClip, tooltip: "踩踏敵人音效" })
    stompClip: cc.AudioClip = null;

    public isControllable: boolean = true; 
    public isInvincible: boolean = false; 

    public isSuper: boolean = false;
    private baseScale: number = 1.0; 
    
    private shrinkTimer: number = 0;
    private readonly BIG_DURATION: number = 10; 

    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null;
    private sprite: cc.Sprite = null; 
    
    private isMovingLeft: boolean = false;
    private isMovingRight: boolean = false;
    private isGrounded: boolean = false;
    private currentAnim: string = "";

    private isDead: boolean = false;
    private lastGrowTime: number = 0;

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
        if (!this.isControllable || this.isDead) return; 
        switch(event.keyCode) {
            case cc.macro.KEY.a: case cc.macro.KEY.left: this.isMovingLeft = true; break;
            case cc.macro.KEY.d: case cc.macro.KEY.right: this.isMovingRight = true; break;
            case cc.macro.KEY.w: case cc.macro.KEY.up: case cc.macro.KEY.space: this.jump(); break;
        }
    }

    onKeyUp (event) {
        if (!this.isControllable || this.isDead) return;
        switch(event.keyCode) {
            case cc.macro.KEY.a: case cc.macro.KEY.left: this.isMovingLeft = false; break;
            case cc.macro.KEY.d: case cc.macro.KEY.right: this.isMovingRight = false; break;
        }
    }

    jump () {
        if (this.isGrounded && this.rb && !this.isDead) {
            let velocity = this.rb.linearVelocity;
            velocity.y = this.jumpForce;
            this.rb.linearVelocity = velocity;
            this.isGrounded = false;
            this.playAnimation("PlayerJump");

            if (this.jumpClip) cc.audioEngine.playEffect(this.jumpClip, false);
        }
    }

    onBeginContact (contact, selfCollider, otherCollider) {
        if (this.isDead) return; 
        if (otherCollider.node.name === "InvisibleWall") return; 

        let normal = contact.getWorldManifold().normal;

        if (Math.abs(normal.y) > Math.abs(normal.x)) {
            if (this.rb && this.rb.linearVelocity.y <= 0.1) {
                this.isGrounded = true;
            }
        }
    }

    onPreSolve (contact, selfCollider, otherCollider) {
        if (otherCollider.node.name === "InvisibleWall") {
            contact.disabled = true; 
        }
    }

    update (dt) {
        if (this.isDead) return; 
        if (!this.rb) return;

        if (this.isSuper) {
            this.shrinkTimer -= dt;
            if (this.shrinkTimer <= 0) {
                this.shrinkBack(); 
            }
        }

        let velocity = this.rb.linearVelocity;

        if (!this.isControllable) {
            velocity.x = 0;
            this.rb.linearVelocity = velocity;
            this.isMovingLeft = false;
            this.isMovingRight = false;
            
            if (this.node.y < -500) this.handleDeath(true);
            this.resetToIdle();
            return;
        }

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
        
        this.isSuper = false;
        this.baseScale = 1.0;
        this.shrinkTimer = 0;
        
        this.isDead = false; 
        this.isControllable = true;
        this.isInvincible = false;
        
        let colliders = this.getComponents(cc.Collider);
        for (let c of colliders) {
            c.enabled = true;
        }

        this.node.scaleX = Math.sign(this.node.scaleX) * 1.0;
        this.node.scaleY = 1.0;
    }

    grow() {
        let now = Date.now();
        if (now - this.lastGrowTime < 100) return; 
        this.lastGrowTime = now;

        console.log("🍄 吃到蘑菇了！變大或重置時間！");
        this.isSuper = true;
        this.baseScale = 1.5;
        this.shrinkTimer = this.BIG_DURATION; 
        
        if (this.powerUpClip) cc.audioEngine.playEffect(this.powerUpClip, false);
        
        let currentSign = Math.sign(this.node.scaleX) || 1;
        cc.tween(this.node)
            .to(0.3, { scaleX: currentSign * 1.5, scaleY: 1.5 })
            .start();
        
        let canvasNode = cc.find("Canvas");
        if (canvasNode) {
            let gm = canvasNode.getComponent("GameManager");
            // @ts-ignore
            if (gm) gm.addScore(1000);
        }
    }

    private shrinkBack() {
        console.log("⏳ 變大時間到，縮小回去！");
        this.isSuper = false;
        this.baseScale = 1.0;
        
        if (this.powerDownClip) cc.audioEngine.playEffect(this.powerDownClip, false);

        let currentSign = Math.sign(this.node.scaleX) || 1;
        cc.tween(this.node)
            .to(0.3, { scaleX: currentSign * 1.0, scaleY: 1.0 })
            .start();
    }

    // 🌟 新增：專門用來播放踩踏音效的函數
    public playStompSound() {
        if (this.stompClip) {
            cc.audioEngine.playEffect(this.stompClip, false);
        }
    }

    handleDeath (forceKill: boolean = false) {
        if (this.isDead) return; 
        if (this.isInvincible && !forceKill) return;

        if (this.isSuper && !forceKill) {
            console.log("🛡️ 超級瑪利歐受傷，退回小瑪利歐！");
            this.isSuper = false;
            this.baseScale = 1.0; 
            this.shrinkTimer = 0; 
            this.isInvincible = true;
            
            if (this.powerDownClip) cc.audioEngine.playEffect(this.powerDownClip, false);

            this.node.scaleX = Math.sign(this.node.scaleX) * 1.0;
            this.node.scaleY = 1.0;
            
            setTimeout(() => {
                if (cc.isValid(this.node)) {
                    this.isInvincible = false;
                    console.log("退化無敵時間結束！");
                }
            }, 2000);
            return; 
        }

        console.log("💥 【玩家】觸發死亡！");
        this.isDead = true; 
        this.isInvincible = true;
        this.isControllable = false;
        
        if (this.rb) this.rb.linearVelocity = cc.v2(0, 0);
        
        let colliders = this.getComponents(cc.Collider);
        for (let c of colliders) {
            c.enabled = false;
        }
        
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
const {ccclass, property} = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    @property(cc.Integer) moveSpeed: number = 200; 
    @property(cc.Integer) jumpForce: number = 600;

    // 🌟 新增：用來存放瑪利歐靜止時的預設圖片
    @property(cc.SpriteFrame)
    idleSprite: cc.SpriteFrame = null;

    public isControllable: boolean = true; 

    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null;
    // 🌟 新增：宣告 Sprite 元件，用來切換圖片
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
        // 🌟 獲取角色身上的 Sprite 元件
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
        if (this.rb) {
            this.rb.awake = true;
        }
    }

    onDestroy () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown (event) {
        if (!this.isControllable) return; 
        switch(event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left: this.isMovingLeft = true; break;
            case cc.macro.KEY.d:
            case cc.macro.KEY.right: this.isMovingRight = true; break;
            case cc.macro.KEY.w:
            case cc.macro.KEY.up:
            case cc.macro.KEY.space: this.jump(); break;
        }
    }

    onKeyUp (event) {
        if (!this.isControllable) return;
        switch(event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left: this.isMovingLeft = false; break;
            case cc.macro.KEY.d:
            case cc.macro.KEY.right: this.isMovingRight = false; break;
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
        this.isGrounded = true;
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
            
            // 如果不能動，確保他回到預設站立狀態
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

        // --- 動畫狀態判斷 ---
        if (!this.isGrounded) {
            this.playAnimation("PlayerJump");
        } 
        else if (this.isMovingLeft || this.isMovingRight) {
            this.playAnimation("PlayerWalk");
        } 
        else {
            // 🌟 呼叫恢復 Idle 狀態的函數
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

    // 🌟 獨立出一個重置為站立圖片的函數
    resetToIdle() {
        if (this.currentAnim !== "Idle") {
            if (this.anim) this.anim.stop(); // 停止目前播放的動畫
            
            // 強制把圖片換回 idleSprite (靜止狀態的那張圖)
            if (this.sprite && this.idleSprite) {
                this.sprite.spriteFrame = this.idleSprite;
            }
            
            this.currentAnim = "Idle";
        }
    }

    handleDeath () {
        console.log("瑪利歐掉下去了！");
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
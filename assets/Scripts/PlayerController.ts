const {ccclass, property} = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    // 💡 調整 1：稍微降低預設跑動速度，避免跑太快直接跨過深淵
    @property(cc.Integer)
    moveSpeed: number = 200; 

    @property(cc.Integer)
    jumpForce: number = 600;

    private rb: cc.RigidBody = null;
    
    private isMovingLeft: boolean = false;
    private isMovingRight: boolean = false;
    private isGrounded: boolean = false;

    onLoad () {
        let physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.gravity = cc.v2(0, -980);

        this.rb = this.getComponent(cc.RigidBody);

        // 🌟 調整 2：解決「卡牆」問題，強制將瑪利歐的摩擦力設為 0
        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) {
            collider.friction = 0;
            collider.apply(); // 設定完必須呼叫 apply 才會生效
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
        switch(event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this.isMovingLeft = true;
                break;
            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this.isMovingRight = true;
                break;
            case cc.macro.KEY.w:
            case cc.macro.KEY.up:
            case cc.macro.KEY.space:
                this.jump();
                break;
        }
    }

    onKeyUp (event) {
        switch(event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this.isMovingLeft = false;
                break;
            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this.isMovingRight = false;
                break;
        }
    }

    jump () {
        if (this.isGrounded && this.rb) {
            let velocity = this.rb.linearVelocity;
            velocity.y = this.jumpForce;
            this.rb.linearVelocity = velocity;
            this.isGrounded = false;
        }
    }

    onBeginContact (contact, selfCollider, otherCollider) {
        this.isGrounded = true;
    }

    update (dt) {
        if (!this.rb) return;

        let velocity = this.rb.linearVelocity;

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

        // 判斷是否掉進深淵 (請依據你的地圖高度調整 -500 這個數值)
        if (this.node.y < -500) {
            this.handleDeath();
        }
    }

    handleDeath () {
        console.log("瑪利歐掉下去了！");
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, 0);
        }
        
        // 重生在起點，請根據你的地圖起點修改這兩個座標
        this.node.setPosition(cc.v2(-400, -200));
    }
}
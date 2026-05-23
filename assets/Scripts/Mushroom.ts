const {ccclass, property} = cc._decorator;

@ccclass
export default class Mushroom extends cc.Component {

    @property(cc.Integer) moveSpeed: number = 100;

    private rb: cc.RigidBody = null;
    private direction: number = 1; 

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) {
            collider.friction = 0;
            collider.apply();
        }

        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, 300);
        }

        cc.systemEvent.on("CLEANUP_ITEMS", this.destroySelf, this);
    }

    onDestroy() {
        cc.systemEvent.off("CLEANUP_ITEMS", this.destroySelf, this);
    }

    destroySelf() {
        if (cc.isValid(this.node)) {
            this.node.destroy();
        }
    }

    update(dt) {
        if (!this.rb) return;
        let velocity = this.rb.linearVelocity;
        velocity.x = this.direction * this.moveSpeed;
        this.rb.linearVelocity = velocity;

        if (this.node.y < -600) this.node.destroy();
    }

    // 🌟 新增：利用 onPreSolve 讓蘑菇穿透隱形牆
    onPreSolve (contact, selfCollider, otherCollider) {
        if (otherCollider.node.name === "InvisibleWall") {
            // 命令物理引擎：忽略這次的實體碰撞，讓蘑菇穿過去！
            contact.disabled = true; 
        }
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        let other = otherCollider.node;

        // 🌟 修正：如果碰到的是隱形牆，直接 return，不要執行後面的反彈邏輯
        if (other.name === "InvisibleWall") {
            return;
        }

        if (other.name === "Player") {
            let playerCtrl = other.getComponent("PlayerController");
            if (playerCtrl) {
                // @ts-ignore
                if (playerCtrl.grow) playerCtrl.grow();
            }
            
            setTimeout(() => { if (cc.isValid(this.node)) this.node.destroy(); }, 0);
            
        } else {
            let otherRb = other.getComponent(cc.RigidBody);
            if (otherRb && otherRb.type === cc.RigidBodyType.Static) {
                let normal = contact.getWorldManifold().normal;
                if (Math.abs(normal.x) > Math.abs(normal.y)) {
                    this.direction *= -1;
                }
            }
        }
    }
}
const {ccclass, property} = cc._decorator;

@ccclass
export default class Mushroom extends cc.Component {

    @property(cc.Integer) moveSpeed: number = 100;

    private rb: cc.RigidBody = null;
    private direction: number = 1; // 預設往右跑

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        let collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) {
            collider.friction = 0;
            collider.apply();
        }

        // 蘑菇一出生的瞬間，給它一個微小的向上彈跳力
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, 300);
        }
    }

    update(dt) {
        if (!this.rb) return;
        let velocity = this.rb.linearVelocity;
        velocity.x = this.direction * this.moveSpeed;
        this.rb.linearVelocity = velocity;

        if (this.node.y < -600) this.node.destroy();
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        let other = otherCollider.node;

        if (other.name === "Player") {
            // 🌟 瑪利歐吃到蘑菇！
            let playerCtrl = other.getComponent("PlayerController");
            if (playerCtrl) {
                // @ts-ignore
                if (playerCtrl.grow) playerCtrl.grow();
            }
            
            // 銷毀蘑菇自己
            setTimeout(() => { if (cc.isValid(this.node)) this.node.destroy(); }, 0);
            
        } else {
            // 撞到牆壁或水管，反彈轉向
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
# Software Studio 2026 Spring
## Web Mario

### How To Play
* 選單scene
一開始進入遊戲畫面，可以選擇訪客遊玩，也可以註冊帳號與登入(firebase membership machanism)。
* 關卡選擇scene
接著會進入此場景，若是新帳號，一開始只能玩第一關，破完才解鎖第二關。右上角的問號按下後會出現遊戲說明。在此場景也能觀看Leaderboard，只有登入帳號後才看得到東西。按back可以退回到選單，按Log Out則會順便登出。
* 遊戲
玩家共有三條命，被怪物殺死或是掉出地圖外都會扣一條命，都扣完就遊戲結束。只有活著結束遊戲才會計到分數。
* 敵人
遊戲共有兩種敵人，Goomba就是一般怪物，Turtle死掉後會變成龜殼，玩家可以讓龜殼去撞敵人，無論撞到哪種都會立刻死掉，但玩家也可能被撞死。再踩一次龜殼可以讓它停下。兩種敵人都有動畫。
* 問號方塊
撞問號方塊會掉出蘑菇，吃了蘑菇會變大十秒，期間能不斷撞死敵人，但掉出地圖外還是會減一條命。問號方塊撞一次後就會變普通方塊。
* 金幣
場上會有金幣可以吃，增加遊戲分數。
* 音效
除了作業規定的BGM、jump、die，我還加了五個音效:吃金幣、獲得蘑菇效果、失去蘑菇效果、遊戲失敗、遊戲勝利。


### Web page link

https://mario-9c275.web.app


### GitHub Repository

https://github.com/tingenchen/SS-Web-Mario

<style>
table th{
    width: 100%;
}
</style>
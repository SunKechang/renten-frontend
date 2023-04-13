export default {
    ws: null,
    setWs: function(newWs) {
        this.ws = newWs
    },
    send: function(data) {
        if(!this.ws || this.ws === undefined || this.ws === null) {
            return
        }
        let that = this
        if(this.ws.readyState === 1) {
            console.log("send", data)
            this.ws.send(JSON.stringify(data))
        } else if(this.ws.readyState === 0) {   // 当连接处于出错状态时拒绝发送
            this.ws.onopen = () => {
                console.log("waitsend", data)
                that.ws.send(JSON.stringify(data))
            }
        }
    },
    color: {
        spade: 0,   //黑桃
        heart: 1,   //红桃
        club: 2,    //花子
        diamond: 3  //方片
    }
}
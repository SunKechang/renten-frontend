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
        this.ws.onopen = () => {
            console.log(data)
            that.ws.send(JSON.stringify(data))
        }
    },
    color: {
        spade: 0,   //黑桃
        heart: 1,   //红桃
        club: 2,    //花子
        diamond: 3  //方片
    }
}
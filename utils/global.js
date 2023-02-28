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
    }
}
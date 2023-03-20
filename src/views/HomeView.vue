<template>
  <div class="home" style="display: flex; justify-content: center;">
    <div style="display: flex; flex-direction: column;">
      <div v-if="userRole != 0">
        <button class="tdButton" @click="addRoom">创建房间</button>
      </div>
      <div v-if="userRole != 1">
        <form action="room/join">
          <input type="text" name="room_id" placeholder="房间号" class="input"/>
          <button class="tdButton" type="submit" style="display: inline-block; margin-left: 20px;">加入房间</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      userRole: -1, //-1 游客 0 被邀请者 1 房主
    }
  },
  methods: {
    async addRoom() {
      this.isMaster = 1
      if (typeof WebSocket === "undefined") {
        alert("您的浏览器不支持WebSocket");
        return;
      } else {
        this.$router.push({
          path: "/room/add"
        });
      }
    },
  }
}
</script>
<style scoped>
  .home {
    background-image: url('~@/assets/dogs.jpg');
    width: 100vw;
    height: 100vh;
    background-size: cover;
  }

  .tdButton {
    position: relative;
    color: rgba(255,255,255,1);
    text-decoration: none;
    background-color: rgba(219,87,5,1);
    font-weight: 700;
    font-size: 3em;
    display: block;
    padding: 4px;
    border-radius: 8px;
    box-shadow: 0px 9px 0px rgba(219,31,5,1), 0px 9px 25px rgba(0,0,0,.7);
    margin: 100px auto;
    width: 240px;
    text-align: center;
    border: 0;
    transition: all .1s ease;
  } 

  .tdButton:active {
    box-shadow: 0px 3px 0px rgba(219,31,5,1), 0px 3px 6px rgba(0,0,0,.9);
    position: relative;
    top: 6px;
  }

  .input {
    font-weight: 700;
    font-size: 3em;
    width: 300px;
  }
</style>
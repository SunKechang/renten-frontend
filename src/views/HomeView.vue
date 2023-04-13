<template>
  <div class="home" style="display: flex; justify-content: center;">
    <div style="display: flex; flex-direction: column;">
      <div>
        <button class="tdButton" @click="addRoom">创建房间</button>
      </div>
      <div>
        <form action="room/join">
          <input type="text" name="room_id" placeholder="房间号" class="input"/>
          <button class="tdButton" type="submit" style="display: inline-block; margin-left: 20px;" @click="joinRoom">加入房间</button>
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
    }
  },
  methods: {
    async addRoom() {
      if (typeof WebSocket === "undefined") {
        alert("您的浏览器不支持WebSocket");
        return;
      } else {
        this.$router.push({
          path: "/room/add"
        });
      }
    },
    joinRoom() {
      localStorage.setItem('last-login', new Date().getTime())
    }
  },
  mounted() {
    // 每次进入当前页面清空session解决BUG[无法总是使用同一个sessionId导致无法创建新房间]
    sessionStorage.clear()
  }
}
</script>
<style scoped>
  .home {
    background-image: url('~@/assets/dogs.jpg');
    width: 100%;
    height: 100%;
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
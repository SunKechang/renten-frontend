<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>

function resize() {
  var body = document.getElementsByTagName('body')[0];
  var html = document.getElementsByTagName('html')[0];
  var width = html.clientWidth;
  var height =  html.clientHeight;
  var max = width > height ? width : height;
  var min = width > height ? height : width;
  body.style.width = max + "px";
  body.style.height = min + "px";
  console.log(body.style.width, body.style.height)
}
export default({
  created() {
    resize()
  }
})
</script>


<style>
#app {
  width: 100%;
  height: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body{
	margin:0;
	padding:0;
	border:0
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}

@media screen and (orientation: portrait) {
  /*竖屏样式*/
  body {
    transform-origin: 0 0;
    transform: rotateZ(90deg) translateY(-100%);
  }
}

</style>

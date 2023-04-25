let productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;

module.exports = {
  transpileDependencies: true,
  devServer: {
    port: 80,
    proxy: {
      "/api": {
        // ws://8.130.97.117:88/
        // ws://localhost:8081/
        target: "ws://localhost:8081/", // 要访问的接口域名
        ws: true, // 是否启用websockets
        changeOrigin: true, //开启代理：在本地会创建一个虚拟服务端，然后发送请求的数据，并同时接收请求的数据，这样服务端和服务端进行数据的交互就不会有跨域问题
        pathRewrite: {
          "^/api": "" //这里理解成用'/api'代替target里面的地址,比如我要调用'http://40.00.100.100:3002/user/add'，直接写'/api/user/add'即可
        }
      },
      "/resource": {
        target: "http://8.130.97.117:88",
        pathRewrite: {
          "^/resource": ""
        }
      }
    }
  },
  chainWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      config.plugin("CompressionPlugin").use('compression-webpack-plugin', [{
        filename: '[path][base].gz',
        algorithm: 'gzip',
        // 要压缩的文件（正则）
        test: productionGzipExtensions,
        // 最小文件开启压缩
        threshold: 10240,
        minRatio: 0.8
      }])
      config.module
      .rule('image')
      .test(/\.(png|jpe?g|gif)(\?.*)?$/)
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
          mozjpeg: { progressive: true, quality: 50 }, // 压缩JPEG图像
          // 此处为ture的时候不会启用压缩处理,目的是为了开发模式下调试速度更快
          disable: false
      })
      .end()
    }
  },
  
}

const SpritesmithPlugin = require('webpack-spritesmith')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin
const webpack = require('webpack')
const StylelintPlugin = require('stylelint-webpack-plugin')

// const PrerenderSpaPlugin = require('prerender-spa-plugin')

const path = require('path')
const fs = require('fs')
const resolve = (dir) => path.join(__dirname, dir)
const IS_PROD = ['production', 'prod'].includes(process.env.NODE_ENV)
const IS_DEV = ['development'].includes(process.env.NODE_ENV)

const CompressionWebpackPlugin = require('compression-webpack-plugin')
// 生产环境Gzip
const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i

// const glob = require('glob')
// const pagesInfo = require('./pages.config')
// const pages = {}

// glob.sync('./src/pages/**/main.js').forEach(entry => {
//   let chunk = entry.match(/\.\/src\/pages\/(.*)\/main\.js/)[1];
//   const curr = pagesInfo[chunk];
//   if (curr) {
//     pages[chunk] = {
//       entry,
//       ...curr,
//       chunk: ["chunk-vendors", "chunk-common", chunk]
//     }
//   }
// })

let has_sprite = true
let files = []
const icons = {}

try {
  fs.statSync(resolve('./src/assets/icons'))
  files = fs.readdirSync(resolve('./src/assets/icons'))
  files.forEach((item) => {
    let filename = item.toLocaleLowerCase().replace(/_/g, '-')
    icons[filename] = true
  })
} catch (error) {
  fs.mkdirSync(resolve('./src/assets/icons'))
}

if (!files.length) {
  has_sprite = false
} else {
  try {
    let iconsObj = fs.readFileSync(resolve('./icons.json'), 'utf8')
    iconsObj = JSON.parse(iconsObj)
    has_sprite = files.some((item) => {
      let filename = item.toLocaleLowerCase().replace(/_/g, '-')
      return !iconsObj[filename]
    })
    if (has_sprite) {
      fs.writeFileSync(resolve('./icons.json'), JSON.stringify(icons, null, 2))
    }
  } catch (error) {
    fs.writeFileSync(resolve('./icons.json'), JSON.stringify(icons, null, 2))
    has_sprite = true
  }
}

// 雪碧图样式处理模板
const SpritesmithTemplate = function(data) {
  // pc
  let icons = {}
  let tpl = `.ico {
  display: inline-block;
  background-image: url(${data.sprites[0].image});
  background-size: ${data.spritesheet.width}px ${data.spritesheet.height}px;
}`

  data.sprites.forEach((sprite) => {
    const name = '' + sprite.name.toLocaleLowerCase().replace(/_/g, '-')
    icons[`${name}.png`] = true
    tpl = `${tpl}
.ico-${name}{
  width: ${sprite.width}px;
  height: ${sprite.height}px;
  background-position: ${sprite.offset_x}px ${sprite.offset_y}px;
}
`
  })
  return tpl
}

module.exports = {
  // 默认'/'，部署应用包时的基本 URL
  publicPath: IS_PROD ? process.env.VUE_APP_PUBLIC_PATH : '/',

  // outputDir: process.env.outputDir || 'dist', // 'dist', 生产环境构建文件的目录
  assetsDir: "static", // 相对于outputDir的静态资源(js、css、img、fonts)目录
  configureWebpack: (config) => {
    const plugins = []

    if (has_sprite) {
      // 生成雪碧图
      plugins.push(
        new SpritesmithPlugin({
          src: {
            cwd: path.resolve(__dirname, './src/assets/icons/'), // 图标根路径
            glob: '**/*.png', // 匹配任意 png 图标
          },
          target: {
            image: path.resolve(__dirname, './src/assets/images/sprites.png'), // 生成雪碧图目标路径与名称
            // 设置生成CSS背景及其定位的文件或方式
            css: [
              [
                path.resolve(__dirname, './src/assets/scss/sprites.scss'),
                {
                  format: 'function_based_template',
                },
              ],
            ],
          },
          customTemplates: {
            function_based_template: SpritesmithTemplate,
          },
          apiOptions: {
            cssImageRef: '../images/sprites.png', // css文件中引用雪碧图的相对位置路径配置
          },
          spritesmithOptions: {
            padding: 2,
          },
        })
      )
    }

    if (IS_PROD) {

      config.externals = {
        vue: 'Vue',
        "element-ui": "ELEMENT",
        'vue-router': 'VueRouter',
        vuex: 'Vuex',
        axios: 'axios',
      }

      // Gzip压缩
      plugins.push(
        new CompressionWebpackPlugin({
          filename: '[path].gz[query]',
          algorithm: 'gzip',
          test: productionGzipExtensions,
          threshold: 10240,
          minRatio: 0.8,
        })
      )

      // 预渲染
      // plugins.push(
      //   new PrerenderSpaPlugin({
      //     staticDir: resolve('dist'),
      //     routes: ['/'],
      //     minify: {
      //       collapseBooleanAttributes: true,
      //       collapseWhitespace: true,
      //       decodeEntities: true,
      //       keepClosingSlash: true,
      //       sortAttributes: true,
      //     },
      //     renderer: new PrerenderSpaPlugin.PuppeteerRenderer({
      //       // 需要注入一个值，这样就可以检测页面当前是否是预渲染的
      //       inject: {
      //         foo: 'bar',
      //       },
      //       headless: false,
      //       // 视图组件是在API请求获取所有必要数据后呈现的，因此我们在dom中存在“data view”属性后创建页面快照
      //       renderAfterDocumentEvent: 'render-event',
      //       renderAfterTime: 5000,
      //     }),
      //   })
      // )

      // 单独打包第三方模块
      config.optimization = {
        splitChunks: {
          cacheGroups: {
            common: {
              name: "chunk-common",
              chunks: "initial",
              minChunks: 2,
              maxInitialRequests: 5,
              minSize: 0,
              priority: 1,
              reuseExistingChunk: true,
              enforce: true
            },
            vendors: {
              name: "chunk-vendors",
              test: /[\\/]node_modules[\\/]/,
              chunks: "initial",
              priority: 2,
              reuseExistingChunk: true,
              enforce: true
            },
          }
        }
      }

    }

    if (IS_DEV) {
      plugins.push(
        new StylelintPlugin({
          files: ['src/**/*.vue', 'src/assets/**/*.scss'],
          fix: true,
        })
      )
      // 关闭host check，方便使用ngrok之类的内网转发工具
      config.devServer = {
        disableHostCheck: true,
      }
    }

    config.plugins = [...config.plugins, ...plugins]
  },

  chainWebpack: (config) => {
    // 修复HMR
    config.resolve.symlinks(true)

    config.plugins.delete('pwa')
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')

    config
      .plugin('ignore')
      .use(new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /zh-cn$/))

    // 添加别名
    config.resolve.alias
      .set('vue$', 'vue/dist/vue.esm.js')
      .set('@', resolve('src'))
      .set('@api', resolve('src/api'))
      .set('@assets', resolve('src/assets'))
      .set('@scss', resolve('src/assets/scss'))
      .set('@components', resolve('src/components'))
      .set('@middlewares', resolve('src/middlewares'))
      .set('@mixins', resolve('src/mixins'))
      .set('@plugins', resolve('src/plugins'))
      .set('@router', resolve('src/router'))
      .set('@store', resolve('src/store'))
      .set('@utils', resolve('src/utils'))
      .set('@views', resolve('src/views'))
      .set('@layouts', resolve('src/layouts'))

    const cdn = {
      // 访问https://unpkg.com/element-ui/lib/theme-chalk/index.css获取最新版本
      css: [
        "//unpkg.com/element-ui@2.10.1/lib/theme-chalk/index.css"
      ],
      js: [
        '//unpkg.com/vue@2.6.10/dist/vue.min.js', // 访问https://unpkg.com/vue/dist/vue.min.js获取最新版本
        '//unpkg.com/vue-router@3.0.6/dist/vue-router.min.js',
        '//unpkg.com/vuex@3.1.1/dist/vuex.min.js',
        '//unpkg.com/axios@0.19.0/dist/axios.min.js',
        "//unpkg.com/element-ui@2.10.1/lib/index.js"
      ],
    }

    // 如果使用多页面打包，使用vue inspect --plugins查看html是否在结果数组中
    config.plugin('html').tap((args) => {
      // html中添加cdn
      if (IS_PROD) {
        args[0].cdn = cdn
      }

      // 修复 Lazy loading routes Error
      args[0].chunksSortMode = 'none'
      return args
    })

    // 防止多页面打包卡顿
    // config => config.plugins.delete('named-chunks')

    // 多页面cdn添加
    // Object.keys(pagesInfo).forEach(page => {
    //   config.plugin(`html-${page}`).tap(args => {
    //     // html中添加cdn
    //     args[0].cdn = cdn;

    //     // 修复 Lazy loading routes Error
    //     args[0].chunksSortMode = "none";
    //     return args;
    //   });
    // })

    if (IS_PROD) {
      // 压缩图片
      config.module
        .rule('images')
        .test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
        .use('image-webpack-loader')
        .loader('image-webpack-loader')
        .options({
          mozjpeg: { progressive: true, quality: 65 },
          optipng: { enabled: false },
          pngquant: { quality: [0.65, 0.9], speed: 4 },
          gifsicle: { interlaced: false },
        })

      // 打包分析
      config.plugin('webpack-report').use(BundleAnalyzerPlugin, [
        {
          analyzerMode: 'static',
        },
      ])

      config.optimization.delete("splitChunks");

    }

    // 使用svg组件
    const svgRule = config.module.rule('svg')
    svgRule.uses.clear()
    svgRule.exclude.add(/node_modules/)
    svgRule
      .test(/\.svg$/)
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]',
      })

    const imagesRule = config.module.rule('images')
    imagesRule.exclude.add(resolve('src/icons'))
    config.module.rule('images').test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)

    return config
  },

  // pages,
  css: {
    extract: IS_PROD,
    sourceMap: false,
    loaderOptions: {
      scss: {
        // 向全局sass样式传入共享的全局变量, $src可以配置图片cdn前缀
        // 详情: https://cli.vuejs.org/guide/css.html#passing-options-to-pre-processor-loaders
        prependData: `
          @import "@scss/variables.scss";
          @import "@scss/mixins.scss";
          @import "@scss/function.scss";
          $src: "${process.env.VUE_APP_BASE_API}";
          `,
      },
    },
  },

  lintOnSave: IS_DEV,

  // 是否使用包含运行时编译器的 Vue 构建版本
  runtimeCompiler: true,

  // 生产环境的 source map
  productionSourceMap: !IS_PROD,

  parallel: require('os').cpus().length > 1,
  pwa: {},

  devServer: {
    // overlay: { // 让浏览器 overlay 同时显示警告和错误
    //   warnings: true,
    //   errors: true
    // },
    // open: false, // 是否打开浏览器
    // host: "localhost",
    // port: "8080", // 代理断就
    // https: false,
    // hotOnly: false, // 热更新
    // proxy: {
    //   "/api": {
    //     target:
    //       "https://www.easy-mock.com/mock/5bc75b55dc36971c160cad1b/sheets", // 目标代理接口地址
    //     secure: false,
    //     changeOrigin: true, // 开启代理，在本地创建一个虚拟服务端
    //     // ws: true, // 是否启用websockets
    //     pathRewrite: {
    //       "^/api": "/"
    //     }
    //   }
    // }
  },

  pluginOptions: {

  }
}

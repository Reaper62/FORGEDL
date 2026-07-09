import { session, screen, app, ipcMain, shell, BrowserWindow, dialog } from 'electron'
import path, { join } from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import * as fs from 'node:fs'
import fs__default, {
  existsSync,
  statSync,
  mkdirSync,
  writeFileSync,
  chmodSync,
  unlinkSync,
  readdirSync,
} from 'node:fs'
import require$$0$2 from 'util'
import require$$0$1 from 'os'
import require$$0$3 from 'stream'
import require$$0$4 from 'buffer'
import require$$0$5 from 'events'
import require$$0$6 from 'fs'
import require$$1$2 from 'path'
import require$$3 from 'zlib'
import require$$1 from 'tty'
import require$$1$1 from 'string_decoder'
import require$$0$7 from 'http'
import require$$1$3 from 'https'
import { randomUUID } from 'node:crypto'
import { execFileSync, spawnSync, spawn } from 'node:child_process'
var commonjsGlobal =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
        ? global
        : typeof self !== 'undefined'
          ? self
          : {}
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x
}
function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n
  var f = n.default
  if (typeof f == 'function') {
    var a = function a2() {
      var isInstance = false
      try {
        isInstance = this instanceof a2
      } catch {}
      if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor)
      }
      return f.apply(this, arguments)
    }
    a.prototype = f.prototype
  } else a = {}
  Object.defineProperty(a, '__esModule', { value: true })
  Object.keys(n).forEach(function (k) {
    var d = Object.getOwnPropertyDescriptor(n, k)
    Object.defineProperty(
      a,
      k,
      d.get
        ? d
        : {
            enumerable: true,
            get: function () {
              return n[k]
            },
          },
    )
  })
  return a
}
var winston$1 = {}
var logform = {}
var format$1
var hasRequiredFormat
function requireFormat() {
  if (hasRequiredFormat) return format$1
  hasRequiredFormat = 1
  class InvalidFormatError extends Error {
    constructor(formatFn) {
      super(`Format functions must be synchronous taking a two arguments: (info, opts)
Found: ${formatFn.toString().split('\n')[0]}
`)
      Error.captureStackTrace(this, InvalidFormatError)
    }
  }
  format$1 = (formatFn) => {
    if (formatFn.length > 2) {
      throw new InvalidFormatError(formatFn)
    }
    function Format(options = {}) {
      this.options = options
    }
    Format.prototype.transform = formatFn
    function createFormatWrap(opts) {
      return new Format(opts)
    }
    createFormatWrap.Format = Format
    return createFormatWrap
  }
  return format$1
}
var colorize = { exports: {} }
var safe$1 = { exports: {} }
var colors = { exports: {} }
var styles = { exports: {} }
var hasRequiredStyles
function requireStyles() {
  if (hasRequiredStyles) return styles.exports
  hasRequiredStyles = 1
  ;(function (module) {
    var styles2 = {}
    module['exports'] = styles2
    var codes = {
      reset: [0, 0],
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29],
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      gray: [90, 39],
      grey: [90, 39],
      brightRed: [91, 39],
      brightGreen: [92, 39],
      brightYellow: [93, 39],
      brightBlue: [94, 39],
      brightMagenta: [95, 39],
      brightCyan: [96, 39],
      brightWhite: [97, 39],
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      bgGray: [100, 49],
      bgGrey: [100, 49],
      bgBrightRed: [101, 49],
      bgBrightGreen: [102, 49],
      bgBrightYellow: [103, 49],
      bgBrightBlue: [104, 49],
      bgBrightMagenta: [105, 49],
      bgBrightCyan: [106, 49],
      bgBrightWhite: [107, 49],
      // legacy styles for colors pre v1.0.0
      blackBG: [40, 49],
      redBG: [41, 49],
      greenBG: [42, 49],
      yellowBG: [43, 49],
      blueBG: [44, 49],
      magentaBG: [45, 49],
      cyanBG: [46, 49],
      whiteBG: [47, 49],
    }
    Object.keys(codes).forEach(function (key) {
      var val = codes[key]
      var style = (styles2[key] = [])
      style.open = '\x1B[' + val[0] + 'm'
      style.close = '\x1B[' + val[1] + 'm'
    })
  })(styles)
  return styles.exports
}
var hasFlag
var hasRequiredHasFlag
function requireHasFlag() {
  if (hasRequiredHasFlag) return hasFlag
  hasRequiredHasFlag = 1
  hasFlag = function (flag, argv) {
    argv = argv || process.argv || []
    var terminatorPos = argv.indexOf('--')
    var prefix = /^-{1,2}/.test(flag) ? '' : '--'
    var pos = argv.indexOf(prefix + flag)
    return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos)
  }
  return hasFlag
}
var supportsColors
var hasRequiredSupportsColors
function requireSupportsColors() {
  if (hasRequiredSupportsColors) return supportsColors
  hasRequiredSupportsColors = 1
  var os2 = require$$0$1
  var hasFlag2 = requireHasFlag()
  var env = process.env
  var forceColor = void 0
  if (hasFlag2('no-color') || hasFlag2('no-colors') || hasFlag2('color=false')) {
    forceColor = false
  } else if (
    hasFlag2('color') ||
    hasFlag2('colors') ||
    hasFlag2('color=true') ||
    hasFlag2('color=always')
  ) {
    forceColor = true
  }
  if ('FORCE_COLOR' in env) {
    forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0
  }
  function translateLevel(level) {
    if (level === 0) {
      return false
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3,
    }
  }
  function supportsColor(stream2) {
    if (forceColor === false) {
      return 0
    }
    if (hasFlag2('color=16m') || hasFlag2('color=full') || hasFlag2('color=truecolor')) {
      return 3
    }
    if (hasFlag2('color=256')) {
      return 2
    }
    if (stream2 && !stream2.isTTY && forceColor !== true) {
      return 0
    }
    var min = forceColor ? 1 : 0
    if (process.platform === 'win32') {
      var osRelease = os2.release().split('.')
      if (
        Number(process.versions.node.split('.')[0]) >= 8 &&
        Number(osRelease[0]) >= 10 &&
        Number(osRelease[2]) >= 10586
      ) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2
      }
      return 1
    }
    if ('CI' in env) {
      if (
        ['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(function (sign) {
          return sign in env
        }) ||
        env.CI_NAME === 'codeship'
      ) {
        return 1
      }
      return min
    }
    if ('TEAMCITY_VERSION' in env) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0
    }
    if ('TERM_PROGRAM' in env) {
      var version2 = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10)
      switch (env.TERM_PROGRAM) {
        case 'iTerm.app':
          return version2 >= 3 ? 3 : 2
        case 'Hyper':
          return 3
        case 'Apple_Terminal':
          return 2
      }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
      return 2
    }
    if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
      return 1
    }
    if ('COLORTERM' in env) {
      return 1
    }
    if (env.TERM === 'dumb') {
      return min
    }
    return min
  }
  function getSupportLevel(stream2) {
    var level = supportsColor(stream2)
    return translateLevel(level)
  }
  supportsColors = {
    supportsColor: getSupportLevel,
    stdout: getSupportLevel(process.stdout),
    stderr: getSupportLevel(process.stderr),
  }
  return supportsColors
}
var trap = { exports: {} }
var hasRequiredTrap
function requireTrap() {
  if (hasRequiredTrap) return trap.exports
  hasRequiredTrap = 1
  ;(function (module) {
    module['exports'] = function runTheTrap(text, options) {
      var result = ''
      text = text || 'Run the trap, drop the bass'
      text = text.split('')
      var trap2 = {
        a: ['@', 'Ą', 'Ⱥ', 'Ʌ', 'Δ', 'Λ', 'Д'],
        b: ['ß', 'Ɓ', 'Ƀ', 'ɮ', 'β', '฿'],
        c: ['©', 'Ȼ', 'Ͼ'],
        d: ['Ð', 'Ɗ', 'Ԁ', 'ԁ', 'Ԃ', 'ԃ'],
        e: ['Ë', 'ĕ', 'Ǝ', 'ɘ', 'Σ', 'ξ', 'Ҽ', '੬'],
        f: ['Ӻ'],
        g: ['ɢ'],
        h: ['Ħ', 'ƕ', 'Ң', 'Һ', 'Ӈ', 'Ԋ'],
        i: ['༏'],
        j: ['Ĵ'],
        k: ['ĸ', 'Ҡ', 'Ӄ', 'Ԟ'],
        l: ['Ĺ'],
        m: ['ʍ', 'Ӎ', 'ӎ', 'Ԡ', 'ԡ', '൩'],
        n: ['Ñ', 'ŋ', 'Ɲ', 'Ͷ', 'Π', 'Ҋ'],
        o: ['Ø', 'õ', 'ø', 'Ǿ', 'ʘ', 'Ѻ', 'ם', '۝', '๏'],
        p: ['Ƿ', 'Ҏ'],
        q: ['্'],
        r: ['®', 'Ʀ', 'Ȑ', 'Ɍ', 'ʀ', 'Я'],
        s: ['§', 'Ϟ', 'ϟ', 'Ϩ'],
        t: ['Ł', 'Ŧ', 'ͳ'],
        u: ['Ʊ', 'Ս'],
        v: ['ט'],
        w: ['Ш', 'Ѡ', 'Ѽ', '൰'],
        x: ['Ҳ', 'Ӿ', 'Ӽ', 'ӽ'],
        y: ['¥', 'Ұ', 'Ӌ'],
        z: ['Ƶ', 'ɀ'],
      }
      text.forEach(function (c) {
        c = c.toLowerCase()
        var chars = trap2[c] || [' ']
        var rand = Math.floor(Math.random() * chars.length)
        if (typeof trap2[c] !== 'undefined') {
          result += trap2[c][rand]
        } else {
          result += c
        }
      })
      return result
    }
  })(trap)
  return trap.exports
}
var zalgo = { exports: {} }
var hasRequiredZalgo
function requireZalgo() {
  if (hasRequiredZalgo) return zalgo.exports
  hasRequiredZalgo = 1
  ;(function (module) {
    module['exports'] = function zalgo2(text, options) {
      text = text || '   he is here   '
      var soul = {
        up: [
          '̍',
          '̎',
          '̄',
          '̅',
          '̿',
          '̑',
          '̆',
          '̐',
          '͒',
          '͗',
          '͑',
          '̇',
          '̈',
          '̊',
          '͂',
          '̓',
          '̈',
          '͊',
          '͋',
          '͌',
          '̃',
          '̂',
          '̌',
          '͐',
          '̀',
          '́',
          '̋',
          '̏',
          '̒',
          '̓',
          '̔',
          '̽',
          '̉',
          'ͣ',
          'ͤ',
          'ͥ',
          'ͦ',
          'ͧ',
          'ͨ',
          'ͩ',
          'ͪ',
          'ͫ',
          'ͬ',
          'ͭ',
          'ͮ',
          'ͯ',
          '̾',
          '͛',
          '͆',
          '̚',
        ],
        down: [
          '̖',
          '̗',
          '̘',
          '̙',
          '̜',
          '̝',
          '̞',
          '̟',
          '̠',
          '̤',
          '̥',
          '̦',
          '̩',
          '̪',
          '̫',
          '̬',
          '̭',
          '̮',
          '̯',
          '̰',
          '̱',
          '̲',
          '̳',
          '̹',
          '̺',
          '̻',
          '̼',
          'ͅ',
          '͇',
          '͈',
          '͉',
          '͍',
          '͎',
          '͓',
          '͔',
          '͕',
          '͖',
          '͙',
          '͚',
          '̣',
        ],
        mid: [
          '̕',
          '̛',
          '̀',
          '́',
          '͘',
          '̡',
          '̢',
          '̧',
          '̨',
          '̴',
          '̵',
          '̶',
          '͜',
          '͝',
          '͞',
          '͟',
          '͠',
          '͢',
          '̸',
          '̷',
          '͡',
          ' ҉',
        ],
      }
      var all = [].concat(soul.up, soul.down, soul.mid)
      function randomNumber(range) {
        var r = Math.floor(Math.random() * range)
        return r
      }
      function isChar(character) {
        var bool = false
        all.filter(function (i) {
          bool = i === character
        })
        return bool
      }
      function heComes(text2, options2) {
        var result = ''
        var counts
        var l
        options2 = options2 || {}
        options2['up'] = typeof options2['up'] !== 'undefined' ? options2['up'] : true
        options2['mid'] = typeof options2['mid'] !== 'undefined' ? options2['mid'] : true
        options2['down'] = typeof options2['down'] !== 'undefined' ? options2['down'] : true
        options2['size'] = typeof options2['size'] !== 'undefined' ? options2['size'] : 'maxi'
        text2 = text2.split('')
        for (l in text2) {
          if (isChar(l)) {
            continue
          }
          result = result + text2[l]
          counts = { up: 0, down: 0, mid: 0 }
          switch (options2.size) {
            case 'mini':
              counts.up = randomNumber(8)
              counts.mid = randomNumber(2)
              counts.down = randomNumber(8)
              break
            case 'maxi':
              counts.up = randomNumber(16) + 3
              counts.mid = randomNumber(4) + 1
              counts.down = randomNumber(64) + 3
              break
            default:
              counts.up = randomNumber(8) + 1
              counts.mid = randomNumber(6) / 2
              counts.down = randomNumber(8) + 1
              break
          }
          var arr = ['up', 'mid', 'down']
          for (var d in arr) {
            var index = arr[d]
            for (var i = 0; i <= counts[index]; i++) {
              if (options2[index]) {
                result = result + soul[index][randomNumber(soul[index].length)]
              }
            }
          }
        }
        return result
      }
      return heComes(text, options)
    }
  })(zalgo)
  return zalgo.exports
}
var america = { exports: {} }
var hasRequiredAmerica
function requireAmerica() {
  if (hasRequiredAmerica) return america.exports
  hasRequiredAmerica = 1
  ;(function (module) {
    module['exports'] = function (colors2) {
      return function (letter, i, exploded) {
        if (letter === ' ') return letter
        switch (i % 3) {
          case 0:
            return colors2.red(letter)
          case 1:
            return colors2.white(letter)
          case 2:
            return colors2.blue(letter)
        }
      }
    }
  })(america)
  return america.exports
}
var zebra = { exports: {} }
var hasRequiredZebra
function requireZebra() {
  if (hasRequiredZebra) return zebra.exports
  hasRequiredZebra = 1
  ;(function (module) {
    module['exports'] = function (colors2) {
      return function (letter, i, exploded) {
        return i % 2 === 0 ? letter : colors2.inverse(letter)
      }
    }
  })(zebra)
  return zebra.exports
}
var rainbow = { exports: {} }
var hasRequiredRainbow
function requireRainbow() {
  if (hasRequiredRainbow) return rainbow.exports
  hasRequiredRainbow = 1
  ;(function (module) {
    module['exports'] = function (colors2) {
      var rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta']
      return function (letter, i, exploded) {
        if (letter === ' ') {
          return letter
        } else {
          return colors2[rainbowColors[i++ % rainbowColors.length]](letter)
        }
      }
    }
  })(rainbow)
  return rainbow.exports
}
var random = { exports: {} }
var hasRequiredRandom
function requireRandom() {
  if (hasRequiredRandom) return random.exports
  hasRequiredRandom = 1
  ;(function (module) {
    module['exports'] = function (colors2) {
      var available = [
        'underline',
        'inverse',
        'grey',
        'yellow',
        'red',
        'green',
        'blue',
        'white',
        'cyan',
        'magenta',
        'brightYellow',
        'brightRed',
        'brightGreen',
        'brightBlue',
        'brightWhite',
        'brightCyan',
        'brightMagenta',
      ]
      return function (letter, i, exploded) {
        return letter === ' '
          ? letter
          : colors2[available[Math.round(Math.random() * (available.length - 2))]](letter)
      }
    }
  })(random)
  return random.exports
}
var hasRequiredColors
function requireColors() {
  if (hasRequiredColors) return colors.exports
  hasRequiredColors = 1
  ;(function (module) {
    var colors2 = {}
    module['exports'] = colors2
    colors2.themes = {}
    var util2 = require$$0$2
    var ansiStyles = (colors2.styles = requireStyles())
    var defineProps = Object.defineProperties
    var newLineRegex = new RegExp(/[\r\n]+/g)
    colors2.supportsColor = requireSupportsColors().supportsColor
    if (typeof colors2.enabled === 'undefined') {
      colors2.enabled = colors2.supportsColor() !== false
    }
    colors2.enable = function () {
      colors2.enabled = true
    }
    colors2.disable = function () {
      colors2.enabled = false
    }
    colors2.stripColors = colors2.strip = function (str) {
      return ('' + str).replace(/\x1B\[\d+m/g, '')
    }
    colors2.stylize = function stylize(str, style) {
      if (!colors2.enabled) {
        return str + ''
      }
      var styleMap = ansiStyles[style]
      if (!styleMap && style in colors2) {
        return colors2[style](str)
      }
      return styleMap.open + str + styleMap.close
    }
    var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g
    var escapeStringRegexp = function (str) {
      if (typeof str !== 'string') {
        throw new TypeError('Expected a string')
      }
      return str.replace(matchOperatorsRe, '\\$&')
    }
    function build(_styles) {
      var builder = function builder2() {
        return applyStyle.apply(builder2, arguments)
      }
      builder._styles = _styles
      builder.__proto__ = proto
      return builder
    }
    var styles2 = (function () {
      var ret = {}
      ansiStyles.grey = ansiStyles.gray
      Object.keys(ansiStyles).forEach(function (key) {
        ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g')
        ret[key] = {
          get: function () {
            return build(this._styles.concat(key))
          },
        }
      })
      return ret
    })()
    var proto = defineProps(function colors3() {}, styles2)
    function applyStyle() {
      var args = Array.prototype.slice.call(arguments)
      var str = args
        .map(function (arg) {
          if (arg != null && arg.constructor === String) {
            return arg
          } else {
            return util2.inspect(arg)
          }
        })
        .join(' ')
      if (!colors2.enabled || !str) {
        return str
      }
      var newLinesPresent = str.indexOf('\n') != -1
      var nestedStyles = this._styles
      var i = nestedStyles.length
      while (i--) {
        var code = ansiStyles[nestedStyles[i]]
        str = code.open + str.replace(code.closeRe, code.open) + code.close
        if (newLinesPresent) {
          str = str.replace(newLineRegex, function (match) {
            return code.close + match + code.open
          })
        }
      }
      return str
    }
    colors2.setTheme = function (theme) {
      if (typeof theme === 'string') {
        console.log(
          "colors.setTheme now only accepts an object, not a string.  If you are trying to set a theme from a file, it is now your (the caller's) responsibility to require the file.  The old syntax looked like colors.setTheme(__dirname + '/../themes/generic-logging.js'); The new syntax looks like colors.setTheme(require(__dirname + '/../themes/generic-logging.js'));",
        )
        return
      }
      for (var style in theme) {
        ;(function (style2) {
          colors2[style2] = function (str) {
            if (typeof theme[style2] === 'object') {
              var out = str
              for (var i in theme[style2]) {
                out = colors2[theme[style2][i]](out)
              }
              return out
            }
            return colors2[theme[style2]](str)
          }
        })(style)
      }
    }
    function init() {
      var ret = {}
      Object.keys(styles2).forEach(function (name) {
        ret[name] = {
          get: function () {
            return build([name])
          },
        }
      })
      return ret
    }
    var sequencer = function sequencer2(map2, str) {
      var exploded = str.split('')
      exploded = exploded.map(map2)
      return exploded.join('')
    }
    colors2.trap = requireTrap()
    colors2.zalgo = requireZalgo()
    colors2.maps = {}
    colors2.maps.america = requireAmerica()(colors2)
    colors2.maps.zebra = requireZebra()(colors2)
    colors2.maps.rainbow = requireRainbow()(colors2)
    colors2.maps.random = requireRandom()(colors2)
    for (var map in colors2.maps) {
      ;(function (map2) {
        colors2[map2] = function (str) {
          return sequencer(colors2.maps[map2], str)
        }
      })(map)
    }
    defineProps(colors2, init())
  })(colors)
  return colors.exports
}
var hasRequiredSafe
function requireSafe() {
  if (hasRequiredSafe) return safe$1.exports
  hasRequiredSafe = 1
  ;(function (module) {
    var colors2 = requireColors()
    module['exports'] = colors2
  })(safe$1)
  return safe$1.exports
}
var tripleBeam = {}
var config$1 = {}
var cli$1 = {}
var hasRequiredCli$1
function requireCli$1() {
  if (hasRequiredCli$1) return cli$1
  hasRequiredCli$1 = 1
  cli$1.levels = {
    error: 0,
    warn: 1,
    help: 2,
    data: 3,
    info: 4,
    debug: 5,
    prompt: 6,
    verbose: 7,
    input: 8,
    silly: 9,
  }
  cli$1.colors = {
    error: 'red',
    warn: 'yellow',
    help: 'cyan',
    data: 'grey',
    info: 'green',
    debug: 'blue',
    prompt: 'grey',
    verbose: 'cyan',
    input: 'grey',
    silly: 'magenta',
  }
  return cli$1
}
var npm = {}
var hasRequiredNpm
function requireNpm() {
  if (hasRequiredNpm) return npm
  hasRequiredNpm = 1
  npm.levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  }
  npm.colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'green',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'magenta',
  }
  return npm
}
var syslog = {}
var hasRequiredSyslog
function requireSyslog() {
  if (hasRequiredSyslog) return syslog
  hasRequiredSyslog = 1
  syslog.levels = {
    emerg: 0,
    alert: 1,
    crit: 2,
    error: 3,
    warning: 4,
    notice: 5,
    info: 6,
    debug: 7,
  }
  syslog.colors = {
    emerg: 'red',
    alert: 'yellow',
    crit: 'red',
    error: 'red',
    warning: 'red',
    notice: 'yellow',
    info: 'green',
    debug: 'blue',
  }
  return syslog
}
var hasRequiredConfig$1
function requireConfig$1() {
  if (hasRequiredConfig$1) return config$1
  hasRequiredConfig$1 = 1
  ;(function (exports) {
    Object.defineProperty(exports, 'cli', {
      value: requireCli$1(),
    })
    Object.defineProperty(exports, 'npm', {
      value: requireNpm(),
    })
    Object.defineProperty(exports, 'syslog', {
      value: requireSyslog(),
    })
  })(config$1)
  return config$1
}
var hasRequiredTripleBeam
function requireTripleBeam() {
  if (hasRequiredTripleBeam) return tripleBeam
  hasRequiredTripleBeam = 1
  ;(function (exports) {
    Object.defineProperty(exports, 'LEVEL', {
      value: /* @__PURE__ */ Symbol.for('level'),
    })
    Object.defineProperty(exports, 'MESSAGE', {
      value: /* @__PURE__ */ Symbol.for('message'),
    })
    Object.defineProperty(exports, 'SPLAT', {
      value: /* @__PURE__ */ Symbol.for('splat'),
    })
    Object.defineProperty(exports, 'configs', {
      value: requireConfig$1(),
    })
  })(tripleBeam)
  return tripleBeam
}
var hasRequiredColorize
function requireColorize() {
  if (hasRequiredColorize) return colorize.exports
  hasRequiredColorize = 1
  const colors2 = requireSafe()
  const { LEVEL, MESSAGE } = requireTripleBeam()
  colors2.enabled = true
  const hasSpace = /\s+/
  class Colorizer {
    constructor(opts = {}) {
      if (opts.colors) {
        this.addColors(opts.colors)
      }
      this.options = opts
    }
    /*
     * Adds the colors Object to the set of allColors
     * known by the Colorizer
     *
     * @param {Object} colors Set of color mappings to add.
     */
    static addColors(clrs) {
      const nextColors = Object.keys(clrs).reduce((acc, level) => {
        acc[level] = hasSpace.test(clrs[level]) ? clrs[level].split(hasSpace) : clrs[level]
        return acc
      }, {})
      Colorizer.allColors = Object.assign({}, Colorizer.allColors || {}, nextColors)
      return Colorizer.allColors
    }
    /*
     * Adds the colors Object to the set of allColors
     * known by the Colorizer
     *
     * @param {Object} colors Set of color mappings to add.
     */
    addColors(clrs) {
      return Colorizer.addColors(clrs)
    }
    /*
     * function colorize (lookup, level, message)
     * Performs multi-step colorization using @colors/colors/safe
     */
    colorize(lookup, level, message) {
      if (typeof message === 'undefined') {
        message = level
      }
      if (!Array.isArray(Colorizer.allColors[lookup])) {
        return colors2[Colorizer.allColors[lookup]](message)
      }
      for (let i = 0, len = Colorizer.allColors[lookup].length; i < len; i++) {
        message = colors2[Colorizer.allColors[lookup][i]](message)
      }
      return message
    }
    /*
     * function transform (info, opts)
     * Attempts to colorize the { level, message } of the given
     * `logform` info object.
     */
    transform(info, opts) {
      if (opts.all && typeof info[MESSAGE] === 'string') {
        info[MESSAGE] = this.colorize(info[LEVEL], info.level, info[MESSAGE])
      }
      if (opts.level || opts.all || !opts.message) {
        info.level = this.colorize(info[LEVEL], info.level)
      }
      if (opts.all || opts.message) {
        info.message = this.colorize(info[LEVEL], info.level, info.message)
      }
      return info
    }
  }
  colorize.exports = (opts) => new Colorizer(opts)
  colorize.exports.Colorizer = colorize.exports.Format = Colorizer
  return colorize.exports
}
var levels
var hasRequiredLevels
function requireLevels() {
  if (hasRequiredLevels) return levels
  hasRequiredLevels = 1
  const { Colorizer } = requireColorize()
  levels = (config2) => {
    Colorizer.addColors(config2.colors || config2)
    return config2
  }
  return levels
}
var align
var hasRequiredAlign
function requireAlign() {
  if (hasRequiredAlign) return align
  hasRequiredAlign = 1
  const format2 = requireFormat()
  align = format2((info) => {
    info.message = `	${info.message}`
    return info
  })
  return align
}
var errors$1
var hasRequiredErrors$1
function requireErrors$1() {
  if (hasRequiredErrors$1) return errors$1
  hasRequiredErrors$1 = 1
  const format2 = requireFormat()
  const { LEVEL, MESSAGE } = requireTripleBeam()
  errors$1 = format2((einfo, { stack, cause }) => {
    if (einfo instanceof Error) {
      const info = Object.assign({}, einfo, {
        level: einfo.level,
        [LEVEL]: einfo[LEVEL] || einfo.level,
        message: einfo.message,
        [MESSAGE]: einfo[MESSAGE] || einfo.message,
      })
      if (stack) info.stack = einfo.stack
      if (cause) info.cause = einfo.cause
      return info
    }
    if (!(einfo.message instanceof Error)) return einfo
    const err2 = einfo.message
    Object.assign(einfo, err2)
    einfo.message = err2.message
    einfo[MESSAGE] = err2.message
    if (stack) einfo.stack = err2.stack
    if (cause) einfo.cause = err2.cause
    return einfo
  })
  return errors$1
}
var cli = { exports: {} }
var padLevels = { exports: {} }
var hasRequiredPadLevels
function requirePadLevels() {
  if (hasRequiredPadLevels) return padLevels.exports
  hasRequiredPadLevels = 1
  const { configs, LEVEL, MESSAGE } = requireTripleBeam()
  class Padder {
    constructor(opts = { levels: configs.npm.levels }) {
      this.paddings = Padder.paddingForLevels(opts.levels, opts.filler)
      this.options = opts
    }
    /**
     * Returns the maximum length of keys in the specified `levels` Object.
     * @param  {Object} levels Set of all levels to calculate longest level against.
     * @returns {Number} Maximum length of the longest level string.
     */
    static getLongestLevel(levels2) {
      const lvls = Object.keys(levels2).map((level) => level.length)
      return Math.max(...lvls)
    }
    /**
     * Returns the padding for the specified `level` assuming that the
     * maximum length of all levels it's associated with is `maxLength`.
     * @param  {String} level Level to calculate padding for.
     * @param  {String} filler Repeatable text to use for padding.
     * @param  {Number} maxLength Length of the longest level
     * @returns {String} Padding string for the `level`
     */
    static paddingForLevel(level, filler, maxLength) {
      const targetLen = maxLength + 1 - level.length
      const rep = Math.floor(targetLen / filler.length)
      const padding = `${filler}${filler.repeat(rep)}`
      return padding.slice(0, targetLen)
    }
    /**
     * Returns an object with the string paddings for the given `levels`
     * using the specified `filler`.
     * @param  {Object} levels Set of all levels to calculate padding for.
     * @param  {String} filler Repeatable text to use for padding.
     * @returns {Object} Mapping of level to desired padding.
     */
    static paddingForLevels(levels2, filler = ' ') {
      const maxLength = Padder.getLongestLevel(levels2)
      return Object.keys(levels2).reduce((acc, level) => {
        acc[level] = Padder.paddingForLevel(level, filler, maxLength)
        return acc
      }, {})
    }
    /**
     * Prepends the padding onto the `message` based on the `LEVEL` of
     * the `info`. This is based on the behavior of `winston@2` which also
     * prepended the level onto the message.
     *
     * See: https://github.com/winstonjs/winston/blob/2.x/lib/winston/logger.js#L198-L201
     *
     * @param  {Info} info Logform info object
     * @param  {Object} opts Options passed along to this instance.
     * @returns {Info} Modified logform info object.
     */
    transform(info, opts) {
      info.message = `${this.paddings[info[LEVEL]]}${info.message}`
      if (info[MESSAGE]) {
        info[MESSAGE] = `${this.paddings[info[LEVEL]]}${info[MESSAGE]}`
      }
      return info
    }
  }
  padLevels.exports = (opts) => new Padder(opts)
  padLevels.exports.Padder = padLevels.exports.Format = Padder
  return padLevels.exports
}
var hasRequiredCli
function requireCli() {
  if (hasRequiredCli) return cli.exports
  hasRequiredCli = 1
  const { Colorizer } = requireColorize()
  const { Padder } = requirePadLevels()
  const { configs, MESSAGE } = requireTripleBeam()
  class CliFormat {
    constructor(opts = {}) {
      if (!opts.levels) {
        opts.levels = configs.cli.levels
      }
      this.colorizer = new Colorizer(opts)
      this.padder = new Padder(opts)
      this.options = opts
    }
    /*
     * function transform (info, opts)
     * Attempts to both:
     * 1. Pad the { level }
     * 2. Colorize the { level, message }
     * of the given `logform` info object depending on the `opts`.
     */
    transform(info, opts) {
      this.colorizer.transform(this.padder.transform(info, opts), opts)
      info[MESSAGE] = `${info.level}:${info.message}`
      return info
    }
  }
  cli.exports = (opts) => new CliFormat(opts)
  cli.exports.Format = CliFormat
  return cli.exports
}
var combine = { exports: {} }
var hasRequiredCombine
function requireCombine() {
  if (hasRequiredCombine) return combine.exports
  hasRequiredCombine = 1
  const format2 = requireFormat()
  function cascade(formats) {
    if (!formats.every(isValidFormat)) {
      return
    }
    return (info) => {
      let obj = info
      for (let i = 0; i < formats.length; i++) {
        obj = formats[i].transform(obj, formats[i].options)
        if (!obj) {
          return false
        }
      }
      return obj
    }
  }
  function isValidFormat(fmt) {
    if (typeof fmt.transform !== 'function') {
      throw new Error(
        [
          'No transform function found on format. Did you create a format instance?',
          'const myFormat = format(formatFn);',
          'const instance = myFormat();',
        ].join('\n'),
      )
    }
    return true
  }
  combine.exports = (...formats) => {
    const combinedFormat = format2(cascade(formats))
    const instance = combinedFormat()
    instance.Format = combinedFormat.Format
    return instance
  }
  combine.exports.cascade = cascade
  return combine.exports
}
var safeStableStringify = { exports: {} }
var hasRequiredSafeStableStringify
function requireSafeStableStringify() {
  if (hasRequiredSafeStableStringify) return safeStableStringify.exports
  hasRequiredSafeStableStringify = 1
  ;(function (module, exports) {
    const { hasOwnProperty } = Object.prototype
    const stringify = configure()
    stringify.configure = configure
    stringify.stringify = stringify
    stringify.default = stringify
    exports.stringify = stringify
    exports.configure = configure
    module.exports = stringify
    const strEscapeSequencesRegExp = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/
    function strEscape(str) {
      if (str.length < 5e3 && !strEscapeSequencesRegExp.test(str)) {
        return `"${str}"`
      }
      return JSON.stringify(str)
    }
    function sort(array, comparator) {
      if (array.length > 200 || comparator) {
        return array.sort(comparator)
      }
      for (let i = 1; i < array.length; i++) {
        const currentValue = array[i]
        let position = i
        while (position !== 0 && array[position - 1] > currentValue) {
          array[position] = array[position - 1]
          position--
        }
        array[position] = currentValue
      }
      return array
    }
    const typedArrayPrototypeGetSymbolToStringTag = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(Object.getPrototypeOf(new Int8Array())),
      Symbol.toStringTag,
    ).get
    function isTypedArrayWithEntries(value) {
      return typedArrayPrototypeGetSymbolToStringTag.call(value) !== void 0 && value.length !== 0
    }
    function stringifyTypedArray(array, separator, maximumBreadth) {
      if (array.length < maximumBreadth) {
        maximumBreadth = array.length
      }
      const whitespace = separator === ',' ? '' : ' '
      let res = `"0":${whitespace}${array[0]}`
      for (let i = 1; i < maximumBreadth; i++) {
        res += `${separator}"${i}":${whitespace}${array[i]}`
      }
      return res
    }
    function getCircularValueOption(options) {
      if (hasOwnProperty.call(options, 'circularValue')) {
        const circularValue = options.circularValue
        if (typeof circularValue === 'string') {
          return `"${circularValue}"`
        }
        if (circularValue == null) {
          return circularValue
        }
        if (circularValue === Error || circularValue === TypeError) {
          return {
            toString() {
              throw new TypeError('Converting circular structure to JSON')
            },
          }
        }
        throw new TypeError(
          'The "circularValue" argument must be of type string or the value null or undefined',
        )
      }
      return '"[Circular]"'
    }
    function getDeterministicOption(options) {
      let value
      if (hasOwnProperty.call(options, 'deterministic')) {
        value = options.deterministic
        if (typeof value !== 'boolean' && typeof value !== 'function') {
          throw new TypeError(
            'The "deterministic" argument must be of type boolean or comparator function',
          )
        }
      }
      return value === void 0 ? true : value
    }
    function getBooleanOption(options, key) {
      let value
      if (hasOwnProperty.call(options, key)) {
        value = options[key]
        if (typeof value !== 'boolean') {
          throw new TypeError(`The "${key}" argument must be of type boolean`)
        }
      }
      return value === void 0 ? true : value
    }
    function getPositiveIntegerOption(options, key) {
      let value
      if (hasOwnProperty.call(options, key)) {
        value = options[key]
        if (typeof value !== 'number') {
          throw new TypeError(`The "${key}" argument must be of type number`)
        }
        if (!Number.isInteger(value)) {
          throw new TypeError(`The "${key}" argument must be an integer`)
        }
        if (value < 1) {
          throw new RangeError(`The "${key}" argument must be >= 1`)
        }
      }
      return value === void 0 ? Infinity : value
    }
    function getItemCount(number) {
      if (number === 1) {
        return '1 item'
      }
      return `${number} items`
    }
    function getUniqueReplacerSet(replacerArray) {
      const replacerSet = /* @__PURE__ */ new Set()
      for (const value of replacerArray) {
        if (typeof value === 'string' || typeof value === 'number') {
          replacerSet.add(String(value))
        }
      }
      return replacerSet
    }
    function getStrictOption(options) {
      if (hasOwnProperty.call(options, 'strict')) {
        const value = options.strict
        if (typeof value !== 'boolean') {
          throw new TypeError('The "strict" argument must be of type boolean')
        }
        if (value) {
          return (value2) => {
            let message = `Object can not safely be stringified. Received type ${typeof value2}`
            if (typeof value2 !== 'function') message += ` (${value2.toString()})`
            throw new Error(message)
          }
        }
      }
    }
    function configure(options) {
      options = { ...options }
      const fail = getStrictOption(options)
      if (fail) {
        if (options.bigint === void 0) {
          options.bigint = false
        }
        if (!('circularValue' in options)) {
          options.circularValue = Error
        }
      }
      const circularValue = getCircularValueOption(options)
      const bigint = getBooleanOption(options, 'bigint')
      const deterministic = getDeterministicOption(options)
      const comparator = typeof deterministic === 'function' ? deterministic : void 0
      const maximumDepth = getPositiveIntegerOption(options, 'maximumDepth')
      const maximumBreadth = getPositiveIntegerOption(options, 'maximumBreadth')
      function stringifyFnReplacer(key, parent, stack, replacer, spacer, indentation) {
        let value = parent[key]
        if (typeof value === 'object' && value !== null && typeof value.toJSON === 'function') {
          value = value.toJSON(key)
        }
        value = replacer.call(parent, key, value)
        switch (typeof value) {
          case 'string':
            return strEscape(value)
          case 'object': {
            if (value === null) {
              return 'null'
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue
            }
            let res = ''
            let join2 = ','
            const originalIndentation = indentation
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return '[]'
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"'
              }
              stack.push(value)
              if (spacer !== '') {
                indentation += spacer
                res += `
${indentation}`
                join2 = `,
${indentation}`
              }
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth)
              let i = 0
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyFnReplacer(
                  String(i),
                  value,
                  stack,
                  replacer,
                  spacer,
                  indentation,
                )
                res += tmp2 !== void 0 ? tmp2 : 'null'
                res += join2
              }
              const tmp = stringifyFnReplacer(
                String(i),
                value,
                stack,
                replacer,
                spacer,
                indentation,
              )
              res += tmp !== void 0 ? tmp : 'null'
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1
                res += `${join2}"... ${getItemCount(removedKeys)} not stringified"`
              }
              if (spacer !== '') {
                res += `
${originalIndentation}`
              }
              stack.pop()
              return `[${res}]`
            }
            let keys = Object.keys(value)
            const keyLength = keys.length
            if (keyLength === 0) {
              return '{}'
            }
            if (maximumDepth < stack.length + 1) {
              return '"[Object]"'
            }
            let whitespace = ''
            let separator = ''
            if (spacer !== '') {
              indentation += spacer
              join2 = `,
${indentation}`
              whitespace = ' '
            }
            const maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth)
            if (deterministic && !isTypedArrayWithEntries(value)) {
              keys = sort(keys, comparator)
            }
            stack.push(value)
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i]
              const tmp = stringifyFnReplacer(key2, value, stack, replacer, spacer, indentation)
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}:${whitespace}${tmp}`
                separator = join2
              }
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth
              res += `${separator}"...":${whitespace}"${getItemCount(removedKeys)} not stringified"`
              separator = join2
            }
            if (spacer !== '' && separator.length > 1) {
              res = `
${indentation}${res}
${originalIndentation}`
            }
            stack.pop()
            return `{${res}}`
          }
          case 'number':
            return isFinite(value) ? String(value) : fail ? fail(value) : 'null'
          case 'boolean':
            return value === true ? 'true' : 'false'
          case 'undefined':
            return void 0
          case 'bigint':
            if (bigint) {
              return String(value)
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0
        }
      }
      function stringifyArrayReplacer(key, value, stack, replacer, spacer, indentation) {
        if (typeof value === 'object' && value !== null && typeof value.toJSON === 'function') {
          value = value.toJSON(key)
        }
        switch (typeof value) {
          case 'string':
            return strEscape(value)
          case 'object': {
            if (value === null) {
              return 'null'
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue
            }
            const originalIndentation = indentation
            let res = ''
            let join2 = ','
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return '[]'
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"'
              }
              stack.push(value)
              if (spacer !== '') {
                indentation += spacer
                res += `
${indentation}`
                join2 = `,
${indentation}`
              }
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth)
              let i = 0
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyArrayReplacer(
                  String(i),
                  value[i],
                  stack,
                  replacer,
                  spacer,
                  indentation,
                )
                res += tmp2 !== void 0 ? tmp2 : 'null'
                res += join2
              }
              const tmp = stringifyArrayReplacer(
                String(i),
                value[i],
                stack,
                replacer,
                spacer,
                indentation,
              )
              res += tmp !== void 0 ? tmp : 'null'
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1
                res += `${join2}"... ${getItemCount(removedKeys)} not stringified"`
              }
              if (spacer !== '') {
                res += `
${originalIndentation}`
              }
              stack.pop()
              return `[${res}]`
            }
            stack.push(value)
            let whitespace = ''
            if (spacer !== '') {
              indentation += spacer
              join2 = `,
${indentation}`
              whitespace = ' '
            }
            let separator = ''
            for (const key2 of replacer) {
              const tmp = stringifyArrayReplacer(
                key2,
                value[key2],
                stack,
                replacer,
                spacer,
                indentation,
              )
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}:${whitespace}${tmp}`
                separator = join2
              }
            }
            if (spacer !== '' && separator.length > 1) {
              res = `
${indentation}${res}
${originalIndentation}`
            }
            stack.pop()
            return `{${res}}`
          }
          case 'number':
            return isFinite(value) ? String(value) : fail ? fail(value) : 'null'
          case 'boolean':
            return value === true ? 'true' : 'false'
          case 'undefined':
            return void 0
          case 'bigint':
            if (bigint) {
              return String(value)
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0
        }
      }
      function stringifyIndent(key, value, stack, spacer, indentation) {
        switch (typeof value) {
          case 'string':
            return strEscape(value)
          case 'object': {
            if (value === null) {
              return 'null'
            }
            if (typeof value.toJSON === 'function') {
              value = value.toJSON(key)
              if (typeof value !== 'object') {
                return stringifyIndent(key, value, stack, spacer, indentation)
              }
              if (value === null) {
                return 'null'
              }
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue
            }
            const originalIndentation = indentation
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return '[]'
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"'
              }
              stack.push(value)
              indentation += spacer
              let res2 = `
${indentation}`
              const join3 = `,
${indentation}`
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth)
              let i = 0
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyIndent(String(i), value[i], stack, spacer, indentation)
                res2 += tmp2 !== void 0 ? tmp2 : 'null'
                res2 += join3
              }
              const tmp = stringifyIndent(String(i), value[i], stack, spacer, indentation)
              res2 += tmp !== void 0 ? tmp : 'null'
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1
                res2 += `${join3}"... ${getItemCount(removedKeys)} not stringified"`
              }
              res2 += `
${originalIndentation}`
              stack.pop()
              return `[${res2}]`
            }
            let keys = Object.keys(value)
            const keyLength = keys.length
            if (keyLength === 0) {
              return '{}'
            }
            if (maximumDepth < stack.length + 1) {
              return '"[Object]"'
            }
            indentation += spacer
            const join2 = `,
${indentation}`
            let res = ''
            let separator = ''
            let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth)
            if (isTypedArrayWithEntries(value)) {
              res += stringifyTypedArray(value, join2, maximumBreadth)
              keys = keys.slice(value.length)
              maximumPropertiesToStringify -= value.length
              separator = join2
            }
            if (deterministic) {
              keys = sort(keys, comparator)
            }
            stack.push(value)
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i]
              const tmp = stringifyIndent(key2, value[key2], stack, spacer, indentation)
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}: ${tmp}`
                separator = join2
              }
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth
              res += `${separator}"...": "${getItemCount(removedKeys)} not stringified"`
              separator = join2
            }
            if (separator !== '') {
              res = `
${indentation}${res}
${originalIndentation}`
            }
            stack.pop()
            return `{${res}}`
          }
          case 'number':
            return isFinite(value) ? String(value) : fail ? fail(value) : 'null'
          case 'boolean':
            return value === true ? 'true' : 'false'
          case 'undefined':
            return void 0
          case 'bigint':
            if (bigint) {
              return String(value)
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0
        }
      }
      function stringifySimple(key, value, stack) {
        switch (typeof value) {
          case 'string':
            return strEscape(value)
          case 'object': {
            if (value === null) {
              return 'null'
            }
            if (typeof value.toJSON === 'function') {
              value = value.toJSON(key)
              if (typeof value !== 'object') {
                return stringifySimple(key, value, stack)
              }
              if (value === null) {
                return 'null'
              }
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue
            }
            let res = ''
            const hasLength = value.length !== void 0
            if (hasLength && Array.isArray(value)) {
              if (value.length === 0) {
                return '[]'
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"'
              }
              stack.push(value)
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth)
              let i = 0
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifySimple(String(i), value[i], stack)
                res += tmp2 !== void 0 ? tmp2 : 'null'
                res += ','
              }
              const tmp = stringifySimple(String(i), value[i], stack)
              res += tmp !== void 0 ? tmp : 'null'
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1
                res += `,"... ${getItemCount(removedKeys)} not stringified"`
              }
              stack.pop()
              return `[${res}]`
            }
            let keys = Object.keys(value)
            const keyLength = keys.length
            if (keyLength === 0) {
              return '{}'
            }
            if (maximumDepth < stack.length + 1) {
              return '"[Object]"'
            }
            let separator = ''
            let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth)
            if (hasLength && isTypedArrayWithEntries(value)) {
              res += stringifyTypedArray(value, ',', maximumBreadth)
              keys = keys.slice(value.length)
              maximumPropertiesToStringify -= value.length
              separator = ','
            }
            if (deterministic) {
              keys = sort(keys, comparator)
            }
            stack.push(value)
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i]
              const tmp = stringifySimple(key2, value[key2], stack)
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}:${tmp}`
                separator = ','
              }
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth
              res += `${separator}"...":"${getItemCount(removedKeys)} not stringified"`
            }
            stack.pop()
            return `{${res}}`
          }
          case 'number':
            return isFinite(value) ? String(value) : fail ? fail(value) : 'null'
          case 'boolean':
            return value === true ? 'true' : 'false'
          case 'undefined':
            return void 0
          case 'bigint':
            if (bigint) {
              return String(value)
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0
        }
      }
      function stringify2(value, replacer, space) {
        if (arguments.length > 1) {
          let spacer = ''
          if (typeof space === 'number') {
            spacer = ' '.repeat(Math.min(space, 10))
          } else if (typeof space === 'string') {
            spacer = space.slice(0, 10)
          }
          if (replacer != null) {
            if (typeof replacer === 'function') {
              return stringifyFnReplacer('', { '': value }, [], replacer, spacer, '')
            }
            if (Array.isArray(replacer)) {
              return stringifyArrayReplacer(
                '',
                value,
                [],
                getUniqueReplacerSet(replacer),
                spacer,
                '',
              )
            }
          }
          if (spacer.length !== 0) {
            return stringifyIndent('', value, [], spacer, '')
          }
        }
        return stringifySimple('', value, [])
      }
      return stringify2
    }
  })(safeStableStringify, safeStableStringify.exports)
  return safeStableStringify.exports
}
var json
var hasRequiredJson
function requireJson() {
  if (hasRequiredJson) return json
  hasRequiredJson = 1
  const format2 = requireFormat()
  const { MESSAGE } = requireTripleBeam()
  const stringify = requireSafeStableStringify()
  function replacer(key, value) {
    if (typeof value === 'bigint') return value.toString()
    return value
  }
  json = format2((info, opts) => {
    const jsonStringify = stringify.configure(opts)
    info[MESSAGE] = jsonStringify(info, opts.replacer || replacer, opts.space)
    return info
  })
  return json
}
var label
var hasRequiredLabel
function requireLabel() {
  if (hasRequiredLabel) return label
  hasRequiredLabel = 1
  const format2 = requireFormat()
  label = format2((info, opts) => {
    if (opts.message) {
      info.message = `[${opts.label}] ${info.message}`
      return info
    }
    info.label = opts.label
    return info
  })
  return label
}
var logstash
var hasRequiredLogstash
function requireLogstash() {
  if (hasRequiredLogstash) return logstash
  hasRequiredLogstash = 1
  const format2 = requireFormat()
  const { MESSAGE } = requireTripleBeam()
  const jsonStringify = requireSafeStableStringify()
  logstash = format2((info) => {
    const logstash2 = {}
    if (info.message) {
      logstash2['@message'] = info.message
      delete info.message
    }
    if (info.timestamp) {
      logstash2['@timestamp'] = info.timestamp
      delete info.timestamp
    }
    logstash2['@fields'] = info
    info[MESSAGE] = jsonStringify(logstash2)
    return info
  })
  return logstash
}
var metadata
var hasRequiredMetadata
function requireMetadata() {
  if (hasRequiredMetadata) return metadata
  hasRequiredMetadata = 1
  const format2 = requireFormat()
  function fillExcept(info, fillExceptKeys, metadataKey) {
    const savedKeys = fillExceptKeys.reduce((acc, key) => {
      acc[key] = info[key]
      delete info[key]
      return acc
    }, {})
    const metadata2 = Object.keys(info).reduce((acc, key) => {
      acc[key] = info[key]
      delete info[key]
      return acc
    }, {})
    Object.assign(info, savedKeys, {
      [metadataKey]: metadata2,
    })
    return info
  }
  function fillWith(info, fillWithKeys, metadataKey) {
    info[metadataKey] = fillWithKeys.reduce((acc, key) => {
      acc[key] = info[key]
      delete info[key]
      return acc
    }, {})
    return info
  }
  metadata = format2((info, opts = {}) => {
    let metadataKey = 'metadata'
    if (opts.key) {
      metadataKey = opts.key
    }
    let fillExceptKeys = []
    if (!opts.fillExcept && !opts.fillWith) {
      fillExceptKeys.push('level')
      fillExceptKeys.push('message')
    }
    if (opts.fillExcept) {
      fillExceptKeys = opts.fillExcept
    }
    if (fillExceptKeys.length > 0) {
      return fillExcept(info, fillExceptKeys, metadataKey)
    }
    if (opts.fillWith) {
      return fillWith(info, opts.fillWith, metadataKey)
    }
    return info
  })
  return metadata
}
var ms
var hasRequiredMs$1
function requireMs$1() {
  if (hasRequiredMs$1) return ms
  hasRequiredMs$1 = 1
  var s = 1e3
  var m = s * 60
  var h = m * 60
  var d = h * 24
  var w = d * 7
  var y = d * 365.25
  ms = function (val, options) {
    options = options || {}
    var type = typeof val
    if (type === 'string' && val.length > 0) {
      return parse2(val)
    } else if (type === 'number' && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val)
    }
    throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val))
  }
  function parse2(str) {
    str = String(str)
    if (str.length > 100) {
      return
    }
    var match =
      /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str,
      )
    if (!match) {
      return
    }
    var n = parseFloat(match[1])
    var type = (match[2] || 'ms').toLowerCase()
    switch (type) {
      case 'years':
      case 'year':
      case 'yrs':
      case 'yr':
      case 'y':
        return n * y
      case 'weeks':
      case 'week':
      case 'w':
        return n * w
      case 'days':
      case 'day':
      case 'd':
        return n * d
      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return n * h
      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return n * m
      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return n * s
      case 'milliseconds':
      case 'millisecond':
      case 'msecs':
      case 'msec':
      case 'ms':
        return n
      default:
        return void 0
    }
  }
  function fmtShort(ms2) {
    var msAbs = Math.abs(ms2)
    if (msAbs >= d) {
      return Math.round(ms2 / d) + 'd'
    }
    if (msAbs >= h) {
      return Math.round(ms2 / h) + 'h'
    }
    if (msAbs >= m) {
      return Math.round(ms2 / m) + 'm'
    }
    if (msAbs >= s) {
      return Math.round(ms2 / s) + 's'
    }
    return ms2 + 'ms'
  }
  function fmtLong(ms2) {
    var msAbs = Math.abs(ms2)
    if (msAbs >= d) {
      return plural(ms2, msAbs, d, 'day')
    }
    if (msAbs >= h) {
      return plural(ms2, msAbs, h, 'hour')
    }
    if (msAbs >= m) {
      return plural(ms2, msAbs, m, 'minute')
    }
    if (msAbs >= s) {
      return plural(ms2, msAbs, s, 'second')
    }
    return ms2 + ' ms'
  }
  function plural(ms2, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5
    return Math.round(ms2 / n) + ' ' + name + (isPlural ? 's' : '')
  }
  return ms
}
var ms_1
var hasRequiredMs
function requireMs() {
  if (hasRequiredMs) return ms_1
  hasRequiredMs = 1
  const format2 = requireFormat()
  const ms2 = requireMs$1()
  ms_1 = format2((info) => {
    const curr = +(/* @__PURE__ */ new Date())
    this.diff = curr - (this.prevTime || curr)
    this.prevTime = curr
    info.ms = `+${ms2(this.diff)}`
    return info
  })
  return ms_1
}
var prettyPrint
var hasRequiredPrettyPrint
function requirePrettyPrint() {
  if (hasRequiredPrettyPrint) return prettyPrint
  hasRequiredPrettyPrint = 1
  const inspect = require$$0$2.inspect
  const format2 = requireFormat()
  const { LEVEL, MESSAGE, SPLAT } = requireTripleBeam()
  prettyPrint = format2((info, opts = {}) => {
    const stripped = Object.assign({}, info)
    delete stripped[LEVEL]
    delete stripped[MESSAGE]
    delete stripped[SPLAT]
    info[MESSAGE] = inspect(stripped, false, opts.depth || null, opts.colorize)
    return info
  })
  return prettyPrint
}
var printf = { exports: {} }
var hasRequiredPrintf
function requirePrintf() {
  if (hasRequiredPrintf) return printf.exports
  hasRequiredPrintf = 1
  const { MESSAGE } = requireTripleBeam()
  class Printf {
    constructor(templateFn) {
      this.template = templateFn
    }
    transform(info) {
      info[MESSAGE] = this.template(info)
      return info
    }
  }
  printf.exports = (opts) => new Printf(opts)
  printf.exports.Printf = printf.exports.Format = Printf
  return printf.exports
}
var simple
var hasRequiredSimple
function requireSimple() {
  if (hasRequiredSimple) return simple
  hasRequiredSimple = 1
  const format2 = requireFormat()
  const { MESSAGE } = requireTripleBeam()
  const jsonStringify = requireSafeStableStringify()
  simple = format2((info) => {
    const stringifiedRest = jsonStringify(
      Object.assign({}, info, {
        level: void 0,
        message: void 0,
        splat: void 0,
      }),
    )
    const padding = (info.padding && info.padding[info.level]) || ''
    if (stringifiedRest !== '{}') {
      info[MESSAGE] = `${info.level}:${padding} ${info.message} ${stringifiedRest}`
    } else {
      info[MESSAGE] = `${info.level}:${padding} ${info.message}`
    }
    return info
  })
  return simple
}
var splat
var hasRequiredSplat
function requireSplat() {
  if (hasRequiredSplat) return splat
  hasRequiredSplat = 1
  const util2 = require$$0$2
  const { SPLAT } = requireTripleBeam()
  const formatRegExp = /%[scdjifoO%]/g
  const escapedPercent = /%%/g
  class Splatter {
    constructor(opts) {
      this.options = opts
    }
    /**
     * Check to see if tokens <= splat.length, assign { splat, meta } into the
     * `info` accordingly, and write to this instance.
     *
     * @param  {Info} info Logform info message.
     * @param  {String[]} tokens Set of string interpolation tokens.
     * @returns {Info} Modified info message
     * @private
     */
    _splat(info, tokens) {
      const msg = info.message
      const splat2 = info[SPLAT] || info.splat || []
      const percents = msg.match(escapedPercent)
      const escapes = (percents && percents.length) || 0
      const expectedSplat = tokens.length - escapes
      const extraSplat = expectedSplat - splat2.length
      const metas = extraSplat < 0 ? splat2.splice(extraSplat, -1 * extraSplat) : []
      const metalen = metas.length
      if (metalen) {
        for (let i = 0; i < metalen; i++) {
          Object.assign(info, metas[i])
        }
      }
      info.message = util2.format(msg, ...splat2)
      return info
    }
    /**
     * Transforms the `info` message by using `util.format` to complete
     * any `info.message` provided it has string interpolation tokens.
     * If no tokens exist then `info` is immutable.
     *
     * @param  {Info} info Logform info message.
     * @param  {Object} opts Options for this instance.
     * @returns {Info} Modified info message
     */
    transform(info) {
      const msg = info.message
      const splat2 = info[SPLAT] || info.splat
      if (!splat2 || !splat2.length) {
        return info
      }
      const tokens = msg && msg.match && msg.match(formatRegExp)
      if (!tokens && (splat2 || splat2.length)) {
        const metas = splat2.length > 1 ? splat2.splice(0) : splat2
        const metalen = metas.length
        if (metalen) {
          for (let i = 0; i < metalen; i++) {
            Object.assign(info, metas[i])
          }
        }
        return info
      }
      if (tokens) {
        return this._splat(info, tokens)
      }
      return info
    }
  }
  splat = (opts) => new Splatter(opts)
  return splat
}
var token = /d{1,4}|M{1,4}|YY(?:YY)?|S{1,3}|Do|ZZ|Z|([HhMsDm])\1?|[aA]|"[^"]*"|'[^']*'/g
var twoDigitsOptional = '\\d\\d?'
var twoDigits = '\\d\\d'
var threeDigits = '\\d{3}'
var fourDigits = '\\d{4}'
var word = '[^\\s]+'
var literal = /\[([^]*?)\]/gm
function shorten(arr, sLen) {
  var newArr = []
  for (var i = 0, len = arr.length; i < len; i++) {
    newArr.push(arr[i].substr(0, sLen))
  }
  return newArr
}
var monthUpdate = function (arrName) {
  return function (v, i18n) {
    var lowerCaseArr = i18n[arrName].map(function (v2) {
      return v2.toLowerCase()
    })
    var index = lowerCaseArr.indexOf(v.toLowerCase())
    if (index > -1) {
      return index
    }
    return null
  }
}
function assign(origObj) {
  var args = []
  for (var _i = 1; _i < arguments.length; _i++) {
    args[_i - 1] = arguments[_i]
  }
  for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
    var obj = args_1[_a]
    for (var key in obj) {
      origObj[key] = obj[key]
    }
  }
  return origObj
}
var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
var monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
var monthNamesShort = shorten(monthNames, 3)
var dayNamesShort = shorten(dayNames, 3)
var defaultI18n = {
  dayNamesShort,
  dayNames,
  monthNamesShort,
  monthNames,
  amPm: ['am', 'pm'],
  DoFn: function (dayOfMonth) {
    return (
      dayOfMonth +
      ['th', 'st', 'nd', 'rd'][
        dayOfMonth % 10 > 3
          ? 0
          : ((dayOfMonth - (dayOfMonth % 10) !== 10 ? 1 : 0) * dayOfMonth) % 10
      ]
    )
  },
}
var globalI18n = assign({}, defaultI18n)
var setGlobalDateI18n = function (i18n) {
  return (globalI18n = assign(globalI18n, i18n))
}
var regexEscape = function (str) {
  return str.replace(/[|\\{()[^$+*?.-]/g, '\\$&')
}
var pad = function (val, len) {
  if (len === void 0) {
    len = 2
  }
  val = String(val)
  while (val.length < len) {
    val = '0' + val
  }
  return val
}
var formatFlags = {
  D: function (dateObj) {
    return String(dateObj.getDate())
  },
  DD: function (dateObj) {
    return pad(dateObj.getDate())
  },
  Do: function (dateObj, i18n) {
    return i18n.DoFn(dateObj.getDate())
  },
  d: function (dateObj) {
    return String(dateObj.getDay())
  },
  dd: function (dateObj) {
    return pad(dateObj.getDay())
  },
  ddd: function (dateObj, i18n) {
    return i18n.dayNamesShort[dateObj.getDay()]
  },
  dddd: function (dateObj, i18n) {
    return i18n.dayNames[dateObj.getDay()]
  },
  M: function (dateObj) {
    return String(dateObj.getMonth() + 1)
  },
  MM: function (dateObj) {
    return pad(dateObj.getMonth() + 1)
  },
  MMM: function (dateObj, i18n) {
    return i18n.monthNamesShort[dateObj.getMonth()]
  },
  MMMM: function (dateObj, i18n) {
    return i18n.monthNames[dateObj.getMonth()]
  },
  YY: function (dateObj) {
    return pad(String(dateObj.getFullYear()), 4).substr(2)
  },
  YYYY: function (dateObj) {
    return pad(dateObj.getFullYear(), 4)
  },
  h: function (dateObj) {
    return String(dateObj.getHours() % 12 || 12)
  },
  hh: function (dateObj) {
    return pad(dateObj.getHours() % 12 || 12)
  },
  H: function (dateObj) {
    return String(dateObj.getHours())
  },
  HH: function (dateObj) {
    return pad(dateObj.getHours())
  },
  m: function (dateObj) {
    return String(dateObj.getMinutes())
  },
  mm: function (dateObj) {
    return pad(dateObj.getMinutes())
  },
  s: function (dateObj) {
    return String(dateObj.getSeconds())
  },
  ss: function (dateObj) {
    return pad(dateObj.getSeconds())
  },
  S: function (dateObj) {
    return String(Math.round(dateObj.getMilliseconds() / 100))
  },
  SS: function (dateObj) {
    return pad(Math.round(dateObj.getMilliseconds() / 10), 2)
  },
  SSS: function (dateObj) {
    return pad(dateObj.getMilliseconds(), 3)
  },
  a: function (dateObj, i18n) {
    return dateObj.getHours() < 12 ? i18n.amPm[0] : i18n.amPm[1]
  },
  A: function (dateObj, i18n) {
    return dateObj.getHours() < 12 ? i18n.amPm[0].toUpperCase() : i18n.amPm[1].toUpperCase()
  },
  ZZ: function (dateObj) {
    var offset = dateObj.getTimezoneOffset()
    return (
      (offset > 0 ? '-' : '+') +
      pad(Math.floor(Math.abs(offset) / 60) * 100 + (Math.abs(offset) % 60), 4)
    )
  },
  Z: function (dateObj) {
    var offset = dateObj.getTimezoneOffset()
    return (
      (offset > 0 ? '-' : '+') +
      pad(Math.floor(Math.abs(offset) / 60), 2) +
      ':' +
      pad(Math.abs(offset) % 60, 2)
    )
  },
}
var monthParse = function (v) {
  return +v - 1
}
var emptyDigits = [null, twoDigitsOptional]
var emptyWord = [null, word]
var amPm = [
  'isPm',
  word,
  function (v, i18n) {
    var val = v.toLowerCase()
    if (val === i18n.amPm[0]) {
      return 0
    } else if (val === i18n.amPm[1]) {
      return 1
    }
    return null
  },
]
var timezoneOffset = [
  'timezoneOffset',
  '[^\\s]*?[\\+\\-]\\d\\d:?\\d\\d|[^\\s]*?Z?',
  function (v) {
    var parts = (v + '').match(/([+-]|\d\d)/gi)
    if (parts) {
      var minutes = +parts[1] * 60 + parseInt(parts[2], 10)
      return parts[0] === '+' ? minutes : -minutes
    }
    return 0
  },
]
var parseFlags = {
  D: ['day', twoDigitsOptional],
  DD: ['day', twoDigits],
  Do: [
    'day',
    twoDigitsOptional + word,
    function (v) {
      return parseInt(v, 10)
    },
  ],
  M: ['month', twoDigitsOptional, monthParse],
  MM: ['month', twoDigits, monthParse],
  YY: [
    'year',
    twoDigits,
    function (v) {
      var now = /* @__PURE__ */ new Date()
      var cent = +('' + now.getFullYear()).substr(0, 2)
      return +('' + (+v > 68 ? cent - 1 : cent) + v)
    },
  ],
  h: ['hour', twoDigitsOptional, void 0, 'isPm'],
  hh: ['hour', twoDigits, void 0, 'isPm'],
  H: ['hour', twoDigitsOptional],
  HH: ['hour', twoDigits],
  m: ['minute', twoDigitsOptional],
  mm: ['minute', twoDigits],
  s: ['second', twoDigitsOptional],
  ss: ['second', twoDigits],
  YYYY: ['year', fourDigits],
  S: [
    'millisecond',
    '\\d',
    function (v) {
      return +v * 100
    },
  ],
  SS: [
    'millisecond',
    twoDigits,
    function (v) {
      return +v * 10
    },
  ],
  SSS: ['millisecond', threeDigits],
  d: emptyDigits,
  dd: emptyDigits,
  ddd: emptyWord,
  dddd: emptyWord,
  MMM: ['month', word, monthUpdate('monthNamesShort')],
  MMMM: ['month', word, monthUpdate('monthNames')],
  a: amPm,
  A: amPm,
  ZZ: timezoneOffset,
  Z: timezoneOffset,
}
var globalMasks = {
  default: 'ddd MMM DD YYYY HH:mm:ss',
  shortDate: 'M/D/YY',
  mediumDate: 'MMM D, YYYY',
  longDate: 'MMMM D, YYYY',
  fullDate: 'dddd, MMMM D, YYYY',
  isoDate: 'YYYY-MM-DD',
  isoDateTime: 'YYYY-MM-DDTHH:mm:ssZ',
  shortTime: 'HH:mm',
  mediumTime: 'HH:mm:ss',
  longTime: 'HH:mm:ss.SSS',
}
var setGlobalDateMasks = function (masks) {
  return assign(globalMasks, masks)
}
var format = function (dateObj, mask, i18n) {
  if (mask === void 0) {
    mask = globalMasks['default']
  }
  if (i18n === void 0) {
    i18n = {}
  }
  if (typeof dateObj === 'number') {
    dateObj = new Date(dateObj)
  }
  if (Object.prototype.toString.call(dateObj) !== '[object Date]' || isNaN(dateObj.getTime())) {
    throw new Error('Invalid Date pass to format')
  }
  mask = globalMasks[mask] || mask
  var literals = []
  mask = mask.replace(literal, function ($0, $1) {
    literals.push($1)
    return '@@@'
  })
  var combinedI18nSettings = assign(assign({}, globalI18n), i18n)
  mask = mask.replace(token, function ($0) {
    return formatFlags[$0](dateObj, combinedI18nSettings)
  })
  return mask.replace(/@@@/g, function () {
    return literals.shift()
  })
}
function parse$1(dateStr, format2, i18n) {
  if (i18n === void 0) {
    i18n = {}
  }
  if (typeof format2 !== 'string') {
    throw new Error('Invalid format in fecha parse')
  }
  format2 = globalMasks[format2] || format2
  if (dateStr.length > 1e3) {
    return null
  }
  var today = /* @__PURE__ */ new Date()
  var dateInfo = {
    year: today.getFullYear(),
    month: 0,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    isPm: null,
    timezoneOffset: null,
  }
  var parseInfo = []
  var literals = []
  var newFormat = format2.replace(literal, function ($0, $1) {
    literals.push(regexEscape($1))
    return '@@@'
  })
  var specifiedFields = {}
  var requiredFields = {}
  newFormat = regexEscape(newFormat).replace(token, function ($0) {
    var info = parseFlags[$0]
    var field2 = info[0],
      regex = info[1],
      requiredField = info[3]
    if (specifiedFields[field2]) {
      throw new Error('Invalid format. ' + field2 + ' specified twice in format')
    }
    specifiedFields[field2] = true
    if (requiredField) {
      requiredFields[requiredField] = true
    }
    parseInfo.push(info)
    return '(' + regex + ')'
  })
  Object.keys(requiredFields).forEach(function (field2) {
    if (!specifiedFields[field2]) {
      throw new Error('Invalid format. ' + field2 + ' is required in specified format')
    }
  })
  newFormat = newFormat.replace(/@@@/g, function () {
    return literals.shift()
  })
  var matches = dateStr.match(new RegExp(newFormat, 'i'))
  if (!matches) {
    return null
  }
  var combinedI18nSettings = assign(assign({}, globalI18n), i18n)
  for (var i = 1; i < matches.length; i++) {
    var _a = parseInfo[i - 1],
      field = _a[0],
      parser = _a[2]
    var value = parser ? parser(matches[i], combinedI18nSettings) : +matches[i]
    if (value == null) {
      return null
    }
    dateInfo[field] = value
  }
  if (dateInfo.isPm === 1 && dateInfo.hour != null && +dateInfo.hour !== 12) {
    dateInfo.hour = +dateInfo.hour + 12
  } else if (dateInfo.isPm === 0 && +dateInfo.hour === 12) {
    dateInfo.hour = 0
  }
  var dateTZ
  if (dateInfo.timezoneOffset == null) {
    dateTZ = new Date(
      dateInfo.year,
      dateInfo.month,
      dateInfo.day,
      dateInfo.hour,
      dateInfo.minute,
      dateInfo.second,
      dateInfo.millisecond,
    )
    var validateFields = [
      ['month', 'getMonth'],
      ['day', 'getDate'],
      ['hour', 'getHours'],
      ['minute', 'getMinutes'],
      ['second', 'getSeconds'],
    ]
    for (var i = 0, len = validateFields.length; i < len; i++) {
      if (
        specifiedFields[validateFields[i][0]] &&
        dateInfo[validateFields[i][0]] !== dateTZ[validateFields[i][1]]()
      ) {
        return null
      }
    }
  } else {
    dateTZ = new Date(
      Date.UTC(
        dateInfo.year,
        dateInfo.month,
        dateInfo.day,
        dateInfo.hour,
        dateInfo.minute - dateInfo.timezoneOffset,
        dateInfo.second,
        dateInfo.millisecond,
      ),
    )
    if (
      dateInfo.month > 11 ||
      dateInfo.month < 0 ||
      dateInfo.day > 31 ||
      dateInfo.day < 1 ||
      dateInfo.hour > 23 ||
      dateInfo.hour < 0 ||
      dateInfo.minute > 59 ||
      dateInfo.minute < 0 ||
      dateInfo.second > 59 ||
      dateInfo.second < 0
    ) {
      return null
    }
  }
  return dateTZ
}
var fecha = {
  format,
  parse: parse$1,
  defaultI18n,
  setGlobalDateI18n,
  setGlobalDateMasks,
}
const fecha$1 = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ Object.defineProperty(
    {
      __proto__: null,
      assign,
      default: fecha,
      defaultI18n,
      format,
      parse: parse$1,
      setGlobalDateI18n,
      setGlobalDateMasks,
    },
    Symbol.toStringTag,
    { value: 'Module' },
  ),
)
const require$$0 = /* @__PURE__ */ getAugmentedNamespace(fecha$1)
var timestamp
var hasRequiredTimestamp
function requireTimestamp() {
  if (hasRequiredTimestamp) return timestamp
  hasRequiredTimestamp = 1
  const fecha2 = require$$0
  const format2 = requireFormat()
  timestamp = format2((info, opts = {}) => {
    if (opts.format) {
      info.timestamp =
        typeof opts.format === 'function'
          ? opts.format()
          : fecha2.format(/* @__PURE__ */ new Date(), opts.format)
    }
    if (!info.timestamp) {
      info.timestamp = /* @__PURE__ */ new Date().toISOString()
    }
    if (opts.alias) {
      info[opts.alias] = info.timestamp
    }
    return info
  })
  return timestamp
}
var uncolorize
var hasRequiredUncolorize
function requireUncolorize() {
  if (hasRequiredUncolorize) return uncolorize
  hasRequiredUncolorize = 1
  const colors2 = requireSafe()
  const format2 = requireFormat()
  const { MESSAGE } = requireTripleBeam()
  uncolorize = format2((info, opts) => {
    if (opts.level !== false) {
      info.level = colors2.strip(info.level)
    }
    if (opts.message !== false) {
      info.message = colors2.strip(String(info.message))
    }
    if (opts.raw !== false && info[MESSAGE]) {
      info[MESSAGE] = colors2.strip(String(info[MESSAGE]))
    }
    return info
  })
  return uncolorize
}
var hasRequiredLogform
function requireLogform() {
  if (hasRequiredLogform) return logform
  hasRequiredLogform = 1
  const format2 = (logform.format = requireFormat())
  logform.levels = requireLevels()
  function exposeFormat(name, requireFormat2) {
    Object.defineProperty(format2, name, {
      get() {
        return requireFormat2()
      },
      configurable: true,
    })
  }
  exposeFormat('align', function () {
    return requireAlign()
  })
  exposeFormat('errors', function () {
    return requireErrors$1()
  })
  exposeFormat('cli', function () {
    return requireCli()
  })
  exposeFormat('combine', function () {
    return requireCombine()
  })
  exposeFormat('colorize', function () {
    return requireColorize()
  })
  exposeFormat('json', function () {
    return requireJson()
  })
  exposeFormat('label', function () {
    return requireLabel()
  })
  exposeFormat('logstash', function () {
    return requireLogstash()
  })
  exposeFormat('metadata', function () {
    return requireMetadata()
  })
  exposeFormat('ms', function () {
    return requireMs()
  })
  exposeFormat('padLevels', function () {
    return requirePadLevels()
  })
  exposeFormat('prettyPrint', function () {
    return requirePrettyPrint()
  })
  exposeFormat('printf', function () {
    return requirePrintf()
  })
  exposeFormat('simple', function () {
    return requireSimple()
  })
  exposeFormat('splat', function () {
    return requireSplat()
  })
  exposeFormat('timestamp', function () {
    return requireTimestamp()
  })
  exposeFormat('uncolorize', function () {
    return requireUncolorize()
  })
  return logform
}
var common = {}
var hasRequiredCommon
function requireCommon() {
  if (hasRequiredCommon) return common
  hasRequiredCommon = 1
  ;(function (exports) {
    const { format: format2 } = require$$0$2
    exports.warn = {
      deprecated(prop) {
        return () => {
          throw new Error(format2('{ %s } was removed in winston@3.0.0.', prop))
        }
      },
      useFormat(prop) {
        return () => {
          throw new Error(
            [
              format2('{ %s } was removed in winston@3.0.0.', prop),
              'Use a custom winston.format = winston.format(function) instead.',
            ].join('\n'),
          )
        }
      },
      forFunctions(obj, type, props) {
        props.forEach((prop) => {
          obj[prop] = exports.warn[type](prop)
        })
      },
      forProperties(obj, type, props) {
        props.forEach((prop) => {
          const notice = exports.warn[type](prop)
          Object.defineProperty(obj, prop, {
            get: notice,
            set: notice,
          })
        })
      },
    }
  })(common)
  return common
}
const version = '3.19.0'
const require$$2 = {
  version,
}
var transports = {}
var winstonTransport = { exports: {} }
var modern = { exports: {} }
var node$1
var hasRequiredNode$1
function requireNode$1() {
  if (hasRequiredNode$1) return node$1
  hasRequiredNode$1 = 1
  node$1 = require$$0$2.deprecate
  return node$1
}
var stream$1
var hasRequiredStream$1
function requireStream$1() {
  if (hasRequiredStream$1) return stream$1
  hasRequiredStream$1 = 1
  stream$1 = require$$0$3
  return stream$1
}
var destroy_1
var hasRequiredDestroy
function requireDestroy() {
  if (hasRequiredDestroy) return destroy_1
  hasRequiredDestroy = 1
  function destroy(err2, cb) {
    var _this = this
    var readableDestroyed = this._readableState && this._readableState.destroyed
    var writableDestroyed = this._writableState && this._writableState.destroyed
    if (readableDestroyed || writableDestroyed) {
      if (cb) {
        cb(err2)
      } else if (err2) {
        if (!this._writableState) {
          process.nextTick(emitErrorNT, this, err2)
        } else if (!this._writableState.errorEmitted) {
          this._writableState.errorEmitted = true
          process.nextTick(emitErrorNT, this, err2)
        }
      }
      return this
    }
    if (this._readableState) {
      this._readableState.destroyed = true
    }
    if (this._writableState) {
      this._writableState.destroyed = true
    }
    this._destroy(err2 || null, function (err3) {
      if (!cb && err3) {
        if (!_this._writableState) {
          process.nextTick(emitErrorAndCloseNT, _this, err3)
        } else if (!_this._writableState.errorEmitted) {
          _this._writableState.errorEmitted = true
          process.nextTick(emitErrorAndCloseNT, _this, err3)
        } else {
          process.nextTick(emitCloseNT, _this)
        }
      } else if (cb) {
        process.nextTick(emitCloseNT, _this)
        cb(err3)
      } else {
        process.nextTick(emitCloseNT, _this)
      }
    })
    return this
  }
  function emitErrorAndCloseNT(self2, err2) {
    emitErrorNT(self2, err2)
    emitCloseNT(self2)
  }
  function emitCloseNT(self2) {
    if (self2._writableState && !self2._writableState.emitClose) return
    if (self2._readableState && !self2._readableState.emitClose) return
    self2.emit('close')
  }
  function undestroy() {
    if (this._readableState) {
      this._readableState.destroyed = false
      this._readableState.reading = false
      this._readableState.ended = false
      this._readableState.endEmitted = false
    }
    if (this._writableState) {
      this._writableState.destroyed = false
      this._writableState.ended = false
      this._writableState.ending = false
      this._writableState.finalCalled = false
      this._writableState.prefinished = false
      this._writableState.finished = false
      this._writableState.errorEmitted = false
    }
  }
  function emitErrorNT(self2, err2) {
    self2.emit('error', err2)
  }
  function errorOrDestroy(stream2, err2) {
    var rState = stream2._readableState
    var wState = stream2._writableState
    if ((rState && rState.autoDestroy) || (wState && wState.autoDestroy)) stream2.destroy(err2)
    else stream2.emit('error', err2)
  }
  destroy_1 = {
    destroy,
    undestroy,
    errorOrDestroy,
  }
  return destroy_1
}
var errors = {}
var hasRequiredErrors
function requireErrors() {
  if (hasRequiredErrors) return errors
  hasRequiredErrors = 1
  const codes = {}
  function createErrorType(code, message, Base) {
    if (!Base) {
      Base = Error
    }
    function getMessage(arg1, arg2, arg3) {
      if (typeof message === 'string') {
        return message
      } else {
        return message(arg1, arg2, arg3)
      }
    }
    class NodeError extends Base {
      constructor(arg1, arg2, arg3) {
        super(getMessage(arg1, arg2, arg3))
      }
    }
    NodeError.prototype.name = Base.name
    NodeError.prototype.code = code
    codes[code] = NodeError
  }
  function oneOf(expected, thing) {
    if (Array.isArray(expected)) {
      const len = expected.length
      expected = expected.map((i) => String(i))
      if (len > 2) {
        return `one of ${thing} ${expected.slice(0, len - 1).join(', ')}, or ` + expected[len - 1]
      } else if (len === 2) {
        return `one of ${thing} ${expected[0]} or ${expected[1]}`
      } else {
        return `of ${thing} ${expected[0]}`
      }
    } else {
      return `of ${thing} ${String(expected)}`
    }
  }
  function startsWith(str, search, pos) {
    return str.substr(0, search.length) === search
  }
  function endsWith(str, search, this_len) {
    if (this_len === void 0 || this_len > str.length) {
      this_len = str.length
    }
    return str.substring(this_len - search.length, this_len) === search
  }
  function includes(str, search, start) {
    if (typeof start !== 'number') {
      start = 0
    }
    if (start + search.length > str.length) {
      return false
    } else {
      return str.indexOf(search, start) !== -1
    }
  }
  createErrorType(
    'ERR_INVALID_OPT_VALUE',
    function (name, value) {
      return 'The value "' + value + '" is invalid for option "' + name + '"'
    },
    TypeError,
  )
  createErrorType(
    'ERR_INVALID_ARG_TYPE',
    function (name, expected, actual) {
      let determiner
      if (typeof expected === 'string' && startsWith(expected, 'not ')) {
        determiner = 'must not be'
        expected = expected.replace(/^not /, '')
      } else {
        determiner = 'must be'
      }
      let msg
      if (endsWith(name, ' argument')) {
        msg = `The ${name} ${determiner} ${oneOf(expected, 'type')}`
      } else {
        const type = includes(name, '.') ? 'property' : 'argument'
        msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, 'type')}`
      }
      msg += `. Received type ${typeof actual}`
      return msg
    },
    TypeError,
  )
  createErrorType('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF')
  createErrorType('ERR_METHOD_NOT_IMPLEMENTED', function (name) {
    return 'The ' + name + ' method is not implemented'
  })
  createErrorType('ERR_STREAM_PREMATURE_CLOSE', 'Premature close')
  createErrorType('ERR_STREAM_DESTROYED', function (name) {
    return 'Cannot call ' + name + ' after a stream was destroyed'
  })
  createErrorType('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times')
  createErrorType('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable')
  createErrorType('ERR_STREAM_WRITE_AFTER_END', 'write after end')
  createErrorType('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError)
  createErrorType(
    'ERR_UNKNOWN_ENCODING',
    function (arg) {
      return 'Unknown encoding: ' + arg
    },
    TypeError,
  )
  createErrorType('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event')
  errors.codes = codes
  return errors
}
var state
var hasRequiredState
function requireState() {
  if (hasRequiredState) return state
  hasRequiredState = 1
  var ERR_INVALID_OPT_VALUE = requireErrors().codes.ERR_INVALID_OPT_VALUE
  function highWaterMarkFrom(options, isDuplex, duplexKey) {
    return options.highWaterMark != null
      ? options.highWaterMark
      : isDuplex
        ? options[duplexKey]
        : null
  }
  function getHighWaterMark(state2, options, duplexKey, isDuplex) {
    var hwm = highWaterMarkFrom(options, isDuplex, duplexKey)
    if (hwm != null) {
      if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
        var name = isDuplex ? duplexKey : 'highWaterMark'
        throw new ERR_INVALID_OPT_VALUE(name, hwm)
      }
      return Math.floor(hwm)
    }
    return state2.objectMode ? 16 : 16 * 1024
  }
  state = {
    getHighWaterMark,
  }
  return state
}
var inherits = { exports: {} }
var inherits_browser = { exports: {} }
var hasRequiredInherits_browser
function requireInherits_browser() {
  if (hasRequiredInherits_browser) return inherits_browser.exports
  hasRequiredInherits_browser = 1
  if (typeof Object.create === 'function') {
    inherits_browser.exports = function inherits2(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true,
          },
        })
      }
    }
  } else {
    inherits_browser.exports = function inherits2(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor
        var TempCtor = function () {}
        TempCtor.prototype = superCtor.prototype
        ctor.prototype = new TempCtor()
        ctor.prototype.constructor = ctor
      }
    }
  }
  return inherits_browser.exports
}
var hasRequiredInherits
function requireInherits() {
  if (hasRequiredInherits) return inherits.exports
  hasRequiredInherits = 1
  try {
    var util2 = require('util')
    if (typeof util2.inherits !== 'function') throw ''
    inherits.exports = util2.inherits
  } catch (e) {
    inherits.exports = requireInherits_browser()
  }
  return inherits.exports
}
var buffer_list
var hasRequiredBuffer_list
function requireBuffer_list() {
  if (hasRequiredBuffer_list) return buffer_list
  hasRequiredBuffer_list = 1
  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object)
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object)
      ;(enumerableOnly &&
        (symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable
        })),
        keys.push.apply(keys, symbols))
    }
    return keys
  }
  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {}
      i % 2
        ? ownKeys(Object(source), true).forEach(function (key) {
            _defineProperty(target, key, source[key])
          })
        : Object.getOwnPropertyDescriptors
          ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))
          : ownKeys(Object(source)).forEach(function (key) {
              Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key))
            })
    }
    return target
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key)
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      })
    } else {
      obj[key] = value
    }
    return obj
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function')
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i]
      descriptor.enumerable = descriptor.enumerable || false
      descriptor.configurable = true
      if ('value' in descriptor) descriptor.writable = true
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor)
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps)
    Object.defineProperty(Constructor, 'prototype', { writable: false })
    return Constructor
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, 'string')
    return typeof key === 'symbol' ? key : String(key)
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== 'object' || input === null) return input
    var prim = input[Symbol.toPrimitive]
    if (prim !== void 0) {
      var res = prim.call(input, hint)
      if (typeof res !== 'object') return res
      throw new TypeError('@@toPrimitive must return a primitive value.')
    }
    return String(input)
  }
  var _require = require$$0$4,
    Buffer2 = _require.Buffer
  var _require2 = require$$0$2,
    inspect = _require2.inspect
  var custom = (inspect && inspect.custom) || 'inspect'
  function copyBuffer(src, target, offset) {
    Buffer2.prototype.copy.call(src, target, offset)
  }
  buffer_list = /* @__PURE__ */ (function () {
    function BufferList() {
      _classCallCheck(this, BufferList)
      this.head = null
      this.tail = null
      this.length = 0
    }
    _createClass(BufferList, [
      {
        key: 'push',
        value: function push(v) {
          var entry = {
            data: v,
            next: null,
          }
          if (this.length > 0) this.tail.next = entry
          else this.head = entry
          this.tail = entry
          ++this.length
        },
      },
      {
        key: 'unshift',
        value: function unshift(v) {
          var entry = {
            data: v,
            next: this.head,
          }
          if (this.length === 0) this.tail = entry
          this.head = entry
          ++this.length
        },
      },
      {
        key: 'shift',
        value: function shift() {
          if (this.length === 0) return
          var ret = this.head.data
          if (this.length === 1) this.head = this.tail = null
          else this.head = this.head.next
          --this.length
          return ret
        },
      },
      {
        key: 'clear',
        value: function clear() {
          this.head = this.tail = null
          this.length = 0
        },
      },
      {
        key: 'join',
        value: function join2(s) {
          if (this.length === 0) return ''
          var p = this.head
          var ret = '' + p.data
          while ((p = p.next)) ret += s + p.data
          return ret
        },
      },
      {
        key: 'concat',
        value: function concat(n) {
          if (this.length === 0) return Buffer2.alloc(0)
          var ret = Buffer2.allocUnsafe(n >>> 0)
          var p = this.head
          var i = 0
          while (p) {
            copyBuffer(p.data, ret, i)
            i += p.data.length
            p = p.next
          }
          return ret
        },
        // Consumes a specified amount of bytes or characters from the buffered data.
      },
      {
        key: 'consume',
        value: function consume(n, hasStrings) {
          var ret
          if (n < this.head.data.length) {
            ret = this.head.data.slice(0, n)
            this.head.data = this.head.data.slice(n)
          } else if (n === this.head.data.length) {
            ret = this.shift()
          } else {
            ret = hasStrings ? this._getString(n) : this._getBuffer(n)
          }
          return ret
        },
      },
      {
        key: 'first',
        value: function first() {
          return this.head.data
        },
        // Consumes a specified amount of characters from the buffered data.
      },
      {
        key: '_getString',
        value: function _getString(n) {
          var p = this.head
          var c = 1
          var ret = p.data
          n -= ret.length
          while ((p = p.next)) {
            var str = p.data
            var nb = n > str.length ? str.length : n
            if (nb === str.length) ret += str
            else ret += str.slice(0, n)
            n -= nb
            if (n === 0) {
              if (nb === str.length) {
                ++c
                if (p.next) this.head = p.next
                else this.head = this.tail = null
              } else {
                this.head = p
                p.data = str.slice(nb)
              }
              break
            }
            ++c
          }
          this.length -= c
          return ret
        },
        // Consumes a specified amount of bytes from the buffered data.
      },
      {
        key: '_getBuffer',
        value: function _getBuffer(n) {
          var ret = Buffer2.allocUnsafe(n)
          var p = this.head
          var c = 1
          p.data.copy(ret)
          n -= p.data.length
          while ((p = p.next)) {
            var buf = p.data
            var nb = n > buf.length ? buf.length : n
            buf.copy(ret, ret.length - n, 0, nb)
            n -= nb
            if (n === 0) {
              if (nb === buf.length) {
                ++c
                if (p.next) this.head = p.next
                else this.head = this.tail = null
              } else {
                this.head = p
                p.data = buf.slice(nb)
              }
              break
            }
            ++c
          }
          this.length -= c
          return ret
        },
        // Make sure the linked list only shows the minimal necessary information.
      },
      {
        key: custom,
        value: function value(_, options) {
          return inspect(
            this,
            _objectSpread(
              _objectSpread({}, options),
              {},
              {
                // Only inspect one level.
                depth: 0,
                // It should not recurse.
                customInspect: false,
              },
            ),
          )
        },
      },
    ])
    return BufferList
  })()
  return buffer_list
}
var string_decoder = {}
var safeBuffer = { exports: {} }
var hasRequiredSafeBuffer
function requireSafeBuffer() {
  if (hasRequiredSafeBuffer) return safeBuffer.exports
  hasRequiredSafeBuffer = 1
  ;(function (module, exports) {
    var buffer = require$$0$4
    var Buffer2 = buffer.Buffer
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key]
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer
    } else {
      copyProps(buffer, exports)
      exports.Buffer = SafeBuffer
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length)
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype)
    copyProps(Buffer2, SafeBuffer)
    SafeBuffer.from = function (arg, encodingOrOffset, length) {
      if (typeof arg === 'number') {
        throw new TypeError('Argument must not be a number')
      }
      return Buffer2(arg, encodingOrOffset, length)
    }
    SafeBuffer.alloc = function (size, fill, encoding) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      var buf = Buffer2(size)
      if (fill !== void 0) {
        if (typeof encoding === 'string') {
          buf.fill(fill, encoding)
        } else {
          buf.fill(fill)
        }
      } else {
        buf.fill(0)
      }
      return buf
    }
    SafeBuffer.allocUnsafe = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      return Buffer2(size)
    }
    SafeBuffer.allocUnsafeSlow = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      return buffer.SlowBuffer(size)
    }
  })(safeBuffer, safeBuffer.exports)
  return safeBuffer.exports
}
var hasRequiredString_decoder
function requireString_decoder() {
  if (hasRequiredString_decoder) return string_decoder
  hasRequiredString_decoder = 1
  var Buffer2 = requireSafeBuffer().Buffer
  var isEncoding =
    Buffer2.isEncoding ||
    function (encoding) {
      encoding = '' + encoding
      switch (encoding && encoding.toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
        case 'raw':
          return true
        default:
          return false
      }
    }
  function _normalizeEncoding(enc) {
    if (!enc) return 'utf8'
    var retried
    while (true) {
      switch (enc) {
        case 'utf8':
        case 'utf-8':
          return 'utf8'
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return 'utf16le'
        case 'latin1':
        case 'binary':
          return 'latin1'
        case 'base64':
        case 'ascii':
        case 'hex':
          return enc
        default:
          if (retried) return
          enc = ('' + enc).toLowerCase()
          retried = true
      }
    }
  }
  function normalizeEncoding(enc) {
    var nenc = _normalizeEncoding(enc)
    if (typeof nenc !== 'string' && (Buffer2.isEncoding === isEncoding || !isEncoding(enc)))
      throw new Error('Unknown encoding: ' + enc)
    return nenc || enc
  }
  string_decoder.StringDecoder = StringDecoder
  function StringDecoder(encoding) {
    this.encoding = normalizeEncoding(encoding)
    var nb
    switch (this.encoding) {
      case 'utf16le':
        this.text = utf16Text
        this.end = utf16End
        nb = 4
        break
      case 'utf8':
        this.fillLast = utf8FillLast
        nb = 4
        break
      case 'base64':
        this.text = base64Text
        this.end = base64End
        nb = 3
        break
      default:
        this.write = simpleWrite
        this.end = simpleEnd
        return
    }
    this.lastNeed = 0
    this.lastTotal = 0
    this.lastChar = Buffer2.allocUnsafe(nb)
  }
  StringDecoder.prototype.write = function (buf) {
    if (buf.length === 0) return ''
    var r
    var i
    if (this.lastNeed) {
      r = this.fillLast(buf)
      if (r === void 0) return ''
      i = this.lastNeed
      this.lastNeed = 0
    } else {
      i = 0
    }
    if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i)
    return r || ''
  }
  StringDecoder.prototype.end = utf8End
  StringDecoder.prototype.text = utf8Text
  StringDecoder.prototype.fillLast = function (buf) {
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed)
      return this.lastChar.toString(this.encoding, 0, this.lastTotal)
    }
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length)
    this.lastNeed -= buf.length
  }
  function utf8CheckByte(byte) {
    if (byte <= 127) return 0
    else if (byte >> 5 === 6) return 2
    else if (byte >> 4 === 14) return 3
    else if (byte >> 3 === 30) return 4
    return byte >> 6 === 2 ? -1 : -2
  }
  function utf8CheckIncomplete(self2, buf, i) {
    var j = buf.length - 1
    if (j < i) return 0
    var nb = utf8CheckByte(buf[j])
    if (nb >= 0) {
      if (nb > 0) self2.lastNeed = nb - 1
      return nb
    }
    if (--j < i || nb === -2) return 0
    nb = utf8CheckByte(buf[j])
    if (nb >= 0) {
      if (nb > 0) self2.lastNeed = nb - 2
      return nb
    }
    if (--j < i || nb === -2) return 0
    nb = utf8CheckByte(buf[j])
    if (nb >= 0) {
      if (nb > 0) {
        if (nb === 2) nb = 0
        else self2.lastNeed = nb - 3
      }
      return nb
    }
    return 0
  }
  function utf8CheckExtraBytes(self2, buf, p) {
    if ((buf[0] & 192) !== 128) {
      self2.lastNeed = 0
      return '�'
    }
    if (self2.lastNeed > 1 && buf.length > 1) {
      if ((buf[1] & 192) !== 128) {
        self2.lastNeed = 1
        return '�'
      }
      if (self2.lastNeed > 2 && buf.length > 2) {
        if ((buf[2] & 192) !== 128) {
          self2.lastNeed = 2
          return '�'
        }
      }
    }
  }
  function utf8FillLast(buf) {
    var p = this.lastTotal - this.lastNeed
    var r = utf8CheckExtraBytes(this, buf)
    if (r !== void 0) return r
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, p, 0, this.lastNeed)
      return this.lastChar.toString(this.encoding, 0, this.lastTotal)
    }
    buf.copy(this.lastChar, p, 0, buf.length)
    this.lastNeed -= buf.length
  }
  function utf8Text(buf, i) {
    var total = utf8CheckIncomplete(this, buf, i)
    if (!this.lastNeed) return buf.toString('utf8', i)
    this.lastTotal = total
    var end = buf.length - (total - this.lastNeed)
    buf.copy(this.lastChar, 0, end)
    return buf.toString('utf8', i, end)
  }
  function utf8End(buf) {
    var r = buf && buf.length ? this.write(buf) : ''
    if (this.lastNeed) return r + '�'
    return r
  }
  function utf16Text(buf, i) {
    if ((buf.length - i) % 2 === 0) {
      var r = buf.toString('utf16le', i)
      if (r) {
        var c = r.charCodeAt(r.length - 1)
        if (c >= 55296 && c <= 56319) {
          this.lastNeed = 2
          this.lastTotal = 4
          this.lastChar[0] = buf[buf.length - 2]
          this.lastChar[1] = buf[buf.length - 1]
          return r.slice(0, -1)
        }
      }
      return r
    }
    this.lastNeed = 1
    this.lastTotal = 2
    this.lastChar[0] = buf[buf.length - 1]
    return buf.toString('utf16le', i, buf.length - 1)
  }
  function utf16End(buf) {
    var r = buf && buf.length ? this.write(buf) : ''
    if (this.lastNeed) {
      var end = this.lastTotal - this.lastNeed
      return r + this.lastChar.toString('utf16le', 0, end)
    }
    return r
  }
  function base64Text(buf, i) {
    var n = (buf.length - i) % 3
    if (n === 0) return buf.toString('base64', i)
    this.lastNeed = 3 - n
    this.lastTotal = 3
    if (n === 1) {
      this.lastChar[0] = buf[buf.length - 1]
    } else {
      this.lastChar[0] = buf[buf.length - 2]
      this.lastChar[1] = buf[buf.length - 1]
    }
    return buf.toString('base64', i, buf.length - n)
  }
  function base64End(buf) {
    var r = buf && buf.length ? this.write(buf) : ''
    if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed)
    return r
  }
  function simpleWrite(buf) {
    return buf.toString(this.encoding)
  }
  function simpleEnd(buf) {
    return buf && buf.length ? this.write(buf) : ''
  }
  return string_decoder
}
var endOfStream
var hasRequiredEndOfStream
function requireEndOfStream() {
  if (hasRequiredEndOfStream) return endOfStream
  hasRequiredEndOfStream = 1
  var ERR_STREAM_PREMATURE_CLOSE = requireErrors().codes.ERR_STREAM_PREMATURE_CLOSE
  function once2(callback) {
    var called = false
    return function () {
      if (called) return
      called = true
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key]
      }
      callback.apply(this, args)
    }
  }
  function noop() {}
  function isRequest(stream2) {
    return stream2.setHeader && typeof stream2.abort === 'function'
  }
  function eos(stream2, opts, callback) {
    if (typeof opts === 'function') return eos(stream2, null, opts)
    if (!opts) opts = {}
    callback = once2(callback || noop)
    var readable2 = opts.readable || (opts.readable !== false && stream2.readable)
    var writable = opts.writable || (opts.writable !== false && stream2.writable)
    var onlegacyfinish = function onlegacyfinish2() {
      if (!stream2.writable) onfinish()
    }
    var writableEnded = stream2._writableState && stream2._writableState.finished
    var onfinish = function onfinish2() {
      writable = false
      writableEnded = true
      if (!readable2) callback.call(stream2)
    }
    var readableEnded = stream2._readableState && stream2._readableState.endEmitted
    var onend = function onend2() {
      readable2 = false
      readableEnded = true
      if (!writable) callback.call(stream2)
    }
    var onerror = function onerror2(err2) {
      callback.call(stream2, err2)
    }
    var onclose = function onclose2() {
      var err2
      if (readable2 && !readableEnded) {
        if (!stream2._readableState || !stream2._readableState.ended)
          err2 = new ERR_STREAM_PREMATURE_CLOSE()
        return callback.call(stream2, err2)
      }
      if (writable && !writableEnded) {
        if (!stream2._writableState || !stream2._writableState.ended)
          err2 = new ERR_STREAM_PREMATURE_CLOSE()
        return callback.call(stream2, err2)
      }
    }
    var onrequest = function onrequest2() {
      stream2.req.on('finish', onfinish)
    }
    if (isRequest(stream2)) {
      stream2.on('complete', onfinish)
      stream2.on('abort', onclose)
      if (stream2.req) onrequest()
      else stream2.on('request', onrequest)
    } else if (writable && !stream2._writableState) {
      stream2.on('end', onlegacyfinish)
      stream2.on('close', onlegacyfinish)
    }
    stream2.on('end', onend)
    stream2.on('finish', onfinish)
    if (opts.error !== false) stream2.on('error', onerror)
    stream2.on('close', onclose)
    return function () {
      stream2.removeListener('complete', onfinish)
      stream2.removeListener('abort', onclose)
      stream2.removeListener('request', onrequest)
      if (stream2.req) stream2.req.removeListener('finish', onfinish)
      stream2.removeListener('end', onlegacyfinish)
      stream2.removeListener('close', onlegacyfinish)
      stream2.removeListener('finish', onfinish)
      stream2.removeListener('end', onend)
      stream2.removeListener('error', onerror)
      stream2.removeListener('close', onclose)
    }
  }
  endOfStream = eos
  return endOfStream
}
var async_iterator
var hasRequiredAsync_iterator
function requireAsync_iterator() {
  if (hasRequiredAsync_iterator) return async_iterator
  hasRequiredAsync_iterator = 1
  var _Object$setPrototypeO
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key)
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      })
    } else {
      obj[key] = value
    }
    return obj
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, 'string')
    return typeof key === 'symbol' ? key : String(key)
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== 'object' || input === null) return input
    var prim = input[Symbol.toPrimitive]
    if (prim !== void 0) {
      var res = prim.call(input, hint)
      if (typeof res !== 'object') return res
      throw new TypeError('@@toPrimitive must return a primitive value.')
    }
    return (hint === 'string' ? String : Number)(input)
  }
  var finished = requireEndOfStream()
  var kLastResolve = /* @__PURE__ */ Symbol('lastResolve')
  var kLastReject = /* @__PURE__ */ Symbol('lastReject')
  var kError = /* @__PURE__ */ Symbol('error')
  var kEnded = /* @__PURE__ */ Symbol('ended')
  var kLastPromise = /* @__PURE__ */ Symbol('lastPromise')
  var kHandlePromise = /* @__PURE__ */ Symbol('handlePromise')
  var kStream = /* @__PURE__ */ Symbol('stream')
  function createIterResult(value, done) {
    return {
      value,
      done,
    }
  }
  function readAndResolve(iter) {
    var resolve = iter[kLastResolve]
    if (resolve !== null) {
      var data = iter[kStream].read()
      if (data !== null) {
        iter[kLastPromise] = null
        iter[kLastResolve] = null
        iter[kLastReject] = null
        resolve(createIterResult(data, false))
      }
    }
  }
  function onReadable(iter) {
    process.nextTick(readAndResolve, iter)
  }
  function wrapForNext(lastPromise, iter) {
    return function (resolve, reject) {
      lastPromise.then(function () {
        if (iter[kEnded]) {
          resolve(createIterResult(void 0, true))
          return
        }
        iter[kHandlePromise](resolve, reject)
      }, reject)
    }
  }
  var AsyncIteratorPrototype = Object.getPrototypeOf(function () {})
  var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf(
    ((_Object$setPrototypeO = {
      get stream() {
        return this[kStream]
      },
      next: function next() {
        var _this = this
        var error = this[kError]
        if (error !== null) {
          return Promise.reject(error)
        }
        if (this[kEnded]) {
          return Promise.resolve(createIterResult(void 0, true))
        }
        if (this[kStream].destroyed) {
          return new Promise(function (resolve, reject) {
            process.nextTick(function () {
              if (_this[kError]) {
                reject(_this[kError])
              } else {
                resolve(createIterResult(void 0, true))
              }
            })
          })
        }
        var lastPromise = this[kLastPromise]
        var promise
        if (lastPromise) {
          promise = new Promise(wrapForNext(lastPromise, this))
        } else {
          var data = this[kStream].read()
          if (data !== null) {
            return Promise.resolve(createIterResult(data, false))
          }
          promise = new Promise(this[kHandlePromise])
        }
        this[kLastPromise] = promise
        return promise
      },
    }),
    _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function () {
      return this
    }),
    _defineProperty(_Object$setPrototypeO, 'return', function _return() {
      var _this2 = this
      return new Promise(function (resolve, reject) {
        _this2[kStream].destroy(null, function (err2) {
          if (err2) {
            reject(err2)
            return
          }
          resolve(createIterResult(void 0, true))
        })
      })
    }),
    _Object$setPrototypeO),
    AsyncIteratorPrototype,
  )
  var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator2(stream2) {
    var _Object$create
    var iterator2 = Object.create(
      ReadableStreamAsyncIteratorPrototype,
      ((_Object$create = {}),
      _defineProperty(_Object$create, kStream, {
        value: stream2,
        writable: true,
      }),
      _defineProperty(_Object$create, kLastResolve, {
        value: null,
        writable: true,
      }),
      _defineProperty(_Object$create, kLastReject, {
        value: null,
        writable: true,
      }),
      _defineProperty(_Object$create, kError, {
        value: null,
        writable: true,
      }),
      _defineProperty(_Object$create, kEnded, {
        value: stream2._readableState.endEmitted,
        writable: true,
      }),
      _defineProperty(_Object$create, kHandlePromise, {
        value: function value(resolve, reject) {
          var data = iterator2[kStream].read()
          if (data) {
            iterator2[kLastPromise] = null
            iterator2[kLastResolve] = null
            iterator2[kLastReject] = null
            resolve(createIterResult(data, false))
          } else {
            iterator2[kLastResolve] = resolve
            iterator2[kLastReject] = reject
          }
        },
        writable: true,
      }),
      _Object$create),
    )
    iterator2[kLastPromise] = null
    finished(stream2, function (err2) {
      if (err2 && err2.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
        var reject = iterator2[kLastReject]
        if (reject !== null) {
          iterator2[kLastPromise] = null
          iterator2[kLastResolve] = null
          iterator2[kLastReject] = null
          reject(err2)
        }
        iterator2[kError] = err2
        return
      }
      var resolve = iterator2[kLastResolve]
      if (resolve !== null) {
        iterator2[kLastPromise] = null
        iterator2[kLastResolve] = null
        iterator2[kLastReject] = null
        resolve(createIterResult(void 0, true))
      }
      iterator2[kEnded] = true
    })
    stream2.on('readable', onReadable.bind(null, iterator2))
    return iterator2
  }
  async_iterator = createReadableStreamAsyncIterator
  return async_iterator
}
var from_1
var hasRequiredFrom
function requireFrom() {
  if (hasRequiredFrom) return from_1
  hasRequiredFrom = 1
  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg)
      var value = info.value
    } catch (error) {
      reject(error)
      return
    }
    if (info.done) {
      resolve(value)
    } else {
      Promise.resolve(value).then(_next, _throw)
    }
  }
  function _asyncToGenerator(fn) {
    return function () {
      var self2 = this,
        args = arguments
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self2, args)
        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value)
        }
        function _throw(err2) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err2)
        }
        _next(void 0)
      })
    }
  }
  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object)
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object)
      ;(enumerableOnly &&
        (symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable
        })),
        keys.push.apply(keys, symbols))
    }
    return keys
  }
  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {}
      i % 2
        ? ownKeys(Object(source), true).forEach(function (key) {
            _defineProperty(target, key, source[key])
          })
        : Object.getOwnPropertyDescriptors
          ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))
          : ownKeys(Object(source)).forEach(function (key) {
              Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key))
            })
    }
    return target
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key)
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      })
    } else {
      obj[key] = value
    }
    return obj
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, 'string')
    return typeof key === 'symbol' ? key : String(key)
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== 'object' || input === null) return input
    var prim = input[Symbol.toPrimitive]
    if (prim !== void 0) {
      var res = prim.call(input, hint)
      if (typeof res !== 'object') return res
      throw new TypeError('@@toPrimitive must return a primitive value.')
    }
    return (hint === 'string' ? String : Number)(input)
  }
  var ERR_INVALID_ARG_TYPE = requireErrors().codes.ERR_INVALID_ARG_TYPE
  function from(Readable, iterable, opts) {
    var iterator2
    if (iterable && typeof iterable.next === 'function') {
      iterator2 = iterable
    } else if (iterable && iterable[Symbol.asyncIterator])
      iterator2 = iterable[Symbol.asyncIterator]()
    else if (iterable && iterable[Symbol.iterator]) iterator2 = iterable[Symbol.iterator]()
    else throw new ERR_INVALID_ARG_TYPE('iterable', ['Iterable'], iterable)
    var readable2 = new Readable(
      _objectSpread(
        {
          objectMode: true,
        },
        opts,
      ),
    )
    var reading = false
    readable2._read = function () {
      if (!reading) {
        reading = true
        next()
      }
    }
    function next() {
      return _next2.apply(this, arguments)
    }
    function _next2() {
      _next2 = _asyncToGenerator(function* () {
        try {
          var _yield$iterator$next = yield iterator2.next(),
            value = _yield$iterator$next.value,
            done = _yield$iterator$next.done
          if (done) {
            readable2.push(null)
          } else if (readable2.push(yield value)) {
            next()
          } else {
            reading = false
          }
        } catch (err2) {
          readable2.destroy(err2)
        }
      })
      return _next2.apply(this, arguments)
    }
    return readable2
  }
  from_1 = from
  return from_1
}
var _stream_readable
var hasRequired_stream_readable
function require_stream_readable() {
  if (hasRequired_stream_readable) return _stream_readable
  hasRequired_stream_readable = 1
  _stream_readable = Readable
  var Duplex
  Readable.ReadableState = ReadableState
  require$$0$5.EventEmitter
  var EElistenerCount = function EElistenerCount2(emitter, type) {
    return emitter.listeners(type).length
  }
  var Stream = requireStream$1()
  var Buffer2 = require$$0$4.Buffer
  var OurUint8Array =
    (typeof commonjsGlobal !== 'undefined'
      ? commonjsGlobal
      : typeof window !== 'undefined'
        ? window
        : typeof self !== 'undefined'
          ? self
          : {}
    ).Uint8Array || function () {}
  function _uint8ArrayToBuffer(chunk) {
    return Buffer2.from(chunk)
  }
  function _isUint8Array(obj) {
    return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array
  }
  var debugUtil = require$$0$2
  var debug
  if (debugUtil && debugUtil.debuglog) {
    debug = debugUtil.debuglog('stream')
  } else {
    debug = function debug2() {}
  }
  var BufferList = requireBuffer_list()
  var destroyImpl = requireDestroy()
  var _require = requireState(),
    getHighWaterMark = _require.getHighWaterMark
  var _require$codes = requireErrors().codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT
  var StringDecoder
  var createReadableStreamAsyncIterator
  var from
  requireInherits()(Readable, Stream)
  var errorOrDestroy = destroyImpl.errorOrDestroy
  var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume']
  function prependListener(emitter, event, fn) {
    if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn)
    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn)
    else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn)
    else emitter._events[event] = [fn, emitter._events[event]]
  }
  function ReadableState(options, stream2, isDuplex) {
    Duplex = Duplex || require_stream_duplex()
    options = options || {}
    if (typeof isDuplex !== 'boolean') isDuplex = stream2 instanceof Duplex
    this.objectMode = !!options.objectMode
    if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode
    this.highWaterMark = getHighWaterMark(this, options, 'readableHighWaterMark', isDuplex)
    this.buffer = new BufferList()
    this.length = 0
    this.pipes = null
    this.pipesCount = 0
    this.flowing = null
    this.ended = false
    this.endEmitted = false
    this.reading = false
    this.sync = true
    this.needReadable = false
    this.emittedReadable = false
    this.readableListening = false
    this.resumeScheduled = false
    this.paused = true
    this.emitClose = options.emitClose !== false
    this.autoDestroy = !!options.autoDestroy
    this.destroyed = false
    this.defaultEncoding = options.defaultEncoding || 'utf8'
    this.awaitDrain = 0
    this.readingMore = false
    this.decoder = null
    this.encoding = null
    if (options.encoding) {
      if (!StringDecoder) StringDecoder = requireString_decoder().StringDecoder
      this.decoder = new StringDecoder(options.encoding)
      this.encoding = options.encoding
    }
  }
  function Readable(options) {
    Duplex = Duplex || require_stream_duplex()
    if (!(this instanceof Readable)) return new Readable(options)
    var isDuplex = this instanceof Duplex
    this._readableState = new ReadableState(options, this, isDuplex)
    this.readable = true
    if (options) {
      if (typeof options.read === 'function') this._read = options.read
      if (typeof options.destroy === 'function') this._destroy = options.destroy
    }
    Stream.call(this)
  }
  Object.defineProperty(Readable.prototype, 'destroyed', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      if (this._readableState === void 0) {
        return false
      }
      return this._readableState.destroyed
    },
    set: function set(value) {
      if (!this._readableState) {
        return
      }
      this._readableState.destroyed = value
    },
  })
  Readable.prototype.destroy = destroyImpl.destroy
  Readable.prototype._undestroy = destroyImpl.undestroy
  Readable.prototype._destroy = function (err2, cb) {
    cb(err2)
  }
  Readable.prototype.push = function (chunk, encoding) {
    var state2 = this._readableState
    var skipChunkCheck
    if (!state2.objectMode) {
      if (typeof chunk === 'string') {
        encoding = encoding || state2.defaultEncoding
        if (encoding !== state2.encoding) {
          chunk = Buffer2.from(chunk, encoding)
          encoding = ''
        }
        skipChunkCheck = true
      }
    } else {
      skipChunkCheck = true
    }
    return readableAddChunk(this, chunk, encoding, false, skipChunkCheck)
  }
  Readable.prototype.unshift = function (chunk) {
    return readableAddChunk(this, chunk, null, true, false)
  }
  function readableAddChunk(stream2, chunk, encoding, addToFront, skipChunkCheck) {
    debug('readableAddChunk', chunk)
    var state2 = stream2._readableState
    if (chunk === null) {
      state2.reading = false
      onEofChunk(stream2, state2)
    } else {
      var er
      if (!skipChunkCheck) er = chunkInvalid(state2, chunk)
      if (er) {
        errorOrDestroy(stream2, er)
      } else if (state2.objectMode || (chunk && chunk.length > 0)) {
        if (
          typeof chunk !== 'string' &&
          !state2.objectMode &&
          Object.getPrototypeOf(chunk) !== Buffer2.prototype
        ) {
          chunk = _uint8ArrayToBuffer(chunk)
        }
        if (addToFront) {
          if (state2.endEmitted) errorOrDestroy(stream2, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT())
          else addChunk(stream2, state2, chunk, true)
        } else if (state2.ended) {
          errorOrDestroy(stream2, new ERR_STREAM_PUSH_AFTER_EOF())
        } else if (state2.destroyed) {
          return false
        } else {
          state2.reading = false
          if (state2.decoder && !encoding) {
            chunk = state2.decoder.write(chunk)
            if (state2.objectMode || chunk.length !== 0) addChunk(stream2, state2, chunk, false)
            else maybeReadMore(stream2, state2)
          } else {
            addChunk(stream2, state2, chunk, false)
          }
        }
      } else if (!addToFront) {
        state2.reading = false
        maybeReadMore(stream2, state2)
      }
    }
    return !state2.ended && (state2.length < state2.highWaterMark || state2.length === 0)
  }
  function addChunk(stream2, state2, chunk, addToFront) {
    if (state2.flowing && state2.length === 0 && !state2.sync) {
      state2.awaitDrain = 0
      stream2.emit('data', chunk)
    } else {
      state2.length += state2.objectMode ? 1 : chunk.length
      if (addToFront) state2.buffer.unshift(chunk)
      else state2.buffer.push(chunk)
      if (state2.needReadable) emitReadable(stream2)
    }
    maybeReadMore(stream2, state2)
  }
  function chunkInvalid(state2, chunk) {
    var er
    if (
      !_isUint8Array(chunk) &&
      typeof chunk !== 'string' &&
      chunk !== void 0 &&
      !state2.objectMode
    ) {
      er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk)
    }
    return er
  }
  Readable.prototype.isPaused = function () {
    return this._readableState.flowing === false
  }
  Readable.prototype.setEncoding = function (enc) {
    if (!StringDecoder) StringDecoder = requireString_decoder().StringDecoder
    var decoder = new StringDecoder(enc)
    this._readableState.decoder = decoder
    this._readableState.encoding = this._readableState.decoder.encoding
    var p = this._readableState.buffer.head
    var content = ''
    while (p !== null) {
      content += decoder.write(p.data)
      p = p.next
    }
    this._readableState.buffer.clear()
    if (content !== '') this._readableState.buffer.push(content)
    this._readableState.length = content.length
    return this
  }
  var MAX_HWM = 1073741824
  function computeNewHighWaterMark(n) {
    if (n >= MAX_HWM) {
      n = MAX_HWM
    } else {
      n--
      n |= n >>> 1
      n |= n >>> 2
      n |= n >>> 4
      n |= n >>> 8
      n |= n >>> 16
      n++
    }
    return n
  }
  function howMuchToRead(n, state2) {
    if (n <= 0 || (state2.length === 0 && state2.ended)) return 0
    if (state2.objectMode) return 1
    if (n !== n) {
      if (state2.flowing && state2.length) return state2.buffer.head.data.length
      else return state2.length
    }
    if (n > state2.highWaterMark) state2.highWaterMark = computeNewHighWaterMark(n)
    if (n <= state2.length) return n
    if (!state2.ended) {
      state2.needReadable = true
      return 0
    }
    return state2.length
  }
  Readable.prototype.read = function (n) {
    debug('read', n)
    n = parseInt(n, 10)
    var state2 = this._readableState
    var nOrig = n
    if (n !== 0) state2.emittedReadable = false
    if (
      n === 0 &&
      state2.needReadable &&
      ((state2.highWaterMark !== 0 ? state2.length >= state2.highWaterMark : state2.length > 0) ||
        state2.ended)
    ) {
      debug('read: emitReadable', state2.length, state2.ended)
      if (state2.length === 0 && state2.ended) endReadable(this)
      else emitReadable(this)
      return null
    }
    n = howMuchToRead(n, state2)
    if (n === 0 && state2.ended) {
      if (state2.length === 0) endReadable(this)
      return null
    }
    var doRead = state2.needReadable
    debug('need readable', doRead)
    if (state2.length === 0 || state2.length - n < state2.highWaterMark) {
      doRead = true
      debug('length less than watermark', doRead)
    }
    if (state2.ended || state2.reading) {
      doRead = false
      debug('reading or ended', doRead)
    } else if (doRead) {
      debug('do read')
      state2.reading = true
      state2.sync = true
      if (state2.length === 0) state2.needReadable = true
      this._read(state2.highWaterMark)
      state2.sync = false
      if (!state2.reading) n = howMuchToRead(nOrig, state2)
    }
    var ret
    if (n > 0) ret = fromList(n, state2)
    else ret = null
    if (ret === null) {
      state2.needReadable = state2.length <= state2.highWaterMark
      n = 0
    } else {
      state2.length -= n
      state2.awaitDrain = 0
    }
    if (state2.length === 0) {
      if (!state2.ended) state2.needReadable = true
      if (nOrig !== n && state2.ended) endReadable(this)
    }
    if (ret !== null) this.emit('data', ret)
    return ret
  }
  function onEofChunk(stream2, state2) {
    debug('onEofChunk')
    if (state2.ended) return
    if (state2.decoder) {
      var chunk = state2.decoder.end()
      if (chunk && chunk.length) {
        state2.buffer.push(chunk)
        state2.length += state2.objectMode ? 1 : chunk.length
      }
    }
    state2.ended = true
    if (state2.sync) {
      emitReadable(stream2)
    } else {
      state2.needReadable = false
      if (!state2.emittedReadable) {
        state2.emittedReadable = true
        emitReadable_(stream2)
      }
    }
  }
  function emitReadable(stream2) {
    var state2 = stream2._readableState
    debug('emitReadable', state2.needReadable, state2.emittedReadable)
    state2.needReadable = false
    if (!state2.emittedReadable) {
      debug('emitReadable', state2.flowing)
      state2.emittedReadable = true
      process.nextTick(emitReadable_, stream2)
    }
  }
  function emitReadable_(stream2) {
    var state2 = stream2._readableState
    debug('emitReadable_', state2.destroyed, state2.length, state2.ended)
    if (!state2.destroyed && (state2.length || state2.ended)) {
      stream2.emit('readable')
      state2.emittedReadable = false
    }
    state2.needReadable = !state2.flowing && !state2.ended && state2.length <= state2.highWaterMark
    flow(stream2)
  }
  function maybeReadMore(stream2, state2) {
    if (!state2.readingMore) {
      state2.readingMore = true
      process.nextTick(maybeReadMore_, stream2, state2)
    }
  }
  function maybeReadMore_(stream2, state2) {
    while (
      !state2.reading &&
      !state2.ended &&
      (state2.length < state2.highWaterMark || (state2.flowing && state2.length === 0))
    ) {
      var len = state2.length
      debug('maybeReadMore read 0')
      stream2.read(0)
      if (len === state2.length) break
    }
    state2.readingMore = false
  }
  Readable.prototype._read = function (n) {
    errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED('_read()'))
  }
  Readable.prototype.pipe = function (dest, pipeOpts) {
    var src = this
    var state2 = this._readableState
    switch (state2.pipesCount) {
      case 0:
        state2.pipes = dest
        break
      case 1:
        state2.pipes = [state2.pipes, dest]
        break
      default:
        state2.pipes.push(dest)
        break
    }
    state2.pipesCount += 1
    debug('pipe count=%d opts=%j', state2.pipesCount, pipeOpts)
    var doEnd =
      (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr
    var endFn = doEnd ? onend : unpipe
    if (state2.endEmitted) process.nextTick(endFn)
    else src.once('end', endFn)
    dest.on('unpipe', onunpipe)
    function onunpipe(readable2, unpipeInfo) {
      debug('onunpipe')
      if (readable2 === src) {
        if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
          unpipeInfo.hasUnpiped = true
          cleanup()
        }
      }
    }
    function onend() {
      debug('onend')
      dest.end()
    }
    var ondrain = pipeOnDrain(src)
    dest.on('drain', ondrain)
    var cleanedUp = false
    function cleanup() {
      debug('cleanup')
      dest.removeListener('close', onclose)
      dest.removeListener('finish', onfinish)
      dest.removeListener('drain', ondrain)
      dest.removeListener('error', onerror)
      dest.removeListener('unpipe', onunpipe)
      src.removeListener('end', onend)
      src.removeListener('end', unpipe)
      src.removeListener('data', ondata)
      cleanedUp = true
      if (state2.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain()
    }
    src.on('data', ondata)
    function ondata(chunk) {
      debug('ondata')
      var ret = dest.write(chunk)
      debug('dest.write', ret)
      if (ret === false) {
        if (
          ((state2.pipesCount === 1 && state2.pipes === dest) ||
            (state2.pipesCount > 1 && indexOf(state2.pipes, dest) !== -1)) &&
          !cleanedUp
        ) {
          debug('false write response, pause', state2.awaitDrain)
          state2.awaitDrain++
        }
        src.pause()
      }
    }
    function onerror(er) {
      debug('onerror', er)
      unpipe()
      dest.removeListener('error', onerror)
      if (EElistenerCount(dest, 'error') === 0) errorOrDestroy(dest, er)
    }
    prependListener(dest, 'error', onerror)
    function onclose() {
      dest.removeListener('finish', onfinish)
      unpipe()
    }
    dest.once('close', onclose)
    function onfinish() {
      debug('onfinish')
      dest.removeListener('close', onclose)
      unpipe()
    }
    dest.once('finish', onfinish)
    function unpipe() {
      debug('unpipe')
      src.unpipe(dest)
    }
    dest.emit('pipe', src)
    if (!state2.flowing) {
      debug('pipe resume')
      src.resume()
    }
    return dest
  }
  function pipeOnDrain(src) {
    return function pipeOnDrainFunctionResult() {
      var state2 = src._readableState
      debug('pipeOnDrain', state2.awaitDrain)
      if (state2.awaitDrain) state2.awaitDrain--
      if (state2.awaitDrain === 0 && EElistenerCount(src, 'data')) {
        state2.flowing = true
        flow(src)
      }
    }
  }
  Readable.prototype.unpipe = function (dest) {
    var state2 = this._readableState
    var unpipeInfo = {
      hasUnpiped: false,
    }
    if (state2.pipesCount === 0) return this
    if (state2.pipesCount === 1) {
      if (dest && dest !== state2.pipes) return this
      if (!dest) dest = state2.pipes
      state2.pipes = null
      state2.pipesCount = 0
      state2.flowing = false
      if (dest) dest.emit('unpipe', this, unpipeInfo)
      return this
    }
    if (!dest) {
      var dests = state2.pipes
      var len = state2.pipesCount
      state2.pipes = null
      state2.pipesCount = 0
      state2.flowing = false
      for (var i = 0; i < len; i++)
        dests[i].emit('unpipe', this, {
          hasUnpiped: false,
        })
      return this
    }
    var index = indexOf(state2.pipes, dest)
    if (index === -1) return this
    state2.pipes.splice(index, 1)
    state2.pipesCount -= 1
    if (state2.pipesCount === 1) state2.pipes = state2.pipes[0]
    dest.emit('unpipe', this, unpipeInfo)
    return this
  }
  Readable.prototype.on = function (ev, fn) {
    var res = Stream.prototype.on.call(this, ev, fn)
    var state2 = this._readableState
    if (ev === 'data') {
      state2.readableListening = this.listenerCount('readable') > 0
      if (state2.flowing !== false) this.resume()
    } else if (ev === 'readable') {
      if (!state2.endEmitted && !state2.readableListening) {
        state2.readableListening = state2.needReadable = true
        state2.flowing = false
        state2.emittedReadable = false
        debug('on readable', state2.length, state2.reading)
        if (state2.length) {
          emitReadable(this)
        } else if (!state2.reading) {
          process.nextTick(nReadingNextTick, this)
        }
      }
    }
    return res
  }
  Readable.prototype.addListener = Readable.prototype.on
  Readable.prototype.removeListener = function (ev, fn) {
    var res = Stream.prototype.removeListener.call(this, ev, fn)
    if (ev === 'readable') {
      process.nextTick(updateReadableListening, this)
    }
    return res
  }
  Readable.prototype.removeAllListeners = function (ev) {
    var res = Stream.prototype.removeAllListeners.apply(this, arguments)
    if (ev === 'readable' || ev === void 0) {
      process.nextTick(updateReadableListening, this)
    }
    return res
  }
  function updateReadableListening(self2) {
    var state2 = self2._readableState
    state2.readableListening = self2.listenerCount('readable') > 0
    if (state2.resumeScheduled && !state2.paused) {
      state2.flowing = true
    } else if (self2.listenerCount('data') > 0) {
      self2.resume()
    }
  }
  function nReadingNextTick(self2) {
    debug('readable nexttick read 0')
    self2.read(0)
  }
  Readable.prototype.resume = function () {
    var state2 = this._readableState
    if (!state2.flowing) {
      debug('resume')
      state2.flowing = !state2.readableListening
      resume(this, state2)
    }
    state2.paused = false
    return this
  }
  function resume(stream2, state2) {
    if (!state2.resumeScheduled) {
      state2.resumeScheduled = true
      process.nextTick(resume_, stream2, state2)
    }
  }
  function resume_(stream2, state2) {
    debug('resume', state2.reading)
    if (!state2.reading) {
      stream2.read(0)
    }
    state2.resumeScheduled = false
    stream2.emit('resume')
    flow(stream2)
    if (state2.flowing && !state2.reading) stream2.read(0)
  }
  Readable.prototype.pause = function () {
    debug('call pause flowing=%j', this._readableState.flowing)
    if (this._readableState.flowing !== false) {
      debug('pause')
      this._readableState.flowing = false
      this.emit('pause')
    }
    this._readableState.paused = true
    return this
  }
  function flow(stream2) {
    var state2 = stream2._readableState
    debug('flow', state2.flowing)
    while (state2.flowing && stream2.read() !== null);
  }
  Readable.prototype.wrap = function (stream2) {
    var _this = this
    var state2 = this._readableState
    var paused = false
    stream2.on('end', function () {
      debug('wrapped end')
      if (state2.decoder && !state2.ended) {
        var chunk = state2.decoder.end()
        if (chunk && chunk.length) _this.push(chunk)
      }
      _this.push(null)
    })
    stream2.on('data', function (chunk) {
      debug('wrapped data')
      if (state2.decoder) chunk = state2.decoder.write(chunk)
      if (state2.objectMode && (chunk === null || chunk === void 0)) return
      else if (!state2.objectMode && (!chunk || !chunk.length)) return
      var ret = _this.push(chunk)
      if (!ret) {
        paused = true
        stream2.pause()
      }
    })
    for (var i in stream2) {
      if (this[i] === void 0 && typeof stream2[i] === 'function') {
        this[i] = /* @__PURE__ */ (function methodWrap(method) {
          return function methodWrapReturnFunction() {
            return stream2[method].apply(stream2, arguments)
          }
        })(i)
      }
    }
    for (var n = 0; n < kProxyEvents.length; n++) {
      stream2.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]))
    }
    this._read = function (n2) {
      debug('wrapped _read', n2)
      if (paused) {
        paused = false
        stream2.resume()
      }
    }
    return this
  }
  if (typeof Symbol === 'function') {
    Readable.prototype[Symbol.asyncIterator] = function () {
      if (createReadableStreamAsyncIterator === void 0) {
        createReadableStreamAsyncIterator = requireAsync_iterator()
      }
      return createReadableStreamAsyncIterator(this)
    }
  }
  Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      return this._readableState.highWaterMark
    },
  })
  Object.defineProperty(Readable.prototype, 'readableBuffer', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      return this._readableState && this._readableState.buffer
    },
  })
  Object.defineProperty(Readable.prototype, 'readableFlowing', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      return this._readableState.flowing
    },
    set: function set(state2) {
      if (this._readableState) {
        this._readableState.flowing = state2
      }
    },
  })
  Readable._fromList = fromList
  Object.defineProperty(Readable.prototype, 'readableLength', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      return this._readableState.length
    },
  })
  function fromList(n, state2) {
    if (state2.length === 0) return null
    var ret
    if (state2.objectMode) ret = state2.buffer.shift()
    else if (!n || n >= state2.length) {
      if (state2.decoder) ret = state2.buffer.join('')
      else if (state2.buffer.length === 1) ret = state2.buffer.first()
      else ret = state2.buffer.concat(state2.length)
      state2.buffer.clear()
    } else {
      ret = state2.buffer.consume(n, state2.decoder)
    }
    return ret
  }
  function endReadable(stream2) {
    var state2 = stream2._readableState
    debug('endReadable', state2.endEmitted)
    if (!state2.endEmitted) {
      state2.ended = true
      process.nextTick(endReadableNT, state2, stream2)
    }
  }
  function endReadableNT(state2, stream2) {
    debug('endReadableNT', state2.endEmitted, state2.length)
    if (!state2.endEmitted && state2.length === 0) {
      state2.endEmitted = true
      stream2.readable = false
      stream2.emit('end')
      if (state2.autoDestroy) {
        var wState = stream2._writableState
        if (!wState || (wState.autoDestroy && wState.finished)) {
          stream2.destroy()
        }
      }
    }
  }
  if (typeof Symbol === 'function') {
    Readable.from = function (iterable, opts) {
      if (from === void 0) {
        from = requireFrom()
      }
      return from(Readable, iterable, opts)
    }
  }
  function indexOf(xs, x) {
    for (var i = 0, l = xs.length; i < l; i++) {
      if (xs[i] === x) return i
    }
    return -1
  }
  return _stream_readable
}
var _stream_duplex
var hasRequired_stream_duplex
function require_stream_duplex() {
  if (hasRequired_stream_duplex) return _stream_duplex
  hasRequired_stream_duplex = 1
  var objectKeys =
    Object.keys ||
    function (obj) {
      var keys2 = []
      for (var key in obj) keys2.push(key)
      return keys2
    }
  _stream_duplex = Duplex
  var Readable = require_stream_readable()
  var Writable = require_stream_writable()
  requireInherits()(Duplex, Readable)
  {
    var keys = objectKeys(Writable.prototype)
    for (var v = 0; v < keys.length; v++) {
      var method = keys[v]
      if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method]
    }
  }
  function Duplex(options) {
    if (!(this instanceof Duplex)) return new Duplex(options)
    Readable.call(this, options)
    Writable.call(this, options)
    this.allowHalfOpen = true
    if (options) {
      if (options.readable === false) this.readable = false
      if (options.writable === false) this.writable = false
      if (options.allowHalfOpen === false) {
        this.allowHalfOpen = false
        this.once('end', onend)
      }
    }
  }
  Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      return this._writableState.highWaterMark
    },
  })
  Object.defineProperty(Duplex.prototype, 'writableBuffer', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      return this._writableState && this._writableState.getBuffer()
    },
  })
  Object.defineProperty(Duplex.prototype, 'writableLength', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      return this._writableState.length
    },
  })
  function onend() {
    if (this._writableState.ended) return
    process.nextTick(onEndNT, this)
  }
  function onEndNT(self2) {
    self2.end()
  }
  Object.defineProperty(Duplex.prototype, 'destroyed', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      if (this._readableState === void 0 || this._writableState === void 0) {
        return false
      }
      return this._readableState.destroyed && this._writableState.destroyed
    },
    set: function set(value) {
      if (this._readableState === void 0 || this._writableState === void 0) {
        return
      }
      this._readableState.destroyed = value
      this._writableState.destroyed = value
    },
  })
  return _stream_duplex
}
var _stream_writable
var hasRequired_stream_writable
function require_stream_writable() {
  if (hasRequired_stream_writable) return _stream_writable
  hasRequired_stream_writable = 1
  _stream_writable = Writable
  function CorkedRequest(state2) {
    var _this = this
    this.next = null
    this.entry = null
    this.finish = function () {
      onCorkedFinish(_this, state2)
    }
  }
  var Duplex
  Writable.WritableState = WritableState
  var internalUtil = {
    deprecate: requireNode$1(),
  }
  var Stream = requireStream$1()
  var Buffer2 = require$$0$4.Buffer
  var OurUint8Array =
    (typeof commonjsGlobal !== 'undefined'
      ? commonjsGlobal
      : typeof window !== 'undefined'
        ? window
        : typeof self !== 'undefined'
          ? self
          : {}
    ).Uint8Array || function () {}
  function _uint8ArrayToBuffer(chunk) {
    return Buffer2.from(chunk)
  }
  function _isUint8Array(obj) {
    return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array
  }
  var destroyImpl = requireDestroy()
  var _require = requireState(),
    getHighWaterMark = _require.getHighWaterMark
  var _require$codes = requireErrors().codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
    ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
    ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
    ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING
  var errorOrDestroy = destroyImpl.errorOrDestroy
  requireInherits()(Writable, Stream)
  function nop() {}
  function WritableState(options, stream2, isDuplex) {
    Duplex = Duplex || require_stream_duplex()
    options = options || {}
    if (typeof isDuplex !== 'boolean') isDuplex = stream2 instanceof Duplex
    this.objectMode = !!options.objectMode
    if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode
    this.highWaterMark = getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex)
    this.finalCalled = false
    this.needDrain = false
    this.ending = false
    this.ended = false
    this.finished = false
    this.destroyed = false
    var noDecode = options.decodeStrings === false
    this.decodeStrings = !noDecode
    this.defaultEncoding = options.defaultEncoding || 'utf8'
    this.length = 0
    this.writing = false
    this.corked = 0
    this.sync = true
    this.bufferProcessing = false
    this.onwrite = function (er) {
      onwrite(stream2, er)
    }
    this.writecb = null
    this.writelen = 0
    this.bufferedRequest = null
    this.lastBufferedRequest = null
    this.pendingcb = 0
    this.prefinished = false
    this.errorEmitted = false
    this.emitClose = options.emitClose !== false
    this.autoDestroy = !!options.autoDestroy
    this.bufferedRequestCount = 0
    this.corkedRequestsFree = new CorkedRequest(this)
  }
  WritableState.prototype.getBuffer = function getBuffer() {
    var current = this.bufferedRequest
    var out = []
    while (current) {
      out.push(current)
      current = current.next
    }
    return out
  }
  ;(function () {
    try {
      Object.defineProperty(WritableState.prototype, 'buffer', {
        get: internalUtil.deprecate(
          function writableStateBufferGetter() {
            return this.getBuffer()
          },
          '_writableState.buffer is deprecated. Use _writableState.getBuffer instead.',
          'DEP0003',
        ),
      })
    } catch (_) {}
  })()
  var realHasInstance
  if (
    typeof Symbol === 'function' &&
    Symbol.hasInstance &&
    typeof Function.prototype[Symbol.hasInstance] === 'function'
  ) {
    realHasInstance = Function.prototype[Symbol.hasInstance]
    Object.defineProperty(Writable, Symbol.hasInstance, {
      value: function value(object) {
        if (realHasInstance.call(this, object)) return true
        if (this !== Writable) return false
        return object && object._writableState instanceof WritableState
      },
    })
  } else {
    realHasInstance = function realHasInstance2(object) {
      return object instanceof this
    }
  }
  function Writable(options) {
    Duplex = Duplex || require_stream_duplex()
    var isDuplex = this instanceof Duplex
    if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options)
    this._writableState = new WritableState(options, this, isDuplex)
    this.writable = true
    if (options) {
      if (typeof options.write === 'function') this._write = options.write
      if (typeof options.writev === 'function') this._writev = options.writev
      if (typeof options.destroy === 'function') this._destroy = options.destroy
      if (typeof options.final === 'function') this._final = options.final
    }
    Stream.call(this)
  }
  Writable.prototype.pipe = function () {
    errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE())
  }
  function writeAfterEnd(stream2, cb) {
    var er = new ERR_STREAM_WRITE_AFTER_END()
    errorOrDestroy(stream2, er)
    process.nextTick(cb, er)
  }
  function validChunk(stream2, state2, chunk, cb) {
    var er
    if (chunk === null) {
      er = new ERR_STREAM_NULL_VALUES()
    } else if (typeof chunk !== 'string' && !state2.objectMode) {
      er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer'], chunk)
    }
    if (er) {
      errorOrDestroy(stream2, er)
      process.nextTick(cb, er)
      return false
    }
    return true
  }
  Writable.prototype.write = function (chunk, encoding, cb) {
    var state2 = this._writableState
    var ret = false
    var isBuf = !state2.objectMode && _isUint8Array(chunk)
    if (isBuf && !Buffer2.isBuffer(chunk)) {
      chunk = _uint8ArrayToBuffer(chunk)
    }
    if (typeof encoding === 'function') {
      cb = encoding
      encoding = null
    }
    if (isBuf) encoding = 'buffer'
    else if (!encoding) encoding = state2.defaultEncoding
    if (typeof cb !== 'function') cb = nop
    if (state2.ending) writeAfterEnd(this, cb)
    else if (isBuf || validChunk(this, state2, chunk, cb)) {
      state2.pendingcb++
      ret = writeOrBuffer(this, state2, isBuf, chunk, encoding, cb)
    }
    return ret
  }
  Writable.prototype.cork = function () {
    this._writableState.corked++
  }
  Writable.prototype.uncork = function () {
    var state2 = this._writableState
    if (state2.corked) {
      state2.corked--
      if (!state2.writing && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest)
        clearBuffer(this, state2)
    }
  }
  Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
    if (typeof encoding === 'string') encoding = encoding.toLowerCase()
    if (
      !(
        [
          'hex',
          'utf8',
          'utf-8',
          'ascii',
          'binary',
          'base64',
          'ucs2',
          'ucs-2',
          'utf16le',
          'utf-16le',
          'raw',
        ].indexOf((encoding + '').toLowerCase()) > -1
      )
    )
      throw new ERR_UNKNOWN_ENCODING(encoding)
    this._writableState.defaultEncoding = encoding
    return this
  }
  Object.defineProperty(Writable.prototype, 'writableBuffer', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      return this._writableState && this._writableState.getBuffer()
    },
  })
  function decodeChunk(state2, chunk, encoding) {
    if (!state2.objectMode && state2.decodeStrings !== false && typeof chunk === 'string') {
      chunk = Buffer2.from(chunk, encoding)
    }
    return chunk
  }
  Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      return this._writableState.highWaterMark
    },
  })
  function writeOrBuffer(stream2, state2, isBuf, chunk, encoding, cb) {
    if (!isBuf) {
      var newChunk = decodeChunk(state2, chunk, encoding)
      if (chunk !== newChunk) {
        isBuf = true
        encoding = 'buffer'
        chunk = newChunk
      }
    }
    var len = state2.objectMode ? 1 : chunk.length
    state2.length += len
    var ret = state2.length < state2.highWaterMark
    if (!ret) state2.needDrain = true
    if (state2.writing || state2.corked) {
      var last = state2.lastBufferedRequest
      state2.lastBufferedRequest = {
        chunk,
        encoding,
        isBuf,
        callback: cb,
        next: null,
      }
      if (last) {
        last.next = state2.lastBufferedRequest
      } else {
        state2.bufferedRequest = state2.lastBufferedRequest
      }
      state2.bufferedRequestCount += 1
    } else {
      doWrite(stream2, state2, false, len, chunk, encoding, cb)
    }
    return ret
  }
  function doWrite(stream2, state2, writev, len, chunk, encoding, cb) {
    state2.writelen = len
    state2.writecb = cb
    state2.writing = true
    state2.sync = true
    if (state2.destroyed) state2.onwrite(new ERR_STREAM_DESTROYED('write'))
    else if (writev) stream2._writev(chunk, state2.onwrite)
    else stream2._write(chunk, encoding, state2.onwrite)
    state2.sync = false
  }
  function onwriteError(stream2, state2, sync, er, cb) {
    --state2.pendingcb
    if (sync) {
      process.nextTick(cb, er)
      process.nextTick(finishMaybe, stream2, state2)
      stream2._writableState.errorEmitted = true
      errorOrDestroy(stream2, er)
    } else {
      cb(er)
      stream2._writableState.errorEmitted = true
      errorOrDestroy(stream2, er)
      finishMaybe(stream2, state2)
    }
  }
  function onwriteStateUpdate(state2) {
    state2.writing = false
    state2.writecb = null
    state2.length -= state2.writelen
    state2.writelen = 0
  }
  function onwrite(stream2, er) {
    var state2 = stream2._writableState
    var sync = state2.sync
    var cb = state2.writecb
    if (typeof cb !== 'function') throw new ERR_MULTIPLE_CALLBACK()
    onwriteStateUpdate(state2)
    if (er) onwriteError(stream2, state2, sync, er, cb)
    else {
      var finished = needFinish(state2) || stream2.destroyed
      if (!finished && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) {
        clearBuffer(stream2, state2)
      }
      if (sync) {
        process.nextTick(afterWrite, stream2, state2, finished, cb)
      } else {
        afterWrite(stream2, state2, finished, cb)
      }
    }
  }
  function afterWrite(stream2, state2, finished, cb) {
    if (!finished) onwriteDrain(stream2, state2)
    state2.pendingcb--
    cb()
    finishMaybe(stream2, state2)
  }
  function onwriteDrain(stream2, state2) {
    if (state2.length === 0 && state2.needDrain) {
      state2.needDrain = false
      stream2.emit('drain')
    }
  }
  function clearBuffer(stream2, state2) {
    state2.bufferProcessing = true
    var entry = state2.bufferedRequest
    if (stream2._writev && entry && entry.next) {
      var l = state2.bufferedRequestCount
      var buffer = new Array(l)
      var holder = state2.corkedRequestsFree
      holder.entry = entry
      var count = 0
      var allBuffers = true
      while (entry) {
        buffer[count] = entry
        if (!entry.isBuf) allBuffers = false
        entry = entry.next
        count += 1
      }
      buffer.allBuffers = allBuffers
      doWrite(stream2, state2, true, state2.length, buffer, '', holder.finish)
      state2.pendingcb++
      state2.lastBufferedRequest = null
      if (holder.next) {
        state2.corkedRequestsFree = holder.next
        holder.next = null
      } else {
        state2.corkedRequestsFree = new CorkedRequest(state2)
      }
      state2.bufferedRequestCount = 0
    } else {
      while (entry) {
        var chunk = entry.chunk
        var encoding = entry.encoding
        var cb = entry.callback
        var len = state2.objectMode ? 1 : chunk.length
        doWrite(stream2, state2, false, len, chunk, encoding, cb)
        entry = entry.next
        state2.bufferedRequestCount--
        if (state2.writing) {
          break
        }
      }
      if (entry === null) state2.lastBufferedRequest = null
    }
    state2.bufferedRequest = entry
    state2.bufferProcessing = false
  }
  Writable.prototype._write = function (chunk, encoding, cb) {
    cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'))
  }
  Writable.prototype._writev = null
  Writable.prototype.end = function (chunk, encoding, cb) {
    var state2 = this._writableState
    if (typeof chunk === 'function') {
      cb = chunk
      chunk = null
      encoding = null
    } else if (typeof encoding === 'function') {
      cb = encoding
      encoding = null
    }
    if (chunk !== null && chunk !== void 0) this.write(chunk, encoding)
    if (state2.corked) {
      state2.corked = 1
      this.uncork()
    }
    if (!state2.ending) endWritable(this, state2, cb)
    return this
  }
  Object.defineProperty(Writable.prototype, 'writableLength', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      return this._writableState.length
    },
  })
  function needFinish(state2) {
    return (
      state2.ending &&
      state2.length === 0 &&
      state2.bufferedRequest === null &&
      !state2.finished &&
      !state2.writing
    )
  }
  function callFinal(stream2, state2) {
    stream2._final(function (err2) {
      state2.pendingcb--
      if (err2) {
        errorOrDestroy(stream2, err2)
      }
      state2.prefinished = true
      stream2.emit('prefinish')
      finishMaybe(stream2, state2)
    })
  }
  function prefinish(stream2, state2) {
    if (!state2.prefinished && !state2.finalCalled) {
      if (typeof stream2._final === 'function' && !state2.destroyed) {
        state2.pendingcb++
        state2.finalCalled = true
        process.nextTick(callFinal, stream2, state2)
      } else {
        state2.prefinished = true
        stream2.emit('prefinish')
      }
    }
  }
  function finishMaybe(stream2, state2) {
    var need = needFinish(state2)
    if (need) {
      prefinish(stream2, state2)
      if (state2.pendingcb === 0) {
        state2.finished = true
        stream2.emit('finish')
        if (state2.autoDestroy) {
          var rState = stream2._readableState
          if (!rState || (rState.autoDestroy && rState.endEmitted)) {
            stream2.destroy()
          }
        }
      }
    }
    return need
  }
  function endWritable(stream2, state2, cb) {
    state2.ending = true
    finishMaybe(stream2, state2)
    if (cb) {
      if (state2.finished) process.nextTick(cb)
      else stream2.once('finish', cb)
    }
    state2.ended = true
    stream2.writable = false
  }
  function onCorkedFinish(corkReq, state2, err2) {
    var entry = corkReq.entry
    corkReq.entry = null
    while (entry) {
      var cb = entry.callback
      state2.pendingcb--
      cb(err2)
      entry = entry.next
    }
    state2.corkedRequestsFree.next = corkReq
  }
  Object.defineProperty(Writable.prototype, 'destroyed', {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get() {
      if (this._writableState === void 0) {
        return false
      }
      return this._writableState.destroyed
    },
    set: function set(value) {
      if (!this._writableState) {
        return
      }
      this._writableState.destroyed = value
    },
  })
  Writable.prototype.destroy = destroyImpl.destroy
  Writable.prototype._undestroy = destroyImpl.undestroy
  Writable.prototype._destroy = function (err2, cb) {
    cb(err2)
  }
  return _stream_writable
}
var hasRequiredModern
function requireModern() {
  if (hasRequiredModern) return modern.exports
  hasRequiredModern = 1
  const util2 = require$$0$2
  const Writable = require_stream_writable()
  const { LEVEL } = requireTripleBeam()
  const TransportStream = (modern.exports = function TransportStream2(options = {}) {
    Writable.call(this, { objectMode: true, highWaterMark: options.highWaterMark })
    this.format = options.format
    this.level = options.level
    this.handleExceptions = options.handleExceptions
    this.handleRejections = options.handleRejections
    this.silent = options.silent
    if (options.log) this.log = options.log
    if (options.logv) this.logv = options.logv
    if (options.close) this.close = options.close
    this.once('pipe', (logger2) => {
      this.levels = logger2.levels
      this.parent = logger2
    })
    this.once('unpipe', (src) => {
      if (src === this.parent) {
        this.parent = null
        if (this.close) {
          this.close()
        }
      }
    })
  })
  util2.inherits(TransportStream, Writable)
  TransportStream.prototype._write = function _write(info, enc, callback) {
    if (this.silent || (info.exception === true && !this.handleExceptions)) {
      return callback(null)
    }
    const level = this.level || (this.parent && this.parent.level)
    if (!level || this.levels[level] >= this.levels[info[LEVEL]]) {
      if (info && !this.format) {
        return this.log(info, callback)
      }
      let errState
      let transformed
      try {
        transformed = this.format.transform(Object.assign({}, info), this.format.options)
      } catch (err2) {
        errState = err2
      }
      if (errState || !transformed) {
        callback()
        if (errState) throw errState
        return
      }
      return this.log(transformed, callback)
    }
    this._writableState.sync = false
    return callback(null)
  }
  TransportStream.prototype._writev = function _writev(chunks, callback) {
    if (this.logv) {
      const infos = chunks.filter(this._accept, this)
      if (!infos.length) {
        return callback(null)
      }
      return this.logv(infos, callback)
    }
    for (let i = 0; i < chunks.length; i++) {
      if (!this._accept(chunks[i])) continue
      if (chunks[i].chunk && !this.format) {
        this.log(chunks[i].chunk, chunks[i].callback)
        continue
      }
      let errState
      let transformed
      try {
        transformed = this.format.transform(Object.assign({}, chunks[i].chunk), this.format.options)
      } catch (err2) {
        errState = err2
      }
      if (errState || !transformed) {
        chunks[i].callback()
        if (errState) {
          callback(null)
          throw errState
        }
      } else {
        this.log(transformed, chunks[i].callback)
      }
    }
    return callback(null)
  }
  TransportStream.prototype._accept = function _accept(write) {
    const info = write.chunk
    if (this.silent) {
      return false
    }
    const level = this.level || (this.parent && this.parent.level)
    if (info.exception === true || !level || this.levels[level] >= this.levels[info[LEVEL]]) {
      if (this.handleExceptions || info.exception !== true) {
        return true
      }
    }
    return false
  }
  TransportStream.prototype._nop = function _nop() {
    return void 0
  }
  return modern.exports
}
var legacy = { exports: {} }
var hasRequiredLegacy
function requireLegacy() {
  if (hasRequiredLegacy) return legacy.exports
  hasRequiredLegacy = 1
  const util2 = require$$0$2
  const { LEVEL } = requireTripleBeam()
  const TransportStream = requireModern()
  const LegacyTransportStream = (legacy.exports = function LegacyTransportStream2(options = {}) {
    TransportStream.call(this, options)
    if (!options.transport || typeof options.transport.log !== 'function') {
      throw new Error('Invalid transport, must be an object with a log method.')
    }
    this.transport = options.transport
    this.level = this.level || options.transport.level
    this.handleExceptions = this.handleExceptions || options.transport.handleExceptions
    this._deprecated()
    function transportError(err2) {
      this.emit('error', err2, this.transport)
    }
    if (!this.transport.__winstonError) {
      this.transport.__winstonError = transportError.bind(this)
      this.transport.on('error', this.transport.__winstonError)
    }
  })
  util2.inherits(LegacyTransportStream, TransportStream)
  LegacyTransportStream.prototype._write = function _write(info, enc, callback) {
    if (this.silent || (info.exception === true && !this.handleExceptions)) {
      return callback(null)
    }
    if (!this.level || this.levels[this.level] >= this.levels[info[LEVEL]]) {
      this.transport.log(info[LEVEL], info.message, info, this._nop)
    }
    callback(null)
  }
  LegacyTransportStream.prototype._writev = function _writev(chunks, callback) {
    for (let i = 0; i < chunks.length; i++) {
      if (this._accept(chunks[i])) {
        this.transport.log(
          chunks[i].chunk[LEVEL],
          chunks[i].chunk.message,
          chunks[i].chunk,
          this._nop,
        )
        chunks[i].callback()
      }
    }
    return callback(null)
  }
  LegacyTransportStream.prototype._deprecated = function _deprecated() {
    console.error(
      [
        `${this.transport.name} is a legacy winston transport. Consider upgrading: `,
        '- Upgrade docs: https://github.com/winstonjs/winston/blob/master/UPGRADE-3.0.md',
      ].join('\n'),
    )
  }
  LegacyTransportStream.prototype.close = function close() {
    if (this.transport.close) {
      this.transport.close()
    }
    if (this.transport.__winstonError) {
      this.transport.removeListener('error', this.transport.__winstonError)
      this.transport.__winstonError = null
    }
  }
  return legacy.exports
}
var hasRequiredWinstonTransport
function requireWinstonTransport() {
  if (hasRequiredWinstonTransport) return winstonTransport.exports
  hasRequiredWinstonTransport = 1
  winstonTransport.exports = requireModern()
  winstonTransport.exports.LegacyTransportStream = requireLegacy()
  return winstonTransport.exports
}
var console_1$1
var hasRequiredConsole$1
function requireConsole$1() {
  if (hasRequiredConsole$1) return console_1$1
  hasRequiredConsole$1 = 1
  const os2 = require$$0$1
  const { LEVEL, MESSAGE } = requireTripleBeam()
  const TransportStream = requireWinstonTransport()
  console_1$1 = class Console extends TransportStream {
    /**
     * Constructor function for the Console transport object responsible for
     * persisting log messages and metadata to a terminal or TTY.
     * @param {!Object} [options={}] - Options for this instance.
     */
    constructor(options = {}) {
      super(options)
      this.name = options.name || 'console'
      this.stderrLevels = this._stringArrayToSet(options.stderrLevels)
      this.consoleWarnLevels = this._stringArrayToSet(options.consoleWarnLevels)
      this.eol = typeof options.eol === 'string' ? options.eol : os2.EOL
      this.forceConsole = options.forceConsole || false
      this._consoleLog = console.log.bind(console)
      this._consoleWarn = console.warn.bind(console)
      this._consoleError = console.error.bind(console)
      this.setMaxListeners(30)
    }
    /**
     * Core logging method exposed to Winston.
     * @param {Object} info - TODO: add param description.
     * @param {Function} callback - TODO: add param description.
     * @returns {undefined}
     */
    log(info, callback) {
      setImmediate(() => this.emit('logged', info))
      if (this.stderrLevels[info[LEVEL]]) {
        if (console._stderr && !this.forceConsole) {
          console._stderr.write(`${info[MESSAGE]}${this.eol}`)
        } else {
          this._consoleError(info[MESSAGE])
        }
        if (callback) {
          callback()
        }
        return
      } else if (this.consoleWarnLevels[info[LEVEL]]) {
        if (console._stderr && !this.forceConsole) {
          console._stderr.write(`${info[MESSAGE]}${this.eol}`)
        } else {
          this._consoleWarn(info[MESSAGE])
        }
        if (callback) {
          callback()
        }
        return
      }
      if (console._stdout && !this.forceConsole) {
        console._stdout.write(`${info[MESSAGE]}${this.eol}`)
      } else {
        this._consoleLog(info[MESSAGE])
      }
      if (callback) {
        callback()
      }
    }
    /**
     * Returns a Set-like object with strArray's elements as keys (each with the
     * value true).
     * @param {Array} strArray - Array of Set-elements as strings.
     * @param {?string} [errMsg] - Custom error message thrown on invalid input.
     * @returns {Object} - TODO: add return description.
     * @private
     */
    _stringArrayToSet(strArray, errMsg) {
      if (!strArray) return {}
      errMsg = errMsg || 'Cannot make set from type other than Array of string elements'
      if (!Array.isArray(strArray)) {
        throw new Error(errMsg)
      }
      return strArray.reduce((set, el) => {
        if (typeof el !== 'string') {
          throw new Error(errMsg)
        }
        set[el] = true
        return set
      }, {})
    }
  }
  return console_1$1
}
var series = { exports: {} }
var parallel = { exports: {} }
var isArrayLike = { exports: {} }
var hasRequiredIsArrayLike
function requireIsArrayLike() {
  if (hasRequiredIsArrayLike) return isArrayLike.exports
  hasRequiredIsArrayLike = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = isArrayLike2
    function isArrayLike2(value) {
      return (
        value && typeof value.length === 'number' && value.length >= 0 && value.length % 1 === 0
      )
    }
    module.exports = exports.default
  })(isArrayLike, isArrayLike.exports)
  return isArrayLike.exports
}
var wrapAsync = {}
var asyncify = { exports: {} }
var initialParams = { exports: {} }
var hasRequiredInitialParams
function requireInitialParams() {
  if (hasRequiredInitialParams) return initialParams.exports
  hasRequiredInitialParams = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = function (fn) {
      return function (...args) {
        var callback = args.pop()
        return fn.call(this, args, callback)
      }
    }
    module.exports = exports.default
  })(initialParams, initialParams.exports)
  return initialParams.exports
}
var setImmediate$1 = {}
var hasRequiredSetImmediate
function requireSetImmediate() {
  if (hasRequiredSetImmediate) return setImmediate$1
  hasRequiredSetImmediate = 1
  Object.defineProperty(setImmediate$1, '__esModule', {
    value: true,
  })
  setImmediate$1.fallback = fallback
  setImmediate$1.wrap = wrap2
  var hasQueueMicrotask = (setImmediate$1.hasQueueMicrotask =
    typeof queueMicrotask === 'function' && queueMicrotask)
  var hasSetImmediate = (setImmediate$1.hasSetImmediate =
    typeof setImmediate === 'function' && setImmediate)
  var hasNextTick = (setImmediate$1.hasNextTick =
    typeof process === 'object' && typeof process.nextTick === 'function')
  function fallback(fn) {
    setTimeout(fn, 0)
  }
  function wrap2(defer) {
    return (fn, ...args) => defer(() => fn(...args))
  }
  var _defer
  if (hasQueueMicrotask) {
    _defer = queueMicrotask
  } else if (hasSetImmediate) {
    _defer = setImmediate
  } else if (hasNextTick) {
    _defer = process.nextTick
  } else {
    _defer = fallback
  }
  setImmediate$1.default = wrap2(_defer)
  return setImmediate$1
}
var hasRequiredAsyncify
function requireAsyncify() {
  if (hasRequiredAsyncify) return asyncify.exports
  hasRequiredAsyncify = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = asyncify2
    var _initialParams = requireInitialParams()
    var _initialParams2 = _interopRequireDefault(_initialParams)
    var _setImmediate = requireSetImmediate()
    var _setImmediate2 = _interopRequireDefault(_setImmediate)
    var _wrapAsync = requireWrapAsync()
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj }
    }
    function asyncify2(func) {
      if ((0, _wrapAsync.isAsync)(func)) {
        return function (...args) {
          const callback = args.pop()
          const promise = func.apply(this, args)
          return handlePromise(promise, callback)
        }
      }
      return (0, _initialParams2.default)(function (args, callback) {
        var result
        try {
          result = func.apply(this, args)
        } catch (e) {
          return callback(e)
        }
        if (result && typeof result.then === 'function') {
          return handlePromise(result, callback)
        } else {
          callback(null, result)
        }
      })
    }
    function handlePromise(promise, callback) {
      return promise.then(
        (value) => {
          invokeCallback(callback, null, value)
        },
        (err2) => {
          invokeCallback(
            callback,
            err2 && (err2 instanceof Error || err2.message) ? err2 : new Error(err2),
          )
        },
      )
    }
    function invokeCallback(callback, error, value) {
      try {
        callback(error, value)
      } catch (err2) {
        ;(0, _setImmediate2.default)((e) => {
          throw e
        }, err2)
      }
    }
    module.exports = exports.default
  })(asyncify, asyncify.exports)
  return asyncify.exports
}
var hasRequiredWrapAsync
function requireWrapAsync() {
  if (hasRequiredWrapAsync) return wrapAsync
  hasRequiredWrapAsync = 1
  Object.defineProperty(wrapAsync, '__esModule', {
    value: true,
  })
  wrapAsync.isAsyncIterable = wrapAsync.isAsyncGenerator = wrapAsync.isAsync = void 0
  var _asyncify = requireAsyncify()
  var _asyncify2 = _interopRequireDefault(_asyncify)
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj }
  }
  function isAsync2(fn) {
    return fn[Symbol.toStringTag] === 'AsyncFunction'
  }
  function isAsyncGenerator(fn) {
    return fn[Symbol.toStringTag] === 'AsyncGenerator'
  }
  function isAsyncIterable(obj) {
    return typeof obj[Symbol.asyncIterator] === 'function'
  }
  function wrapAsync$1(asyncFn) {
    if (typeof asyncFn !== 'function') throw new Error('expected a function')
    return isAsync2(asyncFn) ? (0, _asyncify2.default)(asyncFn) : asyncFn
  }
  wrapAsync.default = wrapAsync$1
  wrapAsync.isAsync = isAsync2
  wrapAsync.isAsyncGenerator = isAsyncGenerator
  wrapAsync.isAsyncIterable = isAsyncIterable
  return wrapAsync
}
var awaitify = { exports: {} }
var hasRequiredAwaitify
function requireAwaitify() {
  if (hasRequiredAwaitify) return awaitify.exports
  hasRequiredAwaitify = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = awaitify2
    function awaitify2(asyncFn, arity) {
      if (!arity) arity = asyncFn.length
      if (!arity) throw new Error('arity is undefined')
      function awaitable(...args) {
        if (typeof args[arity - 1] === 'function') {
          return asyncFn.apply(this, args)
        }
        return new Promise((resolve, reject) => {
          args[arity - 1] = (err2, ...cbArgs) => {
            if (err2) return reject(err2)
            resolve(cbArgs.length > 1 ? cbArgs : cbArgs[0])
          }
          asyncFn.apply(this, args)
        })
      }
      return awaitable
    }
    module.exports = exports.default
  })(awaitify, awaitify.exports)
  return awaitify.exports
}
var hasRequiredParallel
function requireParallel() {
  if (hasRequiredParallel) return parallel.exports
  hasRequiredParallel = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    var _isArrayLike = requireIsArrayLike()
    var _isArrayLike2 = _interopRequireDefault(_isArrayLike)
    var _wrapAsync = requireWrapAsync()
    var _wrapAsync2 = _interopRequireDefault(_wrapAsync)
    var _awaitify = requireAwaitify()
    var _awaitify2 = _interopRequireDefault(_awaitify)
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj }
    }
    exports.default = (0, _awaitify2.default)((eachfn, tasks, callback) => {
      var results = (0, _isArrayLike2.default)(tasks) ? [] : {}
      eachfn(
        tasks,
        (task, key, taskCb) => {
          ;(0, _wrapAsync2.default)(task)((err2, ...result) => {
            if (result.length < 2) {
              ;[result] = result
            }
            results[key] = result
            taskCb(err2)
          })
        },
        (err2) => callback(err2, results),
      )
    }, 3)
    module.exports = exports.default
  })(parallel, parallel.exports)
  return parallel.exports
}
var eachOfSeries = { exports: {} }
var eachOfLimit$1 = { exports: {} }
var eachOfLimit = { exports: {} }
var once = { exports: {} }
var hasRequiredOnce
function requireOnce() {
  if (hasRequiredOnce) return once.exports
  hasRequiredOnce = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = once2
    function once2(fn) {
      function wrapper(...args) {
        if (fn === null) return
        var callFn = fn
        fn = null
        callFn.apply(this, args)
      }
      Object.assign(wrapper, fn)
      return wrapper
    }
    module.exports = exports.default
  })(once, once.exports)
  return once.exports
}
var iterator = { exports: {} }
var getIterator = { exports: {} }
var hasRequiredGetIterator
function requireGetIterator() {
  if (hasRequiredGetIterator) return getIterator.exports
  hasRequiredGetIterator = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = function (coll) {
      return coll[Symbol.iterator] && coll[Symbol.iterator]()
    }
    module.exports = exports.default
  })(getIterator, getIterator.exports)
  return getIterator.exports
}
var hasRequiredIterator
function requireIterator() {
  if (hasRequiredIterator) return iterator.exports
  hasRequiredIterator = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = createIterator
    var _isArrayLike = requireIsArrayLike()
    var _isArrayLike2 = _interopRequireDefault(_isArrayLike)
    var _getIterator = requireGetIterator()
    var _getIterator2 = _interopRequireDefault(_getIterator)
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj }
    }
    function createArrayIterator(coll) {
      var i = -1
      var len = coll.length
      return function next() {
        return ++i < len ? { value: coll[i], key: i } : null
      }
    }
    function createES2015Iterator(iterator2) {
      var i = -1
      return function next() {
        var item = iterator2.next()
        if (item.done) return null
        i++
        return { value: item.value, key: i }
      }
    }
    function createObjectIterator(obj) {
      var okeys = obj ? Object.keys(obj) : []
      var i = -1
      var len = okeys.length
      return function next() {
        var key = okeys[++i]
        if (key === '__proto__') {
          return next()
        }
        return i < len ? { value: obj[key], key } : null
      }
    }
    function createIterator(coll) {
      if ((0, _isArrayLike2.default)(coll)) {
        return createArrayIterator(coll)
      }
      var iterator2 = (0, _getIterator2.default)(coll)
      return iterator2 ? createES2015Iterator(iterator2) : createObjectIterator(coll)
    }
    module.exports = exports.default
  })(iterator, iterator.exports)
  return iterator.exports
}
var onlyOnce = { exports: {} }
var hasRequiredOnlyOnce
function requireOnlyOnce() {
  if (hasRequiredOnlyOnce) return onlyOnce.exports
  hasRequiredOnlyOnce = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = onlyOnce2
    function onlyOnce2(fn) {
      return function (...args) {
        if (fn === null) throw new Error('Callback was already called.')
        var callFn = fn
        fn = null
        callFn.apply(this, args)
      }
    }
    module.exports = exports.default
  })(onlyOnce, onlyOnce.exports)
  return onlyOnce.exports
}
var asyncEachOfLimit = { exports: {} }
var breakLoop = { exports: {} }
var hasRequiredBreakLoop
function requireBreakLoop() {
  if (hasRequiredBreakLoop) return breakLoop.exports
  hasRequiredBreakLoop = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    const breakLoop2 = {}
    exports.default = breakLoop2
    module.exports = exports.default
  })(breakLoop, breakLoop.exports)
  return breakLoop.exports
}
var hasRequiredAsyncEachOfLimit
function requireAsyncEachOfLimit() {
  if (hasRequiredAsyncEachOfLimit) return asyncEachOfLimit.exports
  hasRequiredAsyncEachOfLimit = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = asyncEachOfLimit2
    var _breakLoop = requireBreakLoop()
    var _breakLoop2 = _interopRequireDefault(_breakLoop)
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj }
    }
    function asyncEachOfLimit2(generator, limit, iteratee, callback) {
      let done = false
      let canceled = false
      let awaiting = false
      let running = 0
      let idx = 0
      function replenish() {
        if (running >= limit || awaiting || done) return
        awaiting = true
        generator
          .next()
          .then(({ value, done: iterDone }) => {
            if (canceled || done) return
            awaiting = false
            if (iterDone) {
              done = true
              if (running <= 0) {
                callback(null)
              }
              return
            }
            running++
            iteratee(value, idx, iterateeCallback)
            idx++
            replenish()
          })
          .catch(handleError)
      }
      function iterateeCallback(err2, result) {
        running -= 1
        if (canceled) return
        if (err2) return handleError(err2)
        if (err2 === false) {
          done = true
          canceled = true
          return
        }
        if (result === _breakLoop2.default || (done && running <= 0)) {
          done = true
          return callback(null)
        }
        replenish()
      }
      function handleError(err2) {
        if (canceled) return
        awaiting = false
        done = true
        callback(err2)
      }
      replenish()
    }
    module.exports = exports.default
  })(asyncEachOfLimit, asyncEachOfLimit.exports)
  return asyncEachOfLimit.exports
}
var hasRequiredEachOfLimit$1
function requireEachOfLimit$1() {
  if (hasRequiredEachOfLimit$1) return eachOfLimit.exports
  hasRequiredEachOfLimit$1 = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    var _once = requireOnce()
    var _once2 = _interopRequireDefault(_once)
    var _iterator = requireIterator()
    var _iterator2 = _interopRequireDefault(_iterator)
    var _onlyOnce = requireOnlyOnce()
    var _onlyOnce2 = _interopRequireDefault(_onlyOnce)
    var _wrapAsync = requireWrapAsync()
    var _asyncEachOfLimit = requireAsyncEachOfLimit()
    var _asyncEachOfLimit2 = _interopRequireDefault(_asyncEachOfLimit)
    var _breakLoop = requireBreakLoop()
    var _breakLoop2 = _interopRequireDefault(_breakLoop)
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj }
    }
    exports.default = (limit) => {
      return (obj, iteratee, callback) => {
        callback = (0, _once2.default)(callback)
        if (limit <= 0) {
          throw new RangeError('concurrency limit cannot be less than 1')
        }
        if (!obj) {
          return callback(null)
        }
        if ((0, _wrapAsync.isAsyncGenerator)(obj)) {
          return (0, _asyncEachOfLimit2.default)(obj, limit, iteratee, callback)
        }
        if ((0, _wrapAsync.isAsyncIterable)(obj)) {
          return (0, _asyncEachOfLimit2.default)(
            obj[Symbol.asyncIterator](),
            limit,
            iteratee,
            callback,
          )
        }
        var nextElem = (0, _iterator2.default)(obj)
        var done = false
        var canceled = false
        var running = 0
        var looping = false
        function iterateeCallback(err2, value) {
          if (canceled) return
          running -= 1
          if (err2) {
            done = true
            callback(err2)
          } else if (err2 === false) {
            done = true
            canceled = true
          } else if (value === _breakLoop2.default || (done && running <= 0)) {
            done = true
            return callback(null)
          } else if (!looping) {
            replenish()
          }
        }
        function replenish() {
          looping = true
          while (running < limit && !done) {
            var elem = nextElem()
            if (elem === null) {
              done = true
              if (running <= 0) {
                callback(null)
              }
              return
            }
            running += 1
            iteratee(elem.value, elem.key, (0, _onlyOnce2.default)(iterateeCallback))
          }
          looping = false
        }
        replenish()
      }
    }
    module.exports = exports.default
  })(eachOfLimit, eachOfLimit.exports)
  return eachOfLimit.exports
}
var hasRequiredEachOfLimit
function requireEachOfLimit() {
  if (hasRequiredEachOfLimit) return eachOfLimit$1.exports
  hasRequiredEachOfLimit = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    var _eachOfLimit2 = requireEachOfLimit$1()
    var _eachOfLimit3 = _interopRequireDefault(_eachOfLimit2)
    var _wrapAsync = requireWrapAsync()
    var _wrapAsync2 = _interopRequireDefault(_wrapAsync)
    var _awaitify = requireAwaitify()
    var _awaitify2 = _interopRequireDefault(_awaitify)
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj }
    }
    function eachOfLimit2(coll, limit, iteratee, callback) {
      return (0, _eachOfLimit3.default)(limit)(coll, (0, _wrapAsync2.default)(iteratee), callback)
    }
    exports.default = (0, _awaitify2.default)(eachOfLimit2, 4)
    module.exports = exports.default
  })(eachOfLimit$1, eachOfLimit$1.exports)
  return eachOfLimit$1.exports
}
var hasRequiredEachOfSeries
function requireEachOfSeries() {
  if (hasRequiredEachOfSeries) return eachOfSeries.exports
  hasRequiredEachOfSeries = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    var _eachOfLimit = requireEachOfLimit()
    var _eachOfLimit2 = _interopRequireDefault(_eachOfLimit)
    var _awaitify = requireAwaitify()
    var _awaitify2 = _interopRequireDefault(_awaitify)
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj }
    }
    function eachOfSeries2(coll, iteratee, callback) {
      return (0, _eachOfLimit2.default)(coll, 1, iteratee, callback)
    }
    exports.default = (0, _awaitify2.default)(eachOfSeries2, 3)
    module.exports = exports.default
  })(eachOfSeries, eachOfSeries.exports)
  return eachOfSeries.exports
}
var hasRequiredSeries
function requireSeries() {
  if (hasRequiredSeries) return series.exports
  hasRequiredSeries = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = series2
    var _parallel2 = requireParallel()
    var _parallel3 = _interopRequireDefault(_parallel2)
    var _eachOfSeries = requireEachOfSeries()
    var _eachOfSeries2 = _interopRequireDefault(_eachOfSeries)
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj }
    }
    function series2(tasks, callback) {
      return (0, _parallel3.default)(_eachOfSeries2.default, tasks, callback)
    }
    module.exports = exports.default
  })(series, series.exports)
  return series.exports
}
var readable = { exports: {} }
var _stream_transform
var hasRequired_stream_transform
function require_stream_transform() {
  if (hasRequired_stream_transform) return _stream_transform
  hasRequired_stream_transform = 1
  _stream_transform = Transform
  var _require$codes = requireErrors().codes,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
    ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0
  var Duplex = require_stream_duplex()
  requireInherits()(Transform, Duplex)
  function afterTransform(er, data) {
    var ts = this._transformState
    ts.transforming = false
    var cb = ts.writecb
    if (cb === null) {
      return this.emit('error', new ERR_MULTIPLE_CALLBACK())
    }
    ts.writechunk = null
    ts.writecb = null
    if (data != null) this.push(data)
    cb(er)
    var rs = this._readableState
    rs.reading = false
    if (rs.needReadable || rs.length < rs.highWaterMark) {
      this._read(rs.highWaterMark)
    }
  }
  function Transform(options) {
    if (!(this instanceof Transform)) return new Transform(options)
    Duplex.call(this, options)
    this._transformState = {
      afterTransform: afterTransform.bind(this),
      needTransform: false,
      transforming: false,
      writecb: null,
      writechunk: null,
      writeencoding: null,
    }
    this._readableState.needReadable = true
    this._readableState.sync = false
    if (options) {
      if (typeof options.transform === 'function') this._transform = options.transform
      if (typeof options.flush === 'function') this._flush = options.flush
    }
    this.on('prefinish', prefinish)
  }
  function prefinish() {
    var _this = this
    if (typeof this._flush === 'function' && !this._readableState.destroyed) {
      this._flush(function (er, data) {
        done(_this, er, data)
      })
    } else {
      done(this, null, null)
    }
  }
  Transform.prototype.push = function (chunk, encoding) {
    this._transformState.needTransform = false
    return Duplex.prototype.push.call(this, chunk, encoding)
  }
  Transform.prototype._transform = function (chunk, encoding, cb) {
    cb(new ERR_METHOD_NOT_IMPLEMENTED('_transform()'))
  }
  Transform.prototype._write = function (chunk, encoding, cb) {
    var ts = this._transformState
    ts.writecb = cb
    ts.writechunk = chunk
    ts.writeencoding = encoding
    if (!ts.transforming) {
      var rs = this._readableState
      if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark)
        this._read(rs.highWaterMark)
    }
  }
  Transform.prototype._read = function (n) {
    var ts = this._transformState
    if (ts.writechunk !== null && !ts.transforming) {
      ts.transforming = true
      this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform)
    } else {
      ts.needTransform = true
    }
  }
  Transform.prototype._destroy = function (err2, cb) {
    Duplex.prototype._destroy.call(this, err2, function (err22) {
      cb(err22)
    })
  }
  function done(stream2, er, data) {
    if (er) return stream2.emit('error', er)
    if (data != null) stream2.push(data)
    if (stream2._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0()
    if (stream2._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING()
    return stream2.push(null)
  }
  return _stream_transform
}
var _stream_passthrough
var hasRequired_stream_passthrough
function require_stream_passthrough() {
  if (hasRequired_stream_passthrough) return _stream_passthrough
  hasRequired_stream_passthrough = 1
  _stream_passthrough = PassThrough
  var Transform = require_stream_transform()
  requireInherits()(PassThrough, Transform)
  function PassThrough(options) {
    if (!(this instanceof PassThrough)) return new PassThrough(options)
    Transform.call(this, options)
  }
  PassThrough.prototype._transform = function (chunk, encoding, cb) {
    cb(null, chunk)
  }
  return _stream_passthrough
}
var pipeline_1
var hasRequiredPipeline
function requirePipeline() {
  if (hasRequiredPipeline) return pipeline_1
  hasRequiredPipeline = 1
  var eos
  function once2(callback) {
    var called = false
    return function () {
      if (called) return
      called = true
      callback.apply(void 0, arguments)
    }
  }
  var _require$codes = requireErrors().codes,
    ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED
  function noop(err2) {
    if (err2) throw err2
  }
  function isRequest(stream2) {
    return stream2.setHeader && typeof stream2.abort === 'function'
  }
  function destroyer(stream2, reading, writing, callback) {
    callback = once2(callback)
    var closed = false
    stream2.on('close', function () {
      closed = true
    })
    if (eos === void 0) eos = requireEndOfStream()
    eos(
      stream2,
      {
        readable: reading,
        writable: writing,
      },
      function (err2) {
        if (err2) return callback(err2)
        closed = true
        callback()
      },
    )
    var destroyed = false
    return function (err2) {
      if (closed) return
      if (destroyed) return
      destroyed = true
      if (isRequest(stream2)) return stream2.abort()
      if (typeof stream2.destroy === 'function') return stream2.destroy()
      callback(err2 || new ERR_STREAM_DESTROYED('pipe'))
    }
  }
  function call(fn) {
    fn()
  }
  function pipe(from, to) {
    return from.pipe(to)
  }
  function popCallback(streams) {
    if (!streams.length) return noop
    if (typeof streams[streams.length - 1] !== 'function') return noop
    return streams.pop()
  }
  function pipeline() {
    for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
      streams[_key] = arguments[_key]
    }
    var callback = popCallback(streams)
    if (Array.isArray(streams[0])) streams = streams[0]
    if (streams.length < 2) {
      throw new ERR_MISSING_ARGS('streams')
    }
    var error
    var destroys = streams.map(function (stream2, i) {
      var reading = i < streams.length - 1
      var writing = i > 0
      return destroyer(stream2, reading, writing, function (err2) {
        if (!error) error = err2
        if (err2) destroys.forEach(call)
        if (reading) return
        destroys.forEach(call)
        callback(error)
      })
    })
    return streams.reduce(pipe)
  }
  pipeline_1 = pipeline
  return pipeline_1
}
var hasRequiredReadable
function requireReadable() {
  if (hasRequiredReadable) return readable.exports
  hasRequiredReadable = 1
  ;(function (module, exports) {
    var Stream = require$$0$3
    if (process.env.READABLE_STREAM === 'disable' && Stream) {
      module.exports = Stream.Readable
      Object.assign(module.exports, Stream)
      module.exports.Stream = Stream
    } else {
      exports = module.exports = require_stream_readable()
      exports.Stream = Stream || exports
      exports.Readable = exports
      exports.Writable = require_stream_writable()
      exports.Duplex = require_stream_duplex()
      exports.Transform = require_stream_transform()
      exports.PassThrough = require_stream_passthrough()
      exports.finished = requireEndOfStream()
      exports.pipeline = requirePipeline()
    }
  })(readable, readable.exports)
  return readable.exports
}
var node = { exports: {} }
var diagnostics
var hasRequiredDiagnostics
function requireDiagnostics() {
  if (hasRequiredDiagnostics) return diagnostics
  hasRequiredDiagnostics = 1
  var adapters2 = []
  var modifiers = []
  var logger2 = function devnull() {}
  function use(adapter) {
    if (~adapters2.indexOf(adapter)) return false
    adapters2.push(adapter)
    return true
  }
  function set(custom) {
    logger2 = custom
  }
  function enabled2(namespace) {
    var async = []
    for (var i = 0; i < adapters2.length; i++) {
      if (adapters2[i].async) {
        async.push(adapters2[i])
        continue
      }
      if (adapters2[i](namespace)) return true
    }
    if (!async.length) return false
    return new Promise(function pinky(resolve) {
      Promise.all(
        async.map(function prebind(fn) {
          return fn(namespace)
        }),
      ).then(function resolved(values) {
        resolve(values.some(Boolean))
      })
    })
  }
  function modify(fn) {
    if (~modifiers.indexOf(fn)) return false
    modifiers.push(fn)
    return true
  }
  function write() {
    logger2.apply(logger2, arguments)
  }
  function process2(message) {
    for (var i = 0; i < modifiers.length; i++) {
      message = modifiers[i].apply(modifiers[i], arguments)
    }
    return message
  }
  function introduce(fn, options) {
    var has = Object.prototype.hasOwnProperty
    for (var key in options) {
      if (has.call(options, key)) {
        fn[key] = options[key]
      }
    }
    return fn
  }
  function nope(options) {
    options.enabled = false
    options.modify = modify
    options.set = set
    options.use = use
    return introduce(function diagnopes() {
      return false
    }, options)
  }
  function yep(options) {
    function diagnostics2() {
      var args = Array.prototype.slice.call(arguments, 0)
      write.call(write, options, process2(args, options))
      return true
    }
    options.enabled = true
    options.modify = modify
    options.set = set
    options.use = use
    return introduce(diagnostics2, options)
  }
  diagnostics = function create(diagnostics2) {
    diagnostics2.introduce = introduce
    diagnostics2.enabled = enabled2
    diagnostics2.process = process2
    diagnostics2.modify = modify
    diagnostics2.write = write
    diagnostics2.nope = nope
    diagnostics2.yep = yep
    diagnostics2.set = set
    diagnostics2.use = use
    return diagnostics2
  }
  return diagnostics
}
var production
var hasRequiredProduction
function requireProduction() {
  if (hasRequiredProduction) return production
  hasRequiredProduction = 1
  var create = requireDiagnostics()
  var diagnostics2 = create(function prod(namespace, options) {
    options = options || {}
    options.namespace = namespace
    options.prod = true
    options.dev = false
    if (!(options.force || prod.force)) return prod.nope(options)
    return prod.yep(options)
  })
  production = diagnostics2
  return production
}
var index_cjs
var hasRequiredIndex_cjs
function requireIndex_cjs() {
  if (hasRequiredIndex_cjs) return index_cjs
  hasRequiredIndex_cjs = 1
  var cssKeywords = {
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50],
  }
  const reverseNames = /* @__PURE__ */ Object.create(null)
  for (const name in cssKeywords) {
    if (Object.hasOwn(cssKeywords, name)) {
      reverseNames[cssKeywords[name]] = name
    }
  }
  const cs = {
    to: {},
    get: {},
  }
  cs.get = function (string) {
    const prefix = string.slice(0, 3).toLowerCase()
    let value
    let model
    switch (prefix) {
      case 'hsl': {
        value = cs.get.hsl(string)
        model = 'hsl'
        break
      }
      case 'hwb': {
        value = cs.get.hwb(string)
        model = 'hwb'
        break
      }
      default: {
        value = cs.get.rgb(string)
        model = 'rgb'
        break
      }
    }
    if (!value) {
      return null
    }
    return { model, value }
  }
  cs.get.rgb = function (string) {
    if (!string) {
      return null
    }
    const abbr = /^#([a-f\d]{3,4})$/i
    const hex2 = /^#([a-f\d]{6})([a-f\d]{2})?$/i
    const rgba =
      /^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[\s,|/]\s*([+-]?[\d.]+)(%?)\s*)?\)$/
    const per =
      /^rgba?\(\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[\s,|/]\s*([+-]?[\d.]+)(%?)\s*)?\)$/
    const keyword = /^(\w+)$/
    let rgb = [0, 0, 0, 1]
    let match
    let i
    let hexAlpha
    if ((match = string.match(hex2))) {
      hexAlpha = match[2]
      match = match[1]
      for (i = 0; i < 3; i++) {
        const i2 = i * 2
        rgb[i] = Number.parseInt(match.slice(i2, i2 + 2), 16)
      }
      if (hexAlpha) {
        rgb[3] = Number.parseInt(hexAlpha, 16) / 255
      }
    } else if ((match = string.match(abbr))) {
      match = match[1]
      hexAlpha = match[3]
      for (i = 0; i < 3; i++) {
        rgb[i] = Number.parseInt(match[i] + match[i], 16)
      }
      if (hexAlpha) {
        rgb[3] = Number.parseInt(hexAlpha + hexAlpha, 16) / 255
      }
    } else if ((match = string.match(rgba))) {
      for (i = 0; i < 3; i++) {
        rgb[i] = Number.parseInt(match[i + 1], 10)
      }
      if (match[4]) {
        rgb[3] = match[5] ? Number.parseFloat(match[4]) * 0.01 : Number.parseFloat(match[4])
      }
    } else if ((match = string.match(per))) {
      for (i = 0; i < 3; i++) {
        rgb[i] = Math.round(Number.parseFloat(match[i + 1]) * 2.55)
      }
      if (match[4]) {
        rgb[3] = match[5] ? Number.parseFloat(match[4]) * 0.01 : Number.parseFloat(match[4])
      }
    } else if ((match = string.match(keyword))) {
      if (match[1] === 'transparent') {
        return [0, 0, 0, 0]
      }
      if (!Object.hasOwn(cssKeywords, match[1])) {
        return null
      }
      rgb = cssKeywords[match[1]]
      rgb[3] = 1
      return rgb
    } else {
      return null
    }
    for (i = 0; i < 3; i++) {
      rgb[i] = clamp(rgb[i], 0, 255)
    }
    rgb[3] = clamp(rgb[3], 0, 1)
    return rgb
  }
  cs.get.hsl = function (string) {
    if (!string) {
      return null
    }
    const hsl =
      /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[,|/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/
    const match = string.match(hsl)
    if (match) {
      const alpha = Number.parseFloat(match[4])
      const h = ((Number.parseFloat(match[1]) % 360) + 360) % 360
      const s = clamp(Number.parseFloat(match[2]), 0, 100)
      const l = clamp(Number.parseFloat(match[3]), 0, 100)
      const a = clamp(Number.isNaN(alpha) ? 1 : alpha, 0, 1)
      return [h, s, l, a]
    }
    return null
  }
  cs.get.hwb = function (string) {
    if (!string) {
      return null
    }
    const hwb =
      /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*[\s,]\s*([+-]?[\d.]+)%\s*[\s,]\s*([+-]?[\d.]+)%\s*(?:[\s,]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/
    const match = string.match(hwb)
    if (match) {
      const alpha = Number.parseFloat(match[4])
      const h = ((Number.parseFloat(match[1]) % 360) + 360) % 360
      const w = clamp(Number.parseFloat(match[2]), 0, 100)
      const b = clamp(Number.parseFloat(match[3]), 0, 100)
      const a = clamp(Number.isNaN(alpha) ? 1 : alpha, 0, 1)
      return [h, w, b, a]
    }
    return null
  }
  cs.to.hex = function (...rgba) {
    return (
      '#' +
      hexDouble(rgba[0]) +
      hexDouble(rgba[1]) +
      hexDouble(rgba[2]) +
      (rgba[3] < 1 ? hexDouble(Math.round(rgba[3] * 255)) : '')
    )
  }
  cs.to.rgb = function (...rgba) {
    return rgba.length < 4 || rgba[3] === 1
      ? 'rgb(' + Math.round(rgba[0]) + ', ' + Math.round(rgba[1]) + ', ' + Math.round(rgba[2]) + ')'
      : 'rgba(' +
          Math.round(rgba[0]) +
          ', ' +
          Math.round(rgba[1]) +
          ', ' +
          Math.round(rgba[2]) +
          ', ' +
          rgba[3] +
          ')'
  }
  cs.to.rgb.percent = function (...rgba) {
    const r = Math.round((rgba[0] / 255) * 100)
    const g = Math.round((rgba[1] / 255) * 100)
    const b = Math.round((rgba[2] / 255) * 100)
    return rgba.length < 4 || rgba[3] === 1
      ? 'rgb(' + r + '%, ' + g + '%, ' + b + '%)'
      : 'rgba(' + r + '%, ' + g + '%, ' + b + '%, ' + rgba[3] + ')'
  }
  cs.to.hsl = function (...hsla) {
    return hsla.length < 4 || hsla[3] === 1
      ? 'hsl(' + hsla[0] + ', ' + hsla[1] + '%, ' + hsla[2] + '%)'
      : 'hsla(' + hsla[0] + ', ' + hsla[1] + '%, ' + hsla[2] + '%, ' + hsla[3] + ')'
  }
  cs.to.hwb = function (...hwba) {
    let a = ''
    if (hwba.length >= 4 && hwba[3] !== 1) {
      a = ', ' + hwba[3]
    }
    return 'hwb(' + hwba[0] + ', ' + hwba[1] + '%, ' + hwba[2] + '%' + a + ')'
  }
  cs.to.keyword = function (...rgb) {
    return reverseNames[rgb.slice(0, 3)]
  }
  function clamp(number_, min, max) {
    return Math.min(Math.max(min, number_), max)
  }
  function hexDouble(number_) {
    const string_ = Math.round(number_).toString(16).toUpperCase()
    return string_.length < 2 ? '0' + string_ : string_
  }
  const reverseKeywords = {}
  for (const key of Object.keys(cssKeywords)) {
    reverseKeywords[cssKeywords[key]] = key
  }
  const convert$1 = {
    rgb: { channels: 3, labels: 'rgb' },
    hsl: { channels: 3, labels: 'hsl' },
    hsv: { channels: 3, labels: 'hsv' },
    hwb: { channels: 3, labels: 'hwb' },
    cmyk: { channels: 4, labels: 'cmyk' },
    xyz: { channels: 3, labels: 'xyz' },
    lab: { channels: 3, labels: 'lab' },
    oklab: { channels: 3, labels: ['okl', 'oka', 'okb'] },
    lch: { channels: 3, labels: 'lch' },
    oklch: { channels: 3, labels: ['okl', 'okc', 'okh'] },
    hex: { channels: 1, labels: ['hex'] },
    keyword: { channels: 1, labels: ['keyword'] },
    ansi16: { channels: 1, labels: ['ansi16'] },
    ansi256: { channels: 1, labels: ['ansi256'] },
    hcg: { channels: 3, labels: ['h', 'c', 'g'] },
    apple: { channels: 3, labels: ['r16', 'g16', 'b16'] },
    gray: { channels: 1, labels: ['gray'] },
  }
  const LAB_FT = (6 / 29) ** 3
  function srgbNonlinearTransform(c) {
    const cc = c > 31308e-7 ? 1.055 * c ** (1 / 2.4) - 0.055 : c * 12.92
    return Math.min(Math.max(0, cc), 1)
  }
  function srgbNonlinearTransformInv(c) {
    return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92
  }
  for (const model of Object.keys(convert$1)) {
    if (!('channels' in convert$1[model])) {
      throw new Error('missing channels property: ' + model)
    }
    if (!('labels' in convert$1[model])) {
      throw new Error('missing channel labels property: ' + model)
    }
    if (convert$1[model].labels.length !== convert$1[model].channels) {
      throw new Error('channel and label counts mismatch: ' + model)
    }
    const { channels, labels } = convert$1[model]
    delete convert$1[model].channels
    delete convert$1[model].labels
    Object.defineProperty(convert$1[model], 'channels', { value: channels })
    Object.defineProperty(convert$1[model], 'labels', { value: labels })
  }
  convert$1.rgb.hsl = function (rgb) {
    const r = rgb[0] / 255
    const g = rgb[1] / 255
    const b = rgb[2] / 255
    const min = Math.min(r, g, b)
    const max = Math.max(r, g, b)
    const delta = max - min
    let h
    let s
    switch (max) {
      case min: {
        h = 0
        break
      }
      case r: {
        h = (g - b) / delta
        break
      }
      case g: {
        h = 2 + (b - r) / delta
        break
      }
      case b: {
        h = 4 + (r - g) / delta
        break
      }
    }
    h = Math.min(h * 60, 360)
    if (h < 0) {
      h += 360
    }
    const l = (min + max) / 2
    if (max === min) {
      s = 0
    } else if (l <= 0.5) {
      s = delta / (max + min)
    } else {
      s = delta / (2 - max - min)
    }
    return [h, s * 100, l * 100]
  }
  convert$1.rgb.hsv = function (rgb) {
    let rdif
    let gdif
    let bdif
    let h
    let s
    const r = rgb[0] / 255
    const g = rgb[1] / 255
    const b = rgb[2] / 255
    const v = Math.max(r, g, b)
    const diff = v - Math.min(r, g, b)
    const diffc = function (c) {
      return (v - c) / 6 / diff + 1 / 2
    }
    if (diff === 0) {
      h = 0
      s = 0
    } else {
      s = diff / v
      rdif = diffc(r)
      gdif = diffc(g)
      bdif = diffc(b)
      switch (v) {
        case r: {
          h = bdif - gdif
          break
        }
        case g: {
          h = 1 / 3 + rdif - bdif
          break
        }
        case b: {
          h = 2 / 3 + gdif - rdif
          break
        }
      }
      if (h < 0) {
        h += 1
      } else if (h > 1) {
        h -= 1
      }
    }
    return [h * 360, s * 100, v * 100]
  }
  convert$1.rgb.hwb = function (rgb) {
    const r = rgb[0]
    const g = rgb[1]
    let b = rgb[2]
    const h = convert$1.rgb.hsl(rgb)[0]
    const w = (1 / 255) * Math.min(r, Math.min(g, b))
    b = 1 - (1 / 255) * Math.max(r, Math.max(g, b))
    return [h, w * 100, b * 100]
  }
  convert$1.rgb.oklab = function (rgb) {
    const r = srgbNonlinearTransformInv(rgb[0] / 255)
    const g = srgbNonlinearTransformInv(rgb[1] / 255)
    const b = srgbNonlinearTransformInv(rgb[2] / 255)
    const lp = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const mp = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const sp = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp
    const aa = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp
    const bb = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp
    return [l * 100, aa * 100, bb * 100]
  }
  convert$1.rgb.cmyk = function (rgb) {
    const r = rgb[0] / 255
    const g = rgb[1] / 255
    const b = rgb[2] / 255
    const k = Math.min(1 - r, 1 - g, 1 - b)
    const c = (1 - r - k) / (1 - k) || 0
    const m = (1 - g - k) / (1 - k) || 0
    const y = (1 - b - k) / (1 - k) || 0
    return [c * 100, m * 100, y * 100, k * 100]
  }
  function comparativeDistance(x, y) {
    return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2
  }
  convert$1.rgb.keyword = function (rgb) {
    const reversed = reverseKeywords[rgb]
    if (reversed) {
      return reversed
    }
    let currentClosestDistance = Number.POSITIVE_INFINITY
    let currentClosestKeyword
    for (const keyword of Object.keys(cssKeywords)) {
      const value = cssKeywords[keyword]
      const distance = comparativeDistance(rgb, value)
      if (distance < currentClosestDistance) {
        currentClosestDistance = distance
        currentClosestKeyword = keyword
      }
    }
    return currentClosestKeyword
  }
  convert$1.keyword.rgb = function (keyword) {
    return cssKeywords[keyword]
  }
  convert$1.rgb.xyz = function (rgb) {
    const r = srgbNonlinearTransformInv(rgb[0] / 255)
    const g = srgbNonlinearTransformInv(rgb[1] / 255)
    const b = srgbNonlinearTransformInv(rgb[2] / 255)
    const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
    const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175
    const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041
    return [x * 100, y * 100, z * 100]
  }
  convert$1.rgb.lab = function (rgb) {
    const xyz = convert$1.rgb.xyz(rgb)
    let x = xyz[0]
    let y = xyz[1]
    let z = xyz[2]
    x /= 95.047
    y /= 100
    z /= 108.883
    x = x > LAB_FT ? x ** (1 / 3) : 7.787 * x + 16 / 116
    y = y > LAB_FT ? y ** (1 / 3) : 7.787 * y + 16 / 116
    z = z > LAB_FT ? z ** (1 / 3) : 7.787 * z + 16 / 116
    const l = 116 * y - 16
    const a = 500 * (x - y)
    const b = 200 * (y - z)
    return [l, a, b]
  }
  convert$1.hsl.rgb = function (hsl) {
    const h = hsl[0] / 360
    const s = hsl[1] / 100
    const l = hsl[2] / 100
    let t3
    let value
    if (s === 0) {
      value = l * 255
      return [value, value, value]
    }
    const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s
    const t1 = 2 * l - t2
    const rgb = [0, 0, 0]
    for (let i = 0; i < 3; i++) {
      t3 = h + (1 / 3) * -(i - 1)
      if (t3 < 0) {
        t3++
      }
      if (t3 > 1) {
        t3--
      }
      if (6 * t3 < 1) {
        value = t1 + (t2 - t1) * 6 * t3
      } else if (2 * t3 < 1) {
        value = t2
      } else if (3 * t3 < 2) {
        value = t1 + (t2 - t1) * (2 / 3 - t3) * 6
      } else {
        value = t1
      }
      rgb[i] = value * 255
    }
    return rgb
  }
  convert$1.hsl.hsv = function (hsl) {
    const h = hsl[0]
    let s = hsl[1] / 100
    let l = hsl[2] / 100
    let smin = s
    const lmin = Math.max(l, 0.01)
    l *= 2
    s *= l <= 1 ? l : 2 - l
    smin *= lmin <= 1 ? lmin : 2 - lmin
    const v = (l + s) / 2
    const sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s)
    return [h, sv * 100, v * 100]
  }
  convert$1.hsv.rgb = function (hsv) {
    const h = hsv[0] / 60
    const s = hsv[1] / 100
    let v = hsv[2] / 100
    const hi = Math.floor(h) % 6
    const f = h - Math.floor(h)
    const p = 255 * v * (1 - s)
    const q = 255 * v * (1 - s * f)
    const t = 255 * v * (1 - s * (1 - f))
    v *= 255
    switch (hi) {
      case 0: {
        return [v, t, p]
      }
      case 1: {
        return [q, v, p]
      }
      case 2: {
        return [p, v, t]
      }
      case 3: {
        return [p, q, v]
      }
      case 4: {
        return [t, p, v]
      }
      case 5: {
        return [v, p, q]
      }
    }
  }
  convert$1.hsv.hsl = function (hsv) {
    const h = hsv[0]
    const s = hsv[1] / 100
    const v = hsv[2] / 100
    const vmin = Math.max(v, 0.01)
    let sl
    let l
    l = (2 - s) * v
    const lmin = (2 - s) * vmin
    sl = s * vmin
    sl /= lmin <= 1 ? lmin : 2 - lmin
    sl = sl || 0
    l /= 2
    return [h, sl * 100, l * 100]
  }
  convert$1.hwb.rgb = function (hwb) {
    const h = hwb[0] / 360
    let wh = hwb[1] / 100
    let bl = hwb[2] / 100
    const ratio = wh + bl
    let f
    if (ratio > 1) {
      wh /= ratio
      bl /= ratio
    }
    const i = Math.floor(6 * h)
    const v = 1 - bl
    f = 6 * h - i
    if ((i & 1) !== 0) {
      f = 1 - f
    }
    const n = wh + f * (v - wh)
    let r
    let g
    let b
    switch (i) {
      default:
      case 6:
      case 0: {
        r = v
        g = n
        b = wh
        break
      }
      case 1: {
        r = n
        g = v
        b = wh
        break
      }
      case 2: {
        r = wh
        g = v
        b = n
        break
      }
      case 3: {
        r = wh
        g = n
        b = v
        break
      }
      case 4: {
        r = n
        g = wh
        b = v
        break
      }
      case 5: {
        r = v
        g = wh
        b = n
        break
      }
    }
    return [r * 255, g * 255, b * 255]
  }
  convert$1.cmyk.rgb = function (cmyk) {
    const c = cmyk[0] / 100
    const m = cmyk[1] / 100
    const y = cmyk[2] / 100
    const k = cmyk[3] / 100
    const r = 1 - Math.min(1, c * (1 - k) + k)
    const g = 1 - Math.min(1, m * (1 - k) + k)
    const b = 1 - Math.min(1, y * (1 - k) + k)
    return [r * 255, g * 255, b * 255]
  }
  convert$1.xyz.rgb = function (xyz) {
    const x = xyz[0] / 100
    const y = xyz[1] / 100
    const z = xyz[2] / 100
    let r
    let g
    let b
    r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314
    g = x * -0.969266 + y * 1.8760108 + z * 0.041556
    b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252
    r = srgbNonlinearTransform(r)
    g = srgbNonlinearTransform(g)
    b = srgbNonlinearTransform(b)
    return [r * 255, g * 255, b * 255]
  }
  convert$1.xyz.lab = function (xyz) {
    let x = xyz[0]
    let y = xyz[1]
    let z = xyz[2]
    x /= 95.047
    y /= 100
    z /= 108.883
    x = x > LAB_FT ? x ** (1 / 3) : 7.787 * x + 16 / 116
    y = y > LAB_FT ? y ** (1 / 3) : 7.787 * y + 16 / 116
    z = z > LAB_FT ? z ** (1 / 3) : 7.787 * z + 16 / 116
    const l = 116 * y - 16
    const a = 500 * (x - y)
    const b = 200 * (y - z)
    return [l, a, b]
  }
  convert$1.xyz.oklab = function (xyz) {
    const x = xyz[0] / 100
    const y = xyz[1] / 100
    const z = xyz[2] / 100
    const lp = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
    const mp = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
    const sp = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z)
    const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp
    const a = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp
    const b = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp
    return [l * 100, a * 100, b * 100]
  }
  convert$1.oklab.oklch = function (oklab) {
    return convert$1.lab.lch(oklab)
  }
  convert$1.oklab.xyz = function (oklab) {
    const ll = oklab[0] / 100
    const a = oklab[1] / 100
    const b = oklab[2] / 100
    const l = (0.999999998 * ll + 0.396337792 * a + 0.215803758 * b) ** 3
    const m = (1.000000008 * ll - 0.105561342 * a - 0.063854175 * b) ** 3
    const s = (1.000000055 * ll - 0.089484182 * a - 1.291485538 * b) ** 3
    const x = 1.227013851 * l - 0.55779998 * m + 0.281256149 * s
    const y = -0.040580178 * l + 1.11225687 * m - 0.071676679 * s
    const z = -0.076381285 * l - 0.421481978 * m + 1.58616322 * s
    return [x * 100, y * 100, z * 100]
  }
  convert$1.oklab.rgb = function (oklab) {
    const ll = oklab[0] / 100
    const aa = oklab[1] / 100
    const bb = oklab[2] / 100
    const l = (ll + 0.3963377774 * aa + 0.2158037573 * bb) ** 3
    const m = (ll - 0.1055613458 * aa - 0.0638541728 * bb) ** 3
    const s = (ll - 0.0894841775 * aa - 1.291485548 * bb) ** 3
    const r = srgbNonlinearTransform(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
    const g = srgbNonlinearTransform(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
    const b = srgbNonlinearTransform(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
    return [r * 255, g * 255, b * 255]
  }
  convert$1.oklch.oklab = function (oklch) {
    return convert$1.lch.lab(oklch)
  }
  convert$1.lab.xyz = function (lab) {
    const l = lab[0]
    const a = lab[1]
    const b = lab[2]
    let x
    let y
    let z
    y = (l + 16) / 116
    x = a / 500 + y
    z = y - b / 200
    const y2 = y ** 3
    const x2 = x ** 3
    const z2 = z ** 3
    y = y2 > LAB_FT ? y2 : (y - 16 / 116) / 7.787
    x = x2 > LAB_FT ? x2 : (x - 16 / 116) / 7.787
    z = z2 > LAB_FT ? z2 : (z - 16 / 116) / 7.787
    x *= 95.047
    y *= 100
    z *= 108.883
    return [x, y, z]
  }
  convert$1.lab.lch = function (lab) {
    const l = lab[0]
    const a = lab[1]
    const b = lab[2]
    let h
    const hr = Math.atan2(b, a)
    h = (hr * 360) / 2 / Math.PI
    if (h < 0) {
      h += 360
    }
    const c = Math.sqrt(a * a + b * b)
    return [l, c, h]
  }
  convert$1.lch.lab = function (lch) {
    const l = lch[0]
    const c = lch[1]
    const h = lch[2]
    const hr = (h / 360) * 2 * Math.PI
    const a = c * Math.cos(hr)
    const b = c * Math.sin(hr)
    return [l, a, b]
  }
  convert$1.rgb.ansi16 = function (args, saturation = null) {
    const [r, g, b] = args
    let value = saturation === null ? convert$1.rgb.hsv(args)[2] : saturation
    value = Math.round(value / 50)
    if (value === 0) {
      return 30
    }
    let ansi = 30 + ((Math.round(b / 255) << 2) | (Math.round(g / 255) << 1) | Math.round(r / 255))
    if (value === 2) {
      ansi += 60
    }
    return ansi
  }
  convert$1.hsv.ansi16 = function (args) {
    return convert$1.rgb.ansi16(convert$1.hsv.rgb(args), args[2])
  }
  convert$1.rgb.ansi256 = function (args) {
    const r = args[0]
    const g = args[1]
    const b = args[2]
    if (r >> 4 === g >> 4 && g >> 4 === b >> 4) {
      if (r < 8) {
        return 16
      }
      if (r > 248) {
        return 231
      }
      return Math.round(((r - 8) / 247) * 24) + 232
    }
    const ansi =
      16 +
      36 * Math.round((r / 255) * 5) +
      6 * Math.round((g / 255) * 5) +
      Math.round((b / 255) * 5)
    return ansi
  }
  convert$1.ansi16.rgb = function (args) {
    args = args[0]
    let color = args % 10
    if (color === 0 || color === 7) {
      if (args > 50) {
        color += 3.5
      }
      color = (color / 10.5) * 255
      return [color, color, color]
    }
    const mult = (Math.trunc(args > 50) + 1) * 0.5
    const r = (color & 1) * mult * 255
    const g = ((color >> 1) & 1) * mult * 255
    const b = ((color >> 2) & 1) * mult * 255
    return [r, g, b]
  }
  convert$1.ansi256.rgb = function (args) {
    args = args[0]
    if (args >= 232) {
      const c = (args - 232) * 10 + 8
      return [c, c, c]
    }
    args -= 16
    let rem
    const r = (Math.floor(args / 36) / 5) * 255
    const g = (Math.floor((rem = args % 36) / 6) / 5) * 255
    const b = ((rem % 6) / 5) * 255
    return [r, g, b]
  }
  convert$1.rgb.hex = function (args) {
    const integer =
      ((Math.round(args[0]) & 255) << 16) +
      ((Math.round(args[1]) & 255) << 8) +
      (Math.round(args[2]) & 255)
    const string = integer.toString(16).toUpperCase()
    return '000000'.slice(string.length) + string
  }
  convert$1.hex.rgb = function (args) {
    const match = args.toString(16).match(/[a-f\d]{6}|[a-f\d]{3}/i)
    if (!match) {
      return [0, 0, 0]
    }
    let colorString = match[0]
    if (match[0].length === 3) {
      colorString = [...colorString].map((char) => char + char).join('')
    }
    const integer = Number.parseInt(colorString, 16)
    const r = (integer >> 16) & 255
    const g = (integer >> 8) & 255
    const b = integer & 255
    return [r, g, b]
  }
  convert$1.rgb.hcg = function (rgb) {
    const r = rgb[0] / 255
    const g = rgb[1] / 255
    const b = rgb[2] / 255
    const max = Math.max(Math.max(r, g), b)
    const min = Math.min(Math.min(r, g), b)
    const chroma = max - min
    let hue
    const grayscale = chroma < 1 ? min / (1 - chroma) : 0
    if (chroma <= 0) {
      hue = 0
    } else if (max === r) {
      hue = ((g - b) / chroma) % 6
    } else if (max === g) {
      hue = 2 + (b - r) / chroma
    } else {
      hue = 4 + (r - g) / chroma
    }
    hue /= 6
    hue %= 1
    return [hue * 360, chroma * 100, grayscale * 100]
  }
  convert$1.hsl.hcg = function (hsl) {
    const s = hsl[1] / 100
    const l = hsl[2] / 100
    const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l)
    let f = 0
    if (c < 1) {
      f = (l - 0.5 * c) / (1 - c)
    }
    return [hsl[0], c * 100, f * 100]
  }
  convert$1.hsv.hcg = function (hsv) {
    const s = hsv[1] / 100
    const v = hsv[2] / 100
    const c = s * v
    let f = 0
    if (c < 1) {
      f = (v - c) / (1 - c)
    }
    return [hsv[0], c * 100, f * 100]
  }
  convert$1.hcg.rgb = function (hcg) {
    const h = hcg[0] / 360
    const c = hcg[1] / 100
    const g = hcg[2] / 100
    if (c === 0) {
      return [g * 255, g * 255, g * 255]
    }
    const pure = [0, 0, 0]
    const hi = (h % 1) * 6
    const v = hi % 1
    const w = 1 - v
    let mg = 0
    switch (Math.floor(hi)) {
      case 0: {
        pure[0] = 1
        pure[1] = v
        pure[2] = 0
        break
      }
      case 1: {
        pure[0] = w
        pure[1] = 1
        pure[2] = 0
        break
      }
      case 2: {
        pure[0] = 0
        pure[1] = 1
        pure[2] = v
        break
      }
      case 3: {
        pure[0] = 0
        pure[1] = w
        pure[2] = 1
        break
      }
      case 4: {
        pure[0] = v
        pure[1] = 0
        pure[2] = 1
        break
      }
      default: {
        pure[0] = 1
        pure[1] = 0
        pure[2] = w
      }
    }
    mg = (1 - c) * g
    return [(c * pure[0] + mg) * 255, (c * pure[1] + mg) * 255, (c * pure[2] + mg) * 255]
  }
  convert$1.hcg.hsv = function (hcg) {
    const c = hcg[1] / 100
    const g = hcg[2] / 100
    const v = c + g * (1 - c)
    let f = 0
    if (v > 0) {
      f = c / v
    }
    return [hcg[0], f * 100, v * 100]
  }
  convert$1.hcg.hsl = function (hcg) {
    const c = hcg[1] / 100
    const g = hcg[2] / 100
    const l = g * (1 - c) + 0.5 * c
    let s = 0
    if (l > 0 && l < 0.5) {
      s = c / (2 * l)
    } else if (l >= 0.5 && l < 1) {
      s = c / (2 * (1 - l))
    }
    return [hcg[0], s * 100, l * 100]
  }
  convert$1.hcg.hwb = function (hcg) {
    const c = hcg[1] / 100
    const g = hcg[2] / 100
    const v = c + g * (1 - c)
    return [hcg[0], (v - c) * 100, (1 - v) * 100]
  }
  convert$1.hwb.hcg = function (hwb) {
    const w = hwb[1] / 100
    const b = hwb[2] / 100
    const v = 1 - b
    const c = v - w
    let g = 0
    if (c < 1) {
      g = (v - c) / (1 - c)
    }
    return [hwb[0], c * 100, g * 100]
  }
  convert$1.apple.rgb = function (apple) {
    return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255]
  }
  convert$1.rgb.apple = function (rgb) {
    return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535]
  }
  convert$1.gray.rgb = function (args) {
    return [(args[0] / 100) * 255, (args[0] / 100) * 255, (args[0] / 100) * 255]
  }
  convert$1.gray.hsl = function (args) {
    return [0, 0, args[0]]
  }
  convert$1.gray.hsv = convert$1.gray.hsl
  convert$1.gray.hwb = function (gray) {
    return [0, 100, gray[0]]
  }
  convert$1.gray.cmyk = function (gray) {
    return [0, 0, 0, gray[0]]
  }
  convert$1.gray.lab = function (gray) {
    return [gray[0], 0, 0]
  }
  convert$1.gray.hex = function (gray) {
    const value = Math.round((gray[0] / 100) * 255) & 255
    const integer = (value << 16) + (value << 8) + value
    const string = integer.toString(16).toUpperCase()
    return '000000'.slice(string.length) + string
  }
  convert$1.rgb.gray = function (rgb) {
    const value = (rgb[0] + rgb[1] + rgb[2]) / 3
    return [(value / 255) * 100]
  }
  function buildGraph() {
    const graph = {}
    const models2 = Object.keys(convert$1)
    for (let { length } = models2, i = 0; i < length; i++) {
      graph[models2[i]] = {
        // http://jsperf.com/1-vs-infinity
        // micro-opt, but this is simple.
        distance: -1,
        parent: null,
      }
    }
    return graph
  }
  function deriveBFS(fromModel) {
    const graph = buildGraph()
    const queue = [fromModel]
    graph[fromModel].distance = 0
    while (queue.length > 0) {
      const current = queue.pop()
      const adjacents = Object.keys(convert$1[current])
      for (let { length } = adjacents, i = 0; i < length; i++) {
        const adjacent = adjacents[i]
        const node2 = graph[adjacent]
        if (node2.distance === -1) {
          node2.distance = graph[current].distance + 1
          node2.parent = current
          queue.unshift(adjacent)
        }
      }
    }
    return graph
  }
  function link(from, to) {
    return function (args) {
      return to(from(args))
    }
  }
  function wrapConversion(toModel, graph) {
    const path2 = [graph[toModel].parent, toModel]
    let fn = convert$1[graph[toModel].parent][toModel]
    let cur = graph[toModel].parent
    while (graph[cur].parent) {
      path2.unshift(graph[cur].parent)
      fn = link(convert$1[graph[cur].parent][cur], fn)
      cur = graph[cur].parent
    }
    fn.conversion = path2
    return fn
  }
  function route(fromModel) {
    const graph = deriveBFS(fromModel)
    const conversion = {}
    const models2 = Object.keys(graph)
    for (let { length } = models2, i = 0; i < length; i++) {
      const toModel = models2[i]
      const node2 = graph[toModel]
      if (node2.parent === null) {
        continue
      }
      conversion[toModel] = wrapConversion(toModel, graph)
    }
    return conversion
  }
  const convert = {}
  const models = Object.keys(convert$1)
  function wrapRaw(fn) {
    const wrappedFn = function (...args) {
      const arg0 = args[0]
      if (arg0 === void 0 || arg0 === null) {
        return arg0
      }
      if (arg0.length > 1) {
        args = arg0
      }
      return fn(args)
    }
    if ('conversion' in fn) {
      wrappedFn.conversion = fn.conversion
    }
    return wrappedFn
  }
  function wrapRounded(fn) {
    const wrappedFn = function (...args) {
      const arg0 = args[0]
      if (arg0 === void 0 || arg0 === null) {
        return arg0
      }
      if (arg0.length > 1) {
        args = arg0
      }
      const result = fn(args)
      if (typeof result === 'object') {
        for (let { length } = result, i = 0; i < length; i++) {
          result[i] = Math.round(result[i])
        }
      }
      return result
    }
    if ('conversion' in fn) {
      wrappedFn.conversion = fn.conversion
    }
    return wrappedFn
  }
  for (const fromModel of models) {
    convert[fromModel] = {}
    Object.defineProperty(convert[fromModel], 'channels', { value: convert$1[fromModel].channels })
    Object.defineProperty(convert[fromModel], 'labels', { value: convert$1[fromModel].labels })
    const routes = route(fromModel)
    const routeModels = Object.keys(routes)
    for (const toModel of routeModels) {
      const fn = routes[toModel]
      convert[fromModel][toModel] = wrapRounded(fn)
      convert[fromModel][toModel].raw = wrapRaw(fn)
    }
  }
  const skippedModels = [
    // To be honest, I don't really feel like keyword belongs in color convert, but eh.
    'keyword',
    // Gray conflicts with some method names, and has its own method defined.
    'gray',
    // Shouldn't really be in color-convert either...
    'hex',
  ]
  const hashedModelKeys = {}
  for (const model of Object.keys(convert)) {
    hashedModelKeys[[...convert[model].labels].sort().join('')] = model
  }
  const limiters = {}
  function Color(object, model) {
    if (!(this instanceof Color)) {
      return new Color(object, model)
    }
    if (model && model in skippedModels) {
      model = null
    }
    if (model && !(model in convert)) {
      throw new Error('Unknown model: ' + model)
    }
    let i
    let channels
    if (object == null) {
      this.model = 'rgb'
      this.color = [0, 0, 0]
      this.valpha = 1
    } else if (object instanceof Color) {
      this.model = object.model
      this.color = [...object.color]
      this.valpha = object.valpha
    } else if (typeof object === 'string') {
      const result = cs.get(object)
      if (result === null) {
        throw new Error('Unable to parse color from string: ' + object)
      }
      this.model = result.model
      channels = convert[this.model].channels
      this.color = result.value.slice(0, channels)
      this.valpha = typeof result.value[channels] === 'number' ? result.value[channels] : 1
    } else if (object.length > 0) {
      this.model = model || 'rgb'
      channels = convert[this.model].channels
      const newArray = Array.prototype.slice.call(object, 0, channels)
      this.color = zeroArray(newArray, channels)
      this.valpha = typeof object[channels] === 'number' ? object[channels] : 1
    } else if (typeof object === 'number') {
      this.model = 'rgb'
      this.color = [(object >> 16) & 255, (object >> 8) & 255, object & 255]
      this.valpha = 1
    } else {
      this.valpha = 1
      const keys = Object.keys(object)
      if ('alpha' in object) {
        keys.splice(keys.indexOf('alpha'), 1)
        this.valpha = typeof object.alpha === 'number' ? object.alpha : 0
      }
      const hashedKeys = keys.sort().join('')
      if (!(hashedKeys in hashedModelKeys)) {
        throw new Error('Unable to parse color from object: ' + JSON.stringify(object))
      }
      this.model = hashedModelKeys[hashedKeys]
      const { labels } = convert[this.model]
      const color = []
      for (i = 0; i < labels.length; i++) {
        color.push(object[labels[i]])
      }
      this.color = zeroArray(color)
    }
    if (limiters[this.model]) {
      channels = convert[this.model].channels
      for (i = 0; i < channels; i++) {
        const limit = limiters[this.model][i]
        if (limit) {
          this.color[i] = limit(this.color[i])
        }
      }
    }
    this.valpha = Math.max(0, Math.min(1, this.valpha))
    if (Object.freeze) {
      Object.freeze(this)
    }
  }
  Color.prototype = {
    toString() {
      return this.string()
    },
    toJSON() {
      return this[this.model]()
    },
    string(places) {
      let self2 = this.model in cs.to ? this : this.rgb()
      self2 = self2.round(typeof places === 'number' ? places : 1)
      const arguments_ = self2.valpha === 1 ? self2.color : [...self2.color, this.valpha]
      return cs.to[self2.model](...arguments_)
    },
    percentString(places) {
      const self2 = this.rgb().round(typeof places === 'number' ? places : 1)
      const arguments_ = self2.valpha === 1 ? self2.color : [...self2.color, this.valpha]
      return cs.to.rgb.percent(...arguments_)
    },
    array() {
      return this.valpha === 1 ? [...this.color] : [...this.color, this.valpha]
    },
    object() {
      const result = {}
      const { channels } = convert[this.model]
      const { labels } = convert[this.model]
      for (let i = 0; i < channels; i++) {
        result[labels[i]] = this.color[i]
      }
      if (this.valpha !== 1) {
        result.alpha = this.valpha
      }
      return result
    },
    unitArray() {
      const rgb = this.rgb().color
      rgb[0] /= 255
      rgb[1] /= 255
      rgb[2] /= 255
      if (this.valpha !== 1) {
        rgb.push(this.valpha)
      }
      return rgb
    },
    unitObject() {
      const rgb = this.rgb().object()
      rgb.r /= 255
      rgb.g /= 255
      rgb.b /= 255
      if (this.valpha !== 1) {
        rgb.alpha = this.valpha
      }
      return rgb
    },
    round(places) {
      places = Math.max(places || 0, 0)
      return new Color([...this.color.map(roundToPlace(places)), this.valpha], this.model)
    },
    alpha(value) {
      if (value !== void 0) {
        return new Color([...this.color, Math.max(0, Math.min(1, value))], this.model)
      }
      return this.valpha
    },
    // Rgb
    red: getset('rgb', 0, maxfn(255)),
    green: getset('rgb', 1, maxfn(255)),
    blue: getset('rgb', 2, maxfn(255)),
    hue: getset(['hsl', 'hsv', 'hsl', 'hwb', 'hcg'], 0, (value) => ((value % 360) + 360) % 360),
    saturationl: getset('hsl', 1, maxfn(100)),
    lightness: getset('hsl', 2, maxfn(100)),
    saturationv: getset('hsv', 1, maxfn(100)),
    value: getset('hsv', 2, maxfn(100)),
    chroma: getset('hcg', 1, maxfn(100)),
    gray: getset('hcg', 2, maxfn(100)),
    white: getset('hwb', 1, maxfn(100)),
    wblack: getset('hwb', 2, maxfn(100)),
    cyan: getset('cmyk', 0, maxfn(100)),
    magenta: getset('cmyk', 1, maxfn(100)),
    yellow: getset('cmyk', 2, maxfn(100)),
    black: getset('cmyk', 3, maxfn(100)),
    x: getset('xyz', 0, maxfn(95.047)),
    y: getset('xyz', 1, maxfn(100)),
    z: getset('xyz', 2, maxfn(108.833)),
    l: getset('lab', 0, maxfn(100)),
    a: getset('lab', 1),
    b: getset('lab', 2),
    keyword(value) {
      if (value !== void 0) {
        return new Color(value)
      }
      return convert[this.model].keyword(this.color)
    },
    hex(value) {
      if (value !== void 0) {
        return new Color(value)
      }
      return cs.to.hex(...this.rgb().round().color)
    },
    hexa(value) {
      if (value !== void 0) {
        return new Color(value)
      }
      const rgbArray = this.rgb().round().color
      let alphaHex = Math.round(this.valpha * 255)
        .toString(16)
        .toUpperCase()
      if (alphaHex.length === 1) {
        alphaHex = '0' + alphaHex
      }
      return cs.to.hex(...rgbArray) + alphaHex
    },
    rgbNumber() {
      const rgb = this.rgb().color
      return ((rgb[0] & 255) << 16) | ((rgb[1] & 255) << 8) | (rgb[2] & 255)
    },
    luminosity() {
      const rgb = this.rgb().color
      const lum = []
      for (const [i, element] of rgb.entries()) {
        const chan = element / 255
        lum[i] = chan <= 0.04045 ? chan / 12.92 : ((chan + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2]
    },
    contrast(color2) {
      const lum1 = this.luminosity()
      const lum2 = color2.luminosity()
      if (lum1 > lum2) {
        return (lum1 + 0.05) / (lum2 + 0.05)
      }
      return (lum2 + 0.05) / (lum1 + 0.05)
    },
    level(color2) {
      const contrastRatio = this.contrast(color2)
      if (contrastRatio >= 7) {
        return 'AAA'
      }
      return contrastRatio >= 4.5 ? 'AA' : ''
    },
    isDark() {
      const rgb = this.rgb().color
      const yiq = (rgb[0] * 2126 + rgb[1] * 7152 + rgb[2] * 722) / 1e4
      return yiq < 128
    },
    isLight() {
      return !this.isDark()
    },
    negate() {
      const rgb = this.rgb()
      for (let i = 0; i < 3; i++) {
        rgb.color[i] = 255 - rgb.color[i]
      }
      return rgb
    },
    lighten(ratio) {
      const hsl = this.hsl()
      hsl.color[2] += hsl.color[2] * ratio
      return hsl
    },
    darken(ratio) {
      const hsl = this.hsl()
      hsl.color[2] -= hsl.color[2] * ratio
      return hsl
    },
    saturate(ratio) {
      const hsl = this.hsl()
      hsl.color[1] += hsl.color[1] * ratio
      return hsl
    },
    desaturate(ratio) {
      const hsl = this.hsl()
      hsl.color[1] -= hsl.color[1] * ratio
      return hsl
    },
    whiten(ratio) {
      const hwb = this.hwb()
      hwb.color[1] += hwb.color[1] * ratio
      return hwb
    },
    blacken(ratio) {
      const hwb = this.hwb()
      hwb.color[2] += hwb.color[2] * ratio
      return hwb
    },
    grayscale() {
      const rgb = this.rgb().color
      const value = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11
      return Color.rgb(value, value, value)
    },
    fade(ratio) {
      return this.alpha(this.valpha - this.valpha * ratio)
    },
    opaquer(ratio) {
      return this.alpha(this.valpha + this.valpha * ratio)
    },
    rotate(degrees) {
      const hsl = this.hsl()
      let hue = hsl.color[0]
      hue = (hue + degrees) % 360
      hue = hue < 0 ? 360 + hue : hue
      hsl.color[0] = hue
      return hsl
    },
    mix(mixinColor, weight) {
      if (!mixinColor || !mixinColor.rgb) {
        throw new Error(
          'Argument to "mix" was not a Color instance, but rather an instance of ' +
            typeof mixinColor,
        )
      }
      const color1 = mixinColor.rgb()
      const color2 = this.rgb()
      const p = weight === void 0 ? 0.5 : weight
      const w = 2 * p - 1
      const a = color1.alpha() - color2.alpha()
      const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2
      const w2 = 1 - w1
      return Color.rgb(
        w1 * color1.red() + w2 * color2.red(),
        w1 * color1.green() + w2 * color2.green(),
        w1 * color1.blue() + w2 * color2.blue(),
        color1.alpha() * p + color2.alpha() * (1 - p),
      )
    },
  }
  for (const model of Object.keys(convert)) {
    if (skippedModels.includes(model)) {
      continue
    }
    const { channels } = convert[model]
    Color.prototype[model] = function (...arguments_) {
      if (this.model === model) {
        return new Color(this)
      }
      if (arguments_.length > 0) {
        return new Color(arguments_, model)
      }
      return new Color(
        [...assertArray(convert[this.model][model].raw(this.color)), this.valpha],
        model,
      )
    }
    Color[model] = function (...arguments_) {
      let color = arguments_[0]
      if (typeof color === 'number') {
        color = zeroArray(arguments_, channels)
      }
      return new Color(color, model)
    }
  }
  function roundTo(number, places) {
    return Number(number.toFixed(places))
  }
  function roundToPlace(places) {
    return function (number) {
      return roundTo(number, places)
    }
  }
  function getset(model, channel, modifier) {
    model = Array.isArray(model) ? model : [model]
    for (const m of model) {
      ;(limiters[m] ||= [])[channel] = modifier
    }
    model = model[0]
    return function (value) {
      let result
      if (value !== void 0) {
        if (modifier) {
          value = modifier(value)
        }
        result = this[model]()
        result.color[channel] = value
        return result
      }
      result = this[model]().color[channel]
      if (modifier) {
        result = modifier(result)
      }
      return result
    }
  }
  function maxfn(max) {
    return function (v) {
      return Math.max(0, Math.min(max, v))
    }
  }
  function assertArray(value) {
    return Array.isArray(value) ? value : [value]
  }
  function zeroArray(array, length) {
    for (let i = 0; i < length; i++) {
      if (typeof array[i] !== 'number') {
        array[i] = 0
      }
    }
    return array
  }
  function getDefaultExportFromCjs2(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default')
      ? x['default']
      : x
  }
  var textHex = function hex2(str) {
    for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));
    var color = Math.floor(Math.abs(((Math.sin(hash) * 1e4) % 1) * 16777216)).toString(16)
    return '#' + Array(6 - color.length + 1).join('0') + color
  }
  var hex = /* @__PURE__ */ getDefaultExportFromCjs2(textHex)
  function colorspace(namespace, delimiter) {
    const split = namespace.split(delimiter || ':')
    let base = hex(split[0])
    if (!split.length) return base
    for (let i = 0, l = split.length - 1; i < l; i++) {
      base = Color(base)
        .mix(Color(hex(split[i + 1])))
        .saturate(1)
        .hex()
    }
    return base
  }
  index_cjs = colorspace
  return index_cjs
}
var kuler
var hasRequiredKuler
function requireKuler() {
  if (hasRequiredKuler) return kuler
  hasRequiredKuler = 1
  function Kuler(text, color) {
    if (color) return new Kuler(text).style(color)
    if (!(this instanceof Kuler)) return new Kuler(text)
    this.text = text
  }
  Kuler.prototype.prefix = '\x1B['
  Kuler.prototype.suffix = 'm'
  Kuler.prototype.hex = function hex(color) {
    color = color[0] === '#' ? color.substring(1) : color
    if (color.length === 3) {
      color = color.split('')
      color[5] = color[2]
      color[4] = color[2]
      color[3] = color[1]
      color[2] = color[1]
      color[1] = color[0]
      color = color.join('')
    }
    var r = color.substring(0, 2),
      g = color.substring(2, 4),
      b = color.substring(4, 6)
    return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)]
  }
  Kuler.prototype.rgb = function rgb(r, g, b) {
    var red = (r / 255) * 5,
      green = (g / 255) * 5,
      blue = (b / 255) * 5
    return this.ansi(red, green, blue)
  }
  Kuler.prototype.ansi = function ansi(r, g, b) {
    var red = Math.round(r),
      green = Math.round(g),
      blue = Math.round(b)
    return 16 + red * 36 + green * 6 + blue
  }
  Kuler.prototype.reset = function reset() {
    return this.prefix + '39;49' + this.suffix
  }
  Kuler.prototype.style = function style(color) {
    return (
      this.prefix +
      '38;5;' +
      this.rgb.apply(this, this.hex(color)) +
      this.suffix +
      this.text +
      this.reset()
    )
  }
  kuler = Kuler
  return kuler
}
var namespaceAnsi
var hasRequiredNamespaceAnsi
function requireNamespaceAnsi() {
  if (hasRequiredNamespaceAnsi) return namespaceAnsi
  hasRequiredNamespaceAnsi = 1
  var colorspace = requireIndex_cjs()
  var kuler2 = requireKuler()
  namespaceAnsi = function ansiModifier(args, options) {
    var namespace = options.namespace
    var ansi =
      options.colors !== false ? kuler2(namespace + ':', colorspace(namespace)) : namespace + ':'
    args[0] = ansi + ' ' + args[0]
    return args
  }
  return namespaceAnsi
}
var enabled
var hasRequiredEnabled
function requireEnabled() {
  if (hasRequiredEnabled) return enabled
  hasRequiredEnabled = 1
  enabled = function enabled2(name, variable) {
    if (!variable) return false
    var variables = variable.split(/[\s,]+/),
      i = 0
    for (; i < variables.length; i++) {
      variable = variables[i].replace('*', '.*?')
      if ('-' === variable.charAt(0)) {
        if (new RegExp('^' + variable.substr(1) + '$').test(name)) {
          return false
        }
        continue
      }
      if (new RegExp('^' + variable + '$').test(name)) {
        return true
      }
    }
    return false
  }
  return enabled
}
var adapters
var hasRequiredAdapters
function requireAdapters() {
  if (hasRequiredAdapters) return adapters
  hasRequiredAdapters = 1
  var enabled2 = requireEnabled()
  adapters = function create(fn) {
    return function adapter(namespace) {
      try {
        return enabled2(namespace, fn())
      } catch (e) {}
      return false
    }
  }
  return adapters
}
var process_env
var hasRequiredProcess_env
function requireProcess_env() {
  if (hasRequiredProcess_env) return process_env
  hasRequiredProcess_env = 1
  var adapter = requireAdapters()
  process_env = adapter(function processenv() {
    return process.env.DEBUG || process.env.DIAGNOSTICS
  })
  return process_env
}
var console_1
var hasRequiredConsole
function requireConsole() {
  if (hasRequiredConsole) return console_1
  hasRequiredConsole = 1
  console_1 = function (meta, messages) {
    try {
      Function.prototype.apply.call(console.log, console, messages)
    } catch (e) {}
  }
  return console_1
}
var development
var hasRequiredDevelopment
function requireDevelopment() {
  if (hasRequiredDevelopment) return development
  hasRequiredDevelopment = 1
  var create = requireDiagnostics()
  var tty = require$$1.isatty(1)
  var diagnostics2 = create(function dev(namespace, options) {
    options = options || {}
    options.colors = 'colors' in options ? options.colors : tty
    options.namespace = namespace
    options.prod = false
    options.dev = true
    if (!dev.enabled(namespace) && !(options.force || dev.force)) {
      return dev.nope(options)
    }
    return dev.yep(options)
  })
  diagnostics2.modify(requireNamespaceAnsi())
  diagnostics2.use(requireProcess_env())
  diagnostics2.set(requireConsole())
  development = diagnostics2
  return development
}
var hasRequiredNode
function requireNode() {
  if (hasRequiredNode) return node.exports
  hasRequiredNode = 1
  if (process.env.NODE_ENV === 'production') {
    node.exports = requireProduction()
  } else {
    node.exports = requireDevelopment()
  }
  return node.exports
}
var tailFile
var hasRequiredTailFile
function requireTailFile() {
  if (hasRequiredTailFile) return tailFile
  hasRequiredTailFile = 1
  const fs2 = require$$0$6
  const { StringDecoder } = require$$1$1
  const { Stream } = requireReadable()
  function noop() {}
  tailFile = (options, iter) => {
    const buffer = Buffer.alloc(64 * 1024)
    const decode = new StringDecoder('utf8')
    const stream2 = new Stream()
    let buff = ''
    let pos = 0
    let row = 0
    if (options.start === -1) {
      delete options.start
    }
    stream2.readable = true
    stream2.destroy = () => {
      stream2.destroyed = true
      stream2.emit('end')
      stream2.emit('close')
    }
    fs2.open(options.file, 'a+', '0644', (err2, fd) => {
      if (err2) {
        if (!iter) {
          stream2.emit('error', err2)
        } else {
          iter(err2)
        }
        stream2.destroy()
        return
      }
      ;(function read() {
        if (stream2.destroyed) {
          fs2.close(fd, noop)
          return
        }
        return fs2.read(fd, buffer, 0, buffer.length, pos, (error, bytes) => {
          if (error) {
            if (!iter) {
              stream2.emit('error', error)
            } else {
              iter(error)
            }
            stream2.destroy()
            return
          }
          if (!bytes) {
            if (buff) {
              if (options.start == null || row > options.start) {
                if (!iter) {
                  stream2.emit('line', buff)
                } else {
                  iter(null, buff)
                }
              }
              row++
              buff = ''
            }
            return setTimeout(read, 1e3)
          }
          let data = decode.write(buffer.slice(0, bytes))
          if (!iter) {
            stream2.emit('data', data)
          }
          data = (buff + data).split(/\n+/)
          const l = data.length - 1
          let i = 0
          for (; i < l; i++) {
            if (options.start == null || row > options.start) {
              if (!iter) {
                stream2.emit('line', data[i])
              } else {
                iter(null, data[i])
              }
            }
            row++
          }
          buff = data[l]
          pos += bytes
          return read()
        })
      })()
    })
    if (!iter) {
      return stream2
    }
    return stream2.destroy
  }
  return tailFile
}
var file
var hasRequiredFile
function requireFile() {
  if (hasRequiredFile) return file
  hasRequiredFile = 1
  const fs2 = require$$0$6
  const path2 = require$$1$2
  const asyncSeries = requireSeries()
  const zlib = require$$3
  const { MESSAGE } = requireTripleBeam()
  const { Stream, PassThrough } = requireReadable()
  const TransportStream = requireWinstonTransport()
  const debug = requireNode()('winston:file')
  const os2 = require$$0$1
  const tailFile2 = requireTailFile()
  file = class File extends TransportStream {
    /**
     * Constructor function for the File transport object responsible for
     * persisting log messages and metadata to one or more files.
     * @param {Object} options - Options for this instance.
     */
    constructor(options = {}) {
      super(options)
      this.name = options.name || 'file'
      function throwIf(target, ...args) {
        args.slice(1).forEach((name) => {
          if (options[name]) {
            throw new Error(`Cannot set ${name} and ${target} together`)
          }
        })
      }
      this._stream = new PassThrough()
      this._stream.setMaxListeners(30)
      this._onError = this._onError.bind(this)
      if (options.filename || options.dirname) {
        throwIf('filename or dirname', 'stream')
        this._basename = this.filename = options.filename
          ? path2.basename(options.filename)
          : 'winston.log'
        this.dirname = options.dirname || path2.dirname(options.filename)
        this.options = options.options || { flags: 'a' }
      } else if (options.stream) {
        console.warn('options.stream will be removed in winston@4. Use winston.transports.Stream')
        throwIf('stream', 'filename', 'maxsize')
        this._dest = this._stream.pipe(this._setupStream(options.stream))
        this.dirname = path2.dirname(this._dest.path)
      } else {
        throw new Error('Cannot log to file without filename or stream.')
      }
      this.maxsize = options.maxsize || null
      this.rotationFormat = options.rotationFormat || false
      this.zippedArchive = options.zippedArchive || false
      this.maxFiles = options.maxFiles || null
      this.eol = typeof options.eol === 'string' ? options.eol : os2.EOL
      this.tailable = options.tailable || false
      this.lazy = options.lazy || false
      this._size = 0
      this._pendingSize = 0
      this._created = 0
      this._drain = false
      this._opening = false
      this._ending = false
      this._fileExist = false
      if (this.dirname) this._createLogDirIfNotExist(this.dirname)
      if (!this.lazy) this.open()
    }
    finishIfEnding() {
      if (this._ending) {
        if (this._opening) {
          this.once('open', () => {
            this._stream.once('finish', () => this.emit('finish'))
            setImmediate(() => this._stream.end())
          })
        } else {
          this._stream.once('finish', () => this.emit('finish'))
          setImmediate(() => this._stream.end())
        }
      }
    }
    /**
     * Called by Node.js Writable stream before emitting 'finish'.
     * Ensures all buffered data is flushed to the underlying file stream
     * before the transport signals completion.
     * @param {Function} callback - Callback to signal completion.
     * @private
     */
    _final(callback) {
      if (this._opening) {
        this.once('open', () => this._final(callback))
        return
      }
      this._stream.end()
      if (!this._dest) {
        return callback()
      }
      if (this._dest.writableFinished) {
        return callback()
      }
      this._dest.once('finish', callback)
      this._dest.once('error', callback)
    }
    /**
     * Core logging method exposed to Winston. Metadata is optional.
     * @param {Object} info - TODO: add param description.
     * @param {Function} callback - TODO: add param description.
     * @returns {undefined}
     */
    log(info, callback = () => {}) {
      if (this.silent) {
        callback()
        return true
      }
      if (this._drain) {
        this._stream.once('drain', () => {
          this._drain = false
          this.log(info, callback)
        })
        return
      }
      if (this._rotate) {
        this._stream.once('rotate', () => {
          this._rotate = false
          this.log(info, callback)
        })
        return
      }
      if (this.lazy) {
        if (!this._fileExist) {
          if (!this._opening) {
            this.open()
          }
          this.once('open', () => {
            this._fileExist = true
            this.log(info, callback)
            return
          })
          return
        }
        if (this._needsNewFile(this._pendingSize)) {
          this._dest.once('close', () => {
            if (!this._opening) {
              this.open()
            }
            this.once('open', () => {
              this.log(info, callback)
              return
            })
            return
          })
          return
        }
      }
      const output = `${info[MESSAGE]}${this.eol}`
      const bytes = Buffer.byteLength(output)
      function logged() {
        this._size += bytes
        this._pendingSize -= bytes
        debug('logged %s %s', this._size, output)
        this.emit('logged', info)
        if (this._rotate) {
          return
        }
        if (this._opening) {
          return
        }
        if (!this._needsNewFile()) {
          return
        }
        if (this.lazy) {
          this._endStream(() => {
            this.emit('fileclosed')
          })
          return
        }
        this._rotate = true
        this._endStream(() => this._rotateFile())
      }
      this._pendingSize += bytes
      if (
        this._opening &&
        !this.rotatedWhileOpening &&
        this._needsNewFile(this._size + this._pendingSize)
      ) {
        this.rotatedWhileOpening = true
      }
      const written = this._stream.write(output, logged.bind(this))
      if (!written) {
        this._drain = true
        this._stream.once('drain', () => {
          this._drain = false
          callback()
        })
      } else {
        callback()
      }
      debug('written', written, this._drain)
      this.finishIfEnding()
      return written
    }
    /**
     * Query the transport. Options object is optional.
     * @param {Object} options - Loggly-like query options for this instance.
     * @param {function} callback - Continuation to respond to when complete.
     * TODO: Refactor me.
     */
    query(options, callback) {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }
      options = normalizeQuery(options)
      const file2 = path2.join(this.dirname, this.filename)
      let buff = ''
      let results = []
      let row = 0
      const stream2 = fs2.createReadStream(file2, {
        encoding: 'utf8',
      })
      stream2.on('error', (err2) => {
        if (stream2.readable) {
          stream2.destroy()
        }
        if (!callback) {
          return
        }
        return err2.code !== 'ENOENT' ? callback(err2) : callback(null, results)
      })
      stream2.on('data', (data) => {
        data = (buff + data).split(/\n+/)
        const l = data.length - 1
        let i = 0
        for (; i < l; i++) {
          if (!options.start || row >= options.start) {
            add(data[i])
          }
          row++
        }
        buff = data[l]
      })
      stream2.on('close', () => {
        if (buff) {
          add(buff, true)
        }
        if (options.order === 'desc') {
          results = results.reverse()
        }
        if (callback) callback(null, results)
      })
      function add(buff2, attempt) {
        try {
          const log = JSON.parse(buff2)
          if (check(log)) {
            push(log)
          }
        } catch (e) {
          if (!attempt) {
            stream2.emit('error', e)
          }
        }
      }
      function push(log) {
        if (options.rows && results.length >= options.rows && options.order !== 'desc') {
          if (stream2.readable) {
            stream2.destroy()
          }
          return
        }
        if (options.fields) {
          log = options.fields.reduce((obj, key) => {
            obj[key] = log[key]
            return obj
          }, {})
        }
        if (options.order === 'desc') {
          if (results.length >= options.rows) {
            results.shift()
          }
        }
        results.push(log)
      }
      function check(log) {
        if (!log) {
          return
        }
        if (typeof log !== 'object') {
          return
        }
        const time = new Date(log.timestamp)
        if (
          (options.from && time < options.from) ||
          (options.until && time > options.until) ||
          (options.level && options.level !== log.level)
        ) {
          return
        }
        return true
      }
      function normalizeQuery(options2) {
        options2 = options2 || {}
        options2.rows = options2.rows || options2.limit || 10
        options2.start = options2.start || 0
        options2.until = options2.until || /* @__PURE__ */ new Date()
        if (typeof options2.until !== 'object') {
          options2.until = new Date(options2.until)
        }
        options2.from = options2.from || options2.until - 24 * 60 * 60 * 1e3
        if (typeof options2.from !== 'object') {
          options2.from = new Date(options2.from)
        }
        options2.order = options2.order || 'desc'
        return options2
      }
    }
    /**
     * Returns a log stream for this transport. Options object is optional.
     * @param {Object} options - Stream options for this instance.
     * @returns {Stream} - TODO: add return description.
     * TODO: Refactor me.
     */
    stream(options = {}) {
      const file2 = path2.join(this.dirname, this.filename)
      const stream2 = new Stream()
      const tail = {
        file: file2,
        start: options.start,
      }
      stream2.destroy = tailFile2(tail, (err2, line) => {
        if (err2) {
          return stream2.emit('error', err2)
        }
        try {
          stream2.emit('data', line)
          line = JSON.parse(line)
          stream2.emit('log', line)
        } catch (e) {
          stream2.emit('error', e)
        }
      })
      return stream2
    }
    /**
     * Checks to see the filesize of.
     * @returns {undefined}
     */
    open() {
      if (!this.filename) return
      if (this._opening) return
      this._opening = true
      this.stat((err2, size) => {
        if (err2) {
          return this.emit('error', err2)
        }
        debug('stat done: %s { size: %s }', this.filename, size)
        this._size = size
        this._dest = this._createStream(this._stream)
        this._opening = false
        this.once('open', () => {
          if (!this._stream.emit('rotate')) {
            this._rotate = false
          }
        })
      })
    }
    /**
     * Stat the file and assess information in order to create the proper stream.
     * @param {function} callback - TODO: add param description.
     * @returns {undefined}
     */
    stat(callback) {
      const target = this._getFile()
      const fullpath = path2.join(this.dirname, target)
      fs2.stat(fullpath, (err2, stat) => {
        if (err2 && err2.code === 'ENOENT') {
          debug('ENOENT ok', fullpath)
          this.filename = target
          return callback(null, 0)
        }
        if (err2) {
          debug(`err ${err2.code} ${fullpath}`)
          return callback(err2)
        }
        if (!stat || this._needsNewFile(stat.size)) {
          return this._incFile(() => this.stat(callback))
        }
        this.filename = target
        callback(null, stat.size)
      })
    }
    /**
     * Closes the stream associated with this instance.
     * @param {function} cb - TODO: add param description.
     * @returns {undefined}
     */
    close(cb) {
      if (!this._stream) {
        return
      }
      this._stream.end(() => {
        if (cb) {
          cb()
        }
        this.emit('flush')
        this.emit('closed')
      })
    }
    /**
     * TODO: add method description.
     * @param {number} size - TODO: add param description.
     * @returns {undefined}
     */
    _needsNewFile(size) {
      size = size || this._size
      return this.maxsize && size >= this.maxsize
    }
    /**
     * TODO: add method description.
     * @param {Error} err - TODO: add param description.
     * @returns {undefined}
     */
    _onError(err2) {
      this.emit('error', err2)
    }
    /**
     * TODO: add method description.
     * @param {Stream} stream - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     */
    _setupStream(stream2) {
      stream2.on('error', this._onError)
      return stream2
    }
    /**
     * TODO: add method description.
     * @param {Stream} stream - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     */
    _cleanupStream(stream2) {
      stream2.removeListener('error', this._onError)
      stream2.destroy()
      return stream2
    }
    /**
     * TODO: add method description.
     */
    _rotateFile() {
      this._incFile(() => this.open())
    }
    /**
     * Unpipe from the stream that has been marked as full and end it so it
     * flushes to disk.
     *
     * @param {function} callback - Callback for when the current file has closed.
     * @private
     */
    _endStream(callback = () => {}) {
      if (this._dest) {
        this._stream.unpipe(this._dest)
        this._dest.end(() => {
          this._cleanupStream(this._dest)
          callback()
        })
      } else {
        callback()
      }
    }
    /**
     * Returns the WritableStream for the active file on this instance. If we
     * should gzip the file then a zlib stream is returned.
     *
     * @param {ReadableStream} source –PassThrough to pipe to the file when open.
     * @returns {WritableStream} Stream that writes to disk for the active file.
     */
    _createStream(source) {
      const fullpath = path2.join(this.dirname, this.filename)
      debug('create stream start', fullpath, this.options)
      const dest = fs2
        .createWriteStream(fullpath, this.options)
        .on('error', (err2) => debug(err2))
        .on('close', () => debug('close', dest.path, dest.bytesWritten))
        .on('open', () => {
          debug('file open ok', fullpath)
          this.emit('open', fullpath)
          source.pipe(dest)
          if (this.rotatedWhileOpening) {
            this._stream = new PassThrough()
            this._stream.setMaxListeners(30)
            this._rotateFile()
            this.rotatedWhileOpening = false
            this._cleanupStream(dest)
            source.end()
          }
        })
      debug('create stream ok', fullpath)
      return dest
    }
    /**
     * TODO: add method description.
     * @param {function} callback - TODO: add param description.
     * @returns {undefined}
     */
    _incFile(callback) {
      debug('_incFile', this.filename)
      const ext = path2.extname(this._basename)
      const basename = path2.basename(this._basename, ext)
      const tasks = []
      if (this.zippedArchive) {
        tasks.push(
          function (cb) {
            const num = this._created > 0 && !this.tailable ? this._created : ''
            this._compressFile(
              path2.join(this.dirname, `${basename}${num}${ext}`),
              path2.join(this.dirname, `${basename}${num}${ext}.gz`),
              cb,
            )
          }.bind(this),
        )
      }
      tasks.push(
        function (cb) {
          if (!this.tailable) {
            this._created += 1
            this._checkMaxFilesIncrementing(ext, basename, cb)
          } else {
            this._checkMaxFilesTailable(ext, basename, cb)
          }
        }.bind(this),
      )
      asyncSeries(tasks, callback)
    }
    /**
     * Gets the next filename to use for this instance in the case that log
     * filesizes are being capped.
     * @returns {string} - TODO: add return description.
     * @private
     */
    _getFile() {
      const ext = path2.extname(this._basename)
      const basename = path2.basename(this._basename, ext)
      const isRotation = this.rotationFormat ? this.rotationFormat() : this._created
      return !this.tailable && this._created
        ? `${basename}${isRotation}${ext}`
        : `${basename}${ext}`
    }
    /**
     * Increment the number of files created or checked by this instance.
     * @param {mixed} ext - TODO: add param description.
     * @param {mixed} basename - TODO: add param description.
     * @param {mixed} callback - TODO: add param description.
     * @returns {undefined}
     * @private
     */
    _checkMaxFilesIncrementing(ext, basename, callback) {
      if (!this.maxFiles || this._created < this.maxFiles) {
        return setImmediate(callback)
      }
      const oldest = this._created - this.maxFiles
      const isOldest = oldest !== 0 ? oldest : ''
      const isZipped = this.zippedArchive ? '.gz' : ''
      const filePath = `${basename}${isOldest}${ext}${isZipped}`
      const target = path2.join(this.dirname, filePath)
      fs2.unlink(target, callback)
    }
    /**
     * Roll files forward based on integer, up to maxFiles. e.g. if base if
     * file.log and it becomes oversized, roll to file1.log, and allow file.log
     * to be re-used. If file is oversized again, roll file1.log to file2.log,
     * roll file.log to file1.log, and so on.
     * @param {mixed} ext - TODO: add param description.
     * @param {mixed} basename - TODO: add param description.
     * @param {mixed} callback - TODO: add param description.
     * @returns {undefined}
     * @private
     */
    _checkMaxFilesTailable(ext, basename, callback) {
      const tasks = []
      if (!this.maxFiles) {
        return
      }
      const isZipped = this.zippedArchive ? '.gz' : ''
      for (let x = this.maxFiles - 1; x > 1; x--) {
        tasks.push(
          function (i, cb) {
            let fileName = `${basename}${i - 1}${ext}${isZipped}`
            const tmppath = path2.join(this.dirname, fileName)
            fs2.exists(tmppath, (exists) => {
              if (!exists) {
                return cb(null)
              }
              fileName = `${basename}${i}${ext}${isZipped}`
              fs2.rename(tmppath, path2.join(this.dirname, fileName), cb)
            })
          }.bind(this, x),
        )
      }
      asyncSeries(tasks, () => {
        fs2.rename(
          path2.join(this.dirname, `${basename}${ext}${isZipped}`),
          path2.join(this.dirname, `${basename}1${ext}${isZipped}`),
          callback,
        )
      })
    }
    /**
     * Compresses src to dest with gzip and unlinks src
     * @param {string} src - path to source file.
     * @param {string} dest - path to zipped destination file.
     * @param {Function} callback - callback called after file has been compressed.
     * @returns {undefined}
     * @private
     */
    _compressFile(src, dest, callback) {
      fs2.access(src, fs2.F_OK, (err2) => {
        if (err2) {
          return callback()
        }
        var gzip = zlib.createGzip()
        var inp = fs2.createReadStream(src)
        var out = fs2.createWriteStream(dest)
        out.on('finish', () => {
          fs2.unlink(src, callback)
        })
        inp.pipe(gzip).pipe(out)
      })
    }
    _createLogDirIfNotExist(dirPath) {
      if (!fs2.existsSync(dirPath)) {
        fs2.mkdirSync(dirPath, { recursive: true })
      }
    }
  }
  return file
}
var http_1
var hasRequiredHttp
function requireHttp() {
  if (hasRequiredHttp) return http_1
  hasRequiredHttp = 1
  const http = require$$0$7
  const https = require$$1$3
  const { Stream } = requireReadable()
  const TransportStream = requireWinstonTransport()
  const { configure } = requireSafeStableStringify()
  http_1 = class Http extends TransportStream {
    /**
     * Constructor function for the Http transport object responsible for
     * persisting log messages and metadata to a terminal or TTY.
     * @param {!Object} [options={}] - Options for this instance.
     */
    // eslint-disable-next-line max-statements
    constructor(options = {}) {
      super(options)
      this.options = options
      this.name = options.name || 'http'
      this.ssl = !!options.ssl
      this.host = options.host || 'localhost'
      this.port = options.port
      this.auth = options.auth
      this.path = options.path || ''
      this.maximumDepth = options.maximumDepth
      this.agent = options.agent
      this.headers = options.headers || {}
      this.headers['content-type'] = 'application/json'
      this.batch = options.batch || false
      this.batchInterval = options.batchInterval || 5e3
      this.batchCount = options.batchCount || 10
      this.batchOptions = []
      this.batchTimeoutID = -1
      this.batchCallback = {}
      if (!this.port) {
        this.port = this.ssl ? 443 : 80
      }
    }
    /**
     * Core logging method exposed to Winston.
     * @param {Object} info - TODO: add param description.
     * @param {function} callback - TODO: add param description.
     * @returns {undefined}
     */
    log(info, callback) {
      this._request(info, null, null, (err2, res) => {
        if (res && res.statusCode !== 200) {
          err2 = new Error(`Invalid HTTP Status Code: ${res.statusCode}`)
        }
        if (err2) {
          this.emit('warn', err2)
        } else {
          this.emit('logged', info)
        }
      })
      if (callback) {
        setImmediate(callback)
      }
    }
    /**
     * Query the transport. Options object is optional.
     * @param {Object} options -  Loggly-like query options for this instance.
     * @param {function} callback - Continuation to respond to when complete.
     * @returns {undefined}
     */
    query(options, callback) {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }
      options = {
        method: 'query',
        params: this.normalizeQuery(options),
      }
      const auth = options.params.auth || null
      delete options.params.auth
      const path2 = options.params.path || null
      delete options.params.path
      this._request(options, auth, path2, (err2, res, body) => {
        if (res && res.statusCode !== 200) {
          err2 = new Error(`Invalid HTTP Status Code: ${res.statusCode}`)
        }
        if (err2) {
          return callback(err2)
        }
        if (typeof body === 'string') {
          try {
            body = JSON.parse(body)
          } catch (e) {
            return callback(e)
          }
        }
        callback(null, body)
      })
    }
    /**
     * Returns a log stream for this transport. Options object is optional.
     * @param {Object} options - Stream options for this instance.
     * @returns {Stream} - TODO: add return description
     */
    stream(options = {}) {
      const stream2 = new Stream()
      options = {
        method: 'stream',
        params: options,
      }
      const path2 = options.params.path || null
      delete options.params.path
      const auth = options.params.auth || null
      delete options.params.auth
      let buff = ''
      const req = this._request(options, auth, path2)
      stream2.destroy = () => req.destroy()
      req.on('data', (data) => {
        data = (buff + data).split(/\n+/)
        const l = data.length - 1
        let i = 0
        for (; i < l; i++) {
          try {
            stream2.emit('log', JSON.parse(data[i]))
          } catch (e) {
            stream2.emit('error', e)
          }
        }
        buff = data[l]
      })
      req.on('error', (err2) => stream2.emit('error', err2))
      return stream2
    }
    /**
     * Make a request to a winstond server or any http server which can
     * handle json-rpc.
     * @param {function} options - Options to sent the request.
     * @param {Object?} auth - authentication options
     * @param {string} path - request path
     * @param {function} callback - Continuation to respond to when complete.
     */
    _request(options, auth, path2, callback) {
      options = options || {}
      auth = auth || this.auth
      path2 = path2 || this.path || ''
      if (this.batch) {
        this._doBatch(options, callback, auth, path2)
      } else {
        this._doRequest(options, callback, auth, path2)
      }
    }
    /**
     * Send or memorize the options according to batch configuration
     * @param {function} options - Options to sent the request.
     * @param {function} callback - Continuation to respond to when complete.
     * @param {Object?} auth - authentication options
     * @param {string} path - request path
     */
    _doBatch(options, callback, auth, path2) {
      this.batchOptions.push(options)
      if (this.batchOptions.length === 1) {
        const me = this
        this.batchCallback = callback
        this.batchTimeoutID = setTimeout(function () {
          me.batchTimeoutID = -1
          me._doBatchRequest(me.batchCallback, auth, path2)
        }, this.batchInterval)
      }
      if (this.batchOptions.length === this.batchCount) {
        this._doBatchRequest(this.batchCallback, auth, path2)
      }
    }
    /**
     * Initiate a request with the memorized batch options, stop the batch timeout
     * @param {function} callback - Continuation to respond to when complete.
     * @param {Object?} auth - authentication options
     * @param {string} path - request path
     */
    _doBatchRequest(callback, auth, path2) {
      if (this.batchTimeoutID > 0) {
        clearTimeout(this.batchTimeoutID)
        this.batchTimeoutID = -1
      }
      const batchOptionsCopy = this.batchOptions.slice()
      this.batchOptions = []
      this._doRequest(batchOptionsCopy, callback, auth, path2)
    }
    /**
     * Make a request to a winstond server or any http server which can
     * handle json-rpc.
     * @param {function} options - Options to sent the request.
     * @param {function} callback - Continuation to respond to when complete.
     * @param {Object?} auth - authentication options
     * @param {string} path - request path
     */
    _doRequest(options, callback, auth, path2) {
      const headers = Object.assign({}, this.headers)
      if (auth && auth.bearer) {
        headers.Authorization = `Bearer ${auth.bearer}`
      }
      const req = (this.ssl ? https : http).request({
        ...this.options,
        method: 'POST',
        host: this.host,
        port: this.port,
        path: `/${path2.replace(/^\//, '')}`,
        headers,
        auth: auth && auth.username && auth.password ? `${auth.username}:${auth.password}` : '',
        agent: this.agent,
      })
      req.on('error', callback)
      req.on('response', (res) => res.on('end', () => callback(null, res)).resume())
      const jsonStringify = configure({
        ...(this.maximumDepth && { maximumDepth: this.maximumDepth }),
      })
      req.end(Buffer.from(jsonStringify(options, this.options.replacer), 'utf8'))
    }
  }
  return http_1
}
var isStream_1
var hasRequiredIsStream
function requireIsStream() {
  if (hasRequiredIsStream) return isStream_1
  hasRequiredIsStream = 1
  const isStream = (stream2) =>
    stream2 !== null && typeof stream2 === 'object' && typeof stream2.pipe === 'function'
  isStream.writable = (stream2) =>
    isStream(stream2) &&
    stream2.writable !== false &&
    typeof stream2._write === 'function' &&
    typeof stream2._writableState === 'object'
  isStream.readable = (stream2) =>
    isStream(stream2) &&
    stream2.readable !== false &&
    typeof stream2._read === 'function' &&
    typeof stream2._readableState === 'object'
  isStream.duplex = (stream2) => isStream.writable(stream2) && isStream.readable(stream2)
  isStream.transform = (stream2) =>
    isStream.duplex(stream2) && typeof stream2._transform === 'function'
  isStream_1 = isStream
  return isStream_1
}
var stream
var hasRequiredStream
function requireStream() {
  if (hasRequiredStream) return stream
  hasRequiredStream = 1
  const isStream = requireIsStream()
  const { MESSAGE } = requireTripleBeam()
  const os2 = require$$0$1
  const TransportStream = requireWinstonTransport()
  stream = class Stream extends TransportStream {
    /**
     * Constructor function for the Console transport object responsible for
     * persisting log messages and metadata to a terminal or TTY.
     * @param {!Object} [options={}] - Options for this instance.
     */
    constructor(options = {}) {
      super(options)
      if (!options.stream || !isStream(options.stream)) {
        throw new Error('options.stream is required.')
      }
      this._stream = options.stream
      this._stream.setMaxListeners(Infinity)
      this.isObjectMode = options.stream._writableState.objectMode
      this.eol = typeof options.eol === 'string' ? options.eol : os2.EOL
    }
    /**
     * Core logging method exposed to Winston.
     * @param {Object} info - TODO: add param description.
     * @param {Function} callback - TODO: add param description.
     * @returns {undefined}
     */
    log(info, callback) {
      setImmediate(() => this.emit('logged', info))
      if (this.isObjectMode) {
        this._stream.write(info)
        if (callback) {
          callback()
        }
        return
      }
      this._stream.write(`${info[MESSAGE]}${this.eol}`)
      if (callback) {
        callback()
      }
      return
    }
  }
  return stream
}
var hasRequiredTransports
function requireTransports() {
  if (hasRequiredTransports) return transports
  hasRequiredTransports = 1
  ;(function (exports) {
    Object.defineProperty(exports, 'Console', {
      configurable: true,
      enumerable: true,
      get() {
        return requireConsole$1()
      },
    })
    Object.defineProperty(exports, 'File', {
      configurable: true,
      enumerable: true,
      get() {
        return requireFile()
      },
    })
    Object.defineProperty(exports, 'Http', {
      configurable: true,
      enumerable: true,
      get() {
        return requireHttp()
      },
    })
    Object.defineProperty(exports, 'Stream', {
      configurable: true,
      enumerable: true,
      get() {
        return requireStream()
      },
    })
  })(transports)
  return transports
}
var config = {}
var hasRequiredConfig
function requireConfig() {
  if (hasRequiredConfig) return config
  hasRequiredConfig = 1
  const logform2 = requireLogform()
  const { configs } = requireTripleBeam()
  config.cli = logform2.levels(configs.cli)
  config.npm = logform2.levels(configs.npm)
  config.syslog = logform2.levels(configs.syslog)
  config.addColors = logform2.levels
  return config
}
var forEach = { exports: {} }
var eachOf = { exports: {} }
var hasRequiredEachOf
function requireEachOf() {
  if (hasRequiredEachOf) return eachOf.exports
  hasRequiredEachOf = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    var _isArrayLike = requireIsArrayLike()
    var _isArrayLike2 = _interopRequireDefault(_isArrayLike)
    var _breakLoop = requireBreakLoop()
    var _breakLoop2 = _interopRequireDefault(_breakLoop)
    var _eachOfLimit = requireEachOfLimit()
    var _eachOfLimit2 = _interopRequireDefault(_eachOfLimit)
    var _once = requireOnce()
    var _once2 = _interopRequireDefault(_once)
    var _onlyOnce = requireOnlyOnce()
    var _onlyOnce2 = _interopRequireDefault(_onlyOnce)
    var _wrapAsync = requireWrapAsync()
    var _wrapAsync2 = _interopRequireDefault(_wrapAsync)
    var _awaitify = requireAwaitify()
    var _awaitify2 = _interopRequireDefault(_awaitify)
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj }
    }
    function eachOfArrayLike(coll, iteratee, callback) {
      callback = (0, _once2.default)(callback)
      var index = 0,
        completed = 0,
        { length } = coll,
        canceled = false
      if (length === 0) {
        callback(null)
      }
      function iteratorCallback(err2, value) {
        if (err2 === false) {
          canceled = true
        }
        if (canceled === true) return
        if (err2) {
          callback(err2)
        } else if (++completed === length || value === _breakLoop2.default) {
          callback(null)
        }
      }
      for (; index < length; index++) {
        iteratee(coll[index], index, (0, _onlyOnce2.default)(iteratorCallback))
      }
    }
    function eachOfGeneric(coll, iteratee, callback) {
      return (0, _eachOfLimit2.default)(coll, Infinity, iteratee, callback)
    }
    function eachOf2(coll, iteratee, callback) {
      var eachOfImplementation = (0, _isArrayLike2.default)(coll) ? eachOfArrayLike : eachOfGeneric
      return eachOfImplementation(coll, (0, _wrapAsync2.default)(iteratee), callback)
    }
    exports.default = (0, _awaitify2.default)(eachOf2, 3)
    module.exports = exports.default
  })(eachOf, eachOf.exports)
  return eachOf.exports
}
var withoutIndex = { exports: {} }
var hasRequiredWithoutIndex
function requireWithoutIndex() {
  if (hasRequiredWithoutIndex) return withoutIndex.exports
  hasRequiredWithoutIndex = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    exports.default = _withoutIndex
    function _withoutIndex(iteratee) {
      return (value, index, callback) => iteratee(value, callback)
    }
    module.exports = exports.default
  })(withoutIndex, withoutIndex.exports)
  return withoutIndex.exports
}
var hasRequiredForEach
function requireForEach() {
  if (hasRequiredForEach) return forEach.exports
  hasRequiredForEach = 1
  ;(function (module, exports) {
    Object.defineProperty(exports, '__esModule', {
      value: true,
    })
    var _eachOf = requireEachOf()
    var _eachOf2 = _interopRequireDefault(_eachOf)
    var _withoutIndex = requireWithoutIndex()
    var _withoutIndex2 = _interopRequireDefault(_withoutIndex)
    var _wrapAsync = requireWrapAsync()
    var _wrapAsync2 = _interopRequireDefault(_wrapAsync)
    var _awaitify = requireAwaitify()
    var _awaitify2 = _interopRequireDefault(_awaitify)
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj }
    }
    function eachLimit(coll, iteratee, callback) {
      return (0, _eachOf2.default)(
        coll,
        (0, _withoutIndex2.default)((0, _wrapAsync2.default)(iteratee)),
        callback,
      )
    }
    exports.default = (0, _awaitify2.default)(eachLimit, 3)
    module.exports = exports.default
  })(forEach, forEach.exports)
  return forEach.exports
}
var fn_name
var hasRequiredFn_name
function requireFn_name() {
  if (hasRequiredFn_name) return fn_name
  hasRequiredFn_name = 1
  var toString = Object.prototype.toString
  fn_name = function name(fn) {
    if ('string' === typeof fn.displayName && fn.constructor.name) {
      return fn.displayName
    } else if ('string' === typeof fn.name && fn.name) {
      return fn.name
    }
    if ('object' === typeof fn && fn.constructor && 'string' === typeof fn.constructor.name)
      return fn.constructor.name
    var named = fn.toString(),
      type = toString.call(fn).slice(8, -1)
    if ('Function' === type) {
      named = named.substring(named.indexOf('(') + 1, named.indexOf(')'))
    } else {
      named = type
    }
    return named || 'anonymous'
  }
  return fn_name
}
var oneTime
var hasRequiredOneTime
function requireOneTime() {
  if (hasRequiredOneTime) return oneTime
  hasRequiredOneTime = 1
  var name = requireFn_name()
  oneTime = function one(fn) {
    var called = 0,
      value
    function onetime() {
      if (called) return value
      called = 1
      value = fn.apply(this, arguments)
      fn = null
      return value
    }
    onetime.displayName = name(fn)
    return onetime
  }
  return oneTime
}
var stackTrace = {}
var hasRequiredStackTrace
function requireStackTrace() {
  if (hasRequiredStackTrace) return stackTrace
  hasRequiredStackTrace = 1
  ;(function (exports) {
    exports.get = function (belowFn) {
      var oldLimit = Error.stackTraceLimit
      Error.stackTraceLimit = Infinity
      var dummyObject = {}
      var v8Handler = Error.prepareStackTrace
      Error.prepareStackTrace = function (dummyObject2, v8StackTrace2) {
        return v8StackTrace2
      }
      Error.captureStackTrace(dummyObject, belowFn || exports.get)
      var v8StackTrace = dummyObject.stack
      Error.prepareStackTrace = v8Handler
      Error.stackTraceLimit = oldLimit
      return v8StackTrace
    }
    exports.parse = function (err2) {
      if (!err2.stack) {
        return []
      }
      var self2 = this
      var lines = err2.stack.split('\n').slice(1)
      return lines
        .map(function (line) {
          if (line.match(/^\s*[-]{4,}$/)) {
            return self2._createParsedCallSite({
              fileName: line,
              lineNumber: null,
              functionName: null,
              typeName: null,
              methodName: null,
              columnNumber: null,
              native: null,
            })
          }
          var lineMatch = line.match(/at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/)
          if (!lineMatch) {
            return
          }
          var object = null
          var method = null
          var functionName = null
          var typeName = null
          var methodName = null
          var isNative = lineMatch[5] === 'native'
          if (lineMatch[1]) {
            functionName = lineMatch[1]
            var methodStart = functionName.lastIndexOf('.')
            if (functionName[methodStart - 1] == '.') methodStart--
            if (methodStart > 0) {
              object = functionName.substr(0, methodStart)
              method = functionName.substr(methodStart + 1)
              var objectEnd = object.indexOf('.Module')
              if (objectEnd > 0) {
                functionName = functionName.substr(objectEnd + 1)
                object = object.substr(0, objectEnd)
              }
            }
            typeName = null
          }
          if (method) {
            typeName = object
            methodName = method
          }
          if (method === '<anonymous>') {
            methodName = null
            functionName = null
          }
          var properties = {
            fileName: lineMatch[2] || null,
            lineNumber: parseInt(lineMatch[3], 10) || null,
            functionName,
            typeName,
            methodName,
            columnNumber: parseInt(lineMatch[4], 10) || null,
            native: isNative,
          }
          return self2._createParsedCallSite(properties)
        })
        .filter(function (callSite) {
          return !!callSite
        })
    }
    function CallSite(properties) {
      for (var property in properties) {
        this[property] = properties[property]
      }
    }
    var strProperties = [
      'this',
      'typeName',
      'functionName',
      'methodName',
      'fileName',
      'lineNumber',
      'columnNumber',
      'function',
      'evalOrigin',
    ]
    var boolProperties = ['topLevel', 'eval', 'native', 'constructor']
    strProperties.forEach(function (property) {
      CallSite.prototype[property] = null
      CallSite.prototype['get' + property[0].toUpperCase() + property.substr(1)] = function () {
        return this[property]
      }
    })
    boolProperties.forEach(function (property) {
      CallSite.prototype[property] = false
      CallSite.prototype['is' + property[0].toUpperCase() + property.substr(1)] = function () {
        return this[property]
      }
    })
    exports._createParsedCallSite = function (properties) {
      return new CallSite(properties)
    }
  })(stackTrace)
  return stackTrace
}
var exceptionStream
var hasRequiredExceptionStream
function requireExceptionStream() {
  if (hasRequiredExceptionStream) return exceptionStream
  hasRequiredExceptionStream = 1
  const { Writable } = requireReadable()
  exceptionStream = class ExceptionStream extends Writable {
    /**
     * Constructor function for the ExceptionStream responsible for wrapping a
     * TransportStream; only allowing writes of `info` objects with
     * `info.exception` set to true.
     * @param {!TransportStream} transport - Stream to filter to exceptions
     */
    constructor(transport) {
      super({ objectMode: true })
      if (!transport) {
        throw new Error('ExceptionStream requires a TransportStream instance.')
      }
      this.handleExceptions = true
      this.transport = transport
    }
    /**
     * Writes the info object to our transport instance if (and only if) the
     * `exception` property is set on the info.
     * @param {mixed} info - TODO: add param description.
     * @param {mixed} enc - TODO: add param description.
     * @param {mixed} callback - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     * @private
     */
    _write(info, enc, callback) {
      if (info.exception) {
        return this.transport.log(info, callback)
      }
      callback()
      return true
    }
  }
  return exceptionStream
}
var exceptionHandler
var hasRequiredExceptionHandler
function requireExceptionHandler() {
  if (hasRequiredExceptionHandler) return exceptionHandler
  hasRequiredExceptionHandler = 1
  const os2 = require$$0$1
  const asyncForEach = requireForEach()
  const debug = requireNode()('winston:exception')
  const once2 = requireOneTime()
  const stackTrace2 = requireStackTrace()
  const ExceptionStream = requireExceptionStream()
  exceptionHandler = class ExceptionHandler {
    /**
     * TODO: add contructor description
     * @param {!Logger} logger - TODO: add param description
     */
    constructor(logger2) {
      if (!logger2) {
        throw new Error('Logger is required to handle exceptions')
      }
      this.logger = logger2
      this.handlers = /* @__PURE__ */ new Map()
    }
    /**
     * Handles `uncaughtException` events for the current process by adding any
     * handlers passed in.
     * @returns {undefined}
     */
    handle(...args) {
      args.forEach((arg) => {
        if (Array.isArray(arg)) {
          return arg.forEach((handler) => this._addHandler(handler))
        }
        this._addHandler(arg)
      })
      if (!this.catcher) {
        this.catcher = this._uncaughtException.bind(this)
        process.on('uncaughtException', this.catcher)
      }
    }
    /**
     * Removes any handlers to `uncaughtException` events for the current
     * process. This does not modify the state of the `this.handlers` set.
     * @returns {undefined}
     */
    unhandle() {
      if (this.catcher) {
        process.removeListener('uncaughtException', this.catcher)
        this.catcher = false
        Array.from(this.handlers.values()).forEach((wrapper) => this.logger.unpipe(wrapper))
      }
    }
    /**
     * TODO: add method description
     * @param {Error} err - Error to get information about.
     * @returns {mixed} - TODO: add return description.
     */
    getAllInfo(err2) {
      let message = null
      if (err2) {
        message = typeof err2 === 'string' ? err2 : err2.message
      }
      return {
        error: err2,
        // TODO (indexzero): how do we configure this?
        level: 'error',
        message: [
          `uncaughtException: ${message || '(no error message)'}`,
          (err2 && err2.stack) || '  No stack trace',
        ].join('\n'),
        stack: err2 && err2.stack,
        exception: true,
        date: /* @__PURE__ */ new Date().toString(),
        process: this.getProcessInfo(),
        os: this.getOsInfo(),
        trace: this.getTrace(err2),
      }
    }
    /**
     * Gets all relevant process information for the currently running process.
     * @returns {mixed} - TODO: add return description.
     */
    getProcessInfo() {
      return {
        pid: process.pid,
        uid: process.getuid ? process.getuid() : null,
        gid: process.getgid ? process.getgid() : null,
        cwd: process.cwd(),
        execPath: process.execPath,
        version: process.version,
        argv: process.argv,
        memoryUsage: process.memoryUsage(),
      }
    }
    /**
     * Gets all relevant OS information for the currently running process.
     * @returns {mixed} - TODO: add return description.
     */
    getOsInfo() {
      return {
        loadavg: os2.loadavg(),
        uptime: os2.uptime(),
      }
    }
    /**
     * Gets a stack trace for the specified error.
     * @param {mixed} err - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     */
    getTrace(err2) {
      const trace = err2 ? stackTrace2.parse(err2) : stackTrace2.get()
      return trace.map((site) => {
        return {
          column: site.getColumnNumber(),
          file: site.getFileName(),
          function: site.getFunctionName(),
          line: site.getLineNumber(),
          method: site.getMethodName(),
          native: site.isNative(),
        }
      })
    }
    /**
     * Helper method to add a transport as an exception handler.
     * @param {Transport} handler - The transport to add as an exception handler.
     * @returns {void}
     */
    _addHandler(handler) {
      if (!this.handlers.has(handler)) {
        handler.handleExceptions = true
        const wrapper = new ExceptionStream(handler)
        this.handlers.set(handler, wrapper)
        this.logger.pipe(wrapper)
      }
    }
    /**
     * Logs all relevant information around the `err` and exits the current
     * process.
     * @param {Error} err - Error to handle
     * @returns {mixed} - TODO: add return description.
     * @private
     */
    _uncaughtException(err2) {
      const info = this.getAllInfo(err2)
      const handlers = this._getExceptionHandlers()
      let doExit =
        typeof this.logger.exitOnError === 'function'
          ? this.logger.exitOnError(err2)
          : this.logger.exitOnError
      let timeout
      if (!handlers.length && doExit) {
        console.warn('winston: exitOnError cannot be true with no exception handlers.')
        console.warn('winston: not exiting process.')
        doExit = false
      }
      function gracefulExit() {
        debug('doExit', doExit)
        debug('process._exiting', process._exiting)
        if (doExit && !process._exiting) {
          if (timeout) {
            clearTimeout(timeout)
          }
          process.exit(1)
        }
      }
      if (!handlers || handlers.length === 0) {
        return process.nextTick(gracefulExit)
      }
      asyncForEach(
        handlers,
        (handler, next) => {
          const done = once2(next)
          const transport = handler.transport || handler
          function onDone(event) {
            return () => {
              debug(event)
              done()
            }
          }
          transport._ending = true
          transport.once('finish', onDone('finished'))
          transport.once('error', onDone('error'))
        },
        () => doExit && gracefulExit(),
      )
      this.logger.log(info)
      if (doExit) {
        timeout = setTimeout(gracefulExit, 3e3)
      }
    }
    /**
     * Returns the list of transports and exceptionHandlers for this instance.
     * @returns {Array} - List of transports and exceptionHandlers for this
     * instance.
     * @private
     */
    _getExceptionHandlers() {
      return this.logger.transports.filter((wrap2) => {
        const transport = wrap2.transport || wrap2
        return transport.handleExceptions
      })
    }
  }
  return exceptionHandler
}
var rejectionStream
var hasRequiredRejectionStream
function requireRejectionStream() {
  if (hasRequiredRejectionStream) return rejectionStream
  hasRequiredRejectionStream = 1
  const { Writable } = requireReadable()
  rejectionStream = class RejectionStream extends Writable {
    /**
     * Constructor function for the RejectionStream responsible for wrapping a
     * TransportStream; only allowing writes of `info` objects with
     * `info.rejection` set to true.
     * @param {!TransportStream} transport - Stream to filter to rejections
     */
    constructor(transport) {
      super({ objectMode: true })
      if (!transport) {
        throw new Error('RejectionStream requires a TransportStream instance.')
      }
      this.handleRejections = true
      this.transport = transport
    }
    /**
     * Writes the info object to our transport instance if (and only if) the
     * `rejection` property is set on the info.
     * @param {mixed} info - TODO: add param description.
     * @param {mixed} enc - TODO: add param description.
     * @param {mixed} callback - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     * @private
     */
    _write(info, enc, callback) {
      if (info.rejection) {
        return this.transport.log(info, callback)
      }
      callback()
      return true
    }
  }
  return rejectionStream
}
var rejectionHandler
var hasRequiredRejectionHandler
function requireRejectionHandler() {
  if (hasRequiredRejectionHandler) return rejectionHandler
  hasRequiredRejectionHandler = 1
  const os2 = require$$0$1
  const asyncForEach = requireForEach()
  const debug = requireNode()('winston:rejection')
  const once2 = requireOneTime()
  const stackTrace2 = requireStackTrace()
  const RejectionStream = requireRejectionStream()
  rejectionHandler = class RejectionHandler {
    /**
     * TODO: add contructor description
     * @param {!Logger} logger - TODO: add param description
     */
    constructor(logger2) {
      if (!logger2) {
        throw new Error('Logger is required to handle rejections')
      }
      this.logger = logger2
      this.handlers = /* @__PURE__ */ new Map()
    }
    /**
     * Handles `unhandledRejection` events for the current process by adding any
     * handlers passed in.
     * @returns {undefined}
     */
    handle(...args) {
      args.forEach((arg) => {
        if (Array.isArray(arg)) {
          return arg.forEach((handler) => this._addHandler(handler))
        }
        this._addHandler(arg)
      })
      if (!this.catcher) {
        this.catcher = this._unhandledRejection.bind(this)
        process.on('unhandledRejection', this.catcher)
      }
    }
    /**
     * Removes any handlers to `unhandledRejection` events for the current
     * process. This does not modify the state of the `this.handlers` set.
     * @returns {undefined}
     */
    unhandle() {
      if (this.catcher) {
        process.removeListener('unhandledRejection', this.catcher)
        this.catcher = false
        Array.from(this.handlers.values()).forEach((wrapper) => this.logger.unpipe(wrapper))
      }
    }
    /**
     * TODO: add method description
     * @param {Error} err - Error to get information about.
     * @returns {mixed} - TODO: add return description.
     */
    getAllInfo(err2) {
      let message = null
      if (err2) {
        message = typeof err2 === 'string' ? err2 : err2.message
      }
      return {
        error: err2,
        // TODO (indexzero): how do we configure this?
        level: 'error',
        message: [
          `unhandledRejection: ${message || '(no error message)'}`,
          (err2 && err2.stack) || '  No stack trace',
        ].join('\n'),
        stack: err2 && err2.stack,
        rejection: true,
        date: /* @__PURE__ */ new Date().toString(),
        process: this.getProcessInfo(),
        os: this.getOsInfo(),
        trace: this.getTrace(err2),
      }
    }
    /**
     * Gets all relevant process information for the currently running process.
     * @returns {mixed} - TODO: add return description.
     */
    getProcessInfo() {
      return {
        pid: process.pid,
        uid: process.getuid ? process.getuid() : null,
        gid: process.getgid ? process.getgid() : null,
        cwd: process.cwd(),
        execPath: process.execPath,
        version: process.version,
        argv: process.argv,
        memoryUsage: process.memoryUsage(),
      }
    }
    /**
     * Gets all relevant OS information for the currently running process.
     * @returns {mixed} - TODO: add return description.
     */
    getOsInfo() {
      return {
        loadavg: os2.loadavg(),
        uptime: os2.uptime(),
      }
    }
    /**
     * Gets a stack trace for the specified error.
     * @param {mixed} err - TODO: add param description.
     * @returns {mixed} - TODO: add return description.
     */
    getTrace(err2) {
      const trace = err2 ? stackTrace2.parse(err2) : stackTrace2.get()
      return trace.map((site) => {
        return {
          column: site.getColumnNumber(),
          file: site.getFileName(),
          function: site.getFunctionName(),
          line: site.getLineNumber(),
          method: site.getMethodName(),
          native: site.isNative(),
        }
      })
    }
    /**
     * Helper method to add a transport as an exception handler.
     * @param {Transport} handler - The transport to add as an exception handler.
     * @returns {void}
     */
    _addHandler(handler) {
      if (!this.handlers.has(handler)) {
        handler.handleRejections = true
        const wrapper = new RejectionStream(handler)
        this.handlers.set(handler, wrapper)
        this.logger.pipe(wrapper)
      }
    }
    /**
     * Logs all relevant information around the `err` and exits the current
     * process.
     * @param {Error} err - Error to handle
     * @returns {mixed} - TODO: add return description.
     * @private
     */
    _unhandledRejection(err2) {
      const info = this.getAllInfo(err2)
      const handlers = this._getRejectionHandlers()
      let doExit =
        typeof this.logger.exitOnError === 'function'
          ? this.logger.exitOnError(err2)
          : this.logger.exitOnError
      let timeout
      if (!handlers.length && doExit) {
        console.warn('winston: exitOnError cannot be true with no rejection handlers.')
        console.warn('winston: not exiting process.')
        doExit = false
      }
      function gracefulExit() {
        debug('doExit', doExit)
        debug('process._exiting', process._exiting)
        if (doExit && !process._exiting) {
          if (timeout) {
            clearTimeout(timeout)
          }
          process.exit(1)
        }
      }
      if (!handlers || handlers.length === 0) {
        return process.nextTick(gracefulExit)
      }
      asyncForEach(
        handlers,
        (handler, next) => {
          const done = once2(next)
          const transport = handler.transport || handler
          function onDone(event) {
            return () => {
              debug(event)
              done()
            }
          }
          transport._ending = true
          transport.once('finish', onDone('finished'))
          transport.once('error', onDone('error'))
        },
        () => doExit && gracefulExit(),
      )
      this.logger.log(info)
      if (doExit) {
        timeout = setTimeout(gracefulExit, 3e3)
      }
    }
    /**
     * Returns the list of transports and exceptionHandlers for this instance.
     * @returns {Array} - List of transports and exceptionHandlers for this
     * instance.
     * @private
     */
    _getRejectionHandlers() {
      return this.logger.transports.filter((wrap2) => {
        const transport = wrap2.transport || wrap2
        return transport.handleRejections
      })
    }
  }
  return rejectionHandler
}
var profiler
var hasRequiredProfiler
function requireProfiler() {
  if (hasRequiredProfiler) return profiler
  hasRequiredProfiler = 1
  class Profiler {
    /**
     * Constructor function for the Profiler instance used by
     * `Logger.prototype.startTimer`. When done is called the timer will finish
     * and log the duration.
     * @param {!Logger} logger - TODO: add param description.
     * @private
     */
    constructor(logger2) {
      const Logger = requireLogger()
      if (typeof logger2 !== 'object' || Array.isArray(logger2) || !(logger2 instanceof Logger)) {
        throw new Error('Logger is required for profiling')
      } else {
        this.logger = logger2
        this.start = Date.now()
      }
    }
    /**
     * Ends the current timer (i.e. Profiler) instance and logs the `msg` along
     * with the duration since creation.
     * @returns {mixed} - TODO: add return description.
     * @private
     */
    done(...args) {
      if (typeof args[args.length - 1] === 'function') {
        console.warn('Callback function no longer supported as of winston@3.0.0')
        args.pop()
      }
      const info = typeof args[args.length - 1] === 'object' ? args.pop() : {}
      info.level = info.level || 'info'
      info.durationMs = Date.now() - this.start
      return this.logger.write(info)
    }
  }
  profiler = Profiler
  return profiler
}
var logger$1
var hasRequiredLogger
function requireLogger() {
  if (hasRequiredLogger) return logger$1
  hasRequiredLogger = 1
  const { Stream, Transform } = requireReadable()
  const asyncForEach = requireForEach()
  const { LEVEL, SPLAT } = requireTripleBeam()
  const isStream = requireIsStream()
  const ExceptionHandler = requireExceptionHandler()
  const RejectionHandler = requireRejectionHandler()
  const LegacyTransportStream = requireLegacy()
  const Profiler = requireProfiler()
  const { warn } = requireCommon()
  const config2 = requireConfig()
  const formatRegExp = /%[scdjifoO%]/g
  class Logger extends Transform {
    /**
     * Constructor function for the Logger object responsible for persisting log
     * messages and metadata to one or more transports.
     * @param {!Object} options - foo
     */
    constructor(options) {
      super({ objectMode: true })
      this.configure(options)
    }
    child(defaultRequestMetadata) {
      const logger2 = this
      return Object.create(logger2, {
        write: {
          value: function (info) {
            const infoClone = Object.assign({}, defaultRequestMetadata, info)
            if (info instanceof Error) {
              infoClone.stack = info.stack
              infoClone.message = info.message
              infoClone.cause = info.cause
            }
            logger2.write(infoClone)
          },
        },
      })
    }
    /**
     * This will wholesale reconfigure this instance by:
     * 1. Resetting all transports. Older transports will be removed implicitly.
     * 2. Set all other options including levels, colors, rewriters, filters,
     *    exceptionHandlers, etc.
     * @param {!Object} options - TODO: add param description.
     * @returns {undefined}
     */
    configure({
      silent,
      format: format2,
      defaultMeta,
      levels: levels2,
      level = 'info',
      exitOnError = true,
      transports: transports2,
      colors: colors2,
      emitErrs,
      formatters,
      padLevels: padLevels2,
      rewriters,
      stripColors,
      exceptionHandlers,
      rejectionHandlers,
    } = {}) {
      if (this.transports.length) {
        this.clear()
      }
      this.silent = silent
      this.format = format2 || this.format || requireJson()()
      this.defaultMeta = defaultMeta || null
      this.levels = levels2 || this.levels || config2.npm.levels
      this.level = level
      if (this.exceptions) {
        this.exceptions.unhandle()
      }
      if (this.rejections) {
        this.rejections.unhandle()
      }
      this.exceptions = new ExceptionHandler(this)
      this.rejections = new RejectionHandler(this)
      this.profilers = {}
      this.exitOnError = exitOnError
      if (transports2) {
        transports2 = Array.isArray(transports2) ? transports2 : [transports2]
        transports2.forEach((transport) => this.add(transport))
      }
      if (colors2 || emitErrs || formatters || padLevels2 || rewriters || stripColors) {
        throw new Error(
          [
            '{ colors, emitErrs, formatters, padLevels, rewriters, stripColors } were removed in winston@3.0.0.',
            'Use a custom winston.format(function) instead.',
            'See: https://github.com/winstonjs/winston/tree/master/UPGRADE-3.0.md',
          ].join('\n'),
        )
      }
      if (exceptionHandlers) {
        this.exceptions.handle(exceptionHandlers)
      }
      if (rejectionHandlers) {
        this.rejections.handle(rejectionHandlers)
      }
    }
    /* eslint-disable valid-jsdoc */
    /**
     * Helper method to get the highest logging level associated with a logger
     *
     * @returns { number | null } - The highest configured logging level, null
     * for invalid configuration
     */
    getHighestLogLevel() {
      const configuredLevelValue = getLevelValue(this.levels, this.level)
      if (!this.transports || this.transports.length === 0) {
        return configuredLevelValue
      }
      return this.transports.reduce((max, transport) => {
        const levelValue = getLevelValue(this.levels, transport.level)
        return levelValue !== null && levelValue > max ? levelValue : max
      }, configuredLevelValue)
    }
    isLevelEnabled(level) {
      const givenLevelValue = getLevelValue(this.levels, level)
      if (givenLevelValue === null) {
        return false
      }
      const configuredLevelValue = getLevelValue(this.levels, this.level)
      if (configuredLevelValue === null) {
        return false
      }
      if (!this.transports || this.transports.length === 0) {
        return configuredLevelValue >= givenLevelValue
      }
      const index = this.transports.findIndex((transport) => {
        let transportLevelValue = getLevelValue(this.levels, transport.level)
        if (transportLevelValue === null) {
          transportLevelValue = configuredLevelValue
        }
        return transportLevelValue >= givenLevelValue
      })
      return index !== -1
    }
    /* eslint-disable valid-jsdoc */
    /**
     * Ensure backwards compatibility with a `log` method
     * @param {mixed} level - Level the log message is written at.
     * @param {mixed} msg - TODO: add param description.
     * @param {mixed} meta - TODO: add param description.
     * @returns {Logger} - TODO: add return description.
     *
     * @example
     *    // Supports the existing API:
     *    logger.log('info', 'Hello world', { custom: true });
     *    logger.log('info', new Error('Yo, it\'s on fire'));
     *
     *    // Requires winston.format.splat()
     *    logger.log('info', '%s %d%%', 'A string', 50, { thisIsMeta: true });
     *
     *    // And the new API with a single JSON literal:
     *    logger.log({ level: 'info', message: 'Hello world', custom: true });
     *    logger.log({ level: 'info', message: new Error('Yo, it\'s on fire') });
     *
     *    // Also requires winston.format.splat()
     *    logger.log({
     *      level: 'info',
     *      message: '%s %d%%',
     *      [SPLAT]: ['A string', 50],
     *      meta: { thisIsMeta: true }
     *    });
     *
     */
    /* eslint-enable valid-jsdoc */
    log(level, msg, ...splat2) {
      if (arguments.length === 1) {
        level[LEVEL] = level.level
        this._addDefaultMeta(level)
        this.write(level)
        return this
      }
      if (arguments.length === 2) {
        if (msg && typeof msg === 'object') {
          msg[LEVEL] = msg.level = level
          this._addDefaultMeta(msg)
          this.write(msg)
          return this
        }
        msg = { [LEVEL]: level, level, message: msg }
        this._addDefaultMeta(msg)
        this.write(msg)
        return this
      }
      const [meta] = splat2
      if (typeof meta === 'object' && meta !== null) {
        const tokens = msg && msg.match && msg.match(formatRegExp)
        if (!tokens) {
          const info = Object.assign({}, this.defaultMeta, meta, {
            [LEVEL]: level,
            [SPLAT]: splat2,
            level,
            message: msg,
          })
          if (meta.message) info.message = `${info.message} ${meta.message}`
          if (meta.stack) info.stack = meta.stack
          if (meta.cause) info.cause = meta.cause
          this.write(info)
          return this
        }
      }
      this.write(
        Object.assign({}, this.defaultMeta, {
          [LEVEL]: level,
          [SPLAT]: splat2,
          level,
          message: msg,
        }),
      )
      return this
    }
    /**
     * Pushes data so that it can be picked up by all of our pipe targets.
     * @param {mixed} info - TODO: add param description.
     * @param {mixed} enc - TODO: add param description.
     * @param {mixed} callback - Continues stream processing.
     * @returns {undefined}
     * @private
     */
    _transform(info, enc, callback) {
      if (this.silent) {
        return callback()
      }
      if (!info[LEVEL]) {
        info[LEVEL] = info.level
      }
      if (!this.levels[info[LEVEL]] && this.levels[info[LEVEL]] !== 0) {
        console.error('[winston] Unknown logger level: %s', info[LEVEL])
      }
      if (!this._readableState.pipes) {
        console.error(
          '[winston] Attempt to write logs with no transports, which can increase memory usage: %j',
          info,
        )
      }
      try {
        this.push(this.format.transform(info, this.format.options))
      } finally {
        this._writableState.sync = false
        callback()
      }
    }
    /**
     * Delays the 'finish' event until all transport pipe targets have
     * also emitted 'finish' or are already finished.
     * @param {mixed} callback - Continues stream processing.
     */
    _final(callback) {
      const transports2 = this.transports.slice()
      asyncForEach(
        transports2,
        (transport, next) => {
          if (!transport || transport.finished) return setImmediate(next)
          transport.once('finish', next)
          transport.end()
        },
        callback,
      )
    }
    /**
     * Adds the transport to this logger instance by piping to it.
     * @param {mixed} transport - TODO: add param description.
     * @returns {Logger} - TODO: add return description.
     */
    add(transport) {
      const target =
        !isStream(transport) || transport.log.length > 2
          ? new LegacyTransportStream({ transport })
          : transport
      if (!target._writableState || !target._writableState.objectMode) {
        throw new Error('Transports must WritableStreams in objectMode. Set { objectMode: true }.')
      }
      this._onEvent('error', target)
      this._onEvent('warn', target)
      this.pipe(target)
      if (transport.handleExceptions) {
        this.exceptions.handle()
      }
      if (transport.handleRejections) {
        this.rejections.handle()
      }
      return this
    }
    /**
     * Removes the transport from this logger instance by unpiping from it.
     * @param {mixed} transport - TODO: add param description.
     * @returns {Logger} - TODO: add return description.
     */
    remove(transport) {
      if (!transport) return this
      let target = transport
      if (!isStream(transport) || transport.log.length > 2) {
        target = this.transports.filter((match) => match.transport === transport)[0]
      }
      if (target) {
        this.unpipe(target)
      }
      return this
    }
    /**
     * Removes all transports from this logger instance.
     * @returns {Logger} - TODO: add return description.
     */
    clear() {
      this.unpipe()
      return this
    }
    /**
     * Cleans up resources (streams, event listeners) for all transports
     * associated with this instance (if necessary).
     * @returns {Logger} - TODO: add return description.
     */
    close() {
      this.exceptions.unhandle()
      this.rejections.unhandle()
      this.clear()
      this.emit('close')
      return this
    }
    /**
     * Sets the `target` levels specified on this instance.
     * @param {Object} Target levels to use on this instance.
     */
    setLevels() {
      warn.deprecated('setLevels')
    }
    /**
     * Queries the all transports for this instance with the specified `options`.
     * This will aggregate each transport's results into one object containing
     * a property per transport.
     * @param {Object} options - Query options for this instance.
     * @param {function} callback - Continuation to respond to when complete.
     */
    query(options, callback) {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }
      options = options || {}
      const results = {}
      const queryObject = Object.assign({}, options.query || {})
      function queryTransport(transport, next) {
        if (options.query && typeof transport.formatQuery === 'function') {
          options.query = transport.formatQuery(queryObject)
        }
        transport.query(options, (err2, res) => {
          if (err2) {
            return next(err2)
          }
          if (typeof transport.formatResults === 'function') {
            res = transport.formatResults(res, options.format)
          }
          next(null, res)
        })
      }
      function addResults(transport, next) {
        queryTransport(transport, (err2, result) => {
          if (next) {
            result = err2 || result
            if (result) {
              results[transport.name] = result
            }
            next()
          }
          next = null
        })
      }
      asyncForEach(
        this.transports.filter((transport) => !!transport.query),
        addResults,
        () => callback(null, results),
      )
    }
    /**
     * Returns a log stream for all transports. Options object is optional.
     * @param{Object} options={} - Stream options for this instance.
     * @returns {Stream} - TODO: add return description.
     */
    stream(options = {}) {
      const out = new Stream()
      const streams = []
      out._streams = streams
      out.destroy = () => {
        let i = streams.length
        while (i--) {
          streams[i].destroy()
        }
      }
      this.transports
        .filter((transport) => !!transport.stream)
        .forEach((transport) => {
          const str = transport.stream(options)
          if (!str) {
            return
          }
          streams.push(str)
          str.on('log', (log) => {
            log.transport = log.transport || []
            log.transport.push(transport.name)
            out.emit('log', log)
          })
          str.on('error', (err2) => {
            err2.transport = err2.transport || []
            err2.transport.push(transport.name)
            out.emit('error', err2)
          })
        })
      return out
    }
    /**
     * Returns an object corresponding to a specific timing. When done is called
     * the timer will finish and log the duration. e.g.:
     * @returns {Profile} - TODO: add return description.
     * @example
     *    const timer = winston.startTimer()
     *    setTimeout(() => {
     *      timer.done({
     *        message: 'Logging message'
     *      });
     *    }, 1000);
     */
    startTimer() {
      return new Profiler(this)
    }
    /**
     * Tracks the time inbetween subsequent calls to this method with the same
     * `id` parameter. The second call to this method will log the difference in
     * milliseconds along with the message.
     * @param {string} id Unique id of the profiler
     * @returns {Logger} - TODO: add return description.
     */
    profile(id, ...args) {
      const time = Date.now()
      if (this.profilers[id]) {
        const timeEnd = this.profilers[id]
        delete this.profilers[id]
        if (typeof args[args.length - 2] === 'function') {
          console.warn('Callback function no longer supported as of winston@3.0.0')
          args.pop()
        }
        const info = typeof args[args.length - 1] === 'object' ? args.pop() : {}
        info.level = info.level || 'info'
        info.durationMs = time - timeEnd
        info.message = info.message || id
        return this.write(info)
      }
      this.profilers[id] = time
      return this
    }
    /**
     * Backwards compatibility to `exceptions.handle` in winston < 3.0.0.
     * @returns {undefined}
     * @deprecated
     */
    handleExceptions(...args) {
      console.warn(
        'Deprecated: .handleExceptions() will be removed in winston@4. Use .exceptions.handle()',
      )
      this.exceptions.handle(...args)
    }
    /**
     * Backwards compatibility to `exceptions.handle` in winston < 3.0.0.
     * @returns {undefined}
     * @deprecated
     */
    unhandleExceptions(...args) {
      console.warn(
        'Deprecated: .unhandleExceptions() will be removed in winston@4. Use .exceptions.unhandle()',
      )
      this.exceptions.unhandle(...args)
    }
    /**
     * Throw a more meaningful deprecation notice
     * @throws {Error} - TODO: add throws description.
     */
    cli() {
      throw new Error(
        [
          'Logger.cli() was removed in winston@3.0.0',
          'Use a custom winston.formats.cli() instead.',
          'See: https://github.com/winstonjs/winston/tree/master/UPGRADE-3.0.md',
        ].join('\n'),
      )
    }
    /**
     * Bubbles the `event` that occured on the specified `transport` up
     * from this instance.
     * @param {string} event - The event that occured
     * @param {Object} transport - Transport on which the event occured
     * @private
     */
    _onEvent(event, transport) {
      function transportEvent(err2) {
        if (event === 'error' && !this.transports.includes(transport)) {
          this.add(transport)
        }
        this.emit(event, err2, transport)
      }
      if (!transport['__winston' + event]) {
        transport['__winston' + event] = transportEvent.bind(this)
        transport.on(event, transport['__winston' + event])
      }
    }
    _addDefaultMeta(msg) {
      if (this.defaultMeta) {
        Object.assign(msg, this.defaultMeta)
      }
    }
  }
  function getLevelValue(levels2, level) {
    const value = levels2[level]
    if (!value && value !== 0) {
      return null
    }
    return value
  }
  Object.defineProperty(Logger.prototype, 'transports', {
    configurable: false,
    enumerable: true,
    get() {
      const { pipes } = this._readableState
      return !Array.isArray(pipes) ? [pipes].filter(Boolean) : pipes
    },
  })
  logger$1 = Logger
  return logger$1
}
var createLogger
var hasRequiredCreateLogger
function requireCreateLogger() {
  if (hasRequiredCreateLogger) return createLogger
  hasRequiredCreateLogger = 1
  const { LEVEL } = requireTripleBeam()
  const config2 = requireConfig()
  const Logger = requireLogger()
  const debug = requireNode()('winston:create-logger')
  function isLevelEnabledFunctionName(level) {
    return 'is' + level.charAt(0).toUpperCase() + level.slice(1) + 'Enabled'
  }
  createLogger = function (opts = {}) {
    opts.levels = opts.levels || config2.npm.levels
    class DerivedLogger extends Logger {
      /**
       * Create a new class derived logger for which the levels can be attached to
       * the prototype of. This is a V8 optimization that is well know to increase
       * performance of prototype functions.
       * @param {!Object} options - Options for the created logger.
       */
      constructor(options) {
        super(options)
      }
    }
    const logger2 = new DerivedLogger(opts)
    Object.keys(opts.levels).forEach(function (level) {
      debug('Define prototype method for "%s"', level)
      if (level === 'log') {
        console.warn(
          'Level "log" not defined: conflicts with the method "log". Use a different level name.',
        )
        return
      }
      DerivedLogger.prototype[level] = function (...args) {
        const self2 = this || logger2
        if (args.length === 1) {
          const [msg] = args
          const info = (msg && msg.message && msg) || { message: msg }
          info.level = info[LEVEL] = level
          self2._addDefaultMeta(info)
          self2.write(info)
          return this || logger2
        }
        if (args.length === 0) {
          self2.log(level, '')
          return self2
        }
        return self2.log(level, ...args)
      }
      DerivedLogger.prototype[isLevelEnabledFunctionName(level)] = function () {
        return (this || logger2).isLevelEnabled(level)
      }
    })
    return logger2
  }
  return createLogger
}
var container
var hasRequiredContainer
function requireContainer() {
  if (hasRequiredContainer) return container
  hasRequiredContainer = 1
  const createLogger2 = requireCreateLogger()
  container = class Container {
    /**
     * Constructor function for the Container object responsible for managing a
     * set of `winston.Logger` instances based on string ids.
     * @param {!Object} [options={}] - Default pass-thru options for Loggers.
     */
    constructor(options = {}) {
      this.loggers = /* @__PURE__ */ new Map()
      this.options = options
    }
    /**
     * Retrieves a `winston.Logger` instance for the specified `id`. If an
     * instance does not exist, one is created.
     * @param {!string} id - The id of the Logger to get.
     * @param {?Object} [options] - Options for the Logger instance.
     * @returns {Logger} - A configured Logger instance with a specified id.
     */
    add(id, options) {
      if (!this.loggers.has(id)) {
        options = Object.assign({}, options || this.options)
        const existing = options.transports || this.options.transports
        if (existing) {
          options.transports = Array.isArray(existing) ? existing.slice() : [existing]
        } else {
          options.transports = []
        }
        const logger2 = createLogger2(options)
        logger2.on('close', () => this._delete(id))
        this.loggers.set(id, logger2)
      }
      return this.loggers.get(id)
    }
    /**
     * Retreives a `winston.Logger` instance for the specified `id`. If
     * an instance does not exist, one is created.
     * @param {!string} id - The id of the Logger to get.
     * @param {?Object} [options] - Options for the Logger instance.
     * @returns {Logger} - A configured Logger instance with a specified id.
     */
    get(id, options) {
      return this.add(id, options)
    }
    /**
     * Check if the container has a logger with the id.
     * @param {?string} id - The id of the Logger instance to find.
     * @returns {boolean} - Boolean value indicating if this instance has a
     * logger with the specified `id`.
     */
    has(id) {
      return !!this.loggers.has(id)
    }
    /**
     * Closes a `Logger` instance with the specified `id` if it exists.
     * If no `id` is supplied then all Loggers are closed.
     * @param {?string} id - The id of the Logger instance to close.
     * @returns {undefined}
     */
    close(id) {
      if (id) {
        return this._removeLogger(id)
      }
      this.loggers.forEach((val, key) => this._removeLogger(key))
    }
    /**
     * Remove a logger based on the id.
     * @param {!string} id - The id of the logger to remove.
     * @returns {undefined}
     * @private
     */
    _removeLogger(id) {
      if (!this.loggers.has(id)) {
        return
      }
      const logger2 = this.loggers.get(id)
      logger2.close()
      this._delete(id)
    }
    /**
     * Deletes a `Logger` instance with the specified `id`.
     * @param {!string} id - The id of the Logger instance to delete from
     * container.
     * @returns {undefined}
     * @private
     */
    _delete(id) {
      this.loggers.delete(id)
    }
  }
  return container
}
var hasRequiredWinston
function requireWinston() {
  if (hasRequiredWinston) return winston$1
  hasRequiredWinston = 1
  ;(function (exports) {
    const logform2 = requireLogform()
    const { warn } = requireCommon()
    exports.version = require$$2.version
    exports.transports = requireTransports()
    exports.config = requireConfig()
    exports.addColors = logform2.levels
    exports.format = logform2.format
    exports.createLogger = requireCreateLogger()
    exports.Logger = requireLogger()
    exports.ExceptionHandler = requireExceptionHandler()
    exports.RejectionHandler = requireRejectionHandler()
    exports.Container = requireContainer()
    exports.Transport = requireWinstonTransport()
    exports.loggers = new exports.Container()
    const defaultLogger = exports.createLogger()
    Object.keys(exports.config.npm.levels)
      .concat([
        'log',
        'query',
        'stream',
        'add',
        'remove',
        'clear',
        'profile',
        'startTimer',
        'handleExceptions',
        'unhandleExceptions',
        'handleRejections',
        'unhandleRejections',
        'configure',
        'child',
      ])
      .forEach((method) => (exports[method] = (...args) => defaultLogger[method](...args)))
    Object.defineProperty(exports, 'level', {
      get() {
        return defaultLogger.level
      },
      set(val) {
        defaultLogger.level = val
      },
    })
    Object.defineProperty(exports, 'exceptions', {
      get() {
        return defaultLogger.exceptions
      },
    })
    Object.defineProperty(exports, 'rejections', {
      get() {
        return defaultLogger.rejections
      },
    })
    ;['exitOnError'].forEach((prop) => {
      Object.defineProperty(exports, prop, {
        get() {
          return defaultLogger[prop]
        },
        set(val) {
          defaultLogger[prop] = val
        },
      })
    })
    Object.defineProperty(exports, 'default', {
      get() {
        return {
          exceptionHandlers: defaultLogger.exceptionHandlers,
          rejectionHandlers: defaultLogger.rejectionHandlers,
          transports: defaultLogger.transports,
        }
      },
    })
    warn.deprecated(exports, 'setLevels')
    warn.forFunctions(exports, 'useFormat', ['cli'])
    warn.forProperties(exports, 'useFormat', ['padLevels', 'stripColors'])
    warn.forFunctions(exports, 'deprecated', ['addRewriter', 'addFilter', 'clone', 'extend'])
    warn.forProperties(exports, 'deprecated', ['emitErrs', 'levelLength'])
  })(winston$1)
  return winston$1
}
var winstonExports = requireWinston()
const winston = /* @__PURE__ */ getDefaultExportFromCjs(winstonExports)
let logger = null
function initLogger(userDataPath) {
  if (logger) return logger
  const logDir = path.join(userDataPath, 'logs')
  if (!fs__default.existsSync(logDir)) {
    fs__default.mkdirSync(logDir, { recursive: true })
  }
  logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
      }),
    ],
  })
  return logger
}
function getLogger() {
  if (!logger) {
    return winston.createLogger({
      transports: [new winston.transports.Console()],
    })
  }
  return logger
}
const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db2) => {
      db2.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS downloads (
          id TEXT PRIMARY KEY NOT NULL,
          url TEXT NOT NULL,
          title TEXT,
          status TEXT NOT NULL DEFAULT 'waiting',
          progress REAL NOT NULL DEFAULT 0,
          speed TEXT,
          eta TEXT,
          fileSize TEXT,
          outputPath TEXT,
          error TEXT,
          priority INTEGER NOT NULL DEFAULT 5,
          createdAt TEXT NOT NULL,
          completedAt TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
        CREATE INDEX IF NOT EXISTS idx_downloads_priority ON downloads(priority, createdAt);
        CREATE INDEX IF NOT EXISTS idx_downloads_createdAt ON downloads(createdAt);

        CREATE TABLE IF NOT EXISTS download_history (
          id TEXT PRIMARY KEY NOT NULL,
          url TEXT NOT NULL,
          title TEXT,
          status TEXT NOT NULL,
          fileSize TEXT,
          outputPath TEXT,
          error TEXT,
          createdAt TEXT NOT NULL,
          completedAt TEXT,
          archivedAt TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_history_completedAt ON download_history(completedAt);
        CREATE INDEX IF NOT EXISTS idx_history_status ON download_history(status);
        CREATE INDEX IF NOT EXISTS idx_history_archivedAt ON download_history(archivedAt);
      `)
    },
  },
  // Future migrations go here (append only, e.g. v2 add_plugin_tables, etc.)
]
function runMigrations(db2) {
  db2.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      appliedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  const currentVersionRow = db2.prepare('SELECT MAX(version) as version FROM migrations').get()
  const currentVersion = currentVersionRow?.version ?? 0
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      getLogger().info(`Applying migration ${migration.version}: ${migration.name}`)
      const apply = db2.transaction(() => {
        migration.up(db2)
        db2.prepare('INSERT INTO migrations (version) VALUES (?)').run(migration.version)
      })
      apply()
      getLogger().info(`Migration ${migration.version} applied successfully`)
    }
  }
}
function integrityCheck(db2) {
  const row = db2.prepare('PRAGMA integrity_check').get()
  return row?.integrity_check === 'ok'
}
const BACKUP_RETENTION = 5
const BACKUP_DIRNAME = 'backups'
const BACKUP_PATTERN = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})-(\d{3}Z)\.db$/
function timestampForBackup(date = /* @__PURE__ */ new Date()) {
  const iso = date.toISOString()
  return iso.slice(0, 19).replace(/:/g, '-') + '-' + iso.slice(20, 23)
}
function backupDirFor(dbPath) {
  return path.join(path.dirname(dbPath), BACKUP_DIRNAME)
}
function backupFilePath(dbPath, timestamp2) {
  return path.join(backupDirFor(dbPath), `${timestamp2}.db`)
}
function writeStartupBackup(dbPath, now = /* @__PURE__ */ new Date()) {
  if (!fs__default.existsSync(dbPath)) {
    throw new Error(`Cannot back up non-existent file: ${dbPath}`)
  }
  const dir = backupDirFor(dbPath)
  if (!fs__default.existsSync(dir)) {
    fs__default.mkdirSync(dir, { recursive: true })
  }
  const ts = timestampForBackup(now)
  const target = backupFilePath(dbPath, ts)
  fs__default.copyFileSync(dbPath, target)
  rotateBackups(dbPath)
  return target
}
function rotateBackups(dbPath) {
  const dir = backupDirFor(dbPath)
  if (!fs__default.existsSync(dir)) return
  const entries = fs__default
    .readdirSync(dir)
    .filter((name) => BACKUP_PATTERN.test(name))
    .sort()
    .reverse()
  const toDelete = entries.slice(BACKUP_RETENTION)
  for (const old of toDelete) {
    try {
      fs__default.unlinkSync(path.join(dir, old))
    } catch {}
  }
}
let db = null
let dbFilePath = null
const DB_FILENAME = 'ytdlp.db'
function getDbFilePath(userDataPath) {
  return path.join(userDataPath, 'db', DB_FILENAME)
}
function initDatabase(userDataPath) {
  if (db) return db
  const dbDir = path.join(userDataPath, 'db')
  if (!fs__default.existsSync(dbDir)) {
    fs__default.mkdirSync(dbDir, { recursive: true })
  }
  dbFilePath = getDbFilePath(userDataPath)
  if (fs__default.existsSync(dbFilePath)) {
    try {
      writeStartupBackup(dbFilePath)
    } catch (err2) {
      getLogger().warn(`Startup backup skipped: ${err2.message}`)
    }
  }
  db = new Database(dbFilePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')
  runMigrations(db)
  if (!integrityCheck(db)) {
    throw new Error(
      'Database integrity check failed. The database may be corrupted. A backup has been written next to the original file.',
    )
  }
  getLogger().info(`Database initialized at ${dbFilePath}`)
  return db
}
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.')
  }
  return db
}
function applyCSP() {
  const hasDevServer = process.env.VITE_DEV_SERVER_URL != null
  const scriptSrc = hasDevServer
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
    : "script-src 'self'; "
  const connectSrc = hasDevServer
    ? "connect-src 'self' ws://localhost:* http://localhost:*; "
    : "connect-src 'self'; "
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
            scriptSrc +
            "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; " +
            connectSrc +
            "font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        ],
      },
    })
  })
}
const DEFAULT_STATE = {
  width: 1400,
  height: 900,
  isMaximized: false,
  isFullScreen: false,
}
let statePath = null
function initWindowState(userDataPath) {
  statePath = path.join(userDataPath, 'window-state.json')
}
function load() {
  if (!statePath) return { ...DEFAULT_STATE }
  try {
    if (fs__default.existsSync(statePath)) {
      const raw = fs__default.readFileSync(statePath, 'utf-8')
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_STATE,
        ...parsed,
      }
    }
  } catch (err2) {
    getLogger().warn(`Failed to load window state: ${err2.message}`)
  }
  return { ...DEFAULT_STATE }
}
function save(state2) {
  if (!statePath) return
  try {
    const toSave = { ...state2 }
    if (toSave.isMaximized || toSave.isFullScreen) {
      const prev = load()
      toSave.width = prev.width
      toSave.height = prev.height
    }
    fs__default.writeFileSync(statePath, JSON.stringify(toSave, null, 2), 'utf-8')
  } catch (err2) {
    getLogger().warn(`Failed to save window state: ${err2.message}`)
  }
}
function getWindowState() {
  const state2 = load()
  try {
    const displays = screen.getAllDisplays()
    const allBounds = displays.map((d) => d.bounds)
    const windowBounds = {
      x: state2.x ?? 100,
      y: state2.y ?? 100,
      width: state2.width,
      height: state2.height,
    }
    const isVisible = allBounds.some((displayBounds) => {
      const overlapX = Math.max(
        0,
        Math.min(windowBounds.x + windowBounds.width, displayBounds.x + displayBounds.width) -
          Math.max(windowBounds.x, displayBounds.x),
      )
      const overlapY = Math.max(
        0,
        Math.min(windowBounds.y + windowBounds.height, displayBounds.y + displayBounds.height) -
          Math.max(windowBounds.y, displayBounds.y),
      )
      return overlapX > 100 && overlapY > 100
    })
    if (!isVisible) {
      return { ...DEFAULT_STATE }
    }
    return state2
  } catch {
    return state2
  }
}
function saveWindowState(state2) {
  save(state2)
}
const FORGEDL_DIR = 'FORGEDL'
const VIDEO_DIR = 'VIDEO'
const AUDIO_DIR = 'AUDIO'
let downloadBasePath = null
function setDownloadBasePath(basePath) {
  downloadBasePath = basePath
}
function defaultDownloadsDir() {
  if (downloadBasePath) return downloadBasePath
  return path.join(os.homedir(), 'Downloads')
}
const AUDIO_ONLY_FORMATS = ['bestaudio', 'worstaudio', 'ba', 'wa']
function isAudioDownload(settings) {
  if (settings.extractAudio) return true
  const fmt = settings.outputFormat || ''
  return AUDIO_ONLY_FORMATS.includes(fmt)
}
function ensureDir(dir) {
  if (!fs__default.existsSync(dir)) {
    fs__default.mkdirSync(dir, { recursive: true })
    getLogger().info(`Created directory: ${dir}`)
  }
}
function resolveForgedlBase(downloadPath) {
  if (!downloadPath) {
    return path.join(defaultDownloadsDir(), FORGEDL_DIR)
  }
  return path.join(downloadPath, FORGEDL_DIR)
}
function resolveDownloadDir(settings) {
  const base = resolveForgedlBase(settings.downloadPath)
  const sub = isAudioDownload(settings) ? AUDIO_DIR : VIDEO_DIR
  const target = path.join(base, sub)
  ensureDir(target)
  return target
}
const ok = (data) => ({ ok: true, data })
const err = (code, message, details) => ({
  ok: false,
  error: details === void 0 ? { code, message } : { code, message, details },
})
class BaseRepository {
  constructor(db2) {
    this.db = db2
  }
  db
  /**
   * Runs `fn` inside a single SQLite transaction (synchronous in
   * better-sqlite3). The closure executes serially; returns whatever
   * the closure returns. Any thrown error rolls back and is converted
   * to a Result.
   */
  transaction(fn) {
    const runner = this.db.transaction(fn)
    try {
      return ok(runner())
    } catch (e) {
      return err('DB_ERROR', e.message ?? String(e))
    }
  }
}
const isDownloadStatus = (s) => {
  const known = [
    'waiting',
    'fetching_metadata',
    'preparing',
    'downloading',
    'merging',
    'embedding',
    'verifying',
    'completed',
    'error',
    'paused',
    'cancelled',
  ]
  return known.includes(s)
}
const toItem = (row) => ({
  id: row.id,
  url: row.url,
  title: row.title ?? void 0,
  status: isDownloadStatus(row.status) ? row.status : 'waiting',
  progress: row.progress ?? 0,
  speed: row.speed ?? void 0,
  eta: row.eta ?? void 0,
  fileSize: row.fileSize ?? void 0,
  outputPath: row.outputPath ?? void 0,
  error: row.error ?? void 0,
  priority: row.priority ?? 5,
  createdAt: row.createdAt,
  completedAt: row.completedAt ?? void 0,
})
const toQueueStats = (row) => ({
  total: row.total ?? 0,
  downloading: row.downloading ?? 0,
  waiting: row.waiting ?? 0,
  completed: row.completed ?? 0,
  failed: row.failed ?? 0,
})
class QueueRepository extends BaseRepository {
  // Prepared statements are cached as instance fields so they're built
  // once on construction, not on every call.
  stmts = {
    insert: this.db.prepare(`
      INSERT INTO downloads (id, url, status, progress, priority, createdAt, title)
      VALUES (@id, @url, 'waiting', 0, @priority, @createdAt, @title)
    `),
    updateTitle: this.db.prepare(`
      UPDATE downloads SET title = ? WHERE id = ?
    `),
    updateStatus: this.db.prepare(`
      UPDATE downloads SET status = ?, completedAt = ? WHERE id = ?
    `),
    updateStatusError: this.db.prepare(`
      UPDATE downloads SET status = ?, error = ? WHERE id = ?
    `),
    updateProgress: this.db.prepare(`
      UPDATE downloads SET progress = ?, speed = ?, eta = ?, fileSize = ? WHERE id = ?
    `),
    resetForRetry: this.db.prepare(`
      UPDATE downloads
      SET status = 'waiting', progress = 0, error = NULL, completedAt = NULL
      WHERE id = ?
    `),
    resetStaleDownloading: this.db.prepare(`
      UPDATE downloads SET status = 'waiting' WHERE status = 'downloading'
    `),
    resetStaleRetrying: this.db.prepare(`
      UPDATE downloads SET status = 'waiting', error = NULL WHERE status = 'retrying'
    `),
    deleteByIds: this.db.prepare(`
      DELETE FROM downloads WHERE id IN (SELECT value FROM json_each(?))
    `),
    deleteWhereStatusIn: this.db.prepare(`
      DELETE FROM downloads WHERE status IN ('completed', 'error', 'cancelled')
    `),
    findById: this.db.prepare(`SELECT * FROM downloads WHERE id = ?`),
    findAll: this.db.prepare(`
      SELECT * FROM downloads ORDER BY createdAt DESC
    `),
    findWaitingOrdered: this.db.prepare(`
      SELECT * FROM downloads
      WHERE status = 'waiting'
      ORDER BY (
        priority +
        MIN(9, CAST(
          (julianday('now') - julianday(createdAt)) * 1440.0 / 10.0
        AS INTEGER))
      ) DESC, createdAt ASC
      LIMIT ?
    `),
    countStats: this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'downloading' THEN 1 ELSE 0 END) as downloading,
        SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
      FROM downloads
    `),
    updatePriority: this.db.prepare(`
      UPDATE downloads SET priority = ? WHERE id = ?
    `),
  }
  create(input, createdAt) {
    this.stmts.insert.run({
      id: input.id,
      url: input.url,
      priority: input.priority,
      createdAt,
      title: input.title ?? null,
    })
  }
  updateTitle(id, title) {
    this.stmts.updateTitle.run(title ?? null, id)
  }
  updatePriority(id, priority) {
    this.stmts.updatePriority.run(priority, id)
  }
  updateStatus(id, status, completedAt) {
    this.stmts.updateStatus.run(status, completedAt ?? null, id)
  }
  updateStatusWithError(id, status, error) {
    this.stmts.updateStatusError.run(status, error, id)
  }
  updateProgress(id, progress, speed, eta, fileSize) {
    this.stmts.updateProgress.run(progress, speed ?? null, eta ?? null, fileSize ?? null, id)
  }
  resetForRetry(id) {
    this.stmts.resetForRetry.run(id)
  }
  resetStaleDownloading() {
    const r = this.stmts.resetStaleDownloading.run()
    return r.changes
  }
  resetStaleRetrying() {
    const r = this.stmts.resetStaleRetrying.run()
    return r.changes
  }
  deleteByIds(ids) {
    if (ids.length === 0) return 0
    const r = this.stmts.deleteByIds.run(JSON.stringify(ids))
    return r.changes
  }
  deleteFinished() {
    const r = this.stmts.deleteWhereStatusIn.run()
    return r.changes
  }
  findById(id) {
    const row = this.stmts.findById.get(id)
    return row ? toItem(row) : null
  }
  findAll() {
    const rows = this.stmts.findAll.all()
    return rows.map(toItem)
  }
  findWaitingOrdered(limit) {
    const rows = this.stmts.findWaitingOrdered.all(limit)
    return rows.map(toItem)
  }
  countStats() {
    const row = this.stmts.countStats.get()
    return toQueueStats(row)
  }
}
class HistoryRepository extends BaseRepository {
  stmts = {
    archiveOne: this.db.prepare(`
      INSERT OR IGNORE INTO download_history
        (id, url, title, status, fileSize, outputPath, error, createdAt, completedAt)
      VALUES (@id, @url, @title, @status, @fileSize, @outputPath, @error, @createdAt, @completedAt)
    `),
    findAll: this.db.prepare(`
      SELECT * FROM download_history ORDER BY archivedAt DESC LIMIT ?
    `),
    findById: this.db.prepare(`
      SELECT * FROM download_history WHERE id = ?
    `),
    deleteByIds: this.db.prepare(`
      DELETE FROM download_history WHERE id IN (SELECT value FROM json_each(?))
    `),
    deleteOlderThan: this.db.prepare(`
      DELETE FROM download_history WHERE archivedAt < ?
    `),
    countAll: this.db.prepare(`SELECT COUNT(*) as n FROM download_history`),
  }
  archive(row) {
    this.stmts.archiveOne.run({
      id: row.id,
      url: row.url,
      title: row.title ?? null,
      status: isDownloadStatus(row.status) ? row.status : 'completed',
      fileSize: row.fileSize ?? null,
      outputPath: row.outputPath ?? null,
      error: row.error ?? null,
      createdAt: row.createdAt,
      completedAt: row.completedAt ?? null,
    })
  }
  archiveBatch(rows) {
    for (const r of rows) this.archive(r)
  }
  findAll(limit = 500) {
    const rows = this.stmts.findAll.all(limit)
    return rows.map(toItem)
  }
  findById(id) {
    const row = this.stmts.findById.get(id)
    return row ? toItem(row) : null
  }
  deleteByIds(ids) {
    if (ids.length === 0) return 0
    return this.stmts.deleteByIds.run(JSON.stringify(ids)).changes
  }
  deleteOlderThan(isoDate) {
    return this.stmts.deleteOlderThan.run(isoDate).changes
  }
  count() {
    const row = this.stmts.countAll.get()
    return row?.n ?? 0
  }
}
class SettingsRepository extends BaseRepository {
  stmts = {
    selectAll: this.db.prepare(`SELECT key, value FROM settings`),
    selectByKey: this.db.prepare(`SELECT value FROM settings WHERE key = ?`),
    upsert: this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `),
    deleteKey: this.db.prepare(`DELETE FROM settings WHERE key = ?`),
    deleteAll: this.db.prepare(`DELETE FROM settings`),
  }
  loadAll() {
    const rows = this.stmts.selectAll.all()
    const out = {}
    for (const { key, value } of rows) {
      try {
        out[key] = JSON.parse(value)
      } catch {
        out[key] = value
      }
    }
    return out
  }
  /** Replaces all settings atomically from a plain-object map. */
  replaceAll(values) {
    const runner = this.db.transaction(() => {
      this.stmts.deleteAll.run()
      for (const [key, value] of Object.entries(values)) {
        this.stmts.upsert.run(key, JSON.stringify(value))
      }
    })
    runner()
  }
  /** Patches a subset of keys atomically. */
  patch(values) {
    const runner = this.db.transaction(() => {
      for (const [key, value] of Object.entries(values)) {
        this.stmts.upsert.run(key, JSON.stringify(value))
      }
    })
    runner()
  }
  reset() {
    this.stmts.deleteAll.run()
  }
  /** Read a single JSON value by key. Returns null if not found. */
  getJson(key) {
    const row = this.stmts.selectByKey.get(key)
    if (!row) return null
    try {
      return JSON.parse(row.value)
    } catch {
      return null
    }
  }
  /** Store a JSON value under a single key. */
  setJson(key, value) {
    this.stmts.upsert.run(key, JSON.stringify(value))
  }
}
let cached$1 = null
let createDatabase = () => null
function bindDatabaseAccessor(fn) {
  createDatabase = fn
  cached$1 = null
}
function getRepositories() {
  if (cached$1) return cached$1
  const db2 = createDatabase()
  if (!db2) {
    throw new Error(
      'Repositories requested before database was initialized. Call initDatabase() in app.whenReady() before any service.',
    )
  }
  cached$1 = {
    queue: new QueueRepository(db2),
    history: new HistoryRepository(db2),
    settings: new SettingsRepository(db2),
  }
  return cached$1
}
function resetRepositories() {
  cached$1 = null
}
const IPC_CHANNELS = {
  // Download operations
  DOWNLOAD_ADD: 'download:add',
  DOWNLOAD_ADD_BATCH: 'download:addBatch',
  DOWNLOAD_PAUSE: 'download:pause',
  DOWNLOAD_RESUME: 'download:resume',
  DOWNLOAD_CANCEL: 'download:cancel',
  DOWNLOAD_REMOVE: 'download:remove',
  DOWNLOAD_RETRY: 'download:retry',
  DOWNLOAD_CLEAR_COMPLETED: 'download:clearCompleted',
  DOWNLOAD_REORDER: 'download:reorder',
  DOWNLOAD_REORDER_TO_POSITION: 'download:reorderToPosition',
  DOWNLOAD_SET_SPEED_LIMIT: 'download:setSpeedLimit',
  DOWNLOAD_GET_EXTRA_FLAGS: 'download:getExtraFlags',
  DOWNLOAD_UPDATE_EXTRA_FLAGS: 'download:updateExtraFlags',
  DOWNLOAD_GET_ALL: 'download:getAll',
  DOWNLOAD_GET: 'download:get',
  DOWNLOAD_GET_QUEUE_STATS: 'download:getQueueStats',
  DOWNLOAD_ESTIMATE_BATCH_SIZE: 'download:estimateBatchSize',
  DOWNLOAD_FETCH_METADATA: 'download:fetchMetadata',
  DOWNLOAD_FETCH_PLAYLIST: 'download:fetchPlaylist',
  // History
  HISTORY_GET_ALL: 'history:getAll',
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_RESET: 'settings:reset',
  SETTINGS_EXPORT: 'settings:export',
  SETTINGS_IMPORT: 'settings:import',
  SETTINGS_GET_PRESETS: 'settings:getPresets',
  SETTINGS_SAVE_PRESETS: 'settings:savePresets',
  // System
  SYSTEM_YTDLP_VERSION: 'system:ytdlpVersion',
  SYSTEM_FFMPEG_VERSION: 'system:ffmpegVersion',
  SYSTEM_CHECK_BINARY_HEALTH: 'system:checkBinaryHealth',
  SYSTEM_OPEN_FOLDER: 'system:openFolder',
  SYSTEM_SHOW_IN_FOLDER: 'system:showInFolder',
  SYSTEM_GET_INFO: 'system:getSystemInfo',
  SYSTEM_GET_DISK_SPACE: 'system:getDiskSpace',
  SYSTEM_GET_PLATFORM: 'system:getPlatform',
  SYSTEM_GET_FORGEDL_BASE_PATH: 'system:getForgedlBasePath',
  SYSTEM_CHECK_YTDLP_UPDATE: 'system:checkYtDlpUpdate',
  SYSTEM_REBUILD_YTDLP: 'system:rebuildYtDlp',
  SYSTEM_REBUILD_FFMPEG: 'system:rebuildFfmpeg',
  SYSTEM_RUN_POST: 'system:runPost',
  // Dialog
  DIALOG_OPEN_DIRECTORY: 'dialog:openDirectory',
}
const STARTUP_HEALTH_CHANNEL = 'startup:health'
const PROGRESS_CHANNEL_PREFIX = 'download:progress:'
const buildProgressChannel = (id) => `${PROGRESS_CHANNEL_PREFIX}${id}`
const LOG_CHANNEL_PREFIX = 'download:log:'
const buildLogChannel = (id) => `${LOG_CHANNEL_PREFIX}${id}`
var util
;(function (util2) {
  util2.assertEqual = (_) => {}
  function assertIs(_arg) {}
  util2.assertIs = assertIs
  function assertNever(_x) {
    throw new Error()
  }
  util2.assertNever = assertNever
  util2.arrayToEnum = (items) => {
    const obj = {}
    for (const item of items) {
      obj[item] = item
    }
    return obj
  }
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== 'number')
    const filtered = {}
    for (const k of validKeys) {
      filtered[k] = obj[k]
    }
    return util2.objectValues(filtered)
  }
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function (e) {
      return obj[e]
    })
  }
  util2.objectKeys =
    typeof Object.keys === 'function'
      ? (obj) => Object.keys(obj)
      : (object) => {
          const keys = []
          for (const key in object) {
            if (Object.prototype.hasOwnProperty.call(object, key)) {
              keys.push(key)
            }
          }
          return keys
        }
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item)) return item
    }
    return void 0
  }
  util2.isInteger =
    typeof Number.isInteger === 'function'
      ? (val) => Number.isInteger(val)
      : (val) => typeof val === 'number' && Number.isFinite(val) && Math.floor(val) === val
  function joinValues(array, separator = ' | ') {
    return array.map((val) => (typeof val === 'string' ? `'${val}'` : val)).join(separator)
  }
  util2.joinValues = joinValues
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value
  }
})(util || (util = {}))
var objectUtil
;(function (objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second,
      // second overwrites first
    }
  }
})(objectUtil || (objectUtil = {}))
const ZodParsedType = util.arrayToEnum([
  'string',
  'nan',
  'number',
  'integer',
  'float',
  'boolean',
  'date',
  'bigint',
  'symbol',
  'function',
  'undefined',
  'null',
  'array',
  'object',
  'unknown',
  'promise',
  'void',
  'never',
  'map',
  'set',
])
const getParsedType = (data) => {
  const t = typeof data
  switch (t) {
    case 'undefined':
      return ZodParsedType.undefined
    case 'string':
      return ZodParsedType.string
    case 'number':
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number
    case 'boolean':
      return ZodParsedType.boolean
    case 'function':
      return ZodParsedType.function
    case 'bigint':
      return ZodParsedType.bigint
    case 'symbol':
      return ZodParsedType.symbol
    case 'object':
      if (Array.isArray(data)) {
        return ZodParsedType.array
      }
      if (data === null) {
        return ZodParsedType.null
      }
      if (
        data.then &&
        typeof data.then === 'function' &&
        data.catch &&
        typeof data.catch === 'function'
      ) {
        return ZodParsedType.promise
      }
      if (typeof Map !== 'undefined' && data instanceof Map) {
        return ZodParsedType.map
      }
      if (typeof Set !== 'undefined' && data instanceof Set) {
        return ZodParsedType.set
      }
      if (typeof Date !== 'undefined' && data instanceof Date) {
        return ZodParsedType.date
      }
      return ZodParsedType.object
    default:
      return ZodParsedType.unknown
  }
}
const ZodIssueCode = util.arrayToEnum([
  'invalid_type',
  'invalid_literal',
  'custom',
  'invalid_union',
  'invalid_union_discriminator',
  'invalid_enum_value',
  'unrecognized_keys',
  'invalid_arguments',
  'invalid_return_type',
  'invalid_date',
  'invalid_string',
  'too_small',
  'too_big',
  'invalid_intersection_types',
  'not_multiple_of',
  'not_finite',
])
class ZodError extends Error {
  get errors() {
    return this.issues
  }
  constructor(issues) {
    super()
    this.issues = []
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub]
    }
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs]
    }
    const actualProto = new.target.prototype
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto)
    } else {
      this.__proto__ = actualProto
    }
    this.name = 'ZodError'
    this.issues = issues
  }
  format(_mapper) {
    const mapper =
      _mapper ||
      function (issue) {
        return issue.message
      }
    const fieldErrors = { _errors: [] }
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === 'invalid_union') {
          issue.unionErrors.map(processError)
        } else if (issue.code === 'invalid_return_type') {
          processError(issue.returnTypeError)
        } else if (issue.code === 'invalid_arguments') {
          processError(issue.argumentsError)
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue))
        } else {
          let curr = fieldErrors
          let i = 0
          while (i < issue.path.length) {
            const el = issue.path[i]
            const terminal = i === issue.path.length - 1
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] }
            } else {
              curr[el] = curr[el] || { _errors: [] }
              curr[el]._errors.push(mapper(issue))
            }
            curr = curr[el]
            i++
          }
        }
      }
    }
    processError(this)
    return fieldErrors
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`)
    }
  }
  toString() {
    return this.message
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2)
  }
  get isEmpty() {
    return this.issues.length === 0
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {}
    const formErrors = []
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0]
        fieldErrors[firstEl] = fieldErrors[firstEl] || []
        fieldErrors[firstEl].push(mapper(sub))
      } else {
        formErrors.push(mapper(sub))
      }
    }
    return { formErrors, fieldErrors }
  }
  get formErrors() {
    return this.flatten()
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues)
  return error
}
const errorMap = (issue, _ctx) => {
  let message
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = 'Required'
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`
      }
      break
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`
      break
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ', ')}`
      break
    case ZodIssueCode.invalid_union:
      message = `Invalid input`
      break
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`
      break
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`
      break
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`
      break
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`
      break
    case ZodIssueCode.invalid_date:
      message = `Invalid date`
      break
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === 'object') {
        if ('includes' in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`
          if (typeof issue.validation.position === 'number') {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`
          }
        } else if ('startsWith' in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`
        } else if ('endsWith' in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`
        } else {
          util.assertNever(issue.validation)
        }
      } else if (issue.validation !== 'regex') {
        message = `Invalid ${issue.validation}`
      } else {
        message = 'Invalid'
      }
      break
    case ZodIssueCode.too_small:
      if (issue.type === 'array')
        message = `Array must contain ${issue.exact ? 'exactly' : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`
      else if (issue.type === 'string')
        message = `String must contain ${issue.exact ? 'exactly' : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`
      else if (issue.type === 'number')
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`
      else if (issue.type === 'bigint')
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`
      else if (issue.type === 'date')
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`
      else message = 'Invalid input'
      break
    case ZodIssueCode.too_big:
      if (issue.type === 'array')
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`
      else if (issue.type === 'string')
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`
      else if (issue.type === 'number')
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`
      else if (issue.type === 'bigint')
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`
      else if (issue.type === 'date')
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`
      else message = 'Invalid input'
      break
    case ZodIssueCode.custom:
      message = `Invalid input`
      break
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`
      break
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`
      break
    case ZodIssueCode.not_finite:
      message = 'Number must be finite'
      break
    default:
      message = _ctx.defaultError
      util.assertNever(issue)
  }
  return { message }
}
let overrideErrorMap = errorMap
function getErrorMap() {
  return overrideErrorMap
}
const makeIssue = (params) => {
  const { data, path: path2, errorMaps, issueData } = params
  const fullPath = [...path2, ...(issueData.path || [])]
  const fullIssue = {
    ...issueData,
    path: fullPath,
  }
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message,
    }
  }
  let errorMessage = ''
  const maps = errorMaps
    .filter((m) => !!m)
    .slice()
    .reverse()
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage,
  }
}
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap()
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === errorMap ? void 0 : errorMap,
      // then global default map
    ].filter((x) => !!x),
  })
  ctx.common.issues.push(issue)
}
class ParseStatus {
  constructor() {
    this.value = 'valid'
  }
  dirty() {
    if (this.value === 'valid') this.value = 'dirty'
  }
  abort() {
    if (this.value !== 'aborted') this.value = 'aborted'
  }
  static mergeArray(status, results) {
    const arrayValue = []
    for (const s of results) {
      if (s.status === 'aborted') return INVALID
      if (s.status === 'dirty') status.dirty()
      arrayValue.push(s.value)
    }
    return { status: status.value, value: arrayValue }
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = []
    for (const pair of pairs) {
      const key = await pair.key
      const value = await pair.value
      syncPairs.push({
        key,
        value,
      })
    }
    return ParseStatus.mergeObjectSync(status, syncPairs)
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {}
    for (const pair of pairs) {
      const { key, value } = pair
      if (key.status === 'aborted') return INVALID
      if (value.status === 'aborted') return INVALID
      if (key.status === 'dirty') status.dirty()
      if (value.status === 'dirty') status.dirty()
      if (key.value !== '__proto__' && (typeof value.value !== 'undefined' || pair.alwaysSet)) {
        finalObject[key.value] = value.value
      }
    }
    return { status: status.value, value: finalObject }
  }
}
const INVALID = Object.freeze({
  status: 'aborted',
})
const DIRTY = (value) => ({ status: 'dirty', value })
const OK = (value) => ({ status: 'valid', value })
const isAborted = (x) => x.status === 'aborted'
const isDirty = (x) => x.status === 'dirty'
const isValid = (x) => x.status === 'valid'
const isAsync = (x) => typeof Promise !== 'undefined' && x instanceof Promise
var errorUtil
;(function (errorUtil2) {
  errorUtil2.errToObj = (message) => (typeof message === 'string' ? { message } : message || {})
  errorUtil2.toString = (message) => (typeof message === 'string' ? message : message?.message)
})(errorUtil || (errorUtil = {}))
class ParseInputLazyPath {
  constructor(parent, value, path2, key) {
    this._cachedPath = []
    this.parent = parent
    this.data = value
    this._path = path2
    this._key = key
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key)
      } else {
        this._cachedPath.push(...this._path, this._key)
      }
    }
    return this._cachedPath
  }
}
const handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value }
  } else {
    if (!ctx.common.issues.length) {
      throw new Error('Validation failed but no issues detected.')
    }
    return {
      success: false,
      get error() {
        if (this._error) return this._error
        const error = new ZodError(ctx.common.issues)
        this._error = error
        return this._error
      },
    }
  }
}
function processCreateParams(params) {
  if (!params) return {}
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(
      `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
    )
  }
  if (errorMap2) return { errorMap: errorMap2, description }
  const customMap = (iss, ctx) => {
    const { message } = params
    if (iss.code === 'invalid_enum_value') {
      return { message: message ?? ctx.defaultError }
    }
    if (typeof ctx.data === 'undefined') {
      return { message: message ?? required_error ?? ctx.defaultError }
    }
    if (iss.code !== 'invalid_type') return { message: ctx.defaultError }
    return { message: message ?? invalid_type_error ?? ctx.defaultError }
  }
  return { errorMap: customMap, description }
}
class ZodType {
  get description() {
    return this._def.description
  }
  _getType(input) {
    return getParsedType(input.data)
  }
  _getOrReturnCtx(input, ctx) {
    return (
      ctx || {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent,
      }
    )
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent,
      },
    }
  }
  _parseSync(input) {
    const result = this._parse(input)
    if (isAsync(result)) {
      throw new Error('Synchronous parse encountered promise.')
    }
    return result
  }
  _parseAsync(input) {
    const result = this._parse(input)
    return Promise.resolve(result)
  }
  parse(data, params) {
    const result = this.safeParse(data, params)
    if (result.success) return result.data
    throw result.error
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap,
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data),
    }
    const result = this._parseSync({ data, path: ctx.path, parent: ctx })
    return handleResult(ctx, result)
  }
  '~validate'(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this['~standard'].async,
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data),
    }
    if (!this['~standard'].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx })
        return isValid(result)
          ? {
              value: result.value,
            }
          : {
              issues: ctx.common.issues,
            }
      } catch (err2) {
        if (err2?.message?.toLowerCase()?.includes('encountered')) {
          this['~standard'].async = true
        }
        ctx.common = {
          issues: [],
          async: true,
        }
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) =>
      isValid(result)
        ? {
            value: result.value,
          }
        : {
            issues: ctx.common.issues,
          },
    )
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params)
    if (result.success) return result.data
    throw result.error
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true,
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data),
    }
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx })
    const result = await (isAsync(maybeAsyncResult)
      ? maybeAsyncResult
      : Promise.resolve(maybeAsyncResult))
    return handleResult(ctx, result)
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === 'string' || typeof message === 'undefined') {
        return { message }
      } else if (typeof message === 'function') {
        return message(val)
      } else {
        return message
      }
    }
    return this._refinement((val, ctx) => {
      const result = check(val)
      const setError = () =>
        ctx.addIssue({
          code: ZodIssueCode.custom,
          ...getIssueProperties(val),
        })
      if (typeof Promise !== 'undefined' && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError()
            return false
          } else {
            return true
          }
        })
      }
      if (!result) {
        setError()
        return false
      } else {
        return true
      }
    })
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(
          typeof refinementData === 'function' ? refinementData(val, ctx) : refinementData,
        )
        return false
      } else {
        return true
      }
    })
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: 'refinement', refinement },
    })
  }
  superRefine(refinement) {
    return this._refinement(refinement)
  }
  constructor(def) {
    this.spa = this.safeParseAsync
    this._def = def
    this.parse = this.parse.bind(this)
    this.safeParse = this.safeParse.bind(this)
    this.parseAsync = this.parseAsync.bind(this)
    this.safeParseAsync = this.safeParseAsync.bind(this)
    this.spa = this.spa.bind(this)
    this.refine = this.refine.bind(this)
    this.refinement = this.refinement.bind(this)
    this.superRefine = this.superRefine.bind(this)
    this.optional = this.optional.bind(this)
    this.nullable = this.nullable.bind(this)
    this.nullish = this.nullish.bind(this)
    this.array = this.array.bind(this)
    this.promise = this.promise.bind(this)
    this.or = this.or.bind(this)
    this.and = this.and.bind(this)
    this.transform = this.transform.bind(this)
    this.brand = this.brand.bind(this)
    this.default = this.default.bind(this)
    this.catch = this.catch.bind(this)
    this.describe = this.describe.bind(this)
    this.pipe = this.pipe.bind(this)
    this.readonly = this.readonly.bind(this)
    this.isNullable = this.isNullable.bind(this)
    this.isOptional = this.isOptional.bind(this)
    this['~standard'] = {
      version: 1,
      vendor: 'zod',
      validate: (data) => this['~validate'](data),
    }
  }
  optional() {
    return ZodOptional.create(this, this._def)
  }
  nullable() {
    return ZodNullable.create(this, this._def)
  }
  nullish() {
    return this.nullable().optional()
  }
  array() {
    return ZodArray.create(this)
  }
  promise() {
    return ZodPromise.create(this, this._def)
  }
  or(option) {
    return ZodUnion.create([this, option], this._def)
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def)
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: 'transform', transform },
    })
  }
  default(def) {
    const defaultValueFunc = typeof def === 'function' ? def : () => def
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
    })
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def),
    })
  }
  catch(def) {
    const catchValueFunc = typeof def === 'function' ? def : () => def
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
    })
  }
  describe(description) {
    const This = this.constructor
    return new This({
      ...this._def,
      description,
    })
  }
  pipe(target) {
    return ZodPipeline.create(this, target)
  }
  readonly() {
    return ZodReadonly.create(this)
  }
  isOptional() {
    return this.safeParse(void 0).success
  }
  isNullable() {
    return this.safeParse(null).success
  }
}
const cuidRegex = /^c[^\s-]{8,}$/i
const cuid2Regex = /^[0-9a-z]+$/
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i
const uuidRegex =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i
const nanoidRegex = /^[a-z0-9_-]{21}$/i
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
const durationRegex =
  /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/
const emailRegex =
  /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`
let emojiRegex
const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/
const ipv4CidrRegex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/
const ipv6Regex =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
const ipv6CidrRegex =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`
const dateRegex = new RegExp(`^${dateRegexSource}$`)
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`
  }
  const secondsQuantifier = args.precision ? '+' : '?'
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`)
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`
  const opts = []
  opts.push(args.local ? `Z?` : `Z`)
  if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`)
  regex = `${regex}(${opts.join('|')})`
  return new RegExp(`^${regex}$`)
}
function isValidIP(ip, version2) {
  if ((version2 === 'v4' || !version2) && ipv4Regex.test(ip)) {
    return true
  }
  if ((version2 === 'v6' || !version2) && ipv6Regex.test(ip)) {
    return true
  }
  return false
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt)) return false
  try {
    const [header] = jwt.split('.')
    if (!header) return false
    const base64 = header
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(header.length + ((4 - (header.length % 4)) % 4), '=')
    const decoded = JSON.parse(atob(base64))
    if (typeof decoded !== 'object' || decoded === null) return false
    if ('typ' in decoded && decoded?.typ !== 'JWT') return false
    if (!decoded.alg) return false
    if (alg && decoded.alg !== alg) return false
    return true
  } catch {
    return false
  }
}
function isValidCidr(ip, version2) {
  if ((version2 === 'v4' || !version2) && ipv4CidrRegex.test(ip)) {
    return true
  }
  if ((version2 === 'v6' || !version2) && ipv6CidrRegex.test(ip)) {
    return true
  }
  return false
}
class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data)
    }
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input)
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType,
      })
      return INVALID
    }
    const status = new ParseStatus()
    let ctx = void 0
    for (const check of this._def.checks) {
      if (check.kind === 'min') {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: 'string',
            inclusive: true,
            exact: false,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'max') {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: 'string',
            inclusive: true,
            exact: false,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'length') {
        const tooBig = input.data.length > check.value
        const tooSmall = input.data.length < check.value
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx)
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: 'string',
              inclusive: true,
              exact: true,
              message: check.message,
            })
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: 'string',
              inclusive: true,
              exact: true,
              message: check.message,
            })
          }
          status.dirty()
        }
      } else if (check.kind === 'email') {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'email',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'emoji') {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, 'u')
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'emoji',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'uuid') {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'uuid',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'nanoid') {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'nanoid',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'cuid') {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'cuid',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'cuid2') {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'cuid2',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'ulid') {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'ulid',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'url') {
        try {
          new URL(input.data)
        } catch {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'url',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'regex') {
        check.regex.lastIndex = 0
        const testResult = check.regex.test(input.data)
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'regex',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'trim') {
        input.data = input.data.trim()
      } else if (check.kind === 'includes') {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'toLowerCase') {
        input.data = input.data.toLowerCase()
      } else if (check.kind === 'toUpperCase') {
        input.data = input.data.toUpperCase()
      } else if (check.kind === 'startsWith') {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'endsWith') {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'datetime') {
        const regex = datetimeRegex(check)
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: 'datetime',
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'date') {
        const regex = dateRegex
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: 'date',
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'time') {
        const regex = timeRegex(check)
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: 'time',
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'duration') {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'duration',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'ip') {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'ip',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'jwt') {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'jwt',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'cidr') {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'cidr',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'base64') {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'base64',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'base64url') {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            validation: 'base64url',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          })
          status.dirty()
        }
      } else {
        util.assertNever(check)
      }
    }
    return { status: status.value, value: input.data }
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message),
    })
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check],
    })
  }
  email(message) {
    return this._addCheck({ kind: 'email', ...errorUtil.errToObj(message) })
  }
  url(message) {
    return this._addCheck({ kind: 'url', ...errorUtil.errToObj(message) })
  }
  emoji(message) {
    return this._addCheck({ kind: 'emoji', ...errorUtil.errToObj(message) })
  }
  uuid(message) {
    return this._addCheck({ kind: 'uuid', ...errorUtil.errToObj(message) })
  }
  nanoid(message) {
    return this._addCheck({ kind: 'nanoid', ...errorUtil.errToObj(message) })
  }
  cuid(message) {
    return this._addCheck({ kind: 'cuid', ...errorUtil.errToObj(message) })
  }
  cuid2(message) {
    return this._addCheck({ kind: 'cuid2', ...errorUtil.errToObj(message) })
  }
  ulid(message) {
    return this._addCheck({ kind: 'ulid', ...errorUtil.errToObj(message) })
  }
  base64(message) {
    return this._addCheck({ kind: 'base64', ...errorUtil.errToObj(message) })
  }
  base64url(message) {
    return this._addCheck({
      kind: 'base64url',
      ...errorUtil.errToObj(message),
    })
  }
  jwt(options) {
    return this._addCheck({ kind: 'jwt', ...errorUtil.errToObj(options) })
  }
  ip(options) {
    return this._addCheck({ kind: 'ip', ...errorUtil.errToObj(options) })
  }
  cidr(options) {
    return this._addCheck({ kind: 'cidr', ...errorUtil.errToObj(options) })
  }
  datetime(options) {
    if (typeof options === 'string') {
      return this._addCheck({
        kind: 'datetime',
        precision: null,
        offset: false,
        local: false,
        message: options,
      })
    }
    return this._addCheck({
      kind: 'datetime',
      precision: typeof options?.precision === 'undefined' ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message),
    })
  }
  date(message) {
    return this._addCheck({ kind: 'date', message })
  }
  time(options) {
    if (typeof options === 'string') {
      return this._addCheck({
        kind: 'time',
        precision: null,
        message: options,
      })
    }
    return this._addCheck({
      kind: 'time',
      precision: typeof options?.precision === 'undefined' ? null : options?.precision,
      ...errorUtil.errToObj(options?.message),
    })
  }
  duration(message) {
    return this._addCheck({ kind: 'duration', ...errorUtil.errToObj(message) })
  }
  regex(regex, message) {
    return this._addCheck({
      kind: 'regex',
      regex,
      ...errorUtil.errToObj(message),
    })
  }
  includes(value, options) {
    return this._addCheck({
      kind: 'includes',
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message),
    })
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: 'startsWith',
      value,
      ...errorUtil.errToObj(message),
    })
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: 'endsWith',
      value,
      ...errorUtil.errToObj(message),
    })
  }
  min(minLength, message) {
    return this._addCheck({
      kind: 'min',
      value: minLength,
      ...errorUtil.errToObj(message),
    })
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: 'max',
      value: maxLength,
      ...errorUtil.errToObj(message),
    })
  }
  length(len, message) {
    return this._addCheck({
      kind: 'length',
      value: len,
      ...errorUtil.errToObj(message),
    })
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message))
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'trim' }],
    })
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'toLowerCase' }],
    })
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'toUpperCase' }],
    })
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === 'datetime')
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === 'date')
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === 'time')
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === 'duration')
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === 'email')
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === 'url')
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === 'emoji')
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === 'uuid')
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === 'nanoid')
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === 'cuid')
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === 'cuid2')
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === 'ulid')
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === 'ip')
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === 'cidr')
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === 'base64')
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === 'base64url')
  }
  get minLength() {
    let min = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value
      }
    }
    return min
  }
  get maxLength() {
    let max = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value
      }
    }
    return max
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params),
  })
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split('.')[1] || '').length
  const stepDecCount = (step.toString().split('.')[1] || '').length
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount
  const valInt = Number.parseInt(val.toFixed(decCount).replace('.', ''))
  const stepInt = Number.parseInt(step.toFixed(decCount).replace('.', ''))
  return (valInt % stepInt) / 10 ** decCount
}
class ZodNumber extends ZodType {
  constructor() {
    super(...arguments)
    this.min = this.gte
    this.max = this.lte
    this.step = this.multipleOf
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data)
    }
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input)
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType,
      })
      return INVALID
    }
    let ctx = void 0
    const status = new ParseStatus()
    for (const check of this._def.checks) {
      if (check.kind === 'int') {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: 'integer',
            received: 'float',
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'min') {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: 'number',
            inclusive: check.inclusive,
            exact: false,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'max') {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: 'number',
            inclusive: check.inclusive,
            exact: false,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'multipleOf') {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'finite') {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message,
          })
          status.dirty()
        }
      } else {
        util.assertNever(check)
      }
    }
    return { status: status.value, value: input.data }
  }
  gte(value, message) {
    return this.setLimit('min', value, true, errorUtil.toString(message))
  }
  gt(value, message) {
    return this.setLimit('min', value, false, errorUtil.toString(message))
  }
  lte(value, message) {
    return this.setLimit('max', value, true, errorUtil.toString(message))
  }
  lt(value, message) {
    return this.setLimit('max', value, false, errorUtil.toString(message))
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message),
        },
      ],
    })
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check],
    })
  }
  int(message) {
    return this._addCheck({
      kind: 'int',
      message: errorUtil.toString(message),
    })
  }
  positive(message) {
    return this._addCheck({
      kind: 'min',
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message),
    })
  }
  negative(message) {
    return this._addCheck({
      kind: 'max',
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message),
    })
  }
  nonpositive(message) {
    return this._addCheck({
      kind: 'max',
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message),
    })
  }
  nonnegative(message) {
    return this._addCheck({
      kind: 'min',
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message),
    })
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: 'multipleOf',
      value,
      message: errorUtil.toString(message),
    })
  }
  finite(message) {
    return this._addCheck({
      kind: 'finite',
      message: errorUtil.toString(message),
    })
  }
  safe(message) {
    return this._addCheck({
      kind: 'min',
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message),
    })._addCheck({
      kind: 'max',
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message),
    })
  }
  get minValue() {
    let min = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value
      }
    }
    return min
  }
  get maxValue() {
    let max = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value
      }
    }
    return max
  }
  get isInt() {
    return !!this._def.checks.find(
      (ch) => ch.kind === 'int' || (ch.kind === 'multipleOf' && util.isInteger(ch.value)),
    )
  }
  get isFinite() {
    let max = null
    let min = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'finite' || ch.kind === 'int' || ch.kind === 'multipleOf') {
        return true
      } else if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value
      } else if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value
      }
    }
    return Number.isFinite(min) && Number.isFinite(max)
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params),
  })
}
class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments)
    this.min = this.gte
    this.max = this.lte
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data)
      } catch {
        return this._getInvalidInput(input)
      }
    }
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input)
    }
    let ctx = void 0
    const status = new ParseStatus()
    for (const check of this._def.checks) {
      if (check.kind === 'min') {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: 'bigint',
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'max') {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: 'bigint',
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message,
          })
          status.dirty()
        }
      } else if (check.kind === 'multipleOf') {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message,
          })
          status.dirty()
        }
      } else {
        util.assertNever(check)
      }
    }
    return { status: status.value, value: input.data }
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input)
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType,
    })
    return INVALID
  }
  gte(value, message) {
    return this.setLimit('min', value, true, errorUtil.toString(message))
  }
  gt(value, message) {
    return this.setLimit('min', value, false, errorUtil.toString(message))
  }
  lte(value, message) {
    return this.setLimit('max', value, true, errorUtil.toString(message))
  }
  lt(value, message) {
    return this.setLimit('max', value, false, errorUtil.toString(message))
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message),
        },
      ],
    })
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check],
    })
  }
  positive(message) {
    return this._addCheck({
      kind: 'min',
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message),
    })
  }
  negative(message) {
    return this._addCheck({
      kind: 'max',
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message),
    })
  }
  nonpositive(message) {
    return this._addCheck({
      kind: 'max',
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message),
    })
  }
  nonnegative(message) {
    return this._addCheck({
      kind: 'min',
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message),
    })
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: 'multipleOf',
      value,
      message: errorUtil.toString(message),
    })
  }
  get minValue() {
    let min = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value
      }
    }
    return min
  }
  get maxValue() {
    let max = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value
      }
    }
    return max
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params),
  })
}
class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data)
    }
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params),
  })
}
class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data)
    }
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input)
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType,
      })
      return INVALID
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input)
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date,
      })
      return INVALID
    }
    const status = new ParseStatus()
    let ctx = void 0
    for (const check of this._def.checks) {
      if (check.kind === 'min') {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: 'date',
          })
          status.dirty()
        }
      } else if (check.kind === 'max') {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx)
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: 'date',
          })
          status.dirty()
        }
      } else {
        util.assertNever(check)
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime()),
    }
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check],
    })
  }
  min(minDate, message) {
    return this._addCheck({
      kind: 'min',
      value: minDate.getTime(),
      message: errorUtil.toString(message),
    })
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: 'max',
      value: maxDate.getTime(),
      message: errorUtil.toString(message),
    })
  }
  get minDate() {
    let min = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value
      }
    }
    return min != null ? new Date(min) : null
  }
  get maxDate() {
    let max = null
    for (const ch of this._def.checks) {
      if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value
      }
    }
    return max != null ? new Date(max) : null
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params),
  })
}
class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params),
  })
}
class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params),
  })
}
class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params),
  })
}
class ZodAny extends ZodType {
  constructor() {
    super(...arguments)
    this._any = true
  }
  _parse(input) {
    return OK(input.data)
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params),
  })
}
class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments)
    this._unknown = true
  }
  _parse(input) {
    return OK(input.data)
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params),
  })
}
class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input)
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType,
    })
    return INVALID
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params),
  })
}
class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params),
  })
}
class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input)
    const def = this._def
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType,
      })
      return INVALID
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value
      const tooSmall = ctx.data.length < def.exactLength.value
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: 'array',
          inclusive: true,
          exact: true,
          message: def.exactLength.message,
        })
        status.dirty()
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: 'array',
          inclusive: true,
          exact: false,
          message: def.minLength.message,
        })
        status.dirty()
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: 'array',
          inclusive: true,
          exact: false,
          message: def.maxLength.message,
        })
        status.dirty()
      }
    }
    if (ctx.common.async) {
      return Promise.all(
        [...ctx.data].map((item, i) => {
          return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i))
        }),
      ).then((result2) => {
        return ParseStatus.mergeArray(status, result2)
      })
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i))
    })
    return ParseStatus.mergeArray(status, result)
  }
  get element() {
    return this._def.type
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) },
    })
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) },
    })
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) },
    })
  }
  nonempty(message) {
    return this.min(1, message)
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params),
  })
}
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {}
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key]
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema))
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape,
    })
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element),
    })
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()))
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()))
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)))
  } else {
    return schema
  }
}
class ZodObject extends ZodType {
  constructor() {
    super(...arguments)
    this._cached = null
    this.nonstrict = this.passthrough
    this.augment = this.extend
  }
  _getCached() {
    if (this._cached !== null) return this._cached
    const shape = this._def.shape()
    const keys = util.objectKeys(shape)
    this._cached = { shape, keys }
    return this._cached
  }
  _parse(input) {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input)
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType,
      })
      return INVALID
    }
    const { status, ctx } = this._processInputParams(input)
    const { shape, keys: shapeKeys } = this._getCached()
    const extraKeys = []
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === 'strip')) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key)
        }
      }
    }
    const pairs = []
    for (const key of shapeKeys) {
      const keyValidator = shape[key]
      const value = ctx.data[key]
      pairs.push({
        key: { status: 'valid', value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data,
      })
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys
      if (unknownKeys === 'passthrough') {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: 'valid', value: key },
            value: { status: 'valid', value: ctx.data[key] },
          })
        }
      } else if (unknownKeys === 'strict') {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys,
          })
          status.dirty()
        }
      } else if (unknownKeys === 'strip');
      else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`)
      }
    } else {
      const catchall = this._def.catchall
      for (const key of extraKeys) {
        const value = ctx.data[key]
        pairs.push({
          key: { status: 'valid', value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key),
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data,
        })
      }
    }
    if (ctx.common.async) {
      return Promise.resolve()
        .then(async () => {
          const syncPairs = []
          for (const pair of pairs) {
            const key = await pair.key
            const value = await pair.value
            syncPairs.push({
              key,
              value,
              alwaysSet: pair.alwaysSet,
            })
          }
          return syncPairs
        })
        .then((syncPairs) => {
          return ParseStatus.mergeObjectSync(status, syncPairs)
        })
    } else {
      return ParseStatus.mergeObjectSync(status, pairs)
    }
  }
  get shape() {
    return this._def.shape()
  }
  strict(message) {
    errorUtil.errToObj
    return new ZodObject({
      ...this._def,
      unknownKeys: 'strict',
      ...(message !== void 0
        ? {
            errorMap: (issue, ctx) => {
              const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError
              if (issue.code === 'unrecognized_keys')
                return {
                  message: errorUtil.errToObj(message).message ?? defaultError,
                }
              return {
                message: defaultError,
              }
            },
          }
        : {}),
    })
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: 'strip',
    })
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: 'passthrough',
    })
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation,
      }),
    })
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape(),
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject,
    })
    return merged
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema })
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index,
    })
  }
  pick(mask) {
    const shape = {}
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key]
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape,
    })
  }
  omit(mask) {
    const shape = {}
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key]
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape,
    })
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this)
  }
  partial(mask) {
    const newShape = {}
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key]
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema
      } else {
        newShape[key] = fieldSchema.optional()
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape,
    })
  }
  required(mask) {
    const newShape = {}
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key]
      } else {
        const fieldSchema = this.shape[key]
        let newField = fieldSchema
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType
        }
        newShape[key] = newField
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape,
    })
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape))
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: 'strip',
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params),
  })
}
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: 'strict',
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params),
  })
}
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: 'strip',
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params),
  })
}
class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input)
    const options = this._def.options
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === 'valid') {
          return result.result
        }
      }
      for (const result of results) {
        if (result.result.status === 'dirty') {
          ctx.common.issues.push(...result.ctx.common.issues)
          return result.result
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues))
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors,
      })
      return INVALID
    }
    if (ctx.common.async) {
      return Promise.all(
        options.map(async (option) => {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: [],
            },
            parent: null,
          }
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx,
            }),
            ctx: childCtx,
          }
        }),
      ).then(handleResults)
    } else {
      let dirty = void 0
      const issues = []
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: [],
          },
          parent: null,
        }
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx,
        })
        if (result.status === 'valid') {
          return result
        } else if (result.status === 'dirty' && !dirty) {
          dirty = { result, ctx: childCtx }
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues)
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues)
        return dirty.result
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2))
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors,
      })
      return INVALID
    }
  }
  get options() {
    return this._def.options
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params),
  })
}
function mergeValues(a, b) {
  const aType = getParsedType(a)
  const bType = getParsedType(b)
  if (a === b) {
    return { valid: true, data: a }
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b)
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1)
    const newObj = { ...a, ...b }
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key])
      if (!sharedValue.valid) {
        return { valid: false }
      }
      newObj[key] = sharedValue.data
    }
    return { valid: true, data: newObj }
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false }
    }
    const newArray = []
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index]
      const itemB = b[index]
      const sharedValue = mergeValues(itemA, itemB)
      if (!sharedValue.valid) {
        return { valid: false }
      }
      newArray.push(sharedValue.data)
    }
    return { valid: true, data: newArray }
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a }
  } else {
    return { valid: false }
  }
}
class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input)
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value)
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types,
        })
        return INVALID
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty()
      }
      return { status: status.value, value: merged.data }
    }
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
      ]).then(([left, right]) => handleParsed(left, right))
    } else {
      return handleParsed(
        this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
        this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
      )
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params),
  })
}
class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType,
      })
      return INVALID
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: 'array',
      })
      return INVALID
    }
    const rest = this._def.rest
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: 'array',
      })
      status.dirty()
    }
    const items = [...ctx.data]
      .map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest
        if (!schema) return null
        return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex))
      })
      .filter((x) => !!x)
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results)
      })
    } else {
      return ParseStatus.mergeArray(status, items)
    }
  }
  get items() {
    return this._def.items
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest,
    })
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error('You must pass an array of schemas to z.tuple([ ... ])')
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params),
  })
}
class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType
  }
  get valueSchema() {
    return this._def.valueType
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType,
      })
      return INVALID
    }
    const pairs = []
    const keyType = this._def.keyType
    const valueType = this._def.valueType
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data,
      })
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs)
    } else {
      return ParseStatus.mergeObjectSync(status, pairs)
    }
  }
  get element() {
    return this._def.valueType
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third),
      })
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second),
    })
  }
}
class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType
  }
  get valueSchema() {
    return this._def.valueType
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType,
      })
      return INVALID
    }
    const keyType = this._def.keyType
    const valueType = this._def.valueType
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, 'key'])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, 'value'])),
      }
    })
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map()
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key
          const value = await pair.value
          if (key.status === 'aborted' || value.status === 'aborted') {
            return INVALID
          }
          if (key.status === 'dirty' || value.status === 'dirty') {
            status.dirty()
          }
          finalMap.set(key.value, value.value)
        }
        return { status: status.value, value: finalMap }
      })
    } else {
      const finalMap = /* @__PURE__ */ new Map()
      for (const pair of pairs) {
        const key = pair.key
        const value = pair.value
        if (key.status === 'aborted' || value.status === 'aborted') {
          return INVALID
        }
        if (key.status === 'dirty' || value.status === 'dirty') {
          status.dirty()
        }
        finalMap.set(key.value, value.value)
      }
      return { status: status.value, value: finalMap }
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params),
  })
}
class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType,
      })
      return INVALID
    }
    const def = this._def
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: 'set',
          inclusive: true,
          exact: false,
          message: def.minSize.message,
        })
        status.dirty()
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: 'set',
          inclusive: true,
          exact: false,
          message: def.maxSize.message,
        })
        status.dirty()
      }
    }
    const valueType = this._def.valueType
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set()
      for (const element of elements2) {
        if (element.status === 'aborted') return INVALID
        if (element.status === 'dirty') status.dirty()
        parsedSet.add(element.value)
      }
      return { status: status.value, value: parsedSet }
    }
    const elements = [...ctx.data.values()].map((item, i) =>
      valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)),
    )
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2))
    } else {
      return finalizeSet(elements)
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) },
    })
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) },
    })
  }
  size(size, message) {
    return this.min(size, message).max(size, message)
  }
  nonempty(message) {
    return this.min(1, message)
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params),
  })
}
class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter()
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input)
    const lazySchema = this._def.getter()
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx })
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params),
  })
}
class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value,
      })
      return INVALID
    }
    return { status: 'valid', value: input.data }
  }
  get value() {
    return this._def.value
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params),
  })
}
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params),
  })
}
class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== 'string') {
      const ctx = this._getOrReturnCtx(input)
      const expectedValues = this._def.values
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type,
      })
      return INVALID
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values)
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input)
      const expectedValues = this._def.values
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues,
      })
      return INVALID
    }
    return OK(input.data)
  }
  get options() {
    return this._def.values
  }
  get enum() {
    const enumValues = {}
    for (const val of this._def.values) {
      enumValues[val] = val
    }
    return enumValues
  }
  get Values() {
    const enumValues = {}
    for (const val of this._def.values) {
      enumValues[val] = val
    }
    return enumValues
  }
  get Enum() {
    const enumValues = {}
    for (const val of this._def.values) {
      enumValues[val] = val
    }
    return enumValues
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef,
    })
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(
      this.options.filter((opt) => !values.includes(opt)),
      {
        ...this._def,
        ...newDef,
      },
    )
  }
}
ZodEnum.create = createZodEnum
class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values)
    const ctx = this._getOrReturnCtx(input)
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues)
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type,
      })
      return INVALID
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values))
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues)
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues,
      })
      return INVALID
    }
    return OK(input.data)
  }
  get enum() {
    return this._def.values
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params),
  })
}
class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input)
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType,
      })
      return INVALID
    }
    const promisified =
      ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data)
    return OK(
      promisified.then((data) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap,
        })
      }),
    )
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params),
  })
}
class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects
      ? this._def.schema.sourceType()
      : this._def.schema
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input)
    const effect = this._def.effect || null
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg)
        if (arg.fatal) {
          status.abort()
        } else {
          status.dirty()
        }
      },
      get path() {
        return ctx.path
      },
    }
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx)
    if (effect.type === 'preprocess') {
      const processed = effect.transform(ctx.data, checkCtx)
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === 'aborted') return INVALID
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx,
          })
          if (result.status === 'aborted') return INVALID
          if (result.status === 'dirty') return DIRTY(result.value)
          if (status.value === 'dirty') return DIRTY(result.value)
          return result
        })
      } else {
        if (status.value === 'aborted') return INVALID
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx,
        })
        if (result.status === 'aborted') return INVALID
        if (result.status === 'dirty') return DIRTY(result.value)
        if (status.value === 'dirty') return DIRTY(result.value)
        return result
      }
    }
    if (effect.type === 'refinement') {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx)
        if (ctx.common.async) {
          return Promise.resolve(result)
        }
        if (result instanceof Promise) {
          throw new Error(
            'Async refinement encountered during synchronous parse operation. Use .parseAsync instead.',
          )
        }
        return acc
      }
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })
        if (inner.status === 'aborted') return INVALID
        if (inner.status === 'dirty') status.dirty()
        executeRefinement(inner.value)
        return { status: status.value, value: inner.value }
      } else {
        return this._def.schema
          ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
          .then((inner) => {
            if (inner.status === 'aborted') return INVALID
            if (inner.status === 'dirty') status.dirty()
            return executeRefinement(inner.value).then(() => {
              return { status: status.value, value: inner.value }
            })
          })
      }
    }
    if (effect.type === 'transform') {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })
        if (!isValid(base)) return INVALID
        const result = effect.transform(base.value, checkCtx)
        if (result instanceof Promise) {
          throw new Error(
            `Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`,
          )
        }
        return { status: status.value, value: result }
      } else {
        return this._def.schema
          ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
          .then((base) => {
            if (!isValid(base)) return INVALID
            return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
              status: status.value,
              value: result,
            }))
          })
      }
    }
    util.assertNever(effect)
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params),
  })
}
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: 'preprocess', transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params),
  })
}
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input)
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0)
    }
    return this._def.innerType._parse(input)
  }
  unwrap() {
    return this._def.innerType
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params),
  })
}
class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input)
    if (parsedType === ZodParsedType.null) {
      return OK(null)
    }
    return this._def.innerType._parse(input)
  }
  unwrap() {
    return this._def.innerType
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params),
  })
}
class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input)
    let data = ctx.data
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue()
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx,
    })
  }
  removeDefault() {
    return this._def.innerType
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === 'function' ? params.default : () => params.default,
    ...processCreateParams(params),
  })
}
class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input)
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: [],
      },
    }
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx,
      },
    })
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: 'valid',
          value:
            result2.status === 'valid'
              ? result2.value
              : this._def.catchValue({
                  get error() {
                    return new ZodError(newCtx.common.issues)
                  },
                  input: newCtx.data,
                }),
        }
      })
    } else {
      return {
        status: 'valid',
        value:
          result.status === 'valid'
            ? result.value
            : this._def.catchValue({
                get error() {
                  return new ZodError(newCtx.common.issues)
                },
                input: newCtx.data,
              }),
      }
    }
  }
  removeCatch() {
    return this._def.innerType
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === 'function' ? params.catch : () => params.catch,
    ...processCreateParams(params),
  })
}
class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return { status: 'valid', value: input.data }
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params),
  })
}
class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input)
    const data = ctx.data
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx,
    })
  }
  unwrap() {
    return this._def.type
  }
}
class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })
        if (inResult.status === 'aborted') return INVALID
        if (inResult.status === 'dirty') {
          status.dirty()
          return DIRTY(inResult.value)
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx,
          })
        }
      }
      return handleAsync()
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx,
      })
      if (inResult.status === 'aborted') return INVALID
      if (inResult.status === 'dirty') {
        status.dirty()
        return {
          status: 'dirty',
          value: inResult.value,
        }
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx,
        })
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline,
    })
  }
}
class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input)
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value)
      }
      return data
    }
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result)
  }
  unwrap() {
    return this._def.innerType
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params),
  })
}
var ZodFirstPartyTypeKind
;(function (ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2['ZodString'] = 'ZodString'
  ZodFirstPartyTypeKind2['ZodNumber'] = 'ZodNumber'
  ZodFirstPartyTypeKind2['ZodNaN'] = 'ZodNaN'
  ZodFirstPartyTypeKind2['ZodBigInt'] = 'ZodBigInt'
  ZodFirstPartyTypeKind2['ZodBoolean'] = 'ZodBoolean'
  ZodFirstPartyTypeKind2['ZodDate'] = 'ZodDate'
  ZodFirstPartyTypeKind2['ZodSymbol'] = 'ZodSymbol'
  ZodFirstPartyTypeKind2['ZodUndefined'] = 'ZodUndefined'
  ZodFirstPartyTypeKind2['ZodNull'] = 'ZodNull'
  ZodFirstPartyTypeKind2['ZodAny'] = 'ZodAny'
  ZodFirstPartyTypeKind2['ZodUnknown'] = 'ZodUnknown'
  ZodFirstPartyTypeKind2['ZodNever'] = 'ZodNever'
  ZodFirstPartyTypeKind2['ZodVoid'] = 'ZodVoid'
  ZodFirstPartyTypeKind2['ZodArray'] = 'ZodArray'
  ZodFirstPartyTypeKind2['ZodObject'] = 'ZodObject'
  ZodFirstPartyTypeKind2['ZodUnion'] = 'ZodUnion'
  ZodFirstPartyTypeKind2['ZodDiscriminatedUnion'] = 'ZodDiscriminatedUnion'
  ZodFirstPartyTypeKind2['ZodIntersection'] = 'ZodIntersection'
  ZodFirstPartyTypeKind2['ZodTuple'] = 'ZodTuple'
  ZodFirstPartyTypeKind2['ZodRecord'] = 'ZodRecord'
  ZodFirstPartyTypeKind2['ZodMap'] = 'ZodMap'
  ZodFirstPartyTypeKind2['ZodSet'] = 'ZodSet'
  ZodFirstPartyTypeKind2['ZodFunction'] = 'ZodFunction'
  ZodFirstPartyTypeKind2['ZodLazy'] = 'ZodLazy'
  ZodFirstPartyTypeKind2['ZodLiteral'] = 'ZodLiteral'
  ZodFirstPartyTypeKind2['ZodEnum'] = 'ZodEnum'
  ZodFirstPartyTypeKind2['ZodEffects'] = 'ZodEffects'
  ZodFirstPartyTypeKind2['ZodNativeEnum'] = 'ZodNativeEnum'
  ZodFirstPartyTypeKind2['ZodOptional'] = 'ZodOptional'
  ZodFirstPartyTypeKind2['ZodNullable'] = 'ZodNullable'
  ZodFirstPartyTypeKind2['ZodDefault'] = 'ZodDefault'
  ZodFirstPartyTypeKind2['ZodCatch'] = 'ZodCatch'
  ZodFirstPartyTypeKind2['ZodPromise'] = 'ZodPromise'
  ZodFirstPartyTypeKind2['ZodBranded'] = 'ZodBranded'
  ZodFirstPartyTypeKind2['ZodPipeline'] = 'ZodPipeline'
  ZodFirstPartyTypeKind2['ZodReadonly'] = 'ZodReadonly'
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}))
const stringType = ZodString.create
const numberType = ZodNumber.create
const booleanType = ZodBoolean.create
ZodNever.create
const arrayType = ZodArray.create
const objectType = ZodObject.create
ZodUnion.create
ZodIntersection.create
ZodTuple.create
const recordType = ZodRecord.create
const enumType = ZodEnum.create
ZodPromise.create
ZodOptional.create
ZodNullable.create
const DownloadStatus = enumType([
  'waiting',
  'fetching_metadata',
  'preparing',
  'downloading',
  'merging',
  'embedding',
  'verifying',
  'retrying',
  'completed',
  'error',
  'paused',
  'cancelled',
])
objectType({
  id: stringType().uuid(),
  url: stringType().url(),
  title: stringType().optional(),
  status: DownloadStatus,
  progress: numberType().min(0).max(100).default(0),
  speed: stringType().optional(),
  eta: stringType().optional(),
  fileSize: stringType().optional(),
  outputPath: stringType().optional(),
  error: stringType().optional(),
  priority: numberType().int().min(1).max(10).default(5),
  createdAt: stringType().datetime(),
  completedAt: stringType().datetime().optional(),
})
objectType({
  total: numberType().int().nonnegative(),
  downloading: numberType().int().nonnegative(),
  waiting: numberType().int().nonnegative(),
  completed: numberType().int().nonnegative(),
  failed: numberType().int().nonnegative(),
})
const DownloadSettingsSchema = objectType({
  outputFormat: stringType().default('bestvideo+bestaudio/best'),
  downloadPath: stringType().default(''),
  extractAudio: booleanType().default(false),
  audioFormat: stringType().default('mp3'),
  embedMetadata: booleanType().default(true),
  maxConcurrent: numberType().int().min(1).max(20).default(3),
  speedLimit: stringType()
    .regex(/^(\d+(\.\d+)?[KMGkmg]?)?$/, 'Invalid speed limit format')
    .default(''),
  namingTemplate: stringType().default('%(title)s.%(ext)s'),
  basePresetId: stringType().default(''),
  smartQueueOrdering: booleanType().default(true),
  ytdlpPath: stringType().default('yt-dlp'),
  ffmpegPath: stringType().default('ffmpeg'),
})
const FormatDetailSchema = objectType({
  format_id: stringType(),
  ext: stringType(),
  resolution: stringType().optional(),
  filesize: numberType().optional(),
  filesizeApprox: numberType().optional(),
  vcodec: stringType().optional(),
  acodec: stringType().optional(),
  format_note: stringType().optional(),
  tbr: numberType().optional(),
  vbr: numberType().optional(),
  abr: numberType().optional(),
  fps: numberType().optional(),
  width: numberType().optional(),
  height: numberType().optional(),
  dynamic_range: stringType().optional(),
  audio_channels: numberType().optional(),
})
const SubtitleTrackSchema = objectType({
  lang: stringType().optional(),
  name: stringType().optional(),
  ext: stringType(),
})
const ChapterSchema = objectType({
  title: stringType(),
  start_time: numberType(),
  end_time: numberType(),
})
objectType({
  id: stringType(),
  title: stringType(),
  duration: numberType().optional(),
  thumbnail: stringType().optional(),
  uploader: stringType().optional(),
  description: stringType().optional(),
  view_count: numberType().optional(),
  like_count: numberType().optional(),
  upload_date: stringType().optional(),
  formats: arrayType(FormatDetailSchema).optional(),
  subtitles: recordType(stringType(), arrayType(SubtitleTrackSchema)).optional(),
  automatic_captions: recordType(stringType(), arrayType(SubtitleTrackSchema)).optional(),
  chapters: arrayType(ChapterSchema).optional(),
})
const PlaylistMetadataSchema = objectType({
  title: stringType(),
  channel: stringType().optional(),
  totalExpected: numberType().int().nonnegative().optional(),
})
const PlaylistItemSchema = objectType({
  id: stringType(),
  url: stringType(),
  title: stringType(),
  duration: numberType().optional(),
  thumbnail: stringType().optional(),
  uploader: stringType().optional(),
  index: numberType().int().nonnegative().optional(),
})
const ErrorRegistrySchema = recordType(stringType(), stringType())
objectType({
  metadata: PlaylistMetadataSchema,
  items: arrayType(PlaylistItemSchema),
  errors: ErrorRegistrySchema,
})
const PresetSchema = objectType({
  id: stringType(),
  name: stringType().min(1).max(60),
  outputFormat: stringType().optional(),
  extraFlags: objectType({
    cookiesFile: stringType().optional(),
    browserCookies: stringType().optional(),
    subtitleLangs: arrayType(stringType()).optional(),
    embedSubs: booleanType().optional(),
    username: stringType().optional(),
    password: stringType().optional(),
    netrc: booleanType().optional(),
    proxy: stringType().optional(),
    userAgent: stringType().optional(),
    referer: stringType().optional(),
    playlistStart: numberType().int().positive().optional(),
    playlistEnd: numberType().int().positive().optional(),
    noPlaylist: booleanType().optional(),
    speedLimit: stringType().optional(),
  }).optional(),
  createdAt: stringType().datetime(),
})
const PostCheckStatus = enumType(['pass', 'fail', 'warning', 'running'])
const BinaryHealthStatus = enumType(['ok', 'missing', 'corrupted', 'unknown'])
objectType({
  name: enumType(['yt-dlp', 'ffmpeg']),
  status: BinaryHealthStatus,
  version: stringType(),
  path: stringType().optional(),
  error: stringType().optional(),
})
const PostCheckName = enumType([
  'yt-dlp',
  'ffmpeg',
  'internet',
  'disk-space',
  'write-permission',
  'database',
  'extractors',
  'download-test',
])
const PostCheckResultSchema = objectType({
  name: PostCheckName,
  label: stringType(),
  status: PostCheckStatus,
  message: stringType(),
  detail: stringType().optional(),
  durationMs: numberType().nonnegative(),
})
objectType({
  checks: arrayType(PostCheckResultSchema),
  allPassed: booleanType(),
  totalDurationMs: numberType().nonnegative(),
})
objectType({
  id: stringType().uuid(),
  progress: numberType().min(0).max(100),
  speed: stringType().optional(),
  eta: stringType().optional(),
  fileSize: stringType().optional(),
})
objectType({
  line: stringType(),
  timestamp: numberType(),
  level: enumType(['error', 'warn', 'info']),
})
let snapshot = null
function setSettingsSnapshot(s) {
  snapshot = DownloadSettingsSchema.parse(s)
}
function getSettings() {
  if (snapshot) return snapshot
  return DownloadSettingsSchema.parse({})
}
function clearSettingsSnapshot() {
  snapshot = null
}
const RETRY_BASE_DELAY_MS = 5e3
const RETRY_MAX_DELAY_MS = 3e5
const RETRY_DEFAULT_MAX = 3
function parseFileSizeToBytes(fileSize) {
  if (!fileSize) return -1
  const match = fileSize.match(/^([\d.]+)\s*(B|KB|KiB|MB|MiB|GB|GiB|TB|TiB)?$/i)
  if (!match) return -1
  const value = parseFloat(match[1])
  const unit = (match[2] || 'B').toUpperCase()
  const multipliers = {
    B: 1,
    KB: 1e3,
    KIB: 1024,
    MB: 1e3 * 1e3,
    MIB: 1024 * 1024,
    GB: 1e3 * 1e3 * 1e3,
    GIB: 1024 * 1024 * 1024,
    TB: 1e3 * 1e3 * 1e3 * 1e3,
    TIB: 1024 * 1024 * 1024 * 1024,
  }
  return Math.round(value * (multipliers[unit] ?? 1))
}
function applySmartOrdering(items) {
  return [...items].sort((a, b) => {
    const aSize = parseFileSizeToBytes(a.fileSize)
    const bSize = parseFileSizeToBytes(b.fileSize)
    const aKnown = aSize >= 0
    const bKnown = bSize >= 0
    if (aKnown !== bKnown) return aKnown ? -1 : 1
    if (aKnown && bKnown) {
      if (aSize !== bSize) return aSize - bSize
    }
    return b.priority - a.priority
  })
}
function classifyLogLevel(line) {
  if (/\[error\]|ERROR:|FATAL|Traceback/i.test(line)) return 'error'
  if (/\[warn\]|WARNING:|\[warning\]/i.test(line)) return 'warn'
  return 'info'
}
class QueueService {
  constructor(deps) {
    this.deps = deps
  }
  deps
  get repos() {
    return { queue: this.deps.queueRepo, history: this.deps.historyRepo }
  }
  get runtime() {
    return this.deps.runtime
  }
  get events() {
    return this.deps.events
  }
  // ── Lifecycle / Recovery ────────────────────────────────────────────
  /** Idempotent. Resets stale 'downloading' and 'retrying' rows to 'waiting' on startup. */
  runStartupRecovery() {
    const n = this.repos.queue.resetStaleDownloading()
    const m = this.repos.queue.resetStaleRetrying()
    if (n > 0 || m > 0) {
      getLogger().info(
        `Startup recovery: reset ${n} stale downloading + ${m} stale retrying to waiting`,
      )
    }
  }
  // ── Queue dispatch ──────────────────────────────────────────────────
  isProcessing = false
  /** Per-download overrides stored in memory, keyed by download ID. */
  extraFlagsByDownload = /* @__PURE__ */ new Map()
  /** Auto-retry state for downloads that failed with a retryable error. */
  retryState = /* @__PURE__ */ new Map()
  /** Picks up to N waiting downloads based on concurrency. Re-entrant
   *  via the `isProcessing` guard — nested calls no-op until the outer
   *  frame completes. When smartQueueOrdering is enabled in settings,
   *  items with known smaller file sizes are dispatched first to reduce
   *  total completion time (Shortest Job First). */
  processQueue() {
    if (!this.events.isReady()) return
    if (this.isProcessing) return
    this.isProcessing = true
    try {
      const settings = getSettings()
      const maxConcurrent = Math.max(1, settings.maxConcurrent)
      const slots = maxConcurrent - this.runtime.activeCount
      if (slots <= 0) return
      let next = this.repos.queue.findWaitingOrdered(slots)
      if (settings.smartQueueOrdering && next.length > 1) {
        next = applySmartOrdering(next)
      }
      for (const item of next) {
        if (this.runtime.activeCount >= maxConcurrent) break
        if (this.runtime.isActive(item.id)) continue
        this.startDownload(item)
      }
    } finally {
      this.isProcessing = false
    }
  }
  startDownload(item) {
    this.repos.queue.updateStatus(item.id, 'downloading')
    this.events.send('queue:changed')
    const extraFlags = this.extraFlagsByDownload.get(item.id)
    try {
      this.runtime.start(item, extraFlags, {
        onProgress: (p) => {
          this.repos.queue.updateProgress(item.id, p.progress, p.speed, p.eta, p.fileSize)
          this.events.send(buildProgressChannel(item.id), p)
        },
        onOutputLine: (line) => {
          const level = classifyLogLevel(line)
          this.events.send(buildLogChannel(item.id), {
            line,
            timestamp: Date.now(),
            level,
          })
        },
        onComplete: () => {
          this.retryState.delete(item.id)
          this.cleanRetryFlags(item.id)
          const completedAt = /* @__PURE__ */ new Date().toISOString()
          this.repos.queue.updateStatus(item.id, 'completed', completedAt)
          const row = this.findRowForArchive(item.id)
          if (row) this.repos.history.archive(row)
          this.events.send('queue:changed')
          this.processQueue()
        },
        onError: (error) => {
          this.handleDownloadError(item, error)
        },
      })
    } catch (e) {
      getLogger().error(`runtime.start failed for ${item.id}: ${e.message}`)
      this.handleDownloadError(item, e.message)
    }
  }
  /**
   * Reads back the row after a status mutation so it can be archived.
   * Done in-memory from the just-updated row; no extra SQL roundtrip —
   * we re-fetch only because we want the post-update snapshot.
   */
  findRowForArchive(id) {
    const item = this.repos.queue.findById(id)
    if (!item) return null
    return {
      id: item.id,
      url: item.url,
      title: item.title ?? null,
      status: item.status,
      progress: item.progress,
      speed: item.speed ?? null,
      eta: item.eta ?? null,
      fileSize: item.fileSize ?? null,
      outputPath: item.outputPath ?? null,
      error: item.error ?? null,
      priority: item.priority,
      createdAt: item.createdAt,
      completedAt: item.completedAt ?? null,
    }
  }
  // ── Auto-Retry Engine ─────────────────────────────────────────────
  /**
   * Classifies an error string to decide whether automatic retry is warranted.
   * Returns the retryable category, or null if the error is permanent.
   */
  classifyRetryable(error) {
    const e = error.toLowerCase()
    if (/429|too many requests|rate[\s-]?limit/i.test(e)) return 'rate_limit'
    if (
      /unable to download webpage|http error 5\d\d|connection reset|timed out|network is unreachable|temporary failure|econnrefused|econnreset|etimedout|enotfound|resolve host/i.test(
        e,
      )
    ) {
      return 'network'
    }
    if (/extractorerror|no video formats found/i.test(e)) {
      return 'extractor'
    }
    return null
  }
  /**
   * Computes a progressively lower-quality format for each retry attempt.
   * Retry 1: same format. Retry 2: 720p cap. Retry 3: worst quality.
   */
  computeFallbackFormat(retryCount, originalFormat) {
    if (retryCount <= 1) return originalFormat
    if (originalFormat.includes('bestaudio') && !originalFormat.includes('bestvideo')) {
      return retryCount >= 3 ? 'worstaudio/worst' : originalFormat
    }
    if (retryCount === 2) {
      return 'bestvideo[height<=720]+bestaudio/best[height<=720]'
    }
    return 'worstvideo+worstaudio/worst'
  }
  /**
   * Computes the exponential backoff delay with jitter.
   * delay = min(baseDelay * 2^retryCount, maxDelay) * random(0.75 .. 1.25)
   */
  computeBackoffMs(retryCount) {
    const linear = Math.min(RETRY_BASE_DELAY_MS * Math.pow(2, retryCount), RETRY_MAX_DELAY_MS)
    const jitter = 0.75 + Math.random() * 0.5
    return Math.round(linear * jitter)
  }
  /**
   * Called by startDownload's onError AND the catch block.
   * Decides whether to auto-retry or mark the download as permanently errored.
   */
  handleDownloadError(item, error) {
    const category = this.classifyRetryable(error)
    const existing = this.retryState.get(item.id)
    const retryCount = existing ? existing.retryCount : 0
    const maxRetries = existing?.maxRetries ?? RETRY_DEFAULT_MAX
    if (category && retryCount < maxRetries) {
      this.scheduleRetry(item, error, category, retryCount, maxRetries)
    } else {
      if (existing) {
        getLogger().info(
          `Download ${item.id}: auto-retry exhausted (${retryCount}/${maxRetries}). Marking as error.`,
        )
        this.cleanRetryFlags(item.id)
        this.retryState.delete(item.id)
      }
      this.repos.queue.updateStatusWithError(item.id, 'error', error)
      const row = this.findRowForArchive(item.id)
      if (row) this.repos.history.archive(row)
      this.events.send('queue:changed')
      this.processQueue()
    }
  }
  /**
   * Schedules a delayed retry with exponential backoff and fallback format.
   */
  scheduleRetry(item, error, category, retryCount, maxRetries) {
    const newRetryCount = retryCount + 1
    const delayMs = this.computeBackoffMs(newRetryCount)
    const nextRetryAt = Date.now() + delayMs
    const originalFormat =
      this.retryState.get(item.id)?.originalFormat ?? getSettings().outputFormat
    const fallbackFormat = this.computeFallbackFormat(newRetryCount, originalFormat)
    const existingFlags = this.extraFlagsByDownload.get(item.id)
    const mergedFlags = {
      ...(existingFlags ?? {}),
      outputFormat: fallbackFormat,
    }
    this.extraFlagsByDownload.set(item.id, mergedFlags)
    const retryMeta = `[AUTO-RETRY ${newRetryCount}/${maxRetries}] ${error}`
    this.repos.queue.updateStatusWithError(item.id, 'retrying', retryMeta)
    this.repos.queue.updateProgress(item.id, 0)
    const timer = setTimeout(() => {
      this.executeRetry(item.id)
    }, delayMs)
    this.retryState.set(item.id, {
      retryCount: newRetryCount,
      maxRetries,
      nextRetryAt,
      originalFormat,
      lastError: error,
      timer,
    })
    const delaySec = (delayMs / 1e3).toFixed(0)
    getLogger().info(
      `Download ${item.id}: auto-retry ${newRetryCount}/${maxRetries} in ${delaySec}s (${category}) — format: ${fallbackFormat}`,
    )
    this.events.send('queue:changed')
  }
  /**
   * Fires after the backoff timer expires. Safety-checks that the item
   * still exists and is still in 'retrying' status before re-queuing.
   */
  executeRetry(id) {
    const state2 = this.retryState.get(id)
    if (!state2) return
    state2.timer = void 0
    const item = this.repos.queue.findById(id)
    if (!item) {
      this.retryState.delete(id)
      this.extraFlagsByDownload.delete(id)
      return
    }
    if (item.status !== 'retrying') {
      this.retryState.delete(id)
      return
    }
    this.repos.queue.resetForRetry(id)
    this.events.send('queue:changed')
    this.processQueue()
  }
  /**
   * Cancel any pending retry timer and remove retry state for a download.
   * Safe to call even if no retry is pending.
   */
  clearRetryState(id) {
    const state2 = this.retryState.get(id)
    if (!state2) return
    if (state2.timer) {
      clearTimeout(state2.timer)
    }
    this.retryState.delete(id)
    this.cleanRetryFlags(id)
  }
  /** Strip the injected outputFormat from extraFlags (keep other flags intact). */
  cleanRetryFlags(id) {
    const flags = this.extraFlagsByDownload.get(id)
    if (!flags?.outputFormat) return
    delete flags.outputFormat
    if (Object.keys(flags).length === 0) {
      this.extraFlagsByDownload.delete(id)
    }
  }
  async add(input) {
    if (!input.url) {
      return err('INVALID_INPUT', 'URL is required')
    }
    if (input.priority !== void 0 && (input.priority < 1 || input.priority > 10)) {
      return err('INVALID_INPUT', 'priority must be between 1 and 10')
    }
    const id = randomUUID()
    const createdAt = /* @__PURE__ */ new Date().toISOString()
    const priority = input.priority ?? 5
    try {
      this.repos.queue.create({ id, url: input.url, priority, title: void 0 }, createdAt)
      if (input.extraFlags && Object.keys(input.extraFlags).length > 0) {
        this.extraFlagsByDownload.set(id, input.extraFlags)
      }
    } catch (e) {
      return err('DB_ERROR', e.message)
    }
    const item = this.repos.queue.findById(id)
    if (!item) {
      return err('INTERNAL_ERROR', 'Created download disappeared')
    }
    this.events.send('queue:changed')
    this.processQueue()
    return ok(item)
  }
  /** Update a download's persisted title (e.g. after metadata enrichment). */
  setTitle(id, title) {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    this.repos.queue.updateTitle(id, title)
    this.events.send('queue:changed')
    return ok(void 0)
  }
  async addBatch(input) {
    const trimmed = input.urls.map((u) => u.trim()).filter(Boolean)
    const seen = /* @__PURE__ */ new Set()
    const unique = []
    for (const u of trimmed) {
      const key = u.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(u)
      }
    }
    const activeStatuses = /* @__PURE__ */ new Set([
      'waiting',
      'downloading',
      'paused',
      'retrying',
      'fetching_metadata',
      'preparing',
      'merging',
      'embedding',
      'verifying',
    ])
    const existing = new Set(
      this.repos.queue
        .findAll()
        .filter((item) => activeStatuses.has(item.status))
        .map((item) => item.url.trim().toLowerCase()),
    )
    const newUrls = unique.filter((u) => !existing.has(u.trim().toLowerCase()))
    const skipped = trimmed.length - newUrls.length
    if (skipped > 0) {
      getLogger().info(
        `Batch add: ${skipped} duplicate URL(s) skipped (${newUrls.length} new, ${trimmed.length} submitted)`,
      )
    }
    const out = []
    for (const url of newUrls) {
      const r = await this.add({ url, priority: input.priority, extraFlags: input.extraFlags })
      if (!r.ok) return r
      out.push(r.data)
    }
    return ok(out)
  }
  pause(id) {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    this.runtime.cancel(id)
    this.clearRetryState(id)
    this.repos.queue.updateStatus(id, 'paused')
    this.events.send('queue:changed')
    this.processQueue()
    return ok(void 0)
  }
  resume(id) {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    this.clearRetryState(id)
    this.repos.queue.updateStatus(id, 'waiting')
    this.events.send('queue:changed')
    this.processQueue()
    return ok(void 0)
  }
  cancel(id) {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    this.runtime.cancel(id)
    this.clearRetryState(id)
    this.repos.queue.updateStatus(id, 'cancelled')
    this.events.send('queue:changed')
    this.processQueue()
    return ok(void 0)
  }
  remove(id) {
    const row = this.findRowForArchive(id)
    if (!row) return err('NOT_FOUND', `No download with id ${id}`)
    this.runtime.cancel(id)
    this.clearRetryState(id)
    this.extraFlagsByDownload.delete(id)
    if (row.status !== 'completed' && row.status !== 'error' && row.status !== 'cancelled') {
      this.repos.history.archive(row)
    }
    this.repos.queue.deleteByIds([id])
    this.events.send('queue:changed')
    return ok(void 0)
  }
  retry(id) {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    this.clearRetryState(id)
    const flags = this.extraFlagsByDownload.get(id)
    if (flags?.outputFormat) {
      delete flags.outputFormat
      if (Object.keys(flags).length === 0) {
        this.extraFlagsByDownload.delete(id)
      }
    }
    this.repos.queue.resetForRetry(id)
    this.events.send('queue:changed')
    this.processQueue()
    const item = this.repos.queue.findById(id)
    return item ? ok(item) : err('INTERNAL_ERROR', 'Retry target lost')
  }
  clearCompleted() {
    const all = this.repos.queue.findAll()
    const finished = all.filter(
      (i) => i.status === 'completed' || i.status === 'error' || i.status === 'cancelled',
    )
    for (const item of finished) {
      this.repos.history.archive(this.findRowForArchive(item.id))
    }
    for (const item of finished) {
      this.extraFlagsByDownload.delete(item.id)
    }
    const removed = this.repos.queue.deleteFinished()
    getLogger().info(`Archived and cleared ${removed} finished download(s)`)
    this.events.send('queue:changed')
    return ok({ removed })
  }
  // ── Queries ─────────────────────────────────────────────────────────
  getAll() {
    return ok(this.repos.queue.findAll())
  }
  get(id) {
    return ok(this.repos.queue.findById(id))
  }
  reorder(id, direction) {
    const item = this.repos.queue.findById(id)
    if (!item) return err('NOT_FOUND', `No download with id ${id}`)
    if (item.status !== 'waiting') {
      return err('INVALID_INPUT', 'Only waiting items can be reordered')
    }
    const delta = direction === 'up' ? 1 : -1
    const newPriority = Math.max(1, Math.min(10, item.priority + delta))
    if (newPriority !== item.priority) {
      this.repos.queue.updatePriority(id, newPriority)
      this.events.send('queue:changed')
    }
    return ok(void 0)
  }
  /** Drag-and-drop reorder: move a waiting item to a specific position index
   *  among other waiting items, computing a new priority from its neighbors. */
  reorderToPosition(id, newIndex) {
    const item = this.repos.queue.findById(id)
    if (!item) return err('NOT_FOUND', `No download with id ${id}`)
    if (item.status !== 'waiting') {
      return err('INVALID_INPUT', 'Only waiting items can be reordered')
    }
    const waiting = this.repos.queue.findWaitingOrdered(9999)
    if (waiting.length < 2) return ok(void 0)
    const currentIdx = waiting.findIndex((w) => w.id === id)
    if (currentIdx === -1) return ok(void 0)
    if (currentIdx === newIndex) return ok(void 0)
    const others = waiting.filter((w) => w.id !== id)
    const clampedIdx = Math.max(0, Math.min(newIndex, others.length))
    let newPriority
    if (clampedIdx === 0) {
      newPriority = Math.min(10, (others[0]?.priority ?? 5) + 1)
    } else if (clampedIdx >= others.length) {
      newPriority = Math.max(1, (others[others.length - 1]?.priority ?? 5) - 1)
    } else {
      const above = others[clampedIdx - 1]?.priority ?? 10
      const below = others[clampedIdx]?.priority ?? 1
      newPriority = Math.round((above + below) / 2)
      if (newPriority === above && above > 1) newPriority = above - 1
      else if (newPriority === below && below < 10) newPriority = below + 1
    }
    newPriority = Math.max(1, Math.min(10, newPriority))
    if (newPriority !== item.priority) {
      this.repos.queue.updatePriority(id, newPriority)
      this.events.send('queue:changed')
    }
    return ok(void 0)
  }
  /** Read per-download extra flags for an existing queue item. */
  getExtraFlags(id) {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    return ok(this.extraFlagsByDownload.get(id) ?? null)
  }
  /** Update per-download extra flags for an existing queue item. */
  updateExtraFlags(id, flags) {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    if (Object.keys(flags).length > 0) {
      this.extraFlagsByDownload.set(id, { ...flags })
    } else {
      this.extraFlagsByDownload.delete(id)
    }
    return ok(void 0)
  }
  /** Set or clear a per-download speed limit override. */
  setSpeedLimit(id, limit) {
    if (!this.repos.queue.findById(id)) return err('NOT_FOUND', `No download with id ${id}`)
    const flags = this.extraFlagsByDownload.get(id)
    if (limit) {
      if (flags) {
        flags.speedLimit = limit
      } else {
        this.extraFlagsByDownload.set(id, { speedLimit: limit })
      }
    } else if (flags) {
      delete flags.speedLimit
      if (Object.keys(flags).length === 0) {
        this.extraFlagsByDownload.delete(id)
      }
    }
    return ok(void 0)
  }
  getStats() {
    return ok(this.repos.queue.countStats())
  }
  async fetchMetadata(url) {
    if (!url) return err('INVALID_INPUT', 'URL is required')
    try {
      const meta = await this.runtime.fetchMetadata(url)
      return ok(meta)
    } catch (e) {
      return err('YT_DLP_ERROR', e.message)
    }
  }
  async fetchPlaylist(url) {
    if (!url) return err('INVALID_INPUT', 'URL is required')
    try {
      const result = await this.runtime.fetchPlaylist(url)
      return ok(result)
    } catch (e) {
      return err('YT_DLP_ERROR', e.message)
    }
  }
  /**
   * Estimate the total download size of a batch of URLs by fetching metadata
   * for each (in parallel, capped at 5 concurrent) and summing up the
   * largest available format size per URL.
   *
   * Returns: estimatedBytes (sum of best estimates), resolvable (count of
   * URLs where we got a size), total (total URLs submitted).
   */
  async estimateBatchSize(urls) {
    if (!urls.length) return err('INVALID_INPUT', 'urls must be non-empty')
    const CONCURRENCY = 5
    let estimatedBytes = 0
    let resolvable = 0
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      const chunk = urls.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(
        chunk.map(async (url) => {
          try {
            const meta = await this.runtime.fetchMetadata(url)
            return meta
          } catch {
            return null
          }
        }),
      )
      for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value) continue
        const meta = result.value
        let maxSize = 0
        if (meta.formats) {
          for (const fmt of meta.formats) {
            const size = fmt.filesize ?? fmt.filesizeApprox ?? 0
            if (size > maxSize) maxSize = size
          }
        }
        if (maxSize > 0) {
          estimatedBytes += maxSize
          resolvable++
        }
      }
    }
    return ok({ estimatedBytes, resolvable, total: urls.length })
  }
}
class HistoryService {
  constructor(deps) {
    this.deps = deps
  }
  deps
  /** Return at most `limit` most-recent archived downloads. */
  list(limit = 500) {
    return ok(this.deps.historyRepo.findAll(limit))
  }
  findById(id) {
    return ok(this.deps.historyRepo.findById(id))
  }
  count() {
    return ok(this.deps.historyRepo.count())
  }
  deleteByIds(ids) {
    if (ids.length === 0) return err('INVALID_INPUT', 'ids must be non-empty')
    return ok({ removed: this.deps.historyRepo.deleteByIds(ids) })
  }
  purgeOlderThan(days) {
    if (days < 1) return err('INVALID_INPUT', 'days must be >= 1')
    const cutoff = /* @__PURE__ */ new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return ok({ removed: this.deps.historyRepo.deleteOlderThan(cutoff.toISOString()) })
  }
}
const SHELL_METACHAR = /[;&|`$(){}[\]<>!#*\n\r]/
function validateDownloadDirectory(dir) {
  if (!dir || typeof dir !== 'string') {
    throw new Error('Download directory is required')
  }
  if (dir.includes('\0')) {
    throw new Error('Download directory contains invalid characters')
  }
  return path.resolve(dir.trim())
}
function validateExecutablePath(exePath) {
  if (!exePath || typeof exePath !== 'string') {
    throw new Error('Executable path is required')
  }
  const trimmed = exePath.trim()
  if (!trimmed) {
    throw new Error('Executable path is required')
  }
  if (SHELL_METACHAR.test(trimmed)) {
    throw new Error('Executable path contains invalid characters')
  }
  return trimmed
}
function validateShellPath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Path is required')
  }
  if (filePath.includes('\0')) {
    throw new Error('Path contains invalid characters')
  }
  return path.resolve(filePath.trim())
}
const PRESETS_KEY = '__downloadPresets__'
class SettingsService {
  constructor(deps) {
    this.deps = deps
  }
  deps
  /** Read and validate. Caches result in the runtime snapshot. */
  get() {
    const raw = this.deps.settingsRepo.loadAll()
    const parsed = DownloadSettingsSchema.safeParse(raw)
    if (!parsed.success) {
      const defaults = DownloadSettingsSchema.parse({})
      setSettingsSnapshot(defaults)
      return ok(defaults)
    }
    setSettingsSnapshot(parsed.data)
    return ok(parsed.data)
  }
  /** Validate & persist a patch; reset cache on failure. */
  update(patch) {
    const current = DownloadSettingsSchema.parse(this.deps.settingsRepo.loadAll())
    const candidate = { ...current, ...patch }
    if (candidate.downloadPath) {
      const r = validateDownloadDirectory(candidate.downloadPath)
      candidate.downloadPath = r
    }
    if (candidate.ytdlpPath) {
      candidate.ytdlpPath = validateExecutablePath(candidate.ytdlpPath)
    }
    if (candidate.ffmpegPath) {
      candidate.ffmpegPath = validateExecutablePath(candidate.ffmpegPath)
    }
    const validated = DownloadSettingsSchema.safeParse(candidate)
    if (!validated.success) {
      return err('INVALID_INPUT', validated.error.issues[0]?.message ?? 'Invalid settings')
    }
    try {
      this.deps.settingsRepo.patch(validated.data)
    } catch (e) {
      return err('DB_ERROR', e.message)
    }
    setSettingsSnapshot(validated.data)
    return ok(void 0)
  }
  /** Wipe all settings; next get() returns schema defaults. */
  reset() {
    try {
      this.deps.settingsRepo.reset()
    } catch (e) {
      return err('DB_ERROR', e.message)
    }
    clearSettingsSnapshot()
    return ok(void 0)
  }
  /** Return the current validated settings (export convenience). */
  export() {
    return this.get()
  }
  /** Replace all settings from a (possibly partial) imported object. */
  import(data) {
    return this.update(data)
  }
  /** Read saved download presets. Always returns an array (empty if none). */
  getPresets() {
    try {
      const raw = this.deps.settingsRepo.getJson(PRESETS_KEY)
      if (!Array.isArray(raw)) return ok([])
      const validated = []
      for (const item of raw) {
        const parsed = PresetSchema.safeParse(item)
        if (parsed.success) validated.push(parsed.data)
      }
      return ok(validated)
    } catch (e) {
      return err('DB_ERROR', e.message)
    }
  }
  /** Persist the full presets array. */
  savePresets(presets) {
    try {
      for (const p of presets) PresetSchema.parse(p)
      this.deps.settingsRepo.setJson(PRESETS_KEY, presets)
      return ok(void 0)
    } catch (e) {
      return err('INVALID_INPUT', e.message)
    }
  }
}
function getBundledBinPath(name) {
  try {
    if (app.isPackaged) {
      const candidate = join(process.resourcesPath, 'bin', name)
      if (existsSync(candidate)) return candidate
    }
    const devCandidate = join(app.getAppPath(), 'bin', name)
    if (existsSync(devCandidate)) return devCandidate
    return null
  } catch {
    return null
  }
}
function getBinDir() {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'bin')
  }
  return join(app.getAppPath(), 'bin')
}
function resolveYtDlpPath() {
  const settings = getSettings()
  if (settings.ytdlpPath) {
    getLogger().debug(`Using configured yt-dlp: ${settings.ytdlpPath}`)
    return validateExecutablePath(settings.ytdlpPath)
  }
  const bundledName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
  const bundled = getBundledBinPath(bundledName)
  if (bundled) {
    getLogger().debug(`Using bundled yt-dlp: ${bundled}`)
    return bundled
  }
  getLogger().debug('Using yt-dlp from system PATH')
  return validateExecutablePath('yt-dlp')
}
function resolveFfmpegPath() {
  const settings = getSettings()
  if (settings.ffmpegPath) {
    getLogger().debug(`Using configured ffmpeg: ${settings.ffmpegPath}`)
    return validateExecutablePath(settings.ffmpegPath)
  }
  const bundled = getBundledBinPath('ffmpeg.exe')
  if (bundled) {
    getLogger().debug(`Using bundled ffmpeg: ${bundled}`)
    return bundled
  }
  getLogger().debug('Using ffmpeg from system PATH')
  return validateExecutablePath('ffmpeg')
}
function extractYtDlpVersion(binPath) {
  const out = execFileSync(binPath, ['--version'], {
    encoding: 'utf-8',
    timeout: 1e4,
  })
  return out.trim() || 'unknown'
}
function extractFfmpegVersion(binPath) {
  const result = spawnSync(binPath, ['-version'], {
    encoding: 'utf-8',
    timeout: 1e4,
  })
  const output = (result.stderr || result.stdout || '').trim()
  const firstLine = output.split('\n')[0] ?? ''
  const version2 = firstLine.replace(/^ffmpeg version\s+/, '').split(' ')[0]
  return version2 || 'unknown'
}
function getYtDlpVersion() {
  try {
    return extractYtDlpVersion(resolveYtDlpPath())
  } catch (e) {
    getLogger().warn(`yt-dlp version query failed: ${e.message}`)
    return 'unknown'
  }
}
function getFfmpegVersion() {
  try {
    return extractFfmpegVersion(resolveFfmpegPath())
  } catch (e) {
    getLogger().warn(`ffmpeg version query failed: ${e.message}`)
    return 'unknown'
  }
}
async function checkAndUpdateYtDlpAsync() {
  const current = getYtDlpVersion()
  let latest = null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8e3)
    const res = await fetch('https://pypi.org/pypi/yt-dlp/json', {
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (res.ok) {
      const data = await res.json()
      latest = data?.info?.version ?? null
    }
  } catch {
    getLogger().warn('Failed to fetch latest yt-dlp version from PyPI')
  }
  if (!latest) {
    const ytdlp = resolveYtDlpPath()
    try {
      execFileSync(ytdlp, ['-U'], { encoding: 'utf-8', timeout: 6e4 })
    } catch (e) {
      getLogger().error(`yt-dlp -U failed: ${e.message}`)
      throw new Error(`yt-dlp self-update failed: ${e.message}`)
    }
    const newVersion2 = getYtDlpVersion()
    const updated = newVersion2 !== current
    return { current, latest: newVersion2, updated, newVersion: newVersion2 }
  }
  if (latest === current) {
    return { current, latest, updated: false, newVersion: current }
  }
  try {
    const ytdlp = resolveYtDlpPath()
    execFileSync(ytdlp, ['-U'], { encoding: 'utf-8', timeout: 6e4 })
    getLogger().info(`yt-dlp updated from ${current} to latest ${latest}`)
  } catch (e) {
    getLogger().error(`yt-dlp -U failed: ${e.message}`)
    throw new Error(`yt-dlp self-update failed: ${e.message}`)
  }
  const newVersion = getYtDlpVersion()
  return { current, latest, updated: true, newVersion }
}
function checkBinaryHealth(name) {
  try {
    const resolver = name === 'yt-dlp' ? resolveYtDlpPath : resolveFfmpegPath
    const binPath = resolver()
    if (!existsSync(binPath)) {
      return {
        name,
        status: 'missing',
        version: '',
        path: binPath,
        error: `File not found: ${binPath}`,
      }
    }
    try {
      const stat = statSync(binPath)
      if (!stat.isFile()) {
        return {
          name,
          status: 'corrupted',
          version: '',
          path: binPath,
          error: `Path is not a file: ${binPath}`,
        }
      }
    } catch {
      return {
        name,
        status: 'corrupted',
        version: '',
        path: binPath,
        error: `Cannot stat file: ${binPath}`,
      }
    }
    try {
      const version2 =
        name === 'yt-dlp' ? extractYtDlpVersion(binPath) : extractFfmpegVersion(binPath)
      if (version2 && version2 !== 'unknown') {
        return {
          name,
          status: 'ok',
          version: version2,
          path: binPath,
        }
      }
      return {
        name,
        status: 'corrupted',
        version: version2 || '',
        path: binPath,
        error: 'Binary executed but returned no recognizable version',
      }
    } catch (e) {
      return {
        name,
        status: 'corrupted',
        version: '',
        path: binPath,
        error: `Execution failed: ${e.message}`,
      }
    }
  } catch (e) {
    return {
      name,
      status: 'unknown',
      version: '',
      error: `Path resolution failed: ${e.message}`,
    }
  }
}
async function repairYtDlp() {
  try {
    const binPath = resolveYtDlpPath()
    if (existsSync(binPath)) {
      let preVersion = ''
      let isHealthy = false
      try {
        preVersion = extractYtDlpVersion(binPath)
        isHealthy = preVersion !== '' && preVersion !== 'unknown'
      } catch {}
      if (isHealthy) {
        try {
          getLogger().info(`Repairing yt-dlp via ${binPath} -U`)
          const out = execFileSync(binPath, ['-U'], {
            encoding: 'utf-8',
            timeout: 6e4,
          })
          getLogger().info(`yt-dlp -U output: ${out.slice(0, 500)}`)
          const newVersion = extractYtDlpVersion(binPath)
          return {
            rebuilt: true,
            version: newVersion,
            message: `yt-dlp updated to ${newVersion}`,
          }
        } catch (e) {
          getLogger().warn(`yt-dlp -U failed: ${e.message}`)
          return {
            rebuilt: false,
            version: preVersion,
            message: `yt-dlp ${preVersion} is working but could not be updated: ${e.message}`,
          }
        }
      }
      getLogger().warn(`yt-dlp at ${binPath} appears corrupted — will attempt download`)
    }
    getLogger().info('yt-dlp not found or update failed — attempting auto-download...')
    const dlResult = await downloadYtDlp()
    if (dlResult.rebuilt) {
      return dlResult
    }
    return {
      rebuilt: false,
      version: '',
      message: `yt-dlp auto-download failed: ${dlResult.message}. Install yt-dlp from https://github.com/yt-dlp/yt-dlp/releases or add it to your PATH.`,
    }
  } catch (e) {
    const msg = e.message
    getLogger().error(`yt-dlp repair failed: ${msg}`)
    return {
      rebuilt: false,
      version: '',
      message: `yt-dlp repair failed: ${msg}`,
    }
  }
}
const YTDLP_GITHUB_API = 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'
async function downloadYtDlp() {
  try {
    const platform = process.platform
    let assetPattern
    let binaryName
    if (platform === 'win32') {
      assetPattern = /^yt-dlp\.exe$/
      binaryName = 'yt-dlp.exe'
    } else if (platform === 'darwin') {
      assetPattern = /^yt-dlp_macos$/
      binaryName = 'yt-dlp'
    } else {
      assetPattern = /^yt-dlp$/
      binaryName = 'yt-dlp'
    }
    getLogger().info('Fetching yt-dlp release info from GitHub...')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15e3)
    const releaseRes = await fetch(YTDLP_GITHUB_API, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!releaseRes.ok) {
      return {
        rebuilt: false,
        version: '',
        message: `GitHub API returned ${releaseRes.status}: ${releaseRes.statusText}`,
      }
    }
    const release = await releaseRes.json()
    const asset = release.assets?.find((a) => assetPattern.test(a.name))
    if (!asset) {
      return {
        rebuilt: false,
        version: '',
        message: `No matching yt-dlp asset found for ${platform}`,
      }
    }
    getLogger().info(`Found yt-dlp asset: ${asset.name}`)
    const binDir = getBinDir()
    mkdirSync(binDir, { recursive: true })
    const destPath = join(binDir, binaryName)
    getLogger().info(`Downloading ${asset.name} to ${destPath}...`)
    const dlController = new AbortController()
    const dlTimeout = setTimeout(() => dlController.abort(), 12e4)
    const dlRes = await fetch(asset.browser_download_url, {
      signal: dlController.signal,
    })
    clearTimeout(dlTimeout)
    if (!dlRes.ok) {
      return {
        rebuilt: false,
        version: '',
        message: `Download failed: HTTP ${dlRes.status}`,
      }
    }
    const buffer = Buffer.from(await dlRes.arrayBuffer())
    writeFileSync(destPath, buffer)
    getLogger().info(
      `Downloaded ${asset.name} to ${destPath} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`,
    )
    if (platform !== 'win32') {
      try {
        chmodSync(destPath, 493)
      } catch {}
    }
    try {
      const version2 = extractYtDlpVersion(destPath)
      if (version2 && version2 !== 'unknown') {
        getLogger().info(`yt-dlp auto-download success: ${version2} at ${destPath}`)
        return {
          rebuilt: true,
          version: version2,
          message: `yt-dlp ${version2} downloaded and installed to bin/`,
        }
      }
      return {
        rebuilt: false,
        version: '',
        message: 'Downloaded binary failed version check',
      }
    } catch (e) {
      return {
        rebuilt: false,
        version: '',
        message: `Downloaded binary does not run: ${e.message}`,
      }
    }
  } catch (e) {
    const msg = e.message
    getLogger().error(`yt-dlp auto-download failed: ${msg}`)
    return {
      rebuilt: false,
      version: '',
      message: `Auto-download failed: ${msg}`,
    }
  }
}
async function repairFfmpeg() {
  try {
    const platform = process.platform
    const binaryName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    const bundled = getBundledBinPath(binaryName)
    if (bundled && existsSync(bundled)) {
      try {
        const version2 = extractFfmpegVersion(bundled)
        if (version2 && version2 !== 'unknown') {
          return {
            rebuilt: true,
            version: version2,
            message: `Bundled ffmpeg found at ${bundled} — version ${version2}`,
          }
        }
      } catch {}
    }
    try {
      const version2 = extractFfmpegVersion('ffmpeg')
      if (version2 && version2 !== 'unknown') {
        return {
          rebuilt: true,
          version: version2,
          message: `System ffmpeg found — version ${version2}`,
        }
      }
    } catch {}
    getLogger().info('ffmpeg not found — attempting auto-download...')
    const dlResult = await downloadFfmpeg()
    if (dlResult.rebuilt) {
      return dlResult
    }
    const installGuide =
      platform === 'win32'
        ? 'Download ffmpeg from https://ffmpeg.org/download.html and add it to your PATH.'
        : platform === 'darwin'
          ? 'Install ffmpeg via Homebrew: brew install ffmpeg'
          : 'Install ffmpeg via your package manager: sudo apt install ffmpeg'
    return {
      rebuilt: false,
      version: '',
      message: `Auto-download failed: ${dlResult.message}. ${installGuide}`,
    }
  } catch (e) {
    const msg = e.message
    getLogger().error(`ffmpeg repair failed: ${msg}`)
    return {
      rebuilt: false,
      version: '',
      message: `ffmpeg repair failed: ${msg}`,
    }
  }
}
const GITHUB_API_RELEASES = 'https://api.github.com/repos/BtbN/FFmpeg-Builds/releases/latest'
async function downloadFfmpeg() {
  try {
    const platform = process.platform
    let assetPattern
    let binaryName
    if (platform === 'win32') {
      assetPattern = /ffmpeg-master-latest-win64-gpl\.zip/
      binaryName = 'ffmpeg.exe'
    } else if (platform === 'darwin') {
      assetPattern = /ffmpeg-master-latest-macos64-gpl\.tar\.xz/
      binaryName = 'ffmpeg'
    } else {
      assetPattern = /ffmpeg-master-latest-linux64-gpl\.tar\.xz/
      binaryName = 'ffmpeg'
    }
    getLogger().info('Fetching ffmpeg release info from GitHub...')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15e3)
    const releaseRes = await fetch(GITHUB_API_RELEASES, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!releaseRes.ok) {
      return {
        rebuilt: false,
        version: '',
        message: `GitHub API returned ${releaseRes.status}: ${releaseRes.statusText}`,
      }
    }
    const release = await releaseRes.json()
    const asset = release.assets?.find((a) => assetPattern.test(a.name))
    if (!asset) {
      return {
        rebuilt: false,
        version: '',
        message: `No matching ffmpeg asset found for ${platform}`,
      }
    }
    getLogger().info(`Found ffmpeg asset: ${asset.name}`)
    const binDir = getBinDir()
    mkdirSync(binDir, { recursive: true })
    const archiveExt = platform === 'win32' ? '.zip' : '.tar.xz'
    const archivePath = join(os.tmpdir(), `ffmpeg-dl-${Date.now()}${archiveExt}`)
    getLogger().info(`Downloading ${asset.name} to ${archivePath}...`)
    const dlController = new AbortController()
    const dlTimeout = setTimeout(() => dlController.abort(), 12e4)
    const dlRes = await fetch(asset.browser_download_url, {
      signal: dlController.signal,
    })
    clearTimeout(dlTimeout)
    if (!dlRes.ok) {
      return {
        rebuilt: false,
        version: '',
        message: `Download failed: HTTP ${dlRes.status}`,
      }
    }
    const buffer = Buffer.from(await dlRes.arrayBuffer())
    writeFileSync(archivePath, buffer)
    getLogger().info(`Downloaded ${asset.name} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`)
    getLogger().info(`Extracting ${asset.name}...`)
    try {
      if (platform === 'win32') {
        execFileSync(
          'powershell',
          [
            '-NoProfile',
            '-Command',
            `Expand-Archive -Path "${archivePath}" -DestinationPath "${binDir}" -Force`,
          ],
          { encoding: 'utf-8', timeout: 6e4 },
        )
      } else {
        execFileSync('tar', ['-xJf', archivePath, '-C', binDir], {
          encoding: 'utf-8',
          timeout: 6e4,
        })
      }
    } finally {
      try {
        unlinkSync(archivePath)
      } catch {}
    }
    const binPath = findExtractedBinary(binDir, binaryName)
    if (!binPath) {
      const altBinPath = findExtractedBinary(
        binDir,
        binaryName === 'ffmpeg.exe' ? 'ffmpeg' : 'ffmpeg',
      )
      if (!altBinPath) {
        return {
          rebuilt: false,
          version: '',
          message: `Extraction completed but could not find ${binaryName} in ${binDir}`,
        }
      }
    }
    const finalPath = binPath ?? findExtractedBinary(binDir, 'ffmpeg')
    if (platform !== 'win32') {
      try {
        chmodSync(finalPath, 493)
      } catch {}
    }
    try {
      const version2 = extractFfmpegVersion(finalPath)
      if (version2 && version2 !== 'unknown') {
        getLogger().info(`ffmpeg auto-download success: ${version2} at ${finalPath}`)
        return {
          rebuilt: true,
          version: version2,
          message: `ffmpeg ${version2} downloaded and installed to bin/`,
        }
      }
      return {
        rebuilt: false,
        version: '',
        message: 'Downloaded binary failed version check',
      }
    } catch (e) {
      return {
        rebuilt: false,
        version: '',
        message: `Downloaded binary does not run: ${e.message}`,
      }
    }
  } catch (e) {
    const msg = e.message
    getLogger().error(`ffmpeg auto-download failed: ${msg}`)
    return {
      rebuilt: false,
      version: '',
      message: `Auto-download failed: ${msg}`,
    }
  }
}
function findExtractedBinary(rootDir, targetName) {
  try {
    const stack = [rootDir]
    const visited = /* @__PURE__ */ new Set()
    while (stack.length > 0) {
      const dir = stack.pop()
      if (visited.has(dir)) continue
      visited.add(dir)
      let entries
      try {
        entries = readdirSync(dir)
      } catch {
        continue
      }
      for (const entry of entries) {
        const fullPath = join(dir, entry)
        try {
          const s = statSync(fullPath)
          if (s.isDirectory()) {
            stack.push(fullPath)
          } else if (s.isFile() && entry === targetName) {
            return fullPath
          }
        } catch {
          continue
        }
      }
    }
    return null
  } catch {
    return null
  }
}
function detectExtractor(url) {
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\//i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\//i,
  ]
  for (const p of youtubePatterns) {
    if (p.test(url)) return 'youtube'
  }
  return 'generic'
}
const conflictRules = {
  mutuallyExclusive: [
    ['--cookies', '--cookies-from-browser'],
    ['--username', '--netrc'],
  ],
}
class BuildError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
    this.name = 'BuildError'
  }
  code
}
function buildCommand(input) {
  const settings = { ...getSettings(), ...input.overrides }
  const extractor = detectExtractor(input.url)
  const warnings = []
  const flags = /* @__PURE__ */ new Map()
  const ef = input.extraFlags ?? {}
  const outputFormat = ef.outputFormat ?? settings.outputFormat
  if (outputFormat) {
    flags.set('-f', outputFormat)
  }
  if (settings.extractAudio) {
    flags.set('-x', true)
    if (settings.audioFormat) {
      flags.set('--audio-format', settings.audioFormat)
    }
  }
  if (settings.embedMetadata) {
    flags.set('--embed-metadata', true)
  }
  const effectiveSpeedLimit = ef.speedLimit ?? settings.speedLimit
  if (effectiveSpeedLimit) {
    flags.set('-r', effectiveSpeedLimit)
  }
  const downloadDir = resolveDownloadDir(settings)
  const dir = downloadDir.replace(/\\/g, '/')
  const template = settings.namingTemplate || '%(title)s.%(ext)s'
  flags.set('-o', `${dir}/${template}`)
  if (extractor === 'youtube') {
    if (!flags.has('--embed-metadata')) {
      flags.set('--embed-metadata', true)
    }
  }
  if (ef.speedLimit);
  if (ef.cookiesFile) {
    flags.set('--cookies', ef.cookiesFile)
  }
  if (ef.browserCookies) {
    flags.set('--cookies-from-browser', ef.browserCookies)
  }
  if (ef.username) {
    flags.set('--username', ef.username)
    if (ef.password) {
      flags.set('--password', ef.password)
    }
  }
  if (ef.netrc) {
    flags.set('--netrc', true)
  }
  if (ef.subtitleLangs && ef.subtitleLangs.length > 0) {
    flags.set('--sub-langs', ef.subtitleLangs.join(','))
  }
  if (ef.embedSubs) {
    flags.set('--embed-subs', true)
  }
  if (ef.proxy) {
    flags.set('--proxy', ef.proxy)
  }
  if (ef.userAgent) {
    flags.set('--user-agent', ef.userAgent)
  }
  if (ef.referer) {
    flags.set('--referer', ef.referer)
  }
  if (ef.playlistStart !== void 0) {
    flags.set('--playlist-start', String(ef.playlistStart))
  }
  if (ef.playlistEnd !== void 0) {
    flags.set('--playlist-end', String(ef.playlistEnd))
  }
  if (ef.noPlaylist) {
    flags.set('--no-playlist', true)
  }
  for (const group of conflictRules.mutuallyExclusive) {
    const present = group.filter((f) => flags.has(f))
    if (present.length > 1) {
      const winner = resolveConflict(group, present)
      for (const flag of present) {
        if (flag !== winner) {
          flags.delete(flag)
          warnings.push(`Flag ${flag} dropped: mutually exclusive with ${winner}`)
        }
      }
    }
  }
  if (flags.has('-x')) {
    const fmt = flags.get('-f')
    if (typeof fmt === 'string' && fmt.includes('+')) {
      const parts = fmt.split('+')
      const hasVideo = parts.some(
        (p) => p !== 'bestaudio' && p !== 'worstaudio' && p !== 'ba' && p !== 'wa',
      )
      if (hasVideo) {
        throw new BuildError(
          `Format '${fmt}' includes video but --extract-audio is set. Use audio-only format.`,
          'INVALID_COMBINATION',
        )
      }
    }
  }
  if (flags.has('--username') && !flags.has('--password')) {
    warnings.push('--username set without --password; some sites may prompt interactively')
  }
  const args = []
  for (const [flag, value] of flags) {
    args.push(flag)
    if (value !== true) {
      args.push(value)
    }
  }
  args.push(input.url)
  getLogger().debug(
    `CommandBuilder: extractor=${extractor} flags=[${args.join(', ')}] warnings=${warnings.length}`,
  )
  return { args, warnings, extractor }
}
function resolveConflict(group, present) {
  if (present.includes('--cookies') && present.includes('--cookies-from-browser')) {
    return '--cookies'
  }
  if (present.includes('--netrc') && present.includes('--username')) {
    return '--username'
  }
  return present[0]
}
const progressRegex =
  /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+~?([\d.]+\w+)\s+at\s+([\d.]+\w+\/s)\s+ETA\s+([\d:]+)/
const progressFallbackRegex = /\[download\]\s+(\d+(?:\.\d+)?)%/
function parseProgressLine(line) {
  const m = line.match(progressRegex)
  if (m) {
    return {
      progress: parseFloat(m[1]),
      fileSize: m[2],
      speed: m[3],
      eta: m[4],
    }
  }
  const fb = line.match(progressFallbackRegex)
  if (fb) {
    return { progress: parseFloat(fb[1]) }
  }
  return null
}
function normalizePlaylistNdjson(lines, playlistUrl, stderr) {
  const items = []
  const errors2 = {}
  let metadata2 = { title: '' }
  for (const line of lines) {
    try {
      const entry = JSON.parse(line)
      if (entry._type === 'playlist') {
        metadata2 = {
          title: String(entry.title ?? ''),
          channel: typeof entry.channel === 'string' ? entry.channel : void 0,
          totalExpected: Array.isArray(entry.entries) ? entry.entries.length : void 0,
        }
        continue
      }
      if (entry.id) {
        items.push({
          id: String(entry.id),
          url:
            typeof entry.webpage_url === 'string'
              ? entry.webpage_url
              : typeof entry.url === 'string'
                ? entry.url
                : `${playlistUrl}&v=${entry.id}`,
          title: String(entry.title ?? ''),
          duration: typeof entry.duration === 'number' ? entry.duration : void 0,
          thumbnail: typeof entry.thumbnail === 'string' ? entry.thumbnail : void 0,
          uploader: typeof entry.uploader === 'string' ? entry.uploader : void 0,
          index: typeof entry.playlist_index === 'number' ? entry.playlist_index : void 0,
        })
      }
    } catch {}
  }
  if (stderr.trim()) {
    const errLines = stderr.trim().split('\n')
    for (let i = 0; i < errLines.length; i++) {
      const el = errLines[i]
      if (el.includes('ERROR:') || el.includes('WARNING:')) {
        errors2[`stderr:${i}`] = el.trim()
      }
    }
  }
  return { metadata: metadata2, items, errors: errors2 }
}
class DownloadRuntime {
  active = /* @__PURE__ */ new Map()
  aborted = /* @__PURE__ */ new Set()
  /** Number of downloads currently being processed by yt-dlp children. */
  get activeCount() {
    return this.active.size
  }
  isActive(id) {
    return this.active.has(id)
  }
  activeIds() {
    return [...this.active.keys()]
  }
  start(item, extraFlags, callbacks) {
    if (this.active.has(item.id)) {
      getLogger().warn(`Download ${item.id} is already running`)
      return
    }
    const ytdlp = resolveYtDlpPath()
    const built = buildCommand({ url: item.url, extraFlags })
    const args = built.args
    getLogger().info(`Spawning yt-dlp for ${item.id}`)
    const child = spawn(ytdlp, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    this.active.set(item.id, child)
    this.aborted.delete(item.id)
    let stderr = ''
    const handleChunk = (chunk) => {
      const text = chunk.toString()
      for (const line of text.split(/\r?\n/)) {
        if (!line) continue
        callbacks.onOutputLine?.(line)
        const parsed = parseProgressLine(line)
        if (parsed) {
          callbacks.onProgress({
            id: item.id,
            progress: parsed.progress,
            speed: parsed.speed,
            eta: parsed.eta,
            fileSize: parsed.fileSize,
          })
        }
      }
    }
    child.stdout?.on('data', handleChunk)
    child.stderr?.on('data', (d) => {
      stderr += d.toString()
      handleChunk(d)
    })
    child.on('error', (err2) => {
      this.active.delete(item.id)
      if (this.aborted.has(item.id)) {
        this.aborted.delete(item.id)
        return
      }
      getLogger().error(`Download ${item.id} process error: ${err2.message}`)
      callbacks.onError(err2.message)
    })
    child.on('close', (code) => {
      this.active.delete(item.id)
      if (this.aborted.has(item.id)) {
        this.aborted.delete(item.id)
        return
      }
      if (code === 0) {
        callbacks.onComplete()
      } else {
        getLogger().error(`Download ${item.id} failed with code ${code}: ${stderr.slice(0, 500)}`)
        callbacks.onError(stderr.trim() || `Process exited with code ${code}`)
      }
    })
  }
  // Note: execVersionSync intentionally not exposed here — version queries
  // live in services/runtime-info.ts and use execFileSync directly so they
  // don't entangle with the download lifecycle state.
  cancel(id) {
    const child = this.active.get(id)
    if (!child) return false
    this.aborted.add(id)
    getLogger().info(`Sending SIGINT to ${id}`)
    try {
      child.kill('SIGINT')
    } catch (e) {
      getLogger().warn(`kill SIGINT for ${id} failed: ${e.message}`)
    }
    return true
  }
  cancelAll() {
    let n = 0
    for (const id of [...this.active.keys()]) {
      if (this.cancel(id)) n++
    }
    return n
  }
  /**
   * Polls until all active processes have exited, then resolves.
   * Used during app shutdown. Forces SIGKILL after timeout.
   */
  async waitForAllExit(maxWaitMs) {
    if (this.active.size === 0) return
    const deadline = Date.now() + maxWaitMs
    while (this.active.size > 0) {
      if (Date.now() >= deadline) {
        getLogger().warn(
          `Shutdown timeout after ${maxWaitMs}ms; force-killing ${this.active.size} children`,
        )
        for (const [, child] of this.active) {
          try {
            child.kill('SIGKILL')
          } catch {}
        }
        this.active.clear()
        return
      }
      await new Promise((r) => setTimeout(r, 100))
    }
  }
  /**
   * Two-pass playlist aggregation.
   * Pass 1: Buffer raw NDJSON events from yt-dlp --dump-json.
   * Pass 2: Normalize into PlaylistResult (metadata, items, errors).
   */
  fetchPlaylist(url) {
    return new Promise((resolve, reject) => {
      let exe
      try {
        exe = resolveYtDlpPath()
      } catch (e) {
        reject(e)
        return
      }
      const child = spawn(exe, ['--dump-json', '--ignore-errors', '--no-warnings', url], {
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      const lines = []
      let stderr = ''
      let partial = ''
      child.stdout?.on('data', (d) => {
        const text = partial + d.toString()
        const parts = text.split('\n')
        partial = parts.pop() ?? ''
        for (const line of parts) {
          if (line) lines.push(line)
        }
      })
      child.stderr?.on('data', (d) => {
        stderr += d.toString()
      })
      child.on('error', reject)
      child.on('close', (code) => {
        if (code !== 0 && lines.length === 0) {
          reject(new Error(`yt-dlp playlist fetch exited ${code}: ${stderr.slice(0, 500)}`))
          return
        }
        if (partial) lines.push(partial)
        resolve(normalizePlaylistNdjson(lines, url, stderr))
      })
    })
  }
  /** Synchronous version for tests. */
  fetchMetadata(url) {
    return new Promise((resolve, reject) => {
      const exe = (() => {
        try {
          return resolveYtDlpPath()
        } catch (e) {
          reject(e)
          throw e
        }
      })()
      const child = spawn(exe, ['--dump-json', '--no-warnings', url], {
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      let stdout = ''
      let stderr = ''
      child.stdout?.on('data', (d) => {
        stdout += d.toString()
      })
      child.stderr?.on('data', (d) => {
        stderr += d.toString()
      })
      child.on('error', reject)
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp --dump-json exited ${code}: ${stderr.slice(0, 500)}`))
          return
        }
        try {
          const parsed = JSON.parse(stdout)
          resolve({
            id: String(parsed.id ?? ''),
            title: String(parsed.title ?? ''),
            duration: typeof parsed.duration === 'number' ? parsed.duration : void 0,
            thumbnail: typeof parsed.thumbnail === 'string' ? parsed.thumbnail : void 0,
            uploader: typeof parsed.uploader === 'string' ? parsed.uploader : void 0,
            description: typeof parsed.description === 'string' ? parsed.description : void 0,
            view_count: typeof parsed.view_count === 'number' ? parsed.view_count : void 0,
            like_count: typeof parsed.like_count === 'number' ? parsed.like_count : void 0,
            upload_date: typeof parsed.upload_date === 'string' ? parsed.upload_date : void 0,
            formats: Array.isArray(parsed.formats)
              ? parsed.formats.map((f) => ({
                  format_id: String(f.format_id ?? ''),
                  ext: String(f.ext ?? ''),
                  resolution: typeof f.resolution === 'string' ? f.resolution : void 0,
                  filesize: typeof f.filesize === 'number' ? f.filesize : void 0,
                  filesizeApprox:
                    typeof f.filesize_approx === 'number' ? f.filesize_approx : void 0,
                  vcodec: typeof f.vcodec === 'string' ? f.vcodec : void 0,
                  acodec: typeof f.acodec === 'string' ? f.acodec : void 0,
                  format_note: typeof f.format_note === 'string' ? f.format_note : void 0,
                  tbr: typeof f.tbr === 'number' ? f.tbr : void 0,
                  vbr: typeof f.vbr === 'number' ? f.vbr : void 0,
                  abr: typeof f.abr === 'number' ? f.abr : void 0,
                  fps: typeof f.fps === 'number' ? f.fps : void 0,
                  width: typeof f.width === 'number' ? f.width : void 0,
                  height: typeof f.height === 'number' ? f.height : void 0,
                  dynamic_range: typeof f.dynamic_range === 'string' ? f.dynamic_range : void 0,
                  audio_channels: typeof f.audio_channels === 'number' ? f.audio_channels : void 0,
                }))
              : void 0,
            subtitles: parsed.subtitles ?? void 0,
            automatic_captions: parsed.automatic_captions ?? void 0,
            chapters: Array.isArray(parsed.chapters)
              ? parsed.chapters.map((c) => ({
                  title: String(c.title ?? ''),
                  start_time: typeof c.start_time === 'number' ? c.start_time : 0,
                  end_time: typeof c.end_time === 'number' ? c.end_time : 0,
                }))
              : void 0,
          })
        } catch (e) {
          reject(e)
        }
      })
    })
  }
}
class NoopEventSink {
  send(_channel, ..._args) {}
  isReady() {
    return false
  }
}
let cached = null
function resetServicesCache() {
  cached = null
}
function buildServices(overrides = {}) {
  const repositories = overrides.repositories ?? getRepositories()
  const runtime = overrides.runtime ?? new DownloadRuntime()
  const events = overrides.events ?? new NoopEventSink()
  cached = {
    queue: new QueueService({
      queueRepo: repositories.queue,
      historyRepo: repositories.history,
      runtime,
      events,
    }),
    history: new HistoryService({ historyRepo: repositories.history }),
    settings: new SettingsService({ settingsRepo: repositories.settings }),
    runtime,
  }
  return cached
}
function getServices() {
  if (!cached) {
    throw new Error(
      'Services not built. Call buildServices() in app.whenReady() before any IPC handler.',
    )
  }
  return cached
}
function parse(schema, input) {
  const r = schema.safeParse(input)
  if (!r.success) {
    const issue = r.error.issues[0]
    return err(
      'INVALID_INPUT',
      issue ? `${issue.path.join('.') || '(root)'}: ${issue.message}` : 'Invalid input',
      r.error.flatten(),
    )
  }
  return ok(r.data)
}
const wrap = (r) => r
const wrapResult = (r) => wrap(r)
const failure = (code, message, details) => ({
  ok: false,
  error: details === void 0 ? { code, message } : { code, message, details },
})
function fromThrown(value, fallback = 'INTERNAL_ERROR') {
  if (value instanceof Error) {
    if ('issues' in value && Array.isArray(value.issues)) {
      const z = value
      return {
        code: 'INVALID_INPUT',
        message:
          z.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') ||
          'Validation failed',
        details: z.flatten(),
      }
    }
    const asAny = value
    if (typeof asAny.code === 'string') {
      return { code: asAny.code, message: asAny.message }
    }
    return { code: fallback, message: asAny.message }
  }
  if (typeof value === 'string') {
    return { code: fallback, message: value }
  }
  return { code: fallback, message: 'Unknown error' }
}
async function safe(fn) {
  try {
    const r = await fn()
    return wrap(r)
  } catch (value) {
    return { ok: false, error: fromThrown(value) }
  }
}
const MAX_URL_LENGTH = 8192
function validateDownloadUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required')
  }
  const trimmed = url.trim()
  if (trimmed.length === 0) {
    throw new Error('URL is required')
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new Error('URL exceeds maximum length')
  }
  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Invalid URL format')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must use http or https')
  }
  if (!parsed.hostname) {
    throw new Error('URL must include a hostname')
  }
  return trimmed
}
const uuid = stringType().uuid()
const extraFlagsInput = objectType({
  cookiesFile: stringType().optional(),
  browserCookies: stringType().optional(),
  subtitleLangs: arrayType(stringType()).optional(),
  embedSubs: booleanType().optional(),
  username: stringType().optional(),
  password: stringType().optional(),
  netrc: booleanType().optional(),
  proxy: stringType().optional(),
  userAgent: stringType().optional(),
  referer: stringType().optional(),
  playlistStart: numberType().int().positive().optional(),
  playlistEnd: numberType().int().positive().optional(),
  noPlaylist: booleanType().optional(),
  speedLimit: stringType()
    .regex(/^(\d+(\.\d+)?[KMGkmg]?)?$/, 'Invalid speed limit format')
    .optional(),
}).optional()
const addInput = objectType({
  url: stringType().min(1),
  priority: numberType().int().min(1).max(10).optional(),
  extraFlags: extraFlagsInput,
})
const addBatchInput = objectType({
  urls: arrayType(stringType().min(1)).min(1),
  priority: numberType().int().min(1).max(10).optional(),
  extraFlags: extraFlagsInput,
})
const idOnly = objectType({ id: uuid })
function registerDownloadsIPC() {
  const services = () => getServices()
  const queue = () => services().queue
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_ADD, async (_e, raw) =>
    safe(async () => {
      const input = parse(addInput, raw)
      if (!input.ok) return input
      const safeUrl = validateDownloadUrl(input.data.url)
      const created = await queue().add({
        url: safeUrl,
        priority: input.data.priority,
        extraFlags: input.data.extraFlags,
      })
      if (!created.ok) return created
      try {
        const meta = await queue().fetchMetadata(safeUrl)
        if (meta.ok && meta.data.title) {
          queue().setTitle(created.data.id, meta.data.title)
          return { ok: true, data: { ...created.data, title: meta.data.title } }
        }
      } catch {}
      return created
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_ADD_BATCH, async (_e, raw) =>
    safe(async () => {
      const input = parse(addBatchInput, raw)
      if (!input.ok) return input
      const validated = []
      for (const u of input.data.urls) {
        try {
          validated.push(validateDownloadUrl(u))
        } catch {
          return failure('INVALID_URL', `Invalid URL: ${u}`)
        }
      }
      return queue().addBatch({
        urls: validated,
        priority: input.data.priority,
        extraFlags: input.data.extraFlags,
      })
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_PAUSE, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().pause(p.data.id)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_RESUME, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().resume(p.data.id)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CANCEL, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().cancel(p.data.id)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_REMOVE, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().remove(p.data.id)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_RETRY, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().retry(p.data.id)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_REORDER, async (_e, raw) =>
    safe(async () => {
      const input = parse(objectType({ id: uuid, direction: enumType(['up', 'down']) }), raw)
      if (!input.ok) return input
      return queue().reorder(input.data.id, input.data.direction)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CLEAR_COMPLETED, async () =>
    wrapResult(queue().clearCompleted()),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET_EXTRA_FLAGS, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().getExtraFlags(p.data.id)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_UPDATE_EXTRA_FLAGS, async (_e, raw) =>
    safe(async () => {
      const input = parse(objectType({ id: uuid, flags: extraFlagsInput }), raw)
      if (!input.ok) return input
      return queue().updateExtraFlags(input.data.id, input.data.flags ?? {})
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET_ALL, async () => wrapResult(queue().getAll()))
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET, async (_e, raw) =>
    safe(async () => {
      const p = parse(idOnly, { id: raw })
      if (!p.ok) return p
      return queue().get(p.data.id)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET_QUEUE_STATS, async () => wrapResult(queue().getStats()))
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_ESTIMATE_BATCH_SIZE, async (_e, raw) =>
    safe(async () => {
      const input = parse(arrayType(stringType().min(1)).min(1), raw)
      if (!input.ok) return input
      return queue().estimateBatchSize(input.data)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_FETCH_METADATA, async (_e, raw) =>
    safe(async () => {
      if (typeof raw !== 'string') return failure('INVALID_INPUT', 'url required')
      const safeUrl = validateDownloadUrl(raw)
      return queue().fetchMetadata(safeUrl)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_FETCH_PLAYLIST, async (_e, raw) =>
    safe(async () => {
      if (typeof raw !== 'string') return failure('INVALID_INPUT', 'url required')
      const safeUrl = validateDownloadUrl(raw)
      return queue().fetchPlaylist(safeUrl)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_REORDER_TO_POSITION, async (_e, raw) =>
    safe(async () => {
      const input = parse(objectType({ id: uuid, newIndex: numberType().int().nonnegative() }), raw)
      if (!input.ok) return input
      return queue().reorderToPosition(input.data.id, input.data.newIndex)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_SET_SPEED_LIMIT, async (_e, raw) =>
    safe(async () => {
      const input = parse(
        objectType({
          id: uuid,
          limit: stringType()
            .regex(/^(\d+(\.\d+)?[KMGkmg]?)?$/, 'Invalid speed limit')
            .nullable(),
        }),
        raw,
      )
      if (!input.ok) return input
      return queue().setSpeedLimit(input.data.id, input.data.limit)
    }),
  )
}
function registerHistoryIPC() {
  const services = () => getServices()
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET_ALL, async () => wrapResult(services().history.list()))
}
const patchSchema = DownloadSettingsSchema.partial()
function registerSettingsIPC() {
  const services = () => getServices()
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => wrapResult(services().settings.get()))
  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_e, raw) =>
    safe(async () => {
      const input = parse(patchSchema, raw)
      if (!input.ok) return input
      return services().settings.update(input.data)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, async () => wrapResult(services().settings.reset()))
  ipcMain.handle(IPC_CHANNELS.SETTINGS_EXPORT, async () => wrapResult(services().settings.export()))
  ipcMain.handle(IPC_CHANNELS.SETTINGS_IMPORT, async (_e, raw) =>
    safe(async () => {
      const input = parse(patchSchema, raw)
      if (!input.ok) return input
      return services().settings.import(input.data)
    }),
  )
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_PRESETS, async () =>
    wrapResult(services().settings.getPresets()),
  )
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SAVE_PRESETS, async (_e, raw) =>
    safe(async () => {
      const input = parse(arrayType(PresetSchema), raw)
      if (!input.ok) return input
      return services().settings.savePresets(input.data)
    }),
  )
}
const CHECK_TIMEOUT_MS = 8e3
const DOWNLOAD_TIMEOUT_MS = 15e3
const INTERNET_CHECK_URLS = [
  'https://www.google.com/generate_204',
  'https://cloudflare.com/cdn-cgi/trace',
]
async function checkYtDlp(binaryExists) {
  const start = Date.now()
  try {
    const ytdlp = resolveYtDlpPath()
    const exists = binaryExists ?? fs.existsSync(ytdlp)
    if (!exists) {
      return {
        name: 'yt-dlp',
        label: 'yt-dlp CLI',
        status: 'fail',
        message: 'yt-dlp executable not found',
        detail: `Looked at: ${ytdlp}. Install yt-dlp or configure the path in Settings.`,
        durationMs: Date.now() - start,
      }
    }
    const out = execFileSync(ytdlp, ['--version'], {
      encoding: 'utf-8',
      timeout: CHECK_TIMEOUT_MS,
    })
    const version2 = out.trim()
    return {
      name: 'yt-dlp',
      label: 'yt-dlp CLI',
      status: version2 ? 'pass' : 'warning',
      message: version2 ? `yt-dlp ${version2}` : 'yt-dlp responded but version unknown',
      detail: `Path: ${ytdlp}`,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = e.message
    getLogger().warn(`POST yt-dlp check failed: ${msg}`)
    return {
      name: 'yt-dlp',
      label: 'yt-dlp CLI',
      status: 'fail',
      message: 'yt-dlp check failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}
async function checkFfmpeg(binaryExists) {
  const start = Date.now()
  try {
    const ffmpeg = resolveFfmpegPath()
    const exists = binaryExists ?? fs.existsSync(ffmpeg)
    if (!exists) {
      return {
        name: 'ffmpeg',
        label: 'FFmpeg',
        status: 'fail',
        message: 'FFmpeg executable not found',
        detail: `Looked at: ${ffmpeg}. Install FFmpeg or configure the path in Settings.`,
        durationMs: Date.now() - start,
      }
    }
    const result = spawnSync(ffmpeg, ['-version'], {
      encoding: 'utf-8',
      timeout: CHECK_TIMEOUT_MS,
    })
    const output = (result.stderr || result.stdout || '').trim()
    const firstLine = output.split('\n')[0] ?? ''
    const version2 = firstLine.replace(/^ffmpeg version\s+/, '').split(' ')[0]
    return {
      name: 'ffmpeg',
      label: 'FFmpeg',
      status: version2 ? 'pass' : 'warning',
      message: version2 ? `FFmpeg ${version2}` : 'FFmpeg responded but version unknown',
      detail: `Path: ${ffmpeg}`,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = e.message
    getLogger().warn(`POST ffmpeg check failed: ${msg}`)
    return {
      name: 'ffmpeg',
      label: 'FFmpeg',
      status: 'fail',
      message: 'FFmpeg check failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}
async function checkInternet() {
  const start = Date.now()
  for (const url of INTERNET_CHECK_URLS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.ok || res.status === 204) {
        return {
          name: 'internet',
          label: 'Internet Connection',
          status: 'pass',
          message: 'Connected',
          detail: `Reached ${url}`,
          durationMs: Date.now() - start,
        }
      }
    } catch {
      continue
    }
  }
  return {
    name: 'internet',
    label: 'Internet Connection',
    status: 'fail',
    message: 'No internet connection detected',
    detail: 'Check your network connection. Downloads require internet access.',
    durationMs: Date.now() - start,
  }
}
async function checkDiskSpace() {
  const start = Date.now()
  try {
    const downloadPath = resolveForgedlBase(getSettings().downloadPath)
    if (!fs.existsSync(downloadPath)) {
      try {
        fs.mkdirSync(downloadPath, { recursive: true })
      } catch {
        return {
          name: 'disk-space',
          label: 'Disk Space',
          status: 'fail',
          message: 'Cannot create download directory',
          detail: `Path: ${downloadPath}`,
          durationMs: Date.now() - start,
        }
      }
    }
    let freeGB = 0
    let totalGB = 0
    try {
      const fsAny = fs
      if (typeof fsAny.statfsSync === 'function') {
        const stat = fsAny.statfsSync(downloadPath)
        if (
          stat &&
          typeof stat.bsize === 'number' &&
          typeof stat.bfree === 'number' &&
          typeof stat.blocks === 'number'
        ) {
          freeGB = (stat.bsize * stat.bfree) / (1024 * 1024 * 1024)
          totalGB = (stat.bsize * stat.blocks) / (1024 * 1024 * 1024)
        }
      }
    } catch {}
    if (freeGB > 0 && totalGB > 0 && freeGB < 0.5) {
      return {
        name: 'disk-space',
        label: 'Disk Space',
        status: 'warning',
        message: `Low disk space: ${freeGB.toFixed(1)} GB free of ${totalGB.toFixed(1)} GB`,
        detail: `Path: ${downloadPath}`,
        durationMs: Date.now() - start,
      }
    }
    if (freeGB > 0 && totalGB > 0) {
      return {
        name: 'disk-space',
        label: 'Disk Space',
        status: 'pass',
        message: `${freeGB.toFixed(1)} GB free of ${totalGB.toFixed(1)} GB`,
        detail: `Path: ${downloadPath}`,
        durationMs: Date.now() - start,
      }
    }
    return {
      name: 'disk-space',
      label: 'Disk Space',
      status: 'warning',
      message: 'Could not measure disk space',
      detail: `Directory exists at: ${downloadPath}. statfsSync not available on this platform.`,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = e.message
    getLogger().warn(`POST disk-space check failed: ${msg}`)
    return {
      name: 'disk-space',
      label: 'Disk Space',
      status: 'fail',
      message: 'Disk space check failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}
async function checkWritePermission() {
  const start = Date.now()
  try {
    const downloadPath = resolveForgedlBase(getSettings().downloadPath)
    try {
      fs.mkdirSync(downloadPath, { recursive: true })
    } catch {}
    const testFile = join(downloadPath, '.forgedl-post-perm-test')
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)
    return {
      name: 'write-permission',
      label: 'Write Permission',
      status: 'pass',
      message: 'Download directory is writable',
      detail: `Path: ${downloadPath}`,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = e.message
    getLogger().warn(`POST write-permission check failed: ${msg}`)
    return {
      name: 'write-permission',
      label: 'Write Permission',
      status: 'fail',
      message: 'Cannot write to download directory',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}
async function checkDatabase() {
  const start = Date.now()
  try {
    const db2 = getDatabase()
    const result = db2.pragma('integrity_check')
    const healthy = result.length === 1 && result[0].integrity_check === 'ok'
    if (healthy) {
      return {
        name: 'database',
        label: 'Database',
        status: 'pass',
        message: 'Database integrity OK',
        detail: void 0,
        durationMs: Date.now() - start,
      }
    }
    return {
      name: 'database',
      label: 'Database',
      status: 'fail',
      message: 'Database integrity check failed',
      detail: result.map((r) => r.integrity_check).join('; '),
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = e.message
    getLogger().warn(`POST database check failed: ${msg}`)
    return {
      name: 'database',
      label: 'Database',
      status: 'fail',
      message: 'Database check failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}
async function checkExtractors(ytDlpExists) {
  const start = Date.now()
  try {
    const ytdlp = resolveYtDlpPath()
    const exists = ytDlpExists ?? fs.existsSync(ytdlp)
    if (!exists) {
      return {
        name: 'extractors',
        label: 'Site Extractors',
        status: 'fail',
        message: 'Extractor check skipped — yt-dlp not found',
        detail: `Looked at: ${ytdlp}. Install yt-dlp or configure the path in Settings.`,
        durationMs: Date.now() - start,
      }
    }
    const out = execFileSync(ytdlp, ['--list-extractors'], {
      encoding: 'utf-8',
      timeout: CHECK_TIMEOUT_MS,
    })
    const count = out.trim().split('\n').filter(Boolean).length
    if (count > 0) {
      return {
        name: 'extractors',
        label: 'Site Extractors',
        status: 'pass',
        message: `${count} extractors available`,
        detail: `Path: ${ytdlp}`,
        durationMs: Date.now() - start,
      }
    }
    return {
      name: 'extractors',
      label: 'Site Extractors',
      status: 'fail',
      message: 'No extractors found — yt-dlp may be damaged',
      detail: 'yt-dlp --list-extractors returned empty output. Try reinstalling yt-dlp.',
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = e.message
    getLogger().warn(`POST extractors check failed: ${msg}`)
    return {
      name: 'extractors',
      label: 'Site Extractors',
      status: 'fail',
      message: 'Extractor check failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  }
}
async function checkDownloadTest(ytDlpExists) {
  const start = Date.now()
  const downloadPath = resolveForgedlBase(getSettings().downloadPath)
  const tempDir = join(downloadPath, '.forgedl-post-dl-test')
  try {
    const ytdlp = resolveYtDlpPath()
    const exists = ytDlpExists ?? fs.existsSync(ytdlp)
    if (!exists) {
      return {
        name: 'download-test',
        label: 'Download Test',
        status: 'fail',
        message: 'Download test skipped — yt-dlp not found',
        detail: `Looked at: ${ytdlp}. Install yt-dlp or configure the path in Settings.`,
        durationMs: Date.now() - start,
      }
    }
    const testUrl = 'https://youtu.be/BaW_jenozKc'
    execFileSync(
      ytdlp,
      [
        '-f',
        'worst',
        // smallest possible quality
        '--max-filesize',
        '2M',
        // safety cap
        '--no-playlist',
        '-o',
        join(tempDir, 'test.%(ext)s'),
        testUrl,
      ],
      {
        encoding: 'utf-8',
        timeout: DOWNLOAD_TIMEOUT_MS,
      },
    )
    return {
      name: 'download-test',
      label: 'Download Test',
      status: 'pass',
      message: 'End-to-end download succeeded',
      detail: `Downloaded ${testUrl} successfully.`,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    const msg = e.message
    getLogger().warn(`POST download-test check failed: ${msg}`)
    return {
      name: 'download-test',
      label: 'Download Test',
      status: 'fail',
      message: 'Download test failed',
      detail: msg,
      durationMs: Date.now() - start,
    }
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {}
  }
}
async function runPost() {
  const start = Date.now()
  getLogger().info('POST starting...')
  let ytDlpFound = false
  let ffmpegFound = false
  try {
    ytDlpFound = fs.existsSync(resolveYtDlpPath())
  } catch {}
  try {
    ffmpegFound = fs.existsSync(resolveFfmpegPath())
  } catch {}
  const checks = await Promise.all([
    checkYtDlp(ytDlpFound),
    checkFfmpeg(ffmpegFound),
    checkInternet(),
    checkDiskSpace(),
    checkWritePermission(),
    checkDatabase(),
    checkExtractors(ytDlpFound),
    checkDownloadTest(ytDlpFound),
  ])
  const allPassed = checks.every((c) => c.status === 'pass')
  const totalDurationMs = Date.now() - start
  getLogger().info(
    `POST complete in ${totalDurationMs}ms — ${allPassed ? 'all passed' : 'issues found'}`,
  )
  return { checks, allPassed, totalDurationMs }
}
function systemInfo() {
  return {
    os: os.type(),
    release: os.release(),
    arch: os.arch(),
    totalmem: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    freemem: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    cpus: String(os.cpus().length),
    platform: os.platform(),
    hostname: os.hostname(),
  }
}
function diskSpace(folderPath) {
  const target = folderPath ? validateShellPath(folderPath) : os.homedir()
  const normalized = path.resolve(target)
  try {
    const fsAny = fs__default
    if (typeof fsAny.statfsSync === 'function') {
      const stat = fsAny.statfsSync(normalized)
      return { free: stat.bsize * stat.bfree, total: stat.bsize * stat.blocks }
    }
  } catch {}
  return { free: 0, total: 0 }
}
function registerSystemIPC() {
  ipcMain.handle(IPC_CHANNELS.SYSTEM_YTDLP_VERSION, async () => ({
    ok: true,
    data: getYtDlpVersion(),
  }))
  ipcMain.handle(IPC_CHANNELS.SYSTEM_FFMPEG_VERSION, async () => ({
    ok: true,
    data: getFfmpegVersion(),
  }))
  ipcMain.handle(IPC_CHANNELS.SYSTEM_CHECK_BINARY_HEALTH, async (_e, raw) =>
    safe(async () => {
      if (typeof raw !== 'string' || (raw !== 'yt-dlp' && raw !== 'ffmpeg')) {
        return failure('INVALID_INPUT', 'Binary name must be "yt-dlp" or "ffmpeg"')
      }
      const result = checkBinaryHealth(raw)
      return { ok: true, data: result }
    }),
  )
  ipcMain.handle(IPC_CHANNELS.SYSTEM_REBUILD_YTDLP, async () =>
    safe(async () => {
      const result = await repairYtDlp()
      return { ok: true, data: result }
    }),
  )
  ipcMain.handle(IPC_CHANNELS.SYSTEM_REBUILD_FFMPEG, async () =>
    safe(async () => {
      const result = await repairFfmpeg()
      return { ok: true, data: result }
    }),
  )
  ipcMain.handle(IPC_CHANNELS.SYSTEM_CHECK_YTDLP_UPDATE, async () =>
    safe(async () => {
      const result = await checkAndUpdateYtDlpAsync()
      return { ok: true, data: result }
    }),
  )
  ipcMain.handle(IPC_CHANNELS.SYSTEM_OPEN_FOLDER, async (_e, raw) =>
    safe(async () => {
      if (typeof raw !== 'string' || raw.length === 0)
        return failure('INVALID_INPUT', 'path required')
      const resolved = validateShellPath(raw)
      if (!fs__default.existsSync(resolved)) return failure('NOT_FOUND', 'Folder does not exist')
      await shell.openPath(resolved)
      return { ok: true, data: void 0 }
    }),
  )
  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, async (_e, raw) =>
    safe(async () => {
      if (typeof raw !== 'string' || raw.length === 0)
        return failure('INVALID_INPUT', 'path required')
      const resolved = validateShellPath(raw)
      if (!fs__default.existsSync(resolved)) return failure('NOT_FOUND', 'File does not exist')
      shell.showItemInFolder(resolved)
      return { ok: true, data: void 0 }
    }),
  )
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_INFO, async () => ({ ok: true, data: systemInfo() }))
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_DISK_SPACE, async (_e, raw) => {
    const p = typeof raw === 'string' ? raw : void 0
    return { ok: true, data: diskSpace(p) }
  })
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PLATFORM, async () => ({ ok: true, data: os.platform() }))
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_FORGEDL_BASE_PATH, async () => ({
    ok: true,
    data: resolveForgedlBase(getSettings().downloadPath),
  }))
  ipcMain.handle(IPC_CHANNELS.SYSTEM_RUN_POST, async () =>
    safe(async () => {
      const results = await runPost()
      return { ok: true, data: results }
    }),
  )
}
function registerDialogIPC() {
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { ok: true, data: null }
    const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
    return { ok: true, data: r.canceled ? null : (r.filePaths[0] ?? null) }
  })
}
class WebContentsEventSink {
  constructor(wc) {
    this.wc = wc
  }
  wc
  send(channel, ...args) {
    if (!this.wc || this.wc.isDestroyed()) return
    this.wc.send(channel, ...args)
  }
  isReady() {
    return !!this.wc && !this.wc.isDestroyed()
  }
  set(wc) {
    this.wc = wc
  }
}
let sink = null
function bootstrapIpc() {
  if (sink) return
  bindDatabaseAccessor(() => getDatabase())
  getRepositories()
  sink = new WebContentsEventSink(null)
  buildServices({ events: sink })
  registerDownloadsIPC()
  registerHistoryIPC()
  registerSettingsIPC()
  registerSystemIPC()
  registerDialogIPC()
}
function attachIpcToWindow(win) {
  bootstrapIpc()
  sink?.set(win.webContents)
}
function detachIpc() {
  sink?.set(null)
}
function shutdownIpc() {
  sink?.set(null)
  resetServicesCache()
  resetRepositories()
  sink = null
}
function runStartupHealthCheck() {
  if (!sink || !sink.isReady()) return
  getLogger().info('Running startup binary health check...')
  try {
    const ytDlpResult = checkBinaryHealth('yt-dlp')
    const ffmpegResult = checkBinaryHealth('ffmpeg')
    sink.send(STARTUP_HEALTH_CHANNEL, {
      ytDlp: ytDlpResult,
      ffmpeg: ffmpegResult,
    })
    const issues = []
    if (ytDlpResult.status !== 'ok') {
      issues.push(
        `yt-dlp: ${ytDlpResult.status}${ytDlpResult.error ? ` — ${ytDlpResult.error.slice(0, 60)}` : ''}`,
      )
    }
    if (ffmpegResult.status !== 'ok') {
      issues.push(
        `ffmpeg: ${ffmpegResult.status}${ffmpegResult.error ? ` — ${ffmpegResult.error.slice(0, 60)}` : ''}`,
      )
    }
    if (issues.length > 0) {
      getLogger().warn(`Startup health check found issues: ${issues.join('; ')}`)
    } else {
      getLogger().info('Startup health check: both binaries OK')
    }
  } catch (e) {
    getLogger().error(`Startup health check failed: ${e.message}`)
  }
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url))
const SHUTDOWN_MAX_WAIT_MS = 15e3
let mainWindow = null
let isShuttingDown = false
function createWindow() {
  const windowState = getWindowState()
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname$1, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })
  if (windowState.isMaximized) mainWindow.maximize()
  if (windowState.isFullScreen) mainWindow.setFullScreen(true)
  const persistState = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds()
    saveWindowState({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: mainWindow.isMaximized(),
      isFullScreen: mainWindow.isFullScreen(),
    })
  }
  mainWindow.on('resize', persistState)
  mainWindow.on('move', persistState)
  mainWindow.on('maximize', persistState)
  mainWindow.on('unmaximize', persistState)
  mainWindow.on('enter-full-screen', persistState)
  mainWindow.on('leave-full-screen', persistState)
  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    getLogger().error(`Renderer failed to load: ${code} ${desc} — ${url}`)
  })
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    getLogger().error('Renderer process gone:', details)
  })
  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname$1, '../dist/index.html'))
  }
  attachIpcToWindow(mainWindow)
  mainWindow.webContents.once('did-finish-load', () => {
    runStartupHealthCheck()
  })
  try {
    getServices().queue.processQueue()
  } catch (e) {
    getLogger().warn(`Initial processQueue failed: ${e.message}`)
  }
  mainWindow.on('closed', () => {
    mainWindow = null
    detachIpc()
  })
}
function bootstrapRuntime() {
  const userData = app.getPath('userData')
  setDownloadBasePath(app.getPath('downloads'))
  initLogger(userData)
  initWindowState(userData)
  const db2 = initDatabase(userData)
  bindDatabaseAccessor(() => db2)
  bootstrapIpc()
  getServices().queue.runStartupRecovery()
  applyCSP()
}
app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsed = new URL(navigationUrl)
    const ok2 =
      (parsed.hostname === 'localhost' && parsed.protocol === 'http:') ||
      parsed.protocol === 'file:'
    if (!ok2) {
      event.preventDefault()
      getLogger().warn(`Blocked navigation to ${navigationUrl}`)
    }
  })
})
app.whenReady().then(() => {
  bootstrapRuntime()
  getLogger().info('Subsystems loaded. Creating window...')
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('before-quit', (event) => {
  if (isShuttingDown) return
  let services = null
  try {
    services = getServices() ?? null
  } catch {
    services = null
  }
  const active = services?.runtime?.activeCount ?? 0
  if (active > 0) {
    event.preventDefault()
    isShuttingDown = true
    getLogger().info(`Shutting down with ${active} active download(s)`)
    if (services) {
      services.runtime.cancelAll()
      void services.runtime.waitForAllExit(SHUTDOWN_MAX_WAIT_MS).then(() => {
        shutdownIpc()
        resetServicesCache()
        resetRepositories()
        app.quit()
      })
      return
    }
    shutdownIpc()
    app.quit()
    return
  }
  shutdownIpc()
})
process.on('uncaughtException', (err2) => {
  getLogger().error('Uncaught exception in main process:', err2)
})
process.on('unhandledRejection', (reason) => {
  getLogger().error('Unhandled rejection in main process:', reason)
})

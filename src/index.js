import Raven from 'raven-js'
import RavenVue from 'raven-js/plugins/vue'
import { formatComponentName } from './utils'

function plugin (Vue, options = {}) {
  // Merge options
  const _options = Object.assign({
    disableAutomaticallyReport: options.disableAutomaticallyReport || false,
    dsn: options.dsn || null,
    public_dsn: options.public_dsn || null,
    public_key: options.public_key || null,
    private_key: options.private_key || null,
    host: options.host || 'sentry.io',
    protocol: options.protocol || 'https',
    project_id: options.project_id || '',
    path: options.path || '/',
    config: {
      environment: options.dev ? 'development' : 'production'
    }
  }, options)

  // Generate DSN
  if (!options.dsn || !options.dsn.length) {
    options.dsn = `${options.protocol}://${options.public_key}` +
      `:${options.private_key}@${options.host}${options.path}${options.project_id}`
  }

  // Public DSN (without private key)
  if (!options.public_dsn || !options.public_dsn.length) {
    options.public_dsn = options.dsn.replace(/:\w+@/, '@')
  }

  // install raven
  Raven.config(_options.dsn, _options.config).addPlugin(RavenVue, Vue).install()

  // custom error handler
  const _oldOnError = Vue.config.errorHandler
  Vue.config.errorHandler = function VueErrorHandler (error, vm, info) {
    const metaData = {}

    // vm and lifecycleHook are not always available
    if (Object.prototype.toString.call(vm) === '[object Object]') {
      metaData.componentName = formatComponentName(vm)
      metaData.propsData = vm.$options.propsData
    }

    if (typeof info !== 'undefined') {
      metaData.lifecycleHook = info
    }

    Raven.captureException(error, {
      extra: metaData
    })

    if (typeof _oldOnError === 'function') {
      _oldOnError.call(this, error, vm, info)
    }
  }

  // add raven instance
  Vue.prototype.$raven = Raven
}

// Install by default if using the script tag
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin)
}

export default plugin
const version = '__VERSION__'
// Export all components too
export {
  Raven,
  version
}

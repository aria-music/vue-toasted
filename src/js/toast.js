import show from './show'
const uuid = require('shortid')

/**
 * Toast
 * core instance of toast
 *
 * @param _options
 * @returns {Toasted}
 * @constructor
 */
export const Toasted = function (_options) {

	/**
	 * Unique id of the toast
	 */
	this.id = uuid.generate()

	/**
	 * Shared Options of the Toast
	 */
	this.options = _options


	/**
	 * Cached Options of the Toast
	 */
	this.cached_options = {}


	/**
	 * Shared Toasts list
	 */
	this.global = {}


	/**
	 * All Registered Groups
	 */
	// this.groups = []

	/**
	 * All Registered Toasts
	 */
	this.toasts = []

	/**
	 * Element of the Toast Container
	 */
	this.container = null

	/**
	 * Initiate toast container
	 */
	initiateToastContainer(this)

	/**
	 * Initiate custom toasts
	 */
	initiateCustomToasts(this)

	/**
	 * Show a Simple Toast
	 *
	 * @param message
	 * @param options
	 * @returns {*}
	 */
	this.show = (message, options) => {
		return _show(this, message, options)
	}

	/**
	 * Remove a Toast
	 * @param el
	 */
	this.remove = (el) => {
		this.toasts = this.toasts.filter((t) => {
			return t.el.hash !== el.hash
		})
		if (el.parentNode) el.parentNode.removeChild(el)
	}

	return this
}

/**
 * Wrapper for show method in order to manipulate options
 *
 * @param instance
 * @param message
 * @param options
 * @returns {*}
 * @private
 */
export const _show = function (instance, message, options) {
	options = options || {}
	let toast = null

	if (typeof options !== "object") return null

	// toaster limited
	if(instance.toasts.length > 4)
		instance.toasts[0].goAway(0)

	// clone the global options
	let _options = Object.assign({}, instance.options)

	// merge the cached global options with options
	Object.assign(_options, options)

	toast = show(instance, message, _options)
	instance.toasts.push(toast)

	return toast
}

/**
 * Register the Custom Toasts
 */
export const initiateCustomToasts = function (instance) {

	let customToasts = instance.options.globalToasts

	// this will initiate toast for the custom toast.
	let initiate = (message, options) => {

		// check if passed option is a available method if so call it.
		if (typeof(options) === 'string' && instance[options]) {
			return instance[options].apply(instance, [message, {}])
		}

		// or else create a new toast with passed options.
		return _show(instance, message, options)
	}

	if (customToasts) {

		instance.global = {}

		Object.keys(customToasts).forEach(key => {

			// register the custom toast events to the Toast.custom property
			instance.global[key] = (payload = {}) => {

				// return the it in order to expose the Toast methods
				return customToasts[key].apply(null, [payload, initiate])
			}
		})

	}
}

const initiateToastContainer = function (instance) {
	// create notification container
	const container = document.createElement('div')
	container.id = instance.id
	container.setAttribute('role', 'status')
	container.setAttribute('aria-live', 'polite')
	container.setAttribute('aria-atomic', 'false')

	document.body.appendChild(container)
	instance.container = container
}

export default {Toasted}
import Hammer from 'hammerjs'
import animations from './animations'
const uuid = require('shortid')

let _instance = null
/**
 * parse Options
 *
 * @param options
 * @returns {{el: *, goAway: goAway}}
 */
const parseOptions = function (options) {

	// class name to be added on the toast
	options.className = options.className || null

	// toast position
	options.position = options.position || "top-right"

	// toast duration
	options.duration = options.duration || 3000

	// normal type will allow the basic color
	options.dark = options.dark || false

	// normal type will allow the basic color
	options.color = options.color || null

	// class name to be added on the toast container
	options.containerClass = options.containerClass || null

	// get icon name
	options.icon = options.icon || null

	// check if closes the toast when the user swipes it
	options.closeOnSwipe = typeof options.closeOnSwipe !== 'undefined' ? options.closeOnSwipe : true

	/* transform options */

	// toast class
	if (options.className && typeof(options.className) === "string") {
		options.className = options.className.split(' ')
	}

	if (!options.className) {
		options.className = []
	}

	if(options.dark)
		options.className.push("dark")
	else
		options.className.push("light")

	options.color && options.color.split(' ').forEach(color => {
		options.className.push(color)
	})

	// toast container class
	if (options.containerClass && typeof(options.containerClass) === "string") {
		options.containerClass = options.containerClass.split(' ')
	}

	if (!options.containerClass) {
		options.containerClass = []
	}

	options.position && options.containerClass.push(options.position.trim())

	return options
}


const createToast = function (message, options) {

	// Create toast
	let toast = document.createElement('div')
	toast.classList.add('toasted')
	let mes = document.createElement('div')
	mes.classList.add('message')

	mes.innerHTML = message
	toast.appendChild(mes)

	// set unique identifier
	toast.hash = uuid.generate()

	if (options.className) {
		options.className.forEach((className) => {
			toast.classList.add(className)
		})
	}

	// add material icon if available
	createIcon(options, toast)

	if (options.closeOnSwipe) {
		// Bind hammer
		let hammerHandler = new Hammer(toast, {prevent_default: false})
		hammerHandler.on('pan', function (e) {
			let deltaX = e.deltaX
			let activationDistance = 80

			// Change toast state
			if (!toast.classList.contains('panning')) {
				toast.classList.add('panning')
			}

			let opacityPercent = 1 - Math.abs(deltaX / activationDistance)
			if (opacityPercent < 0)
				opacityPercent = 0

			animations.animatePanning(toast, deltaX, opacityPercent)

		})

		hammerHandler.on('panend', function (e) {
			let deltaX = e.deltaX
			let activationDistance = 80

			// If toast dragged past activation point
			if (Math.abs(deltaX) > activationDistance) {

				animations.animatePanEnd(toast, function () {
					if (typeof(options.onComplete) === "function") {
						options.onComplete()
					}

					if (toast.parentNode) {
						_instance.remove(toast)
					}
				})

			} else {
				toast.classList.remove('panning')
				// Put toast back into original position
				animations.animateReset(toast)
			}
		})
	}

	return toast
}

const createIcon = (options, toast) => {

	// add material icon if available
	if (options.icon) {

		let iel = document.createElement('i')
		iel.setAttribute('aria-hidden', 'true')
		let iname = options.icon

		// fontawesome and material icon are only useable
		if(iname.includes('fa-')){
			iname.split(' ').forEach(iconClass => {
				iel.classList.add(iconClass)
			})
		}
		else{
			iel.classList.add('material-icons')
			iel.textContent = (options.icon.name) ? options.icon.name : options.icon
		}

		toast.insertBefore(iel, toast.firstChild)
	}
}

const toastObject = function (el, instance) {
	return {
		el: el,
		goAway: function (delay = 800) {
			// Animate toast out
			setTimeout(function () {
				animations.animateOut(el, () => {
					instance.remove(el)
				})
			}, delay)
			return true
		},
		remove: function () {
			instance.remove(el)
		},
	}
}

/**
 * this method will create the toast
 *
 * @param instance
 * @param message
 * @param options
 * @returns {{el: *, goAway: goAway}}
 */
export default function (instance, message, options) {

	// share the instance across
	_instance = instance

	options = parseOptions(options)
	const container = _instance.container

	options.containerClass.unshift('toasted-container')

	// check if the container classes has changed if so update it
	if (container.className !== options.containerClass.join(' ')) {
		container.className = ""
		options.containerClass.forEach((className) => {
			container.classList.add(className)
		})
	}

	// Select and append toast
	let newToast = createToast(message, options)

	// only append toast if message is not undefined
	container.appendChild(newToast)

	newToast.style.opacity = 0

	// Animate toast in
	animations.animateIn(newToast)

	// Allows timer to be pause while being panned
	let timeLeft = options.duration
	let counterInterval

	const createInterval = () => setInterval(function () {
		if (newToast.parentNode === null)
			window.clearInterval(counterInterval)

		// If toast is not being dragged, decrease its time remaining
		if (!newToast.classList.contains('panning')) {
			timeLeft -= 20
		}

		if (timeLeft <= 0) {
			// Animate toast out
			animations.animateOut(newToast, function () {
				// Remove toast after it times out
				if (newToast.parentNode) {
					_instance.remove(newToast)
				}
			})
			window.clearInterval(counterInterval)
		}
	}, 20)

	counterInterval = createInterval()

	return toastObject(newToast, _instance)
}
import { MAIN_API, FALLBACK_API } from './defaults'
import suntime from './utils/suntime'

function shuffledAPIUrls(): string[] {
	return [
		MAIN_API,
		...FALLBACK_API.map((value) => ({ value, sort: Math.random() }))
			.sort((a, b) => a.sort - b.sort)
			.map(({ value }) => value), // https://stackoverflow.com/a/46545530]
	]
}

export async function apiWebSocket(path: string): Promise<WebSocket | undefined> {
	for (const url of shuffledAPIUrls()) {
		try {
			const socket = new WebSocket(url.replace('https://', 'wss://') + path)

			const isOpened = await new Promise((resolve) => {
				socket.onopen = () => resolve(true)
				socket.onerror = () => resolve(false)
				socket.onclose = () => resolve(false)
			})

			if (isOpened) {
				return socket
			}
		} catch (error) {
			console.warn(error)
		}
	}
}

export async function apiFetch(path: string): Promise<Response | undefined> {
	for (const url of shuffledAPIUrls()) {
		try {
			return await fetch(url + path)
		} catch (error) {
			console.warn(error)
			await new Promise((r) => setTimeout(() => r(true), 200))
		}
	}
}

export function stringMaxSize(str: string = '', size: number) {
	return str.length > size ? str.slice(0, size) : str
}

export function minutator(date: Date) {
	return date.getHours() * 60 + date.getMinutes()
}

export function randomString(len: number) {
	const chars = 'abcdefghijklmnopqr'
	return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function periodOfDay(time?: number) {
	// noon & evening are + /- 60 min around sunrise/set

	const mins = minutator(time ? new Date(time) : new Date())
	const { sunrise, sunset } = suntime

	if (mins >= 0 && mins <= sunrise - 60) return 'night'
	if (mins <= sunrise + 60) return 'noon'
	if (mins <= sunset - 60) return 'day'
	if (mins <= sunset + 60) return 'evening'
	if (mins >= sunset + 60) return 'night'

	return 'day'
}

export const freqControl = {
	set: () => {
		return new Date().getTime()
	},

	get: (every: string, last: number) => {
		const nowDate = new Date()
		const lastDate = new Date(last || 0)
		const changed = {
			date: nowDate.getDate() !== lastDate.getDate(),
			hour: nowDate.getHours() !== lastDate.getHours(),
		}

		switch (every) {
			case 'day':
				return changed.date

			case 'hour':
				return changed.date || changed.hour

			case 'tabs':
				return true

			case 'pause':
				return last === 0

			case 'period': {
				return last === 0 ? true : periodOfDay() !== periodOfDay(+lastDate) || false
			}

			default:
				return false
		}
	},
}

export function bundleLinks(data: Sync.Storage): Links.Link[] {
	// 1.13.0: Returns an array of found links in storage
	let res: Links.Link[] = []
	Object.entries(data).map(([key, val]) => {
		if (key.length === 11 && key.startsWith('links')) res.push(val as Links.Link)
	})

	return res
}

export const inputThrottle = (elem: HTMLInputElement, time = 800) => {
	let isThrottled = true

	setTimeout(() => {
		isThrottled = false
		elem.removeAttribute('disabled')
	}, time)

	if (isThrottled) elem.setAttribute('disabled', '')
}

export function turnRefreshButton(button: HTMLSpanElement, canTurn: boolean) {
	const animationOptions = { duration: 600, easing: 'ease-out' }
	button.animate(
		canTurn
			? [{ transform: 'rotate(360deg)' }]
			: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }, { transform: 'rotate(0deg)' }],
		animationOptions
	)
}

export function closeEditLink() {
	const domedit = document.querySelector('#editlink')
	if (!domedit) return

	domedit?.classList.add('hiding')
	document.querySelectorAll('.block.selected').forEach((block) => block?.classList.remove('selected'))
	setTimeout(() => {
		domedit ? domedit.setAttribute('class', '') : ''
	}, 200)
}

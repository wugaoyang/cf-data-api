export default class CommonUtil {
	static getCountryCode(ip: string) {
		let api = `http://ip-api.com/json/${ip}?lang=zh-CN`;
		let countryCode = '';
		fetch(api, {
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(res => res.json())
			.then(data => {
				// console.log(api, data);
				if (data) {
					// @ts-ignore
					return data.countryCode;
				}
				return '';
			});
		return countryCode.trim();
	}

	static async getCountryCodeBatch(ips: string[]) {
		// console.log('ip', ips);
		let result = new Map();
		if (!ips) {
			return result;
		}
		let api = `http://ip-api.com/batch`;
		let countryCodes: any[] = [];
		await fetch(api, {
			method: 'POST',
			// @ts-ignore
			body: JSON.stringify(ips),
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(res => {
				if (res.ok) {
					return res.json();
				}
				return [];
			})
			.then(data => {
				// @ts-ignore
				countryCodes =  data;
			}).catch(reason => {
				console.error(reason);
			});
		if (countryCodes.length > 0) {
			countryCodes.forEach(value => {
				// @ts-ignore
				result.set(value.query, value.countryCode);
			});
		}
		return result;
	}
	static async getCountryCodeBatch2(ips: string[]) {
		// console.log('ip', ips);
		let result = new Map();
		if (!ips) {
			return result;
		}
		let api = `https://ipinfo.io/batch?token=13875b602ed898`;
		await fetch(api, {
			method: 'POST',
			// @ts-ignore
			body: JSON.stringify(ips),
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(res => {
				if (res.ok) {
					return res.json();
				}
				return [];
			})
			.then(data => {
				// @ts-ignore
				result =  data;
			}).catch(reason => {
				console.error(reason);
			});
		return result;
	}

	static dateFormat(date : Date){

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始
		const day = String(date.getDate()).padStart(2, '0');

		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

// 格式: YYYY-MM-DD HH:MM:SS
		const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
		console.log(formattedTime);

	}
}

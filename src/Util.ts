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
}

export default class CommonUtil{
	static async getCountryCode(ip:string){
		let api = `http://ip-api.com/json/${ip}?lang=zh-CN`;
		let countryCode = '';
		await fetch(api).then(async res => {
			let result = await res.json();
			if(result){
				// @ts-ignore
				countryCode = result.countryCode;
			}
		});
		return countryCode;
	}
}

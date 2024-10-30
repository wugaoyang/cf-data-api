import { Env } from '../_worker';
import IpCountryService from '../service/IpCountryService';


let baseUrl: string = '/api/db/ip-country';

export default class IpCountryRouter {

	static async route(request: Request, env: Env) {
		let url = new URL(request.url);
		let pathname = url.pathname;
		if (pathname === baseUrl + '/best') {
			return await IpCountryService.getBestIps(request, env);
		}
		if (pathname === baseUrl + '/page') {
			return await IpCountryService.page(request, env);
		}
		if (pathname === baseUrl + '/list') {
			return await IpCountryService.list(request, env);
		}
		if (pathname === baseUrl + '/deleteDisableIp') {
			return await IpCountryService.deleteDisableIp(env);
		}
		if (pathname === baseUrl + '/clear') {
			return await IpCountryService.clear(env);
		}
		if (pathname === baseUrl + '/getByIp') {
			return await IpCountryService.getByIp(request, env);
		}
		if (pathname === baseUrl + '/getByIps') {
			return await IpCountryService.getByIps(request, env);
		}
		if (pathname === baseUrl + '/add') {
			return await IpCountryService.add(request, env);
		}
		if (pathname === baseUrl + '/update') {
			return await IpCountryService.update(request, env);
		}
		if (pathname === baseUrl + '/syncToFavorite') {
			return await IpCountryService.syncToFavorite(env);
		}
		return null;
	}

}

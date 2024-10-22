import { Env } from '../_worker';
import IpInfoService from '../service/IpInfoService';


let baseUrl: string = '/api/db/ip';

export default class IpInfoRouter{

	static async route(request: Request, env: Env) {
		let url = new URL(request.url);
		let pathname = url.pathname;
		if (pathname === baseUrl + '/best') {
			return await IpInfoService.getBestIps(request, env);
		}
		if (pathname === baseUrl + '/page') {
			return await IpInfoService.page(request, env);
		}
		if (pathname === baseUrl + '/list') {
			return await IpInfoService.list(request, env);
		}
		if (pathname === baseUrl + '/deleteDisableIp') {
			return await IpInfoService.deleteDisableIp(env);
		}
		if (pathname === baseUrl + '/clear') {
			return await IpInfoService.clear(env);
		}
		if (pathname === baseUrl + '/getAllReachable') {
			return await IpInfoService.getAllReachable(env);
		}
		if (pathname === baseUrl + '/add') {
			return await IpInfoService.add(request, env);
		}
		if (pathname === baseUrl + '/update') {
			return await IpInfoService.update(request, env);
		}
		if (pathname === baseUrl + '/syncToFavorite') {
			return await IpInfoService.syncToFavorite(env);
		}
		return null;
	}

}

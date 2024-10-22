import { Env } from '../_worker';
import CfIpFavoriteService from '../service/CfIpFavoriteService';


let baseUrl: string = '/api/db/ip/favorite';


export default class CfIpFavoriteRouter{

	static async route(request: Request, env: Env) {
		let url = new URL(request.url);
		let pathname = url.pathname;
		if (pathname === baseUrl + '/best') {
			return await CfIpFavoriteService.getBestIps(request, env);
		}
		if (pathname === baseUrl + '/page') {
			return await CfIpFavoriteService.page(request, env);
		}
		if (pathname === baseUrl + '/list') {
			return await CfIpFavoriteService.list(request, env);
		}
		if (pathname === baseUrl + '/deleteDisableIp') {
			return await CfIpFavoriteService.deleteDisableIp(env);
		}
		if (pathname === baseUrl + '/clear') {
			return await CfIpFavoriteService.clear(env);
		}
		if (pathname === baseUrl + '/getAllReachable') {
			return await CfIpFavoriteService.getAllReachable(env);
		}
		if (pathname === baseUrl + '/add') {
			return await CfIpFavoriteService.add(request, env);
		}
		if (pathname === baseUrl + '/update') {
			return await CfIpFavoriteService.update(request, env);
		}
		return null;
	}

}

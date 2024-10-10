import { Env } from '../index';

export default class BestIp {

	static list(env: Env) {
		return Response.json({'code':0});
	}

}


export  async function updateBestIp(request: Request<unknown, IncomingRequestCfProperties<unknown>>, env: Env) {
	try {
		if (request.method !== 'POST') {
			return new Response('不支持的请求方法：' + request.method);
		}
		if (request.method === 'POST') {
			const url = new URL(request.url);
			let area = url.searchParams.get('area');
			if (!area) {
				area = 'CF';
			}
			await env.DB.exec(
				'DELETE FROM cf_best_ip WHERE  area =\'' + area + '\''
			);
			let bestIps = '';

			if(request.headers.get("Content-Type").includes("application/json")){
				const requestBody = await request.json();
				bestIps = requestBody.bestIps;
			}else{
				bestIps = await request.text();
			}
			// console.log(bestIps);
			if (bestIps) {
				let sql = 'INSERT INTO cf_best_ip (ip, name, area, speed , status) VALUES';
				bestIps.split('\n').forEach(value => {
					console.log(value);
					let split = value.split('\t');
					if (split[0]) {
						sql += '( \'' + split[0] + '\',\'自选官方优选\',\'' + area + '\',\'' + split[5].trim() + 'MB/s\', 1 ),';
					}

				});
				sql = sql.substring(0, sql.lastIndexOf(','));
				await env.DB.exec(
					sql
				);
			}
			return new Response('update success');
		}
	} catch (error){
			return new Response('update failed :' + error);
	}
	return new Response('update failed');
}

export async function getBestIps(env: Env) {
	const { results } = await env.DB.prepare(
		'SELECT * FROM cf_best_ip WHERE status = 1'
	)
		.all();
	let res = '';
	if (results.length > 0) {
		results.forEach(value => {
			res += value.ip + '#' + value.area + value.name + ' ' + value.speed + '\n';
		});
	}
	return new Response(res);
}


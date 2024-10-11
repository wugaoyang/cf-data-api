import { Env } from '../index';

export async function bestIpList(env: Env) {
	const { results } = await env.DB.prepare(
		'SELECT * FROM cf_best_ip WHERE status = 1'
	)
		.all();
	return Response.json(results);
}


export async function updateBestIp(request: Request<unknown, IncomingRequestCfProperties<unknown>>, env: Env) {
	try {
		if (request.method !== 'POST') {
			return new Response('不支持的请求方法：' + request.method);
		}
		if (request.method === 'POST') {
			const url = new URL(request.url);
			let area = url.searchParams.get('area');
			let deleteOld = url.searchParams.get('deleteOld');
			if (!area) {
				area = 'CF';
			}
			if (deleteOld && deleteOld === '1') {
				await env.DB.exec(
					'DELETE FROM cf_best_ip WHERE  area =\'' + area + '\''
				);
			}
			let bestIps = '';
			if (request.headers.get('Content-Type').includes('application/json')) {
				const requestBody = await request.json();
				bestIps = requestBody.bestIps;
			} else {
				bestIps = await request.text();
			}
			// console.log(bestIps);
			if (bestIps) {
				let sql = 'INSERT INTO cf_best_ip (ip, name, area, speed , status) VALUES';
				bestIps.split('\n').forEach(value => {
					console.log(value);
					let split = value.split('\t');
					if (split[0]) {
						let speed = split[5];
						speed = speed ? speed.trim() : '';
						sql += '( \'' + split[0] + '\',\'自选官方优选\',\'' + area + '\',\'' + speed + '\', 1 ),';
					}

				});
				sql = sql.substring(0, sql.lastIndexOf(','));
				await env.DB.exec(
					sql
				);
			}
			return new Response('update success');
		}
	} catch (error) {
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
			let speed = value.speed;
			speed = speed ? speed + 'MB/s' : '';
			res += value.ip + '#' + value.area + value.name + ' ' + speed + '\n';
		});
	}
	return new Response(res);
}


import { Env } from '../_worker';
import Result from '../common/Result';
import CommonUtil from '../Util';

let basePath: string = '/api/db/bestIps';
export default class BestIp{
	static async list(env: Env) {
		const { results } = await env.DB.prepare(
			'SELECT * FROM cf_best_ip WHERE status = 1'
		)
			.all();
		return Result.succeed(results);
	}


	static async update(request: Request<unknown, IncomingRequestCfProperties<unknown>>, env: Env) {
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
				// @ts-ignore
				if (request.headers.get('Content-Type').includes('application/json')) {
					const requestBody = await request.json();
					// @ts-ignore
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
					await env.DB.exec(sql);
				}
				return Result.succeed('update success');
			}
		} catch (error) {
			return Result.failed('update failed :' + error);
		}
		return Result.failed('update failed');
	}

	static async getBestIps(env: Env) {
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
		return Result.succeed(res);
	}

	static async getTopIp() {
		let url = 'https://ip.164746.xyz/ipTop10.html';
		let topIps = '';
		await fetch(url).then(res => {
			if (!res.ok) {
				return '';
			}
			return res.text();
		}).then(data => {
			data.split(',').forEach(ip => {
				let countryCode = CommonUtil.getCountryCode(ip);
				topIps += `${ip}#${countryCode}自动优选`;
			})
		});
		return Result.succeed(topIps);
	}
}



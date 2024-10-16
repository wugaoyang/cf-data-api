import { Env } from '../_worker';
import Result from '../common/Result';
import CommonUtil from '../common/CommonUtil';
import moment from 'moment';

function getSql(ipArr: string[], ips: string[], querySql: string) {
	let index = 0;
	ipArr.forEach(value => {
		let split = value.split('\t');
		let ip = split[0];
		if (ip) {
			ips.push(ip);
			if (index > 0) {
				querySql += ',';
			}
			querySql += '\'' + ip + '\'';
		}
	});
	querySql += ')';
	return querySql;
}

export default class BestIp {
	static async list(env: Env) {
		const { results } = await env.DB.prepare(
			'SELECT * FROM cf_best_ip WHERE status = 1'
		)
			.all();
		return Result.succeed(JSON.stringify(results));
	}


	static async update(request: Request<unknown, IncomingRequestCfProperties<unknown>>, env: Env) {
		try {
			if (request.method === 'OPTIONS') {
				return Result.succeed('');
			}
			if (request.method !== 'POST') {
				return Result.failed('不支持的请求方法：' + request.method);
			}
			if (request.method === 'POST') {
				const url = new URL(request.url);
				let group = url.searchParams.get('group');
				let deleteOld = url.searchParams.get('deleteOld');
				if (!group) {
					group = 'CF';
				}
				if (deleteOld && deleteOld === '1') {
					await env.DB.exec(
						'DELETE FROM cf_best_ip WHERE  `group` =\'' + group + '\''
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
					let ips: string[] = [];
					let ipArr: string[] = bestIps.split('\n');

					await this.checkExist(ipArr, ips, env, group);

					let insertSql = 'INSERT INTO cf_best_ip (ip, name,`group`, area, speed , status, updatedTime) VALUES';
					let countryCodeMap: Map<string, string> = await CommonUtil.getCountryCodeBatch(ips);
					let updatedTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
					ipArr.forEach(value => {
						let split = value.split('\t');
						let ip = split[0];
						if (ip) {
							ips.push(ip);
							let speed = split[5];
							speed = speed ? speed.trim() : '';
							let area = countryCodeMap.get(ip) || '';
							insertSql += '( \'' + ip + '\',\'自选官方优选\',\'' + group + '\',\'' + area + '\',\'' + speed + '\', 1 , \'' + updatedTime + '\'),';
						}
					});
					insertSql = insertSql.substring(0, insertSql.lastIndexOf(','));
					console.log(insertSql);
					await env.DB.exec(insertSql);
				}
				return Result.succeed('update success');
			}
		} catch (error) {
			console.error(error);
			return Result.failed('update failed :' + error);
		}
		return Result.failed('update failed');
	}

	static async checkExist(ipArr: string[], ips: string[], env: Env, group: string) {
		let querySql = 'select * from cf_best_ip where ip in(';
		querySql = getSql(ipArr, ips, querySql);
		// @ts-ignore
		const { results } = await env.DB.prepare(querySql).all();
		console.log('查询结果：', querySql, '\n', results);
		if (results.length > 0) {
			let deleteSql = 'DELETE FROM cf_best_ip WHERE  `ip` in (';
			deleteSql = getSql(ipArr, ips, deleteSql);
			await env.DB.exec(
				deleteSql
			);
		}
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
				res += value.ip + '#' + value.area + ' ' + value.group + value.name + ' ' + speed + '\n';
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
		}).then(async data => {

			let ips = data.split(',');
			let countryCodes = await CommonUtil.getCountryCodeBatch(ips);
			console.log('countryCodes', countryCodes);
			for (const ip of ips) {
				// @ts-ignore
				topIps += `${ip}#${countryCodes.get(ip)} 自动优选\n`;
			}
		});
		return Result.succeed(topIps);
	}
}



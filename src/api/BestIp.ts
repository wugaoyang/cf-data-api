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
		index++;
	});
	querySql += ')';
	return querySql;
}

async function getData(sql: string, env: Env) {
	const { results } = await env.DB.prepare(
		sql
	).all();
	let res = '';
	if (results.length > 0) {
		results.forEach(value => {
			let speed = value.speed;
			speed = speed ? speed + 'MB/s' : '';
			res += value.ip + '#' + value.area + ' ' + value.group + value.name + ' ' + speed + '\n';
		});
	}
	return res;
}

export default class BestIp {
	static async page(request: Request<unknown, IncomingRequestCfProperties>, env: Env) {
		if (request.method === 'OPTIONS') {
			return Result.succeed('');
		}
		if (request.method !== 'POST') {
			return Result.failed('不支持的请求方法：' + request.method);
		}
		let queryData: {} = await request.json();
		let pageVO: {} = queryData.pageVO;
		let data: {} = queryData.data;
		let pageIndex = pageVO.pageIndex || 1;
		let pageSize = pageVO.pageSize || 10;
		let start = (pageIndex - 1) * pageSize;
		let condition = '';
		if (data.name) {
			condition += 'and name like \'%' + data.name + '%\'';
		}
		if (data.group) {
			condition += 'and `group` like \'%' + data.group + '%\'';
		}
		if (data.status) {
			condition += 'and `status` = ' + data.status;
		}
		let countSql = 'SELECT count(1) total FROM cf_best_ip where 1=1 ' + condition;
		let result = await env.DB.prepare(countSql).all();
		let total = result.results[0].total;
		let querySql = 'SELECT * FROM cf_best_ip where 1=1 ' + condition + ' order by updatedTime desc limit ?,?';
		const { results } = await env.DB.prepare(querySql).bind(start, pageSize).all();
		let queryResult = { total: total, data: results };
		return Result.succeed(JSON.stringify(queryResult));
	}

	static async list(env: Env) {
		const { results } = await env.DB.prepare(
			'SELECT * FROM cf_best_ip WHERE status in(0, 1) order by updatedTime desc limit 20 '
		)
			.all();
		return Result.succeed(JSON.stringify(results));
	}

	static async add(request: Request<unknown, IncomingRequestCfProperties>, env: Env) {
		if (request.method === 'OPTIONS') {
			return Result.succeed('');
		}
		if (request.method !== 'POST') {
			return Result.failed('不支持的请求方法：' + request.method);
		}
		let bestIps: [] = await request.json();
		if (!bestIps) {
			return Result.failed('ip为空');
		}
		let ips: string[] = await this.checkExist(bestIps, env);
		if (bestIps.length <= 0) {
			return Result.failed('ip已存在:' + JSON.stringify(bestIps));
		}

		let insertSql = 'INSERT INTO cf_best_ip (ip, name,`group`, area, delay, speed , `status`, `source`, updatedTime) VALUES';
		// console.log(insertSql);
		let countryCodeMap: Map<string, string> = await CommonUtil.getCountryCodeBatch(ips);
		let updatedTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
		let index = 0;
		bestIps.forEach(ipInfo => {
			let ip = ipInfo.ip || '';
			if (ip) {
				if (index > 0) {
					insertSql += ',';
				}
				let delay = ipInfo.delay || 0;
				let speed = ipInfo.speed || 0;
				let status = ipInfo.status || 0;
				let area = countryCodeMap.get(ip) || '';
				insertSql += '( \'' + ip + '\',\'自选官方优选\',\'CF\',\'' + area + '\',' + delay + ', \'' + speed + '\', ' + status + ', 1, \'' + updatedTime + '\')';
				index++;
			}
		});
		// console.log(insertSql);
		await env.DB.exec(insertSql);
		return Result.succeed('添加成功');
	}

	static async update(request: Request<unknown, IncomingRequestCfProperties>, env: Env) {
		try {
			if (request.method === 'OPTIONS') {
				return Result.succeed('');
			}
			if (request.method !== 'POST') {
				return Result.failed('不支持的请求方法：' + request.method);
			}
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
			if (bestIps) {
				let ipArr: string[] = bestIps.split('\n');

				let ips: string[] = await this.deleteExist(ipArr, env);

				let insertSql = 'INSERT INTO cf_best_ip (ip, name,`group`, area, speed , status, `source`, updatedTime) VALUES';
				let countryCodeMap: Map<string, string> = await CommonUtil.getCountryCodeBatch(ips);
				let updatedTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
				ipArr.forEach(value => {
					let split = value.split('\t');
					let ip = split[0];
					if (ip) {
						let speed = split[5];
						speed = speed ? speed.trim() : '';
						let area = countryCodeMap.get(ip) || '';
						insertSql += '( \'' + ip + '\',\'自选官方优选\',\'' + group + '\',\'' + area + '\',\'' + speed + '\', 1, 1, \'' + updatedTime + '\'),';
					}
				});
				insertSql = insertSql.substring(0, insertSql.lastIndexOf(','));
				// console.log(insertSql);
				await env.DB.exec(insertSql);
			}
			return Result.succeed('update success');
		} catch (error) {
			console.error(error);
			return Result.failed('update failed :' + error);
		}
		return Result.failed('update failed');
	}

	/**
	 * 检查是否已存在，若已存在，则删除
	 * @param ipArr
	 * @param ips
	 * @param env
	 */
	static async deleteExist(ipArr: string[], env: Env) {
		let ips: string[] = [];
		if (ipArr.length <= 0) {
			return ips;
		}
		// let querySql = 'select * from cf_best_ip where ip in(';
		// querySql = getSql(ipArr, ips, querySql);
		// @ts-ignore
		// const { results } = await env.DB.prepare(querySql).all();
		// console.log('查询结果：', querySql, '\n', results);
		// if (results.length > 0) {
		let deleteSql = 'DELETE FROM cf_best_ip WHERE  `ip` in (';
		deleteSql = getSql(ipArr, ips, deleteSql);
		await env.DB.exec(
			deleteSql
		);
		// }
		return ips;
	}

	static async getBestIps(env: Env) {
		let sql = 'SELECT * FROM cf_best_ip WHERE status in(0, 1) and `source` = 1 order by  speed desc, delay desc limit 10';
		let res = await getData(sql, env);
		sql = 'SELECT * FROM cf_best_ip WHERE status in(0, 1) and `source` = 2 order by  speed desc, delay desc limit 10';
		res += await getData(sql, env);
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
			// console.log('countryCodes', countryCodes);
			for (const ip of ips) {
				// @ts-ignore
				topIps += `${ip}#${countryCodes.get(ip)} 自动优选\n`;
			}
		});
		return Result.succeed(topIps);
	}

	/**
	 * 检查是否存在
	 * @param ipArr
	 * @param env
	 * @private
	 */
	private static async checkExist(bestIps: {}[], env: Env) {
		let ips: string[] = [];
		let ipArr: string[] = [];
		let ipMap: Map<string, any> = new Map();
		bestIps.forEach(value => {
			let ip = value.ip || '';
			ipArr.push(ip);
			ipMap.set(ip, value);
			ips.push(ip);
		});
		if (ipArr.length <= 0) {
			return ips;
		}
		let querySql = 'select * from cf_best_ip where ip in(';
		querySql = getSql(ipArr, [], querySql);
		const { results } = await env.DB.prepare(querySql).all();
		// console.log('查询结果：', querySql, '\n', results);
		if (results.length > 0) {
			results.forEach(value => {
				let ip: string = <string>value.ip;
				ipMap.get(ip).status = value.status;
			});
			await this.deleteExist(ips, env);
		}
		return ips;
	}
}



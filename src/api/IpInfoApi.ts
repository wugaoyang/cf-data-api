import { Env } from '../_worker';
import Result from '../common/Result';
import CommonUtil from '../common/CommonUtil';
import moment from 'moment';
import QueryData, { PageVO } from '../model/QueryData';
import IpInfo from '../model/IpInfo';

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


export default class IpInfoApi {
	/**
	 * 分页查询
	 * @param request
	 * @param env
	 */
	static async page(request: Request, env: Env) {
		if (request.method === 'OPTIONS') {
			return Result.succeed('');
		}
		if (request.method !== 'POST') {
			return Result.failed('不支持的请求方法：' + request.method);
		}
		let queryData: { data: QueryData, pageVO: PageVO } = await request.json();
		let pageVO: PageVO = queryData.pageVO;
		let data: QueryData = queryData.data;
		let pageIndex = pageVO.pageIndex || 1;
		let pageSize = pageVO.pageSize || 10;
		let start = (pageIndex - 1) * pageSize;
		let condition = '';
		if (data.ip) {
			condition += ' and ip like \'%' + data.ip + '%\'';
		}
		if (data.name) {
			condition += ' and name like \'%' + data.name + '%\'';
		}
		if (data.countryNameCN) {
			condition += ' and countryNameCN like \'%' + data.countryNameCN.trim() + '%\'';
		}
		if (data.group) {
			condition += ' and `group` like \'%' + data.group + '%\'';
		}
		if (data.status) {
			condition += ' and `status` = ' + data.status;
		}
		if (data.speed1) {
			condition += ' and `speed` >= ' + data.speed1;
		}
		if (data.speed2) {
			condition += ' and `speed` <= ' + data.speed2;
		}
		if (data.delay1) {
			condition += ' and `delay` >= ' + data.delay1;
		}
		if (data.delay2) {
			condition += ' and `delay` <= ' + data.delay2;
		}
		if (data.countryCode) {
			condition += ' and `countryCode` = \'' + data.countryCode + '\'';
		}
		if (data.countryCodeIsNull) {
			condition += ' and (`countryCode` is null  or `countryCode` = \'\')';
		}
		if (data.reachable) {
			if (data.reachable == 1) {
				condition += ' and `delay` > 0';
			} else {
				condition += ' and `delay` <= 0 ';
			}
		}
		let countSql = 'SELECT count(1) total FROM cf_best_ip where 1=1 ' + condition;
		// console.log(countSql);
		let result = await env.DB.prepare(countSql).all();
		let total = result.results[0].total;
		let querySql = 'SELECT * FROM cf_best_ip where 1=1 ' + condition + ' order by updatedTime desc limit ?,?';
		const { results } = await env.DB.prepare(querySql).bind(start, pageSize).all();
		let queryResult = { total: total, data: results };
		return Result.succeed(JSON.stringify(queryResult));
	}

	/**
	 * 查询列表
	 * @param env
	 */
	static async getAllReachable(env: Env) {
		const { results } = await env.DB.prepare(
			'SELECT * FROM cf_best_ip WHERE status in(0) and delay > 0'
		).all();
		return Result.succeed(JSON.stringify(results));
	}

	/**
	 * 删除不好的ip
	 * @param env
	 */
	static async deleteDisableIp(env: Env) {
		await env.DB.exec(
			'delete FROM cf_best_ip WHERE status in(0) or delay <= 0 or speed < 10'
		);
		return Result.succeed('删除成功');
	}

	/**
	 * 查询列表
	 * @param env
	 */
	static async list(request: Request, env: Env) {
		let url = new URL(request.url);
		let limit = url.searchParams.get('limit');
		let limitCondition = '';
		if (limit) {
			limitCondition = 'limit ' + limit;
		}
		const { results } = await env.DB.prepare(
			'SELECT * FROM cf_best_ip order by updatedTime desc ' + limitCondition
		).all();
		return Result.succeed(JSON.stringify(results));
	}

	static async clear(env: Env) {
		await env.DB.exec(
			'DELETE FROM cf_best_ip '
		);
		return Result.succeed('删除成功');
	}

	/**
	 * 添加ip信息
	 * @param request
	 * @param env
	 */
	static async add(request: Request, env: Env) {
		if (request.method === 'OPTIONS') {
			return Result.succeed('');
		}
		if (request.method !== 'POST') {
			return Result.failed('不支持的请求方法：' + request.method);
		}
		let IpInfos: IpInfo[] = await request.json();
		if (!IpInfos) {
			return Result.failed('ip为空');
		}
		return await this.doAdd(IpInfos, env);
	}

	static async doAdd(IpInfos: IpInfo[], env: Env) {
		let ips: string[] = await this.checkExist(IpInfos, env);
		if (IpInfos.length <= 0) {
			return Result.failed('ip已存在:' + JSON.stringify(IpInfos));
		}
		// let noCountryCodes = IpInfos.filter(value => !value.countryCode);


		let insertSql = 'INSERT INTO cf_best_ip (ip,' +
			'cityNameCN,' +
			'cityNameEN,' +
			'continentCode,' +
			'countryCode,' +
			'countryNameEN,' +
			'countryNameCN,' +
			'latitude,' +
			'longitude, name,`group`, delay, speed , `status`, `source`, updatedTime) VALUES';
		// console.log(insertSql);
		// let countryCodeMap: Map<string, string> = await CommonUtil.getCountryCodeBatch(ips);
		let updatedTime = moment(new Date(new Date().getTime() + 8 * 60 * 60 * 100)).format('YYYY-MM-DD HH:mm:ss');
		let index = 0;
		IpInfos.forEach(ipInfo => {
			let ip = ipInfo.ip || '';
			if (ip) {
				updatedTime = ipInfo.updatedTime || updatedTime;
				if (index > 0) {
					insertSql += ',';
				}
				let cityNameCn = ipInfo.cityNameCn || '';
				let cityNameEn = ipInfo.cityNameEn || '';
				let continentCode = ipInfo.continentCode || '';
				let countryCode = ipInfo.countryCode || '';
				let countryNameEN = ipInfo.countryNameEN || '';
				let countryNameCN = ipInfo.countryNameCN || '';
				let latitude = ipInfo.latitude || '';
				let longitude = ipInfo.longitude || '';
				let delay = ipInfo.delay || 0;
				let speed = ipInfo.speed || 0;
				let status = ipInfo.status || 0;
				let name = '自选官方优选';
				let group = 'CF';
				insertSql += '( \'' + ip + '\',' +
					'\'' + cityNameCn + '\',' +
					'\'' + cityNameEn + '\',' +
					'\'' + continentCode + '\',' +
					'\'' + countryCode + '\',' +
					'\'' + countryNameEN + '\',' +
					'\'' + countryNameCN + '\',' +
					'\'' + latitude + '\',' +
					'\'' + longitude + '\',' +
					'\'' + name + '\',' +
					'\'' + group + '\',' +
					+delay + ', ' +
					'\'' + speed + '\', ' +
					status + ', ' +
					'1, ' +
					'\'' + updatedTime + '\')';
				index++;
			}
		});
		// console.log(insertSql);
		await env.DB.exec(insertSql);
		return Result.succeed('添加成功');
	}

	static async update(request: Request, env: Env) {
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

				let insertSql = 'INSERT INTO cf_best_ip (ip, name,`group`,  speed , status, `source`, updatedTime) VALUES';
				let countryCodeMap: Map<string, string> = await CommonUtil.getCountryCodeBatch(ips);
				let updatedTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
				ipArr.forEach(value => {
					let split = value.split('\t');
					let ip = split[0];
					if (ip) {
						let speed = split[5];
						speed = speed ? speed.trim() : '';
						insertSql += '( \'' + ip + '\',\'自选官方优选\',\'' + group + '\',\'' + speed + '\', 1, 1, \'' + updatedTime + '\'),';
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

	static async getBestIps(request: Request, env: Env) {
		let sql2 = `WITH RankedRecords AS (SELECT ip,
																							name,
																							countryCode,
																							"group",
																							delay,
																							speed,
																							source,
																							status,
																							updatedTime,
																							ROW_NUMBER() OVER (PARTITION BY countryCode ORDER BY speed DESC, delay ASC) AS rn
																			 FROM cf_best_ip
																			 where status = 1)
								SELECT ip,
											 name,
											 countryCode,
											 "group",
											 delay,
											 speed,
											 source,
											 status,
											 updatedTime
								FROM RankedRecords
								WHERE rn <= 5;
		`;
		let data = await this.getIpInfoVO(sql2, request, env);
		return Result.succeed(data);
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
	private static async checkExist(bestIps: IpInfo[], env: Env) {
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
				let newVar = ipMap.get(ip);
				if (!newVar.status) {
					newVar.status = value.status;
				}
				if (!newVar.speed) {
					newVar.speed = value.speed;
				}

			});
			await this.deleteExist(ips, env);
		}
		return ips;
	}

	static async getIpInfoVO(sql: string, request: Request, env: Env) {
		const { results } = await env.DB.prepare(
			sql
		).all();
		let res = '';
		if (results.length > 0) {
			let url: URL = new URL(request.url);
			let showSpeed: boolean = url.searchParams.has('showSpeed');
			let showGroup: boolean = url.searchParams.has('showGroup');

			let ipInfos: IpInfo[] = [];
			let ips: [] = [];
			results.forEach(value => {
				let speed: unknown = value.speed;
				// @ts-ignore
				speed = showSpeed && speed ? speed.toFixed(2) + 'MB/s' : '';
				let countryCode = value.countryCode;
				let ip = value.ip;
				if (countryCode) {
					let group = showGroup ? value.group : '';
					res += ip + '#' + countryCode + ' ' + group + value.name + ' ' + speed + '\n';
				} else {
					// @ts-ignore
					ipInfos.push(value);
					// @ts-ignore
					ips.push(ip);
				}
			});
			if (ipInfos.length > 0) {
				let countryCodeBatch: Map<string, any> = await CommonUtil.getCountryCodeBatch(ips);
				ipInfos.forEach(value => {
					value.countryCode = countryCodeBatch.get(value.ip);
				});
				await this.doAdd(ipInfos, env);
			}
		}
		return res;
	}

}


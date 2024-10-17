import maxmind from 'maxmind'; // maxmind library to parse mmdb
import { Env } from '../_worker';

export default class IpLocationFinder {

	static async find(request: Request, env: Env) {
		try {
			// 获取客户端的 IP 地址
			const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');

			// 从 R2 中获取 GeoLite2 数据库文件
			const geoData = await env.GEO_BUCKET.get('GeoLite2-City.mmdb'); // R2_BUCKET is bound as GEO_BUCKET

			if (!geoData) {
				return new Response('GeoLite2 database not found in R2', { status: 404 });
			}

			// 将文件转换为 ArrayBuffer，适配 maxmind 库
			const arrayBuffer = await geoData.arrayBuffer();

			// 使用 maxmind 解析 .mmdb 文件
			const lookup = await maxmind.open(new Uint8Array(arrayBuffer));

			// 查询客户端 IP 的地理位置
			const geoInfo = lookup.get(clientIP);

			if (!geoInfo) {
				return new Response('IP Address not found in GeoLite2 database', { status: 404 });
			}

			// 返回地理位置信息
			return new Response(JSON.stringify(geoInfo), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (error) {
			console.error(error);
			// 捕获并处理错误
			return new Response(`Error: ${error.message}`, { status: 500 });
		}
	}

	static self(){

	}
}

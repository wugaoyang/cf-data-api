// @ts-ignore
import CFIndexApi, { sampleVectors } from './api/CFIndexApi';
import IpInfoApi from './api/IpInfoApi';
import Result from './common/Result';

export interface Env {
	// If you set another name in wrangler.toml as the value for 'binding',
	// replace "DB" with the variable name you defined.
	DB: D1Database;
	GEO_BUCKET: R2Bucket;
	VECTORIZE: Vectorize;
}

let bestIpUrl = '/api/db/ip';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// console.log(request);
		let url = new URL(request.url);
		let pathname = url.pathname;
		if (pathname === bestIpUrl + '/best') {
			return await IpInfoApi.getBestIps(request, env);
		}

		if (pathname === bestIpUrl + '/page') {
			return await IpInfoApi.page(request, env);
		}
		if (pathname === bestIpUrl + '/list') {
			return await IpInfoApi.list(request, env);
		}
		if (pathname === bestIpUrl + '/deleteDisableIp') {
			return await IpInfoApi.deleteDisableIp(env);
		}
		if (pathname === bestIpUrl + '/clear') {
			return await IpInfoApi.clear(env);
		}
		if (pathname === bestIpUrl + '/getAllReachable') {
			return await IpInfoApi.getAllReachable(env);
		}
		if (pathname === bestIpUrl + '/add') {
			return await IpInfoApi.add(request, env);
		}
		if (pathname === bestIpUrl + '/update') {
			return await IpInfoApi.update(request, env);
		}

		if (pathname === '/api/index') {
			return await CFIndexApi.queryIndex(env);
		}

		if (pathname === '/api/topIps') {
			return IpInfoApi.getTopIp();
		}

		// You only need to insert vectors into your index once
		if (pathname.startsWith('/api/index/insert')) {
			// Insert some sample vectors into your index
			// In a real application, these vectors would be the output of a machine learning (ML) model,
			// such as Workers AI, OpenAI, or Cohere.
			const inserted = await env.VECTORIZE.insert(sampleVectors);

			// Return the mutation identifier for this insert operation
			return Response.json(inserted);
		}

		return Result.succeed(
			'data api'
		);
	}
} satisfies ExportedHandler<Env>;



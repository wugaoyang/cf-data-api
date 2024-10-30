// @ts-ignore
import CFIndexApi, { sampleVectors } from './service/CFIndexService';
import IpInfoService from './service/IpInfoService';
import Result from './common/Result';
import IpInfoRouter from './router/IpInfoRouter';
import CfIpFavoriteRouter from './router/CfIpFavoriteRouter';
import IpCountryRouter from './router/IpCountryRouter';

export interface Env {
	// If you set another name in wrangler.toml as the value for 'binding',
	// replace "DB" with the variable name you defined.
	DB: D1Database;
	GEO_BUCKET: R2Bucket;
	VECTORIZE: Vectorize;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// console.log(request);
		let url = new URL(request.url);
		let pathname = url.pathname;
		let response = await IpInfoRouter.route(request, env);
		if (response) {
			return response;
		}
		response = await CfIpFavoriteRouter.route(request, env);
		if (response) {
			return response;
		}

		response = await IpCountryRouter.route(request, env);
		if (response) {
			return response;
		}

		if (pathname === '/api/index') {
			return await CFIndexApi.queryIndex(env);
		}

		if (pathname === '/api/topIps') {
			return IpInfoService.getTopIp();
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

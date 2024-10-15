// @ts-ignore
import CFIndex, { sampleVectors } from './api/CFIndex';
import Result from './common/Result';
import BestIp from './api/BestIp';

export interface Env {
	// If you set another name in wrangler.toml as the value for 'binding',
	// replace "DB" with the variable name you defined.
	DB: D1Database;
	VECTORIZE: Vectorize;
}

let bestIpUrl = '/api/db/bestips';

export default {
	async fetch(request, env): Promise<Response> {
		// console.log(request);
		let response;
		let url = new URL(request.url);
		let pathname = url.pathname;
		if (pathname === bestIpUrl || pathname === bestIpUrl + '/') {
			return await BestIp.getBestIps(env);
		}

		if (pathname === bestIpUrl + '/list') {
			return await BestIp.list(env);
			;
		}
		if (pathname === bestIpUrl + '/update') {
			return await BestIp.update(request, env);
		}

		if (pathname === '/api/index') {
			return await CFIndex.queryIndex(env);
		}

		if (pathname === '/api/topIps') {
			return BestIp.getTopIp();
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

		return new Response(
			'Call /api/beverages to see everyone who works at Bs Beverages'
		);
	}
} satisfies ExportedHandler<Env>;



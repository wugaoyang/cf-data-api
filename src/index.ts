// @ts-ignore
import { updateBestIp, getBestIps, bestIpList } from './api/bestIp';
import { queryIndex, sampleVectors } from './api/cf_index';

export interface Env {
	// If you set another name in wrangler.toml as the value for 'binding',
	// replace "DB" with the variable name you defined.
	DB: D1Database;
	VECTORIZE: Vectorize;
}

let bestIpUrl = '/api/db/bestips';

function setCORS(response) {
	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Access-Control-Allow-Methods', '*');
	response.headers.set('Access-Control-Allow-Headers', '*');
}

export default {
	async fetch(request, env): Promise<Response> {
		// console.log(request);
		let response;
		let { pathname } = new URL(request.url);
		if (pathname.indexOf('?') > -1) {
			pathname = pathname.substring(0, pathname.indexOf('?'));
		}
		if (pathname === bestIpUrl || pathname === bestIpUrl + '/') {
			response = await getBestIps(env)
			setCORS(response)
			return response;
		}

		if (pathname === bestIpUrl + '/list') {
			response = await bestIpList(env);
			// console.log("=============",response)
			setCORS(response);
			return response;
		}
		if (pathname === bestIpUrl + '/update') {
			response = await updateBestIp(request, env);
			setCORS(response);
			return response;
		}

		if (pathname === '/api/index') {
			return await queryIndex(env);
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



export default class Result{
	static succeed(data: any){
		let response = new Response(data , {status : 200})
		setCORS(response)
		return response;
	}

	static failed(msg: string) {
		return new Response(msg , {status : 500});
	}
}

function setCORS(response: Response) {
	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Access-Control-Allow-Methods', '*');
	response.headers.set('Access-Control-Allow-Headers', '*');
}

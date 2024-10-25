export default class QueryData {
	ip: string = '';
	name: string = '';
	group: string = '';
	status: string | number = '';
	countryCode: string = '';
	countryNameCN: string = '';
	reachable: string | number = '';
	speed1: number | string = '';
	speed2: number | string = '';
	delay1: number | string = '';
	delay2: number | string = '';
	countryCodeIsNull: boolean | string = '';
	pageVO: PageVO = new PageVO();
}

export class PageVO {
	pageIndex: number = 1;
	pageSize: number = 10;
}

export type Provider = {
	name: string;
	url: string;
	description: string;
	tag?: string;
	price?: string;
	priceSub?: string;
	specs?: { label: string; value: string }[];
};

export type Category = {
	id: string;
	title: string;
	description: string;
	intro?: string;
	priceLabel?: string;
	providers: Provider[];
};

const categories: Category[] = [
	{
		id: "el",
		title: "El",
		description: "Sammenlign elselskaber og find den billigste elaftale i Danmark.",
		intro:
			"Elpriser svinger fra selskab til selskab. Sammenlign aktuelle aftaler nedenfor og skift til en billigere udbyder på få minutter.",
		priceLabel: "Din estimerede pris",
		providers: [
			{
				name: "EWII",
				url: "https://www.ewii.dk",
				description: "Variabel El",
				tag: "Grøn strøm",
				price: "1,42 kr. pr. kWh",
				priceSub: "590 kr. pr. måned",
				specs: [
					{ label: "Betaling", value: "Aconto" },
					{ label: "Pristype", value: "Variabel" },
					{ label: "Binding", value: "Ingen" },
				],
			},
			{
				name: "FindElpriser",
				url: "https://www.findelpriser.dk",
				description: "Sammenligningstjeneste",
				price: "Sammenlign alle",
				priceSub: "Opdateres dagligt",
				specs: [
					{ label: "Type", value: "Prisportal" },
					{ label: "Dækning", value: "Hele DK" },
					{ label: "Pris", value: "Gratis" },
				],
			},
		],
	},
	{
		id: "mobil",
		title: "Mobilabonnement",
		description: "Find det billigste mobilabonnement med data, taletid og sms.",
		intro:
			"Mobilabonnementer er en af de letteste poster at spare penge på. Sammenlign udbydere og skift til en billigere aftale uden at skifte nummer.",
		priceLabel: "Pris pr. måned",
		providers: [
			{
				name: "Greentel",
				url: "https://www.greentel.dk",
				description: "Fri tale + data",
				tag: "Bedst i test",
				price: "79 kr.",
				priceSub: "pr. måned",
				specs: [
					{ label: "Data", value: "50 GB" },
					{ label: "Tale", value: "Fri" },
					{ label: "Binding", value: "Ingen" },
				],
			},
			{
				name: "Lyca Mobile",
				url: "https://www.lycamobile.dk",
				description: "Smart Plan",
				price: "59 kr.",
				priceSub: "pr. måned",
				specs: [
					{ label: "Data", value: "30 GB" },
					{ label: "Tale", value: "Fri" },
					{ label: "Binding", value: "Ingen" },
				],
			},
			{
				name: "Oister",
				url: "https://www.oister.dk",
				description: "Fri tale",
				price: "99 kr.",
				priceSub: "pr. måned",
				specs: [
					{ label: "Data", value: "100 GB" },
					{ label: "Tale", value: "Fri" },
					{ label: "Binding", value: "Ingen" },
				],
			},
		],
	},
	{
		id: "internet",
		title: "Internet",
		description: "Sammenlign internetudbydere og find det hurtigste bredbånd til den bedste pris.",
		intro:
			"Hastighed og pris varierer kraftigt mellem udbyderne. Sammenlign aktuelle aftaler og find den bedste internetforbindelse til din adresse.",
		priceLabel: "Pris pr. måned",
		providers: [
			{
				name: "Hiper",
				url: "https://www.hiper.dk",
				description: "1000/1000 Mbit fiber",
				tag: "Hurtigst",
				price: "299 kr.",
				priceSub: "pr. måned",
				specs: [
					{ label: "Hastighed", value: "1000 Mbit" },
					{ label: "Type", value: "Fiber" },
					{ label: "Binding", value: "6 mdr." },
				],
			},
		],
	},
	{
		id: "tv-streaming",
		title: "TV & Streaming",
		description: "Find den billigste TV-pakke og streamingtjeneste.",
		providers: [
			{
				name: "Allente",
				url: "https://www.allente.dk",
				description: "TV-pakker via parabol og stream",
			},
		],
	},
	{
		id: "bank-laan",
		title: "Bank & lån",
		description: "Sammenlign banker og find det billigste lån.",
		providers: [
			{
				name: "FindBank",
				url: "https://www.findbank.dk",
				description: "Sammenlign banker og lån",
			},
		],
	},
	{
		id: "investering",
		title: "Investering",
		description: "Sammenlign investeringsplatforme og kurtage.",
		providers: [
			{
				name: "Norm Invest",
				url: "https://www.norminvest.dk",
				description: "Robo-advisor med lave omkostninger",
			},
			{
				name: "Saxo Bank",
				url: "https://www.home.saxo/da-dk",
				description: "Handel med aktier, ETF'er og fonde",
			},
		],
	},
	{
		id: "tjen-penge",
		title: "Tjen penge",
		description: "Tjen penge online via undersøgelser og paneler.",
		providers: [
			{
				name: "Gallup Forum",
				url: "https://www.gallupforum.dk",
				description: "Få betaling for at deltage i undersøgelser",
			},
		],
	},
];

export const getSavingsCategories = () => categories;
export const getSavingsCategory = (slug: string) => categories.find((c) => c.id === slug) ?? null;

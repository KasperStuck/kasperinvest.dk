import norminvestKvinder from "@/assets/partners/norminvest-gratis-investeringsplan-kvinder.png";
import norminvestPar from "@/assets/partners/norminvest-gratis-investeringsplan-par.png";
import saxoBedste from "@/assets/partners/saxo-bedste-investeringsplatform.png";

const NORMINVEST_EXCLUDE = [
	"saxo",
	"lunar",
	"maj invest",
	"majinvest",
	"june",
	"frinans",
];

const SAXO_EXCLUDE = [
	"norm invest",
	"norminvest",
	"lunar",
	"maj invest",
	"majinvest",
	"june",
	"frinans",
];

export const banners = [
	{
		image: norminvestPar,
		alt: "Norm Invest - Den nemmeste måde at investere, gratis investeringsplan",
		href: "https://at.norminvest.com/t/t?a=1873806258&as=2056026217&t=2&tk=1",
		keywords: [],
		exclude: NORMINVEST_EXCLUDE,
	},
	{
		image: norminvestKvinder,
		alt: "Norm Invest - Den nemmeste måde at investere, gratis investeringsplan",
		href: "https://at.norminvest.com/t/t?a=1873806210&as=2056026217&t=2&tk=1",
		keywords: [],
		exclude: NORMINVEST_EXCLUDE,
	},
	{
		image: saxoBedste,
		alt: "Saxo Bank - Dansk investeringsplatform med handel i aktier, ETF'er, obligationer og fonde",
		href: "https://go.adt212.net/t/t?a=1937587093&as=2056026217&t=2&tk=1",
		keywords: ["investering", "aktier", "etf", "portefølje", "kurtage", "platform", "obligationer"],
		exclude: SAXO_EXCLUDE,
	},
];

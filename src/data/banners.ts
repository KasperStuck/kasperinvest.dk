import livrenteMand from "@/assets/partners/nordnet-livrente-mand.png";
import livrenteKvinde from "@/assets/partners/nordnet-livrente-kvinde.png";
import mindreaarig from "@/assets/partners/nordnet-mindreaarig.png";
import norminvestPar from "@/assets/partners/norminvest-gratis-investeringsplan-par.png";
import norminvestKvinder from "@/assets/partners/norminvest-gratis-investeringsplan-kvinder.png";

const NORDNET_EXCLUDE = ["saxo", "lunar", "norm invest", "norminvest", "maj invest", "majinvest", "june", "frinans"];
const NORMINVEST_EXCLUDE = ["nordnet", "saxo", "lunar", "maj invest", "majinvest", "june", "frinans"];

export const banners = [
	{
		image: livrenteMand,
		alt: "Nordnet - Livsvarig pension, flyt din livrente",
		href: "https://go.adt212.net/t/t?a=1930764499&as=2056026217&t=2&tk=1",
		keywords: ["pension", "livrente", "ratepension", "aldersopsparing", "mand"],
		exclude: NORDNET_EXCLUDE,
	},
	{
		image: livrenteKvinde,
		alt: "Nordnet - Invester selv din pension, flyt din livrente",
		href: "https://go.adt212.net/t/t?a=1930763698&as=2056026217&t=2&tk=1",
		keywords: ["pension", "livrente", "ratepension", "aldersopsparing", "kvinde", "hende", "dame"],
		exclude: NORDNET_EXCLUDE,
	},
	{
		image: mindreaarig,
		alt: "Nordnet - Opret en konto for mindreårige",
		href: "https://go.adt212.net/t/t?a=1886842299&as=2056026217&t=2&tk=1",
		keywords: ["børn", "mindreårig", "børneopsparing", "barn"],
		exclude: NORDNET_EXCLUDE,
	},
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
];

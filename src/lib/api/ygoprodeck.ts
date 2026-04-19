export interface YGOCard {
	id: number;
	name: string;
	type: string;
	frameType: string;
	desc: string;
	race: string;
	archetype?: string;
	atk?: number;
	def?: number;
	level?: number;
	attribute?: string;
	card_sets?: YGOCardSet[];
	card_images: YGOCardImage[];
	card_prices: YGOCardPrice[];
}

export interface YGOCardImage {
	id: number;
	image_url: string;
	image_url_small: string;
	image_url_cropped: string;
}

export interface YGOCardPrice {
	cardmarket_price: number;
	tcgplayer_price: number;
	ebay_price: number;
	amazon_price: number;
	coolstuffinc_price: number;
}

export interface YGOCardSet {
	set_name: string;
	set_code: string;
	set_rarity: string;
	set_rarity_code: string;
	set_price: number;
}

export interface YGOApiResponse {
	data: YGOCard[];
	page: number;
	page_size: number;
	total: number;
}

const API_BASE_URL = 'https://db.ygoprodeck.com/api/v7';

export async function fetchAllCards(page = 1, pageSize = 100): Promise<YGOApiResponse> {
	const response = await fetch(`${API_BASE_URL}/cardinfo.php?num=${pageSize}&offset=${(page - 1) * pageSize}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch cards: ${response.statusText}`);
	}
	return response.json();
}

export async function fetchCardById(id: number): Promise<{ data: YGOCard[] }> {
	const response = await fetch(`${API_BASE_URL}/cardinfo.php?id=${id}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch card: ${response.statusText}`);
	}
	return response.json();
}

export async function fetchCardsByName(name: string): Promise<{ data: YGOCard[] }> {
	const response = await fetch(`${API_BASE_URL}/cardinfo.php?fname=${encodeURIComponent(name)}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch cards: ${response.statusText}`);
	}
	return response.json();
}

export async function fetchCardsByArchetype(archetype: string, page = 1, pageSize = 100): Promise<YGOApiResponse> {
	const response = await fetch(
		`${API_BASE_URL}/cardinfo.php?archetype=${encodeURIComponent(archetype)}&num=${pageSize}&offset=${(page - 1) * pageSize}`
	);
	if (!response.ok) {
		throw new Error(`Failed to fetch archetype cards: ${response.statusText}`);
	}
	return response.json();
}

export async function fetchCardTypes(): Promise<string[]> {
	const response = await fetch(`${API_BASE_URL}/typeinfo.php`);
	if (!response.ok) {
		throw new Error(`Failed to fetch types: ${response.statusText}`);
	}
	return response.json();
}

export async function fetchArchetypes(): Promise<string[]> {
	const response = await fetch(`${API_BASE_URL}/archetypesinfo.php`);
	if (!response.ok) {
		throw new Error(`Failed to fetch archetypes: ${response.statusText}`);
	}
	return response.json();
}

export async function fetchAttributes(): Promise<string[]> {
	const response = await fetch(`${API_BASE_URL}/attributeinfo.php`);
	if (!response.ok) {
		throw new Error(`Failed to fetch attributes: ${response.statusText}`);
	}
	return response.json();
}

export async function fetchRaces(): Promise<string[]> {
	const response = await fetch(`${API_BASE_URL}/raceinfo.php`);
	if (!response.ok) {
		throw new Error(`Failed to fetch races: ${response.statusText}`);
	}
	return response.json();
}

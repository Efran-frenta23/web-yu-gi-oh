declare namespace App {
	interface Locals {
		// Add your locals here
	}
	interface PageData {
		// Add your page data here
	}
	interface PageError {
		// Add your page errors here
	}
	interface Error {
		message: string;
		code?: string;
	}
}

import {writable} from "svelte/store";

export const stopInfo = writable({
	name: "Loading stop information...",
	code: ""
});
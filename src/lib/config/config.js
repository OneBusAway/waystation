import fs from 'fs';

const PATH = 'src/lib/config/settings.json';

export function getConfig() {
	const fileData = fs.readFileSync(PATH, 'utf-8');
	return JSON.parse(fileData);
}

export function saveConfig(file) {
	const writeData = JSON.stringify(file, null, 2);
	fs.writeFileSync(PATH, writeData);
}

export const startTime = Date.now();

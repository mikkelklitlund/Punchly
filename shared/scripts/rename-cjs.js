// scripts/rename-cjs.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cjsDir = path.resolve(__dirname, '../dist/cjs')

function renameJsToCjs(dir) {
	const files = fs.readdirSync(dir)

	files.forEach((file) => {
		const filePath = path.join(dir, file)
		const stat = fs.statSync(filePath)

		if (stat.isDirectory()) {
			renameJsToCjs(filePath)
		} else if (file.endsWith('.js')) {
			const newPath = filePath.replace(/\.js$/, '.cjs')
			fs.renameSync(filePath, newPath)
		}
	})
}

renameJsToCjs(cjsDir)
console.log('Successfully renamed .js files to .cjs in the dist/cjs directory')

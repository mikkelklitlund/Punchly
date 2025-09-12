import { writeFileSync } from 'node:fs'
import path from 'node:path'
import swaggerJSDoc from 'swagger-jsdoc'
import { swaggerOptions } from '../src/swaggerOptions.ts'

const spec = swaggerJSDoc(swaggerOptions)
const outPath = path.join(process.cwd(), 'dist', 'openapi.json')
writeFileSync(outPath, JSON.stringify(spec, null, 2))
console.log('Wrote', outPath)

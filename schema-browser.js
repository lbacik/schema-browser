const http = require('http')
const fs = require('fs')
const $RefParser = require("@apidevtools/json-schema-ref-parser");
const serveIndex = require('serve-index')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')

const PORT = process.env.PORT || 3030
const servePath = process.env.SCHEMA_PATH || process.argv[2]
const EXTENSION = process.env.EXTENSION || '.schema.json'

if (!servePath) {
  console.error('No schema path provided')
  process.exit(1)
}

let htmlTemplateFile

try {
  htmlTemplateFile = fs.readFileSync('./template.html', 'utf8');
} catch (err) {
  console.error(err);
}

const dereferenceSchema = (req, response) => {

  const schemafile = servePath + req.url
  console.log('dereferenceSchema', schemafile)

  $RefParser.dereference(schemafile, (err, schema) => {
    let html
    if (err) {
      html = err.message
    } else {
      html = htmlTemplateFile.replace(/JSON_SCHEMA/g, JSON.stringify(schema))
    }

    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(html);
  })
}

const index = serveIndex(servePath, {'icons': true})
const serve = serveStatic(servePath)

const server = http.createServer((req, res) => {

  if (req.url.endsWith(EXTENSION)) {
    dereferenceSchema(req, res)
    return
  }

  const done = finalhandler(req, res)

  serve(req, res, function onNext(err) {
    if (err) return done(err)
    index(req, res, done)
  })

}).listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
})


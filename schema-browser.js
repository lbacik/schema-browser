const http = require('http')
const fs = require('fs')
const $RefParser = require("@apidevtools/json-schema-ref-parser");
const serveIndex = require('serve-index')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')

const PORT = process.env.PORT || 3030
const servePath = process.env.SCHEMA_PATH || process.argv[2]
const EXTENSION = process.env.EXTENSION || '.schema.json'
const DEREFERENCE = process.env.DEREFERENCE || true

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

const readSchema = (req, response) => {

  const schemafile = servePath + req.url
  console.log('schema', schemafile)

  if (DEREFERENCE === true) {
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
  } else {
    const schema = fs.readFileSync(schemafile, 'utf8')

    console.log(schema)

    const html = htmlTemplateFile.replace(/JSON_SCHEMA/g, JSON.stringify(JSON.parse(schema)))
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(html);
  }
}

const index = serveIndex(servePath, {'icons': true})
const serve = serveStatic(servePath)

const server = http.createServer((req, res) => {

  if (req.url.endsWith(EXTENSION)) {
    readSchema(req, res)
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

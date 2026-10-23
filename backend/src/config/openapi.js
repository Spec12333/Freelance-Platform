// Loads backend/openapi.yaml once at startup. The YAML file is the detailed API
// reference served at /api/docs; docs/API.md stays the short overview.
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const SPEC_PATH = path.join(__dirname, '..', '..', 'openapi.yaml');

const openapiSpec = YAML.parse(fs.readFileSync(SPEC_PATH, 'utf8'));

module.exports = { openapiSpec };

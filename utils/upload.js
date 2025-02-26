const fs = require('fs').promises;

async function initializeUploadsDirectory() {
  await fs.mkdir('./uploads', { recursive: true });
}

module.exports = {
  initializeUploadsDirectory
};
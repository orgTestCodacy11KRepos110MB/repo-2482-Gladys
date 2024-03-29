if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // eslint-disable-line
}

const { lstatSync, readdirSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');
const logger = require('../utils/logger');

const SERVICE_PATH = join(__dirname, '../services');

const isDirectory = (source) => lstatSync(source).isDirectory();
const getDirectories = (source) =>
  readdirSync(source)
    .map((name) => join(source, name))
    .filter(isDirectory);

const directories = getDirectories(SERVICE_PATH);

directories.forEach((directory) => {
  logger.info(`Installing dependencies in folder ${directory}`);
  try {
    execSync(`cd ${directory} && npm install --unsafe-perm`, {
      maxBuffer: 10 * 1000 * 1024, // 10Mb of logs allowed for module with big npm install
    });
  } catch (e) {
    logger.warn(e);

    const silentFail = process.env.INSTALL_SERVICES_SILENT_FAIL === 'true';
    if (!silentFail) {
      throw e;
    }
  }
});

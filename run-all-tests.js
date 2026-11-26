const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

function waitForPort(port, host = '127.0.0.1', timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function tryConnect() {
      const socket = net.createConnection({ port, host });
      socket.once('connect', () => {
        socket.end();
        resolve(true);
      });
      socket.once('error', (err) => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for port ${port}: ${err.message}`));
        } else {
          setTimeout(tryConnect, 400);
        }
      });
    }
    tryConnect();
  });
}

async function main() {
  console.log('[Test Runner] Checking if MongoDB is listening on port 27017...');
  let mongoChild = null;

  try {
    await waitForPort(27017, '127.0.0.1', 800);
    console.log('[Test Runner] MongoDB is already active and listening.');
  } catch (e) {
    console.log('[Test Runner] Launching mongod process...');
    const mongoExe = 'C:\\Program Files\\MongoDB\\Server\\9.0\\bin\\mongod.exe';
    const dbPath = path.join(__dirname, 'data', 'db');
    const lockFile = path.join(dbPath, 'mongod.lock');

    if (fs.existsSync(lockFile)) {
      try {
        fs.unlinkSync(lockFile);
        console.log('[Test Runner] Unlinked stale mongod.lock file.');
      } catch (err) {}
    }

    mongoChild = spawn(mongoExe, [
      '--dbpath', dbPath,
      '--bind_ip', '127.0.0.1',
      '--port', '27017'
    ]);

    mongoChild.stdout.on('data', (d) => {
      const line = d.toString();
      if (line.includes('Waiting for connections') || line.includes('error') || line.includes('shutting down')) {
        console.log('[mongod]', line.trim());
      }
    });

    mongoChild.stderr.on('data', (d) => {
      console.error('[mongod stderr]', d.toString().trim());
    });

    mongoChild.on('exit', (code) => {
      console.log(`[mongod] Exited with code ${code}`);
    });

    await waitForPort(27017, '127.0.0.1', 15000);
    console.log('[Test Runner] MongoDB is ready on port 27017.');
  }

  // Start backend server in-process
  console.log('[Test Runner] Starting backend server in-process...');
  require('./server.js');

  // Wait for server to start listening on port 5000
  await waitForPort(5000, '127.0.0.1', 8000);
  console.log('[Test Runner] Server is listening on port 5000.');

  // Give Mongoose a moment to complete handshake and index sync
  await new Promise(r => setTimeout(r, 2000));

  // Run the test suite
  console.log('[Test Runner] Launching test suite...');
  const testSuite = spawn(process.execPath, [path.join(__dirname, 'test-suite.js')], {
    stdio: 'inherit',
    cwd: __dirname
  });

  testSuite.on('close', (code) => {
    console.log(`\n[Test Runner] Test suite completed with exit code ${code}.`);
    if (mongoChild) {
      console.log('[Test Runner] Terminating temporary MongoDB process...');
      mongoChild.kill();
    }
    process.exit(code);
  });
}

main().catch(err => {
  console.error('[Test Runner Error]:', err);
  process.exit(1);
});

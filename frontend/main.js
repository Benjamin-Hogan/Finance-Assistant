const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const { spawn } = require("child_process");
let pythonProcess = null;

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the index.html from the React app
  const startUrl =
    process.env.ELECTRON_START_URL ||
    url.format({
      pathname: path.join(__dirname, "./build/index.html"),
      protocol: "file:",
      slashes: true,
    });

  mainWindow.loadURL(startUrl);

  // Start Python backend
  startPythonBackend();

  // Open the DevTools in development mode
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on("closed", function () {
    // Dereference the window object
    mainWindow = null;

    // Kill the Python backend process
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }
  });
}

function startPythonBackend() {
  // Determine the path to the Python backend
  const pythonPath =
    process.env.NODE_ENV === "development"
      ? "../backend/run.py"
      : path.join(process.resourcesPath, "backend/run.py");

  // Start the Python process
  pythonProcess = spawn("python", [pythonPath]);

  pythonProcess.stdout.on("data", (data) => {
    console.log(`Python stdout: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

// This method will be called when Electron has finished initialization
app.on("ready", createWindow);

// Quit when all windows are closed
app.on("window-all-closed", function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    if (pythonProcess) {
      pythonProcess.kill();
    }
    app.quit();
  }
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle IPC messages from the renderer process
ipcMain.on("restart-backend", () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  startPythonBackend();
});

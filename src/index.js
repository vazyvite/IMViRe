const electron = require("electron");
const appElectron = electron.app;
const BrowserWindow = electron.BrowserWindow;


let mainWindow;

/**
 * Création de la fenêtre de l"application.
 * @author JJACQUES
 */
function createWindow () {
	mainWindow = new BrowserWindow({width: 1800, height: 1200});
	mainWindow.loadURL(`file://${__dirname}/index.html`);
	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}

appElectron.on("ready", createWindow);
appElectron.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		appElectron.quit();
	}
});
appElectron.on("activate", () => {
	if (mainWindow === null) {
		createWindow();
	}
});
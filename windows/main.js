// Dựng Video – bản cài cho Windows (Electron)
const { app, BrowserWindow, session, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0e1014',
    title: 'Dựng Video',
    icon: path.join(__dirname, 'app', 'icon-512.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true }
  });

  // Cho phép micro (thu âm). Các quyền khác bị từ chối.
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    callback(permission === 'media');
  });
  session.defaultSession.setPermissionCheckHandler((wc, permission) => permission === 'media');

  // Khi lưu tệp: hiện hộp thoại "Lưu thành…" để chọn nơi lưu.
  session.defaultSession.on('will-download', (event, item) => {
    item.setSaveDialogOptions({ title: 'Lưu tệp', defaultPath: path.join(app.getPath('downloads'), item.getFilename()) });
  });

  // Liên kết ra ngoài mở bằng trình duyệt mặc định.
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); shell.openExternal(url); }
  });

  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

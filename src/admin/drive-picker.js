function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => { script.remove(); reject(new Error('Không tải được bộ chọn Google Drive.')); };
    document.head.append(script);
  });
}

let libraries;
export function prepareDrivePicker() {
  libraries ||= Promise.all([
    loadScript('https://accounts.google.com/gsi/client'),
    loadScript('https://apis.google.com/js/api.js').then(() => new Promise((resolve, reject) => {
      gapi.load('picker', {
        callback: resolve,
        onerror: () => reject(new Error('Không tải được bộ chọn Google Drive.')),
        timeout: 15_000,
        ontimeout: () => reject(new Error('Kết nối bộ chọn Google Drive quá thời gian.')),
      });
    })),
  ]).catch((err) => { libraries = null; throw err; });
  return libraries;
}

export function selectDrivePhotos(config) {
  return new Promise((resolve, reject) => {
    const reportError = () => reject(new Error('Không kết nối được Google Drive. Hãy mở lại bộ chọn.'));
    const client = google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      include_granted_scopes: false,
      error_callback: reportError,
      callback: (response) => {
        if (response.error || !response.access_token) return reportError();
        try {
          const picker = google.picker;
          const view = new picker.DocsView()
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false)
            .setMimeTypes('image/jpeg,image/png,image/webp');
          new picker.PickerBuilder()
            .addView(view)
            .enableFeature(picker.Feature.MULTISELECT_ENABLED)
            .setOAuthToken(response.access_token)
            .setDeveloperKey(config.developerKey)
            .setAppId(config.appId)
            .setOrigin(window.location.origin)
            .setLocale('vi')
            .setCallback((event) => {
              if (event.action === picker.Action.CANCEL) return resolve(null);
              if (event.action === picker.Action.PICKED) {
                resolve({ token: response.access_token, files: event.docs.map(({ id, name, resourceKey }) => ({ id, name, resourceKey })) });
              }
              if (event.action === picker.Action.ERROR) reportError();
            })
            .build().setVisible(true);
        } catch { reportError(); }
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
}

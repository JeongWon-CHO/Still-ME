const { withAppDelegate } = require('expo/config-plugins');

module.exports = (config) =>
  withAppDelegate(config, (updated) => {
    const delegate = updated.modResults;
    const marker = '    let diaryFileManager = FileManager.default';
    if (delegate.contents.includes(marker)) return updated;

    const anchor = ') -> Bool {';
    if (delegate.language !== 'swift' || !delegate.contents.includes(anchor)) {
      throw new Error('Unable to configure iOS diary backup exclusion');
    }

    delegate.contents = delegate.contents.replace(
      anchor,
      `${anchor}
${marker}
    do {
      var directory = try diaryFileManager.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
        .appendingPathComponent("SQLite", isDirectory: true)
      try diaryFileManager.createDirectory(at: directory, withIntermediateDirectories: true, attributes: nil)
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try directory.setResourceValues(values)
    } catch {
      NSLog("Could not exclude the local diary database from backup: %@", String(describing: error))
    }
`,
    );
    return updated;
  });

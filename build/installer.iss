[Setup]
AppName=灵犀 API Client
AppVersion=1.0.0
AppPublisher=灵犀
DefaultDirName={autopf}\Lingxi
DefaultGroupName=灵犀 API Client
OutputDir=..\installer
OutputBaseFilename=Lingxi-1.0.0-Setup
Compression=lzma2
SolidCompression=yes
UninstallDisplayIcon={app}\Lingxi.exe

[Files]
Source: "dist\Lingxi\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\灵犀 API Client"; Filename: "{app}\Lingxi.exe"
Name: "{commondesktop}\灵犀 API Client"; Filename: "{app}\Lingxi.exe"

[Run]
Filename: "{app}\Lingxi.exe"; Description: "启动灵犀 API Client"; Flags: shellexec nowait postinstall skipifsilent

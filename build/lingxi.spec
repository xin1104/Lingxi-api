# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ['backend/run_frozen.py'],
    pathex=['backend'],
    binaries=[],
    datas=[
        ('backend/app', 'app'),
        ('frontend/dist', 'frontend/dist'),
    ],
    hiddenimports=[
        'sqlmodel',
        'pydantic',
        'httpx',
        'yaml',
        'aiosqlite',
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops.auto',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets.auto',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'PIL', 'numpy', 'scipy', 'pandas'],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='Lingxi',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='build/lingxi.ico',
)

# 默认输出到 dist/Lingxi/ 目录

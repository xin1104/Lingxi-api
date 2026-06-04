"""一键打包灵犀 API Client"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent


def step(msg):
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}")


def main():
    os.chdir(PROJECT_DIR)

    # 1. 安装依赖
    step("安装后端依赖")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"], check=True)
    subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)

    # 2. 构建前端
    step("构建前端")
    subprocess.run(["npm", "install"], cwd="frontend", check=True)
    subprocess.run(["npm", "run", "build"], cwd="frontend", check=True)

    # 3. 清理旧构建
    step("清理旧构建")
    for d in ["dist", "build/build"]:
        shutil.rmtree(d, ignore_errors=True)

    # 4. 运行 PyInstaller
    step("运行 PyInstaller")
    subprocess.run([
        "pyinstaller",
        "--clean",
        "--noconfirm",
        "build/lingxi.spec",
    ], check=True)

    # 5. 检查结果
    dist_dir = PROJECT_DIR / "dist" / "Lingxi"
    if dist_dir.exists():
        exe_size = sum(f.stat().st_size for f in dist_dir.rglob("*") if f.is_file())
        print(f"\n✅ 打包完成！")
        print(f"   输出目录: {dist_dir}")
        print(f"   总大小: {exe_size / 1024 / 1024:.1f} MB")
    else:
        print(f"\n❌ 打包失败，未找到 {dist_dir}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""灵犀 API Client — E2E 测试启动脚本

启动后端 + 前端开发服务器，运行 Playwright E2E 测试，退出时清理进程。
"""

import sys
import subprocess
import time
import signal
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"

processes = []


def cleanup():
    """清理所有子进程"""
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=5)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass


def main():
    # 注册退出清理
    signal.signal(signal.SIGINT, lambda s, f: cleanup())
    signal.signal(signal.SIGTERM, lambda s, f: cleanup())

    print("灵犀 API Client — E2E 测试")
    print("=" * 50)

    # 1. 启动后端
    print("\n📦 启动后端...")
    python = BACKEND / ".venv" / "bin" / "python"
    if not python.exists():
        print("❌ 未找到虚拟环境，请先在 backend/ 目录创建 .venv")
        sys.exit(1)

    backend_proc = subprocess.Popen(
        [str(python), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "17321"],
        cwd=BACKEND,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    processes.append(backend_proc)
    time.sleep(2)

    # 检查后端是否启动
    if backend_proc.poll() is not None:
        print("❌ 后端启动失败")
        stderr = backend_proc.stderr.read().decode() if backend_proc.stderr else ""
        print(stderr[:500])
        cleanup()
        sys.exit(1)

    print("✅ 后端已启动 (端口 17321)")

    # 2. 启动前端
    print("\n🎨 启动前端开发服务器...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev", "--", "--host", "127.0.0.1"],
        cwd=FRONTEND,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    processes.append(frontend_proc)
    time.sleep(5)

    print("✅ 前端开发服务器已启动")

    # 3. 运行 E2E 测试
    print("\n🧪 运行 Playwright E2E 测试...")
    try:
        result = subprocess.run(
            ["npx", "playwright", "test"],
            cwd=FRONTEND,
            timeout=120,
        )
        if result.returncode == 0:
            print("✅ E2E 测试全部通过！")
        else:
            print("❌ E2E 测试未通过")
    except subprocess.TimeoutExpired:
        print("❌ E2E 测试超时")
    except FileNotFoundError:
        print("❌ 未找到 Playwright，请先在 frontend 执行 npx playwright install")
    finally:
        cleanup()

    print("\n✅ E2E 测试完成")


if __name__ == "__main__":
    main()

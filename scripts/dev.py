"""灵犀 API Client 一键启动开发环境"""

import subprocess
import sys
import os
import time
import signal
import platform


def check_command(cmd: str, name: str) -> bool:
    """检查命令是否存在"""
    try:
        if platform.system() == "Windows":
            subprocess.run(["where", cmd], capture_output=True, check=True)
        else:
            subprocess.run(["which", cmd], capture_output=True, check=True)
        return True
    except subprocess.CalledProcessError:
        return False


def main():
    """启动后端和前端"""
    print("=" * 50)
    print("灵犀 API Client 开发环境启动")
    print("=" * 50)

    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    # 检查 Python
    print(f"\nPython: {sys.version.split()[0]}")

    # 检查 Node.js
    if not check_command("node", "Node.js"):
        print("\n⚠ 未检测到 Node.js，前端无法启动")
        print("  请安装 Node.js 18+: https://nodejs.org/")
        print("  安装后执行: cd frontend && npm install && npm run dev")
        print("\n将仅启动后端服务...")
    else:
        # 检查前端依赖
        if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
            print("\n前端依赖未安装，正在安装...")
            try:
                subprocess.run(
                    ["npm", "install"],
                    cwd=frontend_dir,
                    check=True,
                    shell=(platform.system() == "Windows"),
                )
                print("前端依赖安装完成")
            except subprocess.CalledProcessError:
                print("\n⚠ 前端依赖安装失败，请手动执行:")
                print("  cd frontend && npm install")

    processes = []

    try:
        # 启动后端
        print("\n[1/2] 启动后端服务...")
        backend_env = os.environ.copy()
        backend_env["PYTHONPATH"] = backend_dir

        backend_process = subprocess.Popen(
            [
                sys.executable, "-m", "uvicorn", "app.main:app",
                "--reload", "--host", "127.0.0.1", "--port", "17321",
            ],
            cwd=backend_dir,
            env=backend_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        processes.append(("后端", backend_process))
        print("后端启动中... http://127.0.0.1:17321")

        # 等待后端启动
        time.sleep(3)

        # 启动前端
        if check_command("node", "Node.js") and os.path.exists(
            os.path.join(frontend_dir, "node_modules")
        ):
            print("\n[2/2] 启动前端服务...")
            frontend_process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                shell=(platform.system() == "Windows"),
            )
            processes.append(("前端", frontend_process))
            print("前端启动中... http://localhost:5173")
        else:
            print("\n[2/2] 跳过前端启动（缺少 Node.js 或依赖）")

        print("\n" + "=" * 50)
        print("开发环境已启动！")
        print(f"- 后端: http://127.0.0.1:17321")
        if len(processes) > 1:
            print(f"- 前端: http://localhost:5173")
        print(f"- API 文档: http://127.0.0.1:17321/docs")
        print("=" * 50)
        print("\n按 Ctrl+C 停止所有服务\n")

        # 等待进程结束
        for name, process in processes:
            process.wait()

    except KeyboardInterrupt:
        print("\n正在停止服务...")
        for name, process in processes:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            print(f"{name} 已停止")
        print("开发环境已关闭")


if __name__ == "__main__":
    main()

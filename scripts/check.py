#!/usr/bin/env python3
"""灵犀 API Client — 全面健康检查脚本"""

import sys
import subprocess
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"

CHECK_MARK = "✅"
CROSS_MARK = "❌"


def run(cmd, cwd, desc, extra_env=None):
    """运行命令并返回是否成功"""
    print(f"  → {desc}...", end=" ", flush=True)
    try:
        env = os.environ.copy()
        if extra_env:
            env.update(extra_env)
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=300, env=env)
        if result.returncode == 0:
            print(f"{CHECK_MARK} 通过")
            return True
        else:
            print(f"{CROSS_MARK} 失败")
            stderr = result.stderr.strip()
            if stderr:
                for line in stderr.split("\n"):
                    if "error" in line.lower() or "fail" in line.lower() or "FAIL" in line:
                        print(f"      {line[:120]}")
            return False
    except subprocess.TimeoutExpired:
        print(f"{CROSS_MARK} 超时")
        return False
    except FileNotFoundError as e:
        print(f"{CROSS_MARK} 命令不存在: {e}")
        return False


def check_backend() -> bool:
    """后端检查"""
    print("\n📦 后端检查")
    python = BACKEND / ".venv" / "bin" / "python"
    if not python.exists():
        print(f"  {CROSS_MARK} 未找到虚拟环境，请先在 backend/ 目录创建 .venv")
        return False

    ok = True
    ok &= run([str(python), "-m", "ruff", "check", "."], BACKEND, "Ruff Lint")
    ok &= run([str(python), "-m", "pytest", "-q"], BACKEND, "Pytest")
    return ok


def check_frontend() -> bool:
    """前端检查"""
    print("\n🎨 前端检查")
    npm = "npm"
    ok = True
    ok &= run([npm, "run", "test"], FRONTEND, "Vitest 测试")
    ok &= run([npm, "run", "typecheck"], FRONTEND, "TypeScript 类型检查")
    ok &= run([npm, "run", "build"], FRONTEND, "Vite 构建",
              extra_env={"NODE_OPTIONS": "--max-old-space-size=4096"})
    return ok


def check_readme() -> bool:
    """README 检查"""
    print("\n📄 文档检查")
    readme = ROOT / "README.md"
    if readme.exists():
        content = readme.read_text()
        print(f"  → README.md ({len(content)} 字符)... {CHECK_MARK} 存在")
        return True
    else:
        print(f"  → README.md... {CROSS_MARK} 不存在")
        return False


def check_ci() -> bool:
    """CI 配置检查"""
    print("\n🚀 CI 配置检查")
    workflows_dir = ROOT / ".github" / "workflows"
    if workflows_dir.exists():
        files = list(workflows_dir.glob("*.yml"))
        if files:
            print(f"  → 发现 {len(files)} 个 workflow: {[f.name for f in files]} {CHECK_MARK}")
            return True
        else:
            print(f"  → 未发现 CI workflow {CROSS_MARK}")
            return False
    else:
        print(f"  → .github/workflows 目录不存在 {CROSS_MARK}")
        return False


def check_e2e() -> bool:
    """E2E 检查"""
    print("\n🧪 E2E 检查")

    # 检查 Playwright 是否安装
    try:
        result = subprocess.run(
            ["npx", "playwright", "--version"],
            cwd=FRONTEND, capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            print(f"  {CROSS_MARK} Playwright 未安装")
            print("     请在 frontend 目录执行 npx playwright install")
            return False
        print(f"  → Playwright {result.stdout.strip()} {CHECK_MARK}")
    except FileNotFoundError:
        print(f"  {CROSS_MARK} npx 不可用")
        return False

    # 运行 E2E 测试
    try:
        e2e_script = ROOT / "scripts" / "e2e.py"
        if e2e_script.exists():
            print("  → 运行 scripts/e2e.py...")
            result = subprocess.run(
                [sys.executable, str(e2e_script)],
                cwd=ROOT, capture_output=True, text=True, timeout=300,
            )
            if result.returncode == 0:
                print(f"  {CHECK_MARK} E2E 通过")
                return True
            else:
                print(f"  {CROSS_MARK} E2E 失败")
                print(f"      {result.stderr[-300:] if result.stderr else result.stdout[-300:]}")
                return False
        else:
            print(f"  → scripts/e2e.py 不存在，跳过完整 E2E")
            return True
    except subprocess.TimeoutExpired:
        print(f"  {CROSS_MARK} E2E 超时")
        return False
    except Exception as e:
        print(f"  {CROSS_MARK} E2E 异常: {e}")
        return False


def main():
    import argparse
    parser = argparse.ArgumentParser(description="灵犀 API Client 健康检查")
    parser.add_argument("--e2e", action="store_true", help="同时运行 E2E 测试")
    args = parser.parse_args()

    print("=" * 50)
    print("灵犀 API Client — 全面健康检查")
    print("=" * 50)

    results = {}

    results["后端"] = check_backend()
    results["前端"] = check_frontend()
    results["文档"] = check_readme()
    results["CI"] = check_ci()

    if args.e2e:
        results["E2E"] = check_e2e()

    # 总结
    print("\n" + "=" * 50)
    print("检查总结")
    print("=" * 50)
    for name, ok in results.items():
        print(f"  {name}: {CHECK_MARK if ok else CROSS_MARK}")

    all_ok = all(results.values())
    if all_ok:
        print(f"\n{CHECK_MARK} 所有检查通过！")
    else:
        print(f"\n{CROSS_MARK} 部分检查未通过，请查看上方详细信息。")
        sys.exit(1)


if __name__ == "__main__":
    main()

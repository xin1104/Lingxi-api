"""Tests 脚本执行引擎 - 后端执行类 JavaScript DSL

在受限沙箱中执行 pm.test/pm.expect/pm.response/pm.environment 语法。
使用 exec() + 受限 globals（__builtins__ 设为空字典）防止沙箱逃逸。
"""


class ExpectChain:
    """链式断言"""

    def __init__(self, value):
        self.value = value

    def toBe(self, expected) -> None:
        """严格相等断言"""
        if self.value != expected:
            raise AssertionError(f"期望 {expected!r}，实际 {self.value!r}")

    def toContain(self, substring) -> None:
        """字符串包含断言"""
        actual_str = str(self.value)
        if substring not in actual_str:
            raise AssertionError(f"期望包含 {substring!r}，实际 {actual_str!r}")

    def toHaveStatus(self, code) -> None:
        """状态码断言"""
        actual = self.value
        if isinstance(actual, dict):
            actual = actual.get("status_code", 0)
        if int(actual) != int(code):
            raise AssertionError(f"期望状态码 {code}，实际 {actual}")

    def toHaveHeader(self, name, value) -> None:
        """响应头断言"""
        headers = self.value
        if isinstance(headers, dict):
            actual = headers.get(name, headers.get(name.lower(), ""))
        else:
            actual = ""
        if str(actual) != str(value):
            raise AssertionError(f"期望响应头 {name}={value!r}，实际 {actual!r}")

    def toBeJson(self) -> None:
        """合法 JSON 断言"""
        import json
        val = self.value
        if isinstance(val, dict):
            try:
                json.dumps(val)
                return
            except Exception:
                pass
        if isinstance(val, str):
            try:
                json.loads(val)
                return
            except json.JSONDecodeError:
                pass
        raise AssertionError(f"不是合法的 JSON: {val!r}")

    def toBeLessThan(self, n) -> None:
        """小于断言"""
        if not (float(self.value) < float(n)):
            raise AssertionError(f"期望小于 {n}，实际 {self.value}")


class PmWrapper:
    """pm.response 对象 — 提供对响应数据的只读访问"""

    def __init__(self, response):
        self._response = response

    @property
    def status(self):
        return self._response.get("status_code", 0)

    @property
    def headers(self):
        return self._response.get("headers", {})

    @property
    def body(self):
        return self._response.get("body", "")

    @property
    def time(self):
        return self._response.get("duration", 0)

    def json(self):
        import json
        body = self._response.get("body", "")
        if isinstance(body, dict):
            return body
        if isinstance(body, str):
            try:
                return json.loads(body)
            except json.JSONDecodeError:
                return body
        return body


class PmEnvironment:
    """pm.environment 对象 — 读写环境变量"""

    def __init__(self, env_vars):
        self._env = env_vars

    def get(self, key):
        return self._env.get(key)

    def set(self, key, value):
        self._env[key] = str(value)


class PmObject:
    """提供给脚本的 pm 对象"""

    def __init__(self, response: dict, env_vars: dict, results_list: list):
        self._response = response
        self._env_vars = env_vars
        self._results = results_list
        self.response = PmWrapper(response)
        self.environment = PmEnvironment(env_vars)

    def test(self, name: str, fn) -> None:
        """执行测试，捕获异常"""
        import time
        start = time.time()
        try:
            fn()
            self._results.append({
                "name": name,
                "passed": True,
                "message": "",
                "expected": None,
                "actual": None,
                "duration": int((time.time() - start) * 1000),
            })
        except AssertionError as e:
            self._results.append({
                "name": name,
                "passed": False,
                "message": str(e),
                "expected": None,
                "actual": None,
                "duration": int((time.time() - start) * 1000),
            })
        except Exception as e:
            self._results.append({
                "name": name,
                "passed": False,
                "message": f"脚本异常: {e}",
                "expected": None,
                "actual": None,
                "duration": int((time.time() - start) * 1000),
            })

    def expect(self, value):
        """返回断言链"""
        return ExpectChain(value)


class TestRunner:
    """在后端执行 Tests 脚本"""

    def __init__(self, response: dict, env_vars: dict = None):
        self.response = response
        self.env_vars = env_vars or {}

    def run(self, script: str) -> list[dict]:
        """执行测试脚本，返回测试结果列表"""
        if not script or not script.strip():
            return []

        results: list[dict] = []
        pm = PmObject(self.response, self.env_vars, results)

        # 构建受限沙箱
        sandbox_globals = {
            "pm": pm,
            "__builtins__": {},
        }

        try:
            exec(script, sandbox_globals)
        except SyntaxError as e:
            results.append({
                "name": "语法错误",
                "passed": False,
                "message": f"脚本语法错误: {e}",
                "expected": None,
                "actual": None,
                "duration": 0,
            })
        except Exception as e:
            results.append({
                "name": "脚本执行错误",
                "passed": False,
                "message": str(e),
                "expected": None,
                "actual": None,
                "duration": 0,
            })

        return results

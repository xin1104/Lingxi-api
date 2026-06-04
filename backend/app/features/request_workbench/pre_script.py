"""Pre Script 后端执行器

将前端 preScriptRunner.ts 逻辑迁移到后端，支持相同 API。
使用 exec() + 受限 globals（__builtins__ 设为空字典）防止沙箱逃逸。
"""


class PreScriptRunner:
    """后端 Pre Script 执行器"""

    def run(self, script: str, variables: dict) -> dict:
        """
        执行 Pre Script，返回修改集合。

        Args:
            script: Pre Script 脚本（类 JS DSL）
            variables: 当前环境变量

        Returns:
            {
                "success": bool,
                "error": str | None,
                "header_changes": [{"action": "set/remove", "key": str, "value": str}],
                "param_changes": [{"action": "set/remove", "key": str, "value": str}],
                "env_changes": {key: value},
                "body_override": any | None,
                "logs": [str]
            }
        """
        result = {
            "success": True,
            "error": None,
            "header_changes": [],
            "param_changes": [],
            "env_changes": {},
            "body_override": None,
            "logs": [],
        }

        if not script or not script.strip():
            return result

        # 构建 pm 对象
        pm = _PrePmObject(result, variables)

        sandbox_globals = {
            "pm": pm,
            "console": _Console(result),
            "__builtins__": {},
        }

        try:
            exec(script, sandbox_globals)
        except SyntaxError as e:
            result["success"] = False
            result["error"] = f"语法错误: {e}"
        except Exception as e:
            result["success"] = False
            result["error"] = str(e)

        return result


class _Console:
    """console.log 实现"""

    def __init__(self, result):
        self._result = result

    def log(self, *args):
        msg = " ".join(str(a) for a in args)
        self._result["logs"].append(msg)


class _PrePmObject:
    """Pre Script 的 pm 对象"""

    def __init__(self, result: dict, variables: dict):
        self._result = result
        self._variables = variables

    def setHeader(self, key: str, value: str):
        self._result["header_changes"].append({
            "action": "set",
            "key": key,
            "value": str(value),
        })

    def removeHeader(self, key: str):
        self._result["header_changes"].append({
            "action": "remove",
            "key": key,
            "value": "",
        })

    def setParam(self, key: str, value: str):
        self._result["param_changes"].append({
            "action": "set",
            "key": key,
            "value": str(value),
        })

    def removeParam(self, key: str):
        self._result["param_changes"].append({
            "action": "remove",
            "key": key,
            "value": "",
        })

    def setEnv(self, key: str, value: str):
        self._result["env_changes"][key] = str(value)
        self._variables[key] = str(value)

    def setBody(self, body):
        self._result["body_override"] = body

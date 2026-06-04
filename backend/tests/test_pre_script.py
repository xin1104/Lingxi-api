"""pre_script.py 单元测试"""

from app.features.request_workbench.pre_script import PreScriptRunner


class TestPreScriptRunner:
    """PreScriptRunner 核心测试"""

    def test_empty_script(self):
        """空脚本 → 无修改"""
        runner = PreScriptRunner()
        result = runner.run("", {})
        assert result["success"] is True
        assert result["header_changes"] == []
        assert result["param_changes"] == []
        assert result["body_override"] is None

    def test_set_header(self):
        """pm.setHeader"""
        runner = PreScriptRunner()
        result = runner.run(
            'pm.setHeader("Authorization", "Bearer token123")',
            {},
        )
        assert result["success"] is True
        assert len(result["header_changes"]) == 1
        assert result["header_changes"][0]["action"] == "set"
        assert result["header_changes"][0]["key"] == "Authorization"
        assert "Bearer" in result["header_changes"][0]["value"]

    def test_remove_header(self):
        """pm.removeHeader"""
        runner = PreScriptRunner()
        result = runner.run(
            'pm.removeHeader("X-Custom")',
            {},
        )
        assert result["success"] is True
        assert len(result["header_changes"]) == 1
        assert result["header_changes"][0]["action"] == "remove"

    def test_set_param(self):
        """pm.setParam"""
        runner = PreScriptRunner()
        result = runner.run(
            'pm.setParam("page", "1")',
            {},
        )
        assert result["success"] is True
        assert len(result["param_changes"]) == 1
        assert result["param_changes"][0]["action"] == "set"
        assert result["param_changes"][0]["key"] == "page"

    def test_remove_param(self):
        """pm.removeParam"""
        runner = PreScriptRunner()
        result = runner.run(
            'pm.removeParam("token")',
            {},
        )
        assert result["success"] is True
        assert len(result["param_changes"]) == 1
        assert result["param_changes"][0]["action"] == "remove"

    def test_set_env(self):
        """pm.setEnv"""
        runner = PreScriptRunner()
        result = runner.run(
            'pm.setEnv("token", "abc123")',
            {},
        )
        assert result["success"] is True
        assert result["env_changes"]["token"] == "abc123"

    def test_set_body(self):
        """pm.setBody"""
        runner = PreScriptRunner()
        result = runner.run(
            'pm.setBody({"key": "value"})',
            {},
        )
        assert result["success"] is True
        assert result["body_override"] == {"key": "value"}

    def test_console_log(self):
        """console.log"""
        runner = PreScriptRunner()
        result = runner.run(
            'console.log("hello", "world")',
            {},
        )
        assert result["success"] is True
        assert "hello world" in result["logs"]

    def test_multiple_operations(self):
        """多个操作"""
        runner = PreScriptRunner()
        result = runner.run("""
pm.setHeader("X-Trace", "trace-id")
pm.setEnv("request_id", "123")
console.log("done")
""", {})
        assert result["success"] is True
        assert len(result["header_changes"]) == 1
        assert result["env_changes"]["request_id"] == "123"
        assert len(result["logs"]) == 1

    def test_error_script(self):
        """脚本错误"""
        runner = PreScriptRunner()
        result = runner.run(
            'pm.undefinedFunction()',
            {},
        )
        assert result["success"] is False
        assert result["error"] is not None

    def test_syntax_error(self):
        """语法错误"""
        runner = PreScriptRunner()
        result = runner.run(
            'pm.setHeader("X", ',
            {},
        )
        assert result["success"] is False
        assert "语法" in result["error"] or result["error"] is not None

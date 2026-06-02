"""变量解析器测试"""

from app.features.request_workbench.variable_resolver import resolve_variables


def test_basic_variable_resolution():
    """测试基本变量替换"""
    variables = {"base_url": "http://localhost:8000"}
    text = "{{base_url}}/api/users"
    result = resolve_variables(text, variables)
    assert result == "http://localhost:8000/api/users"


def test_multiple_variables():
    """测试多个变量替换"""
    variables = {
        "host": "http://localhost",
        "port": "8000",
        "version": "v1",
    }
    text = "{{host}}:{{port}}/api/{{version}}/users"
    result = resolve_variables(text, variables)
    assert result == "http://localhost:8000/api/v1/users"


def test_builtin_timestamp():
    """测试内置时间戳变量"""
    text = "{{$timestamp}}"
    result = resolve_variables(text, {})
    assert result.isdigit()
    assert len(result) == 10  # Unix 时间戳


def test_builtin_uuid():
    """测试内置 UUID 变量"""
    text = "{{$uuid}}"
    result = resolve_variables(text, {})
    assert len(result) == 36  # UUID 格式
    assert result.count("-") == 4


def test_undefined_variable():
    """测试未定义变量保留原样"""
    text = "{{undefined_var}}"
    result = resolve_variables(text, {})
    assert result == "{{undefined_var}}"


def test_empty_text():
    """测试空文本"""
    assert resolve_variables("", {}) == ""
    assert resolve_variables(None, {}) is None


def test_no_variables():
    """测试没有变量的文本"""
    text = "http://example.com/api"
    result = resolve_variables(text, {})
    assert result == text

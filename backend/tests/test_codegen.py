"""代码生成服务测试"""

import pytest
from app.features.codegen.service import generate_code
from app.schemas import CodegenRequest


def test_generate_curl():
    """测试生成 cURL 代码"""
    request = CodegenRequest(
        method="POST",
        url="https://api.example.com/users",
        headers=[],
        language="curl",
    )
    result = generate_code(request)
    assert "curl" in result
    assert "POST" in result or "-X" in result


def test_generate_python():
    """测试生成 Python 代码"""
    request = CodegenRequest(
        method="GET",
        url="https://api.example.com/users",
        language="python",
    )
    result = generate_code(request)
    assert "import requests" in result
    assert "requests.get" in result


def test_generate_javascript():
    """测试生成 JavaScript 代码"""
    request = CodegenRequest(
        method="GET",
        url="https://api.example.com/users",
        language="javascript",
    )
    result = generate_code(request)
    assert "fetch" in result
    assert "then" in result


def test_generate_go():
    """测试生成 Go 代码"""
    request = CodegenRequest(
        method="GET",
        url="https://api.example.com/users",
        language="go",
    )
    result = generate_code(request)
    assert "package main" in result
    assert "http.NewRequest" in result


def test_generate_node():
    """测试生成 Node.js 代码"""
    request = CodegenRequest(
        method="GET",
        url="https://api.example.com/users",
        language="node",
    )
    result = generate_code(request)
    assert "axios" in result or "require" in result


def test_unsupported_language():
    """测试不支持的语言"""
    request = CodegenRequest(
        method="GET",
        url="https://api.example.com/users",
        language="rust",
    )
    with pytest.raises(ValueError):
        generate_code(request)


def test_codegen_with_headers():
    """测试带请求头的代码生成"""
    request = CodegenRequest(
        method="POST",
        url="https://api.example.com/data",
        headers=[{"key": "Content-Type", "value": "application/json", "enabled": True}],
        language="python",
    )
    result = generate_code(request)
    assert "Content-Type" in result

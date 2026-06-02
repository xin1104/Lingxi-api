"""cURL 解析器测试"""

from app.features.import_export.curl_parser import parse_curl, generate_curl
from app.schemas import SendRequestInput


def test_parse_get_request():
    """测试解析 GET 请求"""
    curl = "curl https://api.example.com/users"
    result = parse_curl(curl)
    assert result.method == "GET"
    assert result.url == "https://api.example.com/users"


def test_parse_post_json():
    """测试解析 POST JSON 请求"""
    curl = '''curl -X POST https://api.example.com/users -H "Content-Type: application/json" -d '{"name": "test"}' '''
    result = parse_curl(curl)
    assert result.method == "POST"
    assert result.url == "https://api.example.com/users"
    assert result.body.type == "json"


def test_parse_headers():
    """测试解析请求头"""
    curl = '''curl -H "Authorization: Bearer token123" -H "Accept: application/json" https://api.example.com'''
    result = parse_curl(curl)
    assert len(result.headers) == 2
    assert result.headers[0].key == "Authorization"
    assert result.headers[0].value == "Bearer token123"


def test_parse_query_params():
    """测试解析查询参数"""
    curl = "curl https://api.example.com/users?page=1&limit=10"
    result = parse_curl(curl)
    assert len(result.params) == 2


def test_generate_curl_get():
    """测试生成 GET 请求 cURL"""
    request = SendRequestInput(
        method="GET",
        url="https://api.example.com/users",
    )
    result = generate_curl(request)
    assert "curl" in result
    assert "https://api.example.com/users" in result


def test_generate_curl_post():
    """测试生成 POST 请求 cURL"""
    request = SendRequestInput(
        method="POST",
        url="https://api.example.com/users",
        headers=[],
        body={"type": "json", "json_data": {"name": "test"}},
    )
    result = generate_curl(request)
    assert "-X POST" in result
    assert "-d" in result
